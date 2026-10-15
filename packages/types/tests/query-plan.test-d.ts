import { describe, expectTypeOf, it } from 'vitest';
import type { QueryPlan, QuerySubject, View } from '../src/index.ts';

const NAME = { slots: { 7: 0 } } as const;
declare const view: View<{ readonly $type: 1 }>;

describe('a query plan', () => {
	it('compares slots only, unless its subject admits the node\'s own text', () => {
		expectTypeOf({ op: 'eq', text: 'x', ...NAME } as const).toExtend<QueryPlan>();
		expectTypeOf({ op: 'eq', text: 'x', self: true } as const).not.toExtend<QueryPlan>();
		expectTypeOf({ op: 'not', of: { op: 'match', pattern: '^x', self: true } } as const).not.toExtend<QueryPlan>();
		expectTypeOf({ op: 'eq', text: 'x', self: true } as const).toExtend<QueryPlan<QuerySubject>>();
		expectTypeOf({ op: 'and', of: [{ op: 'eq', text: 'x', ...NAME }, { op: 'eq', text: 'y', self: true }] } as const).toExtend<QueryPlan<QuerySubject>>();
	});

	it('tests the node types of a slot in either plan, and the node\'s own type only in a read test', () => {
		expectTypeOf({ op: 'is', types: [1, 2], ...NAME } as const).toExtend<QueryPlan>();
		expectTypeOf({ op: 'not', of: { op: 'is', types: [1], ...NAME } } as const).toExtend<QueryPlan>();
		expectTypeOf({ op: 'is', types: [1], self: true } as const).toExtend<QueryPlan<QuerySubject>>();
		expectTypeOf({ op: 'is', types: [1], self: true } as const).not.toExtend<QueryPlan>();
		expectTypeOf({ op: 'is', types: ['identifier'], ...NAME } as const).not.toExtend<QueryPlan<QuerySubject>>();
	});

	it('steps to a child over a slot\'s numbers, with an anchor from the step vocabulary', () => {
		expectTypeOf({ op: 'child', ...NAME, of: { op: 'present', ...NAME } } as const).toExtend<QueryPlan>();
		expectTypeOf({ op: 'child', ...NAME, anchor: 'only', of: { op: 'and', of: [] } } as const).toExtend<QueryPlan>();
		expectTypeOf({ op: 'child', ...NAME, anchor: 'middle', of: { op: 'and', of: [] } } as const).not.toExtend<QueryPlan>();
		expectTypeOf({ op: 'child', self: true, of: { op: 'and', of: [] } } as const).not.toExtend<QueryPlan<QuerySubject>>();
	});

	it('reaches a where condition only through the recorder, never as a raw plan', () => {
		// @ts-expect-error a where condition is a recorded Cond; a plan is the compiled wire shape
		view.where(() => ({ op: 'is', types: [1], ...NAME }));
		// @ts-expect-error a child step is wire shape too
		view.where(() => ({ op: 'child', ...NAME, of: { op: 'and', of: [] } }));
	});
});
