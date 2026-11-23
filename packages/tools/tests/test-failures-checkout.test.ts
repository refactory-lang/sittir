import { afterAll, describe, it, expect } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { VitestJsonReport, VitestJsonTestResult } from '../src/scripts/record-test-run.ts';
import { compareFailures, summarizeFailures } from '../src/scripts/test-failures.ts';

const scratch = mkdtempSync(join(tmpdir(), 'test-failures-checkout-'));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

function checkout(name: string): string {
	const root = join(scratch, name);
	mkdirSync(join(root, '.git'), { recursive: true });
	mkdirSync(join(root, 'packages', 'tools', 'tests'), { recursive: true });
	writeFileSync(join(root, FILE), '');
	return root;
}

const FILE = 'packages/tools/tests/native-read-validator.test.ts';
const TESTS = ['rust deep arena validation', 'python deep arena validation', 'scm deep arena validation'];

function reportIn(root: string): VitestJsonReport {
	const testResults: VitestJsonTestResult[] = [
		{
			name: join(root, FILE),
			status: 'failed',
			message: '',
			startTime: 0,
			endTime: 10,
			assertionResults: TESTS.map((fullName) => ({ status: 'failed' as const, fullName, failureMessages: ['mismatch'] }))
		}
	];
	return {
		numTotalTests: TESTS.length,
		numPassedTests: 0,
		numFailedTests: TESTS.length,
		numPendingTests: 0,
		numTodoTests: 0,
		testResults
	};
}

describe('failures from two checkouts', () => {
	it('keeps the same failures unchanged when they come from two checkouts', () => {
		const comparison = compareFailures(reportIn(checkout('tree-a')), reportIn(checkout('tree-b')));
		expect(comparison.new).toEqual([]);
		expect(comparison.fixed).toEqual([]);
		expect(comparison.unchanged).toBe(TESTS.length);
	});

	it('groups failures by the package they are in, from another checkout’s report', () => {
		const summary = summarizeFailures(reportIn(checkout('tree-c')), 1);
		expect(summary.groups.map((g) => Object.keys(g.packages))).toEqual([['tools']]);
	});
});
