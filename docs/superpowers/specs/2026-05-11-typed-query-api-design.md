# Typed Query API — Architectural Design

**Status:** Draft, 2026-05-11
**Companion to:** `docs/adr/0023-typed-query-api.md`
**Related:** ADR-0018 (de-hoisted NodeData surface — establishes cursor/value duality), ADR-0022 (construction templates — composes with this via `.$read()` → `fill()`), `docs/superpowers/specs/2026-05-10-construction-templates-design.md`

ADR-0023 captured the architectural decision: three entry points (`query()`, `wrap()`, factory output) returning typed cursors with one surface; path accumulation across napi; ast-grep as the parsed-tree backend; `find` / `filter` namespaces; composition with construction templates via `.$read()`. This design fills in what the ADR deferred — Proxy contract for both backings, path accumulator data model, typed pattern bindings, resolutions for the four open questions, the JS-side fallback story, and the parity contract that holds the two parsed-tree backends behaviorally identical.

## 1. Scope

In scope:

- Cursor as a Proxy with two backings: **parsed-tree** (ast-grep, native; `@ast-grep/wasm`, JS-side) and **in-memory** (frozen `NodeData`).
- Three entry points: `query(source, q => ...)`, `wrap(parsedNode, tree)`, factory-output cursors via `ir.<kind>.from(...)`.
- Path accumulation: JS-side `PathSegment[]` buffer collapsed into a single napi call per terminal.
- `FindNamespace` (recursive descent: `.find.kindX()`, `.find.pattern(p)`) and `FilterNamespace<T>` (immediate-children filter, type-restricted to kinds reachable from `T`).
- **Typed pattern bindings** via the same template-mode parser + slot extractor that powers construction templates (ADR-0022 design §3.3, §5).
- Composition with construction templates: `cursor.$read()` produces `NodeData` consumable by `snippets.*.fill(...)`.
- Sync-at-boundary API (terminals are sync). Native path is sync via napi. JS-side path requires `await prepareQueryBackend({ grammar })` warmup before sync use.
- Generated per-grammar `Cursor*` types, `FindNamespace`, `FilterNamespace<T>`.
- Parity test corpus for the two parsed-tree backends (native vs WASM).

Out of scope (explicit non-goals):

- Pattern *construction* (construction templates' job, ADR-0022).
- Mutation through cursors. Cursors read and navigate; mutations go through `$with` on materialized `NodeData`.
- Reactive / live-update cursors. No observable / subscription model; trees are snapshots.
- A higher-level query language (no SQL-like composition). Typed query is a typed wrapper over ast-grep's existing surface.
- Cursor memoization / identity (`cursor === cursor2` for same path). Two cursors over the same path are distinct objects; structural equality via `cursor.equals(other)` is the supported comparison.

## 2. Architecture

```
Entry points              query(src, q=>…)        wrap(parsed, tree)         ir.<kind>.from({…})
                                  │                        │                          │
                                  └──────┬─────────────────┴──────────────────────────┘
                                         ▼
                          ┌──────────────────────────────────────────┐
                          │  Cursor Proxy                             │
                          │  (apply + get traps; dispatches by       │
                          │   backing type at construction)          │
                          └──────────────────────────────────────────┘
                                         │
            ┌────────────────────────────┼────────────────────────────┐
            ▼                            ▼                            ▼
  ParsedBacking (native)        ParsedBacking (wasm)         InMemoryBacking
  ast-grep-core via napi         @ast-grep/wasm                frozen NodeData
  path → resolve_path             path → JS-side walk          direct property reads
  one napi crossing/terminal      no napi; sync in browser too no boundary
            │                            │                            │
            └────────────── parity contract enforced via ─────────────┘
                            packages/codegen/__tests__/query-parity/

                          ┌──────────────────────────────────────────┐
                          │  composition with construction templates  │
                          │  cursor.$read() → NodeData → snippets.fill │
                          └──────────────────────────────────────────┘
```

Two architectural commitments:

- **One Proxy contract, two backings.** The cursor surface (navigation, terminals, find, filter) is implemented once. The Proxy `get` trap branches on `this.backing` to dispatch into one of three backing implementations. Adding a new backing means writing one implementation, not extending the surface.
- **Path accumulation amortizes the boundary.** For parsed cursors, every property access appends a `PathSegment` to a buffer; only terminals cross napi. A 5-step navigation chain → 1 napi call, not 5.

## 3. Components

| Layer                                    | Module / file                                                | ~LoC | Owner               |
| ---------------------------------------- | ------------------------------------------------------------ | ---: | ------------------- |
| Cursor Proxy + backings dispatch         | `@sittir/core/query/cursor.ts`                               |  200 | `@sittir/core`      |
| PathSegment + path accumulator           | `@sittir/core/query/path.ts`                                 |   80 | `@sittir/core`      |
| `query()` entry point (per grammar)      | `packages/<lang>/src/query.ts` (generated)                   |   30 | per-grammar         |
| `wrap()` rename + backward-compat alias  | `packages/<lang>/src/wrap.ts` (modified)                     |   20 | per-grammar         |
| Native parsed backing                    | `@sittir/core/query/native-backing.ts`                       |   80 | `@sittir/core`      |
| WASM parsed backing                      | `@sittir/core/query/wasm-backing.ts`                         |  120 | `@sittir/core`      |
| In-memory backing                        | `@sittir/core/query/in-memory-backing.ts`                    |  140 | `@sittir/core`      |
| `prepareQueryBackend` (async warmup)     | `@sittir/core/query/prepare.ts`                              |   60 | `@sittir/core`      |
| `resolve_path` + `walk_path` (Rust)      | `rust/crates/sittir-core/src/query/walk.rs`                  |  150 | `sittir-core`       |
| `resolve_path` napi (per grammar)        | `rust/crates/sittir-<grammar>/src/query_napi.rs`             |   80 | per-grammar (Rust)  |
| Pattern slot extractor (shared w/ ADR 0022) | (reused)                                                  |    0 | (already exists)    |
| Pattern binding type emitter             | `@sittir/codegen/emitters/pattern-bindings.ts`               |   50 | `@sittir/codegen`   |
| `Cursor*` / `FindNamespace` type emitter | `@sittir/codegen/emitters/cursor-types.ts`                   |  220 | `@sittir/codegen`   |
| Parity test harness                      | `packages/codegen/__tests__/query-parity/`                   |  120 | `@sittir/codegen`   |
| `Maybe<Cursor>` typing helper            | `packages/types/src/maybe-cursor.ts` (single-line type alias) |    5 | `@sittir/types`     |

**Total:** ~1,355 lines new + reuses construction-templates' template-mode parser and slot extractor.

### 3.1 Cursor Proxy

Single Proxy class, dispatched by backing type:

```ts
// @sittir/core/query/cursor.ts
type Backing = 'parsed' | 'in-memory';

interface CursorState<B extends Backing> {
  kind: B;
  // ParsedBacking: tree handle + entry nodeId + accumulated path
  tree?: TreeHandle;
  nodeId?: number;
  path?: readonly PathSegment[];
  // InMemoryBacking: NodeData directly
  node?: AnyNodeData;
}

export function makeCursor<B extends Backing>(state: CursorState<B>): Cursor<any> {
  return new Proxy(state, {
    get(target, prop, receiver) {
      // Terminals
      if (prop === '$text')   return resolveTerminal(target, 'Text');
      if (prop === '$type')   return resolveTerminal(target, 'Type');
      if (prop === 'length')  return resolveTerminal(target, 'Length');
      if (prop === '$read')   return () => resolveTerminal(target, 'Read');
      if (prop === '$render') return () => resolveTerminal(target, 'Render');
      if (prop === 'find')    return findNamespaceFor(target);
      if (prop === 'filter')  return filterNamespaceFor(target);
      if (prop === '$children') return childrenCursorArray(target);
      if (prop === 'equals')  return (other: any) => structurallyEqual(target, other);
      if (typeof prop === 'symbol') return Reflect.get(target, prop, receiver);
      // Numeric index → array element cursor
      if (/^\d+$/.test(String(prop))) return indexCursor(target, Number(prop));
      // Named field → field cursor (or undefined for absent optional)
      return fieldCursor(target, String(prop));
    },
  }) as Cursor<any>;
}
```

The three implementations of `resolveTerminal` / `fieldCursor` / `indexCursor` / `childrenCursorArray` / `findNamespaceFor` / `filterNamespaceFor` are the three backings. Each lives in its own module (§3.4–§3.6).

### 3.2 `PathSegment`

```ts
// @sittir/core/query/path.ts
export type PathSegment =
  | { kind: 'Field'; name: string }
  | { kind: 'Index'; index: number }
  | { kind: 'Children' }
  | { kind: 'Find'; targetKind: string }
  | { kind: 'Pattern'; pattern: string }
  | { kind: 'FilterKind'; kind: string }
  ;
```

Mirrors the Rust-side `PathSegment` enum exactly. The two encodings (TS object literal, Rust enum) are serialized 1:1 across napi when the buffer is sent at a terminal call.

### 3.3 `query()` entry point (per grammar)

```ts
// packages/<lang>/src/query.ts (generated)
import { makeCursor } from '@sittir/core/query/cursor';
import { createEngine } from './engine.js';

export function query<T>(source: string, fn: (q: Cursor<RootKind>) => T): T {
  const engine = createEngine();
  const { tree, root } = engine.reader!.parseAndRead(source);
  const cursor = makeCursor({ kind: 'parsed', tree, nodeId: nodeIdOf(root), path: [] });
  return fn(cursor as Cursor<RootKind>);
}
```

`RootKind` per grammar: Rust→`SourceFile`, TypeScript→`Program`, Python→`Module`.

### 3.4 In-memory backing

Operates entirely in JS over the frozen `NodeData` from the factory. No napi, no parse tree:

```ts
// @sittir/core/query/in-memory-backing.ts
function fieldCursorInMemory(state: CursorState<'in-memory'>, fieldName: string): Cursor<any> | undefined {
  const stored = (state.node as any)[`_${fieldName}`];
  if (stored === undefined) return undefined;       // optional field absent
  if (Array.isArray(stored)) return cursorArrayInMemory(stored);
  return makeCursor({ kind: 'in-memory', node: stored });
}

function resolveTerminalInMemory(state: CursorState<'in-memory'>, terminal: TerminalKind): any {
  switch (terminal) {
    case 'Text':   return (state.node as any).$text ?? renderToString(state.node);
    case 'Type':   return KIND_NAMES[(state.node as any).$type];
    case 'Length': return ((state.node as any).$children ?? []).length;
    case 'Read':   return state.node;                  // identity — already NodeData
    case 'Render': return getActiveBackend().render(state.node).text();
  }
}
```

Zero boundary crossings. Property access on an in-memory cursor is a single JS object read.

### 3.5 Native parsed backing

`resolve_path` napi call, one crossing per terminal:

```ts
// @sittir/core/query/native-backing.ts
function fieldCursorNative(state: CursorState<'parsed'>, fieldName: string): Cursor<any> {
  return makeCursor({
    kind: 'parsed',
    tree: state.tree,
    nodeId: state.nodeId,
    path: [...state.path!, { kind: 'Field', name: fieldName }],
  });
}

function resolveTerminalNative(state: CursorState<'parsed'>, terminal: TerminalKind): any {
  const engine = state.tree!.engine as any;
  return engine.resolvePath(state.nodeId!, state.path!, terminal);
}
```

The `resolvePath` napi method:

```rust
// rust/crates/sittir-core/src/query/walk.rs
pub fn resolve_path(
    env: napi::Env,
    root: &SgNode,
    node_id: u64,
    path: &[PathSegment],
    terminal: Terminal,
) -> napi::Result<napi::JsUnknown> {
    let mut current = vec![root.node_by_id(node_id).ok_or_else(|| napi_err("no such node"))?];
    for seg in path {
        current = match seg {
            PathSegment::Field(name) => current.iter().filter_map(|n| n.field(name)).collect(),
            PathSegment::Index(i)    => current.iter().filter_map(|n| n.children().nth(*i)).collect(),
            PathSegment::Children    => current.iter().flat_map(|n| n.children()).collect(),
            PathSegment::Find(kind)  => current.iter().flat_map(|n| n.find_all(kind)).collect(),
            PathSegment::Pattern(p)  => {
                let pat = Pattern::new(p, root.lang());
                current.iter().flat_map(|n| n.find_all(&pat)).collect()
            }
            PathSegment::FilterKind(k) => current.iter().filter(|n| n.kind() == k).collect(),
        };
    }
    match terminal {
        Terminal::Text   => current[0].text().to_napi_value(env),
        Terminal::Type   => current[0].kind().to_napi_value(env),
        Terminal::Length => current[0].named_child_count().to_napi_value(env),
        Terminal::Read   => read_node(&current[0]).to_napi_object(env),   // napi-direct, no serde_json
        Terminal::Render => render_node(env, &current[0]),
    }
}
```

`Terminal::Read` returns `NodeData` via napi-direct (`to_napi_object(env)`), matching ADR-0018's invariant. No `serde_json` round-trip.

### 3.6 WASM parsed backing

Same algorithm as the native backing, but executed in JS via `@ast-grep/wasm`:

```ts
// @sittir/core/query/wasm-backing.ts
async function resolveTerminalWasm(state: CursorState<'parsed'>, terminal: TerminalKind): Promise<any> {
  // ... but we want sync at the boundary
}
```

This is the catch: `@ast-grep/wasm` is async-init. Same pattern as construction templates' TS-side fill: an explicit `await prepareQueryBackend({ grammar })` warmup loads the wasm and stashes the language handle; subsequent calls are sync.

```ts
// @sittir/core/query/prepare.ts
const wasmState = {
  initialized: false,
  promise: null as Promise<void> | null,
  languages: new Map<string, AstGrepLanguage>(),
};

export async function prepareQueryBackend(opts: { grammar: string }): Promise<void> {
  if (!wasmState.initialized) {
    wasmState.promise ??= initAstGrepWasm();
    await wasmState.promise;
    wasmState.initialized = true;
  }
  if (wasmState.languages.has(opts.grammar)) return;
  const lang = await loadLanguage(opts.grammar);
  wasmState.languages.set(opts.grammar, lang);
}

export function _getWasmLanguage(grammar: string): AstGrepLanguage | undefined {
  return wasmState.languages.get(grammar);
}
```

The WASM backing's `resolveTerminalWasm` (sync) uses `_getWasmLanguage(grammar)` and throws a clear error if warmup was skipped:

```ts
function resolveTerminalWasm(state: CursorState<'parsed'>, terminal: TerminalKind): any {
  const lang = _getWasmLanguage(state.tree!.grammar);
  if (!lang) {
    throw new Error(
      `WASM query backend not initialized for grammar '${state.tree!.grammar}'. ` +
      `Call \`await prepareQueryBackend({ grammar: '${state.tree!.grammar}' })\` once at startup.`
    );
  }
  // ... walk path using ast-grep-wasm's Node API; mirrors the Rust walk_path
}
```

## 4. Data flows

### 4.1 Parsed cursor (query / wrap)

```
1. Enter:   query(src, q => q.functionItem[0].name.$text)
                  │
2. Parse:   engine.parse(src) → TreeHandle (carries .grammar + .engine ref)
                  │
3. Cursor:  makeCursor({ kind:'parsed', tree, nodeId: root, path: [] })  → q
                  │
4. Access:  q.functionItem
              → Proxy get('functionItem')
              → fieldCursor(...) → makeCursor({ ..., path: [{Field, 'functionItem'}] })
                  │
5. Access:  result[0]
              → Proxy get('0') → indexCursor → makeCursor({ ..., path: [..., {Index, 0}] })
                  │
6. Access:  result[0].name
              → fieldCursor → makeCursor({ ..., path: [..., {Index, 0}, {Field, 'name'}] })
                  │
7. Term:    result[0].name.$text
              → resolveTerminal → engine.resolvePath(rootId, path, 'Text')
              → napi crossing (1)
              → string
```

A 5-step chain produces one napi call. The buffer (`path`) holds the entire trail.

### 4.2 In-memory cursor (factory output)

```
1. Build:   const fn = ir.functionItem.from({...}) → NodeData (frozen)
                  │
2. Cursor:  fn becomes cursor automatically; ir.<kind>.from() returns
            both the legacy frozen NodeData AND the Proxy-wrapped cursor
            on the same object identity.

            Implementation: ir.functionItem.from(...) returns a Proxy whose
            target is the NodeData. Property reads route via the Proxy's get
            trap. Non-property operations (Object.keys, JSON.stringify) still
            see only the enumerable _<field> storage (per ADR 0018).
                  │
3. Access:  fn.name        → Proxy get → fieldCursorInMemory → walk _name → makeCursor wrapping the Identifier NodeData
                  │
4. Term:    fn.name.$text  → resolveTerminalInMemory → identifierNode.$text
                  │
            No napi crossing. No async work. Pure JS reads.
```

### 4.3 Typed pattern matching

```
1. Pattern: q.find.pattern('fn $NAME() $BODY')
                  │
2. TS:      template-literal-type extraction (reused from ADR 0022's
            SlotNamesOf): 'NAME' | 'BODY'. Result type:
              CursorArray<Match<'NAME' | 'BODY', RootKind>>
                  │
3. Runtime: pattern compiled via the template-mode parser (the same one
            ADR 0022 uses for snippets). Slot extractor produces a
            SlotMap describing where each $NAME / $BODY lands; the result
            wrapper attaches them as cursor properties on each match.
                  │
4. Result:  for each match, a cursor that ALSO exposes match.NAME and
            match.BODY as sub-cursors. The base cursor surface (find,
            filter, terminals) still works.
                  │
5. Compose: snippets.x.fill({
              NAME: match.NAME.$read(),    // NodeData
              BODY: match.BODY.$read(),    // NodeData
            }).render()
```

The pattern-binding type:

```ts
// packages/types/src/pattern-bindings.ts (generated per grammar by cursor-types emitter)
type Match<Slots extends string, Self> = Cursor<Self> & {
  [K in Slots]: Cursor<Any>;   // bindings; narrower kinds emitted when extractor knows them
};
```

Slot extractor runs the pattern through the template-mode parser at codegen-time-cannot-help-here time (the pattern is a runtime string), so the binding map type defaults to `Cursor<Any>` for each slot. Callers who want narrowing pass an explicit type parameter (parallel to construction templates' opt-in tight typing):

```ts
q.find.pattern<'fn $NAME() $BODY', { NAME: Cursor<Identifier>; BODY: Cursor<Block> }>(
  'fn $NAME() $BODY'
)
```

## 5. Maybe-typed single-cursor positions

Single-cursor navigation through optional fields returns `Cursor<T> | undefined`. Required fields return `Cursor<T>`. Arrays return `CursorArray<T>`. The distinction comes from the grammar's field optionality, encoded in the existing per-kind interfaces (e.g., `FunctionItem['_return_type']: TypeAnnotation | undefined`).

The generated `Cursor*` interfaces honor this:

```ts
// Generated (excerpt)
interface CursorFunctionItem {
  readonly visibilityModifier: CursorVisibilityModifier | undefined;   // optional
  readonly name:               CursorIdentifier;                       // required
  readonly parameters:         CursorParameters;                       // required
  readonly returnType:         CursorTypeAnnotation | undefined;       // optional
  readonly body:               CursorBlock;                            // required
  readonly find:               FindNamespace;
  readonly $text:              string;
  readonly $type:              'function_item';
  $read():   FunctionItem;
  $render(): string;
}
```

Consumers chain through with optional chaining:

```ts
const retText = q.find.functionItem()[0]?.returnType?.$text;    // string | undefined
```

`find` / `filter` results stay `CursorArray<T>` because matching is inherently potentially-empty; the Maybe distinction is reserved for single-position navigation into grammar-declared optional slots.

## 6. Resolutions for ADR open questions

| ADR open question                                            | Resolution                                                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `FilterNamespace<T>` eager vs lazy                           | **Lazy via mapped type** (`{ [K in KindOf<T>]: ... }`). One declaration per kind reachable from `T`; TS instantiates at the call site. Eager would balloon type-check time on every consumer who imports a grammar package. |
| `find.pattern()` typed metavariable bindings                 | **Yes** — return `CursorArray<Match<SlotNamesOf<S>, RootKind>>`. Slot names extracted at the TS type level via the same `SlotNamesOf` from ADR 0022. Slot *kinds* default to `Cursor<Any>`; callers narrow via an explicit type parameter (`q.find.pattern<S, { NAME: Cursor<Identifier> }>(s)`). |
| Empty-walk semantics                                         | **`Cursor<T> \| undefined`** for single-cursor positions (Maybe); `CursorArray<T>` for arrays/matches. Type follows the grammar's field optionality. Consumers chain through with `?.`. |
| `$nodeHandle` lazy drill-in interaction                      | **Auto-drill on materialization terminals (`.$read()` / `.$render()`)**; intermediate navigation through a stubbed `$nodeHandle` triggers a one-shot drill-in resolve cached per cursor. Non-materialization terminals (`.$text`, `.$type`, `.length`) go through `resolve_path` per the full path — they don't materialize, so they don't drill. |

Three additional resolutions:

| New question                                                 | Resolution                                                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Sync at boundary?                                            | **Yes**, same pattern as ADR 0022's design. Cursor terminals are sync. Native path is sync (napi). WASM path requires `await prepareQueryBackend({ grammar })` once at startup; clear error if skipped. |
| JS-side query backend                                        | **`@ast-grep/wasm`** (already a `@sittir/codegen` devDependency). Same matcher as `ast-grep-core` compiled twice; parity is the contract, enforced by the test corpus (§7). |
| Cursor identity                                              | Two cursors over the same path to the same node are **distinct objects** (`===` fails). `cursor.equals(other)` provides structural equality. No memoization; if identity matters, materialize via `.$read()` and compare those. |

## 7. Parity contract

Two parsed-tree backings (native, WASM) must produce byte-equivalent results. In-memory backing is the truth for factory-output cursors and has its own correctness suite — no comparison.

### 7.1 Fixtures

`packages/codegen/__tests__/query-parity/fixtures/`:

```
fixtures/
  001-trivial-field-access/        # q.functionItem[0].name.$text
  002-recursive-find/              # q.find.identifier()
  003-pattern-untyped/             # q.find.pattern('fn $X() {}')
  004-pattern-typed-bindings/      # q.find.pattern<...>('fn $X() $Y')
  005-filter-immediate-children/   # q.statements.filter.functionItem()
  006-optional-field-undefined/    # q.find.functionItem()[0]?.returnType
  007-deep-nested-path/            # 8-segment navigation chain
  008-maybe-cursor-chain/          # optional chaining through 3+ optionals
  009-nodehandle-auto-drill/       # navigation through a stubbed $nodeHandle
  010-compose-with-snippet/        # cursor.$read() → snippets.x.fill(...)
```

Each fixture: a TS function exercising the cursor surface, returning a JSON-stringifiable value. Native and WASM runs must produce identical output.

### 7.2 Harness

```ts
// packages/codegen/__tests__/query-parity/harness.ts
import { runFixture } from './fixtures-runner.ts';

export async function runParityFixture(name: string): Promise<{
  nativeOutput: unknown;
  wasmOutput:   unknown;
}> {
  const fixture = await import(`./fixtures/${name}/run.ts`);
  const nativeOutput = await fixture.runWith({ backend: 'native' });
  const wasmOutput   = await fixture.runWith({ backend: 'wasm' });
  return { nativeOutput, wasmOutput };
}
```

The fixture is parameterized by backend. Setting `SITTIR_BACKEND=native` or `=wasm` selects which path the engine registers.

### 7.3 CI

Same path-filtered gate as construction templates (`.github/workflows/test.yml`), extended to also fire on paths matching `query/`:

```yaml
template-parity:
  if: |
    contains(toJSON(github.event.pull_request.changed_files), 'template') ||
    contains(toJSON(github.event.pull_request.changed_files), 'query')
  # ...
  steps:
    - run: pnpm run test:parity
    - run: pnpm run test:query-parity     # new
```

## 8. Testing strategy

| Test layer                          | What                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| Cursor Proxy unit tests             | One per `get`-trap dispatch case (field, index, $children, find, filter, terminal)    |
| PathSegment unit tests              | Each PathSegment kind round-trips napi correctly                                       |
| Per-backing functional tests        | Native: full surface; WASM: full surface; in-memory: full surface                     |
| Pattern slot extraction reuse       | The shared ADR 0022 slot extractor tests cover this — no new tests needed here        |
| Type-level tests                    | `SlotNamesOf<S>` produces correct binding maps; `FilterNamespace<T>` rejects out-of-union kinds; `Maybe<Cursor>` chains correctly |
| Cross-backing parity (native + WASM)| Fixture corpus (§7.1); both backends produce byte-equivalent output                   |
| End-to-end composition              | Realistic codemod: `query() → find.pattern() → fill() → render()` byte-identical      |
| `$nodeHandle` drill-in tests        | Navigate through a stub; assert one drill-in fires; subsequent navigation on same cursor does not refetch |

## 9. Phased delivery

Each phase produces verifiable behavior; bracketed days include tests.

1. **PathSegment + path accumulator + cursor Proxy skeleton.** Cursor builds correctly; path accumulates correctly; terminals route to a backing stub. [2 days]
2. **Native parsed backing + `resolve_path` napi + `walk_path` Rust.** One terminal end-to-end via napi crossing. [4 days]
3. **`query()` + `wrap()` entry points.** Realistic chain works on the Rust grammar. [1 day]
4. **`Cursor*` type emitter + `FindNamespace` + `FilterNamespace<T>`.** Generated; type-checks. [2 days]
5. **Typed pattern bindings.** Reuse ADR 0022's slot extractor; emit `Match<Slots, RootKind>` types; bind to cursor at runtime. [3 days]
6. **In-memory backing.** Factory output produces a cursor with the unified surface; in-memory tests pass. [3 days]
7. **WASM backing + `prepareQueryBackend` + parity corpus.** WASM matches native byte-for-byte across the 10-fixture corpus. [4 days]
8. **Roll out to TypeScript + Python grammars.** Per-grammar `query()` entry, generated types, fixtures. [3 days total]

Total ~22 days end-to-end. MVP at Phase 5 (parsed-only, native-only, typed bindings, no in-memory unification, no WASM): ~12 days.

## 10. Non-goals (explicit)

- Pattern *construction*. Construction templates' job per ADR-0022.
- Mutation via cursors. Cursors read and navigate; mutation goes through `$with` on materialized `NodeData`.
- Reactive cursors. Trees are snapshots; there is no subscription model.
- Whole-grammar query language. No SQL-like compositional layer; this is a typed wrapper over ast-grep's existing surface.
- Cursor identity (`===`). Distinct objects per cursor; structural equality via `cursor.equals(other)`.
- Higher-order Proxy behaviors (`Object.keys`, `JSON.stringify` enumerating the cursor surface). The cursor Proxy exposes the navigation surface via `get` only; enumeration falls through to the target (in-memory: shows enumerable `_<field>` storage; parsed: shows the cursor state, which is opaque).

## 11. Risks and mitigations

| Risk                                                                          | Mitigation                                                                                              |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Proxy overhead on every factory-output property access                        | Microbenchmark before rollout; if hot in render paths, add a per-engine `disableCursorOnFactory` opt-out (last-resort flag) |
| Native and WASM backings diverge subtly (whitespace, child ordering)          | Parity fixture corpus runs on every PR touching `query/`                                                |
| `$nodeHandle` auto-drill fires repeatedly during nested navigation            | Cache per-cursor: drill-in result memoized on the cursor's state; sibling cursors don't share cache (intentional — different paths) |
| TS template-literal-type recursion limit on long patterns                     | Same escape hatch as construction templates: explicit type parameter form bypasses inference            |
| `@ast-grep/wasm` API drift (it's a young upstream)                            | Pin version in `@sittir/core`; parity corpus catches behavioral drift                                   |
| Cursor unification leak — consumers writing `is.cursor(x)` branches           | Track via the verification signal in ADR 0023; if observed, revisit and split the surfaces explicitly   |

## 12. Open follow-ups (tracked, not blocking)

- Decide whether typed pattern bindings should infer slot *kinds* (currently `Cursor<Any>`; user narrows via type parameter). Would require runtime grammar-position analysis of the pattern; defer until usage data shows demand.
- Cursor identity: if users start writing `cursor.equals(other)` heavily, consider memoization. Currently structural-equal only.
- `find.pattern()` performance: ast-grep compiles patterns to a matcher per call. Add a `compilePattern()` helper that caches by pattern source if profiling shows pattern compilation dominates.

---

## Appendix — Public API shapes

```ts
// @sittir/core
export function makeCursor<B extends Backing>(state: CursorState<B>): Cursor<any>;
export type Cursor<T> = /* discriminated by backing; Proxy at runtime */;
export type CursorArray<T> = ArrayLike<T> & {
  readonly length: number;
  readonly find:   FindNamespace;
  readonly filter: FilterNamespace<T> & ((fn: (item: T) => boolean) => CursorArray<T>);
  [index: number]: T;
  map<U>(fn: (item: T, index: number) => U): U[];
  forEach(fn: (item: T, index: number) => void): void;
};
export function prepareQueryBackend(opts: { grammar: string }): Promise<void>;
export type PathSegment =
  | { kind: 'Field'; name: string }
  | { kind: 'Index'; index: number }
  | { kind: 'Children' }
  | { kind: 'Find'; targetKind: string }
  | { kind: 'Pattern'; pattern: string }
  | { kind: 'FilterKind'; kind: string };

// per-grammar generated
export function query<T>(source: string, fn: (q: Cursor<RootKind>) => T): T;
export function wrap<T>(parsedNode: AnyNodeData, tree: TreeHandle): Cursor<T>;

export type CursorFunctionItem = /* per ADR 0023 §generated types, with Maybe-typed optional fields */;
export type FindNamespace      = /* one method per kind in KIND_NAMES + .pattern<S>(s) */;
export type FilterNamespace<T> = { [K in KindOf<T>]: () => CursorArray<CursorFor<K>> };

export type Match<Slots extends string, Self> = Cursor<Self> & {
  readonly [K in Slots]: Cursor<Any>;
};
```
