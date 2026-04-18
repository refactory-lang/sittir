/**
 * SC-012: grouped sub-namespace access produces identical output to flat access.
 *
 * `ir.expression.binary(config)` and `ir.binary(config)` must resolve to the
 * same factory bundle — same factory function, same `.from` attachment.
 * (The flat `ir.*` already uses supertype-stripped short keys; the grouped
 * surface mirrors those under `ir.<supertype>.<member>`.)
 */
import { describe, expect, it } from 'vitest'
import { ir, expression, pattern } from '@sittir/rust'

describe('ir grouped sub-namespaces (SC-012)', () => {
    it('flat and grouped access resolve to the same factory bundle', () => {
        // `ir.binary` (flat) and `ir.expression.binary` (grouped) point
        // at the same _attach bundle.
        expect(ir.expression.binary).toBe(ir.binary)
        expect(ir.expression.binary.from).toBe(ir.binary.from)
    })

    it('grouped namespace attached to ir is the same object as standalone export', () => {
        expect(ir.expression).toBe(expression)
        expect(ir.pattern).toBe(pattern)
    })

    it('produces structurally identical output via flat vs grouped', () => {
        const flat = ir.binary({
            left: { type: 'integer_literal', text: '1' },
            operator: '+',
            right: { type: 'integer_literal', text: '2' },
        })
        const grouped = ir.expression.binary({
            left: { type: 'integer_literal', text: '1' },
            operator: '+',
            right: { type: 'integer_literal', text: '2' },
        })
        expect(JSON.stringify(grouped)).toBe(JSON.stringify(flat))
    })

    it('covers every supertype with at least one member', () => {
        const groups = ['expression', 'pattern', 'type', 'statement'] as const
        for (const g of groups) {
            const obj = ir[g] as Record<string, unknown>
            expect(Object.keys(obj).length).toBeGreaterThan(0)
        }
    })
})
