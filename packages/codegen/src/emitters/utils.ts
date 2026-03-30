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
import { isTupleChildren, eachChildSlot } from '../node-model.ts';
import { toFieldName } from '../naming.ts';
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
 * Compression info for a .from() single-slot shorthand.
 * When a node has exactly 1 required slot (field or child), the .from() API
 * can accept the slot's value directly without wrapping in a config object.
 */
export interface CompressionInfo {
	/** Property name in the config object (camelCase field name or child slot name) */
	propName: string;
	/** Whether all accepted kinds are leaf types (enables string/scalar shorthand) */
	scalar: boolean;
}

/**
 * Detect single-slot compression eligibility for .from() API.
 *
 * A node qualifies when it has exactly 1 required non-multiple slot total
 * (either a field or a child). Compressibility (drop field name) and
 * scalarness (drop kind wrapper) are orthogonal:
 *
 *   - Compressible: `ir.constBlock.from(block)` instead of `{ body: block }`
 *   - Scalar: `ir.modItem.from('main')` instead of `{ name: 'main' }`
 *   - Both: `ir.modItem.from('main')` resolves string → identifier → name field
 *
 * Compression chains recursively through .from() — if `block` is itself
 * compressible, `ir.constBlock.from([stmt1, stmt2])` works because:
 *   1. constBlock wraps as `{ body: [stmt1, stmt2] }`
 *   2. body resolver calls `blockFrom([stmt1, stmt2])`
 *   3. blockFrom handles the array
 */
export function singleSlotCompression(node: StructuralNode, ctx: ProjectionContext): CompressionInfo | null {
	const fields = fieldsOf(node);
	const requiredFields = fields.filter(f => f.required && !f.multiple);

	// Count required children
	let requiredChildCount = 0;
	let requiredChild: { slot: { kinds: readonly HydratedNodeModel[]; required: boolean; multiple: boolean }; name: string } | null = null;
	if (node.children != null) {
		const slotNames = childSlotNames(node.children, ctx);
		eachChildSlot(node.children, (slot, i) => {
			if (slot.required && !slot.multiple) {
				requiredChildCount++;
				requiredChild = { slot, name: slotNames[i]! };
			}
		});
	}

	const totalRequired = requiredFields.length + requiredChildCount;
	if (totalRequired !== 1) return null;

	// Single required field, no required children
	if (requiredFields.length === 1) {
		const field = requiredFields[0]!;
		const propName = field.propertyName ?? toFieldName(field.name);
		const scalar = field.kinds.every(k => ctx.leafKinds.has(k.kind));
		return { propName, scalar };
	}

	// Single required child, no required fields
	if (requiredChild) {
		const { slot, name } = requiredChild;
		const scalar = slot.kinds.every((k: HydratedNodeModel) => ctx.leafKinds.has(k.kind));
		return { propName: name, scalar };
	}

	return null;
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
// Reserved property names that cannot be used as child slot names
const RESERVED_SLOT_NAMES = new Set(['type', 'text', 'fields', 'render', 'toEdit', 'replace']);

export function childSlotNames(children: HydratedChildrenModel, ctx: ProjectionContext): string[] {
	if (!isTupleChildren(children)) return ['children'];

	// Compute candidate name per slot
	const candidates = children.map(slot => {
		const proj = projectKinds(slot.kinds, ctx);
		if (proj.collapsedTypes.length === 1) {
			const name = proj.collapsedTypes[0]!;
			const camel = name.charAt(0).toLowerCase() + name.slice(1);
			if (RESERVED_SLOT_NAMES.has(camel)) return null;
			return camel;
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
