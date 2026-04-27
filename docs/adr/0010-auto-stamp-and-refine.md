# ADR 0010 — Auto-stamp single-literal fields; `refine()` for correlated choices; path syntax alignment

**Status**: Proposed
**Date**: 2026-04-21
**Related**: ADR-0008 (declarative transforms + `$`-prefix NodeData), ADR-0009 (wire owns synthesis)

## Context

Sittir's factory surface today asks the user to supply every field the
grammar declares, even when the field's type resolves to a single string
literal:

```ts
ir.breakStatement({
	break: "break", // typed as "break" — the ONLY valid value
	label: "outer",
});
```

The `break` keyword is information-free ceremony. The grammar baked the
constant into the rule; the factory re-asks the user to reproduce it.
Same pattern fires when a field's type is a 2+ literal union that the
grammar models as an independent choice even though the choices are in
practice **correlated** with choices elsewhere in the rule:

```ts
// tree-sitter-typescript: interface_body
interface_body: $ => seq(
    field('opening', choice('{', '{|')),
    field('members', repeat(...)),
    field('closing', choice('}', '|}')),
)
```

Positions 0 and 2 are not independent — `{` always pairs with `}`,
`{|` always pairs with `|}`. Tree-sitter's grammar doesn't encode the
correlation because both forms parse correctly under independent
choices. Sittir's codegen faithfully reflects the grammar, producing:

```ts
ir.interfaceBody({
    opening: '{',      // typed as "{" | "{|"
    members: [...],
    closing: '|}',     // mismatch accepted
})
```

Two issues at once: (a) the authoring ceremony of re-typing mandatory
constants, (b) no type-level prevention of `{` / `|}` mismatches.

Two grammars in the tree exhibit pattern (b) today
(`interface_body`, `object_type` in TypeScript). Several rules in
Rust / Python exhibit pattern (a) with single-literal keyword fields
(e.g. `break_statement.break`, `continue_statement.continue`,
`return_statement.return` where the grammar fielded the keyword).

## Non-problems

- **`variant()` polymorphs** — forms with structurally distinct
  content (`struct_item_brace` vs `struct_item_tuple` — different
  fields each). These need tree-level aliases; the existing primitive
  is correct for that case.
- **Single literal delimiters** baked into the template at codegen
  time (`block`'s `{` and `}` that aren't fielded) — no runtime concern.
- **External-scanner tokens** (`raw_string_literal_start` /
  `raw_string_literal_end`) — a separate problem; out of scope here.

This ADR covers **single-literal fields** and the **correlated-choice
refinement** case only.

## Forcing Constraint

> "Supplying `'{'` as parameter seems ridiculous." — user, this session

The authoring ergonomics say: constants belong to the factory, not the
config. Any field whose resolved type is a single string literal — either
because the grammar declares it that way, or because `refine()` narrowed
a choice down to one branch — should be stamped by the factory and
absent from the `Config` shape. Asking the user for mandatory constants
is ceremony without information.

## Alternatives Considered

- **Tag `refine()` output with `$variant`.** Rejected (per this
  session). `$variant` is reserved for `variant()` polymorphs where the
  tree-kind genuinely differs (`struct_item_brace` vs
  `struct_item_tuple`). Refine leaves the grammar untouched; the form is
  fully recoverable from the constant values already in `$fields`.
  Marking a separate `$variant` tag would duplicate the information and
  break round-trip equality with readNode-produced NodeData.

- **Per-form templates (refine-specific render dispatch).** Rejected —
  refined rules differ only in constant field values. The existing
  single-template render reads `$fields[name]` and emits whatever's
  there, which is already the correct per-form text.

- **Auto-stamp only for refined fields, not the general case.**
  Rejected. Once the general rule exists ("single-literal field's value
  lives on the factory, not the config"), refine doesn't need its own
  omission logic — it narrows a union type, phase 1's rule fires on the
  narrowed shape. One general rule beats two overlapping ones.

- **`$variant` inferred by readNode from delimiter text.** Rejected
  — duplicates data that's already in `$fields`. Any consumer that
  needs "which form?" reads `$fields.opening` directly.

- **Delay refine's path syntax migration.** Rejected — `refine()` uses
  the path parser, and the two path additions (`name:` field traversal,
  `(name)` kind match) are cleanest to land with the primitive that
  motivates them.

## Decision

Ship in two phases, one ADR:

### Phase 1 — Auto-stamp single-literal fields

**Codegen rule:** If a field's resolved type (after stripping
`Optional<>`) is a single string-literal union — i.e. `"break"`, or
`"async"`, or `'{'` — the factory emits the constant into `$fields[name]`
directly and the corresponding `Config` interface omits the field.

Consequences at the factory surface:

```ts
// Before:
ir.breakStatement({ break: "break", label: "outer" });
// After:
ir.breakStatement({ label: "outer" }); // "break" stamped automatically
```

**Applies today** to any field whose grammar-derived type union collapses
to a single literal. No DSL change, no new primitive. Pure emitter
logic in `packages/codegen/src/emitters/{types,factories}.ts`.

**Preserved:** the factory output still carries `$fields.break = 'break'`
— same NodeData shape as before, same as readNode produces. Only the
input surface changes.

### Phase 2 — `refine()` primitive

New DSL primitive, factory-only, zero runtime footprint:

```ts
import { refine } from '@sittir/codegen/dsl'

interface_body: ($, original) => refine(original, {
    curly: { 'opening:': '{',  'closing:': '}'  },
    flow:  { 'opening:': '{|', 'closing:': '|}' },
}),
```

Reads as: "`curly` form selects `{` at the opening field and `}` at the
closing field; `flow` form selects `{|` and `|}`."

Semantics:

- The rule is unchanged structurally — tree-sitter parses with the
  original rule. No new kinds in `node-types.json`, no aliases.
- Each form produces a namespace-keyed factory:
  `ir.interfaceBody.curly(config)`, `ir.interfaceBody.flow(config)`.
- The bare call `ir.interfaceBody(config)` defaults to the
  **first-declared** form. Authors order entries so the common case
  comes first.
- Each form's Config **narrows** the refined fields' types from the
  choice union (`"{" | "{|"`) to the selected literal (`"{"`). Phase 1's
  auto-stamp rule then fires on the narrowed type and omits the field
  from the Config.
- The factory output stamps the resolved constants into `$fields` — same
  NodeData shape as readNode produces. No `$variant` tag, no
  discriminator.

Round-trip: readNode and refine-factory produce identical NodeData
shapes. Any consumer that wants "which form is this?" inspects
`$fields.opening` (or any other refined position) directly.

### Phase 3 — Path syntax alignment

Bundled because `refine()` uses paths and the syntax changes are small.

Current path vocabulary:

| Segment  | Meaning                                                | Status                         |
| -------- | ------------------------------------------------------ | ------------------------------ |
| `N`      | Positional index, 0-based                              | Unchanged                      |
| `-N`     | Reverse index from end                                 | Unchanged                      |
| `_`      | Wildcard — any member at this level                    | **Migration from `*`**         |
| `(name)` | Kind match — named or anonymous                        | **Migration from bare `name`** |
| `name:`  | Field traversal — descend through `field('name', ...)` | **New**                        |

Rationale:

- **`*` → `_`** — aligns with tree-sitter's query language (`_` is the
  wildcard-node symbol); removes the asterisk which clashes with grammar
  literals like Rust's `choice('-','*','!')`.
- **bare `name` → `(name)`** — aligns with tree-sitter's query syntax
  for named-kind match; disambiguates from the new `name:` field
  segment; lets `parsePath` reject unknown segment forms rather than
  silently matching identifier-shaped text as a kind.
- **`name:` field traversal** — addresses `field('name', ...)` wrappers
  by name instead of positional index. More readable and robust to
  grammar-position drift.

Migration cost: one override line (Rust's `'2/_expression'` →
`'2/(_expression)'`) plus test updates. Zero current uses of `*` in
paths. Single atomic commit.

Error behavior:

- `*` as a path segment: syntax error. Message names `_` as the
  replacement.
- Bare kind name: syntax error. Message names `(name)` as the
  replacement.
- `name:` at a position whose field has a different name: hard error
  naming the expected and actual field names. (Silent no-match is a
  footgun; strict errors match sittir's path-mode convention.)

## Principles Applied

- **P-005 (Single source of truth)** — the form-selected constant lives
  in `$fields` once. No redundant `$variant` tag. Auto-stamp keeps the
  factory output shape identical to readNode's.
- **P-007 (Cut speculative scope)** — refine produces no new kinds, no
  grammar modification, no render-engine changes. Single-template render
  already works because the data distinguishing forms is in `$fields`
  where it always was.
- **P-008 (Composition over configuration)** — phase 1 is a general
  rule that phase 2 piggybacks on. Phase 2 narrows a type; phase 1
  reacts. No per-primitive omission logic.

## Consequences

- **Enables**:
  - Removes mandatory-constant ceremony from the factory surface across
    all grammars (phase 1 alone).
  - Type-level prevention of correlated-choice mismatches
    (`ir.interfaceBody.curly({ opening: '{|' })` is a type error).
  - Path syntax parity with tree-sitter's query language — onboarding
    benefit for anyone familiar with tree-sitter queries already.
  - Future refine use cases (any grammar gaining a correlated-choice
    pattern) need no new machinery.

- **Costs**:
  - Phase 1 changes the `Config` shape for several existing factories —
    any consumer code supplying now-auto-stamped fields as config
    entries type-errors. Fix: remove the redundant entry. Minor.
  - Path migration: one override line + test updates, one atomic
    commit. Trivial.
  - Refine's first-form-default means reordering entries silently flips
    the default. Mitigation in the codegen emitter: emit a comment in
    the generated factory naming the default form so a `git diff`
    on regenerated code surfaces any unintended flip.

- **Follow-ups** (post-ADR, order-independent):
  - **External-scanner token handling** (`raw_string_literal`, Python
    `string`, TypeScript `template_string` if/when varied). Needs
    per-pair synthesis declarations. Separate spec.
  - **Variant defaults** — analogous first-form-default for
    `variant()` polymorphs (make `ir.structItem(config)` default to
    brace form). Different implementation because polymorphs are
    nested-alias kinds; kind-level namespace defaulting needed.
  - **Typed `refine()` signature** — generic grammar-aware typing of
    the form map so path strings and selection values type-check
    against the rule's actual shape. Orthogonal to `@ts-nocheck` on
    overrides; separate question.

## Verification

1. **Phase 1 regenerates cleanly.** All three grammars regenerate with
   auto-stamp active. Tests pass. Any factory whose `Config` lost a
   mandatory-constant field still produces NodeData with that field
   stamped — readNode and factory output remain shape-identical.

2. **Phase 2 codegen output** for `interface_body` and `object_type`:
   - `InterfaceBody.Curly.Config` and `InterfaceBody.Flow.Config` types
     with no `opening` / `closing` fields.
   - `interfaceBody.curly(...)`, `interfaceBody.flow(...)`, and
     `interfaceBody(...)` (defaulting to `curly`) all callable.
   - Round-trip fidelity unchanged from current ceilings.
   - `ir.interfaceBody.curly({ opening: '{|' })` type-errors. Confirmed
     via a type-level test.

3. **No `$variant` on refine factory output** — per the NodeData shape
   invariant, refined factories produce NodeData identical to readNode's.
   Any new `$variant` field would fail equality tests against readNode
   output.

4. **Path migration** — existing overrides + tests compile after the
   parser change. The two migration errors (`*` and bare-name) produce
   the prescribed messages. Rust's `'2/_expression'` path works as
   `'2/(_expression)'`.

5. **Cross-grammar sanity** — Rust and Python refine nothing. Their
   post-phase-2 factory output differs from pre-ADR only where phase 1's
   single-literal rule applies. Any factory-consumer that type-errors
   under phase 1 is a correctness improvement (the user was
   redundantly supplying constants).

## Scope for day 1

- Phase 1 (auto-stamp) — lands first. Applies to every grammar.
- Phase 2 (refine) — lands second, with `interface_body` and
  `object_type` migrated in the same commit as the primitive.
- Phase 3 (path syntax) — lands with phase 2 since refine depends on
  the new segments.

Nothing else in this ADR is day-1 scope. External-scanner tokens,
variant defaults, and typed `refine()` signatures are independent
follow-ups.
