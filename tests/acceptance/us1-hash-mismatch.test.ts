/**
 * T052 — US1 hash-mismatch fallback: a tampered template-bundle
 * hash forces the silent-fallback path with a visible `reason`.
 *
 * Asserts:
 *   - intentionally-modified hash causes `getActiveBackend()` to
 *     return `{ name: 'js', reason: ~/hash mismatch/i,
 *     hashMatch: false }`.
 *   - no exception propagates to the consumer; the fallback is
 *     silent by default (visible only via `getActiveBackend()` or
 *     `SITTIR_BACKEND_DEBUG=1`).
 *
 * Tamper mechanism: vitest's `vi.doMock` is module-graph based, so
 * it cannot intercept `createRequire(import.meta.url)` calls (which
 * `backend.ts` uses to load the napi `.node` shim — that's CJS and
 * lives outside the Vite module graph). It CAN intercept the ESM
 * import of `./hash.js` from `backend.ts`. We swap the TS-side
 * exported `TEMPLATE_BUNDLE_HASH` to a known-wrong value before the
 * package's backend module loads, exercising the same downstream
 * branch as a real template-bundle hash drift between TS-codegen
 * output and the baked-in Rust const.
 *
 * On platforms where `sittir-rust` doesn't load at all (no
 * `.node` artifact built), the fallback reason is "native binary not
 * available for this platform", not "hash mismatch" — the test
 * detects that case and soft-passes via the `hashMatch` undefined
 * branch.
 */

import { describe, it, expect, vi } from 'vitest';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve the REAL dist entry via Node's native ESM resolver (bypasses
// Vite's module graph entirely). This test specifically exercises the
// BUILT dist package's internal wiring (backend.js's relative
// `./hash.js` import, which the mock below targets), so it must
// resolve to the real dist entry, not the bare `@sittir/rust`
// specifier — the root vitest config aliases that to source for other
// root-level tests (tests/format-roundtrip/*) that don't care about
// dist-specific behavior, and source's `backend.ts` imports
// `./hash.ts` directly, which the mock below would never intercept,
// silently defeating this test. `import.meta.resolve` (not
// `createRequire(...).resolve`, which needs a CJS `"require"` export
// condition this ESM-only package doesn't declare) stays correct
// regardless of where dist actually resolves to, unlike a hardcoded
// relative path from this file to packages/rust/dist.
const RUST_DIST_ENTRY = fileURLToPath(import.meta.resolve('@sittir/rust'));
const HASH_MODULE = join(dirname(RUST_DIST_ENTRY), 'hash.js');

describe('US1 acceptance — hash-mismatch silent fallback (T052)', () => {
	it('falls through to js with reason containing "hash mismatch"', async () => {
		vi.resetModules();
		vi.doMock(HASH_MODULE, () => ({
			TEMPLATE_BUNDLE_HASH: 'deadbeef-tampered-hash-not-the-real-one'
		}));
		const { getActiveBackend } = await import(RUST_DIST_ENTRY);
		const backend = getActiveBackend();
		expect(backend.name).toBe('js');
		if (backend.hashMatch !== undefined) {
			expect(backend.hashMatch).toBe(false);
			expect(backend.reason ?? '').toMatch(/hash.mismatch/i);
		} else {
			// Soft pass — native binary didn't load, so the hash
			// compare branch was never reached. Still asserts a
			// reason exists so we know fallback was deliberate.
			expect(backend.reason).toBeDefined();
		}
		vi.doUnmock(HASH_MODULE);
		vi.resetModules();
	});
});
