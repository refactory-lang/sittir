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

**Status:** the `pinned-build-unpinned` guard (Steps 1–3, first half) comes from sittir-implement. The child's emit mode (`portableBuild`) is built on `feat/portable-build-emitter`, with Task 4.

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
- Modify: `packages/codegen/src/bootstrap/bootstrap.ts` (writes `scratchpad/pinned-types/tsconfig.json` into the checkout on every bootstrap); create `bootstrap/pinned-types.ts` and `packages/codegen/scripts/check-pinned-types.ts` (the boundary)
- Create: `packages/codegen/tsconfig.pinned-types.json`, extending it; `packages/codegen/src/emitters/overlays/portable/emit/` (the emitter's directory: `engine.ts` and the type fixture)
- Modify: the root `type-check` script (`type-check:pinned-types`); the emitter's directory leaves codegen's own and build tsconfigs

- [x] **Step 1: The failing case.** A fixture emitter call `t.switchCase({ value, body: [] })` type-checks today, though `body` isn't a key the pinned builder takes: the prototype typed its builders as `Record<string, any>`.
- [x] **Step 2: Implement.** `sittir bootstrap` writes a tsconfig mapping every `@sittir/*` export of the pinned build to the declaration file its `types` condition names, when the pin built it. It extends codegen's tsconfig, so only `paths` change. The emitter's directory type-checks under it.
  - `paths` only redirects: an unmapped subpath or an unbuilt declaration falls through to the live checkout. So `type-check:pinned-types` first lists the emitter program's files (`tsc --explainFiles`) and fails on any `@sittir/*` import, the pinned declarations' own included, that resolves outside the pin (`pinned-types-escape`).
  - One workspace file is admitted, by a relative import: `packages/types/src/portable-build.ts`, the build-table declarations. The emitter reads workspace data, gen's build table, so its input is typed by the workspace's declarations, while the builders it writes through stay pinned. The file imports nothing, and the guard fails once it gains an import, so the allowance can't widen by an edit to that file.
- [x] **Step 3: Run it.** The fixture is an error (TS2345, "an unknown key: body"), held by `@ts-expect-error`; a correct call under the directive is TS2578. The loose config types refuse unknown keys.
- [x] **Step 4: Commit.**

### Task 3: The grammar map carries what the generated signatures need

**Status:** done.
- The tests are `packages/{python,rust,typescript}/tests/build-input.portable.test-d.ts`, in the lane that already holds the map-backed portable tests.
- The node arm types reads as well as inputs, since a read is an input.
- Every routed member's exact set comes from its read routes, narrowed by its claim's tests. The typed module writes no member the map types `never`.
- The user widened `declaration.constant.value` and `expression.yield(.delegate).expression` to what python reads, and allowed python's raw-arm ceilings 145 and 2332 for this change.
- Python's getter `parameters` moved to Task 4.
- A map path's `nodes` are the kinds that read as it. `PortableIds` stays family-wide for the guards.
- A member's exact set is what its read routes return: its own routes, the members a container contributes, a route slot's fixed texts, a claimed text path, and a varying text as `string`. Derivation arms add nothing (a follow-up PR; python's per-value raw arms 2337 by the user's exception, conformance python 6).
- A path built from text alone declares `$value: string` (decision 8). The bare-text arm keys on the map's `inputs`. `packages/tools/tests/portable/text-values.test.ts` derives the set from the build tables, where an arm that takes a text `$value` is a text arm or a content arm (rust's metavariable).

**Files:**
- Modify: `packages/types/src/vocabulary/{map,input,utils}.ts` (`BuildInput`, `nodes`, the flag sets), `packages/codegen/src/emitters/overlays/portable/grammar-map.ts`
- Modify: the getter vocabulary (`accessors/declaration.ts`, `accessor-signatures/declaration.ts`): a getter takes no `parameters`; setters keep them
- Modify: the vocabulary interfaces of the paths built from text (spec decision 8), `packages/codegen/src/bindings/vocabulary.ts` (a member's text type), `packages/codegen/src/emitters/overlays/portable/typed.ts` (a view's text `$value` comes from the vocabulary)
- Test: `packages/tools/tests/portable/text-values.test.ts` (the text-value set, derived from the build tables)
- Test: `packages/types/tests/build-input.test-d.ts`

- [x] **Step 1: The failing tests:**
  - python `BuildInput<PythonMap, 'declaration.property.getter'>['$flags']` admits `'async'` (decision 3);
  - a `T.Block.Bound` is assignable to the getter's `body`, and a typescript node isn't (decision 2);
  - typescript `{ $path: 'literal.number', $value: 1 }` is assignable to an array element (decision 1);
  - the getter's input has no `parameters`;
  - python `{ $path: 'identifier' }` is refused, `{ $path: 'identifier', $value: 'x' }` and `'x'` are accepted, and a constant's `name` reads as `'X'` (decision 8).
- [x] **Step 2: Run** `pnpm run type-check:tests`. It fails.
- [x] **Step 3: Implement.**
  - Emit `nodes` per path, from the kinds whose read entries read as that path (`readPathsOf`, the read arms' derivation). `PortableIds` stays family-wide for the guards. Emit the flag sets from the arms and facts.
  - Give each path built from text alone `readonly $value: string` (decision 8). `Read`, `InputOf` and the slot default add its bare text, and the typed views take their `$value` from the vocabulary.
  - Emit the `inputs` additions from the build rows with `builds`.
  - Add `BuildInput`.
  - Make the getter vocabulary edits, and run `tool bindings-inventory --write` for each grammar and `tool vocabulary-features --write`.
- [x] **Step 4: Three-way verification,** then commit.

### Task 3b: No member is named `content`

**Status:** merged as #1259 (d67a0609516a891a234c3cf988e206754d6fbcf6), 2026-11-16.

The bindings spec's §6 (Names, rule 6; Kinds, rule 2) and §9, and decision 8 here, hold the rulings.
- (a) and (b) are bindings and vocabulary only: container patterns and captures, with no compiler change and no new bindings directive.
- (c)'s widened text rule changes the build table and `takesTextValue`.

**Files:**
- Modify: `packages/{python,rust,typescript}/bindings.scm`:
  - container patterns for `decorator`, rust's `attribute_item` and `inner_attribute_item` (`"!" @inner`), and python's `type`;
  - one capture per renamed member.
- Modify: the vocabulary interfaces that declare `content`:
  - `Attribute`, `Attribute.Decorator` and `Type` go;
  - `Statement.Import.From` and `.Future`, `Clause.Import.Names`, `Expression.Yield`, `Element.Spread.Parenthesized`, `Statement.Expression`, `Declaration.Ambient`, `Element.TypeArgument` and `Type.Literal` take the spec's names;
  - the comment kinds, `Literal.String.Escape` and the raw strings declare `$value: string`;
  - `decorators` and `attributes` admit what the wrappers hold, and rust's attribute gains the `inner` flag.
- Modify: `packages/common/src/portable/facts.ts` (`takesTextValue`) and `packages/codegen/src/emitters/overlays/portable/build.ts`. The content arm covers a node whose one slot holds a text-built kind, and the arm names the child kind it makes.
- Modify: the interpreter's content arm in `packages/common/src/portable/build.ts`, which makes the child from the text.
- Test: `packages/{python,rust,typescript}/tests/build-input.portable.test-d.ts`, `packages/tools/tests/portable/text-values.test.ts`, and read and build tests per shape.

- [x] **Step 1: The failing tests, one per shape:**
  - a decorator reads as its expression in `decorators`;
  - rust's `#![a]` reads as the attribute with `inner`, and builds back;
  - python's `x: int` reads `type: 'int'`;
  - each renamed member reads under its new name, and `content` is refused in the types;
  - python's `# x` (a lexed token) and rust's `//x` and `r"a"` (a node whose one slot holds a text-built kind) read `{ $path, $value }`, and each builds back from `$value` and from bare text.
- [x] **Step 2: Run them.** They fail.
- [x] **Step 3: Implement.** Bindings and vocabulary for (a) and (b). For (c), widen the content arm in the build table and keep `takesTextValue` the one predicate. The build table is what Task 4's emitter reads, so the widened arm survives the interpreter's removal in Task 6. The interpreter's content arm makes the child from the text until then.
- [x] **Step 4: Regenerate.** Run the type tests, the text-values guard, `validate:native` (the rows must hold), validate history and the suite.
- [x] **Step 5: Bring the open rows to brainstorm before pushing,** each with before and after:
  - whether python's `literal.string.escape` joins the text paths, as the guard decides (if it does, amend decision 8's list);
  - whether the reader and the interpreter keep rust's container-set `inner` (if either drops it, report before fixing);
  - the `attribute.content` path segment rename;
  - the API rows for the whole task.

### Task 4: The build emitter

**Status:** in progress on `feat/portable-build-emitter`.
- The generated builders call the strict API (ruled 2026-11-17). The module is a table of functions that take no engine; it imports the strict table (`ir-strict.ts`), and a caller scopes it with `scopeBuilders(engine, portableBuild)`. The strict list arguments of the six hole-taking kinds take `null`.
- Built:
  - the emitter in the pinned child;
  - gen writing `portable/table.ts` and `portable/build.ts`;
  - the corpus test (Step 1), green in all three grammars and both storages, the interpreter and the generated module on one strict engine.
- Built of Step 2:
  - decisions 1, 2 and 4;
  - the header comment;
  - paths that pick their arm by the `$value`'s type, and number arms that take the scalar whole or in their last numeric slot;
  - text-built arms from their text, where the path reads its `$value` as text;
  - containers whose builder takes an elements or spread input, holding a single value;
  - decision 7's optional `$path`: the map's `decided` names each member's one structure-built path, and a path function's input is `PathInput<Map, P>`;
  - members that take one value or a list, built by whether the value is a list;
  - number spelling in decimal parts (exponent forms included) through `decimalSpelling`, with a part the builder takes as an option passed in the call's options;
  - strict calls for what the loose builders coerced: a token's kind id in its seat's containers, a text through the one path that takes it as its only required member (else `untexted`), an integer passed to a direct builder once per scalar type;
  - the module's own `isNode` guard, typed by the grammar's node union;
  - token-only members typed as their token texts, read and build (python 16, rust 5, typescript 9), the generated member taking its text type from the map.
- Emit diagnostics count only functions the module keeps. The corpus test's not-generated ceilings are python 828, rust 1335, typescript 1315.
- A path the emitter can't compile whole is left out with `portable-emit-unfit-member` and counted by the corpus test's not-generated ceiling. That covers holders, owners, mounts and options.
- The generated module stays out of `dist` beside the map, which `dist` already leaves out; only the corpus test loads it, from source.
- The emit diagnostics' ceilings are recorded at their counts (`diagnostic-ceilings.json`).
- Remaining:
  - decision 5;
  - decision 7's bare numbers, by the outermost taker (ruled 2026-11-17); in a member with a number taker a number is a number, and the type stops admitting a fixed word's bare kind id there (ruled 2026-11-17). Measured: no member has takers that aren't nested, so none is unfit (python 186, rust 185, typescript 202 members take a number);
  - python's getter;
  - decision 9's tails;
  - the `pinned-gap`, `type` and `tail-is-path` diagnostics;
  - decision 7's bare booleans, once the emitter builds literal arms (`literal.boolean.*` arms are literal arms, unfit today), since a bare `true` has no generated path to go to until then;
  - Step 3 (generated-module type errors: 0 in all three grammars) and Step 4.

**Files:**
- Create: `packages/codegen/src/emitters/overlays/portable/emit/build.ts` (from the prototype, its builders typed by `emit/engine.ts`), run in the pinned child
- Generated: `packages/<lang>/src/portable/build.ts` becomes `portableBuild`, a table a caller scopes with `scopeBuilders(engine, portableBuild)`
- Test: `packages/tools/src/__tests__/portable-generated-build.test.ts`

- [x] **Step 1: The failing test.** For every corpus file in all three grammars, in both storages, project each node with today's reader. Then build the projection with the generated function and with the interpreter. The two renders are identical.
  - The known differences are rows: python's root getter and static method, which the interpreter refuses. Every other difference stops the task for review.
- [ ] **Step 2: Implement** the emitter over every path:
  - decisions 1, 4, 5 and 7;
  - python's getter takes no `parameters`, and its generated build writes `self`. The vocabulary edit to `accessors/declaration.ts` comes from Task 3. It lands here because the interpreted build table takes that member's list arity from the vocabulary. The type tests gain "the getter's input has no `parameters`" for python and typescript;
  - decision 9's tails. Each slot's tails are computed beside its exact set, written as `$path` spellings on the map's input side and as `case` labels in the member function, and checked by `portable-emit-tail-is-path`. The type and build tests gain:
    - rust `declaration.function.name` accepts `{ $path: 'metavariable', $value: 'y' }`, and the generated build gives `$y`;
    - rust `statement.return.expression` accepts `'arithmetic.add'` and refuses `'add'` and `'binary.arithmetic.add'`;
    - python `statement.return.expression` accepts `'add'`;
    - a root build refuses a tail;
  - the five emit diagnostics;
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
