import { describe, it, expect } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

function makeFn(name: string) {
	return ts.build.declaration.function({
		name,
		parameters: ts.build.formalParameters.strict(),
		body: ts.build.statementBlock.strict()
	});
}

describe('$trivia() on the typescript surface', () => {
	it('takes comment builders, and reads loose text as a line comment, leading and trailing', () => {
		const fn = makeFn('f');
		fn.$trivia({ leading: [ts.build.comment.block('* doc '), ts.build.comment.line(' second')], trailing: ['// tail'] });
		expect(fn.$render()).toBe('/** doc */\n// second\nfunction f() {}\n// tail\n');
	});

	it("writes an own-line trailing entry before the owner's separator, never in place of it", () => {
		const statement = (name: string) => ts.build.expressionStatement(ts.build.identifier(name));
		const trailing = (comment: unknown) => ts.build.program({ statements: [statement('a').$trivia.trailing(comment as never), statement('b')] });
		expect(trailing(ts.build.comment.block(' c ')).$render()).toBe('a;\n/* c */\n\nb;\n');
		expect(trailing(ts.build.comment.line(' c')).$render()).toBe('a;\n// c\n\nb;\n');
	});

	it('reads a loose block spelling as line-comment text, never as a block comment', () => {
		expect(makeFn('f').$trivia('/* x */').$render()).toBe('///* x */\nfunction f() {}');
	});

	it('leading rest arguments render before the node', () => {
		expect(makeFn('f').$trivia('// hi').$render()).toBe('// hi\nfunction f() {}');
	});

	it('a program root carries trivia like any node', () => {
		const program = ts.build.program({ statements: [makeFn('f')] }).$trivia('// top');
		expect(program.$render().startsWith('// top\n')).toBe(true);
	});

	it('$with carries trivia to the rebuilt node', () => {
		const fn = makeFn('f').$trivia('// kept');
		const renamed = fn.$with.name(ts.build.identifier('g'));
		expect(renamed.$render()).toBe('// kept\nfunction g() {}');
	});
});
