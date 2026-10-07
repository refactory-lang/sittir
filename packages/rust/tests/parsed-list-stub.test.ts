import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { hydrateStub, isStub } from '../../common/src/readUntypedNode.ts';
import { treeOf } from '../../common/src/tree-token.ts';
import rust from '../src/index.ts';

const rs = await createEngine(rust);

const shallowList = (engine = rs) => {
	const { root } = engine.diagnostics.parseAndRead('fn f(a: u8, b: u16) {}');
	const statement = Reflect.get(root, '_statements');
	if (!isStub(statement)) throw new Error('expected shallow statement stub');
	const tree = treeOf(statement);
	if (tree === undefined) throw new Error('expected reading tree');
	const item = hydrateStub(statement, tree, 1);
	if (Reflect.get(item, '$type') !== engine.kinds.FunctionItem) throw new Error('expected function item');
	const parameters = Reflect.get(item, '_parameters');
	if (!isStub(parameters)) throw new Error('expected parameters stub');
	const raw = hydrateStub(parameters, tree, 1);
	if (Reflect.get(raw, '$type') !== engine.kinds.Parameters) throw new Error('expected parameters');
	const list = Reflect.get(raw, '_elements');
	if (!isStub(list)) throw new Error('expected list stub');
	return list;
};

const buildParameters = (list: unknown, strict = true) => {
	const built: unknown = Reflect.apply(strict ? rs.build.parameters.strict : rs.build.parameters, undefined, [list]);
	if (typeof built !== 'object' || built === null || Reflect.get(built, '$type') !== rs.kinds.Parameters)
		throw new Error('expected built parameters');
	return built;
};

const rendered = (node: object) => String(Reflect.apply(Reflect.get(node, '$render'), node, []));

describe('builders consuming parsed list stubs', () => {
	it('strict construction retains both items and renders them', () => {
		const built = buildParameters(shallowList());
		expect(Reflect.get(built, 'length')).toBe(2);
		expect(rendered(built)).toBe('(a: u8, b: u16)');
		expect(isStub(Reflect.get(built, '_elements'))).toBe(false);
	});

	it('loose construction hydrates the same stored list', () => {
		const built = buildParameters(shallowList(), false);
		expect(Reflect.get(built, 'length')).toBe(2);
		expect(rendered(built)).toBe('(a: u8, b: u16)');
		expect(Reflect.get(built, 0)).toBeDefined();
		expect(Reflect.get(built, 1)).toBeDefined();
	});

	it('still refuses a stub that has lost its reading tree', () => {
		const list = shallowList();
		const detached = {
			$type: Reflect.get(list, '$type'),
			$parentHandle: list.$parentHandle,
			$childIndex: list.$childIndex
		};
		expect(() => Reflect.apply(rs.build.parameters.strict, undefined, [detached])).toThrow('read stub');
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

	it('refuses a stub after its reading engine is disposed', async () => {
		const reader = await createEngine(rust);
		const list = shallowList(reader);
		reader.dispose();
		expect(() => buildParameters(list)).toThrow('read stub');
	});
});
