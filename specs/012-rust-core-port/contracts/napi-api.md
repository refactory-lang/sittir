# Contract — napi API surface

**Artifact**: `@sittir/{lang}` (grammar-local `.node` addon)
**Consumer**: `@sittir/{lang}` top-level JS shim (runtime backend selection)
**Maintained by**: `rust/crates/sittir-{lang}/src/lib.rs`

---

## Exported class: `SittirEngine`

```ts
// Type signature as seen from the TypeScript consumer side
export class SittirEngine {
	constructor(grammar: 'rust' | 'typescript' | 'python', options?: { format?: string });

	/** Template bundle hash baked at build time. Property access. */
	readonly templateBundleHash: string;

	/** Parse source + search pattern + read matches. Returns JSON string. */
	findAndRead(source: string, pattern: string): string;

	/** Drill into a previously-returned node by its $nodeId. Returns JSON string. */
	readNode(nodeId: number): string;

	/** Render a NodeData to source. Input is a JSON string (TS does JSON.stringify). */
	render(nodeJson: string): string;

	/** Apply a batch of edits to a source string; returns modified source. */
	applyEdits(source: string, edits: EditSpec[]): string;

	/** Clear cached tree/source/inferred-format state held by this engine instance. */
	dispose(): void;
}

export interface EditSpec {
	startPos: number;
	endPos: number;
	insertedText: string;
}
```

---

## Method contracts

### `new SittirEngine(grammar, options?)`

- **Pre**: `grammar` is one of `'rust'`, `'typescript'`, or `'python'`.
- **Post**: engine is ready to accept `findAndRead` calls. When `options.format`
  is present, it is parsed once at construction and remains fixed for the
  lifetime of that engine instance.
- **Errors**: never throws. If the native binary can be constructed at all, construction succeeds.
- **Thread**: caller's thread; instance is `!Send`/`!Sync`. Each JS worker thread needs its own.

### `templateBundleHash: string` (getter)

- **Returns**: the SHA-256 hex string (lowercase, 64 chars) baked into this binary at codegen/build time.
- **Stability**: constant for the lifetime of the process.
- **Used by**: the JS runtime-selection shim to compare against the TS-side `TEMPLATE_BUNDLE_HASH` export (per FR-020). Mismatch → native is refused, TS fallback loads.

### `findAndRead(source: string, pattern: string): string`

- **Pre**: `source` is valid UTF-8; `pattern` is a valid ast-grep pattern for this grammar.
- **Post**: a JSON string parseable by `JSON.parse` into `NodeData[]`. Engine internally retains `source` + parse tree for subsequent `readNode` calls.
- **Returns shape**: `JSON.stringify(NodeData[])` where each element is primitive NodeData per the wire contract.
- **Errors**:
  - Invalid UTF-8 in source → throws (napi-rs `Error` surfaces to JS as `Error`).
  - Parse error in pattern → throws with pattern + position info from ast-grep-core.
  - Parse error in source is NOT an error — tree-sitter is error-recovering; matches are returned against the recovered tree.
- **Thread**: caller's thread. Mutates `self.source` and `self.tree`.

### `readNode(nodeId: number): string`

- **Pre**: `nodeId` was returned by a prior `findAndRead` or `readNode` call in this engine instance's lifetime.
- **Post**: a JSON string parseable by `JSON.parse` into a single `NodeData`.
- **Errors**:
  - `nodeId` not valid for the currently-stored tree → throws `Error` with message `"node id N not found in current tree"`.
  - No tree currently stored (no prior `findAndRead`) → throws.

### `render(nodeJson: string): string`

- **Pre**: `nodeJson` is a valid JSON-stringified NodeData. The `$type` field must match a registered kind in this grammar's template set.
- **Post**: the rendered source string.
- **Format resolution**:
  1. engine-level `options.format` when present
  2. cached tree-level inferred format from the most recent `parseAndRead`, but only for non-`$source: "factory"` nodes
  3. canonical output when neither format source applies
- **Errors**:
  - Invalid JSON → throws.
  - Unknown `$type` → throws `Error("no template registered for kind 'X'")`.
  - Template render error (askama) → throws with template filename + line. (Most template defects fail `cargo build` per FR-008; runtime errors here are limited to value-level issues the compile-time type check cannot catch, e.g. a template iterating a list that turned out empty under a strict-mode filter.)
- **State use**: render reads immutable engine config plus any cached tree-level
  inferred format held by the engine. It does not mutate that state.

### `applyEdits(source: string, edits: EditSpec[]): string`

- **Pre**: `source` is valid UTF-8. `edits` is a list of non-overlapping edits, each with `0 <= startPos <= endPos <= source.byteLength`.
- **Post**: the modified source string with all edits applied. Edits are applied in `startPos`-descending order so later edits don't shift the offsets of earlier ones.
- **Errors**:
  - `endPos < startPos` → throws `Error("invalid edit range")`.
  - `endPos > source.byteLength` → throws.
- Overlapping edits → NOT detected; last-wins behavior. Documented consumer responsibility (matches existing TS `edit.ts` behavior).
- **Purity**: stateless.

### `dispose(): void`

- **Pre**: none.
- **Post**: cached `source`, cached parse tree, and cached inferred tree-level format are cleared.
- **State retained**: immutable engine-level `options.format`, when present, remains attached to the engine instance.
- **Errors**: never throws.
- **Use case**: release per-source cached state without constructing a new engine.

---

## Error surface

All errors are napi-rs `Error` instances with a `.message` populated from the Rust `Result::Err` path. No error codes at MVP (consumers check message or the backend-selection layer handles load-time fallbacks silently).

## Not exposed (explicitly)

- No async methods in MVP. Everything is synchronous napi. (Consumer concurrency via Node worker threads; each gets its own engine.)
- No "streaming" variant of `findAndRead`. Full result set is returned at once.
- No direct tree-sitter `Tree` or `Node` handles across the boundary. Consumers only see NodeData + `nodeId`.
- No `renderAndEdit(batch)` combined endpoint. Deferred per research R4.

## Version contract

- The `@sittir/{lang}` npm package version MUST match the `@sittir/{lang}` package version within a MAJOR.MINOR window. Patch-level divergence is tolerated via the hash check (FR-020).
- Breaking changes to this napi surface (method signature changes) require a MAJOR bump of `@sittir/{lang}` and each consuming grammar package.
