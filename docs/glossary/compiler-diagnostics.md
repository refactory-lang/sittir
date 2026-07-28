# `packages/codegen/src/compiler/diagnostics` — Function Glossary

Per-function reference for `packages/codegen/src/compiler/diagnostics/`, mechanically relocated from source
JSDoc by `scripts/wave5-relocate-jsdoc.mts` (wave 5 comment-cleanup, pass 1 —
unedited, unverified). Pass 2 reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `isExpectedDiagnostic` (`packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts:108`)

```text
/**
 * Is `ownerKind` declared as an expected (non-blocking) exception for `code`?
 * `expectDiagnostics` comes from the grammar's OWN `overrides.ts` (`wire()`'s
 * `expectDiagnostics:` block, threaded through `RawGrammar.expectDiagnostics`)
 * — grammar-scoped by construction, since only the grammar whose overrides.ts
 * declares an entry ever supplies a non-empty `expectDiagnostics` here. See
 * docs/KNOWN_ISSUES.md for the canonical example (typescript's
 * `_object_type_group1`, exempted from both `content-collision` and
 * `storagename-collision`).
 */
```

### `fromBodyPatternZeroMatch` (`packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts:127`)

```text
/**
 * A `groups:` body-pattern entry that matched ZERO base-grammar positions.
 * The body-pattern mechanism's ONLY effect is structural replacement of
 * matching sub-trees — a zero-match entry means the hidden rule is orphaned
 * and the base positions it was meant to elevate stay flat (their slots
 * flatten into the parent, the repeat-over-multi-slot-seq violation). This
 * failure mode is otherwise SILENT: the grammar still compiles and gates can
 * hold while output regresses (the rust `attributed_parameter` wildcard-alias
 * incident, 2026-07-25).
 */
```

### `formatCompilerDiagnostics` (`packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts:273`)

```text
/**
 * Sibling of {@link formatGrammarDiagnostics} for `CompilerDiagnostic`s (PR-S
 * task 5) — kept alongside its natural relative in the same module rather
 * than a new one. `CompilerDiagnostic` has no `ownerKind`/`slotName` (those
 * are `GrammarDiagnostic`-only fields); reusing `formatGrammarDiagnostics`
 * as-is would print literal `-.-` noise, so this formats on `phase` instead.
 */
```

### `writeGrammarDiagnosticsJson` (`packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts:290`)

```text
/**
 * Persist a diagnostics array to JSON (Cluster D task 13). Sibling of
 * {@link formatGrammarDiagnostics}/{@link formatCompilerDiagnostics} — those
 * format for stderr, this serializes the same shape for a later task
 * (Cluster D task 14) to merge into a unified validation report. Works for
 * either `GrammarDiagnostic` or `CompilerDiagnostic` since both extend the
 * shared `Diagnostic` base (code/severity/message/proposal + scope-specific
 * fields), so no shape adaptation is needed — the array is written as-is.
 */
```

### `diagnoseContentAliasInjectivity` (`packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts:306`)

```text
/**
 * §D-2c — content-alias injectivity check (the ONLY consumer of the
 * diagnostic-only `contentAliasedTo`/`contentAliasedFrom` maps). Folded in from
 * the former compiler/diagnose-content-alias-injectivity.ts — its sole caller is
 * `collectGrammarDiagnosticsForGrammar` above.
 *
 * `contentAliasedTo` maps a hidden body kind `_x` to the visible twin(s)
 * minted from it. Fan-OUT (`_x → [a, b]`, one body reused by several twins) is
 * LEGITIMATE reuse — no diagnostic. The illegal shape is fan-IN: a single
 * visible twin minted from two DISTINCT hidden bodies (`_a → twin`, `_b →
 * twin`). That would silently drop one body in `mintContentAliasKinds`
 * (`if (!(value in rules))`), so the minted kind's slots/template would depend
 * on mint ORDER — non-deterministic. We flag it as an error mirroring the
 * parse-kind non-injective collision check.
 *
 * The maps are EMPTY on every grammar today (no enrich `alias($._name,$.name)`
 * nodes exist), so this returns `[]` — it guards a FUTURE violation.
 */
```

### `diagnoseSlotGrouping` (`packages/codegen/src/compiler/diagnostics/slot-grouping.ts:100`)

```text
/**
 * Walk every simplified rule in the map and emit a diagnostic record for each
 * violation of the "one slot per structural boundary" invariant.
 *
 * @param rules - The simplified rule map (output of `computeSimplifiedRules`).
 * @param inlineKinds - The grammar's inline kind set (from wire phase). Auto-group
 *   helpers (`_<parent>_repeat<N>`, `_<parent>_optional<N>`) are in this set;
 *   their top-level bodies are treated as slot-position seqs and checked.
 *   All other kinds are only checked for NESTED slot-position seqs.
 * @param polymorphSkipExtra - Extra kind names to skip for shape ①/②/③.
 * @returns An array of diagnostic records (may be empty).
 */
```

### `walkRule` (`packages/codegen/src/compiler/diagnostics/slot-grouping.ts:182`)

```text
/**
 * @param inSlotPosition - True when `rule` occupies a slot-creating position:
 *   inside a repeat/optional content, inside a choice arm, or as the top-level
 *   body of an inline-listed (auto-group helper) kind.
 * @param inChoiceArm - True when `rule` is directly inside a choice arm.
 *   Multi-slot seqs in choice arms are handled by collectSlots' union semantics
 *   (a choice is a single slot boundary regardless of arm content) and are NOT
 *   genuine group-lift violations. Only repeat/optional positions are genuine.
 *   This flag lets checkSeq distinguish the two sources of inSlotPosition.
 */
```

### `countSlots` (`packages/codegen/src/compiler/diagnostics/slot-grouping.ts:389`)

```text
/**
 * Count the number of slots contributed by `rule`.
 *
 * This is the shared primitive for the slot-grouping diagnostic and any
 * future consumer that needs a count without building full `AssembledNonterminal`
 * records. Consumers must NOT re-derive terminality — call this function.
 */
```

### `countContentSlots` (`packages/codegen/src/compiler/diagnostics/slot-grouping.ts:416`)

```text
/**
 * Count the CONTENT slots a rule's body yields — UNNAMED nonterminal slots that
 * resolve to the generic `content` storage name (no `fieldName`, not a single
 * named parse kind). A node whose body yields >1 of these cannot emit (they'd
 * share the `_content` storage key) — at least one needs a `field()` name.
 *
 * Mirrors `countSlots`' distribution with two refinements:
 *   - A FIELD-NAMED seq is ONE named slot (its `fieldName` makes it a single
 *     slot); it is NOT distributed into (its inner unnamed slots belong to that
 *     named group, not the enclosing node).
 *   - Only slot boundaries that resolve to `content` count (single named kind →
 *     named by its kind, not `content`; a string literal inside a choice/optional
 *     /repeat IS a slot value and makes the boundary unnamed-multi → `content`).
 *
 * Counted on the simplified rule BEFORE `mergeSlotsByName` folds duplicate
 * `content` slots into one (which would mask the collision).
 */
```

### `isContentSlot` (`packages/codegen/src/compiler/diagnostics/slot-grouping.ts:449`)

```text
/** A slot boundary that resolves to the generic `content` storage name. */
```

### `slotKindProfile` (`packages/codegen/src/compiler/diagnostics/slot-grouping.ts:459`)

```text
/**
 * The distinct named parse kinds a slot-boundary rule would expose, plus whether
 * it carries any unnamed value (literal / pattern / enum / anonymous token).
 * Mirrors `projectSlotNaming`'s storageName inputs at the rule level.
 */
```
