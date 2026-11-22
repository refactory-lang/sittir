import { CHOICE, SEQ } from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule, PhaseName, Rule, RuleBase, Multiplicity, RuleId, RuleAnnotations, SeqRule } from '../types/rule.ts';
import { RuleWalker } from './rule-walker.ts';
import { separatorFactsEqual } from './rule-patterns.ts';
import { rebasedRuleId, reownedRuleId } from '../compiler/rule-catalog.ts';

const STAMPED_ATTRS = ['fieldName', 'multiplicity', 'separator', 'optionalElement', 'tokenized', 'immediate'] as const;
const SEQ_IDENTITY_KEYS: ReadonlySet<string> = new Set(['type', 'members', 'id', 'absorbedIds']);
const withoutIdentityKeys = (key: string, value: unknown): unknown => (key === 'id' || key === 'absorbedIds' ? undefined : value);

export function withAttrsFrom<R extends AnyRule>(original: AnyRule, result: R): R {
	const src = original as StampedAttrs & { id?: string };
	const { id } = src;
	const patch: Record<string, unknown> = {};
	for (const attr of STAMPED_ATTRS) {
		if (src[attr] !== undefined && !Object.prototype.hasOwnProperty.call(result, attr)) patch[attr] = src[attr];
	}
	if (id !== undefined && !Object.prototype.hasOwnProperty.call(result, 'id')) patch['id'] = id;
	const withPatch = Object.keys(patch).length === 0 ? result : { ...result, ...patch };
	return absorbIds(withPatch, { ...original, id: original.id === withPatch.id ? undefined : original.id });
}

export function absorbIds<R extends AnyRule>(host: R, ...absorbed: readonly AnyRule[]): R {
	return withAbsorbedIds(
		host,
		absorbed.flatMap((r) => [...(r.id === undefined ? [] : [r.id]), ...(r.absorbedIds ?? [])])
	);
}

export function absorbDroppedIds<R extends AnyRule>(result: R, ...inputs: readonly AnyRule[]): R {
	const kept = new Set(ruleIdsWithin(result));
	return withAbsorbedIds(
		result,
		inputs.flatMap(ruleIdsWithin).filter((id) => !kept.has(id))
	);
}

function withAbsorbedIds<R extends AnyRule>(host: R, absorbed: readonly RuleId[]): R {
	const ids = new Set<RuleId>(host.absorbedIds ?? []);
	for (const id of absorbed) if (id !== host.id) ids.add(id);
	if (ids.size === (host.absorbedIds?.length ?? 0)) return host;
	return { ...host, absorbedIds: [...ids] };
}

const idWalker = new RuleWalker();

export function ruleIdsWithin(rule: AnyRule): RuleId[] {
	return [
		...(rule.id === undefined ? [] : [rule.id]),
		...(rule.absorbedIds ?? []),
		...idWalker.childrenOf(rule).flatMap(ruleIdsWithin)
	];
}

type RuleBag = {
	readonly members?: readonly AnyRule[];
	readonly content?: AnyRule;
	readonly separator?: { readonly value: AnyRule };
};

export function factoredSeqOf<T extends PhaseName>([members, arms]: readonly [Rule<T>[], readonly SeqRule<T>[]]): Rule<T> {
	return armsAreCopies(arms) ? { ...arms[0]!, members } : absorbIds({ type: SEQ, ...sharedSeqFacts(arms), members }, ...arms);
}

function armsAreCopies(arms: readonly AnyRule[]): boolean {
	const ids = new Set(arms.map((arm) => arm.id));
	return arms.length > 0 && ids.size === 1 && !ids.has(undefined);
}

type RuleFacts = Readonly<Record<string, unknown>>;

function factEqual(fact: string, [a, b]: readonly [RuleFacts, RuleFacts]): boolean {
	return fact === 'separator'
		? separatorFactsEqual(a['separator'] as Rule['separator'], b['separator'] as Rule['separator'])
		: JSON.stringify(a[fact], withoutIdentityKeys) === JSON.stringify(b[fact], withoutIdentityKeys);
}

export function sharedSeqFacts(arms: readonly AnyRule[]): RuleFacts | undefined {
	const seqs = arms.filter((arm) => arm.type === SEQ) as readonly RuleFacts[];
	const first = seqs[0] ?? {};
	const shared: Record<string, unknown> = {};
	for (const fact of new Set(seqs.flatMap((seq) => Object.keys(seq).filter((key) => !SEQ_IDENTITY_KEYS.has(key))))) {
		if (!(arms as readonly RuleFacts[]).every((arm) => factEqual(fact, [arm, first]))) return undefined;
		if (first[fact] !== undefined) shared[fact] = first[fact];
	}
	return shared;
}

export function armsCanFactor(choice: AnyRule, arms: readonly AnyRule[]): boolean {
	const shared = sharedSeqFacts(arms);
	if (shared === undefined) return false;
	const repeated = shared['multiplicity'] === 'array' || shared['multiplicity'] === 'nonEmptyArray';
	if (repeated && !armsAreCopies(arms)) return false;
	const own = choice as RuleFacts;
	return STAMPED_ATTRS.every((attr) => own[attr] === undefined || shared[attr] === undefined || factEqual(attr, [own, shared]));
}

export function nonPositionFactsOf(rule: object): RuleFacts {
	const rest: Record<string, unknown> = { ...rule };
	for (const key of ['type', 'members', ...STAMPED_ATTRS]) delete rest[key];
	return rest;
}

export function absorbAlignedIds<R extends AnyRule>(host: R, ...absorbed: readonly AnyRule[]): R {
	const merged = absorbIds(host, ...absorbed);
	const bag = merged as RuleBag;
	const others = absorbed as readonly RuleBag[];
	const patch: { members?: AnyRule[]; content?: AnyRule; separator?: { readonly value: AnyRule } } = {};
	if (Array.isArray(bag.members)) {
		const members = bag.members.map((member, k) =>
			absorbAlignedIds(
				member,
				...others.flatMap((other) => (other.members?.length === bag.members!.length ? [other.members[k]!] : []))
			)
		);
		if (members.some((member, k) => member !== bag.members![k])) patch.members = members;
	} else if (bag.content !== undefined && typeof bag.content === 'object') {
		const content = absorbAlignedIds(
			bag.content,
			...others.flatMap((other) => (other.content === undefined ? [] : [other.content]))
		);
		if (content !== bag.content) patch.content = content;
	}
	if (bag.separator !== undefined) {
		const value = absorbAlignedIds(
			bag.separator.value,
			...others.flatMap((other) => (other.separator === undefined ? [] : [other.separator.value]))
		);
		if (value !== bag.separator.value) patch.separator = { ...bag.separator, value };
	}
	return Object.keys(patch).length === 0 ? merged : ({ ...merged, ...patch } as R);
}

export function structuralKey(rule: AnyRule): string {
	return JSON.stringify(rule, withoutIdentityKeys);
}

export function withKindFacts<R extends AnyRule>(result: R, source: AnyRule): R {
	const { hidden, inlinedFrom, annotations } = source;
	const patch: { hidden?: boolean; inlinedFrom?: string; annotations?: RuleAnnotations } = {};
	if (hidden !== undefined && result.hidden !== hidden) patch.hidden = hidden;
	if (inlinedFrom !== undefined && result.inlinedFrom === undefined) patch.inlinedFrom = inlinedFrom;
	if (annotations !== undefined && result.annotations !== annotations) {
		const merged = { ...result.annotations, ...annotations };
		if (JSON.stringify(merged) !== JSON.stringify(result.annotations)) patch.annotations = merged;
	}
	return Object.keys(patch).length === 0 ? result : { ...result, ...patch };
}

export function factoredAtRoot<R extends AnyRule>(rule: R, factor: (bare: R) => R): R {
	const { hidden, annotations, ...rest } = rule;
	const bare = rest as unknown as R;
	const factored = factor(bare);
	if (structuralKey(factored) === structuralKey(bare)) return rule;
	const isInnerChoice = (node: AnyRule): boolean => (node.type === CHOICE && node.id === rule.id) || idWalker.childrenOf(node).some(isInnerChoice);
	const onInnerChoice = rule.id !== undefined && idWalker.childrenOf(factored).some(isInnerChoice);
	const kindFacts = { type: rule.type, hidden, annotations, ...(onInnerChoice ? {} : { inlinedFrom: rule.inlinedFrom }) } as AnyRule;
	return withKindFacts(factored, kindFacts);
}

export interface SharedArmAttrs {
	readonly fieldName?: string;
	readonly multiplicity?: Multiplicity;
	readonly nonterminal?: boolean;
	readonly separator?: Rule['separator'];
	readonly strongestMultiplicity?: Multiplicity;
}

const MULTIPLICITY_RANK: Record<Multiplicity, number> = { single: 0, optional: 1, array: 2, nonEmptyArray: 3 };

type StampedAttrs = Pick<RuleBase<'normalize'>, (typeof STAMPED_ATTRS)[number] | 'nonterminal'>;

function armsOf(rule: AnyRule): readonly AnyRule[] {
	if (rule.type === CHOICE) return rule.members;
	return [];
}

export function sharedArmAttrs(rule: AnyRule): SharedArmAttrs {
	const arms = armsOf(rule);
	if (arms.length === 0) return {};
	const a0 = arms[0]! as StampedAttrs;
	const stamped = (r: AnyRule): StampedAttrs => r as StampedAttrs;
	const unanimous = <T>(get: (r: StampedAttrs) => T): T | undefined => {
		const v = get(a0);
		return v !== undefined && arms.every((m) => get(stamped(m)) === v) ? v : undefined;
	};
	const sep0 = a0.separator;
	const separator =
		sep0 !== undefined && arms.every((m) => separatorFactsEqual(stamped(m).separator, sep0)) ? sep0 : undefined;
	let strongestMultiplicity: Multiplicity | undefined;
	for (const arm of arms) {
		const m = stamped(arm).multiplicity;
		if (m === undefined || m === 'single') continue;
		if (strongestMultiplicity === undefined || MULTIPLICITY_RANK[m] > MULTIPLICITY_RANK[strongestMultiplicity])
			strongestMultiplicity = m;
	}
	return {
		fieldName: unanimous((r) => r.fieldName),
		multiplicity: unanimous((r) => r.multiplicity),
		nonterminal: unanimous((r) => r.nonterminal) === true ? true : undefined,
		separator,
		strongestMultiplicity
	};
}

export function withId<R extends AnyRule>(rule: R, id: RuleId | undefined): R {
	return id !== undefined ? { ...rule, id } : rule;
}

export function reownRuleIds<R extends AnyRule>(body: R, owner: string): R {
	const reown = (r: R): R => (r.id === undefined ? r : { ...r, id: reownedRuleId(r.id, owner) });
	return reown(new RuleWalker<R>().map(body, reown));
}

export function rebaseRuleIds<R extends AnyRule>(body: R, hostId: RuleId | undefined): R {
	if (hostId === undefined) return body;
	const rebase = (r: R): R => (r.id === undefined ? r : { ...r, id: rebasedRuleId(r.id, hostId) });
	return rebase(new RuleWalker<R>().map(body, rebase));
}
