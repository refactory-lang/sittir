/**
 * T051 — US1 Acceptance Scenario 2: forced `SITTIR_BACKEND=typescript`
 * produces byte-identical output to an uncontrolled run.
 *
 * Asserts the codemod silently falls through to the TS engine when
 * the env var is set, and the resulting files match the native-
 * backend output byte-for-byte at the file level (stronger than
 * render-only parity — TS is on both sides of the comparison, so
 * the files are the baseline).
 *
 * Currently SKIPPED — depends on T050's sample corpus + baseline
 * fixtures. See `us1-codemod.test.ts` for un-skip criteria.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe.skip('US1 acceptance — SITTIR_BACKEND=typescript fallback (T051)', () => {
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
    })

    it('getActiveBackend().name === "typescript" with reason "user-forced"', async () => {
        // Re-import to pick up the env var in backend.ts's singleton
        // initialization. Import order matters: the module caches
        // backend selection on first import.
        const { getActiveBackend } = await import('@sittir/rust')
        const backend = getActiveBackend()
        expect(backend.name).toBe('typescript')
        expect(backend.reason).toMatch(/user-forced|sittir_backend/i)
    })

    it('produces the same files as the native-backend run', async () => {
        expect.fail('pending T050a — sample corpus + baseline not yet captured')
    })
})
