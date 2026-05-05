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
 *
 * Per-grammar codegen-hygiene helpers (`defineAccessor`,
 * `defineNamespace`, `readRawField`) live in each grammar's
 * `utils.ts` (emitted by `packages/codegen/src/emitters/client-utils.ts`).
 * Core stays grammar-agnostic — only cross-grammar runtime semantics
 * belong here.
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
export function freezeNodeData<T extends object>(node: T): Readonly<T> & AnyNodeData {
	// Freeze any array-valued `_*` storage slots and `$children`. Internal
	// cast bridges Object.keys/index access; the public signature preserves
	// the caller's concrete `T`. Hygiene rule 4: generics carry type info.
	const rec = node as unknown as Record<string, unknown>;
	for (const key of Object.keys(rec)) {
		if ((key.startsWith('_') || key === '$children') && Array.isArray(rec[key])) {
			Object.freeze(rec[key]);
		}
	}
	return Object.freeze(node) as Readonly<T> & AnyNodeData;
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
 * @returns The `$with` namespace object (attached on the node by the caller).
 *
 * @remarks
 * Generic on `C` (config) and `R` (factory return) so the caller's concrete
 * Config and per-kind NodeData types flow through to the namespace updater
 * signatures. Each `$with.<configKey>(v)` typed as `(v: unknown) => R`.
 * Hygiene rule 4: no `object` / `Record<string, unknown>` widening at the API
 * surface; the index-access erasure happens once inside the body.
 */
export function buildWithNamespace<C extends object, R extends AnyNodeData>(
	config: C,
	factory: (cfg: C) => R,
	slotKeys: readonly [storageKey: string, configKey: string][]
): { readonly [k: string]: (v: unknown) => R } {
	const withNs: Record<string, (v: unknown) => R> = {};
	for (const [, configKey] of slotKeys) {
		withNs[configKey] = function(v: unknown): R {
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
