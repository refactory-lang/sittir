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
		| Partial<Pick<GrammarDiagnosticEntry, 'location' | 'proposal'>>
		| Partial<Pick<ValidatorDiagnostic, 'stage' | 'label'>>
	);

/**
 * Merge per-grammar static grammar diagnostics and per-grammar validator
 * failures into one flat array of `ValidationReportEntry` — each entry is
 * the original diagnostic object, spread as-is, tagged with only the shared
 * `source`/`grammar`/`backend` fields. No hand-picked field list to keep in
 * sync as either diagnostic shape grows.
 */
export function buildValidationReportEntries(
	grammarDiagnosticsByGrammar: Readonly<Record<string, readonly GrammarDiagnosticEntry[]>>,
	validatorFailuresByGrammar: Readonly<Record<string, readonly ValidatorDiagnostic[]>>,
	backend = 'native'
): ValidationReportEntry[] {
	const entries: ValidationReportEntry[] = [];
	for (const [grammar, diagnostics] of Object.entries(grammarDiagnosticsByGrammar)) {
		for (const d of diagnostics) {
			entries.push({ source: 'grammar' as const, grammar, backend, ...d });
		}
	}
	for (const [grammar, failures] of Object.entries(validatorFailuresByGrammar)) {
		for (const f of failures) {
			entries.push({ source: 'validator' as const, grammar, backend, ...f });
		}
	}
	return entries;
}

/** Read a report `writeValidationReport` wrote. A missing, empty or unparseable file, or one that is not an array, throws naming the path. */
export function readValidationReport(path: string): ValidationReportEntry[] {
	if (!existsSync(path)) throw new Error(`validation report not found: ${path}`);
	const text = readFileSync(path, 'utf8');
	if (text.trim() === '') throw new Error(`validation report is empty: ${path}`);
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch (e) {
		throw new Error(`validation report is not valid JSON: ${path}: ${(e as Error).message}`);
	}
	if (!Array.isArray(parsed)) throw new Error(`validation report is not an array: ${path}`);
	parsed.forEach((row: unknown, index) => {
		if (typeof row !== 'object' || row === null || Array.isArray(row))
			throw new Error(`validation report row ${index} is not an object: ${path}`);
		const missing = REPORT_ROW_FIELDS.filter((f) => typeof (row as Record<string, unknown>)[f] !== 'string');
		if (missing.length > 0)
			throw new Error(`validation report row ${index} lacks the string field(s) ${missing.join(', ')}: ${path}`);
	});
	return parsed as ValidationReportEntry[];
}

/** The string fields every report row carries, whichever source wrote it. */
const REPORT_ROW_FIELDS = ['source', 'grammar', 'backend', 'code', 'severity', 'message'] as const;

/** Write the full (unbounded) entry list to `outPath` as pretty JSON, overwriting any previous report. */
export function writeValidationReport(entries: readonly ValidationReportEntry[], outPath: string): void {
	writeFileSync(outPath, printRecordLines([...entries].sort(compareReportRows)));
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
 * Per grammar, the most report rows each diagnostic code may carry at error or
 * warning severity: the committed shape of `packages/tools/diagnostic-ceilings.json`.
 * A code a grammar does not list has ceiling 0, so every error and warning code is guarded.
 */
export type CodeCeilings = Readonly<Record<string, Readonly<Record<string, number>>>>;

/** Report rows per grammar per code, counting error and warning rows; an info row records a fact, not debt. */
export function countCodeEntries(entries: readonly ValidationReportEntry[]): Record<string, Record<string, number>> {
	const counts: Record<string, Record<string, number>> = {};
	for (const e of entries) {
		if (e.severity !== 'error' && e.severity !== 'warning') continue;
		const row = (counts[e.grammar] ??= {});
		row[e.code] = (row[e.code] ?? 0) + 1;
	}
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

/**
 * The diagnostic ratchet: each validated grammar's error and warning rows per
 * code against the committed ceilings. A count above its ceiling is new debt;
 * fix the source, never raise the ceiling. A count below a non-zero ceiling is
 * paid-down debt, and the ceiling moves down with it. Only `grammars` are
 * judged, so a single-grammar run never judges a grammar it did not measure.
 */
export function checkCodeCeilings(
	entries: readonly ValidationReportEntry[],
	ceilings: CodeCeilings,
	grammars: readonly string[]
): CodeCeilingVerdict {
	const counts = countCodeEntries(entries);
	const violations: CodeCeilingCount[] = [];
	const improvements: CodeCeilingCount[] = [];
	for (const grammar of [...grammars].sort()) {
		const codes = [...new Set([...Object.keys(counts[grammar] ?? {}), ...Object.keys(ceilings[grammar] ?? {})])].sort();
		for (const code of codes) {
			const count = counts[grammar]?.[code] ?? 0;
			const ceiling = ceilings[grammar]?.[code] ?? 0;
			if (count > ceiling) violations.push({ grammar, code, count, ceiling });
			else if (count < ceiling) improvements.push({ grammar, code, count, ceiling });
		}
	}
	return { violations, improvements };
}
