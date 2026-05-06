# Feature Specification: SCM Role Extraction, Trivia & Canonical Surface

**Feature Branch**: `023-scm-role-extraction`
**Created**: 2026-05-06
**Status**: In Progress (Phase 1 shipped, Phase 2 in progress)
**Input**: Role extraction from tree-sitter `.scm` query files to power `$trivia()` implementation, canonical vocabulary, and `ir.from.*` canonical factory surface.

## User Scenarios & Testing

### User Story 1 — Attach trivia to factory-built nodes (Priority: P1) [SHIPPED]

A developer building AST nodes via the factory API attaches leading and trailing comments to a node using `$trivia()`. The rendered output includes the comments in the correct positions.

**Why this priority**: `$trivia()` is already stubbed on every factory node. Making it functional is the core deliverable.

**Independent Test**: Call `ir.functionItem.from({ name: 'main' }).$trivia(ir.lineComment('// entry point'))`, render it, and verify the comment appears above the function.

**Acceptance Scenarios**:

1. **Given** a factory-built `function_item`, **When** `.$trivia(lineComment)` is called with a leading comment, **Then** rendering prepends `// entry point\n` before the function.
2. **Given** a factory-built node with trailing trivia, **When** `.$trivia({ trailing: [lineComment] })` is called, **Then** rendering appends the comment after the node.
3. **Given** a factory-built node with both leading and trailing trivia, **When** `.$trivia({ leading: [...], trailing: [...] })` is called, **Then** both are rendered in position.
4. **Given** a `readNode`-derived node, **When** `.$trivia(comment)` is called, **Then** the trivia attaches and renders alongside the original source.

---

### User Story 2 — Discover trivia kinds from grammar SCM files (Priority: P1) [SHIPPED]

Codegen reads each grammar's `highlights.scm` file, extracts `@comment` and `@comment.*` captures, and maps the captured node kinds to a `trivia` role. The discovered trivia kinds are used to type-narrow the `$trivia()` method signature per grammar.

**Why this priority**: Without knowing which kinds are trivia, the `$trivia()` signature can't be grammar-specific. This extraction is the prerequisite for typed trivia.

**Independent Test**: Run the SCM extractor on `tree-sitter-rust/queries/highlights.scm` and verify it returns `['line_comment', 'block_comment']` as trivia kinds.

**Acceptance Scenarios**:

1. **Given** a `highlights.scm` containing `(line_comment) @comment`, **When** the extractor runs, **Then** `line_comment` is identified as a trivia kind.
2. **Given** a `highlights.scm` with `(block_comment) @comment.block`, **When** the extractor runs, **Then** `block_comment` is identified as a trivia kind (sub-captures included).
3. **Given** a grammar with no `highlights.scm`, **When** the extractor runs, **Then** it produces an empty trivia set with a diagnostic warning.

---

### User Story 3 — Typed trivia method per grammar (Priority: P2) [SHIPPED]

The `$trivia()` method signature on factory/wrap output is narrowed to only accept the grammar's discovered trivia kinds, not `AnyNodeData`.

**Acceptance Scenarios**:

1. **Given** Rust grammar trivia kinds are `[line_comment, block_comment]`, **When** `$trivia()` is emitted in `utils.ts`, **Then** its parameter type is `(T.LineComment | T.BlockComment)[]`.
2. **Given** a non-trivia kind passed to `$trivia()`, **When** type-checking, **Then** a compile error is produced.

---

### User Story 4 — Render trivia in both TS and Rust engines (Priority: P2) [SHIPPED]

Both the TypeScript render engine and the Rust native render engine emit trivia when `$trivia` is present on a NodeData.

**Acceptance Scenarios**:

1. **Given** a NodeData with `$trivia.leading = [lineComment]`, **When** rendered via TS engine, **Then** the comment text precedes the node's rendered text.
2. **Given** a NodeData with `$trivia`, **When** rendered via Rust native engine, **Then** the output matches the TS engine.

---

### User Story 5 — Extract all semantic roles from SCM files (Priority: P1)

Codegen reads both `highlights.scm` AND `tags.scm` per grammar, extracting all semantic roles (string, number, boolean, type, variable, function, definition.*, reference.*) into a general `GrammarRoles` map.

**Why this priority**: Foundation for the canonical surface. Without role extraction, `ir.from.*` can't resolve to the right kind.

**Independent Test**: Run `extractGrammarRoles('rust')` and verify it discovers `string` → `[string_literal, char_literal, raw_string_literal]`, `number` → `[integer_literal, float_literal]`, `definition.function` → `[function_item]`.

**Acceptance Scenarios**:

1. **Given** Rust `highlights.scm` with `(string_literal) @string`, **When** the extractor runs, **Then** `string_literal` maps to the `string` role.
2. **Given** Rust `tags.scm` with `(function_item (identifier) @name) @definition.function`, **When** the extractor runs, **Then** `function_item` maps to the `definition.function` role.
3. **Given** all three grammars, **When** a cross-grammar diagnostic runs, **Then** every grammar reports kinds for the core roles (trivia, string, number, type).

---

### User Story 6 — `ir.from.*` canonical factories (Priority: P1)

Codegen emits an `ir.from` sub-namespace per grammar with canonical factory functions that accept native values and resolve to grammar-specific kinds.

**Why this priority**: The canonical surface is the user-facing deliverable — grammar-agnostic AST construction.

**Independent Test**: `ir.from.boolean(true).$render()` produces `true` in Rust, TypeScript, and Python.

**Acceptance Scenarios**:

1. **Given** Rust grammar, **When** `ir.from.boolean(true)` is called, **Then** it returns a `BooleanLiteral` node with text `'true'`.
2. **Given** Rust grammar, **When** `ir.from.number(42)` is called, **Then** it returns an `IntegerLiteral` node with text `'42'`.
3. **Given** Rust grammar, **When** `ir.from.number(3.14)` is called, **Then** it returns a `FloatLiteral` node with text `'3.14'`.
4. **Given** Rust grammar, **When** `ir.from.string("hello")` is called, **Then** it returns a `StringLiteral` node.
5. **Given** Rust grammar, **When** `ir.from.comment("// note")` is called, **Then** it returns a `LineComment` node.
6. **Given** Python grammar, **When** `ir.from.comment("# note")` is called, **Then** it returns a `Comment` node.
7. **Given** any grammar, **When** `ir.from.identifier("main")` is called, **Then** it returns the grammar's identifier kind.
8. **Given** any grammar, **When** `ir.from.type("String")` is called, **Then** it returns the grammar's type-identifier kind.

---

### Edge Cases

- What happens when `$trivia()` is called multiple times on the same node? Last call wins (overwrite, not append).
- How does trivia interact with `$with` setters? `$with` returns a new node — trivia is NOT carried over (explicit re-attach required).
- What about `readNode` data that already has comments as children? `readNode` doesn't auto-populate `$trivia` — comments in the parse tree stay as `$children` unless explicitly promoted.
- What if a role has zero kinds for a grammar? The `ir.from.*` function for that role is not emitted.
- What if a role maps to a polymorph (e.g., `line_comment` is a polymorph form)? The canonical factory calls the polymorph's `.from()` or the default form factory.

## Requirements

### Functional Requirements

- **FR-001**: Codegen MUST parse a subset of tree-sitter SCM query syntax sufficient to extract capture names and their associated node kind patterns.
- **FR-002**: Codegen MUST map captures to roles via a canonical mapping table, producing a per-grammar `GrammarRoles` map.
- **FR-003**: `AnyNodeData` MUST support an optional `$trivia` property with `{ leading?: AnyNodeData[]; trailing?: AnyNodeData[] }` shape.
- **FR-004**: `withMethods<T>` MUST replace the current `$trivia()` stub with a functional implementation that sets `$trivia` on the node and returns `this`.
- **FR-005**: The TS render engine MUST emit leading trivia before and trailing trivia after the node's rendered text when `$trivia` is present.
- **FR-006**: The Rust native render engine MUST support the `$trivia` field on `NodeData` transport and render it equivalently to the TS engine.
- **FR-007**: Per-grammar `utils.ts` MUST emit a `$trivia()` signature typed to the grammar's discovered trivia kinds.
- **FR-008**: The SCM parser MUST handle the subset of query syntax used in `highlights.scm` AND `tags.scm` across rust, typescript, and python grammars.
- **FR-009**: Codegen MUST read `tags.scm` per grammar (in addition to `highlights.scm`) and extract `@definition.*` and `@reference.*` captures.
- **FR-010**: Codegen MUST emit an `ir.from` namespace per grammar with canonical factory functions for: boolean, number, string, comment, type, identifier.
- **FR-011**: Each `ir.from.*` function MUST accept a native value (boolean, number, or string) and return the grammar-specific NodeData.
- **FR-012**: Each `ir.from.*` function MUST have a typed return type narrowed to the grammar's role kinds.
- **FR-013**: `ir.from.*` functions MUST be tree-shakeable (individual named exports, not a monolithic object).

### Key Entities

- **Role**: A canonical semantic category (`trivia`, `string`, `number`, `boolean`, `type`, `variable`, `function`, `definition.*`, `reference.*`).
- **RoleEntry**: A role with its discovered kind names and discriminator strategy.
- **GrammarRoles**: Per-grammar map of all role entries.
- **NodeTrivia**: The `$trivia` property shape — `{ leading?: AnyNodeData[]; trailing?: AnyNodeData[] }`.
- **SCM Query**: A tree-sitter query file (`.scm`) containing S-expression patterns with `@capture` annotations.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `ir.functionItem.from({ name: 'main' }).$trivia(ir.lineComment('// hello')).$render()` produces output with the comment above the function declaration.
- **SC-002**: All three grammars (rust, typescript, python) have trivia kinds extracted — zero manual annotation required.
- **SC-003**: `$trivia()` accepts only grammar-specific trivia kinds at compile time — passing a non-trivia kind produces a type error.
- **SC-004**: TS and Rust render engines produce identical output for nodes with trivia attached.
- **SC-005**: All existing validator counts hold or improve after the change.
- **SC-006**: `ir.from.boolean(true).$render()` produces `true` in all three grammars.
- **SC-007**: `ir.from.number(42).$render()` produces `42` in all three grammars.
- **SC-008**: `ir.from.string("hello").$render()` produces `hello` in all three grammars.
- **SC-009**: Cross-grammar diagnostic reports role→kind mappings for all three grammars.
- **SC-010**: `ir.from.*` functions are typed per grammar — return types are grammar-specific unions.

## Clarifications

### Session 2026-05-06

- Q: Should canonical factories live on `ir` namespace or separate? → A: `ir.from.*` sub-namespace. Avoids name collisions with grammar-specific kinds.
- Q: What about definition-role factories? → A: Out of scope — definitions are branch-shaped, resolution is complex. Only leaf-shaped roles (boolean, number, string, comment, type, identifier) get canonical factories.
