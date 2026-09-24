import { spawnSync } from 'node:child_process';
import { Option } from 'commander';
import { type CommandModule, defineCommand } from '../framework/command-module.ts';
import { withGrammar, withOutput } from '../framework/options.ts';
import type { CodegenOptions } from '@sittir/codegen/run-codegen';

interface GenCliOptions {
	grammar?: string;
	output?: string;
	all?: boolean;
	testsDir?: string;
	transpile?: boolean;
	compileParser?: boolean;
	tsGenerate?: boolean;
	skipTsChain?: boolean;
	buildNative?: boolean; // commander sets false for --no-build-native
	nativeDebug?: boolean;
	workspaceCheck?: boolean; // commander sets false for --no-workspace-check
	emitDiff?: boolean; // commander sets false for --no-emit-diff
	roundtrip?: boolean;
	postGenerateOnly?: boolean;
	allowDiagnostic?: string[];
}

function collectRepeatable(value: string, previous: string[]): string[] {
	return [...previous, value];
}

async function runPostGenerate(opts: GenCliOptions & { grammar: string }): Promise<void> {
	const [{ RUST_RENDER_GRAMMARS }, { emitParityFixtures, runRoundtripProbes }] = await Promise.all([
		import('@sittir/codegen/run-codegen'),
		import('@sittir/tools/post-generate')
	]);
	const isRustRender = opts.all === true && (RUST_RENDER_GRAMMARS as readonly string[]).includes(opts.grammar);
	if (isRustRender) {
		if (opts.buildNative !== false) {
			await emitParityFixtures(opts.grammar);
		} else {
			process.stderr.write(
				`[warning] [codegen] parity-fixtures[${opts.grammar}]: skipped — fixture extraction requires the ` +
					`post-regen native rebuild (--no-build-native was passed). test-fixtures.json left unchanged.\n`
			);
		}
	}
	if (opts.roundtrip) {
		const totalFail = await runRoundtripProbes(opts.grammar);
		if (totalFail > 0) {
			console.error(`\n${totalFail} render-parse / from() failure(s) — see above.`);
			process.exitCode = 1;
		}
	}
}

function runPostGenerateInFreshProcess(opts: GenCliOptions & { grammar: string }): void {
	const args = [
		...process.execArgv,
		process.argv[1]!,
		'gen',
		'--grammar',
		opts.grammar,
		'--post-generate-only',
		...(opts.all ? ['--all'] : []),
		...(opts.buildNative === false ? ['--no-build-native'] : []),
		...(opts.roundtrip ? ['--roundtrip'] : [])
	];
	const child = spawnSync(process.execPath, args, { stdio: 'inherit' });
	if (child.error) throw child.error;
	if (child.status !== 0) process.exitCode = child.status ?? 1;
}

export const gen: CommandModule = {
	name: 'gen',
	describe: 'Generate typed factories, templates, and native bindings from a grammar',
	register: (program) => {
		withOutput(withGrammar(defineCommand(program, gen)))
			.option('-a, --all', 'Generate TS + native render-module artifacts (full chain)')
			.option('--tests-dir <dir>', 'Output directory for test files')
			.option('--transpile', 'Transpile grammar.sittir.ts → .sittir/grammar.js')
			.option('--compile-parser', 'Compile override grammar to .sittir/parser.wasm')
			.option('--ts-generate', "Run 'tree-sitter generate' in .sittir/")
			.option('--skip-ts-chain', 'Skip the auto transpile + tree-sitter generate chain')
			.option('--roundtrip', 'Run validator probes after generation')
			.addOption(
				new Option('--post-generate-only', 'Run only the post-generate fixtures and probes').hideHelp()
			)
			.addOption(new Option('--no-build-native', 'Skip the post-regen N-API rebuild'))
			.option(
				'--native-debug',
				'Build the post-regen N-API binding in debug (incremental, unoptimized — dev iteration only, never for CI/validation)'
			)
			.addOption(
				new Option(
					'--no-workspace-check',
					'Skip the post-build cargo check --workspace (multi-grammar drivers run it once, on the last grammar)'
				)
			)
			.addOption(new Option('--no-emit-diff', 'Suppress the post-regen emit diff'))
			.option('--allow-diagnostic <code>', 'Allow a blocking grammar diagnostic (repeatable)', collectRepeatable, [])
			.action(async (opts: GenCliOptions) => {
				if (!opts.grammar) throw new Error('Missing required option: --grammar');
				const grammarOpts = { ...opts, grammar: opts.grammar };
				if (opts.postGenerateOnly) {
					await runPostGenerate(grammarOpts);
					return;
				}
				const { runCodegen, runFullRegen, runStandaloneSteps } = await import('@sittir/codegen/run-codegen');
				const codegenOpts: CodegenOptions = {
					grammar: opts.grammar,
					outputDir: opts.output ?? '',
					all: opts.all,
					testsDir: opts.testsDir,
					compileParser: opts.compileParser,
					transpile: opts.transpile,
					tsGenerate: opts.tsGenerate,
					skipTsChain: opts.skipTsChain,
					buildNative: opts.buildNative, // false only if --no-build-native
					nativeDebug: opts.nativeDebug, // true only if --native-debug
					workspaceCheck: opts.workspaceCheck, // false only if --no-workspace-check
					noEmitDiff: opts.emitDiff === false, // true only if --no-emit-diff
					allowDiagnostics: opts.allowDiagnostic
				};

				// Standalone maintenance steps (--transpile / --compile-parser /
				// --ts-generate) run with only --grammar — no --output/--all
				// required. When no --output is given, they are the whole job.
				if (opts.transpile || opts.compileParser || opts.tsGenerate) {
					await runStandaloneSteps(codegenOpts);
					if (!opts.output) return;
				}

				if (!opts.output) throw new Error('Missing required option: --output');

				// Generate (codegen).
				await (opts.all ? runFullRegen(codegenOpts) : runCodegen(codegenOpts));

				// Post-generate validation (tools) reads the regenerated runtime and
				// native binding, which this process may already hold from before the
				// regen, so it runs in a fresh process.
				if (opts.all || opts.roundtrip) runPostGenerateInFreshProcess(grammarOpts);
			});
	}
};
