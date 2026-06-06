# rule-types.ts removal codemod

> Tracking note for a dedicated follow-up PR. Not part of PR-M-φ2 / PR-N.

**Goal:** Delete `packages/codegen/src/compiler/rule-types.ts` and revert all
call sites to inline `rule.type` literals + the per-variant type guards exported
from `compiler/rule.ts`.

**Why:** `rule-types.ts` is a const-string layer over the `Rule` discriminant
vocabulary. `AGENTS.md` §"Rule type discrimination" forbids exactly this:

> **Do not introduce:** enum / const mappings for type strings. The `Rule`
> union IS the single source of truth; misspellings are type errors.

Three bots flag it (codex P2 on #61, codex P1 + Copilot on #62). It is also the
source of the recurring stale-LSP phantom diagnostics (`'seq'` vs `'SEQ'`) that
appear whenever the editor caches an intermediate state of the file.

**Why deferred to its own PR (not done in #61/#62):** it is a compiler-wide
codemod — **~5,813 identifier sites across ~70 files** (23 non-test src +
~47 tests), and `rule-types.ts` is edited by BOTH #61 and #62. Doing it on a
feature branch means resolving the same churn twice. Land it once on `master`
after both merge.

**Scope (the 1:1 mapping — every const is its lowercase value):**
`SEQ='seq'`, `OPTIONAL='optional'`, `CHOICE='choice'`, `REPEAT='repeat'`,
`REPEAT1='repeat1'`, `FIELD='field'`, `VARIANT='variant'`, `ENUM='enum'`,
`SUPERTYPE='supertype'`, `GROUP='group'`, `TERMINAL='terminal'`,
`STRING='string'`, `PATTERN='pattern'`, `INDENT='indent'`, `DEDENT='dedent'`,
`NEWLINE='newline'`, `SYMBOL='symbol'`, `ALIAS='alias'`, `TOKEN='token'`.

**Execution constraints:**
- **AST-aware rename, not sed.** Several constants (`GROUP`, `FIELD`, `ENUM`,
  `STRING`, `TOKEN`) are common English words; a naive `\bSTRING\b` replace
  would also hit comments and unrelated identifiers. Use ts-morph / the TS LSP
  (per the "prefer LSP for renames" convention).
- **Two substitution shapes:**
  - type position `readonly type: typeof SEQ` → `readonly type: 'seq'`
  - value position (`r.type === SEQ`, `case SEQ:`, `type: SEQ`) → `'seq'`
- Remove the now-dead `import { ... } from '.../rule-types.ts'` in each file
  (grep marker: the trailing `// @rule-type-consts` comment).
- Delete `rule-types.ts`.
- The `dsl/*` UPPERCASE predicates (`isSeqType`, `typeEq`, ...) in
  `dsl/runtime-shapes.ts` are a SEPARATE, sanctioned layer (AGENTS.md "DSL layer
  exception") — **do not touch them.**

**Gate:** tsgo-green + `env -u SITTIR_NATIVE_DEBUG pnpm validate:native` holds at
floor (rust 111 / ts 69 / py 74). No codegen output should change — this is a
source-only identifier substitution.
