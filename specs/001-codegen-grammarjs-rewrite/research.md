# Research: Rewrite Codegen from grammar.js

**Feature**: 001-codegen-grammarjs-rewrite
**Date**: 2026-03-24

## R1: Eliminating LeafBuilder — Unified Node Data

**Decision**: Remove `LeafBuilder` as a separate class. All nodes — branch and terminal — are represented as plain data objects (`NodeData`) with a `kind` field and typed fields. No ES classes with `renderImpl()`. Terminal nodes are just `{ kind: 'identifier', text: 'main' }`.

**Rationale**: With the render engine in Rust core (R6), generated TypeScript no longer needs runtime classes. Terminal and branch nodes are both data — the render engine treats them uniformly via render tables. This eliminates `LeafBuilder`, `LeafOptions`, and the entire class hierarchy for generated code.

**Alternatives considered**:
- Keep thin ES classes for fluent API — still possible as a layer over NodeData, but the core abstraction is data, not classes
- Use string-branded types for leaves — rejected, breaks uniform node representation

## R2: grammar.json as Source of Truth for Token Ordering

**Decision**: Use `grammar.json` rules (SEQ structure) to determine exact token order. Use `node-types.json` as authoritative for field required/multiple flags and named types.

**Rationale**: `node-types.json` does not encode token order — it lists fields and types but not the sequence in which keywords, punctuation, and fields appear in source. `grammar.json` rules provide the exact SEQ structure. The existing codebase already does this via `readGrammarRule()` in `grammar-reader.ts`.

**Alternatives considered**:
- Derive order heuristically from field names — rejected, produces wrong results for many node kinds
- Use only grammar.json for everything — rejected, `node-types.json` is more reliable for required/multiple flags

## R3: Edit Interface for ast-grep Compatibility

**Decision**: `Edit` is a Rust struct in `@sittir/core` exposed via WASM. `toEdit(nodeData, renderRules, startPos, endPos)` renders the node and wraps the result with byte offsets.

**Rationale**: ast-grep's `@ast-grep/napi` `SgNode.replace()` accepts an Edit with byte offsets. The Rust core renders and creates the edit in a single WASM call — no round-trip to JS for rendering. Keeps sittir as a library with no ast-grep dependency.

**Alternatives considered**:
- Accept an `SgNode` directly — rejected, creates hard dependency on `@ast-grep/napi`
- Return only strings — rejected, too low-level for codemod consumers

## R4: RenderContext Hook for External Formatting

**Decision**: The `render()` function in core accepts an optional format callback (JS function passed through WASM boundary). After rendering, if a format function is provided, core calls it and returns the formatted result.

**Rationale**: Codemod consumers need rendered output to match surrounding code style. Sittir doesn't own formatting (Constitution V). The callback pattern lets consumers wire in oxfmt, prettier, rustfmt, etc.

**Alternatives considered**:
- Built-in formatting — rejected, violates Library-First
- Format only on the JS side after render — viable fallback if WASM→JS callback overhead is too high; can measure and decide

## R5: Package Split — core (Rust/WASM) + types (pure TS)

**Decision**: Split into three packages:
- `@sittir/core` — Rust crate → WASM. Exports: `render()`, `validate()`, `toCST()`, `toEdit()`. Owns all runtime behavior.
- `@sittir/types` — Pure TypeScript. Exports: `NodeType<G,K>`, `DerivedNodeFields`, `NodeKind`, `FieldMap`. Zero runtime code.
- Generated packages (`@sittir/rust`, etc.) depend on `@sittir/core` for WASM runtime.

**Removed from TypeScript runtime**:
- `Builder` abstract class — no longer needed; nodes are data, not class instances
- `LeafBuilder<K>` — eliminated
- `LeafOptions<K>` — eliminated
- `TextBrand<K>` — eliminated
- `validateFast()`, `toCST()` — moved to Rust core

**Retained in @sittir/types** (pure types):
- `NodeType<G, K>` — type-level grammar projection
- `RenderRule` — TypeScript type for render table entries (mirrors Rust struct)
- `Edit` — TypeScript interface (mirrors Rust struct)
- `CSTNode`, `Position` — TypeScript interfaces (mirrors Rust structs)

**Rationale**: Constitution II (Fewer Abstractions) — generated code becomes data+types, not classes. The Rust core is a single render engine driven by data, not 200 per-node methods.

## R6: Rust Core — Render Tables as Data, Not Code

**Decision**: The codegen step emits render tables (serializable data) instead of `renderImpl()` method bodies. The Rust core's render engine walks these tables at runtime.

**Render table format** (emitted as TypeScript data, consumed by WASM):
```typescript
// Generated per node kind — a flat array of render steps
export const functionItemRule: RenderRule[] = [
  { token: 'fn' },
  { field: 'name', required: true },
  { token: '(' },
  { field: 'parameters', required: false, multiple: true, sep: ', ' },
  { token: ')' },
  { field: 'returnType', required: false, prefix: ' -> ' },
  { field: 'body', required: false },
];
```

**Rust render engine** (single function for all node kinds):
- Takes: node data (kind + field values) + render rules for that kind
- Walks rules sequentially: tokens → emit literal, fields → recursively render child node
- Handles: optional fields (skip if absent), multiple fields (join with separator), prefix/suffix tokens

**Rationale**: This is how tree-sitter itself works — grammar rules drive behavior, not per-node code. Benefits:
- Generated code is dramatically smaller (data tables vs full classes)
- Render correctness lives in one place (Rust core), not 200 files
- Native tree-sitter validation without JS interop
- Deterministic by construction (sequential rule walking)

**Alternatives considered**:
- Keep per-node renderImpl() in TypeScript — rejected, duplicates grammar structure as code; harder to validate and maintain
- Bundle grammar.json at runtime and interpret it directly — rejected, grammar.json's CHOICE/PREC/ALIAS structure is too complex for a simple render walk; pre-compiled render tables are the right intermediate representation

## R7: WASM Build and Distribution

**Decision**: Use `wasm-pack` to compile the Rust crate. Publish WASM as part of `@sittir/core` npm package. Support both Node.js (WASM via `@aspect-build/rules_js` or direct) and browser targets.

**Build pipeline**:
1. `cargo test` — Rust unit tests
2. `wasm-pack build --target nodejs` — produce `pkg/` with `.wasm` + `.js` glue + `.d.ts`
3. npm publish `@sittir/core` including the WASM binary

**Rationale**: wasm-pack is the standard Rust→WASM toolchain. The WASM binary is ~100-200KB (render engine + tree-sitter core). Node.js loads WASM natively. Browser support comes free.

**Alternatives considered**:
- napi-rs (native Node addon) — faster than WASM but no browser support; harder to distribute
- wasm-bindgen without wasm-pack — more manual but same result; wasm-pack is ergonomic

## R8: Unified Factory API — Declarative + Fluent + Mixed

**Decision**: Each generated factory function supports three usage modes that all produce the same `NodeData` plain object:
1. **Declarative** — config object with all fields: `ir.functionItem({ name: ..., body: ... })`
2. **Fluent** — required field positional, optional via chaining: `ir.functionItem(name).body(...)`
3. **Mixed** — required positional + config: `ir.functionItem(name, { body: ... })`

Fluent setters are plain property assignments on the NodeData object (via `Object.assign`), not class methods. No ES classes, no Proxy, no Builder base class in generated code.

**Rationale**: Declarative is the natural representation — NodeData IS a config object. Fluent is sugar for incremental construction. Supporting both costs ~3 extra lines per optional field (a setter function). The unified approach means consumers choose the style that fits their context without converting between representations.

**Implementation**: The factory accepts `(requiredFieldOrConfig, optionalConfig?)`. If the first arg is NodeData, it's the required field; if it's a plain config object, all fields come from it. Fluent setters mutate `fields` on the same object and return `this`.

**Alternatives considered**:
- Fluent-only (current approach) — rejected, forces chaining even when all fields are known upfront; declarative is more readable for fully-specified nodes
- Declarative-only — rejected, fluent chaining is ergonomic for incremental/conditional construction
- Proxy-based auto-generation of setters — rejected, performance cost and loss of type safety
- ES classes with methods — rejected, unnecessary abstraction; plain objects + assigned functions achieve the same API

## R9: Rust-Side ir Module

**Decision**: Codegen emits a Rust `ir` module alongside the TypeScript factories. This provides a native Rust fluent/declarative API for consumers building ast-grep codemods or Rust tools that don't need WASM.

```rust
// Generated: packages/core/src/ir/rust.rs
pub fn function_item(name: NodeData) -> FunctionItemBuilder { ... }
pub fn identifier(text: &str) -> NodeData { ... }
pub fn block() -> BlockBuilder { ... }

// FunctionItemBuilder has fluent setters that return self
impl FunctionItemBuilder {
    pub fn return_type(mut self, t: NodeData) -> Self { ... }
    pub fn body(mut self, b: NodeData) -> Self { ... }
    pub fn build(self) -> NodeData { ... }
}
```

**Rationale**: ast-grep is Rust underneath. A native Rust `ir` module lets codemod authors work entirely in Rust (match with ast-grep, construct with sittir, render with core) without crossing to JS/WASM. The codegen already has all the grammar metadata needed to emit Rust — it's a second emitter target, not a separate system.

**Alternatives considered**:
- Rust API only through WASM bindings from JS — rejected, forces Rust consumers through WASM unnecessarily
- Hand-write the Rust ir module — rejected, defeats the purpose of grammar-driven codegen
