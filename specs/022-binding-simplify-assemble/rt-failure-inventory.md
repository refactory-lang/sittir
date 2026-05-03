# RT Failure Inventory (2026-05-03)

Updated after ADR-0017 + native render switch.

## Per-Grammar State (native Askama render)

| Grammar    | RT Pass | RT Total | AST Match | Skip | Fail |
|------------|---------|----------|-----------|------|------|
| rust       | 124     | 136      | 124       | 12   | 0    |
| typescript | 108     | 112      | 108       | 4    | 0    |
| python     | 114     | 115      | 114       | 1    | 0    |

**Zero RT failures.** All non-passes are skips (corpus entries with
parse errors). The native Askama render path produces correct output
for every testable kind.

### Comparison: native vs JS Nunjucks render

| Grammar    | JS (master) | Native (ADR-0017) | Delta |
|------------|------------|-------------------|-------|
| python     | 74/115     | **114/115**       | **+40** |
| rust       | 121/136    | **124/136**       | **+3** |
| typescript | 106/112    | **108/112**       | **+2** |

The JS Nunjucks path has template spacing bugs (Cluster F walker
issues) that the native Askama path handles correctly.

## 022-Addressable Issues (non-RT)

### Cluster 1: Synthesized Form Numeric Dispatch (6 rust)

Kinds: `closure_expression` forms, `raw_string_literal` variants,
`unary_expression.operator`

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

## Non-022 Issues

### Reparse Wrapper Gaps

- **python (34 coverage):** `match_statement`, import/with/try/for statements
- **rust (9-10):** `function_type`, `struct_item`, `impl_item`, `pointer_type`, `generic_type`

Root cause: rendered fragment is incomplete for wrapping context.

### Anonymous Token Field Omissions (6 rust)

`closure_expression.async`, `function_modifiers.async`,
`negative_literal.operator`, etc.

Quick fix: add `{{ async }}`, `{{ operator }}` to templates (~5 min each).

### Variable Clause Routing Gaps

`$VALUE_CLAUSE`, `$RETURN_TYPE_CLAUSE`, etc. resolve to nothing.

Quick fix: map to actual fields (~10 min per kind).

## Quick Win Estimates

| Fix                              | Effort   | RT Gain |
|----------------------------------|----------|---------|
| Anon token field interpolation   | 30 min   | +6      |
| Variable clause routing          | 80 min   | +5-8    |
| Field coverage gaps              | 50 min   | +2-3    |
| **Total**                        | **~3 hr**| **+13-17** |

Note: these affect the **JS Nunjucks** path only. The native Askama
path already handles these correctly (zero RT failures).

## Hoist Terminal Values to Slots (022 core task)

Factory, readNode (JS + Rust), and wrap currently store leaf children as
full NodeData objects (`{ $type, $text, $source, $named }`). The native
transport already hoists these to plain strings at the slot level. Making
all surfaces store the same shape eliminates the projection layer
entirely — NodeData IS the transport.

**Current:** `$fields.name = { $type: 1, $text: "foo", $source: 0 }`
**Target:**  `$fields.name = "foo"`

**readNode storage model:** both terminal and nonterminal children store
`$text` (source span). Terminal children ARE their text — plain string at
the slot. Nonterminal children store `{ $type, $text, $nodeHandle,
$childIndex }` stubs; drill-in via handle materializes the full NodeData
object.

**Factory round-trip impact:** resolves the napi `Failed to convert
Object {...} into String` errors. Current ceilings: rust 350,
typescript 215, python 75.

## Cluster F Walker Refactor (separate track)

Optional field separator whitespace — `{{ field }} separator {{ next }}`
leaves stray whitespace when field is absent. Documented in
`template-walker-frozen.test.ts` with `mode: 'fail'` cases. Affects
the **JS Nunjucks** render path only — native Askama handles it
correctly. With RT now defaulting to native, these are no longer RT
blockers but still affect JS-side render quality.
