# `packages/codegen/src/packages/tools/src/emit` — Function Glossary

Per-function reference for `packages/codegen/src/packages/tools/src/emit/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---


### `packages/tools/src/emit/factory-source.ts::catalogEntriesOf`

```text
The generated-id catalog row shape the lookups in
`packages/codegen/src/compiler/generated-metadata.ts` read: `symbolName` is
the parser's own display name, `literalText` the token's literal text, and
`literalRule` the literal-rule flag — the same three fields
`collectGeneratedKindEntries` puts on `GeneratedKindEntry`. A row missing
`literalText` makes `findEntryForLiteralText` miss every anon-token lookup,
so this must mirror `KindEntryLike` exactly, not just `symbolName`/`anon`.
```

### `packages/tools/src/emit/factory-source.ts::mountPrinter`

The printer for a form reached through a parent's mount route (`ir.<parent>.<mount>.strict(...)`): each argument is printed as a seated config when it is an object and as a direct value otherwise. Arguments are printed only up to the last one that is defined, so a form whose optional slot the source left empty prints as `strict()` rather than `strict(undefined)` — the spelling the form's own surface admits.

### `packages/tools/src/emit/factory-source.ts::LooseFacts`

The stamped facts the loose spelling reads, all from `node-model.json5`
through `loadNodeModel`: `modelTypes` (which kinds are pattern leaves and
which are compounds), `subtypes` (to expand a slot's supertypes the way the
coercer's resolver tables are built), `slotDefaults` (the `arm.default`
kind per slot), `bareAccepts` (what each single-slot wrapper or list admits
bare, transitively), `forwardsTo`, `listDefaults` (the delimiter a list
stamps when none is given), `listElementKinds` (each list's element kinds,
for the elements the runtime resolves one by one) and `hoistedKinds`. `nested` is the caller's
choice for a nested compound: its builder call, or a config object.

The per-slot tables (`slotKinds`, `slotRequired`, `slotMultiple`, `slotDefaults`, `slotStorage`) are keyed by a slot's
config key, `snakeToCamel` of its name: the key a printed config names it with. A pluralized repeated slot's accessor
(`attributeItems`) is not that key (`attributeItem` is), so keying by the accessor left every such slot unloosened.

### `packages/tools/src/emit/factory-source.ts::PrintedFacts`

What a printed node was made from, kept beside its source so the slot it
lands in can spell it looser: a text leaf's `text`, a single-slot wrapper's
`inner` value (in its strict spelling, since a dropped wrapper hands it to
the parent's slot), a list's `elements` with the options bag it was given,
and a config-shaped node's printed `config` object.

### `packages/tools/src/emit/factory-source.ts::callSpelling`

The strict flavor is named (`.strict`); the loose flavor is the bundle's
own call, and every mount and variant route is callable the same way, so
nothing ever spells `.coerce`.

```text
/** The strict flavor is named; the loose one is the bundle's own call. */
```

### `packages/tools/src/emit/factory-source.ts::loosenAt`

Applies the loose rules to what a slot holds once the strict wrapping has
run: a `multiple` slot per element, since the runtime resolves each element
on its own. Without loose facts, or at a slot the model does not declare,
the value passes unchanged.

#### body

```text
// A repeated slot resolves each element on its own; a tuple seat's array
// is one argument list the envelope builder takes as given.
```

### `packages/tools/src/emit/factory-source.ts::loosenValue`

The loosest spelling of a printed node at a slot, in the order the runtime
resolves a value. A single-slot wrapper is dropped when its inner value is
not admitted directly and exactly one arm of the slot admits it bare — and
that arm is the wrapper itself, or the runtime would build a different
wrapper. A list envelope with default options is its bare array when the
slot's one branch kind, or its declared default arm, is the envelope (or a
direct wrapper whose sole slot is the envelope, which the runtime unwraps
the same way). A text leaf is its bare string when the slot admits exactly
one pattern kind, or when the one branch kind (or default) that a string
can reach admits exactly one pattern kind at its content slot, or failing
that in its transitive bare-accept set (`leafReachedThrough`). A raw kind id
under a single-slot wrapper drops the wrapper when exactly one arm of the
slot accepts that kind and no enum sits on the slot, since the runtime hoists
an id the way it hoists a node (rule 5) but an enum on the slot would take
the id directly. A config-shaped node with a flat
`ir` key prints as its config object under `nested: 'configs'`: keyless when
the slot has one branch kind, keyed `kind: TSKindId.<Member>` otherwise. A
node carrying trivia keeps its call, since only a call takes `$trivia`.

#### one element

A list envelope with default options prints as its bare element when it holds exactly one element that prints as a call or text, and as the array otherwise. An element that prints as an object or an array keeps the array, since an object at a list slot is one element's config and an array is the elements. Each element is first hoisted out of its seat config (`hoistSeatElement`) and then loosened at the list's element kinds (`looseListElement`), so `[{ expression: ir.identifier("x") }]` prints as `"x"`.

### `packages/tools/src/emit/factory-source.ts::leafKindsForText`

The leaf kinds among a slot's kinds that a bare string could become: the
pattern leaves whose anchored regex (`leafPatterns`, stamped from the model)
accepts the text, or, when no patterned leaf does, the leaves that carry no
pattern at all. `soleLeafKind` is the unique such kind, or nothing; the
printer spells a text bare only when that unique kind is the leaf the strict
spelling names, since the runtime resolves a string by the first pattern in
slot order and uniqueness is what makes first and only coincide.

### `packages/tools/src/emit/factory-source.ts::listElementKinds`

The kinds a list's elements resolve against on the loose surface, in the
runtime's order of preference: the kinds of the list's element seats
(`elementSeats`, the hidden transparent wrapper such as `_attributed_argument`)
when it has any, else the model's `elementKinds` for the list, either expanded
through the supertypes. A list carries no `slots` in the model, so this is
the element slot the coercer's `_listElements` resolves through.

```text
/**
 * The loosest spelling of a printed node at a slot, by the loose contract's
 * slot-driven rules: a single-slot wrapper is dropped when exactly one arm
 * of the slot admits its inner value bare and that arm is the wrapper; a
 * list envelope is its bare array when the slot's one branch kind, or its
 * declared default, is the envelope; a text leaf is its bare string when the
 * slot admits one pattern kind; a config is its object when nested configs
 * are asked for. A node carrying trivia keeps its call, since only a call
 * can carry `$trivia`.
 */
```

### `packages/tools/src/emit/factory-source.ts::contentSlotKinds`

For a kind with exactly one required, non-multiple slot, that slot's kinds
expanded: the slot a bare value lands in when the kind's coercer takes the
value bare, and the slot the list coercer resolves elements against when the
kind is the list's transparent wrapper. Nothing for a kind with no such slot.

### `packages/tools/src/emit/factory-source.ts::leafReachedThrough`

The unique leaf a text becomes when routed through `target`: tested first
against `target`'s content slot (`contentSlotKinds`), which is where the
runtime resolves it, and only then against the transitive bare-accept set,
which can collide on leaves reachable deeper down (`field_identifier` under
an expression) that the content slot never offers. The order is what lets
`arguments: ["source"]` print where the transitive set alone said ambiguous.

### `packages/tools/src/emit/factory-source.ts::looseListElement`

One list element's loose spelling: loosened at the list's element kinds
(`listElementKinds`) and the list's `element` default arm, exactly as
`loosenAt` loosens a slot's value. Both list paths call it, the list's own
call when its options are not the default and the bare array a parent's slot
prints, so an element spells the same in either.

### `packages/tools/src/emit/factory-source.ts::listOptionsAreDefault`

Whether a list's options bag restates what the factory stamps on its own:
no separator, and either no delimiter or the list's `defaultDelimiter`. Such
a bag is dropped from the loose call, and the list may then print as a bare
array.

### `packages/tools/src/emit/factory-source.ts::placeDirectArg`

A single-slot kind's argument in both spellings: the strict form is what the
argument is when the wrapper is dropped and it lands on the parent's slot,
where the parent's rules decide its spelling afresh; the loose form is its
spelling inside the wrapper's own call.

```text
/**
 * A single-slot kind's argument, spelled both ways: the strict form is what
 * the argument is when the wrapper is dropped and it lands on the PARENT's
 * slot, where the parent's rules decide its spelling afresh; the loose form
 * is its spelling inside the wrapper's own call.
 */
```

### `packages/tools/src/emit/factory-source.ts::printVerbatimText`

```text
Text held by a verbatim slot with no kind is printed as the bare string: a lexed kind's content slot
(`content: "x"`), never as an identifier leaf.
```

### `packages/tools/src/emit/dogfood-targets.ts::DOGFOOD_TARGETS`

The one table of dogfood rebuild targets: for each, the grammar, the
repo-relative source file, the `examples/` file stem, the export-name base, the
surfaces to print (`strict`, `loose`) and the committed render fixture under
`packages/tools/tests/emit/__fixtures__/`. Everything that iterates the
rebuilds reads this table: `pnpm run gen:examples`
(`packages/tools/src/scripts/gen-examples.ts`), the freshness test
(`generated-examples.test.ts`) and the render-bytes test
(`dogfood-render-bytes.test.ts`). A new target is one row here and nothing
else.

### `packages/tools/src/emit/dogfood-targets.ts::DOGFOOD_REBUILDS`

`DOGFOOD_TARGETS` expanded one row per surface, with the derived export name
(`rebuild<Name>Generated` for strict, `rebuild<Name>Loose` for loose) and the
derived file (`examples/<stem>.generated.ts`, `examples/<stem>-loose.generated.ts`).
The spelling rule lives here alone; a consumer never rebuilds a name.

### `packages/tools/src/emit/factory-source.ts::hoistSeatElement`

A seated element whose config sets nothing but the seat's one required slot
is that slot's value: the list builder takes the value bare and seats it
itself, on the strict surface as on the loose one. An optional multiple slot
given an empty array counts as unset, since the read projection spells an
absent repeated slot as `[]` (`attributeItem: []` beside `expression`) and
the strict factory builds the same node without it.

```text
/**
 * A seated element whose config sets nothing but the seat's one required
 * slot is that slot's value: the list builder takes the value bare and seats
 * it itself, on the strict surface as on the loose one.
 */
```

### `packages/tools/src/emit/factory-source.ts::wrapSeatElement`

A seated element that stayed a plain config after `hoistSeatElement`: its keys are the seat's slots, so the seat's rules
(`wrapTextLeaves`, and through it `loosenAt`) decide their spelling, the way a seated config inside a parent's config is
already treated. The seat is the one element seat whose slots hold every key the config sets; with none or several
matching the config is left as it is.

### `packages/tools/src/emit/factory-source.ts::PrintContext.source`

```text
/** The source the read came from: the bytes a span addresses. */
```

### `packages/tools/src/emit/factory-source.ts::LooseFacts.kindIdOfName`

```text
/** A kind's parser id; an alias shares its target's, and the runtime admits by id. */
```

### `packages/tools/src/emit/factory-source.ts::Printed.$_trivia`

```text
/** Set by the construction funnel from the read node this was built from. */
```

### `packages/tools/src/emit/factory-source.ts::printRawNode`

#### body

```text
// A fixed-text leaf stores its kind id in place of its text.
```

### `packages/tools/src/emit/factory-source.ts::isListOptions`

```text
/**
 * A separated list's options bag, which its factory takes ahead of the
 * elements. It reaches the generic printer too: a tuple seat hands the
 * parent's slot the child's WHOLE argument list, so the bag arrives as the
 * first entry of an array rather than as a positional argument.
 */
```

### `packages/tools/src/emit/factory-source.ts::triviaOf`

```text
/**
 * A node's attached comments as text. A trivia entry carries its text when the
 * reader captured one; otherwise its span addresses the bytes in `source`.
 */
```

### `packages/tools/src/emit/factory-source.ts::storesKindId`

```text
/**
 * A slot whose storage is `verbatim` holds text, never a kind id, so the
 * literal-text resolution chain does not apply to it: that chain answers
 * "which literal token spells this", and it falls back to the full name chain,
 * which matches any identifier that happens to share a rule's name (python's
 * `list` as a type annotation became `TSKindId.List`, rendering `[]`).
 */
```

### `packages/tools/src/emit/factory-source.ts::textLeafValue`

```text
/**
 * The text a slot value stands for when it is text: a bare string, or a read
 * leaf — a node with `$text`, no storage and no attached trivia — which the
 * reader hands over as itself, coordinate included. A leaf carrying trivia
 * keeps its node form so the trivia prints with it.
 */
```

### `packages/tools/src/emit/factory-source.ts::soleLeafKind`

```text
/**
 * The single leaf kind of a slot whose guard the text satisfies, if exactly
 * one does. A bare string resolves at runtime to the leaf kind whose pattern
 * it matches, so a leaf spells bare safely only when that kind is unique.
 */
```

### `packages/tools/src/emit/factory-source.ts::bareTextAdmitted`

```text
/**
 * Whether a read leaf's text prints bare at a slot: the slot admits exactly
 * one pattern kind, which is the kind the strict spelling would name too
 * (the first text leaf of the slot), so a bare string builds the same leaf.
 */
```

### `packages/tools/src/emit/factory-source.ts::admitsDirectly`

```text
/**
 * Whether a slot admits a printed node as it is. The runtime's resolver
 * tables are keyed by parser id, so an alias (`_shorthand_property_identifier`
 * over `identifier`) admits the node its target would.
 */
```

### `packages/tools/src/emit/factory-source.ts::buildsNodeData`

```text
/**
 * Whether a kind's value is node data the coercer can route by its `$type`:
 * an enum or keyword leaf is stored as a bare kind id, which the runtime only
 * accepts where the slot itself admits the kind, never through a wrapper.
 */
```

### `packages/tools/src/emit/factory-source.ts::bareArrayItems`

```text
/**
 * The items a printed value stands for when it is a list envelope with
 * default options, directly or through a single-slot wrapper whose sole slot
 * is that list — the array the runtime builds the envelope from.
 */
```

### `packages/tools/src/emit/factory-source.ts::wrapSeatedConfig`

```text
/**
 * Text leaves inside a seated config belong to the group, not the parent: a
 * spliced or flattened-arm key and an element-seat object carry the child's
 * slot names. Wrap with the parent's slot map first so its own slots win,
 * then with each seat's kind for what the parent does not declare.
 */
```

#### body

```text
// A tuple seat carries the child's options bag as its first entry; one
// that restates the child's default says nothing the loose call needs.
```

#### body

```text
// A seated arm's config is the child's own: its keys are the child's
// slots, so the child's rules decide their loose spelling.
```

### `packages/tools/src/emit/factory-source.ts::PlacedArg.strict`

```text
/** The value as the strict surface spells it at the kind's sole slot. */
```

### `packages/tools/src/emit/factory-source.ts::PlacedArg.loose`

```text
/** The same value as the loose surface spells it there. */
```

### `packages/tools/src/emit/factory-source.ts::expandSlotKinds`

A slot's kinds as the loose surface sees them: supertypes expand to their subtypes and an alias kind to its content kinds, since an alias is never spelled at a slot — its content is.

### `packages/tools/src/emit/factory-source.ts::printingFactoryMap`

An alias kind's entry returns its argument unchanged: the printed source is the content, which the parent's builder wraps.

#### body

```text
// A hidden text kind has no factory on `ir` (the model's key for it
// names nothing emitted): it hands its text to the parent, whose
// slot prints it through the public text kind it declares.
```

#### body

```text
// The strict wrapper re-exposes its child's rest parameters; the loose
// one takes one input, so the spliced arguments ride as its array.
```

#### body

```text
// A registered slot outside this direct/forwarded value (some OTHER
// field of the kind — direct/forwarded classification skips
// registered slots) rides as a trailing options argument.
```

#### body

```text
// A registered slot rides as a trailing options argument outside
// the config object — `entry` is fully variadic, but this branch
// only read args[0] until now, silently dropping it.
```

### `packages/tools/src/emit/factory-source.ts::printingIrSurface`

```text
/**
 * The printing counterpart of a grammar's `ir` bindings: every kind's
 * `strict`, plus one entry per mount name its seats declare, printing
 * `ir.<parent>.<mount>.strict(…)`. Handing this to
 * `buildFactoryNodeFromReference` as the surface makes the printer take the
 * same seat projection the validators take, so the emitted spelling is the
 * one `ir-render-parse` builds rather than a second derivation of it.
 */
```

### `packages/tools/src/emit/factory-source.ts::absorbedKindsOf`

```text
/**
 * A hoisted child whose OWN surface is a rest-parameter one (`spread`, or a
 * separated list's `elements`) and that its parent takes POSITIONALLY is
 * absorbed: its arguments splice straight into the parent's call, because the
 * parent's own factory already offers those rest parameters. A parent with
 * named keys takes the same child as a tuple on its slot, which is the tuple
 * seat. Every other hoisted child prints its own call, and so does one that
 * seats children of its own: those arrive as the child's configs, which only
 * the child's own builder knows how to take.
 */
```

### `packages/tools/src/emit/factory-source.ts::variantFormsOf`

```text
/**
 * The variant form each child kind is declared under, keyed by node kind and
 * by its public name. `childKind` is keyed by parse kind, which drops a hidden
 * kind's leading underscore.
 */
```

### `packages/tools/src/emit/factory-source.ts::irPathResolver`

```text
/**
 * A variant of a flattened parent is spelled by codegen's published route
 * (`node-model.json5` `variantRoutes`, e.g. `ir.exportStatement.default.from`).
 * Any other hoisted compound has no flat `ir` binding — hoisting is what keeps
 * it out of the bundle — so its spelling is the variant form its parent
 * declares: `ir.<parent>.<form>`. The parent composes in turn while it is itself
 * hoisted, and the path stops at the first kind that owns a flat binding.
 * Being declared under a variant form does not settle this on its own: a kind
 * that is not hoisted carries both spellings, and its flat one is canonical.
 */
```

### `packages/tools/src/emit/factory-source.ts::seatFormTree`

```text
/**
 * Apply the seat key-move to every node of an already-materialized tree,
 * bottom-up so a child is seated before its parent reads the slot.
 */
```

### `packages/tools/src/emit/factory-source.ts::seatFormChild`

```text
/**
 * A read stores an arm's value under the child's own kind (`_delim_token_tree_paren`)
 * when the parent's slot carries no label. Move it to the slot the seat names
 * so `nodeToConfig` sees a declared slot and the seat projection applies.
 */
```

### `packages/tools/src/emit/factory-source.ts::EmitSurfaceOptions.surface`

```text
/** `strict` prints `.strict(...)` calls; `loose` prints the bundle calls with every coercion the loose contract admits. */
```

### `packages/tools/src/emit/factory-source.ts::EmitSurfaceOptions.nested`

```text
/** On the loose surface, whether a nested compound prints as its builder call or as a config object. */
```

### `packages/tools/src/emit/factory-source.ts::EmitSurfaceOptions.backend`

```text
/** The read backend; the native engine unless a caller has none to offer. */
```

### `packages/tools/src/emit/factory-source.ts::emitFactorySourceText`

#### body

```text
// Keyed by the model's own kind names: a slot names a hidden kind
// with its underscore, and a public spelling would collide with a
// visible kind of the same name (`_identifier` over `identifier`).
```
