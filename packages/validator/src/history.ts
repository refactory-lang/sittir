/**
 * Append-only JSONL history for validation runs.
 *
 * Each entry is one JSON line. The file is checked into git so that
 * pass/fail trends are visible in code review.
 *
 * Consumers call `appendHistory(entry)` after each full validation run
 * and `readHistory()` to inspect past runs.
 */

import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Grammar, Backend } from './run.ts';

/** One row in `validation-history.jsonl`. */
export interface ValidationRun {
	/** ISO-8601 timestamp of the run. */
	ts: string;
	grammar: Grammar;
	backend: Backend;
	fromPass: number;
	fromTotal: number;
	covPass: number;
	covTotal: number;
	readRenderParsePass: number;
	readRenderParseTotal: number;
	readRenderParseAstMatchPass: number;
	readRenderParseShallowPass: number;
	readRenderParseShallowTotal: number;
	readRenderParseShallowAstMatchPass: number;
	factoryRenderParsePass: number;
	factoryRenderParseTotal: number;
	factoryRenderParseAstMatchPass: number;
	/** Legacy pre-rename fields kept optional for older rows. */
	rtPass?: number;
	rtTotal?: number;
	rtAstMatchPass?: number;
	factoryPass?: number;
	factoryTotal?: number;
	factoryAstMatchPass?: number;
}

/**
 * Resolve the history file path. Evaluated at call time so tests can override
 * it via the `SITTIR_HISTORY_PATH` environment variable without requiring a
 * module reload.
 */
function getHistoryPath(): string {
	return (
		process.env['SITTIR_HISTORY_PATH'] ??
		resolve(fileURLToPath(new URL('..', import.meta.url)), 'validation-history.jsonl')
	);
}

/** Return true when a parsed JSONL line represents a real `ValidationRun`. */
function isValidationRun(entry: unknown): entry is ValidationRun {
	if (typeof entry !== 'object' || entry === null) return false;
	return !('schema' in entry) && typeof (entry as { ts?: unknown })['ts'] === 'string';
}

/** Append a single validation run entry to the history file. */
export function appendHistory(entry: ValidationRun): void {
	appendFileSync(getHistoryPath(), JSON.stringify(entry) + '\n', 'utf8');
}

/**
 * Best-effort commit of the history file, scoped to just that path, called at
 * the END of a validation run (not per-append). Feature commits stage named
 * paths, so without this the appended rows are stranded as unstaged changes
 * and only land in git when some later commit happens to sweep them in — which
 * is how validation history silently went uncaptured.
 *
 * This must never disrupt a validation run, so it no-ops in every situation
 * where committing would be wrong or impossible:
 *   - SITTIR_HISTORY_PATH set — tests / custom locations; the target may be a
 *     scratch file outside any repo,
 *   - SITTIR_HISTORY_NO_COMMIT=1 — explicit opt-out (CI, bisects, demos),
 *   - SITTIR_INTERNAL_CODEGEN_RUN=1 — codegen-internal validation; codegen
 *     owns its own commit boundaries,
 *   - any git failure (no repo, mid-rebase, nothing to commit, git absent) is
 *     swallowed.
 *
 * `git commit -- <path>` is a partial commit: it records only the working-tree
 * state of that one path, so it never sweeps in unrelated in-progress work.
 * `--no-verify` is deliberate: validation-history.jsonl is not a generated
 * artifact (it lives outside the codegen manifest's tracked roots), so the
 * manifest pre-commit gate — routinely red during active codegen work, which
 * is exactly when validations run — does not govern it and must not block it.
 */
export function commitHistory(message: string): void {
	if (process.env['SITTIR_HISTORY_PATH']) return;
	if (process.env['SITTIR_HISTORY_NO_COMMIT'] === '1') return;
	if (process.env['SITTIR_INTERNAL_CODEGEN_RUN'] === '1') return;
	const path = getHistoryPath();
	try {
		execFileSync('git', ['commit', '--no-verify', '-m', message, '--', path], {
			cwd: dirname(path),
			stdio: 'ignore'
		});
	} catch {
		// Best-effort: capturing history must never fail the validation run.
	}
}

/** Read all past validation runs from the history file, skipping non-run lines (e.g. schema headers). */
export function readHistory(): ValidationRun[] {
	const path = getHistoryPath();
	if (!existsSync(path)) return [];
	return readFileSync(path, 'utf8')
		.split('\n')
		.filter((line) => line.trim() && !line.startsWith('//'))
		.map((line) => JSON.parse(line) as unknown)
		.filter(isValidationRun);
}

/** Resolve the absolute path to the history file (useful for tooling). */
export function historyPath(): string {
	return getHistoryPath();
}
