/**
 * compiler/rule-types.ts — Rule discriminant tag constants (SLATED FOR REMOVAL).
 *
 * Each constant is exactly its lowercase tag value (`SEQ === 'seq'`). The `Rule`
 * union in `rule.ts` derives its `type` fields from these via `typeof SEQ`.
 *
 * DEPRECATED: this const-string layer violates `AGENTS.md` §"Rule type
 * discrimination" — the `Rule` union is meant to be the single source of truth,
 * with inline `rule.type === 'seq'` literals (type-safe via discriminated-union
 * narrowing) and the per-variant guards (`isSeq`, ...) in `rule.ts`. This layer
 * adds no errors over the union itself and is a second vocabulary that can drift.
 *
 * It is kept ONLY to avoid a ~5.8k-site / ~70-file codemod inside a feature
 * branch (the file is shared with PR-N). Removal is tracked as a dedicated
 * follow-up: `docs/superpowers/plans/2026-06-05-rule-type-consts-codemod.md`.
 * Do NOT add new imports of these constants — use `rule.type` literals/guards.
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
