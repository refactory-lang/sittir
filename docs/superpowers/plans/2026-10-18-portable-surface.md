# Portable Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline; this repo does code work without subagents). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `createEngine(lang, { api: 'portable' })` gets the language-neutral vocabulary surface the maintainer ruled. `portable.is` and `portable.kinds` live in `@sittir/common/portable`, `rust.is.portable` and `rust.kinds.portable` are those same objects typed for Rust, guards take a node only, and `ofType` accepts a vocabulary kind.

**Architecture:**
- The vocabulary's path list is emitted once into `@sittir/types/vocabulary`.
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

**Q1 — placement-dependent read entries.** The emitted tables still hold 42 entries with a non-empty `within`, plus 1 condition with `up: 1`. Today these are reachable only through the guard's `context` parameter, which node-only removes:

| grammar | `within` entries | `up: 1` conditions | what they are |
|---|---|---|---|
| rust | 38 | 0 | all are `declaration.parameter` within `closure_parameters` |
| python | 4 | 1 | `declaration.method` within a class body; `declaration.parameter` in parameters and lambda parameters; `identifier.type` within `type` |
| typescript | 0 | 0 | |

The 2026-10-10 ruling says placed claims become aliases, parent members or envelope stamps, and recorded no residue at the time; these 43 are that residue.

Ruled: **the 43 are re-stated in bindings before Task 4** (an alias or envelope per claim), and the emitter refuses a `within` entry or an `up > 0` condition with a generator diagnostic, gated at 0. This is Task 3b, owned by coordinate. Its `grammar.bindings.ts` lines go to sittir-design for review, as `grammar.sittir.ts` lines do.

**Q2 — typing `rust.is.portable`.** Ruled: one runtime object, typed per language through an interface the codegen emits:
- `PortableIsAt<RustIds>`: each guard is `<T extends RustNode>(node: T) => node is T & { $type: Ids }`.
- A python node passed to `rust.is.portable…` is a type error.
- At run time it is classified by python's rows, which keeps `portable.is` language-neutral, as Review Focus 1 requires.

---

## File structure

| file | responsibility |
|---|---|
| `packages/types/src/vocabulary/paths.ts` (generated, committed) | `export const vocabularyPaths: readonly string[]`, frozen, every vocabulary kind path, one path per line, sorted |
| `packages/types/package.json` | adds the `./vocabulary` export (paths plus the existing vocabulary types) |
| `packages/codegen/src/bindings/vocabulary-paths.ts` | `emitVocabularyPaths(vocabulary: Vocabulary): string`, the file body above, from `readVocabulary` |
| `packages/common/src/portable/tree.ts` | `portableTrees(paths, guardOf): { kinds; is }`: the two frozen namespaced trees, one shape |
| `packages/common/src/portable/classify.ts` | `classifierOf(rows): (node) => string \| undefined`, read entries tried in order, node-only (moved from `portable.ts`) |
| `packages/common/src/portable/index.ts` | `export const portable: { kinds; is }`, served at the `@sittir/common/portable` export |
| `packages/codegen/src/emitters/overlays/portable/namespaces.ts` | emits per-language rows (`PortableRows`) and the typed views `PortableIsAt<Ids>` and `PortableKindsAt` |
| `packages/common/src/create-engine.ts` | every engine's identity carries `portable: hooks.portable`; the portable engine returns `portable.kinds` and `portable.is` |
| `packages/common/src/query.ts` | `ofType(kind: number \| PortableKind)` |

`packages/common/src/portable.ts` (`portableSurface`) and `portable-path.ts` fold into `portable/`. `PortableGuard`'s `context` parameter and the `$subType` read are removed.

## Stack

1. **PR 1 (Tasks 1–2):** the path list and the shared trees. Nothing reads them yet, and generated output moves only in `packages/types`.
2. **PR 2 (Tasks 3, 3b, 4, 5):** rows on the engine, the placement residue restated in bindings, node-only guards, descriptor and engine wiring. This regenerates all five grammars.
3. **PR 3 (Task 6):** `ofType` with a vocabulary kind.

---

### Task 1: Emit the vocabulary path list

**Files:**
- Create: `packages/codegen/src/bindings/vocabulary-paths.ts`
- Create (generated): `packages/types/src/vocabulary/paths.ts`
- Modify: `packages/types/package.json` (exports `./vocabulary`), the regen entry that writes generated files
- Test: `packages/codegen/src/bindings/__tests__/vocabulary-paths.test.ts`

**Interfaces:**
- Consumes: `readVocabulary(dir): Promise<Vocabulary>` (`packages/codegen/src/bindings/vocabulary.ts:144`).
- Produces: `vocabularyPaths: readonly string[]` from `@sittir/types/vocabulary`, and `emitVocabularyPaths(vocabulary): string`.

- [ ] **Step 1:** Write the failing tests.
  - `'lists every vocabulary kind path once, sorted'`: `expect(vocabularyPaths).toEqual([...new Set(pathsOf(await readVocabulary(dir)))].sort())`.
  - `'writes one path per line'`: every path literal in the emitted body sits on its own line, in sorted order.
  - `'the committed file is what the emitter writes'`: `expect(readFileSync(paths.ts)).toBe(emitVocabularyPaths(await readVocabulary(dir)))`.
  - `'is frozen'`: `Object.isFrozen(vocabularyPaths)`.
- [ ] **Step 2:** Run `SITTIR_HISTORY_NO_COMMIT=1 pnpm vitest run packages/codegen/src/bindings/__tests__/vocabulary-paths.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3:** Implement `emitVocabularyPaths` and wire it into the regen step that already reads the vocabulary. Add the glossary entry in `docs/glossary/`.
- [ ] **Step 4:** Have exec run the regen, then rerun the tests. Expected: PASS. Only `packages/types/src/vocabulary/paths.ts` is new, and 0 validation rows move.
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
  - `typeof portable.is.declaration.function === 'function'`.
  - A path segment named `call` is a guard, not `Function.prototype.call`.
- [ ] **Step 2:** Run the test. Expected: FAIL.
- [ ] **Step 3:** Implement `portableTrees` with `Object.defineProperty` links (the existing `link` loop in `portable.ts`). `index.ts` passes a `guardOf` that Task 4 fills; until then it returns `() => false`.
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
- Modify: `packages/rust/grammar.bindings.ts`, `packages/python/grammar.bindings.ts` (about 6 claims: rust's 38 `within closure_parameters` entries are one claim; python's 4 `within` entries and 1 `up: 1` condition are the rest), the bindings emitter that writes read entries (it refuses `within` and `up > 0` with a generator diagnostic)
- Test: the emitter test for the new diagnostic; `packages/rust/tests/portable-guards.test.ts` and `packages/python/tests/portable-guards.test.ts` for the restated classifications

- [ ] **Step 1:** Write the failing tests.
  - The emitter given a claim that needs placement reports the placement diagnostic and emits no `within` entry.
  - With rows read node-only, a rust closure parameter still reads as `declaration.parameter`.
  - The python cases still read as before: a method in a class body, a parameter in parameters and in lambda parameters, and `identifier.type` within `type`.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Restate each claim as an alias or envelope in `grammar.bindings.ts`. Send the lines to sittir-design for review before committing. Add the diagnostic to the emitter, gated at 0.
- [ ] **Step 4:** Exec regenerates. The emitted tables hold 0 `within` entries and 0 `up > 0` conditions, the classifications above are unchanged, and 0 validation rows move.
- [ ] **Step 5:** Pathspec commit with the regenerated files.

### Task 4: Node-only guards that read the node's language

**Files:**
- Create: `packages/common/src/portable/classify.ts` (moved logic: `placed`/`context` removed, `$subType` removed, numbers refused)
- Modify: `packages/common/src/portable/index.ts` (`guardOf`), `packages/types/src/portable.ts` (`PortableGuard` loses `context`)
- Delete: `packages/common/src/portable.ts`; `portable-path.ts` moves to `portable/facts.ts`
- Test: `packages/rust/tests/portable-guards.test.ts`

**Interfaces:**
- Consumes: `EngineIdentity.portable` (Task 3), the placement-free rows (Task 3b), `engineOf` (`engine-scope.ts`).
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
