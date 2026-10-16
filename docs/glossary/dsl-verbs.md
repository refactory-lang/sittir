# `packages/codegen/src/dsl/verbs` — Function Glossary

Per-declaration reference for `packages/codegen/src/dsl/verbs/`: the verbs' application and the effect table the verbs record into.

---

### `packages/codegen/src/dsl/verbs/effects.ts::CopyOrigin`

What made a copy, which decides what the copy inherits and which projection lists it. A `path` (an edit path that enters a rule) or a `copy` (`copy()` itself) makes a form that keeps its source's shape, so the copy takes its source's options and labels. A `narrow` or a `lead` makes a form with a new shape, which inherits nothing. A `lead` origin carries the entry as the layer resolved it, in this layer's field names: its list, item, field and admits, which the lead's `bindingEffects` entry repeats.

### `packages/codegen/src/dsl/verbs/effects.ts::SegmentEffect`

A field edit's effect on option paths: under the kind `owner`, the slot segment `from` (a field's `name:`, a wrapped child's `kind:` or a token's quoted text) is now `to`. Wire records one per field edit, with the owner the edit names; `effectsForOwners` gives it to every rule that reaches that owner.

### `packages/codegen/src/dsl/verbs/effects.ts::AliasEffect`

An alias edit's effect: the member displayed as `from` now shows as `to`. On inherited option paths it renames `(from)` segments, and `from:` slot segments that name no field.

### `packages/codegen/src/dsl/verbs/effects.ts::RenameEffect`

A kind rename's effect: the kind `from` is now `to` wherever a kind is named. On inherited records it renames option heads and `(kind)` segments, label heads, the reparse hosts, the keys of render-as, visible externals and groups, and the protected and undeclared rule names.

### `packages/codegen/src/dsl/verbs/effects.ts::CopyEffect`

A copy a verb made: the rule `copy`, made from `source` (`part` is `.` for the whole rule) for the context `context`. `display` is the name the copy shows under when it is visible. `admitted` is the admitted kind a narrowing made the copy as the form of: the kind the copy is shown in place of. `origin` says which edit made it. The copy effect is the copy's form-of fact; the projections read `splitFrom`, `leadFrom` and the lead entries from it.

### `packages/codegen/src/dsl/verbs/effects.ts::Effect`

One entry of a layer's effect log, in the order the layer recorded it.

### `packages/codegen/src/dsl/verbs/effects.ts::EffectCtx`

The effect table's input: the layer's effects, and the rules as the layer's edits left them, whose field names tell a field segment from a slot segment named after a kind.

### `packages/codegen/src/dsl/verbs/effects.ts::Provenance`

The projections of a layer's effects, under the names the evaluated grammar exposes them by. `splitFrom` maps each copy a path or `copy()` made to its source, `leadFrom` each copy a lead made, and `renamedFrom` each rename's target to its source. `bindingEffects` lists the alias and segment effects in log order, then one entry per lead. `splitFrom` and `bindingEffects` are always present; `leadFrom` only when a lead made a copy, and `renamedFrom` only when a rename exists. Only a layer that inherits a record projects, appending to the projections it inherits.

### `packages/codegen/src/dsl/verbs/effects.ts::KIND_KEYS`

The record keys outside a rule's own reference that name a kind: an arm's `variantOf`. An arm's `variant` is a label, not a kind, even when it spells one.

### `packages/codegen/src/dsl/verbs/effects.ts::namesKind`

Whether a record's string at a key names a kind: a `SYMBOL` or `FIELD_ALIAS` name, a named `ALIAS`'s value, or a `KIND_KEYS` key.

### `packages/codegen/src/dsl/verbs/effects.ts::renameValue`

A grammar value with every kind name in it renamed: a bare string or a list of them (the list fields name kinds), and, inside a record, only the strings `namesKind` picks out. A label, a metadata source or any other string that happens to spell a renamed kind is left as written.

### `packages/codegen/src/dsl/verbs/effects.ts::renameKeys`

A keyed record with its keys renamed, and its values too unless `renameValues` is false (a reparse host's template is source text). Two keys renaming to one name is an error.

### `packages/codegen/src/dsl/verbs/effects.ts::renameReparseHosts`

The authored `reparseHosts` block under a rename. It is authored in base names; a host's key and every `priority` and `gated` entry name kinds, while a host's template is source text and stays as written. A block that names no `priority` takes `REPARSE_HOST_PRIORITY`, renamed too, so the emitted table and the kinds it is consulted with share one spelling.

### `packages/codegen/src/dsl/verbs/effects.ts::renameSegment`

One segment of an options path under a rename: a `(kind)` segment and a `kind:` slot segment that is no field of the grammar take the new name; a field segment and a literal are left as written.

### `packages/codegen/src/dsl/verbs/effects.ts::renamePath`

An options path under a rename. Its head is a kind when `kindHead` (a top-level options key); otherwise it is renamed like any other segment.

### `packages/codegen/src/dsl/verbs/effects.ts::renameOptionPaths`

An options record with every path key renamed, recursively, leaving preference values alone. The keys under `LABELS_KEY` are addresses whose heads are kinds. Two keys renaming to one path is an error.

### `packages/codegen/src/dsl/verbs/effects.ts::SegmentRewrite`

One slot-segment rewrite of an options path, scoped to the kind `owner`: the segment `from` becomes `to`.

### `packages/codegen/src/dsl/verbs/effects.ts::boundSegmentOf`

One owner-scoped lookup of a segment rewrite, including rewrites on hidden helper rules reached by the canonical transparent-rule traversal. Conflicting reachable destinations are refused. Both options rewriting and field-name projection use this lookup.

### `packages/codegen/src/dsl/verbs/effects.ts::boundFieldNameOf`

Projects a field name through canonical segment effects, optionally resolving hidden helper owners through the supplied grammar: the preference-path formatter and parser preserve the segment syntax, and an effect that does not leave a field segment is refused. Field routes and options therefore read the same recorded binding edit.

### `packages/codegen/src/dsl/verbs/effects.ts::rewriteOwnedSegments`

The options block with segment rewrites applied under their owning kind only: within a kind's options record, and in a label address whose head is that kind. A rewrite for one kind leaves another kind's identically spelled segment alone.

### `packages/codegen/src/dsl/verbs/effects.ts::ownerOptions`

Selects an authored owner's render preferences and owned label addresses as input to the existing canonical option-path renamer. Values and label targets keep their authored meaning.

### `packages/codegen/src/dsl/verbs/effects.ts::inheritSplitOptions`

Projects source-owner preferences and labels onto each realized parser split using the canonical split provenance and option-path mapper. The original policy remains in place; an explicitly authored target policy wins. `splitGrammar` applies this alongside its realized `splitFrom` metadata, and `rewriteInherited` applies it for each copy a path or `copy()` made, so contextual bodies retain indentation, boundary breaks and end-of-list preferences.

### `packages/codegen/src/dsl/verbs/effects.ts::isSegment`

Whether an effect is a field `segment` effect.

### `packages/codegen/src/dsl/verbs/effects.ts::effectsForOwners`

The recorded effects, with each field (`segment`) effect given to every rule whose transparent reach holds its owner: in rule order, and within a rule in the order the segments were first recorded. The other effects come first, in their own order. It runs over the rules as the layer's edits left them, before the whole-grammar phase: a lead can narrow a visible kind in place and swap a hidden rule it reaches for a copy, after which the kind no longer reaches the rule the effect names (typescript's `required_parameter`, whose `_parameter_name` the lead's rest side copies). The result names every owner, so a reader of one owner (`boundFieldNameOf` without a grammar, `rewriteInherited`) needs no reach of its own.

### `packages/codegen/src/dsl/verbs/effects.ts::inheritsOptions`

Whether a copy takes its source's options and labels: true for a copy a path or `copy()` made, false for one a narrowing or a lead made, whose shape is new.

### `packages/codegen/src/dsl/verbs/effects.ts::RENAMED_KEYED_RECORDS`

The inherited records keyed by kind name, which a kind rename re-keys and walks.

### `packages/codegen/src/dsl/verbs/effects.ts::RENAMED_NAME_LISTS`

The inherited records that are lists of kind names, which a kind rename maps entry by entry.

### `packages/codegen/src/dsl/verbs/effects.ts::rewriteInherited`

The records a layer inherits, rewritten through the layer's effects so that they name what the layer's result has. The options block takes, in this order: the segment effects under their owners (`rewriteOwnedSegments` with no grammar, since the log names every owner), the alias effects (`renameOptionPaths` without kind heads), the renames (with kind heads), and the copies a path or `copy()` made (`inheritSplitOptions`). A rename also rewrites the reparse hosts, the keyed records and the name lists. A record no effect names is returned as given, and the input is never changed. A layer's own records are written against its own result, so they never pass through here.

### `packages/codegen/src/dsl/verbs/effects.ts::LeadCopies`

The copies one lead entry made, in recording order, beside the entry's origin.

### `packages/codegen/src/dsl/verbs/effects.ts::symbolsOutsideField`

The symbol names a rule references outside its fields named `field`: in a receiver form's body, the group that follows the receiver field.

### `packages/codegen/src/dsl/verbs/effects.ts::fieldsHolding`

The names of the fields in a rule whose content is `symbol` itself.

### `packages/codegen/src/dsl/verbs/effects.ts::soleName`

The one distinct name in a list. None, or several, is an error: the lead helper builds the bodies these names are read from, so a mismatch is a broken helper, not an authored mistake.

### `packages/codegen/src/dsl/verbs/effects.ts::leadEffectOf`

A lead's `bindingEffects` entry, from its copies and the rules. The list, item, field and admits come from the origin; the receiver is the displayed name of the list's copy; each variant maps an admitted kind to the displayed name of the copy a narrowing made for it; the group is the symbol beside the receiver field in the receiver form's body, and the rest field is the field of the group that holds the list.

### `packages/codegen/src/dsl/verbs/effects.ts::provenanceOf`

The `Provenance` of a layer's effects, read over the layer's final rules, where the receiver forms and groups the leads made sit. A copy whose origin is a `narrow` is in no projection. Lead entries come in the order of each lead's first copy, keyed by list and field, since a lead's receiver form `_<list>_<field>` is unique.
