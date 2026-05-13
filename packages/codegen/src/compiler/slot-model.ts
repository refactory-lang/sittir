export type SlotArity = 'one' | 'many';

export interface SlotModel {
	readonly name: string;
	readonly storageKey: string;
	readonly arity: SlotArity;
	readonly unnamed: boolean;
}

export function createNamedSlotModel(name: string, arity: SlotArity): SlotModel {
	return { name, storageKey: `_${name}`, arity, unnamed: false };
}

export function createUnnamedChildrenSlotModel(arity: SlotArity): SlotModel {
	return { name: 'children', storageKey: '$children', arity, unnamed: true };
}

export function slotStorageKey(slot: SlotModel): string {
	return slot.storageKey;
}
