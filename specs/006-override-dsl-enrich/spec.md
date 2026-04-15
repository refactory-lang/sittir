# Feature Specification: Override DSL with enrich(base) and Tree-Sitter-Compatible Authoring

**Feature Branch**: `006-override-dsl-enrich`
**Created**: 2026-04-15
**Status**: Draft
**Input**: User description: "Override DSL with enrich(base) and tree-sitter-compatible authoring. Extend sittir's override system so overrides.ts is simultaneously (a) runnable by tree-sitter as a grammar extension file and (b) authorable in TypeScript with sittir-specific DSL extensions."

## User Scenarios & Testing

### User Story 1 — Author an override file that both tools understand (Priority: P1)

A grammar maintainer edits `packages/<lang>/overrides.ts` to add or refine field mappings for a tree-sitter grammar. They want the same file to be the single source of truth: sittir's codegen pipeline reads it to generate typed factories/templates, AND tree-sitter's own `tree-sitter generate` can consume it (possibly after a mechanical transpile step) to validate that the extended grammar still parses real code.

**Why this priority**: This is the forcing constraint the entire feature exists to resolve. Without it, the override file drifts from what tree-sitter actually accepts, and sittir-generated output can diverge from real parse trees silently.

**Independent Test**: Pick one grammar (rust), edit its overrides file to add a new field override, run the sittir pipeline, then run the tree-sitter toolchain against the same source. Both must succeed; the resulting grammar must parse a representative corpus without regression.

**Acceptance Scenarios**:

1. **Given** an `overrides.ts` file that uses sittir DSL calls (`transform`, `role`, `insert`, `replace`, `field`, `alias`) alongside standard tree-sitter DSL (`grammar`, `seq`, `choice`, etc.), **When** the maintainer runs sittir codegen, **Then** generation succeeds and produces factories/templates that reflect the overrides.
2. **Given** the same `overrides.ts` file, **When** the tree-sitter toolchain is run against it (directly or via a mechanical transpile that sittir provides), **Then** `tree-sitter generate` succeeds and the resulting parser parses the corpus without new errors.
3. **Given** a sittir-only DSL call used inside a tree-sitter DSL structure (e.g., `role('indent')` inline in `externals`), **When** tree-sitter evaluates the file, **Then** the call does not pollute the grammar's return value in a way that breaks tree-sitter's schema expectations.

---

### User Story 2 — Get mechanical auto-transformations without hand-writing them (Priority: P1)

A grammar maintainer wants common, unambiguous grammar improvements (promoting a literal keyword into a named field, wrapping a sole child of a given kind as a named field, collapsing `seq(X, repeat(X))` into `repeat1(X)`) applied automatically, without adding entries to `overrides.ts` by hand. They declare the intent once as `grammar(enrich(base), {...})` and the enrichment runs deterministically.

**Why this priority**: The same low-risk transformations are being re-derived by hand across grammars, and some of them currently live inside sittir's Link phase where they are invisible to anyone inspecting the override file. Moving them into a named, callable function makes the grammar authors' intent explicit and auditable.

**Independent Test**: Remove a hand-written override for a mechanical case (e.g., a keyword-prefix field promotion) from one grammar's `overrides.ts`, wrap the base grammar in `enrich(...)`, regenerate, and confirm the generated output is equivalent and the fidelity ceilings still hold.

**Acceptance Scenarios**:

1. **Given** a base tree-sitter grammar where a rule begins with a literal keyword (e.g., `seq('async', $.function_definition)`), **When** the grammar is passed through `enrich(base)`, **Then** the keyword is promoted into a named field using the keyword text, and downstream factories expose it as a named parameter.
2. **Given** a rule whose single child is an unambiguous kind reference (e.g., `seq('(', $.expression, ')')` with no naming collision), **When** `enrich(base)` runs, **Then** the reference is wrapped as a named field using the kind name as the field name.
3. **Given** a rule shaped `seq(X, repeat(X))`, **When** `enrich(base)` runs, **Then** it is normalized to `repeat1(X)` without changing parse semantics.
4. **Given** a case where auto-inference would require a threshold, frequency count, or heuristic judgment (e.g., "this name is used in >60% of similar rules"), **When** `enrich(base)` runs, **Then** it does NOT apply the transformation — those decisions remain hand-authoring territory.
5. **Given** sittir's existing Link-phase auto-inference passes, **When** this feature ships, **Then** the mechanical ones have moved out of Link and into `enrich`, and Link no longer performs them.

---

### User Story 3 — Call DSL primitives that have side-effects without breaking tree-sitter's schema (Priority: P2)

A grammar maintainer wants to annotate a symbol with sittir-specific metadata (e.g., `role('indent')` to mark an external token as a structural-whitespace role) and write that call inline where the symbol is defined, not in a sidecar configuration block.

**Why this priority**: Current pattern uses sentinel return values that require sittir-aware consumers to interpret. That pattern doesn't survive being read by tree-sitter, which expects the call to return a valid grammar rule. An accumulator-based approach lets the call record its metadata as a side-effect and return a tree-sitter-valid value.

**Independent Test**: Author an `overrides.ts` that uses `role('indent')` inline inside `externals`. Run sittir codegen and confirm the role metadata is captured. Run tree-sitter against the same file (after any mechanical transpile) and confirm it does not error on the call.

**Acceptance Scenarios**:

1. **Given** a `role(name)` call inside an `externals` or `rules` block, **When** sittir processes the file, **Then** the name is recorded in a per-grammar roles collection accessible to the Link phase.
2. **Given** nested `grammar(...)` calls (e.g., `grammar(enrich(base), {...})`), **When** the inner grammar's roles are being collected, **Then** its role accumulator does not leak into or corrupt the outer grammar's role state.
3. **Given** a `role(name)` call, **When** tree-sitter reads the same file, **Then** the call returns a value that tree-sitter accepts in context (does not throw or produce a malformed rule).

---

### User Story 4 — Patch deeper into a rule's structure without rewriting it (Priority: P2)

A grammar maintainer needs to add a field override inside a specific branch of a `choice`, or at a nested position inside a `seq`-within-`seq`, without replacing the whole rule. They want a path-addressed or indexed syntax that points at the exact position.

**Why this priority**: Current `transform` API only supports flat positional patches. Several real-world overrides require reaching into nested structures, and maintainers are currently forced to rewrite entire rules when a targeted patch would be safer.

**Independent Test**: Pick a rule with nested structure where the existing override rewrote the whole rule unnecessarily. Replace it with a targeted patch using the new syntax. Confirm the generated output is equivalent and the fidelity ceilings still hold.

**Acceptance Scenarios**:

1. **Given** a rule with a `choice($.a, seq('(', $.b, ')'))`, **When** the maintainer writes a patch targeting the `$.b` inside the second choice branch, **Then** only that position is modified and the first branch is untouched.
2. **Given** a rule with a `seq` containing another `seq`, **When** the maintainer uses path-addressed syntax (e.g., `'0/1/2'`) to reach a deep position, **Then** the patch applies at exactly that position.
3. **Given** a patch that applies to multiple branches of a `choice`, **When** a wildcard is used in the index, **Then** the patch applies to every matching branch.
4. **Given** a call `alias($.name)` with only one argument, **When** evaluated, **Then** it is treated as shorthand for `alias($.name, $.name)` (the common case where the alias name matches the target symbol).

---

### User Story 6 — Extend top-level grammar arrays (supertypes, externals, extras, word) (Priority: P2)

A grammar maintainer needs the override file to contribute additional entries to the base grammar's top-level arrays — adding a new supertype, declaring an extra external token, adding a comment form to `extras`, or swapping the `word` rule. They want to write just the additions, not restate what the base grammar already provides.

**Why this priority**: Several planned overrides need externals (for the role-accumulator pattern in US3) and extras (for grammar-specific comment forms). Without an explicit merge rule, each maintainer would invent their own convention and the behavior would drift per grammar.

**Independent Test**: Add a new external token to one grammar's override file without restating the base grammar's existing externals. Regenerate. Confirm the new token is present and the base's entries are still there.

**Acceptance Scenarios**:

1. **Given** an override file that declares `externals: [$.my_new_token]` on a base grammar that already has externals, **When** sittir processes the file, **Then** the effective externals list contains both the base's entries and `my_new_token`, in base-first order, with identity duplicates removed.
2. **Given** an override file that declares `extras: [$.line_comment]` where the base already has `extras: [/\s/]`, **When** sittir processes the file, **Then** the effective extras list is `[/\s/, $.line_comment]`.
3. **Given** an override file that declares `word: $.my_identifier`, **When** sittir processes the file, **Then** the effective `word` is `$.my_identifier` (replacement, not merge — `word` is a scalar).
4. **Given** an override file that declares `supertypes: [$.my_supertype]`, **When** sittir processes the file, **Then** the effective supertypes list includes both the base's entries and `$.my_supertype`.

---

### User Story 5 — Pre-evaluate transforms so the post-transform grammar is readable by both tools (Priority: P3)

A maintainer wants guarantees that after all `transform` / `enrich` / effect calls have been processed, the resulting grammar object is something tree-sitter would accept as a valid grammar extension — not a sittir-only intermediate representation.

**Why this priority**: Enables running tree-sitter against the post-transform output as a CI check. Lower priority because it is an end-to-end validation concern that only pays off once the earlier stories are in place.

**Independent Test**: After sittir processes an `overrides.ts`, serialize the post-transform grammar, feed it to tree-sitter's own parser generator, and confirm it builds.

**Acceptance Scenarios**:

1. **Given** a sittir pipeline run against `overrides.ts`, **When** the pre-evaluate phase completes, **Then** the resulting grammar object contains only tree-sitter-native constructs (sittir metadata has been stripped or moved to sidecar fields that tree-sitter ignores).
2. **Given** that grammar object, **When** tree-sitter's parser generator consumes it, **Then** it produces a working parser without errors.
3. **Given** CI runs the tree-sitter generate step against every supported grammar's post-transform output, **When** any grammar fails, **Then** CI blocks the change.

---

### Edge Cases

- **Name collisions during enrich**: What happens when keyword-prefix promotion or kind-to-name wrapping would introduce a field name that collides with an existing field on the same rule? Assumption: enrich skips the transformation (mechanical-only means no judgment calls — ambiguity is a disqualifier).
- **Role call outside any grammar scope**: What happens if `role()` is called at module top-level, not inside a grammar block? Assumption: the call is an error (no accumulator to push into).
- **Nested grammar() calls with overlapping role state**: Must use save/restore so the inner grammar's roles are isolated from the outer.
- **Transform path out of bounds**: A path like `'0/5/2'` where position 5 doesn't exist at the second level. Assumption: hard error at transform-evaluation time with a specific message naming the path and the actual shape.
- **Maintainer forgets to wrap the base in `enrich()`**: The pipeline runs, but fewer transformations are applied. Assumption: this is valid; `enrich` is opt-in, not mandatory. Existing override files continue to work unchanged.
- **Tree-sitter rejects the post-transform grammar**: CI must surface this as a grammar-authoring error with enough context (which transform step ran last, what the rule looked like before and after) to diagnose.
- **Fidelity ceiling regression**: Any move of an existing Link pass into enrich must not raise the round-trip or factory-round-trip fail counts for rust/typescript/python beyond their current ceilings.

## Requirements

### Functional Requirements

#### Authoring surface

- **FR-001**: The override authoring surface MUST accept a file that simultaneously contains tree-sitter grammar DSL and sittir DSL extensions without requiring two separate files.
- **FR-002**: The override file MUST be consumable by tree-sitter's own toolchain, either directly or via a mechanical transformation step that sittir provides and documents.
- **FR-003**: Sittir DSL extensions used in override files MUST be explicitly imported from the sittir package (no global injection); the import must work in whatever module system the authoring environment uses.

#### enrich(base)

- **FR-004**: The system MUST provide a function that accepts a base grammar and returns an enriched grammar with mechanical-only transformations applied.
- **FR-005**: Enrichment MUST include keyword-prefix field promotion: when a rule begins with a literal keyword, the keyword becomes a named field using the keyword text as the field name.
- **FR-006**: Enrichment MUST include unambiguous kind-to-name field wrapping: when a rule references a single kind with no naming collision, the reference is wrapped as a named field using the kind name.
- **FR-007**: Enrichment MUST include repeat normalization: `seq(X, repeat(X))` is rewritten to `repeat1(X)`.
- **FR-008**: Enrichment MUST NOT apply any heuristic, frequency-based, or threshold-based transformation. Such transformations remain the maintainer's responsibility.
- **FR-009**: Enrichment MUST be pure: calling it twice with the same input produces the same output, and it does not mutate the input grammar.
- **FR-010**: Enrichment MUST be opt-in: override files that do not invoke it continue to work unchanged.
- **FR-010a**: When a mechanical enrichment pass cannot apply because of a naming collision or other disqualifying condition, enrichment MUST report the skip to stderr during codegen. Each report MUST include the rule name, the pass that was skipped, and a human-readable reason. Enrichment MUST NOT fail the build on skip — it is a notification, not an error.

#### Effect accumulators

- **FR-011**: The system MUST provide a `role` primitive that records a role name as a side-effect rather than returning a sentinel value.
- **FR-012**: Role recording MUST be scoped per grammar invocation: nested `grammar(...)` calls MUST NOT leak role state across boundaries.
- **FR-013**: Role calls MUST return a value that tree-sitter accepts in the position where they are called, so the same file is valid for both tools.
- **FR-014**: Recorded roles MUST be accessible to sittir's Link phase for downstream processing.

#### Transform API

- **FR-015**: The transform API MUST support targeting positions inside nested structures, not only flat positional indexes.
- **FR-016**: The transform API MUST support path-addressed positions expressed as a navigable sequence (e.g., `'0/0/0'`).
- **FR-017**: The transform API MUST support wildcards in position addressing so a single patch can apply to multiple matching branches.
- **FR-018**: The transform API MUST support a single-argument shorthand for alias when the alias name matches the target symbol.
- **FR-019**: Transform evaluation MUST complete before any sittir-specific interpretation, so the post-transform grammar is valid tree-sitter input.

#### Extension points (top-level grammar arrays)

- **FR-019a**: Override files MUST be able to extend the base grammar's `supertypes`, `externals`, and `extras` arrays by declaring their own values; sittir MUST merge the override's entries with the base's using array-spread semantics — equivalent to `[...base.<field>, ...overrides.<field>]` — with identity-based duplicate removal.
- **FR-019b**: Override files MUST be able to replace the base grammar's `word` rule by declaring their own `word` value; sittir MUST treat this as scalar replacement — equivalent to `overrides.word ?? base.word` — because `word` is a single rule reference, not an array.
- **FR-019c**: When an override file does not declare a value for `supertypes`, `externals`, `extras`, or `word`, sittir MUST leave the base grammar's value unchanged for that field.

#### Migration from Link

- **FR-020**: Any mechanical auto-inference pass currently implemented inside sittir's Link phase MUST be moved into `enrich`, so the maintainer can see it reflected in the authored grammar rather than hidden in a compiler phase.
- **FR-021**: After migration, the three currently-supported grammars (rust, typescript, python) MUST continue to pass their existing fidelity ceilings for round-trip and factory-round-trip validation.

#### Validation

- **FR-022**: The project MUST have a continuous-integration check that runs tree-sitter's parser generator against the post-transform output for each supported grammar and fails the build if any grammar is rejected.
- **FR-023**: The project MUST have a continuous-integration check that compares round-trip and factory-round-trip fidelity against the stored ceilings for each supported grammar and fails the build on regression.

### Key Entities

- **Base Grammar**: the tree-sitter grammar object being extended — comes from the published grammar package, has rules, externals, extras, etc.
- **Enriched Grammar**: the output of `enrich(base)` — same shape as a base grammar but with mechanical transformations applied, still fully valid tree-sitter input.
- **Override File**: the per-grammar authoring artifact (`packages/<lang>/overrides.ts`) where a maintainer writes `grammar(enrich(base), {...})` plus any transform/role/insert/replace calls.
- **Role Registry**: a per-grammar collection of named roles accumulated via side-effecting `role()` calls during file evaluation, consumed later by the Link phase.
- **Transform Patch**: a targeted modification to a rule's structure, addressed by position or path, applied before any sittir-specific interpretation runs.
- **Post-Transform Grammar**: the grammar object after all transforms, enrichment, and effect accumulators have run — the artifact validated by running tree-sitter's parser generator against it.
- **Fidelity Ceiling**: the stored maximum allowable fail count for round-trip and factory-round-trip validation per grammar; ceilings can only go down over time.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A maintainer can open a single `overrides.ts` file and see the complete intent of the grammar extension — no mechanical transformation is happening invisibly inside a compiler phase.
- **SC-002**: Moving the existing mechanical Link passes into `enrich` does not raise the round-trip or factory-round-trip fail counts for rust, typescript, or python beyond their pre-feature ceilings.
- **SC-003**: For each supported grammar, running tree-sitter's parser generator against the post-transform override output succeeds in continuous integration.
- **SC-004**: A new field override that previously required rewriting a nested rule can now be expressed as a targeted path-addressed patch in fewer lines than the pre-feature equivalent.
- **SC-005**: A role declaration can be written inline in `externals` or `rules` without requiring a sidecar configuration block, and the same file is accepted by both sittir and tree-sitter.
- **SC-006**: A grammar maintainer onboarding to sittir for the first time can determine what transformations will be applied to a base grammar by reading the override file alone, without reading compiler source.

## Assumptions

- Override files are authored in TypeScript. A mechanical transpile to JavaScript is acceptable as the bridge to tree-sitter's toolchain — this is a build-step detail, not a change in authoring surface.
- The currently-supported grammars are rust, typescript, python. Future grammars inherit the same constraints.
- The sittir DSL primitives needed by override files (`transform`, `insert`, `replace`, `role`, `field`, `alias`) are exported from a single entry point and importable in the authoring environment.
- Fidelity ceilings are already tracked per grammar and enforced by existing CI — this feature uses that mechanism, it does not replace it.
- "Mechanical" means: deterministic, local, no ambiguity, no counting, no thresholds. Any transformation that would need to ask "is this common enough?" is not mechanical.
- Opt-in `enrich` is acceptable (existing overrides that don't call it continue to work); forced global application is explicitly out of scope.
- Extension-point merge semantics are array-spread with identity-based dedupe for the three array fields (`supertypes`, `externals`, `extras`) and scalar replacement for `word`. This mirrors the JavaScript spread syntax maintainers will intuitively reach for and keeps the implementation literally expressible as `{ externals: [...base.externals, ...overrides.externals], word: overrides.word ?? base.word, ... }`.
- Enrichment skip notifications go to stderr during codegen — maintainers already read codegen output, so no new surface to check. A separate report artifact is explicitly not produced in v1.

## Out of Scope

- Heuristic or frequency-based auto-inference of field names. Stays hand-authored.
- Authoring overrides in any language other than TypeScript.
- Replacing the existing fidelity-ceiling mechanism.
- Supporting grammars beyond the three currently covered.
- Runtime injection of sittir primitives into the tree-sitter evaluation environment (explicit imports are required).
