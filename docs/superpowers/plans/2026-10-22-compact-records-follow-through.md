# Complete the remaining record-layout corrections

The existing arena-tables plan and shared-arena design govern this work on
`feat/records`. This follows through on the unfinished items in the earlier
implementation audit; it does not change the packed-AST destination.

Already delivered: literal public accessor indices, one construction cursor,
per-arena built-text deduplication, and original builder-string retention.

- [x] Generate direct stores for eager construction and immutable edits.
  Slot offsets, widths, flags, admitted payload forms and list strides come
  from the canonical model/layout. Generic per-slot writer/encoder dispatch
  disappears. Shared helpers retain allocation, ownership and text interning.
  A functional regression poisons the old generic writer and covers both modes.
- [x] Stamp bounded-child inline storage in the shared layout pass. Native
  writing, admission, rendering, JavaScript decoding/accessors and eager
  construction consume the same facts. Recursive children and list runs retain pointer forms; cached parsed children
  retain their canonical row through coordinate links. Preserve lazy reads, record
  immutability, provenance, side metadata, and retained views across growth.
- [x] Add focused inline-versus-pointer footprint and correctness cases,
  including variant widths, absent children, nested children, shared inputs,
  malformed/truncated cells, chunk boundaries, and immutable replacement.
- [x] Regenerate all five grammars. Run targeted checks, full unit suites,
  types/lint and complete object/arena validator baseline comparisons. Preserve
  all failing states for review; never edit generated outputs by hand.
- [x] Rebuild and freeze an isolated measurement copy; rerun paired eager
  pipelines and retained-memory measurements under the idle gate. Publish
  absolute results, capacity/slack and remaining regressions; preserve prior data.
- [x] Add manual, non-gating CI workflows for eager and complete corpus
  measurements, with shared setup, raw artifacts and provenance checks.
- [ ] Complete the fresh full corpus timing run in CI when requested; the local
  rerun was stopped during the move to CI and supplies no aggregate result.

Public eager-builder cutover, reclamation and complete native attribution remain
separate open requirements. Benchmark completion does not mark those complete.

Native parsed hydration still reads typed Rust nodes before writing records.
It creates no intermediate JavaScript AST; this milestone does not replace that
native reader/writer bridge with a direct Tree-sitter-to-record writer.
