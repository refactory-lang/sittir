/**
 * Canonical validation facade — single import point with explicit backend propagation.
 *
 * This module wraps the per-validator functions in `@sittir/codegen/validate/*`
 * and provides a stable API for callers that should not depend on internal
 * codegen paths directly.
 */

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateFrom, formatFromReport } from './validate/from.ts';
import { validateFactoryRenderParse, formatFactoryRenderParseReport } from './validate/factory-render-parse.ts';
import { validateReadRenderParse, formatReadRenderParseReport } from './validate/read-render-parse.ts';
import type { ValidateReadRenderParseOptions } from './validate/read-render-parse.ts';
import { validateTemplateCoverage } from './validate/template-coverage.ts';

export type Grammar = 'rust' | 'typescript' | 'python';
export type Backend = 'native';

// Re-export result types so callers only need @sittir/tools.
export type { FromValidationResult, FromValidationError } from './validate/from.ts';
export type { FactoryRenderParseResult } from './validate/factory-render-parse.ts';
export type { ReadRenderParseResult, ValidateReadRenderParseOptions } from './validate/read-render-parse.ts';
export type { TemplateCoverageResult, CoverageIssue } from './validate/template-coverage.ts';

// Re-export formatting helpers.
export { formatFromReport, formatFactoryRenderParseReport, formatReadRenderParseReport };

/** Run from() correctness validation with an explicit backend. */
export function runFrom(grammar: Grammar, backend: Backend = 'native') {
	return validateFrom(grammar, backend);
}

/** Run read-render-parse round-trip validation with an explicit backend. */
export function runRt(
	grammar: Grammar,
	backend: Backend = 'native',
	options: Pick<ValidateReadRenderParseOptions, 'recursive'> = {}
) {
	return validateReadRenderParse(grammar, { backend, recursive: options.recursive });
}

/** Run template-coverage structural validation (synchronous). */
export function runCoverage(grammar: Grammar) {
	return validateTemplateCoverage(grammar);
}

/** Run factory-render-parse validation with an explicit backend. */
export function runFactory(grammar: Grammar, backend: Backend = 'native') {
	return validateFactoryRenderParse(grammar, backend);
}
