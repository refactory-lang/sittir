import { describe, expect, it } from 'vitest';
import { createNamedSlotModel, createUnnamedKindSlotModel, createUnnamedChildrenSlotModel, slotStorageKey, type SlotOrigin } from '../compiler/slot-model.ts';
import { readFacts } from '../compiler/opaque-facts.ts';
import type { SlotModel } from '../compiler/slot-model.ts';

// `origin` is a validator-only fact stored in opaque metadata; read it back via
// the same `readFacts` seam the validator uses (the compiler can't index it).
const originOf = (slot: SlotModel): SlotOrigin => readFacts<{ origin: SlotOrigin }>(slot.metadata).origin;

describe('slot-model', () => {
	it('named slot — origin=field, storage _<name>', () => {
		const named = createNamedSlotModel('body', 'one');
		expect(named.name).toBe('body');
		expect(slotStorageKey(named)).toBe('_body');
		expect(originOf(named)).toBe('field');
		expect(named.arity).toBe('one');
	});

	it('kind-named slot — origin=kind, storage _<kind>', () => {
		const kind = createUnnamedKindSlotModel('attribute_item', 'many');
		expect(kind.name).toBe('attribute_item');
		expect(slotStorageKey(kind)).toBe('_attribute_item');
		expect(originOf(kind)).toBe('kind');
		expect(kind.arity).toBe('many');
	});

	it('legacy children slot — kept for migration, storage $children', () => {
		const children = createUnnamedChildrenSlotModel('many');
		expect(children.name).toBe('children');
		expect(slotStorageKey(children)).toBe('$children');
		expect(originOf(children)).toBe('kind');
		expect(children.arity).toBe('many');
	});
});
