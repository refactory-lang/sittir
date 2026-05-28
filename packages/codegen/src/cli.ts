#!/usr/bin/env node
/**
 * CLI entry point for sittir codegen.
 *
 * Usage:
 *   sittir --grammar rust --all --output src/
 *   sittir --grammar rust --nodes struct_item,function_item --output src/
 *
 * The code-generation orchestration lives in `./run-codegen.ts`
 * (`runCodegen` / `runFullRegen` / `runGrammarDiagnosticsPreflight`); this file
 * is the thin argument-parsing + dispatch layer. The exported `runCodegenCli`
 * preflight seam is retained for the grammar-diagnostics tests.
 */

import { resolve } from 'node:path';
import { transpileOverrides } from './transpile/transpile-overrides.ts';
import {
	runCodegen,
	runFullRegen,
	runGrammarDiagnosticsPreflight,
	runTreeSitterGenerate,
	type CodegenOptions
} from './run-codegen.ts';
import type { GrammarDiagnostic } from './compiler/grammar-diagnostics.ts';

// Detect whether this module is being executed as the entry point or imported for testing.
// All CLI side effects are guarded behind this flag so that test files can safely import
// the exported helpers without triggering argument parsing, generation, or process.exit.
const _isMain = import.meta.url === `file://${process.argv[1]}`;

type ToolsDispatch = (argv: string[]) => Promise<number>;

/**
 * Keep the tools router names local to avoid a codegen ↔ tools package cycle.
 * The codegen CLI delegates to the tools source entrypoint only when the first
 * argument is one of these known tool subcommands.
 */
const TOOL_NAMES = new Set([
	'probe-kind',
	'probe-stages',
	'probe-parity',
	'profile',
	'profile-factory',
	'bench',
	'bench-codemod',
	'counts',
	'diff-failures',
	'check-baseline',
	'check-perf',
	'check-jinja',
	'list-kinds',
	'classify',
	'phantom-kinds',
	'field-provenance',
	'inspect-type',
	'inspect-refs',
	'compare-overrides',
	'walk',
	'exercise'
]);

interface CliArgs {
	grammar?: string;
	nodes?: string[];
	outputDir?: string;
	allowDiagnostics?: string[];
	all?: boolean;
	testsDir?: string;
	roundtrip?: boolean;
	compileParser?: boolean;
	transpile?: boolean;
	tsGenerate?: boolean;
	skipTsChain?: boolean;
	buildNative?: boolean;
	noEmitDiff?: boolean;
	help?: boolean;
}

function parseArgs(argv: string[]): CliArgs {
	const args: CliArgs = {};
	for (let i = 2; i < argv.length; i++) {
		const arg = argv[i];
		switch (arg) {
			case '--grammar':
			case '-g':
				args.grammar = argv[++i];
				break;
			case '--nodes':
			case '-n':
				args.nodes = argv[++i]?.split(',');
				break;
			case '--output':
			case '-o':
				args.outputDir = argv[++i];
				break;
			case '--all':
			case '-a':
				args.all = true;
				break;
			case '--tests-dir':
				args.testsDir = argv[++i];
				break;
			case '--roundtrip':
				args.roundtrip = true;
				break;
			case '--compile-parser':
				args.compileParser = true;
				break;
			case '--transpile':
				args.transpile = true;
				break;
			case '--ts-generate':
				args.tsGenerate = true;
				break;
			case '--skip-ts-chain':
				args.skipTsChain = true;
				break;
			case '--no-build-native':
				args.buildNative = false;
				break;
			case '--no-emit-diff':
				args.noEmitDiff = true;
				break;
			case '--allow-diagnostic':
				args.allowDiagnostics = [...(args.allowDiagnostics ?? []), argv[++i]!];
				break;
			case '--help':
			case '-h':
				args.help = true;
				break;
		}
	}
	return args;
}

/** Build the library-facing CodegenOptions from parsed CLI args. */
function toCodegenOptions(cliArgs: CliArgs): CodegenOptions {
	return {
		grammar: cliArgs.grammar!,
		outputDir: cliArgs.outputDir!,
		nodes: cliArgs.all ? undefined : cliArgs.nodes,
		all: cliArgs.all,
		testsDir: cliArgs.testsDir,
		roundtrip: cliArgs.roundtrip,
		compileParser: cliArgs.compileParser,
		transpile: cliArgs.transpile,
		tsGenerate: cliArgs.tsGenerate,
		skipTsChain: cliArgs.skipTsChain,
		buildNative: cliArgs.buildNative,
		noEmitDiff: cliArgs.noEmitDiff,
		allowDiagnostics: cliArgs.allowDiagnostics
	};
}

/**
 * Testable codegen CLI preflight gate.
 *
 * Parses the given argv, runs the grammar-diagnostics preflight, and returns
 * 0 when all blocking diagnostics are covered by `--allow-diagnostic` flags
 * (or absent). Throws `GrammarDiagnosticError` when blocking diagnostics are
 * present and neither allowed nor confirmed interactively.
 *
 * Test seams:
 * - `env.diagnostics` — inject full `GrammarDiagnostic[]` to bypass grammar loading.
 * - `env.confirm`     — inject a prompt callback to exercise the interactive TTY
 *   path without reading from process.stdin.
 * - `env.isTTY`       — override `process.stdin.isTTY` for the gate decision.
 *
 * Note: this function only covers the preflight phase. The full code-generation
 * pipeline (transpile, generate, write, roundtrip) runs only in `mainCli()`,
 * which executes when the module is the CLI entry point.
 */
export async function runCodegenCli(
	argv: string[],
	env: {
		isTTY?: boolean;
		diagnostics?: readonly GrammarDiagnostic[];
		confirm?: (blocked: readonly GrammarDiagnostic[]) => Promise<boolean>;
	} = {}
): Promise<number> {
	const cliArgs = parseArgs(['node', 'cli.ts', ...argv]);
	const allowDiagnostics = new Set(cliArgs.allowDiagnostics ?? []);
	await runGrammarDiagnosticsPreflight({
		grammar: cliArgs.grammar ?? '',
		allowDiagnostics,
		isTTY: env.isTTY ?? Boolean((process.stdin as NodeJS.ReadStream).isTTY),
		injectedDiagnostics: env.diagnostics,
		confirm: env.confirm
	});
	return 0;
}

// ---------------------------------------------------------------------------
// Main CLI execution — only runs when this module is the entry point.
// ---------------------------------------------------------------------------

async function mainCli(): Promise<void> {
	// Codegen IS the writer of the per-grammar manifest. Internal validator runs
	// invoked from inside the pipeline (e.g. extractParityFixtures uses
	// validateReadRenderParse to extract parity fixtures BEFORE the manifest is
	// rewritten) would otherwise verify the manifest mid-write — checking the
	// codegen process against its own incomplete output, which is meaningless.
	// Set the env so `loadLanguageForGrammar` skips verification for these
	// internal calls. (runCodegen also sets this; setting it here covers the
	// standalone transpile/compile branch below.)
	process.env.SITTIR_INTERNAL_CODEGEN_RUN = '1';

	const firstArg = process.argv[2];
	if (firstArg !== undefined && TOOL_NAMES.has(firstArg)) {
		const toolsCliPath = new URL('../../tools/src/cli.ts', import.meta.url).pathname;
		const { dispatch }: { dispatch: ToolsDispatch } = await import(toolsCliPath);
		process.exit(await dispatch(process.argv.slice(2)));
	}

	const cliArgs = parseArgs(process.argv);

	if (cliArgs.help) {
		console.log(`
Usage: sittir --grammar <name> [--all | --nodes <kinds>] --output <dir>

Options:
  --grammar, -g    Grammar name (rust, typescript, python)
  --nodes, -n      Comma-separated node kinds to generate
  --all, -a        Generate TS output plus native render-module artifacts
                   for supported grammars (rust, typescript, python)
  --output, -o     Output directory for generated files
  --tests-dir      Output directory for test files (default: ../tests)
  --allow-diagnostic <code>
                   Allow a blocking grammar-diagnostic code to proceed;
                   repeat for multiple codes (e.g. parsekind-noninjective).
                   In non-interactive mode a blocking code that is not
                   allowed causes the CLI to exit non-zero.
  --transpile      Transpile overrides.ts to .sittir/grammar.js
  --compile-parser Compile override grammar to .sittir/parser.wasm
  --ts-generate    Run 'tree-sitter generate' in .sittir/ to produce
                   grammar.json + node-types.json
  --skip-ts-chain  Skip the auto transpile + tree-sitter generate chain
                   that --all normally runs before sittir codegen
  --no-build-native  Skip the post-regen N-API binding rebuild (suppresses the
                   cargo rebuild that --all triggers after emitting native
                   artifacts; useful when you only want updated TS/Rust
                   source files without a full native recompile).
  --no-emit-diff   Suppress the post-regen "Regen diff vs HEAD" report that
                   --all prints (grouped by emitter). Useful in CI / scripts.
  --help, -h       Show this help

With --all (without --skip-ts-chain), the CLI chains:
  1. Transpile overrides.ts → .sittir/grammar.js
  2. Run tree-sitter generate → .sittir/src/{grammar,node-types}.json
  3. Run sittir codegen → packages/<grammar>/src/*
`);
		process.exit(0);
	}

	if (!cliArgs.grammar) {
		console.error('Missing required argument: --grammar. Use --help for usage.');
		process.exit(1);
	}

	// Standalone transpile/compile/ts-generate — doesn't require --output.
	// These are quick single-step CLI conveniences that bypass the full
	// generate pipeline; they exit early when no --output is given.
	if (cliArgs.transpile || cliArgs.compileParser || cliArgs.tsGenerate) {
		const grammarDir = resolve('packages', cliArgs.grammar);
		if (cliArgs.transpile) {
			console.log(`Transpiling ${cliArgs.grammar} overrides...`);
			const tr = await transpileOverrides({ grammar: cliArgs.grammar });
			console.log(`  → ${tr.outputPath} (${tr.outputBytes} bytes)`);
		}
		if (cliArgs.tsGenerate) {
			runTreeSitterGenerate(cliArgs.grammar);
		}
		if (cliArgs.compileParser) {
			console.log(`Compiling ${cliArgs.grammar} parser to WASM...`);
			const { compileParser } = await import('./transpile/compile-parser.ts');
			const wasmPath = await compileParser(grammarDir);
			console.log(`  → ${wasmPath}`);
		}
		if (!cliArgs.outputDir) process.exit(0);
	}

	if (!cliArgs.outputDir) {
		console.error('Missing required argument: --output. Use --help for usage.');
		process.exit(1);
	}

	if (!cliArgs.all && (!cliArgs.nodes || cliArgs.nodes.length === 0)) {
		console.error('Must provide --nodes or --all. Use --help for usage.');
		process.exit(1);
	}

	// Delegate to the codegen library. runFullRegen runs the --all auto-chain
	// (transpile → tree-sitter generate → compile-parser) before runCodegen;
	// runCodegen runs the grammar-diagnostics preflight, then generate + writes
	// + manifest + optional roundtrip. The standalone branch above already ran
	// any explicit transpile/ts-generate, so pass skipTsChain through to avoid
	// double work (preserves the original behavior where the auto-chain was
	// guarded by `!transpile && !tsGenerate`).
	const opts = toCodegenOptions(cliArgs);
	if (cliArgs.all) {
		await runFullRegen(opts);
	} else {
		await runCodegen(opts);
	}
}

if (_isMain) {
	await mainCli();
}
