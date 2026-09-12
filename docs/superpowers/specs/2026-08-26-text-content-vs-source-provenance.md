# `$text` — Slot Content vs Source Provenance

**Status:** Designed (not realized)

## Problem

`$text` carries two unrelated facts under one name.

**Slot content.** For a text-modeled kind — `AssembledPattern`, `AssembledToken`,
`AssembledKeyword`, anything whose template is `{{ text }}` — the text *is* the
node. An `identifier`'s text is its name; a `string_content`'s text is its body.
Nothing else in the node carries the value, and an edit sets it. This is the
role `VerbatimTransport` was minted for: a text-only carrier with no kind tag,
because every pattern-modeled variant of a slot renders identically given the
same text, which makes the variant tag render-invisible.

**Source provenance.** For a structural node, `$text` is the span it happened to
be read out of. It is not the node's value — the template rebuilds that from
slots. It exists so an untouched subtree can be replayed byte for byte,
preserving what lies *between* the children: comments, blank lines, and in an
indentation-sensitive grammar the block structure itself. An edit invalidates
it immediately.

The two roles have opposite lifecycles — content survives edits, provenance is
destroyed by them — and the codebase pays for the conflation in three ways.

**Every consumer re-derives which role is in play.** `hasStructure`,
`isUntouchedSubtree`, and `isUnexpandedStub` in `transport-data.ts` all inspect
storage keys to decide whether a `$text` is content or a stale capture.
`slot.rs` repeats the judgement natively. `wrap.ts` emits `_isReadTextLeaf` to
make it a third time. `is.ts` treats `typeof $text === 'string'` as "this is a
node". None of these consult a stamped fact, because there isn't one — the
field's name is the same in both roles, so its meaning has to be guessed from
shape. That guess is wrong at the edges: a root that parses childless (a file
of nothing but comments) is indistinguishable from one an edit emptied, which
is the defect `markEdited` currently patches.

**The two readers disagree about it.** The JS reader omits branch `$text`
outright — "branches reconstruct their text via the render template" — behind a
`SITTIR_DEBUG_TEXT` escape hatch. The native reader always captures it, with a
comment conceding "for structural nodes the extra `$text` is unused but
harmless." It is not harmless; it is load-bearing for the untouched-subtree
path and stale the moment anything is edited. One reader treats provenance as
debug output, the other as protocol.

**It is most of the wire.** Structural `$text` is a copy of source the native
side already owns, re-sent once per level, so a deep read duplicates the file
roughly once per unit of nesting depth. Measured on `sittir-core/src/engine.rs`
(first 8 KB), rust grammar:

| read | wire bytes | `$text` | structural `$text` | wire ÷ source |
|---|---|---|---|---|
| shallow, 48 B source | 321 | 95 | 48 | 6.7× |
| deep, 48 B source | 2 540 | 228 | 222 | 52.9× |
| shallow, 8 KB source | 14 903 | 12 613 | 8 000 | 1.9× |
| deep, 8 KB source | 138 750 | 32 240 | **32 206** | 17.3× |

On the deep read, 99.9 % of all `$text` is structural, and it is ~23 % of the
payload — bytes spent shipping the source to a consumer that cannot use them
for anything but handing them back.

## Design

**`$text` means slot content, and only that.** It appears when the kind's
template renders from text, and it survives edits because it is the value being
edited. `VerbatimTransport` stays exactly as it is — it was always modelling
this role correctly.

**Provenance stops being a value and becomes a coordinate.** A structural node
carries `$nodeHandle` and `$span`. The handle already names its tree (tagged
`tree_id << 32 | index`), and the native engine already retains that tree for
as long as JavaScript can reach it. So "the source this node was read from" is
fully addressable natively: `(tree, span)`. No text needs to cross the boundary
to express it.

This is what makes the render short-circuit possible. When a subtree is
untouched, the transport sends its coordinate instead of its text, and the
native renderer slices the source it still holds. The bytes never make the
round trip — the native side talks to the native side.

The precedent already exists and works: `validate/from.ts` reconstructs text as
`readData.$text ?? source.slice($span.start, $span.end)` when `$text` is
absent. That fallback becomes the only path.

**An edit detaches the coordinate.** The coordinate is the one fact an edit
invalidates, so the `$edited(...)` spread in every generated `$with` setter
drops `$nodeHandle`, `$span` and `$childIndex` from the node it rebuilds, in
place of the `$text` it drops today. It cannot be inferred later: a node whose
`$with` emptied its only slot and a node that parsed childless (a file of
nothing but comments) have the same shape, and only the first is dirty. The
setter is the one place that knows an edit happened, so the fact is recorded
there.

**The readers converge.** Both stop emitting `$text` on structural nodes, so
`SITTIR_DEBUG_TEXT` and the JS/native shape divergence go away together.

### One rule at the transport

Unread and unedited are the same state as far as rendering is concerned:
nothing here needs rebuilding, go get it from the tree. They should therefore
have the same wire shape, and the transport should need only one test.

- **Unread** — a stub the reader located but never expanded. Coordinates only.
- **Unedited** — read, but nothing below it replaced. Projects back *down* to
  coordinates only.
- **Anything else** — has storage the template must rebuild, and its own
  children are projected by the same rule, so an untouched child inside an
  edited parent is still a coordinate.

The fold is bottom-up and the check is local. A node folds when it still
carries its coordinate, has no attached trivia (a node's own leading and
trailing comments sit outside the span), and every stored child folds; a
text-modeled leaf folds when it still carries its `$span`, and a kind id or
boolean stored in a slot is inert. A node that does not fold has its
coordinate stripped before it crosses, so the native side needs one test — is
`$nodeHandle` present — and never inspects storage keys to decide.
`isUntouchedSubtree`, `hasStructure` and the `$text` fallback collapse into
that single question.

**This makes reading non-destructive**, which is the largest practical
consequence. Today a deep read rebuilds every level from its template, so it
re-spells the source even when nothing was edited — measured on rust:

```
source : "pub fn main() {\n\t// keep me\n\tlet x = 1;\n\n\tprintln!(\"{}\", x);\n}\n"
shallow: byte-exact
deep   : "pub fn main(){ // keep me\nlet x=1;println!(\"{}\",x); }"
```

Indentation, the blank line, and every seam space are lost to a read. Under
this rule each unedited level folds back to a coordinate, the root is
coordinates-only, and a deep read renders byte-identically to a shallow one.
The read-depth suite currently records the divergence as "the point of the
flag, not a defect"; that caveat goes away.

### The carrier: a coordinate or the transport

`SlotValue` stays a wrapper and keeps exactly two arms, but `Node(T)` goes —
the arm is the transport itself, and naming it `Node` invented a layer of
abstraction over something that needed none:

```rust
pub enum SlotValue<T, const ADJACENT: bool = false> {
    /// The content is in the tree — resolve and slice.
    Coord(NodeCoordinate),
    /// The content is in this message.
    Transport(T),
}

pub struct NodeCoordinate {
    /// Tagged: the tree id in the high bits names the tree.
    pub handle: u64,
    /// Byte range within that tree's source.
    pub span: Span,
}
```

A coordinate carries both the handle and the span. The handle's tag is the
tree's identity, which the span alone cannot express; the span is the slice,
which the handle alone yields only by re-walking the coordinate table to the
node. On the wire they are `$nodeHandle` and `$span`, both already stamped by
the reader on every node it hands out; a `$nodeHandle` without a `$span` is
an error, never a re-resolution.

`Verbatim(String)` is deleted. Its three meanings separate: a captured span
becomes `Coord`, text that is genuinely the slot's content becomes a
`VerbatimTransport` inside `Transport`, and free text in a slot admitting no
text kind becomes an error.

The carrier is then orthogonal on one axis — **where does the content live**,
in the tree or in this message. Text-versus-structure is a different axis and
belongs to the transport type. `Verbatim(String)` straddled both, which is how
it accumulated three unrelated meanings.

**Why a wrapper and not a field on each transport.** Putting
`Option<NodeCoordinate>` on every transport struct would avoid the extra type
layer, and costs far more than it saves.

Storage fields are mostly **required** today — the `$`-prefixed metadata is
optional, but a slot the grammar says must be present is emitted as a bare
type:

```rust
pub struct ExpressionStatementTransport {
    #[napi(js_name = "$span")]     pub transport_span: Option<Span>,   // metadata
    #[napi(js_name = "_content")]  pub content: SlotValue<..>,         // required
}
```

| grammar | storage fields | required | optional |
|---|---|---|---|
| rust | 429 | 242 | 187 |
| typescript | 516 | 306 | 210 |
| python | 261 | 186 | 75 |

A coordinate-only value has no storage at all, so a coordinate *field* would
force every one of those required fields to become `Option` — 242, 306 and 186
grammar facts downgraded to "maybe", across every struct, so that one unrelated
state could be expressed. Requiredness here is the grammar's own statement that
a slot must be filled, and it is worth more than a type-graph layer.

The enum keeps them required, because a `Coord` never constructs a transport at
all. It also makes coordinate-and-storage unrepresentable rather than merely
unlikely, and stays one mechanism where a field would be two, since enum-typed
slots would need an arm regardless.

The layer has a price already paid and visible: `#![recursion_limit = "256"]`
on the grammar crates, because the wrapper "adds a layer to an already deeply
nested generated type graph". That is a compile-time knob, not a correctness or
runtime cost, and it buys unrepresentable illegal states.

`RenderRoot` is already `SlotValue<AnyTransport>`, so the root — the case worth
the most, since it is whole-file byte-exactness — is covered by the same arm
with no separate path.

### The transport already carries a coordinate, and ignores it

Every transport struct declares `$span`, `$nodeHandle` and `$childIndex`
alongside `$source` and `$named`, pulls all five off the napi object for every
node it deserializes, and reads none of them. Consumers across the generated
crates and `sittir-core`:

| field | declarations | consumer sites |
|---|---|---|
| `$text` | 600 | 149 — the verbatim fast-path |
| `$triviaData` | 965 | 2 — `render_with_trivia!` |
| `$span` | 965 | **0** |
| `$nodeHandle` | 965 | **0** |
| `$childIndex` | 965 | **0** |
| `$source` | 965 | **0** |
| `$named` | 965 | **0** |

So the coordinate is not about to be duplicated by the `Coord` arm — it is
already present and already inert. The five unread fields are dropped from the
transport structs, leaving `Coord` as the single place a coordinate exists on
the render path.

The read direction is unaffected: `$nodeHandle` and `$childIndex` are how the
wrap layer drills into an unexpanded child, so the reader keeps emitting them.
What ends is the transport declaring fields it never consults, which costs a
napi property lookup per field per node.

**`$source` being unread is load-bearing elsewhere.** `render_transport_parts`
hardcodes `TransportSource::Factory`, and `resolve_render_format_from_source`
returns tree format only when the source is *not* `Factory`. Detected per-file
format is therefore unreachable on the native render path — only an explicit
engine-level format ever applies. Removing the field makes that explicit rather
than creating it, but the format path needs its own decision: either the
transport starts carrying provenance that `render` honours, or tree format is
acknowledged as engine-level only and `extract_format` stops pretending
otherwise. Out of scope here; named so it is not mistaken for a regression this
spec introduces.

### What this restores from `VerbatimTransport`

`VerbatimTransport` was a standalone struct carrying text with no kind tag,
admitted as an arm of every per-slot and supertype enum with at least one
pattern-modeled variant. Its premise: pattern-modeled variants render
identically given the same text, so the variant tag is render-invisible and
picking one is a non-question.

`SlotValue` absorbed it into a `String` arm, and that arm then accumulated
three unrelated meanings — a factory's bare string, an unexpanded stub's
captured source, and free text in a slot admitting no text kind. The struct was
retired for a mechanism that could not keep the distinction it encoded.

Both come back to their proper homes here: the coordinate takes the stub case,
`VerbatimTransport` takes text-as-content, and free text in a slot that admits
none becomes an error.

**It also closes a regression.** `SlotValue::from_napi_value` offers the value
to `T` first and falls back to `Verbatim` on error:

```rust
let attempt = unsafe { T::from_napi_value(env, napi_val) };
let error = match attempt {
    Ok(node) => return Ok(Self::Node(node)),
    Err(error) => error,
};
```

That is a two-way form of the variant-trial fallback chain the
`VerbatimTransport` work deleted, whose silent first-match-wins behaviour was
the measured cause of the rust deep-AST gap — bare strings matching
`StringLiteralTransport` and rendering as `""`. It is milder here, because the
fallback is gated on the value's own `$text`, but it is the same shape at a
different level, and the gate disappears with provenance `$text` anyway.

Three distinct wire shapes make the dispatch shape-directed rather than
trial-based:

| wire shape | arm |
|---|---|
| object carrying a coordinate, no storage | `Coord` |
| bare string, where the slot admits a text kind | `Transport(T::Verbatim(..))` |
| object with storage | `Transport(T)` |
| anything else | error |

No attempt-then-fallback, and an unrecognised shape is an error rather than
whichever arm happened to deserialize. This is the strict dispatch contract
`VerbatimTransport` established, applied at the carrier and now workable
because the three shapes are genuinely distinct.

### Coordinates resolve in one walk before the render

A render already makes one pass over every slot of the transport before a
byte is written: the fill walk that copies the resolved option into every
unset spacing and flank field. Resolving coordinates is the same shape of
work — visit every slot, act on the ones that need it — so it is the same
walk. The walk takes one context, passed as an argument the whole way down:

```rust
pub struct RenderContext<'a> {
    pub options: &'a ResolvedOptions,
    pub sources: &'a dyn SourceTable,
}

pub trait SourceTable {
    fn source_of(&self, tree_id: u32) -> Option<&Arc<str>>;
}

pub trait Prepare {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), PrepareError>;
}
```

The engine's live-tree map is the `SourceTable`; each parsed tree holds its
source as an `Arc<str>`. Visiting a `Coord`, the walk looks the tree up by
the handle's tag and attaches a clone of that `Arc` to the coordinate, after
checking the span lies within it on character boundaries. Nothing ambient
carries the table — no thread-local, no global — and nothing on the render
path needs a context after the walk: `Display` on a resolved coordinate
slices the source it holds, and the generated render functions keep the
`fmt::Write` chain they have. A handle whose tag names no live tree, or a span
outside its source, fails the walk with the handle in the error, so an
unresolvable coordinate is refused before the render starts rather than
rendered empty.

The adjacency mark is untouched by this. It travels in-band already — the
`U+FFFE` noncharacter the immediate leaves and the carrier's `ADJACENT`
position write into the stream, which the spacing writer strips — and a
coordinate's write honours its position's `ADJACENT` exactly as verbatim text
does today.

### Gaps between coordinates classify into option values

Render options give every list site of a kind one value: `Option<u16>` per
site on the transport, filled from the option table when the wire left it
unset. A rebuilt node whose items are still coordinates of one tree has a
better source for that value than the table: the bytes between the items.

In the same walk, before the table fills a site, a list slot whose
consecutive items are both coordinates of the same tree, in source order,
yields one gap per adjacent pair — the bytes from the first item's span end
to the second's span start. For a separated list the gap splits around the
first occurrence of the separator token into the text before it and the text
after it; for an unseparated repeat the whole gap is the one site's text. Each
piece classifies to the arm the site admits whose whitespace text has the
same seam rank — no line break and empty is `tight`, no line break and
non-empty is `space`, otherwise the arm with the same number of line breaks,
falling back to the widest the site admits. A depth arm (`indent`, `dedent`)
never classifies: indentation belongs to the writer's depth tracking. A gap
whose token is absent, and any pair that is not two ordered coordinates of
one tree, contributes nothing. The site takes the majority class over its
gaps, the first seen winning a tie, and only when the wire left it unset.

So for any list site the precedence is: the value the wire carried, then the
class of the source gaps, then the engine's option table, then the grammar's
default. Seated per-item seams are not classified: a seated item is a
transport the render rebuilds, so its own span is stale and the bytes after
it are not the gap that will be written. Comments inside a gap count as the
bytes they are; a comment between two items of a rebuilt list is trivia the
reader did not attach to either stub, and that loss predates this design.

### One tolerance is deliberately lost

`SlotValue::Verbatim` today also absorbs free text in a position that admits no
text kind, rendering it as-is. With the `String` arm gone that becomes an
error.

This tolerance arrived with the slot carrier as a side effect of using a
`String`, not as a considered decision, and keeping it would mean a slot whose
grammar admits no text still silently emitting whatever text it was handed —
the same permissiveness the strict dispatch contract exists to refuse. A slot
that genuinely should accept text says so by admitting a text kind.

**It also closes a regression.** `SlotValue::from_napi_value` offers the value
to `T` first and falls back to `Verbatim` on error:

```rust
let attempt = unsafe { T::from_napi_value(env, napi_val) };
let error = match attempt {
    Ok(node) => return Ok(Self::Node(node)),
    Err(error) => error,
};
```

That is a two-way form of the variant-trial fallback chain the
`VerbatimTransport` work deleted, whose silent first-match-wins behaviour was
the measured cause of the rust deep-AST gap — bare strings matching
`StringLiteralTransport` and rendering as `""`. It is milder here, because the
fallback is gated on the value's own `$text`, but it is the same shape at a
different level, and the gate disappears with provenance `$text` anyway.

Three arms backed by three *distinct shapes* make the dispatch shape-directed
rather than trial-based:

| wire shape | arm |
|---|---|
| object carrying a coordinate, no storage | `Coord` |
| bare string, where the slot admits a text kind | `Transport(T::Verbatim(..))` |
| object with storage | `Transport(T)` |
| anything else | error |

No attempt-then-fallback, and an unrecognised shape is an error rather than
whichever arm happened to deserialize. This is the strict dispatch contract
`VerbatimTransport` established, applied at the carrier and now workable
because the three shapes are genuinely distinct.

**This makes reading non-destructive**, which is the largest practical
consequence. Today a deep read rebuilds every level from its template, so it
re-spells the source even when nothing was edited — measured on rust:

```
source : "pub fn main() {\n\t// keep me\n\tlet x = 1;\n\n\tprintln!(\"{}\", x);\n}\n"
shallow: byte-exact
deep   : "pub fn main(){ // keep me\nlet x=1;println!(\"{}\",x); }"
```

Indentation, the blank line, and every seam space are lost to a read. Under
this rule each unedited level folds back to a coordinate, the root is
coordinates-only, and a deep read renders byte-identically to a shallow one.
The read-depth suite currently records the divergence as "the point of the
flag, not a defect"; that caveat goes away.

### Coordinates must name their engine

Tree ids are allocated per engine and start at 0, so two engines each have a
tree 0 and a handle does **not** identify a tree globally:

```
engine A root $nodeHandle = 0
engine B root $nodeHandle = 0
```

While provenance travels as text this is harmless. As a coordinate it is the
same silent-corruption class as an untagged handle, one level up: a node read
by one engine and rendered through another would resolve against an unrelated
tree and emit the wrong source. Before coordinates ship, either the handle must
carry engine identity as well, or `render` must refuse a coordinate it did not
mint. Refusing is the smaller change and fails loudly, which is the right
default for a fact that cannot be checked any other way.

### Coordinates are not portable

Today `readNode` output is self-describing: the text rides along, so it can be
serialized, stored, and rendered later or elsewhere. A coordinate is only
meaningful beside a live tree, and trees are released when JavaScript drops
them. Within a single `$render()` the tree is reachable by construction, but a
caller that extracts raw node data and renders it later has lost the source.

This is a real narrowing of the contract and has to be stated rather than
discovered. An unresolvable coordinate must be a loud error, never an empty
render. If portable output is genuinely needed, it wants an explicit
materialize step that resolves coordinates to text on the way out — the
inverse of this projection — rather than keeping every node self-describing on
the chance that someone will.

### End state

- `NodeData.text` is populated for anonymous tokens and for named kinds the
  grammar models as text; the unconditional `source.get(byte_range)` capture
  in `read_ts_node` is gated on a per-grammar predicate the engine adapter
  exposes, generated from the model's classification.
- The root keeps whole-file coverage, but as span rather than text: `$span` is
  `0..source.len()` and the text is sliced natively at render. The tree handle
  carries the source string for callers that want it.
- `SlotValue` keeps two arms, `Coord(NodeCoordinate)` and `Transport(T)`.
  `Node(T)` and `Verbatim(String)` are both gone. A coordinate is the tagged
  handle and the span.
- Transport structs drop `$span`, `$nodeHandle`, `$childIndex`, `$source` and
  `$named` — declared today, read never. The reader keeps emitting the
  coordinate fields, which the wrap layer needs for drill-in and the
  projection needs to fold.
- `VerbatimTransport` returns as a node type, admitted by slot types that
  accept a text kind.
- The fill walk is the prepare walk: `Prepare::prepare(&mut self, &RenderContext)`
  resolves coordinates against the engine's live trees, classifies list gaps,
  then fills unset sites from the option table. The context is an argument
  end to end; nothing is thread-local or global.
- `hasStructure`, `_isReadTextLeaf`, and the `slot.rs` judgement collapse into
  the model's own classification of text-modeled kinds — a stamped fact, per
  the canonical-predicates rule, not a shape heuristic re-implemented per site.
- `markEdited` / `$edited` detach the coordinate instead of the text.
- `SITTIR_DEBUG_TEXT` deleted.
- `#![recursion_limit = "256"]` stays; the wrapper layer that needed it stays.

### Hybrid kinds

One case needs care and is the reason the current capture is unconditional: a
kind with named-field children that still renders `{{ text }}` — the reader's
comment names `raw_string_literal`. Under this design that kind is
text-modeled, so it keeps `$text` as content; its children are not the source
of its rendering. The classification must be driven by the template the kind
actually renders through, not by the leaf heuristic (`no fields AND no named
children`), which is precisely the proxy that forced the unconditional capture.

## Gates

1. `read-render-parse` and `read-render-parse-shallow` hold on all three
   grammars, byte-exact — this design touches exactly the path that preserves
   inter-child source.
2. The verbatim round-trip cases hold, including leading blank lines,
   indentation, comment-only files, and whitespace-only files
   (`packages/rust/tests/tree-identity-and-verbatim.test.ts`).
3. A deep read and a shallow read of the same unedited source render
   byte-identically — the divergence recorded in `read-depth.test.ts` is gone.
4. `factory-render-parse` unchanged — factory nodes never had provenance text.
5. Wire size on the deep 8 KB measurement above drops by roughly the structural
   `$text` share; record the actual number rather than asserting the estimate.
6. A coordinate minted by one engine and rendered through another fails loudly.
7. Deserialization dispatches on shape, with no attempt-then-fallback, and
   rejects an unrecognised shape rather than defaulting to an arm.
8. A rebuilt list whose items are coordinates renders the majority class of
   its source gaps: a parsed block with blank lines between its statements
   keeps them after one statement is appended, and a comma list spelled
   `a,b,c` stays tight after an item is replaced.
9. No thread-local or global carries the tree table or the option table; the
   render context is an argument at every level of the walk.
10. Full unit suite, and `validate history` compared numerically across all
    three grammars.

Sequencing: byte-exact verbatim render currently depends on the `Verbatim`
arm, so its removal and the coordinate arm land together. There is no
intermediate state where captured text is gone and coordinates are not yet
carrying the untouched-subtree case.

## Out of scope

- Per-tree render format. `render()` currently falls back to the newest parse
  when no `treeId` is named, so a node rendered through an engine that has since
  parsed something else borrows the wrong format. The `treeId` parameter is the
  seam for fixing it; threading it through the wrap layer is separate work.
- Whether `$span` should remain on text-modeled kinds once provenance is
  coordinate-based.
- The seam classifier and the adjacency mark. A coordinate's write honours
  its position's `ADJACENT` as verbatim text does; how boundaries are
  classified does not change.
- Tree-level render format. `render_transport_parts` hardcodes
  `TransportSource::Factory`, so detected per-file format never reaches the
  native render path; that predates this spec and needs its own decision.

## Realization notes

Depends on tagged handles and native tree retention, which are already in
place: handles name their tree, and the engine keeps every tree JavaScript can
still reach, disposing it through a `FinalizationRegistry`. Without that, a
coordinate would be unresolvable the moment a second parse happened.
