import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ profileFactory: vi.fn().mockResolvedValue(0) }));
import { profileFactory as profileFactoryCmd } from '../../../src/commands/tool/profile-factory.ts';
import { profileFactory as runProfileFactory } from '@sittir/tools';

describe('tool profile-factory command', () => {
	it('registers with --grammar/--recursive/--ast', () => {
		const program = new Command();
		profileFactoryCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'profile-factory')!;
		expect(cmd.options.map((o) => o.long)).toEqual(expect.arrayContaining(['--grammar', '--recursive', '--ast']));
	});

	it('passes parsed options to the tool run()', async () => {
		vi.clearAllMocks();
		const program = new Command();
		profileFactoryCmd.register(program);
		await program.parseAsync(['profile-factory', '--grammar', 'rust', '--recursive', '--ast'], { from: 'user' });
		expect(vi.mocked(runProfileFactory)).toHaveBeenCalledWith({
			grammar: 'rust',
			recursive: true,
			showAst: true,
		});
	});
});
