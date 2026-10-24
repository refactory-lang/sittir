# Regex Overrides Glossary

Per-rule reference for `packages/regex/grammar.sittir.ts`: every override
significant enough to need explanation, and every place the generated tree
differs from upstream `tree-sitter-regex`.

---

### `grammar(enrich(base), wire({…}))` (`packages/regex/grammar.sittir.ts:12`)

`export default grammar(enrich(base), wire({…}))` is one layer in the stock
shape. `grammar` is the runtime's own; `enrich(base)` is the pending base and
`wire({…})` the options. The runtime hands the pending base's externals to the
options' `externals` callback, where the layer pass enriches the upstream base
with the config's authored inputs (its `groups:` patterns visible, so enrich
declines any group a pattern covers), completes the pending base and
evaluates the config against it. The two halves meet only there, so the base
wire sees and the base tree-sitter compiles cannot drift apart.

### `class_range` (`packages/regex/grammar.sittir.ts:17`)

Upstream `class_range` is `seq(bound, '-', bound)` with both bounds drawn from
the same choice, so the two bounds would share one unnamed slot. `start` and
`end` give each bound its own addressable slot.

### `term` (`packages/regex/grammar.sittir.ts:18`)

Upstream `term` is `repeat1(seq(atom, optional(quantifier)))`. The patch
names the quantifier position `quantifier`.

**Tree shape differs from upstream.** Enrich lifts the repeated two-slot
element into a visible `term_group` node, so `term` holds one `term_group`
per atom, and each group holds the atom and its optional `quantifier`.
Without the group, the atoms and quantifiers would become two parallel
arrays that lose which quantifier applies to which atom. Upstream parses
put the atoms and quantifiers directly under `term`, so a query written
against upstream, such as `(term (pattern_character) (zero_or_more))`, has
to go through `term_group` here:
`(term (term_group (pattern_character) quantifier: (zero_or_more)))`.

### `inline_flags_group` (`packages/regex/grammar.sittir.ts:19`)

Upstream spells the flag section as `choice(flags, seq(flags, '-', flags),
seq('-', flags))`: enable only, toggle (enable then disable), or disable
only. The first patch names each `flags` position by what it does
(`enabled` / `disabled`); the second names the three arms as variants
`enable`, `toggle` and `disable`, so each form has its own factory with
exactly the slots it takes.
