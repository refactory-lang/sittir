import { Option } from 'commander';
import { type CommandModule, defineCommand } from '../framework/command-module.ts';
import { withGrammar, withOutput } from '../framework/options.ts';
import {
	runCodegen,
	runFullRegen,
	runStandaloneSteps,
	type CodegenOptions
} from '@sittir/codegen/run-codegen';

interface GenCliOptions {
	grammar?: string;
	output?: string;
	nodes?: string;
	all?: boolean;
	testsDir?: string;
	transpile?: boolean;
	compileParser?: boolean;
	tsGenerate?: boolean;
	skipTsChain?: boolean;
	buildNative?: boolean; // commander sets false for --no-build-native
	emitDiff?: boolean;    // commander sets false for --no-emit-diff
	roundtrip?: boolean;
	allowDiagnostic?: string[];
}

function collectRepeatable(value: string, previous: string[]): string[] {
	return [...previous, value];
}

export const gen: CommandModule = {
	name: 'gen',
	describe: 'Generate typed factories, templates, and native bindings from a grammar',
	register: (program) => {
		withOutput(withGrammar(defineCommand(program, gen)))
			.option('-n, --nodes <list>', 'Comma-separated node kinds to generate')
			.option('-a, --all', 'Generate TS + native render-module artifacts (full chain)')
			.option('--tests-dir <dir>', 'Output directory for test files')
			.option('--transpile', 'Transpile overrides.ts → .sittir/grammar.js')
			.option('--compile-parser', 'Compile override grammar to .sittir/parser.wasm')
			.option('--ts-generate', "Run 'tree-sitter generate' in .sittir/")
			.option('--skip-ts-chain', 'Skip the auto transpile + tree-sitter generate chain')
			.option('--roundtrip', 'Run validator probes after generation')
			.addOption(new Option('--no-build-native', 'Skip the post-regen N-API rebuild'))
			.addOption(new Option('--no-emit-diff', 'Suppress the post-regen emit diff'))
			.option(
				'--allow-diagnostic <code>',
				'Allow a blocking grammar diagnostic (repeatable)',
				collectRepeatable,
				[],
			)
			.action(async (opts: GenCliOptions) => {
				if (!opts.grammar) throw new Error('Missing required option: --grammar');
				const codegenOpts: CodegenOptions = {
					grammar: opts.grammar,
					outputDir: opts.output ?? '',
					nodes: opts.all ? undefined : opts.nodes?.split(','),
					all: opts.all,
					testsDir: opts.testsDir,
					roundtrip: opts.roundtrip,
					compileParser: opts.compileParser,
					transpile: opts.transpile,
					tsGenerate: opts.tsGenerate,
					skipTsChain: opts.skipTsChain,
					buildNative: opts.buildNative,       // false only if --no-build-native
					noEmitDiff: opts.emitDiff === false, // true only if --no-emit-diff
					allowDiagnostics: opts.allowDiagnostic,
				};

				// Standalone maintenance steps (--transpile / --compile-parser /
				// --ts-generate) run with only --grammar — no --output/--nodes/--all
				// required. When no --output is given, they are the whole job.
				if (opts.transpile || opts.compileParser || opts.tsGenerate) {
					await runStandaloneSteps(codegenOpts);
					if (!opts.output) return;
				}

				if (!opts.output) throw new Error('Missing required option: --output');
				if (!opts.all && !opts.nodes) throw new Error('Must provide --nodes or --all');
				if (opts.all) await runFullRegen(codegenOpts);
				else await runCodegen(codegenOpts);
			});
	},
};
