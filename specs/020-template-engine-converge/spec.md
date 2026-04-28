# Feature Specification: Render Pipeline Optimization

**Feature Branch**: `020-render-pipeline-optimization`  
**Created**: 2026-04-25  
**Last Updated**: 2026-04-28  
**Status**: Draft  
**Input**: User description: "Update/begin spec 020 using `specs/020-template-engine-converge/spec.md`, incorporate the existing 020 content, and fold in the attached design for **Render Pipeline Optimization — Level 1 + Level 3**. Level 1 removes the native step-2→3 clone boundary by borrowing from `TemplateContext`; Level 3 removes `TemplateContext` entirely by rendering directly from `NodeData`. Both levels land only after parity ceilings are zero on both TS and native backends, and they preserve the existing Askama + `.jinja` + N-API surfaces."

## Current Architecture Alignment

This revision keeps the earlier 020 draft's convergence work as an explicit baseline while shifting the active focus to the **next native-render bottleneck after convergence/parity stabilization**.

- The earlier 020 content remains in force as the prerequisite architecture story, and this feature owns any remaining work needed to finish that baseline before or alongside the optimization rollout:
  - one canonical template directory per grammar under `packages/{lang}/templates/`,
  - one generated native render crate per grammar under `rust/crates/sittir-render-{lang}`,
  - one standard `--all` regenerate workflow for TS and native artifacts,
  - no second native-only template body or drift-prone mirror,
  - parity baselines from feature 016 as the regression gate.
- The current native render pipeline still pays a substantial per-render cost even after the template/crate layout is made coherent:

  1. deserialize `NodeData`,
  2. build a `TemplateContext` with `fields`, `fields_list`, `children`, and flank metadata,
  3. clone those rendered strings/vectors into a per-kind Askama struct,
  4. render the Askama template into the output string.

- For a node with `N` fields, step 2 builds two field maps and step 3 copies data back out of them once. For a representative 7-field node, the step-2→3 boundary performs 14 scalar/list clones before Askama writes any bytes.
- The user-provided Level 1 + Level 3 design targets that waste without reopening the earlier convergence decisions. Askama remains the template engine, `.jinja` remains the canonical template surface, and the N-API boundary remains `render(node_json) -> String`.
- This spec therefore treats earlier 020 convergence constraints as **retained baseline requirements**, then adds two optimization levels on top:
  - **Level 1**: borrow from `TemplateContext` instead of cloning;
  - **Level 3**: remove `TemplateContext` and render directly from `NodeData`.

## Chosen Approach: Retain convergence baseline, then land Level 1 before Level 3

020 now covers a staged native-render optimization program:

1. **Retain and respect the earlier convergence baseline**. The repository still converges on one canonical template directory per grammar, centralized native render crates, one regenerate workflow, and no native-only template mirror.
2. **Land Level 1 first**. Level 1 is intentionally narrow and codegen-driven: generated Askama structs borrow from the already-built `TemplateContext` instead of owning cloned `String`/`Vec<String>` values. This is the low-risk win.
3. **Land Level 3 second**. Level 3 is architectural: generated per-kind render functions resolve fields directly from `NodeData`, inline the needed metadata, and feed Askama without an intermediate `TemplateContext`.
4. **Keep rollback boundaries sharp**. Level 3 is allowed to coexist with the old path while parity is being proven. If direct rendering cannot preserve byte-identical output, the feature stops after Level 1 rather than half-removing the existing preparation layer.
5. **Treat both levels as full supported-grammar rollouts for completion.** The feature is not complete until `rust`, `typescript`, and `python` all have the relevant level enabled. Temporary mixed-mode validation is allowed only inside the implementation sequence while proving parity, not as the merged end state.

The revised 020 feature therefore has two promises:

- **Promise A — earlier 020 content stays valid**: one template source, one native crate location, one regenerate workflow, no hand-maintained native mirror.
- **Promise B — native rendering gets cheaper in staged steps**: first remove the clone boundary, then remove the intermediate transport entirely.

## Clarifications

### Session 2026-04-28

- Q: Does 020 fully own the retained baseline convergence work, or only assume it as a prerequisite? → A: 020 fully owns any remaining baseline convergence work and the Level 1/Level 3 optimization rollout.
- Q: Can Level 1 or Level 3 merge grammar-by-grammar, or must each level land across all supported grammars together? → A: Both Level 1 and Level 3 must land across `rust`, `typescript`, and `python` together before the feature is considered complete.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Native Askama rendering stops cloning field values at the context boundary (Priority: P1)

A maintainer working on the native render path needs the generated Askama structs to borrow already-rendered field values from the render-time context instead of cloning them out of `TemplateContext` one by one. The output must remain byte-identical, and authored `.jinja` files must not change.

**Why this priority**: This is the smallest safe optimization with the clearest payoff. It directly removes the dominant waste at the step-2→3 boundary without changing the broader architecture.

**Independent Test**: Regenerate one grammar, confirm the generated Askama structs use borrowed scalar/list field types, then run parity on both backends. The rendered bytes remain unchanged while the generated dispatcher no longer performs per-field `.cloned().unwrap_or_default()` work.

**Acceptance Scenarios**:

1. **Given** a template-backed native kind with scalar and list fields, **When** the grammar is regenerated after Level 1 lands, **Then** the generated Askama struct borrows those values from the render-time context instead of owning cloned copies.
2. **Given** the Level 1 native path, **When** the same `NodeData` is rendered through both backends, **Then** the rendered output remains byte-identical to the pre-optimization result.
3. **Given** existing canonical `.jinja` templates and filters, **When** Level 1 is enabled, **Then** they render correctly without authored template changes.

---

### User Story 2 - Native rendering can resolve fields directly from `NodeData` (Priority: P1)

A maintainer optimizing the native renderer needs the runtime pipeline to skip `TemplateContext` entirely once parity is stable. Instead of building `fields` / `fields_list` hash maps per render, generated per-kind render functions resolve the required data directly from `NodeData`, recurse only when needed, and feed Askama from that direct view.

**Why this priority**: This is the architectural payoff. It removes the remaining per-render field-map allocation layer and aligns the native runtime more closely with the actual model the code generator already knows.

**Independent Test**: On a representative grammar, generate per-kind direct-render functions beside the current path, switch dispatch to the direct functions, and run parity on both backends. The output remains byte-identical while the runtime no longer builds `TemplateContext` field maps for template resolution.

**Acceptance Scenarios**:

1. **Given** a leaf field whose text can be borrowed directly from nested `NodeData`, **When** Level 3 renders that field, **Then** it returns the existing text without recursive rendering or intermediate field-map allocation.
2. **Given** a structured required field, **When** Level 3 renders the parent kind, **Then** the generated resolve helper recurses only for that field and passes the result straight into the Askama struct.
3. **Given** a template-backed kind with children, separators, and flank metadata, **When** Level 3 renders that kind, **Then** it preserves the same output semantics as the prior pipeline while avoiding `TemplateContext`.

---

### User Story 3 - Optimization rollout remains reversible and parity-gated (Priority: P1)

A maintainer landing this feature needs each optimization step to be independently verifiable and reversible. Level 1 must be a self-contained gain. Level 3 must land in a sequence that can stop safely before cleanup if byte-identical parity is not yet proven.

**Why this priority**: The repository already depends on parity baselines as a hard gate. A partially removed render-preparation layer would be harder to recover from than a paused Level 3 rollout.

**Independent Test**: Review the implementation history and repository state after each milestone: helper introduction, per-kind render emission, dispatch switch, parity verification, cleanup. Each milestone can be validated without assuming the later ones have landed.

**Acceptance Scenarios**:

1. **Given** the beginning of Level 3, **When** direct-render helpers are introduced, **Then** the old `TemplateContext` path may still exist alongside them until parity is proven.
2. **Given** a parity regression in the direct-render path, **When** the rollback decision is made, **Then** Level 1 may remain while the direct-render cleanup is deferred.
3. **Given** the final Level 3 cleanup, **When** the obsolete preparation/filter infrastructure is removed, **Then** parity has already been proven on both backends for all supported grammars.

---

### User Story 4 - Contributors can explain both the retained baseline and the new optimization stages (Priority: P2)

A contributor reading the repository needs one coherent explanation of the native render architecture: canonical `.jinja` templates remain the source of truth, centralized native render crates remain the only valid native crate locations, Level 1 borrows from the legacy context, and Level 3 removes that context entirely.

**Why this priority**: The earlier 020 scope and the new optimization scope now coexist. If contributors cannot explain where templates live, where native crates live, and how Level 1 differs from Level 3, the repository will drift back toward accidental duplicate paths and ad-hoc rewrites.

**Independent Test**: A contributor unfamiliar with the change reads the updated spec, generator comments, and contributor docs, then correctly explains the canonical template path, native crate path, current native optimization level, and the staged Level 3 cleanup story.

**Acceptance Scenarios**:

1. **Given** the revised 020 documentation, **When** a contributor asks where templates live, **Then** the answer remains `packages/{lang}/templates/` for all grammars.
2. **Given** the same contributor asks where native render crates live, **When** they inspect the docs and generated artifacts, **Then** the answer remains `rust/crates/sittir-render-{lang}`.
3. **Given** the contributor asks what changed in Level 1 versus Level 3, **When** they read the relevant documentation, **Then** they find a clear distinction between borrowed `TemplateContext` rendering and direct `NodeData` rendering.

---

### Edge Cases

- **Field used in both scalar and list positions**: Existing canonical templates may still test a field for presence and also join/iterate it. Level 1 must preserve those usages with borrowed references, and Level 3 must preserve them via direct-resolution helpers.
- **Leaf vs structured field ambiguity at runtime**: Some generated decisions come from the model, but runtime data may still arrive in multiple structural shapes. Level 3 must short-circuit true leaf text and recurse only when structure is actually present.
- **Borrow lifetime split**: Level 3 Askama structs may need to borrow simultaneously from stack-local rendered strings and from text borrowed directly out of `NodeData`. The generated code must keep those lifetimes valid for the render call without leaking them outward.
- **Children separator / flank handling**: Direct child rendering must preserve separators, leading/trailing flank detection, and any per-kind format-driven child-join behavior that currently survives through the preparation layer.
- **Unknown or non-template kinds**: Kinds without a template-backed render function must continue to fall back safely to existing text behavior rather than forcing empty output or panics.
- **Retained convergence constraints still apply**: Optimization work must not reintroduce a second native template body, a grammar-local native crate path, or a second regenerate workflow as an implementation shortcut.
- **Generated-vs-handwritten boundary**: The feature may change codegen sources and hand-written native runtime helpers, but it must not normalize hand-edits to generated `templates.rs`, grammar package outputs, or native render crate artifacts.
- **Format-aware rendering behavior**: Existing format-aware rendering behavior, including tree-level cached format state and per-kind formatting data already modeled by prior features, must remain byte-identical before and after both optimization levels.

## Risk and Verification Gate

**Load-bearing assumption**: The earlier 020 convergence baseline and the parity baselines from features 016/017 either already hold or can be made to hold before optimization work begins. The optimization feature is not the place to absorb fresh parity debt.

The revised 020 gate has two checkpoints:

1. **Prerequisite Gate — stable baseline before optimization**
   - Canonical templates, centralized native render crates, and one `--all` regeneration workflow are the retained architectural target.
   - Parity ceilings must be zero on both TS and native backends for supported grammars before Level 1 starts.

2. **Optimization Gates**
   - **Level 1 gate**: prove on one grammar that Askama can consume borrowed scalar/list/children/text references from the existing render-time context with unchanged authored templates and unchanged filter behavior.
   - **Level 3 gate**: prove on one grammar and representative kinds that direct `NodeData` render functions can replace `TemplateContext` without output drift, including leaf fields, structured fields, list joins, separators, flank detection, variants, and current format-aware behavior.

**Decision rules**:

- **If Level 1 passes**: land it broadly and keep it even if Level 3 takes longer.
- **If Level 3 passes for the representative probe set**: continue the staged rollout and cleanup.
- **If Level 3 does not preserve byte-identical parity**: stop after Level 1, keep the old preparation path, and record the exact blocker before any cleanup removes `TemplateContext`-dependent infrastructure.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The earlier 020 convergence commitments remain active baseline scope for this feature, and 020 itself owns any remaining work needed to finish that baseline: one canonical template directory per grammar, one centralized native render crate per grammar under `rust/crates/sittir-render-{lang}`, one standard `--all` regenerate workflow, and no second native-only template mirror.
- **FR-002**: Optimization work MUST NOT begin until parity ceilings are zero on both TS and native backends for the supported grammars, using the parity baselines from feature 016 and the current format-aware render behavior as the regression gate.
- **FR-003**: Level 1 MUST be implemented as a codegen-driven native-render change. It MUST NOT require authored `.jinja` template edits, a JS-renderer redesign, a new N-API boundary, or a new user-facing render API.
- **FR-004**: In Level 1, generated Askama structs for template-backed kinds MUST borrow scalar field values, list field values, child collections, `variant`, and `text` from the render-time context instead of owning cloned `String` or `Vec<String>` copies.
- **FR-005**: In Level 1, the generated native dispatcher MUST replace per-field clone extraction with zero-copy borrows or equivalent borrowed access for every template-backed field that previously used `.cloned().unwrap_or_default()` or equivalent copy-out logic.
- **FR-006**: Existing Askama templates and current native filters MUST continue to render correctly against the Level 1 borrowed field surface without changing the authored template files.
- **FR-007**: Level 3 MUST replace the native runtime path `NodeData -> TemplateContext -> Askama struct -> output` with `NodeData -> per-kind render function -> Askama struct -> output` for template-backed kinds.
- **FR-008**: Level 3 generated per-kind render functions MUST resolve fields directly from `NodeData`, using model-driven strategies for required fields, optional fields, repeated fields, leaf fields, structured fields, variant-sensitive fields, and children.
- **FR-009**: Level 3 MUST inline or compile-time-embed metadata previously queried through runtime render metadata surfaces, including leaf-kind knowledge, separators, variant routing, and equivalent render-time facts needed to populate Askama structs.
- **FR-010**: Level 3 MUST preserve the current semantics for leaf short-circuiting, child rendering, separator/flank detection, variant routing, and format-aware rendering behavior while bypassing `TemplateContext`.
- **FR-011**: Level 3 MUST land in staged, independently verifiable steps: helper introduction alongside the current pipeline, per-kind render emission alongside the current dispatch, dispatch switch, parity verification, and only then cleanup of obsolete preparation/filter infrastructure.
- **FR-012**: If direct `NodeData` rendering cannot preserve byte-identical parity for representative kinds and grammars, the feature MUST stop after Level 1. Removing `TemplateContext`, `prepare.rs`, `GrammarMeta`, `filters.rs`, or equivalent preparation-only infrastructure is forbidden until parity proves stable.
- **FR-013**: The generated-vs-handwritten boundary from the earlier 020 draft remains in force. Implementation changes MUST land in hand-written sources such as codegen emitters and shared runtime helpers, not by hand-editing generated `templates.rs`, grammar package outputs, or generated native crate artifacts.
- **FR-014**: Contributor-facing documentation, commands, and examples MUST continue to describe one canonical template directory per grammar, one centralized native render crate per grammar, one regenerate workflow, and the distinction between Level 1 and Level 3 consistently.
- **FR-015**: Askama remains the template engine for this feature, canonical `.jinja` files remain the authored template surface, and the current `render(node_json) -> String` N-API boundary remains unchanged.
- **FR-016**: Existing format-aware render behavior, including tree-level cached format state and any already-supported per-kind formatting data, MUST produce the same output before and after both optimization levels.
- **FR-017**: Level 1 and Level 3 are both whole-feature rollouts across the supported grammars. `rust`, `typescript`, and `python` MUST all complete a given level before that level is considered done for this feature; a grammar-by-grammar merged end state is not allowed.

### Key Entities *(include if feature involves data)*

- **Canonical Template Directory**: The per-grammar `packages/{lang}/templates/` directory that remains the only authored template surface for both runtimes.
- **Centralized Native Render Crate**: The generated crate at `rust/crates/sittir-render-{lang}/`, retained from the earlier 020 scope as the only valid native render crate location.
- **NodeData**: The render input model whose fields, children, text, and format data become the direct source for Level 3 per-kind render functions.
- **TemplateContext**: The current native preparation-layer transport containing rendered field maps, child lists, text, variant, and flank metadata. It remains only as the Level 1 source surface and the pre-Level-3 legacy path.
- **Borrowed Askama View**: The Level 1 generated struct surface that borrows field/list/child/text/variant data from the existing render-time context instead of cloning it.
- **Direct Render Function**: A generated Level 3 per-kind function that resolves the right field values from `NodeData` and constructs the Askama struct without building `TemplateContext`.
- **Resolve Helper Set**: The small shared helper surface for leaf, optional, required, repeated, variant, and child resolution that supports Level 3's direct-render functions.
- **Verification Gate**: The staged proof that Level 1 compiles and preserves parity, and that Level 3 preserves byte-identical output before cleanup removes the legacy preparation layer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All supported grammars continue to pass parity on both backends after Level 1 and again after final Level 3 cleanup. Counts from `specs/016-parity-regressions/baselines/{ts,native}.json` stay equal or improve.
- **SC-002**: For a representative 7-field template-backed node, the native render path performs zero step-2→3 scalar/list clone operations after Level 1. The generated native dispatcher no longer uses per-field `.cloned().unwrap_or_default()` or equivalent copy-out logic for those fields.
- **SC-003**: Canonical authored `.jinja` templates remain unchanged by Level 1 and remain the only authored template surface throughout the feature.
- **SC-004**: After the Level 3 dispatch switch, the native runtime allocates zero per-render field and field-list hash maps for template resolution.
- **SC-005**: After final Level 3 cleanup, the obsolete preparation-only native render layer (`TemplateContext` construction plus preparation-only metadata/filter bridge code) no longer exists in the runtime path.
- **SC-006**: Running the standard regenerate workflow for a supported grammar is still sufficient to refresh both TS and native artifacts before parity is run; no extra native-only regenerate step is introduced by the optimization work.
- **SC-007**: Representative formatted and unformatted fixtures render byte-identically before and after each optimization level, demonstrating that the feature did not change existing format-aware output behavior.
- **SC-008**: The Level 1 and Level 3 verification-gate results are recorded in the 020 planning/research artifacts before cleanup removes the legacy preparation path.

## Out of Scope

- **Askama elimination (future Level 4)**. This feature changes how Askama structs are populated, not whether Askama is used.
- **Changing the canonical `.jinja` template files as an engine split**. Templates remain the shared source of truth rather than becoming backend-specific.
- **Changing the N-API render boundary**. `render(node_json) -> String` remains the public native entry point.
- **New grammar features or unrelated parity fixes**. 020 only addresses retained convergence constraints plus native render-pipeline optimization.
- **Per-node format caches or broader format-inference redesign**. Existing tree-level format state and supported per-kind format mappings remain as-is.

## Assumptions

- The earlier 020 convergence baseline (single canonical template directory, centralized native render crates, one standard regenerate workflow, no native template mirror) is part of this feature's owned scope. If any of it is still incomplete at implementation time, 020 finishes that baseline before or alongside Level 1 rather than treating it as a separate prerequisite feature.
- Parity baselines from feature 016 and current format-aware render behavior from feature 017 remain the authoritative regression gate for this feature.
- Askama can consume the borrowed scalar/list/child/text surfaces needed for Level 1 without requiring authored template changes.
- Direct `NodeData` rendering can coexist beside the legacy `TemplateContext` path long enough to stage, validate, and if needed pause the Level 3 rollout safely.
- The code generator already has, or can derive, enough model information to choose among leaf, optional, required, repeated, variant, and child-resolution strategies per field without introducing a second hand-maintained metadata source.
- Only the native render path is being optimized here. The JS render engine keeps its current behavior except for staying output-compatible with the optimized native path.
