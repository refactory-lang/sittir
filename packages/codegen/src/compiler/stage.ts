import { ruleListParts } from '../dsl/rule-patterns.ts';
import { diagnoseStage } from './diagnostics/grammar-diagnostics.ts';
import type { GrammarDiagnostic } from '../types/diagnostics.ts';
import type { EvaluationStages, RuleCatalog, StageEvaluation } from './types.ts';

export interface StageDiagnosis {
	readonly ruleNames: ReadonlySet<string>;
	readonly externalNames: ReadonlySet<string>;
	readonly diagnostics: readonly GrammarDiagnostic[];
	readonly ruleCatalog?: RuleCatalog;
}

export interface StageDiagnoses {
	readonly raw: StageDiagnosis;
	readonly enriched: StageDiagnosis;
}

export function diagnoseEvaluationStage(evaluation: StageEvaluation): StageDiagnosis {
	const { grammar, ruleNames } = evaluation;
	return {
		ruleNames: new Set(ruleNames),
		externalNames: new Set(ruleListParts(grammar.externals).names),
		...diagnoseStage(grammar)
	};
}

export function diagnoseEvaluationStages(stages: EvaluationStages): StageDiagnoses {
	return { raw: diagnoseEvaluationStage(stages.raw), enriched: diagnoseEvaluationStage(stages.enriched) };
}
