/**
 * Gap analysis — identify which nodes the old pipeline produces that the new one doesn't,
 * and categorize why each is missing.
 */

import { describe, it, expect } from 'vitest'
import { evaluate } from '../compiler/evaluate.ts'
import { link } from '../compiler/link.ts'
import { optimize } from '../compiler/optimize.ts'
import { assemble } from '../compiler/assemble.ts'
import { buildGrammarModel } from '../grammar-model.ts'
import { resolve } from 'node:path'

const pythonGrammar = resolve(import.meta.dirname!, '../../../../node_modules/.pnpm/tree-sitter-python@0.25.0/node_modules/tree-sitter-python/grammar.js')

describe('Gap analysis — Python', () => {
    it('lists nodes in old pipeline but missing from new', async () => {
        const oldResult = buildGrammarModel('python')
        const oldNodes = [...oldResult.newModel.models.values()]
        const oldKinds = new Map(oldNodes.map(n => [n.kind, n.modelType]))

        const raw = await evaluate(pythonGrammar)
        const linked = link(raw)
        const optimized = optimize(linked)
        const nodeMap = assemble(optimized)
        const newKinds = new Set([...nodeMap.nodes.keys()])

        const missing: { kind: string; oldType: string }[] = []
        const extra: { kind: string }[] = []

        for (const [kind, modelType] of oldKinds) {
            if (!newKinds.has(kind)) {
                missing.push({ kind, oldType: modelType })
            }
        }

        for (const kind of newKinds) {
            if (!oldKinds.has(kind)) {
                extra.push({ kind })
            }
        }

        // Group missing by model type
        const missingByType = new Map<string, string[]>()
        for (const { kind, oldType } of missing) {
            const list = missingByType.get(oldType) ?? []
            list.push(kind)
            missingByType.set(oldType, list)
        }

        console.log('\n=== MISSING FROM NEW PIPELINE ===')
        for (const [type, kinds] of missingByType) {
            console.log(`\n${type} (${kinds.length}):`)
            for (const k of kinds.sort()) console.log(`  - ${k}`)
        }

        console.log(`\n=== EXTRA IN NEW PIPELINE (${extra.length}) ===`)
        for (const { kind } of extra.sort((a, b) => a.kind.localeCompare(b.kind))) {
            const node = nodeMap.nodes.get(kind)!
            console.log(`  - ${kind} (${node.modelType})`)
        }

        console.log(`\nMissing: ${missing.length}, Extra: ${extra.length}`)

        // Check which missing kinds have rules in grammar.js
        const ruleNames = new Set(Object.keys(raw.rules))
        const missingWithRules: string[] = []
        const missingWithoutRules: string[] = []
        for (const { kind } of missing) {
            if (ruleNames.has(kind)) {
                missingWithRules.push(kind)
            } else {
                missingWithoutRules.push(kind)
            }
        }

        console.log(`\nMissing WITH grammar rules: ${missingWithRules.length}`)
        for (const k of missingWithRules.sort()) console.log(`  - ${k}`)
        console.log(`Missing WITHOUT grammar rules: ${missingWithoutRules.length}`)
        for (const k of missingWithoutRules.sort()) console.log(`  - ${k}`)

        expect(missing.length).toBeGreaterThan(0) // We know there's a gap
    })

    it('checks model type agreement for shared kinds', async () => {
        const oldResult = buildGrammarModel('python')
        const oldNodes = [...oldResult.newModel.models.values()]
        const oldMap = new Map(oldNodes.map(n => [n.kind, n.modelType]))

        const raw = await evaluate(pythonGrammar)
        const linked = link(raw)
        const optimized = optimize(linked)
        const nodeMap = assemble(optimized)

        const disagreements: { kind: string; old: string; new: string }[] = []

        for (const [kind, node] of nodeMap.nodes) {
            const oldType = oldMap.get(kind)
            if (oldType && oldType !== node.modelType) {
                // Normalize: old 'hidden' maps to new 'supertype' or 'enum'
                if (oldType === 'hidden' && (node.modelType === 'supertype' || node.modelType === 'enum')) continue
                // token is new — old pipeline didn't have this type
                if (node.modelType === 'token') continue
                disagreements.push({ kind, old: oldType, new: node.modelType })
            }
        }

        console.log(`\n=== MODEL TYPE DISAGREEMENTS (${disagreements.length}) ===`)
        for (const d of disagreements.sort((a, b) => a.kind.localeCompare(b.kind))) {
            console.log(`  ${d.kind}: old=${d.old}, new=${d.new}`)
        }

        // Some disagreements are expected (e.g., old pipeline treats some things differently)
        // But we want to minimize them
    })
})
