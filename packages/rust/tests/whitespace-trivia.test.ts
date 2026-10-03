import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const { Blankline: blankline, Newline: newline } = rs.kinds;

const statementsOf = (source: string, deep = false) => {
	const item = rs.parse(source, { deep }).statements()[0];
	if (item === undefined || !rs.is.functionItem(item)) throw new Error('expected a function item');
	return [...item.body().statements()].filter((statement) => rs.is.expressionStatement(statement));
};

describe('a read node carries the line breaks before it as whitespace trivia', () => {
	it('holds the blank line between two statements', () => {
		const [a, b] = statementsOf('fn f() {\n    a;\n\n    b;\n}\n');
		expect(a!.$trivia.leading()).toEqual([newline]);
		expect(b!.$trivia.leading()).toEqual([blankline]);
	});

	it('gives the last statement the line break before the closing brace', () => {
		const [, b] = statementsOf('fn f() {\n    a;\n\n    b;\n}\n');
		expect(b!.$trivia.trailing()).toEqual([newline]);
	});

	it('puts the line breaks around a comment it owns in source order', () => {
		const [, b] = statementsOf('fn f() {\n    a;\n\n    // note\n    b;\n}\n');
		const leading = b!.$trivia.leading();
		expect(leading.map((entry: unknown) => (typeof entry === 'number' ? entry : 'comment'))).toEqual([blankline, 'comment', newline]);
	});

	it('gives a node that starts where its parent starts nothing', () => {
		const [a] = statementsOf('fn f() {\n    a;\n}\n');
		const expression = a!.content();
		expect(typeof expression === 'object' ? expression.$trivia.leading() : []).toEqual([]);
	});

	it('yields nothing for a gap of spaces on one line', () => {
		const [, b] = statementsOf('fn f() { a; b; }\n');
		expect(b!.$trivia.leading()).toEqual([]);
	});

	it('reads the same from a tree read whole as from one read a level at a time', () => {
		const [a, b] = statementsOf('fn f() {\n    a;\n\n    b;\n}\n', true);
		expect(a!.$trivia.leading()).toEqual([newline]);
		expect(b!.$trivia.leading()).toEqual([blankline]);
		expect(b!.$trivia.trailing()).toEqual([newline]);
	});

	it('renders an untouched statement with its source gap when its parent is rebuilt', () => {
		const source = 'fn f() {\n    a;\n\n    b;\n}\n\n\nfn g() {}\n';
		const root = rs.parse(source);
		const [f, g] = [...root.statements()];
		if (f === undefined || g === undefined) throw new Error('expected two function items');
		expect(root.$with.statements(f, g).$render()).toBe(source);
	});

	it('keeps what was written over what was read', () => {
		const [, b] = statementsOf('fn f() {\n    a;\n\n    b;\n}\n');
		b!.$trivia.leading(newline);
		expect(b!.$trivia.leading()).toEqual([newline]);
		expect(b!.$trivia.trailing()).toEqual([newline]);
	});
});
