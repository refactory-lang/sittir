// A query started at a node below the root walks from that node's own
// coordinate: its matches hydrate through the tree's read and render as the
// nodes the accessors reach.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);

const SOURCE = 'fn outer() {\n    fn inner(a: u8, b: u16) {\n        let y = a;\n    }\n}\n';

function innerFunction() {
	const outer = rs.parse(SOURCE).statements()[0];
	if (outer === undefined || !rs.is.functionItem(outer)) throw new Error('expected the outer function');
	const inner = outer.body().statements()[0];
	if (inner === undefined || !rs.is.functionItem(inner)) throw new Error('expected the inner function');
	return inner;
}

/** Whether a value carries a key of the removed stub form at any depth. */
function holdsStubKey(value: unknown, seen = new Set<object>()): boolean {
	if (value === null || typeof value !== 'object' || seen.has(value)) return false;
	seen.add(value);
	if ('$parentHandle' in value || '$childIndex' in value) return true;
	return Object.values(value).some((child) => holdsStubKey(child, seen));
}

describe('a query from a deep node', () => {
	it('hydrates each match to render as the node its accessor reaches', () => {
		const inner = innerFunction();
		const parameters = [...inner.$query().$descendants.ofType(rs.kinds.Parameter)];
		expect(parameters.map((parameter) => parameter.$render().toString())).toEqual(
			[...inner.parameters()].map((parameter) => rs.render(parameter).toString())
		);
		const letDecl = inner.$query().$descendants.ofType(rs.kinds.LetDeclaration).find();
		const statement = inner.body().statements()[0];
		if (!rs.isNode(statement)) throw new Error('expected a statement node');
		expect(letDecl?.$render().toString()).toBe(statement.$render().toString());
	});

	it('hands JavaScript no stub', () => {
		const inner = innerFunction();
		for (const match of inner.$query().$descendants) expect(holdsStubKey(match)).toBe(false);
	});
});
