/**
 * T051 — US1 Acceptance Scenario 2: forced `SITTIR_BACKEND=typescript`
 * produces byte-identical output to the TS-captured baseline.
 *
 * Asserts the codemod silently routes through the TS engine when the
 * env var is set (the documented user-forced fallback path), and that
 * the output files match the captured TS-baseline byte-for-byte.
 *
 * Because the baseline was itself captured under `SITTIR_BACKEND=typescript`
 * (`tests/acceptance/capture-baseline.ts`, see T050), this comparison is
 * trivially TS-vs-TS — byte-equality is guaranteed by construction. The
 * load-bearing assertion of this test is therefore *structural*: that
 * `getActiveBackend()` reports the typescript backend with a reason
 * citing the env-var override, proving the backend-selection code path
 * actually routes through the TS engine when the env var is set.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CORPUS_DIR = join(__dirname, 'fixtures', 'codemod-sample')
const BASELINE_DIR = join(CORPUS_DIR, 'baseline')

describe('US1 acceptance — SITTIR_BACKEND=typescript fallback (T051)', () => {
    const originalEnv = process.env.SITTIR_BACKEND
    beforeAll(() => {
        process.env.SITTIR_BACKEND = 'typescript'
    })
    afterAll(() => {
        if (originalEnv === undefined) {
            delete process.env.SITTIR_BACKEND
        } else {
            process.env.SITTIR_BACKEND = originalEnv
        }
        vi.resetModules()
    })

    it('getActiveBackend().name === "typescript" with reason citing the env-var override', async () => {
        // Reset the module graph so backend.ts's module-singleton
        // recomputes — without resetModules() the cached status from
        // an earlier test file (e.g. T050) keeps its native verdict
        // and the SITTIR_BACKEND=typescript override never runs.
        vi.resetModules()
        const { getActiveBackend } = await import('@sittir/rust')
        const backend = getActiveBackend()
        expect(backend.name).toBe('typescript')
        expect(backend.reason ?? '').toMatch(/user-forced|sittir_backend/i)
    })

    it('produces files byte-identical to the TS-captured baseline', async () => {
        // Re-import the codemod helper fresh so its `applyEdits`
        // boundary import resolves through a backend.ts that observes
        // SITTIR_BACKEND=typescript on first call.
        vi.resetModules()
        const { runCodemodOnDir } = await import('./codemod-inline.ts')
        const results = await runCodemodOnDir(CORPUS_DIR)
        const baselineFiles = new Set(
            readdirSync(BASELINE_DIR).filter((n) => n.endsWith('.rs')),
        )
        expect(results.length).toBeGreaterThanOrEqual(20)
        for (const r of results) {
            const name = basename(r.path)
            expect(baselineFiles.has(name)).toBe(true)
            const expected = readFileSync(join(BASELINE_DIR, name), 'utf-8')
            // Byte-identical — TS on both sides of the comparison
            // (baseline was captured under SITTIR_BACKEND=typescript,
            // this run forces the same). Any divergence here would
            // signal a non-determinism in the TS engine itself.
            expect(r.output).toBe(expected)
        }
    })
})
