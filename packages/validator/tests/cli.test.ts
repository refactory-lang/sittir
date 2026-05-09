import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ValidationRun } from '../src/history.ts';

// Mock the run module so CLI tests don't launch live validators.
vi.mock('../src/run.ts', () => ({
	runFrom: vi.fn().mockResolvedValue({ grammar: 'rust', total: 5, pass: 5, fail: 0, skip: 0, undefinedCount: 0, divergentCount: 0, errors: [] }),
	runRt: vi.fn().mockResolvedValue({ grammar: 'rust', total: 8, pass: 8, fail: 0, skip: 0, astMatchPass: 8, errors: [], astMismatches: [] }),
	runCoverage: vi.fn().mockReturnValue({ grammar: 'rust', total: 10, pass: 10, fail: 0, issues: [] }),
	runFactory: vi.fn().mockResolvedValue({ grammar: 'rust', total: 7, pass: 7, fail: 0, skip: 0, astMatchPass: 7, errors: [], astMismatches: [] }),
	defaultTemplatesPath: vi.fn().mockReturnValue('/fake/templates'),
	formatFromReport: vi.fn().mockReturnValue('from: pass=5 total=5'),
	formatReadRenderParseReport: vi.fn().mockReturnValue('rt: pass=8 total=8'),
	formatFactoryRenderParseReport: vi.fn().mockReturnValue('factory: pass=7 total=7'),
}));

// Mock readHistory so runHistoryCli tests are deterministic.
vi.mock('../src/history.ts', () => ({
	readHistory: vi.fn().mockReturnValue([
		{
			ts: '2025-01-01T00:00:00.000Z',
			grammar: 'rust',
			backend: 'native',
			fromPass: 10, fromTotal: 12,
			covPass: 8, covTotal: 9,
			rtPass: 5, rtTotal: 6, rtAstMatchPass: 4,
			factoryPass: 3, factoryTotal: 4, factoryAstMatchPass: 3,
		} satisfies ValidationRun,
	]),
	appendHistory: vi.fn(),
	historyPath: vi.fn().mockReturnValue('/fake/validation-history.jsonl'),
}));

import { runCountsCli, runProbeFactoryCli, runHistoryCli } from '../src/cli.ts';
import { runFrom, runRt, runFactory, runCoverage } from '../src/run.ts';
import { readHistory } from '../src/history.ts';

describe('@sittir/validator cli surface — exports', () => {
	it('exports runCountsCli as a function', () => {
		expect(typeof runCountsCli).toBe('function');
	});

	it('exports runProbeFactoryCli as a function', () => {
		expect(typeof runProbeFactoryCli).toBe('function');
	});

	it('exports runHistoryCli as a function', () => {
		expect(typeof runHistoryCli).toBe('function');
	});

	it('re-exported from @sittir/validator index', async () => {
		const mod = await import('../src/index.ts');
		expect(typeof mod.runCountsCli).toBe('function');
		expect(typeof mod.runProbeFactoryCli).toBe('function');
		expect(typeof mod.runHistoryCli).toBe('function');
	});
});

describe('@sittir/validator cli surface — runHistoryCli behavior', () => {
	beforeEach(() => { vi.clearAllMocks(); });

	it('calls readHistory and prints entries to stdout', () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		runHistoryCli([]);
		expect(vi.mocked(readHistory)).toHaveBeenCalled();
		// The mocked entry has rust/native — verify it appears in the output.
		const allOutput = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
		expect(allOutput).toMatch(/rust\/native/);
		logSpy.mockRestore();
	});

	it('respects the [n] argument — slices to last n entries', () => {
		// readHistory returns 1 entry; requesting 5 should show all 1.
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		runHistoryCli(['5']);
		const allOutput = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
		expect(allOutput).toMatch(/rust\/native/);
		logSpy.mockRestore();
	});

	it('prints "No validation history" when readHistory returns empty', () => {
		vi.mocked(readHistory).mockReturnValueOnce([]);
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		runHistoryCli([]);
		const allOutput = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
		expect(allOutput).toMatch(/No validation history/);
		logSpy.mockRestore();
	});
});

describe('@sittir/validator cli surface — runCountsCli behavior', () => {
	beforeEach(() => { vi.clearAllMocks(); });

	it('defaults to native backend for each requested grammar', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		await runCountsCli(['rust']);
		expect(vi.mocked(runFrom)).toHaveBeenCalledWith('rust', 'native');
		expect(vi.mocked(runRt)).toHaveBeenCalledWith('rust', '/fake/templates', 'native');
		expect(vi.mocked(runCoverage)).toHaveBeenCalled();
		expect(vi.mocked(runFactory)).toHaveBeenCalledWith('rust', '/fake/templates', 'native');
		logSpy.mockRestore();
	});

	it('prints backend-labeled counts output to stdout', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		await runCountsCli(['rust']);
		const allOutput = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
		expect(allOutput).toMatch(/rust\/native:/);
		logSpy.mockRestore();
	});

	it('defaults to all three grammars when none specified', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		await runCountsCli([]);
		expect(vi.mocked(runFrom)).toHaveBeenCalledTimes(3);
		logSpy.mockRestore();
	});

	it('maps js backend to the internal typescript backend', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		await runCountsCli(['python'], 'js');
		expect(vi.mocked(runFrom)).toHaveBeenCalledWith('python', 'typescript');
		expect(vi.mocked(runRt)).toHaveBeenCalledWith('python', '/fake/templates', 'typescript');
		expect(vi.mocked(runFactory)).toHaveBeenCalledWith('python', '/fake/templates', 'typescript');
		const allOutput = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
		expect(allOutput).toMatch(/python\/js:/);
		logSpy.mockRestore();
	});

	it('runs both backends when backend=all', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		await runCountsCli(['rust'], 'all');
		expect(vi.mocked(runFrom)).toHaveBeenNthCalledWith(1, 'rust', 'native');
		expect(vi.mocked(runFrom)).toHaveBeenNthCalledWith(2, 'rust', 'typescript');
		const allOutput = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
		expect(allOutput).toMatch(/rust\/native:/);
		expect(allOutput).toMatch(/rust\/js:/);
		logSpy.mockRestore();
	});
});

describe('@sittir/validator cli surface — runProbeFactoryCli behavior', () => {
	beforeEach(() => { vi.clearAllMocks(); });

	it('defaults to native backend', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		await runProbeFactoryCli(['rust']);
		expect(vi.mocked(runFactory)).toHaveBeenCalledWith('rust', '/fake/templates', 'native');
		const allOutput = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
		expect(allOutput).toMatch(/=== rust\/native ===/);
		logSpy.mockRestore();
	});

	it('maps js backend to the internal typescript backend', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		await runProbeFactoryCli(['rust'], 'js');
		expect(vi.mocked(runFactory)).toHaveBeenCalledWith('rust', '/fake/templates', 'typescript');
		const allOutput = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
		expect(allOutput).toMatch(/=== rust\/js ===/);
		logSpy.mockRestore();
	});

	it('runs both backends when backend=all', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		await runProbeFactoryCli(['rust'], 'all');
		expect(vi.mocked(runFactory)).toHaveBeenNthCalledWith(1, 'rust', '/fake/templates', 'native');
		expect(vi.mocked(runFactory)).toHaveBeenNthCalledWith(2, 'rust', '/fake/templates', 'typescript');
		const allOutput = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
		expect(allOutput).toMatch(/=== rust\/native ===/);
		expect(allOutput).toMatch(/=== rust\/js ===/);
		logSpy.mockRestore();
	});
});
