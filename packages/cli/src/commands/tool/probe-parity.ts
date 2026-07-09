import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { probeParity as runProbeParity } from '@sittir/tools';

export const probeParity: CommandModule = {
	name: 'probe-parity',
	describe: 'Probe read-render-parse coverage for a target kind',
	register: (program) => {
		withGrammar(defineCommand(program, probeParity))
			.option('-t, --target <kind>', 'Target kind to check coverage for', 'visibility_modifier')
			.action(async (opts: { grammar?: string; target?: string }) => {
				const code = await runProbeParity({
					grammar: opts.grammar ?? 'rust',
					target: opts.target ?? 'visibility_modifier'
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
