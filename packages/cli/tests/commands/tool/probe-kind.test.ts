import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ probeKind: vi.fn().mockResolvedValue(0) }));
import { probeKind as probeKindCmd } from '../../../src/commands/tool/probe-kind.ts';
import { probeKind as runProbeKind } from '@sittir/tools';

describe('tool probe-kind command', () => {
	it('registers command named probe-kind', () => {
		const program = new Command();
		probeKindCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'probe-kind');
		expect(cmd).toBeDefined();
		expect(cmd!.name()).toBe('probe-kind');
	});

	it('registers expected typed options', () => {
		const program = new Command();
		probeKindCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'probe-kind')!;
		const longs = cmd.options.map((o) => o.long);
		expect(longs).toEqual(expect.arrayContaining(['--grammar', '--source', '--kind', '--engine', '--trace', '--pretty']));
	});

	it('passes parsed options to the tool run()', async () => {
		vi.clearAllMocks();
		const program = new Command();
		probeKindCmd.register(program);
		await program.parseAsync(['probe-kind', '--grammar', 'rust', '--source', 'let x = 1;', '--pretty'], { from: 'user' });
		expect(vi.mocked(runProbeKind)).toHaveBeenCalledWith(expect.objectContaining({
			grammar: 'rust',
			source: 'let x = 1;',
			pretty: true,
			stdin: false,
			noRender: false,
			trace: false,
		}));
	});
});
