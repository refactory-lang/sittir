/**
 * Read-render-parse validation (Checks 6 & 7) — parse → readNode → render → parse.
 *
 * Uses tree-sitter test corpus files (downloaded from grammar repos) as
 * source fixtures. Each corpus entry is parsed, readNode'd, rendered, and
 * re-parsed. Structural match is checked.
 *
 * Requires web-tree-sitter + language WASM files.
 */
export interface ReadRenderParseResult {
    grammar: string;
    total: number;
    pass: number;
    fail: number;
    skip: number;
    /**
     * Strict-structural pass count — entries where every tested kind
     * round-tripped AND the reparsed AST matches the original parse
     * byte-exactly on anonymous tokens. This is a subset of `pass`
     * (kind-found is the weaker invariant). Used to catch silently
     * dropped content like `;` terminators that the renderer omits
     * because the token isn't routed to a named field.
     */
    astMatchPass: number;
    errors: {
        name: string;
        message: string;
        input?: string;
        rendered?: string;
    }[];
    /** Structural mismatches — distinct from render / reparse errors. */
    astMismatches: {
        name: string;
        message: string;
        input?: string;
        rendered?: string;
    }[];
}
/**
 * Run read-render-parse validation for a grammar using corpus fixtures.
 */
/**
 * Parity-fixture capture — a single render + reparse pair as seen
 * by the validator. Shape matches spec 012 T045 / data-model.md §6.
 *
 * Populated only when the caller supplies `onFixture` in the options
 * bag. Each successful kind probe (render OK, re-parse OK, AST match
 * OK) emits one `RenderFixture` + one `RoundTripFixture` — the
 * former for byte-identical render parity (SC-001a), the latter for
 * end-to-end semantic parity (SC-001b).
 */
export interface RenderFixture {
    kind: 'render';
    grammar: string;
    /** NodeData input — the deep-read result from readTreeNode, ready
     *  for the grammar boundary render path (native transport when
     *  `backend === 'native'`, TS `render()` otherwise). Serialized to
     *  JSON verbatim. */
    input: unknown;
    /** The string the TS engine produced for `input`. Parity gate
     *  asserts the Rust engine produces the same bytes. */
    expectedOutput: string;
}
export interface RoundTripFixture {
    kind: 'roundtrip';
    grammar: string;
    /** Original source text for the probed node. */
    sourceIn: string;
    /** The kind name — functions as the ast-grep-style pattern
     *  ("match anything of this kind"). No actual edits are applied
     *  at MVP; the fixture exists to anchor full-pipeline parity. */
    pattern: string;
    /** Edit spec list — empty at MVP (render-only reparse probe). Kept
     *  in the schema so future fixtures can exercise applyEdits. */
    edits: readonly unknown[];
    /** Expected source after render (equals `sourceIn` for render-only
     *  render-parse probes that match byte-for-byte; may differ when render
     *  normalizes whitespace). */
    expectedSourceOut: string;
    /** S-expression serialization of the re-parsed SUBTREE rooted at
     *  `pattern` (`node2.toString()` on the web-tree-sitter side). The
     *  subtree comes from parsing `wrappedText` and locating the node
     *  at `wrappedOffset`. Cross-engine parity harnesses reproduce it
     *  by parsing `wrappedText` with their own tree-sitter binding. */
    expectedReparseTree: string;
    /** The rendered fragment wrapped in a supertype / direct-kind
     *  reparse context so tree-sitter can parse it (bare fragments
     *  like `"pub"` alone don't parse). Captured by the TS validator's
     *  `wrapForReparse` — the SAME text the TS side reparsed. */
    wrappedText: string;
    /** Byte offset within `wrappedText` where the rendered fragment
     *  was spliced in. Parity harnesses use this to locate the
     *  subtree to compare against `expectedReparseTree`. */
    wrappedOffset: number;
}
export type ParityFixture = RenderFixture | RoundTripFixture;
export interface ValidateReadRenderParseOptions {
    /** Called once per successfully validated kind — emits a
     *  `RenderFixture` then a `RoundTripFixture`. When omitted,
     *  validator runs its normal pass/fail accounting without
     *  fixture capture (zero added cost). */
    onFixture?: (fx: ParityFixture) => void;
    /** Backend to use for `buildReadHandle`. When provided, takes
     *  precedence over `process.env.SITTIR_BACKEND`. */
    backend?: 'native' | 'typescript';
    /** When true, deep-read ALL named kinds (not just variant-adopted).
     *  Exercises full recursive materialization before render. */
    recursive?: boolean;
    /** Optional failure tap for debugging / replay tools. Called with the
     *  first available per-candidate failure context before it is
     *  collapsed into the public `errors[]` summary. */
    onFailure?: (failure: ReadRenderParseFailure) => void;
    /** Stop the validator after the first tapped failure. Intended for
     *  replay tooling, not normal summary runs. */
    stopOnFirstFailure?: boolean;
}
export interface ReadRenderParseFailure {
    grammar: string;
    backend: 'native' | 'typescript';
    recursive: boolean;
    entryName: string;
    entrySource: string;
    kind: string;
    renderedKind: string;
    targetKind: string;
    range: {
        start: number;
        end: number;
    };
    input?: string;
    rendered?: string;
    message: string;
}
export declare function validateReadRenderParse(grammar: string, templatesPath: string, options?: ValidateReadRenderParseOptions): Promise<ReadRenderParseResult>;
export declare function formatReadRenderParseReport(result: ReadRenderParseResult): string;
//# sourceMappingURL=read-render-parse.d.ts.map