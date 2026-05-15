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
export function isSymbolLike(v) {
    if (!v || typeof v !== 'object')
        return false;
    const t = v.type;
    if ((t === 'symbol' || t === 'SYMBOL') && typeof v.name === 'string')
        return true;
    return extractSymbolName(v) !== undefined;
}
/**
 * Extract the symbol name from a value that might be a symbol reference
 * in any runtime shape. Tree-sitter CLI wraps `$` references as
 * nested objects; this unwraps to the name string if possible.
 */
export function extractSymbolName(v) {
    if (!v || typeof v !== 'object')
        return undefined;
    const r = v;
    const t = r.type;
    if (isSymbolType(t))
        return typeof r.name === 'string' ? r.name : undefined;
    // Tree-sitter CLI: $.name → { symbol: { type: 'SYMBOL', name: '...' } }
    if (r.symbol && typeof r.symbol === 'object') {
        return extractSymbolName(r.symbol);
    }
    return undefined;
}
export function isFieldLike(v) {
    if (!v || typeof v !== 'object')
        return false;
    const t = v.type;
    return (t === 'field' || t === 'FIELD') && typeof v.name === 'string';
}
/**
 * True for `seq` / `SEQ` / `choice` / `CHOICE` — rules with a
 * `members: Rule[]` payload.
 */
export function isContainerType(t) {
    return t === 'seq' || t === 'SEQ' || t === 'choice' || t === 'CHOICE';
}
/**
 * True for single-content wrapper types — `optional`, `repeat`,
 * `repeat1`, `field`, plus the token-wrapper variants tree-sitter
 * uses internally.
 */
export function isWrapperType(t) {
    return (t === 'optional' ||
        t === 'repeat' ||
        t === 'REPEAT' ||
        t === 'repeat1' ||
        t === 'REPEAT1' ||
        t === 'field' ||
        t === 'FIELD' ||
        t === 'TOKEN' ||
        t === 'IMMEDIATE_TOKEN' ||
        t === 'BLANK');
}
/**
 * True for precedence wrappers — `prec`, `PREC`, `PREC_LEFT`,
 * `PREC_RIGHT`, `PREC_DYNAMIC`. Sittir's runtime strips these
 * (see `evaluate.ts::prec`); tree-sitter preserves them. Path
 * addressing treats them as transparent.
 */
export function isPrecWrapper(rule) {
    const t = rule.type;
    return (t === 'prec' ||
        t === 'PREC' ||
        t === 'prec_left' ||
        t === 'PREC_LEFT' ||
        t === 'prec_right' ||
        t === 'PREC_RIGHT' ||
        t === 'prec_dynamic' ||
        t === 'PREC_DYNAMIC');
}
// ---------------------------------------------------------------------------
// Per-type discriminators — accept both sittir-lowercase and tree-sitter
// uppercase shapes. Consolidated here so every caller goes through a
// single predicate instead of scattering `typeEq(t, 'seq')` helpers or
// inline `t === 'seq' || t === 'SEQ'` ladders across the codebase.
// ---------------------------------------------------------------------------
/** True if `t` equals `lower` or its uppercase form (`'seq'` or `'SEQ'`). */
export function typeEq(t, lower) {
    return typeof t === 'string' && (t === lower || t === lower.toUpperCase());
}
export const isSeqType = (t) => typeEq(t, 'seq');
export const isChoiceType = (t) => typeEq(t, 'choice');
export const isOptionalType = (t) => typeEq(t, 'optional');
export const isFieldType = (t) => typeEq(t, 'field');
export const isSymbolType = (t) => typeEq(t, 'symbol');
export const isStringType = (t) => typeEq(t, 'string');
/** Plain repeat (zero-or-more). Excludes repeat1. Callers that need
 *  either should use {@link isRepeatType}. */
export const isPlainRepeatType = (t) => typeEq(t, 'repeat');
/** Either repeat variant — true for both `repeat` and `repeat1`. */
export const isRepeatType = (t) => typeEq(t, 'repeat') || typeEq(t, 'repeat1');
export const isBlankType = (t) => typeEq(t, 'blank');
//# sourceMappingURL=runtime-shapes.js.map