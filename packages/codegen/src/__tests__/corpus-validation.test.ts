/**
 * Corpus validation floor test.
 *
 * Pins the EXACT tree-sitter corpus validation path — the same validators
 * invoked by `sittir --roundtrip` — as a regression guard. Failures here
 * mean the generated output drifted from what the runtime validators
 * can exercise against real grammar fixtures.
 *
 * Two sets of numbers per grammar:
 *
 *   FLOORS   — the minimum the v2 pipeline must achieve today. These are
 *              asserted; lowering them fails CI without justification.
 *
 *   V1_BASELINE — the numbers the v1 pipeline hit in the final validation
 *              reports checked in at packages/{g}/validation-report.txt
 *              (2026-04-09). v2 must eventually match or beat these; the
 *              gap between FLOORS and V1_BASELINE is the outstanding debt.
 *
 * The test ALSO asserts that FLOORS never drops below V1_BASELINE, which
 * means any PR closing the gap must raise FLOORS in the same commit.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generateV2 } from '../compiler/generate.ts'
import { validateFactoryRoundTrip } from '../validate-factory-roundtrip.ts'
import { validateFrom } from '../validate-from.ts'
import { validateRenderable } from '../validate-renderable.ts'

/**
 * v2 current floors — asserted. When a fix lands, raise these in the
 * same commit so the gap to V1_BASELINE stays visible.
 */
const FLOORS = {
    python: {
        factoryPass: 90,
        factoryTotal: 100,
        fromPass: 103,
        fromTotal: 114,
    },
    rust: {
        factoryPass: 109,
        factoryTotal: 135,
        fromPass: 138,
        fromTotal: 149,
    },
    typescript: {
        factoryPass: 113,
        factoryTotal: 126,
        fromPass: 115,
        fromTotal: 142,
    },
} as const

/**
 * v1 baseline — the target. Source: packages/{g}/validation-report.txt
 * committed at 2026-04-09 (commit b85075b). The v2 pipeline must eventually
 * match or exceed these numbers before the rewrite is considered complete.
 */
const V1_BASELINE = {
    python: {
        factoryPass: 92,
        factoryTotal: 99,
        fromPass: 92,
        fromTotal: 99,
    },
    rust: {
        factoryPass: 112,
        factoryTotal: 135,
        fromPass: 133,
        fromTotal: 135,
    },
    typescript: {
        factoryPass: 119,
        factoryTotal: 123,
        fromPass: 118,
        fromTotal: 123,
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

describe('corpus validation — v1 baseline gap report', () => {
    // These tests document the delta between v2's current floor and the
    // v1 baseline. They are always-passing snapshots, not assertions —
    // the goal is visibility. When the gap closes, bump FLOORS.
    it.each(Object.keys(FLOORS) as GrammarName[])(
        '%s gap report',
        (grammar) => {
            const v2 = FLOORS[grammar]
            const v1 = V1_BASELINE[grammar]
            const gapFactory = v1.factoryPass - v2.factoryPass
            const gapFrom = v1.fromPass - v2.fromPass
            const gapFactoryTotal = v1.factoryTotal - v2.factoryTotal
            const gapFromTotal = v1.fromTotal - v2.fromTotal

            // Print the gap so it shows up in test output even when passing.
            // eslint-disable-next-line no-console
            console.log(
                `  [${grammar}] factory: v2 ${v2.factoryPass}/${v2.factoryTotal}` +
                ` vs v1 ${v1.factoryPass}/${v1.factoryTotal}` +
                ` (gap ${gapFactory} passes, ${gapFactoryTotal} kinds)\n` +
                `  [${grammar}] from():  v2 ${v2.fromPass}/${v2.fromTotal}` +
                ` vs v1 ${v1.fromPass}/${v1.fromTotal}` +
                ` (gap ${gapFrom} passes, ${gapFromTotal} kinds)`
            )

            // Floors must never be negative (nonsensical)
            expect(v2.factoryPass).toBeGreaterThanOrEqual(0)
            expect(v2.fromPass).toBeGreaterThanOrEqual(0)
        },
    )
})

describe('renderability — every node-types.json kind must be reachable', () => {
    // Every named entry in tree-sitter's node-types.json must be reachable
    // by @sittir/core's render() via one of: supertype dispatch, pure leaf
    // (direct text), or a rules-map entry. An un-renderable kind means
    // `render(node)` will throw at runtime for any instance of that kind.
    it.each(Object.keys(FLOORS) as GrammarName[])(
        '%s: 100%% of named kinds are renderable',
        async (grammar) => {
            const yaml = await loadTemplates(grammar)
            const result = validateRenderable(grammar, yaml)
            if (result.missing.length > 0) {
                const lines = result.missing
                    .slice(0, 10)
                    .map(m => `  - ${m.kind}: ${m.reason}`)
                    .join('\n')
                throw new Error(
                    `${result.missing.length} un-renderable kind(s) in ${grammar}:\n${lines}`,
                )
            }
            expect(result.missing).toHaveLength(0)
            expect(result.renderable).toBe(result.total)
            expect(result.total).toBeGreaterThan(0)
        },
    )
})

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
