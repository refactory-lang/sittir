import { describe, it, expect } from 'vitest'
import { generate } from '../compiler/generate.ts'

describe('nested-alias polymorph — factory roundtrip', () => {
    let result: Awaited<ReturnType<typeof generate>>

    it('generates python codegen output', async () => {
        result = await generate({
            grammar: 'python',
            outputDir: '/dev/null',
        })
        expect(result.factories).toBeDefined()
        expect(result.wrap).toBeDefined()
    })

    it('factory dispatches assignmentTyped for { left, right, type }', () => {
        const match = result.factories.match(
            /export function assignment\(config[^]*?(?=\nexport function )/
        )
        expect(match).not.toBeNull()
        const factory = match![0]

        // Most-specific variant first: type AND right → assignmentTyped
        expect(factory).toMatch(/config\.type !== undefined && config\.right !== undefined/)
        expect(factory).toMatch(/assignmentTyped/)
    })

    it('factory dispatches assignmentEq for { left, right }', () => {
        const match = result.factories.match(
            /export function assignment\(config[^]*?(?=\nexport function )/
        )
        const factory = match![0]

        // Second dispatch: right only → assignmentEq (may span lines)
        expect(factory).toMatch(/config\.right !== undefined/)
        expect(factory).toMatch(/assignmentEq/)
    })

    it('factory fallback is assignmentType for { left, type }', () => {
        const match = result.factories.match(
            /export function assignment\(config[^]*?(?=\nexport function )/
        )
        const factory = match![0]

        // Fallback (no condition check): assignmentType
        expect(factory).toMatch(/assignmentType/)
    })

    it('wrap has flat getters for variant fields', () => {
        expect(result.wrap).toMatch(/function wrapAssignment/)
        expect(result.wrap).toMatch(/get right\(\)/)
        expect(result.wrap).toMatch(/get typeField\(\)/)
        expect(result.wrap).toMatch(/get variant\(\)/)
    })

    it('variant factories still exist as standalone', () => {
        expect(result.factories).toMatch(/export function assignmentEq\(/)
        expect(result.factories).toMatch(/export function assignmentType\(/)
        expect(result.factories).toMatch(/export function assignmentTyped\(/)
    })
})
