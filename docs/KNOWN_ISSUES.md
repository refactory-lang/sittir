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

Tracked as [GitHub issue #153](https://github.com/refactory-lang/sittir/issues/153) — see there for full detail, including a correction: Task 8's original write-up characterized the related python deep-render-lane errors as "100% pre-existing, byte-identical" versus the pre-plan baseline. Re-verified directly against a rebuilt baseline worktree — the error text is NOT byte-identical (it shifted from "wrong-shaped value present" to "value missing entirely"), because Task 4's wire-capture change did alter how these 3 kinds' content elements are shaped, even though no aggregate `validate:native` metric moved (neither state was ever covered by a real corpus fixture on this exact path). Still broken before, still broken after — not a regression — but the root cause and eventual fix scope are broader than originally stated; see the issue for the corrected detail.

## `liftCommaSep`'s Case 3 (mandatory leading separator) — removed, not fixed forward

**Found during:** external code review of PR #154 (separator-as-slot).

`link.ts`'s `liftCommaSep` had a Case 3 absorbing a bare, non-optional leading separator literal into `.separator.leading = true` — the same flag Case 4 uses for a genuinely OPTIONAL leading separator. `AssembledSeparatedList`'s constructor can't tell the two apart from that single boolean, so a real mandatory-leading kind would have been misclassified as `leadingMode: 'optional'`, defaulting its factory to `leading: false` and producing invalid syntax for any caller that didn't explicitly override it.

**Resolved by removal, not by forward-fixing:** confirmed via a full regen of all 3 grammars (with a temporary diagnostic) that Case 3 fires zero times today. Rather than build out a way to distinguish mandatory from optional through the tri-state model (a larger change touching `RuleBase.separator`'s type across every consumer), Case 3 was deleted — restoring the architecture `AssembledSeparatedList`'s own doc comment already assumed was true (a mandatory flank literal stays outside the repeat, classifying as `'branch'` instead of `'separatedList'`). If a future grammar shape needs a genuinely mandatory leading separator absorbed into a repeat, this will need to be re-added with real mandatory/optional tri-state tracking, not the old boolean.
