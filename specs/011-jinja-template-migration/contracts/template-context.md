# Contract: `TemplateContext`

The shared bag passed to every template render. TypeScript and Rust
implementations MUST produce byte-identical values per field for the same
input node.

## Shape

| Field | TS Type | Rust Type | Semantics |
|-------|---------|-----------|-----------|
| `<field_name>` | `string \| undefined \| readonly string[] \| boolean` | `Option<&str>` / `&[String]` / `bool` | Pre-rendered field slot (raw snake_case name). Boolean for keyword-presence fields; string for single-valued; `string[]` for multi-valued pre-split. `undefined` / `None` when field is absent. |
| `children` | `string` | `&str` | Pre-joined, pre-filtered unconsumed named children with joinBy + leading/trailing separators applied. |
| `children_list` | `readonly string[]` | `&[String]` | Individual pre-rendered children in source order, for `{% for %}` loops. Excludes children already consumed by clauses or fields. |
| `variant` | `string` (empty when absent) | `&str` | Node's `$variant` value. Empty string when absent — never null/undefined; keep templates from needing `{% if variant is defined %}`. |
| `text` | `string` (empty when absent) | `&str` | Node's `$text`. |
| `trailing_sep` | `boolean` | `bool` | `flankSep` trailing match result from `prepare()`. |
| `leading_sep` | `boolean` | `bool` | `flankSep` leading match result from `prepare()`. |

## Derivation

The context MUST be produced by ADR-0013 Task 3's `prepare()` step, which
already populates the substitution values we're re-expressing as named
keys. No template shall reach back into `AnyNodeData`, the tree-sitter
handle, or the consumed-index set.

## Variable naming

- All field-slot keys are raw tree-sitter field names (snake_case) —
  not camelCase, not reshaped.
- Clause references use `<name>_clause` (mirrors current behavior —
  e.g., `return_type_clause`, `body_clause`).
- Reserved names on this contract: `children`, `children_list`,
  `variant`, `text`, `trailing_sep`, `leading_sep`. A rule whose
  grammar declares a field colliding with any reserved name is a
  translator-time error (FR-005 loud failure).

## Template responsibility boundary

Templates MUST NOT:
- Recurse into sub-renders themselves (the engine does this implicitly via recursive `render()` on child nodes before `prepare()` populates `children` / `children_list`).
- Compute field values from raw node structure.
- Reach into sibling children (only `children` + `children_list` + declared field slots are visible).

Templates MAY:
- Conditionally include content based on any context variable (empty-string sentinel values make `{% if variant %}` work correctly).
- Iterate `children_list` for custom separator / prefix / suffix logic.
- Apply authoring-subset filters (`join`, `length`, `default`, `trim`, `upper`, `lower`).

## Cross-render parity guarantee

For every corpus node, the following MUST hold:

```
render_ts(ts_context(node)) == render_rust(rust_context(node))
```

The TS `TemplateContext` and the Rust per-rule struct are semantically
equivalent for every field name present in both. Extra fields on the
Rust struct (e.g., unused optional fields declared by the grammar but
not referenced by the template) are permitted — they are ignored by
askama.
