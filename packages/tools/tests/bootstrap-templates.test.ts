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

const COMPOSITION = /\bsittirGrammar\b[^}]*\} from '\.\.\/codegen\/src\/dsl\/(index|dsl-authoring)\.ts';[\s\S]*export default sittirGrammar\(base, \{[\s\S]*\}\);\s*$/;
const SEPARATE_STEPS = /\b(enrich|wire)\(/;

function expectComposition(source: string): void {
	expect(source).toMatch(COMPOSITION);
	expect(source).not.toMatch(SEPARATE_STEPS);
}

describe('grammar composition goes through sittirGrammar, which enriches and wires the base itself', () => {
	it('the bootstrap template', () => {
		expectComposition(python.find((f) => f.path === 'grammar.sittir.ts')!.contents);
	});
	for (const grammar of allGrammars()) {
		it(grammar, () => {
			expectComposition(readFileSync(join(grammarPackageDir(grammar), 'grammar.sittir.ts'), 'utf8'));
		});
	}
});
