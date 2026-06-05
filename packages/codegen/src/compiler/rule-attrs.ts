/**
 * compiler/rule-attrs.ts — shared attr-preservation helpers.
 *
 * `withAttrsFrom` and `combineMultiplicity` are used by every collapse site
 * that discards a structural wrapper (seq / choice) in favour of a single
 * survivor. Both were originally local to simplify.ts; they now live here so
 * optimize.ts's `collapseWrappers` and simplify.ts's `canonicalizeSeqOfLeaves`
 * use the SAME implementation, and future collapse sites can't drift apart.
 */

import { CHOICE } from './rule-types.ts'; // @rule-type-consts
import type { Rule, Multiplicity } from './rule.ts';

/**
 * Transfer slot-identity attributes from a discarded wrapper node onto the
 * survivor. Only absent attributes are transferred (`hasOwnProperty` guard
 * means the survivor's own values always win). This ensures:
 *   - `fieldName` / `multiplicity` / `separator` — slot-classification attrs
 *   - `id` — rule identity, so `slotByRuleId` resolves against the wrapper's
 *     pre-simplification id rather than degrading to fragile name fallbacks.
 *
 * Non-overriding: a passed-through inner node keeps its own id; only a
 * freshly-rebuilt structural node (`{ type:'choice', members }`) gets the
 * source id stamped.
 */
export function withAttrsFrom(original: Rule, result: Rule): Rule {
	const { fieldName, multiplicity, separator, id } = original;
	const patch: Record<string, unknown> = {};
	if (fieldName !== undefined && !Object.prototype.hasOwnProperty.call(result, 'fieldName'))
		patch['fieldName'] = fieldName;
	if (multiplicity !== undefined && !Object.prototype.hasOwnProperty.call(result, 'multiplicity'))
		patch['multiplicity'] = multiplicity;
	if (separator !== undefined && !Object.prototype.hasOwnProperty.call(result, 'separator'))
		patch['separator'] = separator;
	// Preserve the rule's identity through collapse: renderRule.id === collapsedRule.id
	// so the emitter (walks renderRule) and collectSlots (reads simplifiedRule) still
	// share one of the slot's `sourceRuleIds`, making `slotByRuleId` (the canonical,
	// primary slot lookup) resolve instead of degrading to fragile fallbacks.
	if (id !== undefined && !Object.prototype.hasOwnProperty.call(result, 'id')) patch['id'] = id;
	if (Object.keys(patch).length === 0) return result;
	return { ...result, ...patch };
}

// `'single'` is the canonical required-one value (rule.ts `Multiplicity`); a
// missing multiplicity defaults to it (`combineMultiplicity` null-coalesces).
export type LeafMultiplicity = 'optional' | 'single' | 'array' | 'nonEmptyArray' | undefined;

/**
 * Combine an OUTER multiplicity (pushed down from an enclosing wrapper) with
 * a leaf's own INNER multiplicity into the effective slot multiplicity.
 *
 * `undefined` means "single / exactly one". The lattice:
 *   - nothing pushed (`outer === undefined`) → keep `inner`.
 *   - either side is a collection (array / nonEmptyArray) → the result is a
 *     collection. It is `nonEmptyArray` only when BOTH sides guarantee ≥1
 *     element (a side guarantees ≥1 iff it is single (`undefined`) or
 *     `nonEmptyArray`); otherwise `array` (allows empty).
 *   - neither is a collection → `optional` if either is optional, else single.
 *
 * Examples (the cases this fixes):
 *   combine('nonEmptyArray', undefined)  → 'nonEmptyArray'  (type_arguments union: ≥1)
 *   combine('nonEmptyArray', 'optional') → 'array'          (trait_bounds: 0-or-more)
 *   combine('array', 'optional')         → 'array'
 *   combine('optional', 'optional')      → 'optional'
 *
 * This replaces the prior "outer wins unless inner is already an array" rule,
 * which clobbered an inner `optional` with the outer `nonEmptyArray` and
 * produced `NonEmptyArray<T>` where the runtime slot is 0-or-more.
 */
export function combineMultiplicity(outerIn: LeafMultiplicity, innerIn: LeafMultiplicity): LeafMultiplicity {
	// `'single'` is the canonical required-one value (rule.ts `Multiplicity`);
	// a missing multiplicity defaults to it (null-coalesce). The lattice then
	// operates in `'single'` terms: `optional` trumps single
	// (`combine(optional, single) → optional`), and `guaranteesOne('single')`
	// is true (`combine(nonEmptyArray, single) → nonEmptyArray`, not `array`).
	const outer = outerIn ?? 'single';
	const inner = innerIn ?? 'single';
	const isCollection = (m: LeafMultiplicity): boolean => m === 'array' || m === 'nonEmptyArray';
	const guaranteesOne = (m: LeafMultiplicity): boolean => m === 'single' || m === 'nonEmptyArray';
	if (isCollection(outer) || isCollection(inner)) {
		return guaranteesOne(outer) && guaranteesOne(inner) ? 'nonEmptyArray' : 'array';
	}
	// Neither side is a collection.
	if (outer === 'optional' || inner === 'optional') return 'optional';
	// Both are 'single' → required-one / default. Return `undefined` rather
	// than the explicit string so callers that only stamp non-default values
	// don't write a spurious `multiplicity: 'single'` onto clean nodes (codex P1).
	return undefined;
}

/**
 * Attributes shared across the arms of a choice / polymorph. ONE derivation
 * consumed by both phases (was previously implemented twice, inconsistently —
 * simplify's `liftSharedArmAttrs` was choice-only + unanimous-multiplicity;
 * collect-slots' `sharedArmFieldName` + `strongestArmMultiplicity` were
 * choice+polymorph + strongest-multiplicity):
 *  - simplify's `liftSharedArmAttrs` hoists the UNANIMOUS attrs onto the choice.
 *  - collect-slots reads the unanimous `fieldName` (slot naming) and the
 *    `strongestMultiplicity` (to lift an array multiplicity a single arm carries,
 *    e.g. `choice(commaSep1(X), X)`).
 *
 * `fieldName` / `multiplicity` / `nonterminal` / `separator` are UNANIMOUS —
 * present and equal on EVERY arm, else `undefined`. `strongestMultiplicity` is
 * the most-multi multiplicity ANY single arm carries (`nonEmptyArray > array >
 * optional`; `single` / absent ignored), regardless of unanimity.
 */
export interface SharedArmAttrs {
	readonly fieldName?: string;
	readonly multiplicity?: Multiplicity;
	readonly nonterminal?: boolean;
	readonly separator?: Rule['separator'];
	readonly strongestMultiplicity?: Multiplicity;
}

const MULTIPLICITY_RANK: Record<Multiplicity, number> = { single: 0, optional: 1, array: 2, nonEmptyArray: 3 };

/** The arms of a choice (`members`) or polymorph (form `content`s); `[]` otherwise. */
function armsOf(rule: Rule): readonly Rule[] {
	if (rule.type === CHOICE) return rule.members;
	if (rule.type === 'polymorph') return rule.forms.map((f) => f.content);
	return [];
}

export function sharedArmAttrs(rule: Rule): SharedArmAttrs {
	const arms = armsOf(rule);
	if (arms.length === 0) return {};
	const a0 = arms[0]!;
	// A primitive attr is unanimous when present on a0 and === on every arm.
	const unanimous = <T>(get: (r: Rule) => T): T | undefined => {
		const v = get(a0);
		return v !== undefined && arms.every((m) => get(m) === v) ? v : undefined;
	};
	// separator may be a string | Rule[] | { rules } object — compare by structure.
	const sep0 = a0.separator;
	const separator =
		sep0 !== undefined && arms.every((m) => JSON.stringify(m.separator) === JSON.stringify(sep0))
			? sep0
			: undefined;
	let strongestMultiplicity: Multiplicity | undefined;
	for (const arm of arms) {
		const m = arm.multiplicity;
		if (m === undefined || m === 'single') continue;
		if (strongestMultiplicity === undefined || MULTIPLICITY_RANK[m] > MULTIPLICITY_RANK[strongestMultiplicity])
			strongestMultiplicity = m;
	}
	return {
		fieldName: unanimous((r) => r.fieldName),
		multiplicity: unanimous((r) => r.multiplicity),
		nonterminal: unanimous((r) => r.nonterminal),
		separator,
		strongestMultiplicity,
	};
}
