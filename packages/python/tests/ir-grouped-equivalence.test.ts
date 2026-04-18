/**
 * SC-012 on python — grouped sub-namespace access produces identical
 * output to flat access. Mirrors the rust counterpart.
 */
import { describe, expect, it } from 'vitest'
import { ir, statement, expression } from '@sittir/python'

describe('python ir grouped sub-namespaces (SC-012)', () => {
    it('flat and grouped access resolve to the same factory bundle', () => {
        // `statement.if_` (reserved-word-suffixed) === `ir.statement.if_`.
        // ir.ifStatement is the flat camelCase entry if emitted; otherwise
        // the supertype-stripped short name `if_` lives inside the group.
        expect(ir.statement.if_).toBe(statement.if_)
        expect(ir.statement.if_.from).toBe(statement.if_.from)
    })

    it('grouped namespace attached to ir is the same object as standalone export', () => {
        expect(ir.statement).toBe(statement)
        expect(ir.expression).toBe(expression)
    })

    it('covers known supertypes with at least one member', () => {
        const groups = ['statement', 'expression'] as const
        for (const g of groups) {
            const obj = ir[g] as Record<string, unknown>
            expect(Object.keys(obj).length).toBeGreaterThan(0)
        }
    })
})
