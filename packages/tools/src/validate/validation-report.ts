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
	readonly sClass?: SClass;
} & (Partial<Pick<GrammarDiagnosticEntry, 'location' | 'proposal'>> | Partial<Pick<ValidatorDiagnostic, 'stage' | 'label'>>);

/**
 * Round-trip-fidelity source-class taxonomy: S1 alias-storage identity, S2
 * marker population/representation, S3 separator possession, S4 slot
 * arity, S5 template projection, S6 factory extras, S7 zero-width-token
 * divergence, S8 validator/report artifacts.
 */
export type SClass = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8';

/** Codes that determine their S-class unambiguously, independent of message text. */
const DIRECT_CODE_TO_S_CLASS: Readonly<Record<string, SClass>> = {
	'parsekind-noninjective': 'S1',
	'seq-with-nested-seq': 'S3',
	'union-slot-unaddressable': 'S4',
	'union-slot-mixed-row': 'S4',
	'accessor-throw': 'S4',
	'coverage-missing-field': 'S5'
};

/**
 * Message-shape fallback for codes covering more than one S-class
 * (`from-error`, the `*-ast-mismatch`/`*-error` validator codes). A
 * message that matches none of these known signatures is left
 * unclassified rather than guessed — most `*-ast-mismatch` rows are
 * genuinely ambiguous across S1/S2/S3/S5/S7 without more structure than
 * the message string carries.
 */
function classifyByMessage(message: string): SClass | undefined {
	if (/kind not found at rendered offset/.test(message)) return 'S8';
	if (/expected u16 kind_id/.test(message)) return 'S2';
	if (/automatic_semicolon/.test(message)) return 'S7';
	if (/_comment|_line_continuation|Missing field _content/.test(message)) return 'S6';
	if (/no kind-keyed child slot|unknown kind id \d+/.test(message)) return 'S1';
	return undefined;
}

/**
 * Maps a validation report entry to its round-trip-fidelity-restoration
 * source class. Entries outside this initiative's scope (e.g. the
 * kindid-invariant-restoration `kindid-*`/`desugar-divergence-*` codes)
 * are deliberately left unclassified.
 */
export function classifySClass(entry: { readonly code: string; readonly message: string }): SClass | undefined {
	const direct = DIRECT_CODE_TO_S_CLASS[entry.code];
	if (direct) return direct;
	if (entry.code.endsWith('-error') || entry.code.endsWith('-ast-mismatch')) return classifyByMessage(entry.message);
	return undefined;
}

/**
 * Merge per-grammar static grammar diagnostics and per-grammar validator
 * failures into one flat array of `ValidationReportEntry` — each entry is
 * the original diagnostic object, spread as-is, tagged with only the shared
 * `source`/`grammar`/`backend` fields. No hand-picked field list to keep in
 * sync as either diagnostic shape grows. `sClass` is stamped once here,
 * from the same `code`/`message` every entry already carries, rather than
 * re-derived by each downstream consumer (`validate history`, triage tools).
 */
export function buildValidationReportEntries(
	grammarDiagnosticsByGrammar: Readonly<Record<string, readonly GrammarDiagnosticEntry[]>>,
	validatorFailuresByGrammar: Readonly<Record<string, readonly ValidatorDiagnostic[]>>,
	backend = 'native'
): ValidationReportEntry[] {
	const entries: ValidationReportEntry[] = [];
	for (const [grammar, diagnostics] of Object.entries(grammarDiagnosticsByGrammar)) {
		for (const d of diagnostics) {
			const entry = { source: 'grammar' as const, grammar, backend, ...d };
			entries.push({ ...entry, sClass: classifySClass(entry) });
		}
	}
	for (const [grammar, failures] of Object.entries(validatorFailuresByGrammar)) {
		for (const f of failures) {
			const entry = { source: 'validator' as const, grammar, backend, ...f };
			entries.push({ ...entry, sClass: classifySClass(entry) });
		}
	}
	return entries;
}

/** Write the full (unbounded) entry list to `outPath` as pretty JSON, overwriting any previous report. */
export function writeValidationReport(entries: readonly ValidationReportEntry[], outPath: string): void {
	writeFileSync(outPath, JSON.stringify(entries, null, 2));
}
