# Feature Specification: YAML Render Templates

**Feature Branch**: `004-yaml-render-templates`
**Created**: 2026-03-29
**Status**: Draft
**Input**: Render Templates specification — migrate from S-expression TypeScript to ast-grep-style YAML templates with clauses, per-rule joinBy, and literal formatting
**Design Document**: [design.md](design.md) — full technical reference with render engine pseudocode, type changes, file structure, and complete Rust YAML example

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Codegen produces YAML templates from grammar (Priority: P1)

A developer runs the sittir codegen CLI against a tree-sitter grammar (e.g., Rust). The codegen walks the grammar's enriched rule tree and emits a single `templates.yaml` file per language containing render templates in ast-grep meta variable syntax, with synthesized clauses for optional token+field groups and per-rule `joinBy` separators.+

**Why this priority**: This is the core pipeline change. Without YAML template emission, nothing else works. It replaces the current S-expression `rules.ts` + `joinby.ts` generation.

**Independent Test**: Run the codegen CLI for the Rust grammar and verify the output `templates.yaml` contains valid YAML with expected structure (top-level keys: `language`, `extensions`, `expandoChar`, `metadata`, `rules`), correct rule entries, synthesized clauses, and per-rule `joinBy` keys.

**Acceptance Scenarios**:

1. **Given** a tree-sitter Rust grammar.json and node-types.json, **When** the codegen runs with `--all`, **Then** a `templates.yaml` file is produced at the package root with `language: rust`, rule entries for all structural nodes, and no `rules.ts` or `joinby.ts` generated.
2. **Given** a grammar node `function_item` with an optional `return_type` field paired with `->` token, **When** the codegen processes this node, **Then** the YAML output contains a `return_type_clause: "-> $RETURN_TYPE "` key nested under `function_item` and a `$RETURN_TYPE_CLAUSE` reference in the template string.
3. **Given** a grammar node `parameters` with repeated comma-separated children, **When** the codegen processes this node, **Then** the YAML output contains `joinBy: ", "` in the rule object.
4. **Given** a grammar node `function_item` with both comma-separated parameters and newline-separated body statements, **When** the codegen processes this node, **Then** the YAML output contains an object-form `joinBy` with distinct separators per variable (`PARAMETERS: ", "`, `BODY: "\n"`).

---

### User Story 2 - Render engine interpolates YAML templates (Priority: P1)

A developer creates a `NodeData` tree using factory functions and calls `render()`. The render engine loads the YAML templates, resolves `$VARIABLE` slots against `node.fields`, handles clauses (omitting entire clause when underlying field is absent), joins multi-variables with their `joinBy` separator, and produces correctly formatted source code with literal whitespace.

**Why this priority**: Equally critical to P1 — without a working render engine, templates are inert data. This replaces the S-expression parser and `parts.join(' ')` engine.

**Independent Test**: Create a `function_item` NodeData with and without `return_type`, render it, and verify the output includes/excludes `-> i32` correctly and produces `fn main(a: i32, b: i32) -> i32 { ... }` with correct spacing (no spaces around parentheses, correct delimiter attachment).

**Acceptance Scenarios**:

1. **Given** a `function_item` NodeData with `return_type` present, **When** `render()` is called, **Then** the output includes `-> i32 ` before the opening brace.
2. **Given** a `function_item` NodeData without `return_type`, **When** `render()` is called, **Then** the output omits the entire `-> ` prefix (clause omitted).
3. **Given** a `parameters` NodeData with three parameter children, **When** `render()` is called with `joinBy: ", "`, **Then** the output joins parameters with `, ` (e.g., `(a: i32, b: i32, c: i32)`).
4. **Given** a leaf node (identifier, literal), **When** `render()` is called, **Then** the output is `node.text` directly (no template lookup needed).
5. **Given** a `block` NodeData with multiple statement children, **When** `render()` is called with `joinBy: "\n"`, **Then** statements are separated by newlines with proper indentation.

---

### User Story 3 - S-expression parser and old files removed (Priority: P2)

After migration, the codebase no longer contains the S-expression parser (`sexpr.ts`), the generated `rules.ts` and `joinby.ts` files, or the associated types (`TemplateElement`, `ParsedTemplate`). This eliminates open issues #8 and #9 related to parser limitations.

**Why this priority**: Cleanup is important for maintainability but depends on the new system being fully functional first.

**Independent Test**: Verify that `packages/core/src/sexpr.ts` does not exist, `packages/{lang}/src/rules.ts` and `joinby.ts` do not exist, and the type definitions for `TemplateElement`/`ParsedTemplate` are absent from the types package.

**Acceptance Scenarios**:

1. **Given** the migration is complete, **When** checking the file tree, **Then** `packages/core/src/sexpr.ts` does not exist.
2. **Given** the migration is complete, **When** checking generated packages, **Then** no `rules.ts` or `joinby.ts` files exist under `packages/{lang}/src/`.
3. **Given** the migration is complete, **When** checking type definitions, **Then** `TemplateElement`, `ParsedTemplate`, `RenderTemplate`, and `RenderRule` types are removed and replaced by `TemplateRule` and `RulesConfig`.

---

### User Story 4 - Multi-language codegen consistency (Priority: P2)

The codegen produces correct `templates.yaml` files for all three supported grammars (Rust, TypeScript, Python), each with language-appropriate formatting (braces for Rust/TypeScript, indentation for Python), correct clauses, and correct `joinBy` values.

**Why this priority**: Validates the approach generalizes across grammar styles (brace-delimited vs. indent-sensitive).

**Independent Test**: Run codegen for all three grammars and verify each `templates.yaml` has correct language-specific formatting in templates (e.g., Python `def` uses colon+indent, Rust `fn` uses braces).

**Acceptance Scenarios**:

1. **Given** the Rust grammar, **When** codegen runs, **Then** `templates.yaml` contains brace-delimited block templates with 4-space indentation.
2. **Given** the Python grammar, **When** codegen runs, **Then** `templates.yaml` contains colon+indent block templates (e.g., `def $NAME($$$PARAMETERS)$RETURN_TYPE_CLAUSE:\n    $$$BODY`).
3. **Given** any grammar, **When** codegen runs, **Then** the `expandoChar` key reflects the language's needs (`null` for Rust/TypeScript/Python, potentially non-null for PHP/shell).

---

### User Story 5 - Existing tests pass with new render engine (Priority: P1)

All existing tests that exercise factory creation + rendering continue to pass after the migration. The factory API (`Config` input, `NodeData` output, fluent getters/setters) is unchanged; only the render backend changes.

**Why this priority**: Regression prevention is critical during a backend swap.

**Independent Test**: Run `pnpm test` and verify all existing test suites pass without modification (or with minimal changes to import paths if `rules.ts` imports change to YAML loading).

**Acceptance Scenarios**:

1. **Given** the existing test suite, **When** `pnpm test` runs after migration, **Then** all tests pass.
2. **Given** factory functions that produce `NodeData`, **When** `render()` is called on the output, **Then** results are identical or improved (better formatting) compared to the old S-expression engine.

---

### User Story 6 - Override fields for under-fielded grammars (Priority: P2)

A developer maintains an `overrides.json` file per grammar that provides synthetic field names for nodes where the tree-sitter grammar lacks explicit FIELDs (e.g., operators, positional children). The codegen merges these overrides with node-types.json during enrichment, and `wrap.ts` promotes the override-named children into `fields` at runtime so templates can reference them as `$FIELD_NAME`.

**Why this priority**: Enables correct templates for ~10-15 Rust nodes that lack explicit FIELDs. TypeScript and Python grammars barely need overrides.

**Independent Test**: Create an `overrides.json` with entries for `index_expression` (value/index fields) and `unary_expression` (operator/argument fields), run codegen, and verify the generated templates reference these as `$VALUE`, `$INDEX`, `$OPERATOR`, `$ARGUMENT`.

**Acceptance Scenarios**:

1. **Given** an `overrides.json` with `index_expression` fields `value` and `index`, **When** the codegen runs, **Then** the template for `index_expression` references `$VALUE` and `$INDEX` instead of positional `$$$CHILDREN`.
2. **Given** an override entry with `"anonymous": true` on the `operator` field, **When** `wrap.ts` runs at runtime, **Then** the anonymous token is promoted from `children` into `fields.operator`.
3. **Given** an `overrides.json` entry that doesn't match the grammar rule structure, **When** the codegen validates it, **Then** a descriptive error is reported.
4. **Given** a grammar where the codegen detects same-kind positional children (`SEQ(X, X)`), **When** running in diagnostic mode, **Then** the codegen logs "needs synthetic names" to help authors create overrides.

---

### User Story 7 - wrap.ts field promotion heuristics (Priority: P2)

The codegen generates per-kind `wrap` functions that promote unnamed children into `fields` using 5 heuristics (tree-sitter FIELD, unique kind, anonymous token, token-positional, CHOICE branch). After wrapping, all named positions are in `fields` regardless of origin, and `children` contains only the truly unnamed remainder.

**Why this priority**: Makes render templates work correctly for nodes with override fields — without promotion, `$FIELD_NAME` variables in templates would have nothing to resolve against.

**Independent Test**: Create a `NodeData` for `index_expression` via `assign` (from an ast-grep SgNode), verify that after wrapping, `fields.value` and `fields.index` are populated and `children` contains only the bracket tokens.

**Acceptance Scenarios**:

1. **Given** a `function_item` with an unnamed `visibility_modifier` child (Heuristic 2), **When** `wrap` runs, **Then** `fields.visibility_modifier` is populated and the child is removed from `children`.
2. **Given** a `unary_expression` with an anonymous `-` token (Heuristic 3), **When** `wrap` runs with overrides, **Then** `fields.operator` contains the `-` token.
3. **Given** an `index_expression` with two `_expression` children separated by `[` (Heuristic 4), **When** `wrap` runs with overrides, **Then** `fields.value` and `fields.index` are correctly assigned by token position.
4. **Given** a `range_expression` with multiple CHOICE branches (Heuristic 5), **When** `wrap` runs with overrides, **Then** `fields.start`, `fields.operator`, and `fields.end` are correctly assigned.

---

### Edge Cases

- What happens when a rule references a node kind that has no template entry in `templates.yaml`? (Expected: render engine throws a descriptive error)
- What happens when a clause contains multiple `$VARIABLE` references and only some resolve? (Expected: entire clause is omitted if any variable is absent)
- What happens when `joinBy` is specified as an object but a `$$$VARIABLE` in the template has no corresponding key? (Expected: falls back to default single space)
- What happens when a template contains `$` followed by a non-variable character (literal dollar sign)? (Expected: `expandoChar` provides escape mechanism for languages that use `$` literally)
- What happens when YAML multiline template strings have trailing newlines from `|` block scalar? (Expected: render engine trims trailing newline from YAML block scalar artifacts)
- What happens when an `overrides.json` entry conflicts with an existing tree-sitter FIELD? (Expected: codegen reports an error — overrides cannot shadow existing FIELDs)
- What happens when `wrap.ts` encounters a child that matches no heuristic? (Expected: child remains in `children` array, accessible via `$$$CHILDREN`)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Codegen MUST emit a single `templates.yaml` file per grammar package, replacing `rules.ts` and `joinby.ts`
- **FR-002**: Each `templates.yaml` MUST contain top-level keys: `language`, `extensions`, `expandoChar`, `metadata`, and `rules`
- **FR-003**: Rules MUST support two forms: string (simple template) and object (template + clauses + joinBy)
- **FR-004**: Template syntax MUST use ast-grep meta variable conventions: `$NAME` (single), `$$NAME` (unnamed), `$$$NAME` (multi), `$_NAME` (non-capturing)
- **FR-005**: Codegen MUST synthesize clauses for anonymous tokens adjacent to non-required fields in grammar `CHOICE([SEQ(STRING, FIELD), BLANK])` patterns
- **FR-006**: Clauses MUST be nested YAML keys under the parent rule, named `{field_name}_clause` in snake_case
- **FR-007**: Render engine MUST resolve clause variables against `node.fields` and omit the entire clause when any variable is absent
- **FR-008**: `joinBy` MUST support string form (applies to all `$$$` variables) and object form (keyed by variable name)
- **FR-009**: Default separator for `$$$` variables without explicit `joinBy` MUST be a single space
- **FR-010**: Formatting MUST be literal in templates — the render engine MUST concatenate without whitespace collapsing or `parts.join(' ')`
- **FR-011**: Render engine MUST return `node.text` directly for leaf nodes (no template lookup)
- **FR-012**: The S-expression parser (`sexpr.ts`) MUST be removed
- **FR-013**: Generated `rules.ts` and `joinby.ts` files MUST be removed from all language packages
- **FR-014**: Type system MUST replace `TemplateElement`/`ParsedTemplate` with `TemplateRule` and `RulesConfig` types
- **FR-015**: Casing convention MUST follow: camelCase for config/structural keys (ast-grep origin), snake_case for rule/clause/field names (tree-sitter origin), UPPER_SNAKE for template variables (ast-grep patterns)
- **FR-016**: Variable resolution MUST map by lowercasing: `$NAME` to `fields.name`, `$RETURN_TYPE` to `fields.return_type`
- **FR-017**: Absent fields MUST render as empty string and collapse exactly one adjacent space (consistent with ast-grep fix behavior) — e.g., `"$$$CHILDREN struct $NAME"` with absent `$$$CHILDREN` renders `"struct Foo"`, not `" struct Foo"`
- **FR-018**: Codegen MUST derive formatting signals from grammar structure: `IMMEDIATE_TOKEN` for no-space-before, delimiter pairs for attached tokens, block delimiters for multiline with indentation
- **FR-019**: Each grammar package MAY include an `overrides.json` file that provides supplemental field names for nodes lacking explicit tree-sitter FIELDs, mirroring the shape of `node-types.json`
- **FR-020**: Override entries with `"anonymous": true` MUST mark fields that map to anonymous tokens (operators, delimiters)
- **FR-021**: Codegen MUST merge override fields with node-types.json fields during enrichment; overrides MUST NOT shadow existing tree-sitter FIELDs
- **FR-022**: Codegen MUST validate `overrides.json` entries against the grammar rule structure and report errors for invalid entries
- **FR-023**: Codegen MUST detect and log override candidates automatically: same-kind positional children (`SEQ(X, X)`) and discriminator tokens (CHOICE branches identical after token removal)
- **FR-024**: `wrap.ts` MUST implement 5 field promotion heuristics: (1) tree-sitter FIELD by name, (2) unnamed child with unique kind, (3) anonymous token as value, (4) same-kind positional by token, (5) top-level CHOICE branch by token
- **FR-025**: After `wrap.ts` promotion, all named positions MUST be in `fields` regardless of origin; `children` MUST contain only the truly unnamed remainder
- **FR-026**: The render engine MUST resolve variables only via field lookup (`$FIELD_NAME` from `node.fields`, `$$$CHILDREN` from children array) and clause sub-templates — no runtime kind-matching; kind-specific child consumption is handled by `wrap.ts` field promotion before render
- **FR-027**: Codegen MUST classify each node's unnamed children by simplifying the grammar rule (strip tokens from SEQs, unwrap single-member SEQs, leave CHOICEs intact) to determine the appropriate template pattern

### Key Entities

- **TemplateRule**: A render template — either a plain string or an object with `template`, optional `*_clause` keys, and optional `joinBy`
- **RulesConfig**: The full YAML file shape — `language`, `extensions`, `expandoChar`, `metadata`, and `rules` (a record of kind to TemplateRule)
- **Clause**: A synthesized sub-template that bundles anonymous tokens with non-required fields; present as a YAML key under the parent rule, not a grammar node
- **joinBy**: A separator specification — string (all `$$$` vars) or object (per-variable) — that controls how multi-variable arrays are joined during rendering
- **overrides.json**: A per-grammar supplemental field definition file that provides synthetic field names for nodes where the tree-sitter grammar lacks explicit FIELDs; codegen-time only, not shipped at runtime
- **wrap function**: A per-kind generated function that promotes override-named and heuristically-detected children from `children` into `fields`, making render templates and factory output symmetric

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 5 known open issues (#1, #5, #7, #8, #9) are resolved by the migration
- **SC-002**: Codegen produces valid `templates.yaml` for all 3 supported grammars (Rust, TypeScript, Python)
- **SC-003**: 100% of existing tests pass after migration without changes to factory/from/assign APIs
- **SC-004**: Render engine produces correctly formatted output for representative node types (functions, declarations, control flow, containers) across all 3 grammars
- **SC-005**: Render engine code is reduced from ~133 lines + 119 lines (sexpr parser) to ~50 lines total
- **SC-006**: Template files are human-readable — a developer can look at a template and immediately understand what code it produces
- **SC-007**: Per-rule `joinBy` correctly produces distinct separators for different `$$$` variables within the same rule (e.g., `, ` for params, `\n` for body)
- **SC-008**: Clauses correctly omit paired tokens when optional fields are absent (e.g., `-> ` omitted when no `return_type`)
- **SC-009**: `overrides.json` for Rust correctly provides field names for ~10-15 under-fielded nodes (e.g., `index_expression`, `unary_expression`, `range_expression`)
- **SC-010**: `wrap.ts` correctly promotes override fields into `fields` for all 5 heuristic categories, verified by assign round-trip tests
- **SC-011**: Templates for nodes with override fields use `$FIELD_NAME` variables instead of positional `$$$CHILDREN`

## Clarifications

### Session 2026-04-05

- Q: How should the render engine handle whitespace adjacent to absent variables? → A: Absent variables collapse exactly one adjacent space (ast-grep fix behavior). Present variables preserve literal formatting.
- Q: How does the render engine distinguish `$FIELD_NAME` from `$KIND_NAME`? → A: No kind matching at runtime. `$NAME` is always a field lookup. Kind-specific child consumption is handled by `wrap.ts` promoting children to fields before render.

## Assumptions

- The `NodeModel` pipeline (specs 002, 003) with `EnrichedRule` is available and stable on the current branch — the codegen walks `node.rule` to generate templates
- The grammar rule tree structure (SEQ, CHOICE, FIELD, STRING, REPEAT, BLANK) provides sufficient signals for formatting decisions (immediate tokens, delimiter pairs, block structure)
- A YAML parsing library is available or can be added as a dependency for loading templates at runtime
- The `expandoChar` mechanism for languages using `$` literally (PHP, shell) is specified but not immediately needed — Rust, TypeScript, and Python do not use `$` in their syntax
- Indentation is universally 4 spaces, baked into templates by the codegen — no per-language indent configuration. Style-conformant indentation (e.g., 2 spaces for TypeScript) is the external formatter's job (`prettier`, `rustfmt`, `black`)
- The existing test infrastructure exercises factories + render in a way that validates correctness of the new engine without test rewrites
/sp