import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { layerPath, sittirDirOf, type GrammarLayer, type GrammarPackage } from '../grammars.ts';

export function withScratchEntry<T>(pkg: GrammarPackage, layer: GrammarLayer, run: (parserDir: string) => T): T {
	const temporary = mkdtempSync(join(tmpdir(), 'sittir-scratch-entry-'));
	try {
		const parserDir = join(temporary, pkg.name, '.sittir');
		mkdirSync(parserDir, { recursive: true });
		const metadata = join(sittirDirOf(pkg), 'tree-sitter.json');
		if (existsSync(metadata)) cpSync(metadata, join(parserDir, 'tree-sitter.json'));
		writeFileSync(join(parserDir, 'grammar.js'), `export { default } from ${JSON.stringify(pathToFileURL(layerPath(pkg, layer)).href)};\n`);
		return run(parserDir);
	} finally {
		rmSync(temporary, { recursive: true, force: true });
	}
}
