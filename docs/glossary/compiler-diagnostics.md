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

Reports the `content-collision` shape over the simplified rule map: a kind
whose body yields more than one unnamed `content` slot, which would share the
`_content` storage key (an unemittable ambiguity), so at least one needs a
`field()` name. Counted on the simplified rule, before `mergeSlotsByName`
folds the duplicate `content` slots into one and masks the collision.

All-text-shape kinds (`identifier`, `integer_literal`, `float`, ... whose
modelType is `pattern`) are skipped: their simplified rules hold unnamed
choices of patterns that all resolve to text, so no storage key collides.
`isAllTextShape` is the same predicate assemble.ts classifies `pattern` with.

Records are always blocking here. Accepted-floor exceptions are applied in
`collectGrammarDiagnostics` from the grammar's own `expectDiagnostics:`
declaration; this function has no grammar identity, so a kind-name check here
would except a same-named kind in any grammar.

### `packages/codegen/src/compiler/diagnostics/slot-grouping.ts::diagnoseRepeatedSeqGrouping`

Reports the `multi-slot-nested-seq` shape over the link-phase rule map: a
`repeat`/`repeat1` whose element is a seq with two or more slots. Downstream,
the builders push the repeat's multiplicity onto each slot-bearing member and
splice the bare seq into its parent, so the slots become parallel arrays that
lose the per-repetition pairing. The check runs on link rules because that is
the last phase where the REPEAT(SEQ) structure still exists; flatten and
simplify have already dissolved it into attributes.

One record per owner kind, carrying the largest slot count found. The body is
seen through inline kinds (`buildInlinableKinds`), since the parser splices
them into the repeat. Silent positions: a kind's own body (it is the kind, not
a slot), `optional(seq)` (enrich's clause hoist owns that shape and the
multiplicity pushdown keeps its members paired), and seq choice arms (the
choice is one union slot). A repeat that link's `liftSeparators` turned into a
separated list no longer has a REPEAT(SEQ) and is silent too.

### `packages/codegen/src/compiler/diagnostics/slot-grouping.ts::repeatedSeqSlotCount`

The largest slot count of any repeated multi-slot seq under `rule`, or `0`.
Recurses through seq, choice, optional and field; alias, token and leaf rules
end the search because their contents are not slots of the owner.

### `packages/codegen/src/compiler/diagnostics/slot-grouping.ts::spliceBody`

Resolves a repeat's element through references to inline kinds, returning the
rule the parser actually splices in. `seen` stops a self-referential inline
kind from recursing forever.

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
`true`. Both `SlotGroupingShape` codes, `content-collision` and
`multi-slot-nested-seq`, push `false` when they fire; the accepted-floor
exception is applied by the caller, `collectGrammarDiagnostics`, where the
grammar's `expectDiagnostics` is known. Hardcoding `true` here would silently
swallow both.

### `collectGrammarDiagnostics` — blocking overrides (`packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts`)

Three severity overrides are applied at collection time, all for the same
reason: the producer can't see the grammar-level expectation lists.

`diagnoseParseKindCollisions` has exactly one caller — the assemble-time
resolution in `node-map.ts` — so every `parsekind-noninjective` diagnostic
reaching this collector is an assemble-time collision, always genuinely
blocking. The override forces `canProceed: false` on every instance
unconditionally.

`isBlockingAssembleWarningCode` names the assemble-warning codes that block
unless the owner is floor-listed for that code in `expectDiagnostics`:

- `storagename-collision`;
- `nonterminal-separator-unstamped`, a zero-instance guard: any firing means a
  nonterminal separator reached the slot-value stamp path and would silently
  render as a hardcoded space (see `collect-slots.ts`);
- `unclassifiable-shape` and `union-slot-mixed-row`, shapes collect-slots has
  no model for. It would otherwise fall back to structural recursion or keep
  the arms distributed, which is a guess about the node's shape. Each message
  names the patch form that resolves it.

`union-slot-routed` is deliberately not in the set: it reports the union-slot
design's supported routing (unnamed nonterminal arms, with any label-routed
degenerate arms, in one kind-dispatched `content` slot), not a fallback.
`typename-collision` stays as `fromAssembleWarning` maps it because it has
live, accepted, non-blocking instances. The check must stay in the caller:
flipping `fromAssembleWarning` itself would take every code with it.

`content-collision` and `multi-slot-nested-seq` (`slot-grouping.ts`) are
emitted with `canProceed: false`, so the `expectDiagnostics` exception is
applied here, per code, mirroring the assemble-warning override.

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

### `packages/codegen/src/compiler/diagnostics/alias-distributed.ts::diagnoseDistributedAliases`

Blocks a named alias over content tree-sitter applies the alias to member by
member: a sequence of two or more members or a repeat, reached through
precedence, `optional` and `field` wrappers, or through a rule the parser
inlines (the `SymbolSource`'s `isInlined`: tree-sitter substitutes its
body). The model would describe one node where the parser issues several.
It never looks through `token()`, which lexes as one token, or through a
hidden rule that is not inlined, which is a node of its own whatever its use
count.

Only named aliases are checked. An unnamed alias mints no kind, so there is
no single model node to be wrong about. The known unnamed case is
typescript's `predefined_type` arm `alias(seq('unique', 'symbol'),
'unique symbol')`.

### `packages/codegen/src/compiler/diagnostics/alias-distributed.ts::distributedShape`

The distributed shape an alias's content has, described for the message, or
`undefined` when the alias names one node.

### `packages/codegen/src/compiler/diagnostics/alias-distributed.ts::diagnoseMixedDisplayUnions`

An invariant guard, not a user-facing shape check: enrich
(`unaliasOverloadedDisplays`) resolves every display that would sit over both
a terminal and a nonterminal storage, so after enrich no display union holds
both. Members are classified by the `SymbolSource` (`isTerminal`: the
kind catalog evaluate predicted, which link asserts against the parser's),
and a literal member is a terminal by its own stamp
(`DisplayUnionMember.literal`).
A member that is neither a rule, an external nor a literal is reported
rather than defaulted, since defaulting would make the guard guess.

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::collectGrammarDiagnosticsForGrammar`

Collapses renamed rules first (`collapseRenamedRules`) and uses that grammar throughout, returning it as `raw`, so the diagnostics, link and the caller read one grammar. Builds one `SymbolSource` from the kind catalog evaluate predicted (`RawGrammar.predictedKinds`), asked through
`dsl/symbol-table.ts::renameAwareSymbolSource` since the rules may still carry pre-rename names, and hands it to
both alias diagnostics. When the prediction failed, those two checks are skipped, since answers over no rows
are false, and the failure surfaces instead: link records it (`link.ts::reportUnpredictedKinds`) in the sink the
collector runs it with, and the collector surfaces those records beside the kind-id stamp records
(`SURFACED_COMPILER_CODE_PREFIXES`).

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::SURFACED_COMPILER_CODE_PREFIXES`

The compiler-diagnostic codes the grammar diagnostics report as their own: the kind-id stamp records, and the
failed-prediction records (`dangling-internal-ref`, `unpredictable-symbol-table`).


#### body

```text
// Link's own sink carries the kindId stamp-miss report (the per-build
// phantom-kind inventory) when id tables are supplied.
```

#### body

```text
// The inline set mirrors generate.ts's NormalizeCtx input (shared via
// inline-sets.ts). The link-phase repeated-seq check reads the same set to see
// through inline kinds, so both shapes land in the persisted
// grammar-diagnostics.json through one collector.
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

Propose-promotion diagnostics for the invariant "a slot never contains
multiple slots; a multi-slot substructure must be a group". Two shapes, each
checked in the phase where it is still visible:

- `multi-slot-nested-seq` (`diagnoseRepeatedSeqGrouping`, link rules): a
  repeat over a multi-slot seq. Proposes a visible `groups:` registration so
  each repetition becomes one group node.
- `content-collision` (`diagnoseSlotGrouping`, simplified rules): more than
  one unnamed `content` slot in a kind. Proposes a `field()` name.

The records are diagnostics only and never drive codegen. They reach the
console during regen and the persisted grammar-diagnostics.json.

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
// Public types
// ---------------------------------------------------------------------------
```


### `packages/codegen/src/compiler/diagnostics/rule-causes.ts::PROVOKING_CODES`

Which upstream diagnostic codes justify each `reauthored` cause. A code
counts on the rule it names (`ownerKind`), whether or not it blocks yet, so the
judgement does not depend on which shape codes have been flipped to blocking.
The table lists only codes the upstream compiles are observed to report:
`'lexical-interior'` has `parsekind-noninjective`; `'alias-shape'` has the
alias codes and the four collect-slots shape codes; `'ambiguity'` has none,
because no detector for an upstream generate conflict exists yet. A rule whose
cause has no detector lands on its grammar's
`rule-reauthored-without-cause` floor, named per rule, and leaves it when the
detector lands. `kindid-unstamped-anon-literal` is deliberately absent: the
upstream has no generated parser, so it fires on every anonymous literal.
`content-collision` and `storagename-collision` are absent too: a `field()`
patch resolves them, so they are patch-site provocations, not rule causes.

### `packages/codegen/src/compiler/diagnostics/rule-causes.ts::diagnoseRuleCauses`

Judges a grammar's hand-authored departures against its upstream compile.
Both sides are compared by authored names: `compileGrammar` passes the
evaluated grammar, not the one `collectGrammarDiagnosticsForGrammar` returns,
because with generated id tables that one has hidden rules and `renderAs:`
keys collapsed to their display names, while the upstream compile (no id
tables) never collapses. Every code it emits blocks except where noted, and
every message names the declaration or deletion that resolves it:

- `rule-cause-missing`: a `rules:` entry with a bare body. Judged without the
  upstream.
- `upstream-compile-failed` (warning): the upstream compile did not complete;
  none of the judgements below is made.
- `render-only-not-external`: a `renderAs:` key that is not an upstream
  external, as the evaluated externals list spells it.
- `vocabulary-replaces-upstream`: a `vocabulary` entry named like an upstream
  rule.
- `rule-cause-mismatch`: a `reauthored` entry on a name upstream does not
  declare, or one whose upstream provocations all belong to other causes.
- `rule-reauthored-without-cause`: a `reauthored` entry no `PROVOKING_CODES`
  code provokes. The one floorable code: an owner listed for it in the
  grammar's `expectDiagnostics:` is a warning.

### `packages/codegen/src/compiler/diagnostics/rule-causes.ts::judgeVocabulary`

`vocabulary-replaces-upstream` for a `vocabulary` entry upstream also
declares, else nothing.

### `packages/codegen/src/compiler/diagnostics/rule-causes.ts::judgeReauthored`

The `reauthored` judgement: the name must be an upstream rule, some
`PROVOKING_CODES` code must fire on it upstream, and one of those codes must
belong to the declared cause.

### `packages/codegen/src/compiler/diagnostics/patch-sites.ts::labelPatchSites`

Labels each patch site against the upstream compile. A site is `resolving`
when some diagnostic blocks the upstream shape of its owner kind, and it
claims every such code; otherwise it is `authoring` and claims nothing. The
labelling is owner-level, because upstream diagnostics name an owner, not a
path: an authoring `field()` on a flagged owner also reads as resolving, so
the labels may over-report resolving sites but never under-report them. Only
`diagnosePatchSites` acts on the labels, and it judges `rule()` sites alone,
where the coarseness cannot matter. `content-collision` and
`storagename-collision` count here: a `field()` patch resolves them.

### `packages/codegen/src/compiler/diagnostics/patch-sites.ts::diagnosePatchSites`

`patch-without-cause` for every `rule()` site labelled authoring: a
`rule(name, body)` placeholder can only be justified by a shape the upstream
compile blocks on, so one on an unflagged owner resolves nothing. It blocks
unless the owner is floor-listed for it in `expectDiagnostics`. Authoring
forms (`field`, `variant`, `alias` used to name) are never judged.