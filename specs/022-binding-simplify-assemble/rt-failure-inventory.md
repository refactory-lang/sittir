# RT Failure Inventory (2026-05-02)

Baseline: 327/363 RT passing (36 failures). 4378/4687 total tests passing.

## Per-Grammar State

| Grammar    | RT Floor | RT Actual | Failures |
|------------|----------|-----------|----------|
| rust       | 121      | 121/136   | 15       |
| typescript | 99       | 99/112    | 13       |
| python     | 107      | 107/115   | 8        |

## 022-Addressable Failures (17)

### Cluster 1: Synthesized Form Numeric Dispatch (6 rust)

Kinds: `closure_expression` forms, `raw_string_literal` variants, `unary_expression.operator`

Root cause: Phase D's KindID migration created synthesized kinds without
parser.c TSKindId. `readTreeNode` resolves to `$type=0` (sentinel).

022 path: Simplify phase creates TypeID mappings for forms without native
parser symbols.

### Cluster 2: Field/Children Shape Mismatches in from() (13 across all grammars)

- **rust (7):** `function_modifiers`, `visibility_modifier`, `type_arguments`, `attribute`, `tuple_pattern`, `range_expression`, `range_pattern`
- **typescript (2):** `class_body`, `parenthesized_expression`
- **python (4):** `assignment`, `raise_statement`, + 2 others in factory validation

Root cause: `from()` assumes field structures that don't match actual
NodeData. Fields sometimes surface as `$children` vs `$fields`
inconsistently.

022 path: Binding + Simplify + Assemble normalize field/children routing
so both factory and `from()` see a consistent constituent structure.

## Not 022-Addressable (19)

### Reparse Wrapper Gaps

- **python (34 coverage):** `match_statement`, import/with/try/for statements — multi-statement context needed
- **rust (9-10):** `function_type`, `struct_item`, `impl_item`, `pointer_type`, `generic_type`

Root cause: rendered fragment is incomplete for wrapping context (e.g.,
bare `fn _f() { render(node); }` can't render `type_item` alone).

Fix: custom wrapper per kind or multi-fragment render support. Not a
field/children model issue.

### Anonymous Token Field Omissions (6 rust)

`closure_expression.async`, `function_modifiers.async`,
`negative_literal.operator`, etc.

Root cause: override-promoted fields not interpolated in templates.

Quick fix: add `{{ async }}`, `{{ operator }}` to templates (~5 min each).

### Variable Clause Routing Gaps

`$VALUE_CLAUSE`, `$RETURN_TYPE_CLAUSE`, etc. resolve to nothing.

Affects: `enum_variant`, `const_item`, `static_item`, `impl_item`,
`let_declaration`, `type_parameter`, `array_type`, `function_type`, etc.

Root cause: clauses not defined or override routing missing.

Quick fix: map to actual fields (~10 min per kind).

## Quick Win Estimates (pre-022)

| Fix                              | Effort   | RT Gain |
|----------------------------------|----------|---------|
| Anon token field interpolation   | 30 min   | +6      |
| Variable clause routing          | 80 min   | +5-8    |
| Field coverage gaps              | 50 min   | +2-3    |
| **Total**                        | **~3 hr**| **+13-17** |

## Hoist Terminal Values to Slots (022 core task)

Factory, readNode (JS + Rust), and wrap currently store leaf children as
full NodeData objects (`{ $type, $text, $source, $named }`). The native
transport already hoists these to plain strings at the slot level. Making
all surfaces store the same shape eliminates the projection layer
entirely — NodeData IS the transport.

**Current:** `$fields.name = { $type: 1, $text: "foo", $source: "factory" }`
**Target:**  `$fields.name = "foo"`

The slot classification logic already exists: `isTerminalTransportNode`
in `types.ts` (checks `modelType ∈ {leaf, keyword, token, enum}`), and
`fieldTypeComponents` in `shared.ts` decomposes field content with kind
refs. These are available to every emitter via the nodeMap — they just
need to be applied to the factory/readNode/wrap/config surfaces, not
only the transport surface.

**Surfaces to change:**
1. Factory emitter — terminal slots store `text` not `leafFactory(text)`
2. readNode (JS) — terminal children → `$text` strings in `$fields`
3. readNode (Rust/napi) — same
4. wrap.ts — lazy getters for terminal slots return strings
5. Config/Loose types — terminal field types become `string`
6. Projection — becomes identity (zero conversion)

**Factory round-trip impact:** resolves the napi `Failed to convert
Object {...} into String` errors (currently ~280 rust, ~145 ts, ~65 py
ceiling). These are leaf NodeData objects crossing the transport boundary
where Rust expects plain strings.

## Cluster F Walker Refactor (separate track)

Optional field separator whitespace — `{{ field }} separator {{ next }}` 
leaves stray whitespace when field is absent. Documented in
`template-walker-frozen.test.ts` with `mode: 'fail'` cases. Overlaps
with 022's Simplify pass (could auto-detect and correct emission) but is
primarily a walker/template concern.
