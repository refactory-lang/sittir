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

import { writeFileSync } from 'node:fs';

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

/** Generic, pre-normalized grammar diagnostic input — decoupled from the real
 *  `GrammarDiagnostic` union in `@sittir/codegen/types/diagnostics.ts`. */
export interface GrammarDiagnosticEntry extends DiagnosticEntryBase {
	readonly location?: string;
	readonly proposal?: string;
}

/**
 * One (unbounded) validator failure, tagged with the stage it came from.
 * Carries its own real `code`/`severity` — the caller (`collectValidatorFailuresForGrammar`
 * in `packages/tools/src/commands.ts`) assigns a distinct `code` per failure
 * kind rather than every validator failure being tagged with one generic
 * bucket code.
 */
export interface ValidatorDiagnostic extends DiagnosticEntryBase {
	readonly stage: string;
	readonly label: string;
}

export interface ValidationReportEntry {
	readonly source: 'grammar' | 'validator';
	readonly severity: 'error' | 'warning' | 'info' | 'fail';
	readonly code: string;
	readonly grammar: string;
	readonly backend: string;
	readonly stage?: string;
	readonly location?: string;
	readonly message: string;
}

/**
 * Merge per-grammar static grammar diagnostics and per-grammar validator
 * failures into one flat array of `ValidationReportEntry`. Both sides keep
 * their own real `code`/`severity`, assigned at the source (`readGrammarDiagnosticsEntries`
 * / `collectValidatorFailuresForGrammar` in `packages/tools/src/commands.ts`)
 * rather than synthesized here.
 */
export function buildValidationReportEntries(
	grammarDiagnosticsByGrammar: Readonly<Record<string, readonly GrammarDiagnosticEntry[]>>,
	validatorFailuresByGrammar: Readonly<Record<string, readonly ValidatorDiagnostic[]>>,
	backend = 'native'
): ValidationReportEntry[] {
	const entries: ValidationReportEntry[] = [];
	for (const [grammar, diagnostics] of Object.entries(grammarDiagnosticsByGrammar)) {
		for (const d of diagnostics) {
			entries.push({
				source: 'grammar',
				severity: d.severity,
				code: d.code,
				grammar,
				backend,
				location: d.location,
				message: d.message
			});
		}
	}
	for (const [grammar, failures] of Object.entries(validatorFailuresByGrammar)) {
		for (const f of failures) {
			entries.push({
				source: 'validator',
				severity: f.severity,
				code: f.code,
				grammar,
				backend,
				stage: f.stage,
				location: f.label,
				message: f.message
			});
		}
	}
	return entries;
}

/** Write the full (unbounded) entry list to `outPath` as pretty JSON, overwriting any previous report. */
export function writeValidationReport(entries: readonly ValidationReportEntry[], outPath: string): void {
	writeFileSync(outPath, JSON.stringify(entries, null, 2));
}
