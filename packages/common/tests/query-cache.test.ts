import { describe, expect, it, vi } from 'vitest';
import type { Cond, QuerySlots, SlotRef } from '@sittir/types';
import { queryFacet, type DescendantWalk, type QueryHooks } from '../src/query.ts';
import { holdTreeOn, mintTreeToken, registerTree } from '../src/tree-token.ts';

interface NameRecorder {
	readonly name: SlotRef;
}

interface QueryTestView extends Iterable<unknown> {
	ofType(kind: number): QueryTestView;
	where(condition: (slots: NameRecorder) => Cond): QueryTestView;
}

function queryContext(querySlots: QuerySlots) {
	const walks: DescendantWalk[] = [];
	const node = { $type: 0, $source: 'ts', $handle: 1 } as const;
	const token = mintTreeToken(1);
	registerTree(token, {
		get rootNode(): never {
			throw new Error('The query fixture never reads tree-sitter nodes');
		},
		query: {
			descendants(walk) {
				walks.push(walk);
				return { stubs: [], resume: null, origin: 0 };
			},
			planHolds: () => []
		}
	});
	holdTreeOn(node, token);
	const hooks: QueryHooks = { querySlots, kindName: (kind) => `kind_${kind}`, wrap: (data) => data };
	const facet = queryFacet(node, hooks) as { readonly $descendants: QueryTestView };
	return { view: facet.$descendants, walks };
}

function nameSlots(field: string, kind = 42): QuerySlots {
	return Object.freeze({ [kind]: [['name', { fields: [field], kinds: [] }]] });
}

describe('compiled query cache', () => {
	it.each([
		['field_a', 'field_b'],
		['field_b', 'field_a']
	])('keeps one callback scoped to its grammar routes (%s then %s)', (first, second) => {
		const condition = vi.fn((slots: NameRecorder) => slots.name.eq('target'));
		for (const field of [first, second]) {
			const context = queryContext(nameSlots(field));
			expect([...context.view.ofType(42).where(condition)]).toEqual([]);
			expect(context.walks[0]?.plan).toEqual({ op: 'eq', text: 'target', fields: [field], kinds: [] });
		}
		expect(condition).toHaveBeenCalledTimes(2);
	});

	it('refuses a slot missing in another grammar after caching a valid callback', () => {
		const condition = (slots: NameRecorder) => slots.name.eq('target');
		const valid = queryContext(nameSlots('field_a'));
		const invalid = queryContext(Object.freeze({ 42: [] }));
		valid.view.ofType(42).where(condition);
		expect(() => invalid.view.ofType(42).where(condition)).toThrow('name is not a slot of kind_42');
		expect(invalid.walks).toEqual([]);
	});

	it('still compiles in a valid grammar after another grammar rejects the callback', () => {
		const condition = (slots: NameRecorder) => slots.name.eq('target');
		const invalid = queryContext(Object.freeze({ 42: [] }));
		expect(() => invalid.view.ofType(42).where(condition)).toThrow('name is not a slot of kind_42');
		const valid = queryContext(nameSlots('field_a'));
		expect([...valid.view.ofType(42).where(condition)]).toEqual([]);
		expect(valid.walks[0]?.plan).toEqual({ op: 'eq', text: 'target', fields: ['field_a'], kinds: [] });
	});

	it('reuses a compiled plan across contexts sharing a query-slot table', () => {
		const slots = nameSlots('shared');
		const condition = vi.fn((recorder: NameRecorder) => recorder.name.eq('target'));
		for (const context of [queryContext(slots), queryContext(slots)]) {
			expect([...context.view.ofType(42).where(condition)]).toEqual([]);
			expect(context.walks[0]?.plan).toEqual({ op: 'eq', text: 'target', fields: ['shared'], kinds: [] });
		}
		expect(condition).toHaveBeenCalledTimes(1);
	});
});
