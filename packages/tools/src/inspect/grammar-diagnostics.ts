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
 * Exit codes:
 *   0  no diagnostics
 *   1  diagnostics present
 *   2  --stage and no stages were evaluated
 */

import { invoke, resolveEntryPath, type GrammarDiagnostic } from '../codegen-surface.ts';

export type DiagnosedStage = 'raw' | 'enriched';

export interface GrammarDiagnosticsOptions {
	grammar: string;
	stage?: DiagnosedStage;
}

export async function run(opts: GrammarDiagnosticsOptions): Promise<number> {
	const { grammar, stage } = opts;
	const entryPath = await resolveEntryPath(grammar);
	const rawGrammar = await invoke('evaluate', 'evaluate', entryPath);
	if (stage === undefined) return report(await invoke('grammarDiagnostics', 'diagnoseStage', rawGrammar));
	if (rawGrammar.stages === undefined) {
		process.stderr.write(`${grammar}: no stages were evaluated (the grammar declares no rules: or patches:)\n`);
		return 2;
	}
	return report(await invoke('stage', 'diagnoseEvaluationStage', rawGrammar.stages[stage]));
}

async function report({ diagnostics }: { readonly diagnostics: readonly GrammarDiagnostic[] }): Promise<number> {
	process.stdout.write((await invoke('grammarDiagnostics', 'formatGrammarDiagnostics', diagnostics)) + '\n');
	return diagnostics.length > 0 ? 1 : 0;
}
