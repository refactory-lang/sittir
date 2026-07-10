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

/** Generic, pre-normalized grammar diagnostic input — decoupled from the real
 *  `GrammarDiagnostic` union in `@sittir/codegen/types/diagnostics.ts`. */
export interface GrammarDiagnosticEntry {
	readonly code: string;
	readonly severity: 'error' | 'warning';
	readonly location?: string;
	readonly message: string;
	readonly proposal?: string;
}

/** One (unbounded) validator failure, tagged with the stage it came from. */
export interface ValidatorFailureInput {
	readonly stage: string;
	readonly label: string;
	readonly message: string;
}

export interface ValidationReportEntry {
	readonly source: 'grammar' | 'validator';
	readonly severity: 'error' | 'warning';
	readonly code: string;
	readonly grammar: string;
	readonly backend: string;
	readonly stage?: string;
	readonly location?: string;
	readonly message: string;
}

/**
 * Merge per-grammar static grammar diagnostics and per-grammar validator
 * failures into one flat array of `ValidationReportEntry`. Grammar
 * diagnostics keep their own `code`/`severity`; validator failures are all
 * tagged `severity: 'error'`, `code: 'validation-failure'`.
 */
export function buildValidationReportEntries(
	grammarDiagnosticsByGrammar: Readonly<Record<string, readonly GrammarDiagnosticEntry[]>>,
	validatorFailuresByGrammar: Readonly<Record<string, readonly ValidatorFailureInput[]>>,
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
				severity: 'error',
				code: 'validation-failure',
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
