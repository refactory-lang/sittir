/**
 * compiler/variant-structural.ts — structural derivation of variant()
 * adoption (R12 / decision-7 V0-V2).
 *
 * `assemble.ts` historically consumed `variantChildKinds` from a WIRE
 * metadata channel (`normalized.polymorphVariants`, populated by
 * `wireRegisterPolymorphVariant` during evaluate). That channel recorded
 * *authored intent*: what a `polymorphs:`/`variant()` override SAID it
 * wanted, not what actually materialized in the post-link rule tree.
 * `link.ts`'s own `isAllAliasChoice` (used by
 * `pushAmbientScaffoldIntoVariantChildren`) already proved the alias-choice
 * shape wire injects is a STRUCTURAL fact, matchable with no metadata at
 * all — see docs/superpowers/specs/2026-07-04-variant-structural-derivation-research.md
 * §2, §4.3, and the "V2 OUTCOME" section.
 *
 * This module derives the same `{parent -> childFullName[]}` shape the wire
 * channel used to produce, straight from the tree, given only a grammar's
 * rule map (`normalized.rules`, the same snapshot `assemble()` already
 * iterates).
 *
 * STATUS (V2, 2026-07-04): the wire metadata channel is DELETED —
 * `wireRegisterPolymorphVariant`, `WireContext.polymorphVariants`,
 * `drainPolymorphMetadata`, and the `polymorphVariants` fields on
 * RawGrammar/LinkedGrammar/SimplifiedGrammar are all gone. Every former
 * consumer now reads this module's structural derivation directly:
 * `assemble.ts:158-164` (variantChildrenByParent/variantChildKindsSet — the
 * "V1 flip", unchanged in V2), `link.ts`'s `applyOverridePolymorphs` (its
 * (parent, children) pairs, formerly wire-pair-driven, now discovered
 * structurally too), and `normalize.ts`'s `variantSkip` diagnostic
 * skip-set. The ONE case that used to need a narrow wire-channel
 * supplement — a SUPERTYPE-classified parent (python's `_simple_pattern`)
 * whose CHOICE-flatten (`classifyHiddenChoiceRule`, link.ts) destroys the
 * alias-mint linkage before this module ever sees the rule — is now
 * covered by a DECLARED structural fact instead: `classifyHiddenChoiceRule`
 * stamps `SupertypeRule.variantArms` (see `RuleBase.variantArms`'s doc
 * comment, types/rule.ts) at the exact moment of flatten, using this
 * module's OWN `isAliasMintedRef` helper (exported, shared, not
 * re-derived) applied to the pre-flatten CHOICE's members.
 * `tool variant-derivation-probe` (packages/tools) is no longer a
 * structural-vs-wire equality check — it's now a cross-commit DRIFT
 * DETECTOR comparing this module's live output against the COMMITTED
 * `node-model.json5` `polymorphVariants` section per grammar (see that
 * probe's own doc for the modelType==='branch' restriction its comparison
 * requires).
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
 * "V1 OUTCOME" and "V2 OUTCOME" sections for the full adjudication table)
 *
 * These were originally framed as "wire has a pair; structural search can't
 * reproduce it" (V0/V1, when the wire channel still existed as the
 * comparison target). With the channel deleted (V2), the SAME structural
 * facts below now explain why these parents structurally do NOT appear in
 * `deriveStructuralVariantChildren`'s output at all, full stop — there is
 * no wire side to compare against anymore, only the reasoning for the gap:
 *
 * - **Naming collision with a separate alias mechanism.** A child kind can
 *   fail to structurally materialize with the "expected" `${parent}_
 *   ${suffix}` name at all, when a SEPARATE naming mechanism (e.g. rust's
 *   `groups: { in_path: ... }` body-pattern alias) wins the actual visible
 *   kind name. `visibility_modifier`'s intended `in_path` child would be
 *   named `visibility_modifier_in_path`, but the grammar's real
 *   alias-minted kind is bare `in_path` — a pre-existing naming collision
 *   between two independent alias mechanisms, unrelated to this
 *   derivation. That real `in_path` kind has ZERO node-model/dispatch
 *   coverage today (a pre-existing gap); fixing it is a separate follow-up
 *   (rust's committed node-model.json5 confirms zero drift on this front —
 *   `visibility_modifier`'s only committed child is `pub`).
 * - **No CHOICE node at all.** Some variant() registrations target a lone
 *   aliased SEQ member with no sibling alternation (python's
 *   `dict_pattern`'s `kv` child: `seq(SYMBOL dict_pattern_kv, REPEAT(...))`,
 *   not inside any CHOICE) — there is no "choice of named kinds" for the
 *   predicate to match against at all, by design (the predicate is
 *   CHOICE-centric, matching `isAllAliasChoice`/`findVariantChoice`'s own
 *   scope). `dict_pattern` has no committed node-model.json5 entry either —
 *   zero drift.
 * - **Supertype/Group union, not (only) a plain BRANCH.** Some
 *   variant-adoption parents classify to `SupertypeRule` (python's
 *   `_simple_pattern`) or `AssembledGroup` (ts's
 *   `_export_statement_default_decl_arm` family, `_for_header`) rather than
 *   `AssembledBranch`. `_simple_pattern`'s original CHOICE flattens into a
 *   bare `subtypes: string[]` BEFORE this module ever sees the rule
 *   (`classifyHiddenChoiceRule`, link.ts) — the alias-mint linkage would be
 *   destroyed if not for the declared `variantArms` fact that flatten
 *   stamps (see `RuleBase.variantArms`'s doc comment); this module still
 *   can't reproduce it from `normalized.rules` alone (verified: ts `type`'s
 *   `_type_query_member_expression_in_type_annotation` subtype is a
 *   structurally-identical-looking coincidental collision that a generic
 *   body-presence heuristic would readmit as a false positive). GROUP
 *   parents have no `variantChildKinds` field at all on `AssembledGroup` —
 *   `buildFactoryMap` (emitters/factory-map.ts) only ever visits
 *   `modelType==='branch'` nodes, so neither shape can EVER produce a
 *   `node-model.json5` `polymorphVariants` entry regardless of how the
 *   children were discovered. `tool variant-derivation-probe`'s comparison
 *   restricts to `modelType==='branch'` parents on both sides for exactly
 *   this reason — see that probe's own doc.
 *
 * EXTRA (structural finds a prefix-named, alias-minted choice that has no
 * historical wire-pair equivalent — REVIEWED-ADDITIVE, these joined the
 * form set during V1 and are now simply part of the baseline):
 *
 * - **Hand-authored `alias()` calls with no `polymorphs:`/`variant()`
 *   registration.** Several kinds are full `rules:` replacements that call
 *   `alias(...)` directly in the override body, or inherit one from the
 *   upstream base grammar (rust's `impl_item`, `reference_expression`,
 *   `_pattern`'s `wildcard_pattern` arm, `_condition`'s `let_chain` arm,
 *   `_type`'s `primitive_type` arm; typescript's `string`'s
 *   `string_fragment` inside a `refine()`-correlated form,
 *   `_jsx_attribute_name`'s `property_identifier` arm, `primary_type`'s
 *   `this` arm) — the structural shape is identical to wire-injected
 *   adoption (arm targets have NO independent rule body, passing
 *   `isAliasMintedRef`), regardless of whether a `polymorphs:`/`variant()`
 *   override ever registered it. This is the derivation being MORE
 *   complete than the old wire channel ever was, not a false positive on
 *   the grammar — the ones that materialize into their own `AssembledBranch`
 *   (not a supertype/group parent's ordinary subtype-union arm) are
 *   reflected in the committed node-model.json5 today (rust's `impl_item`/
 *   `reference_expression`, ts's `string`).
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

function stripHiddenPrefix(name: string): string {
	return name.startsWith('_') ? name.slice(1) : name;
}

export function isAliasMintedRef(rule: Rule<'link'>, rules: Record<string, Rule<'link'>>): boolean {
	if (rule.type === ALIAS) return true;
	if (rule.type === SYMBOL) return !(rule.name in rules);
	return false;
}

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

export function prefixNamedSuffix(parentKind: string, targetName: string): string | null {
	const bareTarget = stripHiddenPrefix(targetName);
	const prefix = `${polymorphVisibleName(parentKind, '')}`;
	if (!bareTarget.startsWith(prefix)) return null;
	const suffix = bareTarget.slice(prefix.length);
	return suffix.length > 0 ? suffix : null;
}

export interface StructuralVariantChoice {
	readonly choice: ChoiceRule<'link'>;
	readonly arms: readonly { readonly suffix: string; readonly targetName: string }[];
}

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

export function deriveStructuralVariantChildren(rules: Record<string, Rule<'link'>>): Map<string, string[]> {
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
