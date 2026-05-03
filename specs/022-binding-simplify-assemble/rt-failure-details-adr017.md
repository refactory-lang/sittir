# RT Failure Report: ADR-0017 Branch (`017-child-index-navigation`)

**Date:** 2026-05-02
**Branch:** `017-child-index-navigation`
**Commit:** `67200090` (fix: rebuild stale dists + improve format-roundtrip boundary helpers)

## Summary Table

| Grammar    | RT Pass | RT Total | RT Fail | RT Skip | AST Match Pass | AST Match Rate |
|------------|---------|----------|---------|---------|----------------|----------------|
| Python     | 41      | 115      | 73      | 1       | 33             | 28.7%          |
| Rust       | 84      | 136      | 40      | 12      | 36             | 26.5%          |
| TypeScript | 68      | 112      | 40      | 4       | 42             | 37.5%          |

### Comparison vs Master Baseline

| Grammar    | Master RT Pass | Master RT Total | ADR-0017 RT Pass | Delta (pass) | Delta (%) |
|------------|---------------|-----------------|------------------|--------------|-----------|
| Python     | 107           | 115             | 41               | -66          | -57.4%    |
| Rust       | 121           | 136             | 84               | -37          | -27.2%    |
| TypeScript | 99            | 112             | 68               | -31          | -27.7%    |

**Total regression: -134 kinds across all grammars.**

The ADR-0017 `$nodeHandle`/`$childIndex` wire shape change is the dominant cause. The native
render transport layer expects fully materialized `String` values for leaf fields, but the
new lazy-drill-in shape passes `NodeData` objects (with `$type`, `$source`, `$text`) where
`String` is expected. The TS-side `assertTransportValue` guards also reject `NodeData` objects
that don't match the expected kind list for a field.

## Root Cause Categories

### Category 1: NodeData object where String expected (native transport mismatch)

**Count:** ~22 (rust) + ~10 (python) + ~20 (typescript) = ~52

The native Rust render backend expects `String` for leaf-position fields (identifiers,
literals, operators). ADR-0017 changed factory output to pass `NodeData` objects
(`{$type, $source, $named, $text}`) for these positions. The napi boundary throws:

```
Error: Failed to convert JavaScript value `Object {"$type":1,"$source":2,"$named":true,"$text":"test"}`
       into rust type `String` on XxxTransport.fieldName
```

**Affected patterns:**
- `identifier` fields (name, object, label, etc.)
- `_expression` supertype fields (body, value, left, right, pattern)
- Literal fields (value, imaginary, pattern)
- `self` keyword fields

### Category 2: Transport type assertion failures (TS-side guard rejection)

**Count:** ~50 (rust) + ~25 (python) + ~55 (typescript) = ~130 (includes overlap with re-parse errors)

The generated `assertXxxTransport` functions validate that each field contains one of
the allowed kind alternatives. Factory-built nodes produce `NodeData` with `$type` set
to a numeric KindId, but the guard expects a specific set of named kinds. Manifests as:

```
TypeError: node.fieldName must be one of: allowed_kind_1, allowed_kind_2, ...
```

**Top offenders by field:**
- `node.name` (9 in rust, 5 in typescript)
- `node.type` (10+ in rust, 6 in typescript)
- `node.body` (7 in rust, 4 in typescript)
- `node.parameters` (3 in rust, 13 in typescript)
- `node.expression` (6 in typescript)
- `node.operator` (3 in rust, 3 in python)
- `node.block` (4 in rust)
- `node.$children[0]` (3 in python, 3 in typescript)
- `node.condition` (3 in typescript)
- `node.decorator[0]` (4 in typescript)

### Category 3: Re-parse failures (render output does not parse back)

**Count:** 73 (python) + 35 (rust) + 32 (typescript) = ~137 (some pre-existing)

The rendered output is either empty or malformed such that tree-sitter cannot parse
it back to the expected kind. Many of these are inherited from the pre-ADR-0017
baseline (walker/template quality debt) but the count increased because kinds that
previously got `String` leaf values now get unresolved `NodeData` stubs.

### Category 4: Kind not found at rendered offset

**Count:** 0 (python) + 5 (rust) + 9 (typescript) = ~16 (mostly pre-existing)

The reparsed tree does not contain a node of the target kind at the expected byte
offset. Typically caused by `_type_identifier` fields rendering as their numeric
`$type` instead of their text content.

### Category 5: AST structural mismatches (childCount, type mismatch)

**Count:** 48 (python) + 105 (rust) + 47 (typescript) = 200

The reparsed tree structurally differs from the original. Two sub-patterns:

- **Root type mismatch** (~185): `root: type source_file != identifier` -- the
  validator's reparse wrapper placed the rendered output in a container that doesn't
  match the expected root. Mostly a validator-infrastructure issue (reparse wrapper
  selection), not a template/render bug.

- **ChildCount mismatch** (~6): semicolons, commas, or trailing separators dropped
  during render. Example: `object_type: childCount 4 != 3 ["{",prop,";","}"] vs
  ["{",prop,"}"]`.

### Category 6: Unsupported native transport kind

**Count:** 1 (python) + 6 (typescript) = 7

Numeric `$type` values that the generated `assertNativeRenderTransport` switch
does not handle. These are codegen-synthesized or recently-added kinds whose
transport struct was not emitted.

### Category 7: Missing required fields

**Count:** 2 (python) + 4 (typescript) = 6

Native transport expects a field that the factory did not populate:
- `Missing field 'importPrefix'` (python: relative_import)
- `Missing field 'primaryExpression'` (python: call)
- `Missing field 'primaryType'` (typescript: 4 kinds)

### Category 8: $source validation failures

**Count:** 4 (python) + 1 (rust) + 3 (typescript) = 8

```
TypeError: node.$source must be 0 (ts), 1 (sg), or 2 (factory)
```

Factory nodes have `$source: 2` but the transport assertion rejects it. Likely a
stale assertion that hasn't been updated for the numeric `$source` enum.

---

## Per-Grammar Failure Details

### Python (41 pass / 115 total = 35.7% pass rate)

**RT Failures (73 kinds):**

| Kind | Error Category |
|------|---------------|
| aliased_import | Transport type assertion (node.name) |
| as_pattern | Transport type assertion (node.alias) |
| attribute | NodeData→String mismatch (object) |
| augmented_assignment | Transport type assertion (node.operator) |
| await | $source validation |
| binary_operator | Transport type assertion (node.operator) |
| boolean_operator | Transport type assertion (node.operator) |
| call | Missing field (primaryExpression) |
| case_clause | $source validation |
| chevron | Unknown kind id (expression) |
| class_definition | Transport type assertion (node.body) |
| class_pattern | Transport type assertion (node.arguments) |
| comparison_operator | NodeData→String mismatch (left) |
| complex_pattern | NodeData→String mismatch (imaginary) |
| conditional_expression | Unknown kind id (expression) |
| constrained_type | Transport type assertion (node.base_type) |
| decorated_definition | Transport type assertion (node.definition) |
| decorator | Unknown kind id (expression) |
| default_parameter | NodeData→String mismatch (name) |
| dictionary_comprehension | Transport type assertion ($children) |
| dictionary_splat | Unknown kind id (expression) |
| elif_clause | Transport type assertion (node.consequence) |
| else_clause | Transport type assertion (node.body) |
| except_clause | Transport type assertion (node.body) |
| exec_statement | NodeData→String mismatch (code) |
| finally_clause | Transport type assertion (node.body) |
| for_in_clause | Transport type assertion ($children) |
| for_statement | Transport type assertion (node.body) |
| function_definition | Transport type assertion (node.body) |
| future_import_statement | Transport type assertion (node.name) |
| generator_expression | Transport type assertion ($children) |
| generic_type | Transport type assertion (node.type_parameter) |
| if_clause | Unknown kind id (expression) |
| if_statement | Transport type assertion (node.consequence) |
| import_from_statement | Transport type assertion (node.module_name) |
| import_statement | Transport type assertion (node.name) |
| interpolation | Unknown kind id (FExpression) |
| keyword_argument | NodeData→String mismatch (name) |
| keyword_pattern | NodeData→String mismatch (identifier) |
| lambda | $type KindId mismatch |
| lambda_within_for_in_clause | $source validation |
| list_comprehension | Unknown kind id (expression) |
| list_splat | Unknown kind id (expression) |
| match_statement | Transport type assertion (node.body) |
| member_type | Transport type assertion (node.type) |
| named_expression | NodeData→String mismatch (name) |
| not_operator | Unknown kind id (expression) |
| pair | Unknown kind id (expression) |
| print_statement | Transport type assertion (node.body) |
| raise_statement | $type property missing |
| relative_import | Missing field (importPrefix) |
| set_comprehension | Transport type assertion ($children) |
| splat_pattern | Transport type assertion (node.identifier) |
| splat_type | NodeData→String mismatch (identifier) |
| subscript | Transport type assertion (node.body) |
| try_statement | Transport type assertion (node.body) |
| type_alias_statement | Transport type assertion (node.type) |
| typed_default_parameter | Transport type assertion (node.type) |
| typed_parameter | Transport type assertion (node.type) |
| unary_operator | Transport type assertion (node.operator) |
| union_type | Transport type assertion (node.left) |
| while_statement | Transport type assertion (node.body) |
| with_item | Unknown kind id (expression) |
| with_statement | Transport type assertion (node.with_clause) |

### Rust (84 pass / 136 total = 61.8% pass rate)

**RT Failures (40 kinds):**

| Corpus Entry | Kind Tested | Error Type |
|--------------|-------------|------------|
| Async Block | async_block | re-parse error |
| Gen Block | gen_block | re-parse error |
| Function declarations | identifier | re-parse error (parameters) |
| Functions with abstract return types | identifier | re-parse error |
| Impl with lifetimes first | identifier | re-parse error |
| Extern function declarations | identifier | re-parse error |
| Use declarations | identifier | re-parse error (scoped paths) |
| Generic structs | _type_identifier | kind not found |
| Enums | _type_identifier | kind not found |
| Functions with custom types for self | self | re-parse error |
| Type aliases | _type_identifier | kind not found |
| Type alias where clauses | _type_identifier | kind not found |
| Inner attributes | inner_attribute_item | re-parse error |
| Attribute macros | identifier | re-parse error |
| Trait impl signature | _type_identifier | re-parse error |
| Trait declarations with optional type params | _type_identifier | re-parse error |
| Unsized types in trait bounds | _type_identifier | re-parse error |
| Trait bounds in type arguments | _type_identifier | re-parse error |
| Generic Associated Types | _type_identifier | re-parse error |
| Function parameter names matching builtins | identifier | re-parse error |
| Array Constraint in Where Clause | _type_identifier | kind not found |
| Const generics with default | _type_identifier | re-parse error |
| Struct expressions | _type_identifier | re-parse error |
| Struct expressions with update initializers | _type_identifier | re-parse error |
| If let expressions | if_expression | re-parse error |
| Match expressions | match_expression | re-parse error |
| For expressions | for_expression | re-parse error |
| Scoped functions with fully qualified syntax | _type_identifier | re-parse error |
| Closures with typed parameters | identifier | re-parse error |
| Macro definition | metavariable | re-parse error |
| Tuple struct patterns | identifier | re-parse error |
| Reference patterns | identifier | re-parse error |
| Ignored patterns | tuple_pattern | re-parse error |
| Captured patterns | match_expression | re-parse error |
| Or patterns | if_expression | re-parse error |
| Inline const/Const blocks as pattern | identifier | re-parse error |
| Pattern with turbofish | identifier | re-parse error |
| Generic types | _type_identifier | re-parse error |
| Function types | identifier | re-parse error |
| Type cast expressions with generics | _type_identifier | re-parse error |

**Skipped (12 kinds):** kinds with no template or known override-parser issues.

### TypeScript (68 pass / 112 total = 60.7% pass rate)

**RT Failures (40 kinds):**

| Corpus Entry | Kind Tested | Error Type |
|--------------|-------------|------------|
| Ambient declarations | identifier | re-parse error |
| Ambient module declarations | identifier | re-parse error |
| Classes with decorator calls + type args | call_expression | re-parse error |
| Classes with decorators | call_expression | re-parse error |
| Definite assignment assertions | identifier | re-parse error |
| Classes with generic parameters | _type_identifier | kind not found |
| Functions with typed parameters | identifier | re-parse error |
| Arrow functions/generators with call sigs | _type_identifier | kind not found |
| Ambiguity: fn signature vs fn declaration | identifier | kind not found |
| Built-in types | identifier | re-parse error |
| Parenthesized types | identifier | re-parse error |
| Object types | identifier | re-parse error |
| Object types with call signatures | identifier | re-parse error |
| Object types with auto semicolon insertion | identifier | kind not found |
| Array types | identifier | re-parse error |
| Function types | identifier | re-parse error |
| Functions with destructured parameters | identifier | re-parse error |
| Constructor types | identifier | re-parse error |
| Symbol types | identifier | re-parse error |
| Flow Maybe Types | identifier | re-parse error |
| Interface declarations | _type_identifier | kind not found |
| Generic types | _type_identifier | kind not found |
| Existential types | identifier | re-parse error |
| Literal types | identifier | re-parse error |
| Flow type parameter constraint syntax | _type_identifier | re-parse error |
| Nested type arguments | identifier | re-parse error |
| predefined types as identifiers | identifier | re-parse error |
| Type query and index type query types | call_expression | re-parse error |
| Assertion functions checking value | identifier | re-parse error |
| Assertion functions checking type | identifier | re-parse error |
| Type of an assertion function | identifier | re-parse error |
| Type predicate and predefined types | identifier | re-parse error |
| Tuple types | predefined_type | re-parse error |
| Conditional types | _type_identifier | kind not found |
| Template literal types | _type_identifier | kind not found |
| Mapped type 'as' clauses | _type_identifier | kind not found |
| Extends | _type_identifier | re-parse error |
| Abstract | _type_identifier | kind not found |
| Typeof instantiation expressions | instantiation_expression | re-parse error |
| Import in type | call_expression | re-parse error |

**Skipped (4 kinds):** kinds with no template or known override-parser issues.

---

## nodes.test.ts Render Failures (Factory Surface)

These failures are distinct from the corpus RT validation. They test that
`factory(...).render()` produces a non-empty string on synthetic inputs.

| Grammar    | Total Tests | Failed | Passed |
|------------|-------------|--------|--------|
| Rust       | 304         | 91     | 213    |
| Python     | 190         | 64     | 126    |
| TypeScript | 320         | 117    | 203    |

The nodes.test.ts failures overlap significantly with the corpus RT failures but
are triggered differently: the factory surface passes `NodeData` objects for leaf
fields where the native transport expects `String`. This is the ADR-0017 wire shape
change surfacing in the factory-to-render path.

---

## Diagnosis

The ADR-0017 branch introduced `$nodeHandle` and `$childIndex` on child entries to
enable lazy drill-in navigation. The key consequence:

1. **Factory output changed:** Leaf-position fields that were previously `String`
   values are now `NodeData` objects with `{$type, $source, $named, $text}`.

2. **Native transport boundary expects String:** The generated `toNativeRenderTransport`
   functions (in `packages/{lang}/src/utils.ts`) attempt to pass these objects to
   Rust as `String`, which fails at the napi boundary.

3. **Transport type guards reject NodeData:** The `assertXxxTransport` functions
   validate that field values match specific kind alternatives. Factory-produced
   `NodeData` with numeric `$type` doesn't match the expected named-kind strings.

4. **Pre-existing walker debt amplified:** Many corpus entries already had marginal
   render quality (stray spaces, missing separators). The wire shape change
   converted silent partial-passes into hard failures.

## Recommended Follow-ups

1. **Transport layer update:** Teach `toNativeRenderTransport` to extract `$text`
   from `NodeData` objects in leaf positions (where the native side expects `String`).

2. **Guard relaxation:** Update `assertTransportValue` to accept `NodeData` objects
   whose `$type` matches one of the allowed kind alternatives (match by numeric id).

3. **Factory leaf emission:** Consider having factories emit plain `String` for
   fields that are guaranteed single-token leaves (identifiers, literals, keywords),
   preserving the pre-ADR-0017 contract at the transport boundary.

4. **Walker debt (pre-existing):** The 105 rust AST mismatches and 48 python AST
   mismatches are mostly "root: type source_file != X" -- a reparse-wrapper
   infrastructure gap, not a template bug. Separate from ADR-0017 regression.
