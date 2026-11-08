# Shared Engine Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task. This repo's rule is no subagents for code. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** every grammar addon links one Rust `dylib`, `sittir-engine`, which holds the tree-sitter runtime and the process statics. A copy ships beside each `.node`, and the OS loader maps the first copy it finds.

**Architecture:**
- A new crate, `rust/crates/sittir-engine` (`dylib` and `rlib`), re-exports `tree-sitter`. It holds the tree-id counter, the build stamp and the runtime's allocator slots.
- Its build script exports the C runtime from one list, in each linker's own form.
- sittir-core and every grammar addon link it with `-C prefer-dynamic`.
- `native-crate.ts` emits each grammar's `build.rs` with the load path and the scanner's allocator settings.
- `build-native.mts` and the release workflow ship the engine and std copies beside each `.node`.

**Tech stack:** Rust (cargo, `-C prefer-dynamic`, lld), napi-rs 3.15, tree-sitter, the TypeScript emitters in `packages/codegen`, `scripts/build-native.mts`, the GitHub Actions release matrix.

**Spec:** `docs/superpowers/specs/2026-10-23-engine-dylib-migration-design.md`. Read it first. This plan argues from it and doesn't restate it.

**Coverage:** this plan covers the spec's sections on the decision, the engine's exports, the build, one toolchain per release, the build stamp, process statics, packaging, the emitter and the manifests, and the verification items for those.

It doesn't cover **Trees as objects** or **A coordinate carries its tree**. Those get their own plan, after that part of the spec is revised against what `feat/records` shipped:
- the arena storage;
- the tree-owned lazy trivia sides, whose writes borrow through the live-tree table that section removes;
- napi, which is already at `napi10`.

**Reference implementation:** `probe/engine-dylib` at 3923f9de6, which doesn't merge:
- ae24f1011: the engine crate;
- 428cc15bc: the addons on the engine;
- 8ee579994: skew refused on every platform;
- `docs/superpowers/probes/2026-10-23-engine-dylib/scripts/`: the image checks and measurements.

Port from it, don't copy it: master has moved since (records, arena, lazy trivia).

**Executor:** sittir-engine-api. **Reviewer:** sittir-brainstorm, at the end of every task. **Base:** master once #924 has merged.

## Global Constraints

- **Worktree and branch:** engine-api's one worktree, `scratchpad/wt-engine-api`, on a new branch `feat/engine-dylib` from `origin/master`. No other worktrees. Pathspec commits (`git commit -- <paths>`). No force, stash, amend, rebase, revert or abort. Push by literal sha. Merge master in whenever it moves.
- **napi is never in the engine.** The engine holds the tree-sitter runtime and the statics a process must hold once: the tree-id counter, the build stamp and the allocator slots. Nothing else goes in it. sittir-core, napi and the generated code stay in each addon.
- **`-C prefer-dynamic`** applies to the engine and every addon. It comes from the target's row of `NATIVE_RUSTFLAGS`, the per-target rustflags table beside `NATIVE_TARGETS` in `packages/codegen/src/grammars.ts`:
  - `build-native.mts` passes the row through `RUSTFLAGS`, then any `RUSTFLAGS` already in its environment, then its own `/MAP`;
  - never from a build script, and never from cargo config. The napi CLI sets `RUSTFLAGS` on every musl build, and cargo then reads no config rustflags;
  - a developer keeps a local linker choice by setting it in `RUSTFLAGS`.
- **No fat LTO.** `[profile.release]` moves from `lto = "fat"` to thin-local (`lto = false`), and `codegen-units` stays as it is.
- **Linux links the engine with lld:**
  - the engine's build script passes `-fuse-ld=lld` for its own link on every Linux target, since only its link carries a second version script. The addons keep their linker;
  - lld must be installed where rust-lld isn't the default (it is on x86_64-linux-gnu);
  - the musl rows of the table carry `-C target-feature=-crt-static`, as any musl `.node` does.
- **Windows scanners** reach the four allocator slots through `__imp_` defines from the grammar crate's build script. No Rust code reads a slot directly.
- **One toolchain and one engine version per release.** The stamp is the engine's version plus the commit, never a hash of source bytes.
- **Generated files are never hand-edited.** Each grammar's `build.rs` and `Cargo.toml` come from `native-crate.ts`, and `native/index.cjs` from the native loader emitter. Regenerate every grammar, and commit the manifests through the pre-commit check, without `--no-verify`.
- **The release matrix is every target in `release.yml`:**
  - `aarch64-apple-darwin`;
  - `x86_64-unknown-linux-gnu`, `x86_64-unknown-linux-musl`;
  - `aarch64-unknown-linux-gnu`, `aarch64-unknown-linux-musl`;
  - `x86_64-pc-windows-msvc`.

  The spec lists five of these. `aarch64-unknown-linux-musl` ships too, so it's verified too.
- **Three-way verification** before every commit that can change what the pipeline reads, renders, parses or validates: targeted probes, `validate:history` compared with numbers, and the full suite. A commit that only touches packaging or CI is proved by what it changes.
- **Comments:**
  - Hand-written source in `packages/{codegen,common,tools,types}/src` carries no explanatory comments. Rust crates keep their existing doc-comment style.
  - Comments and docs carry no spec, plan, PR or task numbers.
- **Speed and memory numbers come from CI only.**

## Review Focus

1. **The pnpm store layout,** where two grammars' platform packages sit in different store folders. Expected: one engine image and one std image are mapped, deduplicated by install name, soname or module name. Owned by Task 6.
2. **A grammar package from another release,** loaded beside one from this release. Expected: the mismatch message names both stamps and the loaded engine's path. That holds for the same version with another commit, and for a newer version through the mapped loader error. Owned by Task 4.
3. **A missing engine or std copy** beside the `.node`. Expected: a load error naming the missing file, never a silent fall into the loader's WASI fallback. Owned by Task 5.
4. **`aarch64-unknown-linux-musl`,** cross-built with zig and lld. Expected: it builds and passes every image check, like the other targets. Owned by Tasks 1 and 6.
5. **Dev builds:** `cargo test`, vitest and the benchmarks all load what `build-native.mts` builds locally. Expected: every dev build's `packages/<lang>/native/` holds the engine and std copies its `.node` needs. Owned by Task 2.

---

### Task 1: The engine crate, built on every release target

**Files:**
- Create: `rust/crates/sittir-engine/{Cargo.toml,build.rs,src/lib.rs,src/stamp.rs,src/tree_ids.rs}`, ported from ae24f1011.
- Modify: `packages/codegen/src/grammars.ts` (`NATIVE_RUSTFLAGS` and `nativeBuildEnv`) and `scripts/build-native.mts`, which passes them. Create `packages/tools/src/scripts/native-rustflags.ts`, which prints a target's flags for CI.
- Modify: `Cargo.toml` (the engine in `[workspace.dependencies]`).
- Create: `.github/workflows/native-layout.yml`, with the engine job on every release target. The napi matrix in `ci.yml` builds all six targets only on tag pushes, so the check gets its own path-filtered workflow, which Task 6 extends.
- Create: `packages/tools/src/native-images.ts`, ported from the probe's `symbols.mjs` and `images.mjs`, and registered as `sittir tool native-images` (check `sittir tool --help` for an existing tool first).

**Interfaces:**
- Produces, in crate `sittir_engine`:
  - `pub use tree_sitter;`
  - `pub fn claim_tree_id() -> Option<u32>`: one atomic counter per process, `None` once it's exhausted.
  - `pub struct Stamp(&'static str)`: the stamp's marked text in the image, displayed as `<version>@<commit>`.
  - `pub const BUILT: Stamp`, inlined into each caller at its compile time.
  - `pub static LOADED: Stamp`: the mapped engine's stamp, which an addon reads as data.
  - `pub fn refusal(addon: &str, built: &Stamp) -> String`: the message naming the addon, both stamps and the engine's path.
  - The version comes from `CARGO_PKG_VERSION`, and the commit from `SITTIR_ENGINE_COMMIT`. The build script declares `rerun-if-env-changed` for it, and an unset value reads `local`.
- Produces: `sittir tool native-images <image…> [--defined <prefix>] [--imported <prefix>]`, which lists the symbols an image defines or imports, as JSON.

- [ ] **Step 1: Failing tests.**
  - `tree_ids`: 8 threads × 256 claims are unique and increasing within each thread, and a counter at `u32::MAX` gives `None`. Move the concurrent test from sittir-core's `engine.rs` here.
  - `stamp`: the refusal for a `Stamp` with another commit holds both commits and the image path.
- [ ] **Step 2:** Run `cargo test -p sittir-engine`. It fails: there's no crate yet.
- [ ] **Step 3: Implement the crate.**
  - The build script's export list is every function tree-sitter's `api.h` declares, less the ones only its wasm module calls, plus the four `ts_current_*` slots.
  - It's emitted per linker: `exported_symbols_list` on macOS, a version script on Linux, and `/EXPORT` lines on MSVC, with `DATA` for the slots.
  - The macOS install name is `@rpath/libsittir_engine.dylib`. On Linux the engine's soname is `libsittir_engine.so`, and it gets its own `RUNPATH $ORIGIN`, since an addon's isn't inherited.
  - Add the table, with the musl rows' `-C target-feature=-crt-static`. `-C prefer-dynamic` and the LTO change land in Task 2, with the copies that let a `.node` built with them load.
- [ ] **Step 4:** Run `cargo test -p sittir-engine`. It passes.
  - `sittir tool native-images <engine image> --defined ts_` lists every exported runtime function and the four slots.
- [ ] **Step 5: `native-layout.yml`** builds `sittir-engine` in release on all six targets, with the table's flags and the matrix's cross setup:
  - zig for musl;
  - for aarch64-gnu, the distribution's cross gcc with lld, since napi's cross toolchain builds only napi packages.

  Each leg checks that the image defines exactly the build's export list, and the legs that run on their own host run the engine's tests. Every target goes green. This is the spec's "first build check": the release matrix's cross-compilation with lld is unproven.
- [ ] **Step 6: Commit:** `feat(engine): the shared engine library, with the runtime exported from one list`.

### Task 2: Grammar addons on the engine

**Files:**
- Modify: `rust/crates/sittir-core`. It depends on `sittir-engine` in place of `tree-sitter` and re-exports the engine's copy as `sittir_core::tree_sitter`, which its own modules name. The engine is the one crate that declares tree-sitter. Rust links an extern crate only when code names it, so a dependency on the engine that nothing names leaves tree-sitter static in the `.node`.
- Modify: `rust/crates/sittir-parity-tests` and `rust/crates/sittir-node-macros`. They drop `tree-sitter` and name `sittir_core::tree_sitter`.
- Modify: `packages/codegen/src/emitters/native-crate.ts` (each grammar's `build.rs`, `Cargo.toml` and `src/lib.rs`) and `packages/codegen/src/emitters/render-module.ts` (the read coordinate's tree type). A grammar crate depends on `sittir-engine`, declares no `tree-sitter`, and names `sittir_core::tree_sitter`.
- Modify: `packages/codegen/src/grammars.ts`. Every row of `NATIVE_RUSTFLAGS` gains `-C prefer-dynamic`.
- Modify: `Cargo.toml`. `[profile.release]` moves from `lto = "fat"` to thin-local (`lto = false`), and `codegen-units` stays: rustc refuses fat LTO with `-C prefer-dynamic`.
- Modify: `scripts/build-native.mts`. After the build, it copies the engine (`libsittir_engine.dylib`, `.so` or `sittir_engine.dll`) and std (`libstd-<hash>`, or `std-<hash>.dll` on Windows) beside the `.node` in `packages/<lang>/native/`:
  - on macOS it rewrites every std reference, and the std copy's own id, to `@rpath/libstd-<hash>.dylib`, then re-signs the images ad hoc;
  - it keeps unstripped copies beside the build stamp, as it does for the `.node`;
  - on Linux, the engine copy keeps `RUNPATH $ORIGIN`;
  - each copy is made writable, since a toolchain (Homebrew's, for one) may install std read-only, and the build rewrites and later replaces its copies;
  - its `cargo metadata` resolves fully, which settles `Cargo.lock` after a manifest change before the build's fingerprint reads it.

  These copies land here, not with the packaging, because a `.node` built with `-C prefer-dynamic` loads only with them beside it.
- Test: `packages/codegen/src/emitters/__tests__/native-crate.test.ts`, and `packages/tools/tests/native-layout.test.ts` for the copies.
- Regenerated: `rust/crates/sittir-{python,regex,rust,scm,typescript}/{build.rs,Cargo.toml,src/lib.rs,src/render/node.rs}` and the generation manifests.

**Interfaces:**
- Consumes: Task 1's crate and table.
- Produces: each addon links the engine dynamically, imports the runtime functions it calls from the engine, and defines none of the symbols the engine exports. The generated parser's own tables (`ts_parse_table`, `ts_lex_modes`, …) stay in the addon. A platform layout of `<binary>.<platform>.node`, the engine and `libstd-<hash>`, in one folder.

- [ ] **Step 1: Failing emitter tests.** The emitted `build.rs` has:
  - on macOS, `cargo:rustc-link-arg=-Wl,-rpath,@loader_path`;
  - on Linux, `-Wl,-rpath,$ORIGIN` with `--enable-new-dtags`, so it's a RUNPATH;
  - the scanner compiled with `TREE_SITTER_REUSE_ALLOCATOR`;
  - on MSVC, the four defines of the form `ts_current_malloc=(*__imp_ts_current_malloc)`.

  The emitted `Cargo.toml` depends on `sittir-engine`. Use the probe's `spikes/build-scripts/addon.rs` as the reference text.

  The copies: after `build-native.mts python`, `packages/python/native/` holds the `.node`, the engine and the std copy. The `.node` links both from its own folder, imports runtime symbols the engine exports, and defines none of them, locals included (`nm -U`; an exported-only listing can't see a static runtime, since a cdylib hides it). On macOS, `otool -L` names `@rpath/` for both libraries, and `codesign -v` passes.
- [ ] **Step 2:** Run `pnpm vitest run packages/codegen/src/emitters/__tests__/native-crate.test.ts packages/tools/tests/native-layout.test.ts`. They fail.
- [ ] **Step 3: Implement the emitter, the flag, the LTO change and the copies,** then regenerate every grammar.
- [ ] **Step 4: Prove it on the host:**
  - `native-layout.test.ts` passes on every grammar's `.node`;
  - `sittir tool native-images <each addon> --imported ts_current_` lists only the slots that grammar's scanner reads;
  - `cargo test --workspace --no-default-features` passes, and so do CI's clippy variants and the stack-ceiling tests, which the release profile's LTO change can move;
  - `validate:history` shows the same rows on every grammar;
  - the full suite passes;
  - the paired-refs benchmark, against the last commit before this task, run before the PR. Any cell over ×1.10 is reported with its cause, not deferred to Task 6. Leaving fat LTO can cost speed.
- [ ] **Step 5: Commit:** `feat(native): grammar addons link the shared engine`.

### Task 3: The tree-id counter lives in the engine

**Files:**
- Modify: `rust/crates/sittir-core/src/engine.rs`:
  - `NEXT_TREE_ID`, `claim_tree_id_from_counter` and its two counter tests go, since the engine's counter carries them;
  - `claim_tree_id` calls `sittir_engine::claim_tree_id` and wraps the id in `TreeClaim`, refusing an id past `MAX_TREE_ID`, the largest a handle carries. A unit test pins that bound;
  - `TreeClaim` itself stays as it is.
- Modify: `rust/crates/sittir-core/src/napi_engine.rs`. The `globalThis` claim goes.
- Modify: `rust/crates/sittir-core/tests/tree_ids.rs`. `claim_tree_id_from` and its tests go.
- No JavaScript reads `__sittirNextTreeId`: only the napi claim did.
- Test: `packages/tools/tests/cross-grammar-coordinate-identity.test.ts`. Its distinct-ids case becomes the alternating-parse case.

**Interfaces:**
- Consumes: `sittir_engine::claim_tree_id`.
- Produces: no change to sittir-core's `claim_tree_id() -> Option<TreeClaim>`.

- [ ] **Step 1: Failing test.** Load the python and rust engines in one process and alternate 50 parses between them. The tree ids are all distinct and strictly increasing in parse order, and `globalThis.__sittirNextTreeId` is `undefined` afterwards.
- [ ] **Step 2:** Run it. It fails: today each addon claims through `globalThis`.
- [ ] **Step 3: Implement** the move and the deletions.
- [ ] **Step 4: Run the three-way verification.**
- [ ] **Step 5: Commit:** `refactor(core): one tree-id counter per process, in the engine`.

### Task 4: The build stamp, checked at load

**Files:**
- Modify: `rust/crates/sittir-engine/src/stamp.rs`.
  - A stamp is marked text in the image's read-only data, `sittir-engine-stamp:<version>@<commit>\0`, so a reader finds it in the bytes. The build script refuses a commit outside letters, digits, `.`, `_` and `-`.
  - `LOADED` is a `pub static` an addon reads as data. `refusal(addon, built)` names the addon, both stamps and the engine's path, and `loaded()` gives the mapped engine's stamp and path.
- Modify: `napi_engine.rs`. The `napi_engine!` macro's `#[napi(module_exports)]` hook compares `sittir_engine::LOADED` with `sittir_engine::BUILT` before any call into the engine. Only on a mismatch does it call `refusal(env!("CARGO_PKG_NAME"), &BUILT)`, and it throws that message. Each addon also exports `engineStamp()`, the mapped engine's stamp and path as text.
- Modify: `packages/common/src/native-binding.ts`.
  - `nativeLoadFailure` reports an error in the cause chain that begins `sittir: ` (the engine's refusal) as the reason, ahead of the error that names the file. napi's loader wraps every candidate's error, so the refusal sits deep in its chain.
  - When the OS loader refuses the addon over a missing symbol, `nativeLoadFailure` builds the same message from the stamp in the `.node`'s bytes (`engineStampOf`) and the engine the process mapped, when the two differ. It matches four loader strings:
    - macOS `Symbol not found`;
    - glibc `undefined symbol`;
    - musl `Error relocating …: symbol not found`;
    - Windows "The specified procedure could not be found".
  - `recordLoadedEngine` keeps the first mapped engine's `engineStamp()` under `Symbol.for('sittir.engine')` on `globalThis`. The entry is diagnostic text only, never read for identity or behavior, and an empty or garbage entry changes only the message.
- Modify: the backend emitter (`grammar-runtime.ts`). A backend that loads its binding records the engine.
- Modify: `scripts/build-native.mts`. A `--release` build sets `SITTIR_ENGINE_COMMIT` from `git rev-parse HEAD`. Dev and gate builds leave it as the environment has it, so the engine reads `local`, and a commit doesn't rebuild every crate above the engine. After stripping and signing, every build reads the stamps of the `.node` and the engine copy it ships and refuses by name unless they match each other and the workspace's engine version, naming the remedy: touch the engine's source and build again.
- Modify: `sittir tool native-images`. `--stamp` reports the stamp each image holds, and `--bound-at-load <prefix>` lists the imports the loader binds when it maps the image, whatever its binding mode.
- Modify: `release.yml`. It checks, with `native-images --stamp`, that every addon of a release build is stamped with the commit.
- Modify: `native-layout.yml`. Each leg that runs what it builds builds regex in release and runs the layout test on it, then runs the skew script.
- Test: the engine's stamp tests, `packages/common/tests/native-binding.test.ts` (built with napi's real chaining), `packages/tools/tests/native-layout.test.ts` (each `.node` and engine copy hold the stamp the loaded engine reports, each `.node` binds `LOADED` at load, and the backend's record), and `scripts/ci/native-skew.mts`. The script runs both skew cases end to end, as a `native-layout.yml` step on every leg that can run what it builds. It ports 8ee579994's method with regex and scm. Afterwards, whether the cases pass or fail, it touches the engine's source and rebuilds both grammars with the caller's environment.

**Interfaces:**
- Consumes: Task 1's `BUILT`, `LOADED` and `refusal`.
- Produces: one mismatch message, `sittir: <addon> was built against engine <version>@<commit> but loaded engine <version>@<commit> from <path>`. `<addon>` is the crate name (`sittir-python`), which names the `.node` file.

- [ ] **Step 1: Failing tests.**
  - The same version with another commit: an addon built with one `SITTIR_ENGINE_COMMIT`, loaded after an engine built with another, is refused with the message, both commits and the path.
  - A newer version: the engine's version is bumped in a scratch build, and the loader's symbol error is mapped to the same message.
  - The common tests pin the four platform strings, the refusal's depth in napi's chain, and the registry's diagnostics-only role.
- [ ] **Step 2:** Run them. They fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** Run them, then the full suite. Both pass.
- [ ] **Step 5: Commit:** `feat(native): engine version skew refused at load, by one message`.

### Task 5: The engine and std copies beside every `.node`

**Files:**
- The copies beside each dev build's `.node` land in Task 2. This task makes a missing copy fail by name and ships the copies in every platform package.
- Modify: the native loader emitter. A missing engine or std file raises an error naming that file before any WASI fallback is tried.
- Modify: `release.yml` (`napi-artifacts-publish`). Each per-target subpackage receives its engine and std copies, and its `files` lists them. No stamp file is packaged: each image holds its stamp in its bytes.
- Test: `packages/tools/tests/native-layout.test.ts`.

**Interfaces:**
- Consumes: Tasks 1–4, and Task 2's layout.
- Produces: every platform package ships Task 2's layout, and a missing copy fails by name.

- [ ] **Step 1: Failing tests.**
  - With the engine copy renamed away, `require` of the loader throws an error naming `libsittir_engine`, and the WASI path is not tried. The same holds for the std copy.
  - Each per-target subpackage that `napi artifacts` assembles lists the engine and std copies in its `files`.
- [ ] **Step 2:** Run them. They fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run with dev builds:**
  - the tests above;
  - `cargo test --workspace --no-default-features`;
  - vitest across the workspace;
  - a local `pnpm run validate:native`.
- [ ] **Step 5: Commit:** `feat(native): every grammar package ships its engine and std copies`.

### Task 6: The release-matrix check and the measurements

**Files:**
- Modify: `.github/workflows/native-layout.yml`, which Task 1 created with the engine job. It runs on all six targets, on pull requests that touch the engine, the rustflags table, `native-crate.ts`, `build-native.mts` or the workflow. This task adds the layout jobs.
- Modify: `sittir tool native-images`, adding `--mapped <script>`, which loads the grammar packages and lists the engine and std images the process mapped.
- Modify: `benchmark-native.yml`, adding a column against the last static release.

**Interfaces:**
- Consumes: Task 5's layout and `sittir tool native-images`.

- [ ] **Step 1: The workflow.** For each target it builds the python and rust packages as they ship, then lays them out three ways: the pnpm store, npm flat and npm nested. For each layout it checks:
  - after loading both grammars, one engine image and one std image are mapped, from the first package's folder;
  - no addon defines a `ts_*` symbol;
  - one tree-id counter, with `globalThis` untouched (Task 3's test, run there);
  - skew is refused both ways (Task 4's test, run there).
- [ ] **Step 2:** Run it on the branch. Every target and every layout is green, including `aarch64-unknown-linux-musl`.
- [ ] **Step 3: Measure on CI runners against the last static release:**
  - parse, read and render throughput;
  - RSS with one grammar loaded and with all five;
  - each package's install size.

  The spec's bars: throughput within ±3%, RSS about even, and package growth near 1.5–1.7 MiB each. Report anything outside them before the PR.
- [ ] **Step 4: Standing gates:** `validate:native` rows identical, the full suite, `cargo test --workspace --no-default-features`, the workspace type-check and lint.
- [ ] **Step 5: Commit, then open the PR to master.** The PR body carries the measurement table and the per-target, per-layout check results. Merge waits for the user's word.
