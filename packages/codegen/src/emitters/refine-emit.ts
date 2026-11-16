import type { NodeMap, LinkedRefineForm, NarrowedField } from '../compiler/types.ts';
import { AbstractAssembledCompound, type AssembledNode } from '../compiler/model/node-map.ts';
import { pascalCase } from '../compiler/model/casing.ts';
import { fixedTextOfKind } from '../compiler/model/node-map.ts';
import { emitShapeFailure } from '../compiler/diagnostics/emit-diagnostics.ts';

export interface RefineKindInfo {
	readonly kind: string;
	readonly typeName: string;
	readonly node: AssembledNode;
	readonly forms: readonly RefineFormInfo[];
}

export interface RefineFormInfo {
	readonly name: string;
	readonly form: LinkedRefineForm;
	readonly narrowedFields: readonly NarrowedField[];
}

export function collectRefineKindInfos(nodeMap: NodeMap): RefineKindInfo[] | undefined {
	const forms = nodeMap.refineForms;
	if (!forms || forms.size === 0) return undefined;
	const out: RefineKindInfo[] = [];
	for (const [kind, kindForms] of forms) {
		const node = nodeMap.nodes.get(kind);
		if (!node) continue;
		const infos: RefineFormInfo[] = kindForms.map((form) => ({
			name: form.name,
			form,
			narrowedFields: form.narrowedFields
		}));
		out.push({ kind, typeName: node.typeName, node, forms: infos });
	}
	return out;
}

export function refineFormTypeName(parentTypeName: string, formName: string): string {
	return `${parentTypeName}${pascalCase(formName)}`;
}

export function refineFormFactoryName(baseFactoryName: string, formName: string): string {
	return `${baseFactoryName}${pascalCase(formName)}`;
}

export function narrowedLiteralsOf(form: RefineFormInfo, nodeMap: NodeMap, ownerKind: string): Map<string, string> {
	const fail = (field: NarrowedField, message: string): never => {
		throw emitShapeFailure({ code: 'refine-config-invalid', ownerKind, slotName: field.fieldName, message });
	};
	return new Map(
		form.narrowedFields.map((field) => {
			if (field.via === 'literal') return [field.fieldName, field.literal] as const;
			if (field.via === 'arm') {
				const text = fixedTextOfKind(nodeMap.nodes.get(field.arm));
				if (text === undefined)
					return fail(field, `refine form '${form.name}': '${ownerKind}.${field.fieldName}' selects the node arm '${field.arm}', which has no fixed text`);
				return [field.fieldName, text] as const;
			}
			const armTexts = field.nodeArms.flatMap((arm) => fixedTextOfKind(nodeMap.nodes.get(arm)) ?? []);
			if (!armTexts.includes(field.text)) {
				const available = [...field.stringTexts, ...armTexts].map((text) => `'${text}'`).join(', ');
				return fail(field, `refine form '${form.name}': path '${field.path}' of '${ownerKind}.${field.fieldName}' selection '${field.text}' matches no string arm or fixed-text node arm (available: ${available})`);
			}
			return [field.fieldName, field.text] as const;
		})
	);
}

export interface RefineDefault {
	readonly form: LinkedRefineForm;
	readonly pinned: ReadonlyMap<string, string>;
	readonly pinnedProperties: readonly string[];
}

export function refineDefaultOf(nodeMap: NodeMap, kind: string): RefineDefault | undefined {
	const defaultName = nodeMap.refineDefaults?.get(kind);
	if (defaultName === undefined) return undefined;
	const form = nodeMap.refineForms?.get(kind)?.find((candidate) => candidate.name === defaultName);
	const node = nodeMap.nodes.get(kind);
	if (form === undefined || !(node instanceof AbstractAssembledCompound)) return undefined;
	const pinned = narrowedLiteralsOf({ name: form.name, form, narrowedFields: form.narrowedFields }, nodeMap, kind);
	if (pinned.size === 0) throw emitShapeFailure({ code: 'refine-config-invalid', ownerKind: kind, slotName: defaultName, message: `refine(${kind}): default '${defaultName}' pins no field` });
	return { form, pinned, pinnedProperties: node.slots.filter((slot) => pinned.has(slot.name)).map((slot) => slot.propertyName) };
}

export function omittableWithDefault(fullConfig: string, pinnedProperties: readonly string[]): string {
	return `OmitEach<${fullConfig}, ${pinnedProperties.map((name) => JSON.stringify(name)).join(' | ')}> | ${fullConfig}`;
}
