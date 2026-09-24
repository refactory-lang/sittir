import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const defectHistogram: CommandModule = {
	name: 'defect-histogram',
	describe: 'Group read-render-parse failures by defect signature (deepest transport frame)',
	register: (program) => {
		withGrammar(defineCommand(program, defectHistogram)).action(async (opts: { grammar?: string }) => {
			const { defectHistogram: runDefectHistogram } = await import('@sittir/tools');
			const code = await runDefectHistogram({ grammar: opts.grammar ?? 'rust' });
			if (code !== 0) process.exitCode = code;
		});
	}
};
