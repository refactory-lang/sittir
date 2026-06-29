# R12 — Unified, generic per-phase context hierarchy

**Status:** in progress (PR-1 landed: `BaseCtx<R>` + normalize). Byte-neutral throughout.
**Descends from:** the Camp A / `compileWordMatcher` work — surfaced that the grammar
word-matcher couldn't reach link/assemble because the per-phase contexts are fragmented.
**Relation to the R-phase program:** a NEW phase, R12 (R0–R11 are the
[principle-14 sweep + module reorg](2026-06-10-principle14-sweep-and-module-reorg-proposal.md);
R10 there = the minor repo-wide comment→glossary pass, unrelated to this).

## Problem

The pipeline phases each grew their own ad-hoc context type(s) during the #14 sweep,
sized per *function family* rather than per *phase*:

- **link**: `LinkCtx` (public config), `ResolveCtx` (`allRules`/`supertypes`/`externalRoles`),
  `HiddenClassifyCtx` (`inline`/`supertypes`/…) — `supertypes` duplicated, `rules` spelled
  two ways (`allRules` vs `rules`).
- **assemble**: `AssembleCtx` (mutation: `nodeMap`/`diagnostics`), `SubtypeCtx` (`rules`/`topLevelAliasBodies`), `_UserFacingCtx`.
- **simplify/normalize**: `SimplifyCtx`/`NormalizeCtx` extending a `TransformCtx` base that
  *lives in `dsl/rule-transforms.ts`* — a compiler-pipeline concept mislocated in the dsl layer.
- **evaluate**: `EvaluateCtx` — only shares `rules`; otherwise all evaluate-specific sinks.

Consequences: cross-cutting state (the grammar word-matcher, `rules`, `supertypes`)
fragments and duplicates; a value like `wordMatcher` has to be threaded into several
ctxs; and `ctx.rules` is untyped to the phase's actual rule-view (everything is loosely
`Record<string, Rule>`, even where the phase operates on `RenderRule`/`SimplifiedRule`).

## Design

### One ctx class per phase, over a shared generic base

`compiler/ctx.ts` (compiler layer — phase-pipeline concern):

```ts
abstract class BaseCtx<R extends Rule = Rule> {
  readonly rules: Record<string, R>;          // R = the rule-VIEW this phase operates on
  readonly wordMatcher?: (s: string) => boolean;  // curried matchesWordShape
  readonly diagnostics: DiagnosticSink;
  readonly builder?: RuleBuilder;             // rule-construction strategy (dsl type)
  // readonly walker?: RuleWalker<R>;         // rule-traversal strategy (see below)
  constructor(init: BaseCtxInit<R>) { … }
}
```

`R` is the **rule union element** (`Rule` | `RenderRule` | `SimplifiedRule`), not the
collection; `rules: Record<string, R>` is derived. The views form a chain
(`SimplifiedRule ⊆ RenderRule ⊆ Rule`) that mirrors the pipeline.

### Per-phase classes (absorb the family ctxs)

| Phase ctx | extends | absorbs | mutation? |
|---|---|---|---|
| `NormalizeCtx` | `BaseCtx<Rule>` | — | no |
| `SimplifyCtx` | `BaseCtx<RenderRule>` | `TransformCtx` | no |
| `AssembleCtx` | `BaseCtx<SimplifiedRule>` | `SubtypeCtx` | **yes** — node-map accumulation as methods |
| `LinkCtx` | `BaseCtx<Rule>` | `ResolveCtx` + `HiddenClassifyCtx` (+ rename public config → `LinkOptions`) | no |
| `EvaluateCtx` | *exception* | — | yes (sinks) |

- **evaluate is the deliberate exception** — it's the builder *source* and carries
  evaluate-specific mutation sinks (`provenanceByKind`/`setWord`/…); it shares only `rules`,
  so it does NOT extend `BaseCtx` (or extends only minimally). Not forced.
- **inline-kinds is phase-local** (link: `readonly string[]`; simplify: `ReadonlySet`) — each
  subclass declares its own; NOT on the base (no lossy reconciliation).

### Option 2 — the operated-on view lives on `ctx.rules`

Today the refined views are passed as *arguments* (`computeSimplifiedRules(renderRules, ctx)`)
while `ctx.rules` is the raw `Rule` lookup map (and is *vestigial* in simplify). To make
`SimplifyCtx<RenderRule>` etc. **accurate**, move the operated-on view onto `ctx.rules`:
`computeSimplifiedRules(ctx)` reads `ctx.rules: Record<string, RenderRule>`. This changes
each phase entry's signature + its callers + tests. This is *the point* — the generic is
meaningless unless `ctx.rules` holds the phase's real view.

### Strategies on the base: `RuleBuilder` + `RuleWalker<T>`

- `RuleBuilder` (exists, dsl): rule *construction* (structural ⇄ attribute). Stays on base.
- `RuleWalker<T>` (NEW): rule *traversal*, symmetric to the builder. **Designed from inventory,
  not upfront** — the existing walks do different jobs (`recurseChildren` structural-map,
  `walkRuleForTemplate` text-emit [the flagged "walker hotspot"], `slot-grouping` diagnostic
  visit). As each phase is converted, inventory its walk; once mapped, define `RuleWalker<T>`
  grounded in the real walks and add it to `BaseCtx` next to `builder`.

### Layering & cycle-avoidance

- `compiler/ctx.ts` imports the **`RuleBuilder` type** from `dsl/` (`compiler → dsl`, allowed).
- dsl transform helpers that need a builder take a structural **`{ builder?: RuleBuilder }`**
  slice, NOT the compiler `BaseCtx` → no `dsl → compiler` cycle.
- `TransformCtx`/`NormalizeCtx`/`SimplifyCtx` move OUT of `dsl/rule-transforms.ts` (which slims
  to transform utilities + `RuleBuilder`).

### Immutability / least-privilege

- Inputs are `readonly` (+ `ReadonlyMap`/`ReadonlySet`/`readonly[]`). Mutation surfaces are
  **methods** on the concrete subclass (e.g. `AssembleCtx.recordNode`), never a bare mutable
  field on the base. Functions that must not mutate take a `Readonly<XCtx>` / narrowed view —
  the caller still passes the one ctx object.
- Spread-derivation (`{...ctx, extra} as XCtx`) becomes `new XCtx({ ...ctx, extra })`.

## Decisions (resolved in design discussion, 2026-06-29)

1. **Classes**, not interfaces (encapsulated mutation API where it earns it; `new X({...ctx})` for the few spread sites).
2. **A base class** (`BaseCtx`) — phases inherit; cross-cutting state defined once.
3. **In `compiler/`, not `dsl/`** — phase ctx is a compiler concern.
4. **Generic over the rule UNION** (`R extends Rule`), collection derived (`Record<string,R>`).
5. **Option 2** — operated-on view on `ctx.rules` (the generic's whole point).
6. **`RuleWalker<T>`** added, but **designed from per-phase inventory**, not speculatively.
7. **evaluate is the exception** (builder source; minimal/no base).

## Execution plan (PR-by-PR, each gated byte-neutral)

Gate each: gen smoke per phase + `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native` holds
**rust 117 / ts 75 / py 102** + `#14` ratchet OK. Branch: `unify-phase-ctx`.

1. **PR-1 — `BaseCtx<R>` + normalize** ✅ DONE (gen-green). `compiler/ctx.ts`; `NormalizeCtx extends BaseCtx<Rule>`; `TransformCtx`/`NormalizeCtx` pulled from `dsl/`.
2. **PR-2 — simplify**: `SimplifyCtx extends BaseCtx<RenderRule>`; option-2 (`computeSimplifiedRules` reads `ctx.rules`); retire dsl `TransformCtx`; inventory the simplify walk.
3. **PR-3 — assemble** (lands Camp A): `AssembleCtx extends BaseCtx<SimplifiedRule>` + node-map mutation methods; absorb `SubtypeCtx`; Camp A site `resolveHiddenRuleContent` → `ctx.wordMatcher`.
4. **PR-4 — link** (lands Camp A): merge `ResolveCtx`+`HiddenClassifyCtx` → `LinkCtx extends BaseCtx<Rule>`, public config → `LinkOptions`; Camp A `collectSubtypeNames` → `ctx.wordMatcher`.
5. **PR-5 — evaluate**: minimal/no base (exception); the enrich Camp A site (`isIdentifierShaped`) reconsidered here.
6. **PR-6 — `RuleWalker<T>`**: define from the inventory; add to `BaseCtx`; migrate the scattered walks.

## Camp A (the original goal) rides on PR-3/PR-4

The 3 grammar-token sites (`assemble:resolveHiddenRuleContent`, `link:collectSubtypeNames`,
`enrich:isIdentifierShaped`) route through the grammar word-matcher via `ctx.wordMatcher` once
their phase carries it — making keyword-shape uniformly grammar-aware (consistent with the
PR #106 `classifyNode` fix). Byte-neutral today; fixes the latent unicode-keyword misclassification.
