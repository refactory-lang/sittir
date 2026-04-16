/**
 * dsl/alias.ts — sittir alias shadow with placeholder form.
 *
 * Two authoring modes:
 *
 *   1. **Two-arg** — `alias(rule, $.name)` or `alias(rule, 'name')`:
 *      delegates directly to the runtime's native `alias()`.
 *
 *   2. **One-arg placeholder** — `alias('assignment_eq')`:
 *      returns an `AliasPlaceholder` that `transform()`'s
 *      `resolvePatch` fills in with the original content at the
 *      patch target. Same pattern as `field('name')`.
 *
 *      In the override file:
 *        transform(original, { '1/0': alias('assignment_eq') })
 *
 *      resolvePatch produces:
 *        alias(original_content_at_1_0, { type: 'SYMBOL', name: 'assignment_eq' })
 *
 * Import explicitly when you want the placeholder form:
 *
 *     import { alias } from '@sittir/codegen/dsl'
 */

import type { Rule } from '../compiler/rule.ts'

export interface AliasPlaceholder {
    readonly __sittirPlaceholder: 'alias'
    readonly name: string
}

export function isAliasPlaceholder(v: unknown): v is AliasPlaceholder {
    return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'alias'
}

export function alias(rule: Rule | string, value?: string | Rule): unknown {
    // One-arg string form: alias('variant_name') → placeholder for transform.
    if (typeof rule === 'string' && value === undefined) {
        return { __sittirPlaceholder: 'alias' as const, name: rule } satisfies AliasPlaceholder
    }

    const native = (globalThis as { alias?: (r: unknown, v: unknown) => unknown }).alias
    if (typeof native !== 'function') {
        throw new Error('alias(): no global alias() found — must be called inside a runtime that injects alias() (sittir evaluate.ts or tree-sitter CLI)')
    }

    // Two-arg form — delegate to native alias.
    if (value !== undefined) {
        return native(rule, value)
    }

    // One-arg symbol form: alias($.name) ≡ alias($.name, $.name).
    return native(rule, rule)
}
