# The shared engine library: migration

**Status**: Approved shape (A). The migration starts once `feat/records` is stable and on master. It's planned in two parts. The shared library (`docs/superpowers/plans/2026-11-06-engine-dylib-library.md`) comes first, then tree holders and coordinates that carry their tree. Those two sections were amended on 2026-11-06 against what `feat/records` shipped:
- napi was already at `napi10`;
- lazy trivia's tree-owned sides took their writes through the live-tree table;
- an arena link record carries its tree in one word, so the maintainer chose an arena-held slot over a pointer per link;
- the maintainer then ruled that each storage holds its trees the way it holds its nodes. Object storage uses a `Tree` object the garbage collector tracks. Arena storage uses counted native slots, released with the parse root, and makes no `Tree` object.
- the arena half is held (the maintainer, 2026-11-06). Arena storage is moving to hydrate a tree whole at parse and drop tree-sitter's tree, so what an arena parse keeps is its source buffer, not a tree. The maintainer then settled arena tree lifetime on 2026-11-12 (`2026-11-06-arena-trees-from-records-design.md`, Decided and Tree lifetime): no tree outlives the read call, and there are no counted slots. Until that work lands, arena storage keeps the interim `Tree` object. The object-storage half and the render that takes no tree go ahead.
**Scope**: the native crates (`sittir-engine`, `sittir-core`, the grammar crates), the native crate emitter, the grammar packages' build and packaging, and the JavaScript loader.
**Evidence**: the probe report on `probe/engine-dylib` at 3923f9de6, `docs/superpowers/probes/2026-10-23-engine-dylib/README.md`. That branch does not merge; it is the record.

## Decision

Every grammar addon links one Rust `dylib`, `sittir-engine`, at run time.

- **The engine holds** the tree-sitter runtime (the Rust crate and its C code) and the statics a process must hold once: the tree-id counter, the build stamp and the runtime's allocator slots. The Rust std library is a dynamic library beside it.
- **Each addon keeps** sittir-core, napi and its generated code, as today.
- **Each grammar package ships its own copies** of the engine and std beside its `.node`. The OS loader maps the first copies a process loads and never opens the others.
- **napi is never in the engine.** napi-rs keeps its export and class registries in process-global statics and defines `napi_register_module_v1` in its own crate. With napi in a shared library, two addons share one registry, and one addon's Rust struct ends up wrapped in the other's class. On Windows neither addon loads. So sittir-core, whose bindings call napi, stays per addon.

What the library buys is one runtime and one set of process statics, not size. Against today's static addons:
- parse, read and render throughput is unchanged (within ±3%);
- clean build time is unchanged;
- RSS is about even (+1.0 MiB on Linux with one grammar, −2.4 MiB with five; the break-even is around the second grammar);
- every package grows on disk (below).

## The engine's exports

A Rust dylib exports its Rust symbols and none of the C libraries it links, but addons call the C runtime directly: tree-sitter's generic functions are instantiated in each addon, and a scanner built with `TREE_SITTER_REUSE_ALLOCATOR` reads the allocator slots. So the engine's build script exports the runtime from one list:
- every function tree-sitter's `api.h` declares, less the ones only its wasm module calls;
- the four `ts_current_*` allocator slots.

The list reaches each linker in its own form: an `exported_symbols_list` (macOS), a version script (Linux), and `/EXPORT` lines with `DATA` for the slots (MSVC). The engine defines the runtime and no addon does; a grammar's addon imports only what its scanner reads.

### What crosses is typed as what it is

The addon's generated typings and common's declared surface state the same type for every member, and a test checks each return exactly, naming its deliberate exceptions (the maintainer, 2026-11-12, "Approve all"). The wire types live in `@sittir/types` and are internal to the boundary:

- `WireNode<Node extends object = object> = Node | number`: a node as it crosses, its data or a bare kind id for a fixed token. Trivia entries, `read`, `snapshot` and `readMany` (`WireNode[] | Uint32Array`) use it.
- `UnitSidesWire<Node>`: `{ slot, item }` and the sides, with `WireNode` entries, for `unitSides`, `builtUnitSides`, `writeUnitSides` and `writeBuiltUnitSides`.
- `SlotLayoutWire`: `{ slot, before?, after?, separator? }`, each a kind id, for `slotLayouts`.

## Build

- **`-C prefer-dynamic` for the engine and every addon.** It is the switch between the shapes: `sittir-engine` is `crate-type = ["dylib", "rlib"]`, so without the flag everything links statically. The flag comes from a tracked `[target.*] rustflags` entry or the build's environment. A build script cannot set it.
- **No fat LTO.** rustc refuses fat LTO with `prefer-dynamic`, so release builds lose LTO across the sittir-core and grammar boundary. Thin-local LTO inside each crate stays. The measurements show no cost.
- **Linux links the engine with lld.** rustc already passes a dylib an anonymous version script, and GNU ld refuses a second one. rust-lld is the default on x86_64-linux-gnu. The other Linux targets pass `-C link-arg=-fuse-ld=lld` and need lld installed. musl also needs `-C target-feature=-crt-static`, as any musl `.node` does.
- **The release matrix's cross-compilation is unproven.** Today's matrix builds musl and arm64 with zig and napi-rs's cross toolchain, which the probe did not try with lld. It is the migration's first build check.
- **Windows scanners reach the allocator slots through `__imp_`.** MSVC reaches data in a DLL only through its import slot. The grammar crate's build script passes a define per slot (`ts_current_malloc=(*__imp_ts_current_malloc)`). No Rust code reads a slot directly: rustc marks an item dllimport only when it knows a DLL provides it, so a plain `extern` read fails to link.

## One toolchain per release

The std library ships as `libstd-<hash>`, and the hash changes with the rustc build. The engine's mangled symbols change with its version. So every package of a release comes from one toolchain and one engine version, and packages of different releases do not load into one process.

The grammar packages are one `fixed` Changesets group, so a release that bumps one grammar bumps them all, and the latest version of each grammar comes from the same release. `check:published` fails when the group leaves a grammar package out.

## The build stamp

- The engine stamps itself with the release's identity: its version and commit.
  - A stamp is text in an image's read-only data: `sittir-engine-stamp:<version>@<commit>`, ending in a NUL. A reader finds it in the image's bytes without loading the image, so the build, the release check and the JavaScript loader all read it there, and no stamp file ships. The commit takes letters, digits, `.`, `_` and `-` only.
  - `BUILT` is a `const` compiled into each addon, so each addon's image holds the stamp it was built against.
  - `LOADED` is a `static` in the engine. An addon reads it as data, never through a call: the loader binds a data reference when it maps the addon, to the engine image the process mapped first.
- Each addon compares `BUILT` with `LOADED` in its `#[napi(module_exports)]` hook, before any call into the engine, so `require` fails with one message naming both stamps and the path the loaded engine came from. Only once they differ does the hook call the engine, for that message. A call may be bound lazily, and a lazily bound call into an engine that lacks it crashes the process instead of failing the load.
- The stamp is not a hash of source bytes. That hash differed between a Unix checkout and a Windows one with CRLF line endings.
- A release stamp carries the commit. A dev build stamps `<version>@local`, so two dev builds under different profiles carry the same stamp and the check cannot tell them apart. A dev workspace relies on regen's freshness check of each binary's profile and inputs instead.
- **A binary reports the profile it was built with** (the maintainer, 2026-11-12: "The built profile name"). build-native passes the profile it builds into the build, and `engine.diagnostics.buildProfile` reads it back. It reports `'release'`, `'gate'` or `'dev'`, or `undefined` for a binary build-native didn't build. Its value never comes from the debug-assertions flag, which a gate build shares with release. Any other name fails the build: `sittir_core::boundary::build_profile`, a public `const fn` the generated napi macro calls, panics on it in a `const` (the maintainer, 2026-11-12, "Approve both"). The validators refuse `'dev'` and unstamped binaries unless `SITTIR_ALLOW_DEBUG_VALIDATE=1` is set.
- A newer engine version changes every mangled symbol, `LOADED` among them, so the OS loader fails the addon at load, with "symbol not found" or its platform's equivalent. The JavaScript loader maps that failure to the same mismatch message, reading the addon's stamp from its bytes.
- A build reads the stamps of the `.node` and the engine copy it ships, stripped and signed, and fails by name unless they match each other and the workspace's engine version. Cargo gives every build of the engine one file name, so after a version change it can keep a build of the other version that it judges fresh.

## Process statics

Under shape A, anything in sittir-core is one per addon, so a fact the process must hold once lives in the engine.

- **The tree-id counter.** `sittir_engine::claim_tree_id` holds it, atomically, one per process. sittir-core's `claim_tree_id` calls it.
  - `feat/records` adds `NEXT_TREE_ID` and `claim_tree_id` to sittir-core's `engine.rs`, beside `TreeClaim`. The migration moves the counter into the engine.
  - The `globalThis` claim in `napi_engine.rs` and `claim_tree_id_from` are deleted.
  - `TreeClaim`, from `feat/records`, stays as it is: ids are minted only natively, and `Engine::parse` consumes the claim.
  - A handle packs its tree id in 21 bits beside a 32-bit node index, so it stays an exact double, and `MAX_TREE_ID` is 2^21 − 1. With one counter, that is a budget for the whole process, shared by every thread, and ids are never reused. Once it is spent, `parse` refuses with "this process exhausted its 2097151 tree ids".
  - Every thread claims from the one counter, so an id names one tree in the whole process. Each thread still holds its own table of live trees.
- **The allocator slots** are the runtime's own, defined once in the engine.

## Tree holders

A parsed tree is freed when its last holder drops it. Each storage holds its trees the way it holds its nodes: object storage through a JavaScript object the garbage collector tracks. Arena storage keeps no tree after the read call (below). This replaces the live-tree table.

- **The cell.** Each tree lives in a cell behind a shared handle (an `Arc`). The cell holds the `ParsedTree` and its borrow. Every holder holds that handle, and nothing else keeps a tree alive.
- **Object storage: the `Tree` object.**
  - `napi_engine!` expands a `Tree` class in each grammar crate, so each grammar's class carries its own napi type tag (the workspace is already on `napi10`). A tree of another grammar is refused, never cast.
  - The holders are the `Tree` objects that wrap the handle.
  - Object nodes are plain values that can be spread, copied and shared without any code running. So only the garbage collector sees every holder, and native code learns that the last one is gone only through the object's finalizer. One `Tree` object per tree means one finalizer per tree instead of one per node.
  - **The `Tree` object is internal.** It's reached only through a node's `[TREE]` property, and it isn't part of the public API.
  - There's no tree dispose. A node's `[Symbol.dispose]` stays a no-op, as it is for every object node.
- **Arena storage: no tree after the read call.** The maintainer settled this on 2026-11-12, and the arena trees-from-records spec's Decided and Tree lifetime sections govern it. Tree-sitter's tree lives only inside the read call, and only the nodes and the source text outlive it. No `Tree` object is made, and there's no held-tree table, slot or count for a root or link to take. Nothing on the JavaScript heap holds a tree, and no finalizer runs for one.
- **Exclusive writes, per tree.** Today a write borrows the whole live-tree table mutably, and a render holds a shared borrow of the whole table for the call, so any write during any render is refused. After the migration each tree carries its own borrow, taken without blocking:
  - a render takes a read borrow of each tree its node reaches, for the length of the call;
  - a write takes its tree's write borrow, and is refused by name while that tree is being read;
  - a write to one tree during the render of another is allowed;
  - placed sides stay lock-free inside the tree, as lazy trivia built them, and built records' sides stay engine-owned.
- **Ready for threading.** `ParsedTree` is asserted `Send + Sync` at compile time, and the borrow is one a pool thread could take. So threading can parse on a pool thread and wrap the result on the JavaScript thread without changing this shape. No napi or V8 call runs off the JavaScript thread.
- **Parse, read and render.** The engine parses into a tree cell, held by a `Tree` object in object storage. In arena storage, the tree is dropped inside the parse call. It reads through that holder, and renders with the tree as the source table (`ParsedTree` is already a `SourceTable`).
- **What goes.** The `FinalizationRegistry`, `disposeTree` and the live-tree table go. Two tools call `disposeTree` directly, `validate/layout-runs.ts` and `profile/native-hydration.ts`. Instead, they drop their holds in object storage and release their roots in arena storage.

### A coordinate carries its tree

A parsed node's coordinate reaches its tree through the tree's holder, never by looking up the tree's id. The render reads each coordinate's tree from it.
- In object storage, holding a node keeps its tree alive.
- In arena storage, no tree outlives the read call, and a coordinate or link names a node (arena spec, Tree lifetime).
- In object storage, a long-lived built node keeps its source trees in memory.

- **Object storage.** A coordinate holds its `Tree` object, its descendant index and its span, and it crosses the boundary that way. `$treeHandle` packs no tree id. The generated wrappers' per-kind `[TREE]` stamp holds the `Tree` object instead of a token.
- **Arena storage.** A link record stays 8 words and names a node, not a tree. There's no held-tree table. The JavaScript-side `BuiltArena` map of tree tokens goes.
- **The hold.**
  - *Today:* a read object holds its tree through a token (`holdTree`), while its coordinate names the tree by id. Dropping the token (`detachCoordinates`) leaves a bare handle, which the render refuses until the tree is held again.
  - *After the migration, object storage:* a copy of a node copies its coordinates, and so holds their trees.
  - *After the migration, arena storage:* a copy of a read handle is another uncounted borrow. A built node that takes a parsed node links it. Cross-node reuse is one node-level mechanism for parsed and built nodes alike, and it belongs to the node work (arena spec, Decided).
  - *An edit:* an edit that rebuilds a node drops that node's own hold, since its content is now built and renders from its options. Its untouched parsed descendants keep theirs. Materializing a coordinate keeps the hold, because the node still renders from its tree's source. In arena storage, its content is the tree's own records.
  - What goes: the tokens, `holdTree`, `holdReadTree`, `carryReadTree`, `detachCoordinates`, and the validators' detach-then-hold pairs. No handle exists without its holder.
- **Identity.** In object storage, the tree's id stays its identity (`TreeClaim`), never the way to reach it.
- **Built slots.** A built node's slot that takes a parsed node holds that node's coordinate, tree included.
  - A built node made from the nodes of two trees holds both, and each coordinate slices its own tree's source. It renders with no tree layer of options (render options spec, Precedence).
  - One made from one tree's nodes renders over that tree's layer, found from its coordinates.
- **The render takes no tree.** The public `render(node, options)` already takes none. Natively, `render`, `render_to_file`, `render_record` and `render_built` lose their tree-id argument. The options layer comes from the node's coordinates, and the sources come from the trees the node reaches, not from every live tree.

## Packaging

- **Packages.** `@sittir/<g>` ships its JavaScript, the loader and its typings. Each platform's binaries ship in napi-rs's per-platform package, `sittir-<g>-<platform>`, which `@sittir/<g>` lists as an optional dependency at its own version; npm installs the one that matches the platform. napi reads the crate's `napi.json` and `@sittir/<g>`'s manifest, so a platform package takes the grammar package's version, and the release writes the optional dependencies. The platform packages publish before the grammar package.
- **Files.** Each platform package ships the engine and std copies beside its `.node`, and its npm `files` lists them.
- **Load paths.** The loader reuses an image by the name each addon records:
  - macOS: the engine's install name is `@rpath/libsittir_engine.dylib`, set by its build script (rustc's default is the bare file name). Each addon carries `LC_RPATH @loader_path`. Packaging rewrites every std reference, and the std copy's own id, to `@rpath/libstd-<hash>.dylib`, then re-signs the images.
  - Linux: `DT_NEEDED libsittir_engine.so` (the engine's soname) and `libstd-<hash>.so`, found through `RUNPATH $ORIGIN` on the addon and on the engine. The engine needs its own, since `RUNPATH` is not inherited.
  - Windows: the addon imports `sittir_engine.dll` and `std-<hash>.dll` by module name, found in its own folder.
- **Install cost.** Each package grows by 1.5–1.7 MiB: its `.node` sheds 1.4–1.8 MiB and gains the engine (1.6–2.1 MiB) and std (1.2–1.4 MiB). All five packages go from 33.2 to 41.5 MiB on Linux and from 27.7 to 35.1 MiB on macOS.

## The emitter and the manifests

- `native-crate.ts` emits each grammar's `build.rs` with the load path and the scanner's allocator settings, including the Windows slot defines.
- The migration regenerates every grammar, so each generation manifest records the new emitter hash, and commits pass the pre-commit manifest check. The probe's emitter commit skipped that check with `--no-verify`, which only a probe branch may do.

## Review

engine-api reviews the sittir-core parts:
- the counter's move and `TreeClaim`;
- the tree cell, its per-tree borrow, and the `Send + Sync` assertion;
- object storage's `Tree` class in `napi_engine!`;
- the end of the live-tree table;
- the coordinate's tree: the wire, the hold, built slots, and the render without a tree argument.

## Verification

On every platform of the release matrix, with real grammar packages laid out as they ship:
- the platforms: macOS arm64; Linux x64 and arm64 with glibc; Linux x64 and arm64 with musl; Windows x64;
- one engine image and one std image mapped after loading two grammars, from the first package's directory;
- the runtime defined only in the engine; no addon defines a `ts_*` symbol, and each imports only what its scanner reads;
- one tree-id counter, with `globalThis` untouched;
- tree holders:
  - a full read renders back the source;
  - in object storage, trees made and dropped are freed once their last `Tree` object is collected;
  - a tree of another grammar is refused;
  - a write to a tree during its own render is refused by name, and a write to another tree is allowed;
- the arena: a link record stays 8 words (arena tree lifetime is verified by the arena trees-from-records work);
- coordinates:
  - a built node holding nodes of two trees renders both sources with no tree layer;
  - one holding one tree's nodes renders over that tree's layer;
  - a built node alone keeps its source trees alive, and dropping it frees them;
  - in object storage, no coordinate crosses the boundary without its `Tree` object;
- version skew refused both ways: the same version with another stamp at load, and a new version through the mapped loader error;
- the standing gates: `validate:native` rows identical, the full suite, `cargo test --workspace --no-default-features`, workspace type-check and lint;
- throughput, RSS and package sizes re-measured on CI runners against the last static release.

## Out of scope

- **The JavaScript engine package.** A JavaScript-only `@sittir/engine` package taking `createEngine` and the engine surface over from `@sittir/common` is its own later change. This migration decides only the native library.
