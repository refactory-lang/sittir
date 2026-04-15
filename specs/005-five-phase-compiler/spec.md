# Feature Specification: Five-Phase Grammar Compiler

**Feature Branch**: `005-five-phase-compiler`
**Created**: 2026-04-11
**Status**: Draft
**Input**: Restructure the codegen pipeline into a five-phase compiler with well-defined contracts: Evaluate, Link, Optimize, Assemble, Emit. Reference design: `specs/sittir-grammar-compiler-spec.md`

## Design Decisions

Resolved during intent clarification:

- **grammar.js only** — grammar.js is the sole input format. No grammar.json normalization path. grammar.js replaces grammar.json from the outset.
- **Big bang rewrite** — single branch, full replacement. No incremental migration, no parallel pipeline.
- **Overrides as grammar extensions** — overrides use tree-sitter's native `grammar(base, { rules })` extension mechanism. Each rule function receives `($, original)` where `original` is the base grammar's definition of that rule. New DSL primitives (`transform`, `insert`, `replace`) operate on the `original` rule for surgical sub-rule modifications. No custom two-pass system needed — tree-sitter's `grammar()` already merges base + extension rules. Provenance tracked as `source: 'override'`.
- **Override addressing** — hybrid: numeric positional index or field name when traversing through a named field. Override authors address locations within rules, not whole rules.
- **Insert vs replace semantics** — insert adds structure the grammar can't express (field wrappers, role annotations). Grammar content is always preserved. Replace substitutes a different Rule subtree; suppress is a replace with nothing.
- **Overrides processed at Evaluate time** — not Link. Evaluate executes the overrides.ts grammar extension (which imports the base grammar.js), producing a single merged grammar object. Link receives rules already annotated with override provenance. This changes the design doc: `promoteFields()` and override-related functions move out of Link.
- **Reference graph derivations** — core derivations (inline confidence, supertype promotion, dead rules, cycles) are active and shape pipeline output. New derivations (field name inference, synthetic supertypes, override inference, naming consistency, global optionality, separator consistency, override candidate quality) are diagnostic only — they generate a suggested overrides file but do not auto-apply.
- **Suggested overrides** — a grammar extension file (`overrides.suggested.ts`) in the same format as manual overrides. Generated each run, skipping entries already present in `overrides.ts`. Inert until the developer promotes entries. Per-entry metadata (derivation source, confidence) in comments.
- **Baseline validation** — golden file snapshots of current output for investigation (diffing); existing e2e validation tests as the correctness contract.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run codegen for any supported grammar (Priority: P1)

A developer points the codegen CLI at a tree-sitter grammar.js file and receives correct, complete output files. The pipeline processes the grammar through five sequential phases and produces output functionally equivalent to the current codegen for all supported grammars (Rust, TypeScript, Python).

**Why this priority**: This is the core value proposition. If the restructured pipeline doesn't produce correct output for existing grammars, everything else is moot.

**Independent Test**: Run codegen against all three supported grammars and diff the output against golden file snapshots. Verify e2e validation tests pass.

**Acceptance Scenarios**:

1. **Given** a Rust grammar.js and overrides.ts, **When** the developer runs codegen with `--all`, **Then** all output files (types.ts, factories.ts, templates.yaml, from.ts, ir.ts, consts.ts, wrap.ts, utils.ts, joinby.ts, index.ts) are generated and e2e validation tests pass.
2. **Given** a TypeScript grammar.js and overrides.ts, **When** the developer runs codegen, **Then** all output files are generated and e2e validation tests pass.
3. **Given** a Python grammar.js and overrides.ts, **When** the developer runs codegen, **Then** all output files are generated and e2e validation tests pass.
4. **Given** golden file snapshots from the current pipeline, **When** the new pipeline output is diffed against them, **Then** differences are explainable and do not represent behavioral regressions.

---

### User Story 2 - Inspect and test each phase independently (Priority: P2)

A developer debugging a codegen issue can invoke each phase as a standalone function, inspect its output, and write unit tests against it. Each phase is stateless — given the same input, it always produces the same output. No global setup, no hidden caches, no order-dependent initialization.

**Why this priority**: Stateless phases with clear contracts are the architectural differentiator. They make the pipeline testable, debuggable, and maintainable — the primary motivation for the refactoring.

**Independent Test**: Call each phase function directly in a unit test with known input. Assert the output structure matches the phase contract. Verify no global state is read or mutated.

**Acceptance Scenarios**:

1. **Given** a grammar.js path, **When** the developer calls the Evaluate phase, **Then** a grammar contract is returned containing rules (with overrides applied via two-pass evaluation), metadata, and a reference graph — with no global state mutation.
2. **Given** an evaluated grammar, **When** the developer calls the Link phase, **Then** a linked grammar is returned with all references resolved, hidden rules classified, and field provenance annotated — with no unresolved reference types remaining and no override processing (already done in Evaluate).
3. **Given** a linked grammar, **When** the developer calls the Optimize phase, **Then** an optimized grammar is returned with choice branches wrapped as variants and structural grouping restructured — without modifying any named content.
4. **Given** an optimized grammar, **When** the developer calls the Assemble phase, **Then** a node map is returned with every rule classified into the correct model type and all field metadata derived from the rule tree context.
5. **Given** a node map, **When** the developer calls any emitter, **Then** the emitter produces correct output without access to the original grammar or rule trees.

---

### User Story 3 - Add a new grammar without pipeline changes (Priority: P2)

A developer adding support for a new tree-sitter grammar provides only a grammar.js file and an overrides.ts grammar extension. The pipeline processes the new grammar without any code changes. All language-specific behavior is driven by the overrides extension, not hardcoded conditionals.

**Why this priority**: Grammar-agnostic design ensures the pipeline scales to new grammars without maintenance burden. It also prevents the accumulation of language-specific special cases.

**Independent Test**: Add a previously unsupported grammar (e.g., Go, Java, or C) with appropriate overrides.ts and verify the pipeline produces valid output without any pipeline code modifications.

**Acceptance Scenarios**:

1. **Given** a new grammar with external tokens for indentation, **When** the developer maps externals to roles in overrides.ts using the grammar extension DSL, **Then** the Evaluate phase resolves those symbols with role annotations.
2. **Given** a new grammar where unnamed children should be promoted to named fields, **When** the developer adds `transform()` entries in overrides.ts, **Then** the Evaluate phase wraps children in field nodes with `source: 'override'` provenance.
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

### User Story 6 - Pipeline suggests overrides from reference graph analysis (Priority: P3)

A developer setting up a new grammar receives a generated `overrides.suggested.ts` file containing inferred field names, supertype candidates, and other override suggestions derived from the reference graph. Each suggestion includes the derivation source, confidence level, and is expressed as a grammar extension entry ready to be promoted into `overrides.ts`.

**Why this priority**: Reduces the manual effort of authoring overrides for new grammars. The suggestions accelerate onboarding without forcing auto-application.

**Independent Test**: Run codegen on a grammar with no overrides. Verify `overrides.suggested.ts` is generated with at least field name inference and supertype candidate entries. Verify it is a valid grammar extension that can be loaded.

**Acceptance Scenarios**:

1. **Given** a grammar where a symbol appears as `field('body')` in 5 out of 6 parent rules, **When** codegen runs, **Then** `overrides.suggested.ts` contains a `transform()` entry for the 6th parent wrapping that symbol in `field('body')`, with a comment noting the derivation source and confidence.
2. **Given** a hidden choice-of-symbols referenced by 7+ parents, **When** codegen runs, **Then** `overrides.suggested.ts` contains a supertype promotion suggestion.
3. **Given** entries in `overrides.suggested.ts` that the developer has already promoted to `overrides.ts`, **When** codegen runs again, **Then** those entries are omitted from the suggested file.
4. **Given** `overrides.suggested.ts`, **When** the developer imports it as a grammar extension layer, **Then** the pipeline processes it identically to manual overrides.

---

### Edge Cases

- What happens when a hidden rule references itself (cycle detection)?
- How does the pipeline handle a grammar rule that simplifies to an empty sequence after stripping anonymous tokens?
- What happens when a hidden choice of symbols has 2-4 parent references (below the 5+ supertype promotion threshold but above the 1-parent inline threshold)?
- How does Evaluate handle malformed grammar.js files that throw during DSL execution?
- What happens when overrides.ts references a position that doesn't exist in the base grammar (e.g., index out of bounds)?
- What happens when a `transform()` conflicts with another `transform()` at the same position?
- How does Assemble classify a visible rule whose simplified form is a single non-alphanumeric string (token model type)?
- What happens when two polymorph forms produce identical discriminant tokens?
- How does the pipeline handle a grammar with zero visible named rules (all hidden)?
- What happens when `overrides.suggested.ts` suggests an entry that conflicts with an existing manual override?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Pipeline MUST process grammars through five sequential phases (Evaluate, Link, Optimize, Assemble, Emit), where each phase is a stateless pure function with a well-defined input/output contract.
- **FR-002**: Evaluate MUST accept grammar.js as the sole input format, executing the tree-sitter DSL via a `$` proxy to build the rule tree. No grammar.json normalization path.
- **FR-003**: Evaluate MUST capture reference relationships (parent-to-child, field name, optionality, repeatedness) during DSL execution and detect structural patterns (enum from choice-of-strings, separator from repeat-of-seq).
- **FR-004**: Evaluate MUST process overrides as grammar extensions using tree-sitter's native `grammar(base, { rules })` mechanism. Each extension rule function receives `($, original)` where `original` is the base rule. New DSL primitives (`transform`, `insert`, `replace`) operate on the `original` rule for sub-rule modifications. Tree-sitter's `grammar()` handles the merge — no custom two-pass system needed.
- **FR-005**: Override addressing MUST support hybrid keys: numeric positional index for unnamed positions, field name when traversing through a named field node. `insert` adds structure (field wrappers, role annotations) while preserving grammar content. `replace` substitutes a Rule subtree; suppress is a replace with no content.
- **FR-006**: All override-derived rules MUST carry `source: 'override'` provenance, distinguishing them from grammar-derived content throughout the pipeline.
- **FR-007**: Link MUST resolve all symbol, alias, token, and repeat1 references — none may survive into Link output. Hidden rules MUST be classified as supertype, enum, group, or inlined based on content pattern and usage frequency.
- **FR-008**: Link MUST enrich field nodes with provenance metadata (source, nameFrom) without adding derived metadata (required, multiple, contentTypes) that belongs in Assemble. Link MUST NOT process overrides — they are already applied by Evaluate.
- **FR-009**: Link MUST detect clauses (optional groups of tokens and fields), resolve external tokens to structural whitespace directives, and normalize redundant repeat patterns.
- **FR-010**: Link MUST use node-types.json for validation only, not as a primary data source. All structural information MUST be derivable from the rule tree.
- **FR-011**: Optimize MUST restructure structural grouping (seq, choice, optional, repeat) while preserving all named content (string values, pattern values, field metadata, clause/enum/supertype/group content, whitespace directives) unchanged.
- **FR-012**: Optimize MUST wrap choice branches in variant nodes and support deduplication of structurally identical variants without discarding distinct content.
- **FR-013**: Assemble MUST be the first and only phase that creates nodes. All field metadata (required, multiple, contentTypes, detectToken, modelType) MUST be derived from the rule tree context, not carried forward from earlier phases.
- **FR-014**: Assemble MUST classify every rule into exactly one of nine model types (branch, container, polymorph, leaf, keyword, token, enum, supertype, group) using structural simplification combined with visibility determination.
- **FR-015**: Assemble MUST collapse polymorph forms with identical field sets (when lacking unique discriminant tokens) while preserving original rule shapes for template generation.
- **FR-016**: Emit MUST produce all output files from the node map alone, without re-accessing grammar rules or intermediate representations. The from emitter MUST derive from factory signatures. The ir emitter MUST derive from factory exports.
- **FR-017**: Pipeline MUST contain zero language-specific conditionals. All grammar-specific customization MUST flow through the overrides grammar extension.
- **FR-018**: The shared Rule intermediate representation MUST be defined once and used unchanged across all phases, with rule type presence varying by phase as specified in the design document.
- **FR-019**: The reference graph MUST be enriched during Link with positional information and support core derivations (inline confidence, supertype promotion, dead rule detection, cycle detection) that actively shape pipeline output.
- **FR-020**: The reference graph MUST support diagnostic derivations (field name inference, synthetic supertype detection, override inference, naming consistency, global optionality, separator consistency, override candidate quality) that produce entries in a suggested overrides file without auto-applying.
- **FR-021**: The pipeline MUST generate `overrides.suggested.ts` as a grammar extension file in the same format as manual overrides. Each entry MUST include a comment with derivation source and confidence. Entries already present in the manual `overrides.ts` MUST be omitted.
- **FR-022**: All module-level mutable state from the current implementation (grammar caches, path caches, regex caches, external role maps) MUST be eliminated and replaced with function parameters.

### Key Entities

- **Rule**: Shared intermediate representation — a discriminated union of structural grouping types, named patterns, terminals, structural whitespace, and references. One definition, used across all phases. Rule type presence varies by phase.
- **Grammar Contracts (Raw, Linked, Optimized)**: Phase output contracts. Each contains `rules: Record<string, Rule>` plus phase-specific metadata. No nodes until Assemble.
- **NodeMap**: Assemble output. Contains assembled nodes classified by model type, computed signatures for kind collapse, and projection context.
- **AssembledNode**: Discriminated union of nine model types (branch, container, polymorph, leaf, keyword, token, enum, supertype, group).
- **AssembledField**: Per-field metadata (name, required, multiple, contentTypes, provenance, projection). All derived from rule tree context at Assemble time.
- **AssembledForm**: One structural variant of a polymorph — has its own fields, discriminant token, and optionally preserved merged rules for template generation.
- **SymbolRef**: Reference graph edge tracking parent-to-child relationships with field name, optionality, repeatedness, and positional context enriched during Link.
- **Override Extension**: A grammar extension (`overrides.ts`) using the standard `grammar(base, { rules })` mechanism with `transform`/`insert`/`replace` DSL primitives for sub-rule modifications. Processed during Evaluate's second pass.
- **Suggested Overrides**: A generated grammar extension (`overrides.suggested.ts`) containing inferred override entries with derivation metadata. Same format as manual overrides. Inert until developer promotes entries.

### Assumptions

- The current codegen output for Rust, TypeScript, and Python grammars serves as the correctness baseline. "Functionally equivalent" means e2e validation tests pass; golden file diffs are for investigation, not as a pass/fail gate.
- grammar.js evaluation uses a sandboxed DSL proxy, not arbitrary JS execution. Only the tree-sitter DSL functions (seq, choice, repeat, field, etc.) plus new override primitives (transform, insert, replace) are supported.
- Hidden rules with 2-4 parent references fall into a gray zone — they are inlined by default but flagged as supertype promotion candidates in `overrides.suggested.ts`.
- Existing `overrides.json` files will need manual conversion to `overrides.ts` grammar extensions. No migration tooling is in scope.
- The CLI interface and generated package structure remain unchanged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: E2e validation tests pass for all three supported grammars (Rust, TypeScript, Python) on the new pipeline — zero behavioral regressions.
- **SC-002**: Each phase function is independently unit-testable with deterministic output — no global state setup or teardown required for any test.
- **SC-003**: Adding support for a new tree-sitter grammar requires zero changes to pipeline code — only a grammar.js file and overrides.ts grammar extension.
- **SC-004**: The pipeline contains zero language-specific conditionals across all compiler and emitter modules.
- **SC-005**: Every optimization in the pipeline is demonstrably non-lossy — emitted output is identical whether optimization is applied or skipped.
- **SC-006**: All module-level mutable state from the current implementation is eliminated — every phase accepts its dependencies as function parameters.
- **SC-007**: Overrides are expressed as grammar extensions using transform/insert/replace DSL primitives, processed during Evaluate's two-pass evaluation.
- **SC-008**: Running codegen on a grammar with no overrides produces a valid `overrides.suggested.ts` grammar extension file with derivation metadata.
