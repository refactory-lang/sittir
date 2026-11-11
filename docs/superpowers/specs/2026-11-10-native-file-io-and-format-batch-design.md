# Native file input and output, and a threaded format batch

Status: approved by the maintainer (2026-11-10). Plan: `docs/superpowers/plans/2026-11-10-native-file-io-and-format-batch.md`.

## Why

- **Text crosses the JavaScript–native boundary where no caller asked for it.**
  - In arena storage, the default, `render(node).save(path)` renders into JavaScript and writes with `writeFileSync`. Only object storage writes natively (`renderToFile`).
  - `parse` returns its result as a JSON string, which JavaScript then parses.
  - `$query()` sends its plan and its addresses to native as JSON strings on every batch (`descendants`, `planHolds`).
- **The file verbs are declared but not built.** `engine.read(path)`, `engine.write(path, root)` and `engine.create(path, fn)` throw "file verb … is not implemented".
- **sittir has no whole-repository path, so it can't be compared with a formatter on a formatter's job.** A threading probe on matter.js (2,410 files, 17.6 MB, arena storage) measured two shapes, both byte-identical to one thread:
  - a native batch on a Rust thread pool: 1.74 s → 0.33 s at 8 threads;
  - `worker_threads`, each running the serial pipeline: 2.58 s → 0.44 s.
  Nothing shipped.

## Decided by the maintainer

- **Spec the threading now. Build it after an arena parse keeps no tree-sitter tree** (the tree drop of the arena trees-from-records work).
- **The workload is formatting a repository,** so it compares apples to apples with oxfmt. It is not a codemod: no author code runs per file.
- **Threading goes ahead on today's render.** It switches to the per-call `reformat` render when that lands, without waiting for it.
- **A thorough cleanup,** so that nothing crosses the native boundary where it doesn't have to.
- **`root.$save(path)` is a wrapper over `engine.write`.**
- **`Pending` carries the path only, and `diff()` is the one way to the text.**
- **The batch mirrors the format inference, `engine.styleFrom(...sources)`:**
  - `engine.applyStyle(...paths)` formats files in place, and `engine.checkStyle(...paths)` reports which would change.
  - Format options are just the render options, so the batch renders with the engine's own and takes no options of its own.
  - The thread count is a `createEngine` option, `threads`.

Earlier rulings this design keeps:
- optimizations may be arena-only;
- a parsed tree's source bytes and strings never cross to JavaScript in bulk;
- no getters, setters or `defineProperty`;
- explicit release is the contract;
- tree-sitter's parser and tree never outlive the `parse` call in arena storage.

## Goals

- A file goes in as a path and comes out as a file, with no source or rendered text in JavaScript on the way.
- One native writer for every way of writing a file.
- A threaded batch that formats a list of files, measured beside oxfmt at the same thread counts.
- A guard that keeps unrequested crossings from coming back.

## Non-goals

- Running author code (a codemod's transform) on the batch's threads.
- `worker_threads` as a shipped feature. Callers who want throughput from JavaScript can run their own workers, which the probe showed works.
- Splitting one file's render across threads. The probe measured about a 5% gain and set it aside.
- The `Project` surface (staged multi-file changes). It is unbuilt and gets its own design.
- Object storage. The batch refuses it.

## Anti-goals

- A second writer: any write path that doesn't go through the one native writer.
- A batch whose output differs from writing each file one at a time with `engine.write`, or from a one-thread run.
- Shared mutable state between the batch's threads, or a new lock on a read or render path.
- Text filled into a result "in case" a caller reads it.
- A file left truncated or half-written by a process crash or an error.

## The end state

### File verbs

- **`engine.read(path)`** reads and parses the file natively, so the source never enters JavaScript. It returns the root, as `parse` does.
  - A file that can't be read or isn't valid UTF-8 rejects, naming the path and the cause.
  - When a `parse` interceptor is registered, the interceptor's `call.source` needs the text. In that case only, `read` loads the source into JavaScript for it.
- **`engine.write(path, root)`** returns a `Pending`.
  - Committing renders the root natively and writes it through the one native writer.
  - Commit semantics are unchanged: awaiting it commits once, `await using` commits at the end of the scope, and one that is neither awaited nor disposed writes nothing.
- **`engine.create(path, fn)`** builds with the engine's builders, then writes through the same path as `write`.
- **`root.$save(path)`** is `engine.write(path, root)`, on a node of the grammar's root kind, parsed or built.
- **`render(node).save(path)`** stays as the lower-level route, and writes through the same native writer in every storage: object nodes, arena record views and built nodes alike. The `writeFileSync` fallback in the render handle goes.

### `Pending` and the file interceptor

- **`Pending`** is `{ path }`, plus `PromiseLike<void>`, `AsyncDisposable` and `diff(): FileChange`.
  - `diff()` renders natively and reads the file's current text. Only then does text cross.
  - `FileChange` keeps `path`, `before` and `after`, as the value `diff()` returns.
- **`Interceptor.file`** receives `{ path, verb, diff() }` in place of a `FileChange`. A file interceptor that never calls `diff()` costs no crossing.

### The native writer

- One writer serves `write`, `create`, `$save`, `Rendered.save` and the batch.
- It writes atomically: it writes to a scratch file beside the target and renames it over the target, as codegen's `writeFileAtomic` does for its outputs.
- It doesn't sync to disk. The rename already means a process crash or an error never leaves a truncated file, and surviving power loss isn't a formatter's job.
- A file whose rendered bytes equal its current bytes isn't rewritten.

### Crossings removed

| Today | End state |
|---|---|
| `parse` returns a JSON string, which JavaScript parses | `parse` returns a plain object: the tree id, the tree's options layer, and the error regions |
| `descendants` takes its start and its plan as JSON strings on every batch | a plan is compiled once natively per engine and named by a handle; the start is numbers |
| `planHolds` takes its addresses and its plan as JSON strings | addresses as a typed array, and the plan by handle |
| arena `save` brings the text into JavaScript | the native writer |
| `read`, `write` and `create` are unbuilt | native, as above |

### A guard against new crossings

A test lists every napi function that takes or returns a string, a JSON string, or a bulk buffer, each with its reason. A reason is one of:
- text the caller asked for (`render`, `text(span)`);
- input the caller handed in: a source (`parse(source)`), a query's patterns, a file path, or text a render interceptor produced;
- a built node's buffers, which JavaScript owns by design;
- a parsed tree's record words lent to JavaScript (`chunk`), which are records, not source bytes;
- an error message.

A string crossing with no listed reason fails. A listed one that no longer exists fails too, asking for its entry to be removed. The list only shrinks.

### What still crosses, by design

- `toString()`, `$render()` and `print()`, which exist to return text.
- `$text()`, one leaf's text from a native `text(span)` call.
- `$snapshot()`, which returns plain data. It is refused in arena storage until the snapshot rule is unified.
- Trivia sides read and written through `$trivia`.
- The source handed to `parse(source)`.
- Whatever an interceptor asks for.

### The format batch

`engine.applyStyle(...paths)` formats each file in place. `engine.checkStyle(...paths)` reports which files would change and writes nothing, as `oxfmt --write` and `--check` do. Both return `Promise<readonly StyleResult[]>`, in argument order.

They mirror `engine.styleFrom(...sources)`:
- **Paths are typed `SourcePath<G>`,** which is `` `${string}.${FileType}` `` over the language's file types, and `never` for a language with none. The type is the whole gate: there's no run-time extension check. `engine.isSourcePath(p)` narrows a string.
- **Format options are just the render options.** The batch renders with the engine's own render options, and an engine created with other options formats with those. Line endings come from those options too: under the default `'\n'`, a CRLF file is rewritten with LF and reported changed.

For each file, all natively:
1. read it;
2. parse it, with tree-sitter's tree freed inside the parse;
3. render with the engine's render options, over the tree's own layer as any render of it does;
4. compare with the source;
5. in `applyStyle`, write it through the native writer when it changed;
6. release the parse.

What it guarantees:
- **Results.** A `StyleResult` is either `{ path, changed, errors }`, where `errors` is the file's error regions, or `{ path, refused }`. A refusal names its reason: the file can't be read, isn't valid UTF-8, or (in `applyStyle`) can't be written. One file's refusal never stops the others.
- **Parse errors.** A file with parse errors still renders, as `render` does for any parsed root.
- **Threads.** `createEngine`'s `threads` option sets the count, and the machine's available parallelism is the default. Each thread builds its own engine from the caller's engine options. Threads share only the process's read-only tables.
- **Scheduling.** Files are handed out largest first, in chunks of at most 8 files or 128 KiB. That removed the probe's stall on matter.js's four largest files, which hold 35% of its bytes.
- **Off the JavaScript thread.** The batch runs as an asynchronous native task, so the JavaScript thread stays free while it runs. The batch never touches the calling engine's state, since its threads use engines of their own, so the caller can keep using that engine meanwhile.
- **Memory.** At most one parse is live per thread at any moment.
- **Refusals by name:** in object storage, and when the engine has a `render`, `parse` or `file` interceptor. Native threads can't call JavaScript. `createEngine` refuses a `threads` option on an object-storage engine.
- **Byte identity.** The output equals a one-thread run, and equals `engine.write` of each file on its own.

### Measured

- The oxc speed reference gains `applyStyle` and `checkStyle` at 1, 2, 4 and 8 threads, against `oxfmt --write` and `oxfmt --check` at the same thread counts on the same files, with both sides set to the same line ending.
- It also gains the batch at one thread against today's per-file path, which is the crossing cleanup's own gain.
- As now, results are compared by the ratio to oxfmt on the same CPU model, with peak memory for each.

## Constraints

- Arena storage only, for the batch.
- The batch builds after an arena parse keeps no tree-sitter tree.
- The lock-free census doesn't rise: per-thread engines, no new lock or atomic.
- Every crossing that remains is listed in the guard with its reason.
- Output is byte-identical across thread counts, and with the single-file path.

## Left to the builder

- The asynchronous napi mechanism and the thread pool's implementation.
- Tuning the chunk sizes, within the probe's finding.
- The plan handle's shape, and its lifetime: it lives as long as its engine.
- The typed array used for addresses.
- The wording of refusals, as long as each names its cause.

## Calls I made, for the maintainer to check

1. Writes are atomic (scratch file, then rename), with no sync to disk, and an unchanged file isn't rewritten.
2. The batch refuses object storage and engines with interceptors.
3. A refused file is a result, not a failure of the whole batch.
4. `Interceptor.file` receives `{ path, verb, diff() }`.
5. `read(path)` loads the source into JavaScript only when a `parse` interceptor is registered.
6. `$save` exists only on nodes of the grammar's root kind.
7. `parse` returns an object, query plans go by handle, and a guard lists every remaining crossing.
8. `Project` is out of scope.
9. `SourcePath<G>` and `isSourcePath` are built here, with the batch, as the `styleFrom` design has them. `styleFrom` itself stays parked.
