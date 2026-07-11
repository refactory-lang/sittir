/**
 * Reusable command implementations for @sittir/tools' validation facade.
 *
 * Extracted from cli.ts so that @sittir/cli (and other consumers) can import
 * the run*Cli entry points without pulling in the commander-entry side-effect block.
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve as resolvePath } from 'node:path';
import { runFrom, runRt, runCoverage, runFactory, defaultTemplatesPath, type Grammar, type Backend } from './run.ts';
import { appendHistory, commitHistory, readHistory, type ValidationRun } from './history.ts';
import { warnIfNativeBinaryStale } from './native-staleness.ts';
import type { ReadRenderParseFailure } from './validate/read-render-parse.ts';
import {
	buildValidationReportEntries,
	writeValidationReport,
	type GrammarDiagnosticEntry,
	type ValidatorDiagnostic
} from './validate/validation-report.ts';

export const ALL_GRAMMARS: Grammar[] = ['rust', 'typescript', 'python'];
/**
 * The `validate` CLI namespace only ever validates against native — js/all
 * backend selection was removed (see `tool bench`/`tool probe-kind` for the
 * separate js-vs-native comparison diagnostics, which are unaffected).
 */
export const ALL_CLI_BACKENDS = ['native'] as const;
export type CliBackend = (typeof ALL_CLI_BACKENDS)[number];
type ProbeTraceFn = (
	grammar: string,
	source: string,
	opts?: { range?: { start: number; end: number } }
) => Promise<unknown>;
type ValidateReadRenderParseFn = (
	grammar: string,
	templatesPath: string,
	options: {
		backend?: 'native' | 'js';
		recursive?: boolean;
		stopOnFirstFailure?: boolean;
		onFailure?: (failure: ReadRenderParseFailure) => void;
	}
) => Promise<unknown>;

/** Parse grammar args; unknown names are silently dropped. Defaults to all three grammars. */
export function resolveGrammars(args: string[]): Grammar[] {
	const valid = args.filter((a): a is Grammar => ALL_GRAMMARS.includes(a as Grammar));
	return valid.length ? valid : ALL_GRAMMARS;
}

export function resolveBackends(mode: CliBackend): Backend[] {
	return [mode];
}

export function formatBackendLabel(backend: Backend): 'native' | 'js' {
	return backend;
}

export interface GrammarCounts {
	readonly grammar: Grammar;
	readonly backend: Backend;
	readonly from: Awaited<ReturnType<typeof runFrom>>;
	readonly coverage: ReturnType<typeof runCoverage>;
	readonly readRenderParse: Awaited<ReturnType<typeof runRt>>;
	readonly readRenderParseShallow: Awaited<ReturnType<typeof runRt>>;
	readonly factoryRenderParse: Awaited<ReturnType<typeof runFactory>>;
}

export async function collectGrammarCounts(grammar: Grammar, backend: Backend): Promise<GrammarCounts> {
	const tp = defaultTemplatesPath(grammar);
	// Guard: a `.node` older than its templates means the binary wasn't rebuilt
	// after the last regen — native render will silently fall back to JS (FR-020),
	// so these counts would not be true native. Warn loudly rather than mislead.
	if (backend === 'native') warnIfNativeBinaryStale(grammar, tp);
	const [from, coverage, factoryRenderParse] = await Promise.all([
		runFrom(grammar, backend),
		runCoverage(grammar, tp),
		runFactory(grammar, tp, backend)
	]);
	// Native RT validation reuses a cached grammar engine per process, so run the
	// recursive and shallow passes sequentially to avoid cross-run interference.
	const readRenderParse = await runRt(grammar, tp, backend, { recursive: true });
	const readRenderParseShallow = await runRt(grammar, tp, backend, { recursive: false });
	return {
		grammar,
		backend,
		from,
		coverage,
		readRenderParse,
		readRenderParseShallow,
		factoryRenderParse
	};
}

export function formatGrammarCounts(counts: GrammarCounts): string {
	const { grammar, backend, from, coverage, readRenderParse, readRenderParseShallow, factoryRenderParse } = counts;
	const lines = [
		`${grammar}/${formatBackendLabel(backend)}:`,
		`  fromPass=${from.pass}    fromTotal=${from.total}`,
		`  covPass=${coverage.pass}    covTotal=${coverage.total}`,
		`  read-render-parsePass=${readRenderParse.pass}    read-render-parseTotal=${readRenderParse.total}    read-render-parseAstMatchPass=${readRenderParse.astMatchPass}`,
		`  read-render-parse-shallowPass=${readRenderParseShallow.pass}    read-render-parse-shallowTotal=${readRenderParseShallow.total}    read-render-parse-shallowAstMatchPass=${readRenderParseShallow.astMatchPass}`,
		`  factory-render-parsePass=${factoryRenderParse.pass}    factory-render-parseTotal=${factoryRenderParse.total}    factory-render-parseAstMatchPass=${factoryRenderParse.astMatchPass}`
	];
	const rtFails = formatFirstFailures(
		'read-render-parse',
		readRenderParse.errors.map((e) => ({ label: e.name, message: e.message }))
	);
	if (rtFails) lines.push(rtFails);
	const rtAstFails = formatFirstFailures(
		'read-render-parse-ast-mismatch',
		readRenderParse.astMismatches.map((m) => ({
			label: m.entry ? `${m.entry} (${m.kind})` : m.kind,
			message: m.message
		}))
	);
	if (rtAstFails) lines.push(rtAstFails);
	const rtShallowFails = formatFirstFailures(
		'read-render-parse-shallow',
		readRenderParseShallow.errors.map((e) => ({ label: e.name, message: e.message }))
	);
	if (rtShallowFails) lines.push(rtShallowFails);
	const factoryFails = formatFirstFailures(
		'factory-render-parse',
		factoryRenderParse.errors.map((e) => ({ label: e.entry ? `${e.entry} (${e.kind})` : e.kind, message: e.message }))
	);
	if (factoryFails) lines.push(factoryFails);
	const fromFails = formatFirstFailures(
		'from',
		from.errors.map((e) => ({ label: e.kind, message: e.message }))
	);
	if (fromFails) lines.push(fromFails);
	return lines.join('\n');
}

export function formatFirstFailures(
	stage: string,
	failures: ReadonlyArray<{ label: string; message: string }>,
	max = process.env.SITTIR_VALIDATOR_MAX_FAILURES ? Number(process.env.SITTIR_VALIDATOR_MAX_FAILURES) : 5
): string | null {
	if (failures.length === 0) return null;
	const shown = failures.slice(0, max);
	const header =
		failures.length > max
			? `  ${stage} first failures (${max} of ${failures.length}):`
			: `  ${stage} failures (${failures.length}):`;
	const items = shown.map(({ label, message }) => {
		const oneLine = message.replace(/\s+/g, ' ').slice(0, 100);
		return `    ${JSON.stringify(label)} — ${oneLine}`;
	});
	return [header, ...items].join('\n');
}

export function toValidationRun(counts: GrammarCounts): ValidationRun {
	const { grammar, backend, from, coverage, readRenderParse, readRenderParseShallow, factoryRenderParse } = counts;
	return {
		ts: new Date().toISOString(),
		grammar,
		backend,
		fromPass: from.pass,
		fromTotal: from.total,
		covPass: coverage.pass,
		covTotal: coverage.total,
		readRenderParsePass: readRenderParse.pass,
		readRenderParseTotal: readRenderParse.total,
		readRenderParseAstMatchPass: readRenderParse.astMatchPass,
		readRenderParseShallowPass: readRenderParseShallow.pass,
		readRenderParseShallowTotal: readRenderParseShallow.total,
		readRenderParseShallowAstMatchPass: readRenderParseShallow.astMatchPass,
		factoryRenderParsePass: factoryRenderParse.pass,
		factoryRenderParseTotal: factoryRenderParse.total,
		factoryRenderParseAstMatchPass: factoryRenderParse.astMatchPass
	};
}

/** Print top-8 error buckets from factory-render-parse for one grammar. */
export async function grammarProbeFactory(grammar: Grammar, backend: Backend): Promise<void> {
	const tp = defaultTemplatesPath(grammar);
	const r = await runFactory(grammar, tp, backend);
	console.log(
		`\n=== ${grammar}/${formatBackendLabel(backend)} === total=${r.total} pass=${r.pass} fail=${r.fail} skip=${r.skip} astMatch=${r.astMatchPass}`
	);
	const buckets = new Map<string, Array<{ kind: string; msg: string }>>();
	for (const err of r.errors) {
		const key = (err.message.split(':')[0] ?? '').slice(0, 60);
		if (!buckets.has(key)) buckets.set(key, []);
		buckets.get(key)!.push({ kind: err.kind, msg: err.message.slice(0, 140) });
	}
	for (const [key, items] of [...buckets.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 8)) {
		const byKind = new Map<string, number>();
		for (const it of items) byKind.set(it.kind, (byKind.get(it.kind) ?? 0) + 1);
		console.log(`  [${items.length}] ${key}`);
		for (const [k, n] of [...byKind.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`     ${k}: ${n}`);
		console.log(`     sample: ${items[0]?.msg}`);
	}
}

/**
 * Parse the last `[isolate-progress] <grammar> <kind>` line from a stderr
 * string captured from an isolation worker child process.
 */
export function parseLastIsolateProgress(stderr: string): string | null {
	const lines = stderr.split('\n');
	for (let i = lines.length - 1; i >= 0; i--) {
		const line = lines[i]!.trim();
		const m = line.match(/^\[isolate-progress\]\s+\S+\s+(.+)$/);
		if (m) return m[1]!;
	}
	return null;
}

/**
 * Summarize the isolation run outcome for one grammar into a printable string.
 */
export function formatIsolateGrammarSummary(
	grammar: Grammar,
	status: 'ok' | 'crashed' | 'error',
	output: string,
	lastKind: string | null,
	exitCode: number | null,
	signal: NodeJS.Signals | null
): string {
	if (status === 'crashed') {
		return `⚠ native engine SIGSEGV in ${grammar} — last kind attempted: '${lastKind ?? '<unknown>'}'`;
	}
	if (status === 'error') {
		return `${grammar}: child process failed (exit ${exitCode ?? '?'}, signal ${signal ?? 'none'})`;
	}
	return output;
}

/**
 * Resolve the tsx CLI entry point path for spawning a child process.
 * Returns the tsx binary path + the cli.ts file path.
 *
 * From packages/validator/src/commands.ts:
 *   ../../..  = repo root  (validator/src/ → validator/ → packages/ → root)
 */
export function resolveCliEntryArgs(): { tsxBin: string; cliPath: string } {
	// tsx is in node_modules/.bin relative to the repo root.
	// import.meta.url is the current file; ../../.. from commands.ts reaches root.
	const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
	const cliPath = `${repoRoot}/packages/cli/src/cli.ts`;
	const tsxBin = `${repoRoot}/node_modules/.bin/tsx`;
	return { tsxBin, cliPath };
}

/**
 * Spawn a child process to run native validation for a single grammar.
 * Returns the child's combined output + metadata.
 */
export async function spawnIsolatedGrammarWorker(grammar: Grammar): Promise<{
	status: 'ok' | 'crashed' | 'error';
	stdout: string;
	stderr: string;
	exitCode: number | null;
	signal: NodeJS.Signals | null;
}> {
	const { tsxBin, cliPath } = resolveCliEntryArgs();
	// Build child argv: validate counts <grammar> --_isolate-worker (native-only;
	// the `validate` CLI no longer accepts --backend).
	const childArgs = [cliPath, 'validate', 'counts', grammar, '--_isolate-worker'];

	return new Promise((resolve) => {
		const childEnv: NodeJS.ProcessEnv = {
			...process.env,
			SITTIR_ISOLATE_WORKER: '1'
		};
		const child = spawn(tsxBin, childArgs, {
			env: childEnv,
			stdio: ['ignore', 'pipe', 'pipe']
		});

		let stdout = '';
		let stderr = '';
		child.stdout?.on('data', (chunk: Buffer) => {
			stdout += chunk.toString();
		});
		child.stderr?.on('data', (chunk: Buffer) => {
			stderr += chunk.toString();
		});

		child.on('close', (exitCode, signal) => {
			const isSigsegv = exitCode === 139 || signal === 'SIGSEGV';
			const status = isSigsegv ? 'crashed' : exitCode === 0 ? 'ok' : 'error';
			resolve({ status, stdout, stderr, exitCode, signal });
		});
		// Without an `error` handler the Promise hangs if `spawn` itself fails
		// (missing tsx binary, EACCES, …) — `close` never fires in that case.
		// Resolve as 'error' so the parent reports it and continues.
		child.on('error', (err: Error) => {
			resolve({
				status: 'error',
				stdout,
				stderr: `${stderr}\n[spawn error] ${err.message}`,
				exitCode: null,
				signal: null
			});
		});
	});
}

/**
 * Read `packages/<grammar>/.sittir/grammar-diagnostics.json` (written by
 * codegen's `writeGrammarDiagnosticsJson`, Task 13) and normalize each entry
 * into a `GrammarDiagnosticEntry` for the unified validation report.
 *
 * The on-disk shape is the real `GrammarDiagnostic | CompilerDiagnostic`
 * union (`packages/codegen/src/types/diagnostics.ts`) — it has NO `location`
 * field. `location` is derived here from `ownerKind`/`slotName`: `ownerKind`
 * alone when `slotName` is absent, `${ownerKind}.${slotName}` when both are
 * present, `undefined` when neither is.
 *
 * Returns an empty array (rather than throwing) ONLY when the file doesn't
 * exist for a grammar — `gen` may not have been re-run for every grammar
 * since Task 13 landed, and that absence is expected/skippable. A file that
 * DOES exist but fails to read or parse (truncated write, permission error,
 * corrupt JSON, …) is a real error — silently folding that into "no
 * diagnostics" would recreate the exact silent-drop behavior this report is
 * meant to eliminate, and could make a successful validation run overwrite
 * the report without any grammar entries. Surface it loudly instead, as a
 * synthetic `GrammarDiagnosticEntry` carrying the file path — consistent
 * with how `runCountsCli` already surfaces whole-grammar collection
 * failures as synthetic entries rather than throwing out of the report loop.
 */
export function readGrammarDiagnosticsEntries(grammar: Grammar): GrammarDiagnosticEntry[] {
	const path = resolvePath(join('packages', grammar, '.sittir', 'grammar-diagnostics.json'));
	if (!existsSync(path)) return [];
	try {
		const raw = JSON.parse(readFileSync(path, 'utf8')) as ReadonlyArray<{
			code: string;
			severity: 'error' | 'warning' | 'info' | 'fail';
			message: string;
			proposal?: string;
			ownerKind?: string;
			slotName?: string;
		}>;
		return raw.map((d) => {
			const location = d.ownerKind ? (d.slotName ? `${d.ownerKind}.${d.slotName}` : d.ownerKind) : undefined;
			return { code: d.code, severity: d.severity, location, message: d.message, proposal: d.proposal };
		});
	} catch (e) {
		return [
			{
				code: 'grammar-diagnostics-read-error',
				severity: 'error',
				location: path,
				message: `Failed to read/parse grammar diagnostics file at ${path}: ${(e as Error).message}`
			}
		];
	}
}

/**
 * Collect every stage's FULL (unbounded) failure list from a `GrammarCounts`
 * result — i.e. before `formatFirstFailures` truncates to
 * `SITTIR_VALIDATOR_MAX_FAILURES` for the stdout printout — tagged per stage
 * for the unified validation report.
 *
 * Each pushed entry carries its own real `code` (one distinct code per
 * distinct failure kind, named after the `stage` it came from) and
 * `severity`, rather than a single hardcoded bucket code/severity being
 * synthesized downstream in `buildValidationReportEntries`. Coverage issues
 * (`counts.coverage.issues`) and the read-render-parse-shallow AST
 * mismatches are included here too — both were previously missing from this
 * collector entirely.
 */
export function collectValidatorFailuresForGrammar(counts: GrammarCounts): ValidatorDiagnostic[] {
	const { from, coverage, readRenderParse, readRenderParseShallow, factoryRenderParse } = counts;
	const failures: ValidatorDiagnostic[] = [];
	for (const e of from.errors)
		failures.push({ stage: 'from', code: 'from-error', severity: 'error', label: e.kind, message: e.message });
	for (const e of readRenderParse.errors)
		failures.push({
			stage: 'read-render-parse',
			code: 'read-render-parse-error',
			severity: 'error',
			label: e.name,
			message: e.message
		});
	for (const m of readRenderParse.astMismatches)
		failures.push({
			stage: 'read-render-parse-ast-mismatch',
			code: 'read-render-parse-ast-mismatch',
			severity: 'error',
			label: m.name,
			message: m.message
		});
	for (const e of readRenderParseShallow.errors)
		failures.push({
			stage: 'read-render-parse-shallow',
			code: 'read-render-parse-shallow-error',
			severity: 'error',
			label: e.name,
			message: e.message
		});
	for (const m of readRenderParseShallow.astMismatches)
		failures.push({
			stage: 'read-render-parse-shallow-ast-mismatch',
			code: 'read-render-parse-shallow-ast-mismatch',
			severity: 'error',
			label: m.name,
			message: m.message
		});
	for (const e of factoryRenderParse.errors)
		failures.push({
			stage: 'factory-render-parse',
			code: 'factory-render-parse-error',
			severity: 'error',
			label: e.entry ? `${e.entry} (${e.kind})` : e.kind,
			message: e.message
		});
	for (const m of factoryRenderParse.astMismatches)
		failures.push({
			stage: 'factory-render-parse-ast-mismatch',
			code: 'factory-render-parse-ast-mismatch',
			severity: 'error',
			label: m.entry ? `${m.entry} (${m.kind})` : m.kind,
			message: m.message
		});
	// `literal-leak` issues are a heuristic near-miss surfaced for visibility
	// (a suspicious doubled-punctuation run), not a hard structural failure
	// like `missing-field` — tag them 'warning' rather than folding every
	// coverage issue into the same 'error' bucket the rest of this collector
	// uses.
	for (const issue of coverage.issues)
		failures.push({
			stage: 'coverage',
			code: `coverage-${issue.type}`,
			severity: issue.type === 'literal-leak' ? 'warning' : 'error',
			label: issue.kind,
			message: issue.message
		});
	return failures;
}

/**
 * Prefix for the single-line JSON blob an isolation worker prints to stdout
 * carrying its `ValidatorDiagnostic[]` for the one grammar it validated. The
 * parent (`runCountsCli`'s isolate branch) extracts and strips this line
 * from the forwarded child stdout, then merges it into the unified report —
 * see `extractIsolateReportJson`.
 */
const ISOLATE_REPORT_JSON_PREFIX = '[isolate-report-json] ';

/**
 * Extract an isolation worker's `[isolate-report-json] <json>` line (if
 * present) from its captured stdout, returning the parsed
 * `ValidatorDiagnostic[]` and the remaining stdout with that line removed
 * (so the human-readable forwarded output stays clean).
 */
export function extractIsolateReportJson(stdout: string): {
	entries: ValidatorDiagnostic[];
	remaining: string;
} {
	const lines = stdout.split('\n');
	let entries: ValidatorDiagnostic[] = [];
	const kept: string[] = [];
	for (const line of lines) {
		if (line.startsWith(ISOLATE_REPORT_JSON_PREFIX)) {
			try {
				entries = JSON.parse(line.slice(ISOLATE_REPORT_JSON_PREFIX.length)) as ValidatorDiagnostic[];
			} catch {
				// Malformed/partial line — leave entries empty; the crashed/error
				// branches already cover missing-report cases with a synthetic entry.
			}
		} else {
			kept.push(line);
		}
	}
	return { entries, remaining: kept.join('\n') };
}

/**
 * Merge Task 13's per-grammar static grammar diagnostics with the full
 * (unbounded) validator failure lists collected for `grammars` into one
 * persisted, structured `validation-report.json`. Shared by both the
 * isolate and non-isolate `runCountsCli` paths so there is exactly one
 * merge+write call site (previously each isolation worker wrote its own
 * report, so only the last worker's single-grammar report survived).
 *
 * `packages/tools/validation-report.json` is a deliberately git-tracked
 * artifact (like `test-fixtures.json`) — it is committed after each
 * validation run so reviewers can diff diagnostic drift, not a stray
 * runtime file.
 */
export function writeMergedValidationReport(
	grammars: readonly Grammar[],
	validatorFailuresByGrammar: Readonly<Record<string, readonly ValidatorDiagnostic[]>>
): void {
	if (grammars.length === 0) return;
	const grammarDiagnosticsByGrammar: Record<string, GrammarDiagnosticEntry[]> = {};
	for (const grammar of grammars) grammarDiagnosticsByGrammar[grammar] = readGrammarDiagnosticsEntries(grammar);
	const reportEntries = buildValidationReportEntries(grammarDiagnosticsByGrammar, validatorFailuresByGrammar);
	writeValidationReport(reportEntries, resolvePath(join('packages', 'tools', 'validation-report.json')));
}

/** Exported entry: counts subcommand — prints raw pass/total for all four validators. */
export async function runCountsCli(
	args: string[],
	backendMode: CliBackend = 'native',
	options: { recursive?: boolean; isolate?: boolean; isolateWorker?: boolean } = {}
): Promise<void> {
	const { isolate = false, isolateWorker = false } = options;

	// When running as an isolation worker, activate the progress breadcrumb
	// env var so that read-render-parse.ts emits per-kind lines to stderr.
	if (isolateWorker) {
		process.env['SITTIR_ISOLATE_WORKER'] = '1';
	}

	const grammars = resolveGrammars(args);
	const recorded: string[] = [];

	// Isolation mode: spawn one child process per grammar (native backend only).
	// Non-native backends are still run in-process (no segfault risk).
	if (isolate && backendMode === 'native') {
		let anyCrashed = false;
		// Each worker validates exactly one grammar and (per the ISOLATE_REPORT_JSON_PREFIX
		// seam below) reports its ValidatorDiagnostic[] back to this parent instead of
		// writing validation-report.json itself — every spawned worker previously called
		// writeMergedValidationReport (well, its predecessor) independently, so only the
		// LAST worker's single-grammar report survived on disk. The parent now collects
		// every worker's (or crash's) entries and performs exactly one merged write below.
		const validatorFailuresByGrammar: Record<string, ValidatorDiagnostic[]> = {};
		for (const grammar of grammars) {
			const result = await spawnIsolatedGrammarWorker(grammar);
			if (result.status === 'ok') {
				const { entries, remaining } = extractIsolateReportJson(result.stdout);
				if (remaining) process.stdout.write(remaining);
				validatorFailuresByGrammar[grammar] = entries;
				// The worker appended its history row but skipped commit
				// (isolateWorker); record it so the parent commits once below.
				recorded.push(`${grammar}/${formatBackendLabel('native')}`);
			} else if (result.status === 'crashed') {
				anyCrashed = true;
				const lastKind = parseLastIsolateProgress(result.stderr);
				const msg = formatIsolateGrammarSummary(grammar, 'crashed', '', lastKind, result.exitCode, result.signal);
				console.log(msg);
				validatorFailuresByGrammar[grammar] = [
					{
						stage: 'collect',
						code: 'grammar-collection-failure',
						severity: 'error',
						label: grammar,
						message: `native engine SIGSEGV — last kind attempted: '${lastKind ?? '<unknown>'}'`
					}
				];
			} else {
				// Non-zero, non-crash exit.
				const msg = formatIsolateGrammarSummary(grammar, 'error', '', null, result.exitCode, result.signal);
				console.log(msg);
				if (result.stdout) process.stdout.write(result.stdout);
				validatorFailuresByGrammar[grammar] = [
					{
						stage: 'collect',
						code: 'grammar-collection-failure',
						severity: 'error',
						label: grammar,
						message: `isolation worker child process failed (exit ${result.exitCode ?? '?'}, signal ${result.signal ?? 'none'})`
					}
				];
			}
		}
		// Single commit in the parent covering every worker that appended a row —
		// the isolate-worker children skip commitHistory, so without this the rows
		// stay uncommitted and break the single-commit-per-invocation contract.
		if (recorded.length > 0 && !isolateWorker) {
			commitHistory(`chore(validator): record validation run (${recorded.join(', ')})`);
		}
		// One merged write covering every grammar attempted (ok, crashed, and
		// error alike) — mirrors the non-isolate path's write-on-attempt policy.
		writeMergedValidationReport(grammars, validatorFailuresByGrammar);
		if (anyCrashed) {
			process.exitCode = 1;
		}
		return;
	}

	const validatorFailuresByGrammar: Record<string, ValidatorDiagnostic[]> = {};
	for (const backend of resolveBackends(backendMode)) {
		for (const grammar of grammars) {
			try {
				const counts = await collectGrammarCounts(grammar, backend);
				appendHistory(toValidationRun(counts));
				recorded.push(`${grammar}/${formatBackendLabel(backend)}`);
				console.log(formatGrammarCounts(counts));
				validatorFailuresByGrammar[grammar] = collectValidatorFailuresForGrammar(counts);
			} catch (e) {
				console.log(`${grammar}/${formatBackendLabel(backend)}: ERROR ${(e as Error).message}`);
				// Whole-grammar collection failure: still surface it in the persisted
				// report (validatorFailuresByGrammar) even though we deliberately skip
				// appendHistory/recorded.push — history is meant to record successful
				// validation runs, not failures.
				validatorFailuresByGrammar[grammar] = [
					...(validatorFailuresByGrammar[grammar] ?? []),
					{
						stage: 'collect',
						code: 'grammar-collection-failure',
						severity: 'error',
						label: grammar,
						message: (e as Error).message
					}
				];
			}
		}
	}
	// Unified validation report (Task 14): merge Task 13's per-grammar static
	// grammar diagnostics with the full (unbounded) validator failure lists
	// collected above into a single persisted, structured artifact. Purely
	// additive — does not alter any existing stdout/stderr output above.
	// Write the report whenever any grammar was ATTEMPTED — not only when at
	// least one succeeded. Gating this on `recorded.length > 0` meant a run
	// where every requested grammar failed left a stale prior report file on
	// disk looking like nothing went wrong, even though
	// `validatorFailuresByGrammar` already has the synthetic collect-failure
	// entries to report. History (below) stays gated on `recorded.length`
	// since it should only record successful runs.
	//
	// Isolate-worker children are a single-grammar SLICE of the overall run —
	// they must NOT write validation-report.json themselves (that was Finding
	// #4: each worker overwrote the whole report, so only the last worker's
	// single-grammar report survived). Instead, report entries back to the
	// parent via a dedicated stdout line; the parent merges every worker's
	// entries and performs the one real write (see the `isolate` branch above
	// and `extractIsolateReportJson`).
	if (isolateWorker) {
		for (const grammar of grammars) {
			console.log(`${ISOLATE_REPORT_JSON_PREFIX}${JSON.stringify(validatorFailuresByGrammar[grammar] ?? [])}`);
		}
	} else {
		writeMergedValidationReport(grammars, validatorFailuresByGrammar);
	}
	// One commit per validation invocation covering every row just appended —
	// keeps history reliably captured without a commit per grammar. Best-effort
	// and self-guarding (see commitHistory). SKIP in isolate-worker children:
	// each spawned worker would otherwise run its own `git commit`, spamming
	// one commit per grammar and diverging from the single-commit-per-invocation
	// contract — the parent (non-worker) invocation records history once.
	if (recorded.length > 0 && !isolateWorker) {
		commitHistory(`chore(validator): record validation run (${recorded.join(', ')})`);
	}
}

/** Exported entry: probe-factory subcommand — error-bucket diagnostics for factory-render-parse. */
export async function runProbeFactoryCli(args: string[], backendMode: CliBackend = 'native'): Promise<void> {
	const grammars = resolveGrammars(args);
	for (const backend of resolveBackends(backendMode)) {
		for (const grammar of grammars) {
			try {
				await grammarProbeFactory(grammar, backend);
			} catch (e) {
				console.log(`${grammar}/${formatBackendLabel(backend)}: ERROR ${(e as Error).message}`);
			}
		}
	}
}

/** Exported entry: history subcommand — prints last N validation runs. */
export function runHistoryCli(args: string[]): void {
	const n = parseInt(args.find((a) => /^\d+$/.test(a)) ?? '10', 10);
	const runs = readHistory().slice(-n);
	if (runs.length === 0) {
		console.log('No validation history found.');
		return;
	}
	console.log(`Last ${runs.length} validation run(s):\n`);
	for (const r of runs) {
		console.log(
			`${r.ts}  ${r.grammar}/${r.backend}` +
				`  from=${r.fromPass}/${r.fromTotal}` +
				`  cov=${r.covPass}/${r.covTotal}` +
				`  read-render-parse=${r.readRenderParsePass}/${r.readRenderParseTotal}` +
				`  read-render-parse-shallow=${r.readRenderParseShallowPass}/${r.readRenderParseShallowTotal}` +
				`  factory-render-parse=${r.factoryRenderParsePass}/${r.factoryRenderParseTotal}`
		);
	}
}

export async function runTraceRtCli(
	grammar: Grammar,
	backend: Backend,
	options: { recursive?: boolean } = {}
): Promise<void> {
	const templatesPath = defaultTemplatesPath(grammar);
	let failure: ReadRenderParseFailure | undefined;
	await loadValidateReadRenderParse()(grammar, templatesPath, {
		backend,
		recursive: options.recursive,
		stopOnFirstFailure: true,
		onFailure: (next) => {
			if (!failure) failure = next;
		}
	});
	if (!failure) {
		console.log(`${grammar}/${formatBackendLabel(backend)}: no RT failure found`);
		return;
	}
	const trace = await loadProbeTrace()(grammar, failure.entrySource, {
		range: failure.range
	});
	console.log(
		JSON.stringify(
			{
				failure,
				trace
			},
			null,
			2
		)
	);
}

export function loadProbeTrace(): ProbeTraceFn {
	const specifier = new URL('./probe/kind.ts', import.meta.url).href;
	let cached: ProbeTraceFn | undefined;
	return ((grammar, source, opts) => {
		if (cached) return cached(grammar, source, opts);
		return import(specifier).then((mod) => {
			cached = (mod as { probeTrace: ProbeTraceFn }).probeTrace;
			return cached(grammar, source, opts);
		});
	}) satisfies ProbeTraceFn;
}

export function loadValidateReadRenderParse(): ValidateReadRenderParseFn {
	const specifier = new URL('./validate/read-render-parse.ts', import.meta.url).href;
	let cached: ValidateReadRenderParseFn | undefined;
	return ((grammar, templatesPath, options) => {
		if (cached) return cached(grammar, templatesPath, options);
		return import(specifier).then((mod) => {
			cached = (mod as { validateReadRenderParse: ValidateReadRenderParseFn }).validateReadRenderParse;
			return cached(grammar, templatesPath, options);
		});
	}) satisfies ValidateReadRenderParseFn;
}
