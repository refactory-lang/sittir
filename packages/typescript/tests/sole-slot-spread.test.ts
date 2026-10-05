// A builder whose one real slot repeats takes its items positionally, and a
// preference the options block registers goes first, in a leading options
// object, as it does for a list builder.
import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

const declarator = (name: string, value: string) =>
	ts.build.variableDeclarator.plain.strict({ name: ts.build.identifier(name), value: ts.build.number(value) });

describe('variable_declaration takes its declarators positionally', () => {
	it('strict: items alone, then a leading options block', () => {
		expect(ts.build.variableDeclaration.strict(declarator('x', '1'), declarator('y', '2')).$render()).toBe('var x = 1, y = 2;');
		expect(ts.build.variableDeclaration.strict({ terminator: ts.kinds.AutomaticSemicolon }, declarator('x', '1')).$render()).toBe(
			'var x = 1\n'
		);
	});

	it('loose: items alone, then a leading options block', () => {
		expect(ts.build.variableDeclaration(declarator('x', '1')).$render()).toBe('var x = 1;');
		expect(ts.build.variableDeclaration({ terminator: ts.kinds.AutomaticSemicolon }, declarator('x', '1')).$render()).toBe('var x = 1\n');
	});

	it('setters and a loose rebuild keep the chosen terminator', () => {
		const built = ts.build.variableDeclaration.strict({ terminator: ts.kinds.AutomaticSemicolon }, declarator('x', '1'));
		expect(built.$with.declarators(declarator('z', '3')).$render()).toBe('var z = 3\n');
		expect(ts.build.variableDeclaration.strict(declarator('x', '1')).$with.terminator(ts.kinds.AutomaticSemicolon).$render()).toBe('var x = 1\n');
		expect(ts.build.variableDeclaration(built).$render()).toBe('var x = 1\n');
	});
});
