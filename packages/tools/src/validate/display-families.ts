import type { SerializedNodeModel } from '../codegen-surface.ts';

export type DisplayFamilies = SerializedNodeModel['displayUnions'];

export function sharedDisplayStorageKinds(display: string, families: DisplayFamilies): readonly string[] {
	const members = families[display]?.filter((member) => !member.literal).map((member) => member.storage) ?? [];
	return members.length > 1 ? members : [display];
}

export function sharedDisplayEntries<E extends { readonly type: string }>(entries: readonly E[], families: DisplayFamilies): E[] {
	return entries.flatMap((entry) => sharedDisplayStorageKinds(entry.type, families).map((type) => ({ ...entry, type })));
}

export function physicalDisplayKind(display: string, storage: string | undefined, families: DisplayFamilies): string {
	const members = sharedDisplayStorageKinds(display, families);
	return storage !== undefined && members.includes(storage) ? storage : display;
}
