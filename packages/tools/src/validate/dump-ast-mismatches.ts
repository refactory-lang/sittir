/**
 * validate/dump-ast-mismatches — diagnostic for read-render-parse AST gaps.
 *
 * The validator's `astMismatches` list captures entries that pass parse +
 * reparse but produce a structurally-different AST. This tool surfaces them
 * with grouping and filtering to support bug-class triage.
 *
 * ## Usage
 *
 * Single grammar, deep mode (default):
 * ```sh
 * sittir dump-ast-mismatches
 * ```
 *
 * Compare deep vs shallow — find entries that pass shallow but fail deep:
 * ```sh
 * sittir dump-ast-mismatches --grammar rust --mode diff
 * ```
 *
 * Cluster mismatches by message pattern and print a histogram:
 * ```sh
 * sittir dump-ast-mismatches --grammar rust --cluster
 * ```
 *
 * Inspect one entry's INPUT vs RENDERED:
 * ```sh
 * sittir dump-ast-mismatches --grammar rust --filter 'Functions with mutable parameters'
 * ```
 *
 * All three grammars at once:
 * ```sh
 * sittir dump-ast-mismatches --all-grammars --cluster
 * ```
 */

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type Grammar = 'rust' | 'python' | 'typescript';
const GRAMMARS: readonly Grammar[] = ['rust', 'python', 'typescript'];

type Mode = 'deep' | 'shallow' | 'diff';

export interface DumpAstMismatchesOptions {
	grammar: string;
	allGrammars: boolean;
	mode: string;
	filter?: string;
	cluster: boolean;
	format: string;
	verbose: boolean;
}

interface RunOptions {
	grammar: Grammar;
	mode: Mode;
	filter?: string;
	cluster: boolean;
	format: 'list' | 'json';
	verbose: boolean;
}

function defaultTemplatesPath(grammar: Grammar): string {
	// packages/tools/src/validate/ → ../../../ → packages/
	const packagesDir = resolve(fileURLToPath(new URL('../../../', import.meta.url)));
	return resolve(packagesDir, grammar, 'templates');
}

/**
 * Normalize a mismatch message into a bug-class key by stripping numeric
 * positional indexes (e.g. `parameters[1]` → `parameters[N]`) and trailing
 * input-detail tails. Allows grouping structurally-similar mismatches.
 */
function classifyMessage(message: string): string {
	let key = message.replace(/\[\d+\]/g, '[N]');
	const tailIdx = key.search(/ \[".*$/);
	if (tailIdx !== -1) key = key.slice(0, tailIdx);
	return key;
}

interface Mismatch {
	name: string;
	message: string;
	input?: string;
	rendered?: string;
}

interface SingleRun {
	grammar: Grammar;
	mode: Exclude<Mode, 'diff'>;
	pass: number;
	total: number;
	astMatchPass: number;
	mismatches: Mismatch[];
	errors: { name: string; message: string }[];
}

interface DiffRun {
	grammar: Grammar;
	mode: 'diff';
	deep: SingleRun;
	shallow: SingleRun;
	deepOnly: Mismatch[];
}

async function runSingle(grammar: Grammar, mode: Exclude<Mode, 'diff'>): Promise<SingleRun> {
	const { validateReadRenderParse } = await import(
		'./read-render-parse.ts'
	);
	const result = await validateReadRenderParse(grammar, defaultTemplatesPath(grammar), {
		backend: 'native',
		recursive: mode === 'deep'
	});
	return {
		grammar,
		mode,
		pass: result.pass,
		total: result.total,
		astMatchPass: result.astMatchPass,
		mismatches: result.astMismatches.map((m) => ({
			name: m.name,
			message: m.message,
			input: m.input,
			rendered: m.rendered
		})),
		errors: result.errors.map((e) => ({
			name: e.name,
			message: e.message.split('\n')[0]!
		}))
	};
}

async function runDiff(grammar: Grammar): Promise<DiffRun> {
	const deep = await runSingle(grammar, 'deep');
	const shallow = await runSingle(grammar, 'shallow');
	const shallowKeys = new Set(shallow.mismatches.map((m) => m.name));
	const deepOnly = deep.mismatches.filter((m) => !shallowKeys.has(m.name));
	return { grammar, mode: 'diff', deep, shallow, deepOnly };
}

function emitClusterHistogram(mismatches: Mismatch[]): void {
	const counts = new Map<string, number>();
	for (const m of mismatches) {
		const key = classifyMessage(m.message);
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
	console.log(`# bug-class histogram (${counts.size} classes, ${mismatches.length} total mismatches):`);
	for (const [key, count] of sorted) {
		console.log(`  ${count.toString().padStart(4)}  ${key}`);
	}
}

function emitMismatch(m: Mismatch, withBodies: boolean): void {
	console.log(`MISMATCH\t${m.name}\t${m.message}`);
	if (withBodies) {
		console.log(`  INPUT:    ${JSON.stringify(m.input ?? '')}`);
		console.log(`  RENDERED: ${JSON.stringify(m.rendered ?? '')}`);
	}
}

async function runGrammar(opts: RunOptions): Promise<void> {
	if (opts.mode === 'diff') {
		const r = await runDiff(opts.grammar);
		if (opts.format === 'json') {
			console.log(JSON.stringify({
				grammar: r.grammar,
				mode: 'diff',
				deep: { pass: r.deep.pass, total: r.deep.total, astMatchPass: r.deep.astMatchPass, mismatches: r.deep.mismatches.length },
				shallow: { pass: r.shallow.pass, total: r.shallow.total, astMatchPass: r.shallow.astMatchPass, mismatches: r.shallow.mismatches.length },
				deepOnly: r.deepOnly
			}, null, 2));
			return;
		}
		console.log(
			`# ${opts.grammar} diff: deep ast=${r.deep.astMatchPass}/${r.deep.total}, shallow ast=${r.shallow.astMatchPass}/${r.shallow.total}, deep-only-fail=${r.deepOnly.length}`
		);
		if (opts.cluster) {
			emitClusterHistogram(r.deepOnly);
			return;
		}
		for (const m of r.deepOnly) {
			if (opts.filter && !m.name.includes(opts.filter)) continue;
			emitMismatch(m, Boolean(opts.filter) || opts.verbose);
		}
		return;
	}

	const run = await runSingle(opts.grammar, opts.mode);
	if (opts.format === 'json') {
		console.log(JSON.stringify(run, null, 2));
		return;
	}
	console.log(
		`# ${opts.mode} rrp ${opts.grammar}: pass=${run.pass}/${run.total} astMatchPass=${run.astMatchPass} astMismatches=${run.mismatches.length} errors=${run.errors.length}`
	);
	if (opts.cluster) {
		emitClusterHistogram(run.mismatches);
		return;
	}
	for (const m of run.mismatches) {
		if (opts.filter && !m.name.includes(opts.filter)) continue;
		emitMismatch(m, Boolean(opts.filter) || opts.verbose);
	}
	for (const e of run.errors) {
		console.log(`ERROR\t${e.name}\t${e.message}`);
	}
}

export async function run(opts: DumpAstMismatchesOptions): Promise<number> {
	const mode = opts.mode as Mode;
	if (mode !== 'deep' && mode !== 'shallow' && mode !== 'diff') {
		process.stderr.write(`invalid --mode '${mode}', expected one of: deep, shallow, diff\n`);
		return 2;
	}
	const format = opts.format as 'list' | 'json';
	if (format !== 'list' && format !== 'json') {
		process.stderr.write(`invalid --format '${format}', expected one of: list, json\n`);
		return 2;
	}
	const grammars: readonly Grammar[] = opts.allGrammars
		? GRAMMARS
		: [opts.grammar as Grammar];
	for (const grammar of grammars) {
		if (grammars.length > 1) console.log(`\n# === ${grammar} ===`);
		await runGrammar({
			grammar,
			mode,
			filter: opts.filter,
			cluster: opts.cluster,
			format,
			verbose: opts.verbose
		});
	}
	return 0;
}
