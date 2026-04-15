/**
 * post-evaluate-invariant.test.ts — structural guard for spec 006 Phase 8.
 *
 * After `evaluate()` runs on each grammar's overrides.ts, the resulting
 * RawGrammar must contain ONLY tree-sitter-native rule constructs (in
 * sittir's lowercase spelling, since evaluate runs the sittir-injected
 * grammarFn). Sittir-only metadata that the DSL extensions produce
 * (FieldPlaceholder markers from one-arg `field()` calls, raw
 * `__sittirPlaceholder` objects, etc.) MUST NOT survive into the rule
 * tree — they are interim values that resolvePatch swaps out before
 * the result reaches the pipeline.
 *
 * The role accumulator's output IS allowed to ride along on
 * `RawGrammar.externalRoles` — that's the documented sidecar Link
 * consumes.
 *
 * This test is the regression guard for the architectural cleanup in
 * commits 59dcb21..99d77fb. If a future change starts leaking sittir
 * placeholders into the rule tree, this test fails before the broken
 * shapes reach Link.
 */

import { describe, it, expect } from 'vitest'
import { evaluate } from '../compiler/evaluate.ts'
import { resolveOverridesPath } from '../compiler/resolve-grammar.ts'
import type { Rule, RawGrammar } from '../compiler/rule.ts'

const KNOWN_RULE_TYPES = new Set([
    // Structural grouping
    'seq', 'optional', 'choice', 'repeat', 'repeat1',
    // Named patterns
    'field', 'variant', 'clause', 'enum', 'supertype', 'group', 'terminal', 'polymorph',
    // Terminals
    'string', 'pattern',
    // Structural whitespace
    'indent', 'dedent', 'newline',
    // References (Link resolves these)
    'symbol', 'alias', 'token',
])

const GRAMMARS = ['python', 'rust', 'typescript'] as const

describe('post-evaluate invariant', () => {
    for (const grammar of GRAMMARS) {
        it(`${grammar}: rule tree contains only known rule types`, async () => {
            const overridesPath = resolveOverridesPath(grammar)
            const raw = await evaluate(overridesPath)

            const violations: string[] = []
            for (const [ruleName, rule] of Object.entries(raw.rules)) {
                walkRule(rule, ruleName, [], (node, ruleName, path) => {
                    if (!node || typeof node !== 'object') return
                    const t = (node as { type?: unknown }).type
                    if (typeof t !== 'string') {
                        violations.push(`${ruleName}@${path.join('/')}: missing type field`)
                        return
                    }
                    if (!KNOWN_RULE_TYPES.has(t)) {
                        violations.push(`${ruleName}@${path.join('/')}: unknown rule type '${t}'`)
                    }
                })
            }
            expect(violations, violations.join('\n')).toEqual([])
        })

        it(`${grammar}: rule tree contains no sittir placeholders`, async () => {
            const overridesPath = resolveOverridesPath(grammar)
            const raw = await evaluate(overridesPath)

            const violations: string[] = []
            for (const [ruleName, rule] of Object.entries(raw.rules)) {
                walkRule(rule, ruleName, [], (node, ruleName, path) => {
                    if (!node || typeof node !== 'object') return
                    if ('__sittirPlaceholder' in node) {
                        violations.push(`${ruleName}@${path.join('/')}: leaked __sittirPlaceholder`)
                    }
                    // _needsContent is a legacy sittir-only marker on
                    // FieldRule placeholders — also must not survive.
                    if ((node as { _needsContent?: unknown })._needsContent) {
                        violations.push(`${ruleName}@${path.join('/')}: leaked _needsContent placeholder`)
                    }
                })
            }
            expect(violations, violations.join('\n')).toEqual([])
        })

        it(`${grammar}: top-level RawGrammar shape is the documented sidecar set`, async () => {
            const overridesPath = resolveOverridesPath(grammar)
            const raw = await evaluate(overridesPath)

            // Allowed top-level fields. Anything else is a leaked
            // sittir-only payload that the pipeline doesn't expect.
            const ALLOWED = new Set([
                'name', 'rules', 'extras', 'externals', 'supertypes', 'inline',
                'conflicts', 'word', 'references', 'overrideRuleNames',
                // Documented sidecar — populated by role() accumulator.
                'externalRoles',
            ])
            const extra = Object.keys(raw as unknown as Record<string, unknown>).filter(k => !ALLOWED.has(k))
            expect(extra, `unexpected RawGrammar fields: ${extra.join(', ')}`).toEqual([])
        })
    }
})

/**
 * Recursively walk a rule tree, calling `visit` for every nested
 * rule object. Tracks the path (chain of field names / member indices)
 * for error reporting.
 */
function walkRule(
    node: unknown,
    ruleName: string,
    path: (string | number)[],
    visit: (node: unknown, ruleName: string, path: (string | number)[]) => void,
): void {
    visit(node, ruleName, path)
    if (!node || typeof node !== 'object') return
    const r = node as Record<string, unknown>
    if (Array.isArray(r.members)) {
        for (let i = 0; i < r.members.length; i++) {
            walkRule(r.members[i], ruleName, [...path, i], visit)
        }
    }
    if (r.content && typeof r.content === 'object') {
        walkRule(r.content, ruleName, [...path, 'content'], visit)
    }
}
