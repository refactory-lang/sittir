/**
 * Unified validation report — combines Task 13's per-grammar static grammar
 * diagnostics (`packages/<grammar>/.sittir/grammar-diagnostics.json`) with the
 * (previously stdout-only, capped) validator failure lists into a single
 * persisted, structured, unbounded JSON artifact.
 *
 * Deliberately decoupled from `@sittir/codegen`'s diagnostics types: this
 * module accepts a generic pre-normalized `GrammarDiagnosticEntry` shape.
 * Callers (e.g. `packages/tools/src/commands.ts`) are responsible for
 * deriving `location` from the real on-disk `ownerKind`/`slotName` fields
 * before calling in.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { load } from '../codegen-surface.ts';

const { printRecordLines } = await load('recordLines');

/**
 * Minimal shared shape both diagnostic sources (`grammar` static diagnostics
 * and `validator` runtime failures) conform to. Each source assigns its own
 * real `code`/`severity` at construction time rather than having them
 * synthesized/hardcoded downstream in `buildValidationReportEntries` — this
 * leaves room for a source to genuinely report a `warning` in the future
 * without another round of code/severity drift.
 *
 * Severity matches `Diagnostic['severity']` in
 * `packages/codegen/src/types/diagnostics.ts` (`'error' | 'warning' | 'info' | 'fail'`) —
 * grammar diagnostics can carry any of those four; validator failures only
 * ever assign `'error'`/`'warning'` today.
 */
export interface DiagnosticEntryBase {
	readonly code: string;
	readonly severity: 'error' | 'warning' | 'info' | 'fail';
	readonly message: string;
}

/**
 * Grammar diagnostic input — decoupled from the real `GrammarDiagnostic |
 * CompilerDiagnostic` union in `@sittir/codegen/types/diagnostics.ts` (this
 * module doesn't import codegen types), but NOT narrowed to a fixed field
 * list either: `scope`, `phase`, `ownerKind`, `slotName`, `canProceed`,
 * `details`, `ruleId`, `subject`, etc. all still exist on disk in
 * `.sittir/grammar-diagnostics.json` (written verbatim by
 * `writeGrammarDiagnosticsJson`) and are preserved through `readGrammarDiagnosticsEntries`
 * — only `location` is a synthesized convenience field, added alongside the
 * original fields rather than replacing them.
 */
export interface GrammarDiagnosticEntry extends DiagnosticEntryBase {
	readonly canProceed?: boolean;
	readonly location?: string;
	readonly proposal?: string;
	readonly [key: string]: unknown;
}

/**
 * One (unbounded) validator failure, tagged with the stage it came from.
 * Carries its own real `code`/`severity` — the caller (`collectValidatorFailuresForGrammar`
 * in `packages/tools/src/commands.ts`) assigns a distinct `code` per failure
 * kind rather than every validator failure being tagged with one generic
 * bucket code.
 *
 * `stage`/`label` are the only fields every source is guaranteed to add —
 * each underlying validator result (read-render-parse errors/mismatches/
 * accessor-throws, factory errors, coverage issues, …) has its OWN extra
 * fields (`input`, `rendered`, `key`, `accessor`, `type`, …); those are
 * preserved through via spread rather than being narrowed away.
 */
export interface ValidatorDiagnostic extends DiagnosticEntryBase {
	readonly stage: string;
	readonly label: string;
	readonly [key: string]: unknown;
}

/**
 * `source`/`grammar`/`backend` are the only fields every entry is guaranteed
 * to carry beyond `DiagnosticEntryBase` — everything else is whatever the
 * originating diagnostic (`GrammarDiagnosticEntry` or `ValidatorDiagnostic`)
 * actually has. Grammar and validator diagnostics aren't the same shape and
 * don't need to be forced into one: a grammar diagnostic's `location`/
 * `proposal` and a validator failure's `stage`/`label` are kept as their own
 * fields rather than renamed/collapsed into a shared name (or dropped, as
 * `proposal` previously was) to fit a homogenized entry shape.
 */
export type ValidationReportEntry = DiagnosticEntryBase & {
	readonly source: 'grammar' | 'validator';
	readonly grammar: string;
	readonly backend: string;
} & (
		| Partial<Pick<GrammarDiagnosticEntry, 'canProceed' | 'location' | 'proposal'>>
		| Partial<Pick<ValidatorDiagnostic, 'stage' | 'label'>>
	);

/** Per diagnostic code, how many rows it has at each severity. */
export type DiagnosticCounts = Readonly<Record<string, Readonly<Record<string, number>>>>;

/**
 * What the report records of one grammar's `grammar-diagnostics.json`: its
 * rows counted per code and severity, partitioned by each row's own
 * `canProceed` (`blocking` holds the rows that cannot proceed, `counts` the
 * rest, so each row is counted once), and a digest of the rows (`digestOf`),
 * so a diff of two reports names a grammar whose diagnostics moved without
 * the report copying the rows.
 */
export interface GrammarDiagnosticsRecord {
	readonly digest: string;
	readonly counts: DiagnosticCounts;
	readonly blocking: DiagnosticCounts;
}

/** The validation report: each grammar's diagnostics record, and every validator failure as a row. */
export interface ValidationReport {
	readonly grammars: Readonly<Record<string, GrammarDiagnosticsRecord>>;
	readonly rows: readonly ValidationReportEntry[];
}

/** One grammar's diagnostics as read from its file. */
export interface GrammarDiagnosticsInput {
	readonly entries: readonly GrammarDiagnosticEntry[];
}

/** A JSON value with every object's keys sorted, at every depth; array order is kept, an array never reads as an object, and a key holding `undefined` is absent, as in JSON. */
function canonical(value: unknown): unknown {
	if (Array.isArray(value)) return { array: value.map(canonical) };
	if (value === null || typeof value !== 'object') return value;
	const record = value as Record<string, unknown>;
	return {
		object: Object.keys(record)
			.filter((k) => record[k] !== undefined)
			.sort()
			.map((k) => [k, canonical(record[k])])
	};
}

/** A value's identity: every field, independent of key order at any depth. */
export function canonicalKey(value: unknown): string {
	return JSON.stringify(canonical(value));
}

/** A digest of one grammar's diagnostics as a multiset: independent of their order and of key order, so both report formats digest the same diagnostics alike. */
function digestOf(entries: readonly object[]): string {
	return createHash('sha256').update(entries.map(digestedFields).map(canonicalKey).sort().join('\n')).digest('hex');
}

/** A diagnostic without the fields its grammar record already states or a flat-format report added: `source`, `grammar`, `backend` and the retired `sClass`. */
function digestedFields({ source: _source, grammar: _grammar, backend: _backend, sClass: _sClass, ...diagnostic }: { readonly source?: unknown; readonly grammar?: unknown; readonly backend?: unknown; readonly sClass?: unknown }): object {
	return diagnostic;
}

/** One grammar's record of its diagnostics, from the diagnostics themselves or a flat report's grammar rows alike. */
function recordOf(entries: readonly (DiagnosticEntryBase & { readonly canProceed?: boolean })[]): GrammarDiagnosticsRecord {
	return {
		digest: digestOf(entries),
		counts: countDiagnostics(entries.filter((e) => e.canProceed !== false)),
		blocking: countDiagnostics(entries.filter((e) => e.canProceed === false))
	};
}

function countDiagnostics(entries: readonly DiagnosticEntryBase[]): DiagnosticCounts {
	const counts: Record<string, Record<string, number>> = {};
	for (const e of entries) {
		const bySeverity = (counts[e.code] ??= {});
		bySeverity[e.severity] = (bySeverity[e.severity] ?? 0) + 1;
	}
	return counts;
}

/** The report of one validation run: each grammar's diagnostics record, and each validator failure as a row tagged with its grammar and backend. */
export function buildValidationReport(
	grammarDiagnosticsByGrammar: Readonly<Record<string, GrammarDiagnosticsInput>>,
	validatorFailuresByGrammar: Readonly<Record<string, readonly ValidatorDiagnostic[]>>,
	backend = 'native'
): ValidationReport {
	const grammars: Record<string, GrammarDiagnosticsRecord> = {};
	for (const [grammar, { entries }] of Object.entries(grammarDiagnosticsByGrammar)) {
		grammars[grammar] = recordOf(entries);
	}
	const rows: ValidationReportEntry[] = [];
	for (const [grammar, failures] of Object.entries(validatorFailuresByGrammar)) {
		for (const f of failures) rows.push({ source: 'validator' as const, grammar, backend, ...f });
	}
	return { grammars, rows };
}

/**
 * Read a report `writeValidationReport` wrote, or one in the flat format (one
 * array of rows, grammar diagnostics among them), whose grammar rows fold into
 * counts and the digest the record format gives the same diagnostics. A missing, empty or unparseable file, a value in
 * neither format, or an element that is not a row throws naming the path.
 *
 * The flat format is read only so `validate history` can compare against
 * reports written before the record format. Once the committed report and
 * every report kept to compare against are in the record format, the flat
 * branch can be removed.
 */
export function readValidationReport(path: string): ValidationReport {
	if (!existsSync(path)) throw new Error(`validation report not found: ${path}`);
	const text = readFileSync(path, 'utf8');
	if (text.trim() === '') throw new Error(`validation report is empty: ${path}`);
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch (e) {
		throw new Error(`validation report is not valid JSON: ${path}: ${(e as Error).message}`);
	}
	if (Array.isArray(parsed)) {
		const rows = checkedRows(parsed, path);
		const grammarRows = Map.groupBy(
			rows.filter((row) => row.source === 'grammar'),
			(row) => row.grammar
		);
		return {
			grammars: Object.fromEntries([...grammarRows].map(([grammar, entries]) => [grammar, recordOf(entries)])),
			rows: rows.filter((row) => row.source !== 'grammar')
		};
	}
	const record = parsed as { grammars?: unknown; rows?: unknown } | null;
	if (typeof record !== 'object' || record === null || typeof record.grammars !== 'object' || record.grammars === null || !Array.isArray(record.rows))
		throw new Error(`validation report is not a validation report (neither a row array nor grammars and rows): ${path}`);
	return { grammars: record.grammars as ValidationReport['grammars'], rows: checkedRows(record.rows, path) };
}

function checkedRows(rows: readonly unknown[], path: string): ValidationReportEntry[] {
	rows.forEach((row, index) => {
		if (typeof row !== 'object' || row === null || Array.isArray(row))
			throw new Error(`validation report row ${index} is not an object: ${path}`);
		const missing = REPORT_ROW_FIELDS.filter((f) => typeof (row as Record<string, unknown>)[f] !== 'string');
		if (missing.length > 0)
			throw new Error(`validation report row ${index} lacks the string field(s) ${missing.join(', ')}: ${path}`);
	});
	return rows as ValidationReportEntry[];
}

/** The string fields every report row carries, whichever source wrote it. */
const REPORT_ROW_FIELDS = ['source', 'grammar', 'backend', 'code', 'severity', 'message'] as const;

/** Write the report to `outPath`, one grammar record and one row per line, overwriting any previous report. */
export function writeValidationReport(report: ValidationReport, outPath: string): void {
	writeFileSync(outPath, printRecordLines({ grammars: report.grammars, rows: [...report.rows].sort(compareReportRows) }));
}

/** Report rows in a stable order: by grammar, source, backend, code, severity and message, then by the whole row. */
function compareReportRows(a: ValidationReportEntry, b: ValidationReportEntry): number {
	const keyOf = (row: ValidationReportEntry): readonly string[] => [row.grammar, row.source, row.backend, row.code, row.severity, row.message, JSON.stringify(row)];
	const left = keyOf(a);
	const right = keyOf(b);
	for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) return left[i]! < right[i]! ? -1 : 1;
	return 0;
}

/**
 * Per grammar, the most report rows each diagnostic code may carry at fail,
 * error or warning severity: the committed shape of
 * `packages/tools/diagnostic-ceilings.json`. A code a grammar does not list has
 * ceiling 0, so every such code is guarded, and the file stores only positive
 * ceilings. A grammar row that cannot proceed is not counted against a ceiling:
 * the grammar's `expectDiagnostics` gates it by owner.
 */
export type CodeCeilings = Readonly<Record<string, Readonly<Record<string, number>>>>;

/** Read the ceilings file at `path`. A missing file means every ceiling is 0; an unparseable one throws naming the path, since reading it as empty would silently pass. */
export function readCodeCeilings(path: string): CodeCeilings {
	if (!existsSync(path)) return {};
	try {
		return JSON.parse(readFileSync(path, 'utf8')) as CodeCeilings;
	} catch (e) {
		throw new Error(`diagnostic ceilings are not valid JSON: ${path}: ${(e as Error).message}`);
	}
}

const isDebt = (severity: string): boolean => severity === 'fail' || severity === 'error' || severity === 'warning';

/** Rows per grammar per code at fail, error or warning severity, validator rows and the recorded grammar rows that can proceed alike; an info row records a fact, not debt, and a blocking grammar row is gated by its grammar's `expectDiagnostics`. */
export function countCodeEntries(report: ValidationReport): Record<string, Record<string, number>> {
	return countCodeRows(report, isDebt);
}

function countCodeRows(report: ValidationReport, counted: (severity: string) => boolean): Record<string, Record<string, number>> {
	const counts: Record<string, Record<string, number>> = {};
	const add = (grammar: string, code: string, n: number): void => {
		const row = (counts[grammar] ??= {});
		row[code] = (row[code] ?? 0) + n;
	};
	for (const [grammar, { counts: byCode }] of Object.entries(report.grammars))
		for (const [code, bySeverity] of Object.entries(byCode))
			for (const [severity, n] of Object.entries(bySeverity)) if (counted(severity)) add(grammar, code, n);
	for (const row of report.rows) if (counted(row.severity)) add(row.grammar, row.code, 1);
	return counts;
}

/** One (grammar, code) pair's row count against its ceiling. */
export interface CodeCeilingCount {
	readonly grammar: string;
	readonly code: string;
	readonly count: number;
	readonly ceiling: number;
}

export interface CodeCeilingVerdict {
	/** Pairs whose count exceeds the ceiling: new debt, which fails the run. */
	readonly violations: readonly CodeCeilingCount[];
	/** Pairs whose count is below a non-zero ceiling: lower the ceiling in the same commit. */
	readonly improvements: readonly CodeCeilingCount[];
}

/** How to tighten the ceilings file for a paid-down pair: lower its ceiling to the new count, or remove its entry once the count reaches 0, since an absent code already has ceiling 0. */
export function ceilingAdvice({ grammar, code, count }: CodeCeilingCount): string {
	return count === 0 ? `remove ${grammar} ${code}: an absent code has ceiling 0` : `lower ${grammar} ${code} to ${count}`;
}

/**
 * The diagnostic ratchet: each validated grammar's fail, error and warning rows
 * per code against the committed ceilings. A code with any fatal (`fail`) row
 * has ceiling 0, whatever the file says. A count above its ceiling is new debt;
 * fix the source, never raise the ceiling. A count below a non-zero ceiling is
 * paid-down debt, and the ceiling moves down with it. Only `grammars` are
 * judged, so a single-grammar run never judges a grammar it did not measure.
 */
export function checkCodeCeilings(report: ValidationReport, ceilings: CodeCeilings, grammars: readonly string[]): CodeCeilingVerdict {
	const counts = countCodeEntries(report);
	const fatal = countCodeRows(report, (severity) => severity === 'fail');
	const violations: CodeCeilingCount[] = [];
	const improvements: CodeCeilingCount[] = [];
	for (const grammar of [...grammars].sort()) {
		const codes = [...new Set([...Object.keys(counts[grammar] ?? {}), ...Object.keys(ceilings[grammar] ?? {})])].sort();
		for (const code of codes) {
			const count = counts[grammar]?.[code] ?? 0;
			const ceiling = fatal[grammar]?.[code] === undefined ? (ceilings[grammar]?.[code] ?? 0) : 0;
			if (count > ceiling) violations.push({ grammar, code, count, ceiling });
			else if (count < ceiling) improvements.push({ grammar, code, count, ceiling });
		}
	}
	return { violations, improvements };
}
