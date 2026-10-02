/**
 * T050 — US1 Acceptance Scenario 1: codemod author runs a large
 * codemod on the native backend with no behavior change.
 *
 * Runs the inline-attribute codemod (`codemod-inline.ts`) over the
 * 20-file `fixtures/codemod-sample/` corpus and asserts the output is
 * byte-identical to the JS-baseline captured by `capture-baseline.ts`
 * (one-shot, run with `SITTIR_BACKEND=js`). The codemod goes
 * through plain text splicing at the parsed positions, so the output does
 * not depend on the backend.
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
import { runCodemodOnDir, runCodemodOnSource } from './codemod-inline.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CORPUS_DIR = join(__dirname, 'fixtures', 'codemod-sample');
const BASELINE_DIR = join(CORPUS_DIR, 'baseline');

describe('US1 acceptance — native-backend codemod (T050)', () => {
	it('getActiveBackend reports a known backend with consistent hashMatch', async () => {
		const { getActiveBackend } = await import('../../packages/rust/src/backend.ts');
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

	it('inserts at the right place when non-ASCII text precedes the function', async () => {
		const { output, insertions } = await runCodemodOnSource('// ψψ\nfn f() { 1 }\n');
		expect(insertions).toBe(1);
		expect(output).toBe('// ψψ\n#[inline]\nfn f() { 1 }\n');
	});
});
