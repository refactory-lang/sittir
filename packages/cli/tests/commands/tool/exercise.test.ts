import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ exercise: vi.fn().mockResolvedValue(0) }));
import { exercise as exerciseCmd } from '../../../src/commands/tool/exercise.ts';
import { exercise as runExercise } from '@sittir/tools';

describe('tool exercise command', () => {
	it('registers with expected options', () => {
		const program = new Command();
		exerciseCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'exercise')!;
		expect(cmd.options.map((o) => o.long)).toEqual(
			expect.arrayContaining(['--grammar', '--kinds']),
		);
	});

	it('passes parsed options to the tool run()', async () => {
		const program = new Command();
		exerciseCmd.register(program);
		await program.parseAsync(['exercise', '--grammar', 'rust', '--kinds', 'foo, bar'], { from: 'user' });
		expect(vi.mocked(runExercise)).toHaveBeenCalledWith({
			grammar: 'rust',
			kinds: ['foo', 'bar'],
		});
	});
});
