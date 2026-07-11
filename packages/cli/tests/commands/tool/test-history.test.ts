import { describe, it, expect, vi, afterEach } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({
	recordTestRun: vi.fn(),
	formatTestRunReport: vi.fn(() => 'formatted report'),
	runTestHistoryCli: vi.fn()
}));
import { testHistory as testHistoryCmd } from '../../../src/commands/tool/test-history.ts';
import { recordTestRun, formatTestRunReport, runTestHistoryCli } from '@sittir/tools';

function makeResult(overrides: { newlyFailing?: string[]; newlyFixed?: string[] } = {}) {
	return {
		entry: {
			ts: '2026-01-01T00:00:00.000Z',
			branch: 'main',
			commit: 'deadbeef',
			numTotalTestFiles: 1,
			numFailedTestFiles: 0,
			numTotalTests: 1,
			numPassedTests: 1,
			numFailedTests: 0,
			numPendingTests: 0,
			numTodoTests: 0,
			failedTestFiles: []
		},
		previous: undefined,
		newlyFailing: overrides.newlyFailing ?? [],
		newlyFixed: overrides.newlyFixed ?? []
	};
}

describe('tool test-history command', () => {
	afterEach(() => {
		vi.clearAllMocks();
		process.exitCode = undefined;
	});

	it('registers command named test-history with an [n] argument and --record option', () => {
		const program = new Command();
		testHistoryCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'test-history')!;
		expect(cmd).toBeDefined();
		expect(cmd.options.map((o) => o.long)).toEqual(expect.arrayContaining(['--record']));
	});

	it('without --record, routes [n] to runTestHistoryCli', async () => {
		const program = new Command();
		testHistoryCmd.register(program);
		await program.parseAsync(['test-history', '25'], { from: 'user' });
		expect(vi.mocked(runTestHistoryCli)).toHaveBeenCalledWith(['25']);
		expect(vi.mocked(recordTestRun)).not.toHaveBeenCalled();
	});

	it('with --record, routes to recordTestRun and prints formatTestRunReport\'s output', async () => {
		vi.mocked(recordTestRun).mockResolvedValue(makeResult());
		const program = new Command();
		testHistoryCmd.register(program);
		await program.parseAsync(['test-history', '--record'], { from: 'user' });
		expect(vi.mocked(recordTestRun)).toHaveBeenCalledTimes(1);
		expect(vi.mocked(formatTestRunReport)).toHaveBeenCalledTimes(1);
		expect(vi.mocked(runTestHistoryCli)).not.toHaveBeenCalled();
	});

	it('with --record and newly-failing files, sets a non-zero exit code', async () => {
		vi.mocked(recordTestRun).mockResolvedValue(makeResult({ newlyFailing: ['a.test.ts'] }));
		const program = new Command();
		testHistoryCmd.register(program);
		await program.parseAsync(['test-history', '--record'], { from: 'user' });
		expect(process.exitCode).toBe(1);
	});

	it('with --record and no newly-failing files, leaves the exit code untouched', async () => {
		vi.mocked(recordTestRun).mockResolvedValue(makeResult());
		const program = new Command();
		testHistoryCmd.register(program);
		await program.parseAsync(['test-history', '--record'], { from: 'user' });
		expect(process.exitCode).toBeUndefined();
	});
});
