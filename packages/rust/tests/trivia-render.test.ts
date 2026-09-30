import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

const statement = (name: string) => rs.build.expressionStatement(rs.build.identifier(name));

describe('built trivia layout', () => {
	it('closes an empty block right after its inner line comment', () => {
		expect(rs.build.block().$trivia.inner(rs.build.lineComment(' TODO')).$render()).toBe('{\n    // TODO\n}');
		const f = rs.build.functionItem({ name: 'f', parameters: rs.build.parameters(), body: rs.build.block().$trivia.inner(rs.build.lineComment(' TODO')) });
		expect(f.$render()).toBe('fn f() {\n    // TODO\n}');
	});

	it('joins inner entries outside a block body with no break after a block comment', () => {
		expect(rs.build.arguments().$trivia.inner(rs.build.blockComment(' a ')).$render()).toBe('(/* a */)');
		expect(rs.build.arguments().$trivia.inner(rs.build.lineComment(' a')).$render()).toBe('(// a\n)');
	});

	it('breaks once after an own-line trailing line comment', () => {
		const block = rs.build.block({ statements: [statement('a').$trivia.trailing(rs.build.lineComment(' x')), statement('b')] });
		expect(block.$render()).toBe('{\n    a;\n    // x\n    b;\n}');
	});

	it("writes an own-line trailing entry before the owner's separator, never in place of it", () => {
		const fn = (name: string) => rs.build.functionItem({ name, parameters: rs.build.parameters(), body: rs.build.block() });
		const trailing = (comment: unknown) => rs.build.sourceFile({ statements: [fn('g').$trivia.trailing(comment as never), fn('h')] });
		expect(trailing(rs.build.blockComment(' t ')).$render()).toBe('fn g() {}\n/* t */\n\nfn h() {}\n');
		expect(trailing(rs.build.lineComment(' t')).$render()).toBe('fn g() {}\n// t\n\nfn h() {}\n');
	});

	it('gives a blankline leading entry exactly one blank line', () => {
		const block = rs.build.block({ statements: [statement('a'), statement('b').$trivia.leading(rs.build.whitespace.blankline)] });
		expect(block.$render()).toBe('{\n    a;\n\n    b;\n}');
	});
});
