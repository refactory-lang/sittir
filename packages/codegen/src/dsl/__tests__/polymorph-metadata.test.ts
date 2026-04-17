import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { transform } from '../transform.ts'
import { variant } from '../variant.ts'
import { withSyntheticRuleScope, drainPolymorphVariants, setCurrentRuleKind } from '../synthetic-rules.ts'
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

        const { syntheticRules } = withSyntheticRuleScope(() => {
            setCurrentRuleKind('assignment')
            transform(original, {
                '1/0': variant('eq'),
                '1/1': variant('type'),
            })
            setCurrentRuleKind(null)
        })

        const variants = drainPolymorphVariants()
        expect(variants.filter(v => v.parent === 'assignment')).toEqual([
            { parent: 'assignment', child: 'eq' },
            { parent: 'assignment', child: 'type' },
        ])
        expect(syntheticRules.size).toBe(2)
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
            withSyntheticRuleScope(() => {
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

        withSyntheticRuleScope(() => {
            setCurrentRuleKind('rule_one')
            transform(makeChoice(), { '0/0': variant('a'), '0/1': variant('b') })
            setCurrentRuleKind('rule_two')
            transform(makeChoice(), { '0/0': variant('x') })
            setCurrentRuleKind(null)
        })

        const variants = drainPolymorphVariants()
        expect(variants.filter(v => v.parent === 'rule_one')).toEqual([
            { parent: 'rule_one', child: 'a' },
            { parent: 'rule_one', child: 'b' },
        ])
        expect(variants.filter(v => v.parent === 'rule_two')).toEqual([
            { parent: 'rule_two', child: 'x' },
        ])
    })

    it('throws when two variant() calls register the same name on the same parent (T029a)', () => {
        const original = {
            type: 'seq',
            members: [
                { type: 'choice', members: [sym('a'), sym('b')] },
            ],
        } as Rule

        expect(() => {
            withSyntheticRuleScope(() => {
                setCurrentRuleKind('dup_parent')
                transform(original, { '0/0': variant('same'), '0/1': variant('same') })
                setCurrentRuleKind(null)
            })
        }).toThrow(/duplicate variant name on rule 'dup_parent'/)

        // Drain to leave the accumulator clean for adjacent tests.
        drainPolymorphVariants()
    })

    it('drainPolymorphVariants clears the accumulator', () => {
        withSyntheticRuleScope(() => {
            setCurrentRuleKind('foo')
            const original = { type: 'seq', members: [{ type: 'choice', members: [sym('a')] }] } as Rule
            transform(original, { '0/0': variant('a') })
            setCurrentRuleKind(null)
        })

        const first = drainPolymorphVariants()
        expect(first.length).toBe(1)
        const second = drainPolymorphVariants()
        expect(second.length).toBe(0)
    })
})
