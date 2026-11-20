import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a list rebuilt from its own items under verifyStructure runtime, %s storage', (nodeStorage) => {
	it.each([
		['TypeParametersElements', 'function f<T, U extends V>() {}\n', 'T, U extends V'],
		['ExportSpecifiers', 'export type { UserType };\n', 'UserType']
	])('rebuilds %s as it does without the check', async (kindName, source, text) => {
		using engine = await createEngine(typescript, { nodeStorage, verifyStructure: 'runtime' });
		const kinds = engine.kinds as unknown as Record<string, number>;
		const root: any = engine.parse(source);
		const list: any = [...root.$query().$descendants].find((node: any) => node?.$type === kinds[kindName] && node?.$with?.items);
		expect(list, `a ${kindName} in the source`).toBeDefined();
		expect(String(list.$with.items(...list).$render())).toContain(text);
	});
});
