import type { NodeMap, LinkedRefineForm, NarrowedField } from '../compiler/types.ts';
import type { AssembledNode } from '../compiler/model/node-map.ts';
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
}

export function refineDefaultOf(nodeMap: NodeMap, kind: string): RefineDefault | undefined {
	const forms = nodeMap.refineForms?.get(kind);
	const defaultName = forms?.find((form) => form.defaultName !== undefined)?.defaultName;
	const form = forms?.find((candidate) => candidate.name === defaultName);
	if (form === undefined) return undefined;
	const pinned = narrowedLiteralsOf({ name: form.name, form, narrowedFields: form.narrowedFields }, nodeMap, kind);
	return pinned.size === 0 ? undefined : { form, pinned };
}

export function omittableWithDefault(fullConfig: string, pinnedProperties: readonly string[]): string {
	return `Omit<${fullConfig}, ${pinnedProperties.map((name) => JSON.stringify(name)).join(' | ')}> | ${fullConfig}`;
}
