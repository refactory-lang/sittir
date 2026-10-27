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
  - Picks come from a table derived from the routes. The first arm whose tests pass is built. The order is derived from data, narrower member sets first, and is never refused at run time as ambiguous.
  - Arms still tied after the derived steps take an authored default. In the grammar when the grammar's own surface reads it (a render-option preference, a default the loose surface wants). In bindings, `(#set! default)` on the claim, when only the pick reads it. With neither, the tie is a codegen diagnostic. There is no inference from text.
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
| (c) | 4 | each bound grammar's `portable-build.ts`, `node-model-portable.json5` and `node-model.json5` (seats and mount calls) |
| (c2) | 5 | nothing new: runtime only |
| (d) | 6 | the lane's baseline row |
| (e) | 7 | adds each bound grammar's `.sittir/portable.typed.ts` |

(e) is split from (d), since promoting the probe's generator is its own review, and (c2) from (c), since the seats and mounts Task 4 needed made (c) a review of its own. Each PR stacks on the one before it.

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
  export type PortableCallShape = 'config' | 'spread' | 'text' | 'constant' | 'direct' | 'elements' | 'forwarded' | 'placed';
  export interface PortableSlotStep { readonly key: string; readonly builder?: string }
  export interface PortableMemberStep { readonly name: string; readonly steps: readonly PortableSlotStep[]; readonly multiple: boolean; readonly leaf?: string }
  export interface PortablePreset { readonly steps: readonly PortableSlotStep[]; readonly kind?: number; readonly text?: string; readonly builder?: string }
  export interface PortableFlagStep { readonly presets: readonly PortablePreset[] }
  export type PortablePickTest =
  	| { readonly absent: readonly string[]; readonly required: readonly string[] }
  	| { readonly flag: string; readonly set: boolean }
  	| { readonly member: string; readonly kinds: readonly number[] }
  	| { readonly text: string }
  	| { readonly variant: string; readonly value: number; readonly default?: true };
  export interface PortableBuildArm {
  	readonly kind: number;
  	readonly builder?: string;
  	readonly seated?: PortableCallShape;
  	readonly scalar?: 'integer' | 'float';
  	readonly when: readonly PortablePickTest[];
  	readonly holders?: readonly (readonly [holder: number, key: string])[];
  	readonly members: readonly PortableMemberStep[];
  	readonly presets: readonly PortablePreset[];
  	readonly flags: Readonly<Record<string, PortableFlagStep>>;
  	readonly template?: { readonly member: string; readonly pattern: string; readonly holes: readonly string[] };
  }
  export interface PortableBuildPath { readonly root: boolean; readonly arms: readonly PortableBuildArm[] }
  export interface PortableBuildTable { readonly builders: Readonly<Record<string, PortableCallShape>>; readonly paths: Readonly<Record<string, PortableBuildPath>> }
  ```

  - `builder` is the kind's stamped `builderPath`, dotted, and `builders` holds each one's stamped `factoryShape`. A fixed literal has no builder and builds as its kind id. A kind its holder's builder builds (an alias the holder admits by content, a seated config) has no builder either, and `seated` says whether the holder takes its config or its sole value.
  - A step's `builder` is the kind the next step sits in. It is absent when that kind has no builder, and its config then fills the key as the holder's seat takes it.
  - `leaf` is the slot's default leaf builder: the one text leaf the slot admits (`slotResolverKinds`), with numeric leaves and variant forms left out.
- Modify: `packages/codegen/src/bindings/pinned-reader.ts` and `facts.ts`. One `#set!` reader serves `reason` and `default`. A claim at the pattern's top, or directly under a top-level grouping, with `(#set! default)` carries `ClaimFact.default`, set to the kind as authored. Binding can map two kinds onto one parser kind, as python's `lambda` and `lambda_within_for_in_clause` both bind to `lambda_expression`, so the pick matches an arm to the authored kind, not to the bound claim. On a supertype's claim, `(#set! default <form>)` names the form instead, so a default for forms that reach their path through the supertype's claim adds no claim of its own and moves no read.
- Create: `packages/codegen/src/emitters/overlays/portable/build.ts`, with `portableBuildTable(input)` and `emitPortableBuild(input)`. `input` is `{ routes, model, nodeMap, kindEntries, flagPlans }`, and the result is the table (or its source) and its `PickDiagnostic[]`.
  - Arms: one per (kind, path) entry with an own read entry. A kind with no parser id, a hidden kind and a supertype get none. A display kind's builder is its stored kind's.
  - Presets: from the entry's pins, its single-kind child tests, and its claim's `eq` predicates on a slot (an `eq` on a fixed literal's own text is its text test). A preset that another preset's steps extend is dropped. A preset builder takes the member routed to its steps or those beneath them. A claim's template fills `template`; its other predicates stay the path's read tests.
  - Flag steps: a presence flag presets its token's kind id, and a kind flag presets its kind.
  - `when`, tried in order, with the first passing arm taken:
    1. fixed text;
    2. scalar type, which groups the arms: the one arm per scalar type that builds a number (the variant's or the bindings default) is marked by `scalar`, outside `when`;
    3. the variant default, which is the supertype's `optionDefaultSubtype ?? defaultVariantSubtype`, found by walking up `variantOf`;
    4. the flag the form implies (its plan is `ALWAYS`);
    5. presence, by `required`; arms one input could satisfy stay together;
    6. member element kinds, disjoint or nested, narrower first;
    7. the bindings default;
    8. holder.

    Every arm's `absent` lists the members the path's other arms have and it lacks, so no step's order lets an arm take a member it has no slot for. An arm admitted in fewer holder slots than its siblings gets `holders`. A kind a holder's kind-flag route presets leaves any path where another arm builds.
  - Diagnostics: `portable-pick-undecided`, `portable-default-redundant`, `portable-default-repeated` and `portable-default-unknown` (a default naming no arm at its path). `generate` returns them as grammar diagnostics, and `runCodegen` appends them to `.sittir/grammar-diagnostics.json`, the file the report's code ceilings read. Each has ceiling 0.
- Modify: `packages/codegen/src/compiler/model/node-map.ts`, adding the `optionDefaultSubtype` getter, which `from.ts`'s `defaultArmKindOf` also reads.
- Modify: `emitPortable` (returns the build source and its diagnostics), `generate.ts`, `run-codegen.ts` (writes `src/portable-build.ts`), and `engine.ts`'s `emitApi` (`hooks.portableBuild: () => import('./portable-build.js').then((m) => m.build)`). Also `packages/types/src/engine-api.ts` (`LanguageHooks.portableBuild?: () => Promise<PortableBuildTable>`).
- Vocabulary (by hand, then `tool vocabulary-features --write`):
  - the `static-storage` feature (`declaration.variable`'s `static` flag), composed by rust;
  - `paren`, `bracket` and `brace` refinements of `element.macro.token_tree`, its `delimited` and `pattern`, and `declaration.macro`.
- Bindings:
  - rust: `static_item`'s `static` flag; the delimiter refinement claims; the paren form named as the default on each token-tree and macro-definition supertype's claim; `(#set! default)` on `struct_pattern`'s own claim;
  - python: `with_clause_bare` named on `with_clause`'s claim; `(#set! default)` on `lambda_within_for_in_clause`'s claim;
  - typescript: `number_float_point` named on `number`'s claim, and `parenthesized_expression_sequence` on `parenthesized_expression`'s.
- Test: `packages/common/tests/portable-build-table.test.ts`, which loads each table through `hooks.portableBuild()` and the strict table through `hooks.tables.strict()`.

**Interfaces:**
- Consumes: `resolveRoutes`, `flagPlansOf`'s plans, `membershipKindsOf`, `slotResolverKinds`, `buildFactoryMap`'s shapes, `numberSignatures`, the stamped `builderPath`, `defaultVariantSubtype` and `optionDefaultArm`.
- Produces: `PortableBuildTable` per grammar through `hooks.portableBuild`; `emitPortableBuild`; `portableBuildTable`.

- [ ] **Step 1:** Write the failing tests over the generated rust, python and typescript tables:
  - Every builder an arm, a step or a leaf names resolves to a function in the strict table, and `builders` gives its shape.
  - `paths['declaration.struct']`: the brace and tuple arms are told apart by `{ member: 'body', kinds }` (the field lists), and the unit arm by `absent` holding `body`.
  - `paths['expression.binary.arithmetic.add'].arms[0].presets` is `[{ steps: [{ key: 'operator' }], kind: kinds.Plus }]`.
  - The `closure_parameter` arm of `declaration.parameter` has no builder and `seated: 'direct'`.
  - `paths['identifier.qualified'].root` is false in rust, whose arms have holders; a `scoped_type_identifier` arm is keyed by `[kinds.ReferenceType, 'type']`.
  - `paths['clause.case.match']`:
    - `match_arm_block_ending` comes before `match_arm_with_comma`, by `{ member: 'body', kinds }`;
    - `last_match_arm` is keyed by `match_block_arms`' `lastArm`.
  - python's `pattern.list` arms are `list_pattern` and `case_list_pattern`, with no hidden kind.
  - `paths['declaration.function'].arms[0].flags.async.presets` builds the `async` keyword through `functionModifiers`.
  - rust's `type.primitive` `u8` arm has no builder, and its `when` is `[{ text: 'u8' }]`.
  - rust's `expression.reference` mut arm is picked by `{ flag: 'exclusive', set: true }`.
  - python's `literal.string.escape` builds `escape_sequence_simple` by default, ahead of the other escape forms.
  - Each grammar's `grammar-diagnostics.json` holds no `portable-*` code.
  - rust's `declaration.variable` tells `static_item` from `let_declaration` by `{ flag: 'static', set }`.
  - The bindings defaults order their ties: `struct_pattern` before `tuple_struct_pattern`, python's `with_clause_bare` first, typescript's `parenthesized_expression_sequence` first.
  - typescript's sequence form carries `{ absent: ['type'], required: [] }`, so a structure with a type reaches the typed form.
  - typescript's `identifier` has no `private_property_identifier` arm, and `expression.member`'s `privateName` flag presets `privatePropertyIdentifier`.
  - rust's `element.macro.token_tree` builds `token_tree_paren` by default, and `element.macro.token_tree.bracket` builds `token_tree_bracket`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement the files above.
- [ ] **Step 4:** Regenerate the five grammars.
  - The tests pass.
  - Validation history is compared row by row, with the row diff read first: rust's `static` presence claim moves the `static` token from kind id 36 to 128, shifting the ids between by one.
  - The import-graph test passes: the descriptor loads no build table.
  - **Stop rule:** if any grammar reports a pick diagnostic, stop before committing and send brainstorm the list (path, kinds, the holder slot). Do not raise the ceiling.
- [ ] **Step 5:** Pathspec commits, in order: the default directive; the vocabulary; the bindings, with the directive's named form (the commit hook checks regenerated outputs against the whole tree, so the named form lands with its first claims); then the emitter with the regenerated files. Open the PR.

### Task 4: `build` through the strict table

**Files:**
- Modify: `packages/types/src/portable.ts`, adding:

  ```ts
  export interface PortableStructure { readonly $path: string; readonly $flags?: readonly string[]; readonly $value?: string | number | bigint | boolean; readonly [member: string]: unknown }
  ```

  A member value is a structure, an array of them, a string (its slot's default leaf), a scalar, a kind id, or a node carried unchanged.
- Modify: `packages/types/src/portable.ts` and the emitter, so the table says where each value sits and how each builder is called (landed in (c)):
  - `PortableMemberStep` gains `seats` and loses `leaf`. A `PortableSeat` is `{ at, kinds?, leaf?, within?, many? }`: the holder kind and key the value is picked at, the kinds a value there has (only where the member has more than one seat), the leaf builder text goes through, and the containers the build wraps the value in, outermost first. A container (`PortableContainer { builder?, key, optional?, mounted? }`) is a kind with no read entry that the reader unwraps (`routes.containers`, which gains the element `slot`). A member's kinds for the pick are its seats' kinds, so step 6 of the pick reads through containers.
  - A form's builder path is its holder's mount: the sub-factory that builds the holder with the form seated in its slot. A step, container, preset or arm whose builder is a mount carries `mounted: PortableMount`, the mount's call: `none`, `holder`, `child`, `merge`, `keyed` or `keyedArgs`. `keyed` and `keyedArgs` (a `PortableKeyedMount`) also carry the `key` that takes the seated kind's input and that kind's call shape (`seats`). The call comes from `mountCallOf`, the classifier `polymorphs.ts` emits the combinator from; the node model's seat stamps it (`call`), with its nested sub-factories' calls (`nested`).
  - A nested combinator under a keyed mount (`exportStatementDefaultDeclaration.defaultKw.value`) takes its holder's input, so its record carries that call as `outer`, nearest holder first.
  - Each builder key is registered with one call shape. Codegen refuses a second.
- Create: `packages/common/src/portable/build.ts`, with `portableBuilder(context: PortableBuildContext): (structure: PortableStructure) => unknown`, where `PortableBuildContext` is `{ language, table, builders, kindName, readsAs }`:
  1. Pick the path's arm. A `$value` takes the arm whose `scalar` is its type (Task 5). Otherwise, under a holder, only arms with a seat there (`holders` include it, and the seat's `kinds` include the arm's kind) are candidates. At the root, only arms with no holders are, and the `when` tests decide among them.
  2. Apply presets and flag steps, then place each member along its steps. A member with several routes takes the one that reaches furthest into what the presets and earlier members built, then the one its value's shape fits. A value is wrapped in its seat's containers. An empty list leaves out the first optional step, then the first optional container.
  3. Mounts: a step's mount builds its frame's holder. A `keyed` mount's seated input is a sub-frame shaped by `seats`, and `outer` walks up to the frame that is built.
  4. Call each frame's builder once, from the innermost out.
  - A template arm builds its member's text from its holes. A claim's fixed text is already a preset.
  - A built node must pass the path's read tests, which carry the claim's other predicates (a pattern, a kind test). The build reads the node back through the path's guard and refuses a node that doesn't read as its path.
  - **Whole-text tests (brainstorm, 2026-10-27):** a test on a built composite's whole text (rust's `b"…"` for `literal.string.bytes`) reads the node's rendered text. That's one native render call, made only for those tests. The round-trip lane (Task 6) checks it against the parsed read.
  - `$flags` naming a flag the arm has no step for is refused with the path, the flag and the kind.
- Modify: `packages/common/src/portable/runtime.ts`. `portableRuntime<API>(engine: Engine<API, 'strict'>): Promise<PortableRuntime<API>>` returns `{ engine, is, build }`:
  - the caller makes `engine`, a strict engine, which loads the strict table lazily;
  - `is` is `portableRuntimeTree(engine.language)`;
  - `build(structure)` is `buildPortable(await hooks.portableBuild(), engine.build, structure)`.

  It throws for a language with no bindings, as `assemblePortableEngine` does.
- **Constraint (brainstorm, 2026-10-27):** the portable build builds through a storage and construction the caller chose (shared arena, ruling 15), never ones locked to the defaults. It builds through the caller's engine. When `build` is exported on the portable engine, that engine either takes `NodeStorageOptions` itself or builds through a language engine the caller made.
- Modify: `packages/common/src/engine-boundary.ts` (export `portableRuntime`, `PortableRuntime`).
- Test: `packages/rust/tests/portable-build.test.ts`, `packages/python/tests/portable-build.test.ts`, `packages/typescript/tests/portable-build.test.ts`; the seats and mounts in `packages/common/tests/portable-build-table.test.ts`.

**Interfaces:**
- Consumes: `PortableBuildTable`, `hooks.portableBuild`, the strict table.
- Produces: `portableRuntime`, `PortableRuntime { engine; is; build(structure: PortableStructure): unknown }`, `portableBuilder`.

- [ ] **Step 1:** Write the failing tests. Each renders through `runtime.engine.render`:
  - `{ $path: 'declaration.function', name: 'f', parameters: [], body: { $path: 'statement.block', statements: [] } }` renders `fn f() {}`;
  - the same with `$flags: ['async']` renders `async fn f() {}`;
  - `$path: 'declaration.function.public'` renders `pub fn f() {}`;
  - `{ $path: 'expression.binary.arithmetic.add', left: 'a', right: 'b' }` renders `a + b`;
  - `{ $path: 'declaration.struct', name: 'S', body: [] }` builds a `struct_item_brace`, and the same without `body` builds `struct_item_unit`;
  - `{ $path: 'identifier.qualified', ... }` at the root throws an error naming `identifier.qualified` and its holders; the same structure in a type slot builds `scoped_type_identifier` (Review Focus 2);
  - `{ $path: 'declaration.class', ... }` on rust throws naming the path and `rust` (Review Focus 1);
  - `$flags: ['static']` on `declaration.function` throws naming the flag and `function_item`;
  - python: `{ $path: 'declaration.function', name: 'f', parameters: [], body: [...] }` renders `def f():` and its body;
  - one build per mount call the grammars use:
    - `merge`: rust's `a..=b`;
    - `keyed`: typescript's `a => x` and `a in b`, and python's `except E as e: pass`;
    - `child`: rust's `pub(crate) fn f() {}`;
    - nested under `keyed`: `export default x` and python's `except E, F: pass`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Regenerate. The combinators stay byte-identical, and the node models gain only the seat fields. Rerun the tests, then the suite. Expected: PASS.
- [ ] **Step 5:** Pathspec commits: the table, then the runtime. Open PR (c).

### Task 5: The scalar adaptation

**Files:**
- Modify: `packages/common/src/portable/build.ts` (the `scalar` arm and the `$value` hand-off)
- Test: the two `portable-build.test.ts` files

**Interfaces:**
- Consumes: the `scalar` arm and its builder; the form's stamped `numberShape` (the source for splitting a value).

The rules:
- An integer path's `$value` is `number | bigint`. A `number` that is not a safe integer is refused (Review Focus 3).
- A float path's `$value` is `number`.
- `literal.number` itself picks integer for a bigint or an integral `number`, and float otherwise.
- A boolean builds as its fixed literal's kind id (`true` or `false`).
- The value reaches the picked arm by its builder's shape:
  - a text-shaped arm takes it unchanged (rust's float, python's plain decimal, typescript's decimal);
  - a form with one numeric slot takes it there (rust's integers' `content`, and the hex, binary and octal `content` of python and typescript);
  - **split floats (brainstorm, 2026-10-27, option (a)):** a form whose members are `integer`, `fraction` and `exponent` (python's and typescript's point, leading-point and scientific forms) takes it split by the form's `numberShape`. numberShape is the stamped source, so the split adds no derivation. Refusing the value would refuse a natural input. A numeric leaf builder would break the rule that leaf builders take strings only.

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
    - `literal.number.float` with `$value: 2` renders `2.0`;
    - `literal.number.float` with `$value: 1.5` renders `1.5`, and `literal.number.float.scientific` with `$value: 1e21` renders in the scientific form;
  - typescript: `{ $path: 'literal.number', $value: 1.5 }` renders `1.5`, through `number_float_point`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Rerun the tests, then the suite. Expected: PASS.
- [ ] **Step 5:** Pathspec commit. Open PR (c2), stacked on (c).

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
