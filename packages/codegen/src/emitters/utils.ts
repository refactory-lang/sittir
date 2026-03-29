/**
 * Shared utilities for codegen emitters.
 */

import type {
	HydratedNodeModel,
	HydratedBranchModel,
	HydratedContainerModel,
	HydratedLeafModel,
	HydratedEnumModel,
	HydratedKeywordModel,
	HydratedTokenModel,
	HydratedSupertypeModel,
	HydratedFieldModel,
	HydratedChildrenModel,
} from '../node-model.ts';
import { isTupleChildren } from '../node-model.ts';
import { projectKinds, type ProjectionContext } from './kind-projections.ts';

export type StructuralNode = HydratedBranchModel | HydratedContainerModel;

// ---------------------------------------------------------------------------
// NodeModel filtering
// ---------------------------------------------------------------------------

export function structuralNodes(nodes: HydratedNodeModel[]): StructuralNode[] {
	return nodes.filter((n): n is StructuralNode => n.modelType === 'branch' || n.modelType === 'container');
}

export function branchModels(nodes: HydratedNodeModel[]): HydratedBranchModel[] {
	return nodes.filter((n): n is HydratedBranchModel => n.modelType === 'branch');
}

export function leafModels(nodes: HydratedNodeModel[]): (HydratedLeafModel | HydratedEnumModel)[] {
	return nodes.filter((n): n is HydratedLeafModel | HydratedEnumModel => n.modelType === 'leaf' || n.modelType === 'enum');
}

export function keywordModels(nodes: HydratedNodeModel[]): HydratedKeywordModel[] {
	return nodes.filter((n): n is HydratedKeywordModel => n.modelType === 'keyword');
}

export function tokenModels(nodes: HydratedNodeModel[]): HydratedTokenModel[] {
	return nodes.filter((n): n is HydratedTokenModel => n.modelType === 'token');
}

export function supertypeModels(nodes: HydratedNodeModel[]): HydratedSupertypeModel[] {
	return nodes.filter((n): n is HydratedSupertypeModel => n.modelType === 'supertype');
}

// ---------------------------------------------------------------------------
// Derived collections
// ---------------------------------------------------------------------------

export function leafKindsOf(nodes: HydratedNodeModel[]): string[] {
	const kinds: string[] = [];
	for (const n of nodes) {
		if (n.modelType === 'leaf' || n.modelType === 'keyword' || n.modelType === 'enum') kinds.push(n.kind);
	}
	return kinds;
}

export function keywordKindsOf(nodes: HydratedNodeModel[]): Map<string, string> {
	const map = new Map<string, string>();
	for (const n of nodes) {
		if (n.modelType === 'keyword') map.set(n.kind, n.text);
	}
	return map;
}

export function leafValuesOf(nodes: HydratedNodeModel[]): Map<string, string[]> {
	const map = new Map<string, string[]>();
	for (const n of nodes) {
		if (n.modelType === 'enum') {
			map.set(n.kind, [...n.values]);
		}
		if (n.modelType === 'leaf' && 'values' in n) {
			// LeafModel doesn't have values in new model (that's EnumModel)
			// but keep for safety
		}
	}
	return map;
}

export function keywordTokensOf(nodes: HydratedNodeModel[]): string[] {
	const tokens: string[] = [];
	for (const n of nodes) {
		if (n.modelType === 'token' && /^[a-z_]+$/i.test(n.kind)) tokens.push(n.kind);
	}
	return tokens;
}

export function operatorTokensOf(nodes: HydratedNodeModel[]): string[] {
	const tokens: string[] = [];
	for (const n of nodes) {
		if (n.modelType === 'token' && !/^[a-z_]+$/i.test(n.kind)) tokens.push(n.kind);
	}
	return tokens;
}

export function supertypeEntriesOf(nodes: HydratedNodeModel[]): { name: string; subtypes: string[] }[] {
	return supertypeModels(nodes).map(s => ({ name: s.kind, subtypes: [...s.subtypes] }));
}

export function enumKindsOf(nodes: HydratedNodeModel[]): { kind: string; values: string[] }[] {
	const result: { kind: string; values: string[] }[] = [];
	for (const n of nodes) {
		if (n.modelType === 'enum') {
			result.push({ kind: n.kind, values: [...n.values] });
		}
	}
	return result;
}

// ---------------------------------------------------------------------------
// StructuralNode helpers
// ---------------------------------------------------------------------------

/** Get fields from a structural node (empty for container) */
export function fieldsOf(node: StructuralNode): readonly HydratedFieldModel[] {
	return node.modelType === 'branch' ? node.fields : [];
}

/**
 * Select the constructor field — the most important required field.
 * Used as the first positional argument in the factory.
 */
export function selectConstructorField(node: StructuralNode): HydratedFieldModel | null {
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

/**
 * Derive meaningful names for positional child slots.
 *
 * Single-slot children → ['children'] (unchanged).
 * Tuple children → names derived from collapsed type projections:
 *   - 1 collapsed type → lcfirst (e.g. VisibilityModifier → visibilityModifier)
 *   - Duplicate names across slots → append 1-based index (expression1, expression2)
 *   - No single collapsed type → children{index} fallback
 */
export function childSlotNames(children: HydratedChildrenModel, ctx: ProjectionContext): string[] {
	if (!isTupleChildren(children)) return ['children'];

	// Compute candidate name per slot
	const candidates = children.map(slot => {
		const proj = projectKinds(slot.kinds, ctx);
		if (proj.collapsedTypes.length === 1) {
			const name = proj.collapsedTypes[0]!;
			return name.charAt(0).toLowerCase() + name.slice(1);
		}
		return null;
	});

	// Count occurrences of each candidate
	const counts = new Map<string, number>();
	for (const name of candidates) {
		if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
	}

	// Assign final names — append 1-based index for duplicates
	const seen = new Map<string, number>();
	return candidates.map((name, i) => {
		if (!name) return `children${i}`;
		if (counts.get(name)! > 1) {
			const idx = (seen.get(name) ?? 0) + 1;
			seen.set(name, idx);
			return `${name}${idx}`;
		}
		return name;
	});
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
