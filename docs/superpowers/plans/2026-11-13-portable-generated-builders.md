# Generated Portable Builders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** each grammar's portable layer is generated code: typed per-path build functions over the low-level loose builders, and a per-kind projection. The emitter writes them through the pinned `@sittir/typescript` builders. The run-time interpreters, `PortableRuntime` and the shipped tables go.

**Spec:** `docs/superpowers/specs/2026-11-13-portable-generated-builders-design.md`. Read it first. This plan argues from it and doesn't restate it. Decisions 1, 2, 3, 6 and 7, "a parse returns the projection" and the export rows are approved, and 4 and 5 are emitter-internal.

**Prototype:** `probe/portable-generated` (`packages/tools/src/portable/prototype/`). Task 4 moves its emitter into codegen.

**Executor:** sittir-design, by the user's ruling of 2026-11-14. **Reviewer:** sittir-brainstorm, at the end of every task. Each task lands as its own PR.

## Global Constraints

- **Worktree:** `scratchpad/wt-vocab-rulings`, a branch from `origin/master`. No new worktrees. Pathspec commits. No force, stash, amend, rebase, revert or abort. Push by literal sha.
- **Generated outputs are never hand-edited.** Fix the emitter and regenerate.
- **No run-time mapping.** Generated code may call shared value helpers (text and number spelling), never a table walker.
- **No string fallback in the emitter.** A construct the pinned builders can't express is `portable-emit-pinned-gap`.
- **One source per fact:**
  - a member's path set comes from the read routes;
  - a path's placement from the build table;
  - a path's node types from `PortableIds`;
  - a path's flags from its arms and facts.
- **No tolerance between sittir paths.** Until the interpreter is removed, the generated build and the interpreter agree on every corpus structure, or the difference is a listed row the user has ruled on.
- **Three-way verification** before every commit that can change what the pipeline reads, renders, parses or validates: targeted probes, `pnpm run validate:history` compared with numbers, and the full suite with any new failure isolated. Type-only commits also run `pnpm run type-check:tests` and the workspace `pnpm run type-check`.
- **Type-check time** is measured against the baseline and reported. It never gates.
- **Ratchets only tighten.** The emit diagnostics start at the counts Task 4 measures and only fall.
- **Hand-written source in `packages/{codegen,common,tools,types}/src` carries no explanatory comments.** Docs carry no PR or task numbers.

### Task 1: The pin loads only pinned

**Status:** the `pinned-build-unpinned` guard (Steps 1–3, first half) comes from sittir-implement. The child's emit mode remains.

**Files:**
- Modify: `packages/codegen/src/bootstrap/pinned.ts`
- Modify: `packages/codegen/src/bindings/read.ts`, `pinned-reader.child.ts` (the emit mode's request type)
- Test: `packages/codegen/src/bootstrap/__tests__/pinned.test.ts`

- [ ] **Step 1: The failing test.** Under the workspace tsconfig, an in-process `loadPinnedBuild()` throws `pinned-build-unpinned`, naming the path the pinned `@sittir/common` resolved to. Under `tsconfig.pinned.json` it loads, and an arena engine from it parses.
- [ ] **Step 2: Run it.** It fails today with the late arena error.
- [ ] **Step 3: Implement** the resolution check in `loadPinnedBuild`, and add the child's emit mode (request: grammar and the emitter's inputs; reply: module text and diagnostics).
- [ ] **Step 4: Run** the test and the bindings tests. Commit.

### Task 2: The emitter type-checks against the pinned declarations

**Status:** done.

**Files:**
- Modify: `packages/codegen/src/bootstrap/bootstrap.ts` (writes `scratchpad/pinned-types/tsconfig.json` into the checkout on every bootstrap)
- Create: `packages/codegen/tsconfig.emitter.json`, extending it; `packages/codegen/src/emitters/overlays/portable/emit/` (the emitter's directory: `engine.ts` and the type fixture)
- Modify: the root `type-check` script (`type-check:emitter`); the emitter's directory leaves codegen's own and build tsconfigs

- [x] **Step 1: The failing case.** A fixture emitter call `t.switchCase({ value, body: [] })` type-checks today, though `body` isn't a key the pinned builder takes: the prototype typed its builders as `Record<string, any>`.
- [x] **Step 2: Implement.** `sittir bootstrap` writes a tsconfig mapping every `@sittir/*` export of the pinned build to the declaration file its `types` condition names. It extends codegen's tsconfig, so only `paths` change. The emitter's directory type-checks under it.
- [x] **Step 3: Run it.** The fixture is an error (TS2345, "an unknown key: body"), held by `@ts-expect-error`; a correct call under the directive is TS2578. The loose config types refuse unknown keys.
- [x] **Step 4: Commit.**

### Task 3: The grammar map carries what the generated signatures need

**Files:**
- Modify: `packages/types/src/vocabulary/{map,input,utils}.ts` (`BuildInput`, `nodes`, the flag sets), `packages/codegen/src/emitters/overlays/portable/grammar-map.ts`
- Modify: the getter vocabulary (`accessors/declaration.ts`, `accessor-signatures/declaration.ts`): a getter takes no `parameters`; setters keep them
- Test: `packages/types/tests/build-input.test-d.ts`

- [ ] **Step 1: The failing tests:**
  - python `BuildInput<PythonMap, 'declaration.property.getter'>['$flags']` admits `'async'` (decision 3);
  - a `T.Block.Bound` is assignable to the getter's `body`, and a typescript node isn't (decision 2);
  - typescript `{ $path: 'literal.number', $value: 1 }` is assignable to an array element (decision 1);
  - the getter's input has no `parameters`.
- [ ] **Step 2: Run** `pnpm run type-check:tests`. It fails.
- [ ] **Step 3: Implement.**
  - Emit `nodes` from `PortableIds` and the flag sets from the arms and facts.
  - Emit the `inputs` additions from the build rows with `builds`.
  - Add `BuildInput`.
  - Make the getter vocabulary edits, and run `tool bindings-inventory --write` for each grammar and `tool vocabulary-features --write`.
- [ ] **Step 4: Three-way verification,** then commit.

### Task 4: The build emitter

**Files:**
- Create: `packages/codegen/src/emitters/overlays/portable/emit/build.ts` (from the prototype, its builders typed by `emit/engine.ts`), run in the pinned child
- Generated: `packages/<lang>/src/portable/build.ts` becomes `portableBuild(engine)`
- Test: `packages/tools/src/__tests__/portable-generated-build.test.ts`

- [ ] **Step 1: The failing test.** For every corpus file in all three grammars, in both storages, project each node with today's reader. Then build the projection with the generated function and with the interpreter. The two renders are identical.
  - The known differences are rows: python's root getter and static method, which the interpreter refuses. Every other difference stops the task for review.
- [ ] **Step 2: Implement** the emitter over every path:
  - decisions 1, 4 and 5;
  - the four emit diagnostics;
  - the header comment through `$trivia.leading`;
  - number spelling (exponent forms included) through one shared value helper.
- [ ] **Step 3: Regenerate.** The generated modules type-check with 0 errors, or each error is a `portable-emit-type` row. Record the per-grammar counts of every emit diagnostic as the ceilings.
- [ ] **Step 4: Run** the corpus test, validate history and the suite. Report type-check times against the baseline. Commit.

### Task 5: The projection emitter

**Files:**
- Create: `packages/codegen/src/emitters/overlays/portable/emit-project.ts`
- Generated: `packages/<lang>/src/portable/project.ts`
- Test: `packages/tools/src/__tests__/portable-generated-project.test.ts`

- [ ] **Step 1: Prototype first,** on the spec's eight paths, and bring brainstorm the generated getter case and its size beside today's read. The claim test `(#eq? @_self "self")` compiles to code.
- [ ] **Step 2: The failing test.** For every corpus node in all three grammars, in both storages, the generated projection equals today's read, except for listed rows:
  - the python getter has no `parameters`;
  - typescript `identifier.qualified`'s honest members, moved here from the portable-grammar-map plan.
- [ ] **Step 3: Implement,** regenerate, and run the test, validate history and the suite. Commit.
- [ ] **Step 4: Measure** parse against parse-with-projection over the corpus, per grammar and storage, and put the ratios in the PR body. They don't gate.

### Task 6: The portable engine and the removals

**Files:**
- Modify: `packages/common/src/create-engine.ts` (`api: 'portable'`), the generated descriptor's portable entry
- Delete: `packages/common/src/portable/{build,read}.ts` and the run-time table registry; `PortableRuntime` and the rest of the spec's export rows
- Modify: `@sittir/types` `PortableEngine`, `PortableSurface`; move the table types into codegen
- Test: `packages/types/tests/engine-portable.test-d.ts`, and the surface test

- [ ] **Step 1: The failing tests.**
  - `createEngine(python, { api: 'portable' })` has `build.declaration.property.getter`, typed by `BuildInput`.
  - `parse(source)` returns `File<G>`, projected whole in the call; `project(node, carried?)` reports kept nodes through `PortableCarried` from `@sittir/types`.
  - Nothing named in the spec's removed rows is exported.
- [ ] **Step 2: Implement.** Delete the interpreters and move every caller (tools, tests, conformance) to the engine. Remove the Task 4 interpreter comparison, with its rows recorded in the commit.
- [ ] **Step 3: Three-way verification,** plus the workspace type-check. Commit.

### Task 7: Gates and ratchets

- [ ] **Step 1: Retire the conformance mirror** (`tool portable-conformance` and its ceilings). The generated modules' type-check replaces it.
- [ ] **Step 2: Add the emit-diagnostic ratchet,** per grammar, at Task 4's counts. An MVP path with any diagnostic fails generation once the user names the sets.
- [ ] **Step 3: Run every gate:** the ratchets, validate history against base, the suite, the workspace type-check, and the times against the baseline.
- [ ] **Step 4: Open the PR** with `Owner: sittir-design` on the first line, the API rows (every public export added, changed or removed, before → after), the counts and the times. Brainstorm reviews, and the merge needs the user's word.
