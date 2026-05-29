import type { CommandModule } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { probeValidate as runProbeValidate } from '@sittir/tools';

export const probeValidate: CommandModule = {
	name: 'probe-validate',
	describe: 'Probe a corpus entry through read → wrap → render pipeline',
	register: (program) => {
		withGrammar(program.command('probe-validate'))
			.description('Probe a corpus entry through read → wrap → render pipeline')
			.option('-e, --entry <name>', 'Corpus entry name (exact match)')
			.option('--entry-pattern <regex>', 'Corpus entry name (regex match, first hit)')
			.option('--first-failing', 'Probe the first RT-failing entry for the grammar')
			.option('-s, --source <text>', 'Source text to probe (same as probe-kind)')
			.option('--stdin', 'Read source from stdin')
			.option('--engine <engine>', 'Render engine: js | native | both (default: native)')
			.option('--trace', 'Emit full multi-lane trace')
			.option('--pretty', 'Pretty-print JSON output')
			.option('--no-render', 'Skip the render pass')
			.option('--no-wrap', 'Use core readNode directly (skip grammar readTreeNode)')
			.action(async (opts: {
				grammar?: string;
				entry?: string;
				entryPattern?: string;
				firstFailing?: boolean;
				source?: string;
				stdin?: boolean;
				engine?: string;
				trace?: boolean;
				pretty?: boolean;
				noRender?: boolean;
				noWrap?: boolean;
			}) => {
				const code = await runProbeValidate({
					grammar: opts.grammar ?? 'rust',
					engine: opts.engine ?? 'native',
					entry: opts.entry,
					entryPattern: opts.entryPattern,
					firstFailing: opts.firstFailing ?? false,
					source: opts.source,
					stdin: opts.stdin ?? false,
					trace: opts.trace ?? true,
					pretty: opts.pretty ?? true,
					noRender: opts.noRender ?? false,
					noWrap: opts.noWrap ?? false,
				});
				if (code !== 0) process.exitCode = code;
			});
	},
};
