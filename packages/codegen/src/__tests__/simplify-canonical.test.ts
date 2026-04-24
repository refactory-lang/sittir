/**
 * Tests for the spec-013 `simplifyRule` transformation pipeline.
 *
 * Each test freezes the canonical shape produced for a minimal input
 * fragment. The simplifyRule function is idempotent — running it
 * twice produces the same output — and shape-preserving for rules
 * that are already canonical or don't match the merge-compatible
 * pattern.
 */

import { describe, it, expect } from 'vitest'
import type { Rule } from '../compiler/rule.ts'
import { simplifyRule } from '../compiler/simplify.ts'

const str = (value: string): Rule => ({ type: 'string', value })
const sym = (name: string): Rule => ({ type: 'symbol', name })
const sup = (name: string): Rule => ({ type: 'supertype', name, subtypes: [] })
const field = (name: string, content: Rule): Rule => ({ type: 'field', name, content })
const seq = (...members: Rule[]): Rule => ({ type: 'seq', members })
const choice = (...members: Rule[]): Rule => ({ type: 'choice', members })
const variant = (name: string, content: Rule): Rule => ({ type: 'variant', name, content })

describe('simplifyRule — mergeChoiceBranches', () => {
    it('merges same-shape branches that differ only in one field\'s literal', () => {
        // Pattern: binary_expression. Each arm same seq shape with
        // different literal for operator.
        const input = choice(
            seq(field('left', sym('expr')), field('op', str('&&')), field('right', sym('expr'))),
            seq(field('left', sym('expr')), field('op', str('||')), field('right', sym('expr'))),
            seq(field('left', sym('expr')), field('op', str('+')),  field('right', sym('expr'))),
        )
        const expected = seq(
            field('left', sym('expr')),
            field('op', choice(str('&&'), str('||'), str('+'))),
            field('right', sym('expr')),
        )
        expect(simplifyRule(input)).toEqual(expected)
    })

    it('merges two-branch choice with identical shape + differing field content', () => {
        const input = choice(
            seq(field('kind', str('var'))),
            seq(field('kind', str('let'))),
            seq(field('kind', str('const'))),
        )
        const expected = field('kind', choice(str('var'), str('let'), str('const')))
        // seq of one member collapses to the member.
        expect(simplifyRule(input)).toEqual(expected)
    })

    it('preserves non-field positions as-is when identical across branches', () => {
        const input = choice(
            seq(sym('expr'), field('op', str('+')), sym('expr')),
            seq(sym('expr'), field('op', str('-')), sym('expr')),
        )
        const expected = seq(sym('expr'), field('op', choice(str('+'), str('-'))), sym('expr'))
        expect(simplifyRule(input)).toEqual(expected)
    })

    it('does NOT merge when branches differ in LENGTH', () => {
        const input = choice(
            seq(field('a', sym('x'))),
            seq(field('a', sym('x')), field('b', sym('y'))),
        )
        // Structurally heterogeneous (different lengths) — polymorph /
        // enum classification downstream handles this. Canonicalize
        // returns the shape unchanged (its members have themselves been
        // bottom-up simplifyRuled, but the outer choice stays).
        const result = simplifyRule(input) as { type: 'choice'; members: Rule[] }
        expect(result.type).toBe('choice')
        expect(result.members.length).toBe(2)
    })

    it('does NOT merge when branches differ in FIELD NAME at a position', () => {
        // function_modifiers-style: each branch has a DIFFERENT field
        // name. Not mergeable.
        const input = choice(
            field('async', sym('_kw_async')),
            field('const', sym('_kw_const')),
            field('unsafe', sym('_kw_unsafe')),
        )
        const result = simplifyRule(input) as { type: 'choice'; members: Rule[] }
        expect(result.type).toBe('choice')
        expect(result.members.length).toBe(3)
    })

    it('does NOT merge when branches differ in MEMBER KIND at a position', () => {
        // One branch has field, another has symbol at same position.
        const input = choice(
            seq(field('op', str('='))),
            seq(sym('assignment_expression')),
        )
        const result = simplifyRule(input) as { type: 'choice'; members: Rule[] }
        expect(result.type).toBe('choice')
    })

    it('does NOT merge variant-wrapped branches — variants preserve identity', () => {
        // tagVariants wraps choice members in variant() to mark them as
        // polymorph-distinct. Canonicalize must NEVER collapse those —
        // doing so drops the variant names and turns a polymorph into
        // a bare seq.
        const input = choice(
            variant('a', seq(field('op', str('+')), field('r', sym('expr')))),
            variant('b', seq(field('op', str('-')), field('r', sym('expr')))),
        )
        const result = simplifyRule(input) as { type: 'choice'; members: Rule[] }
        expect(result.type).toBe('choice')
        expect(result.members).toHaveLength(2)
        expect(result.members[0]!.type).toBe('variant')
        expect(result.members[1]!.type).toBe('variant')
    })

    it('dedupes identical contents across branches', () => {
        // Two branches have the same literal. Merged content shouldn't
        // have duplicates (`choice('a','a')` is nonsense).
        const input = choice(
            seq(field('op', str('+')), field('r', sym('expr'))),
            seq(field('op', str('+')), field('r', sym('expr'))),
            seq(field('op', str('-')), field('r', sym('expr'))),
        )
        const expected = seq(
            field('op', choice(str('+'), str('-'))),
            field('r', sym('expr')),
        )
        expect(simplifyRule(input)).toEqual(expected)
    })

    it('is idempotent — running simplifyRule twice is a no-op', () => {
        const input = choice(
            seq(field('op', str('+')), field('r', sym('expr'))),
            seq(field('op', str('-')), field('r', sym('expr'))),
        )
        const once = simplifyRule(input)
        const twice = simplifyRule(once)
        expect(twice).toEqual(once)
    })

    it('leaves homogeneous-collapsed choices alone (choice of bare symbols)', () => {
        const input = choice(sym('a'), sym('b'), sym('c'))
        // No seq structure to merge — stays as a choice. Supertype /
        // enum classification handles this kind downstream.
        const result = simplifyRule(input) as { type: 'choice'; members: Rule[] }
        expect(result.type).toBe('choice')
        expect(result.members).toHaveLength(3)
    })

    it('recurses bottom-up: nested mergeable choice inside a seq gets merged', () => {
        // Outer seq with a nested choice that's itself mergeable. After
        // merge the inner choice becomes a seq; simplifyRule's seq case
        // then flattens that into the outer seq, yielding a single flat
        // top-level seq with all fields as direct members.
        const input = seq(
            field('outer', sym('x')),
            choice(
                seq(field('op', str('+')), field('r', sym('y'))),
                seq(field('op', str('-')), field('r', sym('y'))),
            ),
        )
        const expected = seq(
            field('outer', sym('x')),
            field('op', choice(str('+'), str('-'))),
            field('r', sym('y')),
        )
        expect(simplifyRule(input)).toEqual(expected)
    })

    it('recurses into a field\'s content — inner choice gets merged', () => {
        const input = field('x', choice(
            seq(sym('a'), field('y', str('v'))),
            seq(sym('a'), field('y', str('w'))),
        ))
        const expected = field('x', seq(sym('a'), field('y', choice(str('v'), str('w')))))
        expect(simplifyRule(input)).toEqual(expected)
    })
})
