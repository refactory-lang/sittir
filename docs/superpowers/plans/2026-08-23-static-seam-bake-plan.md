# Static Seam Bake — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans
> (foundational codegen work — execute INLINE). Steps use checkbox syntax.

**Goal:** Every template boundary whose spacing outcome is statically
decidable carries that outcome in template text — decided by the **same
invariant the runtime SpacingWriter applies** — so a template reads as what
it renders and the runtime seam check survives only at genuinely
per-instance boundaries.

**Architecture:** The template emitter's SEQ join (`joinParts`,
`packages/codegen/src/emitters/templates.ts`) already bakes fixed×fixed
seams with the writer's invariant and only *records* tag boundaries
(`classifyTagSeam` → `runtime-derivable` / `runtime-varying`). This plan
bakes the `runtime-derivable` class with the same predicate, through one
shared decision function, and leaves `runtime-varying` to the writer. No
runtime change is required for correctness: a baked space leaves a
non-word character on the seam's left, so the writer's check is idempotent
with it.

**Spec:** `docs/superpowers/specs/2026-08-20-static-seam-resolution.md`
("class-derivable, tag boundaries" — reversing its deferral: determined
slots turn every former stamped keyword into a fixed literal beside a
kind-edged slot, which is exactly this class).

## Global Constraints

- Byte-identical gate by construction: every static decision must equal the
  writer's decision for the same adjacent characters; floors, `validate
  history`, suite, and baseline (9716/23) must not move. Any movement is a
  classifier bug or a latent runtime divergence — stop and review (5b).
- `wordMatcher` is the only word-class source (`ctx.isWordChar`); no local
  character heuristics.
- Sequence BEFORE the determined-slots implementation so its new literal
  keywords are baked on arrival.
- Branch: stacked on `drop-kw-overrides` (`master ← #222 ← #223 ← #224 ←
  #225 ← static-seam-bake`).

---

### Task 1: one seam decision, shared by both `joinParts` branches

**Files:** Modify `packages/codegen/src/emitters/templates.ts` (~606-636:
`partEdge`, `joinParts`; `classifyTagSeam`; `SeamBoundaryRecord`).

- [ ] **Step 1 (red):** add an emitter unit test with a fixture whose SEQ is
  `['type' literal, field('left', <kind whose every value starts
  word-class>)]` (e.g. a kind holding an identifier PATTERN) and assert the
  emitted template text is `type {{ left }}`; add a sibling fixture whose
  slot kind `varies` (a CHOICE of an identifier and a `(`-leading arm) and
  assert `type{{ left }}` is emitted unchanged. Run: FAIL on the first.
- [ ] **Step 2:** factor the fixed×fixed decision into
  `seamNeedsSpace(left: SeamEdgeClass, right: SeamEdgeClass): boolean`
  (word × word → true; any `not-word` side → false) and use it in the
  fixed×fixed branch via the char→class mapping `partEdge` already does.
- [ ] **Step 3:** in the tag-boundary branch, when
  `classifyTagSeam(...) === 'runtime-derivable'`, bake: `body += ' '` when
  `seamNeedsSpace(...)`, record `'static-spaced'`, else record
  `'static-glued'`; `runtime-varying` stays as today (glue, runtime check).
  Literal-merge class pairs remain `runtime-varying` (already handled in
  `classifyTagSeam` — only concrete characters can decide them).
- [ ] **Step 4 (green):** tests pass.
- [ ] **Step 5:** regenerate all three grammars; rebuild all three crates.

### Task 2: census and pins

**Files:** the seam-census consumers (residue report in the generate
output; any committed census snapshot), `docs/superpowers/specs/2026-08-20-static-seam-resolution.md`
"Realization state".

- [ ] **Step 1:** confirm the residue report: `runtime-derivable` drops to 0
  in every grammar (previously rust 5 / ts 12 / python 1), `static-spaced` +
  `static-glued` rise by exactly those counts. Any boundary still
  `runtime-derivable` is a classifier gap — name it.
- [ ] **Step 2:** spot-check baked templates: python
  `type_alias_statement` (`type {{ left }}` iff the `type` kind's edge class
  is `word` — if it is `varies`, the template stays and the entry belongs
  to the writer, which is the honest outcome, not a failure), rust
  `generic_type_with_turbofish` (`{{ type }}::{{ type_arguments }}` stays
  glued: `::` is not-word).
- [ ] **Step 3:** update the spec's "class-derivable, tag boundaries" bullet
  from measured-and-deferred to realized, with the new counts.

### Task 3: gates and commit

- [ ] `pnpm run validate:native` + `validate history` — byte-identical in
  all three grammars; full suite 0 failed; baseline compare byte-identical.
- [ ] Commit: `feat(templates): bake statically-decidable tag seams with
  the writer's invariant`.

### Deferred (spec's optional step, not this plan)

The resolved-boundary mark (`mark_adjacent` → `mark_resolved`) and the
writer-layer split (RawWriter / SpacingWriter) are perf-only once baking
lands: they skip a check the writer would decide identically. They land
only with profiling evidence, per the spec.
