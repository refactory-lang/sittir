import { describe, expect, it } from 'vitest';
import type { Cond, QuerySlots } from '@sittir/types';
import { queryContext } from './support/query-context.ts';

interface FlagRecorder {
	is(flag: string): Cond;
	readonly declarations: { is(flag: string): Cond };
}

interface FlagView extends Iterable<unknown> {
	ofType(kind: number): FlagView;
	where(condition: (slots: FlagRecorder) => Cond): FlagView;
}

const SLOTS = Object.freeze({ 7: [['declarations', 0, undefined, '_declarations']], 42: [] }) as QuerySlots;
const FLAGS = { queryFlags: { 42: { static: null } }, querySlotFlags: { 7: { declarations: { static: { kind: 42 } } } } };

describe("a flag that depends on the node's context", () => {
	it('is refused by name on the kind that declares it, before any walk', () => {
		const { view, walks } = queryContext<FlagView>(SLOTS, undefined, FLAGS);
		expect(() => [...view.ofType(42).where((c) => c.is('static'))]).toThrow("query: static on kind_42 depends on the node's context");
		expect(walks).toEqual([]);
	});

	it('is refused by name on a slot that holds the kind, naming both', () => {
		const { view, walks } = queryContext<FlagView>(SLOTS, undefined, FLAGS);
		expect(() => [...view.ofType(7).where((c) => c.declarations.is('static'))]).toThrow(
			"query: static on kind_42, which kind_7.declarations holds, depends on the node's context"
		);
		expect(walks).toEqual([]);
	});
});
