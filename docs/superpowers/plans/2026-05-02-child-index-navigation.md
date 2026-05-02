# ADR-0017: Child-Index Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `$nodeId` (O(n) tree walk) with `$nodeHandle` + `$childIndex` (O(1) lookup + O(1) child access) for lazy drill-in across the napi boundary.

**Architecture:** Decouple the Rust engine into a stateless `Engine` (parser + grammar) and an owned `ParsedTree` (tree + source + node vec). Parse produces a `ParsedTree`; drill-in reads from it. The node vec stores `StoredNode` enum values (tree-sitter `Node<'static>` today, ast-grep `SgNode<'static>` tomorrow). Lifetime safety follows the ast-grep `PinnedNodeData` pattern: cast `&self.tree` to `&'static Tree` (one `unsafe` line), nodes are dropped before tree (field order). O(1) lookup + O(1) child access. JS/WASM side uses `SyntaxNode[]` (O(1) direct).

**Tech Stack:** Rust (sittir-core), TypeScript (ESM), napi-rs, web-tree-sitter, vitest

**Spec:** `docs/superpowers/specs/2026-05-02-child-index-navigation-design.md`

---

## File Structure

| File | Responsibility | Action |
|------|---------------|--------|
| `rust/crates/sittir-core/src/types.rs` | Wire shape types | Modify: `node_handle` + `child_index` replace `node_id` |
| `rust/crates/sittir-core/src/engine.rs` | Engine + tree handle | Modify: split into stateless `Engine` + owned `NativeTreeHandle` |
| `rust/crates/sittir-core/src/read_node.rs` | Rust readNode | Modify: accept `Node` directly, remove `find_by_id` |
| `packages/types/src/core-types.ts` | TS wire shape types | Modify: `$nodeHandle` + `$childIndex` replace `$nodeId` |
| `packages/core/src/readNode.ts` | JS readNode + TreeHandle | Modify: update TreeHandle, add nodes array |
| `packages/core/src/engine.ts` | JS engine handle | Modify: update read dispatch |
| `packages/core/src/native-boundary.ts` | Napi boundary validation | Modify: validate new fields |
| `packages/codegen/src/emitters/wrap.ts` | Wrap emitter (drillIn/drillAs) | Modify: reference new fields |
| `packages/core/tests/readNode.test.ts` | readNode unit tests | Modify: update mock + assertions |
| `packages/core/tests/node-handle-gc.test.ts` | Memory leak verification | Create |

---

### Task 1: Rust — split Engine into Engine + NativeTreeHandle

**Files:**
- Modify: `rust/crates/sittir-core/src/engine.rs`

The current `Engine` struct owns parser + tree + source + format. Split it:

- [ ] **Step 1: Define `StoredNode` enum and `ParsedTree` struct**

```rust
/// Node handle — generic over the tree-sitter backend.
/// Enum for zero-alloc dispatch; exhaustive match forces handling
/// when the ast-grep variant is added.
pub enum StoredNode {
    Ts(tree_sitter::Node<'static>),
    // Sg(ast_grep_core::Node<'static>),  // future
}

/// Owned parse result. Holds the tree, source, format, and node table
/// for O(1) lazy drill-in. Created by Engine::parse, consumed by
/// drill-in calls. Dropped when the JS TreeHandle is GC'd.
///
/// Safety: follows the ast-grep PinnedNodeData pattern. Nodes in the
/// vec borrow from `tree` via a `&'static Tree` cast. Sound because:
/// 1. `nodes` is declared after `tree` → dropped first (Rust field order)
/// 2. `tree` is never moved or replaced while `nodes` is populated
/// 3. ParsedTree is napi-owned — lives on JS heap until GC
pub struct ParsedTree<G: EngineGrammar> {
    grammar: G,
    tree: tree_sitter::Tree,
    source: String,
    format: Option<FormatRecord>,
    /// Node table for O(1) drill-in. Lazily populated — starts empty.
    nodes: Vec<StoredNode>,
}

impl<G: EngineGrammar> ParsedTree<G> {
    /// Pin the tree reference to 'static for node creation.
    /// SAFETY: self owns tree; nodes are dropped before tree.
    fn tree_static(&self) -> &'static tree_sitter::Tree {
        unsafe { &*(&self.tree as *const tree_sitter::Tree) }
    }

    fn push_node(&mut self, node: tree_sitter::Node<'_>) -> u32 {
        let handle = self.nodes.len() as u32;
        // SAFETY: node borrows from self.tree which outlives self.nodes
        let static_node: tree_sitter::Node<'static> = unsafe { std::mem::transmute(node) };
        self.nodes.push(StoredNode::Ts(static_node));
        handle
    }
}
```

- [ ] **Step 2: Move tree/source/format off Engine**

```rust
pub struct Engine<G: EngineGrammar> {
    grammar: G,
    parser: tree_sitter::Parser,
    engine_format: Option<FormatRecord>,
}
```

Remove `source`, `tree`, `tree_format` fields.

- [ ] **Step 3: Update `Engine::parse_and_read` to return `NativeTreeHandle`**

```rust
impl<G: EngineGrammar> Engine<G> {
    pub fn parse(&mut self, source: String) -> Result<NativeTreeHandle<G>, String> {
        let tree = self.parser.parse(&source, None).ok_or_else(|| {
            let snippet: String = source.chars().take(80).collect();
            format!("parse failed (source: {snippet:?})")
        })?;
        let format = extract_format(&source, &tree);
        Ok(NativeTreeHandle {
            grammar: self.grammar,
            tree,
            source,
            format,
            node_spans: Vec::new(),
        })
    }
}
```

- [ ] **Step 4: Move `read_node` and `render` methods to `NativeTreeHandle`**

```rust
impl<G: EngineGrammar> NativeTreeHandle<G> {
    pub fn read_root(&self) -> Result<String, String> {
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            read_node(&self.tree, &self.source, None)
        }));
        match result {
            Ok(mut data) => {
                let handle = self.push_node_span(&self.tree.root_node());
                data.node_handle = Some(handle);
                serde_json::to_string(&ParseResult {
                    node_data: &data,
                    format: self.format.clone(),
                })
                .map_err(|e| format!("serialize failed: {e}"))
            }
            Err(p) => Err(panic_msg(p, "parse_and_read panicked")),
        }
    }

    pub fn read_node(&mut self, handle: f64, child_index: f64) -> Result<String, String> {
        let h = handle as u32;
        let ci = child_index as u32;

        let parent = match self.nodes.get(h as usize) {
            Some(StoredNode::Ts(n)) => *n,
            None => return Err(format!("invalid node handle {h}")),
        };

        let child = parent.child(ci as usize)
            .ok_or_else(|| format!("no child at index {ci}"))?;

        let child_handle = self.push_node(child);

        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            let mut data = crate::read_node::read_node(&self.tree, &self.source, Some(child));
            data.node_handle = Some(child_handle);
            data
        }));
        match result {
            Ok(data) => serde_json::to_string(&data)
                .map_err(|e| format!("serialize failed: {e}")),
            Err(p) => Err(panic_msg(p, "read_node panicked")),
        }
    }

    pub fn render(&self, node: &NodeData) -> Result<String, String> {
        let canonical = self.grammar.render(node)
            .map_err(|e| format!("render failed: {e}"))?;
        let effective_format = resolve_render_format(node, None, self.format.as_ref());
        Ok(match effective_format {
            Some(format) => apply_format(&canonical, format),
            None => canonical,
        })
    }

    fn push_node_span(&mut self, node: &tree_sitter::Node) -> u32 {
        let handle = self.node_spans.len() as u32;
        let range = node.byte_range();
        self.node_spans.push((range.start as u32, range.end as u32));
        handle
    }
}
```

- [ ] **Step 5: Remove `dispose`, `validate_node_id`, `MAX_SAFE_NODE_ID`**

These are no longer needed — `NativeTreeHandle` is dropped by GC, no manual dispose.

- [ ] **Step 6: Build to verify**

```bash
cd rust && cargo build 2>&1 | head -30
```

Expected: compile errors in grammar crates that use the old `Engine` API. Fixed in Task 2.

- [ ] **Step 7: Commit**

```bash
git add rust/crates/sittir-core/src/engine.rs
git commit -m "rust: split Engine into stateless Engine + owned NativeTreeHandle"
```

---

### Task 2: Rust — update NodeData wire shape + readNode

**Files:**
- Modify: `rust/crates/sittir-core/src/types.rs:108-117`
- Modify: `rust/crates/sittir-core/src/read_node.rs:47-121`

- [ ] **Step 1: Replace `node_id` with `node_handle` + `child_index` on `NodeData`**

```rust
// In NodeData struct, replace lines 108-117:

    #[serde(rename = "$nodeHandle", default, skip_serializing_if = "Option::is_none")]
    pub node_handle: Option<u32>,

    #[serde(rename = "$childIndex", default, skip_serializing_if = "Option::is_none")]
    pub child_index: Option<u16>,
```

- [ ] **Step 2: Update `read_node` to accept `Option<Node>` instead of `Option<u64>`**

```rust
pub fn read_node(tree: &tree_sitter::Tree, source: &str, target: Option<tree_sitter::Node>) -> NodeData {
    let node = target.unwrap_or_else(|| tree.root_node());
    read_ts_node(node, source)
}
```

- [ ] **Step 3: Delete `find_by_id` function (lines 58-71)**

Remove entirely — no longer needed.

- [ ] **Step 4: Update `read_ts_node` to set `child_index` and clear `node_handle`**

```rust
// In read_ts_node, replace the NodeData construction:
NodeData {
    type_: kind,
    source: Source::Ts,
    named,
    fields,
    children,
    text,
    span: Some(span),
    node_handle: None,   // stamped by NativeTreeHandle after push
    child_index: None,   // set in read_children for child entries
}
```

- [ ] **Step 5: Update `read_children` to set `child_index` on each child**

In the child loop inside `read_children`, after constructing the child `NodeData`:

```rust
child_data.child_index = Some(i as u16);
```

Where `i` is the loop counter (child's position in parent's children array).

- [ ] **Step 6: Build and run tests**

```bash
cd rust && cargo build && cargo test 2>&1 | tail -20
```

- [ ] **Step 7: Commit**

```bash
git add rust/crates/sittir-core/src/types.rs rust/crates/sittir-core/src/read_node.rs
git commit -m "rust: NodeData wire shape node_handle + child_index, readNode accepts Node directly"
```

---

### Task 3: Rust — update grammar crate napi wrappers

**Files:**
- Modify: `rust/crates/sittir-rust/src/lib.rs` (and equivalent for typescript, python)

The grammar crate napi wrappers currently call `Engine::parse_and_read` and `Engine::read_node`. Update them to use the split `Engine::parse` → `NativeTreeHandle::read_root` / `NativeTreeHandle::read_node` API.

- [ ] **Step 1: Find all napi wrapper call sites**

```bash
rg 'parse_and_read\|\.read_node\(' rust/crates/sittir-rust/src/ rust/crates/sittir-typescript/src/ rust/crates/sittir-python/src/ --type rust
```

- [ ] **Step 2: Update each grammar crate's napi class**

The napi class should now hold both the `Engine` and an `Option<NativeTreeHandle>`:

```rust
#[napi]
struct SittirEngine {
    engine: Engine<RustGrammar>,
    handle: Option<NativeTreeHandle<RustGrammar>>,
}

#[napi]
impl SittirEngine {
    #[napi(constructor)]
    pub fn new() -> napi::Result<Self> {
        // ... create engine ...
        Ok(Self { engine, handle: None })
    }

    #[napi]
    pub fn parse_and_read(&mut self, source: String) -> napi::Result<String> {
        let tree_handle = self.engine.parse(source).map_err(napi_err)?;
        let result = tree_handle.read_root().map_err(napi_err)?;
        self.handle = Some(tree_handle);
        Ok(result)
    }

    #[napi]
    pub fn read_node(&mut self, handle: f64, child_index: f64) -> napi::Result<String> {
        let h = self.handle.as_mut().ok_or_else(|| napi_err("no tree"))?;
        h.read_node(handle, child_index).map_err(napi_err)
    }
}
```

- [ ] **Step 3: Build all grammar crates**

```bash
cd rust && cargo build 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add rust/crates/
git commit -m "rust: grammar crate napi wrappers use Engine + NativeTreeHandle split"
```

---

### Task 4: Rust tests — update for new wire shape

**Files:**
- Modify: `rust/crates/sittir-core/tests/read_node.rs`

- [ ] **Step 1: Update assertions**

Replace `$nodeId` / `node_id` references with `node_handle` + `child_index`. Update uniqueness tests to verify child indices are sequential per parent.

- [ ] **Step 2: Run tests**

```bash
cd rust && cargo test 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add rust/crates/sittir-core/tests/
git commit -m "rust: update tests for node_handle + child_index"
```

---

### Task 5: TypeScript types — update `AnyNodeData` wire shape

**Files:**
- Modify: `packages/types/src/core-types.ts:39-42, 86-87`
- Modify: `packages/types/src/index.ts`

- [ ] **Step 1: Remove `NodeId` branded type, add new fields**

```typescript
// Remove lines 39-42 (NodeId declaration)

// Replace $nodeId field (line 86-87) with:
/** Index into engine's node-span table for O(1) drill-in. */
$nodeHandle?: number;
/** Position in parent's child array. Used with parent.child(i). */
$childIndex?: number;
```

- [ ] **Step 2: Remove `NodeId` from all exports and imports**

```bash
rg 'NodeId' packages/ --type ts -l
```

Update each file to remove `NodeId` imports and replace with `number`.

- [ ] **Step 3: Type-check to find remaining references**

```bash
pnpm -r run type-check 2>&1 | grep 'error TS' | head -20
```

- [ ] **Step 4: Commit**

```bash
git add packages/types/
git commit -m "types: $nodeHandle + $childIndex replace $nodeId, remove NodeId type"
```

---

### Task 6: JS `readNode` — node array + handle assignment

**Files:**
- Modify: `packages/core/src/readNode.ts:40-87, 170-235`

- [ ] **Step 1: Update `TreeHandle` interface**

```typescript
export interface TreeHandle {
  rootNode: AnyTreeNode;
  source?: string;
  read?(handle?: number, childIndex?: number): AnyNodeData;
  render?(handle?: number, options?: { ignoreFormat?: boolean }): string;
  format?: FormatRecord;
  kindIdFromName?: (kind: string) => number | undefined;
  /** Node table for O(1) drill-in. Lazily populated by readNode. */
  nodes?: AnyTreeNode[];
}
```

Remove `nodeById` entirely.

- [ ] **Step 2: Replace `toNodeId` with `pushNode`**

```typescript
function pushNode(tree: TreeHandle, node: AnyTreeNode): number {
  const nodes = tree.nodes ?? (tree.nodes = []);
  const handle = nodes.length;
  nodes.push(node);
  return handle;
}
```

- [ ] **Step 3: Update child entry construction**

Push the parent once before the loop, set `$nodeHandle` + `$childIndex` on each child:

```typescript
const parentHandle = pushNode(tree, node);

for (let i = 0; i < allChildren.length; i++) {
  const child = allChildren[i]!;
  const entry: AnyNodeData = {
    $type: resolveKindId(child.type),
    $source: 'ts',
    $text: child.text(),
    $span: { start: child.range().start.index, end: child.range().end.index },
    $nodeHandle: parentHandle,
    $childIndex: i,
    $named: child.isNamed()
  };
  // ... field/child placement unchanged ...
}
```

- [ ] **Step 4: Update root return**

```typescript
return {
  $type: resolveKindId(node.type),
  $source: 'ts',
  $text: !hasStructure || DEBUG_TEXT ? node.text() : undefined,
  $fields: Object.keys(fields).length > 0 ? fields : undefined,
  $children: children.length > 0 ? children : undefined,
  $span: { start: node.range().start.index, end: node.range().end.index },
  $nodeHandle: parentHandle,
  $named: node.isNamed()
};
```

- [ ] **Step 5: Update readNode entry to support handle + childIndex drill-in**

```typescript
export function readNode(tree: TreeHandle, handle?: number, childIndex?: number): AnyNodeData {
  if (tree.read) return tree.read(handle, childIndex);

  const node = handle != null && childIndex != null && tree.nodes
    ? tree.nodes[handle]!.children()[childIndex]!
    : tree.rootNode;

  // ... rest of function body uses `node` ...
}
```

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/readNode.ts
git commit -m "core: readNode uses node-table + child-index for O(1) drill-in"
```

---

### Task 7: JS engine handle — update read dispatch

**Files:**
- Modify: `packages/core/src/engine.ts:172-196`

- [ ] **Step 1: Update native engine handle**

```typescript
read: (handle, childIndex) => {
  if (handle === undefined) return parsed.nodeData;
  const nodeJson = engine.readNode(handle, childIndex ?? 0);
  return JSON.parse(nodeJson) as AnyNodeData;
},
```

- [ ] **Step 2: Remove `nodeById` stub from native handle**

- [ ] **Step 3: Update render closure**

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/engine.ts
git commit -m "core: engine read dispatch uses handle + childIndex"
```

---

### Task 8: Wrap emitter — drillIn/drillAs reference new fields

**Files:**
- Modify: `packages/codegen/src/emitters/wrap.ts:147-190`

- [ ] **Step 1: Update `drillIn` emission**

```typescript
'function drillIn(entry: unknown, tree: TreeHandle): unknown {',
'  if (!entry) return undefined;',
'  const e = entry as _NodeData;',
'  if (e.$nodeHandle != null && e.$childIndex != null) return readTreeNode(tree, e.$nodeHandle, e.$childIndex);',
'  return entry;',
'}'
```

- [ ] **Step 2: Update `drillAs` emission**

```typescript
'function drillAs(entry: unknown, tree: TreeHandle, fromType: string, toType: string): unknown {',
'  if (!entry) return undefined;',
'  const e = entry as _NodeData;',
'  if (e.$nodeHandle == null || e.$childIndex == null) return entry;',
'  return readTreeNode(tree, e.$nodeHandle, e.$childIndex, { from: fromType, to: toType });',
'}'
```

- [ ] **Step 3: Regenerate all grammars**

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --skip-ts-chain --no-build-native --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --skip-ts-chain --no-build-native --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --skip-ts-chain --no-build-native --output packages/python/src
```

- [ ] **Step 4: Commit**

```bash
git add packages/codegen/src/emitters/wrap.ts packages/rust/src/ packages/typescript/src/ packages/python/src/
git commit -m "codegen: wrap drillIn/drillAs use $nodeHandle + $childIndex"
```

---

### Task 9: Native boundary validation

**Files:**
- Modify: `packages/core/src/native-boundary.ts:135-136`

- [ ] **Step 1: Update validation**

```typescript
if (value.$nodeHandle !== undefined)
  assertFiniteNumber(value.$nodeHandle, `${path}.$nodeHandle`);
if (value.$childIndex !== undefined)
  assertFiniteNumber(value.$childIndex, `${path}.$childIndex`);
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/src/native-boundary.ts
git commit -m "core: native boundary validates $nodeHandle + $childIndex"
```

---

### Task 10: Update tests

**Files:**
- Modify: `packages/core/tests/readNode.test.ts`

- [ ] **Step 1: Update mock TreeHandle — remove `nodeById`, add `nodes`**

- [ ] **Step 2: Add assertions for `$nodeHandle` and `$childIndex`**

```typescript
expect(data.$nodeHandle).toBeDefined();
expect(data.$childIndex).toBeUndefined(); // root has no parent

const child = data.$fields!.type as AnyNodeData;
expect(child.$nodeHandle).toBeDefined();
expect(child.$childIndex).toBeDefined();
```

- [ ] **Step 3: Run tests, commit**

```bash
pnpm test 2>&1 | tail -10
git add packages/core/tests/
git commit -m "tests: readNode assertions for $nodeHandle + $childIndex"
```

---

### Task 11: Memory leak verification test

**Files:**
- Create: `packages/core/tests/node-handle-gc.test.ts`

- [ ] **Step 1: Write the GC verification test**

```typescript
import { describe, it, expect } from 'vitest';

describe('node handle memory lifecycle', () => {
  it('tree handle does not leak after release', async () => {
    if (typeof globalThis.gc !== 'function') {
      console.warn('Skipping — run with --expose-gc');
      return;
    }

    globalThis.gc();
    const before = process.memoryUsage().heapUsed;

    for (let i = 0; i < 100; i++) {
      // Create and immediately discard tree handles
      // (import engine, parse, discard reference)
    }

    globalThis.gc();
    const after = process.memoryUsage().heapUsed;
    const delta = after - before;

    // 1MB tolerance for module caching / JIT
    expect(delta).toBeLessThan(1_000_000);
  });
});
```

- [ ] **Step 2: Run and commit**

```bash
pnpm test -- packages/core/tests/node-handle-gc.test.ts
git add packages/core/tests/node-handle-gc.test.ts
git commit -m "tests: memory leak verification for node handle lifecycle"
```

---

### Task 12: Full integration verification

- [ ] **Step 1: Type-check all packages**

```bash
pnpm -r run type-check 2>&1 | grep -c 'error TS'
```

Expected: 0 errors.

- [ ] **Step 2: Run full test suite**

```bash
pnpm test 2>&1 | tail -10
```

Expected: 4378+ passed, no regressions.

- [ ] **Step 3: Verify no `$nodeId` references remain**

```bash
rg '\$nodeId\b' packages/ --type ts | grep -v node_modules | grep -v '.d.ts'
rg 'node_id' rust/crates/sittir-core/src/ --type rust
```

Expected: zero hits.

- [ ] **Step 4: Final commit**

```bash
git commit -m "chore: ADR-0017 complete — $nodeId replaced with $nodeHandle + $childIndex"
```
