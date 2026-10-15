import type { SerializedNodeModel } from '../codegen-surface.ts';

export type DisplayFamilies = SerializedNodeModel['displayUnions'];

export function sharedDisplayStorageKinds(display: string, families: DisplayFamilies): readonly string[] {
	const members = families[display]?.filter((member) => !member.literal).map((member) => member.storage) ?? [];
	return members.length > 1 ? members : [display];
}

export function physicalDisplayKind(display: string, storage: string | undefined, families: DisplayFamilies): string {
	const members = sharedDisplayStorageKinds(display, families);
	return storage !== undefined && members.includes(storage) ? storage : display;
}
