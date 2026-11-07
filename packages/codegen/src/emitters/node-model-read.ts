import type { FactorySlotMeta } from './factory-map.ts';
import type { DelimiterFacetRole } from '../compiler/model/node-map.ts';

export interface WrittenValue {
	readonly kind?: string;
	readonly multiplicity?: string;
	readonly name?: string;
	readonly parseKind?: string;
	readonly value?: string;
	readonly canonical?: string;
}

export interface WrittenSlot {
	readonly name: string;
	readonly accessor: string;
	readonly required?: boolean;
	readonly multiple?: boolean;
	readonly nonEmpty?: boolean;
	readonly registered?: boolean;
	readonly blank?: boolean;
	readonly optionDefault?: number | string;
	readonly separator?: { readonly default?: number };
	readonly delimiterRole?: DelimiterFacetRole;
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
		propertyName: slot.accessor,
		required: slot.required === true,
		multiple: slot.multiple === true,
		nonEmpty: slot.nonEmpty === true,
		...(slot.registered === undefined ? {} : { registered: slot.registered }),
		...(slot.blank === undefined ? {} : { blank: slot.blank }),
		...(slot.optionDefault === undefined ? {} : { optionDefault: slot.optionDefault }),
		...(slot.separator === undefined ? {} : { separator: slot.separator }),
		...(slot.delimiterRole === undefined ? {} : { delimiterRole: slot.delimiterRole }),
		...spellingsOf(slot)
	};
}

function spellingsOf(slot: WrittenSlot): Pick<FactorySlotMeta, 'spellings'> {
	const spelled = (slot.values ?? []).flatMap((value) => (value.value !== undefined && value.canonical !== undefined ? [[value.value, value.canonical] as const] : []));
	return spelled.length === 0 ? {} : { spellings: Object.fromEntries(spelled) };
}
