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
	it('takes comment builders, and reads loose text as a line comment, leading and trailing', () => {
		const fn = makeFn('f');
		fn.$trivia({ leading: [ir.comment.block('* doc '), ir.comment.line(' second')], trailing: ['// tail'] });
		expect(fn.$render()).toBe('/** doc */\n// second\nfunction f() {}\n// tail\n');
	});

	it("writes an own-line trailing entry before the owner's separator, never in place of it", () => {
		const statement = (name: string) => ir.expressionStatement(ir.identifier(name));
		const trailing = (comment: unknown) => ir.program({ statements: [statement('a').$trivia.trailing(comment as never), statement('b')] });
		expect(trailing(ir.comment.block(' c ')).$render()).toBe('a;\n/* c */\n\nb;');
		expect(trailing(ir.comment.line(' c')).$render()).toBe('a;\n// c\n\nb;');
	});

	it('reads a loose block spelling as line-comment text, never as a block comment', () => {
		expect(makeFn('f').$trivia('/* x */').$render()).toBe('///* x */\nfunction f() {}');
	});

	it('leading rest arguments render before the node', () => {
		expect(makeFn('f').$trivia('// hi').$render()).toBe('// hi\nfunction f() {}');
	});

	it('a program root carries trivia like any node', () => {
		const program = ir.program({ statements: [makeFn('f')] }).$trivia('// top');
		expect(program.$render().startsWith('// top\n')).toBe(true);
	});

	it('$with carries trivia to the rebuilt node', () => {
		const fn = makeFn('f').$trivia('// kept');
		const renamed = fn.$with.name(ir.identifier.identifier('g'));
		expect(renamed.$render()).toBe('// kept\nfunction g() {}');
	});
});
