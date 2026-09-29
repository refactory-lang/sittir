# One entry point: the language engine

**Status:** Design, approved in conversation. No plan yet.

## Problem

Each grammar package exports about fifteen things side by side: `ir`, `is`, `render`,
`toEdit`, `applyEdits`, `createEngine`, `readTreeNode`, `wrapNode`, the coercers, the
kind-id enum, the options catalog, and the types. A built node renders through a
hidden, process-wide default engine (`boundary.ts` `defaultEngine()`), so
`node.$render()` and the free `render(node)` never see an engine's options. Only an
explicit `engine.render(node, …)` does. A program cannot hold two differently
configured engines for one language and have built nodes follow either one. Reading,
transforming and writing a file is left to the caller.

## Goal

A consumer imports a light language descriptor and creates an engine from it. The
engine is the only value surface: it builds, guards, parses, reads, renders, and
creates, edits and writes files. Every node it produces is bound to it, so its
options apply everywhere. Several engines, for one language or several, coexist
with no shared state. A project groups engines over one set of files: file changes
are staged and written together, and the project is where cross-file facts such as
references will live.

```ts
import { createEngine } from '@sittir/common';
import rust, { type FunctionItem } from '@sittir/rust';
import typescript from '@sittir/typescript';

const rs = await createEngine(rust, { render: { indent: '\t' } });
const ts = await createEngine(typescript);

const fn = rs.build.functionItem({ name: 'f', body: rs.build.block([]) });
fn.$render();                                  // tab-indented: rs's options
rs.render((b) => b.useDeclaration({ argument: b.identifier('x') }));

await rs.create('src/gen.rs', (b) => b.sourceFile({ statements: [fn] }));
await rs.edit('src/lib.rs', (root) => transform(root));

type F = typeof rs.types.functionItem;         // = FunctionItem
```

## Design

### The descriptor and the implementation

- **`@sittir/<lang>`** is light. Its default export is the descriptor
  `{ name, load }`, typed `Language<API>`, where `API` is the language's full API
  type carried as a type-only brand. It also exports the static types: every node
  type and its namespace (`FunctionItem`, `FunctionItem.Config`, …) and the
  `<Lang>API` type. Importing it loads no factories, no reader and no native binding.
- **`@sittir/<lang>/api`** is the implementation: the builder table, the guards, the
  kind ids, the reader, and the native engine hooks. Only the descriptor's `load()`
  imports it (`() => import('./api.js')`); it is not a documented import.
- The package's `exports` map has `"."` and `"./api"`.

### `createEngine`

```ts
export async function createEngine<API extends LanguageAPI, const M extends ApiSurface = 'default'>(
  language: Language<API>,
  options?: EngineOptions<API, M>,
): Promise<Engine<API, M>>
```

- It lives in `@sittir/common`, which is its one public runtime entry. `Language`,
  `LanguageAPI`, `Engine` and `Types` live in `@sittir/types`.
- It is async only. `load()` runs once per descriptor and is cached, so later engines
  for the same language resolve immediately.
- **Engine options** group by concern:

  ```ts
  interface EngineOptions<API extends LanguageAPI, M extends ApiSurface = 'default'> {
    api?: M;                                     // which builder surface `build` exposes
    render?: API['options'];                     // the render options (site preferences, indent)
    format?: FormatRecord;
    intercept?: readonly Interceptor<API>[];
  }
  type ApiSurface = 'default' | 'strict' | 'portable';
  ```

- **`api` selects the builder surface** that `engine.build` exposes, and the engine's
  `build` type follows it (`Engine<API, M>`):
  - `'default'` (the default): today's builders, which coerce loose input
    (strings, plain objects, numbers), with the `.strict` flavour still reachable on
    each.
  - `'strict'`: the strict flavour directly (`build.x` is today's `ir.x.strict`). Loose
    input is a type error and throws.
  - `'portable'`: reserved for the portability surface. It is not implemented: its
    `build` type is `never`, and `createEngine` rejects with
    `api "portable" is not implemented`.
  The strict surface is derived, not generated: the `build` proxy that binds builders
  to the engine takes the `.strict` flavour of each builder it resolves, and keeps
  descending through every other property (variants such as `build.number.bigint`),
  hiding `.strict` and `.coerce` themselves. Its type is one recursive mapped type over
  the default surface:

  ```ts
  type StrictMembers<T> =
    { [K in keyof T as K extends 'strict' | 'coerce' ? never : K]: StrictSurface<T[K]> };
  type StrictSurface<T> =
    T extends { strict: infer S } ? S & StrictMembers<T>
    : T extends (...args: never) => unknown ? T
    : T extends object ? StrictMembers<T>
    : T;
  ```

  A builder becomes its strict flavour plus its mapped variants. A namespace object is
  only its mapped members; intersecting the raw object as well would put each raw
  builder's signature ahead of its strict one in overload resolution. A callable with
  no strict flavour stays whole, which keeps its generic and overloaded signatures.
  That last rule assumes no strict-less callable has members that carry `.strict`. A
  test over each grammar's `build` table pins it.

- **Interceptors** wrap the engine's operations like middleware, for logging,
  instrumentation and tooling:

  ```ts
  interface Interceptor<API extends LanguageAPI> {
    build?(call: { path: readonly string[]; args: readonly unknown[] }, next: () => API['node']): API['node'];
    render?(call: { node: API['node']; options: API['options'] }, next: () => string): string;
    parse?(call: { source: string }, next: () => API['root']): API['root'];
    file?(change: { verb: 'create' | 'edit' | 'write'; path: string; before: string | undefined; after: string },
          next: () => Promise<void>): Promise<void>;
  }
  ```

  The engine composes them once, when it is created, in array order (the first is
  outermost), and adorns its builders, `render`, `parse` and the file commit with the
  composed chain. With no interceptors nothing is wrapped. An interceptor may observe,
  time, change the result, or refuse by throwing. A `file` interceptor that doesn't call
  `next` blocks the write, which is how a dry-run tool works.
- Built-in interceptors ship beside `createEngine`: `timing()` replaces today's
  `SITTIR_METRICS` environment check and `recordFfi` path, so metrics are an explicit
  option, not an environment flag.
- `API['options']` carries the language's derived `Options`, including the indent
  unit's typing (`IndentChar`), which today threads through the per-grammar
  `createEngine<const I>`.

### The engine

```ts
interface Engine<API extends LanguageAPI, M extends ApiSurface = 'default'> {
  readonly language: API['name'];
  readonly build: M extends 'strict' ? StrictSurface<API['build']> : M extends 'portable' ? never : API['build'];
  readonly is: API['is'];
  readonly kinds: API['kinds'];
  readonly types: API['types'];

  parse(source: string, options?: ParseOptions): API['root'];
  read(path: string, options?: ParseOptions): Promise<API['root']>;
  render(
    node: API['node'] | ((build: API['build']) => API['node']),
    options?: API['options'] & { ignoreFormat?: boolean },
  ): Rendered;

  create(path: string, fn: (build: API['build']) => API['root']): Pending;
  edit(path: string, fn: (root: API['root']) => API['root']): Pending;
  write(path: string, node: API['root']): Pending;

  applyEdits(source: string, edits: readonly Edit[]): string;
  dispose(): void;
}
```

- **`build`** is the builder surface `api` selects, bound to this engine.
- **`is`** is today's guards. **`kinds`** is today's kind-id enum (`TSKindId.Comma`
  becomes `rs.kinds.Comma`).
- **`types`** is type-only: a phantom member mapping each kind to its node type, for
  generic code (`typeof rs.types.functionItem`, `Types<typeof rs>`). It is derived
  from the same kind map as the static type exports, and has no runtime value.
- **`render`** takes a node or a callback that receives `build`, plus the render options
  flat (not nested under `render:`), which override the engine's key by key;
  `ignoreFormat` is the one reserved key beside them (option keys are kind names, so it
  cannot collide). It returns a
  `Rendered` handle: today's lazy `RenderHandle` (`toString()`, `save`, `print`; the
  text is rendered on first use and cached), made `Disposable`. Disposing drops the
  cached text, and using the handle after that throws. `using out = rs.render(node)`
  releases it at scope exit; an undisposed handle is simply garbage-collected.
- **File verbs**, following the create/transform split of code-generation APIs
  (Angular schematics, ts-morph, jscodeshift):
  - `create(path, build => root)`: a new file only. It throws, naming the path, if
    the file exists.
  - `edit(path, root => root)`: an existing file only. It throws, naming the path, if
    the file is missing. The file is read and parsed, the callback transforms the
    root, and the result is rendered and written. Untouched regions re-render byte
    for byte. A callback that returns the same root writes nothing.
  - `write(path, node)`: the whole file from a finished node, creating or overwriting
    it. It does not read the file.
  - `read(path)`: parse only.
- **Pending changes.** `create`, `edit` and `write` return a `Pending`: one staged
  change to one file, with `path`, `before`, `after` and `diff()`. It is both
  thenable and `AsyncDisposable`:
  - `await rs.edit(path, f)` commits it at once.
  - `await using change = rs.create(path, g)` commits it when the scope exits.
  - A `Pending` that is neither awaited nor disposed writes nothing. Being thenable,
    it is flagged by the usual floating-promise lint.
  - The callback runs when the verb is called. If it throws, the call throws and no
    `Pending` exists, so disposal can never commit a half-built file. Across
    statements, a later throw does not undo an earlier `Pending` committed at scope
    exit; atomic multi-file work belongs in a project.
  - Committing a `Pending` re-checks its precondition against disk (see the project's
    commit) and writes through the same temporary-file-and-rename path.
- `diagnostics` stays on the engine for tools, outside the documented surface.

### Nodes are bound to their engine

- `build.*` stamps each node with its engine, in a non-enumerable symbol field. Nodes
  built implicitly inside a builder (from strings, plain objects or numbers) get the
  same engine.
- Parsed nodes carry the engine that read them, in the same field; their
  coordinates already name that engine's tree.
- A node's methods read the field: `$render()` is `engine.render(node)`, `$with.*`
  rebuilds through the same engine, and `$trivia` works as today.
- The engine is found through scope, not through the parent: a child is built before
  its parent exists. `build.*` calls run inside the engine's scope (a module-level
  current engine, set for the synchronous call and restored in `finally`), and the
  generated `build*` functions, which all go through `withMethods`, stamp whatever
  engine is current. Coerced children therefore get the calling engine with no change to
  the generated builders. A node built by one engine and passed into another's call
  keeps its own stamp.
- The stamp is a strong reference. A `WeakRef` would make `$render` fail whenever the
  collector happened to reclaim the engine; an engine's lifetime is explicit instead.
  After `engine.dispose()`, a stamped node's `$render()` and `$toEdit()` throw
  "engine disposed".
- The process-wide default engine is retired, along with the free `render`, `toEdit`
  and `applyEdits` exports and every path that renders without an engine. Through the
  public surface every node has an engine. A node built by calling internal builders
  outside any engine has no stamp; its `$render()` throws and names `engine.render(node)`.

### Projects: many engines, one staged file set

```ts
export async function createProject(directory: string | null): Promise<Project>

interface Project {
  readonly directory: string | null;
  engine<API extends LanguageAPI>(
    language: Language<API>,
    options?: EngineOptions<API>,
  ): Promise<Engine<API>>;
  staged(): readonly string[];
  diff(): readonly { path: string; before: string | undefined; after: string }[];
  files(): ReadonlyMap<string, string>;
  commit(): Promise<void>;
  discard(): void;
  [Symbol.asyncDispose](): Promise<void>;   // discards uncommitted changes, disposes engines
}
```

- `createProject` lives in `@sittir/common` beside `createEngine`.
- `project.engine(language, options)` creates an engine with the full engine surface.
  A project holds engines for any number of languages, and several engines for one
  language.
- **Staging.** Inside a project, `create`, `edit` and `write` change only the
  project's staged file set. `read` and `edit` see the staged state, so an `edit`
  after a `create` in the same project sees the created file. The preconditions
  (`create`: the file does not exist; `edit`: it does) are checked against the staged
  state over the directory.
- **Inspection.** `staged()` lists the paths with pending changes. `diff()` gives each
  one's text before and after (`before` is undefined for a created file). `files()`
  returns the staged texts by path.
- **`commit()`** writes every staged file, or none.
  - First it re-checks each precondition against disk. An `edit` also fails if the
    file changed on disk after the project read it, compared by content hash. Any
    failure aborts the commit before anything is written.
  - Each file is written to a temporary sibling and then renamed into place. If a
    rename fails, the files already replaced are restored from the texts the project
    read, and the commit rejects with the cause.
  - After a successful commit the staged set is empty.
- `discard()` drops the staged set.
- **Paths** are relative to the directory. A path that resolves outside it is
  rejected.
- **A null directory** is an in-memory project: files exist only in the staged set,
  `read` and `edit` see only what the project created, `files()` returns everything,
  and `commit()` is unavailable (it throws). It serves tests, browsers and tools that
  hand the texts elsewhere.
- **Pending changes in a project** join the project's staged set. Awaiting or
  disposing them does not write; `project.commit()` writes them all.
- **The project is `AsyncDisposable`, and disposal discards.** `await using p =
  await createProject(dir)` disposes the engines and drops anything not committed, as
  a database transaction rolls back on dispose. Writing always needs an explicit
  `await p.commit()`, so a block that throws partway never writes half a batch.
- **A standalone engine** (`createEngine`) commits each `Pending` on its own, through
  the same code path as a project's commit.
- **Cross-file facts.** The project owns the file set and its engines, so later
  cross-file work (reference tracking, renames across files, import graphs) attaches
  to it. None of that is in this spec.

### Rendering a node through another engine

`engineA.render(node)` where `node` belongs to engine B:

- **Same language:** allowed. Options come from the calling engine A (A's engine
  options, then the call's). Coordinates are resolved by the engine holding the tree:
  a parsed node's tree handle names B, so A hands the render to B with A's options. A
  built node has no tree, and A renders it directly. The node's tree handle is the
  one fact that decides which engine holds its source; trees never move between
  engines.
- **Another language:** a type error. At run time it throws, naming both languages;
  the language is checked from the node's stamp.

### Generated code

- Each grammar package's `index.ts` exports the descriptor and the types only.
- `api.ts` exports the builder table, `is`, `kinds`, the reader, the native hooks, and
  the `<Lang>API` type. The builders take an engine context. `createEngine` binds the
  table once per engine, through a lazily built `build` object, so creating an engine
  does not allocate a closure per builder.
- The per-grammar `createEngine`, `engine.ts`, `render-engine.ts` and `boundary.ts`
  are replaced by the shared `createEngine` and the `api` hooks.

### Migration

A clean break, in one change. Nothing is published, so there are no external
consumers to carry. Examples (including the generated dogfood rebuilds, whose emitter
prints `rs.build.*`), package tests, tools, validators and the CLI all move to the
engine surface.

## Errors

- `create` on an existing path, and `edit` on a missing one, throw with the path.
- A node from another language throws, naming both languages.
- A `load()` failure (for example, a missing native binding) rejects `createEngine`
  and `project.engine` with the underlying error as its cause.
- `commit()` rejects, naming every path whose precondition or on-disk hash fails,
  before writing anything. On a null-directory project it throws.
- A path outside the project directory throws, naming the path.

## Testing

- Importing `@sittir/rust` loads no factories and no native binding.
- Two engines of one language with different indent options render the same built
  shape differently through `$render()`.
- Cross-engine rendering: a parsed node from B rendered by A uses A's options and
  B's tree; a built node from B renders directly through A.
- `edit`: an unchanged root leaves the file untouched (modification time unchanged),
  and untouched regions re-render byte for byte.
- `create` and `edit` precondition errors.
- Disposal:
  - an awaited `Pending` commits at once;
  - an `await using` `Pending` commits at scope exit, and one neither awaited nor
    disposed writes nothing;
  - a callback that throws leaves no `Pending` and writes nothing;
  - a project disposed without `commit()` writes nothing, including when its block
    throws;
  - `toString()` on a disposed `Rendered` throws.
- Type level: `typeof rs.types.functionItem` equals `FunctionItem`; a node from
  another language is rejected by `render`; the options (including the indent unit)
  are typed from the descriptor.
- Two languages in one program share no state.
- `api`: `'strict'` exposes the strict flavour as `build.x` and rejects loose input
  (type and runtime); `'portable'` rejects at creation.
- Interceptors: the order is first-outermost; a `build` interceptor sees nested variant
  builders; a `file` interceptor that skips `next` blocks the write; with none, no
  function is wrapped; `timing()` records what `SITTIR_METRICS` recorded.
- Projects:
  - staged verbs touch no file until `commit()`;
  - an `edit` after a `create` in the same project sees the created file;
  - `diff()` and `files()` report the staged texts;
  - a commit whose precondition fails on one file writes none of them;
  - a file changed on disk after the project read it fails the commit;
  - a rename failure mid-commit restores the files already replaced;
  - a null-directory project works end to end in memory, and `commit()` throws;
  - a Rust and a TypeScript engine in one project commit together.
- Gates: validation rows identical; render fixtures and dogfood rendered fixtures
  byte-identical (only the source text of example files changes); the full suite;
  type-check, with `tsc` cost measured before and after.

## Out of scope

- Cross-file facts on the project: reference tracking, renames across files, import
  graphs.
- Watching the directory for outside changes while a project is open (a commit
  detects them by hash).
- Publishing packages.
- Emitters built on typed trees (the bootstrap spec's later users).
