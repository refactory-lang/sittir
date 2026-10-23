# The shared engine library: migration

**Status**: Approved shape (A). The migration starts once `feat/records` is stable and on master.
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
- **The allocator slots** are the runtime's own, defined once in the engine.

## Trees as objects

A parsed tree is a JavaScript object that owns its `ParsedTree` and frees itself, replacing the live-tree table.

- `napi_engine!` expands a `Tree` class in each grammar crate, so each grammar's class carries its own napi type tag. A tree of another grammar is refused, never cast.
  - The tags come with `napi8`, so sittir-core's napi feature moves from `napi4` to `napi8`.
- The engine parses into a `Tree`, reads through it, and renders with it as the source table (`ParsedTree` is already a `SourceTable`).
- The JavaScript engine reads, renders and disposes through tree objects. The `FinalizationRegistry`, `disposeTree` and the live-tree table go.

The migration has to answer one question first: a coordinate that arrives without its tree object, such as a bare handle in a built node's slot. A render that takes one tree cannot render a node whose coordinates name several. Either the caller passes every tree the node names, or the coordinate carries its tree object.

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
- the `napi8` move;
- the `Tree` class in `napi_engine!`;
- the end of the live-tree table.

## Verification

On every platform of the release matrix (macOS arm64; Linux x64 and arm64 with glibc; Linux x64 with musl; Windows x64), with real grammar packages laid out as they ship:
- one engine image and one std image mapped after loading two grammars, from the first package's directory;
- the runtime defined only in the engine; no addon defines a `ts_*` symbol, and each imports only what its scanner reads;
- one tree-id counter, with `globalThis` untouched;
- tree objects: a full read renders back the source; trees made and dropped are freed by GC; a tree of another grammar is refused;
- version skew refused both ways: the same version with another stamp at load, and a new version through the mapped loader error;
- the standing gates: `validate:native` rows identical, the full suite, `cargo test --workspace --no-default-features`, workspace type-check and lint;
- throughput, RSS and package sizes re-measured on CI runners against the last static release.

## Open questions

1. **The JavaScript engine package.** The earlier packaging discussion had a JavaScript-only `@sittir/engine` package taking `createEngine` and the engine surface over from `@sittir/common`. Shape A decides only the native library. Does that move still come with this migration, or separately?
2. **A coordinate without its tree object** (Trees as objects, above).
