# Render-Module Emitter Framework Alignment — Design

## Problem

`render-module.ts` was partially moved under `emit.ts`, but the integration is still weaker than the rest of the emitter framework:

- `emit.ts` owns `init()` / `finalize()`, but `render-module` still does its real work through a separate batch-oriented surface.
- production ownership is split between `emit.ts`, `render-module.ts`, `cli.ts`, and `scripts/regen-templates-rs.ts` in a way that makes it unclear which path is canonical.
- current emitters store mutable state in module-level singletons behind object literals, so `init()` behaves like a constructor but without instance ownership or a shared type contract.

The result is that `render-module` still feels like an exception instead of a first-class emitter participant, and the emitter framework itself still lacks a real convention that an agent can follow mechanically.

## Goals

1. Make `render-module` a first-class participant in the shared emitter framework.
2. Define one concrete emitter convention that applies to `render-module` and the existing loop-driven emitters.
3. Move emitter state out of module-global singletons and into ES class instances implementing a shared interface.
4. Keep `emit.ts` as the single production owner of emitter orchestration and taxonomy dispatch.
5. Preserve the multi-file Rust bundle output and byte-identical generated output.

## Non-Goals

- redesigning the Rust render pipeline itself
- changing generated Rust or TS API shape beyond what is needed for framework alignment
- migrating unrelated section-4 batch emitters (`emitTypes`, `emitConsts`, `emitIr`, etc.) into the loop as part of this follow-up
- using `render-module` alignment as a reason to keep a second production orchestration path

## Design

### 1. Shared emitter contract

Loop-driven emitters adopt a shared class-based contract. This applies to:

- `FactoryEmitter`
- `FromEmitter`
- `WrapEmitter`
- `TemplateEmitter`
- `RenderModuleEmitter`

The contract is instance-based and constructor-owned. `emit.ts` creates fresh emitter instances for each `emitAll()` call.

```ts
interface CodegenEmitter<TNode, TResult, TFinalizeArg = void> {
	emitLeaf?(node: Extract<TNode, { modelType: 'pattern' | 'keyword' | 'enum' }>): void;
	emitBranch?(node: Extract<TNode, { modelType: 'branch' }>): void;
	emitPolymorph?(node: Extract<TNode, { modelType: 'polymorph' }>): void;
	emitGroup?(node: Extract<TNode, { modelType: 'group' }>): void;
	finalize(arg: TFinalizeArg): TResult;
}
```

Each emitter class may expose constructor parameters or a static `create(...)` helper, but mutable state lives on the instance, not in module-level variables.

`init()` is no longer a separate lifecycle phase for loop-driven emitters. Constructor setup replaces it.

### 2. `emit.ts` owns loop-time taxonomy dispatch

`emit.ts` remains the only production location that decides which node model reaches which emitter method.

That means:

- taxonomy classification stays in `emit.ts` plus shared helpers such as `classifyFactoryEmission` / `classifyWrapEmission`
- emitters do not perform an alternate top-level routing pass over `nodeMap.nodes`
- `render-module` must receive nodes through the same loop as the other emitters

This does **not** ban ordinary branching inside helper code. It bans duplicate emitter-routing logic over raw assembled nodes.

Allowed:

- a render-module helper branching on collected transport shape, slot class, or Rust surface variant while assembling `transport.rs`

Not allowed:

- a separate production entrypoint that walks `nodeMap.nodes` and decides for itself which model types to emit

### 3. `RenderModuleEmitter` becomes a real loop participant

`RenderModuleEmitter` is refactored into an ES class implementing the shared emitter interface.

Its responsibilities are split into two phases:

1. **Loop-time collection** — `emitLeaf` / `emitBranch` / `emitPolymorph` / `emitGroup` collect the node-level metadata needed to build the render-module output.
2. **Finalize-time synthesis** — `finalize(jinjaTemplates)` renders `hash.rs`, `hash.ts`, `templates.rs`, `dispatch.rs`, `transport.rs`, `bridge.rs`, `mod.rs`, and the template copies from collected state plus finalized Jinja templates.

The important change is not that `render-module` stops being multi-file or finalize-heavy. The change is that it stops owning an alternate orchestration model.

### 4. Render-module file synthesis stays pure

Multi-file output generation stays in pure helper functions under `render-module.ts`, but those helpers consume **collected emitter state**, not raw top-level orchestration inputs.

Concretely:

- `emit.ts` drives collection
- `RenderModuleEmitter.finalize(jinjaTemplates)` calls pure synthesis helpers
- pure helpers can render each Rust file from a collected render-module plan/state object

This keeps the current advantages of deterministic file generation without treating batch synthesis as a framework exemption.

### 5. One production ownership path

For production codegen:

- `emitAll()` is the only owner of render-module orchestration
- `EmitAllResult.renderModule` is the only production output handoff
- `cli.ts` writes files only; it does not decide how render-module emission runs

Any helper exported from `render-module.ts` must be one of:

1. a pure internal synthesis helper used by `RenderModuleEmitter.finalize()`
2. a test helper explicitly marked as non-production
3. a compatibility adapter that still instantiates and drives the class-based emitter contract rather than bypassing it

### 6. Script and test callers use adapters, not a second model

`scripts/regen-templates-rs.ts` and targeted unit tests may use a narrower adapter surface, but that adapter must exercise the same class-based emitter contract.

Acceptable pattern:

- create `runRenderModuleEmitter(...)` or similar test/script helper
- the helper instantiates `TemplateEmitter` and `RenderModuleEmitter`
- it feeds nodes through the same loop contract used by `emit.ts`
- it calls `finalize(...)` and returns `RenderModuleBundle`

Not acceptable:

- calling a production-facing `emitRenderModuleBundle(grammar, templates, nodeMap, ...)` helper that recreates orchestration outside the framework

This keeps fast-path tools possible without preserving a second ownership model.

### 7. Existing loop-driven emitters move to classes too

To make the convention real, the already-integrated emitters move from module-level singleton objects to ES classes implementing the shared interface.

That migration includes:

- replacing module-global mutable state with private instance fields
- replacing `init()` with constructor configuration
- letting `emit.ts` create fresh emitter instances per `emitAll()` invocation

This is part of the same design because `render-module` should not be the only class-based emitter in a framework otherwise built around hidden singleton state.

## Data Flow

1. `emitAll()` computes shared classifications and creates emitter instances.
2. `emitAll()` loops `nodeMap.nodes` once.
3. Each emitter receives only the nodes admitted by shared classification.
4. `TemplateEmitter.finalize()` produces `EmittedTemplates`.
5. `RenderModuleEmitter.finalize(jinjaTemplates)` consumes collected render-module state plus `EmittedTemplates`.
6. `emitAll()` returns `renderModule` inside `EmitAllResult`.
7. `cli.ts` writes the returned files and copied templates.

## Migration Plan

1. Introduce the shared emitter interface and convert the existing loop-driven emitters to ES classes with instance-owned state.
2. Update `emit.ts` to instantiate those classes and call methods directly.
3. Refactor `RenderModuleEmitter` into a collecting emitter class.
4. Move the current bundle/file rendering logic behind finalize-time pure helpers that consume collected state.
5. Replace script/test direct orchestration with a shared adapter that drives the emitter contract.
6. Remove redundant render-module guards and stale singleton state.

## Acceptance Criteria

1. `render-module` participates in the shared taxonomy loop through explicit emitter methods.
2. `render-module` no longer owns a separate production orchestration path.
3. loop-driven emitters use ES classes implementing a shared interface, with state stored on instances.
4. `emit.ts` is the only production owner of emitter orchestration.
5. `cli.ts` only writes outputs returned from `emitAll()`.
6. script/test helpers do not recreate a second ownership model; they use an adapter over the same emitter contract.
7. redundant render-module grammar guards outside the shared classification decision are removed.
8. generated output remains byte-identical.

## Testing

- update emitter tests to construct and exercise the class-based emitters
- keep render-module snapshot/fixture assertions proving byte-identical output
- add a focused test that the render-module adapter path and `emitAll()` path produce identical `RenderModuleBundle` output for the same grammar inputs

