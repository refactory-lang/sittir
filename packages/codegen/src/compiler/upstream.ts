import { ruleListParts } from '../dsl/rule-patterns.ts';
import { diagnoseStage } from './diagnostics/grammar-diagnostics.ts';
import type { GrammarDiagnostic } from '../types/diagnostics.ts';
import type { UpstreamEvaluation } from './types.ts';

export interface UpstreamCompilation {
	readonly ruleNames: ReadonlySet<string>;
	readonly externalNames: ReadonlySet<string>;
	readonly diagnostics: readonly GrammarDiagnostic[];
}

export function compileUpstream(evaluation: UpstreamEvaluation): UpstreamCompilation {
	const { raw, ruleNames } = evaluation;
	return {
		ruleNames: new Set(ruleNames),
		externalNames: new Set(ruleListParts(raw.externals).names),
		diagnostics: diagnoseStage(raw)
	};
}
