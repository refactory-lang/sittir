/**
 * compiler/variant-structural.ts — structural derivation of variant()
 * adoption (R12 / decision-7 V0-V1).
 *
 * `assemble.ts` historically consumed `variantChildKinds` from the WIRE
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
 * This module derives the same `{parent -> childFullName[]}` shape the wire
 * channel produces, straight from the tree, given only a grammar's rule map
 * (`normalized.rules`, the same snapshot `assemble()` already iterates).
 *
 * STATUS (V1, 2026-07-04): `assemble.ts:158-164` (the "V1 flip") now
 * consumes `deriveStructuralVariantChildren` DIRECTLY as the source of
 * `variantChildrenByParent`/`variantChildKindsSet` — this is no longer a
 * derivation-in-waiting. The wire channel (`normalized.polymorphVariants`)
 * feeds ONLY `tool variant-derivation-probe`'s comparison assertion (which
 * the module's predicate is verified equal to, modulo an enumerated
 * exceptions table — see that probe's own doc and the research doc's "V1
 * OUTCOME" section for the full per-case adjudication). ONE narrow
 * exception survives in `assemble.ts` itself: a SUPERTYPE-classified parent
 * (python's `_simple_pattern`) reads the wire channel directly for its ONE
 * variant child (`negative`), gated on `normalized.rules[pv.parent]?.type
 * === SUPERTYPE` (rule-TYPE-discriminated, not kind-name-discriminated) —
 * see "Known non-reproductions" below and `assemble.ts`'s own comment at
 * that site for why this predicate cannot cleanly cover the SUPERTYPE shape.
 *
 * ## The predicate (reproduce-only scope, decisions 1a + 3 accepted)
 *
 * A CHOICE node `C`, found ANYWHERE in a kind `K`'s post-link rule body
 * (recursive descent — decision-1 nested-choice case, e.g. rust's
 * `function_type` / `range_pattern`), qualifies as a variant-adoption site
 * when AT LEAST ONE member of `C` is a "named-kind arm": a bare ALIAS/
 * SYMBOL reference (through a VARIANT wrapper if present), or a SEQ whose
 * first member is such a reference (the `function_type` shape: alias-then-
 * shared-suffix-content), whose target is BOTH (a) **prefix-named** against
 * `K` (`${K-without-leading-underscore}_<suffix>`, admitting HIDDEN target
 * names per RESOLUTION 3 — the target's own leading `_` is stripped before
 * the prefix comparison, matching `polymorphVisibleName`'s convention) AND
 * (b) **alias-minted** (`isAliasMintedRef` — a bare ALIAS node, or a SYMBOL
 * whose target name has NO independent rule body elsewhere in the grammar's
 * `rules` map; the PR-0c mint-site condition, reapplied here to exclude
 * coincidental prefix-name collisions with ordinary, independently-authored
 * sibling rules — see "Known non-reproductions"). Only qualifying arms
 * contribute a child; sibling arms that reference an unrelated kind (a bare
 * keyword symbol like rust's `crate` arm beside `visibility_modifier`'s
 * `pub` arm), aren't a named-kind ref at all (`NEWLINE`, a literal STRING),
 * or ARE a named-kind ref but not alias-minted (an ordinary sibling rule
 * that happens to share the parent's name prefix) are simply not variant
 * children — they stay ordinary choice arms, exactly mirroring
 * `applyOverridePolymorphs`'s own runtime gate (`symbolInRule`,
 * link.ts:1130), which is ANY-match ("does the found choice contain at
 * least one variant-child alias") rather than `isAllAliasChoice`'s ALL-match
 * (used only by the OTHER, ambient-scaffold-push-down branch when no wire
 * alias is found in the choice at all).
 *
 * This deliberately does NOT implement decision-1's V4 widening (any choice
 * of named kinds) — only prefix-named, alias-minted arms are ever
 * collected, so an ordinary union-of-kinds choice with zero such arms never
 * qualifies at all. See the research doc §2.1 "Tier A" / DECISIONS-NEEDED
 * 1 (a).
 *
 * ## Known non-reproductions (expected, not bugs — see the research doc's
 * "V1 OUTCOME" section for the full adjudication table)
 *
 * MISSING (wire has a pair; structural search can't reproduce it — all 3
 * enumerated as KNOWN_EXCEPTIONS in the probe):
 *
 * - **Naming collision with a separate alias mechanism.** A wire pair can
 *   name a child that never structurally materializes with that name at
 *   all, when a SEPARATE naming mechanism (e.g. rust's `groups: { in_path:
 *   ... }` body-pattern alias) wins the actual visible kind name.
 *   `visibility_modifier`'s `in_path` child is registered by the wire pair
 *   as `visibility_modifier_in_path`, but the grammar's real alias-minted
 *   kind is bare `in_path` — a pre-existing naming collision between two
 *   independent alias mechanisms, unrelated to this derivation. That real
 *   `in_path` kind has ZERO node-model/dispatch coverage today (a
 *   pre-existing gap, not a V1 regression); retiring the phantom pair is a
 *   separate follow-up.
 * - **No CHOICE node at all.** Some wire pairs target a lone aliased SEQ
 *   member with no sibling alternation (python's `dict_pattern`'s `kv`
 *   child: `seq(SYMBOL dict_pattern_kv, REPEAT(...))`, not inside any
 *   CHOICE) — there is no "choice of named kinds" for the predicate to
 *   match against at all, by design (the predicate is CHOICE-centric,
 *   matching `isAllAliasChoice`/`findVariantChoice`'s own scope).
 * - **Supertype union, not a CHOICE rule.** Python's `_simple_pattern`
 *   wire pair (`negative`) targets what auto-classifies to a `SupertypeRule`
 *   (`subtypes: string[]`) BEFORE `normalized.rules` is built
 *   (`classifyHiddenChoiceRule`, link.ts) — a structurally different rule
 *   shape than `ChoiceRule`, and the classification destroys the
 *   alias-mint linkage entirely (the original CHOICE's alias/symbol members
 *   flatten into bare strings). Investigated and rejected a body-presence
 *   heuristic on `subtypes` strings: ts `type`'s
 *   `_type_query_member_expression_in_type_annotation` subtype looks
 *   structurally identical (no independent body under its own
 *   stripped-visible name either) but is an UNRELATED alias target of a
 *   different parent — a generic rule would readmit it as a false
 *   positive. `assemble.ts` keeps a narrow, rule-TYPE-gated wire read for
 *   this one case instead (see that file's `variantChildKindsSet` comment).
 *
 * EXTRA (structural finds a prefix-named, alias-minted choice; no wire pair
 * exists — REVIEWED-ADDITIVE, these join the form set):
 *
 * - **Hand-authored `alias()` calls with no `polymorphs:`/`variant()`
 *   registration.** Several kinds are full `rules:` replacements that call
 *   `alias(...)` directly in the override body (rust's `impl_item`,
 *   `reference_expression`; typescript's `string`'s `string_fragment`
 *   inside a `refine()`-correlated form) — the structural shape is
 *   identical to wire-injected adoption (both arm targets have NO
 *   independent rule body, passing `isAliasMintedRef`), but
 *   `wireRegisterPolymorphVariant` was never invoked, so no wire pair
 *   exists. This is the derivation being MORE complete than the wire
 *   channel, not a false positive on the grammar.
 *
 * Coincidental prefix-name collisions with an ordinary, independently-
 * authored grammar symbol (python's `dictionary`/`dictionary_splat`,
 * `string`/`string_content`; typescript's `object_type_content`/`_comma`+
 * `_semi` — none `alias()`-minted, all real top-level rules with their own
 * bodies) are EXCLUDED by `isAliasMintedRef` — they are no longer even
 * candidates, not merely filtered post-hoc.
 */

import { polymorphVisibleName } from '../dsl/wire/wire.ts';
import { ALIAS, CHOICE, OPTIONAL, SEQ, SYMBOL, VARIANT } from '../types/rule-types.ts';
import type { AliasRule, ChoiceRule, Rule, SeqRule, SymbolRule } from '../types/rule.ts';

/**
 * Re-exported for `tool variant-derivation-probe` (`packages/tools`, which
 * cannot statically import codegen internals — see `codegen-surface.ts`'s
 * `invoke` indirection): the probe needs the SAME `${parent}_${child}`
 * full-name convention this module uses (`prefixNamedSuffix`) to reconstruct
 * the wire channel's full target names for comparison, rather than a naive
 * `${pv.parent}_${pv.child}` concatenation (unsound for hidden parents — see
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
 */
function isAliasMintedRef(rule: Rule<'link'>, rules: Record<string, Rule<'link'>>): boolean {
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
 * structurally — the drop-in replacement for the wire-derived
 * `variantChildrenByParent` map `assemble.ts` builds from
 * `normalized.polymorphVariants` (V1: `assemble.ts` consumes this directly).
 * Values are the arm's FULL target kind name (`arm.targetName`), matching
 * `variantChildrenByParent`'s `${v.parent}_${v.child}` shape exactly —
 * NOT a `${kind}_${suffix}` reconstruction, which is unsound when a hidden
 * (`_`-prefixed) parent has a VISIBLE target (ts's
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
 * `refine()`-correlated form — one child kind, two mint sites), and the wire
 * channel's own registration (`wireRegisterPolymorphVariant`) is documented
 * idempotent for the same reason — structural parity requires the same
 * one-entry-per-child-kind shape.
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
