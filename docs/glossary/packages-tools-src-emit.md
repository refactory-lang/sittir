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
stamps when none is given) and `hoistedKinds`. `nested` is the caller's
choice for a nested compound: its builder call, or a config object.

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

### `packages/tools/src/emit/factory-source.ts::loosenAt`

Applies the loose rules to what a slot holds once the strict wrapping has
run: a `multiple` slot per element, since the runtime resolves each element
on its own. Without loose facts, or at a slot the model does not declare,
the value passes unchanged.

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
can reach admits exactly one pattern kind. A config-shaped node with a flat
`ir` key prints as its config object under `nested: 'configs'`: keyless when
the slot has one branch kind, keyed `kind: TSKindId.<Member>` otherwise. A
node carrying trivia keeps its call, since only a call takes `$trivia`.

#### one element

A list envelope with default options prints as its bare element when it holds exactly one element that prints as a call or text, and as the array otherwise. An element that prints as an object or an array keeps the array, since an object at a list slot is one element's config and an array is the elements.

### `packages/tools/src/emit/factory-source.ts::solePatternKind`

The runtime's leaf registry carries no patterns: a bare string resolves to
the FIRST pattern kind among a slot's leaf kinds whatever the text. A slot
with exactly one pattern kind is therefore the only one where a bare
string builds the leaf the strict spelling names.

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
