/**
 * Codegen library surface — programmatic entry points for running the codegen
 * pipeline without going through the CLI argument parser.
 *
 * `runCodegen`    — core path: generate IR → write all output files → renderable
 *                   check → manifest write → optional emit-diff → optional roundtrip.
 * `runFullRegen`  — `--all` chain: transpile → tree-sitter generate →
 *                   compile-parser → runCodegen → optional native rebuild.
 *
 * Error handling: instead of calling `process.exit()` (as the CLI does for
 * missing arguments), these functions throw `Error` with the same messages.
 * The CLI caller catches and converts to `process.exit(1)`.
 */

import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';

import { validateRenderableFromNodeMap, formatRenderableReport } from './validate/renderable.ts';

import { generate } from './compiler/generate.ts';
import { evaluate } from './compiler/evaluate.ts';
import { resolveGrammarJsPath, resolveOverridesPath } from './compiler/resolve-grammar.ts';
import {
	collectGrammarDiagnosticsForGrammar,
	GrammarDiagnosticError,
	formatGrammarDiagnostics,
	fromSlotGrouping,
	type GrammarDiagnostic
} from './compiler/grammar-diagnostics.ts';
import { drainUnnamedChoiceSlots } from './compiler/collect-slots.ts';
import { emitSuggested } from './emitters/suggested.ts';
import type { RoundTripDiagnostic } from './emitters/suggested.ts';
import { transpileOverrides } from './transpile/transpile-overrides.ts';
import { writeJinjaTemplates } from './emitters/templates.ts';
import { renderModuleSrcDir } from './emitters/render-module-paths.ts';
// extractParityFixtures and friends are lazy-imported inside runCodegen
// (in the shouldEmitRustRender block) because parity-fixtures.ts transitively
// imports validate/common.ts → @sittir/common (WASM-dependent). Keeping it
// dynamic allows test environments without WASM to import this module.
import { writeManifestForGrammar, type Grammar } from './scripts/generated-manifest.ts';
import { formatEmitDiff } from './scripts/emit-diff.ts';

/**
 * The library-facing option shape for both `runCodegen` and `runFullRegen`.
 * Generalizes the old `CodegenConfig` + `CliArgs` from cli.ts.
 */
export interface CodegenOptions {
	/** Grammar name (rust, typescript, python). */
	grammar: string;
	/** Output directory for generated TS files (e.g. packages/rust/src). */
	outputDir: string;
	/** Specific node kinds to generate (mutually exclusive with `all`). */
	nodes?: string[];
	/** Generate full native render-module artifacts (equivalent to --all). */
	all?: boolean;
	/** Output directory for test files (default: ../tests relative to outputDir). */
	testsDir?: string;
	/** Run validator probes after generation (equivalent to --roundtrip). */
	roundtrip?: boolean;
	/** Compile override grammar to .sittir/parser.wasm (standalone step). */
	compileParser?: boolean;
	/** Transpile overrides.ts to .sittir/grammar.js (standalone step). */
	transpile?: boolean;
	/** Run 'tree-sitter generate' in .sittir/ (standalone step). */
	tsGenerate?: boolean;
	/** Skip the auto transpile + tree-sitter generate chain that --all normally runs. */
	skipTsChain?: boolean;
	/**
	 * Whether to rebuild the N-API binding after native emit (default: true).
	 * Set to `false` to skip cargo rebuild (--no-build-native).
	 */
	buildNative?: boolean;
	/** Suppress the post-regen emit-diff report (--no-emit-diff). */
	noEmitDiff?: boolean;
	/** List of diagnostic messages to allow (passed from CLI allowlist). */
	allowDiagnostics?: string[];
}

// ---------------------------------------------------------------------------
// Internal helpers — co-located with cli.ts originally
// ---------------------------------------------------------------------------

/**
 * Write `content` to `path`, creating parent directories as needed.
 */
export function writeFile(path: string, content: string): void {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, content, 'utf8');
}

/**
 * Run 'tree-sitter generate' in a grammar's .sittir/ directory — produces
 * grammar.json + node-types.json from the transpiled grammar.js. Uses
 * execSync (shell-level) rather than spawnSync; tree-sitter is a native
 * binary so either would launch a separate OS process (no Node module
 * sharing concern) — exec is just simpler for a bare command.
 */
export function runTreeSitterGenerate(grammar: string): void {
	const sittirDir = resolve('packages', grammar, '.sittir');
	console.log(`Running 'tree-sitter generate' in ${sittirDir}...`);
	execSync('npx tree-sitter generate', {
		cwd: sittirDir,
		stdio: 'inherit'
	});
}

/**
 * Run the explicitly-requested standalone parser-generation steps
 * (`--transpile` / `--ts-generate` / `--compile-parser`) — the override/parser
 * maintenance workflow. Mirrors the old CLI's standalone branch: usable with
 * only `--grammar` (no `--output`/`--nodes`/`--all` required). Runs only the
 * steps whose flag is set, in transpile → tree-sitter generate → compile-parser
 * order.
 */
export async function runStandaloneSteps(opts: CodegenOptions): Promise<void> {
	const { grammar } = opts;
	const grammarDir = resolve('packages', grammar);
	if (opts.transpile) {
		console.log(`Transpiling ${grammar} overrides...`);
		const tr = await transpileOverrides({ grammar });
		console.log(`  → ${tr.outputPath} (${tr.outputBytes} bytes)`);
	}
	if (opts.tsGenerate) {
		runTreeSitterGenerate(grammar);
	}
	if (opts.compileParser) {
		console.log(`Compiling ${grammar} parser to WASM...`);
		const { compileParser } = await import('./transpile/compile-parser.ts');
		const wasmPath = await compileParser(grammarDir);
		console.log(`  → ${wasmPath}`);
	}
}

const RUST_RENDER_GRAMMARS = ['rust', 'typescript', 'python'] as const;

// ---------------------------------------------------------------------------
// Grammar-diagnostics preflight gate
// ---------------------------------------------------------------------------

/**
 * Runs the grammar-diagnostics preflight check for the given grammar.
 *
 * - If `injectedDiagnostics` is provided, those are used directly (test seam).
 * - Otherwise, the grammar is loaded and evaluated to derive diagnostics.
 * - Blocked diagnostics (canProceed === false) that are NOT in the allow-list
 *   cause an error to be thrown in non-interactive mode, or a prompt in
 *   interactive mode.
 * - `confirm` overrides the default stdin-based TTY prompt (test seam).
 */
export async function runGrammarDiagnosticsPreflight(input: {
	grammar: string;
	allowDiagnostics: ReadonlySet<string>;
	isTTY: boolean;
	injectedDiagnostics?: readonly GrammarDiagnostic[];
	confirm?: (blocked: readonly GrammarDiagnostic[]) => Promise<boolean>;
}): Promise<void> {
	let diagnostics: readonly GrammarDiagnostic[];
	if (input.injectedDiagnostics !== undefined) {
		diagnostics = input.injectedDiagnostics;
	} else {
		const overridesPath = resolveOverridesPath(input.grammar);
		const grammarJsPath = resolveGrammarJsPath(input.grammar);
		const entryPath = existsSync(overridesPath) ? overridesPath : grammarJsPath;
		const rawGrammar = await evaluate(entryPath);
		diagnostics = collectGrammarDiagnosticsForGrammar({ rawGrammar }).diagnostics;
	}

	const blockedSet = new Set(
		diagnostics.filter((d) => !input.allowDiagnostics.has(d.code) && d.canProceed === false)
	);
	const blocked = [...blockedSet];

	// Non-blocking (and allow-listed) diagnostics are always surfaced as
	// visible, non-fatal output so every collected grammar condition prints
	// during `sittir gen`/regen, even when none are blocking.
	const nonBlocking = diagnostics.filter((d) => !blockedSet.has(d));
	if (nonBlocking.length > 0) {
		process.stderr.write(formatGrammarDiagnostics(nonBlocking) + '\n');
	}

	if (blocked.length === 0) return;

	process.stderr.write(formatGrammarDiagnostics(blocked) + '\n');

	if (!input.isTTY) {
		throw new GrammarDiagnosticError(blocked);
	}
	const proceed = await (input.confirm ?? confirmProceed)(blocked);
	if (!proceed) {
		throw new GrammarDiagnosticError(blocked);
	}
}

async function confirmProceed(diagnostics: readonly GrammarDiagnostic[]): Promise<boolean> {
	process.stderr.write(
		`Diagnostics present (${diagnostics.map((d) => d.code).join(', ')}). Proceed? [y/N] `
	);
	const chunks: Buffer[] = [];
	for await (const chunk of process.stdin) {
		chunks.push(chunk as Buffer);
		break;
	}
	const answer = Buffer.concat(chunks).toString('utf8').trim().toLowerCase();
	return answer === 'y' || answer === 'yes';
}

/**
 * Testable preflight gate entry. Parses `--grammar` and `--allow-diagnostic`
 * from argv and runs the grammar-diagnostics preflight, returning 0 when no
 * blocking diagnostic survives the allow-list (throws `GrammarDiagnosticError`
 * otherwise). Test seams: `env.diagnostics` injects diagnostics (bypasses
 * grammar loading), `env.confirm` overrides the TTY prompt, `env.isTTY`
 * overrides the gate's interactivity decision.
 */
export async function runCodegenCli(
	argv: string[],
	env: {
		isTTY?: boolean;
		diagnostics?: readonly GrammarDiagnostic[];
		confirm?: (blocked: readonly GrammarDiagnostic[]) => Promise<boolean>;
	} = {}
): Promise<number> {
	let grammar = '';
	const allowDiagnostics = new Set<string>();
	for (let i = 0; i < argv.length; i++) {
		if ((argv[i] === '--grammar' || argv[i] === '-g') && argv[i + 1]) grammar = argv[++i]!;
		else if (argv[i] === '--allow-diagnostic' && argv[i + 1]) allowDiagnostics.add(argv[++i]!);
	}
	await runGrammarDiagnosticsPreflight({
		grammar,
		allowDiagnostics,
		isTTY: env.isTTY ?? Boolean((process.stdin as NodeJS.ReadStream).isTTY),
		injectedDiagnostics: env.diagnostics,
		confirm: env.confirm
	});
	return 0;
}

// ---------------------------------------------------------------------------
// Core codegen function
// ---------------------------------------------------------------------------

/**
 * Core codegen path: generate IR from grammar, write all output files,
 * run renderable check, write manifest, optionally emit-diff and run
 * roundtrip validator probes.
 *
 * Preconditions (checked by caller or CLI):
 *  - `opts.outputDir` must be set (throws otherwise)
 *  - `opts.all` or `opts.nodes` must be set (throws otherwise)
 *
 * Throws an `Error` (rather than calling `process.exit`) for missing required
 * options, so programmatic callers can handle them. The CLI layer converts
 * these throws to `console.error` + `process.exit(1)`.
 */
export async function runCodegen(opts: CodegenOptions): Promise<void> {
	// Codegen IS the writer of the per-grammar manifest. Internal validator runs
	// invoked from inside this function (e.g. extractParityFixtures uses
	// validateReadRenderParse to extract parity fixtures BEFORE the manifest is
	// rewritten) would otherwise verify the manifest mid-write — checking the
	// codegen process against its own incomplete output, which is meaningless.
	// Set the env so `loadLanguageForGrammar` skips verification for these
	// internal calls. External callers (validator CLI, probe-validate, etc.) do
	// not run this function and therefore do not inherit this env.
	process.env.SITTIR_INTERNAL_CODEGEN_RUN = '1';

	const { grammar, outputDir, all, nodes, roundtrip, testsDir, noEmitDiff, buildNative } = opts;

	if (!outputDir) {
		throw new Error('Missing required argument: --output. Use --help for usage.');
	}
	if (!all && (!nodes || nodes.length === 0)) {
		throw new Error('Must provide --nodes or --all. Use --help for usage.');
	}

	// Grammar-diagnostics preflight gate. Blocking diagnostics (canProceed ===
	// false) not covered by `allowDiagnostics` throw GrammarDiagnosticError in
	// non-interactive mode, or prompt on a TTY. Known-debt diagnostics are
	// currently non-blocking (canProceed: true), so this surfaces them without
	// halting; --allow-diagnostic remains available for any future blocking code.
	await runGrammarDiagnosticsPreflight({
		grammar,
		allowDiagnostics: new Set(opts.allowDiagnostics ?? []),
		isTTY: Boolean((process.stdin as NodeJS.ReadStream).isTTY)
	});

	console.log(`Generating ${grammar} IR...`);
	const result = await generate({
		grammar,
		nodes: all ? undefined : nodes,
		outputDir,
		emitRenderModule: all
	});

	// Surface slot-grouping diagnostics from the optimize phase. These are
	// non-blocking propose-promotion suggestions; printing them here (after
	// generate()) ensures they appear during `sittir gen --all` even when
	// the preflight and generate() pipelines are separate.
	if (result.slotGroupingDiagnostics.length > 0) {
		const mapped = result.slotGroupingDiagnostics.map((d) => fromSlotGrouping(grammar, d));
		process.stderr.write(formatGrammarDiagnostics(mapped) + '\n');
	}

	const outDir = outputDir;

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
	const shouldEmitRustRender = all && (RUST_RENDER_GRAMMARS as readonly string[]).includes(grammar);

	if (shouldEmitRustRender) {
		const grammarTyped = grammar as (typeof RUST_RENDER_GRAMMARS)[number];
		const renderModule = result.renderModule;
		if (!renderModule) {
			throw new Error(`generate() did not return renderModule output for ${grammar}`);
		}
		const emit = renderModule.emit;
		writeFile(emit.hashRs.path, emit.hashRs.contents);
		writeFile(emit.hashTs.path, emit.hashTs.contents);
		writeFile(emit.templatesRs.path, emit.templatesRs.contents);
		writeFile(emit.transportRs.path, emit.transportRs.contents);
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
			const kindIdsPath = `${renderModuleSrcDir(grammarTyped)}/kind_ids.rs`;
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
		//
		// Lazy import: parity-fixtures transitively imports validate/common.ts
		// → @sittir/common (WASM-dependent). Dynamic import keeps the static
		// module graph clean for test environments.
		const { extractParityFixtures, serializeFixtures, fixturesOutputPath } =
			await import('./emitters/parity-fixtures.ts');
		const templatesPath = join(dirname(outDir), 'templates');
		const extracted = await extractParityFixtures(grammarTyped, templatesPath);
		const fxPath = fixturesOutputPath(grammarTyped);
		writeFile(fxPath, serializeFixtures(extracted.fixtures));
		console.log(
			`    ${fxPath} (${extracted.renderCount} render + ${extracted.roundTripCount} roundtrip, ${extracted.coveredKinds.size} kinds)`
		);
		// Surface FR-011 coverage gap warnings as non-fatal stderr messages.
		for (const w of extracted.warnings) {
			process.stderr.write(`[warning] ${w}\n`);
		}

		// Rebuild the corresponding N-API binding so the native render path
		// picks up the new templates. Askama compiles templates at the
		// crate's build time via proc macro; without a rebuild, native
		// baseline collection silently falls back to TS render with the
		// previous templates baked in. Opt out with --no-build-native.
		if (buildNative !== false) {
			const nativeCrate = `rust/crates/sittir-${grammar}`;
			// Dev/gate loop can build the napi crate in DEBUG via SITTIR_NATIVE_DEBUG=1.
			// The validate gate only needs a CORRECT .node (AST-match), not an optimized
			// one — and the debug profile enables incremental compilation (the release
			// profile has `incremental = false`), so a codegen edit → regen recompiles
			// only the changed crate + relinks instead of a full from-scratch optimized
			// build. Keep the default `build` (`--release`) for CI / production artifacts.
			const nativeBuildScript = process.env.SITTIR_NATIVE_DEBUG === '1' ? 'build:debug' : 'build';
			console.log(
				`  → rebuilding grammar-owned N-API binding for ${grammar}` +
					`${nativeBuildScript === 'build:debug' ? ' (debug + incremental)' : ''}…`
			);
			try {
				execSync(`pnpm -C ${nativeCrate} run ${nativeBuildScript}`, {
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

	// Write node model (single on-disk metadata source — PR-K folded the
	// former factory-map.json5 sections in here).
	writeFile(join(outDir, 'node-model.json5'), result.nodeModel);

	// Write suggested overrides log (T042f) next to overrides.ts at the
	// package root. This is a documentation file — not runnable.
	writeFile(join(dirname(outDir), 'overrides.suggested.ts'), result.suggested);

	// Write tests
	const testsDirResolved = testsDir ?? join(dirname(outDir), 'tests');
	writeFile(join(testsDirResolved, 'nodes.test.ts'), result.tests);

	// Write type-level tests
	writeFile(join(outDir, 'type-test.ts'), result.typeTests);

	// Write vitest config
	writeFile(join(dirname(outDir), 'vitest.config.ts'), result.config);

	// --- Renderability check: every named kind in node-types.json must be
	// reachable by @sittir/core's render() function (supertype, leaf, or rule).
	// Uses the NodeMap directly for a structural truth check.
	const config = { grammar, nodes: all ? undefined : nodes, outputDir };
	const renderable = validateRenderableFromNodeMap(config.grammar, result.nodeMap);
	console.log('');
	console.log(formatRenderableReport(renderable));

	// Collected diagnostic: kinds whose CHOICE slot has no grammar field name.
	// A naked choice falls back to an unresolvable `content` slot; the author must
	// give it an explicit `field('<name>', ...)` in `packages/<lang>/overrides.ts`.
	const unnamedChoiceKinds = drainUnnamedChoiceSlots();
	if (unnamedChoiceKinds.length > 0) {
		console.warn(
			`\n⚠ ${unnamedChoiceKinds.length} unnamed choice slot(s) in ${grammar} — give each choice an explicit field name in packages/${grammar}/overrides.ts:\n  ` +
				unnamedChoiceKinds.join('\n  ')
		);
	}
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
	// downstream validator (this function's roundtrip probes OR the external
	// validator CLI). The only post-validation write is overrides.suggested.ts,
	// which is intentionally excluded from the manifest (see pathsFor()).
	writeManifestForGrammar(grammar as Grammar);
	console.log(`  → packages/${grammar}/.sittir/generated.manifest.json updated`);

	// Post-regen emit diff: show what THIS run changed in the generated output,
	// grouped by emitter, working tree vs HEAD. Convenience only — skipped under
	// --no-emit-diff and silently when git is unavailable. Printed here (right
	// after the manifest write, before validation) so it reflects the same on-disk
	// state the manifest just captured; overrides.suggested.ts is excluded from
	// the tracked roots, so the later validation write does not muddy the report.
	if (all && !noEmitDiff) {
		const emitDiff = formatEmitDiff(grammar as Grammar);
		if (emitDiff) console.log(`\n${emitDiff}`);
	}

	// --- Validation probes (optional, requires web-tree-sitter) ---
	if (roundtrip) {
		console.log('\nRunning validator probes...');

		// Lazy-import the validators — they chain through validate/common.ts
		// which imports web-tree-sitter and @sittir/common. Keeping these
		// dynamic avoids pulling heavy native deps into the module-load path
		// (which allows test environments without WASM to import run-codegen.ts).
		const { validateReadProjection, formatReadProjectionReport } =
			await import('./validate/read-projection.ts');
		const { validateReadRenderParse, formatReadRenderParseReport } =
			await import('./validate/read-render-parse.ts');
		const { validateFactoryRenderParse, formatFactoryRenderParseReport } =
			await import('./validate/factory-render-parse.ts');
		const { validateFrom, formatFromReport } =
			await import('./validate/from.ts');

		// read projection (structural) — upstream of render/factory.
		// A regression here means readNode is losing content between
		// tree-sitter's parse tree and the NodeData shape, so every
		// downstream validator will mis-report.
		const readProjectionResult = await validateReadProjection(grammar);
		console.log(formatReadProjectionReport(readProjectionResult));

		// Validators take the per-rule `.jinja` templates directory
		// path (feature 011). createRenderer auto-detects directory vs
		// legacy YAML file.
		const templatesDir = join(dirname(outDir), 'templates');
		const readRenderParseResult = await validateReadRenderParse(grammar, templatesDir, { backend: 'native' });
		console.log(formatReadRenderParseReport(readRenderParseResult));

		// Factory render-parse (corpus → readNode → factory() → render → re-parse)
		const factoryRenderParseResult = await validateFactoryRenderParse(grammar, templatesDir, 'native');
		console.log(formatFactoryRenderParseReport(factoryRenderParseResult));

		// from() correctness (structural comparison: from() vs factory())
		const fromResult = await validateFrom(grammar, 'native');
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
				grammar,
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
	(await import('./compiler/node-map.ts')).dumpDerivationAudit(`${grammar}-derive`);
}

// ---------------------------------------------------------------------------
// Full regen (--all chain: transpile → ts-generate → compile-parser → runCodegen
// → native rebuild)
// ---------------------------------------------------------------------------

/**
 * The `--all` auto-chain: transpile overrides → tree-sitter generate →
 * compile-parser → runCodegen (which writes all artifacts) → optional native
 * rebuild.
 *
 * Mirror the exact ordering from the old `mainCli` --all path.
 *
 * The `opts.skipTsChain` flag (or pre-set `opts.transpile`/`opts.tsGenerate`
 * flags) suppresses the chain prefix, deferring to whatever state is already
 * on disk — same semantics as the old `--skip-ts-chain` / standalone flags.
 */
export async function runFullRegen(opts: CodegenOptions): Promise<void> {
	// Set BEFORE any generate/validate work (mirrors the top-level set in cli.ts).
	process.env.SITTIR_INTERNAL_CODEGEN_RUN = '1';

	const { grammar, skipTsChain, transpile, tsGenerate } = opts;

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
	if (!skipTsChain && !transpile && !tsGenerate) {
		console.log(
			`Full regenerate for ${grammar}: transpile + tree-sitter generate + compile-parser + sittir codegen`
		);
		const grammarDir = resolve('packages', grammar);
		console.log(`Transpiling ${grammar} overrides...`);
		const tr = await transpileOverrides({ grammar });
		console.log(`  → ${tr.outputPath} (${tr.outputBytes} bytes)`);
		runTreeSitterGenerate(grammar);
		console.log(`Compiling ${grammar} parser to WASM...`);
		const { compileParser } = await import('./transpile/compile-parser.ts');
		const wasmPath = await compileParser(grammarDir);
		console.log(`  → ${wasmPath}`);
	}

	// Run the core codegen (generate → write all files → renderable → manifest
	// → emit-diff → optional roundtrip → native rebuild (if applicable)).
	// The native rebuild lives inside runCodegen (within the shouldEmitRustRender
	// block) so it runs BEFORE manifest write — matching the original ordering
	// from mainCli where cargo build preceded writeManifestForGrammar.
	await runCodegen(opts);
}
