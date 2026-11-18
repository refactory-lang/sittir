import { hydrateStored } from './engine-scope.ts';
import { isRecordPosition } from './handle.ts';
import { undoIfFillFails } from './list-fills.ts';
import { nativeSlotReader, slotReader } from './record-view.ts';

/** How one stored value becomes what an accessor returns: `hydrateWith` bound to a parsed node's tree, or `hydrateStored` for a built node. */
export type HydrateOne = (value: unknown) => unknown;


/** The list slots already hydrated: each holds the frozen items an accessor returns. */
const hydratedLists = new WeakSet<readonly unknown[]>();

/** The value of slot `key` of `node`, hydrated by `hydrateOne` and written back into the slot. */
export function hydrateSlotBy(node: object, key: string, hydrateOne: HydrateOne): unknown {
	const slots = node as Record<string, unknown>;
	const child = hydrateOne(slots[key]);
	if (child !== slots[key]) {
		undoIfFillFails(slots, key, slots[key]);
		slots[key] = child;
	}
	return child;
}

/** `hydrateSlotBy` for a list slot: every item hydrated once, the slot then holding the frozen items. */
export function hydrateSlotsBy(node: object, key: string, hydrateOne: HydrateOne): readonly unknown[] {
	const slots = node as Record<string, unknown>;
	const stored = slots[key];
	if (!Array.isArray(stored)) return [hydrateSlotBy(node, key, hydrateOne)];
	if (hydratedLists.has(stored)) return stored;
	const children = Object.freeze(stored.map((entry) => hydrateOne(entry)));
	hydratedLists.add(children);
	undoIfFillFails(slots, key, stored);
	slots[key] = children;
	return children;
}

/** The value of slot `key` of a built node, hydrated by `hydrateStored`: a coordinate it stores becomes the node every route returns, written back into the slot. */
export function hydrateStoredSlot(node: object, key: string): unknown {
	return hydrateSlotBy(node, key, hydrateStored);
}

/** `hydrateStoredSlot` for a list slot. */
export function hydrateStoredSlots(node: object, key: string): readonly unknown[] {
	return hydrateSlotsBy(node, key, hydrateStored);
}

/** The slot `accessor` of a node whose own slot is `storage`: its native read when its tree registered one, else what a built node stores. */
export function storedSlotRead(node: object, accessor: string, storage: string, many = Array.isArray((node as Record<string, unknown>)[storage])): unknown {
	const native = nativeSlotReader(node, accessor);
	if (native !== undefined) return native.call(node);
	if (isRecordPosition(node)) return (node as unknown as Record<string, (() => unknown) | undefined>)[accessor]?.call(node);
	if (!(storage in node)) {
		const read = slotReader(node, accessor);
		return typeof read === 'function' ? (read as () => unknown).call(node) : read;
	}
	return many ? hydrateStoredSlots(node, storage) : hydrateStoredSlot(node, storage);
}
