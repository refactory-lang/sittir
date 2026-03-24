# Feature Specification: Rewrite Codegen from grammar.js

**Feature Branch**: `001-codegen-grammarjs-rewrite`
**Created**: 2026-03-24
**Status**: Draft
**Input**: User description: "(re)implement sittir/codegen using grammar.js as the source of truth, targeting fluent and declarative building patterns, and integration into ast-grep and codemod workflows"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Fluent Builders from grammar.js (Priority: P1)

A language tooling developer points the codegen system at a tree-sitter grammar package (e.g., `tree-sitter-rust`) and receives a complete set of typed, fluent builder classes — one per grammar node kind. Each builder reads its structure directly from `grammar.js` (the grammar's JavaScript DSL definition), uses it as the single source of truth for field names, child ordering, required vs. optional status, and token literals, and produces source code via a composable, lazy rendering pipeline.

**Why this priority**: This is the core capability. Without fluent builders generated from the grammar, nothing else works. It establishes the end-to-end pipeline: grammar.js in, builder classes out.

**Independent Test**: Can be fully tested by running codegen against the Rust grammar and verifying that each generated builder class: (a) compiles without errors, (b) has the correct fields matching the grammar rule, (c) renders syntactically valid source code for a representative sample of nodes.

**Acceptance Scenarios**:

1. **Given** a tree-sitter grammar package with `grammar.js` and `src/node-types.json`, **When** the codegen system processes it, **Then** it produces one builder class per named node kind, each with fluent setters for every field defined in the grammar.
2. **Given** a node kind with required fields (e.g., `function_item` requires `name`), **When** the builder is instantiated, **Then** the constructor requires the mandatory field(s) and optional fields are set via fluent chainable methods.
3. **Given** a node kind with children ordered by the grammar rule's SEQ structure, **When** `renderImpl()` is called, **Then** the output tokens appear in the exact order specified by the grammar rule, including keywords and punctuation.
4. **Given** a field that accepts multiple node kinds (e.g., a type field accepting `type_identifier | generic_type | scoped_type_identifier`), **When** the user sets that field, **Then** they can pass any builder matching those kinds, and a discriminant mechanism resolves the correct builder type.

---

### User Story 2 - Declarative Builder Composition (Priority: P1)

A developer constructs complex AST fragments by nesting builders declaratively — calling factory functions from an `ir` namespace, chaining fluent setters, and letting rendering happen lazily at the end. The builder tree mirrors the grammar structure, so the developer never needs to manually manage token order, spacing, or punctuation.

**Why this priority**: Equal to P1 because the fluent/declarative API is the primary interface developers interact with. If builders exist but aren't ergonomic and declarative, adoption fails.

**Independent Test**: Can be tested by constructing a multi-level AST (e.g., a Rust function with parameters, a block body, and return type) using only `ir.*` factory calls and fluent setters, then rendering it and verifying the output is valid source code.

**Acceptance Scenarios**:

1. **Given** the `ir` namespace with factory functions for all node kinds, **When** a developer writes `ir.functionItem(ir.identifier('main')).returnType(ir.primitiveType(ir.identifier('i32'))).body(ir.block())`, **Then** the result renders as syntactically valid Rust source.
2. **Given** a builder with all fields unset except required ones, **When** rendered, **Then** optional fields are omitted from the output (no placeholder text or empty tokens).
3. **Given** keyword nodes (e.g., `self`, `mut`, `pub`), **When** accessed via the `ir` namespace, **Then** they are available as zero-argument factories that produce the correct fixed-text leaf builder.
4. **Given** leaf nodes (identifiers, literals), **When** created via the `ir` namespace, **Then** they accept a text argument and produce a typed `LeafBuilder` wrapping that text.

---

### User Story 3 - ast-grep and Codemod Integration (Priority: P2)

A codemod author uses the generated builders to programmatically construct replacement AST fragments within an ast-grep or tree-sitter-based codemod workflow. They match a pattern using ast-grep queries, extract captured nodes, construct a replacement using builders, and produce a text edit (byte-offset range + replacement text) compatible with ast-grep's edit format.

**Why this priority**: This is the primary downstream use case. Without codemod integration, the builders are a standalone toy. With it, they become a practical tool for large-scale code transformations.

**Independent Test**: Can be tested by writing a codemod that finds all `println!` macro invocations and replaces them with `eprintln!`, using builders to construct the replacement node, and verifying the output edit has correct byte offsets and replacement text.

**Acceptance Scenarios**:

1. **Given** a builder that has rendered source text, **When** the developer calls a method to produce an edit, **Then** the result is an `Edit` object with `startPos`, `endPos`, and `insertedText` fields compatible with ast-grep's edit interface.
2. **Given** a matched AST node from ast-grep with known byte offsets, **When** the developer constructs a replacement builder and asks for the edit relative to the matched range, **Then** the edit correctly targets the matched node's byte range.
3. **Given** multiple edits produced from different matched nodes in a single file, **When** applied in order, **Then** the edits do not conflict and the resulting file is syntactically valid.

---

### User Story 4 - Multi-Grammar Support (Priority: P2)

A developer generates builder packages for multiple languages (Rust, TypeScript, Python) from a single codegen invocation or separate invocations, and each generated package is self-contained with its own types, builders, and `ir` namespace — sharing only the common `@sittir/types` base.

**Why this priority**: The system must be grammar-agnostic to be useful beyond a single language. This validates the architecture works across different grammar structures.

**Independent Test**: Can be tested by generating builders for Rust and TypeScript grammars independently and verifying both packages compile, their `ir` namespaces are complete, and their builders render valid source for each language.

**Acceptance Scenarios**:

1. **Given** grammar packages for Rust and TypeScript, **When** codegen runs on each, **Then** each produces a complete, independent builder package with no cross-language type dependencies.
2. **Given** a grammar with supertype nodes (e.g., `_expression` in Rust), **When** codegen processes it, **Then** the supertypes are expanded into TypeScript union types referencing all concrete subtypes.
3. **Given** a grammar with operator tokens and keyword nodes, **When** codegen processes it, **Then** the generated `consts.ts` exposes discoverable arrays and maps of all operators, keywords, and enum-like leaf kinds.

---

### User Story 5 - Test Scaffolding Generation (Priority: P3)

The codegen system produces per-node test files alongside the builders, providing a baseline test for each node kind that verifies build(), renderImpl(), toCST(), and render('fast') all function correctly.

**Why this priority**: Tests are important but secondary to the builders themselves. Generated test scaffolding accelerates quality assurance without blocking core functionality.

**Independent Test**: Can be tested by running the generated test suite for a grammar and verifying all tests pass, each test exercises the builder's core methods, and leaf builder tests confirm that build() returns objects (not strings).

**Acceptance Scenarios**:

1. **Given** a generated builder for a node kind, **When** the corresponding test file is run, **Then** it verifies that `build()` returns an object with the correct `kind` field.
2. **Given** a generated builder with required fields populated, **When** the test calls `renderImpl()`, **Then** the output contains all required tokens from the grammar rule.
3. **Given** the complete generated test suite, **When** run via vitest, **Then** all tests pass without modification.

---

### Edge Cases

- What happens when a grammar node has no fields and no children (pure leaf)? The system classifies it as a leaf kind and generates a `LeafBuilder` factory, not a builder class.
- What happens when a field's type references a supertype? The supertype is resolved to its concrete subtypes, and the field accepts builders for any of those subtypes.
- What happens when two node kinds produce the same camelCase factory name? The system detects collisions and falls back to a disambiguated factory name.
- What happens when a grammar rule contains ALIAS nodes that change the apparent type? The system respects `node-types.json` as authoritative for structure while using `grammar.json` for token ordering and constant text extraction.
- What happens when a grammar is updated and regenerated? Regeneration is idempotent — running codegen on the same grammar version produces identical output.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST read `grammar.js` (via its compiled `grammar.json`) as the primary source of truth for node structure, token ordering, keywords, and punctuation.
- **FR-002**: The system MUST read `node-types.json` as the authoritative source for field required/multiple flags, named types, and supertype definitions.
- **FR-003**: The system MUST generate one builder class per named node kind that has fields or children (branch nodes).
- **FR-004**: The system MUST generate `LeafBuilder` factories for terminal node kinds (no fields, no children).
- **FR-005**: Each generated builder MUST extend a common `Builder` base class and implement `renderImpl()`, `build()`, and `toCSTChildren()`.
- **FR-006**: Each builder MUST provide fluent, chainable setter methods for every optional field.
- **FR-007**: Each builder's constructor MUST require the most important mandatory field(s) as determined by grammar analysis.
- **FR-008**: The `renderImpl()` method MUST produce tokens in the exact order specified by the grammar rule's SEQ structure.
- **FR-009**: The system MUST generate an `ir` namespace with factory functions for all node kinds — branch factories (accepting required fields), keyword factories (zero-arg, fixed text), and leaf factories (text-arg).
- **FR-010**: The system MUST generate typed discriminated unions for fields that accept multiple node kinds.
- **FR-011**: The system MUST resolve supertype references into concrete union types.
- **FR-012**: The system MUST generate a `consts.ts` module exposing arrays/maps of node kinds, leaf kinds, keywords, operators, and enum-like values.
- **FR-013**: The system MUST produce `Edit` objects (startPos, endPos, insertedText) from rendered builders, compatible with ast-grep's edit interface.
- **FR-014**: The system MUST generate per-node test files and a leaf test file that form a passing test suite without manual edits.
- **FR-015**: The system MUST support generating builder packages for any tree-sitter grammar, not just Rust.
- **FR-016**: All builder field setters MUST accept only `Builder` instances (or `LeafOptions` for multi-leaf discriminated fields) — never raw strings except via `LeafBuilder`.
- **FR-017**: The system MUST detect factory name collisions and apply disambiguation.
- **FR-018**: Codegen output MUST be deterministic — the same grammar version always produces identical output.

### Key Entities

- **Grammar**: A tree-sitter grammar definition comprising `grammar.json` (rules, token order, keywords) and `node-types.json` (field metadata, types, supertypes). The single source of truth for all generated code.
- **Builder**: A generated class for a specific node kind that holds child builders in typed fields, renders source text lazily, and produces IR objects and CST nodes.
- **LeafBuilder**: A concrete builder for terminal nodes (identifiers, literals, keywords) — the only entry point for raw text into the builder tree.
- **IR Namespace**: The developer-facing API surface — a namespace object with factory functions for every node kind, keyword, and leaf type in the grammar.
- **Edit**: A byte-range replacement descriptor (startPos, endPos, insertedText) for integration with ast-grep and codemod tooling.
- **NodeMeta**: The merged metadata for a single node kind — combines field info from `node-types.json` with rule structure from `grammar.json`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of named node kinds in a supported grammar have a corresponding generated builder that compiles without type errors.
- **SC-002**: 100% of generated per-node tests pass without manual modification when run against the generated builder package.
- **SC-003**: Rendered output from any builder with all required fields populated is syntactically valid when parsed by the corresponding tree-sitter parser (zero ERROR nodes).
- **SC-004**: Builder packages for at least 3 grammars (Rust, TypeScript, Python) can be generated from the same codegen system without grammar-specific code.
- **SC-005**: A developer can construct a 5-level-deep AST fragment (e.g., function with typed parameters, block body, nested expressions) in under 10 lines of builder code.
- **SC-006**: An `Edit` produced from a builder can be applied to source text to produce syntactically valid output, verified by round-trip parsing.
- **SC-007**: Regenerating builders from an unchanged grammar produces byte-identical output.

## Assumptions

- The existing `@sittir/types` package (`Builder`, `LeafBuilder`, `LeafOptions`, `Edit`, `CSTNode`) provides the runtime base classes and interfaces. The rewrite focuses on the codegen pipeline, not the runtime types.
- `node-types.json` and `grammar.json` are always available as part of any tree-sitter grammar package (they are build artifacts of `tree-sitter generate`).
- Backwards compatibility with the current codegen output is not required. This is a clean rewrite.
- The `grammar.js` DSL is accessed via its compiled `grammar.json` representation, not by evaluating JavaScript directly.
- ast-grep integration targets the `Edit` interface (byte-offset text replacements), not deeper ast-grep API coupling.
- The monorepo structure (`packages/types`, `packages/codegen`, `packages/rust`, etc.) is preserved.
