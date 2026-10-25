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

it('compiles a claim on a kind the bindings mint as the kind it is minted from, keeping that kind\'s fields and leaving an unminted name unknown', async () => {
	expect(await compileQuery('python', '((method_declaration name: (identifier) @name) @declaration.constructor (#eq? @name "__init__"))')).toMatchObject({
		captureNames: ['name', 'declaration.constructor']
	});
	expect(await bindingIssues('python', '(decorated_definition_class_declaration definition: (method_declaration) @element)')).toEqual([]);
	expect(await bindingIssues('python', '(method_declaration superclasses: (_) @bases)')).toEqual([expect.objectContaining({ message: expect.stringContaining('superclasses') })]);
	expect(await bindingIssues('python', '(method_declarations) @declaration.method')).toEqual([expect.objectContaining({ message: 'unknown node method_declarations' })]);
}, 120000);
