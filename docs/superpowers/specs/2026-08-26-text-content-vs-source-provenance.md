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

**Dirtiness becomes structural rather than stamped.** With provenance held as a
coordinate, there is no stale text to invalidate: a node is replayable exactly
when every stored value is still an unexpanded stub, which is already what
`isUntouchedSubtree` checks after its `stubs > 0` clause was removed. The
`markEdited` helper and the `$edited(...)` spread in every generated `$with`
setter are then unnecessary and should be deleted — they exist only to keep a
provenance `$text` from outliving the edit that invalidated it.

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

The fold is bottom-up and the check is local: a node is coordinates-only when
every stored value is. `isUntouchedSubtree`, `hasStructure` and the `$text`
fallback collapse into that single question.

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
```

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

### The sink carries what the boundary erases

Two problems in this spec have one cause and one answer.

`RenderableTransport::render_into(&self, dest)` hands the coordinate arm no way
to reach the tree it must slice. And `ADJACENT` exists because askama's
`fmt::Write`/`Formatter` chain **erases sink identity**, so a per-boundary fact
— "no space may precede this" — cannot travel in-band and rides a thread-local
mark instead. Same shape of problem: the sink is too weak to carry what the
render needs to know.

The seam work already names the fix and calls it optional: thread a custom sink
trait end-to-end, replacing the `fmt::Write` chokepoints, and the mark
"dissolves into a two-layer `RawWriter`/`SpacingWriter` split: state at the
bottom, seam check as a decorator that statically-resolved call sites bypass by
construction. Same semantics, in-band."

That same sink carries the tree table. So:

- **Coordinates resolve in-band.** No ambient tree table, no second
  thread-local. The sink the render is already writing into knows which trees
  are live.
- **A render fn whose seams are all statically decided takes a `RawWriter`**,
  which inserts nothing. For those fns the template text is final and
  adjacency needs no signal at all — the question of baking immediacy into the
  `.jinja` answers itself once nothing is second-guessing the template.
- **`SpacingWriter` survives only where a seam is genuinely indeterminate** —
  per-instance presence, adjacent optionals, pattern trailing edges. Immediacy
  there is a decorator argument rather than a thread-local.

Note what *cannot* be baked as a character, since it is the reason the mark
exists at all: a required space is bakeable because it is a character to add,
but immediacy is the demand that no space appear, and an absent space cannot
express it while a writer is inserting from the last character it saw.
`type{{ left }}` carries no space and still gets one. Immediacy becomes free
only by removing the inserter, not by editing the template.

**Where each source of immediacy lands.** `slotVerbatimIsImmediate` is
conservative because verbatim text "erases kind identity (a text-collapsed
leaf, an inline terminal and an unexpanded read stub all arrive as text)". One
of those three is not scalar at all — a stub is a **node** that merely arrives
as text, and the seam work already routes structural arms through
`isLeftImmediateKind`, describing them as "the case the scalar-only gate
cannot cover". So:

- **Coordinate** — structural. Uses `isLeftImmediateKind` on the kind it
  resolves to. Exact, and already realized.
- **`VerbatimTransport`** — genuinely identity-erased text. Keeps the scalar
  gate, now over the two sources it was named for.

With one erasure source gone the gate vetoes less often, so boundaries should
migrate from indeterminate into static. The seam work's residue report is the
instrument; record before and after per grammar rather than asserting it.

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

- `NodeData.text` is populated only for text-modeled kinds. The unconditional
  `source.get(byte_range)` capture in `read_ts_node` is gated on the kind.
- The root keeps whole-file coverage, but as span rather than text: `$span` is
  `0..source.len()` and the text is sliced natively at render.
- `SlotValue` keeps two arms, `Coord` and `Transport(T)`. `Node(T)` and
  `Verbatim(String)` are both gone.
- Transport structs drop `$span`, `$nodeHandle`, `$childIndex`, `$source` and
  `$named` — declared today, read never. The reader keeps emitting the
  coordinate fields, which the wrap layer needs for drill-in.
- `VerbatimTransport` returns as a node type, admitted by slot types that
  accept a text kind.
- A custom sink is threaded through the render stack. Statically-resolved
  render fns take a `RawWriter`; `SpacingWriter` survives only at
  indeterminate seams; `mark_adjacent` and its thread-local are gone, and the
  tree table travels in-band on the sink.
- `hasStructure`, `_isReadTextLeaf`, and the `slot.rs` judgement collapse into
  the model's own classification of text-modeled kinds — a stamped fact, per
  the canonical-predicates rule, not a shape heuristic re-implemented per site.
- `markEdited` / `$edited` deleted.
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
8. The seam residue report is recorded before and after, per grammar. Removing
   the stub as an erasure source should move boundaries from indeterminate into
   static; the counts may not regress.
9. Every render fn the classifier calls statically resolved takes a
   `RawWriter`, and no thread-local survives in the render path.
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
- The seam classifier itself. This spec consumes its output and removes the
  thread-local it currently needs; it does not change how boundaries are
  classified.
- Tree-level render format. `render_transport_parts` hardcodes
  `TransportSource::Factory`, so detected per-file format never reaches the
  native render path; that predates this spec and needs its own decision.

## Realization notes

Depends on tagged handles and native tree retention, which are already in
place: handles name their tree, and the engine keeps every tree JavaScript can
still reach, disposing it through a `FinalizationRegistry`. Without that, a
coordinate would be unresolvable the moment a second parse happened.
