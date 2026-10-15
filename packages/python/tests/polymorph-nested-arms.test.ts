import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const py = await createEngine(python);

describe('a polymorph parent nested in a polymorph parent', () => {
	const primary = (py.build as unknown as { yield: { fromClause: { primary: Record<string, unknown> } } }).yield.fromClause.primary;

	it('routes through the nested parent to its builders', () => {
		expect(typeof primary['integer']).toBe('function');
		expect(typeof primary['identifier']).toBe('function');
	});

	it('does not leak the chained route as a sibling key', () => {
		expect(Object.keys((py.build as unknown as { yield: object }).yield)).toEqual(['strict', 'coerce', 'fromClause']);
	});

	it('leaves a constant keyword arm without a route, since it has no builder to call', () => {
		expect(primary['true']).toBeUndefined();
		expect(primary['none']).toBeUndefined();
	});
});
