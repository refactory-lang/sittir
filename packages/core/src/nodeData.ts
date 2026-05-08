/**
 * NodeData runtime helpers — ADR-0018 Phase 2.
 *
 * Shared helpers for the de-hoisted NodeData surface:
 *   - `freezeNodeData`     — Object.freeze top-level + array values
 *   - `buildWithNamespace` — produces the $with updater namespace
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
 *
 * Note: `withMethods` (attaches $render/$toEdit/$replace/$trivia) is
 * emitted per-grammar into each grammar's `utils.ts` by codegen, not
 * shared through core. Each grammar inlines its own copy so the render
 * closure captures the grammar-specific renderer.
 */

import type { AnyNodeData } from './types.ts';

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
		withNs[configKey] = function (v: unknown): R {
			return factory({ ...config, [configKey]: v });
		};
	}
	return withNs;
}
