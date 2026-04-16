import { describe, it, expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { enrich } from '../enrich.ts'
import type { Rule, SeqRule, FieldRule, StringRule } from '../../compiler/rule.ts'
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts'

function mkGrammar(rules: Record<string, Rule>) {
    return { grammar: { name: 'test', rules } }
}

// enrich emits __enrichOverrides__ — helper to drive each override
// with its original base rule and materialize the enriched output.
function runEnrich(input: ReturnType<typeof mkGrammar>) {
    const out = enrich(input) as unknown as {
        grammar: { name: string, rules: Record<string, Rule> }
        __enrichOverrides__?: Record<string, (_$: unknown, original: Rule) => Rule>
    }
    const overrides = out.__enrichOverrides__ ?? {}
    const result: Record<string, Rule> = {}
    for (const [name, rule] of Object.entries(input.grammar.rules)) {
        result[name] = overrides[name]?.({}, rule) ?? rule
    }
    return { ...out, grammar: { ...out.grammar, rules: result } }
}

function topSeq(g: ReturnType<typeof mkGrammar>, ruleName: string): SeqRule {
    return g.grammar.rules[ruleName] as SeqRule
}

describe('enrich — bareKeywordPrefixPass', () => {
    beforeAll(() => { installFakeDsl() })
    afterAll(() => { restoreFakeDsl() })
    afterEach(() => { vi.restoreAllMocks() })

    it('wraps a leading identifier-shaped literal as field(kw, literal)', () => {
        const g = runEnrich(mkGrammar({
            async_fn: {
                type: 'seq',
                members: [
                    { type: 'string', value: 'async' },
                    { type: 'symbol', name: 'body' },
                ],
            },
        }))

        const seq = topSeq(g, 'async_fn')
        const first = seq.members[0]! as FieldRule
        expect(first.type).toBe('field')
        expect(first.name).toBe('async')
        // FIELD wraps a SYMBOL reference to a synthesized `_kw_async`
        // hidden rule (so tree-sitter's normalizer preserves the field).
        expect((first.content as unknown as { type: string; name: string }).type).toBe('symbol')
        expect((first.content as unknown as { type: string; name: string }).name).toBe('_kw_async')
    })

    it('does NOT wrap non-leading string literals', () => {
        const g = runEnrich(mkGrammar({
            for_loop: {
                type: 'seq',
                members: [
                    { type: 'symbol', name: 'label' },
                    { type: 'string', value: 'for' },
                    { type: 'symbol', name: 'pattern' },
                ],
            },
        }))

        const seq = topSeq(g, 'for_loop')
        expect(seq.members[1]!.type).toBe('string')
    })

    it('does NOT wrap non-identifier-shaped literals (punctuation)', () => {
        const g = runEnrich(mkGrammar({
            paren: {
                type: 'seq',
                members: [
                    { type: 'string', value: '(' },
                    { type: 'symbol', name: 'expr' },
                    { type: 'string', value: ')' },
                ],
            },
        }))

        const seq = topSeq(g, 'paren')
        expect(seq.members[0]!.type).toBe('string')
    })

    it('skips when field with same name already exists on the rule', () => {
        const stderrSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true)
        const g = runEnrich(mkGrammar({
            pub_fn: {
                type: 'seq',
                members: [
                    { type: 'string', value: 'pub' },
                    { type: 'field', name: 'pub', content: { type: 'symbol', name: 'visibility' } },
                    { type: 'symbol', name: 'body' },
                ],
            },
        }))

        const seq = topSeq(g, 'pub_fn')
        expect(seq.members[0]!!.type).toBe('string')
        expect(stderrSpy).toHaveBeenCalledWith(
            expect.stringContaining('bare-keyword-prefix')
        )
    })

    it('does NOT wrap when the rule is not a top-level seq', () => {
        const g = runEnrich(mkGrammar({
            maybe_async: {
                type: 'choice',
                members: [
                    {
                        type: 'seq',
                        members: [
                            { type: 'string', value: 'async' },
                            { type: 'symbol', name: 'body' },
                        ],
                    },
                    { type: 'symbol', name: 'body' },
                ],
            },
        }))

        const rule = g.grammar.rules['maybe_async'] as { type: string; members: Rule[] }
        const innerSeq = rule.members[0]! as SeqRule
        expect(innerSeq.members[0]!.type).toBe('string')
    })
})
