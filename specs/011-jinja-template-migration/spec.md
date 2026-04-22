# Feature Specification: Jinja Template Migration (Askama-Style)

**Feature Branch**: `011-jinja-template-migration`
**Created**: 2026-04-21
**Status**: US1 (MVP) complete (2026-04-22); US2 (Rust port) deferred
**Input**: User description: "Askama-Style Template Migration — migrate template format from ast-grep-flavored YAML to Jinja-compatible individual `.jinja` files. Consumed by Nunjucks (TypeScript) and askama (Rust)."

**Scope update (2026-04-22)**: User Story 2 (Rust askama renderer) is
deferred pending the full `@sittir/core` port to Rust. When that port
lands, the askama render path is built inside the ported core rather
than as a standalone crate. The `.jinja` file surface produced by
Phase 3 is the permanent template format and needs no rework for the
future port.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — TypeScript codegen renders with Nunjucks from per-rule `.jinja` files (Priority: P1)

A codegen maintainer replaces the existing YAML-backed render engine with one that loads per-rule `.jinja` files from a `templates/` directory and renders them using Nunjucks. Running the round-trip corpus produces byte-identical output to the pre-migration baseline for every node across Rust, TypeScript, and Python grammars. The one-line-per-rule YAML view is retired; template changes are now file-level diffs.

**Why this priority**: This is the standalone, value-delivering MVP. It unblocks the Rust port (Phase B) by locking in the template *shape* Rust will consume, removes the hand-rolled regex substitutor as the rendering layer, and gives template authors IDE support (syntax highlighting, linting) — all without touching the Rust port itself. Phase A alone pays off the cleanup and removes a blocker.

**Independent Test**: Run `pnpm test` and the per-grammar round-trip corpus after the cutover. Every rendered node must be byte-identical to the pre-migration snapshot. Template changes appear as individual `.jinja` file diffs in git.

**Acceptance Scenarios**:

1. **Given** a corpus node that previously rendered via `templates.yaml`, **When** the renderer is invoked on the same node post-migration, **Then** the output bytes match the pre-migration baseline exactly.
2. **Given** a rule whose template was collapsed to a single string by cleanup task 2, **When** the codegen emits `.jinja` files, **Then** exactly one file at `templates/<rule_kind>.jinja` is produced — no `variants:` wrapper, no YAML.
3. **Given** one of the three variant-branching rules (`visibility_modifier`, `export_statement`, `call_expression`), **When** the codegen emits its `.jinja` file, **Then** the template contains `{% if variant == "..." %}` chains covering every form the grammar declares.
4. **Given** `templates.yaml` is deleted from the grammar package post-migration, **When** the test suite runs, **Then** no test references the deleted file and no runtime code path looks for it.
5. **Given** a `.jinja` file references a variable not produced by the `TemplateContext`, **When** the renderer runs against a node of that rule's kind, **Then** the renderer surfaces a clear error naming the rule, the file, and the missing variable — not a silent empty string.

---

### User Story 2 — Rust port renders with askama from the same `.jinja` files (Priority: P2)

A Rust port maintainer generates Rust source files (one struct per rule, carrying the `#[template(path = "<kind>.jinja")]` attribute) that askama compiles at `cargo build`. The same per-rule `.jinja` files authored in Phase A drive both the TS (Nunjucks) and Rust (askama) renderers. A cross-render parity test runs the same node through both implementations and asserts byte-identical output.

**Why this priority**: P2 because it depends on P1 landing (the `.jinja` files must exist and be authoritative). P2 on its own delivers the actual port value: Rust takes over rendering with compile-time template validation (unknown variables become build errors), while the `.jinja` files remain the single source of truth for both runtimes.

**Independent Test**: A dedicated cross-render parity test runs the corpus through both the TS renderer and the Rust renderer; every node must produce byte-identical output.

**Acceptance Scenarios**:

1. **Given** a valid per-rule `.jinja` file, **When** the Rust crate is built, **Then** askama compiles it into the per-rule struct's render implementation without errors.
2. **Given** a `.jinja` file that references a variable not on the corresponding Rust struct, **When** `cargo build` runs, **Then** the build fails with an error that names the template file, the missing variable, and the rule.
3. **Given** a corpus node renderable by both the TS and Rust implementations, **When** the cross-render parity test runs, **Then** both implementations produce byte-identical output.
4. **Given** a filter used by a `.jinja` file has a Nunjucks-native name with no askama equivalent (e.g. `upper`), **When** the Rust crate compiles, **Then** an askama-side alias registration maps the Nunjucks name to the askama implementation without requiring template changes.

---

### User Story 3 — Template authors edit a single file and see the change localized (Priority: P3)

A template author opens `packages/rust/templates/struct_item.jinja` in their IDE, gets syntax highlighting and variable-reference linting, edits the shared-fields layout, regenerates the grammar package, and sees exactly one file change in `git diff`. No unrelated rule's template is touched, no YAML block-scalar re-indentation noise appears.

**Why this priority**: P3 because this is ergonomic payoff, not a correctness requirement. It becomes real once P1 ships. The value is faster review cycles and lower cognitive cost for template authorship — meaningful but not blocking.

**Independent Test**: Edit one rule's `.jinja` file, regenerate the grammar package, observe a single-file `git diff`. Open the file in an IDE with a Jinja LSP/extension active; verify syntax highlighting and linting recognize the template syntax.

**Acceptance Scenarios**:

1. **Given** an edit to one `.jinja` file, **When** `git diff` runs against the unmodified baseline, **Then** the diff contains changes only to that file (and nothing in unrelated rule templates).
2. **Given** a `.jinja` file open in an IDE with Jinja tooling, **When** the author views the file, **Then** syntax highlighting applies and unknown-variable warnings surface if the template references an undefined variable.

### Edge Cases

- What happens when a rule template uses a YAML feature (like a block-scalar `|`-literal with embedded newlines) that the one-shot translator must faithfully preserve? Translation must reproduce the exact whitespace; any deviation breaks byte-identical round-trip.
- What happens when a filter exists in Nunjucks with a different name or semantics in askama? Sittir standardizes on Nunjucks names; askama-side must register aliases for divergent filters. Filters whose semantics differ subtly (not just names) must be flagged before translation proceeds.
- What happens when a rule lacked any template under YAML because codegen didn't emit one (token-shaped kinds)? The translator must emit no `.jinja` file for that rule; the renderer's fallback (emit `$text`) continues to handle it.
- What happens when a new grammar is added after the migration? Codegen must emit `.jinja` files for it (not YAML) and the renderer loads them from the grammar's `templates/` directory.
- How does system handle a `.jinja` file that is present on disk but not referenced by any rule? Detected as orphaned (unreachable) and surfaced by a linter / cleanup pass — never silently rendered.
- How does system handle the one-time translator's output when a rule template contains constructs the Jinja subset doesn't cover? Translation fails loudly with the rule name and the unsupported construct — never produces a degraded template.
- How does system handle whitespace-sensitive templates (python's indent-based blocks) where YAML's block-scalar preservation was doing load-bearing work? The Jinja whitespace-control syntax (`{%-` / `-%}`) must produce identical trimming; round-trip corpus validates this per-node.

## Requirements *(mandatory)*

### Functional Requirements

#### Translator (one-shot)

- **FR-001**: The system MUST provide a one-shot translator that reads the existing `packages/{rust,typescript,python}/templates.yaml`, produces one `.jinja` file per rule, and places the files under `packages/<grammar>/templates/<rule_kind>.jinja`.
- **FR-002**: The translator MUST translate single-template rules (post cleanup task 2) to a direct Jinja body with no surrounding `{% if variant %}` wrapper.
- **FR-003**: The translator MUST translate the three genuinely-variant rules (`rust/visibility_modifier`, `typescript/export_statement`, `typescript/variable_declarator`, `typescript/call_expression`, `python/_match_block` — the final list confirmed post cleanup task 2) to `{% if variant == "<form>" %}` / `{% elif %}` / `{% else %}` chains that cover every form the grammar declares.
- **FR-004**: The translator MUST translate `$NAME` placeholders to `{{ name }}`, `$$$NAME` placeholders to either `{{ name }}` (when the pre-partition context pre-joins the field) or `{% for %}` loops (when per-item control is needed), clause references (`$X_CLAUSE` + `x_clause: body`) to `{% if x %}body{% endif %}`, and `$TEXT` to `{{ text }}`.
- **FR-005**: The translator MUST fail loudly — naming the rule, the grammar, and the specific unsupported construct — when a source template contains a construct the target Jinja subset does not cover. It MUST NOT emit a degraded template.
- **FR-006**: The translator MUST preserve byte-identical rendering: for every node in the round-trip corpus, pre-translation and post-translation render output are equal.

#### Template surface

- **FR-007**: The system MUST store templates as one `.jinja` file per rule per grammar, under `packages/<grammar>/templates/<rule_kind>.jinja`.
- **FR-008**: The system MUST NOT retain `packages/<grammar>/templates.yaml` after Phase A completes. Deletion is part of the acceptance.
- **FR-009**: The system MUST restrict `.jinja` files to the Nunjucks ∩ askama intersection subset: interpolation, `{% if %}`/`{% elif %}`/`{% else %}`/`{% endif %}`, `{% for %}` with `loop.first`/`loop.last`/`loop.index`, whitespace-control (`{%-` / `-%}`), comments (`{# ... #}`), and the filter set `join(sep)` / `length` / `default(v)` / `trim` / `upper` / `lower`.
- **FR-010**: The system MUST NOT introduce template inheritance, macros, askama-only `{% match %}`, or Rust expressions into authored templates. Templates must be runtime-agnostic between Nunjucks and askama.
- **FR-011**: The system MUST standardize on Nunjucks filter names as the authoring convention. The askama-side Rust code MUST register aliases whose names differ (e.g., `upper` → askama's `uppercase`) so templates never reference askama-native names.

#### Template context

- **FR-012**: Every template render MUST receive a `TemplateContext` whose shape is identical across TS and Rust: pre-rendered field slots keyed by snake_case name (string-valued, optional), a pre-joined `children` string, a `children_list` array for per-item iteration, a `variant` string (empty when absent), a `text` string (empty when absent), and boolean `trailing_sep` / `leading_sep` flags.
- **FR-013**: The `TemplateContext` produced by the TS side and the Rust side MUST carry identical values for the same input node. Cross-render parity (P2) depends on this.
- **FR-014**: The pre-partition context step (cleanup task 3) is the single derivation point for `TemplateContext`. Templates MUST NOT reach back into raw node structure or the consumed-index set.

#### TS renderer (Phase A)

- **FR-015**: The system MUST replace the hand-rolled regex-substitution render engine with a Nunjucks-backed renderer for all three generated grammar packages.
- **FR-016**: The renderer MUST load `.jinja` files from the grammar's `templates/` directory (precompiled bundling is an implementation choice, not a specification requirement). Loading MUST be browser-safe (no `node:fs` at module load — consistent with cleanup task 1).
- **FR-017**: Rendering a node whose rule has no `.jinja` file MUST fall back to the same behavior as the current engine's token-shaped-kind path: emit `$text` when fields and children are all anonymous; throw otherwise.
- **FR-018**: When a template references a variable not present in the rendering context, the renderer MUST surface an error naming the rule, the file, and the missing variable. It MUST NOT silently substitute an empty string.

#### Rust port (Phase B)

- **FR-019**: TS codegen MUST emit Rust source (one struct per rule, each with `#[derive(Template)]` and `#[template(path = "<kind>.jinja")]`) that askama compiles at `cargo build`.
- **FR-020**: Building the Rust crate MUST validate all templates at compile time: unknown variables, unknown filters, and syntax errors MUST cause `cargo build` to fail with an error naming the template file and the failing construct.
- **FR-021**: A cross-render parity test MUST run the same corpus through both the TS (Nunjucks) and Rust (askama) renderers and assert byte-identical output per node. Divergences MUST report the rule, the input node, and the diff.

#### Validation

- **FR-022**: The round-trip corpus MUST pass byte-identical after Phase A; current ceilings (rust 123/0 + 483/1, typescript 81/27 + 421/60, python 98/16 + 197/30) MUST be preserved or improved.
- **FR-023**: The cross-render parity test (Phase B) MUST pass on 100% of the corpus before Rust render is declared authoritative.

### Key Entities *(include if feature involves data)*

- **Template file (`.jinja`)** — One file per rule per grammar, stored under `packages/<grammar>/templates/<rule_kind>.jinja`. Single source of truth for rendering, consumed by both Nunjucks (TS) and askama (Rust). Contains only the authoring subset (interpolation, conditionals, loops, comments, standardized filters, whitespace control).
- **`TemplateContext`** — The pre-processed render input produced by cleanup task 3's `prepare()` step. Same shape in TS (object) and Rust (struct): snake_case field slots, pre-joined `children`, `children_list` array, `variant`, `text`, `trailing_sep`, `leading_sep`.
- **Translator** — One-shot tool that reads the existing `templates.yaml` and emits per-rule `.jinja` files. Retired once the migration completes; not part of the steady-state pipeline.
- **Filter alias registry (Rust)** — Map of Nunjucks-native filter names to their askama implementations, registered on the Rust side so authored templates never reference askama-native names.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of corpus nodes render byte-identical post-Phase-A to the pre-migration baseline across Rust, TypeScript, and Python grammars.
- **SC-002**: `packages/{rust,typescript,python}/templates.yaml` is removed from the repository after Phase A lands; no tests or runtime code reference the deleted files.
- **SC-003**: Exactly one `.jinja` file exists per rule per grammar (≈160 files for Rust, comparable counts for TypeScript and Python). No rule has two or more files; no YAML wrapper file remains.
- **SC-004**: A template authored against the Jinja subset renders identically through Nunjucks (TS) and askama (Rust) for 100% of corpus nodes once Phase B lands (cross-render parity test green).
- **SC-005**: On the Rust side, a template referencing an undefined variable or unknown filter causes `cargo build` to fail with a diagnostic that names the template file and the specific error — unknown variables cannot reach runtime.
- **SC-006**: Editing a single rule's template produces a single-file `git diff` (no YAML block-scalar reindent noise, no unrelated-rule churn). Verified by committing an illustrative template change and inspecting the diff.
- **SC-007**: The total time from `pnpm test` start to "all tests pass" does not regress by more than 10% on a representative developer machine after Phase A lands (Nunjucks load + render should match or beat the regex-substitutor baseline given templates are small and cached).
- **SC-008**: After Phase B lands, the Rust port's render path has zero runtime template parsing overhead on the hot path (askama compiles templates at build time) — measurable as wall-clock time per rendered node on the corpus, expected to beat the TS runtime by a meaningful margin (target: at least 2× faster per node).

## Dependencies & Assumptions

**Dependencies** (must land before Phase A can start):

1. ADR-0013 Task 1 — loader split (ensures render layer is browser-safe).
2. ADR-0013 Task 2 — identical-variant-block collapse + `$variant` name alignment (reduces template surface from 21 variant blocks to 5 genuinely-branching ones, simplifying the translator).
3. ADR-0013 Task 3 — `prepare()` pre-partition (produces the `TemplateContext` shape templates consume).

**Assumptions**:

- The Jinja subset (interpolation, if/elif/else/endif, for with loop.*, whitespace control, `{# #}` comments, the six standardized filters) is sufficient to express every current template. The translator's loud-failure requirement (FR-005) catches any violation.
- Nunjucks and askama render this subset identically. Any semantic divergence on a filter or control construct is a bug in the aliasing layer, not in authored templates.
- Template changes will be reviewed via per-file `.jinja` diffs. YAML-block-scalar-specific tooling (yaml-lint, yq, etc.) is no longer required for the render pipeline.
- Phase B's cross-render parity test is authoritative for parity. If it passes, askama and Nunjucks agree on the subset.
- Filenames follow `<rule_kind>.jinja`. Rule kinds never collide with filesystem-reserved names on the target platforms. (Tree-sitter's identifier convention is `[a-z_][a-z0-9_]*` — safe on Linux, macOS, and Windows.)

**Out of scope**:

- Template inheritance, macros, `{% match %}`, or richer Jinja features beyond the intersection subset.
- Reviving YAML as an alternative authoring format.
- Supporting render engines other than Nunjucks (TS) and askama (Rust).
- Migrating any non-render YAML (e.g., `factory-map.json5`, `overrides.ts` remain untouched).
