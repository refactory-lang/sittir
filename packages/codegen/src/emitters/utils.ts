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
 *   - Multiple collapsed types → try common base (e.g. [Expression, Statement] → expressionOrStatement)
 *   - Reserved name collision (e.g. 'type') → prefix with 'child' (e.g. childType)
 *   - Duplicate names across slots → append 1-based index (expression1, expression2)
 *   - No inferrable name → children{index} fallback
 */
// Reserved property names that cannot be used as child slot names
const RESERVED_SLOT_NAMES = new Set(['type', 'text', 'fields', 'children', 'render', 'toEdit', 'replace']);

export function childSlotNames(children: HydratedChildrenModel, ctx: ProjectionContext): string[] {
	if (!isTupleChildren(children)) return ['children'];

	// Compute candidate name per slot
	// Priority: 1) raw kind as role name (if single supertype/kind), 2) collapsed projection
	const candidates = children.map(slot => {
		const rawKinds = slot.kinds.map(k => k.kind);
		// Single raw kind → use as role name directly (e.g., "expression", "type", "pattern")
		if (rawKinds.length === 1) {
			const role = rawKinds[0]!.replace(/^_/, ''); // strip hidden prefix
			const camel = snakeToCamel(role);
			if (!RESERVED_SLOT_NAMES.has(camel)) return camel;
		}
		// Fall back to projection-based naming
		const proj = projectKinds(slot.kinds, ctx);
		return inferSlotName(proj.collapsedTypes);
	});

	// Count occurrences of each candidate
	const counts = new Map<string, number>();
	for (const name of candidates) {
		if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
	}

	// Assign final names — append 1-based index for duplicates
	const seen = new Map<string, number>();
	return candidates.map((name, i) => {
		if (!name) return `children${i + 1}`;
		if (counts.get(name)! > 1) {
			const idx = (seen.get(name) ?? 0) + 1;
			seen.set(name, idx);
			return `${name}${idx}`;
		}
		return name;
	});
}

/** Infer a camelCase property name from collapsed type names. */
function inferSlotName(collapsedTypes: string[]): string | null {
	if (collapsedTypes.length === 0) return null;

	if (collapsedTypes.length === 1) {
		const camel = lcfirst(collapsedTypes[0]!);
		if (!RESERVED_SLOT_NAMES.has(camel)) return camel;
		// Reserved collision → prefix with 'child' (e.g. 'type' → 'childType')
		return `child${collapsedTypes[0]!}`;
	}

	// Multiple types: if 2-3 types, join with 'Or' (e.g. expressionOrStatement)
	if (collapsedTypes.length <= 3) {
		const joined = collapsedTypes.map((t, i) => i === 0 ? lcfirst(t) : t).join('Or');
		if (!RESERVED_SLOT_NAMES.has(joined) && joined.length <= 40) return joined;
	}

	return null;
}

function lcfirst(s: string): string {
	return s.charAt(0).toLowerCase() + s.slice(1);
}

function snakeToCamel(s: string): string {
	return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
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
