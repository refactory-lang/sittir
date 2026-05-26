# Override-surface consolidation: single rule-block authoring — SKETCH

> **Status:** SKETCH / pre-brainstorm (2026-05-26). **NOT** part of the compiler-simplification
> strangler (`2026-05-22-compiler-simplification-design.md`) and **NOT** PR-A — a *separate*
> future design/PR. Captured so the direction + open questions aren't lost; needs a proper
> brainstorm → spec → plan before any implementation. Do not entangle with PR-A.

## Idea

Collapse the override surface to a **single rule block** — no registration sidecars. Authors
write rules where they expect to (the rule block), using inline primitives; `wire` materializes
the result for both compilers.

**Primitives (all inline in the rule block):**
- **fresh rule** — `name: $ => seq(…)` (standard tree-sitter).
- **`transform(original, …)`** — thin **positional** patch on the inherited/upstream rule
  (`field`/`variant`/`alias` at positions). DRY against upstream (a diff, not a rewrite).
- **`match(pattern)`** — the **ELEVATE** primitive: structurally match a group's body-pattern →
  register/elevate it as a group kind. Replaces the `groups:` sidecar (purpose-built for the
  structural body-pattern a group *is* — not awkwardly forced into a position-patch).
- **`variant()` / `alias()`** — the **RELABEL** primitives, inline in `transform`/`match`.

**Dissolved:** the `transforms:` / `polymorphs:` / `enums:` / `groups:` sidecar keys. §4h's
ELEVATE ⊕ RELABEL becomes `match()` ⊕ `variant()`/`alias()`, inline in one surface.

## Why it's safe (the materialization history)

Everything-in-`rules:` used to break because tree-sitter's `dsl.js` and sittir's `evaluate.ts`
desugar the same grammar differently → IR-only "phantom" kinds. **`wire` fixed that by being the
shared seam** (inject into `grammar.js` before either compiler consumes it;
`project_every_kind_has_kindid_invariant`). **wire ensures materialization regardless of where
the patch is authored** — so collapsing the sidecars into the rule block is relabeling *within*
the wire seam, not a return to the broken IR-only model.

## Open questions (resolve in the brainstorm)

1. **Is `match` groups-only, or the general structural primitive?** Does `match` *also* carry
   `field`/`variant`/`alias` annotations — subsuming `transform`'s positional patches into ONE
   structural mechanism (positional `'0/1/0'` paths retire entirely)? Or is it `match` for groups
   + `transform` for positional field/variant/alias? Former = bigger simplification; latter =
   smaller blast radius.
2. **`match` structural semantics:** the don't-care / hole token (match a sub-shape, not the whole
   body — ast-grep-style metavar), and the ambiguity rule — unique match applies; `0` or `>1`
   matches → `fail`/`propose`, never a silent first-match (derive-or-diagnose #4).

## Properties (why it's appealing)
- One familiar surface (the rule block); no override taxonomy to learn.
- DRY preserved — `transform`/`match` overlay, don't duplicate/rewrite upstream.
- Structural `match` is **drift-detecting** — fails loudly if upstream shifts, vs a positional
  patch silently mis-applying at a now-wrong path.
- Explicit sequencing — patch-sets ordered within a rule; registration interleaves with structural
  patches at wire-time (both compilers see the ordered result).

## Relationship to the strangler
Conceptually refines §4h (registration) + PR-K, but is a **separate** design: the
compiler-simplification strangler keeps the *existing* override surface; this re-authors the
override DSL afterward (or independently). Sequence it after the strangler stabilizes.
