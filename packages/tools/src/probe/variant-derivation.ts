/**
 * probe/variant-derivation — structural-derivation-vs-committed-node-model
 * drift detector (R12 / decision-7 V2 Task 3).
 *
 * V0/V1 (2026-07-04) compared the structural derivation
 * (`deriveStructuralVariantChildren`, compiler/variant-structural.ts)
 * against the WIRE metadata channel (`normalized.polymorphVariants`,
 * populated by `wireRegisterPolymorphVariant`). V2 deletes that channel
 * entirely (assemble.ts, link.ts, and normalize.ts all consume the
 * structural derivation directly now — see each file's own comments and
 * the research doc's "V2 OUTCOME" section). With the wire side gone, this
 * probe's job changes from "does structural reproduce wire" to a
 * cross-commit DRIFT DETECTOR, same spirit as the generated-manifest guard
 * (`project_manifest_committed`): does the structural derivation, computed
 * LIVE from the current pipeline, still equal what's COMMITTED in
 * `packages/<lang>/src/node-model.json5`'s `polymorphVariants` section?
 *
 * A mismatch here means either (a) a grammar/override edit changed which
 * kinds structurally adopt variant children WITHOUT regenerating
 * node-model.json5 (a stale commit), or (b) the structural predicate itself
 * changed behavior (a codegen regression) — either way, something drifted
 * that a regen + review should catch before merge.
 *
 * ## The comparison contract
 *
 * `deriveStructuralVariantChildren` returns EVERY qualifying parent kind
 * regardless of how it classifies at Assemble time (branch / group /
 * supertype / …) — see that module's own doc for the predicate. But
 * `node-model.json5`'s `polymorphVariants` section is populated EXCLUSIVELY
 * for `modelType === 'branch'` parents (`emitters/factory-map.ts`'s
 * `buildFactoryMap`: `if (node.modelType === 'branch' && node.
 * variantChildKinds.length > 0)` — `AssembledGroup`/`AssembledSupertype`
 * don't even carry a `variantChildKinds` field). So the committed artifact
 * can NEVER reflect a non-branch parent's variant children, independent of
 * how those children were discovered (wire pairs, historically, or the
 * structural derivation, now) — this is not a probe gap, it's what the
 * emitted surface has always been. The comparison therefore restricts to
 * `modelType === 'branch'` parents on BOTH sides before diffing; non-branch
 * qualifying parents (verified during V2 development: python's
 * `_simple_pattern` — SUPERTYPE; typescript's `_export_statement_default_
 * decl_arm` family and `_for_header` — GROUP) are excluded from the
 * comparison entirely, not silently reported as mismatches. Verified
 * EXACTLY zero remaining mismatches across all 3 grammars under this
 * restriction as of 2026-07-04 (V2 OUTCOME) — the `KNOWN_EXCEPTIONS`
 * table below documents WHY each excluded parent is excluded, for
 * traceability, but does not gate anything (the modelType restriction
 * already excludes them structurally).
 *
 * CLI:
 *   variant-derivation-probe [--grammar <name>] [--all-grammars]
 *
 * Exit codes:
 *   0  every grammar's live structural branch-parent set equals its
 *      committed node-model.json5 `polymorphVariants` set, exactly
 *   1  at least one DRIFT found (stale commit or predicate regression)
 */

import { load, buildNormalizedGrammar } from '../codegen-surface.ts';
import { loadNodeModel } from '../validate/common.ts';

const ALL_GRAMMARS = ['rust', 'typescript', 'python'] as const;

export interface VariantDerivationProbeOptions {
	grammar?: string;
	allGrammars: boolean;
}

// ---------------------------------------------------------------------------
// Known non-branch qualifying parents — documented for traceability only.
// The modelType==='branch' restriction already excludes these from the
// comparison; this table is NOT consulted by the diff logic below.
// ---------------------------------------------------------------------------

interface KnownNonBranchParent {
	readonly grammar: (typeof ALL_GRAMMARS)[number];
	readonly parent: string;
	readonly modelType: 'supertype' | 'group';
	readonly reason: string;
}

const KNOWN_NON_BRANCH_PARENTS: readonly KnownNonBranchParent[] = [
	{
		grammar: 'python',
		parent: '_simple_pattern',
		modelType: 'supertype',
		reason:
			"classifyHiddenChoiceRule flattens this hidden choice's alias/symbol arms into a bare SupertypeRule " +
			"(subtypes: string[]) before assemble runs; the declared variantArms fact (RuleBase.variantArms) lets " +
			"assemble.ts's markUserFacing still give simple_pattern_negative a render path, but AssembledSupertype " +
			'has no variantChildKinds field at all, so it can never get a node-model.json5 polymorphVariants entry.'
	},
	{
		grammar: 'typescript',
		parent: '_export_statement_default_decl_arm',
		modelType: 'group',
		reason:
			'Hidden-cascade intermediate classifies to AssembledGroup (has fields), not AssembledBranch — ' +
			'AssembledGroup has no variantChildKinds field, so buildFactoryMap never visits it.'
	},
	{
		grammar: 'typescript',
		parent: '_export_statement_default_decl_arm_default_kw',
		modelType: 'group',
		reason: 'Same as _export_statement_default_decl_arm — a further-nested GROUP-classified cascade intermediate.'
	},
	{
		grammar: 'typescript',
		parent: '_for_header',
		modelType: 'group',
		reason: 'GROUP-classified (has fields: kind/left/operator/right) — same structural boundary as the decl_arm cascade.'
	}
] as const;

// ---------------------------------------------------------------------------
// Per-grammar comparison
// ---------------------------------------------------------------------------

interface ParentRow {
	readonly parent: string;
	readonly structural: readonly string[];
	readonly committed: readonly string[];
	readonly extra: readonly string[];
	readonly missing: readonly string[];
	readonly status: 'MATCH' | 'DRIFT';
}

interface GrammarResult {
	readonly grammar: string;
	readonly rows: readonly ParentRow[];
	readonly driftCount: number;
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
	const structuralMap = await load('variantStructural').then((m) => m.deriveStructuralVariantChildren(normalized.rules));

	const { assemble, AssembleCtx } = await load('assemble');
	const ctx = AssembleCtx.from(normalized);
	const nodeMap = assemble(normalized, ctx);

	const nodeModel = await loadNodeModel(grammar);
	const committedMap = new Map<string, string[]>();
	for (const [parent, desc] of Object.entries(nodeModel.polymorphVariants)) {
		if (desc.definedBy !== 'override') continue;
		committedMap.set(parent, Object.keys(desc.childKind));
	}

	// Restrict BOTH sides to modelType==='branch' parents — the only shape
	// node-model.json5's polymorphVariants section can ever record (see
	// module doc). Non-branch qualifying parents are structurally excluded,
	// not diffed.
	const isBranchParent = (parent: string): boolean => nodeMap.nodes.get(parent)?.modelType === 'branch';

	const parents = new Set<string>(
		[...structuralMap.keys(), ...committedMap.keys()].filter(isBranchParent)
	);
	const rows: ParentRow[] = [];
	for (const parent of [...parents].sort()) {
		const structural = structuralMap.get(parent) ?? [];
		const committed = committedMap.get(parent) ?? [];
		const { extra, missing } = diffSets(structural, committed);
		const status: ParentRow['status'] = extra.length > 0 || missing.length > 0 ? 'DRIFT' : 'MATCH';
		rows.push({ parent, structural, committed, extra, missing, status });
	}

	const driftCount = rows.filter((r) => r.status === 'DRIFT').length;
	return { grammar, rows, driftCount };
}

// ---------------------------------------------------------------------------
// Report formatting
// ---------------------------------------------------------------------------

function formatGrammarResult(result: GrammarResult): string {
	const lines: string[] = [];
	lines.push(`\n=== ${result.grammar} ===`);
	if (result.rows.length === 0) {
		lines.push('(no branch-classified variant-adoption parents on either side)');
		return lines.join('\n');
	}
	lines.push(`${'parent'.padEnd(40)} ${'status'.padEnd(8)} structural / committed`);
	for (const row of result.rows) {
		const structuralStr = row.structural.length > 0 ? row.structural.join(',') : '(none)';
		const committedStr = row.committed.length > 0 ? row.committed.join(',') : '(none)';
		lines.push(`${row.parent.padEnd(40)} ${row.status.padEnd(8)} [${structuralStr}] / [${committedStr}]`);
		if (row.extra.length > 0) {
			lines.push(`${''.padEnd(49)}EXTRA (live, not committed): ${row.extra.join(', ')}`);
		}
		if (row.missing.length > 0) {
			lines.push(`${''.padEnd(49)}MISSING (committed, not live): ${row.missing.join(', ')}`);
		}
	}
	const matched = result.rows.length - result.driftCount;
	lines.push(`-- ${result.grammar}: ${matched}/${result.rows.length} MATCH, ${result.driftCount} DRIFT`);
	const nonBranch = KNOWN_NON_BRANCH_PARENTS.filter((e) => e.grammar === result.grammar);
	if (nonBranch.length > 0) {
		lines.push(`   (${nonBranch.length} non-branch qualifying parent(s) excluded from comparison — see KNOWN_NON_BRANCH_PARENTS)`);
	}
	return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function run(opts: VariantDerivationProbeOptions): Promise<number> {
	const grammars = opts.allGrammars ? ALL_GRAMMARS : [(opts.grammar ?? 'rust') as (typeof ALL_GRAMMARS)[number]];

	let totalDrift = 0;
	for (const grammar of grammars) {
		const result = await runForGrammar(grammar);
		process.stdout.write(formatGrammarResult(result) + '\n');
		totalDrift += result.driftCount;
	}

	if (totalDrift > 0) {
		process.stdout.write(
			`\nvariant-derivation-probe: ${totalDrift} DRIFT(s) across ${grammars.length} grammar(s) — ` +
				`live structural derivation no longer matches committed node-model.json5. Regen and review.\n`
		);
		return 1;
	}
	process.stdout.write(
		`\nvariant-derivation-probe: structural derivation == committed node-model.json5 on all ${grammars.length} grammar(s)\n`
	);
	return 0;
}
