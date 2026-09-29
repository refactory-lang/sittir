# Bound Nodes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development when the user chooses it) to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every node reaches the engine that built or read it through a bound `$engine()`, so the engine's options apply to `$render()`, the process-wide default engine is gone, and the engine owns the node guards.

**Architecture:** A per-engine handle `{ current: Engine | EngineIdentity }` is shared by every node that engine stamps. `withMethods` binds `$engine()` over the handle of the engine in scope; a module-level scope is entered by every `build.*` call, by wrapping, by lazy child expansion, and by `$with` and `$trivia`. `dispose()` swaps the handle to the engine's identity. The generated `boundary.ts`, `defaultEngine()` and `methodsEngine` are removed, and the trivia facts a node needs come from the language hooks.

**Tech Stack:** TypeScript (ESM, `.ts` imports), vitest, `@sittir/codegen` emitters, `@sittir/common` runtime, napi native engines (unchanged).

**Spec:** `docs/superpowers/specs/2026-09-28-engine-api-design.md`, sections "The engine" (node guards), "Nodes are bound to their engine", "Rendering a node through another engine", and "Testing". Read them before any task. This plan replaces the second row of the five-PR table in `2026-09-28-engine-api.md`, whose `ENGINE` symbol and `StampEngine` predate the handle design.

## What landed in the first PR, and what this plan builds on

- `createEngine(language, options)` in `packages/common/src/create-engine.ts`: `assembleEngine` returns `build: hooks.build` unbound, and `render` hands the node to the engine's own native engine.
- `Rendered` is already disposable (`createRenderHandle` in `packages/common/src/engine.ts`); nothing to do here.
- Generated per grammar (`packages/<g>/src/`):
  - `utils.ts` defines `methodsEngine` (render and toEdit through `boundary.ts`, plus the trivia facts) and binds `isNode`, `isEmpty` and `withMethods` over it with `bindRuntime`.
  - `boundary.ts` holds the lazily created process-wide `defaultEngine()`, and the free `render`, `toEdit` and `applyEdits` over it.
  - `factories/raw.ts` passes `methodsEngine` as `withMethods`' second argument, 240 sites per grammar.
  - `wrap.ts` builds one method engine per tree (`_treeEngine(tree)`): it renders through `tree.render`, the reading engine, when the tree has one, and falls back to `methodsEngine.render`.
  - `factories/index.ts` sets `methodsEngine.trivia.comment = coerceTo<Comment>` at module load, a mutation of shared state.
  - `index.ts` still exports `isEmpty`.
- Emitters: `client-utils.ts` (utils), `grammar-runtime.ts` (boundary, written by `run-codegen.ts`), `engine.ts`, `factories.ts`, `wrap.ts`, `overlays/module.ts`.
- The one non-generated `defaultEngine` consumer is `packages/tools/src/validate/common.ts`, which imports each grammar's `boundary.ts`.

**#420 root cause.** A node built through `engine.build` gets `methodsEngine`, so its `$render()` goes to `defaultEngine()`. That native engine never parsed the tree its parsed children's coordinates name, so the render throws `handle N names tree T, which this engine does not hold`. `engine.render(node)` works because it goes to the engine that parsed the children. Binding a built node to the engine in scope removes the second engine.

## Global Constraints

- Branch `feat/engine-api-2-bound-nodes` from `origin/master`, in the worktree `scratchpad/wt-bound-nodes` inside the checkout. Commits use pathspecs (`git commit -F msg -- <paths>`).
- Generated outputs (`packages/{rust,python,typescript,scm,regex}/src/*`, `.sittir/*`, `rust/crates/sittir-*/src/*`) are never hand-edited: change the emitter and regenerate (`pnpm run validate:native` regenerates rust, typescript and python; `gen --grammar scm|regex --all --output packages/<g>/src` the other two).
- No comments in `packages/codegen/src/`; each new declaration gets a `###` entry in the matching `docs/glossary/` file. No planning, task, PR or issue numbers in comments or glossary text.
- DRY: one handle type and one scope for every stamping origin; the trivia facts have one source (the hooks); the free guards in `@sittir/common/utils` stay the only structural predicates, and each engine guard composes one of them with the language check.
- A failed gate stops the work for review; never revert or stash it away.
- `validation-report.json` is committed only with a ceiling or row change; this plan should change neither.

## Review Focus

1. **Lazily expanded children of a parsed node** are stamped with the reading engine's handle, including a child first expanded after the parse returned, outside any engine call.
2. **`$with.*` and `$trivia`** run in their node's engine scope even when called inside another engine's `build` call.
3. **Nested variant and flavour builders** (`build.number.bigint`, `build.x.strict`, `build.x.coerce`) run in scope, not only top-level builders.
4. **After `dispose()`**, `$engine()` returns the identity: `$render()` and `$toEdit()` throw "engine disposed" naming `engine.render(node)`, the guards still accept the node, and a node of another engine of the same language is unaffected.
5. **No module-level mutable engine state remains** in generated code: the comment builder travels with the hooks, not through `methodsEngine.trivia.comment`.

## Delivery

One PR, stacked on master. It changes behaviour in one place: engine render options now reach `$render()`. Under default options, validation rows, render fixtures and dogfood `.rendered` files stay byte-identical.

---

### Task 0: Worktree and baselines

- [ ] **Step 1:**

```bash
cd ~/GitHub.nosync/refactory-lang/sittir && git fetch origin
git worktree add -b feat/engine-api-2-bound-nodes scratchpad/wt-bound-nodes origin/master
cd scratchpad/wt-bound-nodes && pnpm install
```

- [ ] **Step 2: Baselines** (saved to `scratchpad/wt-bound-nodes/scratchpad/baseline/`):
  - `pnpm run validate:native` (rows);
  - `gen` for scm and regex, then `pnpm exec vitest run` as its own call (the count);
  - `type-check`, both example checks, `lint`;
  - `cargo test --workspace --no-default-features`;
  - `tsc --extendedDiagnostics` instantiations for rust, typescript and python.

---

### Task 1: The engine handle and its scope

**Files:**
- Create: `packages/common/src/engine-scope.ts`
- Modify: `packages/types/src/engine-api.ts` (`EngineIdentity`, `Engine` gains the identity fields)
- Test: `packages/common/tests/engine-scope.test.ts`

**Interfaces:**

```ts
// packages/types/src/engine-api.ts
export interface EngineIdentity<API extends LanguageAPI = LanguageAPI> {
	readonly language: Language<API>;  // the descriptor; `language.name` is the grammar's name
	readonly renderModuleHash: string; // the package's `hash.ts` `RENDER_MODULE_HASH`
	readonly options: API['options'];  // the engine's render options
	readonly trivia: TriviaFacts;      // plain data: $trivia reads work on a disposed engine's nodes
}
// Engine<API> extends EngineIdentity<API>. `language` changes from the grammar name to the
// descriptor; callers of `engine.language` read `engine.language.name`.

// packages/common/src/engine-scope.ts
export interface EngineHandle { current: EngineLike | EngineIdentity }
export interface EngineLike extends EngineIdentity {
	render(node: AnyNodeData): Rendered;
	toEdit(node: AnyNodeData, startOrRange: number | ByteRange, endPos?: number): Edit;
	readonly trivia: TriviaFacts;
}
export function inEngine<T>(handle: EngineHandle, fn: () => T): T;   // set, run, restore in finally
export function currentHandle(): EngineHandle | undefined;
export function isLive(current: EngineHandle['current']): current is EngineLike;
```

- [ ] **Step 1: Failing tests.** `inEngine` nests and restores, restores after a throw, and leaves no handle after the outermost call. `isLive` is false for an identity.
- [ ] **Step 2: Implement.** Builders, wrapping and setters are synchronous, so a module-level current handle is safe; `inEngine` never wraps an `await`.
- [ ] **Step 3: Glossary** entries in `docs/glossary/packages-common-src.md` and `packages-types-src.md`. Commit.

---

### Task 2: `withMethods` binds `$engine()`

**Files:**
- Modify: `packages/common/src/utils.ts` (`withMethods`, `triviaSetterOf`, `carryTriviaThroughWith`), `packages/common/src/runtime.ts` (`bindRuntime`)
- Test: `packages/common/tests/engine-scope.test.ts`

**Behaviour:**
- `withMethods(node)` takes no engine. It binds a non-enumerable `$engine()` returning `handle.current` for `currentHandle()`; with no handle in scope it binds none.
- `$render()`, `$toEdit()` and `$replace()` read `this.$engine?.()`: none throws `node has no engine; render it with engine.render(node)`; an identity throws `engine disposed; render it with engine.render(node)`; a live engine renders.
- `$trivia` reads the facts from `this.$engine()` and runs its setter inside `inEngine` of the node's handle, so a comment built from text is stamped. The facts come from `$engine().trivia`, which the identity carries too, so `$trivia` reads and writes of existing entries keep working on a disposed engine's nodes; only a comment built from text needs a live engine, and throws "engine disposed" otherwise.
- `$with` setters run inside `inEngine` of the node's own handle.

- [ ] **Step 1: Failing tests** against a fake engine: stamping in scope; none out of scope; the three `$render` outcomes; a `$with` setter called inside another handle's scope rebuilds with the node's own; a `$trivia('// x')` entry built outside any scope carries the node's handle.
- [ ] **Step 2: Implement**; `bindRuntime` keeps `isNode`, drops `isEmpty` (Task 6 moves it to the engine) and `withMethods`' engine parameter.
- [ ] **Step 3:** `pnpm exec vitest run packages/common`. Commit with glossary entries.

---

### Task 3: Generated code drops `methodsEngine` and `boundary.ts`

**Files (emitters, then regenerate every grammar):**
- `packages/codegen/src/emitters/client-utils.ts`: `utils.ts` exports only `isNode` and `withMethods` over `bindRuntime`; no `methodsEngine`, no import of `boundary`.
- `packages/codegen/src/emitters/factories.ts`, `overlays/module.ts`: `withMethods(node)`; the comment builder is exported for the hooks instead of assigned to `methodsEngine.trivia.comment`.
- `packages/codegen/src/emitters/wrap.ts`: `_treeEngine` goes. Wrapping and every lazy drill-in run inside `inEngine` of the tree's handle, and `$render` renders through `$engine()`, which for a parsed node is the reading engine holding `tree`.
- `packages/codegen/src/emitters/engine.ts`: `api.ts` builds the trivia facts (with the comment builder) and hands them in `hooks.trivia`.
- `packages/codegen/src/emitters/grammar-runtime.ts`, `packages/codegen/src/run-codegen.ts`: stop emitting and writing `boundary.ts`; the codegen deletes a stale one.
- Tests: `packages/codegen/src/emitters/__tests__/utils-engine-emit.test.ts`, `engine-emit.test.ts`, `wrap-variant-emit.test.ts` pin the new shapes.

**The tree handle.** `TreeHandle` (`packages/common/src/readNode.ts`) gains the reading engine's `EngineHandle`, stamped by `parse`. The per-tree method engine and `tree.render` are subsumed by it.

- [ ] **Step 1:** Update the emitter tests to the new output and see them fail.
- [ ] **Step 2:** Change the emitters; regenerate all five grammars.
- [ ] **Step 3: Gates.** Rows identical; `vitest` as its own call; type-check and lint. Expected: every test that renders a node built outside an engine now fails loudly. Those are the census for Task 5, not regressions to paper over.

---

### Task 4: The engine enters its scope

**Files:**
- Modify: `packages/common/src/create-engine.ts` (`assembleEngine`)
- Test: `packages/common/tests/create-engine.test.ts`

**Behaviour:**
- `assembleEngine` creates the handle and `build` as a lazy per-path proxy over `hooks.build`: every call, including nested variants and the `.strict` / `.coerce` flavours, runs in `inEngine(handle, …)`. A proxy per path is created once and cached, so creating an engine allocates no closure per builder.
- `parse` wraps inside the scope and stamps the tree handle.
- `render(node)`:
  - another language (from the node's stamp): throws naming both;
  - same language: the reading engines of the node's tree-bearing parts decide. A parsed node, and every parsed descendant of a built node, names the engine holding its tree:
    - none (a node built throughout): this engine renders it;
    - one reading engine: that engine's native instance renders it, with this engine's options;
    - several reading engines: throws, naming them.
  - `$render()` is `$engine().render(this)`, so the same rule applies to it.
- `dispose()` swaps `handle.current` to the identity, then disposes the native engine.

- [ ] **Step 1: Failing tests (Review Focus 3 and 4):**
  - `build.number.bigint(1n)` and `build.x.coerce(…)` nodes carry the engine;
  - two rust engines with different `indent` render one built shape differently through `$render()`;
  - after `dispose()`, `$engine()` is the identity and `$render()` throws "engine disposed";
  - a node of a second live rust engine still renders.
- [ ] **Step 2: Implement.** Commit.

---

### Task 5: Every caller has an engine

The census from Task 3, Step 3: each failing caller moves to an engine.

- `packages/tools/src/validate/common.ts`: `nativeEngineFor(grammar)` creates the engine with `createEngine(language)` from the package's descriptor, keeping the one-engine-per-process cache (napi modules cannot reload in-process) and the debug-build refusal.
- `packages/{rust,python,typescript}/tests/backend-boundary.test.ts`: test the backend through the engine, or retire the cases that only exercised the free boundary.
- Every other failing test builds through an engine. No test keeps a render path without one.

- [ ] Gates as in Task 3. Commit per package.

---

### Task 6: Node guards on the engine

**Files:**
- Modify: `packages/types/src/engine-api.ts` (`Engine` guards; `LanguageAPI` gains `empty`), `packages/common/src/create-engine.ts`, `packages/codegen/src/emitters/engine.ts` (`<Lang>API['empty']` from the grammar's type map), `packages/codegen/src/emitters/index-file.ts` (drop `isEmpty` from the package index)
- Test: `packages/common/tests/create-engine.test.ts`, `packages/types/tests/engine-api.test-d.ts`, the api-surface snapshots (`{ default }` only)

**Behaviour:** each of `isNode`, `isParsedNode`, `isFactoryNode`, `isErrorNode` is its free counterpart in `@sittir/common/utils` plus `x.$engine?.().language === this.language`. `isEmptyNode(x)` is `isNode(x)` and the free `isEmptyNode(x)` for a kind with inner gaps, narrowing through `API['empty']`. Callers of the package `isEmpty` (`packages/tools/src/validate/factory-render-parse.ts`, `packages/rust/tests/trivia-types.test-d.ts`, `packages/common/tests/runtime.test.ts`) move to the engine guard.

- [ ] **Step 1: Failing tests.**
  - Each guard accepts a node of its language, including one from another engine of that language.
  - Each guard rejects a node of another language whose `$type` is a valid kind id in both.
  - Each guard rejects unstamped values.
  - The guards still accept a disposed engine's nodes.
  - `isEmptyNode` narrows only the kinds `empty` names (type test).
- [ ] **Step 2: Implement; regenerate.** Commit.

---

### Task 7: A built node holding parsed children renders through `$render()`

**Files:** `packages/rust/tests/bound-nodes.test.ts` (new).

- [ ] **Step 1: The repro as a test**, which fails on master:

```ts
const engine = await createEngine(rust);
const root = engine.parse('use x;\n\nfn process(input: &str) {\n    // keep me\n    println!("{}",   input);\n}\n');
const fn = root.statements()[1];
const params = engine.build.parameters(...(fn.parameters().parametersElements()?.elements() ?? []));
expect(params.$render()).toBe(engine.render(params).toString());   // "(input: &str)"
```

- [ ] **Step 2: Confirm the root cause against the handle design.** The built `parameters` is stamped with `engine`, and its `$render()` goes to the engine whose native engine holds the children's tree. Confirm no second native engine is created in the process (the backend's engine count stays at one).
- [ ] **Step 3: The three cross-engine cases**, all pinned:
  - built by engine A over children parsed by engine B, rendered by A or through `$render()`: B's native instance renders it with A's options (an `indent` that differs between A and B shows which options applied);
  - children parsed by B and by C in one built node: throws, naming both;
  - a node built throughout: its own engine renders it.
  The #420 repro above is the single-engine case, with A and B the same engine.
- [ ] **Step 4:** This PR closes #420. Commit.

---

### Task 8: Stamp census, docs, final gates

- [ ] **Stamp census test** (`packages/rust/tests/bound-nodes.test.ts`): a node from each origin carries its engine's handle:
  - build;
  - coercion from a string;
  - `.from()`;
  - parse;
  - a lazily expanded child reached after `parse` returned;
  - a `$with` rebuild called inside another engine's build;
  - a comment entry from `$trivia('// x')` outside any build.
- [ ] **Glossary and READMEs.** The glossary covers every new or changed declaration. The package READMEs and `docs/cli-command-glossary.md` lose `render(node)`, `defaultEngine` and `isEmpty`.
- [ ] **Final gates**, compared with Task 0:
  - rows identical;
  - render fixtures and dogfood `.rendered` byte-identical;
  - `vitest` as its own call, with any change in the count named test by test;
  - type-check, both example checks, lint, verify-manifests;
  - `cargo test --workspace --no-default-features`;
  - tsc instantiations within 10% of Task 0.
