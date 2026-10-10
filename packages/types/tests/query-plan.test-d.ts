import { describe, expectTypeOf, it } from 'vitest';
import type { QueryPlan, QuerySubject } from '../src/index.ts';

const NAME = { fields: ['name'], kinds: [] } as const;

describe('a query plan', () => {
	it('compares slots only, unless its subject admits the node\'s own text', () => {
		expectTypeOf({ op: 'eq', text: 'x', ...NAME } as const).toExtend<QueryPlan>();
		expectTypeOf({ op: 'eq', text: 'x', self: true } as const).not.toExtend<QueryPlan>();
		expectTypeOf({ op: 'not', of: { op: 'match', pattern: '^x', self: true } } as const).not.toExtend<QueryPlan>();
		expectTypeOf({ op: 'eq', text: 'x', self: true } as const).toExtend<QueryPlan<QuerySubject>>();
		expectTypeOf({ op: 'and', of: [{ op: 'eq', text: 'x', ...NAME }, { op: 'eq', text: 'y', self: true }] } as const).toExtend<QueryPlan<QuerySubject>>();
	});
});
