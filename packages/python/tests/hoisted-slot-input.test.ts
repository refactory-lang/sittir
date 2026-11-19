import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a hoisted slot admits its items and its wrapper, %s storage', (nodeStorage) => {
	const open = async () => {
		const e = await createEngine(python, { nodeStorage });
		return { e, [Symbol.dispose]: () => e[Symbol.dispose]() };
	};

	it('builds parameters from their items', async () => {
		using opened = await open();
		const { e } = opened;
		const { build } = e;
		const fn = build.functionDefinition({ name: 'f', parameters: [build.identifier('a'), build.identifier('b')], body: build.suiteBlock(build.passStatement) });
		expect(String(e.render(fn))).toBe('def f(a, b):\n    pass\n');
	});

	it('admits the wrapper that holds the items', async () => {
		using opened = await open();
		const { e } = opened;
		const { build } = e;
		const fn = build.functionDefinition({ name: 'f', parameters: build.parameters(build.identifier('a')), body: build.suiteBlock(build.passStatement) });
		expect(String(e.render(fn))).toBe('def f(a):\n    pass\n');
	});

	it('refuses a node of an unrelated kind', async () => {
		using opened = await open();
		const { build } = opened.e;
		// @ts-expect-error a suite is not a parameter or the parameters
		build.functionDefinition({ name: 'f', parameters: build.suiteBlock(build.passStatement), body: build.suiteBlock(build.passStatement) });
	});
});
