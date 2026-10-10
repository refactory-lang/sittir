# Shared arena: one typed transport across the native boundary

**Status:** Draft for review. Written 2026-10-01; revised 2026-10-04 against master `106475358`
for the maintainer's read-side direction, then for the maintainer's rulings on its ten open choices
and the one they raised (**Rulings (2026-10-04)**, at the end). The rest follows from the direction,
the measurements below, or rulings already made.

## Direction (ruled by the maintainer, 2026-10-04)

- **The transport is the single typed projection, on the native side.** A grammar's transport
  structs are the shape a node is read into and the shape it is rendered from.
- **Codegen emits each transport struct from the node model with its parser mapping:** each
  slot's type states what the slot admits and how it stores it, and attributes state the rest,
  `#[slot(field = …)]` for a child routed by its field together with every other projection fact a
  type cannot state (§ Projection facts).
- **A proc macro expands the attributes mechanically** into the native reader (tree → transport)
  and the render side's wire. One source, the model; one derivation, the generated struct and its
  attributes. The expansion makes no decision of its own.
- **This reverses the client-side projection for reads.** The native reader stops handing the
  wrap parser-keyed untyped data; the JavaScript wrap shrinks to attaching members: accessors,
  `$with`, `$render`, `$trivia`, `$query`, `$engine`.
- **Reads stay lazy.**

The 2026-10-01 draft's read side, a whole-tree image written at parse and projected in
JavaScript, is withdrawn (§ Alternatives considered). Its render side, records read in place, is
kept: records are the wire in both directions (ruling 3).

## Problem

Measured on 2026-10-05 at `106475358`, with `69b821c18` in parentheses, run back to back on the
inputs of the 2026-10-01 draft (byte-identical copies); release build, Apple M4 Pro, Node 26.10,
medians. The timings recorded on 2026-10-01 at `69b821c18` do not reproduce at that commit (the
whole-tree read of the 24.8 KB file was 42.9 ms then and is 18.2 ms now), so every pair here was
measured in one sitting. Scripts and raw numbers: `docs/superpowers/probes/2026-10-01-shared-arena/`
(`transport/` for these pairs, `2026-10-01/` for the 2026-10-01 record).

| | rust, 24.8 KB | rust, 48.9 KB | typescript, 8.9 KB |
|---|---|---|---|
| nodes in a whole-tree read | 5 960 | 16 435 | 3 455 |
| tree-sitter parse | 1.05 ms | 3.11 ms | 0.68 ms |
| whole-tree read, native side | 18.2 ms (18.2) | 69.8 ms (70.3) | 8.28 ms (8.13) |
| its wire | 838 KB, 33.8× the source (780 KB) | 2.28 MB, 46.7× (2.11 MB) | 483 KB, 54.0× (451 KB) |
| `JSON.parse` of that wire | 2.31 ms (2.21) | 6.14 ms (5.76) | 1.23 ms (1.17) |
| lazy read and wrap, per node visited | 11.7 µs (13.6) | 13.6 µs (14.0) | 9.9 µs (11.4) |
| JavaScript heap held by the read data alone | 1 069 KB (1 028) | 2 706 KB (2 630) | 587 KB (568) |
| JavaScript heap per wrapped node, every node a full walk reaches kept | 2 508 B (3 311) | 2 193 B (2 950) | 2 190 B (3 059) |
| JavaScript heap held by a whole-tree parse, untouched | 7 118 KB (1 096) | 18 254 KB (2 801) | 4 005 KB (610) |
| render of the untouched root, read lazily | 29 µs (30) | 45 µs (47) | 9 µs (14) |
| render of the untouched root, read whole | 366 µs (365) | 990 µs (1 130) | 222 µs (310) |

The heap rows are measured at both commits by one script, with the population fixed: the read
data is the parsed whole-tree wire; the wrapped nodes are every node a full walk reaches, kept
alive, so whatever a commit caches or discards is counted the same way. Per wrapped node the heap
fell 24–28 % since 2026-10-01, when members were added to each node after it was built, one of them
a getter of its own; they are now written in its literal. The wrapped tree holds 7–8 times its read
data. A whole-tree parse holds 6.5 times what it held on 2026-10-01, for another reason: each wrap
now stores the children a read expanded already wrapped, so the parse holds every wrapper, where on
2026-10-01 a slot held its read data and each accessor call built its child's wrapper afresh,
keeping none. The 2026-10-01 draft's heap row (314, 295 and 261 B a node) counted that read data.

Rendering rebuilt nodes over each grammar's parity render fixtures, per slot value:

| | rust | typescript | python |
|---|---|---|---|
| projection in JavaScript | 332 ns (273) | 311 ns (254) | 320 ns (262) |
| native call | 523 ns (353) | 576 ns (393) | 532 ns (372) |

Five causes.

1. **A read re-derives the tree for every node.** The whole-tree read is 91 % in the native module,
   and of that 69 % is `ts_node_child_iterator_next` and 23 % `ts_node_child_with_descendant`: the
   reader takes children by index, which iterates from the first child on every call, and resolving
   a handle descends from the root. Reading the `function_item` nodes of the 24.8 KB file one level,
   through today's query, costs 38.5 µs a node for the native read and its JSON alone (26.4 µs in the
   48.9 KB file).
2. **The projection happens in JavaScript, per node, after the read.** The reader hands children
   over under their parser key, and the wrap routes them to model slots, normalizes arity, coerces
   keyword, flag and kind-enum storage, reclaims tokens from `$other`, rebuilds alias envelopes and
   spelled leaves, projects token interiors and maps trivia. In the query read above that is a
   further 10–19 µs a node.
3. **An untouched tree is proven untouched by walking it.** 95 % of the untouched whole-read render
   is the projection walk (`canFold`, `isUntouchedBelow`) that decides the root may cross as one
   coordinate.
4. **A rebuilt tree crosses as an object graph.** The projection builds a second object tree (35–39 %
   of the wall); the native side decodes it through per-property runtime calls. In the native call,
   V8 is 65 % and `napi_*` 11 % of the busy samples, so decoding is about three quarters of the call
   and nearly half of a rebuilt render.
5. **The transport crate pays for that marshaling at build time.** The napi `FromNapiValue` and
   `ToNapiValue` impls are 43.0 %, 45.1 %, 42.2 %, 44.2 % and 46.9 % of `transport.rs` for rust,
   typescript, python, scm and regex (94 326, 118 311, 61 765, 11 096 and 12 753 lines). The rust
   crate rebuilds in 48.4 s with its napi code and 17.6 s without it.

What the provenance work settled is not reopened: an untouched subtree renders as a slice of the
source the engine holds (`SlotValue::Coord`, `RenderSink::slice`), and every render function writes
through the one sink. This design changes how nodes reach each side, not how they render.

## Goal

- Reads stay lazy: one level unless a read asks for more, and a child past the depth read is a
  coordinate.
- A node is projected once, natively, into its kind's transport. The transport that is read is the
  transport that is rendered.
- The JavaScript wrap attaches members and decides nothing about storage.
- A parsed node crosses back to native as its coordinate, with no walk.
- Every projection decision is a fact codegen stamps as an attribute; the macro expands and decides
  nothing.
- Rendered bytes do not change.

## Design

### The transport declaration

Codegen emits, per kind, the transport struct it emits today, and per choice the transport enum
it emits today, with attributes for the facts the reader and the wire need that the types do not
state. Ids are the parser's numeric ids, emitted as constants under the render-module hash that
already ties a package to its native build, so the macro looks nothing up (ruling 10):

```rust
#[transport(kind = kind::FUNCTION_ITEM, words = 41)]
pub struct FunctionItemTransport {
    #[slot(field = field::VISIBILITY_MODIFIER, word = 1)]
    pub visibility_modifier: Option<SlotValue<VisibilityModifierTransport>>,
    #[slot(field = field::FUNCTION_MODIFIERS, word = 6)]
    pub function_modifiers: Option<SlotValue<FunctionModifiersTransport>>,
    #[slot(field = field::NAME, word = 11)]
    pub name: SlotValue<FunctionItemNameTransportSlot>,
    // … type_parameters, parameters, return_type, where_clause, body
}

#[transport(kind = kind::FUNCTION_MODIFIERS, words = 3)]
pub struct FunctionModifiersTransport {
    #[slot(field = field::MODIFIER, word = 1)]
    pub modifier: Vec<SlotValue<FunctionModifiersModifierTransportSlot>>,
}

#[transport(choice)]
pub enum FunctionModifiersModifierTransportSlot {
    #[kind(kind::EXTERN_MODIFIER)] ExternModifier(ExternModifierTransport),
    #[kind(kind::ASYNC_KEYWORD)] AsyncKeyword,
    #[kind(kind::DEFAULT_KEYWORD)] DefaultKeyword,
    #[kind(kind::CONST_KEYWORD)] ConstKeyword,
    #[kind(kind::UNSAFE_KEYWORD)] UnsafeKeyword,
}
```

- **The slot's type says what the slot admits and how it stores it,** once. A choice lists its
  kinds on its variants: a unit variant is a fixed literal, stored as its kind id; a variant with a
  transport is a node, read into that transport. A supertype, an enum kind and a slot's own choice
  are all choices; a choice is declared once for its content, whichever slots hold it. A slot that
  holds one kind has that kind's type, and a keyword's presence is a boolean, `Option<bool>`,
  rendered by the keyword kind's own render function.
- **Arity is the field's type:** `T`, `Option<T>`, `Vec<T>`; a list that must not be empty says so
  (`min = 1`). An empty list has one form, `[]`. A `repeat` and an `optional(repeat1)` read, build
  and store the same empty list, never an absent slot. No list slot is optional: its stored key and
  its accessor have no `?` and no `| undefined` on the list itself. A factory's input may omit a
  list, and the factory stores `[]`. The item type may still admit `undefined`, for a hole in an
  elided list: a hole is a position in the list, not an absent slot.
- **The attributes state only what the types cannot:** the field a slot routes by, the keyword a
  presence slot holds (`presence = kind::…`), the record's word offsets, a list's separator, a
  flank, a group seat, a kind's minimum depth, its layout tokens and its inner gaps, and the blank
  arm of a blank option's choice (`#[transport(blank)]`). The macro computes none of them.
- **Only a blank option has a blank arm.** An optional slot registered as a preference (the model's
  `hasBlankArm`; today the nine typescript `terminator` slots) chooses between a value and none.
  Its choice carries the none as a unit variant marked `#[transport(blank)]`: an absent child reads
  as that variant, which crosses as id 0. Every other optional slot reads an absent child as
  `None`. Codegen emits the attribute from `hasBlankArm` alone. A choice is declared once for its
  content and may be shared by several slots, so a choice shared by a blank option and a slot that
  is not one is a codegen error.
- **A kind constant names the grammar id unless it is marked `display`; a token names its public
  symbol.** The parser gives a node two ids: its grammar id (`grammar_id()`, the rule that parsed
  it) and its display id (`kind_id()`, the public symbol: the alias target at its site, or the
  symbol the parser folds a raw token into). Transports, routing and choice variants key on the
  grammar id, so a kind an attribute names is the grammar id, unmarked. The `display` flag marks
  the display id, as in `#[kind(kind::FIELD_IDENTIFIER, display)]`, and `display(kind::X)` claims
  one id by its display id alone. It is used only where the identity is the alias: an alias
  envelope's site, an anonymous token the parser shows only by its public symbol, and the query
  plans that the bindings rows and `is.*` compile to. Layout tokens, separators, presence keywords
  and a list's separator kind are tokens, and compare the public symbol. A raw symbol the parser
  folds into a named target is listed on that target by its own grammar id, `folded = [kind::X]` on
  a struct and `folded(kind::X)` on a variant, and a choice matches it after every exact claim. The macro
  picks the accessor from the flag, so the reader never decides at run time. A display union stays a
  name: a display id has no transport.
- **An unfielded child has exactly one slot.** In a kind's declaration, no two slots without a
  field admit the same kind, so the slot whose type admits an unfielded child's kind is one slot.
  Codegen checks this as it emits the declaration: two such slots are a codegen diagnostic naming
  the kind, both slots and the kind they share. The reader never picks between slots at run time.
- **A kind's minimum read depth** is on its `#[transport]`: `min_depth = 2` on a list owner, whose
  items arrive with it. Codegen derives it from the model, once per kind. A leaf the reader spells
  or projects (`text`, `interior`) is read inline at any depth and needs none.
- **A kind's layout tokens** are listed on its `#[transport]` (`layout = […]`): the anonymous tokens
  its rule writes and no slot stores. The reader skips them; a render from data writes them from
  the template, and an untouched node slices them from the source.
- The edge, gap and flank fields the render side stamps today stay as they are. Trivia is not a
  field of a transport or a record: it is in the trivia tables (§ Trivia).

### What the macro expands

From one declaration, three things:

- **The reader:** `ReadTransport::read(cursor, source, tree, depth) -> Self`. It walks the node's
  children once with a `TreeCursor` (first child, next sibling), never by index. Each child goes to
  the slot its field names, or, with no field, the one slot whose type admits its kind, and is
  stored as that type's variant for its kind: a fixed literal as its kind id, a node as its
  transport, and the keyword a presence slot names as `true`. Extras, and `ERROR` nodes as today,
  are trivia: the reader skips them, as it skips layout tokens, and the tree's trivia table holds
  them by gap (§ Trivia). A `MISSING` node routes as its kind.
- **Refusal of a child no route takes** (ruling 7). A model gap is a diagnostic, not data: the read
  fails with the node's kind, the child's kind and its row, and nothing is stored for the node.
  Parse errors are not model gaps: the parse reports `ERROR` and `MISSING` regions in `$errors`
  as today.
- **The kind dispatch:** `read_any(cursor, depth)`, a match on the kind id over the grammar's
  transports, for hydrating a coordinate whose kind is known only at run time.
- **The wire codec:** arena records (ruling 3), to JavaScript for reads and from JavaScript for
  renders. Until the record step lands, the expansion emits today's napi object form (ruling 6).

The render functions (the templates) stay emitted by codegen as today; they are not expanded from
attributes (ruling 9).

### Laziness

A read goes to a depth: `depth: number` replaces `ParseOptions.deep` (ruling 2). The default is 1,
one level; `Infinity` reads everything. Within the depth, a child with structure is read into its
transport in the same call; past it, the child is a coordinate. A leaf (a named node with no
children), a fixed literal, stored as its kind id, and a presence flag are stored inline at any
depth. A kind's `min_depth` deepens the read of that node, so a list owner's items arrive with
it. The depth decides only where coordinates start: the struct and its attributes are the same at
every depth, and a slot holds `SlotValue::Transport` or `SlotValue::Coord` by that alone.

- **An unread child is a coordinate:** its tree, its row, its span and its kind (ruling 1). This is
  `SlotValue::Coord` with a row in place of the handle. The render side already accepts it.
- **The row is tree-sitter's descendant index.** `TreeCursor::goto_descendant(row)` reaches the node;
  reading one `function_item` at its row costs 0.93–1.01 µs, the seek included.
- **Identity is the tree and the row.** The native node table, `HandleMint`, and the `$handle`,
  `$parentHandle`, `$treeHandle` and `$childIndex` forms go; one coordinate form replaces them. A row
  is stable for the life of its tree version.
- **Hydration is one native call:** the engine reads the coordinate's row with `read_any`, one level
  or the kind's `min_depth`, and the wrap attaches members to the result.
- **A child read within the depth gets its members on first access** (ruling 11). A read holds
  data until an accessor reaches a child; the accessor wraps the child then, and the parent keeps
  that wrapper, so a later call does not wrap it again. A whole-tree read with no accessor
  calls holds about its read data, not every node's members: today's wrap, which wraps each child
  with its parent, holds 7 118 KB for the 24.8 KB file where its read data is about 1 MB
  (§ Problem).

Measured on the probe, one `function_item` per call, crossing and member attachment included:
4.3–5.0 µs a node depending on the wire, against 10–14 µs a visited node for today's lazy read.

### Projection facts as attributes

Each fact the read projects today, where it is decided, and the type or attribute that carries it.
Each is derived once, in codegen; a fact a type states is not repeated in an attribute.

| fact | decided today | carried by |
|---|---|---|
| **Routing** a child to its slot | the native reader keys a child by its field, else its kind name (`child_slot`); the wrap re-keys with `modelSlots` and the `_ROUTES_<Kind>` tables `slotRoutesOf` derives from `wireRoutesOf` (`emitters/shared.ts`) | `field`; with no field, the slot whose type admits the child's kind. The types' kinds and the query routes are `wireRoutesOf`'s one derivation |
| **Arity and requiredness** | the wrap's `normalizeSingularWrapSlot` and `normalizeRepeatedWrapSlot` | the field's type; `min` |
| **Keyword presence** | the wrap's `coerceBooleanKeywordStorage` | the type, `Option<bool>`, and `presence = kind::…` naming the keyword |
| **Flag sets** | the wrap's `coerceBitflagStorage` | the type: a `Vec` of the flags' choice. No grammar has a flag set today |
| **Kind-enum storage** | the wrap's `projectKindEnumStorage` and `projectMixedEnumStorage`, with text-to-id and alternate-id tables and the kinds read by their spelled text | the type: a choice whose unit variants are the kinds stored as ids, beside the node variants where the slot also holds nodes. An enum kind whose own node reads as the member its spelling tokens display says so once, on its own choice (`#[transport(kind = …, spelled)]`): every token must display the one member id, so a node is never read as the member its first token is. An alternate id is stated once, on the variant it folds into |
| **Scalar storage for trivia** | `ReadModel::stores_scalar`, emitted per grammar in `kind_ids.rs` (`emitters/kind-id-rust.ts`) | none of its own: a child is scalar exactly when its slot stores it as a unit variant or a presence flag. The table and the trait method go |
| **`$other`** | the reader puts anonymous unfielded children there; the wrap reclaims terminals with `readTerminalFromOther` and spellings with `_spellingTokens` | routed to the slot whose type admits the token; a layout token is skipped; any other child is refused (ruling 7) |
| **Text leaves** | the reader's `read_leaf` captures `$text`; the wrap's `_isReadTextLeaf` and the `_spelled…` helpers tile anonymous tokens into a leaf's text | `#[transport(text)]`, which also covers a leaf spelled by its tokens: the text the leaf spans when its tokens tile it, else its fixed text (`text = "…"`) |
| **Token interiors** | the wrap's `_projectLexed` with `projectInterior` and `TOKEN_INTERIORS` (`emitters/consts.ts`) | `#[transport(interior = …)]` |
| **Alias envelopes** | the reader stamps `$displayType`; the wrap's `_aliasEnvelope` with `_ALIAS_ENVELOPES` and `_HIDDEN_KINDS` re-wraps | `#[transport(envelope, content = …)]` on the envelope kind, whose kind is its display id (`display`) |
| **Transparent supertypes** | the wrap's `SUPERTYPE_MEMBERS`, `_filterWrapChildrenByKind`, `_firstKindKeyedWrapChild` | the slot's type: the supertype's choice, whose variants list its members once |
| **Blank options** | the wrap's `blankFromRead` stores the blank id (0) for an absent slot the model marks `hasBlankArm`; the slot's per-slot decoder admits id 0 | `#[transport(blank)]` on the blank variant of the choice a blank option holds; any other optional slot reads absent as `None` |
| **Delimiters and layout** | the wrap's `dropWireDelimiters`, `_hasSeparatorFlank` and `listOption` | `layout` on the kind; `separator` and `flank` on the slot |
| **List owners** | `_LIST_OWNER_KINDS`, `listItems`, `ownerView`, `storedElements` | `#[transport(list, item = …)]` |
| **Read depth per kind** | the wrap's `hydrateSelf` reads a `_LIST_OWNER_KINDS` member two levels deep | `min_depth` on the kind |
| **Group seats** | `seatWith`, `groupField` | `group` on the slot |
| **Trivia ownership** | the reader's `node_trivia` with the placement rule; `ReadModel::inner_gap_key` (`kind_ids.rs`); the wrap's `_wrapTrivia` and `mapTriviaEntries` | no attribute: the tree's trivia table, keyed by gap, with owners derived by tree-sitter's convention for extras (§ Trivia); `gap(n) = slot` on the kind names an inner gap for `$trivia.inner`. The second trait method goes |
| **The render projection** | `toTransportData` (fold, trivia view, detach) and the generated `FromNapiValue` decode | the wire codec; folding by coordinate (§ Render) |
| **Query routes** | `{ fields, kinds }` plans compiled in JavaScript from the `querySlots` table `wireRoutesOf` derives | unchanged, from the same derivation (ruling 8) |

The native reader stays the only place the tree is walked, and `sittir-core` stays free of any
grammar: it holds the cursor, coordinate and sink machinery, and every grammar fact reaches native
code through a generated type or attribute.

### The wire

What crosses the boundary in each direction. The probe expanded three forms from one declaration;
measured on it (rust `function_item`, eight slots; the 24.8 KB file, then the 48.9 KB file):

| | napi objects | JSON | arena records |
|---|---|---|---|
| read, one node per call, crossing + members | 4.5 / 4.3 µs | 4.6 / 4.6 µs | 4.8 / 5.0 µs |
| read, every match in one call, crossing + members | 9.6 / 10.4 µs | 9.5 / 10.3 µs | 9.2 / 10.1 µs |
| render direction, native decode per node | 1 651 / 1 403 ns | 958 / 832 ns | 52 / 54 ns |
| what JavaScript writes before a render | nothing | `JSON.stringify`, 250 / 178 ns | a parsed node's record exists; a built node is encoded, 45–56 ns a slot value (2026-10-01 probe) |
| retained heap per node, members attached to the node | 4 949 B | 4 979 B | 6 871 B |
| compile, 395 kinds with the reader | 8.4 s | 6.6 s | 3.6 s |

(The batch rows include the whole-tree walk, 6–7 µs a match. Every form carries the same members,
an accessor and a `$with` setter per slot, `$trivia`, `$render`, `$query` and `$engine`, and the
probe checks every slot, the trivia and the member set of every node before it times anything. A
node's member closures, not its data, decide its heap here, and how V8 builds the literal moves it.
Today's `#[napi(object)]` derive alone compiles the same 395 kinds in 3.8 s. Refusing a child no
route takes costs each expansion of the reader 1.2–1.3 s of it.)

Today's engine holds 17.1 KB a `function_item` read one level in the 24.8 KB file and 9.9 KB in the
48.9 KB file: its read, 4.7 and 2.7 KB, and wrappers with members for the node and, twice over, for
each doc comment it owns, as the comment and as its variant form. The probe leaves those comments
out. Solving the two files together gives about 4.1 KB for the node's own wrapper and 2.1 KB for
each comment wrapper.

- **napi objects** are today's wire: every property crosses through a runtime call in each
  direction. They keep `transport.rs`'s napi impls.
- **JSON** costs a serialization on one side and a parse on the other; it reads no faster than
  objects and decodes 15–18 times slower than records.
- **Arena records** are the 2026-10-01 draft's render side, now in both directions: fixed-width
  `u32` records with the slot words at the offsets the attributes name, and a UTF-8 text buffer.
  JavaScript reads a record in place through accessors; native reads records in place for render.
  JavaScript needs the layout too: codegen emits the JavaScript readers from the same declaration it
  writes the attributes from, so the layout has one derivation and the macro computes no offset.

**Ruled: arena records** (ruling 3). They decode for a render 15–32 times faster than the other
wires and compile smallest, and they drop the napi marshaling from every `transport.rs`. With the
same members attached they do not read faster or hold less: a batch reads 0.2–0.4 µs a node faster,
one node per call reads 0.2–0.7 µs slower, and a node over a record holds about 1.9 KB more. They
land as their own step after the typed reader (ruling 6), and only with the object wire's numbers
re-taken in the engine beside theirs.

**Gate on the record step.** Its plan lands only if records match or beat napi objects on read
time, one node per call and every match in one call, and on retained heap per node, as well as
beating them on render decode. The 1.9 KB a node holds over a record is not its member closures
as such: every form carries the same ones, and the views as first committed, with an empty `$with`
and no `$trivia`, held 3 702 B against the objects' 4 949 B. How V8 builds the view's literal moves
it, and adding member groups one at a time does not raise it monotonically (the transport probes'
README), so the record step attacks the view's construction first.

### What the JavaScript wrap keeps

A wrap function attaches members and nothing else: the accessors (each reads its slot and hydrates
a coordinate through the engine), `$with`, `$render`, `$trivia`, `$query` and `$engine`, written in
the node's literal as the standing rulings require. `modelSlots`, the `normalize…` and `coerce…`
helpers, the enum projections, `readTerminalFromOther`, `_aliasEnvelope`, the spelling helpers,
`_projectLexed`, `_wrapTrivia`, `dropWireDelimiters` and stub hydration (`hydrateSelf`,
`hydrateChild`) go from every wrap.

A parsed node's literal holds a reference to its record, the buffer and offset, instead of copies
of its slots (ruling 4); until the record step lands, it holds the transport's fields as own keys.
A built node holds its fields, encoded into records at each render (ruling 5).

A wrapped node's heap is mostly its wrapper, not its read data: the wrapped tree holds 7–8 times
its read data today, 2.2–2.5 KB a wrapped node (§ Problem), and a `function_item`'s own wrapper is
about 4.1 KB beyond its read (§ The wire). The probe's members over its transport hold 6.9 KB a
`function_item` over a record and 4.9 KB over fields, read data included. The members stay as they
are, so what this design changes in the heap is the data and when members are made: today a node's
members, and those of each comment it owns, are made when the node is read; here they are made when
an accessor first reaches the node (ruling 11).

### Render

- **A parsed node crosses as its coordinate, with no walk.** It references its record (ruling 4) and
  has no storage to write; rebuilding produces a draft, a different node, so an untouched parsed
  node never has a rebuilt descendant. The walk that is 95 % of today's untouched whole-read
  render goes with the record step. Until then a parsed node holds fields, and the walk stays
  until no write touches a parsed node's storage, which the trivia table brings (§ Trivia).
- **A built node or a draft** crosses as its content: its fields encoded into records at each render
  (ruling 5); until the record step, as today's object graph.
- The native side reads, prepares and renders as today. The prepare walk stamps a private copy, never
  memory JavaScript can see.

### Trivia

Trivia is in native tables keyed by gap, never in a transport or a record. The model is
`2026-10-09-trivia-table-design.md`'s: an entry's address is the gap it sits in, between two
tokens; its owner is the smallest node containing tokens on both sides, tree-sitter's convention
for extras, derived and never stored; an entry is a value; and `$trivia` is a view over the table.

- **A parsed tree's table** is on the native `ParsedTree`. One token walk builds it from the
  source and the tree, and it holds every write to the tree's trivia, each marking its gap edited.
  It lands in step 3, ahead of the record wire, which it does not need; the arena-tables plan
  (`docs/superpowers/plans/2026-10-10-arena-tables.md`) holds the order.
- **A built node's table** sits beside its record in arena storage and holds the gaps between its
  children; its edges belong to its holder. It lands with the record step (ruling 6.3), when
  built nodes get arena storage. Until then a built node keeps its trivia on the node, and
  `$trivia` reads the same on parsed and built nodes.
- **Records hold no trivia.** The record layout has no trivia words, and prepare resolves no trivia
  joins beside the records.
- **The render reads trivia from the tables only.** A node with no edited gap between its first
  and last token renders as its source bytes, and its owner prints the gaps around them. A node
  with an edited gap renders from its children, and each gap between them is printed from the
  table by its owner. Nothing about trivia crosses with a transport.

### Build cost

- **Today:** `transport.rs` is 0.5–6.3 MB a grammar; the rust crate rebuilds in 48.4 s (1.95 GB peak)
  and in 17.6 s (857 MB) without its napi code.
- **The expansion:** for rust's shape (395 kinds, 696 slots), the reader and the record codec compile
  in 3.6 s, about what today's `#[napi(object)]` derive alone takes (3.8 s). The first step, the
  reader with napi objects as the wire, compiles in 8.4 s: compile time rises until the record step.
- At the record step, a grammar's `transport.rs` loses the 42–47 % of its lines that are napi
  impls, and the derive. The crate's compile time and binary size after each step are measured, not
  assumed (§ Verification).

### Rulings of the 2026-10-01 draft, revisited

Rulings made since — no class or prototype for nodes or views, closures in the node's literal,
members in the builder's literal — changed all three, and the maintainer ruled each again.

1. **Parsed nodes as views.** The per-kind prototype is ruled out. A parsed node's literal holds a
   reference to its record, which makes "a parsed node is its coordinate" true by construction
   (ruling 4).
2. **Built-node storage.** Builders write their members in the literal and need no record to be
   cheap, so the shared-memory chunks lose the construction argument they had. A built node keeps
   its fields, encoded at each render, 45–56 ns a slot value (ruling 5).
3. **Which lands first.** The image is withdrawn. The typed reader lands first, the record wire
   after it, and the relative-coordinates work between them (ruling 6).

## What is removed

**`sittir-core`**

- `read_untyped_node.rs`: `UntypedNode` reading, `ReadDepth`, `HandleMint`, `ReadModel`, the stub and
  leaf readers and the per-node trivia read. Its placement rule goes too: the reader skips extras,
  and the trivia table holds them (§ Trivia).
- `UntypedNode`, `FieldValue`, `NodeHandle` and their serde; the node table and handle resolution
  in `engine.rs`; the JSON returns of `parse_and_read`, `read_root` and `read_untyped_node`.
- With the parsed trivia table: `TriviaEntry`'s `same_line` and `tokens_between`, the line-gap
  query (`line_gaps`, `line_gaps_of`), and the outside trivia a folded coordinate carries in
  `SlotValue::Coord`.
- At the record step: the napi decode of `SlotValue`, and the trivia transports (`TransportTrivia`,
  `TriviaEntry`) with built nodes' trivia on the node, which the built nodes' tables replace.

**Generated, per grammar**

- `stores_scalar` and `inner_gap_key` in `kind_ids.rs`, and the `ReadModel` impl in `lib.rs`.
- At the record step: the `#[napi(object)]` attribute and every `FromNapiValue` and `ToNapiValue`
  impl in `transport.rs`.
- In `wrap.ts`: every projection helper listed under § What the JavaScript wrap keeps, the
  `_ROUTES_<Kind>` tables, `_LIST_OWNER_KINDS`, and stub hydration.

**`@sittir/common`**

- `modelSlots`, the storage coercions and the stub machinery (`isStub`, `hydrateStub`) in `utils.ts`
  and `readUntypedNode.ts`.
- `transport-data.ts`, at the record step: the fold walk (`canFold`, `isUntouchedBelow`,
  `foldToCoordinate`) and `toTransportData`, replaced by the encoder for built nodes.
- With the parsed trivia table: trivia on parsed wrappers (`$_layout.trivia`, the written-sides map,
  the composed-trivia cache), the line-gap composition (`lineGapsOf`), the edited-index set and the
  refusal of a write through a query.

**Engine API types**

- `ParseOptions.deep` in `packages/types/src/engine-api.ts`, replaced by `depth: number` (ruling 2).
- `lineGapsOf` and its address and result types, with the parsed trivia table.

**Codegen**

- `emitters/wrap.ts` emits members only. `renderTransportDataStruct` (`emitters/render-module.ts`)
  prints the attributes from the transport projection (`emitters/transport-projection.ts`), with the
  `#[napi(object)]` attribute gone at the record step. `emitters/kind-id-rust.ts` stops emitting the
  two read tables. `wireRoutesOf` stays the one route derivation.

## Relationship to other designs

- **Client-side projection.** Reversed for reads by the direction above. The render side never
  had it.
- **Node query API.** Its `{ fields, kinds }` plans are compiled from the same routes and need no
  change. Its native walk and plan check take children by index today (`node.child(i)`); they move
  to the cursor with the reader, and the stubs the walk returns become coordinates with rows.
- **Edit lifecycle.** A `$with` or edit result is a draft, a built node; `$commit()` produces a new
  tree version whose rows are its own. Immutable parsed nodes are what lets a parsed node fold by
  coordinate.
- **Relative coordinates.** Placed between the typed reader and the record wire (ruling 6), and
  designed against the tree and index in `2026-10-06-relative-coordinates-design.md`: relative points
  exist only in snapshot data, identity is the tree and the index through one registry per tree,
  and an edited-index set replaces the fold walk. That design states what the record layout must
  allow. The trivia table supersedes its trivia ownership (a comment's owner recording which side
  of a token it sits on, and prepare's trivia joins), and the table's edited gaps replace the
  edited-index set.
- **Trivia table.** `2026-10-09-trivia-table-design.md`: trivia in native tables keyed by gap.
  § Trivia says how the tables sit in this design and when each lands.
- **Source provenance.** Unchanged in substance: provenance is a coordinate, an edit detaches it.
  The coordinate's handle becomes a row.
- **Spacing writer and render options.** Unchanged: a source slice writes through the same writer,
  and style whitespace is a site's resolved arm.
- **Engine API.** One option changes: `ParseOptions.depth: number` replaces `deep` (ruling 2).
  `parse` returns the root's wrapped node. A child the model has no route for fails the read that
  meets it, at parse or at hydration, naming the kind, the child and its row (ruling 7).

## Verification

1. **Rendered bytes.** Every render fixture, dogfood render and byte-exact read case produces the
   bytes it produces today, in all five grammars.
2. **Validation rows** are identical across the five grammars.
3. **Read parity.** For every corpus node, the typed read with members attached exposes the same
   slots, values and kinds as today's read and wrap.
4. **Depth.** A read returns the levels its depth asks for, deepened by a kind's `min_depth`, with
   the same struct at every depth; a child past it is a coordinate until an accessor reaches it, and
   reaching it is one native call.
5. **Members on first access.** A whole-tree read with no accessor calls retains about its read
   data, measured with the probes' `transport/measure-heap.mts` (its untouched whole-tree
   population): the class of the 1 096 KB the 2026-10-01 commit held for the 24.8 KB file, not
   today's 7 118 KB.
6. **Identity.** Two reads of one node give the same row; a coordinate naming a tree the engine does
   not hold is refused with the tree named.
7. **Unrouted children.** No corpus read in the five grammars refuses a child; a read against a
   model with one route removed is refused, naming the kind, the child and its row. A model in
   which two unfielded slots of one kind admit the same kind fails codegen with the diagnostic,
   and no grammar's model does.
8. **Trivia ownership.** Every corpus extra is in its tree's trivia table at its gap, and the gap's
   owner is the node tree-sitter makes the extra's parent, in all five grammars.
9. **No grammar in `sittir-core`.** No grammar fact appears in `sittir-core`; every one reaches
   native code through a generated attribute, and the macro's expansion is a pure function of the
   declaration.
10. **Malformed wire,** at the record step. Arbitrary words in a record buffer are refused or
    rendered; none reads outside the buffer or aborts the process.
11. **Nothing leaks from a render.** Rendering one node twice with different options gives each
    render its own result.
12. **Build.** Each grammar crate's compile time, peak memory and binary size, and the lines of each
    `transport.rs`, before and after each step, with the same commands.
13. **Type-check time** does not regress beyond noise.
14. **Measurements, recorded and not asserted:** the tables in this document, re-taken at each step
    with the same files, commands and populations; the stage breakdown becomes a `sittir tool`.
15. **The first step is render-neutral.** With the typed reader on today's object wire, render input
    still crosses as napi objects, so rebuilt render's cost per slot value is unchanged within noise,
    measured back to back with `measure-rebuilt.mts` before and after. The macro's napi codec replaces
    the napi derive's, so this is measured, not assumed.
16. Full unit suite.

## Feasibility probe

A proc macro (`slot-derive`) and a napi addon in
`docs/superpowers/probes/2026-10-01-shared-arena/transport/proto/`. They bound the design and are
not its implementation. The addon declares rust `function_item` (as `FunctionItemTransport` holds
its eight slots) and `function_modifiers` through the macro, and reads them with sittir's generated
parser. The macro expands the declaration into the cursor reader (fields
and kinds routed, keyword tokens stored as kind ids, leaves inline, children with structure as
coordinates, layout tokens skipped and any other child refused) and into all three wires.

| | 24.8 KB file, 37 nodes | 48.9 KB file, 99 nodes |
|---|---|---|
| native typed read, per node, beyond the walk | ≈ 260 ns | ≈ 300 ns |
| read one node at its row | 0.93 µs | 1.01 µs |
| today's one-level read and JSON of the same node | 38.5 µs | 26.4 µs |
| today's wrap and query plumbing, per node | 18.7 µs | 10.1 µs |

The probe leaves out trivia placement (it records only extras among a node's own children), alias
envelopes, token interiors, list owners, group seats and per-kind typed leaf content. Today's read of
a `function_item` also reads the comments the node owns and wraps each twice; its times and heap
include them and the probe's do not (§ The wire).

## Alternatives considered

- **The tree image** (the 2026-10-01 read side): the whole tree written once at parse into a buffer
  JavaScript projects. Withdrawn: it is eager where reads must stay lazy, and it puts the projection
  in JavaScript, which the direction moves native. Its identity, the tree and the row, is kept.
- **A derive macro on the transport structs**, which the 2026-10-01 draft rejected as a second
  derivation of the layout. The objection does not hold when codegen states every decision,
  offsets included, as attributes: the macro computes nothing, and codegen emits the JavaScript side
  of the layout from the same declaration. One derivation, one mechanical expansion.
- **Per-kind native readers written by hand**, or emitted as Rust code by codegen. Emitting the
  reader directly would work, but it would put a second, larger body of generated Rust beside the
  structs. The attributes keep the facts on the struct they describe, and the expansion is
  checked by the compiler against the struct's types.
- **Keeping the projection in JavaScript and making only the native read faster** (a cursor walk in
  today's reader). It would remove most of cause 1, but leave cause 2 (the per-node JavaScript
  projection), cause 3 and the JSON wire.
- **JSON or napi objects as the wire.** Measured above.
- **Lazy slots holding tagged tree-sitter handles,** expanded on first access in native code.
  Unneeded: a coordinate with a row is the same thing, and it is already the render side's form.

## Out of scope

- What a factory does before it stores a node: coercing loose input and running the leaf guards.
- The rendered string's own crossing.
- Per-call and engine option objects, which still cross as objects.
- Updating a tree's rows in place after an edit; a commit makes a new version.
- Other backends and worker threads.

## Rulings (2026-10-04)

Made by the maintainer on the ten choices this draft left open (1–10) and on the one those rulings
raised (11).

1. **The unread child's coordinate is the tree and the row** (§ Laziness).
2. **`depth: number` replaces `ParseOptions.deep`.** The default is 1, so reads stay one level and
   lazy; `Infinity` reads everything; past the depth a child is the tree-and-row coordinate. A
   kind's minimum depth (a list owner brings its items) is a fact codegen stamps and the reader
   applies. The depth decides only where coordinates start, never the struct or its attributes
   (§ Laziness).
3. **The wire is arena records,** landing only past the gate on the record step (§ The wire).
4. **A parsed node's storage is a reference to its record** (§ What the JavaScript wrap keeps,
   § Render).
5. **A built node's storage is fields on the object, encoded at render** (§ What the JavaScript wrap
   keeps, § Render).
   Superseded on 2026-10-06: arena storage holds built nodes too, written eagerly and read and
   written by their members directly, and the object encoder is retired
   (`2026-10-06-relative-coordinates-design.md`, § The record wire).
6. **The typed reader lands first, on today's object wire; the record wire is a separate, measured
   step.** Where the relative-coordinates work falls was left to this draft; placed here and
   accepted in review:
   1. **The typed reader**, emitting today's napi objects: the cursor reader, tree-and-row
      coordinates, `depth`, refusal of unrouted children, and the wrap reduced to members. Handles
      go, which settles a source-backed node's coordinate.
   2. **Relative coordinates**, re-based on rows and narrowed to what rows leave (§ Relationship to
      other designs). This settles a detached node's coordinate.
   3. **The record wire**, laid out once against both forms: records in both directions, parsed
      nodes over their records with no fold walk, built nodes encoded at render, and the napi impls
      gone. It lands with the object wire's numbers re-taken beside its own, and only past the
      gate on the record step (§ The wire).
      Extended on 2026-10-09 (the maintainer): built nodes' trivia tables land in this step,
      beside their records (§ Trivia).
      Extended on 2026-10-10 (the maintainer): the parsed tree's table lands in this step too, ahead
      of the record wire. The typed reader's feature carries steps 1 and 2, and step 3 with both
      tables is a feature of its own.

   Relative coordinates come after the typed reader so that they are designed against rows, not
   the handles the reader removes, and before the record wire so that the record layout, which
   holds a coordinate and a span, is fixed once.
7. **A child no route takes is refused at read time,** with the kind and the child named: a model
   gap is a diagnostic, not silent data (§ What the macro expands).
8. **Query plans are unchanged:** `where` still compiles to parser terms in JavaScript
   (§ Projection facts as attributes).
9. **The render functions stay emitted by codegen** (§ What the macro expands).
10. **Attribute ids are the parser's numeric ids, as generated constants** (§ The transport
    declaration).
11. **A child read within the depth gets its members on first access,** not with its parent. A deep
    read holds data until an accessor reaches a child, which wraps it then, and the parent keeps that
    wrapper (§ Laziness).

## Appendix A. Attributed declarations

Three rust kinds as codegen would emit them from master's model (`f5ee2d734`, the typed transports),
with every fact the read needs that a type cannot state as an attribute: `function_item`; the list
owner `parameters` with its list kind `parameters_elements`; and `binary_expression`, whose slots
store kind ids. Ids are generated constants: `kind::` from `parser.c`'s symbol table as today, and
`field::` from its field table the same way. Word offsets follow the record layout the probe
measured: one header word, five words a singular slot, two a list. Each declaration is followed by
what its types and attributes replace today.

### A.1 `function_item`

```rust
#[transport(kind = kind::FUNCTION_ITEM, words = 41, layout = [kind::FN_KEYWORD, kind::DASH_GT])]
pub struct FunctionItemTransport {
    pub layout: Option<TransportLayout>,
    #[slot(field = field::VISIBILITY_MODIFIER, word = 1)]
    pub visibility_modifier: Option<SlotValue<VisibilityModifierTransport>>,
    #[slot(field = field::FUNCTION_MODIFIERS, word = 6)]
    pub function_modifiers: Option<SlotValue<FunctionModifiersTransport>>,
    #[slot(field = field::NAME, word = 11)]
    pub name: SlotValue<FunctionItemNameTransportSlot>,
    #[slot(field = field::TYPE_PARAMETERS, word = 16)]
    pub type_parameters: Option<SlotValue<TypeParametersTransport>>,
    #[slot(field = field::PARAMETERS, word = 21)]
    pub parameters: SlotValue<ParametersTransport>,
    #[slot(field = field::RETURN_TYPE, word = 26)]
    pub return_type: Option<SlotValue<TypeTransport>>,
    #[slot(field = field::WHERE_CLAUSE, word = 31)]
    pub where_clause: Option<SlotValue<WhereClauseTransport>>,
    #[slot(field = field::BODY, word = 36)]
    pub body: SlotValue<BlockTransport>,
}

#[transport(choice)]
pub enum TypeTransport {
    #[kind(kind::ABSTRACT_TYPE)] AbstractType(AbstractTypeTransport),
    // … the `_type` supertype's other members
    #[kind(kind::NEVER_TYPE)] NeverType,
    #[kind(kind::_PRIMITIVE_TYPE)] PrimitiveType(PrimitiveTypeEnum),
}

#[transport(kind = kind::_PRIMITIVE_TYPE, spelled)]
pub enum PrimitiveTypeEnum {
    #[kind(kind::U8_KEYWORD)] U8,
    // … `i8` through `char`, each a unit variant
}
```

- **Routing:** every slot routes by its field (the `querySlots` row for kind 208, and
  `wrapFunctionItem`'s `modelSlots` list). No child needs re-keying, so there is no
  `_ROUTES_FunctionItem` table today either.
- **Arity:** `name`, `parameters` and `body` are required (`normalizeSingularWrapSlot(…, true, …)`)
  and the rest optional; the field types carry it.
- **Storage:** `return_type`'s type is the `_type` supertype's choice. `!` is its unit variant
  `NeverType`, stored as its kind id, and a primitive keyword is `PrimitiveType(PrimitiveTypeEnum)`,
  the enum kind whose choice says once that the reader reads it as the member its tokens display; any
  other type is a node. Today that is `projectMixedEnumStorage` with an 18-entry text table and
  `[341]` as the kinds read by their spelled text, plus `stores_scalar`'s arm `(208, "return_type")`.
- **Layout:** `fn` and `->` are the template's own tokens (`render-bodies.json`). The reader skips
  them and refuses any other anonymous child.
- **Depth and trivia:** no minimum depth, and no inner gaps. The doc comments that lead the node lie
  in the gap before its first token, which its parent owns (§ Trivia); `layout` holds no trivia.
- `FunctionItemNameTransportSlot` (identifier or metavariable) and `TypeTransport` (the `_type`
  supertype) are the choices each slot admits, as codegen types them today. A supertype's members
  are its choice's variants, listed once.

### A.2 `parameters` and `parameters_elements`

```rust
#[transport(kind = kind::PARAMETERS, words = 6, min_depth = 2,
            layout = [kind::LPAREN, kind::RPAREN], gap(1) = elements)]
pub struct ParametersTransport {
    pub layout: Option<TransportLayout>,
    #[slot(field = field::ELEMENTS, word = 1)]
    pub elements: Option<SlotValue<ParametersElementsTransport>>,
}

#[transport(kind = kind::PARAMETERS_ELEMENTS, list, item = item, words = 3)]
pub struct ParametersElementsTransport {
    pub layout: Option<TransportLayout>,
    #[slot(field = field::ITEM, separator = kind::COMMA, word = 1)]
    pub item: Vec<SlotValue<AttributedParameterTransport>>,
    // delimiter, item_separator_space_before, item_separator_space_after: render-option fields the
    // render side stamps from their site, as today
}
```

- **`min_depth = 2`:** today `_LIST_OWNER_KINDS` holds `Parameters`, and `hydrateSelf` reads it two
  levels deep, so the list and its items arrive with the owner.
- **`gap(1) = elements`:** the gap after the first token, `(`, which `parameters` owns, is the one
  `$trivia.inner` names `elements` (a comment inside `()`). Today that is `inner_gap_key`'s arm
  `(230, 1)` natively and `INNER_GAPS.parameters` in JavaScript.
- **`list, item = item`:** `parameters_elements` is the list kind enrich mints (kind 349, so the
  parser issues it). Its items route by the field `item` (the `querySlots` row for kind 349), and
  `separator` names the `,` between them, which the reader skips and the render writes.
- **Layout:** `(` and `)`.

### A.3 `binary_expression`

```rust
#[transport(kind = kind::BINARY_EXPRESSION, words = 16)]
pub struct BinaryExpressionTransport {
    pub layout: Option<TransportLayout>,
    #[slot(field = field::LEFT, word = 1)]
    pub left: SlotValue<Box<ExpressionTransport>>,
    #[slot(field = field::OPERATOR, word = 6)]
    pub operator: SlotValue<BinaryExpressionOperatorTransportSlot>,
    #[slot(field = field::RIGHT, word = 11)]
    pub right: SlotValue<Box<ExpressionTransport>>,
}

#[transport(choice)]
pub enum BinaryExpressionOperatorTransportSlot {
    #[kind(kind::AMP_AMP)] AmpAmp,
    #[kind(kind::PIPE_PIPE)] PipePipe,
    // … the other sixteen operators, each a unit variant
}

#[transport(kind = kind::BOOLEAN_LITERAL, spelled)]
pub enum BooleanLiteralEnum {
    #[kind(kind::TRUE_KEYWORD)] True,
    #[kind(kind::FALSE_KEYWORD)] False,
}
```

- **`operator`:** its type is the slot's own choice of the eighteen operator tokens, each a unit
  variant stored as its kind id. Today that is `projectKindEnumStorage` with an 18-entry text table,
  plus `stores_scalar`'s arm `(270, "operator")`.
- **`left` and `right`:** their type is the `_expression` supertype's choice. It holds
  `boolean_literal` as `BooleanLiteral(BooleanLiteralEnum)`, read as the member its token displays, and
  `self` as the unit variant `Self_`; any other expression is a node. Today that is
  `projectMixedEnumStorage` with `{ true, false, self }` and `[336]`, and `stores_scalar`'s arms
  `(270, "left")` and `(270, "right")`.
- No layout tokens: every token of the template is a slot.

### A.4 The other facts, each on a rust kind

| type or attribute | kind and slot | today |
| --- | --- | --- |
| a slot with no field, routed to the one slot whose type admits the child's kind | `where_clause.where_predicates` | the `querySlots` row for kind 211: kind `where_predicates`, no field |
| `Option<bool>`, with `presence = kind::…` | `let_declaration.mutable`, the `mut` token (`kind::MUTABLE_SPECIFIER`) | `coerceBooleanKeywordStorage` (22 sites in rust) |
| a `Vec` of the flags' choice | none: no grammar has a bitflag field today | `coerceBitflagStorage`, no call sites |
| `interior = …` | `integer_literal_decimal`: `content` and `suffix` | `TOKEN_INTERIORS` (40 kinds), read by `_projectLexed` (15 sites) |
| `text` | `identifier` | `read_leaf`'s `$text`, and `_isReadTextLeaf` |
| `envelope, content = …`, with `display`; `wraps_hidden` when the content is a supertype | `field_identifier`, `shorthand_field_identifier` and `type_identifier` over `identifier`; python `as_pattern_target` over a hidden supertype | `_ALIAS_ENVELOPES` = {465, 467, 468}, and `_aliasEnvelope` |
| `separator`, `flank` | `closure_parameters` | `dropWireDelimiters` (3 sites in rust) |
| `group` | `match_arm_with_comma.pattern`, a pattern and its guard | `seatWith`, called from `$with`, which stays a member; the read needs only the slot's `group` |

## Appendix B. Generated tables under the typed transport

Each generated table, counted per grammar at `ccb370d67` (whose generated output is `106475358`'s), and
what the typed transport does with it: **retired**, **folded** into an attribute, **still needed**,
or **JS by nature**. `transport/generated-tables-census.py` in this design's probes prints the
counts.

| table | rust | typescript | python | scm | regex | under the typed transport |
| --- | --- | --- | --- | --- | --- | --- |
| `transport.rs` structs (slot fields) | 395 (696) | 400 (740) | 284 (478) | 52 (83) | 81 (101) | **folded**: they become the declarations, with the attributes added |
| `transport.rs` napi `FromNapiValue`/`ToNapiValue` impls, lines | 40 592 | 53 338 | 26 075 | 4 902 | 5 976 | **retired** at the record step (the macro emits the object codec until then) |
| `transport.rs` render functions, lines | 4 158 | 4 094 | 2 658 | 530 | 532 | **still needed**: they stay codegen-emitted (ruling 9) |
| `kind_ids.rs` kind constants | 468 | 467 | 336 | 69 | 91 | **still needed**: the attributes name them (ruling 10) |
| `kind_ids.rs` `kind_name_from_id`, arms | 469 | 685 | 338 | 69 | 100 | **still needed**: refusals and diagnostics name kinds (ruling 7) |
| `kind_ids.rs` `inner_gap_key`, arms | 25 | 14 | 12 | 2 | 1 | **folded** into `gap(n) = slot` |
| `kind_ids.rs` `stores_scalar`, arms | 143 | 203 | 94 | 5 | 8 | **retired**: a slot's type says it, a unit variant or a presence flag being scalar |
| `lib.rs` `ReadModel` impl, lines | 14 | 14 | 14 | 14 | 14 | **retired** |
| `wrap.ts` projection, lines before each wrap's members | 10 936 | 11 018 | 5 824 | 928 | 812 | **folded**: the reader projects |
| `wrap.ts` member literals, lines | 6 703 | 6 358 | 3 875 | 497 | 1 785 | **JS by nature**: the wrap keeps them |
| `_ROUTES_<Kind>`: tables, rows | 17, 305 | 19, 295 | 19, 456 | 4, 15 | 8, 31 | **folded** into `field` and the slot types |
| `SUPERTYPE_MEMBERS`, lines | 677 | 530 | 457 | 62 | 24 | **folded** into the supertype's choice |
| `_LIST_OWNER_KINDS`, lines | 17 | 9 | 20 | 0 | 0 | **folded** into `min_depth` |
| `_ALIAS_ENVELOPES`, `_HIDDEN_KINDS`, `_RECLAIMS_ANONYMOUS`, lines | 1, 6, 3 | 1, 5, 3 | 1, 5, 3 | 1, 0, 1 | 1, 1, 1 | **folded** into `envelope`, with `display`, and the slot types |
| `consts.ts` `TOKEN_INTERIORS`, kinds | 40 | 15 | 4 | 2 | 1 | **folded** into `interior` for the read; **still needed** by the builders' coercion (`factories/coerce.ts`) |
| `consts.ts` `INNER_GAPS`, kinds | 25 | 14 | 12 | 2 | 1 | **still needed**: `$trivia.inner` and `innerAt` check gap keys in JavaScript; it and `gap(n)` come from the node map's same rows |
| `utils.ts` `querySlots`, kinds | 226 | 222 | 162 | 23 | 28 | **still needed**: query plans compile in JavaScript (ruling 8) |
| `utils.ts` `triviaFacts`, lines | 28 | 25 | 26 | 11 | 11 | **JS by nature**: the `$trivia` API's facts |
| `options.rs` `SITE_*` constants | 1 510 | 1 361 | 973 | 153 | 118 | **still needed**: render-option sites, which the read does not touch |
| `node-model.json5`, lines | 26 753 | 28 826 | 16 679 | 2 326 | 2 880 | **still needed**, off the read path: tools, censuses and validators read it |
| `factory-map.json5` | — | — | — | — | — | **already retired**: `node-model.json5` replaced it |
| `test-fixtures.json`, fixtures | 4 078 | 4 158 | 2 790 | 38 | 108 | **still needed** for render parity and the rebuilt-render bench; its encoding follows the wire at the record step |
| `.sittir/render-bodies.json`, `resolutions.json`, lines | 8 319, 223 | 8 557, 1 909 | 4 443, 346 | 706, 4 | 953, 63 | **still needed**, off the read path: the validators' renderable catalog, and conflict resolutions for codegen |
| `STORED_SLOT_READERS` (`@sittir/common`, hand-written) | — | — | — | — | — | **JS by nature**: the key a node keeps its seated slots' readers under |
| types, `is`, `ir`, factories and glue, lines | 55 521 | 59 419 | 34 275 | 5 399 | 7 943 | **JS by nature** |

The typed reader retires or folds the read's projection: 29 518 lines of wrap projection across the
five grammars, the route, supertype, list-owner, envelope and reclaim tables, `stores_scalar` and
`ReadModel`, and `inner_gap_key`. The record step retires the napi impls, 130 883 lines across the
five grammars. Render functions, kind constants, option sites, query slots, trivia facts, the node
model and the fixtures stay.
