/**
 * compiler/variant-structural.ts — structural derivation of variant()
 * adoption (R12 / decision-7 V0-V2). See the glossary's Phase 4: Assemble
 * section (`deriveStructuralVariantChildren`) for the predicate, the
 * `RuleBase.variantArms` supplement, and known non-reproductions; see
 * docs/superpowers/specs/2026-07-04-variant-structural-derivation-research.md
 * for the full history and adjudication table.
 *
 * Local notes not in the glossary:
 * - The ANY-match semantics (a choice qualifies if at least one arm
 *   qualifies; non-qualifying sibling arms are simply not variant children,
 *   not failures) mirrors `applyOverridePolymorphs`'s own runtime gate
 *   (`symbolInRule`, link.ts) — not `isAllAliasChoice`'s ALL-match (used only
 *   by the other, ambient-scaffold-push-down branch).
 * - Recursion doesn't stop at a qualifying choice: non-qualifying sibling
 *   arms are still walked, since a qualifying choice doesn't shadow a nested
 *   adoption site living inside one of its own non-qualifying siblings
 *   (rust's `range_pattern`: arm 0 has no qualifying prefix at this level but
 *   contains its own nested qualifying choice one level down).
 */

import { polymorphVisibleName } from '../dsl/wire/wire.ts';
import { ALIAS, CHOICE, OPTIONAL, SEQ, SYMBOL, VARIANT } from '../types/rule-types.ts';
import type { AliasRule, ChoiceRule, Rule, SeqRule, SymbolRule } from '../types/rule.ts';

/**
 * Re-exported so callers that only know a parent kind + short suffix (e.g.
 * `polymorph-metadata-e2e.test.ts`, reconstructing the FULL target name a
 * `polymorphs:` override arm mints) use the SAME `${parent}_${suffix}`
 * naming convention this module's own predicate matches against
 * (`prefixNamedSuffix` is the inverse), rather than a naive
 * `${parent}_${suffix}` concatenation (unsound for hidden parents — see
 * `deriveStructuralVariantChildren`'s doc).
 */
export { polymorphVisibleName };

// ---------------------------------------------------------------------------
// Per-arm + per-choice matching
// ---------------------------------------------------------------------------

/** Strip a single leading `_` (hidden-kind marker), if present. */
function stripHiddenPrefix(name: string): string {
	return name.startsWith('_') ? name.slice(1) : name;
}

/**
 * Is `rule` alias-minted — a bare ALIAS node, or a SYMBOL whose target name
 * has NO independent rule body of its own in `rules` — rather than an
 * ordinary, independently-authored sibling rule reference? This is the PR-0c
 * mint-site condition (`mintContentAliasKinds` / `isClauseHoistVisibleGroupAlias`,
 * link.ts/evaluate.ts: "the alias value has no independent rule body
 * elsewhere in `rules` — exactly the fact tree-sitter's own grammar compiler
 * keys on to decide there's no existing symbol to reuse"), reapplied here to
 * discriminate real variant-child arms from a coincidental prefix-name
 * collision with an unrelated, independently defined rule (python's
 * `dictionary_splat`/`string_content`, ts's
 * `object_type_content_comma`/`_semi` — all real top-level rules with their
 * own bodies in `rules`, NOT alias targets). A bare ALIAS node (rare at this
 * phase; link resolves aliases to `SYMBOL` before `normalized.rules` is
 * built) is unconditionally alias-minted — there is no "independent body" to
 * check because the arm IS the alias construct itself.
 *
 * Exported (R12/decision-7 V2 Task 1) so `compiler/link.ts`'s
 * `classifyHiddenChoiceRule` can reapply the SAME test at its own CHOICE-arm
 * flatten site (stamping `SupertypeRule.variantArms` before the flatten
 * destroys the linkage) — one predicate, shared, never re-derived. See
 * `types/rule.ts`'s `RuleBase.variantArms` doc comment.
 */
export function isAliasMintedRef(rule: Rule<'link'>, rules: Record<string, Rule<'link'>>): boolean {
	if (rule.type === ALIAS) return true;
	if (rule.type === SYMBOL) return !(rule.name in rules);
	return false;
}

/**
 * Resolve a rule to its named-kind target name, unwrapping a VARIANT or
 * OPTIONAL wrapper if present (an optional-wrapped alias/symbol still
 * REFERENCES the same target kind — optionality doesn't change what the arm
 * names). Returns null when `rule` is not (through those wrappers) an
 * ALIAS/SYMBOL ref, or when it IS such a ref but not alias-minted (see
 * {@link isAliasMintedRef}) — an ordinary independently-authored sibling
 * rule reference is not a "named-kind arm" for variant-adoption purposes,
 * regardless of prefix-name coincidence.
 */
function namedKindRefTarget(rule: Rule<'link'>, rules: Record<string, Rule<'link'>>): string | null {
	let core: Rule<'link'> = rule;
	while (core.type === VARIANT || core.type === OPTIONAL) {
		core = (core as { content: Rule<'link'> }).content;
	}
	if (core.type !== ALIAS && core.type !== SYMBOL) return null;
	if (!isAliasMintedRef(core, rules)) return null;
	if (core.type === ALIAS) return (core as AliasRule<'link'>).value;
	return (core as SymbolRule<'link'>).name;
}

/**
 * Is `rule` a "named-kind arm" for choice-membership purposes? Bare
 * ALIAS/SYMBOL (through VARIANT/OPTIONAL wrappers), or a SEQ whose FIRST
 * member is such a reference — the `function_type` shape, where each choice
 * arm is `seq(alias, field('parameters', ...))` and every arm shares the
 * trailing content. Returns the target name, or null if this arm doesn't
 * qualify EITHER because it isn't a named-kind ref at all, or because the
 * ref target is an ordinary independently-authored rule (not alias-minted —
 * see {@link isAliasMintedRef}).
 */
function namedKindArmTarget(rule: Rule<'link'>, rules: Record<string, Rule<'link'>>): string | null {
	const direct = namedKindRefTarget(rule, rules);
	if (direct !== null) return direct;
	if (rule.type === SEQ) {
		const seq = rule as SeqRule<'link'>;
		const first = seq.members[0];
		if (first) return namedKindRefTarget(first, rules);
	}
	return null;
}

/**
 * Does `targetName` look like a prefix-named variant child of `parentKind`
 * — i.e. does it equal `polymorphVisibleName(parentKind, suffix)` (wire.ts,
 * the SAME helper `injectHiddenRulePlaceholders` and both transform paths use
 * to mint a variant child's visible name — imported here, not reimplemented,
 * so the two derivations can never drift) for some non-empty `suffix`? Both
 * `parentKind` and `targetName` may carry a leading `_` (hidden kind);
 * RESOLUTION 3 admits hidden target names, and `polymorphVisibleName` itself
 * strips the PARENT's leading `_` (a hidden parent still mints a visible
 * child name) — the target's own leading `_` is stripped here before
 * comparison, since a hidden target's mint name is `_` + the visible form.
 * Returns the suffix on match, else null.
 */
export function prefixNamedSuffix(parentKind: string, targetName: string): string | null {
	const bareTarget = stripHiddenPrefix(targetName);
	const prefix = `${polymorphVisibleName(parentKind, '')}`;
	if (!bareTarget.startsWith(prefix)) return null;
	const suffix = bareTarget.slice(prefix.length);
	return suffix.length > 0 ? suffix : null;
}

/**
 * One qualifying choice node found while walking a kind's rule body: the
 * choice itself, plus the resolved `{suffix -> targetName}` pairs for each
 * arm (in member order).
 */
export interface StructuralVariantChoice {
	readonly choice: ChoiceRule<'link'>;
	readonly arms: readonly { readonly suffix: string; readonly targetName: string }[];
}

/**
 * Does CHOICE `rule` qualify as a variant-adoption site for `parentKind` —
 * at least one member a prefix-named named-kind arm? Returns the qualifying
 * arms (order-preserving) plus the set of member indices that contributed,
 * or null when NO member qualifies (the ANY-match semantics from the module
 * doc, mirroring `applyOverridePolymorphs`'s `symbolInRule`). Non-qualifying
 * sibling arms — an unrelated bare keyword symbol, a literal, `NEWLINE` —
 * are excluded from `arms` but are NOT failures; the caller still recurses
 * into them (a qualifying choice doesn't shadow a nested adoption site
 * living inside one of its own non-qualifying siblings, e.g. rust's
 * `range_pattern` root choice: arm 0 is a SEQ with no qualifying prefix at
 * this level, arm 1 IS `range_pattern_prefix` — arm 0 must still be walked
 * to find its OWN nested qualifying choice at `members.0.members.1`).
 */
function matchStructuralVariantChoice(
	rule: Rule<'link'>,
	parentKind: string,
	rules: Record<string, Rule<'link'>>
): { readonly match: StructuralVariantChoice; readonly matchedIndices: ReadonlySet<number> } | null {
	if (rule.type !== CHOICE || rule.members.length === 0) return null;
	const arms: { suffix: string; targetName: string }[] = [];
	const matchedIndices = new Set<number>();
	rule.members.forEach((member, i) => {
		const targetName = namedKindArmTarget(member, rules);
		if (targetName === null) return;
		const suffix = prefixNamedSuffix(parentKind, targetName);
		if (suffix === null) return;
		arms.push({ suffix, targetName });
		matchedIndices.add(i);
	});
	return arms.length > 0 ? { match: { choice: rule, arms }, matchedIndices } : null;
}

// ---------------------------------------------------------------------------
// Recursive descent — find every qualifying choice in a kind's body
// ---------------------------------------------------------------------------

/**
 * Recursively walk `rule` (a kind's post-link body) collecting every
 * qualifying variant-adoption CHOICE node — decision-1's "assessed at
 * whatever level the choice appears when traveling downward through the
 * rule tree" (RESOLUTIONS, decision 1 clarification). When a CHOICE
 * qualifies, its QUALIFYING arms are leaves (not descended into further —
 * they're bare kind refs with nothing to find), but any NON-qualifying
 * sibling arm is still recursed into (it may hide its own nested adoption
 * site — see `matchStructuralVariantChoice`'s doc). Non-CHOICE structural
 * nodes recurse through every child (SEQ members; OPTIONAL/FIELD/REPEAT/
 * REPEAT1/GROUP/ALIAS/TOKEN/VARIANT content) so nested sites (rust's
 * `function_type`, `range_pattern`) are found regardless of nesting depth.
 */
function collectStructuralVariantChoices(
	rule: Rule<'link'>,
	parentKind: string,
	rules: Record<string, Rule<'link'>>,
	out: StructuralVariantChoice[]
): void {
	if (rule.type === CHOICE) {
		const found = matchStructuralVariantChoice(rule, parentKind, rules);
		if (found) {
			out.push(found.match);
			rule.members.forEach((m, i) => {
				if (!found.matchedIndices.has(i)) collectStructuralVariantChoices(m, parentKind, rules, out);
			});
			return;
		}
		for (const m of rule.members) collectStructuralVariantChoices(m, parentKind, rules, out);
		return;
	}
	switch (rule.type) {
		case SEQ: {
			for (const m of (rule as SeqRule<'link'>).members) collectStructuralVariantChoices(m, parentKind, rules, out);
			return;
		}
		default: {
			const content = (rule as { content?: Rule<'link'> }).content;
			if (content) collectStructuralVariantChoices(content, parentKind, rules, out);
		}
	}
}

/**
 * Find every qualifying variant-adoption choice in kind `kind`'s post-link
 * rule body — the per-choice-node diagnostic view the probe tool reports
 * (MATCH/EXTRA/MISSING per kind, per RESOLUTIONS decision 2's per-(kind,
 * choice) granularity, flattened to today's per-kind flat surface since
 * every current kind has exactly one qualifying choice or none).
 *
 * @param rules - The full grammar's post-link rule map, needed by
 *   {@link isAliasMintedTarget} to check whether an arm's target name has an
 *   independent rule body of its own (excludes ordinary sibling-rule
 *   collisions like python's `dictionary`/`dictionary_splat`).
 */
export function findStructuralVariantChoices(
	kind: string,
	rule: Rule<'link'>,
	rules: Record<string, Rule<'link'>>
): readonly StructuralVariantChoice[] {
	const out: StructuralVariantChoice[] = [];
	collectStructuralVariantChoices(rule, kind, rules, out);
	return out;
}

// ---------------------------------------------------------------------------
// Grammar-wide derivation — the Map assemble.ts consumes
// ---------------------------------------------------------------------------

/**
 * Derive `{parent -> childTargetName[]}` for every kind in `rules`, purely
 * structurally — the SOLE source `assemble.ts`'s `variantChildrenByParent`,
 * `link.ts`'s `applyOverridePolymorphs`, and `normalize.ts`'s `variantSkip`
 * all consume (V2: the former wire-metadata channel this replaced,
 * `normalized.polymorphVariants`, is deleted entirely — see this module's
 * top-of-file STATUS comment). Values are the arm's FULL target kind name
 * (`arm.targetName`) — NOT a `${kind}_${suffix}` reconstruction, which is
 * unsound when a hidden (`_`-prefixed) parent has a VISIBLE target (ts's
 * `_export_statement_default` → `export_statement_default_from_arm`; the
 * target strips its own leading `_` independently of the parent's, per
 * RESOLUTION 3 — see `prefixNamedSuffix`). Target names are ordered by
 * first-discovered choice-arm order; when a kind has more than one
 * qualifying choice (none observed on the current 3 grammars, but the
 * predicate doesn't assume it), names from every qualifying choice are
 * concatenated in tree-walk order. De-duplicated (first-seen order
 * preserved): the same alias-minted target can appear as more than one
 * choice arm within a kind's body (ts's `string_fragment`, aliased once for
 * the double-quote branch and once for the single-quote branch of a
 * `refine()`-correlated form — one child kind, two mint sites) — the
 * former wire channel's registration was documented idempotent for the
 * same reason; this derivation preserves the same one-entry-per-child-kind
 * shape structurally.
 */
export function deriveStructuralVariantChildren(
	rules: Record<string, Rule<'link'>>
): Map<string, string[]> {
	const out = new Map<string, string[]>();
	for (const [kind, rule] of Object.entries(rules)) {
		const choices = findStructuralVariantChoices(kind, rule, rules);
		if (choices.length === 0) continue;
		const targetNames: string[] = [];
		const seen = new Set<string>();
		for (const c of choices) {
			for (const arm of c.arms) {
				if (seen.has(arm.targetName)) continue;
				seen.add(arm.targetName);
				targetNames.push(arm.targetName);
			}
		}
		out.set(kind, targetNames);
	}
	return out;
}
