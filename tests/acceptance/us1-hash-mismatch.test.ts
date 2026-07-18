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
 * Tamper mechanism: this exercises the BUILT dist package's internal
 * wiring (backend.js's relative `./hash.js` import), not source — so
 * the mock has to apply to the compiled dist file specifically, not
 * source's `./hash.ts` (which the bare `@sittir/rust` specifier would
 * resolve to via this repo's root vitest.config.ts alias, silently
 * defeating the test). Neither `vi.doMock` (module-graph based,
 * inconsistently loads dist paths under Vite's SSR module runner
 * across platforms) nor Vite-specific import tricks proved reliable
 * for loading an absolute dist path from inside a vitest test — see
 * git history on this file for the attempts. Instead, a plain Node.js
 * child process (fixtures/hash-mismatch-check-runner.mjs) — no
 * Vite/Vitest involved — uses Node's own module-customization-hooks
 * API (fixtures/hash-tamper-hook.mjs) to substitute the hash, imports
 * the real dist entry, and reports the result as JSON.
 *
 * On platforms where `sittir-rust` doesn't load at all (no
 * `.node` artifact built), the fallback reason is "native binary not
 * available for this platform", not "hash mismatch" — the test
 * detects that case and soft-passes via the `hashMatch` undefined
 * branch.
 */

import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RUST_DIST_ENTRY = fileURLToPath(import.meta.resolve('@sittir/rust'));
const RUNNER = fileURLToPath(new URL('./fixtures/hash-mismatch-check-runner.mjs', import.meta.url));

describe('US1 acceptance — hash-mismatch silent fallback (T052)', () => {
	it('falls through to js with reason containing "hash mismatch"', () => {
		const stdout = execFileSync(process.execPath, [RUNNER, RUST_DIST_ENTRY], { encoding: 'utf8' });
		const backend = JSON.parse(stdout);
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
	});
});
