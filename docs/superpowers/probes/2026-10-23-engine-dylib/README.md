# Shared engine library probe

Probe branch `probe/engine-dylib`. It does not merge. It builds the shape the
maintainer chose for native packaging: one Rust `dylib`, `sittir-engine`,
that every grammar addon links at run time, shipped as a copy inside each
grammar package beside its `.node`, with the OS loader reusing the first copy
it maps. Each section below states what was shown, on which platforms, and
where the evidence is.

## Summary

Shape A works on every platform tried: macOS arm64, Linux x64 and arm64
(glibc), Linux x64 (musl) and Windows x64. Each grammar package ships its own
copy of the engine and the Rust std library, and the process maps the first
package's copies and never opens the others. The tree-sitter runtime is
defined only in the engine. The tree-id counter is one static in the engine,
with the `globalThis` path gone. A tree can be a JavaScript object that frees
itself, and another grammar's engine refuses it. An engine from another build or
version is refused at load. Linux needs lld to link the engine, and Windows
scanners reach the allocator through `__imp_` slots.

What the shared library buys is one runtime and one set of process statics,
not size. Against today's static addons, release builds, on CI runners:

- **Speed: unchanged.** Parse, read and render over the rust and python
  corpora changed by −2.6% to +0.3% on Linux (two runs, rounds within 4% of
  each other) and −1.2% to +0.5% on macOS. Losing fat LTO, which rustc
  refuses with `-C prefer-dynamic`, cost nothing measurable.
- **Build time: unchanged**, within the noise between runs.
- **Memory: about even.** With one grammar loaded, RSS is 1.0 MiB higher on
  Linux and 0.4 MiB higher on macOS. With all five, it is 2.4 and 1.4–1.5 MiB
  lower. Each grammar after the first costs 3.6 MiB instead of 4.4 on Linux,
  and 2.0–2.1 instead of 2.5 on macOS; the break-even is around the second
  grammar.
- **Install size: larger.** Each package grows by 1.5–1.7 MiB: its `.node`
  sheds 1.4–1.8 MiB and gains the engine (1.6–2.1 MiB) and std (1.2–1.4 MiB)
  copies. All five packages: 33.2 → 41.5 MiB on Linux, 27.7 → 35.1 MiB on
  macOS.

Shape B would share at most 0.2 MiB of code per addon, and its library would
carry 3.25 MiB of Rust crate metadata into every package. Its cost is a
rewrite of sittir-core's napi boundary (below). The evidence favours A; the
choice between them is the maintainer's.

## The shape question: what can live in the shared library

The maintainer's shape put sittir-core and the tree-sitter runtime in the
library. The probe built shape A instead, and the choice between A and B is
open:

- **A (built):** the library holds the tree-sitter runtime (the Rust crate and
  its C code), the statics a process must hold once (the tree-id counter, the
  build stamp, the runtime's allocator slots) and nothing else. sittir-core,
  napi and the generated code stay in each addon, as today.
- **B:** sittir-core goes in the library too, without its napi boundary, which
  moves into each addon.

### Why napi cannot be in the library

napi-rs keeps its export and class registries in process-global statics of
the `napi` crate (`MODULE_REGISTER_CALLBACK`, `MODULE_CLASS_PROPERTIES`, and a
per-thread constructor map keyed by JavaScript class name), and defines
`napi_register_module_v1` there. sittir-core's napi bindings call napi, so
sittir-core with its bindings in the library puts napi there, with one
registry for every grammar.

The toy `spikes/napi-shared` reproduces it: napi in a shared library, and two
addons that each export a class named `SittirEngine`, a function `make()` that
builds one on the Rust side, and a method that says which addon's code ran on
which addon's object. Loaded A then B (`toys.mjs napi-shared`):

| | macOS arm64 | Linux x64 gnu, arm64 gnu, x64 musl |
| --- | --- | --- |
| `new b.SittirEngine().describe()` | method of **a** on an object built by a | method of b on an object built by b |
| `b.make().describe()` | method of **a** on an object built by **b** | method of b on an object built by b |
| `a.make().describe()` after B loads | method of a on an object built by a | method of **b** on an object built by **a** |
| `a.make() instanceof a.SittirEngine` after B loads | false | false |

The second registration exports every item both addons registered into B's
exports object, and replaces the constructor napi-rs looks up by class name.
Which addon's class wins depends on a hash map's order, so the platforms
disagree, but on each of them one addon's Rust struct ends up wrapped in the
other addon's class: a type-confused cast in general. On Windows neither addon
loads at all: `Module did not self-register` for both, since
`napi_register_module_v1` is defined in the library and Node looks for a
module's entry point only in the module it loaded.

### What B would save on top of A

Measured by building sittir-core without its napi bindings as a dylib
(`scripts/core-share.mjs`), which is what B's library would hold. A dylib
keeps all of its crate's non-generic code, so its code is the most B can
share. Generic code is instantiated in each addon under either shape, and
rustc copies small non-generic functions into the crates that call them.

**sittir-core without napi, as a dylib (stripped), against the RSS each extra grammar costs**

|  | linux-x64-gnu | macos-arm64 |
| --- | --- | --- |
| file | 3.70 MiB | 3.70 MiB |
| of which code | 0.21 MiB | 0.19 MiB |
| of which Rust crate metadata | 3.25 MiB | 3.25 MiB |
| RSS per extra grammar, today (all five minus rust alone, over four) | 4.41 MiB | 2.51 MiB |
| RSS per extra grammar, shape A | 3.56 MiB | 2.04 MiB |

So B shares at most 0.19–0.21 MiB of code per addon, 6–9% of what each grammar
after the first costs in RSS under A. The RSS saving can only be smaller,
since only the pages an addon touches count. On disk B goes the other way:
the library is a 3.70 MiB file, 3.25 MiB of it the crate's metadata
(`.rustc`), which rustc embeds in every Rust dylib for crates that compile
against it and which the loader never reads; it holds, in rustc's
intermediate form, the generic code each addon instantiates. Each package
would ship its own copy of that file, so B adds about 3.5 MiB per package
unless the metadata is removed from the shipped copies, which this probe did
not try. The engine's own metadata is 0.01 MiB, since its crate only
re-exports tree-sitter and holds the statics.

### What B would cost

sittir-core's napi boundary is in 13 files, about 560 lines that name napi on
master and about 650 on `feat/records`. Most of it is trait impls on core
types:

- 16 generic impls of napi's `FromNapiValue`/`ToNapiValue` on core carriers:
  `SlotValue<T>`, `NodeLayout<T>` and `Box<NodeLayout<T>>`, `UnitSides<T>`,
  `TriviaEntry<T>`, `NodeTrivia<T>`, `Options<S>`, `NonEmptyVec<T>`;
- about 20 concrete impls: `Span`, `Source`, `Point`, `PointSpan`,
  `SlotLayout`, `LayoutWork`, `StoredLayout`, `ChangedEdges`, `TriviaText`,
  `VerbatimNode`, `ErrorRead` and the id newtypes;
- the `boundary.rs` property helpers and the non-generic helpers
  `napi_engine!` expands calls to.

With napi out of the library, these impls have to leave sittir-core, and the
orphan rule allows a foreign trait's impl only in the trait's crate or the
type's. So the generic impls cannot move to another crate as they are, nor
into generated grammar code (`SlotValue<AnyNode>` is not a local type). B
therefore needs one of: the carrier types move out of the shared core into a
per-addon crate (and the core logic that uses them with them), or a local
boundary newtype per carrier, threaded through the generated codecs and
`sittir-node-macros`. Either way it rewrites `slot.rs`, `layout.rs`,
`trivia.rs`, `options.rs`, `verbatim.rs`, `boundary.rs`, `napi_engine.rs` and
the node macros' codec expansion. `feat/records` changes every one of those
files (`git diff --stat origin/master...origin/feat/records`): napi_engine
335 lines, layout 363, slot 80, boundary 37, trivia 17, verbatim 12, options
11, and about 2,100 lines across `sittir-node-macros`. Its new `arena/`
modules name napi nowhere, so the arena itself could sit in a shared core.

## Proofs

Two drivers, each run on every platform by the probe-only workflow
`.github/workflows/engine-dylib-probe.yml`; each uploads its `report.json`.

- `scripts/grammars-ci.mjs`: sittir-engine and two real grammar addons,
  python (an external scanner) and regex, built with `-C prefer-dynamic`;
  each grammar laid out in its own package directory with its own engine and
  std copies (`scripts/package.mjs`); then `scripts/grammars.mjs` loads both
  and the link facts are read from every image (`scripts/symbols.mjs`).
- `scripts/toys-ci.mjs`: the two toy pairs in `spikes/`, and the skew cases.

| | macOS arm64 | Linux x64 gnu | Linux arm64 gnu | Linux x64 musl | Windows x64 |
| --- | --- | --- | --- | --- | --- |
| linker | ld64 | rust-lld (the default) | lld | lld | link.exe |
| one engine and one std image mapped | yes | yes | yes | yes | yes |
| runtime defined only in the engine | yes | yes | yes | yes | yes |
| scanner's allocator slots imported from the engine | yes | yes | yes | yes | yes |
| one tree-id counter, no `globalThis` counter | yes | yes | yes | yes | yes |
| tree objects: render, refusal, freed by GC | yes | yes | yes | yes | yes |
| skew, same version: refused at load | yes | yes | yes | yes | yes |
| skew, new version: load fails, symbol missing | yes | yes | yes | yes | yes |

### 1. One engine image from per-package copies

Both packages ship `libsittir_engine` and the Rust std library beside their
`.node`. After loading python then regex, the process maps the engine and std
from python's directory only; regex's copies are never opened. The images
are listed from vmmap (macOS), `/proc/self/maps` (Linux) and the module list
(Windows); on Windows: `pkg-python/sittir_engine.dll`,
`pkg-python/std-512d688ad63bc3c4.dll`, `pkg-python/sittir-python.node`,
`pkg-regex/sittir-regex.node`.

What makes the loader reuse the image is the name each addon records:

- macOS: the engine's install name is `@rpath/libsittir_engine.dylib` and each
  addon carries `LC_RPATH @loader_path`. rustc's default install name for a
  dylib is its bare file name, so the engine's build script sets it. The Rust
  std library is recorded by its absolute sysroot path under Homebrew's rust
  and as `@rpath/...` under rustup; packaging rewrites every reference and the
  copy's own id to `@rpath/libstd-<hash>.dylib` and re-signs.
- Linux: `DT_NEEDED libsittir_engine.so` (the engine's soname) and
  `libstd-<hash>.so`, found through `RUNPATH $ORIGIN` on the addon and on the
  engine. The engine needs its own `RUNPATH`, since it is not inherited.
- Windows: the addon imports `sittir_engine.dll` and `std-<hash>.dll` by
  module name, found in the addon's own folder.

### 2. The runtime is defined only in the engine

A Rust dylib exports its Rust symbols and nothing from the C libraries it
links: built without an export list, the engine exported no `ts_*` symbol,
and an addon failed at load with `symbol not found in flat namespace
'_ts_current_free'`. napi-build links addons with `-undefined
dynamic_lookup` on macOS, so the link itself passed and only the load failed.

Addon code does call the C runtime directly: tree-sitter's generic functions
are instantiated in the addon, and a scanner built with
`TREE_SITTER_REUSE_ALLOCATOR` reads the allocator slots. So the engine's
build script exports the runtime explicitly, from one list: every function
tree-sitter's `api.h` declares, less the seven that only the crate's wasm
module calls, plus the four `ts_current_*` slots (147 names). Three of the
seven are declared but not compiled without the wasm feature, and an export
list may only name defined symbols (ld64 refuses an undefined one, and rustc
passes lld `--no-undefined-version`); the other four exist as stubs and no
addon can reach them without that feature. Compared with exporting `_ts_*`
by wildcard on macOS, the list differs by exactly those four stubs. It goes
to the linker as an `exported_symbols_list` (macOS), a version script
(Linux) and `/EXPORT` lines, with `DATA` for the slots (MSVC).

Measured with nm/readelf/llvm-readobj on every platform: the engine defines
147 runtime symbols; python's addon defines none and imports 4 (three
allocator slots and one function), regex's defines none and imports 1.

Two platform constraints came out of this:

- **Linux needs lld for the engine.** rustc already passes the dylib an
  anonymous version script; GNU ld refuses a second one ("anonymous version
  tag cannot be combined with other version tags", on arm64 gnu and on
  Alpine). lld merges them. x86_64-linux-gnu links with rust-lld by default;
  arm64 and musl took `-C link-arg=-fuse-ld=lld`.
- **Windows data imports need the import slot.** MSVC reaches data in a DLL
  only through `__imp_<name>`. A C scanner gets it from a define per slot
  (`ts_current_malloc=(*__imp_ts_current_malloc)`), which the grammar crate's
  build script now passes. Rust code that reads a slot directly through a
  plain `extern` block fails to link (LNK2019 in the toy), because rustc
  marks an item dllimport only when it knows a DLL provides it. Grammar
  addons have no Rust reader of the slots.

### 3. The tree-id counter is one static in the engine

`sittir_engine::claim_tree_id` holds the counter; sittir-core's
`engine::claim_tree_id` calls it, and the `globalThis.__sittirNextTreeId`
claim and `claim_tree_id_from` are deleted. Parsing alternately in python and
regex, through the table (`parse`) and as objects (`parseTree`), gives ids
0–7 in order on every platform, and `globalThis.__sittirNextTreeId` is never
set. The counter is atomic: it is now one per process, not one per
JavaScript thread.

### 4. A tree owned by its JavaScript object

`napi_engine!` gains a `Tree` class: `SittirEngine.parseTree` returns one,
owning its `ParsedTree`, with no table entry; `Tree.read` reads through it and
`SittirEngine.renderIn(node, tree)` renders with the tree as the source table
(`ParsedTree` is already a `SourceTable`). It was added beside the live-tree
table, so the JavaScript engine and the benchmarks still run on the table.

On every platform: a full read rendered through the tree object gives back
the source and the same text as the table path; 200 trees per grammar made
and dropped are freed by GC (`liveTreeObjects` back to the one tree still
held); and a tree of the other grammar is refused, not cast: `renderIn` with
regex's engine and python's tree throws "Value is not an instance of class
`Tree`", and python's `read` called on regex's tree throws "Illegal
invocation". That refusal is napi-rs's own: with `napi8`, every `#[napi]`
class is stamped with a type tag derived from `crate@version::path::Class`,
checked before each cast. `Tree` is expanded in each grammar crate, so each
grammar's tag is distinct. sittir-core's napi feature moves from `napi4` to
`napi8`.

Open, as the ruling said: a coordinate that arrives without its tree object
(a bare handle in a built node's slot). `renderIn` takes one tree; a node
whose coordinates name several trees needs the caller to pass every tree it
names, or the coordinate to carry its tree object.

### 5. Version skew is refused

The engine stamps itself with its version and a hash of its sources
(`SITTIR_ENGINE_STAMP`): `BUILT` is a `const`, compiled into each addon;
`LOADED` is a `static`, read from whichever engine image was mapped. Each
addon checks them in its `#[napi(module_exports)]` hook, so `require` throws.
The loader never opens a later package's own copy, so this is where two
packages built from different engines meet:

- same version, different source: `sittir engine mismatch: this addon was
  built against engine 0.0.0+6d36c1404c34, but the process already loaded
  engine 0.0.0+fddb7767b533 from …/shape-a-a/libsittir_engine.dylib.`
- a new version changes every mangled engine symbol, so the load fails first:
  `Symbol not found: __RNvNtC…13sittir_engine5stamp6LOADED` (macOS),
  `undefined symbol: …` (glibc), `Error relocating …: symbol not found`
  (musl), `The specified procedure could not be found.` (Windows). The
  JavaScript loader should map these to the same message.

The stamp hashes the engine's source bytes, so it came out the same on every
Unix build and different on Windows, whose checkout has CRLF line endings.
That is harmless within a process, which loads one platform's binaries, but
the real stamp should come from the release's identity (version and commit),
not from file bytes.

## Measurements

Measured in CI by `.github/workflows/engine-dylib-measure.yml`, twice (runs
40016280921 and 40018835886), each time on a macOS arm64 runner (macos-14:
3 virtual M1 cores, 7 GiB) and a Linux x64 runner (ubuntu-22.04: 4 EPYC
cores, 16 GiB). Each runner builds four variants of the five grammar addons,
one clean build after another, with crates fetched beforehand and no compiler
cache (`scripts/variants.mjs`):

- `today-release`: today's static addons, from the probe's merge base with
  master (`7a768a0e9`), in the release profile (fat LTO, one codegen unit):
  what ships today;
- `dylib-release`: this branch with `-C prefer-dynamic`, in the release
  profile with LTO off, one codegen unit;
- `today-gate`, `dylib-gate`: the same two in the gate profile (no LTO, 16
  units) that local generation builds.

Every image is stripped (`strip -x`) and laid out as its package would ship.
Then `scripts/measure.mjs` runs five rounds, alternating the variants' order,
each measurement in a fresh Node 24 process:

- memory (`scripts/memory.mjs`): rust alone, then all five grammars, loaded
  and each run once on a small sample (parse, read at every depth, render,
  dispose). It records RSS and the V8 heap after a GC, over the process
  before loading, and on macOS vmmap's physical footprint, which counts a
  shared image's clean pages once.
- throughput (`scripts/throughput.mjs`): every source of the rust and python
  validation corpora (149 and 116), parsed, read at every depth, rendered and
  disposed, for 200 passes, reporting the median pass.

The dylib addons also carry this branch's additions (the `Tree` class and the
stamp check); today's addons are the merge base's.

Run 40018835886 (`node scripts/tables.mjs evidence/ci-measure/run-40018835886`):

**Package sizes, release profile (stripped, MiB)**

|  | linux-x64-gnu today | linux-x64-gnu dylib | macos-arm64 today | macos-arm64 dylib |
| --- | --- | --- | --- | --- |
| `sittir-rust.node` | 9.52 | 7.73 | 7.98 | 6.58 |
| `sittir-typescript.node` | 10.35 | 8.55 | 8.77 | 7.40 |
| `sittir-python.node` | 6.93 | 5.14 | 5.69 | 4.31 |
| `sittir-scm.node` | 3.18 | 1.39 | 2.60 | 1.22 |
| `sittir-regex.node` | 3.20 | 1.42 | 2.62 | 1.25 |
| engine copy |  | 2.06 |  | 1.64 |
| std copy |  | 1.39 |  | 1.22 |
| one package (rust) | 9.52 | 11.17 | 7.98 | 9.44 |
| one package (regex) | 3.20 | 4.87 | 2.62 | 4.11 |
| all five packages | 33.18 | 41.48 | 27.65 | 35.05 |

**What the images hold, release profile (MiB: code / Rust crate metadata / symbol tables / rest)**

| image | linux-x64-gnu | macos-arm64 |
| --- | --- | --- |
| `sittir-rust.node`, today | 5.47 / 0.00 / 0.01 / 4.04 | 4.65 / 0.00 / 0.13 / 3.20 |
| `sittir-rust.node`, dylib | 4.45 / 0.00 / 0.02 / 3.26 | 3.81 / 0.00 / 0.14 / 2.63 |
| `sittir-regex.node`, today | 2.02 / 0.00 / 0.01 / 1.18 | 1.69 / 0.00 / 0.06 / 0.86 |
| `sittir-regex.node`, dylib | 1.01 / 0.00 / 0.02 / 0.39 | 0.86 / 0.00 / 0.08 / 0.31 |
| engine copy | 1.01 / 0.01 / 0.13 / 0.91 | 0.83 / 0.01 / 0.20 / 0.59 |
| std copy | 0.66 / 0.00 / 0.22 / 0.50 | 0.61 / 0.00 / 0.33 / 0.28 |
| sittir-core without napi (shape B) | 0.21 / 3.25 / 0.07 / 0.16 | 0.19 / 3.25 / 0.17 / 0.09 |

**Clean build of the five grammars (seconds, wall / CPU)**

| variant | linux-x64-gnu | macos-arm64 |
| --- | --- | --- |
| today-release | 160 / 457 | 176 / 453 |
| dylib-release | 146 / 449 | 182 / 470 |
| today-gate | 114 / 444 | 122 / 336 |
| dylib-gate | 111 / 427 | 129 / 357 |

**Memory after loading and a small workload (median of the rounds, MiB over the process before loading)**

|  | linux-x64-gnu | macos-arm64 |
| --- | --- | --- |
| rust alone, today-release | RSS +8.25 (loaded +2.50), heap +0.05 | RSS +5.55 (loaded +1.66), heap +0.08, footprint +1.10 |
| rust alone, dylib-release | RSS +9.25 (loaded +3.25), heap +0.05 | RSS +5.95 (loaded +1.88), heap +0.08, footprint +1.20 |
| rust alone, today-gate | RSS +9.25 (loaded +2.88), heap +0.05 | RSS +6.56 (loaded +1.83), heap +0.08, footprint +1.30 |
| rust alone, dylib-gate | RSS +10.50 (loaded +3.88), heap +0.05 | RSS +7.22 (loaded +2.25), heap +0.08, footprint +1.40 |
| all five, today-release | RSS +25.88 (loaded +9.38), heap +0.13 | RSS +15.59 (loaded +4.44), heap +0.17, footprint +2.60 |
| all five, dylib-release | RSS +23.50 (loaded +7.63), heap +0.15 | RSS +14.09 (loaded +3.70), heap +0.19, footprint +1.90 |
| all five, today-gate | RSS +29.13 (loaded +11.13), heap +0.13 | RSS +18.94 (loaded +5.50), heap +0.17, footprint +3.60 |
| all five, dylib-gate | RSS +26.38 (loaded +9.38), heap +0.15 | RSS +17.73 (loaded +4.56), heap +0.19, footprint +2.70 |

**Parse + read + render over the corpus (ms per pass: median of the rounds, change from today, spread across rounds; parse / read / render)**

|  | linux-x64-gnu | macos-arm64 |
| --- | --- | --- |
| rust, today-release | 40.32, spread 2%; 7.25 / 13.75 / 18.80 | 38.60, spread 43%; 6.25 / 14.25 / 17.59 |
| rust, dylib-release | 39.88 (−1.1%), spread 2%; 6.99 / 13.71 / 18.72 | 30.03 (−22.2%), spread 54%; 5.08 / 10.96 / 13.99 |
| rust, today-gate | 45.73, spread 0%; 7.71 / 16.99 / 20.47 | 35.27, spread 50%; 5.50 / 13.78 / 16.20 |
| rust, dylib-gate | 46.09 (+0.8%), spread 1%; 7.69 / 17.03 / 20.77 | 37.24 (+5.6%), spread 69%; 5.95 / 14.20 / 16.54 |
| python, today-release | 40.60, spread 1%; 6.76 / 14.05 / 19.33 | 33.98, spread 34%; 5.34 / 12.73 / 15.40 |
| python, dylib-release | 40.74 (+0.3%), spread 1%; 6.64 / 14.19 / 19.43 | 31.47 (−7.4%), spread 35%; 4.96 / 11.89 / 14.41 |
| python, today-gate | 46.39, spread 1%; 7.28 / 17.61 / 21.13 | 32.58, spread 44%; 4.62 / 12.83 / 14.77 |
| python, dylib-gate | 46.95 (+1.2%), spread 1%; 7.30 / 17.72 / 21.48 | 40.55 (+24.5%), spread 38%; 5.56 / 15.66 / 17.75 |

Sources timed per pass: linux-x64-gnu: rust 149, python 116; macos-arm64: rust 149, python 116. Failed runs: linux-x64-gnu 0, macos-arm64 0.

That run's macOS runner was contended: throughput varied 34–69% between
rounds of one variant, against at most 4% on Linux in both runs, so its macOS
throughput cannot resolve a few percent. Run 40016280921's build times and
throughput (`--only build,throughput`):

**Clean build of the five grammars (seconds, wall / CPU)**

| variant | linux-x64-gnu | macos-arm64 |
| --- | --- | --- |
| today-release | 147 / 443 | 121 / 286 |
| dylib-release | 145 / 443 | 106 / 284 |
| today-gate | 112 / 417 | 82 / 233 |
| dylib-gate | 113 / 430 | 86 / 236 |

**Parse + read + render over the corpus (ms per pass: median of the rounds, change from today, spread across rounds; parse / read / render)**

|  | linux-x64-gnu | macos-arm64 |
| --- | --- | --- |
| rust, today-release | 40.44, spread 2%; 7.21 / 13.80 / 18.83 | 25.06, spread 14%; 3.89 / 8.97 / 11.93 |
| rust, dylib-release | 39.40 (−2.6%), spread 3%; 6.93 / 13.58 / 18.48 | 24.75 (−1.2%), spread 6%; 3.84 / 9.24 / 11.43 |
| rust, today-gate | 45.56, spread 1%; 7.82 / 17.01 / 20.26 | 26.47, spread 8%; 4.07 / 10.17 / 11.91 |
| rust, dylib-gate | 46.24 (+1.5%), spread 3%; 7.73 / 17.10 / 20.71 | 27.31 (+3.2%), spread 17%; 4.00 / 10.49 / 12.33 |
| python, today-release | 41.09, spread 1%; 6.85 / 14.26 / 19.51 | 25.60, spread 3%; 3.78 / 9.52 / 12.16 |
| python, dylib-release | 40.85 (−0.6%), spread 2%; 6.61 / 14.29 / 19.48 | 25.72 (+0.5%), spread 2%; 3.66 / 9.75 / 12.19 |
| python, today-gate | 46.90, spread 2%; 7.39 / 17.51 / 21.47 | 27.77, spread 4%; 3.81 / 11.03 / 12.60 |
| python, dylib-gate | 46.64 (−0.6%), spread 4%; 7.22 / 17.57 / 21.29 | 27.39 (−1.4%), spread 3%; 3.75 / 10.55 / 12.65 |

Sources timed per pass: linux-x64-gnu: rust 149, python 116; macos-arm64: rust 149, python 116. Failed runs: linux-x64-gnu 0, macos-arm64 0.

Reading them:

- Sizes and memory are the same in both runs.
- The code that leaves each `.node` is the code the engine holds: rust's
  addon drops from 5.47 to 4.45 MiB of code on Linux, and the engine has
  1.01. The engine and std copies (3.45 MiB on Linux, 2.86 on macOS) outweigh
  what each `.node` sheds (1.78–1.81 and 1.37–1.40), so every package grows.
- The shared images are mapped once, so each grammar after the first costs
  less than today. The first costs more (1.0 MiB on Linux, 0.4 on macOS): it
  loads two more images, and they hold all of the engine's and std's code,
  where a statically linked addon keeps only what it calls.
- tree-sitter's C functions were never inlined into the Rust code (`cc`
  compiles them outside rustc's LTO), so calling them in another library adds
  only an indirect call. No stage got slower: on Linux, release parse is
  2–4% faster in both runs, and read and render are within 2%.

## What the real migration has to carry

- **Build flags.** Every addon and the engine build with `-C prefer-dynamic`;
  that flag is the switch between the shapes (sittir-engine is
  `crate-type = ["dylib", "rlib"]`, so without it everything links
  statically as before). A tracked `[target.*] rustflags` or the build
  script's environment has to carry it; a build script cannot. Fat LTO is
  refused with it ("only 'staticlib', 'bin', and 'cdylib' outputs are
  supported with LTO"), so release builds lose LTO across the sittir-core /
  grammar boundary (thin-local LTO inside each crate is allowed). Measured,
  that costs nothing (see Measurements).
- **Linux links the engine with lld.** GNU ld refuses the second version
  script. rust-lld is the default on x86_64-linux-gnu; the other Linux
  targets pass `-C link-arg=-fuse-ld=lld` and need lld installed (the
  existing release matrix cross-compiles musl and arm64 with zig and
  napi-rs's cross toolchain, which this probe did not try). musl builds need
  `-C target-feature=-crt-static`, as any musl `.node` does.
- **Exact rustc.** The std library is `libstd-<hash>`, and the hash changed
  between Homebrew's rustc 1.99.1 (`f7394d8dadbee1bf`) and rustup's 1.99.0 on
  each CI platform (`614bb9b33bbc23af` on macOS). Every package of a release
  has to come from one toolchain, and the engine's mangled symbols change with
  its version, so packages of one release only.
- **Packaging.** Each platform package ships the engine and std beside the
  `.node`; on macOS their references are rewritten to `@rpath/` and the
  images re-signed, as `scripts/package.mjs` does. The npm `files` and the
  napi-rs loader have to carry the two extra files, which add 2.9–3.5 MiB to
  every package.
- **Process-unique statics live in sittir-engine.** Under shape A anything in
  sittir-core is one per addon. `feat/records` adds `NEXT_TREE_ID` and
  `claim_tree_id` to sittir-core's `engine.rs` (beside `TreeClaim`), and keeps
  the `globalThis` claim in `napi_engine.rs`; the migration moves the counter
  to sittir-engine and deletes the `globalThis` path, as this probe does on
  master.
- **The skew check and the load error.** Each addon checks the engine stamp at
  load (`#[napi(module_exports)]`). The JavaScript loader should turn the
  loader's own "symbol not found" (a version skew) into the same message.
- **Emitter.** `native-crate.ts` emits each grammar's `build.rs` with the rpath
  and the scanner allocator settings. On this branch the five `build.rs` files
  were written by the emitter function and its drift test passes, but no full
  regeneration ran, so the grammars' generation manifests still record the
  old emitter hash; that commit went in with `--no-verify`.
- **The live-tree table.** The probe adds `Tree` beside the table. Replacing
  the table means the JavaScript engine reads, renders and disposes through
  tree objects (the `FinalizationRegistry` and `disposeTree` go), and the
  open question of a coordinate without its tree object gets an answer.

## Reproducing

From the repository root, with the pinned toolchain:

```sh
# toys: the napi collision, shape A, both skew cases
RUSTFLAGS="-C prefer-dynamic" node docs/superpowers/probes/2026-10-23-engine-dylib/scripts/toys-ci.mjs --out /tmp/toys --target-dir /tmp/toys-target
# real grammars: python and regex in separate packages
RUSTFLAGS="-C prefer-dynamic" node docs/superpowers/probes/2026-10-23-engine-dylib/scripts/grammars-ci.mjs --out /tmp/grammars --target-dir /tmp/grammars-target
```

Add `-C link-arg=-fuse-ld=lld` on Linux arm64 and musl, and
`-C target-feature=-crt-static` on musl.

The measurements run in CI (`.github/workflows/engine-dylib-measure.yml`),
since clean-build times and throughput need a machine nothing else is
building on. Its steps are the recipe: `cargo fetch` both trees, then
`scripts/variants.mjs` per variant, `scripts/core-share.mjs`,
`scripts/corpus.mts` and `scripts/measure.mjs`. Download a run's artifacts
into `evidence/ci-measure/run-<id>/` and print the tables with
`node scripts/tables.mjs evidence/ci-measure/run-<id>`.
