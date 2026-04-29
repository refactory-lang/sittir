# Phase 0 Research: Jinja Template Migration

**Feature**: 011-jinja-template-migration
**Date**: 2026-04-21

Consolidates the engineering decisions that resolve the spec's implicit unknowns.
Each decision names what was chosen, why, and what was rejected.

---

## 1. TS render engine: Nunjucks

**Decision**: Use `nunjucks` (npm package) as the TypeScript-side render engine for Phase A.

**Rationale**:

- Jinja2-compatible syntax with an askama-compatible subset, which is the load-bearing constraint (FR-009, FR-010).
- Mature, maintained, browser-safe (works without `node:*` once configured with a FileSystemLoader replacement or precompilation — important per ADR-0013 Task 1's browser-safety guarantee).
- Supports precompilation (`nunjucks.precompile`) so Phase B's Rust side's compile-time validation is mirrored on the TS side with startup-time validation (no per-render parse cost).
- Whitespace control (`{%-` / `-%}`) lines up exactly with askama's semantics.

**Alternatives considered**:

- **`eta`** — smaller, faster, but uses a different template dialect. Would force authoring in a sittir-specific syntax, which breaks the "shared `.jinja` files across TS and Rust" requirement.
- **Hand-rolled Jinja parser** — rejected on Principle II (Fewer Abstractions) and maintenance burden. The whole point of this migration is to remove the hand-rolled substitutor.
- **Mustache / Handlebars** — too restrictive (no conditionals in Mustache; Handlebars dialect doesn't match askama). Breaks the shared-template guarantee.

---

## 2. Rust render engine: askama

**Decision**: Use `askama` (with `#[derive(Template)]` + `#[template(path = "...")]`) for Phase B.

**Rationale**:

- Compile-time template validation is the killer feature: unknown variables and syntax errors become `cargo build` errors (FR-020, SC-005). No template bug can reach runtime.
- Zero runtime parsing overhead — askama generates straight-line Rust code at build time. Drives SC-008 (Rust beats TS by ≥2× per node).
- Native support for per-file templates referenced by path (`#[template(path = "struct_item.jinja")]`) — avoids custom build scripts or proc macros.
- Active maintenance, strong typing, clean integration with `serde`-derived context structs.

**Alternatives considered**:

- **`tera`** — runtime-parsed Jinja engine. Would undo askama's build-time validation advantage; parity with Nunjucks improves but correctness guarantees weaken.
- **`minijinja`** — runtime engine, mature, but same problem as `tera` for our use case. Worth keeping as a fallback if askama's subset proves too restrictive in practice.
- **Custom proc macro** — rejected on Principle II. askama _is_ the proc macro we'd otherwise write.

---

## 3. Template authoring subset

**Decision**: Constrain authored templates to the Nunjucks ∩ askama intersection:

| Construct                                                                   | Nunjucks | askama            | Status                                      |
| --------------------------------------------------------------------------- | -------- | ----------------- | ------------------------------------------- |
| `{{ var }}`                                                                 | ✅       | ✅                | Allowed                                     |
| `{% if %}` / `{% elif %}` / `{% else %}` / `{% endif %}`                    | ✅       | ✅                | Allowed                                     |
| `{% for x in xs %}` + `loop.first`/`loop.last`/`loop.index`                 | ✅       | ✅                | Allowed                                     |
| Whitespace control (`{%-`, `-%}`)                                           | ✅       | ✅                | Allowed                                     |
| Comments (`{# ... #}`)                                                      | ✅       | ✅                | Allowed                                     |
| Filters: `join(sep)` / `length` / `default(v)` / `trim` / `upper` / `lower` | ✅       | ✅ (with aliases) | Allowed                                     |
| Template inheritance (`{% extends %}`, `{% block %}`)                       | ✅       | ✅                | **Forbidden** — not needed; adds complexity |
| Macros (`{% macro %}`)                                                      | ✅       | ⚠️ partial        | **Forbidden** — semantic divergence risk    |
| `{% match %}`                                                               | ❌       | ✅                | **Forbidden** — askama-only                 |
| Raw Rust / JS expressions                                                   | ❌       | ⚠️                | **Forbidden** — breaks shared templates     |

**Rationale**: The translator's loud-failure requirement (FR-005) catches any attempt to use a construct outside this set. Templates remain portable between runtimes by construction.

**Filter alias strategy**:

- Author templates always use the Nunjucks name (`upper`, `lower`, `length`, `default`, `trim`, `join`).
- Rust side registers aliases via askama's `#[template(syntax = ...)]` and custom filter registrations where the native askama name differs (e.g., `upper` → askama's `uppercase`).
- Alias registrations live in the Phase B crate's `src/filters.rs`. One source of truth; no drift.

**Alternatives considered**:

- **Standardize on askama names**. Rejected — Nunjucks names are closer to Jinja2 mainstream; more familiar to template authors.
- **Full Jinja2 feature set**. Rejected — breaks askama compatibility on inheritance + macros semantics.

---

## 4. Per-rule file layout

**Decision**: One `.jinja` file per rule per grammar, named `<rule_kind>.jinja`, stored at `packages/<grammar>/templates/<rule_kind>.jinja`.

**Rationale**:

- Askama's native convention (`#[template(path = "<name>.jinja")]`) maps directly.
- File-level diffs eliminate YAML block-scalar re-indentation noise (SC-006).
- IDE Jinja extensions recognize `.jinja` and provide syntax highlighting + variable linting (SC-006's secondary goal).
- Rule kinds follow tree-sitter's `[a-z_][a-z0-9_]*` convention — always filesystem-safe on Linux, macOS, and Windows.
- Enables per-rule precompilation granularity on both TS (Nunjucks) and Rust (askama) sides.

**Alternatives considered**:

- **Grouping by supertype** (e.g., all `_expression` forms in `expression/*.jinja`). Rejected — adds a directory taxonomy that drifts from the flat `NodeMap`. Every lookup becomes `<supertype>/<kind>.jinja` which complicates codegen and breaks the 1:1 rule→file mental model.
- **Single-file templates with one mega-template + rule selection**. Rejected — undoes Jinja engines' native "one template = one file" abstraction and reintroduces the `resolveTemplate` dispatch we're retiring.

---

## 5. Translator strategy

**Decision**: A one-shot TypeScript translator (`packages/codegen/src/emitters/jinja-translator.ts`) that reads the post-ADR-0013 `NodeMap` (not the YAML — the assembled representation) and emits `.jinja` files directly. The YAML emitter (`packages/codegen/src/emitters/templates.ts`) is replaced, not wrapped.

**Rationale**:

- The `NodeMap` is the single source of truth (ADR-0011 DRY enforcement). Translating from YAML would mean re-parsing our own output — a second derivation of the same facts.
- The translator becomes a codegen emitter that runs on every regeneration, not a one-shot migration tool. Future grammar changes produce updated `.jinja` files automatically.
- Existing YAML is retained during development only as a before/after diff artifact (for manual verification during Phase A bring-up). Deleted once byte-identical corpus is green.
- Mapping rules (FR-004) implemented as a pure function `AssembledNode → JinjaTemplate`. Unit-testable per rule kind.

**Alternatives considered**:

- **Shell-out translator working from `templates.yaml`**. Rejected — YAML is a derived artifact; operating on it creates a second source of truth at migration time. Post-migration it would be thrown away anyway.
- **Keep `templates.yaml` and emit `.jinja` alongside**. Rejected — two sources for rendering invites drift. The migration is the point.

---

## 6. `TemplateContext` shape

**Decision**: The context passed to each render is a plain bag produced by `prepare()` (ADR-0013 Task 3) with the following shape, identical on TS and Rust:

```ts
interface TemplateContext {
	[fieldName: string]: string | undefined; // pre-rendered named field slots (snake_case keys)
	children: string; // pre-joined, pre-filtered unconsumed named children
	children_list: string[]; // individual pre-rendered children for {% for %}
	variant: string; // node.$variant ?? ""
	text: string; // node.$text ?? ""
	trailing_sep: boolean; // flankSep(trailing) result
	leading_sep: boolean; // flankSep(leading) result
}
```

**Rationale**:

- Already produced (in conceptual form) by ADR-0013 Task 3's `prepare()`. This migration formalizes the shape as the template-engine-facing contract.
- Flat string-valued map of fields avoids the template engine having to descend into NodeData — which is load-bearing for the engine-agnostic guarantee.
- Rust mirrors via a codegen-emitted per-rule struct with matching field names. askama's `#[derive(Template)]` serializes from struct fields to template variables directly.

**Alternatives considered**:

- **Pass raw `NodeData` to the template engine**. Rejected — leaks sittir-internal shape into templates; couples templates to the NodeData format.
- **Nested context (per-field subrender)**. Rejected — forces templates to know about rendering recursion. The `prepare()` step exists precisely so templates don't.

---

## 7. Variant dispatch

**Decision**: Three rules retain explicit variant branching via `{% if variant == "..." %}` chains. All other rules render from a single `.jinja` file with no variant awareness (the child's own template handles variant-specific rendering via recursive render).

**Rationale**:

- ADR-0013 Task 2 already collapsed 21 variant blocks to 5 across the three grammars. The five genuinely-branching rules (`rust/visibility_modifier`, `typescript/export_statement`, `typescript/variable_declarator`, `typescript/call_expression`, `python/_match_block`) are enumerated.
- `$variant` already aligns with form names (no `_form_` prefix leakage verified in ADR-0013 Task 2 note).
- This is the same dispatch model used by `resolveTemplate`'s primary path today; we're just expressing it in Jinja instead of YAML.

**Alternatives considered**:

- **Template inheritance for variant rules**. Rejected per authoring-subset decision (§3) — inheritance is forbidden.
- **One file per variant form**. Rejected — fragments a rule's shape across 3+ files when a single `{% if %}` chain is ~5 lines.

---

## 8. Phase A / Phase B split

**Decision**: Phase A (TS Nunjucks swap + `.jinja` emission + `templates.yaml` deletion) ships as a standalone release before Phase B (Rust askama port) starts.

**Rationale**:

- Phase A has independent value (IDE support, removes hand-rolled substitutor, locks in template shape Rust will consume).
- Phase B depends on Phase A's `.jinja` files being authoritative. Landing them first de-risks Phase B.
- Cross-render parity test (Phase B's FR-021) requires both implementations; it would be meaningless without Phase A having landed.
- Phase A is entirely TS — no Rust toolchain requirement during its development. Phase B can be developed in parallel once Phase A merges.

**Alternatives considered**:

- **Ship A + B together**. Rejected — doubles the blast radius of a single PR. Bisecting regressions becomes hard.
- **Ship B first with Rust generating `.jinja` files**. Rejected — inverts dependency. TS codegen is the source of truth; Rust is a consumer of the codegen output.

---

## 9. Byte-identical validation strategy

**Decision**: Per-phase validation gates on the existing round-trip corpus with zero delta vs. the pre-migration baseline.

**Phase A gate**: run the corpus; diff rendered bytes. If any node produces a non-identical output, the PR is blocked.

**Phase B gate**: cross-render parity — run each corpus node through both TS and Rust renderers; byte-identical required on 100% of nodes.

**Rationale**:

- The round-trip corpus is the project's established quality gate (ADR-0011, constitution IV).
- Byte-identical is the only honest measure for a render-pipeline swap; any softer metric (node-shape equality, AST equality) hides bugs.
- The one pre-existing `raw_string_literal` failure on rust must remain exactly that — no new failures, no regressions on currently-passing tests.

**Alternatives considered**:

- **Ship with ≤1% rendering divergence tolerance**. Rejected — masks bugs. The migration is mechanical; any divergence is a translator bug.
- **Skip Phase B parity test; rely on Phase A coverage transitively**. Rejected — cross-render is the exact thing the migration must guarantee; inferring it from single-render is wrong.

---

## Open questions resolved via informed defaults

- **Precompile Nunjucks templates at codegen time vs. runtime load?** → Compile-once at first render, cache the template object per renderer. `createRendererFromConfig` already closes over the rules; extend it to also cache compiled Nunjucks `Template` instances.
- **Where do the `.jinja` files live in the published npm artifact?** → Inside the grammar package (`packages/<grammar>/dist/templates/`). Published via the package's `files` field. Consumers pick them up via the package's `createRenderer(templatesDir)` entry point.
- **How does the Rust crate find `.jinja` files?** → Copies them into `crates/sittir-render/templates/<grammar>/` at codegen time. askama's `#[template(path = "<grammar>/<kind>.jinja")]` resolves relative to the crate root.
