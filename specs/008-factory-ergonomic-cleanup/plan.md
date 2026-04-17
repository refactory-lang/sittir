# Implementation Plan: Factory & Ergonomic Surface Cleanup

**Branch**: `008-factory-ergonomic-cleanup` | **Date**: 2026-04-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-factory-ergonomic-cleanup/spec.md`

## Summary

Reduce ~1000 lines of accumulated structural debt in generated sittir packages while adding the most-requested consumer feature (type guards) and establishing a zero-warnings lint floor. Six user stories, independently landable, behaviour-preserving:

1. **US1 (P1)** — NamespaceMap single-source-of-truth for per-kind type family (eliminates 5 parallel alias families, ~791 lines per grammar)
2. **US2 (P1)** — `is` / `isTree` / `isNode` / `assert` guards composing kind × shape via NamespaceMap
3. **US3 (P2)** — from.ts semantic reclaim: `isNodeData` quick-return + single-access camelCase reads (eliminates 297 dual-access casts and the snake-keyed `.fields[...]` path from from.ts)
4. **US4 (P2)** — codegen-time micro-cleanups (`_attach` → `Object.assign`, inline `_union_*`, import `_NodeData`, remove wrap double-casts)
5. **US5 (P2)** — ir.ts namespace imports + supertype-grouped sub-namespaces additive to flat `ir.*`
6. **US6 (P2)** — lint-clean generated output: fix 142 emitter-level `oxlint` warnings across three rules; wire `oxlint` into CI as a new regression floor

All changes are in `@sittir/codegen` emitters + one new module in `@sittir/types` (`NodeNs<T>`) + one helper in `@sittir/core` (`isNodeData`) + CI config update (US6). Consumer-facing behaviour is preserved; generated packages are regenerated per user story. Corpus-validation ceilings must match pre-cleanup byte-for-byte at every landing.

## Technical Context

**Language/Version**: TypeScript 6.0.2 (ESM, `.ts` extensions in imports)
**Primary Dependencies**: `@sittir/core`, `@sittir/types`, `@sittir/codegen` (workspace packages — no new deps)
**Storage**: File system — per-grammar generated output under `packages/{rust,typescript,python}/src/`
**Testing**: Vitest — existing 1228-test suite + new type-level assertions and guard composition tests
**Target Platform**: Node.js 20+ / 24+ (matches current CI matrix)
**Project Type**: Compiler (code generator for tree-sitter grammars)
**Performance Goals**: Codegen generates all three grammars in < 10s (current baseline). Generated packages tree-shake cleanly.
**Constraints**:
- No new third-party runtime dependencies in generated packages (Zero-runtime-deps constitution principle)
- All generated files must carry the existing `// Auto-generated` header
- `tsc --noEmit` must pass on all three grammar packages after every user story lands
- Corpus-validation ceilings must not regress (see spec.md SC-008)
**Scale/Scope**:
- 3 grammar packages (rust ~160 kinds, typescript ~180 kinds, python ~150 kinds)
- 5 emitters touched: `types.ts`, `factories.ts`, `from.ts`, `wrap.ts`, `ir.ts`
- 1 new emitter: `is.ts`
- 1 new type in `@sittir/types`: `NodeNs<T>`
- 1 new predicate in `@sittir/core`: `isNodeData`

## Constitution Check

**GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.**

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Grammar Alignment | ✅ PASS | No new terminology. `is.functionItem` / `isTree` / `isNode` / `assert` mirror established conventions (Babel's `t.is*` / `t.assert*`); `NamespaceMap` reuses existing `Kind` / `Node` / `Config` / `Tree` / `Loose` / `Fluent` vocabulary. |
| II. Fewer Abstractions | ✅ PASS | Net reduction: removes `KindMap`, `ConfigMap`, `LooseMap`, `XConfig`, `LooseX`, `XTree` — five parallel alias families collapsed into one `NamespaceMap`. New abstractions justified: `NodeNs<T>` is the single computed base (replaces 4 per-kind top-level types); type guards add capability that consumers currently implement by hand. |
| III. Generated vs Hand-Written | ✅ PASS | Changes are in emitter source + generated output. Only 2 hand-written additions: `NodeNs<T>` in `@sittir/types`, `isNodeData` in `@sittir/core`. Neither is inside a generated file. |
| IV. Test-First | ✅ PASS | Each user story has independent test coverage: type-level assertions for NamespaceMap convergence (SC-010), guard composition tests (SC-006/007), quick-return identity tests (SC-005c), ceiling preservation (SC-008). |
| V. Library-First | ✅ PASS | No new CLI, no new formatting, no new linting. Type guards are library API surface; `isNodeData` is a core predicate. |
| VI. Deterministic Output | ✅ PASS | Emitter changes preserve deterministic iteration (Map/Set enumeration order is already stable in the existing code). `NamespaceMap` entries iterate in kind-declaration order; `is` namespace camelCase keys derive deterministically from kind names. |
| VII. Grammar-Agnostic Pipeline | ✅ PASS | `NodeNs<T>` is generic over any `{readonly type: string}`; `isNodeData`, `isTree`, `isNode` use shape predicates (no kind-specific branches); `_toBag` (if introduced) iterates generic field entries with deterministic snake→camel rewrite. No `if (language === ...)` or `if (kind === ...)` introduced. |
| VIII. Non-lossy Transformations | ✅ PASS | Every rename maps to the same underlying type (e.g. `FunctionItem.Config` ↔ `FunctionItemConfig` — same computed type). Deprecated re-exports preserve backward compat. `.from()` quick-return on NodeData is *literally* identity — no transformation on that path. Bag-branch resolution logic is unchanged from today, only the access mechanism (single vs dual). |

**Gate status: PASS. Proceeding to Phase 0.**

## Project Structure

### Documentation (this feature)

```text
specs/008-factory-ergonomic-cleanup/
├── plan.md              # This file
├── research.md          # Phase 0 output — design rationale and alternatives considered
├── data-model.md        # Phase 1 output — NamespaceMap, NodeNs, guard shape, resolver state machine
├── quickstart.md        # Phase 1 output — consumer-facing examples: guards, NamespaceMap, .from() semantics
├── contracts/
│   ├── NodeNs.md        # Contract for the per-kind namespace interface
│   ├── NamespaceMap.md  # Contract for the single source-of-truth map
│   ├── is-guards.md     # Contract for is/assert namespaces and shape guards
│   └── from-resolver.md # Contract for resolver dispatch: isNodeData quick-return + bag-only body
├── checklists/
│   └── requirements.md  # Spec quality checklist (passing)
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/
├── types/                    # @sittir/types — hand-written
│   └── src/
│       └── index.ts          # ADD: NodeNs<T> base interface
├── core/                     # @sittir/core — hand-written
│   └── src/
│       ├── index.ts          # ADD: isNodeData export
│       └── readNode.ts       # unchanged
├── codegen/                  # @sittir/codegen — hand-written
│   └── src/
│       ├── emitters/
│       │   ├── types.ts      # MODIFY: emit NodeNs-per-kind, NamespaceMap, inline unions, namespace sugar
│       │   ├── factories.ts  # (touched only incidentally — return-type references shift)
│       │   ├── from.ts       # MODIFY: namespace imports + isNodeData quick-return + single-access body + concrete types
│       │   ├── wrap.ts       # MODIFY: import _NodeData from types, tighten drillIn return type, remove double-cast
│       │   ├── ir.ts         # MODIFY: namespace imports, grouped sub-namespaces (additive), replace _attach with Object.assign
│       │   └── is.ts         # NEW: per-kind is guards, supertype guards, isTree/isNode, assert namespace
│       └── compiler/
│           └── generate.ts   # MODIFY: invoke the new is.ts emitter
├── rust/                     # @sittir/rust — generated
├── typescript/               # @sittir/typescript — generated
└── python/                   # @sittir/python — generated
    └── src/
        ├── types.ts          # regenerated per US1
        ├── factories.ts      # regenerated per US4 (incidentally per US1)
        ├── from.ts           # regenerated per US3
        ├── wrap.ts           # regenerated per US4
        ├── ir.ts             # regenerated per US4/US5
        └── is.ts             # NEW generated file per US2
```

**Structure Decision**: Standard sittir workspace layout — no new top-level packages, no new directories, no changes to build or test configuration. All feature work is in `packages/codegen/src/emitters/*` + two small additions (`@sittir/types:NodeNs<T>`, `@sittir/core:isNodeData`). Generated output appears under `packages/{grammar}/src/` as today; US2 adds one new generated file (`is.ts`) per grammar.

## Complexity Tracking

> Constitution Check passed with no violations. No complexity justification required.

No violations to track — every change either reduces surface (deleting aliases, import walls, helper indirection) or replaces a one-off construct with a single reusable one (`NodeNs<T>`, `isNodeData`). The only "added" abstractions are:

- `NodeNs<T>` — justified because it replaces four per-kind top-level types with one computed base, net reduction.
- `is` / `isTree` / `isNode` / `assert` surfaces — justified by Principle II's own bar: these solve a problem consumers cannot solve with existing types (narrowing `AnyNodeData` through a `type` discriminant + shape composition). The current absence forces manual casts in consumer code, which is worse than a well-factored generated guard API.
- `isNodeData` — justified because it replaces the ad-hoc `'render' in input` probe (which only catches factory outputs, misses wrap outputs) with a single shared predicate. Net consolidation, not addition.
