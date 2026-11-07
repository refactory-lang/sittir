import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

describe('a kind id among a list slot’s items', () => {
	it('stays the token it names', () => {
		const built = rs.build.delimTokenTreeParen({ delimTokens: [rs.kinds.Dollar, rs.build.identifier('a')] } as never);
		expect(String(built)).toBe('($ a)');
	});
});
