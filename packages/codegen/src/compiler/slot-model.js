export function createNamedSlotModel(name, arity) {
    return { name, storageKey: `_${name}`, arity, unnamed: false };
}
export function createUnnamedChildrenSlotModel(arity) {
    return { name: 'children', storageKey: '$children', arity, unnamed: true };
}
export function slotStorageKey(slot) {
    return slot.storageKey;
}
//# sourceMappingURL=slot-model.js.map