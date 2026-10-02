import { describe, expect, it } from 'vitest';
import { STORED_SLOT_READERS, groupField, seatWith, storedSlotReader } from '../src/utils.ts';

interface Group {
	readonly $type: 7;
	left(): string;
	right(): string | undefined;
	readonly $with: { left(v: string): Group; right(v?: string): Group };
}

const group = (left: string, right?: string): Group => ({
	$type: 7,
	left: () => left,
	right: () => right,
	$with: { left: (v) => group(v, right), right: (v) => group(left, v) }
});

interface Parent {
	readonly $type: 1;
	readonly _seat: Group | undefined;
	left(): string;
	seat(): Group | undefined;
	readonly $with: { seat(value?: Group): string };
}

interface Seated extends Parent {
	readonly seatLeft: (() => string) | undefined;
	readonly right: (() => string | undefined) | undefined;
	readonly $with: Parent['$with'] & { seatLeft(v?: string): string; right(v?: string): string };
}

const seated: (Group | undefined)[] = [];
const made: unknown[] = [];

const parent = (inner: Group | undefined): Seated => {
	const spec = {
		slot: 'seat',
		stored: '_seat',
		kind: 7,
		make: ((config: { left?: string; right?: string }) => (made.push(config), group(config.left ?? 'm', config.right))) as (
			config: never
		) => unknown,
		keys: [
			{ name: 'seatLeft', field: 'left', rest: false, required: true },
			{ name: 'right', rest: false }
		]
	};
	const readGroup = () => inner;
	const setSeat = (value?: Group) => (seated.push(value), 'rebuilt');
	const node = {
		$type: 1,
		_seat: inner,
		left: () => 'own',
		seat: () => inner,
		$with: {
			seat: setSeat,
			seatLeft: (...args: unknown[]) => seatWith(spec, 'seatLeft', args, setSeat, () => readGroup()),
			right: (...args: unknown[]) => seatWith(spec, 'right', args, setSeat, () => readGroup())
		},
		seatLeft: inner === undefined ? undefined : () => groupField(readGroup(), 'left'),
		right: inner === undefined ? undefined : () => groupField(readGroup(), 'right'),
		[STORED_SLOT_READERS]: { seat: readGroup }
	};
	return node as unknown as Seated;
};

describe('a group seat written in the literal', () => {
	it('reads a prefixed key from the group field it names, and leaves the parent slot of that name alone', () => {
		const node = parent(group('a', 'b'));
		expect(node.seatLeft?.()).toBe('a');
		expect(node.right?.()).toBe('b');
		expect(node.left()).toBe('own');
	});

	it('has no reader for a flattened key while the group is absent', () => {
		const node = parent(undefined);
		expect(node.seatLeft).toBeUndefined();
		expect(node.right).toBeUndefined();
		expect(typeof parent(group('a')).seatLeft).toBe('function');
	});

	it('sets a prefixed key through the group field it names', () => {
		seated.length = 0;
		const node = parent(group('a', 'b'));
		expect(node.$with.seatLeft('z')).toBe('rebuilt');
		expect(seated[0]?.left()).toBe('z');
		expect(seated[0]?.right()).toBe('b');
	});

	it('builds an absent group from the one required field a key names', () => {
		made.length = 0;
		parent(undefined).$with.seatLeft('z');
		expect(made).toEqual([{ left: 'z' }]);
	});

	it('clears an absent seat when a key is given no value, instead of seating an empty group', () => {
		seated.length = 0;
		made.length = 0;
		parent(undefined).$with.right();
		parent(undefined).$with.seatLeft(undefined);
		expect(made).toEqual([]);
		expect(seated).toEqual([undefined, undefined]);
	});

	it('refuses to build an absent group without its required fields', () => {
		made.length = 0;
		expect(() => parent(undefined).$with.right('b')).toThrow(
			"$with.right cannot build the absent 'seat' group without its required seatLeft; set it first, or pass the whole group to $with.seat"
		);
		expect(made).toEqual([]);
	});

	it('keeps the group reader for the seat slot', () => {
		const inner = group('a', 'b');
		const node = parent(inner);
		expect((storedSlotReader(node, 'seat') as () => Group).call(node)).toBe(inner);
	});
});
