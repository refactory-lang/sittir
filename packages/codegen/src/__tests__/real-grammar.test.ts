import { describe, it, expect } from 'vitest'
import { evaluate } from '../compiler/evaluate.ts'
import { link } from '../compiler/link.ts'
import { optimize } from '../compiler/optimize.ts'
import { assemble } from '../compiler/assemble.ts'
import { toHydratedModels } from '../compiler/adapter.ts'
import { resolve } from 'node:path'

const pythonGrammar = resolve(import.meta.dirname!, '../../../../node_modules/.pnpm/tree-sitter-python@0.25.0/node_modules/tree-sitter-python/grammar.js')
const rustGrammar = resolve(import.meta.dirname!, '../../../../node_modules/.pnpm/tree-sitter-rust@0.24.0/node_modules/tree-sitter-rust/grammar.js')
const tsGrammar = resolve(import.meta.dirname!, '../../../../node_modules/.pnpm/tree-sitter-typescript@0.23.2/node_modules/tree-sitter-typescript/typescript/grammar.js')

describe('Evaluate — real tree-sitter grammars', () => {

    it('evaluates Python grammar.js', async () => {
        const raw = await evaluate(pythonGrammar)
        expect(raw.name).toBe('python')
        expect(Object.keys(raw.rules).length).toBeGreaterThan(50)
        expect(raw.references.length).toBeGreaterThan(0)
    })

    it('captures Python supertypes', async () => {
        const raw = await evaluate(pythonGrammar)
        expect(raw.supertypes).toContain('_simple_statement')
        expect(raw.supertypes).toContain('_compound_statement')
        expect(raw.supertypes.length).toBeGreaterThan(0)
    })

    it('captures Python externals', async () => {
        const raw = await evaluate(pythonGrammar)
        expect(raw.externals.length).toBeGreaterThan(0)
    })

    it('has rules for key Python constructs', async () => {
        const raw = await evaluate(pythonGrammar)
        const ruleNames = Object.keys(raw.rules)
        expect(ruleNames).toContain('module')
        expect(ruleNames).toContain('function_definition')
        expect(ruleNames).toContain('class_definition')
        expect(ruleNames).toContain('if_statement')
    })
})

describe('Evaluate — Rust grammar.js', () => {
    it('evaluates Rust grammar', async () => {
        const raw = await evaluate(rustGrammar)
        expect(raw.name).toBe('rust')
        expect(Object.keys(raw.rules).length).toBeGreaterThan(100)
        expect(raw.references.length).toBeGreaterThan(0)
    })
})

describe('Evaluate — TypeScript grammar.js', () => {
    it('evaluates TypeScript grammar', async () => {
        const raw = await evaluate(tsGrammar)
        expect(raw.name).toBe('typescript')
        expect(Object.keys(raw.rules).length).toBeGreaterThan(100)
    })
})

describe('Full pipeline — evaluate → link → optimize → assemble', () => {
    it('processes Python through all 4 phases', async () => {
        const raw = await evaluate(pythonGrammar)
        const linked = link(raw)
        const optimized = optimize(linked)
        const nodeMap = assemble(optimized)

        expect(nodeMap.name).toBe('python')
        expect(nodeMap.nodes.size).toBeGreaterThan(50)

        // Verify model type distribution
        const types = new Map<string, number>()
        for (const [, node] of nodeMap.nodes) {
            types.set(node.modelType, (types.get(node.modelType) ?? 0) + 1)
        }
        expect(types.get('branch')).toBeGreaterThan(10)
        expect(types.get('leaf')).toBeGreaterThan(0)
    })

    it('processes Rust through all 4 phases', async () => {
        const raw = await evaluate(rustGrammar)
        const linked = link(raw)
        const optimized = optimize(linked)
        const nodeMap = assemble(optimized)

        expect(nodeMap.name).toBe('rust')
        expect(nodeMap.nodes.size).toBeGreaterThan(100)
    })

    it('adapter produces models from NodeMap', async () => {
        const raw = await evaluate(pythonGrammar)
        const linked = link(raw)
        const optimized = optimize(linked)
        const nodeMap = assemble(optimized)
        const models = toHydratedModels(nodeMap)

        expect(models.length).toBeGreaterThan(50)
        // Every model has a kind and modelType
        for (const m of models) {
            expect(m.kind).toBeTruthy()
            expect(m.modelType).toBeTruthy()
        }
    })
})
