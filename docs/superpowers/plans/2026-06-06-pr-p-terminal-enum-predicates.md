# PR-P Implementation Plan — Terminal + Enum (flat) → predicates; TerminalValue→NodeRef unification

> **For agentic workers:** execute via `sittir-codegen`, gating on RELEASE `validate:native` AND `cargo check --workspace --features napi-bindings` after every task (PR-P is rust-emitting). Spec: `docs/superpowers/specs/2026-05-22-compiler-simplification-design.md` line 1525 (§G-cut, #16/#1/#18). Steps use `- [ ]`.

**Goal:** Cut the two content-classification Rule types (`TerminalRule`, `EnumRule`) + dissolve the `TerminalValue` half of the slot-value union into `NodeRef`, so the end-state `Rule` union + slot-value model are purely structural. Fixes terminal→`'content'` slot-naming at the source.

**Architecture:** Three independent cuts, ordered safest→riskiest, each its own gated commit: (3) flat-Enum predicate, (1) Terminal clean cut, (2) TerminalValue→NodeRef value unification. Parts 1 & 3 are "byte-identical to today" (the rule-type wrappers were transparent / a flat all-string test). Part 2 is the value-model change that touches ~8 emitters + rust.

**Tech stack:** TS codegen (`packages/codegen/src/{compiler,emitters}`), rust render/transport crates, `validate:native` gate.

**Gate (every task):** RELEASE deep-AST `read-render-parseAstMatchPass` HOLD at floor **rust 111 / ts 69 / py 74** (`env -u SITTIR_NATIVE_DEBUG pnpm validate:native`) + `cargo check --workspace --features napi-bindings` green + re-count (the SubagentStop gate no-ops after regen — cargo-verify is manual, `feedback_verify_cargo_not_gate`).

---

## ⚠️ Line-drift caveat (reconcile at execution)
The spec's `file:line` refs predate **PR-H** (`optimize.ts`→`normalize.ts`, commit on master) and later edits. Every site below is pinned by SYMBOL; re-locate with `rg`/LSP before editing — do NOT trust the absolute line numbers. Known renames: `optimize.ts`→`normalize.ts`; the `node`→`kind` value-ref rename (Part 2) goes through **LSP/copilot** (`feedback_use_ts_lsp_for_moves`), not hand-edits.

## STATUS (2026-06-07)
- **Task 0** ✅ — baseline confirmed **rust 111 / ts 69 / py 74**, cargo GREEN.
- **Task 1** ✅ `9b5f0621` — `EnumRule`→`ChoiceRule` collapse via `isEnumChoiceRule` predicate (assemble-time). NOTE: also reclassified ts `predefined_type` `pattern`→`enum` (the flat enum predicate now wins precedence) — gate-neutral, accepted; this is **PR-Q's entire ts deliverable** (`widening delta rust 0/ts 1/py 0`) folded in early, so PR-Q shrinks.
- **Task 2** ✅ `3996b317` — terminal classify-by-shape; deleted `TerminalRule`/`isTerminal`/`promoteAndLogTerminalRules` + transparent `case TERMINAL` arms. BYTE-IDENTICAL (regen no-change all 3). Gate 111/69/74, cargo green. (Salvaged + re-verified after the Task-2 agent process crashed mid-task — clean regen + full gate confirmed completeness.)
- **Task 3** ⬜ — `TerminalValue`→`NodeRef` value unification (the riskiest: behavioral `'content'` source-fix may rename slots; `node`→`kind` rename via LSP; ~8 emitters + rust). NOT started.

## Task 0 — Baseline (MUST run first)
- [ ] Clean tree (`git status` only untracked). `env -u SITTIR_NATIVE_DEBUG pnpm validate:native`; record deep-AST per grammar from `packages/validator/validation-history.jsonl` (camelCase key `readRenderParseAstMatchPass`). Confirm **111/69/74**; if different, re-baseline the HOLD targets.
- [ ] `cargo check --workspace --features napi-bindings` green at baseline.
- [ ] `rg -n 'isEnumLeaf|isEnumShaped|classifyTerminalFallback|isTerminalShaped' packages/codegen/src` — capture which helper names already exist (the spec assumes some; create only the missing).

## Task 1 — Part 3: flat-Enum → predicate (safest, byte-identical)
**Files (re-locate by symbol):** `compiler/rule.ts` (`EnumRule`, `isEnum`), `compiler/evaluate.ts` (`EnumRule` emission ~`:268`), `compiler/link.ts` (`classifyHiddenChoiceRule` enum branch ~`:1981`), `compiler/node-map.ts` (`AssembledEnum` classify site), the `case 'enum'`/`ENUM` arms across compiler+emitters, `normalizeEnumMembers`.

- [ ] **Find the assemble-time classify point.** `AssembledEnum` is constructed where a rule is classified as enum. Add a FLAT predicate `isEnumLeaf(member)` (single-literal `StringRule`/anon token) and classify via `choice && members.every(isEnumLeaf)` → `AssembledEnum` at Assemble. This must reproduce the EXACT set the old `EnumRule`/`classifyHiddenChoiceRule` produced (flat, no recursion — recursion is PR-Q).
- [ ] `normalizeEnumMembers`: keep ONLY the single-literal→`StringRule` normalization; drop the `EnumRule` synthesis path.
- [ ] `evaluate.ts`: stop emitting `EnumRule`. `link.ts`: delete the enum branch of `classifyHiddenChoiceRule`.
- [ ] Delete `EnumRule` interface + `isEnum` + the `case ENUM`/`'enum'` rule-type arms that are now unreachable (compiler + emitters: `ir.ts`, `types.ts`, `from.ts`, `wrap.ts`, `test.ts`, `shared.ts`, `consts.ts` — `modelType === 'enum'` on the ASSEMBLED node stays; only the RULE-type `EnumRule` arms go).
- [ ] **Verify byte-identical:** regen all 3; `git diff --stat packages/*/src packages/*/templates rust/crates/*/templates rust/crates/*/src` — the classified-enum set must be unchanged (transport enums read `AssembledEnum`, untouched). `pnpm -r typecheck`.
- [ ] **Gate:** `validate:native` HOLD 111/69/74 + cargo green. Commit `feat(rule): PR-P §G — flat-enum classify at assemble, delete EnumRule`.

## Task 2 — Part 1: Terminal clean cut (byte-identical; the wrapper was transparent)
**Files:** `compiler/rule.ts` (`TerminalRule`, `isTerminal`, the `case TERMINAL` arms ~`:485/556/925`), `compiler/link.ts` (`promoteAndLogTerminalRules` ~`:389`, `isTerminalShaped` reconcile ~`:1663`), `compiler/wrapper-deletion.ts` (transparent `case 'terminal'` ~`:155`), `compiler/simplify.ts` (transparent arms ~`:404/734/1159/1222`), `compiler/normalize.ts` (was `optimize.ts:484/546/718`), `compiler/assemble.ts` (`isTerminalShaped` ~`:1561`, the `:1549` throw→normal path), `emitters/templates.ts` (~`:605`).

- [ ] Add/centralize `isTerminalShaped(rule)` (reconcile the two sites `link.ts` + `assemble.ts`). Make `classifyTerminalFallback` the PRIMARY classify path; the `assemble.ts` "no classifier matched" throw becomes the normal terminal path.
- [ ] Delete `promoteAndLogTerminalRules` (terminals are no longer a promoted Rule type — they classify by shape at Assemble).
- [ ] Delete the transparent `case 'terminal'`/`case TERMINAL` arms (wrapper-deletion, simplify, normalize, rule.ts, templates) — they were pass-throughs, so deletion is byte-neutral. `AssembledPattern` narrows to `PatternRule` + natural subtree.
- [ ] Delete `TerminalRule` interface + `isTerminal`.
- [ ] **Verify byte-identical** (regen-diff empty for source/templates; manifests source_hash-only). `pnpm -r typecheck`.
- [ ] **Gate:** `validate:native` HOLD + cargo green. Commit `feat(rule): PR-P §G — terminal classify-by-shape, delete TerminalRule`.

## Task 3 — Part 2: TerminalValue → NodeRef value unification (the riskiest; touches all emitters + rust)
**Files:** `compiler/node-map.ts` (`TerminalValue`, `NodeOrTerminal`, `isTerminalValue`, `isNodeRef`, `NodeRef.node`, `deriveValuesForRule` literal case), every emitter reading the value union (`consts`, `factories`, `from`, `ir`, `types`, `wrap`, `shared`, `test`, `node-model`, `render-module`), rust transport/render.

- [ ] **Materialize literals as kinds.** Each literal in a slot's `values` becomes a `NodeRef` to a catalog-only literal-kind (`parser.c` name + render value on the kind entry — every literal is a kind, #18/§4g). Confirm the literal-kind catalog entries exist (kindId-bearing); if a literal lacks a kind entry, that's a §4g prerequisite — surface, don't invent a table.
- [ ] `deriveValuesForRule` literal case: emit a `NodeRef` (parseKind = the literal-kind, multiplicity/separator/immediate/tokenized carried onto the NodeRef) instead of a `TerminalValue`.
- [ ] Collapse the union: `NodeOrTerminal[]` → `NodeRef[]`. Delete `TerminalValue` interface, `isTerminalValue`, the literal-arm fork (§4d/§4f — a literal-arm is now just a `NodeRef`).
- [ ] Remove the vestigial `kind:'node-ref'` discriminant + `isNodeRef` (no union left). **Rename the render/source ref `NodeRef.node`→`kind` via LSP/copilot** (`feedback_use_ts_lsp_for_moves`) — it takes the freed name, makes spec-wide `value.kind` literal, resolves the §7.3 collision by elimination.
- [ ] Migrate every emitter `isTerminalValue(...)`/`v.value`/`v.node` read to the unified `NodeRef`/`v.kind` shape. Render emits a literal-kind ref by its catalog value.
- [ ] **Confirm the `'content'` source-fix:** a terminal's `parseKind` now resolves to its literal-kind name → `storageName` no longer drops to `'content'` merely because a value-list contains a terminal (`'content'` fires only for genuinely-anonymous multi-kind unions, §4c). This may CHANGE some slot names from `'content'` → the literal-kind name — that's the intended fix; classify the regen byte-diff (not assume-empty) and gate on `validate:native` HOLD, allowlisting the known terminal renames (per PR-A's note).
- [ ] **Verify + Gate:** `pnpm -r typecheck`; regen-diff classified; `validate:native` HOLD 111/69/74 (or IMPROVE — the content-fix may recover slots) + cargo green. Commit `feat(model): PR-P — dissolve TerminalValue into NodeRef; value union is NodeRef[]`.

## Task 4 — Close-out
- [ ] Update master plan PR-P row → ✅ DONE (commit refs). Update the design spec status (TerminalRule/EnumRule/TerminalValue cut from the "still present" list at spec ~`:195`).
- [ ] Open PR; note PR-Q (enum recursive-widening) is the gated follow-up (delta rust 0 / ts 1 / py 0).

## Risks
- **Part 2 is the real risk:** the value union is read by ~8 emitters + rust. The `node`→`kind` rename MUST go through LSP (re-exports / type-only imports / `{@link}`). Migrate emitters one at a time under `pnpm -r typecheck` before regen.
- **The `'content'` source-fix is behavioral** — it can rename slots. Gate on AST round-trip (deep-AST), not template byte-identity; allowlist known terminal renames.
- **Literal-kind catalog completeness** (Task 3 step 1): if some literals lack kindId catalog entries, Part 2 is blocked on a §4g prerequisite — surface as a diagnostic, do not invent a fallback table (#3/#18).
