import { describe, it, expect } from 'vitest'
import { generate } from '../compiler/generate.ts'

describe('generate — new pipeline end-to-end', () => {

    it('generates all output files for Python', async () => {
        const result = await generate({
            grammar: 'python',
            outputDir: '/tmp/sittir-test-python',
        })

        // All files should be non-empty strings
        expect(result.grammar.length).toBeGreaterThan(0)
        expect(result.types.length).toBeGreaterThan(0)
        expect(result.factories.length).toBeGreaterThan(0)
        expect(result.consts.length).toBeGreaterThan(0)
        expect(result.index.length).toBeGreaterThan(0)

        // NodeMap should have nodes
        expect(result.nodeMap.nodes.size).toBeGreaterThan(50)
    }, 30000)

    it('generates all output files for Rust', async () => {
        const result = await generate({
            grammar: 'rust',
            outputDir: '/tmp/sittir-test-rust',
        })

        expect(result.grammar.length).toBeGreaterThan(0)
        expect(result.types.length).toBeGreaterThan(0)
        expect(result.factories.length).toBeGreaterThan(0)
        expect(result.nodeMap.nodes.size).toBeGreaterThan(100)
    }, 30000)

    it('generates all output files for TypeScript', async () => {
        const result = await generate({
            grammar: 'typescript',
            outputDir: '/tmp/sittir-test-typescript',
        })

        expect(result.grammar.length).toBeGreaterThan(0)
        expect(result.types.length).toBeGreaterThan(0)
        expect(result.factories.length).toBeGreaterThan(0)
        expect(result.nodeMap.nodes.size).toBeGreaterThan(100)
    }, 30000)
})
