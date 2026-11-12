# Native File I/O and Format Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task. This repo's rule is no subagents for code. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a file goes in as a path and comes out as a file, with no source or rendered text in JavaScript on the way. One native writer serves every write. An arena-only threaded batch, `engine.applyStyle` and `engine.checkStyle`, formats files and is measured beside oxfmt. A guard keeps unrequested crossings from coming back.

**Architecture:**
- One Rust module, `sittir-core::file_io`, reads a source file (with UTF-8 validation) and writes a rendered file in place, restoring the original bytes if a write fails. Every save, write, create and batch file goes through it.
- The napi layer gains a file sibling for each render entry point, a file parse, plan handles and the batch task. Its results cross as objects and numbers, not JSON.
- `packages/common` builds `Pending`, the file verbs, `$save` and the batch on those entry points. The batch runs scoped Rust threads with one engine each, inside one asynchronous napi task.

**Tech stack:** Rust (`sittir-core`, the `napi_engine!` macro), napi-rs, TypeScript in `packages/{types,common,codegen}`, and the oxc reference harness on `bench/oxc-reference`.

**Spec:** `docs/superpowers/specs/2026-11-10-native-file-io-and-format-batch-design.md`. Read it first. The batch's surface mirrors `engine.styleFrom` as `docs/superpowers/specs/2026-10-02-layout-table-design.md` ("Detection") defines it. `styleFrom` itself stays parked.

**Facts this plan starts from (master de1b914cd, re-anchored by the executor at each task's start):**
- `engine.read`, `write` and `create` throw `unimplementedVerb` (`packages/common/src/create-engine.ts:105`).
- `createRenderHandle(renderText, saveImpl?)` (`packages/common/src/engine.ts:38`) falls back to `writeFileSync`. Object storage's `renderToFile` (`napi_engine.rs:677`) uses `std::fs::write`, so both storages rewrite an unchanged file today.
- napi `parse` returns JSON (`napi_engine.rs:344`). `descendants` and `planHolds` take JSON (`napi_engine.rs:587, 631`) and are module functions with no engine handle (`TREE_FUNCTIONS`, `engine.ts:328`). `EngineCell` is `Rc<RefCell<Engine>>` (`napi_engine.rs:263`).
- The trivia side crosses as a string in `triviaSide`, `writeTriviaSide`, `builtTriviaSide`, `writeBuiltTriviaSide`, `builtLeafSide` and `writeBuiltLeafSide`.
- `SittirEngine.findAndRead` has no caller beyond the generated `backend.ts` type (`emitters/grammar-runtime.ts:61`). `readMany` has none in `packages/`.
- `packages/codegen/src/emitters/__tests__/native-typings.test.ts` pins each grammar's napi exports (`ADDON_FUNCTIONS`). `rust/crates/sittir-core/tests/lock_free_census.rs` pins each file's exact count of `Mutex`, `RwLock`, `OnceLock`, `LazyLock`, `Arc`, `Weak`, `Rc`, `RefCell` and `Atomic*`.
- Node members are emitted in three places: `emitters/node-members.ts::nodeMemberParts` (object nodes), `emitters/wrap.ts::emitRecordHandle` (arena record views) and `emitters/record-construction.ts` (arena built nodes). The root is flagged by `node.grammarRoot`. `engine-scope.ts::engineOf` is the one engine lookup, and `NO_ENGINE` is its refusal.
- The root kinds are stamped natively as `kind::ROOT_KINDS`, from `emitters/wrap.ts::rootKindIds`. Each descriptor's `fileTypes` is typed `readonly string[]` today.
- Render writes the `layout.newline` option, `'\n'` by default. A file's own line ending isn't inferred.
- Tree ids come from one process counter (`claim_tree_id`), and a process has about 2M of them.
- **Prototype's arena Task 6** (held-parse slots, open as a PR soon) changes several things this plan builds on:
  - the parse result gains `slot`, null in object storage;
  - `parseTree` registers its finalizer only when `slot` is null, and sets `slot` and `releaseRoot`;
  - `parse` and `parseAndRead` run through `readOrRelease`, so a parse whose call throws holds nothing;
  - the side writes answer the parses they freed as `[slot, treeId]` pairs, for `BuiltArena.forgetParses`;
  - `dispose` drops freed parses, drains the held table, then calls `release_built`.
  The arena tree drop that follows rewrites `parse`, `parseTree` and the read again.
- **Reference:** `origin/probe/threading` (`parse_render_batch`, `packages/tools/src/profile/threading/pipeline.ts`), and the oxc reference harness in `scripts/ci/paired-refs/reference/` on `origin/bench/oxc-reference`.

**Executor:** sittir-engine-api for Tasks 1–8, sittir-prototype for Task 9 (the maintainer, 2026-11-10). **Reviewer:** sittir-brainstorm, at the end of every task.

**Base and order:**
- Each task is its own PR from `origin/master`, once the one before it has merged. Merges wait for the maintainer's word.
- Order: Tasks 1, 3, 4, 6, then Tasks 2, 5, 7 once the arena tree drop has merged, then 8, then 9. Tasks 2, 5 and 7 build on the drop rather than the drop riding on them.
- A task holds while an arena PR touching the same functions is open, and whichever lands second merges master in.

## Global Constraints

- **No text in JavaScript on a file path.** `read` (with no parse interceptor), `write`, `create`, `$save`, `Rendered.save`, `applyStyle` and `checkStyle` carry no source or rendered text through JavaScript. Text crosses only for `toString()`, `$render()`, `print()`, `$text()`, `diff()`, trivia sides, `parse(source)` and an interceptor's request.
- **One writer.** Every file write goes through `sittir-core::file_io::write_file`. No `writeFileSync` and no `std::fs::write` remain on a runtime write path. Codegen's `util/write-file-atomic.ts` writes generated outputs and is not a runtime path.
- **The writer writes in place** (the maintainer, 2026-11-10: "In place, restore on error"). It never replaces the file, so every kind of metadata survives. It uses no scratch file, hard link or rename, and calls no `sync_data` or `sync_all`. A create whose write fails partway leaves the partial file and says so; nothing is removed by path (the maintainer, 2026-11-11).
- **A parsed tree's source bytes and strings never cross to JavaScript in bulk.**
- **The batch is arena-only.** It refuses object storage, and an engine with a `render`, `parse` or `file` interceptor, by name.
- **The lock-free census doesn't rise.**
  - Add no lock and no atomic. The batch's threads share only the process's read-only tables, and work is split before they start.
  - The census pins exact counts. A task that adds or removes a counted name moves that file's ceiling in the same commit.
- **No napi or V8 call runs off the JavaScript thread.** The batch's threads run Rust only. They never touch `LIVE_TREES` or an engine's held-parse table.
- **Tree-sitter's parser and tree never outlive the `parse` call in arena storage.** At most one parse is live per batch thread.
- **Byte identity.** The batch's output equals a one-thread run, and equals `engine.write` of each file on its own. Renders stay byte-identical and records word-identical in both storages after every task.
- **No getters, setters or `defineProperty`.** `Pending.path` is a plain property.
- **Generated outputs are regenerated, never edited:** `packages/<grammar>/native/index.{d.ts,cjs}`, `src/backend.ts`, `src/api.ts`, `src/descriptor.ts`, `src/wrap.ts`, `src/types.ts` and the factories. Use `pnpm run regen:all`.
- **Comments:** hand-written TypeScript in `packages/{codegen,common,tools,types}/src` carries none. Rust comments state live constraints. Neither names a spec, plan, PR or task.
- **JSDoc:** each new or changed public declaration reachable through the engine carries its usage contract in source: `Pending`, `FileWrite`, `SavesFile`, `read`, `write`, `create`, `applyStyle`, `checkStyle`, `isSourcePath`, `SourcePath`, `StyleResult`, `StyleRefusal` and the `threads` option.
- **Three-way verification** before every commit that can change what the pipeline reads, renders, parses or validates:
  - targeted probes of the changed paths;
  - `pnpm run validate:history` compared with numbers;
  - the full suite (`pnpm test`).
  Also run `cargo test --workspace --no-default-features` in plain and arena builds, and clippy in CI's four configurations.
- **API rows:** each PR body lists its public API changes. The reviewer takes them to the maintainer before approval.
- **Git:** pathspec commits (`git commit -- <paths>`). No force, stash, amend, rebase, revert or abort. Push by literal sha.
- **Speed numbers come from CI only,** compared by the ratio to oxfmt on the same CPU model.

## Review Focus

1. **A file whose bytes already equal its render:** a UTF-8 BOM, no final newline, or CRLF under `newline: '\r\n'`. `write`, `save` and `applyStyle` leave it untouched, with the same inode and mtime and `changed: false`. Under the default `'\n'`, a CRLF file is rewritten with LF and reported changed. Owned by Task 1 (save) and Task 8 (batch).
2. **The writer keeps what the file was.** A save keeps the file's mode, owner, ACL and extended attributes. A hard-linked file stays one file with its link. A symlinked path writes the link's target and keeps the link. A failed write (missing directory, no permission, a target that isn't a regular file, a write cut off partway) leaves the target's bytes as they were and names the path. Owned by Task 1.
3. **A `Pending` used twice:** awaited twice, awaited then disposed, or its root edited between `write` and the commit. It writes once, and it writes the root as it is at the commit, which `diff().after` matches. Owned by Task 3.
4. **A long-lived process formatting again and again,** such as a watch mode running `applyStyle` over 5,000 files every save. It never exhausts the process's tree ids: a batch worker's parse claims none. Owned by Task 8.
5. **One file passed twice to `applyStyle`,** by the same path or by two spellings of it (`./a.ts` and `a.ts`). The call rejects before any work, naming the path. Owned by Task 8.

---

### Task 1: The one native writer, and every save through it

**Files:**
- Create: `rust/crates/sittir-core/src/file_io.rs`, registered in `lib.rs`
- Modify: `napi_engine.rs` (`render_to_file`, three new file siblings, and `write_text`)
- Modify: `packages/common/src/engine.ts` (`createRenderHandle`, `saverOf`, `NativeEngineLike`, `ENGINE_FUNCTIONS`, `renderNativeNode`); `create-engine.ts::interceptedRender`
- Modify: `native-typings.test.ts` (`ADDON_FUNCTIONS`)
- Regenerate: `packages/<grammar>/native/*`
- Test: `file_io.rs` unit tests; `packages/common/tests/render-save.test.ts`

**Interfaces:**
- Produces, in Rust:
  - `pub enum WriteMode { Replace, CreateNew }`
  - `pub fn write_file(path: &Path, bytes: &[u8], mode: WriteMode) -> Result<bool, FileError>`: `Ok(true)` when it wrote, `Ok(false)` when `Replace` found the bytes already equal.
  - `pub fn read_source(path: &Path) -> Result<String, FileError>`
  - `pub enum FileError { Read { path, cause }, Encoding { path, byte }, Write { path, cause }, Exists { path } }`. Its `Display` names the path and the cause. `FileError::reason(&self) -> &'static str` gives `"unreadable" | "encoding" | "unwritable" | "exists"`.
- Produces, in napi. Each takes the engine handle first and returns whether it wrote:
  - `renderToFile(engine, node, path, create, treeId?, options?)`
  - `renderRecordToFile(engine, treeId, address, leading, trailing, path, create, options?)`
  - `renderBuiltToFile(engine, owner, address, leading, trailing, path, create, treeId?, options?)`
  - `renderBuiltLeafToFile(engine, owner, kind, entry, sides, leading, trailing, path, create, options?)`
  - `writeText(path, text, create)`, for text a render interceptor produced in JavaScript.
- Produces, in TypeScript:
  - `createRenderHandle(text: () => string, save: (path: string, create: boolean) => boolean): Rendered`, with `save` required. `Rendered.save(path)` calls it with `create` false.
  - `saverOf(rendered: Rendered): (path: string, create: boolean) => boolean`, read from a module-private `WeakMap`, so a `Rendered` gains no member. Task 3 commits through it.
  - `interceptedRender`'s handle saves its intercepted text through `writeText`.

- [ ] **Step 1: Write the failing Rust tests** in `file_io.rs`:

```rust
#[test] fn an_unchanged_file_is_not_rewritten()        // same bytes → Ok(false); ino and mtime unchanged
#[test] fn a_changed_file_is_written_in_place()        // Ok(true); content equal; the same inode
#[test] fn create_new_refuses_an_existing_file()       // Err(Exists); the file's bytes unchanged
#[test] fn a_missing_directory_is_refused_by_path()    // Err(Write); Display contains the path; no directory created
#[test] fn a_save_keeps_mode_and_hard_links()          // #[cfg(unix)] 0o755 survives; a hard link reads the new bytes
#[test] fn a_save_keeps_extended_attributes()          // #[cfg(target_os = "macos")] an xattr set before survives the save
#[test] fn a_symlinked_path_writes_its_target()        // #[cfg(unix)] the link is still a link; the target holds the new bytes
#[test] fn a_path_that_is_not_a_regular_file_is_refused() // a directory, and #[cfg(unix)] a FIFO, → Err(Write) without blocking
#[test] fn a_failed_write_restores_the_original()      // a writer that fails after n bytes → Err(Write); the file holds its original bytes
#[test] fn a_failed_create_is_left_partly_written_and_says_so() // CreateNew, and Replace of a missing path: a writer that fails after n bytes → Err(Write) whose Display names the path and says the file is partly written
#[test] fn a_non_utf8_source_is_refused_by_path()      // read_source of [b'a', 0xff] → Err(Encoding { byte: 1, .. }); Display names the path
```

- [ ] **Step 2:** Run `cargo test -p sittir-core --no-default-features file_io`. Expected: FAIL (no module).
- [ ] **Step 3: Implement `file_io`.**
  - Read the current bytes when the file exists. Equal bytes under `Replace` return `Ok(false)` without writing.
  - Refuse a path whose metadata isn't a regular file before opening it, so a FIFO never blocks.
  - `Replace` opens the existing file (following a symlink), truncates it and writes the bytes. `CreateNew`, and `Replace` of a missing path, open with `create_new`, which refuses an existing file, and write in place. A failed create leaves what it wrote and says so in the error.
  - The write goes through one function generic over `Write`, so a test can make it fail partway. On a failed write, rewrite the original bytes and return the error, naming the path, and saying so if the restore failed too.
  - Never sync, and never create a directory.
- [ ] **Step 4:** Run the Rust tests again. Expected: PASS.
- [ ] **Step 5: Write the TypeScript tests** `render-save.test.ts`, as `describe.each(['object', 'arena'])` over a rust engine:

```ts
it('saves a parsed root as the bytes it renders')     // readFileSync(p, 'utf8') === root.toString()
it('leaves an unchanged file untouched')              // parse a file's text, render(root).save(p): statSync(p).ino and .mtimeMs equal before and after
it('leaves BOM-led and unterminated files untouched') // a '﻿'-led source and one with no final newline: mtime unchanged
it('leaves a CRLF file untouched under a CRLF newline') // engine with render: { layout: { newline: '\r\n' } }: mtime unchanged
it('rewrites a CRLF file to LF under the defaults')   // default engine: the file now holds '\n' line endings
it('saves a built root')                              // render(build(...)).save(p): file === render(...).toString()
it('refuses a missing directory, naming the path')    // toThrow(/no-such-dir/)
it('an intercepted render saves the intercepted text') // intercept: [{ render: (c, next) => next() + '// x\n' }]: file === render(root).toString()
```

- [ ] **Step 6:** Run `pnpm exec vitest run packages/common/tests/render-save.test.ts`. Expected: the "untouched" cases FAIL in both storages, since `writeFileSync` and `std::fs::write` both rewrite. The intercepted case passes today and pins that behavior.
- [ ] **Step 7: Implement the napi siblings and the TypeScript side.**
  - Each `*_to_file` renders as its text sibling does, then calls one helper, `save_rendered(path, text, create) -> napi::Result<bool>`, over `file_io::write_file`. `write_text` calls the same helper. The helper maps a `FileError` to a napi error carrying its `Display`.
  - `renderNativeNode` passes the matching saver for each of its four branches.
  - `createRenderHandle` drops the fallback and records its saver for `saverOf`, and `engine.ts` drops `node:fs`.
- [ ] **Step 8:** Run `pnpm run regen:all`, then add the five new names to `ADDON_FUNCTIONS`.
- [ ] **Step 9:** Run the render-save and native-typings tests. Expected: PASS.
- [ ] **Step 10:** Run the three-way verification, cargo, clippy and the census.
- [ ] **Step 11:** Commit `file_io.rs`, `lib.rs`, `napi_engine.rs`, `engine.ts`, `create-engine.ts`, both tests and the regenerated natives (pathspec). Message: `feat(core): one native writer, and every render's save through it`.

### Task 2: `parse` returns an object (after the arena tree drop)

**Files:**
- Modify: `napi_engine.rs` (`SittirEngine::parse`)
- Modify: `packages/common/src/engine.ts` (`NativeEngineLike.parse`, `NativeEngineInstance.parse`, `parseTree`)
- Regenerate: the natives
- Test: `packages/common/tests/native-parse-result.test.ts`

**Interfaces:**
- Produces: napi `SittirEngine.parse(source: string): NativeParseResult`, a plain object with every field the JSON carried when the task starts: `{ treeId, slot, options, errors }` once the arena work has landed. `@sittir/types`' `NativeParseResult` gains `slot`.
- Produces: `treeFromParse(parsed: NativeParseResult): TreeHandle` in `engine.ts`. It's `parseTree` from the parsed result on, keeping all of its behavior: the finalizer only when `slot` is null, `slot` and `releaseRoot` on the handle, and the side-write report routed to the engine's built arena. Task 5 reuses it. The name stays clear of `tree-token.ts::treeOf`.

- [ ] **Step 1: Write the failing test.**

```ts
it('parse answers an object, not JSON')   // typeof r === 'object'; Number.isInteger(r.treeId); Array.isArray(r.errors); 'slot' in r
it('a parse with errors carries them')    // errors.length > 0 for 'fn main( {'; the root's $errors deep-equals them
```

- [ ] **Step 2:** Run it. Expected: FAIL (`typeof` is `'string'`).
- [ ] **Step 3: Implement.** Return a `#[napi(object)]` struct, or `serde_json::Value` through napi's serde conversion, and make `parseTree(source)` be `treeFromParse(engine.parse(source))`.
- [ ] **Step 4:** Regenerate and run the test with the arena work's held-parse tests. Expected: PASS.
- [ ] **Step 5:** Run the three-way verification, then commit (pathspec). Message: `perf(core): parse answers its result as an object`.

### Task 3: `engine.write`, `engine.create`, `Pending` and the file interceptor

**Files:**
- Modify: `packages/types/src/engine-api.ts` (`Pending`, new `FileWrite`, `Interceptor.file`, and `EngineIdentity` gains `rootKinds: readonly number[]` beside `trivia`)
- Create: `packages/common/src/pending.ts`
- Modify: `create-engine.ts` (`write`, `create`, and the file chain beside `parseChain`/`renderChain`)
- Modify: `packages/codegen/src/emitters/engine.ts::emitApi` (emit `rootKinds` from `rootKindIds(nodeMap)`)
- Test: `packages/common/tests/file-verbs.test.ts`

**Interfaces:**
- Consumes: Task 1's `saverOf`. A commit is `saverOf(engine.render(root))(path, verb === 'create')`, so it writes what `render` gives, a render interceptor included. Neither verb parses, so neither needs `readOrRelease`.
- Produces (public):
  - `interface Pending extends PromiseLike<void>, AsyncDisposable { readonly path: string; diff(): FileChange }`
  - `interface FileWrite { readonly path: string; readonly verb: 'create' | 'write'; diff(): FileChange }`
  - `Interceptor.file?(change: FileWrite, next: () => Promise<void>): Promise<void>`
  - `FileChange` is unchanged.
- Produces (internal): `pendingFile(path: string, verb: 'create' | 'write', commit: () => void, diff: () => FileChange, chain: FileChain | undefined): Pending` in `pending.ts`.

- [ ] **Step 1: Write the failing tests,** in both storages:

```ts
it('write commits when awaited')                    // await engine.write(p, root); readFileSync(p,'utf8') === root.toString()
it('an unawaited, undisposed write writes nothing') // engine.write(p, root); await new Promise(r => setImmediate(r)); existsSync(p) === false
it('await using commits at the end of the scope')   // { await using w = engine.write(p, root); existsSync(p) === false } then existsSync(p)
it('commits once however often it is awaited')      // await w; await w; await w[Symbol.asyncDispose](); a file interceptor's next ran once
it('writes the root as it is at the commit')        // w = write(p, root); edit root's trivia; await w; file === root.toString() === w.diff().after
it('diff names a new file with no before')          // w.diff() deep-equals { path: p, before: undefined, after: root.toString() }
it('refuses a node that is not a root, naming its kind')   // await expect(engine.write(p, child)).rejects.toThrow(/<child kind>/)
it("refuses another engine's root")                 // rejects /engine/
it('create writes a new file and refuses an existing one') // second create on p rejects /exists/; p's bytes unchanged
it('a file interceptor sees path and verb, and can skip the write') // never calls next → existsSync(p) false; change.verb === 'write'
it('a write under a render interceptor writes the intercepted text') // file === engine.render(root).toString()
```

- [ ] **Step 2:** Run `pnpm exec vitest run packages/common/tests/file-verbs.test.ts`. Expected: FAIL (`file verb "write" is not implemented`).
- [ ] **Step 3: Implement.**
  - **The commit.** It starts on the first `then` or `[Symbol.asyncDispose]` and is held as one promise. It calls the file chain with `{ path, verb, diff }` when file interceptors are registered. `next` runs the saver.
  - **`diff()`.** It renders the root through `render` and reads `before` with `readFileSync`, or gives `undefined` for a missing file. The caller asked for that text.
  - **`create(path, fn)`.** It builds with `fn(build)` when called, so a builder that throws throws from `create`.
  - **The root check.** Read the stamped `rootKinds`, never a kind name.
  - `unimplementedVerb` keeps only its `'read'` use, until Task 5.
- [ ] **Step 4:** Regenerate, then run the tests. Expected: PASS.
- [ ] **Step 5:** Run `pnpm run type-check:tests` and the types package's `test-d` files, since `Pending` changed shape.
- [ ] **Step 6:** Run the three-way verification, then commit (pathspec). Message: `feat(common): write and create commit through the native writer`.

### Task 4: `root.$save(path)`

**Files:**
- Modify: `packages/types/src/engine-api.ts` (new `interface SavesFile { $save(path: string): Pending }`)
- Modify: `packages/codegen/src/emitters/node-members.ts` (`nodeMemberParts`, when `spec.root`), `emitters/wrap.ts::emitRecordHandle` (when `node.grammarRoot`), `emitters/record-construction.ts` (the built root) and `emitters/types.ts` (the root kind's node types gain `& SavesFile`)
- Modify: `packages/common/src/utils.ts` (one shared `handleSave`, beside `handleRender`)
- Regenerate: all five grammars
- Test: `packages/common/tests/save-root.test.ts`, and a `test-d` file in `packages/types/tests`

**Interfaces:**
- Consumes: `engine.write` from Task 3.
- Produces: `handleSave(this, path)`, which is `engineOf(this).write(path, this)`. It refuses with `NO_ENGINE` when `engineOf` finds none, as `handleRender` does. It's emitted on the root kind only.

- [ ] **Step 1: Write the failing tests.**

```ts
it('a parsed root saves through write')   // both storages: await root.$save(p); file === root.toString()
it('a built root saves')                  // const root = engine.build...; await root.$save(p)
it('only the root kind has $save')        // child.$save === undefined
// test-d: expectTypeOf(root.$save).returns.toEqualTypeOf<Pending>(); // @ts-expect-error child.$save
```

- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3: Implement.** Emit one member line, `$save: handleSave`, from the three emitters at their root flag.
- [ ] **Step 4:** Run `pnpm run regen:all`, then the tests and `type-check:tests`. Expected: PASS.
- [ ] **Step 5:** Run the three-way verification, then commit (pathspec, generated outputs included). Message: `feat(codegen): a root saves itself through engine.write`.

### Task 5: `engine.read(path)` (after the arena tree drop)

**Files:**
- Modify: `napi_engine.rs` (`SittirEngine::parse_file(path) -> NativeParseResult`, holding its parse in a slot as `parse` does, through `hold`; and `read_source(path) -> String`)
- Modify: `engine.ts` (`NativeEngineLike.parseFile`, `readSource`, and `parseFileTree`, which is `treeFromParse(engine.parseFile(path))`)
- Modify: `create-engine.ts` (`read`, through `readOrRelease`; `unimplementedVerb` goes)
- Test: `packages/common/tests/file-read.test.ts`

**Interfaces:**
- Consumes: `file_io::read_source` (Task 1) and `treeFromParse` (Task 2).
- Produces: `engine.read(path, options?) -> Promise<root>`, the same root and `$errors` as `parse` of the file's text.

- [ ] **Step 1: Write the failing tests,** in both storages:

```ts
it('reads a file to the root parse gives')        // (await engine.read(p)).toString() === engine.parse(text).toString(); $errors equal
it('rejects an unreadable path, naming it')       // rejects /missing\.rs/
it('rejects a file that is not UTF-8, naming it') // with no interceptor, and with a parse interceptor: both reject /not valid UTF-8/ and name p
it('gives a parse interceptor the source')        // intercept: [{ parse(call, next) { seen = call.source; return next(); } }]; seen === text
it("a read that throws holds nothing")            // errors: 'throw' on a source with errors rejects ParseErrors, and the engine's held-parse count is back to its value before
it('rejects a path that is not a regular file without blocking') // a directory, and on unix a FIFO with no writer: rejects /not a regular file/ and names p, within a timeout, on both routes
```

`file_io::read_source` reads with `fs::read` as Task 1 shipped it, so a FIFO blocks it. Before this task exposes it, it refuses a path whose metadata isn't a regular file before opening it, as `write_file` does, with its own Rust test beside `a_path_that_is_not_a_regular_file_is_refused`.

- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - With no parse interceptor, `read` calls `parseFile`, so the source stays native.
  - With one, it calls `readSource(path)` and runs `parse`'s own path with that text. Both routes validate through `read_source`, so there's one refusal.
  - The read is synchronous on the JavaScript thread. Its result comes back as a settled promise, and a refusal rejects it.
- [ ] **Step 4:** Regenerate, add `readSource` to `ADDON_FUNCTIONS`, and run the tests. Expected: PASS.
- [ ] **Step 5:** Run the three-way verification, then commit (pathspec). Message: `feat(common): read parses a file natively`.

### Task 6: Query plans by handle, and walks in numbers

**Parked.** The one-query-evaluator spec (`2026-10-08-one-query-evaluator.md`) deletes the native evaluator this task builds on and rules out an interim plan cache. This task waits until that work is scheduled, and is then either cut to walks in numbers or reconciled with that spec. Nothing else in this plan needs it; Task 7's guard lists these two crossings as remaining until then.

**Files:**
- Modify: `napi_engine.rs` (`descendants`, `plan_holds`, a new `compile_plan`, and `dispose`; `address_from_json` goes)
- Modify: `rust/crates/sittir-core/src/engine.rs`. `Engine` owns the compiled plans behind `EngineCell`'s existing borrow, with no new counted name.
- Modify: `engine.ts` (`descendants` and `planHolds` move from `TREE_FUNCTIONS` to `ENGINE_FUNCTIONS`; one decoder for the walk's result)
- Test: Rust unit tests on the plan table; the existing query suites in `packages/common/tests`

**Interfaces:**
- Produces, in napi:
  - `compilePlan(engine, plan: object) -> number`. The plan is `query::PlanSpec` as a napi object. An equal plan returns the handle it already has.
  - `descendants(engine, from: number[], kinds, resume, limit, plan: number | null, depth) -> number[]`
  - `planHolds(engine, addresses: number[], plan: number) -> boolean[]`
  - The number encoding of an address and of a batch is left to the builder. It's written once in Rust and decoded once in TypeScript, by `decodeDescendants(words: readonly number[]): DescendantBatch`.
- Produces, in TypeScript: a per-engine `Map<string, number>` from a plan's structural key to its handle, so a plan crosses once per engine. Handles never pass between engines, so a handle is an index into its engine's table and claims no process id.
- `dispose` frees the plan table beside the held-parse drain and `release_built`, keeping their order.

- [ ] **Step 1: Write the failing Rust tests.**

```rust
#[test] fn an_equal_plan_compiles_once()             // compile twice → same handle; the table holds 1 plan
#[test] fn a_handle_the_table_lacks_is_refused()     // naming the handle
#[test] fn a_walk_round_trips_through_numbers()      // encode(batch) decodes to the same items, resume and origin
```

- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3: Implement.** Use the engine-owned plan table. `descendants` and `planHolds` take numbers. TypeScript keeps the handle map and one decoder.
- [ ] **Step 4:** Regenerate, then run the Rust tests and every query suite (`pnpm exec vitest run packages/common/tests/query`). Expected: PASS, with no query result changed.
- [ ] **Step 5:** Run the three-way verification, then commit (pathspec). Message: `perf(core): query plans compile once per engine and walks cross as numbers`.

### Task 7: The crossing guard, and the crossings left (after Task 2)

**Files:**
- Create: `packages/codegen/src/emitters/__tests__/native-crossings.test.ts`
- Modify: `napi_engine.rs`.
  - The six side-taking functions take the side as a number, from napi constants `TRIVIA_SIDE_LEADING`, `TRIVIA_SIDE_TRAILING` and `TRIVIA_SIDE_INNER`, which TypeScript reads from the module. The side writes keep returning the `[slot, treeId]` pairs they freed.
  - Remove `SittirEngine::find_and_read`.
  - Remove `read_many` when nothing calls it on master or on any `origin/bench/*` branch. Otherwise its `wire` becomes a number, and it gets a `'record words'` entry.
- Modify: `packages/codegen/src/emitters/grammar-runtime.ts` (drop `findAndRead`), and every TypeScript caller of a side-taking function
- Regenerate: all five grammars
- Test: the guard itself

**Interfaces:**
- Produces: `CROSSINGS: Record<string, Reason>`, with `type Reason = 'requested text' | 'caller input' | 'built buffers' | 'record words' | 'error message'`. Task 8 adds its entries.

- [ ] **Step 1: Write the guard.**
  - Parse each grammar's `native/index.d.ts` with the `typescript` compiler API.
  - Take every exported function, and every `SittirEngine` method as `SittirEngine.<name>`, whose parameter or return type text contains `string`, `Uint8Array`, `Uint32Array`, `ArrayBuffer` or `Buffer`.
  - Object-typed parameters, such as a compiled plan's spec, are out of its reach; the spec's "still crosses by design" covers them.

```ts
it.each(GRAMMARS)('%s crosses strings and buffers only where CROSSINGS says', (g) => {
	expect(crossingsOf(g)).toEqual(Object.keys(CROSSINGS).sort()); // a new crossing fails; an entry with no function fails
});
const CROSSINGS = {
	render: 'requested text', renderRecord: 'requested text', renderBuilt: 'requested text', renderBuiltLeaf: 'requested text',
	text: 'requested text', readSource: 'requested text',
	'SittirEngine.parse': 'caller input', 'SittirEngine.parseFile': 'caller input', writeText: 'caller input',
	renderToFile: 'caller input', renderRecordToFile: 'caller input', renderBuiltToFile: 'caller input', renderBuiltLeafToFile: 'caller input',
	builtWords: 'built buffers', builtBytes: 'built buffers',
	chunk: 'record words'
} as const satisfies Record<string, Reason>;
```

- [ ] **Step 2:** Run it. Expected: FAIL, listing the six side-taking functions, `findAndRead` and `readMany`.
- [ ] **Step 3: Implement** the side constants, the removals and the TypeScript callers.
- [ ] **Step 4:** Run `pnpm run regen:all`, then the guard and native-typings tests. Expected: PASS.
- [ ] **Step 5:** Run the three-way verification, then commit (pathspec). Message: `test(core): every string or buffer crossing is listed with its reason`.

### Task 8: `engine.applyStyle` and `engine.checkStyle`

**Files:**
- Create: `rust/crates/sittir-core/src/format_batch.rs` (the schedule and the worker loop, generic over the grammar as the probe's `parse_render_batch` is)
- Modify: `napi_engine.rs` (`style_files`, an `AsyncTask`, with a `check` flag)
- Modify: `packages/types/src/engine-api.ts`:
  - `Engine.applyStyle`, `checkStyle` and `isSourcePath`;
  - `SourcePath`, `StyleResult` and `StyleRefusal`;
  - `threads` in `EngineSettings`;
  - `LanguageAPI` gains `fileType`.
- Modify: `packages/codegen/src/emitters/index-file.ts` and the API emitter. `fileTypes` is emitted as a literal tuple, and the API type gains `fileType`: the union of the grammar's file types, `never` for none.
- Modify: `create-engine.ts` (`threads` checked at creation; the refusals; the duplicate check; the merge back into argument order); `engine.ts` (`NativeLanguageEngine.styleFiles`)
- Modify: `native-crossings.test.ts` (`styleFiles: 'caller input'`)
- Test: `format_batch.rs` unit tests; `packages/common/tests/apply-style.test.ts`; a `test-d` file in `packages/types/tests`

**Interfaces:**
- Consumes: `file_io::{read_source, write_file}` (Task 1), and the engine's render-options resolution (`render_options`).
- Produces (public):

```ts
type SourcePath<API extends LanguageAPI> = `${string}.${API['fileType']}`;
type StyleResult =
	| { readonly path: string; readonly changed: boolean; readonly errors: readonly ErrorRegion[] }
	| { readonly path: string; readonly refused: StyleRefusal };
interface StyleRefusal { readonly reason: 'unreadable' | 'encoding' | 'unwritable'; readonly message: string }
applyStyle(...paths: SourcePath<API>[]): Promise<readonly StyleResult[]>
checkStyle(...paths: SourcePath<API>[]): Promise<readonly StyleResult[]>
isSourcePath(path: string): path is SourcePath<API>
// EngineSettings: readonly threads?: number
```

- Produces (internal): `pub fn schedule(sizes: &[u64], threads: usize) -> Vec<Vec<Vec<usize>>>`, giving each thread its chunks of file indexes.

- [ ] **Step 1: Write the failing Rust schedule tests.**

```rust
#[test] fn files_go_largest_first()                 // within each thread, chunk order follows descending size
#[test] fn a_chunk_holds_at_most_8_files_or_128_kib() // except a single file over 128 KiB, which is its own chunk
#[test] fn the_split_balances_bytes()               // greedy least-loaded: max thread bytes ≤ min + largest file
#[test] fn every_file_is_scheduled_once()           // the union of all chunks is 0..n, with no repeat
```

- [ ] **Step 2: Write the failing TypeScript tests,** on an arena rust engine over a temporary corpus. The corpus is copied from the repo's rust fixtures, plus one file with parse errors, one that isn't UTF-8, and BOM-led and CRLF files:

```ts
it('applies style byte-identically to write, at every thread count')
	// engines with threads 1, 2 and 4, each on a fresh copy: every file equals `await engine.write(p, await engine.read(p))` on its own; results deep-equal across counts
it('checkStyle reports and writes nothing')         // every file's bytes and mtime unchanged; `changed` equals applyStyle's
it('refuses a file and goes on')                    // a missing path → unreadable; not UTF-8 → encoding; a read-only file under applyStyle → unwritable; the rest formatted
it('formats a file with parse errors')              // errors deep-equal (await engine.read(p)).$errors
it('line endings follow the render options')        // default engine: the CRLF file is changed to LF; a newline: '\r\n' engine leaves it untouched
it('refuses object storage and interceptors by name') // object engine; intercept [{render}], [{parse}], [{file}] → each rejects naming it
it('rejects a path passed twice before any work')   // applyStyle('a.rs', './a.rs') rejects /a\.rs/; no file's mtime moved
it('refuses a bad thread count at creation')        // createEngine with threads 0, 1.5, -1 throws naming the value; an object-storage engine with threads throws
it('leaves the calling engine usable meanwhile')    // const run = engine.applyStyle(...ps); engine.parse(src).toString() === src; await run
it('claims no tree id per file')                    // the process's next claimed tree id moves by at most a constant across applyStyle over 200 files
it('isSourcePath narrows by the file types')        // rust: 'a.rs' true, 'a.txt' false
// test-d: rust's applyStyle takes `${string}.rs`; // @ts-expect-error rust.applyStyle('a.txt'); regex's SourcePath is never
```

- [ ] **Step 3:** Run both test files. Expected: FAIL.
- [ ] **Step 4: Implement.**
  - **TypeScript, before native:**
    - Reject object storage and interceptors by name.
    - Resolve each path (`realpathSync` when it exists, else `resolve`) and reject a duplicate, naming it.
    - There's no extension check: the type is the gate, as the spec has it.
  - **Native `style_files`:**
    - Capture the engine's options and `threads` on the JavaScript thread. An absent `threads` is `std::thread::available_parallelism()`, and a count above the file count is cut to it.
    - In the task's `compute`, stat each file. A failed stat is refused as unreadable. Then `schedule`, and run `std::thread::scope` with one `Engine` per thread, built from the captured options.
    - Per file: read, parse (the parse frees tree-sitter's tree and claims no process tree id), render with the engine's render options over the tree's layer, compare, write with `Replace` unless `check`, then release the parse before the next file.
    - A worker's panic rejects the batch, naming the file. Files already written stay written, each whole.
  - **Merge:** native results come back by index, and TypeScript merges them with its own refusals in argument order.
- [ ] **Step 5:** Run `pnpm run regen:all`, then both test files and `type-check:tests`. Expected: PASS.
- [ ] **Step 6:** Run the census. Expected: every file at its ceiling.
- [ ] **Step 7:** Run the three-way verification, then commit (pathspec). Message: `feat(core): applyStyle and checkStyle format files on native threads`.

### Task 9: Measured beside oxfmt

**Files** (on `bench/oxc-reference`, after merging master with Task 8):
- Modify: `scripts/ci/paired-refs/reference/run.py`.
  - Add the tools `apply-style` and `check-style` at 1, 2, 4 and 8 threads, each through an engine created with that `threads`.
  - Time `oxfmt --write` and `oxfmt --check` at the same thread counts, taking the flags from the probe's `scripts/ox.py`.
  - Set both sides to the same line ending.
- Modify: `scripts/ci/paired-refs/reference/reference-worker.mjs`. Add `apply-style` and `check-style`. Add `per-file`, today's path: `parse(readFileSync)`, `render().toString()`, `writeFileSync`, one file at a time.
- Modify: `summarize.py` (the new columns: ratio to oxfmt per CPU model, and peak RSS)

- [ ] **Step 1:** Each round copies the corpus to a fresh scratch directory before any tool writes, so every write-mode round starts from the pinned bytes. Before timing, check that the copy's tree hash equals the pin. That copy, and any check of the outputs, sits outside the timed span. Every column times product work only, file in to file out, as the validators' read does once their copy is its own phase.
- [ ] **Step 2:** Run one local smoke round on matter.js at 1 thread. Expected: `apply-style`'s output tree hash equals the `per-file` tool's, and every column prints.
- [ ] **Step 3:** Commit (pathspec) and push by literal sha. Start the CI run, and give the reviewer the run id and its per-CPU table.

---

## Calls made in this plan, for the maintainer to check

1. **Order:** Tasks 1, 3, 4 and 6 first. Tasks 2, 5 and 7 build on the arena tree drop, then come 8 and 9.
2. **The writer writes in place, restoring the original on a failed write** (your ruling). It never syncs to disk and never creates a directory. A missing parent, or a path that isn't a regular file, is refused, naming the path.
3. **`create` refuses an existing file,** through `create_new`.
4. **`applyStyle` rejects the whole call** when it's given one file twice, before any work.
5. **A write under a render interceptor writes the intercepted text.** That text crosses back to native through `writeText`, since the interceptor asked for it.
6. **Strings with a closed set of values cross as numbers.** These are the trivia side and `readMany`'s `wire`. `findAndRead` is removed, and `readMany` too if nothing calls it.
7. **Query walks cross as numbers,** decoded once in TypeScript. An equal plan compiles once per engine. A plan handle is an index into its engine's table and claims no process id.
8. **The batch's work is split before its threads start,** largest first and greedy least-loaded, so the threads share no cursor and the census doesn't rise. A batch worker's parse claims no process tree id.
9. **The root check reads a stamped `rootKinds` fact** on `EngineIdentity`, emitted from the same `rootKindIds` that stamps `kind::ROOT_KINDS`.
10. **New public names:** `FileWrite`, `SavesFile`, `SourcePath`, `isSourcePath`, `applyStyle`, `checkStyle`, `StyleResult`, `StyleRefusal`, the `threads` engine option, `LanguageAPI['fileType']` and `EngineIdentity.rootKinds`. A refusal is `{ reason, message }`.
