# ADR 0015 — Model-driven native render surfaces via walker-owned render contract

**Status**: Accepted (2026-04-29)
**Date**: 2026-04-29
**Related**: ADR-0014 (shared `.jinja` template surface), specs/020-template-engine-converge/, specs/012-rust-core-port/

## Context

ADR-0014 made the `.jinja` files the canonical shared template surface for both
the TypeScript/Nunjucks renderer and the Rust/Askama renderer. The first Rust
Askama integration got that working, but its generated struct surface was still
driven by template-era compromises rather than the assembled model:

- nearly every generated Rust template struct received a uniform exploded bundle
  like `foo`, `foo_list`, `foo_leading_sep`, `foo_trailing_sep`, plus broad
  `children`, `variant`, and `text` fields
- the Rust template-copy step rewrote canonical list usage to `_list`-specific
  fields
- when that bundle was partially removed, a fallback regex scan of canonical
  `.jinja` text was needed to recover missing slot usage and requiredness

That shape worked, but it violated the repo's DRY rule in exactly the wrong
place: render-surface knowledge existed in template text, emitter heuristics,
and assembled metadata at the same time.

The render-side cleanup established two stronger facts:

1. the assembled model already knows most of what the native renderer needs
   (field multiplicity, requiredness, flank behavior, text-template cases,
   structural children)
2. the remaining render-specific facts should be projected once into an
   explicit render contract, not rediscovered later by scanning template text

This led to a new split of responsibilities:

- **model -> template**: canonical `.jinja` emission
- **model/render contract -> Rust**: native Askama struct surface
- **not** template -> Rust

## Forcing Constraint

> "model -> rust, model -> template, not template -> rust"

And, when the temporary scan fallback surfaced:

> "why would there be anything the template knows that either
> AssembledField/Child/AssembledNode wouldn't?"

Those two statements collapse the architecture question to a single rule: if the
Rust emitter must learn something by scanning canonical template text, the
render contract is missing a projection.

## Alternatives Considered

- **Keep the old exploded Rust struct bundle.** Rejected. It preserves
  `foo + foo_list + foo_*_sep + text + variant` whether or not the model or the
  template actually needs those slots, and it keeps Rust-specific baggage in the
  generated surface indefinitely.

- **Keep raw-template scanning as the durable source of Rust slot truth.**
  Rejected. A regex scan can be a debugging aid or a temporary migration
  crutch, but not the architectural source of truth. It creates lasting
  template-only knowledge and duplicates information already present in the
  model/render lowering.

- **Introduce a separate hand-authored sidecar describing render slots.**
  Rejected. That would solve the scan problem by creating a second source of
  truth. The render contract must be derived from existing model/lowering data,
  not manually maintained beside it.

## Decision

Sittir's native render surface is now generated from a **walker-owned render
contract** plus assembled-model facts, not from raw template-body scans and not
from a uniform exploded slot bundle. The canonical `.jinja` files remain the
shared authored surface. `template-walker.ts` owns render-slot discovery and
produces explicit surface metadata (`usesChildren`, `usesVariant`, `usesText`,
optional slot information, and slot usage signals). The Rust emitter consumes
that contract together with assembled field metadata to emit the minimal honest
Askama struct surface: scalar-only fields as `&str`, list-only fields as
`ListView<'a>`, scalar-or-list fields as `FieldView<'a>`, `children` only when
the surface uses children, `variant` only when the lowered template actually
branches on variant, and `text` only for real text-template cases.

## Principles Applied

- **P-005 (Single source of truth)** — render-slot facts are derived once into a
  render contract instead of being re-derived from canonical template text.
- **P-006 (Consumer alignment)** — the Rust emitter now produces the shapes the
  native templates actually consume (`&str`, `ListView<'a>`, `FieldView<'a>`),
  instead of making every template pay for an over-emitted generic bundle.
- **P-003 (Reuse existing structure)** — the solution reuses assembled metadata
  and render lowering, rather than inventing a sidecar render schema.

## Consequences

- **Enables**:
  - Canonical `.jinja` files stay shared across Nunjucks and Askama without
    Rust-only field rewrites like `_list`.
  - Native Askama structs are smaller and more honest: no universal `text`,
    `variant`, separator, or `_list` fields unless the render contract/model
    actually needs them.
  - Borrowed native render surfaces (`ListView<'a>`, `FieldView<'a>`) handle
    scalar, list, and scalar-or-list slots without cloning-driven redesign.
  - The raw-template scan fallback in `render-module.ts` can be removed.

- **Costs**:
  - `template-walker.ts` becomes a load-bearing compiler surface, not a passive
    helper.
  - Render lowering must explicitly surface slot-usage facts that were
    previously recovered implicitly from template text.
  - Cardinality-polymorphic fields need deliberate widening to `FieldView<'a>`;
    that behavior is no longer hidden in a generic exploded bundle.

- **Follow-ups**:
  - When a future native missing-field regression appears, the fix belongs in
    the assembled model or render-contract projection, not in a new template
    scan.
  - Keep `variant` opt-in only; do not drift back to stamping it broadly on
    every generated struct.
  - Keep the canonical template subset intersection-safe for both engines, but
    treat slot discovery as a compiler concern rather than a template-string
    parsing concern.

## Verification

Revisit this ADR if either of these becomes true:

1. Rust render emission again needs durable regex/template-body scanning to
   discover slot truth.
2. The canonical `.jinja` surface and the native Askama struct surface drift so
   far apart that Rust-specific rewrites or sidecar slot declarations become
   necessary.

Current acceptance evidence:

1. `sittir-core` exposes borrowed native render views (`ListView<'a>` and
   `FieldView<'a>`).
2. Rust template-copy no longer rewrites canonical list usage to `_list` fields.
3. `template-walker.ts` owns render-slot discovery used by Rust emission.
4. The raw-template scan fallback in `render-module.ts` has been removed.
5. Rust / TypeScript / Python regenerated outputs, workspace build, workspace
   type-check, and full test suite remain green with the new render-side
   approach.
