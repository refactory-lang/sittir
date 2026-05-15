/**
 * validate/node-types-loader.ts — thin loader for tree-sitter
 * node-types.json.
 *
 * Consumed by both validators and emitters (grammar.ts, types.ts),
 * so it lives at validate/ rather than under any one consumer's
 * directory. Takes a grammar name and returns the parsed raw entry
 * array from that grammar's `node-types.json` file (or a
 * `.sittir/src/node-types.json` override if present). No caches,
 * no mutable state (FR-022).
 *
 * If a consumer needs to point at a non-standard file (e.g. test
 * fixtures), they pass the resolved path directly via the
 * `explicitPath` argument — there is no module-level path registry.
 */
export interface RawFieldEntry {
    required: boolean;
    multiple: boolean;
    types: Array<{
        type: string;
        named: boolean;
    }>;
}
export interface RawNodeEntry {
    type: string;
    named: boolean;
    fields?: Record<string, RawFieldEntry>;
    children?: RawFieldEntry;
    subtypes?: Array<{
        type: string;
        named: boolean;
    }>;
}
export declare function loadRawEntries(grammar: string, explicitPath?: string): RawNodeEntry[];
//# sourceMappingURL=node-types-loader.d.ts.map