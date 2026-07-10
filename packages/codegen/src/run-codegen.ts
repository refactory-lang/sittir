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

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { format as oxfmtFormat, type FormatConfig } from 'oxfmt';
import oxfmtProjectConfig from '../../../oxfmt.config.ts';

/**
 * oxfmt's programmatic `format()` API does NOT auto-discover `.editorconfig`
 * the way its CLI does — only the explicit config object below applies.
 * `.editorconfig` sets `indent_style = tab` for `.ts` files repo-wide (root
 * = true, single unambiguous rule), so that has to be merged in by hand to
 * match what `pnpm run format`/`oxfmt --check .` actually expect on disk.
 */
const oxfmtEffectiveConfig: FormatConfig = { ...(oxfmtProjectConfig as FormatConfig), useTabs: true };

import { validateRenderableFromNodeMap, formatRenderableReport } from './validate/renderable.ts';

import { generate } from './compiler/generate.ts';
import { evaluate } from './compiler/evaluate.ts';
import { resolveGrammarJsPath, resolveOverridesPath } from './compiler/resolve-grammar.ts';
import {
	collectGrammarDiagnosticsForGrammar,
	GrammarDiagnosticError,
	formatGrammarDiagnostics,
	writeGrammarDiagnosticsJson,
	fromSlotGrouping,
	type GrammarDiagnostic
} from './compiler/diagnostics/grammar-diagnostics.ts';
import { drainUnnamedChoiceSlots } from './compiler/collect-slots.ts';
import { transpileOverrides } from './transpile/transpile-overrides.ts';
import { writeJinjaTemplates } from './emitters/templates.ts';
import { renderModuleSrcDir } from './emitters/render-module-paths.ts';
import { writeManifestForGrammar, type Grammar } from './scripts/generated-manifest.ts';
import type { NodeMap } from './compiler/types.ts';
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
	/**
	 * Whether to run `cargo check --workspace` after the native rebuild
	 * (default: true). Set to `false` (--no-workspace-check) in multi-grammar
	 * drivers for all but the LAST grammar — the final check covers the whole
	 * workspace, making the earlier per-grammar checks redundant.
	 */
	workspaceCheck?: boolean;
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
 *
 * `.ts` output is run through oxfmt (the project's own formatter, config
 * merged from `oxfmt.config.ts` + `.editorconfig`'s tab-indent rule for
 * `.ts` files — the programmatic `format()` API does not auto-discover
 * either file) before the content-aware comparison below, so generated
 * `.ts` files land on disk already matching `pnpm run format`'s output —
 * no separate formatting pass needed, and no risk of a formatter
 * reformatting generated code out from under the emitters (oxfmt must
 * never run over `packages/*\/src/*` directly; only codegen writes there).
 *
 * `node-model.json5` is deliberately NOT run through oxfmt here even
 * though it matches `pnpm run format`'s scope: `packages/tools/src/
 * validate/common.ts`'s `loadNodeModel` parses it with strict `JSON.parse`,
 * and oxfmt reformats JSON5 idiomatically (unquoted keys, single-quoted
 * strings) — valid JSON5, but not valid JSON, breaking that parser. Fix
 * belongs in `loadNodeModel` (use a real JSON5 parser) before this file
 * can be formatted too.
 *
 * Content-aware: skips the write when the file already holds identical
 * bytes. Generated outputs are rewritten wholesale on every regen even
 * when nothing changed, and the mtime bump alone forced cargo (release
 * profile, `incremental = false`) to recompile entire napi crates and
 * made every mtime-based freshness signal noisy. Skipping no-op writes
 * keeps mtimes meaningful: unchanged crates fingerprint-match in cargo,
 * so rebuilds and the workspace check finish in seconds on a no-change
 * regen. Formatting BEFORE this comparison (not after) is what makes the
 * skip meaningful — comparing against on-disk (already-formatted) content
 * with pre-format content would never match, causing a spurious rewrite
 * on every single regen.
 */
export async function writeFile(path: string, content: string): Promise<void> {
	let finalContent = content;
	if (path.endsWith('.ts')) {
		const result = await oxfmtFormat(path, content, oxfmtEffectiveConfig);
		if (result.errors.length === 0) {
			finalContent = result.code;
		} else {
			console.warn(
				`  ⚠ oxfmt failed to format ${path} (${result.errors.length} error(s)) — writing unformatted content.`
			);
		}
	}
	if (existsSync(path)) {
		try {
			if (readFileSync(path, 'utf8') === finalContent) return;
		} catch {
			// Unreadable existing file — fall through and overwrite.
		}
	}
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, finalContent, 'utf8');
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

export const RUST_RENDER_GRAMMARS = ['rust', 'typescript', 'python'] as const;

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

	const blockedSet = new Set(diagnostics.filter((d) => !input.allowDiagnostics.has(d.code) && d.canProceed === false));
	const blocked = [...blockedSet];

	// Non-blocking (and allow-listed) diagnostics are always surfaced as
	// visible, non-fatal output so every collected grammar condition prints
	// during `sittir gen`/regen, even when none are blocking.
	const nonBlocking = diagnostics.filter((d) => !blockedSet.has(d));
	if (nonBlocking.length > 0) {
		process.stderr.write(formatGrammarDiagnostics(nonBlocking) + '\n');
	}
	// Persist the COMPLETE diagnostic set (blocking + non-blocking) — writing
	// only `nonBlocking` silently dropped blocking diagnostics from the
	// persisted artifact even when the run went on to proceed (allow-listed,
	// or confirmed interactively).
	//
	// Only write when running against a REAL loaded grammar. `injectedDiagnostics`
	// is a test-only seam (`cli-grammar-diagnostics.test.ts` injects diagnostics
	// for an arbitrary/fake grammar to exercise the gate's allow-list/confirm
	// logic in isolation, bypassing real grammar loading) — writing through to
	// the tracked `packages/<grammar>/.sittir/grammar-diagnostics.json` in that
	// case would contaminate the real artifact with test fixtures. Keep the
	// injection seam side-effect-free.
	if (input.injectedDiagnostics === undefined) {
		writeGrammarDiagnosticsJson(diagnostics, resolve('packages', input.grammar, '.sittir', 'grammar-diagnostics.json'));
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
	process.stderr.write(`Diagnostics present (${diagnostics.map((d) => d.code).join(', ')}). Proceed? [y/N] `);
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
 * Core codegen path: generate IR from grammar, write all output files, run the
 * renderable check, rebuild the native binding, and write the manifest. Returns
 * the assembled `NodeMap` so the caller (the cli `gen` orchestrator) can thread
 * it into the tools-side post-generate validation passes (parity fixtures,
 * round-trip probes) — this function no longer runs validation itself, which is
 * what severs the `codegen → tools` dependency.
 *
 * Preconditions (checked by caller or CLI):
 *  - `opts.outputDir` must be set (throws otherwise)
 *  - `opts.all` or `opts.nodes` must be set (throws otherwise)
 *
 * Throws an `Error` (rather than calling `process.exit`) for missing required
 * options, so programmatic callers can handle them. The CLI layer converts
 * these throws to `console.error` + `process.exit(1)`.
 */
export async function runCodegen(opts: CodegenOptions): Promise<NodeMap> {
	// Codegen IS the writer of the per-grammar manifest. Internal validator runs
	// invoked from inside this function (e.g. extractParityFixtures uses
	// validateReadRenderParse to extract parity fixtures BEFORE the manifest is
	// rewritten) would otherwise verify the manifest mid-write — checking the
	// codegen process against its own incomplete output, which is meaningless.
	// Set the env so `loadLanguageForGrammar` skips verification for these
	// internal calls. External callers (validator CLI, probe-validate, etc.) do
	// not run this function and therefore do not inherit this env.
	process.env.SITTIR_INTERNAL_CODEGEN_RUN = '1';

	const { grammar, outputDir, all, nodes, testsDir, noEmitDiff, buildNative, workspaceCheck } = opts;

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

	// Surface slot-grouping diagnostics from the normalize phase. These are
	// non-blocking propose-promotion suggestions; printing them here (after
	// generate()) ensures they appear during `sittir gen --all` even when
	// the preflight and generate() pipelines are separate.
	if (result.slotGroupingDiagnostics.length > 0) {
		const mapped = result.slotGroupingDiagnostics.map((d) => fromSlotGrouping(grammar, d));
		process.stderr.write(formatGrammarDiagnostics(mapped) + '\n');
	}

	const outDir = outputDir;

	// Write source files
	await writeFile(join(outDir, 'grammar.ts'), result.grammar);
	await writeFile(join(outDir, 'engine.ts'), result.engine);
	await writeFile(join(outDir, 'types.ts'), result.types);
	await writeFile(join(outDir, 'factories.ts'), result.factories);
	await writeFile(join(outDir, 'wrap.ts'), result.wrap);
	await writeFile(join(outDir, 'utils.ts'), result.utils);
	await writeFile(join(outDir, 'from.ts'), result.from);
	await writeFile(join(outDir, 'ir.ts'), result.irNamespace);
	await writeFile(join(outDir, 'consts.ts'), result.consts);
	await writeFile(join(outDir, 'is.ts'), result.is);
	await writeFile(join(outDir, 'index.ts'), result.index);

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
		await writeFile(emit.hashRs.path, emit.hashRs.contents);
		await writeFile(emit.hashTs.path, emit.hashTs.contents);
		await writeFile(emit.templatesRs.path, emit.templatesRs.contents);
		await writeFile(emit.transportRs.path, emit.transportRs.contents);
		await writeFile(emit.libRs.path, emit.libRs.contents);
		// Copy the per-kind `.jinja` files into the grammar crate's templates/
		// directory so askama's build-time `#[template(path = ...)]` can
		// resolve them (T030). Stale files (no longer in the generated copy
		// plan) are removed so regenerations don't accumulate dead templates.
		const dstTemplatesDir = renderModule.templateCopies.directory;
		mkdirSync(dstTemplatesDir, { recursive: true });
		const emittedNames = new Set<string>();
		for (const file of renderModule.templateCopies.files) {
			await writeFile(file.path, file.contents);
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
			await writeFile(kindIdsPath, result.kindIds);
			console.log(`    ${kindIdsPath}`);
		}
		console.log(`  → Rust render module regenerated for ${grammar}:`);
		console.log(`    ${emit.hashRs.path}`);
		console.log(`    ${emit.hashTs.path}`);
		console.log(`    ${emit.templatesRs.path}`);
		console.log(`    ${emit.libRs.path}`);
		console.log(`    ${dstTemplatesDir}/ (${emittedNames.size} .jinja files)`);

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
			//
			// Skippable via --no-workspace-check: a multi-grammar driver
			// (`regen:all`) runs the check once on its LAST grammar instead of
			// once per grammar — the final check still covers the whole
			// workspace, the earlier ones were redundant.
			if (workspaceCheck !== false) {
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
	}

	// Write node model (single on-disk metadata source — PR-K folded the
	// former factory-map.json5 sections in here).
	await writeFile(join(outDir, 'node-model.json5'), result.nodeModel);

	// Write suggested overrides log (T042f) next to overrides.ts at the
	// package root. This is a documentation file — not runnable.
	await writeFile(join(dirname(outDir), 'overrides.suggested.ts'), result.suggested);

	// Write tests
	const testsDirResolved = testsDir ?? join(dirname(outDir), 'tests');
	await writeFile(join(testsDirResolved, 'nodes.test.ts'), result.tests);

	// Write type-level tests
	await writeFile(join(outDir, 'type-test.ts'), result.typeTests);

	// Write vitest config
	await writeFile(join(dirname(outDir), 'vitest.config.ts'), result.config);

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

	console.log(`
Done! Generated:
  templates/*.jinja, grammar.ts, types.ts, factories.ts, utils.ts, from.ts, consts.ts, index.ts
  vitest.config.ts
`);
	// Spec 013: dump derive-audit counts if SITTIR_AUDIT_DERIVE=1 was set.
	// No-op otherwise. Used to validate simplify's canonicalization before
	// shrinking `deriveFields` / `deriveChildren` to trivial walks.
	(await import('./compiler/model/node-map.ts')).dumpDerivationAudit(`${grammar}-derive`);

	// Return the assembled NodeMap so the cli orchestrator can thread it into the
	// tools-side post-generate validation passes (parity fixtures, round-trip
	// probes) — validation no longer runs inside codegen.
	return result.nodeMap;
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
export async function runFullRegen(opts: CodegenOptions): Promise<NodeMap> {
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
		console.log(`Full regenerate for ${grammar}: transpile + tree-sitter generate + compile-parser + sittir codegen`);
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
	// → emit-diff → native rebuild (if applicable)). The native rebuild lives
	// inside runCodegen (within the shouldEmitRustRender block) so it runs BEFORE
	// manifest write — matching the original ordering from mainCli where cargo
	// build preceded writeManifestForGrammar. Returns the NodeMap for the
	// orchestrator's post-generate validation.
	return runCodegen(opts);
}
