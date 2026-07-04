/**
 * probe/variant-derivation — structural-vs-wire equality probe (R12 / decision-7 V0-V1).
 *
 * `assemble.ts` HISTORICALLY read `variantChildKinds` from the WIRE metadata
 * channel: `normalized.polymorphVariants`, populated during evaluate by
 * `wireRegisterPolymorphVariant` whenever a `polymorphs:`/`variant()`
 * override patch resolves (wire.ts:190). That channel records AUTHORED
 * INTENT, not what the post-link rule tree actually materializes.
 *
 * `compiler/variant-structural.ts`'s `deriveStructuralVariantChildren`
 * computes the same `{parent -> childFullName[]}` shape purely from the rule
 * tree (recursive CHOICE-arm matching + an alias-mint structural test — see
 * that module's doc for the exact predicate). V1 (2026-07-04) FLIPS
 * `assemble.ts` to consume this structural derivation directly — the wire
 * channel now feeds ONLY this probe's comparison.
 *
 * See docs/superpowers/specs/2026-07-04-variant-structural-derivation-research.md
 * §2 (the predicate) and the "V1 OUTCOME" subsection of RESOLUTIONS (the
 * refinement + per-case adjudication this probe's exceptions list encodes).
 *
 * RESULT (V1, post-refinement + adjudication): structural and wire are NOT
 * literally set-equal — 6 of 52 parents differ, in two adjudicated classes:
 *
 *   - REVIEWED-ADDITIVE (structural EXTRA, no wire pair — the derivation is
 *     MORE complete than wire, not wrong): hand-authored `alias()` arms with
 *     no `polymorphs:`/`variant()` registration. rust `impl_item`,
 *     `reference_expression`; ts `string`'s `string_fragment`. These JOIN
 *     the form set — expected by the REVIEWED-ADDITIVE contract, not masked.
 *   - KNOWN EXCEPTION (wire MISSING, structural can't reproduce by design —
 *     a genuine predicate-scope boundary, not a bug): rust
 *     `visibility_modifier`/`in_path` (stale wire pair — a separate `groups:`
 *     body-pattern mechanism mints the REAL bare `in_path` kind, which has
 *     no node-model coverage at all today; retiring the phantom pair is a
 *     separate follow-up, not a V1 fix), python `dict_pattern`/`kv` (lone
 *     aliased SEQ member, never inside a CHOICE — out of the predicate's
 *     CHOICE-centric scope by design), python `_simple_pattern`/`negative`
 *     (SUPERTYPE-union arm — `classifyHiddenChoiceRule` flattens the
 *     original CHOICE into a bare `subtypes: string[]` before
 *     `normalized.rules` is built, destroying the alias-mint linkage the
 *     CHOICE predicate needs; verified NOT cleanly extractable — ts `type`'s
 *     `_type_query_member_expression_in_type_annotation` subtype is a
 *     structurally-identical-looking coincidental collision, so a body-
 *     presence heuristic on `subtypes` would readmit false positives.
 *     `assemble.ts` keeps a narrow, rule-TYPE-gated (not kind-NAME-gated)
 *     wire read for this ONE case so `_simple_pattern_negative` keeps its
 *     render path — see assemble.ts's `variantChildKindsSet` comment).
 *
 * Both classes are enumerated in `KNOWN_EXCEPTIONS` below; the assertion is
 * EXACT modulo that list — any NEW mismatch (not in the list) still fails
 * the probe.
 *
 * CLI:
 *   variant-derivation-probe [--grammar <name>] [--all-grammars]
 *
 * Exit codes:
 *   0  every grammar's structural set equals its wire set for every parent,
 *      modulo the enumerated KNOWN_EXCEPTIONS
 *   1  at least one UNEXPECTED mismatch found (a real regression)
 */

import { invoke, buildNormalizedGrammar } from '../codegen-surface.ts';

const ALL_GRAMMARS = ['rust', 'typescript', 'python'] as const;

export interface VariantDerivationProbeOptions {
	grammar?: string;
	allGrammars: boolean;
}

// ---------------------------------------------------------------------------
// Known exceptions — the reviewed-additive delta + the adjudicated
// predicate-scope boundaries. See the module doc above for the full
// per-case reasoning; this table is the machine-checked enumeration.
// ---------------------------------------------------------------------------

interface KnownException {
	readonly grammar: (typeof ALL_GRAMMARS)[number];
	readonly parent: string;
	/** 'extra' = structural finds it, wire doesn't (reviewed-additive). 'missing' = wire has it, structural can't reproduce (scope boundary). */
	readonly kind: 'extra' | 'missing';
	readonly name: string;
}

const KNOWN_EXCEPTIONS: readonly KnownException[] = [
	// --- REVIEWED-ADDITIVE: hand-authored alias() arms, no wire pair ---
	{ grammar: 'rust', parent: 'impl_item', kind: 'extra', name: 'impl_item_positive_clause' },
	{ grammar: 'rust', parent: 'impl_item', kind: 'extra', name: 'impl_item_negative_clause' },
	{ grammar: 'rust', parent: 'impl_item', kind: 'extra', name: 'impl_item_body' },
	{ grammar: 'rust', parent: 'impl_item', kind: 'extra', name: 'impl_item_semi' },
	{ grammar: 'rust', parent: 'reference_expression', kind: 'extra', name: 'reference_expression_raw_const' },
	{ grammar: 'rust', parent: 'reference_expression', kind: 'extra', name: 'reference_expression_raw_mut' },
	{ grammar: 'typescript', parent: 'string', kind: 'extra', name: 'string_fragment' },

	// --- KNOWN EXCEPTION: predicate-scope boundaries (not bugs) ---
	// Stale wire pair — a separate `groups:` mechanism mints the REAL bare
	// `in_path` kind (no node-model coverage today); retiring the phantom
	// pair is a separate follow-up, not a V1 fix.
	{ grammar: 'rust', parent: 'visibility_modifier', kind: 'missing', name: 'visibility_modifier_in_path' },
	// Lone aliased SEQ member, never inside a CHOICE — out of the
	// CHOICE-centric predicate's scope by design.
	{ grammar: 'python', parent: 'dict_pattern', kind: 'missing', name: 'dict_pattern_kv' },
	// SUPERTYPE-union arm — the alias-mint linkage is destroyed by
	// `classifyHiddenChoiceRule` before `normalized.rules` is built, and a
	// body-presence heuristic on `subtypes` readmits a false positive (ts's
	// `type`/`_type_query_member_expression_in_type_annotation`). Handled by
	// a narrow, rule-TYPE-gated wire read in assemble.ts instead.
	{ grammar: 'python', parent: '_simple_pattern', kind: 'missing', name: 'simple_pattern_negative' }
] as const;

function isKnownException(grammar: string, parent: string, kind: 'extra' | 'missing', name: string): boolean {
	return KNOWN_EXCEPTIONS.some(
		(e) => e.grammar === grammar && e.parent === parent && e.kind === kind && e.name === name
	);
}

// ---------------------------------------------------------------------------
// Per-grammar comparison
// ---------------------------------------------------------------------------

interface ParentRow {
	readonly parent: string;
	readonly structural: readonly string[];
	readonly wire: readonly string[];
	/** EXTRA entries not covered by a KNOWN_EXCEPTIONS 'extra' row — a real regression. */
	readonly unexpectedExtra: readonly string[];
	/** MISSING entries not covered by a KNOWN_EXCEPTIONS 'missing' row — a real regression. */
	readonly unexpectedMissing: readonly string[];
	/** EXTRA/MISSING entries that ARE covered by KNOWN_EXCEPTIONS — reported, not failed. */
	readonly knownExtra: readonly string[];
	readonly knownMissing: readonly string[];
	readonly status: 'MATCH' | 'KNOWN-DIFF' | 'MISMATCH';
}

interface GrammarResult {
	readonly grammar: string;
	readonly rows: readonly ParentRow[];
	readonly unexpectedCount: number;
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

	// Compare against the FULL target kind name, matching
	// `deriveStructuralVariantChildren`'s output shape. Reconstructed via the
	// SAME `polymorphVisibleName` helper wire.ts's own mint path uses (NOT a
	// naive `${pv.parent}_${pv.child}` concatenation, which is unsound for
	// hidden parents with a visible target — see that function's doc).
	const wireMap = new Map<string, string[]>();
	for (const pv of normalized.polymorphVariants ?? []) {
		const existing = wireMap.get(pv.parent) ?? [];
		existing.push(await invoke('variantStructural', 'polymorphVisibleName', pv.parent, pv.child));
		wireMap.set(pv.parent, existing);
	}

	const parents = new Set<string>([...structuralMap.keys(), ...wireMap.keys()]);
	const rows: ParentRow[] = [];
	for (const parent of [...parents].sort()) {
		const structural = structuralMap.get(parent) ?? [];
		const wire = wireMap.get(parent) ?? [];
		const { extra, missing } = diffSets(structural, wire);
		const unexpectedExtra = extra.filter((n) => !isKnownException(grammar, parent, 'extra', n));
		const unexpectedMissing = missing.filter((n) => !isKnownException(grammar, parent, 'missing', n));
		const knownExtra = extra.filter((n) => isKnownException(grammar, parent, 'extra', n));
		const knownMissing = missing.filter((n) => isKnownException(grammar, parent, 'missing', n));
		const status: ParentRow['status'] =
			unexpectedExtra.length > 0 || unexpectedMissing.length > 0
				? 'MISMATCH'
				: knownExtra.length > 0 || knownMissing.length > 0
					? 'KNOWN-DIFF'
					: 'MATCH';
		rows.push({ parent, structural, wire, unexpectedExtra, unexpectedMissing, knownExtra, knownMissing, status });
	}

	const unexpectedCount = rows.filter((r) => r.status === 'MISMATCH').length;
	return { grammar, rows, unexpectedCount };
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
	lines.push(`${'parent'.padEnd(40)} ${'status'.padEnd(11)} structural / wire`);
	for (const row of result.rows) {
		const structuralStr = row.structural.length > 0 ? row.structural.join(',') : '(none)';
		const wireStr = row.wire.length > 0 ? row.wire.join(',') : '(none)';
		lines.push(`${row.parent.padEnd(40)} ${row.status.padEnd(11)} [${structuralStr}] / [${wireStr}]`);
		if (row.unexpectedExtra.length > 0) {
			lines.push(`${''.padEnd(52)}UNEXPECTED EXTRA: ${row.unexpectedExtra.join(', ')}`);
		}
		if (row.unexpectedMissing.length > 0) {
			lines.push(`${''.padEnd(52)}UNEXPECTED MISSING: ${row.unexpectedMissing.join(', ')}`);
		}
		if (row.knownExtra.length > 0) {
			lines.push(`${''.padEnd(52)}known-additive: ${row.knownExtra.join(', ')}`);
		}
		if (row.knownMissing.length > 0) {
			lines.push(`${''.padEnd(52)}known-exception: ${row.knownMissing.join(', ')}`);
		}
	}
	const known = result.rows.filter((r) => r.status === 'KNOWN-DIFF').length;
	const matched = result.rows.length - result.unexpectedCount - known;
	lines.push(
		`-- ${result.grammar}: ${matched}/${result.rows.length} exact MATCH, ${known} known-diff (reviewed), ${result.unexpectedCount} UNEXPECTED`
	);
	return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function run(opts: VariantDerivationProbeOptions): Promise<number> {
	const grammars = opts.allGrammars ? ALL_GRAMMARS : [(opts.grammar ?? 'rust') as (typeof ALL_GRAMMARS)[number]];

	let totalUnexpected = 0;
	for (const grammar of grammars) {
		const result = await runForGrammar(grammar);
		process.stdout.write(formatGrammarResult(result) + '\n');
		totalUnexpected += result.unexpectedCount;
	}

	if (totalUnexpected > 0) {
		process.stdout.write(`\nvariant-derivation-probe: ${totalUnexpected} UNEXPECTED mismatch(es) across ${grammars.length} grammar(s)\n`);
		return 1;
	}
	process.stdout.write(
		`\nvariant-derivation-probe: structural == wire (modulo ${KNOWN_EXCEPTIONS.length} reviewed known-diffs) on all ${grammars.length} grammar(s)\n`
	);
	return 0;
}
