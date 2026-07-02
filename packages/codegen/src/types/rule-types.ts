/**
 * compiler/rule-types.ts — Rule discriminant tag constants (SLATED FOR REMOVAL).
 *
 * Each constant is exactly its tag value (`SEQ === 'SEQ'`). The `Rule`
 * union in `rule.ts` derives its `type` fields from these via `typeof SEQ`.
 * (UPPERCASE since debt PR-U — sittir's IR adopted tree-sitter's discriminant
 * case; see `docs/superpowers/specs/2026-07-02-rule-type-model-ssot-research.md`
 * DECISIONS item 2.)
 *
 * DEPRECATED: this const-string layer violates `AGENTS.md` §"Rule type
 * discrimination" — the `Rule` union is meant to be the single source of truth,
 * with inline `rule.type === 'SEQ'` literals (type-safe via discriminated-union
 * narrowing) and the per-variant guards (`isSeq`, ...) in `rule.ts`. This layer
 * adds no errors over the union itself and is a second vocabulary that can drift.
 *
 * It is kept ONLY to avoid a ~5.8k-site / ~70-file codemod inside a feature
 * branch (the file is shared with PR-N). Removal is tracked as a dedicated
 * follow-up: `docs/superpowers/plans/2026-06-05-rule-type-consts-codemod.md`.
 * Do NOT add new imports of these constants — use `rule.type` literals/guards.
 */

export const SEQ = 'SEQ' as const;
export const OPTIONAL = 'OPTIONAL' as const;
export const CHOICE = 'CHOICE' as const;
export const REPEAT = 'REPEAT' as const;
export const REPEAT1 = 'REPEAT1' as const;
export const FIELD = 'FIELD' as const;
export const VARIANT = 'VARIANT' as const;
export const SUPERTYPE = 'SUPERTYPE' as const;
export const GROUP = 'GROUP' as const;
export const STRING = 'STRING' as const;
export const PATTERN = 'PATTERN' as const;
export const INDENT = 'INDENT' as const;
export const DEDENT = 'DEDENT' as const;
export const NEWLINE = 'NEWLINE' as const;
export const SYMBOL = 'SYMBOL' as const;
export const ALIAS = 'ALIAS' as const;
export const TOKEN = 'TOKEN' as const;
