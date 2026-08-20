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
import { isSpliceableBareSeq } from '../types/rule.ts';
import { fuseHeadRepeatLists, combineMultiplicity } from '../dsl/rule-transforms.ts';
import { isNonterminalRuleType } from './rule-catalog.ts';

interface WrapperAttrs {
	fieldName?: string;
	multiplicity?: 'optional' | 'array' | 'nonEmptyArray';
	separator?: RuleBase<'normalize'>['separator'];
	aliasedFrom?: string;
	aliasNamed?: boolean;
	inline?: boolean;
	nonterminal?: boolean;
	optionalElement?: boolean;
}

function carrySeparatorForward(attrs: WrapperAttrs, ruleSeparator: unknown): RuleBase<'normalize'>['separator'] {
	const rawSep = attrs.separator ?? (ruleSeparator as RuleBase<'normalize'>['separator']);
	if (attrs.separator !== undefined || rawSep === undefined) return rawSep;
	return { ...rawSep, value: deleteWrapperWith(rawSep.value as Rule<'link'>, {}) };
}

/**
 * Detects tree-sitter's prec.left self-referential-choice flattening: a
 * hidden CHOICE rule whose arms are all 3-member SEQs
 * `[field(base), STRING(separator), field(extension)]` with the SAME
 * (base, extension) field-name pair and separator literal across every
 * arm, where at least one arm's base field is a bare (non-alias-wrapped)
 * hidden SYMBOL reference to THIS rule's own name. Tree-sitter's LR table
 * collapses the recursion into ONE FLAT node at parse time (confirmed via
 * probe-kind): the base field stays singular — only the true base operand
 * carries it, since inner recursive occurrences dissolve into siblings and
 * the leftover separator tokens are anonymous so the reader drops them —
 * while the extension field repeats once per additional chained operand.
 * Neither the REPEAT/REPEAT1 cases above nor node-types.json (never
 * consulted for arity — see project convention) can see this: the
 * multiplicity is an emergent property of LR precedence-climbing over a
 * self-referential choice, not an authored wrapper shape. Confirmed case:
 * rust's `_let_chain` (`a && b && c && d` parses as one node with a single
 * `left` and a repeated `right`, not a nested binary tree).
 *
 * Only checked at the TOP of each named rule's own body (`ownName` is
 * threaded down from `applyWrapperDeletion`'s per-rule loop and never
 * forwarded into recursive calls) — a nested CHOICE encountered deep
 * inside some OTHER rule's body can never coincidentally match, since the
 * self-reference check requires the SYMBOL's name to equal the rule
 * currently being processed.
 */
function detectSelfReferentialFold(
	name: string,
	rule: Rule<'link'>
): { extensionFieldName: string; separator: Rule<'link'> } | undefined {
	if (rule.type !== CHOICE) return undefined;
	let baseFieldName: string | undefined;
	let extensionFieldName: string | undefined;
	let separator: Rule<'link'> | undefined;
	let sawSelfRef = false;
	const isSelfRef = (content: Rule<'link'>): boolean =>
		content.type === 'SYMBOL' &&
		content.name === name &&
		(content as { hidden?: boolean }).hidden === true &&
		(content as { aliasedFrom?: string }).aliasedFrom === undefined;
	for (const arm of rule.members) {
		if (arm.type !== SEQ || arm.members.length !== 3) return undefined;
		const m0 = arm.members[0];
		const sep = arm.members[1];
		const m2 = arm.members[2];
		if (m0 === undefined || sep === undefined || m2 === undefined) return undefined;
		if (m0.type !== FIELD || m2.type !== FIELD || sep.type !== 'STRING') return undefined;
		if (baseFieldName === undefined) {
			baseFieldName = m0.name;
			extensionFieldName = m2.name;
		} else if (m0.name !== baseFieldName || m2.name !== extensionFieldName) {
			return undefined;
		}
		if (separator === undefined) separator = sep;
		else if (separator.type !== 'STRING' || separator.value !== sep.value) return undefined;
		if (isSelfRef(m0.content)) sawSelfRef = true;
		else if (isSelfRef(m2.content)) return undefined; // self-ref on the extension side — bail, don't guess
	}
	if (!sawSelfRef || extensionFieldName === undefined || separator === undefined) return undefined;
	return { extensionFieldName, separator };
}

function deleteWrapperWith(rule: Rule<'link'>, attrs: WrapperAttrs, ownName?: string): RenderRule {
	switch (rule.type) {
		case OPTIONAL: {
			// Only stamp multiplicity if not already set by an outer wrapper.
			// Special case: optional(repeat(...)) and optional(repeat1(...)) are both
			// array (zero-or-more) — the outer optional makes the empty case valid,
			// overriding repeat/repeat1 semantics. repeat already produces array; the
			// key correction is repeat1: optional(repeat1(X)) must be array, not
			// nonEmptyArray. This mirrors the original deriveSlotsRaw `case 'optional'`
			// special-case and collectChildFromMember behavior.
			const innerIsRepeatVariant = rule.content.type === REPEAT || rule.content.type === REPEAT1;
			// An optional at the ELEMENT POSITION of a separated repeat (attrs
			// already carry a collection multiplicity AND a separator — only the
			// repeat/repeat1 cases set both) means individual positions may be
			// blank: `[a, , b]` array elision. The optional wrapper itself is
			// deleted here, so record the per-position-blank fact as a stamped
			// attribute; slot derivation projects it onto values and storage
			// types become `Array<X | undefined>`. An optional AROUND a repeat
			// never matches (no separator in attrs yet), nor does a seq-pushed
			// member multiplicity (seq pushes multiplicity without separator).
			const isElidedElementPosition =
				(attrs.multiplicity === 'array' || attrs.multiplicity === 'nonEmptyArray') && attrs.separator !== undefined;
			const next: WrapperAttrs = {
				...attrs,
				multiplicity: attrs.multiplicity ?? (innerIsRepeatVariant ? 'array' : 'optional'),
				optionalElement: attrs.optionalElement ?? (isElidedElementPosition || undefined),
				// optional stays recursive: it forces a slot only when its
				// content is intrinsically nonterminal (Table 2). optional(',')
				// → no slot; optional(symbol)/optional(repeat) → slot.
				// isNonterminalRuleType classifies by `.type` + child shape only —
				// phase-agnostic in practice; widen structurally (post-PR-S,
				// RepeatRule<'evaluate'>/<'link'> genuinely diverge in shape, so
				// this is now an explicit phase-widening cast, not a structural
				// coincidence — same pattern as collect-slots.ts's isSlotNode).
				nonterminal: attrs.nonterminal ?? (isNonterminalRuleType(rule.content as Rule<'evaluate'>) || undefined)
			};
			return deleteWrapperWith(rule.content, next);
		}

		case FIELD: {
			// Only stamp fieldName if not already set by an outer wrapper
			const next: WrapperAttrs = {
				...attrs,
				fieldName: attrs.fieldName ?? rule.name,
				// field forces a slot on its content (Table 2), incl. terminal.
				nonterminal: true
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
			const sep = carrySeparatorForward(attrs, rule.separator);
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
			const sep = carrySeparatorForward(attrs, rule.separator);
			// repeat1 forces a nonEmptyArray slot (Table 2), incl. terminal content.
			const next: WrapperAttrs = { ...attrs, multiplicity: mult, separator: sep, nonterminal: true };
			return deleteWrapperWith(rule.content, next);
		}

		case SEQ: {
			// Splice a nested seq carrying none of its OWN fieldName/separator/
			// multiplicity — it's not a cardinality-carrying unit, just redundant
			// nesting around siblings of whatever else is in this seq. Matches
			// simplify.ts::simplifySeqRule's identical splice exactly (shared
			// predicate — see isSpliceableBareSeq's doc comment for why the two
			// derivations must agree).
			const flatMembers = rule.members.flatMap((m) =>
				isSpliceableBareSeq(m) ? (m as Rule<'link'> & { members: Rule<'link'>[] }).members : [m]
			);
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
			const members = flatMembers.map((m) => {
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
			const hasBareLiteral = flatMembers.some((m) => m.type === 'STRING' || m.type === 'PATTERN');
			const seqAttrs: WrapperAttrs = {
				fieldName: attrs.fieldName,
				separator: attrs.separator,
				aliasedFrom: attrs.aliasedFrom,
				aliasNamed: attrs.aliasNamed,
				nonterminal: attrs.nonterminal,
				optionalElement: attrs.optionalElement,
				multiplicity: hasBareLiteral ? multToPush : undefined
			};
			return stampAttrs({ ...rule, members }, seqAttrs);
		}

		case CHOICE: {
			const fold = ownName !== undefined ? detectSelfReferentialFold(ownName, rule) : undefined;
			const members = rule.members.map((m) => {
				// detectSelfReferentialFold only returns a fold when every arm is
				// confirmed to be a 3-member SEQ[field, STRING, field] — re-check
				// the SEQ discriminant here for TypeScript's narrowing, not as a
				// runtime safety net (the fold's own scan already proved this).
				if (fold === undefined || m.type !== SEQ) return deleteWrapperWith(m, {});
				const base = m.members[0]!;
				const sepLiteral = m.members[1]!;
				const ext = m.members[2]!;
				const newBase = deleteWrapperWith(base, {});
				const newSep = deleteWrapperWith(sepLiteral, {});
				const newExt = deleteWrapperWith(ext, {
					multiplicity: 'array',
					separator: { value: deleteWrapperWith(fold.separator, {}) }
				});
				return { ...m, members: [newBase, newSep, newExt] };
			});
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
				nonterminal: attrs.nonterminal ?? (rule.named || undefined)
			};
			return deleteWrapperWith(rule.content, next);
		}

		default: {
			// Covers: string, pattern, symbol, enum, supertype,
			//         indent, dedent, newline
			return stampAttrs(rule, attrs);
		}
	}
}

function stampAttrs(rule: Rule<'link'>, attrs: WrapperAttrs): RenderRule {
	if (
		attrs.fieldName === undefined &&
		attrs.multiplicity === undefined &&
		attrs.separator === undefined &&
		attrs.aliasedFrom === undefined &&
		attrs.aliasNamed === undefined &&
		attrs.inline === undefined &&
		attrs.nonterminal === undefined &&
		attrs.optionalElement === undefined
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
	if (attrs.optionalElement !== undefined) patch['optionalElement'] = attrs.optionalElement;
	return { ...rule, ...patch } as RenderRule;
}
export function deleteWrapper(rule: Rule<'link'>, ownName?: string): RenderRule {
	return deleteWrapperWith(rule, {}, ownName);
}

export function applyWrapperDeletion(rules: Record<string, Rule<'link'>>): Record<string, RenderRule> {
	const result: Record<string, RenderRule> = {};
	for (const [name, rule] of Object.entries(rules)) {
		// Fuse separated-list head+repeat pairs into one multi slot AFTER
		// wrapper-deletion has pushed multiplicity/separator to leaves, so the
		// renderRule the emitter consumes already has the canonical single
		// multi slot (no head single + tail array split).
		result[name] = fuseHeadRepeatLists(deleteWrapper(rule, name)) as RenderRule;
	}
	return result;
}
