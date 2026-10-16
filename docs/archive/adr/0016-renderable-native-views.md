# ADR 0016 — Renderable native views and streaming join filters

**Status**: Accepted (2026-04-29)
**Date**: 2026-04-29
**Related**: ADR-0015 (model-driven native render contract), ADR-0014 (shared `.jinja` template surface), specs/012-rust-core-port/

## Context

ADR-0015 settled **where native render-slot truth comes from**: the Rust
Askama surface is model-driven via a walker-owned render contract, not from raw
template scans and not from an exploded `foo + foo_list + foo_*_sep` bundle.

That still leaves a second render-side question open: **what values should the
native view layer carry, and where should typed projection happen?**

The current post-ADR-0015 direction uses borrowed native views such as
`ListView<'a>` and `FieldView<'a>`, but those views are still fundamentally
string-backed and sit downstream of an erased JS→Rust `NodeData`-style
boundary. That is correct and much cleaner than the old exploded surface, but
it means:

- join-style filters conceptually operate on already-rendered text
- Rust still pays for a generic runtime shape even when the JS side already
  knows the exact per-kind type being sent

Askama's public filter-output surface suggests a stronger follow-up design is
possible. The practical findings are:

- custom filters do not have to collapse to `String`
- Askama can write filter results through public traits like `FastWritable`
- wrapper types like `Safe<T>` / `MaybeSafe<T>` are part of the supported
  public surface
- templates themselves already participate in Askama's fast writable path

That opens the door to a stronger end-state:

- JS sends **plain objects over N-API**, not JSON text
- those objects mirror the existing generated per-kind TypeScript interfaces,
  but as **data-only transport objects**
- Rust decodes directly into matching generated per-kind transport types
- field/list views carry **renderables** rather than pre-rendered strings
- filters like `joinby` return a wrapper that Askama writes directly

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

Sittir's end-state native render architecture moves typed projection **before**
the JS→Rust boundary and moves value composition **onto renderables**. JS sends
plain N-API object graphs that mirror the existing generated per-kind
TypeScript interfaces in data-only form. Rust decodes those objects directly
into matching generated transport structs/enums instead of a generic erased
`NodeData` envelope. Generated `from_transport(...)` bridges then build the
Askama-facing view layer. `FieldView` / `ListView` carry a small closed
renderable family rather than only strings, and join-style filters like
`joinby` return streaming wrappers (`FastWritable` + `Display`, typically inside
`Safe<T>` when required). Slots may short-circuit to `Renderable::Text(...)`
whenever they are already final render-ready text, whether that text came
straight from parser-owned fields or from a pre-rendered intermediate. This
remains a follow-up to ADR-0015, not a replacement for it: ADR-0015 owns slot
truth and struct shape; this ADR owns the typed transport/value representation
carried by those model-driven native views.

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
  - JS can send familiar grammar-shaped plain objects over N-API without paying
    for a generic Rust-side `NodeData` decode layer
  - Askama can stay on its fast writable path for more of the native render
    pipeline

- **Costs**:
  - generated transport types now exist on both sides of the JS→Rust boundary
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
2. JS→Rust transport uses plain object graphs matching generated per-kind TS
   interfaces, not JSON text and not an erased runtime envelope.
3. `FieldView` / `ListView` can carry renderable values without regressing the
   shared template contract from ADR-0015.
4. Native Askama rendering can compose those values directly through public
   Askama traits and wrappers.
