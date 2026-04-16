import { describe, it, expect } from 'vitest'
import { generate } from '../compiler/generate.ts'

describe('nested-alias polymorph factory — python assignment', () => {
    let factoriesSource: string

    it('generates factories for python', async () => {
        const result = await generate({
            grammar: 'python',
            outputDir: '/dev/null',
        })
        factoriesSource = result.factories
        expect(factoriesSource).toBeDefined()
    })

    it('assignment factory signature includes variant fields, not just children', () => {
        // Extract the assignment factory function (up to next export)
        const match = factoriesSource.match(
            /export function assignment\(config[^]*?(?=\nexport function )/
        )
        expect(match).not.toBeNull()
        const factory = match![0]

        // Should NOT take children as a raw config field — that's the "nasty" API
        // Instead, should accept flat variant fields (right, type)
        expect(factory).toMatch(/config\.right !== undefined/)
    })

    it('assignment factory dispatches to variant child by field presence', () => {
        const match = factoriesSource.match(
            /export function assignment\(config[^]*?(?=\nexport function )/
        )
        const factory = match![0]

        // Should construct variant child (assignmentEq, assignmentType, or assignmentTyped)
        // based on which variant-specific fields are present
        expect(factory).toMatch(/assignment_eq|assignmentEq/)
        expect(factory).toMatch(/children/)
    })

    it('assignment factory has getters that drill into variant child fields', () => {
        const match = factoriesSource.match(
            /export function assignment\(config[^]*?(?=\nexport function )/
        )
        const factory = match![0]

        // Should have right() getter on the returned object
        expect(factory).toMatch(/right\(/)
    })
})
