# ADR 0016 — Renderable native views and streaming join filters

**Status**: Proposed
**Date**: 2026-04-29
**Related**: ADR-0015 (model-driven native render contract), ADR-0014 (shared `.jinja` template surface), specs/012-rust-core-port/

## Context

ADR-0015 settled **where native render-slot truth comes from**: the Rust
Askama surface is model-driven via a walker-owned render contract, not from raw
template scans and not from an exploded `foo + foo_list + foo_*_sep` bundle.

That still leaves a second render-side question open: **what values should the
native view layer carry?**

The current post-ADR-0015 direction uses borrowed native views such as
`ListView<'a>` and `FieldView<'a>`, but those views are still fundamentally
string-backed. That is correct and much cleaner than the old exploded surface,
but it means join-style filters conceptually operate on already-rendered text.

Askama's public filter-output surface suggests a stronger follow-up design is
possible. The practical findings are:

- custom filters do not have to collapse to `String`
- Askama can write filter results through public traits like `FastWritable`
- wrapper types like `Safe<T>` / `MaybeSafe<T>` are part of the supported
  public surface
- templates themselves already participate in Askama's fast writable path

That opens the door to a render surface where field/list views carry
**renderables** rather than pre-rendered strings, and filters like `joinby`
return a wrapper that Askama writes directly.

## Forcing Constraint

> The safest architecture is:
>
> 1. custom renderable wrapper implements `FastWritable` + `Display`
> 2. filter returns that wrapper, probably inside `Safe<T>`
> 3. field/list views carry those wrappers instead of rendered strings

## Alternatives Considered

- **Keep string-backed native views indefinitely.** Rejected as the long-term
  design. It is simple and correct, but it leaves join/filter composition on the
  far side of rendering rather than on the renderable side of the boundary.

- **Build on Askama internals like `WriteWritable` / `AutoEscape`.** Rejected.
  Those paths are explicitly not the stable extension surface; the design should
  target public traits and wrappers only.

- **Jump straight to trait-object-heavy renderables everywhere.** Rejected as
  the default framing. It may be useful later, but the first-class decision is
  about the boundary shape (`FastWritable` renderables), not about committing to
  one specific dynamic-dispatch strategy prematurely.

## Decision

The next-step native render design is to move from string-backed field/list
views toward **renderable native views**. `FieldView` / `ListView` should carry
renderable values, not only rendered strings. Join-style filters like `joinby`
should return a wrapper that implements `FastWritable` and `Display`, likely
wrapped in `Safe<T>` when escape semantics require it, so Askama can stream the
joined result directly. This remains a follow-up to ADR-0015, not a replacement
for it: ADR-0015 owns slot truth and struct shape; this ADR owns the value
representation carried by those model-driven native views.

## Principles Applied

- **P-006 (Consumer alignment)** — the Askama side should consume values in the
  shape it already knows how to write efficiently, rather than forcing every
  filter result through `String`.
- **P-003 (Reuse existing structure)** — the design reuses Askama's public
  `FastWritable` / `Display` / `Safe<T>` surface instead of inventing a custom
  side channel for renderability.
- **P-007 (Cut speculative scope)** — this ADR commits only to the renderable
  boundary and public extension points, not to a fully generalized trait-object
  architecture up front.

## Consequences

- **Enables**:
  - join-style filters can become streaming wrappers rather than
    string-producing helpers
  - field/list views can carry subtemplates or renderable wrappers directly
  - Askama can stay on its fast writable path for more of the native render
    pipeline

- **Costs**:
  - the native view layer becomes more abstract and must distinguish
    renderability from already-rendered text explicitly
  - wrapper types will need careful lifetime and escaping design
  - filter signatures and view types must stay within Askama's public,
    semver-supported extension surface

- **Follow-ups**:
  - prototype a `joinby` wrapper that returns a renderable value instead of
    `String`
  - decide whether the concrete representation should start with generics,
    enums, or trait objects at the view boundary
  - ensure separator handling is borrowed or otherwise lifetime-safe rather than
    relying on leaks or similar shortcuts

## Verification

Revisit this ADR if either of these becomes true:

1. Askama's public `FastWritable` / `Display` / `Safe<T>` surface proves
   insufficient for real filter/view composition, forcing use of unstable
   internals.
2. The added abstraction outweighs its benefits, and measured implementation
   experience shows string-backed views are simpler without meaningful loss.

Signals that would confirm the design:

1. A prototype `joinby` returns a renderable wrapper rather than `String`.
2. `FieldView` / `ListView` can carry renderable values without regressing the
   shared template contract from ADR-0015.
3. Native Askama rendering can compose those values directly through public
   Askama traits and wrappers.
