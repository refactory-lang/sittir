# Declared supertype stamp: a variant parent the parser shows

**Question.** Link builds a `SUPERTYPE` rule only for a supertype the parser does not show as a
concrete node. A declared supertype that a default alias displays keeps its choice rule, so the
surface has the node the tree has. Python's `_match_block`, declared a supertype and the parent of a
wire variant split, is the one such rule: link names it `match_block` and builds it as a visible
polymorph over its forms `match_block_block` and `match_block_empty`, with no stamp. If link stamped
it `SUPERTYPE` like any other declared supertype, so that the stamp alone named every supertype,
what would move?

**Answer.** Python's reading breaks. A parsed parent node must read as its form before a variant
parent can be a supertype, and today it does not.

- `match_block` turns from a polymorph (one `content` slot over its two forms) into a supertype
  (the two forms as subtypes, no slots).
- The tree still holds a concrete `match_block` node, and nothing reads it now. Reading
  `match_statement` fails on its required `body` slot: "match_statement (kind 153) … has no child
  for its required slot `body`".
- Python's native test fixtures drop from 7680 entries to 5368. 42 corpus inputs are left out:
  `module` 18, `match_statement` 17, `block` 2, `for_statement` 2, `suite_block` 2,
  `_simple_statements` 1.
- The move reaches python's `ir`, `is`, types, factories (raw, coerce, the polymorph overlay), wrap,
  utils, records, render bodies, `node-model.json5` and its portable copy, `nodes.test.ts`, and the
  crate's `render/node.rs`, `render/options.rs` and render hash. No other grammar moves.

So the stamp waits on the polymorph-flattening design
(`docs/superpowers/specs/2026-09-14-polymorph-flattening-design.md`). The `match_block` node is the
parser's own. Enrich renames upstream's `alias($._match_block, $.block)` to the free name
`match_block` (`dsl/rule-transforms.ts::unaliasOverloadedDisplays`), so tree-sitter default-aliases
`_match_block` into a visible node (`.visible = true` in `parser.c`, no alias symbol). That node's
one child is the form, `match_block_block` or `match_block_empty`, and never the default form in
its place.

**Outcome.** The wrapper is `match_block`'s end state, by the design's rule that a parent the parser
shows as a node does not flatten ("Which parents flatten"). Wire now declines a parent whose every
reference carries a named alias, so `_match_block` is no longer listed under `supertypes:`. Every
declared supertype is then stamped, so the join is gone: the compiler's supertype set is the stamp
alone (`compiler/normalize.ts::supertypeKindsOf`), and it matches the parser.

**Method.** A throwaway worktree at master `30a6a7eda`. In `compiler/link.ts::classifyHiddenChoiceRule`
the condition for building a `SupertypeRule` was changed so that a declared supertype no longer
needs `!isShownConcreteKind`:

```ts
// before
!isShownConcreteKind(name, ctx.kindEntries) &&
	((shape === 'supertype' && !isAliasedHiddenStorage(name, ctx.kindEntries)) || supertypes.has(name))
// probe
supertypes.has(name) ||
	(!isShownConcreteKind(name, ctx.kindEntries) && shape === 'supertype' && !isAliasedHiddenStorage(name, ctx.kindEntries))
```

Then `pnpm run regen:all`. The counts come from the regenerated
`rust/crates/sittir-python/test-fixtures.json` and `test-fixtures.left-out.json`, and the model
types from `packages/python/src/node-model.json5`. The worktree was removed after the measurement.
