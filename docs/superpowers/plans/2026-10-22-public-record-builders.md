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
- **Native reads JS-owned chunks per call.** Every grammar's addon borrows the
  chunks for one synchronous render, admits the records it reaches, and holds
  no span after the call (`BorrowedArena`, `admit`, `RecordGrammar::render_record`).
- **Preserve everything the object path has:**
  - parsed coordinate links;
  - bounded inline children, lists and list settings;
  - string interning, with the original builder string kept;
  - trivia, provenance and retained views.

## Slices, each a PR stacked on the arena-storage PR

Each slice is green on its own. Arena engines keep building objects until
the last slice.

- [ ] **Record builders and parsed links.** `factories/records.ts`, generated
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
- [ ] **Native render bridge.** Every addon renders JS-owned chunks borrowed per call,
  with admission, including the parsed trees a built record links. Render bytes
  match the object path over the corpus.
- [ ] **Trivia and edits.**
  - Links to children read by another engine of the same language.
  - Written sides go to the native store.
  - `$with` shares unchanged children and copies bounded ones.
  - Cover disposal, growth and invalid buffers.
- [ ] **Record views for every compound kind.** A kind whose seat plan has
  groups, or that has a slot the layout gives no cell, has no record view, so
  the record backend refuses it. Today these are rust `last_match_arm`,
  `match_arm_block_ending`, `match_arm_with_comma`, `match_block` and
  `use_wildcard`, typescript `catch_clause`, and python `slice`. The wrap
  emitter gives them record views before the switch.
- [ ] **Switch.** Arena engines load the record backend. Prove that construction calls no
  object builder or serializer. Benchmark metadata names the construction
  backend. Both storages' complete validation history must be unchanged, and
  the corpus comparison runs in CI.

## Measurement

Every slice is measured with the `Arena benchmarks` workflow, not local runs:
the dispatcher is on master, and each run is dispatched at the slice's branch
(`gh workflow run benchmarks.yml --ref <branch>`).

- **Corpus job.** `sittir tool bench-storage --validation` pairs object and
  arena engines over the complete validation buckets. Its factory and IR
  buckets time construction (`build`) and render on each storage. From the
  render bridge until the switch, `--construction records` gives the arena
  arm's engines the record backend, so the same buckets compare the record
  builders with the object builders. The report names the construction
  backend.
- **Eager job.** It measures the probe's private builders. It is the
  baseline the public builders must match or beat: build, render, immutable
  edit, and heap plus external memory over 10,000 builds.
- A slice that moves a measured phase reports the workflow's paired summary
  in its PR, with the run link.

## Additional unfinished migration requirements

These must not be mistaken for completed builder integration:

- Native parsed hydration still creates typed Rust nodes before arena encoding;
  direct Tree-sitter-to-record writing is unfinished.
- Reclamation of unreferenced built records and chunks, and complete native
  retained-memory attribution, are unfinished; append-only allocation is not
  reclamation.
- The final cutover retires the transitional object codec, the object
  projection and the compatibility options, once correctness and performance
  are accepted.
- The broader cutover outline also calls for native-only built trivia, parsed
  unit identity and native file parsing. Audit their live implementations
  before claiming the whole migration complete.
