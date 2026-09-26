import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('node:child_process', () => ({
	spawnSync: vi.fn().mockReturnValue({ status: 0 })
}));

vi.mock('@sittir/codegen/run-codegen', () => ({
	runCodegen: vi.fn().mockResolvedValue(undefined),
	runFullRegen: vi.fn().mockResolvedValue(undefined),
	runStandaloneSteps: vi.fn().mockResolvedValue(undefined)
}));

// The gen action's post-generate half is real code from @sittir/tools: an
// unmocked emitParityFixtures runs a genuine native-engine fixture
// extraction and rewrites the committed rust/crates/sittir-<g>/
// test-fixtures.json (with run-to-run reparse-wrapper variance) every time
// the `--all` routing tests below parse. These tests verify routing only —
// stub the whole post-generate surface.
vi.mock('@sittir/tools/post-generate', () => ({
	emitParityFixtures: vi.fn().mockResolvedValue(undefined),
	runRoundtripProbes: vi.fn().mockResolvedValue(0)
}));

import { gen } from '../../src/commands/gen.ts';
import { runFullRegen, runCodegen, runStandaloneSteps } from '@sittir/codegen/run-codegen';
import { emitParityFixtures } from '@sittir/tools/post-generate';
import { spawnSync } from 'node:child_process';

function spawnedArgs(): readonly string[] {
	return vi.mocked(spawnSync).mock.calls[0]![1] as readonly string[];
}

describe('gen command', () => {
	it('registers a single gen command with --grammar/--all/--output', () => {
		const program = new Command();
		gen.register(program);
		const cmd = program.commands.find((c) => c.name() === 'gen')!;
		expect(cmd).toBeDefined();
		const longs = cmd.options.map((o) => o.long);
		expect(longs).toEqual(expect.arrayContaining(['--grammar', '--all', '--output']));
		expect(longs).not.toContain('--nodes');
	});
	it('routes --all to runFullRegen with mapped opts', async () => {
		vi.clearAllMocks();
		const program = new Command();
		gen.register(program);
		await program.parseAsync(['gen', '--grammar', 'rust', '--all', '--output', 'packages/rust/src'], { from: 'user' });
		expect(vi.mocked(runFullRegen)).toHaveBeenCalledWith(
			expect.objectContaining({ grammar: 'rust', all: true, outputDir: 'packages/rust/src' })
		);
		expect(vi.mocked(runCodegen)).not.toHaveBeenCalled();
		// Fixture extraction reads the regenerated runtime, so it runs in a
		// fresh process rather than in the one that just regenerated it.
		expect(vi.mocked(emitParityFixtures)).not.toHaveBeenCalled();
		expect(spawnedArgs()).toEqual(
			expect.arrayContaining(['gen', '--grammar', 'rust', '--post-generate-only', '--all'])
		);
	});
	it('runs only the post-generate step under --post-generate-only', async () => {
		vi.clearAllMocks();
		const program = new Command();
		gen.register(program);
		await program.parseAsync(['gen', '--grammar', 'rust', '--all', '--post-generate-only'], { from: 'user' });
		expect(vi.mocked(emitParityFixtures)).toHaveBeenCalledWith('rust');
		expect(vi.mocked(runFullRegen)).not.toHaveBeenCalled();
		expect(vi.mocked(spawnSync)).not.toHaveBeenCalled();
	});
	it('propagates a failing post-generate process as the exit code', async () => {
		vi.clearAllMocks();
		vi.mocked(spawnSync).mockReturnValueOnce({ status: 1 } as never);
		const program = new Command();
		gen.register(program);
		const before = process.exitCode;
		await program.parseAsync(['gen', '--grammar', 'rust', '--all', '--output', 'packages/rust/src'], { from: 'user' });
		expect(process.exitCode).toBe(1);
		process.exitCode = before;
	});
	it('routes plain --grammar/--output (no --all) to runCodegen', async () => {
		vi.clearAllMocks();
		const program = new Command();
		gen.register(program);
		await program.parseAsync(['gen', '--grammar', 'rust', '--output', 'packages/rust/src'], {
			from: 'user'
		});
		expect(vi.mocked(runCodegen)).toHaveBeenCalledWith(
			expect.objectContaining({ grammar: 'rust', outputDir: 'packages/rust/src' })
		);
		expect(vi.mocked(runFullRegen)).not.toHaveBeenCalled();
	});
	it('maps --no-build-native and --allow-diagnostic', async () => {
		vi.clearAllMocks();
		const program = new Command();
		gen.register(program);
		await program.parseAsync(
			[
				'gen',
				'--grammar',
				'rust',
				'--all',
				'--output',
				'o',
				'--no-build-native',
				'--allow-diagnostic',
				'parsekind-noninjective'
			],
			{ from: 'user' }
		);
		expect(vi.mocked(runFullRegen)).toHaveBeenCalledWith(
			expect.objectContaining({ buildNative: false, allowDiagnostics: ['parsekind-noninjective'] })
		);
		expect(spawnedArgs()).toEqual(expect.arrayContaining(['--post-generate-only', '--no-build-native']));
	});
	it('skips fixture extraction in the post-generate step under --no-build-native', async () => {
		vi.clearAllMocks();
		const program = new Command();
		gen.register(program);
		await program.parseAsync(['gen', '--grammar', 'rust', '--all', '--no-build-native', '--post-generate-only'], {
			from: 'user'
		});
		// --no-build-native means fixture extraction has no fresh native
		// binary to run against — the action must skip it, not emit stale.
		expect(vi.mocked(emitParityFixtures)).not.toHaveBeenCalled();
	});
	it('runs standalone --transpile with only --grammar (no --output/--all)', async () => {
		vi.clearAllMocks();
		const program = new Command();
		gen.register(program);
		await program.parseAsync(['gen', '--grammar', 'rust', '--transpile'], { from: 'user' });
		expect(vi.mocked(runStandaloneSteps)).toHaveBeenCalledWith(
			expect.objectContaining({ grammar: 'rust', transpile: true })
		);
		expect(vi.mocked(runCodegen)).not.toHaveBeenCalled();
		expect(vi.mocked(runFullRegen)).not.toHaveBeenCalled();
	});
});
