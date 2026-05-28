import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ classify: vi.fn().mockResolvedValue(0) }));
import { classify as classifyCmd } from '../../../src/commands/tool/classify.ts';
import { classify as runClassify } from '@sittir/tools';

describe('tool classify command', () => {
	it('registers with expected options', () => {
		const program = new Command();
		classifyCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'classify')!;
		expect(cmd.options.map((o) => o.long)).toEqual(
			expect.arrayContaining(['--grammar', '--kind', '--modeltype', '--all']),
		);
	});

	it('passes parsed options to the tool run()', async () => {
		const program = new Command();
		classifyCmd.register(program);
		await program.parseAsync(['classify', '--grammar', 'rust', '--kind', 'foo', '--modeltype', 'branch', '--all'], { from: 'user' });
		expect(vi.mocked(runClassify)).toHaveBeenCalledWith({
			grammar: 'rust',
			kinds: ['foo'],
			modelTypeFilter: 'branch',
			showAll: true,
		});
	});
});
