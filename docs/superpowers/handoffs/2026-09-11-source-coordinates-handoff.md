# Source coordinates — handoff

Plan: `docs/superpowers/plans/2026-09-11-source-coordinates-plan.md`. Branch
`feat/source-coordinates`, stacked on `chore/napi-bump-cargo-lock` (PR #275).
Spec, now at its end state: `docs/superpowers/specs/2026-08-26-text-content-vs-source-provenance.md`
(Status: Realized). Ledger with every ruling:
`.superpowers/sdd/2026-09-11-source-coordinates-plan/progress.md`.

## What landed, per task

- **Task 1** — `SlotValue<T, ADJACENT>` keeps two arms, `Coord(NodeCoordinate)`
  and `Transport(T)`; `Verbatim` and `Node` are gone. The sink can `slice` a
  coordinate through the `SourceTable` it holds; an unknown tree is
  `CoordinateError::UnknownTree` with the handle in the message.
- **Task 2** — the word-character predicate has one source
  (`util/word-matcher.ts::wordCharClass`), shared by the emitted table and
  the fixed-literal join.
- **Task 3** — `RenderContext` (option table plus the engine's live trees) is
  an argument end to end; the `Prepare` trait resolves coordinates in the
  walk that fills sites; `FillOptions` is gone. Nothing is thread-local.
- **Task 4** — the transport structs dropped `$span`, `$nodeHandle`,
  `$childIndex`, `$source`, `$named`; decode dispatches on wire shape
  (`$nodeHandle` present → coordinate); a trivia entry is a coordinate too.
- **Task 5** — the projection folds by coordinate (`foldsToCoordinate` /
  `isUntouchedBelow` in `packages/common/src/transport-data.ts`);
  `markEdited` detaches the coordinate keys and leaves `$text`;
  `stripStructuralProvenance` replaced `stripStructuralNodeText`; the
  generated `isNode` and the supertype-collapse gate admit a coordinate.
- **Task 6** — the reader captures text only for kinds the model classes as
  `pattern` or `enum` (`ReadModel::is_text_kind`, generated per grammar),
  asking about both of an alias node's identities; every structural node
  carries a span and no text; the root spans the whole file.
  `sliceSpan`/`spanSlicer` in `@sittir/common` are the one byte-aware slicer
  (spans count UTF-8 bytes).
- **Task 7** — a slot's field-tagged separator is punctuation, not a member:
  `SLOT_SEPARATORS` (keyed by tree-sitter field name, `hasOptionalElements`
  slots excluded so array holes survive) feeds `ReadModel::is_slot_separator`.
- **Task 8** — a rebuilt list classifies the gaps between its still-parsed
  items into option values (`classify_list_gaps`, emitted at the start of
  each `prepare` body); leaves carry a coordinate at both read depths (shallow:
  parent handle + child index; deep: the tree's tag, no index); the transport
  resolver accepts every identity the parser can show as a member
  (`print`/`async`/`await` shown as `identifier`).
- **Task 9** (this task) — process-wide tree ids; the engine-identity gate;
  the byte axis; the fold rule for descendant trivia; the measurements below;
  the bench repaired.

## Rulings made in this task

- **Tree ids are process-wide.** Per-engine ids from 0 meant two engines each
  held a tree 0, so the cross-engine test could not fail. Every grammar's
  addon is its own linked image, so a counter in Rust static memory would
  still be one counter per addon: the napi engine claims each id from
  `globalThis.__sittirNextTreeId`, the one owner every addon shares
  (`engine::claim_tree_id_from` holds the rule; the in-image
  `claim_tree_id` serves engines built in Rust alone). Ids are never reused
  and both claims stay pinned once exhausted. Tests that assumed "this
  engine's first tree is 0" now read `treeId` from `parseAndRead`'s JSON
  (`tree-identity-and-verbatim.test.ts`); a rust node handed to a
  typescript engine is refused
  (`packages/tools/tests/cross-grammar-coordinate-identity.test.ts`).
- **A descendant's trivia never blocks a fold.** The first byte-axis run
  showed both deep reads diverging (rust: the blank line after a `//!` block
  moved, first difference at byte 310; typescript: tab indentation rendered
  as four spaces, first difference at byte 121). Neither was a writer defect:
  a comment anywhere below the root stopped the root from folding, so the
  whole tree went through the writer. A descendant's comments lie inside the
  ancestor's span and its bytes carry them; only a node's OWN trivia sits
  outside its span. `foldsToCoordinate` refuses own trivia, `isUntouchedBelow`
  asks for spans only. With that, every byte-axis case is green with no
  `it.fails` witness.
- **The bench was measuring exception throughput.** It read corpus nodes with
  the deprecated JavaScript reader and rendered them natively; under
  coordinates every such node names a tree the native engine never held, every
  render threw, and the loop counted throws as renders (the "×3" numbers first
  taken this task — ~250 000/s — were that). It now reads through each
  grammar's own engine, times two workloads (below), and a throw fails the
  run. `loadIsLeafKind` in `validate/common.ts` is the one derivation of the
  leaf-kind predicate the validator used inline.

## Gates

| gate | result |
| --- | --- |
| validate:native / history | rust 147 / 207 / 134 of 137, typescript 143 / 193 / 112 of 114, python 126 / 142 / 115 of 116 — identical to the baseline at every task |
| parity fixtures | roundtrip 1500 / 1486 / 1361 unchanged; render 1478 / 1412 / 1313 kept, the rest left out by class (source-spelled tight lists, unreachable standalone by design) |
| Gate 6 | `packages/rust/tests/coordinate-engine-identity.test.ts` — refused with `names tree N, which this engine does not hold` |
| byte axis | `packages/tools/tests/emit/dogfood-render-bytes.test.ts` READ_CASES: rust `sittir-core/src/render.rs`, typescript `packages/common/src/transport-data.ts`, python `tests/format-roundtrip/fixtures/python-4space.py` — shallow and deep, byte-exact |
| Gate 8 | `packages/typescript/tests/coordinate-gaps.test.ts` — blank lines kept after an append, `(a,x,c)` stays tight after a replace |
| cargo workspace | 134 passed (core 127) |
| vitest | full suite green (3 568 tests; two load-only flakes noted in the Task 8 entry pass alone) |
| tsgo, comment-slop `--working`, propose-14 | clean / clean / ratchet OK |

## Measured

**Wire** (rust, first 8 KB of `sittir-core/src/engine.rs`, 8 532 B; small =
the 44-byte `fn main() { let x = 1; let y = 2; }` on three lines):

| read | read wire | structural `$text` | other `$text` | crosses at render |
| --- | --- | --- | --- | --- |
| shallow, small | 217 | 0 | 0 | 94 |
| deep, small | 2 281 | 0 | 22 | 94 |
| shallow, 8 KB | 4 768 | 0 | 26 | 98 |
| deep, 8 KB | 160 329 | 0 | 1 713 | 98 |

The spec's "before" deep 8 KB read was 138 750 B with 32 206 B of structural
text. The deep read wire grew 15.6 %: every leaf now carries `$nodeHandle`
and `$span`, and comments travel as trivia entries with spans. What crosses at
render for an untouched tree is one coordinate, 98 B at either depth.

**Where render time goes** (`sample`, 8 s at 1 ms, a read → render loop over
the deep 8 KB root): the native call is 5.8 % of the wall; inside it
`SlotValue::from_napi_value` is 7 of 328 samples (2 %, down from 98.7 % of
the call in the sink handoff) and `napi_create_string_utf8` for the 8 KB
result is 322 of 328. The other 94 % is JavaScript: the projection walk over
the read tree (`toTransportData`) that decides the fold. Shallow root:
~70 000 renders/s; the same file read deep: ~6 300/s. The throughput lever is
no longer the transport crossing — folding removed it — but the projection
walk, which visits every object of a deep read to prove nothing changed. A
render by tree handle against the resident tree would skip that walk
entirely; a cheaper option is an edit flag the wrap layer maintains so an
untouched subtree is known without walking it.

**Bench** (`BENCH_ITERATIONS=200 pnpm exec tsx packages/cli/src/cli.ts tool bench`,
three runs, renders/sec):

| grammar | workload | nodes | run 1 | run 2 | run 3 |
| --- | --- | --- | --- | --- | --- |
| rust | coordinate (corpus roots, shallow) | 137 | 567 343 | 564 310 | 559 314 |
| rust | transport (parity render fixtures) | 1 412 | 95 134 | 100 983 | 100 004 |
| typescript | coordinate | 114 | 639 833 | 657 880 | 649 371 |
| typescript | transport | 1 478 | 93 330 | 92 719 | 91 078 |
| python | coordinate | 116 | 612 427 | 637 619 | 611 460 |
| python | transport | 1 313 | 118 167 | 119 598 | 116 945 |

Not comparable to the sink handoff's 164k / 164k / 175k: that workload was
shallow corpus roots carrying captured text through the verbatim fast path,
which no longer exists. The transport rows are full deep trees rebuilt from
templates; the coordinate rows are the slice path plus the projection walk of
a shallow root.

**Deep-read kind set.** The narrowing in `read-render-parse.ts` no longer
narrows anything: the `recursive` option already deep-reads every candidate,
and `adoptedVariantKinds` only chooses which candidates render inside a
reparse wrapper. Removing it changes no count, because it gates no read.
Recommendation: delete the wrapper-selection indirection when the validator
is next touched; the stale header comment that described a shallow `$text`
short-circuit is corrected in this task.

## Open, carried forward

- **typescript C-style `for` and its semicolons** — closed on the branch that
  follows this one: a literal that only some arms of a choice put beside a
  shared slot is written under a gate on the kinds the slot holds
  (`emitKindGatedLiterals`, `IfArm.kinds`, `KindTest` in the core), the
  reader drops a literal the parser field-tags beside a singular slot
  (`fieldTaggedLiteralTexts`), and the token's seam sits inside the arm that
  carries it (`withArmEdgeSeams`). The corpus now holds
  `for (let i = 0; i < 3; i++) { }`, which read-render-parse did catch once
  it was there; the blind spot was corpus coverage.

- `applyEdits` in `packages/common/src/edit.ts` slices an `Edit`'s byte
  positions as string indices (the native path applies bytes). Pre-existing;
  `sliceSpan` is the derivation to reuse.
- `model.irKeys` names hidden text kinds (`_string_content`) whose `ir` entry
  the emitter never binds — a factory-map orphan; the factory-source emitter
  hands such a kind's text to its parent instead.
- Load-only vitest flakes: `collect-baseline`'s CLI subprocess and
  `probe-kind-trace`'s manifest verification collide under the full suite;
  both pass alone.
- The `sittir-parity-tests` crate is dead on master (fixture schema and stale
  const names); untouched here.
- Per-tree render format is still out of scope; `render_transport_parts`
  still hardcodes `TransportSource::Factory`.

## Next

Render-options plan 4: `reformat`, `engine.ir`, `tree.options()` from the
classified gaps. Then the PR #266 / #267 items (strict surface; arm and slot
renames).
