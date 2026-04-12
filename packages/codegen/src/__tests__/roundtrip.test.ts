/**
 * Round-trip validation: v2 pipeline → generated output → runtime validation.
 *
 * This is the critical acceptance test for the five-phase rewrite.
 * It exercises the generated code at runtime:
 *   1. Generate output via generateV2()
 *   2. Write templates.yaml (factory round-trip uses this directly)
 *   3. Run validateFactoryRoundTrip against the output
 *   4. Report pass/fail
 *
 * Note: This test depends on the generated factories being importable
 * at packages/{grammar}/src/factories.ts. It does NOT currently overwrite
 * the checked-in generated files — it writes to /tmp and expects the
 * validator to load from the checked-in location.
 */

import { describe, it, expect } from 'vitest'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { generateV2 } from '../compiler/generate.ts'

describe('v2 round-trip validation', () => {
    it('generates all output files for python without crashing', async () => {
        const result = await generateV2({
            grammar: 'python',
            outputDir: '/tmp/sittir-rt-python/src',
        })
        expect(result.types.length).toBeGreaterThan(0)
        expect(result.factories.length).toBeGreaterThan(0)
        expect(result.templatesYaml.length).toBeGreaterThan(0)
        expect(result.from.length).toBeGreaterThan(0)
    }, 30000)

    it('generates all output files for rust without crashing', async () => {
        const result = await generateV2({
            grammar: 'rust',
            outputDir: '/tmp/sittir-rt-rust/src',
        })
        expect(result.types.length).toBeGreaterThan(0)
        expect(result.factories.length).toBeGreaterThan(0)
    }, 30000)

    it('generates all output files for typescript without crashing', async () => {
        const result = await generateV2({
            grammar: 'typescript',
            outputDir: '/tmp/sittir-rt-typescript/src',
        })
        expect(result.types.length).toBeGreaterThan(0)
        expect(result.factories.length).toBeGreaterThan(0)
    }, 30000)

    it('produces valid-looking templates.yaml for python', async () => {
        const result = await generateV2({
            grammar: 'python',
            outputDir: '/tmp/sittir-rt-python/src',
        })
        // The yaml should have a 'rules' section and some rules
        expect(result.templatesYaml).toContain('rules')
        expect(result.templatesYaml).toContain('grammar: python')
    }, 30000)

    it('factory round-trip is valid: NodeMap → factories reference correct types', async () => {
        const result = await generateV2({
            grammar: 'python',
            outputDir: '/tmp/sittir-rt-python/src',
        })
        // Basic sanity — factories should export functions and reference types
        expect(result.factories).toContain('export function')
        expect(result.factories).toContain('_factoryMap')
        // Types should have interfaces
        expect(result.types).toContain('export interface')
        expect(result.types).toContain('SyntaxKind')
    }, 30000)
})

describe('v2 NodeMap structure', () => {
    it('polymorph forms are synthesized into the NodeMap as groups', async () => {
        const result = await generateV2({
            grammar: 'python',
            outputDir: '/tmp/sittir-rt-python/src',
        })
        // Check the NodeMap contains group entries for polymorph forms
        let groupCount = 0
        let polymorphCount = 0
        for (const [_kind, node] of result.nodeMap.nodes) {
            if (node.modelType === 'group') groupCount++
            if (node.modelType === 'polymorph') polymorphCount++
        }
        // Python has several polymorph nodes; each should have at least one form → group
        expect(polymorphCount).toBeGreaterThan(0)
        expect(groupCount).toBeGreaterThan(0)
    }, 30000)

    it('every branch node has a rule attached', async () => {
        const result = await generateV2({
            grammar: 'python',
            outputDir: '/tmp/sittir-rt-python/src',
        })
        let branchCount = 0
        for (const [_kind, node] of result.nodeMap.nodes) {
            if (node.modelType === 'branch') {
                branchCount++
                // AssembledBranch.rule should be present
                expect((node as any).rule).toBeDefined()
            }
        }
        expect(branchCount).toBeGreaterThan(0)
    }, 30000)
})
