/**
 * from() correctness validation — structural comparison of from() vs factory output.
 *
 * Tests that from() resolvers produce correct NodeData by comparing
 * from(readNodeData) against factory(readNodeFields). Detects:
 * - undefined nodes (from() resolver failed to resolve a child)
 * - structural divergence (different fields or children)
 *
 * No tree-sitter re-parsing needed — pure structural comparison.
 */
export interface FromValidationError {
    kind: string;
    severity: 'error' | 'warning';
    message: string;
}
export interface FromValidationResult {
    grammar: string;
    total: number;
    pass: number;
    fail: number;
    skip: number;
    undefinedCount: number;
    divergentCount: number;
    errors: FromValidationError[];
}
export declare function validateFrom(grammar: string, backend?: 'native' | 'typescript'): Promise<FromValidationResult>;
export declare function formatFromReport(result: FromValidationResult): string;
//# sourceMappingURL=from.d.ts.map