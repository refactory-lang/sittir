import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ dumpAstMismatches: vi.fn().mockResolvedValue(0) }));
import { dumpAstMismatches as dumpAstMismatchesCmd } from '../../../src/commands/tool/dump-ast-mismatches.ts';
import { dumpAstMismatches as runDumpAstMismatches } from '@sittir/tools';

describe('tool dump-ast-mismatches command', () => {
	it('registers with expected options', () => {
		const program = new Command();
		dumpAstMismatchesCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'dump-ast-mismatches')!;
		expect(cmd.options.map((o) => o.long)).toEqual(
			expect.arrayContaining([
				'--grammar',
				'--all-grammars',
				'--mode',
				'--filter',
				'--cluster',
				'--format',
				'--verbose'
			])
		);
	});

	it('passes parsed options to the tool run()', async () => {
		const program = new Command();
		dumpAstMismatchesCmd.register(program);
		await program.parseAsync(
			[
				'dump-ast-mismatches',
				'--grammar',
				'rust',
				'--all-grammars',
				'--mode',
				'diff',
				'--filter',
				'foo',
				'--cluster',
				'--format',
				'json',
				'--verbose'
			],
			{ from: 'user' }
		);
		expect(vi.mocked(runDumpAstMismatches)).toHaveBeenCalledWith({
			grammar: 'rust',
			allGrammars: true,
			mode: 'diff',
			filter: 'foo',
			cluster: true,
			format: 'json',
			verbose: true
		});
	});
});
