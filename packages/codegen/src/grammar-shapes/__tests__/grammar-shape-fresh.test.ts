import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { grammarPackages } from '../../grammars.ts';
import { BASE_ENTRY, emitGrammarShapeSource, grammarShapeFile } from '../emit-grammar-shape.ts';

describe('grammar shapes are derived from the upstream grammar.json', () => {
	for (const pkg of grammarPackages()) {
		it(`${pkg.name}: ${BASE_ENTRY} exists and grammar-shape.${pkg.name}.ts matches a fresh emit`, async () => {
			expect(existsSync(join(pkg.dir, BASE_ENTRY)), join(pkg.dir, BASE_ENTRY)).toBe(true);
			expect(readFileSync(grammarShapeFile(pkg.name), 'utf8')).toBe(await emitGrammarShapeSource(pkg));
		});
	}
});
