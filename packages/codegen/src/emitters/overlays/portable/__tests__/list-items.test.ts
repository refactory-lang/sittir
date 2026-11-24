import { describe, expect, it } from 'vitest';
import type { PortableSlotRoute, PortableSlotStep } from '@sittir/types';
import { unreadListItems } from '../build.ts';

const route = (name: string, steps: readonly PortableSlotStep[]): PortableSlotRoute => ({ name, steps, multiple: false, seats: [] });
const doc = route('doc', [{ key: 'body', kinds: [1] }, { key: 'statements', many: true, kinds: [2] }, { key: 'content' }]);
const held = (items: readonly number[]) => (_: PortableSlotRoute, step: number): readonly number[] => (step === 1 ? items : []);

describe('a list step that takes only some of the kinds its grammar slot holds', () => {
	it('leaves the other items unread where no other route of the arm reads them', () => {
		expect(unreadListItems([doc], held([2, 3]))).toEqual({ route: doc, step: 1 });
	});

	it('leaves none unread beside a route that reads the holder whole, through steps that take what its own take', () => {
		expect(unreadListItems([doc, route('body', [{ key: 'body' }])], held([2, 3]))).toBeUndefined();
		expect(unreadListItems([doc, route('body', [{ key: 'body', kinds: [4] }])], held([2, 3]))).toEqual({ route: doc, step: 1 });
	});

	it("leaves none unread where the routes through the same step take every kind its grammar slot holds, and names the step where they don't", () => {
		const rest = (kinds: readonly number[]) => route('rest', [{ key: 'body', kinds: [1] }, { key: 'statements', many: true, kinds }, { key: 'value' }]);
		expect(unreadListItems([doc, rest([3])], held([2, 3]))).toBeUndefined();
		expect(unreadListItems([doc, route('all', [{ key: 'body', kinds: [1] }, { key: 'statements', many: true }])], held([2, 3]))).toBeUndefined();
		expect(unreadListItems([doc, rest([3])], held([2, 3, 4]))).toEqual({ route: doc, step: 1 });
	});
});
