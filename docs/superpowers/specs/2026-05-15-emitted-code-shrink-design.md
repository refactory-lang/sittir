# Emitted Code Shrink — Targets and Tradeoffs

**Date:** 2026-05-15
**Status:** Draft (scoping)
**Branch context:** post-024 cleanup; not in scope for the current 024 cleanup pass
**Related:** [`2026-05-15-metadata-pipeline-consolidation-design.md`](./2026-05-15-metadata-pipeline-consolidation-design.md)

This design audits the codegen-emitted TypeScript surface in `packages/<grammar>/src/` and proposes targeted shrinks. Generated code line count isn't intrinsically bad (humans don't maintain it), but redundant projections of the same metadata are real drift risk and unused exports are dead weight in the public API surface.

## 1. Inventory (rust grammar)

Total emitted TS: **23,818 lines** across 15 files.

| File | Lines | Per-kind density | Shrink potential |
|---|---|---|---|
| `types.ts` | 7,174 | ~20 lines/kind | High — per-form interfaces + per-supertype enums |
| `factories.ts` | 5,023 | ~14 lines/kind | (deprioritized — see §6) |
| `wrap.ts` | 4,168 | ~11 lines/kind | (deprioritized — see §6) |
| `consts.ts` | 2,215 | ~6 lines/kind | Medium — kind-id tables emitted 3×; field-id tables 4× |
| `from.ts` | 2,173 | ~6 lines/kind | (deprioritized — see §6) |
| `is.ts` | 1,092 | ~3 lines/kind | (deprioritized — see §6) |
| `ir.ts` | 687 | low | Low |
| `type-test.ts` | 466 | low | Low |
| `grammar.ts` | 338 | low | Low |
| Other (~6 small files) | 656 | low | Low |

## 2. Usage audit (rust)

For each top-level export in `consts.ts` and `types.ts`, counted internal imports:

| Export | Internal imports | Status |
|---|---|---|
| `TSKindId` (types.ts) | 39 files | **load-bearing** |
| `KIND_NAMES` (types.ts) | 12 files | **load-bearing** |
| `NODE_KINDS` / `LEAF_KINDS` / `ALL_KINDS` (consts.ts) | 0 | API-surface-only (re-exported via `index.ts`, snapshot-locked by `api-surface.test.ts.snap`) |
| `KEYWORDS` / `OPERATORS` (consts.ts) | 0 | API-surface-only |
| `TREE_SITTER_KIND_ID_BY_KIND` / `_BY_KIND_ID` / `_JSON` (consts.ts) | 0 | API-surface-only — same data emitted 3 times |
| `TREE_SITTER_FIELD_ID_BY_NAME` / `_NAME_BY_ID` / `_JSON` (consts.ts) | 0 | API-surface-only — same data emitted 3 times |
| `FIELD_MAP` (consts.ts) | 0 | API-surface-only |
| `_PRIMITIVE_TYPES`, `BOOLEAN_LITERALS`, `FRAGMENT_SPECIFIERS`, etc. (consts.ts) | 0 | grammar-rule extracts; API-surface-only |
| 14 per-supertype enums (`ConditionKind`, `DeclarationStatementKind`, ... in types.ts) | 0 | API-surface-only |

**Key takeaway:** much of `consts.ts` is exposed publicly but unused internally. Whether external (out-of-workspace) consumers depend on these is the audit gate for any removal — needs check before deleting from the API surface.

## 3. Active shrink targets

### Spike A — `consts.ts` redundant projections (~600 lines)

Three exports for the same kind-ID data:

| Lines | Export | Same data as |
|---|---|---|
| 420–669 (250) | `TREE_SITTER_KIND_ID_BY_KIND` | source of truth |
| 670–919 (250) | `TREE_SITTER_KIND_BY_KIND_ID` | inverse: `Object.fromEntries(Object.entries(K).map(([k,v]) => [v,k]))` |
| 920–1169 (250) | `TREE_SITTER_KIND_ID_JSON` | array form: `Object.entries(K).map(([k,v]) => [k,v])` |

Same pattern for field IDs (lines 1243–1462: 3 exports of the same 73-row data).

**Action:** emit only the source-of-truth maps. If the inverse/array forms are used by external consumers, expose tiny derive helpers in `@sittir/common/derive` instead of pre-emitting them. Saves ~600 lines per grammar.

**Risk:** API-surface change. Snapshot test (`api-surface.test.ts.snap`) needs updating; external consumers may need to migrate to the derive helpers.

### Spike B — `types.ts` per-supertype enums (~380 lines)

14 enums, all with zero internal imports: `ConditionKind`, `DeclarationStatementKind`, `DelimTokensKind`, `ExpressionKind`, `ExpressionEndingWithBlockKind`, `ExpressionExceptRangeKind`, `LiteralKind`, `LiteralPatternKind`, `NonDelimTokenKind`, `PathKind`, `PatternKind`, `StatementKind`, `TokenPatternKind`, `TokensKind`, `TypeKind`, `UseClauseKind`.

These mirror `node-model.json5` supertype membership — runtime callers can query `nodeModel.bySupertype.get('expression')` (see [metadata-pipeline-consolidation-design](./2026-05-15-metadata-pipeline-consolidation-design.md) Axis 1) instead.

**Action:** stop emitting these enums. Saves ~380 lines per grammar.

**Risk:** API-surface change; external consumers may import them.

### Spike E — per-form interface audit (~3000 lines, condition: internal-only)

`types.ts` lines 2106+ emit ~500 per-form/per-kind TypeScript interfaces (`ArrayExpressionList`, `ArrayExpressionSemi`, `ClosureExpressionBlock`, `_ClosureExpressionExpr`, etc.). Each is a record-typed interface naming the kind's fields.

**Audit needed:** are these consumed by user code, or only by the generated `NodeData<K>` mapping internally? If internal-only, replace with a single generic `NodeData<K extends NodeKind>` template that derives the shape from `FIELD_MAP` at compile time.

**Risk:** TypeScript hover/IDE ergonomics — per-form interfaces give precise hover info per kind. A generic template might display as "expanded type" which is harder to read. Worth weighing against the line-count savings.

**Action:** audit external usage first; if eligible, do a small spike replacing 5–10 form interfaces and comparing IDE behavior side-by-side before committing to the full refactor.

## 4. Estimated shrink (active spikes only)

| File | Today | Targeted | Shrink |
|---|---|---|---|
| consts.ts (Spike A + B-related parts) | 2215 | ~1200 | -46% |
| types.ts (Spike B) | 7174 | ~6800 | -5% |
| types.ts (Spike B + E if eligible) | 7174 | ~3800 | -47% |
| **Total per grammar (without E)** | **23,818** | **~22,400** | **-6%** |
| **Total per grammar (with E)** | **23,818** | **~19,400** | **-19%** |

Across 3 grammars: ~12K lines saved without E, ~45K with E.

## 5. Cross-cutting principle that DOES apply

For Spikes A and B, the principle is: **don't emit the same fact in multiple shapes when one shape suffices** plus **don't emit unused-by-INTERNAL exports just because they're easy to derive**. The latter is conditional — exports may be useful to external introspection consumers even when no internal code imports them.

Spike E is a different principle: **per-kind metadata can be expressed via generic templates over a metadata table**. This is more invasive and trades flexibility for line count.

## 6. Spike C — `consts.ts` grammar-rule extracts — DEPRIORITIZED

Lines 2110–2200 in consts.ts (~90 lines): per-grammar enum constants like `__RANGE_EXPRESSION_BINARY_OPERATORS`, `_COMPOUND_ASSIGNMENT_EXPR_OPERATORS`, `_PRIMITIVE_TYPES`, `_RESERVED_IDENTIFIERS`, `_TOKEN_BINDING_PATTERN_TYPES`, `_UNARY_EXPRESSION_OPERATORS`, `BOOLEAN_LITERALS`, `FRAGMENT_SPECIFIERS`. Grammar-rule literal extractions; zero internal imports.

**Earlier proposal:** stop emitting these.

**Why deprioritized:**

- **Grammar introspection has external value** even when sittir-internal code doesn't consume it. Downstream tools (syntax highlighters, docs generators, IDE plugins, lint rules over rust source) may reasonably want "what are all the rust primitive types?" or "what compound-assignment operators exist?" without re-deriving from grammar source.
- **The cost of keeping them is tiny** — ~90 lines per grammar, declared once at codegen time, no runtime overhead, no maintenance burden (auto-generated).
- **Removing them is API-surface-breaking** — possible external consumers exist that we can't easily survey.
- **The savings (~90 lines) don't justify the disruption.**

**Decision:** keep emitting these. If a future audit shows they're truly unused by anyone, revisit. Until then, treat them as documented introspection surface.

## 7. Spike D — table-driven generic factories/wrap/from/is — DEPRIORITIZED

An earlier draft of this design proposed replacing per-kind factory/wrap/from/is functions with a generic table-driven implementation:

```typescript
function makeFactory<K extends NodeKind>(kind: K) {
  const fields = FIELD_MAP[kind];
  return (...args) => buildNode(kind, fields, args);
}
export const factories = Object.fromEntries(ALL_KINDS.map(k => [k, makeFactory(k)]));
```

**Estimated potential savings:** ~10K lines per grammar (factories.ts + wrap.ts + from.ts + is.ts together).

**Why deprioritized:**

- **Generated code line count isn't intrinsically a cost.** Humans don't maintain these files. The shrink doesn't pay for itself in maintenance burden.
- **Tree-shaking erosion.** Per-kind named exports (`export function modItem(...)`) let bundlers drop unused kinds. `factories.mod_item(...)` references a single object that holds ALL kinds — tree-shakers can't prune. Bundle size for runtime users could grow even though source line count shrinks.
- **IDE ergonomics regress.** Hover info on `modItem(args)` directly gives the named return type (`ModItem`). Hover on `factories.mod_item(args)` requires generic type inference, which can produce expanded/messy hover text or fail to narrow.
- **Type narrowing risk.** `is.modItem(node)` is a per-call type predicate. A generic table-driven `is` might lose the narrowing in TypeScript's type checker, requiring callers to assert types.
- **Performance** — table-driven dispatch is one hashmap lookup vs direct function call. Negligible at usual call frequencies; matters in tight render loops only if the lookup isn't inlined.
- **Risk-to-reward ratio is poor.** Big semantic refactor, large test surface, breaks tree-shaking — all to remove lines from auto-generated files that nobody reads.

**Decision:** do not pursue. If line count of generated files becomes a real problem (e.g., parse-time pressure on dev tooling), reconsider with a smaller scope (maybe just `is.ts` since type guards are cheaper to template).

## 8. Recommended sequencing

These shrinks have low priority compared to the 024 cleanup work and the metadata-pipeline-consolidation work. They should land AFTER both:

1. 024 cleanup completes (per-slot enums, legacy `render_dispatch` deletion, wrap-side fixes, Phase C cleanup loop)
2. Metadata-pipeline-consolidation Axis 2 (shared slot-model helper) lands
3. Metadata-pipeline-consolidation Axis 1, Spikes 1-3 land (lift kindId/factoryShape/polymorphDispatch into node-model.json5)
4. **THEN this work**: Spikes A and B in order. External-consumer audit before each removal.
5. **Conditional**: Spike E if external-consumer audit shows per-form interfaces are internal-only AND IDE-ergonomics spike confirms acceptable hover behavior.

## 9. Risks summary

- **API-surface stability** — every spike here removes or changes a public export of `@sittir/<grammar>` packages. Minimum: snapshot test update + deprecation cycle. Maximum: major version bump + migration guide for external consumers.
- **External consumer survey is gating** — without confidence that nothing outside this workspace depends on `KEYWORDS`, `FIELD_MAP`, the per-supertype enums, etc., we can't safely remove. Recommend a brief survey of any known downstream consumer before the first removal.
- **Coordination with metadata-pipeline-consolidation Axis 1** — Spikes A and B both assume `node-model.json5` carries the data being removed (so external consumers have somewhere to read it from). They're dependent on Axis 1 landing first.

## 10. Out of scope

- Spike C (grammar-rule extracts) — see §6 for rationale; preserved as introspection surface.
- Spike D (table-driven factories/wrap/from/is) — see §7 for rationale.
- Per-grammar variation in shrink potential — focus is rust; ts and python likely have similar but not identical numbers.
- Runtime perf optimization of the generated code — different concern, separate design.
