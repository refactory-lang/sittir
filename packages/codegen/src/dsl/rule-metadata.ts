/**
 * dsl/rule-metadata.ts — the REAL shape behind `RuleBase.metadata`'s opaque
 * `RuleMetadata` brand (types/rule-metadata-brand.ts), plus its construct/read
 * accessors. See docs/compiler-phase-glossary.md's "Metadata provenance"
 * section (under Rule IR) for the two-seam access doctrine, the sanctioned
 * `readRuleMetadata` callers, and the enforcement mechanism
 * (`dsl/__tests__/rule-metadata-layering.test.ts`).
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
 * The real provenance shape: `author` (who wrote this rule's text),
 * `classifiedBy` (whether an ENUM/SUPERTYPE classification was declared vs.
 * inferred — not an authorship fact), plus the relocated `fieldSource` /
 * `symbolSource` per-rule-type provenance fields.
 *
 * Deliberately kept as separate per-fact keys rather than one unified
 * `source` — the vocabularies are genuinely different value sets; collapsing
 * them is a separate design discussion, not in scope here.
 */
export interface RuleMetadataShape {
	/**
	 * WHO wrote this rule's text. `'grammar'` — authored directly in the
	 * grammar. `'override'` — authored or replaced by an overrides.ts patch.
	 * `'enrich'` — dsl-side enrich synthesized this position (path-descent in
	 * transform-path.ts and link's enrich↔link handoff key on this to travel
	 * through / resolve the synthesized position). `'evaluate'` — evaluate
	 * synthesized this rule.
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
	 *  normalize inline hoist. */
	inlinedFrom?: string;
	/** Relocated `FieldRule.source`. */
	fieldSource?: 'grammar' | 'override' | 'enriched';
	/** Relocated `SymbolRule.source`. */
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
 * (Lives here, not `types/rule.ts`, because it constructs the `metadata` bag
 * via `makeRuleMetadata`, which `types/` cannot import.)
 *
 * Multi-member sets remain a ChoiceRule (enum-shaped). A single literal
 * collapses to that StringRule so downstream phases classify it as the
 * corresponding keyword/token instead of carrying a degenerate enum shape.
 *
 * Callers pass EITHER `author` (evaluate's grammar-authored-literal-set
 * callers) OR `classifiedBy` (link's enum-promotion classifier) — never both.
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
