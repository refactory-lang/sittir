/**
 * Unit tests for record-test-run.ts's recordTestRun() — mocked
 * child_process/fs/test-history, no real vitest subprocess spawned.
 * Follows the process-mocking pattern established in isolate.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:child_process', () => ({
	execFileSync: vi.fn()
}));

vi.mock('node:fs', () => ({
	existsSync: vi.fn(),
	mkdtempSync: vi.fn(() => '/fake/scratch'),
	readFileSync: vi.fn(),
	rmSync: vi.fn()
}));

vi.mock('../src/test-history.ts', () => ({
	readTestHistory: vi.fn(),
	appendTestHistory: vi.fn(),
	commitTestHistory: vi.fn()
}));

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readTestHistory, appendTestHistory, commitTestHistory } from '../src/test-history.ts';
import { recordTestRun } from '../src/scripts/record-test-run.ts';

// record-test-run.ts's REPO_ROOT resolves relative to that file's own
// location (fileURLToPath(new URL('../../../..', import.meta.url)) from
// packages/tools/src/scripts/), not process.cwd() — so it stays correct
// regardless of the invoking shell's working directory (e.g. a
// package-scoped `pnpm -F @sittir/tools test`). Mirror that here rather
// than using process.cwd(), which would only match when vitest happens to
// be invoked from the repo root.
const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const testFile = (name: string) => join(REPO_ROOT, name);

const GIT_ARGS_BRANCH = ['rev-parse', '--abbrev-ref', 'HEAD'];
const GIT_ARGS_COMMIT = ['rev-parse', 'HEAD'];

function mockGitAndVitest(vitestOutcome: { throws: boolean }, report: unknown) {
	vi.mocked(execFileSync).mockImplementation((cmd, args) => {
		if (cmd === 'git' && (args as string[]).join(' ') === GIT_ARGS_BRANCH.join(' ')) {
			return 'feature-branch\n' as never;
		}
		if (cmd === 'git' && (args as string[]).join(' ') === GIT_ARGS_COMMIT.join(' ')) {
			return 'deadbeef1234\n' as never;
		}
		if (cmd === 'pnpm') {
			if (vitestOutcome.throws) throw new Error('vitest exited 1');
			return undefined as never;
		}
		throw new Error(`unexpected execFileSync call: ${cmd}`);
	});
	vi.mocked(existsSync).mockReturnValue(true);
	vi.mocked(readFileSync).mockReturnValue(JSON.stringify(report));
}

describe('recordTestRun', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(readTestHistory).mockReturnValue([]);
	});

	it('an ordinary failing run (non-zero exit, real failures) records successfully', async () => {
		mockGitAndVitest(
			{ throws: true },
			{
				numTotalTests: 5,
				numPassedTests: 3,
				numFailedTests: 2,
				numPendingTests: 0,
				numTodoTests: 0,
				testResults: [
					{ name: testFile('a.test.ts'), status: 'failed', assertionResults: [] },
					{ name: testFile('b.test.ts'), status: 'passed', assertionResults: [] },
					{ name: testFile('c.test.ts'), status: 'failed', assertionResults: [] }
				]
			}
		);

		const result = await recordTestRun();

		expect(result.entry.numFailedTests).toBe(2);
		expect(result.entry.numFailedTestFiles).toBe(2);
		expect(appendTestHistory).toHaveBeenCalledTimes(1);
		expect(commitTestHistory).toHaveBeenCalledTimes(1);
		// No previous run recorded (readTestHistory() returns [] by default in
		// beforeEach) — there's no baseline to diff against, so despite 2
		// current failures neither array should report them as "newly" anything.
		expect(result.newlyFailing).toEqual([]);
		expect(result.newlyFixed).toEqual([]);
	});

	it('a no-tests / run-level failure (non-zero exit, zero reported failures) rejects', async () => {
		mockGitAndVitest(
			{ throws: true },
			{
				numTotalTests: 0,
				numPassedTests: 0,
				numFailedTests: 0,
				numPendingTests: 0,
				numTodoTests: 0,
				testResults: []
			}
		);

		await expect(recordTestRun()).rejects.toThrow(/run-level failure/);
		expect(appendTestHistory).not.toHaveBeenCalled();
	});

	it('a fully green run (zero exit, zero failures) records without error', async () => {
		mockGitAndVitest(
			{ throws: false },
			{
				numTotalTests: 3,
				numPassedTests: 3,
				numFailedTests: 0,
				numPendingTests: 0,
				numTodoTests: 0,
				testResults: [{ name: testFile('a.test.ts'), status: 'passed', assertionResults: [] }]
			}
		);

		const result = await recordTestRun();
		expect(result.entry.numFailedTests).toBe(0);
		expect(appendTestHistory).toHaveBeenCalledTimes(1);
	});

	it('computes newlyFailing and newlyFixed against the previous recorded entry', async () => {
		vi.mocked(readTestHistory).mockReturnValue([
			{
				ts: '2026-01-01T00:00:00.000Z',
				branch: 'main',
				commit: 'aaaa',
				numTotalTestFiles: 2,
				numFailedTestFiles: 2,
				numTotalTests: 2,
				numPassedTests: 0,
				numFailedTests: 2,
				numPendingTests: 0,
				numTodoTests: 0,
				failedTestFiles: ['a.test.ts', 'b.test.ts']
			}
		]);
		mockGitAndVitest(
			{ throws: true },
			{
				numTotalTests: 2,
				numPassedTests: 1,
				numFailedTests: 1,
				numPendingTests: 0,
				numTodoTests: 0,
				testResults: [
					{ name: testFile('b.test.ts'), status: 'failed', assertionResults: [] },
					{ name: testFile('c.test.ts'), status: 'passed', assertionResults: [] }
				]
			}
		);

		const result = await recordTestRun();

		expect(result.newlyFixed).toEqual(['a.test.ts']);
		expect(result.newlyFailing).toEqual([]);
	});

	it('a crash before the JSON reporter writes anything (no output file) rejects with a clear diagnosis', async () => {
		vi.mocked(execFileSync).mockImplementation((cmd, args) => {
			if (cmd === 'git' && (args as string[]).join(' ') === GIT_ARGS_BRANCH.join(' ')) {
				return 'feature-branch\n' as never;
			}
			if (cmd === 'git' && (args as string[]).join(' ') === GIT_ARGS_COMMIT.join(' ')) {
				return 'deadbeef1234\n' as never;
			}
			if (cmd === 'pnpm') throw new Error('vitest binary not found');
			throw new Error(`unexpected execFileSync call: ${cmd}`);
		});
		vi.mocked(existsSync).mockReturnValue(false);

		await expect(recordTestRun()).rejects.toThrow(/did not produce a JSON report/);
		expect(readFileSync).not.toHaveBeenCalled();
		expect(appendTestHistory).not.toHaveBeenCalled();
	});
});
