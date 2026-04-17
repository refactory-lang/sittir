/**
 * transform-hoist.test.ts — unit coverage for tryHoistSiblingVariants.
 *
 * Corpus round-trip exercises hoisting end-to-end but only through the
 * grammars that happen to have an empty-matching variant (rust
 * `array_expression_list`, etc.). These unit tests hit the branches
 * directly: prec preservation, conflict emission, skip-when-non-empty,
 * multiple siblings at one choice. Regressions in any single branch
 * should fail here rather than only at the integration boundary.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { transform } from '../transform.ts'
import { variant } from '../variant.ts'
import {
    drainSyntheticRules,
    drainConflicts,
    drainPolymorphVariants,
    setCurrentRuleKind,
} from '../synthetic-rules.ts'
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts'

describe('tryHoistSiblingVariants (via transform)', () => {
    beforeAll(() => installFakeDsl())
    afterAll(() => restoreFakeDsl())

    function drainAll(): void {
        drainSyntheticRules()
        drainConflicts()
        drainPolymorphVariants()
    }

    it('hoists sibling variants through a parent prec wrapper and registers them as self-conflicts', () => {
        drainAll()
        setCurrentRuleKind('demo')
        try {
            // Shape: `prec.left(2, seq('[', choice(empty_alt, repeat(X)), ']'))`
            // — the repeat alt matches empty, so hoist fires.
            const g = globalThis as any
            const original = g.prec.left(2, g.seq(
                { type: 'string', value: '[' } as any,
                g.choice(
                    // alt 0: empty (blank)
                    { type: 'blank' } as any,
                    // alt 1: repeat(X) — matches-empty
                    g.repeat({ type: 'symbol', name: 'X' } as any),
                ),
                { type: 'string', value: ']' } as any,
            ))

            const patched: any = transform(original, {
                '1/0': variant('empty'),
                '1/1': variant('list'),
            })

            // Top-level structure: choice($.demo_empty, $.demo_list).
            // The outer prec wrapper is NOT reapplied around the new
            // choice — each synthesized variant rule carries its own
            // copy (inherited from the captured precStack), and tree-
            // sitter resolves effective precedence per matching branch.
            expect(patched.type).toBe('choice')
            expect(patched.members).toHaveLength(2)
            expect(patched.members[0].type).toBe('symbol')
            expect(patched.members[0].name).toBe('demo_empty')
            expect(patched.members[1].name).toBe('demo_list')

            // Each synthesized rule's body includes the outer `[ ... ]`
            // scaffolding wrapped in the captured prec.left(2, ...).
            const synth = drainSyntheticRules()
            expect(synth.has('demo_empty')).toBe(true)
            expect(synth.has('demo_list')).toBe(true)
            const semiBody: any = synth.get('demo_empty')
            expect(semiBody.type).toBe('prec_left')
            expect(semiBody.value).toBe(2)

            // Conflicts: one group (all siblings) + one self-conflict per
            // sibling. Self-conflicts mirror the pattern the base
            // tree-sitter-rust grammar uses on its `array_expression`
            // entry.
            const conflicts = drainConflicts()
            expect(conflicts).toContainEqual(['demo_empty', 'demo_list'])
            expect(conflicts).toContainEqual(['demo_empty'])
            expect(conflicts).toContainEqual(['demo_list'])

            // Polymorph metadata registered for downstream emitters.
            const variants = drainPolymorphVariants()
            expect(variants).toContainEqual({ parent: 'demo', child: 'empty' })
            expect(variants).toContainEqual({ parent: 'demo', child: 'list' })
        } finally {
            setCurrentRuleKind(null)
            drainAll()
        }
    })

    it('skips hoist when no variant alternative matches empty (non-empty alts go per-patch)', () => {
        drainAll()
        setCurrentRuleKind('nonempty')
        try {
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
            // No hoist ran → no cross-sibling conflict group.
            const conflicts = drainConflicts()
            // Per-patch alias registrations don't register any conflicts,
            // so drainConflicts() is empty.
            expect(conflicts).toEqual([])
        } finally {
            setCurrentRuleKind(null)
            drainAll()
        }
    })
})
