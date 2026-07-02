/**
 * types/rule-metadata-brand.ts — the OPAQUE type for `RuleBase.metadata`.
 *
 * Layering note (debt PR-P1): `types/` cannot import from `dsl/` (dsl → types
 * ← compiler is the acyclic dependency shape; see docs/compiler-phase-glossary.md
 * "Rule IR" §R11). But `RuleBase.metadata` (types/rule.ts) needs a TYPE here so
 * every phase-gated Rule shape can carry it, while the real provenance shape and
 * its construct/read accessors must live in `dsl/rule-metadata.ts` (only dsl-side
 * code — enrich, wire, diagnostics — is a sanctioned reader of the real shape).
 *
 * This file holds ONLY the brand: a nominal type with no structural properties.
 * `dsl/rule-metadata.ts` imports this brand type and casts through it internally
 * to implement `makeRuleMetadata` / `readRuleMetadata`. Nothing in `types/` or
 * `compiler/` may cast through the brand directly — that would defeat the
 * opacity contract (`feedback_metadata_not_behavior` / decision 3 in
 * docs/superpowers/specs/2026-07-02-rule-type-model-ssot-research.md).
 */
declare const RULE_METADATA_BRAND: unique symbol;

/**
 * Opaque provenance bag. Exposes NO readable properties to compiler code —
 * any attempt to read a fact off it directly (`rule.metadata.source`) is a
 * compile error. The only way to construct or read the real shape is through
 * `dsl/rule-metadata.ts`'s `makeRuleMetadata` / `readRuleMetadata`.
 */
export type RuleMetadata = { readonly [RULE_METADATA_BRAND]?: never };
