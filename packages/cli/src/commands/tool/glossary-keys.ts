import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const glossaryKeys: CommandModule = {
	name: 'glossary-keys',
	describe:
		'Glossary key ratchet (every heading names one declaration; count undocumented exports; fail on a ceiling increase)',
	register: (program) => {
		defineCommand(program, glossaryKeys)
			.option('--update', 'Lower the committed ceilings to the current counts (never raises one)')
			.option('--table', 'Print every broken key with its class and glossary location')
			.option('--undocumented', 'Print every exported declaration no valid key resolves to')
			.option('--json', 'Machine-readable JSON output')
			.option('--ceilings <path>', 'Ceilings path (default: packages/tools/glossary-key-ceilings.json)')
			.action(
				async (opts: {
					update?: boolean;
					table?: boolean;
					undocumented?: boolean;
					json?: boolean;
					ceilings?: string;
				}) => {
					const { glossaryKeys: runGlossaryKeys } = await import('@sittir/tools');
					const code = await runGlossaryKeys({
						update: opts.update ?? false,
						table: opts.table ?? false,
						undocumented: opts.undocumented ?? false,
						json: opts.json ?? false,
						ceilings: opts.ceilings
					});
					if (code !== 0) process.exitCode = code;
				}
			);
	}
};
