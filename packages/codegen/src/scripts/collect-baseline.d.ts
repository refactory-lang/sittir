/**
 * collect-baseline.ts — feature 016, US1.
 *
 * Produces the per-backend `BackendBaseline` JSON committed under
 * `specs/016-parity-regressions/baselines/{ts,native}.json`. Reads
 * `SITTIR_BACKEND` from the environment to select between TS-mode (the
 * default Nunjucks pipeline) and native-mode (the napi engine). Inside
 * the corpus validators, `buildReadHandle()` already does the dispatch
 * — this script just wires up the validators + parity-fixture render
 * comparison and shapes the output to the contract in
 * `specs/016-parity-regressions/contracts/baseline-json.md`.
 *
 * Determinism contract:
 *   - 4-space indent, `\n` line endings, trailing newline.
 *   - Sorted keys at every level (writer rebuilds the object with
 *     sorted keys before JSON.stringify).
 *   - Sorted `failingKinds` arrays, sorted `failingByKind` keys
 *     (failure-id values stay in fixture-file declaration order).
 *   - Empty collections explicit: `[]` / `{}` not omitted.
 *   - No timestamps. The only mutable header field is `commit`
 *     (content-derived from `git rev-parse --short=7 HEAD`).
 *
 * Used as both an importable module (the test in
 * `__tests__/collect-baseline.test.ts` calls `collectBaseline` /
 * `serialiseBaseline` directly) and a CLI entry — the bottom of this
 * file detects whether it was invoked as a script and prints to stdout
 * if so.
 */
export type Backend = 'typescript' | 'native';
export type Grammar = 'python' | 'rust' | 'typescript';
export interface ValidatorResult {
    pass: number;
    total: number;
    /** Template-shape failures: AST diverges between source and rendered output. */
    failingKinds: string[];
    /**
     * Format-only failures: AST shapes match but bytes differ (whitespace,
     * quote style, numeric literal style, optional tokens, comment placement,
     * or any other variation the grammar treats as semantically equivalent).
     * Deferred to feature 017-format-inference. See contracts/baseline-json.md
     * for the triage rules.
     */
    formatDeferredKinds: string[];
}
export interface RoundtripResult extends ValidatorResult {
    astMatchPass: number;
}
export interface ParityFixtures {
    pass: number;
    total: number;
    /** Template-shape failures by kind → fixture id list. */
    failingByKind: {
        readonly [kind: string]: readonly string[];
    };
    /** Format-only failures by kind → fixture id list. Deferred to 017. */
    formatDeferredByKind: {
        readonly [kind: string]: readonly string[];
    };
}
export interface GrammarEntry {
    validators: {
        from: ValidatorResult;
        coverage: ValidatorResult;
        roundtrip: RoundtripResult;
        factoryRoundtrip: RoundtripResult;
    };
    parityFixtures: ParityFixtures;
}
export interface BackendBaseline {
    backend: Backend;
    commit: string;
    grammars: {
        readonly [grammar in Grammar]: GrammarEntry;
    };
    totals: {
        pass: number;
        fail: number;
        total: number;
    };
}
/**
 * Type of the dynamic-import function injected by tests. Kept narrow on
 * purpose — tests pass in a stub that resolves or rejects to exercise
 * the error branch deterministically.
 */
export type BoundaryImporter = (path: string) => Promise<unknown>;
/**
 * Load the per-grammar `boundary.ts` and return its `render` function.
 * Throws `Error` (with grammar name + the import path it tried) when
 * the import fails or the module doesn't expose a `render` function.
 *
 * Caller decides whether to recover (TS mode = optional, swallow the
 * error and use the createRenderer fallback) or escalate (native mode =
 * the failure means our "native" baseline would lie about which engine
 * produced its numbers — surface it).
 *
 * Exported for tests so the failure mode can be exercised without
 * patching the filesystem. `importFn` defaults to a real dynamic
 * import; tests inject a stub.
 */
export declare function loadBoundaryRender(grammar: Grammar, importFn?: BoundaryImporter): Promise<(node: unknown) => string>;
export declare function collectParityFixtures(grammar: Grammar, backend: Backend, importFn?: BoundaryImporter): Promise<ParityFixtures>;
export declare function collectBaseline(backendInput?: string): Promise<BackendBaseline>;
export declare function serialiseBaseline(baseline: BackendBaseline): string;
export declare function run(_argv: string[]): Promise<number>;
//# sourceMappingURL=collect-baseline.d.ts.map