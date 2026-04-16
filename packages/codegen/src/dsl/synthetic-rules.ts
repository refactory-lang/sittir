/**
 * dsl/synthetic-rules.ts — accumulator for transform-generated hidden rules.
 *
 * When transform sees an `alias('variant_name')` placeholder, it:
 *   1. Captures the original content at the patch target
 *   2. Registers a hidden rule `_variant_name` with that content here
 *   3. Returns `alias($._variant_name, $.variant_name)` as the replacement
 *
 * The accumulated rules are injected into the grammar after all rule
 * callbacks have run. Same scoping pattern as `role()` in role.ts.
 */

import type { RuntimeRule } from './runtime-shapes.ts'

let currentSyntheticRules: Map<string, RuntimeRule> | null = null

export function registerSyntheticRule(name: string, content: RuntimeRule): void {
    if (!currentSyntheticRules) {
        currentSyntheticRules = new Map()
    }
    currentSyntheticRules.set(name, content)
}

export function drainSyntheticRules(): Map<string, RuntimeRule> {
    const rules = currentSyntheticRules ?? new Map()
    currentSyntheticRules = null
    return rules
}

export function withSyntheticRuleScope<T>(fn: () => T): { result: T; syntheticRules: Map<string, RuntimeRule> } {
    const prev = currentSyntheticRules
    currentSyntheticRules = new Map()
    try {
        const result = fn()
        const syntheticRules = currentSyntheticRules
        return { result, syntheticRules }
    } finally {
        currentSyntheticRules = prev
    }
}

/**
 * Wrap tree-sitter's `grammar()` to inject synthetic rules.
 *
 * Problem: tree-sitter builds its $ proxy (RuleBuilder) from
 * opts.rules keys BEFORE evaluating callbacks. Synthetic rule
 * names (from alias placeholders) aren't known until callbacks run.
 *
 * Solution: two-pass evaluation. First pass with a permissive $
 * proxy collects synthetic names. Second pass with those names
 * pre-registered runs the real grammar.
 */
export function installGrammarWrapper(): void {
    const g = globalThis as { grammar?: (...args: unknown[]) => unknown; blank?: () => unknown }
    const nativeGrammar = g.grammar
    if (typeof nativeGrammar !== 'function') return

    g.grammar = function wrappedGrammar(...args: unknown[]): unknown {
        // Pass 1: dry-run to collect synthetic rule names.
        // Evaluate all rule callbacks with a permissive proxy that
        // doesn't throw on unknown names. alias() placeholders
        // register names via registerSyntheticRule.
        currentSyntheticRules = new Map()
        const opts = (args.length > 1 ? args[1] : args[0]) as { rules?: Record<string, (...a: unknown[]) => unknown> } | undefined
        if (opts?.rules) {
            const permissive = new Proxy({}, {
                get(_: unknown, name: string) {
                    return { type: 'SYMBOL', name }
                },
            })
            for (const [, ruleFn] of Object.entries(opts.rules)) {
                if (typeof ruleFn === 'function') {
                    try { ruleFn.call(permissive, permissive, undefined) } catch { /* ignore */ }
                }
            }
        }

        // Collect names discovered in pass 1
        const discoveredNames = new Map(currentSyntheticRules)
        currentSyntheticRules = new Map()

        // Pass 2: add hidden rules as blank() entries to opts.rules
        // so tree-sitter's RuleBuilder includes them in the ruleMap
        if (opts?.rules && discoveredNames.size > 0) {
            const blank = g.blank
            for (const [name] of discoveredNames) {
                if (!(name in opts.rules)) {
                    opts.rules[name] = () => blank ? blank() : ({ type: 'BLANK' })
                }
            }
        }

        const result = nativeGrammar.apply(this, args) as Record<string, unknown> | null

        // Replace blank entries with real captured content
        const synthetic = drainSyntheticRules()
        if (result && synthetic.size > 0 && typeof result === 'object') {
            const grammar = (result as { grammar?: Record<string, unknown> }).grammar ?? result
            if ('rules' in grammar) {
                const rules = grammar.rules as Record<string, unknown>
                for (const [name, content] of synthetic) {
                    rules[name] = content
                }
            }
        }
        return result
    }
}
