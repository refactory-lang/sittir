# Tasks: SCM Role Extraction & Trivia

**Input**: Design documents from `/specs/023-scm-role-extraction/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup

- [X] T001 Create `packages/codegen/src/scm/` directory for SCM parser module

---

## Phase 2: Foundational — SCM parser + extraction (US1+US2 prerequisite)

- [X] T002 Implement SCM query parser subset in `packages/codegen/src/scm/parse.ts` — parse S-expression patterns `(kind_name child*)` with `@capture` annotations. Handle nested patterns `(parent (child)) @capture.sub`. Skip predicates (`#match?`, `#eq?`). Return array of `{ kindName: string; captureName: string }`.
- [X] T003 Implement `; inherits:` directive parser in `packages/codegen/src/scm/parse.ts` — detect `; inherits: language` comments and return the parent language name (needed for TypeScript → JavaScript chain).
- [X] T004 Implement role extractor in `packages/codegen/src/scm/extract-roles.ts` — given parsed captures, filter `@comment` and `@comment.*`, return `TriviaRoleMap { grammar: string; triviaKinds: string[] }`. Follow `; inherits:` chains by loading parent grammar's `highlights.scm`.
- [X] T005 Write unit tests in `packages/codegen/src/__tests__/scm-trivia.test.ts` — test parse, inherits detection, and role extraction against all three grammars (rust, typescript/javascript, python). Also test: missing `highlights.scm` returns empty `triviaKinds` and emits a diagnostic warning.

---

## Phase 3: US1 — Functional $trivia() (Priority: P1)

**Goal**: `.$trivia(comment)` attaches leading/trailing comments and render includes them.

- [ ] T006 [US1] Add `NodeTrivia` type to `packages/types/src/core-types.ts` — `{ leading?: AnyNodeData[]; trailing?: AnyNodeData[] }`. Add optional `$trivia?: NodeTrivia` to `AnyNodeData`.
- [ ] T007 [US1] Replace `$trivia()` stub in `packages/codegen/src/emitters/client-utils.ts` — emit functional implementation in `withMethods<T>` that accepts rest args (leading shorthand) or object form `{ leading, trailing }`, sets `$trivia` on the node, and returns `this`.
- [ ] T008 [US1] Add trivia render wrapper in `packages/core/src/render.ts` — when `node.$trivia` is present, prepend each `leading` item's rendered text (with newline) before the node's output, append each `trailing` item's rendered text after.
- [ ] T009 [US1] Regenerate all three grammars (`npx tsx packages/codegen/src/cli.ts --grammar {rust,typescript,python} --all`) and verify `$trivia()` is functional in `packages/codegen/src/__tests__/scm-trivia.test.ts`: `ir.functionItem.from({ name: 'main' }).$trivia(ir.lineComment('// hello')).$render()` produces output with the comment above the function.
- [ ] T010 [US1] Write integration test in `packages/codegen/src/__tests__/scm-trivia.test.ts` — test leading, trailing, and both-side trivia rendering via the Rust grammar's `ir` namespace. Also test: (a) multiple `$trivia()` calls → last wins (overwrite, not append), (b) `$with` rebuild drops trivia (not carried over), (c) `readTreeNode(parsedTree).$trivia(comment).$render()` renders original source plus comment.

---

## Phase 4: US2 — Discover trivia kinds from SCM (Priority: P1)

**Goal**: Codegen auto-discovers trivia kinds per grammar from `highlights.scm`.

- [ ] T011 [US2] Locate `highlights.scm` per grammar in `packages/codegen/src/scm/extract-roles.ts` — resolve path from the grammar's npm package (`tree-sitter-{lang}/queries/highlights.scm`). Handle TypeScript's JavaScript inheritance via `; inherits:` directive.
- [ ] T012 [US2] Wire SCM extraction into `packages/codegen/src/compiler/generate.ts` — call `extractTriviaRoles(grammar)` during the generate pipeline, pass discovered `triviaKinds` to emitters via config.
- [ ] T013 [US2] Verify all three grammars produce correct trivia kinds: rust → `[line_comment, block_comment]`, typescript → `[comment]`, python → `[comment]`.

---

## Phase 5: US3 — Typed trivia per grammar (Priority: P2)

**Goal**: `$trivia()` signature is narrowed to grammar-specific trivia kinds.

- [ ] T014 [US3] Emit typed `$trivia()` in `packages/codegen/src/emitters/client-utils.ts` — when `triviaKinds` is available, generate a per-grammar `$trivia()` overload accepting only `(T.LineComment | T.BlockComment)[]` (rust) or `T.Comment[]` (typescript/python) instead of `AnyNodeData[]`.
- [ ] T015 [US3] Regenerate all grammars and verify type-check: `.$trivia(ir.identifier('x'))` produces a compile error in `@sittir/rust`.

---

## Phase 6: US4 — Rust native render trivia (Priority: P2)

**Goal**: Native Rust render engine handles `$trivia` identically to TS.

- [X] T016 [P] [US4] Add `NodeTrivia` Rust type in `rust/crates/sittir-core/src/types.rs` — `pub struct NodeTrivia { pub leading: Option<Vec<NodeData>>, pub trailing: Option<Vec<NodeData>> }`. Add `#[serde(rename = "$triviaData")]` to NodeData transport.
- [X] T017 [P] [US4] Add trivia render support in `rust/crates/sittir-core/src/` — when `$triviaData` present on transport, prepend leading / append trailing rendered text. Unit tests in engine.rs verify leading, trailing, both, multiple items, and empty cases.
- [X] T018 [US4] Verify TS and Rust render parity for trivia nodes — unit tests added to engine.rs (T017). Full end-to-end parity fixture deferred until TS-side emits trivia-bearing fixtures (depends on T006-T010 completion).

---

## Phase 7: Polish (Phase 1)

- [X] T019 Run full validator suite and report per-grammar counts — all counts hold at baseline.
- [X] T020 Type-check all 6 packages — zero errors.
- [X] T021 Update CLAUDE.md if any new conventions emerged — no new conventions needed.

---

## Phase 8: US5 — General role extraction (Priority: P1)

**Goal**: Extract all semantic roles from `highlights.scm` + `tags.scm`.

- [ ] T022 [US5] Add `Role` type and `GrammarRoles` interface to `packages/codegen/src/scm/extract-roles.ts` — role enum covering trivia, string, number, boolean, type, variable, function, definition.*, reference.*. Add `CAPTURE_TO_ROLE` mapping table.
- [ ] T023 [US5] Implement `extractGrammarRoles(grammar)` in `packages/codegen/src/scm/extract-roles.ts` — reads both `highlights.scm` AND `tags.scm`, matches captures against mapping table, returns `GrammarRoles` with all discovered role→kinds mappings. Refactor `extractTriviaRoles` as thin wrapper.
- [ ] T024 [US5] Add `tags.scm` reading support — locate `tags.scm` in grammar package alongside `highlights.scm`, follow inheritance chains for both files.
- [ ] T025 [US5] Implement cross-grammar diagnostic `printRoleDiagnostic()` — runs extraction on all three grammars and prints a table of role→kinds per grammar.
- [ ] T026 [US5] Write tests in `packages/codegen/src/__tests__/scm-roles.test.ts` — test role extraction for string, number, type, definition.function, definition.class across all three grammars. Test backward compat of `extractTriviaRoles`.

---

## Phase 9: US6 — `ir.from.*` canonical factories (Priority: P1)

**Goal**: Grammar-agnostic canonical factory namespace.

- [ ] T027 [US6] Wire `extractGrammarRoles` into `packages/codegen/src/compiler/generate.ts` — pass full `GrammarRoles` to the ir emitter.
- [ ] T028 [US6] Emit `ir.from` namespace in `packages/codegen/src/emitters/ir.ts` — for each leaf-shaped role with discovered kinds, emit a canonical factory function with the appropriate discriminator (boolean-value, number-type, comment-prefix, or none).
- [ ] T029 [P] [US6] Emit typed return types for `ir.from.*` — each function returns a grammar-specific union of the role's kinds (e.g., `T.IntegerLiteral | T.FloatLiteral` for number).
- [ ] T030 [US6] Regenerate all three grammars and verify `ir.from.boolean(true).$render()` produces `true`, `ir.from.number(42).$render()` produces `42`, `ir.from.string("hello").$render()` produces `hello`.
- [ ] T031 [US6] Write integration tests in `packages/codegen/src/__tests__/scm-roles.test.ts` — test `ir.from.*` for boolean, number, string, comment, type, identifier across all three grammars.

---

## Phase 10: Polish (Phase 2)

- [ ] T032 Run full validator suite — counts must hold or improve.
- [ ] T033 Type-check all 6 packages — zero errors.
- [ ] T034 Verify `ir.from.*` is tree-shakeable — each function is a named export, not a monolithic object.

---

## Dependencies

```
Phase 1 (shipped):
T002 → T004 → T011 (SCM parser → extractor → generate pipeline)
T006 → T007 → T008 → T009 (type → method → render → verify)

Phase 2:
T022 → T023 → T027 (Role type → extraction → generate wire)
T024 → T023 (tags.scm → extraction)
T027 → T028 → T030 (generate wire → ir.from emission → verify)
T029 parallel with T028 (return types alongside emission)
```

## Implementation Strategy

**Phase 1 (shipped)**: T001–T021. Functional `$trivia()` + SCM extraction + typed signatures + Rust parity + emit.ts.

**Phase 2 (in progress)**: T022–T034. General role extraction + `ir.from.*` canonical surface. ~300 lines.

**Suggested parallel execution**:
- T028 + T029 (ir.from emission + typed return types — same file, different concerns)
- T025 can run independently (diagnostic is developer tool)
