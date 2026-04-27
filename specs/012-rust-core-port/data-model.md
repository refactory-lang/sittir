# Data Model — Rust Port of `@sittir/core`

**Phase 1 output.** Defines the concrete shapes that cross the JS↔Rust boundary, live inside the Rust engine, and flow through the render pipeline. Derived from spec FR-005a, FR-010, FR-020, FR-021, and research R3/R5.

---

## 1. Primitive NodeData (the boundary shape)

The sole shape Rust emits across the JS↔Rust boundary for read results. Exactly eight `$`-prefixed top-level fields per spec Q1 clarification.

### Rust representation

```rust
// rust/crates/sittir-core/src/types.rs
use serde::{Serialize, Deserialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeData {
    #[serde(rename = "$type")]
    pub type_: String,

    #[serde(rename = "$source")]
    pub source: Source,

    #[serde(rename = "$named")]
    pub named: bool,

    #[serde(rename = "$fields", default, skip_serializing_if = "Option::is_none")]
    pub fields: Option<HashMap<String, FieldValue>>,

    #[serde(rename = "$children", default, skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<NodeData>>,

    #[serde(rename = "$text", default, skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,

    #[serde(rename = "$span", default, skip_serializing_if = "Option::is_none")]
    pub span: Option<Span>,

    #[serde(rename = "$nodeId", default, skip_serializing_if = "Option::is_none")]
    pub node_id: Option<u32>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Source {
    Ts,
    Sg,
    Factory,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(untagged)]
pub enum FieldValue {
    Single(NodeData),
    Multiple(Vec<NodeData>),
    Text(String),
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub struct Span {
    pub start: u32,
    pub end: u32,
}
```

### Wire shape (JSON)

```json
{
  "$type": "function_item",
  "$source": "ts",
  "$named": true,
  "$fields": {
    "name": { "$type": "identifier", "$source": "ts", "$named": true, "$text": "foo", "$span": {"start": 42, "end": 45} },
    "parameters": { "$type": "parameters", "$source": "ts", "$named": true, "$children": [ ... ] }
  },
  "$span": { "start": 39, "end": 123 },
  "$nodeId": 17
}
```

**Invariants**:

- `$type` MUST be present.
- `$source` is always `"ts"` from `readNode` output; factory path produces `"factory"`; ast-grep path produces `"sg"`.
- `$named` is always present (absent = unknown, which the Rust side never is; tree-sitter always knows).
- `$fields`, `$children`, `$text`, `$span`, `$nodeId` are elided when absent (via serde's `skip_serializing_if`).
- `$text` appears only on leaf nodes (nodes with no children and no named fields).
- Field values in `$fields` are `Single` for 1-arity fields, `Multiple` for repeat fields, `Text` for inline literal positions (anonymous tokens captured as field values).
- No other top-level `$`-prefixed fields are permitted on the wire. `$variant`, `$raw`, promoted-keyword flags, supertype labels are **enrichment-layer only** and are added by the TypeScript `readTreeNode` / `_wrapTable` pipeline after receiving the primitive.

**Consumer-facing (enriched) NodeData** (TS-only — not on the wire):

```ts
// packages/{lang}/src/types.ts (existing; unchanged in shape)
interface NodeData extends PrimitiveNodeData {
	$variant?: string; // added by _wrapTable dispatch
	// + fluent getter/setter methods bound by factories
	// + kind-narrowed field typings
}
```

**Size expectations**: typical per-match primitive NodeData serialized to JSON is 200–500 bytes (per v3 spec input). Deeply nested matches (e.g. full function bodies returned as a single match) can reach tens of KB — still well inside napi + JSON.parse performance envelope.

**Note on `Span`** (Constitution Principle X check): `Span` is intentionally a narrow `{start: u32, end: u32}` rather than re-using `tree_sitter::Range`. `Range` additionally carries `start_point`/`end_point` row/column info that the JS side never consumes — importing it would serialize dead data on every cross-boundary hop. The narrow `Span` is the import-when-possible exception Principle X permits for wire-size reasons; documented here so the choice is discoverable.

---

## 2. TemplateContext + GrammarMeta (render input)

The pre-processed input a template consumes. Shape identical on both engines. Constructed by `sittir-core::prepare::build_template_context(node, meta)` from a NodeData plus a `GrammarMeta` providing grammar-specific lookup tables.

### GrammarMeta (trait)

Defined in `sittir-core::prepare` and implemented by each generated render crate (`sittir-{lang}-render`). Provides the grammar-specific facts `build_template_context` needs — separator lookup, variant classification — without hard-coding any grammar knowledge into `sittir-core` (preserves Constitution Principle VII).

```rust
// rust/crates/sittir-core/src/prepare.rs
pub trait GrammarMeta {
    /// Children-list separator for this kind, if the kind is a list container
    /// with a codegen-registered separator. Returns None for scalar kinds.
    /// Source: spec-011 joinby metadata per kind.
    fn separator_for(&self, kind: &str) -> Option<&str>;

    /// For the three variant-branching exception rules (FR-011):
    /// `rust/visibility_modifier`, `typescript/export_statement`,
    /// `typescript/call_expression`. Given a parent kind and the kind of its
    /// primary child, returns the variant label the parent's template expects
    /// (e.g. `"pub_crate"`, `"named_export"`). Returns None when the parent
    /// is not a variant-branching kind.
    fn variant_for(&self, parent_kind: &str, child_kind: &str) -> Option<&str>;

    /// Returns true if the kind is a list-container (repeat-position), so
    /// the children rendering uses `children_list` semantics + `joinby`.
    fn is_list_container(&self, kind: &str) -> bool;
}
```

**Per-grammar implementation**: `sittir-{lang}-render` emits a unit struct `pub struct RustGrammarMeta;` (or equivalent) with `impl GrammarMeta for RustGrammarMeta` — generated by codegen from the same `node-model.json5` + spec-011 separator metadata that the TS engine already uses. Source of truth is codegen output; no hand-written grammar-specific logic.

### TemplateContext

### Rust representation

```rust
// rust/crates/sittir-core/src/prepare.rs
use std::collections::HashMap;

pub struct TemplateContext {
    pub fields: HashMap<String, String>,  // raw field name → pre-rendered string
    pub children: String,                 // pre-rendered children joined
    pub children_list: Vec<String>,       // parallel list for `{% for c in children_list %}`
    pub variant: String,                  // variant label, "" if not applicable
    pub text: String,                     // leaf text, "" for branch nodes
    pub trailing_sep: bool,               // trailing separator flag for list positions
    pub leading_sep: bool,                // leading separator flag
}

impl TemplateContext {
    pub fn empty() -> Self { /* all fields zero-initialized */ }
}
```

### TS-side shape (for parity)

```ts
// packages/core/src/render.ts (existing)
interface TemplateContext {
	fields: Record<string, string>;
	children: string;
	children_list: string[];
	variant: string;
	text: string;
	trailing_sep: boolean;
	leading_sep: boolean;
}
```

**Invariants**:

- `fields` keys are raw (snake_case) field names — NOT camelCase. Templates reference `{{ visibility_modifier }}`, not `{{ visibilityModifier }}`.
- `children` is always the pre-rendered string even when `children_list` is also populated (templates pick whichever is convenient).
- `variant` is `""` (empty string), not `null` or absent — keeps templates simple: `{% if variant == "…" %}`.
- `trailing_sep` / `leading_sep` reflect the spec-011 separator semantics; unchanged.

---

## 3. Edit (boundary batch element)

A single replacement against the source string. Simple enough for direct N-API mapping (no JSON string roundtrip per R3).

### Rust representation

```rust
// rust/crates/sittir-core/src/types.rs
use napi_derive::napi;

#[napi(object)]
#[derive(Debug, Clone)]
pub struct Edit {
    pub start_pos: u32,
    pub end_pos: u32,
    pub inserted_text: String,
}
```

### TS-side shape

```ts
interface EditSpec {
	startPos: number;
	endPos: number;
	insertedText: string;
}
```

**Notes**:

- `#[napi(object)]` auto-generates the N-API boundary mapping with camelCase field renaming (TS side sees `startPos`/`endPos`/`insertedText`).
- `start_pos` / `end_pos` are byte offsets into the source string (UTF-8 byte positions). Consistent with ast-grep and tree-sitter conventions.
- Overlapping edits are not supported — `apply_edits` sorts by `start_pos` descending and applies in that order. Overlap detection is a consumer responsibility (existing TS sittir behavior).

---

## 4. SittirEngine (napi-bound) — stateful facade

The top-level napi export. Holds mutable state across the crossing so consumers don't pay reparse cost per operation.

### Rust representation

```rust
// rust/crates/sittir-{lang}-napi/src/lib.rs
use napi::bindgen_prelude::*;
use napi_derive::napi;
use sittir_core::types::{Edit, NodeData};

#[napi]
pub struct SittirEngine {
    // Grammar is implicit in crate identity — no runtime language field
    parser: tree_sitter::Parser,
    source: Option<String>,
    tree: Option<tree_sitter::Tree>,
    /// Per-engine-instance monotonic counter for `$nodeId`. Assigned during
    /// `find_and_read` as each tree node is visited. RESET on each call to
    /// `find_and_read` (a fresh parse produces a new tree; stale nodeIds
    /// would drill into wrong nodes). Not a process-wide identifier.
    next_node_id: u32,
    // No runtime template environment — askama compiles templates into per-kind
    // Display impls at cargo build time. render() dispatches on $type to the
    // appropriate per-kind struct (see sittir-{lang}-render::render_dispatch).
}

#[napi]
impl SittirEngine {
    #[napi(constructor)]
    pub fn new() -> Self { /* set parser language from tree_sitter_{lang}::LANGUAGE */ }

    /// Returns JSON string: `Vec<NodeData>` serialized. Per R3.
    #[napi]
    pub fn find_and_read(&mut self, source: String, pattern: String) -> Result<String>;

    /// Returns JSON string: single `NodeData`.
    #[napi]
    pub fn read_node(&self, node_id: u32) -> Result<String>;

    /// Accepts NodeData JSON string (TS side does JSON.stringify), returns rendered source.
    #[napi]
    pub fn render(&self, node_json: String) -> Result<String>;

    /// Batch splice. Direct N-API mapping for Edit per R3.
    #[napi]
    pub fn apply_edits(&self, source: String, edits: Vec<Edit>) -> Result<String>;

    /// Template bundle hash for FR-020 compatibility check.
    #[napi(getter)]
    pub fn template_bundle_hash(&self) -> &'static str {
        sittir_{lang}_render::TEMPLATE_BUNDLE_HASH
    }
}
```

**Lifecycle**:

1. `new()` — construct engine, set parser language, initialize `next_node_id = 0`. No source loaded yet.
2. `find_and_read(source, pattern)` — stores `source` + new parse tree in self, **resets `next_node_id` to 0**, walks matches assigning monotonically increasing `$nodeId` as each node is visited, returns matches as JSON string. Subsequent `read_node(id)` calls drill into the same tree.
3. `read_node(id)` — drill-in. Uses the stored tree + source. Returns primitive NodeData JSON. **Valid only for `id` values assigned during the most recent `find_and_read` call** — the counter reset in step 2 invalidates older IDs. A stale ID throws `Error("node id N not found in current tree")`.
4. `render(node_json)` — stateless. Parses the supplied NodeData (either freshly-constructed by a factory or read from earlier), returns rendered string. Does NOT rely on engine state; safe to call without a prior `find_and_read`.
5. `apply_edits(source, edits)` — stateless string rewrite. Source is re-passed because the engine's stored source may have been replaced mid-codemod.
6. `template_bundle_hash` — property access, no computation.

**Thread safety**: `SittirEngine` is `!Send` + `!Sync` by default (tree-sitter `Parser` and `Tree` are not thread-safe). Each JS thread that uses the engine creates its own instance; napi-rs handles the per-thread instantiation for us.

---

## 5. Backend-selection API (JS-side; per FR-021)

```ts
// packages/{lang}/src/backend.ts (new)

export type BackendName = "native" | "typescript";

export interface BackendStatus {
	name: BackendName;
	/** Populated on fallback; reason native was unavailable. */
	reason?: string;
	/** Outcome of FR-020 hash comparison when native was considered. */
	hashMatch?: boolean;
}

export function getActiveBackend(): BackendStatus;

// Exported from packages/{lang}/src/index.ts
```

**Invariants**:

- `getActiveBackend()` is pure and idempotent — once the backend is selected at module load, the status is fixed for the lifetime of the process.
- `reason` is absent when `name === "native"` and the native backend loaded cleanly.
- Environment variable `SITTIR_BACKEND_DEBUG=1` (or any non-empty value) triggers a single-line stderr diagnostic at first selection — NOT on every subsequent call.
- Default (env var unset) is fully silent — no stderr/stdout output.

---

## 6. Fixture record (parity-test corpus)

Per FR-012, fixtures are auto-extracted from the existing round-trip validator on each codegen run. Written to `rust/tests/fixtures/`.

### Shape

```ts
// Written by codegen as packages/{lang}/rust-render/test-fixtures.json
interface RenderFixture {
	kind: "render";
	grammar: "rust" | "typescript" | "python";
	input: NodeData; // primitive NodeData input
	expectedOutput: string; // TS engine's render output (the reference)
}

interface RoundTripFixture {
	kind: "roundtrip";
	grammar: "rust" | "typescript" | "python";
	sourceIn: string; // original source
	pattern: string; // ast-grep pattern matched
	edits: EditSpec[]; // edits applied
	expectedSourceOut: string; // TS engine's final source (for byte-diff)
	/**
	 * Serialized expected AST — tree-sitter s-expression form, produced by
	 * `Tree::root_node().to_sexp()` on the Rust side or the equivalent
	 * `Tree.rootNode.toString()` on the TS side. Stable, deterministic, shared
	 * between engines. Used by the semantic-parity bar (FR-002b / SC-001b):
	 * outputs from both engines must re-parse to strings that compare equal.
	 */
	expectedReparseTree: string;
}

type Fixture = RenderFixture | RoundTripFixture;
```

**Consumption**:

- Rust side (`rust/tests/parity.rs`): loads the JSON, runs the Rust engine over `input` (render) or `sourceIn` + `pattern` + `edits` (round-trip), compares against expected per the appropriate parity bar.
- TS side (`packages/{lang}/tests/parity.test.ts`): same inputs, runs the TS engine — sanity check that the expected outputs are re-producible (catches fixture-generation bugs).

**Invariants**:

- Fixtures are regenerated on every codegen run (not hand-maintained).
- `expectedOutput` and `expectedSourceOut` are captured from the TS engine at the time of generation (it is the reference). Any Rust-vs-TS divergence on a fresh fixture is a Rust bug by definition.

---

## Summary of entities

| Entity             | Owner                                              | Serialization                    | Used by                                                            |
| ------------------ | -------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------ |
| Primitive NodeData | Rust (`sittir-core::types`)                        | JSON string across napi boundary | TS enrichment (`readTreeNode`, `_wrapTable`); Rust render pipeline |
| TemplateContext    | Both engines                                       | In-process (not serialized)      | askama render (Rust, per-kind structs); Nunjucks render (TS)       |
| Edit               | Rust (`sittir-core::types`) with `#[napi(object)]` | Direct N-API mapping             | `apply_edits` boundary call; TS factory `.toEdit()`                |
| Span               | Rust (`sittir-core::types`)                        | Inline in NodeData               | Read pipeline; edit position resolution                            |
| SittirEngine       | Rust (`sittir-{lang}-napi`)                        | napi class                       | JS runtime-selection shim                                          |
| BackendStatus      | TypeScript (`packages/{lang}/src/backend.ts`)      | N/A (pure JS object)             | Consumer debugging / FR-021                                        |
| Fixture records    | Codegen (TS)                                       | JSON file per grammar            | Both engines' parity-test harnesses                                |

All shapes are derived from already-clarified spec decisions. No new ambiguity introduced.
