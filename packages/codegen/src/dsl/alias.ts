/**
 * dsl/alias.ts — sittir alias shadow with one-arg shorthand.
 *
 * Tree-sitter's baseline `alias()` always takes two args:
 *
 *     alias(rule, valueOrName)
 *
 * The most common authoring case is `alias($.name, $.name)` — aliasing
 * a symbol to itself with `named: true`. The shorthand collapses that
 * to:
 *
 *     alias($.name)
 *
 * which is treated as identical to `alias($.name, $.name)`.
 *
 * Two-arg calls pass through unchanged so this is a strict superset of
 * tree-sitter's behavior. Override files that import the sittir alias
 * shadow it within their module scope; grammar.js base files keep
 * using the global injection.
 *
 * Import explicitly when you want the shorthand:
 *
 *     import { alias } from '@sittir/codegen/dsl'
 */

import type { Rule, AliasRule, SymbolRule } from '../compiler/rule.ts'

type SymbolLike = { type: 'symbol'; name: string } & Record<string, unknown>

export function alias(rule: Rule, value?: string | Rule): AliasRule {
    // One-arg shorthand: alias($.name) ≡ alias($.name, $.name).
    // Only valid when `rule` is a symbol reference — otherwise we
    // can't synthesize the second arg, which must name something.
    if (value === undefined) {
        if (!rule || typeof rule !== 'object' || (rule as SymbolLike).type !== 'symbol') {
            throw new Error(
                `alias(): one-argument form requires a symbol reference (e.g. $.name), got ${JSON.stringify(rule)}`,
            )
        }
        return {
            type: 'alias',
            content: rule,
            named: true,
            value: (rule as SymbolLike).name,
        }
    }

    // Two-arg form — match the baseline tree-sitter alias semantics.
    if (typeof value === 'string') {
        return { type: 'alias', content: rule, named: false, value }
    }
    if (typeof value === 'object' && 'type' in value && value.type === 'symbol') {
        return { type: 'alias', content: rule, named: true, value: (value as SymbolRule).name }
    }
    throw new Error(`alias(): invalid second argument ${JSON.stringify(value)}`)
}
