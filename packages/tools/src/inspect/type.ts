/**
 * inspect/type — Loose / Config type-shape inspector via the TS compiler API.
 *
 * Scope: currently targets packages/<grammar>/src/types.ts.
 * The Rust grammar is the default since that is the primary type-shape
 * development surface. Other grammars work if they follow the same
 * `<KindNs>` namespace pattern (e.g. `FieldDeclarationNs` containing
 * `.Loose`, `.Config` members).
 *
 * NOTE: This tool is effectively Rust-types-focused today. Other grammars
 * can be tried with --grammar but output quality depends on how closely
 * their types.ts follows the Ns interface convention.
 *
 * CLI:
 *   inspect-type [--grammar <name>] [--entry <kindNs>] [--namespaces <ns,...>]
 *                [--slots] [--config]
 *
 * Options:
 *   --grammar      grammar package name (default: rust)
 *   --entry        single Ns interface to inspect (default: FieldDeclarationNs)
 *   --namespaces   comma-separated Ns list (overrides --entry)
 *   --slots        also print each slot's type on the resolved Loose shape
 *   --config       also print Config shape for comparison
 */

import * as ts from 'typescript';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

interface ParsedArgs {
	grammar: string;
	namespaces: string[];
	showSlots: boolean;
	showConfig: boolean;
	showHelp: boolean;
}

const DEFAULT_NAMESPACES: Record<string, string[]> = {
	rust: ['FieldDeclarationNs'],
};

function parseArgs(argv: string[]): ParsedArgs {
	let grammar = 'rust';
	let entry: string | undefined;
	let namespacesCsv: string | undefined;
	let showSlots = false;
	let showConfig = false;
	let showHelp = false;

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--grammar') {
			grammar = argv[++i] ?? grammar;
		} else if (arg === '--entry') {
			if (argv[i + 1] === undefined) throw new Error('--entry requires a value');
			entry = argv[++i];
		} else if (arg === '--namespaces') {
			if (argv[i + 1] === undefined) throw new Error('--namespaces requires a value');
			namespacesCsv = argv[++i];
		} else if (arg === '--slots') {
			showSlots = true;
		} else if (arg === '--config') {
			showConfig = true;
		} else if (arg === '--help') {
			showHelp = true;
		}
	}

	let namespaces: string[];
	if (namespacesCsv !== undefined) {
		namespaces = namespacesCsv
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
	} else if (entry !== undefined) {
		namespaces = [entry];
	} else {
		namespaces = DEFAULT_NAMESPACES[grammar] ?? ['FieldDeclarationNs'];
	}

	return { grammar, namespaces, showSlots, showConfig, showHelp };
}

function printUsage(): void {
	process.stdout.write(
		[
			'Usage: inspect-type [--grammar <name>] [--entry <kindNs>]',
			'                    [--namespaces <ns,...>] [--slots] [--config]',
			'',
			'NOTE: Rust-types-focused by default. Other grammars require the same',
			'      <KindNs>.Loose / <KindNs>.Config namespace shape.',
			'',
			'  --grammar      grammar name (default: rust)',
			'  --entry        single Ns interface (default: FieldDeclarationNs)',
			'  --namespaces   comma-separated Ns list (overrides --entry)',
			'  --slots        print each slot type on the resolved Loose shape',
			'  --config       print Config shape for comparison',
		].join('\n') + '\n',
	);
}

// ---------------------------------------------------------------------------
// Resolve types.ts path for a grammar
// ---------------------------------------------------------------------------

function resolveTypesPath(grammar: string): string {
	// Navigate from tools/src/inspect/ → tools/src/ → tools/ → packages/ → root
	const here = fileURLToPath(import.meta.url);
	const toolsSrc = path.dirname(path.dirname(here)); // tools/src/
	const packagesDir = path.dirname(path.dirname(toolsSrc)); // packages/
	const candidate = path.join(packagesDir, grammar, 'src', 'types.ts');
	if (!fs.existsSync(candidate)) {
		throw new Error(`types.ts not found for grammar "${grammar}": ${candidate}`);
	}
	return candidate;
}

// ---------------------------------------------------------------------------
// TS compiler program builder
// ---------------------------------------------------------------------------

function buildProgram(entry: string): ts.Program {
	return ts.createProgram({
		rootNames: [entry],
		options: {
			target: ts.ScriptTarget.ES2022,
			module: ts.ModuleKind.ESNext,
			moduleResolution: ts.ModuleResolutionKind.Bundler,
			strict: true,
			skipLibCheck: true,
			noEmit: true,
			allowImportingTsExtensions: true,
		},
	});
}

const TYPE_FLAGS =
	ts.TypeFormatFlags.InTypeAlias |
	ts.TypeFormatFlags.NoTruncation |
	ts.TypeFormatFlags.WriteArrayAsGenericType;

function printType(label: string, type: ts.Type, checker: ts.TypeChecker): void {
	const str = checker.typeToString(type, undefined, TYPE_FLAGS);
	process.stdout.write(`\n=== ${label} ===\n${str}\n`);
}

// ---------------------------------------------------------------------------
// AST helpers
// ---------------------------------------------------------------------------

/** Walk a source file to find an interface, type alias, or namespace by name. */
function findDeclSymbol(
	name: string,
	source: ts.SourceFile,
	checker: ts.TypeChecker,
): ts.Symbol | undefined {
	let found: ts.Symbol | undefined;

	function visit(node: ts.Node): void {
		if (found) return;
		if (
			(ts.isInterfaceDeclaration(node) ||
				ts.isTypeAliasDeclaration(node) ||
				ts.isModuleDeclaration(node)) &&
			node.name.text === name
		) {
			const sym = checker.getSymbolAtLocation(node.name);
			if (sym) found = sym;
		}
		ts.forEachChild(node, visit);
	}

	visit(source);
	return found;
}

/** Print the type of each first-level property on a given type. */
function printSlotTypes(
	parentLabel: string,
	type: ts.Type,
	checker: ts.TypeChecker,
): void {
	for (const prop of type.getProperties()) {
		const decl = prop.declarations?.[0];
		if (!decl) continue;
		const propType = checker.getTypeOfSymbolAtLocation(prop, decl);
		printType(`${parentLabel}.${prop.name}`, propType, checker);
	}
}

// ---------------------------------------------------------------------------
// Per-namespace inspection
// ---------------------------------------------------------------------------

function inspectNs(
	nsName: string,
	source: ts.SourceFile,
	checker: ts.TypeChecker,
	args: ParsedArgs,
): void {
	const nsSym = findDeclSymbol(nsName, source, checker);
	if (!nsSym) {
		process.stderr.write(`  warning: ${nsName} not found in source file\n`);
		return;
	}

	/** Resolve a named member from the symbol, whether namespace or type. */
	function getMember(sym: ts.Symbol, memberName: string): ts.Symbol | undefined {
		// Namespace: use getExportsOfModule
		if (sym.flags & ts.SymbolFlags.NamespaceModule || sym.flags & ts.SymbolFlags.ValueModule) {
			return checker.getExportsOfModule(sym).find((e) => e.name === memberName);
		}
		// Interface / type alias: use getDeclaredTypeOfSymbol().getProperty()
		const nsType = checker.getDeclaredTypeOfSymbol(sym);
		return nsType.getProperty(memberName);
	}

	/** Get the type of a member symbol (handles both type alias and property). */
	function getMemberType(sym: ts.Symbol): ts.Type {
		if (sym.flags & ts.SymbolFlags.TypeAlias) {
			return checker.getDeclaredTypeOfSymbol(sym);
		}
		const decl = sym.declarations?.[0];
		if (decl) return checker.getTypeOfSymbolAtLocation(sym, decl);
		return checker.getDeclaredTypeOfSymbol(sym);
	}

	// Loose
	const looseSym = getMember(nsSym, 'Loose');
	if (!looseSym) {
		process.stdout.write(`${nsName}: no Loose member\n`);
	} else {
		const looseType = getMemberType(looseSym);
		printType(`${nsName}.Loose`, looseType, checker);
		if (args.showSlots) {
			printSlotTypes(`${nsName}.Loose`, looseType, checker);
		}
	}

	// Config (optional, shown with --config)
	if (args.showConfig) {
		const configSym = getMember(nsSym, 'Config');
		if (configSym) {
			const configType = getMemberType(configSym);
			printType(`${nsName}.Config`, configType, checker);
			if (args.showSlots) {
				printSlotTypes(`${nsName}.Config`, configType, checker);
			}
		}
	}
}

// ---------------------------------------------------------------------------
// Public run entry point
// ---------------------------------------------------------------------------

export async function run(argv: string[]): Promise<number> {
	const args = parseArgs(argv);
	if (args.showHelp) {
		printUsage();
		return 0;
	}

	const typesPath = resolveTypesPath(args.grammar);
	process.stdout.write(
		`inspect-type: grammar=${args.grammar}\n` +
			`entry: ${typesPath}\n` +
			`namespaces: ${args.namespaces.join(', ')}\n`,
	);

	const program = buildProgram(typesPath);
	const checker = program.getTypeChecker();
	const source = program.getSourceFile(typesPath);

	if (!source) {
		process.stderr.write(`error: TypeScript program did not load ${typesPath}\n`);
		return 1;
	}

	const errors = ts
		.getPreEmitDiagnostics(program)
		.filter((d) => d.category === ts.DiagnosticCategory.Error);
	if (errors.length > 0) {
		process.stderr.write(
			`warning: ${errors.length} compile error(s) — output may be incomplete\n`,
		);
	}

	for (const nsName of args.namespaces) {
		inspectNs(nsName, source, checker, args);
	}

	return 0;
}

// ---------------------------------------------------------------------------
// _isMain guard
// ---------------------------------------------------------------------------

const _isMain = import.meta.url === `file://${process.argv[1]}`;
if (_isMain) {
	run(process.argv.slice(2))
		.then(process.exit)
		.catch((e: unknown) => {
			process.stderr.write(`inspect-type: ${(e as Error).stack ?? e}\n`);
			process.exit(1);
		});
}
