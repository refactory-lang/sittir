import { opaqueFacts, type OpaqueFacts } from './opaque-facts.ts';

export type SlotArity = 'one' | 'many';
export type SlotOrigin = 'field' | 'kind';

export interface SlotModel {
	readonly name: string;
	readonly storageKey: string;     // always `_<name>`
	readonly arity: SlotArity;
	/** Validator-only facts (e.g. `{ origin }`). OPAQUE to the compiler — read
	 *  only via `readFacts` in the validator; never branch on it here. */
	readonly metadata: OpaqueFacts;
}

export function createSlotModel(name: string, arity: SlotArity, origin: SlotOrigin): SlotModel {
	return { name, storageKey: `_${name}`, arity, metadata: opaqueFacts({ origin }) };
}

// Compatibility shims for migration. Callers updated to createSlotModel in later tasks.
export function createNamedSlotModel(name: string, arity: SlotArity): SlotModel {
	return createSlotModel(name, arity, 'field');
}

export function createUnnamedKindSlotModel(kindName: string, arity: SlotArity): SlotModel {
	return createSlotModel(kindName, arity, 'kind');
}

/**
 * @deprecated TEMPORARY — kept while existing callers still pass the merged-children
 * semantics. Returns the legacy `$children` storage key. Once all callers migrate
 * to per-slot `createUnnamedKindSlotModel(actualKindName, ...)`, this disappears.
 */
export function createUnnamedChildrenSlotModel(arity: SlotArity): SlotModel {
	return { name: 'children', storageKey: '$children', arity, metadata: opaqueFacts({ origin: 'kind' }) };
}

export function slotStorageKey(slot: SlotModel): string {
	return slot.storageKey;
}
