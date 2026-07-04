import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { variantDerivationProbe as runVariantDerivationProbe } from '@sittir/tools';

export const variantDerivationProbe: CommandModule = {
	name: 'variant-derivation-probe',
	describe:
		'Assert the live structural variantChildKinds derivation equals committed node-model.json5 (cross-commit drift detector)',
	register: (program) => {
		withGrammar(defineCommand(program, variantDerivationProbe))
			.option('--all-grammars', 'Run every grammar (rust, typescript, python)')
			.action(async (opts: { grammar?: string; allGrammars?: boolean }) => {
				const code = await runVariantDerivationProbe({
					grammar: opts.grammar,
					allGrammars: opts.allGrammars ?? false
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
