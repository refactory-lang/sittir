/**
 * dsl/group-classify.ts — shared predicates for inline-safe vs inline-unsafe
 * group classification.
 *
 * **Scope: DSL layer only.** Uses `runtime-shapes.ts` predicates so these
 * work on both sittir and tree-sitter-CLI rule forms (dual-RUNTIME, not
 * dual-case — both runtimes agree on UPPERCASE discriminants).
 *
 * Two exported functions, used by enrich (hoist decision) and, later, the
 * wire pass:
 *
 *   • `ruleMatchesEmpty(rule)` — conservative: returns true iff the rule can
 *     produce the empty string. Guards both the inline-safe hoist and the
 *     inline-unsafe alias paths: tree-sitter rejects named rules (and aliases)
 *     that match the empty string.
 *
 *   • `isInlineSafe(seqBody)` — true iff the seq body reduces to exactly ONE
 *     slot that is a `field` or `symbol` (NOT a bare `choice`) after dropping
 *     pure literals/punctuation and `blank`. The inline+gate render path can
 *     key on that single slot; multi-slot or bare-choice bodies need to be
 *     visible (their own AssembledGroup template).
 */

import {
	isBlankType,
	isChoiceType,
	isFieldType,
	isOptionalType,
	isPrecWrapper,
	isRepeatType,
	isSeqType,
	isStringType,
	isSymbolType,
	typeEq,
	type RuntimeRule
} from '../types/runtime-shapes.ts';
import { detectRepeatSeparator } from './list-patterns.ts';

export function ruleMatchesEmpty(rule: unknown): boolean {
	if (!rule || typeof rule !== 'object') return false;
	const r = rule as Record<string, unknown>;
	const t = typeof r.type === 'string' ? r.type : '';

	if (isOptionalType(t) || isPlainRepeatType(t) || isBlankType(t)) return true;

	if (typeEq(t, 'REPEAT1')) {
		return ruleMatchesEmpty(r.content);
	}

	if (isSeqType(t)) {
		const members = r.members;
		if (!Array.isArray(members) || members.length === 0) return true;
		return members.every((m) => ruleMatchesEmpty(m));
	}

	if (typeEq(t, 'CHOICE')) {
		const members = r.members;
		if (!Array.isArray(members)) return false;
		return members.some((m) => ruleMatchesEmpty(m));
	}

	if (isFieldType(t) || isPrecWrapper(r as { type: string })) {
		return ruleMatchesEmpty(r.content);
	}

	if (isStringType(t) || isSymbolType(t) || typeEq(t, 'TOKEN') || typeEq(t, 'PATTERN')) return false;

	return false;
}

function isPlainRepeatType(t: string): boolean {
	return t === 'REPEAT';
}

function collectSlots(members: unknown[], rulesBag?: Record<string, unknown>): unknown[] {
	const slots: unknown[] = [];
	for (const m of members) {
		if (!m || typeof m !== 'object') continue;
		const r = m as Record<string, unknown>;
		const t = typeof r.type === 'string' ? r.type : '';

		if (isStringType(t) || typeEq(t, 'TOKEN') || isBlankType(t)) continue;

		/* Drop a SYMBOL slot that resolves to no rule body in `rulesBag` — a
		   structural/external scanner token (indent/dedent/newline-role and
		   similar), not content. Without this, e.g. python's `_suite` middle
		   arm `seq($._indent, $.block)` counts as TWO slots (`_indent`,
		   `block`) instead of one, wrongly classifying it inline-UNSAFE and
		   minting a group that fragments `_suite`'s otherwise-uniform `block`
		   output across its three choice arms. `rulesBag` is optional
		   (existing test-only call sites pass none) — omitting it preserves
		   the permissive counting that ignores this distinction. */
		if (rulesBag && isSymbolType(t)) {
			const name = typeof r.name === 'string' ? r.name : undefined;
			if (name !== undefined && !(name in rulesBag)) continue;
		}

		slots.push(m);
	}
	return slots;
}

function unwrapPrec(rule: unknown): unknown {
	let cur = rule;
	while (cur && typeof cur === 'object') {
		const r = cur as Record<string, unknown>;
		if (isPrecWrapper(r as { type: string })) {
			cur = r.content;
		} else {
			break;
		}
	}
	return cur;
}

function isRepeatLike(t: string): boolean {
	return isRepeatType(t) || typeEq(t, 'REPEAT1');
}

function flattenSeqMembers(members: unknown[]): unknown[] {
	const out: unknown[] = [];
	for (const m of members) {
		const core = unwrapPrec(m);
		if (core && typeof core === 'object') {
			const ct = (core as Record<string, unknown>).type;
			const inner = (core as Record<string, unknown>).members;
			if (typeof ct === 'string' && isSeqType(ct) && Array.isArray(inner)) {
				out.push(...flattenSeqMembers(inner));
				continue;
			}
		}
		out.push(m);
	}
	return out;
}

function seqHasTopLevelRepeat(members: unknown[]): boolean {
	for (const m of flattenSeqMembers(members)) {
		const core = unwrapPrec(m);
		if (!core || typeof core !== 'object') continue;
		const ct = (core as Record<string, unknown>).type;
		if (typeof ct === 'string' && isRepeatLike(ct)) return true;
	}
	return false;
}

function isNonterminalSeparatorType(t: string): boolean {
	return isChoiceType(t) || isSymbolType(t) || typeEq(t, 'PATTERN');
}

function repeatHasNonterminalSeparator(repeatRule: RuntimeRule): boolean {
	const content = (repeatRule as { content?: unknown }).content;
	if (!content || typeof content !== 'object') return false;
	const detected = detectRepeatSeparator(content as RuntimeRule);
	if (!detected) return false;
	return isNonterminalSeparatorType(detected.separator.type);
}

function isOptionalSeparatorFlank(member: unknown, sepValue: string): boolean {
	if (!member || typeof member !== 'object') return false;
	const r = member as Record<string, unknown>;
	const t = typeof r.type === 'string' ? r.type : '';

	if (isOptionalType(t)) {
		const content = r.content;
		if (!content || typeof content !== 'object') return false;
		const cr = content as Record<string, unknown>;
		return isStringType(typeof cr.type === 'string' ? cr.type : '') && cr.value === sepValue;
	}

	if (isChoiceType(t)) {
		const members = r.members;
		if (!Array.isArray(members) || members.length !== 2) return false;
		const hasBlank = members.some(
			(m) => m && typeof m === 'object' && isBlankType((m as Record<string, unknown>).type as string)
		);
		const hasMatchingLiteral = members.some(
			(m) =>
				m &&
				typeof m === 'object' &&
				isStringType(
					typeof (m as Record<string, unknown>).type === 'string' ? ((m as Record<string, unknown>).type as string) : ''
				) &&
				(m as Record<string, unknown>).value === sepValue
		);
		return hasBlank && hasMatchingLiteral;
	}

	return false;
}

function repeatMemberHasGenuineSeparatorVariability(repeatRule: RuntimeRule, siblings: unknown[]): boolean {
	if (repeatHasNonterminalSeparator(repeatRule)) return true;

	const content = (repeatRule as { content?: unknown }).content;
	if (!content || typeof content !== 'object') return false;
	const detected = detectRepeatSeparator(content as RuntimeRule);
	if (!detected || !isStringType(detected.separator.type)) return false;
	const sepValue = (detected.separator as unknown as { value?: unknown }).value;
	if (typeof sepValue !== 'string') return false;

	return siblings.some((m) => m !== repeatRule && isOptionalSeparatorFlank(m, sepValue));
}

function repeatHasGenuineSeparatorVariability(repeatRule: RuntimeRule): boolean {
	return repeatHasNonterminalSeparator(repeatRule);
}

function seqHasGenuineSeparatorVariability(members: unknown[]): boolean {
	const flat = flattenSeqMembers(members);
	const repeatMembers: RuntimeRule[] = [];
	for (const m of flat) {
		const core = unwrapPrec(m);
		if (!core || typeof core !== 'object') continue;
		const ct = (core as Record<string, unknown>).type;
		if (typeof ct !== 'string' || !isRepeatLike(ct)) continue;
		const content = (core as { content?: unknown }).content;
		if (content && typeof content === 'object' && detectRepeatSeparator(content as RuntimeRule) !== null) {
			repeatMembers.push(core as RuntimeRule);
		}
	}
	if (repeatMembers.length !== 1) return false;
	return repeatMemberHasGenuineSeparatorVariability(repeatMembers[0]!, flat);
}

export function isInlineSafe(seqBody: unknown, rulesBag?: Record<string, unknown>): boolean {
	if (!seqBody || typeof seqBody !== 'object') return false;
	const r = seqBody as Record<string, unknown>;
	const t = typeof r.type === 'string' ? r.type : '';

	/* Bare `repeat`/`repeat1` body — a LIST is one flat slot (e.g.
	   `formal_parameters = repeat1(parameter, SEP)`, `class_body`, `enum_body`).
	   Like the separated-list seq shape below, aliasing a bare repeat makes
	   tree-sitter DISTRIBUTE the alias across every element (one alias node
	   per element) instead of one group → array-of-siblings → empty render.
	   A list stays INLINE-FLAT (one list slot); only genuine co-optional
	   groups (a bare `choice`, e.g. rust `visibility_modifier`) take the
	   visible-alias path.

	   EXCEPT when the repeat has genuine per-instance separator variability
	   (a non-literal separator rule) — such a list can't render from one
	   fixed separator string on the inline-flat path and needs its own
	   visible `AssembledSeparatedList` template instead. See
	   `repeatHasGenuineSeparatorVariability`. */
	if (isRepeatLike(t)) return !repeatHasGenuineSeparatorVariability(seqBody as RuntimeRule);

	/* A bare `alias(content, $.name)` body is ALSO one flat slot — the alias
	   already gives the position its OWN kind identity (whatever `.value`
	   names), producing exactly one CST node regardless of how complex
	   `content` is internally. Minting a second wrapper kind around it is
	   redundant (and wrong — the mint's synthesized template doesn't know
	   about the alias's own relabeling, e.g. rust's `_type` choice arm
	   `alias($.identifier, $.type_identifier)`: promoting the arm's owning
	   hidden rule produced a template referencing `type_identifier` while the
	   derived slot model expected the arm's OWN field name — a
	   slot-preservation crash, not a naming collision). */
	if (typeEq(t, 'ALIAS')) return true;

	if (!isSeqType(t)) return false;

	const members = r.members;
	if (!Array.isArray(members)) return false;

	/* A body containing a (possibly nested) top-level `repeat`/`repeat1` is a
	   LIST → render flat, NOT a co-optional group. This generalizes the
	   separated-list guard below: the list's repeat is frequently nested
	   inside an inner seq — `commaSep1` desugars to
	   `seq(seq(E, repeat(seq(SEP, E))), optional(SEP))`, so the repeat is two
	   levels down (where_clause / formal_parameters / enum_body /
	   list_pattern) — or sits beside a trailing element
	   (`seq(repeat(E), field(last))`, e.g. rust `match_block`). Aliasing any
	   of these makes tree-sitter distribute the alias across each element
	   (array-of-siblings → "not an array" AST mismatch). Only genuine groups
	   with NO repeat (a bare `choice`, e.g. rust `visibility_modifier`;
	   python `slice`) take the visible-alias path. Safe by construction:
	   declining to mint reverts the kind to inline (floor) behavior, which
	   cannot regress below floor.

	   EXCEPT when the top-level repeat has genuine per-instance separator
	   variability (a non-literal separator, or an adjacent stranded
	   optional/choice-of-blank separator flank sibling in this same seq) —
	   see `seqHasGenuineSeparatorVariability`. Such a list falls through to
	   the visible-promotion path below, same as a multi-slot/bare-choice
	   body. */
	if (seqHasTopLevelRepeat(members)) return !seqHasGenuineSeparatorVariability(members);

	const slots = collectSlots(members, rulesBag);

	if (slots.length !== 1) return false;

	/* The single slot must be a field or symbol (not a bare choice, repeat,
	   etc.). Descend through prec wrappers only — a field slot is itself
	   field-typed and is already inline-safe; descending into it would
	   expose its content (possibly a choice), which would incorrectly
	   classify the slot as unsafe. */
	const core = unwrapPrec(slots[0]);
	if (!core || typeof core !== 'object') return false;
	const coreType = (core as Record<string, unknown>).type;
	if (typeof coreType !== 'string') return false;

	return isFieldType(coreType) || isSymbolType(coreType);
}

export function isSupertypeLike(body: unknown): boolean {
	const b = unwrapPrec(body);
	if (!b || typeof b !== 'object') return false;
	const t = (b as Record<string, unknown>).type;
	if (typeof t !== 'string' || !isChoiceType(t)) return false;
	const members = (b as Record<string, unknown>).members;
	if (!Array.isArray(members) || members.length === 0) return false;
	/* Member compatibility mirrors link's `classifyHiddenChoiceRule` supertype
	   test (SYMBOL / named alias / enum-or-string): each such arm
	   materializes its OWN node (or token) at parse time, so the choice as a
	   whole stays a pure dispatch point. A named ALIAS arm (e.g.
	   tree-sitter-rust's aliased `u8|i8|…` primitive enum inside
	   `_expression_except_range`) is as dispatchable as a bare symbol ref. */
	return members.every((m) => {
		const core = unwrapPrec(m);
		if (!core || typeof core !== 'object') return false;
		const c = core as Record<string, unknown>;
		const coreType = c.type;
		if (typeof coreType !== 'string') return false;
		if (isSymbolType(coreType) || isStringType(coreType)) return true;
		if (typeEq(coreType, 'ALIAS')) return c.named === true;
		return false;
	});
}
