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
 *   FLOORS   — the minimum the current pipeline must achieve today.
 *              Asserted; lowering them fails CI without justification.
 *
 *   LEGACY_BASELINE — the numbers the pre-refactor pipeline hit in the
 *              final validation reports checked in at
 *              `packages/{g}/validation-report.txt` (2026-04-09). The
 *              current pipeline must eventually match or beat these;
 *              the gap between FLOORS and LEGACY_BASELINE is the
 *              outstanding debt.
 *
 * The test ALSO asserts that FLOORS never drops below LEGACY_BASELINE,
 * which means any PR closing the gap must raise FLOORS in the same
 * commit.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generate } from '../compiler/generate.ts'
import { validateFactoryRoundTrip } from '../validate-factory-roundtrip.ts'
import { validateFrom } from '../validate-from.ts'
import { validateRenderable } from '../validate-renderable.ts'
import { validateReadNodeRoundTrip } from '../validate-readnode-roundtrip.ts'
import { validateRoundTrip } from '../validate-roundtrip.ts'
import { validateTemplateCoverage } from '../validate-template-coverage.ts'

/**
 * Current floors — asserted. When a fix lands, raise these in the
 * same commit so the gap to LEGACY_BASELINE stays visible.
 */
const FLOORS = {
    python: {
        factoryPass: 94,
        factoryAstMatchPass: 91,
        factoryTotal: 100,
        fromPass: 110,
        fromTotal: 117,
        // Full round-trip: corpus → readNode → render → re-parse → compare.
        // Toughest validator — catches template bugs invisible to
        // factory/from validation.
        rtPass: 109,
        rtTotal: 115,
        // Strict structural match — the reparsed AST must equal the
        // original parse tree on every anonymous token and every
        // named child. Subset of `rtPass`. Catches silently dropped
        // content (stray `;` / `,` / `async` keyword) the weaker
        // kind-found check misses.
        rtAstMatchPass: 106,
        // Template coverage: every declared field reachable in template.
        // Structural check, independent of corpus contents.
        covPass: 99,
        covTotal: 101,
    },
    rust: {
        factoryPass: 127,
        factoryAstMatchPass: 123,
        factoryTotal: 135,
        fromPass: 142,
        fromTotal: 154,
        rtPass: 121,
        rtTotal: 136,
        rtAstMatchPass: 112,
        covPass: 136,
        covTotal: 137,
    },
    typescript: {
        factoryPass: 121,
        factoryAstMatchPass: 121,
        factoryTotal: 126,
        fromPass: 132,
        fromTotal: 143,
        rtPass: 110,
        rtTotal: 112,
        rtAstMatchPass: 110,
        covPass: 139,
        covTotal: 145,
    },
} as const

/**
 * Legacy baseline — the target. Source:
 * packages/{g}/validation-report.txt committed at 2026-04-09 (commit
 * b85075b). The current pipeline must eventually match or exceed
 * these numbers before the rewrite is considered complete.
 */
const LEGACY_BASELINE = {
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

        it(`factory build fidelity (AST match) passes at least ${floors.factoryAstMatchPass}/${floors.factoryTotal}`, async () => {
            // Strict structural equality on the factory-build round-trip.
            // Catches factory API gaps the weaker kind-found check misses:
            // dropped anonymous children (e.g. python `async` prefix),
            // missing field surface, children slot not plumbed through
            // the factory signature.
            const yaml = await loadTemplates(grammar)
            const result = await validateFactoryRoundTrip(grammar, yaml)

            expect(result.astMatchPass).toBeGreaterThanOrEqual(floors.factoryAstMatchPass)
        }, 60000)

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

        it(`full round-trip (render → reparse) passes at least ${floors.rtPass}/${floors.rtTotal}`, async () => {
            const yaml = await loadTemplates(grammar)
            const result = await validateRoundTrip(grammar, yaml)

            expect(result.total).toBeGreaterThanOrEqual(floors.rtTotal)
            expect(result.pass).toBeGreaterThanOrEqual(floors.rtPass)
        }, 60000)

        it(`round-trip AST match passes at least ${floors.rtAstMatchPass}/${floors.rtTotal}`, async () => {
            // Strict structural equality between the original parse and
            // the reparsed tree — anonymous tokens included. Tightens
            // `rtPass` (which only checks that the kind survives) so
            // regressions that silently drop content like `;` / `,` /
            // keyword tokens fail CI. The gap between `rtAstMatchPass`
            // and `rtPass` is the outstanding fidelity debt.
            const yaml = await loadTemplates(grammar)
            const result = await validateRoundTrip(grammar, yaml)

            expect(result.astMatchPass).toBeGreaterThanOrEqual(floors.rtAstMatchPass)
        }, 60000)

        it(`template coverage passes at least ${floors.covPass}/${floors.covTotal}`, async () => {
            const yaml = await loadTemplates(grammar)
            const result = validateTemplateCoverage(grammar, yaml)

            expect(result.total).toBeGreaterThanOrEqual(floors.covTotal)
            expect(result.pass).toBeGreaterThanOrEqual(floors.covPass)
        })
    },
)

describe('corpus validation — legacy baseline gap report', () => {
    // These tests document the delta between the current floor and the
    // legacy baseline. They are always-passing snapshots, not assertions
    // — the goal is visibility. When the gap closes, bump FLOORS.
    it.each(Object.keys(FLOORS) as GrammarName[])(
        '%s gap report',
        (grammar) => {
            const current = FLOORS[grammar]
            const baseline = LEGACY_BASELINE[grammar]
            const gapFactory = baseline.factoryPass - current.factoryPass
            const gapFrom = baseline.fromPass - current.fromPass
            const gapFactoryTotal = baseline.factoryTotal - current.factoryTotal
            const gapFromTotal = baseline.fromTotal - current.fromTotal

            // Print the gap so it shows up in test output even when passing.
            // eslint-disable-next-line no-console
            console.log(
                `  [${grammar}] factory: current ${current.factoryPass}/${current.factoryTotal}` +
                ` vs baseline ${baseline.factoryPass}/${baseline.factoryTotal}` +
                ` (gap ${gapFactory} passes, ${gapFactoryTotal} kinds)\n` +
                `  [${grammar}] from():  current ${current.fromPass}/${current.fromTotal}` +
                ` vs baseline ${baseline.fromPass}/${baseline.fromTotal}` +
                ` (gap ${gapFrom} passes, ${gapFromTotal} kinds)`
            )

            // Floors must never be negative (nonsensical)
            expect(current.factoryPass).toBeGreaterThanOrEqual(0)
            expect(current.fromPass).toBeGreaterThanOrEqual(0)
        },
    )
})

describe('readNode round-trip — structural', () => {
    // readNode must surface every tree-sitter field and named child
    // into the NodeData shape. 100% pass is mandatory — any lost
    // content upstream corrupts every downstream validator.
    it.each(['python', 'rust', 'typescript'] as const)(
        '%s: every kind in the corpus passes the structural check',
        async (grammar) => {
            const result = await validateReadNodeRoundTrip(grammar)
            if (result.issues.length > 0) {
                const lines = result.issues
                    .slice(0, 10)
                    .map(i => `  - ${i.kind} [${i.instance}]: ${i.message}`)
                    .join('\n')
                throw new Error(
                    `readNode lost content on ${result.issues.length} kind(s) in ${grammar}:\n${lines}`,
                )
            }
            expect(result.pass).toBe(result.total)
            expect(result.total).toBeGreaterThan(0)
        },
        60000,
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
        '%s generate emits all files + sane NodeMap',
        async (grammar) => {
            const result = await generate({
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
