/**
 * transform-hoist.test.ts — unit coverage for tryHoistSiblingVariants.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { transform } from '../transform.ts'
import { variant } from '../variant.ts'
import { withWireContext } from '../wire.ts'
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts'

describe('tryHoistSiblingVariants (via transform)', () => {
    beforeAll(() => installFakeDsl())
    afterAll(() => restoreFakeDsl())

    it('hoists sibling variants through a parent prec wrapper and registers them as self-conflicts', () => {
        const { result: patched, ctx } = withWireContext('demo', () => {
            const g = globalThis as any
            const original = g.prec.left(2, g.seq(
                { type: 'string', value: '[' } as any,
                g.choice(
                    { type: 'blank' } as any,
                    g.repeat({ type: 'symbol', name: 'X' } as any),
                ),
                { type: 'string', value: ']' } as any,
            ))
            return transform(original, {
                '1/0': variant('empty'),
                '1/1': variant('list'),
            }) as any
        })

        expect(patched.type).toBe('choice')
        expect(patched.members).toHaveLength(2)
        expect(patched.members[0].type).toBe('symbol')
        expect(patched.members[0].name).toBe('demo_empty')
        expect(patched.members[1].name).toBe('demo_list')

        expect(ctx.deposits.has('demo_empty')).toBe(true)
        expect(ctx.deposits.has('demo_list')).toBe(true)
        const emptyBody: any = ctx.deposits.get('demo_empty')
        expect(emptyBody.type).toBe('prec_left')
        expect(emptyBody.value).toBe(2)

        expect(ctx.conflictGroups).toContainEqual(['demo_empty', 'demo_list'])
        expect(ctx.conflictGroups).toContainEqual(['demo_empty'])
        expect(ctx.conflictGroups).toContainEqual(['demo_list'])

        expect(ctx.polymorphVariants).toContainEqual({ parent: 'demo', child: 'empty' })
        expect(ctx.polymorphVariants).toContainEqual({ parent: 'demo', child: 'list' })
    })

    it('skips hoist when no variant alternative matches empty (non-empty alts go per-patch)', () => {
        const { ctx } = withWireContext('nonempty', () => {
            const g = globalThis as any
            const original = g.seq(
                { type: 'string', value: '(' } as any,
                g.choice(
                    { type: 'symbol', name: 'X' } as any,
                    { type: 'symbol', name: 'Y' } as any,
                ),
                { type: 'string', value: ')' } as any,
            )
            transform(original, {
                '1/0': variant('x'),
                '1/1': variant('y'),
            })
        })
        expect(ctx.conflictGroups).toEqual([])
    })

    it('bails on mixed choice positions (variants at different choicePos)', () => {
        const { ctx } = withWireContext('mixed', () => {
            const g = globalThis as any
            const original = g.seq(
                g.choice({ type: 'symbol', name: 'A' } as any, { type: 'symbol', name: 'B' } as any),
                { type: 'string', value: '|' } as any,
                g.choice({ type: 'symbol', name: 'C' } as any, { type: 'symbol', name: 'D' } as any),
            )
            transform(original, {
                '0/0': variant('left_a'),
                '2/0': variant('right_c'),
            })
        })
        expect(ctx.conflictGroups).toEqual([])
        expect(ctx.polymorphVariants.map(v => v.child).sort()).toEqual(['left_a', 'right_c'])
    })
})
