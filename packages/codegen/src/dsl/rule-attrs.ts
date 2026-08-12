/**
 * compiler/rule-attrs.ts — shared attr-preservation helpers.
 *
 * `withAttrsFrom` is used by every collapse site that discards a structural
 * wrapper (seq / choice) in favour of a single survivor. Originally local to
 * simplify.ts; it lives here so normalize.ts's `collapseWrappers` and
 * simplify.ts's `canonicalizeSeqOfLeaves` use the SAME implementation, and
 * future collapse sites can't drift apart. (`combineMultiplicity`, its usual
 * companion at those sites, lives in `dsl/rule-transforms.ts`.)
 */

import { CHOICE } from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule, Rule, RuleBase, Multiplicity } from '../types/rule.ts';
import { separatorFactsEqual } from './list-patterns.ts';

export function withAttrsFrom<R extends AnyRule>(original: AnyRule, result: R): R {
	// `original` may be a wrapper-bearing (evaluate/link) rule where these
	// stamped leaf attrs aren't part of the type yet (they're populated by
	// `applyWrapperDeletion` during Normalize) — but `collapseWrappers`
	// (normalize.ts, pre-Normalize) legitimately calls this with `Rule<'link'>`
	// wrapper nodes that already carry link-lifted attrs defensively. Read
	// structurally rather than narrowing the param type, matching the
	// established pattern (see `findRepeatFlag` in dsl/rule-transforms.ts).
	const src = original as StampedAttrs & { id?: string };
	const { fieldName, multiplicity, separator, optionalElement, id } = src;
	const patch: Record<string, unknown> = {};
	if (fieldName !== undefined && !Object.prototype.hasOwnProperty.call(result, 'fieldName'))
		patch['fieldName'] = fieldName;
	if (multiplicity !== undefined && !Object.prototype.hasOwnProperty.call(result, 'multiplicity'))
		patch['multiplicity'] = multiplicity;
	if (separator !== undefined && !Object.prototype.hasOwnProperty.call(result, 'separator'))
		patch['separator'] = separator;
	// `nonterminal` is deliberately NOT transferred: every survivor a collapse
	// site produces is intrinsically nonterminal (isSlotNode's structural
	// fallback covers it). `optionalElement` has no structural fallback — the
	// deleted-wrapper fact would die with the discarded node.
	if (optionalElement !== undefined && !Object.prototype.hasOwnProperty.call(result, 'optionalElement'))
		patch['optionalElement'] = optionalElement;
	// Preserve the rule's identity through collapse: renderRule.id === collapsedRule.id
	// so the emitter (walks renderRule) and collectSlots (reads simplifiedRule) still
	// share one of the slot's `sourceRuleIds`, making `slotByRuleId` (the canonical,
	// primary slot lookup) resolve instead of degrading to fragile fallbacks.
	if (id !== undefined && !Object.prototype.hasOwnProperty.call(result, 'id')) patch['id'] = id;
	if (Object.keys(patch).length === 0) return result;
	return { ...result, ...patch };
}

export interface SharedArmAttrs {
	readonly fieldName?: string;
	readonly multiplicity?: Multiplicity;
	readonly nonterminal?: boolean;
	readonly separator?: Rule['separator'];
	readonly strongestMultiplicity?: Multiplicity;
}

const MULTIPLICITY_RANK: Record<Multiplicity, number> = { single: 0, optional: 1, array: 2, nonEmptyArray: 3 };

type StampedAttrs = Pick<RuleBase<'normalize'>, 'fieldName' | 'multiplicity' | 'nonterminal' | 'separator' | 'optionalElement'>;

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
		nonterminal: unanimous((r) => r.nonterminal),
		separator,
		strongestMultiplicity
	};
}
