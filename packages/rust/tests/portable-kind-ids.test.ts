import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portable } from '@sittir/common/portable';
import python from '@sittir/python';
import rust from '../src/index.ts';

const engine = await createEngine(rust);
const is = rust.is.portable;
const K = rust.kinds;

describe('rust\'s portable guards read a kind id of rust', () => {
	it('classify a keyword leaf by its kind', () => {
		expect(is.type.primitive.boolean(K.BoolKeyword)).toBe(true);
		expect(is.type.primitive(K.BoolKeyword)).toBe(true);
		expect(is.type.primitive.integral.int8(K.U8Keyword)).toBe(true);
		expect(is.type.primitive.integral.int8(K.BoolKeyword)).toBe(false);
	});

	it('classify a keyword leaf by its fixed text', () => {
		expect(is.literal.boolean.true(K.TrueKeyword)).toBe(true);
		expect(is.literal.boolean.false(K.TrueKeyword)).toBe(false);
		expect(is.literal.boolean.false(K.FalseKeyword)).toBe(true);
		expect(is.identifier.receiver(K.Self)).toBe(true);
	});

	it('classify a kind id read from a parsed node', () => {
		const fn = engine.parse('fn f() -> bool { true }\n').statements()[0] as unknown as { returnType(): unknown };
		expect(typeof fn.returnType()).toBe('number');
		expect(is.type.primitive.boolean(fn.returnType() as never)).toBe(true);
	});

	it('still read a node of rust', () => {
		const item = engine.parse('fn f() {}').statements()[0]!;
		expect(is.declaration.function(item)).toBe(true);
	});

	it('refuse a node of another language', async () => {
		const def = (await createEngine(python)).parse('def f():\n    pass\n').statements()[0];
		expect(is.declaration.function(def as never)).toBe(false);
	});

	it('are a language view over the shared tree: the shared guards refuse a bare kind id', () => {
		expect(is).not.toBe(portable.is);
		expect(Object.keys(is)).toEqual(Object.keys(portable.is));
		expect(portable.is.type.primitive.boolean(K.BoolKeyword)).toBe(false);
	});

	it('serve the same view on every rust engine, and on the portable engine', async () => {
		expect(engine.is.portable).toBe(is);
		expect((await createEngine(rust, { api: 'portable' })).is).toBe(is);
	});

	it('find rust\'s rows from an engine of a copied descriptor, whose guards are a view of their own', async () => {
		const copy = { ...rust };
		const guards = (await createEngine(copy)).is.portable;
		expect(guards).not.toBe(is);
		expect(guards.type.primitive.boolean(K.BoolKeyword)).toBe(true);
	});
});
