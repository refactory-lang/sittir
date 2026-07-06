# Design Spec — Separator-canonical (PR-S): mechanism refresh

> **Status:** design approved (2026-07-06), pending spec review → implementation plan.
> **Supersedes** the *phasing/mechanism* section (§"Phasing — DEFER separator
> assignment to the push-down phase" and its subsections) of
> `2026-05-30-separator-canonical-design.md`. That doc's **target shape**
> (§"Target — a single structured `Rule`, NOT `string`") and **consumer
> inventory** (§"Consumer migration") remain valid reference — cross-linked
> below, not duplicated — but its mechanism section was built on a two-site
> lossy-lift premise (`evaluate.ts` + `applyWrapperDeletion`) that no longer
> exists. This doc supplies the corrected mechanism, grounded against current
> code (2026-07-06), plus new findings (`RuleWalker` contract, the
> wrapper-deletion/simplify split, diagnostic-printing wiring) the old spec
> never addressed.

## Problem

`RuleBase.separator` (`types/rule.ts`) is a 3-way union
(`string | Rule[] | {rules, trailing?, leading?}`) that every consumer branches
on by shape. The underlying capability gap it should fix — representing and
eventually rendering a rule-shaped separator (`choice(',', ';')`, alternating
delimiters) instead of only a single literal — has never shipped. Confirmed
2026-07-06: `RuleBase.separator` is still the old union; the separator-canonical
collapse was speced twice (2026-05-30, then again after PR #53 review) but only
ever landed as docs, never as code.

## What changed since the old spec (grounding check, 2026-07-06)

The old spec assumed the lossy narrowing (`choice(',', ';')` → first string
only) was smeared across two sites: an eager `evaluate.ts` lift and a
post-fanout gap that `applyWrapperDeletion` was meant to consolidate. Neither
premise holds today:

- **`evaluate.ts`'s eager lift no longer exists** (its own comments now say the
  lift "runs in the link pass, not here").
- **The lift is already consolidated into ONE site** — `link.ts`'s
  `liftSeparators` (`compiler/link.ts:2630-2656`), which calls
  `detectRepeatSeparator` (`dsl/list-patterns.ts:96-118`). *That* function's
  `firstStringOfChoice` helper (`dsl/list-patterns.ts:79-84`) is where the
  non-first choice arms are discarded today — the actual, current, single
  point of loss.
- **`applyWrapperDeletion` runs strictly after this lift** and only ever
  receives an already-lossy `string` — by the time it runs there is nothing
  left to recover. The old spec's target site (wrapper-deletion) was never
  where the loss happens.
- `RepeatRule<'link'>.separator` is currently typed `string`
  (`types/rule.ts:271-274`) and must widen to `Rule<'link'>` for any of this to
  work. `RepeatRule<'evaluate'>` stays `string` — pre-lift separators are
  always literal DSL-authored strings; the choice-shaped ambiguity only
  becomes representable after link's `factorChoiceBranches` restructuring.
- Widening the type turns some `.separator === ...` identity comparisons
  unsafe (object identity instead of structural equality) — a broader set
  than the old spec's 5 flagged sites, confirmed below.
- **`RuleWalker.map`** (the shared rebuild/rewrite primitive, R12 PR-6) is
  documented as *deliberately* excluding separator edges from its rebuild
  contract, even though its sibling read-only primitives (`fold`/`find`, via
  `childrenOf`) already include them. This is a new finding the old spec never
  considered, since the old spec predates `RuleWalker` entirely.

Two files the old spec cited no longer exist under those names —
`list-fusion.ts` (folded into `simplify.ts`, then further into
`dsl/rule-transforms.ts`) and `group-synthesis.ts` (folded into `link.ts` by
R7) — their logic is intact, just relocated. `template-walker.ts`, which the
old spec speculated might be dead code, is NOT dead — R7 folded it into
`collect-slots.ts`, where its separator-reading helpers are still live.

## Target shape (unchanged — carried forward from the 2026-05-30 spec)

`separator?: Rule` — a single rule, not a list, not a union. A `StringRule`
for the common literal case; a `ChoiceRule`/`SeqRule` for rule-shaped
separators. `trailing?`/`leading?` stay as sibling booleans, unchanged. See
`2026-05-30-separator-canonical-design.md`'s "Target" section for the full
rationale (string-collapse was considered and rejected there; not re-litigated
here).

## Mechanism — Stage 1 (byte-neutral plumbing)

**Type widening.** `RepeatRule<'link'>.separator`: `string` → `Rule<'link'>`.
`RepeatRule<'evaluate'>` unchanged.

**Lift-site rewrite.** `dsl/list-patterns.ts`'s `detectRepeatSeparator` stops
calling `firstStringOfChoice` — returns the full detected `Rule` instead.
`link.ts`'s `liftSeparators` needs no change beyond accepting the wider return
type.

**`RuleWalker.map` widens to match `childrenOf`.** Today `map` rebuilds only
via structural edges (`members`/`content`); `childrenOf` (used by
`fold`/`find`) already includes separator-array/object-form edges. Widen
`map` to use the same relation — one canonical edge-set, no exception.
**Verified risk-free**: zero production call sites use `.map()` today (only
`.find()`/`.fold()`, both already separator-aware via `childrenOf`); the 2
existing unit tests for `.map()` don't touch separator either. `map`'s own doc
comment (currently: *"deliberately outside map's contract"*) gets corrected as
part of this change.

**`simplify.ts`'s `simplifyRule` migrates onto `ctx.walker.map`.** Its
recursion is already bottom-up (`rule.members.map((m) => simplifyRule(m,
ctx))`, then fold/collapse) and its `ctx` is shared config, not a per-descent
accumulator — a genuine fit for `map`'s contract. Migrating it means it picks
up separator-recursion automatically via the widened relation, with no
bolted-on special case.

**`wrapper-deletion.ts`'s `deleteWrapperWith` keeps its own recursion.**
Confirmed by reading it: it threads a real top-down accumulator (`WrapperAttrs`,
folded and updated at each wrapper level, then passed to the recursive call on
`.content`) — the opposite shape from `map`'s bottom-up, no-accumulator
contract. Forcing it onto `map` would be architecturally wrong, not a
mechanical migration. Instead: at the point it currently treats a lifted
`rule.separator` as an opaque already-resolved value, it explicitly calls
`deleteWrapperWith(rule.separator, {})` (fresh, empty accumulator — the
separator is a sibling structure, not nested under the same wrapper stack).

**Any other hand-rolled tree-walk** in the normalize/simplify pipeline not
built on `RuleWalker` (e.g. `inlineRefs`, if its traversal turns out to be
hand-rolled rather than delegated) gets audited during implementation for the
same gap, using whichever of the two patterns above fits its shape.

**Comparator fixes.** `normalize.ts`'s `rulesEqual` (confirmed to operate on
post-lift `Rule<'link'>` data) switches its `.separator` comparison from
`===` to a recursive structural check (reusing `rulesEqual` itself — 
`.separator` is now just another `Rule`). `evaluate.ts:2163/2167` and
`dsl/list-patterns.ts:63` get a one-line confirmation each during
implementation that they only ever see pre-lift `string` data; if either
turns out to touch post-lift data, it gets the same fix, in this same PR (not
deferred).

**Consumer migration** (the ~10 shape-branching sites the old spec inventoried,
current locations confirmed 2026-07-06):
1. `templates.ts:1098-1106` `separatorToString`
2. `templates.ts:1118-1157` `selectJoinFilter`
3. `node-map.ts:1112-1123` `extractSeparatorString`
4. `collect-slots.ts:61-80` `findNestedSeparator`
5. `collect-slots.ts:402-418` (sibling-flags-vs-object branch)
6. `dsl/rule-transforms.ts:556-578` (producer + `fuseHeadRepeatLists`, formerly `list-fusion.ts`)
7. `dsl/rule-attrs.ts:96-126` `sharedArmAttrs` (currently `JSON.stringify`-compares as a workaround — replaced by the structural-equality helper from the comparator fix above)
8. `collect-slots.ts:523-544` `findRepeatSeparator` (formerly in `template-walker.ts`, folded here by R7; its old "latent object-form bug" already dissolved — stays dissolved)

Each migrates its branch from shape-probing (`typeof === 'string'` /
`Array.isArray` / `'rules' in sep`) to the `Rule` type discriminant
(`isStringType(rule.separator)`). Every site preserves **identical behavior
for the literal case**; non-literal cases keep whatever fallback/default path
they already have today (still gated on PR-T for actual render support — this
PR doesn't add new rendering, just an honest type).

**Gate:** `validate:native` holds exactly across all 3 grammars (no grammar
today exercises a non-literal separator), regen byte-identical, full test
suite green (existing `simplify.ts`/`wrapper-deletion.ts` suites must match
byte-for-byte, not just aggregate counts), `propose-14` ratchet OK.

## Mechanism — Stage 2 (small, additive: the warning diagnostic)

**Emission site:** `link.ts`, where `liftSeparators`/`detectRepeatSeparator`
resolves a separator to something other than a `StringRule`. Emit via
`ctx.diagnostics.warn({...})` — a `CompilerDiagnostic`
(`scope:'compiler'`, `phase:'link'`, `canProceed: true`, never blocking).

**Surfacing (the actual gap this closes).** Confirmed 2026-07-06:
`DiagnosticSink.all()` has exactly one caller today
(`emit-gate.ts::assertEmittable`), which filters for `severity === 'fail'`
only — a `warning` currently accumulates in the sink and is never printed.
Confirmed separately that `runGrammarDiagnosticsPreflight`/
`collectGrammarDiagnosticsForGrammar` (the mechanism that DOES print today) is
a **structurally separate path** — it re-evaluates the raw grammar fresh,
pre-link, so it cannot see a fact only detectable during link's fanout
normalization. Routing through it would mean re-deriving the same fact twice
(a DRY violation) and is also not mechanically possible given when the fact
becomes available. The fix: extend `generate.ts`'s post-`assertEmittable`
step to also print the sink's non-`fail` diagnostics (reusing/adapting the
existing `formatGrammarDiagnostics`-style formatting — both diagnostic types
share the same base `Diagnostic` shape).

**Expectation:** 0 real witnesses across all 3 grammars today (verified — none
currently have a non-literal separator). Forward-looking scaffolding, proven
via a synthetic unit test plus an explicit check that all 3 real grammars
print zero diagnostics (empirically confirming the "0 witnesses" claim, not
just asserting it).

**Gate:** same `validate:native` HOLD + full suite; new synthetic diagnostic
test; confirmed zero diagnostics on real grammars.

## Out of scope

- PR-T (`role:'separator'` child slot + `delimits` edge, actual render
  support for non-literal separators) — separate design
  (`2026-05-26-non-slot-separator-rules-design.md`), unchanged, still gated on
  this PR landing first.
- Any grammar/override authoring changes — pure compiler-side plumbing.
- The TypeScript `validate:native` gaps from the parallel diagnostic sweep
  (factory-arg bug, trailing/leading render bug, etc.) — separate initiative.
- Adding a top-down/accumulator-threading capability to `RuleWalker` —
  explicitly rejected; `wrapper-deletion.ts` keeps its own recursion for that
  shape.

## Risks

- Consumer migration touches ~10 sites across compiler/dsl — moderate diff,
  mitigated by byte-identical literal-case behavior and the full gate.
- Widening `RuleWalker.map`'s contract changes a shared primitive's guarantee
  for future callers, not just today's (verified zero) callers — its doc
  comment must be corrected as part of this change so the next reader isn't
  misled the way this spec's predecessor's stale citations misled this
  refresh.
- `simplify.ts`'s migration touches a core, heavily-exercised file — its
  existing test suite must stay green byte-for-byte.

## Implementation notes

- **Mechanical changes go through `lsproxy-cli`, not hand text-edits** — any
  wide rename, and in particular a `textDocument references` pass on
  `RuleBase.separator`/`RepeatRule.separator` to verify the ~10-site consumer
  inventory above is actually complete before committing to the type change
  (this spec's inventory was hand-derived by a research agent; an LSP-driven
  reference check is the correctness backstop). `--dry-run` first on anything
  unfamiliar.
- Regen + `validate:native` after each mechanical step, per this project's
  standard gate discipline.

## Sequencing

Stage 1 lands as its own gated PR (byte-neutral, no user-visible behavior
change). Stage 2 lands as a small, separate follow-on PR (additive diagnostic
only).
