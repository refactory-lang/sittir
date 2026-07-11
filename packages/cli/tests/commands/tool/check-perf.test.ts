import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ checkPerf: vi.fn().mockResolvedValue(0) }));
import { checkPerf as checkPerfCmd } from '../../../src/commands/tool/check-perf.ts';
import { checkPerf as runCheckPerf } from '@sittir/tools';

describe('tool check-perf command', () => {
	it('registers command named check-perf', () => {
		const program = new Command();
		checkPerfCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'check-perf');
		expect(cmd).toBeDefined();
		expect(cmd!.name()).toBe('check-perf');
	});

	it('registers --baseline and --metrics options', () => {
		const program = new Command();
		checkPerfCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'check-perf')!;
		const longs = cmd.options.map((o) => o.long);
		expect(longs).toEqual(expect.arrayContaining(['--baseline', '--metrics']));
	});

	it('passes parsed options to the tool run()', async () => {
		vi.clearAllMocks();
		const program = new Command();
		checkPerfCmd.register(program);
		await program.parseAsync(['check-perf', '--baseline', 'my-baseline.json', '--metrics', 'my-metrics.json'], {
			from: 'user'
		});
		expect(vi.mocked(runCheckPerf)).toHaveBeenCalledWith({
			baseline: 'my-baseline.json',
			metrics: 'my-metrics.json'
		});
	});
});
