/**
 * types/rule-metadata-brand.ts — the OPAQUE brand type for `RuleBase.metadata`.
 * See docs/compiler-phase-glossary.md "Metadata provenance" for the full
 * layering rationale and the sanctioned read/write accessors
 * (`dsl/rule-metadata.ts`'s `makeRuleMetadata` / `readRuleMetadata`).
 */
declare const RULE_METADATA_BRAND: unique symbol;

/** Opaque provenance bag — no structural properties; see file header. */
export type RuleMetadata = { readonly [RULE_METADATA_BRAND]?: never };
