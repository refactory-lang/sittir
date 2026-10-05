# Transport refresh: baseline re-taken, and a transport-macro probe (2026-10-04)

Measurements behind the transport refresh of
`docs/superpowers/specs/2026-10-01-shared-arena-design.md`, taken at master `106475358`
(`measure-heap.mts` also at `69b821c18`). The 2026-10-01 scripts and numbers in
`../2026-10-01/README.md` are left as they were (master `69b821c18`); this folder re-takes them on
the same input bytes and adds the probe. Release native build, Apple M4 Pro, Node 26.10.

## Tools

| file | what it does |
| --- | --- |
| `inputs/` | The three baseline inputs exactly as they were at `69b821c18` (`engine.rs` 24 766 B, `spacing.rs` 48 860 B, `create-engine.ts` 8 947 B), so only the code changes between runs. |
| `measure-boundary.mts` | `../2026-10-01/measure-boundary.mts` adapted to the current loader (`packages/<lang>/native/index.cjs`, module-level `disposeTree`) and `toTransportData(node, view)`: raw read, engine read and wrap, retained heap, untouched render. Its projection time uses `STORED_TRIVIA`, a lower bound: the engine's own trivia view also asks native for line gaps. Its heap line holds the root only, so it counts whatever a commit keeps reachable from it; compare commits with `measure-heap.mts`. |
| `measure-heap.mts` | Retained heap of fixed populations, runnable unchanged at either commit (it finds either loader and either `disposeTree`): the read data alone, a whole-tree parse untouched, walked with the root held, walked with every wrapped node kept, and a one-level parse walked with every wrapped node kept. Median of five after a warm-up, double gc. A whole-tree read passes `{ deep: true, depth: Infinity }`, so the script runs before and after `depth` replaces `deep`. The spec's verification of members on first access reads its untouched whole-tree row. |
| `function-item-heap.mts` | Today's heap per rust `function_item` read one level, split: the engine tree's read, the same read wrapped by `wrapNode`, what `ofType` yields; then the native reads made while wrapping (none) and the wrappers the node reaches, by kind. |
| `measure-rebuilt.mts` | `../2026-10-01/measure-rebuilt.mts` adapted the same way: rebuilt renders over the parity render fixtures, JS projection against the native call, per slot value. It runs unchanged at either commit: it finds either loader, and a one-argument `toTransportData` ignores the view it is passed. |
| `measure-layout.mts` | `measure-rebuilt.mts`'s two stages for one checkout, over populations that hold a layout change to like for like. The parity fixtures store the wire after projection, so each commit renders its own captured wire for the same cases (every render is checked against its expected output). Beside it: the same inputs with every layout key removed, the same JSON at every commit (its hash is printed to check); those inputs with an empty `$_layout` on every node, timed in alternation with them, which isolates what decoding a present layout costs; and the base checkout's inputs projected at this commit, whose trivia sits at the storage key every commit reads (re-projecting a commit's own fixtures copies a stored `$_layout` through untouched). One JSON line. |
| `layout-rounds.sh`, `layout-report.py` | Rounds of `measure-layout.mts` (and `measure-rebuilt.mts` before it, with `REBUILT=1`) over several checkouts, the order rotating each round; the checkout tagged `base` supplies the base-form inputs. The report gives each checkout's medians and its empty-layout decode cost per node, and against `base` the native call's per-round paired difference: over the fixtures' own wire, over the stripped inputs, and per layout-bearing node. |
| `loop-native.mts` | `../2026-10-01/loop-deep-read.mts` adapted: loops one native call so macOS `sample` can attribute it (`deep-read` or `render-fixtures`). |
| `top-of-stack.py` | Summarizes a `sample` file's "Sort by top of stack" section by library, idle waits left out. |
| `symbolize.py` | Attributes busy samples inside the stripped `.node` to functions, through the unstripped cargo dylib's `nm -n` table (same code layout). |
| `transport-census.py` | Counts a `transport.rs`'s transport structs, slot fields and enums, and the share of lines in napi `FromNapiValue`/`ToNapiValue` impls and in render functions. |
| `transport-types-census.py` | The spec's phase 0 census of a `transport.rs`'s choices (enums): how many each family holds (per-slot `*TransportSlot`, supertype `*Transport`, enum-kind `*Enum`), the distinct variant sets and distinct generated bodies (names normalized) they come to, how many nothing but their own items reference, the unit (fixed-literal) variants and one-literal choices, and the slot fields typed `AnyTransport`. |
| `slot-storage-dump.mts`, `slot-storage-census.py` | The dump writes every slot's stamped storage facts as JSON lines (the storage class `slot.storageInfo.kind`, the primitive classification, each value's storage); the census joins them with each field's Rust type in a `transport.rs` and counts the slots per storage class and type, showing how many encodings one storage class gets. |
| `generated-tables-census.py` | Counts every generated table the spec's Appendix B classifies, per grammar, in the checkout it is given (or the current directory): wrap projection against member lines, the route and set tables, `consts.ts` and `utils.ts` tables, `kind_ids.rs`'s constants and read tables, option sites, the node model, fixtures and the JS-only surface. Uses `transport-census.py` for `transport.rs`. |
| `proto/slot-derive/` | The probe's proc macro: `#[transport(kind = "…", wire = "words\|napi\|json\|all")]` on a struct whose fields carry `#[slot(field = "…")]`, `#[slot(kinds = […], tokens = […])]` or `#[trivia]`. Expands mechanically into the struct with a `kind_id` (`$type`) and storage keys `_<field>`, a one-level `TreeCursor` reader (tree → transport, children with structure as coordinates, leaves inline, anonymous tokens as kind ids), the arena record writer and reader, and the napi object and serde forms the `wire` names. |
| `proto/probe/` | A napi addon declaring rust `function_item` (eight slots, as `FunctionItemTransport` holds them) and `function_modifiers` through the macro. It compiles sittir's generated rust parser directly from the checkout. `Probe` reads them in batch and one node per call, in each wire form, decodes each form back (the render direction), and times the native read alone. `rt.rs` is the runtime the expansion calls: `Slot`, `Coord`, `Leaf`, route resolution, the child reader, the arena encoding. |
| `measure-proto.mts` | Runs the probe against today's engine on the same nodes: native read alone, each wire form (with the members a wrap would still attach), today's `$query().$descendants.ofType` read split into walk / read / wrap, retained heap (today's from one root parsed outside the measured window), and decode per form. |
| `proto/synthetic/`, `proto/gen_synthetic.py`, `proto/time-synthetic.sh` | Compile-cost probe: 395 kinds with 696 slots between them (rust's `transport.rs` shape), built under seven expansions with sccache off. |

## Commands

Run from the root of a checkout whose natives are built: each script measures the checkout in
`SITTIR_ROOT`, or else the current directory. `T` is this folder.

```bash
T=docs/superpowers/probes/2026-10-01-shared-arena/transport
pnpm exec tsx --expose-gc $T/measure-boundary.mts rust $T/inputs/engine.rs        # also spacing.rs; typescript create-engine.ts
pnpm exec tsx $T/measure-rebuilt.mts rust                                          # also typescript, python
pnpm exec tsx --expose-gc $T/function-item-heap.mts $T/inputs/engine.rs            # also spacing.rs

# heap, like for like: the same script, run from a checkout at each commit with its natives built
for co in <checkout at 69b821c18> <checkout at 106475358>; do (cd $co && SITTIR_ROOT=$PWD pnpm exec tsx --expose-gc $OLDPWD/$T/measure-heap.mts rust $OLDPWD/$T/inputs/engine.rs); done
# a layout change, like for like: checkouts at the commits compared, natives built, one tagged base
REBUILT=1 $T/layout-rounds.sh 6 out base=<checkout> head=<checkout> && python3 $T/layout-report.py out
pnpm exec tsx $T/loop-native.mts rust $T/inputs/engine.rs render-fixtures 14 &      # or deep-read
sample <node pid> 6 1 -file out.txt && python3 $T/top-of-stack.py out.txt sittir-rust
nm -n target/aarch64-apple-darwin/release/libsittir_rust.dylib > syms.txt && python3 $T/symbolize.py out.txt syms.txt sittir-rust | c++filt
python3 $T/transport-census.py rust/crates/sittir-{rust,typescript,python,scm,regex}/src/render/transport.rs
python3 $T/generated-tables-census.py                                              # spec Appendix B
python3 $T/transport-types-census.py rust/crates/sittir-{rust,typescript,python}/src/render/transport.rs   # spec phase 0
pnpm exec tsx $T/slot-storage-dump.mts rust > slots-rust.jsonl && python3 $T/slot-storage-census.py slots-rust.jsonl rust/crates/sittir-rust/src/render/transport.rs

cp Cargo.lock $T/proto/                                                           # the checkout's lock; not committed here
(cd $T/proto && CARGO_TARGET_DIR=$PWD/target cargo build --release --offline -p transport-probe)
pnpm exec tsx --expose-gc $T/measure-proto.mts $T/inputs/engine.rs                  # also spacing.rs
$T/proto/time-synthetic.sh                                                        # writes proto/synthetic/src/kinds.rs per expansion

# the real crate's build, with and without its napi code (sccache off)
touch rust/crates/sittir-rust/src/render/transport.rs && RUSTC_WRAPPER= cargo build --release -p sittir-rust --target aarch64-apple-darwin
touch rust/crates/sittir-rust/src/render/transport.rs && RUSTC_WRAPPER= cargo build --release -p sittir-rust --no-default-features --target aarch64-apple-darwin
```

## Results

### Baseline, back to back (same inputs; `69b821c18` in parentheses)

Measured on 2026-10-05, alternating commits per input: the `../2026-10-01/` script from a checkout at
`69b821c18`, then this folder's from a checkout at `106475358`.

| | rust engine.rs | rust spacing.rs | ts create-engine.ts |
| --- | --- | --- | --- |
| nodes in the deep read | 5 960 (5 961) | 16 435 (16 436) | 3 455 (3 455) |
| tree-sitter parse | 1.05 ms (1.10) | 3.11 ms (3.02) | 0.68 ms (0.66) |
| deep read, native | 18.17 ms (18.23) | 69.77 ms (70.26) | 8.28 ms (8.13) |
| deep wire | 837 933 chars, 33.8× (780 431, 31.5×) | 2 283 742, 46.7× (2 108 179, 43.1×) | 483 158, 54.0× (450 997, 50.4×) |
| `JSON.parse` of it | 2.31 ms (2.21) | 6.14 ms (5.76) | 1.23 ms (1.17) |
| shallow re-read of a live tree | 52.3 µs (52.8) | 35.7 µs (34.5) | 8.1 µs (8.0) |
| `engine.parse` shallow / deep | 1.14 / 31.76 ms (1.08 / 21.83) | 2.99 / 103.5 ms (2.95 / 79.3) | 0.69 / 14.59 ms (0.66 / 10.33) |
| parse + touch every accessor, shallow | 20.75 ms, 1 771 visited (24.10, 1 772) | 93.2 ms, 6 865 (95.9, 6 866) | 16.98 ms, 1 713 (19.49, 1 713) |
| parse + touch every accessor, deep | 34.13 ms, 3 272 (31.97, 3 191) | 110.0 ms, 9 499 (104.0, 9 594) | 16.32 ms, 2 109 (17.26, 2 088) |
| per visited node, shallow / deep | 11.7 / 10.4 µs (13.6 / 10.0) | 13.6 / 11.6 µs (14.0 / 10.8) | 9.9 / 7.7 µs (11.4 / 8.3) |
| heap held by the walked deep tree, root only (`measure-boundary`) | 6 384 KB, 1 998 B/node (993 KB, 319 B) | 17 784 KB, 1 917 B (2 754 KB, 294 B) | 3 733 KB, 1 813 B (533 KB, 262 B) |
| untouched render, shallow; projection | 29.4 µs; 1.3 (29.9; 2.9) | 44.5 µs; 1.0 (46.7; 2.2) | 8.8 µs; 1.0 (13.6; 2.1) |
| untouched render, deep; projection share | 365.7 µs; 95 % (365.4; 90 %) | 989.6 µs; 95 % (1 130; 92 %) | 221.7 µs; 95 % (310.2; 96 %) |

The native read and its wire cost the same at both commits; a deep `engine.parse` costs 31–45 %
more at `106475358`, where each wrap wraps the children a read expanded (below). The timings
recorded on 2026-10-01 at `69b821c18` (`../2026-10-01/README.md`) do not reproduce at that commit:
its deep read of `engine.rs` was 42.9 ms then and is 18.2 ms now. Only pairs measured in one
sitting are compared. The first run at `106475358`, on 2026-10-04, is within 9 % of these.

The root-only heap row does not compare the two commits: it counts what each keeps reachable from
the root. At `69b821c18` a slot held its read data and each accessor call built a fresh wrapper that
nothing kept (`hydrateChild` → `wrapNode`), so the row counted read data; at `106475358` each
`wrap<Kind>` stores `storeExpanded(...)`, every expanded child that holds slots already wrapped, so
the row counts wrappers.

Heap, like for like (`measure-heap.mts`, the same script at both commits; 2026-10-01 in parentheses):

| population | rust engine.rs | rust spacing.rs | ts create-engine.ts |
| --- | --- | --- | --- |
| read data alone: `JSON.parse` of the deep wire | 1 069 KB (1 028) | 2 706 KB (2 630) | 587 KB (568) |
| deep parse, untouched | 7 118 KB (1 096) | 18 254 KB (2 801) | 4 005 KB (610) |
| deep parse, walked, root held | 7 140 KB (1 117) | 18 303 KB (2 864) | 4 020 KB (623) |
| deep parse, walked, every wrapped node kept | 8 015 KB (10 317) | 20 344 KB (27 635) | 4 510 KB (6 237) |
| … per wrapped node | **2 508 B (3 311)** | **2 193 B (2 950)** | **2 190 B (3 059)** |
| shallow parse, walked, every wrapped node kept, per wrapped node | 2 526 B (5 699) | 2 077 B (4 039) | 2 074 B (3 696) |
| wrapped nodes the deep walk reaches | 3 272 (3 191) | 9 499 (9 594) | 2 109 (2 088) |

Per wrapped node master holds 24–28 % less than `69b821c18`, where `withMethods` added `$render`,
`$toEdit` and `$replace` after the literal was built and defined a `$trivia` getter on each node.
The read data barely moved (+3–4 %). The wrapped tree holds 7.5–7.7 times its read data. On master,
"root held" against "every wrapped node kept" differs by the leaves: `storeExpanded` skips a node
without slots and `hydrateChild` wraps it afresh on each access. The root-only figures here sit
9–14 % above `measure-boundary`'s (median of five after a warm-up and double gc, against one
sample after the timing loops).

Rebuilt render over the parity fixtures, per slot value, JS projection + native call, back to back
on 2026-10-05: rust 332 + 523 ns (273 + 353), typescript 311 + 576 (254 + 393), python 320 + 532
(262 + 372); projection 39 / 35 / 38 % of the wall. Unlike the read, the native call grew about 45 %
since `69b821c18`.

Profiles (`sample`, busy samples):

- **Rebuilt render, the native call (rust):** V8 65.0 %, `napi_*` 10.7 %, memmove/strlen 11.1 %,
  the addon (sittir prepare and render, napi-rs glue) 7.4 %, malloc/free 4.0 %. The runtime's
  property and string work is about three quarters of the call; with the projection at 35–39 % of
  the wall, napi decode is nearly half of a rebuilt render.
- **Deep read (rust):** the addon 91.4 %, of which `ts_node_child_iterator_next` 69.1 %,
  `ts_node_child_with_descendant` 22.8 %, `ts_tree_cursor_child_iterator_next` 2.7 %, serde_json
  1.3 %. Tree-sitter navigation is about 87 % of the read: `node.child(i)` walks from the first child
  on every call, and handle resolution descends from the root.

`transport.rs` (lines; transport structs; slot fields; enums; napi From/To impl lines; render fns):

| grammar | lines | structs | slots | enums | napi impls | render fns |
| --- | --- | --- | --- | --- | --- | --- |
| rust | 94 326 (4.87 MB) | 395 | 696 | 162 | 43.0 % | 4.4 % |
| typescript | 118 311 (6.33 MB) | 400 | 740 | 256 | 45.1 % | 3.5 % |
| python | 61 765 (3.06 MB) | 284 | 478 | 95 | 42.2 % | 4.3 % |
| scm | 11 096 (0.50 MB) | 52 | 83 | 28 | 44.2 % | 4.8 % |
| regex | 12 753 (0.56 MB) | 81 | 101 | 19 | 46.9 % | 4.2 % |

The 2026-10-01 shares (50.9–56.3 %) were counted another way; these count impl blocks only.

### The probe: rust `function_item`, read one level (engine.rs 37 nodes; spacing.rs 99)

| | engine.rs | spacing.rs |
| --- | --- | --- |
| native typed read, per node, beyond the walk | ≈ 260 ns | ≈ 300 ns |
| the whole-tree cursor walk, per match | 6.2 µs | 7.1 µs |
| read one node at its row (`goto_descendant` + read) | 0.93 µs | 1.01 µs |
| one node per call, crossing + members: napi objects / JSON / arena words | 4.1 / 4.3 / 3.5 µs | 4.1 / 4.3 / 3.7 µs |
| every match in one call, crossing + members: objects / JSON / words | 9.9 / 9.4 / 7.9 µs | 10.0 / 10.1 / 8.9 µs |
| today, per match: kind-filtered walk + one-level read and `JSON.parse` + wrap and query plumbing | 6.7 + 38.5 + 18.7 = 64.0 µs | 7.9 + 26.4 + 10.1 = 44.4 µs |
| render direction, native decode per node: objects / JSON / words | 1 651 / 958 / 52 ns | 1 403 / 832 / 54 ns |
| JSON.stringify before the JSON decode | 250 ns | 178 ns |
| retained JS heap per node, members attached: objects / JSON / views | 4 628 / 4 659 / 3 702 B | 4 588 / 4 611 / 3 694 B |

The three forms carry the same transports (compared with absent options dropped and keys sorted:
napi objects leave an absent option out, JSON writes `null`).

Today's heap per `function_item` read one level (`function-item-heap.mts`; `measure-proto.mts` gives
the same with one root parsed outside its window, 17 905 / 10 438 B):

| | engine.rs | spacing.rs |
| --- | --- | --- |
| the engine tree's one-level read | 4 654 B | 2 696 B |
| the same read wrapped by `wrapNode` | 17 094 B | 9 853 B |
| what `ofType` yields | 17 086 B | 9 853 B |
| native reads while wrapping | 0 | 0 |
| wrappers reached | 37 `FunctionItem`, 73 `LineComment`, 73 `LineCommentDocOuter` | 99 `FunctionItem`, 73 `LineComment`, 70 `LineCommentDocOuter` |

The query adds nothing; the wrap does. A `function_item`'s read carries the comments it owns, and
the wrap wraps each comment twice, as the comment and as its variant form. Solving the two files
for the two unknowns: about 2.1 KB a comment wrapper and 4.1 KB for the `function_item`'s own
wrapper, beyond the read. The engine tree's read is 1.3 KB (engine.rs) above a bare `JSON.parse`
of the same wire (3 312 B): `holdReadTree` gives every read object the tree token and enters it in
the `readObjects` weak set. The probe's forms store the
node's comments as nothing (it records only extras among its own children), so the heap row above
compares the three wires, not a wire with today's engine.

What the probe leaves out: trivia ownership (it records only the extras among a node's own
children), alias envelopes, token interiors, list owners, group seats, and typed content per kind
(a leaf is generic). The reader routes by field and by kind, stores anonymous keyword tokens as kind
ids, and reads leaves inline.

### Build cost

- `sittir-rust`, clean rebuild with dependencies built, sccache off: **48.4 s, 1.95 GB peak** with
  its napi code; **17.6 s, 857 MB** with `--no-default-features` (no `napi-bindings`). The napi derive
  and the emitted napi impls are about 64 % of the crate's compile time.
- Synthetic 395 kinds / 696 slots, release, sccache off (two runs, second shown):

| expansion | seconds |
| --- | --- |
| plain structs | 0.46 |
| `#[napi(object)]` (today's derive) | 5.8 |
| `#[napi(object)]` + serde | 8.4 |
| `#[transport]`, reader + arena words | 3.6 |
| `#[transport]`, + napi object | 10.6 |
| `#[transport]`, + serde | 6.6 |
| `#[transport]`, all three wires | 13.9 |

### Phase 0: one layout field, and decoders reading by static keys

Measured on 2026-10-05 with `layout-rounds.sh`: release natives, six rounds rotating the checkouts
in one sitting, medians. Rebuilt render, JS projection + native call per slot value, at
`69b821c18`, the phase 0 branch base `ccb370d67` and its head `0575d6069`:

| grammar | `69b821c18` | `ccb370d67` | `0575d6069` |
| --- | --- | --- | --- |
| rust | 268 + 340 | 325 + 486 | 320 + 348 |
| typescript | 254 + 372 | 302 + 542 | 300 + 398 |
| python | 264 + 364 | 314 + 512 | 308 + 368 |

Each commit renders its own fixtures; `69b821c18`'s are slightly different populations (26 402 /
27 845 / 19 145 slot values against 26 363 / 27 873 / 19 086). The native call's growth since
`69b821c18` came from two per-node costs, each measured against `ccb370d67`:

| | rust | typescript | python |
| --- | --- | --- | --- |
| one `$_layout` field for four always-read properties (`7e9f0b4d1`): native call, paired per round | −85 | −101 | −79 |
| … over the inputs with layout keys stripped (the same JSON at both commits) | −101 | −110 | −112 |
| a present layout's decode per node, keys through `Object::get(&str)` (`7e9f0b4d1`) | 150 | 155 | 161 |
| … the same three keys static | 110 | 115 | 120 |
| every decoder's keys static (`0575d6069`): native call, paired per round | −141 | −147 | −152 |
| … over the stripped inputs | −141 | −151 | −153 |

A present layout's decode is the empty-layout population (an empty `$_layout` on every node, passes
alternated with none); at `ccb370d67`, which reads no `$_layout`, it costs 1–3 ns. The JS projection
is unchanged by either commit: the base's fixtures projected at `0575d6069` and at `ccb370d67` take
317 / 298 / 306 and 312 / 302 / 307 ns per slot value. Against `69b821c18`, the native call is within
1–7 % and the projection 17–19 % above.
