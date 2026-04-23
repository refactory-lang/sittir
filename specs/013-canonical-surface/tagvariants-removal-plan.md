# tagVariants — removal plan (013 follow-up)

> Status: draft plan

## Why

The current `tagVariants` pass in `link.ts` unconditionally wraps
every member of every visible choice in a `variant` rule. After the
structural-homogeneity skip (commit b852fc8) it still produces:

| Grammar | Override polymorphs | Auto-promoted | Phantom variant wrappers |
|---------|---------------------|----------------|--------------------------|
| rust    | 15 kinds            | **0**          | 48 kinds × 142 wrappers  |
| ts      |  9 kinds            | **0**          | 59 kinds × 202 wrappers  |
| python  |  1 kind             | **0**          | 29 kinds × 89 wrappers   |

**Zero polymorphs are auto-promoted across all three grammars.**
Every polymorph in the final IR came from an explicit `variant()` in
overrides. The 400+ remaining wrappers are phantom — the only reason
they exist is that `tagVariants` inserts them unconditionally.

User's diagnosis: *"we were silently identifying variants before but
not doing anything with them elsewhere in the code, b/c 'phantom'
variants weren't part of any polymorphs."*

Confirmed by the inventory. Phantom wrappers are a pure cost —
they:

1. **Block canonicalization.** `mergeChoiceBranches` bails on any
   variant-wrapped branch (to preserve polymorph identity). Phantom
   wrappers make otherwise-mergeable choices look polymorph-like.
2. **Inflate IR size.** 400+ wrapper nodes that later passes walk
   through / peel off.
3. **Noise in debugging.** When tracing a rule through the pipeline,
   the variant wrappers obscure the underlying shape.
4. **Implicit policy drift.** The decision "this choice deserves
   variant identity" silently happens for every visible choice, rather
   than being an explicit author decision in overrides.

## Target model

Variants become **override-only**. The authoring surface stays
exactly as it is today — `variant('name')` in overrides — but the
pipeline no longer speculatively wraps anything.

For choices the author *might* want to promote, the codegen emits a
**diagnostic suggestion** into `overrides.suggested.ts`:

```ts
// Suggested: binary_expression has 18 choice arms with the same field
// shape. Consider variant() if you want per-arm template control:
//
//     binary_expression: {
//         0: variant('logical_and'),
//         1: variant('logical_or'),
//         ...
//     },
//
// Or leave as-is for shape merging (binary_expression-style unioned
// field content).
```

The author decides. Default behavior = no variants, shape merging,
literal-union field types.

## Scope

### Phase 1 — disable tagVariants, harvest suggestions

- Delete the `wrapVariants(rule)` call in `tagVariants`'s choice
  branch. Replace with pure traversal (`rule.members.map(tagVariants)`).
- Rename the function to `traverseRules` or similar — the name
  `tagVariants` no longer matches its behavior.
- Add a new `collectVariantSuggestions(grammarRules)` pass that walks
  every visible choice and emits a `VariantSuggestion[]` entry per
  choice describing: rule kind, choice path, branch count, detected
  arm names (via existing `nameVariant` helper), structural homogeneity
  flag (yes = "shape merging wins, no variant needed" / no = "variant
  recommended").
- Wire suggestions into `overrides.suggested.ts` emitter alongside
  the existing field-inference suggestions.

### Phase 2 — derive children through aliases

Already required for the string/escape bug discovered alongside this
plan. Not strictly part of tagVariants removal but lands in the same
commit cluster because removing tagVariants will expose more choices
to direct walker traversal.

- Add `case 'alias'` to `walkForChildren` in `node-map.ts` — treat
  the alias's `value` as the symbol name the runtime produces.
- Add a sibling `case 'alias'` to `deriveFieldsRaw` — currently no-op
  default behavior.
- End both switches with `default: return assertNever(rule)` (or
  equivalent) to catch the next missing variant at compile time.
- Sanity check: `StringDouble.$children: readonly (StringFragment |
  EscapeSequence)[]` after the fix.

### Phase 3 — verify no downstream consumer depends on phantom variants

Before deletion, grep for `variant` usage across the pipeline to
confirm phantom wrappers don't feed anything. Expected consumer sites:

- **applyOverridePolymorphs** — already reads only `source: 'override'`
  metadata, which is ADDED by the override DSL, not by tagVariants.
- **findPolymorphCandidate / findAllPolymorphCandidates** — use
  `choiceNeedsVariantWrapping`, which checks anonymity of arms, not
  whether they're already variant-wrapped. These should keep working.
- **assemble polymorph classification** — consumes `PolymorphRule`
  after link has synthesized it. PolymorphRule source is always
  'override' or 'promoted' today (0 promoted); tagVariants doesn't
  produce PolymorphRule directly, only wraps.
- **template walker** — if it's relying on variant wrappers to detect
  polymorph forms, needs a separate probe.

Write a probe: at end of Link, count variant wrappers BEFORE and
AFTER tagVariants is disabled. If anything downstream changes shape,
that's our regression signal.

### Phase 4 — measure corpus impact + regen

After Phases 1-3 land:

- Full regen of all three grammars.
- Diff node-model.json5 and types.ts. Expected:
  - Types simpler (no more `AutoStamp<...>` on binary-expression-shape
    fields — the homogeneity-skip fix was half the story; the other
    half comes from eliminating phantom wrappers everywhere).
  - Fewer polymorph nodes (still exactly 15 / 9 / 1 — the override
    ones).
  - `StringDouble.$children` recovers `StringFragment`.
- Run round-trip validator. Any regression = a downstream path was
  relying on phantom variants; fix and retry.
- If corpus metrics hold or improve, commit.

## Risks

1. **Hidden consumer**: some pass we didn't find relies on phantom
   variants. Mitigated by Phase 3 probe and full test suite. If caught
   late, rollback is one-commit-level (Phase 1 is the load-bearing
   deletion).

2. **`findPolymorphCandidate` might rely on tagVariants having
   already wrapped members.** Read its impl carefully before Phase 1.
   It walks raw rules and checks shape — should be independent, but
   worth confirming.

3. **`choiceNeedsVariantWrapping` — who calls it?** Currently only
   `findAllPolymorphCandidates`. After Phase 1, this function becomes
   the definition of "would tagVariants have wrapped this" for
   suggestion emission. Keep it as-is.

4. **Test expectations**: `optimize.test.ts` has a direct
   `wrapVariants(choice)` test. That's testing a leaf helper and can
   stay; we're removing the CALLER, not the helper. If we rename
   `tagVariants` → `traverseRules`, update the call sites.

## Scope estimate

- Phase 1: ~100 LOC (delete-and-rename + suggestion emitter)
- Phase 2: ~20 LOC (two `case 'alias'` additions + assertNever)
- Phase 3: ~30 LOC probe (throw-away)
- Phase 4: regen + metrics, no code change.

Net: ~-150 LOC of pipeline + much simpler mental model.

## Commit order

```
1. Phase 2 (alias case + assertNever) — bug fix, standalone value
2. Phase 1 part A: rename tagVariants → traverseRules, delete
   wrapVariants call (single-file diff, test suite runs)
3. Phase 1 part B: suggestion emitter + overrides.suggested.ts wiring
4. Phase 4: regen, lock in FLOORS, commit
```

Phases 1A and 4 are the ones to be prepared to revert if something
downstream explodes.
