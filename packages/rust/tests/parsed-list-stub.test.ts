import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import type { TransportCoordinate } from '@sittir/types';
import { isCoordinate } from '../../common/src/read.ts';
import rust from '../src/index.ts';

const rs = await createEngine(rust);

const shallowList = (engine = rs) => {
	const item = engine.parse('fn f(a: u8, b: u16) {}').statements()[0];
	if (item === undefined || !engine.is.functionItem(item)) throw new Error('expected function item');
	const list = item.parameters().elements();
	if (list === undefined) throw new Error('expected parameter list');
	const stored = (list as unknown as { readonly _item: readonly unknown[] })._item;
	if (!stored.every(isCoordinate)) throw new Error('expected item coordinates');
	return list;
};

const buildParameters = (list: unknown, strict = true) => {
	const built: unknown = Reflect.apply(strict ? rs.build.parameters.strict : rs.build.parameters, undefined, [list]);
	if (typeof built !== 'object' || built === null || Reflect.get(built, '$type') !== rs.kinds.Parameters)
		throw new Error('expected built parameters');
	return built;
};

const rendered = (node: object) => String(Reflect.apply(Reflect.get(node, '$render'), node, []));

describe('builders consuming parsed list coordinates', () => {
	it('strict construction retains both items and renders them', () => {
		const built = buildParameters(shallowList());
		expect(Reflect.get(built, 'length')).toBe(2);
		expect(rendered(built)).toBe('(a: u8, b: u16)');
		expect(isCoordinate(Reflect.get(built, '_elements'))).toBe(false);
	});

	it('loose construction hydrates the same stored list', () => {
		const built = buildParameters(shallowList(), false);
		expect(Reflect.get(built, 'length')).toBe(2);
		expect(rendered(built)).toBe('(a: u8, b: u16)');
		expect(Reflect.get(built, 0)).toBeDefined();
		expect(Reflect.get(built, 1)).toBeDefined();
	});

	it('still refuses item coordinates that have lost their reading tree', () => {
		const stored = (shallowList() as unknown as { readonly _item: readonly TransportCoordinate[] })._item;
		const detached = stored.map(({ $treeHandle, $span, $type }) => ({ $treeHandle, $span, $type }));
		expect(() => rendered(buildParameters(detached))).toThrow('does not hold that tree');
	});

	it('reads the source tree when another engine of the same language builds it', async () => {
		const reader = await createEngine(rust);
		try {
			const built = buildParameters(shallowList(reader));
			expect(Reflect.get(built, 'length')).toBe(2);
			expect(rendered(built)).toBe('(a: u8, b: u16)');
		} finally {
			reader.dispose();
		}
	});

	it('builds from a list whose reading engine is disposed, its items rendering from the tree they hold', async () => {
		const reader = await createEngine(rust);
		const list = shallowList(reader);
		reader.dispose();
		const built = buildParameters(list);
		expect(Reflect.get(built, 'length')).toBe(2);
		expect(rendered(built)).toBe('(a: u8, b: u16)');
	});
});
