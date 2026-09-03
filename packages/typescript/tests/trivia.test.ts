import { describe, it, expect } from 'vitest';
import { ir } from '../src/index.js';

function makeFn(name: string) {
	return ir.declaration.function({
		name,
		parameters: ir.formalParameters.strict(),
		body: ir.statementBlock.strict()
	});
}

describe('$trivia() on the typescript surface', () => {
	it('takes a comment node or its verbatim text, leading and trailing', () => {
		const fn = makeFn('f');
		fn.$trivia({ leading: ['/** doc */', ir.comment('// second')], trailing: ['// tail'] });
		expect(fn.$render()).toBe('/** doc */\n// second\nfunction f(){}\n// tail\n');
	});

	it('leading rest arguments render before the node', () => {
		expect(makeFn('f').$trivia('// hi').$render()).toBe('// hi\nfunction f(){}');
	});

	it('a program root carries trivia like any node', () => {
		const program = ir.program({ statements: [makeFn('f')] }).$trivia('// top');
		expect(program.$render().startsWith('// top\n')).toBe(true);
	});

	it('$with carries trivia to the rebuilt node', () => {
		const fn = makeFn('f').$trivia('// kept');
		const renamed = fn.$with.name(ir.identifier.identifier('g'));
		expect(renamed.$render()).toBe('// kept\nfunction g(){}');
	});
});
