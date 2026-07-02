/**
 * compiler/rule-attrs.ts — shared attr-preservation helpers.
 *
 * `withAttrsFrom` and `combineMultiplicity` are used by every collapse site
 * that discards a structural wrapper (seq / choice) in favour of a single
 * survivor. Both were originally local to simplify.ts; they now live here so
 * optimize.ts's `collapseWrappers` and simplify.ts's `canonicalizeSeqOfLeaves`
 * use the SAME implementation, and future collapse sites can't drift apart.
 *
 * `combineMultiplicity` has moved to transforms.ts (PR-O M1 de-scatter);
 * it is re-exported here so existing importers keep resolving.
 */

import { CHOICE } from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule, Rule, RuleBase, Multiplicity } from '../types/rule.ts';
// `combineMultiplicity` and `LeafMultiplicity` moved to transforms.ts (PR-O M1 de-scatter);
// re-exported here so existing importers keep resolving.
export { combineMultiplicity, type LeafMultiplicity } from './rule-transforms.ts';

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
export function withAttrsFrom<R extends AnyRule>(original: AnyRule, result: R): R {
	// `original` may be a wrapper-bearing (evaluate/link) rule where these
	// stamped leaf attrs aren't part of the type yet (they're populated by
	// `applyWrapperDeletion` during Optimize) — but `collapseWrappers`
	// (normalize.ts, pre-Optimize) legitimately calls this with `Rule<'link'>`
	// wrapper nodes that already carry link-lifted attrs defensively. Read
	// structurally rather than narrowing the param type, matching the
	// established pattern (see `findRepeatFlag` in dsl/rule-transforms.ts).
	const src = original as StampedAttrs & { id?: string };
	const { fieldName, multiplicity, separator, id } = src;
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

/**
 * Structural-read shape for the stamped leaf attributes. These only exist
 * on `RuleBase<'optimize' | 'simplify'>` per the type, but `sharedArmAttrs`
 * is called from `collect-slots.ts` with `AnyRule` values that are, at
 * runtime, always post-wrapper-deletion (optimize-phase) rules — the
 * wrapper-bearing 'evaluate'/'link' views just don't carry these fields.
 * Matches the established structural-read-cast pattern (see
 * `findRepeatFlag` in dsl/rule-transforms.ts).
 */
type StampedAttrs = Pick<RuleBase<'optimize'>, 'fieldName' | 'multiplicity' | 'nonterminal' | 'separator'>;

/** The arms of a choice (`members`); `[]` otherwise. */
function armsOf(rule: AnyRule): readonly AnyRule[] {
	if (rule.type === CHOICE) return rule.members;
	return [];
}

export function sharedArmAttrs(rule: AnyRule): SharedArmAttrs {
	const arms = armsOf(rule);
	if (arms.length === 0) return {};
	const a0 = arms[0]! as StampedAttrs;
	const stamped = (r: AnyRule): StampedAttrs => r as StampedAttrs;
	// A primitive attr is unanimous when present on a0 and === on every arm.
	const unanimous = <T>(get: (r: StampedAttrs) => T): T | undefined => {
		const v = get(a0);
		return v !== undefined && arms.every((m) => get(stamped(m)) === v) ? v : undefined;
	};
	// separator may be a string | Rule[] | { rules } object — compare by structure.
	const sep0 = a0.separator;
	const separator =
		sep0 !== undefined && arms.every((m) => JSON.stringify(stamped(m).separator) === JSON.stringify(sep0))
			? sep0
			: undefined;
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
		strongestMultiplicity,
	};
}
