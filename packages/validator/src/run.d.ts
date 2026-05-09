/**
 * Canonical validation facade — single import point with explicit backend propagation.
 *
 * This module wraps the per-validator functions in `@sittir/codegen/validate/*`
 * and provides a stable API for callers that should not depend on internal
 * codegen paths directly.
 */
import { formatFromReport } from '@sittir/codegen/validate/from';
import { formatFactoryRenderParseReport } from '@sittir/codegen/validate/factory-render-parse';
import { formatReadRenderParseReport } from '@sittir/codegen/validate/read-render-parse';
export type Grammar = 'rust' | 'typescript' | 'python';
export type Backend = 'native' | 'typescript';
export type { FromValidationResult, FromValidationError } from '@sittir/codegen/validate/from';
export type { FactoryRenderParseResult } from '@sittir/codegen/validate/factory-render-parse';
export type { ReadRenderParseResult, ValidateReadRenderParseOptions, } from '@sittir/codegen/validate/read-render-parse';
export type { TemplateCoverageResult, CoverageIssue, } from '@sittir/codegen/validate/template-coverage';
export { formatFromReport, formatFactoryRenderParseReport, formatReadRenderParseReport };
/** Resolve the on-disk templates directory for a grammar, relative to this package's location. */
export declare function defaultTemplatesPath(grammar: Grammar): string;
/** Run from() correctness validation with an explicit backend. */
export declare function runFrom(grammar: Grammar, backend?: Backend): Promise<import("@sittir/codegen/validate/from").FromValidationResult>;
/**
 * Run read-render-parse round-trip validation with an explicit backend.
 * @param templatesPath - absolute path to the grammar's templates directory
 */
export declare function runRt(grammar: Grammar, templatesPath: string, backend?: Backend): Promise<import("@sittir/codegen/validate/read-render-parse").ReadRenderParseResult>;
/** Run template-coverage structural validation (synchronous). */
export declare function runCoverage(grammar: Grammar, templatesPath: string): import("@sittir/codegen/validate/template-coverage").TemplateCoverageResult;
/**
 * Run factory-render-parse validation with an explicit backend.
 * @param templatesPath - absolute path to the grammar's templates directory
 */
export declare function runFactory(grammar: Grammar, templatesPath: string, backend?: Backend): Promise<import("@sittir/codegen/validate/factory-render-parse").FactoryRenderParseResult>;
//# sourceMappingURL=run.d.ts.map