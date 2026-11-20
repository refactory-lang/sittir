import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a scalar slot under verifyStructure runtime keeps its stored kind, %s storage', (nodeStorage) => {
	it('refuses a node of the wrapper content kind where the slot holds the wrapper', async () => {
		using engine = await createEngine(python, { api: 'strict', nodeStorage, verifyStructure: 'runtime' });
		const build = engine.build as unknown as Record<string, (config: unknown) => unknown>;
		const identifier = (engine.build as unknown as Record<string, (text: string) => unknown>).identifier!;
		expect(() => build.aliasedImport!({ name: identifier('x'), rename: identifier('y') })).toThrow(/AliasedImport\.name/);
	});
});
