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

**Decision**: Parse only the subset used in `@comment` captures — node patterns `(kind_name)` with `@capture` annotations. Skip predicates (`#match?`, `#eq?`), field patterns, wildcards, quantifiers.

**Rationale**: The `@comment` captures in all three grammars use the simplest form: `(node_kind) @comment`. Doc-comment sub-patterns use `(parent (child)) @comment.documentation` but we only need the parent kind name for trivia classification.

**Subset grammar**:
```
query     = pattern+
pattern   = '(' kind_name child* ')' capture?
child     = pattern | field_pattern
field_pattern = kind_name ':' pattern
capture   = '@' identifier ('.' identifier)*
```

## R3: NodeTrivia transport shape

**Decision**: `$trivia` is an optional property on `AnyNodeData` with shape `{ leading?: AnyNodeData[]; trailing?: AnyNodeData[] }`.

**Rationale**: Matches the `$`-prefix convention for sittir metadata. Leading/trailing split handles both cases (comment above vs comment at end of line). Arrays handle multiple comments.

**Rust equivalent**: `Option<NodeTrivia>` with `#[serde(rename = "$trivia")]`.

## R4: Render integration

**Decision**: The render engine wraps the node's rendered text with trivia — prepend each leading item's rendered text (with newline), append each trailing item's rendered text (with newline).

**Rationale**: Trivia is positional metadata, not structural. The render engine processes it as a wrapper, not a child.

**Open question**: Should trivia items be rendered via their own templates, or as raw `$text`? Answer: via their own templates (comment kinds have templates like any other kind).
