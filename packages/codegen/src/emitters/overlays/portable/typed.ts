import { type ModelNode, type ModelSlot } from '../../../bindings/facts.ts';
import { tsname } from '../../../bindings/names.ts';
import { stringLiteral as q } from '../../../util/string-literal.ts';
import { PORTABLE_MAP_FILE, PORTABLE_TS6_TYPE_TESTS, PORTABLE_TYPE_TESTS } from '../../../grammars.ts';
import { concreteKinds, guaranteedBy, modelNode, readsList, type ContainerUnwrap, type GrammarInput, type GrammarRoutes, type Guaranteed, type MemberRoute, type ReadEntry, type SlotStep } from '../../../bindings/routes.ts';
import type { PortableBuildTable, PortableCondition } from '@sittir/types';
import type { NodeMap } from '../../../compiler/types.ts';
import { hasCatalogEntry, kindDiscriminantExpr, kindIdMemberName, type KindEnumEntry } from '../../kind-discriminant.ts';
import { exactReadsOf, exactSlotsOf, type ExactSlots, type ValueRead } from './exact.ts';
import { emitGrammarMap, grammarMapName, unmappedKindsBlock, unmappedName, type UnformedTest } from './grammar-map.ts';

export interface PortableTypedInput {
	readonly routes: GrammarRoutes;
	readonly input: GrammarInput;
	readonly nodeMap: NodeMap;
	readonly kindEntries: readonly KindEnumEntry[];
	readonly readTest: (entry: ReadEntry) => readonly PortableCondition[];
	readonly table: PortableBuildTable;
	readonly presetCarried: ReadonlySet<number>;
	readonly totalIntegerReads: ReadonlySet<number>;
	readonly freeTextClosedBy: ReadonlyMap<number, readonly string[]>;
	readonly flags: ReadonlyMap<string, readonly string[]>;
}

export interface PortableTypedUnemitted {
	readonly kind: string;
	readonly vocab: string;
	readonly member?: string;
	readonly reason: string;
}

export interface PortableTypedOutput {
	readonly source: string;
	readonly map: string;
	readonly unemitted: readonly PortableTypedUnemitted[];
	readonly exact: ExactSlots;
	readonly unformed: readonly UnformedTest[];
}

export const PORTABLE_TYPED_FILE = 'portable.typed.ts';
export const PORTABLE_TYPED_TSCONFIG = 'tsconfig.portable.json';
export const PORTABLE_TS6_TSCONFIG = 'tsconfig.portable.ts6.json';

export const PORTABLE_TYPE_TEST_LANES: Readonly<Record<string, readonly string[]>> = {
	[PORTABLE_TYPED_TSCONFIG]: [PORTABLE_TYPE_TESTS],
	[PORTABLE_TS6_TSCONFIG]: [PORTABLE_TYPE_TESTS, PORTABLE_TS6_TYPE_TESTS]
};

export const portableTsconfigText = (tests: readonly string[]): string =>
	`${JSON.stringify({ extends: '../../../tsconfig.json', compilerOptions: { noEmit: true, types: ['node'] }, include: [PORTABLE_TYPED_FILE, ...tests.map((glob) => `../${glob}`)] }, null, '\t')}\n`;

const VOCABULARY_INDEX = '../../types/src/vocabulary/index.ts';

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
	'\treadonly [flags]: readonly string[];',
	'}',
	'',
	'interface PortableLeaf {',
	'\treadonly $value: () => string;',
	'}',
	'',
	'type Member<I, P extends keyof I> = I[P];',
	'',
	"type Kept<I, P extends keyof I> = P extends '$path' ? never : [Member<I, P>] extends [never] ? never : [NonNullable<Member<I, P>>] extends [Flag | V.Missing<unknown>] ? never : P;",
	'',
	'type Resolved<R> = R extends readonly (infer E)[]',
	'\t? readonly Resolved<E>[]',
	'\t: R extends { readonly $path: infer K }',
	'\t\t? K extends keyof VocabViews',
	'\t\t\t? VocabViews[K]',
	'\t\t\t: R',
	'\t\t: R;',
	'',
	'type PathOf<I> = I extends { readonly $path: infer K } ? K : never;',
	'',
	'export type ViewForm<I> = PortableHandle & { readonly $path?: PathOf<I> } & { readonly [P in keyof I as Kept<I, P>]-?: () => Resolved<Member<I, P>> };',
	'',
	'type Ret<F> = F extends (...args: never[]) => infer R ? R : never;',
	'',
	'type Narrow<R, Id> = [Id] extends [never] ? NonNullable<R> : [Extract<NonNullable<R>, { readonly $type: Id } | Id>] extends [never] ? (NonNullable<R> extends readonly (infer E)[] ? readonly [Extract<E, { readonly $type: Id } | Id>, ...Extract<E, { readonly $type: Id } | Id>[]] : never) : Extract<NonNullable<R>, { readonly $type: Id } | Id>;',
	'',
	'type Present<N, G> = [keyof G] extends [never] ? N : [keyof G & keyof N] extends [never] ? (N extends readonly [infer H, ...infer T] ? readonly [Present<H, G>, ...{ [I in keyof T]: Present<T[I], G> }] : N extends readonly (infer E)[] ? readonly Present<E, G>[] : N) : Omit<N, keyof G> & { readonly [P in keyof G & keyof N]: () => G[P] extends readonly [infer Id, infer Sub] ? Present<Narrow<Ret<N[P]>, Id>, Sub> : never };',
	'',
	'type Of<N, K> =N extends { readonly $type: infer T } ? (K extends T ? N : undefined) : N extends readonly (infer E)[] ? readonly Of<E, K>[] : undefined;',
	'',
	'type Without<N, K> = N extends { readonly $type: K } ? never : N extends readonly (infer E)[] ? readonly Without<E, K>[] : N;',
	'',
	'type ViewOfKind<K> = K extends keyof ViewByKind ? ViewByKind[K] : unknown;',
	'',
	'export type ViewOf<N> = N extends undefined | null',
	'\t? N',
	'\t: N extends { readonly $type: infer K }',
	'\t\t? ViewOfKind<K>',
	'\t\t: N extends readonly (infer E)[]',
	'\t\t\t? readonly ViewOf<E>[]',
	'\t\t\t: N extends keyof ViewByKind',
	'\t\t\t\t? ViewByKind[N]',
	'\t\t\t\t: N extends string | boolean',
	'\t\t\t\t\t? N',
	'\t\t\t\t\t: unknown;',
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
	'type Listed<V> = V extends undefined ? undefined : V extends readonly unknown[] ? V : readonly V[];',
	'',
	'declare function listed<V>(value: V): Listed<V>;',
	'',
	'function none(): undefined {',
	'\treturn undefined;',
	'}',
	'',
	'function value(this: Held<unknown>): string {',
	'\treturn textOf(this[low]);',
	'}',
	'',
	'declare function floatOf(node: unknown): number;',
	'declare function integerOf(node: unknown): number | bigint;',
	'declare function bigintOf(node: unknown): bigint;',
	'',
	'function trueValue(): true {',
	'\treturn true;',
	'}',
	'',
	'function falseValue(): false {',
	'\treturn false;',
	'}',
	'',
	'function floatValue(this: Held<unknown>): number {',
	'\treturn floatOf(this[low]);',
	'}',
	'',
	'function integerValue(this: Held<unknown>): number | bigint {',
	'\treturn integerOf(this[low]);',
	'}',
	'',
	'function bigintValue(this: Held<unknown>): bigint {',
	'\treturn bigintOf(this[low]);',
	'}'
];

const VALUE_READERS: Readonly<Record<ValueRead, string>> = { text: 'value', true: 'trueValue', false: 'falseValue', float: 'floatValue', integer: 'integerValue', bigint: 'bigintValue' };

export function emitPortableTyped(typedInput: PortableTypedInput): PortableTypedOutput {
	const { routes, input, nodeMap, kindEntries } = typedInput;
	const { model, vocabulary } = input;
	const reads = exactReadsOf(typedInput);
	const exact = exactSlotsOf(typedInput, reads);
	const { entries, readPathsOf, entriesFor, token, textual, claimersOf, viewed, valueOf, viewClassOf } = reads;
	const leafAt = (path: string): boolean => (claimersOf.get(path) ?? []).every((kind) => valueOf(path, kind) === 'text');
	const tokenTypeOf = reads.textTypeOf;
	const map = grammarMapName(input.grammar);
	const unemitted: PortableTypedUnemitted[] = [];
	const idOf = (kind: string): string | undefined => (hasCatalogEntry(kindEntries, kind) ? kindDiscriminantExpr(kind, nodeMap, kindEntries) : undefined);
	const typeNameOf = (kind: string): string | undefined => nodeMap.nodes.get(kind)?.typeName;
	const nodeOf = (kind: string): ModelNode | undefined => modelNode(model, kind);
	const qnameOf = (path: string): string | undefined => vocabulary.kinds.get(path)?.name;
	const interfaceOf = (path: string): string => `V.${qnameOf(path) ?? path}<${map}>`;
	const isEnum = (kind: string): boolean => nodeOf(kind)?.modelType === 'enum';
	const lowOf = (kind: string): string | undefined => (token(kind) ? 'TSKindId' : typeNameOf(kind) === undefined ? undefined : `T.${typeNameOf(kind)}.Parsed`);
	const aliasOf = (kind: string): string => `VK_${kindIdMemberName(nodeMap, kind)}`;

	const slotOf = (step: SlotStep): ModelSlot | undefined => nodeOf(step.owner)?.slots.find((s) => s.name === step.slot);
	const concrete = [...model.values()].filter((n) => n.subtypes.length === 0 && idOf(n.kind) !== undefined);
	const typed = new Set(concrete.map((n) => n.kind));
	const refsOf = (kinds: readonly string[], terminals: readonly string[] = []): string => {
		const parts = new Set<string>(terminals.map(q));
		for (const k of kinds) for (const c of concreteKinds(model, [k])) if (typed.has(c)) parts.add(aliasOf(c));
		return parts.size > 0 ? [...parts].join(' | ') : 'never';
	};
	const listsOnly = (slot: ModelSlot): boolean => {
		const held = concreteKinds(model, slot.kinds);
		return held.length > 0 && held.every((k) => entriesFor(k) === undefined && (nodeOf(k)?.modelType === 'list' || routes.containers.get(k)?.list === true));
	};
	interface View {
		readonly type: string;
	}
	const containerView = (node: ModelNode, unwrap: ContainerUnwrap): View => {
		const slot = node.slots.find((s) => s.name === unwrap.slot);
		const elements = refsOf(unwrap.kinds, unwrap.terminals);
		if (unwrap.list) return { type: `readonly (${elements})[]` };
		return { type: slot !== undefined && (slot.required || listsOnly(slot)) ? elements : `${elements} | undefined` };
	};
	const viewOf = (node: ModelNode): View => {
		const unwrap = routes.containers.get(node.kind);
		const claimedType = (): string => readPathsOf(entriesFor(node.kind)!).map((path) => `VocabViews[${q(path)}]`).join(' | ');
		switch (viewClassOf(node.kind)) {
			case 'text':
			case 'token':
				return { type: tokenTypeOf(node.kind)! };
			case 'claimed':
				return { type: claimedType() };
			case 'refined': {
				const contained = containerView(node, unwrap!);
				return { ...contained, type: `${claimedType()} | ${contained.type}` };
			}
			case 'never':
				return { type: 'never' };
			case 'varies':
				return { type: `{ readonly $type: ${idOf(node.kind)}; readonly $value: () => string }` };
			case 'container':
				return containerView(node, unwrap!);
			case 'unmapped':
				return { type: unmappedOf(node.kind) };
		}
	};
	const unmappedViews = new Set<string>();
	const unmappedOf = (kind: string): string => {
		unmappedViews.add(kind);
		return `V.Unmapped<${q(unmappedName(input.grammar, kind))}>`;
	};

	const lines: string[] = [];
	const emit = (...out: string[]): void => void lines.push(...out);
	emit(
		'// Auto-generated by @sittir/codegen — do not edit',
		'',
		`import type * as V from ${q(VOCABULARY_INDEX)};`,
		"import type { Flag } from '../../types/src/vocabulary/utils.ts';",
		"import type * as T from '../src/types.ts';",
		"import { TSKindId } from '../src/kinds.ts';",
		`import type { ${map} } from '../src/${PORTABLE_MAP_FILE}';`,
		''
	);
	emit(...PRELUDE, '');

	emit('export interface VocabViews {');
	for (const path of viewed) {
		emit(`\t${q(path)}: ViewForm<${interfaceOf(path)}>${leafAt(path) ? ' & PortableLeaf' : ''};`);
	}
	emit('}', '');

	for (const node of concrete) emit(`type ${aliasOf(node.kind)} = ${viewOf(node).type};`);
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
			if (id !== undefined) emit(`\t[${id}]: ${tokenTypeOf(m.kind) ?? q(m.text)};`);
		}
	}
	emit('}', '');

	const contextual = [...new Set(entries.filter(([, list]) => list.some((e) => e.claim.within.length > 0)).flatMap(([kind]) => idOf(kind) ?? []))];
	emit(`export type Backward = Exclude<keyof ViewByKind, ${contextual.length > 0 ? contextual.join(' | ') : 'never'}>;`, '');

	const enumKinds = new Set(claimedEnums.flatMap((kind) => concreteKinds(model, [kind])));
	const admitsEnum = (slot: ModelSlot): boolean => slot.kinds.some((k) => concreteKinds(model, [k]).some((c) => enumKinds.has(c)));
	const admitsBeside = (slot: ModelSlot, kind: string): boolean =>
		slot.terminals.length > 0 || concreteKinds(model, slot.kinds).some((k) => !concreteKinds(model, [kind]).includes(k));
	interface PresentStep {
		readonly accessor: string;
		readonly ids: string;
		readonly tested: boolean;
	}
	interface Chain {
		readonly expr: string;
		readonly last: ModelSlot;
		readonly optional: boolean;
		readonly present: readonly PresentStep[];
		readonly pinned: readonly string[] | undefined;
	}
	const chainOf = (kind: string, path: readonly SlotStep[], sure: Guaranteed, single: boolean): Chain | string | null => {
		let expr = 'this[low]';
		let optional = false;
		let last: ModelSlot | undefined;
		let held: readonly string[] = [kind];
		let pinned: readonly string[] | undefined = [kind];
		const present: PresentStep[] = [];
		for (const [i, step] of path.entries()) {
			const slot = slotOf(step);
			if (slot === undefined) return `${step.owner} has no slot ${step.slot}`;
			if (!concreteKinds(model, held).includes(step.owner) && !held.includes(step.owner)) return `steps through ${step.owner}, which ${i === 0 ? 'the read kind is not' : 'its slot does not hold'}`;
			if (held.length !== 1 || held[0] !== step.owner) {
				const owner = idOf(step.owner);
				if (owner === undefined) return `${step.owner} has no kind id`;
				if (!optional && pinned !== undefined && !pinned.includes(step.owner)) return null;
				expr = `of(${expr}, ${owner})`;
				optional ||= pinned === undefined || pinned.some((k) => k !== step.owner);
			}
			held = concreteKinds(model, slot.kinds);
			expr = `${expr}${optional ? '?.' : '.'}${slot.propertyName}()`;
			const tested: readonly string[] | undefined = optional ? undefined : sure.present(path.slice(0, i + 1));
			if (!optional) {
				const narrowed = tested !== undefined && tested.length > 0 && held.some((k) => !tested.includes(k)) ? tested.flatMap((k) => idOf(k) ?? []) : [];
				present.push({ accessor: slot.propertyName, ids: narrowed.length > 0 ? [...new Set(narrowed)].join(' | ') : 'never', tested: tested !== undefined });
			}
			optional ||= !slot.required && !slot.multiple && tested === undefined;
			pinned = tested !== undefined && tested.length > 0 ? tested : slot.required || tested !== undefined ? held : undefined;
			const final = i === path.length - 1;
			const one = step.anchor !== undefined || (final && single);
			if (slot.multiple && (!final || one)) {
				if (!one) return `steps into one of ${step.owner}'s ${step.slot} with no anchor`;
				expr = step.anchor === 'last' ? `${expr}${optional ? '?.' : '.'}at(-1)` : `${expr}${optional ? '?.' : ''}[0]`;
				optional = !final || tested === undefined;
				pinned = final ? pinned : undefined;
			}
			last = final && one ? { ...slot, multiple: false } : slot;
		}
		const through = present.findLastIndex((s) => s.tested) + 1;
		return last === undefined ? 'an empty path' : { expr, last, optional, present: present.slice(0, through), pinned };
	};
	interface RouteRead {
		readonly body: string;
		readonly list: boolean;
		readonly optional: boolean;
		readonly present: readonly PresentStep[];
	}
	const readOf = (kind: string, route: MemberRoute, sure: Guaranteed): RouteRead | { readonly reason: string } | null => {
		if (route.route === 'presence') return { reason: 'a presence member that is not a flag' };
		if (route.path === undefined) return { reason: `no path for its ${route.route} route` };
		const chain = chainOf(kind, route.path, sure, route.list === false);
		if (chain === null) return null;
		if (typeof chain === 'string') return { reason: chain };
		const { present } = chain;
		const reader = admitsEnum(chain.last) ? 'readEnum' : 'read';
		const selected = route.route === 'kind' ? route.kind : route.route === 'nested' && route.selector.kind !== null && !chain.last.multiple && admitsBeside(chain.last, route.selector.kind) ? route.selector.kind : undefined;
		if (selected !== undefined) {
			const id = idOf(selected);
			const optional = chain.optional || chain.pinned === undefined || chain.pinned.some((k) => k !== selected);
			return id === undefined ? { reason: `${selected} has no kind id` } : { body: `${reader}(of(${chain.expr}, ${id}))`, list: listsOnly({ ...chain.last, kinds: [selected] }), optional, present };
		}
		if (chain.last.storage === 'boolean') return { body: chain.expr, list: false, optional: false, present };
		const except = route.route === 'slot' ? (route.except ?? []).flatMap((k) => concreteKinds(model, [k]).flatMap((c) => idOf(c) ?? [])) : [];
		const read = except.length > 0 ? `${reader}(without(${chain.expr}, ${[...new Set(except)].join(', ')}))` : `${reader}(${chain.expr})`;
		const holdsList = chain.last.multiple || listsOnly(chain.last);
		const body = route.list === true && !holdsList ? `listed(${read})` : read;
		return { body, list: readsList(route, chain.last.multiple) || listsOnly(chain.last), optional: chain.optional, present };
	};
	interface PresentTree {
		readonly ids: string;
		readonly sub: Map<string, PresentTree>;
	}
	const presentTreeOf = (paths: readonly (readonly PresentStep[])[]): Map<string, PresentTree> => {
		const root = new Map<string, PresentTree>();
		for (const path of paths) {
			let at = root;
			for (const step of path) {
				const node = at.get(step.accessor) ?? at.set(step.accessor, { ids: step.ids, sub: new Map() }).get(step.accessor)!;
				at = node.sub;
			}
		}
		return root;
	};
	const presentTypeOf = (tree: ReadonlyMap<string, PresentTree>): string => tree.size === 0 ? '{}' : `{ ${[...tree].map(([accessor, node]) => `readonly ${accessor}: [${node.ids}, ${presentTypeOf(node.sub)}];`).join(' ')} }`;
	const memberBody = (reads: readonly RouteRead[]): string => {
		const bodies = [...new Set(reads.map((r) => r.body))];
		const last = reads.at(-1)!;
		return [...bodies, ...(reads.some((r) => r.list) && last.optional ? ['[]'] : [])].join(' ?? ');
	};

	const factoryNameOf = (entry: ReadEntry): string => `${kindIdMemberName(nodeMap, entry.kind)}As${entry.vocab.split('.').map(tsname).join('')}${entry.index > 0 ? entry.index : ''}`;
	const names = new Set<string>();
	for (const [kind, list] of entries) {
		if (textual(kind)) continue;
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
			const readsByName = new Map<string, RouteRead[]>();
			const sure = guaranteedBy(model, entry);
			for (const route of token(kind) ? [] : entry.members) {
				if (route.flag === true) continue;
				const pin = pins.get(route.name);
				const read = pin !== undefined ? { body: q(pin), list: false, optional: false, present: [] } : readOf(kind, route, sure);
				if (read === null) continue;
				if ('reason' in read) {
					unemitted.push({ kind, vocab: entry.vocab, member: route.name, reason: read.reason });
					continue;
				}
				(readsByName.get(route.name) ?? readsByName.set(route.name, []).get(route.name)!).push(read);
			}
			const tree = presentTreeOf([...readsByName.values()].flat().map((read) => read.present));
			const held = tree.size === 0 ? low : `${name}$Held`;
			if (tree.size > 0) emit(`type ${held} = Present<${low}, ${presentTypeOf(tree)}>;`, '');
			for (const [member, reads] of readsByName) {
				const fn = `${name}$${member}`;
				emit(`function ${fn}(this: Held<${held}>) {`, `\treturn ${memberBody(reads)};`, '}', '');
				fields.push(`${member}: ${fn}`);
				written.add(member);
			}
			for (const [member, facts] of declared) if (!facts.flag && facts.optional && !written.has(member)) fields.push(`${member}: none`);
			const value = valueOf(entry.vocab, kind);
			if (value !== undefined && (value !== 'text' || leafAt(entry.vocab))) fields.push(`$value: ${VALUE_READERS[value]}`);
			emit(
				`function ${name}(n: ${held}, set: readonly string[] = []): VocabViews[${q(entry.vocab)}] {`,
				`\treturn { $type: kindOf(n)${fields.map((f) => `, ${f}`).join('')}, [low]: n, [flags]: set };`,
				'}',
				''
			);
		}
	}
	emit('', ...unmappedKindsBlock(VOCABULARY_INDEX, input.grammar, nodeMap, unmappedViews));
	const grammarMap = emitGrammarMap(typedInput, exact);
	return { source: `${lines.join('\n').trimEnd()}\n`, map: grammarMap.source, unemitted, exact, unformed: grammarMap.unformed };
}
