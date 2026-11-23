import { describe, it, expect } from 'vitest';

import type { VitestJsonReport, VitestJsonTestResult } from '../src/scripts/record-test-run.ts';
import { summarizeDurations } from '../src/scripts/test-durations.ts';

import { fixtureFile as abs } from './support/checkout-fixture.ts';

function file(
	relativePath: string,
	startTime: number,
	endTime: number,
	tests: { fullName: string; duration?: number }[]
): VitestJsonTestResult {
	return {
		name: abs(relativePath),
		status: 'passed',
		message: '',
		startTime,
		endTime,
		assertionResults: tests.map((t) => ({ status: 'passed', fullName: t.fullName, failureMessages: [], duration: t.duration }))
	};
}

function report(testResults: VitestJsonTestResult[]): VitestJsonReport {
	return { numTotalTests: 0, numPassedTests: 0, numFailedTests: 0, numPendingTests: 0, numTodoTests: 0, testResults };
}

describe('summarizeDurations', () => {
	it('orders files by duration and sums them into worker time', () => {
		const summary = summarizeDurations(
			report([
				file('packages/tools/tests/a.test.ts', 1000, 1800, [{ fullName: 'a > one', duration: 300 }]),
				file('packages/tools/tests/b.test.ts', 1000, 4000, [{ fullName: 'b > slow', duration: 2500 }]),
				file('packages/tools/tests/c.test.ts', 1000, 1500, [])
			]),
			10
		);
		expect(summary.files.map((f) => [f.file, f.durationMs, f.tests])).toEqual([
			['packages/tools/tests/b.test.ts', 3000, 1],
			['packages/tools/tests/a.test.ts', 800, 1],
			['packages/tools/tests/c.test.ts', 500, 0]
		]);
		expect(summary.workerMs).toBe(4300);
	});

	it('lists the slowest tests and keeps only the requested number', () => {
		const summary = summarizeDurations(
			report([
				file('packages/tools/tests/a.test.ts', 0, 10, [
					{ fullName: 'a > fast', duration: 1 },
					{ fullName: 'a > slow', duration: 9 },
					{ fullName: 'a > skipped' }
				])
			]),
			1
		);
		expect(summary.slowestTests).toEqual([{ name: 'packages/tools/tests/a.test.ts > a > slow', durationMs: 9 }]);
	});

	it('refuses a file with no start and end time', () => {
		const untimed: VitestJsonTestResult = { ...file('packages/tools/tests/a.test.ts', 0, 0, []), startTime: undefined };
		expect(() => summarizeDurations(report([untimed]), 10)).toThrow(/has no start and end time/);
	});

	it('refuses a file that ends before it starts', () => {
		expect(() => summarizeDurations(report([file('packages/tools/tests/a.test.ts', 5, 1, [])]), 10)).toThrow(
			/ends before it starts/
		);
	});
});
