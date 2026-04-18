/**
 * SC-012 on typescript — grouped sub-namespace access produces identical
 * output to flat access. Mirrors the rust counterpart.
 */
import { describe, expect, it } from 'vitest'
import { ir, type as typeGroup } from '@sittir/typescript'

describe('typescript ir grouped sub-namespaces (SC-012)', () => {
    it('flat and grouped access resolve to the same factory bundle', () => {
        // `ir.type.function_` uses the reserved-word suffix; must be the
        // same `_attach` bundle reachable from the standalone `type` export.
        expect(ir.type.function_).toBe(typeGroup.function_)
        expect(ir.type.function_.from).toBe(typeGroup.function_.from)
    })

    it('grouped namespace attached to ir is the same object as standalone export', () => {
        expect(ir.type).toBe(typeGroup)
    })

    it('type group has at least one member', () => {
        const obj = ir.type as Record<string, unknown>
        expect(Object.keys(obj).length).toBeGreaterThan(0)
    })
})
