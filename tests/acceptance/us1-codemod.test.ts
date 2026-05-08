/**
 * T050 — US1 Acceptance Scenario 1: codemod author runs a large
 * codemod on the native backend with no behavior change.
 *
 * Runs the inline-attribute codemod (`codemod-inline.ts`) over the
 * 20-file `fixtures/codemod-sample/` corpus and asserts the output is
 * byte-identical to the JS-baseline captured by `capture-baseline.ts`
 * (one-shot, run with `SITTIR_BACKEND=js`). The codemod goes
 * through `@sittir/rust`'s exported `applyEdits` boundary shim, so on
 * a machine where the napi `.node` artifact has been built the active
 * backend is `native`; without it, the test still validates the JS
 * fallback against its own baseline (it'll just not exercise the
 * `name === 'native'` assertion).
 *
 * The native-backend assertion is conditional on the `.node` artifact
 * being available so this test is fully self-contained on a fresh
 * checkout: `cargo build` + `napi build` are required for the native
 * branch; without them the codemod still runs (fallback) but the
 * `name === 'native'` assertion is skipped.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCodemodOnDir } from './codemod-inline.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CORPUS_DIR = join(__dirname, 'fixtures', 'codemod-sample');
const BASELINE_DIR = join(CORPUS_DIR, 'baseline');

describe('US1 acceptance — native-backend codemod (T050)', () => {
	it('getActiveBackend reports a known backend with consistent hashMatch', async () => {
		const { getActiveBackend } = await import('@sittir/rust');
		const backend = getActiveBackend();
		expect(['native', 'js']).toContain(backend.name);
		if (backend.name === 'native') {
			expect(backend.hashMatch).toBe(true);
		}
	});

	it('produces files byte-identical to the JS-captured baseline', async () => {
		const results = await runCodemodOnDir(CORPUS_DIR);
		const baselineFiles = new Set(readdirSync(BASELINE_DIR).filter((n) => n.endsWith('.rs')));
		expect(results.length).toBeGreaterThanOrEqual(20);
		for (const r of results) {
			const name = basename(r.path);
			expect(baselineFiles.has(name)).toBe(true);
			const expected = readFileSync(join(BASELINE_DIR, name), 'utf-8');
			// Equality at byte level — JS baseline IS the contract.
			expect(r.output).toBe(expected);
		}
	});
});
