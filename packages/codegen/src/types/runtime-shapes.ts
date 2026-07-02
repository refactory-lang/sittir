/**
 * dsl/runtime-shapes.ts — cross-runtime rule shape utilities.
 *
 * **Scope: DSL layer only.** The predicates here are dual-case aware
 * because DSL code runs under two different runtimes:
 *
 *   1. **Sittir runtime** — `evaluate.ts` injects `grammarFn` as the
 *      global `grammar()`. Rules use lowercase type discriminators
 *      (`'seq'`, `'choice'`, `'symbol'`, `'field'`, ...) matching
 *      sittir's `Rule` union in `compiler/rule.ts`.
 *
 *   2. **Tree-sitter CLI runtime** — the transpiled `.sittir/grammar.js`
 *      is loaded by tree-sitter's parser generator. Rules use
 *      uppercase type discriminators (`'SEQ'`, `'CHOICE'`, `'SYMBOL'`,
 *      `'FIELD'`, ...) per tree-sitter-cli's `dsl.d.ts`.
 *
 * DSL helpers (`transform`, `applyPath`, `enrich`, `field`, `alias`,
 * `role`) run in both runtimes, so they must accept both shapes.
 * Rather than scatter `t === 'seq' || t === 'SEQ'` ladders through
 * every file, consolidate the predicates + type guards here.
 *
 * **Do NOT import from here in `compiler/` or `validate/`.** Code
 * past the evaluate.ts boundary operates on the sittir-internal
 * `Rule` union — single-case by construction. Use the `isSeq` /
 * `isChoice` / etc. guards in `compiler/rule.ts` instead. Mixing
 * the two sets is a cross-pipeline-leak signal (see MEMORY.md
 * `feedback_rule_case_as_origin_signal`).
 */

/**
 * The honest return/input type for DSL functions that accept or
 * produce rules without knowing which runtime they're running in.
 *
 * Broader than sittir's `Rule` union: any object with a string
 * `type` discriminator is a `RuntimeRule`. Consumers that need to
 * access runtime-specific fields (`members`, `content`, `name`,
 * ...) must narrow via the guards in this module (`isContainerType`,
 * `isWrapperType`, `isPrecWrapper`, `isFieldLike`, `isSymbolLike`)
 * or by pattern-matching on `type` literals.
 *
 * Why a supertype rather than a precise union? Sittir's `Rule` union
 * commits to lowercase literals and specific interface shapes. Under
 * tree-sitter's CLI runtime the same DSL code receives uppercase
 * tree-sitter natives with subtly different shapes (e.g. `PREC_LEFT`
 * carries `value` as `number`, sittir's `prec` is stripped entirely).
 * Typing `transform()` as returning `Rule` would lie to consumers;
 * typing it as `RuntimeRule` forces an honest narrowing at every
 * inspection point.
 *
 * Intentionally shape-minimal (no index signature) so sittir's Rule
 * interfaces — which don't declare `[k: string]: unknown` — are
 * structurally assignable via the `type` field alone. Consumers cast
 * at property-access sites (e.g. `(r as SeqRule).members`).
 */

import type { ChoiceRule, FieldRule, OptionalRule, Rule, SeqRule, StringRule, SymbolRule } from './rule.ts';

export type RuntimeRule = { readonly type: string };

type SymbolLike = { type: 'symbol' | 'SYMBOL'; name: string };

export type FieldLike = {
	type: 'field' | 'FIELD';
	name: string;
	content: unknown;
	source?: string;
};

export function isSymbolLike(v: unknown): v is SymbolLike {
	if (!v || typeof v !== 'object') return false;
	const t = (v as { type?: unknown }).type;
	if ((t === 'symbol' || t === 'SYMBOL') && typeof (v as { name?: unknown }).name === 'string') return true;
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
	return (t === 'field' || t === 'FIELD') && typeof (v as { name?: unknown }).name === 'string';
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
 * True for `seq` / `SEQ` / `choice` / `CHOICE` — rules with a
 * `members: Rule[]` payload.
 */
export function isContainerType(t: string): boolean {
	return t === 'seq' || t === 'SEQ' || t === 'choice' || t === 'CHOICE';
}

/**
 * True for single-content wrapper types — `optional`, `repeat`,
 * `repeat1`, `field`, plus the token-wrapper variants tree-sitter
 * uses internally.
 */
export function isWrapperType(t: string): boolean {
	return (
		t === 'optional' ||
		t === 'repeat' ||
		t === 'REPEAT' ||
		t === 'repeat1' ||
		t === 'REPEAT1' ||
		t === 'field' ||
		t === 'FIELD' ||
		t === 'TOKEN' ||
		t === 'IMMEDIATE_TOKEN' ||
		t === 'BLANK'
	);
}

/**
 * True for precedence wrappers — `prec`, `PREC`, `PREC_LEFT`,
 * `PREC_RIGHT`, `PREC_DYNAMIC`. Sittir's runtime strips these
 * (see `evaluate.ts::prec`); tree-sitter preserves them. Path
 * addressing treats them as transparent.
 */
export function isPrecWrapper(rule: { type: string }): boolean {
	const t = rule.type;
	return (
		t === 'prec' ||
		t === 'PREC' ||
		t === 'prec_left' ||
		t === 'PREC_LEFT' ||
		t === 'prec_right' ||
		t === 'PREC_RIGHT' ||
		t === 'prec_dynamic' ||
		t === 'PREC_DYNAMIC'
	);
}

// ---------------------------------------------------------------------------
// Per-type discriminators — accept both sittir-lowercase and tree-sitter
// uppercase shapes. Consolidated here so every caller goes through a
// single predicate instead of scattering `typeEq(t, 'seq')` helpers or
// inline `t === 'seq' || t === 'SEQ'` ladders across the codebase.
// ---------------------------------------------------------------------------

/** True if `t` equals `lower` or its uppercase form (`'seq'` or `'SEQ'`). */
export function typeEq(t: unknown, lower: string): boolean {
	return typeof t === 'string' && (t === lower || t === lower.toUpperCase());
}

type IsRuntimeRule<T> = T extends { type: infer U } ? (U extends Uppercase<string> ? false : true) : false;

export const isSeqType = <T>(
	t: T
): t is T & (IsRuntimeRule<T> extends true ? SeqRule : { type: 'SEQ'; content: Rule }) => typeEq(t, 'seq');
export const isChoiceType = <T>(
	t: T
): t is T & (IsRuntimeRule<T> extends true ? ChoiceRule : { type: 'CHOICE'; content: Rule }) => typeEq(t, 'choice');
export const isOptionalType = <T>(
	t: T
): t is T & (IsRuntimeRule<T> extends true ? OptionalRule : { type: 'OPTIONAL'; content: Rule }) =>
	typeEq(t, 'optional');
export const isFieldType = <T>(
	t: T
): t is T & (IsRuntimeRule<T> extends true ? FieldRule : { type: 'FIELD'; content: Rule }) => typeEq(t, 'field');
export const isSymbolType = <T>(
	t: T
): t is T & (IsRuntimeRule<T> extends true ? SymbolRule : { type: 'SYMBOL'; content: Rule }) => typeEq(t, 'symbol');
export const isStringType = <T>(
	t: T
): t is T & (IsRuntimeRule<T> extends true ? StringRule : { type: 'STRING'; content: Rule }) => typeEq(t, 'string');
/** Plain repeat (zero-or-more). Excludes repeat1. Callers that need
 *  either should use {@link isRepeatType}. */
export const isPlainRepeatType = (t: unknown): boolean => typeEq(t, 'repeat');
/** Either repeat variant — true for both `repeat` and `repeat1`. */
export const isRepeatType = (t: unknown): boolean => typeEq(t, 'repeat') || typeEq(t, 'repeat1');
export const isBlankType = (t: unknown): boolean => typeEq(t, 'blank');
