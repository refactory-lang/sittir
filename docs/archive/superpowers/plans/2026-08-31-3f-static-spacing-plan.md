# 3f Static Spacing — Reconciliation Plan

> **Status:** SHIPPED. Reconciliation complete; the work below landed. Originally paused pending
> dispatcher confirmation (two source documents give materially different
> definitions of "3f" — see "The conflict" below).

## What was asked

The assigned task cites
[`2026-07-24-spacing-writer-design.md`](../specs/2026-07-24-spacing-writer-design.md)
and the untracked
[`2026-08-31-phase3-closeout-handoff.md`](../handoffs/2026-08-31-phase3-closeout-handoff.md),
which frames 3f as: "Move static word–word boundary decisions into codegen
so templates carry their own spaces; render functions whose seams are all
statically decided downgrade from SpacingWriter to RawWriter," and cites
"known drift" — the walker emits keyword→slot seams (`type{{ left }}`,
`print{{ chevron }}`) with no space, leaning on the runtime writer.

## What is already true on `master` (verified, not assumed)

The "known drift" premise is stale. A full generation of static-boundary
baking already landed and is merged (`f02d2060a`, "bake
statically-decidable tag seams with the writer's invariant", executing
[`2026-08-23-static-seam-bake-plan.md`](2026-08-23-static-seam-bake-plan.md)
against [`2026-08-20-static-seam-resolution.md`](../specs/2026-08-20-static-seam-resolution.md)).
That spec's "Realization state" section confirms, and current code
confirms independently:

- **immediate** boundaries: realized (`mark_adjacent` in
  `rust/crates/sittir-core/src/spacing.rs`, set at leaf/literal/scalar/
  structural-arm sites via `isLeftImmediateKind`).
- **fixed × fixed** and **class-derivable tag boundaries**: realized. The
  template SEQ join (`joinParts` in `packages/codegen/src/emitters/templates.ts:386`)
  already bakes every statically-decidable boundary through one shared
  predicate, `seamNeedsSpace` (`templates.ts:239`), using the grammar's
  link-pinned `wordMatcher` via `ctx.isWordChar` — never an inline regex.
  `partEdge`/`renderRuleEdge` (`templates.ts:243-292, 380-385`) compute the
  per-kind edge class (`edgeClassesOfKind` in
  `packages/codegen/src/compiler/model/node-map.ts`) for tag-adjacent
  boundaries and bake a space when both sides are statically word-class.
- **class-derivable list interiors**: realized (`staticListInterior`,
  `templates.ts:546-610`) — the separator string itself carries the
  resolution (space present/absent), never a boolean flag.
- **residue report**: realized — `runTemplateEmitter` accumulates a
  `SeamCensusSummary` (`templates.ts:52-70`), written to
  `packages/<lang>/.sittir/seam-census.json` by `run-codegen.ts:242-266`
  on every regen, with counts logged to stdout.

Current census (regenerated today, `packages/<lang>/.sittir/seam-census.json`):

| grammar | total | static-glued | static-spaced | runtime-derivable | runtime-varying (residue) |
|---|---|---|---|---|---|
| rust | 469 | 14 | 2 | 19 | 434 |
| typescript | 497 | 24 | 4 | 11 | 458 |
| python | 257 | 4 | 2 | 12 | 239 |

`type{{ left }}` (python `type_alias_statement`) and `print{{ chevron }}`
(python `print_statement`) are exactly this residue: `left`/`chevron`
resolve to slots whose kind's edge class is genuinely `varies` under the
current classifier (a union/choice slot without a uniform first-set), so
`classifyTagSeam` correctly records them `runtime-varying` and the runtime
`SpacingWriter` supplies the space. This is the **designed** outcome for a
dynamic seam per both specs, not a bug — the walker has not "drifted" from
the 2026-07-24 spec on this point; it has already absorbed the harder
2026-08-20 spec that specifically targets this class of seam.

The 2026-08-23 plan's own closing note settles the RawWriter question the
closeout handoff reopens: *"The resolved-boundary mark (`mark_adjacent` →
`mark_resolved`) and the writer-layer split (RawWriter / SpacingWriter) are
perf-only once baking lands: they skip a check the writer would decide
identically. They land only with profiling evidence, per the spec."* No
profiling evidence exists. The 2026-08-20 spec's own "Optional end-state"
section states the writer-layer split is "Not a precondition for anything
above."

## The conflict

Two source documents define "3f" incompatibly:

1. **The closeout handoff** (2026-08-31, untracked, this task's stated
   source): 3f = bake remaining unspaced seams + downgrade render fns to
   RawWriter where fully static. Gate: **behavioral** (dispatcher's task
   message: "This change DELIBERATELY alters generated templates ... and
   render modules ... The gate is behavioral, not byte-identity").
2. **The master step sequence**, [`2026-08-28-assemble-off-the-simplified-tree.md`](../specs/2026-08-28-assemble-off-the-simplified-tree.md)
   (steps 3a–3f, tracking exactly the phases that shipped: 3a link-tree
   removal, 3b parked, 3c simplify pre-work, 3d node-classes/types, 3e
   overlay surface — all cited by name in the 2026-08-29/30 handoffs this
   session chain descends from). Its own text: *"3f — normalize static
   spacing, bounded by the seam census; residue diagnosis"* and *"Normalize:
   static spacing as literal members (bounded) — `seq(word, word) →
   seq(word, ' ', word)` ... apply on the normalized view only where the
   seam census classifies the boundary static ... the runtime-varying
   residue ... is its own diagnosis — almost certainly a conservative
   classifier, not a dynamic grammar — and is not folded."* Invariant,
   stated explicitly: *"3c and 3f are byte-identical."*

These are not the same task. (1) changes generated `.jinja` text and
generated Rust render code — a behavior-preserving-output-but-not-
byte-identical change requiring the RawWriter downgrade to touch
`render-module.ts`'s Rust emission. (2) is a compiler-phase relocation:
move the *already-computed* static-spacing fact (today re-derived at
template-emit time by `joinParts`/`seamNeedsSpace`) upstream into the
normalized rule tree as a stamped literal member, so assemble/templates
consume a fact instead of re-deriving it — output is unchanged, byte for
byte. (2) also includes "residue diagnosis": the runtime-varying bucket is
92–95% of all boundaries in every grammar, which the spec author already
flagged as suspiciously large for what should be a narrow "adjacent
optionals + arena splices" residual class — i.e. `edgeClassesOfKind`/
`renderRuleEdge` are almost certainly under-classifying (returning `varies`
for cases that are in fact uniform), and closing that gap is explicitly in
3f's scope, not deferred.

(1)'s premise (the walker hasn't caught up to the 2026-07-24 spec) is
false on the evidence above; its RawWriter half is explicitly deferred,
perf-gated, evidence-free debt per the plan that already shipped the tag-
boundary work. (2) is the specific, numbered, already-tracked next step in
the sequence this session's own ancestry (3d, 3e handoffs) points to, with
a concrete invariant (byte-identical) that matches this repo's standing
"Compiler refactor invariant" convention for phase-relocation work.

## Recommendation

Implement **(2)**: 3f = move static-spacing determination from
`templates.ts`'s emit-time `joinParts`/`seamNeedsSpace` computation into a
pass over the normalized/simplified rule tree that runs after the seam
census can be computed and stamps the decided boundaries as literal `' '`
or `''` SEQ members, consumed downstream (assemble, templates) as an
ordinary rule-tree fact rather than re-derived. Byte-identical gate.
Alongside it, the residue-diagnosis half: audit why `renderRuleEdge`/
`edgeClassesOfKind` return `varies` for ~93% of boundaries and tighten the
classifier wherever that is a classifier gap rather than a genuinely mixed
first-set (each fix here is itself byte-identical unless it newly proves a
boundary static, in which case template text moves the same way the
2026-08-23 plan's tag-boundary bake did — reviewed, corpus-checked, floors
may only rise).

Do **not** implement (1)'s RawWriter/SpacingWriter downgrade or the
`mark_adjacent` → `mark_resolved` rename as part of this task: both are
explicitly deferred, perf-only, and gated on profiling evidence that does
not exist, per the plan that already landed the prerequisite work.

## Open architectural question blocking implementation

`edgeClassesOfKind`/`edgeCharSetsOfKind`/`renderRuleEdge` currently operate
over `NodeMap` (`nodeMap.nodes`, `nodeMap.normalizedRules`) — i.e. they run
**after** assemble has built the node map, at template-emit time. The
2026-08-28 spec's phrase "apply on the normalized view" implies computing
and stamping this fact **before** assemble, inside or immediately after
`normalizeGrammar` (`packages/codegen/src/compiler/normalize.ts`), which
runs before the node map exists. Two ways to resolve this ordering, with
different blast radius:

- **(a)** Re-derive the edge classifiers to operate directly on
  `SimplifiedGrammar`'s rule tree (no `NodeMap` dependency) so they can run
  inside `normalizeGrammar` itself, stamping SEQ members in one pass. This
  is the literal reading of "normalize ... as literal members" but requires
  reworking classifiers that are currently node-map-shaped.
  - `NodeMap` is built by `packages/codegen/src/compiler/model/node-map.ts` (`buildNodeMap` or equivalent) — its consumers `edgeClassesOfKind` etc. would need a `SimplifiedGrammar`-only variant, or `normalizeGrammar` would need to build a lightweight node-lookup itself.
- **(b)** Add a distinct pass between `assemble` producing the `NodeMap`
  and `templates.ts` consuming it — compute the census once against the
  already-built `NodeMap`, then mutate the *stored* `renderRule` on each
  `AssembledNode` to splice in the decided literal members before
  `runTemplateEmitter` walks them, so `templates.ts` no longer needs
  `joinParts`'s live classification for the static cases (it becomes a
  simple concatenation there, with the residual/varying cases still
  classified live). This keeps the existing classifiers as-is and satisfies
  "stamped facts over re-derivation" (rule 3) without an ordering rewrite,
  but is a stamp on the *assembled* tree, not literally the "normalized
  view" the spec names.

(a) is architecturally cleaner and matches the spec's literal wording but
touches `normalize.ts`, `simplify.ts`, and the edge-classifier module in
a way that changes which compiler phase owns word-class knowledge — a
foundational layering decision (compiler-phase glossary: normalize's scope
today is wrapper-consumption into leaf stamps, not spacing). (b) is a
smaller, more mechanical move that still satisfies the "one source, one
derivation" rule and the byte-identical gate, at the cost of not literally
landing "in normalize."

This plan does not pick between (a) and (b) — that is a layering ruling
the dispatcher should make explicitly (per this project's standing rule
that compiler-phase boundary changes are foundational and not something an
implementer should decide unilaterally), and it changes the task's file
list (`normalize.ts` + `simplify.ts` for (a) vs. `assemble.ts` +
`templates.ts` for (b)).

## Residue-diagnosis: concrete next step regardless of (a) vs (b)

Independent of the above, the classifier-precision half of 3f can be
scoped now: instrument `renderRuleEdge`/`edgeClassesOfKind` (env-gated,
following the `DBG_SLOT_MISS`/`DBG_LIST_SEAM` pattern already in
`templates.ts`) to record *why* each `runtime-varying` verdict was reached
(CHOICE arms disagree / SYMBOL cycle / helper rule not found / pattern with
no uniform leading class), tally by reason across all three grammars, and
inspect the top reason bucket for a small number of kinds by hand to
confirm "conservative classifier" vs "genuinely mixed first-set" before
touching the classifier itself. This is safe, additive, and gate-neutral
(no generated output changes) and can be done under either (a) or (b).

## Status

SHIPPED. The spec reading won: the classifier fix, the fallback-chain
extension, and the byte-identical stamp relocation landed with
`stampStaticSpacing` as a genuinely separate pass between assemble and
`emitAll`, layering option (b). The follow-on runtime-check skip landed
as the `markSeam` askama filter rather than a `RawWriter` type — the
literal writer split needs a custom sink threaded through every
render-fn signature, which the seam-resolution spec calls an optional
end-state and prior work deferred pending profiling evidence that still
does not exist.
