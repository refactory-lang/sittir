# `packages/codegen/src/dsl/verbs` — Function Glossary

Per-declaration reference for `packages/codegen/src/dsl/verbs/`: the verbs' application and the effect table the verbs record into.

---

### `packages/codegen/src/dsl/verbs/effects.ts::LeadWithin`

A lead match's restriction: the field it restricts (`null` for an unfielded child) and the matches it admits there.

### `packages/codegen/src/dsl/verbs/effects.ts::LeadMatch`

One kind a lead admits: the kind, its restriction (`within`), when it narrows the kind, and the name of the variant the narrowing mints (`as`), when a claim names it.

### `packages/codegen/src/dsl/verbs/effects.ts::Lead`

A leading-element split of a separated list: the list rule, its item field, the field the leading element takes, and the matches the leading element admits.

### `packages/codegen/src/dsl/verbs/effects.ts::CopyOrigin`

What made a copy, which decides what the copy inherits and which projection lists it. A `path` (an edit path that enters a rule) or a `copy` (`copy()` itself) makes a form that keeps its source's shape, so the copy takes its source's options and labels. A `narrow` or a `lead` makes a form with a new shape, which inherits nothing. A `lead` origin is the `Lead` entry as the layer resolved it, in this layer's field names, which the lead's `bindingEffects` entry repeats.

### `packages/codegen/src/dsl/verbs/effects.ts::NarrowingOrigin`

The origin of a narrowing: a `narrow` entry or a `lead`. A rule a narrowing reaches is marked with it (`verbs/copy.ts::VerbCtx`), so a later narrowing that would change the rule in place can name the one that holds it.

### `packages/codegen/src/dsl/verbs/effects.ts::SegmentEffect`

A field edit's effect on option paths: under the kind `owner`, the slot segment `from` (a field's `name:`, a wrapped child's `kind:` or a token's quoted text) is now `to`. Wire records one per field edit, with the owner the edit names; `effectsForOwners` gives it to every rule that reaches that owner.

### `packages/codegen/src/dsl/verbs/effects.ts::AliasEffect`

An alias edit's effect: the member displayed as `from` now shows as `to`. On inherited option paths it renames `(from)` segments, and `from:` slot segments that name no field.

### `packages/codegen/src/dsl/verbs/effects.ts::displayFamiliesOf`

The display families an effect log declares (`rule-transforms.ts::DisplayFamilies`): each display that alias effects
give two or more distinct members (`AliasEffect.to`), with those members (`from`). A display that one member shows,
however often, is not a family. Enrich's fixpoint run reads them (`layer.ts::enrichFixpoint`).

### `packages/codegen/src/dsl/verbs/effects.ts::RenameEffect`

A kind rename's effect: the kind `from` is now `to` wherever a kind is named. On inherited records it rewrites what `RECORD_RENAMES` names.

### `packages/codegen/src/dsl/verbs/effects.ts::CopyEffect`

A copy a verb made: the rule `copy`, made from `source` (`part` is `.` for the whole rule) for the context `context`. `display` is the name the copy shows under when it is visible. `admitted` is the admitted kind a narrowing made the copy as the form of: the kind the copy is shown in place of. `origin` says which edit made it. The copy effect is the copy's form-of fact; the projections read `splitFrom`, `leadFrom` and the lead entries from it.

### `packages/codegen/src/dsl/verbs/effects.ts::Effect`

One entry of a layer's effect log, in the order the layer recorded it.

### `packages/codegen/src/dsl/verbs/effects.ts::LeadEffect`

A lead's `bindingEffects` entry: the `Lead` entry, the displayed name of the receiver form (`receiver`), the group the receiver form references beside the receiver field (`group`), the group's field that holds the list (`restField`), and each admitted kind's variant (`variants`). Portable binding facts read these names rather than derive them.

### `packages/codegen/src/dsl/verbs/effects.ts::BindingEffect`

One entry of the `bindingEffects` projection: a segment effect, an alias effect, or a lead's entry.

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

A keyed record, a plain object or a `Map`, with its keys renamed, and its values too unless `renameValues` is false (a reparse host's template is source text, a test failure's reason is prose). The result has the input's form. Two keys renaming to one name is an error; the keys are gathered in a `Map`, so a kind named like an object property (`constructor`) is no collision.

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

One owner-scoped lookup of a segment rewrite, over the destinations `segmentDestinations` finds. A segment with two destinations under the owner is refused here, when a reader asks for it. Both options rewriting and field-name projection use this lookup.

### `packages/codegen/src/dsl/verbs/effects.ts::segmentDestinations`

Every destination a segment has under an owner, counting rewrites on the hidden helper rules the owner reaches by the canonical transparent-rule traversal, which stops at a supertype. One kind can hold a field at two positions and have them renamed apart (rust's `range_expression` names its two `expression` operands `start` and `end`), so a segment can have more than one destination.

### `packages/codegen/src/dsl/verbs/effects.ts::boundFieldNameOf`

Projects a field name through canonical segment effects, optionally resolving hidden helper owners through the supplied grammar: the preference-path formatter and parser preserve the segment syntax, and an effect that does not leave a field segment is refused. Field routes and options therefore read the same recorded binding edit.

### `packages/codegen/src/dsl/verbs/effects.ts::bindMatch`

Maps a lead match tree through kind and owner-scoped field renames, keeping variant names. The binding facts and the lead entries both read a match through it.

### `packages/codegen/src/dsl/verbs/effects.ts::rewriteOwnedSegments`

The options block with segment rewrites applied under their owning kind only: within a kind's options record, and in a label address whose head is that kind. A rewrite for one kind leaves another kind's identically spelled segment alone.

### `packages/codegen/src/dsl/verbs/effects.ts::ownerOptions`

Selects an authored owner's render preferences and owned label addresses as input to the existing canonical option-path renamer. Values and label targets keep their authored meaning.

### `packages/codegen/src/dsl/verbs/effects.ts::inheritSplitOptions`

Projects source-owner preferences and labels onto each realized parser split using the canonical split provenance and option-path mapper. The original policy remains in place; an explicitly authored target policy wins. `splitGrammar` applies this alongside its realized `splitFrom` metadata, and `rewriteInherited` applies it for each copy a path or `copy()` made, so contextual bodies retain indentation, boundary breaks and end-of-list preferences.

### `packages/codegen/src/dsl/verbs/effects.ts::isSegment`

Whether an effect is a field `segment` effect.

### `packages/codegen/src/dsl/verbs/effects.ts::effectsForOwners`

The recorded effects, with each field (`segment`) effect given to every rule whose transparent reach holds its owner, once per destination (`segmentDestinations`): in rule order, and within a rule in the order the segments were first recorded. A segment renamed two ways stays two effects, and only a reader that asks for it (`boundSegmentOf`) refuses it. The other effects come first, in their own order. It runs over the rules as the layer's edits left them, before the whole-grammar phase: a lead can narrow a visible kind in place and swap a hidden rule it reaches for a copy, after which the kind no longer reaches the rule the effect names (typescript's `required_parameter`, whose `_parameter_name` the lead's rest side copies). The result names every owner, so a reader of one owner (`boundFieldNameOf` without a grammar, `rewriteInherited`) needs no reach of its own.

### `packages/codegen/src/dsl/verbs/effects.ts::inheritsOptions`

Whether a copy takes its source's options and labels: true for a copy a path or `copy()` made, false for one a narrowing or a lead made, whose shape is new.

### `packages/codegen/src/dsl/verbs/effects.ts::splitFromOf`

Each copy whose origin `inheritsOptions`, mapped to its source, in log order. It is both the `splitFrom` projection and the copies `rewriteInherited` gives their source's options.

### `packages/codegen/src/dsl/verbs/effects.ts::RecordRename`

What a kind rename does to one record: `optionPaths` renames option heads, `(kind)` segments and label heads; `keysAndBodies` re-keys the record and renames the kinds its values reference as rule bodies do; `keys` re-keys it and leaves its values; `names` renames the names a list holds, or the lists a record holds; `{ entry }` renames, in each entry of a list, the name under that key; `reparseHosts` renames the hosts' keys, the priority and the gated names.

### `packages/codegen/src/dsl/verbs/effects.ts::RECORD_RENAMES`

The one table of which records a kind rename rewrites, and how. It is typed over every `LayerRecords` key, so a new record fails the type-check until it is given an entry. A rename leaves the old name only as an unreachable blank rule, so every record that holds a kind name follows it, as a key or as a name. The stages are not a record: evaluate evaluates them from the stage bases the layer record carries, which no rename rewrites (`layer-record.ts::StageBases`).

### `packages/codegen/src/dsl/verbs/effects.ts::renamedRecord`

One record under a kind rename, as its `RecordRename` says.

### `packages/codegen/src/dsl/verbs/effects.ts::renameRecords`

Every record `RECORD_RENAMES` names, under a kind rename, with the field names that tell a field segment from a slot segment named after a kind. A key the input lacks stays absent, and the input is never changed. `rewriteInherited` applies it to a layer's inherited records, and `renameGrammar` to a whole grammar beside its own rule and list fields.

### `packages/codegen/src/dsl/verbs/effects.ts::rewriteInherited`

The records a layer inherits, rewritten through the layer's effects so that they name what the layer's result has. The options block takes, in this order: the segment effects under their owners (`rewriteOwnedSegments` with no grammar, since the log names every owner), the alias effects (`renameOptionPaths` without kind heads), the renames (`renameRecords`, which also rewrites every other record the table names), and the copies a path or `copy()` made (`inheritSplitOptions`). Segment, alias and copy effects touch only the options block. A record no effect names is returned as given, and the input is never changed. A layer's own records are written against its own result, so they never pass through here.

### `packages/codegen/src/dsl/verbs/effects.ts::LeadCopies`

The copies one lead entry made, in recording order, beside the entry's origin.

### `packages/codegen/src/dsl/verbs/effects.ts::symbolsOutsideField`

The symbol names a rule references outside its fields named `field`: in a receiver form's body, the group that follows the receiver field.

### `packages/codegen/src/dsl/verbs/effects.ts::fieldsHolding`

The names of the fields in a rule whose content is `symbol` itself.

### `packages/codegen/src/dsl/verbs/effects.ts::soleName`

The one distinct name in a list. None, or several, is an error: the lead helper builds the bodies these names are read from, so a mismatch is a broken helper, not an authored mistake.

### `packages/codegen/src/dsl/verbs/effects.ts::namedAliasValues`

Every named alias value a rule holds, without entering the rules it references.

### `packages/codegen/src/dsl/verbs/effects.ts::renamesWithoutCopy`

The admits, at any depth, that rename their kind with `as` and restrict nothing: such a kind is kept whole under its new name, so no copy records it.

### `packages/codegen/src/dsl/verbs/effects.ts::headVariants`

A lead's head forms, each admitted kind's displayed name: every copy a narrowing made for an admitted kind, in copy order, then each kind an `as` renamed without a copy, when a body of the lead's copies in the lead field's context shows that name.

### `packages/codegen/src/dsl/verbs/effects.ts::leadEffectOf`

A lead's `bindingEffects` entry, from its copies and the rules. The list, item, field and admits come from the origin; the receiver is the displayed name of the list's copy; each variant maps an admitted kind to its head form's displayed name (`headVariants`); the group is the symbol beside the receiver field in the receiver form's body, and the rest field is the field of the group that holds the list.

### `packages/codegen/src/dsl/verbs/effects.ts::provenanceOf`

The `Provenance` of a layer's effects, read over the layer's final rules, where the receiver forms and groups the leads made sit. A copy whose origin is a `narrow` is in no projection. Lead entries come in the order of each lead's first copy, keyed by list and field, since a lead's receiver form `_<list>_<field>` is unique.

### `packages/codegen/src/dsl/verbs/effects.ts::appendProvenance`

A layer's projections appended to the ones it inherits: each map merged with the layer's entries last, and the binding effects in order, under `provenance`'s presence rules. A layer that inherits no projections projects its own as they are.

### `packages/codegen/src/dsl/verbs/effects.ts::provenance`

A `Provenance` under the presence rules: `splitFrom` and `bindingEffects` always, `leadFrom` and `renamedFrom` only when they hold an entry.

### `packages/codegen/src/dsl/verbs/copy.ts::VerbRefusalCode`

The blocking codes a verb refuses with: `edit-site-missing` (an entry names no rule), `edit-entry-invalid` (the entry cannot apply to what it names), `narrow-invalid` (a narrowing cannot divide its site as asked), `edit-site-conflict` (two edits disagree about one rule), and `rule-name-taken` (a copy's name is already another rule's).

### `packages/codegen/src/dsl/verbs/copy.ts::VerbRefusal`

A refusal a verb throws: its `code` and its `reason`. The caller words it for its own surface: the layer's lead driver records it as a diagnostic naming the entry (`verbs/lead.ts::applyLeads`), and the lead derivation reports its reason on the claims (`bindings/leads.ts::deriveLeads`).

### `packages/codegen/src/dsl/verbs/copy.ts::MintLists`

The grammar's `supertypes` and `inline` lists, copied for an edit that mints rules, and `enlist`, which lists a minted rule beside its origin.

### `packages/codegen/src/dsl/verbs/copy.ts::mintLists`

Copies the grammar's `supertypes` and `inline` lists and returns them with `enlist(base, name)`: a rule minted from `base` joins each list `base` is in, spelled as the list spells its entries (a name, or a symbol record). `bind.ts::splitGrammar` and the verb context (`verbCtxOf`) mint through it.

### `packages/codegen/src/dsl/verbs/copy.ts::GroupMints`

The groups the leads in one context name, their origins, and the dedupe map of enrich's automatic-group primitive (`automatic-groups.ts::visibleGroupSynthName`), so two leads that need one group body share it. They join the rules after every lead (`verbs/lead.ts::appendLeadGroups`).

### `packages/codegen/src/dsl/verbs/copy.ts::VerbCtx`

The state the verbs work on: the grammar view they read lists and names from; its rules, which the verbs edit in place; the supertype and inline lists the copies join (`mintLists`); the supertype names a walk stops at; whether the parse tree shows a rule (`transparent`: a hidden name, a supertype or an inline rule); the effects the verbs record; the rules they create, in creation order; each rule an earlier narrowing reached, mapped to that narrowing's origin (`reached`); the groups they name (`GroupMints`); and the diagnostics a refusal joins. The layer's context extends it (`layer.ts::LayerCtx`).

### `packages/codegen/src/dsl/verbs/copy.ts::VerbLog`

The effect and diagnostic lists a verb context records into, shared with its caller.

### `packages/codegen/src/dsl/verbs/copy.ts::verbCtxOf`

A verb context over a grammar view: its rules (a copy, unless the caller hands the rules the verbs edit), its lists, the supertype names and the transparency test read from its `supertypes` and `inline` (`rule-patterns.ts::listedNames`), and the caller's log.

### `packages/codegen/src/dsl/verbs/copy.ts::refusalOf`

Applies `apply` and returns the `VerbRefusal` it throws, after undoing all it did: the rules it added or changed, the effects, created names and list entries it appended, the rules it marked reached, and the groups it registered. Any other error passes through. A refused entry so leaves the context as it found it, and the entries after it apply as if it were absent.

### `packages/codegen/src/dsl/verbs/copy.ts::EntryLabel`

How an entry's refusal is reported: the kind it is filed under, the name its message starts with, and the details it carries.

### `packages/codegen/src/dsl/verbs/copy.ts::applyEntry`

Applies one entry of the whole-grammar phase (`refusalOf`). A refused entry leaves no trace and joins the diagnostics as a blocking diagnostic with its verb code and the message `<name>: <reason>`.

### `packages/codegen/src/dsl/verbs/copy.ts::CopyRequest`

One copy: its `source` rule, the `part` copied (`.` for the whole rule), the `context` it is for, its `body`, its `origin`, and, for a visible form, the name it shows under (`display`) and the kind it stands for (`admitted`).

### `packages/codegen/src/dsl/verbs/copy.ts::copyNameOf`

A copy's name: `_<source>_<context>` for the whole rule, the source's own leading underscores dropped (`arm-names.ts::undisplayedKindAddress`), with a part's segments, field names without their colon, between the two.

### `packages/codegen/src/dsl/verbs/copy.ts::copySourceOf`

The source a recorded copy was made from, or `undefined` when no copy effect names the rule.

### `packages/codegen/src/dsl/verbs/copy.ts::applyCopy`

Makes one copy and returns its name. A name the rules already hold is reused when the effects record it as a copy of the same source with an equal body (`rule-patterns.ts::rulesEqual`): one copy per source, part and context. Another body is `edit-site-conflict`, and a rule that is no copy of this source is `rule-name-taken`. A new copy follows every other rule; its name joins the created list and every supertype and inline list its source is in, and its copy effect the effects.

### `packages/codegen/src/dsl/verbs/narrow.ts::SitePositions`

How many positions of a site's own structure each rule name occupies, and which rules (or the site's expression itself, as the caller names it) hold it.

### `packages/codegen/src/dsl/verbs/narrow.ts::NO_POSITIONS`

The empty `SitePositions`, for a narrowing that never narrows in place (`keep`).

### `packages/codegen/src/dsl/verbs/narrow.ts::NarrowDirection`

What a narrowing keeps at its site: `keep` keeps only the admitted arms (`narrow(...)`), and `except` every other arm (`narrow.except(...)`).

### `packages/codegen/src/dsl/verbs/narrow.ts::NarrowSite`

One site a narrowing applies to: the reference it narrows, the context its copies are named for, the narrowing's origin (`verbs/effects.ts::NarrowingOrigin`), the rules the narrowing walked (`reach`, which a lead's two sides share), and for `except` each rule's reference count (`sites`, which decides whether a hidden rule is the site's own) and the site's positions (`SitePositions`).

### `packages/codegen/src/dsl/verbs/narrow.ts::NarrowEntry`

A `narrow` entry as wire queues it: the kind whose `edits` entry it is, its path, its direction and its admits.

### `packages/codegen/src/dsl/verbs/narrow.ts::Narrowing`

The state one narrowing works in: the verb context, the site, and whether it keeps the admits.

### `packages/codegen/src/dsl/verbs/narrow.ts::applyNarrows`

The layer's `narrow` entries, in the order wire queued them, each applied as an entry (`verbs/copy.ts::applyEntry`) under the message `narrow '<kind>' at '<path>'`. They run in the whole-grammar phase with the path edits, before the leads, so each sees the rules as the layer's own edits left them.

### `packages/codegen/src/dsl/verbs/narrow.ts::applyNarrowEntry`

Applies one `narrow` entry at the member its path names in its kind's rule (`transform/transform-path.ts::applyPathInRules`), so a path sees through the rule's own enrich lifts as every edit path does.
- The copies are in the context of the entry's kind, with the entry as their origin.
- Whether a hidden rule is the site's own is read from every rule's references (`rule-patterns.ts::countSymbols`), counted once for the entry, before it applies.
- The site's positions are counted on each member before it narrows (`sitePositions`), expanding the kinds the admits restrict (`withinKinds`); the expression itself is `the site`.
- A narrowing that leaves the member nothing is `narrow-invalid`. Each rule the site holds is then marked reached by the entry (`holdReached`).
- A path that names no member is `edit-site-missing`: the path model reports one as `transform/transform-path.ts::ApplyPathSkip`. A field segment that names another field stays the path model's hard error, as it is for every entry.

### `packages/codegen/src/dsl/verbs/narrow.ts::withinKinds`

The kinds an admit list restricts (`within`), at any depth: the visible kinds a narrowing walks into, so a site's positions count what they hold.

### `packages/codegen/src/dsl/verbs/narrow.ts::applyNarrow`

Narrows a site's reference to what the admits allow (`keep`) or to everything else (`except`), and returns the narrowed reference, or `undefined` when nothing of it is left: the caller words that refusal for its own surface, as a lead's head does ('it admits no item of the list'), its rest ('it leaves the list no item') and a `narrow` entry ('it leaves the site no arm'). Under `except` the walk starts exclusive, so a hidden rule only the site reaches narrows in place.

### `packages/codegen/src/dsl/verbs/narrow.ts::holdReached`

Marks each rule a site holds as reached by its narrowing (`VerbCtx.reached`), unless an earlier one already holds it, so a later narrowing cannot change it in place.

### `packages/codegen/src/dsl/verbs/narrow.ts::siteNoun`

How a refusal names the narrowed site: a lead's `the item`, or a `narrow` entry's `the site`.

### `packages/codegen/src/dsl/verbs/narrow.ts::heldBy`

How an `edit-site-conflict` names the narrowing that holds a rule: `the lead on '<list>' holds it in its item`, or `the narrow on '<kind>' at '<path>' holds it at its site`.

### `packages/codegen/src/dsl/verbs/narrow.ts::copyFor`

A narrowing's copy of `source`, in the site's context, with the site's origin, shown under `display` as the form of `admitted` when the narrowing made it for an admitted kind.

### `packages/codegen/src/dsl/verbs/narrow.ts::renamedKind`

A reference renamed to `value` in the parse tree: an alias takes the new value over the same content, and any other reference is aliased. Precedence wrappers stay outside.

### `packages/codegen/src/dsl/verbs/narrow.ts::exclusiveTo`

Whether `except` may narrow `name` in place: only when every rule above it on the path is narrowed in place (`exclusive`) and `name` has at most one reference site (`NarrowSite.sites`). Otherwise another site still holds the original (another kind, another position of the same kind, or a form `keep` copied), and the narrowing copies it.

### `packages/codegen/src/dsl/verbs/narrow.ts::isDescended`

Whether the narrowing walks into a referenced rule: a hidden rule the grammar defines that is not a supertype.

### `packages/codegen/src/dsl/verbs/narrow.ts::narrowRef`

Narrows one reference, or returns `undefined` when nothing of it is left.
- A visible kind the admits do not name stays under `except` and goes under `keep`. A kind admitted twice is `narrow-invalid`. A supertype or inline rule whose name reads visible is still a kind here, so one that holds an admitted kind (`admittedInside`) is refused rather than split.
- A kind admitted with no restriction is kept whole, renamed to `as` when the match gives one (`renamedKind`), and goes under `except`.
- A kind admitted with a restriction must have a rule to narrow; an alias of a literal is `narrow-invalid`.
- A kind admitted with a restriction is narrowed by `narrowWithin`. `keep` always copies it, `_<rule>_<context>`, shown as `as` or else as `<kind>_<context>`, so a form never takes its kind's own name. `except` narrows a visible kind in place, losing its admitted forms wherever else the grammar uses it, but only when the site holds it at no other position (`SitePositions`): a second position would lose forms on both sides, so that is `narrow-invalid`. Every in-place narrowing goes through `narrowInPlace`. A hidden rule is narrowed in place only when `exclusiveTo` allows, and copied in the site's context otherwise.
- A choice narrows each arm and keeps the arms left in their order; one arm left stands alone.
- A hidden rule (`isDescended`) narrows its body. A body that narrows to one reference is that reference; any other narrowed body is narrowed in place or copied, as above.
- Anything else stays under `except` and goes under `keep`, unless it holds an admitted kind (`admittedInside`): a sequence, a supertype or a field the walk cannot divide would put that kind on both sides, so it is `narrow-invalid`.

### `packages/codegen/src/dsl/verbs/narrow.ts::admittedInside`

The first admitted kind a rule holds as a child of the node it sits in: through every rule the parse tree does not show (a hidden name, or a supertype or inline rule of any name), but not into a visible kind, which is a node of its own, nor into a token.

### `packages/codegen/src/dsl/verbs/narrow.ts::narrowWithin`

Narrows a kind's body to a match's restriction. The restriction's position is the field it names, or for an unfielded child a choice holding an admitted kind, found in the body or in a hidden rule it descends into. The kind must hold exactly one such position, outside any repeat: two sides cannot split a position the kind holds more than once (twice in its body, under a repeat, or through a recursive hidden rule, which shows as two), so those are `narrow-invalid`, as is a restriction with no position. The position is narrowed by `narrowRef`, and a position left empty is `narrow-invalid`. Under `keep`, an alternative that does not hold the position goes, and an optional holding it becomes required, since a claim that tests the position needs it present; `except` keeps every alternative. A hidden rule on the way is narrowed in place or copied, by the same rule as `narrowRef`'s.

### `packages/codegen/src/dsl/verbs/narrow.ts::sitePositions`

The positions each rule name occupies in a site's own structure, counted before `except` narrows anything: a lead's item on the grammar as its head (`keep`) left it, a `narrow` entry's member before it applies. The walk starts at the site's expression, which the caller names (`top`), and expands the rules the narrowing walks (`reach`: what a lead's head walked, or the kinds a `narrow` entry's admits restrict) and every rule the parse tree does not show (a hidden name, or a supertype or inline rule of any name), since those are the site's structure; a visible kind outside the reach is a node of its own, and what it holds is not counted. Each symbol occurrence is a position, a rule already on the walk's path not expanded again. So a kind the site holds at two fields, through a hidden rule it holds twice, or inside itself has more than one position; the narrowed position is one, so any other refuses. A position under a repeat or a recursion in the restriction's own path never gets here: `narrowWithin` refuses the first, and `narrowRef` the second, as a sequence it cannot divide. Rust's lead item also reaches `parameter` through the expressions nested in it, at a closure's parameters, which this walk leaves outside: the in-place narrowing may lose forms there.

### `packages/codegen/src/dsl/verbs/narrow.ts::narrowInPlace`

Writes a rule `except` narrows in place, unless an earlier narrowing reached it (`VerbCtx.reached`), at a lead's item or a `narrow` entry's site: narrowing it would take forms from that site after it was narrowed, so it is `edit-site-conflict`, naming the narrowing that holds it (`heldBy`).

### `packages/codegen/src/dsl/verbs/lead.ts::applyLeads`

The whole-grammar phase of a layer's lead entries, in the order wire queued them. Each entry's item field and admits are first read through the layer's own field effects (`verbs/effects.ts::boundFieldNameOf`, `verbs/effects.ts::bindMatch`), since an entry names the base's fields. Each applies as an entry (`verbs/copy.ts::applyEntry`): a refused lead leaves no trace and joins the diagnostics with its verb code and the message `lead '<list>.<field>': <reason>`. The leads' groups then follow every lead copy (`appendLeadGroups`).

### `packages/codegen/src/dsl/verbs/lead.ts::applyLead`

Applies one lead to the context:
- The list must be a rule, or the lead is `edit-site-missing`, and a separated list whose element is the lead's item field, as the derivation reads it (`rule-patterns.ts::fieldedHeadListOf`), with no leading separator and no mandatory trailing one; otherwise it is `edit-entry-invalid`.
- The head: `keep` narrows the item to what the lead admits, in the context of the lead's field (`verbs/narrow.ts::applyNarrow`). The rest: `except` narrows it to everything else, in the context of the item field, after the item's positions are counted on the grammar as the head left it (`verbs/narrow.ts::sitePositions`, the expression named `the list item`), with each rule's references (`referenceSites`). Every item of the plain list holds the rest (`replaceItems`). A lead that admits no item, or leaves the list none, is `narrow-invalid`.
- The owners are the rules other than the list and the lead copies made so far. They must hold the list only as a field's whole content (`listSites`), all under one field name; otherwise the lead is `edit-entry-invalid`.
- The group is `seq(SEP, optional(field(F, <list>)))`, where `SEP` is the list's separator and `F` the owners' field, the field required when the list takes no trailing separator, named as enrich's automatic-group primitive names it, `<list>_<field>_group` (`automatic-groups.ts::visibleGroupSynthName`). A group it cannot name is `edit-entry-invalid`.
- The receiver form is a copy of the list in the context of the lead's field, `_<list>_<field>`, shown as `<list>_<field>`, with the body `seq(field(<field>, HEAD), optional(group))`, its optionals in the list's own spelling (`optionalSpelling`).
- Every owner field that held the list then holds a choice of the plain list and the receiver form (`withReceiverForm`), so the parser takes the receiver only first.
- Each rule the item holds is marked reached by this lead (`verbs/narrow.ts::holdReached`), so a later narrowing cannot narrow it in place.

The lead records no effect of its own: its copies carry it as their origin, and its `bindingEffects` entry is projected from them (`verbs/effects.ts::leadEffectOf`).

### `packages/codegen/src/dsl/verbs/lead.ts::appendLeadGroups`

Adds the groups the leads named after every lead copy, hoisted (`annotations.ts::withHoistedAnnotation`), drops a group's ordinal where it is the only one of its name (`automatic-groups.ts::collapseSingletonMintOrdinals`), and appends the groups' final names to the created list.

### `packages/codegen/src/dsl/verbs/lead.ts::groupContextOf`

The automatic-group context a lead names its group in: the context's rules, the group mints the leads share, the lead's symbol source, no authored group bodies and no hoist state.

### `packages/codegen/src/dsl/verbs/lead.ts::leadSymbols`

The symbol source the list detector reads the grammar with (`predictedSymbolSourceOf`), over the rules as the earlier leads left them, with the grammar's lists read by name.

### `packages/codegen/src/dsl/verbs/lead.ts::optionalSpelling`

How the edit writes an optional: as the list itself spells one (`OPTIONAL`, or a choice with a blank), or as a choice with a blank when the list holds none. Both executions of the grammar read a choice with a blank, and tree-sitter's DSL writes nothing else.

### `packages/codegen/src/dsl/verbs/lead.ts::replaceItems`

The list rule with every item field whose content equals the item (`rulesEqual`, so either optional spelling) holding the narrowed rest instead.

### `packages/codegen/src/dsl/verbs/lead.ts::listSites`

The fields of `owner` whose whole content is the list. An owner that holds the list any other way (bare, or inside a field's repeat or choice) is `edit-entry-invalid`, since the receiver form could not stand there.

### `packages/codegen/src/dsl/verbs/lead.ts::withReceiverForm`

The rule with every field that holds the list holding a choice of the list and the receiver form.

### `packages/codegen/src/dsl/verbs/lead.ts::referenceSites`

How many places reference each rule (`rule-patterns.ts::countSymbols`), counted after the head has copied its forms, so a form that still holds a hidden rule keeps it from narrowing in place. Every symbol in every rule counts, each occurrence apart, except the list's own: the rest narrows every item of the list alike, so the list counts its item expression once (each occurrence in it apart) and its separator once.
