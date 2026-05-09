/**
 * profile/factory — factory-render-parse error bucketing with optional
 * recursive-materialisation and AST-mismatch detail.
 *
 * Merges the diagnostic ideas from three scratch scripts:
 *   - profile-shallow.ts      (shallow mode, top error buckets)
 *   - profile-recursive.ts    (recursive mode, classified buckets with samples)
 *   - profile-recursive-ast.ts (AST mismatch detail alongside bucket counts)
 *
 * Usage:
 *   profile-factory [--grammar rust|typescript|python] [--recursive] [--ast]
 *
 * Options:
 *   --grammar    one grammar only (default: all three)
 *   --recursive  enable SITTIR_VALIDATE_RECURSIVE for deep child materialisation
 *   --ast        include AST-mismatch breakdown alongside reparse errors
 *
 * Note on recursive mode: the SITTIR_VALIDATE_RECURSIVE env var is set for the
 * duration of the validator call and restored to its prior value afterwards via
 * try/finally, leaving no global env mutation behind.
 */

// ---------------------------------------------------------------------------
// Local type mirrors — keeps compile-time safety without TS6307 static imports
// ---------------------------------------------------------------------------

type Grammar = 'rust' | 'typescript' | 'python';

interface FactoryError {
	kind: string;
	entry?: string;
	message: string;
	input?: string;
	rendered?: string;
}

interface FactoryRenderParseResult {
	grammar: string;
	total: number;
	pass: number;
	fail: number;
	skip: number;
	astMatchPass: number;
	errors: FactoryError[];
	astMismatches: FactoryError[];
}

// ---------------------------------------------------------------------------
// Dynamic validator module loader — avoids TS6307 cross-project imports
//
// Record<string, string> annotation strips the literal type so TypeScript
// sees import(string) → Promise<any> at compile time.
// ---------------------------------------------------------------------------

const VALIDATOR_PATHS: Record<string, string> = {
	run: '@sittir/validator',
};

interface ValidatorModules {
	runFactory: (grammar: Grammar, templatesPath: string, backend?: string) => Promise<FactoryRenderParseResult>;
	defaultTemplatesPath: (grammar: Grammar) => string;
}

async function loadValidatorModules(): Promise<ValidatorModules> {
	const mod: ValidatorModules = await import(VALIDATOR_PATHS['run']!);
	return { runFactory: mod.runFactory, defaultTemplatesPath: mod.defaultTemplatesPath };
}

const ALL_GRAMMARS: readonly Grammar[] = ['rust', 'typescript', 'python'];

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

interface ParsedArgs {
	grammars: readonly Grammar[];
	recursive: boolean;
	showAst: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
	let grammars: readonly Grammar[] = ALL_GRAMMARS;
	let recursive = false;
	let showAst = false;
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--grammar' && argv[i + 1]) {
			const g = argv[++i] as Grammar;
			if (ALL_GRAMMARS.includes(g)) grammars = [g];
			else throw new Error(`Unknown grammar: ${g}. Must be one of: ${ALL_GRAMMARS.join(', ')}`);
		} else if (arg === '--recursive') {
			recursive = true;
		} else if (arg === '--ast') {
			showAst = true;
		}
	}
	return { grammars, recursive, showAst };
}

// ---------------------------------------------------------------------------
// Message classification (mirrors profile-recursive.ts logic)
// ---------------------------------------------------------------------------

function classifyMessage(msg: string): string {
	if (msg.startsWith('No render rule')) return 'No render rule';
	if (msg.startsWith('factory threw')) {
		if (/reserved keyword/.test(msg)) return 'factory threw: reserved keyword';
		if (/text .* does not match pattern/.test(msg)) return 'factory threw: pattern mismatch';
		return 'factory threw (other)';
	}
	if (msg.startsWith('re-parse error')) return 're-parse error';
	if (msg.startsWith('kind not found')) return 'kind not found in re-parse';
	return msg.slice(0, 40);
}

// ---------------------------------------------------------------------------
// Per-grammar profiling
// ---------------------------------------------------------------------------

/**
 * Run factory-render-parse for one grammar with optional recursive mode.
 *
 * Recursive mode is enabled by setting `SITTIR_VALIDATE_RECURSIVE=1` before
 * calling the validator and restoring the prior value afterwards — the validator
 * reads this env var internally. The try/finally ensures no global mutation
 * leaks even on error.
 */
async function runFactoryWithRecursive(
	grammar: Grammar,
	recursive: boolean,
): Promise<FactoryRenderParseResult> {
	const { runFactory, defaultTemplatesPath } = await loadValidatorModules();
	const tp = defaultTemplatesPath(grammar);
	const prev = process.env['SITTIR_VALIDATE_RECURSIVE'];
	if (recursive) process.env['SITTIR_VALIDATE_RECURSIVE'] = '1';
	try {
		return await runFactory(grammar, tp, 'native');
	} finally {
		if (recursive) {
			if (prev === undefined) {
				delete process.env['SITTIR_VALIDATE_RECURSIVE'];
			} else {
				process.env['SITTIR_VALIDATE_RECURSIVE'] = prev;
			}
		}
	}
}

/** Print the bucketed error report for one grammar. */
function reportGrammar(result: FactoryRenderParseResult, showAst: boolean): void {
	const { grammar, total, pass, fail, skip, astMatchPass, errors, astMismatches } = result;
	process.stdout.write(
		`\n=== ${grammar} === total=${total} pass=${pass} fail=${fail} skip=${skip} astMatch=${astMatchPass}\n`,
	);

	if (errors.length > 0) {
		// Cluster errors by message classification, keeping up to 3 samples each.
		const buckets = new Map<string, { count: number; samples: typeof errors }>();
		for (const e of errors) {
			const cls = classifyMessage(e.message);
			const b = buckets.get(cls) ?? { count: 0, samples: [] };
			b.count++;
			if (b.samples.length < 3) b.samples.push(e);
			buckets.set(cls, b);
		}
		for (const [cls, { count, samples }] of [...buckets.entries()].sort((a, b) => b[1].count - a[1].count)) {
			process.stdout.write(`\n  [${count}x] ${cls}\n`);
			for (const s of samples) {
				process.stdout.write(`    ${s.kind}${s.entry ? ` (${s.entry})` : ''}: ${s.message.slice(0, 120)}\n`);
			}
		}
	}

	if (showAst && astMismatches.length > 0) {
		process.stdout.write(`\n  --- AST mismatches (${astMismatches.length}) ---\n`);
		const byKind = new Map<string, number>();
		for (const m of astMismatches) byKind.set(m.kind, (byKind.get(m.kind) ?? 0) + 1);
		for (const [k, n] of [...byKind.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
			process.stdout.write(`  ${n.toString().padStart(4)}  ${k}\n`);
		}
		const first = astMismatches[0];
		if (first) {
			process.stdout.write(`  sample: ${first.kind}: ${first.message.slice(0, 140)}\n`);
		}
	}
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function run(argv: string[]): Promise<number> {
	const { grammars, recursive, showAst } = parseArgs(argv);
	if (recursive) process.stdout.write('(recursive mode: SITTIR_VALIDATE_RECURSIVE=1 for each run)\n');

	for (const g of grammars) {
		try {
			const result = await runFactoryWithRecursive(g, recursive);
			reportGrammar(result, showAst);
		} catch (e) {
			process.stderr.write(`${g}: ERROR ${(e as Error).message}\n`);
		}
	}
	return 0;
}

const _isMain = import.meta.url === `file://${process.argv[1]}`;
if (_isMain) {
	run(process.argv.slice(2)).then(process.exit).catch((e) => {
		process.stderr.write(`profile-factory: ${(e as Error).stack ?? e}\n`);
		process.exit(1);
	});
}
