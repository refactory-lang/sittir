# Public eager record builders

The packed AST and arena-tables documents govern this work: the shared-arena
design (§ Packed AST is definitive, § The wire, § Render, § Trivia) and the
arena-tables plan's cutover outline ("Eager immutable built records are
required"). The private construction probe in
`docs/superpowers/probes/2026-10-12-record-wire/eager/` is the prototype, not
public cutover evidence.

## Accepted boundary

- **One generator, two construction backends.** Each raw builder emits its
  shared prelude once: normalization, coercion, admission and checks. It then
  constructs either the object node or the record. The object construction
  comes from `factories.ts` and the record stores from `factory-record.ts`.
  Both are fed one structured construction contract. Neither backend reads
  the other's source text.
- **The engine picks the backend through its handle.** An arena engine's
  handle carries its built arena. A builder reads the handle it runs under
  (`inEngine`). Every route reaches the raw builders inside an engine scope,
  so each stays in that engine's backend with no second module graph and no
  dispatcher. The routes are coercion, bundles, overlays, IR, `from` and a
  parsed node's `$with` rebuild.
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

- [ ] **Construction contract and built-only records.** A structured
  `FactoryConstruction` carries kind discriminant, slot values and list
  options; object output stays byte-identical in all five grammars. The shared
  runtime covers chunks, allocation and interning. Record stores cover every
  constructible kind whose children are built: compounds, lists, text leaves,
  refinement forms and units. Built views read them back. Tests compare each
  record's accessors with the object builder's over the corpus.
- [ ] **Native render bridge.** Every addon renders JS-owned chunks borrowed per call,
  with admission. Render bytes match the object path over the corpus.
- [ ] **Parsed links, trivia and edits.**
  - Built records hold parsed children by link, including children read by
    another engine of the same language.
  - Written sides go to the native store.
  - `$with` shares unchanged children and copies bounded ones.
  - Cover disposal, growth and invalid buffers.
- [ ] **Switch.** Arena engines build records. Prove that construction calls no
  object builder or serializer. Benchmark metadata names the construction
  backend. Both storages' complete validation history must be unchanged, and
  the corpus comparison runs in CI.

## Measurement

Every slice is measured with the `Arena benchmarks` workflow, not local runs.
Pushing a commit to a `bench/<name>` branch runs the whole workflow; on
master it can also be dispatched for one benchmark.

- **Corpus job.** `sittir tool bench-storage --validation` pairs object and
  arena engines over the complete validation buckets. Its factory and IR
  buckets time construction (`build`) and render on each storage. From the
  render bridge until the switch, `--construction records` gives the arena
  arm's engines their built arena, so the same buckets compare the record
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
