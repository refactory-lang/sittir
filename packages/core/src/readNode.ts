/**
 * readNode — one-level-deep tree reading, grammar-agnostic.
 *
 * Returns ALL children including anonymous tokens (named: false for operators,
 * delimiters, keywords). Every entry carries `nodeId` for O(1) drill-in via
 * `tree.nodeById()`.
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
 * Read a single tree node one level deep.
 *
 * - Returns ALL children (named + anonymous)
 * - Every child carries `nodeId` for lazy drill-in
 * - No recursion — wrap.ts provides lazy getters
 *
 * @param tree - The tree handle for node lookup
 * @param nodeId - If provided, read this node; otherwise read the root
 */
export function readNode(tree: TreeHandle, nodeId?: number): AnyNodeData {
	const node = nodeId != null ? tree.nodeById(nodeId) : tree.rootNode;

	const fields: Record<string, AnyNodeData> = {};
	const children: AnyNodeData[] = [];

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
