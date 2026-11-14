# Portable Grammar Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** the portable types become the authored vocabulary instantiated per grammar by a small generated grammar map `G` (feature set plus slot overrides), with exact slot types, a typed engine surface, and the six-layer machinery removed.

**Architecture:**
- Each vocabulary member carries its default type. `Slot<G, P, M, D>` reads `G`'s override for path `P` and member `M`, or else falls back to `D`. One type-level mapping derives every input interface from its read interface.
- `G` is emitted per grammar from the same model facts the runtime admission and the reader use, and a compile-time constraint holds every override to fit its default.
- Paths and members are gated by `G['features']`.
- The engine's portable `read` and `build` are typed by `G`, and `PortableEngine<C>` is the same shape over a composition.

**Tech stack:** TypeScript (`@sittir/types`, `@sittir/codegen` emitters, `@sittir/common`, `@sittir/tools`), vitest typecheck tests (`*.test-d.ts`), the generated grammar packages.

**Spec:** `docs/superpowers/specs/2026-11-05-portable-type-layers-design.md` (approved 2026-11-05). Read it first. This plan argues from it and doesn't restate it.

**Executor:** sittir-design. **Reviewer:** sittir-brainstorm, at the end of every task.

## Global Constraints

- **Worktree and branch:** `scratchpad/wt-role-arms`, branch `feat/portable-grammar-map` from `origin/master`. No new worktrees. Pathspec commits (`git commit -- <paths>`). No force, stash, amend, rebase, revert or abort. Push by literal sha. Merge master in whenever master moves.
- **The shared vocabulary stays authored.** No emitter writes vocabulary interfaces. The feature-merge generator (`vocabulary-features --write` → `augment.ts`) may change to gate paths by feature, derive input interfaces and let language-feature paths join their namespace, but it only merges authored interfaces.
- **Generated outputs are never hand-edited:** `packages/{rust,python,typescript}/src/*` and `packages/*/.sittir/*`. Fix the emitter and regenerate.
- **One source for overrides:** the model's slot facts and the build table, the facts the runtime admission and the reader already use. No second derivation of a slot's set.
- **Every override fits its default,** checked at compile time and never vacuously. An override narrows and never removes a member.
- **Absence is a feature the grammar lacks,** and its error names the feature. No per-grammar path or member removal.
- **Ratchets only tighten,** compared against base:
  - over-admitting members ends at 0 and stays there;
  - raw-node arms only shrink;
  - conformance diagnostics (base: python 87, rust 82, typescript 133) don't rise.
- **No new `#set!` directives.** Claims, vocabulary types and compiler facts only.
- **Hand-written source in `packages/{codegen,common,tools,types}/src` carries no explanatory comments.** The why goes in the commit message. Public engine API declarations carry JSDoc.
- **Comments and docs carry no spec, plan, PR or task numbers.**
- **Three-way verification before every commit that can change what the pipeline reads, renders, parses or validates:**
  1. targeted probes;
  2. `pnpm run validate:history` compared, with numbers;
  3. the full suite, with any new failure isolated.

  Type-only commits also run `pnpm run type-check:tests` and the workspace `pnpm run type-check`.
- **Type-check time is measured against the baseline and reported.** It never gates. Baseline:
  - typed module walls: python 1.6 s, rust 1.4 s, typescript 0.6 s;
  - package walls: 3.0 s, 2.8 s, 1.2 s;
  - workspace: 25.9 s;
  - type tests: 2.8 s.
- **Rulings already made for this plan:**
  - Visibility decomposes along both axes, levels and kinds.
  - `pattern.struct` stays claimed, with struct patterns as the parent piece and Structs extending it.
  - Python's convention-spelled features get claims by name or decorator, in their own task.
  - Shape mismatches move to a sub-feature the language lacks (tracked as an issue).
  - Marker-only features count as trivially held.
  - Features compose without limit: a feature extends any number of features, at any depth. Packages are features with no content of their own. A grammar holds a feature when it holds the feature's own content and every feature it extends.

## Review Focus

1. **A member that's absent from the slot facts:** a direct member with no table entry (one of the 51 sole-role members). Expected: its override comes from the same exact-set derivation, and the fit check binds instead of passing as `unknown`. Owned by Task 3.
2. **An override wider than its default:** for example, one that adds a kind outside the namespace. Expected: the grammar map fails to compile, naming the path and member. Owned by Task 3.
3. **A value read from one engine passed to another grammar's build:** expected to be a type error under single-grammar types, and accepted under the contract only when the contract admits it. Owned by Task 6.
4. **A path from a feature the grammar lacks, named in a build structure:** expected to be a type error whose message names the feature. At runtime, the refusal names it too. Owned by Task 5.
5. **A token read:** expected to come back as its text in both storages, never a kind id. Its read type is the text literal union. Owned by Task 6.

---

### Task 1: Proposals for review (docs only, no code)

**Status:** done as f9421082e (2026-11-05, docs to master).

**Files:**
- Create: `docs/superpowers/notes/2026-11-05-portable-features-proposal.md`

**Interfaces:**
- Produces: the approved feature tree, package list and Python mapping that Tasks 5 and 7 implement. No other task starts its content moves before approval.

- [x] **Step 1: The feature tree.** Starting from design's inventory (`feature-gap-inventory.txt`), write it out:
  - each sub-feature that's split out, with its folder under `packages/types/src/vocabulary/features/`, its paths and members, and the parent it extends;
  - each grammar's held set after the split.

  It covers Visibility on both axes, struct patterns as Structs' parent, the moves for call type arguments and loop labels, and every lacked cluster from the inventory (TypeAnnotations, Modules, Destructuring, ParametricPolymorphism, BoundedQuantification, StringInterpolation, RawStrings, ResourceManagement, python Classes and Accessors).

  Features form a graph, not a tree: a feature extends any number of features at any depth. A piece that needs two pieces extends both, and its folder is only where its files live.
- [x] **Step 2: Standard packages.** Propose the first packages (object-oriented, c-like, and any others the compositions suggest), each as a feature with no content of its own that extends the features it combines, with each grammar's membership.
- [x] **Step 3: The Python mapping.** For Visibility (`_x`, `__x`), Accessors (`@property`), AbstractClasses (`ABC`, `@abstractmethod`), ExplicitOverrides (`@override`) and NullableTypes (`X | None`, `Optional[X]`), give each claim and the vocabulary fact it states. Flag any construct Python doesn't state.
- [x] **Step 4: Commit the note to master** (docs only), and send it to brainstorm. Brainstorm takes it to the maintainer. Wait for approval.

### Task 2: Measure first: exact slot sets and the admission census

**Status:** merged as #1158 (0bae3a468), 2026-11-09.

The admission census (`tool portable-admission`) owns both counts. It already reads each grammar's typed module with the type checker. The conformance lane doesn't change.

**Files:**
- Create: `packages/codegen/src/emitters/overlays/portable/exact.ts`
- Modify:
  - `packages/codegen/src/emitters/overlays/portable/typed.ts`: `contextOf` and `slotArmOf` consume `exactSlotsOf`, and `PortableTypedInput` takes `table: PortableBuildTable` in place of `picks`;
  - `packages/codegen/src/emitters/overlays/portable/index.ts`: passes `build.table`;
  - `packages/tools/src/portable/admission.ts` (`AdmissionReport`).
- Test:
  - `packages/codegen/src/emitters/overlays/portable/__tests__/exact.test.ts`;
  - `packages/tools/tests/portable-admission.test.ts`;
  - `packages/tools/tests/portable-admission-ratchet.test.ts`.

**Interfaces:**
- Produces:
  - `exactSlotsOf(input: PortableTypedInput): ExactSlots`, where:
    - `ExactSlots = ReadonlyMap<string, ReadonlyMap<string, ExactSet>>` (path → member → set);
    - `ExactSet = { kinds: readonly string[]; unmapped: readonly string[]; raw: readonly RawArm[]; texts: readonly string[] }`;
    - `RawArm = { kind: string; reasons: readonly RawReason[] }`;
    - `RawReason = Exclude<PortableCarry['reason'], 'unclaimed'>`.
  - **One derivation of a slot's exact set.** `exactSlotsOf` is moved out of `contextOf`/`slotArmOf`, not copied, and `typed.ts` consumes it.
    - Unclaimed kinds go in `unmapped`, never `raw`.
    - `raw` lists each claimed kind in the slot that the reader can keep raw, with every reason it can. Each reason's "can" comes from the facts the reader tests:
      - `flags`: the kind has a flag no arm builds;
      - `readOnly`: the kind has a read-only spelling;
      - `unread`: the kind has a slot no arm member reads or tests that can hold meaningful text;
      - `text`: an arm reads the kind through content or text;
      - `preset`: an arm carries presets;
      - `scalar`: an arm carries a scalar;
      - `opaque`: the kind, or an accessor in `table.tokens`, can hold a verbatim item.
  - `rawGroupOf(reasons: readonly RawReason[]): 'kind' | 'value'`. A raw arm is in the `kind` group when any of its reasons is a gap in the kind's table facts (`flags`, `readOnly`, `unread`, `text`), and in the `value` group otherwise (`preset`, `scalar`, `opaque`).
  - **`AdmissionReport` gains:**
    - `members: readonly AdmissionMember[]`, where `AdmissionMember = { grammar: string; path: string; member: string; excess: readonly string[] }`: each (path, member) pair whose emitted type admits a kind outside its `exactSlotsOf` set, as read with the type checker. Role-armed members count.
    - `raw: readonly { grammar: string; kind: number; value: number }[]`: raw arms per grammar, by group.
  - **Site-level over-admission includes role-armed sites.** The rule that excluded role arms is removed. `roleArmed` stays as the site count that ties to 352.
  - `excessOf(admitted: ReadonlySet<string>, exact: ExactSet): readonly string[]`: the pure comparison that the report and the fixture test share.

- [x] **Step 1: The failing tests.**
  - `exact.test.ts`:
    - `exactSlotsOf` puts an unclaimed kind in `unmapped` and not in `raw`;
    - a kind with a flag no arm builds is a raw arm with reason `flags`, and `rawGroupOf(['flags'])` is `'kind'`;
    - `rawGroupOf(['preset', 'scalar'])` is `'value'`.
  - `portable-admission.test.ts`: `excessOf(new Set(['expression.call', 'expression.binary']), set(['expression.call']))` is `['expression.binary']`. That's a role-armed member whose exact set is one kind, counted as over-admitting.
  - `portable-admission-ratchet.test.ts`:
    - `members` per grammar at its measured ceiling, with python above 0, since today's over-admission is real;
    - `raw` per grammar and group at its measured ceiling;
    - the existing ceilings, with `overAdmitting` re-measured once role-armed sites count.
- [x] **Step 2: Run them:** `pnpm exec vitest run packages/codegen/src/emitters/overlays/portable/__tests__/exact.test.ts packages/tools/tests/portable-admission.test.ts`. They fail because `exactSlotsOf` and `excessOf` don't exist.
- [x] **Step 3: Implement.**
  - Move the set logic into `exact.ts`.
  - Point `contextOf` and `slotArmOf` at it, and switch `PortableTypedInput` to `table`.
  - Extend `portableAdmission` with `members` and `raw`, and drop the role-arm exclusion.
- [x] **Step 4: Verify.**
  - The refactor leaves every `portable.typed.ts` byte-identical (python, rust, typescript), since raw arms are counted here and typed in a later task.
  - The conformance diagnostics haven't moved (87/82/133).
  - Run `pnpm exec tsx packages/cli/src/cli.ts tool portable-admission` and record `members` and `raw` per grammar, and the site counts.
  - Set the ratchet ceilings at the measured values. They only shrink.
- [x] **Step 5: Commit** (`feat(tools): the admission census counts over-admitting members and raw-node arms against exact slot sets`), with the counts in the message.

### Task 3: Defaults on members, `Slot`, the grammar map and the fit constraint

**Status:** merged as #1158 (0bae3a468), 2026-11-09.

**Files:**
- Create: `packages/types/src/vocabulary/map.ts`
- Modify: `packages/types/src/vocabulary/utils.ts`, and every namespace file and feature file whose members read `G['slots'][…]`
- Create: `packages/codegen/src/emitters/overlays/portable/grammar-map.ts`
- Generated: `packages/{python,rust,typescript}/src/portable-map.ts`
- Test: `packages/types/tests/grammar-map.test-d.ts`

**Interfaces:**
- Produces (in `map.ts`):
  - `interface GrammarMap { readonly features: object; readonly overrides: object; readonly inputs: object }`. Here `features` is the grammar's composition interface (today's `V.PythonFeatures` and its siblings), and "has F" is `G['features'] extends F`, so gating works at any depth of composition;
  - `type Slot<G extends GrammarMap, P extends string, M extends string, D> = P extends keyof G['overrides'] ? M extends keyof G['overrides'][P] ? G['overrides'][P][M] : D : D`;
  - `type Fits<G extends GrammarMap>`: a mapped check over the keys `G['overrides']` actually holds. Each must name a vocabulary path and member, and its type must be assignable to that member's default under `G`. It resolves to `true` or to an error type naming the path and member;
  - `type Contract<F extends object>`: a `GrammarMap` with `features: F` and no overrides;
  - `type Assert<T extends true> = T`.
- Every default admits `V.Unmapped`, so an override holding an unclaimed kind fits it. `V.Unmapped<'<grammar>:<kind>'>` resolves to that kind's low-level parsed node type, replacing the phantom shape.
- Produces (emitter): `emitGrammarMap(input: PortableTypedInput, exact: ExactSlots): string`. It writes `export interface <Grammar>Map extends GrammarMap`, with an override entry only where the exact set differs from the member's default, and ends with `type _fits = Assert<Fits<<Grammar>Map>>`.
- Each member's default is the broad type written on it today through `G['slots']` or a role. For example, `function: Slot<G, 'expression.call', 'function', V.Expression<G>>`.

- [x] **Step 1: The failing type tests** in `grammar-map.test-d.ts`:
  - a fixture map overriding `expression.call.function` with one expression path makes `V.Call<Fixture>['function']` exactly that path;
  - with no override, the member equals its default;
  - `// @ts-expect-error` on `Assert<Fits<Wider>>`, where `Wider` overrides with a kind outside the expression namespace;
  - `// @ts-expect-error` on an override keyed by a member the path doesn't declare.
- [x] **Step 2: Run** `pnpm run type-check:tests`. It fails: `Slot` and `Fits` don't exist.
- [x] **Step 3: Implement `map.ts`.** Rewrite each member's `G['slots'][…]` and sole-role type as `Slot<…, default>`, with the default taken from today's slot-table entry or role. Then delete `GrammarContext.slots` from `context.ts`.
- [x] **Step 4: Implement `emitGrammarMap` and regenerate** all three grammars. Unclaimed kinds go in as `V.Unmapped<'<grammar>:<kind>'>`, raw reads as raw-node arms, and texts as literal unions.
- [x] **Step 5: Run everything:**
  - `pnpm run type-check:tests`;
  - the typed modules, with the conformance diagnostics compared to base;
  - the census, which must now read 0 over-admitting members in all three grammars;
  - the workspace type-check.
- [x] **Step 6: Re-point the typed module** (`typed.ts`) at `<Grammar>Map`. Remove `OwnSlots`, `Fit`, `Seated`, the unmapped table and roles as `Ctx` entries. The per-claim reader mirrors stay, now checked against the map's instantiation.
- [x] **Step 7: Three-way verification, then commit** (`feat(types): members carry defaults; grammars override through a generated map`). Report the type-check times.

### Task 4: Input interfaces derived from read; requiredness in input overrides

**Status:** merged as #1158 (0bae3a468), 2026-11-09.

**Files:**
- Create: `packages/types/src/vocabulary/input.ts`
- Modify: `packages/types/src/vocabulary/map.ts` (`inputs`), `grammar-map.ts` (input overrides)
- Test: `packages/types/tests/input-derivation.test-d.ts`

**Interfaces:**
- Produces: `type InputOf<R, G extends GrammarMap>`, the one mapping from a read interface to its input. Each member admits its read type plus:
  - values read from the same engine (`ReadOf<G>`, opaque ones included);
  - bare `string` where the default is a leaf path built from text;
  - scalars where the default is a scalar.
- Also produces `type ReadOf<G extends GrammarMap>`: the union of every path's read interface under `G`, discriminated by its `$path` literal. Task 6 types `read` with it.
- A path's build forms are stated once, at `G['overrides'][P]['$forms']`, and read and input both take them by lookup (`V.Read<G, P>`, `InputOf`). `G['inputs'][P]` holds only input-only forms: bare text for a text-built path.
- Consumes: Task 3's `Slot` and `GrammarMap`.

- [x] **Step 1: The failing tests:**
  - for python `declaration.constant`, `{ name }` alone is a type error, and each of the value, type and both forms type-checks (today's three `RequiredBy` forms);
  - a text-built leaf member accepts `'x'`;
  - a token member accepts its text, and a kind id is a type error;
  - every read value of a path is assignable to its input.
- [x] **Step 2: Run** `pnpm run type-check:tests`. It fails.
- [x] **Step 3: Implement.** Implement `InputOf`, emit `$forms` from the build table's arm tests and `inputs` from `builder: 'text'` arms, and delete `gate.RequiredBy`.
- [x] **Step 4: Run** the type tests, the build-forms test-d files and the conformance lane.
- [x] **Step 5: Commit** (`feat(types): input interfaces derive from read; requiredness moves into input overrides`).

### Task 5: Path gating by feature, sub-feature moves and the claims guard

**Status:** merged as #1158 (0bae3a468), 2026-11-09 (Task 5's follow-up in #1171, 59c6947a1).

**Files:**
- Modify: the feature-merge generator behind `vocabulary-features --write`, and `augment.ts` (generated by it)
- Modify: the feature folders, as the approved Task 1 tree says
- Modify: `packages/types/src/vocabulary/compositions.ts`
- Create: `packages/tools/src/portable/feature-guard.ts`, with a test beside it
- Modify: `packages/python/grammar.sittir.ts` bindings (the Task 1 mapping)

**Interfaces:**
- Produces: `type Missing<F extends string>`, a branded type whose display names the absent feature. A path or member from a feature not in `G['features']` resolves to it.
- Produces: `featureGuard(grammar): GuardRow[]`, where `GuardRow = { feature: string; path: string; member?: string; side: 'claimed-not-composed' | 'composed-not-claimed' }`. Its ceiling is 0, and features with no paths or members count as held.

- [x] **Step 1: The failing tests:**
  - naming a Structs path under python's map is an error displaying `Missing<'Structs'>`, and the same structure built at runtime refuses naming Structs;
  - `featureGuard('python')` is empty after the moves;
  - a fixture grammar that claims a member of a feature it doesn't compose gets one row.
- [x] **Step 2: Run it.** It fails.
- [x] **Step 3: Gate paths in the merge generator** through `G['features']`.
- [x] **Step 4: Move content** into the approved sub-features. Reorder Structs over struct patterns, and update `compositions.ts`.
- [x] **Step 5: Write Python's convention claims** per the approved mapping, as `#match?` claims. A probe for each: read, then build, then render.
- [x] **Step 6: Three-way verification** across all grammars, plus the guard at 0, then commit.

### Task 6: The typed engine surface, honest raw reads and tokens as text

**Status:** partly done: tokens read as text and ReadOf/InputOf exist (#1158). The rest is **superseded** by the generated-portable-builders plan (`docs/superpowers/plans/2026-11-13-portable-generated-builders.md`): the generated build functions and projection carry the types, and `PortableRuntime` goes, so nothing here types it. The honest reads of typescript `identifier.qualified` move to that plan's projection task (Task 5). The steps below are kept as the record and are not run.

**Files:**
- Modify: `PortableRuntime<API>` (`build`, `read`) in `@sittir/types`, and `portableRuntime` in `packages/common/src/portable/`
- Modify: `packages/common/src/portable/read.ts` (tokens read as text)
- Test: `packages/tools/tests/portable-read-types.test.ts` (runtime) and `packages/types/tests/engine-portable.test-d.ts`

**Interfaces:**
- Produces:
  - `read(node): ReadOf<API['portable']['map']>` (Task 4's union), narrowed from a node's kind by a generated `ReadByKind`;
  - `build<S extends InputOf<…>>(structure: S)`.
- `API['portable']` gains `map: <Grammar>Map`.
- Raw-node arms are the grammar's exact low-level parsed node type, and opaque under a contract.
- Under single-grammar types, a value read from one engine isn't assignable to another grammar's input.
- Honest reads owed here: typescript `identifier.qualified`'s exact members, which the census saw for the first time and which raised its raw ceilings (per kind 137 → 141, per value 5310 → 5312). They're `name` (`property_identifier` and `type_identifier`, text and unread) and `qualifier` (`type_query_call_expression` and its `_in_type_annotation`, preset and unread; `type_query_member_expression`, opaque and preset; and its `_in_type_annotation`, opaque). The ceilings go back to base before the PR.

- [ ] **Step 1: The failing tests:**
  - **type test:** `read` of a python `function_definition` node has `$path: 'declaration.function'`;
  - **type test:** building with an unknown member is an error;
  - **runtime test:** for every corpus read in all three grammars, both storages, the returned structure's `$path` and member kinds are within the read type's set. The check is generated from `ReadByKind`, not from the lazy view mirrors;
  - a token member reads as its text in both storages.
- [ ] **Step 2: Run them.** They fail.
- [ ] **Step 3: Implement** the typing. Switch token reads from kind ids to text.
- [ ] **Step 4: Run** the runtime test, the raw-arm count (it must not rise against base) and validate history.
- [ ] **Step 5: Commit.**

### Task 7: Standard packages and `PortableEngine<C>`

**Status:** partly done: the c-like and object-oriented packages landed in #1158; PortableEngine<C> is not started. `PortableEngine<C>` is the type of the generated portable engine (`build`, `parse`, `project`, `render`, `kinds`, `is`) over a composition, per the generated-portable-builders spec: one type, shared with the single-grammar engine.

**Files:**
- Create: the approved packages, each a feature folder under `packages/types/src/vocabulary/features/` with no content of its own
- Modify: `@sittir/types`, adding `PortableEngine<C extends object = {}>`, where `{}`, no features, is the core
- Test: `packages/types/tests/portable-engine.test-d.ts`

**Interfaces:**
- Produces: `PortableEngine<C>`, the portable surface over `Contract<C>`. A grammar engine is assignable to `PortableEngine<C>` exactly when its features include `C`.
- Outside the composition, a value reads as its nearest ancestor inside it (the `SubKindOf` rule), else as its namespace's opaque member.
- The level unions (`V.X.Any`) gate here, where `C` is concrete: the generic vocabulary can't gate them, since a plain kind doesn't relate to a deferred feature conditional and parent and child interfaces stop fitting. A contract never reads content outside its composition as a lacked kind.

- [ ] **Step 1: The failing tests:**
  - under `Contract<PythonFeatures>`, `Declaration.Any` doesn't admit `Struct`, and a struct read from a grammar that has Structs reads as its nearest ancestor in the composition or as the namespace's opaque member;
  - the python engine is assignable to `PortableEngine` (the core);
  - the rust engine isn't assignable to a package containing a feature rust lacks;
  - under `PortableEngine<C>`, a python-only subkind reads as its nearest ancestor in `C`;
  - an opaque read value passes through a build input.
- [ ] **Step 2: Run them.** They fail.
- [ ] **Step 3: Implement it, then run** the type tests and the workspace type-check.
- [ ] **Step 4: Commit.**

### Task 8: Language features, generated and shipped with the grammar

**Files:**
- Modify: `packages/codegen/src/emitters/overlays/portable/grammar-map.ts`, to emit `<Grammar>LanguageFeatures`
- Generated: `packages/<lang>/src/portable-features.ts`
- Test: `packages/types/tests/language-features.test-d.ts`, with a fixture grammar

**Interfaces:**
- Produces: claims that name a path outside the shared vocabulary, inside a vocabulary namespace, generate a language feature in the grammar package. `G['features']` includes it, and its paths join their namespace.
- Nothing is converted: today's unclaimed kinds stay `V.Unmapped` until a claim maps them.

- [ ] **Step 1: The failing tests** (fixture):
  - a claimed fixture-only `statement.<x>` reads and builds under the fixture's map;
  - under a contract it reads as an opaque `statement`;
  - two grammars adding the same path fails a guard row that says the path belongs in the vocabulary.
- [ ] **Step 2: Run them.** They fail. **Step 3: Implement.** **Step 4: Run** the type tests and the census, which stays at 0 for language features. **Step 5: Commit.**

### Task 9: Final gates and the PR

- [ ] **Step 1: Confirm the removals.** Nothing named `GrammarContext.slots`, `Seated`, `gate.RequiredBy`, `OwnSlots` or `Fit` is left. In an input, a member's node arm is the grammar's node types for its paths (`G['nodes']`), never `{ $type: number }`.
- [ ] **Step 2: Run every gate:**
  - the census at 0 and the raw-arm count at or below base;
  - the generated portable modules type-check, with the emit diagnostics at or below their ceilings. This replaces the conformance mirror and its diagnostics ratchet (the generated-portable-builders plan, Task 7);
  - validate history against base;
  - the full suite and the workspace type-check;
  - type-check times against the baseline table.
- [ ] **Step 3: Open the PR to master** with `Owner: sittir-design` on the first line, the counts table, the removals and the times. Brainstorm reviews, and the merge needs the maintainer's word.

## Notes

- Marker-only features with no paths or members, held trivially: OperatorOverloading, ManifestTyping, Elisions and Overloading.
- A call holds its type arguments and a loop or block its label, in every grammar that has them (the user, 2026-11-12: "On the call" and "On the loop").
- The PR shape (one PR, or one per task) is the maintainer's call when Task 1 comes back. The tasks are ordered so each one leaves every gate green on its own.
