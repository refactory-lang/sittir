import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

describe.each(['arena', 'object'] as const)('an empty hoisted list reads as the empty list, an absent wrapper as undefined, %s storage', (nodeStorage) => {
	const open = async () => {
		const e = await createEngine(python, { nodeStorage });
		return { e, [Symbol.dispose]: () => e[Symbol.dispose]() };
	};

	it('reads a parsed `()` as the empty list and an absent type parameter list as undefined', async () => {
		using opened = await open();
		const { e } = opened;
		const fn = e.parse('def f():\n    pass\n').statements()[0];
		if (fn === undefined || !e.is.functionDefinition(fn)) throw new Error('expected a function');
		expect(fn.parameters()).toEqual([]);
		expect(fn.typeParameters()).toBeUndefined();
	});

	it('reads a built function the same', async () => {
		using opened = await open();
		const { build } = opened.e;
		const fn = build.functionDefinition({ name: 'f', parameters: [], body: build.suiteBlock(build.passStatement) });
		expect(fn.parameters()).toEqual([]);
		expect(fn.typeParameters()).toBeUndefined();
	});
});
