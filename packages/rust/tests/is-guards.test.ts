import { describe, it, expect } from 'vitest';
import { createEngine } from '@sittir/common';
import { is } from '../src/is.ts';
import { isFactoryNode, isNode, isParsedNode } from '@sittir/common/utils';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const { kinds } = rs;

describe('rust kind guards', () => {
	it('the engine guards read the language of the node and the package guards read the kind id only', () => {
		const node = rs.parse('fn f() {}\n').statements()[0] as unknown as { readonly $type: number };
		expect(rs.is.kind(node as never, node.$type)).toBe(true);
		expect(rs.is.kind({ $type: node.$type } as never, node.$type)).toBe(false);
		expect(is.kind({ $type: node.$type }, node.$type)).toBe(true);
	});

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
		const edited = root.$with.statements([
			rs.build.functionItem({ name: 'g', parameters: rs.build.parameters(), body: rs.build.block() })
		]);
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
