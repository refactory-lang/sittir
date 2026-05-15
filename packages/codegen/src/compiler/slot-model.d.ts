export type SlotArity = 'one' | 'many';
export interface SlotModel {
    readonly name: string;
    readonly storageKey: string;
    readonly arity: SlotArity;
    readonly unnamed: boolean;
}
export declare function createNamedSlotModel(name: string, arity: SlotArity): SlotModel;
export declare function createUnnamedChildrenSlotModel(arity: SlotArity): SlotModel;
export declare function slotStorageKey(slot: SlotModel): string;
//# sourceMappingURL=slot-model.d.ts.map