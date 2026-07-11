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
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
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

interface VitestJsonReport {
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
		// common case here (we're recording state, not gating on it), so
		// the exit code is deliberately ignored; only a thrown spawn error
		// (vitest itself missing/crashing) should propagate.
		try {
			execFileSync('pnpm', ['exec', 'vitest', 'run', '--reporter=json', `--outputFile=${outputFile}`], {
				cwd: REPO_ROOT,
				stdio: 'ignore'
			});
		} catch {
			// non-zero exit from failing tests is expected; fall through to read the report
		}
		return JSON.parse(readFileSync(outputFile, 'utf8')) as VitestJsonReport;
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
	const history = readTestHistory();
	const previous = history[history.length - 1];

	const report = runVitestJson();
	const failedTestFiles = report.testResults
		.filter((r) => r.status === 'failed')
		.map((r) => relative(REPO_ROOT, r.name))
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

	const previousFailing = new Set(previous?.failedTestFiles ?? []);
	const currentFailing = new Set(failedTestFiles);
	const newlyFailing = failedTestFiles.filter((f) => !previousFailing.has(f));
	const newlyFixed = [...previousFailing].filter((f) => !currentFailing.has(f)).sort();

	return { entry, previous, newlyFailing, newlyFixed };
}

function formatReport(result: TestRunResult): string {
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
