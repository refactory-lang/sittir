# Regex Overrides Glossary

Per-rule reference for `packages/regex/grammar.sittir.ts`: every override
significant enough to need explanation, and every place the generated tree
differs from upstream `tree-sitter-regex`.

---

### `sittirGrammar(base, …)` (`packages/regex/grammar.sittir.ts:10`)

`export default sittirGrammar(base, {…})` composes the grammar in one call:
enrich runs over the upstream base with the config's authored `groups:`
patterns visible, so it declines any group a pattern covers; wire runs over
that enriched base; `grammar()` receives both. There is no separate enriched
binding to hand to two places, so the base wire sees and the base tree-sitter
compiles cannot drift apart.

### `externals` / `supertypes` / `visibleExternals` / `_whitespace` (`packages/regex/grammar.sittir.ts:11`)

The structural-whitespace vocabulary every sittir grammar carries: `_tight`,
`_space` and `_newline` are external tokens that render as `''`, `' '` and
`'\n'`, grouped under the `_whitespace` supertype. The renderer uses them
for seams between tokens; upstream regex has no externals of its own.

### `class_range` (`packages/regex/grammar.sittir.ts:19`)

Upstream `class_range` is `seq(bound, '-', bound)` with both bounds drawn from
the same choice, so the two bounds would share one unnamed slot. `start` and
`end` give each bound its own addressable slot.

### `term` (`packages/regex/grammar.sittir.ts:20`)

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

### `inline_flags_group` (`packages/regex/grammar.sittir.ts:21`)

Upstream spells the flag section as `choice(flags, seq(flags, '-', flags),
seq('-', flags))`: enable only, toggle (enable then disable), or disable
only. The first patch names each `flags` position by what it does
(`enabled` / `disabled`); the second names the three arms as variants
`enable`, `toggle` and `disable`, so each form has its own factory with
exactly the slots it takes.
