/**
 * Canonical validation facade — single import point with explicit backend propagation.
 *
 * This module wraps the per-validator functions in `@sittir/codegen/validate/*`
 * and provides a stable API for callers that should not depend on internal
 * codegen paths directly.
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateFrom, formatFromReport, } from '@sittir/codegen/validate/from';
import { validateFactoryRenderParse, formatFactoryRenderParseReport, } from '@sittir/codegen/validate/factory-render-parse';
import { validateReadRenderParse, formatReadRenderParseReport, } from '@sittir/codegen/validate/read-render-parse';
import { validateTemplateCoverage } from '@sittir/codegen/validate/template-coverage';
// Re-export formatting helpers.
export { formatFromReport, formatFactoryRenderParseReport, formatReadRenderParseReport };
/** Resolve the on-disk templates directory for a grammar, relative to this package's location. */
export function defaultTemplatesPath(grammar) {
    // packages/validator/src/ → ../../ → packages/
    const packagesDir = resolve(fileURLToPath(new URL('../..', import.meta.url)));
    return resolve(packagesDir, grammar, 'templates');
}
/** Run from() correctness validation with an explicit backend. */
export function runFrom(grammar, backend = 'native') {
    return validateFrom(grammar, backend);
}
/**
 * Run read-render-parse round-trip validation with an explicit backend.
 * @param templatesPath - absolute path to the grammar's templates directory
 */
export function runRt(grammar, templatesPath, backend = 'native') {
    return validateReadRenderParse(grammar, templatesPath, { backend });
}
/** Run template-coverage structural validation (synchronous). */
export function runCoverage(grammar, templatesPath) {
    return validateTemplateCoverage(grammar, templatesPath);
}
/**
 * Run factory-render-parse validation with an explicit backend.
 * @param templatesPath - absolute path to the grammar's templates directory
 */
export function runFactory(grammar, templatesPath, backend = 'native') {
    return validateFactoryRenderParse(grammar, templatesPath, backend);
}
//# sourceMappingURL=run.js.map