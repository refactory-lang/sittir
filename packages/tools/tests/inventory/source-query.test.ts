import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { grammarPackageDir } from '@sittir/codegen/grammars';
import { compileQuery, bindingIssues } from '../../src/inventory/bindings.ts';
import { loadWebTreeSitter } from '../../src/validate/common.ts';

it('validates authored fields before the bindings rename them', async () => {
	const { Language } = await loadWebTreeSitter();
	const { Query } = await import('web-tree-sitter');
	const boundPath = join(grammarPackageDir('python'), '.sittir/parser.wasm');
	const before = readFileSync(boundPath);
	const bound = await Language.load(boundPath);
	const source = '(conditional_expression body: (_) @consequence) @expression.conditional';
	expect(() => new Query(bound, source)).toThrow();
	expect(await compileQuery('python', source)).toMatchObject({
		captureNames: ['consequence', 'expression.conditional']
	});
	expect(readFileSync(boundPath)).toEqual(before);
}, 120000);

it('still rejects a field that exists only after bindings have run', async () => {
	expect(await bindingIssues('python', '(conditional_expression consequence: (_) @value)')).toEqual([
		expect.objectContaining({ message: expect.stringContaining('consequence') })
	]);
}, 120000);

it('compiles the complete authored Python query against its source parser', async () => {
	const source = readFileSync(join(grammarPackageDir('python'), 'bindings.scm'), 'utf8');
	expect((await compileQuery('python', source)).patterns).toBeGreaterThan(0);
}, 120000);
