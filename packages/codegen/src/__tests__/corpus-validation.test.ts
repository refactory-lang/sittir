/**
 * Corpus validation floor test.
 *
 * Pins the EXACT tree-sitter corpus validation path — the same validators
 * invoked by `sittir --roundtrip` — as a regression guard. Failures here
 * mean the generated output drifted from what the runtime validators
 * can exercise against real grammar fixtures.
 *
 * The asserted floors intentionally track v2's current pass rates. When
 * improving them, raise the floor in the same commit so future regressions
 * get caught. NEVER lower a floor without explicit justification.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generateV2 } from '../compiler/generate.ts'
import { validateFactoryRoundTrip } from '../validate-factory-roundtrip.ts'
import { validateFrom } from '../validate-from.ts'

/**
 * Baseline floors — the minimum pass counts each validator must achieve
 * against the checked-in generated packages. Raise these when fixes land;
 * never lower without justification. See specs/005-five-phase-compiler.
 */
const FLOORS = {
    python: {
        factoryPass: 54,
        factoryTotal: 84,
        fromPass: 67,
        fromTotal: 100,
    },
    rust: {
        factoryPass: 56,
        factoryTotal: 122,
        fromPass: 72,
        fromTotal: 135,
    },
    typescript: {
        factoryPass: 90,
        factoryTotal: 115,
        fromPass: 53,
        fromTotal: 126,
    },
} as const

type GrammarName = keyof typeof FLOORS

async function loadTemplates(grammar: GrammarName): Promise<string> {
    // Use the checked-in templates.yaml so the validators run against the
    // same artifact developers/CI see.
    const path = resolve(
        new URL('../../../..', import.meta.url).pathname,
        `packages/${grammar}/templates.yaml`,
    )
    return readFileSync(path, 'utf-8')
}

describe.each(Object.keys(FLOORS) as GrammarName[])(
    'corpus validation floor — %s',
    (grammar) => {
        const floors = FLOORS[grammar]

        it(`factory round-trip passes at least ${floors.factoryPass}/${floors.factoryTotal}`, async () => {
            const yaml = await loadTemplates(grammar)
            const result = await validateFactoryRoundTrip(grammar, yaml)

            expect(result.total).toBeGreaterThanOrEqual(floors.factoryTotal)
            expect(result.pass).toBeGreaterThanOrEqual(floors.factoryPass)
        }, 60000)

        it(`from() correctness passes at least ${floors.fromPass}/${floors.fromTotal}`, async () => {
            const yaml = await loadTemplates(grammar)
            const result = await validateFrom(grammar, yaml)

            expect(result.total).toBeGreaterThanOrEqual(floors.fromTotal)
            expect(result.pass).toBeGreaterThanOrEqual(floors.fromPass)
        }, 60000)
    },
)

describe('corpus validation — generator produces usable output', () => {
    it.each(Object.keys(FLOORS) as GrammarName[])(
        '%s generateV2 emits all files + sane NodeMap',
        async (grammar) => {
            const result = await generateV2({
                grammar,
                outputDir: `/tmp/sittir-floor-${grammar}/src`,
            })
            expect(result.factories).toContain('_factoryMap')
            expect(result.from).toContain('_fromMap')
            expect(result.nodeMap.nodes.size).toBeGreaterThan(0)
        },
        30000,
    )
})
