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

// ---------------------------------------------------------------------------
// Minimal local types — mirrors the codegen interfaces we need.
// Using local definitions avoids cross-project static imports (TS6307).
// The actual values are loaded via dynamic import at runtime.
// ---------------------------------------------------------------------------

interface GrammarDiagnostic {
	readonly code: string;
	readonly severity: 'warning' | 'error';
	readonly grammar: string;
	readonly ownerKind: string;
	readonly slotName?: string;
	readonly message: string;
	readonly proposal?: string;
	readonly canProceed: boolean;
	readonly details?: Record<string, unknown>;
}

interface RawGrammar {
	name: string;
	[key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Dynamic codegen module loader — avoids TS6307 (cross-project .ts imports)
//
// TypeScript resolves literal-string import() calls statically and follows
// transitive imports, causing TS6307 cascade. Widening the path to `string`
// (via explicit annotation) makes import(path: string) → Promise<any>,
// keeping the cross-boundary load transparent to the type-checker.
// ---------------------------------------------------------------------------

/** Codegen module specifiers — explicit `string` annotation prevents literal inference. */
const CODEGEN_PATHS: Record<string, string> = {
	grammarDiagnostics: '../../../codegen/src/compiler/grammar-diagnostics.ts',
	evaluate: '../../../codegen/src/compiler/evaluate.ts',
	resolve: '../../../codegen/src/compiler/resolve-grammar.ts',
};

export interface GrammarDiagnosticsOptions {
	grammar: string;
}

async function loadCodegenModules(): Promise<{
	collectGrammarDiagnosticsForGrammar: (input: {
		rawGrammar: RawGrammar;
	}) => { nodeMap: unknown; diagnostics: readonly GrammarDiagnostic[] };
	formatGrammarDiagnostics: (diagnostics: readonly GrammarDiagnostic[]) => string;
	evaluate: (entryPath: string) => Promise<RawGrammar>;
	resolveGrammarJsPath: (grammar: string) => string;
}> {
	const diagMod: {
		collectGrammarDiagnosticsForGrammar: (input: {
			rawGrammar: RawGrammar;
		}) => { nodeMap: unknown; diagnostics: readonly GrammarDiagnostic[] };
		formatGrammarDiagnostics: (diagnostics: readonly GrammarDiagnostic[]) => string;
	} = await import(CODEGEN_PATHS['grammarDiagnostics']!);

	const evalMod: { evaluate: (p: string) => Promise<RawGrammar> } =
		await import(CODEGEN_PATHS['evaluate']!);

	const resolveMod: { resolveGrammarJsPath: (g: string) => string } =
		await import(CODEGEN_PATHS['resolve']!);

	return {
		collectGrammarDiagnosticsForGrammar: diagMod.collectGrammarDiagnosticsForGrammar,
		formatGrammarDiagnostics: diagMod.formatGrammarDiagnostics,
		evaluate: evalMod.evaluate,
		resolveGrammarJsPath: resolveMod.resolveGrammarJsPath,
	};
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function run(opts: GrammarDiagnosticsOptions): Promise<number> {
	const { grammar } = opts;

	const {
		collectGrammarDiagnosticsForGrammar,
		formatGrammarDiagnostics,
		evaluate,
		resolveGrammarJsPath,
	} = await loadCodegenModules();

	const grammarJsPath = resolveGrammarJsPath(grammar);
	const rawGrammar = await evaluate(grammarJsPath);
	const { diagnostics } = collectGrammarDiagnosticsForGrammar({ rawGrammar });

	process.stdout.write(formatGrammarDiagnostics(diagnostics) + '\n');
	return diagnostics.length > 0 ? 1 : 0;
}
