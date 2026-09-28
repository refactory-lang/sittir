import type { NodeMap, LinkedRefineForm, NarrowedField } from '../compiler/types.ts';
import type { AssembledNode } from '../compiler/model/node-map.ts';
import { pascalCase } from '../compiler/model/casing.ts';

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
