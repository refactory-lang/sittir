/**
 * Shared utilities for codegen emitters.
 */

import type { BranchModel, LeafWithChildrenModel, FieldModel } from '../grammar-model.ts';

export type StructuralNode = BranchModel | LeafWithChildrenModel;

/** Get fields from a structural node (empty for leafWithChildren) */
export function fieldsOf(node: StructuralNode): FieldModel[] {
	return node.modelType === 'branch' ? node.fields : [];
}

/**
 * Select the constructor field — the most important required field.
 * Used as the first positional argument in the factory.
 */
export function selectConstructorField(node: StructuralNode): FieldModel | null {
	const fields = fieldsOf(node);
	// Prefer single required, non-multiple field
	const required = fields.filter(f => f.required && !f.multiple);
	if (required.length === 1) return required[0]!;

	// If multiple required, pick 'name' if available
	const name = required.find(f => f.name === 'name');
	if (name) return name;

	// Fall back to first required
	return required[0] ?? null;
}

/** Escape backslashes, quotes, and control characters for embedding in generated string literals. */
export function escapeString(s: string): string {
	return s
		.replace(/\\/g, '\\\\')
		.replace(/'/g, "\\'")
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '\\r')
		.replace(/\t/g, '\\t');
}
