import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formattablePaths } from '../src/bootstrap/grammar.ts';
import { allGrammars, BINDINGS_MODULE, GRAMMAR_ENTRY, grammarPackage, grammarPackageDir, grammarRequire, REPO_ROOT, topLayerPath } from '@sittir/codegen/grammars';
import { evaluate } from '../../codegen/src/dsl/evaluate.ts';
import { NO_FILE_TYPES } from '../../codegen/src/compiler/upstream-file-types.ts';
import { BOOTSTRAP_INDENT_UNIT } from '@sittir/codegen/grammars';
import { indentProblemOf } from '../../codegen/src/compiler/model/layout-kinds.ts';
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
	it('package.json dependencies', () => {
		const pick = ({ dependencies, devDependencies }: Record<string, unknown>) => ({ dependencies, devDependencies });
		expect(pick(JSON.parse(python.find((f) => f.path === 'package.json')!.contents))).toEqual(
			pick(JSON.parse(readFileSync(join(grammarPackageDir('python'), 'package.json'), 'utf8')))
		);
	});
});

const STOCK_SHAPE = /export default grammar\(enrich\(base\), wire\(\{[\s\S]*\}\)\);\s*$/;
const GENERATED_SHAPE = /^import sittir from '\.\/grammar\.sittir\.ts';$[\s\S]*export default grammar\(\s*enrich\(sittir\),\s*wire\(\{[\s\S]*\}\)\s*\);\s*$/m;
const LAYER_HALVES = /\b(enrich|wire)\(/g;

function expectStockShape(source: string, shape: RegExp = STOCK_SHAPE): void {
	expect(source).toMatch(shape);
	expect(source.match(LAYER_HALVES)).toEqual(['enrich(', 'wire(']);
}

describe('the bootstrap template writes what the pipeline reads', () => {
	const file = (path: string) => python.find((f) => f.path === path)!.contents;

	it('writes base.ts importing the upstream through the dependency alias', () => {
		expect(file('base.ts')).toContain("import raw from 'tree-sitter-python/grammar.js';");
		expect(file('base.ts')).toContain('export default raw;');
	});

	it('imports base.ts from the grammar entry, not the upstream package', () => {
		expect(file('grammar.sittir.ts')).toContain("import base from './base.ts';");
		expect(file('grammar.sittir.ts')).not.toContain('tree-sitter-python/grammar.js');
	});

	it('declares an indent default that passes the check the emitter runs for space and tab indentation', () => {
		expect(file('grammar.sittir.ts')).toContain(`indent: preference(${JSON.stringify(BOOTSTRAP_INDENT_UNIT).replace(/"/g, "'")})`);
		expect(indentProblemOf([' ', '\t'], BOOTSTRAP_INDENT_UNIT, 'python')).toBeUndefined();
	});
});

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

describe('bootstrap formatting leaves the grammar entry in the stock shape', () => {
	it('a bootstrapped grammar.sittir.ts passes the stock shape after the formatting step', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-bootstrap-format-'));
		try {
			const written = python.map((file) => {
				const path = join(dir, file.path);
				mkdirSync(dirname(path), { recursive: true });
				writeFileSync(path, file.contents, 'utf8');
				return path;
			});
			execFileSync('pnpm', ['exec', 'oxfmt', ...formattablePaths(written, dir)], { cwd: REPO_ROOT });
			expectStockShape(readFileSync(join(dir, GRAMMAR_ENTRY), 'utf8'));
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	}, 60_000);
});

describe('a bootstrapped grammar hand-writes no rule', () => {
	it('the template grammar compiles the upstream rules as is, with the layout supertype minted by enrich', async () => {
		const files = grammarPackageFiles({
			name: 'regex',
			Name: 'Regex',
			upstreamDependency: 'tree-sitter-regex',
			upstreamRange: '^0.25.0'
		});
		const contentsOf = (path: string) => files.find((f) => f.path === path)!.contents;
		const source = contentsOf('grammar.sittir.ts').replace("'../codegen/src/dsl/index.ts'", JSON.stringify(resolve(__dirname, '../../codegen/src/dsl/index.ts')));
		const base = contentsOf('base.ts').replace("'tree-sitter-regex/grammar.js'", JSON.stringify(grammarRequire('regex').resolve('tree-sitter-regex/grammar.js')));
		const dir = mkdtempSync(join(tmpdir(), 'sittir-bootstrap-template-'));
		const entry = join(dir, 'grammar.sittir.ts');
		writeFileSync(entry, source, 'utf8');
		writeFileSync(join(dir, 'base.ts'), base, 'utf8');
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
