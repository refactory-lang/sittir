# Trivia Ownership Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every comment has one owner and one position (leading, trailing or
inner). It is read, built, wrapped and rendered in one entry shape, and authors
can attach inner comments to empty nodes through a type-guarded `$trivia.inner`.

**Architecture:**
- **Reader:** the sittir-core reader stops letting each node collect its own
  sibling extras. The parent assigns each extra child to one owner by the
  placement rule.
- **Emitted gap tables:** tell the reader which empty slot an inner comment
  sits in.
- **Wrap and transport:** carry trivia entries through the same per-kind paths
  as slot children.
- **Render:** a per-kind `lineTerminated` fact and a `$sameLine` stamp decide
  line breaks.
- **Types:** `Empty<Kind>` types and `isEmpty` guards expose `inner` only where
  it can hold something.

**Tech Stack:** TypeScript codegen (`packages/codegen`), runtime helpers
(`packages/common`, `packages/types`), Rust core (`rust/crates/sittir-core`),
generated grammar crates and packages, vitest, cargo.

**Spec:** `docs/superpowers/specs/2026-09-26-trivia-ownership-design.md`

## Global Constraints

- DRY: one placement rule, one entry shape, one gap derivation. No trivia
  predicate is re-derived from text or names at render.
- Generated outputs (`packages/{rust,python,typescript}/src/*`, `.sittir/*`,
  `rust/crates/sittir-{rust,python,typescript}/src/*`) are never hand-edited.
  Change codegen and regenerate.
- No explanatory comments in `packages/codegen/src/`. Every new or changed
  declaration gets its `###` entry in `docs/glossary/`. No spec, plan, PR or
  task numbers in any comment or glossary text.
- Model additions are limited to the four the spec lists: `NodeTrivia.inner`,
  `$sameLine`, `lineTerminated`, `innerGaps`. Anything else stops for design
  review.
- Annotations are never read by compiler phases for this work.
- Ratchets only tighten:
  - the trivia validation row must tighten in all three grammars;
  - every other validate row holds or tightens;
  - phantom and S1 ceilings hold.
- Gates for every task:
  - targeted probes, wrap and render layers;
  - `pnpm run validate:native`, then `validate:history` compared row by row;
  - the full vitest suite as its own shell call;
  - `cargo test --workspace --no-default-features`;
  - workspace type-check with `--noEmit`.
- Commits use pathspecs (`git commit -- <paths>`). Formatting passes go in their
  own commit.

## Review Focus

1. **A line comment trailing a statement on the same line** (`a; // x\n b;`)
   renders `a; // x` and then a line break before `b`, never `a; // x b;`.
   Pinned in Task 7.
2. **A block comment on the same line before its owner** (`/* c */ a`) keeps its
   same-line placement when rendered detached: leading with `$sameLine`, joined
   by a space. Pinned in Task 3 (read stamp) and Task 7 (render).
3. **A loose string that no comment kind accepts** (`node.$trivia.leading('not
   a comment')`) throws, naming the grammar's comment kinds, instead of storing
   text that renders as code. Pinned in Task 5.
4. **Adding a child to a node that holds inner comments** (`$with` rebuild or
   factory re-call) throws, naming leading/trailing on the new child. It must not
   drop the comments or render them between the braces next to the new child.
   Pinned in Task 5.
6. **A whitespace entry next to a spacing default** (`blankline` leading on a
   statement whose seam default is a newline) renders exactly one blank line,
   not a newline plus a blank line. Pinned in Task 7.
5. **A python comment after an indented block's last statement** (`if x:\n    a\n
   # c\nb`): whatever tree-sitter-python's tree says, read → wrap → render stays
   byte-exact and built → render keeps the comment on its owner. Measured, not
   patched in the reader. Pinned in Task 8.

---

### Task 1: Placement census tool

A read-only diagnostic. It measures the two spec risks before any behaviour
changes.

**Files:**
- Create: `packages/cli/src/commands/tool/trivia-placement.ts`
- Modify: `packages/cli/src/commands/tool/index.ts` (register the tool)
- Test: `packages/cli/tests/commands/tool/trivia-placement.test.ts`
- Docs: `docs/glossary/` entry for the tool module; regenerate
  `docs/cli-command-glossary.md`

**Interfaces:**
- Produces: `sittir tool trivia-placement --grammar <g> [--json]`. For each
  corpus extra it prints `{ entry, kind, parent, prevNamed, nextNamed,
  sameRowAsPrev, rule: 1|2|3|4, today: 'leading'|'trailing'|'lost' }`, plus a
  summary: counts per rule, `lost` today, and inner-capable kinds whose gap
  would be unkeyable (a slotless kind with more than two tokens). It also counts
  python comments that tree-sitter places outside the indented block.

- [ ] **Step 1: Write the failing test.** Run the tool on a rust fixture string
  containing `fn f() { // TODO\n}` and `a; // note\nb;`, and assert:

```ts
import { runTriviaPlacement } from '../../../src/commands/tool/trivia-placement.ts';
it('classifies inner and same-line trailing', async () => {
	const rows = await runTriviaPlacement({ grammar: 'rust', source: 'fn f() { // TODO\n}\nfn g() { a; // note\n b; }\n' });
	expect(rows.map((r) => [r.rule, r.today])).toEqual([[4, 'lost'], [1, 'leading']]);
});
```

- [ ] **Step 2: Run it.** `pnpm exec vitest run packages/cli/tests/commands/tool/trivia-placement.test.ts`.
  Expected: FAIL (module not found).
- [ ] **Step 3: Implement.**
  - Walk the parsed tree with the native binding's node API.
  - For each extra, find `prev`/`next` named non-extra siblings and apply the
    spec's rules 1–4 in order.
  - `today` mirrors the current `compute_trivia`: leading of the next named
    sibling, trailing only when no next named sibling exists, `lost` when there
    is no named sibling at all.
  - Summary counts by rule and per grammar.
- [ ] **Step 4: Run the test.** Expected: PASS.
- [ ] **Step 5: Run the census on all three grammars' corpora.** Record the
  summaries in the commit message. **STOP and report to brainstorm if** any
  unkeyable-gap kind appears in a corpus entry. The spec sends the gap-key rule
  back for a decision in that case.
- [ ] **Step 6: Commit.**
  `git commit -m "feat(tools): trivia-placement census" -- packages/cli docs/glossary docs/cli-command-glossary.md`

### Task 2: Model facts `triviaKinds`, `lineTerminated` and `innerGaps`

Landed. The shape differs from the first draft; later tasks use these interfaces.

**Files:**
- `packages/codegen/src/compiler/model/trivia.ts`: `triviaKinds(nodeMap)` and `lineTerminated(nodeMap, kind)`, memoised per node map.
- `packages/codegen/src/compiler/model/node-map.ts`: `AssembledNodeBase.lineEnds`, `AbstractAssembledCompound.innerGaps`, `InnerGap`.
- `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts`: `trivia-line-end-undetermined`.
- `packages/codegen/src/compiler/generate.ts`: the TriviaEntry union reads `triviaKinds`, not the scm `trivia` role.
- Test: `packages/codegen/src/compiler/model/__tests__/trivia-facts.test.ts`.

**Interfaces:**
- `triviaKinds(nodeMap): ReadonlySet<string>`: the grammar's `extras`, plus every subtype of a supertype in `extras`, transitively. It is the one predicate for trivia kinds; nothing is stamped on nodes.
- `lineTerminated(nodeMap, kind): boolean | undefined`:
  - true iff every arm of the kind's token ends in an open pattern that cannot cross a line;
  - false for literal-only tokens (both python continuations), block comments and `html_comment`.
  - An external is read through its render-only rule (rust `_line_doc_content: token.immediate(/.*/)`).
  - `undefined` (an external with no render rule) is the blocking `trivia-line-end-undetermined` diagnostic, remedied by authoring the render rule.
- `AbstractAssembledCompound.innerGaps: readonly InnerGap[]`, `interface InnerGap { readonly key: string; readonly precedingTokens: number }`:
  - compounds only;
  - `precedingTokens` counts unconditional literal tokens;
  - a gap needs a token on each side, except in a token-less kind (the root).
  - Slotless leaves have no gaps (see the spec's Risks).
- Moves: the TriviaEntry union only.
  - python gains `LineContinuationNewline | LineContinuationNul`;
  - typescript spells `CommentBlock | CommentLine` and gains `HtmlComment`;
  - scm types `Comment` where it had `AnyNodeData`;
  - rust and regex are unchanged.
- `emitSynonymComment` keeps the scm `comment` role until Task 5 retires it.

### Task 3: Reader assigns each extra to one owner

**Files:**
- Modify: `rust/crates/sittir-core/src/read_node.rs`:
  - replace `compute_trivia` (per-node sibling walk) with
    `assign_child_trivia(parent, …)`, called from `read_children`;
  - `ReadModel` gains `inner_gap_key`.
- Modify: `rust/crates/sittir-core/src/types.rs`: `NodeTrivia` gains
  `inner: Option<BTreeMap<String, Vec<NodeData>>>` (serialized as an object keyed
  by gap, matching the spec's `Record<GapKey, TriviaEntry[]>`), and `NodeData`
  gains `same_line: bool` (serialized as `$sameLine`, omitted when false).
- Modify: `packages/codegen/src/emitters/kind-id-rust.ts`: emit `inner_gap_key`.
- Test: `rust/crates/sittir-core/tests/read_node.rs`

**Interfaces:**
- Consumes: `innerGaps` (Task 2).
- Produces:
  - `ReadModel::inner_gap_key(&self, kind: KindId, preceding_tokens: u16) -> Option<&'static str>`,
    defaulting to `None`.
  - Read `NodeData` whose `trivia_data` follows the spec's rules 1–4. Entries
    carry `$sameLine` when on their anchor's row.

- [x] **Step 1: Write the failing tests** in `rust/crates/sittir-core/tests/read_node.rs`,
  using the existing rust-grammar test model:

```rust
#[test]
fn same_line_comment_trails_previous_sibling() {
    let root = read("fn g() { a; // note\n b; }");
    let stmts = block_statements(&root);
    let trailing = stmts[0].trivia_data.as_ref().unwrap().trailing.as_ref().unwrap();
    assert_eq!(trailing.len(), 1);
    assert!(trailing[0].same_line);
    assert!(stmts[1].trivia_data.is_none());
}

#[test]
fn comment_in_empty_block_is_inner_of_block() {
    let root = read("fn f() { // TODO\n}");
    let block = function_body(&root);
    let inner = block.trivia_data.as_ref().unwrap().inner.as_ref().unwrap();
    assert_eq!(inner.get("statements").map(Vec::len), Some(1));
}

#[test]
fn block_comment_before_owner_on_same_row_is_same_line_leading() {
    let root = read("fn f() { /* c */ a; }");
    let lead = &block_statements(&root)[0].trivia_data.as_ref().unwrap().leading.as_ref().unwrap()[0];
    assert!(lead.same_line);
}
```

  `read`, `block_statements` and `function_body` are small helpers in the test
  file over the existing test model.
- [x] **Step 2: Run them.** `cargo test -p sittir-core --test read_node`.
  Expected: FAIL (the fields don't exist).
- [x] **Step 3: Implement.**
  - In `read_children(parent)`, collect the parent's children with their index
    and a flag for "named, not extra". For each extra child `c`, pick the owner:
    1. The previous named non-extra sibling ends on `c.start_position().row`:
       trailing of prev, `same_line = true`.
    2. Otherwise, if a next one exists: leading of next. `same_line = true` when
       `c.end_position().row == next.start_position().row`.
    3. Otherwise, if a prev exists: trailing of prev.
    4. Otherwise: inner of the parent. `preceding_tokens` is the count of
       anonymous non-extra children before `c`.
       `model.inner_gap_key(stamped_kind(parent), preceding_tokens)` gives the
       gap. On `None`, emit no entry and record the diagnostic that the
       validator's trivia row counts.
  - Owners get their trivia as their `NodeData` is built. Pass a
    `HashMap<usize, NodeTrivia>` keyed by child index into the per-child read.
  - Delete `compute_trivia`. Entries are read with the same `read_ts_node(…,
    ReadDepth::Deep, model)` call used today.
  - In `kind-id-rust.ts`, emit
    `fn inner_gap_key(kind, n) -> Option<&'static str>` as a `match (kind.0, n)`
    over every node's `innerGaps`. Keep the existing `u16::MAX if false` style
    for an empty table.
- [x] **Step 4: Run the tests.** Expected: PASS.
- [x] **Step 5: Regen and gate.** Validate rows hold or tighten (rrp stays
  byte-exact through source coordinates). Record the trivia-row change.
- [x] **Step 6: Commit.**

**As landed.** Task 3 also carries the render side of rules 1 and 4 (pulled
forward from Task 7, so every commit stays at baseline):

- Placement is computed per node from its own siblings and children
  (`read_node::node_trivia`), not by a parent pass: a node re-read by handle
  never runs its parent's `read_children`.
- Entries carry `$sameLine` and, on a same-line trailing entry, `$tokensBetween`
  (the anonymous tokens between owner and entry). `0` seats the entry right after
  its owner; more holds it past the tokens that follow the owner
  (`RenderSink::defer_trailing` / `seat_trailing`), seated before the next owner,
  a coordinate, a line break, or the end of the parent's render.
- `sittir_core::trivia::TransportTrivia<T>` is the one trivia carrier; each
  grammar aliases it over its `TriviaTransport`. Inner entries render at their
  gap through the render-body printer's `innerGap` hook
  (`trivia::render_inner`), before a presence-gated slot's `if`.
- `foldsToCoordinate` refuses only leading/trailing trivia; inner lies inside the
  span.
- The token-interior rule covers trivia kinds (`render-rules.ts::triviaInterior`):
  no interior seams in a trivia kind or the kinds reachable only through it,
  and the boundary before a member that starts immediate when present is not a
  site (`startsImmediateWhenPresent`).
- The native crate's display name is the package's `sittir.displayName`.

### Task 4: Wrap carries trivia entries through the per-kind path

**Files:**
- Modify: `packages/codegen/src/emitters/wrap.ts`. In the `finalize` wrapper
  that destructures `$_trivia` (around the `const { $storageType, $_trivia, … }
  = full;` line), wrap each `leading`/`trailing` entry and each `inner` gap's entries with the
  grammar's `wrapNode` dispatch by `$type`, instead of passing `$_trivia`
  through untouched.
- Modify: `packages/types/src/core-types.ts`. `NodeTrivia` gains
  `inner?: Readonly<Partial<Record<string, readonly TriviaEntry[]>>>`,
  and `TriviaEntry` becomes `AnyNodeData`, with no `| string`.
- Test: `packages/rust/tests/trivia.test.ts`

**Interfaces:**
- Consumes: the read shape from Task 3.
- Produces: wrapped trivia entries with the comment kind's own accessors, e.g.
  `entry.content()` for a `line_comment`.

- [ ] **Step 1: Write the failing test.**

```ts
it('wraps trivia entries like slot children', () => {
	const root = parseRust('//!\n/*!*/\n//\n///\nlet x;\n');
	const letDecl = firstStatement(root);
	const lead = letDecl.$_trivia!.leading!;
	expect(lead.map((e) => (e as { content(): string }).content())).toEqual(['!', '!', '', '/']);
});
```

  Use the helpers this test file already defines for parsing and statement
  access.
- [ ] **Step 2: Run it.** `pnpm exec vitest run packages/rust/tests/trivia.test.ts`.
  Expected: FAIL (`content` is not a function: entries are raw `$text` data).
- [ ] **Step 3: Implement.**
  - In the emitted `finalize` wrapper, replace the pass-through with
    `$_trivia: $_trivia === undefined ? undefined : wrapTriviaData($_trivia, tree)`.
  - Emit `wrapTriviaData` once per grammar in the wrap runtime section. It maps
    every entry through the same `wrapNode(entry, tree)` dispatch slot children
    use. The token-interior drill then fills `_content`.
- [ ] **Step 4: Run the test.** Expected: PASS.
- [ ] **Step 5: Regen and gate.** Rows hold. (The rust doc-comment fixtures
  that were left out came back in Task 3, with the baseline ratcheted there.)
- [ ] **Step 6: Commit.**

### Task 5: Runtime `$trivia`: getters, inner, refusals, loose strings

**Files:**
- Modify: `packages/common/src/utils.ts`:
  - `TriviaSetterRuntime` gains getters, `inner`, `innerAt`;
  - `triviaSetterOf` implements them;
  - `carryTriviaThroughWith` enforces the non-empty refusal.
- Modify: `packages/codegen/src/emitters/client-utils.ts` (`emitWithMethods`):
  pass each grammar's comment kinds and inner gaps to the runtime.
- Test: `packages/common/src/__tests__/trivia-setter.test.ts`

**Interfaces:**
- Consumes: `innerGaps` (as the emitted `INNER_GAPS: Record<string, readonly string[]>`
  const, keyed by kind name), the comment kinds, and `_TEXT_KINDS_BY_RANK`,
  already emitted for loose text.
- Produces the runtime surface:

```ts
interface TriviaSetterRuntime<Self> {
	(...args: unknown[]): Self;
	leading(): readonly TriviaEntry[];
	leading(...items: unknown[]): Self;
	trailing(): readonly TriviaEntry[];
	trailing(...items: unknown[]): Self;
	inner(): readonly TriviaEntry[];
	inner(...items: unknown[]): Self;
	innerAt(gap: string): readonly TriviaEntry[];
	innerAt(gap: string, ...items: unknown[]): Self;
}
```

- [ ] **Step 1: Write the failing tests.**

```ts
it('reads what it set', () => {
	const b = ir.block().$trivia.inner(ir.lineComment(' TODO'));
	expect(b.$trivia.inner()).toHaveLength(1);
});
it('refuses inner on a non-empty node', () => {
	const b = ir.block(ir.expressionStatement(ir.identifier('a')));
	expect(() => (b.$trivia as any).inner(ir.lineComment(' x'))).toThrow(/leading|trailing/);
});
it('refuses an unknown gap', () => {
	expect(() => (ir.block().$trivia as any).innerAt('nope', ir.lineComment(' x'))).toThrow(/gap/);
});
it('refuses adding a child to a node with inner comments', () => {
	const b = ir.block().$trivia.inner(ir.lineComment(' TODO'));
	expect(() => b.$with.statements([ir.expressionStatement(ir.identifier('a'))])).toThrow(/leading|trailing/);
});
it('accepts whitespace items and whitespace strings', () => {
	const a = ir.identifier('a').$trivia.leading(ir.whitespace.blankline());
	const b = ir.identifier('a').$trivia.leading('\n\n');
	expect(b.$trivia.leading()).toEqual(a.$trivia.leading());
});
it('classifies loose strings against comment kinds and rejects others', () => {
	const f = ir.identifier('a').$trivia.leading('// hi');
	expect(f.$trivia.leading()[0]!.$type).toBe(TSKindId.LineComment);
	expect(() => ir.identifier('a').$trivia.leading('not a comment')).toThrow(/line_comment|block_comment/);
});
```

  Imports come from `@sittir/rust` in the rust package test harness. Place the
  file under `packages/rust/tests/trivia-setter.test.ts` if the common package
  cannot import a grammar.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Items may be any extra kind's node data or a `_whitespace` item
    (`ir.whitespace.blankline()`); the grammar's extra kinds come from its
    `extras` and `trivia` role, the whitespace items from `_whitespace`.
  - With zero args, each side returns its stored entries (`[]` when absent).
  - A whitespace-only string maps to the `_whitespace` item whose text equals it
    (`whitespaceTextOf`); `'\n\n'` → blankline.
  - Any other string item is classified by the first extra kind in
    `_TEXT_KINDS_BY_RANK` whose anchored pattern accepts it, then built through
    that kind's factory. Otherwise throw
    `trivia: '<text>' is none of <kinds>`.
  - `inner`/`innerAt`: look up `INNER_GAPS[node.$type-name]`. If absent or empty,
    throw `trivia: <kind> has no inner gap; attach to a child with leading/trailing`.
    If the node is not empty (any gap's slot storage key `_<gap>` holds a value,
    or `interior` and the node has any slot value), throw the same message. An
    unknown gap throws `trivia: <kind> has no gap '<gap>'`.
  - `carryTriviaThroughWith`: when the source trivia has `inner` and the rebuilt
    node is not empty, throw
    `trivia: <kind> holds inner comments; move them to leading/trailing on the new child`.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Regen, gate and commit.**

### Task 6: Types: `Empty<Kind>`, `isEmpty`, factory return types

**Files:**
- Modify: `packages/codegen/src/emitters/types.ts`: emit `Empty<Kind>` per
  inner-capable kind and the `isEmpty` overloads.
- Modify: `packages/codegen/src/emitters/factories.ts`: an overload with no
  optional/repeat argument returns `Empty<Kind>`.
- Modify: `packages/codegen/src/emitters/client-utils.ts`: `TriviaSetterOf`
  gains the getters, and `InnerTrivia<N, Gap>` is emitted.
- Test: `packages/rust/tests/trivia-types.test-d.ts` (type test, run by the
  existing type-check:generated-examples gate) and
  `packages/codegen/src/emitters/__tests__/trivia-types-emit.test.ts`.

**Interfaces:**
- Consumes: `innerGaps` (Task 2) and the runtime surface (Task 5).
- Produces the emitted types:

```ts
export interface InnerTrivia<N, Gap extends string> {
	inner(): readonly TriviaEntry[];
	inner(...items: TriviaItem[]): N;
	innerAt(gap: Gap): readonly TriviaEntry[];
	innerAt(gap: Gap, ...items: TriviaItem[]): N;
}
export interface EmptyBlock extends Block { readonly $trivia: TriviaSetterOf<EmptyBlock> & InnerTrivia<EmptyBlock, 'statements'> }
export function isEmpty(node: Block): node is EmptyBlock;
```

  `innerAt` is emitted only when a kind has more than one gap. `isEmpty` is one
  overloaded export whose runtime checks the node's gaps via `INNER_GAPS`.

- [ ] **Step 1: Write the failing type test.**

```ts
import { ir, isEmpty, type Block } from '../src/index.js';
declare const parsed: Block;
ir.block().$trivia.inner(ir.lineComment(' TODO'));
// @ts-expect-error inner is only on EmptyBlock
parsed.$trivia.inner(ir.lineComment(' x'));
if (isEmpty(parsed)) parsed.$trivia.inner();
const s: readonly import('../src/index.js').Statement[] = parsed.statements();
```

- [ ] **Step 2: Run it.** `pnpm run type-check:generated-examples`. Expected:
  FAIL (no `isEmpty`, no `inner`).
- [ ] **Step 3: Implement the emitters.**
- [ ] **Step 4: Run it again.** Expected: PASS. Also run the emitter unit test
  asserting `EmptyBlock` and `isEmpty` are emitted for rust `block` and not for
  `function_item`.
- [ ] **Step 5: Regen, gate and commit.** List the public API additions in the
  commit message.

### Task 7: Transport and render: line-terminated breaks, leading joins, inner layout

Re-based on Task 3, which landed the core `trivia::TransportTrivia<T>` (with
`inner`, `same_line`, `tokens_between` per entry), same-line trailing seating in
the spacing writer, and inner entries at their gap. What remains:

**Files:**
- Modify: `rust/crates/sittir-core/src/trivia.rs` and `spacing.rs`:
  - leading entries join with a space when `same_line`, otherwise a line break
    (today every leading entry ends its line);
  - a held trailing run and every entry break the line only when the entry is
    line-terminated (today the writer breaks after any run left open): no
    special case for line comments, since their `<kind>_after` edge default is
    `newline` (next bullet).
- Modify: `packages/codegen/src/emitters/render-module.ts`:
  - `TriviaTransport` implements `fn line_terminated(&self) -> bool`, one arm
    per comment kind from the stamped fact.
- Modify: the render-defaults stamp (`compiler/model/render-rules.ts` /
  `site-preferences.ts`): an extra kind with `lineTerminated` gets `<kind>_after`
  default `newline`, and that edge admits only line-breaking arms.
- Modify: `rust/crates/sittir-core/src/trivia.rs` (`render_inner`): wrap the
  gap's entries in the block-body indent/dedent seams when the gap sits between
  the kind's block-body seams, otherwise join them by spaces (today each entry
  ends its line at the gap).
- Test: `rust/crates/sittir-core/src/macros.rs` (the existing
  `trivia_macro_tests`) and `packages/rust/tests/trivia-render.test.ts`.

**Interfaces:**
- Consumes: `lineTerminated`, `innerGaps` (Task 2), `$sameLine` and `inner`
  (Tasks 3–5).
- Produces: detached render of built and read trees per the spec's Render
  section.

- [ ] **Step 1: Write the failing tests.**

```ts
it('keeps a same-line line comment on its line and breaks after it', () => {
	const src = 'fn g() { a; // note\n b; }';
	expect(detachedRender(parseRust(src))).toContain('a; // note\n');
});
it('joins a same-line leading block comment with a space', () => {
	expect(detachedRender(parseRust('fn f() { /* c */ a; }'))).toContain('/* c */ a;');
});
it('renders inner comments inside an empty block', () => {
	const f = ir.functionItem({ name: 'f', body: ir.block().$trivia.inner(ir.lineComment(' TODO')) });
	expect(f.$render()).toMatch(/\{\n\s+\/\/ TODO\n\}/);
});
it('a blankline leading entry gives exactly one blank line', () => {
	const b = ir.block(ir.expressionStatement(ir.identifier('a')), ir.expressionStatement(ir.identifier('b')).$trivia.leading(ir.whitespace.blankline()));
	expect(b.$render()).toMatch(/a;\n\n\s*b;/);
	expect(b.$render()).not.toMatch(/a;\n\n\n/);
});
it('renders a built trailing line comment followed by the next statement on a new line', () => {
	const b = ir.block(ir.expressionStatement(ir.identifier('a')).$trivia.trailing(ir.lineComment(' x')), ir.expressionStatement(ir.identifier('b')));
	expect(b.$render()).not.toMatch(/\/\/ x b/);
});
```

  `detachedRender` is the existing helper the render tests use to render with
  source coordinates stripped.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement** the macro, transport, body node and
  `render_inner_trivia`. `TriviaTransport` gains the whitespace variants; a
  whitespace entry replaces the spacing default at its gap for that node (it is
  written through the spacing writer, which coalesces by rank). Add matching Rust unit tests to `trivia_macro_tests`
  for `same_line` and `line_terminated`.
- [ ] **Step 4: Run the tests.** Expected: PASS. Run
  `cargo test --workspace --no-default-features`.
- [ ] **Step 5: Regen, gate and commit.** The trivia row must tighten in every
  grammar. If a row regresses, stop and report old/new/where.

### Task 7b: The source emitter prints trivia as kinds

**Files:**
- Modify: `packages/tools/src/emit/factory-source.ts` (`triviaSuffix` and the
  inner-trivia print): every entry prints through its kind's builder (via
  `printValue` on the wrapped entry), whitespace entries as
  `ir.whitespace.<item>()`, and inner entries as `.$trivia.inner(...)`.
- Test: `packages/tools/src/emit/__tests__/factory-source-trivia.test.ts`
- Docs: glossary entries for `triviaSuffix` and the inner print.

**Interfaces:** Consumes the wrapped trivia entries (Task 4) and the runtime surface
(Task 5).

- [ ] **Step 1: Write the failing test.**

```ts
it('prints trivia entries as their kind builders', async () => {
	const src = await factorySourceOf('rust', 'fn f() {\n    // note\n    a;\n}\n');
	expect(src).toContain(`.$trivia.leading(ir.lineComment(' note'))`);
	expect(src).not.toMatch(/\$trivia\.leading\('/);
});
it('prints inner trivia on an empty body', async () => {
	expect(await factorySourceOf('rust', 'fn f() { // TODO\n}\n')).toContain(`.$trivia.inner(ir.lineComment(' TODO'))`);
});
```

- [ ] **Step 2:** Run it. Expected: FAIL (bare strings are printed today).
- [ ] **Step 3:** Implement; regenerate the dogfood examples (`gen:examples`).
- [ ] **Step 4:** Run it. Expected: PASS. Run the examples type-checks.
- [ ] **Step 5:** Commit.

### Task 8: Probes, examples and the validation ratchet

**Files:**
- Test: `packages/rust/tests/trivia-probes.test.ts`,
  `packages/typescript/tests/trivia-probes.test.ts`,
  `packages/python/tests/trivia-probes.test.ts`
- Modify: `examples/03-trivia.ts` (add an inner example). Regenerate examples.
- Modify: the trivia-row ceiling in `packages/tools/sclass-ceilings.json`
  (tighten only), and `docs/use-cases-and-examples.md` ("Leading and trailing
  trivia" gains inner).

- [ ] **Step 1: Write the probe tests.** Each is read → wrap → render byte-exact
  and built → render as the spec lists:
  - rust:
    - `fn f() { // TODO\n}`
    - `foo(/* none */)`
    - `struct S { /* empty */ }`
    - `a; // note`
    - a comments-only file
  - ts:
    - `function f() { /* empty */ }`
    - `for (/*a*/;;) {}`
  - python:
    - `def f():\n    # only a comment\n    pass`
    - `if x:\n    a\n# c\nb` (Review Focus 5: assert read → render is byte-exact
      and record which owner tree-sitter gives the comment in the test name)
- [ ] **Step 2: Run them.** Expected: PASS after Tasks 1–7. A failure is a bug
  in an earlier task: fix it there.
- [ ] **Step 3: Full gates.** Validate rows tighten or hold, and the trivia row
  tightens. Suite, cargo, type-check, both examples type-checks.
- [ ] **Step 4: Tighten the trivia-row ceiling to the measured values and
  commit.**

## Execution

The tasks depend on each other's interfaces in order (facts → reader → wrap →
runtime → types → render → probes). Run them in sequence on one branch, stacked
on the alias-identity stage once its PR is open. Each task's commit goes to
brainstorm for review before the next starts.
