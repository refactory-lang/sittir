/**
 * Shared utilities for codegen emitters.
 */

import type { NodeModel, BranchModel, LeafWithChildrenModel, LeafModel, KeywordModel, TokenModel, SupertypeModel, FieldModel } from '../grammar-model.ts';

export type StructuralNode = BranchModel | LeafWithChildrenModel;

// ---------------------------------------------------------------------------
// NodeModel filtering
// ---------------------------------------------------------------------------

export function structuralNodes(nodes: NodeModel[]): StructuralNode[] {
	return nodes.filter((n): n is StructuralNode => n.modelType === 'branch' || n.modelType === 'leafWithChildren');
}

export function branchModels(nodes: NodeModel[]): BranchModel[] {
	return nodes.filter((n): n is BranchModel => n.modelType === 'branch');
}

export function leafModels(nodes: NodeModel[]): LeafModel[] {
	return nodes.filter((n): n is LeafModel => n.modelType === 'leaf');
}

export function keywordModels(nodes: NodeModel[]): KeywordModel[] {
	return nodes.filter((n): n is KeywordModel => n.modelType === 'keyword');
}

export function tokenModels(nodes: NodeModel[]): TokenModel[] {
	return nodes.filter((n): n is TokenModel => n.modelType === 'token');
}

export function supertypeModels(nodes: NodeModel[]): SupertypeModel[] {
	return nodes.filter((n): n is SupertypeModel => n.modelType === 'supertype');
}

// ---------------------------------------------------------------------------
// Derived collections
// ---------------------------------------------------------------------------

export function leafKindsOf(nodes: NodeModel[]): string[] {
	const kinds: string[] = [];
	for (const n of nodes) {
		if (n.modelType === 'leaf' || n.modelType === 'keyword') kinds.push(n.kind);
	}
	return kinds;
}

export function keywordKindsOf(nodes: NodeModel[]): Map<string, string> {
	const map = new Map<string, string>();
	for (const n of nodes) {
		if (n.modelType === 'keyword') map.set(n.kind, n.text);
	}
	return map;
}

export function leafValuesOf(nodes: NodeModel[]): Map<string, string[]> {
	const map = new Map<string, string[]>();
	for (const n of nodes) {
		if (n.modelType === 'leaf' && n.values && n.values.length > 0) {
			map.set(n.kind, n.values);
		}
	}
	return map;
}

export function keywordTokensOf(nodes: NodeModel[]): string[] {
	const tokens: string[] = [];
	for (const n of nodes) {
		if (n.modelType === 'token' && /^[a-z_]+$/i.test(n.kind)) tokens.push(n.kind);
	}
	return tokens;
}

export function operatorTokensOf(nodes: NodeModel[]): string[] {
	const tokens: string[] = [];
	for (const n of nodes) {
		if (n.modelType === 'token' && !/^[a-z_]+$/i.test(n.kind)) tokens.push(n.kind);
	}
	return tokens;
}

export function supertypeEntriesOf(nodes: NodeModel[]): { name: string; subtypes: string[] }[] {
	return supertypeModels(nodes).map(s => ({ name: s.kind, subtypes: s.subtypes }));
}

export function enumKindsOf(nodes: NodeModel[]): { kind: string; values: string[] }[] {
	const result: { kind: string; values: string[] }[] = [];
	for (const n of nodes) {
		if (n.modelType === 'leaf' && n.values && n.values.length > 0) {
			result.push({ kind: n.kind, values: n.values });
		}
	}
	return result;
}

// ---------------------------------------------------------------------------
// StructuralNode helpers
// ---------------------------------------------------------------------------

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
