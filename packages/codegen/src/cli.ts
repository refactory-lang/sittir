#!/usr/bin/env node
/**
 * CLI entry point for sittir codegen.
 *
 * Usage:
 *   sittir --grammar rust --all --output src/
 *   sittir --grammar rust --nodes struct_item,function_item --output src/
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { validateRoundTrip, formatRoundTripReport } from './validate/roundtrip.ts';
import { validateFactoryRoundTrip, formatFactoryRoundTripReport } from './validate/factory-roundtrip.ts';
import { validateFrom, formatFromReport } from './validate/from.ts';
import { validateRenderableFromNodeMap, formatRenderableReport } from './validate/renderable.ts';
import { validateReadNodeRoundTrip, formatReadNodeRoundTripReport } from './validate/readnode-roundtrip.ts';
import { join, dirname, resolve } from 'node:path';
import { generate } from './compiler/generate.ts';
import { emitSuggested } from './emitters/suggested.ts';
import type { RoundTripDiagnostic } from './emitters/suggested.ts';
import { compileParser } from './transpile/compile-parser.ts';
import { transpileOverrides } from './transpile/transpile-overrides.ts';
import { writeJinjaTemplates } from './emitters/templates.ts';
import { emitRenderCrate, type Grammar as RustRenderGrammar } from './emitters/rust-render.ts';
import {
	extractParityFixtures,
	serializeFixtures,
	fixturesOutputPath,
} from './emitters/parity-fixtures.ts';
import { readdirSync, readFileSync, existsSync, rmSync } from 'node:fs';
import type { TemplateFile } from './emitters/template-hash.ts';

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
	rustRender?: boolean;
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
			case '--rust-render':
				args.rustRender = true;
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
  --all, -a        Generate for all branch node kinds
  --output, -o     Output directory for generated files
  --tests-dir      Output directory for test files (default: ../tests)
  --transpile      Transpile overrides.ts to .sittir/grammar.js
  --compile-parser Compile override grammar to .sittir/parser.wasm
  --ts-generate    Run 'tree-sitter generate' in .sittir/ to produce
                   grammar.json + node-types.json
  --skip-ts-chain  Skip the auto transpile + tree-sitter generate chain
                   that --all normally runs before sittir codegen
  --rust-render    Also emit the rust-render crate's codegen artifacts
                   (spec 012 T016+): packages/<grammar>/rust-render/src/hash.rs
                   and packages/<grammar>/src/hash.ts. The JS backend shim
                   uses the TS-side hash to detect drift vs. the native
                   binary (FR-020). After regenerating templates, automatically
                   rebuilds the corresponding napi crate so the native render
                   path picks up template changes (otherwise native baseline
                   collection silently falls back to TS render with stale
                   templates). Suppress with --no-build-native.
  --no-build-native  Skip the post-regen napi crate rebuild (use when you
                   only need the TS-side artifacts; faster regen).
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
		stdio: 'inherit',
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
	console.log(`Full regenerate for ${cliArgs.grammar}: transpile + tree-sitter generate + compile-parser + sittir codegen`);
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
	outputDir: cliArgs.outputDir!,
};

console.log(`Generating ${config.grammar} IR...`);
const result = await generate({ grammar: config.grammar, nodes: config.nodes, outputDir: config.outputDir });

const outDir = cliArgs.outputDir;

// Write source files
writeFile(join(outDir, 'grammar.ts'), result.grammar);
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

// --- rust-render emission (spec 012 T017) ---
// When `--rust-render` is set, also emit hash.rs / hash.ts so the
// native backend and the TS backend can detect template-bundle drift
// at runtime (FR-020). The hash is computed over the same `.jinja`
// bodies that were just written above — this keeps the TS-side and
// Rust-side derivations in lockstep.
if (cliArgs.rustRender) {
	const grammar = config.grammar;
	if (grammar !== 'rust' && grammar !== 'typescript' && grammar !== 'python') {
		console.error(
			`--rust-render: unsupported grammar '${grammar}'. Supported: rust, typescript, python.`,
		);
		process.exit(1);
	}
	const templateFiles: TemplateFile[] = [];
	for (const [kind, body] of result.jinjaTemplates.bodies) {
		templateFiles.push({ filename: `${kind}.jinja`, content: body });
	}
	const emit = emitRenderCrate(grammar as RustRenderGrammar, templateFiles, result.nodeMap);
	writeFile(emit.hashRs.path, emit.hashRs.contents);
	writeFile(emit.hashTs.path, emit.hashTs.contents);
	writeFile(emit.templatesRs.path, emit.templatesRs.contents);
	writeFile(emit.libRs.path, emit.libRs.contents);
	writeFile(emit.cargoToml.path, emit.cargoToml.contents);
	// Copy the per-kind `.jinja` files into the render-crate's templates/
	// directory so askama's build-time `#[template(path = ...)]` can
	// resolve them (T030). Stale files (no longer in jinjaTemplates) are
	// removed so regenerations don't accumulate dead templates.
	//
	// Template-body transform: rust keywords that can't be raw-
	// identifier'd (`crate`, `self`, `super`, `Self`) have their struct
	// field names suffixed with `_` at emit time (see
	// `rust-render.ts:RUST_NON_RAWABLE_KEYWORDS`). Askama resolves
	// template variables by the field's raw name, so the template
	// copy must rename `{{ crate }}` → `{{ crate_ }}` to match.
	// Applies only to the rust-render copy — the source .jinja under
	// packages/{lang}/templates/ stays unchanged (TS Nunjucks side
	// doesn't have the keyword collision).
	const RUST_UNRAWABLE_KW = ['crate', 'self', 'super', 'Self'] as const;
	const renameForRustRender = (body: string): string => {
		let out = body;
		for (const kw of RUST_UNRAWABLE_KW) {
			// Match `{{ kw }}` / `{{ kw | filter }}` / `{% if kw ... %}` /
			// `{% for x in kw %}` — identifier position only.
			const re = new RegExp(`(\\{\\{-?\\s*|\\{%-?\\s*(?:if|elif)\\s+|\\{%-?\\s*for\\s+[a-zA-Z_][a-zA-Z0-9_]*\\s+in\\s+)${kw}\\b`, 'g');
			out = out.replace(re, `$1${kw}_`);
		}
		return out;
	};
	// Each user field is emitted as BOTH scalar (`foo: String`, the
	// pre-joined form) and list (`foo_list: Vec<String>`, per-element).
	// Rewrite list-consuming references in the rust-render template
	// copy so they target `foo_list` — list-consumers are:
	//   - `{{ foo | join(...) }}` / `| joinWithTrailing(...)` / etc.
	//   - `{% for x in foo %}`
	// All other references (`{{ foo }}`, `{% if foo | isPresent %}`)
	// stay on the scalar — empty lists render as empty joined strings
	// which read as "not present" via `isPresent`, so no separate list
	// filter is needed.
	const LIST_FILTERS = ['join', 'joinWithTrailing', 'joinWithLeading', 'joinWithFlanks'];
	const rewriteListUsage = (body: string, listFields: Set<string>): string => {
		if (listFields.size === 0) return body;
		const alt = Array.from(listFields).map(f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
		// `{{ foo | join(...) }}` → `{{ foo_list | join(...) }}`
		const filterRe = new RegExp(`(\\{\\{-?\\s*)(?:${alt})(\\s*\\|\\s*(?:${LIST_FILTERS.join('|')})\\b)`, 'g');
		let out = body.replace(filterRe, (_m, p1, p2) => {
			const fname = _m.slice(p1.length).match(new RegExp(`^(${alt})`))![1]!;
			return `${p1}${fname}_list${p2}`;
		});
		// `{% for x in foo %}` → `{% for x in foo_list %}`
		const forRe = new RegExp(`(\\{%-?\\s*for\\s+[a-zA-Z_][a-zA-Z0-9_]*\\s+in\\s+)(${alt})\\b`, 'g');
		out = out.replace(forRe, `$1$2_list`);
		return out;
	};
	const srcTemplatesDir = join(dirname(outDir), 'templates');
	const dstTemplatesDir = `packages/${grammar}/rust-render/templates`;
	mkdirSync(dstTemplatesDir, { recursive: true });
	const emittedNames = new Set<string>();
	for (const [kind] of result.jinjaTemplates.bodies) {
		const fname = `${kind}.jinja`;
		const srcPath = join(srcTemplatesDir, fname);
		const dstPath = join(dstTemplatesDir, fname);
		const listFields = emit.listShapedFieldsByKind.get(kind) ?? new Set<string>();
		let transformed = renameForRustRender(readFileSync(srcPath, 'utf8'));
		transformed = rewriteListUsage(transformed, listFields);
		writeFile(dstPath, transformed);
		emittedNames.add(fname);
	}
	for (const existing of readdirSync(dstTemplatesDir)) {
		if (!existing.endsWith('.jinja')) continue;
		if (!emittedNames.has(existing)) rmSync(join(dstTemplatesDir, existing), { force: true });
	}
	console.log(`  → rust-render crate regenerated for ${grammar}:`);
	console.log(`    ${emit.hashRs.path}`);
	console.log(`    ${emit.hashTs.path}`);
	console.log(`    ${emit.templatesRs.path}`);
	console.log(`    ${emit.libRs.path}`);
	console.log(`    ${emit.cargoToml.path}`);
	console.log(`    ${dstTemplatesDir}/ (${emittedNames.size} .jinja files)`);

	// --- parity-fixture extraction (spec 012 T045 / T046) ---
	// Run the round-trip validator in fixture-capture mode. Every
	// successfully round-tripped kind emits a paired (render,
	// roundtrip) fixture; the result is written to
	// packages/{grammar}/rust-render/test-fixtures.json where the
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
		`    ${fxPath} (${extracted.renderCount} render + ${extracted.roundTripCount} roundtrip, ${extracted.coveredKinds.size} kinds)`,
	);

	// Rebuild the corresponding napi crate so the native render path
	// picks up the new templates. Askama compiles templates at the
	// crate's build time via proc macro; without a rebuild, native
	// baseline collection silently falls back to TS render with the
	// previous templates baked in. Opt out with --no-build-native.
	if (cliArgs.buildNative !== false) {
		const napiCrate = `rust/crates/sittir-${grammar}-napi`;
		console.log(`  → rebuilding napi crate (sittir-${grammar}-napi)…`);
		try {
			execSync(`pnpm -C ${napiCrate} run build`, {
				stdio: 'inherit',
				cwd: process.cwd(),
			});
		} catch (e) {
			console.error(
				`    napi rebuild failed for ${grammar}. Native baseline collection will use stale templates. ` +
				`Re-run with --no-build-native to suppress this attempt, or fix the cargo build error.`,
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
		`\n${renderable.missing.length} un-renderable kind(s) — render() will throw if called on these instances.`,
	);
}

// --- Round-trip validation (optional, requires web-tree-sitter) ---
if (cliArgs.roundtrip) {
	console.log('\nRunning round-trip validation...');

	// readNode round-trip (structural) — upstream of render/factory.
	// A regression here means readNode is losing content between
	// tree-sitter's parse tree and the NodeData shape, so every
	// downstream validator will mis-report.
	const rnResult = await validateReadNodeRoundTrip(config.grammar);
	console.log(formatReadNodeRoundTripReport(rnResult));

	// Validators take the per-rule `.jinja` templates directory
	// path (feature 011). createRenderer auto-detects directory vs
	// legacy YAML file.
	const templatesDir = join(dirname(outDir), 'templates');
	const rtResult = await validateRoundTrip(config.grammar, templatesDir);
	console.log(formatRoundTripReport(rtResult));

	// Factory round-trip (corpus → readNode → factory() → render → re-parse)
	const frtResult = await validateFactoryRoundTrip(config.grammar, templatesDir);
	console.log(formatFactoryRoundTripReport(frtResult));

	// from() correctness (structural comparison: from() vs factory())
	const fromResult = await validateFrom(config.grammar);
	console.log(formatFromReport(fromResult));

	// Collect round-trip failures into a structured diagnostic list and
	// re-emit overrides.suggested.ts with the new section. Gives the
	// user a copy-pasteable record of input-vs-rendered for every
	// corpus case that didn't survive the round-trip — useful for
	// spotting missing joinBy / transform patches.
	const parseFrag = (name: string): { entry: string; kind: string } => {
		const m = name.match(/^(.+)\s+\[([^\]]+)\]$/);
		return m ? { entry: m[1]!, kind: m[2]! } : { entry: name, kind: 'unknown' };
	};
	const diagnostics: RoundTripDiagnostic[] = [];
	for (const e of rtResult.errors ?? []) {
		const { entry, kind } = parseFrag(e.name);
		diagnostics.push({
			entry, kind,
			source: 'render',
			category: 'parse-error',
			message: String(e.message),
			rendered: e.rendered,
			input: e.input,
		});
	}
	for (const m of rtResult.astMismatches ?? []) {
		const { entry, kind } = parseFrag(m.name);
		diagnostics.push({
			entry, kind,
			source: 'render',
			category: 'ast-mismatch',
			message: String(m.message),
			rendered: m.rendered,
			input: m.input,
		});
	}
	// Factory round-trip diagnostics — validator runs once per kind
	// with entry/input/rendered captured from the corpus case. Surfaces
	// factory-API gaps (missing fields, wrong defaults) that the weaker
	// kind-found pass doesn't flag.
	for (const e of frtResult.errors ?? []) {
		diagnostics.push({
			entry: e.entry ?? '(unknown)',
			kind: e.kind,
			source: 'factory',
			category: 'parse-error',
			message: String(e.message),
			rendered: e.rendered,
			input: e.input,
		});
	}
	for (const m of frtResult.astMismatches ?? []) {
		diagnostics.push({
			entry: m.entry ?? '(unknown)',
			kind: m.kind,
			source: 'factory',
			category: 'ast-mismatch',
			message: String(m.message),
			rendered: m.rendered,
			input: m.input,
		});
	}
	if (diagnostics.length > 0) {
		const suggestedWithFailures = emitSuggested({
			grammar: config.grammar,
			nodeMap: result.nodeMap,
			roundTripFailures: diagnostics,
		});
		writeFile(join(dirname(outDir), 'overrides.suggested.ts'), suggestedWithFailures);
		console.log(`  → overrides.suggested.ts updated with ${diagnostics.length} round-trip diagnostic(s)`);
	}

	const totalFail = rtResult.fail + frtResult.fail + fromResult.fail;
	if (totalFail > 0) {
		console.error(`\n${totalFail} round-trip / from() failure(s) — see above.`);
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
