import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ probeValidate: vi.fn().mockResolvedValue(0) }));
import { probeValidate as probeValidateCmd } from '../../../src/commands/tool/probe-validate.ts';
import { probeValidate as runProbeValidate } from '@sittir/tools';

describe('tool probe-validate command', () => {
	it('registers command named probe-validate with expected options', () => {
		const program = new Command();
		probeValidateCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'probe-validate');
		expect(cmd).toBeDefined();
		expect(cmd!.name()).toBe('probe-validate');
		const longs = cmd!.options.map((o) => o.long);
		expect(longs).toEqual(
			expect.arrayContaining(['--grammar', '--entry', '--entry-pattern', '--engine', '--trace', '--pretty'])
		);
	});

	it('forwards parsed options to run()', async () => {
		vi.clearAllMocks();
		const program = new Command();
		probeValidateCmd.register(program);
		await program.parseAsync(
			['probe-validate', '--grammar', 'python', '--entry', 'Simple function', '--engine', 'native'],
			{ from: 'user' }
		);
		expect(vi.mocked(runProbeValidate)).toHaveBeenCalledWith(
			expect.objectContaining({
				grammar: 'python',
				entry: 'Simple function',
				engine: 'native',
				firstFailing: false,
				stdin: false,
			})
		);
	});
});
