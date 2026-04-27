/**
 * emitters/refine-emit.ts — shared helpers for ADR-0010 phase 2
 * per-form factory + Config emission.
 *
 * Both types.ts and factories.ts need the same naming scheme for
 * per-form types (`InterfaceBodyCurly`), fluent-case short names,
 * and the narrowed-field computation (which field names the form's
 * selections auto-stamp). Living in a small shared module avoids a
 * walker-per-emitter duplication.
 */

import type { NodeMap, RefineForm } from "../compiler/types.ts";
import type { AssembledNode } from "../compiler/node-map.ts";
import { narrowedFieldLiteralsForForm } from "../compiler/link-refine.ts";

/**
 * Per-kind refine descriptor collected once, consumed by every emitter
 * that needs to walk the forms. Exposes the field-literal narrowing
 * per form so downstream emission doesn't re-walk the rule tree.
 */
export interface RefineKindInfo {
	readonly kind: string;
	readonly typeName: string;
	readonly node: AssembledNode;
	readonly forms: readonly RefineFormInfo[];
}

export interface RefineFormInfo {
	readonly name: string;
	readonly form: RefineForm;
	/** Per-form field narrowings: each entry says "in this form, field
	 *  `fieldName` should be narrowed to the literal `literal`". */
	readonly narrowedFields: ReadonlyArray<{ fieldName: string; literal: string }>;
}

/**
 * Collect refine metadata for every kind that carries forms, walking
 * each form's paths against the assembled rule tree to precompute the
 * narrowed field-literal pairs. Returns `undefined` when the grammar
 * has no refine metadata.
 *
 * @remarks
 * Path resolution at emit time reads the post-Link rule map (stored on
 * `NodeMap.rules`). Forms that don't resolve to field-wrapped choices
 * contribute an empty `narrowedFields` list — the form's factory still
 * exists but narrows nothing at the Config surface, which is the
 * intended behavior for selections that target anonymous structural
 * literals.
 */
export function collectRefineKindInfos(nodeMap: NodeMap): RefineKindInfo[] | undefined {
	const forms = nodeMap.refineForms;
	if (!forms || forms.size === 0) return undefined;
	const out: RefineKindInfo[] = [];
	for (const [kind, kindForms] of forms) {
		const node = nodeMap.nodes.get(kind);
		if (!node) continue;
		const rule = nodeMap.rules?.[kind];
		const infos: RefineFormInfo[] = [];
		for (const form of kindForms) {
			const narrowed = rule ? narrowedFieldLiteralsForForm(rule, form) : [];
			infos.push({ name: form.name, form, narrowedFields: narrowed });
		}
		out.push({ kind, typeName: node.typeName, node, forms: infos });
	}
	return out;
}

/**
 * PascalCase a form name for type / factory naming. Treats `_` as a
 * word boundary so `snake_case` forms pascal-case correctly.
 */
export function pascalCase(s: string): string {
	return s
		.split(/[_\s-]+/)
		.filter((p) => p.length > 0)
		.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
		.join("");
}

/**
 * camelCase a form name for fluent-key naming on the parent namespace
 * (e.g. `ir.interfaceBody.curly`).
 */
export function camelCase(s: string): string {
	const parts = s.split(/[_\s-]+/).filter((p) => p.length > 0);
	if (parts.length === 0) return s;
	return (
		parts[0]!.charAt(0).toLowerCase() +
		parts[0]!.slice(1) +
		parts
			.slice(1)
			.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
			.join("")
	);
}

/**
 * Per-form TS type name: `<ParentTypeName><FormPascal>`.
 * Example: `InterfaceBody` + `curly` → `InterfaceBodyCurly`.
 */
export function refineFormTypeName(parentTypeName: string, formName: string): string {
	return `${parentTypeName}${pascalCase(formName)}`;
}

/**
 * Per-form factory function name: `<kind-camel><FormPascal>`, matching
 * the base factory-naming convention already used for polymorph forms.
 */
export function refineFormFactoryName(baseFactoryName: string, formName: string): string {
	return `${baseFactoryName}${pascalCase(formName)}`;
}
