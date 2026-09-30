import { describe, expect, it } from 'vitest';
import { storedSlotReader, withGroupSeat } from '../src/utils.ts';

type Group = { $type: 7; left(): string; right(): string; $with: { left(v: string): Group; right(v: string): Group } };

const group = (left: string, right: string): Group => ({
	$type: 7,
	left: () => left,
	right: () => right,
	$with: { left: (v) => group(v, right), right: (v) => group(left, v) }
});

const seated: unknown[] = [];
const made: unknown[] = [];

const parent = (inner: Group | undefined) =>
	withGroupSeat(
		{
			$type: 1,
			left: () => 'own',
			seat: () => inner,
			$with: { seat: (value: unknown) => (seated.push(value), 'rebuilt') }
		} as Record<string, unknown>,
		{
			slot: 'seat',
			kind: 7,
			make: ((config: unknown) => (made.push(config), group('m', 'm'))) as (config: never) => unknown,
			keys: [
				{ name: 'seatLeft', field: 'left', rest: false },
				{ name: 'right', rest: false }
			]
		}
	) as any;

describe('withGroupSeat', () => {
	it('reads a prefixed key from the group field it names, and leaves the parent slot of that name alone', () => {
		const node = parent(group('a', 'b'));
		expect(node.seatLeft()).toBe('a');
		expect(node.right()).toBe('b');
		expect(node.left()).toBe('own');
	});

	it('sets a prefixed key through the group field it names', () => {
		seated.length = 0;
		const node = parent(group('a', 'b'));
		expect(node.$with.seatLeft('z')).toBe('rebuilt');
		expect((seated[0] as Group).left()).toBe('z');
		expect((seated[0] as Group).right()).toBe('b');
	});

	it('builds an absent group from the field a prefixed key names', () => {
		made.length = 0;
		parent(undefined).$with.seatLeft('z');
		expect(made).toEqual([{ left: 'z' }]);
	});

	it('keeps the group reader for the seat slot', () => {
		const inner = group('a', 'b');
		const node = parent(inner);
		expect((storedSlotReader(node, 'seat') as () => Group).call(node)).toBe(inner);
	});
});
