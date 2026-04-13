/**
 * Shared ir-namespace key resolution.
 *
 * The ir namespace (`import { ir } from './ir.js'`) exposes each kind
 * under a short, ergonomic key. Multiple emitters need the SAME key
 * map — ir-v2 produces the namespace itself, and test-v2 emits
 * `ir.<key>(...)` calls that have to line up. Without a shared
 * computation the two diverge on every kind that collides on its short
 * name (python: parenthesized_expression vs parenthesized_list_splat,
 * typescript: true/false/await reserved-word suffixes, …).
 *
 * The map is built once per NodeMap in generate.ts and passed to both
 * emitters.
 */

import type { NodeMap } from '../compiler/rule.ts'
import { nameNode } from '../compiler/assemble.ts'

/**
 * Map of grammar kind → ir namespace key. Covers every factory-bearing
 * kind in the NodeMap. Collisions are resolved in node iteration order:
 * the first claimant wins the short name, subsequent kinds fall back to
 * the full factory name.
 */
export type IrKeyMap = ReadonlyMap<string, string>

export function buildIrKeyMap(nodeMap: NodeMap): IrKeyMap {
    const result = new Map<string, string>()
    const claimed = new Set<string>()

    for (const [kind, node] of nodeMap.nodes) {
        if (!node.factoryName) continue
        // Skip synthesised polymorph form groups — they live under their
        // parent polymorph's variant dispatch, not as top-level ir keys.
        if (node.modelType === 'group') continue

        const short = toShortName(kind)
        if (!claimed.has(short)) {
            claimed.add(short)
            result.set(kind, short)
            continue
        }
        // Collision — fall back to the full factory name.
        const full = nameNode(kind).factoryName
        claimed.add(full)
        result.set(kind, full)
    }

    return result
}

/**
 * Strip common suffixes and lowerCamelCase the result. An `x_expression`
 * kind becomes `x`; `function_item` becomes `function` (though that
 * collides with the JS reserved word and the second pass below
 * promotes it to the full factory name).
 */
function toShortName(kind: string): string {
    const stripped = kind
        .replace(/_item$/, '')
        .replace(/_expression$/, '')
        .replace(/_statement$/, '')
        .replace(/_declaration$/, '')
        .replace(/_definition$/, '')
    const parts = stripped.split('_').filter(Boolean)
    if (parts.length === 0) return nameNode(kind).factoryName
    const camel = parts.map((w, i) =>
        i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1),
    ).join('')
    // Disambiguate names that collide with JS keywords (`true`, `false`,
    // `await`, …) by falling back to the factory name (which already has
    // the `_` suffix applied).
    if (JS_RESERVED_KEY.has(camel)) return nameNode(kind).factoryName
    return camel
}

const JS_RESERVED_KEY = new Set([
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
    'default', 'delete', 'do', 'else', 'enum', 'export', 'extends',
    'false', 'finally', 'for', 'function', 'if', 'import', 'in',
    'instanceof', 'let', 'new', 'null', 'return', 'static', 'super',
    'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void',
    'while', 'with', 'yield', 'async', 'await',
])
