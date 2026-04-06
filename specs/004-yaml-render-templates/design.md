# Render Templates — Design Document

## Current state (branch `001-codegen-grammarjs-rewrite`)

### Template format: S-expressions in TypeScript

Templates are generated as TypeScript objects in `rules.ts` per grammar package. Each template is an S-expression string using tree-sitter query syntax:

```ts
// packages/rust/src/rules.ts (auto-generated, 143 entries)
export const rules: RulesRegistry = {
  'function_item': '(function_item (_)* "fn" name: (_) type_parameters: (_)? parameters: (_) return_type: (_)? (_)* body: (_))',
  'let_declaration': '(let_declaration "let" (_)* pattern: (_) type: (_)? value: (_)? alternative: (_)? ";")',
  'binary_expression': '(binary_expression left: (_) operator: (_) right: (_))',
  // ...
};
```

### Template element syntax

Parsed by `packages/core/src/sexpr.ts` (119 lines):

| Syntax | Meaning |
|---|---|
| `"fn"` | Literal token |
| `name: (_)` | Required field |
| `name: (_)?` | Optional field |
| `name: (_)*` | Zero-or-more field |
| `name: (_)+` | One-or-more field |
| `(_)*` | Unnamed children |

### Render engine

`packages/core/src/render.ts` (133 lines). Joins all non-empty parts with a single space:

```ts
return parts.filter(p => p !== '').join(' ');
```

### Separator map

`packages/{lang}/src/joinby.ts` — currently **empty** for all three languages. The codegen detects separators from REPEAT+SEQ but doesn't emit them yet. All multi-fields join with the default single space.

### Known issues (from `specs/open-issues.md`)

| # | Issue | Severity |
|---|---|---|
| 1 | Optional CHOICE drops tokens paired with fields — `-> return_type` renders as just `i32`, missing `->` | Medium |
| 5 | Single separator per node type — can't have `, ` for params and `\n` for statements | Medium |
| 7 | All parts joined with space — `fn main ( ) -> i32 { }` instead of `fn main() -> i32 {}` | Low (design) |
| 8 | S-expression parser backslash unescape incomplete | Medium |
| 9 | S-expression parser doesn't handle nested parentheses | Low |

### Pipeline context

Specs `002-enriched-grammar-model` and `003-grammar-model-pipeline` describe a `NodeModel` pipeline that consolidates all shared grammar analysis (field types, separators, required/multiple, ordering) into a pre-generation model. Each structural `NodeModel` carries `rule: EnrichedRule` — the annotated grammar rule tree — which the template codegen walks directly to generate YAML templates.

The render template format change described below aligns with this pipeline: the codegen walks the `EnrichedRule` attached to each `NodeModel` and emits ast-grep-style YAML templates instead of S-expression TypeScript.

---

## Proposed format: ast-grep-style YAML

### Overview

Templates move from S-expressions in TypeScript to **YAML files using ast-grep's pattern/fix syntax**. Templates look like the code they produce — same formatting, same delimiters, same indentation — with `$VARIABLE` slots for fields.

The template syntax is **ast-grep's meta variable language, unmodified.** No sittir-specific additions. Optionality for token+field groups is expressed through YAML structure (nested clauses), not template syntax.

### Template syntax

Identical to ast-grep conventions:

| Syntax | Meaning | ast-grep origin |
|---|---|---|
| `$NAME` | Single named node | Pattern matching |
| `$$NAME` | Single unnamed (anonymous) node | Unnamed node capture |
| `$$$NAME` | Zero or more nodes | Multi meta variable |
| `$$$` | Zero or more unnamed children | Anonymous multi match |
| `$_NAME` | Non-capturing wildcard | Non-capturing match |

Everything else in the template is literal output — keywords, operators, delimiters, spaces, newlines. What you see is what renders.

Field resolution: variables map to `NodeData.fields` by lowercasing: `$NAME` → `fields.name`, `$RETURN_TYPE` → `fields.return_type`, `$$$PARAMETERS` → `fields.parameters` (array).

Absent fields render as empty string — same as ast-grep's fix behavior for unmatched meta variables.

### Clauses

When an anonymous token in the grammar always co-occurs with a non-required field (`required: false` on the `FieldModel`) — `->` with `return_type`, `:` with `type`, `=` with `value` — the codegen synthesizes a **clause**: a named sub-template nested under the parent rule in YAML.

```yaml
function_item:
  template: |
    fn $NAME($$$PARAMETERS) $RETURN_TYPE_CLAUSE{
        $$$BODY
    }
  return_type_clause: "-> $RETURN_TYPE "
```

The render engine sees `$RETURN_TYPE_CLAUSE` in the template and checks whether `return_type_clause` is a key in the current rule object. If it is:

1. Parse the clause sub-template (`"-> $RETURN_TYPE "`)
2. Resolve the variables inside (`$RETURN_TYPE` → `fields.return_type`)
3. If any variable resolves to absent → omit the entire clause
4. If all variables resolve → render the clause and interpolate

No quantifier syntax on the variable. The YAML structure is the signal.

**This directly solves open issue #1** — the `->` token is bundled with `return_type` in a clause. When `return_type` is absent, the entire `-> ` prefix is omitted. No token-field pairing heuristic needed.

### Grammar nodes vs. synthesized clauses

| | Example | Where it lives | Why |
|---|---|---|---|
| **Grammar node** | `where_clause`, `else_clause`, `type_arguments` | Top-level rule | Real node kind — has its own `NodeData` |
| **Synthesized clause** | `return_type_clause`, `value_clause`, `alias_clause` | Nested under parent | Not a grammar node — anonymous token bundled with non-required field |

A grammar node like `$WHERE_CLAUSE` is a `NodeData` in `fields` — the engine looks it up and renders it with its own top-level template. A synthesized clause like `$RETURN_TYPE_CLAUSE` is a YAML key under the parent rule — the engine checks the underlying field's presence and renders the sub-template.

### Codegen clause generation

The codegen generates clauses mechanically by walking the `EnrichedRule` attached to each `NodeModel`. The rule: **any anonymous token(s) adjacent to a non-required field (`required: false`) in a SEQ become a clause.**

```
CHOICE([
  SEQ(STRING("->"), FIELD(return_type)),
  BLANK
])
```

Produces:

```yaml
return_type_clause: "-> $RETURN_TYPE "
```

Common patterns:

| Grammar pattern | Clause |
|---|---|
| `"->" FIELD(return_type)` | `return_type_clause: "-> $RETURN_TYPE "` |
| `":" FIELD(type)` | `type_clause: ": $TYPE"` |
| `"=" FIELD(value)` | `value_clause: " = $VALUE"` |
| `"as" FIELD(alias)` | `alias_clause: " as $ALIAS"` |
| `FIELD(trait) "for"` | `trait_clause: "$TRAIT for "` |

### Formatting

Formatting is literal in the template. The codegen derives spacing from grammar signals (`IMMEDIATE_TOKEN`, delimiter adjacency, block structure) and bakes it into the template strings. The render engine concatenates — no `parts.join(' ')`, no whitespace collapsing.

Indentation is universally 4 spaces, baked into the templates by the codegen. No per-language configuration — the codegen is language-agnostic. Style-conformant indentation (e.g., 2 spaces for TypeScript) is the external formatter's job (`prettier`, `rustfmt`, `black`).

This directly solves open issue #7.

Both brace-delimited and indent-sensitive languages use the same approach:

```yaml
# Rust — braces and spacing are literal
function_item:
  template: |
    fn $NAME($$$PARAMETERS) $RETURN_TYPE_CLAUSE{
        $$$BODY
    }
  return_type_clause: "-> $RETURN_TYPE "

# Python — colon and indentation are literal
function_definition:
  template: |
    def $NAME($$$PARAMETERS)$RETURN_TYPE_CLAUSE:
        $$$BODY
  return_type_clause: " -> $RETURN_TYPE"
```

### `joinBy`

Follows ast-grep's `joinBy` convention — specified per-rule, not globally. This is how ast-grep's rewriter specifies joining:

```yaml
# ast-grep rewriter
transform:
  NEW_VAR:
    rewrite:
      rewriters: [some-rewrite]
      source: $$$ARGS
      joinBy: ', '
```

In sittir, `joinBy` lives inside the rule object:

```yaml
rules:
  # String joinBy — applies to all $$$ variables in this rule
  parameters:
    template: "($$$CHILDREN)"
    joinBy: ", "

  # Object joinBy — per-variable when a rule has multiple $$$ fields
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

When `joinBy` is a string → applies to all `$$$` variables in that rule. When `joinBy` is an object → keyed by variable name. Default (no `joinBy` key): single space.

This solves open issue #5 — each multi-field gets its own separator, not one separator per node kind.

### File structure

One YAML file per grammar. Replaces `rules.ts` and `joinby.ts`:

```yaml
# @sittir/rust/templates.yaml — auto-generated from grammar.json
language: rust
extensions: [rs]
expandoChar: null
metadata:
  treeSitterVersion: "0.24.6"
  generatedAt: "2026-03-30T01:00:00Z"
  grammarSha: "abc123"
rules:
  # ...
```

#### Top-level keys

| Key | Origin | Purpose |
|---|---|---|
| `language` | ast-grep rule config | Language identifier |
| `extensions` | ast-grep sgconfig `customLanguages` | File extensions for this grammar |
| `expandoChar` | ast-grep sgconfig `customLanguages` | Replaces `$` in templates for languages that use `$` literally (PHP, shell). Default: null (`$` used) |
| `metadata` | ast-grep rule config | Arbitrary extra data — grammar version, codegen timestamp |
| `rules` | sittir (maps to ast-grep `fix` structurally) | Template registry |

#### Casing convention

Two conventions coexist, each from its source system:

| Convention | Applies to | Source | Examples |
|---|---|---|---|
| **camelCase** | Config/structural keys | ast-grep | `expandoChar`, `joinBy`, `metadata` |
| **snake_case** | Rule names, clause names, field names | tree-sitter | `function_item`, `return_type_clause`, `let_declaration` |
| **UPPER_SNAKE** | Template variables | ast-grep patterns | `$NAME`, `$$$PARAMETERS`, `$RETURN_TYPE_CLAUSE` |

The rule: **if it comes from tree-sitter, snake_case. If it comes from ast-grep conventions, camelCase.** Casing tells you provenance.

#### Rule object alignment with ast-grep `fix`

ast-grep's `fix` has two forms — string and `FixConfig` object. sittir rules follow the same shape:

```yaml
# ast-grep fix — string form
fix: "logger.log($$$ARGS)"

# ast-grep fix — FixConfig object form
fix:
  template: ''
  expandEnd: { regex: ',' }
```

```yaml
# sittir rule — string form (same as ast-grep fix string)
binary_expression: "$LEFT $OPERATOR $RIGHT"

# sittir rule — object form (same template key as ast-grep FixConfig)
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

| ast-grep FixConfig key | sittir rule key | Notes |
|---|---|---|
| `template` | `template` | The template string — identical concept |
| `expandStart` / `expandEnd` | — | N/A (sittir constructs, doesn't expand match ranges) |
| — | `*_clause` (snake_case) | Synthesized clauses — sittir addition, YAML structure |
| — (from rewriter) | `joinBy` (camelCase) | Separator for `$$$` variables |

### Unnamed children resolution — consumption model

The assign emitter promotes override-named children from the raw children array into `fields` during tree node hydration. From the render template's perspective, override fields are indistinguishable from tree-sitter fields — both are resolved via `$FIELD_NAME` from `node.fields`.

The render engine walks the template left-to-right. For each variable:

1. **`$FIELD_NAME`** — look up `node.fields[name]` (tree-sitter FIELDs AND override fields promoted by assign)
2. **Children-by-kind fallback** — if not in `fields`, search `node.children` for a child whose `type` matches the field key
3. **`$$$CHILDREN`** — render all children joined by separator
4. **Clause** — render sub-template if underlying field present

The children-by-kind fallback handles named children (from node-types.json) that the factory stores in the `children` array but the template references as `$FIELD_NAME` variables.

`$$$CHILDREN` is only for truly unnamed groups — REPEAT nodes like `declaration_list`, `arguments`, `string_literal`. Named positions always get template variables.

```yaml
# Override fields — promoted to fields by assign emitter
unary_expression: "$OPERATOR$ARGUMENT"
# assign promoted operator (anon token) and argument (named child) into fields

index_expression: "$VALUE[$INDEX]"
# assign promoted value and index into fields; "[" and "]" stay as template literals

range_expression: "$START$OPERATOR$END"

# Tree-sitter fields — no different from overrides
function_item:
  template: $VISIBILITY_MODIFIER $FUNCTION_MODIFIERS fn $NAME$TYPE_PARAMETERS($$$PARAMETERS) $RETURN_TYPE_CLAUSE $WHERE_CLAUSE $BODY
  return_type_clause: "-> $RETURN_TYPE"

binary_expression: "$LEFT $OPERATOR $RIGHT"

# Truly unnamed groups — $$$CHILDREN
arguments:
  template: "$$$CHILDREN"
  joinBy:
    CHILDREN: ", "

declaration_list:
  template: "$$$CHILDREN"
  joinBy:
    CHILDREN: "\n"

# Mixed — named children consumed, rest to $$$CHILDREN
block:
  template: |
    $LABEL_CLAUSE{
        $$$CHILDREN
    }
  label_clause: "$LABEL: "
  joinBy:
    CHILDREN: "\n"
```

### `overrides.json` — supplemental names for under-fielded grammars

Mirrors the shape of `node-types.json`. An override entry is the fields block the grammar author didn't write:

```json
{
  "index_expression": {
    "fields": {
      "value": {},
      "index": {}
    }
  },
  "unary_expression": {
    "fields": {
      "operator": { "anonymous": true },
      "argument": {}
    }
  },
  "range_expression": {
    "fields": {
      "start": {},
      "operator": { "anonymous": true },
      "end": {}
    }
  },
  "macro_definition": {
    "fields": {
      "delimiter": { "anonymous": true }
    }
  }
}
```

`anonymous: true` marks entries that map to anonymous tokens (operators, delimiters). The codegen merges override fields with node-types.json fields during enrichment. The overrides.json file is codegen-time only, not shipped at runtime.

The codegen detects overrides.json candidates automatically:
- **Same-kind positional:** grammar rule simplification produces `SEQ(X, X)` — log: "needs synthetic names"
- **Discriminator tokens:** CHOICE branches identical after token removal — log: "discriminator token at position N"

TypeScript and Python grammars barely need overrides.json (their grammars wrap operators in FIELDs). Rust needs it for ~10-15 nodes. The overrides.json is validated by the codegen against the grammar rule structure.

### Override field promotion — assign emitter heuristics

> **Implementation note:** The original design proposed a separate `wrap.ts` file with per-kind `wrapXxx` functions. The actual implementation inlines field promotion heuristics directly into the **assign emitter** (`packages/codegen/src/emitters/assign.ts`). Each generated `assignXxx()` function includes override field promotion code that runs before the factory call. There is no separate `wrap.ts` file.

The assign emitter generates per-kind functions that promote override-named children from the `children` array into `fields`. After promotion, all named positions are in `fields` regardless of whether they came from tree-sitter FIELDs or overrides.json.

Additionally, the render engine provides a **children-by-kind fallback**: when a template variable like `$VISIBILITY_MODIFIER` is not found in `fields`, the render engine searches the `children` array for a child whose `type` matches the field key (e.g., `visibility_modifier`). This handles named children that the factory stores in `children` but the template references as field variables.

**Heuristic 1: Tree-sitter FIELD → read via `target.field(name)`.**
The grammar has `field('name', ...)`. The assign function reads it directly via the tree-sitter field accessor.

**Heuristic 2: Unnamed child with unique kind → promote to fields by kind.**
One `visibility_modifier` appears as an unnamed child. The assign function finds it in `target.children()` by kind and promotes to `config[name]`.

**Heuristic 3: Anonymous token as value → promote to fields, match by text.**
The grammar has `CHOICE("-", "*", "!")` — an anonymous token. The assign function finds the first unnamed child matching specific token values (from `overrides.json` `values` array) and promotes to `config.operator`.

```ts
// Generated assign code for unary_expression (heuristic 3 with per-token matching):
config['operator'] = (() => {
  const _vals = new Set(["-", "*", "!", "&"]);
  for (let i = 0; i < _allChildren.length; i++) {
    if (_consumed.has(i)) continue;
    const c = _allChildren[i]!;
    if (!c.isNamed() && _vals.has(c.text())) { _consumed.add(i); return c.text(); }
  }
  return undefined;
})();
```

**Heuristic 4: Same-kind positional → promote by consumption order.**
Two `_expression` children disambiguated by their position. The assign function consumes them in order: first match → `object`, second → `index`.

**Heuristic 5: Top-level CHOICE with structural variants → token position determines names.**
The assign function uses the consumed-index tracking to assign children to the correct override field names.

**Summary of heuristics:**

| Heuristic | Trigger | Promotion logic | Overrides needed? |
|---|---|---|---|
| 1. Field by name | tree-sitter FIELD | `target.field(name)` | No |
| 2. Child by kind | Unnamed, unique kind | Find in children by kind set | Yes — for the field name |
| 3. Token as value | Anonymous token | Match by `values` from overrides | Yes — name + values |
| 4. Position by token | Same kind, positional | Consume in order from children | Yes — for the names |
| 5. Branch by token | Top-level CHOICE | Token position determines assignment | Yes — for the names |

Heuristic 1 is fully automatic (tree-sitter FIELD). Heuristics 2-5 need `overrides.json` entries.

### Children classification

The codegen classifies each node's unnamed children by simplifying the grammar rule:

1. **Strip tokens from SEQs** — to identify trivial containers
2. **Unwrap single-member SEQs** — the only structural simplification
3. **Leave CHOICEs intact** — identical branches after token removal = discriminator detected

| Simplified root | Example | Template |
|---|---|---|
| **SYMBOL** | `abstract_type` → `type_parameters` | `$$$CHILDREN` |
| **REPEAT** | `declaration_list` → `_declaration_statement*` | `$$$CHILDREN` + joinBy |
| **SEQ** | `function_item` → `SEQ(vis, mods, where)` | Fields + `$$$CHILDREN` for unnamed |
| **SEQ with REPEAT** | `block` → `SEQ(label, stmt*, expr)` | `$LABEL ... $$$CHILDREN ...` |
| **CHOICE** | `range_expression` → multiple forms | `$$$CHILDREN` (tokens disambiguate at wrap time) |

## What changes

### Files removed

| File | Role | Replaced by |
|---|---|---|
| `packages/{lang}/src/rules.ts` | S-expression templates (TypeScript) | `templates.yaml` |
| `packages/{lang}/src/joinby.ts` | Separator map (TypeScript) | Per-rule `joinBy` key |
| `packages/core/src/sexpr.ts` | S-expression parser (119 lines) | Trivial `$` scanner in render engine |

### Files modified

| File | Change |
|---|---|
| `packages/core/src/render.ts` | Replace S-expression dispatch with YAML template interpolation. Drop `parts.join(' ')`. ~50 lines. |
| `packages/core/src/types.ts` | `RulesRegistry` type changes from `Record<string, string>` to loaded YAML shape. `ParsedTemplate`/`TemplateElement` types removed. |
| `packages/codegen/src/emitters/rules.ts` | Emit YAML instead of TypeScript. Walk `EnrichedRule` from `NodeModel.rule`. |
| `packages/codegen/src/emitters/joinby.ts` | Merged into rules emitter (per-rule `joinBy` key). |

### Files added

| File | Role |
|---|---|
| `packages/{lang}/templates.yaml` | Language config + render templates |

### Open issues resolved

| # | Issue | How resolved |
|---|---|---|
| 1 | Optional CHOICE drops tokens paired with fields | Clauses bundle token + field. Absent field → omit clause including tokens. |
| 5 | Single separator per node type | Per-rule `joinBy` — string for all fields, or object keyed by variable name. |
| 7 | Parts joined with space | Formatting is literal in templates. Render engine concatenates. |
| 8 | Backslash unescape incomplete | S-expression parser eliminated. |
| 9 | Nested parens not handled | S-expression parser eliminated. |

## Render engine

~50 lines. Pure string interpolation:

```
render(node, templates):
  if node.text exists → return node.text

  rule = templates.rules[node.type]
  template = (rule is string) ? rule : rule.template
  clauses = (rule is object) ? (keys except 'template' and 'joinBy') : {}
  joinBy = (rule is object) ? rule.joinBy : undefined

  scan template for $ variables:

    $NAME →
      value = fields[lowercase(NAME)]
      if value is NodeData → render(value), interpolate
      if absent → empty string

    $$$NAME →
      values = fields[lowercase(NAME)]
      separator = resolveJoinBy(joinBy, NAME) ?? ' '
      render each element, join with separator, interpolate
      if absent → empty string

    $SOME_CLAUSE (where lowercase(SOME_CLAUSE) is a key in clauses) →
      parse clause sub-template
      resolve all $ variables inside against node.fields
      if any variable absent → omit entire clause (empty string)
      if all present → render clause, interpolate

    everything else → literal, concatenate as-is

  return concatenated result

resolveJoinBy(joinBy, varName):
  if joinBy is undefined → return undefined (use default ' ')
  if joinBy is string → return joinBy (applies to all $$$ vars)
  if joinBy is object → return joinBy[varName] ?? ' '
```

## Syntax additions over ast-grep: zero

| Feature | ast-grep | sittir |
|---|---|---|
| `$NAME` single | ✓ | ✓ |
| `$$NAME` unnamed | ✓ | ✓ |
| `$$$NAME` multi | ✓ | ✓ |
| `$_` non-capturing | ✓ | ✓ |
| Absent → empty string | ✓ (fix strings) | ✓ |
| Indentation preservation | ✓ (fix strings) | ✓ |
| `joinBy` | ✓ (rewriter) | ✓ |
| Clauses | — | YAML structure (not template syntax) |

## Full Rust example

```yaml
language: rust
extensions: [rs]
expandoChar: null
metadata:
  treeSitterVersion: "0.24.6"
  generatedAt: "2026-03-30T01:00:00Z"

rules:
  source_file: "$$$CHILDREN"

  # ── Functions ────────────────────────────────────────────────

  function_item:
    template: |
      $$$CHILDREN fn $NAME$TYPE_PARAMETERS($$$PARAMETERS) $RETURN_TYPE_CLAUSE{
          $$$BODY
      }
    return_type_clause: "-> $RETURN_TYPE "
    joinBy:
      PARAMETERS: ", "
      BODY: "\n"

  function_signature_item:
    template: "$$$CHILDREN fn $NAME$TYPE_PARAMETERS($$$PARAMETERS) $RETURN_TYPE_CLAUSE;"
    return_type_clause: "-> $RETURN_TYPE "
    joinBy: ", "

  # ── Structs / Enums / Unions ─────────────────────────────────

  struct_item: "$$$CHILDREN struct $NAME$TYPE_PARAMETERS $BODY"
  enum_item: "$$$CHILDREN enum $NAME$TYPE_PARAMETERS $BODY"
  enum_variant:
    template: "$$$CHILDREN $NAME$BODY$VALUE_CLAUSE"
    value_clause: " = $VALUE"
  union_item: "$$$CHILDREN union $NAME$TYPE_PARAMETERS $BODY"

  # ── Impl / Trait ─────────────────────────────────────────────

  impl_item:
    template: "impl $TYPE_PARAMETERS $TRAIT_CLAUSE$TYPE $$$CHILDREN $BODY"
    trait_clause: "$TRAIT for "

  trait_item:
    template: |
      $$$CHILDREN trait $NAME$TYPE_PARAMETERS$BOUNDS_CLAUSE $BODY
    bounds_clause: ": $BOUNDS"

  # ── Declarations ─────────────────────────────────────────────

  let_declaration:
    template: "let $$$CHILDREN $PATTERN$TYPE_CLAUSE$VALUE_CLAUSE$ALTERNATIVE_CLAUSE;"
    type_clause: ": $TYPE"
    value_clause: " = $VALUE"
    alternative_clause: " else $ALTERNATIVE"

  const_item:
    template: "$$$CHILDREN const $NAME: $TYPE$VALUE_CLAUSE;"
    value_clause: " = $VALUE"

  static_item:
    template: "$$$CHILDREN static $$$CHILDREN $NAME: $TYPE$VALUE_CLAUSE;"
    value_clause: " = $VALUE"

  type_item: "$$$CHILDREN type $NAME$TYPE_PARAMETERS $$$CHILDREN = $TYPE $$$CHILDREN;"
  use_declaration: "$$$CHILDREN use $ARGUMENT;"

  # ── Expressions ──────────────────────────────────────────────

  binary_expression: "$LEFT $OPERATOR $RIGHT"
  unary_expression: "$OPERATOR$$$CHILDREN"
  call_expression: "$FUNCTION($$$ARGUMENTS)"
  field_expression: "$VALUE.$FIELD"
  index_expression: "$$$CHILDREN[$$$CHILDREN]"
  return_expression: "return $$$CHILDREN"
  break_expression: "break $$$CHILDREN"
  continue_expression: "continue $$$CHILDREN"
  assignment_expression: "$LEFT = $RIGHT"
  compound_assignment_expr: "$LEFT $OPERATOR $RIGHT"
  reference_expression: "&$$$CHILDREN $VALUE"
  parenthesized_expression: "($$$CHILDREN)"
  range_expression: "$$$CHILDREN..$$$CHILDREN"
  type_cast_expression: "$VALUE as $TYPE"
  await_expression: "$$$CHILDREN.await"
  try_expression: "$$$CHILDREN?"
  negative_literal: "-$$$CHILDREN"
  struct_expression: "$NAME $BODY"
  expression_statement: "$$$CHILDREN;"

  closure_expression:
    template: "$PARAMETERS $RETURN_TYPE_CLAUSE$BODY"
    return_type_clause: "-> $RETURN_TYPE "

  # ── Control flow ─────────────────────────────────────────────

  if_expression:
    template: |
      if $CONDITION {
          $CONSEQUENCE
      }$ALTERNATIVE_CLAUSE
    alternative_clause: " $ALTERNATIVE"

  match_expression: |
    match $VALUE {
        $$$BODY
    }

  match_arm: "$$$CHILDREN $PATTERN => $VALUE,"

  for_expression: |
    $$$CHILDREN for $PATTERN in $VALUE {
        $BODY
    }

  while_expression: |
    $$$CHILDREN while $CONDITION {
        $BODY
    }

  loop_expression: |
    $$$CHILDREN loop {
        $BODY
    }

  let_condition: "let $PATTERN = $VALUE"
  let_chain: "$$$CHILDREN"

  else_clause: |
    else {
        $$$CHILDREN
    }

  # ── Types ────────────────────────────────────────────────────

  generic_type: "$TYPE<$$$TYPE_ARGUMENTS>"
  generic_type_with_turbofish: "$TYPE::<$$$TYPE_ARGUMENTS>"
  reference_type: "&$$$CHILDREN $TYPE"
  tuple_type:
    template: "($$$CHILDREN)"
    joinBy: ", "
  dynamic_type: "dyn $TRAIT"
  pointer_type: "*const $TYPE $$$CHILDREN"
  bounded_type: "$$$CHILDREN + $$$CHILDREN"
  abstract_type: "impl $$$CHILDREN $TRAIT"
  qualified_type: "$TYPE as $ALIAS"
  bracketed_type: "<$$$CHILDREN>"
  removed_trait_bound: "?$$$CHILDREN"

  array_type:
    template: "[$ELEMENT$LENGTH_CLAUSE]"
    length_clause: "; $LENGTH"

  function_type:
    template: "$$$CHILDREN $TRAIT_CLAUSE($$$CHILDREN) $RETURN_TYPE_CLAUSE"
    trait_clause: "$TRAIT"
    return_type_clause: "-> $RETURN_TYPE"

  # ── Type parameters ──────────────────────────────────────────

  type_arguments:
    template: "<$$$CHILDREN>"
    joinBy: ", "
  type_parameters:
    template: "<$$$CHILDREN>"
    joinBy: ", "
  lifetime: "'$$$CHILDREN"
  for_lifetimes: "for<$$$CHILDREN>"
  higher_ranked_trait_bound: "for<$TYPE_PARAMETERS> $TYPE"
  where_clause:
    template: "where $$$CHILDREN"
    joinBy: ", "
  where_predicate: "$LEFT: $BOUNDS"
  trait_bounds:
    template: ": $$$CHILDREN"
    joinBy: " + "

  type_parameter:
    template: "$NAME$BOUNDS_CLAUSE$DEFAULT_TYPE_CLAUSE"
    bounds_clause: ": $BOUNDS"
    default_type_clause: " = $DEFAULT_TYPE"

  type_binding:
    template: "$NAME$TYPE_ARGUMENTS = $TYPE"

  const_parameter:
    template: "const $NAME: $TYPE$VALUE_CLAUSE"
    value_clause: " = $VALUE"

  lifetime_parameter:
    template: "$NAME$BOUNDS_CLAUSE"
    bounds_clause: ": $BOUNDS"

  # ── Parameters ───────────────────────────────────────────────

  parameters:
    template: "($$$CHILDREN)"
    joinBy: ", "
  parameter: "$$$CHILDREN $PATTERN: $TYPE"
  self_parameter: "$$$CHILDREN"
  closure_parameters:
    template: "|$$$CHILDREN|"
    joinBy: ", "
  variadic_parameter: "$$$CHILDREN $PATTERN..."

  # ── Patterns ─────────────────────────────────────────────────

  tuple_pattern:
    template: "($$$CHILDREN)"
    joinBy: ", "
  struct_pattern: "$TYPE {$$$CHILDREN}"
  tuple_struct_pattern: "$TYPE($$$CHILDREN)"
  slice_pattern: "[$$$CHILDREN]"
  ref_pattern: "ref $$$CHILDREN"
  mut_pattern: "$$$CHILDREN"
  captured_pattern: "$$$CHILDREN @ $$$CHILDREN"
  or_pattern: "$$$CHILDREN | $$$CHILDREN"
  range_pattern: "$LEFT...$RIGHT"
  reference_pattern: "&$$$CHILDREN"
  match_pattern:
    template: "$$$CHILDREN$CONDITION_CLAUSE"
    condition_clause: " if $CONDITION"

  field_pattern:
    template: "$$$CHILDREN $NAME$PATTERN_CLAUSE"
    pattern_clause: ": $PATTERN"

  # ── Containers ───────────────────────────────────────────────

  block:
    template: |
      {
          $$$CHILDREN
      }
    joinBy: "\n"
  declaration_list:
    template: |
      {
          $$$CHILDREN
      }
    joinBy: "\n"
  field_declaration_list:
    template: |
      {
          $$$CHILDREN
      }
    joinBy: ",\n"
  enum_variant_list:
    template: |
      {
          $$$CHILDREN
      }
    joinBy: ",\n"
  match_block:
    template: |
      {
          $$$CHILDREN
      }
    joinBy: "\n"
  field_initializer_list:
    template: "{$$$CHILDREN}"
    joinBy: ", "
  use_list:
    template: "{$$$CHILDREN}"
    joinBy: ", "
  arguments:
    template: "($$$CHILDREN)"
    joinBy: ", "
  tuple_expression:
    template: "($$$CHILDREN)"
    joinBy: ", "
  ordered_field_declaration_list:
    template: "($$$CHILDREN)"
    joinBy: ", "
  token_tree: "($$$CHILDREN)"
  token_tree_pattern: "($$$CHILDREN)"

  array_expression:
    template: "[$$$CHILDREN$LENGTH_CLAUSE]"
    length_clause: "; $LENGTH"

  # ── Field initializers ───────────────────────────────────────

  field_initializer: "$$$CHILDREN $FIELD: $VALUE"
  base_field_initializer: "..$$$CHILDREN"
  shorthand_field_initializer: "$$$CHILDREN"
  field_declaration: "$$$CHILDREN $NAME: $TYPE"

  # ── Paths ────────────────────────────────────────────────────

  scoped_identifier: "$PATH::$NAME"
  scoped_type_identifier: "$PATH::$NAME"
  scoped_use_list: "$PATH::$LIST"

  # ── Use clauses ──────────────────────────────────────────────

  use_as_clause: "$PATH as $ALIAS"
  use_wildcard: "$$$CHILDREN*"
  use_bounds: "use <$$$CHILDREN>"

  # ── Visibility / Attributes ──────────────────────────────────

  visibility_modifier: "$$$CHILDREN"
  attribute_item: "#[$$$CHILDREN]"
  inner_attribute_item: "#![$$$CHILDREN]"

  attribute:
    template: "$$$CHILDREN$VALUE_CLAUSE$ARGUMENTS"
    value_clause: " = $VALUE"

  # ── Macros ───────────────────────────────────────────────────

  macro_invocation: "$MACRO!$$$CHILDREN"
  macro_definition: "macro_rules! $NAME ($$$CHILDREN;)"
  macro_rule: "$LEFT => $RIGHT"
  token_binding_pattern: "$NAME: $TYPE"
  token_repetition: "$($$$CHILDREN)+"
  token_repetition_pattern: "$($$$CHILDREN)+"

  # ── Comments ─────────────────────────────────────────────────

  line_comment: "//$OUTER$DOC$INNER"
  block_comment: "/*$OUTER$DOC*/$INNER"

  # ── Misc ─────────────────────────────────────────────────────

  label: "'$$$CHILDREN"
  extern_modifier: "extern $$$CHILDREN"
  async_block: "async $$$CHILDREN"
  const_block: "const $BODY"
  foreign_mod_item: "$$$CHILDREN $BODY"
  function_modifiers: "async $$$CHILDREN"
  generic_function: "$FUNCTION::$TYPE_ARGUMENTS"
  generic_pattern: "$$$CHILDREN::$TYPE_ARGUMENTS"
  raw_string_literal: "$$$CHILDREN"
  string_literal: "\"$$$CHILDREN\""
  unsafe_block: "unsafe $$$CHILDREN"
  yield_expression: "yield $$$CHILDREN"
  gen_block: "gen $$$CHILDREN"
  try_block: "try $$$CHILDREN"

  mod_item:
    template: "$$$CHILDREN mod $NAME $BODY"

  extern_crate_declaration:
    template: "$$$CHILDREN extern crate $NAME$ALIAS_CLAUSE;"
    alias_clause: " as $ALIAS"

  associated_type:
    template: "type $NAME$TYPE_PARAMETERS$BOUNDS_CLAUSE $$$CHILDREN;"
    bounds_clause: ": $BOUNDS"

  source_file: "$$$CHILDREN"

  # ── Leaves ───────────────────────────────────────────────────
  # Leaf nodes (identifiers, literals, keywords) render via
  # NodeData.text — no template needed. Not listed here.
```

## Per-grammar files (before → after)

**Before:**

```
@sittir/{lang}/
  └── src/
      ├── rules.ts       S-expression templates (TypeScript, auto-generated)
      ├── joinby.ts       Separator map (TypeScript, auto-generated, currently empty)
      ├── factories.ts    Factory functions
      ├── types.ts        Grammar-derived types
      ├── consts.ts       Kind enums, keywords, operators
      └── ir.ts           Namespace re-export
```

**After:**

```
@sittir/{lang}/
  ├── templates.yaml    Language config + render templates (per-rule joinBy + clauses)
  └── src/
      ├── factories.ts  Factory functions
      ├── types.ts      Grammar-derived types
      ├── consts.ts     Kind enums, keywords, operators
      └── ir.ts         Namespace re-export
```

## Implementation notes

### Current architecture (as of branch `001-codegen-grammarjs-rewrite`)

The `NodeModel` has seven variants discriminated by `modelType`. Structural nodes (`BranchModel`, `ContainerModel`) carry:
- `fields: FieldModel[]` — field metadata (required, multiple, kinds, separator)
- `children?: ChildrenModel` — unnamed children metadata
- `rule: EnrichedRule` — the annotated grammar rule tree, attached during reconcile

The current rules emitter (`packages/codegen/src/emitters/rules.ts`, 230 lines) walks `node.rule.rule` (the raw `GrammarRule` reached through the `EnrichedRule`) with `ruleToSExpr()` to produce S-expression template strings. Field quantifiers come from the `NodeModel`'s enriched field metadata (source of truth for required/multiple), not from the grammar walk.

### Codegen changes (`packages/codegen/src/emitters/rules.ts`)

The same `ruleToSExpr()` walk drives the new template format. The grammar rule tree IS the template schema — no intermediate representation needed. The walk changes output, not input:

| Current S-expression output | Proposed YAML template output |
|---|---|
| `"fn"` → quoted token | `fn ` → literal text with spacing |
| `name: (_)` → field reference | `$NAME` |
| `name: (_)?` → non-required field | `$NAME` (absent → empty) or clause if token-paired |
| `name: (_)*` → repeated field | `$$$NAME` |
| `(_)*` → unnamed children | `$$$CHILDREN` or `$$$` |
| `IMMEDIATE_TOKEN` → quoted token | Token with no leading space in template |
| Token adjacent to non-required field → dropped | Synthesized clause nested under parent rule |

The walker also gains formatting awareness: `IMMEDIATE_TOKEN` signals no-space-before, delimiter pairs (`(` ... `)`) signal attached tokens, block delimiters (`{` ... `}` wrapping statement children) signal multiline with indentation. These derive from the same grammar rule structure the walker already traverses.

Clause generation: when `ruleToSExpr()` encounters `CHOICE([SEQ(STRING("->"), FIELD(return_type)), BLANK])`, instead of marking the field `required: false` and dropping the paired token (current behavior — open issue #1), it emits a clause:

```yaml
return_type_clause: "-> $RETURN_TYPE "
```

And references `$RETURN_TYPE_CLAUSE` in the parent template. The YAML nesting expresses the required/non-required distinction.

Output format changes from TypeScript (`rules.ts` exporting `RulesRegistry`) to YAML (`templates.yaml` with per-rule `joinBy` and clause nesting).

### Open issues closed by this change

| Issue | Description | How this spec resolves it |
|---|---|---|
| **#1** CHOICE drops tokens paired with non-required fields | `->` dropped when `return_type` has `required: false` | Clauses bundle token + field — both present or both absent |
| **#5** Single separator per node type | `joinBy` maps one sep per kind | Per-rule `joinBy` — string for all fields, or object keyed by variable name |
| **#7** Parts joined with single space | `parts.join(' ')` produces `fn main ( )` | Formatting is literal in templates — `fn $NAME($$$PARAMETERS)` renders `fn main(params)` |
| **#8** Backslash unescape incomplete | `sexpr.ts` parser limitation | S-expression parser eliminated entirely |
| **#9** Nested parens not handled | `sexpr.ts` parser limitation | S-expression parser eliminated entirely |

### Render engine changes (`packages/core/src/render.ts`)

Current: 133 lines. Parses S-expressions via `parseTemplate()` (cached), dispatches on `TemplateElement` union (`token` / `field` / `children`), joins with `parts.filter(p => p !== '').join(' ')`.

Proposed: ~50 lines. Template is a string (or object with `template` + clause keys). Scan for `$` variables (trivial regex/scan — no parser). Resolve against `node.fields`. Concatenate directly. No whitespace collapsing. YAML loaded at module init or bundled as JSON.

The `sexpr.ts` module (S-expression parser) is eliminated.

### Type changes (`packages/types/src/core-types.ts`)

Remove:
- `RenderTemplate` (string alias for S-expression)
- `RenderRule` (string alias)
- `TemplateElement` (parsed S-expression element union: `token` / `field` / `children`)
- `ParsedTemplate` (cached parse result with `kind` + `elements`)

Add:
- `TemplateRule` — `string | { template: string; [clauseKey: string]: string }`
- `RulesConfig` — full YAML shape: `{ language, extensions, expandoChar, metadata, rules }` (joinBy is per-rule)

### What doesn't change

- `AnyNodeData` / `NodeData<G,K>` — the node shape is unchanged
- `NodeModel` / `EnrichedRule` — the pipeline feeding the codegen is unchanged
- `factories.ts` — factory functions don't depend on render format
- `from.ts` / `assign.ts` — resolver/hydration logic is independent
- `consts.ts` / `types.ts` — grammar-derived types and constants
- The test infrastructure — tests exercise factories + render, which still compose the same way
