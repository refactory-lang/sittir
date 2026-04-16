import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import { evaluate } from '../compiler/evaluate.ts'

const __dirname = new URL('.', import.meta.url).pathname
const resolveOverrides = (grammar: string) =>
    resolve(__dirname, `../../../${grammar}/overrides.ts`)

describe('polymorph metadata — evaluate e2e', () => {
    it('python: assignment polymorph variants are registered', async () => {
        const raw = await evaluate(resolveOverrides('python'))
        expect(raw.polymorphVariants).toBeDefined()
        const assignmentVariants = raw.polymorphVariants!.filter(v => v.parent === 'assignment')
        expect(assignmentVariants).toEqual([
            { parent: 'assignment', child: 'eq' },
            { parent: 'assignment', child: 'type' },
            { parent: 'assignment', child: 'typed' },
        ])
    })

    it('rust: polymorph variants registered for converted rules', async () => {
        const raw = await evaluate(resolveOverrides('rust'))
        expect(raw.polymorphVariants).toBeDefined()
        const closureVariants = raw.polymorphVariants!.filter(v => v.parent === 'closure_expression')
        expect(closureVariants).toEqual([
            { parent: 'closure_expression', child: 'block' },
            { parent: 'closure_expression', child: 'expr' },
        ])
        const orPatternVariants = raw.polymorphVariants!.filter(v => v.parent === 'or_pattern')
        expect(orPatternVariants).toEqual([
            { parent: 'or_pattern', child: 'binary' },
            { parent: 'or_pattern', child: 'prefix' },
        ])
    })
})
