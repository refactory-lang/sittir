import { hydrateStored } from './engine-scope.ts';
import { isRecordPosition } from './handle.ts';
import { undoIfFillFails } from './list-fills.ts';
import { nativeSlotReader } from './record-view.ts';

export type HydrateOne = (value: unknown) => unknown;

const hydratedLists = new WeakSet<readonly unknown[]>();

export function hydrateSlotBy(node: object, key: string, hydrateOne: HydrateOne): unknown {
	const slots = node as Record<string, unknown>;
	const child = hydrateOne(slots[key]);
	if (child !== slots[key]) {
		undoIfFillFails(slots, key, slots[key]);
		slots[key] = child;
	}
	return child;
}

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

export function hydrateStoredSlot(node: object, key: string): unknown {
	return hydrateSlotBy(node, key, hydrateStored);
}

export function hydrateStoredSlots(node: object, key: string): readonly unknown[] {
	return hydrateSlotsBy(node, key, hydrateStored);
}

export function storedSlotRead(node: object, accessor: string, storage: string, many = Array.isArray((node as Record<string, unknown>)[storage])): unknown {
	const native = nativeSlotReader(node, accessor);
	if (native !== undefined) return native.call(node);
	if (isRecordPosition(node)) return (node as unknown as Record<string, (() => unknown) | undefined>)[accessor]?.call(node);
	if (!(storage in node)) return undefined;
	return many ? hydrateStoredSlots(node, storage) : hydrateStoredSlot(node, storage);
}
