import { readableEntries, textBuilt, type PortableCarry } from '@sittir/common/engine';
import type { PortableBuildArm } from '@sittir/types';
import { type ModelNode } from '../../../bindings/facts.ts';
import { armClass, derive, isScalar, levelMembers, type Derivation, type MemberFacts, type Scalar } from '../../../bindings/derive.ts';
import { concreteKinds, modelNode, type ReadEntry } from '../../../bindings/routes.ts';
import { findKindEntry, fixedTextKinds } from '../../kind-discriminant.ts';
import type { PortableTypedInput } from './typed.ts';

export type RawReason = Exclude<PortableCarry['reason'], 'unclaimed'>;

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

const KIND_REASONS: ReadonlySet<RawReason> = new Set<RawReason>(['flags', 'readOnly', 'unread', 'text']);

export const rawGroupOf = (reasons: readonly RawReason[]): 'kind' | 'value' => (reasons.some((reason) => KIND_REASONS.has(reason)) ? 'kind' : 'value');

export interface ExactReads {
	readonly own: Derivation;
	readonly entries: readonly (readonly [kind: string, list: readonly ReadEntry[]])[];
	readonly readPathsOf: (list: readonly ReadEntry[]) => string[];
	readonly readPaths: ReadonlySet<string>;
	readonly readsByClaim: ReadonlyMap<string, ReadonlySet<string>>;
	readonly entriesFor: (kind: string) => readonly ReadEntry[] | undefined;
	readonly literalTextsOf: (kind: string) => readonly string[] | undefined;
	readonly memberKindsOf: (path: string, member: string) => ReadonlySet<string> | undefined;
	readonly familyOf: (path: string) => readonly string[];
}

export function exactReadsOf({ routes, input, nodeMap, kindEntries, readTest }: PortableTypedInput): ExactReads {
	const { model, vocabulary } = input;
	const own = derive([input]);
	const nodeOf = (kind: string): ModelNode | undefined => modelNode(model, kind);
	const entries = [...routes.readEntries].filter(([, list]) => list.length > 0).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
	const readPathsOf = (list: readonly ReadEntry[]): string[] => [...new Set(readableEntries(list.map((entry) => ({ path: entry.vocab, within: entry.claim.within, test: readTest(entry) }))).map(({ path }) => path))];
	const readable = entries.filter(([kind]) => (nodeOf(kind)?.subtypes.length ?? 0) === 0);
	const readPaths = new Set(readable.flatMap(([, list]) => readPathsOf(list)));
	const readsByClaim = new Map<string, Set<string>>();
	for (const [, list] of readable) {
		const reads = readPathsOf(list);
		for (const { vocab } of list)
			for (const path of reads.filter((read) => read === vocab || read.startsWith(`${vocab}.`))) (readsByClaim.get(vocab) ?? readsByClaim.set(vocab, new Set()).get(vocab)!).add(path);
	}
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
	const fixedText = new Map(fixedTextKinds(nodeMap, kindEntries));
	const literalTextsOf = (kind: string): readonly string[] | undefined => {
		const node = nodeOf(kind);
		if (node?.modelType === 'enum') return node.enumMembers.map((m) => m.text);
		const text = fixedText.get(kind) ?? node?.text;
		return text === null || text === undefined ? undefined : [text];
	};
	const memberKindsOf = (path: string, member: string): ReadonlySet<string> | undefined => {
		const facts: MemberFacts | undefined = levelMembers(own, path).get(member);
		if (facts !== undefined) return facts.kinds;
		const parent = own.refinements.get(path)?.parent ?? (path.includes('.') ? path.slice(0, path.lastIndexOf('.')) : undefined);
		return parent === undefined ? undefined : memberKindsOf(parent, member);
	};
	const familyOf = (path: string): readonly string[] => [...vocabulary.kinds.keys()].filter((member) => member === path || member.startsWith(`${path}.`)).sort();
	return { own, entries, readPathsOf, readPaths, readsByClaim, entriesFor, literalTextsOf, memberKindsOf, familyOf };
}

export function exactSlotsOf(input: PortableTypedInput, reads: ExactReads = exactReadsOf(input)): ExactSlots {
	const { routes, input: grammarInput, kindEntries, table, flags } = input;
	const { model, vocabulary } = grammarInput;
	const { readPaths, readsByClaim, entriesFor, readPathsOf, literalTextsOf, memberKindsOf, familyOf } = reads;
	const nodeOf = (kind: string): ModelNode | undefined => modelNode(model, kind);
	const idOf = (kind: string): number | undefined => findKindEntry(kindEntries, kind)?.id;
	const pathsOfArm = (k: string): readonly string[] => {
		if (k.startsWith('set:')) return familyOf(k.slice(4)).filter((p) => readPaths.has(p));
		if (armClass(k) === 'role') return [...readPaths].filter((p) => p === k || p.startsWith(`${k}.`)).sort();
		if (readPaths.has(k)) return [k];
		const claimed = readsByClaim.get(k);
		return claimed !== undefined ? [...claimed].sort() : familyOf(k).filter((p) => readPaths.has(p));
	};
	const token = (kind: string): boolean => nodeOf(kind)?.modelType === 'enum' || literalTextsOf(kind) !== undefined;
	const armsOfKind = (kind: string): readonly PortableBuildArm[] => {
		const id = idOf(kind);
		const list = entriesFor(kind);
		if (id === undefined || list === undefined) return [];
		return readPathsOf(list).flatMap((path) => (table.paths[path]?.arms ?? []).filter((arm) => arm.kind === id));
	};
	const reached = (kind: string): ReadonlySet<string> => {
		const out = new Set<string>();
		for (const entry of entriesFor(kind) ?? []) {
			for (const route of entry.members) for (const step of route.path ?? []) if (step.owner === kind) out.add(step.slot);
			for (const slot of [...entry.pins.map((pin) => pin.slot), ...entry.absent, ...entry.present]) out.add(slot);
		}
		return out;
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
		const held = node.slots.flatMap((slot) => concreteKinds(model, slot.kinds));
		if ((table.tokens?.[id]?.length ?? 0) > 0) out.push('opaque');
		if (held.some((k) => { const held = idOf(k); return held !== undefined && table.delimiters?.[held]?.readOnly !== undefined; })) out.push('readOnly');
		const structural = arms.filter((arm) => arm.literal === undefined);
		if (arms.some((arm) => arm.presets.length > 0)) out.push('preset');
		if (structural.some((arm) => arm.scalar !== undefined)) out.push('scalar');
		const readsText = node.slots.length === 0 || (structural.length > 0 && structural.every((arm) => (arm.members.length === 0 && arm.seated !== undefined) || textBuilt(table, arm)));
		if (structural.some((arm) => arm.content !== undefined) || (readsText && !structural.every((arm) => textBuilt(table, arm)))) out.push('text');
		const buildable = new Set(structural.flatMap((arm) => [...Object.keys(arm.flags), ...arm.when.flatMap((test) => ('flag' in test ? [test.flag] : []))]));
		if ((flags.get(kind) ?? []).some((flag) => !buildable.has(flag))) out.push('flags');
		const touched = reached(kind);
		if (structural.length > 0 && node.slots.some((slot) => !touched.has(slot.name) && concreteKinds(model, slot.kinds).some((k) => !token(k)))) out.push('unread');
		reasonsCache.set(kind, out);
		return out;
	};
	const rawAt = (path: string, member: string): readonly RawArm[] => {
		const kinds = new Set<string>();
		for (const [, list] of routes.readEntries)
			for (const entry of list) {
				if (entry.vocab !== path && !entry.vocab.startsWith(`${path}.`)) continue;
				for (const route of entry.members) {
					if (route.name !== member || route.flag === true) continue;
					const except = new Set(route.route === 'slot' ? (route.except ?? []) : []);
					const slotKinds = route.route === 'kind' ? [route.kind] : route.route === 'slot' || route.route === 'nested' ? (route.slot?.kinds ?? []).filter((k) => !except.has(k)) : [];
					for (const k of concreteKinds(model, slotKinds)) if (entriesFor(k) !== undefined) kinds.add(k);
				}
			}
		return [...kinds].sort().flatMap((kind) => {
			const reasons = reasonsOf(kind);
			return reasons.length === 0 ? [] : [{ kind, reasons }];
		});
	};
	const out = new Map<string, Map<string, ExactSet>>();
	for (const path of [...vocabulary.kinds.keys()].filter((p) => readPaths.has(p)).sort())
		for (const [member, declared] of vocabulary.members(path)) {
			if (declared.flag) continue;
			const held = memberKindsOf(path, member);
			if (held === undefined) continue;
			const arms = [...held];
			const kinds = new Set<string>();
			const unmapped: string[] = [];
			const texts = new Set<string>();
			const scalars = new Set<Scalar>();
			for (const k of arms)
				switch (armClass(k)) {
					case 'scalar':
						if (isScalar(k)) scalars.add(k);
						break;
					case 'unmapped':
						unmapped.push(k.slice(1, -1));
						break;
					case 'text': {
						const literal = k.startsWith('literal:') ? literalTextsOf(k.slice(8)) : [k.slice(5)];
						if (literal === undefined || literal.length === 0) scalars.add('string');
						else for (const t of literal) texts.add(t);
						break;
					}
					default:
						for (const p of pathsOfArm(k)) kinds.add(p);
				}
			const set: ExactSet = { arms, kinds: [...kinds].sort(), unmapped: unmapped.sort(), texts: [...texts].sort(), scalars: [...scalars].sort(), raw: rawAt(path, member) };
			(out.get(path) ?? out.set(path, new Map()).get(path)!).set(member, set);
		}
	return out;
}

