import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a list builder under verifyStructure runtime, %s storage', (nodeStorage) => {
	it.each(['strict', 'default'] as const)('refuses an item of a foreign kind at construction, %s api', async (api) => {
		using engine = await createEngine(rust, { api, nodeStorage, verifyStructure: 'runtime' });
		const build = engine.build as unknown as Record<string, (...items: unknown[]) => unknown>;
		expect(() => build.parametersElements!(build.block!())).toThrow(/AttributedParameter\.content: a strict factory takes .*, not a node of kind \d+/);
	});

	it('still builds the items the slot admits', async () => {
		using engine = await createEngine(rust, { nodeStorage, verifyStructure: 'runtime' });
		const build = engine.build as unknown as Record<string, (...items: unknown[]) => { $render(): unknown }>;
		const fn = engine.parse('fn f(x: i32, y: u8) {}\n').statements()[0] as unknown as { parameters(): readonly unknown[] };
		expect(String(build.parametersElements!(...fn.parameters()).$render())).toBe('x: i32, y: u8');
	});
});
