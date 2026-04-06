# Data Model: YAML Render Templates

## Entities

### TemplateRule

A render template for a single node kind. Two forms:

**String form** (simple template, no clauses, no joinBy):
```
"$LEFT $OPERATOR $RIGHT"
```

**Object form** (template + optional clauses + optional joinBy):
```
{
  template: string
  *_clause: string          // zero or more clause keys (snake_case, suffix "_clause")
  joinBy?: string | Record<string, string>
}
```

**Fields**:
- `template` — the template string containing `$VARIABLE` slots and literal text
- `*_clause` — synthesized clause sub-templates, named `{field_name}_clause`
- `joinBy` — separator for `$$$` (multi) variables: string (all vars) or object (per-variable)

**Validation**:
- String form: must contain at least one `$` variable or be a literal
- Object form: must have `template` key; clause keys must end with `_clause`; `joinBy` keys must correspond to `$$$` variable names in the template

### RulesConfig

The full YAML template file shape. One per grammar package.

**Fields**:
- `language: string` — language identifier (e.g., `"rust"`, `"typescript"`, `"python"`)
- `extensions: string[]` — file extensions (e.g., `["rs"]`, `["ts", "tsx"]`)
- `expandoChar: string | null` — replaces `$` in templates for languages that use `$` literally; `null` means `$` is used
- `metadata: { grammarSha: string; treeSitterVersion?: string }` — provenance tracking (deterministic, no timestamps)
- `rules: Record<string, TemplateRule>` — map of node kind (snake_case) to template rule

**Identity**: One RulesConfig per grammar/language. Keyed by `language`.

**Lifecycle**: Created by codegen from grammar.json + node-types.json. Immutable at runtime. Regenerated when grammar changes.

### Clause (synthesized, not a standalone entity)

A sub-template that bundles anonymous tokens with a non-required field. Exists only as a YAML key nested under a parent rule — not a separate entity in the type system.

**Fields**:
- Key: `{field_name}_clause` (snake_case)
- Value: template string containing `$VARIABLE` references

**Resolution**:
- If all variables in the clause resolve → clause renders and interpolates into parent template
- If any variable is absent → entire clause omits (empty string)

**Examples**:
- `return_type_clause: "-> $RETURN_TYPE "` — emitted when grammar has `CHOICE([SEQ("->", FIELD(return_type)), BLANK])`
- `value_clause: " = $VALUE"` — emitted when grammar has `CHOICE([SEQ("=", FIELD(value)), BLANK])`

### OverridesConfig

Per-grammar supplemental field definitions for nodes where the tree-sitter grammar lacks explicit FIELDs. Mirrors `node-types.json` shape.

**Fields**:
- Key: node kind (snake_case, e.g., `"index_expression"`)
- Value: `{ fields: Record<string, OverrideFieldDef> }`
  - `OverrideFieldDef`: `{ anonymous?: boolean }` — `anonymous: true` marks fields mapping to anonymous tokens

**Identity**: One OverridesConfig per grammar/language. Keyed by `language`.

**Lifecycle**: Hand-authored per grammar. Read by codegen at enrichment time. Validated against grammar rule structure. Not shipped at runtime.

**Examples**:
```json
{
  "index_expression": { "fields": { "value": {}, "index": {} } },
  "unary_expression": { "fields": { "operator": { "anonymous": true }, "argument": {} } }
}
```

### PromotionHeuristic (conceptual, not a runtime type)

Classification of how a field is promoted from unnamed children into `fields` during wrap-time promotion.

| Heuristic | Trigger | Automatic? |
|---|---|---|
| 1. Field by name | tree-sitter FIELD | Yes |
| 2. Child by kind | Unnamed, unique kind in node | Yes |
| 3. Token as value | Anonymous token matched by text | No — needs overrides.json |
| 4. Position by token | Same kind, separated by token | No — needs overrides.json |
| 5. Branch by token | Top-level CHOICE with token discriminator | No — needs overrides.json |

## Relationships

```
RulesConfig 1──* TemplateRule    (rules map: kind → template)
TemplateRule 1──* Clause         (object form only: nested _clause keys)
TemplateRule 1──? joinBy         (object form only: separator config)
OverridesConfig 1──* OverrideNode  (node kind → override fields)
OverrideNode 1──* OverrideField   (field name → { anonymous? })
```

## Types removed

| Type | Was | Replaced by |
|------|-----|-------------|
| `RenderTemplate` | `string` alias for S-expression | Subsumed by `TemplateRule` |
| `RenderRule` | `string` alias | Subsumed by `TemplateRule` |
| `TemplateElement` | Union: `token` / `field` / `children` | Eliminated — no parsed intermediate; `$` scanning is inline |
| `ParsedTemplate` | `{ kind: string; elements: TemplateElement[] }` | Eliminated — template strings consumed directly |
| `RulesRegistry` | `Record<string, string>` | Replaced by `RulesConfig.rules: Record<string, TemplateRule>` |
| `JoinByMap` | `Record<string, string>` | Replaced by per-rule `joinBy` inside `TemplateRule` |
