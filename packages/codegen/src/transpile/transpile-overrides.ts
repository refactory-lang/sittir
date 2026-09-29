import * as esbuild from 'esbuild';
import { mkdirSync, existsSync, writeFileSync, copyFileSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { packageRequire, sittirDirOf, upstreamPackage, type GrammarPackage } from '../grammars.ts';
import { packageEntryPath } from '../compiler/resolve-grammar.ts';
import { ensureConflictResolutions } from './conflict-resolutions-file.ts';

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
	package: GrammarPackage;
}

export interface TranspileResult {
	outputPath: string;
	sourceBytes: number;
	outputBytes: number;
}

export async function transpileOverrides(opts: TranspileOptions): Promise<TranspileResult> {
	const grammar = opts.package.name;
	const inputPath = packageEntryPath(opts.package);
	const outputDir = sittirDirOf(opts.package);
	const outputPath = join(outputDir, 'grammar.js');

	if (!existsSync(inputPath)) {
		throw new Error(`transpileOverrides: no grammar.sittir.ts at ${inputPath}`);
	}

	mkdirSync(outputDir, { recursive: true });
	ensureConflictResolutions(opts.package);

	copyExternalScannerSources(opts.package, outputDir);

	writeFileIfChanged(
		join(outputDir, 'package.json'),
		JSON.stringify(
			{
				name: `tree-sitter-${grammar}`,
				type: 'commonjs',
				'tree-sitter': [
					{
						scope: `source.${grammar}`,
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
						name: grammar,
						camelcase: grammar.charAt(0).toUpperCase() + grammar.slice(1),
						scope: `source.${grammar}`,
						path: '.',
						'file-types': []
					}
				],
				metadata: {
					version: '0.0.1',
					license: 'MIT',
					description: `Sittir-bundled ${grammar} grammar`,
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
		throw new Error(`transpileOverrides(${grammar}): esbuild errors:\n${messages}`);
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

function copyExternalScannerSources(pkg: GrammarPackage, outputDir: string): void {
	const grammar = pkg.name;
	let basePkgPath: string;
	try {
		basePkgPath = dirname(packageRequire(pkg).resolve(`${upstreamPackage(grammar)}/package.json`));
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
