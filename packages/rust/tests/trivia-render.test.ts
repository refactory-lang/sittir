import { describe, expect, it } from 'vitest';
import { ir } from '../src/ir.ts';

const statement = (name: string) => ir.expressionStatement(ir.identifier(name));

describe('built trivia layout', () => {
	it('closes an empty block right after its inner line comment', () => {
		expect(ir.block().$trivia.inner(ir.lineComment(' TODO')).$render()).toBe('{\n    // TODO\n}');
		const f = ir.functionItem({ name: 'f', parameters: ir.parameters(), body: ir.block().$trivia.inner(ir.lineComment(' TODO')) });
		expect(f.$render()).toBe('fn f() {\n    // TODO\n}');
	});

	it('joins inner entries outside a block body with no break after a block comment', () => {
		expect(ir.arguments().$trivia.inner(ir.blockComment(' a ')).$render()).toBe('(/* a */)');
		expect(ir.arguments().$trivia.inner(ir.lineComment(' a')).$render()).toBe('(// a\n)');
	});

	it('breaks once after an own-line trailing line comment', () => {
		const block = ir.block({ statements: [statement('a').$trivia.trailing(ir.lineComment(' x')), statement('b')] });
		expect(block.$render()).toBe('{\n    a;\n    // x\n    b;\n}');
	});

	it("writes an own-line trailing entry before the owner's separator, never in place of it", () => {
		const fn = (name: string) => ir.functionItem({ name, parameters: ir.parameters(), body: ir.block() });
		const trailing = (comment: unknown) => ir.sourceFile({ statements: [fn('g').$trivia.trailing(comment as never), fn('h')] });
		expect(trailing(ir.blockComment(' t ')).$render()).toBe('fn g() {}\n/* t */\n\nfn h() {}');
		expect(trailing(ir.lineComment(' t')).$render()).toBe('fn g() {}\n// t\n\nfn h() {}');
	});

	it('gives a blankline leading entry exactly one blank line', () => {
		const block = ir.block({ statements: [statement('a'), statement('b').$trivia.leading(ir.whitespace.blankline())] });
		expect(block.$render()).toBe('{\n    a;\n\n    b;\n}');
	});
});
