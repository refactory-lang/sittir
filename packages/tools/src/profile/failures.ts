/**
 * profile/failures — aggregate validator failure report across grammars.
 *
 * Scans all four validators (from, rt, cov, factory) for each requested
 * grammar, groups failures by kind × check, and prints a prioritised cluster
 * report surfacing the highest-frequency message patterns and per-check kind
 * breakdowns.
 *
 * Usage:
 *   profile [--grammar rust|typescript|python] [--top N]
 *
 * Options:
 *   --grammar   one grammar only (default: all three)
 *   --top       number of top message patterns to show (default: 15)
 */

// ---------------------------------------------------------------------------
// Local type mirrors — keeps compile-time safety without TS6307 static imports
// ---------------------------------------------------------------------------

type Grammar = 'rust' | 'typescript' | 'python';

// ---------------------------------------------------------------------------
// Dynamic validator module loader — avoids TS6307 cross-project imports
// ---------------------------------------------------------------------------

const VALIDATOR_PATHS: Record<string, string> = {
	run: '../run.ts'
};

interface FromResult {
	errors: Array<{ kind: string; message: string }>;
}

interface RtResult {
	errors: Array<{ name: string; message: string }>;
	astMismatches: Array<{ kind: string; entry?: string; message: string }>;
}

interface CovResult {
	issues: Array<{ kind: string; message: string }>;
}

interface FactoryResult {
	errors: Array<{ kind: string; entry?: string; message: string }>;
	astMismatches: Array<{ kind: string; entry?: string; message: string }>;
}

interface ValidatorModules {
	runFrom: (grammar: Grammar, backend?: string) => Promise<FromResult>;
	runRt: (grammar: Grammar, templatesPath: string, backend?: string) => Promise<RtResult>;
	runCoverage: (grammar: Grammar, templatesPath: string) => CovResult;
	runFactory: (grammar: Grammar, templatesPath: string, backend?: string) => Promise<FactoryResult>;
	defaultTemplatesPath: (grammar: Grammar) => string;
}

async function loadValidatorModules(): Promise<ValidatorModules> {
	const mod: ValidatorModules = await import(VALIDATOR_PATHS['run']!);
	return {
		runFrom: mod.runFrom,
		runRt: mod.runRt,
		runCoverage: mod.runCoverage,
		runFactory: mod.runFactory,
		defaultTemplatesPath: mod.defaultTemplatesPath
	};
}

const ALL_GRAMMARS: readonly Grammar[] = ['rust', 'typescript', 'python'];

export interface ProfileOptions {
	grammar?: string;
	top: number;
}

interface Failure {
	grammar: Grammar;
	/** 'from' | 'rt-reparse' | 'rt-ast' | 'cov' | 'factory-reparse' | 'factory-ast' */
	check: string;
	kind: string;
	message: string;
	entry?: string;
}

// ---------------------------------------------------------------------------
// Per-grammar profile
// ---------------------------------------------------------------------------

/**
 * Extract the kind from an `rt` entry name that may look like `"entry [kind]"`.
 * Returns the raw name when no bracket suffix is present.
 */
function kindFromRtName(name: string): string {
	const m = /\[([^\]]+)]$/.exec(name);
	return m ? m[1]! : name;
}

/** Run all four validators for one grammar and collect Failure records. */
async function profileGrammar(grammar: Grammar): Promise<Failure[]> {
	const { runFrom, runRt, runCoverage, runFactory, defaultTemplatesPath } = await loadValidatorModules();
	const tp = defaultTemplatesPath(grammar);
	const [from, rt, fac] = await Promise.all([
		runFrom(grammar, 'native'),
		runRt(grammar, tp, 'native'),
		runFactory(grammar, tp, 'native')
	]);
	const cov = runCoverage(grammar, tp);

	const failures: Failure[] = [];

	for (const e of from.errors) {
		failures.push({ grammar, check: 'from', kind: e.kind, message: e.message });
	}

	for (const e of rt.errors) {
		failures.push({ grammar, check: 'rt-reparse', kind: kindFromRtName(e.name), message: e.message });
	}
	for (const e of rt.astMismatches) {
		failures.push({ grammar, check: 'rt-ast', kind: e.kind, message: e.message, entry: e.entry });
	}

	for (const i of cov.issues) {
		failures.push({ grammar, check: 'cov', kind: i.kind, message: i.message });
	}

	for (const e of fac.errors) {
		failures.push({ grammar, check: 'factory-reparse', kind: e.kind, message: e.message, entry: e.entry });
	}
	for (const e of fac.astMismatches) {
		failures.push({ grammar, check: 'factory-ast', kind: e.kind, message: e.message, entry: e.entry });
	}

	return failures;
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function report(all: Failure[], top: number): void {
	process.stdout.write(`\n=== ${all.length} total failures ===\n`);

	// Top-N message patterns (normalise numbers so "expected 3 args" and
	// "expected 7 args" bucket together).
	const byMsgPrefix = new Map<string, number>();
	for (const f of all) {
		const pfx = f.message.slice(0, 60).replace(/\d+/g, '#');
		byMsgPrefix.set(pfx, (byMsgPrefix.get(pfx) ?? 0) + 1);
	}
	process.stdout.write(`\n--- Top ${top} failure message patterns ---\n`);
	for (const [m, c] of [...byMsgPrefix.entries()].sort((a, b) => b[1] - a[1]).slice(0, top)) {
		process.stdout.write(`  ${c.toString().padStart(4)} : ${m}\n`);
	}

	// Per-(grammar, check) kind breakdown.
	const byGrammarCheck = new Map<string, Map<string, number>>();
	for (const f of all) {
		const gk = `${f.grammar}:${f.check}`;
		const inner = byGrammarCheck.get(gk) ?? new Map<string, number>();
		inner.set(f.kind, (inner.get(f.kind) ?? 0) + 1);
		byGrammarCheck.set(gk, inner);
	}
	process.stdout.write('\n--- Failures grouped by (grammar, check) ---\n');
	for (const [gk, kinds] of [...byGrammarCheck.entries()].sort()) {
		const sorted = [...kinds.entries()].sort((a, b) => b[1] - a[1]);
		const total = sorted.reduce((s, [, c]) => s + c, 0);
		process.stdout.write(`\n  ${gk}  (${total} failures across ${sorted.length} kinds)\n`);
		for (const [kind, count] of sorted.slice(0, 8)) {
			process.stdout.write(`    ${count.toString().padStart(3)}  ${kind}\n`);
		}
		if (sorted.length > 8) process.stdout.write(`    ... ${sorted.length - 8} more kinds\n`);
	}
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function run(opts: ProfileOptions): Promise<number> {
	const grammars: readonly Grammar[] = opts.grammar ? [opts.grammar as Grammar] : ALL_GRAMMARS;
	const top = opts.top;
	const all: Failure[] = [];
	for (const g of grammars) {
		process.stdout.write(`\n>>> profiling ${g} ...\n`);
		try {
			const f = await profileGrammar(g);
			process.stdout.write(`    ${f.length} failures\n`);
			all.push(...f);
		} catch (e) {
			process.stderr.write(`    ERROR: ${(e as Error).message}\n`);
		}
	}
	report(all, top);
	return 0;
}
