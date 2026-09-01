# `packages/codegen/src/compiler/diagnostics` — Function Glossary

Per-function reference for `packages/codegen/src/compiler/diagnostics/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---


### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::isExpectedDiagnostic`

```text
/**
 * Is `ownerKind` declared as an expected (non-blocking) exception for `code`?
 * `expectDiagnostics` comes from the grammar's OWN `grammar.sittir.ts` (`wire()`'s
 * `expectDiagnostics:` block, threaded through `RawGrammar.expectDiagnostics`)
 * — grammar-scoped by construction, since only the grammar whose grammar.sittir.ts
 * declares an entry ever supplies a non-empty `expectDiagnostics` here. See
 * docs/KNOWN_ISSUES.md for the canonical example (typescript's
 * `_object_type_group1`, exempted from both `content-collision` and
 * `storagename-collision`).
 */
```

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::fromBodyPatternZeroMatch`

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

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::formatCompilerDiagnostics`

```text
/**
 * Sibling of {@link formatGrammarDiagnostics} for `CompilerDiagnostic`s —
 * kept alongside its natural relative in the same module rather than a new
 * one. `CompilerDiagnostic` has no `ownerKind`/`slotName` (those are
 * `GrammarDiagnostic`-only fields); reusing `formatGrammarDiagnostics` as-is
 * would print literal `-.-` noise, so this formats on `phase` instead.
 */
```

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::writeGrammarDiagnosticsJson`

```text
/**
 * Persist a diagnostics array to JSON. Sibling of
 * {@link formatGrammarDiagnostics}/{@link formatCompilerDiagnostics} — those
 * format for stderr, this serializes the same shape for a later task to
 * merge into a unified validation report. Works for either
 * `GrammarDiagnostic` or `CompilerDiagnostic` since both extend the shared
 * `Diagnostic` base (code/severity/message/proposal + scope-specific
 * fields), so no shape adaptation is needed — the array is written as-is.
 */
```

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::diagnoseContentAliasInjectivity`

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

#### body

```text
// Invert to twin → distinct hidden bodies.
```

### `packages/codegen/src/compiler/diagnostics/slot-grouping.ts::diagnoseSlotGrouping`

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

```text
// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------
```

#### body

```text
// PolymorphRule was removed; the built-in skip-set is always empty.
// Use only the caller-provided extra entries (variant() skip-set from
// polymorphVariants metadata threaded through normalize.ts).
```

#### body

```text
// §4c content-collision: count the UNNAMED content slots the kind's body
// yields (field-named seqs are single named slots, NOT distributed). >1
// means they'd share the `_content` storage key — an unemittable ambiguity
// — so at least one needs a `field()` name. Counted on the simplified rule,
// BEFORE mergeSlotsByName folds the duplicate `content` slots into one
// (which masks the collision).
//
// FALSE POSITIVE guard: skip all-text-shape kinds (pure text leaves like
// `identifier`, `integer_literal`, `float` whose modelType === 'pattern').
// Their simplified rules contain unnamed slot-boundary choices-of-patterns
// that all resolve to text content — no real storage-key collision exists
// because the kind emits no structural slots. `isAllTextShape` is the SAME
// predicate assemble.ts uses to classify 'pattern' (imported, not mirrored).
```

#### body

```text
// Always blocking here — accepted-floor exceptions are applied later,
// in grammar-diagnostics.ts's `collectGrammarDiagnostics`, driven by
// the grammar's OWN `expectDiagnostics:` declaration in its
// grammar.sittir.ts. This function has no grammar identity, so a
// kind-name-only check here would incorrectly except a same-named
// kind in ANY grammar.
```

#### body

```text
// Skip any kind that belongs to the polymorph system (shape ①/②/③ below
// treat the variant/promotePolymorph machinery as already-correct dispatch).
```

#### body

```text
// Determine whether the top-level rule body is in slot position.
// Auto-group helpers (in inlineKinds) represent extracted seq content
// of an inlined repeat(seq(...)) — their body IS the repeating element,
// so it is in slot position. All other kinds: top-level body is NOT
// in slot position (it is the rule itself, not a slot).
```

#### body

```text
// Top-level body of an inline helper is in repeat/optional slot position
// (not a choice arm), so inChoiceArm=false at the top level.
```

```text
/* inChoiceArm= */
```

### `packages/codegen/src/compiler/diagnostics/slot-grouping.ts::walkRule`

```text
/**
 * Walk the simplified rule looking for seqs in slot position. On the
 * simplified view a slot position is a choice arm (every arm is one slot
 * candidate) or the top level of a kind that is inlined into its parents
 * (`inlineKinds`); seq and variant/group members inherit their parent's
 * position. Wrapper-carried positions (repeat / optional / field content)
 * do not exist here — those wrappers are attributes on the wrapped node.
 */
```

### `packages/codegen/src/compiler/diagnostics/slot-grouping.ts::countSlots`

```text
/**
 * Count the number of slots contributed by `rule`.
 *
 * This is the shared primitive for the slot-grouping diagnostic and any
 * future consumer that needs a count without building full `AssembledNonterminal`
 * records. Consumers must NOT re-derive terminality — call this function.
 */
```

```text
// ---------------------------------------------------------------------------
// Slot-counting primitives (folded in from the former compiler/slot-count.ts).
//
// The single source of truth for "how many slots does this rule contribute."
// Mirrors `collectSlots`' distribution semantics, built on
// `isNonterminalRuleType` (Table 1). This diagnostic is the only production
// consumer, so the primitives live here rather than in a standalone file.
//
// Distribution table (matches the spec design doc):
//   seq                       → recurse + sum members (distribute)
//   choice / symbol / supertype /
//   pattern / enum / repeat /
//   repeat1 / optional / field → 1 (slot boundary — one union/array/single slot)
//   variant / group / clause   → transparent — recurse into content
//   string / terminal /
//   indent / dedent / newline  → 0
//
// `choice`, `repeat`, `repeat1`, `optional`, and `field` each count as exactly
// ONE slot regardless of contents — they are slot BOUNDARIES, not transparent
// containers. A seq distributes across its members because seqs emit no slot.
// `variant` / `group` / `clause` are transparent structural wrappers; their
// content's slot count IS this node's slot count.
// ---------------------------------------------------------------------------
```

#### body

```text
// Distribute: the seq itself emits no slot; sum its members.
```

#### body

```text
// Transparent wrappers — their content's count is this node's count.
```

#### body

```text
// Everything else is either a slot boundary (nonterminal → 1) or a
// terminal (string / indent / dedent / newline / terminal → 0).
// `isNonterminalRuleType` encodes Table 1 and is the authoritative
// terminality predicate — do not re-derive here.
```

### `packages/codegen/src/compiler/diagnostics/slot-grouping.ts::countContentSlots`

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

#### body

```text
// A field-named seq is a single named slot — do not distribute. Only an
// UNNAMED seq distributes (sums its members' content slots).
```

#### body

```text
// Mirror collectSlots' CHOICE routing (same predicate, imported):
// an unnamed STRUCTURAL choice distributes into its arms and merges
// by name — it yields no content slot of its own, only whatever
// unnamed content its arms carry. A non-structural unnamed choice
// (a true union) stays a single slot boundary, counted below.
```

#### body

```text
// Arms are mutually exclusive and same-named slots merge across
// them (mergeChoiceArms), so the choice contributes the MAXIMUM
// of its arms' counts — two content slots within ONE arm still
// collide, one per arm does not.
```

### `packages/codegen/src/compiler/diagnostics/slot-grouping.ts::isContentSlot`

```text
/** A slot boundary that resolves to the generic `content` storage name. A
 *  fielded slot (`fieldName` set) or an inlined-body slot (`inlinedFrom`
 *  set — see {@link RuleBase.inlinedFrom}, types/rule.ts) is never a
 *  content slot regardless of its kind profile: both already carry a
 *  meaningful name of their own (the field name; the fallback name
 *  `projectSlotNaming` derives from `inlinedFrom`), so grouping them under
 *  the generic content-slot count would double-count a slot this
 *  diagnostic's collision check already has a real name for.
 */
```

```text
// terminal — emits no slot
```

```text
// named slot
```

#### body

```text
// storageName is the single named kind iff exactly one named kind AND no
// unnamed value present; otherwise it falls back to `content`.
```

### `packages/codegen/src/compiler/diagnostics/slot-grouping.ts::slotKindProfile`

```text
/**
 * The distinct named parse kinds a slot-boundary rule would expose, plus whether
 * it carries any unnamed value (literal / pattern / enum / anonymous token).
 * Mirrors `projectSlotNaming`'s storageName inputs at the rule level.
 */
```

#### body

```text
// string / pattern / enum / indent / dedent / newline / terminal / token
// — no named kind, contributes an unnamed value.
```

### `packages/codegen/src/compiler/diagnostics/slot-grouping.ts::ownerKind`

```text
/** The kind that owns the rule containing the violation. */
```

### `packages/codegen/src/compiler/diagnostics/slot-grouping.ts::slotCount`

```text
/** The slot count of the offending sub-rule (for multi-slot-nested-seq). */
```

### `packages/codegen/src/compiler/diagnostics/slot-grouping.ts::proposal`

```text
/** Human-readable propose-promotion text for the author. */
```

### `fromSlotGrouping` — `canProceed` forwarding (`packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts`)

The producer's `canProceed` is forwarded verbatim rather than hardcoded to
`true`. `content-collision` always pushes `false` when it fires; the
accepted-floor exception is applied by the caller,
`collectGrammarDiagnostics`, where the grammar name is known. The other three
`SlotGroupingShape` codes still always push `true`. Hardcoding `true` here
would silently swallow the flip.

### `collectGrammarDiagnostics` — blocking overrides (`packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts`)

Three severity overrides are applied at collection time, all for the same
reason: the producer can't see the grammar-level expectation lists.

An assemble-time `parsekind-noninjective` means enrich did NOT resolve the
collision — an enrich-resolved one would already be gone from the grammar by
assemble time — so it is always genuinely blocking. Enrich's own info-severity
audit-trail diagnostics never reach this path; they merge in separately via
`run-codegen.ts`'s `getEnrichUnaliasDiagnostics`, so the override cannot
affect them.

`isBlockingAssembleWarningCode` names the only two assemble-warning codes that
block: `storagename-collision`, and `nonterminal-separator-unstamped` — a
zero-instance guard, where any firing means a nonterminal separator reached the
slot-value stamp path and would silently render as a hardcoded space (see
`collect-slots.ts`). `typename-collision`, the only other code sharing
`fromAssembleWarning`, stays exactly as `fromAssembleWarning` maps it because
it still has live, accepted, non-blocking instances. The check must stay in the
caller — flipping `fromAssembleWarning` itself would take `typename-collision`
with it as a side effect.

`content-collision`'s producer (`slot-grouping.ts`) always emits
`canProceed: false` when it fires, so the `expectDiagnostics` exception is
applied here instead, mirroring the `storagename-collision` override. The other
three `SlotGroupingShape` codes always push `canProceed: true` at their own
construction sites, so this override never touches them.

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::fromParseKindCollision`

#### body

```text
// Forward the producer's message/severity/canProceed verbatim rather than
// regenerating — keeps the wording single-sourced in the producer.
```

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::fromDeriveShape`

#### body

```text
// canProceed: true — derive-shape issues are surfaced as informational
// warnings; codegen continues so all issues are visible in one pass.
```

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::fromAssembleWarning`

#### body

```text
// typename-collision is auto-resolved at assemble time (the rename already
// succeeded). Downgrade to 'info' so the channel stays signal-only; genuine
// unresolved collisions keep 'warning'.
```

#### body

```text
// Assemble warnings are observational — codegen continues.
```

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::collectGrammarDiagnosticsForGrammar`

#### body

```text
// Link's own sink carries the kindId stamp-miss report (the per-build
// phantom-kind inventory) when id tables are supplied.
```

#### body

```text
// Mirror generate.ts's NormalizeCtx inputs (shared via inline-sets.ts): without
// inlineKinds, diagnoseSlotGrouping's shape-①b (auto-group helper bodies,
// e.g. rust `_match_block_optional1`) never fires on this path, so
// `multi-slot-nested-seq` violations were console-only during regen and
// absent from the persisted grammar-diagnostics.json / validation report.
```

#### body

```text
// §D-2c content-alias injectivity — sole consumer of the diagnostic-only
// contentAliasedTo map (empty today; guards a future violation).
```

#### body

```text
// Drop diagnostics for a kind this grammar's own override provably
// orphaned (see `RawGrammar.orphanedSyntheticGroups`) — it can never
// occur in a real parse, so any diagnostic about it is phantom
// regardless of code.
```

### `packages/codegen/src/compiler/diagnostics/slot-grouping.ts::module`

```text
/**
 * compiler/diagnostics/slot-grouping.ts — Simplify-time propose-promotion diagnostic.
 *
 * Enforces the invariant: "a slot never contains multiple slots; a multi-slot
 * substructure must be a group." Walks each simplified rule and emits diagnostic
 * records for three violation shapes:
 *
 *   1. multi-slot-nested-seq   — a seq with countSlots≥2 that is in a genuine
 *      slot-creating position: inside repeat/optional content, or in the body of an
 *      auto-group helper that is in the grammar's inline set.
 *      Choice-arm position is SUPPRESSED (choice-distributed — collectSlots already
 *      treats the whole choice as a single union slot boundary; the seq arms are NOT
 *      separate slots and do NOT need grouping).
 *      → propose a visible `groups:` registration.
 *   2. supertype-list          — repeat/repeat1 of a single non-field-named
 *      symbol/supertype → propose `transforms: field()` rename.
 *   3. repeat-choice-with-literal — repeat/repeat1(choice(..., literal, ...))
 *      → flag as ambiguous; author decides.
 *
 * Key invariant for shape ①: the top-level rule BODY of a normal grammar kind
 * is NOT a "slot" — it is the kind itself. Shape ① fires only when a seq
 * occupies a slot-creating position:
 *
 *   a. As the content of a `repeat` / `repeat1` / `optional` (seq is the
 *      repeating element body — the whole point of the diagnostic).
 *   b. As the top-level body of an auto-group helper kind (a hidden kind whose
 *      name appears in `inlineKinds` — these are exactly the synthesized
 *      `_<parent>_repeat<N>` / `_<parent>_optional<N>` helpers that represent
 *      the seq content of an inlined `repeat(seq(...))`).
 *
 *   SUPPRESSED position — choice arms: collectSlots treats the whole choice as a
 *   single union slot boundary, so a multi-slot seq arm is already handled by the
 *   union — it is NOT a genuine group-lift violation. Firing on choice arms was a
 *   false positive (diagnostic narrowing).
 *
 *   Rules whose top-level body is a seq but are NOT in `inlineKinds` (normal
 *   branch kinds, already-registered group kinds) are SILENT at the top level
 *   because their seq is the rule body, not a slot.
 *
 * DIAGNOSTIC ONLY: records never drive codegen behavior
 * (feedback_metadata_not_behavior). They are surfaced via the derivation log
 * and console during regen so the author can act.
 */
```

### `packages/codegen/src/compiler/diagnostics/slot-grouping.ts::SlotGroupingShape`

```text
// All-text shape predicate: `isAllTextShape` is imported from assemble.ts (the
// SAME predicate that classifies modelType === 'pattern'). DRY — no mirrored copy
// that could drift (the REPEAT1 case lives in exactly one place). Used to suppress
// content-collision false-positives on pattern kinds (identifier, float, …), which
// have all-text simplified rules and emit no structural slots.
```

```text
// ---------------------------------------------------------------------------
// Polymorph skip-set construction
// ---------------------------------------------------------------------------
```

```text
// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/compiler/diagnostics/slot-grouping.ts::checkSeq`

```text
// ---------------------------------------------------------------------------
// Shape ①: multi-slot seq in a slot position
// ---------------------------------------------------------------------------
```

#### body

```text
// FALSE POSITIVE guard: a multi-slot seq inside a CHOICE arm is NOT a genuine
// group-lift violation. collectSlots treats the whole choice as a single union
// slot boundary, so the seq's members are choice-distributed — each arm is a
// variant of the union, not a separate slot. Only repeat/optional positions
// (inChoiceArm === false) are genuine group-lift candidates.
```

