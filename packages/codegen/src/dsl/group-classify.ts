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
	type RuntimeRule,
} from '../types/runtime-shapes.ts';
import { detectRepeatSeparator } from './list-patterns.ts';

// ---------------------------------------------------------------------------
// ruleMatchesEmpty
// ---------------------------------------------------------------------------

/**
 * Conservative empty-matching predicate. Returns true iff the rule can produce
 * the empty string:
 *   - `optional` / `repeat` / `blank`                      → always matches empty
 *   - `repeat1`                                             → iff content matches empty
 *   - `seq`                                                 → iff ALL members match empty
 *   - `choice`                                              → iff ANY member matches empty
 *   - `field` / prec-wrapper                               → iff content matches empty
 *   - `string` / `symbol` / `token` / `pattern`            → false (non-empty)
 */
export function ruleMatchesEmpty(rule: unknown): boolean {
	if (!rule || typeof rule !== 'object') return false;
	const r = rule as Record<string, unknown>;
	const t = typeof r.type === 'string' ? r.type : '';

	// Always-empty wrappers
	if (isOptionalType(t) || isPlainRepeatType(t) || isBlankType(t)) return true;

	// repeat1 — empty iff content is empty (unusual, but guard conservatively)
	if (typeEq(t, 'REPEAT1')) {
		return ruleMatchesEmpty(r.content);
	}

	// seq — ALL members must match empty
	if (isSeqType(t)) {
		const members = r.members;
		if (!Array.isArray(members) || members.length === 0) return true;
		return members.every((m) => ruleMatchesEmpty(m));
	}

	// choice — ANY member matches empty
	if (typeEq(t, 'CHOICE')) {
		const members = r.members;
		if (!Array.isArray(members)) return false;
		return members.some((m) => ruleMatchesEmpty(m));
	}

	// field / prec — delegate to content
	if (isFieldType(t) || isPrecWrapper(r as { type: string })) {
		return ruleMatchesEmpty(r.content);
	}

	// string / symbol / token / pattern — conservatively non-empty
	if (isStringType(t) || isSymbolType(t) || typeEq(t, 'TOKEN') || typeEq(t, 'PATTERN')) return false;

	// Unknown rule type — conservatively non-empty
	return false;
}

/** plain repeat (not repeat1). Duplicates `isPlainRepeatType` in
 *  runtime-shapes but keeps this module self-contained. */
function isPlainRepeatType(t: string): boolean {
	return t === 'REPEAT';
}

// ---------------------------------------------------------------------------
// isInlineSafe
// ---------------------------------------------------------------------------

/**
 * Collects the "slot" members of a seq body after dropping pure
 * literals/punctuation and `blank`. Descends transparently through `prec`
 * wrappers and `field` wrappers to find the underlying slot type.
 *
 * A "slot" is a member that contributes structured content — `field`,
 * `symbol`, `choice`, `repeat`, `repeat1`, `seq` (nested), or any non-literal
 * non-blank rule. Pure literals (`string`, `token`) and `blank` are dropped.
 */
function collectSlots(members: unknown[]): unknown[] {
	const slots: unknown[] = [];
	for (const m of members) {
		if (!m || typeof m !== 'object') continue;
		const r = m as Record<string, unknown>;
		const t = typeof r.type === 'string' ? r.type : '';

		// Drop pure literals and blank
		if (isStringType(t) || typeEq(t, 'TOKEN') || isBlankType(t)) continue;

		// Everything else is a slot
		slots.push(m);
	}
	return slots;
}

/**
 * Unwrap `prec` wrappers to reach the underlying slot type. Descends through
 * a chain of prec layers only. Returns the innermost rule that is not a prec
 * wrapper.
 *
 * NOTE: we do NOT descend through `field` here because a `field` slot is
 * itself the thing we are classifying (it is field-typed → inline-safe). If
 * we descended through it we would see its content (e.g. a bare `choice`),
 * which would incorrectly mark the slot as unsafe.
 */
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

/**
 * Recursively inline the members of nested `seq` children into one flat list,
 * descending transparently through `prec` wrappers and nested `seq`s only. Does
 * NOT descend into `choice`/`field`/`optional`/`repeat` content — those are
 * opaque slots whose internals must not be flattened into the parent member list.
 */
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

/**
 * True iff the seq members contain a `repeat`/`repeat1` slot once nested seqs
 * are flattened (the hallmark of a list). `prec` wrappers are transparent.
 */
function seqHasTopLevelRepeat(members: unknown[]): boolean {
	for (const m of flattenSeqMembers(members)) {
		const core = unwrapPrec(m);
		if (!core || typeof core !== 'object') continue;
		const ct = (core as Record<string, unknown>).type;
		if (typeof ct === 'string' && isRepeatLike(ct)) return true;
	}
	return false;
}

// ---------------------------------------------------------------------------
// Separator-variability qualification
// ---------------------------------------------------------------------------

/**
 * True iff a detected repeat separator itself varies per-instance: a
 * non-literal (`choice`/`symbol`/`pattern`) separator rule rather than a bare
 * `string` literal. A choice-of-separators (e.g. tree-sitter-typescript's
 * `sepBy1(choice(',', $._semicolon), X)`) or a symbol/pattern separator
 * (external-scanner-driven) means the concrete separator text can differ
 * per instance, so the list can't render from one fixed separator string —
 * the same signal `detectRepeatSeparator`'s existing callers
 * (`enrich.ts`'s `listSeparatorOfOptionalSeq`) already act on.
 */
function isNonterminalSeparatorType(t: string): boolean {
	return isChoiceType(t) || isSymbolType(t) || typeEq(t, 'PATTERN');
}

/**
 * True iff `repeatRule`'s own separator (per `detectRepeatSeparator` run on
 * its `content`) is non-literal — see `isNonterminalSeparatorType`.
 */
function repeatHasNonterminalSeparator(repeatRule: RuntimeRule): boolean {
	const content = (repeatRule as { content?: unknown }).content;
	if (!content || typeof content !== 'object') return false;
	const detected = detectRepeatSeparator(content as RuntimeRule);
	if (!detected) return false;
	return isNonterminalSeparatorType(detected.separator.type);
}

/**
 * True iff `member` is an `optional(STRING sep)` or `choice(STRING sep,
 * blank)` flank whose literal value equals `sepValue` — mirrors the shape
 * `absorbTrailingListSeparators`/`peelOptionalSeq` (enrich.ts) already
 * recognize for a stranded leading/trailing separator flank sibling to a
 * list's repeat (e.g. `commaSep1(E)`'s desugared
 * `seq(E, repeat(seq(SEP, E)), optional(SEP))`).
 */
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
				isStringType(typeof (m as Record<string, unknown>).type === 'string' ? ((m as Record<string, unknown>).type as string) : '') &&
				(m as Record<string, unknown>).value === sepValue
		);
		return hasBlank && hasMatchingLiteral;
	}

	return false;
}

/**
 * True iff `repeatRule` (a top-level repeat member found among `siblings`,
 * the flattened seq member list it lives in) has genuine per-instance
 * separator variability: either its own separator is non-literal
 * (`repeatHasNonterminalSeparator`), or a SIBLING member in the same
 * flattened seq is an optional/choice-of-blank flank of that same separator
 * literal (a stranded leading/trailing comma). Either shape means the list
 * can't be rendered from one fixed separator string — it needs its own
 * visible `AssembledSeparatedList` template, not the hidden inline-flat
 * path.
 */
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

/**
 * True iff a BARE repeat/repeat1 body (not embedded in an enclosing seq) has
 * genuine separator variability. No sibling flank check applies here — a
 * bare repeat has no enclosing seq member list to hold a stranded flank —
 * so this reduces to the non-literal-separator check only.
 */
function repeatHasGenuineSeparatorVariability(repeatRule: RuntimeRule): boolean {
	return repeatHasNonterminalSeparator(repeatRule);
}

/**
 * True iff `members` (post-flattening) contains EXACTLY ONE separator-
 * carrying top-level repeat/repeat1 member AND that one repeat has genuine
 * separator variability — see `repeatMemberHasGenuineSeparatorVariability`.
 *
 * Scoped to the single-SEPARATOR-CARRYING-repeat case deliberately: a seq
 * body representing a genuine separated list (`commaSep1(E)` and its
 * Task-1-confirmed real-world shape) has exactly ONE top-level repeat
 * carrying the list's separator. The census here only counts repeats whose
 * content itself has a `detectRepeatSeparator`-detectable separator shape —
 * a repeat with NO separator shape at all can neither BE the separated
 * list (it has nothing to flag as separator-variable) nor be the
 * unrelated-repeat this guard exists to protect against (there's no
 * separator to mis-match a sibling flank against). This matters for real
 * grammar shapes like rust's `enum_variant_list`/`field_declaration_list`/
 * `ordered_field_declaration_list`/`arguments`, whose per-element unit is
 * `seq(repeat($.attribute_item), X)` — a per-element MODIFIER repeat with no
 * separator of its own, which `flattenSeqMembers` surfaces as a second
 * top-level repeat alongside the real list's separator-carrying repeat. A
 * naive "exactly one repeat, of ANY shape" census (the original guard) saw
 * 2 repeats there and bailed, leaving these kinds un-promoted; scoping the
 * census to separator-carrying repeats only fixes that without reopening
 * the original decoy-repeat false positive (the decoy CHOICE-with-no-
 * string-arm test case still detects as separator-carrying via
 * `detectRepeatSeparator`, so it's still correctly counted and the guard
 * still declines to flag multi-separator-repeat compound seqs). A seq with
 * MULTIPLE separator-carrying top-level repeats remains a different,
 * compound shape outside this qualification's design intent — declining to
 * flag it reverts to the existing inline-flat floor behavior (safe by
 * construction, per this file's existing "cannot regress below floor"
 * convention) rather than risking a false-positive match.
 */
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

/**
 * Returns true iff the seq body is "inline-safe":
 *   - After dropping pure literals (`string`, `token`) and `blank` from the
 *     seq's direct members, exactly ONE slot remains.
 *   - That slot (after descending through `prec`/`field` transparently) is a
 *     `field` or `symbol` — NOT a bare `choice`, `repeat`, `repeat1`, `seq`,
 *     or any other multi-valued / compound type.
 *
 * Multi-slot or bare-choice bodies are "inline-unsafe" and require a visible
 * AssembledGroup template for correct rendering.
 *
 * @param seqBody — the rule to classify. Typically the body of an
 *   `optional(seq)` position, but may also be called with non-seq bodies
 *   (returns false for them).
 */
export function isInlineSafe(seqBody: unknown): boolean {
	if (!seqBody || typeof seqBody !== 'object') return false;
	const r = seqBody as Record<string, unknown>;
	const t = typeof r.type === 'string' ? r.type : '';

	// Bare `repeat`/`repeat1` body — a LIST is one flat slot (e.g.
	// `formal_parameters = repeat1(parameter, SEP)`, `class_body`, `enum_body`).
	// Like the separated-list seq shape below, aliasing a bare repeat makes
	// tree-sitter DISTRIBUTE the alias across every element (one alias node per
	// element) instead of one group → array-of-siblings → empty render. A list
	// stays INLINE-FLAT (one list slot); only genuine co-optional groups (a bare
	// `choice`, e.g. rust `visibility_modifier`) take the visible-alias path.
	//
	// EXCEPT when the repeat has genuine per-instance separator variability
	// (a non-literal separator rule) — such a list can't render from one
	// fixed separator string on the inline-flat path and needs its own
	// visible `AssembledSeparatedList` template instead. See
	// `repeatHasGenuineSeparatorVariability`.
	if (isRepeatLike(t)) return !repeatHasGenuineSeparatorVariability(seqBody as RuntimeRule);

	if (!isSeqType(t)) return false;

	const members = r.members;
	if (!Array.isArray(members)) return false;

	// A body containing a (possibly nested) top-level `repeat`/`repeat1` is a
	// LIST → render flat, NOT a co-optional group. This generalizes the
	// separated-list guard below: the list's repeat is frequently nested inside
	// an inner seq — `commaSep1` desugars to
	// `seq(seq(E, repeat(seq(SEP, E))), optional(SEP))`, so the repeat is two
	// levels down (where_clause / formal_parameters / enum_body / list_pattern)
	// — or sits beside a trailing element (`seq(repeat(E), field(last))`, e.g.
	// rust `match_block`). Aliasing any of these makes tree-sitter distribute the
	// alias across each element (array-of-siblings → "not an array" AST mismatch).
	// Only genuine groups with NO repeat (a bare `choice`, e.g. rust
	// `visibility_modifier`; python `slice`) take the visible-alias path.
	// Safe by construction: declining to mint reverts the kind to inline (floor)
	// behavior, which cannot regress below floor.
	//
	// EXCEPT when the top-level repeat has genuine per-instance separator
	// variability (a non-literal separator, or an adjacent stranded
	// optional/choice-of-blank separator flank sibling in this same seq) —
	// see `seqHasGenuineSeparatorVariability`. Such a list falls through to
	// the visible-promotion path below, same as a multi-slot/bare-choice body.
	if (seqHasTopLevelRepeat(members)) return !seqHasGenuineSeparatorVariability(members);

	const slots = collectSlots(members);

	// Must have exactly one slot
	if (slots.length !== 1) return false;

	// The single slot must be a field or symbol (not a bare choice, repeat, etc.).
	// Descend through prec wrappers only — a field slot is itself field-typed and
	// is already inline-safe; descending into it would expose its content (possibly
	// a choice), which would incorrectly classify the slot as unsafe.
	const core = unwrapPrec(slots[0]);
	if (!core || typeof core !== 'object') return false;
	const coreType = (core as Record<string, unknown>).type;
	if (typeof coreType !== 'string') return false;

	return isFieldType(coreType) || isSymbolType(coreType);
}
