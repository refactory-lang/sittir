import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ walk: vi.fn().mockResolvedValue(0) }));
import { walk as walkCmd } from '../../../src/commands/tool/walk.ts';
import { walk as runWalk } from '@sittir/tools';

describe('tool walk command', () => {
	it('registers with expected options', () => {
		const program = new Command();
		walkCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'walk')!;
		expect(cmd.options.map((o) => o.long)).toEqual(expect.arrayContaining(['--grammar', '--source', '--render']));
	});

	it('passes parsed options to the tool run()', async () => {
		const program = new Command();
		walkCmd.register(program);
		await program.parseAsync(['walk', '--grammar', 'rust', '--source', 'fn foo() {}', '--render'], { from: 'user' });
		expect(vi.mocked(runWalk)).toHaveBeenCalledWith({
			grammar: 'rust',
			source: 'fn foo() {}',
			render: true
		});
	});
});
