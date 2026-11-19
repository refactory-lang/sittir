import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a hoisted list slot rebuilt from its own items under verifyStructure runtime, %s storage', (nodeStorage) => {
	it.each([
		['CaseListPattern', 'elements', 'match x:\n    case [a, b]:\n        pass\n', '[a, b]'],
		['CaseTuplePattern', 'elements', 'match x:\n    case (a, b):\n        pass\n', '(a, b)'],
		['TypeParameter', 'types', 'x: dict[float, int] = {}\n', 'float, int']
	])('rebuilds %s through $with.%s without wrapping a wrapper twice', async (kindName, setter, source, text) => {
		using engine = await createEngine(python, { nodeStorage, verifyStructure: 'runtime' });
		const kinds = engine.kinds as unknown as Record<string, number>;
		const root: any = engine.parse(source);
		const holder: any = [...root.$query().$descendants].find((node: any) => node?.$type === kinds[kindName] && node?.$with?.[setter]);
		expect(holder, `a ${kindName} in the source`).toBeDefined();
		expect(String(holder.$with[setter](...holder[setter]()).$render())).toContain(text);
	});
});
