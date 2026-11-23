import { afterAll, describe, it, expect } from 'vitest';
import { dirname, join } from 'node:path';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

import type { VitestJsonReport } from '../src/scripts/record-test-run.ts';
import { checkoutRelativeNames } from '../src/scripts/vitest-report.ts';

const scratch = mkdtempSync(join(tmpdir(), 'checkout-relative-test-'));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

const TESTS = 'packages/tools/tests';

function checkout(dir: string): string {
	mkdirSync(join(dir, '.git'), { recursive: true });
	return dir;
}

function touch(path: string): string {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, '');
	return path;
}

function reportNaming(names: string[]): VitestJsonReport {
	return {
		numTotalTests: 0,
		numPassedTests: 0,
		numFailedTests: 0,
		numPendingTests: 0,
		numTodoTests: 0,
		testResults: names.map((name) => ({ name, status: 'passed' as const, assertionResults: [] }))
	};
}

describe('checkoutRelativeNames', () => {
	it('keys a deleted file in a live checkout against that checkout', () => {
		const live = checkout(join(scratch, 'live'));
		const kept = touch(join(live, TESTS, 'kept.test.ts'));
		const gone = join(live, TESTS, 'gone.test.ts');
		const keys = checkoutRelativeNames(reportNaming([kept, gone]));
		expect(keys.get(kept)).toBe(`${TESTS}/kept.test.ts`);
		expect(keys.get(gone)).toBe(`${TESTS}/gone.test.ts`);
	});

	it('refuses a report whose whole worktree was removed', () => {
		const removed = join(scratch, 'removed');
		expect(() => checkoutRelativeNames(reportNaming([join(removed, TESTS, 'a.test.ts')]))).toThrow(
			/none of the 1 files the report names exists/
		);
	});

	it('refuses a removed worktree nested in the main checkout, even when the main checkout has the same file', () => {
		const main = checkout(join(scratch, 'main'));
		touch(join(main, TESTS, 'a.test.ts'));
		const nested = join(main, 'scratchpad', 'wt-x');
		expect(() => checkoutRelativeNames(reportNaming([join(nested, TESTS, 'a.test.ts')]))).toThrow(
			/none of the 1 files the report names exists/
		);
	});

	it('refuses a file outside the checkout the report ran in', () => {
		const live = checkout(join(scratch, 'outside-live'));
		const inside = touch(join(live, TESTS, 'a.test.ts'));
		const outside = join(scratch, 'elsewhere', 'b.test.ts');
		expect(() => checkoutRelativeNames(reportNaming([inside, outside]))).toThrow(/is outside the checkout/);
	});

	it('refuses a report whose existing files span two checkouts', () => {
		const one = touch(join(checkout(join(scratch, 'two-a')), TESTS, 'a.test.ts'));
		const two = touch(join(checkout(join(scratch, 'two-b')), TESTS, 'b.test.ts'));
		expect(() => checkoutRelativeNames(reportNaming([one, two]))).toThrow(/did not run in one checkout/);
	});

	it('refuses a live file that no git checkout contains', () => {
		const loose = touch(join(scratch, 'loose', TESTS, 'a.test.ts'));
		expect(() => checkoutRelativeNames(reportNaming([loose]))).toThrow(/is not inside a git checkout/);
	});
});
