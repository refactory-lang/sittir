import { type ModelNode, type ModelSlot } from '../../../bindings/facts.ts';
import { armClass, collapsedKinds, derive, levelMembers, levelsWithMembers, soleRole, type Derivation, type MemberFacts } from '../../../bindings/derive.ts';
import { tsname } from '../../../bindings/names.ts';
import { stringLiteral as q } from '../../../util/string-literal.ts';
import { concreteKinds, modelNode, type GrammarInput, type GrammarRoutes, type MemberRoute, type ReadEntry, type SlotStep } from '../../../bindings/routes.ts';
import type { Vocabulary } from '../../../bindings/vocabulary.ts';
import type { NodeMap } from '../../../compiler/types.ts';
import { grammarDisplayName, type GrammarName } from '../../../grammars.ts';
import { fixedTextKinds, hasCatalogEntry, kindDiscriminantExpr, kindIdMemberName, type KindEnumEntry } from '../../kind-discriminant.ts';

export interface PortableTypedInput {
	readonly routes: GrammarRoutes;
	readonly input: GrammarInput;
	readonly vocabulary: Vocabulary;
	readonly nodeMap: NodeMap;
	readonly kindEntries: readonly KindEnumEntry[];
}

export interface PortableTypedUnemitted {
	readonly kind: string;
	readonly vocab: string;
	readonly member?: string;
	readonly reason: string;
}

export interface PortableTypedOutput {
	readonly source: string;
	readonly unemitted: readonly PortableTypedUnemitted[];
}

export const PORTABLE_TYPED_FILE = 'portable.typed.ts';
export const PORTABLE_TYPED_TSCONFIG = 'tsconfig.portable.json';

export const PORTABLE_TYPED_TSCONFIG_TEXT = `${JSON.stringify({ extends: '../../../tsconfig.json', compilerOptions: { noEmit: true, types: ['node'] }, include: [PORTABLE_TYPED_FILE] }, null, '\t')}\n`;

const PRELUDE = [
	'declare const low: unique symbol;',
	'declare const flags: unique symbol;',
	'',
	'interface Held<N> {',
	'\treadonly [low]: N;',
	'}',
	'',
	'interface PortableHandle {',
	'\treadonly $type: TSKindId;',
	'\treadonly [low]: unknown;',
	'\treadonly [flags]: number;',
	'}',
	'',
	'interface PortableLeaf {',
	'\treadonly $value: () => string;',
	'}',
	'',
	'type Member<I, P extends keyof I> = I[P];',
	'',
	"type Kept<I, P extends keyof I> = P extends '$kind' ? never : [Member<I, P>] extends [never] ? never : [NonNullable<Member<I, P>>] extends [Flag] ? never : P;",
	'',
	'type Resolved<R> = R extends readonly (infer E)[]',
	'\t? readonly Resolved<E>[]',
	'\t: R extends { readonly $kind: infer K }',
	'\t\t? K extends keyof VocabViews',
	'\t\t\t? VocabViews[K]',
	'\t\t\t: R',
	'\t\t: R;',
	'',
	'type KindOf<I> = I extends { readonly $kind: infer K } ? K : never;',
	'',
	'export type ViewForm<I> = PortableHandle & { readonly $kind?: KindOf<I> } & { readonly [P in keyof I as Kept<I, P>]-?: () => Resolved<Member<I, P>> };',
	'',
	'type Of<N, K> = N extends { readonly $type: infer T } ? (K extends T ? N : undefined) : N extends readonly (infer E)[] ? readonly Of<E, K>[] : undefined;',
	'',
	'type Without<N, K> = N extends { readonly $type: K } ? never : N extends readonly (infer E)[] ? readonly Without<E, K>[] : N;',
	'',
	'type ViewOfKind<K> = K extends keyof ViewByKind ? ViewByKind[K] : unknown;',
	'',
	'export type ViewOf<N> = N extends undefined',
	'\t? undefined',
	'\t: N extends { readonly $type: infer K }',
	'\t\t? ViewOfKind<K>',
	'\t\t: N extends readonly (infer E)[]',
	'\t\t\t? readonly ViewOf<E>[]',
	'\t\t\t: N extends keyof ViewByKind',
	'\t\t\t\t? ViewByKind[N]',
	'\t\t\t\t: unknown;',
	'',
	'export type ViewEnumOf<N> = N extends undefined',
	'\t? undefined',
	'\t: N extends keyof EnumViewByKind',
	'\t\t? EnumViewByKind[N]',
	'\t\t: N extends { readonly $type: unknown }',
	'\t\t\t? ViewOf<N>',
	'\t\t\t: N extends readonly (infer E)[]',
	'\t\t\t\t? readonly ViewEnumOf<E>[]',
	'\t\t\t\t: ViewOf<N>;',
	'',
	'declare function read<N>(node: N): ViewOf<N>;',
	'declare function readEnum<N>(node: N): ViewEnumOf<N>;',
	'declare function of<N, K extends TSKindId>(node: N, kind: K): Of<N, K>;',
	'declare function without<N, K extends TSKindId>(node: N, ...kinds: K[]): Without<N, K>;',
	'declare function kindOf(node: { readonly $type: TSKindId } | TSKindId): TSKindId;',
	'declare function textOf(node: unknown): string;',
	'',
	'function none(): undefined {',
	'\treturn undefined;',
	'}',
	'',
	'function value(this: Held<unknown>): string {',
	'\treturn textOf(this[low]);',
	'}'
];

export function emitPortableTyped({ routes, input, vocabulary, nodeMap, kindEntries }: PortableTypedInput): PortableTypedOutput {
	const { model } = input;
	const unemitted: PortableTypedUnemitted[] = [];
	const idOf = (kind: string): string | undefined => (hasCatalogEntry(kindEntries, kind) ? kindDiscriminantExpr(kind, nodeMap, kindEntries) : undefined);
	const typeNameOf = (kind: string): string | undefined => nodeMap.nodes.get(kind)?.typeName;
	const nodeOf = (kind: string): ModelNode | undefined => modelNode(model, kind);
	const qnameOf = (path: string): string | undefined => vocabulary.kinds.get(path)?.name;
	const interfaceOf = (path: string): string => `V.${qnameOf(path) ?? path}<Ctx>`;
	const unclaimed = new Set(input.bindings.unclaimed.map((u) => u.kind));
	const fixedText = new Map(fixedTextKinds(nodeMap, kindEntries));
	const isEnum = (kind: string): boolean => nodeOf(kind)?.modelType === 'enum';
	const varies = (kind: string): boolean => {
		const node = nodeOf(kind);
		return node !== undefined && !isEnum(kind) && (node.pattern !== null || input.textTokens.has(kind)) && !fixedText.has(kind);
	};
	const token = (kind: string): boolean => isEnum(kind) || fixedText.has(kind);
	const lowOf = (kind: string): string | undefined => (token(kind) ? 'TSKindId' : typeNameOf(kind) === undefined ? undefined : `T.${typeNameOf(kind)}.Parsed`);
	const aliasOf = (kind: string): string => `VK_${kindIdMemberName(nodeMap, kind)}`;

	const entries = [...routes.readEntries].filter(([, list]) => list.length > 0).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
	const claimedPaths = [...new Set(entries.flatMap(([, list]) => list.map((e) => e.vocab)))].sort();
	const claimersOf = new Map<string, string[]>();
	for (const [kind, list] of entries) for (const e of list) (claimersOf.get(e.vocab) ?? claimersOf.set(e.vocab, []).get(e.vocab)!).push(kind);

	const own = derive([input]);
	const lines: string[] = [];
	const emit = (...out: string[]): void => void lines.push(...out);
	emit(
		'// Auto-generated by @sittir/codegen — do not edit',
		'',
		"import type * as V from '../../types/src/vocabulary/index.ts';",
		"import type { Flag } from '../../types/src/vocabulary/utils.ts';",
		"import type * as T from '../src/types.ts';",
		"import { TSKindId } from '../src/kinds.ts';",
		''
	);

	emit(...contextOf({ grammar: input.grammar, own, vocabulary, claimedPaths, interfaceOf, slotArm: slotArmOf(own, vocabulary, model) }), '');
	emit(...PRELUDE, '');

	emit('export interface VocabViews {');
	for (const path of claimedPaths) {
		const leaf = (claimersOf.get(path) ?? []).every(varies);
		emit(`\t${q(path)}: ViewForm<${interfaceOf(path)}>${leaf ? ' & PortableLeaf' : ''};`);
	}
	emit('}', '');

	const supertypesOf = new Map<string, string[]>();
	for (const n of model.values()) for (const s of n.subtypes) (supertypesOf.get(s) ?? supertypesOf.set(s, []).get(s)!).push(n.kind);
	const entriesFor = (kind: string, seen = new Set<string>()): readonly ReadEntry[] | undefined => {
		const found = routes.readEntries.get(kind);
		if (found !== undefined && found.length > 0) return found;
		for (const s of supertypesOf.get(kind) ?? []) {
			if (seen.has(s)) continue;
			seen.add(s);
			const up = entriesFor(s, seen);
			if (up !== undefined) return up;
		}
		return undefined;
	};
	const concrete = [...model.values()].filter((n) => n.subtypes.length === 0 && idOf(n.kind) !== undefined);
	const typed = new Set(concrete.map((n) => n.kind));
	const refsOf = (kinds: readonly string[], terminals: readonly string[] = []): string => {
		const parts = new Set<string>(terminals.map(q));
		for (const k of kinds) for (const c of concreteKinds(model, [k])) if (typed.has(c)) parts.add(aliasOf(c));
		return parts.size > 0 ? [...parts].join(' | ') : 'never';
	};
	const viewTypeOf = (node: ModelNode): string => {
		const claimed = entriesFor(node.kind);
		if (claimed !== undefined) return [...new Set(claimed.map((e) => `VocabViews[${q(e.vocab)}]`))].join(' | ');
		if (unclaimed.has(node.kind)) return 'never';
		const text = fixedText.get(node.kind) ?? node.text;
		if (text !== null && text !== undefined) return q(text);
		if (isEnum(node.kind)) return node.enumMembers.map((m) => q(m.text)).join(' | ') || 'string';
		if (varies(node.kind)) return `{ readonly $type: ${idOf(node.kind)}; readonly $value: () => string }`;
		const unwrap = routes.containers.get(node.kind);
		if (unwrap !== undefined) {
			const slot = node.slots.find((s) => s.name === unwrap.slot);
			const elements = refsOf(unwrap.kinds, unwrap.terminals);
			if (unwrap.list || slot?.multiple === true) return `readonly (${elements})[]`;
			return slot?.required === true ? elements : `${elements} | undefined`;
		}
		return `V.Unmapped<'${input.grammar}:${node.kind.replace(/^_+/, '')}'>`;
	};
	for (const node of concrete) emit(`type ${aliasOf(node.kind)} = ${viewTypeOf(node)};`);
	emit('');
	emit('export interface ViewByKind {');
	for (const node of concrete) emit(`\t[${idOf(node.kind)}]: ${aliasOf(node.kind)};`);
	emit('}', '');

	const claimedEnums = entries.map(([kind]) => kind).filter(isEnum);
	emit('export interface EnumViewByKind {');
	for (const kind of claimedEnums) {
		const enumNode = nodeOf(kind);
		if (enumNode === undefined || !typed.has(enumNode.kind)) continue;
		for (const m of enumNode.enumMembers) {
			const id = idOf(m.kind);
			if (id !== undefined) emit(`\t[${id}]: ${aliasOf(enumNode.kind)};`);
		}
	}
	emit('}', '');

	const contextual = [...new Set(entries.filter(([, list]) => list.some((e) => e.claim.within.length > 0)).flatMap(([kind]) => idOf(kind) ?? []))];
	emit(`export type Backward = Exclude<keyof ViewByKind, ${contextual.length > 0 ? contextual.join(' | ') : 'never'}>;`, '');

	const enumKinds = new Set(claimedEnums.flatMap((kind) => concreteKinds(model, [kind])));
	const admitsEnum = (slot: ModelSlot): boolean => slot.kinds.some((k) => concreteKinds(model, [k]).some((c) => enumKinds.has(c)));
	const listsOnly = (slot: ModelSlot): boolean => {
		const held = concreteKinds(model, slot.kinds);
		return held.length > 0 && held.every((k) => entriesFor(k) === undefined && (nodeOf(k)?.modelType === 'list' || routes.containers.get(k)?.list === true));
	};
	const slotOf = (step: SlotStep): ModelSlot | undefined => nodeOf(step.owner)?.slots.find((s) => s.name === step.slot);
	const chainOf = (kind: string, path: readonly SlotStep[]): { expr: string; last: ModelSlot; optional: boolean } | string => {
		let expr = 'this[low]';
		let optional = false;
		let last: ModelSlot | undefined;
		let held: readonly string[] = [kind];
		for (const [i, step] of path.entries()) {
			const slot = slotOf(step);
			if (slot === undefined) return `${step.owner} has no slot ${step.slot}`;
			if (!concreteKinds(model, held).includes(step.owner) && !held.includes(step.owner)) return `steps through ${step.owner}, which ${i === 0 ? 'the read kind is not' : 'its slot does not hold'}`;
			if (held.length !== 1 || held[0] !== step.owner) {
				const owner = idOf(step.owner);
				if (owner === undefined) return `${step.owner} has no kind id`;
				expr = `of(${expr}, ${owner})`;
				optional = true;
			}
			held = concreteKinds(model, slot.kinds);
			if (nodeOf(step.owner)?.modelType !== 'list' || !slot.multiple) expr = `${expr}${optional ? '?.' : '.'}${slot.propertyName}()`;
			optional ||= !slot.required;
			if (slot.multiple && i < path.length - 1) {
				if (step.anchor === undefined) return `steps into one of ${step.owner}'s ${step.slot} with no anchor`;
				expr = step.anchor === 'last' ? `${expr}${optional ? '?.' : '.'}at(-1)` : `${expr}${optional ? '?.' : ''}[0]`;
				optional = true;
			}
			last = slot;
		}
		return last === undefined ? 'an empty path' : { expr, last, optional };
	};
	const readOf = (kind: string, route: MemberRoute): { readonly body: string } | { readonly reason: string } => {
		if (route.route === 'presence') return { reason: 'a presence member that is not a flag' };
		if (route.path === undefined) return { reason: `no path for its ${route.route} route` };
		const chain = chainOf(kind, route.path);
		if (typeof chain === 'string') return { reason: chain };
		const reader = admitsEnum(chain.last) ? 'readEnum' : 'read';
		if (route.route === 'kind') {
			const id = idOf(route.kind);
			return id === undefined ? { reason: `${route.kind} has no kind id` } : { body: `${reader}(of(${chain.expr}, ${id}))` };
		}
		if (chain.last.storage === 'boolean') return { body: chain.expr };
		const except = route.route === 'slot' ? (route.except ?? []).flatMap((k) => concreteKinds(model, [k]).flatMap((c) => idOf(c) ?? [])) : [];
		const read = except.length > 0 ? `${reader}(without(${chain.expr}, ${[...new Set(except)].join(', ')}))` : `${reader}(${chain.expr})`;
		return { body: chain.optional && !chain.last.multiple && listsOnly(chain.last) ? `${read} ?? []` : read };
	};

	const factoryNameOf = (entry: ReadEntry): string => `${kindIdMemberName(nodeMap, entry.kind)}As${entry.vocab.split('.').map(tsname).join('')}${entry.index > 0 ? entry.index : ''}`;
	const names = new Set<string>();
	for (const [kind, list] of entries) {
		const low = lowOf(kind);
		if (low === undefined || idOf(kind) === undefined) {
			for (const e of list) unemitted.push({ kind, vocab: e.vocab, reason: 'no typed surface' });
			continue;
		}
		for (const entry of list) {
			let name = factoryNameOf(entry);
			while (names.has(name)) name = `${name}_`;
			names.add(name);
			const declared = vocabulary.members(entry.vocab);
			const fields: string[] = [];
			const written = new Set<string>();
			const pins = new Map(entry.pins.map((pin) => [pin.member, pin.text]));
			for (const route of token(kind) ? [] : entry.members) {
				if (route.flag === true || written.has(route.name)) continue;
				const pin = pins.get(route.name);
				const read = pin !== undefined ? { body: q(pin) } : readOf(kind, route);
				if ('reason' in read) {
					unemitted.push({ kind, vocab: entry.vocab, member: route.name, reason: read.reason });
					continue;
				}
				const fn = `${name}$${route.name}`;
				emit(`function ${fn}(this: Held<${low}>) {`, `\treturn ${read.body};`, '}', '');
				fields.push(`${route.name}: ${fn}`);
				written.add(route.name);
			}
			for (const [member, facts] of declared) if (!facts.flag && facts.optional && !written.has(member)) fields.push(`${member}: none`);
			if (varies(kind) && (claimersOf.get(entry.vocab) ?? []).every(varies)) fields.push('$value: value');
			emit(
				`function ${name}(n: ${low}, set = 0): VocabViews[${q(entry.vocab)}] {`,
				`\treturn { $type: kindOf(n)${fields.map((f) => `, ${f}`).join('')}, [low]: n, [flags]: set };`,
				'}',
				''
			);
		}
	}
	return { source: `${lines.join('\n').trimEnd()}\n`, unemitted };
}

interface ContextInput {
	readonly grammar: string;
	readonly own: Derivation;
	readonly vocabulary: Vocabulary;
	readonly claimedPaths: readonly string[];
	readonly interfaceOf: (path: string) => string;
	readonly slotArm: (kind: string) => string;
}

function contextOf({ grammar, own, vocabulary, claimedPaths, interfaceOf, slotArm }: ContextInput): string[] {
	const roleText = new Map<string, Set<string>>();
	for (const path of levelsWithMembers(own))
		for (const facts of levelMembers(own, path).values()) {
			const sole = soleRole(own, facts.kinds);
			if (sole === undefined) continue;
			const text = roleText.get(sole.role) ?? roleText.set(sole.role, new Set()).get(sole.role)!;
			for (const k of sole.text) text.add(k);
		}
	const namespaces = [...vocabulary.kinds.keys()].filter((path) => !path.includes('.')).sort();
	const ownMember = (path: string, member: string): MemberFacts | undefined => {
		const facts = levelMembers(own, path).get(member);
		if (facts !== undefined) return facts;
		const parent = own.refinements.get(path)?.parent ?? (path.includes('.') ? path.slice(0, path.lastIndexOf('.')) : undefined);
		return parent === undefined ? undefined : ownMember(parent, member);
	};
	const out = [
		"type Slots = V.GrammarContext<Ctx>['slots'];",
		'',
		'type SlotOf<P, M> = P extends keyof Slots ? (M extends keyof Slots[P] ? Slots[P][M] : unknown) : unknown;',
		'',
		'type Fit<Own extends Shared, Shared> = Own;',
		'',
		'interface OwnSlots {'
	];
	const fits: string[] = [];
	for (const path of [...vocabulary.kinds.keys()].sort()) {
		const filled = [...vocabulary.members(path)].flatMap(([member, declared]) => {
			if (declared.flag) return [];
			const facts = ownMember(path, member);
			const arms = facts === undefined ? [] : [...new Set(collapsedKinds(own, facts.kinds).map(slotArm))];
			if (arms.length === 0) return [];
			fits.push(`type Fit${fits.length} = Fit<OwnSlots[${q(path)}][${q(member)}], SlotOf<${q(path)}, ${q(member)}>>;`);
			return [`\t\treadonly ${member}: ${arms.join(' | ')};`];
		});
		if (filled.length > 0) out.push(`\treadonly ${q(path)}: {`, ...filled, '\t};');
	}
	const roles: string[] = [];
	const ctx = [`export interface Ctx extends V.GrammarContext<Ctx>, V.${grammarDisplayName(grammar as GrammarName)}Features {`];
	for (const ns of namespaces) {
		const paths = claimedPaths.filter((p) => p === ns || p.startsWith(`${ns}.`));
		const text = [...new Set([...(roleText.get(ns) ?? [])].map(slotArm))].sort();
		if (text.length > 0) roles.push(`type Role${roles.length} = Fit<${text.join(' | ')}, V.GrammarContext<Ctx>[${q(ns)}]>;`);
		ctx.push(`\treadonly ${ns}: ${paths.length > 0 ? paths.map(interfaceOf).join(' | ') : 'never'};`);
	}
	out.push('}', '', ...fits, ...roles, '', ...ctx, '}');
	return out;
}

function slotArmOf(own: Derivation, vocabulary: Vocabulary, model: GrammarInput['model']): (kind: string) => string {
	const patterns = new Set([...model.values()].flatMap((n) => (n.pattern === null ? [] : [n.pattern])));
	const qname = (path: string): string => vocabulary.kinds.get(path)?.name ?? path;
	return (k) => {
		switch (armClass(k)) {
			case 'scalar':
				return k;
			case 'role':
				return `Ctx['${k}']`;
			case 'unmapped':
				return `V.Unmapped<'${k.slice(1, -1)}'>`;
			case 'ref':
				return k.startsWith('set:') ? `V.${qname(k.slice(4))}.Any<Ctx>` : `V.${qname(k)}<Ctx>`;
			case 'text': {
				if (k.startsWith('literal:')) {
					const text = modelNode(model, k.slice(8))?.text;
					return text === null || text === undefined ? 'string' : q(text);
				}
				return patterns.has(k.slice(5)) ? 'string' : q(k.slice(5));
			}
		}
	};
}
