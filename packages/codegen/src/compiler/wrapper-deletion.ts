/**
 * compiler/wrapper-deletion.ts — PR1 Task 2.A2
 *
 * Pushes modifier wrappers (optional / field / repeat / repeat1) down to
 * leaf attributes (fieldName, multiplicity, separator) on RuleBase.
 * The result type is RenderRule: the Rule<'link'> union minus the four wrapper
 * variants, so consumers that only see RenderRule cannot accidentally
 * re-wrap a leaf.
 *
 * Design notes:
 * - Stacked wrappers are handled outside-in: the outermost wrapper's
 *   contribution is stamped first, then inner wrappers add their own.
 *   Outer multiplicity wins over inner (field-of-optional: outer=field
 *   stamps fieldName, inner=optional stamps multiplicity).
 * - Default multiplicity ('single') is NOT stamped — only non-default
 *   values are written to avoid polluting leaf rule objects.
 * - Structural rules (seq / choice / group / clause / variant / terminal /
 *   token) are recursed into so ALL wrappers in the tree are eliminated.
 * - Leaf terminals (string / pattern / symbol / enum / supertype /
 *   indent / dedent / newline / alias / token — anything not structural and
 *   not a wrapper) are returned with the accumulated modifier attributes
 *   spread onto them.
 */

import { ALIAS, CHOICE, FIELD, GROUP, OPTIONAL, REPEAT, REPEAT1, SEQ, TOKEN, VARIANT } from '../types/rule-types.ts'; // @rule-type-consts
import type { Rule, RuleBase, RenderRule } from '../types/rule.ts';
import { fuseHeadRepeatLists, combineMultiplicity } from '../dsl/rule-transforms.ts';
import { isNonterminalRuleType } from './rule-catalog.ts';

// ---------------------------------------------------------------------------
// Accumulated modifier attributes from unwrapped wrappers
// ---------------------------------------------------------------------------

interface WrapperAttrs {
	fieldName?: string;
	multiplicity?: 'optional' | 'array' | 'nonEmptyArray';
	separator?: RuleBase<'normalize'>['separator'];
	aliasedFrom?: string;
	aliasNamed?: boolean;
	inline?: boolean;
	nonterminal?: boolean;
}

// ---------------------------------------------------------------------------
// Internal recursive implementation
// ---------------------------------------------------------------------------

/**
 * Walk a rule tree collecting wrapper attributes as we descend through
 * consecutive wrappers, then recurse structurally and stamp collected
 * attrs onto the leaf.
 */
function deleteWrapperWith(rule: Rule<'link'>, attrs: WrapperAttrs): RenderRule {
	switch (rule.type) {
		// ----- Wrapper cases — peel and accumulate -----

		case OPTIONAL: {
			// Only stamp multiplicity if not already set by an outer wrapper.
			// Special case: optional(repeat(...)) and optional(repeat1(...)) are both
			// array (zero-or-more) — the outer optional makes the empty case valid,
			// overriding repeat/repeat1 semantics. repeat already produces array; the
			// key correction is repeat1: optional(repeat1(X)) must be array, not
			// nonEmptyArray. This mirrors the original deriveSlotsRaw `case 'optional'`
			// special-case and collectChildFromMember behavior.
			const innerIsRepeatVariant = rule.content.type === REPEAT || rule.content.type === REPEAT1;
			const next: WrapperAttrs = {
				...attrs,
				multiplicity: attrs.multiplicity ?? (innerIsRepeatVariant ? 'array' : 'optional'),
				// optional stays recursive: it forces a slot only when its
				// content is intrinsically nonterminal (Table 2). optional(',')
				// → no slot; optional(symbol)/optional(repeat) → slot.
				nonterminal: attrs.nonterminal ?? (isNonterminalRuleType(rule.content) || undefined),
			};
			return deleteWrapperWith(rule.content, next);
		}

		case FIELD: {
			// Only stamp fieldName if not already set by an outer wrapper
			const next: WrapperAttrs = {
				...attrs,
				fieldName: attrs.fieldName ?? rule.name,
				// field forces a slot on its content (Table 2), incl. terminal.
				nonterminal: true,
			};
			return deleteWrapperWith(rule.content, next);
		}

		case REPEAT: {
			// Combine outer (pushed-down) multiplicity with repeat's native 'array'.
			// combineMultiplicity('optional','array')='array'; ('nonEmptyArray','array')='array'.
			// repeat's zero-or-more semantics always dominate an enclosing optional/nonEmptyArray.
			// The second arg is always the 'array' collection literal here, so
			// `combineMultiplicity`'s `isCollection(inner)` branch always applies —
			// the result can only be 'array' | 'nonEmptyArray' (never 'single'),
			// narrower than the function's general LeafMultiplicity return type.
			const mult = (combineMultiplicity(attrs.multiplicity, 'array') ?? 'array') as 'array' | 'nonEmptyArray';
			// Build separator: if trailing or leading is set, use object form
			let sep = attrs.separator;
			if (sep === undefined && rule.separator !== undefined) {
				if (rule.trailing !== undefined || rule.leading !== undefined) {
					sep = {
						rules: [{ type: 'STRING', value: rule.separator }],
						trailing: rule.trailing,
						leading: rule.leading,
					};
				} else {
					sep = rule.separator;
				}
			}
			// repeat forces an array slot (Table 2), incl. terminal content.
			const next: WrapperAttrs = { ...attrs, multiplicity: mult, separator: sep, nonterminal: true };
			return deleteWrapperWith(rule.content, next);
		}

		case REPEAT1: {
			// Same as repeat but nonEmptyArray as native.
			// combineMultiplicity('optional','nonEmptyArray')='array' — outer optional
			// makes the empty case valid (same as the optional case's innerIsRepeatVariant check).
			// The second arg is always the 'nonEmptyArray' collection literal here,
			// so the result can only be 'array' | 'nonEmptyArray' (never 'single') —
			// see the REPEAT case above for the same narrowing rationale.
			const mult = (combineMultiplicity(attrs.multiplicity, 'nonEmptyArray') ?? 'nonEmptyArray') as
				| 'array'
				| 'nonEmptyArray';
			let sep = attrs.separator;
			if (sep === undefined && rule.separator !== undefined) {
				if (rule.trailing !== undefined || rule.leading !== undefined) {
					sep = {
						rules: [{ type: 'STRING', value: rule.separator }],
						trailing: rule.trailing,
						leading: rule.leading,
					};
				} else {
					sep = rule.separator;
				}
			}
			// repeat1 forces a nonEmptyArray slot (Table 2), incl. terminal content.
			const next: WrapperAttrs = { ...attrs, multiplicity: mult, separator: sep, nonterminal: true };
			return deleteWrapperWith(rule.content, next);
		}

		// ----- Structural cases — recurse into members/content, stamp attrs onto this node -----

		case SEQ: {
			// Push the wrapper's multiplicity intrinsically onto each SLOT-BEARING
			// member so collect-slots can read it directly (no seq-level inheritance
			// needed). optional(seq(field('x',…), field('y',…))): each field gets
			// multiplicity:'optional' pushed down; the seq node itself carries none.
			//
			// IMPORTANT: only push to wrappers and nonterminal references — NOT to
			// bare string/pattern literals (co-optional literals like `'in'`, `'='`,
			// `':'`). String members must keep rendering unconditionally alongside
			// their slot neighbours; the template emitter drops strings with
			// multiplicity:'optional' (line ~804 in templates.ts), which would
			// silently lose co-optional keywords like `in` in `exec code in expr`.
			//
			// Relax nonEmptyArray → array when pushing to members: the at-least-one
			// guarantee of a repeat1 applies to the seq as a WHOLE, not to each
			// individual member.
			const rawMult = attrs.multiplicity;
			const multToPush = rawMult === 'nonEmptyArray' ? 'array' : rawMult;
			const members = rule.members.map((m) => {
				// Only push multiplicity to potential slot-bearing members (wrappers or
				// nonterminal rule types). String/pattern literals carry no slot; pushing
				// would cause the template emitter to drop co-optional keywords.
				const isSlotBearingShape =
					m.type === FIELD ||
					m.type === OPTIONAL ||
					m.type === REPEAT ||
					m.type === REPEAT1 ||
					m.type === 'SYMBOL' ||
					m.type === 'SUPERTYPE' ||
					m.type === CHOICE ||
					m.type === SEQ ||
					m.type === GROUP ||
					m.type === VARIANT;
				const memberAttrs: WrapperAttrs =
					multToPush !== undefined && isSlotBearingShape ? { multiplicity: multToPush } : {};
				return deleteWrapperWith(m, memberAttrs);
			});
			// Stamp the seq with accumulated attrs. Multiplicity is normally pushed
			// onto members (above) so collect-slots reads it per-slot, and omitted
			// from the seq node. EXCEPTION: a seq carrying BARE-LITERAL members
			// (co-optional delimiters like `=` / `in` in `optional(seq('=', value))`)
			// — literals can't carry multiplicity (the emitter drops optional
			// strings), so they'd render UNCONDITIONALLY, losing co-optionality
			// (`<div disabled>` → `disabled=`). Retain the unit multiplicity on the
			// SEQ NODE too, so the template emitter's co-optional-unit guard gates the
			// whole sequence on its internal slot. (Enrich's seq-stamp masked this
			// until it was removed — see project_nonterminal_authoritative_slot_signal.)
			const hasBareLiteral = rule.members.some((m) => m.type === 'STRING' || m.type === 'PATTERN');
			const seqAttrs: WrapperAttrs = {
				fieldName: attrs.fieldName,
				separator: attrs.separator,
				aliasedFrom: attrs.aliasedFrom,
				aliasNamed: attrs.aliasNamed,
				nonterminal: attrs.nonterminal,
				multiplicity: hasBareLiteral ? multToPush : undefined,
			};
			return stampAttrs({ ...rule, members }, seqAttrs);
		}

		case CHOICE: {
			const members = rule.members.map((m) => deleteWrapperWith(m, {}));
			return stampAttrs({ ...rule, members }, attrs);
		}

		case VARIANT: {
			const content = deleteWrapperWith(rule.content, {});
			return stampAttrs({ ...rule, content }, attrs);
		}

		case GROUP: {
			const content = deleteWrapperWith(rule.content, {});
			return stampAttrs({ ...rule, content }, attrs);
		}

		case TOKEN: {
			// token.content is structural but not a wrapper — recurse
			const content = deleteWrapperWith(rule.content, {});
			return stampAttrs({ ...rule, content }, attrs);
		}

		case ALIAS: {
			// Push the alias down to the leaf, exactly like field/optional/
			// repeat: `alias(content, value)` stamps `aliasedFrom = value`
			// (the target name tree-sitter emits) + `aliasNamed` onto the
			// innermost rule, and the `alias` wrapper node disappears. The
			// wrapper-free RenderRule/SimplifiedRule then carries alias
			// provenance as a leaf attribute — consumers no longer match a
			// mid-tree `alias` node. Outer alias wins if already set.
			const next: WrapperAttrs = {
				...attrs,
				aliasedFrom: attrs.aliasedFrom ?? rule.value,
				aliasNamed: attrs.aliasNamed ?? rule.named,
				// An alias confers a real visible CST kind on its content, so the
				// inner ref must materialize, not flatten — flip inline off. Outer
				// alias wins (??), mirroring aliasedFrom.
				inline: attrs.inline ?? false,
				// A named alias forces a slot on its content (Table 2).
				nonterminal: attrs.nonterminal ?? (rule.named || undefined),
			};
			return deleteWrapperWith(rule.content, next);
		}

		// ----- Leaf cases — stamp attrs and return -----

		default: {
			// Covers: string, pattern, symbol, enum, supertype,
			//         indent, dedent, newline
			return stampAttrs(rule, attrs);
		}
	}
}

/**
 * Spread non-undefined wrapper attrs onto a rule object.
 * We only include keys that have actual values to avoid polluting the object
 * with `undefined`-valued fields.
 */
function stampAttrs(rule: Rule<'link'>, attrs: WrapperAttrs): RenderRule {
	if (
		attrs.fieldName === undefined &&
		attrs.multiplicity === undefined &&
		attrs.separator === undefined &&
		attrs.aliasedFrom === undefined &&
		attrs.aliasNamed === undefined &&
		attrs.inline === undefined &&
		attrs.nonterminal === undefined
	) {
		return rule as RenderRule;
	}
	const patch: Record<string, unknown> = {};
	if (attrs.fieldName !== undefined) patch['fieldName'] = attrs.fieldName;
	if (attrs.multiplicity !== undefined) patch['multiplicity'] = attrs.multiplicity;
	if (attrs.separator !== undefined) patch['separator'] = attrs.separator;
	if (attrs.aliasedFrom !== undefined) patch['aliasedFrom'] = attrs.aliasedFrom;
	if (attrs.aliasNamed !== undefined) patch['aliasNamed'] = attrs.aliasNamed;
	if (attrs.inline !== undefined) patch['inline'] = attrs.inline;
	if (attrs.nonterminal !== undefined) patch['nonterminal'] = attrs.nonterminal;
	return { ...rule, ...patch } as RenderRule;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Delete all modifier wrappers from a single rule, pushing their attributes
 * down to the innermost non-wrapper rule.
 *
 * Structural rules (seq / choice / variant / group / clause / terminal /
 * polymorph) are recursed into so the entire rule tree is wrapper-free.
 */
export function deleteWrapper(rule: Rule<'link'>): RenderRule {
	return deleteWrapperWith(rule, {});
}

/**
 * Apply `deleteWrapper` to every entry in a rule map, returning a new map
 * typed as `Record<string, RenderRule>`.
 *
 * This is the map-form used by `normalizeGrammar()` to produce the `renderRules`
 * snapshot.
 */
export function applyWrapperDeletion(rules: Record<string, Rule<'link'>>): Record<string, RenderRule> {
	const result: Record<string, RenderRule> = {};
	for (const [name, rule] of Object.entries(rules)) {
		// Fuse separated-list head+repeat pairs into one multi slot AFTER
		// wrapper-deletion has pushed multiplicity/separator to leaves, so the
		// renderRule the emitter consumes already has the canonical single
		// multi slot (no head single + tail array split).
		result[name] = fuseHeadRepeatLists(deleteWrapper(rule)) as RenderRule;
	}
	return result;
}
