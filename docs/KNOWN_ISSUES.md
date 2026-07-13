# Known Issues

Running list of known, non-blocking gaps discovered during feature work — documented here rather than silently forgotten, but not urgent enough to have blocked the work that found them. When one gets fixed, delete its entry rather than marking it done.

## `emitListSlot`'s nonterminal-separator fix doesn't cover the `slotValueSep` fallback path

**Found during:** [separator-as-slot plan](superpowers/plans/2026-07-12-separator-as-slot-plan.md), Task 7 (`packages/codegen/src/emitters/templates.ts`).

`emitListSlot` resolves a list slot's join-separator text via a fallback chain: `ruleSep ?? slotValueSep ?? DEFAULT_JOIN_SEPARATOR`. Task 7 added a branch that intercepts the `ruleSep === undefined` case specifically when the separator is genuinely nonterminal, emitting a reference to the transport struct's own runtime `.separator` field instead of falling through to the hardcoded space.

That fix only covers the `ruleSep` path. The parallel `slotValueSep` fallback exists for rules that go through `fanOutSeqChoices`/`factorChoiceBranches` rebuilds, which strip the rule-level separator and stamp it onto slot values instead — via `stampSeparatorOnValues(values, separatorStr: string | undefined)`, which only accepts a `string`. Callers pass `separatorToString(...)`, which returns `undefined` for a nonterminal separator (same reason `ruleSep` does) — so nothing ever gets stamped for that case, and `slotValueSep` structurally cannot carry a nonterminal separator today.

**Status: inert.** No current kind in any of the 3 grammars routes a nonterminal-separator rule through this rebuild path (confirmed empirically — `object_type_content`, the one real nonterminal-separator kind, doesn't hit it). If a future grammar override or upstream tree-sitter grammar change ever produces a nonterminal-separator rule that DOES go through `fanOutSeqChoices`/`factorChoiceBranches`, it would silently fall back to a hardcoded space — the exact failure mode Task 7's fix was written to prevent, just on the other of the two fallback paths.

**Fix, if/when a real kind hits this:** thread the same nonterminal-separator detection Task 7 added for the `ruleSep` path into the `slotValueSep` path — likely requires `stampSeparatorOnValues` (or its caller) to accept a "nonterminal, resolve at runtime via struct field" marker instead of only a literal string.

## `emitters/test.ts` generates broken minimal-config tests for `separatedList` kinds

**Found during:** separator-as-slot plan, Tasks 6 and 8.

Tracked as [GitHub issue #153](https://github.com/refactory-lang/sittir/issues/153) — see there for full detail. Summary: `classifyChildFactorySurface` correctly returns `null` for `'separatedList'` kinds now (Task 6 cleanup), but `emitters/test.ts` still routes through it, so generated `nodes.test.ts` minimal-config tests call these kinds' factories with zero elements and throw at render time. Confirmed pre-existing/general (11 rust + 2 python kinds affected beyond this plan's own kinds) — `nodes.test.ts` is excluded from the `tsconfig.build.json` gate, so nothing depends on it today, but it's silently broken if anyone runs it directly.
