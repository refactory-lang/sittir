# Runtime Bindings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline; this repo does code work without subagents). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** the wiring plan's stage 3 (`2026-10-10-grammar-bindings-wiring.md`). Each bound grammar gets a portable runtime: flag guards, a build table with its pick, a runtime `build` through the strict builders, and a member reader. The runtime is proved over the corpus by a round-trip lane, and nothing new reaches the public portable API. A vocabulary-typed module is generated outside each package, and its error count is a ratchet that only falls; export happens at zero.

**Architecture:**
- Codegen derives everything from the one route resolution (`resolveRoutes`), as `kinds` and `is` already are:
  - the flag plans (already emitted as `queryFlags`) ride on the rows;
  - a new per-grammar build table (`src/portable-build.ts`) holds, per vocabulary path, its pick arms, each arm's builder, member steps, presets and flag steps.
- The runtime lives under `packages/common/src/portable/` and is reached only through the engine boundary (`@sittir/common/engine`), never `@sittir/common/portable` or an engine. `portableRuntime(language)` creates a strict engine, which loads the strict table lazily, and loads the build table lazily too.
- The input to `build` is runtime data: a structure tree, built top-down, so a holder builds each member knowing the slot it fills.

**Tech Stack:** TypeScript ESM, vitest, the codegen emitters (`packages/codegen/src/emitters/overlays/portable/`), the native engine, the validation tools (`packages/tools`).

**Spec:**
- `docs/superpowers/specs/2026-10-06-binding-generator-design.md` §2.4, §2.5, §4;
- `docs/superpowers/specs/2026-09-13-bindings-and-vocabulary-design.md` §3.3, §3.4, §4.4, §8;
- the generator plan's rule on rejected members and its build stage, with the scalar follow-up (`2026-10-06-binding-generator.md`);
- the census: `docs/superpowers/probes/2026-10-25-runtime-bindings-census/`, rerun at `801aa76b7`.

## Rulings this plan executes

- **Order (user, 2026-10-25):**
  - runtime first, unexported;
  - no public portable `build` or typed view until the vocabulary-typed module has zero errors in every grammar;
  - that count is the ratchet.
- **Picks (generator plan, build stage; brainstorm 2026-10-27):**
  - Picks come from a table derived from the routes, and a pick the table cannot decide is a codegen diagnostic. There is no default arm and no inference from text.
  - A form told apart only by a spelling is picked by the render options, the grammar default when none are given.
  - A group the holder decides extends the varying-leaves ruling:
    - the path gets no root entry;
    - its build waits until it lands in a slot, and the pick is keyed by (holder kind, slot);
    - a root build of it is refused by name;
    - a slot the pick still can't decide is the codegen diagnostic.
- **The table (brainstorm 2026-10-27):** strict. The pick and the routes make the one kind decision. A leaf in a slot takes that slot's default leaf builder, so the loose table's string lift never makes a second decision.
- **Unexported (user, 2026-10-25; brainstorm 2026-10-27):**
  - the flag guards and `build` sit on an internal tree under `common/src/portable`, off `portable.is` and `portable.kinds`;
  - the typed module is generated to each grammar's `.sittir/`, outside `src` and the package exports;
  - a tools ratchet keeps per-grammar error ceilings that start at the first count and only fall.
- **Flags (bindings spec §3.4):** the `Flags` enum is written to `packages/common/src/portable/flags.ts`, so `@sittir/types` stays type-only.
- **Exclusions (builder exclusions spec):** steps ship unnarrowed, and no exclusion is derived from a rule.

## Global Constraints

- Generated outputs (`packages/<lang>/src/*`, `packages/<lang>/.sittir/*`, `rust/crates/sittir-<lang>/src/*`) are never hand-edited. Change the emitter and regenerate.
- No explanatory comments in `packages/{codegen,common,tools,types}/src`. The why goes in commit messages, and the docs peer writes glossary entries after merge. Public API declarations carry JSDoc. This plan adds none.
- Importing a descriptor loads no engine, factories, wrap, portable rows or build table (the import-graph test).
- No Proxy. A vocabulary path is named once, by its full path.
- Hidden kinds have no builders. A fixed literal stays a kind id and never becomes a node.
- Every codegen change runs the three-way gate: targeted probes, validation history compared row by row (`+0 −0` except the new lane), and the full suite. Type-only changes also run the tsc-backed tests.
- Ratchets only tighten. The `portable-pick-undecided` diagnostic's ceiling is 0.

## Review Focus

1. **A structure whose `$path` the grammar doesn't read** (a python-only path built through rust's runtime): refused with the path and the grammar named, never built as a neighbouring kind. Test in Task 4.
2. **A holder-decided path built at the root** (`identifier.qualified` alone): refused by name. Inside a slot whose kinds still admit two arms, the error comes at codegen, never at run time. Tests in Tasks 3 and 4.
3. **Integers above 2^53, and bigint input:**
   - read as `bigint` and built back with every digit;
   - a `number` given to a float form keeps its fraction;
   - a non-integral `number` given to an integer-only path is refused.

   Test in Task 5.
4. **A flag guard on a path whose kind has no plan for the flag:** answers false, and never throws, whatever the node's language. Test in Task 2.
5. **A parsed node of a kind no path reads**, inside a member: the reader carries it as the node, and the build hands it to the strict builder unchanged, so a round trip through unclaimed regions keeps them. Test in Task 6.

## File structure

| file | responsibility |
| --- | --- |
| `packages/common/src/portable/flags.ts` (generated) | the `Flags` enum, moved from `packages/types/src/vocabulary/flags.ts` |
| `packages/common/src/portable/vocabulary-paths.ts` (generated) | adds `vocabularyFlags`, every (path, flag) the vocabulary declares |
| `packages/common/src/portable/classify.ts` | `planSubjects` (texts, types, children for a node) and `flagHolds` |
| `packages/common/src/portable/runtime.ts` | `portableRuntime(language)`: the internal tree (`is` with flag leaves), `read`, `build` |
| `packages/common/src/portable/build.ts` | the build walk: pick, presets, flag steps, members, scalars |
| `packages/types/src/portable.ts` | `PortableRows.flags`; the build table types; `PortableStructure` |
| `packages/codegen/src/emitters/overlays/portable/build.ts` | `emitPortableBuild`: the build table and the pick, and the pick diagnostic |
| `packages/codegen/src/emitters/overlays/portable/typed.ts` | the vocabulary-typed module, promoted from the probe's `generate.mts` |
| `packages/tools/src/validate/portable-round-trip.ts` | the lane |
| `packages/tools/src/portable/conformance.ts` | `sittir tool portable-conformance`, promoted from the probe's `conformance.py` |

## Stack

| PR | tasks | regenerates |
| --- | --- | --- |
| (a) | 1, 2 | the path list, the flags file, each bound grammar's `portable.ts` |
| (b) | 3 | adds each bound grammar's `portable-build.ts` |
| (c) | 4, 5 | nothing new: runtime only |
| (d) | 6 | the lane's baseline row |
| (e) | 7 | adds each bound grammar's `.sittir/portable.typed.ts` |

(e) is split from (d), since promoting the probe's generator is its own review. Each PR stacks on the one before it.

---

### Task 1: `Flags` moves to common

**Files:**
- Modify: `packages/codegen/src/bindings/flags.ts` (`FLAGS_PATH` becomes `join(PACKAGES_DIR, 'common', 'src', 'portable', 'flags.ts')`), `packages/tools/src/inventory/index.ts` (the writer and `--check` read the new path)
- Delete: `packages/types/src/vocabulary/flags.ts`
- Modify: the one type test that reads `Flags` (it imports from `@sittir/common/portable`)
- Modify: `packages/common/src/portable/index.ts` (`export { Flags } from './flags.ts'`)

**Interfaces:**
- Produces: `Flags` from `@sittir/common/portable`. Its members and bits are byte-identical to today's (29 flags, `Prefix = 1 << 19`).

- [ ] **Step 1:** Write the failing test `packages/common/tests/portable-flags.test.ts`:
  - `Flags.Async === 1 << 1`;
  - `Flags.Prefix === 1 << 19`;
  - `Object.keys(Flags).filter((k) => isNaN(Number(k))).length === 29`.
- [ ] **Step 2:** `pnpm vitest run packages/common/tests/portable-flags.test.ts`. Expected: FAIL (no export).
- [ ] **Step 3:** Move the writer's path, run `tool bindings-inventory --write`, and delete the old file. Its folder reads every top-level file as a vocabulary source, so the removal leaves the vocabulary unchanged.
- [ ] **Step 4:**
  - Rerun the test. Expected: PASS.
  - `tool bindings-inventory --check`. Expected: clean.
  - `pnpm run type-check`. Expected: 0 errors.
- [ ] **Step 5:** Pathspec commit.

### Task 2: Flag guards on the internal tree

**Files:**
- Modify: `packages/codegen/src/bindings/vocabulary-paths.ts`. `emitVocabularyPaths` also writes `export const vocabularyFlags = Object.freeze([...] as const)`: one `[path, flag]` per vocabulary path and each flag `vocabulary.members(path)` declares, the flag spelled `snake(flag)`, sorted by `path.flag`.
- Modify: `packages/types/src/portable.ts`. `PortableRows` gains `readonly flags: QueryFlags`.
- Modify: `packages/codegen/src/emitters/overlays/portable/surface.ts`. `rows` is `Object.freeze({ table, querySlots, flags: queryFlags })`, and `api.ts` keeps passing `queryFlags` from the same const.
- Modify: `packages/common/src/portable/classify.ts`. Extract `planSubjects(rows: PortableRows, node: Node): PlanSubjects` from `conditionHolds`, adding `children` (a slot's nodes, each with its own subjects), and add `flagHolds(rows: PortableRows, node: Node, flag: string): boolean`.
- Create: `packages/common/src/portable/runtime.ts`. `portableRuntimeTree(language: PortableLanguage): PortableGuardTree<string, LanguageGuard>` is `portableTrees([...vocabularyPaths, ...flagPaths], guardOf).is`:
  - a flag leaf `P.f` holds when `readsAs(rows, P, value)` and `flagHolds(rows, value, f)`;
  - a path leaf is the language guard (`portableGuardsOf`'s test, one function shared, not copied).
- Modify: `packages/common/src/engine-boundary.ts` (export `portableRuntimeTree`). `@sittir/common/portable` and the engines are untouched.

**Interfaces:**
- Consumes: `readsAs`, `holds`, `portableTrees`.
- Produces: `vocabularyFlags`, `flagHolds`, `planSubjects`, `portableRuntimeTree`.

- [ ] **Step 1:** Write the failing tests, `packages/rust/tests/portable-flag-guards.test.ts`:
  - `is.declaration.function.async(fnOf('async fn f() {}'))` is true;
  - the same guard on `fn f() {}` is false;
  - `is.declaration.function.public.async` holds for `pub async fn f() {}` and not for `async fn f() {}`;
  - `is.declaration.function.const` on a python `def f(): pass` node, from a python engine's runtime tree, is false and does not throw (Review Focus 4);
  - `Object.keys(portable.is.declaration.function)` has no `async` key: the public tree is unchanged;
  - for every `[path, flag]` in `vocabularyFlags`, the runtime tree has a function at `path.flag`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement the files above. `flagHolds` answers false for a kind with no row, no plan or a `null` plan (the census counts 0 null plans).
- [ ] **Step 4:** Regenerate the five grammars.
  - The tests pass.
  - Validation history: `+0 −0` in every grammar.
  - Only the path list and the bound grammars' `portable.ts` change (`rows` gains `flags`).
- [ ] **Step 5:** Pathspec commit with the regenerated files. Open PR (a).

### Task 3: The build table and the pick

**Files:**
- Modify: `packages/types/src/portable.ts`, adding:

  ```ts
  export interface PortableSlotStep { readonly key: string; readonly builder?: string; readonly container?: string }
  export interface PortableMemberStep { readonly name: string; readonly steps: readonly PortableSlotStep[]; readonly multiple: boolean; readonly leaf?: string }
  export interface PortablePreset { readonly steps: readonly PortableSlotStep[]; readonly text?: string; readonly kind?: number }
  export interface PortableFlagStep { readonly presets: readonly PortablePreset[] }
  export type PortablePickTest =
  	| { readonly present: readonly string[]; readonly absent: readonly string[] }
  	| { readonly member: string; readonly kinds: readonly number[] }
  	| { readonly scalar: 'integer' | 'float' | 'boolean' }
  	| { readonly text: string }
  	| { readonly option: string; readonly value: string };
  export interface PortableBuildArm {
  	readonly kind: number;
  	readonly builder?: string;
  	readonly when: readonly PortablePickTest[];
  	readonly holders?: readonly (readonly [holder: number, key: string])[];
  	readonly members: readonly PortableMemberStep[];
  	readonly presets: readonly PortablePreset[];
  	readonly flags: Readonly<Record<string, PortableFlagStep>>;
  	readonly predicate?: { readonly member: string; readonly op: 'eq' | 'match'; readonly text: string };
  	readonly template?: { readonly member: string; readonly pattern: string };
  }
  export interface PortableBuildPath { readonly root: boolean; readonly arms: readonly PortableBuildArm[] }
  export interface PortableBuildTable { readonly paths: Readonly<Record<string, PortableBuildPath>> }
  ```

  - `builder` is the kind's key in the strict table (its `irKey`), and is absent for a fixed literal, which builds as its kind id.
  - `leaf` is the slot's default leaf builder key, for a member given text.
  - `container` is the strict key of a container a step builds around its elements (`ContainerUnwrap`).
- Create: `packages/codegen/src/emitters/overlays/portable/build.ts`. `emitPortableBuild(routes: GrammarRoutes, nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[]): { readonly source: string; readonly diagnostics: readonly PickDiagnostic[] }`:
  - Arms: one per (kind, path) entry with an own read entry. A form counts as itself, also when its base is hidden (the census's `_simple_pattern` rows are `case_list_pattern` and `case_tuple_pattern`). Hidden and supertype kinds get no arm.
  - Presets:
    - from the entry's pins (`text`);
    - from its child-kind tests: the `via` steps built as kinds, ending in the tested kind. A kind test that admits several kinds and that no member decides is a `PickDiagnostic`.
  - Flag steps: from the kind's flag routes (`flagPlansOf`'s inputs). A presence flag presets its token, and a kind flag presets its kind.
  - Member steps: from the member routes' `path`, each step's key the slot's property name. A nested step names the intermediate kind's builder.
  - Text predicates and templates are copied from the read entry.
  - `when`, tried in order:
    1. member presence;
    2. a member's value kinds;
    3. a scalar's type;
    4. a fixed literal's text, through the enum's text table, so the structure's `$value` names the arm;
    5. the render option of the delimiter site `planRenderOptions` registers for the group's forms (no second derivation).

    Arms that none of these split are tried by holder. Every holder slot whose admitted kinds hold exactly one of the group's arms gets an entry in `holders`, and the path's `root` is false. A slot that admits two or more of the group's arms and that nothing above splits is a `PickDiagnostic`.
- Modify: `packages/codegen/src/emitters/overlays/portable/index.ts` (`emitPortable` returns `build`), the file writer for `src/portable-build.ts`, `api.ts`'s emitter (`hooks.portableBuild: () => import('./portable-build.js').then((m) => m.build)`), `packages/types/src/engine-api.ts` (`LanguageHooks.portableBuild?: () => Promise<PortableBuildTable>`).
- Diagnostics: `portable-pick-undecided`, recorded with the codegen diagnostics the code ceilings read (`checkCodeCeilings`), ceiling 0 for every bound grammar.
- Test: `packages/codegen/src/emitters/overlays/portable/__tests__/build.test.ts`.

**Interfaces:**
- Consumes: `resolveRoutes`, `flagPlansOf`'s route lowering, `membershipKindsOf`, `planRenderOptions`, `kindDiscriminantExpr`.
- Produces: `PortableBuildTable` per grammar through `hooks.portableBuild`; `emitPortableBuild`.

- [ ] **Step 1:** Write the failing tests over the generated rust, python and typescript tables:
  - `paths['declaration.struct']` has arms for `struct_item_brace`, `struct_item_tuple` and `struct_item_unit`. The brace and tuple arms are told apart by `{ member: 'body', kinds }`, and the unit arm by the body's absence.
  - `paths['expression.binary.arithmetic.add'].arms[0].presets` holds `{ steps: [{ key: 'operator' }], text: '+' }`.
  - `paths['declaration.parameter']` has an arm for `closure_parameter` whose builder is `closureParameter`.
  - `paths['identifier.qualified'].root` is false in all three grammars. Rust's arms have holders, and one of them is a `scoped_type_identifier` arm keyed by a type slot.
  - `paths['clause.case.match']`:
    - the `last_match_arm` arm's holders hold `match_block_arms`' `lastArm` key;
    - the comma and block-ending forms are split by `{ member: 'body', kinds }`.
  - Python's `paths['pattern.list']` arms are `list_pattern` and `case_list_pattern`, by holder, with no `_simple_pattern`.
  - `paths['declaration.function'].arms[0].flags.async.presets` builds the `async` token through `function_modifiers`.
  - Each grammar emits 0 `portable-pick-undecided` diagnostics.
  - Rust's macro delimiter forms are split by `{ option, value }`, with the grammar's default arm first.
  - Rust's `paths['type.primitive']` arms are fixed literals split by `{ text }`: the `u8` arm has no builder and its kind is `u8`'s kind id.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement `emitPortableBuild` and the wiring.
- [ ] **Step 4:** Regenerate the five grammars.
  - The tests pass, and validation history is `+0 −0`.
  - The import-graph test passes: the descriptor loads no build table.
  - **Stop rule:** if any grammar reports a `portable-pick-undecided`, stop before committing and send brainstorm the list (path, kinds, the holder slot). Do not raise the ceiling.
- [ ] **Step 5:** Pathspec commit with the regenerated files. Open PR (b).

### Task 4: `build` through the strict table

**Files:**
- Modify: `packages/types/src/portable.ts`, adding:

  ```ts
  export interface PortableStructure { readonly $path: string; readonly $flags?: readonly string[]; readonly $value?: string | number | bigint | boolean; readonly [member: string]: unknown }
  ```

  A member value is a structure, an array of them, a string (its slot's default leaf), a scalar, a kind id, or a node carried unchanged.
- Create: `packages/common/src/portable/build.ts`, with `buildPortable(table: PortableBuildTable, strict: object, structure: PortableStructure, at?: readonly [holder: number, key: string]): unknown`:
  1. Pick the path's arm. With `at`, only arms whose `holders` include `at`, or that have no holders, are candidates; the `when` tests decide among them.
  2. Build each member through its steps, recursing with `at` set to the member's last step.
  3. Apply presets and flag steps.
  4. Call the arm's strict builder once.
  - A predicate arm refuses text its predicate rejects, and a template arm builds the member's text from its holes.
  - `$flags` naming a flag the arm has no step for is refused with the path, the flag and the kind.
- Modify: `packages/common/src/portable/runtime.ts`. `portableRuntime<API>(engine: Engine<API, 'strict'>): Promise<PortableRuntime<API>>` returns `{ engine, is, build }`:
  - the caller makes `engine`, a strict engine, which loads the strict table lazily;
  - `is` is `portableRuntimeTree(engine.language)`;
  - `build(structure)` is `buildPortable(await hooks.portableBuild(), engine.build, structure)`.

  It throws for a language with no bindings, as `assemblePortableEngine` does.
- **Constraint (brainstorm, 2026-10-27):** the portable build builds through a storage and construction the caller chose (shared arena, ruling 15), never ones locked to the defaults. It builds through the caller's engine. When `build` is exported on the portable engine, that engine either takes `NodeStorageOptions` itself or builds through a language engine the caller made.
- Modify: `packages/common/src/engine-boundary.ts` (export `portableRuntime`, `PortableRuntime`).
- Test: `packages/rust/tests/portable-build.test.ts`, `packages/python/tests/portable-build.test.ts`.

**Interfaces:**
- Consumes: `PortableBuildTable`, `hooks.portableBuild`, the strict table.
- Produces: `portableRuntime`, `PortableRuntime { engine; is; build(structure: PortableStructure): unknown }`, `buildPortable`.

- [ ] **Step 1:** Write the failing tests. Each renders through `runtime.engine.render`:
  - `{ $path: 'declaration.function', name: 'f', parameters: [], body: { $path: 'statement.block', statements: [] } }` renders `fn f() {}`;
  - the same with `$flags: ['async']` renders `async fn f() {}`;
  - `$path: 'declaration.function.public'` renders `pub fn f() {}`;
  - `{ $path: 'expression.binary.arithmetic.add', left: 'a', right: 'b' }` renders `a + b`;
  - `{ $path: 'declaration.struct', name: 'S', body: [] }` builds a `struct_item_brace`, and the same without `body` builds `struct_item_unit`;
  - `{ $path: 'identifier.qualified', ... }` at the root throws an error naming `identifier.qualified` and its holders; the same structure in a type slot builds `scoped_type_identifier` (Review Focus 2);
  - `{ $path: 'declaration.class', ... }` on rust throws naming the path and `rust` (Review Focus 1);
  - `$flags: ['static']` on `declaration.function` throws naming the flag and `function_item`;
  - python: `{ $path: 'declaration.function', name: 'f', parameters: [], body: [...] }` renders `def f():` and its body.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Rerun the tests, then the suite. Expected: PASS, with nothing regenerated.
- [ ] **Step 5:** Pathspec commit.

### Task 5: The scalar adaptation

**Files:**
- Modify: `packages/common/src/portable/build.ts` (the `scalar` pick test and the `$value` hand-off)
- Test: the two `portable-build.test.ts` files

**Interfaces:**
- Consumes: the numeric leaf builders, which already take `string | number | bigint` and spell the value by their form's shape (`numberShape`).

The rules:
- An integer path's `$value` is `number | bigint`. A `number` that is not a safe integer is refused (Review Focus 3).
- A float path's `$value` is `number`.
- `literal.number` itself picks integer for a bigint or an integral `number`, and float otherwise.
- A boolean builds as its fixed literal's kind id (`true` or `false`).
- The value goes to the picked form's leaf builder unchanged; no text is assembled here.

- [ ] **Step 1:** Write the failing tests:
  - rust:
    - `{ $path: 'literal.number', $value: 42 }` renders `42`;
    - `$value: 1.5` renders `1.5`;
    - `$value: 2n ** 70n` renders `1180591620717411303424`;
    - `{ $path: 'literal.number.integer.hex', $value: 255 }` renders `0xff`;
  - `{ $path: 'literal.number.integer', $value: 1.5 }` throws;
  - `{ $path: 'literal.boolean', $value: true }` returns the `true` kind id;
  - `{ $path: 'type.primitive', $value: 'u8' }` returns `u8`'s kind id, and `$value: 'u9'` throws naming the path and the text;
  - python:
    - `literal.boolean` false returns `False`'s kind id;
    - `literal.number.float` with `$value: 2` renders `2.0`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Rerun the tests, then the suite. Expected: PASS.
- [ ] **Step 5:** Pathspec commit. Open PR (c).

### Task 6: The member reader and the round-trip lane

**Files:**
- Modify: `packages/common/src/portable/runtime.ts`. `PortableRuntime.read(node: { readonly $type: number }): PortableStructure | unknown`:
  - `$path` is the classifier's path;
  - `$flags` are the flags whose plans hold;
  - members follow the routes in the build table's member steps, inverted;
  - a container member reads as an array;
  - a fixed literal reads as its kind id;
  - a varying leaf reads as its text;
  - a numeric or boolean leaf reads as its scalar, an integer beyond 2^53 as `bigint`;
  - a value no path reads is returned as its node (Review Focus 5).
- Create: `packages/tools/src/validate/portable-round-trip.ts`, with `runPortableRoundTrip(grammar: GrammarName): Promise<PortableRoundTripResult>`. Over the corpus, for each bound grammar, each entry is:
  1. parsed;
  2. read from the root through `read`;
  3. rebuilt through `build`;
  4. rendered;
  5. reparsed and compared, as built-render's AST match.

  `PortableRoundTripResult` has `total`, `pass` (rendered, reparsed and of the same kind), `astMatchPass`, and `errors` with the path and message.
- Modify: `packages/tools/src/commands.ts` (`GrammarCounts.portableRoundTrip`, run only for a bound grammar; the format line; the history row), `packages/tools/src/history.ts` (`portableRoundTripPass?`, `portableRoundTripTotal?`, `portableRoundTripAstMatchPass?`)
- Test: `packages/rust/tests/portable-read.test.ts`, `packages/tools/src/validate/__tests__/portable-round-trip.test.ts`

**Interfaces:**
- Consumes: `portableRuntime` (Tasks 4–5), `classifierOf`, `flagHolds`. The lane runs once per storage and construction pair the validation run names.
- Produces: `PortableRuntime.read`; the lane and its history fields.

- [ ] **Step 1:** Write the failing tests:
  - `read(fnOf('pub async fn f(a: u8) {}'))` has `$path: 'declaration.function.public'`, `$flags: ['async']`, a `name` of `'f'` and one parameter structure;
  - `build(read(n))` renders the same text for that function, for `a + b`, for `|a, mut b, _| a` and for `struct S { x: u8 }`;
  - a member holding an unclaimed kind reads as that node (`read(...).x === node.x()`), and builds back to the same text;
  - the lane test, on a two-entry fixture corpus, gives `total` 2 and both entries pass.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `pnpm run validate:native`.
  - Every existing row is `+0 −0`.
  - The lane's row is new, for rust, python and typescript, and is recorded as its baseline.
  - The PR body lists its failures by path.
- [ ] **Step 5:** Pathspec commit with the history row. Open PR (d).

### Task 7: The vocabulary-typed module and its ratchet

**Files:**
- Create: `packages/codegen/src/emitters/overlays/portable/typed.ts`, with `emitPortableTyped(routes: GrammarRoutes, vocabulary: Vocabulary, nodeMap: NodeMap): string`. It promotes `docs/superpowers/probes/2026-10-06-binding-generator/generate.mts` and emits:
  - `Ctx`, `ViewForm`, `VocabViews`, `ViewByKind`, `ViewOf` and `Backward` (spec §2.1);
  - one literal factory per read entry (§2.2);
  - the build entry types over `PortableStructure` (§2.4).

  It reads through `@sittir/common/engine`'s `portableRuntime`, never a second dispatch. The probe's listed deviations are gone: `$value` replaces `$text`, `$kind` is type-only, predicate claims are tested, and kinds without a bare factory build through the pick.
- Write: `packages/<lang>/.sittir/portable.typed.ts` and `packages/<lang>/.sittir/tsconfig.portable.json`, each bound grammar's own. Neither is in the package's `tsconfig` include or exports.
- Create: `packages/tools/src/portable/conformance.ts`, the `sittir tool portable-conformance [--grammar g]` command. It type-checks the module with the TypeScript API and sorts the errors by the causes of spec §4, as `conformance.py` does. Delete `conformance.py`.
- Create: `packages/tools/tests/portable-conformance-ratchet.test.ts`, holding per-grammar ceilings at the first measured counts. It fails when a count rises and asks for the ceiling to be lowered when a count falls.
- Test: `packages/codegen/src/emitters/overlays/portable/__tests__/typed.test.ts`

**Interfaces:**
- Consumes: `resolveRoutes`, `readVocabulary`, the build table types.
- Produces: the typed module and its count, the ratchet the export waits on.

- [ ] **Step 1:** Write the failing tests:
  - the emitter's output for rust declares `VocabViews['declaration.function']`, whose literal has `$type` as its only data member;
  - `portable-conformance --grammar rust` prints a count per cause and a total;
  - the ratchet test reads that total.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement. Record each grammar's first count as its ceiling in the ratchet.
- [ ] **Step 4:**
  - Regenerate.
  - Validation history is `+0 −0`, and the lane's row is unchanged.
  - The workspace type-check is unaffected, since the module is outside every package's include.
  - The tsc-backed tests pass.
- [ ] **Step 5:** Pathspec commit with the generated modules. Open PR (e).

## Not in this stack

- Exporting `build` and the typed views, and moving the typed module into the package: each grammar does this when its count reaches 0.
- Exclusions, which arrive with the builder exclusions primitive.
- `attach` (crossing), portable `parse` and `render`.
- Vocabulary synonyms (stage 4).
- The envelope-set flag (python's `static` through `decorated_definition`), which the census lists as not landed.
