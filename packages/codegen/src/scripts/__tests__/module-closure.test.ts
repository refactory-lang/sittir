import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { moduleClosure } from '../module-closure.ts';

let root: string;

function write(rel: string, content: string): void {
	mkdirSync(dirname(join(root, rel)), { recursive: true });
	writeFileSync(join(root, rel), content);
}

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'sittir-module-closure-'));
	write('packages/common/package.json', JSON.stringify({ name: '@sittir/common', exports: { '.': { import: './dist/index.js' }, './utils': './dist/utils.js' } }));
	write('packages/common/src/index.ts', "export { text } from './text.ts';\n");
	write('packages/common/src/text.ts', 'export const text = 1;\n');
	write('packages/common/src/utils.ts', 'export const utils = 1;\n');
	write('packages/common/src/shape.ts', 'export interface Shape {}\n');
	write('packages/types/package.json', JSON.stringify({ name: '@sittir/types', exports: { '.': { types: './src/index.ts', import: './src/index.ts' } } }));
	write('packages/types/src/index.ts', 'export const types = 1;\n');
	write('packages/codegen/package.json', JSON.stringify({ name: '@sittir/codegen', exports: { './grammars': { source: './src/grammars.ts', import: './dist/grammars.js' } } }));
	write('packages/codegen/src/grammars.ts', 'export const grammars = 1;\n');
	write('packages/rust/package.json', JSON.stringify({ name: '@sittir/rust', exports: { '.': './src/index.ts' } }));
	write('packages/rust/src/index.ts', 'export const generated = 1;\n');
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('the modules a file runs', () => {
	it('follows static imports through relative paths and workspace packages', () => {
		write('packages/tools/src/entry.ts', "import { text } from '@sittir/common';\nimport { grammars } from '@sittir/codegen/grammars';\nexport * from './local.ts';\n");
		write('packages/tools/src/local.ts', "import '@sittir/common/utils';\n");
		expect(moduleClosure(root, ['packages/tools/src/entry.ts'])).toEqual([
			'packages/codegen/src/grammars.ts',
			'packages/common/src/index.ts',
			'packages/common/src/text.ts',
			'packages/common/src/utils.ts',
			'packages/tools/src/entry.ts',
			'packages/tools/src/local.ts'
		]);
	});

	it('follows a dynamic import of a literal specifier', () => {
		write('packages/tools/src/entry.ts', "export async function run() {\n\tconst { extract } = await import('./extract.ts');\n\treturn import(\"@sittir/types\").then((m) => m.types + extract);\n}\n");
		write('packages/tools/src/extract.ts', 'export const extract = 1;\n');
		expect(moduleClosure(root, ['packages/tools/src/entry.ts'])).toEqual(['packages/tools/src/entry.ts', 'packages/tools/src/extract.ts', 'packages/types/src/index.ts']);
	});

	it('leaves out modules reached only through types', () => {
		write(
			'packages/tools/src/entry.ts',
			"import type { Shape } from '@sittir/common';\nexport type { Shape };\nexport type Loaded = typeof import('./loaded.ts');\nexport type Text = import('../../common/src/text.ts').Text;\nexport type All = typeof import('@sittir/types');\n"
		);
		write('packages/tools/src/loaded.ts', 'export const loaded = 1;\n');
		expect(moduleClosure(root, ['packages/tools/src/entry.ts'])).toEqual(['packages/tools/src/entry.ts']);
	});

	it('does not enter a generated grammar package', () => {
		write('packages/tools/src/entry.ts', "import { generated } from '@sittir/rust';\n");
		expect(moduleClosure(root, ['packages/tools/src/entry.ts'])).toEqual(['packages/tools/src/entry.ts']);
	});

	it('ignores import text inside a string', () => {
		write('packages/tools/src/entry.ts', "const emitted = \"import { text } from './text.ts';\";\n");
		expect(moduleClosure(root, ['packages/tools/src/entry.ts'])).toEqual(['packages/tools/src/entry.ts']);
	});
});
