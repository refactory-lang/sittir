# RT (Round-Trip) Failure Report

Generated: 2026-05-02, branch `master`, commit `93737642`

## Summary

| Grammar    | Total | Pass | Fail | Skip | AST Match Pass | AST Mismatches |
|------------|-------|------|------|------|----------------|----------------|
| rust       | 136   | 121  | 3    | 12   | 121            | 0              |
| typescript | 112   | 99   | 9    | 4    | 94             | 7              |
| python     | 115   | 107  | 7    | 1    | 104            | 4              |
| **total**  | **363** | **327** | **19** | **17** | **319** | **11** |

Pass rate: 90.1% (327/363). AST-match rate: 87.9% (319/363).

---

## rust (3 failures, 0 AST mismatches)

### Render Errors

| Kind | Corpus Entry | Source | Rendered | Failure Type |
|------|-------------|--------|----------|--------------|
| `raw_string_literal` | Raw string literals | `r#"abc"#` | `abc` | missing delimiters -- external scanner |
| `raw_string_literal` | Raw byte string literals | `br#"abc"#` | `abc` | missing delimiters -- external scanner |
| `raw_string_literal` | Raw C string literals | `cr#"abc"#` | `abc` | missing delimiters -- external scanner |

### Analysis

All 3 rust failures are the same kind (`raw_string_literal`) -- the external scanner
produces tokens (`r#"`, `"#`, `br#"`, `cr#"`) that the render template cannot
reconstruct. The template falls back to `$text` which contains only the string
content without the raw-string delimiters. This is a known limitation of
external-scanner tokens that cannot be represented in S-expression templates.

---

## typescript (9 render errors, 7 AST mismatches)

### Render Errors

| Kind | Corpus Entry | Source | Rendered | Failure Type |
|------|-------------|--------|----------|--------------|
| `ambient_declaration` | Flow module.exports declarations | `declare module.exports: { foo: string; }` | `declare exports { foo: string; }` | missing field (`module.exports` -> `exports`) |
| `call_expression` | Classes with decorator calls (type args) | `bar<T>()` | *(empty)* | empty output |
| `call_expression` | Classes with decorators | `bar.buzz(grue)` | *(empty)* | empty output |
| `ambient_declaration` | Global namespace declarations | `declare global { }` | `declare { }` | missing field (`global` keyword dropped) |
| `assignment_expression` | Assignment to non-null LHS | `foo! = bar` | `foo!=bar` | stray whitespace / reparse mismatch |
| `call_expression` | Type query and index type query types | `import('person')` | *(empty)* | empty output |
| `instantiation_expression` | Typeof instantiation expressions | `f<T>` | ` <T>` | missing field (`f` function name dropped) |
| `call_expression` | Import in type | `import('node:fs')` | *(empty)* | empty output |
| `import_statement` | Import assert | `import something from 'foo.css' assert { type: 'css' }` | `import  from 'foo.css' assert { type: 'css' } ` | missing field (`something` source dropped) + stray whitespace |

### AST Mismatches (render text matches but reparsed tree differs structurally)

| Kind | Corpus Entry | Source | Rendered | Mismatch |
|------|-------------|--------|----------|----------|
| `parenthesized_expression` | Decorator with parenthesized expression | `(super.decorate)` | `(super.decorate)` | type `member_expression` != `parenthesized_expression_typed` |
| `member_expression` | Decorator with parenthesized expression | `super.decorate` | `super.decorate` | child type `identifier` != `super` |
| `array` | Array with empty elements | `[, a, , b, , , , s, , , ]` | `[a,b,s]` | childCount 15 != 7 (empty slots dropped) |
| `object_type` | Index signatures | `{ [b: string]: any; readonly [c: number]: string; }` | `{ [b: string]: any,readonly [c: number]: string }` | separator `;` -> `,`, missing trailing `;` |
| `object_type` | Object types with ASI | `{ length: number\n(string): string\n[index:string] : number }` | `{ length: number,(string): string,[index:string] : number }` | implicit newline separators -> explicit `,` |
| `import_statement` | Flow Import Types | `import type {UserID, User} from "./User.js";` | `import type  from "./User.js" ;` | `type` keyword lost, import_clause dropped |
| `member_expression` | Import in type | `import('node:fs').ReadStream` | `import('node:fs').ReadStream` | call_expression childCount 2 != 1 |

### Analysis

- **Empty output (4 failures):** All 4 are `call_expression` where the template
  produces empty string. The `call_expression` template likely does not handle
  the `import(...)` dynamic-import syntax or decorator call expressions with
  type arguments. The `function` field is empty/missing in these cases.

- **Missing fields (3 failures):** `ambient_declaration` drops `module.exports`
  (renders as just `exports`) and `global` keyword. `import_statement` drops the
  source identifier. `instantiation_expression` drops the function name.
  These are template gaps where the render template does not emit all
  required fields.

- **Separator mismatch (2 AST mismatches):** `object_type` renders with `,`
  separators where source uses `;` or newlines. The joinBy configuration or
  template hardcodes `,` rather than preserving the original separator.

- **Structural divergence (3 AST mismatches):** `super` keyword parsed
  differently after round-trip, `array` with empty elements drops the empties,
  `import` type statement loses the `type` modifier.

---

## python (7 render errors, 4 AST mismatches)

### Render Errors

| Kind | Corpus Entry | Source | Rendered | Failure Type |
|------|-------------|--------|----------|--------------|
| `comparison_operator` | Await expressions | `region in await all_regions()` | `region in ` | missing field (right operand dropped) |
| `comparison_operator` | Comparison operators | `a < b <= c == d >= e > f` | `a  ` | missing field (chained comparisons not handled) |
| `list_splat` | Splat Inside of Expression List | `*a` | `*` | missing field (expression after `*` dropped) |
| `list_splat` | Format strings | `*a` | `*` | missing field (expression after `*` dropped) |
| `as_pattern` | As patterns | `("north" \| "south" \| "east" \| "west") as direction` | ` as ` | missing field (both pattern and alias dropped) |
| `tuple` | For statements | `(1,)` | `(1)` | missing trailing comma |
| `list_splat` | Function definitions | `*a` | `*` | missing field (expression after `*` dropped) |

### AST Mismatches (render text matches but reparsed tree differs structurally)

| Kind | Corpus Entry | Source | Rendered | Mismatch |
|------|-------------|--------|----------|----------|
| `tuple_pattern` | lambdas | `(a, b)` | `(a,b)` | child type `identifier` != `case_pattern` |
| `tuple_pattern` | Default Tuple Arguments | `(a, b)` | `(a,b)` | child type `identifier` != `case_pattern` |
| `tuple_pattern` | List comprehensions | `(a, b)` | `(a,b)` | child type `identifier` != `case_pattern` |
| `tuple_pattern` | Function definitions | `(a,b)` | `(a,b)` | child type `identifier` != `case_pattern` |

### Analysis

- **Missing fields (5 failures):** `comparison_operator` drops the right operand
  (and chained comparisons entirely). `list_splat` (3 failures, same kind) drops
  the expression after the `*` operator -- the template emits only the `*`
  literal, not the `$fields.argument` or equivalent. `as_pattern` drops both the
  pattern and alias name, rendering only ` as `.

- **Missing trailing comma (1 failure):** `tuple` renders `(1)` instead of `(1,)`
  -- the trailing comma that distinguishes a 1-element tuple from a parenthesized
  expression is not preserved.

- **Reparse kind mismatch (4 AST mismatches):** All 4 are `tuple_pattern` where
  the rendered text `(a,b)` reparses with `case_pattern` children instead of
  `identifier` children. This is a context-dependent parse: inside a `match`
  statement body the parser uses `case_pattern` as the kind for identifiers,
  while the reparse wrapper context produces a different parse-tree structure.

---

## Category Breakdown

### By Failure Type

| Category | Count | Grammars |
|----------|-------|----------|
| Missing field / dropped content | 10 | rust(0), typescript(5), python(5) |
| Empty output | 4 | typescript(4) |
| External scanner / delimiter | 3 | rust(3) |
| Missing trailing separator | 1 | python(1) |
| Stray whitespace / spacing | 1 | typescript(1) |

Total render errors: **19**

### By AST Mismatch Type

| Category | Count | Grammars |
|----------|-------|----------|
| Separator divergence (`;` vs `,` vs newline) | 2 | typescript(2) |
| Context-dependent reparse (kind changes) | 5 | typescript(1), python(4) |
| Structural loss (children dropped) | 2 | typescript(2) |
| Type alias / keyword reparse | 2 | typescript(2) |

Total AST mismatches: **11**

### Root Cause Clusters

1. **Template field gaps (10 errors):** The render template does not reference all
   fields defined in the grammar rule. Fix: extend template walker to emit
   field placeholders for missing fields, or add per-kind template overrides.
   - `comparison_operator` (python): chained comparison structure not handled
   - `list_splat` (python): `argument` field missing from template
   - `as_pattern` (python): `pattern` and `alias` fields missing
   - `call_expression` (typescript): `import()` syntax not handled
   - `ambient_declaration` (typescript): `module.exports` and `global` not handled
   - `instantiation_expression` (typescript): function name field missing
   - `import_statement` (typescript): source identifier field missing

2. **External scanner tokens (3 errors):** `raw_string_literal` in rust uses
   external scanner tokens for delimiters that cannot be reconstructed from
   the parse tree. These are inherently limited by the `$text`-fallback
   architecture.

3. **Separator/trailing-comma fidelity (3 mismatches + 1 error):** Templates
   use a single joinBy separator (`,`) where the grammar accepts multiple
   separators (`;`, newline, `,`). The `tuple` trailing comma is also lost.

4. **Context-dependent reparse (5 mismatches):** The reparse wrapper context
   causes different parse-tree structure than the original context. Most
   prominent: python `tuple_pattern` children become `case_pattern` in match
   contexts, and typescript `super` keyword reparses differently.

5. **Empty render output (4 errors):** `call_expression` produces empty string
   for `import()` dynamic imports and decorator calls. Likely a template
   dispatch gap where these specific call shapes are not matched.
