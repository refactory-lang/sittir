/**
 * validate/common.ts — shared infrastructure across the three
 * corpus validators (`validate-roundtrip`, `validate-factory-roundtrip`,
 * `validate-from`). C15.
 *
 * Everything in here used to be duplicated three times:
 *   - Tree-sitter adapter: `adaptNode`, `treeHandle`, `findFirst`,
 *     `collectKinds`.
 *   - Corpus parser: `parseCorpus`, `loadCorpusEntries`.
 *   - Reparse wrapping: `buildKindToSupertypes`, `wrapForReparse`.
 *
 * Per-validator logic (per-kind assertions, reporting) stays in its
 * own file and imports whatever it needs from here.
 */
import type * as TS from 'web-tree-sitter';
import type { AnyNodeData, AnyTreeNode } from '@sittir/types';
import type { TreeHandle } from '@sittir/common';
import { type PolymorphVariantMap } from '../polymorph-variant.ts';
import type { FactoryShape, FactorySlotMeta } from '../emitters/factory-map.ts';
export interface CorpusEntry {
    name: string;
    source: string;
}
export type TSNode = TS.Node;
export type TSTree = TS.Tree;
/**
 * Parse a tree-sitter test corpus file.
 * Format: `====` header, test name, `====`, source, `----`, expected tree.
 */
export declare function parseCorpus(content: string): CorpusEntry[];
export declare function loadCorpusEntries(grammar: string): CorpusEntry[];
/**
 * Dynamic import of web-tree-sitter. The package ships CommonJS with
 * ambiguous default-export shape depending on bundler, so we try the
 * two common locations and throw if neither carries `Parser` + `Language`.
 */
export declare function loadWebTreeSitter(): Promise<{
    Parser: typeof TS.Parser;
    Language: typeof TS.Language;
}>;
export declare function adaptNode(node: TS.Node): AnyTreeNode;
export declare function treeHandle(tree: TS.Tree, source?: string, kindIdFromName?: (kind: string) => number | undefined): TreeHandle;
/**
 * Native TreeHandle — wraps a `SittirEngine` napi instance so reads
 * (root + drill-in) all flow through napi. Used by validators /
 * probe-kind to exercise the full native pipeline end-to-end without
 * any JS-side parse or walker fallback. The engine owns the tree, and
 * the tree-sitter `Node::id()` returned in `$nodeId` is dereferenced
 * by the same engine that produced it — no cross-engine id leakage.
 */
export interface NativeEngineLike {
    parseAndRead(source: string): string;
    readNode(handle: number, childIndex: number): string;
}
export declare function nativeTreeHandle(engine: NativeEngineLike, source: string): TreeHandle;
export declare function buildReadHandle(grammar: string, tree: TS.Tree, source: string, backend?: 'native' | 'typescript', kindIdFromName?: (kind: string) => number | undefined): TreeHandle;
/**
 * Read a specific tree-sitter node via its adapted AnyTreeNode reference.
 *
 * ADR-0017: readNode no longer accepts a nodeId. For the WASM/JS path,
 * validators use this helper to push the target node into the handle's
 * nodes[] array and call readNode with the resulting handle + childIndex=0.
 * For native handles (handle.read present), uses the native coords from
 * findNativeNodeId.
 */
export declare function readNodeAt(handle: TreeHandle, node: AnyTreeNode, nativeCoords: NativeNodeCoords | null): AnyNodeData;
/**
 * ADR-0017: navigation coordinates for a native drill-in.
 * `handle` is the parent's index in the tree's nodes[], `childIndex` is
 * the position in parent's child array.
 */
export interface NativeNodeCoords {
    handle?: number;
    childIndex?: number;
}
/**
 * For a native TreeHandle (`handle.read` is present), walk the native
 * NodeData tree to find the parent-handle + child-index pair for the
 * first node whose `$type` equals `kind`. Native engine handles and
 * WASM/JS engine handles occupy different navigation spaces, so WASM
 * coordinates must never be passed to a native handle's
 * `readNode(handle, childIndex)`.
 *
 * Returns null when `handle` is a WASM handle (no `handle.read`) —
 * callers fall back to the JS tree's `node.id` in that case.
 *
 * ADR-0017: returns { handle, childIndex } instead of NodeId.
 */
export declare function findNativeNodeId(handle: TreeHandle, kind: string, kindNameFromId?: (id: number) => string | undefined): NativeNodeCoords | null;
export declare function findFirst(node: TS.Node, kind: string): TS.Node | null;
export declare function collectKinds(node: TS.Node): Set<string>;
export declare function buildKindToSupertypes(rawEntries: {
    type: string;
    named: boolean;
    subtypes?: {
        type: string;
    }[];
}[]): Map<string, string[]>;
export interface WrapForReparseResult {
    /** The rendered fragment spliced into the supertype wrapper template. */
    readonly text: string;
    /** Byte offset where the rendered fragment begins in `text`. */
    readonly offset: number;
}
/**
 * Kind names whose direct `REPARSE_WRAPPERS[grammar]` entry should only
 * fire when variant() adoption is in effect for that kind. Otherwise
 * the wrapper is skipped so the baseline `{% if variant %}`
 * fall-through (a parent-template shape that only works under variant()
 * adoption) doesn't expose the kind to reparse where it'd render empty.
 */
export declare const VARIANT_ADOPTION_GATED_WRAPPERS: Record<string, readonly string[]>;
export declare function wrapForReparse(rendered: string, kind: string, grammar: string, kindToSupertypes: Map<string, string[]>, opts?: {
    adoptedVariantKinds?: ReadonlySet<string>;
    targetKind?: string;
}): WrapForReparseResult | null;
export declare const WASM_PATHS: Record<string, string>;
/** Relative path from codegen validators to grammar source wrap modules. */
export declare const WRAP_MODULE_PATHS: Record<string, string>;
/**
 * Dynamic import of a grammar's `readTreeNode` entry point. Used by
 * validators to build source-typed wrapped views (ADR-0006) — the
 * wrap layer's drillAs() rewrites `$type` at alias-declared field
 * sites so validator render dispatches through the source template.
 */
export declare function loadReadTreeNode(grammar: string): Promise<((handle: TreeHandle, nodeHandle?: number, childIndex?: number) => unknown) | null>;
export declare function loadWrapNode(grammar: string): Promise<((data: AnyNodeData, tree: TreeHandle) => unknown) | null>;
/**
 * Walk a wrapped tree via declared getters, calling `visit` on each
 * encountered wrapped node. Enumeration uses `Object.keys` + accessor
 * invocation — accessors defined via `{get foo() {}}` appear as
 * enumerable keys and fire on read, so drillAs() along the way rewrites
 * $type from alias target to source at declared-field sites.
 *
 * `$`-prefixed keys are spread NodeData metadata (not child getters)
 * and get skipped. Leaves short-circuit when accessing a getter that
 * doesn't return a wrapped-shape value.
 */
export declare function walkWrappedTree(root: unknown, visit: (w: WrappedNodeData) => void): void;
export declare function materializeWrappedNodeData(root: unknown): AnyNodeData;
export declare function stripStructuralNodeText<T>(root: T): T;
export interface WrappedNodeData {
    readonly $type: number;
    readonly $nodeHandle?: number;
    readonly $childIndex?: number;
    readonly [k: string]: unknown;
}
/**
 * Load the grammar package's `kindNameFromId` resolver for Phase D numeric
 * `$type` support. Returns a safe wrapper that returns `undefined` on unknown
 * ids rather than throwing.
 */
/**
 * Load the static KIND_NAMES map from the grammar's generated types module.
 * Returns the Map directly for use as `RulesConfig.kindNames`.
 */
export declare function loadKindNames(grammar: string): Promise<ReadonlyMap<number, string> | undefined>;
export declare function loadKindNameFromId(grammar: string): Promise<((id: number) => string | undefined) | undefined>;
/**
 * Load the grammar package's `kindIdFromName` resolver for Phase D numeric
 * `$type` support. Returns the raw function (which throws on unknown names)
 * so callers can wrap it in try/catch as needed.
 */
export declare function loadKindIdFromName(grammar: string): Promise<((name: string) => number) | undefined>;
/**
 * Load the best available parser for a grammar: override-compiled
 * WASM if it exists, otherwise the base grammar's WASM from npm.
 *
 * The override WASM is produced by `compileParser()` and lives at
 * `packages/<grammar>/.sittir/parser.wasm`. When present, it carries
 * all field labels from transform()/enrich() patches natively.
 */
export declare function loadLanguageForGrammar(grammar: string): Promise<{
    Parser: typeof TS.Parser;
    Language: typeof TS.Language;
    lang: TS.Language;
    isOverride: boolean;
}>;
export interface NodeToConfigOpts {
    readonly tree?: TreeHandle;
    readonly factoryMap?: Record<string, (...args: unknown[]) => unknown>;
    /** Per-kind factory signature hint (from the generated `_factoryShapes`
     * map). `'config'` expects a Config object; `'children'` is rest-
     * params `(...children)`; `'text'` expects a bare string. Without
     * this, recursion defaults to `'config'` which breaks children-shape
     * factories (e.g. python `argument_list`) because they'd interpret
     * the whole Config object as the single rest-param item. */
    readonly factoryShapes?: Record<string, FactoryShape>;
    /** Per-field alias-source map (from the generated `_fieldAliasMap`).
     * Key format: `"parentKind.fieldName"`; value: the source kind the
     * factory expects. When a child arrives at an alias-declared slot,
     * its tree-sitter-emitted $type is the alias target; `resolveChild`
     * consults this map to dispatch the matching source-kind factory
     * instead. Without it, ADR-0006-aware fields silently dispatch the
     * wrong factory (e.g. `block` factory on a `_match_block` body). */
    readonly fieldAliasMap?: Record<string, Record<string, string>>;
    /** Per-kind list of declared factory Config field names (from the
     * generated `_factoryFields`). Drives orphan-child promotion: when
     * a read node has $children but the expected field is missing from
     * $fields (tree-sitter elided the label — python `list_splat` at
     * expression-statement position is the canonical case), route
     * children into the declared fields by position. */
    readonly factoryFields?: Record<string, readonly string[]>;
    /** Per-kind slot metadata (from the generated `_factorySlots`).
     * Drives config-surface normalization for both named and unnamed slots. */
    readonly factorySlots?: Record<string, Record<string, FactorySlotMeta>>;
    /** Per-polymorph variant descriptor (from `_polymorphVariants`).
     *  `nodeToConfig` uses this to stamp `$variant` on the returned
     *  config when the parent kind is a polymorph. The dispatcher's
     *  `switch (config.$variant)` requires the tag — this is the
     *  single plumb-in for readNode-derived data that doesn't carry
     *  it natively. */
    readonly polymorphVariants?: PolymorphVariantMap;
    /** Validator-supplied CST node-kind fallback for override polymorphs whose
     * readNode shape collapsed the discriminating wrapper before factory dispatch. */
    readonly cstNodeKindHint?: string;
    /** Validator-supplied CST fallback for override polymorphs whose native
     * read collapsed the wrapper child kind before factory dispatch. */
    readonly firstNamedChildKindHint?: string;
    /** Ordered CST named-child candidates for override polymorphs whose
     * discriminating wrapper kind is not the first named child. */
    readonly namedChildKindHints?: readonly string[];
    /** Internal — current parent kind during field recursion. Used with
     * `fieldAliasMap` to form `${parentKind}.${fieldName}` lookups. */
    readonly _parentKind?: string;
    /** Internal — current field name during field recursion. */
    readonly _fieldName?: string;
    /** Internal recursion guard — set by the helper, not the caller. */
    readonly _depth?: number;
    /** Phase D: resolver for numeric $type → string kind name. Required when
     * input nodes carry numeric $type (readNode output post-Phase-D). */
    readonly kindNameFromId?: (id: number) => string | undefined;
}
interface ReadNodeLike {
    readonly $type?: string | number;
    readonly $text?: string;
    readonly $nodeHandle?: number;
    readonly $childIndex?: number;
    readonly $children?: unknown | readonly unknown[];
    readonly $named?: boolean;
}
export declare function getChildFactoryArgs(kind: string, childConfig: Record<string, unknown>, factorySlots: NodeToConfigOpts['factorySlots']): readonly unknown[];
export declare function nodeToConfig(data: ReadNodeLike, opts?: NodeToConfigOpts): Record<string, unknown>;
/**
 * Single shared call site for `dumpMetrics` so all four corpus validators
 * funnel through one definition (DRY: one source, one derivation). The
 * metrics accumulator is process-wide; each invocation writes the
 * cumulative state, so when vitest runs all four validators against all
 * three grammars in one process the final write contains every per-kind
 * entry observed in that run.
 *
 * Backend selection mirrors `buildReadHandle`: `SITTIR_BACKEND=native`
 * → `'native'`; anything else → `'ts'`. No-op when `SITTIR_METRICS=1`
 * is unset (the underlying `dumpMetrics` short-circuits).
 *
 * @see packages/core/src/metrics.ts for the accumulator + writer.
 */
export declare function emitValidatorMetrics(): void;
export {};
//# sourceMappingURL=common.d.ts.map