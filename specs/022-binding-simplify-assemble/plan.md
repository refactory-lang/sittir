# Implementation Plan: De-hoisted NodeData Surface

**Branch**: `022-binding-simplify-assemble` | **Date**: 2026-05-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/022-binding-simplify-assemble/spec.md`
**Source of truth**: `docs/adr/0018-dehoist-nodedata-surface.md`

## Summary

Replace the `$fields`-wrapped NodeData with a flat surface that uses `_`-prefixed
storage, non-enumerable function-call accessors with cursor/value duality, frozen
objects, a `$with` namespace for immutable updates, and `$`-prefixed methods.
Cross the napi boundary via direct property access. Land in four phases:
**taxonomy** (collapse AssembledField/Child/Multi into AssembledNonterminal,
AssembledLeaf base), **surface** (consumer-visible NodeData reshape), **transport**
(napi direct), **internals** (Binding/Simplify pipeline rewrite producing the new
taxonomy from scratch).

## Technical Context

**Language/Version**: TypeScript 6.0.2 (workspace ESM, `.ts` extensions in imports), Rust 1.88+
**Primary Dependencies**: `@sittir/core`, `@sittir/types`, `@sittir/codegen` (workspace); `napi-rs` 3, `web-tree-sitter` 0.26.7, `askama` 0.15
**Storage**: File system — generated TS/Rust per grammar package; no runtime persistence
**Testing**: Vitest (TS), `cargo test` (Rust); native corpus RT (3 modes: shallow, deep, factory)
**Target Platform**: Node.js 20+ for TS surface; native Rust addon via napi for parse + render
**Project Type**: Compiler / library — codegen pipeline + per-grammar emitted runtime
**Performance Goals**: Native render path with zero JSON serialization in the call path; door-to-door render not regressed vs current native baseline
**Constraints**: Each commit MUST pass native RT (python ≥114, rust ≥124, typescript ≥108) AND `pnpm -r run type-check` with zero errors AND `cargo build -p sittir-{rust,typescript,python}` clean
**Scale/Scope**: 3 grammars (rust, typescript, python), ~280 generated factory files, ~1,500 lines of fluent-method emission to remove per grammar

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle | Status | Notes |
|---|---|---|
| I. Grammar Alignment | ✓ | Surface keeps `kind`, `field`, `named`, `anonymous`. The `$`/`_` namespacing is sittir-internal; consumer-facing names align with tree-sitter terms. |
| II. Fewer Abstractions | ✓ | Removes per-field fluent-method emission (~1,500 lines/grammar). Removes `$fields` wrapper. Unifies `NodeFieldValue`/`NodeChildValue` into `NodeMemberValue`. Net: fewer types and indirection. |
| III. Generated vs Hand-Written | ✓ | All node-shape changes flow through emitters (`factories.ts`, `wrap.ts`, `client-utils.ts`, `types.ts`). Generated headers preserved. Hand-written `@sittir/core` stays minimal. |
| IV. Test-First | ✓ | Native RT (shallow + deep + factory) is the gate. Each phase commit must pass. New behavior (`Object.isFrozen`, accessor non-enumerability, `$with` chain) gets explicit tests in `packages/codegen/src/__tests__/`. |
| V. Library-First | ✓ | No CLI / formatting / linting changes. `Edit` boundary unchanged. `RenderContext` unchanged. |
| VI. Deterministic Output | ✓ | Codegen remains deterministic. Frozen-at-construction does not introduce ordering nondeterminism (Object.freeze is a single-step operation). |
| VII. Grammar-Agnostic Pipeline | ✓ | Surface change is grammar-agnostic — applies identically to rust/typescript/python. No language-specific conditionals introduced. |
| VIII. Non-lossy Transformations | ✓ | All field information preserved through new shape. Storage moves from `$fields.name` to `_name`; same data, different key. Fluent setters become `$with.name(v)`; same operation, different surface. |
| IX. @sittir/core surface | ✓ | Core gains: `withMethods` helper, `$with` factory plumbing, drill-in materialization. All have clean Rust analogues (Rust side already has node table + child-index handles per ADR-0017). |
| X. Don't hand-roll types | ✓ | `AnyNodeData`, `NodeMemberValue` defined once in `@sittir/types`, imported everywhere. No per-grammar redeclaration. |
| XI. DRY — One Source, One Derivation | ✓ | Unified factory/wrap surface = one source for node shape. `withMethods` shared helper = one derivation of method emission. Terminal/nonterminal classification flows from one assembled model to all emitters. |

**Result**: PASS — no violations. No entries in Complexity Tracking required.

### Post-Phase-1 design re-check (2026-05-03)

After taxonomy-first phase reordering and contracts/ generation, all
principles still hold:

| Principle | Re-check |
|---|---|
| II. Fewer Abstractions | ✓ Strengthened — taxonomy collapse removes 4 types (`AssembledField`, `AssembledChild`, `AssembledMulti`, `AssembledGroup`) before emitter changes touch them. |
| III. Generated vs Hand-Written | ✓ Phase 1 success criterion is byte-identical generated output — proves the rename is non-lossy. |
| VIII. Non-lossy | ✓ Phase 1 byte-identity gate is the strongest possible non-lossy assertion. |
| XI. DRY | ✓ Strengthened — taxonomy-first means emitters consume one model instead of straddling two through Phases 1-2. |

No new violations introduced. Complexity Tracking remains empty.

## Project Structure

### Documentation (this feature)

```text
specs/022-binding-simplify-assemble/
├── plan.md              # This file
├── research.md          # Phase 0 — design decisions traced to ADR-0018
├── data-model.md        # Phase 1 — runtime surface + assembled model (DRAFT taxonomy)
├── quickstart.md        # Phase 1 — onboarding for new contributors
├── contracts/           # Phase 1 — public API contracts (NodeData shape, factory signature, $with namespace)
├── tasks.md             # Phase 2 — surface-first task order (created by /speckit.tasks)
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
# Hand-written runtime layer (Rust-port surface — keep minimal per Principle IX)
packages/core/src/
├── engine.ts                # ParsedTree + render entry (ADR-0017 landed)
├── readNode.ts              # TreeHandle navigation; produces wrap NodeData
├── render.ts                # Template-driven render
├── nodeData.ts              # NEW: withMethods + freeze + $with factory plumbing
└── types.ts                 # Re-exports from @sittir/types

# Pure type definitions (zero runtime)
packages/types/src/
├── core-types.ts            # NodeBase + AnyNodeData union (will gain frozen brand)
├── node-member-value.ts     # NEW: unified NodeMemberValue type
└── tree.ts                  # AnyTreeNode, TreeNodeOf<T> (unchanged)

# Codegen pipeline (TS-only — produces per-grammar packages)
packages/codegen/src/
├── compiler/
│   ├── binding.ts           # NEW (Phase 4): terminal-to-nonterminal binding
│   ├── simplify.ts          # NEW (Phase 4): wrapper push-down
│   ├── assemble.ts          # MODIFIED (Phase 1 rename, Phase 4 rewrite): emit AssembledNonterminal/Pattern/Keyword/Token/Enum
│   ├── node-map.ts          # MODIFIED (Phase 1): collapse Field+Child+Multi into Nonterminal; AssembledLeaf base
│   └── template-walker.ts   # MODIFIED (Phase 1): read new assembled types when producing Jinja-renderable structures
├── emitters/
│   ├── factories.ts         # MODIFIED (Phase 2): emit _-storage + accessors + $with + freeze
│   ├── wrap.ts              # MODIFIED (Phase 2): emit accessors with drillIn + $with
│   ├── types.ts             # MODIFIED (Phase 2): drop $fields from interfaces
│   ├── templates.ts         # MODIFIED (Phase 1): read new assembled types when emitting per-rule .jinja files
│   ├── client-utils.ts      # MODIFIED (Phase 3): identity projection for terminals
│   └── render-module.ts     # MODIFIED (Phase 3): napi direct property access
├── scripts/
│   └── probe-kind.ts        # diagnostic — used during migration
└── __tests__/
    ├── corpus-validation.test.ts  # RT gate (3 modes — already enforced)
    ├── nodedata-shape.test.ts     # NEW: Object.isFrozen, key enumeration, $with chain
    └── napi-direct.test.ts        # NEW (Phase 2): assert no JSON in render path

# Generated per-grammar packages (output of codegen — never hand-edited)
packages/{rust,typescript,python}/src/
├── factories.ts             # _-storage + accessor + $with (Phase 1 reshapes)
├── wrap.ts                  # accessor with drillIn (Phase 1 reshapes)
├── types.ts                 # drop $fields wrapper (Phase 1 reshapes)
├── from.ts                  # unchanged — calls factory; surface change transparent
├── ir.ts                    # unchanged — calls factory
├── consts.ts                # unchanged
└── index.ts                 # unchanged

# Native (Rust) per-grammar crates
rust/crates/sittir-{rust,typescript,python}-napi/src/
└── lib.rs                   # MODIFIED (Phase 2): napi direct read of _-prefixed properties
rust/crates/sittir-core/src/
├── engine.rs                # ParsedTree + node table (ADR-0017 landed)
├── types.rs                 # NodeData — Phase 2 napi-direct read/write
└── render.rs                # Askama-based render entry
```

**Structure Decision**: This is a **monorepo with codegen + generated outputs**. The
codegen pipeline (`packages/codegen/`) is the source of truth for generated files
under `packages/{rust,typescript,python}/`. Hand-written runtime lives in
`packages/core/`, `packages/types/`, and `rust/crates/sittir-core/`. Native render
lives in per-grammar napi crates. The phase ordering in `Source Code` annotations
above mirrors the spec's surface-first → transport → internals progression.

## Phase Ordering

Taxonomy lands first so emitters consume the new model from day one (no transient
adapter layer). Pipeline rewrite (Binding/Simplify) is the last phase — it produces
the new taxonomy from scratch instead of reaching it through current Assemble.

**Phase 1 — Taxonomy renames + Branch/Container merge (primary taxonomy goal)**
- (Phase 1a) Introduce abstract `AssembledLeaf` base class.
- (Phase 1b) Rename current open-text class `AssembledLeaf` → `AssembledPattern`. Make `Pattern`/`Keyword`/`Token`/`Enum` extend the new `AssembledLeaf` base. **Keep `modelType` strings unchanged** for byte-identity.
- (Phase 1c) Add `isField(slot: AssembledChild): slot is AssembledField` type guard. Keep both interfaces — `AssembledField extends AssembledChild` is the canonical refinement story.
- (Phase 1d) **Eliminate AssembledContainer** — fold its responsibilities (RepeatRule support, `separator` getter) into AssembledBranch. Audit the 10 emitter sites that discriminate on `modelType === 'branch' | 'container'` and switch them to discriminate on slot shape (`fields.length === 0`).
- Update all readers (emitters, validators, walkers) for the renamed identifiers.
- **Gate**: 1a/1b/1c byte-identical; 1d partition-equivalent (same kinds emit same artifacts; the internal classification mechanism changes from modelType strings to slot-shape predicates). `git diff` of regenerated grammar packages must be empty for the whole phase.

**Multi removal and Group absorption are deferred to Phase 4** — they change which classes the assembler instantiates and require the new Binding+Simplify pipeline to naturally not produce them.

**Phase 2 — Surface (consumer-visible NodeData reshape)**
- De-hoist `$fields` to `_`-prefixed storage on factory output.
- Add non-enumerable accessor functions (call returns value).
- Freeze nodes at construction.
- Replace per-field fluent methods with `$with` namespace.
- Unify wrap and factory output (same accessor + `$with` API; wrap accessors do drill-in).
- Move all sittir methods to `$`-prefix; introduce `withMethods` shared helper.
- Drop `$fields` from generated `types.ts`.
- **Gate**: native RT floors hold; new shape tests pass (Object.isFrozen, key enumeration, `$with` chain).

**Phase 3 — Transport (cross-boundary efficiency)**
- napi direct: read `_`-prefixed properties as JS object properties (no JSON round-trip).
- Identity projection: terminal slot values stored as plain strings match transport shape.
- Verify no JSON serialization remains in native render call path.
- **Gate**: native RT floors hold; factory ceilings drop toward zero; napi-direct test passes.

**Phase 4 — Internals (pipeline rewrite + architectural taxonomy changes)**
- Binding: attach terminals to nonterminal constituents.
- Simplify: push wrapper behavior down onto constituents.
- Assemble: materialize kinds from normalized constituents.
- **Architectural taxonomy** (deferred from Phase 1):
  - Eliminate `AssembledMulti` — repeats become slot-value multiplicity.
  - Absorb `AssembledGroup` into `AssembledPolymorph` (forms inline) and `AssembledBranch` (standalone hidden seqs).
  - Enforce at-most-one-unnamed-slot constraint at codegen time.
- Drop compatibility shims from earlier phases.
- **Gate**: native RT floors hold; factory ceilings at zero; no compatibility shims remain; old taxonomy classes (`AssembledMulti`, `AssembledGroup`) removed from `node-map.ts`. (`AssembledContainer` was already eliminated in Phase 1d.)

Each phase MUST pass native RT (python ≥114, rust ≥124, typescript ≥108) AND
type-check with zero errors AND `cargo build -p sittir-{rust,typescript,python}`
clean before proceeding to the next.

## Complexity Tracking

> No constitution violations. Section intentionally empty.
