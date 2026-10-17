import { describe, expect, it } from 'vitest';
import type { NodeCoordinate } from '@sittir/types';
import { createEngine } from '@sittir/common';
import { decodeIndex, isCoordinate, readNode, type TreeHandle } from '../../common/src/read.ts';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const { Blankline: blankline, Newline: newline, Space: space } = rs.kinds;

const statementsOf = (source: string, deep = false) => {
	const item = rs.parse(source, { depth: deep ? Infinity : 1 }).statements()[0];
	if (item === undefined || !rs.is.functionItem(item)) throw new Error('expected a function item');
	return [...item.body().statements()].filter((statement) => rs.is.expressionStatement(statement));
};

describe('a read node carries the whitespace before it that differs from the read-time options as whitespace trivia', () => {
	it('holds the blank line between two statements, where the options write one break, and nothing for the break they write', () => {
		const [a, b] = statementsOf('fn f() {\n    a;\n\n    b;\n}\n');
		expect(a!.$trivia.leading()).toEqual([]);
		expect(b!.$trivia.leading()).toEqual([blankline]);
	});

	it('gives the last statement nothing for the line break the options write before the closing brace', () => {
		const [, b] = statementsOf('fn f() {\n    a;\n\n    b;\n}\n');
		expect(b!.$trivia.trailing()).toEqual([]);
	});

	it('puts the blank line before a comment it owns in source order, and nothing for the break the line comment ends with', () => {
		const [, b] = statementsOf('fn f() {\n    a;\n\n    // note\n    b;\n}\n');
		const leading = b!.$trivia.leading();
		expect(leading.map((entry: unknown) => (typeof entry === 'number' ? entry : 'comment'))).toEqual([blankline, 'comment']);
	});

	it('gives a node that starts where its parent starts nothing', () => {
		const [a] = statementsOf('fn f() {\n    a;\n}\n');
		const expression = a!.content();
		expect(typeof expression === 'object' ? expression.$trivia.leading() : []).toEqual([]);
	});

	it('yields the space of a gap on one line where the options break the line', () => {
		const [, b] = statementsOf('fn f() { a; b; }\n');
		expect(b!.$trivia.leading()).toEqual([space]);
	});

	it('reads the same from a tree read whole as from one read a level at a time', () => {
		const [a, b] = statementsOf('fn f() {\n    a;\n\n    b;\n}\n', true);
		expect(a!.$trivia.leading()).toEqual([]);
		expect(b!.$trivia.leading()).toEqual([blankline]);
		expect(b!.$trivia.trailing()).toEqual([]);
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
		expect(b!.$trivia.trailing()).toEqual([]);
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
		const { root, tree: read } = rs.diagnostics.parseAndRead(source, { depth: Infinity });
		const tree: TreeHandle = read;
		const coordinates: NodeCoordinate[] = [];
		const visit = (value: unknown): void => {
			if (Array.isArray(value)) return value.forEach(visit);
			if (value === null || typeof value !== 'object') return;
			if (isCoordinate(value)) {
				coordinates.push(value);
				return;
			}
			const node = value as Record<string, unknown>;
			for (const key of Object.keys(node)) if (key.startsWith('_')) visit(node[key]);
			const at = (node.$_layout as { at?: NodeCoordinate } | undefined)?.at;
			if (at === undefined) return;
			coordinates.push(at);
			for (const side of ['leading', 'trailing'] as const) {
				for (const entry of tree.triviaSide?.(decodeIndex(at.$treeHandle), side) ?? []) if (isCoordinate(entry)) visit(readNode(tree, entry, Infinity));
			}
		};
		visit(root);
		expect(coordinates.some(({ $span }) => $span.start === $span.end)).toBe(true);
		for (const { $treeHandle } of coordinates) expect(() => tree.siblings?.(decodeIndex($treeHandle))).not.toThrow();
	});
});
