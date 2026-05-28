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
// Arg parsing
// ---------------------------------------------------------------------------

interface ParsedArgs {
	grammar: string;
	showHelp: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
	let grammar = 'rust';
	let showHelp = false;

	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === '--grammar' && argv[i + 1] !== undefined) {
			grammar = argv[i + 1]!;
			i++;
		} else if (argv[i] === '--help') {
			showHelp = true;
		}
	}

	return { grammar, showHelp };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function run(argv: string[]): Promise<number> {
	const { grammar, showHelp } = parseArgs(argv);

	if (showHelp) {
		process.stdout.write(
			'Usage: grammar-diagnostics [--grammar <name>]\n' +
				'\n' +
				'Options:\n' +
				'  --grammar  grammar name (default: rust)\n' +
				'\n' +
				'Exit codes:\n' +
				'  0  no diagnostics\n' +
				'  1  diagnostics present\n',
		);
		return 0;
	}

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

// ---------------------------------------------------------------------------
// _isMain guard
// ---------------------------------------------------------------------------

const _isMain = import.meta.url === `file://${process.argv[1]}`;
if (_isMain) {
	run(process.argv.slice(2))
		.then(process.exit)
		.catch((e: unknown) => {
			process.stderr.write(`grammar-diagnostics: ${(e as Error).stack ?? e}\n`);
			process.exit(1);
		});
}
