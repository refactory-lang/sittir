import { describe, expect, it } from 'vitest';
import { createNamedSlotModel, createUnnamedKindSlotModel, createUnnamedChildrenSlotModel, slotStorageKey } from '../compiler/slot-model.ts';

describe('slot-model', () => {
	it('named slot — origin=field, storage _<name>', () => {
		const named = createNamedSlotModel('body', 'one');
		expect(named.name).toBe('body');
		expect(slotStorageKey(named)).toBe('_body');
		expect(named.origin).toBe('field');
		expect(named.arity).toBe('one');
	});

	it('kind-named slot — origin=kind, storage _<kind>', () => {
		const kind = createUnnamedKindSlotModel('attribute_item', 'many');
		expect(kind.name).toBe('attribute_item');
		expect(slotStorageKey(kind)).toBe('_attribute_item');
		expect(kind.origin).toBe('kind');
		expect(kind.arity).toBe('many');
	});

	it('legacy children slot — kept for migration, storage $children', () => {
		const children = createUnnamedChildrenSlotModel('many');
		expect(children.name).toBe('children');
		expect(slotStorageKey(children)).toBe('$children');
		expect(children.origin).toBe('kind');
		expect(children.arity).toBe('many');
	});
});
