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
import { wireRegisterSyntheticInline, wireRegisterSyntheticRule } from '../wire/wire.js';
import { isStringType, isOptionalType, isChoiceType } from '../runtime-shapes.js';
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
export function maybeKeywordSymbol(fieldName, content, wrapSyntheticBody) {
    const c = content;
    if (!c || typeof c.type !== 'string')
        return content;
    // Bare STRING — synthesize the hidden rule and return a SYMBOL ref.
    if (isStringType(c.type)) {
        return synthesizeKwSymbol(fieldName, content, wrapSyntheticBody);
    }
    // OPTIONAL(STRING) — descend through the wrapper, recurse into
    // content, and rebuild the optional around the new SYMBOL ref.
    // Tree-sitter's FIELD(OPTIONAL(SYMBOL)) survives; FIELD(OPTIONAL(STRING))
    // may not.
    if (isOptionalType(c.type)) {
        return descendOptional(fieldName, content, wrapSyntheticBody, 'optional');
    }
    // CHOICE(STRING, BLANK) is tree-sitter's normalized form for
    // `optional(STRING)`. Detect the shape and treat as optional.
    if (isChoiceType(c.type)) {
        const members = content.members;
        if (Array.isArray(members) && members.length === 2) {
            const blankIdx = members.findIndex((m) => m?.type === 'BLANK' || m?.type === 'blank');
            if (blankIdx !== -1) {
                return descendOptional(fieldName, content, wrapSyntheticBody, 'choice-blank');
            }
        }
        return content;
    }
    return content;
}
/**
 * Create the `_kw_<fieldName>` hidden rule, register it for wire-managed
 * `inline:`, and return a SYMBOL reference to it, preserving the
 * runtime's case convention (uppercase when the input STRING is
 * uppercase, lowercase otherwise).
 */
function synthesizeKwSymbol(fieldName, content, wrapSyntheticBody) {
    const c = content;
    const isUpperCase = c.type === 'STRING';
    const hiddenName = `_kw_${fieldName}`;
    let body = content;
    if (wrapSyntheticBody)
        body = wrapSyntheticBody(body);
    if (!wireRegisterSyntheticRule(hiddenName, body)) {
        throw new Error(`field('${fieldName}', <STRING>): no active wire() context — call must occur inside a rule callback wrapped by wire()`);
    }
    wireRegisterSyntheticInline(hiddenName);
    return {
        type: isUpperCase ? 'SYMBOL' : 'symbol',
        name: hiddenName
    };
}
/**
 * Recurse into an optional-shaped wrapper's content. If the inner is a
 * bare STRING that `maybeKeywordSymbol` would symbolize, rebuild the
 * wrapper around the new SYMBOL ref so the original optional semantics
 * are preserved while the inner STRING is routed through a hidden rule.
 *
 * `wrapperKind`:
 *   - `'optional'` — sittir lowercase `{ type: 'optional', content }`
 *     (or tree-sitter's uppercase `{ type: 'OPTIONAL', content }` —
 *     both use a `content` field).
 *   - `'choice-blank'` — tree-sitter's `CHOICE` of `[content, BLANK]`
 *     normalized form of `optional(content)`.
 *
 * Returns the content unchanged if the inner isn't a symbolizable STRING.
 */
function descendOptional(fieldName, content, wrapSyntheticBody, wrapperKind) {
    let inner;
    if (wrapperKind === 'optional') {
        inner = content.content;
    }
    else {
        const members = content.members;
        const nonBlank = members.find((m) => m.type !== 'BLANK' && m.type !== 'blank');
        inner = nonBlank;
    }
    const rewritten = maybeKeywordSymbol(fieldName, inner, wrapSyntheticBody);
    if (rewritten === inner)
        return content;
    // Rebuild the wrapper around the rewritten inner.
    if (wrapperKind === 'optional') {
        const nativeOptional = globalThis.optional;
        if (typeof nativeOptional !== 'function')
            return content;
        return nativeOptional(rewritten);
    }
    // choice-blank: reconstruct the CHOICE preserving the BLANK position.
    const c = content;
    const newMembers = c.members.map((m) => (m.type === 'BLANK' || m.type === 'blank' ? m : rewritten));
    return { ...c, members: newMembers };
}
export function isFieldPlaceholder(v) {
    return !!v && typeof v === 'object' && v.__sittirPlaceholder === 'field';
}
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
export function field(name, content) {
    if (content === undefined) {
        return {
            __sittirPlaceholder: 'field',
            name
        };
    }
    const native = globalThis.field;
    if (typeof native !== 'function') {
        throw new Error('field(): no global field() found — must be called inside a runtime that injects field() (sittir evaluate.ts or tree-sitter CLI)');
    }
    return buildTwoArgFieldResult(native, name, content);
}
/**
 * Invoke the runtime-injected `field()` function, symbolize any bare STRING
 * content, and tag the result `source: 'override'`.
 *
 * @remarks
 * The native `field()` call normalizes `content` into a rule shape (plain
 * JS strings become STRING rules). If the normalized inner content is a bare
 * STRING, we swap it for a SYMBOL reference to a synthesized `_kw_<name>`
 * hidden rule so tree-sitter's grammar normalizer preserves the FIELD wrapper
 * around it (the normalizer strips FIELD wrappers around bare STRING nodes).
 * wire() later auto-inlines the helper back into the parse state machine so
 * the parser still sees the original bare token at the call site.
 * Tagging `source: 'override'` lets `derive-overrides-json` recognize
 * user-authored field() calls and skip them from the runtime routing map.
 *
 * @param native - The runtime-injected `field(name, content)` function.
 * @param name - The field name to assign.
 * @param content - The raw content to place under the field.
 * @returns A FieldLike with `source: 'override'` stamped on it.
 */
function buildTwoArgFieldResult(native, name, content) {
    const initial = native(name, content);
    const inner = initial.content;
    const symbolized = maybeKeywordSymbol(name, inner);
    if (symbolized !== inner) {
        const reconstructed = native(name, symbolized);
        return {
            ...reconstructed,
            source: 'override'
        };
    }
    return { ...initial, source: 'override' };
}
//# sourceMappingURL=field.js.map