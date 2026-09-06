import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ValidationRun } from '../src/history.ts';

// Mock the run module so CLI tests don't launch live validators.
vi.mock('../src/run.ts', () => ({
	runFrom: vi.fn().mockResolvedValue({
		grammar: 'rust',
		total: 5,
		pass: 5,
		fail: 0,
		skip: 0,
		undefinedCount: 0,
		divergentCount: 0,
		errors: []
	}),
	runRt: vi.fn().mockResolvedValue({
		grammar: 'rust',
		total: 8,
		pass: 8,
		fail: 0,
		skip: 0,
		astMatchPass: 8,
		errors: [],
		astMismatches: [],
		// Without this field collectValidatorFailuresForGrammar throws
		// ("accessorThrows is not iterable") and every test below silently
		// exercises runCountsCli's whole-grammar CATCH path instead of the
		// happy path it means to pin.
		accessorThrows: []
	}),
	runCoverage: vi.fn().mockReturnValue({ grammar: 'rust', total: 10, pass: 10, fail: 0, issues: [] }),
	runFactory: vi.fn().mockResolvedValue({
		grammar: 'rust',
		total: 7,
		pass: 7,
		fail: 0,
		skip: 0,
		astMatchPass: 7,
		errors: [],
		astMismatches: []
	}),
	formatFromReport: vi.fn().mockReturnValue('from: pass=5 total=5'),
	formatReadRenderParseReport: vi.fn().mockReturnValue('rt: pass=8 total=8'),
	formatFactoryRenderParseReport: vi.fn().mockReturnValue('factory: pass=7 total=7')
}));

// Mock cachedNativeEngineProfile so debug-profile-skip tests can control it
// independently of the (also mocked) run.ts collectors. Partial mock — other
// common.ts exports (e.g. adaptNode) are used transitively by index.ts.
vi.mock('../src/validate/common.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../src/validate/common.ts')>();
	return {
		...actual,
		cachedNativeEngineProfile: vi.fn().mockReturnValue(undefined)
	};
});

// The in-process runCountsCli path ends in writeMergedValidationReport,
// whose output path is cwd-relative — under vitest that cwd is the repo
// root, so an unmocked write clobbers the real committed
// packages/tools/validation-report.json with this file's mocked-run
// entries. Stub ONLY the disk write; entry building stays real.
vi.mock('../src/validate/validation-report.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../src/validate/validation-report.ts')>();
	return { ...actual, writeValidationReport: vi.fn() };
});

// Mock readHistory so runHistoryCli tests are deterministic.
vi.mock('../src/history.ts', () => ({
	readHistory: vi.fn().mockReturnValue([
		{
			ts: '2025-01-01T00:00:00.000Z',
			grammar: 'rust',
			backend: 'native',
			fromPass: 10,
			fromTotal: 12,
			covPass: 8,
			covTotal: 9,
			readRenderParsePass: 5,
			readRenderParseTotal: 6,
			readRenderParseAstMatchPass: 4,
			readRenderParseShallowPass: 4,
			readRenderParseShallowTotal: 6,
			readRenderParseShallowAstMatchPass: 3,
			factoryRenderParsePass: 3,
			factoryRenderParseTotal: 4,
			factoryRenderParseAstMatchPass: 3
		} satisfies ValidationRun
	]),
	appendHistory: vi.fn(),
	commitHistory: vi.fn(),
	historyPath: vi.fn().mockReturnValue('/fake/validation-history.jsonl')
}));

import { runCountsCli, runProbeFactoryCli, runHistoryCli } from '../src/commands.ts';
import { runFrom, runRt, runFactory, runCoverage } from '../src/run.ts';
import { appendHistory, readHistory } from '../src/history.ts';
import { cachedNativeEngineProfile } from '../src/validate/common.ts';

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
	beforeEach(() => {
		vi.clearAllMocks();
	});

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
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(runRt)
			.mockResolvedValueOnce({
				grammar: 'rust',
				total: 8,
				pass: 8,
				fail: 0,
				skip: 0,
				astMatchPass: 8,
				errors: [],
				astMismatches: []
			})
			.mockResolvedValueOnce({
				grammar: 'rust',
				total: 8,
				pass: 6,
				fail: 2,
				skip: 0,
				astMatchPass: 5,
				errors: [],
				astMismatches: []
			});
	});

	it('defaults to native backend for each requested grammar', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		await runCountsCli(['rust']);
		expect(vi.mocked(runFrom)).toHaveBeenCalledWith('rust', 'native');
		expect(vi.mocked(runRt)).toHaveBeenNthCalledWith(1, 'rust', 'native', { recursive: true });
		expect(vi.mocked(runRt)).toHaveBeenNthCalledWith(2, 'rust', 'native', { recursive: false });
		expect(vi.mocked(runCoverage)).toHaveBeenCalled();
		expect(vi.mocked(runFactory)).toHaveBeenCalledWith('rust', 'native');
		logSpy.mockRestore();
	});

	it('prints backend-labeled counts output to stdout', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		await runCountsCli(['rust']);
		const allOutput = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
		expect(allOutput).toMatch(/rust\/native:/);
		expect(allOutput).toMatch(/read-render-parsePass=/);
		expect(allOutput).toMatch(/read-render-parse-shallowPass=/);
		expect(allOutput).toMatch(/factory-render-parsePass=/);
		logSpy.mockRestore();
	});

	it('defaults to all three grammars when none specified', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		await runCountsCli([]);
		expect(vi.mocked(runFrom)).toHaveBeenCalledTimes(3);
		logSpy.mockRestore();
	});

	it('appends history rows for successful counts runs', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		await runCountsCli(['rust']);
		expect(vi.mocked(appendHistory)).toHaveBeenCalledWith(
			expect.objectContaining({
				grammar: 'rust',
				backend: 'native',
				readRenderParsePass: 8,
				readRenderParseShallowPass: 6,
				factoryRenderParsePass: 7
			})
		);
		logSpy.mockRestore();
	});

	it('skips appendHistory when the native engine is a debug build', async () => {
		vi.mocked(cachedNativeEngineProfile).mockReturnValueOnce('debug');
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		await runCountsCli(['rust']);
		expect(vi.mocked(appendHistory)).not.toHaveBeenCalled();
		const allOutput = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
		expect(allOutput).toMatch(/DEBUG build.*skipping validation-history record/);
		logSpy.mockRestore();
	});
});

describe('@sittir/validator cli surface — runProbeFactoryCli behavior', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('defaults to native backend', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		await runProbeFactoryCli(['rust']);
		expect(vi.mocked(runFactory)).toHaveBeenCalledWith('rust', 'native');
		const allOutput = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
		expect(allOutput).toMatch(/=== rust\/native ===/);
		logSpy.mockRestore();
	});
});
