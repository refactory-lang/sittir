import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allGrammars, grammarPackageDir } from '@sittir/codegen/grammars';
import { grammarPackageFiles } from '../src/bootstrap/templates.ts';

const python = grammarPackageFiles({
	name: 'python',
	Name: 'Python',
	upstreamDependency: 'tree-sitter-python',
	upstreamRange: '^0.25.0'
});

describe('bootstrap templates reproduce an existing grammar package', () => {
	for (const file of python.filter((f) => f.path.startsWith('tsconfig'))) {
		it(file.path, () => {
			expect(JSON.parse(file.contents)).toEqual(
				JSON.parse(readFileSync(join(grammarPackageDir('python'), file.path), 'utf8'))
			);
		});
	}
});

const ENRICHED_COMPOSITION =
	/const enrichedBase = enrich\(base\);[\s\S]*export default grammar\(\s*enrichedBase,\s*wire\([\s\S]*,\s*enrichedBase\s*\)\s*\);\s*$/;

describe('grammar composition passes the enriched base to wire', () => {
	it('the bootstrap template', () => {
		expect(python.find((f) => f.path === 'grammar.sittir.ts')!.contents).toMatch(ENRICHED_COMPOSITION);
	});
	for (const grammar of allGrammars()) {
		it(grammar, () => {
			expect(readFileSync(join(grammarPackageDir(grammar), 'grammar.sittir.ts'), 'utf8')).toMatch(ENRICHED_COMPOSITION);
		});
	}
});
