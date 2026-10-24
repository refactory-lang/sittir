import type { FactorySlotMeta } from './factory-map.ts';
import { slotPropertyName } from '../compiler/model/node-map.ts';

export interface WrittenValue {
	readonly kind?: string;
	readonly multiplicity?: string;
	readonly name?: string;
	readonly parseKind?: string;
}

export interface WrittenSlot {
	readonly name: string;
	readonly required?: boolean;
	readonly multiple?: boolean;
	readonly nonEmpty?: boolean;
	readonly registered?: boolean;
	readonly optionDefault?: number | string;
	readonly separator?: { readonly default?: number };
	readonly values?: readonly WrittenValue[];
}

export function valueNameOf(value: WrittenValue): string | undefined {
	return value.name ?? value.parseKind;
}

export function slotKindsOf(slot: WrittenSlot): string[] {
	const kinds = new Set<string>();
	for (const value of slot.values ?? []) {
		const name = value.kind === 'node-ref' ? valueNameOf(value) : undefined;
		if (name !== undefined) kinds.add(name);
	}
	return [...kinds];
}

export function factorySlotMetaOf(slot: WrittenSlot): FactorySlotMeta {
	return {
		propertyName: slotPropertyName(slot),
		required: slot.required === true,
		multiple: slot.multiple === true,
		nonEmpty: slot.nonEmpty === true,
		...(slot.registered === undefined ? {} : { registered: slot.registered }),
		...(slot.optionDefault === undefined ? {} : { optionDefault: slot.optionDefault }),
		...(slot.separator === undefined ? {} : { separator: slot.separator })
	};
}
