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
 *
 * Branch `$text` is omitted by default (branches reconstruct their text
 * via the render template). Set `SITTIR_DEBUG_TEXT=1` to include `$text`
 * on branch nodes for debugging purposes.
 */

import type {
	AnyNodeData,
	AnyTreeNode,
	FormatRecord,
	NodeId
} from './types.ts';

/**
 * Whether to emit `$text` on branch nodes (those with `$fields` or
 * `$children`). Read once at module load from the environment.
 * Enable with `SITTIR_DEBUG_TEXT=1`.
 */
const DEBUG_TEXT = process.env.SITTIR_DEBUG_TEXT === '1';

/**
 * A handle to the parsed tree, providing node lookup by id.
 * Structurally compatible with ast-grep SgRoot and tree-sitter Tree.
 */
export interface TreeHandle {
	/** Look up a node by its tree-owned id (O(1)). */
	nodeById(id: NodeId): AnyTreeNode;
	/** The root node of the tree. */
	rootNode: AnyTreeNode;
	/** Original source text. Optional — populated when the factory has it. */
	source?: string;
	/**
	 * Per-handle read dispatch. When present, the wrap layer reads
	 * through this method instead of running `readNode(handle, id)`
	 * directly. Native-engine handles set this to a closure that
	 * calls `engine.reader.parseAndRead(source)` (root) /
	 * `engine.reader.readNode(id)` (drill-in) so reads stay inside
	 * the engine that owns the tree.
	 *
	 * Why per-handle: tree-sitter `Node::id()` is documented as
	 * "unique within a given syntax tree" and is a raw-pointer cast,
	 * so a wasm-tree id cannot address a node in the napi engine's
	 * tree. The dispatch must live on the handle that owns the tree.
	 */
	read?(nodeId?: NodeId): AnyNodeData;
	/**
	 * Per-handle render dispatch. When present, the wrap layer renders
	 * through this method instead of calling a separate renderer. Engine
	 * handles set this to a closure that calls `engine.render(node, options)`
	 * so renders stay inside the engine that owns the tree (preserving
	 * engine-level format config).
	 */
	render?(nodeId?: NodeId, options?: { ignoreFormat?: boolean }): string;
	/**
	 * Format record inferred from the source file by the native Rust reader.
	 * Absent on trees produced by the JS reader (readNode never sets this).
	 * Callers can also set this manually to apply a house-style config.
	 */
	format?: FormatRecord;
	/**
	 * Phase D: convert a tree-sitter string kind name to the numeric
	 * `TSKindId` value used as `$type` in `AnyNodeData`. Required for
	 * JS-side (WASM) reads — the native (napi) path produces numeric IDs
	 * directly via `tree.read`. If absent on a JS-side handle, `readNode`
	 * throws to surface the misconfiguration immediately.
	 */
	kindIdFromName?: (kind: string) => number | undefined;
}

function toNodeId(id: number): NodeId {
	return id as NodeId;
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
	fields: Record<string, AnyNodeData | AnyNodeData[]>
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
export function readNode(tree: TreeHandle, nodeId?: NodeId): AnyNodeData {
	// Native-handle dispatch: when `tree.read` is present the handle owns a
	// Rust/napi engine that produces `AnyNodeData` directly (no JS-side tree
	// walk needed). TS handles do NOT set `tree.read` so this branch is
	// native-only — no circular recursion risk.
	if (tree.read) return tree.read(nodeId);

	// Phase D: capture optional kindIdFromName resolver. When absent (e.g. in
	// unit-test handles with no real grammar), readNode falls back to the string
	// kind name as $type. This is valid because AnyNodeData.$type is `string |
	// number`: numeric for parser.c-derived kinds (the normal production path),
	// string for hidden/synthetic kinds (e.g. "_suite") and test fixtures.
	const kindIdFromName = tree.kindIdFromName;

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
	const fields: Record<string, AnyNodeData | AnyNodeData[]> =
		Object.create(null);
	const children: AnyNodeData[] = [];

	/**
	 * Resolve a tree-sitter kind string to its numeric TSKindId, falling back
	 * to the string kind name when no resolver is configured. The string
	 * fallback is intentional for hidden/synthetic kinds and unit-test handles
	 * that have no grammar backing.
	 */
	function resolveKindId(kind: string): string | number {
		if (kindIdFromName) {
			const id = kindIdFromName(kind);
			if (id !== undefined) return id;
		}
		// No resolver or kind not in catalog — use string name as $type.
		return kind;
	}

	const allChildren = node.children();
	for (let i = 0; i < allChildren.length; i++) {
		const child = allChildren[i]!;

		const entry: AnyNodeData = {
			$type: resolveKindId(child.type),
			$source: 'ts',
			$text: child.text(),
			$span: { start: child.range().start.index, end: child.range().end.index },
			$nodeId: toNodeId(child.id()),
			$named: child.isNamed()
		};

		const fname = node.fieldNameForChild?.(i);
		if (fname) {
			// Multi-valued fields (e.g. python's `argument` in
			// `print a, b, c` where each expression has each expression has the same
			// field name) must accumulate into an array instead of
			// overwriting. But collisions with an anonymous-keyword
			// placeholder (from promoteAnonymousKeyword earlier in
			// the loop — e.g. rust's `type_item` has an anonymous
			// `type` keyword child AND a named `type` field for the
			// RHS) aren't multi-value: the real field replaces the
			// placeholder. Same-field anon-after-anon must still
			// accumulate — typescript ambient_declaration's
			// `module.exports:` emits five children sharing
			// `field=declaration` (module, ., property_identifier,
			// :, object_type); silent replacement drops module/. .
			const existing = fields[fname];
			if (existing === undefined) {
				fields[fname] = entry;
			} else if (
				!Array.isArray(existing) &&
				existing.$named === false &&
				entry.$named === true
			) {
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

	const hasStructure = Object.keys(fields).length > 0 || children.length > 0;

	return {
		$type: resolveKindId(node.type),
		$source: 'ts',
		// Branch nodes: emit $text only when DEBUG_TEXT is enabled.
		// Leaf nodes (no $fields / $children) always carry $text so the
		// render fast-path and all leaf-consuming callers work correctly.
		$text: !hasStructure || DEBUG_TEXT ? node.text() : undefined,
		$fields: Object.keys(fields).length > 0 ? fields : undefined,
		$children: children.length > 0 ? children : undefined,
		$span: { start: node.range().start.index, end: node.range().end.index },
		$nodeId: toNodeId(node.id()),
		$named: node.isNamed()
	};
}
