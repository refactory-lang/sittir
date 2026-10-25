import type { QuerySlotEntry, StructureRow } from '@sittir/types';

export interface BuilderInputs {
	readonly config: Readonly<Record<string, unknown>>;
	readonly options: Readonly<Record<string, unknown>>;
	readonly elements: readonly unknown[] | undefined;
}

export function builderInputs(slots: readonly QuerySlotEntry[], shape: StructureRow | undefined, read: (accessor: string) => unknown): BuilderInputs {
	const optionKeys = new Set(shape?.options ?? []);
	const positional = shape?.lists?.find(([, , arrival]) => typeof arrival === 'number')?.[0];
	const config: Record<string, unknown> = {};
	const options: Record<string, unknown> = {};
	let elements: readonly unknown[] | undefined = positional === undefined ? undefined : [];
	for (const [accessor] of slots) {
		const value = read(accessor);
		if (value === undefined) continue;
		if (accessor === positional) elements = value as readonly unknown[];
		else if (optionKeys.has(accessor)) options[accessor] = value;
		else config[accessor] = value;
	}
	return { config, options, elements };
}

export function builderArgs({ config, options, elements }: BuilderInputs): readonly unknown[] {
	const hasOptions = Object.keys(options).length > 0;
	if (elements !== undefined) return hasOptions ? [options, ...elements] : elements;
	return hasOptions ? [config, options] : [config];
}
