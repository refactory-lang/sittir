# Node Members in the Builder's Literal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every built and wrapped node of all five grammars carries all its members in the literal that creates it, so no node is a V8 dictionary-mode object and no helper runs on a node after it is built.

**Architecture:** The emitters write the members (readers, `$with` setters, `$render`/`$toEdit`/`$replace`, `$trivia` positions, `$engine`, list view, group seat) inline in the factory and wrap literals; the logic those members call is written once in `@sittir/common` as plain functions taking the node and its engine handle. The native boundary and the key walkers stop reading "every enumerable key" and select keys by prefix. Conversion goes class by class (text leaves and plain kinds, group seats, list owners, separated lists), one regeneration per class, so the suite stays green between tasks; the one public change (`$trivia` stops being callable) lands first, on its own.

**Tech Stack:** TypeScript (ESM, `.ts` imports), vitest, V8 `--allow-natives-syntax` for the shape gate, the codegen emitters in `packages/codegen/src/emitters`, `@sittir/common` runtime, napi native bindings (unchanged).

**Spec:** https://github.com/refactory-lang/sittir/issues/534 (the design is the user's and is not reopened here; probes and numbers in the main checkout's ignored `scratchpad/arena-baseline/`).

**Planned against:** master `9f6457a00` plus the open chain #527, #528, #524, #533, #535 (merged into a throwaway reference tree, no conflicts in code; `restItems` in every list `$with` setter, `StringIndexRange` in `$toEdit`/`$replace`, owner overlay dispatch in `emitters/overlays/polymorphs.ts`). Start code only after the chain merges; Task 1 re-confirms the base.

## Global Constraints

- DRY is the first rule: the member text is written once in `packages/codegen/src/emitters/node-members.ts` and used by both the factory and the wrap emitters; the member logic is written once in `packages/common/src/utils.ts`.
- Generated outputs (`packages/{rust,python,typescript,scm,regex}/src/*`, `.sittir/*`, `rust/crates/sittir-*/src/*`) are never hand-edited; fix the emitter and regenerate (`pnpm run regen:all`).
- Explanatory comments do not live in `packages/codegen/src/`; they go in the per-directory glossaries under `docs/glossary/`, one `###` section per declaration. Hand-written public API (`@sittir/types` node surface, `TriviaSetter`) carries JSDoc with the usage contract only. No comment or doc references an issue, PR, plan or task number.
- Compile-time over runtime checks: a missing fact fails at compile time. No new TS-side runtime guards.
- TypeScript is ESM; local imports use `.ts` extensions; the generated grammar graph stays erasable-syntax only.
- Pathspec commits only: `git commit -- <paths>`. Every PR body starts with an `Owner:` line. Merge master into the branch; never rebase.
- A failed gate stops the work for review; nothing is reverted to make a gate pass. A moved validation row or an unexpected generated diff under a "no output change" task is reported with the sites.
- Gates for every task that changes emitted code: `pnpm run regen:all` clean; `pnpm -r build`; `pnpm run type-check`; `pnpm run lint`; `pnpm exec vitest run` as its own call; `env -u INFIGRAPH_WATCH_DAEMON cargo test --workspace --no-default-features`; `pnpm run validate:native` rows identical to the previous recorded run (`pnpm run validate:history`).
- Work in `scratchpad/wt-534` (branch `feat/node-members-in-literal` off master); natives are rebuilt through `gen`/`regen:all`, never cargo + cp.

## Review Focus

The inputs and conditions the issue implies but no task's main tests exercise. Each has a test in the owning task.

1. **A node built outside any engine** (no handle): `$render`, `$toEdit`, `$replace` and every `$trivia` position throw `node has no engine`; `$engine` reads `undefined`; `$with` setters still rebuild. Same shape class as the engine-bound node. (Task 4, Task 5)
2. **A read-stub owner** (a parsed list owner whose list has not been read): `Object.keys`, a spread, `toTransportData` and `isEmptyNode` must not trigger its throwing `length` getter and must not hydrate any stub. (Task 3, Task 8)
3. **Duplicate member keys**: an accessor that spells a list-view member (`at`, `map`, `length`, ...), or a seated key that spells another reader, would silently replace a member in an object literal. The emitter must pick one deliberately and a census over all five grammars must find none left by accident. (Task 7, Task 8)
4. **Trivia carried through `$with`**: a setter hands the source node's trivia to its result; inner comments refuse a result that is no longer empty (same message); a node that gets trivia attached after it was built stays fast. (Task 4, Task 5)
5. **Kinds with no inner gap**: `node.$trivia.inner` and `.innerAt` are absent on them (types already say so), so calling them is a `TypeError` instead of the old "has no inner gap" message; nothing pins the old message today (searched), the new behaviour gets a type-level pin and a runtime test. (Task 2, Task 5)

---

## What the two pre-planning checks found

### 1. Key walkers in `packages/tools` (and the ones in `@sittir/common`)

Today a built node's readers, `$trivia`, `$engine` and list members are non-enumerable; `$render`, `$toEdit`, `$replace` and `$with` are enumerable functions; a wrapped node already has enumerable readers. After the change every member is enumerable, `$trivia` is an object (not a function) and a list node carries indices, `length`, its options and 29 methods. A walker is affected if it receives a built or wrapped node (not plain native read data) and iterates keys without a prefix filter.

| Site | Receives | Verdict | Disposition |
|---|---|---|---|
| `tools/src/validate/common.ts` `materializeValue` (L951) | wrapped nodes | **breaks**: its last branch copies every non-function key; it would copy the `$trivia` object, `$engine: undefined`, list indices, `length`, options | select keys with the shared `isDataKey` (Task 3) |
| `tools/src/exercise/roundtrip.ts` `toRenderableNode` (L196) | wrapped nodes | **breaks**: copies every non-function `$` key, so `$trivia` becomes `{}` and `$engine: undefined` appears on the renderable node | same predicate (Task 3) |
| `tools/src/exercise/walk.ts` `collectChildren` (L70) | wrapped nodes | **changes**: calls every zero-arity function member that is not `$`/`_` prefixed; wrapped readers already match, a list node's `keys()`, `values()`, `entries()`, `toString()` would now be called as if they were readers | name the readers instead: call only members whose `_<slot>` storage key exists (Task 3) |
| `tools/src/validate/common.ts` L316, L343, L913, L1242, L1261, L1953; `from.ts` L56, L110, L124; `factory-render-parse.ts` `storageKeysOf` (L161); `read-projection.ts` L145; `probe/kind.ts` L1206, L1240; `read-render-parse.ts` L370 | built or wrapped nodes | **safe**: every one filters by `_` prefix or `$type`/`$other` | none; Task 3 adds a regression test that feeds them an enumerable-member node |
| `read-render-parse.ts` `walk` (L387), `trivia-placement.ts` (L72), `uncovered-content.ts` (L117, L168), `profile/*`, `corpus/*`, `probe/stages.ts` | plain native read data (`readNativeTree`, `$handle` keys) | **unaffected**: not typed nodes | none |
| `common/src/transport-data.ts` `toTransportValue` (L171), `isUntouchedBelow` (L67), `isDerivedFromText` (L45), `detachCoordinates` (L213), `holdsSlots` (L28) | built and wrapped nodes | `toTransportValue` **breaks** (copies `$trivia`, `$engine`, list members; the native boundary rejects function-valued keys and has no `$trivia` field); the others are correct but pay for walking every key | select by key prefix; read only the selected keys (Task 3) |
| `common/src/create-engine.ts` `collectReaders` (L107, L114), `common/src/utils.ts` `isEmptyNode` (L113), `isNode` (L502) | built and wrapped nodes | correct (prefix filtered) but allocate an entries array per node and scan more keys | loop keys with the prefix test; `isNode` uses `holdsSlots` (Task 3) |
| `common/src/transport-data.ts` `detachCoordinate` (L141) | the node being edited | uses `delete`, which makes that one node dictionary-mode | runs only on an inner-trivia write to an empty node; left as is, listed in the PR notes |

Also `common/src/utils.ts` `setTriviaData` assigns `$_trivia` onto the node after it is built. That is one added data property (a second shape for nodes that carry trivia, still fast); Task 5 pins it.

### 2. What dictionary mode costs on parsed nodes

Measured with `scratchpad/probes/parsed-cost.mts` (master + the chain, release native, Apple M4 Pro, Node 26.10). "Copies" are ordinary objects with the same enumerable keys (so the only difference is the V8 representation).

| | nodes reached | fast properties | `toTransportData(root)` on the nodes | on same-shape copies | `engine.render` of the untouched tree | `Object.keys` + prefix per node, nodes / copies |
|---|---|---|---|---|---|---|
| rust `engine.rs`, deep parse | 3,272 | 1,006 (69% dictionary) | 3,302 µs | 515 µs (6.4x) | 3,236 µs | 159 / 35 ns |
| typescript `create-engine.ts`, deep parse | 2,109 | 740 (65% dictionary) | 1,848 µs | 362 µs (5.1x) | 1,852 µs | 148 / 38 ns |
| rust, shallow parse | 1,771 | 710 | 15 µs | 14 µs (stubs; nothing to walk) | 6 µs | n/a |

An untouched parsed tree renders as one coordinate, but proving it is untouched (`canFold` → `isUntouchedBelow`) walks every node, so the render time of a deep parse is that walk: about 1.0 µs per node today against about 0.16 µs on fast objects. Reading `$type` and calling a reader cost the same either way (the engine's reads hydrate stubs, which dominates). So the cost sits in whole-tree walks, not in single property reads; the same shape as the built-tree numbers in the issue (3.5 µs against 0.96 µs per node). Task 1 turns these into the before/after probe.

## Open questions for sittir-brainstorm (answers wanted before the named task)

1. **List methods: spread or named (Task 8).** The issue says the 29 shared methods are "named in the literal". Naming them costs 29 lines per list owner in generated output (about 3,000 lines across rust 33, typescript 15, python 38 sites); one `...LIST_METHODS` spread costs one line and measured 58 ns against 28 ns for a three-slot node in the baseline probe (`literal-members.mjs`, "literal spreads one members object"). Recommendation: spread, with Task 8's gate holding the list-owner build to within 1.5x of the issue's named figure (125 ns); if it does not, name them. Needs your yes because the issue words it as naming.
2. **Absent `inner` positions (Review Focus 5).** Kinds without an inner gap lose `$trivia.inner`/`innerAt` entirely, so a call is a `TypeError: ... is not a function`. The issue says so; confirming that no friendlier error is wanted.
3. **Wrap literal with the read record spread (Task 6).** Wraps are written `{ ...data, $type, ... }`. If a spread of the read record keeps the node fast (expected, one shape per kind) nothing changes; if it does not, the wrap needs its slots written out, which is a larger emitter change. Task 6 starts with a spike that answers this; I will stop and report if it fails.

---

## File Structure

| File | Responsibility |
|---|---|
| `packages/common/src/utils.ts` | The member logic as plain functions: `renderText`, `rebuilt`, `triviaSide`, `triviaInner`, `triviaInnerAt`, `listItems`, `LIST_ITEMS`, `LIST_METHODS`, `listIterator`, `listSlotWith`, `elementsWith`, `seatWith`, `isDataKey`. The old helpers (`withMethods`, `withAccessors`, `withListView`, `withListSlots`, `withElementsSeat`, `withGroupSeat`, `carryTriviaThroughWith`, `bindEngine`, `triviaSetterOf`) stay until Task 10. |
| `packages/common/src/transport-data.ts` | `isDataKey` selection in `toTransportValue`; prefix loops in the walkers. |
| `packages/common/src/runtime.ts`, `packages/codegen/src/emitters/client-utils.ts` | `withMethods` leaves `bindRuntime` and each grammar's generated `utils.ts` (Task 10). |
| `packages/codegen/src/emitters/node-members.ts` (new) | One emitter function that returns the member lines of a literal (readers, `$with` entries, `$render`..`$engine`, `$trivia`, seat and list members). Used by `factories.ts` and `wrap.ts`. |
| `packages/codegen/src/emitters/factories.ts`, `wrap.ts` | Replace the `withMethods(...)` nesting at their emit sites with the literal from `node-members.ts`; `seatRuntimes`/`seatOpening`/`seatClosing` go in Task 10. |
| `packages/types/src/core-types.ts`, `engine-api.ts` | `TriviaSetter` loses its call signature. |
| `packages/tools/src/scripts/node-shape.ts` (new), `packages/tools/tests/node-shape.test.ts` (new) | The shape gate and the before/after probe. |
| `packages/tools/src/validate/common.ts`, `exercise/roundtrip.ts`, `exercise/walk.ts` | The three walkers above. |
| `docs/glossary/{emitters,packages-common-src,packages-types-src,packages-tools-src}.md`, `docs/use-cases-and-examples.md`, `packages/{rust,typescript,python}/README.md` | Glossary entries for what is added and removed; the `$trivia` usage lines. |

---

### Task 1: The shape gate and the before/after probe

**Files:**
- Create: `packages/tools/tests/node-shape.test.ts`
- Create: `packages/tools/src/scripts/node-shape.ts`
- Modify: `package.json` (script `probe:node-shape`)

**Interfaces:**
- Produces: `pending` (a `Set<string>` in the test) naming the classes not yet converted; each class task deletes its labels, which turns its `it.fails` into a passing assertion. `measureNodeShape(grammar)` in the script returns `{ built: Record<string, number>, parsed: { nodes: number; fast: number; toTransportUs: number; renderUs: number }, listOwnerBuildNs: number }`.

- [ ] **Step 1: Refresh the base.** Merge origin/master into the branch; confirm the chain (#527, #528, #524, #533, #535) is in master (`git log --oneline origin/master -12`). Regenerate and rebuild natives (`pnpm run regen:all`) so `createEngine` loads. If the chain is not merged, stop and ask sittir-brainstorm.

- [ ] **Step 2: Write the failing shape test.**

```ts
import v8 from 'node:v8';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../../rust/src/index.ts';
import typescript from '../../typescript/src/index.ts';
import python from '../../python/src/index.ts';

v8.setFlagsFromString('--allow-natives-syntax');
const hasFastProperties = new Function('o', 'return %HasFastProperties(o)') as (o: object) => boolean;
const COUNT = 1000;
const fastCount = (make: () => object): number => Array.from({ length: COUNT }, make).filter(hasFastProperties).length;

const rs = await createEngine(rust);
const ts = await createEngine(typescript);
const py = await createEngine(python);

const parsedMatchBlock = () => {
	const item = rs.parse('fn f() { match x { 1 => 1, _ => 2 } }\n').statements()[0]!;
	if (!rs.is.functionItem(item)) throw new Error('not a function');
	const statement = item.body().statements()[0]!;
	if (!rs.is.expressionStatement(statement)) throw new Error('not an expression statement');
	const expression = statement.content();
	if (!rs.is.matchExpression(expression)) throw new Error('not a match');
	return expression.body();
};
const arms = parsedMatchBlock().matchBlockArms();

const classes: Record<string, () => object> = {
	'rust text leaf': () => rs.build.identifier('x'),
	'rust plain kind': () => rs.build.binaryExpression({ left: rs.build.identifier('a'), operator: '+', right: rs.build.identifier('b') }),
	'rust group seat, group present': () => rs.build.matchBlock(arms),
	'rust group seat, group absent': () => rs.build.matchBlock(),
	'rust list owner': () => rs.build.arguments(rs.build.identifier('a'), rs.build.identifier('b'), rs.build.identifier('c')),
	'typescript text leaf': () => ts.build.identifier('x'),
	'typescript plain kind': () => ts.build.binaryExpression({ left: ts.build.identifier('a'), operator: '+', right: ts.build.identifier('b') }),
	'typescript group seat': () => ts.build.catchClause({}),
	'python text leaf': () => py.build.identifier('x'),
	'python group seat': () => py.build.slice({})
};

const pending = new Set(Object.keys(classes));

describe('a built node keeps fast properties', () => {
	for (const [label, make] of Object.entries(classes)) {
		const run = () => expect(fastCount(make)).toBe(COUNT);
		(pending.has(label) ? it.fails : it)(label, run);
	}
});

const walkTyped = (root: unknown): object[] => {
	const seen = new Set<object>();
	const camel = (slot: string) => slot.replace(/^_/, '').replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
	const walk = (node: any): void => {
		if (node === null || typeof node !== 'object') return;
		if (Array.isArray(node)) return node.forEach(walk);
		if (seen.has(node)) return;
		seen.add(node);
		for (const key of Object.keys(node)) {
			if (!key.startsWith('_') || node[key] == null) continue;
			const reader = node[camel(key)];
			walk(typeof reader === 'function' ? reader.call(node) : node[key]);
		}
	};
	walk(root);
	return [...seen].filter((node) => typeof (node as { $type?: unknown }).$type === 'number');
};

describe('a parsed node keeps fast properties', () => {
	const source = 'fn f(a: i32) { let x = g(a, a + 1); match x { 1 => 1, _ => 2 } }\n';
	for (const deep of [false, true]) {
		(pending.has('parsed') ? it.fails : it)(deep ? 'deep parse' : 'shallow parse', () => {
			const nodes = walkTyped(rs.parse(source, deep ? { deep: true } : undefined));
			expect(nodes.length).toBeGreaterThan(10);
			expect(nodes.filter((node) => !hasFastProperties(node))).toEqual([]);
		});
	}
});
```

(`pending.add('parsed')` is added to the set literal: `new Set([...Object.keys(classes), 'parsed'])`.)

- [ ] **Step 3: Run it and see it fail for the right reason.**
Run: `pnpm exec vitest run packages/tools/tests/node-shape.test.ts`
Expected: every `it.fails` passes (the assertions fail today: 0 or 1 of 1000 are fast). A class that passes without `fails` means the pending set is wrong.

- [ ] **Step 4: Write the probe script.** `packages/tools/src/scripts/node-shape.ts` exports `measureNodeShape(grammar)` and prints a table when run directly. It reuses the same class builders as the test (move them to `packages/tools/tests/support/node-shape-classes.ts` and import from both), and adds: (a) `engine.render` per node over 400 trees of `letDeclaration(chain(6))` against the copies-into-ordinary-objects baseline from the issue; (b) `toTransportData` per node; (c) `engine.build.arguments(x, y, z)` and `binaryExpression` build time (best of 15 rounds of 10,000); (d) for a deep parse of `rust/crates/sittir-core/src/engine.rs` and `packages/common/src/create-engine.ts`: nodes reached, fast count, `toTransportData(root)` and `engine.render(root)` best-of-8, with the same-shape copies column from the parsed-cost probe. Add `"probe:node-shape": "tsx packages/tools/src/scripts/node-shape.ts"` to `package.json`.

- [ ] **Step 5: Record the baseline.** Run `pnpm run probe:node-shape` on the unchanged tree and paste the output into the PR description's "Before" section (not committed).

- [ ] **Step 6: Gates and commit.** Type-check, lint, the new test, `pnpm exec vitest run` (own call). `git commit -m "test(tools): a shape gate and a before/after probe for node members" -- packages/tools/tests packages/tools/src/scripts package.json`.

**Gate:** the shape test is green with every class pending; the probe prints a baseline table.

---

### Task 2: The one public change: `$trivia` is positions only

**Files:**
- Modify: `packages/types/src/core-types.ts` (`TriviaSetter`, L149), `packages/types/src/engine-api.ts` (L45)
- Modify: `packages/common/src/utils.ts` (`TriviaSetterRuntime` L27, `triviaSetterOf` L130-178)
- Modify tests: `packages/common/tests/utils-runtime.test.ts` (L47, L51), `packages/rust/tests/trivia.test.ts`, `packages/typescript/tests/trivia.test.ts`, `packages/rust/tests/examples-verify.test.ts` (L162-174), `packages/rust/tests/bound-nodes.test.ts` (L83)
- Modify docs: `packages/{rust,typescript,python}/README.md` (the `$trivia(...)` line), `docs/use-cases-and-examples.md` (§3, L227-257), `README.md` (L143, L479), `docs/adr/0018-dehoist-nodedata-surface.md` is history and stays
- Test: `packages/types/tests` (a type-level pin), `packages/rust/tests/trivia-types.test-d.ts`

**Interfaces:**
- Produces: `TriviaSetter<Self, Trivia>` with `leading`/`trailing` overloads only; `InnerTrivia` unchanged. At runtime `$trivia` (still a getter on the old nodes) returns a plain object `{ leading, trailing, inner, innerAt }`, so every later task can rely on the positions alone.

- [ ] **Step 1: Write the failing type pin.** In `packages/rust/tests/trivia-types.test-d.ts` add, for a built function item `fn`, a line `fn.$trivia('// c');` preceded by `// @ts-expect-error $trivia is not callable`. Run `pnpm --filter @sittir/rust type-check`; expect `Unused '@ts-expect-error' directive`, because the call still type-checks today. Also add a runtime test in `packages/rust/tests/trivia-setter.test.ts`: `typeof fn.$trivia` is `'object'` and `fn.$trivia.leading('// c')` returns `fn`.
- [ ] **Step 2: Remove the call signature** from `TriviaSetter` (types) and from `TriviaSetterRuntime` (common); in `triviaSetterOf` return the positions object instead of `Object.assign(fn, positions)`; delete `isTriviaObject` if nothing else uses it.
- [ ] **Step 3: Migrate every call site.** `node.$trivia('// c')` becomes `node.$trivia.leading('// c')`; `node.$trivia({ leading: [a], trailing: [b] })` becomes `node.$trivia.leading(a).$trivia.trailing(b)`: positions return the node, so chain them; a call that passed two sides becomes two position calls. The test that asserts "last `$trivia()` call wins (overwrite)" keeps its meaning (the same position set twice) and is rewritten as position overwrite; the one that asserts the object form is deleted with a note in the commit message (the form is gone).
- [ ] **Step 4: Update the docs** (the three package READMEs, `docs/use-cases-and-examples.md` §3 already documents `$trivia.leading/trailing`; fix the surrounding prose that still shows the call form, README L143 and L479) and the `$trivia` JSDoc in `core-types.ts` (the contract: positions, what `leading()` with no items returns, that a write returns the node).
- [ ] **Step 5: Gates.** type-check (all packages), lint, vitest (own call), `validate:native` rows identical (no emitter change in this task, so the generated diff must be empty: `git status --short packages/*/src` shows nothing).
- [ ] **Step 6: Commit** with the public change named in the subject: `feat(surface)!: $trivia is its positions; node.$trivia(...) is no longer callable`.

**Gate:** zero generated diff; the 24 former call sites compile and pass; the type pin proves the call is rejected.

---

### Task 3: Projection and the walkers select keys; no node changes yet

**Files:**
- Modify: `packages/common/src/transport-data.ts` (add `isDataKey`; `toTransportValue` L166-186, `isUntouchedBelow` L62, `isDerivedFromText` L43, `detachCoordinates` L196)
- Modify: `packages/common/src/utils.ts` (`isEmptyNode` L112, `isNode` L498)
- Modify: `packages/common/src/create-engine.ts` (`collectReaders` L103-118)
- Modify: `packages/tools/src/validate/common.ts` (`materializeValue` L951), `packages/tools/src/exercise/roundtrip.ts` (`toRenderableNode` L196), `packages/tools/src/exercise/walk.ts` (`collectChildren` L68)
- Test: `packages/common/tests/transport-data-selection.test.ts` (new), `packages/tools/src/__tests__/node-key-walkers.test.ts` (new)

**Interfaces:**
- Produces: `isDataKey(key: string): boolean` in `transport-data.ts`, exported from `@sittir/common/utils`: true for a storage key (`_<slot>`, `$other`) and for a `$` metadata key that is not a member (`$with`, `$trivia`, `$engine`, `$render`, `$toEdit`, `$replace`); false for everything else (readers, list indices, `length`, options, symbol keys).

- [ ] **Step 1: Write the failing test.** A hand-written node in the new shape: every member enumerable.

```ts
import { describe, expect, it } from 'vitest';
import { toTransportData } from '../src/transport-data.ts';

const LIST_ITEMS = Symbol('items');
const newShapeList = () => {
	const items = ['a', 'b'];
	return {
		$type: 7, $source: 2, $named: true,
		_elements: items,
		$with: { elements: () => undefined },
		elements: () => items,
		length: 2, 0: 'a', 1: 'b', delimiter: 0,
		map: () => [], at: () => undefined,
		[LIST_ITEMS]: items,
		$render: () => 'x', $toEdit: () => ({}), $replace: () => ({}),
		$trivia: { leading: () => [], trailing: () => [] },
		$engine: undefined
	};
};

describe('toTransportData selects a node by key', () => {
	it('copies storage and $ metadata and nothing else', () => {
		expect(toTransportData(newShapeList() as never)).toEqual({ $type: 7, $source: 2, $named: true, _elements: ['a', 'b'] });
	});
	it('does not read a getter that throws', () => {
		const owner = { ...newShapeList() };
		Object.defineProperty(owner, 'length', { get() { throw new Error('read stub'); }, enumerable: false });
		expect(() => toTransportData(owner as never)).not.toThrow();
	});
});
```
Add the same node to `node-key-walkers.test.ts` and assert `materializeValue`, `toRenderableNode`, `collectChildren` (export them for test if they are not), `findUndefined`, `storageKeysOf`, `isEmptyNode` and `isNode` give the same result for it as for the old-shape node of the same data. Run: expect FAIL (`$trivia` copied).

- [ ] **Step 2: Implement `isDataKey` and use it.** In `toTransportValue` replace the `Object.entries` loop with `for (const key of Object.keys(value)) { if (!isDataKey(key)) continue; const raw = value[key]; out[key] = isStorageKey(key) ? toTransportValue(raw) : raw; }`. In `isUntouchedBelow`, `isDerivedFromText`, `detachCoordinates` and `collectReaders` loop `Object.keys` with the `_`/`$other` test and read only those. `isEmptyNode` loops keys with the `_` test. `isNode` replaces `Object.keys(o).some(...)` with `holdsSlots(o)`.
- [ ] **Step 3: Fix the three tools walkers.** `materializeValue`: skip any key that is not `isDataKey`. `toRenderableNode`: same predicate on the `$` loop. `collectChildren`: call a member only when `_<slot>` storage exists for it (derive the slot from the storage keys, as `roundtrip.ts` L204 already derives the getter name from them) instead of calling every zero-arity function.
- [ ] **Step 4: Gates.** The new tests pass; vitest (own call) unchanged; `validate:native` rows identical; zero generated diff.
- [ ] **Step 5: Commit** `refactor(common,tools): nodes are selected by key, so members may become enumerable`.

**Gate:** with today's nodes nothing moves (rows and generated output identical); with the hand-written new-shape node every walker agrees with the old shape. This task is what makes the emitter tasks safe to land one class at a time.

---

### Task 4: The member logic as plain functions in `@sittir/common`

**Files:**
- Modify: `packages/common/src/utils.ts`
- Test: `packages/common/tests/node-members.test.ts` (new; engine fixture from `tests/support/fake-engine.ts`, as `utils-runtime.test.ts` uses)

**Interfaces:**
- Produces (all exported from `@sittir/common/utils`; the old helpers stay):

```ts
export function renderText(handle: EngineHandle | undefined, node: AnyUntypedNode): string;
export function rebuilt<R>(node: AnyUntypedNode, handle: EngineHandle | undefined, build: () => R): R;
export function triviaSide(node: AnyUntypedNode, handle: EngineHandle | undefined, position: 'leading' | 'trailing', items: readonly unknown[]): AnyUntypedNode | readonly TriviaEntry[];
export function triviaInner(node: AnyUntypedNode, handle: EngineHandle | undefined, items: readonly unknown[]): AnyUntypedNode | readonly TriviaEntry[];
export function triviaInnerAt(node: AnyUntypedNode, handle: EngineHandle | undefined, gap: string, items: readonly unknown[]): AnyUntypedNode | readonly TriviaEntry[];
export const LIST_ITEMS: unique symbol;
export function listItems(elements: readonly unknown[], wrapper: ListViewWrapper | undefined): readonly unknown[];
export const LIST_METHODS: Readonly<Record<(typeof READONLY_ARRAY_METHODS)[number], (this: { readonly [LIST_ITEMS]: readonly unknown[] }, ...args: unknown[]) => unknown>>;
export function listIterator(this: { readonly [LIST_ITEMS]: readonly unknown[] }): IterableIterator<unknown>;
export function listSlotWith(args: readonly unknown[], spec: Omit<ListSlotSpec, 'slot'>, set: (...args: unknown[]) => unknown): unknown;
export function elementsWith(args: readonly unknown[], spec: ElementsSeatSpec, set: (...args: unknown[]) => unknown): unknown;
export function seatWith(node: object, spec: GroupSeatSpec, key: GroupSeatKey, args: readonly unknown[], seat: (...args: unknown[]) => unknown, readGroup: () => Members | undefined): unknown;
export { currentHandle } from './engine-scope.ts';
```

- [ ] **Step 1: Write the failing tests.** Port each existing assertion of `withMethods`, `withListView`, `withListSlots`, `withElementsSeat` and `withGroupSeat` (files `utils-runtime.test.ts`, `list-view.test.ts`, `elements-seat.test.ts`, `group-seat.test.ts`) to the function form on a hand-written literal node. Example for the first and the no-engine case:

```ts
it('renders through the handle it was built with, and refuses with none', () => {
	const render = vi.fn(() => 'rendered');
	const handle = liveHandle({ render, trivia: { kindName: () => 'k', kinds: new Set(), innerGaps: {} } });
	const node: any = { $type: 1, $source: 2, _name: 'x' };
	node.$render = () => renderText(handle, node);
	expect(node.$render()).toBe('rendered');
	expect(() => renderText(undefined, node)).toThrow('node has no engine');
});

it('rebuilt carries trivia and refuses inner comments on a node that is no longer empty', () => {
	const handle = liveHandle({ render: () => '', trivia: { kindName: () => 'k', kinds: new Set(), innerGaps: {} } });
	const source: any = { $type: 1, $source: 2, _a: undefined, $_trivia: { leading: [{ $type: 2, $source: 2, $text: '// c' }] } };
	const result = rebuilt(source, handle, () => ({ $type: 1, $source: 2, _a: 'v' }));
	expect(result.$_trivia).toBe(source.$_trivia);
	const withInner: any = { ...source, $_trivia: { inner: { body: [{}] } } };
	expect(() => rebuilt(withInner, handle, () => ({ $type: 1, $source: 2, _a: 'v' }))).toThrow('holds inner comments');
});
```

- [ ] **Step 2: Implement.** Bodies are the existing ones, re-expressed on `(node, handle)`:
  - `renderText`: `withMethods`' inner `renderText` with `handle` as the first argument.
  - `rebuilt`: `const result = handle === undefined ? build() : inEngine(handle, build);` then the body of `carryTriviaThroughWith`'s wrapper (`trivia === undefined || !isNode(result)` returns `result`; the inner-comment refusal; `setTriviaData(result, trivia)`).
  - `triviaSide`/`triviaInner`/`triviaInnerAt`: the closures of `triviaSetterOf` (`entriesOf`, `gapsOf`, `writeInner`, `store`, `side`, `innerAt`) lifted to module level taking `(node, handle)`, with `facts = handle === undefined ? throw NO_ENGINE : handle.current.trivia` and `scoped` computed from the handle; `triviaInner` is `triviaInnerAt` with `gapsOf()[0]`.
  - `LIST_ITEMS` is the existing private symbol, exported. `listItems(elements, wrapper)` is `Object.freeze(elements.map((element) => collapseWrapper(element, wrapper)))`. `LIST_METHODS` is built once from `READONLY_ARRAY_METHODS`: `function (this, ...args) { return (this[LIST_ITEMS] as unknown as Members)[name]!(...args); }`. `listIterator` returns `this[LIST_ITEMS][Symbol.iterator]()`.
  - `listSlotWith(args, spec, set)` is the body of the closure `withListSlots` installs (`if (args.length === 0) return spec.optional ? set() : set(spec.make()); const whole = ...; return set(whole ? args[0] : spec.make(...convertElements(args, spec.element)));`). `elementsWith` is the body of `withElementsSeat`'s closure. `seatWith` is the body of the `withGroupSeat` setter closure with `readGroup()` in place of `readGroup.call(node)`.
- [ ] **Step 3: Run the new tests; then the whole suite.** The old helpers and their tests are untouched and still pass.
- [ ] **Step 4: Glossary.** One `###` entry per new export in `docs/glossary/packages-common-src.md`.
- [ ] **Step 5: Gates** (build, type-check, lint, vitest own call, no generated diff). Commit `feat(common): the node member logic as plain functions`.

**Gate:** new functions covered by ported tests; zero generated diff; old helpers untouched.

---

### Task 5: Text leaves and plain field-carrying factories write their members in the literal

**Files:**
- Create: `packages/codegen/src/emitters/node-members.ts`
- Modify: `packages/codegen/src/emitters/factories.ts` (`emitTextFactory` L2078-2100, `emitKindIdFactory` L2055, `emitFieldCarryingFactory` L1226-1245 when `seats.length === 0`, `emitRefineFormFactory` L1395-1450)
- Modify: `packages/codegen/src/emitters/factories.ts` import emission (L2143-2145): add the new names to the `@sittir/common/utils` import
- Test: `packages/codegen/src/emitters/__tests__/node-members-emit.test.ts` (new), `packages/tools/tests/node-shape.test.ts` (remove labels), `packages/common/tests/node-members.test.ts`

**Interfaces:**
- Consumes: Task 4's functions; Task 3's `isDataKey`.
- Produces: `nodeMemberLines(spec: NodeMemberSpec): string[]` where

```ts
export interface NodeMemberSpec {
	readonly selfName: string;                         // the const the literal is assigned to ('node')
	readonly accessors: readonly { readonly name: string; readonly read: string }[]; // `name: () => read`
	readonly setters: readonly string[];               // complete `$with` entries, each already `name: (...) => rebuilt(node, handle, () => ...)`
	readonly innerGaps: readonly string[] | undefined; // gap keys when the kind has an INNER_GAPS row; undefined otherwise
	readonly keyedGaps: boolean;                       // `innerAt` only when the grammar keys its gaps
	readonly extra: readonly string[];                 // lines a seat or list class adds (Tasks 7-9)
}
export function withEntry(method: string, params: string, body: string): string;   // `method: (params) => rebuilt(node, handle, () => body),`
```

Emitted shape for a three-slot kind (target):

```ts
export function buildBinaryExpression(config: T.BinaryExpression.Config): T.BinaryExpression.Bound {
	const handle = currentHandle();
	const _left = ...;
	const node = {
		$type: TSKindId.BinaryExpression as const,
		$source: 2 as const,
		$named: true as const,
		_left, _operator, _right,
		$with: {
			left: (value: ...) => rebuilt(node, handle, () => buildBinaryExpression({ ...config, left: value })),
			...
		},
		left: () => _left,
		operator: () => _operator,
		right: () => _right,
		$render: () => renderText(handle, node),
		$toEdit: (startOrRange: number | StringIndexRange, endPos?: number) => toEditAt(renderText(handle, node), startOrRange, endPos),
		$replace: (target: { range(): StringIndexRange }) => toEditAt(renderText(handle, node), target.range()),
		$trivia: {
			leading: (...items: unknown[]) => triviaSide(node, handle, 'leading', items),
			trailing: (...items: unknown[]) => triviaSide(node, handle, 'trailing', items)
		},
		$engine: handle && (() => handle.current)
	};
	return node as unknown as T.BinaryExpression.Bound;
}
```

A kind with an inner gap adds `inner: (...items: unknown[]) => triviaInner(node, handle, items)` and, when `keyedGaps`, `innerAt: (gap: string, ...items: unknown[]) => triviaInnerAt(node, handle, gap, items)`. A text leaf is the same without `$with` and readers.

- [ ] **Step 1: Write the failing emitter test** (`node-members-emit.test.ts`): `emitAll` over the rust fixture used by `utils-engine-emit.test.ts`; assert the raw text for a three-slot kind contains `const handle = currentHandle();`, `$trivia: {`, `rebuilt(node, handle,`, contains no `withMethods(`, `withAccessors(`, `Object.defineProperty`, and that a kind listed in `INNER_GAPS` has `inner:` while one that is not does not.
- [ ] **Step 2: Spike on one kind first.** Once `nodeMemberLines` exists (Step 3's first half), call it from a throwaway script under `scratchpad/` that prints the `identifier` and `binaryExpression` raw functions, save them into a scratch module there, and run the shape probe over them (1000 nodes each, with and without an engine in scope). Expected: all fast in both cases (this is also Review Focus 1). If not, stop and report: the question is then the shape, not the code. Nothing under `packages/*/src` is hand-edited.
- [ ] **Step 3: Implement `node-members.ts` and switch the four emit sites** (only when `seatRuntimes(...)` is empty; seat and list kinds keep the old nesting). `withEntry` is the single place that writes the `rebuilt(...)` wrapper, and the `$with` lines already produced by `emitFieldCarryingFactory` (including the `restItems` rest setters) are passed through it unchanged apart from the wrapper.
- [ ] **Step 4: Update the old emitter tests** that expect `withMethods(`/`withAccessors(` imports for these kinds (`utils-engine-emit.test.ts`, `wrap-variant-emit.test.ts`): only the kinds converted here; the rest keep their expectation until their task.
- [ ] **Step 5: Regenerate all five** (`pnpm run regen:all`) and describe the generated diff by class with counts in the commit body (per grammar: text leaves, plain kinds, refine forms converted; seat/list kinds unchanged).
- [ ] **Step 6: Shape gate.** Remove from `pending` the labels `rust text leaf`, `rust plain kind`, `typescript text leaf`, `typescript plain kind`, `python text leaf`; they must now pass. Add tests: built without an engine (`$render` throws `node has no engine`, `$engine` is `undefined`, still fast); a node that gets `$trivia.leading(...)` attached stays fast (1000 nodes); `$with` carries trivia (port from `trivia-setter.test.ts`).
- [ ] **Step 7: Full gates** (Global Constraints list). `validate:native` rows must be identical; a moved row stops the task.

**Gate:** shape labels pass; rows identical; the generated diff is exactly the converted classes (counts reported); suite green.

---

### Task 6: Wraps of text leaves and plain kinds

**Files:**
- Modify: `packages/codegen/src/emitters/wrap.ts` (text leaf returns L391, L662; field-carrying return L413/L670; the `_node` form at L670 when `hasWithSetters`)
- Test: `packages/codegen/src/emitters/__tests__/node-members-emit.test.ts`, `packages/tools/tests/node-shape.test.ts`

**Interfaces:**
- Consumes: `nodeMemberLines`, `withEntry`. The wrap's readers keep their `this`-based bodies (`left() { return hydrateChild<T.Expression>(this._left, tree); }`); they are already literal members and are passed as `extra` lines, not rewritten. The `$with` setters become `withEntry(method, params, 'wrapBinaryExpression({ ...$edited(data), _left: v }, tree)')`.

- [ ] **Step 1: Spike (answers question 3).** Generate `wrapBinaryExpression` and the text-leaf wrap for `identifier` by the new emitter into a scratch module and run the parsed shape probe (deep parse of `rust/crates/sittir-core/src/engine.rs`, count fast nodes of those two kinds). If the spread of the read record leaves them dictionary-mode, stop and report to sittir-brainstorm.
- [ ] **Step 2: Failing test.** Remove `'parsed'` from `pending` only at Step 6; first write the emitter assertion (wrap text contains `const handle = currentHandle();`, `$trivia: {`, and no `withMethods(` for a plain kind).
- [ ] **Step 3: Implement** in `wrap.ts` for nodes with no seats; `import { withMethods } from './utils.js'` stays for the remaining classes.
- [ ] **Step 4: Regenerate all five; describe the diff by class with counts.**
- [ ] **Step 5: Tools check.** Run `pnpm run probe:node-shape`; the parsed table must show the fast column rising for plain kinds and leaves.
- [ ] **Step 6: Gates.** Full gates; `validate:native` identical. The `parsed` shape test stays `fails` until Tasks 7-9 (seat and list wraps are still old); record in the commit body how many parsed nodes in the fixture are fast now.

**Gate:** rows identical; plain and leaf parsed nodes fast per the probe; no walker changes needed (Task 3 already covers them).

---

### Task 7: Group seats, factories and wraps

**Files:**
- Modify: `packages/codegen/src/emitters/factories.ts` (`groupSeatRuntimeSpecs`, the seat branch of `emitFieldCarryingFactory`), `packages/codegen/src/emitters/wrap.ts` (seat branch), `packages/codegen/src/emitters/node-members.ts` (the seat `extra` lines)
- Test: emitter test; `packages/rust/tests/group-seat-accessor.test.ts`, `packages/python/tests/group-seat-accessor.test.ts`, `packages/typescript/tests/flattened-group-built.test-d.ts` (kept); `packages/codegen/src/emitters/__tests__/group-seat-accessor-census.test.ts` (rewritten, see Step 1)

**Interfaces:**
- Emitted seat members (target; `_match_block_arms` is the stored group):

```ts
matchBlockArms: () => _match_block_arms,
matchArms: _match_block_arms === undefined ? undefined : () => _match_block_arms.matchArms(),
lastArm: _match_block_arms === undefined ? undefined : () => _match_block_arms.lastArm(),
$with: {
	matchBlockArms: (value?: T.MatchBlockArms) => rebuilt(node, handle, () => buildMatchBlock(value)),
	matchArms: (...values) => rebuilt(node, handle, () => seatWith(node, SPEC, KEY_matchArms, values, (g) => buildMatchBlock(g), () => _match_block_arms)),
	lastArm: (value) => rebuilt(node, handle, () => seatWith(...))
}
```
  where `SPEC` is the object literal `{ slot, stored, kind, make, keys }` written inline in each closure (not a module constant) and `KEY_*` the key entry inlined too. The group's own reader stays reachable under `storedSlotReader` through a `[STORED_SLOT_READERS]: { matchBlockArms: ... }` member written in the literal (the symbol is exported from utils for this).
- A seated key that spells its slot (`pattern` on `last_match_arm`) replaces the slot reader in the literal: the emitter writes it once, as the seated reader, and the group reader is the symbol-keyed entry (Review Focus 3).

- [ ] **Step 1: Failing census.** Rewrite `group-seat-accessor-census.test.ts` to assert over the emitted raw and wrap text of all five grammars: no object literal defines the same member name twice (parse the generated file with `ts.createSourceFile` and check every ObjectLiteralExpression for duplicate property names; this also covers list-view members in Task 8), and every seated reader is `undefined`-or-function. Expect FAIL only if an accidental duplicate exists; otherwise it passes and guards.
- [ ] **Step 2: Implement** the seat `extra` lines and the setters through `seatWith`; remove `withGroupSeat` from `seatRuntimes` output for kinds converted (the function itself stays until Task 10).
- [ ] **Step 3: Regenerate all five; describe the diff by class** (rust 4 seat sites × factory/wrap, typescript 1, python 1, per the issue's table).
- [ ] **Step 4: Shape gate.** Remove `rust group seat, group present`, `rust group seat, group absent`, `typescript group seat`, `python group seat` from `pending`.
- [ ] **Step 5: Behaviour tests** (port, do not weaken): flattened reader present/absent, `$with` through the group, building an absent group from one field when no other is required, the "required fields" refusal message, a key that spells its slot takes the whole group.
- [ ] **Step 6: Full gates.**

**Gate:** seat shape labels pass; census finds no duplicate keys; rows identical.

---

### Task 8: List owners (view, list slots, elements seat), factories and wraps

**Files:**
- Modify: `packages/codegen/src/emitters/factories.ts` (`listViewRuntimeSpec`, `listSlotsRuntimeSpec`, `elementConfigsOf`, the owner branch of `emitFieldCarryingFactory`), `packages/codegen/src/emitters/wrap.ts`, `packages/codegen/src/emitters/node-members.ts`
- Test: `packages/codegen/src/emitters/__tests__/list-view-census.test.ts` (kept, now also run on the literal text), `packages/common/tests/list-view.test.ts`, `elements-seat.test.ts` (ported in Task 4), `packages/tools/tests/node-shape.test.ts`

**Interfaces:**
- Emitted owner members (target):

```ts
const items = listItems(_arguments_elements?.elements() ?? [], WRAPPER);   // WRAPPER inline or undefined
const node = {
	$type: ..., $source: 2 as const, $named: true as const,
	_arguments_elements,
	$with: {
		argumentsElements: (...args: unknown[]) => rebuilt(node, handle, () => elementsWith(args, ELEMENTS_SPEC, (...a) => listSlotWith(a, SLOT_SPEC, (value) => _buildArguments(value)))),
	},
	argumentsElements: () => _arguments_elements,
	delimiter: _arguments_elements?._delimiter ?? Delimiter.None,
	length: items.length,
	[LIST_ITEMS]: items,
	...LIST_METHODS,
	[Symbol.iterator]: listIterator,
	[Symbol.isConcatSpreadable]: true,
	[Symbol.unscopables]: Array.prototype[Symbol.unscopables],
	$render: ..., $toEdit: ..., $replace: ..., $trivia: {...}, $engine: ...
};
for (let index = 0; index < items.length; index++) node[index] = items[index];
```
  Built owners fill index properties as data after the literal (their count varies, and the issue measured fast properties with them). Wrapped owners cannot read their elements at wrap time: they keep one getter per index position, one function per position shared by all nodes (`indexGetter(index)` memoized in a module-level array), defined with `Object.defineProperty(node, index, { get: INDEX_GETTERS[index], enumerable: false })`. A wrapped owner whose list is a read stub keeps a throwing `length` getter, non-enumerable, the only getter a built or wrapped node may have besides the index getters (Review Focus 2).
- The list options (`delimiter`, `separator`) are plain data decided at build for built owners and read from the stored list for wrapped owners (a getter-free read when the list is hydrated, otherwise the default).

- [ ] **Step 1: Spike and measure (answers question 1).** Build `arguments(x, y, z)` 10,000 times best-of-15 with `...LIST_METHODS` and with the 29 methods named; record both next to the issue's 125 ns / 1,328 B. Choose spread when within 1.5x of the named figure; otherwise name them. The choice is recorded in the commit body.
- [ ] **Step 2: Failing tests.** In `list-view.test.ts` (kept, ported to the literal form in Task 4) add the owner-level checks against the real engine: a built owner and a parsed owner expose the same `length`, indices, options and methods; `Object.keys` of a parsed shallow owner reads no stub (assert the native read counter does not move: use `recordFfi` from `@sittir/common`'s metrics as `real-list-cost.mts` does); `toTransportData(parsedOwner)` does not call the `length` getter of a stub owner.
- [ ] **Step 3: Implement** owners (factory and wrap), including `listSlotWith`/`elementsWith` inside the `$with` closure in the order `rebuilt(elementsWith(listSlotWith(base)))`, which is the composition today's `withMethods(withListView(withListSlots(...)))` produces.
- [ ] **Step 4: Regenerate all five; describe the diff by class** (rust 33 / typescript 15 / python 38 owner sites × factory and wrap; the other counts from the issue's table are reconciled in the commit body).
- [ ] **Step 5: Shape gate.** Remove `rust list owner` and `parsed` from `pending`; add built and parsed list-owner classes for typescript (`formalParameters`) and python (`parameters`) to the table with their builders.
- [ ] **Step 6: Duplicate-key census** from Task 7 now covers list-view members; an accessor named like a list member (`LIST_VIEW_MEMBERS` clash check at `factories.ts` L1723) stays a compile-time diagnostic.
- [ ] **Step 7: Full gates**, including the probe table for list-owner build time (record before/after).

**Gate:** owner and parsed shape labels pass; stub owner is never read by selection; rows identical.

---

### Task 9: Separated lists (the list itself) and the remaining forms

**Files:**
- Modify: `packages/codegen/src/emitters/factories.ts` (`emitSeparatedListFactory` L2020-2050 and the separated-list branch in `listViewRuntimeSpec`), `packages/codegen/src/emitters/wrap.ts` (`emitSeparatedListWrap`)
- Test: emitter test; shape table adds a built and a parsed separated list per grammar

**Interfaces:** the list itself is its own view: `items` come from the content array (`_elements`) already in scope, `length`, `_separator`/`_delimiter` options as data, the same `LIST_METHODS` spread, `$with` entries (`elements`, `separator`, `delimiter`) through `withEntry`.

- [ ] **Step 1: Failing emitter test** (no `withListView(` in a separated list's raw and wrap text).
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Census over the five generated raw/wrap files:** zero matches for `withMethods(|withAccessors(|withListView(|withGroupSeat(|withListSlots(|withElementsSeat(` in `packages/*/src/factories/raw.ts` and `packages/*/src/wrap.ts` (the guard test lives in `packages/tools/tests/no-attached-members.test.ts` and also forbids `Object.defineProperty` there except in the two sanctioned places: the wrapped-list index getters and the read-stub `length`).
- [ ] **Step 4: Regenerate; full gates; shape table complete.**

**Gate:** the census test is green and `pending` is empty.

---

### Task 10: Remove the old helpers and what pinned them

**Files:**
- Modify: `packages/common/src/utils.ts` (delete `withMethods`, `bindEngine`, `carryTriviaThroughWith`, `withAccessors`, `withListView`, `withListSlots`, `withElementsSeat`, `withGroupSeat`, `triviaSetterOf`, `WithMethodsRuntime`, `defineHidden`, and the private helpers only they used), `packages/common/src/runtime.ts` (`bindRuntime` loses `withMethods`; `GrammarRuntime`), `packages/codegen/src/emitters/client-utils.ts` (L24: export only `isNode`), `packages/codegen/src/emitters/factories.ts` and `wrap.ts` (drop `seatRuntimes`, `seatOpening`, `seatClosing`, the `withMethods` imports), `packages/types/src/core-types.ts` (the "non-enumerable defineProperty" comment on `$render` and friends becomes the member contract)
- Modify tests that pin the old surface: `packages/rust/tests/nodedata-shape.test.ts` (readers non-enumerable; keys), `packages/common/tests/{list-view,group-seat,elements-seat,utils-runtime}.test.ts` (calls to deleted helpers; the ported versions from Task 4 replace them), `packages/codegen/src/emitters/__tests__/{utils-engine-emit,wrap-variant-emit,list-view-census,group-seat-accessor-census}.test.ts`, `packages/common/tests/runtime.test.ts`, `packages/rust/tests/utils-engine.test.ts`
- Modify docs: remove the glossary entries of the deleted helpers (`docs/glossary/packages-common-src.md`, `emitters.md`); document `node-members.ts` and the new functions

- [ ] **Step 1: Delete, then let the compiler find every user.** `pnpm run type-check` lists them; fix each by deleting dead code or rewriting the test to the new surface (never loosening an assertion without the stash-and-rerun proof from the working standards).
- [ ] **Step 2: `nodedata-shape.test.ts`** now asserts the new contract: every member enumerable; `Object.keys` of a built node lists `$` keys, `_` keys, readers, `$render`, `$toEdit`, `$replace`, `$trivia`, `$engine`; `JSON.stringify` of a node contains no function; `toTransportData` of it equals the plain data.
- [ ] **Step 3: Full gates and `pnpm -r build`.** Regenerate to prove generated output is unchanged by this task (`git status --short packages/*/src` empty).
- [ ] **Step 4: Commit** `refactor: remove the helpers that attached members after a node was built`.

**Gate:** zero generated diff; no reference to a deleted helper remains (`type-check` and the Task 9 census).

---

### Task 11: Measure, document and open the PR

**Files:**
- Modify: `docs/use-cases-and-examples.md`, package READMEs (final pass), `docs/glossary/*` (entries for everything added)
- No code

- [ ] **Step 1: After numbers.** `pnpm run probe:node-shape` on the final tree; the PR description carries a before/after table for each of the issue's probes: build time and retained heap of the three node classes, fast-properties counts for built and parsed nodes, `engine.render` and `toTransportData` per node over built trees, deep-parse `toTransportData` and untouched `engine.render`, `engine.build.arguments(x, y, z)`.
- [ ] **Step 2: The issue's done-when list**, each item with the evidence: (1) no `Object.defineProperty` or getter in factories apart from the read-stub owner, and in wraps only the parsed-list index getters (the Task 9 census); (2) nodes of one kind share a shape (the shape test); (3) validation counts for every grammar match the previous run (`validate:history` rows pasted).
- [ ] **Step 3: Generated-output diff by class with counts** per grammar (text leaf, plain, refine form, seat, list owner, separated list; factory and wrap), and the full gate output: `pnpm -r build`, type-check, lint, vitest (own call), `cargo test --workspace --no-default-features`.
- [ ] **Step 4: PR.** Body starts with `Owner: sittir-implement`; links the issue; lists the one public change (`node.$trivia(...)` is gone; positions remain) and the enumerability change; notes `detachCoordinate`'s `delete` as untouched. Wait for CI green and the user's word before anything is merged; never merge it myself.

---

## Self-review

**Issue coverage.** What happens today / measured: Task 1 (gate, probe). Design 1 (members in the literal): Tasks 4, 5, 6. Design 2 (`$trivia` positions, `inner`/`innerAt` by `INNER_GAPS`): Tasks 2, 5. Design 3 (group seats): Task 7. Design 4 (list views): Tasks 8, 9. Design 5 (wrap, index getters): Tasks 6, 8. What changes for callers: Tasks 2, 3, 10. What has to change with it: emitters (5-9), `utils.ts`/`runtime.ts`/`client-utils.ts` (10), projection and key walks (3), types (2), tests that pin the old surface (2, 10), docs (2, 10, 11). The read-stub owner that keeps a getter: Task 8. Done-when: Tasks 9, 11. The two pre-planning checks: the section above. Related #497: its optional reader is a plain member decided at build (an `undefined`-or-function member, as the seat readers in Task 7); no extra task.

**Placeholder scan.** No step defers a decision; the three open questions are stated with a recommendation and the task that depends on each.

**Type consistency.** `rebuilt(node, handle, build)`, `renderText(handle, node)`, `triviaSide(node, handle, position, items)`, `seatWith(node, spec, key, args, seat, readGroup)`, `listSlotWith(args, spec, set)`, `elementsWith(args, spec, set)`, `isDataKey(key)` and `nodeMemberLines`/`withEntry` are spelled the same in Tasks 3-9. `StringIndexRange` (from the span-units change) is used in the emitted `$toEdit`/`$replace`.
