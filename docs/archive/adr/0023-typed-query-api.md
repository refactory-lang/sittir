# ADR 0023 — Typed Query API

**Status**: Proposed
**Date**: 2026-05-10
**Related**: ADR-0018 (de-hoisted NodeData surface — establishes cursor/value duality), ADR-0022 (construction templates — composes with this via `.$read()`)

## Context

Today's find/extract surface spans three shapes that don't compose into a
single chain:

- **`engine.reader.parseAndRead(source)`** returns a fully materialized
  `NodeData` tree. Walking it is plain JS property/array traversal, but
  every access on a parsed node has already paid the read cost.
- **`engine.findAndRead(source, pattern)`** returns ast-grep matches as
  raw `NodeData` arrays. Pattern matching works, but the result has no
  typed accessor — consumers re-narrow with `is.functionItem` and call
  `wrapNode` to recover field types.
- **`wrapNode(node, tree)`** gives typed accessors for one known node,
  but doesn't expose recursive `find`, doesn't accept a pattern, and
  doesn't compose with itself (you can `wrapNode` a child but you have
  to navigate to the child first by hand).

A consumer who wants "the names of every `pub fn` in this Rust source"
writes ~five steps across three APIs and re-traverses on every
property access. ast-grep already provides recursive node search, field
navigation, and pattern matching in Rust, and `sittir-core` can take
`ast-grep-core` as a dependency. The missing piece is a JS-side typed
Proxy that delegates each step to ast-grep and **accumulates the
navigation path** so we cross napi once per terminal access, not once
per step.

ADR-0018 already promised this evolution: "the cursor can grow methods
(parent, next, children, kind) in future specs." This ADR is that
future spec. The cursor-as-function-reference becomes a Proxy with both
`apply` (call → resolve to value) and `get` (navigate → another cursor)
traps, unified across parsed-tree access (ast-grep backing) and
in-memory `NodeData` access (direct backing).

## Forcing Constraint

_TBD_

## Decision

### Three entry points, one cursor surface

```ts
import { query, wrap, ir } from '@sittir/rust';

// Parse and query — cursor at the root of the parsed tree.
query(source, q => q.find.functionItem().map(fn => fn.name.$text));

// Typed cursor at an existing parsed node (rename of wrapNode).
wrap(parsedNode, tree).name.$text;

// Factory output — same cursor surface, in-memory backing.
const fn = ir.functionItem.from({ name: 'main' });
fn.name.$text;
```

`query`, `wrap`, and factory output all return cursors with the same
type-side navigation surface. The cursor's *implementation* differs by
backing (Proxy → `resolve_path` for parsed; Proxy → in-memory
`NodeData` for factory), but the *surface* is identical — consumers
don't branch on origin.

`wrap()` is the new public name; `wrapNode()` stays as a deprecated
alias for one minor.

### Navigation surface

Property access on a cursor returns another cursor. **No napi crossing**
until a terminal:

| Operation       | Returns           | Backend (parsed)             | Backend (factory / in-memory) |
| --------------- | ----------------- | ---------------------------- | ----------------------------- |
| `.fieldName`    | `Cursor<Field>`   | path += `Field("fieldName")` | reads `_<fieldName>` storage  |
| `.$children`    | `CursorArray<T>`  | path += `Children`           | reads `$children` array       |
| `[index]`       | `Cursor<Element>` | path += `Index(i)`           | indexes the array             |
| `.find.kindXxx()` | `CursorArray<X>`  | path += `Find(kind)`         | recursive walk over NodeData  |
| `.find.pattern(p)` | `CursorArray<Any>` | path += `Pattern(p)`        | not supported (parsed only)   |
| `.filter.kindXxx()` | `CursorArray<X>` | path += `FilterKind(kind)`  | filters the array             |
| `.filter(fn)`   | `CursorArray<T>`  | resolves first, then filters | `Array.prototype.filter`      |

**Terminals** cross the boundary exactly once:

| Terminal     | Returns    | Backend (parsed)                                    | Backend (factory)        |
| ------------ | ---------- | --------------------------------------------------- | ------------------------ |
| `.$text`     | `string`   | `resolve_path(path, Terminal::Text)` → napi-direct  | direct `$text` / `_<f>`  |
| `.$type`     | `string`   | `resolve_path(path, Terminal::Type)`                | `KIND_NAMES[$type]`      |
| `.length`    | `number`   | `resolve_path(path, Terminal::Length)`              | `array.length`           |
| `.$read()`   | `NodeData` | `resolve_path(path, Terminal::Read)` → napi-direct  | identity                 |
| `.$render()` | `string`   | `resolve_path(path, Terminal::Render)`              | `node.$render()`         |

`Terminal::Read` returns `NodeData` via napi-direct (`to_napi_object(env)`),
matching the contract established in ADR-0018. **No `serde_json` round-trip
on either side**, in either direction.

### Recursive descent: `.find`

Available on every cursor; searches the entire subtree.

```ts
query(source, q => q.find.functionItem())
// → CursorArray<Cursor<FunctionItem>>

query(source, q => q.find.pattern('fn $NAME() -> Result<$T, $E>'))
// → CursorArray<Cursor<Any>>

query(source, q => q.statements[0].body.find.identifier())
// → CursorArray<Cursor<Identifier>> — only inside the first statement's body
```

`FindNamespace` is generated per grammar with one method per kind plus
`pattern(p)`. Backend: `node.find_all(kind)` /
`node.find_all(Pattern::new(p))`.

### Immediate-children filter: `.filter`

Available on `CursorArray`. Type-restricted to kinds reachable from the
array's element union:

```ts
q.statements.filter.functionItem()  // OK — FunctionItem ⊂ Statement
q.statements.filter.identifier()    // type error — Identifier ⊄ Statement
```

`FilterNamespace<T>` is a mapped type over `KindOf<T>`. The `filter`
property is also callable — `q.statements.filter(s => ...)` works as
`Array.prototype.filter` does — via the `FilterNamespace<T> & ((fn) =>
...)` intersection type.

### Path accumulation across napi

Each Proxy property access appends a `PathSegment` to a JS-side buffer.
Only terminals call into Rust:

```rust
#[napi]
impl SittirEngine {
    pub fn resolve_path(
        &self,
        env: napi::Env,
        node_id: u64,
        path: Vec<PathSegment>,
        terminal: Terminal,
    ) -> napi::Result<napi::JsUnknown> {
        let nodes = self.walk_path(node_id, &path)?;
        match terminal {
            Terminal::Text   => nodes[0].text().to_napi_value(env),
            Terminal::Type   => nodes[0].kind().to_napi_value(env),
            Terminal::Length => nodes[0].named_child_count().to_napi_value(env),
            Terminal::Read   => read_node(nodes[0]).to_napi_object(env),
            Terminal::Render => self.render_node(nodes[0]).to_napi_value(env),
        }
    }

    fn walk_path(&self, node_id: u64, path: &[PathSegment]) -> napi::Result<Vec<SgNode>> {
        let mut current = vec![self.root.node_by_id(node_id)];
        for segment in path {
            current = match segment {
                PathSegment::Field(name)      => current.iter().filter_map(|n| n.field(name)).collect(),
                PathSegment::Index(i)         => current.iter().filter_map(|n| n.children().nth(*i)).collect(),
                PathSegment::Children         => current.iter().flat_map(|n| n.children()).collect(),
                PathSegment::Find(kind)       => current.iter().flat_map(|n| n.find_all(kind)).collect(),
                PathSegment::Pattern(pat)     => {
                    let pattern = Pattern::new(pat, &self.language);
                    current.iter().flat_map(|n| n.find_all(&pattern)).collect()
                }
                PathSegment::FilterKind(kind) => current.iter().filter(|n| n.kind() == kind).collect(),
            };
        }
        Ok(current)
    }
}
```

### Composition with construction templates

`.$read()` returns `NodeData`, valid as a slot for ADR-0022's `fill()`:

```ts
const newSource = query(source, q => {
    const fn = q.find.functionItem()[0];
    return snippets.asyncWrapper.fill({
        NAME: fn.name.$read(),
        BODY: fn.body.$read(),
    }).$render();
});
```

Query and construction-template outputs share one runtime model
(`NodeData`); the typed query is the read-side counterpart of the
typed construction-template fill.

### `findAndRead` becomes sugar

```ts
engine.findAndRead(source, pattern)
// equivalent to:
query(source, q => q.find.pattern(pattern).map(m => m.$read()))
```

`findAndRead` stays as a back-compat helper that internally redirects
to the query API.

### Generated types per grammar

```ts
// Root cursor type per grammar
// Rust: Cursor<SourceFile>    TypeScript: Cursor<Program>    Python: Cursor<Module>

interface CursorFunctionItem {
    readonly visibilityModifier: CursorVisibilityModifier | undefined;
    readonly name: CursorIdentifier;
    readonly parameters: CursorParameters;
    readonly returnType: CursorTypeAnnotation | undefined;
    readonly body: CursorBlock;
    readonly find: FindNamespace;
    readonly $text: string;
    readonly $type: 'function_item';
    $read(): FunctionItem;
    $render(): string;
}

interface CursorArray<T> {
    readonly length: number;
    readonly find: FindNamespace;
    readonly filter: FilterNamespace<T> & ((fn: (item: T) => boolean) => CursorArray<T>);
    [index: number]: T;
    map<U>(fn: (item: T, index: number) => U): U[];
    forEach(fn: (item: T, index: number) => void): void;
}

interface FindNamespace {
    functionItem(): CursorArray<CursorFunctionItem>;
    structItem(): CursorArray<CursorStructItem>;
    identifier(): CursorArray<CursorIdentifier>;
    // ... one per kind in KIND_NAMES
    pattern(pat: string): CursorArray<CursorAny>;
}

type FilterNamespace<T> = {
    [K in KindOf<T>]: () => CursorArray<CursorFor<K>>;
};
```

(The original spec used `Wrap*` for these types; the ADR aligns on
`Cursor*` to match ADR-0018's terminology and to make the cursor
unification explicit. `Wrap*` aliases stay for one minor.)

## Alternatives Considered

- **Per-step napi crossing.** Keep ast-grep calls 1:1 with JS property
  access; no path buffering. *Rejected:* every `fn.name.$text` requires
  N napi calls for an N-segment path. Defeats the whole reason to
  prefer ast-grep over walking pre-read NodeData.
- **JS-side parse-tree mirror.** Eagerly materialize the whole tree
  on parse; navigate via plain JS objects. *Rejected:* equivalent to
  always calling `parseAndRead`, which we already have. Loses the lazy
  read that motivates `wrap` / `findAndRead` today; large files
  materialize on every parse.
- **Static getter generation per kind.** Generate per-kind classes with
  explicit getters instead of Proxy. *Rejected:* doesn't compose with
  `.find` / `.filter` / pattern matching without a parallel runtime
  layer; Proxy gives one mechanism for both fixed and dynamic
  navigation.
- **Two cursor surfaces (parsed vs factory).** Keep factory output as
  plain de-hoisted `NodeData` per ADR-0018 and only expose Proxy
  navigation on `query` / `wrap` output. *Rejected:* forces consumers
  to know which surface they're holding (`fn.name()` vs
  `fn.name.$text`); the same conceptual operation requires different
  syntax depending on how the node was produced. Unifying the cursor
  gives one API regardless of backing — the cost is a small Proxy
  overhead on factory output that ADR-0018 deliberately left room for.

## Principles Applied

- **P-001 (External contract first).** ast-grep is the parsed-tree
  query engine; sittir wraps its API rather than reimplementing
  recursive find or pattern matching.
- **P-003 (Reuse existing structure).** Proxy navigation produces
  `NodeData` via `.$read()` that flows into existing factory, template,
  edit, and render surfaces unchanged.
- **P-005 (Single source of truth).** Generated `Cursor*` types come
  from the same `KIND_NAMES` + per-kind interfaces as factories;
  `FindNamespace` and `FilterNamespace` are mapped types over the same
  source. There's no second per-grammar schema to drift.
- **P-006 (Consumer alignment).** One cursor surface for parsed and
  factory-built nodes. Consumers don't branch on node origin.

## Consequences

- **Enables**:
  - Typed structural queries with one napi crossing per terminal.
  - Pattern + field navigation in the same chain — no shape mismatch
    between "I matched it" and "I navigate it."
  - Composition with construction templates via `.$read()`.
  - `findAndRead` deprecation path that doesn't break existing callers.
  - The cursor evolution ADR-0018 left room for, made concrete.
- **Costs**:
  - **`ast-grep-core` dependency in `sittir-core` (Rust).** Larger
    native binary; another upstream to track for breaking changes.
    Pinning strategy needs to live in the workspace `Cargo.toml`.
  - **`FindNamespace` size.** One method per kind — ~328 entries for
    Rust, ~299 for TypeScript, ~165 for Python. Tree-shaking depends
    on the bundler eliminating unused property accesses on a Proxy,
    which is fragile (most bundlers can't statically analyze Proxy
    `get` traps). Worst case: every consumer ships the full
    `FindNamespace` type, but the runtime cost is zero — the namespace
    is a Proxy, not 328 real methods.
  - **Cursor unification overhead on factory output.** Plain property
    access is replaced with Proxy `get`. Microbenchmark before
    rolling out to all factories, especially in render hot paths
    where field reads dominate.
  - **Two backing implementations behind one Proxy surface.** ast-grep
    for parsed, plain JS for factory. Behavioral parity is ongoing
    work — every new terminal or navigation operation has to be
    implemented twice.
- **Follow-ups**:
  - Decide whether `FilterNamespace<T>` should be lazy (computed
    per-array-element-union at use site) or eager (one big mapped
    type per grammar). Affects type-check time on large files.
  - Decide whether `.find.pattern(p)` should support typed pattern
    metavariables — returning a typed binding map keyed by `$NAME` —
    or only structural matching. The composition example in this ADR
    uses the simpler structural form.
  - Specify error semantics for path walks that hit no nodes:
    currently empty `CursorArray`; could be `Maybe<Cursor>` for
    single-cursor navigation. Inconsistency would surprise consumers.
  - Decide how `$nodeHandle` lazy drill-in interacts with cursor
    navigation — does navigating into a stub trigger drill-in
    automatically, or does the consumer call `.$read()` first?

## Verification

If `resolve_path` ends up being called with single-segment paths most
of the time in real consumer code, the JS-side Proxy is forcing eager
resolution at intermediate steps and the path-accumulation design is
defeated. Signal: napi-call counts on a representative codemod that
don't drop substantially from the per-step baseline.

If consumers write factory and query code that diverges in shape
because the Proxy-on-factory layer is too slow or too lossy — for
example, helpers that branch on `is.cursor(x)` or fall back to direct
`_<name>` access for performance — the cursor unification is leaking,
and we should split the surfaces explicitly. Signal: any helper in
consumer code that handles "cursor or NodeData" with separate
branches.

If `ast-grep-core`'s API changes break the Proxy delegation, or if its
pattern matcher diverges from semgrep's metavariable conventions, we
either pin a version range we can vendor against or take ownership of
the parts of `ast-grep-core` we depend on.
