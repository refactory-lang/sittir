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
 * - Native-mode boundary-import failure surfaces as a thrown error,
 *   never as a silent TS-fallback masquerading under `"backend": "native"`.
 *
 * Performance note: most tests share a single `collectBaseline('typescript')`
 * result hoisted in `beforeAll`. The determinism test keeps its own pair of
 * calls so it actually exercises two collection runs. Net cost across the
 * suite is exactly 3 collection runs (2 determinism + 1 shared), down from
 * 8 — corpus collection is non-trivial and the result is read-only here.
 */

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import * as common from '../validate/common.ts';
import * as baseline from '../scripts/collect-baseline.ts';

const grammarKeys = ['python', 'rust', 'typescript'] as const;

describe('collect-baseline', () => {
	let result: baseline.BackendBaseline;

	beforeAll(async () => {
		result = await baseline.collectBaseline('typescript');
	}, 600_000);

	afterEach(() => {
		vi.restoreAllMocks();
		vi.resetModules();
		delete process.env.SITTIR_BACKEND;
	});

	it('determinism — two runs produce byte-identical serialised output', async () => {
		const a = await baseline.collectBaseline('typescript');
		const b = await baseline.collectBaseline('typescript');
		const sa = baseline.serialiseBaseline(a);
		const sb = baseline.serialiseBaseline(b);
		// Surface mismatches as a small diff for pinpoint diagnosis.
		if (sa !== sb) {
			const aLines = sa.split('\n');
			const bLines = sb.split('\n');
			const max = Math.max(aLines.length, bLines.length);
			const diffs: string[] = [];
			for (let i = 0; i < max && diffs.length < 5; i++) {
				if (aLines[i] !== bLines[i]) {
					diffs.push(`line ${i + 1}:\n  a: ${aLines[i]}\n  b: ${bLines[i]}`);
				}
			}
			throw new Error(
				`serialised output differs across runs\n${diffs.join('\n')}`
			);
		}
		expect(sa).toBe(sb);
	}, 600_000);

	it('schema conformance — top-level, per-grammar, per-validator keys match contract', () => {
		// Round-trip through serialise/parse to verify what's persisted is what's checked.
		const parsed = JSON.parse(baseline.serialiseBaseline(result)) as Record<
			string,
			unknown
		>;

		expect(Object.keys(parsed).sort()).toEqual([
			'backend',
			'commit',
			'grammars',
			'totals'
		]);

		const grammars = parsed['grammars'] as Record<string, unknown>;
		expect(Object.keys(grammars)).toEqual([...grammarKeys]);

		for (const g of grammarKeys) {
			const entry = grammars[g] as Record<string, unknown>;
			expect(Object.keys(entry).sort()).toEqual([
				'parityFixtures',
				'validators'
			]);

			const validators = entry['validators'] as Record<string, unknown>;
			expect(Object.keys(validators)).toEqual([
				'coverage',
				'factoryRoundtrip',
				'from',
				'roundtrip'
			]);

			// Each validator entry has failingKinds AND formatDeferredKinds.
			// Roundtrip variants additionally have astMatchPass.
			for (const vname of [
				'coverage',
				'factoryRoundtrip',
				'from',
				'roundtrip'
			] as const) {
				const v = validators[vname] as Record<string, unknown>;
				const expected =
					vname === 'from' || vname === 'coverage'
						? ['failingKinds', 'formatDeferredKinds', 'pass', 'total']
						: [
								'astMatchPass',
								'failingKinds',
								'formatDeferredKinds',
								'pass',
								'total'
							];
				expect(Object.keys(v).sort()).toEqual(expected);
			}

			const fixtures = entry['parityFixtures'] as Record<string, unknown>;
			expect(Object.keys(fixtures).sort()).toEqual([
				'failingByKind',
				'formatDeferredByKind',
				'pass',
				'total'
			]);
		}
	});

	it('failingKinds and formatDeferredKinds arrays are sorted ascending', () => {
		for (const grammar of grammarKeys) {
			const validators = result.grammars[grammar].validators;
			for (const name of [
				'from',
				'coverage',
				'roundtrip',
				'factoryRoundtrip'
			] as const) {
				const fk = validators[name].failingKinds;
				const fdk = validators[name].formatDeferredKinds;
				expect(Array.isArray(fk)).toBe(true);
				expect(fk).toEqual([...fk].sort());
				expect(Array.isArray(fdk)).toBe(true);
				expect(fdk).toEqual([...fdk].sort());
			}
		}
	});

	it('failingByKind and formatDeferredByKind keys are sorted ascending', () => {
		for (const grammar of grammarKeys) {
			const fp = result.grammars[grammar].parityFixtures;
			for (const obj of [fp.failingByKind, fp.formatDeferredByKind]) {
				const keys = Object.keys(obj);
				expect(keys).toEqual([...keys].sort());
			}
		}
	});

	it('empty collections are explicit (failingKinds: [], failingByKind: {}, format-deferred too)', () => {
		// Walk every validator + parityFixtures bucket and check both the
		// failure-class fields are present even when empty. (Distinguishes
		// "no failures observed" from "this validator wasn't run". The
		// formatDeferredKinds / formatDeferredByKind fields should always
		// be empty at baseline since no triage has run yet.)
		for (const grammar of grammarKeys) {
			const validators = result.grammars[grammar].validators;
			for (const name of [
				'from',
				'coverage',
				'roundtrip',
				'factoryRoundtrip'
			] as const) {
				expect(Array.isArray(validators[name].failingKinds)).toBe(true);
				expect(Array.isArray(validators[name].formatDeferredKinds)).toBe(true);
				// At baseline, no triage has been performed.
				expect(validators[name].formatDeferredKinds).toEqual([]);
			}
			const fp = result.grammars[grammar].parityFixtures;
			for (const obj of [fp.failingByKind, fp.formatDeferredByKind]) {
				expect(typeof obj).toBe('object');
				expect(obj).not.toBeNull();
				expect(Array.isArray(obj)).toBe(false);
			}
			// formatDeferredByKind always empty at baseline.
			expect(Object.keys(fp.formatDeferredByKind)).toEqual([]);
		}
	});

	it('totals consistency — pass + fail === total', () => {
		expect(result.totals.pass + result.totals.fail).toBe(result.totals.total);
	});

	it('commit field is a 7-character hex string', () => {
		expect(result.commit).toMatch(/^[a-f0-9]{7}$/);
	});

	it('serialised output contains no timestamps (ISO-8601 or unix-ms magnitude)', () => {
		const text = baseline.serialiseBaseline(result);
		expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
		// 13-digit numbers (millisecond unix timestamps) — the JSON
		// shouldn't carry any. Allow up to 12 digits which can still
		// appear as count totals if the universe ever explodes
		// dramatically, but 13+ digits would only be a wall-clock value.
		expect(text).not.toMatch(/\b\d{13,}\b/);
	});

	it('native-mode boundary-import failure throws with grammar + path in message', async () => {
		// Tests the per-grammar boundary-load helper through its
		// injectable importFn, so we can deterministically force a
		// failure without patching the filesystem. The integration
		// with `collectBaseline()` (which calls this helper in native
		// mode) is correct by construction: any caller that uses the
		// default importer and gets a rejection here surfaces it.
		const badImport = () => Promise.reject(new Error('module not found'));
		await expect(
			baseline.loadBoundaryRender('rust', badImport)
		).rejects.toThrow(
			/failed to import native boundary for grammar 'rust'.*packages\/rust\/src\/boundary\.ts.*module not found/
		);
	});

	it("native baseline threads backend='native' through buildReadHandle", async () => {
		const seen = new Set<string | undefined>();
		const original = common.buildReadHandle;
		const spy = vi
			.spyOn(common, 'buildReadHandle')
			.mockImplementation((g, t, s, backend) => {
				seen.add(backend);
				return original(g, t, s, backend);
			});
		// Dispatch assertion only: whether collectBaseline("native") ultimately
		// succeeds or fails (e.g. due to pre-existing Task 4 node-id issues),
		// buildReadHandle must have been called with backend="native" as an
		// explicit argument. Before Task 3, the validators ran under the TS
		// engine with backend=undefined because withBackendEnv used process.env.
		await baseline.collectBaseline('native').catch(() => {});
		expect(seen).toEqual(new Set(['native']));
		spy.mockRestore();
	});

	it('parity render exceptions surface with fixture context', async () => {
		// Inject a boundary importer that returns a render function which always
		// throws. The importFn injection path bypasses the file:// URL that
		// vi.doMock cannot intercept, making this a pure unit test of the
		// exception-wrapping logic in collectParityFixtures.
		const throwingImportFn: baseline.BoundaryImporter = async () => ({
			render() {
				throw new Error('boom');
			}
		});
		await expect(
			baseline.collectParityFixtures('python', 'native', throwingImportFn)
		).rejects.toThrow(/\[python\]\[native\]\[render #0\].*boom/);
	});

	it('native baseline failures point at bundle drift instead of looking like parity noise', async () => {
		// Simulate the Task 3 scenario: native engine is unavailable for a grammar
		// (e.g. bundle drift caused a hash mismatch that prevented engine load).
		// Before Task 3: collectBaseline("native") silently succeeded — it fell
		// back to the TS engine and returned TS numbers labelled "native".
		// After Task 3: buildReadHandle throws explicitly; that error must
		// propagate rather than being rewritten into quiet parity numbers.
		vi.spyOn(common, 'buildReadHandle').mockImplementation((g) => {
			throw new Error(
				`SITTIR_BACKEND=native but no native engine is available for grammar '${g}'`
			);
		});
		await expect(baseline.collectBaseline('native')).rejects.toThrow(
			/no native engine is available for grammar/
		);
	}, 600_000);
});
