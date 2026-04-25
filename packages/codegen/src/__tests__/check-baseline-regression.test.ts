/**
 * Tests for `check-baseline-regression.ts` — feature 016 / T009.
 *
 * The CI regression-checker compares two `BackendBaseline` JSONs (base
 * vs head) and exits non-zero on any of the five verdict rules from
 * `specs/016-parity-regressions/contracts/baseline-json.md`:
 *
 *   1. Pass-count drop (any per-validator pass / astMatchPass /
 *      parityFixtures.pass / totals.pass).
 *   2. Total drop (totals.total decreased — fixture deletion).
 *   3. Total-fail rise (totals.fail increased).
 *   4. Schema violation (missing keys, unsorted arrays, missing
 *      formatDeferredKinds / formatDeferredByKind).
 *   5. Format-deferred-count rise within feature 016 (sum of
 *      `failingKinds + formatDeferredKinds` may not grow, but items
 *      may MOVE between the two arrays).
 *
 * Tests feed two in-memory BackendBaseline objects to `checkRegression`
 * to keep the surface free of file I/O — the CLI wrapper handles
 * filesystem access.
 */

import { describe, it, expect } from 'vitest'
import {
    checkRegression,
    type RegressionVerdict,
} from '../scripts/check-baseline-regression.ts'
import type {
    BackendBaseline,
    GrammarEntry,
    ParityFixtures,
    RoundtripResult,
    ValidatorResult,
} from '../scripts/collect-baseline.ts'

// ---------------------------------------------------------------------------
// Helpers — build a minimal-but-schema-conformant BackendBaseline that
// individual tests can mutate via deep-clone + targeted edits.
// ---------------------------------------------------------------------------

function vr(pass: number, total: number, failingKinds: string[] = [], formatDeferredKinds: string[] = []): ValidatorResult {
    return { pass, total, failingKinds: [...failingKinds].sort(), formatDeferredKinds: [...formatDeferredKinds].sort() }
}

function rt(pass: number, total: number, astMatchPass: number, failingKinds: string[] = [], formatDeferredKinds: string[] = []): RoundtripResult {
    return {
        pass, total, astMatchPass,
        failingKinds: [...failingKinds].sort(),
        formatDeferredKinds: [...formatDeferredKinds].sort(),
    }
}

function pf(pass: number, total: number): ParityFixtures {
    return { pass, total, failingByKind: {}, formatDeferredByKind: {} }
}

function entry(): GrammarEntry {
    return {
        validators: {
            from: vr(10, 10),
            coverage: vr(10, 10),
            roundtrip: rt(10, 10, 10),
            factoryRoundtrip: rt(10, 10, 10),
        },
        parityFixtures: pf(10, 10),
    }
}

function baseline(backend: 'typescript' | 'native' = 'typescript'): BackendBaseline {
    return {
        backend,
        commit: '0000000',
        grammars: {
            python: entry(),
            rust: entry(),
            typescript: entry(),
        },
        totals: { pass: 150, fail: 0, total: 150 },
    }
}

function clone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v)) as T
}

function expectFail(verdict: RegressionVerdict): asserts verdict is Extract<RegressionVerdict, { ok: false }> {
    if (verdict.ok) {
        throw new Error(`expected verdict.ok === false, got ok with summary=${verdict.summary}`)
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('checkRegression', () => {
    it('identical baselines pass — exit 0, summary string set', () => {
        const base = baseline()
        const head = clone(base)
        const verdict = checkRegression(base, head)
        expect(verdict.ok).toBe(true)
        if (verdict.ok) {
            expect(typeof verdict.summary).toBe('string')
            // Sanity: summary mentions both backends or at least confirms parity.
            expect(verdict.summary.length).toBeGreaterThan(0)
        }
    })

    it('pass-count drop detected — names the dropped path', () => {
        const base = baseline()
        const head = clone(base)
        head.grammars.rust.validators.from.pass = 9
        // Keep totals consistent so this is the ONLY drop we trigger.
        head.totals.pass = 149
        head.totals.fail = 1
        const verdict = checkRegression(base, head)
        expectFail(verdict)
        expect(verdict.reason).toBe('pass-count-drop')
        expect(verdict.details.path).toContain('grammars.rust.validators.from.pass')
        expect(verdict.details.before).toBe(10)
        expect(verdict.details.after).toBe(9)
    })

    it('schema violation detected — unsorted failingKinds is rejected', () => {
        const base = baseline()
        const head = clone(base)
        // Force unsorted failingKinds (writer normally sorts; manual edit could break this).
        head.grammars.rust.validators.from.failingKinds = ['zebra', 'alpha']
        const verdict = checkRegression(base, head)
        expectFail(verdict)
        expect(verdict.reason).toBe('schema-violation')
        expect(verdict.details.path).toContain('grammars.rust.validators.from.failingKinds')
    })

    it('schema violation detected — missing formatDeferredKinds key is rejected', () => {
        const base = baseline()
        const head = clone(base) as BackendBaseline & { grammars: Record<string, GrammarEntry> }
        // Cast to allow deletion of a required key — exercises the schema check.
        delete (head.grammars.rust.validators.from as { formatDeferredKinds?: string[] }).formatDeferredKinds
        const verdict = checkRegression(base, head)
        expectFail(verdict)
        expect(verdict.reason).toBe('schema-violation')
        expect(verdict.details.path).toContain('formatDeferredKinds')
    })

    it('format-deferred count grew alone — fail (rule #5)', () => {
        const base = baseline()
        const head = clone(base)
        // No move — failingKinds stayed []; formatDeferredKinds grew by 1 → SUM grew.
        head.grammars.rust.validators.from.formatDeferredKinds = ['new_kind']
        const verdict = checkRegression(base, head)
        expectFail(verdict)
        expect(verdict.reason).toBe('format-deferred-rise')
        expect(verdict.details.path).toContain('grammars.rust.validators.from')
    })

    it('format-deferred count grew but failing-kind shrank by same amount — pass (move semantics)', () => {
        const base = baseline()
        base.grammars.rust.validators.from.failingKinds = ['kind_a']
        const head = clone(base)
        // Move kind_a from failing → format-deferred (template-shape fix surfaced format-only diff).
        head.grammars.rust.validators.from.failingKinds = []
        head.grammars.rust.validators.from.formatDeferredKinds = ['kind_a']
        const verdict = checkRegression(base, head)
        expect(verdict.ok).toBe(true)
    })

    it('total fixture count decreased — fail (rule #2)', () => {
        const base = baseline()
        const head = clone(base)
        head.totals.total = 149
        // Don't change pass — fail also drops by 1 (negative); we want the
        // total-drop check to fire BEFORE total-fail-rise.
        head.totals.pass = 149
        head.totals.fail = 0
        head.grammars.rust.validators.from.total = 9
        head.grammars.rust.validators.from.pass = 9
        const verdict = checkRegression(base, head)
        expectFail(verdict)
        expect(verdict.reason).toBe('total-drop')
    })

    it('strictly improved counts pass — pass-count up, totals.fail down', () => {
        const base = baseline()
        // Encode 1 failure in base on rust.from so we can recover it in head.
        base.grammars.rust.validators.from.pass = 9
        base.grammars.rust.validators.from.failingKinds = ['kind_x']
        base.totals.pass = 149
        base.totals.fail = 1
        const head = clone(base)
        head.grammars.rust.validators.from.pass = 10
        head.grammars.rust.validators.from.failingKinds = []
        head.totals.pass = 150
        head.totals.fail = 0
        const verdict = checkRegression(base, head)
        expect(verdict.ok).toBe(true)
    })
})
