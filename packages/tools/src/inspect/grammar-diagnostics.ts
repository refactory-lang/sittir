/**
 * inspect/grammar-diagnostics — run pre-codegen grammar diagnostics for a grammar.
 *
 * CLI:
 *   grammar-diagnostics [--grammar <name>]
 *
 * Options:
 *   --grammar  grammar name (default: rust)
 *
 * Exit codes:
 *   0  no diagnostics
 *   1  diagnostics present
 */

// Codegen phases/loaders + their real types come from the shared codegen-surface
// (typed invoke + import()-type aliases); no local stub types or dynamic-import
// loader are needed here.
import { invoke } from '../codegen-surface.ts';

export interface GrammarDiagnosticsOptions {
	grammar: string;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function run(opts: GrammarDiagnosticsOptions): Promise<number> {
	const { grammar } = opts;

	const grammarJsPath = await invoke('resolveGrammar', 'resolveGrammarJsPath', grammar);
	const rawGrammar = await invoke('evaluate', 'evaluate', grammarJsPath);
	const { diagnostics } = await invoke('grammarDiagnostics', 'collectGrammarDiagnosticsForGrammar', {
		rawGrammar,
	});

	process.stdout.write(
		(await invoke('grammarDiagnostics', 'formatGrammarDiagnostics', diagnostics)) + '\n',
	);
	return diagnostics.length > 0 ? 1 : 0;
}
