import { describe, expect, it } from 'vitest';
import type { PortableSlotRoute } from '@sittir/types';
import { landsTwice } from '../build.ts';

const body = (reads?: readonly number[]): PortableSlotRoute => ({
	name: 'statements',
	steps: [{ key: 'body' }],
	multiple: false,
	list: true,
	seats: [{ at: [1, 'body'], kinds: reads ?? [2, 3] }],
	...(reads === undefined ? {} : { reads })
});

describe('two routes of one slot that land on one grammar slot', () => {
	it('share it where their kinds do not overlap: a lone if, and every other statement', () => {
		expect(landsTwice([body([2]), body([3])])).toBeUndefined();
	});

	it('are refused where their kinds overlap', () => {
		const second = body([2, 3]);
		expect(landsTwice([body([2]), second])).toEqual({ route: second, landing: 'body:' });
	});

	it('are refused where one of them reads every kind its grammar slot holds', () => {
		const whole = body();
		expect(landsTwice([body([2]), whole])).toEqual({ route: whole, landing: 'body:' });
	});

	it('leave a route alone whose seats land on one grammar slot twice', () => {
		const route = { ...body([2]), seats: [...body([2]).seats, ...body([2]).seats] };
		expect(landsTwice([route])).toBeUndefined();
	});
});
