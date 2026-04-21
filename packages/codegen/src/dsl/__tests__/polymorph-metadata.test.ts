import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { transform } from '../transform.ts'
import { variant } from '../variant.ts'
import { withWireContext } from '../wire.ts'
import type { Rule } from '../../compiler/rule.ts'
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts'

const sym = (name: string): Rule => ({ type: 'symbol', name } as Rule)
const str = (value: string): Rule => ({ type: 'string', value } as Rule)

beforeAll(() => { installFakeDsl() })
afterAll(() => { restoreFakeDsl() })

describe('polymorph metadata registration', () => {
    it('registers variant when alias placeholder is resolved in transform', () => {
        const original = {
            type: 'seq',
            members: [
                sym('left'),
                { type: 'choice', members: [
                    { type: 'seq', members: [str('='), sym('right')] },
                    { type: 'seq', members: [str(':'), sym('type')] },
                ] },
            ],
        } as Rule

        const { ctx } = withWireContext('assignment', () => {
            transform(original, {
                '1/0': variant('eq'),
                '1/1': variant('type'),
            })
        })

        expect(ctx.polymorphVariants.filter(v => v.parent === 'assignment')).toEqual([
            { parent: 'assignment', child: 'eq' },
            { parent: 'assignment', child: 'type' },
        ])
        expect(ctx.deposits.size).toBe(2)
    })

    it('throws when variant() is used without a current rule kind', () => {
        const original = {
            type: 'seq',
            members: [
                sym('a'),
                { type: 'choice', members: [sym('b'), sym('c')] },
            ],
        } as Rule

        expect(() => {
            withWireContext(null, () => {
                transform(original, {
                    '1/0': variant('b'),
                })
            })
        }).toThrow(/no current rule kind/)
    })

    it('accumulates variants from multiple rules', () => {
        const makeChoice = () => ({
            type: 'seq',
            members: [
                { type: 'choice', members: [sym('a'), sym('b')] },
            ],
        } as Rule)

        const { ctx: ctx1 } = withWireContext('rule_one', () => {
            transform(makeChoice(), { '0/0': variant('a'), '0/1': variant('b') })
        })
        const { ctx: ctx2 } = withWireContext('rule_two', () => {
            transform(makeChoice(), { '0/0': variant('x') })
        })

        expect(ctx1.polymorphVariants).toEqual([
            { parent: 'rule_one', child: 'a' },
            { parent: 'rule_one', child: 'b' },
        ])
        expect(ctx2.polymorphVariants).toEqual([
            { parent: 'rule_two', child: 'x' },
        ])
    })
})
