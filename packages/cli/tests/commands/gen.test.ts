import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/codegen/run-codegen', () => ({
	runCodegen: vi.fn().mockResolvedValue(undefined),
	runFullRegen: vi.fn().mockResolvedValue(undefined),
}));

import { gen } from '../../src/commands/gen.ts';
import { runFullRegen, runCodegen } from '@sittir/codegen/run-codegen';

describe('gen command', () => {
	it('registers a single gen command with --grammar/--all/--output/--nodes', () => {
		const program = new Command();
		gen.register(program);
		const cmd = program.commands.find((c) => c.name() === 'gen')!;
		expect(cmd).toBeDefined();
		const longs = cmd.options.map((o) => o.long);
		expect(longs).toEqual(expect.arrayContaining(['--grammar', '--all', '--output', '--nodes']));
	});
	it('routes --all to runFullRegen with mapped opts', async () => {
		vi.clearAllMocks();
		const program = new Command();
		gen.register(program);
		await program.parseAsync(['gen', '--grammar', 'rust', '--all', '--output', 'packages/rust/src'], { from: 'user' });
		expect(vi.mocked(runFullRegen)).toHaveBeenCalledWith(expect.objectContaining({ grammar: 'rust', all: true, outputDir: 'packages/rust/src' }));
		expect(vi.mocked(runCodegen)).not.toHaveBeenCalled();
	});
	it('routes --nodes (no --all) to runCodegen', async () => {
		vi.clearAllMocks();
		const program = new Command();
		gen.register(program);
		await program.parseAsync(['gen', '--grammar', 'rust', '--nodes', 'struct_item', '--output', 'packages/rust/src'], { from: 'user' });
		expect(vi.mocked(runCodegen)).toHaveBeenCalledWith(expect.objectContaining({ grammar: 'rust', nodes: ['struct_item'], outputDir: 'packages/rust/src' }));
		expect(vi.mocked(runFullRegen)).not.toHaveBeenCalled();
	});
	it('maps --no-build-native and --allow-diagnostic', async () => {
		vi.clearAllMocks();
		const program = new Command();
		gen.register(program);
		await program.parseAsync(['gen', '--grammar', 'rust', '--all', '--output', 'o', '--no-build-native', '--allow-diagnostic', 'parsekind-noninjective'], { from: 'user' });
		expect(vi.mocked(runFullRegen)).toHaveBeenCalledWith(expect.objectContaining({ buildNative: false, allowDiagnostics: ['parsekind-noninjective'] }));
	});
});
