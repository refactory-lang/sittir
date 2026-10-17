import { describe, expect, it } from 'vitest';
import type { QueryPlan } from '@sittir/types';
import { slotFlagsOf } from '../flags.ts';

const ALWAYS: QueryPlan = { op: 'and', of: [] };
const SLOTTED: QueryPlan = { op: 'present', slots: { 9: 0 } };
const IDS: Readonly<Record<string, number>> = { u8: 59, usize: 70, i8: 60, closure: 369, item: 208, _int: 0 };
const TYPES: Readonly<Record<string, readonly number[]>> = { _int: [59, 70] };

type Slot = { readonly propertyName: string; readonly kinds: readonly string[] };
const node = (kindId: number | undefined, kind: string, slots: readonly Slot[]) => ({ kindId, kind, typeName: kind, slots }) as never;

const rows = (nodes: readonly unknown[], plans: Readonly<Record<string, Readonly<Record<string, QueryPlan | null>>>>) =>
	slotFlagsOf({
		nodes: nodes as never,
		kindsOf: (slot) => (slot as unknown as Slot).kinds,
		plans: new Map(Object.entries(plans).map(([kind, row]) => [kind, new Map(Object.entries(row))])),
		typeOf: (kind) => IDS[kind],
		typesOf: (kind) => TYPES[kind] ?? (IDS[kind] === undefined ? [] : [IDS[kind]!])
	});
const flatten = (result: ReturnType<typeof rows>) =>
	Object.fromEntries([...result].map(([id, { slots }]) => [id, Object.fromEntries([...slots].map(([slot, held]) => [slot, Object.fromEntries(held)]))]));

describe('slotFlagsOf', () => {
	it('lists, per slot, the types of the kinds it can hold that always carry each flag', () => {
		const result = rows([node(1, 'parameter', [{ propertyName: 'type', kinds: ['u8', 'i8', 'usize'] }])], { u8: { unsigned: ALWAYS }, usize: { unsigned: ALWAYS } });
		expect(flatten(result)).toEqual({ 1: { type: { unsigned: { types: [59, 70], kinds: [] } } } });
	});

	it('expands a kind as ofType does, merging the ids', () => {
		const result = rows([node(1, 'parameter', [{ propertyName: 'type', kinds: ['_int', 'u8'] }])], { _int: { unsigned: ALWAYS }, u8: { unsigned: ALWAYS } });
		expect(flatten(result)).toEqual({ 1: { type: { unsigned: { types: [59, 70], kinds: [] } } } });
	});

	it('lists a kind that carries the flag by its own slots by its id, and refuses one that carries it by its context', () => {
		const result = rows([node(2, 'let', [{ propertyName: 'value', kinds: ['closure', 'item'] }])], { closure: { move: SLOTTED }, item: { static: null } });
		expect(flatten(result)).toEqual({ 2: { value: { move: { types: [], kinds: [369] }, static: { kind: 208 } } } });
	});

	it('keeps both the kinds that always carry the flag and those that carry it by their slots, whichever comes first', () => {
		const first = rows([node(3, 'p', [{ propertyName: 't', kinds: ['closure', 'u8'] }])], { closure: { unsigned: SLOTTED }, u8: { unsigned: ALWAYS } });
		const last = rows([node(3, 'p', [{ propertyName: 't', kinds: ['u8', 'closure'] }])], { closure: { unsigned: SLOTTED }, u8: { unsigned: ALWAYS } });
		expect(flatten(first)).toEqual({ 3: { t: { unsigned: { types: [59], kinds: [369] } } } });
		expect(flatten(last)).toEqual(flatten(first));
	});

	it('lets a context refusal win over every other kind, whichever comes first', () => {
		const first = rows([node(3, 'p', [{ propertyName: 't', kinds: ['item', 'u8', 'closure'] }])], { item: { unsigned: null }, u8: { unsigned: ALWAYS }, closure: { unsigned: SLOTTED } });
		const last = rows([node(3, 'p', [{ propertyName: 't', kinds: ['u8', 'closure', 'item'] }])], { item: { unsigned: null }, u8: { unsigned: ALWAYS }, closure: { unsigned: SLOTTED } });
		expect(flatten(first)).toEqual({ 3: { t: { unsigned: { kind: 208 } } } });
		expect(flatten(last)).toEqual(flatten(first));
	});

	it('rows only kinds with an id and a slot that holds a flagged kind', () => {
		const result = rows(
			[node(undefined, 'phantom', [{ propertyName: 'type', kinds: ['u8'] }]), node(4, 'plain', [{ propertyName: 'x', kinds: ['i8'] }]), node(5, 'leaf', [])],
			{ u8: { unsigned: ALWAYS } }
		);
		expect(flatten(result)).toEqual({});
	});

	it('refuses two nodes stamped with one kind id that disagree', () => {
		expect(() =>
			rows([node(6, 'a', [{ propertyName: 'type', kinds: ['u8'] }]), node(6, 'b', [{ propertyName: 'type', kinds: ['usize'] }])], {
				u8: { unsigned: ALWAYS },
				usize: { unsigned: ALWAYS }
			})
		).toThrow("portable: kind id 6 ('b') has two slot flag tables");
	});
});
