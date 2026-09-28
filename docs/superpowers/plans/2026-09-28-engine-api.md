# The Language Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every grammar package's side-by-side exports with one entry point, `await createEngine(language, options)`, plus `createProject(directory | null)` for staged multi-file work. Every node is bound to the engine that built or read it.

**Architecture:** Each grammar package's default export becomes a light descriptor whose `load()` imports a generated `api.ts` holding the builder table, guards, kind ids, reader and native hooks. `@sittir/common` assembles an engine from those hooks. Nodes are stamped with their engine through the existing `withMethods(node, engine)` seam: the process-wide `methodsEngine` is replaced by an ambient engine set around every builder, reader and `$with` call. File verbs return `Pending` changes (thenable and `AsyncDisposable`) that commit through one atomic writer, and a project stages them and commits all or none.

**Tech Stack:** TypeScript (ESM, `.ts` imports), vitest, `@sittir/codegen` emitters, `@sittir/common` runtime, napi native engines (unchanged).

**Spec:** `docs/superpowers/specs/2026-09-28-engine-api-design.md` (issue #388). Read it before any task.

## Global Constraints

- Branches: the five stacked PR branches below, starting from `feat/leaf-literal-types` (#379), which carries the indent-unit typing this plan moves into `API['options']`. Rebase onto master once #379 merges.
- Worktree under `~/GitHub.nosync/refactory-lang/sittir-worktrees/`, never `/tmp`.
- Generated outputs (`packages/{rust,python,typescript,scm,regex}/src/*`, `.sittir/*`, `rust/crates/sittir-*/src/*`) are never hand-edited: change the emitter and regenerate (`pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src`, or `pnpm run validate:native`, which regenerates all).
- No comments in `packages/codegen/src/`: every new declaration gets a `###` entry in the matching `docs/glossary/` file. No planning or task numbers in comments or glossary text.
- DRY: `createEngine` and `createProject` share one file-commit path; the kind map feeding `engine.types` and the static type exports is one emitted map.
- Clean break: the old exports (`ir`, `is`, `render`, `toEdit`, `applyEdits`, per-grammar `createEngine`, `readTreeNode`, `wrapNode`, coercers, the kind-id enum export, the options catalog) leave the package index. Nothing is kept for compatibility.
- Commits use pathspecs (`git commit -- <paths>`).
- `validation-report.json` is committed only in a commit that changes ceilings or validated rows; this plan should change neither.
- A failed gate stops the work for review; never revert or stash it away.

## Review Focus

1. **Lazily expanded children of a parsed node** (accessor getters that wrap stubs later, outside any engine call) must be stamped with the parent's engine, not left unstamped. Pinned in Task 2.
2. **`$with.*` rebuilds** must run under the node's own engine, even when called from code that holds another engine. Pinned in Task 2.
3. **Variant builders nested in the namespace** (`build.number.bigint`, `build.integer.hex`, and the `.strict` / `.coerce` flavours) must be bound too, not only top-level functions. Pinned in Task 3.
4. **An `edit` whose callback returns a structurally equal but new root**, as opposed to the same object, is a real change and writes; only the identical root skips the write. Pinned in Task 4.
5. **A path that normalises outside the project directory** (`../x`, an absolute path, `a/../../x`) is rejected before anything is staged. Pinned in Task 5.


## Delivery: five stacked PRs

Each PR is a branch stacked on the previous one (`feat/engine-api-1-surface` on `feat/leaf-literal-types`, then `-2-bound-nodes`, `-3-surfaces`, `-4-files`, `-5-projects`). Each passes the full gates on its own and updates the READMEs for its own part. A task's steps below say which PR owns each part when a task spans several.

| PR | Tasks (parts) | Behaviour change | Gate |
|---|---|---|---|
| **1. Surface move** | 0; 1 (all types); 3 (**core only**: `load()` cache, the `build` proxy binding *without* stamping, `parse`, `render` of a node or build callback, `applyEdits`, `dispose`, other-language refusal); 6 (**descriptor and `api.ts` only**: `boundary.ts`, `methodsEngine` and `$render()` stay as they are); 6b (dead surface); 6c (runtime into common); 7; 8; 9 | None | Rows, render fixtures and dogfood `.rendered` byte-identical |
| **2. Bound nodes** | 2; 3 (**cross-engine rendering, disposable `Rendered`**); 6 (**retire `boundary.ts`, `defaultEngine`, and `methodsEngine`'s `render`/`toEdit`**) | Engine render options reach `$render()` | Rows and fixtures identical under default options; the Task 2 and Task 6 stamp tests |
| **3. Surfaces + interceptors** | 3 (**`api` option with the derived strict surface; interceptors; `timing()` replacing `SITTIR_METRICS`**), plus the `StrictSurface` tsc-cost check from Task 10 | Opt-in only | Rows and fixtures identical; the interceptor and surface tests; tsc cost within 10% |
| **4. File verbs** | 4 | New API | The files and engine file-verb tests |
| **5. Projects** | 5; 10 (final docs and the complete gate list) | New API | The project tests; full final gates |

PR 1 is deliberately mechanical: the new shape over today's behaviour. Nothing a user renders changes, which makes its review a pure API review.

---

### Task 0: Branch and worktree

- [ ] **Step 1: Create the worktree**

```bash
cd ~/GitHub.nosync/refactory-lang/sittir
git fetch origin
git worktree add -b feat/engine-api-1-surface ../sittir-worktrees/engine-api origin/feat/leaf-literal-types
cd ../sittir-worktrees/engine-api && pnpm install
```

- [ ] **Step 2: Record the baselines** (numbers the gates compare against)

```bash
pnpm run validate:native            # rows must stay identical through every task
pnpm exec vitest run 2>&1 | tail -5 # full-suite count
pnpm run type-check:examples && pnpm run type-check:generated-examples
for g in rust typescript python; do (cd packages/$g && npx tsc --noEmit --extendedDiagnostics | awk '/Instantiations|Check time/'); done
```

Save the output to the scratchpad; later tasks cite it.

---

### Task 1: The API types

**Files:**
- Create: `packages/types/src/engine-api.ts`
- Modify: `packages/types/src/index.ts` (re-export)
- Test: `packages/common/tests/engine-api-types.test.ts`
- Glossary: `docs/glossary/` entry per declaration (the file that documents `packages/types/src`)

**Interfaces:**
- Produces (used by every later task):

```ts
import type { AnyNodeData, Edit } from './index.ts';
import type { EngineOptions, ParseOptions, RenderOptions } from '@sittir/common/engine';

export interface LanguageAPI {
  readonly name: string;
  readonly build: object;
  readonly is: object;
  readonly kinds: object;
  readonly types: object;          // kind name → node type, type-only
  readonly root: AnyNodeData;      // parsed/built root node type
  readonly node: AnyNodeData;      // any node of the language
  readonly options: object;        // derived Options, incl. IndentOption
}

export interface Language<API extends LanguageAPI> {
  readonly name: API['name'];
  load(): Promise<LanguageHooks<API>>;
  readonly __api?: API;            // type-only brand; never set at runtime
}

export interface LanguageHooks<API extends LanguageAPI> {
  readonly name: API['name'];
  readonly build: API['build'];
  readonly is: API['is'];
  readonly kinds: API['kinds'];
  readonly trivia: TriviaFacts;    // today's methodsEngine.trivia; the stamp engine's facts
  createNative(options?: EngineOptions<API>): NativeLanguageEngine<API>;
  wrap(root: unknown, tree: unknown): API['root'];
}

export interface NativeLanguageEngine<API extends LanguageAPI> {
  render(node: AnyNodeData, options?: API['options'] & { ignoreFormat?: boolean }): { toString(): string };   // already merged over the engine's render options
  applyEdits(source: string, edits: readonly Edit[]): string;
  parseAndRead(source: string, options?: ParseOptions): { root: unknown; tree: unknown };
  holdsTree(tree: unknown): boolean;
  dispose(): void;
}

export interface Rendered extends Disposable {
  toString(): string;
  save(path: string): void;
  print(): string;
}

export interface Pending extends PromiseLike<void>, AsyncDisposable {
  readonly path: string;
  readonly before: string | undefined;
  readonly after: string;
  diff(): { path: string; before: string | undefined; after: string };
}

export interface Engine<API extends LanguageAPI, M extends ApiSurface = 'default'> {
  readonly language: API['name'];
  readonly build: M extends 'strict' ? StrictSurface<API['build']> : M extends 'portable' ? never : API['build'];
  readonly is: API['is'];
  readonly kinds: API['kinds'];
  readonly types: API['types'];
  parse(source: string, options?: ParseOptions): API['root'];
  read(path: string, options?: ParseOptions): Promise<API['root']>;
  render(node: API['node'] | ((build: API['build']) => API['node']), options?: API['options'] & { ignoreFormat?: boolean }): Rendered;
  create(path: string, fn: (build: API['build']) => API['root']): Pending;
  edit(path: string, fn: (root: API['root']) => API['root']): Pending;
  write(path: string, node: API['root']): Pending;
  applyEdits(source: string, edits: readonly Edit[]): string;
  dispose(): void;
}

export type ApiSurface = 'default' | 'strict' | 'portable';

type StrictMembers<T> = { [K in keyof T as K extends 'strict' | 'coerce' ? never : K]: StrictSurface<T[K]> };

export type StrictSurface<T> =
  T extends { strict: infer S } ? S & StrictMembers<T>
  : T extends (...args: never) => unknown ? T
  : T extends object ? StrictMembers<T>
  : T;

export interface EngineOptions<API extends LanguageAPI, M extends ApiSurface = 'default'> {
  api?: M;
  render?: API['options'];
  format?: FormatRecord;
  intercept?: readonly Interceptor<API>[];
}

export interface Interceptor<API extends LanguageAPI> {
  build?(call: { path: readonly string[]; args: readonly unknown[] }, next: () => API['node']): API['node'];
  render?(call: { node: API['node']; options: API['options'] }, next: () => string): string;
  parse?(call: { source: string }, next: () => API['root']): API['root'];
  file?(change: { verb: 'create' | 'edit' | 'write'; path: string; before: string | undefined; after: string },
        next: () => Promise<void>): Promise<void>;
}

export interface Project extends AsyncDisposable {
  readonly directory: string | null;
  engine<API extends LanguageAPI>(language: Language<API>, options?: EngineOptions<API>): Promise<Engine<API>>;
  staged(): readonly string[];
  diff(): readonly { path: string; before: string | undefined; after: string }[];
  files(): ReadonlyMap<string, string>;
  commit(): Promise<void>;
  discard(): void;
}

export type Types<E> = E extends Engine<infer API> ? API['types'] : never;
export type ApiOf<L> = L extends Language<infer API> ? API : never;
```

`TriviaFacts` moves from `packages/common/src/utils.ts` into `engine-api.ts` (and `utils.ts` re-exports it), so the hooks type needs no import from `@sittir/common`.

If importing the options types from `@sittir/common/engine` creates a package cycle (`@sittir/common` depends on `@sittir/types`), move `EngineOptions`, `RenderOptions` and `ParseOptions` into `packages/types/src/engine-api.ts` and re-export them from `@sittir/common/engine` so there's one declaration.

- [ ] **Step 1: Write the type test**

```ts
// packages/common/tests/engine-api-types.test.ts
import { describe, it, expect } from 'vitest';
import type { Engine, Language, LanguageAPI, Types, ApiOf } from '@sittir/types';

interface FakeNode { readonly $type: 1 }
interface FakeAPI extends LanguageAPI {
  name: 'fake';
  build: { leaf(text: string): FakeNode };
  is: { leaf(n: unknown): n is FakeNode };
  kinds: { Leaf: 1 };
  types: { leaf: FakeNode };
  root: FakeNode & { $type: 1 };
  node: FakeNode;
  options: { indent?: string };
}

describe('engine API types', () => {
  it('derives the engine types from the descriptor', () => {
    type L = Language<FakeAPI>;
    type API = ApiOf<L>;
    const t: Types<Engine<API>>['leaf'] = { $type: 1 };
    expect(t.$type).toBe(1);
    // @ts-expect-error a kind the language doesn't have
    type _Bad = Types<Engine<API>>['missing'];
  });
});
```

- [ ] **Step 2: Run it and see it fail** — `pnpm exec vitest run packages/common/tests/engine-api-types.test.ts` then `pnpm --filter @sittir/common type-check`. Expected: a type-check failure (`@sittir/types` has no `Engine`).
- [ ] **Step 3: Add `packages/types/src/engine-api.ts`** with the interfaces above, and `export * from './engine-api.ts'` in `packages/types/src/index.ts`.
- [ ] **Step 4: Run both again.** Expected: the test passes and type-check is clean. Confirm with `npx tsc -p packages/common --listFilesOnly | awk '/engine-api-types/'` that the test file is in the program, so the `@ts-expect-error` is really checked.
- [ ] **Step 5: Glossary entries and commit**

```bash
git commit -m "feat(types): the language engine API types" -- packages/types/src/engine-api.ts packages/types/src/index.ts packages/common/tests/engine-api-types.test.ts docs/glossary
```

---

### Task 2: Nodes carry their engine

**Files:**
- Create: `packages/common/src/engine-stamp.ts`
- Modify: `packages/common/src/utils.ts` (`withMethods`, and the lazy child helpers the generated `wrap.ts` calls)
- Test: `packages/common/tests/engine-stamp.test.ts`

**Interfaces:**
- Produces:

```ts
export const ENGINE: unique symbol;                       // non-enumerable stamp key
export interface StampEngine {                            // what a node's methods need
  readonly language: string;
  render(node: AnyNodeData): string;
  toEdit(node: AnyNodeData, startOrRange: number | ByteRange, endPos?: number): Edit;
  readonly trivia: TriviaFacts;
}
export function runWithEngine<T>(engine: StampEngine, fn: () => T): T;
export function currentEngine(): StampEngine | undefined;
export function engineOf(node: object): StampEngine | undefined;
```

- `withMethods(node, fallback)` keeps its signature for this task. It stamps `node[ENGINE] = currentEngine() ?? fallback` as a non-enumerable property, and `$render`, `$toEdit`, `$replace` and `$trivia` read `engineOf(this)`. The `fallback` parameter goes in Task 6, when `methodsEngine` is deleted.
- `$with.*` rebuilds run inside `runWithEngine(engineOf(this)!, …)`.
- Lazy child expansion (the helper the generated `wrap.ts` calls to wrap a stub on first access; find it with infigraph `search` for `normalizeSingularWrapSlot` and `withAccessors`) runs inside `runWithEngine(engineOf(parent)!, …)`.

- [ ] **Step 1: Write the failing tests**

```ts
// packages/common/tests/engine-stamp.test.ts
import { describe, it, expect } from 'vitest';
import { runWithEngine, currentEngine, engineOf, ENGINE } from '../src/engine-stamp.ts';
import { withMethods } from '../src/utils.ts';

const fake = (label: string) => ({
  language: 'fake',
  render: () => label,
  toEdit: () => ({ startPos: 0, endPos: 0, insertedText: label }),
  trivia: { kindName: () => undefined, kinds: new Set<string>(), innerGaps: {} },
});

describe('engine stamp', () => {
  it('stamps the ambient engine and renders through it', () => {
    const a = fake('A');
    const node = runWithEngine(a, () => withMethods({ $type: 1 } as never, fake('fallback')));
    expect(engineOf(node)).toBe(a);
    expect((node as { $render(): string }).$render()).toBe('A');
    expect(Object.keys(node)).not.toContain(String(ENGINE));
  });

  it('nests and restores', () => {
    const a = fake('A'), b = fake('B');
    runWithEngine(a, () => {
      runWithEngine(b, () => expect(currentEngine()).toBe(b));
      expect(currentEngine()).toBe(a);
    });
    expect(currentEngine()).toBeUndefined();
  });

  it('restores after a throw', () => {
    const a = fake('A');
    expect(() => runWithEngine(a, () => { throw new Error('x'); })).toThrow('x');
    expect(currentEngine()).toBeUndefined();
  });
});
```

Add two more cases in the same file once the grammar packages regenerate in Task 6: a lazily expanded child of a parsed node has the parent's engine (Review Focus 1), and `$with.x(…)` called inside `runWithEngine(other, …)` rebuilds with the node's own engine (Review Focus 2). Write them now with `it.todo` names so they aren't forgotten; Task 6 turns them into real tests.

- [ ] **Step 2: Run them and see them fail.** `pnpm exec vitest run packages/common/tests/engine-stamp.test.ts`. Expected: the module isn't found.
- [ ] **Step 3: Implement `engine-stamp.ts`**

```ts
import type { AnyNodeData, ByteRange, Edit } from '@sittir/types';
import type { TriviaFacts } from './utils.ts';

export const ENGINE: unique symbol = Symbol('sittir.engine');
export interface StampEngine {
  readonly language: string;
  render(node: AnyNodeData): string;
  toEdit(node: AnyNodeData, startOrRange: number | ByteRange, endPos?: number): Edit;
  readonly trivia: TriviaFacts;
}
let active: StampEngine | undefined;
export function runWithEngine<T>(engine: StampEngine, fn: () => T): T {
  const previous = active;
  active = engine;
  try { return fn(); } finally { active = previous; }
}
export function currentEngine(): StampEngine | undefined { return active; }
export function engineOf(node: object): StampEngine | undefined {
  return (node as { [ENGINE]?: StampEngine })[ENGINE];
}
export function stamp(node: object, engine: StampEngine): void {
  Object.defineProperty(node, ENGINE, { value: engine, enumerable: false, configurable: true, writable: true });
}
```

Builders are synchronous, so a module-level ambient engine is safe. `runWithEngine` never wraps an `await`.

- [ ] **Step 4: Change `withMethods`** in `packages/common/src/utils.ts`: stamp `currentEngine() ?? engine`, and make every method read `engineOf(this) ?? engine`. Wrap the `$with` namespace's calls and the lazy child helper as described above.
- [ ] **Step 5: Run the new tests and the whole common suite.** `pnpm exec vitest run packages/common`. Expected: all pass.
- [ ] **Step 6: Regenerate all grammars and run the full gates.** `pnpm run validate:native`, then `pnpm exec vitest run` in its own call. Expected: rows identical and the suite identical to Task 0. Nothing else changes yet, because every node falls back to `methodsEngine`.
- [ ] **Step 7: Glossary entries and commit**

```bash
git commit -m "feat(common): nodes carry the engine that built or read them" -- packages/common/src/engine-stamp.ts packages/common/src/utils.ts packages/common/tests/engine-stamp.test.ts docs/glossary
```

---

### Task 3: `createEngine`

**Files:**
- Create: `packages/common/src/create-engine.ts`
- Modify: `packages/common/src/index.ts` (export `createEngine`), `packages/common/src/engine.ts` (make `RenderHandle` disposable)
- Test: `packages/common/tests/create-engine.test.ts`

**Interfaces:**
- Consumes: Task 1's types; Task 2's `runWithEngine`, `stamp`, `engineOf`.
- Produces: `createEngine<API, const M extends ApiSurface = 'default'>(language: Language<API>, options?: EngineOptions<API, M>): Promise<Engine<API, M>>`, and the internal `assembleEngine(hooks, options, files)` that Task 5 reuses with a project's file set.

Behaviour:
- `load()` is cached per descriptor object in a `WeakMap<Language, Promise<LanguageHooks>>`. A rejected load is not cached. `createEngine` rejects with `failed to load language "<name>"` and the original error as `cause`.
- `build` is a lazily built proxy over `hooks.build`. Every function reached through it, including nested namespaces such as `build.number.bigint` and the `.strict` / `.coerce` flavours (Review Focus 3), is wrapped so that it runs inside `runWithEngine(stampEngine, …)`. Wrappers are created on first access and cached per path, so there's no closure per builder until one is used.
- `parse(source)` calls `native.parseAndRead`, then `hooks.wrap(root, tree)` inside `runWithEngine`.
- `render(nodeOrFn, options)`:
  - A function is called with `build` first.
  - A node with no stamp, or one from another language, throws `node belongs to language "<x>", not "<y>"` (checked from `engineOf(node).language`).
  - If the node is from a different engine of the same language and its coordinates name that engine's tree (`!native.holdsTree(tree)`), it's rendered by that owning engine with this engine's options merged under the call's. Otherwise it's rendered here.
  - The result is a disposable `Rendered`.
- **`api`:** both surfaces proxy `hooks.build`. Under `'strict'`, the proxy's resolution of each path takes the target's `.strict` flavour when it has one, keeps descending through every other property, and hides `strict`/`coerce`. It's the same lazy per-path cache, so there's no separate walk. `'portable'` rejects before `load()` with `api "portable" is not implemented`.
- **Options:** `createNative` receives `{ render, format }`. Per-call render options are flat and merged over `options.render` key by key.
- **Interceptors:** `composeInterceptors(list)` builds one chain per operation (first is outermost) when the engine is created. The `build` proxy's per-function wrapper, `render`, `parse` and (Task 4) the file commit call through the chain. With an empty list the chain is the identity, and no extra wrapper is allocated.
- **`timing()`** (`packages/common/src/interceptors.ts`) is the built-in timing interceptor. It records through `metrics.ts`'s existing recorder, and the `SITTIR_METRICS` environment check is removed. Its callers go in Task 6 with `boundary.ts`.
- `RenderHandle` gains `[Symbol.dispose]()`, which drops the cached text; `toString`, `save` and `print` after disposal throw `rendered text disposed`.

- [ ] **Step 1: Write the failing tests** against the real `@sittir/rust` descriptor. It doesn't exist until Task 6, so this task's tests use a hand-built `Language<FakeAPI>` over a fake native engine:

```ts
// packages/common/tests/create-engine.test.ts
import { describe, it, expect } from 'vitest';
import { createEngine } from '../src/create-engine.ts';

function fakeLanguage(label: string) {
  let loads = 0;
  const hooks = {
    name: 'fake',
    build: {
      leaf: Object.assign((text: string) => ({ $type: 1, text }), {
        strict: (text: string) => ({ $type: 1, text, strict: true }),
        coerce: (text: string) => ({ $type: 1, text }),
      }),
      number: {
        bigint: Object.assign((v: bigint) => ({ $type: 2, v }), {
          strict: (v: bigint) => ({ $type: 2, v, strict: true }),
        }),
      },
    },

    is: {}, kinds: { Leaf: 1 },
    trivia: { kindName: () => undefined, kinds: new Set<string>(), innerGaps: {} },
    createNative: (opts?: { render?: { indent?: string } }) => ({
      render: (n: { text?: string }, call?: { indent?: string }) => ({ toString: () => `${call?.indent ?? opts?.render?.indent ?? ''}${n.text ?? ''}` }),
      applyEdits: (s: string) => s,
      parseAndRead: (s: string) => ({ root: { $type: 1, text: s }, tree: {} }),
      holdsTree: () => true,
      dispose: () => {},
    }),
    wrap: (root: unknown) => root,
  };
  return { language: { name: 'fake', load: async () => { loads++; return hooks; } }, loads: () => loads };
}

describe('createEngine', () => {
  it('loads a language once', async () => {
    const f = fakeLanguage('x');
    await createEngine(f.language as never);
    await createEngine(f.language as never);
    expect(f.loads()).toBe(1);
  });

  it('binds nested variant builders', async () => {
    const e = await createEngine(fakeLanguage('x').language as never) as any;
    const n = e.build.number.bigint(1n);
    expect(e.render(n).toString()).toBeDefined();
  });

  it('renders a build callback', async () => {
    const e = await createEngine(fakeLanguage('x').language as never, { render: { indent: '>' } }) as any;
    expect(String(e.render((b: any) => b.leaf('a')))).toBe('>a');
  });

  it('refuses a node from another language', async () => {
    const e = await createEngine(fakeLanguage('x').language as never) as any;
    const other = { ...fakeLanguage('y').language, name: 'other' };
    const o = await createEngine(other as never) as any;
    expect(() => e.render(o.build.leaf('z'))).toThrow(/language "other"/);
  });

  it('rejects when the language fails to load, keeping the cause', async () => {
    const cause = new Error('native binding missing');
    await expect(createEngine({ name: 'broken', load: async () => { throw cause; } } as never))
      .rejects.toMatchObject({ cause });
  });

  it('two engines share no state', async () => {
    const f = fakeLanguage('x');
    const a = await createEngine(f.language as never, { render: { indent: 'A' } }) as any;
    const b = await createEngine(f.language as never, { render: { indent: 'B' } }) as any;
    expect(String(a.render(a.build.leaf('n')))).toBe('An');
    expect(String(b.render(b.build.leaf('n')))).toBe('Bn');
  });

  it('composes interceptors first-outermost, including nested variant builders', async () => {
    const seen: string[] = [];
    const e = await createEngine(fakeLanguage('x').language as never, {
      intercept: [
        { build: (c: any, next: any) => { seen.push('outer:' + c.path.join('.')); return next(); } },
        { build: (c: any, next: any) => { seen.push('inner:' + c.path.join('.')); return next(); } },
      ],
    } as never) as any;
    e.build.number.bigint(1n);
    expect(seen).toEqual(['outer:number.bigint', 'inner:number.bigint']);
  });

  it('selects the strict surface and rejects portable', async () => {
    const e = await createEngine(fakeLanguage('x').language as never, { api: 'strict' } as never) as any;
    expect(e.build.leaf('a')).toMatchObject({ strict: true });
    expect(e.build.number.bigint(1n)).toMatchObject({ strict: true });   // nested variant takes its strict flavour
    expect(e.build.leaf.strict).toBeUndefined();                         // flavours are hidden
    await expect(createEngine(fakeLanguage('x').language as never, { api: 'portable' } as never))
      .rejects.toThrow('api "portable" is not implemented');
  });

  it('merges flat per-call render options over the engine options', async () => {
    const e = await createEngine(fakeLanguage('x').language as never, { render: { indent: '>' } }) as any;
    expect(String(e.render(e.build.leaf('a'), { indent: '#' }))).toBe('#a');
  });

  it('disposes a rendered handle', async () => {
    const e = await createEngine(fakeLanguage('x').language as never) as any;
    const r = e.render(e.build.leaf('a'));
    r[Symbol.dispose]();
    expect(() => r.toString()).toThrow('rendered text disposed');
  });
});
```

- [ ] **Step 2: Run them and see them fail** (module not found).
- [ ] **Step 3: Implement `create-engine.ts`** following the behaviour list. Keep `assembleEngine` separate from `createEngine`, so that Task 5 can pass a project's file set. File verbs are stubs that throw `not implemented` until Task 4, and Task 4's tests replace them.
- [ ] **Step 4: Run the tests.** Expected: all pass. Then run the common suite.
- [ ] **Step 5: Glossary entries and commit**

```bash
git commit -m "feat(common): createEngine assembles a language engine from its hooks" -- packages/common/src/create-engine.ts packages/common/src/engine.ts packages/common/src/index.ts packages/common/tests/create-engine.test.ts docs/glossary
```

---

### Task 4: File verbs and the atomic writer

**Files:**
- Create: `packages/common/src/files.ts`
- Modify: `packages/common/src/create-engine.ts` (the verbs)
- Test: `packages/common/tests/files.test.ts`

**Interfaces:**
- Produces:

```ts
export interface StagedChange { path: string; before: string | undefined; after: string; expectExists: boolean; baseHash: string | undefined }
export interface FileSet {                                   // where changes go
  read(path: string): Promise<string | undefined>;           // staged state over the backing store
  stage(change: StagedChange): void;
  commitOne?(change: StagedChange): Promise<void>;           // present only for a standalone engine
}
export function diskFileSet(directory: string): FileSet;     // standalone: stage == commit now
export async function commitChanges(directory: string, changes: readonly StagedChange[]): Promise<void>;
export function createPending(change: StagedChange, commit: () => Promise<void>): Pending;
```

Behaviour:
- `create(path, fn)`: the file must not exist in the file set, or it throws `create: <path> already exists`. It runs `fn(build)` under the engine, renders the result and stages `{ before: undefined, after, expectExists: false }`.
- `edit(path, fn)`: the file must exist, or it throws `edit: <path> does not exist`. It parses the file, runs `fn(root)`, and if the returned root is the same object it stages nothing: the `Pending` resolves without writing. Otherwise it renders and stages `{ before, after, expectExists: true, baseHash: sha256(before) }`. A structurally equal but new root is a change and writes (Review Focus 4).
- `write(path, node)` stages the whole file, with create or overwrite, and no precondition.
- `read(path)` parses the file set's text.
- Every commit, standalone or project, runs through the engine's composed `file` interceptor chain, one call per change, with `next` doing the actual write. An interceptor that skips `next` blocks that file.
- `createPending`: `then` runs the commit once, and `[Symbol.asyncDispose]` runs the same commit once. A `Pending` that is neither awaited nor disposed never commits.
- `commitChanges`:
  - It re-checks every change against disk: `expectExists` against existence, and `baseHash` against `sha256` of the current text. It throws one error naming every failing path, before writing anything.
  - It then writes each file to `<path>.sittir-tmp-<random>` and renames it into place.
  - If a rename throws, it restores already-replaced files from `before` (deleting created ones) and rethrows with `{ cause }`.

- [ ] **Step 1: Write the failing tests** (in a temporary directory under the scratchpad or `os.tmpdir()` via `mkdtemp`):

```ts
// packages/common/tests/files.test.ts
import { describe, it, expect } from 'vitest';
import { mkdtemp, readFile, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { commitChanges, createPending } from '../src/files.ts';

const dir = () => mkdtemp(join(tmpdir(), 'sittir-files-'));

describe('commitChanges', () => {
  it('writes all changes', async () => {
    const d = await dir();
    await commitChanges(d, [
      { path: 'a.txt', before: undefined, after: 'A', expectExists: false, baseHash: undefined },
      { path: 'b.txt', before: undefined, after: 'B', expectExists: false, baseHash: undefined },
    ]);
    expect(await readFile(join(d, 'a.txt'), 'utf8')).toBe('A');
  });

  it('writes none when one precondition fails', async () => {
    const d = await dir();
    await writeFile(join(d, 'b.txt'), 'exists');
    await expect(commitChanges(d, [
      { path: 'a.txt', before: undefined, after: 'A', expectExists: false, baseHash: undefined },
      { path: 'b.txt', before: undefined, after: 'B', expectExists: false, baseHash: undefined },
    ])).rejects.toThrow(/b\.txt/);
    await expect(stat(join(d, 'a.txt'))).rejects.toThrow();
  });

  it('fails when the file changed after it was read', async () => {
    const d = await dir();
    await writeFile(join(d, 'a.txt'), 'new on disk');
    await expect(commitChanges(d, [
      { path: 'a.txt', before: 'old', after: 'X', expectExists: true, baseHash: 'hash-of-old' },
    ])).rejects.toThrow(/a\.txt/);
  });
});

describe('createPending', () => {
  it('commits once whether awaited or disposed', async () => {
    let commits = 0;
    const p = createPending({ path: 'a', before: undefined, after: 'A', expectExists: false, baseHash: undefined }, async () => { commits++; });
    await p;
    await p[Symbol.asyncDispose]();
    expect(commits).toBe(1);
  });

  it('never commits when neither awaited nor disposed', async () => {
    let commits = 0;
    createPending({ path: 'a', before: undefined, after: 'A', expectExists: false, baseHash: undefined }, async () => { commits++; });
    await new Promise((r) => setTimeout(r, 10));
    expect(commits).toBe(0);
  });
});
```

Also write a rename-failure test by making the target a directory (a rename onto a non-empty directory throws). Check that the file replaced earlier in the same commit is restored.

- [ ] **Step 2: Run them and see them fail.**
- [ ] **Step 3: Implement `files.ts`**, and wire `create`, `edit`, `write` and `read` into `assembleEngine` over `diskFileSet(process.cwd())` for a standalone engine. For a standalone engine each `Pending`'s commit is `commitChanges(dir, [change])`, which is the one code path the project reuses.
- [ ] **Step 4: Add engine-level tests** to `create-engine.test.ts` with the fake language: a `file` interceptor that doesn't call `next` blocks the write (the file doesn't exist afterwards); create on an existing path throws; edit on a missing path throws; an edit returning the same root leaves the modification time unchanged; an edit returning a new equal root writes (Review Focus 4); and a callback that throws leaves no file.
- [ ] **Step 5: Run the common suite.** Expected: all pass.
- [ ] **Step 6: Glossary entries and commit**

```bash
git commit -m "feat(common): create, edit and write stage pending changes through one atomic writer" -- packages/common/src/files.ts packages/common/src/create-engine.ts packages/common/tests/files.test.ts packages/common/tests/create-engine.test.ts docs/glossary
```

---

### Task 5: `createProject`

**Files:**
- Create: `packages/common/src/project.ts`
- Modify: `packages/common/src/index.ts` (export `createProject`)
- Test: `packages/common/tests/project.test.ts`

**Interfaces:**
- Consumes: `assembleEngine(hooks, options, files)`, `commitChanges`, `createPending`.
- Produces: `createProject(directory: string | null): Promise<Project>`.

Behaviour:
- **The file set** is a staged overlay:
  - `read` returns the staged text if one exists, else the disk text (or `undefined` for a null directory).
  - `stage` replaces the entry for the path, keeping the first `before` and `baseHash` seen.
- **Paths:** `resolve(directory, path)` must stay inside `directory`, or it throws `path <p> is outside the project directory` (Review Focus 5). A null project only normalises the path.
- **`engine(language, options)`** loads the hooks and calls `assembleEngine` with the project's file set. Its pendings' `then` and `[Symbol.asyncDispose]` resolve without writing.
- **`staged()`, `diff()` and `files()`** read the overlay.
- **`commit()`** calls `commitChanges(directory, changes)` and then clears the overlay. A null project throws `commit: an in-memory project has no directory`.
- **`discard()`** clears the overlay.
- **`[Symbol.asyncDispose]()`** discards and disposes every engine the project created. It never commits.

- [ ] **Step 1: Write the failing tests**, using the fake language from Task 3:

```ts
// packages/common/tests/project.test.ts (fakeLanguage as in create-engine.test.ts, moved to tests/helpers/fake-language.ts)
import { describe, it, expect } from 'vitest';
import { mkdtemp, stat, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createProject } from '../src/project.ts';
import { fakeLanguage } from './helpers/fake-language.ts';

describe('createProject', () => {
  it('stages until commit', async () => {
    const d = await mkdtemp(join(tmpdir(), 'sittir-proj-'));
    const p = await createProject(d);
    const e = await p.engine(fakeLanguage('x').language as never) as any;
    await e.create('a.txt', (b: any) => b.leaf('A'));
    await expect(stat(join(d, 'a.txt'))).rejects.toThrow();
    expect(p.staged()).toEqual(['a.txt']);
    await p.commit();
    expect(await readFile(join(d, 'a.txt'), 'utf8')).toBe('A');
    expect(p.staged()).toEqual([]);
  });

  it('an edit after a create sees the created file', async () => {
    const p = await createProject(null);
    const e = await p.engine(fakeLanguage('x').language as never) as any;
    await e.create('a.txt', (b: any) => b.leaf('A'));
    await e.edit('a.txt', (root: any) => e.build.leaf(root.text + 'B'));
    expect(p.files().get('a.txt')).toBe('AB');
  });

  it('disposing without commit writes nothing, even after a throw', async () => {
    const d = await mkdtemp(join(tmpdir(), 'sittir-proj-'));
    await expect((async () => {
      await using p = await createProject(d);
      const e = await p.engine(fakeLanguage('x').language as never) as any;
      await e.create('a.txt', (b: any) => b.leaf('A'));
      throw new Error('boom');
    })()).rejects.toThrow('boom');
    await expect(stat(join(d, 'a.txt'))).rejects.toThrow();
  });

  it('rejects paths outside the directory', async () => {
    const d = await mkdtemp(join(tmpdir(), 'sittir-proj-'));
    const p = await createProject(d);
    const e = await p.engine(fakeLanguage('x').language as never) as any;
    for (const bad of ['../x', '/abs/x', 'a/../../x']) {
      expect(() => e.create(bad, (b: any) => b.leaf('A'))).toThrow(/outside the project directory/);
    }
  });

  it('an in-memory project cannot commit', async () => {
    const p = await createProject(null);
    await expect(p.commit()).rejects.toThrow(/in-memory/);
  });
});
```

- [ ] **Step 2: Run them and see them fail.**
- [ ] **Step 3: Implement `project.ts`.** Move the fake language into `packages/common/tests/helpers/fake-language.ts` and import it from the Task 3 and Task 4 tests too.
- [ ] **Step 4: Run the common suite.** Expected: all pass.
- [ ] **Step 5: Glossary entries and commit**

```bash
git commit -m "feat(common): createProject stages engines' changes and commits them all or none" -- packages/common/src/project.ts packages/common/src/index.ts packages/common/tests docs/glossary
```

---

### Task 6: Generated packages: the descriptor and `api.ts`

**Files:**
- Modify: `packages/codegen/src/emitters/engine.ts` (becomes the `api.ts` emitter: `emitApi`), `packages/codegen/src/emitters/index-file.ts` (descriptor plus types only), `packages/codegen/src/emitters/grammar-runtime.ts` (drop `boundary.ts`: `defaultEngine`, `render`, `toEdit`, `applyEdits`), `packages/codegen/src/emitters/client-utils.ts` (`methodsEngine` loses `render`/`toEdit`; it keeps only the `trivia` facts, passed to `createNative` as the stamp engine's facts), `packages/codegen/src/emitters/emit.ts` (the file list: add `api.ts`, remove `engine.ts`, `render-engine.ts`, `boundary.ts`), and the emitter that writes each grammar package's `package.json` `exports` (add `"./api"`; find it with infigraph `search` for `"exports"` under `packages/codegen/src`).
- Regenerate: all 5 grammars.
- Test: `packages/codegen/src/emitters/__tests__/` emitter snapshots for `api.ts` and `index.ts`; `packages/rust/tests/engine-api.test.ts` (new).

**Interfaces:**
- The generated `packages/<g>/src/index.ts`:

```ts
import type { Language } from '@sittir/types';
import type { RustAPI } from './api-types.js';
export type * from './types.js';
export type { RustAPI } from './api-types.js';
declare const rust: Language<RustAPI>;
const language = { name: 'rust', load: () => import('./api.js').then((m) => m.hooks) } as unknown as Language<RustAPI>;
export default language;
```

Use `const rust: Language<RustAPI> = { name: 'rust', load: … }` if it type-checks without a cast. The `__api` brand is optional, so a plain object literal should satisfy it; prefer that over the cast.

- The generated `api-types.ts` declares `RustAPI extends LanguageAPI`: `build: typeof ir`, `is: typeof is`, `kinds: typeof TSKindId`, `types: KindTypeMap` (one emitted map from kind name to node type, the same map the static exports read), `root: SourceFile`, `node: AnyNode`, `options: Options & IndentOption<string, IndentChar>`.
- The generated `api.ts` exports `hooks: LanguageHooks<RustAPI>`, which wires `build: ir`, `is`, `kinds: TSKindId`, `createNative` (today's `createRenderEngine` body plus `parseAndRead` and `holdsTree`), and `wrap: wrapNode`.

- [ ] **Step 1: Write the failing grammar-level test**

```ts
// packages/rust/tests/engine-api.test.ts
import { describe, it, expect } from 'vitest';
import { createEngine } from '@sittir/common';
import rust, { type FunctionItem } from '../src/index.ts';

describe('rust through createEngine', () => {
  it('the descriptor import is light', async () => {
    const mod = await import('../src/index.ts');
    expect(Object.keys(mod)).toEqual(['default']);
  });

  it('two engines render with their own indent', async () => {
    const tabs = await createEngine(rust, { render: { indent: '\t' } });
    const spaces = await createEngine(rust, { render: { indent: '  ' } });
    const src = 'fn f() {\n    a;\n}\n';
    expect(tabs.parse(src).$render()).toBe(src);                       // untouched: byte-exact
    const fn = (e: typeof tabs) => e.build.functionItem({ name: 'f', parameters: e.build.parameters([]), body: e.build.block([e.build.expressionStatement(e.build.identifier('a'))]) });
    expect(fn(tabs).$render()).toContain('\ta;');
    expect(fn(spaces).$render()).toContain('  a;');
  });

  it('types come through the engine', async () => {
    const rs = await createEngine(rust);
    const t: typeof rs.types.functionItem = {} as FunctionItem;
    expect(t).toBeDefined();
  });
});
```

Fix the builder argument shapes to the generated signatures when you write the test, by reading `packages/rust/src/ir.ts`. Turn Task 2's two `it.todo` cases into real tests here, against rust: a lazily expanded child of a parsed node has the parent's engine; `$with` rebuilds with the node's own engine.

- [ ] **Step 2: Run it and see it fail** (no default export).
- [ ] **Step 3: Change the emitters** as listed, and write the emitter snapshot tests for `api.ts` and `index.ts`.
- [ ] **Step 4: Regenerate everything and run the gates.**

```bash
pnpm run validate:native
pnpm exec vitest run packages/rust/tests/engine-api.test.ts
```

Expected: validation rows identical to Task 0, and the new test passes. Most other package tests now fail to import `ir` and friends; Tasks 7–9 migrate them. Record the failing-file count; it must reach zero by Task 9.

- [ ] **Step 5: Glossary entries and commit** (emitters, regenerated outputs, the test)

```bash
git commit -m "feat(codegen): grammar packages export a language descriptor; the implementation moves to api.ts" -- packages/codegen/src packages/rust packages/typescript packages/python packages/scm packages/regex rust/crates docs/glossary
```

---

### Task 6b: Remove the dead surface (PR 1)

**Files:**
- Modify: `packages/codegen/src/emitters/consts.ts` (emit only `INNER_GAPS` and `TOKEN_INTERIORS`), `packages/codegen/src/emitters/__tests__/emitter-consts.test.ts` (drop the removed tables' cases), `packages/codegen/src/__tests__/phantom-kind-ratchet.test.ts` (read the kind catalog from the compiled model, not `packages/<g>/src/consts.ts`), `packages/common/src/*` (delete the dead functions), and `packages/common/src/index.ts`, `engine-boundary.ts` and `utils.ts` (trim the public exports).
- Regenerate: all 5 grammars.

What goes:
- **From every generated `consts.ts`:** everything except `INNER_GAPS` and `TOKEN_INTERIORS`. That includes:
  - `ALL_KINDS`, `KEYWORDS`, `OPERATORS`;
  - the per-category literal lists and their `*Value` types (`ACCESSIBILITY_MODIFIERS`, `BOOLEAN_LITERALS`, `PRIMITIVE_TYPES`, `PREDEFINED_TYPES`, `QUANTIFIERS`, `TOKEN_TREE_PUNCTUATIONS`, `FRAGMENT_SPECIFIERS`, …), `_KINDS`, `KindValue`, and the `NodeKind`/`LeafKind`/`AnyKind`/`AnyOperator`/`Keyword` aliases, unless `types.ts` still reads one (keep only those, and move them into `types.ts`);
  - the `TREE_SITTER_*` kind and field tables and `TSFieldId`, which duplicate `KIND_NAMES`/`TSKindId`.
- **From `@sittir/common`, deleted outright** (zero callers at the time of the census): `toCst`, `normalizeNativeReadNode`, `replaceField`, `bindRange`, `isRenderableNodeData`, `applyFormat`, with their tests.
- **From `@sittir/common`'s public index only, kept in the code:** `RenderEngine`, `EngineDiagnostics`, `GrammarEngineConfig`, `BackendStatusLike`, `TriviaFacts` (it moves to `@sittir/types` in Task 1), `TriviaSetterRuntime`, `WithMethodsRuntime`. The generated-code helpers (`numberText`, `lexedConfig`, `markEdited`, `refuseSiblingLead`, `spelledForm`, `spelledInterior`) move from the root export to `@sittir/common/utils`, which generated code already imports.

- [ ] **Step 1: Re-confirm the census before deleting anything.** For every name above, run infigraph `find_all_references` (or `search` with `regex=true`) on the current branch. A name with any caller outside its own definition, export line and emitter stays, and gets reported. Record the census in the commit message.
- [ ] **Step 2: Re-point the ratchet.** It reads kinds, keywords, operators and the parser-id kind names from the compiled model (`compileGrammar` output, the same source the consts emitter printed from). It must report the same phantom count for every grammar as before. Run it before touching the emitter: `pnpm exec vitest run packages/codegen/src/__tests__/phantom-kind-ratchet.test.ts`. Expected: pass with the same numbers.
- [ ] **Step 3: Cut the emitter and the common exports; regenerate.**
- [ ] **Step 4: Gates:** validation rows identical, the full suite with 0 failures, type-check, both examples checks, and `cargo test --workspace --no-default-features`.
- [ ] **Step 5: Glossary (remove the deleted declarations' entries) and commit**

```bash
git commit -m "refactor: remove the dead generated consts and unused common exports" -- packages/codegen/src packages/common packages/rust packages/typescript packages/python packages/scm packages/regex docs/glossary
```

---

### Task 6c: Runtime helpers move into `@sittir/common` (PR 1)

The generated `utils.ts` (266–406 lines per grammar) is almost entirely typed wrappers: overload lists (for example `isEmpty(node: T.Block): node is T.EmptyBlock`, one per list kind), `isNodeData`/`isTreeNode` typed over `NamespaceMap`, and thin helpers (`rejectBareText`, `rejectKeywordText`, `admitAliasContent`, `coerceMixedEnumStorage`, `coerceKindEnumStorage`, `hoist`, `hoistRoutes`, `attachProps`, `bundle`, `isNodeOfKind`, `hasKindOf`) whose bodies are already generic. The one piece of grammar data is `methodsEngine.trivia`.

**Files:**
- Create: `packages/common/src/runtime.ts`, which holds every helper above, generic over a grammar type map.
- Modify: `packages/types/src/engine-api.ts` (`GrammarTypeMap`), `packages/codegen/src/emitters/types.ts` (emit the grammar's type map), `packages/codegen/src/emitters/client-utils.ts` (it now emits only the facts object and one `bindRuntime` call, or is deleted, with the facts moving into `api.ts`), and the generated factories/wrap imports (they import from the bound runtime).
- Test: `packages/common/tests/runtime.test.ts`.

**Interfaces:**
- Produces:

```ts
// @sittir/types
export interface GrammarTypeMap {
  readonly namespaces: object;          // today's NamespaceMap
  readonly empty: object;               // list kind → its Empty<Kind> type (drives isEmpty)
}
// @sittir/common
export function bindRuntime<M extends GrammarTypeMap>(facts: GrammarFacts): GrammarRuntime<M>;
export interface GrammarRuntime<M extends GrammarTypeMap> {
  isNodeData<K extends keyof M['namespaces']>(v: unknown): v is Extract<M['namespaces'][K], AnyNodeData>;
  isTreeNode(v: unknown): v is AnyTreeNodeOf<AnyNodeData>;
  isEmpty<K extends keyof M['empty']>(node: unknown): node is M['empty'][K];
  // …one generic signature per helper listed above, replacing the per-grammar overload lists
}
```

- The generated `api.ts` does `export const runtime = bindRuntime<RustTypeMap>(RUST_FACTS)`, and the engine exposes the guards through `engine.is`. `GrammarFacts` is today's `TriviaFacts` plus `KIND_NAMES`, `INNER_GAPS` and `TOKEN_INTERIORS`, as data.

- [ ] **Step 1: Write `runtime.test.ts`** against a fake type map and facts, covering `isEmpty` narrowing (a type test with `@ts-expect-error` on a non-list kind) and the runtime behaviour of each helper, copied from today's generated-utils tests.
- [ ] **Step 2: Run it and see it fail.**
- [ ] **Step 3: Implement `runtime.ts`** by moving each helper's body from the emitter's template into a real function, and replacing each overload list with one generic signature over the map.
- [ ] **Step 4: Change the emitters** so each grammar emits its type map into `types.ts`, and its facts plus the `bindRuntime` call into `api.ts`. Delete the generated `utils.ts`.
- [ ] **Step 5: Gates:** regenerate all 5 grammars; validation rows identical; the full suite; type-check; both examples checks. Measure `tsc` against Task 0: the generic signatures replace overload lists, so check time should not grow. If it does by more than 10% on any grammar, stop and report.
- [ ] **Step 6: Glossary entries and commit**

```bash
git commit -m "refactor: runtime helpers live in @sittir/common, typed by each grammar's type map" -- packages/common packages/types packages/codegen/src packages/rust packages/typescript packages/python packages/scm packages/regex docs/glossary
```

---

### Task 7: Migrate tools, validators and the CLI

**Files:** every file under `packages/tools/src`, `packages/cli/src` and `packages/tools/tests` that imports a grammar package. List them with infigraph `search` (`regex=true`) for `from '@sittir/(rust|typescript|python|scm|regex)'`.

The rewrite, applied everywhere:

| Before | After |
|---|---|
| `import { ir, createEngine, … } from '@sittir/rust'` | `import rust from '@sittir/rust'` + `import { createEngine } from '@sittir/common'` |
| `createEngine(opts)` | `await createEngine(rust, opts)` (callers become async where needed) |
| `ir.x(…)` | `engine.build.x(…)` |
| `is.x(n)` | `engine.is.x(n)` |
| `TSKindId.X` | `engine.kinds.X` |
| `render(node)` / `node.$render()` | `engine.render(node).toString()` / unchanged `$render()` |
| `readTreeNode` / `wrapNode` | `engine.parse(source)` |
| `applyEdits(src, edits)` | `engine.applyEdits(src, edits)` |

Tools that iterate over grammars resolve each descriptor by name through one helper, `loadLanguage(name): Promise<Language<LanguageAPI>>`, in `packages/tools/src/languages.ts`: `(await import(`@sittir/${name}`)).default`.

- [ ] **Step 1: Run the tools and CLI tests and record the failures** (from Task 6).
- [ ] **Step 2: Add `packages/tools/src/languages.ts`** with a test that loads all five descriptors.
- [ ] **Step 3: Rewrite the files by the table**, one package directory at a time, running that directory's tests after each.
- [ ] **Step 4: Gates:** `pnpm run validate:native` (rows identical), the tools and CLI tests passing, and `pnpm exec tsx packages/cli/src/cli.ts tool --help` running.
- [ ] **Step 5: Commit**

```bash
git commit -m "refactor(tools,cli): use the language engine" -- packages/tools packages/cli docs/glossary
```

---

### Task 8: Migrate grammar-package and codegen tests

**Files:** `packages/{rust,typescript,python,scm,regex}/tests/*.ts` and codegen tests that import generated packages. Rewrite by Task 7's table. Each test file creates its engine once, with `const rs = await createEngine(rust)` in a `beforeAll`, or at top level (vitest supports top-level `await` in ESM).

- [ ] **Step 1: Rewrite one package's tests, then run them.** Expected: the same pass count as Task 0 for that package.
- [ ] **Step 2: Repeat for each package.**
- [ ] **Step 3: Run the full suite in its own call.** Expected: the same total as Task 0 plus the new tests, and 0 failures.
- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(tests): grammar tests use the language engine" -- packages/rust/tests packages/typescript/tests packages/python/tests packages/scm/tests packages/regex/tests packages/codegen/src
```

---

### Task 9: Migrate examples and the factory-source emitter

**Files:** `examples/*.ts` (the hand-written ones), `packages/tools/src/emit/factory-source.ts` (the printer: it emits `const rs = await createEngine(rust)` and `rs.build.*` in place of `ir.*`, and `rs.kinds.X` in place of `TSKindId.X`), `packages/tools/tests/emit/dogfood-render-bytes.test.ts` (it creates engines through `createEngine(descriptor, { render: renderOptions })`), and the regenerated `examples/*.generated.ts` (`pnpm run gen:examples`).

- [ ] **Step 1: Change the printer and regenerate the examples.**
- [ ] **Step 2: Gates:**
  - `pnpm run type-check:examples && pnpm run type-check:generated-examples`: 0 errors, within `examples/generated-typecheck-ceiling.json`;
  - `pnpm exec vitest run packages/tools/tests/emit`: every `.rendered` fixture byte-identical, and no snapshot updated;
  - `pnpm run examples` (the examples run) passing.
- [ ] **Step 3: Commit**

```bash
git commit -m "refactor(examples): examples and generated rebuilds use the language engine" -- examples packages/tools/src/emit packages/tools/tests/emit
```

---

### Task 10: Documentation and final gates

**Files:** `README.md` and the package READMEs (usage examples), `docs/cli-command-glossary.md` (if a CLI behaviour changed; it's generated, so regenerate it), `DEVELOPMENT.md`, and the glossary entries left from earlier tasks.

- [ ] **Step 1: Rewrite every usage example** in the READMEs to the engine form (`import rust from '@sittir/rust'`, `await createEngine(rust)`, `rs.build.*`). Add one project example with `create`, `edit`, `commit` and `await using`.
- [ ] **Step 2: Final gates** (each in its own call):
  - `pnpm run validate:native`: rows identical to Task 0;
  - `pnpm exec vitest run`: 0 failures;
  - `pnpm run type-check`, then both examples type-checks;
  - `cargo test --workspace --no-default-features`;
  - `tsc --noEmit --extendedDiagnostics` per grammar: report the check time and instantiations against Task 0, and separately the cost of a file that names `Engine<RustAPI, 'strict'>['build']` (the recursive `StrictSurface`). If that alone adds more than 10% check time on any grammar, stop and report: the fallback is to emit the strict surface's type, types only, keeping the runtime glue.
- [ ] **Step 3: Commit and push PR 5**, against PR 4's branch, with the gate numbers in the body. "Closes #388" goes on PR 5, the last of the stack.

```bash
git commit -m "docs: the language engine in the READMEs" -- README.md packages/*/README.md DEVELOPMENT.md docs
git push -u origin feat/engine-api-5-projects
```
