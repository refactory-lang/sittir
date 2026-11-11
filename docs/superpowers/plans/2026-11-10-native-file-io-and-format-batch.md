# Native File I/O and Format Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task. This repo's rule is no subagents for code. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a file goes in as a path and comes out as a file, with no source or rendered text in JavaScript on the way. One native writer serves every write. An arena-only threaded batch formats a list of files, measured beside oxfmt, and a guard keeps unrequested crossings from coming back.

**Architecture:**
- One Rust module, `sittir-core::file_io`, reads a source file (with UTF-8 validation) and writes a rendered file atomically. Every save, write, create and batch file goes through it.
- The napi layer gains a file sibling for each render entry point, a file parse, plan handles and the batch task. Its results cross as objects and numbers, not JSON.
- `packages/common` builds `Pending`, the file verbs, `$save` and `formatFiles` on those entry points. The batch runs scoped Rust threads with one engine each, inside one asynchronous napi task.

**Tech stack:** Rust (`sittir-core`, the `napi_engine!` macro), napi-rs, TypeScript in `packages/{types,common,codegen}`, and the oxc reference harness on `bench/oxc-reference`.

**Spec:** `docs/superpowers/specs/2026-11-10-native-file-io-and-format-batch-design.md`. Read it first.

**Facts this plan starts from (master de1b914cd):**
- `engine.read`, `write` and `create` throw `unimplementedVerb` (`packages/common/src/create-engine.ts:105`, used at 332–357).
- `createRenderHandle(renderText, saveImpl?)` (`packages/common/src/engine.ts:38`) falls back to `writeFileSync`. Only object storage passes a saver, `renderToFile` (`engine.ts:730`), which writes with `std::fs::write` (`rust/crates/sittir-core/src/napi_engine.rs:677`).
- napi `parse` returns JSON (`napi_engine.rs:344`), parsed at `engine.ts:614`. `descendants` and `planHolds` take JSON (`napi_engine.rs:587, 631`; `compile_plan` and `address_from_json` at 1306–1316; the TS side at `engine.ts:671–683`). Both are module functions with no engine handle (`TREE_FUNCTIONS`, `engine.ts:328`).
- The trivia side crosses as a string in `triviaSide`, `writeTriviaSide`, `builtTriviaSide`, `writeBuiltTriviaSide`, `builtLeafSide` and `writeBuiltLeafSide`.
- `SittirEngine.findAndRead` has no caller. Its only use is the generated `backend.ts` type, from `packages/codegen/src/emitters/grammar-runtime.ts:61`. `readMany` has no caller in `packages/`.
- Each grammar's napi exports are in its generated `packages/<grammar>/native/index.d.ts`. `packages/codegen/src/emitters/__tests__/native-typings.test.ts` pins the export list (`ADDON_FUNCTIONS`).
- Node members are emitted in three places:
  - `emitters/node-members.ts::nodeMemberParts`, for object nodes, built and parsed;
  - `emitters/wrap.ts::emitRecordHandle`, for arena record views;
  - `emitters/record-construction.ts`, for arena built nodes.
  The grammar root is flagged by `node.grammarRoot` (`spec.root` in `nodeMemberParts`). `emitters/types.ts:958` picks a node type's methods interface.
- The root kinds are stamped natively as `kind::ROOT_KINDS` (`emitters/kind-id-rust.ts:130`), from `emitters/wrap.ts::rootKindIds`.
- `Language.fileTypes` (each grammar's `descriptor.ts`) is the one source of a language's extensions. Regex declares none.
- **Reference:** `origin/probe/threading` holds the probe's `parse_render_batch` (scoped threads, one engine each, size-first order) and `packages/tools/src/profile/threading/pipeline.ts`. The oxc reference harness is `scripts/ci/paired-refs/reference/` on `origin/bench/oxc-reference`.

**Executor:** the maintainer picks. **Reviewer:** sittir-brainstorm, at the end of every task.

**Base and order:**
- Each task is its own PR from `origin/master`, once the one before it has merged. Merges wait for the maintainer's word.
- Tasks 1–7 need only master. They touch `napi_engine.rs` and `engine.ts`, which the arena trees-from-records stack also changes. A task holds while an arena PR touching the same functions is open, and whichever lands second merges master in.
- Task 8 starts once the arena tree drop has merged. That is the arena plan's Task 6, its drop and TypeScript side, after which an arena parse keeps no tree-sitter tree.
- Task 9 follows Task 8.

## Global Constraints

- **No text in JavaScript on a file path.** `read` (with no parse interceptor), `write`, `create`, `$save`, `Rendered.save` and the batch carry no source or rendered text through JavaScript. Text crosses only for `toString()`, `$render()`, `print()`, `$text()`, `diff()`, trivia sides, `parse(source)` and an interceptor's request.
- **One writer.** Every file write goes through `sittir-core::file_io::write_file`. No `writeFileSync` and no `std::fs::write` remain on a runtime write path. Codegen's own `util/write-file-atomic.ts` writes generated outputs and is not a runtime path.
- **A parsed tree's source bytes and strings never cross to JavaScript in bulk.**
- **The batch is arena-only.** It refuses object storage, and an engine with a `render`, `parse` or `file` interceptor, by name.
- **The lock-free census doesn't rise.** Add no lock and no atomic. The batch's threads share only the process's read-only tables. Work is split before the threads start, so they need no shared cursor.
- **No napi or V8 call runs off the JavaScript thread.** The batch's threads run Rust only.
- **Tree-sitter's parser and tree never outlive the `parse` call in arena storage.** At most one parse is live per batch thread.
- **Byte identity.** The batch's output equals a one-thread run, and equals `engine.write` of each file on its own. Renders stay byte-identical and records word-identical in both storages after every task.
- **No getters, setters or `defineProperty`.** `Pending.path` is a plain property.
- **Generated outputs are regenerated, never edited:** `packages/<grammar>/native/index.{d.ts,cjs}`, `src/backend.ts`, `src/wrap.ts`, `src/types.ts` and the factories. Use `pnpm run regen:all`.
- **Comments:** hand-written TypeScript in `packages/{codegen,common,tools,types}/src` carries none. Rust comments state live constraints. Neither names a spec, plan, PR or task.
- **JSDoc:** each new or changed public declaration reachable through the engine carries its usage contract in source: `Pending`, `FileWrite`, `SavesFile`, `read`, `write`, `create`, `formatFiles`, `FormatOptions`, `FormatResult` and `FormatRefusal`.
- **Three-way verification** before every commit that can change what the pipeline reads, renders, parses or validates:
  - targeted probes of the changed paths;
  - `pnpm run validate:history` compared with numbers;
  - the full suite (`pnpm test`).
  Also run `cargo test --workspace --no-default-features` in plain and arena builds, and clippy in CI's four configurations.
- **API rows:** each PR body lists its public API changes. The reviewer takes them to the maintainer before approval.
- **Git:** pathspec commits (`git commit -- <paths>`). No force, stash, amend, rebase, revert or abort. Push by literal sha.
- **Speed numbers come from CI only,** compared by the ratio to oxfmt on the same CPU model.

## Review Focus

1. **A file whose rendered bytes already equal its bytes:** CRLF line endings, a UTF-8 BOM, no final newline. `write`, `save` and the batch leave it untouched, with the same inode and mtime and `changed: false`. Owned by Task 1 (save) and Task 8 (batch).
2. **Overwriting keeps the file's permission bits.** A path that is a symlink writes the link's target, and the link stays. Owned by Task 1.
3. **A write that fails** (missing directory, no permission, a target that is a directory) leaves the target as it was, with no scratch file behind, and names the path. Owned by Task 1.
4. **A `Pending` used twice:** awaited twice, awaited then disposed, or its root edited between `write` and the commit. It writes once, and it writes the root as it is at the commit, which `diff().after` matches. Owned by Task 3.
5. **One file listed twice in `formatFiles`,** by the same path or by two spellings of it (`./a.ts` and `a.ts`). The call rejects before any work, naming the path. Owned by Task 8.

---

### Task 1: The one native writer, and every save through it

**Files:**
- Create: `rust/crates/sittir-core/src/file_io.rs`, registered in `rust/crates/sittir-core/src/lib.rs`
- Modify: `rust/crates/sittir-core/src/napi_engine.rs` (`render_to_file`, plus three new file siblings)
- Modify: `packages/common/src/engine.ts` (`createRenderHandle`, `NativeEngineLike`, `ENGINE_FUNCTIONS`, `renderNativeNode`)
- Modify: `packages/codegen/src/emitters/__tests__/native-typings.test.ts` (`ADDON_FUNCTIONS`)
- Regenerate: `packages/<grammar>/native/*`
- Test: `file_io.rs` unit tests; `packages/common/tests/render-save.test.ts`

**Interfaces:**
- Produces, in Rust:
  - `pub enum WriteMode { Replace, CreateNew }`
  - `pub fn write_file(path: &Path, bytes: &[u8], mode: WriteMode) -> Result<bool, FileError>`: `Ok(true)` when it wrote, `Ok(false)` when `Replace` found the bytes already equal.
  - `pub fn read_source(path: &Path) -> Result<String, FileError>`
  - `pub enum FileError { Read { path, cause }, Encoding { path, byte }, Write { path, cause }, Exists { path } }`. Its `Display` names the path and the cause. `FileError::reason(&self) -> &'static str` gives `"unreadable" | "encoding" | "unwritable" | "exists"`, which Task 8 reports.
- Produces, in napi. Each takes the engine handle first and returns whether it wrote:
  - `renderToFile(engine, node, path, create, treeId?, options?) -> boolean`
  - `renderRecordToFile(engine, treeId, address, leading, trailing, path, create, options?) -> boolean`
  - `renderBuiltToFile(engine, owner, address, leading, trailing, path, create, treeId?, options?) -> boolean`
  - `renderBuiltLeafToFile(engine, owner, kind, entry, sides, leading, trailing, path, create, options?) -> boolean`
  - `writeText(path, text, create) -> boolean`, for text a render interceptor produced in JavaScript.
- Produces, in TypeScript:
  - `createRenderHandle(text: () => string, save: (path: string, create: boolean) => boolean): Rendered`, with `save` required. `Rendered.save(path)` calls it with `create` false.
  - `saverOf(rendered: Rendered): (path: string, create: boolean) => boolean` in `engine.ts`, read from a module-private `WeakMap`, so a `Rendered` gains no member. Task 3 commits through it.
  - `interceptedRender`'s handle saves the intercepted text through `writeText`.

- [ ] **Step 1: Write the failing Rust tests** in `file_io.rs`:

```rust
#[test] fn an_unchanged_file_is_not_rewritten()        // same bytes → Ok(false); ino and mtime unchanged
#[test] fn a_changed_file_is_replaced_whole()          // Ok(true); content equal; no scratch sibling left
#[test] fn create_new_refuses_an_existing_file()       // Err(Exists); the file's bytes unchanged
#[test] fn a_missing_directory_is_refused_by_path()    // Err(Write); Display contains the path; no directory created
#[test] fn overwrite_keeps_permission_bits()           // #[cfg(unix)] 0o755 before and after
#[test] fn a_symlinked_path_writes_its_target()        // #[cfg(unix)] the link is still a link; the target holds the new bytes
#[test] fn a_failed_write_leaves_no_scratch()          // target is a directory → Err(Write); its parent lists no scratch file
#[test] fn a_non_utf8_source_is_refused_by_path()      // read_source of [b'a', 0xff] → Err(Encoding { byte: 1, .. }); Display names the path
```

- [ ] **Step 2:** Run `cargo test -p sittir-core --no-default-features file_io`. Expected: FAIL (no module).
- [ ] **Step 3: Implement `file_io`.**
  - Read the current bytes when the file exists. Equal bytes under `Replace` return `Ok(false)` without writing.
  - Resolve an existing target through `fs::canonicalize`, so a symlink keeps its link.
  - Write a scratch file beside the resolved target. Its name carries the process id and the thread, with no counter.
  - Call `sync_data`, and copy the existing target's permissions onto the scratch.
  - Then `rename` for `Replace`, or `hard_link` and remove the scratch for `CreateNew`. A hard link fails when the target exists, so `CreateNew` never clobbers.
  - Remove the scratch on every error. Never create a directory.
- [ ] **Step 4:** Run the Rust tests again. Expected: PASS.
- [ ] **Step 5: Write the failing TypeScript test** `render-save.test.ts`, as `describe.each(['object', 'arena'])` over a rust engine:

```ts
it('saves a parsed root as the bytes it renders')   // readFileSync(p, 'utf8') === root.toString()
it('leaves an unchanged file untouched')            // write a source, parse it, render(root).save(p): statSync(p).ino and .mtimeMs equal before and after
it('saves a built root')                            // render(build(...)).save(p): file === render(...).toString()
it('refuses a missing directory, naming the path')  // toThrow(/no-such-dir/)
it('round-trips CRLF and a BOM untouched')          // a CRLF source and a '﻿'-led source: mtime unchanged after save
it('an intercepted render saves the intercepted text') // intercept: [{ render: (c, next) => next() + '// x\n' }]: file === render(root).toString()
```

- [ ] **Step 6:** Run `pnpm exec vitest run packages/common/tests/render-save.test.ts`. Expected: FAIL on arena's "unchanged" case, because `writeFileSync` rewrites the file.
- [ ] **Step 7: Implement the napi siblings and the TypeScript side.**
  - Each `*_to_file` renders exactly as its text sibling does, then calls one helper, `save_rendered(path, text, create) -> napi::Result<bool>`, over `file_io::write_file`. The helper maps a `FileError` to a napi error carrying its `Display`.
  - `renderNativeNode` passes the matching saver for each of its four branches.
  - `createRenderHandle` drops the fallback and records its saver for `saverOf`, and `engine.ts` drops `node:fs`.
- [ ] **Step 8:** Run `pnpm run regen:all`, then add the four new names to `ADDON_FUNCTIONS`.
- [ ] **Step 9:** Run the render-save and native-typings tests. Expected: PASS.
- [ ] **Step 10:** Run the three-way verification and the cargo and clippy runs.
- [ ] **Step 11:** Commit `file_io.rs`, `lib.rs`, `napi_engine.rs`, `engine.ts`, both tests and the regenerated natives (pathspec). Message: `feat(core): one atomic native writer, and every render's save through it`.

### Task 2: `parse` returns an object

**Files:**
- Modify: `napi_engine.rs` (`SittirEngine::parse`)
- Modify: `packages/common/src/engine.ts` (`NativeEngineLike.parse`, `NativeEngineInstance.parse`, `parseTree`)
- Regenerate: the natives
- Test: `packages/common/tests/native-parse-result.test.ts`

**Interfaces:**
- Produces: napi `SittirEngine.parse(source: string): NativeParseResult`, a plain object `{ treeId, options, errors }` matching `@sittir/types`' `NativeParseResult`.
- Produces: `treeOf(parsed: NativeParseResult): TreeHandle` in `engine.ts`, which is today's `parseTree` from the parsed result on. Task 5 reuses it.

- [ ] **Step 1: Write the failing test.**

```ts
it('parse answers an object, not JSON')   // typeof r === 'object'; Number.isInteger(r.treeId); Array.isArray(r.errors)
it('a parse with errors carries them')    // errors.length > 0 for 'fn main( {'; the root's $errors deep-equals them
```

- [ ] **Step 2:** Run it. Expected: FAIL (`typeof` is `'string'`).
- [ ] **Step 3: Implement.** Return a `#[napi(object)]` struct, or `serde_json::Value` through napi's serde conversion. Then make `parseTree(source)` `treeOf(engine.parse(source))`.
- [ ] **Step 4:** Regenerate and run the test. Expected: PASS.
- [ ] **Step 5:** Run the three-way verification, then commit (pathspec). Message: `perf(core): parse answers its result as an object`.

### Task 3: `engine.write`, `engine.create`, `Pending` and the file interceptor

**Files:**
- Modify: `packages/types/src/engine-api.ts` (`Pending`, new `FileWrite`, `Interceptor.file`, and `EngineIdentity` gains `rootKinds: readonly number[]` beside `trivia`)
- Create: `packages/common/src/pending.ts`
- Modify: `packages/common/src/create-engine.ts` (`write`, `create`, and the file chain beside `parseChain`/`renderChain`)
- Modify: `packages/codegen/src/emitters/engine.ts::emitApi` (emit `rootKinds` from `rootKindIds(nodeMap)`)
- Remove: `unimplementedVerb`, once Task 5 has also landed `read`. Until then it keeps its `'read'` use.
- Test: `packages/common/tests/file-verbs.test.ts`

**Interfaces:**
- Consumes: Task 1's `saverOf`. A commit is `saverOf(engine.render(root))(path, verb === 'create')`, so it writes what `render` gives, a render interceptor included.
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
- Produces: `$save(path) === engine.write(path, this)` for the engine that parsed or built the node, on the root kind only.

- [ ] **Step 1: Write the failing tests.**

```ts
it('a parsed root saves through write')   // both storages: await root.$save(p); file === root.toString()
it('a built root saves')                  // const root = engine.build...; await root.$save(p)
it('only the root kind has $save')        // child.$save === undefined
// test-d: expectTypeOf(root.$save).returns.toEqualTypeOf<Pending>(); // @ts-expect-error child.$save
```

- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3: Implement.** Emit one member line, `$save: handleSave`, from the three emitters at their root flag. `handleSave(this, path)` returns `this.$engine().write(path, this)`.
- [ ] **Step 4:** Run `pnpm run regen:all`, then the tests and `type-check:tests`. Expected: PASS.
- [ ] **Step 5:** Run the three-way verification, then commit (pathspec, generated outputs included). Message: `feat(codegen): a root saves itself through engine.write`.

### Task 5: `engine.read(path)`

**Files:**
- Modify: `napi_engine.rs` (`SittirEngine::parse_file(path) -> NativeParseResult`, and `read_source(path) -> String`)
- Modify: `engine.ts` (`NativeEngineLike.parseFile`, `readSource`, and a `parseFileTree` that is `treeOf(engine.parseFile(path))`)
- Modify: `create-engine.ts` (`read`, which removes `unimplementedVerb`)
- Test: `packages/common/tests/file-read.test.ts`

**Interfaces:**
- Consumes: `file_io::read_source` (Task 1) and `treeOf` (Task 2).
- Produces: `engine.read(path, options?) -> Promise<root>`, the same root and `$errors` as `parse` of the file's text.

- [ ] **Step 1: Write the failing tests,** in both storages:

```ts
it('reads a file to the root parse gives')        // (await engine.read(p)).toString() === engine.parse(text).toString(); $errors equal
it('rejects an unreadable path, naming it')       // rejects /missing\.rs/
it('rejects a file that is not UTF-8, naming it') // with no interceptor, and with a parse interceptor: both reject /not valid UTF-8/ and name p
it('gives a parse interceptor the source')        // intercept: [{ parse(call, next) { seen = call.source; return next(); } }]; seen === text
it("honours errors: 'throw'")                     // rejects ParseErrors for a source with errors
```

- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - With no parse interceptor, `read` calls `parseFile`, so the source stays native.
  - With one, it calls `readSource(path)` and runs `parse`'s own path with that text. Both routes validate through `read_source`, so there's one refusal.
  - The read is synchronous on the JavaScript thread. Its result comes back as a settled promise, and a refusal rejects it.
- [ ] **Step 4:** Regenerate, run the tests, and update `ADDON_FUNCTIONS` (`readSource`). Expected: PASS.
- [ ] **Step 5:** Run the three-way verification, then commit (pathspec). Message: `feat(common): read parses a file natively`.

### Task 6: Query plans by handle, and walks in numbers

**Files:**
- Modify: `napi_engine.rs` (`descendants`, `plan_holds`, a new `compile_plan`; `address_from_json` goes)
- Modify: the engine state in `rust/crates/sittir-core/src/engine.rs`, which owns the compiled plans and frees them on `dispose`
- Modify: `engine.ts` (`descendants` and `planHolds` move from `TREE_FUNCTIONS` to `ENGINE_FUNCTIONS`; one decoder for the walk's result)
- Test: Rust unit tests on the plan table; the existing query suites in `packages/common/tests`

**Interfaces:**
- Produces, in napi:
  - `compilePlan(engine, plan: object) -> number`. The plan is `query::PlanSpec` as a napi object. An equal plan returns the handle it already has.
  - `descendants(engine, from: number[], kinds, resume, limit, plan: number | null, depth) -> number[]`
  - `planHolds(engine, addresses: number[], plan: number) -> boolean[]`
  - The number encoding of an address and of a batch is left to the builder. It's written once in Rust and decoded once in TypeScript, by `decodeDescendants(words: readonly number[]): DescendantBatch`.
- Produces, in TypeScript: a per-engine `Map<string, number>` from a plan's structural key to its handle, so a plan crosses once per engine.

- [ ] **Step 1: Write the failing Rust tests.**

```rust
#[test] fn an_equal_plan_compiles_once()          // compile twice → same handle; the table holds 1 plan
#[test] fn a_plan_handle_of_another_engine_is_refused() // naming the handle
#[test] fn a_walk_round_trips_through_numbers()   // encode(batch) decodes to the same items, resume and origin
```

- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3: Implement.** Use the engine-owned plan table. `descendants` and `planHolds` take numbers. TypeScript keeps the handle map and one decoder.
- [ ] **Step 4:** Regenerate, then run the Rust tests and every query suite (`pnpm exec vitest run packages/common/tests/query`). Expected: PASS, with no query result changed.
- [ ] **Step 5:** Run the three-way verification, then commit (pathspec). Message: `perf(core): query plans compile once per engine and walks cross as numbers`.

### Task 7: The crossing guard, and the crossings left

**Files:**
- Create: `packages/codegen/src/emitters/__tests__/native-crossings.test.ts`
- Modify: `napi_engine.rs`. The six side-taking functions take the side as a number, from napi constants `TRIVIA_SIDE_LEADING`, `TRIVIA_SIDE_TRAILING` and `TRIVIA_SIDE_INNER`, which TypeScript reads from the module. Remove `SittirEngine::find_and_read`. Remove `read_many` when nothing calls it on master or on any `origin/bench/*` branch; otherwise it takes its `wire` as a number too.
- Modify: `packages/codegen/src/emitters/grammar-runtime.ts` (drop `findAndRead`), and every TypeScript caller of a side-taking function
- Regenerate: all five grammars
- Test: the guard itself

**Interfaces:**
- Produces: `CROSSINGS: Record<string, Reason>`, with `type Reason = 'requested text' | 'caller input' | 'built buffers' | 'record words' | 'error message'`. Task 8 adds `formatFiles` to it.

- [ ] **Step 1: Write the guard.**
  - Parse each grammar's `native/index.d.ts` with the `typescript` compiler API.
  - Take every exported function, and every `SittirEngine` method as `SittirEngine.<name>`, whose parameter or return type text contains `string`, `Uint8Array`, `Uint32Array`, `ArrayBuffer` or `Buffer`.
  - Object-typed parameters are out of its reach; the spec's "still crosses by design" covers them.

```ts
it.each(GRAMMARS)('%s crosses strings and buffers only where CROSSINGS says', (g) => {
	expect(crossingsOf(g)).toEqual(Object.keys(CROSSINGS).sort()); // a new crossing fails; an entry with no function fails
});
const CROSSINGS = {
	render: 'requested text', renderRecord: 'requested text', renderBuilt: 'requested text', renderBuiltLeaf: 'requested text',
	text: 'requested text', readSource: 'requested text',
	'SittirEngine.parse': 'caller input', 'SittirEngine.parseFile': 'caller input', compilePlan: 'caller input', writeText: 'caller input',
	renderToFile: 'caller input', renderRecordToFile: 'caller input', renderBuiltToFile: 'caller input', renderBuiltLeafToFile: 'caller input',
	builtWords: 'built buffers', builtBytes: 'built buffers',
	chunk: 'record words'
} as const satisfies Record<string, Reason>;
```

- [ ] **Step 2:** Run it. Expected: FAIL, listing the six side-taking functions, `findAndRead` and `readMany`.
- [ ] **Step 3: Implement** the side constants, the removals and the TypeScript callers.
- [ ] **Step 4:** Run `pnpm run regen:all`, then the guard and native-typings tests. Expected: PASS.
- [ ] **Step 5:** Run the three-way verification, then commit (pathspec). Message: `test(core): every string or buffer crossing is listed with its reason`.

### Task 8: `engine.formatFiles`

**Files:**
- Create: `rust/crates/sittir-core/src/format_batch.rs` (the schedule and the worker loop, generic over the grammar as the probe's `parse_render_batch` is)
- Modify: `napi_engine.rs` (`format_files`, an `AsyncTask`)
- Modify: `packages/types/src/engine-api.ts` (`Engine.formatFiles`, `FormatOptions`, `FormatResult`, `FormatRefusal`)
- Modify: `create-engine.ts` (refusals, the extension split, the duplicate check, and the merge back into `paths` order); `engine.ts` (`NativeLanguageEngine.formatFiles`)
- Modify: `native-crossings.test.ts` (`formatFiles: 'caller input'`)
- Test: `format_batch.rs` unit tests; `packages/common/tests/format-files.test.ts`

**Interfaces:**
- Consumes: `file_io::{read_source, write_file}` (Task 1), and the engine's render-options resolution (`render_options`).
- Produces (public):

```ts
interface FormatOptions<API extends LanguageAPI> { readonly check?: boolean; readonly threads?: number; readonly options?: API['options'] }
type FormatResult =
	| { readonly path: string; readonly changed: boolean; readonly errors: readonly ErrorRegion[] }
	| { readonly path: string; readonly refused: FormatRefusal };
interface FormatRefusal { readonly reason: 'unreadable' | 'encoding' | 'fileType' | 'unwritable'; readonly message: string }
formatFiles(paths: readonly string[], options?: FormatOptions<API>): Promise<readonly FormatResult[]>
```

- Produces (internal): `pub fn schedule(sizes: &[u64], threads: usize) -> Vec<Vec<Vec<usize>>>`, giving each thread its chunks of file indexes.

- [ ] **Step 1: Write the failing Rust schedule tests.**

```rust
#[test] fn files_go_largest_first()                 // within each thread, chunk order follows descending size
#[test] fn a_chunk_holds_at_most_8_files_or_128_kib() // except a single file over 128 KiB, which is its own chunk
#[test] fn the_split_balances_bytes()               // greedy least-loaded: max thread bytes ≤ min + largest file
#[test] fn every_file_is_scheduled_once()           // the union of all chunks is 0..n, with no repeat
```

- [ ] **Step 2: Write the failing TypeScript tests,** on an arena rust engine over a temporary corpus. The corpus is copied from the repo's rust fixtures, plus one file with parse errors, one that isn't UTF-8 and one `.txt`:

```ts
it('formats byte-identically to write, at every thread count')
	// for threads of 1, 2 and 4, each on a fresh copy: every file equals `await engine.write(p, await engine.read(p))` on its own; results deep-equal across counts
it('check reports and writes nothing')              // check: true: every file's bytes and mtime unchanged; `changed` equals the write run's
it('refuses a file and goes on')                    // a missing path → unreadable; not UTF-8 → encoding; .txt → fileType; the rest formatted
it('formats a file with parse errors')              // errors deep-equal (await engine.read(p)).$errors
it('leaves an unchanged file untouched')            // CRLF and BOM files: changed false, mtime unchanged
it('refuses object storage and interceptors by name') // object engine; intercept [{render}], [{parse}], [{file}] → each rejects naming it
it('rejects a path listed twice before any work')   // ['a.rs', './a.rs'] rejects /a\.rs/; no file's mtime moved
it('rejects a bad thread count')                    // 0, 1.5, -1 each reject naming the value
it('leaves the calling engine usable meanwhile')    // const run = engine.formatFiles(ps); engine.parse(src).toString() === src; await run
it('refuses every file of a language with no file types') // a regex engine: every result is refused with reason fileType
```

- [ ] **Step 3:** Run both test files. Expected: FAIL.
- [ ] **Step 4: Implement.**
  - **TypeScript, before native:**
    - Reject a bad `threads`.
    - Reject object storage and interceptors by name.
    - Resolve each path (`realpathSync` when it exists, else `resolve`) and reject a duplicate, naming it.
    - Refuse by `Language.fileTypes`.
  - **Native `format_files`:**
    - Capture the engine's options on the JavaScript thread. An absent `threads` is `std::thread::available_parallelism()`, and a count above the file count is cut to it.
    - In the task's `compute`, stat each file. A failed stat is refused as unreadable. Then `schedule`, and run `std::thread::scope` with one `Engine` per thread, built from the captured options.
    - Per file: read, parse (the parse frees tree-sitter's tree), render with `options` over the tree's layer over the engine's, compare, write with `Replace` unless `check`, then release the parse before the next file.
    - A worker's panic rejects the batch, naming the file. Files already written stay written, each whole.
  - **Merge:** native results come back by index, and TypeScript merges them with its own refusals in `paths` order.
- [ ] **Step 5:** Run both test files. Expected: PASS.
- [ ] **Step 6:** Run the census (`cargo test -p sittir-core --test lock_free_census`). Expected: no file's count rises.
- [ ] **Step 7:** Run the three-way verification, then commit (pathspec). Message: `feat(core): formatFiles formats a list of files on native threads`.

### Task 9: Measured beside oxfmt

**Files** (on `bench/oxc-reference`, after merging master with Task 8):
- Modify: `scripts/ci/paired-refs/reference/run.py`. Add a tool `format-batch`, at 1, 2, 4 and 8 threads, in write and check modes. Time `oxfmt --write` and `oxfmt --check` at the same thread counts, taking the flags from the probe's `scripts/ox.py`.
- Modify: `scripts/ci/paired-refs/reference/reference-worker.mjs`. Add `format-batch`, which is `engine.formatFiles(paths, { threads, check })`. Add `per-file`, today's path: `parse(readFileSync)`, `render().toString()`, `writeFileSync`, one file at a time.
- Modify: `summarize.py` (the new columns: ratio to oxfmt per CPU model, and peak RSS)

- [ ] **Step 1:** Each round copies the corpus to a fresh scratch directory before any tool writes, so every write-mode round starts from the pinned bytes. Before timing, check that the copy's tree hash equals the pin.
- [ ] **Step 2:** Run one local smoke round on matter.js at 1 thread. Expected: the batch's output tree hash equals the `per-file` tool's, and both columns print.
- [ ] **Step 3:** Commit (pathspec) and push by literal sha. Start the CI run, and give the reviewer the run id and its per-CPU table.

---

## Calls made in this plan, for the maintainer to check

1. **Order and split:** nine PRs, each from master after the one before it. Tasks 1–7 can start now. The batch waits for the arena tree drop.
2. **Two amendments to the spec**, made in the same commit as this plan:
   - The guard's reason "source the caller handed in" becomes "input the caller handed in": a source, a query's pattern or a file path. Without this, every file verb's path would fail the guard.
   - The batch gains a fourth refusal, a file it can't write (`unwritable`), so one unwritable file doesn't stop the others.
3. **The writer never creates a directory.** A missing parent is refused, naming the path.
4. **`create` refuses an existing file,** atomically, through a hard link of the scratch file.
5. **`formatFiles` rejects the whole call** when it lists one file twice, before any work.
6. **Strings with a closed set of values cross as numbers.** These are the trivia side and `readMany`'s `wire`. `findAndRead` is removed, and `readMany` too if nothing calls it.
7. **Query walks cross as numbers,** decoded once in TypeScript. An equal plan compiles once per engine.
8. **Work is split before the batch's threads start,** largest first and greedy least-loaded, so the threads share no cursor and the census doesn't rise.
9. **The root check reads a stamped `rootKinds` fact** on `EngineIdentity`, emitted from the same `rootKindIds` that stamps `kind::ROOT_KINDS`.
10. **A write under a render interceptor writes the intercepted text.** That text crosses back to native through `writeText`, since the interceptor asked for it.
11. **New public names:** `FileWrite`, `SavesFile`, `FormatOptions`, `FormatResult` and `FormatRefusal`. A refusal is `{ reason, message }`.
