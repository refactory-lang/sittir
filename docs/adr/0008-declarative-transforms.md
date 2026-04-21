# ADR 0008 — Declarative transforms: every override is data

**Status**: Accepted
**Date**: 2026-04-20
**Related**: ADR-0007 (declarative polymorphs via `wire()`), specs/006-override-dsl-enrich/

## Context

ADR-0007 moved polymorph variant declarations out of `transform()` patch bodies into a declarative `polymorphs:` block inside `wire()`. That gave three wins: synthetic rule names visible in one place, grep-able by kind, and — critically — pre-registerable in `opts.rules` before tree-sitter snapshots `ruleMap` at `grammar()` entry. No pass-1 dry-run needed for polymorphs.

But `installGrammarWrapper` survived because polymorph variants aren't the only source of synthetic hidden rules. Every site across all three grammars that still requires the wrapper's pass-1 discovery looks like one of these:

1. **`field('name', 'literal')`** (two-arg with bare-string content). Enrich's optional-keyword pass emits these, and user overrides emit them too (rust's `field('async', 'async')`, `field('pub', 'pub')`, etc.). `maybeKeywordSymbol` synthesizes `_kw_<name>` at rule-fn-call time.
2. **`field('name')`** one-arg placeholder where the captured content at the target path is a bare string. Example: rust's `field('turbofish')` wrapping `'::'` — creates `_kw_turbofish` at rule-fn-call time, with the body derived from the captured content, not from the keyword string.

Both are discoverable at rule-fn-call time but not at `wire(config)` time if the config is a rule fn: the fn body is an opaque closure until invoked.

Three directions were considered:

- **Static scan** of each rule fn's `.toString()` source, regex-matching `field(...)` sites. Works in practice for this codebase (no import aliasing, no dynamic names, no minification), but relies on source inspection — "knowledge lives in the regex." Rejected earlier on ergonomics grounds even though viable.
- **Author declares every keyword in `wire({ keywords: [...] })`**. Pushes the list out as data, but scales with every field-name-over-bare-string site; drifts further with every new override. Rejected as boilerplate-heavy.
- **Change the authoring shape so `transform()` bodies live in config, not inside rule fn closures.** Rule bodies become declarative data — wire sees every `field()` / `variant()` / `alias()` placeholder at config-processing time and pre-registers the corresponding hidden rules before `grammar()` runs.

The last direction treats rule overrides the same way ADR-0007 already treats polymorphs: the metadata moves from hidden-inside-a-closure to visible-at-the-surface, and the synthesis mechanism becomes statically inspectable.

## Forcing Constraint

> "And static analysis of the transforms before loading was a not-viable correct?"
>
> "Pre-registered transforms?"

The observation that collapsed the design: every override that's just `($, original) => transform(original, <patch-map>)` is carrying a single patch-map inside a closure that exists solely to wrap it. Moving the patch-map to config-level data — the same shape polymorph declarations already use — removes the closure entirely, and with it every argument against full static discovery.

## Alternatives Considered

- **Static scan of rule-fn sources** (`.toString()` + regex). Works in our codebase. Rejected in favour of declarative shape because the knowledge lives in a regex rather than at the authoring surface — "grep for `field('x')` in overrides.ts" becomes "read the transforms block at the top." See ADR-0007 alternatives for the same reasoning.
- **Explicit `keywords: Record<string, string>` block in `wire()`**. Author enumerates every field-name-to-keyword mapping. Scales linearly with override growth; has to be re-audited whenever a transform is added. Rejected — more maintenance burden than just making transforms themselves declarative.
- **Keeping `installGrammarWrapper` with narrow `_kw_*` scope**. The pragmatic middle ground. ADR-0007's scope-reduction acknowledged this was where we landed. Replaced by this ADR because declarative transforms remove the dependency entirely rather than accepting it.
- **`buildGrammar(base, opts)` explicit helper replacing the `globalThis` mutation**. Same pass-1/pass-2 logic as the wrapper, invoked by name rather than by monkey-patch. Rejected during ADR-0007 discussions; still rejected here — doesn't address the root issue (synthetic names aren't knowable until runtime) and retains the dry-run cost.

## Decision

`wire()`'s config gains a first-class `transforms:` block. Each entry is a rule kind → (patch-map) or (array of patch-maps for multi-patchset rules):

```ts
export default grammar(enrich(base), wire({
    polymorphs: { ... },
    aliases:    { ... },
    transforms: {
        async_block: {
            '1/0': field('move'),
            2:     field('block'),
        },
        closure_expression: [
            { 0: field('static'), 1: field('async'), 2: field('move') },
        ],
        array_expression: [
            { 1: field('attributes') },
            { '2/_expression': field('elements') },
        ],
        // …
    },
    rules: {
        // Only entries that genuinely need a fn body:
        //   - full replacements (function_modifiers, visibility_modifier)
        //   - hand-authored hidden rules (_wildcard_pattern, _kw_*)
        //   - anything beyond a plain transform(original, patch-map) call
    },
}))
```

`wire()` at config-processing time:

1. **Walks every `transforms:` entry.** Each patch value is a plain object (not a closure). For every `field('x')` / `variant('y')` / `alias('z')` placeholder encountered at any nested depth, compute the corresponding hidden rule name:
   - `field('x')` one-arg or `field('x', <anything>)` → `_kw_x`
   - `variant('y')` under rule `R` → `_R_y` (plus polymorph metadata)
   - `alias('z')` → `_z`
2. **Pre-registers each hidden rule** in the returned `opts.rules` as a deferred-content fn. Content fills at rule-fn-call time via the same deposit-into-WireContext mechanism used today for polymorphs.
3. **Synthesizes the rule fn** for each transforms entry — `($, original) => transform(original, ...patchSets)` — and inserts it into `opts.rules`. When a `rules:` entry exists for the same key, compose: user fn runs first, transforms' patches apply on its output.
4. **Runs the existing polymorph/alias processing** against their respective blocks. Same machinery.

With every hidden rule name known at `wire()` return, tree-sitter's `ruleMap` snapshot at `grammar()` entry sees all of them. No pass-1 dry-run. No `globalThis.grammar` wrapping.

`installGrammarWrapper`, `currentOptsRules`, `currentBlankFn`, the pass-1/pass-2 machinery, and the `dsl/index.ts` side-effect import are deleted. `synthetic-rules.ts` slims to just the registration helpers (`registerSyntheticRule`, `registerPolymorphVariant`, `registerConflict`, `maybeKeywordSymbol`, `registerAliasedVariant`) that transform.ts still calls at rule-fn-call time to deposit content — wire's context absorbs every deposit.

## Principles Applied

- **P-001 (External contract first)** — tree-sitter's `grammar()` receives complete `opts.rules` at its `ruleMap` snapshot; no wrapping of tree-sitter's own function.
- **Explicit over implicit** — every synthetic kind name appears in the config block where it's derived. Readers don't need to imagine what a rule fn will do at runtime; they read the patch-map.
- **Data over code** — closures carrying a single patch call become config entries carrying the patch itself. The closure was never load-bearing; only the patch was.
- **Locality of effect** — state remains in `wire()`'s per-invocation closure (ADR-0007). No module globals, no `globalThis` mutation.

## Consequences

- **Enables**: Full deletion of `installGrammarWrapper` and the pass-1/pass-2 dry-run. Removes `currentOptsRules` / `currentBlankFn` module state. Slims `dsl/index.ts` to pure re-exports with no module-load side effects.
- **Enables**: Every synthetic hidden rule name in a grammar is grep-able from one config object. Given a kind name, the author (or a future reader) finds its declaration by searching within a ~50-line block at the top of overrides.ts rather than hunting through rule-fn bodies.
- **Costs**: Migration of every `($, original) => transform(original, {...})` rule fn into a `transforms:` entry. Three grammars, most rules — substantial but mechanical, subagent-friendly.
- **Costs**: Rule bodies that go beyond a plain transform — full replacements, rules declaring hidden helpers, rules with conditional branching — stay in `rules:`. The split requires authors to know which rules are "just a transform" vs "actually a fn body." Clear in practice (grep for non-transform fn bodies) but adds a conceptual boundary.
- **Costs**: The `($, original)` arg is implicit in the synthesized fn. Authors who wanted to reference `$` inside a patch value (e.g. `{ 0: $.something }`) can't — `$` is only valid inside a real rule fn. In practice, patch values are placeholders (`field`, `variant`, `alias`) or rule objects built from `$` references, which users already construct via `rules:` entries.
- **Follow-ups landed** (when this ADR is implemented): wire config schema extended; transforms block accepted; rule-fn synthesis; full wrapper deletion; migration of rust/python/typescript overrides.

## Verification

- If any override ends up with `transforms:` entries AND duplicate `rules:` entries for the same kind without an obvious reason to compose them, the composition rule is being used to work around a transforms limitation. Review whether the transforms block needs an additional capability or whether the override genuinely needs a fn body.
- If a `_kw_<name>` or `_<name>` hidden rule appears in a grammar's parse output but isn't in `opts.rules` at snapshot time, wire's patch-walk missed a case — investigate which placeholder shape wasn't recognized.
- If `installGrammarWrapper` needs to be restored for any reason, a load-bearing synthetic-rule source hasn't been captured by the `transforms:` / `polymorphs:` / `aliases:` / `keywords:` (if added) blocks, and the declarative surface is incomplete. Expand the config schema rather than reintroduce the wrapper.
- If two grammars end up duplicating a common `_kw_*` rule in hand-authored `rules:` entries, consider promoting that to a shared `keywords:` block (currently marked as follow-up in ADR-0007; may land with this ADR's implementation if the pattern shows up).
