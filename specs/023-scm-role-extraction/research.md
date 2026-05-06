# Research: SCM Role Extraction

## R1: highlights.scm locations and @comment captures

**Decision**: Read `highlights.scm` from each grammar's npm package under `queries/`.

**Findings per grammar**:

| Grammar | highlights.scm path | @comment captures | Trivia kinds |
|---|---|---|---|
| rust | `tree-sitter-rust/queries/highlights.scm` | `(line_comment) @comment`, `(block_comment) @comment`, `(line_comment (doc_comment)) @comment.documentation`, `(block_comment (doc_comment)) @comment.documentation` | `line_comment`, `block_comment` |
| typescript | `tree-sitter-typescript/queries/highlights.scm` — **empty** (no @comment). Inherits from `tree-sitter-javascript/queries/highlights.scm` which has `(comment) @comment` | `comment` |
| python | `tree-sitter-python/queries/highlights.scm` | `(comment) @comment` | `comment` |

**Key finding**: TypeScript's highlights.scm contains no `@comment` — it inherits from the JavaScript base grammar. The extractor must check `inherits` directives or fall back to the base grammar's queries.

**Rationale**: Tree-sitter query inheritance uses `;; inherits: javascript` comments. The extractor should parse these directives and chain-load parent query files.

**Alternatives considered**:
- Hard-code trivia kinds per grammar → violates DRY, doesn't scale to new grammars
- Read from node-types.json → no role information there

## R2: SCM query syntax subset needed

**Decision**: Parse only the subset used in captures — node patterns `(kind_name)` with `@capture` annotations. Skip predicates (`#match?`, `#eq?`), field patterns, wildcards, quantifiers.

**Subset grammar**:
```
query     = pattern+
pattern   = '(' kind_name child* ')' capture?
child     = pattern | field_pattern
field_pattern = kind_name ':' pattern
capture   = '@' identifier ('.' identifier)*
```

## R3: NodeTrivia transport shape

**Decision**: `$triviaData` is an optional property on `AnyNodeData` with shape `{ leading?: AnyNodeData[]; trailing?: AnyNodeData[] }`.

**Rust equivalent**: `Option<NodeTrivia>` with `#[serde(rename = "$triviaData")]`.

## R4: Render integration

**Decision**: The render engine wraps the node's rendered text with trivia — prepend each leading item's rendered text (with newline), append each trailing item's rendered text (with newline). Trivia items render via their own templates.

## R5: tags.scm role captures (Phase 2)

**Decision**: Read `tags.scm` from each grammar's npm package alongside `highlights.scm`.

**Findings per grammar**:

| Grammar | Role | Capture | Kinds discovered |
|---|---|---|---|
| rust | string | `@string` | `string_literal`, `char_literal`, `raw_string_literal` |
| rust | number | `@number` (none in highlights — inferred) | `integer_literal`, `float_literal` |
| rust | type | `@type` | `type_identifier`, `primitive_type` |
| rust | function | `@function` | `identifier` (in call context) |
| rust | definition.function | `@definition.function` (tags.scm) | `function_item` |
| rust | definition.class | `@definition.class` (tags.scm) | `struct_item`, `enum_item` |
| javascript | string | `@string` | (string literals in `]` alternation) |
| javascript | number | `@number` | `number` |
| javascript | variable | `@variable` | `identifier` |
| javascript | definition.function | `@definition.function` (tags.scm) | function_declaration, etc. |
| python | string | `@string` | `string` |
| python | number | `@number` | (integer/float in `]` alternation) |
| python | variable | `@variable` | `identifier` |
| python | definition.function | `@definition.function` (tags.scm) | `function_definition` |
| python | definition.class | `@definition.class` (tags.scm) | `class_definition` |

**Key finding**: `@number` in Rust highlights.scm does NOT exist — Rust uses `(integer_literal)` and `(float_literal)` as direct `@number` captures would. The extractor may need grammar-specific fallback mappings for roles not captured in SCM files.

## R6: Canonical factory resolution strategies (Phase 2)

**Decision**: Each `ir.from.*` function uses a discriminator to pick the right kind:

| Role | Discriminator | Strategy |
|---|---|---|
| boolean | `boolean-value` | `true` → true-kind, `false` → false-kind. Single boolean_literal kind → both map there. |
| number | `number-type` | `Number.isInteger()` → integer kind, else → float kind. Single number kind → both map there. |
| string | `none` | Routes to first string-role kind. |
| comment/trivia | `comment-prefix` | `//` or `#` → line comment, `/*` → block comment. |
| type | `none` | Routes to type-identifier kind. |
| identifier | `none` | Routes to identifier kind. |

**Alternatives considered**:
- Overloaded function signatures per kind → too many overloads, not tree-shakeable
- Runtime `switch` on input → chosen (simple, correct)
- Compile-time resolution → not possible (input is runtime value)

## R7: ir.from namespace design (Phase 2)

**Decision**: `ir.from.*` emitted into `ir.ts` per grammar. Each function is a named export in the `from` namespace — tree-shakeable. Return types are grammar-specific unions.

**Key constraint**: Only emit `ir.from.X` when the role has at least one discovered kind. Roles with zero kinds (e.g., `boolean` in a grammar without boolean literals) get no factory.
