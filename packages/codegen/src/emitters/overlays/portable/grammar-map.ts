import { byCodepoint, compositionOf, lineageOf } from '../../../bindings/vocabulary.ts';
import { grammarDisplayName, type GrammarName } from '../../../grammars.ts';
import { stringLiteral as q } from '../../../util/string-literal.ts';
import { textBuilt } from '@sittir/common/engine';
import type { PortableBuildArm, PortablePickTest } from '@sittir/types';
import type { NodeMap } from '../../../compiler/types.ts';
import { exactReadsOf, type ExactReads, type ExactSet, type ExactSlots } from './exact.ts';
import type { PortableTypedInput } from './typed.ts';

export const PORTABLE_MAP_FILE = 'portable-map.ts';

export const VOCABULARY_MODULE = '@sittir/types/vocabulary';

export const grammarMapName = (grammar: string): string => `${grammarDisplayName(grammar as GrammarName)}Map`;

export const unmappedName = (grammar: string, kind: string): string => `${grammar}:${kind}`;

export function unmappedKindsBlock(
	module: string,
	grammar: string,
	nodeMap: NodeMap,
	kinds: Iterable<string>
): string[] {
	const entries = [...new Set(kinds)].sort().flatMap((kind) => {
		const typeName = nodeMap.nodes.get(kind)?.typeName;
		return typeName === undefined ? [] : [`\t\treadonly ${q(unmappedName(grammar, kind))}: T.${typeName}.Parsed;`];
	});
	return entries.length === 0
		? []
		: [`declare module ${q(module)} {`, '\tinterface UnmappedKinds {', ...entries, '\t}', '}'];
}

interface FormTerm {
	readonly required?: readonly string[];
	readonly absent?: readonly string[];
	readonly member?: readonly [name: string, type: string];
}

export function mapSlots(typedInput: PortableTypedInput, exact: ExactSlots): ReadonlyMap<string, ReadonlyMap<string, ExactSet>> {
	const { vocabulary } = typedInput.input;
	const slotted = (path: string, member: string): boolean =>
		vocabulary.kinds.get(lineageOf(path, (at) => vocabulary.kinds.get(at)).find((at) => vocabulary.kinds.get(at)?.own.has(member)) ?? '')?.own.get(member)?.slot === true;
	return new Map(
		[...exact]
			.sort(([a], [b]) => byCodepoint(a, b))
			.flatMap(([path, members]): [string, ReadonlyMap<string, ExactSet>][] => {
				if (vocabulary.kinds.get(path)?.text === true) return [];
				const kept = [...members].filter(([member]) => slotted(path, member)).sort(([a], [b]) => byCodepoint(a, b));
				return kept.length === 0 ? [] : [[path, new Map(kept)]];
			})
	);
}

export interface MapArms {
	readonly armsOf: (set: ExactSet) => readonly string[];
	readonly pathArms: (path: string) => readonly string[];
}

export function mapArmsOf(typedInput: PortableTypedInput, reads: ExactReads, map: string): MapArms {
	const { nodeMap } = typedInput;
	const viewed = new Set(reads.viewed);
	const texts = new Set(reads.textPaths);
	const pathArms = (path: string): readonly string[] => [
		...(viewed.has(path) ? [`V.Read<${map}, ${q(path)}>`] : []),
		...(texts.has(path) ? [`V.Text<${map}, ${q(path)}>`] : [])
	];
	const lowOf = (kind: string): string => {
		const typeName = nodeMap.nodes.get(kind)?.typeName;
		if (typeName === undefined) throw new Error(`portable: ${kind} reads raw but has no typed surface`);
		return `T.${typeName}.Parsed`;
	};
	const armsOf = (set: ExactSet): readonly string[] => [
		...new Set([
			...set.kinds.flatMap(pathArms),
			...set.texts.map(q),
			...set.scalars,
			...set.unmapped.map((name) => `V.Unmapped<${q(name)}>`),
			...set.raw.map((arm) => lowOf(arm.kind))
		])
	];
	return { armsOf, pathArms };
}

export function mapFormsOf(
	typedInput: PortableTypedInput,
	reads: ExactReads,
	slots: ReadonlyMap<string, ReadonlyMap<string, ExactSet>>,
	armsOf: (set: ExactSet) => readonly string[]
): (path: string) => readonly string[] | undefined {
	const { input, kindEntries, table } = typedInput;
	const { vocabulary } = input;
	const kindsOfId = new Map<number, string[]>();
	for (const entry of kindEntries) (kindsOfId.get(entry.id) ?? kindsOfId.set(entry.id, []).get(entry.id)!).push(entry.kind);
	const builtBy = (path: string, ids: ReadonlySet<number>): boolean => (table.paths[path]?.arms ?? []).some((arm) => ids.has(arm.kind));
	const arityOf = (path: string, member: string, type: string): string => {
		const arity = vocabulary.members(path).get(member)?.arity;
		return arity === 'list' ? `readonly (${type})[]` : arity === 'either' ? `${type} | readonly (${type})[]` : type;
	};
	const narrowed = (path: string, member: string, kinds: readonly number[]): FormTerm | undefined => {
		const set = slots.get(path)?.get(member);
		if (set === undefined) return undefined;
		const ids = new Set(kinds);
		const names = new Set(kinds.flatMap((id) => kindsOfId.get(id) ?? []));
		const reached = new Set(reads.readsIn([...names]).texts);
		const arms = armsOf({
			arms: set.arms,
			kinds: set.kinds.filter((at) => builtBy(at, ids)),
			texts: set.texts.filter((text) => reached.has(text)),
			unmapped: set.unmapped.filter((name) => names.has(name.slice(name.indexOf(':') + 1))),
			scalars: [],
			raw: set.raw.filter((arm) => names.has(arm.kind))
		});
		return { member: [member, arityOf(path, member, arms.length === 0 ? 'never' : arms.join(' | '))] };
	};
	const termOf = (path: string, test: PortablePickTest): FormTerm | undefined => {
		if ('absent' in test) return { required: test.required, absent: test.absent };
		if ('kinds' in test) return narrowed(path, test.member, test.kinds);
		if ('boolean' in test) return { member: ['$value', String(test.boolean)] };
		return undefined;
	};
	const keys = (names: ReadonlySet<string>): string => (names.size === 0 ? 'never' : [...names].sort().map(q).join(' | '));
	const formOf = (path: string, arm: PortableBuildArm, held: ReadonlySet<string>): string | null | undefined => {
		const terms = arm.when.flatMap((test) => {
			const term = termOf(path, test);
			return term === undefined ? [] : [term];
		});
		const absent = new Set(terms.flatMap((term) => term.absent ?? []));
		if ([...absent].some((member) => held.has(member))) return null;
		const stated = new Set(terms.flatMap((term) => term.required ?? []));
		const members = new Map(terms.flatMap((term) => (term.member === undefined || absent.has(term.member[0]) ? [] : [term.member])));
		const required = new Set([...stated].filter((member) => !members.has(member)));
		const typed = [...members]
			.sort(([a], [b]) => byCodepoint(a, b))
			.map(([member, type]) => `readonly ${member}${stated.has(member) || held.has(member) ? '' : '?'}: ${type}`);
		const args = [keys(required), keys(absent), ...(typed.length === 0 ? [] : [`{ ${typed.join('; ')} }`])];
		while (args.length > 0 && args.at(-1) === 'never') args.pop();
		return args.length === 0 ? undefined : `V.Form<${args.join(', ')}>`;
	};
	return (path: string): readonly string[] | undefined => {
		const arms = (table.paths[path]?.arms ?? []).filter((arm) => !arm.when.some((test) => 'text' in test));
		if (arms.length === 0 || vocabulary.kinds.get(path)?.text === true) return undefined;
		const held = new Set([...vocabulary.members(path)].flatMap(([member, facts]) => (facts.optional || facts.flag ? [] : [member])));
		const forms = arms.map((arm) => formOf(path, arm, held));
		if (forms.some((form) => form === undefined)) return undefined;
		return [...new Set(forms.filter((form): form is string => typeof form === 'string'))];
	};
}

export const textBuiltPaths = ({ table }: PortableTypedInput): readonly string[] =>
	Object.entries(table.paths)
		.filter(([, built]) => built.arms.some((arm) => textBuilt(table, arm)))
		.map(([path]) => path)
		.sort(byCodepoint);

export function emitGrammarMap(typedInput: PortableTypedInput, exact: ExactSlots): string {
	const { input, nodeMap } = typedInput;
	const map = grammarMapName(input.grammar);
	const reads = exactReadsOf(typedInput);
	const { armsOf } = mapArmsOf(typedInput, reads, map);
	const slots = mapSlots(typedInput, exact);
	const formsOf = mapFormsOf(typedInput, reads, slots, armsOf);
	const lines = [
		'// Auto-generated by @sittir/codegen — do not edit',
		'',
		`import type * as V from ${q(VOCABULARY_MODULE)};`,
		"import type * as T from './types.js';",
		"import type { PortableTexts } from './portable.js';",
		'',
		`export interface ${map} extends V.GrammarMap {`,
		`\treadonly features: V.${compositionOf(input.grammar)};`,
		'\treadonly overrides: {'
	];
	const entries = new Map<string, string[]>();
	for (const [path, members] of slots)
		for (const [member, set] of members) {
			const arms = armsOf(set);
			(entries.get(path) ?? entries.set(path, []).get(path)!).push(`\t\t\treadonly ${member}: ${arms.length === 0 ? 'never' : arms.join(' | ')};`);
		}
	for (const path of reads.textPaths)
		(entries.get(path) ?? entries.set(path, []).get(path)!).push(`\t\t\treadonly $text: PortableTexts[${q(path)}];`);
	for (const path of Object.keys(typedInput.table.paths).sort(byCodepoint)) {
		const forms = formsOf(path);
		if (forms !== undefined) (entries.get(path) ?? entries.set(path, []).get(path)!).push(`\t\t\treadonly $forms: ${forms.length === 0 ? 'never' : forms.join(' | ')};`);
	}
	for (const [path, members] of [...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
		lines.push(`\t\treadonly ${q(path)}: {`, ...members, '\t\t};');
	const unmapped = [...slots.values()].flatMap((members) =>
		[...members.values()].flatMap((set) => set.unmapped.map((name) => name.slice(name.indexOf(':') + 1)))
	);
	lines.push(
		'\t};',
		'\treadonly inputs: {',
		...textBuiltPaths(typedInput).map((path) => `\t\treadonly ${q(path)}: string;`),
		'\t};',
		'}',
		'',
		...unmappedKindsBlock(VOCABULARY_MODULE, input.grammar, nodeMap, unmapped),
		'',
		`export type ${map}Fits = V.Assert<V.Fits<${map}>>;`,
		''
	);
	return lines.join('\n');
}
