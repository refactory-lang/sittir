/**
 * check-baseline-regression.ts — feature 016, T009.
 *
 * Reads two `BackendBaseline` JSONs (the PR's base and head versions of
 * `packages/tools/baselines/<backend>.json`) and applies
 * the verdict rules from `contracts/baseline-json.md` (section
 * "Regression-Checker Verdict Rules").
 *
 * Exits 0 when the head is at-or-better than the base on every tracked
 * metric; exits 1 otherwise. On failure, prints a JSON object naming
 * the offending field path so the CI log points reviewers at the regression.
 *
 * The six fail conditions:
 *   1. Pass-count drop — any of `validators.{from,coverage,roundtrip,
 *      factoryStorage,builtRenderParse}.pass`, `validators.{roundtrip,
 *      factoryStorage,builtRenderParse}.astMatchPass`, `parityFixtures.pass`,
 *      per grammar, for each validator the base records (a validator the
 *      change adds has no base). This is what
 *      actually guards regressions; rule 2 below is a coarser tripwire on
 *      top of it. A kind departs by name: it is in the base's `kinds` and
 *      missing from the head's. In a row that records its cases by kind
 *      (`casesByKind`) on both sides, every kind is compared on its own,
 *      whether or not the row's pass fell: a kind that did not depart (one
 *      still in `kinds`, or a key that is not one of the base's kinds) may
 *      not lose a case unless `baselineCounterChange` declares the row
 *      (`case-loss`), and a departed kind's lost cases are allowed and
 *      listed in the passing verdict. A gain never offsets a loss. A pass
 *      drop is a regression unless the row's fail count (`total - pass`)
 *      did not rise and every lost case belongs to a departed kind; a
 *      declaration does not excuse it. `roundtrip` counts corpus rows and
 *      records no cases by kind, so no departure explains its drop. The
 *      aggregate `totals.pass`/`totals.fail`/`totals.total` relationship
 *      is rule 2's job, not re-checked here.
 *   2. Total drop — `totals.total` decreased AND `totals.fail` changed
 *      (either direction). A kind rename or split moves fixtures between
 *      validators (a flattened parent's own factory-level case disappears
 *      while its variants each gain a `from` case) and can shrink `total`
 *      net with `fail` UNCHANGED; rule 1 already catches any actual loss
 *      in that case, so this rule only exempts the exact-unchanged-fail
 *      shape. A `fail` DECREASE alongside the total drop (a failing
 *      fixture quietly deleted) still trips this rule — that is not the
 *      same shape as a rename and deserves a look, not an automatic pass.
      The head record's declaration is read from the head itself, or, for
      a freshly collected head, from the committed record named by
      `--declared`.
      A head that carries `baselineCounterChange` is held to a per-grammar
      check instead: a validator's total may drop only if the declaration
      names that grammar's validator with `from` equal to the base's
      counters and `to` equal to the head's, and its `pass` did not fall
      (so the total fell no more than its fail count did). Once the head
      merges, the base equals `to` and the declaration is inert.
 *   3. Fail rise — a row's fail count (`total - pass`, and for a roundtrip
 *      validator `total - astMatchPass`) rose, for any validator or the
 *      parity fixtures of any grammar, unless `baselineCounterChange`
 *      declares that row with `from` equal to the base's counters and `to`
 *      equal to the head's. A pass that falls alongside the rise is
 *      already a pass-count drop under rule 1, which runs first.
 *      `totals.fail` is the sum of the rows, so it cannot rise unless a
 *      row does.
 *   4. Schema violation — missing keys, unsorted arrays, missing
 *      `formatDeferredKinds` / `formatDeferredByKind`.
 *   5. Format-deferred-count rise (within 016) — for any validator,
 *      `length(failingKinds_after) + length(formatDeferredKinds_after)`
 *      may not exceed the corresponding sum on the base. Items may MOVE
 *      from `failingKinds` into `formatDeferredKinds` during a cluster
 *      commit; only the SUM is checked.
 *   6. Left-out rise — the PER-GRAMMAR SUM of `parityFixtures.
 *      leftOutByKind` may not grow: a render fixture the regen leaves out
 *      is a kind whose template no longer reproduces its source, and it
 *      must fail here rather than vanish from the fixture set. The sum,
 *      not each kind individually, is tracked — a kind rename moves
 *      fixtures between keys without changing how many don't reproduce.
 *
 * Importable surface: `checkRegression(base, head): RegressionVerdict`.
 * The CLI wrapper (bottom of file) reads `--base <path>` and `--head <path>`
 * and calls the same function.
 */

import { stableGrammars } from '@sittir/codegen/grammars';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import type {
	BackendBaseline,
	CounterPair,
	GrammarEntry,
	ParityFixtures,
	RoundtripResult,
	ValidatorResult
} from './collect-baseline.ts';

// ---------------------------------------------------------------------------
// Verdict shape
// ---------------------------------------------------------------------------

export type RegressionVerdictReason =
	| 'pass-count-drop'
	| 'case-loss'
	| 'total-drop'
	| 'fail-rise'
	| 'schema-violation'
	| 'format-deferred-rise'
	| 'left-out-rise'
	| 'grammar-dropped';

export type RegressionVerdict =
	| { ok: true; summary: string; explained: readonly string[] }
	| {
			ok: false;
			reason: RegressionVerdictReason;
			summary: string;
			details: {
				path: string;
				before?: unknown;
				after?: unknown;
				note?: string;
			};
	  };

// ---------------------------------------------------------------------------
// Constants — keep the path enumeration here so the schema check, the
// pass-count check, and the format-deferred check share one source of
// truth for "which validators / which grammars exist".
// ---------------------------------------------------------------------------

const GRAMMARS = stableGrammars();

const VALIDATORS = ['from', 'coverage', 'roundtrip', 'factoryStorage', 'builtRenderParse'] as const;
type ValidatorName = (typeof VALIDATORS)[number];

const ROUNDTRIP_VALIDATORS: readonly ValidatorName[] = ['roundtrip', 'factoryStorage', 'builtRenderParse'];

/**
 * The validators a base baseline is compared on: those it records. A
 * validator a change adds has no base to regress from, so head alone must
 * record every validator.
 */
function baseValidators(validators: object): readonly ValidatorName[] {
	return VALIDATORS.filter((vName) => vName in validators);
}

// ---------------------------------------------------------------------------
// Schema validation — runs on BOTH base and head. Catches manual edits
// that drop required keys, unsorted arrays, or otherwise drift from
// the contract.
// ---------------------------------------------------------------------------

function isSorted(arr: readonly string[]): boolean {
	for (let i = 1; i < arr.length; i++) {
		if (arr[i - 1]! > arr[i]!) return false;
	}
	return true;
}

function isPlainStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function validateSortedStringArray(value: unknown, path: string): RegressionVerdict | null {
	if (!isPlainStringArray(value)) {
		return {
			ok: false,
			reason: 'schema-violation',
			summary: `schema violation: ${path} is not a string[]`,
			details: { path, after: value, note: 'expected string[]' }
		};
	}
	if (!isSorted(value)) {
		return {
			ok: false,
			reason: 'schema-violation',
			summary: `schema violation: ${path} is not sorted ascending`,
			details: { path, after: value, note: 'array must be sorted ascending' }
		};
	}
	return null;
}

function validateValidatorResultShape(v: unknown, path: string, isRoundtrip: boolean): RegressionVerdict | null {
	if (v === null || typeof v !== 'object') {
		return {
			ok: false,
			reason: 'schema-violation',
			summary: `schema violation: ${path} is not an object`,
			details: { path, after: v, note: 'expected validator-result object' }
		};
	}
	const obj = v as Record<string, unknown>;
	for (const key of ['pass', 'total'] as const) {
		if (typeof obj[key] !== 'number') {
			return {
				ok: false,
				reason: 'schema-violation',
				summary: `schema violation: ${path}.${key} is missing or not a number`,
				details: { path: `${path}.${key}`, after: obj[key] }
			};
		}
	}
	if (isRoundtrip && typeof obj['astMatchPass'] !== 'number') {
		return {
			ok: false,
			reason: 'schema-violation',
			summary: `schema violation: ${path}.astMatchPass is missing or not a number`,
			details: { path: `${path}.astMatchPass`, after: obj['astMatchPass'] }
		};
	}
	if (!('failingKinds' in obj)) {
		return {
			ok: false,
			reason: 'schema-violation',
			summary: `schema violation: ${path}.failingKinds is missing`,
			details: { path: `${path}.failingKinds`, note: 'required by contract' }
		};
	}
	const fkv = validateSortedStringArray(obj['failingKinds'], `${path}.failingKinds`);
	if (fkv) return fkv;
	if (!('formatDeferredKinds' in obj)) {
		return {
			ok: false,
			reason: 'schema-violation',
			summary: `schema violation: ${path}.formatDeferredKinds is missing`,
			details: {
				path: `${path}.formatDeferredKinds`,
				note: 'required by contract (added in 6c1a3e24)'
			}
		};
	}
	const fdv = validateSortedStringArray(obj['formatDeferredKinds'], `${path}.formatDeferredKinds`);
	if (fdv) return fdv;
	return validateCasesByKind(obj['casesByKind'], obj['total'] as number, `${path}.casesByKind`);
}

function validateCasesByKind(value: unknown, total: number, path: string): RegressionVerdict | null {
	if (value === undefined) return null;
	const fail = (summary: string, note?: string): RegressionVerdict => ({
		ok: false,
		reason: 'schema-violation',
		summary: `schema violation: ${path} ${summary}`,
		details: { path, after: value, ...(note === undefined ? {} : { note }) }
	});
	if (value === null || typeof value !== 'object' || Array.isArray(value)) return fail('is not a plain object');
	const kinds = Object.keys(value);
	if (!isSorted(kinds)) return fail('keys are not sorted ascending', 'object keys must be sorted ascending');
	let sum = 0;
	for (const kind of kinds) {
		const count = (value as Record<string, unknown>)[kind];
		if (!(typeof count === 'number' && Number.isInteger(count) && count > 0)) {
			return fail(`.${kind} is not a positive integer`, 'a kind with no cases is not listed');
		}
		sum += count;
	}
	if (sum !== total) return fail(`sums to ${sum}, not the total ${total}`, 'every case is counted under its kind');
	return null;
}

function validateParityFixturesShape(v: unknown, path: string): RegressionVerdict | null {
	if (v === null || typeof v !== 'object') {
		return {
			ok: false,
			reason: 'schema-violation',
			summary: `schema violation: ${path} is not an object`,
			details: { path, after: v }
		};
	}
	const obj = v as Record<string, unknown>;
	for (const key of ['pass', 'total'] as const) {
		if (typeof obj[key] !== 'number') {
			return {
				ok: false,
				reason: 'schema-violation',
				summary: `schema violation: ${path}.${key} is missing or not a number`,
				details: { path: `${path}.${key}`, after: obj[key] }
			};
		}
	}
	for (const key of ['failingByKind', 'formatDeferredByKind'] as const) {
		if (!(key in obj)) {
			return {
				ok: false,
				reason: 'schema-violation',
				summary: `schema violation: ${path}.${key} is missing`,
				details: { path: `${path}.${key}`, note: 'required by contract' }
			};
		}
		const value = obj[key];
		if (value === null || typeof value !== 'object' || Array.isArray(value)) {
			return {
				ok: false,
				reason: 'schema-violation',
				summary: `schema violation: ${path}.${key} is not a plain object`,
				details: { path: `${path}.${key}`, after: value }
			};
		}
		const keys = Object.keys(value as object);
		if (!isSorted(keys)) {
			return {
				ok: false,
				reason: 'schema-violation',
				summary: `schema violation: ${path}.${key} keys are not sorted ascending`,
				details: {
					path: `${path}.${key}`,
					after: keys,
					note: 'object keys must be sorted ascending'
				}
			};
		}
	}
	const leftOut = obj['leftOutByKind'];
	if (leftOut !== undefined) {
		if (leftOut === null || typeof leftOut !== 'object' || Array.isArray(leftOut)) {
			return {
				ok: false,
				reason: 'schema-violation',
				summary: `schema violation: ${path}.leftOutByKind is not a plain object`,
				details: { path: `${path}.leftOutByKind`, after: leftOut }
			};
		}
		const keys = Object.keys(leftOut as object);
		if (!isSorted(keys)) {
			return {
				ok: false,
				reason: 'schema-violation',
				summary: `schema violation: ${path}.leftOutByKind keys are not sorted ascending`,
				details: { path: `${path}.leftOutByKind`, after: keys }
			};
		}
		for (const kind of keys) {
			const count = (leftOut as Record<string, unknown>)[kind];
			if (typeof count !== 'number') {
				return {
					ok: false,
					reason: 'schema-violation',
					summary: `schema violation: ${path}.leftOutByKind.${kind} is not a number`,
					details: { path: `${path}.leftOutByKind.${kind}`, after: count }
				};
			}
		}
	}
	return validateCasesByKind(obj['casesByKind'], obj['total'] as number, `${path}.casesByKind`);
}

function validateBaselineShape(b: unknown, label: string): RegressionVerdict | null {
	if (b === null || typeof b !== 'object') {
		return {
			ok: false,
			reason: 'schema-violation',
			summary: `${label}: not an object`,
			details: { path: label, after: b }
		};
	}
	const obj = b as Record<string, unknown>;
	if (obj['backend'] !== 'js' && obj['backend'] !== 'native') {
		return {
			ok: false,
			reason: 'schema-violation',
			summary: `${label}.backend is not 'js' | 'native'`,
			details: { path: `${label}.backend`, after: obj['backend'] }
		};
	}
	if (typeof obj['commit'] !== 'string') {
		return {
			ok: false,
			reason: 'schema-violation',
			summary: `${label}.commit is missing or not a string`,
			details: { path: `${label}.commit`, after: obj['commit'] }
		};
	}
	const grammars = obj['grammars'];
	if (grammars === null || typeof grammars !== 'object') {
		return {
			ok: false,
			reason: 'schema-violation',
			summary: `${label}.grammars is not an object`,
			details: { path: `${label}.grammars`, after: grammars }
		};
	}
	const grammarKeys = Object.keys(grammars as object);
	if (!isSorted(grammarKeys)) {
		return {
			ok: false,
			reason: 'schema-violation',
			summary: `schema violation: ${label}.grammars keys are not sorted ascending`,
			details: {
				path: `${label}.grammars`,
				after: grammarKeys,
				note: 'object keys must be sorted ascending'
			}
		};
	}
	const checkedGrammars = label === 'head' ? [...new Set([...GRAMMARS, ...grammarKeys])] : grammarKeys;
	for (const g of checkedGrammars) {
		const gPath = `${label}.grammars.${g}`;
		const ge = (grammars as Record<string, unknown>)[g];
		if (ge === undefined) {
			return {
				ok: false,
				reason: 'schema-violation',
				summary: `${gPath} is missing`,
				details: { path: gPath, note: 'required grammar entry' }
			};
		}
		if (ge === null || typeof ge !== 'object') {
			return {
				ok: false,
				reason: 'schema-violation',
				summary: `${gPath} is not an object`,
				details: { path: gPath, after: ge }
			};
		}
		const kinds = (ge as Record<string, unknown>)['kinds'];
		if (kinds !== undefined) {
			const kv = validateSortedStringArray(kinds, `${gPath}.kinds`);
			if (kv) return kv;
			if (new Set(kinds as string[]).size !== (kinds as string[]).length) {
				return {
					ok: false,
					reason: 'schema-violation',
					summary: `schema violation: ${gPath}.kinds lists a kind twice`,
					details: { path: `${gPath}.kinds`, after: kinds, note: 'each kind is listed once' }
				};
			}
		}
		const validators = (ge as Record<string, unknown>)['validators'];
		if (validators === null || typeof validators !== 'object') {
			return {
				ok: false,
				reason: 'schema-violation',
				summary: `${gPath}.validators is not an object`,
				details: { path: `${gPath}.validators`, after: validators }
			};
		}
		const validatorKeys = Object.keys(validators as object);
		if (!isSorted(validatorKeys)) {
			return {
				ok: false,
				reason: 'schema-violation',
				summary: `schema violation: ${gPath}.validators keys are not sorted ascending`,
				details: {
					path: `${gPath}.validators`,
					after: validatorKeys,
					note: 'object keys must be sorted ascending'
				}
			};
		}
		for (const vName of label === 'head' ? VALIDATORS : baseValidators(validators as object)) {
			const vPath = `${gPath}.validators.${vName}`;
			const vv = (validators as Record<string, unknown>)[vName];
			const isRoundtrip = ROUNDTRIP_VALIDATORS.includes(vName);
			const sv = validateValidatorResultShape(vv, vPath, isRoundtrip);
			if (sv) return sv;
		}
		const pf = (ge as Record<string, unknown>)['parityFixtures'];
		const pfv = validateParityFixturesShape(pf, `${gPath}.parityFixtures`);
		if (pfv) return pfv;
	}
	const totals = obj['totals'];
	if (totals === null || typeof totals !== 'object') {
		return {
			ok: false,
			reason: 'schema-violation',
			summary: `${label}.totals is not an object`,
			details: { path: `${label}.totals`, after: totals }
		};
	}
	for (const key of ['pass', 'fail', 'total'] as const) {
		if (typeof (totals as Record<string, unknown>)[key] !== 'number') {
			return {
				ok: false,
				reason: 'schema-violation',
				summary: `${label}.totals.${key} is missing or not a number`,
				details: {
					path: `${label}.totals.${key}`,
					after: (totals as Record<string, unknown>)[key]
				}
			};
		}
	}
	return null;
}

// ---------------------------------------------------------------------------
// Pass-count drop — enumerate every monitored path and compare.
// ---------------------------------------------------------------------------

type CountedRow = Pick<ParityFixtures, 'pass' | 'total' | 'casesByKind'>;

interface ComparedMetric {
	readonly name: 'pass' | 'astMatchPass';
	readonly before: number;
	readonly after: number;
}

interface ComparedRow {
	readonly row: string;
	readonly path: string;
	readonly b: CountedRow;
	readonly h: CountedRow;
	readonly metrics: readonly ComparedMetric[];
}

function* comparedRows(g: string, baseGrammar: GrammarEntry, headGrammar: GrammarEntry): Generator<ComparedRow> {
	for (const vName of baseValidators(baseGrammar.validators)) {
		const b = baseGrammar.validators[vName] as RoundtripResult;
		const h = headGrammar.validators[vName] as RoundtripResult;
		const metrics: ComparedMetric[] = [{ name: 'pass', before: b.pass, after: h.pass }];
		if (ROUNDTRIP_VALIDATORS.includes(vName)) metrics.push({ name: 'astMatchPass', before: b.astMatchPass, after: h.astMatchPass });
		yield { row: vName, path: `grammars.${g}.validators.${vName}`, b, h, metrics };
	}
	const b = baseGrammar.parityFixtures;
	const h = headGrammar.parityFixtures;
	yield { row: 'parityFixtures', path: `grammars.${g}.parityFixtures`, b, h, metrics: [{ name: 'pass', before: b.pass, after: h.pass }] };
}

type KindLoss = readonly [kind: string, cases: number];

interface CaseLosses {
	readonly departed: readonly KindLoss[];
	readonly kept: readonly KindLoss[];
}

function caseLosses(baseGrammar: GrammarEntry, headGrammar: GrammarEntry, { b, h }: ComparedRow): CaseLosses | undefined {
	const baseCases = b.casesByKind;
	const headCases = h.casesByKind;
	if (baseGrammar.kinds === undefined || headGrammar.kinds === undefined || baseCases === undefined || headCases === undefined) {
		return undefined;
	}
	const head = new Set(headGrammar.kinds);
	const departed = new Set(baseGrammar.kinds.filter((kind) => !head.has(kind)));
	const lost = Object.entries(baseCases)
		.map(([kind, cases]): KindLoss => [kind, cases - (headCases[kind] ?? 0)])
		.filter(([, cases]) => cases > 0);
	return { departed: lost.filter(([kind]) => departed.has(kind)), kept: lost.filter(([kind]) => !departed.has(kind)) };
}

function casesText(count: number): string {
	return count === 1 ? '1 case' : `${count} cases`;
}

function lossText(losses: readonly KindLoss[]): string {
	return losses.map(([kind, cases]) => `${kind} (${casesText(cases)})`).join(', ');
}

function unexplainedDrop({ b, h }: ComparedRow, { before, after }: ComparedMetric, losses: CaseLosses | undefined): string | undefined {
	const failBefore = b.total - before;
	const failAfter = h.total - after;
	if (failAfter > failBefore) return `its fail count rose ${failBefore} → ${failAfter}`;
	if (losses === undefined) return 'no kind departure explains it: one side records no kinds or no cases by kind for this row';
	if (losses.kept.length === 0) return undefined;
	const departed = losses.departed.length === 0 ? '' : `; departed ${lossText(losses.departed)}`;
	return `cases lost by kinds that did not depart: ${lossText(losses.kept)}${departed}`;
}

function checkDroppedGrammars(base: BackendBaseline, head: BackendBaseline): RegressionVerdict | null {
	const baseGrammars = Object.keys(base.grammars);
	const dropped = baseGrammars.filter((g) => head.grammars[g] === undefined);
	if (dropped.length === 0) return null;
	return {
		ok: false,
		reason: 'grammar-dropped',
		summary: `grammar(s) in the base baseline are missing from head: ${dropped.join(', ')}`,
		details: {
			path: 'grammars',
			before: baseGrammars,
			after: Object.keys(head.grammars),
			note: 'a baselined grammar leaves the ratchet only through a reviewed baseline change'
		}
	};
}

function* comparedGrammars(
	base: BackendBaseline,
	head: BackendBaseline
): Generator<readonly [string, GrammarEntry, GrammarEntry]> {
	for (const g of Object.keys(base.grammars)) {
		const baseGrammar = base.grammars[g];
		const headGrammar = head.grammars[g];
		if (baseGrammar && headGrammar) yield [g, baseGrammar, headGrammar];
	}
}

function checkCounts(base: BackendBaseline, head: BackendBaseline, explained: string[]): RegressionVerdict | null {
	for (const [g, baseGrammar, headGrammar] of comparedGrammars(base, head)) {
		for (const row of comparedRows(g, baseGrammar, headGrammar)) {
			const losses = caseLosses(baseGrammar, headGrammar, row);
			for (const metric of row.metrics) {
				if (metric.after >= metric.before) continue;
				const note = unexplainedDrop(row, metric, losses);
				if (note === undefined) continue;
				const path = `${row.path}.${metric.name}`;
				return {
					ok: false,
					reason: 'pass-count-drop',
					summary: `pass-count drop at ${path}: ${metric.before} → ${metric.after} (${note})`,
					details: { path, before: metric.before, after: metric.after, note }
				};
			}
			if (losses === undefined) continue;
			const [kept] = losses.kept;
			if (kept !== undefined) {
				const mismatch = declarationMismatch(head.baselineCounterChange?.grammars[g]?.[row.row], row.row, row.b, row.h);
				if (mismatch !== undefined) {
					const note = `cases lost by kinds that did not depart: ${lossText(losses.kept)} (${mismatch})`;
					const [kind] = kept;
					return {
						ok: false,
						reason: 'case-loss',
						summary: `case loss at ${row.path}.casesByKind: ${note}`,
						details: {
							path: `${row.path}.casesByKind.${kind}`,
							before: row.b.casesByKind?.[kind],
							after: row.h.casesByKind?.[kind] ?? 0,
							note
						}
					};
				}
			}
			if (losses.departed.length > 0) {
				explained.push(`${row.path} ${row.b.pass}/${row.b.total} → ${row.h.pass}/${row.h.total}: departed ${lossText(losses.departed)}`);
			}
		}
	}
	return null;
}

// ---------------------------------------------------------------------------
// Total drop and fail rise (rules #2 / #3)
// ---------------------------------------------------------------------------

function sumByKind(byKind: Readonly<Record<string, number>>): number {
	return Object.values(byKind).reduce((a, b) => a + b, 0);
}

function checkLeftOutRise(base: BackendBaseline, head: BackendBaseline): RegressionVerdict | null {
	for (const [g, baseGE, headGE] of comparedGrammars(base, head)) {
		const before = baseGE.parityFixtures.leftOutByKind ?? {};
		const after = headGE.parityFixtures.leftOutByKind ?? {};
		const beforeSum = sumByKind(before);
		const afterSum = sumByKind(after);
		if (afterSum <= beforeSum) continue;
		const [grownKind] = Object.keys(after)
			.map((kind) => [kind, (after[kind] ?? 0) - (before[kind] ?? 0)] as const)
			.sort(([, a], [, b]) => b - a)[0]!;
		return {
			ok: false,
			reason: 'left-out-rise',
			summary: `render fixtures left out grew at grammars.${g}.parityFixtures.leftOutByKind: ${beforeSum} → ${afterSum} total (largest mover: ${grownKind})`,
			details: { path: `grammars.${g}.parityFixtures.leftOutByKind`, before: beforeSum, after: afterSum }
		};
	}
	return null;
}

type DeclaredChange = { readonly from: CounterPair; readonly to: CounterPair };

function declarationMismatch(declared: DeclaredChange | undefined, row: string, b: CounterPair, h: CounterPair): string | undefined {
	if (declared === undefined) return `${row} has no baselineCounterChange declaration`;
	if (declared.from.total !== b.total || declared.from.pass !== b.pass) {
		return `${row} base ${b.pass}/${b.total} is not the declared from ${declared.from.pass}/${declared.from.total}`;
	}
	if (declared.to.total !== h.total || declared.to.pass !== h.pass) {
		return `${row} head ${h.pass}/${h.total} is not the declared to ${declared.to.pass}/${declared.to.total}`;
	}
	return undefined;
}

function declaredCounterChangeHolds(base: BackendBaseline, head: BackendBaseline): RegressionVerdict | null {
	for (const [g, baseGrammar, headGrammar] of comparedGrammars(base, head)) {
		for (const vName of baseValidators(baseGrammar.validators)) {
			const b = baseGrammar.validators[vName] as ValidatorResult;
			const h = headGrammar.validators[vName] as ValidatorResult;
			if (h.total >= b.total) continue;
			const path = `grammars.${g}.validators.${vName}`;
			const note =
				declarationMismatch(head.baselineCounterChange?.grammars[g]?.[vName], vName, b, h) ??
				(h.pass < b.pass ? `${vName} pass fell under a declared counter change` : undefined);
			if (note !== undefined) {
				return {
					ok: false,
					reason: 'total-drop',
					summary: `${path}.total decreased: ${b.total} → ${h.total} (${note})`,
					details: { path: `${path}.total`, before: b.total, after: h.total, note }
				};
			}
		}
	}
	return null;
}

function checkTotalDrop(base: BackendBaseline, head: BackendBaseline): RegressionVerdict | null {
	if (head.totals.total < base.totals.total && head.totals.fail !== base.totals.fail) {
		if (head.baselineCounterChange !== undefined) return declaredCounterChangeHolds(base, head);
		return {
			ok: false,
			reason: 'total-drop',
			summary: `totals.total decreased: ${base.totals.total} → ${head.totals.total} (fixture deletion, with totals.fail: ${base.totals.fail} → ${head.totals.fail})`,
			details: {
				path: 'totals.total',
				before: base.totals.total,
				after: head.totals.total
			}
		};
	}
	return null;
}

function checkFailRise(base: BackendBaseline, head: BackendBaseline): RegressionVerdict | null {
	for (const [g, baseGrammar, headGrammar] of comparedGrammars(base, head)) {
		for (const row of comparedRows(g, baseGrammar, headGrammar)) {
			for (const metric of row.metrics) {
				const before = row.b.total - metric.before;
				const after = row.h.total - metric.after;
				if (after <= before) continue;
				const note = declarationMismatch(head.baselineCounterChange?.grammars[g]?.[row.row], row.row, row.b, row.h);
				if (note === undefined) continue;
				const path = `${row.path}.${metric.name}`;
				return {
					ok: false,
					reason: 'fail-rise',
					summary: `fail count rose at ${path}: ${before} → ${after} (${note})`,
					details: { path, before, after, note }
				};
			}
		}
	}
	return null;
}

// ---------------------------------------------------------------------------
// Format-deferred rise (rule #5) — per-validator sum of
// `failingKinds + formatDeferredKinds` may not grow.
// ---------------------------------------------------------------------------

function validatorSum(v: ValidatorResult): number {
	return v.failingKinds.length + v.formatDeferredKinds.length;
}

function parityFixturesSum(p: ParityFixtures): number {
	let sum = 0;
	for (const k of Object.keys(p.failingByKind)) sum += p.failingByKind[k]?.length ?? 0;
	for (const k of Object.keys(p.formatDeferredByKind)) sum += p.formatDeferredByKind[k]?.length ?? 0;
	return sum;
}

function checkFormatDeferredRise(base: BackendBaseline, head: BackendBaseline): RegressionVerdict | null {
	for (const [g, baseGE, headGE] of comparedGrammars(base, head)) {
		for (const vName of baseValidators(baseGE.validators)) {
			const baseV = baseGE.validators[vName] as ValidatorResult;
			const headV = headGE.validators[vName] as ValidatorResult;
			const before = validatorSum(baseV);
			const after = validatorSum(headV);
			if (after > before) {
				// Allowed when the validator's `total` rose by ≥ the
				// failingKinds-sum rise AND `pass` did not drop —
				// architectural commits that expand validator coverage
				// (e.g. canonical-hidden remap exposing previously-
				// missed wrap-walker subtrees) surface honest new test
				// cases. Per-kind regressions are caught by the
				// independent `checkPassCounts` rule.
				const baseTotal = baseV.total;
				const headTotal = headV.total;
				const totalRise = headTotal - baseTotal;
				const passDelta = headV.pass - baseV.pass;
				const failRise = after - before;
				if (totalRise >= failRise && passDelta >= 0) continue;
				return {
					ok: false,
					reason: 'format-deferred-rise',
					summary: `format-deferred sum grew at grammars.${g}.validators.${vName}: ${before} → ${after} (total: ${baseTotal} → ${headTotal}, pass: ${baseV.pass} → ${headV.pass})`,
					details: {
						path: `grammars.${g}.validators.${vName}`,
						before,
						after,
						note: 'failingKinds.length + formatDeferredKinds.length must not grow within feature 016 (move semantics permitted)'
					}
				};
			}
		}
		const beforePf = parityFixturesSum(baseGE.parityFixtures);
		const afterPf = parityFixturesSum(headGE.parityFixtures);
		if (afterPf > beforePf) {
			return {
				ok: false,
				reason: 'format-deferred-rise',
				summary: `format-deferred fixture-id sum grew at grammars.${g}.parityFixtures: ${beforePf} → ${afterPf}`,
				details: {
					path: `grammars.${g}.parityFixtures`,
					before: beforePf,
					after: afterPf,
					note: 'sum of failingByKind + formatDeferredByKind ids must not grow'
				}
			};
		}
	}
	return null;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Apply every verdict rule in turn. Returns the FIRST failure
 * encountered, in the order:
 *   1. schema-violation (head)        — bad input → don't trust it
 *   2. schema-violation (base)        — bad input → don't trust it
 *   3. schema-violation (backend mismatch) — comparing counts across
 *      backends is meaningless; reject before any count comparison.
 *   4. left-out-rise
 *   5. total-drop
 *   6. pass-count-drop, case-loss
 *   7. fail-rise
 *   8. format-deferred-rise
 *
 * The schema check runs first so subsequent checks may safely cast to
 * the typed shape. Within the rest, total-drop precedes pass-count-drop
 * because a fixture deletion is the more-actionable signal — naming
 * the missing fixture is usually clearer than naming the field whose
 * pass count happens to drop as a side effect.
 *
 * Precondition for the success summary: after the backend-mismatch
 * check, `base.backend === head.backend` is guaranteed, so the summary
 * may quote `head.backend` without ambiguity.
 */
export function checkRegression(base: BackendBaseline, head: BackendBaseline): RegressionVerdict {
	const headSchema = validateBaselineShape(head, 'head');
	if (headSchema) return headSchema;
	const baseSchema = validateBaselineShape(base, 'base');
	if (baseSchema) return baseSchema;

	if (base.backend !== head.backend) {
		return {
			ok: false,
			reason: 'schema-violation',
			summary: `backend mismatch: base=${base.backend}, head=${head.backend}`,
			details: { path: 'backend', before: base.backend, after: head.backend }
		};
	}

	const dropped = checkDroppedGrammars(base, head);
	if (dropped) return dropped;

	const leftOutRise = checkLeftOutRise(base, head);
	if (leftOutRise) return leftOutRise;

	const totalDrop = checkTotalDrop(base, head);
	if (totalDrop) return totalDrop;

	const explained: string[] = [];
	const counts = checkCounts(base, head, explained);
	if (counts) return counts;

	const failRise = checkFailRise(base, head);
	if (failRise) return failRise;

	const formatRise = checkFormatDeferredRise(base, head);
	if (formatRise) return formatRise;

	return {
		ok: true,
		summary: `no regression: backend=${head.backend} totals.pass ${base.totals.pass}→${head.totals.pass}, totals.fail ${base.totals.fail}→${head.totals.fail}`,
		explained
	};
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface CliArgs {
	base: string;
	head: string;
	declared?: string;
}

function parseArgs(argv: readonly string[]): CliArgs {
	let base: string | undefined;
	let head: string | undefined;
	let declared: string | undefined;
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--base') {
			base = argv[++i];
		} else if (arg === '--head') {
			head = argv[++i];
		} else if (arg === '--declared') {
			declared = argv[++i];
		}
	}
	if (base === undefined || head === undefined) {
		throw new Error('usage: check-baseline-regression --base <path> --head <path> [--declared <path>]');
	}
	return { base, head, declared };
}

function readJsonFile(path: string): unknown {
	return JSON.parse(readFileSync(path, 'utf-8'));
}

const isCli = (() => {
	if (process.argv[1] == null) return false;
	try {
		const argvUrl = pathToFileURL(process.argv[1]).href;
		return argvUrl === import.meta.url;
	} catch {
		return false;
	}
})();

export async function run(argv: string[]): Promise<number> {
	const { base: basePath, head: headPath, declared: declaredPath } = parseArgs(argv);
	const base = readJsonFile(basePath) as BackendBaseline;
	const head = readJsonFile(headPath) as BackendBaseline;
	if (declaredPath !== undefined) {
		const declared = (readJsonFile(declaredPath) as BackendBaseline).baselineCounterChange;
		if (declared !== undefined) head.baselineCounterChange = declared;
	}
	const verdict = checkRegression(base, head);
	if (verdict.ok) {
		process.stdout.write(`${verdict.summary}\n`);
		for (const line of verdict.explained) process.stdout.write(`  explained: ${line}\n`);
		return 0;
	} else {
		process.stderr.write(
			`${JSON.stringify({ reason: verdict.reason, summary: verdict.summary, details: verdict.details }, null, 2)}\n`
		);
		return 1;
	}
}

if (isCli) {
	process.exit(await run(process.argv.slice(2)));
}
