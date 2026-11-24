import { describe, expect, it } from 'vitest';
import rust from '@sittir/rust';
import { createEngine } from '@sittir/common';
import { decodeIndex, decodeTree, isCoordinate, readNode } from '../src/read.ts';

const rs = await createEngine(rust, { nodeStorage: 'object' });

describe('the JavaScript read', () => {
	it('reads a coordinate past the depth into the node it names', () => {
		const { root, tree } = rs.diagnostics.parseAndRead('fn f(a: u8) {}');
		const statements = (root as unknown as { _statements: unknown[] })._statements;
		expect(statements.every(isCoordinate)).toBe(true);
		const coordinate = statements[0];
		if (!isCoordinate(coordinate)) throw new Error('expected a coordinate');

		const item = readNode(tree, coordinate) as { $type: number; $_layout: { at: { $span: unknown } } };
		expect(item.$type).toBe(rs.kinds.FunctionItem);
		expect(item.$_layout.at.$span).toEqual(coordinate.$span);
	});

	it('refuses a coordinate from another tree instead of reading the node at its index there', () => {
		const first = rs.diagnostics.parseAndRead('fn f(a: u8) {}');
		const second = rs.diagnostics.parseAndRead('fn g() {}');
		const [coordinate] = (first.root as unknown as { _statements: unknown[] })._statements;
		if (!isCoordinate(coordinate)) throw new Error('expected a coordinate');

		expect(() => readNode(second.tree, coordinate)).toThrow(/another tree/);
		expect(readNode(first.tree, coordinate)).toMatchObject({ $type: rs.kinds.FunctionItem });
	});

	it('decodes a handle into the tree above 32 bits and the descendant index below them', () => {
		const handle = 5 * 2 ** 32 + 17;
		expect([decodeTree(handle), decodeIndex(handle)]).toEqual([5, 17]);
	});

	it('asks a value that is no coordinate one property question', () => {
		const asked: PropertyKey[] = [];
		const node = new Proxy({ $type: 1, $_layout: {} }, { has: (target, key) => (asked.push(key), Reflect.has(target, key)) });
		expect(isCoordinate(node)).toBe(false);
		expect(asked).toHaveLength(1);
		expect([isCoordinate({ $treeHandle: 1, $span: {} }), isCoordinate({ $node: 1, $span: {} }), isCoordinate({ $treeHandle: 1 }), isCoordinate({ $span: {} })]).toEqual([true, true, false, false]);
	});

	it('takes a node for no coordinate: its own coordinate is nested in its layout', () => {
		const { root } = rs.diagnostics.parseAndRead('fn f() {}');
		expect(isCoordinate(root)).toBe(false);
		expect(isCoordinate((root as unknown as { $_layout: { at: unknown } }).$_layout.at)).toBe(true);
	});
});
