/**
 * record-test-run.ts
 *
 * Runs the full `vitest run` suite, records a summary row to
 * `test-history.jsonl` (via `test-history.ts`, mirroring the validator's
 * `history.ts`), and reports the diff against the previous recorded run —
 * newly-failing and newly-fixed test files.
 *
 * This replaces the "spin up a second worktree / stash to HEAD and re-run
 * the whole suite" pattern for answering "did this failure predate my
 * change?" — read the last entry's `failedTestFiles` instead.
 *
 * Importable surface: `recordTestRun(): Promise<TestRunResult>`. The CLI
 * wrapper (bottom of file) calls the same function and prints the report.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { appendTestHistory, commitTestHistory, readTestHistory, type TestRun } from '../test-history.ts';

const REPO_ROOT = fileURLToPath(new URL('../../../..', import.meta.url));

interface VitestJsonAssertionResult {
	status: 'passed' | 'failed' | 'skipped' | 'pending' | 'todo';
}

interface VitestJsonTestResult {
	name: string;
	status: 'passed' | 'failed';
	assertionResults: VitestJsonAssertionResult[];
}

export interface VitestJsonReport {
	numTotalTests: number;
	numPassedTests: number;
	numFailedTests: number;
	numPendingTests: number;
	numTodoTests: number;
	testResults: VitestJsonTestResult[];
}

function gitOutput(args: string[]): string {
	return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
}

function runVitestJson(): VitestJsonReport {
	const scratchDir = mkdtempSync(join(tmpdir(), 'sittir-test-history-'));
	const outputFile = join(scratchDir, 'report.json');
	try {
		// vitest run exits non-zero when tests fail — that's the expected,
		// common case here (we're recording state, not gating on it), so a
		// non-zero exit alone is not re-thrown. But a real spawn/crash
		// failure (vitest itself missing, pnpm not found, an uncaught crash
		// before the JSON reporter writes anything, or a run-level failure
		// like "no test files found" that still emits a report) needs to
		// surface instead of silently recording a misleading 0-failure row.
		let spawnError: unknown;
		try {
			execFileSync('pnpm', ['exec', 'vitest', 'run', '--reporter=json', `--outputFile=${outputFile}`], {
				cwd: REPO_ROOT,
				stdio: 'ignore'
			});
		} catch (e) {
			spawnError = e;
		}
		if (!existsSync(outputFile)) {
			throw new Error(
				`vitest did not produce a JSON report at ${outputFile} — the run likely crashed before writing it.`,
				{ cause: spawnError }
			);
		}
		const report = JSON.parse(readFileSync(outputFile, 'utf8')) as VitestJsonReport;
		// A non-zero exit with zero reported test failures AND no failed
		// files means the exit wasn't caused by ordinary test failures
		// (e.g. no test files discovered, a config error) — the report
		// itself can't explain the exit, so trust the process failure over
		// the report. A file-level collection/setup failure (an import
		// error, a throwing beforeAll) marks that file's testResults[]
		// status as 'failed' but contributes nothing to numFailedTests
		// (which counts individual assertions, not files) — check both so
		// that case is correctly treated as a real failing file, not a
		// run-level failure to discard.
		const hasFailedFile = report.testResults.some((r) => r.status === 'failed');
		if (spawnError !== undefined && report.numFailedTests === 0 && !hasFailedFile) {
			throw new Error('vitest exited non-zero but reported no failing tests — a run-level failure, not test failures.', {
				cause: spawnError
			});
		}
		return report;
	} finally {
		rmSync(scratchDir, { recursive: true, force: true });
	}
}

export interface TestRunResult {
	entry: TestRun;
	previous: TestRun | undefined;
	newlyFailing: string[];
	newlyFixed: string[];
}

/** Run the full suite once, record it, and diff against the last recorded run. */
export async function recordTestRun(): Promise<TestRunResult> {
	return recordFromReport(runVitestJson());
}

/**
 * Record an already-produced vitest JSON report and diff it against the
 * last recorded run — no vitest invocation of its own. Shared by
 * `recordTestRun` (spawns a fresh run) and `scripts/test-and-record.ts`
 * (reads the JSON reporter's side artifact from a run that already
 * happened, avoiding a second full suite run).
 */
export async function recordFromReport(report: VitestJsonReport): Promise<TestRunResult> {
	const history = readTestHistory();
	const previous = history[history.length - 1];

	const failedTestFiles = report.testResults
		.filter((r) => r.status === 'failed')
		// `relative()` emits backslashes on Windows; normalize to posix
		// separators so history rows are comparable across platforms.
		.map((r) => relative(REPO_ROOT, r.name).split(sep).join('/'))
		.sort();

	const entry: TestRun = {
		ts: new Date().toISOString(),
		branch: gitOutput(['rev-parse', '--abbrev-ref', 'HEAD']),
		commit: gitOutput(['rev-parse', 'HEAD']),
		// `numTotalTestSuites`/`numFailedTestSuites` count each top-level
		// `describe()` block, not files (a single file with 3 describes
		// reports numTotalTestSuites=3) — derive file counts from
		// `testResults` itself, consistent with `failedTestFiles` above.
		numTotalTestFiles: report.testResults.length,
		numFailedTestFiles: failedTestFiles.length,
		numTotalTests: report.numTotalTests,
		numPassedTests: report.numPassedTests,
		numFailedTests: report.numFailedTests,
		numPendingTests: report.numPendingTests,
		numTodoTests: report.numTodoTests,
		failedTestFiles
	};

	appendTestHistory(entry);
	commitTestHistory(`chore(tests): record test run (${entry.numFailedTests} failed / ${entry.numTotalTests} total)`);

	// With no previous run there's no baseline to diff against — every
	// currently-failing file would otherwise show up as "newly failing"
	// (an empty previousFailing set contains none of them), which the CLI
	// wrapper would then report as a regression and exit non-zero for on
	// the very first recorded run.
	let newlyFailing: string[] = [];
	let newlyFixed: string[] = [];
	if (previous) {
		const previousFailing = new Set(previous.failedTestFiles);
		const currentFailing = new Set(failedTestFiles);
		newlyFailing = failedTestFiles.filter((f) => !previousFailing.has(f));
		newlyFixed = [...previousFailing].filter((f) => !currentFailing.has(f)).sort();
	}

	return { entry, previous, newlyFailing, newlyFixed };
}

/** Human-readable summary of a recorded run, including the diff against the previous one (if any). */
export function formatReport(result: TestRunResult): string {
	const { entry, previous, newlyFailing, newlyFixed } = result;
	const lines = [
		`Recorded: ${entry.ts}  ${entry.branch}@${entry.commit.slice(0, 8)}`,
		`Tests: ${entry.numPassedTests} passed, ${entry.numFailedTests} failed, ${entry.numPendingTests} skipped, ${entry.numTodoTests} todo (of ${entry.numTotalTests})`,
		`Test files: ${entry.numFailedTestFiles} failed of ${entry.numTotalTestFiles}`
	];
	if (!previous) {
		lines.push('No previous recorded run to diff against.');
	} else {
		lines.push(`Previous run: ${previous.ts}  ${previous.branch}@${previous.commit.slice(0, 8)}`);
		lines.push(
			newlyFailing.length > 0
				? `Newly failing (${newlyFailing.length}): ${newlyFailing.join(', ')}`
				: 'Newly failing: none'
		);
		lines.push(
			newlyFixed.length > 0 ? `Newly fixed (${newlyFixed.length}): ${newlyFixed.join(', ')}` : 'Newly fixed: none'
		);
	}
	return lines.join('\n');
}

// CLI entry: `tsx packages/tools/src/scripts/record-test-run.ts`
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
	const result = await recordTestRun();
	console.log(formatReport(result));
	if (result.newlyFailing.length > 0) process.exitCode = 1;
}
