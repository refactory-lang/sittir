import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a node compared with toEqual, in %s storage', (storage) => {
	const engine = createEngine(rust, { nodeStorage: storage });

	it('equals a copy of itself when it is a leaf a built list holds', async () => {
		const rs = await engine;
		const list = rs.build.tuplePattern(rs.build.identifier('x'), rs.build.identifier('y'));
		for (const item of list) expect({ ...(item as object) }).toEqual(item);
	});

	it('equals a copy of itself when it is a rebuild of a read node', async () => {
		const rs = await engine;
		const statement = rs.parse('fn f() {}\n').statements()[0]!;
		if (!rs.is.functionItem(statement)) throw new Error('not a function item');
		const rebuilt = statement.$with.name(rs.build.identifier('g'));
		expect({ ...rebuilt }).toEqual(rebuilt);
	});
});
