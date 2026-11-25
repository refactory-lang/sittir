import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe.each(['object', 'arena'] as const)('a bare quote in a token tree (%s storage)', (nodeStorage) => {
	it('is written tight by a built node', async () => {
		using rs = await createEngine(rust, { nodeStorage });
		const tree = rs.build.tokenTreeParen(rs.kinds.Squote, rs.build.identifier('lifetime'));
		expect(tree.$render()).toBe("('lifetime)");
	});
});
