import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ benchCodemod: vi.fn().mockResolvedValue(0) }));
import { benchCodemod as benchCodemodCmd } from '../../../src/commands/tool/bench-codemod.ts';
import { benchCodemod as runBenchCodemod } from '@sittir/tools';

describe('tool bench-codemod command', () => {
	it('registers the bench-codemod command', () => {
		const program = new Command();
		benchCodemodCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'bench-codemod')!;
		expect(cmd).toBeDefined();
		expect(cmd.registeredArguments).toHaveLength(1);
	});

	it('passes the corpus path to the tool run()', async () => {
		vi.clearAllMocks();
		const program = new Command();
		benchCodemodCmd.register(program);
		await program.parseAsync(['bench-codemod', '/tmp/corpus'], { from: 'user' });
		expect(vi.mocked(runBenchCodemod)).toHaveBeenCalledWith({ corpus: '/tmp/corpus' });
	});
});
