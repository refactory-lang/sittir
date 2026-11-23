import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import language from '../src/index.ts';

const engines = {
	arena: await sharedEngine(() => createEngine(language, { api: 'strict', nodeStorage: 'arena' })),
	object: await sharedEngine(() => createEngine(language, { api: 'strict', nodeStorage: 'object' }))
};

describe.each(Object.entries(engines))('a provides directive in %s storage', (_, engine) => {
	it.each([
		['provides A with B;', ['B']],
		['provides A with B, C;', ['B', 'C']],
		['provides A with B, C, p.D;', ['B', 'C', 'p.D']]
	])('%s reads every provider', (directive, providers) => {
		const parsed = engine.parse(`module m { ${directive} }`);
		const node = [...parsed.$query().$descendants.ofType(engine.kinds.ProvidesModuleDirective)][0]! as unknown as {
			providers(): readonly unknown[];
		};
		expect(node.providers().map((item) => String(engine.render(item as never)).trim())).toEqual(providers);
	});
});
