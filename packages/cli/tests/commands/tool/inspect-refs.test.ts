import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ inspectRefs: vi.fn().mockResolvedValue(0) }));
import { inspectRefs as inspectRefsCmd } from '../../../src/commands/tool/inspect-refs.ts';
import { inspectRefs as runInspectRefs } from '@sittir/tools';

describe('tool inspect-refs command', () => {
	it('registers with expected options', () => {
		const program = new Command();
		inspectRefsCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'inspect-refs')!;
		expect(cmd.options.map((o) => o.long)).not.toEqual(expect.arrayContaining(['--mode']));
		expect(cmd.options.map((o) => o.long)).toEqual(
			expect.arrayContaining(['--grammar', '--symbol', '--base'])
		);
	});

	it('passes parsed options to the tool run()', async () => {
		const program = new Command();
		inspectRefsCmd.register(program);
		await program.parseAsync(
			['inspect-refs', '--grammar', 'rust', '--symbol', 'foo', '--base'],
			{ from: 'user' }
		);
		expect(vi.mocked(runInspectRefs)).toHaveBeenCalledWith({ grammar: 'rust', symbol: 'foo', useBase: true });
	});
});
