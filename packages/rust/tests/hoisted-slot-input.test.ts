import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a hoisted slot admits its items, its hoisted kind and its wrapper, %s storage', (nodeStorage) => {
	const open = async () => {
		const e = await createEngine(rust, { nodeStorage });
		return { e, [Symbol.dispose]: () => e[Symbol.dispose]() };
	};

	it('builds parameters from the items of the list, one or several', async () => {
		using opened = await open();
		const { e } = opened;
			const { build } = e;
			const param = (name: string) => build.parameter({ name, type: 'u8' });
			expect(String(e.render(build.statement.function({ name: 'f', parameters: [param('a')], body: {} })))).toBe('fn f(a: u8) {}');
			expect(String(e.render(build.statement.function({ name: 'f', parameters: [param('a'), param('b')], body: {} })))).toBe(
				'fn f(a: u8, b: u8) {}'
			);
	});

	it('admits the hoisted list node and the wrapper that holds it', async () => {
		using opened = await open();
		const { e } = opened;
			const { build } = e;
			const param = build.parameter({ name: 'a', type: 'u8' });
			const asList = build.statement.function({ name: 'f', parameters: build.parametersElements(param), body: {} });
			const asWrapper = build.statement.function({ name: 'f', parameters: build.parameters(param), body: {} });
			expect(String(e.render(asList))).toBe('fn f(a: u8) {}');
			expect(String(e.render(asWrapper))).toBe('fn f(a: u8) {}');
	});

	it('admits the wrapper of a slot that holds one node, and the hoisted kind', async () => {
		using opened = await open();
		const { e } = opened;
			const { build } = e;
			expect(String(e.render(build.statement.function({ visibilityModifier: build.visibilityModifier.pub(), name: 'f', parameters: [], body: {} })))).toBe(
				'pub fn f() {}'
			);
			expect(String(e.render(build.statement.function({ visibilityModifier: build.crateVisibilityModifier, name: 'f', parameters: [], body: {} })))).toBe(
				'crate fn f() {}'
			);
	});

	it('refuses a node of an unrelated kind', async () => {
		using opened = await open();
		const { e } = opened;
			const { build } = e;
			// @ts-expect-error a block is neither the parameters, their list nor an item of it
			build.statement.function({ name: 'f', parameters: build.block(), body: {} });
			// @ts-expect-error a block is not a visibility modifier
			build.statement.function({ visibilityModifier: build.block(), name: 'f', parameters: [], body: {} });
	});
});
