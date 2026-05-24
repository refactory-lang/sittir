/**
 * compiler/rule-attrs.ts — shared attr-preservation helpers.
 *
 * `withAttrsFrom` and `combineMultiplicity` are used by every collapse site
 * that discards a structural wrapper (seq / choice) in favour of a single
 * survivor. Both were originally local to simplify.ts; they now live here so
 * optimize.ts's `collapseWrappers` and simplify.ts's `canonicalizeSeqOfLeaves`
 * use the SAME implementation, and future collapse sites can't drift apart.
 */

import type { Rule } from './rule.ts';

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
	// so the emitter (walks renderRule) and collectSlots (reads simplifiedRule) agree
	// on the slot's `sourceRuleId`, making `slotByRuleId` (the canonical, primary slot
	// lookup) resolve instead of degrading to the fragile fieldName/symbol-name fallbacks.
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
