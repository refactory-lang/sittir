/**
 * NodeData runtime helpers — ADR-0018 Phase 2.
 *
 * Shared helpers for the de-hoisted NodeData surface:
 *   - `withMethods`        — attaches $render/$toEdit/$replace/$trivia
 *   - `freezeNodeData`     — Object.freeze top-level + array values
 *   - `buildWithNamespace` — produces the $with updater namespace
 *   - `materializeStub`    — resolves a wrap-stub to full NodeData
 *
 * These functions are called from generated factories.ts and wrap.ts.
 * They share the implementations so every factory gets the same
 * $-prefixed method bodies without per-factory inline emission.
 */

import type { AnyNodeData, ByteRange, Edit } from './types.ts';
import type { TreeHandle } from './readNode.ts';
import { readNode } from './readNode.ts';

// ---------------------------------------------------------------------------
// Method attachment
// ---------------------------------------------------------------------------

export interface NodeDataMethods {
	/** Render this node to source text. */
	$render: () => string;
	/** Create an Edit replacing the given byte range with this node's rendered text. */
	$toEdit: (startOrRange: number | ByteRange, endPos?: number) => Edit;
	/** Create an Edit replacing the target tree node's range with this node's rendered text. */
	$replace: (target: { range(): ByteRange }) => Edit;
	/** Return a new frozen node with per-field trivia updates applied. */
	$trivia: (...args: unknown[]) => AnyNodeData;
}

/**
 * Attach the shared `$render`, `$toEdit`, `$replace`, and `$trivia`
 * non-enumerable methods to a node object. Called from generated
 * factory/wrap code as the final step before `freezeNodeData`.
 *
 * @param node - The mutable node object (pre-freeze).
 * @param opts - Per-factory render and edit implementations.
 * @returns The same node object, for convenience in call chains.
 *
 * @remarks
 * All methods are non-enumerable so they don't appear in
 * `Object.keys(node)` or `JSON.stringify(node)`. The `$`-prefix
 * ensures they never collide with grammar field names (tree-sitter
 * field names cannot start with `$`).
 */
export function withMethods(
	node: Record<string, unknown>,
	opts: {
		render: (n: AnyNodeData) => string;
		toEdit: (n: AnyNodeData, startOrRange: number | ByteRange, endPos?: number) => Edit;
	}
): Record<string, unknown> {
	Object.defineProperty(node, '$render', {
		value: function(this: AnyNodeData): string {
			return opts.render(this);
		},
		enumerable: false,
		writable: false,
		configurable: false
	});
	Object.defineProperty(node, '$toEdit', {
		value: function(
			this: AnyNodeData,
			startOrRange: number | ByteRange,
			endPos?: number
		): Edit {
			return opts.toEdit(this, startOrRange, endPos);
		},
		enumerable: false,
		writable: false,
		configurable: false
	});
	Object.defineProperty(node, '$replace', {
		value: function(
			this: AnyNodeData,
			target: { range(): ByteRange }
		): Edit {
			const r = target.range();
			return opts.toEdit(this, r);
		},
		enumerable: false,
		writable: false,
		configurable: false
	});
	// $trivia is a no-op stub for now — implementations can override.
	Object.defineProperty(node, '$trivia', {
		value: function(this: AnyNodeData): AnyNodeData {
			return this;
		},
		enumerable: false,
		writable: false,
		configurable: false
	});
	return node;
}

// ---------------------------------------------------------------------------
// Freeze
// ---------------------------------------------------------------------------

/**
 * Freeze a NodeData object and all its array-valued `_*` storage slots.
 *
 * @param node - The mutable node object to freeze.
 * @returns The frozen node (same reference, typed as `AnyNodeData`).
 *
 * @remarks
 * Per ADR-0018 R8, arrays stored under `_<name>` and `$children` are
 * frozen individually so they are also immutable. `$with.<name>([...])` on a
 * frozen-array slot returns a new frozen node — it does NOT mutate the array.
 * Top-level freeze is applied last so the `_*` array-freezing writes can
 * succeed before the top-level object is locked.
 */
export function freezeNodeData(node: Record<string, unknown>): AnyNodeData {
	// Freeze any array-valued `_*` storage slots and `$children`.
	for (const key of Object.keys(node)) {
		if ((key.startsWith('_') || key === '$children') && Array.isArray(node[key])) {
			Object.freeze(node[key]);
		}
	}
	return Object.freeze(node) as unknown as AnyNodeData;
}

// ---------------------------------------------------------------------------
// $with namespace
// ---------------------------------------------------------------------------

/**
 * Build the `$with` non-enumerable namespace for a NodeData object.
 *
 * Each entry in `slotKeys` gets a `$with.<slotKey>(v)` updater that calls
 * `factory({ ...config, <configKey>: v })` and returns the resulting frozen node.
 *
 * Unnamed-slot keys (`'$child'`, `'$children'`) are supported via the
 * `$with.$child(v)` / `$with.$children(vs)` pattern per FR-009a.
 *
 * @param config - The factory config object this node was constructed from.
 * @param factory - The factory function that produces a new frozen node.
 * @param slotKeys - Array of `[storageKey, configKey]` pairs. For named slots:
 *   `storageKey = '_name'`, `configKey = 'name'` (camelCase property name).
 *   For unnamed slots: `storageKey = '$child'` / `'$children'`,
 *   `configKey = '$child'` / `'$children'` (unchanged).
 * @returns The `$with` namespace object (attached as non-enumerable on the node).
 *
 * @remarks
 * The `$with` object itself is a plain object; it's attached to the node
 * via `Object.defineProperty(..., { enumerable: false })` by the caller.
 * Each updater in `$with` is a regular enumerable property on the `$with`
 * object (consumers need to enumerate them, e.g. for documentation).
 */
export function buildWithNamespace(
	config: Record<string, unknown>,
	factory: (cfg: Record<string, unknown>) => AnyNodeData,
	slotKeys: readonly [storageKey: string, configKey: string][]
): Record<string, unknown> {
	const withNs: Record<string, unknown> = {};
	for (const [, configKey] of slotKeys) {
		withNs[configKey] = function(v: unknown): AnyNodeData {
			return factory({ ...config, [configKey]: v });
		};
	}
	return withNs;
}

// ---------------------------------------------------------------------------
// Stub materialization
// ---------------------------------------------------------------------------

/**
 * Materialize a wrap-layer stub (`{ $type, $nodeHandle, $childIndex }`) into
 * a full NodeData by re-reading from the tree.
 *
 * @param stub - The stub object stored in a `_<name>` slot.
 * @param tree - The tree handle that owns the parse tree. When `undefined`
 *   (tree has been freed or is unavailable), an informative error is thrown.
 * @returns The fully-hydrated NodeData for the stub.
 * @throws Error when `tree` is undefined or when the stub cannot be resolved.
 *
 * @remarks
 * Wrap accessors call this on access. The node is frozen — the accessor
 * does NOT cache the materialized value back into `_<name>`. Re-materialization
 * on each call is the correct behavior because the tree may have been
 * re-parsed between calls (and caching would require unfreezing).
 */
export function materializeStub(
	stub: AnyNodeData,
	tree: TreeHandle | undefined
): AnyNodeData {
	if (!tree) {
		throw new Error(
			`NodeData stub cannot be materialized: parse tree no longer available ` +
			`(handle=${stub.$nodeHandle ?? 'undefined'}, childIndex=${stub.$childIndex ?? 'undefined'})`
		);
	}
	return readNode(tree, stub.$nodeHandle, stub.$childIndex);
}
