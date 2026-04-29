# tagVariants — removal plan (013 follow-up)

> Status: draft plan

## Why

The current `tagVariants` pass in `link.ts` unconditionally wraps
every member of every visible choice in a `variant` rule. After the
structural-homogeneity skip (commit b852fc8) it still produces:

| Grammar | Override polymorphs | Auto-promoted | Phantom variant wrappers |
| ------- | ------------------- | ------------- | ------------------------ |
| rust    | 15 kinds            | **0**         | 48 kinds × 142 wrappers  |
| ts      | 9 kinds             | **0**         | 59 kinds × 202 wrappers  |
| python  | 1 kind              | **0**         | 29 kinds × 89 wrappers   |

**Zero polymorphs are auto-promoted across all three grammars.**
Every polymorph in the final IR came from an explicit `variant()` in
overrides. The 400+ remaining wrappers are phantom — the only reason
they exist is that `tagVariants` inserts them unconditionally.

User's diagnosis: _"we were silently identifying variants before but
not doing anything with them elsewhere in the code, b/c 'phantom'
variants weren't part of any polymorphs."_

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

For choices the author _might_ want to promote, the codegen emits a
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

### Phase 2 — delete walkForChildren / deriveFieldsRaw entirely

Per the 013 canonical-surface plan, the recursive derivation walkers
should not exist post-canonical. They're the original source of the
duplicate-drop bug class (same bug family as the string/escape
silent-drop; same bug family as binary_expression's AutoStamp).

The fix is **not** to add `case 'alias'` to `walkForChildren` — that's
patching a walker we're trying to remove. The fix is:

1. **Canonicalize flattens `alias` to `symbol`.** Post-canonicalize
   there is no `alias` node in the rule tree. The alias's `value`
   becomes the resolved symbol's name; the runtime-producing kind is
   what downstream cares about. Simpler union: symbol /
   supertype / field / repeat / choice / seq — no alias.

2. **Canonicalize pushes the container shape to the top level.**
   For a rule like `_string_double` whose surface is a repeated
   choice-of-two-children, the canonical form becomes either:
   - `repeat(choice(string_fragment, escape_sequence))` (as today,
     but with alias flattened), or
   - A flat list of child refs annotated with multiplicity,
     following the container-rule pattern in 013 plan §"Canonical
     form".

   Decision point: does the canonical form for container-style rules
   keep the `repeat(choice(...))` shape, or normalize further into an
   explicit multi-child list? The derivation difference is whether the
   projection step is "filter-and-project over seq members" (current
   field plan) or "walk one level into repeat/choice to union children"
   (container equivalent). Pick one and document.

3. **`deriveChildren` becomes a top-level projection** analogous to
   `deriveFields`, with whatever one-level descent the chosen
   canonical form dictates. No recursion into arbitrary seq/choice
   nesting — canonicalize already did that work.

4. **`deriveFieldsRaw` and `walkForChildren` are deleted.** Their
   per-case merge logic (which drops duplicate-named fields, misses
   alias, auto-stamps wrongly) goes with them.

Sanity checks post-deletion:

- `StringDouble.$children: readonly (StringFragment | EscapeSequence)[]`
  — alias flattened, both children surfaced.
- `BinaryExpression.operator` stays as the literal union (current
  canonicalize fix continues working).
- No `case 'default: return []'` survivors — ALL discriminated-union
  switches end in `assertNever`.

**This is Phase 3 of spec 013.** Previously sequenced AFTER
tagVariants cleanup; the correct dependency order is the opposite.
Delete the walkers FIRST, because the phantom variants tagVariants
produces get inlined by canonicalize trivially once there's no
`variant` case in the walkers that treats them specially. The whole
cleanup collapses into "make canonicalize definitive, delete
downstream walkers".

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
1. Phase 2 part A: canonicalize flattens `alias` to `symbol`
   (prerequisite for walker deletion — alias case stops being
   "missing")
2. Phase 2 part B: settle canonical form for container-style rules
   (repeat(choice(...)) vs. flat-multi-child) — affects projection
   impl
3. Phase 2 part C: implement projectFields / projectChildren
   alongside existing walkers; assert both produce the same output
   across all three grammars (throw-away regression harness)
4. Phase 2 part D: delete walkForChildren + deriveFieldsRaw, switch
   callers to projections
5. Phase 1 part A: rename tagVariants → traverseRules, delete
   wrapVariants call
6. Phase 1 part B: suggestion emitter → overrides.suggested.ts
7. Phase 4: regen, lock in FLOORS, commit
```

Phase 2D is the irrevocable point — once the walkers are gone, the
canonical form is load-bearing for derivation. Have Phase 2C's
equivalence harness green before doing the delete.

Phases 1A and 4 are the follow-on cleanup — they're safer once
walkers are gone because there's no longer a hidden consumer that
could be relying on variant wrappers for shape-sensing.
