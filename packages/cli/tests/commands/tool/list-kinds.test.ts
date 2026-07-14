import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ listKinds: vi.fn().mockResolvedValue(0) }));
import { listKinds as listKindsCmd } from '../../../src/commands/tool/list-kinds.ts';
import { listKinds as runListKinds } from '@sittir/tools';

describe('tool list-kinds command', () => {
	it('registers with --grammar/--groups/--unaliased/--phantom', () => {
		const program = new Command();
		listKindsCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'list-kinds')!;
		expect(cmd.options.map((o) => o.long)).toEqual(
			expect.arrayContaining(['--grammar', '--groups', '--unaliased', '--phantom'])
		);
	});
	it('passes parsed options to the tool run()', async () => {
		const program = new Command();
		listKindsCmd.register(program);
		await program.parseAsync(['list-kinds', '--grammar', 'rust', '--groups'], { from: 'user' });
		expect(vi.mocked(runListKinds)).toHaveBeenCalledWith(expect.objectContaining({ grammar: 'rust', groups: true }));
	});
});
