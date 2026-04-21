# ADR 0009 — Remove `installGrammarWrapper`; wire() owns all synthesis

**Status**: Accepted (2026-04-21)
**Date**: 2026-04-21
**Related**: ADR-0002 (enrich mechanical-only), ADR-0007 (wire opts wrapper), ADR-0008 (declarative transforms)

## Context

`installGrammarWrapper` (`packages/codegen/src/dsl/synthetic-rules.ts`)
monkey-patches `globalThis.grammar` at module load. Its wrapped
`grammar()`:

1. Merges `__enrichOverrides__` (emitted by the old callback-style
   `enrich`) into `opts.rules`.
2. Runs a pass-1 dry-run with a permissive `$` proxy to discover
   synthetic-rule names registered by `variant()`/`alias()` inside rule
   callbacks.
3. Pre-injects `blank()` placeholders into `opts.rules` for those names
   so tree-sitter's `ruleMap` snapshot sees them.
4. Wraps each rule fn to track `currentRuleKind` during pass-2 evaluation.
5. Calls the native tree-sitter `grammar()`.
6. Drains captured synthetic-rule bodies and substitutes them for the
   blank placeholders.
7. Drains variant-conflict groups, symbolizes them through `$`, and
   appends to the result's conflict list.

Wire (ADR-0007) and declarative transforms (ADR-0008) already handle
1–4 and 7 declaratively:

- `wire({ polymorphs, transforms })` enumerates every hidden rule name
  at `wire()` call time and injects deferred-content fns (no pass-1
  needed).
- `wire()`'s `wrapAllRuleFns` sets a per-context `currentRuleKind` via
  closure (no `globalThis` mutation).
- `wire()`'s `WireContext.deposits` captures bodies as rule fns run;
  deferred-content fns read from it during tree-sitter iteration.
- `wire()`'s `wrapConflictsCallback` appends accumulated conflict
  groups to the user's callback return value.
- Pure enrich (this session, previous ADR work) no longer emits
  `__enrichOverrides__` at all — it mutates `base.grammar.rules`
  directly and injects `_kw_<name>` hidden rules into the rules bag.

Empirical state at the time of this ADR:

- All three grammars (`rust`, `python`, `typescript`) wrap opts in
  `wire({...})` (verified `grep 'default grammar' packages/*/overrides.ts`).
- Zero inline `variant()` calls in any `overrides.ts`.
- One inline `alias()` call (`rust/overrides.ts:515`) that uses
  tree-sitter's **native** two-arg `alias($.x, $.y)` form — not the
  sittir one-arg placeholder, so it never touches
  `registerSyntheticRule`.
- `dsl/synthetic-rules.ts` carries ~400 lines of dual-write bookkeeping
  (legacy module state + wire routing) kept alive during migration.

## Forcing Constraint

> "And don't forget wrapper is supposed to go away"
> — user, this session

The wrapper was always intended as migration scaffolding. ADR-0007 and
ADR-0008 built the permanent replacement (`wire()`). With the three
grammars migrated and enrich pure, the scaffolding has no live
responsibility left — only dual-write code paths that shadow wire's
bookkeeping.

## Alternatives Considered

- **Keep the wrapper as defensive infrastructure.** Rejected: it's a
  `globalThis.grammar` monkey-patch with ~200 lines of pass-1 dry-run
  machinery. Every remaining call it intercepts is also routed through
  wire, so the wrapper is pure shadow bookkeeping. Keeping it means two
  parallel sources of synthetic-rule state forever, and every debug
  session has to reason about both.

- **Keep the wrapper but stop dual-writing.** Rejected for the same
  reason: the wrapper's only non-dual-write responsibility was
  `__enrichOverrides__` merging, which is dead code after pure enrich.

- **Leave migration work for a future session.** Rejected by the
  forcing constraint — the user's direction is to finish it now while
  the state is in context.

## Decision

Delete `installGrammarWrapper` and the legacy module-level accumulators
that exist only to service it. `wire()` becomes the single owner of
synthetic-rule synthesis, polymorph-variant metadata, conflict
accumulation, and `currentRuleKind` tracking.

Audit of all three in-repo overrides (`rust`, `python`, `typescript`)
shows **zero two-arg `field(name, 'literal')` calls at config-literal
positions** — every `field(...)` call site is either the one-arg
placeholder form (which returns an object, no registration) or lives
inside a rule-callback body (which executes under wire context, so
registrations route to `context.deposits`). The module-load
accumulator currently has zero live callers.

Given that, `synthetic-rules.ts` ends up with **no module-level state
at all** after this ADR:

- `registerSyntheticRule` routes only to `wireRegisterSyntheticRule`.
  If no wire context is active, throw a clear error ("called outside
  wire context — wrap your `grammar()` opts in `wire(...)`").
- `wire.ts::absorbModuleLoadSyntheticRules` is deleted (nothing to drain).
- If a future grammar needs two-arg `field(name, 'lit')` at a
  config-literal position, the fix is to either (a) move the
  declaration into a rule callback, or (b) reintroduce the minimal
  accumulator then — but ship without it until that pressure exists.

Remove in six phases (Phase 1 → Phase 6 in the plan section below),
with a `pnpm test` + `tree-sitter generate` gate between each phase to
catch regressions early.

## Principles Applied

- **P-005 (Single source of truth)** — wire becomes the only owner of
  synthetic-rule bookkeeping, variant metadata, conflict accumulation,
  and `currentRuleKind`. The legacy module-level state is shadow
  bookkeeping; one source is authoritative, not two.
- **P-007 (Cut speculative scope)** — the dual-write paths and pass-1
  dry-run machinery exist to handle scenarios (inline `variant()` calls
  in rule callbacks, `__enrichOverrides__` merging) that are no longer
  in use. Delete them.
- **P-008 (Composition over configuration)** — `wire()` composes rule
  functions at config time with closures holding per-invocation state,
  replacing a `globalThis` monkey-patch with reentrancy-safe composition.

## Consequences

- **Enables**:
  - Single source of truth for synthetic-rule state (wire context).
  - No `globalThis.grammar` monkey-patching — imports are side-effect-free
    for grammar semantics.
  - `synthetic-rules.ts` shrinks from ~600 lines to ~170 and carries
    **no module-level state**. Only `maybeKeywordSymbol`,
    `registerAliasedVariant`, and pure tree helpers
    (`matchesEmpty` / `factorOutEmptiness` / `wrapInPrecStack`) remain.
    Every registration routes through the active wire context.
  - Simpler mental model for future wire-config authors: "synthesis
    is what wire does at config time".
  - Removes pass-1 dry-run, which was a correctness risk (the permissive
    `$` proxy could resolve symbols that real `$` would reject).

- **Costs**:
  - One-time churn in `synthetic-rules.ts` + possibly affected tests.
  - Any future need for inline `variant()`/`alias()` calls in a rule
    callback must now either extend `wire()` declaratively or install a
    wire context manually — the wrapper's "just works" convenience is
    gone.
  - Any third-party `overrides.ts` not yet migrated to `wire()` will
    break. Currently moot (only in-repo grammars exist), but the
    contract is stricter.

- **Follow-ups** (post-ADR cleanup, order-independent):
  - **Audit tests** that call `registerSyntheticRule` directly: they
    must install a wire context or test through wire's public API.
  - **Doc sweep** — update `docs/design-principles.md` commentary and
    any references in in-repo docs pointing at `installGrammarWrapper`
    as the synthesis path.
  - **Remove `dsl/index.ts`'s `installGrammarWrapper()` import** — yes,
    it's the only reason the function is invoked.

  - **Relocate remaining `synthetic-rules.ts` contents, delete the
    file.** The four pieces that remain after Phase 6 each have a
    natural home elsewhere, and the module's organising concept
    (synthesis-as-scoped-state) is replaced by wire's per-invocation
    context:
    - `maybeKeywordSymbol` → **`field.ts`** (field-name → keyword-symbol
      helper, inseparable from `field(name, 'lit')` semantics).
    - `registerAliasedVariant` → **`transform.ts`** (or sibling
      `transform-variant.ts`) — it's the VariantPlaceholder resolve
      step, no other caller.
    - `matchesEmpty` / `factorOutEmptiness` / `extractNonEmpty` →
      **`runtime-shapes.ts`** (pure structural predicates, already the
      home for rule-tree type predicates).
    - `wrapInPrecStack` → **`transform-path.ts`** (lives next to
      `reconstructPrec` which it delegates to).

    After the moves, `dsl/synthetic-rules.ts` deletes entirely.

  - **Deprecate inline `transform()` in overrides; all transforms flow
    through `wire({ transforms })`.** The four current inline sites
    (`rust/overrides.ts:438/448/464/514`) exist only because wire's
    `transforms:` composition runs AFTER `polymorphs:` wrapping, so
    path expressions that reach pre-alias structure (`'2/_expression'`,
    `'0/0'`) don't resolve declaratively today. Two paths to fix:

    (a) Add `preTransforms:` config to wire — runs before polymorph
        wrapping, matching inline-transform semantics.
    (b) Invert wire's composition order so `transforms:` wraps inside
        `polymorphs:` (transforms run first, polymorphs apply on top).

    Prefer (b) if it doesn't break existing semantics — single
    declarative surface is cleaner. After either, migrate the four
    inline sites and remove the `rules:` entries entirely. `transform()`
    becomes an implementation detail wire calls internally, never
    imported by overrides.

  - **DSL module layout — move to a subfolder.** After the relocations
    above, `dsl/` contains a coherent set of author-facing primitives
    (`field`, `variant`, `alias`, `transform`, `wire`, `enrich`,
    `role`) plus helpers. Consider:

    ```
    packages/codegen/src/dsl/
      index.ts                      ← public surface re-exports
      primitives/                   ← author-facing DSL
        field.ts
        variant.ts
        alias.ts
        role.ts
      transform/                    ← transform family
        transform.ts
        transform-path.ts
        transform-variant.ts        ← from synthetic-rules::registerAliasedVariant
      wire/
        wire.ts
        wire-context.ts             ← WireContext type + accessors
      enrich.ts                     ← stays at top (single entry point)
      runtime-shapes.ts             ← stays at top (cross-cutting predicates)
    ```

    The import surface (`import { field, transform, wire, enrich }
    from '@sittir/codegen/dsl'`) stays unchanged — `index.ts`
    re-exports — so overrides files don't touch. Pure file-layout
    hygiene; defer until the relocations above settle so we're not
    moving files twice.

## Verification

This decision is wrong if we discover a pattern where synthetic rules
must appear in the grammar **without** a `wire()` config declaring
them — e.g. a third-party library that wants to synthesize `_<kind>`
rules from a `transform()` call made deep inside a user's rule callback
without extending wire's config. That scenario would argue for a
runtime-discovery mechanism like the wrapper provided.

Signals to revisit:
- A grammar lands that genuinely can't express its synthesis needs in
  `wire({ polymorphs, transforms })`.
- Corpus regressions appear specifically in rules that use inline
  `variant()`/`alias()` calls (the migration rewrites would no longer
  work).
- Wire's `deposits` map grows a cross-rule dependency (rule A's
  deferred fn reads content deposited by rule B, where tree-sitter's
  iteration order doesn't match wire's insertion order).
- Two-arg `field(name, 'literal')` starts appearing at config-literal
  positions in a new grammar's overrides. Signal that the
  module-accumulator-removal decision needs to be re-examined: either
  reintroduce the accumulator, or require the author to move the
  declaration into a rule callback.
