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
import type { ChoiceRule, FieldRule, OptionalRule, Rule, SeqRule, StringRule, SymbolRule } from '../compiler/rule.ts';
export type RuntimeRule = {
    readonly type: string;
};
export type SymbolLike = {
    type: 'symbol' | 'SYMBOL';
    name: string;
};
export type FieldLike = {
    type: 'field' | 'FIELD';
    name: string;
    content: unknown;
    source?: string;
};
export declare function isSymbolLike(v: unknown): v is SymbolLike;
/**
 * Extract the symbol name from a value that might be a symbol reference
 * in any runtime shape. Tree-sitter CLI wraps `$` references as
 * nested objects; this unwraps to the name string if possible.
 */
export declare function extractSymbolName(v: unknown): string | undefined;
export declare function isFieldLike(v: unknown): v is FieldLike;
/**
 * True for `seq` / `SEQ` / `choice` / `CHOICE` — rules with a
 * `members: Rule[]` payload.
 */
export declare function isContainerType(t: string): boolean;
/**
 * True for single-content wrapper types — `optional`, `repeat`,
 * `repeat1`, `field`, plus the token-wrapper variants tree-sitter
 * uses internally.
 */
export declare function isWrapperType(t: string): boolean;
/**
 * True for precedence wrappers — `prec`, `PREC`, `PREC_LEFT`,
 * `PREC_RIGHT`, `PREC_DYNAMIC`. Sittir's runtime strips these
 * (see `evaluate.ts::prec`); tree-sitter preserves them. Path
 * addressing treats them as transparent.
 */
export declare function isPrecWrapper(rule: {
    type: string;
}): boolean;
/** True if `t` equals `lower` or its uppercase form (`'seq'` or `'SEQ'`). */
export declare function typeEq(t: unknown, lower: string): boolean;
export type IsRuntimeRule<T> = T extends {
    type: infer U;
} ? (U extends Uppercase<string> ? false : true) : false;
export declare const isSeqType: <T>(t: T) => t is T & (IsRuntimeRule<T> extends true ? SeqRule : {
    type: 'SEQ';
    content: Rule;
});
export declare const isChoiceType: <T>(t: T) => t is T & (IsRuntimeRule<T> extends true ? ChoiceRule : {
    type: 'CHOICE';
    content: Rule;
});
export declare const isOptionalType: <T>(t: T) => t is T & (IsRuntimeRule<T> extends true ? OptionalRule : {
    type: 'OPTIONAL';
    content: Rule;
});
export declare const isFieldType: <T>(t: T) => t is T & (IsRuntimeRule<T> extends true ? FieldRule : {
    type: 'FIELD';
    content: Rule;
});
export declare const isSymbolType: <T>(t: T) => t is T & (IsRuntimeRule<T> extends true ? SymbolRule : {
    type: 'SYMBOL';
    content: Rule;
});
export declare const isStringType: <T>(t: T) => t is T & (IsRuntimeRule<T> extends true ? StringRule : {
    type: 'STRING';
    content: Rule;
});
/** Plain repeat (zero-or-more). Excludes repeat1. Callers that need
 *  either should use {@link isRepeatType}. */
export declare const isPlainRepeatType: (t: unknown) => boolean;
/** Either repeat variant — true for both `repeat` and `repeat1`. */
export declare const isRepeatType: (t: unknown) => boolean;
export declare const isBlankType: (t: unknown) => boolean;
//# sourceMappingURL=runtime-shapes.d.ts.map