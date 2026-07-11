export { run as listKinds, type ListKindsOptions } from './discover/list-kinds.ts';
export { run as probeKind, type ProbeKindOptions } from './probe/kind.ts';
export { run as probeStages, type ProbeStagesOptions } from './probe/stages.ts';
export { run as variantDerivationProbe, type VariantDerivationProbeOptions } from './probe/variant-derivation.ts';
export { run as probeParity, type ProbeParityOptions } from './probe/parity.ts';
export { run as probeValidate, type ProbeValidateOptions } from './probe/validate.ts';
export { run as profile, type ProfileOptions } from './profile/failures.ts';
export { run as profileFactory, type ProfileFactoryOptions } from './profile/factory.ts';
export { run as bench, type BenchOptions } from './profile/bench.ts';
export { run as benchCodemod, type BenchCodemodOptions } from './profile/codemod.ts';
export { run as diffFailures, type DiffFailuresOptions } from './validate/diff.ts';
export { run as dumpAstMismatches, type DumpAstMismatchesOptions } from './validate/dump-ast-mismatches.ts';
export { run as checkBaseline, type CheckBaselineOptions } from './validate/baseline.ts';
export { run as propose14, type Propose14Options } from './validate/propose-14.ts';
export { run as checkPerf, type CheckPerfOptions } from './validate/perf.ts';
export { run as checkJinja, type CheckJinjaOptions } from './validate/jinja.ts';
export { run as classify, type ClassifyOptions } from './discover/classify.ts';
export { run as phantomKinds, type PhantomKindsOptions } from './discover/phantom.ts';
export { run as fieldProvenance, type FieldProvenanceOptions } from './discover/provenance.ts';
export { run as inspectType, DEFAULT_NAMESPACES, type InspectTypeOptions } from './inspect/type.ts';
export { run as inspectRefs, type InspectRefsOptions } from './inspect/refs.ts';
export { run as compareOverrides, type CompareOverridesOptions } from './inspect/overrides.ts';
export { run as grammarDiagnostics, type GrammarDiagnosticsOptions } from './inspect/grammar-diagnostics.ts';
export { run as walk, type WalkOptions } from './exercise/walk.ts';
export { run as exercise, type ExerciseOptions } from './exercise/roundtrip.ts';
export { emitParityFixtures, runRoundtripProbes } from './post-generate.ts';

// --- Canonical validation facade (absorbed from the former @sittir/validator) ---
// Validation is a tool: it inspects the codegen product, so it lives here next to
// the probes/baseline/diff diagnostics it shares infrastructure with.
export {
	runFrom,
	runRt,
	runCoverage,
	runFactory,
	defaultTemplatesPath,
	formatFromReport,
	formatFactoryRenderParseReport,
	formatReadRenderParseReport
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
	CoverageIssue
} from './run.ts';

export { appendHistory, readHistory, historyPath } from './history.ts';
export type { ValidationRun } from './history.ts';

export { appendTestHistory, readTestHistory, testHistoryPath } from './test-history.ts';
export type { TestRun } from './test-history.ts';

export { recordTestRun } from './scripts/record-test-run.ts';
export type { TestRunResult } from './scripts/record-test-run.ts';

export {
	runCountsCli,
	runProbeFactoryCli,
	runHistoryCli,
	runTestHistoryCli,
	runTraceRtCli,
	resolveGrammars,
	resolveBackends
} from './commands.ts';
