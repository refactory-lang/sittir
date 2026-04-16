/**
 * dsl/runtime-shapes.ts — cross-runtime rule shape utilities.
 *
 * The sittir DSL layer operates on rule trees produced by two
 * different runtimes:
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
export type RuntimeRule = { readonly type: string }

export type SymbolLike = { type: 'symbol' | 'SYMBOL'; name: string }

export type FieldLike = {
    type: 'field' | 'FIELD'
    name: string
    content: unknown
    source?: string
}

export function isSymbolLike(v: unknown): v is SymbolLike {
    if (!v || typeof v !== 'object') return false
    const t = (v as { type?: unknown }).type
    return (t === 'symbol' || t === 'SYMBOL')
        && typeof (v as { name?: unknown }).name === 'string'
}

export function isFieldLike(v: unknown): v is FieldLike {
    if (!v || typeof v !== 'object') return false
    const t = (v as { type?: unknown }).type
    return (t === 'field' || t === 'FIELD')
        && typeof (v as { name?: unknown }).name === 'string'
}

/**
 * True for `seq` / `SEQ` / `choice` / `CHOICE` — rules with a
 * `members: Rule[]` payload.
 */
export function isContainerType(t: string): boolean {
    return t === 'seq' || t === 'SEQ' || t === 'choice' || t === 'CHOICE'
}

/**
 * True for single-content wrapper types — `optional`, `repeat`,
 * `repeat1`, `field`, plus the token-wrapper variants tree-sitter
 * uses internally.
 */
export function isWrapperType(t: string): boolean {
    return t === 'optional'
        || t === 'repeat' || t === 'REPEAT'
        || t === 'repeat1' || t === 'REPEAT1'
        || t === 'field' || t === 'FIELD'
        || t === 'TOKEN' || t === 'IMMEDIATE_TOKEN'
        || t === 'BLANK'
}

/**
 * True for precedence wrappers — `prec`, `PREC`, `PREC_LEFT`,
 * `PREC_RIGHT`, `PREC_DYNAMIC`. Sittir's runtime strips these
 * (see `evaluate.ts::prec`); tree-sitter preserves them. Path
 * addressing treats them as transparent.
 */
export function isPrecWrapper(rule: { type: string }): boolean {
    const t = rule.type
    return t === 'prec' || t === 'PREC'
        || t === 'PREC_LEFT' || t === 'PREC_RIGHT' || t === 'PREC_DYNAMIC'
}
