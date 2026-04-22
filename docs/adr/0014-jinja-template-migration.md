# ADR 0014 — Jinja per-rule template migration (feature 011)

**Status**: Accepted (2026-04-22)
**Date**: 2026-04-22
**Related**: ADR-0013 (pre-port cleanup — enabling prerequisite),
spec 011 (`specs/011-jinja-template-migration/`).

## Context

Sittir's runtime render pipeline historically consumed a single
`templates.yaml` per grammar — ~150 rules encoded as YAML entries
with an ast-grep-flavored `$VAR` placeholder dialect, processed by a
hand-rolled regex substitutor in `@sittir/core/src/render.ts`. This
format worked for the TS-only era but accumulated costs:

- **Substitutor complexity.** `render.ts` grew to 600+ lines of
  interleaved clause resolution, variant dispatch, field-vs-child
  promotion, flankSep adjacency probing, and FR-017 space absorption.
  Every rendering edge case lived in one file with mutable state
  threaded through closures.
- **No IDE support.** YAML-embedded template strings got no syntax
  highlighting, no variable linting, and YAML block-scalar
  reindentation produced diff noise when a single rule changed.
- **No path to a compile-time validator.** The Rust port
  (eventually) wants template errors surfaced at `cargo build`, not
  at first render. YAML-encoded `$VAR` templates have no standard
  tooling for that.
- **Variant-dispatch drift.** 21 `variants:` blocks across the three
  grammars; ADR-0013 Task 2 showed 16 of them carried identical
  entries (the variant child's own template handled dispatch). Dead
  weight the YAML format couldn't collapse without custom codegen.

## Forcing Constraint

> "The render engine needs to be expressible in a declarative engine
> so the Rust port can adopt askama's compile-time validation, and
> template authors need IDE-grade tooling on the template surface
> itself — neither is possible with the current YAML shape."
>
> — rationale for spec 011 / ADR-0013 Task 3 (`prepare()` extraction).

## Alternatives Considered

- **Keep YAML, extend the substitutor for pre-rendered contexts.**
  Rejected. Would keep the substitutor in place indefinitely and
  give the Rust port nothing to build on.
- **Migrate directly to a TS-side askama binding.** Rejected. No
  mature askama-compatible library exists in TS; would require a
  custom parser and break the "one template, two engines" guarantee.
- **Migrate to Handlebars / Mustache.** Rejected. Dialects don't
  match askama. Variants (`{% if variant == "..." %}` chains) require
  conditionals Mustache doesn't support.
- **Keep per-rule bodies in YAML but change placeholder dialect.**
  Rejected. Doesn't solve the IDE or compile-time-validation story;
  adds a flavor of Jinja that's nobody's standard.

## Decision

Migrate to **one `.jinja` file per rule per grammar**, stored at
`packages/<grammar>/templates/<kind>.jinja`. The runtime render path
in `@sittir/core` uses Nunjucks (Node-side); the future Rust port
will use askama consuming the same files. Templates are authored in
the **Nunjucks ∩ askama intersection** — interpolation, `{% if %}`,
`{% for %}`, whitespace control (`{%-` / `-%}`), comments, and a
standardized set of six filters (`join`, `length`, `default`, `trim`,
`upper`, `lower`).

## Principles Applied

- **P-001 (Generated code is derived, not authored)** — `.jinja`
  files carry an `{# @generated #}` header; `.editorconfig` disables
  trim_trailing_whitespace on them so regeneration produces stable
  diffs.
- **P-005 (Single source of truth)** — `translateToJinja()` is the
  only path from AssembledNode to a `.jinja` file. The YAML emitter
  (`emitTemplates` + `yamlStringify`) was deleted; no legacy
  template-yaml producer remains.
- **P-007 (Cut speculative scope)** — identical-variant blocks
  (from ADR-0013 Task 2) collapse automatically; only the 5 rules
  that genuinely branch on form retain `{% if variant == "..." %}`.
- **P-008 (Composition over configuration)** — per-rule file model
  replaces the single-giant-YAML with one artifact per unit.
  `prepare()` + `applyTemplate()` in core separate consumption
  tracking from substitution.

## Consequences

- **Enabled**:
  - Template edits produce single-file `git diff`s.
  - IDE extensions (`wholroyd.jinja`) provide syntax highlighting
    and basic linting; `.vscode/extensions.json` recommends them.
  - Rust askama port can reuse `.jinja` files verbatim once
    `@sittir/core` itself is ported to Rust (P-4 deferred, see
    spec 011 tasks.md).
  - Template authoring subset is enforceable (translator throws on
    out-of-subset rules; future CI lint rejects forbidden
    constructs introduced via hand-edit).
  - `@sittir/core/src/render.ts` keeps the legacy regex substitutor
    as a parallel code path for in-memory unit tests but the
    production render on all three grammars uses the Nunjucks path.

- **Costs**:
  - `@sittir/core` gained a runtime dependency on `nunjucks`
    (~200KB). Acceptable; browser-safety is deferred to the
    Rust→WASM path post-core-port per Principle IX.
  - `.jinja` file count: 448 checked in (rust 164, typescript 177,
    python 107). Stale-file cleanup in the emitter prevents drift.
  - Migration flagged translator bugs (brace-collision `{{{`,
    clause whitespace-strip, promoted-keyword filter) that didn't
    exist in the legacy substitutor. All fixed before cutover
    byte-identical on corpus.

- **Follow-ups**:
  - Phase 4 (Rust askama renderer) deferred until `@sittir/core` is
    ported to Rust. When that port lands, the askama path is built
    inside the ported core rather than as a standalone crate. See
    `specs/011-jinja-template-migration/tasks.md` Phase 4 banner.
  - Filter semantic-divergence audit (T046a) moves to the
    core-port spec when it exists — only meaningful when the askama
    side is wired up.
  - Hand-edit CI lint (T059) remains open for future tightening;
    current state is `.editorconfig` + `@generated` header.

## Verification

1. All three grammars' runtime render path uses Nunjucks: verified by
   `grep "createRenderer(join(__dirname, '..', 'templates'))"` in
   each generated `packages/<grammar>/src/factories.ts`.
2. No `templates.yaml` file exists in any grammar package — confirmed
   by directory listing.
3. No code path produces `templates.yaml` output — `emitTemplates`
   deleted (commit `fe4375b`), `templatesYaml` removed from
   `GeneratedFiles`, CLI no longer writes it.
4. Full test suite baseline preserved: 1415 passing + 1 pre-existing
   `raw_string_literal` failure; corpus validators
   (`validateRoundTrip`, `validateFactoryRoundTrip`, `validateFrom`,
   `validateTemplateCoverage`, `validateRenderable`) all green across
   rust, typescript, python.
5. Per-rule `.jinja` files carry the `@generated` header and are
   committed under each grammar package's `templates/` directory.

## Implementation tracking

Phase 3 (US1 MVP) — complete:
- T001–T012: setup + TemplateContext contract + translator skeleton
  (commits `10427ae`, `d501e02`)
- T013–T020 + T020a: translator mapping rules (commit `5a88766`)
- T021, T022: emitJinjaTemplates + writeJinjaTemplates (commit `5888bdd`)
- T023: YAML emitter retired end-to-end (commit `fe4375b`)
- T024–T028: Nunjucks bridge + error wrapping (commit `bc8dec4`)
- T029–T034: per-grammar runtime cutover; `templates.yaml` deleted
  across rust, typescript, python (commit `6cb667f`)
- T035–T039: integration + legacy `.yaml` path removal (commit `49326cb`)
- Phase 4 deferred banner + spec status update (commit `d82ae97`)

Phase 5 (US3 ergonomics) + Phase 6 (polish) complete in a follow-up
commit after this ADR lands.
