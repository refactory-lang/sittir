import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ overrideCensus: vi.fn().mockResolvedValue(0) }));
import { overrideCensus as overrideCensusCmd } from '../../../src/commands/tool/override-census.ts';
import { overrideCensus as runOverrideCensus } from '@sittir/tools';

describe('tool override-census command', () => {
	it('registers with --grammar/--json', () => {
		const program = new Command();
		overrideCensusCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'override-census')!;
		expect(cmd.options.map((o) => o.long)).toEqual(expect.arrayContaining(['--grammar', '--json']));
	});
	it('passes parsed options to the tool run()', async () => {
		const program = new Command();
		overrideCensusCmd.register(program);
		await program.parseAsync(['override-census', '--grammar', 'python', '--json'], { from: 'user' });
		expect(vi.mocked(runOverrideCensus)).toHaveBeenCalledWith({ grammar: 'python', json: true });
	});
});
