/**
 * readNode — one-level-deep tree reading, grammar-agnostic.
 *
 * Returns ALL children including anonymous tokens (named: false for operators,
 * delimiters, keywords). Every entry carries `nodeId` for O(1) drill-in via
 * `tree.nodeById()`.
 *
 * When a `RoutingMap` is provided, children whose kind matches an override
 * entry are promoted to `fields` under the override's field name — both
 * named and anonymous tokens. Two routing paths:
 *
 * 1. **Unambiguous** (~95%): direct kind → field lookup. Covers all kinds
 *    that appear in exactly one slot, including anonymous tokens.
 * 2. **Ambiguous** (~5%): position-based consumption for kinds that appear
 *    in multiple slots (e.g. `_expression` in `start` + `end`). Only named
 *    children reach this path — anonymous tokens are always unambiguous.
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
	position: number;
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
// Precomputed routing maps
// ---------------------------------------------------------------------------

interface FieldPromotion {
	fieldName: string;
	multiple: boolean;
}

interface NodeRoutingMaps {
	/** Kind → field for kinds that appear in exactly one slot. */
	unambiguous: ReadonlyMap<string, FieldPromotion>;
	/** Kinds that appear in multiple slots — need position-based routing. */
	ambiguousKinds: ReadonlySet<string>;
	/** Position-ordered slots for ambiguous kinds: [fieldName, spec]. */
	ambiguousSlots: readonly [string, OverrideFieldSpec][];
}

/**
 * Precomputed routing: nodeKind → NodeRoutingMaps.
 * Built once from OverridesConfig, used by every readNode call.
 */
export type RoutingMap = ReadonlyMap<string, NodeRoutingMaps>;

/** @deprecated Use RoutingMap instead */
export type FieldPromotionMap = RoutingMap;

function buildNodeRoutingMaps(nodeOverrides: NodeOverrides): NodeRoutingMaps {
	const unambiguous = new Map<string, FieldPromotion>();
	const ambiguousKinds = new Set<string>();
	const ambiguousSlots: [string, OverrideFieldSpec][] = [];

	// First pass: detect which kinds appear in multiple slots
	const kindToSlots = new Map<string, string[]>();
	for (const [fieldName, spec] of Object.entries(nodeOverrides.fields)) {
		for (const t of spec.types) {
			const existing = kindToSlots.get(t.type) ?? [];
			existing.push(fieldName);
			kindToSlots.set(t.type, existing);
		}
	}

	for (const [kind, slots] of kindToSlots) {
		if (slots.length > 1) ambiguousKinds.add(kind);
	}

	// Second pass: build maps
	for (const [fieldName, spec] of Object.entries(nodeOverrides.fields)) {
		const hasAmbiguous = spec.types.some(t => ambiguousKinds.has(t.type));
		if (hasAmbiguous) {
			ambiguousSlots.push([fieldName, spec]);
		} else {
			for (const t of spec.types) {
				unambiguous.set(t.type, { fieldName, multiple: spec.multiple });
			}
		}
	}

	ambiguousSlots.sort(([, a], [, b]) => a.position - b.position);
	return { unambiguous, ambiguousKinds, ambiguousSlots };
}

/**
 * Build a RoutingMap from an OverridesConfig.
 * Call once at startup; pass the result to readNode.
 */
export function buildRoutingMap(overrides: OverridesConfig): RoutingMap {
	const map = new Map<string, NodeRoutingMaps>();
	for (const [nodeKind, nodeSpec] of Object.entries(overrides)) {
		if (Object.keys(nodeSpec.fields).length > 0) {
			map.set(nodeKind, buildNodeRoutingMaps(nodeSpec));
		}
	}
	return map;
}

/** @deprecated Use buildRoutingMap instead */
export const buildFieldPromotionMap = buildRoutingMap;

/**
 * Read a single tree node one level deep.
 *
 * - Returns ALL children (named + anonymous)
 * - Every child carries `nodeId` for lazy drill-in
 * - No recursion — wrap.ts provides lazy getters
 * - When `routing` is provided, promotes children to fields via overrides
 *
 * @param tree - The tree handle for node lookup
 * @param nodeId - If provided, read this node; otherwise read the root
 * @param routing - Precomputed routing map (from buildRoutingMap)
 */
export function readNode(tree: TreeHandle, nodeId?: number, routing?: RoutingMap): AnyNodeData {
	const node = nodeId != null ? tree.nodeById(nodeId) : tree.rootNode;

	const fields: Record<string, AnyNodeData | AnyNodeData[]> = {};
	const children: AnyNodeData[] = [];

	const maps = routing?.get(node.type);
	const pendingAmbiguous: AnyNodeData[] = [];

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
		} else if (maps?.unambiguous.has(child.type)) {
			// Direct kind lookup — covers ~95% including anonymous tokens
			const { fieldName, multiple } = maps.unambiguous.get(child.type)!;
			if (multiple) {
				const arr = (fields[fieldName] ?? []) as AnyNodeData[];
				arr.push(entry);
				fields[fieldName] = arr;
			} else {
				fields[fieldName] = entry;
			}
		} else if (maps?.ambiguousKinds.has(child.type)) {
			pendingAmbiguous.push(entry);
		} else {
			children.push(entry);
		}
	}

	// Position-based consumption for ambiguous kinds only.
	// Only named children reach here — anonymous tokens are always unambiguous.
	if (pendingAmbiguous.length > 0 && maps) {
		let slotIdx = 0;
		for (const entry of pendingAmbiguous) {
			let placed = false;
			for (let s = slotIdx; s < maps.ambiguousSlots.length; s++) {
				const [fieldName, spec] = maps.ambiguousSlots[s]!;
				if (spec.types.some(t => t.type === entry.type)) {
					if (spec.multiple) {
						const arr = (fields[fieldName] ?? []) as AnyNodeData[];
						arr.push(entry);
						fields[fieldName] = arr;
					} else {
						fields[fieldName] = entry;
						slotIdx = s + 1;
					}
					placed = true;
					break;
				}
				slotIdx = s + 1;
			}
			if (!placed) children.push(entry);
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
