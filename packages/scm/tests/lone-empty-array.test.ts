import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import scm from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a lone empty array read as the empty list, %s storage', (nodeStorage) => {
	it('refuses a predicate parameter list with no element at render', async () => {
		using engine = await createEngine(scm, { nodeStorage });
		const empty = engine.build.parameters([] as never);
		expect(() => String(engine.render(empty))).toThrow(/holds no item/);
	});
});
