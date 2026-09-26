# Scm Overrides Glossary

Per-rule reference for `packages/scm/grammar.sittir.ts` (tree-sitter query
language, upstream `tree-sitter-scm`): every override significant enough to
need explanation.

---

### `enrichedBase` (`packages/scm/grammar.sittir.ts:5`)

`enrich(base)` is bound once, and the same enriched grammar goes to both
`grammar()` and `wire()`. Wire's base-dependent passes (body-pattern groups,
the enrich-hoisted clause inline registration, adoption of enrich-minted
groups) only run when wire receives the base, and they must see the
post-enrich shape tree-sitter compiles.

### `externals` / `supertypes` / `visibleExternals` / `_whitespace` (`packages/scm/grammar.sittir.ts:11`)

The structural-whitespace vocabulary every sittir grammar carries: `_tight`,
`_space` and `_newline` are external tokens that render as `''`, `' '` and
`'\n'`, grouped under the `_whitespace` supertype. The renderer uses them
for seams between tokens.

### `_group_expression` / `_named_node_expression` (`packages/scm/grammar.sittir.ts:19`)

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
