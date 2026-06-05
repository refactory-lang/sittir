/**
 * compiler/rule-types.ts — single source of truth for Rule discriminant tags.
 *
 * Every rule-type literal in the codebase routes through these constants so the
 * tag vocabulary (and its casing) can be changed in ONE place. sittir's
 * canonical casing is lowercase; tree-sitter's is uppercase. The values below
 * are the canonical sittir tags.
 *
 * NOTE (transitional — uppercase): these are temporarily UPPERCASE while the
 * Rule union in rule.ts is flipped to uppercase, so tsgo can enumerate every
 * literal site for migration to these constants. Once all sites reference the
 * constants, both the union and these values flip back to lowercase in one step.
 */

export const SEQ = 'seq' as const;
export const OPTIONAL = 'optional' as const;
export const CHOICE = 'choice' as const;
export const REPEAT = 'repeat' as const;
export const REPEAT1 = 'repeat1' as const;
export const FIELD = 'field' as const;
export const VARIANT = 'variant' as const;
export const ENUM = 'enum' as const;
export const SUPERTYPE = 'supertype' as const;
export const GROUP = 'group' as const;
export const TERMINAL = 'terminal' as const;
export const STRING = 'string' as const;
export const PATTERN = 'pattern' as const;
export const INDENT = 'indent' as const;
export const DEDENT = 'dedent' as const;
export const NEWLINE = 'newline' as const;
export const SYMBOL = 'symbol' as const;
export const ALIAS = 'alias' as const;
export const TOKEN = 'token' as const;
