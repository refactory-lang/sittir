/**
 * T050 — US1 Acceptance Scenario 1: codemod author runs a large
 * codemod on the native backend with no behavior change.
 *
 * Models an existing sittir codemod: loads a sample corpus, pattern-
 * matches, constructs edits via factories, writes modified files.
 * Asserts:
 *   - `getActiveBackend().name === 'native'` (when the runtime
 *     platform is in the prebuilt matrix per FR-017)
 *   - output files match a baseline captured with
 *     `SITTIR_BACKEND=typescript`
 *
 * Currently SKIPPED because MVP prerequisites aren't complete:
 *   - The napi binding crates (sittir-{lang}-napi) scaffold exists but
 *     `@napi-rs/cli` hasn't produced `.node` artifacts; loading them
 *     at runtime fails with ERR_MODULE_NOT_FOUND.
 *   - The sample corpus (50 files) + pre-recorded TS-baseline
 *     outputs haven't been committed — they land with T050a
 *     (fixture generation) before this test un-skips.
 *   - `getActiveBackend()` works end-to-end, but returns
 *     `{ name: 'typescript', reason: 'native-load-failure' }`
 *     silently until the .node artifacts land.
 *
 * Un-skip when:
 *   1. `cargo build -p sittir-{rust,typescript,python}-napi` produces
 *      `.node` files the runtime can load.
 *   2. `tests/acceptance/fixtures/codemod-sample/` exists with at
 *      least 50 files + a `baseline/` subdirectory of TS-baseline
 *      outputs.
 *   3. Platform matrix (macOS arm64 at MVP per FR-017 Phase 3 target)
 *      covers the CI runner.
 */

import { describe, it, expect } from 'vitest'

describe.skip('US1 acceptance — native-backend codemod (T050)', () => {
    it('getActiveBackend().name === "native" on supported platform', async () => {
        // Dynamic import — deferred until the describe body runs (i.e.
        // never, while `.skip`). Avoids a top-level static import
        // failing on a cold checkout where `@sittir/rust` isn't yet
        // listed as a root-level workspace dep for the acceptance
        // suite. Un-skip criteria include adding the workspace link.
        const { getActiveBackend } = await import('@sittir/rust')
        const backend = getActiveBackend()
        expect(backend.name).toBe('native')
        expect(backend.hashMatch).toBe(true)
    })

    it('produces files byte-identical to TS-baseline output', async () => {
        // Placeholder — enumerate sample corpus files, apply codemod
        // via the standard sittir API (findMatches + render + splice),
        // write to a temp dir, diff against baseline/.
        //
        // The exact codemod pattern is TBD — spec.md Acceptance
        // Scenario 1 calls for "an existing sittir codemod"; suggest
        // lifting the `add-#[inline]`-to-short-functions example from
        // the quickstart.md as the canonical scenario.
        expect.fail('pending T050a — sample corpus + baseline not yet captured')
    })
})
