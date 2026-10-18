import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { REPO_ROOT } from '@sittir/codegen/grammars';
import { codegenModuleFiles } from '../codegen-surface.ts';
import { fixtureInputs } from '../fixture-inputs.ts';

let root: string;

function write(rel: string, content: string): void {
	mkdirSync(dirname(join(root, rel)), { recursive: true });
	writeFileSync(join(root, rel), content);
}

const edit = (rel: string): void => write(rel, `${readFileSync(join(root, rel), 'utf8')}// edited\n`);

async function changedBy(change: () => void): Promise<string[]> {
	const before = await fixtureInputs(root, 'rust');
	change();
	const after = await fixtureInputs(root, 'rust');
	return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((rel) => before[rel] !== after[rel]).sort();
}

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'sittir-fixture-inputs-'));
	write('pnpm-lock.yaml', "lockfileVersion: '9.0'\n");
	write('packages/common/package.json', JSON.stringify({ name: '@sittir/common', exports: { './utils': { import: './dist/utils.js' } } }));
	write('packages/common/src/utils.ts', 'export const hydrate = 1;\n');
	write('packages/tools/src/post-generate.ts', "export async function emitParityFixtures() {\n\tconst { extract } = await import('./validate/parity-fixtures.ts');\n\treturn extract;\n}\n");
	write('packages/tools/src/validate/parity-fixtures.ts', "import { hydrate } from '@sittir/common/utils';\nexport const extract = hydrate;\n");
	write('packages/tools/src/unrelated.ts', 'export const unrelated = 1;\n');
	write('packages/codegen/src/emitters/render-module-paths.ts', 'export const paths = 1;\n');
	write('packages/codegen/fixtures/rust/upstream/expressions.txt', '===\nadd\n===\n1 + 2;\n');
	write('packages/codegen/fixtures/rust/local.txt', '===\nlocal\n===\nfn f() {}\n');
	write('packages/codegen/fixtures/python/local.txt', '===\nlocal\n===\npass\n');
	write('rust/crates/sittir-rust/test-fixtures.json', '[]\n');
	write('rust/crates/sittir-rust/test-fixtures.left-out.json', '{}\n');
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('what parity fixture extraction reads and writes', () => {
	for (const corpus of ['packages/codegen/fixtures/rust/upstream/expressions.txt', 'packages/codegen/fixtures/rust/local.txt']) {
		it(`changes when the corpus file ${corpus} is edited`, async () => {
			expect(await changedBy(() => edit(corpus))).toEqual([corpus]);
		});
	}

	it('changes when a corpus file is added', async () => {
		expect(await changedBy(() => write('packages/codegen/fixtures/rust/upstream/items.txt', '===\nitem\n===\nstruct S;\n'))).toEqual([
			'packages/codegen/fixtures/rust/upstream/items.txt'
		]);
	});

	for (const extractor of ['packages/tools/src/post-generate.ts', 'packages/tools/src/validate/parity-fixtures.ts', 'packages/common/src/utils.ts']) {
		it(`changes when ${extractor}, which extraction runs, is edited`, async () => {
			expect(await changedBy(() => edit(extractor))).toEqual([extractor]);
		});
	}

	it('changes when a codegen module the tools load through the codegen surface is edited', async () => {
		expect(await changedBy(() => edit('packages/codegen/src/emitters/render-module-paths.ts'))).toEqual(['packages/codegen/src/emitters/render-module-paths.ts']);
	});

	it('changes when the lockfile changes', async () => {
		expect(await changedBy(() => edit('pnpm-lock.yaml'))).toEqual(['pnpm-lock.yaml']);
	});

	it('changes when an extracted fixture file is edited or removed', async () => {
		expect(await changedBy(() => write('rust/crates/sittir-rust/test-fixtures.json', '[{}]\n'))).toEqual(['rust/crates/sittir-rust/test-fixtures.json']);
		expect(await changedBy(() => rmSync(join(root, 'rust/crates/sittir-rust/test-fixtures.left-out.json')))).toEqual([
			'rust/crates/sittir-rust/test-fixtures.left-out.json'
		]);
	});

	it('stays the same when a tools file extraction does not run is edited', async () => {
		expect(await changedBy(() => edit('packages/tools/src/unrelated.ts'))).toEqual([]);
	});

	it("stays the same when another grammar's corpus is edited", async () => {
		expect(await changedBy(() => edit('packages/codegen/fixtures/python/local.txt'))).toEqual([]);
	});
});

describe('the codegen modules the tools load by a computed specifier', () => {
	it('are every one of them in the fingerprint of this checkout', async () => {
		const modules = codegenModuleFiles().map((file) => relative(REPO_ROOT, file));
		expect(modules.length).toBeGreaterThan(0);
		const fingerprinted = Object.keys(await fixtureInputs(REPO_ROOT, 'rust'));
		expect(modules.filter((module) => !fingerprinted.includes(module))).toEqual([]);
	});
});
