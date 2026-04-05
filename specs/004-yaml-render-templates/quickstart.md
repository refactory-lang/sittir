# Quickstart: YAML Render Templates

## What changed

Render templates moved from S-expression strings in TypeScript to YAML files with ast-grep `$VARIABLE` syntax. The render engine is now a simple `$` variable scanner (~50 lines) instead of an S-expression parser (~250 lines combined).

## Key files per grammar package

| Before | After | Notes |
|--------|-------|-------|
| `src/rules.ts` (S-expr map) | `templates.yaml` | YAML loaded by core at runtime |
| `src/joinby.ts` (empty map) | Per-rule `joinBy` in YAML | Merged into template rules |

## Reading a template

Templates look like the code they produce:

```yaml
# Simple rule (string form)
binary_expression: "$LEFT $OPERATOR $RIGHT"

# Complex rule (object form with clauses and joinBy)
function_item:
  template: |
    fn $NAME($$$PARAMETERS) $RETURN_TYPE_CLAUSE{
        $$$BODY
    }
  return_type_clause: "-> $RETURN_TYPE "
  joinBy:
    PARAMETERS: ", "
    BODY: "\n"
```

**Variable syntax** (ast-grep conventions):
- `$NAME` — single named field → `fields.name`
- `$$$NAME` — multi field (array) → `fields.name`, joined by `joinBy`
- `$NAME_CLAUSE` — clause reference → looks up `name_clause` key in same rule

**Clauses** bundle optional tokens with fields. When the field is absent, the entire clause (including its tokens) is omitted.

## Override fields (`overrides.json`)

Some tree-sitter grammars lack explicit FIELDs for certain nodes (e.g., Rust `index_expression` has two `_expression` children with no field names). Each grammar package can include an `overrides.json` that provides supplemental field names:

```json
{
  "index_expression": { "fields": { "value": {}, "index": {} } },
  "unary_expression": { "fields": { "operator": { "anonymous": true }, "argument": {} } }
}
```

The codegen merges these with node-types.json during enrichment. At runtime, `wrap.ts` promotes override-named children from `children` into `fields` using 5 heuristics (by field name, unique kind, anonymous token, token position, CHOICE branch). After wrapping, templates can reference override fields as `$VALUE`, `$INDEX`, etc.

## Regenerating templates

```bash
# Regenerate Rust templates
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src

# Regenerate all grammars
pnpm -r run generate
```

This produces both `templates.yaml` (human-readable) and `src/templates.ts` (runtime import).

## Running tests

```bash
pnpm test                    # all tests
pnpm -r run type-check       # type-check all packages
```

Existing factory→render tests validate the new engine without changes.

## Modifying the render engine

The render engine lives in `packages/core/src/render.ts`. It:
1. Returns `node.text` for leaf nodes
2. Looks up `config.rules[node.type]`
3. Scans template string left-to-right for `$` variables
4. Resolves in priority order: `$FIELD_NAME` → `fields[name]` (tree-sitter + override fields), `$$$CHILDREN` → unconsumed children joined by separator, `$KIND_NAME` → first unconsumed child matching kind, `$CLAUSE` → sub-template
5. Concatenates — no whitespace collapsing

See [design.md](design.md) for the full render engine pseudocode.
