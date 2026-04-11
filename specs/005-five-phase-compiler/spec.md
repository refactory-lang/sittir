# Feature Specification: Five-Phase Grammar Compiler

**Feature Branch**: `005-five-phase-compiler`
**Created**: 2026-04-11
**Status**: Draft
**Input**: Restructure the codegen pipeline into a five-phase compiler with well-defined contracts: Evaluate, Link, Optimize, Assemble, Emit. Reference design: `specs/sittir-grammar-compiler-spec.md`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run codegen for any supported grammar (Priority: P1)

A developer points the codegen CLI at a tree-sitter grammar and receives correct, complete output files. The pipeline processes the grammar through five sequential phases and produces output functionally equivalent to the current codegen for all supported grammars (Rust, TypeScript, Python).

**Why this priority**: This is the core value proposition. If the restructured pipeline doesn't produce correct output for existing grammars, everything else is moot.

**Independent Test**: Run codegen against all three supported grammars and diff the output against the current codegen baseline. All generated files must be functionally equivalent.

**Acceptance Scenarios**:

1. **Given** a Rust grammar and overrides, **When** the developer runs codegen with `--all`, **Then** all output files (types.ts, factories.ts, templates.yaml, from.ts, ir.ts, consts.ts, wrap.ts, utils.ts, joinby.ts, index.ts) are generated and functionally equivalent to the current baseline.
2. **Given** a TypeScript grammar and overrides, **When** the developer runs codegen, **Then** all output files are generated and functionally equivalent to baseline.
3. **Given** a Python grammar and overrides, **When** the developer runs codegen, **Then** all output files are generated and functionally equivalent to baseline.
4. **Given** a grammar.js source file (not pre-compiled JSON), **When** the developer runs codegen, **Then** the pipeline evaluates the DSL and produces the same output as the JSON path.

---

### User Story 2 - Inspect and test each phase independently (Priority: P2)

A developer debugging a codegen issue can invoke each phase as a standalone function, inspect its output, and write unit tests against it. Each phase is stateless — given the same input, it always produces the same output. No global setup, no hidden caches, no order-dependent initialization.

**Why this priority**: Stateless phases with clear contracts are the architectural differentiator. They make the pipeline testable, debuggable, and maintainable — the primary motivation for the refactoring.

**Independent Test**: Call each phase function directly in a unit test with known input. Assert the output structure matches the phase contract. Verify no global state is read or mutated.

**Acceptance Scenarios**:

1. **Given** a grammar path, **When** the developer calls the Evaluate phase, **Then** a grammar contract is returned containing rules, metadata, and a reference graph — with no global state mutation.
2. **Given** an evaluated grammar and overrides, **When** the developer calls the Link phase, **Then** a linked grammar is returned with all references resolved, hidden rules classified, and field provenance annotated — with no unresolved reference types remaining.
3. **Given** a linked grammar, **When** the developer calls the Optimize phase, **Then** an optimized grammar is returned with choice branches wrapped as variants and structural grouping restructured — without modifying any named content.
4. **Given** an optimized grammar, **When** the developer calls the Assemble phase, **Then** a node map is returned with every rule classified into the correct model type and all field metadata derived from the rule tree context.
5. **Given** a node map, **When** the developer calls any emitter, **Then** the emitter produces correct output without access to the original grammar or rule trees.

---

### User Story 3 - Add a new grammar without pipeline changes (Priority: P2)

A developer adding support for a new tree-sitter grammar provides only a grammar input file and an overrides configuration. The pipeline processes the new grammar without any code changes. All language-specific behavior is driven by overrides, not hardcoded conditionals.

**Why this priority**: Grammar-agnostic design ensures the pipeline scales to new grammars without maintenance burden. It also prevents the accumulation of language-specific special cases.

**Independent Test**: Add a previously unsupported grammar (e.g., Go, Java, or C) with appropriate overrides and verify the pipeline produces valid output without any pipeline code modifications.

**Acceptance Scenarios**:

1. **Given** a new grammar with external tokens for indentation, **When** the developer maps externals to roles in overrides, **Then** the Link phase replaces those symbols with structural whitespace directives.
2. **Given** a new grammar where unnamed children should be promoted to named fields, **When** the developer adds field overrides, **Then** the Link phase wraps children in field nodes with override provenance.
3. **Given** the complete pipeline codebase, **When** searching for language-specific conditionals, **Then** zero matches are found for patterns like `if (language === ...)` or `if (kind === ...)`.

---

### User Story 4 - Polymorphic nodes produce per-form output (Priority: P3)

A developer generating code for grammar rules with top-level choices (e.g., Rust's `use_declaration` with multiple structural forms) receives distinct factory functions, type interfaces, and render templates for each form. Each form is independently constructable and renderable.

**Why this priority**: Polymorphs are the most complex model type. Correct per-form output validates the entire variant-to-form pipeline across all phases.

**Independent Test**: Generate output for a known polymorph and verify each form has its own factory, type interface, and template with correct discriminant tokens.

**Acceptance Scenarios**:

1. **Given** a grammar rule with a top-level choice of different structures, **When** codegen runs, **Then** the node is classified as a polymorph with one form per distinct structural variant.
2. **Given** polymorph forms that share identical field sets, **When** codegen runs, **Then** those forms are collapsed (merging content types, preserving original rule shapes for template generation) while forms with unique discriminant tokens remain separate.
3. **Given** a polymorph node, **When** the factories emitter runs, **Then** each form gets its own factory function with form-specific parameters.
4. **Given** a polymorph node, **When** the templates emitter runs, **Then** each form gets its own render template.

---

### User Story 5 - Optimizations preserve output correctness (Priority: P3)

A developer relying on the Optimize phase to restructure choice branches can trust that no information affecting the final output is discarded. Factoring common prefixes/suffixes, deduplicating variants, and collapsing forms all preserve the data needed for correct emission.

**Why this priority**: Lossy optimization produces subtly wrong output that is difficult to diagnose. Non-lossy transformations are a correctness invariant for the entire pipeline.

**Independent Test**: For a representative set of rules, compare emitted output from optimized vs. unoptimized paths and verify functional equivalence.

**Acceptance Scenarios**:

1. **Given** a choice with branches sharing common prefix tokens, **When** the prefix is factored out, **Then** the resulting templates still produce the same rendered output for all input configurations.
2. **Given** polymorph forms collapsed due to identical field sets, **When** the collapsed form's preserved rules are examined, **Then** all original rule shapes are retained for the template emitter.
3. **Given** the Optimize phase, **When** it restructures structural grouping, **Then** it never modifies string values, pattern values, field names or provenance, clause content, enum values, supertype subtypes, group content, or structural whitespace directives.

---

### Edge Cases

- What happens when a hidden rule references itself (cycle detection)?
- How does the pipeline handle a grammar rule that simplifies to an empty sequence after stripping anonymous tokens?
- What happens when a hidden choice of symbols has 2-4 parent references (below the 5+ supertype promotion threshold but above the 1-parent inline threshold)?
- How does Evaluate handle malformed grammar.js files that throw during DSL execution?
- What happens when overrides reference a field or external token that doesn't exist in the grammar?
- How does Assemble classify a visible rule whose simplified form is a single non-alphanumeric string (token model type)?
- What happens when two polymorph forms produce identical discriminant tokens?
- How does the pipeline handle a grammar with zero visible named rules (all hidden)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Pipeline MUST process grammars through five sequential phases (Evaluate, Link, Optimize, Assemble, Emit), where each phase is a stateless pure function with a well-defined input/output contract.
- **FR-002**: Evaluate MUST accept both grammar.js (DSL execution) and grammar.json (normalization) as input and produce a grammar contract with rules, metadata (extras, externals, supertypes, inline list, conflicts, word rule), and a reference graph.
- **FR-003**: Evaluate MUST capture reference relationships (parent-to-child, field name, optionality, repeatedness) during DSL execution and detect structural patterns (enum from choice-of-strings, separator from repeat-of-seq).
- **FR-004**: Link MUST resolve all symbol, alias, token, and repeat1 references — none may survive into Link output. Hidden rules MUST be classified as supertype, enum, group, or inlined based on content pattern and usage frequency.
- **FR-005**: Link MUST enrich field nodes with provenance metadata (source, nameFrom) without adding derived metadata (required, multiple, contentTypes) that belongs in Assemble.
- **FR-006**: Link MUST detect clauses (optional groups of tokens and fields), resolve external tokens to structural whitespace directives via override configuration, and normalize redundant repeat patterns.
- **FR-007**: Link MUST use node-types.json for validation only, not as a primary data source. All structural information MUST be derivable from the rule tree.
- **FR-008**: Optimize MUST restructure structural grouping (seq, choice, optional, repeat) while preserving all named content (string values, pattern values, field metadata, clause/enum/supertype/group content, whitespace directives) unchanged.
- **FR-009**: Optimize MUST wrap choice branches in variant nodes and support deduplication of structurally identical variants without discarding distinct content.
- **FR-010**: Assemble MUST be the first and only phase that creates nodes. All field metadata (required, multiple, contentTypes, detectToken, modelType) MUST be derived from the rule tree context, not carried forward from earlier phases.
- **FR-011**: Assemble MUST classify every rule into exactly one of nine model types (branch, container, polymorph, leaf, keyword, token, enum, supertype, group) using structural simplification combined with visibility determination.
- **FR-012**: Assemble MUST collapse polymorph forms with identical field sets (when lacking unique discriminant tokens) while preserving original rule shapes for template generation.
- **FR-013**: Emit MUST produce all output files from the node map alone, without re-accessing grammar rules or intermediate representations. The from emitter MUST derive from factory signatures. The ir emitter MUST derive from factory exports.
- **FR-014**: Pipeline MUST contain zero language-specific conditionals. All grammar-specific customization MUST flow through override configuration.
- **FR-015**: The shared Rule intermediate representation MUST be defined once and used unchanged across all phases, with rule type presence varying by phase as specified in the design document.
- **FR-016**: The reference graph MUST be enriched during Link with positional information and support derivations including inline confidence, field name inference, supertype candidate detection, dead rule detection, and cycle detection.
- **FR-017**: All module-level mutable state from the current implementation (grammar caches, path caches, regex caches, external role maps) MUST be eliminated and replaced with function parameters.

### Key Entities

- **Rule**: Shared intermediate representation — a discriminated union of structural grouping types, named patterns, terminals, structural whitespace, and references. One definition, used across all phases. Rule type presence varies by phase (e.g., references present only before Link, variants only after Optimize).
- **Grammar Contracts (Raw, Linked, Optimized)**: Phase output contracts. Each contains `rules: Record<string, Rule>` plus phase-specific metadata. No nodes until Assemble.
- **NodeMap**: Assemble output. Contains assembled nodes classified by model type, computed signatures for kind collapse, and projection context. First and only place nodes appear.
- **AssembledNode**: Discriminated union of nine model types (branch, container, polymorph, leaf, keyword, token, enum, supertype, group). Each describes a distinct structural pattern with emitter-relevant properties.
- **AssembledField**: Per-field metadata (name, required, multiple, contentTypes, provenance, projection). All metadata derived from rule tree context at Assemble time.
- **AssembledForm**: One structural variant of a polymorph — has its own fields, discriminant token, and optionally preserved merged rules for template generation.
- **SymbolRef**: Reference graph edge tracking parent-to-child relationships with field name, optionality, repeatedness, and positional context enriched during Link.

### Assumptions

- The current codegen output for Rust, TypeScript, and Python grammars serves as the correctness baseline. "Functionally equivalent" means the generated code produces the same behavior, though formatting or ordering may differ trivially.
- grammar.js evaluation uses a sandboxed DSL proxy, not arbitrary JS execution. Only the tree-sitter DSL functions (seq, choice, repeat, field, etc.) are supported.
- Hidden rules with 2-4 parent references fall into a gray zone — they are inlined by default but flagged as supertype promotion candidates for manual review.
- The override configuration format remains compatible with the current `overrides.json` structure.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All three supported grammars (Rust, TypeScript, Python) produce functionally equivalent output before and after the restructuring — zero behavioral regressions.
- **SC-002**: Each phase function is independently unit-testable with deterministic output — no global state setup or teardown required for any test.
- **SC-003**: Adding support for a new tree-sitter grammar requires zero changes to pipeline code — only grammar input and override configuration.
- **SC-004**: The pipeline contains zero language-specific conditionals across all compiler and emitter modules.
- **SC-005**: Every optimization in the pipeline is demonstrably non-lossy — emitted output is identical whether optimization is applied or skipped.
- **SC-006**: All module-level mutable state from the current implementation is eliminated — every phase accepts its dependencies as function parameters.
- **SC-007**: The total number of source files in the codegen pipeline decreases or remains stable, with scattered helper functions consolidated into phase-appropriate locations.
