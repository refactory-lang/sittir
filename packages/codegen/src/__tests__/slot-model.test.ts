import { describe, expect, it } from 'vitest';
import { createNamedSlotModel, createUnnamedChildrenSlotModel, slotStorageKey } from '../compiler/slot-model.ts';

describe('slot-model', () => {
	it('treats unnamed children as a normal slot with a special storage key', () => {
		const named = createNamedSlotModel('body', 'one');
		const children = createUnnamedChildrenSlotModel('many');

		expect(named.name).toBe('body');
		expect(slotStorageKey(named)).toBe('_body');
		expect(named.unnamed).toBe(false);
		expect(named.arity).toBe('one');

		expect(children.name).toBe('children');
		expect(slotStorageKey(children)).toBe('$children');
		expect(children.unnamed).toBe(true);
		expect(children.arity).toBe('many');
	});
});
