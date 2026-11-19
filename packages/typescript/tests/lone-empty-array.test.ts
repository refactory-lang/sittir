import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a lone empty array read as the empty list, %s storage', (nodeStorage) => {
	it('refuses an implements clause with no type at render', async () => {
		using ts = await createEngine(typescript, { nodeStorage });
		const empty = ts.build.implementsClause([] as never);
		expect(() => String(ts.render(empty))).toThrow(/holds no item/);
	});
});
