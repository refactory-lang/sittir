import { describe, expect, it } from 'vitest';
import typescript from '@sittir/typescript';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

/** The body of the first statement of `source`, a function declaration. */
function bodyOf(source: string) {
	const root = ts.parse(source);
	const fn = root.statements()[0];
	if (fn === undefined || !ts.is.functionDeclaration(fn)) throw new Error('expected a function declaration');
	return { root, body: fn.body() };
}

describe('a node is empty when it has no child with width', () => {
	it("counts a parsed block's zero-width automatic semicolon as no child, so the block takes inner", () => {
		const { root, body } = bodyOf('function f() {\n}\n');
		expect(ts.isEmptyNode(body)).toBe(true);
		if (!ts.isEmptyNode(body)) return;
		body.$trivia.inner(ts.build.comment(' c'));
		expect(root.$render()).toBe('function f() {\n  // c\n}\n');
	});

	it('counts a unit-stored child with text, so a block holding a real `;` is not empty', () => {
		const { body } = bodyOf('function f() {\n  ;\n}\n');
		expect(ts.isEmptyNode(body)).toBe(false);
	});

	it("counts a built block's terminator, which renders text", () => {
		expect(ts.isEmptyNode(ts.build.statementBlock())).toBe(true);
		expect(ts.isEmptyNode(ts.build.statementBlock({ terminator: ts.kinds.AutomaticSemicolon } as never))).toBe(false);
	});
});
