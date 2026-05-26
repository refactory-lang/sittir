# Repeated-Slot Grouping Diagnostic — Design

> **Status:** design approved (2026-05-25). Next: implementation plan.
> **Branch context:** grew out of `028-supertype-routing`; the `tuple_type`
> field-naming fix (`32f5143c`) is the proven precedent this generalizes.

## Goal

Add a **Simplify-time diagnostic** that enforces one invariant —

> **A slot never contains multiple slots. A multi-slot substructure must be a group.**

— and, where the invariant is violated, emits a **propose-promotion** (surfaced
to the author, never auto-applied) telling them how to fix it: a visible
`groups:` registration, a `transforms: field()` supertype-list rename, or a
flag for the ambiguous case.

## Background

Repeated supertype-lists and nested sequences fragment at read/render because
the slot model does not consistently force them into a single ordered slot:

- `tuple_type` `(i32, String)` rendered `(String, i32)` — the wrap rebuilds the
  `_type` collection from concrete-kind buckets in a fixed kind order, not CST
  order. Fixed (`32f5143c`) by field-naming every `_type` position with one
  shared name via `transforms:`, so `read_node` collapses them into one
  `FieldValue::Multiple` slot in CST order. **+1 AstMatch, rr-p held.**
- A brute-force sweep of that same fix across 19 candidate slots was
  **net-negative** (python −2 cov, rust/ts inert) and was reverted. Hand-listing
  is the wrong mechanism; the cases that resisted (`type_arguments`,
  `dict_pattern`, `object_type`, …) were all heterogeneous `choice`/literal
  repeats — exactly the shapes that should be *surfaced for author judgment*,
  not force-fielded.
- `applyAutoGroups` synthesizes a hidden helper for **every** `repeat(seq)` /
  `optional(seq)` and inlines **all** of them (rust: 21 helpers, all inlined),
  with **no single- vs multi-slot gate**. Multi-slot nested sequences are
  therefore silently inlined and flattened — the "magical tuple" hazard — unless
  the author has manually registered a visible `groups:` (Part A added 3). There
  is no diagnostic surfacing the rest.

## The invariant and why it makes the model simple

If grouping is **complete**, a nested sequence is a group, and a group occupies
**one** slot in its parent. "Slots within a slot" then never occurs: any
multi-slot substructure is, by definition, a group. Under that invariant the
slot count is **non-recursive** — every child is a leaf-slot or a group-slot,
each counting 1.

The recursion needed to *find* a multi-slot nested seq is therefore a
**violation-detection mechanism**, not a permanent feature of the model. The
diagnostic exists to drive the grammar toward the invariant; once an author has
grouped the flagged cases, counting their parents is trivial.

## Slottiness is already solved — reuse it

`classifyByType` (`compiler/rule-catalog.ts`, "Table 1 refined terminality") is
the single source of truth for terminality, exposed as the pure predicate
`isNonterminalRuleType(rule)`. It already encodes every rule we need, including
**literal-within-choice = slot**:

```
case 'choice': case 'repeat': case 'repeat1':
    return 'nonterminal';   // a choice is one union slot (literal-only = enum)
```

The diagnostic does **not** introduce a new taxonomy or a slottiness pass. It
calls the existing predicate.

## Design

### Placement: Simplify (`compiler/simplify.ts`)

The diagnostic runs inside / alongside `computeSimplifiedRules`, where the
`SimplifiedRule` — the exact shape `collectSlots` consumes — is available, so a
slot count there *is* the real slot count.

**Not enrich/wire.** At `applyAutoGroups` time classification has not run
(symbols unresolved, supertypes unknown, aliases uncollapsed), so single- vs
multi-slot cannot be determined reliably. The earlier idea of gating
`applyAutoGroups` on single-slot is therefore **dropped**.

**Not Link** (despite literals surviving there): Simplify is where the count
matches `collectSlots`. The only thing Simplify strips that Link keeps is bare
literals (`collapseSeq`), which shape ② below does not need for the
group-vs-field decision.

### Shared slot count (DRY)

Factor a single recursive **`countSlots(rule)`** that mirrors `collectSlots`'
distribution semantics, built on `isNonterminalRuleType`:

| rule | contribution |
|---|---|
| `seq` | recurse + sum (distribute) |
| `choice` | **1** (union slot — do not distribute) |
| `symbol` / `supertype` / `pattern` / `enum` | 1 |
| `field` / `optional` / `repeat` / `repeat1` | 1 boundary (recurse only to evaluate the inner group question) |
| `variant` / `group` / `clause` | transparent — recurse |
| `string` / `terminal` / `indent` / `dedent` / `newline` | 0 |

`collectSlots`, the diagnostic, and any future consumer call `countSlots` — one
source of truth for "how many slots does this rule have," per the project DRY
rule. (A group already counts as 1, so once the invariant holds the recursion
bottoms out immediately.)

### Detection — one walk, three violation shapes

Walk every simplified rule, visiting both **nested `seq` nodes** (any depth —
top-level `repeat(seq)`, inside a `choice` arm, inside another `seq`) and
**`repeat`/`repeat1` nodes** (whose content may be a single symbol — shape ②).
At each:

1. **Multi-slot nested sequence** (`countSlots ≥ 2`, not already a group) —
   the core violation. **Propose a visible `groups:` registration** (the
   `attributed_argument` precedent). Needs an author-chosen name → propose, do
   not auto-apply.
2. **Supertype-list** (`repeat`/`repeat1` of a single supertype/symbol, not
   field-named) — single slot, but fragments by concrete kind at read.
   **Propose the `transforms: { <kind>: { '(_<sym>)': field('<name>') } }`
   recipe** (the `tuple_type` fix).
3. **Repeat-of-choice-with-literal** (`repeat(choice(…, <literal>, …))`,
   heterogeneous) — no single supertype to name, literals interleave.
   **Flag as ambiguous**: author decides between a visible group and field-
   naming. (Detected from the pre-strip structure if literal presence is
   required for the message; the group/field decision itself uses `countSlots`.)

### Output: propose-promotion only

Diagnostics are recorded and printed during regen (console + the existing
derivation log). They **never drive codegen** (`feedback_metadata_not_behavior`)
— they surface. The author opts in by adding the proposed `transforms:` /
`groups:` to `overrides.ts`.

### The diagnose-late → author-registers → apply-early loop

Groups must be created **before tree-sitter** (at wire, so a real `kindId` is
minted — `project_every_kind_has_kindid_invariant`), but the multi-slot decision
is only **reliable at Simplify**. These two facts are reconciled by the loop:
detect at Simplify (reliable) → author adds `groups:` → applied at wire on the
next regen (where the kind can exist). The author is in the loop *because* the
early/automatic path cannot reliably decide — which is precisely point #2 above.

## Non-goals / explicitly dropped

- **No single-slot gate in `applyAutoGroups`** — unreliable at that phase.
- **No auto-application** of groups or field-naming — propose only.
- **No new slottiness taxonomy or pass** — reuse `isNonterminalRuleType`.
- **No brute-force sweep** — the reverted 19-slot sweep is the cautionary tale.

## Open implementation details (for the plan)

- Exact integration point in `computeSimplifiedRules` (before or after the
  fixpoint; shape ② literal detection may need a pre-strip peek).
- Diagnostic record shape + how it threads to the regen console (reuse the
  derivation-log channel vs a dedicated `diagnostics` array).
- Whether to also emit shape ① proposals into `overrides.suggested.ts` as
  ready-to-paste `groups:` (deferred — console first).
- Test corpus: `tuple_type` (shape ②, should now be silent — already fixed),
  the rust auto-group helpers that are multi-slot (shape ①), `type_arguments`/
  `object_type` (shape ③).

## Validation

Pure diagnostic — **native counts must hold exactly** (rust 181/134/125, python
107/96/74, ts 174/82/75); the only output change is console/log text. Any count
movement means the pass accidentally drove behavior and is a bug.
