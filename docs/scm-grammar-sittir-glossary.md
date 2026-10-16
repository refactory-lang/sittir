# Scm Overrides Glossary

Per-rule reference for `packages/scm/grammar.sittir.ts` (tree-sitter query
language, upstream `tree-sitter-scm`): every override significant enough to
need explanation.

---

### `grammar(enrich(base), wire({…}))` (`packages/scm/grammar.sittir.ts:13`)

`export default grammar(enrich(base), wire({…}))` is one layer in the stock
shape. `grammar` is the runtime's own; `enrich(base)` is the pending base and
`wire({…})` the options. The runtime hands the pending base's externals to the
options' `externals` callback, where the layer pass enriches the upstream base
with the config's authored inputs (its `groups:` patterns visible, so enrich
declines any group a pattern covers), completes the pending base and
evaluates the config against it. The two halves meet only there, so the base
wire sees and the base tree-sitter compiles cannot drift apart.

### `_group_expression` / `_named_node_expression` (`packages/scm/grammar.sittir.ts:18`)

Both are left-recursive anchor chains, `prec.left(seq(expr, '.', expr))`
(the `.` anchor between sibling patterns). The two operands are the same
symbol, so unnamed they would collide on one slot; `left` and `right` give
each side its own.

### `named_node_group` (`packages/scm/grammar.sittir.ts:21`)

Not an upstream rule: enrich lifts the optional child list of `named_node`
into this visible group. Its body is an optional leading `.` anchor followed
by a choice between a plain child list (`repeat1(expr)`) and an anchored-last
list (`repeat(expr)`, then one more `expr` and a trailing `.` anchor). The
variants name the two forms `children` and `anchored_last`, and
`field('last')` names the anchored final child so it doesn't merge with the
repeated children before it.

### `expectDiagnostics` (`packages/scm/grammar.sittir.ts`)

Shape floor (the compiler has no model for this shape yet; it blocks without
its entry):

- `unclassifiable-shape` on `predicate`: a nested seq that is neither a list
  nor a leaf. Resolve with `rule(name, body)` in `edits:` naming the nested
  seq as its own rule.
