/**
 * inspect/grammar-diagnostics — run pre-codegen grammar diagnostics for a grammar.
 *
 * CLI:
 *   grammar-diagnostics [--grammar <name>] [--stage raw|enriched]
 *
 * Options:
 *   --grammar  grammar name (default: rust)
 *   --stage    diagnose an evaluated stage instead of the wired grammar:
 *              `raw` is the upstream base, `enriched` is that base after
 *              enrich, both with no wire config
 *
 * Without --stage it runs the gate generation runs (`diagnoseGrammar`), with
 * the grammar's generated id tables.
 *
 * Exit codes:
 *   0  the gate passes (--stage: no diagnostics)
 *   1  the gate blocks generation (--stage: diagnostics present)
 *   2  --stage and no stages were evaluated
 */

import { evaluateGrammar, invoke, type GeneratedIdTables, type GrammarDiagnostic, type RawGrammar } from '../codegen-surface.ts';

export type DiagnosedStage = 'raw' | 'enriched';

export interface GrammarDiagnosticsOptions {
	grammar: string;
	stage?: DiagnosedStage;
}

export async function run(opts: GrammarDiagnosticsOptions): Promise<number> {
	const { grammar, stage } = opts;
	const rawGrammar = await evaluateGrammar(grammar);
	if (stage === undefined) {
		return diagnoseEvaluated(grammar, rawGrammar, await invoke('generatedMetadata', 'loadGeneratedIdTables', grammar));
	}
	if (rawGrammar.stages === undefined) {
		process.stderr.write(`${grammar}: no stages were evaluated (the grammar declares no rules: or patches:)\n`);
		return 2;
	}
	return report(await invoke('stage', 'diagnoseEvaluationStage', rawGrammar.stages[stage]));
}

export async function diagnoseEvaluated(grammar: string, evaluated: RawGrammar, generatedIdTables?: GeneratedIdTables): Promise<number> {
	const diagnosis = await invoke('compile', 'diagnoseGrammar', { grammar, evaluated, generatedIdTables });
	process.stdout.write((await invoke('grammarDiagnostics', 'formatGrammarDiagnostics', diagnosis.grammarDiagnostics)) + '\n');
	if (diagnosis.passed) return 0;
	process.stderr.write(`${grammar}: generation is blocked by ${diagnosis.blocked.length} diagnostic(s): ${[...new Set(diagnosis.blocked.map((d) => d.code))].join(', ')}\n`);
	return 1;
}

async function report({ diagnostics }: { readonly diagnostics: readonly GrammarDiagnostic[] }): Promise<number> {
	process.stdout.write((await invoke('grammarDiagnostics', 'formatGrammarDiagnostics', diagnostics)) + '\n');
	return diagnostics.length > 0 ? 1 : 0;
}
