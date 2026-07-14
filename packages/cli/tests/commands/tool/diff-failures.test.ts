import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ diffFailures: vi.fn().mockResolvedValue(0) }));
import { diffFailures as diffFailuresCmd } from '../../../src/commands/tool/diff-failures.ts';
import { diffFailures as runDiffFailures } from '@sittir/tools';

describe('tool diff-failures command', () => {
	it('registers command named diff-failures', () => {
		const program = new Command();
		diffFailuresCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'diff-failures');
		expect(cmd).toBeDefined();
		expect(cmd!.name()).toBe('diff-failures');
	});

	it('registers expected typed options', () => {
		const program = new Command();
		diffFailuresCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'diff-failures')!;
		const longs = cmd.options.map((o) => o.long);
		expect(longs).toEqual(expect.arrayContaining(['--grammar']));
	});

	it('passes parsed options to the tool run()', async () => {
		vi.clearAllMocks();
		const program = new Command();
		diffFailuresCmd.register(program);
		await program.parseAsync(['diff-failures', '--grammar', 'rust', 'rt'], { from: 'user' });
		expect(vi.mocked(runDiffFailures)).toHaveBeenCalledWith({
			grammar: 'rust',
			which: 'rt'
		});
	});
});
