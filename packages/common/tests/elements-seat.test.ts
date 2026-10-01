import { describe, expect, it } from 'vitest';
import { withElementsSeat } from '../src/utils.ts';

const seat = () => {
	const seated: unknown[][] = [];
	const node = withElementsSeat(
		{ $type: 1, $with: { comparators: (...items: unknown[]) => (seated.push(items), 'rebuilt') } } as Record<string, unknown>,
		{ slot: 'comparators', keys: ['operators', 'primaryExpression'], make: ((config: unknown) => ({ $type: 9, config })) as (config: never) => unknown }
	) as any;
	return { node, seated };
};

describe('withElementsSeat', () => {
	it('builds each config object among the rest arguments and passes nodes through', () => {
		const { node, seated } = seat();
		const built = { $type: 9 };
		expect(node.$with.comparators(built, { operators: '<' })).toBe('rebuilt');
		expect(seated).toEqual([[built, { $type: 9, config: { operators: '<' } }]]);
	});

	it('rejects an array, naming the slot and the rest form it takes', () => {
		const { node, seated } = seat();
		expect(() => node.$with.comparators([{ $type: 9 }])).toThrow(
			'$with.comparators takes its elements as rest arguments, $with.comparators(a, b), not an array; spread it: $with.comparators(...items)'
		);
		expect(seated).toEqual([]);
	});
});
