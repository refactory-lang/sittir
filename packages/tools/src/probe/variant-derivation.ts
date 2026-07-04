/**
 * probe/variant-derivation — structural-vs-wire equality probe (R12 / decision-7 V0).
 *
 * `assemble.ts` has historically read `variantChildKinds` from the WIRE
 * metadata channel: `normalized.polymorphVariants`, populated during
 * evaluate by `wireRegisterPolymorphVariant` whenever a `polymorphs:`/
 * `variant()` override patch resolves (wire.ts:190). That channel records
 * AUTHORED INTENT, not what the post-link rule tree actually materializes.
 *
 * `compiler/variant-structural.ts`'s `deriveStructuralVariantChildren`
 * computes the same `{parent -> childSuffix[]}` shape purely from the rule
 * tree (`isAllAliasChoice`-style matching, generalized with recursive
 * descent + hidden-arm admission — see that module's doc for the exact
 * predicate). This tool asserts SET-EQUALITY between the two channels, per
 * grammar, per parent kind: MATCH (identical suffix sets) / EXTRA
 * (structural finds a suffix wire doesn't have) / MISSING (wire has a
 * suffix structural doesn't reproduce).
 *
 * See docs/superpowers/specs/2026-07-04-variant-structural-derivation-research.md
 * §2 (the predicate + probe results) and §7 (staged plan, V0 entry).
 *
 * RESULT (2026-07-04, first run against all 3 grammars): NOT equal — 9 of
 * 49 parents mismatch (rust 3/21, typescript 2/19, python 4/9). Every
 * mismatch has an understood root cause (naming collisions between two
 * alias mechanisms, non-CHOICE rule shapes the predicate is intentionally
 * out of scope for, hand-authored `alias()` calls with no wire
 * registration, and coincidental prefix-name collisions with ordinary
 * grammar symbols — see `variant-structural.ts`'s doc for the full
 * breakdown). Per the staged plan, this BLOCKS V1: `assemble.ts` still
 * reads the wire channel; `deriveStructuralVariantChildren` is NOT wired
 * in as its replacement.
 *
 * CLI:
 *   variant-derivation-probe [--grammar <name>] [--all-grammars]
 *
 * Exit codes:
 *   0  every grammar's structural set equals its wire set for every parent
 *   1  at least one MISMATCH (EXTRA or MISSING) found
 */

import { invoke } from '../codegen-surface.ts';
import { buildNormalizedGrammar } from '../codegen-surface.ts';

const ALL_GRAMMARS = ['rust', 'typescript', 'python'] as const;

export interface VariantDerivationProbeOptions {
	grammar?: string;
	allGrammars: boolean;
}

// ---------------------------------------------------------------------------
// Per-grammar comparison
// ---------------------------------------------------------------------------

interface ParentRow {
	readonly parent: string;
	readonly structural: readonly string[];
	readonly wire: readonly string[];
	readonly extra: readonly string[];
	readonly missing: readonly string[];
	readonly status: 'MATCH' | 'MISMATCH';
}

interface GrammarResult {
	readonly grammar: string;
	readonly rows: readonly ParentRow[];
	readonly mismatchCount: number;
}

function diffSets(a: readonly string[], b: readonly string[]): { extra: string[]; missing: string[] } {
	const aSet = new Set(a);
	const bSet = new Set(b);
	const extra = [...aSet].filter((x) => !bSet.has(x)).sort();
	const missing = [...bSet].filter((x) => !aSet.has(x)).sort();
	return { extra, missing };
}

async function runForGrammar(grammar: string): Promise<GrammarResult> {
	const normalized = await buildNormalizedGrammar(grammar);
	const structuralMap = await invoke('variantStructural', 'deriveStructuralVariantChildren', normalized.rules);

	const wireMap = new Map<string, string[]>();
	for (const pv of normalized.polymorphVariants ?? []) {
		const existing = wireMap.get(pv.parent) ?? [];
		existing.push(pv.child);
		wireMap.set(pv.parent, existing);
	}

	const parents = new Set<string>([...structuralMap.keys(), ...wireMap.keys()]);
	const rows: ParentRow[] = [];
	for (const parent of [...parents].sort()) {
		const structural = structuralMap.get(parent) ?? [];
		const wire = wireMap.get(parent) ?? [];
		const { extra, missing } = diffSets(structural, wire);
		rows.push({
			parent,
			structural,
			wire,
			extra,
			missing,
			status: extra.length === 0 && missing.length === 0 ? 'MATCH' : 'MISMATCH'
		});
	}

	const mismatchCount = rows.filter((r) => r.status === 'MISMATCH').length;
	return { grammar, rows, mismatchCount };
}

// ---------------------------------------------------------------------------
// Report formatting
// ---------------------------------------------------------------------------

function formatGrammarResult(result: GrammarResult): string {
	const lines: string[] = [];
	lines.push(`\n=== ${result.grammar} ===`);
	if (result.rows.length === 0) {
		lines.push('(no parents on either channel)');
		return lines.join('\n');
	}
	lines.push(`${'parent'.padEnd(40)} ${'status'.padEnd(9)} structural / wire`);
	for (const row of result.rows) {
		const structuralStr = row.structural.length > 0 ? row.structural.join(',') : '(none)';
		const wireStr = row.wire.length > 0 ? row.wire.join(',') : '(none)';
		lines.push(`${row.parent.padEnd(40)} ${row.status.padEnd(9)} [${structuralStr}] / [${wireStr}]`);
		if (row.extra.length > 0) lines.push(`${''.padEnd(50)}  EXTRA (structural, not wire): ${row.extra.join(', ')}`);
		if (row.missing.length > 0) lines.push(`${''.padEnd(50)}  MISSING (wire, not structural): ${row.missing.join(', ')}`);
	}
	lines.push(`-- ${result.grammar}: ${result.rows.length - result.mismatchCount}/${result.rows.length} parents MATCH, ${result.mismatchCount} MISMATCH`);
	return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function run(opts: VariantDerivationProbeOptions): Promise<number> {
	const grammars = opts.allGrammars ? ALL_GRAMMARS : [(opts.grammar ?? 'rust') as (typeof ALL_GRAMMARS)[number]];

	let totalMismatch = 0;
	for (const grammar of grammars) {
		const result = await runForGrammar(grammar);
		process.stdout.write(formatGrammarResult(result) + '\n');
		totalMismatch += result.mismatchCount;
	}

	if (totalMismatch > 0) {
		process.stdout.write(`\nvariant-derivation-probe: ${totalMismatch} mismatch(es) across ${grammars.length} grammar(s)\n`);
		return 1;
	}
	process.stdout.write(`\nvariant-derivation-probe: structural == wire on all ${grammars.length} grammar(s)\n`);
	return 0;
}
