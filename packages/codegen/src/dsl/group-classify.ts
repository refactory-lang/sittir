/**
 * dsl/group-classify.ts — shared predicates for inline-safe vs inline-unsafe
 * group classification.
 *
 * **Scope: DSL layer only.** Uses dual-case `runtime-shapes.ts` predicates so
 * these work on both sittir-lowercase and tree-sitter-uppercase rule forms.
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
	isFieldLike,
	isFieldType,
	isOptionalType,
	isPrecWrapper,
	isRepeatType,
	isSeqType,
	isStringType,
	isSymbolLike,
	isSymbolType,
	typeEq,
} from './runtime-shapes.ts';

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
	if (typeEq(t, 'repeat1')) {
		return ruleMatchesEmpty(r.content);
	}

	// seq — ALL members must match empty
	if (isSeqType(t)) {
		const members = r.members;
		if (!Array.isArray(members) || members.length === 0) return true;
		return members.every((m) => ruleMatchesEmpty(m));
	}

	// choice — ANY member matches empty
	if (typeEq(t, 'choice')) {
		const members = r.members;
		if (!Array.isArray(members)) return false;
		return members.some((m) => ruleMatchesEmpty(m));
	}

	// field / prec — delegate to content
	if (isFieldType(t) || isPrecWrapper(r as { type: string })) {
		return ruleMatchesEmpty(r.content);
	}

	// string / symbol / token / pattern — conservatively non-empty
	if (isStringType(t) || isSymbolType(t) || typeEq(t, 'token') || typeEq(t, 'pattern')) return false;

	// Unknown rule type — conservatively non-empty
	return false;
}

/** plain repeat (not repeat1) — duplicates the one in runtime-shapes but keeps
 *  this module self-contained for the dual-case check it needs internally. */
function isPlainRepeatType(t: string): boolean {
	return t === 'repeat' || t === 'REPEAT';
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
		if (isStringType(t) || typeEq(t, 'token') || isBlankType(t)) continue;

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
	return isRepeatType(t) || typeEq(t, 'repeat1');
}

/**
 * A loose "slot kind key" — the unwrapped (prec + field) type, lowercased. Two
 * slots with the same key are treated as the same repeated element for
 * separated-list detection. Choices compare by type alone (a list of
 * choice-shaped elements is still a list).
 */
function slotKindKey(m: unknown): string {
	let cur = m;
	while (cur && typeof cur === 'object') {
		const r = cur as Record<string, unknown>;
		const t = typeof r.type === 'string' ? r.type : '';
		if (isPrecWrapper(r as { type: string }) || isFieldType(t)) {
			cur = r.content;
		} else {
			return t.toLowerCase();
		}
	}
	return '';
}

/**
 * Separated-list (comma-list) detector. The raw grammar shape of `commaSep1(E)`
 * is `seq(E, repeat(seq(SEP, E)), optional(SEP)?)` — a single logical repeated
 * slot. tree-sitter renders/parses it flat (the repeat is the list), so it must
 * stay INLINE (one list slot), NOT be aliased: aliasing a repeat-bearing seq
 * makes tree-sitter distribute the alias across every element (one alias node
 * per element) instead of one group — the `enum_body` regression the opus spike
 * surfaced. We detect: a `repeat`/`repeat1` member whose inner element kind
 * matches the seq's head element kind.
 */
function isSeparatedList(members: unknown[]): boolean {
	const headSlots = collectSlots(members);
	if (headSlots.length === 0) return false;
	const headKey = slotKindKey(headSlots[0]);
	if (!headKey) return false;
	for (const m of members) {
		if (!m || typeof m !== 'object') continue;
		const r = m as Record<string, unknown>;
		const t = typeof r.type === 'string' ? r.type : '';
		if (!isRepeatLike(t)) continue;
		const content = r.content;
		if (!content || typeof content !== 'object') continue;
		const ct = (content as Record<string, unknown>).type;
		const inner = isSeqType(typeof ct === 'string' ? ct : '')
			? collectSlots((content as Record<string, unknown>).members as unknown[])
			: collectSlots([content]);
		if (inner.length >= 1 && slotKindKey(inner[inner.length - 1]) === headKey) return true;
	}
	return false;
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

	if (!isSeqType(t)) return false;

	const members = r.members;
	if (!Array.isArray(members)) return false;

	// Separated/comma list (`E, repeat(seq(SEP, E)), optional(SEP)?`) is ONE
	// logical repeated slot → stays inline/flat. Aliasing it would make
	// tree-sitter distribute the alias across each element (the enum_body
	// regression). Treat as inline-safe.
	if (isSeparatedList(members)) return true;

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
