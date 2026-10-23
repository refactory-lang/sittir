# Shared engine library probe

Probe branch `probe/engine-dylib`. It does not merge. It builds the shape the
maintainer chose for native packaging: one Rust `dylib`, `sittir-engine`,
that every grammar addon links at run time, shipped as a copy inside each
grammar package beside its `.node`, with the OS loader reusing the first copy
it maps. Each section below states what was shown, on which platforms, and
where the evidence is.

## Summary

<!-- SUMMARY -->

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
other addon's class: a type-confused cast in general. On Windows the `.node`
itself would not export `napi_register_module_v1` (it is defined in the
library), and Node finds a module's entry point only in the module it loaded.
<!-- NAPI-WINDOWS -->

### What B would save on top of A

<!-- B-SAVING -->

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
| skew, same version: refused at load | yes | yes | yes | yes | <!-- WIN-SKEW --> |
| skew, new version: load fails, symbol missing | yes | yes | yes | yes | <!-- WIN-SKEW --> |

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
  (musl). The JavaScript loader should map these to the same message.

The stamp was identical on every platform's build.

## Measurements

<!-- MEASUREMENTS -->

## What the real migration has to carry

<!-- CARRY -->

## Reproducing

<!-- REPRO -->
