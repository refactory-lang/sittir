/**
 * dsl/runtime-shapes.ts — cross-runtime rule shape utilities.
 *
 * **Scope: DSL layer only.** The predicates here are dual-RUNTIME aware
 * because DSL code runs under two different runtimes:
 *
 *   1. **Sittir runtime** — `evaluate.ts` injects `grammarFn` as the
 *      global `grammar()`. Rules use sittir's `Rule` union in
 *      `compiler/rule.ts` (UPPERCASE type discriminators, matching
 *      tree-sitter's own — see decision item 2 in
 *      `docs/superpowers/specs/2026-07-02-rule-type-model-ssot-research.md`).
 *
 *   2. **Tree-sitter CLI runtime** — the transpiled `.sittir/grammar.js`
 *      is loaded by tree-sitter's parser generator. Rules use
 *      tree-sitter-cli's own `dsl.d.ts` natives — same UPPERCASE
 *      discriminators, but different SHAPES for some nodes (nested `$`
 *      refs, `PREC_LEFT` carrying `value`, `optional` lowered to
 *      `CHOICE(x, BLANK)`, etc. — see the SSOT research doc §0's
 *      divergence table).
 *
 * DSL helpers (`transform`, `applyPath`, `enrich`, `field`, `alias`,
 * `role`) run in both runtimes, so they must accept both shapes. The
 * case split that used to motivate `typeEq`'s lower/upper ladders is
 * GONE (both runtimes now agree on UPPERCASE) — what remains here is
 * SHAPE normalization: symbol refs sometimes nested (`{symbol:{...}}`),
 * FIELD `content` typed as `unknown` rather than `Rule`, etc. Consolidate
 * those predicates + type guards here rather than scattering per-file
 * shape checks.
 *
 * **Do NOT import from here in `compiler/` or `validate/`.** Code past
 * the evaluate.ts boundary operates on the sittir-internal `Rule` union
 * exclusively. Use the `isSeq` / `isChoice` / etc. guards in
 * `compiler/rule.ts` instead. Importing this module from `compiler/` is
 * a cross-pipeline-leak signal (see MEMORY.md
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
 * Why a supertype rather than a precise union? Both runtimes agree on
 * UPPERCASE type discriminators, but their SHAPES diverge for some nodes:
 * nested `$` symbol refs, `PREC_LEFT` carrying `value` as `number` (sittir's
 * `prec()` strips the wrapper entirely — see `evaluate.ts::prec` — so a
 * PREC-shaped rule only ever appears via the tree-sitter CLI runtime),
 * `content: unknown` rather than `Rule`, `optional` lowered to
 * `CHOICE(x, BLANK)`, etc. (see this file's header, and the SSOT research
 * doc §0's divergence table). Typing `transform()` as returning `Rule` would
 * lie to consumers about these shape differences; typing it as
 * `RuntimeRule` forces an honest narrowing at every inspection point.
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
	metadata?: unknown;
};

export function isSymbolLike(v: unknown): v is SymbolLike {
	if (!v || typeof v !== 'object') return false;
	const t = (v as { type?: unknown }).type;
	if (t === 'SYMBOL' && typeof (v as { name?: unknown }).name === 'string') return true;
	return extractSymbolName(v) !== undefined;
}

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

export function isContainerType(t: string): boolean {
	return t === 'SEQ' || t === 'CHOICE';
}

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
