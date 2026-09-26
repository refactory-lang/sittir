import { collectGrammarDiagnosticsForGrammar } from './diagnostics/grammar-diagnostics.ts';
import type { GrammarDiagnostic } from '../types/diagnostics.ts';
import type { UpstreamEvaluation } from './types.ts';

export interface UpstreamCompilation {
	readonly ruleNames: ReadonlySet<string>;
	readonly externalNames: ReadonlySet<string>;
	readonly diagnostics: readonly GrammarDiagnostic[];
	readonly failure?: string;
}

export function compileUpstream(evaluation: UpstreamEvaluation): UpstreamCompilation {
	if ('failure' in evaluation) return failedUpstream(`evaluate: ${evaluation.failure}`);
	const { raw, ruleNames } = evaluation;
	try {
		const { diagnostics } = collectGrammarDiagnosticsForGrammar({ rawGrammar: raw });
		return { ruleNames: new Set(ruleNames), externalNames: new Set(raw.externals), diagnostics };
	} catch (error) {
		return failedUpstream(error instanceof Error ? error.message : String(error));
	}
}

function failedUpstream(failure: string): UpstreamCompilation {
	return { ruleNames: new Set(), externalNames: new Set(), diagnostics: [], failure };
}
