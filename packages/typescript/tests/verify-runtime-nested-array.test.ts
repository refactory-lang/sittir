import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a list given an array as one of its items, %s storage', (nodeStorage) => {
	it('refuses it under a strict api with verifyStructure runtime', async () => {
		using ts = await createEngine(typescript, { api: 'strict', nodeStorage, verifyStructure: 'runtime' });
		const build = ts.build as unknown as Record<string, (...items: unknown[]) => unknown>;
		const named = (build.existentialType as unknown);
		expect(() => build.implementsClause!(named, [named])).toThrow();
		expect(String((build.implementsClause!(named, named) as { $render(): unknown }).$render())).toBe('implements *, *');
	});

	it('refuses a lone empty array as an empty item list under verifyStructure runtime', async () => {
		using ts = await createEngine(typescript, { nodeStorage, verifyStructure: 'runtime' });
		const build = ts.build as unknown as Record<string, (...items: unknown[]) => unknown>;
		expect(() => build.implementsClause!([])).toThrow(/requires at least one element/);
	});
});
