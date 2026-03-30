# Feature Specification: Rewrite Codegen from grammar.js

**Feature Branch**: `001-codegen-grammarjs-rewrite`
**Created**: 2026-03-24
**Status**: Draft
**Input**: User description: "(re)implement sittir/codegen using grammar.js as the source of truth, targeting fluent and declarative building patterns, and integration into ast-grep and codemod workflows"

## Clarifications

### Session 2026-03-24

- Q: Can `@sittir/types` be modified as part of this rewrite? → A: Yes (Option B) — fully evolvable, breaking changes OK. Type simplification is an explicit goal.
- Q: What does "simplify types" mean? → A: Eliminate unnecessary abstractions entirely (e.g., `LeafBuilder` as a separate class). Goal is fewer types, not simpler versions of the same types.
- Q: How does ast-grep integration work? → A: Library only (Option A). Generated builder packages are imported by codemod scripts; ast-grep matching is handled separately by the consumer.
- Q: Should rendered output have configurable formatting? → A: Grammar-default now, with a RenderContext hook to offload formatting/linting to an external tool (e.g., oxfmt). Sittir does not own formatting.
- Q: Terminology/naming conventions? → A: Align with tree-sitter and ast-grep terminology. Names, patterns, and concepts should be intuitive to someone with exposure to those tools — no invented abstractions where a tree-sitter term already exists.
- Q: Template literal type validations? → A: Yes. Generate compile-time constraints for terminal factories where the grammar provides patterns (escape sequences, operators, etc.).
- Q: Shorthand string sugar in declarative API? → A: Yes. Fields accepting only leaf kinds should accept plain strings with type inference. E.g., `content: 'hello'` infers `string_fragment`, `content: '\\n'` infers `escape_sequence`. Explicit `NodeData` always accepted for disambiguation.
- Q: Single-field node compression? → A: Yes. When a node has exactly one field, the factory accepts the value directly: `ir.string('hello')` instead of `ir.string({ content: 'hello' })`. Config object form still accepted.
- Q: Stylistic conventions to retain from old API? → A: Key conventions to carry forward, especially those based on supertypes: (1) supertype union types — `_expression` generates `type Expression = BinaryExpression | CallExpression | ...`, enabling fields typed as `Expression` to accept any concrete expression factory output; (2) `toShortName` for ir namespace keys — `ir.function` not `ir.functionItem`, trailing underscores dropped; (3) nested namespaces within `ir` for grouping by supertype. Also retain: camelCase field names, keyword factories (zero-arg), leaf factories (text-arg), semantic operator aliases.
- Q: Parse-tree type support? → A: Yes. Generate `const enum SyntaxKind` for node kind discrimination. Two separate type projections from the same grammar: construction types (factory input shapes) and navigation types (parse-tree node shapes with `*Node` suffix, e.g., `name: IdentifierNode`, `body?: BlockNode`). Both generated in the same codegen pass, both using the same `SyntaxKind` enum.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Fluent Builders from grammar.js (Priority: P1)

A language tooling developer points the codegen system at a tree-sitter grammar package (e.g., `tree-sitter-rust`) and receives a complete set of typed factory functions and render tables — one factory per grammar node kind. The codegen reads `grammar.js` (via its compiled `grammar.json`) as the single source of truth for field names, child ordering, required vs. optional status, and token literals. Factories produce `NodeData` plain objects; the `@sittir/core` render engine walks pre-compiled render tables to produce source text.

**Why this priority**: This is the core capability. Without factories and render tables generated from the grammar, nothing else works. It establishes the end-to-end pipeline: grammar.js in, factories + render tables out.

**Independent Test**: Can be fully tested by running codegen against the Rust grammar and verifying that each generated factory: (a) compiles without errors, (b) produces `NodeData` with the correct fields matching the grammar rule, (c) renders syntactically valid source code via `render(nodeData, rules)` for a representative sample of nodes.

**Acceptance Scenarios**:

1. **Given** a tree-sitter grammar package with `grammar.js` and `src/node-types.json`, **When** the codegen system processes it, **Then** it produces one factory function + render table per named node kind, with fluent setters for every field defined in the grammar.
2. **Given** a node kind with required fields (e.g., `function_item` requires `name`), **When** the factory is called, **Then** the required field(s) are positional arguments and optional fields are set via fluent chainable methods or a config object.
3. **Given** a node kind with children ordered by the grammar rule's SEQ structure, **When** `render(nodeData, rules)` is called, **Then** the output tokens appear in the exact order specified by the render table derived from the grammar rule, including keywords and punctuation.
4. **Given** a field that accepts multiple node kinds (e.g., a type field accepting `type_identifier | generic_type | scoped_type_identifier`), **When** the user sets that field, **Then** they can pass any `NodeData` matching those kinds, and a typed discriminated union resolves the correct type.

---

### User Story 2 - Declarative Builder Composition (Priority: P1)

A developer constructs complex AST fragments by nesting builders declaratively — calling factory functions from an `ir` namespace, chaining fluent setters, and letting rendering happen lazily at the end. The builder tree mirrors the grammar structure, so the developer never needs to manually manage token order, spacing, or punctuation.

**Why this priority**: Equal to P1 because the fluent/declarative API is the primary interface developers interact with. If builders exist but aren't ergonomic and declarative, adoption fails.

**Independent Test**: Can be tested by constructing a multi-level AST (e.g., a Rust function with parameters, a block body, and return type) using only `ir.*` factory calls and fluent setters, then rendering it and verifying the output is valid source code.

**Acceptance Scenarios**:

1. **Given** the `ir` namespace with factory functions for all node kinds, **When** a developer writes `ir.functionItem(ir.identifier('main')).returnType(ir.primitiveType(ir.identifier('i32'))).body(ir.block())`, **Then** the result renders as syntactically valid Rust source.
2. **Given** a builder with all fields unset except required ones, **When** rendered, **Then** optional fields are omitted from the output (no placeholder text or empty tokens).
3. **Given** keyword nodes (e.g., `self`, `mut`, `pub`), **When** accessed via the `ir` namespace, **Then** they are available as zero-argument factories that produce `NodeData` with the correct fixed text.
4. **Given** leaf nodes (identifiers, literals), **When** created via the `ir` namespace, **Then** they accept a text argument and produce `NodeData` with a `text` field.

---

### User Story 3 - ast-grep and Codemod Integration (Priority: P2)

A codemod author uses the generated builders to programmatically construct replacement AST fragments within an ast-grep or tree-sitter-based codemod workflow. They match a pattern using ast-grep queries, extract captured nodes, construct a replacement using builders, and produce a text edit (byte-offset range + replacement text) compatible with ast-grep's edit format.

**Why this priority**: This is the primary downstream use case. Without codemod integration, the builders are a standalone toy. With it, they become a practical tool for large-scale code transformations.

**Independent Test**: Can be tested by writing a codemod that finds all `println!` macro invocations and replaces them with `eprintln!`, using builders to construct the replacement node, and verifying the output edit has correct byte offsets and replacement text.

**Acceptance Scenarios**:

1. **Given** a `NodeData` and its render rules, **When** the developer calls `toEdit(nodeData, rules, startPos, endPos)`, **Then** the result is an `Edit` object with `startPos`, `endPos`, and `insertedText` fields compatible with ast-grep's edit interface.
2. **Given** a matched AST node from ast-grep with known byte offsets, **When** the developer constructs a replacement via `ir.*` factories and calls `toEdit` with the matched range, **Then** the edit correctly targets the matched node's byte range.
3. **Given** multiple edits produced from different matched nodes in a single file, **When** applied in order, **Then** the edits do not conflict and the resulting file is syntactically valid.

---

### User Story 4 - Multi-Grammar Support (Priority: P2)

A developer generates builder packages for multiple languages (Rust, TypeScript, Python) from a single codegen invocation or separate invocations, and each generated package is self-contained with its own types, render tables, factories, and `ir` namespace — sharing only the common `@sittir/core` runtime and `@sittir/types` type projections.

**Why this priority**: The system must be grammar-agnostic to be useful beyond a single language. This validates the architecture works across different grammar structures.

**Independent Test**: Can be tested by generating builders for Rust and TypeScript grammars independently and verifying both packages compile, their `ir` namespaces are complete, and their builders render valid source for each language.

**Acceptance Scenarios**:

1. **Given** grammar packages for Rust and TypeScript, **When** codegen runs on each, **Then** each produces a complete, independent builder package with no cross-language type dependencies.
2. **Given** a grammar with supertype nodes (e.g., `_expression` in Rust), **When** codegen processes it, **Then** the supertypes are expanded into TypeScript union types referencing all concrete subtypes.
3. **Given** a grammar with operator tokens and keyword nodes, **When** codegen processes it, **Then** the generated `consts.ts` exposes discoverable arrays and maps of all operators, keywords, and enum-like leaf kinds.

---

### User Story 5 - Test Scaffolding Generation (Priority: P3)

The codegen system produces per-node test files alongside the factories, providing a baseline test for each node kind that verifies the factory produces correct `NodeData`, `render(nodeData, rules)` returns valid source, and the `kind` field matches.

**Why this priority**: Tests are important but secondary to the factories themselves. Generated test scaffolding accelerates quality assurance without blocking core functionality.

**Independent Test**: Can be tested by running the generated test suite for a grammar and verifying all tests pass, each test exercises the factory's output and render correctness, and terminal factory tests confirm correct `NodeData` shape.

**Acceptance Scenarios**:

1. **Given** a generated factory for a node kind, **When** the corresponding test file is run, **Then** it verifies that the factory produces `NodeData` with the correct `kind` field.
2. **Given** a generated factory with required fields populated, **When** the test calls `render(nodeData, rules)`, **Then** the output contains all required tokens from the grammar rule.
3. **Given** the complete generated test suite, **When** run via vitest, **Then** all tests pass without modification.

---

### Edge Cases

- What happens when a grammar node has no fields and no children (pure leaf)? The system classifies it as a leaf kind and generates a terminal factory (returns `NodeData` with a `text` field), not a branch factory.
- What happens when a field's type references a supertype? The supertype is resolved to its concrete subtypes, and the field accepts `NodeData` from any of those subtypes' factories.
- What happens when two node kinds produce the same camelCase factory name? The system detects collisions and falls back to a disambiguated factory name.
- What happens when a grammar rule contains ALIAS nodes that change the apparent type? The system respects `node-types.json` as authoritative for structure while using `grammar.json` for token ordering and constant text extraction.
- What happens when a grammar is updated and regenerated? Regeneration is idempotent — running codegen on the same grammar version produces identical output.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST read `grammar.js` (via its compiled `grammar.json`) as the primary source of truth for node structure, token ordering, keywords, and punctuation.
- **FR-002**: The system MUST read `node-types.json` as the authoritative source for field required/multiple flags, named types, and supertype definitions.
- **FR-003**: The system MUST generate one factory function + render table per named node kind that has fields or children (branch nodes). Factories produce `NodeData` plain objects, not ES classes.
- **FR-004**: The system MUST generate terminal factories for leaf node kinds (no fields, no children) that return `NodeData` with a `text` field. No separate leaf-specific class or type.
- **FR-005**: Each generated factory MUST support two usage modes: declarative (config object) and fluent (setter methods). Both modes produce identical `NodeData`. For single-field nodes, the `.from()` API additionally accepts the field value directly (see FR-022).
- **FR-006**: Each factory MUST provide fluent setter methods for every field. Setters are immutable — they return a new `NodeData` with the updated field, leaving the original unchanged. No-arg call acts as getter; with-arg call acts as setter.
- **FR-007**: *(Removed — subsumed by FR-022. Positional args are handled via `.from()` single-field compression, not the regular factory API.)*
- **FR-008**: The core render engine MUST produce tokens in the exact order specified by the render table derived from the grammar rule's SEQ structure.
- **FR-009**: The system MUST generate an `ir` namespace with factory functions for all node kinds — branch factories (accepting required fields), keyword factories (zero-arg, fixed text), and leaf factories (text-arg).
- **FR-010**: The system MUST generate typed discriminated unions for fields that accept multiple node kinds.
- **FR-011**: The system MUST resolve supertype references into concrete union types.
- **FR-012**: The system MUST generate a `consts.ts` module exposing arrays/maps of node kinds, leaf kinds, keywords, operators, and enum-like values.
- **FR-013**: The core MUST provide `toEdit(nodeData, rules, startPos, endPos)` that renders and produces an `Edit` object compatible with ast-grep's edit interface.
- **FR-014**: The system MUST generate per-node test files and a leaf test file that form a passing test suite without manual edits.
- **FR-015**: The system MUST support generating builder packages for any tree-sitter grammar, not just Rust.
- **FR-016**: The regular factory API field setters MUST accept only `NodeData<NarrowKind>` — never raw strings or scalars. Field types are narrowed to the specific kinds accepted (e.g., `NodeData<'identifier' | 'metavariable'>`). Ergonomic string/number/boolean resolution is exclusively the domain of the `.from()` API (see FR-026).
- **FR-017**: The system MUST detect factory name collisions and apply disambiguation.
- **FR-018**: Codegen output MUST be deterministic — the same grammar version always produces identical output.
- **FR-019**: The `@sittir/types` package MUST be simplified by eliminating unnecessary abstractions (e.g., `LeafBuilder` as a separate class, `LeafOptions` discriminant type). The goal is fewer types overall, not simpler versions of existing types.
- **FR-020**: For terminal node factories, the codegen MUST generate template literal type constraints where the grammar provides a pattern or fixed set of values (e.g., escape sequences: `` `\\${string}` ``, boolean literals: `'true' | 'false'`, operators: `'+' | '-' | '*'`). This provides compile-time validation of terminal node text.
- **FR-021**: The `.from()` API (FR-026) MUST accept shorthand string values, numbers, and booleans alongside explicit `NodeData` for leaf-accepting fields. Runtime resolution infers the correct node kind: `'hello'` → `identifier`, `42` → `integer_literal`, `true` → `boolean_literal`. The regular API (FR-016) does NOT accept raw strings — string shorthand is exclusively a `.from()` concern.
- **FR-022**: When a node kind has exactly one required non-multiple field, no required children, and that field accepts only leaf kinds, its `.from()` API MUST accept the field value directly — no config object needed. E.g., `ir.modItem.from('my_module')` instead of `ir.modItem.from({ name: 'my_module' })`. Leaf-only fields are unambiguously resolvable: at compile time via template literal type constraints, at runtime via pattern matching. The regular factory always requires a config object. The `.from()` config object form MUST also remain accepted.
- **FR-023**: Generated factories MUST validate string inputs at factory creation time — O(1) per input. Validation checks: (a) reserved keywords rejected where identifiers expected (using grammar's keyword set), (b) terminal text matches expected pattern (using grammar-derived regex). No render-time validation. TypeScript types handle all non-string validation at compile time.
- **FR-024**: The codegen MUST generate a `const enum SyntaxKind` per grammar containing all named node kinds (e.g., `SyntaxKind.FunctionItem = 'function_item'`), plus scoped `const enum`s per supertype (e.g., `ExpressionKind`, `StatementKind`) containing only the concrete subtypes of that supertype. The `kind` field on `NodeData` and the discriminant in type projections MUST use these enums for type narrowing, IDE autocomplete, and zero-runtime-cost discrimination.
- **FR-025**: The codegen MUST generate two complementary type projections from the same grammar, in the same codegen pass: (a) **Construction types** — factory input shapes with narrowed `NodeData<Kind>` field types for building nodes; (b) **Navigation types** — parse-tree accessor shapes with typed child node references (e.g., `name: IdentifierNode`, `body?: BlockNode`) for navigating and in-place editing parsed trees. Both use the same `const enum SyntaxKind` for discrimination.
- **FR-026**: The system MUST generate a `.from()` API per branch factory — an ergonomic entry point accepting plain objects, scalars, arrays, `NodeData`, or `AssignableNode` (SgNode) inputs. `.from()` resolves inputs recursively: strings → leaf factories, numbers → `integer_literal`, booleans → `boolean_literal`, arrays → container branch types, objects with `kind` → recursive `.from()`, objects without `kind` → inferred by field matching, `NodeData` → passthrough, `SgNode` → delegates to `.assign()`. The `.from()` API is the universal entry point — a polymorphic constructor following the `Buffer.from()` / Rust `From` trait naming convention.
- **FR-027**: Each `.from()` function MUST generate a recursively typed `FromInput` interface per factory. Branch fields reference other `FromInput` types: single branch → direct reference (`BlockFromInput`), multiple branches → discriminated union (`{ kind: 'generic_type' } & GenericTypeFromInput`). The `kind` field MUST be constrained to a grammar-specific `FromKind` union (never bare `string`).
- **FR-028**: `.from()` MUST return `FromNode` — a `NodeData<K>` with ergonomic fluent setters that accept `FromInput` field types (strings, numbers, objects) instead of strict `NodeData`. The regular factory returns `Node` with strict setters accepting only `NodeData<NarrowKind>`.
- **FR-029**: `.from()` resolution logic MUST be generated inline per factory (client-side), not dispatched through a generic core resolver. Each field's resolution is codegen'd based on its known accepted types. This enables tree-shaking and eliminates the `FromContext` abstraction.
- **FR-030**: The `.from()` API MUST be emitted to a separate `from.ts` file, separate from `factories.ts`. This enables tree-shaking: users who only use the regular API never load resolution code. The `ir` namespace combines both via `Object.assign(factory, { from: factoryFrom })`.
- **FR-031**: `.from()` MUST detect `AssignableNode` (SgNode) inputs via duck typing (`typeof input.field === 'function'`) and delegate to `.assign()`, wrapping the strict setters with ergonomic resolution. This makes `.from()` the universal entry point for both construction and hydration.

### Key Entities

- **Grammar**: A tree-sitter grammar definition comprising `grammar.json` (rules, token order, keywords) and `node-types.json` (field metadata, types, supertypes). The single source of truth for all generated code.
- **NodeData**: A plain object representing an AST node — `{ kind, fields, text? }`. Produced by factory functions, consumed by the core render engine. The universal data structure that replaces the old `Builder` class hierarchy.
- **RenderRule**: A pre-compiled array of render steps (tokens, field references) derived from a grammar rule's SEQ structure. Data, not code — walked by the core render engine to produce source text.
- **Factory**: A generated function for a specific node kind that produces `NodeData`. Supports declarative (config object) and fluent (immutable setters). No ES classes.
- **IR Namespace**: The developer-facing API surface — a namespace object with factory functions for every node kind, keyword, and leaf type in the grammar.
- **Edit**: A byte-range replacement descriptor (startPos, endPos, insertedText) for integration with ast-grep and codemod tooling.
- **NodeMeta**: The merged metadata for a single node kind — combines field info from `node-types.json` with rule structure from `grammar.json`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of named node kinds in a supported grammar have a corresponding generated factory + render table that compiles without type errors.
- **SC-002**: 100% of generated per-node tests pass without manual modification when run against the generated package.
- **SC-003**: Rendered output from any factory-produced `NodeData` with all required fields populated is syntactically valid when parsed by the corresponding tree-sitter parser (zero ERROR nodes).
- **SC-004**: Packages for at least 3 grammars (Rust, TypeScript, Python) can be generated from the same codegen system without grammar-specific code.
- **SC-005**: A developer can construct a 5-level-deep AST fragment (e.g., function with typed parameters, block body, nested expressions) in under 10 lines of factory code.
- **SC-006**: An `Edit` produced via `toEdit()` can be applied to source text to produce syntactically valid output, verified by round-trip parsing.
- **SC-007**: Regenerating builders from an unchanged grammar produces byte-identical output.

## Assumptions

- The `@sittir/types` package is evolvable — breaking changes are permitted. Unnecessary abstractions (e.g., `LeafBuilder`, `LeafOptions`) should be eliminated, not just simplified.
- `node-types.json` and `grammar.json` are always available as part of any tree-sitter grammar package (they are build artifacts of `tree-sitter generate`).
- Backwards compatibility with the current codegen output is not required. This is a clean rewrite.
- The `grammar.js` DSL is accessed via its compiled `grammar.json` representation, not by evaluating JavaScript directly.
- ast-grep integration targets the `Edit` interface (byte-offset text replacements), not deeper ast-grep API coupling. Sittir is a library only — no CLI or ast-grep plugin.
- Rendered output uses grammar-default formatting. A `RenderContext` hook allows offloading formatting/linting to external tools (e.g., oxfmt). Sittir does not own formatting.
- Terminology and naming conventions MUST align with tree-sitter and ast-grep concepts (e.g., "node", "kind", "field", "named", "anonymous"). Avoid inventing abstractions where a well-known tree-sitter/ast-grep term already exists.
- The monorepo structure (`packages/types`, `packages/codegen`, `packages/rust`, etc.) is preserved.
