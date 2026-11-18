import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a hoisted slot refuses a node of a foreign kind at its setter, %s storage', (nodeStorage) => {
	it('refuses the value of a hoisted slot, a list slot and the items of a list', async () => {
		using rs = await createEngine(rust, { nodeStorage, verifyStructure: 'runtime' });
		const fn = rs.parse('pub fn g(a: u8) {}\n').statements()[0] as unknown as { readonly $with: Record<string, (...values: unknown[]) => unknown> };
		const block = rs.build.block();
		expect(() => fn.$with.visibilityModifier!(block)).toThrow(/not a node of kind/);
		expect(() => fn.$with.parameters!(block)).toThrow(/not a node of kind/);
		expect(() => fn.$with.name!(block)).toThrow(/not a node of kind/);
		expect(() => rs.build.functionItem({ name: 'f', visibilityModifier: block as never, body: rs.build.block() })).toThrow(/not a node of kind/);
		expect(() => rs.build.functionItem({ name: 'f', parameters: block as never, body: rs.build.block() })).toThrow(/not a node of kind/);
	});
});
