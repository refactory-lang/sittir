/**
 * inspect/overrides — compare override key sets between a backup snapshot
 * and the current generated overrides.suggested.ts files.
 *
 * Re-authors compare-overrides.ts (scratch/) with:
 *   - no hardcoded /tmp paths
 *   - configurable backup directory or per-grammar backup files
 *   - grammar selection (default: all three)
 *
 * CLI:
 *   compare-overrides [--grammar rust|python|typescript|all]
 *                     [--backup-dir <dir>] [--backup-rust <file>]
 *                     [--backup-python <file>] [--backup-typescript <file>]
 *                     [--suggested-dir <dir>]
 *
 * Options:
 *   --grammar          Which grammar(s) to compare (default: all)
 *   --backup-dir       Directory containing <grammar>-overrides.ts backup files
 *   --backup-rust      Path to Rust overrides backup file (overrides --backup-dir)
 *   --backup-python    Path to Python overrides backup file
 *   --backup-typescript Path to TypeScript overrides backup file
 *   --suggested-dir    Root packages directory for overrides.suggested.ts lookup
 *                      (default: packages/ relative to cwd)
 *
 * Report format (per grammar):
 *   subset   — suggested keys are a subset of backup keys (user added more on top)
 *   partial  — some keys overlap, but suggested has keys not in backup (conflict risk)
 *   disjoint — no overlap (completely unrelated patches)
 *
 * Only rules present in BOTH files are compared. Rules only in one file are skipped.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

type GrammarName = 'rust' | 'python' | 'typescript';

export interface CompareOverridesOptions {
	grammars: string[];
	backupDir?: string;
	backupFiles: Partial<Record<GrammarName, string>>;
	suggestedDir: string;
}

// ---------------------------------------------------------------------------
// Core patch extraction — mirrors compare-overrides.ts logic
// ---------------------------------------------------------------------------

/**
 * Extract the transform() patch key sets per rule name from an overrides.ts
 * or overrides.suggested.ts source string.
 *
 * A rule entry is any line matching the pattern:
 *   `"ruleName": ($, original) => transform` or `ruleName: ($, original) => transform`
 *
 * For each entry we scan the body up to the next rule for patch keys: any
 * string literal or bare identifier followed by `: field|variant|alias`.
 *
 * @param src - The full source text of an overrides or suggested file.
 * @returns Map from rule name → set of patch key strings.
 */
function extractRulePatches(src: string): Map<string, Set<string>> {
	const out = new Map<string, Set<string>>();

	// Find each rule entry point
	const rulesRx =
		/(?:"([a-zA-Z_][\w]*)"|([a-zA-Z_][\w]*))\s*:\s*\(\$,\s*original\)\s*=>\s*transform/g;
	const starts: { name: string; idx: number }[] = [];
	let m: RegExpExecArray | null;
	while ((m = rulesRx.exec(src)) !== null) {
		starts.push({ name: (m[1] ?? m[2])!, idx: m.index });
	}

	for (let i = 0; i < starts.length; i++) {
		const start = starts[i]!;
		const end = i + 1 < starts.length ? starts[i + 1]!.idx : src.length;
		const body = src.slice(start.idx, end);

		const keys = new Set<string>();
		// Scan for positional keys followed by : field|variant|alias
		const keyRx = /(?:^|\s|\{|,)\s*(?:"([\w/*]+)"|'([\w/*]+)'|(\d+))\s*:\s*(?:field|variant|alias)/g;
		let km: RegExpExecArray | null;
		while ((km = keyRx.exec(body)) !== null) {
			keys.add((km[1] ?? km[2] ?? km[3])!);
		}
		out.set(start.name, keys);
	}

	return out;
}

// ---------------------------------------------------------------------------
// Per-grammar comparison
// ---------------------------------------------------------------------------

interface CompareResult {
	grammar: GrammarName;
	backupPath: string;
	suggestedPath: string;
	backupSize: number;
	suggestedSize: number;
	subset: number;
	partial: number;
	disjoint: number;
	details: string[];
}

function resolveBackupPath(
	grammar: GrammarName,
	opts: CompareOverridesOptions,
): string | undefined {
	if (opts.backupFiles[grammar]) return resolve(opts.backupFiles[grammar]!);
	if (opts.backupDir) return join(resolve(opts.backupDir), `${grammar}-overrides.ts`);
	return undefined;
}

function compareGrammar(grammar: GrammarName, opts: CompareOverridesOptions): CompareResult | null {
	const backupPath = resolveBackupPath(grammar, opts);
	const suggestedPath = join(opts.suggestedDir, grammar, 'overrides.suggested.ts');

	if (!backupPath) {
		process.stderr.write(
			`  ${grammar}: no backup path provided — use --backup-dir or --backup-${grammar}\n`,
		);
		return null;
	}
	if (!existsSync(backupPath)) {
		process.stderr.write(`  ${grammar}: backup file not found: ${backupPath}\n`);
		return null;
	}
	if (!existsSync(suggestedPath)) {
		process.stderr.write(`  ${grammar}: overrides.suggested.ts not found: ${suggestedPath}\n`);
		return null;
	}

	const backupSrc = readFileSync(backupPath, 'utf-8');
	const suggestedSrc = readFileSync(suggestedPath, 'utf-8');

	const backup = extractRulePatches(backupSrc);
	const suggested = extractRulePatches(suggestedSrc);

	let subset = 0;
	let partial = 0;
	let disjoint = 0;
	const details: string[] = [];

	for (const [name, sKeys] of suggested) {
		if (!backup.has(name)) continue; // only compare shared rules
		const bKeys = backup.get(name)!;
		const suggestedInBackup = [...sKeys].every((k) => bKeys.has(k));
		const anyOverlap = [...sKeys].some((k) => bKeys.has(k));

		if (suggestedInBackup) {
			subset++;
		} else if (anyOverlap) {
			partial++;
			details.push(
				`  PARTIAL ${name}: backup=[${[...bKeys].sort().join(',')}] ` +
					`suggested=[${[...sKeys].sort().join(',')}]`,
			);
		} else {
			disjoint++;
			details.push(
				`  DISJOINT ${name}: backup=[${[...bKeys].sort().join(',')}] ` +
					`suggested=[${[...sKeys].sort().join(',')}]`,
			);
		}
	}

	return {
		grammar,
		backupPath,
		suggestedPath,
		backupSize: backup.size,
		suggestedSize: suggested.size,
		subset,
		partial,
		disjoint,
		details,
	};
}

// ---------------------------------------------------------------------------
// Report printing
// ---------------------------------------------------------------------------

const DETAIL_LIMIT = 30;

function printResult(r: CompareResult): void {
	process.stdout.write(
		`\n=== ${r.grammar} ===  backup=${r.backupSize} rules, suggested=${r.suggestedSize} rules\n`,
	);
	process.stdout.write(`  backup:    ${r.backupPath}\n`);
	process.stdout.write(`  suggested: ${r.suggestedPath}\n`);
	const shared = r.subset + r.partial + r.disjoint;
	process.stdout.write(
		`  shared rules: ${shared}  subset(user agrees + adds): ${r.subset}  ` +
			`partial: ${r.partial}  disjoint: ${r.disjoint}\n`,
	);
	for (const d of r.details.slice(0, DETAIL_LIMIT)) {
		process.stdout.write(d + '\n');
	}
	if (r.details.length > DETAIL_LIMIT) {
		process.stdout.write(`  ... (${r.details.length - DETAIL_LIMIT} more)\n`);
	}
}

// ---------------------------------------------------------------------------
// Public run entry point
// ---------------------------------------------------------------------------

export async function run(opts: CompareOverridesOptions): Promise<number> {
	let hasAnyBackup = false;
	for (const grammar of opts.grammars) {
		const result = compareGrammar(grammar as GrammarName, opts);
		if (result !== null) {
			hasAnyBackup = true;
			printResult(result);
		}
	}

	if (!hasAnyBackup) {
		process.stderr.write(
			'No backup files found. Provide --backup-dir <dir> or per-grammar --backup-<name> <file>.\n',
		);
		return 1;
	}

	return 0;
}
