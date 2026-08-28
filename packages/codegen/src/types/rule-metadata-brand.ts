declare const RULE_METADATA_BRAND: unique symbol;

export type RuleMetadata = { readonly [RULE_METADATA_BRAND]?: never };
