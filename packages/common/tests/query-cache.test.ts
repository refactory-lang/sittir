import { describe, expect, it, vi } from 'vitest';
import type { Cond, QuerySlots, SlotRef } from '@sittir/types';
import type { QueryHooks } from '../src/query.ts';
import { queryContext as contextOf } from './support/query-context.ts';

interface NameRecorder {
	readonly name: SlotRef;
}

interface QueryTestView extends Iterable<unknown> {
	ofType(kind: number): QueryTestView;
	where(condition: (slots: NameRecorder) => Cond): QueryTestView;
}

const queryContext = (querySlots: QuerySlots, membership?: QueryHooks['membership']) => contextOf<QueryTestView>(querySlots, membership);

function nameSlots(slot: number, kind = 42): QuerySlots {
	return Object.freeze({ [kind]: [['name', slot, undefined, '_name']] });
}

describe('compiled query cache', () => {
	it.each([
		[0, 1],
		[1, 0]
	])('keeps one callback scoped to its grammar\'s slot numbers (%s then %s)', (first, second) => {
		const condition = vi.fn((slots: NameRecorder) => slots.name.eq('target'));
		for (const slot of [first, second]) {
			const context = queryContext(nameSlots(slot));
			expect([...context.view.ofType(42).where(condition)]).toEqual([]);
			expect(context.walks[0]?.plan).toEqual({ op: 'eq', text: 'target', slots: { 42: slot } });
		}
		expect(condition).toHaveBeenCalledTimes(2);
	});

	it('refuses a slot missing in another grammar after caching a valid callback', () => {
		const condition = (slots: NameRecorder) => slots.name.eq('target');
		const valid = queryContext(nameSlots(0));
		const invalid = queryContext(Object.freeze({ 42: [] }));
		valid.view.ofType(42).where(condition);
		expect(() => invalid.view.ofType(42).where(condition)).toThrow('name is not a slot of kind_42');
		expect(invalid.walks).toEqual([]);
	});

	it('still compiles in a valid grammar after another grammar rejects the callback', () => {
		const condition = (slots: NameRecorder) => slots.name.eq('target');
		const invalid = queryContext(Object.freeze({ 42: [] }));
		expect(() => invalid.view.ofType(42).where(condition)).toThrow('name is not a slot of kind_42');
		const valid = queryContext(nameSlots(0));
		expect([...valid.view.ofType(42).where(condition)]).toEqual([]);
		expect(valid.walks[0]?.plan).toEqual({ op: 'eq', text: 'target', slots: { 42: 0 } });
	});

	it('reuses a compiled plan across contexts sharing a query-slot table', () => {
		const slots = nameSlots(2);
		const condition = vi.fn((recorder: NameRecorder) => recorder.name.eq('target'));
		for (const context of [queryContext(slots), queryContext(slots)]) {
			expect([...context.view.ofType(42).where(condition)]).toEqual([]);
			expect(context.walks[0]?.plan).toEqual({ op: 'eq', text: 'target', slots: { 42: 2 } });
		}
		expect(condition).toHaveBeenCalledTimes(1);
	});

	it('pushes one plan down for a kind whose members number the slot apart, each member under its own number', () => {
		const members: QueryHooks['membership'] = {
			isMember: (kind, type) => kind === type || (kind === 40 && (type === 41 || type === 42)),
			membersOf: (kind) => (kind === 40 ? [41, 42] : [kind])
		};
		const context = queryContext(Object.freeze({ 41: [['name', 0, undefined, '_name']], 42: [['other', 0, undefined, '_other'], ['name', 1, undefined, '_name']] }) as QuerySlots, members);
		expect([...context.view.ofType(40).where((slots) => slots.name.eq('target'))]).toEqual([]);
		expect(context.walks[0]).toMatchObject({ kinds: [41, 42], plan: { op: 'eq', text: 'target', slots: { 41: 0, 42: 1 } } });
	});
});
