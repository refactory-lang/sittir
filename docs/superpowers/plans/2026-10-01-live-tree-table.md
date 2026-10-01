# Live Tree Table Per Language Addon — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hold live parsed trees in one table per language addon (per JS thread) instead of per engine, and keep a tree alive while any reachable parsed object names it, so render depends only on a coordinate's tree handle.

**Architecture:** The `napi_engine!` macro moves the tree table out of `SittirEngine` into a `thread_local!` owned by the grammar's addon, and exports `disposeTree` / `liveTreeCount` as addon functions. On the JS side a tree's lifetime token is held by every parsed object a read hands out (a `$tree` member), and the `FinalizationRegistry` releases through the addon function instead of an engine instance. `engine.render` renders through the engine it is called on; `collectReaders` and the reader hand-off are deleted.

**Tech Stack:** Rust (`napi` 3, `napi-derive` 3) in `rust/crates/sittir-core`; TypeScript in `packages/common`; codegen in `packages/codegen/src/emitters`; vitest; `node:worker_threads`.

**Spec:** GitHub issue #540 ("Live trees: one table per language instead of per engine, and a tree lives while any node names it"). The design in the issue is settled. Probes: main checkout `scratchpad/arena-baseline/` (`cross-engine.mts`, `tree-lifetime.mts`, `engine-wrap-real.mts`).

## Global Constraints

- "Global" means **per language addon and per JS thread**. Each grammar's addon is its own linked image; each worker thread has its own `globalThis` and therefore its own tree-id counter.
- The engine holds **no** reference to its trees. `engine.dispose()` frees the engine and leaves trees alone.
- Release is a function **of the addon**, callable after the parsing engine is disposed or collected.
- Render format is **not** part of this work: it still comes from the optional `treeId`, else the engine's newest parse (`last_tree_id` stays per engine).
- Generated outputs are never hand-edited: `packages/<lang>/src/*`, `packages/<lang>/native/index.d.ts`, `rust/crates/sittir-<lang>/src/*` come from regeneration and the native build.
- No comments in `packages/codegen/src/`; explanations go to `docs/glossary/`. No issue or PR numbers in comments, glossary or test names.
- Commits by pathspec (`git commit -- <paths>`); vitest runs as its own shell call.
- Every task's gate includes: `rtk cargo test --workspace --no-default-features` when Rust changed, `pnpm run type-check`, `pnpm run lint`.
- The final gate is the validation rows for all five grammars identical to `packages/tools/baselines/native.json` (11992 pass / 3 fail on master `0c642736e`).

## Two decisions this plan settles

### 1. How release is driven from the addon without leaking

- **What holds a tree alive.** One token object per tree, `{ treeId }`, minted in `parseAndRead` (`packages/common/src/engine.ts`). It is referenced by (a) the tree handle's `read` closure, as today, and (b) a `$tree` member on **every parsed object a read returns** — the root, every child a deep read expanded, every stub, every leaf — stamped where the read's JSON is parsed. `$tree` is an ordinary enumerable data member, so a spread copy (`{ ...$edited(data) }`, which is how a `$with` rebuild of a parsed node is made) keeps it, and no `Object.defineProperty` is used (a defined property would cost every parsed object its shape).
- **What frees it.** A module-level `FinalizationRegistry` in `engine.ts`. Its held value is `{ release, treeId }` where `release` is the addon's exported `disposeTree` function. The registry holds no engine, weakly or strongly. The addon module is held strongly by the held value; the addon is never unloaded, so that retains nothing extra.
- **Why it does not leak.** A tree is in the native table from `parse_and_read` until its token is collected. The token is unreachable exactly when no parsed object of the tree and no tree handle is reachable. On thread exit the `thread_local!` table is dropped with the thread, so a terminated worker leaves nothing behind even though its finalizers never run.
- **What `$tree` must not do.** It must not cross to native: the projection (`toTransportValue`) drops it with the coordinate keys. It must not count as storage or as a difference: `detachCoordinates` removes it and the validators' ignored-key list names it.
- **How a collection is tested deterministically.** Not inside the vitest worker (it runs without `--expose-gc`, and the existing test silently asserts nothing there). A fixture script is run in a child process with `node --expose-gc --import tsx`, performs up to 20 rounds of `gc()` followed by a 25 ms timer turn (finalizer callbacks run in a later task, never synchronously), stops as soon as the count reaches its target, and prints one JSON line. The test asserts on that JSON and fails if the script exits non-zero; there is no skip path.

### 2. The worker-thread case

- The table is a `thread_local!` inside the macro expansion: one per addon image and per OS thread. Node runs each `Worker` on its own thread with its own `napi_env` and its own `globalThis`, so each worker gets its own table and its own id counter starting at 0. The same id in two threads names two different trees in two different tables; they never meet.
- A parsed node cannot be sent to another thread as a node: a wrapped node holds functions and `postMessage` refuses it (`DataCloneError`). Plain read data (a leaf) clones. Its clone carries a `$handle` whose tree id may name a **different** tree in the receiving thread's table, which would render another source's bytes.
- **Rule (the user's ruling: yes):** a coordinate is refused at projection unless its `$tree` is a token minted on this thread. `engine.ts` keeps the tokens it mints in a `WeakSet`; `toTransportValue` already visits every node it projects, so the check adds no walk. A structured clone of a token is a new object and is not in the set, so a cloned leaf is refused with a message naming what happened (a coordinate from another thread's tree table) and what to do instead (parse the source on this thread). Without this rule the cross-thread case is documented as unsupported and can render wrong bytes silently.

## Overlap with the node-members work (#534, sittir-implement)

| File | This plan | #534 |
| --- | --- | --- |
| `packages/common/src/create-engine.ts` | deletes `collectReaders`, the reader dispatch, `labelOf`, `serials`, `engineCount` | rewrites `collectReaders`' key walk |
| `packages/common/src/transport-data.ts` | adds `$tree` to the dropped coordinate keys; the token check in `toTransportValue` (Task 6) | rewrites `toTransportValue`'s key selection and the walks in `isUntouchedBelow`, `isDerivedFromText`, `holdsSlots`, `detachCoordinates` |
| `packages/rust/tests/bound-nodes.test.ts` | flips two tests | changes the `$trivia(…)` call sites |
| `packages/common/src/utils.ts`, `packages/codegen/src/emitters/wrap.ts`, `factories.ts` | not touched | rewritten |

This plan stamps `$tree` at the read boundary in `engine.ts`, not in the generated wrap, so it stays out of the emitters #534 rewrites. There is no strict order between the two: whichever lands second syncs onto master. One coupling: #534 makes every node member enumerable and introduces a single key predicate (`isDataKey`) for the transport walks. Once that is on master, `$tree` is classified by that predicate (as a non-data key) and not by a second list; the `COORDINATE_KEYS` edit in Task 3 is the form to use only while master still has the list.

## File Structure

- `rust/crates/sittir-core/src/napi_engine.rs` — the macro: `thread_local!` table, addon functions, engine methods reading the table.
- `rust/crates/sittir-core/src/render.rs` — `CoordinateError::UnknownTree` message.
- `packages/codegen/src/emitters/native-crate.ts` — `NATIVE_RENDER_TRANSPORT_ABI` 7 → 8.
- `packages/codegen/src/emitters/grammar-runtime.ts` — the emitted `NativeModule` type gains the addon functions.
- `packages/common/src/engine.ts` — `NativeModuleLike` addon functions, token, `$tree` stamping, registry.
- `packages/common/src/transport-data.ts` — `$tree` among the dropped keys.
- `packages/common/src/create-engine.ts` — render through the calling engine.
- `packages/common/tests/fixtures/tree-release.mts`, `packages/common/tests/fixtures/tree-worker.mjs` — child-process and worker fixtures (new).
- `packages/rust/tests/tree-table.test.ts` (new) — the "done when" cases.
- Tests that flip: listed in Task 5.

## Review Focus

- A parsed leaf held only by a built node, after a collection: must still render (Task 3 test).
- A node whose engine was disposed, rendered through another engine of the language: must render (Task 4 test).
- A tree whose engine object was collected before its nodes: must still be released (Task 3 fixture, case `engine-collected`).
- A stale native binary without the addon functions: must be refused at engine creation by the ABI check, not fail in a finalizer (Task 1 gate).
- Plain read data cloned to a worker: refused, not rendered from another tree (Task 6).

---

### Task 1: The table belongs to the addon

**Files:**
- Modify: `rust/crates/sittir-core/src/napi_engine.rs`
- Modify: `rust/crates/sittir-core/src/render.rs:95-98`
- Modify: `packages/codegen/src/emitters/native-crate.ts:3`
- Test: `packages/rust/tests/tree-table.test.ts` (create)

**Interfaces:**
- Produces (addon exports, every grammar): `disposeTree(treeId: number): void`, `liveTreeCount(): number`. `SittirEngine` loses `disposeTree` and the `liveTreeCount` getter; `dispose()` stays and no longer drops trees. `nativeRenderTransportAbi` is 8.

- [ ] **Step 1: Write the failing test**

```ts
// packages/rust/tests/tree-table.test.ts
import { describe, expect, it } from 'vitest';
import { getActiveBackend } from '../src/backend.ts';

function addon() {
	const status = getActiveBackend();
	if (status.name !== 'native') throw new Error(`native backend unavailable: ${status.reason}`);
	return status.native;
}
const treeIdOf = (read: string): number => (JSON.parse(read) as { treeId: number }).treeId;

describe('the live tree table of a language', () => {
	it('is one table for every engine of the addon', () => {
		const native = addon();
		const before = native.liveTreeCount();
		const a = new native.SittirEngine();
		const b = new native.SittirEngine();
		const first = treeIdOf(a.parseAndRead('fn a() {}'));
		const second = treeIdOf(b.parseAndRead('fn b() {}'));
		expect(native.liveTreeCount()).toBe(before + 2);
		expect(JSON.parse(b.readRoot(first))).toBeDefined();
		native.disposeTree(first);
		native.disposeTree(second);
		expect(native.liveTreeCount()).toBe(before);
	});

	it('keeps its trees when the engine that parsed them is disposed', () => {
		const native = addon();
		const before = native.liveTreeCount();
		const a = new native.SittirEngine();
		const id = treeIdOf(a.parseAndRead('fn kept() {}'));
		a.dispose();
		expect(native.liveTreeCount()).toBe(before + 1);
		expect(JSON.parse(new native.SittirEngine().readRoot(id))).toBeDefined();
		native.disposeTree(id);
	});

	it('ignores a nonsense tree id and a repeated release', () => {
		const native = addon();
		const id = treeIdOf(new native.SittirEngine().parseAndRead('fn a() {}'));
		const held = native.liveTreeCount();
		native.disposeTree(Number.NaN);
		native.disposeTree(-1);
		expect(native.liveTreeCount()).toBe(held);
		native.disposeTree(id);
		native.disposeTree(id);
		expect(native.liveTreeCount()).toBe(held - 1);
	});
});
```

(Confirm the import path of `getActiveBackend` against `packages/rust/tests/tree-identity-and-verbatim.test.ts` and use the same one.)

- [ ] **Step 2: Run it and watch it fail**

Run: `cd packages/rust && pnpm exec vitest run tests/tree-table.test.ts`
Expected: FAIL, `native.liveTreeCount is not a function`.

- [ ] **Step 3: Move the table in the macro**

In `napi_engine!`, remove the `trees` field from `SittirEngine` and its initialiser, and add beside the struct:

```rust
::std::thread_local! {
    static LIVE_TREES: ::std::cell::RefCell<::std::collections::HashMap<u32, $crate::ParsedTree<$grammar>>> =
        ::std::cell::RefCell::new(::std::collections::HashMap::new());
}

#[::napi_derive::napi]
pub fn dispose_tree(tree_id: f64) {
    let Ok(tree_id) = $crate::napi_engine::checked_index(tree_id, "treeId") else {
        return;
    };
    let Ok(tree_id) = u32::try_from(tree_id) else {
        return;
    };
    LIVE_TREES.with(|trees| {
        trees.borrow_mut().remove(&tree_id);
    });
}

#[::napi_derive::napi]
pub fn live_tree_count() -> u32 {
    LIVE_TREES.with(|trees| trees.borrow().len() as u32)
}
```

Then, in the `impl SittirEngine`:
- `parse_and_read`: replace `self.trees.insert(tree_id, parsed);` with `LIVE_TREES.with(|trees| { trees.borrow_mut().insert(tree_id, parsed); });`.
- `read_untyped_node` and `read_root`: wrap the body that uses the tree in `LIVE_TREES.with(|trees| { let mut trees = trees.borrow_mut(); let parsed = trees.get_mut(&tree_id).ok_or_else(…)?; … })`, keeping both error messages.
- `render`: build the context inside `LIVE_TREES.with(|trees| { let trees = trees.borrow(); let ctx = $crate::prepare::RenderContext { options: table, sources: &*trees }; … })` and read `tree_format` from the same borrow. No JavaScript runs inside the borrow, so it cannot be re-entered.
- Delete the methods `dispose_tree` and `live_tree_count` from the class.
- `dispose`: body becomes `self.last_tree_id = None;`.
- Update the module doc comment's last paragraph: trees are dropped by the addon's `disposeTree`, and `dispose` leaves them.

In `render.rs`, the `UnknownTree` message becomes:

```rust
"handle {handle} names tree {tree_id}, which is not live in this language's table (never parsed on this thread, or already released)"
```

In `native-crate.ts`: `export const NATIVE_RENDER_TRANSPORT_ABI = 8;`

- [ ] **Step 4: Update the Rust tests that quote the message**

Run: `rtk cargo test --workspace --no-default-features`
Expected: the test `the_unknown_tree_message_names_the_tree` in `rust/crates/sittir-core/src/slot.rs` fails if it quotes "does not hold"; update its expected text to the new sentence and rerun until 0 failures.

- [ ] **Step 5: Regenerate and rebuild every addon**

Run: `pnpm run validate:native` (regenerates the five grammars with ABI 8 and builds the five addons; `packages/<lang>/native/index.d.ts` now declares `disposeTree` and `liveTreeCount` as module functions).
Expected at this point: engine creation works; validation rows are not compared yet because `engine.ts` still calls `engine.disposeTree` (Task 2 fixes it). `pnpm run type-check` fails in `packages/common/src/engine.ts` on `NativeEngineLike.disposeTree` — expected, fixed in Task 2. Do not commit yet.

- [ ] **Step 6: Run the new test**

Run: `cd packages/rust && pnpm exec vitest run tests/tree-table.test.ts`
Expected: 3 passed.

Tasks 1 and 2 are committed together (the tree is not consistent between them).

### Task 2: The JS boundary releases through the addon

**Files:**
- Modify: `packages/common/src/engine.ts`
- Modify: `packages/codegen/src/emitters/grammar-runtime.ts` (the emitted `NativeModule`)
- Test: `packages/rust/tests/tree-identity-and-verbatim.test.ts` (the three tests under `parsed trees are released`)

**Interfaces:**
- Consumes: addon `disposeTree`, `liveTreeCount` (Task 1).
- Produces: `NativeModuleLike` with `disposeTree(treeId: number): void` and `liveTreeCount(): number`; `NativeEngineLike` without them.

- [ ] **Step 1: Change the types**

In `engine.ts`, delete `disposeTree` and `liveTreeCount` from `NativeEngineLike` and add to `NativeModuleLike`:

```ts
	/** Release one parsed tree of this language. Driven by GC; an id that names no tree is ignored. */
	disposeTree(treeId: number): void;
	/** Trees of this language still held on this thread. Diagnostics only. */
	liveTreeCount(): number;
```

- [ ] **Step 2: Release through the addon**

Replace `treeDisposalRegistry`:

```ts
const treeDisposalRegistry = new FinalizationRegistry<{
	readonly release: (treeId: number) => void;
	readonly treeId: number;
}>(({ release, treeId }) => release(treeId));
```

and its registration in `parseAndRead`:

```ts
treeDisposalRegistry.register(liveToken, { release: status.native.disposeTree, treeId: parsed.treeId });
```

`status` is the native status already read at the top of `createNativeEngine`. Rewrite the doc comment above the registry: the registry holds the addon's release function and no engine, so a tree is released whether its engine is alive, disposed or collected.

- [ ] **Step 3: Rewrite the three release tests to the new rule**

In `packages/rust/tests/tree-identity-and-verbatim.test.ts`, delete `holds one tree per parse and drops them on request` and `ignores a nonsense tree id rather than dropping the first tree` (they pinned: the count is per engine; `dispose()` takes it to zero — both rules are gone, and Task 1's `tree-table.test.ts` pins their replacements). Delete `releases trees the caller no longer holds` (it pinned release through a shared engine instance and asserts nothing without `--expose-gc`; Task 3 replaces it with a child-process test).

- [ ] **Step 4: Gate and commit**

Run: `pnpm run type-check && pnpm run lint && rtk cargo test --workspace --no-default-features`, then `pnpm exec vitest run` as its own call.
Expected: type-check 0, lint 0, cargo 0 failures; the unit suite green except the tests Task 5 flips (`several engines`, disposed reader) which still pass at this point because `collectReaders` is untouched.

```bash
git commit -m "feat(engine): live trees are held by the language addon, not by an engine" -- rust/crates packages/codegen/src/emitters/native-crate.ts packages/codegen/src/emitters/grammar-runtime.ts packages/common/src/engine.ts packages/rust/tests packages/*/src packages/*/native/index.d.ts packages/*/.sittir/generated.manifest.json docs/glossary
```

### Task 3: A tree lives while any parsed object names it

**Files:**
- Modify: `packages/common/src/engine.ts`
- Modify: `packages/common/src/transport-data.ts:7-9`
- Modify: `packages/tools/src/validate/factory-render-parse.ts` (`IGNORED_NODE_KEYS`)
- Create: `packages/common/tests/fixtures/tree-release.mts`
- Test: `packages/rust/tests/tree-table.test.ts`

**Interfaces:**
- Produces: every object in a read result carries `$tree: TreeToken` where `export interface TreeToken { readonly treeId: number }`; `export function isLiveToken(value: unknown): boolean` (used by Task 6).

- [ ] **Step 1: Write the fixture and the failing test**

```ts
// packages/common/tests/fixtures/tree-release.mts — run with: node --expose-gc --import tsx
import { createEngine } from '../../src/index.ts';
import rust from '../../../rust/src/index.ts';
import { getActiveBackend } from '../../../rust/src/backend.ts';

const status = getActiveBackend();
if (status.name !== 'native') throw new Error('native backend unavailable');
const live = (): number => status.native.liveTreeCount();
async function settle(target: number): Promise<void> {
	for (let round = 0; round < 20 && live() > target; round += 1) {
		globalThis.gc!();
		await new Promise((resolve) => setTimeout(resolve, 25));
	}
}
const engine = await createEngine(rust);
const base = live();
const report: Record<string, unknown> = {};

// A built node around a parsed leaf: nothing else of the leaf's tree stays reachable.
const held = (() => {
	const leaf = (engine.parse('fn g() {}\n').statements()[0] as any).name();
	return engine.build.binaryExpression({ left: leaf, operator: '+', right: engine.build.identifier('y') });
})();
report.before = String(engine.render(held));
await settle(base);
report.heldCount = live() - base;
report.after = String(engine.render(held));

// Trees nothing names are released.
for (let i = 0; i < 50; i += 1) engine.parse(`fn dropped${i}() {}\n`);
await settle(base + 1);
report.droppedCount = live() - base;

// A tree outlives a disposed engine, and is released once its node is gone.
let orphan: unknown = await (async () => {
	const short = await createEngine(rust);
	const node = short.parse('fn orphan() {}\n').statements()[0];
	short.dispose();
	return node;
})();
report.orphanRender = String(engine.render(orphan as never));
orphan = undefined;
await settle(base + 1);
report.afterOrphanCount = live() - base;

console.log(JSON.stringify(report));
```

```ts
// add to packages/rust/tests/tree-table.test.ts
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

it('keeps a tree while a parsed object names it and releases it after', () => {
	const fixture = fileURLToPath(new URL('../../common/tests/fixtures/tree-release.mts', import.meta.url));
	const out = execFileSync(process.execPath, ['--expose-gc', '--import', 'tsx', fixture], {
		encoding: 'utf8',
		env: { ...process.env, SITTIR_BACKEND: 'native' }
	});
	expect(JSON.parse(out.trim().split('\n').at(-1)!)).toEqual({
		before: 'g + y',
		heldCount: 1,
		after: 'g + y',
		droppedCount: 1,
		orphanRender: 'fn orphan() {}',
		afterOrphanCount: 1
	});
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd packages/rust && pnpm exec vitest run tests/tree-table.test.ts`
Expected: FAIL. `heldCount` is 0 and the fixture throws at `report.after` ("names tree N, which is not live…"): the leaf holds only a `$handle` number. (`orphanRender` also fails until Task 4.)

- [ ] **Step 3: Stamp the token on every parsed object**

In `engine.ts`:

```ts
export interface TreeToken {
	readonly treeId: number;
}

const liveTokens = new WeakSet<object>();

/** Whether `value` is a tree token minted on this thread. */
export function isLiveToken(value: unknown): boolean {
	return typeof value === 'object' && value !== null && liveTokens.has(value);
}

function holdTree(value: unknown, token: TreeToken): void {
	if (Array.isArray(value)) {
		for (const item of value) holdTree(item, token);
		return;
	}
	if (value === null || typeof value !== 'object') return;
	const record = value as Record<string, unknown>;
	if ('$type' in record) record.$tree = token;
	for (const key in record) {
		if (key.charCodeAt(0) === 95 || key === '$other' || key === '$_trivia') holdTree(record[key], token);
	}
}
```

In `parseAndRead`: `const liveToken: TreeToken = Object.freeze({ treeId: parsed.treeId }); liveTokens.add(liveToken); holdTree(root, liveToken);` before the registration, and in `read`, call `holdTree(cached, liveToken)` on a freshly read root and `holdTree(node, liveToken)` on each hydrated node before returning it. `diagnostics.readUntypedNode` (the raw call without a tree handle) returns data without a token; its callers hold the tree handle.

In `transport-data.ts`: `const COORDINATE_KEYS = [...HANDLE_KEYS, '$span', '$childIndex', '$textOnly', '$tree'] as const;` and confirm `toTransportValue` deletes `$tree` on both of its paths (the fold builds a coordinate from named keys; the rebuild path deletes the coordinate keys). `detachCoordinates` removes the same list.

In `packages/tools/src/validate/factory-render-parse.ts`, add `'$tree'` to `IGNORED_NODE_KEYS`.

- [ ] **Step 4: Run the test; measure the stamp**

Run: `cd packages/rust && pnpm exec vitest run tests/tree-table.test.ts`
Expected: `before`, `heldCount`, `after`, `droppedCount` match; `orphanRender` still throws (Task 4), so the test stays red on that key only. Temporarily compare the first four keys to confirm, then restore the full expectation.

Measure the read, deep and shallow: `pnpm exec tsx scratchpad/arena-baseline/loop-deep-read.mts` in the main checkout before and after (per-node time of `parse(source, { deep: true })`, and of a default parse followed by reading each child). Record all four numbers in the commit message and report them either way. If the stamp adds more than 10% to a deep read, stop and report rather than optimise.

- [ ] **Step 5: Gate and commit**

Run: `pnpm run type-check && pnpm run lint`, `pnpm run validate:native`, the baseline check (`SITTIR_BACKEND=native npx tsx packages/tools/src/scripts/collect-baseline.ts > head.json; npx tsx packages/tools/src/scripts/check-baseline-regression.ts --base packages/tools/baselines/native.json --head head.json`), then `pnpm exec vitest run`.
Expected: rows identical to the baseline; the suite green except `tree-table.test.ts`'s orphan key. Any test that pins a parsed object's exact key list (`Object.keys`) now sees `$tree`: add it to that expectation and name the test in the commit message.

```bash
git commit -m "feat(engine): every parsed object a read returns holds its tree" -- packages/common packages/tools/src/validate/factory-render-parse.ts packages/rust/tests
```

### Task 4: Render through the engine it is called on

**Files:**
- Modify: `packages/common/src/create-engine.ts`
- Test: `packages/rust/tests/tree-table.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// add to packages/rust/tests/tree-table.test.ts
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe('rendering parts parsed by other engines of the language', () => {
	const nameOf = (engine: Awaited<ReturnType<typeof createEngine<typeof rust>>>, source: string) =>
		(engine.parse(source).statements()[0] as any).name();

	it('renders a node built around a part another engine parsed', async () => {
		const a = await createEngine(rust);
		const b = await createEngine(rust);
		const mixed = a.build.binaryExpression({ left: nameOf(b, 'fn f() {}\n'), operator: '+', right: a.build.identifier('y') });
		expect(String(a.render(mixed))).toBe('f + y');
		expect(String(b.render(mixed))).toBe('f + y');
	});

	it('renders a parsed node edited to hold a part another engine parsed', async () => {
		const a = await createEngine(rust);
		const b = await createEngine(rust);
		const edited = (a.parse('fn g() {}\n').statements()[0] as any).$with.name(nameOf(b, 'fn f() {}\n'));
		expect(String(a.render(edited))).toBe('fn f() {}');
	});

	it('renders parts of several engines in one node', async () => {
		const [a, b, c] = await Promise.all([createEngine(rust), createEngine(rust), createEngine(rust)]);
		const one = (b.parse('fn f() {\n    a;\n}\n').statements()[0] as any).body().statements();
		const two = (c.parse('fn g() {\n    b;\n}\n').statements()[0] as any).body().statements();
		expect(String(a.render(a.build.block({ statements: [...one, ...two] })))).toBe('{\n    a;\n    b;\n}');
	});

	it('renders a node whose parsing engine is disposed, and its own $render still refuses', async () => {
		const a = await createEngine(rust);
		const b = await createEngine(rust);
		const item = b.parse('fn real() {}').statements()[0];
		b.dispose();
		expect(String(a.render(item as never))).toBe('fn real() {}');
		expect(() => (item as any).$render()).toThrow(/engine disposed.*engine\.render\(node\)/);
	});
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `cd packages/rust && pnpm exec vitest run tests/tree-table.test.ts`
Expected: the several-engines case fails with `several engines (rust#…)`, the disposed case with `engine disposed`.

- [ ] **Step 3: Delete the walk and the hand-off**

In `create-engine.ts`: delete `collectReaders`, `isRecord` (if now unused), `engineCount`, `serials`, `labelOf`, and the `isParsedNode`/`isLive` imports that only they used. `render` becomes:

```ts
		render(node: RenderArgument<API>, renderOptions?: API['options'] & RenderCallOptions) {
			const target = typeof node === 'function' ? node(build) : node;
			const stamp = engineOf(target);
			if (stamp !== undefined && !sameLanguage(stamp, identity)) {
				throw new Error(`cannot render a ${stamp.language.name} node through a ${language.name} engine`);
			}
			return renderNative(target, renderOptions);
		},
```

and the tail of `assembleEngine` loses the serial bookkeeping (`handle.current = engine; return Object.freeze(engine);`).

- [ ] **Step 4: Run the tests**

Run: `cd packages/rust && pnpm exec vitest run tests/tree-table.test.ts`
Expected: all pass, including Task 3's `orphanRender`.

Commit together with Task 5 (the old tests fail until they are flipped).

### Task 5: Flip the tests that pinned the old rules

**Files:**
- Modify: `packages/rust/tests/bound-nodes.test.ts`
- Modify: `packages/common/tests/engine-nodes.test.ts`
- Modify: `packages/rust/tests/coordinate-engine-identity.test.ts`
- Modify: `docs/glossary/packages-common-src.md`

Each test, the rule it pinned, and what replaces it:

| Test | Rule it pinned | Becomes |
| --- | --- | --- |
| `bound-nodes.test.ts` › "is rendered by the one engine that parsed its children, with the calling engine options" | the render is handed to the reading engine | "is rendered by the calling engine, with its options"; same expected text |
| `bound-nodes.test.ts` › "is refused, naming the engines, when its parsed children come from several" | several reading engines are refused | "renders when its parsed children come from several engines": `third.render(block)` and `block.$render()` both return the block text |
| `engine-nodes.test.ts` › "renders through the one engine that parsed its children, with the calling engine options" | hand-off; options merged over the reader's | "renders through the calling engine": `String(a.render(built))` is `'A:>:3'`, `built.$render()` is `'A:>:3'`, with `{ indent: '!' }` it is `'A:!:3'` |
| `engine-nodes.test.ts` › "throws, naming the engines, when the parsed children come from several" | several-engines refusal | "renders parsed children of several engines": `String(a.render(built))` is the fake engine's `A:…` text |
| `engine-nodes.test.ts` › "names a disposed reader by its serial" | engine serials in the refusal | deleted: there is no refusal and no serial |
| `engine-nodes.test.ts` › "throws when a parsing engine is disposed" | a disposed reader is refused | "renders what a disposed engine parsed": `String(a.render(built))` succeeds |
| `coordinate-engine-identity.test.ts` › "renders a node read by another engine through the engine that read it" | a coordinate names its engine | file header and title reworded: a coordinate names its tree, and any engine of the language renders it; same assertion |
| `tree-identity-and-verbatim.test.ts` › three tests under "parsed trees are released" | per-engine count; `dispose()` to zero; release through an engine | removed in Task 2, replaced by `tree-table.test.ts` |

- [ ] **Step 1:** Make the edits in the table. For the fake-language tests read the fake engine's render (`engineOf(fakeLanguage('fake'), '>')` at the top of `engine-nodes.test.ts`) to write the exact expected string; run the test once to confirm the letter it prints for the calling engine and pin that.
- [ ] **Step 2:** Glossary `docs/glossary/packages-common-src.md`: delete the `collectReaders` entry and the engine-label entry; in `assembleEngine`'s entry replace the sentences from "`render` takes a node…" through "…is refused." with: "`render` takes a node, or a callback that receives the scoped builders, and renders it through this engine with this engine's options under the call's. A node stamped with another language is refused, naming both. A node may hold parts parsed by any engines of the language: a coordinate names its tree, and the language's table holds every tree." and replace the `dispose` sentence with "`dispose` swaps the handle's engine for the identity and frees the native engine; trees are not released by it." Delete the final sentence about applying options over the reading engine's.
- [ ] **Step 3: Gate and commit**

Run: `pnpm run type-check && pnpm run lint`, then `pnpm exec vitest run`.
Expected: 0 failures.

```bash
git commit -m "feat(engine): render depends only on the tree a coordinate names" -- packages/common packages/rust/tests docs/glossary/packages-common-src.md
```

### Task 6: A coordinate from another thread is refused

**Files:**
- Modify: `packages/common/src/transport-data.ts`
- Create: `packages/common/tests/fixtures/tree-worker.mjs`, `packages/common/tests/fixtures/tree-clone-worker.mts`
- Test: `packages/rust/tests/tree-table.test.ts`

**Interfaces:**
- Consumes: `isLiveToken` (Task 3).

- [ ] **Step 1: Write the failing tests**

```js
// packages/common/tests/fixtures/tree-worker.mjs — the worker: its own addon instance, table and id counter
import { parentPort, workerData } from 'node:worker_threads';
import { createRequire } from 'node:module';
const native = createRequire(import.meta.url)(workerData.loader);
const engine = new native.SittirEngine();
const before = native.liveTreeCount();
const read = JSON.parse(engine.parseAndRead('fn worker() {}'));
parentPort.postMessage({ before, after: native.liveTreeCount(), treeId: read.treeId });
```

```ts
// add to packages/rust/tests/tree-table.test.ts
import { Worker } from 'node:worker_threads';

it('gives each worker thread its own table and its own tree ids', async () => {
	const native = addon();
	const kept = new native.SittirEngine();
	const mine = treeIdOf(kept.parseAndRead('fn main_thread() {}'));
	const held = native.liveTreeCount();
	const loader = fileURLToPath(new URL('../native/index.cjs', import.meta.url));
	const fixture = fileURLToPath(new URL('../../common/tests/fixtures/tree-worker.mjs', import.meta.url));
	const message = await new Promise<{ before: number; after: number; treeId: number }>((resolve, reject) => {
		const worker = new Worker(fixture, { workerData: { loader } });
		worker.once('message', resolve);
		worker.once('error', reject);
	});
	expect(message).toEqual({ before: 0, after: 1, treeId: 0 });
	expect(native.liveTreeCount()).toBe(held);
	native.disposeTree(mine);
});

it('refuses read data cloned in from another thread', async () => {
	const engine = await createEngine(rust);
	const leaf = (engine.parse('fn f() {}\n').statements()[0] as any).name();
	const fixture = fileURLToPath(new URL('../../common/tests/fixtures/tree-clone-worker.mts', import.meta.url));
	const message = await new Promise<{ rendered?: string; error?: string }>((resolve, reject) => {
		const worker = new Worker(fixture, { workerData: { leaf: { ...leaf } }, execArgv: ['--import', 'tsx'] });
		worker.once('message', resolve);
		worker.once('error', reject);
	});
	expect(message.rendered).toBeUndefined();
	expect(message.error).toMatch(/another thread's tree table.*parse the source on this thread/);
});
```

```ts
// packages/common/tests/fixtures/tree-clone-worker.mts — the receiving thread: it parses its own tree first,
// so the cloned leaf's tree id names a live tree here and only the token check can refuse it
import { parentPort, workerData } from 'node:worker_threads';
import { createEngine } from '../../src/index.ts';
import rust from '../../../rust/src/index.ts';

const engine = await createEngine(rust);
const own = engine.parse('fn zzzzzz() {}\n');
try {
	const built = engine.build.binaryExpression({ left: workerData.leaf, operator: '+', right: engine.build.identifier('y') });
	parentPort!.postMessage({ rendered: String(engine.render(built)), own: own.statements().length });
} catch (error) {
	parentPort!.postMessage({ error: (error as Error).message });
}
```

- [ ] **Step 2:** Run: `cd packages/rust && pnpm exec vitest run tests/tree-table.test.ts`. Expected: the worker test passes already (Task 1 made the table thread-local); the clone test fails: the worker renders text from its own tree (`message.rendered` is defined). If the worker cannot load the TypeScript sources under `--import tsx`, fix the fixture's loading before going on; the test must reach the render.
- [ ] **Step 3:** In `transport-data.ts`, in `foldToCoordinate`'s caller (`toTransportValue`, the branch `if (canFold(value))`), before folding:

```ts
	if (canFold(value)) {
		if (value.$tree !== undefined && !isLiveToken(value.$tree)) {
			throw new Error("this node is a coordinate from another thread's tree table and names no tree here; parse the source on this thread, or send the rendered text instead of the node");
		}
		return foldToCoordinate(value);
	}
```

A coordinate with no `$tree` at all (raw diagnostics data, test fixtures) is left to the native table, which refuses an unknown tree by name.
- [ ] **Step 4:** Run the test: both pass. Gate: `pnpm run type-check && pnpm run lint`, `pnpm exec vitest run`.
- [ ] **Step 5:** Commit: `git commit -m "feat(engine): read data from another thread is refused at render" -- packages/common packages/rust/tests`

### Task 7: Final gate

- [ ] **Step 1:** `pnpm run validate:native`, then the baseline check. Expected: `no regression: backend=native totals.pass 11992→11992, totals.fail 3→3`, and every grammar's row equal to `packages/tools/baselines/native.json`.
- [ ] **Step 2:** `rtk cargo test --workspace --no-default-features` (0 failures), `pnpm run type-check`, `pnpm run lint`, `pnpm run gen:examples`, `pnpm run type-check:generated-examples`.
- [ ] **Step 3:** `pnpm exec vitest run` as its own call: 0 failures.
- [ ] **Step 4:** Run the issue's reproduction (`scratchpad/trees.mts` from the issue body, `pnpm exec tsx --expose-gc scratchpad/trees.mts`). Expected output: all four lines render (`"f + y"`, `"f + y"`, `"g + y"`, `"g + y"`).
- [ ] **Step 5:** Run `scratchpad/arena-baseline/engine-wrap-real.mts` before and after and record the per-node render time; the walk (1.54 µs per node) should be gone from the render path.
- [ ] **Step 6:** Open the PR. Body starts `Owner: sittir-engine-api`, links #540, lists every flipped test with the rule it pinned (the table in Task 5), states the worker-thread rule, the deep-read stamp cost from Task 3, and that ABI 8 requires every addon rebuilt.

## Self-review notes

- Spec coverage: design points 1 (Task 1), 2 (Tasks 4–5), 3 (Task 3), 4 (Tasks 1–2: `dispose` leaves trees), 5 (Task 2). "Done when" bullets: Task 4 tests (first), Task 3 fixture (second and third: alive, disposed and collected engines), Task 7 (fourth).
- The engine-collected case is covered by the fixture's `orphan` block: `short` goes out of scope after `dispose()` and its tree is still released by the addon function.
- `last_tree_id` can name a released tree; the render reads it with `.and_then(get)`, so a released tree simply contributes no format.
