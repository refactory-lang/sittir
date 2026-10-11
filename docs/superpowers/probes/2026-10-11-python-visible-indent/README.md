# Python visible `indent` / `dedent`

Question: should python's scanner externals `_indent` / `_dedent` (kind ids 116 / 117, two use sites
each in `grammar.json`) become visible named kinds `indent` / `dedent`, zero-width nodes in the
parse tree? Data and render are meant not to change either way.

Measured on `feat/bindings` at cc9bbfe3c (a detached worktree, python regenerated and validated
with `sittir gen --grammar python --all` and `sittir validate counts python`).

## The change

One entry in `packages/python/grammar.sittir.ts`, after `externals`:

```ts
visibleExternals: (_$) => ({
	_indent: indent(),
	_dedent: dedent()
}),
```

`visibleExternals` rewrites each reference to the external into an `ALIAS(named: true)` of the
visible (underscore-trimmed) name, so the two use sites per external become `indent` / `dedent`.
The body must be the existing `indent()` / `dedent()` builders (the depth text enrich mints for
rust and typescript). A plain `string('')` body is a different measurement, listed as variant A
below.

## Results (variant B: `indent()` / `dedent()` bodies)

1. Parser and node types.

   | | base | after |
   | --- | --- | --- |
   | `STATE_COUNT` / `LARGE_STATE_COUNT` | 2316 / 328 | 2316 / 328 |
   | `SYMBOL_COUNT` / `TOKEN_COUNT` / `EXTERNAL_TOKEN_COUNT` | 334 / 127 / 17 | 334 / 127 / 17 |
   | `ALIAS_COUNT` / `FIELD_COUNT` / `PRODUCTION_ID_COUNT` | 5 / 65 / 172 | 5 / 65 / 172 |
   | `parser.c` bytes | 3216190 | 3216186 |
   | `node-types.json` bytes | 89587 | 90171 |

   `parser.c` changes four lines: the two symbol names (`_indent` → `indent`, `_dedent` → `dedent`)
   and their two `.visible` flags. `node-types.json` gains two named kinds without fields, and
   `children` on three kinds: `block` (`dedent`), `suite_block` (`block`, `indent`; `multiple` flips
   to true), `match_block_block` (`dedent`, `indent`; `multiple` false → true).

2. Claims (`claims.py`, `trees.mts`).

   Nine occurrences of the three changed parents in `bindings.scm`; four sit under a `.` anchor
   (lines 10 and 12, `block . (simple_statements …)`). The anchor stays first-named-child of
   `block` (`dedent` is last), and `indent` is a child of `suite_block`, which no claim anchors.
   No claim changes. Run on the 807 distinct python render outputs (the fixtures'
   `expectedOutput`): 13,597 captures before, 13,597 after, no capture differs; parse errors 38
   before and after. The new nodes: 400 (181 `indent` in `suite_block`, 181 `dedent` in `block`,
   19 + 19 in `match_block_block`), all zero-width. `grammar.bindings.ts` regenerates byte-identical
   (`sittir tool bindings-inventory --write`; 430 vocabulary kinds, 806 members).

3. Templates. `render-bodies.json` is byte-identical: the `indent` / `dedent` elements are the
   same depth ops (`w.indent()` / `w.dedent()`), so no template changes.

4. Validation, python (native), per lane, base → after: from 180/180, cov 147/147,
   read-render-parse 115/116 (ast-match 115), read-render-parse-shallow 115/116,
   factory-storage 1404/1404, ir-storage 1387/1387, built-render-parse 1284/1284. No lane
   moves. Only python's `grammar.sittir.ts` changes, so no other grammar's source moves
   (rust, typescript, regex and scm were not re-run).

5. Public names. `TSKindId.Indent` / `Dedent`, the `Indent` / `Dedent` types and the `indent` /
   `dedent` type keys exist today (the `role()` calls name them). What moves: the display names
   (`KIND_DISPLAY_NAMES` 116 / 117: `_indent` → `indent`, `_dedent` → `dedent`); `Indent` / `Dedent`
   change from text leaves (`Terminal<…, string>`, `LeafNs`) to keyword kinds (`KeywordNs` with
   the depth text, so `LeafStringMap` gains `'\u{FDD0}\n'` and `'\u{FDD1}\n'`, as rust and
   typescript already have); `ir.indent` / `ir.dedent` appear. No collision: no rule or kind is
   named `indent` or `dedent` today.

Also moved by the change, not by the claims:

- `EmptyMatchBlockBlock` disappears, `match_block_block` has no `inner` trivia accessor
  (`INNER_GAPS` loses its row): a block holding `indent` and `dedent` is never empty.
- `rust/crates/sittir-python/test-fixtures.json`: 2790 entries, the same `(kind, pattern,
  expectedOutput)` set, input payloads renumbered (170 diff lines).
- `packages/python/tests/nodes.test.ts` gains two generated `ir.indent` / `ir.dedent` tests.

## Variant A (a plain `string('')` body)

Rejected by measurement. The same lever with `_indent: string('')` makes the template body keep a
`slot` named `indent` instead of the depth op, and python renders without indentation:
read-render-parse 115 → 93 (ast-match 115 → 78), built-render-parse 1284 → 1230 (ast-match
1284 → 1202).

## Reproduce

```sh
# base outputs: `git show HEAD:…` of grammar.json, node-types.json, parser.wasm
sittir gen --grammar python --all --output packages/python/src
sittir validate counts python
python3 claims.py <base node-types.json> packages/python/.sittir/src/node-types.json packages/python/bindings.scm
tsx trees.mts <base parser.wasm> packages/python/.sittir/parser.wasm packages/python/bindings.scm \
  rust/crates/sittir-python/test-fixtures.json
```
