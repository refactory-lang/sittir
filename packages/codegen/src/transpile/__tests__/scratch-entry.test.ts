import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GRAMMAR_LAYERS, grammarPackage, layerPath, sittirDirOf } from '../../grammars.ts';
import { withScratchEntry } from '../scratch-entry.ts';

describe('withScratchEntry', () => {
	it.each(GRAMMAR_LAYERS)("gives tree-sitter a grammar.js that re-exports rust's %s layer, beside its metadata, and removes both after", (layer) => {
		const pkg = grammarPackage('rust');
		const parserDir = withScratchEntry(pkg, layer, (dir) => {
			expect(readFileSync(join(dir, 'grammar.js'), 'utf8')).toBe(`export { default } from ${JSON.stringify(pathToFileURL(layerPath(pkg, layer)).href)};\n`);
			expect(readFileSync(join(dir, 'tree-sitter.json'), 'utf8')).toBe(readFileSync(join(sittirDirOf(pkg), 'tree-sitter.json'), 'utf8'));
			return dir;
		});
		expect(existsSync(parserDir)).toBe(false);
	});
});
