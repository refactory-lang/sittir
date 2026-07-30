# KindId invariant restoration — implementation plan

> Governing spec: `docs/superpowers/specs/2026-07-30-kindid-invariant-restoration.md`.
> This plan sequences the work the spec's "End state" and "Relationship and
> sequencing" sections describe; it does not restate the invariant or the
> source inventory — read the spec first.

## Phase 0 — link-time stamping (DONE / in flight)

Landed on `master`: commit `382907756` stamps `resolvedKindId` on
`AssembledKeyword`/`AssembledToken` at construction (`node-map.ts:2314-2372`,
via `findEntryForLiteralText`).

In flight on branch `kindid-link-stamping`: a single walker,
`canonicalizeRuleLiterals` (`packages/codegen/src/compiler/link.ts`, exported
for direct unit testing), called from `canonicalizeCatalogLiteralRefs`/
`...InMap` inside `link()`, stamps every value-bearing leaf in one pass
(anchor by symbol name, not line number — both shift as the surrounding
`link()` grows):

- `SYMBOL` → `kindId` (by `name`, always) and `aliasedFromId` (by
  `aliasedFrom`, only when present — no fallback between the two; a consumer
  needing the effective storage identity computes `aliasedFromId ?? kindId`
  itself).
- `STRING` / fixed-literal `PATTERN` → `resolvedKindId` (literal-text lookup,
  anon-token-first).
- Stamping is suppressed inside `TOKEN` bodies (their inner strings are
  lexeme fragments, not separate anon tokens — a miss there is meaningless).
- Unstamped leaves collect into `KindIdStampMisses` and surface as
  `kindid-unstamped-symbols` / `kindid-unstamped-literals` diagnostics inside
  `link()`, persisted to `grammar-diagnostics.json` via
  `collectGrammarDiagnosticsForGrammar`/`run-codegen.ts`. Current persisted
  counts (all three grammars regenerated): typescript 55 unstamped symbols +
  18 unstamped literals, rust 42 + 5, python 17 + 14 (the ratchet test reads
  whichever counts exist at check time, so these move as later phases land).
- `packages/codegen/src/__tests__/phantom-kind-ratchet.test.ts` imports the
  generated consts and asserts counts stay at or below the audited ceilings.

Types added: `StringRule.resolvedKindId`, `PatternRule.resolvedKindId`,
`SymbolRule.kindId`/`.aliasedFromId` (`packages/codegen/src/types/rule.ts`).

**Remaining before Phase 0 is closeable:** verify byte-identical regen across
all three grammars with `pnpm run validate:native`, run the full suite, and
commit. (Tracked by the in-flight session; this plan assumes it lands before
Phase 1 starts, but Phase 1's diffs are additive to it either way.)

## Phase 1 — flip consumers to stamp-reads

**Goal:** every site that currently re-derives a kindId from a name or
literal text at collect-slots/assemble/emit time instead reads the Phase-0
stamp. No behavior change — this phase is a pure simplification gated on
byte-identical output.

**Tasks:**

1. `deriveValuesForRule` (`packages/codegen/src/compiler/model/node-map.ts:1062+`):
   - `SYMBOL` case (`:1068-1125`): both branches (`rule.literal !== undefined`
     link-minted-literal arm, and the plain ref arm) already call
     `findEntryForLiteralText`/`findEntryForKindName` against
     `ctx?.kindEntries`. Replace with reads of `rule.kindId` /
     `rule.aliasedFromId` off the leaf (`SymbolRule` carries this pair, not
     `resolvedKindId` — that field lives on `StringRule`/`PatternRule` only,
     see the STRING/PATTERN bullet below); the output `NodeOrTerminal`'s own
     `storageKindId` becomes `rule.aliasedFromId ?? rule.kindId` (the
     effective storage identity) and its `parseKindId` becomes `rule.kindId`
     directly. Keep `ctx.kindEntries` only as a hard-assert fallback during
     migration (should never fire once Phase 0 is closed for a grammar).
   - `SUPERTYPE` case (`:1126-1145`): **no existing stamp to read** —
     `canonicalizeRuleLiterals` has no `SUPERTYPE` arm today, so this case
     still does a `findEntryForKindName` call per `subtypes` member on every
     `deriveValuesForRule` invocation. Decide here: add a `SUPERTYPE` case to
     `canonicalizeRuleLiterals` that stamps `subtypeKindIds?:
     Readonly<Record<string, number>>` / `subtypeAliasedFromIds?:
     Readonly<Record<string, number>>` (mirroring the `SYMBOL` pair, keyed by
     `subtypes`/`subtypeParseNames`), then have this case read the maps. This
     is new stamping surface, not a pure read-flip — treat it as its own
     sub-gate within Phase 1.
   - `STRING`/`PATTERN` case (`:1146-1165`): same flip, `rule.resolvedKindId`.
2. `AssembledKeyword`/`AssembledToken` constructors
   (`node-map.ts:2322-2336`, `:2363-2372`): the constructor-time
   `findEntryForLiteralText(opts?.kindEntries ?? [], rule.value)` call is now
   redundant with `rule.resolvedKindId` (Phase 0, subsumes commit
   `382907756`'s own construction-time lookup). Read the stamp; keep
   `kindEntries` param only until every StringRule reaching these
   constructors is guaranteed post-link (assert if `rule.resolvedKindId` is
   undefined but a catalog entry exists for `rule.value` — that's a stamping
   bug, not an expected miss).
3. Emit-time chains, `packages/codegen/src/emitters/render-module.ts`:
   - `resolveLiteralKindId` (`:2623-2649`) and `resolveAcceptedTransportIds`
     (`:2424-2453`) already have stamp fast paths
     (`literal.resolvedKindId !== undefined` / `stampedIds !== undefined`) —
     the Phase-0/K3-era partial flip. Their fallback chains (`byText`/`byKind`,
     the `parseAliases`/`parseName` name-derived path, and the fixed-literal
     fallback for `_semicolon`-class phantom patterns) stay in place this
     phase: they're still load-bearing for the S1/S5 phantom classes Phases
     2-3 haven't routed through the catalog yet. Add coverage assertions that
     the fast path is reached for every stamped leaf; track fallback deletion
     as a Phase 5 follow-up, not here.

**Verification gate:** `pnpm run validate:native` byte-identical regen (manifest
`source_hash`-only diff) for all three grammars; targeted vitest for
`node-map.ts`/`render-module.ts`; full `pnpm test`. No parser change is
possible in this phase (pure read-flip + one new stamp), so any diff is a
found bug, not an expected shift.

**Risk:** the `SUPERTYPE` stamping sub-task is new surface inside a
"consumer flip" phase — if it proves non-trivial (e.g. `subtypeParseNames`
isn't populated at the point `canonicalizeRuleLiterals` runs), split it into
its own follow-up PR rather than blocking the rest of Phase 1's flip.

## Phase 2 — catalog-first anonymous-node naming (S5, 94 phantoms)

**Goal:** `collectAnonymousNodes` (`packages/codegen/src/compiler/assemble.ts:1104-1146`)
keys anon nodes by catalog name instead of raw literal text, killing the
largest phantom class (`AssembledKeyword`/`AssembledToken` for OPERATORS
entries that already have ids under sanitized names — `comma`, `pipe_pipe`
— or that dedupe into a named symbol — `mut` → `sym_mutable_specifier`).

**Tasks:**

- In `collectAnonymousNodes`'s `walkForStrings`, before minting an
  `AssembledKeyword`/`AssembledToken` keyed on raw text, resolve the literal
  through `findGeneratedKindEntry` (already imported/used nearby per the
  file's own header comment at `assemble.ts:1104-1105`) and key by the
  catalog row's kind name when one exists. Raw-text keying remains the
  fallback, now paired with a diagnostic (reuse the `kindid-unstamped-*`
  shape or a sibling code — team's call, but keep it in the same
  `grammar-diagnostics.json` stream so the ratchet test sees it).
- Grep every downstream consumer that currently depends on the OLD raw-text
  key before flipping: `node-model.json5` entries, wrap-membership sets,
  anything keyed off `AssembledKeyword.kind`/`AssembledToken.kind` for this
  class. This is naming-domain surgery — a consumer keyed on the literal
  spelling will silently stop matching if only the producer changes.

**Verification gate:** phantom-kind ratchet drops by ~94 (rust ~38, ts ~32,
py ~24 per the audited split); `generated.manifest.json` / `.sittir/src/*`
diffs reviewed per grammar (names change from raw text to sanitized —
expected, not a regression); `validate:native` unchanged; full suite green.

**Risk:** zero parser impact by construction (tree-sitter already emits
these nodes under their real symbols — this is bookkeeping-only, not a
grammar change), so the main risk is a missed consumer of the old raw-text
key, not a parse regression.

## Phase 3 — pre-generate synthesis routing (S1, 39 phantoms)

**Goal:** `synthesizeFieldEnumRules` (`evaluate.ts:734+`) mints
`_<parent>_<field>`/`_<field>` rules — including the `_<kw>_marker` kinds
enrich's field names induce — as a post-generate evaluate pass today, so
tree-sitter never sees them and they get no symbol. Move the canonical-name
computation and rule registration into the DSL layer that runs in **both**
tree-sitter-CLI-runtime and sittir-pipeline executions, the same placement
`enrich()`'s clause-hoist already has.

**Correction to the audited precedent:** the "S3 auto-group deposits"
precedent cites `dsl/wire/auto-groups.ts` and `applyAutoGroups` running
pre-generate — that file/function no longer exists. It was **physically
retired** (`wire.ts:438-444`: "Auto-group-synthesis — `applyAutoGroups` —
was retired physically in auto-group-visibility Chunk 3 / PR-M φ2 Phase B")
and superseded by `enrich()`'s clause-hoist (`enrich.ts:1464`
`applyClauseHoist`, minting `_<parent>_optionalN` names via
`clauseHoistSynthName` directly into `base.grammar.rules` before `grammar()`
returns — genuinely pre-generate, in the DSL, reaching both executions).
**Use `applyClauseHoist`/`enrich.ts` as the precedent, not a retired file.**
The evaluate-side dual registration at `evaluate.ts:1636-1706`
(`applyVisibleExternalsRewrite`, `injectSyntheticRules`, consuming
`wireCtx.groups`/`wireCtx.visibleExternals`) is a second, still-live example
of "wire mints, evaluate deposits" (S3/S4) and remains a useful risk
reference, but it's not the model to copy for S1 — S1 has no wire-side
counterpart to deposit from; it must mint natively in the DSL layer.

**Tasks, per grammar, smallest phantom count first (python 5, rust 12,
typescript 22):**

1. Port the canonical-naming machinery (`fallbackName`, `deriveCandidateName`,
   `claimUniqueEnumName`, `collectFieldEnumOccurrences`,
   `collectConflictingFieldEnumSites` — `evaluate.ts:886-961` and neighbors)
   to operate over `base.grammar.rules` at DSL-finalization time instead of
   `ctx.rules` at evaluate time. `deriveCandidateName`'s priority-1 match
   (`fieldNameMatchesGrammarRule`) and priority-2 fallback both need whatever
   equivalent rule-lookup exists on the wire/DSL side — audit before porting,
   don't assume `ctx.rules`'s shape is available verbatim.
2. Register the minted rules into `base.grammar.rules` so both the
   tree-sitter-CLI execution (→ `grammar.js` → real parser symbol) and the
   sittir evaluate execution see them, per the spec's "same placement enrich
   already has."
3. Determinism: per the spec's constraint, the pass must sort where ordering
   is not semantic — `grammar.js`'s known per-run reorder nondeterminism
   (`[[project_grammar_js_nondeterministic_reorder]]`-class issue) is a live
   caution here, not a hypothetical.
4. `synthesizeFieldEnumRules` becomes assert-only in evaluate: it checks the
   rule already exists (minted by the DSL pass) and mints nothing; a
   synthesis that still fires is now a bug the assertion catches, per the
   spec's "Evaluate's post-pass synthesis functions become verification-only."

**Verification gate, per grammar (in order, stop-the-line on any failure):**

1. `.sittir/src/node-types.json` diff review (new named node expected, no
   unrelated shape change).
2. Corpus reparse / parse-fixture byte-identity (the hidden-symbol elision +
   field-propagation-through-hidden-rule behavior the spec describes as
   parse-invariant — confirm, don't assume).
3. `pnpm run validate:native` (regen + native build + read-render-parse).
4. Phantom-kind ratchet count drops by this grammar's share.
5. LR-state-shift watch: this is the field-promotion LR-divergence failure
   mode from `[[feedback_synthesized_field_inline_for_lr_precedence]]` — a
   new non-inlined hidden symbol can shift LR states even when the CST shape
   is unchanged. Treat any tree-sitter conflict/state-count change as a
   failure requiring triage, not just a diff to eyeball.

**Risk / rollback:** one synthesis source, one grammar, one commit — revert
is a single-commit `git revert` per the gate structure above. Do not batch
multiple grammars' migrations into one commit; the LR-shift risk is
grammar-specific and a rust regression must not block python landing.

## Phase 4 — prune dead surface + model-only flags (S7 + S6, 20 phantoms)

**Goal:** the two zero-symbol classes that are not phantoms-to-fix but
principled exclusions the diagnostic must stop flagging as unresolved.

**Tasks:**

- **S7 (15: ts jsx family + `field_definition`, rust `comment`/`_in_path`,
  python 0)** — VAPORIZED: present in `grammar.json`, no parser symbol,
  mostly unreachable jsx in the non-tsx dialect. Add reachability pruning:
  detect kinds whose templates/kind-list entries can never parse (dead
  surface) and either drop the emitted surface or flag it as an accepted
  exclusion in the same diagnostic stream Phase 0 established, rather than
  counting it against the ratchet.
- **S6 (5: rust `_reserved_identifier`; ts `_jsx_start_opening_element`,
  `_semicolon`; py `_suite`, `keyword_identifier`)** — grammar `inline:`
  array members. Tree-sitter deliberately issues no symbol here — this is
  not a bug. Add an explicit model-only flag (distinct from `hidden`) so
  these kinds are never id-routed and never show up in the "unstamped"
  diagnostic as if they were missing something. `_semicolon` is load-bearing
  TS-side (per the spec's cross-cutting note) — verify the flag change
  doesn't touch its existing consumers, only the diagnostic classification.

**Verification gate:** ratchet reaches its inline-only floor (5, the S6
count) plus whatever S7 pruning leaves as accepted-exclusion rows; no
factory/type surface breaks — specifically confirm `_semicolon`'s TS-side
consumers (`from.ts`) are unaffected; full suite green.

## Phase 5 — tighten

**Goal:** convert the migration-era conservatism into permanent gates.

**Tasks:**

- Ratchet ceilings (`phantom-kind-ratchet.test.ts`) drop from "may only
  shrink from 155" (the first-committed baseline — see the spec's
  source-inventory note) to exact floors per grammar (ideally 0 non-excluded,
  plus the principled `inline:`/VAPORIZED-accepted counts from Phase 4).
- `kindid-unstamped-*` diagnostics promoted from `info` to `warn`/fail for
  every class not on the accepted-exclusion list — the spec's "compile
  fails loudly... instead of deferring the gap to a native 'unknown kind
  id' render error."
- Delete the now-dead fallback chains flagged (not removed) in Phase 1:
  `resolveLiteralKindId`'s `byText`/`byKind` chain and
  `resolveAcceptedTransportIds`'s `parseAliases`/fixed-literal fallback in
  `render-module.ts`, once Phases 2-4 have routed every leaf that fed them —
  replace with a hard assert on stamp presence.
- S2/S3/S4 divergence assertions: `synthesizeInlineAliasSources`
  (`evaluate.ts:647`), auto-group deposits, and body-pattern
  group/`renderAs`/`visibleExternals` injection (`evaluate.ts:1296-1311`,
  `:1205-1258`) are 0-phantom today but dual-execution risk sites — add an
  assertion that the evaluate-side deposit and the wire-side mint agree
  (same rule set), so a future desugar divergence at these sites fails the
  build instead of silently minting a new phantom.

## Dependency / sequencing summary

| Phase | Depends on | Phantom count killed | Parser change? | Gate |
|---|---|---|---|---|
| 0 — link stamping + diagnostic | — (in flight) | 0 (infra only) | No | byte-identical regen, ratchet test exists |
| 1 — consumer flip | Phase 0 closed | 0 (infra only) | No | byte-identical regen + full suite |
| 2 — catalog-first anon naming (S5) | Phase 0 (stamps exist to key against) | ~94 | No | ratchet drop, manifest diff review, `validate:native` |
| 3 — pre-generate synthesis routing (S1) | Phase 2 (cleaner catalog to route into); per-grammar, smallest-first | 39 | Yes (new symbols) — LR-shift risk | node-types.json diff, corpus reparse, `validate:native`, ratchet drop, LR watch — per grammar, per source |
| 4 — prune + model-only flags (S7/S6) | Phase 3 (ratchet mostly clean, easier to see the remainder) | 20 | No | ratchet floor, `_semicolon` consumer check |
| 5 — tighten | Phases 1-4 all landed | 0 (converts warnings to gates) | No | exact-floor ratchet, promoted diagnostic severity, dead-code deletion diff |

Phases 2 and 3 are independently revertible per-grammar/per-source; Phase 1
and Phase 5 are repo-wide mechanical passes with no parser surface change,
so they carry the lowest risk and the simplest rollback (single revert).
Phase 3 carries the only real parse-behavior risk in the program (LR state
shifts) and is gated accordingly — do not compress its per-grammar,
per-source sequencing to save time.
