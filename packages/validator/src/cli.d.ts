/**
 * Single canonical CLI entry point for @sittir/validator.
 *
 * Subcommands:
 *   counts [grammar...]         — per-grammar raw pass/total counts for all four validators
 *   probe-factory [grammar...]  — factory-render-parse error bucketing (top-8 buckets)
 *   history [n]                 — print the last N validation history entries (default 10)
 *
 * Usage:
 *   npx tsx packages/validator/src/cli.ts counts
 *   npx tsx packages/validator/src/cli.ts counts rust typescript
 *   npx tsx packages/validator/src/cli.ts probe-factory
 *   npx tsx packages/validator/src/cli.ts history
 *   npx tsx packages/validator/src/cli.ts history 20
 */
/** Exported entry: counts subcommand — prints raw pass/total for all four validators. */
export declare function runCountsCli(args: string[]): Promise<void>;
/** Exported entry: probe-factory subcommand — error-bucket diagnostics for factory-render-parse. */
export declare function runProbeFactoryCli(args: string[]): Promise<void>;
/** Exported entry: history subcommand — prints last N validation runs. */
export declare function runHistoryCli(args: string[]): void;
//# sourceMappingURL=cli.d.ts.map