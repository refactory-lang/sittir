import type { NodeMap, LinkedRefineForm, NarrowedField } from '../compiler/types.ts';
import type { AssembledNode } from '../compiler/model/node-map.ts';

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
		const infos: RefineFormInfo[] = kindForms.map((form) => ({ name: form.name, form, narrowedFields: form.narrowedFields }));
		out.push({ kind, typeName: node.typeName, node, forms: infos });
	}
	return out;
}

export function pascalCase(s: string): string {
	return s
		.split(/[_\s-]+/)
		.filter((p) => p.length > 0)
		.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
		.join('');
}

export function camelCase(s: string): string {
	const parts = s.split(/[_\s-]+/).filter((p) => p.length > 0);
	if (parts.length === 0) return s;
	return (
		parts[0]!.charAt(0).toLowerCase() +
		parts[0]!.slice(1) +
		parts
			.slice(1)
			.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
			.join('')
	);
}

export function refineFormTypeName(parentTypeName: string, formName: string): string {
	return `${parentTypeName}${pascalCase(formName)}`;
}

export function refineFormFactoryName(baseFactoryName: string, formName: string): string {
	return `${baseFactoryName}${pascalCase(formName)}`;
}
