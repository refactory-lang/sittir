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
 *     `dsl/transform/transform-path.ts`'s `source === 'enrich'` descent keying)
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
import type { ChoiceRule, RuleSource, StringRule } from '../types/rule.ts';
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
 */
export interface RuleMetadataShape {
	/**
	 * Rule-level provenance marker. `'enrich'` marks an enrich-synthesized
	 * SYMBOL/ALIAS ref — path-descent (transform-path.ts) and link's
	 * enrich↔link handoff (`mintContentAliasKinds`) key on this to travel
	 * through / resolve the synthesized position. `'group-lift'` is the
	 * legacy marker predating the `metadata.source` consolidation.
	 * `RuleSource` (`'grammar' | 'promoted' | 'override'`) covers rule-level
	 * classification provenance recorded for diagnostics.
	 */
	source?: 'grammar' | 'promoted' | 'override' | 'enrich' | 'group-lift';
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
 * `metadata.source` bag via `makeRuleMetadata`, which `types/` cannot import.)
 *
 * Multi-member sets remain a ChoiceRule (enum-shaped). A single literal
 * collapses to that StringRule so downstream phases classify it as the
 * corresponding keyword/token instead of carrying a degenerate enum shape.
 * The `source` provenance is carried in `metadata.source` (not top-level).
 */
export function normalizeEnumMembers(
	members: readonly StringRule[],
	source?: RuleSource
): StringRule | ChoiceRule {
	if (members.length === 1) return members[0]!;
	return {
		type: CHOICE,
		members: members as StringRule[],
		...(source !== undefined ? { metadata: makeRuleMetadata({ source }) } : {})
	} satisfies ChoiceRule;
}
