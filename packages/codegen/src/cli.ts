#!/usr/bin/env node
/**
 * CLI entry point for sittir codegen.
 *
 * Usage:
 *   sittir --grammar rust --all --output src/
 *   sittir --grammar rust --nodes struct_item,function_item --output src/
 */

import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { validateReadRenderParse, formatReadRenderParseReport } from './validate/read-render-parse.ts';
import { validateFactoryRenderParse, formatFactoryRenderParseReport } from './validate/factory-render-parse.ts';
import { validateFrom, formatFromReport } from './validate/from.ts';
import { validateRenderableFromNodeMap, formatRenderableReport } from './validate/renderable.ts';
import { validateReadProjection, formatReadProjectionReport } from './validate/read-projection.ts';

// Facade-aligned helpers for the --roundtrip validator passes.
// @sittir/validator cannot be imported here (it depends on this package),
// so these thin wrappers mirror its runRt / runFactory / runFrom API to keep
// the roundtrip call-sites at the same abstraction level as the validator facade.
/** @see @sittir/validator's `runRt` */
function runRt(grammar: string, tp: string, backend: 'native' | 'typescript' = 'native') {
	return validateReadRenderParse(grammar, tp, { backend });
}
/** @see @sittir/validator's `runFactory` */
function runFactory(grammar: string, tp: string, backend: 'native' | 'typescript' = 'native') {
	return validateFactoryRenderParse(grammar, tp, backend);
}
/** @see @sittir/validator's `runFrom` */
function runFrom(grammar: string, backend: 'native' | 'typescript' = 'native') {
	return validateFrom(grammar, backend);
}
import { join, dirname, resolve } from 'node:path';
import { generate } from './compiler/generate.ts';
import { emitSuggested } from './emitters/suggested.ts';
import type { RoundTripDiagnostic } from './emitters/suggested.ts';
import { compileParser } from './transpile/compile-parser.ts';
import { transpileOverrides } from './transpile/transpile-overrides.ts';
import { writeJinjaTemplates } from './emitters/templates.ts';
import { renderModuleSrcDir } from './emitters/render-module-paths.ts';
import { extractParityFixtures, serializeFixtures, fixturesOutputPath } from './emitters/parity-fixtures.ts';
import { writeManifestForGrammar, type Grammar } from './scripts/generated-manifest.ts';

// Codegen IS the writer of the per-grammar manifest. Internal validator runs
// invoked from inside this CLI (e.g. extractParityFixtures uses
// validateReadRenderParse to extract parity fixtures BEFORE the manifest is
// rewritten) would otherwise verify the manifest mid-write — checking the
// codegen process against its own incomplete output, which is meaningless.
// Set the env so `loadLanguageForGrammar` skips verification for these
// internal calls. External callers (validator CLI, probe-validate, etc.) do
// not run this CLI and therefore do not inherit this env.
process.env.SITTIR_INTERNAL_CODEGEN_RUN = '1';

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

const firstArg = process.argv[2];
if (firstArg !== undefined && TOOL_NAMES.has(firstArg)) {
	const toolsCliPath = new URL('../../tools/src/cli.ts', import.meta.url).pathname;
	const { dispatch }: { dispatch: ToolsDispatch } = await import(toolsCliPath);
	process.exit(await dispatch(process.argv.slice(2)));
}

interface CodegenConfig {
	grammar: string;
	nodes?: string[];
	outputDir: string;
}

interface CliArgs {
	grammar?: string;
	nodes?: string[];
	outputDir?: string;
	all?: boolean;
	testsDir?: string;
	roundtrip?: boolean;
	compileParser?: boolean;
	transpile?: boolean;
	tsGenerate?: boolean;
	skipTsChain?: boolean;
	buildNative?: boolean;
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
			case '--help':
			case '-h':
				args.help = true;
				break;
		}
	}
	return args;
}

function writeFile(path: string, content: string): void {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, content, 'utf8');
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

// Run 'tree-sitter generate' in a grammar's .sittir/ directory — produces
// grammar.json + node-types.json from the transpiled grammar.js. Uses
// execSync (shell-level) rather than spawnSync; tree-sitter is a native
// binary so either would launch a separate OS process (no Node module
// sharing concern) — exec is just simpler for a bare command.
function runTreeSitterGenerate(grammar: string): void {
	const sittirDir = resolve('packages', grammar, '.sittir');
	console.log(`Running 'tree-sitter generate' in ${sittirDir}...`);
	execSync('npx tree-sitter generate', {
		cwd: sittirDir,
		stdio: 'inherit'
	});
}

// Standalone transpile/compile/ts-generate — doesn't require --output.
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

// Auto-chain: with --all, by default run transpile + tree-sitter generate
// + compile-parser BEFORE sittir codegen. This produces fresh
// .sittir/grammar.js, .sittir/src/{grammar,node-types}.json, AND a
// fresh .sittir/parser.wasm — sittir codegen then reads those to emit
// packages/<grammar>/src/*. Opt out with --skip-ts-chain if you only
// want the sittir codegen phase (e.g., rapid iteration when the upstream
// grammar hasn't changed).
//
// parser.wasm MUST be rebuilt alongside grammar.js / node-types.json —
// otherwise validators that consult the override parser (via
// loadLanguageForGrammar) see a stale parser that doesn't know about
// recent `field(...)` / `variant(...)` additions, producing silent
// AST mismatches in round-trip tests.
if (cliArgs.all && !cliArgs.skipTsChain && !cliArgs.transpile && !cliArgs.tsGenerate) {
	console.log(
		`Full regenerate for ${cliArgs.grammar}: transpile + tree-sitter generate + compile-parser + sittir codegen`
	);
	const grammarDir = resolve('packages', cliArgs.grammar);
	console.log(`Transpiling ${cliArgs.grammar} overrides...`);
	const tr = await transpileOverrides({ grammar: cliArgs.grammar });
	console.log(`  → ${tr.outputPath} (${tr.outputBytes} bytes)`);
	runTreeSitterGenerate(cliArgs.grammar);
	console.log(`Compiling ${cliArgs.grammar} parser to WASM...`);
	const wasmPath = await compileParser(grammarDir);
	console.log(`  → ${wasmPath}`);
}

const config: CodegenConfig = {
	grammar: cliArgs.grammar!,
	nodes: cliArgs.all ? undefined : cliArgs.nodes,
	outputDir: cliArgs.outputDir!
};

console.log(`Generating ${config.grammar} IR...`);
const result = await generate({
	grammar: config.grammar,
	nodes: config.nodes,
	outputDir: config.outputDir,
	emitRenderModule: cliArgs.all
});

const outDir = cliArgs.outputDir;

// Write source files
writeFile(join(outDir, 'grammar.ts'), result.grammar);
writeFile(join(outDir, 'engine.ts'), result.engine);
writeFile(join(outDir, 'types.ts'), result.types);
writeFile(join(outDir, 'factories.ts'), result.factories);
writeFile(join(outDir, 'wrap.ts'), result.wrap);
writeFile(join(outDir, 'utils.ts'), result.utils);
writeFile(join(outDir, 'from.ts'), result.from);
writeFile(join(outDir, 'ir.ts'), result.irNamespace);
writeFile(join(outDir, 'consts.ts'), result.consts);
writeFile(join(outDir, 'is.ts'), result.is);
writeFile(join(outDir, 'index.ts'), result.index);

// Write per-rule `.jinja` files to packages/<grammar>/templates/
// (feature 011). writeJinjaTemplates also deletes stale `.jinja` files
// whose rule kind is no longer in the grammar.
writeJinjaTemplates(result.jinjaTemplates, join(dirname(outDir), 'templates'));

// --- grammar-owned Rust render-module emission (spec 012 T017) ---
// When `--all` is set for a supported grammar, also emit hash.rs / hash.ts
// so the native backend and the TS backend can detect template-bundle drift
// at runtime (FR-020). The hash is computed over the same `.jinja`
// bodies that were just written above — this keeps the TS-side and
// Rust-side derivations in lockstep.
const RUST_RENDER_GRAMMARS = ['rust', 'typescript', 'python'] as const;
const shouldEmitRustRender = cliArgs.all && (RUST_RENDER_GRAMMARS as readonly string[]).includes(config.grammar);

if (shouldEmitRustRender) {
	const grammar = config.grammar as (typeof RUST_RENDER_GRAMMARS)[number];
	const renderModule = result.renderModule;
	if (!renderModule) {
		throw new Error(`generate() did not return renderModule output for ${grammar}`);
	}
	const emit = renderModule.emit;
	writeFile(emit.hashRs.path, emit.hashRs.contents);
	writeFile(emit.hashTs.path, emit.hashTs.contents);
	writeFile(emit.templatesRs.path, emit.templatesRs.contents);
	writeFile(emit.dispatchRs.path, emit.dispatchRs.contents);
	writeFile(emit.transportRs.path, emit.transportRs.contents);
	writeFile(emit.bridgeRs.path, emit.bridgeRs.contents);
	writeFile(emit.libRs.path, emit.libRs.contents);
	// Copy the per-kind `.jinja` files into the grammar crate's templates/
	// directory so askama's build-time `#[template(path = ...)]` can
	// resolve them (T030). Stale files (no longer in the generated copy
	// plan) are removed so regenerations don't accumulate dead templates.
	const dstTemplatesDir = renderModule.templateCopies.directory;
	mkdirSync(dstTemplatesDir, { recursive: true });
	const emittedNames = new Set<string>();
	for (const file of renderModule.templateCopies.files) {
		writeFile(file.path, file.contents);
		emittedNames.add(file.path.split('/').pop() ?? file.path);
	}
	for (const existing of readdirSync(dstTemplatesDir)) {
		if (!existing.endsWith('.jinja')) continue;
		if (!emittedNames.has(existing)) rmSync(join(dstTemplatesDir, existing), { force: true });
	}
	// Write per-grammar kind_ids.rs (Phase B: KindID runtime migration).
	// This file exports one pub const per kind matching the TS-side TSKindId enum.
	if (result.kindIds) {
		const kindIdsPath = `${renderModuleSrcDir(grammar)}/kind_ids.rs`;
		writeFile(kindIdsPath, result.kindIds);
		console.log(`    ${kindIdsPath}`);
	}
	console.log(`  → Rust render module regenerated for ${grammar}:`);
	console.log(`    ${emit.hashRs.path}`);
	console.log(`    ${emit.hashTs.path}`);
	console.log(`    ${emit.templatesRs.path}`);
	console.log(`    ${emit.libRs.path}`);
	console.log(`    ${dstTemplatesDir}/ (${emittedNames.size} .jinja files)`);

	// --- parity-fixture extraction (spec 012 T045 / T046) ---
	// Run the round-trip validator in fixture-capture mode. Every
	// successfully round-tripped kind emits a paired (render,
	// roundtrip) fixture; the result is written to
	// rust/crates/sittir-{grammar}/test-fixtures.json where the
	// Rust parity harness (T047) reads it via serde_json.
	//
	// FR-011 required-kinds gate lives in `extractParityFixtures` —
	// throws when the corpus doesn't cover the exception kinds for
	// this grammar. Regen fails loudly rather than emitting an
	// insufficient fixture set.
	const templatesPath = join(dirname(outDir), 'templates');
	const extracted = await extractParityFixtures(grammar, templatesPath);
	const fxPath = fixturesOutputPath(grammar);
	writeFile(fxPath, serializeFixtures(extracted.fixtures));
	console.log(
		`    ${fxPath} (${extracted.renderCount} render + ${extracted.roundTripCount} roundtrip, ${extracted.coveredKinds.size} kinds)`
	);

	// Rebuild the corresponding N-API binding so the native render path
	// picks up the new templates. Askama compiles templates at the
	// crate's build time via proc macro; without a rebuild, native
	// baseline collection silently falls back to TS render with the
	// previous templates baked in. Opt out with --no-build-native.
	if (cliArgs.buildNative !== false) {
		const nativeCrate = `rust/crates/sittir-${grammar}`;
		console.log(`  → rebuilding grammar-owned N-API binding for ${grammar}…`);
		try {
			execSync(`pnpm -C ${nativeCrate} run build`, {
				stdio: 'inherit',
				cwd: process.cwd()
			});
		} catch (e) {
			console.error(
				`    N-API rebuild failed for ${grammar}. Native baseline collection will use stale templates. ` +
					`Re-run with --no-build-native to suppress this attempt, or fix the cargo build error.`
			);
			throw e;
		}

		// Workspace-wide compile check — codegen changes in render-module.ts
		// affect all three grammars' emitted transport.rs. Without a check
		// across the whole workspace, breakage in non-targeted grammars
		// (e.g. python or typescript) would silently persist until the next
		// per-grammar regen. cargo check is incremental: a no-op for the
		// crate just rebuilt by napi, and only compiles other crates whose
		// source changed since their last build.
		console.log(`  → cargo check --workspace (catches cross-grammar breakage)…`);
		try {
			execSync('cargo check --workspace --features napi-bindings', {
				stdio: 'inherit',
				cwd: process.cwd()
			});
		} catch (e) {
			console.error(
				`    Workspace cargo check failed. Other grammars' generated code does not compile — ` +
					`render-module.ts changes likely emit invalid code for them. Fix and re-run.`
			);
			throw e;
		}
	}
}

// Write validator-only factory metadata.
writeFile(join(dirname(outDir), 'factory-map.json5'), result.factoryMap);

// Write node model
writeFile(join(outDir, 'node-model.json5'), result.nodeModel);

// Write suggested overrides log (T042f) next to overrides.ts at the
// package root. This is a documentation file — not runnable.
writeFile(join(dirname(outDir), 'overrides.suggested.ts'), result.suggested);

// Write tests
const testsDir = cliArgs.testsDir ?? join(dirname(outDir), 'tests');
writeFile(join(testsDir, 'nodes.test.ts'), result.tests);

// Write type-level tests
writeFile(join(outDir, 'type-test.ts'), result.typeTests);

// Write vitest config
writeFile(join(dirname(outDir), 'vitest.config.ts'), result.config);

// --- Renderability check: every named kind in node-types.json must be
// reachable by @sittir/core's render() function (supertype, leaf, or rule).
// Uses the NodeMap directly for a structural truth check.
const renderable = validateRenderableFromNodeMap(config.grammar, result.nodeMap);
console.log('');
console.log(formatRenderableReport(renderable));
if (renderable.missing.length > 0) {
	// Warning-only: these are typically anonymous / alias-target kinds that
	// never get rendered as top-level nodes (e.g. `empty_statement`,
	// `doc_comment`). If user code DOES call render() on them, it will
	// throw — but that's a real consumer bug, not a codegen failure.
	console.warn(
		`\n${renderable.missing.length} un-renderable kind(s) — render() will throw if called on these instances.`
	);
}

// Write the per-grammar generated.manifest.json after all bulk writes complete
// and before any validation runs. Always happens regardless of --roundtrip,
// because the manifest needs to track the current on-disk state for any
// downstream validator (this CLI's roundtrip probes OR the external validator
// CLI). The only post-validation write is overrides.suggested.ts, which is
// intentionally excluded from the manifest (see pathsFor()).
writeManifestForGrammar(config.grammar as Grammar);
console.log(`  → packages/${config.grammar}/.sittir/generated.manifest.json updated`);

// --- Validation probes (optional, requires web-tree-sitter) ---
if (cliArgs.roundtrip) {
	console.log('\nRunning validator probes...');

	// read projection (structural) — upstream of render/factory.
	// A regression here means readNode is losing content between
	// tree-sitter's parse tree and the NodeData shape, so every
	// downstream validator will mis-report.
	const readProjectionResult = await validateReadProjection(config.grammar);
	console.log(formatReadProjectionReport(readProjectionResult));

	// Validators take the per-rule `.jinja` templates directory
	// path (feature 011). createRenderer auto-detects directory vs
	// legacy YAML file.
	const templatesDir = join(dirname(outDir), 'templates');
	const readRenderParseResult = await runRt(config.grammar, templatesDir);
	console.log(formatReadRenderParseReport(readRenderParseResult));

	// Factory render-parse (corpus → readNode → factory() → render → re-parse)
	const factoryRenderParseResult = await runFactory(config.grammar, templatesDir);
	console.log(formatFactoryRenderParseReport(factoryRenderParseResult));

	// from() correctness (structural comparison: from() vs factory())
	const fromResult = await runFrom(config.grammar);
	console.log(formatFromReport(fromResult));

	// Collect render-parse failures into a structured diagnostic list and
	// re-emit overrides.suggested.ts with the new section. Gives the
	// user a copy-pasteable record of input-vs-rendered for every
	// corpus case that didn't survive the render-parse path — useful for
	// spotting missing joinBy / transform patches.
	const parseFrag = (name: string): { entry: string; kind: string } => {
		const m = name.match(/^(.+)\s+\[([^\]]+)\]$/);
		return m ? { entry: m[1]!, kind: m[2]! } : { entry: name, kind: 'unknown' };
	};
	const diagnostics: RoundTripDiagnostic[] = [];
	for (const e of readRenderParseResult.errors ?? []) {
		const { entry, kind } = parseFrag(e.name);
		diagnostics.push({
			entry,
			kind,
			source: 'render',
			category: 'parse-error',
			message: String(e.message),
			rendered: e.rendered,
			input: e.input
		});
	}
	for (const m of readRenderParseResult.astMismatches ?? []) {
		const { entry, kind } = parseFrag(m.name);
		diagnostics.push({
			entry,
			kind,
			source: 'render',
			category: 'ast-mismatch',
			message: String(m.message),
			rendered: m.rendered,
			input: m.input
		});
	}
	// Factory render-parse diagnostics — validator runs once per kind
	// with entry/input/rendered captured from the corpus case. Surfaces
	// factory-API gaps (missing fields, wrong defaults) that the weaker
	// kind-found pass doesn't flag.
	for (const e of factoryRenderParseResult.errors ?? []) {
		diagnostics.push({
			entry: e.entry ?? '(unknown)',
			kind: e.kind,
			source: 'factory',
			category: 'parse-error',
			message: String(e.message),
			rendered: e.rendered,
			input: e.input
		});
	}
	for (const m of factoryRenderParseResult.astMismatches ?? []) {
		diagnostics.push({
			entry: m.entry ?? '(unknown)',
			kind: m.kind,
			source: 'factory',
			category: 'ast-mismatch',
			message: String(m.message),
			rendered: m.rendered,
			input: m.input
		});
	}
	if (diagnostics.length > 0) {
		const suggestedWithFailures = emitSuggested({
			grammar: config.grammar,
			nodeMap: result.nodeMap,
			roundTripFailures: diagnostics
		});
		writeFile(join(dirname(outDir), 'overrides.suggested.ts'), suggestedWithFailures);
		console.log(`  → overrides.suggested.ts updated with ${diagnostics.length} render-parse diagnostic(s)`);
	}

	const totalFail = readRenderParseResult.fail + factoryRenderParseResult.fail + fromResult.fail;
	if (totalFail > 0) {
		console.error(`\n${totalFail} render-parse / from() failure(s) — see above.`);
		process.exitCode = 1;
	}
}

if (process.exitCode) {
	console.error(`\nFailed. Generated files were written, but validation reported errors.`);
} else {
	console.log(`
Done! Generated:
  templates/*.jinja, grammar.ts, types.ts, factories.ts, utils.ts, from.ts, consts.ts, index.ts
  vitest.config.ts
`);
}
// Spec 013: dump derive-audit counts if SITTIR_AUDIT_DERIVE=1 was set.
// No-op otherwise. Used to validate simplify's canonicalization before
// shrinking `deriveFields` / `deriveChildren` to trivial walks.
(await import('./compiler/node-map.ts')).dumpDerivationAudit(`${config.grammar}-derive`);
