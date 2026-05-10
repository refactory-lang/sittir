/**
 * inspect/refs — merged inspect-refs + inspect-suggestions tool.
 *
 * Modes:
 *   refs        — dump every reference TO a given symbol (who names it, who doesn't).
 *   suggestions — dump derivation log from Link: inferred fields, promoted rules,
 *                 repeated shapes. Replaces the old inspect-suggestions.ts positional script.
 *
 * CLI:
 *   inspect-refs [--mode refs|suggestions] [--grammar <name>] [--symbol <name>]
 *                [--base] [--limit <n>]
 *
 * Options:
 *   --mode         refs | suggestions  (default: refs)
 *   --grammar      grammar name        (default: rust)
 *   --symbol       target symbol name  (refs mode only, default: _type_identifier)
 *   --base         use base grammar.js instead of overrides (where available)
 *   --limit        max entries per section in suggestions mode (default: 10)
 */

import { existsSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Minimal local types — mirrors the codegen compiler interfaces we need.
// Using local definitions avoids cross-project static imports (TS6307).
// The actual values are loaded via dynamic import at runtime.
// ---------------------------------------------------------------------------

interface SymbolRef {
	refType: 'symbol' | 'alias' | 'token';
	from: string;
	to: string;
	fieldName?: string;
	optional?: boolean;
	repeated?: boolean;
}

interface RawGrammar {
	references: SymbolRef[];
}

interface InferredFieldEntry {
	kind: string;
	fieldName: string;
	targetSymbol: string;
	confidence: 'high' | 'medium' | 'low';
	agreement: number;
	sampleSize: number;
	applied: boolean;
}

interface PromotedRuleEntry {
	kind: string;
	classification: 'enum' | 'supertype' | 'terminal' | 'polymorph';
	applied: boolean;
}

interface RepeatedShapeEntry {
	suggestedName: string;
	kinds: readonly string[];
	parents: readonly string[];
	shape: 'supertype' | 'group';
}

interface DerivationLog {
	inferredFields: InferredFieldEntry[];
	promotedRules: PromotedRuleEntry[];
	repeatedShapes: RepeatedShapeEntry[];
}

interface LinkedGrammar {
	derivations: DerivationLog;
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
	evaluate: '../../../codegen/src/compiler/evaluate.ts',
	link: '../../../codegen/src/compiler/link.ts',
	resolve: '../../../codegen/src/compiler/resolve-grammar.ts',
};

async function loadCodegenModules(): Promise<{
	evaluate: (entryPath: string) => Promise<RawGrammar>;
	link: (raw: RawGrammar) => LinkedGrammar;
	resolveGrammarJsPath: (grammar: string) => string;
	resolveOverridesPath: (grammar: string) => string;
}> {
	// Dynamic imports with Record-typed strings: TypeScript sees import(string)
	// → Promise<any> at compile time. The typed annotations are the contract.
	const evalMod: { evaluate: (p: string) => Promise<RawGrammar> } =
		await import(CODEGEN_PATHS['evaluate']!);
	const linkMod: { link: (raw: RawGrammar) => LinkedGrammar } =
		await import(CODEGEN_PATHS['link']!);
	const resolveMod: {
		resolveGrammarJsPath: (g: string) => string;
		resolveOverridesPath: (g: string) => string;
	} = await import(CODEGEN_PATHS['resolve']!);

	return {
		evaluate: evalMod.evaluate,
		link: linkMod.link,
		resolveGrammarJsPath: resolveMod.resolveGrammarJsPath,
		resolveOverridesPath: resolveMod.resolveOverridesPath,
	};
}

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

interface ParsedArgs {
	mode: 'refs' | 'suggestions';
	grammar: string;
	symbol: string;
	useBase: boolean;
	limit: number;
	showHelp: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
	let mode: 'refs' | 'suggestions' = 'refs';
	let grammar = 'rust';
	let symbol = '_type_identifier';
	let useBase = false;
	let limit = 10;
	let showHelp = false;

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--mode') {
			if (argv[i + 1] === undefined) throw new Error('--mode requires a value');
			const v = argv[++i];
			if (v !== 'refs' && v !== 'suggestions') {
				throw new Error(`--mode must be refs or suggestions, got: ${v ?? '(missing)'}`);
			}
			mode = v;
		} else if (arg === '--grammar') {
			grammar = argv[++i] ?? grammar;
		} else if (arg === '--symbol') {
			symbol = argv[++i] ?? symbol;
		} else if (arg === '--base') {
			useBase = true;
		} else if (arg === '--limit') {
			if (argv[i + 1] === undefined) throw new Error('--limit requires a value');
			const raw = argv[++i];
			const n = parseInt(raw ?? '', 10);
			if (isNaN(n) || n < 1) throw new Error(`--limit must be a positive integer, got: ${raw}`);
			limit = n;
		} else if (arg === '--help') {
			showHelp = true;
		}
	}

	return { mode, grammar, symbol, useBase, limit, showHelp };
}

function printUsage(): void {
	process.stdout.write(
		[
			'Usage: inspect-refs [--mode refs|suggestions] [--grammar <name>]',
			'                    [--symbol <name>] [--base] [--limit <n>]',
			'',
			'  --mode         refs | suggestions  (default: refs)',
			'  --grammar      grammar name        (default: rust)',
			'  --symbol       symbol name         (refs mode only, default: _type_identifier)',
			'  --base         use base grammar.js instead of overrides',
			'  --limit        max entries per section in suggestions (default: 10)',
		].join('\n') + '\n',
	);
}

// ---------------------------------------------------------------------------
// Entry resolution
// ---------------------------------------------------------------------------

function resolveEntryPath(
	overridesPath: string,
	grammarJsPath: string,
	useBase: boolean,
): string {
	if (!useBase && existsSync(overridesPath)) return overridesPath;
	return grammarJsPath;
}

// ---------------------------------------------------------------------------
// Mode: refs
// ---------------------------------------------------------------------------

async function runRefs(args: ParsedArgs): Promise<number> {
	const { evaluate, resolveGrammarJsPath, resolveOverridesPath } = await loadCodegenModules();
	const entryPath = resolveEntryPath(
		resolveOverridesPath(args.grammar),
		resolveGrammarJsPath(args.grammar),
		args.useBase,
	);
	process.stdout.write(`entry: ${entryPath}\n`);

	const raw = await evaluate(entryPath);
	const refs = raw.references.filter((r) => r.to === args.symbol);

	process.stdout.write(`\n${refs.length} references to ${args.symbol}:\n`);

	const named = refs.filter((r) => r.fieldName !== undefined);
	const unnamed = refs.filter((r) => r.fieldName === undefined);
	process.stdout.write(`  named:   ${named.length}\n`);
	process.stdout.write(`  unnamed: ${unnamed.length}\n\n`);

	process.stdout.write('Named references (parent → fieldName):\n');
	for (const r of named) {
		const flags = [r.optional ? '[optional]' : '', r.repeated ? '[repeated]' : '']
			.filter(Boolean)
			.join(' ');
		process.stdout.write(
			`  ${r.from} → field('${r.fieldName}')${flags ? ' ' + flags : ''}\n`,
		);
	}

	process.stdout.write('\nUnnamed references (parent only):\n');
	for (const r of unnamed) {
		const flags = [r.optional ? '[optional]' : '', r.repeated ? '[repeated]' : '']
			.filter(Boolean)
			.join(' ');
		process.stdout.write(`  ${r.from}${flags ? ' ' + flags : ''}\n`);
	}

	return 0;
}

// ---------------------------------------------------------------------------
// Mode: suggestions
// ---------------------------------------------------------------------------

async function runSuggestions(args: ParsedArgs): Promise<number> {
	const { evaluate, link, resolveGrammarJsPath, resolveOverridesPath } =
		await loadCodegenModules();
	const entryPath = resolveEntryPath(
		resolveOverridesPath(args.grammar),
		resolveGrammarJsPath(args.grammar),
		args.useBase,
	);
	process.stdout.write(`entry: ${entryPath}\n`);

	const raw = await evaluate(entryPath);
	process.stdout.write(`raw.references: ${raw.references.length}\n`);

	const namedRefs = raw.references.filter((r) => r.fieldName !== undefined);
	process.stdout.write(`  with fieldName: ${namedRefs.length}\n`);
	const samples = raw.references.slice(0, 5);
	process.stdout.write('  first 5:\n');
	for (const r of samples) process.stdout.write(`    ${JSON.stringify(r)}\n`);

	const linked = link(raw);
	const { derivations } = linked;
	const { inferredFields, promotedRules, repeatedShapes } = derivations;

	process.stdout.write(
		`\n${args.grammar}: ${inferredFields.length} inferred fields, ` +
			`${promotedRules.length} promoted rules, ` +
			`${repeatedShapes.length} repeated shapes\n`,
	);

	// By classification
	const byClass: Record<string, number> = {};
	for (const p of promotedRules) {
		byClass[p.classification] = (byClass[p.classification] ?? 0) + 1;
	}
	process.stdout.write(`Promotions by classification: ${JSON.stringify(byClass)}\n\n`);

	// Inferred fields section
	process.stdout.write(`--- inferred fields (first ${args.limit}) ---\n`);
	let n = 0;
	for (const f of inferredFields) {
		if (n++ >= args.limit) break;
		process.stdout.write(
			`  ${f.kind}: field('${f.fieldName}', $.${f.targetSymbol})  ` +
				`[${f.confidence}] agreement=${f.agreement.toFixed(2)} n=${f.sampleSize}` +
				`${f.applied ? '' : ' [held]'}\n`,
		);
	}
	process.stdout.write('\n');

	// Promoted rules section
	process.stdout.write(`--- promoted rules (first ${args.limit}) ---\n`);
	n = 0;
	for (const p of promotedRules) {
		if (n++ >= args.limit) break;
		process.stdout.write(
			`  ${p.kind}: ${p.classification}${p.applied ? '' : ' [held]'}\n`,
		);
	}
	process.stdout.write('\n');

	// Repeated shapes section
	process.stdout.write(`--- repeated shapes (first ${args.limit}) ---\n`);
	n = 0;
	for (const s of repeatedShapes) {
		if (n++ >= args.limit) break;
		process.stdout.write(
			`  ${s.suggestedName} [${s.shape}]: kinds=[${s.kinds.join(', ')}]  ` +
				`parents=[${s.parents.join(', ')}]\n`,
		);
	}

	return 0;
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
	if (args.mode === 'suggestions') return runSuggestions(args);
	return runRefs(args);
}

// ---------------------------------------------------------------------------
// _isMain guard
// ---------------------------------------------------------------------------

const _isMain = import.meta.url === `file://${process.argv[1]}`;
if (_isMain) {
	run(process.argv.slice(2))
		.then(process.exit)
		.catch((e: unknown) => {
			process.stderr.write(`inspect-refs: ${(e as Error).stack ?? e}\n`);
			process.exit(1);
		});
}
