/**
 * @sittir/validator — canonical validation facade.
 *
 * Wraps `@sittir/codegen` validate implementations behind a stable API
 * with explicit backend propagation. Also owns the append-only
 * validation history (see `appendHistory` / `readHistory`).
 */

export {
	runFrom,
	runRt,
	runCoverage,
	runFactory,
	defaultTemplatesPath,
	formatFromReport,
	formatFactoryRenderParseReport,
	formatReadRenderParseReport,
} from './run.ts';

export type {
	Grammar,
	Backend,
	FromValidationResult,
	FromValidationError,
	FactoryRenderParseResult,
	ReadRenderParseResult,
	ValidateReadRenderParseOptions,
	TemplateCoverageResult,
	CoverageIssue,
} from './run.ts';

export {
	appendHistory,
	readHistory,
	historyPath,
} from './history.ts';

export type { ValidationRun } from './history.ts';
