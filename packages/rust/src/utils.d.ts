import type { AnyNodeData, AnyTreeNodeOf, ByteRange, Edit } from '@sittir/types';
import type { BlockComment, LineComment, AnyTransport, NamespaceMap } from './types.js';
/**
 * Freeze a NodeData object and all its array-valued `_*` storage slots.
 *
 * Generic on `T` so the caller's concrete factory-output type flows
 * through to the `Readonly<T> & AnyNodeData` return. Hygiene rule 4:
 * preserve type information.
 */
export declare function freezeNodeData<T extends object>(node: T): Readonly<T> & AnyNodeData;
/**
 * Build the `$with` updater namespace for a NodeData.
 *
 * Each `[storageKey, configKey]` pair becomes a `$with.<configKey>(v)`
 * updater that calls `factory({ ...config, <configKey>: v })`. Generic on
 * the caller's `Config` and per-kind `NodeData` return so updater
 * signatures preserve grammar-specific types.
 */
export declare function buildWithNamespace<C extends object, R extends AnyNodeData>(config: C, factory: (cfg: C) => R, slotKeys: readonly [storageKey: string, configKey: string][]): {
    readonly [k: string]: (v: unknown) => R;
};
/**
 * The four `$`-prefixed shared methods (render, toEdit, replace, trivia)
 * that every factory-produced NodeData carries. Spread into each factory
 * literal via `..._sharedMethods` — no post-construction `defineProperty`
 * boilerplate. Methods are enumerable; functions are dropped by
 * `JSON.stringify` regardless, so the only visible difference is
 * `Object.keys(node)` includes them.
 */
/**
 * Wrap a factory-built node literal with the four `$`-prefixed shared
 * methods (`$render`, `$toEdit`, `$replace`, `$trivia`).
 *
 * Generic on `T` so the literal type flows through unchanged — the
 * return type is `T & { ... methods ... }` so callers retain narrow
 * per-kind property types. No spread (rule 6), no `defineProperty`
 * (rule 1) — methods are merged via `Object.assign` and become
 * enumerable members of the returned object.
 */
export declare function withMethods<T extends object>(node: T): T & {
    $render(): string;
    $toEdit(startOrRange: number | ByteRange, endPos?: number): Edit;
    $replace(target: {
        range(): ByteRange;
    }): Edit;
    $trivia(...args: (BlockComment | LineComment | {
        leading?: (BlockComment | LineComment)[];
        trailing?: (BlockComment | LineComment)[];
    })[]): AnyNodeData;
};
/**
 * Type guard: returns true if `v` is a NodeData.
 *
 * Accepts any node produced by `readNode`, a factory, or `.from()` — distinguished
 * from loose config bags by the presence of any of:
 *   - `_*` storage keys (branch nodes with named fields, de-hoisted),
 *   - `$text` (leaf nodes, or branch nodes with `SITTIR_DEBUG_TEXT=1`),
 *   - `$children` (container nodes whose children arrive without field names),
 *   - `$source` (provenance tag stamped by `readNode` and every factory).
 */
export declare function isNodeData<K extends keyof NamespaceMap>(v: NamespaceMap[K]['Node'] | NamespaceMap[K]['Loose'] | NamespaceMap[K]['Tree']): v is NamespaceMap[K]['Node'];
export declare function isNodeData(v: unknown): v is AnyNodeData;
/**
 * Type guard: returns true if `v` is a TreeNode (SgNode-compatible).
 */
export declare function isTreeNode<K extends keyof NamespaceMap>(v: NamespaceMap[K]['Tree'] | NamespaceMap[K]['Node']): v is NamespaceMap[K]['Tree'];
export declare function isTreeNode(v: unknown): v is AnyTreeNodeOf;
export declare function hasKind(v: object): v is {
    kind: string;
} & Record<string, unknown>;
export declare function isNodeOfKind<K extends keyof NamespaceMap>(v: unknown, kind: K): v is NamespaceMap[K]['Node'];
export declare function hasKindOf<K extends keyof NamespaceMap>(v: object, kind: K): v is {
    kind: K;
} & NamespaceMap[K]['Loose'];
/**
 * Convert NodeData/factory output into the data-only native transport shape.
 */
export declare function toNativeRenderTransport(node: unknown): AnyTransport;
//# sourceMappingURL=utils.d.ts.map