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
import { simplifyRule, hoistInnerFieldOutOfFieldWrapper } from '../compiler/simplify.ts'

const str = (value: string): Rule => ({ type: 'string', value })
const sym = (name: string): Rule => ({ type: 'symbol', name })
const sup = (name: string): Rule => ({ type: 'supertype', name, subtypes: [] })
const field = (name: string, content: Rule): Rule => ({ type: 'field', name, content })
const seq = (...members: Rule[]): Rule => ({ type: 'seq', members })
const choice = (...members: Rule[]): Rule => ({ type: 'choice', members })
const variant = (name: string, content: Rule): Rule => ({ type: 'variant', name, content })
const optional = (content: Rule): Rule => ({ type: 'optional', content })
const repeat1 = (content: Rule, separator?: string): Rule =>
    separator !== undefined ? { type: 'repeat1', content, separator } : { type: 'repeat1', content }
const clause = (name: string, content: Rule): Rule => ({ type: 'clause', name, content })

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

    it('hoists a shared field across different-length branches', () => {
        // `hoistSharedFieldAcrossChoiceBranches` now covers branches
        // that differ in length when they share a field name. Field
        // `a` is common to both branches; the second branch's extra
        // `field('b', ...)` becomes the optional residual.
        const input = choice(
            seq(field('a', sym('x'))),
            seq(field('a', sym('x')), field('b', sym('y'))),
        )
        const result = simplifyRule(input) as { type: 'seq'; members: Rule[] }
        expect(result.type).toBe('seq')
        // Member 0: hoisted field('a', choice(sym('x'), sym('x')))
        // Member 1: optional(field('b', sym('y')))
        expect(result.members).toHaveLength(2)
        expect(result.members[0]!.type).toBe('field')
        expect((result.members[0] as any).name).toBe('a')
        expect(result.members[1]!.type).toBe('optional')
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

describe('simplifyRule — hoistInnerFieldOutOfFieldWrapper', () => {
    // Tree-sitter flattens nested-field-paths to top-level on the parent
    // kind. The hoist drops an OUTER `field('outer', ...)` wrapper when
    // its content carries an inner `field('inner', X)` reachable through
    // structural-only wrappers (no named-symbol siblings). After the
    // hoist the inner field is the top-level reference the walker sees,
    // matching tree-sitter's parse-tree shape.
    //
    // Canonical case (typescript `infer_type`):
    //   field('constraint', clause('type', seq('extends', field('type', X))))
    //   → clause('type', seq('extends', field('type', X)))

    it('hoists an inner field out of `field(outer, optional(seq(literal, field(inner))))`', () => {
        // Pre-clause-detection shape of typescript `infer_type`.
        const input = field('constraint',
            optional(seq(str('extends'), field('type', sym('type')))))
        const expected = optional(seq(str('extends'), field('type', sym('type'))))
        expect(hoistInnerFieldOutOfFieldWrapper(input)).toEqual(expected)
    })

    it('hoists through a `clause` wrapper', () => {
        // Post-Link-detectClause shape of typescript `infer_type`.
        const input = field('constraint',
            clause('type', seq(str('extends'), field('type', sym('type')))))
        const expected = clause('type', seq(str('extends'), field('type', sym('type'))))
        expect(hoistInnerFieldOutOfFieldWrapper(input)).toEqual(expected)
    })

    it('hoists through `optional(repeat1(choice(field, symbol), sep))` (typescript enum_body)', () => {
        // The inner `symbol(enum_assignment)` is a CHOICE ARM, not a
        // seq sibling of the inner field — the hoist guard sees no
        // named sibling and proceeds.
        const input = field('opening',
            optional(repeat1(
                choice(field('name', sym('_property_name')), sym('enum_assignment')),
                ',',
            )))
        const result = hoistInnerFieldOutOfFieldWrapper(input)
        expect(result.type).toBe('optional')
    })

    it('does NOT hoist when the inner field has a NAMED-symbol sibling in the enclosing seq', () => {
        // python `comparison_operator` family: the seq enclosing the
        // inner field also carries a `symbol(primary_expression)` —
        // dropping the outer `comparators` wrapper would strip the
        // label tree-sitter put on `primary_expression` and the
        // expression children would render via `$$$CHILDREN`.
        const input = field('comparators',
            repeat1(seq(field('operators', choice(str('<'), str('>'))), sym('primary_expression'))))
        expect(hoistInnerFieldOutOfFieldWrapper(input)).toEqual(input)
    })

    it('does NOT hoist when the outer field directly wraps another field (no structural scaffolding)', () => {
        // `field('outer', field('inner', X))` direct nesting belongs
        // to `hoistFieldOutOfSingleContentWrapper`'s territory — the
        // outer-inner direct-wrap rewrite. We bail to keep the two
        // hoists from racing.
        const input = field('outer', field('inner', sym('x')))
        expect(hoistInnerFieldOutOfFieldWrapper(input)).toEqual(input)
    })

    it('does NOT hoist when the outer field has no inner field at exposable depth', () => {
        // Plain `field('name', symbol(X))` — no inner field to hoist.
        const input = field('name', sym('identifier'))
        expect(hoistInnerFieldOutOfFieldWrapper(input)).toEqual(input)
    })

    it('does NOT hoist when the inner field is hidden behind a `symbol` reference', () => {
        // Tree-sitter's flattening does NOT cross symbol boundaries —
        // the inner field belongs to the referenced rule, not the
        // current kind. Dropping the outer wrapper would lose the
        // outer label without recovering anything.
        const input = field('module_name', sym('dotted_name'))
        expect(hoistInnerFieldOutOfFieldWrapper(input)).toEqual(input)
    })

    it('preserves anonymous-string siblings (literal "extends" stays in the hoisted seq)', () => {
        // The structural literal that previously rode inside the
        // outer field's content must survive the hoist — the walker
        // emits it as template text.
        const input = field('constraint',
            optional(seq(str('extends'), field('type', sym('type')))))
        const result = hoistInnerFieldOutOfFieldWrapper(input)
        // Walk into the optional → seq → first member: the literal.
        expect(result.type).toBe('optional')
        const optInner = (result as { type: 'optional'; content: Rule }).content
        expect(optInner.type).toBe('seq')
        const seqMembers = (optInner as { members: Rule[] }).members
        expect(seqMembers[0]).toEqual(str('extends'))
        expect(seqMembers[1]?.type).toBe('field')
    })

    it('integration: simplifyRule applies the hoist as part of its field case', () => {
        // End-to-end via simplifyRule — confirms wiring into the
        // simplify pipeline (not just the standalone function).
        const input = field('constraint',
            optional(seq(str('extends'), field('type', sym('type')))))
        const result = simplifyRule(input)
        // After hoist + simplify's optional case, the outer field wrapper is gone.
        expect(result.type).not.toBe('field')
    })

    it('integration: a NAMED supertype sibling also blocks the hoist', () => {
        const input = field('outer',
            seq(sup('expression'), field('inner', sym('identifier'))))
        expect(hoistInnerFieldOutOfFieldWrapper(input)).toEqual(input)
    })

    it('idempotent: running the hoist twice is a no-op on the hoisted shape', () => {
        const input = field('constraint',
            optional(seq(str('extends'), field('type', sym('type')))))
        const once = hoistInnerFieldOutOfFieldWrapper(input)
        const twice = hoistInnerFieldOutOfFieldWrapper(once)
        expect(twice).toEqual(once)
    })
})
