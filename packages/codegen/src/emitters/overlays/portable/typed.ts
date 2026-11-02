import { type ModelNode, type ModelSlot } from '../../../bindings/facts.ts';
import { armClass, collapsedKinds, derive, levelMembers, levelsWithMembers, soleRole, type Derivation, type MemberFacts } from '../../../bindings/derive.ts';
import { tsname } from '../../../bindings/names.ts';
import { stringLiteral as q } from '../../../util/string-literal.ts';
import { PORTABLE_TYPE_TESTS } from '../../../grammars.ts';
import { concreteKinds, guaranteedBy, modelNode, valueTokensOf, type ContainerUnwrap, type GrammarInput, type GrammarRoutes, type Guaranteed, type MemberRoute, type ReadEntry, type SlotStep } from '../../../bindings/routes.ts';
import { compositionOf, type Vocabulary } from '../../../bindings/vocabulary.ts';
import { readableEntries } from '@sittir/common/engine';
import type { PortableBuildPath, PortableCondition } from '@sittir/types';
import type { NodeMap } from '../../../compiler/types.ts';
import { fixedTextKinds, hasCatalogEntry, kindDiscriminantExpr, kindIdMemberName, type KindEnumEntry } from '../../kind-discriminant.ts';

export interface PortableTypedInput {
	readonly routes: GrammarRoutes;
	readonly input: GrammarInput;
	readonly nodeMap: NodeMap;
	readonly kindEntries: readonly KindEnumEntry[];
	readonly readTest: (entry: ReadEntry) => readonly PortableCondition[];
	readonly picks: Readonly<Record<string, PortableBuildPath>>;
}

export interface PortableTypedUnemitted {
	readonly kind: string;
	readonly vocab: string;
	readonly member?: string;
	readonly reason: string;
}

export interface PortableTypedExcludedForm {
	readonly path: string;
	readonly kind: number;
	readonly absent: readonly string[];
}

export interface PortableTypedOutput {
	readonly source: string;
	readonly unemitted: readonly PortableTypedUnemitted[];
	readonly excluded: readonly PortableTypedExcludedForm[];
}

export const PORTABLE_TYPED_FILE = 'portable.typed.ts';
export const PORTABLE_TYPED_TSCONFIG = 'tsconfig.portable.json';

export const PORTABLE_TYPED_TSCONFIG_TEXT = `${JSON.stringify({ extends: '../../../tsconfig.json', compilerOptions: { noEmit: true, types: ['node'] }, include: [PORTABLE_TYPED_FILE, `../${PORTABLE_TYPE_TESTS}`] }, null, '\t')}\n`;

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
	'type Ret<F> = F extends (...args: never[]) => infer R ? R : never;',
	'',
	'type Narrow<R, Id> = [Id] extends [never] ? NonNullable<R> : Extract<NonNullable<R>, { readonly $type: Id } | Id>;',
	'',
	'type Present<N, G> = [keyof G] extends [never] ? N : Omit<N, keyof G> & { readonly [P in keyof G & keyof N]: () => G[P] extends readonly [infer Id, infer Sub] ? Present<Narrow<Ret<N[P]>, Id>, Sub> : never };',
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
	'function none(): undefined {',
	'\treturn undefined;',
	'}',
	'',
	'function value(this: Held<unknown>): string {',
	'\treturn textOf(this[low]);',
	'}'
];

interface PathForms {
	readonly forms: readonly string[];
	readonly excluded: readonly PortableTypedExcludedForm[];
}

function formsOf(path: string, built: PortableBuildPath | undefined, base: string, required: ReadonlySet<string>): PathForms {
	const arms = (built?.arms ?? []).map((arm) => {
		const tests = arm.when.filter((test) => 'absent' in test);
		return { arm, tests, required: tests.flatMap((test) => test.required), absent: tests.flatMap((test) => test.absent) };
	});
	if (arms.length === 0 || arms.some(({ tests }) => tests.length === 0)) return { forms: [base], excluded: [] };
	const keys = (names: readonly string[]): string => (names.length === 0 ? 'never' : [...new Set(names)].sort().map(q).join(' | '));
	const kept = arms.filter(({ absent }) => !absent.some((member) => required.has(member)));
	const excluded = arms.filter((form) => !kept.includes(form)).map(({ arm, absent }) => ({ path, kind: arm.kind, absent: absent.filter((member) => required.has(member)) }));
	return { forms: [...new Set(kept.map((form) => `gate.RequiredBy<${base}, ${keys(form.required)}, ${keys(form.absent)}>`))], excluded };
}

export function emitPortableTyped({ routes, input, nodeMap, kindEntries, readTest, picks }: PortableTypedInput): PortableTypedOutput {
	const { model, vocabulary } = input;
	const unemitted: PortableTypedUnemitted[] = [];
	const excluded = new Map<string, PathForms>();
	const formsAt = (path: string, base: string): readonly string[] => {
		const declared = [...vocabulary.members(path)].flatMap(([member, facts]) => (facts.optional || facts.flag ? [] : [member]));
		const found = excluded.get(path) ?? formsOf(path, picks[path], base, new Set(declared));
		excluded.set(path, found);
		return found.forms;
	};
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
	const literals = valueTokensOf(routes, fixedText);
	const token = (kind: string): boolean => isEnum(kind) || fixedText.has(kind);
	const textual = (kind: string): boolean => token(kind) && !literals.has(kind);
	const tokenTypeOf = (kind: string): string | undefined => {
		if (isEnum(kind)) return nodeOf(kind)!.enumMembers.map((m) => q(m.text)).join(' | ') || 'string';
		const text = fixedText.get(kind) ?? nodeOf(kind)?.text;
		return text === null || text === undefined ? undefined : q(text);
	};
	const lowOf = (kind: string): string | undefined => (token(kind) ? 'TSKindId' : typeNameOf(kind) === undefined ? undefined : `T.${typeNameOf(kind)}.Parsed`);
	const aliasOf = (kind: string): string => `VK_${kindIdMemberName(nodeMap, kind)}`;

	const entries = [...routes.readEntries].filter(([, list]) => list.length > 0).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
	const claimedPaths = [...new Set(entries.flatMap(([, list]) => list.map((e) => e.vocab)))].sort();
	const claimersOf = new Map<string, string[]>();
	for (const [kind, list] of entries) for (const e of list) (claimersOf.get(e.vocab) ?? claimersOf.set(e.vocab, []).get(e.vocab)!).push(kind);

	const claimedBy = (path: string, holds: (kind: string) => boolean): boolean => (claimersOf.get(path) ?? []).some(holds);
	const viewed = claimedPaths.filter((path) => claimedBy(path, (kind) => !textual(kind)));
	const textPaths = claimedPaths.filter((path) => claimedBy(path, textual));
	const roleArmsOf = (path: string): readonly string[] => [
		...(viewed.includes(path) ? formsAt(path, interfaceOf(path)) : []),
		...(textPaths.includes(path) ? [`Ctx['texts'][${q(path)}]`] : [])
	];

	const slotOf = (step: SlotStep): ModelSlot | undefined => nodeOf(step.owner)?.slots.find((s) => s.name === step.slot);
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
	const listsOnly = (slot: ModelSlot): boolean => {
		const held = concreteKinds(model, slot.kinds);
		return held.length > 0 && held.every((k) => entriesFor(k) === undefined && (nodeOf(k)?.modelType === 'list' || routes.containers.get(k)?.list === true));
	};
	interface View {
		readonly type: string;
		readonly elements?: readonly string[];
		readonly unmapped?: true;
	}
	const containerView = (node: ModelNode, unwrap: ContainerUnwrap): View => {
		const slot = node.slots.find((s) => s.name === unwrap.slot);
		const elements = refsOf(unwrap.kinds, unwrap.terminals);
		if (unwrap.list || slot?.multiple === true) return { type: `readonly (${elements})[]`, elements: unwrap.kinds };
		return { type: slot !== undefined && (slot.required || listsOnly(slot)) ? elements : `${elements} | undefined`, elements: unwrap.kinds };
	};
	const viewOf = (node: ModelNode): View => {
		if (textual(node.kind)) return { type: tokenTypeOf(node.kind)! };
		const claimed = entriesFor(node.kind);
		const unwrap = routes.containers.get(node.kind);
		if (claimed !== undefined) {
			const type = [...new Set(readableEntries(claimed.map((entry) => ({ path: entry.vocab, within: entry.claim.within, test: readTest(entry) }))).map(({ path }) => `VocabViews[${q(path)}]`))].join(' | ');
			if (unwrap?.refined !== true) return { type };
			const contained = containerView(node, unwrap);
			return { ...contained, type: `${type} | ${contained.type}` };
		}
		if (unclaimed.has(node.kind)) return { type: 'never' };
		const text = tokenTypeOf(node.kind);
		if (text !== undefined) return { type: text };
		if (varies(node.kind)) return { type: `{ readonly $type: ${idOf(node.kind)}; readonly $value: () => string }` };
		if (unwrap !== undefined) return containerView(node, unwrap);
		return { type: unmappedOf(node.kind), unmapped: true };
	};
	const unmappedIn = (kinds: readonly string[], seen = new Set<string>()): readonly string[] =>
		concreteKinds(model, kinds).flatMap((kind) => {
			const node = nodeOf(kind);
			if (node === undefined || !typed.has(kind) || seen.has(kind)) return [];
			seen.add(kind);
			const view = viewOf(node);
			return view.unmapped === true ? [kind] : unmappedIn(view.elements ?? [], seen);
		});
	const unmappedOf = (kind: string): string => `V.Unmapped<'${input.grammar}:${kind.replace(/^_+/, '')}'>`;
	const unmapped = new Map<string, Map<string, Set<string>>>();
	for (const [kind, list] of entries) {
		if (token(kind)) continue;
		for (const entry of list)
			for (const route of entry.members) {
				if (route.flag === true || (route.route !== 'slot' && route.route !== 'nested') || route.path === undefined) continue;
				const last = route.path.at(-1);
				const slot = last === undefined ? undefined : slotOf(last);
				if (slot === undefined) continue;
				const except = new Set(route.route === 'slot' ? (route.except ?? []) : []);
				const kinds = unmappedIn(slot.kinds.filter((k) => !except.has(k)));
				if (kinds.length === 0) continue;
				const namespace = entry.vocab.split('.')[0]!;
				const members = unmapped.get(namespace) ?? unmapped.set(namespace, new Map()).get(namespace)!;
				const held = members.get(route.name) ?? members.set(route.name, new Set()).get(route.name)!;
				for (const k of kinds) held.add(unmappedOf(k));
			}
	}

	const own = derive([input]);
	const lines: string[] = [];
	const emit = (...out: string[]): void => void lines.push(...out);
	emit(
		'// Auto-generated by @sittir/codegen — do not edit',
		'',
		"import type * as V from '../../types/src/vocabulary/index.ts';",
		"import type { Flag } from '../../types/src/vocabulary/utils.ts';",
		"import type * as gate from '../../types/src/vocabulary/utils.ts';",
		"import type * as T from '../src/types.ts';",
		"import { TSKindId } from '../src/kinds.ts';",
		"import type { PortableTexts } from '../src/portable.ts';",
		''
	);

	emit(...contextOf({ grammar: input.grammar, own, vocabulary, claimedPaths, roleArmsOf, textPaths, unmapped, slotArm: slotArmOf(own, vocabulary, model, tokenTypeOf, formsAt) }), '');
	emit(...PRELUDE, '');

	emit('export interface VocabViews {');
	for (const path of viewed) {
		const leaf = (claimersOf.get(path) ?? []).every(varies);
		emit(`\t${q(path)}: ViewForm<${interfaceOf(path)}>${leaf ? ' & PortableLeaf' : ''};`);
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
	const chainOf = (kind: string, path: readonly SlotStep[], sure: Guaranteed): Chain | string | null => {
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
			const listed = nodeOf(step.owner)?.modelType === 'list' && slot.multiple;
			if (!listed) expr = `${expr}${optional ? '?.' : '.'}${slot.propertyName}()`;
			const tested: readonly string[] | undefined = optional || listed ? undefined : sure.present(path.slice(0, i + 1));
			if (!optional && !listed) {
				const narrowed = tested !== undefined && tested.length > 0 && held.some((k) => !tested.includes(k)) ? tested.flatMap((k) => idOf(k) ?? []) : [];
				present.push({ accessor: slot.propertyName, ids: narrowed.length > 0 ? [...new Set(narrowed)].join(' | ') : 'never', tested: tested !== undefined });
			}
			optional ||= !slot.required && !slot.multiple && tested === undefined;
			pinned = tested !== undefined && tested.length > 0 ? tested : slot.required || tested !== undefined ? held : undefined;
			const final = i === path.length - 1;
			if (slot.multiple && (!final || step.anchor !== undefined)) {
				if (step.anchor === undefined) return `steps into one of ${step.owner}'s ${step.slot} with no anchor`;
				expr = step.anchor === 'last' ? `${expr}${optional ? '?.' : '.'}at(-1)` : `${expr}${optional ? '?.' : ''}[0]`;
				optional = !final || tested === undefined;
				pinned = final ? pinned : undefined;
			}
			last = final && step.anchor !== undefined ? { ...slot, multiple: false } : slot;
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
		const chain = chainOf(kind, route.path, sure);
		if (chain === null) return null;
		if (typeof chain === 'string') return { reason: chain };
		const { present } = chain;
		const reader = admitsEnum(chain.last) ? 'readEnum' : 'read';
		if (route.route === 'kind') {
			const id = idOf(route.kind);
			const optional = chain.optional || chain.pinned === undefined || chain.pinned.some((k) => k !== route.kind);
			return id === undefined ? { reason: `${route.kind} has no kind id` } : { body: `${reader}(of(${chain.expr}, ${id}))`, list: listsOnly({ ...chain.last, kinds: [route.kind] }), optional, present };
		}
		if (chain.last.storage === 'boolean') return { body: chain.expr, list: false, optional: false, present };
		const except = route.route === 'slot' ? (route.except ?? []).flatMap((k) => concreteKinds(model, [k]).flatMap((c) => idOf(c) ?? [])) : [];
		const body = except.length > 0 ? `${reader}(without(${chain.expr}, ${[...new Set(except)].join(', ')}))` : `${reader}(${chain.expr})`;
		return { body, list: chain.last.multiple || listsOnly(chain.last), optional: chain.optional, present };
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
			if (varies(kind) && (claimersOf.get(entry.vocab) ?? []).every(varies)) fields.push('$value: value');
			emit(
				`function ${name}(n: ${held}, set = 0): VocabViews[${q(entry.vocab)}] {`,
				`\treturn { $type: kindOf(n)${fields.map((f) => `, ${f}`).join('')}, [low]: n, [flags]: set };`,
				'}',
				''
			);
		}
	}
	return { source: `${lines.join('\n').trimEnd()}\n`, unemitted, excluded: [...excluded.values()].flatMap((found) => found.excluded) };
}

interface ContextInput {
	readonly grammar: string;
	readonly own: Derivation;
	readonly vocabulary: Vocabulary;
	readonly claimedPaths: readonly string[];
	readonly roleArmsOf: (path: string) => readonly string[];
	readonly textPaths: readonly string[];
	readonly unmapped: ReadonlyMap<string, ReadonlyMap<string, ReadonlySet<string>>>;
	readonly slotArm: (kind: string) => string;
}

function contextOf({ grammar, own, vocabulary, claimedPaths, roleArmsOf, textPaths, unmapped, slotArm }: ContextInput): string[] {
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
		"type Texts = V.GrammarContext<Ctx>['texts'];",
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
	const ctx = [
		`export interface Ctx extends V.GrammarContext<Ctx>, V.${compositionOf(grammar)} {`,
		'\treadonly texts: { readonly [P in keyof Texts]: P extends keyof PortableTexts ? PortableTexts[P] : never };'
	];
	for (const ns of namespaces) {
		const paths = claimedPaths.filter((p) => p === ns || p.startsWith(`${ns}.`));
		const text = [...new Set([...(roleText.get(ns) ?? [])].map(slotArm))].sort();
		if (text.length > 0) roles.push(`type Role${roles.length} = Fit<${text.join(' | ')}, V.GrammarContext<Ctx>[${q(ns)}]>;`);
		const arms = paths.flatMap(roleArmsOf);
		ctx.push(`\treadonly ${ns}: ${arms.length > 0 ? arms.join(' | ') : 'never'};`);
	}
	const seats = [...unmapped].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
	ctx.push(
		seats.length === 0 ? '\treadonly unmapped: {};' : '\treadonly unmapped: {',
		...seats.flatMap(([path, members]) => [`\t\treadonly ${q(path)}: {`, ...[...members].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([member, kinds]) => `\t\t\treadonly ${member}: ${[...kinds].sort().join(' | ')};`), '\t\t};']),
		...(seats.length === 0 ? [] : ['\t};'])
	);
	const keyed = textPaths.length > 0 ? [`type TextKeys = Fit<${textPaths.map(q).join(' | ')}, keyof Texts>;`] : [];
	const seated = seats.length > 0 ? [`type UnmappedKeys = Fit<${seats.map(([namespace]) => q(namespace)).join(' | ')}, V.NamespaceOf<keyof Slots>>;`] : [];
	out.push('}', '', ...fits, ...roles, ...keyed, ...seated, '', ...ctx, '}');
	return out;
}

function slotArmOf(
	own: Derivation,
	vocabulary: Vocabulary,
	model: GrammarInput['model'],
	tokenTypeOf: (kind: string) => string | undefined,
	formsAt: (path: string, base: string) => readonly string[]
): (kind: string) => string {
	const patterns = new Set([...model.values()].flatMap((n) => (n.pattern === null ? [] : [n.pattern])));
	const qname = (path: string): string => vocabulary.kinds.get(path)?.name ?? path;
	const setOf = (path: string): string => {
		const forms = [...vocabulary.kinds.keys()]
			.filter((member) => member === path || member.startsWith(`${path}.`))
			.sort()
			.map((member) => ({ base: `V.${qname(member)}<Ctx>`, forms: formsAt(member, `V.${qname(member)}<Ctx>`) }));
		return forms.every(({ base, forms: [only, ...rest] }) => only === base && rest.length === 0) ? `V.${qname(path)}.Any<Ctx>` : forms.flatMap(({ forms: arms }) => arms).join(' | ');
	};
	return (k) => {
		switch (armClass(k)) {
			case 'scalar':
				return k;
			case 'role':
				return `Ctx['${k}']`;
			case 'unmapped':
				return `V.Unmapped<'${k.slice(1, -1)}'>`;
			case 'ref':
				return k.startsWith('set:') ? setOf(k.slice(4)) : formsAt(k, `V.${qname(k)}<Ctx>`).join(' | ');
			case 'text': {
				if (k.startsWith('literal:')) return tokenTypeOf(k.slice(8)) ?? 'string';
				return patterns.has(k.slice(5)) ? 'string' : q(k.slice(5));
			}
		}
	};
}
