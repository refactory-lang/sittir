import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a query over a hoisted slot still walks the native tree, %s storage', (nodeStorage) => {
	it('yields the wrapper node a getter no longer returns', async () => {
		const e = await createEngine(python, { nodeStorage });
		const item = e.parse('def f(a, b):\n    pass\n').statements()[0]!;
		const slot = [...(e.query(item) as unknown as { readonly parameters: Iterable<{ readonly $type: number }> }).parameters];
		expect(slot.map((node) => node.$type)).toEqual([e.kinds.Parameters]);
		e[Symbol.dispose]();
	});
});
