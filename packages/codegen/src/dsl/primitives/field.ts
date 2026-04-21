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

import type { Rule } from '../../compiler/rule.ts'
import type { FieldLike } from '../runtime-shapes.ts'
import { wireRegisterSyntheticRule } from '../wire/wire.ts'
import { isStringType, type RuntimeRule } from '../runtime-shapes.ts'

/**
 * Shared `FIELD(name, bare-STRING)` → `FIELD(name, SYMBOL(_kw_<name>))`
 * transformation. Synthesizes a hidden `_kw_<name>: prec.left(1, 'kw')`
 * rule via registerSyntheticRule and returns a SYMBOL reference
 * matching the runtime's case. Callers receive the symbol to pass as
 * the FIELD's content — tree-sitter's normalizer preserves FIELD
 * around SYMBOL (unlike FIELD around bare STRING).
 *
 * Used by:
 *   - transform.ts resolvePatch (one-arg field() placeholder path)
 *   - the two-arg field(name, 'literal') path below
 *
 * Optional `wrapSyntheticBody` lets callers apply an extra wrap
 * (e.g., transform's accumulated prec stack) around the synthetic
 * rule's body before registration. Returns the content unchanged
 * when it isn't a bare STRING.
 */
export function maybeKeywordSymbol(
    fieldName: string,
    content: unknown,
    wrapSyntheticBody?: (body: RuntimeRule) => RuntimeRule,
): unknown {
    const c = content as { type?: string; value?: string }
    if (!c || typeof c.type !== 'string') return content
    if (!isStringType(c.type)) return content
    const isUpperCase = c.type === 'STRING'
    const hiddenName = `_kw_${fieldName}`
    const nativePrec = (globalThis as {
        prec?: { left?: (v: number, c: unknown) => unknown }
    }).prec
    let precBody: RuntimeRule = (typeof nativePrec?.left === 'function'
        ? nativePrec.left(1, content)
        : content) as RuntimeRule
    if (wrapSyntheticBody) precBody = wrapSyntheticBody(precBody)
    if (!wireRegisterSyntheticRule(hiddenName, precBody)) {
        throw new Error(`field('${fieldName}', <STRING>): no active wire() context — call must occur inside a rule callback wrapped by wire()`)
    }
    return {
        type: isUpperCase ? 'SYMBOL' : 'symbol',
        name: hiddenName,
    }
}

type Input = string | RegExp | Rule

/** Marker emitted by `field('name')` — a placeholder for transform patches. */
export interface FieldPlaceholder {
    readonly __sittirPlaceholder: 'field'
    readonly name: string
}

export function isFieldPlaceholder(v: unknown): v is FieldPlaceholder {
    return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'field'
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
export function field(name: string, content?: Input): FieldPlaceholder | FieldLike {
    if (content === undefined) {
        return { __sittirPlaceholder: 'field' as const, name } satisfies FieldPlaceholder
    }
    const native = (globalThis as { field?: (n: string, c: Input) => unknown }).field
    if (typeof native !== 'function') {
        throw new Error('field(): no global field() found — must be called inside a runtime that injects field() (sittir evaluate.ts or tree-sitter CLI)')
    }
    // Call native field once to normalize whatever shape `content`
    // arrives in (plain JS strings become STRING rules, etc.). If the
    // normalized inner content is a bare STRING, swap for a SYMBOL
    // reference to a synthesized hidden rule so tree-sitter preserves
    // the FIELD wrapper. Tag `source: 'override'` — user-authored
    // field() calls are by definition override-sourced, and the tag
    // lets derive-overrides-json skip them from the runtime routing map.
    const initial = native(name, content) as FieldLike & { content?: unknown }
    const inner = initial.content
    const symbolized = maybeKeywordSymbol(name, inner)
    if (symbolized !== inner) {
        const reconstructed = native(name, symbolized as Input) as FieldLike
        return { ...reconstructed, source: 'override' as const } as unknown as FieldLike
    }
    return { ...initial, source: 'override' as const } as unknown as FieldLike
}
