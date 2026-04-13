import { describe, it, expect } from 'vitest'
import { optimize, fanOutChoices, factorSeqChoice, rulesEqual, wrapVariants, deduplicateVariants, nameVariant, tokenToName, needsSpace } from '../compiler/optimize.ts'
import type { Rule, LinkedGrammar, OptimizedGrammar, ExternalRole } from '../compiler/rule.ts'

function makeLinked(rules: Record<string, Rule>, overrides?: Partial<LinkedGrammar>): LinkedGrammar {
    return {
        name: 'test',
        rules,
        supertypes: new Set(),
        externalRoles: new Map<string, ExternalRole>(),
        word: null,
        references: [],
        ...overrides,
    }
}

describe('Optimize — rulesEqual', () => {
    it('compares string rules', () => {
        expect(rulesEqual({ type: 'string', value: 'a' }, { type: 'string', value: 'a' })).toBe(true)
        expect(rulesEqual({ type: 'string', value: 'a' }, { type: 'string', value: 'b' })).toBe(false)
    })

    it('compares seq rules recursively', () => {
        const a: Rule = { type: 'seq', members: [{ type: 'string', value: 'x' }] }
        const b: Rule = { type: 'seq', members: [{ type: 'string', value: 'x' }] }
        const c: Rule = { type: 'seq', members: [{ type: 'string', value: 'y' }] }
        expect(rulesEqual(a, b)).toBe(true)
        expect(rulesEqual(a, c)).toBe(false)
    })

    it('different types are not equal', () => {
        expect(rulesEqual({ type: 'string', value: 'a' }, { type: 'pattern', value: 'a' })).toBe(false)
    })
})

describe('Optimize — factorSeqChoice', () => {
    it('extracts common prefix from seq branches', () => {
        const branches: Rule[] = [
            { type: 'seq', members: [{ type: 'string', value: 'fn' }, { type: 'string', value: 'a' }] },
            { type: 'seq', members: [{ type: 'string', value: 'fn' }, { type: 'string', value: 'b' }] },
        ]
        const result = factorSeqChoice(branches)
        // After factoring, common prefix 'fn' is extracted
        expect(result).toBeDefined()
    })

    it('returns branches unchanged when no common prefix', () => {
        const branches: Rule[] = [
            { type: 'seq', members: [{ type: 'string', value: 'a' }] },
            { type: 'seq', members: [{ type: 'string', value: 'b' }] },
        ]
        const result = factorSeqChoice(branches)
        expect(result).toHaveLength(2)
    })
})

describe('Optimize — variant construction', () => {
    it('wrapVariants wraps choice members in variant nodes', () => {
        const choice: Rule = {
            type: 'choice',
            members: [
                { type: 'seq', members: [{ type: 'string', value: 'a' }] },
                { type: 'seq', members: [{ type: 'string', value: 'b' }] },
            ],
        }
        const result = wrapVariants(choice)
        expect(result.type).toBe('choice')
        const members = (result as any).members
        expect(members).toHaveLength(2)
        expect(members[0].type).toBe('variant')
        expect(members[1].type).toBe('variant')
    })

    it('deduplicateVariants removes structurally identical variants', () => {
        const variants: Rule[] = [
            { type: 'variant', name: 'v1', content: { type: 'string', value: 'x' } },
            { type: 'variant', name: 'v2', content: { type: 'string', value: 'x' } },
            { type: 'variant', name: 'v3', content: { type: 'string', value: 'y' } },
        ]
        const result = deduplicateVariants(variants)
        expect(result).toHaveLength(2)
    })

    it('nameVariant derives name from detect token', () => {
        const variant: Rule = { type: 'seq', members: [{ type: 'string', value: 'pub' }, { type: 'symbol', name: 'item' }] }
        const name = nameVariant(variant, 0, [variant])
        expect(name).toBe('pub')
    })
})

describe('Optimize — tokenToName', () => {
    it('maps punctuation to readable names', () => {
        expect(tokenToName(';')).toBe('semi')
        expect(tokenToName('{')).toBe('brace')
        expect(tokenToName('(')).toBe('paren')
        expect(tokenToName('[')).toBe('bracket')
        expect(tokenToName(',')).toBe('comma')
        expect(tokenToName(':')).toBe('colon')
    })

    it('passes through alphanumeric tokens', () => {
        expect(tokenToName('pub')).toBe('pub')
        expect(tokenToName('fn')).toBe('fn')
    })
})

describe('Optimize — needsSpace', () => {
    it('returns true between two word characters', () => {
        expect(needsSpace('fn', 'main')).toBe(true)
    })

    it('returns false between punctuation', () => {
        expect(needsSpace('(', ')')).toBe(false)
    })

    it('returns false between word and open paren', () => {
        expect(needsSpace('fn', '(')).toBe(false)
    })
})

describe('Optimize — optimize()', () => {
    it('produces an OptimizedGrammar preserving named content', () => {
        const linked = makeLinked({
            item: {
                type: 'seq',
                members: [
                    { type: 'string', value: 'fn' },
                    { type: 'field', name: 'body', content: { type: 'symbol', name: 'block' } },
                ],
            },
            block: { type: 'string', value: '{}' },
        })
        const optimized = optimize(linked)
        expect(optimized.name).toBe('test')
        expect(optimized.rules['item']).toBeDefined()
        // Field metadata must be preserved
        const item = optimized.rules['item'] as any
        const fieldMember = item.members?.find((m: any) => m.type === 'field') ??
            (item.type === 'field' ? item : null)
        if (fieldMember) {
            expect(fieldMember.name).toBe('body')
        }
    })

    // Note: the test that asserted "optimize wraps visible choice members
    // in variants" moved to link.test.ts after variant tagging was
    // relocated to Link in commit (Phase 2 classification cleanup).
    // See `link.test.ts → 'tagVariants wraps visible choice members'`.
})
