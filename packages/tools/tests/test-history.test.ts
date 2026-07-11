import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { appendTestHistory, readTestHistory, testHistoryPath } from '../src/test-history.ts';
import type { TestRun } from '../src/test-history.ts';

const REAL_HISTORY = testHistoryPath();
const SCRATCH = resolve(fileURLToPath(new URL('..', import.meta.url)), 'test-history-test-scratch.jsonl');

function makeEntry(overrides: Partial<TestRun> = {}): TestRun {
	return {
		ts: new Date().toISOString(),
		branch: 'some-branch',
		commit: '0123456789abcdef0123456789abcdef01234567',
		numTotalTestFiles: 10,
		numFailedTestFiles: 1,
		numTotalTests: 100,
		numPassedTests: 95,
		numFailedTests: 3,
		numPendingTests: 2,
		numTodoTests: 0,
		failedTestFiles: ['packages/tools/tests/example.test.ts'],
		...overrides
	};
}

describe('@sittir/tools test-history surface', () => {
	it('testHistoryPath returns a string ending in .jsonl', () => {
		expect(typeof REAL_HISTORY).toBe('string');
		expect(REAL_HISTORY.endsWith('.jsonl')).toBe(true);
	});

	it('readTestHistory on the real file returns an array (no schema-header leak)', () => {
		const runs = readTestHistory();
		expect(Array.isArray(runs)).toBe(true);
		for (const r of runs) {
			expect(typeof r.ts).toBe('string');
			expect(typeof r.branch).toBe('string');
			expect(Array.isArray(r.failedTestFiles)).toBe(true);
		}
	});

	it('exports appendTestHistory as a function', () => {
		expect(typeof appendTestHistory).toBe('function');
	});
});

describe('@sittir/tools test-history round-trip (scratch file)', () => {
	beforeEach(() => {
		process.env['SITTIR_TEST_HISTORY_PATH'] = SCRATCH;
		writeFileSync(SCRATCH, '');
	});

	afterEach(() => {
		delete process.env['SITTIR_TEST_HISTORY_PATH'];
		if (existsSync(SCRATCH)) unlinkSync(SCRATCH);
	});

	it('appendTestHistory + readTestHistory round-trips a single entry', () => {
		const entry = makeEntry({ branch: 'feature-x', numFailedTests: 5 });
		appendTestHistory(entry);
		const runs = readTestHistory();
		expect(runs).toHaveLength(1);
		expect(runs[0]!.branch).toBe('feature-x');
		expect(runs[0]!.numFailedTests).toBe(5);
	});

	it('multiple appendTestHistory calls accumulate correctly', () => {
		for (const branch of ['a', 'b', 'c']) {
			appendTestHistory(makeEntry({ branch }));
		}
		const runs = readTestHistory();
		expect(runs).toHaveLength(3);
		expect(runs.map((r) => r.branch)).toEqual(['a', 'b', 'c']);
	});

	it('readTestHistory skips schema/header lines', () => {
		const schemaLine = JSON.stringify({
			schema: 'v1',
			description: 'sittir vitest test-run history',
			fields: ['ts', 'branch']
		});
		writeFileSync(SCRATCH, schemaLine + '\n');

		appendTestHistory(makeEntry({ branch: 'after-header' }));
		const runs = readTestHistory();
		expect(runs).toHaveLength(1);
		expect(runs[0]!.branch).toBe('after-header');
	});

	it('preserves failedTestFiles as-is (empty array for a fully green run)', () => {
		appendTestHistory(makeEntry({ numFailedTests: 0, numFailedTestFiles: 0, failedTestFiles: [] }));
		const runs = readTestHistory();
		expect(runs[0]!.failedTestFiles).toEqual([]);
	});
});
