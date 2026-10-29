# Public eager record builders

The packed AST and arena-tables documents govern this work: the shared-arena
design (§ Packed AST is definitive, § The wire, § Render, § Trivia) and the
arena-tables plan's cutover outline ("Eager immutable built records are
required"). The private construction probe in
`docs/superpowers/probes/2026-10-12-record-wire/eager/` is the prototype, not
public cutover evidence.

## Accepted boundary

- **Three builder modules from one generator.** `factories/objects.ts` holds
  the object builders and `factories/records.ts` the record builders, with the
  same names and signatures. Each builder's prelude (normalization, coercion,
  admission and checks) comes from one emitter in both; then the object backend
  writes the node literal and the record backend writes the record
  (`record-construction.ts`). Both are fed one structured construction
  contract. Neither backend reads the other's source text.
- **`raw.ts` dispatches by engine.** Every module that calls builders imports
  them from `factories/raw.ts`: coercion, bundles, overlays, IR, `from` and a
  parsed node's `$with` rebuild. `raw.ts` re-exports `objects.ts` and replaces
  each builder with one that runs the builder of the backend of the engine in
  scope. The record builder module reaches an engine by `import()`, so a
  process that never builds records never loads it. Inside one backend,
  builders call their own backend directly.
- **Storages do not mix.** A builder refuses a child from an engine of the
  same language that stores its nodes differently, so an object node never
  holds a record and a record never holds an object node.
- **Literal record stores.** Codegen emits literal word offsets, widths,
  presence bits, run strides and inline capacities from the one layout pass.
  There are no runtime layout descriptors and no generic record writer.
  Allocation, ownership and text interning are shared runtime helpers in
  `@sittir/common`.
- **Built views reuse the parsed record views.** The built arena supplies a
  records reader over its JS-owned chunks, so accessors have one derivation.
  Only the members that differ are built-specific: `$with`, a rebuild that
  shares unchanged children; `$trivia`; and `$render`.
- **Native reads JS-owned chunks per call.** Every grammar's addon borrows, for
  one synchronous render, the chunks it reads, each on its first read. It admits
  the records it reaches and holds no span after the call (`VisitedChunks`,
  `admit`, `RecordGrammar::render_record`). A chunk it cannot borrow is refused
  by name when the render reads it.
- **No JSON.** A node has no JSON form. Every node's `toJSON` is one shared
  function that refuses by name, so a node costs no closure for it, and
  `engine.reviver` refuses the same way. No JSON writer, reviver or JSON facts
  are generated.
- **Preserve everything the object path has:**
  - parsed coordinate links;
  - bounded children, lists and list settings: a built record holds each
    compound child by its address, as a child cell, and only a parsed record
    embeds a bounded child inline;
  - string interning, with the original builder string kept;
  - trivia, provenance and retained views.

## Where slices land

Each slice is a PR stacked on the slice before it, and the stack lands in
`feat/records`, the arena-storage branch, not in master. Master is merged into
`feat/records` by a merge commit, never a rebase, followed by regeneration and
the gate, at the start of each slice and whenever master moves.

`feat/records` goes to master only when records are stable:

- the switch slice is merged into it with its gates: both storages' complete
  validation history unchanged, the corpus comparison in CI, and the record
  builders at or above the eager probe in the `Arena benchmarks` workflow;
- native parsed hydration writes records directly, without building typed
  Rust nodes first;
- unreferenced built records and chunks are reclaimed.

## Slices, each a PR stacked on the arena-storage PR

Each slice is green on its own. Arena engines keep building objects until
the last slice.

- [x] **Record builders and parsed links.** `factories/records.ts`, generated
  from the same construction contract as `objects.ts`, and the dispatching
  `raw.ts`. `objects.ts` keeps today's builders. The shared runtime covers
  chunks, allocation and interning. Record stores cover every constructible
  kind: compounds, lists, text leaves, refinement forms and units. Built views
  read them back. An internal switch (`useRecordConstruction`) gives an arena
  engine the record backend for tests and `validate counts --construction
  records`.
  - Built records hold the untouched parsed children of their inputs by link,
    as the native writer does: a compound by its record in the parsed tree, a
    parsed leaf as a built leaf whose side record names its tree, row and
    span. The arena holds each linked tree. The factory and IR storage rows
    build every candidate over its parsed children, so they compare nothing
    without links.
  - Every non-render row must match object construction in all five grammars.
    The built-render-parse row fails until the render bridge.
- [x] **Native render bridge.** Every addon renders JS-owned chunks borrowed per call,
  with admission, including the parsed trees a built record links. Render bytes
  match the object path over the corpus.
  - A built record in a side is held by reference, its kind and address, and
    renders where the side renders, from its arena, with its own sides as its
    neighbours.
  - Every render reads through one table that answers every live tree.
  - A side's entries hold no sides of their own, so sides never nest.
- [ ] **Trivia and edits.**
  - Links to children read by another engine of the same language: a built
    record holds such a child by link, renders it and rebuilds over it, and
    renders after that engine is disposed.
  - A built record in a side is a record of the holder's own engine: the side
    renders it from that engine's arena, with the sides the engine wrote on it,
    and reads it back as its builder's node. A record another engine built is
    refused by name at the write, so the wire names no owner and the addon
    needs no type tag.
  - Written sides go to the native store. So do a built record's unit sides,
    from a rebuild, which carries them realigned to where their units moved;
    the store is the only copy.
  - A parsed entry of a live tree crosses into any native table as its
    coordinate, and the table holds that tree, so the entry's own sides are
    read at render and it reads back as its parsed view. A parsed entry of
    another language is refused by name at the write.
  - A view the arena makes of a record from the record alone, once its
    builder's object is collected, is the node its builder made. The arena
    stamps every built node it adopts. A compound view's `$with` and `$trivia`
    come from its kind's row, made lazily from the record: the row reads the
    builder's input back from the record's slots and list settings, so a
    builder binds no closure. A leaf is made anew from its cell's kind and
    text by its kind's maker, the one its builder calls. The records module
    hands the arena both, by kind.
  - A builder's input shape (its config keys, options and positional list) is
    the structure row its emitter writes beside the builder. `builderInputs`
    reads it for the rows.
  - `$with` shares unchanged children and copies bounded ones.
  - Disposal, growth and invalid buffers are covered.
- [x] **Record views for every compound kind.** A kind that seats a group
  has a record view. Each key the group lends its parent is a member, present
  only while the group's cell is set, that reads the group's field through the
  view, as the object path reads it through the stored group. Its `$with`
  seats the key in the group, as the object path's does. The kinds this
  covered are rust `last_match_arm`, `match_arm_block_ending`,
  `match_arm_with_comma`, `match_block`, `parameters_elements_receiver` and
  `use_wildcard`, typescript `catch_clause`, and python `slice`. Only a kind
  with a slot the layout gives no cell would still have no view, and no
  compound kind of the five grammars has one.
- [ ] **Switch.** Arena engines load the record backend. Prove that construction calls no
  object builder or serializer. Benchmark metadata names the construction
  backend. Both storages' complete validation history must be unchanged, and
  the corpus comparison runs in CI.
  - A parsed `$with` on records that mixes a kept parsed child with a
    records-built item throws `Missing field _content on BlockNode._statements`,
    where both object storages render it: a parsed record view rebuilds as an
    object node (`rowWith`), which then holds a record. Recheck once master's
    alias-envelope change is carried up, since `_content` is the envelope
    shape it removes.

## Measurement

Every slice is measured with the `Arena benchmarks` workflow, not local runs:
the dispatcher is on master, and each run is dispatched at the slice's branch
(`gh workflow run benchmarks.yml --ref <branch>`).

- **Corpus job.** `sittir tool bench-storage --validation` pairs object and
  arena engines over complete validator round trips: construction, rendering,
  reparsing and comparison. The workflow's `construction` input selects records
  or objects for the arena arm. Factory and IR totals are not isolated
  construction timings; settled memory samples show leftovers, not retained ASTs.
- **Construction job, planned.** Measure the engine's compiled runtime under
  plain Node, separately reporting build, render and parse work. Report steady
  construction, post-GC construction and the whole pass including deferred
  release/GC, with retained roots and all-handles-held populations distinguished.
  Do not force GC before the steady build window. Move corpus timing off the
  TypeScript loader as part of this measurement work.
- The private eager probe is frozen and removed from CI. Its private wrappers
  do not measure engine construction or memory and are not an acceptance baseline
  for public builders.
- A slice that moves a measured phase reports the workflow's paired summary
  in its PR, with the run link.

## Additional unfinished migration requirements

These must not be mistaken for completed builder integration:

- Direct parsed hydration and counted release are implemented. Their presence
  does not establish completion of the remaining safety, parity and lifecycle
  acceptance gates.
- Retained-memory evaluation must separate live records, open allocator reserve
  and native/external memory; post-validation leftovers are not a retained AST
  population.
- Object storage, the object reader/codec and object construction remain permanent
  engine choices. Object storage with record construction is refused. Selecting
  defaults requires its own correctness and performance acceptance and does not
  remove the other supported choices.
- A built leaf written as a side entry (typescript's `html_comment`, the one
  stamped trivia kind assembled as a pattern) crosses as its text, not as kind
  and address: its record is a header, and its text is a span of the arena's
  bytes that only its builder's reference names, so the address alone cannot
  stamp it. Reading the side back gives a fresh node where object construction
  gives the builder's. Every compound comment kind crosses as kind and address
  and reads back as the builder's node.
- The broader cutover outline also calls for native-only built trivia and
  native file parsing. Audit their live implementations before claiming the
  whole migration complete.
