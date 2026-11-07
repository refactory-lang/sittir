# The shared engine library: migration

**Status**: Approved shape (A). The migration starts once `feat/records` is stable and on master. It's planned in two parts. The shared library (`docs/superpowers/plans/2026-11-06-engine-dylib-library.md`) comes first, then tree holders and coordinates that carry their tree. Those two sections were amended on 2026-11-06 against what `feat/records` shipped:
- napi was already at `napi10`;
- lazy trivia's tree-owned sides took their writes through the live-tree table;
- an arena link record carries its tree in one word, so the maintainer chose an arena-held slot over a pointer per link;
- the maintainer then ruled that each storage holds its trees the way it holds its nodes. Object storage uses a `Tree` object the garbage collector tracks. Arena storage uses counted native slots, released with the parse root, and makes no `Tree` object.
- the arena half is held (the maintainer, 2026-11-06). Arena storage is moving to hydrate a tree whole at parse and drop tree-sitter's tree, so what an arena parse keeps is its source buffer, not a tree. Arena counted slots are redesigned in `2026-11-06-arena-trees-from-records-design.md` as held-parse slots. Until then, arena storage keeps the interim `Tree` object. The object-storage half and the render that takes no tree go ahead.
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

## Build

- **`-C prefer-dynamic` for the engine and every addon.** It is the switch between the shapes: `sittir-engine` is `crate-type = ["dylib", "rlib"]`, so without the flag everything links statically. The flag comes from a tracked `[target.*] rustflags` entry or the build's environment. A build script cannot set it.
- **No fat LTO.** rustc refuses fat LTO with `prefer-dynamic`, so release builds lose LTO across the sittir-core and grammar boundary. Thin-local LTO inside each crate stays. The measurements show no cost.
- **Linux links the engine with lld.** rustc already passes a dylib an anonymous version script, and GNU ld refuses a second one. rust-lld is the default on x86_64-linux-gnu. The other Linux targets pass `-C link-arg=-fuse-ld=lld` and need lld installed. musl also needs `-C target-feature=-crt-static`, as any musl `.node` does.
- **The release matrix's cross-compilation is unproven.** Today's matrix builds musl and arm64 with zig and napi-rs's cross toolchain, which the probe did not try with lld. It is the migration's first build check.
- **Windows scanners reach the allocator slots through `__imp_`.** MSVC reaches data in a DLL only through its import slot. The grammar crate's build script passes a define per slot (`ts_current_malloc=(*__imp_ts_current_malloc)`). No Rust code reads a slot directly: rustc marks an item dllimport only when it knows a DLL provides it, so a plain `extern` read fails to link.

## One toolchain per release

The std library ships as `libstd-<hash>`, and the hash changes with the rustc build. The engine's mangled symbols change with its version. So every package of a release comes from one toolchain and one engine version, and packages of different releases do not load into one process.

## The build stamp

- The engine stamps itself with the release's identity: its version and commit.
  - `BUILT` is a `const` compiled into each addon.
  - `LOADED` is a `static` read from whichever engine image was mapped.
  - Each addon compares them in its `#[napi(module_exports)]` hook, so `require` fails with one message naming both and the path the loaded engine came from.
- The stamp is not a hash of source bytes. That hash differed between a Unix checkout and a Windows one with CRLF line endings.
- A newer engine version changes every mangled symbol, so the OS loader fails first, with "symbol not found" or its platform's equivalent. The JavaScript loader maps that failure to the same mismatch message.

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

A parsed tree is freed when its last holder drops it. Each storage holds its trees the way it holds its nodes: object storage through a JavaScript object the garbage collector tracks, and arena storage through counted native slots. This replaces the live-tree table.

- **The cell.** Each tree lives in a cell behind a shared handle (an `Arc`). The cell holds the `ParsedTree` and its borrow. Every holder holds that handle, and nothing else keeps a tree alive.
- **Object storage: the `Tree` object.**
  - `napi_engine!` expands a `Tree` class in each grammar crate, so each grammar's class carries its own napi type tag (the workspace is already on `napi10`). A tree of another grammar is refused, never cast.
  - The holders are the `Tree` objects that wrap the handle.
  - Object nodes are plain values that can be spread, copied and shared without any code running. So only the garbage collector sees every holder, and native code learns that the last one is gone only through the object's finalizer. One `Tree` object per tree means one finalizer per tree instead of one per node.
  - **The `Tree` object is internal.** It's reached only through a node's `[TREE]` property, and it isn't part of the public API.
  - There's no tree dispose. A node's `[Symbol.dispose]` stays a no-op, as it is for every object node.
- **Arena storage: counted slots.** Held; see the status above.
  - No `Tree` object is made. The engine's arena holds each of its trees in a slot of its held-tree table, and the slot's entry holds the tree's handle.
  - An entry is counted once by the parse root and once by each link record that names it (below). The entry is dropped when its count reaches 0, and the engine's dispose drops every entry.
  - Releasing the parse root drops the root's count. The release is the `[Symbol.dispose]` and `engine.release(node)` that every node already has, the same release that frees a built root today. Releasing any other read handle still does nothing.
  - A read handle is an uncounted borrow, like every arena read handle. It names its tree by slot and by the tree's id. A call through a handle whose slot no longer holds that id is refused, with a message naming the tree's id. That happens when its tree was freed or its slot reused, and such a call never reads another tree.
  - So in arena storage nothing on the JavaScript heap holds a tree, and no finalizer runs for one. A root that's never released keeps its tree until the engine's dispose, as an unreleased built root keeps its records.
- **Exclusive writes, per tree.** Today a write borrows the whole live-tree table mutably, and a render holds a shared borrow of the whole table for the call, so any write during any render is refused. After the migration each tree carries its own borrow, taken without blocking:
  - a render takes a read borrow of each tree its node reaches, for the length of the call;
  - a write takes its tree's write borrow, and is refused by name while that tree is being read;
  - a write to one tree during the render of another is allowed;
  - placed sides stay lock-free inside the tree, as lazy trivia built them, and built records' sides stay engine-owned.
- **Ready for threading.** `ParsedTree` is asserted `Send + Sync` at compile time, and the borrow is one a pool thread could take. So threading can parse on a pool thread and wrap the result on the JavaScript thread without changing this shape. No napi or V8 call runs off the JavaScript thread.
- **Parse, read and render.** The engine parses into a tree cell, held by a `Tree` object in object storage and by an arena slot in arena storage. It reads through that holder, and renders with the tree as the source table (`ParsedTree` is already a `SourceTable`).
- **What goes.** The `FinalizationRegistry`, `disposeTree` and the live-tree table go. Two tools call `disposeTree` directly, `validate/layout-runs.ts` and `profile/native-hydration.ts`. Instead, they drop their holds in object storage and release their roots in arena storage.

### A coordinate carries its tree

A parsed node's coordinate reaches its tree through the tree's holder, never by looking up the tree's id. The render reads each coordinate's tree from it.
- In object storage, holding a node keeps its tree alive.
- In arena storage, a link keeps it alive, and so does the root's count until the root is released.
- In both storages, a long-lived built node keeps its source trees in memory.

- **Object storage.** A coordinate holds its `Tree` object, its descendant index and its span, and it crosses the boundary that way. `$treeHandle` packs no tree id. The generated wrappers' per-kind `[TREE]` stamp holds the `Tree` object instead of a token.
- **Arena storage.** A link record stays 8 words. Its tree word holds a 32-bit slot into the arena's held-tree table, and each link counts once on its entry.
  - The table is a holder, not a registry. It holds only trees that the arena's own parses and records reach, and nothing outside the arena looks a tree up in it.
  - It replaces the JavaScript-side `BuiltArena` map of tree tokens.
- **The hold.**
  - *Today:* a read object holds its tree through a token (`holdTree`), while its coordinate names the tree by id. Dropping the token (`detachCoordinates`) leaves a bare handle, which the render refuses until the tree is held again.
  - *After the migration, object storage:* a copy of a node copies its coordinates, and so holds their trees.
  - *After the migration, arena storage:* a copy of a read handle is another uncounted borrow. A built node that takes a parsed node links it, and the link counts.
  - *An edit:* an edit that rebuilds a node drops that node's own hold, since its content is now built and renders from its options. Its untouched parsed descendants keep theirs. Materializing a coordinate keeps the hold, because the node still renders from its tree's source. In arena storage, its content is the tree's own records.
  - What goes: the tokens, `holdTree`, `holdReadTree`, `carryReadTree`, `detachCoordinates`, and the validators' detach-then-hold pairs. No handle exists without its holder.
- **Identity.** The tree's id stays its identity (`TreeClaim`), never the way to reach it. In arena storage, a read handle's slot is also checked against it.
- **Built slots.** A built node's slot that takes a parsed node holds that node's coordinate, tree included.
  - A built node made from the nodes of two trees holds both, and each coordinate slices its own tree's source. It renders with no tree layer of options (render options spec, Precedence).
  - One made from one tree's nodes renders over that tree's layer, found from its coordinates.
- **The render takes no tree.** The public `render(node, options)` already takes none. Natively, `render`, `render_to_file`, `render_record` and `render_built` lose their tree-id argument. The options layer comes from the node's coordinates, and the sources come from the trees the node reaches, not from every live tree.

## Packaging

- **Files.** Each platform package ships the engine and std copies beside its `.node`. The npm `files` and the napi-rs loader carry the two extra files.
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
- arena storage's held-tree table: the root's count, the links' counts, and the check of a read handle's slot against the tree's id;
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
  - in arena storage, a tree is freed once its root is released and its last link goes, and every tree at the engine's dispose. No `Tree` object is made;
  - a tree of another grammar is refused;
  - a write to a tree during its own render is refused by name, and a write to another tree is allowed;
- the arena: a link record stays 8 words. A read handle used after its tree is freed is refused by name, and it never reads the tree a reused slot now holds;
- coordinates:
  - a built node holding nodes of two trees renders both sources with no tree layer;
  - one holding one tree's nodes renders over that tree's layer;
  - a built node alone keeps its source trees alive, and dropping it frees them;
  - no coordinate crosses the boundary without its holder: its `Tree` object in object storage, its slot and tree id in arena storage;
- version skew refused both ways: the same version with another stamp at load, and a new version through the mapped loader error;
- the standing gates: `validate:native` rows identical, the full suite, `cargo test --workspace --no-default-features`, workspace type-check and lint;
- throughput, RSS and package sizes re-measured on CI runners against the last static release.

## Out of scope

- **The JavaScript engine package.** A JavaScript-only `@sittir/engine` package taking `createEngine` and the engine surface over from `@sittir/common` is its own later change. This migration decides only the native library.
