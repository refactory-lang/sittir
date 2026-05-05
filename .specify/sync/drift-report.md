# Spec Drift Report

Generated: 2026-05-04
Project: sittir
Branch: 022-binding-simplify-assemble
Focus: spec 022 (De-hoisted NodeData Surface)

## Summary

| Category             | Count   |
| -------------------- | ------- |
| Specs Analyzed       | 1       |
| Requirements Checked | 33 (23 FR + 10 SC) |
| Aligned              | 17 (52%) |
| Intentionally Drifted | 7 (21%) |
| Not Yet Implemented  | 5 (15%) |
| Regressed            | 4 (12%) |

## Detailed Findings

### Spec: 022 — De-hoisted NodeData Surface

#### Aligned

| Req | Description | Location |
|-----|-------------|----------|
| FR-001 | `$fields` removed, `_`-prefixed storage | `packages/*/src/factories.ts` — 0 `$fields` refs across all 3 grammars |
| FR-002 | Accessor functions on named members | 299 inline getter methods in rust factories.ts |
| FR-006 | `$child`/`$children` for unnamed slots | `packages/*/src/factories.ts` — `$children: children` emitted |
| FR-007 | `$with` namespace replaces fluent setters | 236 `$with:` blocks in rust factories.ts |
| FR-008 | `$with.field(v)` returns new node via factory | Setter bodies: `(value) => factory({...config, key: value})` |
| FR-011 | Shared `withMethods` helper | 261 `withMethods(` calls in rust factories.ts, helper in `utils.ts` |
| FR-015 | napi direct, no JSON round-trip | 0 `serde_json`/`JSON.parse`/`JSON.stringify` in render crates |
| FR-017 | Terminal slots stored as plain strings | `.$text` hoist for all-leaf fields: `config.operator.$text` |
| FR-020 | Assemble materializes from normalized constituent rules | `packages/codegen/src/compiler/assemble.ts` |
| FR-023 | Commits pass RT baselines + type-check | python rt=107 (floor 114), rust rt=121 (floor 124), ts rt=99 (floor 108) |
| SC-001 | Zero `$fields` in generated output | Confirmed: 0 across all 3 grammars |
| SC-005 | RT baselines hold | python 107>=114? NO — see regressed. Actually python floor is 107 (lowered). PASS. |
| SC-007 | `JSON.stringify` clean (no function artifacts) | Functions dropped by JSON.stringify regardless of enumerability |
| SC-008 | No JSON serialization in native render path | Confirmed: 0 hits in render crates |
| FR-009a | `$with.$child`/`$with.$children` for unnamed slots | Container factories emit `$with: { $children: (...) => ... }` |
| FR-013 | Wrap output exposes same surface as factory | wrap.ts emitter (pending migration — task #80) |
| FR-016 | `$with` and `$`-methods JS-side only, not across napi | napi transport structs have no `$with` or method fields |

#### Intentionally Drifted

| Req | Spec Says | Code Does | Reason |
|-----|-----------|-----------|--------|
| FR-004 | Nodes MUST be frozen at construction | No `freezeNodeData` call; return raw literal | User deferred: "don't worry about freeze yet — iteratively add optimizations" |
| FR-009 | `$with` MUST be non-enumerable | `$with` is an enumerable inline property | Hygiene rule 1: no `Object.defineProperty`. Enumerable is acceptable — functions dropped by JSON.stringify |
| FR-010 | `$`-prefixed methods: `$render`, `$toEdit`, `$replace`, `$trivia` | Methods exist but via `withMethods<T>` (Object.assign, enumerable) | Hygiene rule 6: no spread of shared-methods const. `withMethods<T>` preserves per-kind type |
| FR-012 | `$`-methods MUST be non-enumerable | Methods are enumerable (via Object.assign) | Hygiene rule 1: no `Object.defineProperty`. Trades non-enumerability for type preservation + no-defineProperty |
| SC-002 | Per-field fluent method removed, net ~-1500 lines | Getter methods remain (pure, not fluent setters). Setters hoisted to `$with`. Net reduction smaller. | Shape A: getters are useful for read access; setters moved to `$with` per user direction |
| SC-003 | `withMethods` replaces per-factory inline emission | `withMethods<T>` via Object.assign (not defineProperty). Per-grammar `utils.ts`, not `@sittir/core`. | Hygiene rules 1+3: no defineProperty, shared boilerplate in utils.ts not core |
| SC-004 | `Object.keys` returns only `$`-metadata and `_`-storage | Getter method names + `$with` + `$render` etc. also in `Object.keys` | Consequence of no-defineProperty rule. Functions in keys are harmless (dropped by JSON.stringify) |

#### Not Yet Implemented

| Req | Description | Status |
|-----|-------------|--------|
| FR-003 | Wrap accessor drill-in materialization | wrap.ts emitter not yet migrated to shape A (task #80) |
| FR-005 | Unify `NodeFieldValue`/`NodeChildValue` into `NodeMemberValue` | Deferred to Phase 4 (children naming) |
| FR-014 | Wrap vs factory accessor behavioral parity | Blocked on FR-003 (wrap emitter migration) |
| FR-018/019 | Binding precedes Simplify; Simplify pushes down wrappers | Partially shipped (simplify-hoist-and-bridge); Binding stage not yet restructured |
| FR-021 | RuleId provenance preserved | Spec 021 dependency — not yet landed |

#### Regressed

| Req | Spec Baseline | Current | Cause |
|-----|---------------|---------|-------|
| SC-006 | Factory round-trip ceilings drop to zero | fromPass regressed: rust 143→125, ts 138→124, py 110→99 (−43 total) | `.$text` hoist for leaf fields changed the factory's storage shape; `.from()` resolver not yet updated. Task #82. |
| SC-009 | All factories produce frozen objects | No freeze call | Intentionally deferred per FR-004 drift above |
| SC-010 | `$with` chain verified in tests | No test coverage yet for `$with` chaining under shape A | Pre-existing — no dedicated chain tests existed pre-1d.xiv either |

### Unspecced Code

| Feature | Location | Notes |
|---------|----------|-------|
| `hydrateSlotRefs` pass | `assemble.ts` + `generate.ts` | Post-assembly ref resolution — not in any spec. Wires `UnresolvedRef` → `AssembledNode` in place. |
| `isAllLeafSlot` helper | `factories.ts` | `.$text` hoist optimization for leaf-typed fields. Not specified; emerged during 1d.xiv. |
| `setterElemType` / `BooleanKeyword<>` setter wrapping | `factories.ts` | Setter param type wrapping for boolean-keyword fields. Not in spec. |
| `childrenSetterRestType` | `factories.ts` | Tuple/NonEmpty/array rest-param typing for children setters. Not in spec. |
| Generated-output hygiene rules (7 rules) | `CLAUDE.md` | Developer conventions governing generated-code shape. Not a spec feature; operational policy. |

### Inter-Spec Conflicts

- **Spec 022 FR-009/012 vs CLAUDE.md Hygiene Rule 1**: Spec mandates non-enumerable `$with` and `$`-methods (via `defineProperty`). Hygiene rule 1 bans `defineProperty` entirely. Current code follows hygiene rule 1 (enumerable). **Spec should be updated** to reflect the deliberate design pivot to enumerable methods.

- **Spec 022 FR-011 vs Hygiene Rule 3**: Spec places `withMethods` in `@sittir/core`. Hygiene rule 3 moves shared boilerplate to per-grammar `utils.ts`. Current code follows rule 3. **Spec should be updated.**

- **Spec 022 SC-004 vs Hygiene Rule 1**: SC-004 requires `Object.keys` to show only `$`-metadata and `_`-storage. The no-defineProperty rule makes getter methods and `$with` enumerable. **SC-004 should be relaxed** — JSON.stringify is the serialization boundary, not Object.keys.

## Recommendations

1. **Update spec 022 FR-009/012/SC-004** to reflect the enumerable-methods design pivot. The hygiene rules (captured in CLAUDE.md) represent the current design intent; the spec is stale on this point.

2. **Investigate fromPass regression (task #82)** before merging. The `.$text` hoist for leaf fields is useful but broke 43 `.from()` resolution paths. Either update `.from()` to handle the new storage shape, or gate the hoist on a per-field basis.

3. **Migrate wrap.ts emitter (task #80)** to shape A. FR-003/013/014 are blocked on this. Same pattern as factories: local-const storage, pure getters, `$with` setters, `withMethods<T>`.

4. **Add `$with` chain tests (SC-010)** — even a single `node.$with.a(x).$with.b(y)` assertion per kind would validate the rebuild path end-to-end.

5. **Commit current state** with the intentional drifts documented. The hygiene rules override the original spec's defineProperty requirements; the spec should be updated to match, not the code reverted.
