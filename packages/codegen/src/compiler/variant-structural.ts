/**
 * compiler/variant-structural.ts — structural derivation of variant()
 * adoption (R12 / decision-7 V0-V1).
 *
 * `assemble.ts` has historically consumed `variantChildKinds` from the WIRE
 * metadata channel (`normalized.polymorphVariants`, populated by
 * `wireRegisterPolymorphVariant` during evaluate — see wire.ts:190). That
 * channel is *authored intent*: it records what a `polymorphs:`/`variant()`
 * override SAID it wanted, not what actually materialized in the post-link
 * rule tree. `link.ts`'s own `isAllAliasChoice` (used by
 * `pushAmbientScaffoldIntoVariantChildren`) already proves the alias-choice
 * shape wire injects is a STRUCTURAL fact, matchable with no metadata at
 * all — see docs/superpowers/specs/2026-07-04-variant-structural-derivation-research.md
 * §2 and §4.3.
 *
 * This module is the shared derivation-in-waiting: given only a grammar's
 * rule map (`normalized.rules`, the same snapshot `assemble()` already
 * iterates), compute the same `{parent -> childSuffix[]}` shape the wire
 * channel produces, straight from the tree.
 *
 * STATUS (2026-07-04, V0 result): the ONLY current consumer is `tool
 * variant-derivation-probe` (packages/tools/src/probe/variant-derivation.ts),
 * which asserts this derivation is set-equal to the wire channel on all 3
 * grammars and reports MATCH/EXTRA/MISSING per kind. **The probe does NOT
 * show equality** — 9 of 49 parents mismatch across the 3 grammars (rust 3,
 * typescript 2, python 4), each with an understood, non-recursion-fixable
 * root cause (see "Known non-reproductions" below and the probe's own
 * output). Per the staged plan (research doc §7, V0 entry), this BLOCKS
 * V1: `assemble.ts:158-164` still consumes `normalized.polymorphVariants`
 * (the wire channel) — this module is NOT wired into assemble. Do not flip
 * assemble to consume `deriveStructuralVariantChildren` until the mismatch
 * classes below are resolved or explicitly accepted as scope exclusions.
 *
 * ## The predicate (reproduce-only scope, decisions 1a + 3 accepted)
 *
 * A CHOICE node `C`, found ANYWHERE in a kind `K`'s post-link rule body
 * (recursive descent — decision-1 nested-choice case, e.g. rust's
 * `function_type` / `range_pattern`), qualifies as a variant-adoption site
 * when AT LEAST ONE member of `C` is a "named-kind arm": a bare ALIAS/
 * SYMBOL reference (through a VARIANT wrapper if present), or a SEQ whose
 * first member is such a reference (the `function_type` shape: alias-then-
 * shared-suffix-content), whose target name is **prefix-named** against `K`
 * (`${K-without-leading-underscore}_<suffix>`, admitting HIDDEN target names
 * per RESOLUTION 3 — the target's own leading `_` is stripped before the
 * prefix comparison, matching `polymorphVisibleName`'s convention). Only the
 * prefix-named arms contribute a child suffix; sibling arms that reference
 * an unrelated kind (a bare keyword symbol like rust's `crate` arm beside
 * `visibility_modifier`'s `pub` arm) or aren't a named-kind ref at all
 * (`NEWLINE`, a literal STRING) are simply not variant children — they stay
 * ordinary choice arms, exactly mirroring `applyOverridePolymorphs`'s own
 * runtime gate (`symbolInRule`, link.ts:1130), which is ANY-match ("does
 * the found choice contain at least one variant-child alias") rather than
 * `isAllAliasChoice`'s ALL-match (used only by the OTHER, ambient-scaffold-
 * push-down branch when no wire alias is found in the choice at all).
 *
 * This deliberately does NOT implement decision-1's V4 widening (any choice
 * of named kinds) — only prefix-named alias arms are ever collected, so an
 * ordinary union-of-kinds choice with zero prefix-named arms never
 * qualifies at all. See the research doc §2.1 "Tier A" / DECISIONS-NEEDED
 * 1 (a).
 *
 * ## Known non-reproductions (expected, not bugs — see the research doc §2.2)
 *
 * MISSING (wire has a pair; structural search can't reproduce it):
 *
 * - **Naming collision with a separate alias mechanism.** A wire pair can
 *   name a child that never structurally materializes with that name at
 *   all, when a SEPARATE naming mechanism (e.g. rust's `groups: { in_path:
 *   ... }` body-pattern alias) wins the actual visible kind name.
 *   `visibility_modifier`'s `in_path` child is registered by the wire pair
 *   as `visibility_modifier_in_path`, but the grammar's real alias-minted
 *   kind is bare `in_path` — a pre-existing naming collision between two
 *   independent alias mechanisms, unrelated to this derivation.
 * - **No CHOICE node at all.** Some wire pairs target a lone aliased SEQ
 *   member with no sibling alternation (python's `dict_pattern`'s `kv`
 *   child: `seq(SYMBOL dict_pattern_kv, REPEAT(...))`, not inside any
 *   CHOICE) — there is no "choice of named kinds" for the predicate to
 *   match against at all, by design (the predicate is CHOICE-centric,
 *   matching `isAllAliasChoice`/`findVariantChoice`'s own scope).
 * - **Supertype union, not a CHOICE rule.** Python's `_simple_pattern`
 *   wire pair (`negative`) targets a `SupertypeRule` (`subtypes: string[]`),
 *   a structurally different rule shape than `ChoiceRule` — out of scope
 *   for this predicate.
 *
 * EXTRA (structural finds a prefix-named choice; no wire pair exists):
 *
 * - **Hand-authored `alias()` calls with no `polymorphs:`/`variant()`
 *   registration.** Several kinds are full `rules:` replacements that call
 *   `alias(...)` directly in the override body (rust's `impl_item`,
 *   `reference_expression`; typescript's `object_type_content`) — the
 *   structural shape is identical to wire-injected adoption, but
 *   `wireRegisterPolymorphVariant` was never invoked, so no wire pair
 *   exists. This is the derivation being MORE complete than the wire
 *   channel, not a false positive on the grammar.
 * - **Coincidental prefix-name collision with an ordinary grammar symbol.**
 *   A choice can legitimately be an ordinary union of two independently-
 *   authored kinds where one happens to share the parent's name prefix
 *   (python's `dictionary` choice has `pair` and `dictionary_splat` —
 *   `dictionary_splat` is `dictionary`'s own real grammar rule, not a
 *   wire-minted alias; python's `string`'s `string_content` is likewise
 *   ordinary). This is the risk flagged in the research doc §2.2 "additions"
 *   — the reproduce-only predicate still admits false positives from name
 *   coincidence alone; it is NOT the same as decision-1's V4 widening (it
 *   fires on prefix match, not on "any choice of named kinds"), but shows
 *   prefix-matching alone is an imperfect proxy for "wire would have
 *   registered this."
 *
 * None of the above are recursion-depth or predicate-strictness bugs —
 * each is a genuine, understood divergence between authored-intent
 * metadata and rule-tree structure (or between two independent naming
 * mechanisms). See the probe's own MATCH/EXTRA/MISSING table for the full,
 * current enumeration.
 */

import { ALIAS, CHOICE, OPTIONAL, SEQ, SYMBOL, VARIANT } from '../types/rule-types.ts';
import type { AliasRule, ChoiceRule, Rule, SeqRule, SymbolRule } from '../types/rule.ts';

// ---------------------------------------------------------------------------
// Per-arm + per-choice matching
// ---------------------------------------------------------------------------

/** Strip a single leading `_` (hidden-kind marker), if present. */
function stripHiddenPrefix(name: string): string {
	return name.startsWith('_') ? name.slice(1) : name;
}

/**
 * Resolve a rule to its named-kind target name, unwrapping a VARIANT or
 * OPTIONAL wrapper if present (an optional-wrapped alias/symbol still
 * REFERENCES the same target kind — optionality doesn't change what the arm
 * names). Returns null when `rule` is not (through those wrappers) an
 * ALIAS/SYMBOL ref, i.e. not a reference to a real, kind-minting rule.
 */
function namedKindRefTarget(rule: Rule<'link'>): string | null {
	let core: Rule<'link'> = rule;
	while (core.type === VARIANT || core.type === OPTIONAL) {
		core = (core as { content: Rule<'link'> }).content;
	}
	if (core.type === ALIAS) return (core as AliasRule<'link'>).value;
	if (core.type === SYMBOL) return (core as SymbolRule<'link'>).name;
	return null;
}

/**
 * Is `rule` a "named-kind arm" for choice-membership purposes? Bare
 * ALIAS/SYMBOL (through VARIANT/OPTIONAL wrappers), or a SEQ whose FIRST
 * member is such a reference — the `function_type` shape, where each choice
 * arm is `seq(alias, field('parameters', ...))` and every arm shares the
 * trailing content. Returns the target name, or null if this arm doesn't
 * qualify.
 */
function namedKindArmTarget(rule: Rule<'link'>): string | null {
	const direct = namedKindRefTarget(rule);
	if (direct !== null) return direct;
	if (rule.type === SEQ) {
		const seq = rule as SeqRule<'link'>;
		const first = seq.members[0];
		if (first) return namedKindRefTarget(first);
	}
	return null;
}

/**
 * Does `targetName` look like a prefix-named variant child of `parentKind`
 * — i.e. does it equal `polymorphVisibleName(parentKind, suffix)` for some
 * non-empty `suffix`? Both `parentKind` and `targetName` may carry a
 * leading `_` (hidden kind); RESOLUTION 3 admits hidden target names, so
 * the comparison strips both sides' leading underscore before matching.
 * Returns the suffix on match, else null.
 */
function prefixNamedSuffix(parentKind: string, targetName: string): string | null {
	const visibleParent = stripHiddenPrefix(parentKind);
	const bareTarget = stripHiddenPrefix(targetName);
	const prefix = `${visibleParent}_`;
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
	parentKind: string
): { readonly match: StructuralVariantChoice; readonly matchedIndices: ReadonlySet<number> } | null {
	if (rule.type !== CHOICE || rule.members.length === 0) return null;
	const arms: { suffix: string; targetName: string }[] = [];
	const matchedIndices = new Set<number>();
	rule.members.forEach((member, i) => {
		const targetName = namedKindArmTarget(member);
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
	out: StructuralVariantChoice[]
): void {
	if (rule.type === CHOICE) {
		const found = matchStructuralVariantChoice(rule, parentKind);
		if (found) {
			out.push(found.match);
			rule.members.forEach((m, i) => {
				if (!found.matchedIndices.has(i)) collectStructuralVariantChoices(m, parentKind, out);
			});
			return;
		}
		for (const m of rule.members) collectStructuralVariantChoices(m, parentKind, out);
		return;
	}
	switch (rule.type) {
		case SEQ: {
			for (const m of (rule as SeqRule<'link'>).members) collectStructuralVariantChoices(m, parentKind, out);
			return;
		}
		default: {
			const content = (rule as { content?: Rule<'link'> }).content;
			if (content) collectStructuralVariantChoices(content, parentKind, out);
		}
	}
}

/**
 * Find every qualifying variant-adoption choice in kind `kind`'s post-link
 * rule body — the per-choice-node diagnostic view the probe tool reports
 * (MATCH/EXTRA/MISSING per kind, per RESOLUTIONS decision 2's per-(kind,
 * choice) granularity, flattened to today's per-kind flat surface since
 * every current kind has exactly one qualifying choice or none).
 */
export function findStructuralVariantChoices(
	kind: string,
	rule: Rule<'link'>
): readonly StructuralVariantChoice[] {
	const out: StructuralVariantChoice[] = [];
	collectStructuralVariantChoices(rule, kind, out);
	return out;
}

// ---------------------------------------------------------------------------
// Grammar-wide derivation — the Map assemble.ts consumes
// ---------------------------------------------------------------------------

/**
 * Derive `{parent -> childSuffix[]}` for every kind in `rules`, purely
 * structurally — the drop-in replacement for the wire-derived
 * `variantChildrenByParent` map `assemble.ts` builds from
 * `normalized.polymorphVariants` (V1). Suffixes are ordered by
 * first-discovered choice-arm order; when a kind has more than one
 * qualifying choice (none observed on the current 3 grammars, but the
 * predicate doesn't assume it), suffixes from every qualifying choice are
 * concatenated in tree-walk order.
 */
export function deriveStructuralVariantChildren(
	rules: Record<string, Rule<'link'>>
): Map<string, string[]> {
	const out = new Map<string, string[]>();
	for (const [kind, rule] of Object.entries(rules)) {
		const choices = findStructuralVariantChoices(kind, rule);
		if (choices.length === 0) continue;
		const suffixes: string[] = [];
		for (const c of choices) for (const arm of c.arms) suffixes.push(arm.suffix);
		out.set(kind, suffixes);
	}
	return out;
}
