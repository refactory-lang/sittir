/**
 * Append-only JSONL history for `vitest run` results — the vitest-suite
 * counterpart to `history.ts`'s validation-run history. Lets a session ask
 * "did this test already fail before my change?" by reading a prior
 * `record` entry's `failedTestFiles` instead of re-running the full suite
 * against a second worktree/branch checkout.
 *
 * Consumers call `appendTestHistory(entry)` after each full `vitest run`
 * and `readTestHistory()` to inspect past runs.
 */

import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** One row in `test-history.jsonl`. */
export interface TestRun {
	/** ISO-8601 timestamp of the run. */
	ts: string;
	/** Current branch name at record time (`git rev-parse --abbrev-ref HEAD`). */
	branch: string;
	/** Current commit SHA at record time. */
	commit: string;
	numTotalTestFiles: number;
	numFailedTestFiles: number;
	numTotalTests: number;
	numPassedTests: number;
	numFailedTests: number;
	numPendingTests: number;
	numTodoTests: number;
	/** Repo-relative paths of every test file with at least one failing test. */
	failedTestFiles: string[];
}

/**
 * Resolve the history file path. Evaluated at call time so tests can override
 * it via the `SITTIR_TEST_HISTORY_PATH` environment variable without
 * requiring a module reload.
 */
function getTestHistoryPath(): string {
	return (
		process.env['SITTIR_TEST_HISTORY_PATH'] ??
		resolve(fileURLToPath(new URL('..', import.meta.url)), 'test-history.jsonl')
	);
}

/** Return true when a parsed JSONL line represents a real `TestRun`. */
function isTestRun(entry: unknown): entry is TestRun {
	if (typeof entry !== 'object' || entry === null) return false;
	return !('schema' in entry) && typeof (entry as { ts?: unknown })['ts'] === 'string';
}

/** Append a single test run entry to the history file. */
export function appendTestHistory(entry: TestRun): void {
	appendFileSync(getTestHistoryPath(), JSON.stringify(entry) + '\n', 'utf8');
}

/**
 * Best-effort commit of the history file, scoped to just that path — same
 * contract as `history.ts`'s `commitHistory` (see its doc comment for the
 * full rationale). Never disrupts the calling test run: no-ops when
 * `SITTIR_TEST_HISTORY_PATH` is set (tests/scratch locations),
 * `SITTIR_HISTORY_NO_COMMIT=1` is set (CI, bisects, demos),
 * `SITTIR_INTERNAL_CODEGEN_RUN=1` is set (codegen-internal runs own their
 * own commit boundaries), or any git operation fails (no repo, mid-rebase,
 * nothing to commit, git absent).
 */
export function commitTestHistory(message: string): void {
	if (process.env['SITTIR_TEST_HISTORY_PATH']) return;
	if (process.env['SITTIR_HISTORY_NO_COMMIT'] === '1') return;
	if (process.env['SITTIR_INTERNAL_CODEGEN_RUN'] === '1') return;
	const path = getTestHistoryPath();
	try {
		execFileSync('git', ['commit', '--no-verify', '-m', message, '--', path], {
			cwd: dirname(path),
			stdio: 'ignore'
		});
	} catch {
		// Best-effort: capturing history must never fail the calling run.
	}
}

/** Read all past test runs from the history file, skipping non-run lines (e.g. schema headers). */
export function readTestHistory(): TestRun[] {
	const path = getTestHistoryPath();
	if (!existsSync(path)) return [];
	return readFileSync(path, 'utf8')
		.split('\n')
		.filter((line) => line.trim() && !line.startsWith('//'))
		.map((line) => JSON.parse(line) as unknown)
		.filter(isTestRun);
}

/** Resolve the absolute path to the history file (useful for tooling). */
export function testHistoryPath(): string {
	return getTestHistoryPath();
}
