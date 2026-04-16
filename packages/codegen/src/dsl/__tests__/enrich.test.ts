import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from 'vitest'
import { enrich } from '../enrich.ts'
import type { Rule } from '../../compiler/rule.ts'
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts'

// Minimal helper: build a tree-sitter grammar result in the shape our
// grammarFn produces — `{ grammar: { name, rules } }`.
function mkGrammar(rules: Record<string, Rule>) {
    return { grammar: { name: 'test', rules } }
}

// enrich() now emits an `__enrichOverrides__` side-channel (callbacks
// that grammar() invokes at rule evaluation time). For unit tests we
// drive each override with the original base rule to get the enriched
// output, mirroring what grammar() does under both runtimes.
function runEnrich(input: ReturnType<typeof mkGrammar>) {
    const out = enrich(input) as unknown as {
        grammar: { rules: Record<string, Rule> }
        __enrichOverrides__?: Record<string, (_$: unknown, original: Rule) => Rule>
    }
    const overrides = out.__enrichOverrides__ ?? {}
    const result: Record<string, Rule> = {}
    for (const [name, rule] of Object.entries(input.grammar.rules)) {
        result[name] = overrides[name]?.({}, rule) ?? rule
    }
    return { ...out, grammar: { ...out.grammar, rules: result } }
}

describe('enrich()', () => {
    beforeAll(() => { installFakeDsl() })
    afterAll(() => { restoreFakeDsl() })
    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('purity & non-mutation', () => {
        it('does not mutate the input grammar', () => {
            const input = mkGrammar({
                call: {
                    type: 'seq',
                    members: [
                        { type: 'symbol', name: 'function' },
                        { type: 'string', value: '(' },
                        { type: 'symbol', name: 'arguments' },
                        { type: 'string', value: ')' },
                    ],
                },
            })
            const snapshot = JSON.stringify(input)
            enrich(input)
            expect(JSON.stringify(input)).toBe(snapshot)
        })

        it('is idempotent — enrich(enrich(g)) ≡ enrich(g)', () => {
            const input = mkGrammar({
                call: {
                    type: 'seq',
                    members: [
                        { type: 'symbol', name: 'function' },
                        { type: 'string', value: '(' },
                        { type: 'symbol', name: 'arguments' },
                        { type: 'string', value: ')' },
                    ],
                },
            })
            const once = enrich(input)
            const twice = enrich(once)
            expect(JSON.stringify(twice)).toBe(JSON.stringify(once))
        })
    })

    describe('kind-to-name field wrapping', () => {
        it('wraps unambiguous symbol references as named fields', () => {
            const input = mkGrammar({
                call: {
                    type: 'seq',
                    members: [
                        { type: 'symbol', name: 'function' },
                        { type: 'string', value: '(' },
                        { type: 'symbol', name: 'arguments' },
                        { type: 'string', value: ')' },
                    ],
                },
            })
            const out = runEnrich(input)
            const rule = out.grammar.rules.call as { type: 'seq', members: Rule[] }
            expect(rule.members[0]).toMatchObject({
                type: 'field',
                name: 'function',
                content: { type: 'symbol', name: 'function' },
                source: 'override',
            })
            expect(rule.members[2]).toMatchObject({
                type: 'field',
                name: 'arguments',
                content: { type: 'symbol', name: 'arguments' },
                source: 'override',
            })
            // String delimiters untouched
            expect(rule.members[1]).toMatchObject({ type: 'string', value: '(' })
            expect(rule.members[3]).toMatchObject({ type: 'string', value: ')' })
        })

        it('skips when a field with the same name already exists', () => {
            const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
            const input = mkGrammar({
                foo: {
                    type: 'seq',
                    members: [
                        {
                            type: 'field',
                            name: 'expression',
                            content: { type: 'string', value: '(' },
                        },
                        { type: 'symbol', name: 'expression' },
                    ],
                },
            })
            const out = runEnrich(input)
            const rule = out.grammar.rules.foo as { type: 'seq', members: Rule[] }
            // Second member (bare symbol) stays bare — already-taken name
            expect(rule.members[1]).toMatchObject({ type: 'symbol', name: 'expression' })
            const calls = stderrSpy.mock.calls.map(c => String(c[0]))
            expect(calls.some(c => c.includes("skipped kind-to-name on foo"))).toBe(true)
        })

        it('skips ambiguous references — same kind appears multiple times', () => {
            const input = mkGrammar({
                binary_expr: {
                    type: 'seq',
                    members: [
                        { type: 'symbol', name: 'expression' },
                        { type: 'string', value: '+' },
                        { type: 'symbol', name: 'expression' },
                    ],
                },
            })
            const out = runEnrich(input)
            const rule = out.grammar.rules.binary_expr as { type: 'seq', members: Rule[] }
            // Both stays bare — ambiguous which is THE expression
            expect(rule.members[0]).toMatchObject({ type: 'symbol', name: 'expression' })
            expect(rule.members[2]).toMatchObject({ type: 'symbol', name: 'expression' })
        })

        it('skips hidden-kind references (leading underscore)', () => {
            const input = mkGrammar({
                foo: {
                    type: 'seq',
                    members: [
                        { type: 'symbol', name: '_statement' },
                        { type: 'string', value: ';' },
                    ],
                },
            })
            const out = runEnrich(input)
            const rule = out.grammar.rules.foo as { type: 'seq', members: Rule[] }
            // Hidden kind stays bare — sittir Link handles alias resolution
            expect(rule.members[0]).toMatchObject({ type: 'symbol', name: '_statement' })
        })

        it('leaves existing field wrappers in place', () => {
            const input = mkGrammar({
                assign: {
                    type: 'seq',
                    members: [
                        {
                            type: 'field',
                            name: 'left',
                            content: { type: 'symbol', name: 'expression' },
                        },
                        { type: 'string', value: '=' },
                        { type: 'symbol', name: 'rhs' },
                    ],
                },
            })
            const out = runEnrich(input)
            const rule = out.grammar.rules.assign as { type: 'seq', members: Rule[] }
            // Existing field preserved
            expect(rule.members[0]).toMatchObject({ type: 'field', name: 'left' })
            // rhs promoted
            expect(rule.members[2]).toMatchObject({
                type: 'field',
                name: 'rhs',
                source: 'override',
            })
        })
    })

    describe('optional keyword-prefix promotion (pass 2)', () => {
        it('promotes optional(identifier-shaped string) to optional(field)', () => {
            const input = mkGrammar({
                function_definition: {
                    type: 'seq',
                    members: [
                        { type: 'optional', content: { type: 'string', value: 'async' } },
                        { type: 'string', value: 'def' },
                        { type: 'symbol', name: 'name' },
                    ],
                },
            })
            const out = runEnrich(input)
            const rule = out.grammar.rules.function_definition as { type: 'seq', members: Rule[] }
            // optional(field(kw, SYMBOL(_kw_async))) — the FIELD's
            // content is a synthesized SYMBOL reference so tree-sitter's
            // normalizer preserves it. Tagged 'override' now that the
            // parser carries the field natively.
            expect(rule.members[0]).toMatchObject({
                type: 'optional',
                content: {
                    type: 'field',
                    name: 'async',
                    content: { type: 'symbol', name: '_kw_async' },
                    source: 'override',
                },
            })
            // 'def' is NOT promoted — bare leading literal, only the
            // optional variant is handled (spec 006 restriction).
            expect(rule.members[1]).toMatchObject({ type: 'string', value: 'def' })
        })

        it('does not promote non-identifier-shaped literals', () => {
            const input = mkGrammar({
                conditional: {
                    type: 'seq',
                    members: [
                        { type: 'optional', content: { type: 'string', value: '::' } },
                        { type: 'symbol', name: 'path' },
                    ],
                },
            })
            const out = runEnrich(input)
            const rule = out.grammar.rules.conditional as { type: 'seq', members: Rule[] }
            // '::' is punctuation — untouched
            expect(rule.members[0]).toMatchObject({
                type: 'optional',
                content: { type: 'string', value: '::' },
            })
        })

        it('skips when a field with the same name already exists, reports to stderr', () => {
            const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
            const input = mkGrammar({
                decorated_fn: {
                    type: 'seq',
                    members: [
                        {
                            type: 'field',
                            name: 'async',
                            content: { type: 'string', value: 'async' },
                        },
                        { type: 'optional', content: { type: 'string', value: 'async' } },
                    ],
                },
            })
            const out = runEnrich(input)
            const rule = out.grammar.rules.decorated_fn as { type: 'seq', members: Rule[] }
            // Second member stays unpromoted — collision
            expect(rule.members[1]).toMatchObject({
                type: 'optional',
                content: { type: 'string', value: 'async' },
            })
            const calls = stderrSpy.mock.calls.map(c => String(c[0]))
            expect(calls.some(c => c.includes('skipped optional-keyword-prefix on decorated_fn'))).toBe(true)
        })

        it('recurses into choice members', () => {
            const input = mkGrammar({
                stmt: {
                    type: 'choice',
                    members: [
                        {
                            type: 'seq',
                            members: [
                                { type: 'optional', content: { type: 'string', value: 'let' } },
                                { type: 'symbol', name: 'binding' },
                            ],
                        },
                        {
                            type: 'seq',
                            members: [
                                { type: 'optional', content: { type: 'string', value: 'const' } },
                                { type: 'symbol', name: 'binding' },
                            ],
                        },
                    ],
                },
            })
            const out = runEnrich(input)
            const rule = out.grammar.rules.stmt as { type: 'choice', members: Array<{ type: 'seq', members: Rule[] }> }
            // Both choice branches get the optional-keyword promotion
            const branch0 = rule.members[0]!
            const branch1 = rule.members[1]!
            expect(branch0.members[0]).toMatchObject({
                type: 'optional',
                content: { type: 'field', name: 'let' },
            })
            expect(branch1.members[0]).toMatchObject({
                type: 'optional',
                content: { type: 'field', name: 'const' },
            })
        })

        it('recurses into nested wrappers (optional/repeat)', () => {
            const input = mkGrammar({
                block: {
                    type: 'repeat',
                    content: {
                        type: 'seq',
                        members: [
                            { type: 'optional', content: { type: 'string', value: 'pub' } },
                            { type: 'symbol', name: 'item' },
                        ],
                    },
                },
            })
            const out = runEnrich(input)
            const rule = out.grammar.rules.block as { type: 'repeat', content: { type: 'seq', members: Rule[] } }
            expect(rule.content.members[0]).toMatchObject({
                type: 'optional',
                content: { type: 'field', name: 'pub' },
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
            const out = runEnrich(input)
            expect(out.grammar.rules.expr).toEqual(input.grammar.rules.expr)
        })

        it('passes through bare symbol rules unchanged', () => {
            const input = mkGrammar({
                alias_rule: { type: 'symbol', name: 'target' },
            })
            const out = runEnrich(input)
            expect(out.grammar.rules.alias_rule).toEqual(input.grammar.rules.alias_rule)
        })
    })
})
