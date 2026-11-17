import { byCodepoint, compositionOf, lineageOf, textValued } from '../../../bindings/vocabulary.ts';
import { PORTABLE_MAP_FILE, PORTABLE_SURFACE_FILE, grammarDisplayName, moduleSpecifier, type GrammarName } from '../../../grammars.ts';
import { stringLiteral as q } from '../../../util/string-literal.ts';
import { builtFlags, containerSetFlags, textBuilt } from '@sittir/common/engine';
import type { PortableBuildArm, PortablePickTest } from '@sittir/types';
import type { NodeMap } from '../../../compiler/types.ts';
import { kindDiscriminantExpr } from '../../kind-discriminant.ts';
import { exactReadsOf, type ExactReads, type ExactSet, type ExactSlots } from './exact.ts';
import type { PortableTypedInput } from './typed.ts';

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

export function mapNeverOf(typedInput: PortableTypedInput, reads: ExactReads, exact: ExactSlots): (path: string, member: string) => boolean {
	const { armsOf } = mapArmsOf(typedInput, reads, grammarMapName(typedInput.input.grammar));
	const slots = mapSlots(typedInput, exact);
	return (path, member) => {
		const set = slots.get(path)?.get(member);
		return set !== undefined && armsOf(set).length === 0;
	};
}

export interface UnformedTest {
	readonly path: string;
	readonly member: string;
}

export interface MapForms {
	readonly forms: ReadonlyMap<string, readonly string[]>;
	readonly unformed: readonly UnformedTest[];
}

export function mapFormsOf(
	typedInput: PortableTypedInput,
	reads: ExactReads,
	slots: ReadonlyMap<string, ReadonlyMap<string, ExactSet>>,
	armsOf: (set: ExactSet) => readonly string[]
): MapForms {
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
		if (set === undefined) {
			unformed.push({ path, member });
			return undefined;
		}
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
	const unformed: UnformedTest[] = [];
	const termOf = (path: string, test: PortablePickTest): FormTerm | undefined => {
		if ('absent' in test) return { required: test.required, absent: test.absent };
		if ('kinds' in test) return narrowed(path, test.slot, test.kinds);
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
	const formsOf = (path: string): readonly string[] | undefined => {
		const arms = (table.paths[path]?.arms ?? []).filter((arm) => !arm.when.some((test) => 'text' in test));
		if (arms.length === 0 || vocabulary.kinds.get(path)?.text === true) return undefined;
		const held = new Set([...vocabulary.members(path)].flatMap(([member, facts]) => (facts.optional || facts.flag ? [] : [member])));
		const forms = arms.map((arm) => formOf(path, arm, held));
		if (forms.some((form) => form === undefined)) return undefined;
		return [...new Set(forms.filter((form): form is string => typeof form === 'string'))];
	};
	const forms = new Map(
		Object.keys(table.paths)
			.sort(byCodepoint)
			.flatMap((path): [string, readonly string[]][] => {
				const at = formsOf(path);
				return at === undefined ? [] : [[path, at]];
			})
	);
	return { forms, unformed };
}

export const textBuiltPaths = ({ table }: PortableTypedInput): readonly string[] =>
	Object.entries(table.paths)
		.filter(([, built]) => built.arms.some((arm) => textBuilt(table, arm)))
		.map(([path]) => path)
		.sort(byCodepoint);

export const mapFlagsOf = ({ table }: PortableTypedInput): readonly (readonly [path: string, flags: readonly string[]])[] => {
	const set = containerSetFlags(table);
	return Object.keys(table.paths)
		.sort(byCodepoint)
		.map((path) => [path, [...new Set(table.paths[path]!.arms.flatMap((arm) => [...builtFlags(arm), ...(set.get(arm.kind) ?? [])]))].sort(byCodepoint)]);
};

const SCALAR_TYPES = { integer: 'number', float: 'number', bigint: 'bigint' } as const;

export function mapInputsOf(typedInput: PortableTypedInput): readonly (readonly [path: string, inputs: readonly string[]])[] {
	const { table } = typedInput;
	const inputs = new Map<string, string[]>(textBuiltPaths(typedInput).map((path) => [path, ['string']]));
	const add = (path: string, input: string): void => {
		const at = inputs.get(path) ?? inputs.set(path, []).get(path)!;
		if (!at.includes(input)) at.push(input);
	};
	for (const [path, built] of Object.entries(table.paths).sort(([a], [b]) => byCodepoint(a, b))) {
		if (!built.root || Object.keys(built.builds ?? {}).length < 2) continue;
		for (const [scalar, kind] of Object.entries(built.builds!) as [keyof typeof SCALAR_TYPES, number][])
			for (const [target, other] of Object.entries(table.paths))
				if (target !== path && other.builds?.[scalar] === kind) add(target, `{ readonly $path: ${q(path)}; readonly $value: ${SCALAR_TYPES[scalar]} }`);
	}
	return [...inputs].sort(([a], [b]) => byCodepoint(a, b));
}

export function mapNodesOf({ nodeMap, kindEntries }: PortableTypedInput, reads: ExactReads): readonly (readonly [path: string, ids: readonly string[]])[] {
	const ids = new Map<string, string[]>();
	for (const [kind, list] of reads.entries) {
		const id = kindDiscriminantExpr(kind, nodeMap, kindEntries);
		for (const path of reads.readPathsOf(list)) {
			const at = ids.get(path) ?? ids.set(path, []).get(path)!;
			if (!at.includes(id)) at.push(id);
		}
	}
	return [...ids].sort(([a], [b]) => byCodepoint(a, b));
}

export type MapDecided = readonly (readonly [path: string, members: readonly (readonly [member: string, decided: string])[]])[];

export function mapDecidedOf({ input }: PortableTypedInput, slots: ReadonlyMap<string, ReadonlyMap<string, ExactSet>>, viewed: ReadonlySet<string>): MapDecided {
	const structured = (path: string): boolean => input.vocabulary.kinds.has(path) && !input.vocabulary.members(path).has('$value');
	return [...slots].flatMap(([path, members]) => {
		const decided = [...members].flatMap(([member, set]) => {
			const built = set.kinds.filter(structured);
			return built.length === 1 && viewed.has(built[0]!) ? [[member, built[0]!] as const] : [];
		});
		return decided.length === 0 ? [] : [[path, decided] as const];
	});
}

const unionOf = (arms: readonly string[]): string => (arms.length === 0 ? 'never' : arms.join(' | '));

export interface GrammarMapOutput {
	readonly source: string;
	readonly unformed: readonly UnformedTest[];
	readonly slots: ReadonlyMap<string, ReadonlyMap<string, ExactSet>>;
	readonly textInputs: readonly string[];
	readonly textValues: readonly string[];
	readonly decided: MapDecided;
}

export function emitGrammarMap(typedInput: PortableTypedInput, exact: ExactSlots): GrammarMapOutput {
	const { input, nodeMap } = typedInput;
	const map = grammarMapName(input.grammar);
	const reads = exactReadsOf(typedInput);
	const { armsOf } = mapArmsOf(typedInput, reads, map);
	const slots = mapSlots(typedInput, exact);
	const { forms, unformed } = mapFormsOf(typedInput, reads, slots, armsOf);
	const lines = [
		'// Auto-generated by @sittir/codegen — do not edit',
		'',
		`import type * as V from ${q(VOCABULARY_MODULE)};`,
		`import type * as T from '${moduleSpecifier(PORTABLE_MAP_FILE, 'types.ts')}';`,
		`import type { TSKindId } from '${moduleSpecifier(PORTABLE_MAP_FILE, 'kinds.ts')}';`,
		`import type { PortableTexts } from '${moduleSpecifier(PORTABLE_MAP_FILE, PORTABLE_SURFACE_FILE)}';`,
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
	for (const [path, at] of forms)
		(entries.get(path) ?? entries.set(path, []).get(path)!).push(`\t\t\treadonly $forms: ${at.length === 0 ? 'never' : at.join(' | ')};`);
	for (const [path, members] of [...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
		lines.push(`\t\treadonly ${q(path)}: {`, ...members, '\t\t};');
	const unmapped = [...slots.values()].flatMap((members) =>
		[...members.values()].flatMap((set) => set.unmapped.map((name) => name.slice(name.indexOf(':') + 1)))
	);
	const decided = mapDecidedOf(typedInput, slots, new Set(reads.viewed));
	lines.push(
		'\t};',
		'\treadonly inputs: {',
		...mapInputsOf(typedInput).map(([path, inputs]) => `\t\treadonly ${q(path)}: ${unionOf(inputs)};`),
		'\t};',
		'\treadonly nodes: V.NodesOf<{',
		...mapNodesOf(typedInput, reads).map(([path, ids]) => `\t\treadonly ${q(path)}: ${ids.join(' | ')};`),
		'\t}, T.BoundByKindId, T.ParsedByKindId>;',
		'\treadonly flags: {',
		...mapFlagsOf(typedInput).map(([path, flags]) => `\t\treadonly ${q(path)}: ${unionOf(flags.map(q))};`),
		'\t};',
		'\treadonly decided: {',
		...decided.map(([path, members]) => `\t\treadonly ${q(path)}: { ${members.map(([member, at]) => `readonly ${member}: ${q(at)};`).join(' ')} };`),
		'\t};',
		'}',
		'',
		...unmappedKindsBlock(VOCABULARY_MODULE, input.grammar, nodeMap, unmapped),
		'',
		`export type ${map}Fits = V.Assert<V.Fits<${map}>>;`,
		''
	);
	const textInputs = textBuiltPaths(typedInput);
	return { source: lines.join('\n'), unformed, slots, textInputs, textValues: textInputs.filter((path) => textValued(typedInput.input.vocabulary, path)), decided };
}
