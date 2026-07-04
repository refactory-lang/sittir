# Grammar\<Phase\> + phase-parameterized ctx — design (end-state)

**Status:** design (2026-07-04), user-approved direction; implementation staged on
`grammar-phase-ctx` (stacked on PR #136's `phase-visibility-tightening`).
**Prior art:** `Rule<Phase>` (types/rule.ts), R12 unified phase context
(`2026-06-29-r12-unified-phase-context.md`), PR #136 (honest field names/types;
the `linkRules` rename and the `LinkCtx` evaluate-phase finding this design closes).
**Doctrine:** decisions 1–7 in `2026-07-02-rule-type-model-ssot-research.md`
(return-value dataflow; behavior keys on structural facts; one concept one word).

## End-state (user model, now realized in types)

The phase chain, each phase reading ONLY its input container with the matching
rule phase:

| Phase fn | Reads | rules value type | Produces |
|---|---|---|---|
| link | `Grammar<'evaluate'>` (`RawGrammar`) | `Rule<'evaluate'>` | `Grammar<'link'>` (`LinkedGrammar`) |
| normalize | `Grammar<'link'>` | `Rule<'link'>` | `Grammar<'normalize'>` (`NormalizedGrammar`) |
| simplify (final stage inside `normalizeGrammar`) | `Grammar<'normalize'>` | `RenderRule` (= `Rule<'normalize'>` + brand) | `Grammar<'simplify'>` (`SimplifiedGrammar`) |
| assemble | `Grammar<'simplify'>` | `SimplifiedRule` + carried views | `AssembledNodeMap` |
| emitters | `AssembledNodeMap` only (exceptions: templates walks per-node `renderRule: RenderRule`; suggested.ts reads the carried link view — both explicitly typed) | — | generated outputs |

## 1. `Grammar<P>` container family

One parameterized container replaces the hand-written trio:

- `Grammar<P extends PhaseName>` with `rules: Record<string, PhaseRuleOf<P>>`
  where `PhaseRuleOf<'evaluate'|'link'> = Rule<P>`, `PhaseRuleOf<'normalize'> =
  RenderRule`, `PhaseRuleOf<'simplify'> = SimplifiedRule`.
- Phase-invariant fields (name, word, externals, supertypes, references, …)
  live unconditionally; phase-gated fields follow the `RuleBase<Phase>`
  conditional-type pattern:
  - `Grammar<'evaluate'>`: ruleCatalog, extras, inline, conflicts, overrides-layer
    config (externalRoles/refineForms/groups/polymorphs paths).
  - `Grammar<'link'>`: derivations, aliasedHiddenKinds, topLevelAliasBodies,
    parentAliasedKinds, visibleAliasTargets.
  - `Grammar<'normalize'>`: + `linkRules` (carried mid-normalize link-phase view;
    see §3) — `rules` IS the wrapper-deleted set (today's `renderRules`).
  - `Grammar<'simplify'>`: + `normalizedRules` (carried `RenderRule` map, formerly
    `renderRules` on the returned bundle) + `linkRules` (carried).
- Public aliases keep the names: `RawGrammar = Grammar<'evaluate'>`,
  `LinkedGrammar = Grammar<'link'>`, `NormalizedGrammar = Grammar<'normalize'>`,
  **`SimplifiedGrammar = Grammar<'simplify'>`** (new; `normalizeGrammar`'s return
  type — today's misnamed `NormalizedGrammar` bundle). Aliases keep diffs
  reviewable and give overrides/tools a stable vocabulary.

### Vocabulary consequence (user, 2026-07-04)

`renderRules` the FIELD dissolves: normalize's output rules ARE the
wrapper-deleted set, so on `Grammar<'normalize'>` they are just `rules`
(verified: `normalizeGrammar` has exactly one normalize-phase set —
`applyWrapperDeletion(rules)` + inline-hoist fixpoint — and `SimplifyCtx` is
already constructed with `{rules: renderRules}`). The `RenderRule` VALUE-type
name stays (it's the brand). Where the map is carried forward onto
`Grammar<'simplify'>` it is named `normalizedRules` — a carried prior-phase
view, same pattern as `linkRules`.

## 2. `BaseCtx<P extends PhaseName>`

The ctx takes ONE phase parameter driving everything (replacing
`BaseCtx<R extends AnyRule>`):

- `grammar: Grammar<P>` — the whole input container moves INTO the ctx
  (completes R12's "all parameters into the ctx"; `assemble(normalized, ctx)`
  folds to `ctx.grammar`).
- `rules` remains as the convenience accessor: `get rules(): Grammar<P>['rules']`
  — derived, not stored; no opportunity for the container and rule parameter to
  disagree (the exact disagreement PR #136 found in LinkCtx).
- walker/builder generics derive from `PhaseRuleOf<P>`.
- Phase ctx classes: `LinkCtx = BaseCtx<'evaluate'>` (+ link-specific state),
  `NormalizeCtx = BaseCtx<'link'>`, `SimplifyCtx = BaseCtx<'normalize'>`,
  `AssembleCtx = BaseCtx<'simplify'>`. Each ctx is named for the PHASE THAT
  RUNS, parameterized by the PHASE IT READS.

## 3. Link builds up, never mutates phase in place (user, 2026-07-04)

Today link mutates the rules record in place, migrating values
evaluate→link mid-pass — untypeable, and the source of both the classifier
pre-resolve-snapshot bug (fixed in V2) and PR #136's LinkCtx finding.
End-state:

- Link reads `ctx.grammar.rules` (immutable `Rule<'evaluate'>` view) and
  ACCUMULATES resolved rules into a fresh `Record<string, Rule<'link'>>`,
  cloned into the `LinkedGrammar` it constructs. No value changes phase in
  place.
- Every intra-link read site chooses EXPLICITLY: the raw input view (e.g.
  `mintContentAliasKinds`, `isClauseHoistVisibleGroupAlias` — pre-resolve
  facts) or the accumulator (post-resolve facts, e.g. classification of
  already-resolved targets). The two-map dataflow makes resolution-order
  dependencies visible instead of implicit in mutation order.
- Passes that are order-dependent on the accumulator must either (a) run
  after the accumulation loop completes (preferred — phase-internal
  staging), or (b) document the ordering invariant at the read site.

## 4. Out of scope / preserved

- No behavior change anywhere: every stage byte-neutral (grammar.json,
  parser.c, node-model.json5 identical; AstMatch 117/75/102 exact).
- `AssembledNodeMap` and emitters unchanged except type annotations.
- The evaluate-side (`EvaluateCtx`) joins the family only if trivially
  compatible; otherwise follow-up.
- tools/validators keep reading node-model.json5 (their own SSOT question is
  the metadata-pipeline-consolidation spec, not this one).

## Staging (each gated)

- **S1**: `Grammar<P>` + `PhaseRuleOf` + aliases (type-level only; containers
  become aliases of the parameterized form; zero field renames beyond
  `renderRules`→`rules`/`normalizedRules` with lsproxy).
- **S2**: `BaseCtx<P>` re-parameterization + the four ctx classes + call-site
  inference fixes; `assemble` folds its grammar param into the ctx.
- **S3**: link build-up dataflow (the ~15-signature honesty ripple lands here,
  driven by the two-map split); `LinkCtx = BaseCtx<'evaluate'>`.
- S1+S2 are mechanical-with-care; S3 is the design-heavy stage (this doc §3 is
  its contract).
