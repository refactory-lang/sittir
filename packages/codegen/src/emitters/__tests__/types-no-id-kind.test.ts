import { describe, expect, it } from 'vitest';
import { emitTypes } from '../types.ts';
import { makeMinimalNodeMap, withGeneratedIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';

describe('a grammar emitted without kind id tables', () => {
	const src = emitTypes({ grammar: 'synth', ...withGeneratedIdTables((kindEntries) => makeMinimalNodeMap(kindEntries))});

	it('stamps no string where a namespace takes a numeric kind id', () => {
		const stamps = [...src.matchAll(/(?:LeafNs|KeywordNs)<[^\n]*>\s*\{\}/g)].map((m) => m[0]);
		for (const stamp of stamps) expect(stamp).not.toMatch(/,\s*['"][a-z_]+['"]\s*>/);
		expect(stamps.length).toBeGreaterThan(0);
	});
});
