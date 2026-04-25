/**
 * Tests for `collect-baseline.ts` — the producer of the per-backend
 * BackendBaseline JSON files committed under
 * `specs/016-parity-regressions/baselines/{ts,native}.json`.
 *
 * Contract: see `specs/016-parity-regressions/contracts/baseline-json.md`.
 *
 * Goals:
 * - Determinism — running twice returns byte-identical output.
 * - Schema conformance — top-level + per-grammar + per-validator key sets
 *   match the contract, in sorted order.
 * - Sorted `failingKinds` and sorted `failingByKind` keys.
 * - Empty collections are explicit (`[]` / `{}`), not undefined.
 * - `totals.pass + totals.fail === totals.total`.
 * - `commit` is a 7-char hex.
 * - No embedded timestamps anywhere in the serialised JSON.
 *
 * The test calls the exported `collectBaseline()` function directly so
 * we don't have to spawn a subprocess. Backend defaults to 'typescript'
 * to match the script's CLI default, which is the cheaper of the two
 * collection paths (no native engine init).
 */

import { describe, it, expect } from 'vitest'
import { collectBaseline, serialiseBaseline } from '../scripts/collect-baseline.ts'

describe('collect-baseline', () => {
    it('determinism — two runs produce byte-identical serialised output', async () => {
        const a = await collectBaseline('typescript')
        const b = await collectBaseline('typescript')
        const sa = serialiseBaseline(a)
        const sb = serialiseBaseline(b)
        // Surface mismatches as a small diff for pinpoint diagnosis.
        if (sa !== sb) {
            const aLines = sa.split('\n')
            const bLines = sb.split('\n')
            const max = Math.max(aLines.length, bLines.length)
            const diffs: string[] = []
            for (let i = 0; i < max && diffs.length < 5; i++) {
                if (aLines[i] !== bLines[i]) {
                    diffs.push(`line ${i + 1}:\n  a: ${aLines[i]}\n  b: ${bLines[i]}`)
                }
            }
            throw new Error(`serialised output differs across runs\n${diffs.join('\n')}`)
        }
        expect(sa).toBe(sb)
    }, 600_000)

    it('schema conformance — top-level, per-grammar, per-validator keys match contract', async () => {
        const result = await collectBaseline('typescript')
        // Round-trip through serialise/parse to verify what's persisted is what's checked.
        const parsed = JSON.parse(serialiseBaseline(result)) as Record<string, unknown>

        expect(Object.keys(parsed).sort()).toEqual(['backend', 'commit', 'grammars', 'totals'])

        const grammars = parsed['grammars'] as Record<string, unknown>
        expect(Object.keys(grammars)).toEqual(['python', 'rust', 'typescript'])

        for (const g of ['python', 'rust', 'typescript'] as const) {
            const entry = grammars[g] as Record<string, unknown>
            expect(Object.keys(entry).sort()).toEqual(['parityFixtures', 'validators'])

            const validators = entry['validators'] as Record<string, unknown>
            expect(Object.keys(validators)).toEqual(
                ['coverage', 'factoryRoundtrip', 'from', 'roundtrip'],
            )

            const fixtures = entry['parityFixtures'] as Record<string, unknown>
            expect(Object.keys(fixtures).sort()).toEqual(['failingByKind', 'pass', 'total'])
        }
    }, 600_000)

    it('failingKinds arrays are sorted ascending', async () => {
        const result = await collectBaseline('typescript')
        for (const grammar of Object.keys(result.grammars) as ('python' | 'rust' | 'typescript')[]) {
            const validators = result.grammars[grammar].validators
            for (const name of ['from', 'coverage', 'roundtrip', 'factoryRoundtrip'] as const) {
                const arr = validators[name].failingKinds
                expect(Array.isArray(arr)).toBe(true)
                expect(arr).toEqual([...arr].sort())
            }
        }
    }, 600_000)

    it('failingByKind keys are sorted ascending', async () => {
        const result = await collectBaseline('typescript')
        for (const grammar of Object.keys(result.grammars) as ('python' | 'rust' | 'typescript')[]) {
            const obj = result.grammars[grammar].parityFixtures.failingByKind
            const keys = Object.keys(obj)
            expect(keys).toEqual([...keys].sort())
        }
    }, 600_000)

    it('empty collections are explicit (failingKinds: [], failingByKind: {})', async () => {
        const result = await collectBaseline('typescript')
        // Walk every validator + parityFixtures bucket and check the field is
        // present even when empty. (The whole point — distinguishes "no
        // failures observed" from "this validator wasn't run".)
        for (const grammar of Object.keys(result.grammars) as ('python' | 'rust' | 'typescript')[]) {
            const validators = result.grammars[grammar].validators
            for (const name of ['from', 'coverage', 'roundtrip', 'factoryRoundtrip'] as const) {
                expect(Array.isArray(validators[name].failingKinds)).toBe(true)
            }
            const obj = result.grammars[grammar].parityFixtures.failingByKind
            expect(typeof obj).toBe('object')
            expect(obj).not.toBeNull()
            expect(Array.isArray(obj)).toBe(false)
        }
    }, 600_000)

    it('totals consistency — pass + fail === total', async () => {
        const result = await collectBaseline('typescript')
        expect(result.totals.pass + result.totals.fail).toBe(result.totals.total)
    }, 600_000)

    it('commit field is a 7-character hex string', async () => {
        const result = await collectBaseline('typescript')
        expect(result.commit).toMatch(/^[a-f0-9]{7}$/)
    }, 600_000)

    it('serialised output contains no timestamps (ISO-8601 or unix-ms magnitude)', async () => {
        const result = await collectBaseline('typescript')
        const text = serialiseBaseline(result)
        expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)
        // 13-digit numbers (millisecond unix timestamps) — the JSON
        // shouldn't carry any. Allow up to 12 digits which can still
        // appear as count totals if the universe ever explodes
        // dramatically, but 13+ digits would only be a wall-clock value.
        expect(text).not.toMatch(/\b\d{13,}\b/)
    }, 600_000)
})
