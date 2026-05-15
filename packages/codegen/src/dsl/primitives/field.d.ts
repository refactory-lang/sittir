/**
 * dsl/field.ts — sittir field shadow with one-arg placeholder form.
 *
 * Tree-sitter's baseline `field()` takes two args: `field(name, content)`.
 * Sittir's transform() patches need a one-arg form so authors can write:
 *
 *     transform(original, { 0: field('expression') })
 *
 * Two-arg calls delegate to whichever `field` is provided as a global
 * by the runtime — sittir's grammarFn-injected field (lowercase
 * `{type:'field'}`) in sittir's pipeline, tree-sitter's native field
 * (uppercase `{type:'FIELD'}`) when the transpiled grammar.js is
 * loaded by tree-sitter's CLI. This keeps the same call site valid
 * for both consumers without case-conversion shims.
 *
 * One-arg calls return a sittir-only placeholder marker that
 * `transform()`'s resolvePatch swaps out before the result reaches
 * the runtime's grammar() processing. The marker never escapes into
 * a final grammar tree.
 *
 * Import explicitly when you want the one-arg form:
 *
 *     import { field } from '@sittir/codegen/dsl'
 */
import type { Rule } from '../../compiler/rule.ts';
import type { FieldLike } from '../runtime-shapes.ts';
import type { RuntimeRule } from '../runtime-shapes.ts';
/**
 * Shared `FIELD(name, <shape-containing-STRING>)` →
 * `FIELD(name, <shape with STRING replaced by SYMBOL(_kw_<name>)>)`
 * transformation. Synthesizes a hidden `_kw_<name>: 'kw'` rule via
 * registerSyntheticRule, marks it for wire-managed `inline:`, and rewrites the content so
 * tree-sitter's normalizer preserves the FIELD wrapper.
 *
 * Tree-sitter strips FIELD wrappers around bare STRING nodes at grammar-
 * normalization time. To keep the field label, we indirect every
 * contained STRING through a hidden SYMBOL rule.
 *
 * Shapes handled:
 *
 *   - **Bare STRING** — direct `field('x', 'literal')` case. The STRING
 *     is replaced by a SYMBOL reference to `_kw_<x>` (body: `'literal'`).
 *
 *   - **OPTIONAL(STRING)** — grammar like `seq(optional('&'), ...)`
 *     with an override `0: field('lifetime')` wraps position 0 as
 *     `field('lifetime', optional('&'))`. Tree-sitter would strip the
 *     FIELD if the inner were bare STRING reachable through the
 *     optional; routing through a SYMBOL preserves the label. Both
 *     the sittir lowercase `optional` shape and the tree-sitter
 *     uppercase `CHOICE(STRING, BLANK)` representation of optional
 *     are handled.
 *
 * Used by:
 *   - transform.ts resolvePatch (one-arg field() placeholder path)
 *   - the two-arg field(name, 'literal') path below
 *
 * Optional `wrapSyntheticBody` lets callers apply an extra wrap
 * (e.g., transform's accumulated prec stack) around the synthetic
 * rule's body before registration. Returns the content unchanged
 * when no STRING is reachable through the recognized shapes.
 */
export declare function maybeKeywordSymbol(fieldName: string, content: unknown, wrapSyntheticBody?: (body: RuntimeRule) => RuntimeRule): unknown;
type Input = string | RegExp | Rule;
/** Marker emitted by `field('name')` — a placeholder for transform patches. */
export interface FieldPlaceholder {
    readonly __sittirPlaceholder: 'field';
    readonly name: string;
}
export declare function isFieldPlaceholder(v: unknown): v is FieldPlaceholder;
/**
 * Two-arg form delegates to the runtime's native field. One-arg form
 * returns a placeholder for transform patches.
 *
 * When the two-arg form is called with a bare STRING literal content
 * (e.g. `field('async', 'async')`), the content is substituted with a
 * synthesized SYMBOL reference to a hidden `_kw_<name>` rule. This
 * mirrors transform.ts's placeholder path — tree-sitter's grammar
 * normalizer strips FIELD wrappers around bare STRING, so we indirect
 * through a SYMBOL to preserve the field in the parse tree.
 *
 * Return type is a discriminated union: the one-arg placeholder has
 * a readable `__sittirPlaceholder` brand; the two-arg result matches
 * whatever shape the runtime-injected `field()` produces (sittir
 * lowercase `type: 'field'` or tree-sitter uppercase `type: 'FIELD'`).
 */
export declare function field(name: string, content?: Input): FieldPlaceholder | FieldLike;
export {};
//# sourceMappingURL=field.d.ts.map