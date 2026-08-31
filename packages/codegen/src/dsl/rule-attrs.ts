import { CHOICE } from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule, Rule, RuleBase, Multiplicity, RuleId } from '../types/rule.ts';
import { RuleWalker } from './rule-walker.ts';
import { separatorFactsEqual } from './rule-patterns.ts';

export function withAttrsFrom<R extends AnyRule>(original: AnyRule, result: R): R {
	const src = original as StampedAttrs & { id?: string };
	const { fieldName, multiplicity, separator, optionalElement, id, tokenized, immediate } = src;
	const patch: Record<string, unknown> = {};
	if (fieldName !== undefined && !Object.prototype.hasOwnProperty.call(result, 'fieldName'))
		patch['fieldName'] = fieldName;
	if (multiplicity !== undefined && !Object.prototype.hasOwnProperty.call(result, 'multiplicity'))
		patch['multiplicity'] = multiplicity;
	if (separator !== undefined && !Object.prototype.hasOwnProperty.call(result, 'separator'))
		patch['separator'] = separator;
	if (optionalElement !== undefined && !Object.prototype.hasOwnProperty.call(result, 'optionalElement'))
		patch['optionalElement'] = optionalElement;
	if (tokenized !== undefined && !Object.prototype.hasOwnProperty.call(result, 'tokenized'))
		patch['tokenized'] = tokenized;
	if (immediate !== undefined && !Object.prototype.hasOwnProperty.call(result, 'immediate'))
		patch['immediate'] = immediate;
	if (id !== undefined && !Object.prototype.hasOwnProperty.call(result, 'id')) patch['id'] = id;
	const withPatch = Object.keys(patch).length === 0 ? result : { ...result, ...patch };
	return absorbIds(withPatch, { ...original, id: original.id === withPatch.id ? undefined : original.id });
}

export function absorbIds<R extends AnyRule>(host: R, ...absorbed: readonly AnyRule[]): R {
	const ids = new Set<RuleId>(host.absorbedIds ?? []);
	for (const r of absorbed) {
		if (r.id !== undefined && r.id !== host.id) ids.add(r.id);
		for (const id of r.absorbedIds ?? []) if (id !== host.id) ids.add(id);
	}
	if (ids.size === (host.absorbedIds?.length ?? 0)) return host;
	return { ...host, absorbedIds: [...ids] };
}

export function structuralKey(rule: AnyRule): string {
	return JSON.stringify(rule, (key, value: unknown) => (key === 'id' || key === 'absorbedIds' ? undefined : value));
}

export function withKindFacts<R extends AnyRule>(result: R, source: AnyRule): R {
	const { hidden, inlinedFrom } = source;
	const patch: { hidden?: boolean; inlinedFrom?: string } = {};
	if (hidden !== undefined && result.hidden !== hidden) patch.hidden = hidden;
	if (inlinedFrom !== undefined && result.inlinedFrom === undefined) patch.inlinedFrom = inlinedFrom;
	return Object.keys(patch).length === 0 ? result : { ...result, ...patch };
}

export interface SharedArmAttrs {
	readonly fieldName?: string;
	readonly multiplicity?: Multiplicity;
	readonly nonterminal?: boolean;
	readonly separator?: Rule['separator'];
	readonly strongestMultiplicity?: Multiplicity;
}

const MULTIPLICITY_RANK: Record<Multiplicity, number> = { single: 0, optional: 1, array: 2, nonEmptyArray: 3 };

type StampedAttrs = Pick<
	RuleBase<'normalize'>,
	'fieldName' | 'multiplicity' | 'nonterminal' | 'separator' | 'optionalElement' | 'tokenized' | 'immediate'
>;

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

const RULE_ID_OWNER_PREFIX = /^rule:[^:]*:/;

export function rebaseRuleIds<R extends AnyRule>(body: R, hostId: RuleId | undefined): R {
	if (hostId === undefined) return body;
	const rebase = (r: R): R => {
		if (r.id === undefined) return r;
		const path = r.id.replace(RULE_ID_OWNER_PREFIX, '');
		return { ...r, id: path === 'root' ? hostId : `${hostId}/${path}` };
	};
	return rebase(new RuleWalker<R>().map(body, rebase));
}
