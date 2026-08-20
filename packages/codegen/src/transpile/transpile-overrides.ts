/**
 * transpile/transpile-overrides.ts — TypeScript → CommonJS bridge for
 * tree-sitter CLI consumption.
 *
 * Sittir's pipeline loads `packages/<lang>/grammar.sittir.ts` directly via
 * `import()` (handled by tsx/Node's TS loader). Tree-sitter's CLI
 * cannot — it expects a CommonJS `grammar.js` file that calls the
 * baseline DSL functions (`grammar`, `seq`, `choice`, ...) which it
 * provides as globals via its own runtime.
 *
 * This transpile step bridges the two: it reads `grammar.sittir.ts`, runs
 * esbuild in CJS+bundle mode, and writes
 * `packages/<lang>/.sittir/grammar.js`. The `.sittir/` directory is
 * gitignored — it's a build artifact, not source.
 *
 * The sittir DSL extensions (`enrich`, `transform`, `role`, `alias`,
 * `insert`, `replace`) are bundled inline so the transpiled file has
 * no external module references. The base tree-sitter grammar package
 * (`tree-sitter-rust/grammar.js` etc.) stays external — tree-sitter's
 * CLI resolves it the same way it always does.
 */

import * as esbuild from 'esbuild';
import { mkdirSync, existsSync, writeFileSync, copyFileSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Content-aware write: skip when the file already holds identical bytes.
 * Not just an mtime nicety — `compileParser`'s regenerate-vs-skip guard
 * compares `grammar.js`'s mtime against the compiled parser's, and a
 * same-content rewrite here would force a full (slow, non-atomic)
 * `tree-sitter generate` downstream, whose in-place rewrite of
 * `.sittir/src/grammar.json` races any concurrent reader hashing it
 * (the generated-manifest check under parallel vitest workers).
 */
function writeFileIfChanged(path: string, content: string | Uint8Array): void {
	if (existsSync(path)) {
		try {
			const existing = readFileSync(path);
			const next = typeof content === 'string' ? Buffer.from(content) : Buffer.from(content);
			if (existing.equals(next)) return;
		} catch {
			// Unreadable existing file — fall through and overwrite.
		}
	}
	writeFileSync(path, content);
}

const requireFromHere = createRequire(import.meta.url);

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagesRoot = resolve(__dirname, '../../..');

export interface TranspileOptions {
	grammar: string;
	packagesRoot?: string;
}

export interface TranspileResult {
	outputPath: string;
	sourceBytes: number;
	outputBytes: number;
}

export async function transpileOverrides(opts: TranspileOptions): Promise<TranspileResult> {
	const root = opts.packagesRoot ?? packagesRoot;
	const inputPath = join(root, opts.grammar, 'grammar.sittir.ts');
	const outputDir = join(root, opts.grammar, '.sittir');
	const outputPath = join(outputDir, 'grammar.js');

	if (!existsSync(inputPath)) {
		throw new Error(`transpileOverrides: no grammar.sittir.ts at ${inputPath}`);
	}

	mkdirSync(outputDir, { recursive: true });

	// Copy the base grammar's external scanner sources alongside the
	// bundled grammar.js so `tree-sitter generate` + parser.c
	// compilation can resolve the external scanner symbols
	// (`tree_sitter_<name>_external_scanner_*`). Without this, parsers
	// that use indent/dedent tracking (python, etc.) fail to link with
	// "Undefined symbols ... external_scanner_*".
	copyExternalScannerSources(opts.grammar, outputDir);

	// Nested package.json serves two purposes:
	//   1. `type: 'commonjs'` overrides the parent package's `"type":
	//      "module"` so Node loads grammar.js as CJS — tree-sitter's
	//      CLI requires CJS-style `module.exports = ...`.
	//   2. `name` is required by tree-sitter's parser-generator —
	//      it reads the package name from the nearest package.json
	//      to identify the grammar.
	writeFileIfChanged(
		join(outputDir, 'package.json'),
		JSON.stringify(
			{
				name: `tree-sitter-${opts.grammar}`,
				type: 'commonjs',
				'tree-sitter': [
					{
						scope: `source.${opts.grammar}`,
						'file-types': []
					}
				]
			},
			null,
			2
		) + '\n'
	);

	// Tree-sitter.json — required for ABI 15 (current). Without this,
	// tree-sitter generate falls back to ABI 14 with a warning.
	writeFileIfChanged(
		join(outputDir, 'tree-sitter.json'),
		JSON.stringify(
			{
				$schema: 'https://tree-sitter.github.io/tree-sitter/assets/schemas/config.schema.json',
				grammars: [
					{
						name: opts.grammar,
						camelcase: opts.grammar.charAt(0).toUpperCase() + opts.grammar.slice(1),
						scope: `source.${opts.grammar}`,
						path: '.',
						'file-types': []
					}
				],
				metadata: {
					version: '0.0.1',
					license: 'MIT',
					description: `Sittir-bundled ${opts.grammar} grammar`,
					authors: [{ name: 'sittir', email: 'noreply@example.com' }]
				}
			},
			null,
			4
		) + '\n'
	);

	const result = await esbuild.build({
		entryPoints: [inputPath],
		outfile: outputPath,
		bundle: true,
		format: 'cjs',
		platform: 'node',
		target: 'node18',
		// The DSL primitives from @sittir/codegen/dsl get inlined so
		// the transpiled file has no external module imports.
		// Tree-sitter base grammars are externalized via a custom
		// resolver plugin that matches both package-name imports
		// (`tree-sitter-python/grammar.js`) and relative pnpm paths
		// (`../../node_modules/.pnpm/tree-sitter-python@.../grammar.js`).
		// Tree-sitter's CLI provides its own `grammar()` global at
		// runtime, so the externalized base call resolves there.
		plugins: [externalizeTreeSitterBases()],
		// esbuild's CJS format wraps the default export as
		// `module.exports = { default: ..., __esModule: true }`.
		// Tree-sitter's CLI loads grammar.js and expects
		// `module.exports` to BE the grammar object directly. The
		// footer flattens the wrapper so tree-sitter sees the grammar
		// at the top level. Idempotent — re-running on an already-
		// flat module.exports is a no-op because `.default` is undefined.
		footer: {
			js: 'if (module.exports && module.exports.default) module.exports = module.exports.default;'
		},
		// `write: false` + writeFileIfChanged below: the bundle is
		// byte-deterministic for unchanged input, so skipping the
		// identical rewrite keeps grammar.js's mtime stable and
		// compileParser's regenerate-vs-skip guard honest.
		write: false,
		metafile: true,
		logLevel: 'silent'
	});

	if (result.errors.length > 0) {
		const messages = result.errors.map((e) => e.text).join('\n');
		throw new Error(`transpileOverrides(${opts.grammar}): esbuild errors:\n${messages}`);
	}

	for (const file of result.outputFiles ?? []) {
		writeFileIfChanged(file.path, file.contents);
	}

	const meta = result.metafile!;
	// Look up by explicit path keys instead of `Object.values(...)[0]`.
	// esbuild's metafile uses path strings (relative to cwd) as keys
	// and doesn't guarantee that the entry point is the first entry —
	// synthesized helpers and re-exports can precede it.
	const inputKey = Object.keys(meta.inputs).find((k) => k.endsWith('grammar.sittir.ts'));
	const outputKey = Object.keys(meta.outputs).find((k) => k.endsWith('grammar.js'));
	const inputMeta = inputKey ? meta.inputs[inputKey] : undefined;
	const outputMeta = outputKey ? meta.outputs[outputKey] : undefined;

	return {
		outputPath,
		sourceBytes: inputMeta?.bytes ?? 0,
		outputBytes: outputMeta?.bytes ?? 0
	};
}

function copyExternalScannerSources(grammar: string, outputDir: string): void {
	let basePkgPath: string;
	try {
		basePkgPath = dirname(requireFromHere.resolve(`tree-sitter-${grammar}/package.json`));
	} catch (e) {
		// Narrow to MODULE_NOT_FOUND — we expect "package doesn't exist"
		// (grammar has no external scanner) but NOT permission errors,
		// malformed package.json, or anything else. Let those surface.
		if ((e as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') return;
		throw e;
	}
	const baseSrc = join(basePkgPath, 'src');
	if (!existsSync(baseSrc)) return;
	const targetSrc = join(outputDir, 'src');
	mkdirSync(targetSrc, { recursive: true });
	for (const file of readdirSync(baseSrc)) {
		// Copy only scanner sources — parser.c and grammar.json get
		// regenerated by tree-sitter generate and would clobber what's
		// about to be produced.
		if (file === 'scanner.c' || file === 'scanner.cc') {
			const srcFile = join(baseSrc, file);
			const dstFile = join(targetSrc, file);
			if (statSync(srcFile).isFile()) {
				copyFileSync(srcFile, dstFile);
			}
		}
	}
}

function externalizeTreeSitterBases(): esbuild.Plugin {
	return {
		name: 'externalize-tree-sitter-bases',
		setup(build) {
			// Match ANY tree-sitter-<lang> package import — including
			// transitive ones (e.g., typescript's grammar internally
			// requires tree-sitter-javascript). Without this, esbuild
			// bundles the whole grammar dependency chain, which loses
			// the runtime grammar() global and breaks tree-sitter's
			// parser-generator (it processes the bundled tree as if
			// sittir's overrides had replaced it).
			// Widened from `[a-z]+` to `[a-z][a-z0-9-]*` so names with
			// hyphens/digits also match (tree-sitter-c-sharp,
			// tree-sitter-typescript-tsx, tree-sitter-julia-ts, ...).
			const pkgPattern = /tree-sitter-[a-z][a-z0-9-]*(\/|$)/;
			build.onResolve({ filter: pkgPattern }, (args) => {
				// Strip any leading path components down to the
				// tree-sitter-<lang> package segment, then keep the
				// sub-path (or default to /grammar.js).
				const match = args.path.match(/(?:^|\/)(tree-sitter-[a-z][a-z0-9-]*)(\/.+)?$/);
				if (!match) return null;
				const pkg = match[1]!;
				const sub = match[2] ?? '/grammar.js';
				return {
					path: `${pkg}${sub}`,
					external: true
				};
			});
		}
	};
}
