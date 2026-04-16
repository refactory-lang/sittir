/**
 * dsl/alias.ts — sittir alias shadow with one-arg shorthand.
 *
 * Tree-sitter's baseline `alias()` always takes two args:
 *
 *     alias(rule, valueOrName)
 *
 * The most common authoring case is `alias($.name, $.name)` — aliasing
 * a symbol to itself with `named: true`. The shorthand collapses that to:
 *
 *     alias($.name)
 *
 * Both forms delegate to the runtime's native `alias()` (provided as
 * a global by sittir's grammarFn injection in sittir's pipeline, or
 * by tree-sitter's CLI when the transpiled grammar.js loads). This
 * means the resulting rule shape matches whatever runtime is processing
 * the call — sittir lowercase `{type:'alias'}` or tree-sitter uppercase
 * `{type:'ALIAS'}` — without case-conversion shims here.
 *
 * Import explicitly when you want the one-arg form:
 *
 *     import { alias } from '@sittir/codegen/dsl'
 */

import type { Rule } from '../compiler/rule.ts'
import { isSymbolLike } from './runtime-shapes.ts'

export function alias(rule: Rule, value?: string | Rule): unknown {
    const native = (globalThis as { alias?: (r: unknown, v: unknown) => unknown }).alias
    if (typeof native !== 'function') {
        throw new Error('alias(): no global alias() found — must be called inside a runtime that injects alias() (sittir evaluate.ts or tree-sitter CLI)')
    }

    // One-arg shorthand: alias($.name) ≡ alias($.name, $.name).
    if (value === undefined) {
        if (!isSymbolLike(rule)) {
            throw new Error(
                `alias(): one-argument form requires a symbol reference (e.g. $.name), got ${JSON.stringify(rule)}`,
            )
        }
        return native(rule, rule)
    }

    // Two-arg form — delegate to native alias.
    return native(rule, value)
}
