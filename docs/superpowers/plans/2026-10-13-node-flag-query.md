# A Node's Flag in a `where` Condition: Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `where((c) => c.is('async'))` selects the nodes that carry a vocabulary flag, and the condition pushes down to the native walk like any other, including when the flag's keyword sits inside a wrapper child (rust `function_item (function_modifiers "async")`).

**Architecture:**
- **Native child step.** The native plan gains a child step, which holds when a condition holds on a child the step's routes admit. Its optional anchor is first, last or only, the anchors the portable read tests already use.
- **Flag table.** Codegen lowers each flag capture in `bindings.scm` to a plan once per kind, through the lowering the portable read tests use (`stepsOf` → steps → leaf), and emits it as a per-kind flag table.
- **Recorder.** The recorder's `is(flag)` reads the table for the view's kind, and the types list each kind's flags.

**Tech Stack:** TypeScript (codegen bindings, `@sittir/common`, `@sittir/types`), Rust (`sittir-core::query`), vitest, cargo.

**Spec:**
- `docs/superpowers/specs/2026-10-02-node-query-traversal-modification-api-design.md`: §7.1 recorder, §7.2 plan.
- The maintainer's ruling: a flag hoisted to the node is `c.is(flag)`, a node-level test, not a slot member. A keyword inside a wrapper child is reached by a native child step: one evaluation path, and no condition that only JavaScript evaluates.

**Base:** `feat/bindings`. The flags (the vocabulary's `Flags`) and their captures exist only there.

## Global Constraints

- "Native code has no slot knowledge": a child step carries routes and an anchor, never a slot or flag name.
- One evaluation path: `c.is` compiles to a plan the native walk evaluates; `holds` is the oracle.
- The `present` leaf stays routes-shaped; `eq(false)`-style negation stays `not`.
- Generated outputs are never hand-edited; the flag table comes from codegen.

## Decisions (accepted)

1. **The child step.**
   - The wire format is `{ op: 'child', fields, kinds, anchor?: 'first' | 'last' | 'only', of: <plan> }`. It holds when `of` holds on one of the non-extra children the routes admit.
   - The anchor narrows that set first: `first` and `last` keep one child, and `only` requires exactly one.
   - `of` is evaluated with that child as the node, so it nests (`child` → `child` → `present`).
   - `holds` gets the same arm. Its provider gains a child view: `children(routes)` yields the child contexts, beside `texts(routes)`.
2. **The flag table.**
   - Codegen emits `queryFlags: Record<kindId, Record<flag, QueryPlan>>`.
   - Each entry is the flag capture's conditions on that kind, lowered by `readTestOf`'s step machinery, and joined by `and` when there are several.
   - A capture the lowering cannot express natively (a context condition, `up > 0`; a comparison of the node's own text, `self`) is a codegen diagnostic, not a JavaScript fallback. Task 0's census says whether any exists.
3. **The recorder.**
   - `is` is a method of the recorder itself, beside the slot members.
   - For a known kind, `c.is(flag)` returns that kind's plan for the flag. A flag the kind does not declare is refused, naming the kind and the flag.
   - Before the kinds are known, the shape check accepts any flag the vocabulary declares, and per-kind compilation enforces it when the view runs (the rule boolean slots already follow).
   - The key `is` is reserved: codegen refuses an accessor named `is`, which holds for every grammar today.
4. **Types.**
   - `Recorder<N>` gains `is(flag: FlagOf<N>): Cond`.
   - `FlagOf<N>` is the union of the flags declared on `N`'s kind, from a generated per-kind flag-name map. Over a union, it holds only the flags every member declares.
   - A kind test on a slot (`c.name.is(K.X)`, later) takes a kind id. A flag takes a string literal, so the two never collide in the types.
5. **Portable read tests.**
   - Coordinate's `PortableCondition` keeps `via` for now.
   - A follow-up folds `via` into child steps, so a read test is one plan and can run natively. That is coordinate's call, not this plan's.

## Ruled

1. One plan per (kind, flag), not one bitflag-word plan per kind.
2. A view over a supertype takes each member's own plan, per kind.

## Review Focus

1. **A keyword two wrappers deep:** the steps nest, and the native result equals the oracle.
2. **An anchored step on a list child:** `first`, `last` and `only` match the portable evaluator's meaning exactly.
3. **A flag declared on one member of a union view:** the type refuses it, and per-kind compilation refuses it at run time, naming the kind.
4. **An extra (a comment) between the node and the wrapper:** it is skipped, as in `any_value`.
5. **A plan that mixes `is(flag)` with slot comparisons under `and`/`or`/`not`:** it pushes down as one plan.

---

### Task 0: Census of flag captures

- [ ] List every flag capture in `packages/{rust,typescript,python}/bindings.scm` with its lowered steps: depth, anchors, `up`, and text comparisons. Commit the census under `docs/superpowers/probes/2026-10-13-node-flags/` (script plus results).
  - Expected: every capture is `up 0`, with steps over routes and a `present` or `eq` leaf.
  - Any other shape becomes a diagnostic case in Task 2's tests.

### Task 1: The native child step and the oracle

**Files:** `rust/crates/sittir-core/src/query.rs` (`PlanSpec::Child`, `Plan::Child`, `holds`); `packages/types/src/query.ts` (`QueryPlan` gains the `child` arm); `packages/common/src/query.ts` (`holds` and its provider).

- [ ] Rust unit test, red first: `function_item` with `async` inside `function_modifiers`.
  - `{op:'child', fields:['function_modifiers'], kinds:[], of:{op:'present', fields:[], kinds:['async']}}` holds on `async fn a() {}` and not on `fn b() {}`.
  - An `only` anchor holds when exactly one child is admitted and fails on two.
  - `first` and `last` select the end children.
- [ ] Implement `Plan::Child { routes, anchor, of }`: collect the admitted non-extra children, apply the anchor, then `any(|child| of.holds(&child, source))`.
- [ ] Add a `holds` case driven by a `children(routes)` provider. Write the oracle test against the native result.

### Task 2: The flag table

**Files:** a codegen emitter beside `querySlotRows` (reading the bindings facts and `readTestOf`'s steps); the generated `queryFlags` in `packages/*/src/utils.ts`; `QueryHooks` and `LanguageHooks` carry it.

- [ ] Codegen test, red first:
  - rust `function_item`'s `async` lowers to the child plan above;
  - typescript `method_definition`'s `static` lowers to a top-level `present` over its keyword route;
  - a capture the census lists as inexpressible is a diagnostic.
- [ ] Implement it, regenerate, and confirm the generated output changes only in `queryFlags` and the hooks.

### Task 3: The recorder's `is` and its types

**Files:** `packages/common/src/query.ts` (`recorder`, a `flagRef`, `shapeRef` beside it); `packages/types/src/query.ts` (`Recorder`, `FlagOf`); the generated per-kind flag-name map.

- [ ] Tests, red first:
  - rust: `fns.where((c) => c.is('async'))` selects `a`, `.not()` selects `b`, and both push down with the kind.
  - typescript: `c.is('static').and(c.name.eq('m'))`.
  - Each case matches the oracle.
  - A flag the kind lacks is refused, naming `<kind>`; a type-guard view runs per kind.
  - Type tests: `c.is('nope')` is a type error, and over a union only the shared flags type-check.

### Task 4: Gates

- [ ] Run regen, the suite, the cargo gate, clippy, the workspace type-check, lint and validate (rows in the PR body). Run the Codex review, then open the PR into `feat/bindings`.
