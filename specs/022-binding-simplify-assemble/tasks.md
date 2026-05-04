# Tasks: De-hoisted NodeData Surface (Spec 022)

**Input**: Design documents from `/specs/022-binding-simplify-assemble/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Source of truth**: `docs/adr/0018-dehoist-nodedata-surface.md`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story (US0=Taxonomy, US1=Storage, US2=Accessors, US3=Frozen+$with, US4=$-methods, US5=Unified, US6=napi-direct, US7=Pipeline)

**Test discipline**: Tests are NOT optional in this codebase per Constitution
Principle IV. Native RT (3 modes), type-check, and `cargo build` are mandatory
gates after every phase. Each phase ends in a verification task that runs them.

---

## Phase 0: Setup

**Purpose**: Capture baseline, prepare diagnostic tooling. Numbered Phase 0 so
the implementation phases below align 1-to-1 with the spec/plan phase numbering.

- [ ] T001 Capture pre-Phase-1 baseline: run `pnpm test` and save `pnpm test 2>&1 | tee specs/022-binding-simplify-assemble/baselines/pre-phase-1.txt` (deferred — full RT runs at end of phase via T029)
- [x] T002 Capture pre-Phase-1 generated output snapshot: `git ls-files packages/{rust,typescript,python}/src | xargs git hash-object > specs/022-binding-simplify-assemble/baselines/pre-phase-1-hashes.txt` (48 files, hashes captured, byte-identity verified post-1abc)
- [x] T003 [P] Verify probe-kind tooling works (binary loads + recognizes flags; sanity check passes)

---

## Foundational (Blocking Prerequisites)

**Purpose**: None required — the existing 5-phase compiler pipeline is the
foundation. Spec 021 RuleId/classification work is already merged. ADR-0017
($nodeHandle + $childIndex, ParsedTree split) is already merged.

This section intentionally has no tasks. Skip to Phase 1.

---

## Phase 1: User Story 0 — Assembled Model Taxonomy Renames (Priority: P1) 🎯 MVP

**Scope adjustment (2026-05-03 code survey)**: The original task list assumed
`AssembledField`/`AssembledChild` were parallel types and `assembleField`/
`assembleChild` were top-level functions. The actual code has
`AssembledField extends AssembledChild` (already a subtype hierarchy) and
the assembler entry point is just `assemble()` at line 67 of `assemble.ts`.
Removing `AssembledMulti` and absorbing `AssembledGroup` into `AssembledPolymorph`
are **architectural** changes (they change which classes the assembler
instantiates) — they cannot be byte-identical and have been moved to Phase 4
where the new pipeline naturally produces neither. Phase 1 is now scoped to
**pure renames** that preserve byte-identity.

**Goal**: (1) Rename current `AssembledLeaf` class → `AssembledPattern`;
introduce new abstract `AssembledLeaf` base; make Pattern/Keyword/Token/Enum
extend it. (2) Rename slot interfaces `AssembledChild` → `AssembledNonterminal`
and `AssembledField` → `AssembledNamedSlot`. Generated output MUST be
byte-identical.

**Independent Test**: After phase commits, regenerate all three grammar packages.
`git diff packages/{rust,typescript,python}/src` is empty. All RT modes pass at
identical counts. Grep finds zero references to old names (`AssembledField`,
`AssembledChild` as type) in `packages/codegen/src/` outside their replacements.

### ⚠ Execution Order (TDD per Constitution Principle IV)

Phase 1 is a pure rename — the byte-identity gate IS the test. Execute in this
order:

1. **Foundation** (T004-T006) — add new `AssembledLeaf` base class first
2. **Rename pattern class** (T007-T011) — current `AssembledLeaf` → `AssembledPattern`
3. **Rename slot interfaces** (T012-T015) — `AssembledChild` → `AssembledNonterminal`, `AssembledField` → `AssembledNamedSlot`
4. **Verify** (T025-T029) — regenerate, confirm zero diff, type-check clean, RT identical

### Phase 1a: Introduce AssembledLeaf base class (FR-T02 part 1)

- [x] T004 [US0] Add `abstract class AssembledLeaf<R extends Rule = Rule> extends AssembledNodeBase<R>` in `packages/codegen/src/compiler/node-map.ts` immediately above the current `AssembledLeaf` class definition (line ~3187). The new class is a marker base — no `modelType` (concrete subtypes set their own). Add a JSDoc explaining it's the base for `Pattern`/`Keyword`/`Token`/`Enum`.
- [x] T005 [US0] Make `AssembledKeyword`, `AssembledToken`, `AssembledEnum` extend the new `AssembledLeaf<X>` instead of `AssembledNodeBase<X>` directly in `packages/codegen/src/compiler/node-map.ts`. **Each subclass MUST keep its existing `modelType` string value** (`'keyword'`, `'token'`, `'enum'`) to preserve byte-identity.
- [x] T006 [US0] Type-check — class hierarchy change is local to node-map.ts; no consumers need updates yet (the new base class hasn't been used as a discriminator).

### Phase 1b: Rename current `AssembledLeaf` → `AssembledPattern` (FR-T02 part 2)

- [x] T007 [US0] Rename `class AssembledLeaf` (line 3187 of `packages/codegen/src/compiler/node-map.ts`) to `class AssembledPattern`. Make it extend the new `AssembledLeaf<PatternRule | TerminalRule>` base. **Keep `modelType = 'leaf' as const`** (do NOT change to `'pattern'` — would break byte-identity).
- [x] T008 [US0] Update the `AssembledNode` union (line ~3605 of `packages/codegen/src/compiler/node-map.ts`) — replace `AssembledLeaf` with `AssembledPattern` in the union members.
- [x] T009 [P] [US0] Update production instantiation: `packages/codegen/src/compiler/assemble.ts:171` — change `new AssembledLeaf(kind, ...)` → `new AssembledPattern(kind, ...)`.
- [x] T010 [P] [US0] Update test instantiations (7 sites): `packages/codegen/src/__tests__/keyword-presence.test.ts:73`, `resolve-effective-literal.test.ts:77`, `emit-jinja-templates.test.ts:38`, `render-pipeline-optimization.test.ts:41`, and `native-transport-emit.test.ts` lines 82/124/146/198/237/267 — replace `new AssembledLeaf(...)` with `new AssembledPattern(...)` and update the import.
- [x] T011 [P] [US0] Update every consumer that switches on `modelType === 'leaf'` or imports `AssembledLeaf` as a specific (non-base) type — these now want `AssembledPattern`. Files to audit: `packages/codegen/src/emitters/{factories,wrap,types,from,client-utils,render-module,templates,node-model,consts,shared,test,transport-projection,factory-map,type-test}.ts`. Sweep with `rg 'AssembledLeaf' packages/codegen/src/ -l` and update each consumer.

### Phase 1c: ~~Add `isField` type guard~~ — DROPPED

**Decision (2026-05-03 turn)**: After designing the new slots Record where every
slot carries full metadata (paramName always set — `'child'`/`'children'` for
truly-unnamed positions), there is no isField narrowing left to do. Every slot
is an AssembledNonterminal with all metadata. Phase 1c is removed; its IDs
(T012-T015) are reassigned to Phase 1d's slot redesign below.

### Phase 1d: Slot Record + Container elimination (FR-T01a + FR-T04 — main taxonomy goal)

**Locked design (2026-05-03 brainstorm):**

`AssembledBranch.slots: Readonly<Record<string, AssembledNonterminal>>` — frozen
at construction, eagerly validated, keys = grammar field name OR `'child'` /
`'children'` for truly-unnamed positional content. Insertion order = declared
rule order.

`AssembledNonterminal` (renamed from `AssembledField`) carries all metadata as
required fields. The `AssembledChild` interface is deleted entirely. There is
no `isField` narrowing — every slot is an AssembledNonterminal with full
metadata. Per-slot `hasTrailing`/`hasLeading` move to per-value (NodeRef /
TerminalValue gain `separator?`, `trailing?`, `leading?`). `KindProjection` is
eliminated as a parallel-cache-of-derivation anti-pattern; replaced by a
`kindsOf(slot)` helper that derives from `slot.values`.

`AssembledContainer` is eliminated; `AssembledBranch` absorbs its
responsibilities (RepeatRule support; separator semantics now live on per-value).

#### 1d.i — Eliminate KindProjection (parallel-cache anti-pattern cleanup)

- [x] T016 [US0] Add helper `export function kindsOf(slot: AssembledNonterminal): readonly string[]` in `packages/codegen/src/compiler/node-map.ts` — derives via `slot.values.filter(v => v.kind === 'node-ref').map(v => v.node.name)` (handle UnresolvedRef vs AssembledNode in `node` field). One walk, no cache. Add JSDoc explaining it replaces `slot.projection.kinds` per Constitution XI.
- [x] T017 [US0] Update `render-module.ts` consumers — replace `field.projection.kinds` with `kindsOf(field)` at lines 1604, 2402, 3417, 4043. Update the parallel JSDoc references (lines 1170, 1175) to point at `kindsOf` instead of `projection.kinds`.
- [x] T018 [US0] Update `node-model.ts:323-324` — drop `typeName: field.projection.typeName` (field is dead — set to `""` everywhere, never read). Replace `kinds: [...field.projection.kinds]` with `kinds: [...kindsOf(field)]`.
- [x] T019 [US0] Remove the `projection` construction in node-map.ts internal slot merge logic (lines 644, 659, 734) — slots no longer carry projection. Update merge logic to operate on `values` only.
- [x] T020 [US0] Delete `KindProjection` and `ProjectionContext` interfaces from `packages/codegen/src/compiler/types.ts:381-392`. Delete `projections: ProjectionContext` field from `NodeMap` interface (line 398). Audit zero callers via `rg 'KindProjection|ProjectionContext|nodeMap\.projections|\.projections\.'`.
- [x] T021 [P] [US0] Update test fixtures that construct `projection: { typeName: '', kinds: [] }` — drop the field entirely. Sites: `keyword-presence.test.ts:37`, `emitter-consts.test.ts:121, 135, 171, 205, 233`.

#### 1d.ii — Rename AssembledField → AssembledNonterminal; delete AssembledChild

- [ ] T022 [US0] In `packages/codegen/src/compiler/node-map.ts`: delete the `AssembledChild` interface (lines 1664-1676) entirely. Move all its fields onto `AssembledField`. Remove the `extends AssembledChild` from `AssembledField`. Drop `hasTrailing` and `hasLeading` from the interface (will move to per-value). Drop `projection: KindProjection` from the interface (eliminated in 1d.i). Rename `AssembledField` → `AssembledNonterminal`. Net interface:
  ```ts
  export interface AssembledNonterminal {
    readonly name: string;
    readonly propertyName: string;
    readonly paramName: string;            // grammar field name OR 'child' / 'children'
    readonly values: readonly NodeOrTerminal[];
    readonly aliasSources?: Readonly<Record<string, string>>;
    readonly source: 'grammar' | 'override' | 'inlined' | 'enriched' | 'inferred';
  }
  ```
- [ ] T023 [US0] Sweep `AssembledChild` and `AssembledField` references across `packages/codegen/src/`. Replace each type annotation, import, and array-type with `AssembledNonterminal`. Verify with `rg '\bAssembledChild\b|\bAssembledField\b' packages/codegen/src/` — empty after this task.

#### 1d.iii — Move per-slot trailing/leading/separator metadata to per-value

- [ ] T024 [US0] Update `NodeRef` and `TerminalValue` interfaces in `packages/codegen/src/compiler/node-map.ts` to add `readonly separator?: string`, `readonly trailing?: boolean`, `readonly leading?: boolean`. Update the unified `NodeOrTerminal` derivation walk to populate these from the source rule (the same logic that previously fed `AssembledField.hasTrailing` / `.hasLeading`).
- [ ] T024a [US0] Update consumers of removed slot-level `hasTrailing`/`hasLeading`. Survey via `rg '\.hasTrailing\b|\.hasLeading\b' packages/codegen/src/`. Each site reads from the slot today; rewrite to read from the matching value entry (`slot.values[i].trailing`). Likely affected: `template-walker.ts`, `shared.ts`.

#### 1d.iv — Single unified slot derivation `deriveSlots`; delete legacy walkers

- [ ] T024b [US0] Add `export function deriveSlots(rule: Rule): readonly AssembledNonterminal[]` in `packages/codegen/src/compiler/node-map.ts` — single walk producing slots in declared rule order. Names: grammar `field('xyz', ...)` → `'xyz'`; truly-unnamed positional content → `'child'` (singular arity) or `'children'` (array/nonEmptyArray arity, determined by ANY value with array multiplicity per Q5 of brainstorm). Per-value `separator`/`trailing`/`leading` populated during the walk. JSDoc explicitly notes it replaces `deriveFields`, `deriveChildren`, `deriveFieldsRaw`, `findFieldsWithRepeatFlag`, `findRepeatSeparator`, `findRepeatFlag` per Constitution XI DRY.
- [ ] T024c [US0] Delete `deriveFields`, `deriveChildren`, `deriveFieldsRaw` from `node-map.ts`. Delete `findFieldsWithRepeatFlag`, `findRepeatSeparator`, `findRepeatFlag` (verify zero callers post-1d.iii migration; if any remain, they're hidden direct-rule walkers that should also migrate to `deriveSlots`).

#### 1d.v — Widen and reshape AssembledBranch

- [ ] T024d [US0] Widen `AssembledBranch.rule` type narrowing in `packages/codegen/src/compiler/node-map.ts:2446`: change `extends AssembledNodeBase<SeqRule | ChoiceRule>` → `extends AssembledNodeBase<SeqRule | ChoiceRule | RepeatRule | Repeat1Rule>`. Update constructor signature similarly.
- [ ] T024e [US0] Add `readonly slots: Readonly<Record<string, AssembledNonterminal>>` to `AssembledBranch`. Replace the lazy `#fields` / `#children` caches and their getters with a single eager build in the constructor:
  ```ts
  // In constructor, after super and field assignments:
  const built: Record<string, AssembledNonterminal> = {};
  let unnamedCount = 0;
  for (const slot of deriveSlots(simplifiedRule)) {
    if (slot.paramName in built) {
      throw new Error(
        `AssembledBranch '${kind}': duplicate slot key '${slot.paramName}'`
      );
    }
    if (slot.paramName === 'child' || slot.paramName === 'children') {
      unnamedCount++;
      if (unnamedCount > 1) {
        throw new Error(
          `AssembledBranch '${kind}' has ${unnamedCount} unnamed slots; at most one is permitted (FR-T05)`
        );
      }
    }
    // Multi-arity warning: mixed singular+array values within one slot
    const arities = new Set(slot.values.map(v => v.multiplicity));
    if (arities.has('single') && (arities.has('array') || arities.has('nonEmptyArray'))) {
      console.warn(
        `AssembledBranch '${kind}' slot '${slot.paramName}': mixed-arity values (singular + array). Rust transport may be complex.`
      );
    }
    built[slot.paramName] = slot;
  }
  this.slots = Object.freeze(built);
  ```
  Remove the now-unused `#fields` / `#children` private fields, `get fields()`, `get children()`, `override get structuralFields()`, `override get structuralChildren()`.
- [ ] T024f [US0] Drop `structuralFields` / `structuralChildren` from `AssembledNodeBase` (lines 1538, 1547 of node-map.ts) entirely. Audit every implementer (Polymorph at line 3007, Group at line 3504/3519, Container being deleted in 1d.vii) — each must either (a) have its own `slots` Record built the same way as Branch, or (b) be modified to no longer override these abstract members. Keep `AssembledPolymorph` overriding `structuralFields` until it gets its own slots (might defer to Phase 4).
- [ ] T024g [US0] Drop `members` getter from `AssembledBranch` is **NOT** done in Phase 1 — keep per Q4 brainstorm decision; deprecate post-Phase 4.

#### 1d.vi — Audit modelType-based discrimination sites

- [ ] T024h [US0] Update **`branch || container` sites** (4 sites — collapse trivially since both treated equivalently): replace with `branch`:
  - `packages/codegen/src/compiler/assemble.ts:837-838`
  - `packages/codegen/src/emitters/factory-map.ts:113`
  - `packages/codegen/src/emitters/shared.ts:67-68`
  - `packages/codegen/src/emitters/ir.ts:129-130`
- [ ] T024i [US0] Update **`branch || group` sites** (6 sites — must preserve "has fields" intent): replace `n.modelType === 'branch' || n.modelType === 'group'` with `(n.modelType === 'branch' || n.modelType === 'group') && hasNamedSlots(n)` where `hasNamedSlots(n)` is a tiny helper that checks `Object.keys(n.slots).some(k => k !== 'child' && k !== 'children')`. Sites:
  - `packages/codegen/src/compiler/assemble.ts:833`
  - `packages/codegen/src/emitters/factory-map.ts:88, 208`
  - `packages/codegen/src/emitters/factories.ts:330`
  - `packages/codegen/src/emitters/shared.ts:63`
  - `packages/codegen/src/emitters/types.ts:1868`
- [ ] T024j [US0] Review `branch`-only sites (`factories.ts:179`, `test.ts:104`) — confirm intent (any branch vs branch-with-fields) and add `hasNamedSlots(...)` guard if needed.

#### 1d.vii — Switch assembler to AssembledBranch and delete AssembledContainer

- [ ] T024k [US0] In `packages/codegen/src/compiler/assemble.ts:121`: replace `new AssembledContainer(...)` with `new AssembledBranch(...)` (constructors compatible after 1d.v). Update import.
- [ ] T024l [US0] In `packages/codegen/src/compiler/assemble.ts:399`: same change as T024k.
- [ ] T024m [P] [US0] Update test site `packages/codegen/src/__tests__/native-transport-emit.test.ts:233`: replace `new AssembledContainer('child_list', listRule, listRule)` with `new AssembledBranch('child_list', listRule, listRule)`.
- [ ] T024n [US0] Delete `class AssembledContainer` (lines 2843-2945 of `packages/codegen/src/compiler/node-map.ts`). Remove `AssembledContainer` from the `AssembledNode` union (line ~3605). Sweep: `rg 'AssembledContainer' packages/codegen/src/` returns empty.

#### 1d.viii — Migrate ~50 consumer sites from `.fields` / `.children` to `Object.values(slots)`

- [ ] T024o [US0] Audit every `.fields` / `.children` access on Branch/Container/Polymorph/Group instances (NOT on `entry.fields`/`entry.children` — those are template-output objects, unrelated). Per Q6 brainstorm decision: every iteration uses `Object.values(node.slots)` or `Object.entries(node.slots)`. No `isField` filter — every slot has full metadata. Files affected: `factory-map.ts`, `shared.ts`, `trace.ts`, `test.ts`, `wrap.ts`, `node-model.ts`, `factories.ts`, `client-utils.ts`, `render-module.ts`, `from.ts`, `types.ts`, `consts.ts`, `transport-projection.ts`, `compiler/assemble.ts:559-649`. Estimate ~40-60 sites; each is a focused property-access rewrite. Sub-task per file recommended during execution.

#### 1d.ix — Audit assertNever exhaustiveness post-merge

- [ ] T024p [US0] Every `switch` over the `AssembledNode` union has one fewer member after AssembledContainer deletion. Type-check will catch missing-case errors; switches that listed `'container'` but had no specific behavior get the case removed cleanly. Confirm `assertNever(x)` still terminates each switch per Constitution XI.

### Phase 1 audit + verification

- [ ] T025 [US0] Audit every `switch` over assembled-model union — ensure each ends in `assertNever(x)` per Constitution XI; grep `packages/codegen/src/` for switches lacking it. (Phase 1's at-most-one-unnamed-slot enforcement [R-T05] is deferred to Phase 4 when AssembledMulti+Group are removed and the unnamed-slot constraint becomes non-trivial.)
- [ ] T026 [US0] Regenerate grammar packages: `npx tsx packages/codegen/src/cli.ts --grammar rust --all --skip-ts-chain --no-build-native --output packages/rust/src` (and typescript, python)
- [ ] T027 [US0] Verify diff: `git diff packages/{rust,typescript,python}/src` produces zero changed lines (1a/1b/1c are byte-identical renames; 1d is partition-equivalent — same kinds emit same artifacts).
- [ ] T028 [US0] Verify zero stale references: `rg 'AssembledContainer' packages/codegen/src/` returns empty.
- [ ] T029 [US0] Run native RT (3 modes) + type-check + `cargo build`. All gates pass at identical counts to baseline.
- [ ] T029a [US0] Commit Phase 1: "022(taxonomy): AssembledLeaf base + Pattern rename; isField guard; eliminate AssembledContainer"

**Checkpoint**: Phase 1 complete. Renames + Branch/Container merge in place.
Generated output byte-identical (1a/1b/1c) and partition-equivalent (1d — same
kinds emit the same artifacts, just with `modelType: 'branch'` instead of
`'container'` for former containers, and the discrimination sites now use slot
shape rather than modelType strings).

AssembledMulti and AssembledGroup remain as-is; their elimination ships with the
Phase 4 pipeline rewrite (see Phase 4 tasks T087a, T087b).

---

## Phase 2: User Story 1+2+3 — Surface Reshape (Priority: P1)

**Goal**: De-hoist `$fields` to `_`-storage (US1), add non-enumerable function
accessors with cursor/value duality (US2), freeze nodes at construction with
`$with` updaters (US3). These three stories land together — they're three
faces of one emitter rewrite and can't be tested in isolation without a broken
intermediate state.

**Independent Test**: Given any factory or wrap node:
- `node.$fields` is `undefined`
- `node._<field>` returns the stored value
- `typeof node.<field> === 'function'` and is non-enumerable
- `node.<field>()` returns the stored value
- `Object.isFrozen(node) === true`
- `node.$with.<field>(v)` returns a new frozen node with the update

### ⚠ Execution Order (TDD per Constitution Principle IV)

Tasks are listed in logical (types → impl → tests → verify) order for
documentation clarity, but **execute in this sequence** so RED-before-GREEN
is enforced:

1. **Foundation types** (T030-T034) — needed before tests can compile
2. **Tests RED** (T050, T051, T052, T052a, T043a-test-portion) — write tests, run them, observe failure
3. **Implementation GREEN** (T035-T049, T043) — implement until tests pass
4. **Verification** (T053-T056, T056b) — regenerate + RT gate + commit

### Foundation types

- [ ] T030 [P] [US1] Define `NodeMemberValue = AnyNodeData | string | number` in `packages/types/src/node-member-value.ts`
- [ ] T031 [P] [US1] Update `AnyNodeData = NodeBase | NodeWithChild | NodeWithChildren` in `packages/types/src/core-types.ts` — drop `$fields` from `NodeBase`
- [ ] T032 [P] [US3] Add `withMethods(node, ...)` shared helper to `packages/core/src/nodeData.ts` (new file)
- [ ] T033 [P] [US3] Add `freezeNodeData(node)` helper to `packages/core/src/nodeData.ts` — freezes top-level + nested arrays in `_`-storage
- [ ] T034 [P] [US3] Add `buildWithNamespace(config, factory, slotKeys)` helper to `packages/core/src/nodeData.ts` — produces non-enumerable `$with` namespace

### Factory emitter (US1 + US2 + US3 surface)

- [ ] T035 [US1] Update `packages/codegen/src/emitters/factories.ts` — emit named members as `_<name>` storage keys (was `$fields.<name>`)
- [ ] T036 [US2] Update `packages/codegen/src/emitters/factories.ts` — emit non-enumerable accessor function `<name>(): NodeMemberValue` per storage slot via `Object.defineProperty`
- [ ] T037 [US3] Update `packages/codegen/src/emitters/factories.ts` — emit `Object.freeze(node)` as final step of every factory; freeze nested arrays in `_`-storage
- [ ] T038 [US3] Update `packages/codegen/src/emitters/factories.ts` — emit `$with` namespace via `buildWithNamespace`; include `$with.$child(v)` / `$with.$children(vs)` for unnamed slots
- [ ] T039 [US1] Update `packages/codegen/src/emitters/factories.ts` — remove per-field fluent setter method emission (target ~-1,500 lines per grammar)
- [ ] T040 [US1] Update `packages/codegen/src/emitters/factories.ts` — emit `$child` / `$children` keys (without `$fields` wrapping) for unnamed slots

### Wrap emitter (US1 + US2 + US3 surface — must match factory output)

- [ ] T041 [US1] Update `packages/codegen/src/emitters/wrap.ts` — store `_<name>` per slot (factory: value; wrap: stub or value depending on shallow/recursive)
- [ ] T042 [US2] Update `packages/codegen/src/emitters/wrap.ts` — emit accessor functions that call `materializeStub(this._<name>)` if stub, else return value directly
- [ ] T043 [US2] Add `materializeStub(stub)` helper in `packages/core/src/readNode.ts` (or `nodeData.ts`) — calls `readNode(tree, stub.$nodeHandle, stub.$childIndex)`
- [ ] T043a [US2] Add error handling in `materializeStub(stub, tree)` in `packages/core/src/readNode.ts` — when `tree` is undefined or disposed, throw `Error("NodeData stub cannot be materialized: parse tree no longer available (handle=N, childIndex=N)")`. Add test in `nodedata-shape.test.ts` asserting the specific error message format and that it includes `stub.$nodeHandle` and `stub.$childIndex`. Covers spec.md edge case E3.
- [ ] T044 [US3] Update `packages/codegen/src/emitters/wrap.ts` — emit `Object.freeze(node)` as final step
- [ ] T045 [US3] Update `packages/codegen/src/emitters/wrap.ts` — emit `$with` namespace identical to factory (calls factory with materialized values)

### Type emitter (drop $fields wrapper)

- [ ] T046 [US1] Update `packages/codegen/src/emitters/types.ts` — drop `$fields` from generated interfaces; emit `_<name>` storage keys + accessor function signatures + `$with` typed namespace
- [ ] T047 [US2] Update `packages/codegen/src/emitters/types.ts` — emit accessor function types (`<name>(): T`) on the interface
- [ ] T048 [US3] Update `packages/codegen/src/emitters/types.ts` — emit `$with` typed namespace (`$with: { <name>(v: T): NodeData }`)

### Method emitter (US4 setup — see Phase 5 for full $-prefix pass)

- [ ] T049 [US3] Refactor `factorySuffix` in `packages/codegen/src/emitters/factories.ts` to call `withMethods` shared helper instead of inlining method emissions per factory

### Tests

- [ ] T050 [P] [US1] Add `nodedata-shape.test.ts` in `packages/codegen/src/__tests__/` — assert `node.$fields === undefined`, `node._name` returns value
- [ ] T051 [P] [US2] Add tests in same file — assert `typeof node.name === 'function'`, accessor non-enumerable (`Object.keys` excludes), `node.name()` returns value. **Strict key check** (covers SC-004): `Object.keys(node).every(k => k.startsWith('$') || k.startsWith('_'))` — every enumerable key is either `$`-metadata or `_`-storage, no other shape leaks
- [ ] T052 [P] [US3] Add tests in same file — assert `Object.isFrozen(node)`, frozen array in `_`-storage, `$with.name(v)` returns new frozen node, chain `$with.a(x).$with.b(y)` works. **Also assert** (R-009): `Object.keys(node).includes('$with') === false` (`$with` is non-enumerable). **Also assert** (R-006/E2): for an unnamed-singular kind, `'$child' in node && node.$children === undefined`; for an unnamed-array kind, `'$children' in node && node.$child === undefined`; for an all-named kind (e.g. `identifier_pattern`), `node.$child === undefined && node.$children === undefined`. **Also assert** (E5): a leaf node (e.g. keyword `fn`) has `$type`, `$source`, `$named`, `$text` and no `_`-storage keys. **Also assert** (FR-009a): for an unnamed-singular kind, `node.$with.$child(newValue)` returns a new frozen node where `newNode.$child === newValue`, the original node is unchanged, and `Object.isFrozen(newNode) === true`. For an unnamed-array kind, `node.$with.$children([a, b])` returns a new frozen node where `newNode.$children` deep-equals `[a, b]`, `Object.isFrozen(newNode.$children) === true`, and the original node is unchanged.
- [ ] T052a [P] [US3] Add to `nodedata-shape.test.ts` — for a representative factory node and a wrap node: assert `JSON.parse(JSON.stringify(node))` round-trips to an object whose keys are exactly `Object.keys(node)`, contains no function artifacts, and matches the union of `$`-metadata + `_`-storage keys. Assert `'$with'`, `'$render'`, accessor function names do NOT appear in the parsed JSON. Covers spec.md SC-007 and edge case E6.

### Verification

- [ ] T053 [US1] Regenerate all three grammar packages
- [ ] T054 [US1] Run native RT (3 modes) + type-check + `cargo build`. RT floors hold (python ≥114, rust ≥124, typescript ≥108).
- [ ] T055 [US1] Verify line-count reduction: `wc -l packages/{rust,typescript,python}/src/factories.ts` shows ~-1,500 lines per grammar vs baseline
- [ ] T056 [US1] Verify zero `$fields` references in generated output: `rg '\$fields' packages/{rust,typescript,python}/src` returns empty. Covers SC-001.
- [ ] T056b [US1] Commit Phase 2: "022(surface): de-hoist $fields, accessor fns, freeze, $with namespace"

**Checkpoint**: Phase 2 (Surface) core complete. Consumer-visible surface change landed. Factory and wrap produce structurally-identical objects. Phase 2 continues in the next two sections (US4, US5) which are smaller follow-ons that share the surface phase.

---

## Phase 2 (continued): User Story 4 — `$`-prefixed sittir methods (Priority: P2)

**Goal**: All sittir-owned methods use `$`-prefix: `$render()`, `$toEdit()`,
`$replace()`, `$trivia()`. Eliminates collisions with grammar field names.

**Independent Test**: `node.$render()` works and produces source text;
`node.render` is undefined OR is a grammar field accessor (depending on whether
the grammar has a `render` field).

- [ ] T057 [US4] Update `withMethods` helper in `packages/core/src/nodeData.ts` — attach `$render`, `$toEdit`, `$replace`, `$trivia` (non-enumerable)
- [ ] T058 [US4] Remove unprefixed method emission from `packages/codegen/src/emitters/factories.ts` and `packages/codegen/src/emitters/wrap.ts`
- [ ] T059 [US4] Update `packages/codegen/src/emitters/types.ts` — emit `$render(): string`, `$toEdit(range): Edit`, `$replace(target): Edit`, `$trivia(...): NodeData`
- [ ] T060 [P] [US4] Update consumer call sites: search for `.render()` / `.toEdit(` / `.replace(` / `.trivia(` in `packages/{core,codegen}/src/__tests__/` and rename to `$`-prefix
- [ ] T061 [P] [US4] Add test in `nodedata-shape.test.ts` — `typeof node.$render === 'function'`, non-enumerable
- [ ] T062 [US4] Regenerate grammar packages, run gates (RT + type-check + cargo)
- [ ] T063 [US4] Commit Phase 2 continuation: "022(surface): $-prefix sittir methods, withMethods shared helper"

---

## Phase 2 (continued): User Story 5 — Unified factory and wrap surface (Priority: P2)

**Goal**: Verify factory and wrap produce identical NodeData shape (same keys,
same accessor signatures, same `$with` namespace). The only behavioral
difference is wrap accessors do drill-in on stubs.

**Independent Test**: For any kind, `Object.keys(factoryNode)` ===
`Object.keys(wrapNode)` (after wrap drill-in materializes); accessor function
names match; `$with` namespace shape matches.

- [ ] T064 [US5] Add `unified-surface.test.ts` in `packages/codegen/src/__tests__/` — for each kind in corpus, assert factory output keys match wrap output keys
- [ ] T065 [US5] Same test — assert accessor function names and arity match
- [ ] T066 [US5] Same test — assert `Object.keys(factoryNode.$with)` === `Object.keys(wrapNode.$with)`
- [ ] T067 [US5] Run unified-surface test; fix any divergences in factory/wrap emitters
- [ ] T068 [US5] Commit Phase 2 continuation: "022(surface): verified unified factory/wrap surface"

---

## Phase 3: User Story 6 — napi direct property access (Priority: P2)

**Goal**: Cross the napi boundary via `FromNapiValue`/`ToNapiValue` reading JS
object properties directly. No `serde_json::to_string` then `JSON.parse`.

**Independent Test**: Profile/inspect native render call path — no JSON
serialization appears. Render path reads `_<name>` properties via
`Object::get_named_property` directly.

- [ ] T069 [US6] Implement `FromNapiValue for NodeData` in `rust/crates/sittir-core/src/types.rs` — read `$type`, `$source`, `$named`, `$text`, `$child`/`$children` via `get_named_property`
- [ ] T070 [US6] Implement direct field reading via storage-name lookup in `rust/crates/sittir-core/src/types.rs` — accept a per-kind `&[&str]` slice of `_`-prefixed storage keys
- [ ] T071 [US6] Remove `serde_json::to_string` / `serde_json::from_str` calls from native render entry in `rust/crates/sittir-core/src/engine.rs`
- [ ] T072 [P] [US6] Update `packages/codegen/src/emitters/render-module.ts` — emit per-kind storage-key arrays for napi direct lookup
- [ ] T073 [P] [US6] Update `packages/codegen/src/emitters/client-utils.ts` — terminal slot identity projection (no NodeData→string runtime conversion)
- [ ] T074 [P] [US6] Add `napi-direct.test.ts` in `packages/codegen/src/__tests__/` — assert `JSON.stringify` is not called in the render hot path (test instruments via spy or static analysis of the loaded module). **Also assert** (R-016): the generated transport struct in `rust/crates/sittir-{rust,typescript,python}-napi/src/lib.rs` has no `$with` field accessor and no `$render`/`$toEdit`/`$replace`/`$trivia` field — JS-only methods do not cross napi. Verify by inspecting the generated transport definitions.
- [ ] T075 [US6] Regenerate grammar packages, rebuild napi crates: `cargo build -p sittir-{rust,typescript,python}-napi`
- [ ] T076 [US6] Run native RT (3 modes); verify factory ceilings drop toward zero (ideal: 0)
- [ ] T077 [US6] Commit Phase 3: "022(transport): napi direct property access, no JSON in render path"

**Checkpoint**: Phase 3 complete. Transport boundary aligned with storage shape. Factory ceilings reduced.

---

## Phase 4: User Story 7 — Internal pipeline rewrite (Priority: P3)

**Goal**: Binding + Simplify produce the new taxonomy from scratch (instead of
current Assemble reaching it through compatibility shims). Drop any compatibility
shims introduced in earlier phases.

**Independent Test**: After phase, Binding/Simplify outputs are consumed
end-to-end by Assemble; native RT floors hold; factory ceilings remain at zero.

### ⚠ Execution Order (TDD per Constitution Principle IV)

Execute in this sequence:

1. **Tests RED** (T086a — provenance test) — write provenance assertions for the
   new pipeline output, run them against the current Assemble (which already
   produces RuleId lineage); observe whether the assertions hold today
2. **Implementation GREEN** (T078-T088) — write Binding + Simplify; rewrite
   Assemble; ensure provenance assertions still pass
3. **Verification** (T089-T093) — wire pipeline, RT gate, commit

### Binding

- [ ] T078 [US7] Create `packages/codegen/src/compiler/binding.ts` with `bindRule(kind, rule, rules)` returning `BindingResult`
- [ ] T079 [US7] Implement terminal-to-nonterminal attachment in `binding.ts`
- [ ] T080 [US7] Implement field-edge naming from `field(name, content)` wrappers in `binding.ts`
- [ ] T081 [US7] Implement alias-forced nonterminal classification in `binding.ts`

### Simplify

- [ ] T082 [US7] Create `packages/codegen/src/compiler/simplify.ts` consuming `BindingResult` and producing normalized constituent rules
- [ ] T083 [US7] Push `seq` ordering down to constituents in `simplify.ts`
- [ ] T084 [US7] Push `optional` / `repeat` / `repeat1` multiplicity down to constituent values in `simplify.ts`
- [ ] T085 [US7] Resolve `choice(...)` by frontier outcome in `simplify.ts` — synthesize normalized constituent form when needed
- [ ] T086 [US7] Strip `prec*` (parse metadata only) from constituents in `simplify.ts`
- [ ] T086a [P] [US7] Add `provenance.test.ts` in `packages/codegen/src/__tests__/` — for every assembled kind across all three grammars, assert each `AssembledNonterminal.values[]` entry carries a non-empty `ruleIds: readonly RuleId[]` lineage that resolves to an originating rule in the spec 021 RuleId catalog. Run after Phase 8 changes. Covers FR-021 (RuleId provenance preserved).

### Assemble rewrite (architectural taxonomy changes — deferred from Phase 1)

- [ ] T087 [US7] Update `packages/codegen/src/compiler/assemble.ts` — consume normalized constituents, materialize `AssembledNonterminal`/`AssembledLeaf`/etc directly
- [ ] T087a [US7] **Eliminate `AssembledMulti`** (FR-T01b, FR-T04 multi part). New pipeline MUST NOT instantiate `new AssembledMulti(...)`. Repeat structure that was producing AssembledMulti instances becomes `multiplicity: 'array' | 'nonEmptyArray'` on slot `values[]` at referrers. Remove the `AssembledMulti` class from `node-map.ts`. Remove from `AssembledNode` union. Update `__tests__/native-transport-emit.test.ts:230` to use the new shape.
- [ ] T087b [US7] **Absorb `AssembledGroup` into `AssembledPolymorph`** (FR-T03). Polymorph forms (groups with `parentKind?` set today) become inline `AssembledPolymorph.forms[]` entries. Standalone hidden seqs (groups without `parentKind`) become `AssembledBranch` instances since they're structurally seqs. Remove the `AssembledGroup` class from `node-map.ts`. Remove from `AssembledNode` union. Update test instantiations.
- [ ] T087c [US7] **Enforce R-T05 at codegen time** (FR-T05). After AssembledMulti+Group are removed (T087a/T087b) and the new pipeline produces AssembledNonterminal slots with edgeName?-discrimination, add validation: at most ONE entry in `branch.children` may lack a field name (be unnamed). Throw `Error("kind 'X' has multiple unnamed slots — invalid")` at assemble time if violated. (Note: `AssembledContainer` absorption was already completed in Phase 1d — this task only enforces the constraint after Multi/Group are also gone.)
- [ ] T088 [US7] Drop any compatibility shims left behind from earlier phases (`$fields` projections in factory/wrap, JSON-serialization fallback in napi). Audit `assemble.ts` for any legacy paths introduced as adapters.
- [ ] T089 [US7] Wire `bindRule` and `simplify` into pipeline in `packages/codegen/src/compiler/generate.ts`

### Verification

- [ ] T090 [US7] Regenerate grammar packages
- [ ] T091 [US7] Run native RT (3 modes); floors hold (python ≥114, rust ≥124, typescript ≥108)
- [ ] T092 [US7] Verify factory ceilings remain at zero
- [ ] T093 [US7] Commit Phase 4: "022(internals): Binding + Simplify pipeline rewrite"

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T094 [P] Update `CLAUDE.md` to document the new NodeData surface and `$with` namespace
- [ ] T095 [P] Update memory entry `project_022_surface_design.md` — mark spec/plan/tasks landed
- [ ] T096 [P] Run quickstart.md validation end-to-end on a fresh checkout
- [ ] T097 Final regression check: full `pnpm test` + `pnpm -r run type-check` + `cargo test --workspace` clean
- [ ] T098 Update PR description with before/after metrics: line counts, RT pass rates, factory ceilings, render perf delta

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 0 (Setup)**: No dependencies
- **Foundational**: Empty — skip
- **Phase 1 (US0 Taxonomy)**: After Setup. Pure rename — must land before any emitter behavior change.
- **Phase 2 (US1+US2+US3 Surface)**: After Phase 1. Three stories grouped because they are inseparable faces of one emitter rewrite.
- **Phase 2 cont. (US4 $-methods)**: After core Phase 2. Standalone refactor; same surface phase.
- **Phase 2 cont. (US5 Unified)**: After core Phase 2 (and ideally US4). Verification phase.
- **Phase 3 (US6 napi direct)**: After Phase 2. Requires `_`-storage to read.
- **Phase 4 (US7 Pipeline)**: After Phase 3. Last — produces the model the earlier phases consume.
- **Phase 5 (Polish)**: After Phase 4.

### Why US1/US2/US3 are grouped

After Phase 4 begins, intermediate states are temporarily broken:
- US1 alone (drop `$fields`, no accessor): consumers can't read fields
- US2 alone (add accessor, keep `$fields`): accessor reads via `this.$fields.<name>` — pointless intermediate
- US3 alone (freeze, `$with`): can't `$with` if no `_`-storage exists

They land in one focused phase with one commit at the end. Each task is small;
the *phase* is the increment, not each story individually.

### Within Each Phase

- Type definitions before emitters (emitters consume types)
- Foundation helpers (`@sittir/core/nodeData.ts`) before emitter changes that use them
- **Tests written first** within each phase — observe RED before implementation, observe GREEN after. In Phase 4: write T050-T052 + T052a + T043a BEFORE T035-T049 implementation tasks. In Phase 8: write T086a BEFORE T078-T088. The task ordering in this document is logical (types → helpers → impl → tests → verify); the *execution* ordering should hoist the tests.
- Emitters before regenerate (regenerate is a verification step)

### Parallel Opportunities

- T016-T023 (US0 reader updates): different files, no dependencies between them — run in parallel
- T030-T034 (US1+ foundation types and helpers): different files, parallel
- T050-T052, T052a (US1/US2/US3 tests): different test groupings in same file — write together, RED before T035-T049 implementation tasks
- T060 (US4 consumer rename): orthogonal to T057-T059 emitter changes
- T072-T074 (US6 emitter + test work): different files, parallel
- T086a (US7 provenance test): orthogonal to T078-T088 implementation; can be written first to drive the rewrite

---

## Parallel Example: Phase 1 (US0 Reader Updates)

```bash
# After T004-T015 (types + assembler) complete, run the reader updates in parallel:
Task: "Update packages/codegen/src/emitters/factories.ts to read AssembledNonterminal/Pattern/etc."
Task: "Update packages/codegen/src/emitters/wrap.ts to read new types"
Task: "Update packages/codegen/src/emitters/types.ts to read new types"
Task: "Update packages/codegen/src/emitters/from.ts to read new types"
Task: "Update packages/codegen/src/emitters/client-utils.ts to read new types"
Task: "Update packages/codegen/src/emitters/render-module.ts to read new types"
Task: "Update packages/codegen/src/emitters/jinja-walker.ts to read new types"
Task: "Update validators (packages/codegen/src/validate/*.ts) to read new types"
```

---

## Implementation Strategy

### MVP First (Phase 1 — Taxonomy Collapse)

1. Complete Phase 0 (Setup baselines)
2. Complete Phase 1 (US0 Taxonomy)
3. **STOP and VALIDATE**: byte-identical regenerated output proves the rename is non-lossy
4. Commit; this alone is a meaningful, shippable refactor

### Incremental Delivery

1. Phase 0 baselines → Phase 1 taxonomy → ship
2. Phase 2 surface reshape (US1+US2+US3) → ship (consumer-visible improvement)
3. Phase 2 cont. ($-methods + unified) → ship
4. Phase 3 napi direct → ship (transport efficiency win)
5. Phase 4 pipeline rewrite → ship (internal cleanup; invisible to consumers)

Each phase ships an independently valuable increment. Phases 1 and 3 are the
biggest user-visible wins; Phase 4 is internal hygiene.

### RT Gate at Every Phase

Native RT (shallow + deep + factory) + type-check + `cargo build` must pass at
the END of every phase. Phase 1 has the strongest gate: byte-identical
regenerated output.

---

## Notes

- `[P]` tasks = different files, no dependencies on incomplete tasks in this phase
- `[Story]` label maps task to user story for traceability with spec.md FRs
- Each phase ends in a verification + commit task — don't skip them
- Grouping US1+US2+US3 in one phase is intentional; documented above
- Constitution Principle XI (DRY) requires `assertNever(x)` on every union switch — T024 audits this
- All file paths are repository-absolute relative to `/Users/pmouli/GitHub.nosync/refactory-lang/sittir/`
