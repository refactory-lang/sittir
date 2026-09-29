import { describe, it, expect } from 'vitest';
import { createEngine } from '@sittir/common';
import { isFactoryNode, isNode, isParsedNode } from '@sittir/common/utils';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const { is, kinds } = rs;

describe('rust kind guards', () => {
	it('a kind guard matches its own numeric kind only', () => {
		expect(is.functionItem({ $type: kinds.FunctionItem })).toBe(true);
		expect(is.functionItem({ $type: kinds.Block })).toBe(false);
		expect(is.functionItem({ $type: 'function_item' } as never)).toBe(false);
	});

	it('is.kind compares against the kind it is given', () => {
		expect(is.kind({ $type: kinds.FunctionItem }, kinds.FunctionItem)).toBe(true);
		expect(is.kind({ $type: kinds.Block }, kinds.FunctionItem)).toBe(false);
	});

	it('a supertype guard matches its members', () => {
		expect(is.expression({ $type: kinds.BinaryExpression })).toBe(true);
		expect(is.expression({ $type: kinds.FunctionItem })).toBe(false);
		expect(is.expression({ $type: 'binary_expression' } as never)).toBe(false);
	});
});

describe('rust node provenance', () => {
	it('a built node is a factory node', () => {
		const built = rs.build.identifier('x');
		expect(isNode(built)).toBe(true);
		expect(isFactoryNode(built)).toBe(true);
		expect(isParsedNode(built)).toBe(false);
	});

	it('a parsed node stays parsed through an edit', () => {
		const root = rs.parse('fn f() {}\n');
		expect(isParsedNode(root)).toBe(true);
		const edited = root.$with.statements(
			rs.build.functionItem({ name: 'g', parameters: rs.build.parameters(), body: rs.build.block() })
		);
		expect(isParsedNode(edited)).toBe(true);
		expect(isFactoryNode(edited)).toBe(false);
	});

	it('raw read data is parsed before it is wrapped', async () => {
		const native = (await rust.load()).createNative();
		const { root } = native.parseAndRead('fn f() {}\n');
		expect(isParsedNode(root)).toBe(true);
		native.dispose();
	});

	it('a config bag is not a node', () => {
		expect(isNode({ $type: kinds.FunctionItem })).toBe(false);
		expect(isFactoryNode({ $type: kinds.FunctionItem })).toBe(false);
	});
});
