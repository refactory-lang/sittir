import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { type GrammarPackage, sittirDirOf } from '../grammars.ts';
import { packageEntryPath } from '../compiler/resolve-grammar.ts';
import { UNBOUND_ENV } from '../dsl/sittir-grammar.ts';
import { buildParserWasm, copyRelativeScannerIncludes } from './compile-parser.ts';
import { runTreeSitterCliCapturing } from './tree-sitter-cli.ts';

export function buildSourceParser(pkg: GrammarPackage): Uint8Array {
	const temporary = mkdtempSync(join(tmpdir(), 'sittir-source-parser-'));
	try {
		const grammarDir = join(temporary, pkg.name);
		const parserDir = join(grammarDir, '.sittir');
		mkdirSync(parserDir, { recursive: true });
		cpSync(join(sittirDirOf(pkg), 'src'), join(parserDir, 'src'), { recursive: true });
		const scanner = join(sittirDirOf(pkg), 'src/scanner.c');
		if (existsSync(scanner)) copyRelativeScannerIncludes(scanner, join(parserDir, 'src/scanner.c'));
		const metadata = join(sittirDirOf(pkg), 'tree-sitter.json');
		if (existsSync(metadata)) cpSync(metadata, join(parserDir, 'tree-sitter.json'));
		const entry = pathToFileURL(packageEntryPath(pkg)).href;
		writeFileSync(join(parserDir, 'grammar.js'), `export { default } from ${JSON.stringify(entry)};\n`);
		const generated = runTreeSitterCliCapturing(['generate'], parserDir, { [UNBOUND_ENV]: '1' });
		if (generated.status !== 0) throw new Error(`source parser generation failed for ${pkg.name}: ${generated.stderr}`);
		return readFileSync(buildParserWasm(grammarDir));
	} finally {
		rmSync(temporary, { recursive: true, force: true });
	}
}
