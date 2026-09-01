import * as esbuild from 'esbuild';
import { mkdirSync, existsSync, writeFileSync, copyFileSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function writeFileIfChanged(path: string, content: string | Uint8Array): void {
	if (existsSync(path)) {
		try {
			const existing = readFileSync(path);
			const next = typeof content === 'string' ? Buffer.from(content) : Buffer.from(content);
			if (existing.equals(next)) return;
		} catch {}
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

	copyExternalScannerSources(opts.grammar, outputDir);

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
		plugins: [externalizeTreeSitterBases()],
		footer: {
			js: 'if (module.exports && module.exports.default) module.exports = module.exports.default;'
		},
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
		if ((e as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') return;
		throw e;
	}
	const baseSrc = join(basePkgPath, 'src');
	if (!existsSync(baseSrc)) return;
	const targetSrc = join(outputDir, 'src');
	mkdirSync(targetSrc, { recursive: true });
	for (const file of readdirSync(baseSrc)) {
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
			const pkgPattern = /tree-sitter-[a-z][a-z0-9-]*(\/|$)/;
			build.onResolve({ filter: pkgPattern }, (args) => {
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
