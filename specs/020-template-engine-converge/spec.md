# Feature Specification: Template Engine Converge

**Feature Branch**: `020-template-engine-converge`
**Created**: 2026-04-25
**Last Updated**: 2026-04-27
**Status**: Draft (spec complete; plan not yet written)
**Input**: User description: "template-engine-converge — collapse the two on-disk template directories (`packages/{lang}/templates/*.jinja` user-facing + `packages/{lang}/rust-render/templates/*.jinja` Askama mirror) into a SINGLE canonical template per kind per grammar. Both runtimes consume the same byte-equal file. The regen-mirror class of bug that produced features 016 Cluster A (python comprehensions) and Cluster B (rust patterns) becomes unrepresentable." Follow-up user-approved scope folded into this same spec: move grammar-local native render crates out of `packages/<grammar>/rust-render` and into `rust/crates/sittir-render-<grammar>`, including crate rename plus all docs/commands/examples updates.

## Current Architecture Alignment

This spec is written against the **current main-repo architecture**, not the pre-011 `templates.yaml` era:

- Canonical authored/generated templates already live at `packages/{lang}/templates/*.jinja` (spec 011).
- The TypeScript renderer (`packages/core/src/render.ts`) reads those canonical files through the Nunjucks path.
- The native render path currently generates grammar-local crates under `packages/{lang}/rust-render/`, including `src/templates.rs` plus a copied `templates/` directory whose bodies are rewritten for native-only concerns (today this includes list-usage rewriting such as `except_clauses -> except_clauses_list`, plus reserved-keyword accommodations).
- The shared Rust transport shape is `sittir_core::prepare::TemplateContext` (`fields`, `fields_list`, `children`, `children_list`, `variant`, `text`, flank metadata). Convergence work happens in the **generated Askama view over that transport, the native crate layout, and template-loading paths**, not by changing the feature back to a YAML-based design.
- The user explicitly chose to **fold the native-crate relocation into spec 020** rather than create a separate feature. 020 therefore owns both: (a) canonical-template-source convergence and (b) relocating/renaming native render crates to `rust/crates/sittir-render-{lang}`.

020 therefore builds directly on specs **011**, **012**, and **016**.

## Chosen Approach: Option C (generated Askama-view convergence + centralized native crate relocation) with B -> A as ordered fallbacks

This feature commits to **Option C** as the primary path: remove the native-only template-body rewrite layer by changing the generated Askama-facing surface so the canonical templates under `packages/{lang}/templates/*.jinja` can be consumed as-authored by both backends, while simultaneously relocating the generated native render crates from `packages/{lang}/rust-render/` to `rust/crates/sittir-render-{lang}/`.

Concretely:

- the shared `sittir_core::prepare::TemplateContext` may remain the internal transport (`fields`, `fields_list`, etc.);
- the convergence target is the **generated per-kind Askama struct surface and template-loading path**, so list-shaped fields no longer require a second copied template body with `_list`-suffixed identifiers; and
- the generated native crate itself becomes a centralized Rust-workspace member (`rust/crates/sittir-render-{lang}`), so repo layout and commands tell one consistent story about where native code lives.

The two alternatives are kept on the record as ordered fallbacks. They activate only if the verification gate below disproves Option C on the current architecture.

- **Option B (first fallback) — native-side accessor adapter, still one template source.** If Askama cannot consume the canonical template text directly from the generated struct surface, introduce a thin generated native adapter layer (custom accessors, wrapper fields, or filter-level helpers) that preserves the single canonical template body. This fallback may change generated Rust code and helpers, but it is **not** allowed to re-introduce a second hand-edited or separately-authored template directory, and it still uses the relocated crate layout.
- **Option A (second fallback) — deterministic native preprocessor with one declared rule table.** If both direct convergence and a native adapter fail, keep a single canonical template directory but run a deterministic codegen/build-time rewrite into the native load path. The rewrite rules must live in one declared source (for example in `packages/codegen/src/emitters/rust-render.ts`) and be auditable, testable, and minimal. This is the safety net, not the preferred design.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - One template directory per grammar (Priority: P1)

A maintainer touching codegen needs a single canonical place where the per-kind Jinja templates live. Today there are two template directories per grammar — `packages/{lang}/templates/*.jinja` (consumed by the TS/Nunjucks path) and `packages/{lang}/rust-render/templates/*.jinja` (consumed by Askama after a copy-and-rewrite step). The second directory is not independently authored, but it is still a second on-disk bundle that can drift or encode native-only syntax accommodations. After this feature, both runtimes consume the same byte-equal template files from one canonical location; the second directory disappears or becomes a verifiable symlink with no body transformation.

**Why this priority**: This is the core value of the feature. The stale-mirror bug class exposed by feature 016 becomes structurally impossible only when there is exactly one template source per kind per grammar.

**Independent Test**: Pick one grammar (recommend `python`). Run the normal regenerate command, then run parity under both `SITTIR_BACKEND=typescript` and `SITTIR_BACKEND=native`. Confirm that the native render path reads the same template bytes as the TS path and that any native template directory under the relocated crate path is either absent or a symlink with no rewritten bodies.

**Acceptance Scenarios**:

1. **Given** the converged state on this branch, **When** a maintainer lists `packages/{lang}/templates/` and the corresponding native crate path, **Then** they find exactly one canonical template directory and no second independently-generated template body.
2. **Given** a kind `X` for grammar `G`, **When** the TS renderer and the native renderer each render the same `NodeData(X)`, **Then** both outputs come from the same canonical `packages/G/templates/X.jinja` body; no copied-and-rewritten second template body is consulted.
3. **Given** a contributor edits `packages/G/templates/X.jinja` and regenerates, **When** the next CI run executes parity and drift checks, **Then** there is no separately-generated native template body that could have gone stale.

---

### User Story 2 - Native render crates live in the Rust workspace, not under grammar packages (Priority: P1)

A maintainer working on the native renderer needs the repository layout to reflect that the native render crates are Rust workspace members, not grammar-package subdirectories. Today each grammar has a generated crate under `packages/{lang}/rust-render/`. After this feature, those grammar-local crates are removed and replaced by centralized crates at `rust/crates/sittir-render-rust`, `rust/crates/sittir-render-typescript`, and `rust/crates/sittir-render-python`.

**Why this priority**: The user explicitly approved this relocation and chose to fold it into 020. Without the relocation, the repo would still tell two conflicting stories: templates are converged, but native crate ownership still appears package-local.

**Independent Test**: After regeneration, verify that no `packages/{lang}/rust-render/` crate directories remain, that `rust/crates/sittir-render-{lang}/` exists for all three grammars, and that Cargo workspace membership plus dependent path references resolve through the new location and crate names.

**Acceptance Scenarios**:

1. **Given** the converged repository layout, **When** a maintainer searches for generated native render crates, **Then** they find them only under `rust/crates/sittir-render-{lang}/`.
2. **Given** the old grammar-local path `packages/{lang}/rust-render/`, **When** a maintainer inspects the tree after regeneration, **Then** that crate path no longer exists as the generated native crate location.
3. **Given** the relocated native crate for grammar `G`, **When** Cargo or a dependent crate references it, **Then** the package name and filesystem path both use the new `sittir-render-{g}` convention consistently.

---

### User Story 3 - Native artifact regeneration is part of the standard `--all` workflow (Priority: P1)

A maintainer running the regular codegen invocation (`npx tsx packages/codegen/src/cli.ts --grammar X --all --output packages/X/src`) needs the output to be sufficient for **both** backends. Today the native path still has its own regeneration branch and template-copy logic. After this feature, the standard `--all` path is the only workflow needed: it refreshes TypeScript artifacts plus the relocated native render crate artifacts, fixture extracts, and any template-bundle hashes together.

**Why this priority**: A single template directory is not enough if maintainers can still regenerate TS-facing output and native-facing output through different workflows. The same "forgot the second step" failure mode would remain.

**Independent Test**: From a clean checkout, run `--all` for `rust`, `typescript`, and `python` with no extra native-specific flag. Then run both the TS and native parity suites. Both must pass without any follow-up regeneration command, and the refreshed native artifacts must appear under `rust/crates/sittir-render-{lang}/`.

**Acceptance Scenarios**:

1. **Given** a clean checkout with no prior native regeneration step, **When** the maintainer runs `npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src`, **Then** both backends' parity suites pass without any second regenerate command.
2. **Given** the post-convergence codegen pipeline, **When** a maintainer reads `packages/codegen/src/cli.ts`, **Then** they find one standard regenerate flow for supported grammars, not a separate template-generation branch that can produce a second template flavour or a second crate-refresh workflow.
3. **Given** the relocated native render artifacts for grammar `G` (`rust/crates/sittir-render-{g}/src/templates.rs`, `src/hash.rs`, `src/lib.rs`, and crate-local fixture metadata), **When** the regular `--all` workflow runs, **Then** those artifacts are refreshed by that same workflow alongside the canonical templates.

---

### User Story 4 - Contributors can explain both the template location and the native crate location in one sentence (Priority: P2)

A new contributor browsing the repository needs to be able to answer both questions — "where do templates live?" and "where do native render crates live?" — with one short explanation: _"Templates live in `packages/{lang}/templates/`; TS reads them directly, native reads that same directory directly or via a symlink, and the generated native render crate for each grammar lives in `rust/crates/sittir-render-{lang}` rather than under the grammar package."_

**Why this priority**: The structural fix is easy to accidentally undo if the repo still reads like there are two template systems or two competing native-crate layouts. This story captures the documentation and command updates that prevent future regressions.

**Independent Test**: A contributor unfamiliar with this feature reads the header comments in `packages/codegen/src/emitters/templates.ts`, `packages/codegen/src/emitters/rust-render.ts`, and the CLI help/README/CLAUDE guidance. Within five minutes they can correctly state where templates live, where the native crates live, how the native path reaches canonical templates, and which regenerate commands/examples are canonical.

**Acceptance Scenarios**:

1. **Given** the post-convergence codebase, **When** a contributor reads `packages/codegen/src/emitters/templates.ts`, **Then** it explicitly names `packages/{lang}/templates/` as the canonical template location for both runtimes.
2. **Given** a contributor reads `packages/codegen/src/emitters/rust-render.ts` and the regen command help, **When** they look for the native crate location and regen command examples, **Then** they find only the relocated `rust/crates/sittir-render-{lang}` path and the updated command/documentation examples.
3. **Given** a contributor searches the repo docs for the old `packages/{lang}/rust-render` examples, **When** the feature is complete, **Then** contributor-facing commands and examples have been updated to the relocated crate path and naming convention.

---

### Edge Cases

- **Field referenced in both scalar and list positions**: Some templates use the same logical field in both a presence check and a list join/loop (for example `except_clauses | isPresent` and `except_clauses | join("\n")`). Convergence must preserve that authoring surface without requiring two different template identifiers in the canonical file.
- **Reserved-word and raw-identifier collisions on the native side**: Rust fields like `type`, `trait`, `crate`, `self`, `super`, and `Self` may need raw identifiers or documented suffix exceptions in generated Rust. Any such exceptions must be declared in one place and be the only allowed native-only identifier divergence.
- **Cargo path fallout from relocation**: Moving the generated native crates from `packages/{lang}/rust-render/` to `rust/crates/sittir-render-{lang}/` changes workspace membership, dependency paths, and build-script assumptions. All path-sensitive references must be updated atomically so no mixed-layout state survives.
- **Askama compile-time path stability after relocation**: Askama resolves template paths at `cargo build` time. Relocating the crate changes the relative path from the crate root to the canonical template directory; convergence must not introduce a build-order or path-resolution hazard.
- **Symlink portability**: macOS and Linux handle symlinks well; Windows and packaging flows are trickier. If the implementation keeps a native `templates/` path as a symlink rather than removing it, the packaging and developer-mode story must be documented and tested. Removal is preferred when practical.
- **Non-template native artifacts still exist**: Even after convergence, the native path still needs generated Rust source, fixture extracts, and template-bundle hashes. Removing the second template directory and relocating the crate must not orphan `templates.rs`, `hash.rs`, `lib.rs`, or fixture metadata.
- **Docs/commands/example drift**: The path move and crate rename affect README snippets, CLAUDE guidance, build instructions, and example paths. Partial updates would leave the repository internally inconsistent even if the code compiles.
- **Filter or control-flow semantic drift beyond `_list` naming**: If Nunjucks and Askama disagree on a filter/control primitive that appears in canonical templates, the mismatch is a hidden engine divergence and must be resolved explicitly rather than papered over by a copied native-only template body.

## Risk and Verification Gate

**Load-bearing assumption**: The current native architecture can be converged without retaining the `rewriteListUsage` template-body transform, and that convergence remains valid after the native crates are relocated to `rust/crates/sittir-render-{lang}`. In other words, the generated Askama-facing surface can support canonical usages such as `{% if except_clauses | isPresent %}{{ except_clauses | join("\n") }}{% endif %}` directly from the canonical template body in the relocated crate layout.

**Verification gate** — the implementation phase's first task is an empirical convergence spike on the current architecture plus the approved relocation target. Procedure:

1. Pick one grammar (recommend `python`) and one representative kind that currently requires list-usage rewriting (`try_statement` is the canonical probe because it exercises both `isPresent` and `join("\n")` on `except_clauses`).
2. In a throwaway branch off this one, modify the generated-native surface (the relevant logic in `packages/codegen/src/emitters/rust-render.ts`, and if needed `rust/crates/sittir-core/src/prepare.rs` or `filters.rs`) so the generated Askama path can consume the canonical identifier form for that kind **without** rewriting the template body to `except_clauses_list`.
3. At the same time, relocate the probe grammar's generated native crate to the target layout (`rust/crates/sittir-render-{lang}`) and verify the native template-loading path still resolves the canonical template body from there. Do **not** hand-author a permanent second template.
4. Run `cargo build` for the relocated native path and then run parity for the probe kind under both `SITTIR_BACKEND=typescript` and `SITTIR_BACKEND=native`.
5. **Decision**:
   - **If compile + parity both hold**: Option C is verified. Proceed with full rollout: eliminate the list-usage rewrite, relocate/rename the native crates, converge the directories, and then address only any documented keyword/raw-identifier exceptions.
   - **If direct convergence fails but a generated native accessor/helper layer can preserve the one-template-source rule**: drop to Option B.
   - **If both fail** on a meaningful cross-section of rules: drop to Option A and record the exact rewrite rules in one declared place.
6. Record the result in `specs/020-template-engine-converge/research.md` during planning/implementation before the full rollout begins.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Per kind per grammar, exactly one canonical `.jinja` template file MUST exist under `packages/{lang}/templates/`. Any native `templates/` path under `rust/crates/sittir-render-{lang}/` is removed entirely or exists only as a verifiable symlink to the canonical directory. No independently-generated second template body is permitted.
- **FR-002**: The generated native render crates currently under `packages/{lang}/rust-render/` MUST be relocated to `rust/crates/sittir-render-{lang}/`, and the Cargo package names, dependency paths, and crate references MUST be renamed to match that convention.
- **FR-003**: Both runtimes (TypeScript/Nunjucks and native/Askama) MUST consume byte-equal template files. Native-specific template-body rewrites are forbidden once convergence lands, except for any explicitly documented identifier exception list allowed by FR-010.
- **FR-004**: The chosen convergence approach is **Option C**. Mechanism:
  - The shared Rust transport type `sittir_core::prepare::TemplateContext` may remain map-based (`fields`, `fields_list`, `children`, `children_list`, etc.).
  - The generated Askama-facing surface in `rust/crates/sittir-render-{lang}/src/templates.rs` and its construction logic MUST be changed so canonical template identifiers can be consumed without the current native list-usage rewrite.
  - The current native template-body rewrite in `packages/codegen/src/cli.ts` (`rewriteListUsage`) MUST be removed.
  - After verification passes, native template loading MUST come from the canonical directory directly or via a no-transform symlink.
- **FR-005**: The repository MUST have one standard regenerate workflow for supported grammars. Running `npx tsx packages/codegen/src/cli.ts --grammar X --all --output packages/X/src` MUST refresh both TS and native artifacts. If `--rust-render` remains for compatibility, it MUST be a no-op alias to the standard workflow, not a separate regeneration path.
- **FR-006**: Non-template native artifacts that previously travelled with the native path MUST continue to be regenerated by the standard workflow at the relocated crate location. At minimum this includes `rust/crates/sittir-render-{lang}/src/templates.rs`, `src/hash.rs`, `src/lib.rs`, and any crate-local fixture metadata used by the native parity workflow.
- **FR-007**: All passing parity counts established by feature 016 (in `specs/016-parity-regressions/baselines/{ts,native}.json`) MUST hold post-convergence. This feature is non-functional from a render-output standpoint; counts may improve, but they MUST NOT regress.
- **FR-008**: Documentation, commands, and examples MUST be updated to the relocated crate path and crate names. Contributor-facing references to `packages/{lang}/rust-render` as the native crate location are forbidden once this feature lands.
- **FR-009**: Hand-edits to generated artifacts remain forbidden. Implementation changes MUST land in hand-written sources such as `packages/codegen/src/*`, `rust/crates/sittir-core/src/*`, and `packages/{lang}/overrides.ts` when needed. Generated outputs (`packages/{lang}/templates/*.jinja`, `packages/{lang}/src/*`, `rust/crates/sittir-render-{lang}/*`) may change only via regeneration.
- **FR-010**: Any remaining native-only identifier exceptions (for example non-rawable Rust keywords) MUST be declared in one source of truth inside the native emitter and reflected consistently in generated Rust fields and documentation. Ad-hoc per-kind rewrites are forbidden. The only permitted native-only template-identifier divergence after this feature is the documented exception list.
- **FR-011**: Convergence MUST remove native-only list-shape template rewrites entirely.
- **FR-012**: Constitutional invariants MUST be preserved:
  - Principle II (Fewer Abstractions) — convergence removes a duplicated template bundle and clarifies a single native crate layout.
  - Principle III (Generated vs Hand-Written) — templates remain generated output; no new hand-maintained native template surface is introduced.
  - Principle VI (Deterministic Output) — one canonical template source produces one deterministic bundle.
  - Principle VII (Grammar-Agnostic Pipeline) — the convergence and relocation mechanisms work across `rust`, `typescript`, and `python` without per-grammar forks in the overall pipeline; any unavoidable exceptions live in one declared table.

### Key Entities _(include if feature involves data)_

- **Canonical Template Directory**: The single per-grammar directory `packages/{lang}/templates/` containing one `.jinja` file per kind. Post-convergence, this is the only authored/generated template bundle both backends read.
- **Centralized Native Render Crate**: The generated crate at `rust/crates/sittir-render-{lang}/` for each grammar. Post-convergence, this is the only valid filesystem location for the per-grammar native render crate.
- **Shared TemplateContext Transport**: `sittir_core::prepare::TemplateContext`, the map-based native transport (`fields`, `fields_list`, `children`, `children_list`, `variant`, `text`, flank metadata). It is an internal render transport, not the source of truth for template file layout.
- **Generated Askama View**: The per-kind generated structs and dispatcher in `rust/crates/sittir-render-{lang}/src/templates.rs` that project `TemplateContext` into Askama's typed template world. This is the native-side adaptation layer that must converge to the canonical template surface.
- **Legacy Grammar-Local Native Crate**: The pre-convergence `packages/{lang}/rust-render/` path. Post-convergence it is removed as a crate location and survives only, if at all, as a historical concept in old branch history.
- **Exception List**: The single declared table of any native-only identifier accommodations that remain legal after convergence (for example non-rawable Rust keywords). This list is auditable and testable.
- **Verification Gate**: The initial spike that proves whether the current architecture can eliminate the native list-rewrite path while keeping canonical templates untouched and the native crate relocated.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: For every grammar in `{rust, typescript, python}`, there is exactly one canonical template directory. Any native `templates/` path under `rust/crates/sittir-render-{lang}/` is either absent or a symlink to the canonical directory. Verified by a repository script or shell loop.
- **SC-002**: No generated native render crate remains under `packages/{lang}/rust-render/`. Instead, `rust/crates/sittir-render-rust`, `rust/crates/sittir-render-typescript`, and `rust/crates/sittir-render-python` exist and are the only native render crate locations.
- **SC-003**: Cargo workspace membership, package names, and dependent references use the relocated `sittir-render-{lang}` names consistently. Verified by building the native workspace and grepping for stale crate-path references in contributor-facing sources.
- **SC-004**: Running `npx tsx packages/codegen/src/cli.ts --grammar X --all --output packages/X/src` is sufficient to refresh both TS and native artifacts for `X in {rust, typescript, python}`. No second regeneration command is required.
- **SC-005**: All three grammars' parity suites pass on both backends using the converged template layout and relocated native crates. Counts in `specs/016-parity-regressions/baselines/{ts,native}.json` stay equal or improve.
- **SC-006**: `packages/codegen/src/cli.ts` no longer contains the native list-body rewrite (`rewriteListUsage`) or any equivalent second-flavour template transform.
- **SC-007**: A maintainer answering "where are the templates and native render crates?" can point to exactly one template directory per grammar and exactly one native crate path per grammar. Verified by spot-checking `templates.ts`, `rust-render.ts`, and contributor docs.
- **SC-008**: The verification-gate result is written to `specs/020-template-engine-converge/research.md` before the full rollout begins.

## Out of Scope

- **Source format inference** (feature 017). 020 does not capture or replay source-format intent; it only converges the template bundle both render engines consume and relocates the native render crates.
- **Walker refactors or whitespace-policy changes**. 020 does not redesign template generation semantics; it removes duplicate template bundles, native-only template rewrites, and the old grammar-local native crate layout.
- **New grammar features**. 020 only converges the existing template/native-crate architecture for `rust`, `typescript`, and `python`.
- **A new public render API**. `createRenderer`, `render_dispatch`, backend selection, and parity harness APIs stay conceptually the same; this feature changes how templates are sourced and where native generated crates live.
- **Unbounded engine feature work**. If Askama/Nunjucks need deeper semantic alignment beyond what this convergence requires, that is follow-up work unless it directly blocks single-source template consumption in the relocated layout.

## Assumptions

- The current mainline architecture from specs 011, 012, and 016 is the baseline for this feature: canonical `.jinja` files already exist, generated native render crates already exist, and parity baselines already exist. 020 does **not** reopen the retired `templates.yaml` design.
- The user-approved relocation requirement belongs in this feature and does not need a separate spec. Planning and implementation for 020 therefore treat crate relocation, crate rename, and docs/examples updates as first-class scope.
- The present native divergence is primarily architectural duplication (second directory + copy-time rewrite + grammar-local crate placement), not a fundamental need for a second authored template language or a grammar-package-owned native crate.
- The standard `--all` workflow can be made the single regeneration entry point for native artifacts. If a separate `--rust-render` flag still exists when implementation starts, 020 absorbs that cleanup as part of convergence rather than treating it as unrelated work.
- Askama and Nunjucks can share the authored Jinja subset already in use by the repository. Any true semantic mismatch discovered during the verification gate is a fallback trigger (Option B or A), not a reason to keep the current mirror indefinitely.
- Reserved-keyword/raw-identifier exceptions affect only a small minority of fields and can be managed through one declared exception table without turning back into a second template flavour.
- The parity corpus and baseline JSONs from feature 016 remain the authoritative regression gate for this feature.
