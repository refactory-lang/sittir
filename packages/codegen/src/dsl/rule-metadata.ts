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

export interface RuleMetadataShape {
	author?: 'grammar' | 'override' | 'enrich' | 'evaluate';
	classifiedBy?: 'grammar' | 'link';
	inlinedFrom?: string;
	fieldSource?: 'grammar' | 'override' | 'enriched';
	symbolSource?: 'grammar' | 'link' | 'group-lift';
}

export function makeRuleMetadata(shape: RuleMetadataShape): RuleMetadata {
	return shape as unknown as RuleMetadata;
}

export function readRuleMetadata(meta: unknown): RuleMetadataShape | undefined {
	return meta as RuleMetadataShape | undefined;
}

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
