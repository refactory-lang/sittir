/**
 * Factory-render-parse validation — corpus → parse → readNode → factory() → render → re-parse.
 *
 * Uses direct factory calls (via _factoryMap) to isolate the template
 * quality signal from from() resolver bugs:
 * 1. Parse corpus source with tree-sitter
 * 2. readNode to get NodeData
 * 3. Call the factory directly with readNode fields (no from() resolver)
 * 4. Render the factory-produced node
 * 5. Re-parse and verify the kind exists
 */
export interface FactoryRenderParseResult {
    grammar: string;
    total: number;
    pass: number;
    fail: number;
    skip: number;
    /**
     * Strict-structural pass count. A factory build round-trips with
     * full fidelity when the reparsed tree matches the original parse
     * byte-exactly on anonymous tokens. Subset of `pass` (kind-found
     * is weaker). Surfaces factory API gaps that kind-found misses —
     * missing field surface, dropped children slots, wrong defaults.
     */
    astMatchPass: number;
    errors: {
        kind: string;
        entry?: string;
        message: string;
        input?: string;
        rendered?: string;
    }[];
    astMismatches: {
        kind: string;
        entry?: string;
        message: string;
        input?: string;
        rendered?: string;
    }[];
}
export declare function validateFactoryRenderParse(grammar: string, templatesPath: string, backend?: 'native' | 'typescript'): Promise<FactoryRenderParseResult>;
export declare function formatFactoryRenderParseReport(result: FactoryRenderParseResult): string;
//# sourceMappingURL=factory-render-parse.d.ts.map