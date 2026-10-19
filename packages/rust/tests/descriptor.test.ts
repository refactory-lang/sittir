import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portable } from '@sittir/common/portable';
import python from '@sittir/python';
import rust from '../src/index.ts';

const RUST_SOURCE = 'fn f() {}\n';
const PYTHON_SOURCE = 'def f():\n    pass\n';

function only<T>(items: Iterable<T>): T {
	const [item, ...rest] = [...items];
	if (item === undefined || rest.length > 0) throw new Error('expected exactly one match');
	return item;
}

describe('rust.is answers without an engine', () => {
	it('passes a function_item node read from a rust engine', async () => {
		const rs = await createEngine(rust);
		const item = only(rs.parse(RUST_SOURCE).$query().$descendants.ofType(rs.kinds.FunctionItem));
		expect(rust.is.functionItem(item)).toBe(true);
	});

	it('refuses a function node read from a python engine', async () => {
		const py = await createEngine(python);
		const item = only(py.parse(PYTHON_SOURCE).$query().$descendants.ofType(py.kinds.FunctionDefinition));
		expect(rust.is.functionItem(item)).toBe(false);
	});

	it('refuses a plain object carrying the kind when no engine is involved', () => {
		expect(rust.is.functionItem({ $type: rust.kinds.FunctionItem })).toBe(false);
	});

	it('refuses a bare kind id at a kind guard', () => {
		expect(rust.is.functionItem(rust.kinds.FunctionItem)).toBe(false);
	});

	it('passes a bare member id at a supertype guard, and refuses a non-member id', () => {
		expect(rust.is.declarationStatement(rust.kinds.FunctionItem)).toBe(true);
		expect(rust.is.declarationStatement(rust.kinds.Parameter)).toBe(false);
	});
});

describe('the rust descriptor shares is and kinds with its engines', () => {
	it('gives an engine the descriptor own is and kinds', async () => {
		const engine = await rust.createEngine();
		expect(engine.is).toBe(rust.is);
		expect(engine.kinds).toBe(rust.kinds);
	});

	it('binds a copied descriptor engine guards to the copy, as its node checks are', async () => {
		const copy = { ...rust };
		const engine = await createEngine(copy);
		const own = only(engine.parse(RUST_SOURCE).$query().$descendants.ofType(rust.kinds.FunctionItem));
		const original = only((await createEngine(rust)).parse(RUST_SOURCE).$query().$descendants.ofType(rust.kinds.FunctionItem));
		expect([engine.isNode(own), engine.is.functionItem(own)]).toEqual([true, true]);
		expect([engine.isNode(original), engine.is.functionItem(original)]).toEqual([false, false]);
		expect(engine.is).not.toBe(rust.is);
		expect(engine.is).toBe((await createEngine(copy)).is);
	});

	it('serves the shared portable kinds on the descriptor and on the portable engine', async () => {
		expect(rust.kinds.portable).toBe(portable.kinds);
		expect((await createEngine(rust, { api: 'portable' })).kinds).toBe(rust.kinds.portable);
	});
});
