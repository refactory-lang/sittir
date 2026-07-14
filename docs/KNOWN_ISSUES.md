# Known Issues

Running list of known, non-blocking gaps discovered during feature work — documented here rather than silently forgotten, but not urgent enough to have blocked the work that found them. When one gets fixed, delete its entry rather than marking it done.

## `emitListSlot`'s nonterminal-separator fix doesn't cover the `slotValueSep` fallback path

**Found during:** [separator-as-slot plan](superpowers/plans/2026-07-12-separator-as-slot-plan.md), Task 7 (`packages/codegen/src/emitters/templates.ts`).

`emitListSlot` resolves a list slot's join-separator text via a fallback chain: `ruleSep ?? slotValueSep ?? DEFAULT_JOIN_SEPARATOR`. Task 7 added a branch that intercepts the `ruleSep === undefined` case specifically when the separator is genuinely nonterminal, emitting a reference to the transport struct's own runtime `.separator` field instead of falling through to the hardcoded space.

That fix only covers the `ruleSep` path. The parallel `slotValueSep` fallback exists for rules that go through `fanOutSeqChoices`/`factorChoiceBranches` rebuilds, which strip the rule-level separator and stamp it onto slot values instead — via `stampSeparatorOnValues(values, separatorStr: string | undefined)`, which only accepts a `string`. Callers pass `separatorToString(...)`, which returns `undefined` for a nonterminal separator (same reason `ruleSep` does) — so nothing ever gets stamped for that case, and `slotValueSep` structurally cannot carry a nonterminal separator today.

**Status: inert.** No current kind in any of the 3 grammars routes a nonterminal-separator rule through this rebuild path (confirmed empirically — `object_type_content`, the one real nonterminal-separator kind, doesn't hit it). If a future grammar override or upstream tree-sitter grammar change ever produces a nonterminal-separator rule that DOES go through `fanOutSeqChoices`/`factorChoiceBranches`, it would silently fall back to a hardcoded space — the exact failure mode Task 7's fix was written to prevent, just on the other of the two fallback paths.

**Fix, if/when a real kind hits this:** thread the same nonterminal-separator detection Task 7 added for the `ruleSep` path into the `slotValueSep` path — likely requires `stampSeparatorOnValues` (or its caller) to accept a "nonterminal, resolve at runtime via struct field" marker instead of only a literal string.

## `mintContentAliasKinds`'s self-referential classification bug when an alias target's name equals the kind's own natural stripped name

**Found during:** Track B (separator-as-slot follow-up), `packages/python/overrides.ts`, promoting `_patterns`/`_collection_elements` to visible `separatedList` kinds.

When a hidden rule `_foo` is promoted via a reference-site `alias($._foo, $.<visibleName>)` and `<visibleName>` is chosen to be the EXACT underscore-stripped natural name (`foo`), the promoted kind fails to classify as `separatedList` — it stays `modelType: "branch"` with a single field that is a circular self-reference back to its own kind (`{"name": "foo", "values": [{"kind": "node-ref", "name": "_foo", "parseKind": "foo"}]}`). Reproduced with a throwaway, semantically unrelated alias target name (`zzztest_group`), confirming the trigger is purely "alias target name == kind's own natural stripped name," not anything specific to `patterns`/`collection_elements`.

**Status: worked around, not fixed.** Track B's overrides use non-natural names (`pattern_group`, `element_list`) specifically to avoid this bug — see `packages/python/overrides.ts`'s Track B comment block. The underlying bug is un-fixed and out of `overrides.ts`'s scope; it most likely lives in `compiler/assemble.ts`'s `isSeparatedListShape` / parse-kind self-reference resolution (not yet root-caused past this point).

**Fix, if/when prioritized:** trace why a self-matching alias-target name causes the classifier to treat the kind's own slot as a reference to itself instead of resolving through to the real repeat/separator shape, likely in `assemble.ts`'s parse-kind resolution or `resolveParseKindCollisions` (`compiler/model/node-map.ts`).

## `mintContentAliasKinds` requires the alias to be the IMMEDIATE content of `optional(...)`/`CHOICE[x, BLANK]` — `field()`-wrapping silently prevents the mint

**Found during:** Track B, same task as above.

`link.ts`'s `mintContentAliasKinds` (the pass that registers a visible kind from a reference-site `alias($._hidden, $.visible)`) only mints when `isClauseHoistVisibleGroupAlias`'s `parentIsOptionalSeq` check is true — which requires the alias to be the DIRECT content of `optional(...)` or a 2-member `CHOICE[x, BLANK]`. The structural walk treats `field()` as opaque (falls through to the generic `'content' in rule` case, which resets `parentIsOptionalSeq` to `false`), so writing `optional(field('name', alias($._hidden, $.visible)))` in an override silently prevents the mint entirely — the promoted kind simply never gets registered (confirmed: `no NodeMap render path for '<name>'`, absent from `node-model.json5`), with no error surfaced at regen time.

**Status: not a bug needing a fix — a documented gotcha.** The correct pattern is to alias the BARE symbol directly inside `optional(...)`, with NO `field()` wrapper: `optional(alias($._hidden, $.visible))`. (This turned out to also make a separately-suspected `field()`-wrap workaround for a naming divergence unnecessary — see `packages/python/overrides.ts`'s Track B comment block for the full resolved picture.) Documented here so a future author doesn't lose time rediscovering it.

**Fix, if ever worth doing:** `isClauseHoistVisibleGroupAlias`'s structural walk (`compiler/evaluate.ts`) could treat `FIELD` as transparent (like it already treats `OPTIONAL`/`CHOICE`), so a field-wrapped alias still mints — but there is no current need since the field-name divergence this was meant to work around doesn't occur when aliasing the bare symbol directly (see the previous point).

## `tuple_pattern`'s case-context variant renders as `'()'` — a deeper two-rules-one-parse-kind model-merge gap

**Found during:** Track B, `_patterns` promotion follow-up (flagged by a research pass, not fixed in that task).

Python's assignment-context `tuple_pattern` (`seq('(', optional($._patterns), ')')`) and match-statement's case-context `_tuple_pattern` are two DIFFERENT grammar rules that both parse to the same `tuple_pattern` kind at the tree-sitter level (one parse kind, two source rules) — a base-grammar quirk pythonlang's own tree-sitter grammar already has. `case (a, b):` wraps without throwing, but renders as `'()'` — `templates/tuple_pattern.jinja` only emits the `pattern_group` field (Track B's promoted assignment-context slot); it has no branch for whatever field/shape the case-context `_tuple_pattern` production actually needs. Confirmed via `validate:native`: `tuple_pattern[1].pattern_group: type pattern_group ≠ list_pattern_group1` — the real parsed CST in a case-pattern position carries a DIFFERENT child kind (`list_pattern_group1`, a separate pre-existing Track-A promotion) than the assignment-context template expects.

**Status: deferred, not fixed.** This is a distinct, more complex shared-codegen problem (the node-map/template layer needs to properly model TWO source rules merging into one parse kind, each potentially needing different render logic) — explicitly out of scope for the `_patterns`/Track B promotion task that surfaced it.

**Fix, if/when prioritized:** needs node-map-level support for a parse kind whose real shape can vary depending on which of several distinct SOURCE rules produced it (not just which grammar POSITION references it, the case Track A/B already handle) — likely a template/render-module change, not a small overrides.ts patch.

## Reference-site-alias-minted kinds (`link.ts`'s `mintContentAliasKinds`) never get a dedicated `factories.ts`/`wrap.ts` function

**Found during:** [separator-as-slot plan](superpowers/plans/2026-07-12-separator-as-slot-plan.md), Task 5 (Track B, `packages/python/overrides.ts`).

After fixing the body-alias vs reference-site-alias bug (see below) and the `field()`-wrap mint gotcha, the 3 promoted kinds (`parameter_list`, `pattern_group`, `element_list`) correctly classify as `modelType: "separatedList"` in `node-model.json5`, with the correct `factoryName` (e.g. `"parameterList"`). But `emitters/factories.ts` never actually emits a dedicated `export function parameterList(...)`, and `emitters/wrap.ts` never emits a dedicated `wrapParameterList`, for any of the 3 — confirmed via temporary debug instrumentation in `emitSeparatedListFactory` that it is dispatched to for pre-existing Track-A-minted kinds (`_list_pattern_group1`/`list_pattern_group1`, both `hidden: false`) but never for these 3 link-time-minted kinds. The skip happens upstream, in `emitters/shared.ts`'s `classifyFactoryEmission`/`classifyParserSymbolEmission` gate (most likely `hasCatalogEntry(kindEntries, kind)` returning `false` for these kinds, since they're minted during `link.ts` rather than registered in `base.grammar.rules` before catalog collection the way Track A's enrich-synthesized kinds are).

The kind is still fully constructible and renders correctly — only reachable via the WRAPPING kind's factory (e.g. `ir.parameters({...})`, whose `_parameter_list` field holds a plain `NodeData`-shaped literal for the nested value), not via a standalone `F.parameterList(...)` call. This is the same "TS factories/wrap surface is the deprecated JS-side view, not the native production path" situation documented in project memory (`feedback_ts_readnode_deprecated`) — the NATIVE render path (verified via `probe-kind --backend native` and the `validate:native` sweep) is confirmed correct and unaffected; this gap is cosmetic to the deprecated TS construction surface, not a correctness bug in production rendering.

**Status:** documented gap, not fixed. Root cause not conclusively pinned down (suspected `hasCatalogEntry`/`synthesizedKinds` treating link-time-minted kinds differently from enrich-time-registered ones) — would need further tracing in `emitters/shared.ts` + wherever `kindEntries`/`synthesizedKinds` get populated to confirm and fix cleanly.

**Fix, if/when prioritized:** make `classifyParserSymbolEmission`'s catalog/synthesized-kind checks recognize link-time-minted kinds (from `mintContentAliasKinds`) the same way it already recognizes enrich-time-minted ones, so `factories.ts`/`wrap.ts` emit dedicated functions for them too.

## `_concatInSourceOrder` sorts text-collapsed leaves (no `$span`/`$childIndex`) to the end, losing source order

**Found during:** `isInlineSafe` separator-variability qualification follow-on (rust render-emptiness regression investigation), `packages/codegen/src/emitters/wrap.ts`, `_concatInSourceOrder` (~line 1384, emitted runtime helper).

`_concatInSourceOrder` restores cross-kind source order for a repeated heterogeneous-union slot by sorting each element's `$span.start` (byte offset) or `$childIndex` (position in parent) — text-collapsed scalar leaves have neither, so they fall back to `Number.MAX_SAFE_INTEGER` and sort to the end, stable among themselves. When a real slot mixes text-collapsed leaves WITH span/childIndex-bearing elements, this pushes the leaves after everything else regardless of their true source position — reproduced on rust's `tuple_pattern`: `(x, ..)` (a text-collapsed `..` rest-marker leaf mixed with a real `identifier` element) renders as `(.., x)` instead of `(x, ..)`, a 1-2 mismatch in `read-render-parseAstMatchPass`.

**Status: deferred, not blocking.** Small (1-2 mismatches), isolated to this specific mixed-leaf-shape ordering case, and not required to resolve the separator-variability qualification's own regression (which Bugs A and B above fully account for).

**Fix, if/when prioritized:** text-collapsed leaves need SOME source-position signal to sort correctly among span-bearing siblings — likely requires either preserving a positional marker through the text-collapse step, or falling back to declaration order relative to neighboring spans instead of a global end-of-list sort.

## `collect-slots.ts`'s `mergeByName`/`mergeChoiceArms` silently discard per-arm "surrounding" context when folding same-named slots

**Found during:** PR-L scoping (compiler-simplification master plan's final PR), via a 2026-06-04 followup already noted in the master plan doc (`§slot-naming note`) and reconfirmed while designing PR-L's real implementation scope.

`mergeByName` and `mergeChoiceArms` (`compiler/collect-slots.ts:203-256`) fold multiple same-named positional/field slots — including across a choice's distinct arms — into one slot, keeping only `values` (deduped), `hasLeading`/`hasTrailing` booleans, and `sourceRuleIds`. The per-arm "surrounding" facts (the actual literals/separators each occurrence sat behind — e.g. `param ,` vs `param ;`) are discarded entirely. When two folded arms genuinely differ in surrounding, that lost difference IS the variant signal — the merge silently turns "should be a polymorph/promotion, or at least a diagnostic" into one flat, ambiguous slot. This already caused two real render bugs before being worked around via manual overrides: rust `visibility_modifier`'s `pub(crate)` rendering as `pub ( )`, and python `except_clause`'s `except E:` rendering as `except E as:`.

A "gate the merge on surrounding-equivalence" fix (compare arms structurally, merge only when truly equivalent) turns out to be **architecturally infeasible at the point the merge runs**: `simplify.ts`'s `simplifySeqRule` already strips the surrounding literal (`if (m.type === STRING && !isSlotPromotedLiteral(m)) return false`) as a normal, load-bearing part of turning grammar rules into render-shaped rules — by the time `collect-slots` runs, the information needed to distinguish "safe to merge" from "hides a real difference" is already gone.

**Status: deferred, not fixed.** The only architecturally sound alternatives are (a) preserve a lightweight surrounding fingerprint earlier in the pipeline, before simplify erases it, so it survives to merge time — smaller blast radius but real pipeline surgery — or (b) remove the silent fold entirely, replacing every same-named-arm collision with a fail-diagnostic requiring an explicit override (consistent with this project's "prefer overrides over inference" stance and with PR-L's own theme). Full removal's blast radius is unmeasured — an unknown, possibly large number of currently-working kinds across all 3 grammars rely on the merge succeeding silently. Explicitly scoped out of PR-L (2026-07-14) to keep that PR's own two real items (the `unslotted-child` check and the `parsekind-noninjective`/`content-collision` burn-down+flip) independently reviewable.

**Fix, if/when prioritized:** first measure the actual blast radius (how many kinds/slots across the 3 grammars currently depend on a non-trivial fold, e.g. via slots whose `sourceRuleIds` carry 2+ distinct entries) before committing to option (a) or (b) above — this was flagged as needed but not done during PR-L's scoping, since the user explicitly deferred the whole item rather than pursuing it further at that time.

## Rust `generic_type_with_turbofish`'s render template injects illegal whitespace around the `::<` turbofish token — accepted regression, not a TODO

**Found during:** [enrich base-grammar un-aliasing](superpowers/specs/2026-07-14-enrich-base-grammar-unaliasing-design.md) implementation, Task 1 rework (`packages/codegen/src/dsl/enrich.ts`'s `applyUnaliasDistinct`, single-site drop branch — unchanged, already-landed behavior for rust's one un-aliasing site, `scoped_type_identifier.path`).

Dropping the alias at `scoped_type_identifier.path` (visible storage kind → drop, per the existing hidden/visible branch) makes `generic_type_with_turbofish` an ordinary, independently-addressable top-level model kind for the first time. Previously it was reachable ONLY through a special context-aware reparse wrapper (see `packages/rust/overrides.ts`'s comment right below its own `generic_type_with_turbofish: { 1: field('turbofish') }` override — ADR-0006's `drillAs` mechanism), never as a bare root kind exercised by the generic per-kind read-render-parse fixture generator. Now that it is, a pre-existing gap in the shared template-rendering walker surfaces: the generated `rust/crates/sittir-rust/templates/generic_type_with_turbofish.jinja` (source of truth: `packages/codegen/src/emitters/templates.ts` → `compiler/model/node-map.ts`'s `renderTemplate()`) renders

```
{{ type_ }} {{ turbofish }} {{ type_arguments }}
```

— a literal space around the `turbofish` field (wrapping the anonymous `::` token declared via the override above). Rust's `::<...>` turbofish syntax requires exact token adjacency to disambiguate from other uses of `::`/`<`; reproduced directly: `probe-kind --grammar rust --kind scoped_type_identifier --source 'fn f(x: a::B::<T>::C) {}'` renders `"a::B :: <T>::C"` instead of `"a::B::<T>::C"`, and reparsing the spaced form yields a DIFFERENT root kind (`generic_type` instead of `generic_type_with_turbofish`) rather than round-tripping. Confirmed via corpus: rust's `read-render-parseAstMatchPass` sits at 123/136 (down from the pre-plan baseline of 125), the 2 new mismatches being exactly `generic_type_with_turbofish` (`Scoped functions`, `Struct patterns`).

This is a general "scanner-delimited / token-adjacent slot" rendering gap in the shared template-emission walker (no per-slot notion of "this field must render with zero surrounding whitespace" exists today) — not something introduced by, or fixable within, the un-aliasing pass itself.

**Status: knowingly accepted, not deferred-as-a-TODO.** The user has explicitly decided to accept this regression rather than block the un-aliasing plan on it: rust's `read-render-parseAstMatchPass` baseline is now 123 (not 125) going forward — this is the new accepted floor for rust, not a discrepancy to chase in a future session. `compiler/model/node-map.ts`'s `renderTemplate()` is a shared chokepoint across all rules in all 3 grammars, already flagged fragile in project memory ("Walker hotspot — `walkRuleForTemplate` has 3 edge fixes, no unit tests"), and a general fix carries real risk of regressing AST-match elsewhere if rushed — explicitly judged out of scope for the un-aliasing plan.

**Fix, if/when prioritized:** give the template-emission walker a way to mark a FIELD slot (or the anonymous token it wraps) as requiring token-adjacent rendering — likely keyed off `token.immediate` or a similar existing marker already tracked for other scanner-delimited cases (see project memory "Preserve token wrappers" and "Template walker adjacency — scanner-delimited kinds need adjacent rendering"). Verify against all 3 grammars' deep-AST counts before landing, given the walker's blast radius.
