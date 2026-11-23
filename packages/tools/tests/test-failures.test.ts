import { describe, it, expect } from 'vitest';

import type { VitestJsonReport, VitestJsonTestResult } from '../src/scripts/record-test-run.ts';
import { formatFailureSummary, summarizeFailures } from '../src/scripts/test-failures.ts';

import { fixtureFile as abs } from './support/checkout-fixture.ts';

function assertion(fullName: string, message: string | undefined) {
	return {
		status: message === undefined ? ('passed' as const) : ('failed' as const),
		fullName,
		failureMessages: message === undefined ? [] : [message]
	};
}

function file(relativePath: string, assertionResults: ReturnType<typeof assertion>[], message = ''): VitestJsonTestResult {
	const failed = assertionResults.some((a) => a.status === 'failed');
	return {
		name: abs(relativePath),
		status: failed || message !== '' ? 'failed' : 'passed',
		message,
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

describe('summarizeFailures', () => {
	it('normalizes absolute paths and digit runs in the signature and keeps kind names', () => {
		const summary = summarizeFailures(
			report([
				file('packages/tools/tests/a.test.ts', [
					assertion('a > one', `Error at ${abs('packages/tools/src/x.ts')}:12:3\nmore`),
					assertion('a > two', 'unknown kind id 118 in StatementNode')
				])
			]),
			3
		);
		expect(summary.groups.map((g) => g.signature)).toEqual([
			'Error at <path>',
			'unknown kind id # in StatementNode'
		]);
	});

	it('cuts the signature at the first defect location chain', () => {
		const summary = summarizeFailures(
			report([
				file('packages/tools/tests/d.test.ts', [
					assertion(
						'd > one',
						'Error: unknown kind id 118 in StatementNode on BlockNode._statements on SwitchRuleNode._content\n    at render'
					),
					assertion('d > two', 'Error: unknown kind id 7 in StatementNode on DoStatementNode._body')
				])
			]),
			3
		);
		expect(summary.groups).toHaveLength(1);
		expect(summary.groups[0]!.signature).toBe('Error: unknown kind id # in StatementNode');
		expect(summary.groups[0]!.count).toBe(2);
	});

	it('collapses a path list to one path', () => {
		const summary = summarizeFailures(
			report([
				file('packages/tools/tests/p.test.ts', [
					assertion('p > one', 'builds are older: packages/tools/src/a.ts, packages/cli/src/b.ts, /x/y/c.ts')
				])
			]),
			3
		);
		expect(summary.groups[0]!.signature).toBe('builds are older: <path>');
	});

	it('uses the first later error line when the failure is a command failure', () => {
		const message = [
			'Error: Command failed: node packages/cli/dist/cli.js tool bench-storage python',
			'file:///repo/packages/tools/dist/built.js:25',
			'        throw new Error(`bench-storage measures built code`);',
			'Error: bench-storage measures built code, and these builds are older than their sources: packages/tools/src/a.ts, packages/cli/src/b.ts. Run `pnpm build`.'
		].join('\n');
		const summary = summarizeFailures(
			report([file('packages/tools/tests/n.test.ts', [assertion('n > one', message)])]),
			3
		);
		expect(summary.groups[0]!.signature).toBe(
			'Error: bench-storage measures built code, and these builds are older than their sources: <path>. Run `pnpm build`.'
		);
	});

	it('falls back to the first line when a command failure has no later error line', () => {
		const summary = summarizeFailures(
			report([
				file('packages/tools/tests/n2.test.ts', [assertion('n > two', 'Error: Command failed: node x.js\nexit 1')])
			]),
			3
		);
		expect(summary.groups[0]!.signature).toBe('Error: Command failed: node x.js');
	});

	it('groups messages that differ only by a number into one group', () => {
		const summary = summarizeFailures(
			report([
				file('packages/codegen/tests/b.test.ts', [
					assertion('b > one', 'expected 3 nodes'),
					assertion('b > two', 'expected 47 nodes')
				])
			]),
			3
		);
		expect(summary.groups).toHaveLength(1);
		expect(summary.groups[0]!.count).toBe(2);
		expect(summary.groups[0]!.signature).toBe('expected # nodes');
	});

	it('counts a failed file with no assertion results as a failure using the file message', () => {
		const summary = summarizeFailures(
			report([file('packages/c/tests/nodes.test.ts', [], 'failed to load language "c"')]),
			3
		);
		expect(summary.failedFiles).toBe(1);
		expect(summary.failedTests).toBe(0);
		expect(summary.failures).toBe(1);
		expect(summary.groups[0]).toEqual({
			signature: 'failed to load language "c"',
			count: 1,
			packages: { c: 1 },
			examples: ['packages/c/tests/nodes.test.ts']
		});
	});

	it('takes the package from a file in another checkout', () => {
		const sibling = abs('packages/cli/tests/x.test.ts');
		const summary = summarizeFailures(
			report([{ name: sibling, status: 'failed', message: '', assertionResults: [assertion('x > one', 'boom')] }]),
			3
		);
		expect(summary.groups[0]!.packages).toEqual({ cli: 1 });
	});

	it('assigns root-level files to the (root) package', () => {
		const summary = summarizeFailures(
			report([file('scripts/root.test.ts', [assertion('r > one', 'boom')])]),
			3
		);
		expect(summary.groups[0]!.packages).toEqual({ '(root)': 1 });
	});

	it('sorts groups by count descending, then by signature', () => {
		const summary = summarizeFailures(
			report([
				file('packages/tools/tests/s.test.ts', [
					assertion('s > 1', 'beta'),
					assertion('s > 2', 'alpha'),
					assertion('s > 3', 'gamma'),
					assertion('s > 4', 'gamma')
				])
			]),
			3
		);
		expect(summary.groups.map((g) => [g.signature, g.count])).toEqual([
			['gamma', 2],
			['alpha', 1],
			['beta', 1]
		]);
	});

	it('limits examples per group and labels them with the repo-relative file and full name', () => {
		const summary = summarizeFailures(
			report([
				file('packages/tools/tests/e.test.ts', [
					assertion('e > one', 'same'),
					assertion('e > two', 'same'),
					assertion('e > three', 'same')
				])
			]),
			2
		);
		expect(summary.groups[0]!.examples).toEqual([
			'packages/tools/tests/e.test.ts > e > one',
			'packages/tools/tests/e.test.ts > e > two'
		]);
	});

	it('throws when the failed assertion count differs from numFailedTests', () => {
		const broken: VitestJsonReport = {
			...report([file('packages/tools/tests/i.test.ts', [assertion('i > 1', 'boom')])]),
			numFailedTests: 5
		};
		expect(() => summarizeFailures(broken, 3)).toThrow(
			'failed assertions in the report (1) do not match numFailedTests (5)'
		);
	});
});

describe('formatFailureSummary', () => {
	it('ends with the totals line', () => {
		const summary = summarizeFailures(
			report([
				file('packages/tools/tests/t.test.ts', [assertion('t > 1', 'x'), assertion('t > 2', 'x')]),
				file('packages/c/tests/c.test.ts', [], 'load failed')
			]),
			3
		);
		expect(formatFailureSummary(summary).split('\n').at(-1)).toBe(
			'3 failures in 2 groups (2 failed tests, 1 failed files with no tests)'
		);
	});
});
