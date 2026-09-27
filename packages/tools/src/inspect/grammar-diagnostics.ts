/**
 * inspect/grammar-diagnostics — run pre-codegen grammar diagnostics for a grammar.
 *
 * CLI:
 *   grammar-diagnostics [--grammar <name>] [--upstream]
 *
 * Options:
 *   --grammar   grammar name (default: rust)
 *   --upstream  diagnose the grammar's base evaluated with no wire config
 *
 * Exit codes:
 *   0  no diagnostics
 *   1  diagnostics present
 *   2  --upstream and no upstream was evaluated
 */

// Codegen phases/loaders + their real types come from the shared codegen-surface
// (typed invoke + import()-type aliases); no local stub types or dynamic-import
// loader are needed here.
import { invoke, resolveEntryPath, type RawGrammar } from '../codegen-surface.ts';

export interface GrammarDiagnosticsOptions {
	grammar: string;
	upstream?: boolean;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function run(opts: GrammarDiagnosticsOptions): Promise<number> {
	const { grammar } = opts;

	// Overrides-aware entry, matching run-codegen.ts — a raw-grammar-only
	// entry evaluates a different grammar than what real codegen compiles,
	// so its diagnostics don't reflect what actually ships.
	const entryPath = await resolveEntryPath(grammar);
	const rawGrammar = await invoke('evaluate', 'evaluate', entryPath);
	if (opts.upstream === true) return runUpstream(grammar, rawGrammar.upstream);
	const diagnostics = await invoke('grammarDiagnostics', 'diagnoseStage', rawGrammar);

	process.stdout.write((await invoke('grammarDiagnostics', 'formatGrammarDiagnostics', diagnostics)) + '\n');
	return diagnostics.length > 0 ? 1 : 0;
}

async function runUpstream(grammar: string, evaluation: RawGrammar['upstream']): Promise<number> {
	if (evaluation === undefined) {
		process.stderr.write(`${grammar}: no upstream was evaluated (the grammar declares no rules: or patches:)\n`);
		return 2;
	}
	const upstream = await invoke('upstream', 'compileUpstream', evaluation);
	process.stdout.write((await invoke('grammarDiagnostics', 'formatGrammarDiagnostics', upstream.diagnostics)) + '\n');
	return upstream.diagnostics.length > 0 ? 1 : 0;
}
