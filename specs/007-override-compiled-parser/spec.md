# Feature Specification: Override-Compiled Parser with Nested-Alias Polymorphs

**Feature Branch**: `007-override-compiled-parser`
**Created**: 2026-04-15
**Status**: Draft
**Input**: Intent summary from clarify session — switch sittir's pipeline to consume override-compiled parse trees, fix bare keyword-prefix promotion, convert polymorphs to nested-alias form, delete Link's heuristic promotion passes.
**Depends on**: PR #9 (`006-override-dsl-enrich`) must merge first.

## User Scenarios & Testing

### User Story 1 — Parse tree carries all field labels natively (Priority: P1)

A grammar maintainer runs sittir codegen and the generated factories, types, and wrap functions reference fields that exist in the parse tree — not fields that sittir invented at compile time via heuristic inference. When a consumer parses source code with the override-compiled parser and calls readNode, every field the factory surface exposes is present in the parse tree without runtime promotion.

**Why this priority**: This is the core value proposition. It eliminates the double-promotion architecture (enrich → Link heuristic → wrap promotion) and makes the parse tree the single source of truth for field labels. Debugging "where did this field come from?" becomes trivial — it's in the grammar.

**Independent Test**: Parse a python snippet that exercises a transform-patched rule (e.g., `a if b else c` for `conditional_expression`). Confirm that the parse tree from the override-compiled parser has `body`, `condition`, `alternative` fields without any runtime promotion. Then confirm the generated factory's readNode path reads those fields directly.

**Acceptance Scenarios**:

1. **Given** an override-compiled parser loaded by the pipeline, **When** a source file is parsed, **Then** every field declared by transform()/enrich() patches in the override file appears as a named field in the parse tree nodes.
2. **Given** the override-compiled parser, **When** readNode wraps a parse tree node into NodeData, **Then** no heuristic field-promotion logic runs — all fields come directly from the parse tree's field bindings.
3. **Given** a rule where Link's `inferFieldNames` previously inferred a field that no override declares, **When** the maintainer runs codegen, **Then** the suggested-overrides output flags the missing field as "add this override to preserve coverage" — the field is NOT silently added.

---

### User Story 2 — Bare keyword-prefix promotion works without regression (Priority: P1)

A grammar maintainer wraps their base grammar in `enrich(base)` and the bare-keyword-prefix promotion pass (e.g., `seq('async', ...)` → `seq(field('async', 'async'), ...)`) applies correctly at the leading position of top-level seqs without causing round-trip fidelity regressions on any grammar.

**Why this priority**: This is a prerequisite for US1. Without bare keyword-prefix promotion working in enrich, fields that `inferFieldNames` currently adds heuristically for leading keywords would be absent from the override-compiled parser. Deleting `inferFieldNames` mutation before fixing this would regress field coverage.

**Independent Test**: Enable bare keyword-prefix promotion in enrich on all three grammars. Run the full fidelity suite. Confirm ceilings hold.

**Acceptance Scenarios**:

1. **Given** `enrich(base)` with the bare-keyword-prefix pass enabled, **When** a rule's top-level seq begins with an identifier-shaped string literal (e.g., `'async'`, `'pub'`, `'move'`), **Then** the literal is promoted to `field(kw, literal)` and the resulting factory exposes it as a named parameter.
2. **Given** a rule where the leading literal is NOT identifier-shaped (e.g., `'('`, `'::'`, `'+='`), **When** enrich runs, **Then** the literal is left as an anonymous token — no promotion.
3. **Given** the full fidelity suite for rust, typescript, and python, **When** enrich with bare-keyword-prefix is enabled, **Then** round-trip and factory-round-trip fail counts do not exceed their current ceilings.

---

### User Story 3 — Polymorphs expressed as nested aliases (Priority: P2)

A grammar maintainer converts a polymorphic rule (a visible choice whose alternatives have different field shapes) into a nested-alias form using transform() patches. Each alternative becomes an aliased named child nested inside the parent kind. The parse tree shows the parent kind at the outer level (preserving ast-grep rule compatibility) and the variant kind at the child level (enabling factory discrimination).

**Why this priority**: With the override-compiled parser carrying field labels natively, polymorph detection shifts from a Link-time heuristic to a grammar-time declaration. Expressing polymorphs in the override file makes them visible to grammar maintainers and auditable.

**Independent Test**: Convert one polymorph rule (e.g., rust's `use_declaration` or python's `import_statement`) to nested-alias form. Parse a sample file. Confirm the parse tree has the parent kind at the outer level and the variant kind at the child level. Confirm existing ast-grep rules matching the parent kind still match.

**Acceptance Scenarios**:

1. **Given** a polymorphic rule converted to nested-alias form via `transform(original, { '0': alias($.variant_a), '1': alias($.variant_b) })`, **When** the source is parsed, **Then** the parse tree node has `type` equal to the parent kind name (e.g., `'assignment_expression'`) and a single child whose `type` is the variant name (e.g., `'simple_assignment'`).
2. **Given** an existing ast-grep rule that matches on the parent kind name, **When** the rule is executed against source parsed by the override-compiled parser, **Then** the rule still matches — the parent kind is preserved.
3. **Given** the factory for the polymorphic kind, **When** a consumer calls the factory, **Then** variant discrimination uses the child node's type instead of `_inferBranch` field-set heuristics.

---

### User Story 4 — Lazy parser compilation with cache (Priority: P2)

A grammar maintainer runs `pnpm sittir codegen --grammar python` and the pipeline automatically compiles the override grammar to a native parser on first use, caching the result. Subsequent runs reuse the cached parser unless overrides.ts has changed.

**Why this priority**: The override-compiled parser is useless if maintainers have to manually compile it. Lazy compilation with mtime-based cache invalidation makes the feature transparent.

**Independent Test**: Run codegen twice in a row. First run should compile the parser (~5-10s). Second run should reuse the cache (sub-second). Then touch overrides.ts and run again — should recompile.

**Acceptance Scenarios**:

1. **Given** no cached parser exists for a grammar, **When** codegen runs, **Then** the pipeline compiles the override grammar to a native parser before proceeding.
2. **Given** a cached parser whose mtime is newer than `overrides.ts`, **When** codegen runs, **Then** the cached parser is reused without recompilation.
3. **Given** a cached parser whose mtime is older than `overrides.ts`, **When** codegen runs, **Then** the parser is recompiled from the updated overrides.

---

### User Story 5 — Link's heuristic promotion passes deleted (Priority: P3)

After US1-US4 ship, the grammar maintainer can verify that Link no longer performs `inferFieldNames` mutation or `promotePolymorph` detection — those passes are either deleted or reduced to suggestion-only mode. The pipeline is simpler, and the generated output is fully determined by the override file + enrich passes, not by hidden compiler heuristics.

**Why this priority**: This is the cleanup payoff. It can only land after the override-compiled parser (US1), keyword promotion (US2), and polymorph restructuring (US3) are all in place. It's the final step, not the first.

**Independent Test**: Delete `inferFieldNames` mutation and `promotePolymorph` from Link. Run the full fidelity suite. All ceilings hold because the override-compiled parser and the restructured overrides carry all the information those passes used to infer.

**Acceptance Scenarios**:

1. **Given** the `inferFieldNames` mutation is deleted from Link, **When** codegen runs, **Then** all fidelity ceilings hold — no field coverage regression.
2. **Given** `promotePolymorph` is deleted from Link, **When** codegen runs for a grammar with polymorph rules (e.g., rust), **Then** factories still generate variant-aware code using the nested-alias structure from the override-compiled parse tree.
3. **Given** the `collectRepeatedShapes` pass remains as suggestion-only, **When** codegen runs, **Then** the `suggested-overrides.ts` output still includes repeated-shape suggestions for the maintainer.
4. **Given** the `inferFieldNames` analysis remains as suggestion-only, **When** codegen runs, **Then** `suggested-overrides.ts` still flags fields the maintainer could declare explicitly.

---

### Edge Cases

- **Grammar with no overrides.ts**: Pipeline should fall back to the base parser. No override-compiled parser to build. Field coverage matches what the base grammar declares.
- **Overrides.ts that doesn't call `enrich(base)`**: The override-compiled parser still has the transform-patched fields but NOT the enrich-added fields. Field coverage is lower than with enrich but still correct for what was declared.
- **Parser compilation failure**: If `tree-sitter build` fails (e.g., missing C compiler, broken override), the pipeline should surface a clear error with the build output attached — not silently fall back to the base parser (that would hide the problem).
- **Cross-platform parser cache**: `.so` on Linux, `.dylib` on macOS. The cache key must include the platform so a macOS-built parser isn't reused on a Linux CI runner.
- **Polymorph rule with >2 alternatives**: Some polymorphs have 3+ shapes (e.g., rust's `use_declaration`). The nested-alias approach should handle N alternatives, not just 2.
- **Aliased variant name collisions**: If two polymorphs alias to variants with the same name (e.g., both have a `simple` variant), the variant names must be grammar-globally unique or scoped to the parent kind.

## Requirements

### Functional Requirements

#### Override-compiled parser integration

- **FR-001**: The pipeline MUST load and use the override-compiled parser (compiled from the bundled `.sittir/grammar.js`) instead of the base grammar's parser for all parse operations.
- **FR-002**: Parser compilation MUST happen lazily on first codegen use, with mtime-based caching. Recompilation MUST occur when `overrides.ts` is newer than the cached parser artifact.
- **FR-003**: The cached parser artifact MUST be platform-specific (different binaries for different OS/arch combinations) and gitignored.
- **FR-004**: If parser compilation fails, the pipeline MUST surface the error with full build output — no silent fallback to the base parser.

#### Bare keyword-prefix promotion

- **FR-005**: `enrich(base)` MUST include a bare-keyword-prefix promotion pass that wraps identifier-shaped string literals at the leading position of a top-level seq as named fields.
- **FR-006**: The pass MUST be collision-aware — skip promotion when another field on the same rule already has that name.
- **FR-007**: The pass MUST NOT promote non-identifier-shaped literals (punctuation, operators, delimiters).
- **FR-008**: After enabling this pass, the three currently-supported grammars (rust, typescript, python) MUST continue to pass their existing fidelity ceilings.

#### Nested-alias polymorphs

- **FR-009**: Polymorphic rules (visible choices with heterogeneous alternative shapes) MUST be expressible as nested aliases via transform() patches in override files.
- **FR-010**: The nested-alias form MUST preserve the parent kind name in the parse tree's outer node so existing ast-grep rules matching on that kind still work.
- **FR-011**: The variant kind name MUST appear as a child node's type, enabling factory discrimination without heuristic `_inferBranch` field-set analysis.
- **FR-012**: The nested-alias form MUST support N alternatives (not limited to 2).
- **FR-013**: Variant names MUST be globally unique across the grammar or scoped to their parent kind — no ambiguous discrimination.

#### Link pass cleanup

- **FR-014**: `inferFieldNames` mutation (the `applyInferredFields` call site that mutates rules) MUST be deleted. The analysis MUST be preserved as suggestion-only output in `suggested-overrides.ts`.
- **FR-015**: `promotePolymorph` MUST be deleted once all polymorph rules across the three grammars are expressed as nested aliases in their override files.
- **FR-016**: `collectRepeatedShapes` MUST be preserved as-is (suggestion-only, non-mutating).
- **FR-017**: After Link cleanup, the three grammars MUST continue to pass their fidelity ceilings.

#### wrap.ts / readNode cleanup

- **FR-018**: Field-promotion heuristics in wrap.ts and readNode MUST be deleted once the override-compiled parser is the source of truth. readNode MUST read fields directly from the parse tree without inferring or promoting unnamed children.

### Key Entities

- **Override-Compiled Parser**: a native shared library (`.so`/`.dylib`) compiled from the bundled `.sittir/grammar.js` via `tree-sitter generate` + `tree-sitter build`. Loaded by ast-grep as the language binding for parsing.
- **Parser Cache**: platform-specific cached parser artifact in `.sittir/`, invalidated by `overrides.ts` mtime comparison.
- **Nested-Alias Polymorph**: a polymorphic rule where each choice alternative is wrapped in `alias($.variant_name)` via transform(), producing a named variant child node nested inside the parent kind node in the parse tree.
- **Suggested Override**: an entry in `suggested-overrides.ts` generated from `inferFieldNames` analysis or `collectRepeatedShapes` — a "here's what you could declare" surface that maintainers review and optionally adopt into their override files.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A grammar maintainer can determine every field on every factory by reading the override file and the enrich pass output alone — no hidden compiler heuristics contribute fields to the generated API surface.
- **SC-002**: The override-compiled parser produces parse trees with at least as many named fields as the current heuristic-promoted pipeline — field coverage does not regress.
- **SC-003**: Existing ast-grep rules written against the current grammar kind names continue to match after the polymorph restructuring — zero ast-grep rule breakage.
- **SC-004**: Codegen with a warm parser cache adds less than 1 second of overhead compared to the pre-feature baseline.
- **SC-005**: The first codegen run (cold cache, parser compilation) completes within 30 seconds per grammar including the compilation step.
- **SC-006**: After Link cleanup, the total line count of `link.ts` decreases by at least 200 lines (the deleted heuristic passes).
- **SC-007**: After wrap.ts cleanup, the total line count of wrap.ts promotion-related code decreases measurably.

## Assumptions

- PR #9 (`006-override-dsl-enrich`) merges before implementation begins. The DSL infrastructure (enrich, transform path addressing, role accumulator, transpile bridge, RuntimeRule type) is in place.
- ast-grep can load a custom-compiled parser `.so`/`.dylib` as a language binding without modification to ast-grep itself. The `@ast-grep/napi` API supports this via its language-loading mechanism.
- The bare keyword-prefix regression from spec 006 (99 on rust, 58 on python) is caused by the pass being too aggressive (wrapping every identifier-shaped string everywhere), not by a fundamental incompatibility between field-wrapped string literals and the downstream pipeline. A conservative variant (leading position only) is expected to pass fidelity.
- Polymorph rules are a manageable count across the three grammars (estimated <20 per grammar based on prior analysis). The manual override-authoring effort to convert them to nested-alias form is bounded.
- `tree-sitter build` produces a stable ABI-compatible `.so`/`.dylib` that ast-grep can load. ABI compatibility is governed by tree-sitter's documented ABI version.
- The mtime-based cache invalidation is sufficient for development workflows. CI runs always build fresh (gitignored artifacts aren't available cross-runner).

## Out of Scope

- Switching from ast-grep to `node-tree-sitter` or `web-tree-sitter`. ast-grep remains the parsing runtime.
- Distributing pre-compiled parser binaries in npm packages. Parsers are compiled locally per-platform.
- Auto-generating polymorph alias overrides from Link's current detection. Maintainers author them by hand (with the help of `suggested-overrides.ts` output).
- Changes to the `RuntimeRule` type system (completed in spec 006).
- CI workflow for `tree-sitter generate` validation gate (deferred from spec 006; can be added alongside this feature but is not a requirement).
