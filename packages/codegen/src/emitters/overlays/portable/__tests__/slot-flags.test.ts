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
		expect(flatten(result)).toEqual({ 1: { type: { unsigned: [59, 70] } } });
	});

	it('expands a kind as ofType does, merging the ids', () => {
		const result = rows([node(1, 'parameter', [{ propertyName: 'type', kinds: ['_int', 'u8'] }])], { _int: { unsigned: ALWAYS }, u8: { unsigned: ALWAYS } });
		expect(flatten(result)).toEqual({ 1: { type: { unsigned: [59, 70] } } });
	});

	it('refuses a flag a kind the slot holds declares through its own slots, or its context, naming the kind', () => {
		const result = rows([node(2, 'let', [{ propertyName: 'value', kinds: ['closure', 'item'] }])], { closure: { move: SLOTTED }, item: { static: null } });
		expect(flatten(result)).toEqual({ 2: { value: { move: { kind: 369, context: false }, static: { kind: 208, context: true } } } });
	});

	it('lets a refusal win over the kinds that always carry the flag, whichever comes first', () => {
		const first = rows([node(3, 'p', [{ propertyName: 't', kinds: ['closure', 'u8'] }])], { closure: { unsigned: SLOTTED }, u8: { unsigned: ALWAYS } });
		const last = rows([node(3, 'p', [{ propertyName: 't', kinds: ['u8', 'closure'] }])], { closure: { unsigned: SLOTTED }, u8: { unsigned: ALWAYS } });
		expect(flatten(first)).toEqual({ 3: { t: { unsigned: { kind: 369, context: false } } } });
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
