import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';
import { TSKindId } from '../src/kinds.ts';

function kindsOf(value: unknown, into = new Set<number>()): Set<number> {
	if (Array.isArray(value)) {
		for (const item of value) kindsOf(item, into);
	} else if (value !== null && typeof value === 'object') {
		for (const [key, inner] of Object.entries(value)) {
			if (key === '$type' && typeof inner === 'number') into.add(inner);
			else kindsOf(inner, into);
		}
	}
	return into;
}

describe('a parsed node’s snapshot', () => {
	it('lists no fixed token among the nodes it holds', async () => {
		using engine = await createEngine(rust);
		const kinds = kindsOf(engine.parse('fn f(a: u8, b: u8) {}\n').$snapshot());
		expect(kinds.size).toBeGreaterThan(0);
		expect(kinds).not.toContain(TSKindId.Lparen);
		expect(kinds).not.toContain(TSKindId.Rparen);
		expect(kinds).not.toContain(TSKindId.Comma);
	});
});
