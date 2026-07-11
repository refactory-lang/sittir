import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ bench: vi.fn().mockResolvedValue(0) }));
import { bench as benchCmd } from '../../../src/commands/tool/bench.ts';
import { bench as runBench } from '@sittir/tools';

describe('tool bench command', () => {
	it('registers command named bench', () => {
		const program = new Command();
		benchCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'bench');
		expect(cmd).toBeDefined();
		expect(cmd!.name()).toBe('bench');
	});

	it('calls the tool run() with empty options', async () => {
		vi.clearAllMocks();
		const program = new Command();
		benchCmd.register(program);
		await program.parseAsync(['bench'], { from: 'user' });
		expect(vi.mocked(runBench)).toHaveBeenCalledWith({});
	});
});
