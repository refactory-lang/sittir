import { stableGrammars } from '@sittir/codegen/grammars';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { kindOfLabel } from '../validate/surface-label.ts';
import type {
	BackendBaseline,
	CounterPair,
	DeclaredCounters,
	DeclaredRowChange,
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

type ValidatorName = keyof GrammarEntry['validators'];

const ROUNDTRIP_BY_VALIDATOR: {
	readonly [V in ValidatorName]: GrammarEntry['validators'][V] extends RoundtripResult ? true : false;
} = { from: false, coverage: false, roundtrip: true, factoryStorage: true, builtRenderParse: true };

const VALIDATORS = Object.keys(ROUNDTRIP_BY_VALIDATOR) as readonly ValidatorName[];

function baseValidators(validators: object): readonly ValidatorName[] {
	return VALIDATORS.filter((vName) => Object.hasOwn(validators, vName));
}

function ownEntry<T>(record: { readonly [key: string]: T } | undefined, key: string): T | undefined {
	return record !== undefined && Object.hasOwn(record, key) ? record[key] : undefined;
}

function declaredRow(head: BackendBaseline, g: string, row: string): DeclaredRowChange | undefined {
	return ownEntry(ownEntry(head.baselineCounterChange?.grammars, g), row);
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

function isKindId(key: string): boolean {
	const id = Number(key);
	return Number.isSafeInteger(id) && id >= 0 && String(id) === key;
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
		const notKindId = keys.find((kind) => !isKindId(kind));
		if (notKindId !== undefined) {
			return {
				ok: false,
				reason: 'schema-violation',
				summary: `schema violation: ${path}.${key} key '${notKindId}' is not a kind id`,
				details: {
					path: `${path}.${key}`,
					after: keys,
					note: 'parity failures are keyed by numeric kind id, which an object enumerates in ascending order'
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
	const declared = obj['baselineCounterChange'] as { readonly reason?: unknown } | null | undefined;
	const declaredReason = declared?.reason;
	if (declared !== undefined && (typeof declaredReason !== 'string' || declaredReason.trim() === '')) {
		return {
			ok: false,
			reason: 'schema-violation',
			summary: `schema violation: ${label}.baselineCounterChange states no reason`,
			details: { path: `${label}.baselineCounterChange.reason`, after: declaredReason, note: 'a declaration states why its rows change' }
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
		const ge = ownEntry(grammars as Record<string, unknown>, g);
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
		const unknown = validatorKeys.find((key) => !Object.hasOwn(ROUNDTRIP_BY_VALIDATOR, key));
		if (unknown !== undefined) {
			return {
				ok: false,
				reason: 'schema-violation',
				summary: `schema violation: ${gPath}.validators.${unknown} is not a validator the checker compares`,
				details: {
					path: `${gPath}.validators.${unknown}`,
					note: 'every validator a record holds is one GrammarEntry declares'
				}
			};
		}
		for (const vName of label === 'head' ? VALIDATORS : baseValidators(validators as object)) {
			const vPath = `${gPath}.validators.${vName}`;
			const vv = (validators as Record<string, unknown>)[vName];
			const sv = validateValidatorResultShape(vv, vPath, ROUNDTRIP_BY_VALIDATOR[vName]);
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
	readonly row: ValidatorName | 'parityFixtures';
	readonly path: string;
	readonly b: CountedRow;
	readonly h: CountedRow;
	readonly metrics: readonly ComparedMetric[];
}

const UNRECORDED_ROW = { pass: 0, total: 0, astMatchPass: 0 } as const;

function* comparedRows(g: string, baseGrammar: GrammarEntry | undefined, headGrammar: GrammarEntry): Generator<ComparedRow> {
	for (const vName of VALIDATORS) {
		const b = (baseGrammar?.validators[vName] as RoundtripResult | undefined) ?? UNRECORDED_ROW;
		const h = headGrammar.validators[vName] as RoundtripResult;
		const metrics: ComparedMetric[] = [{ name: 'pass', before: b.pass, after: h.pass }];
		if (ROUNDTRIP_BY_VALIDATOR[vName]) metrics.push({ name: 'astMatchPass', before: b.astMatchPass, after: h.astMatchPass });
		yield { row: vName, path: `grammars.${g}.validators.${vName}`, b, h, metrics };
	}
	const b = baseGrammar?.parityFixtures ?? UNRECORDED_ROW;
	const h = headGrammar.parityFixtures;
	yield { row: 'parityFixtures', path: `grammars.${g}.parityFixtures`, b, h, metrics: [{ name: 'pass', before: b.pass, after: h.pass }] };
}

type KindLoss = readonly [kind: string, cases: number];

interface CaseLosses {
	readonly departed: readonly KindLoss[];
	readonly kept: readonly KindLoss[];
}

function kindsMissingFrom(grammar: GrammarEntry, other: GrammarEntry): ReadonlySet<string> {
	if (grammar.kinds === undefined || other.kinds === undefined) return new Set();
	const others = new Set(other.kinds);
	return new Set(grammar.kinds.filter((kind) => !others.has(kind)));
}

function caseLosses(baseGrammar: GrammarEntry, headGrammar: GrammarEntry, { b, h }: ComparedRow): CaseLosses | undefined {
	const baseCases = b.casesByKind;
	if (baseCases === undefined) return undefined;
	const headCases = h.casesByKind ?? {};
	const departed = kindsMissingFrom(baseGrammar, headGrammar);
	const lost = Object.entries(baseCases)
		.map(([kind, cases]): KindLoss => [kind, cases - (ownEntry(headCases, kind) ?? 0)])
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
	if (losses === undefined) return 'no kind departure explains it: the base records no cases by kind for this row';
	if (failAfter === 0) return undefined;
	const lost = [
		...(losses.kept.length === 0 ? [] : [`cases lost by kinds that did not depart: ${lossText(losses.kept)}`]),
		...(losses.departed.length === 0 ? [] : [`departed ${lossText(losses.departed)}`])
	];
	return `${lost.join('; ')}, from a row that still fails ${casesText(failAfter)}, so a kept case may have begun to fail`;
}

function checkDroppedGrammars(base: BackendBaseline, head: BackendBaseline): RegressionVerdict | null {
	const baseGrammars = Object.keys(base.grammars);
	const dropped = baseGrammars.filter((g) => ownEntry(head.grammars, g) === undefined);
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
		const headGrammar = ownEntry(head.grammars, g);
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
				const mismatch = caseLossMismatch(declaredRow(head, g, row.row), row, losses.kept);
				if (mismatch !== undefined) {
					const note = `cases lost by kinds that did not depart: ${lossText(losses.kept)} (${mismatch})`;
					const [kind] = kept;
					return {
						ok: false,
						reason: 'case-loss',
						summary: `case loss at ${row.path}.casesByKind: ${note}`,
						details: {
							path: `${row.path}.casesByKind.${kind}`,
							before: ownEntry(row.b.casesByKind, kind),
							after: ownEntry(row.h.casesByKind, kind) ?? 0,
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
	for (const [g, headGE] of Object.entries(head.grammars)) {
		const before = ownEntry(base.grammars, g)?.parityFixtures.leftOutByKind ?? {};
		const after = headGE.parityFixtures.leftOutByKind ?? {};
		const beforeSum = sumByKind(before);
		const afterSum = sumByKind(after);
		if (afterSum <= beforeSum) continue;
		const [grownKind] = Object.keys(after)
			.map((kind) => [kind, (after[kind] ?? 0) - (ownEntry(before, kind) ?? 0)] as const)
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

function declaredCount(counters: DeclaredCounters, metric: ComparedMetric['name']): number {
	return metric === 'astMatchPass' ? (counters.astMatchPass ?? counters.pass) : counters.pass;
}

function countersText(total: number, counts: readonly (readonly [ComparedMetric['name'], number])[]): string {
	return counts.map(([metric, count]) => (metric === 'pass' ? `${count}/${total}` : ` (${metric} ${count})`)).join('');
}

function declarationMismatch(declared: DeclaredRowChange | undefined, { row, b, h, metrics }: ComparedRow): string | undefined {
	if (declared === undefined) return `${row} has no baselineCounterChange declaration`;
	for (const [side, label, total, at] of [['from', 'base', b.total, 'before'], ['to', 'head', h.total, 'after']] as const) {
		const counters = declared[side];
		const actual = metrics.map(({ name, [at]: count }) => [name, count] as const);
		const stated = metrics.map(({ name }) => [name, declaredCount(counters, name)] as const);
		if (counters.total !== total || actual.some(([, count], i) => count !== stated[i]![1])) {
			return `${row} ${label} ${countersText(total, actual)} is not the declared ${side} ${countersText(counters.total, stated)}`;
		}
	}
	return undefined;
}

function caseLossMismatch(declared: DeclaredRowChange | undefined, row: ComparedRow, kept: readonly KindLoss[]): string | undefined {
	const { b, h } = row;
	const counters = declarationMismatch(declared, row);
	if (counters !== undefined || declared === undefined) return counters;
	const undeclared = kept
		.map(([kind]): KindChange => [kind, ownEntry(b.casesByKind, kind) ?? 0, ownEntry(h.casesByKind, kind) ?? 0])
		.filter(([kind, from, to]) => {
			const change = ownEntry(declared.cases, kind);
			return change?.from !== from || change.to !== to;
		});
	if (undeclared.length === 0) return undefined;
	return `${row.row}'s declaration does not name ${undeclared.map(([kind, from, to]) => `${kind} ${from} → ${to}`).join(', ')} in its cases`;
}

type KindChange = readonly [kind: string, from: number, to: number];

function checkHeadKeepsInventories(base: BackendBaseline, head: BackendBaseline): RegressionVerdict | null {
	const missing = (path: string): RegressionVerdict => ({
		ok: false,
		reason: 'schema-violation',
		summary: `schema violation: head.${path} is missing, though the base records it`,
		details: { path: `head.${path}`, note: 'a collected head records every kind enumeration and case inventory its base does' }
	});
	for (const [g, baseGrammar, headGrammar] of comparedGrammars(base, head)) {
		if (baseGrammar.kinds !== undefined && headGrammar.kinds === undefined) return missing(`grammars.${g}.kinds`);
		for (const row of comparedRows(g, baseGrammar, headGrammar)) {
			if (row.b.casesByKind !== undefined && row.h.casesByKind === undefined) return missing(`${row.path}.casesByKind`);
		}
	}
	return null;
}

function checkTotalDrop(base: BackendBaseline, head: BackendBaseline): RegressionVerdict | null {
	for (const [g, baseGrammar, headGrammar] of comparedGrammars(base, head)) {
		for (const compared of comparedRows(g, baseGrammar, headGrammar)) {
			const { row, path, b, h } = compared;
			if (b.casesByKind !== undefined || h.total >= b.total || h.pass < b.pass) continue;
			const note = declarationMismatch(declaredRow(head, g, row), compared);
			if (note === undefined) continue;
			return {
				ok: false,
				reason: 'total-drop',
				summary: `${path}.total decreased: ${b.total} → ${h.total} (${note})`,
				details: { path: `${path}.total`, before: b.total, after: h.total, note }
			};
		}
	}
	return null;
}

function checkFailRise(base: BackendBaseline, head: BackendBaseline): RegressionVerdict | null {
	for (const [g, headGrammar] of Object.entries(head.grammars)) {
		for (const row of comparedRows(g, ownEntry(base.grammars, g), headGrammar)) {
			for (const metric of row.metrics) {
				const before = row.b.total - metric.before;
				const after = row.h.total - metric.after;
				if (after <= before) continue;
				const note = declarationMismatch(declaredRow(head, g, row.row), row);
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
// Format-deferred rise (rule #5) — a row's failing and format-deferred
// lists may grow by no more than its total did.
// ---------------------------------------------------------------------------

function validatorSum(v: ValidatorResult, uncounted: ReadonlySet<string> = new Set()): number {
	return [...v.failingKinds, ...v.formatDeferredKinds].filter((entry) => !uncounted.has(kindOfLabel(entry))).length;
}

function parityFixturesSum(p: ParityFixtures): number {
	let sum = 0;
	for (const k of Object.keys(p.failingByKind)) sum += p.failingByKind[k]?.length ?? 0;
	for (const k of Object.keys(p.formatDeferredByKind)) sum += p.formatDeferredByKind[k]?.length ?? 0;
	return sum;
}

function listRiseUnexplained(b: CounterPair, h: CounterPair, before: number, after: number): boolean {
	return after > before && (h.total - b.total < after - before || h.pass < b.pass);
}

function failureListSizes(
	row: ComparedRow['row'],
	baseGE: GrammarEntry,
	headGE: GrammarEntry,
	arrived: ReadonlySet<string>
): readonly [before: number, after: number] | undefined {
	if (row === 'parityFixtures') return [parityFixturesSum(baseGE.parityFixtures), parityFixturesSum(headGE.parityFixtures)];
	if (!Object.hasOwn(baseGE.validators, row)) return undefined;
	return [validatorSum(baseGE.validators[row]), validatorSum(headGE.validators[row], arrived)];
}

function failRiseDeclared(head: BackendBaseline, g: string, compared: ComparedRow): boolean {
	const { row, b, h, metrics } = compared;
	const rose = metrics.some(({ before, after }) => h.total - after > b.total - before);
	return rose && declarationMismatch(declaredRow(head, g, row), compared) === undefined;
}

function checkFormatDeferredRise(base: BackendBaseline, head: BackendBaseline): RegressionVerdict | null {
	for (const [g, baseGE, headGE] of comparedGrammars(base, head)) {
		const arrived = kindsMissingFrom(headGE, baseGE);
		for (const row of comparedRows(g, baseGE, headGE)) {
			const sizes = failureListSizes(row.row, baseGE, headGE, arrived);
			if (sizes === undefined) continue;
			const [before, after] = sizes;
			if (!listRiseUnexplained(row.b, row.h, before, after) || failRiseDeclared(head, g, row)) continue;
			const parity = row.row === 'parityFixtures';
			const lists = parity ? 'the failingByKind + formatDeferredByKind ids' : 'failingKinds.length + formatDeferredKinds.length';
			return {
				ok: false,
				reason: 'format-deferred-rise',
				summary: `format-deferred ${parity ? 'fixture-id ' : ''}sum grew at ${row.path}: ${before} → ${after} (total: ${row.b.total} → ${row.h.total}, pass: ${row.b.pass} → ${row.h.pass})`,
				details: {
					path: row.path,
					before,
					after,
					note: `${lists} may grow by no more than total did, with pass held, unless the row's fail rise is declared`
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
 *   4. grammar-dropped
 *   5. schema-violation (a head missing an inventory its base records)
 *   6. left-out-rise
 *   7. total-drop
 *   8. pass-count-drop, case-loss
 *   9. fail-rise
 *  10. format-deferred-rise
 *
 * The schema check runs first so subsequent checks may safely cast to
 * the typed shape. total-drop and pass-count-drop never name the same
 * row: total-drop takes only rows whose pass held.
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

	const inventories = checkHeadKeepsInventories(base, head);
	if (inventories) return inventories;

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
