/**
 * T052 — US1 hash-mismatch fallback: a tampered template-bundle
 * hash forces the silent-fallback path with a visible `reason`.
 *
 * Asserts:
 *   - intentionally-modified hash (on either side — bake-time Rust
 *     const or TS-side exported `TEMPLATE_BUNDLE_HASH`) causes
 *     `getActiveBackend()` to return `{ name: 'typescript',
 *     reason: ~/hash mismatch/, hashMatch: false }`.
 *   - no exception propagates to the consumer; the fallback is
 *     silent by default (visible only via `getActiveBackend()` or
 *     `SITTIR_BACKEND_DEBUG=1`).
 *
 * Currently SKIPPED — depends on the napi binding building and
 * the hash surfacing through `SittirEngine.templateBundleHash`.
 * See `us1-codemod.test.ts` for un-skip criteria.
 *
 * Tamper mechanism: the test module-mocks `@sittir/rust-native`'s
 * `SittirEngine.templateBundleHash` getter to return a known-wrong
 * value. Vitest's `vi.mock` handles this cleanly without touching
 * the .node artifact on disk.
 */

import { describe, it, expect, vi } from 'vitest'

describe.skip('US1 acceptance — hash-mismatch silent fallback (T052)', () => {
    it('falls through to typescript with reason containing "hash mismatch"', async () => {
        // Tamper: force `@sittir/rust-native`'s hash getter to return
        // a fake value. The backend-selection logic at module init
        // compares this against the TS-side `TEMPLATE_BUNDLE_HASH`
        // constant and should detect mismatch.
        vi.doMock('@sittir/rust-native', () => ({
            SittirEngine: class {
                get templateBundleHash() { return 'deadbeef-tampered-hash' }
            },
        }))
        vi.resetModules()
        const { getActiveBackend } = await import('@sittir/rust')
        const backend = getActiveBackend()
        expect(backend.name).toBe('typescript')
        expect(backend.hashMatch).toBe(false)
        expect(backend.reason ?? '').toMatch(/hash.mismatch/i)
    })
})
