/**
 * Tests for `check-baseline-regression.ts` — feature 016 / T009.
 *
 * The CI regression-checker compares two `BackendBaseline` JSONs (base
 * vs head) and exits non-zero on any of the verdict rules documented on
 * the module comment in `check-baseline-regression.ts` (kept current
 * there; not duplicated here).
 *
 * Tests feed two in-memory BackendBaseline objects to `checkRegression`
 * to keep the surface free of file I/O — the CLI wrapper handles
 * filesystem access.
 */

import { describe, it, expect, vi } from 'vitest';
import { stableGrammars } from '@sittir/codegen/grammars';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkRegression, run, type RegressionVerdict } from '../scripts/check-baseline-regression.ts';
import {
	computeTotals,
	type BackendBaseline,
	type GrammarEntry,
	type ParityFixtures,
	type RoundtripResult,
	type ValidatorResult
} from '../scripts/collect-baseline.ts';

// ---------------------------------------------------------------------------
// Helpers — build a minimal-but-schema-conformant BackendBaseline that
// individual tests can mutate via deep-clone + targeted edits.
// ---------------------------------------------------------------------------

function vr(
	pass: number,
	total: number,
	failingKinds: string[] = [],
	formatDeferredKinds: string[] = []
): ValidatorResult {
	return {
		pass,
		total,
		failingKinds: [...failingKinds].sort(),
		formatDeferredKinds: [...formatDeferredKinds].sort()
	};
}

function rt(
	pass: number,
	total: number,
	astMatchPass: number,
	failingKinds: string[] = [],
	formatDeferredKinds: string[] = []
): RoundtripResult {
	return {
		pass,
		total,
		astMatchPass,
		failingKinds: [...failingKinds].sort(),
		formatDeferredKinds: [...formatDeferredKinds].sort()
	};
}

function pf(pass: number, total: number): ParityFixtures {
	return { pass, total, failingByKind: {}, formatDeferredByKind: {} };
}

function entry(): GrammarEntry {
	// Validator keys MUST be sorted ascending to satisfy
	// validateBaselineShape — builtRenderParse, coverage, factoryStorage, from, roundtrip.
	return {
		validators: {
			builtRenderParse: rt(10, 10, 10),
			coverage: vr(10, 10),
			factoryStorage: rt(10, 10, 10),
			from: vr(10, 10),
			roundtrip: rt(10, 10, 10)
		},
		parityFixtures: pf(10, 10)
	};
}

function baseline(backend: 'native' = 'native'): BackendBaseline {
	return {
		backend,
		commit: '0000000',
		grammars: Object.fromEntries(stableGrammars().map((grammar) => [grammar, entry()])),
		totals: { pass: 50 * stableGrammars().length, fail: 0, total: 50 * stableGrammars().length }
	};
}

function clone<T>(v: T): T {
	return JSON.parse(JSON.stringify(v)) as T;
}

function expectFail(verdict: RegressionVerdict): asserts verdict is Extract<RegressionVerdict, { ok: false }> {
	if (verdict.ok) {
		throw new Error(`expected verdict.ok === false, got ok with summary=${verdict.summary}`);
	}
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('checkRegression', () => {
	it('identical baselines pass — exit 0, summary string set', () => {
		const base = baseline();
		const head = clone(base);
		const verdict = checkRegression(base, head);
		expect(verdict.ok).toBe(true);
		if (verdict.ok) {
			expect(typeof verdict.summary).toBe('string');
			// Sanity: summary mentions both backends or at least confirms parity.
			expect(verdict.summary.length).toBeGreaterThan(0);
		}
	});

	it('a validator new to head passes — the base baseline may predate it', () => {
		const head = baseline();
		const base = clone(head);
		for (const g of Object.values(base.grammars)) delete (g.validators as Partial<GrammarEntry['validators']>).builtRenderParse;
		expect(checkRegression(base, head).ok).toBe(true);
	});

	it('a validator the base records may not drop', () => {
		const base = baseline();
		const head = clone(base);
		head.grammars.rust!.validators.builtRenderParse = rt(9, 10, 9);
		const verdict = checkRegression(base, head);
		expectFail(verdict);
		expect(verdict.details.path).toBe('grammars.rust.validators.builtRenderParse.pass');
	});

	describe('declared counter change', () => {
		function shrunk(): { base: BackendBaseline; head: BackendBaseline } {
			const base = baseline();
			base.grammars.python!.validators.builtRenderParse = rt(8, 10, 8);
			base.totals = { pass: base.totals.pass - 2, fail: 2, total: base.totals.total };
			const head = clone(base);
			head.grammars.python!.validators.builtRenderParse = rt(8, 9, 8);
			head.totals = { pass: base.totals.pass, fail: 1, total: base.totals.total - 1 };
			return { base, head };
		}

		const declaration = (): BackendBaseline['baselineCounterChange'] => ({
			reason: 'population pinned',
			grammars: { python: { builtRenderParse: { from: { total: 10, pass: 8 }, to: { total: 9, pass: 8 } } } }
		});

		it('an inherited declaration whose from no longer equals the base fails', () => {
			const { base, head } = shrunk();
			head.baselineCounterChange = declaration();
			base.grammars.python!.validators.builtRenderParse = rt(9, 10, 9);
			head.grammars.python!.validators.builtRenderParse = rt(9, 9, 9);
			const verdict = checkRegression(base, head);
			expectFail(verdict);
			expect(verdict.details.path).toBe('grammars.python.validators.builtRenderParse.total');
		});

		it('a declaration whose to differs from the head fails', () => {
			const { base, head } = shrunk();
			head.baselineCounterChange = declaration();
			head.grammars.python!.validators.builtRenderParse = rt(8, 8, 8);
			head.totals = { pass: base.totals.pass, fail: 0, total: base.totals.total - 2 };
			expectFail(checkRegression(base, head));
		});

		it('an undeclared total drop fails', () => {
			const { base, head } = shrunk();
			expectFail(checkRegression(base, head));
		});

		it('a declared drop whose total falls no more than its fail count passes', () => {
			const { base, head } = shrunk();
			head.baselineCounterChange = declaration();
			expect(checkRegression(base, head).ok).toBe(true);
		});

		it('a declared drop where pass fell fails', () => {
			const { base, head } = shrunk();
			head.baselineCounterChange = declaration();
			head.grammars.python!.validators.builtRenderParse = rt(7, 9, 7);
			head.totals = { pass: base.totals.pass - 1, fail: 2, total: base.totals.total - 1 };
			expectFail(checkRegression(base, head));
		});

		it('a collected head takes its declaration from the committed record named by --declared', async () => {
			const { base, head } = shrunk();
			const declared = clone(head);
			declared.baselineCounterChange = declaration();
			const dir = mkdtempSync(join(tmpdir(), 'baseline-'));
			const write = (name: string, value: unknown) => {
				writeFileSync(join(dir, name), JSON.stringify(value));
				return join(dir, name);
			};
			const args = ['--base', write('base.json', base), '--head', write('head.json', head)];
			expect(await run(args)).toBe(1);
			expect(await run([...args, '--declared', write('declared.json', declared)])).toBe(0);
		});

		it('a drop in an undeclared validator fails', () => {
			const { base, head } = shrunk();
			head.baselineCounterChange = declaration();
			head.grammars.python!.validators.from = vr(9, 9);
			head.totals = { pass: base.totals.pass - 1, fail: 1, total: base.totals.total - 2 };
			const verdict = checkRegression(base, head);
			expectFail(verdict);
			expect(verdict.details.path).toBe('grammars.python.validators.from.total');
		});
	});

	it('head must record every validator', () => {
		const base = baseline();
		const head = clone(base);
		delete (head.grammars.rust!.validators as Partial<GrammarEntry['validators']>).builtRenderParse;
		expectFail(checkRegression(base, head));
	});

	it('a grammar new to head passes — the base baseline may predate it', () => {
		const head = baseline();
		const base = clone(head);
		delete (base.grammars as Record<string, GrammarEntry>).typescript;
		base.totals = { pass: 50 * (stableGrammars().length - 1), fail: 0, total: 50 * (stableGrammars().length - 1) };
		const verdict = checkRegression(base, head);
		expect(verdict.ok).toBe(true);
	});

	it('a stable grammar missing from head fails, naming it', () => {
		const base = baseline();
		const head = clone(base);
		delete (head.grammars as Record<string, GrammarEntry>).rust;
		const verdict = checkRegression(base, head);
		expectFail(verdict);
		expect(verdict.details.path).toBe('head.grammars.rust');
	});

	it('a baselined grammar missing from head fails as grammar-dropped, even when it is not stable', () => {
		const base = baseline();
		base.grammars = Object.fromEntries(
			Object.entries({ ...base.grammars, retired: entry() }).sort(([a], [b]) => a.localeCompare(b))
		) as typeof base.grammars;
		base.totals = { pass: base.totals.pass + 50, fail: 0, total: base.totals.total + 50 };
		const head = baseline();
		const verdict = checkRegression(base, head);
		expectFail(verdict);
		expect(verdict.reason).toBe('grammar-dropped');
		expect(verdict.summary).toContain('retired');
	});

	it('left-out rise detected — an uncompensated per-grammar sum rise names the grammar path', () => {
		const base = baseline();
		const head = clone(base);
		head.grammars.typescript!.parityFixtures.leftOutByKind = { for_statement: 1 };
		const verdict = checkRegression(base, head);
		expectFail(verdict);
		expect(verdict.reason).toBe('left-out-rise');
		expect(verdict.details.path).toBe('grammars.typescript.parityFixtures.leftOutByKind');
		expect(verdict.details.before).toBe(0);
		expect(verdict.details.after).toBe(1);
	});

	it('left-out rename passes — a kind split moving the same fixtures to a new key does not raise the sum', () => {
		const base = baseline();
		base.grammars.python!.parityFixtures.leftOutByKind = { assignment: 3 };
		const head = clone(base);
		head.grammars.python!.parityFixtures.leftOutByKind = { assignment_eq: 3 };
		const verdict = checkRegression(base, head);
		expect(verdict.ok).toBe(true);
	});

	it('left-out shrink passes — a kind the template reproduces again may leave the list', () => {
		const base = baseline();
		base.grammars.typescript!.parityFixtures.leftOutByKind = { for_statement: 2, program: 6 };
		const head = clone(base);
		head.grammars.typescript!.parityFixtures.leftOutByKind = { program: 5 };
		const verdict = checkRegression(base, head);
		expect(verdict.ok).toBe(true);
	});

	it('left-out keys must be sorted — schema violation otherwise', () => {
		const base = baseline();
		const head = clone(base);
		head.grammars.rust!.parityFixtures.leftOutByKind = { program: 1, block: 1 };
		const verdict = checkRegression(base, head);
		expectFail(verdict);
		expect(verdict.reason).toBe('schema-violation');
		expect(verdict.details.path).toBe('head.grammars.rust.parityFixtures.leftOutByKind');
	});

	it('pass-count drop detected — names the dropped path', () => {
		const base = baseline();
		const head = clone(base);
		head.grammars.rust!.validators.from.pass = 9;
		// Keep totals consistent so this is the ONLY drop we trigger.
		head.totals.pass = 149;
		head.totals.fail = 1;
		const verdict = checkRegression(base, head);
		expectFail(verdict);
		expect(verdict.reason).toBe('pass-count-drop');
		expect(verdict.details.path).toContain('grammars.rust.validators.from.pass');
		expect(verdict.details.before).toBe(10);
		expect(verdict.details.after).toBe(9);
	});

	describe('cases are compared kind by kind, and only a departed kind may lose them', () => {
		// typescript records kinds a, b and c; in the departing head, a has left.
		function inventoried(): BackendBaseline {
			const base = baseline();
			const ts = base.grammars.typescript!;
			ts.kinds = ['a', 'b', 'c'];
			ts.validators.coverage = { ...vr(3, 3), casesByKind: { a: 1, b: 1, c: 1 } };
			ts.validators.from = { ...vr(3, 3), casesByKind: { a: 1, b: 1, c: 1 } };
			ts.validators.factoryStorage = { ...rt(30, 30, 30), casesByKind: { a: 19, b: 6, c: 5 } };
			ts.validators.builtRenderParse = { ...rt(60, 60, 60), casesByKind: { a: 38, b: 12, c: 10 } };
			ts.parityFixtures = { ...pf(30, 30), casesByKind: { a: 19, b: 6, c: 5 } };
			base.totals = computeTotals(base.grammars);
			return base;
		}

		function departingA(base: BackendBaseline): BackendBaseline {
			const head = clone(base);
			const ts = head.grammars.typescript!;
			ts.kinds = ['b', 'c'];
			ts.validators.coverage = { ...vr(2, 2), casesByKind: { b: 1, c: 1 } };
			ts.validators.from = { ...vr(2, 2), casesByKind: { b: 1, c: 1 } };
			ts.validators.factoryStorage = { ...rt(11, 11, 11), casesByKind: { b: 6, c: 5 } };
			ts.validators.builtRenderParse = { ...rt(22, 22, 22), casesByKind: { b: 12, c: 10 } };
			ts.parityFixtures = { ...pf(11, 11), casesByKind: { b: 6, c: 5 } };
			head.totals = computeTotals(head.grammars);
			return head;
		}

		function retotal(head: BackendBaseline): BackendBaseline {
			head.totals = computeTotals(head.grammars);
			return head;
		}

		it('a departed kind may lose all its cases in each kind-tied row, and the verdict lists every one', () => {
			const base = inventoried();
			const verdict = checkRegression(base, departingA(base));
			expect(verdict.ok).toBe(true);
			if (!verdict.ok) return;
			expect(verdict.explained).toEqual([
				'grammars.typescript.validators.from 3/3 → 2/2: departed a (1 case)',
				'grammars.typescript.validators.coverage 3/3 → 2/2: departed a (1 case)',
				'grammars.typescript.validators.factoryStorage 30/30 → 11/11: departed a (19 cases)',
				'grammars.typescript.validators.builtRenderParse 60/60 → 22/22: departed a (38 cases)',
				'grammars.typescript.parityFixtures 30/30 → 11/11: departed a (19 cases)'
			]);
		});

		it('the CLI prints each departed kind\'s lost cases', async () => {
			const base = inventoried();
			const dir = mkdtempSync(join(tmpdir(), 'baseline-'));
			const write = (name: string, value: unknown) => {
				writeFileSync(join(dir, name), JSON.stringify(value));
				return join(dir, name);
			};
			const out: string[] = [];
			const spy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
				out.push(String(chunk));
				return true;
			});
			try {
				expect(await run(['--base', write('base.json', base), '--head', write('head.json', departingA(base))])).toBe(0);
			} finally {
				spy.mockRestore();
			}
			expect(out.join('')).toContain(
				'  explained: grammars.typescript.validators.factoryStorage 30/30 → 11/11: departed a (19 cases)\n'
			);
		});

		it('a surviving kind\'s loss fails though another surviving kind\'s gain hides it in the total', () => {
			const base = baseline();
			const ts = base.grammars.typescript!;
			ts.kinds = ['block', 'call', 'match_block'];
			ts.validators.factoryStorage = { ...rt(106, 106, 106), casesByKind: { block: 47, call: 40, match_block: 19 } };
			base.totals = computeTotals(base.grammars);
			const head = clone(base);
			head.grammars.typescript!.kinds = ['block', 'call'];
			head.grammars.typescript!.validators.factoryStorage = { ...rt(87, 87, 87), casesByKind: { block: 46, call: 41 } };
			const verdict = checkRegression(base, retotal(head));
			expectFail(verdict);
			expect(verdict.reason).toBe('pass-count-drop');
			expect(verdict.details.path).toBe('grammars.typescript.validators.factoryStorage.pass');
			expect(verdict.details.note).toBe('cases lost by kinds that did not depart: block (1 case); departed match_block (19 cases)');
		});

		it('a surviving kind\'s loss fails when the row\'s pass does not fall, unless the row is declared', () => {
			const base = inventoried();
			const head = clone(base);
			head.grammars.typescript!.validators.factoryStorage = { ...rt(30, 30, 30), casesByKind: { a: 19, b: 5, c: 6 } };
			const verdict = checkRegression(base, retotal(head));
			expectFail(verdict);
			expect(verdict.reason).toBe('case-loss');
			expect(verdict.details).toMatchObject({ path: 'grammars.typescript.validators.factoryStorage.casesByKind.b', before: 6, after: 5 });
			expect(verdict.details.note).toBe(
				'cases lost by kinds that did not depart: b (1 case) (factoryStorage has no baselineCounterChange declaration)'
			);
			head.baselineCounterChange = {
				reason: 'a case moves from b to c',
				grammars: {
					typescript: {
						factoryStorage: { from: { pass: 30, total: 30 }, to: { pass: 30, total: 30 }, cases: { b: { from: 6, to: 5 } } }
					}
				}
			};
			expect(checkRegression(base, head).ok).toBe(true);
		});

		it('a declaration that does not name the kind and its counts excuses no case loss', () => {
			const base = inventoried();
			const head = clone(base);
			head.grammars.typescript!.validators.factoryStorage = { ...rt(30, 30, 30), casesByKind: { a: 19, b: 5, c: 6 } };
			head.baselineCounterChange = {
				reason: 'a case moves from b to c',
				grammars: { typescript: { factoryStorage: { from: { pass: 30, total: 30 }, to: { pass: 30, total: 30 } } } }
			};
			const verdict = checkRegression(base, retotal(head));
			expectFail(verdict);
			expect(verdict.details.note).toBe(
				"cases lost by kinds that did not depart: b (1 case) (factoryStorage's declaration does not name b 6 → 5 in its cases)"
			);
		});

		it('a merged declaration does not excuse a later move of cases in the same row', () => {
			const base = inventoried();
			const merged = clone(base);
			merged.grammars.typescript!.validators.factoryStorage = { ...rt(30, 30, 30), casesByKind: { a: 19, b: 5, c: 6 } };
			merged.baselineCounterChange = {
				reason: 'a case moves from b to c',
				grammars: {
					typescript: {
						factoryStorage: { from: { pass: 30, total: 30 }, to: { pass: 30, total: 30 }, cases: { b: { from: 6, to: 5 } } }
					}
				}
			};
			expect(checkRegression(base, retotal(merged)).ok).toBe(true);
			const later = clone(merged);
			later.grammars.typescript!.validators.factoryStorage = { ...rt(30, 30, 30), casesByKind: { a: 19, b: 6, c: 5 } };
			const verdict = checkRegression(merged, retotal(later));
			expectFail(verdict);
			expect(verdict.reason).toBe('case-loss');
			expect(verdict.details.path).toBe('grammars.typescript.validators.factoryStorage.casesByKind.c');
		});

		it('with no kinds on either side, no kind departs and every loss is compared', () => {
			const base = inventoried();
			delete base.grammars.typescript!.kinds;
			const head = clone(base);
			head.grammars.typescript!.validators.factoryStorage = { ...rt(30, 30, 30), casesByKind: { a: 19, b: 5, c: 6 } };
			const verdict = checkRegression(base, retotal(head));
			expectFail(verdict);
			expect(verdict.reason).toBe('case-loss');
		});

		it.each([
			['kinds', (g: GrammarEntry) => delete g.kinds, 'head.grammars.typescript.kinds'],
			['a row\'s cases by kind', (g: GrammarEntry) => delete g.validators.factoryStorage.casesByKind, 'head.grammars.typescript.validators.factoryStorage.casesByKind'],
			['the parity fixtures\' cases by kind', (g: GrammarEntry) => delete g.parityFixtures.casesByKind, 'head.grammars.typescript.parityFixtures.casesByKind']
		] as const)('a head that omits %s the base records is rejected', (_, omit, path) => {
			const base = inventoried();
			const head = clone(base);
			omit(head.grammars.typescript!);
			const verdict = checkRegression(base, head);
			expectFail(verdict);
			expect(verdict.reason).toBe('schema-violation');
			expect(verdict.details.path).toBe(path);
		});

		it('a lost case under a key that is not one of the base\'s kinds fails', () => {
			const base = inventoried();
			base.grammars.typescript!.validators.from = { ...vr(4, 4), casesByKind: { a: 1, b: 1, c: 1, identifier: 1 } };
			base.totals = computeTotals(base.grammars);
			const head = clone(base);
			head.grammars.typescript!.validators.from = { ...vr(4, 4), casesByKind: { a: 1, b: 1, c: 2 } };
			const verdict = checkRegression(base, retotal(head));
			expectFail(verdict);
			expect(verdict.reason).toBe('case-loss');
			expect(verdict.details.path).toBe('grammars.typescript.validators.from.casesByKind.identifier');
		});

		it('a departed kind\'s lost cases are listed when a gain keeps the row\'s pass from falling', () => {
			const base = inventoried();
			const head = clone(base);
			head.grammars.typescript!.kinds = ['b', 'c', 'd'];
			head.grammars.typescript!.validators.factoryStorage = { ...rt(30, 30, 30), casesByKind: { b: 6, c: 5, d: 19 } };
			const verdict = checkRegression(base, retotal(head));
			expect(verdict.ok).toBe(true);
			if (verdict.ok) {
				expect(verdict.explained).toEqual(['grammars.typescript.validators.factoryStorage 30/30 → 30/30: departed a (19 cases)']);
			}
		});

		it('a drop beyond the departed kind\'s cases fails, naming the kind that lost the rest', () => {
			const base = inventoried();
			const head = departingA(base);
			head.grammars.typescript!.validators.factoryStorage = { ...rt(10, 10, 10), casesByKind: { b: 5, c: 5 } };
			const verdict = checkRegression(base, retotal(head));
			expectFail(verdict);
			expect(verdict.details.path).toBe('grammars.typescript.validators.factoryStorage.pass');
			expect(verdict.details.note).toBe('cases lost by kinds that did not depart: b (1 case); departed a (19 cases)');
		});

		it('the cases of a kind that appeared are not credited against a loss', () => {
			const base = inventoried();
			const head = departingA(base);
			head.grammars.typescript!.kinds = ['b', 'c', 'd'];
			head.grammars.typescript!.validators.factoryStorage = { ...rt(16, 16, 16), casesByKind: { b: 1, c: 5, d: 10 } };
			const verdict = checkRegression(base, retotal(head));
			expectFail(verdict);
			expect(verdict.details.path).toBe('grammars.typescript.validators.factoryStorage.pass');
			expect(verdict.details.note).toBe('cases lost by kinds that did not depart: b (5 cases); departed a (19 cases)');
		});

		it('a kind that still exists losing a case is no departure', () => {
			const base = inventoried();
			const head = clone(base);
			head.grammars.typescript!.validators.coverage = { ...vr(2, 2), casesByKind: { a: 1, b: 1 } };
			const verdict = checkRegression(base, retotal(head));
			expectFail(verdict);
			expect(verdict.details.path).toBe('grammars.typescript.validators.coverage.pass');
			expect(verdict.details.note).toBe('cases lost by kinds that did not depart: c (1 case)');
		});

		it('a drop alongside a new failure fails even with a kind gone', () => {
			const base = inventoried();
			base.grammars.rust!.validators.from = vr(9, 10, ['kind_x']);
			base.totals = computeTotals(base.grammars);
			const head = departingA(base);
			head.grammars.rust!.validators.from = vr(10, 10);
			head.grammars.typescript!.validators.coverage = { ...vr(1, 2), casesByKind: { b: 1, c: 1 } };
			const verdict = checkRegression(base, retotal(head));
			expect(head.totals.fail).toBe(base.totals.fail);
			expectFail(verdict);
			expect(verdict.details.path).toBe('grammars.typescript.validators.coverage.pass');
			expect(verdict.details.note).toBe('its fail count rose 0 → 1');
		});

		it('a roundtrip total counts corpus rows: a kind leaving does not explain its drop', () => {
			const base = inventoried();
			const head = departingA(base);
			head.grammars.typescript!.validators.roundtrip = rt(9, 9, 9);
			const verdict = checkRegression(base, retotal(head));
			expectFail(verdict);
			expect(verdict.details.path).toBe('grammars.typescript.validators.roundtrip.pass');
		});

		it('a base that never recorded its kinds explains no drop', () => {
			const base = inventoried();
			const head = departingA(base);
			delete base.grammars.typescript!.kinds;
			const verdict = checkRegression(base, head);
			expectFail(verdict);
			expect(verdict.details.path).toBe('grammars.typescript.validators.from.pass');
			expect(verdict.details.note).toBe('cases lost by kinds that did not depart: a (1 case)');
		});

		it('a row whose base records no cases by kind explains no drop', () => {
			const base = inventoried();
			const head = departingA(base);
			delete base.grammars.typescript!.validators.coverage.casesByKind;
			const verdict = checkRegression(base, head);
			expectFail(verdict);
			expect(verdict.details.path).toBe('grammars.typescript.validators.coverage.pass');
		});

		it('a parity fixture lost for a kind that still exists fails', () => {
			const base = inventoried();
			const head = clone(base);
			head.grammars.typescript!.parityFixtures = { ...pf(29, 29), casesByKind: { a: 19, b: 5, c: 5 } };
			const verdict = checkRegression(base, retotal(head));
			expectFail(verdict);
			expect(verdict.details.path).toBe('grammars.typescript.parityFixtures.pass');
		});
	});

	describe('a fail rise in any row', () => {
		function rising(): { base: BackendBaseline; head: BackendBaseline } {
			const base = baseline();
			const head = clone(base);
			head.grammars.typescript!.validators.roundtrip = rt(10, 11, 10);
			head.grammars.typescript!.validators.from = vr(12, 12);
			head.totals = computeTotals(head.grammars);
			return { base, head };
		}

		const declaring = (row: string, to: { pass: number; total: number }): BackendBaseline['baselineCounterChange'] => ({
			reason: 'a ruled grammar narrowing rejects one corpus entry',
			grammars: { typescript: { [row]: { from: { pass: 10, total: 10 }, to } } }
		});

		it('fails even when the totals grew by more than the rise', () => {
			const { base, head } = rising();
			expect(head.totals.total - base.totals.total).toBeGreaterThan(head.totals.fail - base.totals.fail);
			const verdict = checkRegression(base, head);
			expectFail(verdict);
			expect(verdict.reason).toBe('fail-rise');
			expect(verdict.details).toMatchObject({ path: 'grammars.typescript.validators.roundtrip.pass', before: 0, after: 1 });
		});

		it('passes when declared with from and to equal to the base and head counters', () => {
			const { base, head } = rising();
			head.baselineCounterChange = declaring('roundtrip', { pass: 10, total: 11 });
			expect(checkRegression(base, head).ok).toBe(true);
		});

		it('fails when the declared to is not the head', () => {
			const { base, head } = rising();
			head.baselineCounterChange = declaring('roundtrip', { pass: 10, total: 12 });
			const verdict = checkRegression(base, head);
			expectFail(verdict);
			expect(verdict.details.note).toBe('roundtrip head 10/11 is not the declared to 10/12');
		});

		it('a roundtrip validator\'s astMatchPass fail count is a row of its own, though totals.fail does not move', () => {
			const base = baseline();
			const head = clone(base);
			head.grammars.typescript!.validators.roundtrip = rt(11, 11, 10);
			head.totals = computeTotals(head.grammars);
			expect(head.totals.fail).toBe(base.totals.fail);
			const verdict = checkRegression(base, head);
			expectFail(verdict);
			expect(verdict.details.path).toBe('grammars.typescript.validators.roundtrip.astMatchPass');
			head.baselineCounterChange = declaring('roundtrip', { pass: 11, total: 11 });
			expect(checkRegression(base, head).ok).toBe(true);
		});

		it('the parity fixtures are a row, declared by that name', () => {
			const base = baseline();
			const head = clone(base);
			head.grammars.typescript!.parityFixtures = pf(10, 11);
			head.totals = computeTotals(head.grammars);
			const verdict = checkRegression(base, head);
			expectFail(verdict);
			expect(verdict.details.path).toBe('grammars.typescript.parityFixtures.pass');
			head.baselineCounterChange = declaring('parityFixtures', { pass: 10, total: 11 });
			expect(checkRegression(base, head).ok).toBe(true);
		});
	});

	it('totals.pass alone dropping (every per-validator/parityFixtures pass unchanged) — passes (rule 1 no longer double-checks the aggregate)', () => {
		const base = baseline();
		const head = clone(base);
		head.totals.pass = 149;
		head.totals.total = 149;
		const verdict = checkRegression(base, head);
		expect(verdict.ok).toBe(true);
	});

	it.each([
		['kinds', '40'],
		['kinds', ['b', 'a']],
		['kinds', ['a', 'a']],
		['kinds', [1]]
	] as const)('schema violation detected: %s of %j are rejected, on either side', (key, value) => {
		for (const side of ['base', 'head'] as const) {
			const base = baseline();
			const head = clone(base);
			const target = side === 'base' ? base : head;
			(target.grammars.python as unknown as Record<string, unknown>)[key] = value;
			const verdict = checkRegression(base, head);
			expectFail(verdict);
			expect(verdict.reason).toBe('schema-violation');
			expect(verdict.details.path).toBe(`${side}.grammars.python.${key}`);
		}
	});

	it.each([
		['that are not an object', [10]],
		['with unsorted kinds', { b: 5, a: 5 }],
		['listing a kind with no cases', { a: 10, b: 0 }],
		['summing to other than the total', { a: 9 }]
	] as const)('schema violation detected: cases by kind %s are rejected, for a validator and the parity fixtures, on either side', (_, value) => {
		for (const side of ['base', 'head'] as const) {
			for (const row of ['validators.coverage', 'parityFixtures'] as const) {
				const base = baseline();
				const head = clone(base);
				const grammar = (side === 'base' ? base : head).grammars.python!;
				const record = row === 'parityFixtures' ? grammar.parityFixtures : grammar.validators.coverage;
				(record as unknown as Record<string, unknown>)['casesByKind'] = value;
				const verdict = checkRegression(base, head);
				expectFail(verdict);
				expect(verdict.reason).toBe('schema-violation');
				expect(verdict.details.path).toBe(`${side}.grammars.python.${row}.casesByKind`);
			}
		}
	});

	it('a malformed kind list never excuses a pass drop', () => {
		const base = baseline();
		base.grammars.python!.kinds = ['a', 'b'];
		base.grammars.python!.validators.from = { ...vr(181, 181), casesByKind: { a: 100, b: 81 } };
		const head = clone(base);
		(head.grammars.python as unknown as Record<string, unknown>)['kinds'] = 'many';
		head.grammars.python!.validators.from = { ...vr(81, 81), casesByKind: { b: 81 } };
		const verdict = checkRegression(base, head);
		expectFail(verdict);
		expect(verdict.reason).toBe('schema-violation');
	});

	it('schema violation detected — unsorted failingKinds is rejected', () => {
		const base = baseline();
		const head = clone(base);
		// Force unsorted failingKinds (writer normally sorts; manual edit could break this).
		head.grammars.rust!.validators.from.failingKinds = ['zebra', 'alpha'];
		const verdict = checkRegression(base, head);
		expectFail(verdict);
		expect(verdict.reason).toBe('schema-violation');
		expect(verdict.details.path).toContain('grammars.rust.validators.from.failingKinds');
	});

	it('schema violation detected — missing formatDeferredKinds key is rejected', () => {
		const base = baseline();
		const head = clone(base) as BackendBaseline & {
			grammars: Record<string, GrammarEntry>;
		};
		// Cast to allow deletion of a required key — exercises the schema check.
		delete (head.grammars.rust!.validators.from as { formatDeferredKinds?: string[] }).formatDeferredKinds;
		const verdict = checkRegression(base, head);
		expectFail(verdict);
		expect(verdict.reason).toBe('schema-violation');
		expect(verdict.details.path).toContain('formatDeferredKinds');
	});

	it('format-deferred count grew alone — fail (rule #5)', () => {
		const base = baseline();
		const head = clone(base);
		// No move — failingKinds stayed []; formatDeferredKinds grew by 1 → SUM grew.
		head.grammars.rust!.validators.from.formatDeferredKinds = ['new_kind'];
		const verdict = checkRegression(base, head);
		expectFail(verdict);
		expect(verdict.reason).toBe('format-deferred-rise');
		expect(verdict.details.path).toContain('grammars.rust.validators.from');
	});

	it('format-deferred count grew but failing-kind shrank by same amount — pass (move semantics)', () => {
		const base = baseline();
		base.grammars.rust!.validators.from.failingKinds = ['kind_a'];
		const head = clone(base);
		// Move kind_a from failing → format-deferred (template-shape fix surfaced format-only diff).
		head.grammars.rust!.validators.from.failingKinds = [];
		head.grammars.rust!.validators.from.formatDeferredKinds = ['kind_a'];
		const verdict = checkRegression(base, head);
		expect(verdict.ok).toBe(true);
	});

	it('total fixture count decreased with a fail rise — fail (rule #2)', () => {
		const base = baseline();
		const head = clone(base);
		head.totals.total = 149;
		head.totals.pass = 148;
		head.totals.fail = 1;
		head.grammars.rust!.validators.from.total = 9;
		head.grammars.rust!.validators.from.pass = 8;
		head.grammars.rust!.validators.from.failingKinds = ['kind_a'];
		const verdict = checkRegression(base, head);
		expectFail(verdict);
		expect(verdict.reason).toBe('total-drop');
	});

	it('total fixture count decreased by removing an already-failing case — fail (deletion is not a rename, still needs a look)', () => {
		const base = baseline();
		base.totals = { pass: 149, fail: 1, total: 150 };
		base.grammars.rust!.validators.from.total = 10;
		base.grammars.rust!.validators.from.pass = 9;
		base.grammars.rust!.validators.from.failingKinds = ['kind_a'];
		const head = clone(base);
		head.totals = { pass: 149, fail: 0, total: 149 };
		head.grammars.rust!.validators.from.total = 9;
		head.grammars.rust!.validators.from.failingKinds = [];
		const verdict = checkRegression(base, head);
		expectFail(verdict);
		expect(verdict.reason).toBe('total-drop');
	});

	it('strictly improved counts pass — pass-count up, totals.fail down', () => {
		const base = baseline();
		// Encode 1 failure in base on rust.from so we can recover it in head.
		base.grammars.rust!.validators.from.pass = 9;
		base.grammars.rust!.validators.from.failingKinds = ['kind_x'];
		base.totals.pass = 149;
		base.totals.fail = 1;
		const head = clone(base);
		head.grammars.rust!.validators.from.pass = 10;
		head.grammars.rust!.validators.from.failingKinds = [];
		head.totals.pass = 150;
		head.totals.fail = 0;
		const verdict = checkRegression(base, head);
		expect(verdict.ok).toBe(true);
	});

	it('parity-fixtures count rise — fail (rule #5)', () => {
		const base = baseline();
		const head = clone(base);
		// Base has empty failingByKind; head adds two failure ids under one
		// kind. parityFixturesSum grows from 0 → 2 → format-deferred-rise.
		head.grammars.rust!.parityFixtures.failingByKind = {
			list_comprehension: ['render #1', 'render #2']
		};
		const verdict = checkRegression(base, head);
		expectFail(verdict);
		expect(verdict.reason).toBe('format-deferred-rise');
		expect(verdict.details.path).toContain('grammars.rust.parityFixtures');
	});

	it('parity-fixtures unsorted keys — fail (schema)', () => {
		const base = baseline();
		const head = clone(base);
		// Inject a keys-unsorted object on head. The schema check must
		// surface it BEFORE any count comparison runs.
		head.grammars.rust!.parityFixtures.failingByKind = {
			zebra: ['render #1'],
			alpha: ['render #2']
		};
		const verdict = checkRegression(base, head);
		expectFail(verdict);
		expect(verdict.reason).toBe('schema-violation');
		expect(verdict.details.path).toContain('parityFixtures.failingByKind');
	});

	it('grammars-keys unsorted — fail (schema)', () => {
		const base = baseline();
		const head = clone(base);
		// Rebuild grammars in declaration order (rust, python, typescript)
		// — keys are not ascending. Schema check must reject.
		const reorderedGrammars: Record<string, GrammarEntry> = {};
		reorderedGrammars['rust'] = head.grammars.rust!;
		reorderedGrammars['python'] = head.grammars.python!;
		reorderedGrammars['typescript'] = head.grammars.typescript!;
		(head as { grammars: unknown }).grammars = reorderedGrammars;
		const verdict = checkRegression(base, head);
		expectFail(verdict);
		expect(verdict.reason).toBe('schema-violation');
		expect(verdict.details.path).toBe('head.grammars');
	});

	it('backend mismatch — fail (schema)', () => {
		const base = { ...baseline(), backend: 'js' as unknown as BackendBaseline['backend'] };
		const head = clone(base);
		head.backend = 'native';
		const verdict = checkRegression(base, head);
		expectFail(verdict);
		expect(verdict.reason).toBe('schema-violation');
		expect(verdict.details.path).toBe('backend');
		expect(verdict.details.before).toBe('js');
		expect(verdict.details.after).toBe('native');
	});
});
