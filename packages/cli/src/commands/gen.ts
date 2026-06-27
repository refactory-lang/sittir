import { dirname, join } from 'node:path';
import { Option } from 'commander';
import { type CommandModule, defineCommand } from '../framework/command-module.ts';
import { withGrammar, withOutput } from '../framework/options.ts';
import {
	runCodegen,
	runFullRegen,
	runStandaloneSteps,
	RUST_RENDER_GRAMMARS,
	type CodegenOptions
} from '@sittir/codegen/run-codegen';
import { emitParityFixtures, runRoundtripProbes } from '@sittir/tools';

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
	buildNative?: boolean;     // commander sets false for --no-build-native
	workspaceCheck?: boolean;  // commander sets false for --no-workspace-check
	emitDiff?: boolean;        // commander sets false for --no-emit-diff
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
			.addOption(
				new Option(
					'--no-workspace-check',
					'Skip the post-build cargo check --workspace (multi-grammar drivers run it once, on the last grammar)'
				)
			)
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
					compileParser: opts.compileParser,
					transpile: opts.transpile,
					tsGenerate: opts.tsGenerate,
					skipTsChain: opts.skipTsChain,
					buildNative: opts.buildNative,       // false only if --no-build-native
					workspaceCheck: opts.workspaceCheck, // false only if --no-workspace-check
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

				// Generate (codegen) → returns the assembled NodeMap.
				const nodeMap = opts.all
					? await runFullRegen(codegenOpts)
					: await runCodegen(codegenOpts);

				// Post-generate validation (tools). Codegen now only generates +
				// builds; the cli orchestrates the validation passes that used to run
				// inline in run-codegen — this is what keeps codegen free of any
				// dependency on the tools/validation layer.
				const templatesDir = join(dirname(opts.output), 'templates');
				const isRustRender =
					opts.all === true &&
					(RUST_RENDER_GRAMMARS as readonly string[]).includes(opts.grammar);

				// Parity fixtures emit on every --all regen (the Rust parity harness
				// reads test-fixtures.json). Extraction requires the post-regen native
				// rebuild, so skip — with a warning — under --no-build-native.
				if (isRustRender) {
					if (opts.buildNative !== false) {
						await emitParityFixtures(opts.grammar, templatesDir);
					} else {
						process.stderr.write(
							`[warning] [codegen] parity-fixtures[${opts.grammar}]: skipped — fixture extraction requires the ` +
								`post-regen native rebuild (--no-build-native was passed). test-fixtures.json left unchanged.\n`
						);
					}
				}

				// Optional round-trip validator probes (--roundtrip).
				if (opts.roundtrip) {
					const totalFail = await runRoundtripProbes(opts.grammar, templatesDir, nodeMap);
					if (totalFail > 0) {
						console.error(`\n${totalFail} render-parse / from() failure(s) — see above.`);
						process.exitCode = 1;
					}
				}
			});
	},
};
