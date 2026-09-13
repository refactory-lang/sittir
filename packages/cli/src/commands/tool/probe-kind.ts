import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { probeKind as runProbeKind } from '@sittir/tools';

export const probeKind: CommandModule = {
	name: 'probe-kind',
	describe: 'Structured diagnostics for parse → readNode → render cycle',
	register: (program) => {
		withGrammar(defineCommand(program, probeKind))
			.option('-s, --source <text>', 'Source text to probe')
			.option('--stdin', 'Read source from stdin')
			.option('-k, --kind <kind>', 'Find first node of this kind and probe it')
			.option('--range <start,end>', 'Probe node at byte range start,end')
			.option('--no-render', 'Skip the render pass')
			.option('--no-wrap', 'Use core readNode directly (skip grammar readTreeNode)')
			.option('--reparse', 'Render → re-parse → include reparsed CST')
			.option(
				'--validator-reparse',
				"Render → reparse using the validator's own wrapForReparse + offset lookup → include the selected wrapper, offset, located node, and structural diff"
			)
			.option('--pretty', 'Pretty-print JSON output (2-space indent)')
			.option('--baseline <dir>', 'Compare against a staged baseline package dir')
			.option('--baseline-parser', 'Use baseline parser.wasm instead of current')
			.option('--engine <engine>', 'Read path: js (TypeScript wrap) | native | both (default: native); rendering is always native')
			.option('--trace', 'Emit full multi-lane trace (both read paths, shallow + deep)')
			.option('--log-parse', 'Log tree-sitter parse events to stderr')
			.option('--full', 'Emit complete multi-lane trace (like --trace)')
			.option(
				'--shipped',
				"Also parse with the grammar's shipped upstream wasm (tree-sitter-<lang> on npm) and include its cst/sexp/hasError for comparison against the override parser"
			)
			.action(
				async (opts: {
					grammar?: string;
					source?: string;
					stdin?: boolean;
					kind?: string;
					range?: string;
					render?: boolean;
					wrap?: boolean;
					reparse?: boolean;
					validatorReparse?: boolean;
					pretty?: boolean;
					baseline?: string;
					baselineParser?: boolean;
					engine?: string;
					trace?: boolean;
					logParse?: boolean;
					full?: boolean;
					shipped?: boolean;
				}) => {
					// Commander stores `--no-render`/`--no-wrap` under the positive
					// key (opts.render/opts.wrap === false when the flag is passed).
					const code = await runProbeKind({
						grammar: opts.grammar ?? 'rust',
						source: opts.source,
						stdin: opts.stdin ?? false,
						kind: opts.kind,
						range: opts.range,
						noRender: opts.render === false,
						noWrap: opts.wrap === false,
						reparse: opts.reparse ?? false,
						validatorReparse: opts.validatorReparse ?? false,
						pretty: opts.pretty ?? false,
						baseline: opts.baseline,
						baselineParser: opts.baselineParser ?? false,
						engine: opts.engine,
						trace: opts.trace ?? false,
						logParse: opts.logParse ?? false,
						full: opts.full ?? false,
						shipped: opts.shipped ?? false
					});
					if (code !== 0) process.exitCode = code;
				}
			);
	}
};
