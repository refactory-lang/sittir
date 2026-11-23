import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BASE_ENTRY, grammarPackages } from '../../grammars.ts';
import {
	emitGrammarShapeSource,
	emitUpstreamDeclarationSource,
	grammarShapeFile,
	shapePackages,
	upstreamDeclarationFile
} from '../emit-grammar-shape.ts';

describe('the grammars a shape emit covers', () => {
	it('is the named grammars', () => {
		expect(shapePackages(['rust']).map((pkg) => pkg.name)).toEqual(['rust']);
	});

	it('is every grammar with a base entry when none is named', () => {
		const withBase = grammarPackages().filter((pkg) => existsSync(join(pkg.dir, BASE_ENTRY)));
		expect(shapePackages([]).map((pkg) => pkg.name)).toEqual(withBase.map((pkg) => pkg.name));
	});
});

describe('grammar shapes are derived from the upstream grammar.json', () => {
	for (const pkg of grammarPackages()) {
		it(`${pkg.name}: ${BASE_ENTRY} exists and grammar-shape.${pkg.name}.ts matches a fresh emit`, async () => {
			expect(existsSync(join(pkg.dir, BASE_ENTRY)), join(pkg.dir, BASE_ENTRY)).toBe(true);
			expect(readFileSync(grammarShapeFile(pkg.name), 'utf8')).toBe(await emitGrammarShapeSource(pkg));
		});
		it(`${pkg.name}: the upstream grammar.js is typed as its shape by a declaration that matches a fresh emit`, () => {
			expect(readFileSync(upstreamDeclarationFile(pkg), 'utf8')).toBe(emitUpstreamDeclarationSource(pkg));
		});
	}
});
