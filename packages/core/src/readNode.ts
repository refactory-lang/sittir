/**
 * readNode — one-level-deep tree reading, grammar-agnostic.
 *
 * Returns ALL children including anonymous tokens (named: false for operators,
 * delimiters, keywords). Every entry carries `nodeId` for O(1) drill-in via
 * `tree.nodeById()`.
 *
 * Field placement comes from tree-sitter's own `fieldNameForChild(i)` —
 * the grammar-author-declared field names. Anonymous identifier-shaped
 * tokens get promoted to keyword fields via `promoteAnonymousKeyword`.
 * No routing map: override-based kind-to-field routing is baked into
 * the compiled grammar at codegen time (overrides.ts → .sittir/grammar.js
 * → compiled parser), so tree-sitter itself surfaces those fields.
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
 * Promote any anonymous token to a field keyed by its text. Covers the
 * mechanical cases that tree-sitter's grammar normalizer strips — FIELD
 * wrappers around bare STRING literals and FIELDs inside CHOICE(X, BLANK).
 * Mirrors enrich's bareKeyword / optionalKeyword passes, applied to the
 * live parse tree without shape-checking — any anonymous child gets a
 * field named after its text (keywords, operators, delimiters alike).
 * Named children have their own kind and stay in the standard placement
 * path; anonymous collisions with an already-claimed field are skipped.
 *
 * Returns true when the token was promoted.
 */
function promoteAnonymousKeyword(
	child: AnyTreeNode,
	entry: AnyNodeData,
	fields: Record<string, AnyNodeData | AnyNodeData[]>,
): boolean {
	if (child.isNamed()) return false;
	const text = entry.$text ?? '';
	if (text.length === 0) return false;
	if (fields[text] !== undefined) return false;
	fields[text] = entry;
	return true;
}

/**
 * Read a single tree node one level deep.
 *
 * - Returns ALL children (named + anonymous)
 * - Every child carries `nodeId` for lazy drill-in
 * - No recursion — wrap.ts provides lazy getters
 * - Field placement uses tree-sitter's native `fieldNameForChild`
 *
 * @param tree - The tree handle for node lookup
 * @param nodeId - If provided, read this node; otherwise read the root
 */
export function readNode(tree: TreeHandle, nodeId?: number): AnyNodeData {
	const node = nodeId != null ? tree.nodeById(nodeId) : tree.rootNode;

	// `Object.create(null)` avoids prototype pollution on field names
	// that shadow Object.prototype members — `constructor` is the
	// concrete case (tree-sitter-typescript's `new_expression` has a
	// `field('constructor', ...)`), where a plain `{}` starts with
	// `fields.constructor === Object` and the multi-value detection
	// at existing-defined treats the prototype function as a prior
	// entry, corrupting the accumulated array with a null-serializing
	// function object. Others that can bite the same way: `toString`,
	// `hasOwnProperty`, `valueOf`, `__proto__`.
	const fields: Record<string, AnyNodeData | AnyNodeData[]> = Object.create(null);
	const children: AnyNodeData[] = [];

	const allChildren = node.children();
	for (let i = 0; i < allChildren.length; i++) {
		const child = allChildren[i]!;

		const entry: AnyNodeData = {
			$type: child.type,
			$source: 'ts',
			$text: child.text(),
			$span: { start: child.range().start.index, end: child.range().end.index },
			$nodeId: child.id(),
			$named: child.isNamed(),
		};

		const fname = node.fieldNameForChild?.(i);
		if (fname) {
			// Multi-valued fields (e.g. python's `argument` in
			// `print a, b, c` where each expression has the same
			// field name) must accumulate into an array instead of
			// overwriting. But collisions with an anonymous-keyword
			// placeholder (from promoteAnonymousKeyword earlier in
			// the loop — e.g. rust's `type_item` has an anonymous
			// `type` keyword child AND a named `type` field for the
			// RHS) aren't multi-value: the real field replaces the
			// placeholder. Accumulate only between genuine fname writes.
			const existing = fields[fname];
			if (existing === undefined) {
				fields[fname] = entry;
			} else if (!Array.isArray(existing) && existing.$named === false) {
				fields[fname] = entry;
			} else if (Array.isArray(existing)) {
				existing.push(entry);
			} else {
				fields[fname] = [existing, entry];
			}
		} else if (promoteAnonymousKeyword(child, entry, fields)) {
			// Promoted to a keyword field — no further placement needed.
		} else {
			children.push(entry);
		}
	}

	return {
		$type: node.type,
		$source: 'ts',
		$text: node.text(),
		$fields: Object.keys(fields).length > 0 ? fields : undefined,
		$children: children.length > 0 ? children : undefined,
		$span: { start: node.range().start.index, end: node.range().end.index },
		$nodeId: node.id(),
		$named: node.isNamed(),
	};
}
