import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a list whose items hold lists, nested deep, in %s storage', (storage) => {
	const engine = createEngine(rust, { nodeStorage: storage });

	it.each([300, 1000])('is read one level at a time at %i levels', async (depth) => {
		const rs = await engine;
		const statement = rs.parse(`type T = ${'('.repeat(depth)}u8${',)'.repeat(depth)};\n`, { depth: 1 }).statements()[0]!;
		if (!rs.is.typeItem(statement)) throw new Error('not a type item');
		let level = statement.value();
		for (let at = 1; at < depth; at++) {
			if (!rs.is.tupleType(level)) throw new Error(`level ${at} is not a tuple type`);
			expect(level.length).toBe(1);
			level = level[0] as typeof level;
		}
		expect(rs.render(level).toString()).toBe('(u8,)');
	});
});
