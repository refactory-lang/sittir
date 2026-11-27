import { nullaryBuilt, readableEntries, textBuilt, type PathTests, type PortableCarry } from '@sittir/common/engine';
import type { PortableBuildArm } from '@sittir/types';
import { type ModelNode, type ModelSlot } from '../../../bindings/facts.ts';
import { derive, levelSlots, type Derivation, type Scalar } from '../../../bindings/derive.ts';
import { capturedKinds, concreteKinds, entryRoutes, guaranteedBy, modelNode, readEntriesLookup, valueTokensOf, type ReadEntry } from '../../../bindings/routes.ts';
import { stringLiteral as q } from '../../../util/string-literal.ts';
import { findKindEntry, fixedTextKinds } from '../../kind-discriminant.ts';
import { heldReadsOf, type HeldReads } from './covered.ts';
import type { PortableTypedInput } from './typed.ts';

export type RawReason = Exclude<PortableCarry['reason'], 'error'>;

export interface RawArm {
	readonly kind: string;
	readonly reasons: readonly RawReason[];
}

export interface ExactSet {
	readonly arms: readonly string[];
	readonly kinds: readonly string[];
	readonly unmapped: readonly string[];
	readonly texts: readonly string[];
	readonly scalars: readonly Scalar[];
	readonly raw: readonly RawArm[];
}

export type ExactSlots = ReadonlyMap<string, ReadonlyMap<string, ExactSet>>;

const NO_TESTS: PathTests = { own: new Set(), others: new Set() };

const KIND_REASONS: ReadonlySet<RawReason> = new Set<RawReason>(['flags', 'readOnly', 'unread', 'text', 'unclaimed']);

export const rawGroupOf = (reasons: readonly RawReason[]): 'kind' | 'value' => (reasons.some((reason) => KIND_REASONS.has(reason)) ? 'kind' : 'value');

export interface ExactReads {
	readonly own: Derivation;
	readonly entries: readonly (readonly [kind: string, list: readonly ReadEntry[]])[];
	readonly readPathsOf: (list: readonly ReadEntry[]) => string[];
	readonly readPaths: ReadonlySet<string>;
	readonly entriesFor: (kind: string) => readonly ReadEntry[] | undefined;
	readonly literalTextsOf: (kind: string) => readonly string[] | undefined;
	readonly slotLevelOf: (path: string, slot: string) => string | undefined;
	readonly token: (kind: string) => boolean;
	readonly textual: (kind: string) => boolean;
	readonly textTypeOf: (kind: string) => string | undefined;
	readonly claimersOf: ReadonlyMap<string, readonly string[]>;
	readonly viewed: readonly string[];
	readonly textPaths: readonly string[];
	readonly varies: (kind: string) => boolean;
	readonly valueOf: (path: string, kind: string) => ValueRead | undefined;
	readonly viewClassOf: (kind: string) => ViewClass;
	readonly readsIn: (kinds: readonly string[]) => RouteReads;
}

export interface RouteReads {
	readonly paths: readonly string[];
	readonly texts: readonly string[];
	readonly unmapped: readonly string[];
	readonly varies: boolean;
	readonly claimed: readonly string[];
}

export type ViewClass = 'text' | 'claimed' | 'refined' | 'never' | 'token' | 'varies' | 'container' | 'unmapped';

export type ValueRead = 'text' | 'true' | 'false' | 'float' | 'integer' | 'bigint';

export function exactReadsOf({ routes, input, nodeMap, kindEntries, readTest, table, covered }: PortableTypedInput): ExactReads {
	const typed = (kind: string): boolean => findKindEntry(kindEntries, kind) !== undefined;
	const { model } = input;
	const own = derive([input]);
	const nodeOf = (kind: string): ModelNode | undefined => modelNode(model, kind);
	const entries = [...routes.readEntries].filter(([, list]) => list.length > 0).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
	const readPathsOf = (list: readonly ReadEntry[]): string[] => [
		...new Set(readableEntries(list.map((entry) => ({ entry, path: entry.vocab, within: entry.claim.within, test: readTest(entry) }))).flatMap(({ entry, path }) => (covered.has(entry) ? [] : [path])))
	];
	const readable = entries.filter(([kind]) => (nodeOf(kind)?.subtypes.length ?? 0) === 0);
	const readPaths = new Set(readable.flatMap(([, list]) => readPathsOf(list)));
	const entriesFor = readEntriesLookup(routes, model);
	const fixedText = new Map(fixedTextKinds(nodeMap, kindEntries));
	const literalTextsOf = (kind: string): readonly string[] | undefined => {
		const node = nodeOf(kind);
		if (node?.modelType === 'enum') return node.enumMembers.map((m) => m.text);
		const text = fixedText.get(kind) ?? node?.text;
		return text === null || text === undefined ? undefined : [text];
	};
	const slotLevelOf = (path: string, slot: string): string | undefined => {
		if (levelSlots(own, path).has(slot)) return path;
		const parent = own.refinements.get(path)?.parent ?? (path.includes('.') ? path.slice(0, path.lastIndexOf('.')) : undefined);
		return parent === undefined ? undefined : slotLevelOf(parent, slot);
	};
	const token = (kind: string): boolean => nodeOf(kind)?.modelType === 'enum' || fixedText.has(kind);
	const literals = valueTokensOf(routes, fixedText);
	const textual = (kind: string): boolean => token(kind) && !literals.has(kind);
	const textTypeOf = (kind: string): string | undefined => {
		const texts = literalTextsOf(kind);
		return texts === undefined ? undefined : texts.map(q).join(' | ') || 'string';
	};
	const claimersOf = new Map<string, string[]>();
	for (const [kind, list] of entries) for (const e of list) (claimersOf.get(e.vocab) ?? claimersOf.set(e.vocab, []).get(e.vocab)!).push(kind);
	const claimed = [...claimersOf.keys()].sort();
	const viewed = claimed.filter((path) => claimersOf.get(path)!.some((kind) => !textual(kind)));
	const textPaths = claimed.filter((path) => claimersOf.get(path)!.some(textual));
	const varies = (kind: string): boolean => {
		const node = nodeOf(kind);
		return node !== undefined && node.modelType !== 'enum' && (node.pattern !== null || input.textTokens.has(kind)) && !fixedText.has(kind);
	};
	const valueOf = (path: string, kind: string): ValueRead | undefined => {
		const id = findKindEntry(kindEntries, kind)?.id;
		const arms = (table.paths[path]?.arms ?? []).filter((arm) => arm.kind === id);
		const literal = arms.find((arm) => arm.literal !== undefined)?.literal;
		if (literal !== undefined) return literal.value === undefined ? undefined : literal.value ? 'true' : 'false';
		const scalar = arms.find((arm) => arm.scalar !== undefined)?.scalar;
		if (scalar !== undefined) return scalar;
		return varies(kind) ? 'text' : undefined;
	};
	const unclaimed = new Set(input.bindings.unclaimed.map((u) => u.kind));
	const viewClassOf = (kind: string): ViewClass => {
		if (textual(kind)) return 'text';
		const unwrap = routes.containers.get(kind);
		if (entriesFor(kind) !== undefined) return unwrap?.refined === true ? 'refined' : 'claimed';
		if (unclaimed.has(kind)) return 'never';
		if (textTypeOf(kind) !== undefined) return 'token';
		if (varies(kind)) return 'varies';
		return unwrap !== undefined ? 'container' : 'unmapped';
	};
	const readsIn = (kinds: readonly string[]): RouteReads => {
		const paths = new Set<string>();
		const texts = new Set<string>();
		const unmapped = new Set<string>();
		const claimed = new Set<string>();
		const seen = new Set<string>();
		let varying = false;
		const visit = (held: readonly string[]): void => {
			for (const kind of concreteKinds(model, held)) {
				const node = nodeOf(kind);
				if (node === undefined || !typed(kind) || seen.has(kind)) continue;
				seen.add(kind);
				if (node.modelType === 'enum') visit(node.enumMembers.map((m) => m.kind));
				const view = viewClassOf(kind);
				if (entriesFor(kind) !== undefined) claimed.add(kind);
				if (view === 'claimed' || view === 'refined') for (const path of readPathsOf(entriesFor(kind)!)) paths.add(path);
				if (view === 'text' || view === 'token') for (const text of literalTextsOf(kind) ?? []) texts.add(text);
				if (view === 'text') for (const path of readPathsOf(entriesFor(kind) ?? [])) paths.add(path);
				if (view === 'unmapped') unmapped.add(kind);
				if (view === 'varies') varying = true;
				if (view === 'refined' || view === 'container') {
					const unwrap = routes.containers.get(kind)!;
					for (const text of unwrap.terminals) texts.add(text);
					visit(unwrap.kinds);
				}
			}
		};
		visit(kinds);
		return { paths: [...paths].sort(), texts: [...texts].sort(), unmapped: [...unmapped].sort(), varies: varying, claimed: [...claimed].sort() };
	};
	return { own, entries, readPathsOf, readPaths, entriesFor, literalTextsOf, slotLevelOf, token, textual, textTypeOf, claimersOf, viewed, textPaths, varies, valueOf, viewClassOf, readsIn };
}

export function exactSlotsOf(input: PortableTypedInput, reads: ExactReads = exactReadsOf(input)): ExactSlots {
	const { routes, input: grammarInput, kindEntries, table, presetCarried, totalIntegerReads, freeTextClosedBy, flags } = input;
	const { model, vocabulary } = grammarInput;
	const { own, readPaths, entriesFor, readPathsOf, literalTextsOf, slotLevelOf, readsIn } = reads;
	const nodeOf = (kind: string): ModelNode | undefined => modelNode(model, kind);
	const idOf = (kind: string): number | undefined => findKindEntry(kindEntries, kind)?.id;
	const token = (kind: string): boolean => nodeOf(kind)?.modelType === 'enum' || literalTextsOf(kind) !== undefined;
	const armsOfKind = (kind: string): readonly PortableBuildArm[] => {
		const id = idOf(kind);
		const list = entriesFor(kind);
		if (id === undefined || list === undefined) return [];
		return readPathsOf(list).flatMap((path) => (table.paths[path]?.arms ?? []).filter((arm) => arm.kind === id));
	};
	const lostAt = (kind: string, heldReads: HeldReads | undefined): ReadonlyMap<string, readonly string[]> => {
		const node = nodeOf(kind);
		const id = idOf(kind);
		if (node === undefined || id === undefined) return new Map();
		const list = entriesFor(kind) ?? [];
		const tests = input.tested(id);
		const accessorOf = new Map((input.nodeMap.nodes.get(kind)?.slots ?? []).map((slot) => [slot.name, slot.propertyName] as const));
		return new Map(
			readPathsOf(list).map((path) => {
				const stepped = new Set(list.filter((entry) => entry.vocab === path).flatMap((entry) => entryRoutes(entry).flatMap((route) => (route.path ?? []).flatMap((step) => (step.owner === kind ? [step.slot] : [])))));
				const { own, others } = tests.get(path) ?? NO_TESTS;
				const lost = node.slots.filter((slot) => {
					const accessor = accessorOf.get(slot.name) ?? slot.name;
					if (heldReads !== undefined && heldReads.varied.has(slot.name) && heldReads.held.get(path)?.has(slot.name) !== true) return false;
					return !stepped.has(slot.name) && !own.has(accessor) && (others.has(accessor) || concreteKinds(model, slot.kinds).some((k) => !token(k)));
				});
				return [path, lost.map((slot) => slot.name)] as const;
			})
		);
	};
	const reasonsCache = new Map<string, readonly RawReason[]>();
	const reasonsOf = (kind: string): readonly RawReason[] => {
		const cached = reasonsCache.get(kind);
		if (cached !== undefined) return cached;
		const node = nodeOf(kind);
		const id = idOf(kind);
		const arms = armsOfKind(kind);
		const out: RawReason[] = [];
		if (node === undefined || id === undefined || token(kind)) {
			reasonsCache.set(kind, out);
			return out;
		}
		const through = node.textLeavesThrough;
		if (through.length > 0 && node.slots.every((slot) => concreteKinds(model, slot.kinds).every((k) => through.includes(k)))) {
			const leaves = [...new Set(through.flatMap(reasonsOf))];
			reasonsCache.set(kind, leaves);
			return leaves;
		}
		const held = node.slots.flatMap((slot) => concreteKinds(model, slot.kinds));
		if ((table.tokens?.[id]?.length ?? 0) > 0) out.push('opaque');
		if (held.some((k) => { const held = idOf(k); return held !== undefined && table.delimiters?.[held]?.readOnly !== undefined; })) out.push('readOnly');
		const structural = arms.filter((arm) => arm.literal === undefined);
		if ((entriesFor(kind) ?? []).some((entry) => presetCarried.has(entry))) out.push('preset');
		if (structural.some((arm) => arm.scalar !== undefined && (arm.scalar === 'float' || !totalIntegerReads.has(arm.kind)))) out.push('scalar');
		const builtWhole = structural.length > 0 && structural.every((arm) => nullaryBuilt(table, arm));
		const readsText = !builtWhole && (node.slots.length === 0 || (structural.length > 0 && structural.every((arm) => (arm.slots.length === 0 && arm.seated !== undefined) || textBuilt(table, arm))));
		if (readsText && !structural.every((arm) => textBuilt(table, arm))) out.push('text');
		const readable = new Set(structural.flatMap((arm) => arm.readableFlags ?? []));
		if ((flags.get(kind) ?? []).some((flag) => !readable.has(flag))) out.push('flags');
		if (structural.length > 0) {
			const heldReads = heldReadsOf(kind, entriesFor(kind) ?? [], input.nodeMap, input.readTest);
			if ([...lostAt(kind, heldReads).values()].some((lost) => lost.length > 0)) out.push('unread');
			if (routes.containers.get(kind)?.refined !== true && (heldReads === undefined || heldReads.unclaimed.length > 0)) out.push('unclaimed');
		}
		reasonsCache.set(kind, out);
		return out;
	};
	const carried = new Map<string, Map<string, ModelSlot[]>>();
	for (const [, unwrap] of routes.containers)
		if ((unwrap.slots?.length ?? 0) > 0)
			for (const path of readsIn(unwrap.kinds).paths)
				for (const { name, slot } of unwrap.slots!) {
					const at = carried.get(path) ?? carried.set(path, new Map()).get(path)!;
					at.set(name, [...(at.get(name) ?? []), slot]);
				}
	const routeKinds = (path: string, name: string): { readonly kinds: readonly string[]; readonly texts: readonly string[]; readonly interior: boolean } => {
		const slots = carried.get(path)?.get(name) ?? [];
		const kinds = new Set<string>(slots.flatMap((slot) => slot.kinds));
		const texts = new Set<string>(slots.flatMap((slot) => slot.terminals));
		let interior = false;
		for (const [, list] of routes.readEntries)
			for (const entry of list) {
				if (entry.vocab !== path) continue;
				const closes = new Set(freeTextClosedBy.get(entry) ?? []);
				const sure = guaranteedBy(model, entry);
				for (const route of entry.slots) {
					if (route.name !== name || route.flag === true) continue;
					const except = new Set(route.route === 'slot' ? (route.except ?? []) : []);
					const slotKinds = route.route === 'kind' ? [route.kind] : route.route === 'slot' || route.route === 'nested' ? (route.slot?.kinds ?? []).filter((k) => !except.has(k)) : [];
					const last = route.path?.at(-1);
					const owner = last === undefined ? undefined : modelNode(model, last.owner);
					const lexed = owner?.modelType === 'lexedPattern' ? owner.slots.find((at) => at.name === last?.slot) : undefined;
					if (owner?.modelType === 'lexedPattern' && lexed?.storage !== 'boolean' && lexed?.fixedTokens !== true) interior = true;
					const pinned = route.route === 'nested' ? capturedKinds(route) : null;
					const held = new Set(concreteKinds(model, slotKinds));
					const tested = route.path === undefined ? undefined : sure.present(route.path);
					const narrowed = tested !== undefined && tested.length > 0;
					const read = narrowed ? tested.filter((at) => held.has(at)) : pinned === null ? slotKinds : concreteKinds(model, pinned).filter((at) => held.has(at));
					for (const k of read) if (!closes.has(nodeOf(k)?.kind ?? k)) kinds.add(k);
					if (!narrowed && pinned === null && route.route === 'slot') for (const text of route.slot.terminals) texts.add(text);
				}
			}
		return { kinds: [...kinds].sort(), texts: [...texts].sort(), interior };
	};
	const rawAt = (claimed: readonly string[]): readonly RawArm[] =>
		claimed.flatMap((kind) => {
			const reasons = reasonsOf(kind);
			return reasons.length === 0 ? [] : [{ kind, reasons }];
		});
	const claimed = new Set([...routes.readEntries.values()].flatMap((list) => list.map((entry) => entry.vocab)));
	const out = new Map<string, Map<string, ExactSet>>();
	for (const path of [...vocabulary.kinds.keys()].filter((p) => readPaths.has(p) || claimed.has(p)).sort())
		for (const [slot, declared] of vocabulary.slots(path)) {
			if (declared.flag) continue;
			const level = slotLevelOf(path, slot);
			const { kinds: routed, texts: terminals, interior } = routeKinds(path, slot);
			if (level === undefined && routed.length === 0 && terminals.length === 0 && !interior) continue;
			const arms = level === undefined ? [] : [...levelSlots(own, level).get(slot)!.kinds];
			const read = readsIn(routed);
			const unmapped = read.unmapped.map((kind) => `${grammarInput.grammar}:${kind}`);
			const scalars: readonly Scalar[] = interior || read.varies ? ['string'] : [];
			const set: ExactSet = { arms, kinds: [...new Set(read.paths)].sort(), unmapped: [...new Set(unmapped)].sort(), texts: [...new Set([...read.texts, ...terminals])].sort(), scalars, raw: rawAt(read.claimed) };
			(out.get(path) ?? out.set(path, new Map()).get(path)!).set(slot, set);
		}
	return out;
}

