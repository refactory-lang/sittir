import * as esbuild from 'esbuild';
import { mkdirSync, existsSync, writeFileSync, copyFileSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { PACKAGES_DIR, grammarRequire, upstreamPackage } from '../grammars.ts';

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
	const root = opts.packagesRoot ?? PACKAGES_DIR;
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

const SCANNER_SOURCES = ['scanner.c', 'scanner.cc'];

function stubScannerSource(grammar: string): string {
	const fn = `tree_sitter_${grammar}_external_scanner`;
	return [
		'#include "tree_sitter/parser.h"',
		'',
		`void *${fn}_create(void) { return NULL; }`,
		`void ${fn}_destroy(void *payload) { (void)payload; }`,
		`unsigned ${fn}_serialize(void *payload, char *buffer) { (void)payload; (void)buffer; return 0; }`,
		`void ${fn}_deserialize(void *payload, const char *buffer, unsigned length) { (void)payload; (void)buffer; (void)length; }`,
		`bool ${fn}_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) { (void)payload; (void)lexer; (void)valid_symbols; return false; }`,
		''
	].join('\n');
}

function copyExternalScannerSources(grammar: string, outputDir: string): void {
	let basePkgPath: string;
	try {
		basePkgPath = dirname(grammarRequire(grammar).resolve(`${upstreamPackage(grammar)}/package.json`));
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') return;
		throw e;
	}
	const targetSrc = join(outputDir, 'src');
	const hasUpstreamScanner = [join(basePkgPath, 'src'), join(basePkgPath, grammar, 'src')].some((dir) =>
		SCANNER_SOURCES.some((file) => existsSync(join(dir, file)))
	);
	if (!hasUpstreamScanner) {
		mkdirSync(targetSrc, { recursive: true });
		writeFileIfChanged(join(targetSrc, 'scanner.c'), stubScannerSource(grammar));
		return;
	}
	const baseSrc = join(basePkgPath, 'src');
	if (!existsSync(baseSrc)) return;
	mkdirSync(targetSrc, { recursive: true });
	for (const file of readdirSync(baseSrc)) {
		if (SCANNER_SOURCES.includes(file)) {
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
