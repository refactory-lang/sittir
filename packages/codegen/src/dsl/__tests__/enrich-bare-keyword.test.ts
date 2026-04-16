import { describe, it, expect, afterEach, vi } from 'vitest'
import { enrich } from '../enrich.ts'
import type { Rule, SeqRule, FieldRule, StringRule } from '../../compiler/rule.ts'

function mkGrammar(rules: Record<string, Rule>) {
    return { grammar: { name: 'test', rules } }
}

function topSeq(g: ReturnType<typeof mkGrammar>, ruleName: string): SeqRule {
    return g.grammar.rules[ruleName] as SeqRule
}

describe('enrich — bareKeywordPrefixPass', () => {
    afterEach(() => { vi.restoreAllMocks() })

    it('wraps a leading identifier-shaped literal as field(kw, literal)', () => {
        const g = enrich(mkGrammar({
            async_fn: {
                type: 'seq',
                members: [
                    { type: 'string', value: 'async' },
                    { type: 'symbol', name: 'body' },
                ],
            },
        }))

        const seq = topSeq(g, 'async_fn')
        const first = seq.members[0] as FieldRule
        expect(first.type).toBe('field')
        expect(first.name).toBe('async')
        expect((first.content as StringRule).value).toBe('async')
    })

    it('does NOT wrap non-leading string literals', () => {
        const g = enrich(mkGrammar({
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
        expect(seq.members[1].type).toBe('string')
    })

    it('does NOT wrap non-identifier-shaped literals (punctuation)', () => {
        const g = enrich(mkGrammar({
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
        expect(seq.members[0].type).toBe('string')
    })

    it('skips when field with same name already exists on the rule', () => {
        const stderrSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true)
        const g = enrich(mkGrammar({
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
        expect(seq.members[0].type).toBe('string')
        expect(stderrSpy).toHaveBeenCalledWith(
            expect.stringContaining('bare-keyword-prefix')
        )
    })

    it('does NOT wrap when the rule is not a top-level seq', () => {
        const g = enrich(mkGrammar({
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
        const innerSeq = rule.members[0] as SeqRule
        expect(innerSeq.members[0].type).toBe('string')
    })
})
