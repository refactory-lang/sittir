import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';

import type { VitestJsonReport, VitestJsonTestResult } from '../src/scripts/record-test-run.ts';
import { compareFailures } from '../src/scripts/test-failures.ts';

const abs = (relativePath: string): string => fileURLToPath(new URL(`../../../${relativePath}`, import.meta.url));

function file(relativePath: string, failing: string[], passing: string[] = []): VitestJsonTestResult {
	const assertionResults = [
		...failing.map((name) => ({ status: 'failed' as const, fullName: name, failureMessages: [`boom ${name}`] })),
		...passing.map((name) => ({ status: 'passed' as const, fullName: name, failureMessages: [] }))
	];
	return {
		name: abs(relativePath),
		status: failing.length > 0 ? 'failed' : 'passed',
		message: '',
		assertionResults
	};
}

function report(testResults: VitestJsonTestResult[]): VitestJsonReport {
	const assertions = testResults.flatMap((r) => r.assertionResults);
	const numFailedTests = assertions.filter((a) => a.status === 'failed').length;
	return {
		numTotalTests: assertions.length,
		numPassedTests: assertions.length - numFailedTests,
		numFailedTests,
		numPendingTests: 0,
		numTodoTests: 0,
		testResults
	};
}

describe('compareFailures', () => {
	it('splits failures into new, fixed and unchanged by file and test name', () => {
		const older = report([
			file('packages/tools/tests/a.test.ts', ['a > one', 'a > two'], ['a > three']),
			file('packages/tools/tests/b.test.ts', ['b > gone'])
		]);
		const current = report([
			file('packages/tools/tests/a.test.ts', ['a > two', 'a > three'], ['a > one']),
			file('packages/tools/tests/c.test.ts', ['c > fresh'])
		]);
		const comparison = compareFailures(current, older);
		expect(comparison.current).toBe(3);
		expect(comparison.older).toBe(3);
		expect(comparison.unchanged).toBe(1);
		expect(comparison.new).toEqual([
			'packages/tools/tests/a.test.ts | a > three',
			'packages/tools/tests/c.test.ts | c > fresh'
		]);
		expect(comparison.fixed).toEqual([
			'packages/tools/tests/a.test.ts | a > one',
			'packages/tools/tests/b.test.ts | b > gone'
		]);
	});

	it('keys a failed file with no failing assertion by its first message line', () => {
		const broken = (message: string): VitestJsonTestResult => ({
			name: abs('packages/tools/tests/setup.test.ts'),
			status: 'failed',
			message,
			assertionResults: []
		});
		const comparison = compareFailures(
			{ ...report([broken('Cannot find module x\nmore')]), numFailedTests: 0 },
			{ ...report([broken('Cannot find module x')]), numFailedTests: 0 }
		);
		expect(comparison.new).toEqual([]);
		expect(comparison.fixed).toEqual([]);
		expect(comparison.unchanged).toBe(1);
	});

	it('refuses a report that repeats a failure key', () => {
		const repeated = report([file('packages/tools/tests/a.test.ts', ['a > one', 'a > one'])]);
		expect(() => compareFailures(repeated, report([]))).toThrow(/duplicate failure key in the current report/);
	});

	it('refuses a report whose failure count disagrees with numFailedTests', () => {
		const inconsistent = { ...report([file('packages/tools/tests/a.test.ts', ['a > one'])]), numFailedTests: 2 };
		expect(() => compareFailures(inconsistent, report([]))).toThrow(/do not match numFailedTests/);
	});
});
