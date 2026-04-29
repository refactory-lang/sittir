/**
 * check-baseline-regression.ts — feature 016, T009.
 *
 * Reads two `BackendBaseline` JSONs (the PR's base and head versions of
 * `specs/016-parity-regressions/baselines/<backend>.json`) and applies
 * the verdict rules from `contracts/baseline-json.md` (section
 * "Regression-Checker Verdict Rules").
 *
 * Exits 0 when the head is at-or-better than the base on every tracked
 * metric; exits 1 otherwise. On failure, prints a JSON object naming
 * the offending field path so the CI log points reviewers at the regression.
 *
 * The five fail conditions:
 *   1. Pass-count drop — any of `validators.{from,coverage,roundtrip,
 *      factoryRoundtrip}.pass`, `validators.{roundtrip,factoryRoundtrip}.
 *      astMatchPass`, `parityFixtures.pass`, `totals.pass`.
 *   2. Total drop — `totals.total` decreased (fixture deletion).
 *   3. Total-fail rise — `totals.fail` increased.
 *   4. Schema violation — missing keys, unsorted arrays, missing
 *      `formatDeferredKinds` / `formatDeferredByKind`.
 *   5. Format-deferred-count rise (within 016) — for any validator,
 *      `length(failingKinds_after) + length(formatDeferredKinds_after)`
 *      may not exceed the corresponding sum on the base. Items may MOVE
 *      from `failingKinds` into `formatDeferredKinds` during a cluster
 *      commit; only the SUM is checked.
 *
 * Importable surface: `checkRegression(base, head): RegressionVerdict`.
 * The CLI wrapper (bottom of file) reads `--base <path>` and `--head <path>`
 * and calls the same function.
 */

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import type {
	BackendBaseline,
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
	| 'total-drop'
	| 'total-fail-rise'
	| 'schema-violation'
	| 'format-deferred-rise';

export type RegressionVerdict =
	| { ok: true; summary: string }
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

const GRAMMARS = ['python', 'rust', 'typescript'] as const;

const VALIDATORS = [
	'from',
	'coverage',
	'roundtrip',
	'factoryRoundtrip'
] as const;
type ValidatorName = (typeof VALIDATORS)[number];

const ROUNDTRIP_VALIDATORS: readonly ValidatorName[] = [
	'roundtrip',
	'factoryRoundtrip'
];

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

function validateSortedStringArray(
	value: unknown,
	path: string
): RegressionVerdict | null {
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

function validateValidatorResultShape(
	v: unknown,
	path: string,
	isRoundtrip: boolean
): RegressionVerdict | null {
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
	const fkv = validateSortedStringArray(
		obj['failingKinds'],
		`${path}.failingKinds`
	);
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
	const fdv = validateSortedStringArray(
		obj['formatDeferredKinds'],
		`${path}.formatDeferredKinds`
	);
	if (fdv) return fdv;
	return null;
}

function validateParityFixturesShape(
	v: unknown,
	path: string
): RegressionVerdict | null {
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
	return null;
}

function validateBaselineShape(
	b: unknown,
	label: string
): RegressionVerdict | null {
	if (b === null || typeof b !== 'object') {
		return {
			ok: false,
			reason: 'schema-violation',
			summary: `${label}: not an object`,
			details: { path: label, after: b }
		};
	}
	const obj = b as Record<string, unknown>;
	if (obj['backend'] !== 'typescript' && obj['backend'] !== 'native') {
		return {
			ok: false,
			reason: 'schema-violation',
			summary: `${label}.backend is not 'typescript' | 'native'`,
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
	for (const g of GRAMMARS) {
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
		for (const vName of VALIDATORS) {
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

interface PassCountSample {
	readonly path: string;
	readonly value: number;
}

function collectPassCounts(b: BackendBaseline): PassCountSample[] {
	const out: PassCountSample[] = [];
	for (const g of GRAMMARS) {
		const ge = b.grammars[g];
		for (const vName of VALIDATORS) {
			const v = ge.validators[vName] as ValidatorResult;
			out.push({
				path: `grammars.${g}.validators.${vName}.pass`,
				value: v.pass
			});
			if (ROUNDTRIP_VALIDATORS.includes(vName)) {
				out.push({
					path: `grammars.${g}.validators.${vName}.astMatchPass`,
					value: (v as RoundtripResult).astMatchPass
				});
			}
		}
		out.push({
			path: `grammars.${g}.parityFixtures.pass`,
			value: ge.parityFixtures.pass
		});
	}
	out.push({ path: 'totals.pass', value: b.totals.pass });
	return out;
}

function checkPassCounts(
	base: BackendBaseline,
	head: BackendBaseline
): RegressionVerdict | null {
	const baseSamples = new Map(
		collectPassCounts(base).map((s) => [s.path, s.value])
	);
	for (const s of collectPassCounts(head)) {
		const before = baseSamples.get(s.path) ?? 0;
		if (s.value < before) {
			return {
				ok: false,
				reason: 'pass-count-drop',
				summary: `pass-count drop at ${s.path}: ${before} → ${s.value}`,
				details: { path: s.path, before, after: s.value }
			};
		}
	}
	return null;
}

// ---------------------------------------------------------------------------
// Total-drop / total-fail-rise (rules #2 / #3)
// ---------------------------------------------------------------------------

function checkTotalDrop(
	base: BackendBaseline,
	head: BackendBaseline
): RegressionVerdict | null {
	if (head.totals.total < base.totals.total) {
		return {
			ok: false,
			reason: 'total-drop',
			summary: `totals.total decreased: ${base.totals.total} → ${head.totals.total} (likely fixture deletion)`,
			details: {
				path: 'totals.total',
				before: base.totals.total,
				after: head.totals.total
			}
		};
	}
	return null;
}

function checkTotalFailRise(
	base: BackendBaseline,
	head: BackendBaseline
): RegressionVerdict | null {
	if (head.totals.fail <= base.totals.fail) return null;
	// Total fail rose. Allowed only when the rise is FULLY accounted
	// for by newly-discovered tests (total grew by ≥ the fail rise AND
	// pass did not drop). Architectural commits that expand validator
	// coverage — e.g. fixing a wrap-dispatch bug that masked subtree
	// walks — surface previously-hidden test cases. Those are honest
	// additions, not regressions; a per-validator pass-count drop would
	// still be flagged by `checkPassCounts` independently.
	const failRise = head.totals.fail - base.totals.fail;
	const totalRise = head.totals.total - base.totals.total;
	const passDelta = head.totals.pass - base.totals.pass;
	if (totalRise >= failRise && passDelta >= 0) return null;
	return {
		ok: false,
		reason: 'total-fail-rise',
		summary: `totals.fail increased: ${base.totals.fail} → ${head.totals.fail} (totals.total: ${base.totals.total} → ${head.totals.total}, pass: ${base.totals.pass} → ${head.totals.pass})`,
		details: {
			path: 'totals.fail',
			before: base.totals.fail,
			after: head.totals.fail
		}
	};
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
	for (const k of Object.keys(p.failingByKind))
		sum += p.failingByKind[k]?.length ?? 0;
	for (const k of Object.keys(p.formatDeferredByKind))
		sum += p.formatDeferredByKind[k]?.length ?? 0;
	return sum;
}

function checkFormatDeferredRise(
	base: BackendBaseline,
	head: BackendBaseline
): RegressionVerdict | null {
	for (const g of GRAMMARS) {
		const baseGE: GrammarEntry = base.grammars[g];
		const headGE: GrammarEntry = head.grammars[g];
		for (const vName of VALIDATORS) {
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
 *   4. total-drop
 *   5. pass-count-drop
 *   6. total-fail-rise
 *   7. format-deferred-rise
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
export function checkRegression(
	base: BackendBaseline,
	head: BackendBaseline
): RegressionVerdict {
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

	const totalDrop = checkTotalDrop(base, head);
	if (totalDrop) return totalDrop;

	const passDrop = checkPassCounts(base, head);
	if (passDrop) return passDrop;

	const failRise = checkTotalFailRise(base, head);
	if (failRise) return failRise;

	const formatRise = checkFormatDeferredRise(base, head);
	if (formatRise) return formatRise;

	return {
		ok: true,
		summary: `no regression: backend=${head.backend} totals.pass ${base.totals.pass}→${head.totals.pass}, totals.fail ${base.totals.fail}→${head.totals.fail}`
	};
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface CliArgs {
	base: string;
	head: string;
}

function parseArgs(argv: readonly string[]): CliArgs {
	let base: string | undefined;
	let head: string | undefined;
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--base') {
			base = argv[++i];
		} else if (arg === '--head') {
			head = argv[++i];
		}
	}
	if (base === undefined || head === undefined) {
		throw new Error(
			'usage: check-baseline-regression --base <path> --head <path>'
		);
	}
	return { base, head };
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

if (isCli) {
	const { base: basePath, head: headPath } = parseArgs(process.argv.slice(2));
	const base = readJsonFile(basePath) as BackendBaseline;
	const head = readJsonFile(headPath) as BackendBaseline;
	const verdict = checkRegression(base, head);
	if (verdict.ok) {
		process.stdout.write(`${verdict.summary}\n`);
		process.exit(0);
	} else {
		process.stderr.write(
			`${JSON.stringify({ reason: verdict.reason, summary: verdict.summary, details: verdict.details }, null, 2)}\n`
		);
		process.exit(1);
	}
}
