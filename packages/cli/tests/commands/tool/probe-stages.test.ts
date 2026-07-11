import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ probeStages: vi.fn().mockResolvedValue(0) }));
import { probeStages as probeStagesCmd } from '../../../src/commands/tool/probe-stages.ts';
import { probeStages as runProbeStages } from '@sittir/tools';

describe('tool probe-stages command', () => {
	it('registers command named probe-stages', () => {
		const program = new Command();
		probeStagesCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'probe-stages');
		expect(cmd).toBeDefined();
		expect(cmd!.name()).toBe('probe-stages');
	});

	it('registers expected typed options', () => {
		const program = new Command();
		probeStagesCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'probe-stages')!;
		const longs = cmd.options.map((o) => o.long);
		expect(longs).toEqual(expect.arrayContaining(['--grammar', '--kind', '--compact', '--brief']));
	});

	it('passes parsed options to the tool run()', async () => {
		vi.clearAllMocks();
		const program = new Command();
		probeStagesCmd.register(program);
		await program.parseAsync(['probe-stages', '--grammar', 'rust', '--kind', 'block', '--compact'], { from: 'user' });
		expect(vi.mocked(runProbeStages)).toHaveBeenCalledWith({
			grammar: 'rust',
			kind: 'block',
			noOverrides: false,
			compact: true,
			skipEmit: false,
			brief: false
		});
	});
});
