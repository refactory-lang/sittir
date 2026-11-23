import { describe, it, expect } from 'vitest';

import type { VitestJsonReport, VitestJsonTestResult } from '../src/scripts/record-test-run.ts';
import { compareFailures, summarizeFailures } from '../src/scripts/test-failures.ts';

import { fixtureFile } from './support/checkout-fixture.ts';

const FILE = 'packages/tools/tests/suite.test.ts';

function suite(options: { failedTests: string[]; message?: string; status?: 'passed' | 'failed' }): VitestJsonTestResult {
	return {
		name: fixtureFile(FILE),
		status: options.status ?? (options.message || options.failedTests.length > 0 ? 'failed' : 'passed'),
		message: options.message ?? '',
		assertionResults: options.failedTests.map((fullName) => ({
			status: 'failed' as const,
			fullName,
			failureMessages: ['assertion mismatch']
		}))
	};
}

function reportOf(testResults: VitestJsonTestResult[], success?: boolean): VitestJsonReport {
	const numFailedTests = testResults.flatMap((r) => r.assertionResults).filter((a) => a.status === 'failed').length;
	return {
		numTotalTests: testResults.flatMap((r) => r.assertionResults).length,
		numPassedTests: 0,
		numFailedTests,
		numPendingTests: 0,
		numTodoTests: 0,
		success,
		testResults
	};
}

describe('suite errors alongside failed tests', () => {
	it('counts a file with a failed test and an afterAll error as a failed test plus one file-level failure', () => {
		const summary = summarizeFailures(
			reportOf([suite({ failedTests: ['suite > one'], message: 'afterAll hook threw\nat teardown' })]),
			3
		);
		expect(summary.failures).toBe(2);
		expect(summary.failedTests).toBe(1);
		expect(summary.failedFiles).toBe(1);
	});

	it('refuses a report that says the run failed but names no failure, rather than printing zero', () => {
		expect(() => summarizeFailures(reportOf([suite({ failedTests: [] })], false), 3)).toThrow(
			/names no failing test or failed file/
		);
	});

	it('still summarizes a report that succeeded with no failures', () => {
		expect(summarizeFailures(reportOf([suite({ failedTests: [] })], true), 3).failures).toBe(0);
	});

	it('compares a file-level suite error, so the older report without it shows it as new', () => {
		const current = reportOf([suite({ failedTests: ['suite > one'], message: 'afterAll hook threw' })], false);
		const older = reportOf([suite({ failedTests: ['suite > one'] })], true);
		const comparison = compareFailures(current, older);
		expect(comparison.new).toEqual([`${FILE} | (file) afterAll hook threw`]);
		expect(comparison.fixed).toEqual([]);
		expect(comparison.unchanged).toBe(1);
	});
});
