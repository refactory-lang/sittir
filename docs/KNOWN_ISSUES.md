# Known Issues

Running list of known, non-blocking gaps discovered during feature work — documented here rather than silently forgotten, but not urgent enough to have blocked the work that found them. When one gets fixed, delete its entry rather than marking it done.

## `emitListSlot`'s nonterminal-separator fix doesn't cover the `slotValueSep` fallback path

**Found during:** [separator-as-slot plan](superpowers/plans/2026-07-12-separator-as-slot-plan.md), Task 7 (`packages/codegen/src/emitters/templates.ts`).

`emitListSlot` resolves a list slot's join-separator text via a fallback chain: `ruleSep ?? slotValueSep ?? DEFAULT_JOIN_SEPARATOR`. Task 7 added a branch that intercepts the `ruleSep === undefined` case specifically when the separator is genuinely nonterminal, emitting a reference to the transport struct's own runtime `.separator` field instead of falling through to the hardcoded space.

That fix only covers the `ruleSep` path. The parallel `slotValueSep` fallback exists for rules that go through `fanOutSeqChoices`/`factorChoiceBranches` rebuilds, which strip the rule-level separator and stamp it onto slot values instead — via `stampSeparatorOnValues(values, separatorStr: string | undefined)`, which only accepts a `string`. Callers pass `separatorToString(...)`, which returns `undefined` for a nonterminal separator (same reason `ruleSep` does) — so nothing ever gets stamped for that case, and `slotValueSep` structurally cannot carry a nonterminal separator today.

**Status: inert.** No current kind in any of the 3 grammars routes a nonterminal-separator rule through this rebuild path (confirmed empirically — `object_type_content`, the one real nonterminal-separator kind, doesn't hit it). If a future grammar override or upstream tree-sitter grammar change ever produces a nonterminal-separator rule that DOES go through `fanOutSeqChoices`/`factorChoiceBranches`, it would silently fall back to a hardcoded space — the exact failure mode Task 7's fix was written to prevent, just on the other of the two fallback paths.

**Fix, if/when a real kind hits this:** thread the same nonterminal-separator detection Task 7 added for the `ruleSep` path into the `slotValueSep` path — likely requires `stampSeparatorOnValues` (or its caller) to accept a "nonterminal, resolve at runtime via struct field" marker instead of only a literal string.

## `_concatInSourceOrder` sorts text-collapsed leaves (no `$span`/`$childIndex`) to the end, losing source order

**Found during:** `isInlineSafe` separator-variability qualification follow-on (rust render-emptiness regression investigation), `packages/codegen/src/emitters/wrap.ts`, `_concatInSourceOrder` (~line 1384, emitted runtime helper).

`_concatInSourceOrder` restores cross-kind source order for a repeated heterogeneous-union slot by sorting each element's `$span.start` (byte offset) or `$childIndex` (position in parent) — text-collapsed scalar leaves have neither, so they fall back to `Number.MAX_SAFE_INTEGER` and sort to the end, stable among themselves. When a real slot mixes text-collapsed leaves WITH span/childIndex-bearing elements, this pushes the leaves after everything else regardless of their true source position — reproduced on rust's `tuple_pattern`: `(x, ..)` (a text-collapsed `..` rest-marker leaf mixed with a real `identifier` element) renders as `(.., x)` instead of `(x, ..)`, a 1-2 mismatch in `read-render-parseAstMatchPass`.

**Status: deferred, not blocking.** Small (1-2 mismatches), isolated to this specific mixed-leaf-shape ordering case, and not required to resolve the separator-variability qualification's own regression (which Bugs A and B above fully account for).

**Fix, if/when prioritized:** text-collapsed leaves need SOME source-position signal to sort correctly among span-bearing siblings — likely requires either preserving a positional marker through the text-collapse step, or falling back to declaration order relative to neighboring spans instead of a global end-of-list sort.

## `emitters/test.ts` generates broken minimal-config tests for `separatedList` kinds

**Found during:** separator-as-slot plan, Tasks 6 and 8.

Tracked as [GitHub issue #153](https://github.com/refactory-lang/sittir/issues/153) — see there for full detail, including a correction: Task 8's original write-up characterized the related python deep-render-lane errors as "100% pre-existing, byte-identical" versus the pre-plan baseline. Re-verified directly against a rebuilt baseline worktree — the error text is NOT byte-identical (it shifted from "wrong-shaped value present" to "value missing entirely"), because Task 4's wire-capture change did alter how these 3 kinds' content elements are shaped, even though no aggregate `validate:native` metric moved (neither state was ever covered by a real corpus fixture on this exact path). Still broken before, still broken after — not a regression — but the root cause and eventual fix scope are broader than originally stated; see the issue for the corrected detail.
