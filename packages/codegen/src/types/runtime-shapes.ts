/**
 * dsl/runtime-shapes.ts — cross-runtime rule shape utilities.
 *
 * **Scope: DSL layer only.** See docs/compiler-phase-glossary.md "Phase 1:
 * Evaluate" § two-compiler-shape divergence for why DSL code must accept
 * both the sittir runtime's `Rule` union and the tree-sitter CLI runtime's
 * shapes. This module consolidates the shape-normalization predicates
 * (`isContainerType`/`isWrapperType`/`isPrecWrapper`/`isFieldLike`/
 * `isSymbolLike`) rather than scattering per-file shape checks.
 *
 * **Do NOT import from here in `compiler/` or `validate/`.** Code past the
 * evaluate.ts boundary operates on the sittir-internal `Rule` union
 * exclusively; use the `isSeq`/`isChoice`/etc. guards in `compiler/rule.ts`
 * instead. Importing this module from `compiler/` is a cross-pipeline-leak
 * signal (`feedback_rule_case_as_origin_signal`).
 */

/**
 * The honest return/input type for DSL functions that accept or produce
 * rules without knowing which runtime they're running in — broader than
 * sittir's `Rule` union since the two runtimes' shapes diverge (see the
 * module header). Consumers narrow via this module's guards or by
 * pattern-matching on `type` literals; typing `transform()` as `Rule`
 * would lie about the shape differences.
 *
 * Intentionally shape-minimal (no index signature) so sittir's Rule
 * interfaces — which don't declare `[k: string]: unknown` — are
 * structurally assignable via the `type` field alone. Consumers cast
 * at property-access sites (e.g. `(r as SeqRule).members`).
 */

import type { ChoiceRule, FieldRule, OptionalRule, SeqRule, StringRule, SymbolRule } from './rule.ts';

export type RuntimeRule = { readonly type: string };

type SymbolLike = { type: 'SYMBOL'; name: string };

export type FieldLike = {
	type: 'FIELD';
	name: string;
	content: unknown;
	/** Opaque (debt PR-P1): the former `source?: string` provenance tag is
	 *  gone — `dsl/primitives/field.ts` now stamps `metadata.fieldSource`
	 *  instead (via `dsl/rule-metadata.ts`'s `makeRuleMetadata`). Untyped
	 *  here since `types/` cannot import the opaque brand's dsl-owned
	 *  constructor; writers cast through `unknown`. */
	metadata?: unknown;
};

export function isSymbolLike(v: unknown): v is SymbolLike {
	if (!v || typeof v !== 'object') return false;
	const t = (v as { type?: unknown }).type;
	if (t === 'SYMBOL' && typeof (v as { name?: unknown }).name === 'string') return true;
	return extractSymbolName(v) !== undefined;
}

/**
 * Extract the symbol name from a value that might be a symbol reference
 * in any runtime shape. Tree-sitter CLI wraps `$` references as
 * nested objects; this unwraps to the name string if possible.
 */
function extractSymbolName(v: unknown): string | undefined {
	if (!v || typeof v !== 'object') return undefined;
	const r = v as Record<string, unknown>;
	const t = r.type;
	if (isSymbolType(t)) return typeof r.name === 'string' ? r.name : undefined;
	// Tree-sitter CLI: $.name → { symbol: { type: 'SYMBOL', name: '...' } }
	if (r.symbol && typeof r.symbol === 'object') {
		return extractSymbolName(r.symbol);
	}
	return undefined;
}

export function isFieldLike(v: unknown): v is FieldLike {
	if (!v || typeof v !== 'object') return false;
	const t = (v as { type?: unknown }).type;
	return t === 'FIELD' && typeof (v as { name?: unknown }).name === 'string';
}

/**
 * True for a FIELD wrapper whose SHAPE matches what `dsl/enrich.ts`'s
 * mechanical passes produce — independent of the `source` provenance tag.
 * Per the 2026-07-02 user decision (lingering-debt-inventory-research.md
 * §3.1, "DESIGN QUESTION — RESOLVED"): a user-authored wrapper that is
 * shape-identical to enrich's output IS patch-transparent — structural
 * semantics win unconditionally, provenance is not required. This predicate
 * is `transform.ts`'s structural replacement for the former
 * `inner.source === 'inferred' || inner.source === 'enriched'` checks.
 *
 * Covers the two FIELD(SYMBOL) shapes enrich actually emits
 * (`dsl/enrich.ts` passes 1 and 2 — see that file's header comment; the
 * "bare leading-keyword" pass is disabled and never fires):
 *
 *   1. Symbol-to-field promotion (`applySymbolToField` and its
 *      repeat-seq variants) — `field(NAME, SYMBOL(SYM))` where NAME is
 *      derived from SYM's name: `NAME === SYM`, the supertype-stripped
 *      form `NAME === SYM.replace(/^_/, '')` (e.g. `field('expression',
 *      $._expression)`), or either of those with a 1-based numbered
 *      suffix for duplicate-kind positions (`NAME === base + N`, e.g.
 *      `field('expression1', $.expression)` / `field('expression2',
 *      $.expression)` — see `enrich.test.ts` "numbers duplicate
 *      references").
 *   2. Optional keyword-prefix promotion (`tryPromoteInnerKeyword`) —
 *      `field(*, SYMBOL(_kw_*))`: the referenced symbol's reserved
 *      `_kw_` prefix is itself the signal (the field's own name follows
 *      the `<token>_marker` convention but that's not load-bearing here —
 *      the hidden-symbol prefix is enrich's exclusive namespace, so any
 *      FIELD wrapping a `_kw_*` SYMBOL is enrich-shaped).
 */
export function isEnrichShapedFieldWrapper(v: unknown): v is FieldLike {
	if (!isFieldLike(v)) return false;
	const symName = extractSymbolName(v.content);
	if (symName === undefined) return false;
	// Shape 2: reserved `_kw_` prefix — enrich's exclusive namespace.
	if (symName.startsWith('_kw_')) return true;
	// Shape 1: NAME === SYM, or the supertype-stripped variant. Exact
	// equality is checked FIRST so a symbol whose own name ends in digits
	// (`field('foo2', $.foo2)`) is not misclassified by the suffix-strip
	// below (PR #117 review finding).
	const strippedSym = symName.replace(/^_/, '');
	if (v.name === symName || v.name === strippedSym) return true;
	// Numbered-duplicate variant: enrich appends a digit run to the field
	// name when the same symbol occurs multiple times in one seq
	// (`expression1`, `expression2`) — strip the suffix and re-compare.
	const baseName = v.name.replace(/[0-9]+$/, '');
	return baseName !== v.name && (baseName === symName || baseName === strippedSym);
}

/**
 * True for `SEQ` / `CHOICE` — rules with a `members: Rule[]` payload.
 */
export function isContainerType(t: string): boolean {
	return t === 'SEQ' || t === 'CHOICE';
}

/**
 * True for single-content wrapper types — `OPTIONAL`, `REPEAT`,
 * `REPEAT1`, `FIELD`, plus the token-wrapper variants tree-sitter
 * uses internally.
 */
export function isWrapperType(t: string): boolean {
	return (
		t === 'OPTIONAL' ||
		t === 'REPEAT' ||
		t === 'REPEAT1' ||
		t === 'FIELD' ||
		t === 'TOKEN' ||
		t === 'IMMEDIATE_TOKEN' ||
		t === 'BLANK'
	);
}

/**
 * True for precedence wrappers — `PREC`, `PREC_LEFT`, `PREC_RIGHT`,
 * `PREC_DYNAMIC`. Sittir's runtime strips these (see
 * `evaluate.ts::prec`); tree-sitter preserves them. Path addressing
 * treats them as transparent.
 */
export function isPrecWrapper(rule: { type: string }): boolean {
	const t = rule.type;
	return t === 'PREC' || t === 'PREC_LEFT' || t === 'PREC_RIGHT' || t === 'PREC_DYNAMIC';
}

// ---------------------------------------------------------------------------
// Per-type discriminators. Both runtimes agree on UPPERCASE discriminants
// (the case split is dissolved — see the module header), so these are plain
// equality checks; they're consolidated here (rather than inline `t ===
// 'SEQ'` scattered per file) because callers frequently hold `t: unknown`
// and want a typed narrowing guard, not because of any remaining case
// ambiguity.
// ---------------------------------------------------------------------------

/** True if `t` equals `upper` (both runtimes now agree on the discriminant case). */
export function typeEq(t: unknown, upper: string): boolean {
	return t === upper;
}

export const isSeqType = <T>(t: T): t is T & { type: 'SEQ' } & SeqRule => typeEq(t, 'SEQ');
export const isChoiceType = <T>(t: T): t is T & { type: 'CHOICE' } & ChoiceRule => typeEq(t, 'CHOICE');
export const isOptionalType = <T>(t: T): t is T & { type: 'OPTIONAL' } & OptionalRule => typeEq(t, 'OPTIONAL');
export const isFieldType = <T>(t: T): t is T & { type: 'FIELD' } & FieldRule => typeEq(t, 'FIELD');
export const isSymbolType = <T>(t: T): t is T & { type: 'SYMBOL' } & SymbolRule => typeEq(t, 'SYMBOL');
export const isStringType = <T>(t: T): t is T & { type: 'STRING' } & StringRule => typeEq(t, 'STRING');
/** Plain repeat (zero-or-more). Excludes repeat1. Callers that need
 *  either should use {@link isRepeatType}. */
export const isPlainRepeatType = (t: unknown): boolean => typeEq(t, 'REPEAT');
/** Either repeat variant — true for both `repeat` and `repeat1`. */
export const isRepeatType = (t: unknown): boolean => typeEq(t, 'REPEAT') || typeEq(t, 'REPEAT1');
export const isBlankType = (t: unknown): boolean => typeEq(t, 'BLANK');
