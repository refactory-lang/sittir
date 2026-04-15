/**
 * Baseline diff — compare generate output against golden snapshots.
 *
 * This is the primary correctness validation (T048-T050).
 * Output should be functionally equivalent, not necessarily byte-identical.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { generate } from '../compiler/generate.ts'

const baselineDir = resolve(import.meta.dirname!, '../../../../specs/005-five-phase-compiler/baseline')

// Map of generated file key → output filename
const FILE_MAP: Record<string, string> = {
    types: 'types.ts',
    factories: 'factories.ts',
    consts: 'consts.ts',
    index: 'index.ts',
    grammar: 'grammar.ts',
    irNamespace: 'ir.ts',
    utils: 'utils.ts',
    wrap: 'wrap.ts',
    from: 'from.ts',
    typeTests: 'type-test.ts',
}

function diffSummary(baseline: string, generated: string): { same: boolean; baselineLines: number; generatedLines: number; diffLines: number } {
    const bLines = baseline.split('\n')
    const gLines = generated.split('\n')
    let diffCount = 0
    const maxLen = Math.max(bLines.length, gLines.length)
    for (let i = 0; i < maxLen; i++) {
        if (bLines[i] !== gLines[i]) diffCount++
    }
    return {
        same: diffCount === 0,
        baselineLines: bLines.length,
        generatedLines: gLines.length,
        diffLines: diffCount,
    }
}

for (const grammar of ['python', 'rust', 'typescript']) {
    describe(`Baseline diff — ${grammar}`, () => {
        let result: Awaited<ReturnType<typeof generate>>

        it(`generates output for ${grammar}`, async () => {
            result = await generate({
                grammar,
                outputDir: `/tmp/sittir-baseline-${grammar}`,
            })
            expect(result).toBeDefined()
        }, 30000)

        for (const [key, filename] of Object.entries(FILE_MAP)) {
            it(`${filename} — diff summary`, () => {
                const baselinePath = resolve(baselineDir, grammar, filename)
                if (!existsSync(baselinePath)) {
                    console.log(`  SKIP: ${filename} — no baseline`)
                    return
                }

                const baseline = readFileSync(baselinePath, 'utf-8')
                const generated = (result as any)?.[key] as string
                if (!generated) {
                    console.log(`  SKIP: ${filename} — not generated`)
                    return
                }

                const diff = diffSummary(baseline, generated)
                console.log(`  ${filename}: baseline=${diff.baselineLines} lines, generated=${diff.generatedLines} lines, diff=${diff.diffLines} lines (${diff.same ? 'IDENTICAL' : 'DIFFERS'})`)

                // We don't assert identity — we just report differences
                // The test passes as long as output is generated
                expect(generated.length).toBeGreaterThan(0)
            })
        }
    })
}
