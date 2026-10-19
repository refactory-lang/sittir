# Portable Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline; this repo does code work without subagents). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `createEngine(lang, { api: 'portable' })` gets the language-neutral vocabulary surface the maintainer ruled. `portable.is` and `portable.kinds` live in `@sittir/common/portable`, `rust.is.portable` and `rust.kinds.portable` are those same objects typed for Rust, guards take a node only, and `ofType` accepts a vocabulary kind.

**Architecture:**
- The vocabulary's path list is emitted once into `@sittir/common/portable`. `@sittir/types` stays type-only, and the vocabulary folder reads every top-level file as a vocabulary source.
- `@sittir/common/portable` builds two frozen trees from that list: kinds nodes holding `$path`, and guards.
- A guard reaches the node's engine through `engineOf(node)`. It reads the portable rows that engine loaded with its language (`EngineIdentity.portable`) and decides from `$type`, the node's own read entries and `portablePathHasFacts`.
- Per-language generated `portable.ts` stops building a surface of its own. It exports its rows and the language-typed views of the shared trees.

**Tech Stack:** TypeScript ESM, vitest, the sittir codegen emitters (`packages/codegen/src/emitters`), the native engine for parsed nodes.

**Spec:** the maintainer rulings of 2026-10-05 to 2026-10-17, restated here. No spec document exists. The rulings this plan executes:
- Guards take a node only.
- `portable.kinds` is namespaced like the guards, with `$path`.
- The emitted path list has no Proxy.
- `rust.is.portable` is the same object as `portable.is`.
- `ofType` resolves vocabulary names through the engine's rows.
- `$subType` is gone.
- There are no portable aliases.

## Global Constraints

- Generated outputs (`packages/<lang>/src/*`, `rust/crates/sittir-<lang>/src/*`) are never hand-edited. Change the emitter and regenerate through exec.
- No explanatory comments in `packages/codegen/src`. Document in `docs/glossary/`. Public API declarations (`createEngine`, the engine and descriptor surfaces, exported types) carry JSDoc.
- Importing a descriptor loads no engine, factories, wrap or portable tables. The import-graph test pins that. The path list is not a table and may load.
- Each vocabulary path is named once, by its full path. No short or suffix aliases.
- No Proxy anywhere on the portable surface. A mistyped path reads as `undefined`.
- Guards are called directly. A path segment can shadow `call`, `name` or `bind`.
- Pre-push gate: root `pnpm run type-check` and root `pnpm lint`. The suite runs as its own call with `SITTIR_HISTORY_NO_COMMIT=1`. Validation history goes through exec for every codegen change.

## Review Focus

1. A node of language B passed to a guard typed for language A's vocabulary: it is refused at the type level, and at run time it is classified by B's rows, never A's.
2. A parsed node whose language has no bindings (scm, regex) passed to a portable guard returns `false` and does not throw.
3. A plain object `{ $type: n }` with no engine, and a bare number, are both refused by every portable guard, including paths whose kind set holds `n`.
4. A vocabulary path that no bound grammar reads (no rows anywhere) still exists in `portable.kinds` and `portable.is`; its guard returns `false`.
5. A copied descriptor (`{ ...rust }`): `copy.is.portable === portable.is` still holds, because nothing language-bound sits in the shared tree.

---

## Rulings on the open questions

**Q0 — does node-only cover every `is` guard, or only the portable surface?** Ruled: **only the portable surface.** Kind guards keep refusing ids.

Evidence from master: on the grammar surfaces, a fixed-literal kind's value is its bare id. For example, python has `export type PassStatement = TSKindId.PassStatement` and `SimpleStatement = … | PassStatement | BreakStatement | ContinueStatement | …`, so a slot item typed `SimpleStatement` can be a number.

These supertype sets hold fixed-literal members:

| grammar | supertype sets with fixed-literal members | examples |
|---|---|---|
| rust | 6 of 30 | `expression` ∋ `self`/`()`; `type` ∋ `!`/`()`; `pattern` ∋ `_`/`..`; `statement` ∋ `;` |
| python | 6 of 16 | `simpleStatement` ∋ pass/break/continue; `expression` ∋ True/False/None/`...` |
| typescript | 8 of 24 | `expression` ∋ true/false/null/this/super/undefined |

The supertype or member guard is the only narrowing for such an item. Making it node-only breaks that narrowing and the guard's declared type (`T extends {$type} | number`).

On the portable surface, a fixed-literal leaf's identity is the vocabulary const string, by the 2026-10-05 ruling, so a number never stands for a portable node. The descriptor ruling already accepts that bare ids match no portable guard until arena 3b.

The cost of keeping bare ids on grammar guards: a bare id carries no language, so `inLanguage` passes every number. Task 5 adds one sentence saying so to the `Language.is` JSDoc. Kind guards (`_g`) keep refusing ids, since `x === kinds.X` is the documented test for a fixed-literal leaf.

**Q1 — placement-dependent read entries.** The emitted tables hold 61 entries with a non-empty `within` (rust 55, python 6), plus 1 condition with `up: 1` (python), counted from the runtime rows. Today these are reachable only through the guard's `context` parameter, which node-only removes. They come from seven claims:

| grammar | claim | entries | form (ruled) |
|---|---|---|---|
| rust | a pattern within `closure_parameters` reads as `declaration.parameter` | 35 | an envelope alias at the `closure_parameters` site, one claim on the envelope |
| rust | `function_item` / `function_signature_item` within an impl or trait `declaration_list` reads as `declaration.method` (`.signature`), with each visibility | 19 | the method alias (2026-10-10) |
| rust | `crate` within `visibility_modifier` reads as `modifier.visibility.public.internal` | 1 | an alias, `internal_public_visibility_modifier` (2026-10-10, P2) |
| python | `function_definition` in a class body, directly or decorated, reads as `declaration.method` | 2 | the method alias, five clones (2026-10-10, P1) |
| python | `staticmethod` read through the enclosing `decorated_definition` (within it, and the `up: 1` condition) | 1 | the envelope sets its element's flag (2026-10-10, P4) |
| python | an `identifier` within `parameters` / `lambda_parameters` reads as `declaration.parameter` | 2 | the claims are deleted: an identifier is slotless and reads through its parent's member |
| python | an `identifier` within `type` reads as `identifier.type` | 1 | deleted, as above |

`grammar.bindings.ts` is generated from `bindings.scm` (`bindings-inventory --write`), so the restatement goes in `bindings.scm`, with the aliases in `grammar.sittir.ts`.

Ruled: the residue is restated in its own PR (Task 3b), after the node-only guards and before `ofType`. Until it lands, node-only guards skip placed entries, as a guard given no context does today, so these classifications answer false; a ratchet pins the placed counts (rust 55; python 6 plus 1 `up`), shrink-only. Task 3b ends with the emitter refusing a `within` entry or an `up > 0` condition with a generator diagnostic, gated at 0. Coordinate builds it from the rulings above; its `bindings.scm` and `grammar.sittir.ts` lines go to sittir-design for review, and a probe that moves rows or trees beyond what the 2026-10-10 measurements expected goes back to brainstorm.

**Q2 — typing `rust.is.portable`.** Ruled: one runtime object, typed per language through an interface the codegen emits:
- `PortableIsAt<RustIds>`: each guard is `<T extends RustNode>(node: T) => node is T & { $type: Ids }`.
- A python node passed to `rust.is.portable…` is a type error.
- At run time it is classified by python's rows, which keeps `portable.is` language-neutral, as Review Focus 1 requires.

---

## File structure

| file | responsibility |
|---|---|
| `packages/common/src/portable/vocabulary-paths.ts` (generated, committed) | `export const vocabularyPaths: readonly string[]`, frozen, every vocabulary kind path, one path per line, sorted |
| `packages/codegen/src/bindings/vocabulary-paths.ts` | `emitVocabularyPaths(vocabulary: Vocabulary): string`, the file body above, from `readVocabulary`; `writeVocabularyPaths()` writes it |
| `packages/tools/src/regen.ts` | `regenerateGrammars` calls `writeVocabularyPaths` once per run, before the per-grammar generations (one writer, no race) |
| `packages/common/src/portable/tree.ts` | `portableTrees(paths, guardOf): { kinds; is }`: the two frozen namespaced trees, one shape |
| `packages/common/src/portable/classify.ts` | `classifierOf(rows): (node) => string \| undefined`, read entries tried in order, node-only (moved from `portable.ts`) |
| `packages/common/src/portable/index.ts` | `export const portable: { kinds; is }`, served at the `@sittir/common/portable` export |
| `packages/codegen/src/emitters/overlays/portable/namespaces.ts` | emits per-language rows (`PortableRows`) and the typed views `PortableIsAt<Ids>` and `PortableKindsAt` |
| `packages/common/src/create-engine.ts` | every engine's identity carries `portable: hooks.portable`; the portable engine returns `portable.kinds` and `portable.is` |
| `packages/common/src/query.ts` | `ofType(kind: number \| PortableKind)` |

`packages/common/src/portable.ts` (`portableSurface`) and `portable-path.ts` fold into `portable/`. `PortableGuard`'s `context` parameter and the `$subType` read are removed.

## Stack

1. **PR 1 (Tasks 1–2):** the path list and the shared trees. Nothing reads them yet, and the only generated file is the path list in `packages/common`.
2. **PR 2 (Tasks 3, 4, 5):** rows on the engine, node-only guards, descriptor and engine wiring. This regenerates all five grammars. Placement-dependent classifications answer false until PR 3.
3. **PR 3 (Task 3b):** the placement residue restated as aliases, envelopes and deleted claims; the emitter refuses placement, gated at 0.
4. **PR 4 (Task 6):** `ofType` with a vocabulary kind.

---

### Task 1: Emit the vocabulary path list

**Files:**
- Create: `packages/codegen/src/bindings/vocabulary-paths.ts`
- Create (generated): `packages/common/src/portable/vocabulary-paths.ts`
- Modify: `packages/tools/src/regen.ts` (`regenerateGrammars` writes the list once per run), `packages/tools/src/codegen-surface.ts` (loads the writer)
- Test: `packages/codegen/src/bindings/__tests__/vocabulary-paths.test.ts`

**Interfaces:**
- Consumes: `readVocabulary(dir): Promise<Vocabulary>` (`packages/codegen/src/bindings/vocabulary.ts:144`).
- Produces: `vocabularyPaths: readonly string[]` from `@sittir/common/portable`, `emitVocabularyPaths(vocabulary): string`, and `writeVocabularyPaths(): Promise<void>`.

- [ ] **Step 1:** Write the failing tests.
  - `'lists every vocabulary kind path once, sorted'`: `expect(vocabularyPaths).toEqual([...new Set(pathsOf(await readVocabulary(dir)))].sort())`.
  - `'writes one path per line'`: every path literal in the emitted body sits on its own line, in sorted order.
  - `'the committed file is what the emitter writes'`: `expect(readFileSync(VOCABULARY_PATHS_FILE)).toBe(emitVocabularyPaths(await readVocabulary(dir)))`.
  - `'is frozen'`: `Object.isFrozen(vocabularyPaths)`.
- [ ] **Step 2:** Run `SITTIR_HISTORY_NO_COMMIT=1 pnpm vitest run packages/codegen/src/bindings/__tests__/vocabulary-paths.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3:** Implement `emitVocabularyPaths` and wire it into the regen step that already reads the vocabulary. Add the glossary entry in `docs/glossary/`.
- [ ] **Step 4:** Have exec run the regen, then rerun the tests. Expected: PASS. Only `packages/common/src/portable/vocabulary-paths.ts` is new, and 0 validation rows move.
- [ ] **Step 5:** Pathspec commit.

### Task 2: The shared namespaced trees

**Files:**
- Create: `packages/common/src/portable/tree.ts`, `packages/common/src/portable/index.ts`
- Modify: `packages/common/package.json` (export `./portable`)
- Test: `packages/common/tests/portable-tree.test.ts`

**Interfaces:**
- Consumes: `vocabularyPaths` (Task 1).
- Produces:
  - `portableTrees(paths: readonly string[], guardOf: (path: string) => (node: unknown) => boolean): { kinds: PortableKindTree; is: PortableGuardTree }`.
  - `type PortableKind = { readonly $path: string }`.
  - `portable` from `@sittir/common/portable`.

- [ ] **Step 1:** Write the failing tests.
  - `portable.kinds.declaration.function.$path === 'declaration.function'`.
  - Every node is frozen.
  - `portable.kinds.declaration.nope === undefined`.
  - The trees have the same keys at every level (walk both).
  - `typeof portableTrees(paths, guardOf).is.declaration.function === 'function'`, and `portable` has the key `kinds` only.
  - A path segment named `call` is a guard, not `Function.prototype.call`.
- [ ] **Step 2:** Run the test. Expected: FAIL.
- [ ] **Step 3:** Implement `portableTrees` with `Object.defineProperty` links (the existing `link` loop in `portable.ts`). `index.ts` serves `portable.kinds` only; `portable.is` joins it in Task 4, with the classifier, so no exported guard answers false for want of one.
- [ ] **Step 4:** Run the test. Expected: PASS. Then run the root type-check and lint.
- [ ] **Step 5:** Pathspec commit.

### Task 3: Portable rows on the engine

The guard already reaches the node's engine through `engineOf(node)`, and that engine loaded the rows with its language, so the engine holds them. No side table: the descriptor never imports the rows (they come with `load()`), so the import-graph rule is unaffected.

**Files:**
- Modify: `packages/types/src/portable.ts` (`PortableRows { table: PortableTable; querySlots: QuerySlots }`; `LanguageAPI.portable` becomes `PortableRows`), `packages/types/src/engine-api.ts` (`EngineIdentity.portable?: PortableRows`, engine plumbing like `trivia`), `packages/codegen/src/emitters/overlays/portable/namespaces.ts`, `packages/common/src/create-engine.ts` (both `assembleEngine` and `assemblePortableEngine` put `portable: hooks.portable` in the identity)
- Test: `packages/common/tests/portable-rows.test.ts`, plus the emitter test beside `namespaces.ts`

**Interfaces:**
- Produces: `engineOf(node)?.portable: PortableRows | undefined`, and generated `export const rows: PortableRows` in `packages/<lang>/src/portable.ts`.

- [ ] **Step 1:** Write the failing tests.
  - For a node read by `await createEngine(rust)`, `engineOf(node)?.portable?.table.paths['declaration.function']` is defined.
  - For a node read by an scm engine, `engineOf(node)?.portable` is `undefined`.
- [ ] **Step 2:** Run the test. Expected: FAIL.
- [ ] **Step 3:** Change the emitter to write `rows` and the typed views (`PortableIsAt<Ids>`, `PortableKindsAt`) in place of the `portableSurface(...)` call. Put `hooks.portable` on both engine identities.
- [ ] **Step 4:** Exec regenerates the five grammars. Rerun the tests. Expected: PASS, and 0 validation rows move.
- [ ] **Step 5:** Pathspec commit with the regenerated files.

### Task 3b: Restate the placement residue in bindings

**Files:**
- Modify: `packages/rust/bindings.scm`, `packages/python/bindings.scm`, `packages/rust/grammar.sittir.ts`, `packages/python/grammar.sittir.ts` (the seven claims of Q1, in their ruled forms; `grammar.bindings.ts` regenerates from them), the bindings emitter that writes read entries (it refuses `within` and `up > 0` with a generator diagnostic)
- Test: the emitter test for the new diagnostic; `packages/rust/tests/portable-guards.test.ts` and `packages/python/tests/portable-guards.test.ts` for the restated classifications

- [ ] **Step 1:** Write the failing tests.
  - The emitter given a claim that needs placement reports the placement diagnostic and emits no `within` entry.
  - With rows read node-only, a rust closure parameter still reads as `declaration.parameter`.
  - The python cases read as before: a method in a class body, and a static method. A parameter identifier and a type identifier read through their parent's member; each parent member exists first (one that doesn't is added here).
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Restate each claim in its ruled form (Q1). Send the `bindings.scm` and `grammar.sittir.ts` lines to sittir-design for review before committing. Add the diagnostic to the emitter, gated at 0, and delete the placed-entry ratchet.
- [ ] **Step 4:** Exec regenerates. The emitted tables hold 0 `within` entries and 0 `up > 0` conditions, the classifications above are unchanged, and 0 validation rows move.
- [ ] **Step 5:** Pathspec commit with the regenerated files.

### Task 4: Node-only guards that read the node's language

**Files:**
- Create: `packages/common/src/portable/classify.ts` (moved logic: `placed`/`context` removed, `$subType` removed, numbers refused)
- Modify: `packages/common/src/portable/index.ts` (`guardOf`, and `portable` gains `is`), `packages/types/src/portable.ts` (`PortableGuard` loses `context`)
- Delete: `packages/common/src/portable.ts`; `portable-path.ts` moves to `portable/facts.ts`
- Test: `packages/rust/tests/portable-guards.test.ts`

**Interfaces:**
- Consumes: `EngineIdentity.portable` (Task 3), `engineOf` (`engine-scope.ts`). Placed entries are skipped (Q1); a ratchet test pins their counts per the tables (rust 55; python 6 plus 1 `up`), shrink-only, and `portable.is`'s JSDoc names the classifications that answer false until Task 3b. Keyword leaves read as bare kind ids, which name no engine, so every claim on a fixed-text kind answers false too (ruled: guards stay node-only); the same ratchet test pins those claims per the tables' `fixedText` (rust 67, typescript 37, python 8), shrink-only, and the JSDoc names their classes. `packages/tools/tests/portable/is.test.ts` pins both gaps false.
- Produces: `classifierOf(rows: PortableRows): (node: { $type: number }) => string | undefined`.

- [ ] **Step 1:** Write the failing tests.
  - A rust `function_item` read from a rust engine passes `portable.is.declaration.function`.
  - A python `function_definition` passes the same guard by python's rows.
  - `portable.is.declaration.function(rust.kinds.FunctionItem) === false`.
  - `portable.is.declaration.function({ $type: rust.kinds.FunctionItem }) === false`.
  - A node from an scm engine returns `false` and does not throw.
  - A path with no rows anywhere returns `false`.
  - The guard has `length === 1` (no context parameter).
- [ ] **Step 2:** Run the test. Expected: FAIL.
- [ ] **Step 3:** `guardOf(path)` does the following in order:
  1. Refuse a non-node.
  2. Read `rows = engineOf(node)?.portable`, and refuse if there are none.
  3. Pass when `rows.table.paths[path]?.ids` holds `$type` and the path is `exact`.
  4. Otherwise pass when `portablePathHasFacts(path, classifierOf(rows)(node))`.

  Memoize `classifierOf` per rows object.
- [ ] **Step 4:** Run the tests and the full suite. Expected: PASS.
- [ ] **Step 5:** Pathspec commit.

### Task 5: Descriptor and engine wiring

**Files:**
- Modify: the descriptor emitter (`packages/<lang>/src/descriptor.ts`; `is` gains `portable`, `kinds` gains `portable`), `packages/common/src/create-engine.ts` (`assemblePortableEngine` returns `portable.kinds` and `portable.is`), `packages/types/src/engine-api.ts` (`PortableEngine.kinds` becomes `PortableKindsAt`, plus the `Language.is` JSDoc sentence from Q0), `packages/rust/tests/descriptor.test.ts`
- Test: `packages/rust/tests/descriptor.test.ts`, and the import-graph test

**Interfaces:**
- Consumes: `portable` (Tasks 2 and 4).

- [ ] **Step 1:** Write the failing tests. Replace `'keeps a portable engine own is'` with:
  - `(await createEngine(rust, { api: 'portable' })).is === rust.is.portable`.
  - `rust.is.portable === portable.is`.
  - `rust.kinds.portable === portable.kinds`.
  - `({ ...rust }).is.portable === portable.is`.
  - The import-graph test: importing `@sittir/rust`'s descriptor loads no `portable.ts`.
- [ ] **Step 2:** Run the test. Expected: FAIL.
- [ ] **Step 3:** The descriptor attaches `portable` after `languageGuards` composes, so the shared guards are not language-wrapped. `guardsOf` keeps `portable` when rebinding a copy.
- [ ] **Step 4:** Exec regenerates the five grammars. Rerun the tests and the suite. Then run the type-check, lint and validation history. Expected: PASS, and 0 rows move.
- [ ] **Step 5:** Pathspec commit with the regenerated files.

### Task 6: `ofType` takes a vocabulary kind

**Files:**
- Modify: `packages/common/src/query.ts` (`ofTypeStep`, the declarative compile at :349/:482/:544/:599), `packages/types/src/query.ts:168` (overload `ofType<P extends PortableKind>(kind: P): View<…>`)
- Test: `packages/common/tests/query-portable.test.ts`

**Interfaces:**
- Consumes: `PortableKind` (Task 2), `EngineIdentity.portable` and `classifierOf` (Tasks 3–4).

- [ ] **Step 1:** Write the failing tests.
  - `rs.parse('fn f() {} struct S;').$query().$descendants.ofType(portable.kinds.declaration.function)` yields exactly the `function_item`.
  - The same call on a python root with `def f(): pass` yields the `function_definition`.
  - A non-exact path filters by the classifier.
  - `ofType({ $path: 'nope' })` yields nothing.
  - `ofType('x')` still refuses.
- [ ] **Step 2:** Run the test. Expected: FAIL.
- [ ] **Step 3:** `ofTypeStep` accepts a `PortableKind`. The step resolves `rows.table.paths[$path]` through the root's engine to a kind-id set. A path that isn't `exact` adds a per-node classifier filter. The plan form gains `{ op: 'ofKinds'; kinds: readonly number[]; path?: string }`.
- [ ] **Step 4:** Run the tests and the suite. Expected: PASS.
- [ ] **Step 5:** Pathspec commit.

## Not in this stack

- Portable `parse`, `render`, `build` and `engine.attach` (the PortableEngine JSDoc says these aren't part of it yet).
- The `Flags` enum and `$flags`.
- Typed chains and `$as`.

These are the next generator pieces that were assigned to coordinate on 2026-10-10.

- The grammar guards' bare-id acceptance gets revisited when parsed units become nodes (arena 3b).
- Portable classification of keyword leaves. A fixed-text kind reads as a bare kind id until parsed units carry identity; that work drives the keyword-leaf ratchet to 0 (rust's primitive types, booleans, `self`/`super`/`crate`, `()`, `!`, `_`, `..` and macro fragment specifiers; typescript's predefined types, `unique symbol`, `this`, `super`, `null`/`undefined` and visibility keywords; python's `True`/`False`/`None`, `...`, `pass`/`break`/`continue`; `;` everywhere).
