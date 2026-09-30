# Relative Coordinates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace absolute byte spans with points relative to the parent, so a node's layout survives detaching, copying and seating, and every coordinate fact is derived instead of stamped.

**Architecture:** The reader emits `$span` as two points relative to the tree-sitter parent. The render's prepare walk carries a frame (a position and its tree) from the root. It resolves each coordinate to bytes through the tree's line-start table. A coordinate or transport that the frame can't place anchors itself through its handle, at the start of the node its points are measured from. Trivia ownership encodes which side of a token a comment sits on. Detached nodes render seams from geometry through the same whitespace classifier.

**Tech Stack:** Rust (`sittir-core`, generated grammar crates, napi), TypeScript (`@sittir/common`, `@sittir/types`, `@sittir/codegen` emitters, `@sittir/tools`), vitest, cargo test.

**Spec:** `docs/superpowers/specs/2026-09-29-relative-spans-design.md`

## Global Constraints

- `$span` is `{ start: { row, column }, end: { row, column } }`, both relative to the parent's start point; a column counts bytes within its line.
- The column rule is tree-sitter's `length_add`. With a row offset of 0, the column adds to the parent's column. With a row offset above 0, the column is measured from its line's start.
- No byte offsets are stored and no node carries an absolute position. Bytes are derived only where a source exists.
- Offsets are never negative; every field is a `u32`.
- A frame is a parent's position plus its tree. A transport with an `$anchor` anchors itself. One with only a `$span` passes the frame on. A factory-built transport leaves the frame unknown below it.
- A coordinate the frame can't place anchors through its handle. For a stub (handle plus child index), the base is the start of the handle's node. Otherwise the base is the start of the handle node's parent.
- A tree-only handle (reserved index) never anchors. The render refuses one outside its tree's frame.
- An edit marks the node `$edited`. It never folds or slices, and keeps its handle and span.
- Trivia is measured from its owner's parent. It trails the previous sibling only when no token lies between them. Otherwise it leads the next sibling, or sits in the parent's closing gap.
- `$sameLine` and `$tokensBetween` are removed; nothing replaces them on the wire.
- Serialized data is detached. It carries coordinates and leaf text, and never a source buffer.
- `$cst()` exists only on tree-bound nodes and returns tree-sitter's facts through the handle.
- Repo rules:
  - no explanatory comments in `packages/codegen/src/`; each new declaration gets a glossary entry under `docs/glossary/`;
  - no hand edits to generated outputs;
  - pathspec commits (`git commit -- <paths>`);
  - no planning-artifact numbers in comments or docs.

## Review Focus

1. **Multibyte text.** A column counts bytes, not characters. A line holding `é` or an emoji before a node must still slice exactly: Task 1 pins `LineStarts` on a multibyte line.
2. **CRLF sources.** A `\r\n` line ending belongs to its row. Rows must advance only at `\n`, and slices must keep the `\r`: Task 1 pins it.
3. **A span ending in its line break.** A doc comment ends at column 0 of the next row. The trivia row comparison must treat its last row as the row the break closes, as `end_row` does today: Task 7 pins `last_row`.
4. **Nodes that start on a later line than their parent.** Their columns stand alone, which is where the column rule most easily goes wrong: Task 1's composition round-trip covers it, and Task 5's full-corpus threaded-position check proves it.
5. **An edited node seated from another tree, holding an untouched node of the current tree.** This is the mixed-tree case: Task 5 pins it.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `rust/crates/sittir-core/src/points.rs` (create) | `Point`, `Span` as two points, the column rule, `LineStarts`. |
| `rust/crates/sittir-core/src/types.rs` | `Span` re-export; `NodeData` loses `same_line` and `tokens_between`. |
| `rust/crates/sittir-core/src/engine.rs` | Tree-only handle; line starts per tree; `SourceTable::base_of`/`line_starts`; `cst`. |
| `rust/crates/sittir-core/src/render.rs` | `SourceTable` gains the anchor and line-start methods. |
| `rust/crates/sittir-core/src/read_node.rs` | Relative points, trivia handles, trivia ownership, closing gap. |
| `rust/crates/sittir-core/src/prepare.rs` | `Frame`; `Prepare::prepare(ctx, frame)`; coordinate and transport anchoring. |
| `rust/crates/sittir-core/src/slot.rs` | `NodeCoordinate` carries `child_index` and the resolved byte range. |
| `rust/crates/sittir-core/src/classify.rs` | Gaps from resolved ranges; geometry gap text for detached seams. |
| `rust/crates/sittir-core/src/trivia.rs` | Trivia rows from points; no held entries. |
| `rust/crates/sittir-core/src/napi_engine.rs` | `cst` and `read_detached` napi methods. |
| `packages/codegen/src/emitters/render-module.ts` | `$span`/`$anchor` transport fields; frame-threading `prepare`. |
| `packages/codegen/src/compiler/model/node-map.ts` | The closing gap in `innerGaps`. |
| `packages/codegen/src/emitters/wrap.ts` | `_hasSeparatorFlank` on relative spans. |
| `packages/common/src/points.ts` (create) | TS `Point`/`Span`, `composeSpan`, `lineStarts`, `slicePoints`. |
| `packages/common/src/transport-data.ts` | `$edited`; `$anchor`; the fold check. |
| `packages/common/src/engine.ts` | `$cst()`, `$detach()`, detach-on-dispose registry. |
| `packages/types/src/core-types.ts` | `$span` point shape; `$edited`; `$cst()` result type. |
| `packages/tools/src/validate/*`, `probe/kind.ts`, `exercise/*`, `scripts/collect-baseline.ts` | Consumers. |

---

### Task 1: The point algebra

**Files:**
- Create: `rust/crates/sittir-core/src/points.rs`
- Modify: `rust/crates/sittir-core/src/lib.rs` (add `pub mod points;` and re-export `Point`, `LineStarts`)
- Modify: `rust/crates/sittir-core/src/types.rs:780-783` (replace the byte `Span` with `pub use crate::points::Span;`)
- Test: inline `#[cfg(test)] mod tests` in `points.rs`

**Interfaces:**
- Produces:
  - `Point { row: u32, column: u32 }`;
  - `Point::then(self, offset: Point) -> Point` (the column rule);
  - `Point::offset_from(self, base: Point) -> Point` (its inverse);
  - `Span { start: Point, end: Point }` and `Span::last_row(&self) -> u32`;
  - `LineStarts::new(&str)`, `LineStarts::byte(&self, Point) -> Option<usize>`;
  - `Span::resolve(&self, base: Point, lines: &LineStarts) -> Option<(usize, usize)>`.

- [ ] **Step 1: Write the failing tests** (append to the new file under `#[cfg(test)]`)

```rust
#[cfg(test)]
mod tests {
    use super::*;

    const fn p(row: u32, column: u32) -> Point {
        Point { row, column }
    }

    #[test]
    fn a_same_row_offset_adds_columns_and_a_later_row_stands_alone() {
        assert_eq!(p(3, 4).then(p(0, 2)), p(3, 6));
        assert_eq!(p(3, 4).then(p(2, 7)), p(5, 7));
    }

    #[test]
    fn offset_from_inverts_then() {
        for (base, abs) in [(p(3, 4), p(3, 9)), (p(3, 4), p(6, 1)), (p(0, 0), p(0, 0))] {
            assert_eq!(base.then(abs.offset_from(base)), abs);
        }
    }

    #[test]
    fn line_starts_index_bytes_not_characters() {
        let src = "é = 1;\nfoo\r\nbar";
        let lines = LineStarts::new(src);
        assert_eq!(lines.byte(p(0, 0)), Some(0));
        assert_eq!(lines.byte(p(0, 2)), Some(2)); // after the two-byte 'é'
        assert_eq!(lines.byte(p(1, 0)), Some(8));
        assert_eq!(lines.byte(p(2, 0)), Some(13)); // "\r\n" stays on row 1
        assert_eq!(lines.byte(p(3, 0)), None);
        assert_eq!(&src[8..13], "foo\r\n");
    }

    #[test]
    fn a_span_resolves_against_its_base() {
        let src = "fn f() {\n    x\n}";
        let lines = LineStarts::new(src);
        // the block starts at (0, 7); `x` is on its next row at column 4
        let x = Span { start: p(1, 4), end: p(1, 5) };
        let (s, e) = x.resolve(p(0, 7), &lines).unwrap();
        assert_eq!(&src[s..e], "x");
    }

    #[test]
    fn a_span_that_ends_with_its_line_break_ends_on_the_row_it_closes() {
        assert_eq!(Span { start: p(0, 0), end: p(1, 0) }.last_row(), 0);
        assert_eq!(Span { start: p(0, 0), end: p(0, 3) }.last_row(), 0);
        assert_eq!(Span { start: p(1, 0), end: p(1, 0) }.last_row(), 1);
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cargo test -p sittir-core points::`
Expected: compile errors (`Point`, `LineStarts` not found).

- [ ] **Step 3: Implement**

```rust
//! Relative coordinates: a point is a row and a byte column, and a span is two
//! points measured from its parent's start. Composition follows tree-sitter's
//! `length_add`, so a column is relative only on the parent's own row.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Default, Serialize, Deserialize)]
#[cfg_attr(feature = "napi-bindings", napi_derive::napi(object))]
pub struct Point {
    pub row: u32,
    pub column: u32,
}

impl Point {
    pub const ZERO: Point = Point { row: 0, column: 0 };

    /// The absolute point `offset` names from `self`.
    pub fn then(self, offset: Point) -> Point {
        if offset.row == 0 {
            Point { row: self.row, column: self.column + offset.column }
        } else {
            Point { row: self.row + offset.row, column: offset.column }
        }
    }

    /// The offset of `self` from `base`; `base.then(self.offset_from(base)) == self`.
    pub fn offset_from(self, base: Point) -> Point {
        if self.row == base.row {
            Point { row: 0, column: self.column - base.column }
        } else {
            Point { row: self.row - base.row, column: self.column }
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[cfg_attr(feature = "napi-bindings", napi_derive::napi(object))]
pub struct Span {
    pub start: Point,
    pub end: Point,
}

impl Span {
    /// The row of the span's last byte: a span ending with its line break ends
    /// on the row that break closes.
    pub fn last_row(&self) -> u32 {
        if self.end.column == 0 && self.end.row > self.start.row {
            self.end.row - 1
        } else {
            self.end.row
        }
    }

    /// The byte range this span names from `base`, an absolute point.
    pub fn resolve(&self, base: Point, lines: &LineStarts) -> Option<(usize, usize)> {
        Some((lines.byte(base.then(self.start))?, lines.byte(base.then(self.end))?))
    }
}

/// The byte offset of every row's start in one source.
#[derive(Debug, Clone)]
pub struct LineStarts {
    starts: Vec<usize>,
    len: usize,
}

impl LineStarts {
    pub fn new(source: &str) -> Self {
        let mut starts = vec![0];
        starts.extend(source.bytes().enumerate().filter(|&(_, b)| b == b'\n').map(|(i, _)| i + 1));
        Self { starts, len: source.len() }
    }

    pub fn byte(&self, point: Point) -> Option<usize> {
        let start = *self.starts.get(point.row as usize)?;
        let byte = start + point.column as usize;
        (byte <= self.len).then_some(byte)
    }
}
```

In `types.rs`, delete the byte `Span` struct and its derives at L780-783 and add `pub use crate::points::Span;`. Leave other compile errors for Task 3; this step only has to compile `points.rs` and its tests. If `types.rs` users block that, keep the old struct for now under the name `ByteSpan` and switch the users in Task 3.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cargo test -p sittir-core points::`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add rust/crates/sittir-core/src/points.rs
git commit -m "feat(core): relative points and line starts" -- rust/crates/sittir-core/src/points.rs rust/crates/sittir-core/src/lib.rs rust/crates/sittir-core/src/types.rs
```

---

### Task 2: Tree-only handles, line starts per tree, and the anchor lookup

**Files:**
- Modify: `rust/crates/sittir-core/src/engine.rs` (`HANDLE_INDEX_MASK`, `ParsedTree`, `read_root`, `impl SourceTable for HashMap<u32, ParsedTree<G>>` at ~L583)
- Modify: `rust/crates/sittir-core/src/render.rs:53-62` (`SourceTable`)
- Test: `rust/crates/sittir-core/tests/anchor.rs` (create)

**Interfaces:**
- Consumes: `Point`, `LineStarts` (Task 1).
- Produces:
  - `pub const TREE_ONLY_INDEX: u32 = HANDLE_INDEX_MASK as u32;`
  - `pub fn tree_only_handle(tree_id: u32) -> u64`
  - `SourceTable::line_starts(&self, tree_id: u32) -> Option<&LineStarts>`
  - `SourceTable::base_of(&self, handle: u64, child_index: Option<u16>) -> Result<Point, CoordinateError>`
  - `CoordinateError::NoAnchor { handle }` for a tree-only handle.

- [ ] **Step 1: Write the failing tests** (`tests/anchor.rs`)

Reuse the `TestGrammar` fixture from `tests/read_node.rs`: its `mod common` or its helper that parses with the test language. The source `fn f() {\n    x\n}` gives these assertions:

```rust
#[test]
fn a_stub_anchors_at_its_handles_node_and_a_node_at_its_parent() {
    let (engine, tree_id) = parse_fixture("fn f() {\n    x\n}");
    let trees = engine.trees();
    let root = root_handle(&engine, tree_id);
    // the root's own handle: no parent, so its base is (0, 0)
    assert_eq!(trees.base_of(root, None).unwrap(), Point::ZERO);
    // a stub under the root: handle = root, child index 0, base = the root's start
    assert_eq!(trees.base_of(root, Some(0)).unwrap(), Point::ZERO);
    let body = expand(&engine, root, &[0, /* block's index */ 3]);
    // an expanded node's own handle: base = its parent's start (the function)
    assert_eq!(trees.base_of(body, None).unwrap(), Point { row: 0, column: 0 });
}

#[test]
fn a_tree_only_handle_never_anchors() {
    let (engine, tree_id) = parse_fixture("x");
    let err = engine.trees().base_of(tree_only_handle(tree_id), None).unwrap_err();
    assert!(matches!(err, CoordinateError::NoAnchor { .. }));
}

#[test]
fn every_tree_holds_its_line_starts() {
    let (engine, tree_id) = parse_fixture("a\nb");
    assert_eq!(engine.trees().line_starts(tree_id).unwrap().byte(Point { row: 1, column: 0 }), Some(2));
}
```

`parse_fixture`, `root_handle` and `expand` are small helpers in the test file. They call the engine's `parse`, `read_root` and `read_child` exactly as `tests/read_node.rs` does. Copy those call shapes and don't invent new engine API. Use the child index that `read_node.rs` tests use for the block; get it by asserting on `node.child(i).kind()` first.

- [ ] **Step 2: Run to verify failure**

Run: `cargo test -p sittir-core --test anchor`
Expected: compile errors (`base_of`, `tree_only_handle`, `NoAnchor`).

- [ ] **Step 3: Implement**

In `engine.rs`:

```rust
pub const TREE_ONLY_INDEX: u32 = HANDLE_INDEX_MASK as u32;

pub fn tree_only_handle(tree_id: u32) -> u64 {
    ((tree_id as u64) << HANDLE_INDEX_BITS) | TREE_ONLY_INDEX as u64
}
```

`ParsedTree` gains `lines: LineStarts`, built once in its constructor beside `source`. `push_coord` must never mint `TREE_ONLY_INDEX`: add `debug_assert!((self.nodes.len() as u32) < TREE_ONLY_INDEX)`. In `SourceTable for HashMap<u32, ParsedTree<G>>`:

```rust
fn line_starts(&self, tree_id: u32) -> Option<&LineStarts> {
    self.get(&tree_id).map(|tree| &tree.lines)
}

fn base_of(&self, handle: u64, child_index: Option<u16>) -> Result<Point, CoordinateError> {
    let (tree_id, index) = decode_handle(handle);
    if index == TREE_ONLY_INDEX {
        return Err(CoordinateError::NoAnchor { handle });
    }
    let tree = self.get(&tree_id).ok_or(CoordinateError::UnknownTree { handle, tree_id })?;
    let node = ParsedTree::<G>::resolve_handle(&tree.nodes, &tree.tree, index)
        .ok_or(CoordinateError::NoAnchor { handle })?;
    let base = match child_index {
        Some(_) => Some(node),
        None => node.parent(),
    };
    Ok(base.map_or(Point::ZERO, |n| {
        let p = n.start_position();
        Point { row: p.row as u32, column: p.column as u32 }
    }))
}
```

In `render.rs`, add `line_starts` and `base_of` to `SourceTable`. Their defaults are `None` and `Err(CoordinateError::NoAnchor { handle })`, so a table of bare sources refuses them. Add `NoAnchor { handle: u64 }` to `CoordinateError` with the display text `"handle {handle} names no node to anchor at (a tree-only handle, or a node its tree no longer has)"`.

- [ ] **Step 4: Run to verify pass**

Run: `cargo test -p sittir-core --test anchor`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add rust/crates/sittir-core/tests/anchor.rs
git commit -m "feat(core): tree-only handles and the anchor lookup" -- rust/crates/sittir-core/src/engine.rs rust/crates/sittir-core/src/render.rs rust/crates/sittir-core/tests/anchor.rs
```

---

### Task 3: The reader emits relative points

**Files:**
- Modify: `rust/crates/sittir-core/src/read_node.rs`:
  - `read_node` L138-161;
  - `widen_to_whole_source` L171-176;
  - `read_ts_node` L217-281;
  - `read_children` L514-632;
  - `read_child_stub` L662-690;
  - `read_materialized_leaf` L692-720;
  - `node_trivia` L320-413.
- Modify: `rust/crates/sittir-core/src/types.rs` (`NodeDataSer`/`NodeDataDe` `$span` shape)
- Modify: `rust/crates/sittir-core/tests/read_node.rs`, `tests/wire_shape.rs`, `tests/boundary_roundtrip.rs`
- Modify: `packages/types/src/core-types.ts:96` (`$span` type), `packages/common/src/engine.ts:169`, `packages/common/src/utils.ts:195`

**Interfaces:**
- Consumes: `Point`, `Span` (Task 1), `tree_only_handle` (Task 2).
- Produces:
  - every `NodeData.span` is relative to its tree-sitter parent's start, and the root is `{ (0,0), end of source }`;
  - trivia entries carry their owner's handle when the owner has one, and `tree_only_handle` otherwise;
  - deep-read descendants carry `tree_only_handle`;
  - TS type `Point = { readonly row: number; readonly column: number }` and `Span = { readonly start: Point; readonly end: Point }` in `@sittir/types`.

- [ ] **Step 1: Write the failing tests** (append to `tests/read_node.rs`)

```rust
fn abs(parent: Point, span: &Span) -> (Point, Point) {
    (parent.then(span.start), parent.then(span.end))
}

#[test]
fn every_child_span_is_relative_to_its_parent_and_composes_to_tree_sitters_position() {
    let source = "fn f() {\n    let é = 1;\n}\n";
    let root = read_deep(source);
    // walk with an absolute base and compare every node to a fresh parse
    let tree = parse(source);
    check_positions(&root, Point::ZERO, tree.root_node(), source);
}

fn check_positions(node: &NodeData, parent_start: Point, ts: tree_sitter::Node<'_>, source: &str) {
    let span = node.span.expect("every read node has a span");
    let (start, end) = abs(parent_start, &span);
    if ts.parent().is_some() {
        assert_eq!((start.row as usize, start.column as usize), (ts.start_position().row, ts.start_position().column));
        assert_eq!((end.row as usize, end.column as usize), (ts.end_position().row, ts.end_position().column));
    }
    for (child, ts_child) in stored_children_with_ts(node, ts) {
        check_positions(child, start, ts_child, source);
    }
}

#[test]
fn the_root_spans_the_whole_source_from_the_origin() {
    let root = read_deep("\n\nx\n");
    assert_eq!(root.span.unwrap().start, Point::ZERO);
    assert_eq!(root.span.unwrap().end, Point { row: 3, column: 0 });
}

#[test]
fn a_trivia_entry_is_measured_from_its_owners_parent_and_carries_the_owners_handle() {
    let source = "fn f() {\n    // c\n    x;\n}";
    let (root, owner_handle) = read_to_statement(source); // shallow read, expand to the `x;` statement
    let leading = &owner_trivia(&root).leading.as_ref().unwrap()[0];
    assert_eq!(leading.node_handle, Some(owner_handle));
    // the owner's parent is the block starting at (0, 7): `// c` is row +1, column 4
    assert_eq!(leading.span.unwrap().start, Point { row: 1, column: 4 });
}

#[test]
fn a_deep_reads_descendants_carry_a_tree_only_handle() {
    let root = read_deep("x;");
    let leaf = first_leaf(&root);
    let (_, index) = decode_handle(leaf.node_handle.unwrap());
    assert_eq!(index, TREE_ONLY_INDEX);
}
```

`read_deep`, `parse`, `read_to_statement`, `owner_trivia`, `first_leaf` and `stored_children_with_ts` are test helpers built on the existing helpers in that file. `stored_children_with_ts` pairs each stored child (fields in slot order, `$other`) with `ts.child(child_index)` for stubs, or with a matching byte-range search of `ts`'s children for deep nodes.

Update the wire tests:
- `tests/wire_shape.rs` `complex_node` and `tests/boundary_roundtrip.rs` `sample_leaf`/`sample_branch` build spans as `Span { start: Point { row: 0, column: 0 }, end: Point { row: 0, column: 3 } }`.
- Pin the serialized shape: `assert_eq!(json["$span"], json!({"start": {"row": 0, "column": 0}, "end": {"row": 0, "column": 3}}))`.

- [ ] **Step 2: Run to verify failure**

Run: `cargo test -p sittir-core --test read_node --test wire_shape --test boundary_roundtrip`
Expected: compile errors, then assertion failures on byte-shaped spans.

- [ ] **Step 3: Implement**

- `read_ts_node(node, source, node_handle, tree_handle, depth, model)` gains `parent_start: Point`. Its span becomes:

```rust
let start = to_point(node.start_position());
let end = to_point(node.end_position());
let span = Span { start: start.offset_from(parent_start), end: end.offset_from(parent_start) };
```

  It passes `start` as `parent_start` to `read_children`, and passes `parent_start` to `node_trivia`: trivia is measured from the owner's parent. Add `fn to_point(p: tree_sitter::Point) -> Point` beside `end_row`.
- `read_children` passes its `node`'s start to `read_child_stub`, `read_materialized_leaf` and the deep `read_ts_node`.
- `read_node` calls `read_ts_node` for the root with `parent_start = Point::ZERO`. `widen_to_whole_source` sets `span = Span { start: Point::ZERO, end: end_of(source) }`, where `end_of` is `Point { row: newline count, column: bytes after the last newline }`.
- Deep read: where `read_children` passes `tree_handle` to leaves and `read_ts_node(child, …, None, tree_handle, …)`, pass `tree_handle.map(|h| tree_only_handle(decode_handle(h).0))` for the leaf handle.
- `node_trivia(node, source, tree_handle, model)` becomes `node_trivia(node, source, owner_handle, tree_handle, parent_start, model)`. Each entry is read with `read_ts_node(extra, source, owner_handle.or(tree_only), tree_handle, Deep, model, parent_start)`. The `entry` closure keeps its text fallback.
- `types.rs` `NodeDataSer`/`NodeDataDe`: `span` is `Option<Span>` with the new struct. serde derives the nested shape.
- TypeScript types: in `packages/types/src/core-types.ts`, replace `$span?: { start: number; end: number }` with `$span?: Span` and export `Point`/`Span`. Update `packages/common/src/engine.ts:169` and `utils.ts:195` to the same type.

- [ ] **Step 4: Run to verify pass**

Run: `cargo test --workspace` (the cargo gate is the whole workspace), then `pnpm exec tsc -p packages/types --noEmit`.
Expected: `sittir-core` read tests pass. The grammar crates' TS consumers of `$span` start failing to type-check: Tasks 9 and 12 fix those, so record the failing list and move on. Rust must be green.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(read): spans are points relative to the parent" -- rust/crates/sittir-core/src/read_node.rs rust/crates/sittir-core/src/types.rs rust/crates/sittir-core/tests packages/types/src/core-types.ts packages/common/src/engine.ts packages/common/src/utils.ts
```

---

### Task 4: Transports carry their points; coordinates carry their child index

**Files:**
- Modify: `packages/codegen/src/emitters/render-module.ts:3394-3397` (`TRANSPORT_METADATA_FIELDS`)
- Modify: `rust/crates/sittir-core/src/slot.rs` (`NodeCoordinate`, `from_napi_value` L201-222)
- Create: `rust/crates/sittir-core/src/anchor.rs` (`Anchor`, `Spanned`)
- Test: `packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`, `rust/crates/sittir-core/src/slot.rs` tests
- Docs: `docs/glossary/emitters.md` (`TRANSPORT_METADATA_FIELDS` entry)

**Interfaces:**
- Produces:
  - `pub struct Anchor { pub handle: u64, pub child_index: Option<u16> }`, with napi object keys `$nodeHandle` and `$childIndex`;
  - `pub trait Spanned { fn span(&self) -> Option<&Span>; fn anchor(&self) -> Option<&Anchor>; }`, implemented by every generated transport and by `NodeCoordinate`;
  - every transport struct gains `span: Option<Span>` (`$span`) and `anchor: Option<Anchor>` (`$anchor`);
  - `NodeCoordinate` gains `child_index: Option<u16>` (read from `$childIndex`) and `bytes: Option<(u32, u32)>` (runtime-only, filled by prepare).

- [ ] **Step 1: Write the failing tests**

In `render-module-emit.test.ts`, beside the existing `$_edges` assertion (L425):

```ts
expect(body).toContain('napi(js_name = "$span")');
expect(body).toContain('pub span: Option<::sittir_core::points::Span>');
expect(body).toContain('napi(js_name = "$anchor")');
expect(body).toContain('pub anchor: Option<::sittir_core::anchor::Anchor>');
expect(transportRs).toContain('impl ::sittir_core::anchor::Spanned for FunctionItemTransport');
```

In `slot.rs` tests, add a napi-free unit test for `NodeCoordinate::new(handle, span).child_index == None` and a test that `Spanned` on a coordinate returns its span, with `anchor()` returning `Anchor { handle, child_index }`.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-module-emit.test.ts` and `cargo test -p sittir-core slot::`
Expected: FAIL on the new expectations.

- [ ] **Step 3: Implement**

- Add two rows to `TRANSPORT_METADATA_FIELDS`:

```ts
{ jsName: '$span', rustName: 'span', rustType: 'Option<::sittir_core::points::Span>' },
{ jsName: '$anchor', rustName: 'anchor', rustType: 'Option<::sittir_core::anchor::Anchor>' },
```

- Every place that emits a per-transport metadata trait impl (find `transport_trivia_data` accessors in `render-module.ts` and follow its pattern) also emits `impl ::sittir_core::anchor::Spanned for XTransport { fn span(&self) -> Option<&::sittir_core::points::Span> { self.span.as_ref() } fn anchor(&self) -> Option<&::sittir_core::anchor::Anchor> { self.anchor.as_ref() } }`. For generated enums, emit a delegating impl the way `prepareEnumImpl` delegates.
- `anchor.rs`:

```rust
use crate::points::Span;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[cfg_attr(feature = "napi-bindings", napi_derive::napi(object))]
pub struct Anchor {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub handle: u64,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub child_index: Option<u16>,
}

pub trait Spanned {
    fn span(&self) -> Option<&Span>;
    fn anchor(&self) -> Option<&Anchor>;
}
```

  If napi can't derive `u64` for `handle`, read it as `f64` through `checked_index`, as `slot.rs` does for `$nodeHandle`.
- `slot.rs`: `NodeCoordinate` gains `child_index: Option<u16>` and `bytes: Option<(u32, u32)>`. `from_napi_value` reads `$childIndex`. `impl Spanned for NodeCoordinate` returns `Some(&self.span)` and an `Anchor` built from `handle`/`child_index`, kept as a field so it can be borrowed.
- Glossary: extend the `TRANSPORT_METADATA_FIELDS` entry with the two rows and what they carry.
- Regenerate every grammar: `for g in rust typescript python regex scm; do pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done`.

- [ ] **Step 4: Run to verify pass**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`, then `cargo test --workspace`
Expected: PASS.

- [ ] **Step 5: Commit** (generated crates included, since they are regenerated outputs)

```bash
git commit -m "feat(render): transports carry \$span and \$anchor" -- packages/codegen/src/emitters/render-module.ts packages/codegen/src/emitters/__tests__/render-module-emit.test.ts rust/crates/sittir-core/src/anchor.rs rust/crates/sittir-core/src/slot.rs rust/crates/sittir-core/src/lib.rs docs/glossary/emitters.md rust/crates/sittir-*/src packages/*/src packages/*/.sittir
```

---

### Task 5: The prepare walk threads frames and anchors

**Files:**
- Modify: `rust/crates/sittir-core/src/prepare.rs` (the whole `Prepare` trait and its impls)
- Modify: `rust/crates/sittir-core/src/slot.rs` (`resolve` L88-108 reads `bytes`)
- Modify: `rust/crates/sittir-core/src/classify.rs` (`gap_between` L69-79)
- Modify: `rust/crates/sittir-core/src/trivia.rs` (`TransportTrivia::prepare` L53-60)
- Modify: `packages/codegen/src/emitters/render-module.ts` (`PREPARE_SIG` L2687, the struct `prepare` emission, `prepareEnumImpl`, `render_transport_parts`)
- Test: `rust/crates/sittir-core/tests/prepare.rs`; `packages/tools/src/validate/__tests__/relative-positions.test.ts` (create)
- Docs: `docs/glossary/emitters.md` (`PREPARE_SIG`, `prepareEnumImpl`)

**Interfaces:**
- Consumes: `SourceTable::base_of`/`line_starts` (Task 2), `Spanned`/`Anchor` (Task 4).
- Produces:
  - `pub struct Frame { pub tree: Option<u32>, pub start: Point }` with `Frame::UNKNOWN`, `Frame::root(tree_id)`, `fn enter(&self, t: &dyn Spanned, sources: &dyn SourceTable) -> Result<Frame, CoordinateError>`;
  - `Prepare::prepare(&mut self, ctx: &RenderContext<'_>, frame: &Frame) -> Result<(), CoordinateError>`;
  - `NodeCoordinate::place(&mut self, frame: &Frame, sources: &dyn SourceTable) -> Result<(), CoordinateError>`, which fills `bytes`.

- [ ] **Step 1: Write the failing tests** (`tests/prepare.rs`)

```rust
#[test]
fn a_coordinate_in_its_trees_frame_resolves_through_line_starts() {
    let (trees, tree_id, src) = one_tree("fn f() {\n    x\n}");
    let mut c = coord(stub_handle(&trees, tree_id), None, span((1, 4), (1, 5)));
    c.place(&Frame { tree: Some(tree_id), start: p(0, 7) }, &trees).unwrap();
    assert_eq!(c.resolve(&trees).unwrap(), "x");
    let _ = src;
}

#[test]
fn a_coordinate_outside_its_trees_frame_anchors_through_its_handle() {
    let (trees, a, b) = two_trees("let x = 1;", "fn g() {}");
    let stmt = stub_of_root_child(&trees, a, 0); // handle = a's root, child 0
    let mut c = coord(stmt.handle, Some(0), stmt.span);
    c.place(&Frame { tree: Some(b), start: p(0, 0) }, &trees).unwrap();
    assert_eq!(c.resolve(&trees).unwrap(), "let x = 1;");
}

#[test]
fn a_tree_only_coordinate_outside_its_frame_is_refused() {
    let (trees, a, b) = two_trees("x;", "y;");
    let mut c = coord(tree_only_handle(a), None, span((0, 0), (0, 1)));
    let err = c.place(&Frame { tree: Some(b), start: p(0, 0) }, &trees).unwrap_err();
    assert!(matches!(err, CoordinateError::NoAnchor { .. }));
}

#[test]
fn an_edited_transport_seated_from_another_tree_places_a_current_tree_child_correctly() {
    // Review Focus 5: tree-B coordinate inside an edited tree-A transport inside a tree-B root
    let (trees, a, b) = two_trees("fn a() {\n  foo();\n}", "fn b() {\n    bar();\n}");
    let a_block = anchor_of_expanded(&trees, a, "block");
    let b_stmt = stub_of(&trees, b, "expression_statement");
    let frame_b = Frame::root(b);
    let inner = frame_b
        .enter(&spanned(Some(a_block.anchor), a_block.span), &trees)
        .unwrap();
    let mut c = coord(b_stmt.handle, b_stmt.child_index, b_stmt.span);
    c.place(&inner, &trees).unwrap();
    assert_eq!(c.resolve(&trees).unwrap(), "bar();");
}
```

The helpers (`one_tree`, `two_trees`, `coord`, `span`, `p`, `stub_handle`, `stub_of`, `anchor_of_expanded`, `spanned`) build on the existing `Sources` fixture in `tests/prepare.rs` and on real parses through the engine, as in Task 2's test.

Add `packages/tools/src/validate/__tests__/relative-positions.test.ts`, the spec's "line-start resolution" verification. For each of the three grammars' corpus files:
- read the root lazily and expand every stub;
- render the root untouched and assert the output equals the source byte for byte;
- for every expanded node, check that the frame-threaded position (compose `$span` down from the root with `composePoint` from Task 9) equals `$cst()`'s start point (Task 10).

Mark the `$cst()` half `it.todo` until Task 10 lands, and flip it there.

- [ ] **Step 2: Run to verify failure**

Run: `cargo test -p sittir-core --test prepare`
Expected: compile errors (`Frame`, `place`).

- [ ] **Step 3: Implement**

`prepare.rs`:

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Frame {
    pub tree: Option<u32>,
    pub start: Point,
}

impl Frame {
    pub const UNKNOWN: Frame = Frame { tree: None, start: Point::ZERO };

    pub fn root(tree_id: u32) -> Frame {
        Frame { tree: Some(tree_id), start: Point::ZERO }
    }

    /// The frame a transport's children are measured in: its anchor's when it
    /// has one, else the parent frame advanced by its span, else unknown.
    pub fn enter(&self, t: &dyn Spanned, sources: &dyn SourceTable) -> Result<Frame, CoordinateError> {
        match (t.anchor(), t.span()) {
            (Some(a), Some(span)) => {
                let base = sources.base_of(a.handle, a.child_index)?;
                Ok(Frame { tree: Some(decode_handle(a.handle).0), start: base.then(span.start) })
            }
            (None, Some(span)) if self.tree.is_some() => Ok(Frame { tree: self.tree, start: self.start.then(span.start) }),
            _ => Ok(Frame::UNKNOWN),
        }
    }
}

pub trait Prepare {
    fn prepare(&mut self, ctx: &RenderContext<'_>, frame: &Frame) -> Result<(), CoordinateError>;
}
```

`NodeCoordinate::place` (in `slot.rs`):

```rust
pub fn place(&mut self, frame: &Frame, sources: &dyn SourceTable) -> Result<(), CoordinateError> {
    let tree_id = self.tree_id();
    let base = if frame.tree == Some(tree_id) {
        frame.start
    } else {
        sources.base_of(self.handle, self.child_index)?
    };
    let lines = sources
        .line_starts(tree_id)
        .ok_or(CoordinateError::UnknownTree { handle: self.handle, tree_id })?;
    let (start, end) = self.span.resolve(base, lines).ok_or_else(|| CoordinateError::BadSpan {
        handle: self.handle,
        detail: format!("span {:?} from {:?} lies outside its source", self.span, base),
    })?;
    self.bytes = Some((start as u32, end as u32));
    Ok(())
}
```

- `resolve` slices `source[start..end]` from `self.bytes`. When `bytes` is `None`, return `BadSpan` with the detail `"coordinate was never placed"`, keeping the char-boundary check.
- `SlotValue::prepare` for `Coord` calls `coord.place(frame, ctx.sources)?` before the kind and edges lookup it does today.
- `Vec`/`Option`/`Box` impls pass `frame` through.
- `TransportTrivia::prepare(ctx, frame)` passes the frame it received to every entry.
- `gap_between(a, b, sources)` slices `source[a.bytes.1..b.bytes.0]` when both are placed and from the same tree, and returns `None` otherwise.

Emitter:
- `PREPARE_SIG` becomes `fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>, frame: &::sittir_core::prepare::Frame) -> Result<(), ::sittir_core::render::CoordinateError>`.
- The struct body emits `self.transport_trivia_data.prepare(ctx, frame)?;` first, then `let frame = &frame.enter(self, ctx.sources)?;`, then each slot's `.prepare(ctx, frame)?`.
- `prepareEnumImpl` passes `frame` through.
- `render_transport_parts` calls `Prepare::prepare(&mut transport, ctx, &Frame::UNKNOWN)`. The root coordinate or transport then anchors through its handle, and a root read from a tree's origin anchors at (0, 0), since its handle's node has no parent.
- Update the glossary entries for `PREPARE_SIG` and `prepareEnumImpl`.

Regenerate every grammar, as in Task 4.

- [ ] **Step 4: Run to verify pass**

Run: `cargo test --workspace`, then `pnpm exec vitest run packages/tools/src/validate/__tests__/relative-positions.test.ts`
Expected: PASS. The byte-for-byte untouched render must hold on every corpus file.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(render): the prepare walk threads frames; coordinates anchor through their handles" -- rust/crates/sittir-core/src packages/codegen/src/emitters/render-module.ts docs/glossary/emitters.md packages/tools/src/validate/__tests__/relative-positions.test.ts rust/crates/sittir-*/src packages/*/src packages/*/.sittir
```

---

### Task 6: The closing gap

**Files:**
- Modify: `packages/codegen/src/compiler/model/node-map.ts:1714-1763` (`innerGaps`)
- Test: `packages/codegen/src/compiler/model/__tests__/inner-gaps.test.ts` (extend it if it exists; otherwise create it beside the other model tests)
- Docs: `docs/glossary/compiler-model.md` (`innerGaps` entry)

**Interfaces:**
- Produces: for every compound whose render rule ends in an unconditional token after its last slot occurrence, an extra `InnerGap` `{ key: 'closing', precedingTokens: tokens - 1 }`. `precedingTokens` counts the unconditional tokens before the closer. The key reaches `inner_gap_key` and `INNER_GAPS` through the existing rows.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { loadNodeMap } from '../../../__tests__/helpers/node-map.ts';

describe('innerGaps closing gap', () => {
	it('a list whose rule ends in its closer gains a closing gap after its last element', async () => {
		const nodeMap = await loadNodeMap('rust');
		const gaps = nodeMap.nodes.get('arguments')!.innerGaps;
		expect(gaps.at(-1)).toEqual({ key: 'closing', precedingTokens: 1 });
	});

	it('a compound with no closing token has no closing gap', async () => {
		const nodeMap = await loadNodeMap('rust');
		expect(nodeMap.nodes.get('let_declaration')!.innerGaps.some((g) => g.key === 'closing')).toBe(false);
	});

	it('an empty-realizing compound keeps its interior gap and adds the closing gap only once', async () => {
		const nodeMap = await loadNodeMap('typescript');
		const keys = nodeMap.nodes.get('array')!.innerGaps.map((g) => g.key);
		expect(keys.filter((k) => k === 'closing')).toHaveLength(1);
	});
});
```

If `loadNodeMap` isn't the helper's name, use the node-map loader that the existing model tests in that directory use.

`let_declaration` ends in `;` after its last slot, so it may get a closing gap. That's correct if its rule ends in an unconditional token. Check `grammar.json` first and swap in a kind whose rule ends in a slot (rust `binary_expression`).

- [ ] **Step 2: Run to verify failure**

Run: `pnpm exec vitest run packages/codegen/src/compiler/model/__tests__/inner-gaps.test.ts`
Expected: FAIL (no `closing` key).

- [ ] **Step 3: Implement**

In `innerGaps`:
- Drop the early `if (!realizesEmpty(...)) return [];`. It now gates only the existing gaps, so move it to guard the `occurrences` branch.
- After computing `occurrences` and `immediateTokens`, compute `lastSlotTokens = occurrences.at(-1)?.precedingTokens`.
- When the walk recorded at least one unconditional token after `lastSlotTokens`, and the last recorded token isn't immediate, append `{ key: 'closing', precedingTokens: tokens - 1 }`. Skip it when that position is already a returned gap.
- Keep `triviaInterior` returning `[]`.
- Update the glossary entry to describe the closing gap.

Regenerate every grammar. The `inner_gap_key` rows and `INNER_GAPS` pick up the new key; `render_inner("closing", w)` is wired in Task 7.

- [ ] **Step 4: Run to verify pass**

Run: the same vitest file, plus `pnpm exec vitest run packages/codegen`
Expected: PASS. Existing snapshot tests that list `INNER_GAPS` rows change only by the added `closing` rows; review the diff.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(model): compounds ending in a closer gain a closing inner gap" -- packages/codegen/src/compiler/model/node-map.ts packages/codegen/src/compiler/model/__tests__/inner-gaps.test.ts docs/glossary/compiler-model.md rust/crates/sittir-*/src packages/*/src packages/*/.sittir
```

---

### Task 7: Trivia ownership carries the side of a token; rows come from points

**Files:**
- Modify: `rust/crates/sittir-core/src/read_node.rs` (`node_trivia` L320-413, `extras_run` L471-494)
- Modify: `rust/crates/sittir-core/src/trivia.rs`:
  - `TriviaEntry` L20-24;
  - `render_leading` L164-172;
  - `render_trailing` L180-221;
  - `from_napi_value` L258-285.
- Modify: `rust/crates/sittir-core/src/types.rs` (remove `same_line`, `tokens_between` from `NodeData`, `NodeDataSer`, `NodeDataDe`, `scalar_text_leaf`, `scalar_kind_leaf`)
- Modify: `rust/crates/sittir-core/src/engine.rs:531-532`, `macros.rs` tests L109-274
- Modify: the render emitter where a transport renders its inner trivia: find `render_inner(` in `render-module.ts`. Emit `self.transport_trivia_data.render_inner("closing", w)` before the closing token when the kind has a closing gap.
- Test: `rust/crates/sittir-core/tests/read_node.rs` (replace the `same_line`/`tokens_between` tests at L477-582); `packages/tools/src/validate/__tests__/trivia-probes.test.ts`

**Interfaces:**
- Consumes: `Spanned` (Task 4); the closing gap key (Task 6); `Span::last_row` (Task 1).
- Produces:
  - `TriviaEntry<T> { value: SlotValue<T> }`, with no flags;
  - `TransportTrivia::render_leading(&self, owner: Option<&Span>, w)`;
  - `render_trailing(&self, owner: Option<&Span>, w)`.

- [ ] **Step 1: Write the failing tests**

Reader (in `tests/read_node.rs`, replacing the five flag tests):

```rust
#[test]
fn a_comment_before_a_token_trails_the_previous_sibling() {
    let t = trivia_of_call_args("f(a /* x */, b)");
    assert_eq!(t.trailing_of("a"), vec!["/* x */"]);
    assert!(t.leading_of("b").is_empty());
}

#[test]
fn a_comment_after_a_token_leads_the_next_sibling() {
    let t = trivia_of_call_args("f(a, /* x */ b)");
    assert!(t.trailing_of("a").is_empty());
    assert_eq!(t.leading_of("b"), vec!["/* x */"]);
    let t = trivia_of_call_args("f(a, // x\n  b)");
    assert_eq!(t.leading_of("b"), vec!["// x"]);
}

#[test]
fn a_comment_after_the_last_elements_token_sits_in_the_closing_gap() {
    let t = trivia_of_call_args("f(a, b, // c\n)");
    assert!(t.trailing_of("b").is_empty());
    assert_eq!(t.inner_of_parent("closing"), vec!["// c"]);
}

#[test]
fn no_trivia_entry_carries_row_or_token_stamps_on_the_wire() {
    let json = read_json("fn f() { x = a + /* x */ b; // t\n}");
    assert!(!json.to_string().contains("$sameLine"));
    assert!(!json.to_string().contains("$tokensBetween"));
}
```

`trivia_of_call_args` uses the rust test grammar the file already links. It returns a small struct with `trailing_of(text)`, `leading_of(text)` and `inner_of_parent(key)`, collecting entry texts by the owner's source text.

Render (in `trivia-probes.test.ts`, one table across the three grammars; the rust rows):

```ts
const rows: [grammar: string, source: string][] = [
	['rust', 'fn f() { g(a /* x */, b); }\n'],
	['rust', 'fn f() { g(a, /* x */ b); }\n'],
	['rust', 'fn f() {\n    g(a, // x\n        b);\n}\n'],
	['rust', 'fn f() { let y = a + /* x */ b; }\n'],
	['rust', 'fn f() {\n    g(a, b, // c\n    );\n}\n'],
	['rust', 'fn f() {\n    x = 1; // same line\n}\n']
];
it.each(rows)('%s keeps each comment on its side of the token: %s', async (grammar, source) => {
	const root = await readRoot(grammar, source);
	expect(render(detach(root))).toContain(commentWithNeighbours(source));
});
```

- Add the typescript and python equivalents, with python using `#` comments and a trailing comma in a call.
- `detach` is Task 11's `$detach()`, so write this test against it and leave it failing until Task 11. The source-backed render (no detach) must pass at this task.
- `commentWithNeighbours(source)` returns the comment plus the token or name on each side of it in `source`, e.g. `", /* x */ b"`.
- Also add an edited-owner row: read `x = 1; // same line`, edit the statement's value through `$with`, and render. The comment must stay on the statement's line (Review Focus 3 and the edit rule).

- [ ] **Step 2: Run to verify failure**

Run: `cargo test -p sittir-core --test read_node` and `pnpm exec vitest run packages/tools/src/validate/__tests__/trivia-probes.test.ts`
Expected: FAIL on ownership and on the removed flags.

- [ ] **Step 3: Implement**

Reader (`node_trivia`):
- **Trailing:** an extra after the owner trails it when `tokens == 0` in `extras_run`, same row or not.
- **Leading:** an extra with `tokens > 0` before the next owner leads the next owner. For each extra in the owner's `before` run, it is leading unless it trails the previous owner by the first rule, which drops the `trails_prev` row check. That decision is made from the previous owner's side with `tokens == 0`, so the two runs never both claim an extra: an extra is claimed as trailing only with `tokens == 0` from `prev`, and as leading only otherwise.
- **Closing gap:** when the owner has no next owner and an extra follows ≥1 token, it goes to the parent's inner trivia under `model.inner_gap_key(parent_kind, preceding_tokens)`. `preceding_tokens` counts the parent's unconditional tokens before the extra, exactly as the inner loop already counts them.
  - Move that extra's assignment into the parent's `node_trivia` inner loop.
  - That loop currently runs only when no child is an owner. Run it for every parent, but only assign an extra to `inner` when no owner claims it by the two rules above.
  - Keep it one walk: compute each extra's claim once, from its nearest owners on both sides and the token counts between.
- Delete `same_line` and `tokens_between` everywhere (struct fields, serde, `from_napi_value`, test builders).

Render (`trivia.rs`):
- `render_leading(owner)`: an entry's join is `" "` when `owner.is_some_and(|o| entry_span.last_row() == o.start.row)`, otherwise `"\n"`. `entry_span` is `entry.value`'s `Spanned::span()`: `SlotValue` gets `Spanned` by delegating to its coordinate or transport.
- `render_trailing(owner)`: every entry has zero tokens between it and its owner.
  - Same-line entries (`entry.start.row == owner.last_row()`) render right after the owner, joined by the seam.
  - Own-line entries render as the existing `own_line` branch does.
  - Delete the `held`/`defer_run` split and `defer_run` itself. Keep `RenderSink::defer_trailing` only if something else calls it (check with `find_all_references`); otherwise remove it and its sink implementations.
- The generated transport render passes `self.span.as_ref()` as `owner`.
- Emitter: where a kind has a `closing` inner gap, emit `render_inner("closing", w)` immediately before the closing token's write. Add a glossary entry for the emission site.

Regenerate every grammar.

- [ ] **Step 4: Run to verify pass**

Run: `cargo test --workspace`; `pnpm exec vitest run packages/tools/src/validate/__tests__/trivia-probes.test.ts`
Expected: the Rust tests pass, and the source-backed and edited-owner probe rows pass. The detached rows stay failing until Task 11.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(trivia): ownership carries the side of a token; rows come from points" -- rust/crates/sittir-core packages/codegen/src/emitters/render-module.ts docs/glossary packages/tools/src/validate/__tests__/trivia-probes.test.ts rust/crates/sittir-*/src packages/*/src packages/*/.sittir
```

---

### Task 8: Detached seams from geometry

**Files:**
- Modify: `rust/crates/sittir-core/src/classify.rs` (add `geometry_gap_text`; `classify_list_gaps` L86-113 accepts spans for unplaced items)
- Modify: `rust/crates/sittir-core/src/prepare.rs` (`fill_seated_gaps` L56-69, the list flank fill)
- Test: `rust/crates/sittir-core/tests/classify.rs`

**Interfaces:**
- Consumes: `Span`/`Point` (Task 1), `Spanned` (Task 4).
- Produces: `pub fn geometry_gap_text(a: &Span, b: &Span) -> String`, the whitespace the gap's geometry implies. It is fed to the existing `classify_whitespace`, so detached and source-backed gaps share one classifier.

- [ ] **Step 1: Write the failing tests**

```rust
#[test]
fn geometry_gives_adjacency_breaks_blank_lines_and_indentation() {
    let s = |a: (u32, u32), b: (u32, u32)| Span { start: p(a.0, a.1), end: p(b.0, b.1) };
    assert_eq!(geometry_gap_text(&s((0, 0), (0, 1)), &s((0, 1), (0, 2))), "");
    assert_eq!(geometry_gap_text(&s((0, 0), (0, 1)), &s((0, 2), (0, 3))), " ");
    assert_eq!(geometry_gap_text(&s((0, 0), (0, 1)), &s((1, 4), (1, 5))), "\n    ");
    assert_eq!(geometry_gap_text(&s((0, 0), (0, 1)), &s((3, 0), (3, 1))), "\n\n\n");
}

#[test]
fn a_detached_list_classifies_its_gaps_from_geometry() {
    // three detached statements: rows 0, 1, 3 at column 4
    let items = [span((0, 4), (0, 6)), span((1, 4), (1, 6)), span((3, 4), (3, 6))];
    let (_, after) = classify_detached_list_gaps(&items, ";", ALL, ALL, &TABLE);
    assert_eq!(after, Some(NEWLINE_ARM)); // majority: one line break
}
```

`NEWLINE_ARM`, `ALL` and `TABLE` come from the existing fixtures in `tests/classify.rs`.

- [ ] **Step 2: Run to verify failure**

Run: `cargo test -p sittir-core --test classify`
Expected: compile errors.

- [ ] **Step 3: Implement**

```rust
pub fn geometry_gap_text(a: &Span, b: &Span) -> String {
    if b.start.row == a.end.row {
        " ".repeat((b.start.column - a.end.column) as usize)
    } else {
        let mut s = "\n".repeat((b.start.row - a.end.row) as usize);
        s.push_str(&" ".repeat(b.start.column as usize));
        s
    }
}

pub fn classify_detached_list_gaps(
    items: &[Span],
    token: &str,
    allowed_before: &[u16],
    allowed_after: &[u16],
    table: &WhitespaceTable,
) -> (Option<u16>, Option<u16>) {
    let mut after = Vec::new();
    for pair in items.windows(2) {
        let gap = geometry_gap_text(&pair[0], &pair[1]);
        let trail = if pair[1].start.row == pair[0].end.row {
            gap.get(token.len()..).unwrap_or("")
        } else {
            gap.as_str()
        };
        if let Some(class) = classify_whitespace(trail, allowed_after, table) {
            after.push(class);
        }
    }
    let _ = allowed_before;
    (None, majority(after))
}
```

Geometry can't split a same-row gap around its separator. It assumes the separator sits against the left item and classifies the rest as the after side. The before side falls to options: this is the spelling-of-whitespace limit the spec names.

- In `prepare.rs`, where a list's items are classified, collect the unplaced items' spans (transports with `span()` and no `anchor()`) and call `classify_detached_list_gaps` when every item in the list is detached.
- Root edges: the root transport's flank sites take `geometry_gap_text` between the root's start and its first child (leading), and between its last child's end and the root's end (trailing). Apply them through the same flank fill.

- [ ] **Step 4: Run to verify pass**

Run: `cargo test -p sittir-core --test classify`, then `cargo test --workspace`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(classify): detached seams come from geometry through the same classifier" -- rust/crates/sittir-core/src/classify.rs rust/crates/sittir-core/src/prepare.rs rust/crates/sittir-core/tests/classify.rs
```

---

### Task 9: The TypeScript projection: `$edited`, `$anchor`, and composed points

**Files:**
- Create: `packages/common/src/points.ts`
- Modify: `packages/common/src/transport-data.ts` (all of it; see the functions listed below)
- Modify: `packages/common/src/span.ts` (becomes a thin re-export of `slicePoints`; delete `ByteSpan`)
- Modify: the wrap emitter wherever it stores a child on an ancestor. Find those sites with `search` for `hoist` in `packages/codegen/src/emitters/wrap.ts`: each must compose the child's `$span` through `composeSpan`.
- Test: `packages/common/tests/transport-data.test.ts`, `packages/common/tests/points.test.ts` (create)
- Docs: `docs/glossary/packages-common-src.md`

**Interfaces:**
- Produces:
  - `Point`, `Span` (re-exported from `@sittir/types`);
  - `composePoint(base: Point, offset: Point): Point`;
  - `composeSpan(outer: Span, inner: Span): Span`;
  - `lineStarts(source: string): Uint32Array`;
  - `slicePoints(source: string, base: Point, span: Span): string`, which counts bytes;
  - `markEdited(data)` returns `data & { $edited: true }` and keeps its handle, span and child index;
  - `detachCoordinate(data)` sets `$edited` in place;
  - `projectValue` keeps `$span` on every node, and emits `$anchor: { $nodeHandle, $childIndex? }` on every non-folding node that has a handle.

- [ ] **Step 1: Write the failing tests**

```ts
// packages/common/tests/points.test.ts
import { describe, expect, it } from 'vitest';
import { composePoint, composeSpan, slicePoints } from '../src/points.ts';

describe('points', () => {
	it('composes by the column rule', () => {
		expect(composePoint({ row: 3, column: 4 }, { row: 0, column: 2 })).toEqual({ row: 3, column: 6 });
		expect(composePoint({ row: 3, column: 4 }, { row: 2, column: 7 })).toEqual({ row: 5, column: 7 });
	});
	it('composes a hoisted child through its dropped parent', () => {
		const mid = { start: { row: 1, column: 4 }, end: { row: 3, column: 1 } };
		const child = { start: { row: 0, column: 2 }, end: { row: 1, column: 3 } };
		expect(composeSpan(mid, child)).toEqual({ start: { row: 1, column: 6 }, end: { row: 2, column: 3 } });
	});
	it('slices by bytes on a multibyte line', () => {
		const src = 'é = 1;\nfoo';
		expect(slicePoints(src, { row: 0, column: 0 }, { start: { row: 0, column: 2 }, end: { row: 0, column: 5 } })).toBe(' = ');
	});
});
```

In `transport-data.test.ts`, add:

```ts
it('an edited node keeps its handle and span, never folds, and crosses with an anchor', () => {
	const node = { $type: 5, $nodeHandle: 7, $childIndex: 2, $span: SPAN, _value: leaf };
	const edited = markEdited(node);
	expect(edited.$nodeHandle).toBe(7);
	expect(edited.$edited).toBe(true);
	const out = toTransportData(edited as never) as Record<string, unknown>;
	expect(out.$nodeHandle).toBeUndefined();
	expect(out.$anchor).toEqual({ $nodeHandle: 7, $childIndex: 2 });
	expect(out.$span).toEqual(SPAN);
});

it('an untouched node with outside trivia crosses as a transport with its anchor and span', () => {
	const node = { $type: 5, $nodeHandle: 7, $span: SPAN, $_trivia: { leading: [comment] }, _value: leaf };
	const out = toTransportData(node as never) as Record<string, unknown>;
	expect(out.$anchor).toEqual({ $nodeHandle: 7 });
	expect(out.$span).toEqual(SPAN);
});

it('an untouched node below an edited one still folds', () => {
	const inner = { $type: 6, $nodeHandle: 9, $span: SPAN };
	const outer = markEdited({ $type: 5, $nodeHandle: 7, $span: SPAN, _value: inner });
	const out = toTransportData(outer as never) as Record<string, unknown>;
	expect(out._value).toEqual({ $type: 6, $nodeHandle: 9, $span: SPAN });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm exec vitest run packages/common/tests/points.test.ts packages/common/tests/transport-data.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`points.ts`:

```ts
import type { Point, Span } from '@sittir/types';

export function composePoint(base: Point, offset: Point): Point {
	return offset.row === 0 ? { row: base.row, column: base.column + offset.column } : { row: base.row + offset.row, column: offset.column };
}

export function composeSpan(outer: Span, inner: Span): Span {
	return { start: composePoint(outer.start, inner.start), end: composePoint(outer.start, inner.end) };
}

export function lineStarts(bytes: Uint8Array): Uint32Array {
	const starts = [0];
	for (let i = 0; i < bytes.length; i++) if (bytes[i] === 0x0a) starts.push(i + 1);
	return Uint32Array.from(starts);
}

export function slicePoints(source: string, base: Point, span: Span): string {
	const bytes = new TextEncoder().encode(source);
	const starts = lineStarts(bytes);
	const at = (p: Point): number => starts[p.row]! + p.column;
	return new TextDecoder().decode(bytes.subarray(at(composePoint(base, span.start)), at(composePoint(base, span.end))));
}
```

`transport-data.ts`:
- `markEdited(data)` returns `{ ...data, $edited: true }`, with the type `T & { readonly $edited: true }`.
- `detachCoordinate(data)` sets `(data as Record<string, unknown>).$edited = true`.
- `isUntouchedBelow` returns `false` for a record with `$edited === true`, and otherwise keeps its span requirement.
- `foldsToCoordinate` also refuses `$edited`.
- `projectValue`, past the fold:
  - if `normalized.$nodeHandle` is a number, set `out.$anchor = { $nodeHandle, ...(childIndex !== undefined && { $childIndex }) }`;
  - delete `$nodeHandle`, `$childIndex` and `$edited` from `out`;
  - keep `$span` (drop the `delete out.$span`);
  - keep dropping `$text` from storage-bearing nodes.
- `stripStructuralProvenance` stops deleting `$span`.
- `asCoordinate` keeps copying `$childIndex`.

`span.ts`: delete `spanSlicer`/`sliceSpan`/`ByteSpan` and migrate their callers (Task 12 lists them) to `slicePoints` or `$cst()`. If removing them in this task breaks tools, keep the exports for one task as re-exports that throw a clear "byte spans are gone; use slicePoints" error, and remove them in Task 12.

Wrap hoisting: every emitted site that stores a child's data on an ancestor must pass the child through `composeSpan(intermediate.$span, child.$span)` when both are present. Add a test in `packages/codegen/src/emitters/__tests__/` for the emitted call at one such site. If the search finds no site that moves a visible node's child, record that finding in the glossary entry for `composeSpan` and skip the emitter change.

- [ ] **Step 4: Run to verify pass**

Run: `pnpm exec vitest run packages/common`, then `pnpm exec tsc -p packages/common --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(common): edits mark the node; transports cross with \$span and \$anchor" -- packages/common/src packages/common/tests docs/glossary/packages-common-src.md packages/codegen/src/emitters
```

---

### Task 10: `$cst()`

**Files:**
- Modify: `rust/crates/sittir-core/src/engine.rs` (add `cst(handle, child_index)`)
- Modify: `rust/crates/sittir-core/src/napi_engine.rs` (the napi method inside the engine macro, beside `find_and_read`)
- Modify: `packages/common/src/engine.ts` (the bound-node surface: add `$cst()` next to `$commit`)
- Modify: `packages/types/src/core-types.ts` / `engine-api.ts` (`CstFacts` type; `$cst()` on tree-bound nodes only)
- Test: `rust/crates/sittir-core/tests/anchor.rs`; `packages/typescript/tests/cst.test.ts` (create)

**Interfaces:**
- Produces:
  - Rust: `pub struct CstFacts { kind: KindId, start_byte: u32, end_byte: u32, start: Point, end: Point, text: String }`;
  - `ParsedTree::cst(&self, handle: u64, child_index: Option<u16>) -> Result<CstFacts, CoordinateError>`: with a child index it is the handle's node's child, otherwise the handle's node;
  - TS: `interface CstFacts { readonly kind: number; readonly startByte: number; readonly endByte: number; readonly start: Point; readonly end: Point; readonly text: string }`;
  - `$cst(): CstFacts` on tree-bound nodes; its type is absent on detached, factory and serialized nodes.

- [ ] **Step 1: Write the failing tests**

```ts
// packages/typescript/tests/cst.test.ts
import { describe, expect, it } from 'vitest';
import { engine } from './helpers/engine.ts';

describe('$cst()', () => {
	it("returns tree-sitter's facts for a parsed node", () => {
		const root = engine.parse('let x = 1;\nconst é = 2;\n');
		const second = root.statements()[1]!;
		const cst = second.$cst();
		expect(cst.start).toEqual({ row: 1, column: 0 });
		expect(cst.text).toBe('const é = 2;');
		expect(cst.endByte - cst.startByte).toBe(Buffer.byteLength('const é = 2;'));
	});
	it('is absent on a detached node', () => {
		const root = engine.parse('let x = 1;');
		expect('$cst' in root.$detach()).toBe(false);
	});
});
```

Use the grammar test helper that the package's existing tests import (look at `packages/typescript/tests/list-owner.test.ts`'s imports). The second test depends on Task 11: write it as `it.todo` here and switch it on in Task 11. Flip Task 5's `$cst()` half of `relative-positions.test.ts` on in this task.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm exec vitest run packages/typescript/tests/cst.test.ts`
Expected: FAIL (`$cst is not a function`).

- [ ] **Step 3: Implement**

- `ParsedTree::cst` resolves the node the same way `base_of` does. It fills `CstFacts` from `node.kind_id()`, `byte_range()`, `start_position()`, `end_position()`, and `&source[range]`.
- The napi method is `cst(handle: f64, child_index: Option<u32>) -> napi::Result<CstFacts>`, finding the tree by the handle's tree id.
- `$cst()` on the bound surface calls it with the node's `$nodeHandle`/`$childIndex`, throwing `"this node is not tree-bound"` when it has no handle.
- Add `CstFacts` to `@sittir/types` and declare `$cst` on the Parsed surface.
- Glossary entries go in `docs/glossary/packages-common-src.md` and `packages-types-src.md`.

- [ ] **Step 4: Run to verify pass**

Run: `cargo test --workspace`; `pnpm exec vitest run packages/typescript/tests/cst.test.ts packages/tools/src/validate/__tests__/relative-positions.test.ts`
Expected: PASS, with the full corpus position check green.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(engine): \$cst() returns tree-sitter's facts through the handle" -- rust/crates/sittir-core/src packages/common/src packages/types/src packages/typescript/tests/cst.test.ts packages/tools/src/validate/__tests__/relative-positions.test.ts docs/glossary
```

---

### Task 11: Detaching

**Files:**
- Modify: `rust/crates/sittir-core/src/read_node.rs` (a detached read: deep, text on every leaf, no handles)
- Modify: `rust/crates/sittir-core/src/engine.rs`, `napi_engine.rs` (`read_detached(handle, child_index)`)
- Modify: `packages/common/src/engine.ts`:
  - `$detach()` on bound nodes;
  - a per-tree registry of handed-out nodes (a `WeakRef` set keyed by tree id);
  - `disposeTree` detaches each live one before freeing.
- Test: `packages/common/tests/detach.test.ts` (create); switch on the detached rows in `trivia-probes.test.ts` (Task 7) and the `$cst` absence case (Task 10)

**Interfaces:**
- Produces:
  - `$detach(): Detached<this>`: the same data with relative spans, `$text` on every leaf, and no `$nodeHandle`, `$childIndex` or `$anchor`. It has no `$cst()` and renders from data and geometry;
  - the engine's `disposeTree(treeId)` first calls `$detach` in place on every live node it handed out for that tree.

- [ ] **Step 1: Write the failing tests**

```ts
// packages/common/tests/detach.test.ts, one table per grammar
it.each(corpusFiles('rust'))('detaching keeps every untouched gap: %s', async (file) => {
	const source = await readCorpus(file);
	const root = engine.parse(source);
	const detached = root.$detach();
	expect(JSON.stringify(detached)).not.toContain('$nodeHandle');
	expect(render(detached)).toEqual(layoutOf(source)); // layout: breaks, blank lines, indentation, comments
});

it('disposing a tree detaches the nodes it handed out', () => {
	const root = engine.parse('fn f() {\n    x\n}\n');
	const body = root.items()[0]!;
	engine.disposeTree(root);
	expect(render(body)).toBe('fn f() {\n    x\n}');
});
```

`layoutOf(source)` normalizes only what geometry can't give: runs of spaces within a line collapse to the renderer's default, and tabs map to the indent unit. It keeps line breaks, blank lines, indentation depth and comment text. Put it in the test helpers with a glossary entry, since it's a tool function.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm exec vitest run packages/common/tests/detach.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

- `read_detached`: a deep read of the node the handle names, with a `ReadModel` override whose `carries_text` is true for every leaf and with every handle set to `None`. The spans are the same relative spans; the root keeps its span relative to its own parent.
- `$detach()` calls it and wraps the result with the same wrap function as a read. It sets no `$nodeHandle`, so the node never folds.
- Registry: `engine.ts` records each node it returns, as a `WeakRef`, in a `Map<treeId, Set<WeakRef>>`. `disposeTree` walks the set, replaces each live node's storage in place with its `read_detached` result, and then frees the tree.
- Glossary entries for `$detach`, `read_detached` and the registry.

- [ ] **Step 4: Run to verify pass**

Run: `pnpm exec vitest run packages/common/tests/detach.test.ts packages/tools/src/validate/__tests__/trivia-probes.test.ts packages/typescript/tests/cst.test.ts`
Expected: PASS, including the detached trivia rows.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(engine): \$detach() and detach on dispose" -- rust/crates/sittir-core/src packages/common/src packages/common/tests docs/glossary packages/tools/src/validate/__tests__/trivia-probes.test.ts packages/typescript/tests/cst.test.ts
```

---

### Task 12: Consumers and parity fixtures

**Files:**
- Modify: `packages/tools/src/validate/read-render-parse.ts`:
  - `selfContainedRenderInput` L356-400 becomes a detach;
  - `span` uses at L364 and L642.
- Modify: `packages/tools/src/validate/factory-render-parse.ts:641`, `validate/common.ts:380,1120`, `validate/trivia-placement.ts:31`, `probe/kind.ts:1268`, `exercise/roundtrip` (find its span use with `search`)
- Modify: `packages/codegen/src/emitters/wrap.ts` (`_hasSeparatorFlank` emission; find it via `usesHasSeparatorFlank` at L790)
- Modify: `packages/tools/src/scripts/collect-baseline.ts` (parity fixtures are written detached)
- Regenerate: `rust/crates/sittir-{rust,python,typescript}/test-fixtures.json`
- Test: `packages/tools/src/validate/__tests__/self-contained-render-input.test.ts` (rewrite), the emitted `_hasSeparatorFlank` test in `packages/codegen/src/emitters/__tests__/`

**Interfaces:**
- Consumes: `slicePoints`, `composeSpan` (Task 9), `$cst()` (Task 10), `$detach()` (Task 11).

- [ ] **Step 1: Write the failing tests**

Rewrite `self-contained-render-input.test.ts` so that `selfContainedRenderInput(root)` equals `root.$detach()` in data:
- no `$nodeHandle` anywhere;
- `$text` on every leaf;
- no `$sameLine` or `$tokensBetween`;
- spans unchanged.

For `_hasSeparatorFlank`, add an emitted-source assertion. The flank checks become `element.$span.start` equal to `{ row: 0, column: 0 }` for the start flank and `element.$span.end` equal to the container's `$span.end` offset for the end flank. The end offset is the container's `end.offset_from(start)`: compute it with a small emitted helper whose one source is a runtime function in `@sittir/common`, `spanExtent(span)`.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm exec vitest run packages/tools/src/validate/__tests__/self-contained-render-input.test.ts packages/codegen/src/emitters/__tests__`
Expected: FAIL.

- [ ] **Step 3: Implement**

- `selfContainedRenderInput(data)` becomes `detachData(data, source)`, one tool-side function built on the same `read_detached` napi call. If the validator holds only data, not a live node, it must still have the tree, because validators parse first. Delete its `$text`, `$sameLine` and `$tokensBetween` copying.
- Every validator, probe and exercise site that slices `source` by `$span`: use `node.$cst().text` / `$cst().startByte` where the node is tree-bound, and `slicePoints(source, base, span)` where only data and a threaded base are held. `probe kind`'s span search compares `$cst()` byte ranges.
- `_hasSeparatorFlank`: emit the relative comparisons above, calling `spanExtent` from `@sittir/common`.
- `collect-baseline.ts` writes fixtures through the detach. Regenerate the three `test-fixtures.json` files with the baseline command in DEVELOPMENT.md. The rust fixtures that were left out because the source starts with a line break now return: remove them from the left-out list.
- Regenerate every grammar.

- [ ] **Step 4: Run to verify pass**

Run: `pnpm exec vitest run packages/tools packages/codegen`, `cargo test --workspace`, `pnpm exec tsc -b --noEmit`
Expected: PASS; type-check 0.

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor(tools): consumers read relative points or \$cst(); fixtures are detached data" -- packages/tools/src packages/codegen/src/emitters docs/glossary rust/crates/sittir-rust/test-fixtures.json rust/crates/sittir-python/test-fixtures.json rust/crates/sittir-typescript/test-fixtures.json rust/crates/sittir-*/src packages/*/src packages/*/.sittir
```

---

### Task 13: Gates

**Files:** none new. This task runs the repo's three-way verification and records the results.

- [ ] **Step 1: The spec's probes**

Run: `pnpm exec vitest run packages/tools/src/validate/__tests__/relative-positions.test.ts packages/tools/src/validate/__tests__/trivia-probes.test.ts packages/common/tests/detach.test.ts packages/typescript/tests/cst.test.ts`
Expected: PASS. These cover line-start resolution, comments beside tokens, detached layout, seating across trees, edited parents and mixed trees.

- [ ] **Step 2: Validation history**

Run: `pnpm run validate:native`, then `pnpm run validate:history`
Expected: the rows are identical across the three grammars, except for the parity fixture count, which rises by rust's returned fixtures. Compare the numbers and don't eyeball them. Any other movement stops the work for review; do not revert it.

- [ ] **Step 3: The full suite**

Run: `pnpm exec vitest run` (as its own call), `cargo test --workspace`, `pnpm exec tsc -b --noEmit`, `pnpm run lint`
Expected: all green. Isolate any new failure with stash-and-rerun before calling it pre-existing.

- [ ] **Step 4: No stamp remains**

Search the whole tree for `\$sameLine|\$tokensBetween|same_line|tokens_between` using infigraph `search` with `regex=true`.
Expected: matches only in archived planning docs.

- [ ] **Step 5: Commit the validation report and open the PR**

```bash
git commit -m "chore(validate): record relative-coordinates validation" -- packages/tools/validation-report.json packages/tools/validation-history.jsonl
```
