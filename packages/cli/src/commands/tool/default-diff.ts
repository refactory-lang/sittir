import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const defaultDiff: CommandModule = {
	name: 'default-diff',
	describe: 'Rebuild idiomatic source through the builders with default render options, list every gap that differs, and attribute each to the render option site that fixes it',
	register: (program) => {
		defineCommand(program, defaultDiff)
			.argument('<files...>', 'Source files of one grammar, formatted with the language formatter first')
			.requiredOption('--grammar <name>', 'Grammar the files are written in')
			.option('--no-attribute', 'List the differing gaps only; skip the per-site experiments')
			.option('--rendered-dir <dir>', 'Write each file\'s rendered text into this directory')
			.option('--json', 'Print the result as JSON')
			.action(async (files: string[], opts: { grammar: string; attribute: boolean; json?: boolean; renderedDir?: string }) => {
				const { defaultDiff: runDefaultDiff } = await import('@sittir/tools');
				const code = await runDefaultDiff({ grammar: opts.grammar, files, json: opts.json ?? false, noAttribute: !opts.attribute, ...(opts.renderedDir === undefined ? {} : { renderedDir: opts.renderedDir }) });
				if (code !== 0) process.exitCode = code;
			});
	}
};
