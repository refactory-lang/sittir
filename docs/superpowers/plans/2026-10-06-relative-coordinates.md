# Relative Coordinates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Comments keep their side of a token without stamped counts, snapshot data renders with its parsed layout from geometry alone, and `$cst()` reads tree-sitter's facts by index.

**Architecture:** Two steps after the typed reader's one-reader step. The trivia step moves comment ownership to the side of a token, adds the closing gap, and resolves every trivia join at prepare from a per-source line table, so `$sameLine` and `$tokensBetween` go. The snapshot step adds `$snapshot()`, which computes points relative to each node's holder while the tree is loaded, renders snapshot seams from those points, makes the parity fixtures snapshots, and adds `$cst()` by index.

**Tech Stack:** Rust 1.88 workspace (tree-sitter 0.26, napi-rs 3); TypeScript codegen in `packages/codegen`; vitest; the `sittir-parity-tests` crate.

**Spec:** `docs/superpowers/specs/2026-10-06-relative-coordinates-design.md`.

**Superseded in part on 2026-10-09:** the trivia step (Tasks 3–8) gives way to the trivia table (`docs/superpowers/specs/2026-10-09-trivia-table-design.md`), which `docs/superpowers/plans/2026-10-10-arena-tables.md` lands after this plan, in the shared arena's step 3. Task 1 lands with the snapshot step, which keeps the trivia the typed reader leaves: a snapshot carries the reader's placed trivia with its `$sameLine` and `$tokensBetween` stamps, as a parity fixture does today, until the table gives it its range's gaps.

## Scope and sequencing

The trivia and snapshot steps build on the one-reader step of `docs/superpowers/plans/2026-10-05-typed-reader.md`, which lands the index, the registry and the edited-index set and removes today's reader. Most of their code reads what that step leaves, so this plan details only what does not depend on it, and outlines the rest. The outlined tasks are detailed against master after the one-reader step lands, as that plan detailed each step after the one before it.

| Task | Detailed | Lands in |
| --- | --- | --- |
| 1. Points and the line table | now | the snapshot step's PR, first commit |
| 2. Index offsets from a start node | now | the typed-reader plan's Task 17, as its first step |
| 3. The closing gap in the model | now | superseded by the trivia table |
| 4–8. The trivia step | outline | superseded by the trivia table |
| 9–13. The snapshot step | outline | the snapshot step's PR |

Task 1 adds declarations that only the snapshot step reads, so it lands with that step, never alone: the repo keeps no export without a reader.

## Global Constraints

- A tree-backed coordinate holds its tree, `index`, `end`, byte range and kind; it holds no points. Points exist only in snapshot data.
- Points keep tree-sitter's `{ row, column }`; a column counts bytes within its line. The tree's descendant index is named `index`.
- A row is counted by `\n` only, as tree-sitter counts it; a `\r` before it stays on the row it ends.
- Every point in snapshot data is measured from the start of the transport whose bytes contain it, and no offset is negative.
- `sittir-core` holds no grammar fact.
- Generated files are never hand-edited. Change `packages/codegen/src/**` and regenerate with `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src` for rust, typescript, python, scm and regex.
- `packages/codegen/src/` carries no explanatory comments: each new declaration there gets a `###` entry in its directory's glossary under `docs/glossary/`. Rust in `sittir-core` carries doc comments.
- No PR, issue, spec, ruling or task number in code, comments, glossary entries or doc comments.
- Every commit uses `git commit -F <msg> -- <paths>`, with `git add` first for new files.
- Gates for a task that touches generated output, unless the task says otherwise:
  - `pnpm run validate:native`, rows compared to the recorded baseline;
  - `rtk cargo test --workspace --no-default-features`;
  - `pnpm exec vitest run`, as its own call;
  - `pnpm run type-check`;
  - oxlint on the changed TypeScript;
  - `bash scripts/comment-slop-check.sh --working`.
- Stop and report instead of committing when generated output, a fixture or a validation row moves under a change meant to be neutral, or when a gate fails in a way the task did not predict. A moved row under the trivia step is a finding for the maintainer. Nothing is reverted to make a gate pass.

## Review Focus

1. **A line break as `\r\n`.** A point's row counts `\n` only, so a `\r` stays at the end of the row it ends, and a byte's column on the next row starts after the `\n`. Test: Task 1 (`line_table_counts_rows_by_line_feed_only`).
2. **A byte at the very end of the source.** The last byte offset (the source's length) is a valid end point, on the last row; one past it names nothing. Test: Task 1 (`the_source_end_is_a_point_and_past_it_is_not`).
3. **A start node that is the root, or a leaf.** The offset rule must hold at both extremes: the root's offset is its own index, and a leaf's walk reports only itself. Test: Task 2 (every node of each source is a start node, the root and leaves included).
4. **A closing token that is immediate.** tree-sitter lexes no extra before an immediate token, so such a kind has no closing gap. Test: Task 3 (a temp grammar whose closer is `token.immediate(')')`).
5. **A slot named `closing`.** It would share the closing gap's inner key, so it is a blocking diagnostic, not a silent collision. Test: Task 3.

---

## Task 1: Points and the line table

**Files:**
- Create: `rust/crates/sittir-core/src/points.rs`
- Modify: `rust/crates/sittir-core/src/lib.rs` (add `pub mod points;` after `pub mod options;`)
- Test: unit tests in `points.rs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `sittir_core::points::Point { pub row: u32, pub column: u32 }`, with `Point::ZERO`, `Point::then(self, offset: Point) -> Point` and `Point::offset_from(self, base: Point) -> Point`;
  - `sittir_core::points::PointSpan { pub start: Point, pub end: Point }`, with `PointSpan::last_row(&self) -> u32`;
  - `sittir_core::points::LineTable`, with `LineTable::new(source: &str) -> Self`, `LineTable::point(&self, byte: usize) -> Option<Point>` and `LineTable::byte(&self, point: Point) -> Option<usize>`.

  The Rust name is `PointSpan` because `sittir_core::types::Span` is the byte range. On the wire a snapshot's key stays `span` (the snapshot step gives `PointSpan` its codec).

- [ ] **Step 1: Write the failing tests**

Create `rust/crates/sittir-core/src/points.rs` with only the tests:

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
        for (base, abs) in [(p(3, 4), p(3, 9)), (p(3, 4), p(6, 1)), (p(0, 0), p(0, 0)), (p(2, 0), p(2, 0))] {
            assert_eq!(base.then(abs.offset_from(base)), abs);
        }
    }

    #[test]
    fn line_table_counts_rows_by_line_feed_only() {
        let src = "é = 1;\nfoo\r\nbar";
        let lines = LineTable::new(src);
        assert_eq!(lines.point(0), Some(p(0, 0)));
        assert_eq!(lines.point(2), Some(p(0, 2))); // after the two-byte 'é'
        assert_eq!(lines.point(8), Some(p(1, 0)));
        assert_eq!(lines.point(11), Some(p(1, 3))); // the '\r' stays on row 1
        assert_eq!(lines.point(13), Some(p(2, 0)));
        assert_eq!(lines.byte(p(1, 0)), Some(8));
        assert_eq!(lines.byte(p(2, 0)), Some(13));
        assert_eq!(&src[8..13], "foo\r\n");
    }

    #[test]
    fn the_source_end_is_a_point_and_past_it_is_not() {
        let src = "ab\ncd";
        let lines = LineTable::new(src);
        assert_eq!(lines.point(5), Some(p(1, 2)));
        assert_eq!(lines.point(6), None);
        assert_eq!(lines.byte(p(1, 2)), Some(5));
        assert_eq!(lines.byte(p(1, 3)), None);
        assert_eq!(lines.byte(p(2, 0)), None);
        let trailing = LineTable::new("ab\n");
        assert_eq!(trailing.point(3), Some(p(1, 0)));
        assert_eq!(trailing.byte(p(1, 0)), Some(3));
    }

    #[test]
    fn point_and_byte_invert_each_other_over_a_source() {
        let src = "fn f() {\n    x\n}\n";
        let lines = LineTable::new(src);
        for byte in 0..=src.len() {
            let point = lines.point(byte).unwrap();
            assert_eq!(lines.byte(point), Some(byte), "byte {byte}");
        }
    }

    #[test]
    fn a_span_that_ends_with_its_line_break_ends_on_the_row_it_closes() {
        assert_eq!(PointSpan { start: p(0, 0), end: p(1, 0) }.last_row(), 0);
        assert_eq!(PointSpan { start: p(0, 0), end: p(0, 3) }.last_row(), 0);
        assert_eq!(PointSpan { start: p(1, 0), end: p(1, 0) }.last_row(), 1);
    }
}
```

Add `pub mod points;` to `lib.rs` after `pub mod options;`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `rtk cargo test -p sittir-core --no-default-features points`
Expected: compile errors (`Point`, `PointSpan`, `LineTable` not found).

- [ ] **Step 3: Write the implementation**

Above the tests in `points.rs`:

```rust
//! Points: a row and a byte column, as tree-sitter counts them. A snapshot
//! measures each of its points from the start of the transport whose bytes
//! contain it; composition follows tree-sitter's `length_add`, so a column is
//! relative only on its base's own row. A tree-backed node holds bytes, and
//! the line table turns them into points.

use serde::{Deserialize, Serialize};

/// A row and a byte column within it. Rows are counted by `\n` only.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Default, Serialize, Deserialize)]
pub struct Point {
    pub row: u32,
    pub column: u32,
}

impl Point {
    pub const ZERO: Point = Point { row: 0, column: 0 };

    /// The point `offset` names from `self`: on `self`'s row the columns add;
    /// on a later row the offset's column stands alone.
    pub fn then(self, offset: Point) -> Point {
        if offset.row == 0 {
            Point { row: self.row, column: self.column + offset.column }
        } else {
            Point { row: self.row + offset.row, column: offset.column }
        }
    }

    /// The offset of `self` from `base`, which must not lie after `self`;
    /// `base.then(self.offset_from(base)) == self`.
    pub fn offset_from(self, base: Point) -> Point {
        if self.row == base.row {
            Point { row: 0, column: self.column - base.column }
        } else {
            Point { row: self.row - base.row, column: self.column }
        }
    }
}

/// Two points: a snapshot node's start and end, measured from its holder's
/// start.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct PointSpan {
    pub start: Point,
    pub end: Point,
}

impl PointSpan {
    /// The row of the span's last byte: a span that ends with its line break
    /// ends on the row that break closes.
    pub fn last_row(&self) -> u32 {
        if self.end.column == 0 && self.end.row > self.start.row {
            self.end.row - 1
        } else {
            self.end.row
        }
    }
}

/// The byte offset at which each row of one source starts, built once and
/// shared by every render of that source.
#[derive(Debug, Clone)]
pub struct LineTable {
    starts: Vec<usize>,
    len: usize,
}

impl LineTable {
    pub fn new(source: &str) -> Self {
        let mut starts = vec![0];
        starts.extend(source.bytes().enumerate().filter(|&(_, b)| b == b'\n').map(|(i, _)| i + 1));
        Self { starts, len: source.len() }
    }

    /// The point of byte offset `byte`, or `None` past the source's end.
    pub fn point(&self, byte: usize) -> Option<Point> {
        if byte > self.len {
            return None;
        }
        let row = self.starts.partition_point(|&start| start <= byte) - 1;
        Some(Point { row: row as u32, column: (byte - self.starts[row]) as u32 })
    }

    /// The byte offset of `point`, or `None` when its row does not exist or
    /// its column runs past the row's end. A row's last column is its `\n`,
    /// or the source's end on the last row, as `point` returns for that byte.
    pub fn byte(&self, point: Point) -> Option<usize> {
        let row = point.row as usize;
        let start = *self.starts.get(row)?;
        let row_end = self.starts.get(row + 1).map_or(self.len, |next| *next - 1);
        let byte = start + point.column as usize;
        (byte <= row_end).then_some(byte)
    }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `rtk cargo test -p sittir-core --no-default-features points`
Expected: 6 passed.

- [ ] **Step 5: Lint and commit**

Run: `rtk cargo clippy -p sittir-core --no-default-features -- -D warnings`
Expected: no warnings.

```bash
git add rust/crates/sittir-core/src/points.rs
git commit -F <msg> -- rust/crates/sittir-core/src/points.rs rust/crates/sittir-core/src/lib.rs
```

Message: `feat(core): points and the line table`, with a body naming `Point`'s composition rule and the line table's two directions.

---

## Task 2: Index offsets from a start node

**Files:**
- Create: `rust/crates/sittir-parity-tests/tests/descendant_index.rs`

**Interfaces:**
- Consumes: `sittir_rust::language()`, `sittir_typescript::language()`, `sittir_python::language()`; tree-sitter's `TreeCursor::descendant_index`, `TreeCursor::goto_descendant` and `Node::descendant_count`.
- Produces: no declaration. It pins the tree-sitter behaviour the one-reader step's native query relies on: a walk from a node whose index is `s` reports `d` for the node whose root-cursor index is `s + d`, and a node's descendants are exactly `[index, index + descendant_count())`.

- [ ] **Step 1: Write the test**

```rust
//! A cursor numbers from the node it starts on. The native query walks from
//! its start node and adds that node's index; these tests hold that rule to
//! tree-sitter over whole sources.

use tree_sitter::{Language, Node, Parser, Tree};

fn parse(language: &Language, source: &str) -> Tree {
    let mut parser = Parser::new();
    parser.set_language(language).unwrap();
    parser.parse(source, None).unwrap()
}

/// Every node of `tree` in pre-order, with its root-cursor index.
fn indexed(tree: &Tree) -> Vec<(usize, Node<'_>)> {
    let mut out = Vec::new();
    let mut cursor = tree.walk();
    loop {
        out.push((cursor.descendant_index(), cursor.node()));
        if cursor.goto_first_child() {
            continue;
        }
        loop {
            if cursor.goto_next_sibling() {
                break;
            }
            if !cursor.goto_parent() {
                return out;
            }
        }
    }
}

fn check(language: &Language, source: &str) {
    let tree = parse(language, source);
    let nodes = indexed(&tree);
    for (i, (index, node)) in nodes.iter().enumerate() {
        assert_eq!(*index, i, "pre-order position");
        let end = index + node.descendant_count();
        let mut cursor = node.walk();
        for (d, (expected_index, expected)) in nodes[*index..end].iter().enumerate() {
            cursor.goto_descendant(d);
            assert_eq!(cursor.descendant_index(), d);
            assert_eq!(cursor.node(), *expected, "start {index}, offset {d}");
            assert_eq!(index + d, *expected_index);
        }
        if let Some((_, after)) = nodes.get(end) {
            let mut ancestor = after.parent();
            while let Some(a) = ancestor {
                assert_ne!(a, *node, "the node after {index}'s range is not its descendant");
                ancestor = a.parent();
            }
        }
    }
}

#[test]
fn rust_offsets_from_every_start_node_are_root_indexes() {
    check(&sittir_rust::language(), "/// doc\nfn f(a: u8, /* x */ b: u8) -> u8 {\n    a + b // y\n}\n");
}

#[test]
fn typescript_offsets_from_every_start_node_are_root_indexes() {
    check(&sittir_typescript::language(), "const a = [1, , 2]; // c\nclass C { m(): void {} }\n");
}

#[test]
fn python_offsets_from_every_start_node_are_root_indexes() {
    check(&sittir_python::language(), "def f(a):\n    # c\n    return a\n");
}
```

The crate already depends on `sittir-rust`, `sittir-typescript`, `sittir-python` and `tree-sitter`.

- [ ] **Step 2: Run the tests**

Run: `rtk cargo test -p sittir-parity-tests --test descendant_index`
Expected: 3 passed. A failure here is a finding, not a test to adjust: report it, since the one-reader step's query offsets depend on it.

- [ ] **Step 3: Commit**

```bash
git add rust/crates/sittir-parity-tests/tests/descendant_index.rs
git commit -F <msg> -- rust/crates/sittir-parity-tests/tests/descendant_index.rs
```

Message: `test(parity): a walk from any node reports root indexes less the node's own`.

---

## Task 3: The closing gap in the model

Superseded on 2026-10-09: an extra before a closer lies in a gap of the trivia table, which the compound owns, so no closing gap is derived (`docs/superpowers/specs/2026-10-09-trivia-table-design.md`, § 1).

**Files:**
- Modify: `packages/codegen/src/compiler/model/node-map.ts:1570-1572` (`GapWalkCtx`, add `GapWalk` after it) and `:1721-1767` (`innerGaps`; add `gapWalk` and `closingGap`)
- Modify: `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts:290-303` (add `closingSlotDiagnostics` after `triviaLineEndDiagnostics`), `:445` (call it), `:9` (import `AbstractAssembledCompound`)
- Modify: `docs/glossary/compiler-model.md` (`innerGaps` entry; new `gapWalk`, `GapWalk`, `closingGap` entries), `docs/glossary/compiler-diagnostics.md` (new `closingSlotDiagnostics` entry)
- Test: `packages/codegen/src/compiler/model/__tests__/trivia-facts.test.ts`

**Interfaces:**
- Consumes: `AbstractAssembledCompound.renderRule`, `_slots`, `triviaInterior`; `renderRuleWalker.childrenOf`.
- Produces:
  - `AbstractAssembledCompound.closingGap: boolean`, true when a node of the kind has a closing gap;
  - `closingSlotDiagnostics(grammar: string, nodeMap: NodeMap): GrammarDiagnostic[]`, code `closing-slot-name-reserved`, blocking.

  The trivia step reads `closingGap` to stamp the gap fact on the kind; its inner key is `closing`.

- [ ] **Step 1: Write the failing tests**

In `trivia-facts.test.ts`, import `closingSlotDiagnostics` beside `collectGrammarDiagnosticsForGrammar`, add after `innerGapsOf`:

```ts
function closingGapOf(nodeMap: NodeMap, kind: string): unknown {
	const node = nodeMap.nodes.get(kind);
	return node instanceof AbstractAssembledCompound ? node.closingGap : undefined;
}
```

and add these tests inside `describe('trivia model facts', …)`:

```ts
	it('gives a closing gap to a kind whose rule ends in a spaced token after its last slot', async () => {
		const rust = await nodeMapOf('rust');
		expect(closingGapOf(rust, 'arguments')).toBe(true);
		expect(closingGapOf(rust, 'binary_expression')).toBe(false);
		const typescript = await nodeMapOf('typescript');
		expect(closingGapOf(typescript, 'array')).toBe(true);
	});

	it('gives no closing gap before an immediate closer', async () => {
		const raw = await evaluateTempGrammar(
			{ extras: '/\\s/', rules: "source: ($) => repeat($.call), call: ($) => seq('(', field('arg', $.word), token.immediate(')')), word: () => /[a-z]+/" },
			''
		);
		const { nodeMap } = collectGrammarDiagnosticsForGrammar({ rawGrammar: raw });
		expect(closingGapOf(nodeMap, 'call')).toBe(false);
	}, 60_000);

	it("refuses a slot named 'closing' on a kind with a closing gap", async () => {
		const raw = await evaluateTempGrammar(
			{ extras: '/\\s/', rules: "source: ($) => repeat($.call), call: ($) => seq('(', field('closing', $.word), ')'), word: () => /[a-z]+/" },
			''
		);
		const { nodeMap } = collectGrammarDiagnosticsForGrammar({ rawGrammar: raw });
		expect(closingSlotDiagnostics('demo', nodeMap).map((d) => [d.code, d.ownerKind, d.canProceed])).toEqual([
			['closing-slot-name-reserved', 'call', false]
		]);
		expect(closingSlotDiagnostics('rust', await nodeMapOf('rust'))).toEqual([]);
	}, 60_000);
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run packages/codegen/src/compiler/model/__tests__/trivia-facts.test.ts`
Expected: FAIL: `closingSlotDiagnostics` is not exported, and `closingGap` is `undefined`.

- [ ] **Step 3: Split the walk out of `innerGaps`**

After `interface GapWalkCtx { … }` in `node-map.ts`, add:

```ts
interface GapWalk {
	readonly root: RenderRule;
	readonly slotById: ReadonlyMap<RuleId, AssembledNonterminal>;
	readonly occurrences: readonly { readonly slot: AssembledNonterminal; readonly precedingTokens: number }[];
	readonly immediateTokens: readonly boolean[];
}
```

In `AbstractAssembledCompound`, replace the head of `innerGaps` (from `get innerGaps()` through `walk(root, { conditional: false });`) with:

```ts
	private get gapWalk(): GapWalk {
		const root = this.renderRule;
		const slotById = new Map(this._slots.flatMap((slot) => slot.sourceRuleIds.map((id) => [id, slot] as const)));
		const occurrences: { readonly slot: AssembledNonterminal; readonly precedingTokens: number }[] = [];
		const immediateTokens: boolean[] = [];
		const walk = (rule: RenderRule, ctx: GapWalkCtx): void => {
			const slot = rule === root || rule.id === undefined ? undefined : slotById.get(rule.id);
			if (slot !== undefined) {
				occurrences.push({ slot, precedingTokens: immediateTokens.length });
				return;
			}
			if (rule.type === STRING) {
				if (!ctx.conditional) immediateTokens.push(rule.immediate === true);
				return;
			}
			const inner =
				ctx.conditional ||
				rule.type === CHOICE ||
				rule.multiplicity === 'optional' ||
				rule.multiplicity === 'array' ||
				rule.optionalElement === true;
			for (const child of renderRuleWalker.childrenOf(rule)) walk(child, { conditional: inner });
		};
		walk(root, { conditional: false });
		return { root, slotById, occurrences, immediateTokens };
	}

	get innerGaps(): readonly InnerGap[] {
		if (this.triviaInterior) return [];
		const { root, slotById, occurrences, immediateTokens } = this.gapWalk;
		if (!realizesEmpty(root, slotEmptiness(root, { slotById }))) return [];
```

The rest of `innerGaps` (from `const tokens = immediateTokens.length;`) is unchanged. Then add after `innerGaps`:

```ts
	get closingGap(): boolean {
		if (this.triviaInterior) return false;
		const { occurrences, immediateTokens } = this.gapWalk;
		const last = occurrences.at(-1);
		return last !== undefined && last.precedingTokens < immediateTokens.length && !immediateTokens[last.precedingTokens];
	}
```

- [ ] **Step 4: The diagnostic**

In `grammar-diagnostics.ts`, add `AbstractAssembledCompound` to the `../model/node-map.ts` import, add after `triviaLineEndDiagnostics`:

```ts
export function closingSlotDiagnostics(grammar: string, nodeMap: NodeMap): GrammarDiagnostic[] {
	return [...nodeMap.nodes.values()]
		.filter(
			(node): node is AbstractAssembledCompound =>
				node instanceof AbstractAssembledCompound && node.closingGap && node.slots.some((slot) => slot.name === 'closing')
		)
		.map((node) => ({
			scope: 'grammar' as const,
			code: 'closing-slot-name-reserved',
			severity: 'error' as const,
			grammar,
			ownerKind: node.kind,
			slotName: 'closing',
			message: `kind '${node.kind}' has a slot named 'closing', which collides with its closing trivia gap.`,
			proposal: `Rename the field or slot in grammar.sittir.ts.`,
			canProceed: false
		}));
}
```

and call it in `collectGrammarDiagnosticsForGrammar` after `...triviaLineEndDiagnostics(rawGrammar.name, nodeMap),`:

```ts
			...closingSlotDiagnostics(rawGrammar.name, nodeMap),
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm exec vitest run packages/codegen/src/compiler/model/__tests__/trivia-facts.test.ts`
Expected: PASS, every test in the file, the existing `innerGaps` tests included. If rust `arguments` or typescript `array` has no closing gap on master, stop and report the kind's render rule: the spec's examples rest on them.

- [ ] **Step 6: The glossary**

In `docs/glossary/compiler-model.md`, in the `AbstractAssembledCompound.innerGaps` entry, replace the two bullets about conditional tokens and finding a slot with:

```markdown
- Slot occurrences and token counts come from `gapWalk`; its conditional tokens are absent from an empty node.
```

and add after the entry:

```markdown
### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.gapWalk`

The render-order walk that `innerGaps` and `closingGap` both read: each slot occurrence with the count of unconditional literal tokens before it, and for each unconditional token whether it is immediate. Tokens under an optional or repeat member, or inside a choice, are conditional and not counted. A slot is found by its source rule ids, never at the rule root.

### `packages/codegen/src/compiler/model/node-map.ts::GapWalk`

What `gapWalk` returns: the render rule it walked, the slots by source rule id, the slot occurrences with their preceding token counts, and the immediacy of each unconditional token.

### `packages/codegen/src/compiler/model/node-map.ts::AbstractAssembledCompound.closingGap`

Whether a node of this kind has a closing gap: an extra after its last slot occurrence and before the next unconditional token belongs to the node's `closing` inner position rather than trailing the last child. True when the walk records an unconditional token after the last slot occurrence and that token is not immediate, since tree-sitter lexes no extra before an immediate token. rust `arguments` and typescript `array` have one (`[a, b, // c⏎]`); rust `binary_expression` ends in a slot and has none. A trivia-interior kind has none.

The fact is separate from `innerGaps`: an inner gap is a position in an empty node, and the closing gap one in a filled node. For a bracketed list the two share a token count (after the opener is also before the closer), so a key by token count cannot tell them apart; whether the node has a child can. `closing` is reserved as a slot name on kinds with the flag (`closingSlotDiagnostics`).
```

In `docs/glossary/compiler-diagnostics.md`, after the `triviaLineEndDiagnostics` entry:

```markdown
### `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts::closingSlotDiagnostics`

One blocking `closing-slot-name-reserved` error per kind that has a closing gap (`AbstractAssembledCompound.closingGap`) and a slot named `closing`. The node's `closing` inner key and the slot would name the same position in its trivia, so the grammar renames the field or slot in `grammar.sittir.ts`. No grammar has one today.
```

- [ ] **Step 7: Gates and commit**

No generated output changes: `closingGap` has no reader until the trivia step, and `closingSlotDiagnostics` fires on no grammar.

Run, each as its own call:
- `pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src` and the same for typescript, python, scm and regex, then `git status --short packages rust` — expected: no change;
- `pnpm exec vitest run packages/codegen`;
- `pnpm run type-check`;
- oxlint on the two changed TypeScript files;
- `bash scripts/comment-slop-check.sh --working`.

```bash
git commit -F <msg> -- packages/codegen/src/compiler/model/node-map.ts packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts packages/codegen/src/compiler/model/__tests__/trivia-facts.test.ts docs/glossary/compiler-model.md docs/glossary/compiler-diagnostics.md
```

Message: `feat(model): kinds ending in a spaced closer have a closing gap`.

---

## Outline: the trivia step (Tasks 4–8)

Superseded on 2026-10-09 by the trivia table (`docs/superpowers/specs/2026-10-09-trivia-table-design.md`), which `docs/superpowers/plans/2026-10-10-arena-tables.md` lands.

Detailed against master after the one-reader step lands. The PR carries Tasks 1 and 3 first.

4. **The closing gap reaches the reader.** Codegen stamps the closing gap on each kind with `closingGap` beside its `gap(n) = slot` attributes; the derive expands it; `sittir_core::read::place` puts an extra after the last child's tokens and before the closer there, keyed `closing`. The node surface's `inner` gains the `closing` gap on those kinds' types, and `innerGapsKeyed` counts it.
5. **Ownership by token side.** `place` assigns each extra by the spec's three rules (trailing the previous sibling when no token lies between, leading the next when one does, the closing gap when no next sibling exists), and stops computing `same_line` and `tokens_between`. Tests: the five comment cases of verification 7, read and placed.
6. **Joins resolved at prepare.** A resolved join per trivia entry, filled by prepare: from the source's `LineTable` (Task 1) for tree-backed entries, from an explicit whitespace entry or the defaults for built ones. `TransportTrivia::render_leading` and `render_trailing` read only the resolved join; `render_trailing`'s held entries go.
7. **The stamps go.** `$sameLine` and `$tokensBetween` leave `TriviaEntry`, the wire, the types and the self-contained fixture copies; the codec and the typed reader stop carrying them.
8. **Gates.** Verifications 7 (built), 8, 9, 10 and 11: the `trivia-placement` census and the validation rows before and after, each moved row reported to the maintainer.

## Outline: the snapshot step (Tasks 9–13)

9. **`PointSpan`'s codec** and the snapshot transport form: a node with a `span`, its kind and its leaves' text, and no tree, index or bytes.
10. **`$snapshot()`.** A native call reads a clean range from its index at full depth into snapshot data, each point measured from its holder's start through `LineTable::point` and `Point::offset_from`; an edited parsed node's data is copied with its span from its index; built nodes carry no span. Types: `$snapshot()` on parsed nodes only.
11. **Seams from geometry.** The gap classifier's entry takes two points in place of bytes; root edges from the first and last child's geometry. A snapshot's trivia joins by its entries' `$sameLine` and `$tokensBetween`, as a fixture's does today: the trivia step's joins (Task 6) are superseded, and the stamps stay until the trivia table.
12. **Fixtures are snapshots.** `selfContainedRenderInput` becomes `$snapshot()`; the parity fixtures are rewritten through it; rust's left-out fixtures return to their count before the root-edge change.
13. **`$cst()` by index**, with the parked branch's API and `cst.test.ts` carried over by hand; then verifications 7 (snapshots), 12–18.

## Self-review notes

- Spec coverage: § The index → Task 2; § Lines for tree-backed nodes → Task 1 and Task 6; § Trivia ownership → Task 5; § The closing gap → Tasks 3–4; § Factory nodes and § Joins resolved at prepare → Task 6; § Snapshots, § Rendering snapshot data, § Serialized data → Tasks 9–12; § `$cst()` → Task 13. § Identity, § Edits and folding and the query offsets belong to the one-reader step, amended in the typed-reader plan. § The record wire belongs to the record step.
- Review Focus: lines 1–2 are Task 1's tests, line 3 Task 2's, lines 4–5 Task 3's.
