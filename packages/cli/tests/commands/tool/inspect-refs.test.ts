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
		expect(cmd.options.map((o) => o.long)).toEqual(
			expect.arrayContaining(['--grammar', '--mode', '--symbol', '--base', '--limit']),
		);
	});

	it('passes parsed options to the tool run()', async () => {
		const program = new Command();
		inspectRefsCmd.register(program);
		await program.parseAsync(['inspect-refs', '--grammar', 'rust', '--mode', 'suggestions', '--symbol', 'foo', '--base', '--limit', '4'], { from: 'user' });
		expect(vi.mocked(runInspectRefs)).toHaveBeenCalledWith({
			mode: 'suggestions',
			grammar: 'rust',
			symbol: 'foo',
			useBase: true,
			limit: 4,
		});
	});
});
