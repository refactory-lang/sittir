import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ profile: vi.fn().mockResolvedValue(0) }));
import { profile as profileCmd } from '../../../src/commands/tool/profile.ts';
import { profile as runProfile } from '@sittir/tools';

describe('tool profile command', () => {
	it('registers with --grammar/--top', () => {
		const program = new Command();
		profileCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'profile')!;
		expect(cmd.options.map((o) => o.long)).toEqual(expect.arrayContaining(['--grammar', '--top']));
	});

	it('passes parsed options to the tool run()', async () => {
		vi.clearAllMocks();
		const program = new Command();
		profileCmd.register(program);
		await program.parseAsync(['profile', '--grammar', 'rust', '--top', '15'], { from: 'user' });
		expect(vi.mocked(runProfile)).toHaveBeenCalledWith({ grammar: 'rust', top: 15 });
	});
});
