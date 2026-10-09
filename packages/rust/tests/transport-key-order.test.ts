// A read transport crosses with its present slots in the model's slot order,
// whichever of them are optional, and with no key for an absent one.
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const native = createRequire(import.meta.url)('../native/index.cjs') as {
	SittirEngine: new () => { parse(source: string): string; read(treeId: number, index: number, depth?: number): object };
	disposeTree(treeId: number): void;
};
const engine = new native.SittirEngine();

function firstStatement(source: string): object {
	const { treeId } = JSON.parse(engine.parse(source)) as { treeId: number };
	try {
		return (engine.read(treeId, 0, Infinity) as { _statements: object[] })._statements[0]!;
	} finally {
		native.disposeTree(treeId);
	}
}

describe('a read transport', () => {
	it('writes a present optional slot between required ones, in slot order', () => {
		expect(Object.keys(firstStatement('fn f() -> u8 {}'))).toEqual(['$type', '$_layout', '_name', '_parameters', '_return_type', '_body']);
	});

	it('writes every slot it holds in the order the model declares them', () => {
		expect(Object.keys(firstStatement('struct S<T> where T: X { a: T }'))).toEqual([
			'$type',
			'$_layout',
			'_name',
			'_type_parameters',
			'_where_clause',
			'_body'
		]);
	});
});
