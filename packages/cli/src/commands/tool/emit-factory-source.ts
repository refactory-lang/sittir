import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { emitFactorySource as runEmitFactorySource } from '@sittir/tools';

export const emitFactorySource: CommandModule = {
	name: 'emit-factory-source',
	describe: 'Print the strict factory source that rebuilds a source file',
	register: (program) => {
		withGrammar(defineCommand(program, emitFactorySource))
			.requiredOption('-f, --file <path>', 'Source file to rebuild')
			.option('-e, --export <name>', 'Exported function name (default: rebuild<Basename>)')
			.option('-o, --out <path>', 'Write the module here instead of stdout')
			.action(async (opts: { grammar?: string; file: string; export?: string; out?: string }) => {
				const code = await runEmitFactorySource({
					grammar: opts.grammar ?? 'rust',
					file: opts.file,
					exportName: opts.export,
					out: opts.out
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
