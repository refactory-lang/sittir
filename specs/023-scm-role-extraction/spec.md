# Feature Specification: SCM Role Extraction & Trivia Implementation

**Feature Branch**: `023-scm-role-extraction`
**Created**: 2026-05-06
**Status**: Draft
**Input**: Role extraction from tree-sitter `.scm` query files to power `$trivia()` implementation and canonical vocabulary.

## User Scenarios & Testing

### User Story 1 — Attach trivia to factory-built nodes (Priority: P1)

A developer building AST nodes via the factory API attaches leading and trailing comments to a node using `$trivia()`. The rendered output includes the comments in the correct positions.

**Why this priority**: `$trivia()` is already stubbed on every factory node. Making it functional is the core deliverable.

**Independent Test**: Call `ir.functionItem.from({ name: 'main' }).$trivia(ir.lineComment('// entry point'))`, render it, and verify the comment appears above the function.

**Acceptance Scenarios**:

1. **Given** a factory-built `function_item`, **When** `.$trivia(lineComment)` is called with a leading comment, **Then** rendering prepends `// entry point\n` before the function.
2. **Given** a factory-built node with trailing trivia, **When** `.$trivia({ trailing: [lineComment] })` is called, **Then** rendering appends the comment after the node.
3. **Given** a factory-built node with both leading and trailing trivia, **When** `.$trivia({ leading: [...], trailing: [...] })` is called, **Then** both are rendered in position.
4. **Given** a `readNode`-derived node, **When** `.$trivia(comment)` is called, **Then** the trivia attaches and renders alongside the original source.

---

### User Story 2 — Discover trivia kinds from grammar SCM files (Priority: P1)

Codegen reads each grammar's `highlights.scm` file, extracts `@comment` and `@comment.*` captures, and maps the captured node kinds to a `trivia` role. The discovered trivia kinds are used to type-narrow the `$trivia()` method signature per grammar.

**Why this priority**: Without knowing which kinds are trivia, the `$trivia()` signature can't be grammar-specific. This extraction is the prerequisite for typed trivia.

**Independent Test**: Run the SCM extractor on `tree-sitter-rust/queries/highlights.scm` and verify it returns `['line_comment', 'block_comment']` as trivia kinds.

**Acceptance Scenarios**:

1. **Given** a `highlights.scm` containing `(line_comment) @comment`, **When** the extractor runs, **Then** `line_comment` is identified as a trivia kind.
2. **Given** a `highlights.scm` with `(block_comment) @comment.block`, **When** the extractor runs, **Then** `block_comment` is identified as a trivia kind (sub-captures included).
3. **Given** a grammar with no `highlights.scm`, **When** the extractor runs, **Then** it produces an empty trivia set with a diagnostic warning.

---

### User Story 3 — Typed trivia method per grammar (Priority: P2)

The `$trivia()` method signature on factory/wrap output is narrowed to only accept the grammar's discovered trivia kinds, not `AnyNodeData`.

**Why this priority**: Type safety is important but not blocking — the untyped version works at runtime.

**Independent Test**: In `@sittir/rust`, call `.$trivia(ir.identifier('x'))` and verify TypeScript reports a type error (identifier is not a trivia kind).

**Acceptance Scenarios**:

1. **Given** Rust grammar trivia kinds are `[line_comment, block_comment]`, **When** `$trivia()` is emitted in `utils.ts`, **Then** its parameter type is `(T.LineComment | T.BlockComment)[]`.
2. **Given** a non-trivia kind passed to `$trivia()`, **When** type-checking, **Then** a compile error is produced.

---

### User Story 4 — Render trivia in both TS and Rust engines (Priority: P2)

Both the TypeScript render engine and the Rust native render engine emit trivia when `$trivia` is present on a NodeData.

**Why this priority**: Render support is required for trivia to be observable, but can initially ship TS-only with Rust following.

**Independent Test**: Render a node with `$trivia` set, verify the output includes the trivia text.

**Acceptance Scenarios**:

1. **Given** a NodeData with `$trivia.leading = [lineComment]`, **When** rendered via TS engine, **Then** the comment text precedes the node's rendered text.
2. **Given** a NodeData with `$trivia`, **When** rendered via Rust native engine, **Then** the output matches the TS engine.

---

### Edge Cases

- What happens when `$trivia()` is called multiple times on the same node? Last call wins (overwrite, not append).
- How does trivia interact with `$with` setters? `$with` returns a new node — trivia is NOT carried over (explicit re-attach required).
- What about `readNode` data that already has comments as children? `readNode` doesn't auto-populate `$trivia` — comments in the parse tree stay as `$children` unless explicitly promoted.

## Requirements

### Functional Requirements

- **FR-001**: Codegen MUST parse a subset of tree-sitter SCM query syntax sufficient to extract capture names and their associated node kind patterns.
- **FR-002**: Codegen MUST map `@comment` and `@comment.*` captures to a `trivia` role, producing a per-grammar list of trivia kind names.
- **FR-003**: `AnyNodeData` MUST support an optional `$trivia` property with `{ leading?: AnyNodeData[]; trailing?: AnyNodeData[] }` shape.
- **FR-004**: `withMethods<T>` MUST replace the current `$trivia()` stub with a functional implementation that sets `$trivia` on the node and returns `this`.
- **FR-005**: The TS render engine MUST emit leading trivia before and trailing trivia after the node's rendered text when `$trivia` is present.
- **FR-006**: The Rust native render engine MUST support the `$trivia` field on `NodeData` transport and render it equivalently to the TS engine.
- **FR-007**: Per-grammar `utils.ts` MUST emit a `$trivia()` signature typed to the grammar's discovered trivia kinds.
- **FR-008**: The SCM parser MUST handle the subset of query syntax used in `highlights.scm` across rust, typescript, and python grammars (node patterns, captures, predicates can be skipped).

### Key Entities

- **TriviaRole**: A mapping from capture name (`@comment`) to role (`trivia`) with the list of node kinds that match.
- **NodeTrivia**: The `$trivia` property shape — `{ leading?: AnyNodeData[]; trailing?: AnyNodeData[] }`.
- **SCM Query**: A tree-sitter query file (`.scm`) containing S-expression patterns with `@capture` annotations.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `ir.functionItem.from({ name: 'main' }).$trivia(ir.lineComment('// hello')).$render()` produces output with the comment above the function declaration.
- **SC-002**: All three grammars (rust, typescript, python) have trivia kinds extracted — zero manual annotation required.
- **SC-003**: `$trivia()` accepts only grammar-specific trivia kinds at compile time — passing a non-trivia kind produces a type error.
- **SC-004**: TS and Rust render engines produce identical output for nodes with trivia attached.
- **SC-005**: All existing validator counts hold or improve after the change.
