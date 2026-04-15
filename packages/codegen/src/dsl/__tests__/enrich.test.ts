import { describe, it, expect, vi, afterEach } from 'vitest'
import { enrich } from '../enrich.ts'
import type { Rule } from '../../compiler/rule.ts'

// Minimal helper: build a tree-sitter grammar result in the shape our
// grammarFn produces — `{ grammar: { name, rules } }`.
function mkGrammar(rules: Record<string, Rule>) {
    return { grammar: { name: 'test', rules } }
}

describe('enrich()', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('purity & non-mutation', () => {
        it('does not mutate the input grammar', () => {
            const input = mkGrammar({
                foo: {
                    type: 'seq',
                    members: [{ type: 'string', value: 'hello' }],
                },
            })
            const snapshot = JSON.stringify(input)
            enrich(input)
            expect(JSON.stringify(input)).toBe(snapshot)
        })

        it('is idempotent — enrich(enrich(g)) ≡ enrich(g)', () => {
            const input = mkGrammar({
                async_fn: {
                    type: 'seq',
                    members: [
                        { type: 'string', value: 'async' },
                        { type: 'symbol', name: 'fn_body' },
                    ],
                },
            })
            const once = enrich(input)
            const twice = enrich(once)
            expect(JSON.stringify(twice)).toBe(JSON.stringify(once))
        })
    })

    describe('keyword-prefix field promotion', () => {
        it('promotes a leading string literal to a named field', () => {
            const input = mkGrammar({
                async_fn: {
                    type: 'seq',
                    members: [
                        { type: 'string', value: 'async' },
                        { type: 'symbol', name: 'fn_body' },
                    ],
                },
            })
            const out = enrich(input)
            const rule = out.grammar.rules.async_fn as { type: 'seq', members: Rule[] }
            expect(rule.members[0]).toMatchObject({
                type: 'field',
                name: 'async',
                content: { type: 'string', value: 'async' },
                source: 'inferred',
            })
        })

        it('skips promotion when a field with the same name already exists', () => {
            const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
            const input = mkGrammar({
                async_fn: {
                    type: 'seq',
                    members: [
                        { type: 'string', value: 'async' },
                        {
                            type: 'field',
                            name: 'async',
                            content: { type: 'symbol', name: 'fn_body' },
                        },
                    ],
                },
            })
            const out = enrich(input)
            const rule = out.grammar.rules.async_fn as { type: 'seq', members: Rule[] }
            // Original string still in place — not promoted
            expect(rule.members[0]).toMatchObject({ type: 'string', value: 'async' })
            // Skip reported to stderr
            const calls = stderrSpy.mock.calls.map(c => c[0])
            expect(calls.some(c => String(c).includes("skipped keyword-prefix on async_fn"))).toBe(true)
        })

        it('does not promote non-identifier-shaped literals', () => {
            const input = mkGrammar({
                assignment: {
                    type: 'seq',
                    members: [
                        { type: 'symbol', name: 'lhs' },
                        { type: 'string', value: '=' },
                        { type: 'symbol', name: 'rhs' },
                    ],
                },
            })
            const out = enrich(input)
            const rule = out.grammar.rules.assignment as { type: 'seq', members: Rule[] }
            // '=' is punctuation, not identifier-shaped — untouched
            expect(rule.members[1]).toMatchObject({ type: 'string', value: '=' })
        })
    })

    describe('optional keyword-prefix field promotion (replaces Link.promoteOptionalKeywordFields)', () => {
        it('promotes optional(stringLiteral) to optional(field(...))', () => {
            const input = mkGrammar({
                decl: {
                    type: 'seq',
                    members: [
                        {
                            type: 'optional',
                            content: { type: 'string', value: 'pub' },
                        },
                        { type: 'symbol', name: 'name' },
                    ],
                },
            })
            const out = enrich(input)
            const rule = out.grammar.rules.decl as { type: 'seq', members: Rule[] }
            expect(rule.members[0]).toMatchObject({
                type: 'optional',
                content: {
                    type: 'field',
                    name: 'pub',
                    content: { type: 'string', value: 'pub' },
                    source: 'inferred',
                },
            })
        })
    })

    describe('non-seq rules', () => {
        it('passes through choice rules unchanged', () => {
            const input = mkGrammar({
                expr: {
                    type: 'choice',
                    members: [
                        { type: 'symbol', name: 'a' },
                        { type: 'symbol', name: 'b' },
                    ],
                },
            })
            const out = enrich(input)
            expect(out.grammar.rules.expr).toEqual(input.grammar.rules.expr)
        })

        it('passes through bare symbol rules unchanged', () => {
            const input = mkGrammar({
                alias_rule: { type: 'symbol', name: 'target' },
            })
            const out = enrich(input)
            expect(out.grammar.rules.alias_rule).toEqual(input.grammar.rules.alias_rule)
        })
    })
})
