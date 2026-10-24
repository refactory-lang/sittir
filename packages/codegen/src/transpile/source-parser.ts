import { cpSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { type GrammarPackage, sittirDirOf } from '../grammars.ts';
import { buildParserWasm, copyRelativeScannerIncludes } from './compile-parser.ts';
import { withScratchEntry } from './scratch-entry.ts';
import { runTreeSitterCliCapturing } from './tree-sitter-cli.ts';

export function buildSourceParser(pkg: GrammarPackage): Uint8Array {
	return withScratchEntry(pkg, 'sittir', (parserDir) => {
		cpSync(join(sittirDirOf(pkg), 'src'), join(parserDir, 'src'), { recursive: true });
		const scanner = join(sittirDirOf(pkg), 'src/scanner.c');
		if (existsSync(scanner)) copyRelativeScannerIncludes(scanner, join(parserDir, 'src/scanner.c'));
		const generated = runTreeSitterCliCapturing(['generate'], parserDir);
		if (generated.status !== 0) throw new Error(`source parser generation failed for ${pkg.name}: ${generated.stderr}`);
		return readFileSync(buildParserWasm(dirname(parserDir)));
	});
}
