import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { format as oxfmtFormat } from 'oxfmt';
import { OXFMT_EFFECTIVE_CONFIG } from './oxfmt-config.ts';

import { validateRenderableFromNodeMap, formatRenderableReport } from './validate/renderable.ts';

import { generate } from './compiler/generate.ts';
import { evaluate } from './compiler/evaluate.ts';
import { resolveGrammarJsPath, resolveOverridesPath } from './compiler/resolve-grammar.ts';
import { loadGeneratedIdTables } from './compiler/generated-metadata.ts';
import {
	collectGrammarDiagnosticsForGrammar,
	GrammarDiagnosticError,
	formatGrammarDiagnostics,
	writeGrammarDiagnosticsJson,
	fromSlotGrouping,
	fromParseKindCollision,
	type GrammarDiagnostic
} from './compiler/diagnostics/grammar-diagnostics.ts';
import { getEnrichUnaliasDiagnostics } from './dsl/enrich.ts';
import { drainUnnamedChoiceSlots } from './compiler/collect-slots.ts';
import { transpileOverrides } from './transpile/transpile-overrides.ts';
import { pruneOrphanedPlaceholderRules } from './transpile/prune-grammar-json.ts';
import { writeJinjaTemplates } from './emitters/templates.ts';
import { renderModuleSrcDir } from './emitters/render-module-paths.ts';
import { writeManifestForGrammar, type Grammar } from './scripts/generated-manifest.ts';
import type { NodeMap } from './compiler/types.ts';
import { formatEmitDiff } from './scripts/emit-diff.ts';

export interface CodegenOptions {
	grammar: string;
	outputDir: string;
	nodes?: string[];
	all?: boolean;
	testsDir?: string;
	compileParser?: boolean;
	transpile?: boolean;
	tsGenerate?: boolean;
	skipTsChain?: boolean;
	buildNative?: boolean;
	nativeDebug?: boolean;
	workspaceCheck?: boolean;
	noEmitDiff?: boolean;
	allowDiagnostics?: string[];
}

export async function writeFile(path: string, content: string): Promise<void> {
	let finalContent = content;
	if (path.endsWith('.ts')) {
		const result = await oxfmtFormat(path, content, OXFMT_EFFECTIVE_CONFIG);
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
		}
	}
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, finalContent, 'utf8');
}

export function runTreeSitterGenerate(grammar: string): void {
	const sittirDir = resolve('packages', grammar, '.sittir');
	console.log(`Running 'tree-sitter generate' in ${sittirDir}...`);
	execSync('npx tree-sitter generate', {
		cwd: sittirDir,
		stdio: 'inherit'
	});
	pruneOrphanedPlaceholderRules(sittirDir);
}

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
		const unaliasDiagnostics = getEnrichUnaliasDiagnostics(rawGrammar).map((d) =>
			fromParseKindCollision(input.grammar, d)
		);
		const generatedIdTables = await loadGeneratedIdTables(input.grammar);
		diagnostics = [
			...collectGrammarDiagnosticsForGrammar({ rawGrammar, generatedIdTables }).diagnostics,
			...unaliasDiagnostics
		];
	}

	const blockedSet = new Set(diagnostics.filter((d) => !input.allowDiagnostics.has(d.code) && d.canProceed === false));
	const blocked = [...blockedSet];

	const nonBlocking = diagnostics.filter((d) => !blockedSet.has(d));
	if (nonBlocking.length > 0) {
		process.stderr.write(formatGrammarDiagnostics(nonBlocking) + '\n');
	}
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

export async function runCodegen(opts: CodegenOptions): Promise<NodeMap> {
	process.env.SITTIR_INTERNAL_CODEGEN_RUN = '1';

	const { grammar, outputDir, all, nodes, testsDir, noEmitDiff, buildNative, nativeDebug, workspaceCheck } = opts;

	if (!outputDir) {
		throw new Error('Missing required argument: --output. Use --help for usage.');
	}
	if (!all && (!nodes || nodes.length === 0)) {
		throw new Error('Must provide --nodes or --all. Use --help for usage.');
	}

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

	if (result.slotGroupingDiagnostics.length > 0) {
		const mapped = result.slotGroupingDiagnostics.map((d) => fromSlotGrouping(grammar, d));
		process.stderr.write(formatGrammarDiagnostics(mapped) + '\n');
	}

	const outDir = outputDir;

	await writeFile(join(outDir, 'grammar.ts'), result.grammar);
	await writeFile(join(outDir, 'engine.ts'), result.engine);
	await writeFile(join(outDir, 'render-engine.ts'), result.renderEngine);
	await writeFile(join(outDir, 'types.ts'), result.types);
	await writeFile(join(outDir, 'factories.ts'), result.factories);
	await writeFile(join(outDir, 'wrap.ts'), result.wrap);
	await writeFile(join(outDir, 'utils.ts'), result.utils);
	await writeFile(join(outDir, 'from.ts'), result.from);
	await writeFile(join(outDir, 'ir.ts'), result.irNamespace);
	await writeFile(join(outDir, 'consts.ts'), result.consts);
	await writeFile(join(outDir, 'is.ts'), result.is);
	await writeFile(join(outDir, 'index.ts'), result.index);

	writeJinjaTemplates(result.jinjaTemplates, join(dirname(outDir), 'templates'));

	{
		const census = result.jinjaTemplates.seamCensus;
		const total = census.boundaries.length;
		console.log(
			`  seam census: ${total} template boundaries — ` +
				`${census.staticGlued + census.staticSpaced} static ` +
				`(${census.staticGlued} glued, ${census.staticSpaced} spaced), ` +
				`${census.runtimeDerivable} runtime-derivable, ` +
				`${census.runtimeVarying} runtime-varying (residue)`
		);
		writeFileSync(
			join(dirname(outDir), '.sittir', 'seam-census.json'),
			JSON.stringify(
				{
					total,
					staticGlued: census.staticGlued,
					staticSpaced: census.staticSpaced,
					runtimeDerivable: census.runtimeDerivable,
					runtimeVarying: census.runtimeVarying,
					boundaries: census.boundaries
				},
				null,
				'\t'
			) + '\n',
			'utf8'
		);
	}

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

		if (buildNative !== false) {
			const nativeCrate = `rust/crates/sittir-${grammar}`;
			const nativeBuildScript = nativeDebug === true ? 'build:debug' : 'build';
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

	await writeFile(join(outDir, 'node-model.json5'), result.nodeModel);

	const testsDirResolved = testsDir ?? join(dirname(outDir), 'tests');
	await writeFile(join(testsDirResolved, 'nodes.test.ts'), result.tests);

	await writeFile(join(dirname(outDir), 'vitest.config.ts'), result.config);

	const config = { grammar, nodes: all ? undefined : nodes, outputDir };
	const renderable = validateRenderableFromNodeMap(config.grammar, result.nodeMap);
	console.log('');
	console.log(formatRenderableReport(renderable));

	const unnamedChoiceKinds = drainUnnamedChoiceSlots();
	if (unnamedChoiceKinds.length > 0) {
		console.warn(
			`\n⚠ ${unnamedChoiceKinds.length} unnamed choice slot(s) in ${grammar} — give each choice an explicit field name in packages/${grammar}/grammar.sittir.ts:\n  ` +
				unnamedChoiceKinds.join('\n  ')
		);
	}
	if (renderable.missing.length > 0) {
		console.warn(
			`\n${renderable.missing.length} un-renderable kind(s) — render() will throw if called on these instances.`
		);
	}

	writeManifestForGrammar(grammar as Grammar);
	console.log(`  → packages/${grammar}/.sittir/generated.manifest.json updated`);

	if (all && !noEmitDiff) {
		const emitDiff = formatEmitDiff(grammar as Grammar);
		if (emitDiff) console.log(`\n${emitDiff}`);
	}

	console.log(`
Done! Generated:
  templates/*.jinja, grammar.ts, types.ts, factories.ts, utils.ts, from.ts, consts.ts, index.ts
  vitest.config.ts
`);
	(await import('./compiler/model/node-map.ts')).dumpDerivationAudit(`${grammar}-derive`);

	return result.nodeMap;
}

export async function runFullRegen(opts: CodegenOptions): Promise<NodeMap> {
	process.env.SITTIR_INTERNAL_CODEGEN_RUN = '1';

	const { grammar, skipTsChain, transpile, tsGenerate } = opts;

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

	return runCodegen(opts);
}
