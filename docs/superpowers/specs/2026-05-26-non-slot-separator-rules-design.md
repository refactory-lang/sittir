# Non-slot separator rules — `separator`-role child slots with a `delimits` relationship

> **Status:** Design (brainstormed 2026-05-26). A **separate** design — its own brainstorm→spec→plan.
> It refines the slot model that `2026-05-22-compiler-simplification-design.md` §1/§2 also touch, but it
> is **NOT PR-A and NOT folded into the strangler's existing PRs**. Sequence after the strangler
> stabilizes (or independently).

## Problem

The value model carries `separator?: string` (a single literal) + `trailing?`/`leading?` bools per slot
(`node-map.ts:175-177`). That can't represent **rule-shaped separators** — `choice(',', ';')`,
`optional(',')`, a token rule. Today the rich rule-level separator (`RuleBase.separator` =
`string | Rule[] | object`) is **lossily flattened** to one string by `separatorToString`
(`templates.ts:1067`). `project_multi_separator_templates` catalogs the gaps: choice-of-separator,
optional separator, mixed-per-occurrence, terminator-vs-separator, per-field flank flags.

**Two insights that shape the model:**
- A separator **is a child** in tree-sitter's CST (an anonymous/token child) — so it's a *child slot*, not
  a parallel "non-slot" structure.
- Its realization is **passed through verbatim**, not classified. We do **not** need to know *which* arm
  of a `choice` was picked at parse time; we preserve the actual token and re-emit it.

## Model

A **rule-shaped separator** (`choice`/`optional`/token — *not* a fixed literal) is a **child slot** with
**`role: 'separator'`**:

- **Verbatim pass-through value** — the actual separator token text (`project_verbatim_transport_pattern`'s
  text-only carrier), never a classified choice arm. "Don't know which arm; pass it through."
- **Single-or-per-gap, stored on the content slot** — the common *uniform* case stores **one** separator
  value (the list's separator); the rare *genuine-mixing* case stores a **per-gap list** aligned to the
  elements. Which applies is the content slot's separator multiplicity, grammar-derived — no special
  capture-shape machinery. (Read preserves each gap's token, so even a mixed list round-trips faithfully.)
- **`delimits: <contentSlotId>`** — a **slot-to-slot edge** to the content slot this separator delimits,
  plus **placement** (`infix`, `trailing?`, `leading?`). This is a genuinely new relational fact in the
  (today flat) slot model; it is intrinsic + grammar-derived, so it is modeled **explicitly**, not via a
  `propose-*` diagnostic.
- **Storage folds onto the content slot (decided).** The `separator`-role slot + `delimits` are **read-time
  structure** — they bucket the CST separator children and route each to its content slot. The pass-through
  value is **stored on the content slot** it delimits (the list carries its separator), NOT under a
  standalone `_separator` Config key. One home for the value, no parallel separator list to keep aligned;
  render reads the separator **directly** from the content slot (no `delimits` cross-lookup at runtime).

## Read / round-trip

The interleaved CST children are **bucketed by `role`** (content vs separator) and aligned to their content
slot via `delimits`. Separator tokens are preserved verbatim. Render walks the content slot's values and
**interleaves the separator slot's tokens at the gaps** per `delimits` + placement → byte-faithful by
construction. This subsumes the `project_multi_separator_templates` gaps (the lossy single-`joinByField`
separator, the global `joinByTrailing`/`joinByLeading` flags, mixed-per-occurrence).

## Construct / surface

Content slots stay the **primary** surface (positional/named factory args + `_`-prefixed Config storage).
The separator + flank flags ride an **options block on the Config surface (#2)** —
`{ separator?, trailing?, leading? }` — **settable via the factory + defaulted** when omitted; types (#1)
reflect it; render (#6) reads the separator from there. **This options block IS the content slot's separator
storage** (per the Model's storage decision) — one home, not a standalone separator-slot key. Keeps the
primary surface clean; the separator is an optional knob. "Per-slot default, per-occurrence where needed" lives here: the options block defaults one
separator for the whole list, with a per-gap override for the rare genuine-mixing case.

## Fixed-literal separators

Stay **render constants** (today's behavior) — a constant separator round-trips trivially and needs no
pass-through. Only **rule-shaped** separators become `separator`-role slots. So the new mechanism targets
exactly the gap, not all separators.

## Derivation (deterministic, no guessing)

A `separator`-role slot + its `delimits` edge + placement are derived from the **repeated-`seq` structure**:
the delimiter member (the non-content, rule-shaped element co-located with the content element in
`repeat(seq($content, sep))` / `seq($content, sep, repeat(seq(sep, $content)))`) becomes the separator slot,
`delimits` → the content slot, placement from where the separator sits relative to the element. Per-occurrence
(list) vs singular = normal multiplicity. A separator the derivation can't deterministically attach to a
content slot → a diagnostic, never a silent guess (#4).

## Model additions (summary)

1. **`role` on slots** — `content` (today's default) vs `separator`. The only new slot attribute.
2. **`delimits` slot-to-slot edge** — separator → content slot, grammar-derived (a new relational fact).
3. **Options block on the Config surface (#2)** — `{ separator?, trailing?, leading? }` — the construct knob.

`role` + `delimits` are **read-time** model facts; the **value is stored on the content slot** (surfaced via
the options block) — no standalone separator-slot storage key. Render placement-by-role is the behavioral
change (the multi-separator memory's gap). No new top-level structure — a separator is a *child slot* for
*reading*, with a delimiter role + a `delimits` relationship, whose value **folds onto the content slot** it
delimits.
