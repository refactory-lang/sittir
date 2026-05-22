/**
 * compiler/wrapper-deletion.ts — PR1 Task 2.A2
 *
 * Pushes modifier wrappers (optional / field / repeat / repeat1) down to
 * leaf attributes (fieldName, multiplicity, separator) on RuleBase.
 * The result type is RenderRule: the Rule union minus the four wrapper
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
 *   polymorph / token) are recursed into so ALL wrappers in the tree are
 *   eliminated.
 * - Leaf terminals (string / pattern / symbol / enum / supertype /
 *   indent / dedent / newline / alias / token — anything not structural and
 *   not a wrapper) are returned with the accumulated modifier attributes
 *   spread onto them.
 */

import type { Rule, RenderRule, PolymorphRule } from './rule.ts';
import { fuseHeadRepeatLists } from './list-fusion.ts';
import { isNonterminalRuleType } from './rule-catalog.ts';

// ---------------------------------------------------------------------------
// Accumulated modifier attributes from unwrapped wrappers
// ---------------------------------------------------------------------------

interface WrapperAttrs {
	fieldName?: string;
	multiplicity?: 'optional' | 'array' | 'nonEmptyArray';
	separator?: Rule['separator'];
	aliasedFrom?: string;
	aliasNamed?: boolean;
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
function deleteWrapperWith(rule: Rule, attrs: WrapperAttrs): RenderRule {
	switch (rule.type) {
		// ----- Wrapper cases — peel and accumulate -----

		case 'optional': {
			// Only stamp multiplicity if not already set by an outer wrapper.
			// Special case: optional(repeat(...)) and optional(repeat1(...)) are both
			// array (zero-or-more) — the outer optional makes the empty case valid,
			// overriding repeat/repeat1 semantics. repeat already produces array; the
			// key correction is repeat1: optional(repeat1(X)) must be array, not
			// nonEmptyArray. This mirrors the original deriveSlotsRaw `case 'optional'`
			// special-case and collectChildFromMember behavior.
			const innerIsRepeatVariant = rule.content.type === 'repeat' || rule.content.type === 'repeat1';
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

		case 'field': {
			// Only stamp fieldName if not already set by an outer wrapper
			const next: WrapperAttrs = {
				...attrs,
				fieldName: attrs.fieldName ?? rule.name,
				// field forces a slot on its content (Table 2), incl. terminal.
				nonterminal: true,
			};
			return deleteWrapperWith(rule.content, next);
		}

		case 'repeat': {
			// Only stamp multiplicity if not already set
			const mult = attrs.multiplicity ?? 'array';
			// Build separator: if trailing or leading is set, use object form
			let sep = attrs.separator;
			if (sep === undefined && rule.separator !== undefined) {
				if (rule.trailing !== undefined || rule.leading !== undefined) {
					sep = {
						rules: [{ type: 'string', value: rule.separator }],
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

		case 'repeat1': {
			// Same as repeat but nonEmptyArray
			const mult = attrs.multiplicity ?? 'nonEmptyArray';
			let sep = attrs.separator;
			if (sep === undefined && rule.separator !== undefined) {
				if (rule.trailing !== undefined || rule.leading !== undefined) {
					sep = {
						rules: [{ type: 'string', value: rule.separator }],
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

		case 'seq': {
			const members = rule.members.map((m) => deleteWrapperWith(m, {}));
			return stampAttrs({ ...rule, members }, attrs);
		}

		case 'choice': {
			const members = rule.members.map((m) => deleteWrapperWith(m, {}));
			return stampAttrs({ ...rule, members }, attrs);
		}

		case 'variant': {
			const content = deleteWrapperWith(rule.content, {});
			return stampAttrs({ ...rule, content }, attrs);
		}

		case 'clause': {
			const content = deleteWrapperWith(rule.content, {});
			return stampAttrs({ ...rule, content }, attrs);
		}

		case 'group': {
			const content = deleteWrapperWith(rule.content, {});
			return stampAttrs({ ...rule, content }, attrs);
		}

		case 'terminal': {
			const content = deleteWrapperWith(rule.content, {});
			return stampAttrs({ ...rule, content }, attrs);
		}

		case 'token': {
			// token.content is structural but not a wrapper — recurse
			const content = deleteWrapperWith(rule.content, {});
			return stampAttrs({ ...rule, content }, attrs);
		}

		case 'alias': {
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
				// A named alias forces a slot on its content (Table 2).
				nonterminal: attrs.nonterminal ?? (rule.named || undefined),
			};
			return deleteWrapperWith(rule.content, next);
		}

		case 'polymorph': {
			const poly = rule as PolymorphRule;
			const rewritten: PolymorphRule = {
				...poly,
				forms: poly.forms.map((f) => ({ ...f, content: deleteWrapperWith(f.content, {}) })),
			};
			return stampAttrs(rewritten, attrs);
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
function stampAttrs(rule: Rule, attrs: WrapperAttrs): RenderRule {
	if (
		attrs.fieldName === undefined &&
		attrs.multiplicity === undefined &&
		attrs.separator === undefined &&
		attrs.aliasedFrom === undefined &&
		attrs.aliasNamed === undefined &&
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
export function deleteWrapper(rule: Rule): RenderRule {
	return deleteWrapperWith(rule, {});
}

/**
 * Apply `deleteWrapper` to every entry in a rule map, returning a new map
 * typed as `Record<string, RenderRule>`.
 *
 * This is the map-form used by `optimize()` to produce the `renderRules`
 * snapshot.
 */
export function applyWrapperDeletion(rules: Record<string, Rule>): Record<string, RenderRule> {
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
