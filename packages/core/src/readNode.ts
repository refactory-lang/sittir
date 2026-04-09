/**
 * readNode — one-level-deep tree reading, grammar-agnostic.
 *
 * Returns ALL children including anonymous tokens (named: false for operators,
 * delimiters, keywords). Every entry carries `nodeId` for O(1) drill-in via
 * `tree.nodeById()`.
 *
 * When a `FieldPromotionMap` is provided, unnamed children whose kind matches
 * an override entry are promoted to `fields` under the override's field name.
 * This replaces the need for assign.ts — overrides.json drives field
 * promotion directly.
 *
 * No recursion — lazy getters in wrap.ts call readNode again when needed.
 */

import type { AnyNodeData, AnyTreeNode } from './types.ts';

/**
 * A handle to the parsed tree, providing node lookup by id.
 * Structurally compatible with ast-grep SgRoot and tree-sitter Tree.
 */
export interface TreeHandle {
	/** Look up a node by its numeric id (O(1)). */
	nodeById(id: number): AnyTreeNode;
	/** The root node of the tree. */
	rootNode: AnyTreeNode;
}

/**
 * Override field spec — matches overrides.json shape per field.
 */
export interface OverrideFieldSpec {
	types: readonly { type: string; named: boolean }[];
	multiple: boolean;
	required: boolean;
}

/**
 * Per-node override config — maps field names to their specs.
 */
export interface NodeOverrides {
	fields: Record<string, OverrideFieldSpec>;
}

/**
 * Full overrides config — maps node kind to its override spec.
 * Loaded from overrides.json per language package.
 */
export type OverridesConfig = Record<string, NodeOverrides>;

// ---------------------------------------------------------------------------
// Precomputed field promotion map
// ---------------------------------------------------------------------------

interface FieldPromotion {
	fieldName: string;
	multiple: boolean;
}

/**
 * Precomputed lookup: nodeKind → (childKind → FieldPromotion).
 * Built once from OverridesConfig, used by every readNode call.
 */
export type FieldPromotionMap = ReadonlyMap<string, ReadonlyMap<string, FieldPromotion>>;

/**
 * Build a FieldPromotionMap from an OverridesConfig.
 * Call once at startup; pass the result to readNode.
 */
export function buildFieldPromotionMap(overrides: OverridesConfig): FieldPromotionMap {
	const outer = new Map<string, Map<string, FieldPromotion>>();
	for (const [nodeKind, nodeSpec] of Object.entries(overrides)) {
		const inner = new Map<string, FieldPromotion>();
		for (const [fieldName, fieldSpec] of Object.entries(nodeSpec.fields)) {
			const promotion: FieldPromotion = { fieldName, multiple: fieldSpec.multiple };
			for (const t of fieldSpec.types) {
				inner.set(t.type, promotion);
			}
		}
		if (inner.size > 0) outer.set(nodeKind, inner);
	}
	return outer;
}

/**
 * Read a single tree node one level deep.
 *
 * - Returns ALL children (named + anonymous)
 * - Every child carries `nodeId` for lazy drill-in
 * - No recursion — wrap.ts provides lazy getters
 * - When `promotions` is provided, promotes unnamed children to fields
 *
 * @param tree - The tree handle for node lookup
 * @param nodeId - If provided, read this node; otherwise read the root
 * @param promotions - Precomputed field promotion map (from buildFieldPromotionMap)
 */
export function readNode(tree: TreeHandle, nodeId?: number, promotions?: FieldPromotionMap): AnyNodeData {
	const node = nodeId != null ? tree.nodeById(nodeId) : tree.rootNode;

	const fields: Record<string, AnyNodeData | AnyNodeData[]> = {};
	const children: AnyNodeData[] = [];

	const kindToField = promotions?.get(node.type);

	const allChildren = node.children();
	for (let i = 0; i < allChildren.length; i++) {
		const child = allChildren[i]!;

		const entry: AnyNodeData = {
			type: child.type,
			text: child.text(),
			span: { start: child.range().start.index, end: child.range().end.index },
			nodeId: child.id(),
			named: child.isNamed(),
		};

		const fname = (node as any).fieldNameForChild?.(i) as string | null | undefined;
		if (fname) {
			fields[fname] = entry;
		} else if (child.isNamed() && kindToField?.has(child.type)) {
			const { fieldName, multiple } = kindToField.get(child.type)!;
			if (multiple) {
				if (!fields[fieldName]) fields[fieldName] = [];
				(fields[fieldName] as AnyNodeData[]).push(entry);
			} else {
				fields[fieldName] = entry;
			}
		} else {
			children.push(entry);
		}
	}

	return {
		type: node.type,
		text: node.text(),
		fields: Object.keys(fields).length > 0 ? fields : undefined,
		children: children.length > 0 ? children : undefined,
		span: { start: node.range().start.index, end: node.range().end.index },
		nodeId: node.id(),
		named: node.isNamed(),
	};
}
