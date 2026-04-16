import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { parsePath, applyPath } from '../transform-path.ts'
import { transform } from '../transform.ts'
import type { Rule } from '../../compiler/rule.ts'
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts'

const sym = (name: string): Rule => ({ type: 'symbol', name } as Rule)
const str = (value: string): Rule => ({ type: 'string', value } as Rule)
const seq = (...members: Rule[]): Rule => ({ type: 'seq', members } as Rule)
const choice = (...members: Rule[]): Rule => ({ type: 'choice', members } as Rule)
const optional = (content: Rule): Rule => ({ type: 'optional', content } as Rule)
const fld = (name: string, content: Rule): Rule => ({ type: 'field', name, content } as Rule)

beforeAll(() => { installFakeDsl() })
afterAll(() => { restoreFakeDsl() })

describe('parsePath()', () => {
    it('parses a single index', () => {
        expect(parsePath('0')).toEqual([{ kind: 'index', value: 0 }])
        expect(parsePath('5')).toEqual([{ kind: 'index', value: 5 }])
    })

    it('parses nested paths', () => {
        expect(parsePath('0/1/2')).toEqual([
            { kind: 'index', value: 0 },
            { kind: 'index', value: 1 },
            { kind: 'index', value: 2 },
        ])
    })

    it('parses wildcards', () => {
        expect(parsePath('*')).toEqual([{ kind: 'wildcard' }])
        expect(parsePath('0/*/1')).toEqual([
            { kind: 'index', value: 0 },
            { kind: 'wildcard' },
            { kind: 'index', value: 1 },
        ])
    })

    it('rejects empty path', () => {
        expect(() => parsePath('')).toThrow(/non-empty/)
    })

    it('rejects leading slash', () => {
        expect(() => parsePath('/0')).toThrow(/leading\/trailing slash/)
    })

    it('rejects trailing slash', () => {
        expect(() => parsePath('0/')).toThrow(/leading\/trailing slash/)
    })

    it('rejects non-numeric, non-wildcard segments', () => {
        expect(() => parsePath('0/foo/1')).toThrow(/invalid segment 'foo'/)
        expect(() => parsePath('0/-1')).toThrow(/invalid segment/)
    })
})

describe('applyPath()', () => {
    it('replaces at a single top-level index', () => {
        const rule = seq(str('('), sym('expr'), str(')'))
        const result = applyPath(rule, [{ kind: 'index', value: 1 }], fld('content', sym('expr')))
        expect((result as any).members[1]).toMatchObject({ type: 'field', name: 'content' })
    })

    it('descends into nested seq via path', () => {
        const rule = seq(str('('), seq(sym('a'), sym('b'), sym('c')), str(')'))
        const result = applyPath(
            rule,
            [{ kind: 'index', value: 1 }, { kind: 'index', value: 1 }],
            fld('middle', sym('b')),
        )
        const inner = (result as any).members[1]
        expect(inner.members[1]).toMatchObject({ type: 'field', name: 'middle' })
        // Other positions untouched
        expect(inner.members[0]).toMatchObject({ type: 'symbol', name: 'a' })
        expect(inner.members[2]).toMatchObject({ type: 'symbol', name: 'c' })
    })

    it('descends into optional wrapper at index 0', () => {
        const rule = seq(optional(sym('inner')), sym('after'))
        const result = applyPath(
            rule,
            [{ kind: 'index', value: 0 }, { kind: 'index', value: 0 }],
            fld('opt', sym('inner')),
        )
        const opt = (result as any).members[0]
        expect(opt).toMatchObject({ type: 'optional' })
        expect(opt.content).toMatchObject({ type: 'field', name: 'opt' })
    })

    it('throws on out-of-bounds index', () => {
        const rule = seq(sym('a'), sym('b'))
        expect(() => applyPath(rule, [{ kind: 'index', value: 5 }], fld('x', sym('a'))))
            .toThrow(/index 5 out of bounds in seq of length 2/)
    })

    it('throws on out-of-bounds in wrapper', () => {
        const rule = optional(sym('inner'))
        expect(() => applyPath(rule, [{ kind: 'index', value: 1 }], fld('x', sym('inner'))))
            .toThrow(/index 1 out of bounds.*optional.*single content/)
    })

    describe('wildcards', () => {
        it('applies to every member of a choice', () => {
            const rule = choice(seq(sym('a'), sym('b')), seq(sym('c'), sym('d')))
            const result = applyPath(
                rule,
                [{ kind: 'wildcard' }, { kind: 'index', value: 0 }],
                (m) => fld('first', m),
            )
            const branches = (result as any).members
            expect(branches[0].members[0]).toMatchObject({ type: 'field', name: 'first' })
            expect(branches[1].members[0]).toMatchObject({ type: 'field', name: 'first' })
            // Second position untouched in both branches
            expect(branches[0].members[1]).toMatchObject({ type: 'symbol', name: 'b' })
            expect(branches[1].members[1]).toMatchObject({ type: 'symbol', name: 'd' })
        })

        it('throws on zero-match wildcard', () => {
            const rule = seq(str('('), str(')'))
            // Wildcard at position 0 is fine, but trying to descend further
            // into string members will fail every time → zero applied → throw.
            expect(() => applyPath(
                rule,
                [{ kind: 'wildcard' }, { kind: 'index', value: 0 }],
                fld('x', sym('y')),
            )).toThrow(/wildcard matched zero/)
        })
    })
})

describe('transform() — object form with path keys', () => {
    it('applies a single path-addressed patch (single-segment)', () => {
        const rule = seq(sym('a'), sym('b'))
        // The path key '*' marks this as path mode (not flat positional).
        // Use the wildcard to apply to all members for the smoke test.
        const flat = transform(rule, { '*': fld('any', sym('a')) } as Record<string, Rule>)
        const r = flat as any
        expect(r.members[0]).toMatchObject({ type: 'field', name: 'any', source: 'override' })
        expect(r.members[1]).toMatchObject({ type: 'field', name: 'any', source: 'override' })
    })

    it('reaches into nested structure via path', () => {
        const rule = seq(seq(sym('a'), sym('b')), sym('outer'))
        const result = transform(rule, { '0/1': fld('inner_b', sym('b')) } as Record<string, Rule>)
        const r = result as any
        expect(r.members[0].members[1]).toMatchObject({ type: 'field', name: 'inner_b' })
    })

    it('applies multiple patches', () => {
        const rule = seq(seq(sym('a'), sym('b')), sym('c'))
        const result = transform(rule, {
            '0/0': fld('first', sym('a')),
            '1':   fld('outer', sym('c')),
        } as Record<string, Rule>)
        const r = result as any
        expect(r.members[0].members[0]).toMatchObject({ type: 'field', name: 'first' })
        expect(r.members[1]).toMatchObject({ type: 'field', name: 'outer' })
    })
})

describe('transform() — object form (flat positional, backward-compat)', () => {
    it('still works with the original Record<number, Rule> shape', () => {
        const rule = seq(sym('a'), sym('b'))
        const result = transform(rule, { 0: fld('first', sym('a')) })
        const r = result as any
        expect(r.members[0]).toMatchObject({ type: 'field', name: 'first', source: 'override' })
    })

    it('unwraps an enrich-inferred field on the original member before re-wrapping', async () => {
        // This is the explicit fix for enrich+override nested-field
        // bugs. When enrich has already wrapped a seq member as
        // `field('xxx', $.sym, source: 'inferred')` and the override's
        // transform patches that position with a one-arg `field('new')`
        // placeholder, resolvePatch must unwrap the inferred layer so
        // the result is `field('new', $.sym, source: 'override')`, NOT
        // `field('new', field('xxx', $.sym), source: 'override')`.
        const { field: oneArgField } = await import('../field.ts')
        const rule = seq(
            // Simulate enrich-inferred field wrapper on position 0.
            { type: 'field', name: 'inferred_name', content: sym('expr'), source: 'inferred' } as Rule,
            sym('rhs'),
        )
        // One-arg field placeholder + flat positional transform.
        const result = transform(rule, { 0: oneArgField('override_name') as Rule })
        const r = result as any
        expect(r.members[0]).toMatchObject({
            type: 'field',
            name: 'override_name',
            source: 'override',
            // Inner content is the original symbol, NOT a nested field.
            content: { type: 'symbol', name: 'expr' },
        })
        // Belt-and-suspenders: the inner content must not itself be a field.
        expect(r.members[0].content.type).not.toBe('field')
    })
})
