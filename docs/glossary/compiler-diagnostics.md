# `packages/codegen/src/compiler/diagnostics` — Function Glossary

Per-function reference for `packages/codegen/src/compiler/diagnostics/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---


### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::isExpectedDiagnostic`

Is `ownerKind` floor-listed for `code` in the grammar's own `expectDiagnostics:` block (threaded through
`RawGrammar.expectDiagnostics`)? A floor is per code and per owner: an owner listed for one code still blocks on
another. The gate (`blockedRecords`) is its one caller, so a floor applies in exactly one place; records carry
their code's intrinsic `canProceed`.

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

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::formatNamingEvents`

One `[naming]` line per automatic type-name rename, for the gen log.

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

The producer's `canProceed` is forwarded verbatim. Both `SlotGroupingShape` codes, `content-collision` and
`multi-slot-nested-seq`, push `false` when they fire; a floor for either applies only at the gate.

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::collectGrammarDiagnostics`

Maps assemble's records to grammar diagnostics, each with its code's intrinsic `canProceed`; floors are the
gate's business. `diagnoseParseKindCollisions` has one caller, the assemble-time resolution in `node-map.ts`, so
every `parsekind-noninjective` reaching here is an assemble-time collision and is forced to `canProceed: false`.

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::fromParseKindCollision`

Forwards the producer's message, severity and `canProceed` verbatim, so the wording has one source.

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::fromAssembleWarning`

Maps an assemble warning to a grammar diagnostic. A code in `BLOCKING_SHAPE_CODES` is an `error` with
`canProceed: false`; any other is a non-blocking `warning`.

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::BLOCKING_SHAPE_CODES`

The assemble-warning codes that block (spec §3):

- `storagename-collision`;
- `nonterminal-separator-unstamped`, a zero-instance guard: any firing means a nonterminal separator reached the
  slot-value stamp path and would render as a hardcoded space (see `collect-slots.ts`);
- `unclassifiable-shape`, `union-slot-mixed-row` and `union-slot-unaddressable`, shapes collect-slots has no
  model for. It would otherwise fall back to structural recursion or keep the arms distributed, which is a guess
  about the node's shape. Each message names the form that resolves it;
- `kind-shape-mismatch` and `single-literal-choice`, which drop the kind.

`union-slot-routed` is deliberately absent: it reports the union-slot design's supported routing (unnamed
nonterminal arms, with any label-routed degenerate arms, in one kind-dispatched `content` slot), not a fallback.

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

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::reservedMemberDiagnostics`

One `reserved-member-not-literal` warning per reserved-wordset member that `reservedWordset` cannot read as literal text. The word builder's reserved guard cannot reject a word it cannot spell, so the member is named for the author to rewrite as a string or a single-literal symbol.

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::collectGrammarDiagnosticsForGrammar`

The front half of a compile over one evaluated stage: link, normalize and assemble, and the grammar diagnostics
they report. It needs no parser tables and reads no generate output: the inline list comes from the evaluated
grammar itself (`RawGrammar.inline`). Collapses renamed rules first
(`collapseRenamedRules`) and uses that grammar throughout, returning it as `raw`, so the diagnostics, link and the
caller read one grammar. Link and assemble read one kind catalog (`dsl/symbol-table.ts::kindCatalogOf`): the
parser's rows when id tables are passed, else the predicted rows, which match the parser's on every field
including the ids. Builds one `SymbolSource` from the predicted catalog, asked through
`dsl/symbol-table.ts::renameAwareSymbolSource` since the rules may still carry pre-rename names, for both alias
diagnostics. The caller guarantees the prediction built (the gate, or `diagnoseStage`); link asserts it
(`link.ts::assertPredictedKinds`). Records owned by a kind the grammar's own override orphaned are dropped
(`withoutOrphanedGroups`).

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::SURFACED_COMPILER_CODES`

The compiler-diagnostic codes the grammar diagnostics report as their own: the invalid config records
(`groups-config-invalid`, `refine-config-invalid`). The kind-id stamp reports (`kindid-*`) stay compiler warnings
and feed the phantom-kind ratchet; they are not grammar diagnostics.

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::UNEXPECTABLE_CODES`

The codes no `expectDiagnostics` entry may name: a grammar tree-sitter rejects (`dangling-internal-ref`, `unpredictable-symbol-table`) a config declaration that does not fit the grammar (`groups-config-invalid`, `refine-config-invalid`), and a `rules:` or `renderAs:` declaration that contradicts the grammar (`rule-cause-missing`, `rule-cause-mismatch`, `render-only-not-external`, `vocabulary-replaces-upstream`). Each is fixed at its cause, never accepted. The debt codes `rule-reauthored-without-cause` and `patch-without-cause` stay floorable.

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::unexpectableExpectEntries`

One blocking `expect-diagnostics-invalid` record per `expectDiagnostics` key in `UNEXPECTABLE_CODES`, so an entry that could never take effect is reported rather than silently ignored.

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::GrammarDiagnosticError`

The gate's rejection. `diagnostics` are the blocked records; `records` are every record the gate saw, so the
preflight can persist the whole set to `grammar-diagnostics.json` when the compile stops.

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::DiagnosticFloors`

A grammar's `expectDiagnostics` map, code to floor-listed owner kinds, as the gate reads it.

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::blockedRecords`

The gate's verdict: the records with `canProceed: false` whose code the caller does not allow and whose owner is
not floor-listed for that code (`isExpectedDiagnostic`). The one place a floor or an allowed code applies.

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::assertGatePasses`

Throws `GrammarDiagnosticError` when `blockedRecords` is non-empty. `compile.ts::diagnoseGrammar` applies it twice:
before link over the evaluate-time records, and after assemble over the shape records. `allow` is the caller's
override (`--allow-diagnostic`, or a confirmed interactive run).

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::predictionFailed`

Whether evaluate's catalog prediction failed for this grammar, which means tree-sitter rejects it.

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::predictionRecords`

The records for a failed catalog prediction: one `dangling-internal-ref` per name the grammar references that
names no rule and no external, or one `unpredictable-symbol-table` when the failure names none. A catalog that
was predicted still yields one `kind-key-collision` per key two parser symbols derive (`KindKeyCollision`),
naming both; the second symbol has no kind, so sittir cannot model it. Both block and
neither is expectable. This is how an upstream grammar tree-sitter rejects is reported, as a record rather than a
throw; the hydrate-time unresolved reference in `assemble.ts::hydrateValues` is a separate invariant.

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::evaluateRecords`

The records answerable from the evaluated grammar alone, before link: the prediction records, the
`expect-diagnostics-invalid` entries, and evaluate's own events (`body-pattern-zero-match`,
`desugar-divergence-*`).

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::diagnoseStage`

Every grammar diagnostic of one evaluated stage, ungated: `evaluateRecords`, then the front half's records when
the prediction built, with the collapsed grammar's rule catalog so a record's owner resolves to its root rule id.
The evaluation stages (`stage.ts::diagnoseEvaluationStage`) use it, and through them the `grammar-diagnostics` tool's `--stage` inspection. It is not the final gate: that is `compile.ts::diagnoseGrammar`.

### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::withoutOrphanedGroups`

Drops records owned by a kind the grammar's own override provably orphaned (`RawGrammar.orphanedSyntheticGroups`):
it never occurs in a parse, so a record about it is phantom whatever its code.

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
The table lists only codes the enriched stages are observed to report:
`'alias-shape'` has the
alias codes and the four collect-slots shape codes; `'ambiguity'` has none,
because no detector for an upstream generate conflict exists yet. A rule whose
cause has no detector lands on its grammar's
`rule-reauthored-without-cause` floor, named per rule, and leaves it when the
detector lands. `kindid-unstamped-anon-literal` is deliberately absent: the
enriched stage has no generated parser, so it fires on every anonymous literal.
`content-collision` and `storagename-collision` are absent too: a `field()`
patch resolves them, so they are patch-site provocations, not rule causes.

### `packages/codegen/src/compiler/diagnostics/rule-causes.ts::diagnoseRuleCauses`

Judges a grammar's hand-authored departures against its enriched stage's records. They are evaluate-time
records, so the gate checks them before link.
Both sides are compared by authored names: `compileGrammar` passes the
evaluated grammar, not the one `collectGrammarDiagnosticsForGrammar` returns,
because with generated id tables that one has hidden rules and `renderAs:`
keys collapsed to their display names, while the enriched stage (no id
tables) never collapses. Every code it emits blocks, and every message names
the declaration or deletion that resolves it:

- `rule-cause-missing`: a `rules:` entry with a bare body. Judged without the
  enriched stage.
- `render-only-not-external`: a `renderAs:` key that is not an upstream
  external, as the evaluated externals list spells it.
- `vocabulary-replaces-upstream`: a `vocabulary` entry named like an upstream
  rule.
- `rule-cause-mismatch`: a `reauthored` entry whose cause is not a cause, on a
  name upstream does not declare, or whose upstream provocations all belong to
  other causes.
- `rule-reauthored-without-cause`: a `reauthored` entry no `PROVOKING_CODES`
  code provokes. The one floorable code; the floor applies at the gate.

### `packages/codegen/src/compiler/diagnostics/rule-causes.ts::judgeVocabulary`

`vocabulary-replaces-upstream` for a `vocabulary` entry upstream also
declares, else nothing.

### `packages/codegen/src/compiler/diagnostics/rule-causes.ts::judgeReauthored`

The `reauthored` judgement: the declared cause must be a `PROVOKING_CODES` key (grammar files are unchecked, so an unknown cause reaches here and is `rule-cause-mismatch` naming the valid causes), the name must be an upstream rule, some
`PROVOKING_CODES` code must fire on it upstream, and one of those codes must
belong to the declared cause.

### `packages/codegen/src/compiler/diagnostics/patch-sites.ts::labelPatchSites`

Labels each patch site from the diagnostic records. A site is `resolving` when wire resolves some record the
enriched stage raised and credits the site with it (`DiagnosticRecord.resolvedBy`); it claims those records'
codes. Otherwise it is `authoring` and claims nothing. The credit is path-blind: a site is credited with every
record owned by its owner kind or by an enrich lift it rewrote or renamed, so an authoring `field()` on an owner
wire otherwise repairs also reads as resolving. Only `diagnosePatchSites` acts on the labels, and it judges
`rule()` sites alone. Records of every code count, blocking or not: `content-collision` and
`storagename-collision` among them, since a `field()` patch resolves them.


### `packages/codegen/src/compiler/diagnostics/patch-sites.ts::diagnosePatchSites`

`patch-without-cause` for every `rule()` site labelled authoring: a
`rule(name, body)` placeholder can only be justified by an enriched-stage record wire resolves, so one
credited with none resolves nothing. It blocks;
a floor for it applies at the gate. Authoring
forms (`field`, `variant`, `alias` used to name) are never judged.

### `packages/codegen/src/compiler/diagnostics/patch-sites.ts::sameSite`

Whether a credited patch names the site: same owner kind, path and form.

### `packages/codegen/src/compiler/diagnostics/diagnostic-records.ts::DiagnosticRecord`

One record per key `(code, owner root rule id, slot name)`, folded over the raw, enriched and final stages.
`ownerKind` is the owner's name in the latest stage that raises the key, since a catalog rename changes the name
but not the root id. `ruleProvenance` says where the owner kind comes from: `upstream` when the raw stage
declares it, `enrich` when only the enriched stage does, `wire` otherwise. `resolved` means the final stage no
longer raises the key. `resolvedBy.stage` is `enrich` when the enriched stage already dropped it, with an empty
`by` because nothing names the enrich pass; it is `wire` when the enriched stage still raised it, and `by` then
lists the `rules:` entries and patch sites credited with it.

### `packages/codegen/src/compiler/diagnostics/diagnostic-records.ts::deriveDiagnosticRecords`

Folds the stage diagnoses and the final stage's records into `DiagnosticRecord`s, one per key, in first-seen
order (raw, then enriched, then final). The final stage is `evaluateRecords` plus the front half's records of
the compiled grammar, the same composition `diagnoseStage` makes; the rule-cause and patch-site records are
about the departure itself and stay out.

### `packages/codegen/src/compiler/diagnostics/diagnostic-records.ts::keyedDiagnostics`

One stage's records by key; a record with no owner has no key and stays out.

### `packages/codegen/src/compiler/diagnostics/diagnostic-records.ts::ownerRootId`

A record's owner as a root rule id: the owner of its stamped `ruleId` when it has one, else its owner kind
looked up in the stage's catalog, else the id `createRuleId` mints for that name. The last case is a record
raised before link, whose owner kind is still its source name, so it is the id link would mint.

### `packages/codegen/src/compiler/diagnostics/diagnostic-records.ts::claimantsOf`

What wire resolved a key with: the `rules:` entry named like the owner, and every patch site on the owner or
whose `PatchSite.lifts` holds it. The lift writers record that evidence; nothing here matches names across
kinds.

