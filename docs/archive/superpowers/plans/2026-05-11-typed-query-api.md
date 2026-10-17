# Typed Query API Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a typed query API — three entry points (`query()`, `wrap()`, factory-output cursors) returning Proxy-backed cursors with one navigation surface across three backings (native parsed via ast-grep-core, WASM parsed via `@ast-grep/wasm`, in-memory over frozen `NodeData`), with path accumulation across napi and typed pattern-binding bindings reusing ADR 0022's slot extractor.

**Architecture:** One Cursor Proxy class with `get` + `apply` traps dispatching by backing type at construction. Property access on parsed cursors appends a `PathSegment` to a JS-side buffer; terminals (`.$text`, `.$type`, `.length`, `.$read`, `.$render`) cross napi once with the full path. In-memory cursors walk frozen `NodeData` directly (zero crossings). WASM cursors mirror the native algorithm in JS via `@ast-grep/wasm` after an async warmup. See `docs/superpowers/specs/2026-05-11-typed-query-api-design.md` for the full design.

**Tech Stack:** TypeScript (vitest), Rust (cargo test, napi-rs, ast-grep-core), `@ast-grep/wasm` (existing project devDependency), tree-sitter JS binding (already used by codegen).

## Hard Dependencies (must land first)

This plan is **gated by the construction-templates plan**. The following tasks from `docs/superpowers/plans/2026-05-10-construction-templates.md` must complete and land before this plan's Phase 5 starts:

| Construction-templates task | Why this plan needs it                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| Task 1.1–1.6 (Phase 1)      | Template-mode parser ships per grammar; the typed-pattern matching in Phase 5 reuses it directly.   |
| Task 2.1–2.4 (Phase 2 part) | `extractSlots()` + `SlotMap` from `@sittir/codegen/templates/extract-slots.ts` — reused 1:1.        |
| **Task 2.2 addendum** — `extractSlotsSync` | Sync variant of the slot extractor, required so `.pattern()` stays sync (sync-at-boundary). Reads from the template-mode language pre-loaded by `prepareTsTemplateBackend` / `prepareQueryBackend`. See this plan's Task 5.3 for the contract. Add this as a small extension to construction-templates Task 2.2 before Phase 5 here. |
| Task 5.4 (Phase 5)          | `prepareTsTemplateBackend` exports `_getTemplateLanguage(grammar)` — reused by `prepareQueryBackend` to share the template-mode language load. |
| Task 6.1 (Phase 6)          | `SlotNamesOf<S>` template-literal-type extractor from `@sittir/types/template-slots.ts` — reused.   |

Phases 1–4 of *this* plan can run independently of construction-templates. Phase 5 onward requires the dependencies above to be merged.

---

## File Structure

```
packages/core/src/query/                          [NEW DIR]
├── cursor.ts                                     [NEW]  Proxy + makeCursor + state types
├── path.ts                                       [NEW]  PathSegment + buffer helpers
├── terminals.ts                                  [NEW]  Terminal kind + resolveTerminal dispatch
├── native-backing.ts                             [NEW]  native parsed backing (napi)
├── wasm-backing.ts                               [NEW]  WASM parsed backing (@ast-grep/wasm)
├── in-memory-backing.ts                          [NEW]  frozen NodeData backing
├── prepare.ts                                    [NEW]  prepareQueryBackend async warmup
├── find-namespace.ts                             [NEW]  FindNamespace (recursive descent)
├── filter-namespace.ts                           [NEW]  FilterNamespace<T> (immediate-children filter)
├── errors.ts                                     [NEW]  BackendNotReady + structured errors
└── index.ts                                      [NEW]  barrel exports

packages/core/src/__tests__/query/                [NEW DIR]
├── path.test.ts
├── cursor.test.ts
├── native-backing.test.ts
├── wasm-backing.test.ts
├── in-memory-backing.test.ts
├── find-namespace.test.ts
├── filter-namespace.test.ts
└── prepare.test.ts

packages/types/src/
├── maybe-cursor.ts                               [NEW]  type alias: Maybe<T> = T | undefined
└── pattern-bindings.ts                           [NEW]  Match<Slots, Self> mapped type

packages/codegen/src/
├── emitters/
│   ├── cursor-types.ts                           [NEW]  Cursor*, FindNamespace, FilterNamespace<T>
│   ├── pattern-bindings.ts                       [NEW]  no-op runtime helper; types only
│   └── query-entry.ts                            [NEW]  per-grammar query() wrapper emitter
├── __tests__/
│   ├── emitters/cursor-types.test.ts
│   ├── emitters/query-entry.test.ts
│   └── query-parity/                             [NEW DIR]
│       ├── harness.ts
│       ├── parity.test.ts
│       └── fixtures/                             [10 fixtures, see Phase 7.3]
└── cli.ts                                        [MODIFY] wire emitters into --all

packages/rust/src/
├── query.ts                                      [GENERATED] query() entry
├── wrap.ts                                       [MODIFY]   export wrap; keep wrapNode as alias
├── types.ts                                      [GENERATED] adds Cursor*, FindNamespace, etc.
└── engine.ts                                     [MODIFY]   register query backend on init

packages/typescript/src/                          [Phase 8 mirror]
packages/python/src/                              [Phase 8 mirror]

rust/crates/sittir-core/src/query/                [NEW DIR]
├── mod.rs                                        [NEW]
├── path_segment.rs                               [NEW]  PathSegment enum (Rust)
├── terminal.rs                                   [NEW]  Terminal enum (Rust)
├── walk.rs                                       [NEW]  walk_path + resolve_path core
└── tests.rs                                      [NEW]

rust/crates/sittir-rust/src/                      [Phase 2]
└── query_napi.rs                                 [NEW]  resolve_path napi entry

rust/crates/sittir-typescript/src/                [Phase 8 mirror]
rust/crates/sittir-python/src/                    [Phase 8 mirror]
```

**Phase plan (per design §9):**

| Phase | Scope                                                                  | Tasks |
| ----- | ---------------------------------------------------------------------- | ----- |
| 1     | PathSegment + path buffer + cursor Proxy skeleton                      | 5     |
| 2     | Native parsed backing + `resolve_path` napi + Rust `walk_path`         | 8     |
| 3     | `query()` + `wrap()` entry points; one terminal end-to-end             | 4     |
| 4     | `Cursor*` + `FindNamespace` + `FilterNamespace<T>` type emitter        | 6     |
| 5     | Typed pattern bindings (reuses ADR 0022 infrastructure)                | 6     |
| 6     | In-memory backing (factory output → cursor unification) — incl. pre-audit 6.4a | 8     |
| 7     | WASM backing + `prepareQueryBackend` + parity fixture corpus + CI gate | 10    |
| 8     | Roll out to TypeScript + Python grammars                               | 8     |

**Total:** 55 tasks across 4 chunks. ~22 days end-to-end per design §9 (Task 6.4a adds ~half-day audit before the Phase 6.4 emitter change). MVP cut at Phase 5: ~12 days.

---

## Chunk 1: Phases 1–3 — foundations + first end-to-end native path

After this chunk: `query(rustSource, q => q.statements[0].name.$text)` works through the native backing for one terminal type. No WASM, no in-memory backing, no typed pattern matching yet.

### Phase 1 — PathSegment + cursor Proxy skeleton

#### Task 1.1: `PathSegment` type + factories

**Files:**
- Create: `packages/core/src/query/path.ts`
- Test: `packages/core/src/__tests__/query/path.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/__tests__/query/path.test.ts
import { describe, expect, it } from 'vitest';
import {
  type PathSegment,
  fieldSegment, indexSegment, childrenSegment,
  findSegment, patternSegment, filterKindSegment,
} from '../../query/path.ts';

describe('PathSegment factories', () => {
  it('fieldSegment produces a Field segment', () => {
    expect(fieldSegment('name')).toEqual({ kind: 'Field', name: 'name' });
  });
  it('indexSegment produces an Index segment', () => {
    expect(indexSegment(3)).toEqual({ kind: 'Index', index: 3 });
  });
  it('childrenSegment produces a Children segment', () => {
    expect(childrenSegment()).toEqual({ kind: 'Children' });
  });
  it('findSegment carries the target kind', () => {
    expect(findSegment('function_item')).toEqual({ kind: 'Find', targetKind: 'function_item' });
  });
  it('patternSegment carries the pattern source', () => {
    expect(patternSegment('fn $X() {}')).toEqual({ kind: 'Pattern', pattern: 'fn $X() {}' });
  });
  it('filterKindSegment carries the kind to filter by', () => {
    expect(filterKindSegment('identifier')).toEqual({ kind: 'FilterKind', targetKind: 'identifier' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/core test query/path
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/query/path.ts
/**
 * PathSegment encodes one step of a cursor navigation chain. The JS-side
 * buffer accumulates these on every property access on a parsed-tree cursor
 * and ships them across the napi boundary as a single Vec at terminal time.
 * Mirrors `rust/crates/sittir-core/src/query/path_segment.rs` 1:1.
 */
export type PathSegment =
  | { kind: 'Field';      name: string }
  | { kind: 'Index';      index: number }
  | { kind: 'Children' }
  | { kind: 'Find';       targetKind: string }
  | { kind: 'Pattern';    pattern: string }
  | { kind: 'FilterKind'; targetKind: string };
// NOTE: FilterKind uses `targetKind` (mirroring Find) — NOT `kind` — to avoid
// a name collision with the discriminant property `kind`. `seg.kind` is always
// the discriminant; `seg.targetKind` is the filter target.

export const fieldSegment      = (name: string):       PathSegment => ({ kind: 'Field',      name });
export const indexSegment      = (index: number):      PathSegment => ({ kind: 'Index',      index });
export const childrenSegment   = ():                   PathSegment => ({ kind: 'Children' });
export const findSegment       = (targetKind: string): PathSegment => ({ kind: 'Find',       targetKind });
export const patternSegment    = (pattern: string):    PathSegment => ({ kind: 'Pattern',    pattern });
export const filterKindSegment = (targetKind: string): PathSegment => ({ kind: 'FilterKind', targetKind });

/** Append a segment to a path immutably. */
export function appendSegment(path: readonly PathSegment[], segment: PathSegment): readonly PathSegment[] {
  return Object.freeze([...path, segment]);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/core test query/path
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/query/path.ts packages/core/src/__tests__/query/path.test.ts
git commit -m "feat(@sittir/core): PathSegment + factory helpers (Phase 1.1)"
```

#### Task 1.2: `Terminal` kind + dispatch table

**Files:**
- Create: `packages/core/src/query/terminals.ts`
- Test: `packages/core/src/__tests__/query/cursor.test.ts` (new — reused for Tasks 1.4, 1.5)

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/__tests__/query/cursor.test.ts
import { describe, expect, it } from 'vitest';
import { type TerminalKind, isTerminalKey, terminalKindOf } from '../../query/terminals.ts';

describe('Terminal dispatch table', () => {
  it('isTerminalKey returns true for $text, $type, length, $read, $render', () => {
    expect(isTerminalKey('$text')).toBe(true);
    expect(isTerminalKey('$type')).toBe(true);
    expect(isTerminalKey('length')).toBe(true);
    expect(isTerminalKey('$read')).toBe(true);
    expect(isTerminalKey('$render')).toBe(true);
    expect(isTerminalKey('name')).toBe(false);
    expect(isTerminalKey('find')).toBe(false);
  });

  it('terminalKindOf maps string keys to TerminalKind discriminator', () => {
    expect(terminalKindOf('$text')).toBe('Text');
    expect(terminalKindOf('$type')).toBe('Type');
    expect(terminalKindOf('length')).toBe('Length');
    expect(terminalKindOf('$read')).toBe('Read');
    expect(terminalKindOf('$render')).toBe('Render');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/core test query/cursor
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/query/terminals.ts
/** Symbolic kind used on the wire between TS and Rust. */
export type TerminalKind = 'Text' | 'Type' | 'Length' | 'Read' | 'Render';

const TERMINAL_KEYS = new Set(['$text', '$type', 'length', '$read', '$render']);

export function isTerminalKey(key: string): boolean {
  return TERMINAL_KEYS.has(key);
}

const TERMINAL_KIND: Record<string, TerminalKind> = {
  $text:   'Text',
  $type:   'Type',
  length:  'Length',
  $read:   'Read',
  $render: 'Render',
};

export function terminalKindOf(key: string): TerminalKind {
  const k = TERMINAL_KIND[key];
  if (!k) throw new Error(`terminalKindOf: '${key}' is not a terminal`);
  return k;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/core test query/cursor
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/query/terminals.ts packages/core/src/__tests__/query/cursor.test.ts
git commit -m "feat(@sittir/core): TerminalKind + dispatch helpers (Phase 1.2)"
```

#### Task 1.3: `errors.ts` + `BackendNotReady` + structured errors

**Files:**
- Create: `packages/core/src/query/errors.ts`
- Test: `packages/core/src/__tests__/query/cursor.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

```ts
import { BackendNotReady, NoSuchNodeError, QueryBackendError } from '../../query/errors.ts';

describe('query error classes', () => {
  it('BackendNotReady carries a grammar name and points at prepareQueryBackend', () => {
    const e = new BackendNotReady('rust');
    expect(e.grammar).toBe('rust');
    expect(e.message).toMatch(/prepareQueryBackend.*rust/);
  });
  it('NoSuchNodeError carries the node id', () => {
    const e = new NoSuchNodeError(42n);
    expect(e.nodeId).toBe(42n);
  });
  it('QueryBackendError wraps an underlying cause', () => {
    const cause = new Error('underlying');
    const e = new QueryBackendError('native', cause);
    expect(e.backend).toBe('native');
    expect(e.cause).toBe(cause);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/core test query/cursor
```

Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/query/errors.ts
export class BackendNotReady extends Error {
  constructor(public readonly grammar: string) {
    super(
      `Query backend not initialized for grammar '${grammar}'. ` +
      `Call \`await prepareQueryBackend({ grammar: '${grammar}' })\` once at startup.`
    );
    this.name = 'BackendNotReady';
  }
}

export class NoSuchNodeError extends Error {
  constructor(public readonly nodeId: bigint | number) {
    super(`No node found for nodeId ${nodeId}`);
    this.name = 'NoSuchNodeError';
  }
}

export class QueryBackendError extends Error {
  constructor(public readonly backend: 'native' | 'wasm' | 'in-memory', public override cause: unknown) {
    super(`Query backend error (${backend})`);
    this.name = 'QueryBackendError';
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/core test query/cursor
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/query/errors.ts packages/core/src/__tests__/query/cursor.test.ts
git commit -m "feat(@sittir/core): structured query error classes (Phase 1.3)"
```

#### Task 1.4: Cursor state types + `makeCursor` Proxy skeleton (no backings yet)

**Files:**
- Create: `packages/core/src/query/cursor.ts`
- Test: `packages/core/src/__tests__/query/cursor.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

```ts
import { makeCursor, type CursorState } from '../../query/cursor.ts';

describe('makeCursor — Proxy skeleton', () => {
  it('returns a Proxy that records property access via PathSegment', () => {
    const state: CursorState<'parsed'> = {
      kind: 'parsed',
      tree: { grammar: 'rust' } as any,
      nodeId: 1n,
      path: [],
    };
    const cursor = makeCursor(state);
    // The Proxy intercepts unknown property access and builds a deeper cursor.
    // We verify by reading the underlying state via a sentinel symbol.
    const next: any = (cursor as any).name;     // sub-cursor
    const innerState = next[Symbol.for('@sittir/core/query/state')];
    expect(innerState.path).toEqual([{ kind: 'Field', name: 'name' }]);
  });

  it('property access on a deeper cursor accumulates further', () => {
    const state: CursorState<'parsed'> = {
      kind: 'parsed', tree: { grammar: 'rust' } as any, nodeId: 1n, path: [],
    };
    const cursor: any = makeCursor(state);
    const inner = cursor.functionItem[0].name;
    const path = inner[Symbol.for('@sittir/core/query/state')].path;
    expect(path).toEqual([
      { kind: 'Field', name: 'functionItem' },
      { kind: 'Index', index: 0 },
      { kind: 'Field', name: 'name' },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/core test query/cursor
```

Expected: FAIL — `makeCursor` not implemented.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/query/cursor.ts
import type { AnyNodeData } from '@sittir/types';
import type { PathSegment } from './path.ts';
import { fieldSegment, indexSegment, childrenSegment, appendSegment } from './path.ts';
import { isTerminalKey } from './terminals.ts';

/** Sentinel for tests + backings to peek at a cursor's internal state. */
export const CURSOR_STATE_SYMBOL = Symbol.for('@sittir/core/query/state');

export type Backing = 'parsed' | 'in-memory';

export interface CursorState<B extends Backing> {
  kind: B;
  // ParsedBacking:
  tree?:   { grammar: string; engine?: any };
  nodeId?: bigint | number;
  path?:   readonly PathSegment[];
  // InMemoryBacking:
  node?: AnyNodeData;
}

/** Build a new cursor over the given state.
 *
 *  IMPORTANT: the Proxy target is a *function*, not a plain object. JS Proxies
 *  only fire the `apply` trap when the target is callable. This is required
 *  for ADR-0018's cursor/value duality (`fn.name` = cursor, `fn.name()` = value)
 *  to work on the in-memory backing — Task 6.4 adds the `apply` dispatch.
 *  The `state` lives on the function via a captured closure (looked up via
 *  CURSOR_STATE_SYMBOL); the function body itself is unused. */
export function makeCursor<B extends Backing>(state: CursorState<B>): unknown {
  // Target must be a function so the `apply` trap fires when consumers
  // invoke `cursor(...)`. Phase 1 leaves the apply trap as a placeholder;
  // Phase 6.4 implements the in-memory resolution.
  const target = (() => undefined) as unknown as object;
  return new Proxy(target, {
    apply(_target, _thisArg, _args) {
      return applyTerminalPlaceholder(state);
    },
    get(_target, prop) {
      if (prop === CURSOR_STATE_SYMBOL) return state;
      if (typeof prop === 'symbol')     return undefined;

      const key = String(prop);

      // Terminals — Phase 2 / Phase 6 wire these up to backings.
      if (isTerminalKey(key)) {
        return resolveTerminalPlaceholder(state, key);
      }

      // $children — extend path with Children segment; the resulting cursor's
      // `length` terminal + [index] navigation give it CursorArray semantics.
      if (key === '$children') {
        const extended = extendPath(state, childrenSegment());
        return extended ? makeCursor(extended) : undefined;
      }

      // find / filter namespaces — Phase 4 wires these up.
      if (key === 'find')   return findNamespacePlaceholder(state);
      if (key === 'filter') return filterNamespacePlaceholder(state);

      // Numeric index → Index segment.
      if (/^\d+$/.test(key)) {
        const extended = extendPath(state, indexSegment(Number(key)));
        return extended ? makeCursor(extended) : undefined;
      }

      // Named field → Field segment. Returns undefined for absent optionals
      // (in-memory backing only; parsed cursors always succeed at navigation
      // and resolve absence at terminal time).
      const extended = extendPath(state, fieldSegment(key));
      return extended ? makeCursor(extended) : undefined;
    },
  });
}

function applyTerminalPlaceholder(_state: CursorState<any>): never {
  throw new Error('cursor.apply not yet implemented (Phase 6.4 in-memory legacy form)');
}

function extendPath<B extends Backing>(state: CursorState<B>, seg: PathSegment): CursorState<B> {
  if (state.kind === 'parsed') {
    return {
      ...state,
      path: appendSegment(state.path ?? [], seg),
    };
  }
  // In-memory state extension is implemented in Phase 6; until then, throw clearly.
  throw new Error('in-memory cursor navigation not yet implemented (Phase 6)');
}

function resolveTerminalPlaceholder(_state: CursorState<any>, _key: string): never {
  throw new Error('cursor terminals not yet implemented (Phase 2 / Phase 6)');
}

function findNamespacePlaceholder(_state: CursorState<any>): never {
  throw new Error('find namespace not yet implemented (Phase 4)');
}

function filterNamespacePlaceholder(_state: CursorState<any>): never {
  throw new Error('filter namespace not yet implemented (Phase 4)');
}

function makeCursorArray(_state: CursorState<any>): never {
  throw new Error('CursorArray not yet implemented (Phase 4)');
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/core test query/cursor
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/query/cursor.ts packages/core/src/__tests__/query/cursor.test.ts
git commit -m "feat(@sittir/core): cursor Proxy skeleton with path accumulation (Phase 1.4)"
```

#### Task 1.5: Barrel export from `@sittir/core`

**Files:**
- Create: `packages/core/src/query/index.ts`
- Modify: `packages/core/src/index.ts` (re-export query barrel)
- Test: `packages/core/src/__tests__/query/cursor.test.ts` (extend with import smoke)

- [ ] **Step 1: Write the failing test**

```ts
describe('@sittir/core query barrel', () => {
  it('exports the public surface', async () => {
    const mod = await import('@sittir/core/query');
    expect(typeof mod.makeCursor).toBe('function');
    expect(typeof mod.fieldSegment).toBe('function');
    expect(typeof mod.BackendNotReady).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/core test query/cursor
```

Expected: FAIL — `@sittir/core/query` subpath not exported.

- [ ] **Step 3: Write the barrel + package.json export**

```ts
// packages/core/src/query/index.ts
export { makeCursor, CURSOR_STATE_SYMBOL, type Backing, type CursorState } from './cursor.ts';
export {
  type PathSegment,
  fieldSegment, indexSegment, childrenSegment,
  findSegment, patternSegment, filterKindSegment,
  appendSegment,
} from './path.ts';
export { type TerminalKind, isTerminalKey, terminalKindOf } from './terminals.ts';
export { BackendNotReady, NoSuchNodeError, QueryBackendError } from './errors.ts';
```

Add subpath export in `packages/core/package.json`:

```json
"exports": {
  ".": { ... },
  "./engine": { ... },
  "./query": {
    "types":  "./dist/query/index.d.ts",
    "import": "./dist/query/index.js"
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/core build
pnpm --filter @sittir/core test query/cursor
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/query/index.ts packages/core/package.json
git commit -m "feat(@sittir/core): query barrel + subpath export (Phase 1.5)"
```

---

### Phase 2 — Native parsed backing + Rust `walk_path` + napi

#### Task 2.1: `PathSegment` + `Terminal` Rust types

**Files:**
- Create: `rust/crates/sittir-core/src/query/mod.rs`
- Create: `rust/crates/sittir-core/src/query/path_segment.rs`
- Create: `rust/crates/sittir-core/src/query/terminal.rs`
- Create: `rust/crates/sittir-core/src/query/tests.rs`
- Modify: `rust/crates/sittir-core/src/lib.rs`

- [ ] **Step 1: Write the failing test**

```rust
// rust/crates/sittir-core/src/query/tests.rs
use super::path_segment::PathSegment;
use super::terminal::Terminal;

#[test]
fn path_segment_variants_exist() {
    let _ = PathSegment::Field("name".into());
    let _ = PathSegment::Index(0);
    let _ = PathSegment::Children;
    let _ = PathSegment::Find("function_item".into());
    let _ = PathSegment::Pattern("fn $X() {}".into());
    let _ = PathSegment::FilterKind("identifier".into());
}

#[test]
fn terminal_variants_exist() {
    for t in [Terminal::Text, Terminal::Type, Terminal::Length, Terminal::Read, Terminal::Render] {
        let _ = t;
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd rust/crates/sittir-core && cargo test query::tests
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write minimal implementation**

```rust
// rust/crates/sittir-core/src/query/mod.rs
pub mod path_segment;
pub mod terminal;
pub mod walk;

#[cfg(test)]
mod tests;

pub use path_segment::PathSegment;
pub use terminal::Terminal;
pub use walk::{walk_path, resolve_path, WalkError};
```

```rust
// rust/crates/sittir-core/src/query/path_segment.rs
use serde::Deserialize;

/// Mirror of `packages/core/src/query/path.ts` PathSegment.
/// Deserialized from napi as a tagged-union JS object: { kind: 'Field', name: 'x' }
#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "kind")]
pub enum PathSegment {
    Field      { name: String },
    Index      { index: u32 },
    Children,
    Find       { #[serde(rename = "targetKind")] target_kind: String },
    Pattern    { pattern: String },
    FilterKind { #[serde(rename = "targetKind")] target_kind: String },
}
```

```rust
// rust/crates/sittir-core/src/query/terminal.rs
use serde::Deserialize;

#[derive(Debug, Clone, Copy, Deserialize)]
pub enum Terminal {
    Text,
    Type,
    Length,
    Read,
    Render,
}
```

Add `pub mod query;` to `rust/crates/sittir-core/src/lib.rs`.

- [ ] **Step 4: Run test to verify it passes**

```bash
cd rust/crates/sittir-core && cargo test query::tests
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add rust/crates/sittir-core/src/query/ rust/crates/sittir-core/src/lib.rs
git commit -m "feat(sittir-core): PathSegment + Terminal Rust types (Phase 2.1)"
```

#### Task 2.2: `walk_path` core — Field, Index, Children segments

**Files:**
- Create: `rust/crates/sittir-core/src/query/walk.rs`
- Test: `rust/crates/sittir-core/src/query/tests.rs` (extend)

- [ ] **Step 1: Write the failing test**

```rust
#[test]
fn walk_path_field_resolves_named_field() {
    let root = test_parse_rust("fn main() {}");
    let fn_item = root.children().next().unwrap();
    let path = vec![PathSegment::Field { name: "name".into() }];
    let result = walk_path(&fn_item, &path).unwrap();
    assert_eq!(result.len(), 1);
    assert_eq!(result[0].kind(), "identifier");
    assert_eq!(result[0].text(), "main");
}

#[test]
fn walk_path_index_picks_nth_child() {
    let root = test_parse_rust("fn a() {} fn b() {} fn c() {}");
    let path = vec![PathSegment::Index { index: 1 }];
    let result = walk_path(&root, &path).unwrap();
    assert_eq!(result[0].field("name").unwrap().text(), "b");
}

#[test]
fn walk_path_children_flattens_all_named_children() {
    let root = test_parse_rust("fn a() {} fn b() {}");
    let path = vec![PathSegment::Children];
    let result = walk_path(&root, &path).unwrap();
    assert_eq!(result.len(), 2);
    assert_eq!(result[0].kind(), "function_item");
}
```

(`test_parse_rust` helper: lives in the existing test harness — wraps `ast-grep-core` to parse a snippet with the rust grammar. If the helper doesn't exist yet, add it to `rust/crates/sittir-core/src/query/tests.rs` as a thin wrapper that loads the rust language and parses.)

- [ ] **Step 2: Run test to verify it fails**

```bash
cd rust/crates/sittir-core && cargo test walk_path
```

Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```rust
// rust/crates/sittir-core/src/query/walk.rs
use ast_grep_core::{Node as SgNode, Pattern, Language};
use thiserror::Error;
use super::path_segment::PathSegment;
use super::terminal::Terminal;
use crate::node_data::NodeData;

#[derive(Debug, Error)]
pub enum WalkError {
    #[error("path index {0} out of bounds at {1}")]
    IndexOutOfBounds(u32, String),
    #[error("no such node id: {0}")]
    NoSuchNode(u64),
    #[error("pattern compilation failed: {0}")]
    PatternError(String),
}

/// Walk a path starting from `root` and return the matching nodes.
/// Returns an empty Vec if the path traverses into nothing — single-position
/// "absent optional" surfaces as a 0-length result; the JS layer maps that to
/// `Cursor<T> | undefined` per design §5.
pub fn walk_path<'a, L: Language>(
    root: &SgNode<'a, L>,
    path: &[PathSegment],
) -> Result<Vec<SgNode<'a, L>>, WalkError> {
    let mut current: Vec<SgNode<'a, L>> = vec![root.clone()];
    for segment in path {
        current = match segment {
            PathSegment::Field { name } => current
                .iter()
                .filter_map(|n| n.field(name))
                .collect(),
            PathSegment::Index { index } => current
                .iter()
                .filter_map(|n| n.children().nth(*index as usize))
                .collect(),
            PathSegment::Children => current
                .iter()
                .flat_map(|n| n.children())
                .collect(),
            PathSegment::Find { target_kind } => current
                .iter()
                .flat_map(|n| n.find_all(target_kind.as_str()))
                .collect(),
            PathSegment::Pattern { pattern } => {
                let lang = root.lang().clone();
                let pat = Pattern::new(pattern, lang)
                    .map_err(|e| WalkError::PatternError(format!("{:?}", e)))?;
                current.iter().flat_map(|n| n.find_all(&pat)).collect()
            }
            PathSegment::FilterKind { target_kind } => current
                .into_iter()
                .filter(|n| n.kind() == target_kind.as_str())
                .collect(),
        };
    }
    Ok(current)
}
```

(`resolve_path` is added in Task 2.3.)

- [ ] **Step 4: Run test to verify it passes**

```bash
cd rust/crates/sittir-core && cargo test walk_path
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add rust/crates/sittir-core/src/query/walk.rs rust/crates/sittir-core/src/query/tests.rs
git commit -m "feat(sittir-core): walk_path for Field/Index/Children segments (Phase 2.2)"
```

#### Task 2.3: `walk_path` — Find, Pattern, FilterKind segments + tests

**Files:**
- Test: `rust/crates/sittir-core/src/query/tests.rs` (extend)

- [ ] **Step 1: Write the failing tests**

```rust
#[test]
fn walk_path_find_recursively_descends() {
    let root = test_parse_rust("fn outer() { fn inner() {} }");
    let path = vec![PathSegment::Find { target_kind: "function_item".into() }];
    let result = walk_path(&root, &path).unwrap();
    assert_eq!(result.len(), 2);  // outer + inner
}

#[test]
fn walk_path_pattern_matches() {
    let root = test_parse_rust("fn a() {} fn b() {}");
    let path = vec![PathSegment::Pattern { pattern: "fn $NAME() {}".into() }];
    let result = walk_path(&root, &path).unwrap();
    assert_eq!(result.len(), 2);
}

#[test]
fn walk_path_filter_kind_narrows_children() {
    let root = test_parse_rust("fn a() {} struct S; fn b() {}");
    let path = vec![
        PathSegment::Children,
        PathSegment::FilterKind { target_kind: "function_item".into() },
    ];
    let result = walk_path(&root, &path).unwrap();
    assert_eq!(result.len(), 2);
}

#[test]
fn walk_path_invalid_pattern_returns_error() {
    let root = test_parse_rust("fn main() {}");
    let path = vec![PathSegment::Pattern { pattern: "((((".into() }];
    let result = walk_path(&root, &path);
    assert!(matches!(result, Err(WalkError::PatternError(_))));
}
```

- [ ] **Step 2: Run tests; verify they pass (already implemented in Task 2.2)**

```bash
cd rust/crates/sittir-core && cargo test walk_path
```

Expected: PASS — `walk.rs` already covers these branches.

- [ ] **Step 3: Commit**

```bash
git add rust/crates/sittir-core/src/query/tests.rs
git commit -m "test(sittir-core): walk_path Find/Pattern/FilterKind coverage (Phase 2.3)"
```

#### Task 2.4: `resolve_path` — terminal dispatch returning `NodeData` / strings

**Files:**
- Modify: `rust/crates/sittir-core/src/query/walk.rs`
- Test: `rust/crates/sittir-core/src/query/tests.rs` (extend)

- [ ] **Step 1: Write the failing test**

```rust
#[test]
fn resolve_path_text_returns_node_text() {
    let root = test_parse_rust("fn main() {}");
    let path = vec![
        PathSegment::Index { index: 0 },
        PathSegment::Field { name: "name".into() },
    ];
    let text = resolve_path(&root, &path, Terminal::Text).unwrap();
    assert_eq!(text, ResolvedTerminal::Text("main".into()));
}

#[test]
fn resolve_path_type_returns_kind_string() {
    let root = test_parse_rust("fn main() {}");
    let path = vec![PathSegment::Index { index: 0 }];
    let kind = resolve_path(&root, &path, Terminal::Type).unwrap();
    assert_eq!(kind, ResolvedTerminal::Type("function_item".into()));
}

#[test]
fn resolve_path_length_returns_named_child_count() {
    let root = test_parse_rust("fn a() {} fn b() {} fn c() {}");
    let path = vec![];
    let len = resolve_path(&root, &path, Terminal::Length).unwrap();
    assert_eq!(len, ResolvedTerminal::Length(3));
}

#[test]
fn resolve_path_read_returns_node_data() {
    let root = test_parse_rust("fn main() {}");
    let path = vec![PathSegment::Index { index: 0 }];
    let data = resolve_path(&root, &path, Terminal::Read).unwrap();
    match data {
        ResolvedTerminal::Read(node) => {
            assert_eq!(node.kind(), "function_item");
        }
        _ => panic!("expected Read variant"),
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd rust/crates/sittir-core && cargo test resolve_path
```

Expected: FAIL — `resolve_path` and `ResolvedTerminal` don't exist.

- [ ] **Step 3: Add `resolve_path` + `ResolvedTerminal` to `walk.rs`**

```rust
// rust/crates/sittir-core/src/query/walk.rs (append)
use crate::node_data::read_node;

#[derive(Debug, PartialEq)]
pub enum ResolvedTerminal {
    Text(String),
    Type(String),
    Length(usize),
    Read(NodeData),
    Render(String),
}

/// Walk `path` from `root`, then resolve the first result via `terminal`.
/// `path` may produce 0 or more nodes; the contract for sync terminals is:
///   - Text / Type:  on empty result, return Text("") / Type("") (caller's
///                   Maybe<Cursor> layer converts to `undefined` by checking length first)
///   - Length:       on empty result, return 0
///   - Read:         on empty result, return Err(WalkError::NoSuchNode(0))
///   - Render:       on empty result, return Err(WalkError::NoSuchNode(0))
pub fn resolve_path<'a, L: Language>(
    root: &SgNode<'a, L>,
    path: &[PathSegment],
    terminal: Terminal,
) -> Result<ResolvedTerminal, WalkError> {
    let nodes = walk_path(root, path)?;
    match terminal {
        Terminal::Text => Ok(ResolvedTerminal::Text(
            nodes.first().map(|n| n.text().to_string()).unwrap_or_default(),
        )),
        Terminal::Type => Ok(ResolvedTerminal::Type(
            nodes.first().map(|n| n.kind().to_string()).unwrap_or_default(),
        )),
        Terminal::Length => Ok(ResolvedTerminal::Length(nodes.len())),
        Terminal::Read => match nodes.first() {
            Some(n) => Ok(ResolvedTerminal::Read(read_node(n))),
            None    => Err(WalkError::NoSuchNode(0)),
        },
        Terminal::Render => match nodes.first() {
            Some(n) => {
                // Rendering routes through the engine's render path. This
                // function takes a closure caller-supplied to avoid coupling
                // walk.rs to the per-grammar engine — Task 2.5's napi wrapper
                // supplies the render closure.
                Err(WalkError::PatternError(
                    "render terminal must be called via render_via closure".into(),
                ))
            }
            None => Err(WalkError::NoSuchNode(0)),
        },
    }
}

/// Render-aware variant: caller supplies a closure that renders a NodeData
/// to a String. Used by the napi shim where the engine is in scope.
pub fn resolve_path_with_render<'a, L: Language, F>(
    root: &SgNode<'a, L>,
    path: &[PathSegment],
    terminal: Terminal,
    render: F,
) -> Result<ResolvedTerminal, WalkError>
where
    F: FnOnce(&NodeData) -> String,
{
    if matches!(terminal, Terminal::Render) {
        let nodes = walk_path(root, path)?;
        return match nodes.first() {
            Some(n) => Ok(ResolvedTerminal::Render(render(&read_node(n)))),
            None    => Err(WalkError::NoSuchNode(0)),
        };
    }
    resolve_path(root, path, terminal)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd rust/crates/sittir-core && cargo test resolve_path
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add rust/crates/sittir-core/src/query/walk.rs rust/crates/sittir-core/src/query/tests.rs
git commit -m "feat(sittir-core): resolve_path terminal dispatch (Phase 2.4)"
```

#### Task 2.5: `query_napi.rs` for `sittir-rust` — `resolvePath` napi entry

**Files:**
- Create: `rust/crates/sittir-rust/src/query_napi.rs`
- Modify: `rust/crates/sittir-rust/src/lib.rs`
- Test: `packages/rust/tests/query-napi.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/rust/tests/query-napi.test.ts
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/rust';

describe('query napi entry', () => {
  it('resolvePath returns the text of fn name', () => {
    const engine = createEngine();
    const { tree, root } = engine.reader!.parseAndRead('fn main() {}');
    const path = [
      { kind: 'Index', index: 0 },
      { kind: 'Field', name: 'name' },
    ];
    const text = (engine as any).resolvePath(
      (root as any).$nodeId ?? 0n,
      path,
      'Text'
    );
    expect(text).toBe('main');
  });

  it('resolvePath length terminal returns child count', () => {
    const engine = createEngine();
    const { tree, root } = engine.reader!.parseAndRead('fn a() {} fn b() {}');
    const len = (engine as any).resolvePath(
      (root as any).$nodeId ?? 0n,
      [],
      'Length'
    );
    expect(len).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/rust run regenerate
pnpm --filter @sittir/rust test query-napi
```

Expected: FAIL — `resolvePath` not on engine.

- [ ] **Step 3: Write minimal implementation**

```rust
// rust/crates/sittir-rust/src/query_napi.rs
use napi::{Env, JsObject, JsString, JsUnknown, Result as NapiResult};
use napi_derive::napi;
use serde::Deserialize;
use sittir_core::node_data::NodeData;
use sittir_core::query::{
    PathSegment, Terminal, ResolvedTerminal, resolve_path_with_render, WalkError,
};

#[derive(Debug, Deserialize)]
struct TerminalString(String);

fn parse_terminal(s: &str) -> NapiResult<Terminal> {
    match s {
        "Text"   => Ok(Terminal::Text),
        "Type"   => Ok(Terminal::Type),
        "Length" => Ok(Terminal::Length),
        "Read"   => Ok(Terminal::Read),
        "Render" => Ok(Terminal::Render),
        other    => Err(napi::Error::from_reason(format!("unknown terminal: {}", other))),
    }
}

#[napi]
impl crate::SittirRustEngine {
    #[napi]
    pub fn resolve_path(
        &mut self,
        env: Env,
        node_id: u32,                   // JS bigints → u32 on this surface; switch to BigInt later if needed
        path: Vec<JsObject>,            // each element is a PathSegment-shaped object
        terminal: String,
    ) -> NapiResult<JsUnknown> {
        let term = parse_terminal(&terminal)?;
        let segments = path
            .into_iter()
            .map(|obj| {
                let raw = env.serialize_value(&obj)?;
                serde_json::from_value::<PathSegment>(raw)
                    .map_err(|e| napi::Error::from_reason(format!("bad PathSegment: {}", e)))
            })
            .collect::<NapiResult<Vec<_>>>()?;

        let root_node = self.engine.root_sg_node(node_id as u64)
            .ok_or_else(|| napi::Error::from_reason(format!("no node for id {}", node_id)))?;

        let render = |node: &NodeData| self.engine.render_node_data(node);
        let resolved = resolve_path_with_render(&root_node, &segments, term, render)
            .map_err(|e| napi::Error::from_reason(format!("{}", e)))?;

        match resolved {
            ResolvedTerminal::Text(s)   => env.create_string(&s).map(|v| v.into_unknown()),
            ResolvedTerminal::Type(s)   => env.create_string(&s).map(|v| v.into_unknown()),
            ResolvedTerminal::Length(n) => env.create_uint32(n as u32).map(|v| v.into_unknown()),
            ResolvedTerminal::Read(nd)  => nd.to_napi_object(env).map(|v| v.into_unknown()),
            ResolvedTerminal::Render(s) => env.create_string(&s).map(|v| v.into_unknown()),
        }
    }
}
```

Add `mod query_napi;` to `rust/crates/sittir-rust/src/lib.rs`.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/rust run regenerate
pnpm --filter @sittir/rust test query-napi
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add rust/crates/sittir-rust/src/query_napi.rs rust/crates/sittir-rust/src/lib.rs packages/rust/tests/query-napi.test.ts
git commit -m "feat(sittir-rust): resolvePath napi entry (Phase 2.5)"
```

#### Task 2.6: Native backing — TS-side wrapper around `resolvePath`

**Files:**
- Create: `packages/core/src/query/native-backing.ts`
- Test: `packages/core/src/__tests__/query/native-backing.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/__tests__/query/native-backing.test.ts
import { describe, expect, it } from 'vitest';
import { createNativeBacking } from '../../query/native-backing.ts';
import type { CursorState } from '../../query/cursor.ts';

describe('createNativeBacking', () => {
  it('resolveTerminal text routes to engine.resolvePath', () => {
    const calls: any[] = [];
    const engine = {
      resolvePath: (nodeId: any, path: any[], terminal: string) => {
        calls.push({ nodeId, path, terminal });
        return 'main';
      },
    };
    const backing = createNativeBacking();
    const state: CursorState<'parsed'> = {
      kind: 'parsed',
      tree: { grammar: 'rust', engine } as any,
      nodeId: 0n,
      path: [{ kind: 'Field', name: 'name' }],
    };
    const result = backing.resolveTerminal(state, 'Text');
    expect(result).toBe('main');
    expect(calls).toEqual([{ nodeId: 0n, path: [{ kind: 'Field', name: 'name' }], terminal: 'Text' }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/core test query/native-backing
```

Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/query/native-backing.ts
import type { CursorState } from './cursor.ts';
import type { PathSegment } from './path.ts';
import type { TerminalKind } from './terminals.ts';
import { QueryBackendError } from './errors.ts';

export interface QueryBacking {
  resolveTerminal(state: CursorState<'parsed'>, terminal: TerminalKind): unknown;
}

/** Native parsed backing: delegates to `engine.resolvePath(nodeId, path, terminal)`
 *  exposed by the per-grammar napi crate (see Task 2.5). */
export function createNativeBacking(): QueryBacking {
  return {
    resolveTerminal(state, terminal) {
      const engine = state.tree?.engine;
      if (!engine || typeof engine.resolvePath !== 'function') {
        throw new QueryBackendError('native', new Error(
          'native backing requires an engine with a resolvePath napi method'
        ));
      }
      try {
        return engine.resolvePath(state.nodeId!, state.path ?? [], terminal);
      } catch (cause) {
        throw new QueryBackendError('native', cause);
      }
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/core test query/native-backing
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/query/native-backing.ts packages/core/src/__tests__/query/native-backing.test.ts
git commit -m "feat(@sittir/core): native query backing (Phase 2.6)"
```

#### Task 2.7: Wire native backing into the cursor Proxy (replace placeholder)

**Files:**
- Modify: `packages/core/src/query/cursor.ts`
- Test: `packages/core/src/__tests__/query/cursor.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

```ts
import { setActiveQueryBacking } from '../../query/cursor.ts';
import { createNativeBacking } from '../../query/native-backing.ts';

describe('cursor with native backing', () => {
  it('terminal access calls the registered backing', () => {
    const calls: any[] = [];
    setActiveQueryBacking({
      resolveTerminal(state, terminal) {
        calls.push({ path: state.path, terminal });
        return 'sentinel';
      },
    });
    const cursor: any = makeCursor({
      kind: 'parsed',
      tree: { grammar: 'rust' } as any,
      nodeId: 0n,
      path: [],
    });
    expect(cursor.name.$text).toBe('sentinel');
    expect(calls).toEqual([{ path: [{ kind: 'Field', name: 'name' }], terminal: 'Text' }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/core test query/cursor
```

Expected: FAIL — `setActiveQueryBacking` doesn't exist; terminals still throw "not implemented".

- [ ] **Step 3: Replace `resolveTerminalPlaceholder` with backing dispatch**

```ts
// packages/core/src/query/cursor.ts (modify)
import type { QueryBacking } from './native-backing.ts';
import { terminalKindOf } from './terminals.ts';

let activeBacking: QueryBacking | null = null;

export function setActiveQueryBacking(backing: QueryBacking): void {
  activeBacking = backing;
}

export function getActiveQueryBacking(): QueryBacking {
  if (!activeBacking) throw new Error('no query backing registered');
  return activeBacking;
}

// Replace the placeholder:
function resolveTerminalDispatched(state: CursorState<any>, key: string): unknown {
  const kind = terminalKindOf(key);
  if (key === '$read' || key === '$render') {
    // These are called as methods: cursor.$read() / cursor.$render()
    return () => getActiveQueryBacking().resolveTerminal(state, kind);
  }
  return getActiveQueryBacking().resolveTerminal(state, kind);
}
```

Replace `resolveTerminalPlaceholder(target, key)` in the Proxy `get` with `resolveTerminalDispatched(target, key)`.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/core test query/cursor
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/query/cursor.ts packages/core/src/__tests__/query/cursor.test.ts
git commit -m "feat(@sittir/core): wire active query backing into Proxy (Phase 2.7)"
```

#### Task 2.8: End-to-end native smoke test

**Files:**
- Test: `packages/rust/tests/query-native.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/rust/tests/query-native.test.ts
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/rust';
import { makeCursor, setActiveQueryBacking } from '@sittir/core/query';
import { createNativeBacking } from '@sittir/core/query/native-backing';

describe('end-to-end native cursor', () => {
  it('reads "main" via a 2-segment path', () => {
    const engine = createEngine();
    const { tree, root } = engine.reader!.parseAndRead('fn main() {}');
    setActiveQueryBacking(createNativeBacking());
    const cursor: any = makeCursor({
      kind: 'parsed',
      tree: { grammar: 'rust', engine: engine as any },
      nodeId: 0n,
      path: [],
    });
    expect(cursor[0].name.$text).toBe('main');
  });
});
```

- [ ] **Step 2: Run test; verify it passes**

```bash
pnpm --filter @sittir/rust test query-native
```

Expected: PASS — Phase 1 + Phase 2 complete; single end-to-end path works.

- [ ] **Step 3: Commit**

```bash
git add packages/rust/tests/query-native.test.ts
git commit -m "test(rust): end-to-end native cursor reads via napi (Phase 2.8)"
```

---

### Phase 3 — `query()` + `wrap()` entry points

#### Task 3.1: `query()` entry point — per-grammar wrapper

**Files:**
- Create: `packages/codegen/src/emitters/query-entry.ts`
- Test: `packages/codegen/src/__tests__/emitters/query-entry.test.ts`
- Modify: `packages/codegen/src/cli.ts` (wire emitter into --all)

- [ ] **Step 1: Write the failing test**

```ts
// packages/codegen/src/__tests__/emitters/query-entry.test.ts
import { describe, expect, it } from 'vitest';
import { emitQueryEntry } from '../../emitters/query-entry.ts';

describe('emitQueryEntry', () => {
  it('emits a query() function with the grammar root type', async () => {
    const out = await emitQueryEntry('rust');
    expect(out).toContain(`export function query<T>(`);
    expect(out).toContain(`makeCursor`);
    expect(out).toContain(`createNativeBacking`);
    expect(out).toContain(`SourceFile`);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/codegen test emitters/query-entry
```

Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/codegen/src/emitters/query-entry.ts
import { loadGrammarNodeMap } from '../compiler/load.ts';
import { nameNode } from '../compiler/node-map.ts';

const ROOT_KIND_BY_GRAMMAR: Record<string, string> = {
  rust:       'source_file',
  typescript: 'program',
  python:     'module',
};

export async function emitQueryEntry(grammar: string): Promise<string> {
  const rootKind = ROOT_KIND_BY_GRAMMAR[grammar];
  if (!rootKind) throw new Error(`unknown grammar: ${grammar}`);
  const rootType = nameNode(rootKind).typeName;

  return `// Auto-generated by @sittir/codegen — do not edit
import { makeCursor, setActiveQueryBacking } from '@sittir/core/query';
import { createNativeBacking } from '@sittir/core/query/native-backing';
import { createEngine } from './engine.js';
import type { ${rootType} } from './types.js';

// Cursor types are emitted in Phase 4; until then we use Cursor<any> on the entry.
export type CursorRoot = unknown;   // Phase 4: Cursor<${rootType}>

let nativeBackingRegistered = false;

export function query<T>(source: string, fn: (q: CursorRoot) => T): T {
  const engine = createEngine();
  const { tree, root } = engine.reader!.parseAndRead(source);
  if (!nativeBackingRegistered) {
    setActiveQueryBacking(createNativeBacking());
    nativeBackingRegistered = true;
  }
  const cursor = makeCursor({
    kind: 'parsed',
    tree: { grammar: '${grammar}', engine: engine as any },
    nodeId: (root as any).$nodeId ?? 0n,
    path: [],
  });
  return fn(cursor as CursorRoot);
}
`;
}
```

Wire into `--all` chain in `packages/codegen/src/cli.ts`:

```ts
const queryTs = await emitQueryEntry(cliArgs.grammar);
writeFileSync(join(outputDir, 'query.ts'), queryTs);
```

- [ ] **Step 4: Run test + regenerate + type-check**

```bash
pnpm --filter @sittir/codegen test emitters/query-entry
pnpm --filter @sittir/rust run regenerate
pnpm --filter @sittir/rust run type-check
```

Expected: PASS, regenerated `packages/rust/src/query.ts` exists and type-checks.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/emitters/query-entry.ts packages/codegen/src/__tests__/emitters/query-entry.test.ts packages/codegen/src/cli.ts packages/rust/src/query.ts
git commit -m "feat(codegen): per-grammar query() entry emitter (Phase 3.1)"
```

#### Task 3.2: `wrap()` rename — keep `wrapNode` as deprecated alias

**Files:**
- Modify: `packages/rust/src/wrap.ts` (generated — change the emitter)
- Modify: `packages/codegen/src/emitters/wrap.ts` (rename export, keep alias)
- Modify: `packages/rust/src/index.ts` (already re-exports; verify both names exposed)
- Test: `packages/rust/tests/wrap-rename.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/rust/tests/wrap-rename.test.ts
import { describe, expect, it } from 'vitest';
import * as rust from '@sittir/rust';

describe('wrap rename', () => {
  it('exports both wrap and wrapNode (alias)', () => {
    expect(typeof (rust as any).wrap).toBe('function');
    expect(typeof (rust as any).wrapNode).toBe('function');
    expect((rust as any).wrap).toBe((rust as any).wrapNode);  // same function
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/rust test wrap-rename
```

Expected: FAIL — `wrap` not exported.

- [ ] **Step 3: Modify the emitter to export both names**

In `packages/codegen/src/emitters/wrap.ts`, at the bottom of the emitted file, add:

```ts
// New public name. wrapNode kept as deprecated alias for one minor.
export const wrap = wrapNode;
```

Regenerate.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/rust run regenerate
pnpm --filter @sittir/rust test wrap-rename
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/emitters/wrap.ts packages/rust/src/wrap.ts packages/rust/tests/wrap-rename.test.ts
git commit -m "feat(codegen): export wrap as alias of wrapNode (Phase 3.2)"
```

#### Task 3.3: `query()` end-to-end smoke

**Files:**
- Test: `packages/rust/tests/query-smoke.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/rust/tests/query-smoke.test.ts
import { describe, expect, it } from 'vitest';
import { query } from '@sittir/rust';

describe('query() entry point', () => {
  it('reads function names', () => {
    const out = query<string>('fn main() {}', (q: any) => q[0].name.$text);
    expect(out).toBe('main');
  });

  it('reads multiple top-level items by index', () => {
    const names = query<string[]>('fn a() {} fn b() {} fn c() {}', (q: any) => {
      return [q[0].name.$text, q[1].name.$text, q[2].name.$text];
    });
    expect(names).toEqual(['a', 'b', 'c']);
  });
});
```

- [ ] **Step 2: Run test; expect it passes**

```bash
pnpm --filter @sittir/rust test query-smoke
```

Expected: PASS — Phases 1–3 wired together.

- [ ] **Step 3: Commit**

```bash
git add packages/rust/tests/query-smoke.test.ts
git commit -m "test(rust): query() end-to-end smoke (Phase 3.3)"
```

#### Task 3.4: `wrap()` over a parsed node returns a cursor

**Files:**
- Test: `packages/rust/tests/wrap-cursor.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/rust/tests/wrap-cursor.test.ts
import { describe, expect, it } from 'vitest';
import { createEngine, wrap } from '@sittir/rust';

describe('wrap() returns a cursor', () => {
  it('wrap(parsedNode, tree) exposes terminal access', () => {
    const engine = createEngine();
    const { tree, root } = engine.reader!.parseAndRead('fn main() {}');
    const fn = (root.$children as any[])[0];
    const wrapped: any = wrap(fn, tree);
    // wrap currently returns the legacy typed-accessor object;
    // Phase 3.4 verifies cursor behavior on it.
    expect(wrapped.name().$text ?? wrapped.name.$text).toBeDefined();
  });
});
```

(`wrap` currently returns the existing typed-accessor result from ADR 0018. Cursor unification on `wrap()` lands in Phase 6 when the in-memory backing exists. This test just confirms `wrap()` still works alongside the new `query()`.)

- [ ] **Step 2: Run test; expect it passes**

```bash
pnpm --filter @sittir/rust test wrap-cursor
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/rust/tests/wrap-cursor.test.ts
git commit -m "test(rust): wrap() coexists with query() (Phase 3.4)"
```

---

**End of Chunk 1.** Native parsed cursor works end-to-end for `Text`, `Type`, `Length`, `Read` terminals on simple field/index paths. No `find`, no `filter`, no typed pattern matching, no WASM, no in-memory backing.

---

## Chunk 2: Phases 4–5 — type emitter + typed pattern bindings

### Phase 4 — `Cursor*` + `FindNamespace` + `FilterNamespace<T>` type emitter

#### Task 4.1: `Cursor*` interface emitter — basics

**Files:**
- Create: `packages/codegen/src/emitters/cursor-types.ts`
- Test: `packages/codegen/src/__tests__/emitters/cursor-types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/codegen/src/__tests__/emitters/cursor-types.test.ts
import { describe, expect, it } from 'vitest';
import { emitCursorTypes } from '../../emitters/cursor-types.ts';

describe('emitCursorTypes — basics', () => {
  it('emits one interface per kind with Cursor prefix', async () => {
    const out = await emitCursorTypes('rust');
    expect(out).toContain(`export interface CursorFunctionItem`);
    expect(out).toContain(`export interface CursorIdentifier`);
  });

  it('required fields are Cursor<T>, optional fields are Cursor<T> | undefined', async () => {
    const out = await emitCursorTypes('rust');
    // function_item: name is required, return_type is optional in rust grammar
    expect(out).toMatch(/readonly name:\s*CursorIdentifier;/);
    expect(out).toMatch(/readonly returnType:\s*CursorTypeAnnotation \| undefined;/);
  });

  it('array fields are CursorArray<T>', async () => {
    const out = await emitCursorTypes('rust');
    expect(out).toMatch(/readonly \$children:\s*CursorArray</);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/codegen test emitters/cursor-types
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/codegen/src/emitters/cursor-types.ts
import { loadGrammarNodeMap } from '../compiler/load.ts';
import { nameNode } from '../compiler/node-map.ts';
import type { NodeMap, AssembledBranch, AssembledNonterminal } from '../compiler/types.ts';

export async function emitCursorTypes(grammar: string): Promise<string> {
  const nodeMap = await loadGrammarNodeMap(grammar);
  const lines: string[] = [
    `// Auto-generated by @sittir/codegen — do not edit`,
    `import type { ${listConcreteTypeNames(nodeMap).join(', ')} } from './types.js';`,
    `import type { Cursor, CursorArray, CursorAny } from '@sittir/core/query';`,
    ``,
  ];

  for (const [kind, node] of nodeMap.nodes) {
    if (node.modelType !== 'branch') continue;
    const branch = node as AssembledBranch;
    const cursorName = `Cursor${nameNode(kind).typeName}`;
    lines.push(`export interface ${cursorName} {`);
    for (const slot of branch.slots) {
      lines.push(`  ${slotLine(slot)};`);
    }
    lines.push(`  readonly find: FindNamespace;`);
    lines.push(`  readonly $text: string;`);
    lines.push(`  readonly $type: '${kind}';`);
    lines.push(`  $read(): ${nameNode(kind).typeName};`);
    lines.push(`  $render(): string;`);
    lines.push(`}`);
    lines.push(``);
  }

  // Phase 4.2, 4.3 emit FindNamespace and FilterNamespace<T>.
  return lines.join('\n');
}

function slotLine(slot: AssembledNonterminal): string {
  const fieldName = slot.edgeName ?? '$children';
  const propName = slot.edgeName ? camelCase(slot.edgeName) : '$children';
  const isArray = slot.values.some(v => v.multiplicity === 'array' || v.multiplicity === 'nonEmpty');
  const isOptional = !slot.values.some(v => v.multiplicity === 'required');

  if (isArray) {
    return `readonly ${propName}: CursorArray<${cursorElementType(slot)}>`;
  }
  if (isOptional) {
    return `readonly ${propName}: ${cursorElementType(slot)} | undefined`;
  }
  return `readonly ${propName}: ${cursorElementType(slot)}`;
}

function cursorElementType(slot: AssembledNonterminal): string {
  const kinds = slot.values
    .filter(v => v.kind === 'node-ref')
    .map(v => `Cursor${nameNode((v as any).node.kind).typeName}`);
  if (kinds.length === 0) return 'CursorAny';
  if (kinds.length === 1) return kinds[0];
  return `(${kinds.join(' | ')})`;
}

function camelCase(s: string): string {
  return s.replace(/_(\w)/g, (_, c) => c.toUpperCase());
}

function listConcreteTypeNames(nodeMap: NodeMap): string[] {
  return [...nodeMap.nodes.values()]
    .filter(n => n.modelType === 'branch' || n.modelType === 'pattern' || n.modelType === 'keyword' || n.modelType === 'token')
    .map(n => nameNode((n as any).kind).typeName)
    .filter((v, i, a) => a.indexOf(v) === i);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/codegen test emitters/cursor-types
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/emitters/cursor-types.ts packages/codegen/src/__tests__/emitters/cursor-types.test.ts
git commit -m "feat(codegen): Cursor* interface emitter — basics (Phase 4.1)"
```

#### Task 4.2: `FindNamespace` — one method per kind + `pattern()`

**Files:**
- Modify: `packages/codegen/src/emitters/cursor-types.ts`
- Test: `packages/codegen/src/__tests__/emitters/cursor-types.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

```ts
describe('emitCursorTypes — FindNamespace', () => {
  it('exposes one method per kind plus pattern()', async () => {
    const out = await emitCursorTypes('rust');
    expect(out).toContain(`export interface FindNamespace {`);
    expect(out).toMatch(/functionItem\(\):\s*CursorArray<CursorFunctionItem>/);
    expect(out).toMatch(/identifier\(\):\s*CursorArray<CursorIdentifier>/);
    expect(out).toMatch(/pattern<S extends string,\s*Bindings/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/codegen test emitters/cursor-types
```

Expected: FAIL.

- [ ] **Step 3: Extend the emitter**

```ts
// packages/codegen/src/emitters/cursor-types.ts (append before final return)
function emitFindNamespace(nodeMap: NodeMap): string {
  const lines = [`export interface FindNamespace {`];
  for (const [kind, node] of nodeMap.nodes) {
    if (node.modelType !== 'branch') continue;
    const camel = nameNode(kind).factoryName;
    const cursor = `Cursor${nameNode(kind).typeName}`;
    lines.push(`  ${camel}(): CursorArray<${cursor}>;`);
  }
  // Pattern with optional bindings type parameter; defaults to Cursor<Any>-keyed map.
  lines.push(`  pattern<S extends string, Bindings extends Record<SlotNamesOf<S>, CursorAny> = Record<SlotNamesOf<S>, CursorAny>>(pattern: S): CursorArray<CursorAny & Bindings>;`);
  lines.push(`}`);
  return lines.join('\n');
}
```

Add to the top of the emitted file:

```ts
import type { SlotNamesOf } from '@sittir/types/template-slots';
```

Append `emitFindNamespace(nodeMap)` to the lines array in `emitCursorTypes`.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/codegen test emitters/cursor-types
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/emitters/cursor-types.ts packages/codegen/src/__tests__/emitters/cursor-types.test.ts
git commit -m "feat(codegen): FindNamespace emitter (Phase 4.2)"
```

#### Task 4.3: `FilterNamespace<T>` — lazy mapped type

**Files:**
- Modify: `packages/codegen/src/emitters/cursor-types.ts`
- Test: `packages/codegen/src/__tests__/emitters/cursor-types.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

```ts
describe('emitCursorTypes — FilterNamespace', () => {
  it('emits a lazy mapped type keyed by KindOf<T>', async () => {
    const out = await emitCursorTypes('rust');
    expect(out).toContain(`export type FilterNamespace<T>`);
    expect(out).toContain(`{ [K in KindOf<T>]:`);
    expect(out).toContain(`KindOf<T>`);
  });
});
```

- [ ] **Step 2: Run test to verify it fails; then implement**

Append to `emitCursorTypes`:

```ts
function emitFilterNamespace(nodeMap: NodeMap): string {
  // KindOf<T> is the union of kind string literals reachable from T's
  // supertype set; here we emit a generic mapped type. The kind-to-cursor
  // table lookup lives in CursorFor<K>.
  return `
export type KindOf<T> = T extends { $type: infer K extends string } ? K : never;

export type CursorFor<K extends string> =
${[...nodeMap.nodes.entries()]
  .filter(([, n]) => n.modelType === 'branch')
  .map(([kind]) => `  K extends '${kind}' ? Cursor${nameNode(kind).typeName} :`)
  .join('\n')}
  CursorAny;

export type FilterNamespace<T> = {
  [K in KindOf<T>]: () => CursorArray<CursorFor<K>>;
};
`;
}
```

Append `emitFilterNamespace(nodeMap)` to the lines.

- [ ] **Step 3: Run test; verify pass**

```bash
pnpm --filter @sittir/codegen test emitters/cursor-types
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/codegen/src/emitters/cursor-types.ts packages/codegen/src/__tests__/emitters/cursor-types.test.ts
git commit -m "feat(codegen): FilterNamespace<T> lazy emitter (Phase 4.3)"
```

#### Task 4.4: Wire emitter into CLI; regenerate; type-check

**Files:**
- Modify: `packages/codegen/src/cli.ts`
- Modify: per-grammar generated `types.ts` (regenerated)

- [ ] **Step 1: Append to CLI `--all` chain**

```ts
const cursorTypesTs = await emitCursorTypes(cliArgs.grammar);
appendFileSync(join(outputDir, 'types.ts'), '\n\n' + cursorTypesTs);
```

(Appending to `types.ts` keeps the kind-related types co-located. Alternative: a sibling `cursor-types.ts` file with re-export from `types.ts`. Default to append unless `types.ts` is becoming unwieldy — at the point this lands, regenerated `types.ts` is ~2000 lines, append is fine.)

- [ ] **Step 2: Regenerate Rust grammar; type-check**

```bash
pnpm --filter @sittir/rust run regenerate
pnpm --filter @sittir/rust run type-check
```

Expected: PASS. `CursorFunctionItem`, `FindNamespace`, `FilterNamespace<T>`, `CursorFor<K>`, `KindOf<T>` all emitted and type-check.

- [ ] **Step 3: Commit**

```bash
git add packages/codegen/src/cli.ts packages/rust/src/types.ts
git commit -m "feat(codegen): regenerate rust with Cursor types (Phase 4.4)"
```

#### Task 4.5: Implement `CursorArray<T>` at runtime

**Files:**
- Modify: `packages/core/src/query/cursor.ts` — replace `makeCursorArray` placeholder
- Test: `packages/core/src/__tests__/query/cursor.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

```ts
describe('CursorArray', () => {
  it('has length terminal and index access', () => {
    setActiveQueryBacking({
      resolveTerminal(state, terminal) {
        if (terminal === 'Length') return 3;
        if (terminal === 'Text')   return 'fn-' + (state.path?.length ?? 0);
        return null;
      },
    });
    const arr: any = makeCursor({
      kind: 'parsed', tree: { grammar: 'rust' } as any, nodeId: 0n, path: [{ kind: 'Children' }],
    });
    expect(arr.length).toBe(3);
    expect(arr[0].$text).toBe('fn-2');  // path length: Children + Index(0) = 2 segments
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/core test query/cursor
```

Expected: FAIL — `length` returns `null` because the existing terminal path didn't handle "length" path-extension.

- [ ] **Step 3: Replace `makeCursorArray` placeholder**

Looking at the current cursor.ts: `$children` already appends a Children segment and recurses into `makeCursor`. The existing Proxy `get` already handles `length` and `[index]` via terminal/index branches — no new function needed. The placeholder can be removed; verify the Proxy handles arrays uniformly.

```ts
// packages/core/src/query/cursor.ts — DELETE the makeCursorArray placeholder
// (the get trap on a cursor with Children at the tail handles `length`,
//  `[index]`, and `.find` / `.filter` via the existing dispatch — same surface
//  as the singular cursor.)
```

Update tests to reflect this — there's no special CursorArray runtime; the type-side `CursorArray<T>` is purely a TS interface that the Proxy's runtime behavior happens to satisfy.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/core test query/cursor
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/query/cursor.ts packages/core/src/__tests__/query/cursor.test.ts
git commit -m "feat(@sittir/core): CursorArray is the same Proxy; remove placeholder (Phase 4.5)"
```

#### Task 4.6: Implement `FindNamespace` / `FilterNamespace` runtime as Proxies

**Files:**
- Create: `packages/core/src/query/find-namespace.ts`
- Create: `packages/core/src/query/filter-namespace.ts`
- Modify: `packages/core/src/query/cursor.ts` — replace the two placeholder functions
- Test: `packages/core/src/__tests__/query/find-namespace.test.ts`
- Test: `packages/core/src/__tests__/query/filter-namespace.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// packages/core/src/__tests__/query/find-namespace.test.ts
import { describe, expect, it } from 'vitest';
import { findNamespaceFor } from '../../query/find-namespace.ts';

describe('FindNamespace', () => {
  it('kind methods append a Find segment', () => {
    const state = { kind: 'parsed' as const, tree: { grammar: 'rust' } as any, nodeId: 0n, path: [] };
    const ns: any = findNamespaceFor(state);
    const result = ns.functionItem();
    const inner = result[Symbol.for('@sittir/core/query/state')];
    expect(inner.path).toEqual([{ kind: 'Find', targetKind: 'function_item' }]);
  });

  it('.pattern(p) appends a Pattern segment', () => {
    const state = { kind: 'parsed' as const, tree: { grammar: 'rust' } as any, nodeId: 0n, path: [] };
    const ns: any = findNamespaceFor(state);
    const result = ns.pattern('fn $X() {}');
    const inner = result[Symbol.for('@sittir/core/query/state')];
    expect(inner.path).toEqual([{ kind: 'Pattern', pattern: 'fn $X() {}' }]);
  });
});
```

```ts
// packages/core/src/__tests__/query/filter-namespace.test.ts (similar shape)
```

- [ ] **Step 2: Run tests to verify failure**

```bash
pnpm --filter @sittir/core test query/find-namespace query/filter-namespace
```

Expected: FAIL.

- [ ] **Step 3: Write implementations**

```ts
// packages/core/src/query/find-namespace.ts
import { CURSOR_STATE_SYMBOL, makeCursor, type CursorState } from './cursor.ts';
import { appendSegment, findSegment, patternSegment } from './path.ts';

const camelToSnake = (s: string): string =>
  s.replace(/[A-Z]/g, (c, i) => (i > 0 ? '_' : '') + c.toLowerCase());

export function findNamespaceFor(state: CursorState<'parsed'>): unknown {
  return new Proxy({}, {
    get(_t, prop) {
      if (typeof prop === 'symbol') return undefined;
      const key = String(prop);
      if (key === 'pattern') {
        return (pattern: string) => makeCursor({
          ...state,
          path: appendSegment(state.path ?? [], patternSegment(pattern)),
        });
      }
      // Camel-to-snake_case kind name (functionItem → function_item).
      const targetKind = camelToSnake(key);
      return () => makeCursor({
        ...state,
        path: appendSegment(state.path ?? [], findSegment(targetKind)),
      });
    },
  });
}
```

```ts
// packages/core/src/query/filter-namespace.ts
import { CURSOR_STATE_SYMBOL, makeCursor, type CursorState } from './cursor.ts';
import { appendSegment, filterKindSegment } from './path.ts';

const camelToSnake = (s: string): string =>
  s.replace(/[A-Z]/g, (c, i) => (i > 0 ? '_' : '') + c.toLowerCase());

export function filterNamespaceFor(state: CursorState<'parsed'>): unknown {
  // FilterNamespace is also callable as `state.filter(fn)` — Array.prototype.filter
  // semantics. Implement as a callable Proxy.
  const target = (predicate: (item: any) => boolean) => {
    // Eager resolve: pull the array, filter in JS, return a CursorArray-shaped
    // pseudo-cursor. For Phase 4 the simplest implementation reads via Children
    // terminal — refined later if profiling shows this is hot.
    // (Implementation deferred; tests for the predicate form land in Phase 6.)
    throw new Error('filter(predicate) not yet implemented (Phase 6)');
  };
  return new Proxy(target, {
    get(_t, prop) {
      if (typeof prop === 'symbol') return undefined;
      const key = String(prop);
      const targetKind = camelToSnake(key);
      return () => makeCursor({
        ...state,
        path: appendSegment(state.path ?? [], filterKindSegment(targetKind)),
      });
    },
  });
}
```

Wire into `cursor.ts`: replace `findNamespacePlaceholder` and `filterNamespacePlaceholder` with imports of `findNamespaceFor` / `filterNamespaceFor`.

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter @sittir/core test query/find-namespace query/filter-namespace
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/query/find-namespace.ts packages/core/src/query/filter-namespace.ts packages/core/src/query/cursor.ts packages/core/src/__tests__/query/find-namespace.test.ts packages/core/src/__tests__/query/filter-namespace.test.ts
git commit -m "feat(@sittir/core): FindNamespace + FilterNamespace runtime (Phase 4.6)"
```

---

### Phase 5 — Typed pattern bindings (depends on construction-templates Phase 2)

**Prerequisite:** Construction-templates Tasks 2.1–2.4 (the slot extractor + template-mode parser) must be merged. This phase imports `extractSlots` from `@sittir/codegen/templates/extract-slots.ts` directly.

#### Task 5.1: `SlotNamesOf<S>` re-exported from `@sittir/types`

**Files:**
- Modify: `packages/core/src/query/index.ts` (re-export so consumers can use `import { SlotNamesOf } from '@sittir/core/query'`)
- Test: `packages/core/src/__tests__/query/cursor.test.ts` (type-only test)

- [ ] **Step 1: Add re-export**

```ts
// packages/core/src/query/index.ts (append)
export type { SlotNamesOf } from '@sittir/types/template-slots';
```

- [ ] **Step 2: Verify type-check passes**

```bash
pnpm --filter @sittir/core run type-check
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/query/index.ts
git commit -m "feat(@sittir/core): re-export SlotNamesOf<S> (Phase 5.1)"
```

#### Task 5.2: `Match<Slots, Self>` mapped type

**Files:**
- Create: `packages/types/src/pattern-bindings.ts`
- Test: `packages/types/src/__tests__/pattern-bindings.test-d.ts`

- [ ] **Step 1: Write the failing type-level test**

```ts
// packages/types/src/__tests__/pattern-bindings.test-d.ts
import { expectTypeOf } from 'vitest';
import type { Match } from '../pattern-bindings.ts';

type SelfA = { $type: 'a'; foo: string };
type M = Match<'NAME' | 'BODY', SelfA, { NAME: number; BODY: boolean }>;

// M should be SelfA & { NAME: number; BODY: boolean }
expectTypeOf<M['$type']>().toEqualTypeOf<'a'>();
expectTypeOf<M['foo']>().toEqualTypeOf<string>();
expectTypeOf<M['NAME']>().toEqualTypeOf<number>();
expectTypeOf<M['BODY']>().toEqualTypeOf<boolean>();
```

- [ ] **Step 2: Run; verify fail**

```bash
pnpm --filter @sittir/types test pattern-bindings
```

Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// packages/types/src/pattern-bindings.ts
import type { CursorAny } from '@sittir/core/query';

/** Pattern match cursor: union of the match's own cursor surface and
 *  named bindings extracted by SlotNamesOf<S> from the pattern.
 *  Slot kinds default to CursorAny; callers narrow via the third type
 *  parameter (e.g., `q.find.pattern<'fn $X', { X: CursorIdentifier }>(...)`). */
export type Match<
  Slots extends string,
  Self,
  Bindings extends Record<Slots, unknown> = Record<Slots, CursorAny>,
> = Self & { readonly [K in Slots]: Bindings[K] };
```

- [ ] **Step 4: Run; verify pass**

```bash
pnpm --filter @sittir/types test pattern-bindings
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/types/src/pattern-bindings.ts packages/types/src/__tests__/pattern-bindings.test-d.ts
git commit -m "feat(@sittir/types): Match<Slots, Self, Bindings> mapped type (Phase 5.2)"
```

#### Task 5.3: Runtime pattern binding — slot extractor reuse

**Files:**
- Modify: `packages/core/src/query/find-namespace.ts` — `pattern()` reads slots via reused extractor
- Test: `packages/core/src/__tests__/query/find-namespace.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

```ts
describe('pattern() runtime binding', () => {
  it('match cursors expose named slots from the pattern', async () => {
    // requires construction-templates Phase 1 (template-mode parser per grammar)
    // and Phase 2 (extractSlots) to have landed.
    const { findNamespaceFor } = await import('../../query/find-namespace.ts');
    setActiveQueryBacking(/* a mock that returns text 'main' for any path */);

    const state = { kind: 'parsed' as const, tree: { grammar: 'rust' } as any, nodeId: 0n, path: [] };
    const ns: any = findNamespaceFor(state);
    const arr = ns.pattern('fn $NAME() {}');
    const match = arr[0];  // expect a cursor that ALSO exposes match.NAME

    // match.NAME should be a Cursor whose path includes the binding lookup
    expect(match.NAME).toBeDefined();
    // Calling .$text on match.NAME returns the bound text
    expect(match.NAME.$text).toBe('main');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/core test query/find-namespace
```

Expected: FAIL.

- [ ] **Step 3: Modify `findNamespaceFor` to enhance the cursor returned from `.pattern()`**

```ts
// packages/core/src/query/find-namespace.ts (modify pattern() branch)
import { extractSlotsSync } from '@sittir/codegen/templates/extract-slots';
import { _getTemplateLanguage } from '@sittir/core';   // from construction-templates Phase 5.4 prepareTsTemplateBackend

export function findNamespaceFor(state: CursorState<'parsed'>): unknown {
  return new Proxy({}, {
    get(_t, prop) {
      if (typeof prop === 'symbol') return undefined;
      const key = String(prop);
      if (key === 'pattern') {
        return (pattern: string) => {                  // SYNC — sync at boundary
          // Each element of the resulting CursorArray is a match cursor.
          // Slot bindings are surfaced as additional Proxy properties.
          const baseCursor = makeCursor({
            ...state,
            path: appendSegment(state.path ?? [], patternSegment(pattern)),
          });
          // Sync slot extraction: requires the template-mode parser language
          // to have been loaded by `prepareQueryBackend` (Phase 7.1).
          // extractSlotsSync() throws if the language isn't loaded — clear
          // BackendNotReady error pointing the caller at prepareQueryBackend.
          const slots = extractSlotsSync(pattern, state.tree!.grammar);

          // Wrap baseCursor in a Proxy that overlays slot bindings.
          // Each binding is a sub-cursor with a synthetic Binding segment.
          return new Proxy(baseCursor as any, {
            get(target, prop) {
              if (typeof prop === 'string' && slots.find(s => s.name === prop)) {
                const matchState = (target as any)[CURSOR_STATE_SYMBOL] as CursorState<'parsed'>;
                return makeCursor({
                  ...matchState,
                  path: appendSegment(matchState.path ?? [], { kind: 'Binding', name: prop } as any),
                });
              }
              return Reflect.get(target, prop);
            },
          });
        };
      }
      const targetKind = camelToSnake(key);
      return () => makeCursor({
        ...state,
        path: appendSegment(state.path ?? [], findSegment(targetKind)),
      });
    },
  });
}
```

**Sync-at-boundary contract:** `.pattern()` stays sync. The slot extractor (`extractSlotsSync`) reads from the already-loaded template-mode parser language stashed by `prepareQueryBackend` (Phase 7.1, which also covers the template-mode warmup). The construction-templates plan needs a sibling `extractSlotsSync` export — see the **prerequisite addendum** added to that plan's Phase 2:

```ts
// construction-templates plan Task 2.2 extension — packages/codegen/src/templates/extract-slots.ts
// SYNC variant: requires the language to be pre-loaded via prepareTsTemplateBackend
// (or its sibling for the query path). Throws if not loaded.
export function extractSlotsSync(source: string, grammar: string): SlotMap {
  const lang = _getTemplateLanguage(grammar);  // exported by @sittir/core via prepareTsTemplateBackend
  if (!lang) {
    throw new Error(
      `extractSlotsSync: template-mode language not loaded for grammar '${grammar}'. ` +
      `Call \`await prepareTsTemplateBackend({ grammar: '${grammar}' })\` or ` +
      `\`await prepareQueryBackend({ grammar: '${grammar}' })\` once at startup.`
    );
  }
  const parser = new Parser();   // web-tree-sitter Parser; init done at module load via prepareTs*
  parser.setLanguage(lang);
  const tree = parser.parse(source);
  // ... same walk as async extractSlots, but synchronous
  return walkForSlots(tree.rootNode);
}
```

This sync variant is a small addition to the construction-templates plan — list it in the Hard Dependencies section at the top of this plan.

Add `Binding` to `PathSegment`:

```ts
// packages/core/src/query/path.ts (append)
// Synthetic segment for pattern metavariable bindings. Native backing
// translates this to a per-pattern slot lookup at resolve_path time.
export const bindingSegment = (name: string): PathSegment => ({ kind: 'Binding', name } as any);
```

And in `path_segment.rs` (Rust side):

```rust
// rust/crates/sittir-core/src/query/path_segment.rs (modify)
pub enum PathSegment {
    Field      { name: String },
    Index      { index: u32 },
    Children,
    Find       { #[serde(rename = "targetKind")] target_kind: String },
    Pattern    { pattern: String },
    FilterKind { #[serde(rename = "targetKind")] target_kind: String },
    Binding    { name: String },   // NEW
}
```

And in `walk.rs`:

```rust
// rust/crates/sittir-core/src/query/walk.rs (modify walk_path)
PathSegment::Binding { name } => {
    // Locate the previous Pattern segment in the path and look up `name`
    // in its bindings table. Implementation: previous Pattern result
    // populated a per-match bindings map; Binding consults it.
    // For the MVP, re-run the pattern matcher with binding capture.
    current.iter().filter_map(|n| n.binding(name)).collect()
}
```

(ast-grep-core's matcher exposes per-match metavariable bindings; the binding lookup is a direct API call.)

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/core test query/find-namespace
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/query/find-namespace.ts packages/core/src/query/path.ts rust/crates/sittir-core/src/query/path_segment.rs rust/crates/sittir-core/src/query/walk.rs packages/core/src/__tests__/query/find-namespace.test.ts
git commit -m "feat(@sittir/core): typed pattern bindings via reused slot extractor (Phase 5.3)"
```

#### Task 5.4: End-to-end typed pattern smoke test

**Files:**
- Test: `packages/rust/tests/query-pattern.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/rust/tests/query-pattern.test.ts
import { describe, expect, it } from 'vitest';
import { query, prepareQueryBackend } from '@sittir/rust';

describe('typed pattern bindings', () => {
  it('match cursors expose bound metavariables', async () => {
    await prepareQueryBackend({ grammar: 'rust' });  // warms up slot extractor
    const names = query<string[]>('fn a() {} fn b() {}', (q: any) => {
      const matches = q.find.pattern('fn $NAME() {}');
      return [matches[0].NAME.$text, matches[1].NAME.$text];
    });
    expect(names).toEqual(['a', 'b']);
  });
});
```

(`prepareQueryBackend` is wired in Phase 7; for Phase 5, a stub that pre-loads the extractor's template-mode parser will do.)

- [ ] **Step 2: Run test; expect FAIL until Phase 7 wires `prepareQueryBackend`**

`.pattern()` is sync, but `extractSlotsSync` requires the template-mode language to be pre-loaded. The test's `await prepareQueryBackend({ grammar: 'rust' })` does that warmup; without Phase 7.1's implementation, the test fails on a `BackendNotReady` error from `extractSlotsSync`.

- [ ] **Step 3: Mark the assertion `.todo` until Phase 7 lands**

```ts
// Until Phase 7.1 ships prepareQueryBackend, the warmup itself is a no-op
// import; the test is skipped:
it.todo('match cursors expose bound metavariables — lights up after Phase 7.1');
```

After Phase 7.1 lands, return to this test, convert `it.todo` → `it`, and verify it passes.

```bash
git add packages/rust/tests/query-pattern.test.ts
git commit -m "test(rust): typed pattern bindings scaffolding (Phase 5.4)"
```

#### Task 5.5: Pattern binding type-level tests

**Files:**
- Test: `packages/rust/tests/query-pattern-types.test-d.ts`

- [ ] **Step 1: Write the type-level test**

```ts
import { expectTypeOf } from 'vitest';
import { query } from '@sittir/rust';
import type { Match, Cursor, CursorAny } from '@sittir/core/query';
import type { CursorFunctionItem, CursorIdentifier } from '@sittir/rust';

// Default: bindings are Cursor<Any>
query('fn main() {}', q => {
  const m = q.find.pattern('fn $NAME() {}');
  expectTypeOf(m[0].NAME).toEqualTypeOf<CursorAny>();
});

// Explicit: bindings narrowed
query('fn main() {}', q => {
  const m = q.find.pattern<'fn $NAME() {}', { NAME: CursorIdentifier }>('fn $NAME() {}');
  expectTypeOf(m[0].NAME).toEqualTypeOf<CursorIdentifier>();
});
```

- [ ] **Step 2: Run type-check; expect PASS**

```bash
pnpm --filter @sittir/rust run type-check
```

Expected: PASS — type-level coverage of typed bindings.

- [ ] **Step 3: Commit**

```bash
git add packages/rust/tests/query-pattern-types.test-d.ts
git commit -m "test(rust): pattern binding type-level coverage (Phase 5.5)"
```

#### Task 5.6: Composition with construction templates — `.$read()` → `fill()`

**Files:**
- Test: `packages/rust/tests/query-snippet-compose.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/rust/tests/query-snippet-compose.test.ts
import { describe, expect, it } from 'vitest';
import { query, snippets, ir, prepareQueryBackend, prepareTsTemplateBackend } from '@sittir/rust';

describe('query → snippet composition', () => {
  it.todo('cursor.$read() flows into snippets.fill() — lights up after Phase 7');
  // Actual test, scaffolded:
  it('cursor.$read() produces NodeData usable as a snippet slot', async () => {
    await prepareQueryBackend({ grammar: 'rust' });
    const source = query<string>('fn original() { println!("hi"); }', (q: any) => {
      const matches = q.find.pattern('fn $NAME() { $...BODY }');
      const m = matches[0];
      return snippets.greet
        .fill({
          NAME: m.NAME.$read(),
          PARAMS: [],
          RET: ir.typeIdentifier('String'),
          BODY: ir.expressionStatement({ expression: ir.stringLiteral('"hello"') }),
        })
        .render();
    });
    expect(source).toContain('original');  // NAME bound from query
    expect(source).toContain('hello');     // BODY from new construction
  });
});
```

- [ ] **Step 2: Run test; expect FAIL until Phase 7 lands**

- [ ] **Step 3: Commit as `.todo` until Phase 7.4 lights it up**

```bash
git add packages/rust/tests/query-snippet-compose.test.ts
git commit -m "test(rust): query → snippet composition scaffold (Phase 5.6)"
```

---

**End of Chunk 2.** Type emitter produces `Cursor*`, `FindNamespace`, `FilterNamespace<T>` for the Rust grammar. Typed pattern bindings have type-level support; runtime pieces gated on Phase 7's warmup story land their tests as `.todo` until then.

---

## Chunk 3: Phases 6–7 — in-memory backing + WASM + parity

### Phase 6 — In-memory backing (factory output → cursor unification)

#### Task 6.1: `InMemoryBacking` — basic field navigation

**Files:**
- Create: `packages/core/src/query/in-memory-backing.ts`
- Test: `packages/core/src/__tests__/query/in-memory-backing.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/__tests__/query/in-memory-backing.test.ts
import { describe, expect, it } from 'vitest';
import { createInMemoryBacking } from '../../query/in-memory-backing.ts';
import type { CursorState } from '../../query/cursor.ts';

describe('createInMemoryBacking', () => {
  it('resolveTerminal Text reads $text from a leaf NodeData', () => {
    const node = { $type: 1, $source: 2, $named: true, $text: 'hello', _name: undefined };
    const backing = createInMemoryBacking();
    const state: CursorState<'in-memory'> = { kind: 'in-memory', node: node as any };
    expect(backing.resolveTerminal(state, 'Text')).toBe('hello');
  });

  it('resolveTerminal Type returns the KIND_NAMES entry', () => {
    const node = { $type: 42, $source: 2, $named: true };
    const backing = createInMemoryBacking({ kindNames: new Map([[42, 'identifier']]) });
    const state: CursorState<'in-memory'> = { kind: 'in-memory', node: node as any };
    expect(backing.resolveTerminal(state, 'Type')).toBe('identifier');
  });

  it('resolveTerminal Length reads $children.length', () => {
    const node = { $type: 1, $source: 2, $named: true, $children: [{}, {}, {}] };
    const backing = createInMemoryBacking();
    const state: CursorState<'in-memory'> = { kind: 'in-memory', node: node as any };
    expect(backing.resolveTerminal(state, 'Length')).toBe(3);
  });

  it('resolveTerminal Read returns the node identity', () => {
    const node = { $type: 1, $source: 2, $named: true };
    const backing = createInMemoryBacking();
    const state: CursorState<'in-memory'> = { kind: 'in-memory', node: node as any };
    expect(backing.resolveTerminal(state, 'Read')).toBe(node);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/core test query/in-memory-backing
```

Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/query/in-memory-backing.ts
import type { AnyNodeData } from '@sittir/types';
import type { CursorState } from './cursor.ts';
import type { QueryBacking } from './native-backing.ts';
import type { TerminalKind } from './terminals.ts';
import { QueryBackendError } from './errors.ts';

export interface InMemoryBackingOptions {
  kindNames?: ReadonlyMap<number, string>;
  renderNode?: (node: AnyNodeData) => string;
}

export function createInMemoryBacking(opts: InMemoryBackingOptions = {}): QueryBacking {
  return {
    resolveTerminal(state, terminal) {
      if (state.kind !== 'in-memory') {
        throw new QueryBackendError('in-memory', new Error('expected in-memory state'));
      }
      const node = state.node!;
      switch (terminal) {
        case 'Text':   return (node as any).$text ?? extractText(node);
        case 'Type':   return opts.kindNames?.get((node as any).$type) ?? String((node as any).$type);
        case 'Length': return ((node as any).$children ?? []).length;
        case 'Read':   return node;
        case 'Render': {
          if (!opts.renderNode) {
            throw new QueryBackendError('in-memory', new Error('renderNode option required for Render terminal'));
          }
          return opts.renderNode(node);
        }
        default:
          throw new QueryBackendError('in-memory', new Error(`unknown terminal: ${terminal}`));
      }
    },
  };
}

function extractText(node: AnyNodeData): string {
  // Concatenate leaf $text values in document order via the existing render path.
  // For Phase 6.1 we keep it simple: read $text directly when present, else empty.
  return (node as any).$text ?? '';
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/core test query/in-memory-backing
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/query/in-memory-backing.ts packages/core/src/__tests__/query/in-memory-backing.test.ts
git commit -m "feat(@sittir/core): in-memory query backing (Phase 6.1)"
```

#### Task 6.2: In-memory backing — path navigation

**Files:**
- Modify: `packages/core/src/query/in-memory-backing.ts` — add `resolveNavigation` for in-memory paths
- Modify: `packages/core/src/query/cursor.ts` — dispatch path extension by backing kind
- Test: `packages/core/src/__tests__/query/in-memory-backing.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

```ts
import { makeCursor } from '../../query/cursor.ts';

describe('in-memory cursor navigation', () => {
  it('navigates into _<field> storage', () => {
    const node = {
      $type: 1, $source: 2, $named: true,
      _name: { $type: 2, $source: 2, $named: true, $text: 'main' },
    };
    const cursor: any = makeCursor({ kind: 'in-memory', node: node as any });
    expect(cursor.name.$text).toBe('main');
  });

  it('navigates into $children array', () => {
    const node = {
      $type: 1, $source: 2, $named: true,
      $children: [
        { $type: 2, $source: 2, $named: true, $text: 'a' },
        { $type: 2, $source: 2, $named: true, $text: 'b' },
      ],
    };
    const cursor: any = makeCursor({ kind: 'in-memory', node: node as any });
    expect(cursor.$children[1].$text).toBe('b');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/core test query/in-memory-backing
```

Expected: FAIL — `extendPath` for in-memory throws "not yet implemented".

- [ ] **Step 3: Implement `extendPath` for in-memory**

In `cursor.ts`:

```ts
function extendPath<B extends Backing>(state: CursorState<B>, seg: PathSegment): CursorState<B> {
  if (state.kind === 'parsed') {
    return { ...state, path: appendSegment(state.path ?? [], seg) };
  }
  // in-memory: walk into the node immediately.
  const next = walkInMemory(state.node!, seg);
  return { ...state, node: next } as CursorState<B>;
}

function walkInMemory(node: AnyNodeData, seg: PathSegment): AnyNodeData {
  switch (seg.kind) {
    case 'Field': {
      const stored = (node as any)[`_${seg.name}`];
      if (stored === undefined) return undefined as any;  // Maybe<Cursor> case
      return stored;
    }
    case 'Index': {
      const children = ((node as any).$children ?? []) as AnyNodeData[];
      if (seg.index >= children.length) return undefined as any;
      return children[seg.index];
    }
    case 'Children':
      return (node as any).$children ?? [];
    default:
      throw new Error(`walkInMemory: unsupported segment ${seg.kind}`);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/core test query/in-memory-backing
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/query/cursor.ts packages/core/src/query/in-memory-backing.ts packages/core/src/__tests__/query/in-memory-backing.test.ts
git commit -m "feat(@sittir/core): in-memory cursor navigation (Phase 6.2)"
```

#### Task 6.3: In-memory backing — Maybe<Cursor> on absent optionals

**Files:**
- Test: `packages/core/src/__tests__/query/in-memory-backing.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

```ts
describe('Maybe<Cursor> for absent optional', () => {
  it('returns undefined for an absent _<field>', () => {
    const node = { $type: 1, $source: 2, $named: true };  // no _returnType
    const cursor: any = makeCursor({ kind: 'in-memory', node: node as any });
    expect(cursor.returnType).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/core test query/in-memory-backing
```

Expected: FAIL — current `walkInMemory` returns `undefined` for the navigation result, but then `makeCursor` is called on the undefined-extended state — need to short-circuit.

- [ ] **Step 3: Short-circuit on undefined in `extendPath`**

```ts
function extendPath<B extends Backing>(state: CursorState<B>, seg: PathSegment): CursorState<B> | undefined {
  if (state.kind === 'parsed') {
    return { ...state, path: appendSegment(state.path ?? [], seg) };
  }
  const next = walkInMemory(state.node!, seg);
  if (next === undefined) return undefined;
  return { ...state, node: next } as CursorState<B>;
}
```

And in the Proxy `get`:

```ts
const extended = extendPath(target, fieldSegment(key));
if (extended === undefined) return undefined;
return makeCursor(extended);
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/core test query/in-memory-backing
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/query/cursor.ts packages/core/src/__tests__/query/in-memory-backing.test.ts
git commit -m "feat(@sittir/core): Maybe<Cursor> for absent optional fields (Phase 6.3)"
```

#### Task 6.4a (pre-audit): Enumerate factory-output consumers at risk

**Files:**
- Create: `docs/superpowers/plans/2026-05-11-typed-query-api-6.4-audit.md`

Cursor unification on factory output (Task 6.4) wraps every `ir.<kind>.from(...)` return in a Proxy. That breaks several behaviors that depend on plain-object semantics. Audit before changing the emitter:

- [ ] **Step 1: Enumerate at-risk surfaces**

```bash
# Find consumers of factory output that depend on plain-object behavior.
rg -n "JSON\.stringify\(\s*(ir|fn|node|result)" packages/
rg -n "Object\.keys\(\s*(ir|fn|node|result)" packages/
rg -n "new WeakMap.*set\(.*\$with" packages/
rg -n "===\s*(ir\.|fn\.|node\.)" packages/
```

Capture each hit in the audit doc with one of three dispositions:
- *Survives*: reads `_<field>` storage directly — Proxy `get` returns the cursor's underlying state via the proxied function's properties; enumerable storage stays enumerable.
- *Needs adapter*: relies on `JSON.stringify`, `Object.keys`, or reference equality on the factory return.
- *Test-only*: a test asserting plain-object shape — update the test.

- [ ] **Step 2: List the actual at-risk callsites**

Write each into the audit doc:

```markdown
# Cursor Unification (Task 6.4) — Pre-Audit

## At-risk callsites
- `packages/codegen/__tests__/factory-equivalence.test.ts:42` — `JSON.stringify(ir.functionItem.from(...))` — *Needs adapter* (test should compare against `.$read()`)
- `packages/core/src/render.ts:155` — WeakMap keyed by NodeData — *Survives* (render reads `_<field>` from the proxied state)
- ... (continue)

## Disposition table
- N callsites surveyed
- N "survives" — no change needed
- N "needs adapter" — update before Task 6.4 lands
- N "test-only" — fix tests
```

- [ ] **Step 3: Apply fixes to "needs adapter" + "test-only" callsites**

Commit each adapter fix as its own commit; surface the disposition table in the commit body.

- [ ] **Step 4: Commit the audit doc**

```bash
git add docs/superpowers/plans/2026-05-11-typed-query-api-6.4-audit.md
git commit -m "audit: factory-output consumers at risk from cursor unification (Phase 6.4a)"
```

#### Task 6.4: Cursor unification — factory output is also a cursor

**Files:**
- Modify: `packages/codegen/src/emitters/factories.ts` — wrap each factory's return in a cursor Proxy
- Modify: `packages/core/src/query/cursor.ts` — implement `apply` trap for in-memory backing
- Test: `packages/rust/tests/cursor-unification.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/rust/tests/cursor-unification.test.ts
import { describe, expect, it } from 'vitest';
import { ir } from '@sittir/rust';

describe('cursor unification on factory output', () => {
  it('factory output exposes cursor navigation', () => {
    const fn = ir.functionItem.from({
      name: ir.identifier('main'),
      parameters: ir.parameters.strict(),
      body: ir.block.strict(),
    });
    // legacy accessor still works
    expect((fn as any).name().$text).toBe('main');
    // new cursor surface
    expect((fn as any).name.$text).toBe('main');
  });

  it('absent optional fields return undefined via cursor surface', () => {
    const fn = ir.functionItem.from({
      name: ir.identifier('main'),
      parameters: ir.parameters.strict(),
      body: ir.block.strict(),
    });
    expect((fn as any).returnType).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/rust test cursor-unification
```

Expected: FAIL — factory output is plain NodeData, not a cursor.

- [ ] **Step 3: Modify the factory emitter to wrap output in a cursor Proxy**

In `packages/codegen/src/emitters/factories.ts`, after the inline factory body constructs the frozen NodeData, wrap it:

```ts
// emitted factory shape (excerpt)
import { makeCursor, setActiveQueryBacking } from '@sittir/core/query';
import { createInMemoryBacking } from '@sittir/core/query/in-memory-backing';
import { KIND_NAMES } from './types.js';

// One-time registration (module-init):
setActiveQueryBacking(createInMemoryBacking({
  kindNames: KIND_NAMES,
  renderNode: (node) => {/* delegate to render path */},
}));

export const functionItem = {
  // ... existing strict/from methods
  from(config: ...): /* return type */ {
    const data = /* build the frozen NodeData */;
    return makeCursor({ kind: 'in-memory', node: data }) as any;
  },
};
```

**Legacy `fn.name()` callable form (ADR-0018 cursor/value duality):** Task 1.4's `makeCursor` already targets a function (so `apply` fires). Replace the placeholder `applyTerminalPlaceholder` in `cursor.ts` with the in-memory dispatch:

```ts
// packages/core/src/query/cursor.ts (modify applyTerminalPlaceholder)
function applyTerminalPlaceholder(state: CursorState<any>): unknown {
  // ADR-0018 cursor/value duality: calling a cursor resolves to the value.
  // - In-memory: return the underlying NodeData.
  // - Parsed: not callable; the equivalent operation is `.$read()`.
  if (state.kind === 'in-memory') {
    return state.node;
  }
  throw new Error(
    'parsed cursors are not callable; use `.$read()` to materialize the underlying NodeData'
  );
}
```

Then rename the function to `applyTerminal` (no longer a placeholder). Pre-Task-6.4a audit (above) catches any consumer regressions from this change.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/rust run regenerate
pnpm --filter @sittir/rust test cursor-unification
pnpm --filter @sittir/rust test       # full suite — catch regressions
```

Expected: PASS for the new test; existing tests may need small adaptations.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/emitters/factories.ts packages/core/src/query/cursor.ts packages/rust/src/factories.ts packages/rust/tests/cursor-unification.test.ts
git commit -m "feat(codegen): cursor unification on factory output (Phase 6.4)"
```

#### Task 6.5: `wrap()` returns a cursor over a parsed NodeData

**Files:**
- Modify: `packages/codegen/src/emitters/wrap.ts` — wrap result in cursor Proxy
- Test: `packages/rust/tests/wrap-cursor.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

```ts
describe('wrap() returns a cursor', () => {
  it('wrapped node exposes cursor navigation', () => {
    const engine = createEngine();
    const { tree, root } = engine.reader!.parseAndRead('fn main() {}');
    const fn = (root.$children as any[])[0];
    const wrapped: any = wrap(fn, tree);
    expect(wrapped.name.$text).toBe('main');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Modify the wrap emitter to return a cursor**

In the wrap emitter, the final return wraps the typed-accessor result in `makeCursor({ kind: 'in-memory', node: typedResult })`.

- [ ] **Step 4: Regenerate; run tests**

```bash
pnpm --filter @sittir/rust run regenerate
pnpm --filter @sittir/rust test wrap-cursor
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/emitters/wrap.ts packages/rust/src/wrap.ts packages/rust/tests/wrap-cursor.test.ts
git commit -m "feat(codegen): wrap() returns cursor surface (Phase 6.5)"
```

#### Task 6.6: `$nodeHandle` auto-drill on materialization terminals

**Files:**
- Modify: `packages/core/src/query/in-memory-backing.ts` — detect stubs; drill via engine reader
- Test: `packages/core/src/__tests__/query/in-memory-backing.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

```ts
describe('$nodeHandle auto-drill on .$read() / .$render()', () => {
  it('navigating through a stub does not drill', () => {
    const node = {
      $type: 1, $source: 2, $named: true,
      _name: { $nodeHandle: 99, $childIndex: 0 },  // stubbed
    };
    const drilled = vi.fn(() => ({ $type: 2, $source: 0, $named: true, $text: 'real' }));
    const backing = createInMemoryBacking({
      drillIn: drilled,
    });
    setActiveQueryBacking(backing);
    const cursor: any = makeCursor({ kind: 'in-memory', node: node as any });
    // navigation does NOT drill
    const nameCursor = cursor.name;
    expect(drilled).not.toHaveBeenCalled();
    // .$read() materializes (drills) once
    const data = nameCursor.$read();
    expect(drilled).toHaveBeenCalledTimes(1);
    expect(data.$text).toBe('real');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/core test query/in-memory-backing
```

Expected: FAIL.

- [ ] **Step 3: Implement auto-drill in `resolveTerminal Read`**

```ts
// packages/core/src/query/in-memory-backing.ts (modify)
const drillCache = new WeakMap<object, AnyNodeData>();

export interface InMemoryBackingOptions {
  kindNames?: ReadonlyMap<number, string>;
  renderNode?: (node: AnyNodeData) => string;
  drillIn?: (handle: number, childIndex: number) => AnyNodeData;
}

// in resolveTerminal:
case 'Read':
case 'Render': {
  const materialized = materialize(node, opts.drillIn);
  if (terminal === 'Read') return materialized;
  if (!opts.renderNode) throw new QueryBackendError('in-memory', new Error('renderNode required'));
  return opts.renderNode(materialized);
}

function materialize(node: AnyNodeData, drillIn?: (h: number, i: number) => AnyNodeData): AnyNodeData {
  if (!isStub(node)) return node;
  const cached = drillCache.get(node as object);
  if (cached) return cached;
  if (!drillIn) throw new Error('cannot drill stubbed NodeData without drillIn');
  const drilled = drillIn((node as any).$nodeHandle, (node as any).$childIndex);
  drillCache.set(node as object, drilled);
  return drilled;
}

function isStub(node: AnyNodeData): boolean {
  return node !== null && typeof node === 'object' && '$nodeHandle' in (node as any);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/core test query/in-memory-backing
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/query/in-memory-backing.ts packages/core/src/__tests__/query/in-memory-backing.test.ts
git commit -m "feat(@sittir/core): $nodeHandle auto-drill on materialization (Phase 6.6)"
```

#### Task 6.7: `cursor.equals(other)` structural equality

**Files:**
- Modify: `packages/core/src/query/cursor.ts` — add `equals` to the Proxy surface
- Test: `packages/core/src/__tests__/query/cursor.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

```ts
describe('cursor.equals', () => {
  it('two cursors at the same in-memory node are equal', () => {
    const node = { $type: 1, $source: 2, $named: true };
    const a: any = makeCursor({ kind: 'in-memory', node: node as any });
    const b: any = makeCursor({ kind: 'in-memory', node: node as any });
    expect(a.equals(b)).toBe(true);
    expect(a === b).toBe(false);
  });

  it('cursors over different nodes are not equal', () => {
    const a: any = makeCursor({ kind: 'in-memory', node: { $type: 1 } as any });
    const b: any = makeCursor({ kind: 'in-memory', node: { $type: 2 } as any });
    expect(a.equals(b)).toBe(false);
  });

  it('two parsed cursors at the same path are equal', () => {
    const stateBase = { kind: 'parsed' as const, tree: { grammar: 'rust' } as any, nodeId: 0n };
    const a: any = makeCursor({ ...stateBase, path: [{ kind: 'Field', name: 'name' }] });
    const b: any = makeCursor({ ...stateBase, path: [{ kind: 'Field', name: 'name' }] });
    expect(a.equals(b)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/core test query/cursor
```

Expected: FAIL.

- [ ] **Step 3: Add `equals` to Proxy `get`**

```ts
if (key === 'equals') {
  return (other: any) => structurallyEqual(target, other?.[CURSOR_STATE_SYMBOL] ?? other);
}

function structurallyEqual(a: CursorState<any>, b: CursorState<any> | undefined): boolean {
  if (!b) return false;
  if (a.kind !== b.kind) return false;
  if (a.kind === 'in-memory') return a.node === b.node;
  // parsed: same tree + nodeId + path
  return (
    a.tree === b.tree &&
    a.nodeId === b.nodeId &&
    samePathSegments(a.path ?? [], b.path ?? [])
  );
}

function samePathSegments(a: readonly PathSegment[], b: readonly PathSegment[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) return false;
  }
  return true;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/core test query/cursor
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/query/cursor.ts packages/core/src/__tests__/query/cursor.test.ts
git commit -m "feat(@sittir/core): cursor.equals structural equality (Phase 6.7)"
```

---

### Phase 7 — WASM backing + `prepareQueryBackend` + parity corpus + CI gate

#### Task 7.1: `prepareQueryBackend` async warmup

**Files:**
- Create: `packages/core/src/query/prepare.ts`
- Test: `packages/core/src/__tests__/query/prepare.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/__tests__/query/prepare.test.ts
import { describe, expect, it } from 'vitest';
import { prepareQueryBackend, _resetQueryBackendState, _isPrepared } from '../../query/prepare.ts';

describe('prepareQueryBackend', () => {
  it('is idempotent per grammar', async () => {
    _resetQueryBackendState();
    expect(_isPrepared('rust')).toBe(false);
    await prepareQueryBackend({ grammar: 'rust' });
    expect(_isPrepared('rust')).toBe(true);
    await prepareQueryBackend({ grammar: 'rust' });  // no-op
    expect(_isPrepared('rust')).toBe(true);
  });

  it('different grammars are independent', async () => {
    _resetQueryBackendState();
    await prepareQueryBackend({ grammar: 'rust' });
    expect(_isPrepared('rust')).toBe(true);
    expect(_isPrepared('typescript')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/core test query/prepare
```

Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/query/prepare.ts
//
// @ast-grep/wasm v0.42 API surface (verified from the package's index.d.ts):
//   - `initialize()` — global wasm init; idempotent.
//   - `parseFiles({ ... })` and node access via AstGrepNode — sync after init.
//   - Language registration is per-language; languages ship as separate modules
//     (e.g., `@ast-grep/wasm-lang-rust`) that register on import.
//
// Adjust import names to whatever the installed v0.42 actually exports
// (verify via `cat node_modules/@ast-grep/wasm/dist/index.d.ts`).
import { initialize } from '@ast-grep/wasm';
import { prepareTsTemplateBackend, _getTemplateLanguage } from '@sittir/core';

const state = {
  initialized: false,
  initPromise: null as Promise<void> | null,
  grammars: new Set<string>(),
};

const wasmLanguages = new Map<string, unknown>();

export async function prepareQueryBackend(opts: { grammar: string }): Promise<void> {
  if (!state.initialized) {
    state.initPromise ??= initialize();
    await state.initPromise;
    state.initialized = true;
  }
  if (state.grammars.has(opts.grammar)) return;

  // Load the ast-grep wasm language for this grammar.
  const lang = await loadAstGrepWasmLang(opts.grammar);
  wasmLanguages.set(opts.grammar, lang);

  // Also warm up the template-mode parser language for slot extraction
  // (used by .pattern() with typed bindings — see Task 5.3). This piggybacks
  // on the construction-templates plan's prepareTsTemplateBackend.
  await prepareTsTemplateBackend({ grammar: opts.grammar });

  state.grammars.add(opts.grammar);
}

async function loadAstGrepWasmLang(grammar: string): Promise<unknown> {
  // Per @ast-grep/wasm v0.42, languages ship as separate packages.
  // Dynamic import keeps each language opt-in.
  switch (grammar) {
    case 'rust':       return (await import('@ast-grep/wasm-lang-rust')).default;
    case 'typescript': return (await import('@ast-grep/wasm-lang-typescript')).default;
    case 'python':     return (await import('@ast-grep/wasm-lang-python')).default;
    default: throw new Error(`unsupported grammar for WASM backing: ${grammar}`);
  }
}

export function _getWasmLanguage(grammar: string): unknown | undefined {
  return wasmLanguages.get(grammar);
}

export function _isPrepared(grammar: string): boolean {
  return state.grammars.has(grammar);
}

/** Test-only: reset all module-global state. Used by the parity harness
 *  to switch between native and wasm backends within a single test run. */
export function _resetQueryBackendState(): void {
  state.initialized = false;
  state.initPromise = null;
  state.grammars.clear();
  wasmLanguages.clear();
}
```

**Note on actual `@ast-grep/wasm` API:** the executor verifies the exact export names via `cat node_modules/@ast-grep/wasm/dist/index.d.ts` before this task lands. The shape above (`initialize()` global + per-language packages) is the v0.42 convention but the executor must confirm and adjust. Language packages may also ship inline (single combined wasm) rather than per-grammar — confirm at execution.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/core test query/prepare
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/query/prepare.ts packages/core/src/__tests__/query/prepare.test.ts
git commit -m "feat(@sittir/core): prepareQueryBackend async warmup (Phase 7.1)"
```

#### Task 7.2: WASM backing — terminal resolution

**Files:**
- Create: `packages/core/src/query/wasm-backing.ts`
- Test: `packages/core/src/__tests__/query/wasm-backing.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/__tests__/query/wasm-backing.test.ts
import { describe, expect, it } from 'vitest';
import { createWasmBacking } from '../../query/wasm-backing.ts';
import { prepareQueryBackend, _resetQueryBackendState } from '../../query/prepare.ts';

describe('createWasmBacking', () => {
  it('throws BackendNotReady if prepareQueryBackend was not called', () => {
    _resetQueryBackendState();
    const backing = createWasmBacking();
    expect(() =>
      backing.resolveTerminal(
        { kind: 'parsed', tree: { grammar: 'rust', wasmTree: {} } as any, nodeId: 0n, path: [] },
        'Text',
      )
    ).toThrow(/prepareQueryBackend.*rust/);
  });

  it('resolves Text terminal after warmup', async () => {
    _resetQueryBackendState();
    await prepareQueryBackend({ grammar: 'rust' });
    const backing = createWasmBacking();
    // simulate a parsed tree shape from @ast-grep/wasm
    const wasmTree = /* mock */;
    const result = backing.resolveTerminal(
      { kind: 'parsed', tree: { grammar: 'rust', wasmTree } as any, nodeId: 0n, path: [] },
      'Length',
    );
    expect(typeof result).toBe('number');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
pnpm --filter @sittir/core test query/wasm-backing
```

Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/query/wasm-backing.ts
import { _isPrepared } from './prepare.ts';
import type { CursorState } from './cursor.ts';
import type { QueryBacking } from './native-backing.ts';
import type { PathSegment } from './path.ts';
import type { TerminalKind } from './terminals.ts';
import { BackendNotReady, QueryBackendError } from './errors.ts';

export function createWasmBacking(): QueryBacking {
  return {
    resolveTerminal(state, terminal) {
      const grammar = state.tree?.grammar;
      if (!grammar) throw new QueryBackendError('wasm', new Error('state has no grammar'));
      if (!_isPrepared(grammar)) throw new BackendNotReady(grammar);
      const tree = (state.tree as any).wasmTree;
      if (!tree) throw new QueryBackendError('wasm', new Error('state.tree.wasmTree is missing'));

      const startNode = tree.rootNode;  // ast-grep wasm: tree.rootNode is the root SgNode
      const nodes = walkWasm(startNode, state.path ?? []);
      return resolveTerminalWasm(nodes, terminal);
    },
  };
}

function walkWasm(root: any, path: readonly PathSegment[]): any[] {
  let current: any[] = [root];
  for (const seg of path) {
    current = stepWasm(current, seg);
  }
  return current;
}

function stepWasm(nodes: any[], seg: PathSegment): any[] {
  switch (seg.kind) {
    case 'Field':      return nodes.map(n => n.field(seg.name)).filter(Boolean);
    case 'Index':      return nodes.map(n => n.children().nth(seg.index)).filter(Boolean);
    case 'Children':   return nodes.flatMap(n => n.children());
    case 'Find':       return nodes.flatMap(n => n.findAll({ kind: seg.targetKind }));
    case 'Pattern':    return nodes.flatMap(n => n.findAll(seg.pattern));
    case 'FilterKind': return nodes.filter(n => n.kind() === seg.targetKind);
    default:
      throw new QueryBackendError('wasm', new Error(`unknown segment kind: ${(seg as any).kind}`));
  }
}

function resolveTerminalWasm(nodes: any[], terminal: TerminalKind): unknown {
  switch (terminal) {
    case 'Text':   return nodes[0]?.text() ?? '';
    case 'Type':   return nodes[0]?.kind() ?? '';
    case 'Length': return nodes.length;
    case 'Read':   return nodes[0] ? readNodeFromWasm(nodes[0]) : undefined;
    case 'Render': throw new Error('WASM backing does not yet support Render terminal');
  }
}

function readNodeFromWasm(node: any, grammar: string): unknown {
  // Adapter: walk an ast-grep wasm node tree and produce the same NodeData
  // shape `@sittir/common`'s readNode produces for native parse trees.
  // The two algorithms must agree byte-for-byte to satisfy the parity contract
  // (§7 in the design doc); we reuse the existing TreeHandle abstraction by
  // adapting the ast-grep wasm Node API to look like web-tree-sitter.
  return adaptWasmNode(node, grammar);
}

/** Inverse of KIND_NAMES, populated lazily per grammar. */
const kindIdByName = new Map<string, Map<string, number>>();

function lookupKindId(grammar: string, kindName: string): number {
  let map = kindIdByName.get(grammar);
  if (!map) {
    // Lazy import to avoid circular dep at module load; reuse KIND_NAMES
    // from the per-grammar package.
    const kindNames: ReadonlyMap<number, string> =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      (require(`@sittir/${grammar}`) as any).KIND_NAMES;
    map = new Map();
    for (const [id, name] of kindNames) map.set(name, id);
    kindIdByName.set(grammar, map);
  }
  const id = map.get(kindName);
  if (id === undefined) {
    throw new Error(`unknown kind '${kindName}' for grammar '${grammar}'`);
  }
  return id;
}

function adaptWasmNode(node: any, grammar: string): unknown {
  const named = node.children().filter((c: any) => c.isNamed());
  return Object.freeze({
    $type:     lookupKindId(grammar, node.kind()),
    $source:   0,         // 0 = ts-side parse-tree origin
    $named:    true,
    $text:     node.text(),
    $children: Object.freeze(named.map((c: any) => adaptWasmNode(c, grammar))),
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/core test query/wasm-backing
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/query/wasm-backing.ts packages/core/src/__tests__/query/wasm-backing.test.ts
git commit -m "feat(@sittir/core): WASM query backing (Phase 7.2)"
```

#### Task 7.3: Parity fixture corpus — 10 fixtures

**Files:**
- Create: `packages/codegen/__tests__/query-parity/fixtures/001-trivial-field-access/run.ts`
- Create: ... 9 more

- [ ] **Step 1: Author each fixture** (10 total per design §7.1)

Each fixture exports a `runWith({ backend })` function that exercises the cursor surface and returns a JSON-stringifiable value:

```ts
// fixtures/001-trivial-field-access/run.ts
import { query, prepareQueryBackend, createEngine } from '@sittir/rust';
import { setActiveQueryBacking, _resetQueryBackendState } from '@sittir/core/query';
import { createNativeBacking } from '@sittir/core/query/native-backing';
import { createWasmBacking }   from '@sittir/core/query/wasm-backing';

export async function runWith({ backend }: { backend: 'native' | 'wasm' }): Promise<unknown> {
  // Module-global reset: the cached engine + active backing carry over from
  // any previous run. Without this reset, fixture #2's wasm pass would silently
  // run against the native backing left registered by fixture #1.
  _resetQueryBackendState();
  process.env.SITTIR_BACKEND = backend;
  // Force createEngine to re-resolve the backing.
  (createEngine as any)._cachedEngine = undefined;
  if (backend === 'wasm') {
    await prepareQueryBackend({ grammar: 'rust' });
    setActiveQueryBacking(createWasmBacking());
  } else {
    setActiveQueryBacking(createNativeBacking());
  }
  return query<string>('fn main() {}', (q: any) => q[0].name.$text);
}
```

**Required helpers (export from `@sittir/core/query/index.ts`):** `setActiveQueryBacking` (already exported per Task 2.7), `_resetQueryBackendState` (already exported per Task 7.1's revised body). The per-grammar engine's `createEngine` is sync and doesn't currently cache; the `_cachedEngine` line is a placeholder hook in case Phase 8 introduces caching. If `createEngine` truly has no per-call state, drop that line.

Repeat for fixtures 002–010 per the categories in design §7.1:
- 002-recursive-find
- 003-pattern-untyped
- 004-pattern-typed-bindings
- 005-filter-immediate-children
- 006-optional-field-undefined
- 007-deep-nested-path
- 008-maybe-cursor-chain
- 009-nodehandle-auto-drill
- 010-compose-with-snippet

- [ ] **Step 2: Commit**

```bash
git add packages/codegen/__tests__/query-parity/fixtures/
git commit -m "test(codegen): query parity fixture corpus (Phase 7.3)"
```

#### Task 7.4: Parity harness + parity test

**Files:**
- Create: `packages/codegen/__tests__/query-parity/harness.ts`
- Create: `packages/codegen/__tests__/query-parity/parity.test.ts`

- [ ] **Step 1: Write the harness**

```ts
// packages/codegen/__tests__/query-parity/harness.ts
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

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

```ts
// packages/codegen/__tests__/query-parity/parity.test.ts
import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { runParityFixture } from './harness.ts';

const fixtures = readdirSync(join(__dirname, 'fixtures'));

describe('query parity (native vs wasm)', () => {
  for (const name of fixtures) {
    it(`fixture ${name}`, async () => {
      const result = await runParityFixture(name);
      expect(result.nativeOutput).toEqual(result.wasmOutput);
    });
  }
});
```

- [ ] **Step 2: Run; fix divergences as they surface**

```bash
pnpm --filter @sittir/codegen test query-parity
```

Iterate until green.

- [ ] **Step 3: Commit**

```bash
git add packages/codegen/__tests__/query-parity/harness.ts packages/codegen/__tests__/query-parity/parity.test.ts
git commit -m "test(codegen): query parity harness + all 10 fixtures green (Phase 7.4)"
```

#### Task 7.5: Phase 5's deferred tests now light up

**Files:**
- Modify: `packages/rust/tests/query-pattern.test.ts` (remove `.todo`)
- Modify: `packages/rust/tests/query-snippet-compose.test.ts` (remove `.todo`)

- [ ] **Step 1: Convert `it.todo` to `it` + run**

```bash
pnpm --filter @sittir/rust test query-pattern query-snippet-compose
```

Expected: PASS — Phases 5–7 wired together.

- [ ] **Step 2: Commit**

```bash
git add packages/rust/tests/query-pattern.test.ts packages/rust/tests/query-snippet-compose.test.ts
git commit -m "test(rust): typed pattern + snippet composition end-to-end (Phase 7.5)"
```

#### Task 7.6: CI gate for query-parity suite

**Files:**
- Modify: `package.json` — add `test:query-parity` script
- Modify: `.github/workflows/test.yml` — extend `template-parity` job to also run query parity

- [ ] **Step 1: Add script**

```json
"scripts": {
  "test:parity":        "vitest run packages/codegen/__tests__/template-parity/",
  "test:query-parity":  "vitest run packages/codegen/__tests__/query-parity/"
}
```

- [ ] **Step 2: Extend CI workflow**

```yaml
# .github/workflows/test.yml
template-parity:
  if: |
    contains(toJSON(github.event.pull_request.changed_files), 'template') ||
    contains(toJSON(github.event.pull_request.changed_files), 'query')
  # ... existing steps
  steps:
    - run: pnpm run test:parity
    - run: pnpm run test:query-parity   # NEW
```

- [ ] **Step 3: Commit**

```bash
git add package.json .github/workflows/test.yml
git commit -m "ci: query parity suite gated on PRs touching query/ (Phase 7.6)"
```

#### Task 7.7: Cursor unification overhead microbenchmark

**Files:**
- Create: `packages/codegen/__tests__/bench/cursor-overhead.bench.ts`

- [ ] **Step 1: Author benchmark**

```ts
// packages/codegen/__tests__/bench/cursor-overhead.bench.ts
import { bench, describe } from 'vitest';
import { ir } from '@sittir/rust';

describe('cursor unification overhead', () => {
  bench('factory output property access (cursor surface)', () => {
    const fn = ir.functionItem.from({
      name: ir.identifier('main'),
      parameters: ir.parameters.strict(),
      body: ir.block.strict(),
    });
    void (fn as any).name.$text;
  });
});
```

- [ ] **Step 2: Run baseline + assess overhead**

```bash
pnpm --filter @sittir/codegen run bench
```

Document the absolute and relative cost in the bench output.

- [ ] **Step 3: Commit**

```bash
git add packages/codegen/__tests__/bench/cursor-overhead.bench.ts
git commit -m "bench: cursor unification overhead baseline (Phase 7.7)"
```

#### Task 7.8: Documentation update — design doc cross-references

**Files:**
- Modify: `docs/superpowers/specs/2026-05-11-typed-query-api-design.md` — link to actual paths

- [ ] **Step 1: Update §7 Parity contract** with concrete CI gate paths

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-05-11-typed-query-api-design.md
git commit -m "docs(design): cross-link parity gates to CI paths (Phase 7.8)"
```

#### Task 7.9: `engine` exposes `resolvePath` for native + delegates to WASM

**Files:**
- Modify: `packages/rust/src/engine.ts` — register query backing per-engine

- [ ] **Step 1: Update `createEngine` to register query backing**

```ts
import { setActiveQueryBacking } from '@sittir/core/query';
import { createNativeBacking } from '@sittir/core/query/native-backing';
import { createWasmBacking } from '@sittir/core/query/wasm-backing';
import { createInMemoryBacking } from '@sittir/core/query/in-memory-backing';

export function createEngine(options?: EngineOptions): SittirEngineLike {
  const engine = createNativeEngine(...) ?? createJsEngine(...);
  // Query backing selection
  if ('resolvePath' in engine && process.env.SITTIR_BACKEND !== 'wasm') {
    setActiveQueryBacking(createNativeBacking());
  } else {
    setActiveQueryBacking(createWasmBacking());
    // Caller must await prepareQueryBackend({ grammar: 'rust' }) before sync use
  }
  // Always register in-memory backing for factory-output cursors —
  // distinct because state.kind === 'in-memory' is the dispatch signal.
  // (Native/WASM backings short-circuit on state.kind !== 'parsed'.)
  return engine;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/rust/src/engine.ts
git commit -m "feat(rust): engine registers native+wasm+in-memory query backings (Phase 7.9)"
```

#### Task 7.10: Validator baseline check

**Files:**
- Run: validator

- [ ] **Step 1: Run baseline**

```bash
pnpm run validate:all
```

Expected: PASS at the same baseline as before Chunk 3 started.

- [ ] **Step 2: Commit (empty marker)**

```bash
git commit --allow-empty -m "checkpoint: Phase 7 complete; validator baseline preserved (Phase 7.10)"
```

---

**End of Chunk 3.** Rust grammar fully wired: native + WASM + in-memory backings, parity green, typed pattern bindings working, composition with construction templates green.

---

## Chunk 4: Phase 8 — Roll out to TypeScript and Python

Each grammar follows the same four-task pattern: regen, add query napi, register backings, add fixtures.

### Phase 8 — TypeScript rollout

#### Task 8.1: `sittir-typescript` adds `resolvePath` napi

**Files:**
- Create: `rust/crates/sittir-typescript/src/query_napi.rs`
- Modify: `rust/crates/sittir-typescript/src/lib.rs`
- Test: `packages/typescript/tests/query-napi.test.ts`

- [ ] **Step 1: Copy Task 2.5's napi entry body, target the TypeScript engine**

The body is byte-identical to Task 2.5 except for the `impl` block target. Specifically:

```rust
// rust/crates/sittir-typescript/src/query_napi.rs
use napi::{Env, JsObject, JsUnknown, Result as NapiResult};
use napi_derive::napi;
use serde::Deserialize;
use sittir_core::node_data::NodeData;
use sittir_core::query::{
    PathSegment, Terminal, ResolvedTerminal, resolve_path_with_render,
};

fn parse_terminal(s: &str) -> NapiResult<Terminal> {
    match s {
        "Text"   => Ok(Terminal::Text),
        "Type"   => Ok(Terminal::Type),
        "Length" => Ok(Terminal::Length),
        "Read"   => Ok(Terminal::Read),
        "Render" => Ok(Terminal::Render),
        other    => Err(napi::Error::from_reason(format!("unknown terminal: {}", other))),
    }
}

#[napi]
impl crate::SittirTypescriptEngine {
    #[napi]
    pub fn resolve_path(
        &mut self,
        env: Env,
        node_id: u32,
        path: Vec<JsObject>,
        terminal: String,
    ) -> NapiResult<JsUnknown> {
        let term = parse_terminal(&terminal)?;
        let segments = path
            .into_iter()
            .map(|obj| {
                let raw = env.serialize_value(&obj)?;
                serde_json::from_value::<PathSegment>(raw)
                    .map_err(|e| napi::Error::from_reason(format!("bad PathSegment: {}", e)))
            })
            .collect::<NapiResult<Vec<_>>>()?;
        let root_node = self.engine.root_sg_node(node_id as u64)
            .ok_or_else(|| napi::Error::from_reason(format!("no node for id {}", node_id)))?;
        let render = |node: &NodeData| self.engine.render_node_data(node);
        let resolved = resolve_path_with_render(&root_node, &segments, term, render)
            .map_err(|e| napi::Error::from_reason(format!("{}", e)))?;
        match resolved {
            ResolvedTerminal::Text(s)   => env.create_string(&s).map(|v| v.into_unknown()),
            ResolvedTerminal::Type(s)   => env.create_string(&s).map(|v| v.into_unknown()),
            ResolvedTerminal::Length(n) => env.create_uint32(n as u32).map(|v| v.into_unknown()),
            ResolvedTerminal::Read(nd)  => nd.to_napi_object(env).map(|v| v.into_unknown()),
            ResolvedTerminal::Render(s) => env.create_string(&s).map(|v| v.into_unknown()),
        }
    }
}
```

Add `mod query_napi;` to `rust/crates/sittir-typescript/src/lib.rs`.

- [ ] **Step 2: Test + commit**

```bash
pnpm --filter @sittir/typescript run regenerate
pnpm --filter @sittir/typescript test query-napi
git add rust/crates/sittir-typescript/ packages/typescript/tests/query-napi.test.ts
git commit -m "feat(sittir-typescript): resolvePath napi (Phase 8.1)"
```

#### Task 8.2: Regenerate TS grammar with Cursor types + query entry

**Files:**
- Modify: per-grammar generated `types.ts`, `query.ts`, `wrap.ts`, `factories.ts` (all regenerated)

- [ ] **Step 1: Regenerate**

```bash
pnpm --filter @sittir/typescript run regenerate
pnpm --filter @sittir/typescript run type-check
```

Expected: PASS.

- [ ] **Step 2: Commit**

```bash
git add packages/typescript/src/
git commit -m "feat(typescript): regenerated with cursor surface (Phase 8.2)"
```

#### Task 8.3: TS engine registers query backings

**Files:**
- Modify: `packages/typescript/src/engine.ts` (mirror Task 7.9)

- [ ] **Step 1: Apply Task 7.9's engine wiring with `grammar: 'typescript'`**

```ts
// packages/typescript/src/engine.ts (extend createEngine)
import { setActiveQueryBacking } from '@sittir/core/query';
import { createNativeBacking } from '@sittir/core/query/native-backing';
import { createWasmBacking }   from '@sittir/core/query/wasm-backing';
import { createInMemoryBacking } from '@sittir/core/query/in-memory-backing';

export function createEngine(options?: EngineOptions): SittirEngineLike {
  const engine = createNativeEngine(...) ?? createJsEngine(...);
  if ('resolvePath' in engine && process.env.SITTIR_BACKEND !== 'wasm') {
    setActiveQueryBacking(createNativeBacking());
  } else {
    setActiveQueryBacking(createWasmBacking());
    // Consumers must `await prepareQueryBackend({ grammar: 'typescript' })`
    // before sync use.
  }
  return engine;
}
```

- [ ] **Step 2: Test + commit**

```bash
pnpm --filter @sittir/typescript test
git add packages/typescript/src/engine.ts
git commit -m "feat(typescript): engine registers query backings (Phase 8.3)"
```

#### Task 8.4: TS parity fixtures

**Files:**
- Create: `packages/codegen/__tests__/query-parity/fixtures/ts-001-*` through `ts-005-*` (5 representative)

- [ ] **Step 1: Author 5 representative TS fixtures**

Each fixture follows the Phase 7.3 template (`run.ts` with `runWith({backend})` exporting a deterministic result):

| Fixture                                        | What it exercises                                                            |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| `ts-001-function-declaration-name`             | `q.find.functionDeclaration()[0].name.$text` — basic field access            |
| `ts-002-class-member-access`                   | `q.find.classDeclaration()[0].members.find.methodDefinition()` — nested find |
| `ts-003-generic-type-arguments`                | `q.find.pattern('Promise<$T>')` — pattern with single binding                |
| `ts-004-optional-property-undefined`           | `q.find.propertySignature()[0]?.typeAnnotation?.$text` — Maybe<Cursor> chain |
| `ts-005-import-clause-mixed`                   | Pattern with multi-slot `import { $...NAMES } from $SRC` — multi-binding     |

Each fixture's `run.ts` mirrors the Phase 7.3 fixture-001 template literally; only the query body and source differ.

- [ ] **Step 2: Run + commit**

```bash
pnpm run test:query-parity
git add packages/codegen/__tests__/query-parity/fixtures/ts-*
git commit -m "test(codegen): TS query parity fixtures (Phase 8.4)"
```

### Phase 8 — Python rollout

#### Task 8.5: `sittir-python` adds `resolvePath` napi

**Files:**
- Create: `rust/crates/sittir-python/src/query_napi.rs`
- Modify: `rust/crates/sittir-python/src/lib.rs`
- Test: `packages/python/tests/query-napi.test.ts`

- [ ] **Step 1: Copy Task 8.1's `query_napi.rs` body; change the impl target**

The body is byte-identical to Task 8.1 except the `impl` block targets `crate::SittirPythonEngine`. Add `mod query_napi;` to `rust/crates/sittir-python/src/lib.rs`.

- [ ] **Step 2: Test + commit**

```bash
pnpm --filter @sittir/python run regenerate
pnpm --filter @sittir/python test query-napi
git add rust/crates/sittir-python/ packages/python/tests/query-napi.test.ts
git commit -m "feat(sittir-python): resolvePath napi (Phase 8.5)"
```

#### Task 8.6: Regenerate Python grammar

- [ ] **Regenerate; type-check; commit**

```bash
pnpm --filter @sittir/python run regenerate
pnpm --filter @sittir/python run type-check
git add packages/python/src/
git commit -m "feat(python): regenerated with cursor surface (Phase 8.6)"
```

#### Task 8.7: Python engine registers query backings

- [ ] **Step 1: Apply Task 8.3's engine wiring with `grammar: 'python'`**

```ts
// packages/python/src/engine.ts — identical to Task 8.3 with grammar='python'
```

- [ ] **Step 2: Test + commit**

```bash
pnpm --filter @sittir/python test
git add packages/python/src/engine.ts
git commit -m "feat(python): engine registers query backings (Phase 8.7)"
```

#### Task 8.8: Python parity fixtures + final full-suite green

**Files:**
- Create: `packages/codegen/__tests__/query-parity/fixtures/py-001-*` through `py-005-*`

- [ ] **Step 1: Author 5 representative Python fixtures**

| Fixture                                | What it exercises                                                          |
| -------------------------------------- | -------------------------------------------------------------------------- |
| `py-001-function-def-name`             | `q.find.functionDefinition()[0].name.$text` — basic field access           |
| `py-002-class-method-access`           | `q.find.classDefinition()[0].body.find.functionDefinition()` — nested find |
| `py-003-decorator-pattern`             | `q.find.pattern('@$DECORATOR\ndef $NAME(): $...BODY')` — multi-line pattern |
| `py-004-optional-return-type-undefined`| Function without return annotation → `?.returnType` undefined              |
| `py-005-import-from-multi`             | Pattern `from $MODULE import $...NAMES` — multi-slot binding               |

Each fixture mirrors the Phase 7.3 / 8.4 template; only the source and query differ.

- [ ] **Step 2: Run full parity suite**

```bash
pnpm run test:query-parity
pnpm run test:parity
pnpm run validate:all
```

Expected: all three pass.

- [ ] **Step 3: Commit**

```bash
git add packages/codegen/__tests__/query-parity/fixtures/py-*
git commit -m "test(codegen): Python query parity + full suite green (Phase 8.8)"
```

---

## Completion checklist

When all 8 phases land:

- [ ] `pnpm test` green across all packages
- [ ] `pnpm -r run type-check` green
- [ ] `pnpm run test:parity` green (construction templates)
- [ ] `pnpm run test:query-parity` green (typed query)
- [ ] `pnpm run validate:all` at baseline
- [ ] One snippet per grammar renders byte-identical (verified by Phase 7.5's composition tests)
- [ ] `query(src, q => …)` works for all 3 grammars (verified by Phase 8.4 / 8.8 fixtures)
- [ ] CI gates both parity suites on PRs touching `template/` or `query/`
- [ ] Typed pattern bindings narrow correctly under explicit type parameter (verified by type-level tests)
- [ ] `cursor.equals(other)` distinct-objects + structural-equality contract holds (verified by Phase 6.7 + parity)

## Out of scope reminders (per design §10)

This plan does not include:

- Pattern *construction*. Construction templates' job per ADR-0022.
- Mutation through cursors. Cursors read; `$with` mutates.
- Reactive / live-update cursors.
- A higher-level compositional query language.
- Cursor `===` identity (distinct objects; `equals` for structural).
- Enumeration / `Object.keys` semantics on cursors (left as-is per the design's §10 note).

If pressure mounts to add any of the above mid-implementation, treat it as a new spec, not a scope expansion of this plan.
