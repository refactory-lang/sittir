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
with no shared state.

```ts
import { createEngine } from '@sittir/common';
import rust, { type FunctionItem } from '@sittir/rust';
import typescript from '@sittir/typescript';

const rs = await createEngine(rust, { options: { indent: '\t' } });
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
export async function createEngine<API extends LanguageAPI>(
  language: Language<API>,
  options?: EngineOptions<API['options']>,
): Promise<Engine<API>>
```

- It lives in `@sittir/common`, which is its one public runtime entry. `Language`,
  `LanguageAPI`, `Engine` and `Types` live in `@sittir/types`.
- It is async only. `load()` runs once per descriptor and is cached, so later engines
  for the same language resolve immediately.
- `API['options']` carries the language's derived `Options`, including the indent
  unit's typing (`IndentChar`), which today threads through the per-grammar
  `createEngine<const I>`.

### The engine

```ts
interface Engine<API extends LanguageAPI> {
  readonly language: API['name'];
  readonly build: API['build'];
  readonly is: API['is'];
  readonly kinds: API['kinds'];
  readonly types: API['types'];

  parse(source: string, options?: ParseOptions): API['root'];
  read(path: string, options?: ParseOptions): Promise<API['root']>;
  render(
    node: API['node'] | ((build: API['build']) => API['node']),
    options?: RenderOptions<API['options']>,
  ): string;

  create(path: string, fn: (build: API['build']) => API['root']): Promise<void>;
  edit(path: string, fn: (root: API['root']) => API['root']): Promise<void>;
  write(path: string, node: API['root']): Promise<void>;

  applyEdits(source: string, edits: readonly Edit[]): string;
  dispose(): void;
}
```

- **`build`** is today's `ir` namespace, bound to this engine.
- **`is`** is today's guards. **`kinds`** is today's kind-id enum (`TSKindId.Comma`
  becomes `rs.kinds.Comma`).
- **`types`** is type-only: a phantom member mapping each kind to its node type, for
  generic code (`typeof rs.types.functionItem`, `Types<typeof rs>`). It is derived
  from the same kind map as the static type exports, and has no runtime value.
- **`render`** takes a node or a callback that receives `build`, and returns the text.
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
- `diagnostics` stays on the engine for tools, outside the documented surface.

### Nodes are bound to their engine

- `build.*` stamps each node with its engine, in a non-enumerable symbol field. Nodes
  built implicitly inside a builder (from strings, plain objects or numbers) get the
  same engine.
- Parsed nodes carry the engine that read them, in the same field; their
  coordinates already name that engine's tree.
- A node's methods read the field: `$render()` is `engine.render(node)`, `$with.*`
  rebuilds through the same engine, and `$trivia` works as today.
- The process-wide default engine is retired, along with the free `render`, `toEdit`
  and `applyEdits` exports and every path that renders without an engine. A node with
  no engine cannot exist.

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
  with the underlying error as its cause.

## Testing

- Importing `@sittir/rust` loads no factories and no native binding.
- Two engines of one language with different indent options render the same built
  shape differently through `$render()`.
- Cross-engine rendering: a parsed node from B rendered by A uses A's options and
  B's tree; a built node from B renders directly through A.
- `edit`: an unchanged root leaves the file untouched (modification time unchanged),
  and untouched regions re-render byte for byte.
- `create` and `edit` precondition errors.
- Type level: `typeof rs.types.functionItem` equals `FunctionItem`; a node from
  another language is rejected by `render`; the options (including the indent unit)
  are typed from the descriptor.
- Two languages in one program share no state.
- Gates: validation rows identical; render fixtures and dogfood rendered fixtures
  byte-identical (only the source text of example files changes); the full suite;
  type-check, with `tsc` cost measured before and after.

## Out of scope

- A staging tree that collects file changes and commits them all at once, with a dry
  run (Nx devkit or Angular schematics style). Each file verb can already be tried by
  calling `render` instead.
- Publishing packages.
- Emitters built on typed trees (the bootstrap spec's later users).
