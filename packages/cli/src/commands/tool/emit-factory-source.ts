import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const emitFactorySource: CommandModule = {
	name: 'emit-factory-source',
	describe: 'Print the strict factory source that rebuilds a source file',
	register: (program) => {
		withGrammar(defineCommand(program, emitFactorySource))
			.requiredOption('-f, --file <path>', 'Source file to rebuild')
			.option('-e, --export <name>', 'Exported function name (default: rebuild<Basename>)')
			.option('-o, --out <path>', 'Write the module here instead of stdout')
			.option('-s, --surface <strict|loose>', 'Construction surface to spell: strict calls, or the loose contract', 'strict')
			.option('-n, --nested <calls|configs>', 'On the loose surface, nested compounds as builder calls or config objects', 'calls')
			.action(
				async (opts: {
					grammar?: string;
					file: string;
					export?: string;
					out?: string;
					surface: 'strict' | 'loose';
					nested: 'calls' | 'configs';
				}) => {
					const { emitFactorySource: runEmitFactorySource } = await import('@sittir/tools');
					const code = await runEmitFactorySource({
						grammar: opts.grammar ?? 'rust',
						file: opts.file,
						exportName: opts.export,
						out: opts.out,
						surface: opts.surface,
						nested: opts.nested
					});
					if (code !== 0) process.exitCode = code;
				}
			);
	}
};
