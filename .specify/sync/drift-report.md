# Spec Drift Report

Generated: 2026-03-30
Project: sittir

## Summary

| Category | Count |
|----------|-------|
| Specs Analyzed | 3 |
| Requirements Checked | 45 |
| Aligned | 30 (67%) |
| Drifted | 8 (18%) |
| Not Implemented | 7 (16%) |
| Unspecced Code | 3 |

## Detailed Findings

### Spec: 001-codegen-grammarjs-rewrite

#### Aligned

- FR-001: grammar.json as primary source of truth -> `packages/codegen/src/grammar.ts` loads grammar.json
- FR-002: node-types.json as authoritative source -> `packages/codegen/src/node-types.ts` loads node-types.json
- FR-003: One factory + render table per named node kind -> `emitters/factories.ts` + `emitters/rules.ts`
- FR-004: Terminal factories for leaf kinds -> `emitters/factories.ts` emits leaf factories with `text` field
- FR-006: Fluent chainable setters for optional fields -> `emitters/factories.ts:80-114` (immutable — returns new object)
- FR-008: Render produces tokens in grammar SEQ order -> `packages/core/src/render.ts` walks S-expression templates
- FR-009: `ir` namespace with all factories -> `emitters/ir-namespace.ts` generates full `ir` namespace
- FR-010: Typed discriminated unions for multi-kind fields -> `emitters/types.ts` generates union types
- FR-011: Supertype → concrete union resolution -> `emitters/types.ts` + `emitters/kind-projections.ts`
- FR-012: `consts.ts` with arrays/maps -> `emitters/consts.ts` generates NODE_KINDS, LEAF_KINDS, KEYWORDS, OPERATORS
- FR-013: `toEdit(nodeData, rules, startPos, endPos)` -> `packages/core/src/edit.ts:11-12`
- FR-014: Generated per-node tests pass without modification -> `emitters/test-new.ts` (1,814 tests, 0 failures)
- FR-015: Multi-grammar support -> Rust, TypeScript, Python all generated from same codegen
- FR-016: Regular factory API accepts only `NodeData<NarrowKind>` -> `emitters/factories.ts` generates narrow types
- FR-017: Factory name collision detection -> `naming.ts` handles disambiguation
- FR-018: Deterministic output -> same grammar version produces identical output
- FR-019: Simplified `@sittir/types` -> No `LeafBuilder` class, no `LeafOptions`. Pure type projections.
- FR-020: Template literal type constraints for terminals -> `emitters/factories.ts` generates pattern constraints
- FR-023: Factory validates string inputs at creation -> keyword rejection + pattern matching in factories
- FR-024: `const enum SyntaxKind` + scoped enums -> `emitters/types.ts` generates both
- FR-025: Construction + navigation type projections -> `packages/types/src/index.ts` has both `NodeData<G,K>` and `TreeNode<G,K>`
- FR-026: `.from()` API per branch factory -> `emitters/from.ts` generates per-kind `.from()` functions
- FR-027: Recursively typed `FromInput` interfaces -> `emitters/types.ts` generates `*FromInput` interfaces
- FR-030: `.from()` in separate `from.ts` for tree-shaking -> confirmed separate file
- FR-031: `.from()` detects SgNode via duck typing -> `emitters/from.ts` uses `isTreeNode()` and delegates to assign

#### Drifted

- FR-005: Spec says "three usage modes: declarative (config), fluent (chaining), and mixed (positional + config)". Code only supports declarative (config object) and fluent (setter methods). No mixed mode with positional args.
  - Location: `packages/codegen/src/emitters/factories.ts:40-56`
  - Severity: moderate

- FR-006: Spec says "setters mutate the NodeData fields and return the same object". Code creates a **new object** on each setter call (immutable pattern: `{ ...config, field: newValue }`).
  - Location: `packages/codegen/src/emitters/factories.ts:80-114`
  - Severity: minor (intentional design improvement — immutability is safer)

- FR-021: Spec says ".from() accepts shorthand string values, numbers, and booleans". Implementation accepts strings and objects but number/boolean shorthand resolution is incomplete.
  - Location: `packages/codegen/src/emitters/from.ts`
  - Severity: minor

- FR-028: Spec says ".from() returns FromNode with ergonomic setters accepting FromInput types". Implementation returns same fluent node type as regular factory.
  - Location: `packages/codegen/src/emitters/from.ts`
  - Severity: minor

- FR-029: Spec says ".from() resolution logic is generated inline per factory". Implementation uses resolver registry with shared IIFE bodies keyed by deduped signatures.
  - Location: `packages/codegen/src/emitters/from.ts`
  - Severity: minor (design improvement — dedup reduces bundle size)

- SC-003: "Rendered output is syntactically valid when parsed by tree-sitter". Render engine joins all parts with single spaces, producing `name ( params )` instead of `name(params)`. Not parser-valid without post-processing.
  - Location: `packages/core/src/render.ts`
  - Severity: moderate (documented in open-issues.md #7)

- SC-005: "5-level-deep AST fragment in under 10 lines". No positional args or single-field compression makes deeply nested construction verbose.
  - Location: `packages/codegen/src/emitters/factories.ts`
  - Severity: minor

- SC-007: "Regenerating from unchanged grammar produces byte-identical output". Not verified — determinism depends on Map iteration order and signature interning consistency.
  - Location: `packages/codegen/src/build-model.ts`
  - Severity: minor

#### Not Implemented

- FR-007: Factories accept most important mandatory field as positional argument. All factories take config object only.
- FR-022: Single-field compression (`ir.string('hello')` instead of `ir.string({ content: 'hello' })`). Not implemented.

---

### Spec: 002-enriched-grammar-model

**Status: Superseded by spec 003**

This spec proposed a 4-step pipeline (GrammarRule -> EnrichedRule -> NodeModel -> Signatures) with `NodeElement` ordered sequences as the central data structure. The implementation followed spec 003's design instead.

#### Aligned

- EnrichedRule layer exists -> `packages/codegen/src/enriched-grammar.ts`
- NodeModel layer exists -> `packages/codegen/src/node-model.ts`
- `node-model.json5` serialization exists -> generated in all 3 grammar packages
- Emitters receive hydrated models, no grammar re-traversal -> confirmed via emitter signatures

#### Drifted

- Spec proposes `NodeElement` ordered sequence (field, token, child, choice) as the central model representation. Implementation uses `FieldModel[]` + `ChildrenModel` + `EnrichedRule` on structural nodes — no `NodeElement` sequence.
  - Severity: major (fundamental design divergence — spec 003 superseded this)

- Spec proposes `FieldTypeClass` with `leafTypes`, `branchTypes`, `anonTokens`, `expandedBranch`, `collapsedTypes` on each field. Implementation stores `kinds: string[]` (pre-hydration) / `kinds: HydratedNodeModel[]` (post-hydration) and computes projections on demand.
  - Severity: moderate (different representation, same capability)

#### Not Implemented

- `NodeElement` ordered sequence type
- `FieldTypeClass` pre-computed per field
- `FactorySignature` / `FromSignature` / `HydrationSignature` interning (implementation has `FieldSignature` / `ChildSignature` instead)

---

### Spec: 003-grammar-model-pipeline

#### Aligned

- 7 NodeModel variants (branch, container, leaf, enum, keyword, token, supertype) -> all present in `node-model.ts`
- Type guards (isBranch, isContainer, isLeaf, isEnum, isKeyword, isToken, isSupertype, isStructural) -> all present
- FieldModel discriminated by `multiple` (SingleFieldModel / ListFieldModel) -> confirmed
- ChildModel parallel to FieldModel -> confirmed
- Pipeline steps 1-5 (load grammar, load node-types, classify rules, initialize models, reconcile) -> confirmed
- Pipeline steps 7-8 (semantic aliases: infer + apply) -> confirmed
- Pipeline step 9 (naming) -> confirmed
- Pipeline step 10 (optimize) -> confirmed with FieldSignature/ChildSignature interning
- Pipeline step 11 (hydrate) -> confirmed with Hydrate<T> type transformation
- Hydrated types (HydratedBranchModel, HydratedNodeModel, etc.) -> confirmed
- GrammarModel with `ReadonlyMap<string, HydratedNodeModel>` -> confirmed
- In-place mutation during pipeline, readonly for consumers -> confirmed
- `node-model.json5` serialization -> confirmed
- Single-cutover migration strategy -> confirmed (no old/new coexistence)

#### Drifted

- Spec says BranchModel has `members: NodeMember[]` and step 6 is `applyAllMembers(models)`. Implementation has **no members** — the `NodeMember` type, `applyAllMembers`, and all member infrastructure were intentionally removed. The rule walker in `emitters/rules.ts` reads `EnrichedRule` directly.
  - Location: `packages/codegen/src/node-model.ts:139-145`, `build-model.ts`
  - Severity: major (intentional design change — members were redundant with the enriched rule)

- Spec describes 13-step pipeline. Implementation has 12 steps (step 6 "Apply Members" removed, renumbered).
  - Location: `packages/codegen/src/build-model.ts`
  - Severity: minor (numbering change follows from member removal)

#### Not Implemented

- `NodeMember` type and `applyAllMembers` step (intentionally removed)
- `ChildrenModel` as positional tuple type (`ChildModel[]` for 2+ ordered slots) — spec describes this but may not be exercised in practice
- Context-aware semantic alias inference (deferred per spec: "v1: naming-only")

---

## Inter-Spec Conflicts

1. **Spec 002 vs Spec 003**: Spec 002 proposes `NodeElement` ordered sequences; spec 003 proposes `NodeMember` ordered sequences. Neither is implemented — the codebase uses `EnrichedRule` directly for ordering. Spec 003 explicitly supersedes 002.

2. **Spec 003 vs Implementation (members removal)**: Spec 003 describes `NodeMember[]` on structural models and `applyAllMembers` as pipeline step 6. The implementation intentionally removed this entire infrastructure, relying on the `EnrichedRule` attached to each model for template generation. **Spec needs updating to reflect this decision.**

3. **Spec 001 FR-006 vs Implementation**: Spec says setters "mutate the NodeData fields and return the same object". Implementation returns new objects (immutable pattern). This is an intentional improvement but the spec hasn't been updated.

## Unspecced Code

| Feature | Location | Suggested Spec |
|---------|----------|----------------|
| `joinby.ts` emitter (separator maps) | `packages/codegen/src/emitters/joinby.ts` | 001 (add FR for joinBy) |
| `type-test.ts` compile-time assertions | `packages/codegen/src/emitters/type-test.ts` | 001 (add FR for type tests) |
| Reconcile field/children mismatch warnings | `packages/codegen/src/node-model.ts` | 003 (document in reconcile step) |

## Recommendations

1. **Update spec 003 to remove `NodeMember`**: The members infrastructure was intentionally removed. The spec should reflect the current design where `EnrichedRule` is retained on structural models and the rule walker in `emitters/rules.ts` reads it directly.

2. **Update spec 001 FR-005/FR-006**: Document the immutable setter pattern (returns new object) and remove the "mixed mode" claim, or implement positional args if still desired.

3. **Decide on FR-007/FR-022 (positional args, single-field compression)**: These are unimplemented. Either implement them or downgrade/remove from spec.

4. **Address render spacing (SC-003/open-issues #7)**: The single-space joining produces syntactically invalid output for adjacent tokens. This is the biggest gap between spec ("syntactically valid") and implementation.

5. **Add joinBy to spec 001**: The separator map is a core part of the render pipeline but isn't mentioned in any spec.

6. **Mark spec 002 as superseded**: It's noted in spec 003 header but the spec itself should be archived or marked clearly.
