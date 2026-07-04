/**
 * dsl/rule-metadata.ts — the REAL shape behind `RuleBase.metadata`'s opaque
 * `RuleMetadata` brand (types/rule-metadata-brand.ts), plus its construct/read
 * accessors.
 *
 * Mirrors the two-seam split already established by
 * `compiler/opaque-facts.ts` for slot-level facts: WRITING is unrestricted
 * (`makeRuleMetadata` — any phase may record a provenance fact; recording is
 * not the same as branching on it), READING the real shape back
 * (`readRuleMetadata`, `RuleMetadataShape`) is restricted to:
 *   - `dsl/enrich.ts`
 *   - `dsl/wire/*.ts` (including wire's transform machinery, e.g.
 *     `dsl/transform/transform-path.ts`'s `author === 'enrich'` descent
 *     keying — was `source === 'enrich'` before decision 6's unified
 *     `author` vocabulary)
 *   - diagnostics-emission code (e.g. `packages/tools/src/validate/*`,
 *     node-model serialization in `emitters/node-model.ts`)
 *
 * Everything else — compiler phases (`compiler/*.ts`) and emitters that drive
 * codegen DECISIONS (as opposed to serializing a diagnostic dump) — must treat
 * `RuleMetadata` as opaque: construct-and-forget or blind-carry only, never
 * call `readRuleMetadata` to branch. This is enforced by
 * `dsl/__tests__/rule-metadata-layering.test.ts` (see that file's header for
 * the mechanism).
 *
 * Per the governing doctrine (decision 3 + corollary,
 * docs/superpowers/specs/2026-07-02-rule-type-model-ssot-research.md): the
 * compiler must neither read a provenance tag NOR reconstruct authorship
 * STRUCTURALLY. Stamp-then-reread patterns (a phase stamps a tag, a LATER
 * phase/caller re-reads the same rule to decide behavior) must become
 * return-value dataflow instead — see `compiler/link.ts`'s
 * `classifyHiddenRule` / `classifyHiddenChoiceRule` for the converted example
 * (debt PR-P1, item 3).
 *
 * Layering: `types/rule-metadata-brand.ts` (which `types/` CAN own, since it
 * has no dsl-facing dependency) declares the opaque brand type `RuleMetadata`.
 * This module imports that brand and casts through it internally — the only
 * place in the codebase allowed to do so.
 */
import type { RuleMetadata } from '../types/rule-metadata-brand.ts';
import type { ChoiceRule, StringRule } from '../types/rule.ts';
import { CHOICE } from '../types/rule-types.ts'; // @rule-type-consts

/**
 * The real provenance shape. Absorbs:
 *   - the former `RuleBase.metadata` bag (`source` / `inlinedFrom`)
 *   - the former top-level `FieldRule.source` (`'grammar' | 'override' |
 *     'enriched' | 'inferred'`) — relocated here as `fieldSource` (debt PR-P1
 *     item 2; the 'inferred' arm is dropped per the confirmed-dead-writer
 *     probe, lingering-debt-inventory-research.md §2.6)
 *   - the former top-level `SymbolRule.source` (`'grammar' | 'link' |
 *     'group-lift'`) — relocated here as `symbolSource` (debt PR-P1 item 2)
 *
 * Deliberately kept as separate per-fact keys rather than one unified
 * `source` — the three vocabularies are genuinely different value sets (see
 * lingering-debt-inventory-research.md §5.4's "source homonyms" note);
 * collapsing them is a separate design discussion, not in scope here.
 *
 * (debt: source-homonym resolution, decision 6, 2026-07-04) The former
 * `source?: 'grammar' | 'promoted' | 'override' | 'enrich' | 'group-lift'`
 * field wore TWO different facts under one name:
 *   - WHO ORIGINALLY WROTE the rule's text — grammar authoring, an
 *     overrides.ts patch, dsl-side enrich synthesis, or evaluate synthesis.
 *     This is `author` below. `'group-lift'` never actually appeared as a
 *     `source` value in practice (only as `symbolSource`) and is dropped.
 *   - WHETHER a classification was DECLARED (grammar-authored, e.g.
 *     `grammar.supertypes`) or INFERRED by link's structural classifier
 *     (the former `'promoted'` value). This is `classifiedBy` below — it is
 *     NOT an authorship fact (the rule's text is still grammar-authored
 *     either way; only the ENUM/SUPERTYPE classification decision was
 *     inferred rather than declared).
 */
export interface RuleMetadataShape {
	/**
	 * WHO wrote this rule's text. `'grammar'` — authored directly in the
	 * grammar. `'override'` — authored or replaced by an overrides.ts patch.
	 * `'enrich'` — dsl-side enrich synthesized this position (path-descent in
	 * transform-path.ts and link's enrich↔link handoff key on this to travel
	 * through / resolve the synthesized position). `'evaluate'` — evaluate
	 * synthesized this rule (mirrors `RuleProvenance`'s
	 * `'evaluate-synthesized'`, decision 6).
	 */
	author?: 'grammar' | 'override' | 'enrich' | 'evaluate';
	/**
	 * WHETHER a rule's ENUM/SUPERTYPE classification was declared in the
	 * grammar (`'grammar'`, e.g. present in `grammar.supertypes`) or inferred
	 * by link's structural classifier (`'link'`, the former `source:
	 * 'promoted'` value). Diagnostics-only (the `promotedRules` derivation
	 * log / suggested.ts's override-candidate surfacing) — never an
	 * authorship fact.
	 */
	classifiedBy?: 'grammar' | 'link';
	/** Diagnostics-only: the hidden kind whose body was spliced in by the
	 *  normalize inline hoist (§D-2a). */
	inlinedFrom?: string;
	/** Relocated `FieldRule.source` (debt PR-P1 item 2). */
	fieldSource?: 'grammar' | 'override' | 'enriched';
	/** Relocated `SymbolRule.source` (debt PR-P1 item 2). */
	symbolSource?: 'grammar' | 'link' | 'group-lift';
}

/** Construct opaque rule metadata from the real shape — the single write seam. */
export function makeRuleMetadata(shape: RuleMetadataShape): RuleMetadata {
	return shape as unknown as RuleMetadata;
}

/**
 * Read opaque rule metadata back as the real shape. Sanctioned callers only
 * (see module header) — never call from compiler logic or an emitter's
 * branching path.
 *
 * Accepts `unknown` (not just `RuleMetadata`) as input: hand-constructed test
 * fixtures and some dsl-layer boundary shapes (`FieldLike`/`RuntimeRule`,
 * types/runtime-shapes.ts) carry `metadata` typed loosely — the read seam
 * itself is still the single sanctioned place the real shape is exposed, so
 * widening the input type here doesn't loosen the opacity contract on
 * `RuleBase.metadata` (which stays `RuleMetadata`, unreadable without this
 * function regardless of caller layer).
 */
export function readRuleMetadata(meta: unknown): RuleMetadataShape | undefined {
	return meta as RuleMetadataShape | undefined;
}

/**
 * Normalize a closed literal set to the canonical rule shape.
 *
 * (Relocated from `types/rule.ts` — debt PR-P1: it constructs the
 * `metadata` bag via `makeRuleMetadata`, which `types/` cannot import.)
 *
 * Multi-member sets remain a ChoiceRule (enum-shaped). A single literal
 * collapses to that StringRule so downstream phases classify it as the
 * corresponding keyword/token instead of carrying a degenerate enum shape.
 *
 * (debt: source-homonym resolution, decision 6) Callers pass EITHER
 * `author` (evaluate's grammar-authored-literal-set callers) OR
 * `classifiedBy` (link's enum-promotion classifier) — never both; they are
 * different facts (who wrote the text vs. whether the ENUM classification
 * was declared or inferred), so they are separate optional fields rather
 * than one overloaded `source` value.
 */
export function normalizeEnumMembers(
	members: readonly StringRule[],
	provenance?: { author?: RuleMetadataShape['author']; classifiedBy?: RuleMetadataShape['classifiedBy'] }
): StringRule | ChoiceRule {
	if (members.length === 1) return members[0]!;
	return {
		type: CHOICE,
		members: members as StringRule[],
		...(provenance !== undefined ? { metadata: makeRuleMetadata(provenance) } : {})
	} satisfies ChoiceRule;
}
