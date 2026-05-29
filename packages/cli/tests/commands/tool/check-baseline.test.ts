import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ checkBaseline: vi.fn().mockResolvedValue(0) }));
import { checkBaseline as checkBaselineCmd } from '../../../src/commands/tool/check-baseline.ts';
import { checkBaseline as runCheckBaseline } from '@sittir/tools';

describe('tool check-baseline command', () => {
	it('registers with --collect and --base/--head options', () => {
		const program = new Command();
		checkBaselineCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'check-baseline')!;
		const longs = cmd.options.map((o) => o.long);
		expect(longs).toEqual(expect.arrayContaining(['--collect', '--base', '--head', '--backend']));
	});

	it('passes collect mode options to the tool run()', async () => {
		vi.clearAllMocks();
		const program = new Command();
		checkBaselineCmd.register(program);
		await program.parseAsync(['check-baseline', '--collect', '--backend', 'native'], { from: 'user' });
		expect(vi.mocked(runCheckBaseline)).toHaveBeenCalledWith(expect.objectContaining({
			collect: true,
			backend: 'native',
		}));
	});

	it('passes check mode options to the tool run()', async () => {
		vi.clearAllMocks();
		const program = new Command();
		checkBaselineCmd.register(program);
		await program.parseAsync(['check-baseline', '--base', 'base.json', '--head', 'head.json'], { from: 'user' });
		expect(vi.mocked(runCheckBaseline)).toHaveBeenCalledWith(expect.objectContaining({
			collect: false,
			base: 'base.json',
			head: 'head.json',
		}));
	});
});
