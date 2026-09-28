import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allGrammars, grammarPackageDir, grammarRequire } from '@sittir/codegen/grammars';
import { evaluate } from '../../codegen/src/compiler/evaluate.ts';
import { grammarPackageFiles } from '../src/bootstrap/templates.ts';
import { ensureConflictResolutions } from '../../codegen/src/transpile/conflict-resolutions-file.ts';

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

describe('a bootstrapped grammar hand-writes no rule', () => {
	it('the template grammar compiles the upstream rules as is, with the whitespace supertype minted by enrich', async () => {
		const template = grammarPackageFiles({
			name: 'regex',
			Name: 'Regex',
			upstreamDependency: 'tree-sitter-regex',
			upstreamRange: '^0.25.0'
		}).find((f) => f.path === 'grammar.sittir.ts')!.contents;
		const source = template
			.replace("'tree-sitter-regex/grammar.js'", JSON.stringify(grammarRequire('regex').resolve('tree-sitter-regex/grammar.js')))
			.replace("'../codegen/src/dsl/index.ts'", JSON.stringify(resolve(__dirname, '../../codegen/src/dsl/index.ts')));
		const dir = mkdtempSync(join(tmpdir(), 'sittir-bootstrap-template-'));
		const entry = join(dir, 'grammar.sittir.ts');
		writeFileSync(entry, source, 'utf8');
		ensureConflictResolutions({ dir });
		try {
			const raw = await evaluate(entry);
			expect(raw.stages).toBeUndefined();
			expect(raw.ruleCauses ?? {}).toEqual({});
			expect(raw.undeclaredRules ?? []).toEqual([]);
			expect(raw.supertypes).toContain('_whitespace');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	}, 60_000);
});
