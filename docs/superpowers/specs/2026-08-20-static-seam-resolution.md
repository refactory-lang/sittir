# Static Seam Resolution — Codegen-Decided Boundaries

Realizes the edge-class optimization sketched in
[SpacingWriter — Render-Time Word-Boundary Spacing](2026-07-24-spacing-writer-design.md)
(its "v2" section), and closes a correctness gap the runtime-only design
cannot express: immediacy of a *structural* child's left boundary.

## End state

Every boundary between adjacent render items in every generated template is
classified **at codegen** into exactly one of:

| class | decision | runtime cost |
|---|---|---|
| **immediate** | `''` — grammar declares no whitespace may precede the right item | none (seam check skipped) |
| **fixed × fixed** | hazard evaluated at codegen against the link-pinned `wordMatcher`; `' '` baked into template text or `''` | none |
| **class-derivable** | one or both sides are kind-edged (identifier always starts word-class, `;` never ends one); hazard decided from per-kind edge classes | none |
| **residual indeterminate** | edge varies per instance (adjacent optionals, arena splices, `Varies`-edged kinds) | one `SpacingWriter` seam check, as today |

The generator emits a per-grammar **residue report**: count and list of
boundaries left in the indeterminate class. The residue is expected to be
near-empty; it is a ratchet surface (may only shrink).

## Mechanism

### Edge classes are stamped facts

`wordMatcher` is link-pinned and statically evaluable, so codegen computes:

- for every fixed literal: `starts_word` / `ends_word` booleans;
- for every kind: `STARTS`, `ENDS` ∈ {`Word`, `NotWord`, `Varies`} — from the
  kind's terminal set (patterns evaluate their first/last character classes;
  a kind whose instances differ is `Varies`).

These are model attributes, derived once — no emitter re-implements a
character-class heuristic (canonical-predicates rule).

### Statically known spaces live in template text

The ownership cut between template text and the runtime writer is drawn by
**knowability, not fact class**: template text owns every statically known
space — style spaces and resolved hazard spaces alike, with no reader-visible
distinction — and the writer owns only instance-varying seams. A resolved
hazard space is therefore baked into the `.jinja` literal, not inserted by
the writer under static direction; the skip mark stays a single-purpose
boolean (its out-of-band contract — no fallible op between mark and write,
one-chunk consumption — stays small), and the template reads as what
renders. The classifier knows which template spaces it minted and the
residue report can enumerate them; the runtime does not need to.

Baking cannot resurrect the retired conditional-space machinery
(absorb helpers, outer-absent space ownership): conditional-adjacent
boundaries are exactly the residual-indeterminate class, so baking only
applies to unconditional-adjacent pairs, where placement is unambiguous.

### The skip mark generalizes

The realizable vehicle is the existing thread-local adjacency mark
(`mark_adjacent` in `sittir-core` `spacing.rs`): askama's
`fmt::Write`/`Formatter` chain erases sink identity, so per-boundary facts
cannot travel in-band. Today only immediate-token sites set the mark. End
state: **every statically-classified boundary** sets it before the write —
with any required hazard space already baked into the template text — and the
runtime seam check survives only at residual-indeterminate boundaries. The
mark's contract broadens from "immediate token follows" to "this boundary is
statically resolved"; its name changes accordingly (`mark_resolved` or
similar) when the contract does.

The default therefore inverts: today every seam is checked and immediate ones
opt out; afterwards every seam is decided and indeterminate ones opt in.

### Structural-arm immediacy (the correctness piece)

A rule whose **leftmost terminal** is immediate is itself left-immediate:
every reference to it renders with no seam on its left, in every context.
Codegen derives this per kind (transitively through leading hidden/inline
refs) and the classifier consumes it when the right item of a boundary is a
structural slot arm — the case the scalar-only gate
(`slotVerbatimIsImmediate`) cannot cover.

Grammar-side, immediacy for an inline literal is declared where the literal
lives: a rules-block restatement wrapping it in `token.immediate(...)`.
(External-scanner symbols already declare theirs via `renderAs` bodies.)

**Named acceptance case** — typescript `template_substitution`: `$` is
word-class in typescript, so the runtime writer inserts a hazard space before
`${` inside template strings; after an escape sequence the space reparses as
a spurious one-space `string_fragment`. The corpus entry
"Template strings mixing fragments, escapes, and substitutions"
(`packages/codegen/fixtures/typescript-expressions.txt`) pins the failure.
End state: `template_substitution` restated with `token.immediate('${')`
(parser-neutral — a preceding fragment always absorbs interior text), the
leftmost-terminal derivation marks the kind left-immediate, and the entry's
read-render-parse astMatch row passes.

## Gates

**Floor-neutral by construction** for the classifier itself: every static
decision must equal what the runtime writer would decide given the same
adjacent characters, and indeterminate boundaries keep the runtime check —
so render output is byte-identical and any validator movement is a found bug
(in the classifier or a latent runtime divergence it exposed). New immediacy
*declarations* (the acceptance case above) are the one sanctioned source of
byte movement; each must be corpus-pinned and move floors up only.

Standard battery per change: targeted probes, `validate history` comparison
across all three grammars (numbers, not eyeballs), full unit suite,
baseline compare (fail ceiling never rises).

## Non-goals

- **Adjacent-optional static placement.** `optional(A) optional(B)` remains
  statically undecidable (the founding rationale of the runtime writer);
  such boundaries are classified residual, not forced.
- **Arena splices.** An unexpanded node's edge bytes are unknowable at
  codegen; splice-adjacent boundaries are residual (a later `ReadByte`
  edge-class refinement may narrow them without changing this spec's shape).
- **Interpolation brace padding** (`f"{ x }"`-style walker-authored template
  spaces). Those are authored template text, not writer seams; out of scope.
- **Punct-punct merges** — unchanged from the spacing-writer spec: style
  spaces in template literals prevent them; documented, not mechanized.

## Realization state

- **immediate** — realized: leaf render fns, literal arms, and scalar
  (`slotVerbatimIsImmediate`) arms mark; structural arms mark via the
  leftmost-terminal derivation (`isLeftImmediateKind`); the
  `template_substitution` acceptance case passes.
- **fixed × fixed** — realized (predates this spec): the template SEQ join
  applies the writer's invariant to statically known seam chars and bakes
  the space (`joinParts` in the template emitter).
- **class-derivable, tag boundaries** — measured, and nearly empty:
  per-kind edge classes (`edgeClassesOfKind`) plus the emitted-form walker
  (`renderRuleEdge`) subdivide every tag-adjacent SEQ boundary. Only
  rust 5, typescript 12, python 1 have statically knowable outcomes —
  per-instance PRESENCE (optional and array slots) and pattern trailing
  edges dominate, which no class analysis can resolve. Consuming these (a
  template-position mark) is not worth its mechanism absent profiling
  evidence.
- **class-derivable, list interiors** — realized, with a settled
  representation principle: **the separator string captures the
  resolution** — presence or absence of the space character, never a
  boolean. `staticListInterior` applies the writer's law over the slot's
  derived edge-char sets (`edgeCharSetsOfKind`): constant-TRUE bakes the
  owed space into the separator; constant-FALSE (and separator-blocked
  interiors — the separator's own edge chars can never seam) leaves
  emission unchanged with the dead checks recorded as derivable. Marks
  remain reserved for grammar-immediacy, where the writer would wrongly
  INSERT — that fact has no character to carry it, and its boolean-free
  form is the writer-layer split below.
- **residue report** — realized, covering SEQ boundaries and list
  interiors. Current: rust 10 static + 24 derivable / 450, typescript
  16 + 23 / 546, python 5 + 11 / 242. No current list qualifies for a
  baked space — rust `function_modifiers` is genuinely mixed
  (`extern_modifier` can end `"`), the honest refusal.
- **mark rename** (`mark_adjacent` → resolved-boundary contract) — open;
  rename lands when a non-immediate boundary first sets the mark.

## Optional end-state: writer layer split

If a custom sink trait is ever threaded end-to-end through the render stack
(replacing the `fmt::Write` chokepoints), the thread-local mark dissolves
into a two-layer `RawWriter`/`SpacingWriter` split: state at the bottom,
seam check as a decorator that statically-resolved call sites bypass by
construction. Same semantics, in-band. Not a precondition for anything
above.
