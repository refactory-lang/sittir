import { describe, expect, it } from 'vitest';
import { hoistCensus } from '../src/census/hoist.ts';

const PINNED = { python: 71, rust: 103, typescript: 102, regex: 8, scm: 3 } as const;

describe('the hoist census', () => {
	it.each(Object.entries(PINNED))('stamps %s at its pinned holder slot count', async (grammar, slots) => {
		const census = await hoistCensus(grammar);
		expect(census.slots).toBe(slots);
		expect(census.rows.reduce((total, row) => total + row.holders.length, 0)).toBe(slots);
	}, 180_000);
});
