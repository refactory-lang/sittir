/**
 * Unit tests for process-isolation harness helpers.
 * Tests parseLastIsolateProgress, formatIsolateGrammarSummary, and the
 * isolate-mode code path of runCountsCli (mocked child_process).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock child_process so we don't actually spawn anything.
vi.mock('node:child_process', () => {
	return {
		spawn: vi.fn(),
	};
});

// Mock the run module so no live validators launch.
vi.mock('../src/run.ts', () => ({
	runFrom: vi.fn().mockResolvedValue({ grammar: 'rust', total: 5, pass: 5, fail: 0, skip: 0, undefinedCount: 0, divergentCount: 0, errors: [] }),
	runRt: vi.fn().mockResolvedValue({ grammar: 'rust', total: 8, pass: 8, fail: 0, skip: 0, astMatchPass: 8, errors: [], astMismatches: [] }),
	runCoverage: vi.fn().mockReturnValue({ grammar: 'rust', total: 10, pass: 10, fail: 0, issues: [] }),
	runFactory: vi.fn().mockResolvedValue({ grammar: 'rust', total: 7, pass: 7, fail: 0, skip: 0, astMatchPass: 7, errors: [], astMismatches: [] }),
	defaultTemplatesPath: vi.fn().mockReturnValue('/fake/templates'),
}));

vi.mock('../src/history.ts', () => ({
	readHistory: vi.fn().mockReturnValue([]),
	appendHistory: vi.fn(),
	commitHistory: vi.fn(),
	historyPath: vi.fn().mockReturnValue('/fake/validation-history.jsonl'),
}));

vi.mock('../src/native-staleness.ts', () => ({
	warnIfNativeBinaryStale: vi.fn(),
}));

import { parseLastIsolateProgress, formatIsolateGrammarSummary, runCountsCli } from '../src/commands.ts';
import { commitHistory } from '../src/history.ts';
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';

// ---------------------------------------------------------------------------
// parseLastIsolateProgress
// ---------------------------------------------------------------------------
describe('parseLastIsolateProgress', () => {
	it('returns null for empty string', () => {
		expect(parseLastIsolateProgress('')).toBeNull();
	});

	it('returns null when no progress lines present', () => {
		const stderr = 'some error\nanother line\n';
		expect(parseLastIsolateProgress(stderr)).toBeNull();
	});

	it('extracts the kind from a single progress line', () => {
		const stderr = '[isolate-progress] rust impl_item\n';
		expect(parseLastIsolateProgress(stderr)).toBe('impl_item');
	});

	it('extracts the LAST kind when multiple lines present', () => {
		const stderr = [
			'[isolate-progress] rust function_item',
			'[isolate-progress] rust struct_item',
			'[isolate-progress] rust impl_item',
			'',
		].join('\n');
		expect(parseLastIsolateProgress(stderr)).toBe('impl_item');
	});

	it('returns the last progress line even when non-progress lines follow', () => {
		const stderr = [
			'[isolate-progress] rust function_item',
			'[isolate-progress] rust impl_item',
			'Segmentation fault: 11',
			'',
		].join('\n');
		expect(parseLastIsolateProgress(stderr)).toBe('impl_item');
	});

	it('handles kind names with underscores and numbers', () => {
		const stderr = '[isolate-progress] python decorated_definition\n';
		expect(parseLastIsolateProgress(stderr)).toBe('decorated_definition');
	});

	it('ignores lines that do not match the format', () => {
		const stderr = 'warning: something\n[isolate-progress wrong format\n[not-a-match]\n';
		expect(parseLastIsolateProgress(stderr)).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// formatIsolateGrammarSummary
// ---------------------------------------------------------------------------
describe('formatIsolateGrammarSummary', () => {
	it('formats a SIGSEGV crash with the attributed kind', () => {
		const msg = formatIsolateGrammarSummary('rust', 'crashed', '', 'impl_item', 139, null);
		expect(msg).toMatch(/⚠ native engine SIGSEGV in rust/);
		expect(msg).toMatch(/impl_item/);
	});

	it('formats a crash with null kind as <unknown>', () => {
		const msg = formatIsolateGrammarSummary('rust', 'crashed', '', null, 139, null);
		expect(msg).toMatch(/<unknown>/);
	});

	it('formats an ok result by returning the output string', () => {
		const output = 'rust/native:\n  covPass=100\n';
		const msg = formatIsolateGrammarSummary('rust', 'ok', output, null, 0, null);
		expect(msg).toBe(output);
	});

	it('formats a non-crash error with exit code', () => {
		const msg = formatIsolateGrammarSummary('python', 'error', '', null, 1, null);
		expect(msg).toMatch(/python/);
		expect(msg).toMatch(/exit 1/);
	});
});

// ---------------------------------------------------------------------------
// runCountsCli isolate mode — mocked child process
// ---------------------------------------------------------------------------

/** Create a fake EventEmitter-based child mock that emits stdout/stderr/close. */
function makeMockChild(opts: {
	stdout?: string;
	stderr?: string;
	exitCode: number | null;
	signal?: NodeJS.Signals | null;
}) {
	const child = new EventEmitter() as EventEmitter & {
		stdout: EventEmitter;
		stderr: EventEmitter;
	};
	child.stdout = new EventEmitter();
	child.stderr = new EventEmitter();
	// Emit data asynchronously so the close handler fires after data is collected.
	setImmediate(() => {
		if (opts.stdout) child.stdout.emit('data', Buffer.from(opts.stdout));
		if (opts.stderr) child.stderr.emit('data', Buffer.from(opts.stderr));
		child.emit('close', opts.exitCode, opts.signal ?? null);
	});
	return child;
}

describe('runCountsCli --isolate mode', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Restore process.exitCode
		process.exitCode = undefined;
	});

	it('spawns a child process per grammar when isolate=true + backend=native', async () => {
		const mockSpawn = vi.mocked(spawn);
		mockSpawn.mockReturnValue(makeMockChild({ stdout: 'rust/native:\n  covPass=10\n', exitCode: 0 }) as ReturnType<typeof spawn>);
		const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

		await runCountsCli(['rust'], 'native', { isolate: true });
		expect(mockSpawn).toHaveBeenCalledOnce();
		const [bin, args] = mockSpawn.mock.calls[0]!;
		expect(typeof bin).toBe('string');
		expect(args).toContain('validate');
		expect(args).toContain('counts');
		expect(args).toContain('rust');
		expect(args).toContain('--_isolate-worker');
		writeSpy.mockRestore();
	});

	it('spawns 3 child processes when no grammar specified (defaults to all)', async () => {
		const mockSpawn = vi.mocked(spawn);
		// Each of the 3 grammar workers needs its own mock child.
		mockSpawn
			.mockReturnValueOnce(makeMockChild({ stdout: 'rust/native:\n', exitCode: 0 }) as ReturnType<typeof spawn>)
			.mockReturnValueOnce(makeMockChild({ stdout: 'typescript/native:\n', exitCode: 0 }) as ReturnType<typeof spawn>)
			.mockReturnValueOnce(makeMockChild({ stdout: 'python/native:\n', exitCode: 0 }) as ReturnType<typeof spawn>);
		const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

		await runCountsCli([], 'native', { isolate: true });
		expect(mockSpawn).toHaveBeenCalledTimes(3);
		writeSpy.mockRestore();
	});

	it('prints SIGSEGV attribution when child exits 139', async () => {
		const mockSpawn = vi.mocked(spawn);
		const stderrData = [
			'[isolate-progress] rust function_item',
			'[isolate-progress] rust impl_item',
			'Segmentation fault: 11',
		].join('\n');
		mockSpawn.mockReturnValue(makeMockChild({ stderr: stderrData, exitCode: 139 }) as ReturnType<typeof spawn>);
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		await runCountsCli(['rust'], 'native', { isolate: true });
		const output = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n');
		expect(output).toMatch(/⚠ native engine SIGSEGV in rust/);
		expect(output).toMatch(/impl_item/);
		expect(process.exitCode).toBe(1);
		consoleSpy.mockRestore();
	});

	it('prints SIGSEGV attribution when child signal is SIGSEGV', async () => {
		const mockSpawn = vi.mocked(spawn);
		const stderrData = '[isolate-progress] typescript jsx_element\n';
		mockSpawn.mockReturnValue(makeMockChild({ stderr: stderrData, exitCode: null, signal: 'SIGSEGV' }) as ReturnType<typeof spawn>);
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		await runCountsCli(['typescript'], 'native', { isolate: true });
		const output = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n');
		expect(output).toMatch(/⚠ native engine SIGSEGV in typescript/);
		expect(output).toMatch(/jsx_element/);
		consoleSpy.mockRestore();
	});

	it('continues to the next grammar after a crash', async () => {
		const mockSpawn = vi.mocked(spawn);
		// rust crashes, python succeeds
		mockSpawn
			.mockReturnValueOnce(makeMockChild({ stderr: '[isolate-progress] rust impl_item\n', exitCode: 139 }) as ReturnType<typeof spawn>)
			.mockReturnValueOnce(makeMockChild({ stdout: 'python/native:\n  covPass=5\n', exitCode: 0 }) as ReturnType<typeof spawn>);
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

		await runCountsCli(['rust', 'python'], 'native', { isolate: true });
		// Both grammars should have been spawned.
		expect(mockSpawn).toHaveBeenCalledTimes(2);
		// rust crash attributed.
		const output = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n');
		expect(output).toMatch(/⚠ native engine SIGSEGV in rust/);
		// python output forwarded.
		const written = writeSpy.mock.calls.map((c) => String(c[0])).join('');
		expect(written).toContain('python/native:');
		consoleSpy.mockRestore();
		writeSpy.mockRestore();
	});

	it('commits validation history once in the parent after successful isolate workers', async () => {
		const mockSpawn = vi.mocked(spawn);
		mockSpawn
			.mockReturnValueOnce(makeMockChild({ stdout: 'rust/native:\n', exitCode: 0 }) as ReturnType<typeof spawn>)
			.mockReturnValueOnce(makeMockChild({ stdout: 'python/native:\n', exitCode: 0 }) as ReturnType<typeof spawn>);
		const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

		await runCountsCli(['rust', 'python'], 'native', { isolate: true });

		// The worker children appended rows but skipped commit; the parent must
		// commit exactly once, covering every grammar that succeeded.
		expect(vi.mocked(commitHistory)).toHaveBeenCalledOnce();
		const msg = String(vi.mocked(commitHistory).mock.calls[0]![0]);
		expect(msg).toContain('rust/native');
		expect(msg).toContain('python/native');
		writeSpy.mockRestore();
	});

	it('does NOT commit history when every isolate worker crashed (nothing recorded)', async () => {
		const mockSpawn = vi.mocked(spawn);
		mockSpawn.mockReturnValue(makeMockChild({ stderr: '[isolate-progress] rust impl_item\n', exitCode: 139 }) as ReturnType<typeof spawn>);
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		await runCountsCli(['rust'], 'native', { isolate: true });

		expect(vi.mocked(commitHistory)).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('does NOT commit history in an isolate worker child (isolateWorker=true)', async () => {
		// A worker runs the in-process path; the existing !isolateWorker guard must
		// keep it from committing so only the parent commits once.
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		await runCountsCli(['rust'], 'native', { isolate: false, isolateWorker: true });

		expect(vi.mocked(commitHistory)).not.toHaveBeenCalled();
		logSpy.mockRestore();
	});

	it('does NOT spawn children when isolate=false (in-process path)', async () => {
		const mockSpawn = vi.mocked(spawn);
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		await runCountsCli(['rust'], 'native', { isolate: false });
		expect(mockSpawn).not.toHaveBeenCalled();
		logSpy.mockRestore();
	});

	it('does NOT spawn children for js backend even with isolate=true', async () => {
		const mockSpawn = vi.mocked(spawn);
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		await runCountsCli(['rust'], 'js', { isolate: true });
		expect(mockSpawn).not.toHaveBeenCalled();
		logSpy.mockRestore();
	});

	it('sets SITTIR_ISOLATE_WORKER env on child spawn', async () => {
		const mockSpawn = vi.mocked(spawn);
		mockSpawn.mockReturnValue(makeMockChild({ exitCode: 0 }) as ReturnType<typeof spawn>);
		const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

		await runCountsCli(['rust'], 'native', { isolate: true });
		const spawnOpts = mockSpawn.mock.calls[0]![2] as { env?: NodeJS.ProcessEnv };
		expect(spawnOpts.env?.['SITTIR_ISOLATE_WORKER']).toBe('1');
		writeSpy.mockRestore();
	});
});
