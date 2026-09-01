# Debt attack plan

Rewritten 2026-09-01 against a verified reading of the tree. The previous
version was written before a session that closed six KNOWN_ISSUES
entries, merged a six-PR stack, and found that several of its own items
were already done or misdiagnosed.

**Read this first.** Every item below was checked against the code, not
carried over from a list. Do the same before working any of them: in the
last pass, six of eleven KNOWN_ISSUES entries were already fixed and
only documented as open, one carried a stated fix that would have broken
the build, and five TODO items had shipped. An entry's own description
is not evidence.

## 0 — Before anything else

**Master's CI is red, and has been for many merges (#243, #250, #251).**
`pnpm build` runs `tsc -p tsconfig.build.json`, which treats
`assemble.ts`'s `scope: 'compiler'` diagnostic property as fatal;
`type-check` counts the same error among four it tolerates. Until this
is green, CI reports nothing about any change that follows it, and every
gate below rests on local runs alone. It looks like a small fix to the
`Diagnostic` type.

## 1 — Decisions only the user can make

Nothing here is blocked on effort.

- **`ki-from-string-composition`** — rust's `from.string` / `from.comment`
  are not emitted because there is no single-positional-child surface to
  compose and codegen will not invent a default quote style. Needs a
  ruling (probably plain `"` with `from.string.raw(...)` for variants),
  declared at the overrides level, not inferred in an emitter.
- **Style spacing** — rendered output drops style spaces (`const[c]=[]`,
  `{1:a,2:b}`). Reparse-safe and pre-existing; surfaced repeatedly while
  fixing brace escaping. Per the spacing spec these belong to
  `FormatCtx`, not `SpacingWriter` — so the question is whether canonical
  formatting is wanted at this layer at all.
- **TODO 26 vs TODO 30** — the `$text` content/provenance split and
  declared `XTree` types neighbour each other; the spec for 26 says so.
  Decide their scope together rather than letting one bolt onto the other.

## 2 — Tracked, verified, ready to work

- **TODO 27 — values-entry multiplicity override.** Already ruled: one
  slot, multiplicity overridable per values entry, with storage /
  factory / transport / config deriving from per-value multiplicities.
  Unimplemented.
- **TODO 33 — the two SSOT asks** split out of the old polymorph-shape
  item (whose structural half shipped). `classifyFactoryEmission`
  consults five signals for a fact half-stamped on the model;
  `SlotClass` exists but only render-side while `factories.ts`
  classifies branch factories its own way.
- **TODO 10 — VARIANT removal.** Handoff written at
  `docs/superpowers/handoffs/2026-08-31-variant-removal-handoff.md`.
  Not a sweep: `VARIANT` is minted by the user-facing `variant()` builder
  and its `name` drives polymorph classification, so the first
  deliverable is deciding where that name lives.
- **TODO 18 / `ki-exercise-span-transport`** — the `$span` class, ts 2
  failures and py 8. Its `set_comprehension` padding row is gone; the
  brace fix closed it.
- **`ki-let-destructuring-parse-divergence`** — probe-confirmed:
  `const [c] = [];` parses as a declaration, `let [c] = [];` becomes a
  subscript expression. Grammar-level tie-break plus a corpus entry.
- **`ki-sclass-residuals`** — a documented-exclusions register pinned by
  committed ceilings, not a bug list. Its python
  `_simple_pattern_negative` rows need a decision on how polymorph forms
  surface factory metadata.

## 3 — Specs with work left, several untracked

Checked by status line and by artifact. Realized and closed:
`3e-overlay-surface`, `assemble-off-the-simplified-tree` (3f closed it),
`namespaced-form-factories`, `determined-slots`,
`separated-list-options-struct`, `spacing-writer-design`,
`wrapper-deletion-as-rule-builder` (`combineMultiplicity` is live in
normalize with 14 uses and the glossary treats post-wrapper-deletion as
existing pipeline state; only the `deleteWrapperWith` name was not
adopted — its "ready to implement" status line is stale).

Still open:

- **`2026-08-20-static-seam-resolution`** — near-complete, one open item
  left by its own text: the **mark rename** (`mark_adjacent` →
  resolved-boundary contract), which it says "lands when a non-immediate
  boundary first sets the mark." That condition is now met — `markSeam`
  marks statically-resolved boundaries — so the rename is due.
  `mark_resolved` does not exist yet. **No TODO entry.**
- **`2026-08-27-rule-pattern-recognizers`** — partial; step 1, the
  catalog, landed for the shared recognizers. **No TODO entry.**
- **`2026-08-25-dogfood-examples-and-factory-surface-design`** — its
  "not yet implemented" status line is wrong twice over. All six modules
  exist and pass `type-check:examples`, and the friction the spec set out
  to collect HAS been collected — into **34 `GAP` annotations** classed
  A–D inside the example bodies. What never happened is lifting those out
  of the comments into tracked work, which is why the spec reads as
  untouched.

  Evaluated rather than inferred, the three reconstructions stand at:
  rust **throws** (`$type property missing in ExpressionTransport` on
  `ExpressionStatementWithSemiTransport._expression`, at the transport
  boundary); typescript renders 468 bytes against a 3,898-byte target;
  python is deliberately reduced to `ir.passStatement()` because, in its
  own words, the module's statement list rejects an `expression_statement`
  — kind 122 is not a member of `StatementTransport`.

  So the work is narrower than "implement the spec": harvest the 34 GAPs
  into items, and fix the rust crash, which is the only one of the three
  that is a hard failure rather than a documented API limit. The
  `it.fails` pins ("re-parses to the same tree", "identical modulo
  whitespace") badly understate this — they read as near-misses.

  NB a gate inconsistency to resolve alongside: `type-check:examples`
  reports zero errors while `pnpm -C packages/rust run type-check`
  reports 17 in `examples/17-dogfood-rust.ts` — same files, two
  tsconfigs, different verdicts.

- **`2026-08-26-text-content-vs-source-provenance`** (TODO 26) — not
  started, and the spec is now ~5 weeks old. 3f overtook its
  writer-layer section, and its load-bearing claim (every transport
  declares `$span`/`$nodeHandle`/`$childIndex`/`$source`/`$named` and
  reads none) is only half-verified: the declarations are confirmed,
  "read nowhere" is not.
- **`2026-08-26-immutable-node-surface-and-layered-setters`** (TODO 31)
  — not started, deprioritized in its own opening section.

## 4 — Unowned findings, no home yet

- **`render_transport_parts` hardcodes `TransportSource::Factory`**, so
  detected per-file format is unreachable on the native render path and
  `render()`'s `treeId` parameter is inert. Surfaced by spec 26, not
  caused by it, and not owned by it.
- **Seven lint findings inside generated packages** — emitter defects,
  not editable in place. The `if (false)` dead branch found this way was
  real; the rest deserve the same look.
- **Fifteen codegen and twenty-one tools suite failures**, never triaged
  as a body of work. Baseline-diff by test NAME before attributing any.

## 5 — Audits with no verified inventory

TODO 4, 6 and 7 (deprecated calls, silently deprecated features, silent
failures and warnings) name no specific site. Run one census each and
convert to concrete items, or drop them — as written they cannot be
scheduled or finished.

## Ride-alongs

TODO 12 (single-phase method consolidation), 15 (manifest native-vs-js
split), 21 (hoisting parity for getters/setters), 22 (magic strings onto
the model), 23 (`AnyNodeData`), 24 (collapse multiplicity and arity),
25 (typeGuards asserting concrete `T`), 13 (field-override renaming).
Fold each into whichever slice already has the file open.
`ki-emitsymbol-fielded-seq` stays parked until a grammar exercises the
shape.

## Two lessons this plan exists to encode

- **Verify an item's premise before working it.** Cost this session: a
  fix that would have broken template compilation, and four items
  scheduled that were already done.
- **A merged stacked PR does not mean its content reached master.** When
  a mid-stack merge fails transiently and a lower PR merges first,
  GitHub still reports the upper ones MERGED while their content never
  propagates. Verify every commit with
  `git merge-base --is-ancestor <sha> master` after merging a stack.
