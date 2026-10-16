import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allGrammars, BINDINGS_MODULE, grammarPackage, grammarPackageDir, grammarRequire, topLayerPath } from '@sittir/codegen/grammars';
import { evaluate } from '../../codegen/src/compiler/evaluate.ts';
import { NO_FILE_TYPES } from '../../codegen/src/compiler/upstream-file-types.ts';
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

const STOCK_SHAPE = /export default grammar\(enrich\(base\), wire\(\{[\s\S]*\}\)\);\s*$/;
const GENERATED_SHAPE = /^import sittir from '\.\/grammar\.sittir\.ts';$[\s\S]*export default grammar\(\s*enrich\(sittir\),\s*wire\(\{[\s\S]*\}\)\s*\);\s*$/m;
const LAYER_HALVES = /\b(enrich|wire)\(/g;

function expectStockShape(source: string, shape: RegExp = STOCK_SHAPE): void {
	expect(source).toMatch(shape);
	expect(source.match(LAYER_HALVES)).toEqual(['enrich(', 'wire(']);
}

describe('grammar composition is one entry, whose base enrich() and wire() complete together', () => {
	it('the bootstrap template is in the stock shape', () => {
		expectStockShape(python.find((f) => f.path === 'grammar.sittir.ts')!.contents);
	});
	for (const grammar of allGrammars()) {
		it(grammar, () => {
			expectStockShape(readFileSync(join(grammarPackageDir(grammar), 'grammar.sittir.ts'), 'utf8'));
		});
	}

	for (const grammar of allGrammars().filter((name) => topLayerPath(grammarPackage(name)).endsWith(BINDINGS_MODULE))) {
		it(`${grammar}'s generated layer extends grammar.sittir.ts`, () => {
			expectStockShape(readFileSync(topLayerPath(grammarPackage(grammar)), 'utf8'), GENERATED_SHAPE);
		});
	}
});

describe('a bootstrapped grammar hand-writes no rule', () => {
	it('the template grammar compiles the upstream rules as is, with the layout supertype minted by enrich', async () => {
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
			const raw = await evaluate(entry, NO_FILE_TYPES);
			expect(raw.stages).toBeUndefined();
			expect(raw.ruleCauses ?? {}).toEqual({});
			expect(raw.undeclaredRules ?? []).toEqual([]);
			expect(raw.supertypes).toContain('_layout');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	}, 60_000);
});
