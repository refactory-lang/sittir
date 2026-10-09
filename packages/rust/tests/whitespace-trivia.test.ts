import { describe, expect, it } from 'vitest';
import type { TransportCoordinate } from '@sittir/types';
import { createEngine } from '@sittir/common';
import { isCoordinate, readNode } from '../../common/src/read.ts';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const { Blankline: blankline, Newline: newline } = rs.kinds;

const statementsOf = (source: string, deep = false) => {
	const item = rs.parse(source, { depth: deep ? Infinity : 1 }).statements()[0];
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

	it('reads the trivia of an aliased node of a deep read', () => {
		const item = rs.parse('fn f(\n    x: Foo,\n) {}\n', { depth: Infinity }).statements()[0];
		if (item === undefined || !rs.is.functionItem(item)) throw new Error('expected a function item');
		const parameter = item.parameters().elements()?.items()[0]?.content();
		if (parameter === undefined || !rs.is.parameter(parameter)) throw new Error('expected a parameter');
		const type = parameter.type();
		if (typeof type === 'number' || type.$type !== rs.kinds.TypeIdentifier) throw new Error('expected a type identifier');
		expect(type.$trivia.leading()).toEqual([]);
	});

	it('finds every node of a deep read by its coordinate, a zero-width comment content included', () => {
		const source = '\n//!\n\n/*!*/\n\n//\n\n///\nlet x;\n';
		const { root, tree } = rs.diagnostics.parseAndRead(source, { depth: Infinity });
		const coordinates: TransportCoordinate[] = [];
		const visit = (value: unknown): void => {
			if (Array.isArray(value)) return value.forEach(visit);
			if (value === null || typeof value !== 'object') return;
			if (isCoordinate(value)) {
				coordinates.push(value);
				return;
			}
			const node = value as Record<string, unknown>;
			for (const key of Object.keys(node)) if (key.startsWith('_')) visit(node[key]);
			const layout = node.$_layout as { at?: TransportCoordinate; trivia?: { leading?: unknown[]; trailing?: unknown[] } } | undefined;
			if (layout?.at !== undefined) coordinates.push(layout.at);
			for (const entry of [...(layout?.trivia?.leading ?? []), ...(layout?.trivia?.trailing ?? [])]) {
				if (isCoordinate(entry)) visit(readNode(tree, entry, Infinity));
			}
		};
		visit(root);
		expect(coordinates.some(({ $span }) => $span.start === $span.end)).toBe(true);
		for (const { $treeHandle } of coordinates) expect(() => rs.diagnostics.lineGapsOf({ handle: $treeHandle })).not.toThrow();
	});
});
