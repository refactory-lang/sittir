# Retiring enrich's skip list

> **Status:** Landed (2026-09-07) on `feat/punctuation-seams`: classes A,
> B and C, and `EnrichConfig.skip` is deleted. Follows the choice-separator
> spacing design; independent of it in mechanism.

## Problem

`enrich(base, { skip: [...] })` exempts a kind by name from every enrich
pass. The three grammars carry twelve entries, each recorded as a
workaround for exactly one pass:

| grammar | entries | pass that misbehaves |
| --- | --- | --- |
| typescript | `object`, `object_pattern`, `array`, `array_pattern`, `arguments`, `lexical_declaration`, `variable_declaration` | element-field mint vs a later override fielding the same span |
| typescript | `_enum_body_elements` | element-field mint over a choice with a fielded arm |
| rust | `tuple_type`, `trait_bounds`, `function_modifiers` | element-field mint vs a later override fielding the same position |
| python | `string_content` | node-choice field wrap moves the walker off the verbatim-text fallback |

The exemption is coarser than the fault: a skipped kind also keeps its raw
list spelling, so `_enum_body_elements` never becomes a canonical
`repeat{sep}` and `spaceRenderRules` finds no gap in it. That is why an
enum body cannot be laid out one member per line while every other
comma-separated body can. The list is also invisible from the grammar's
rules: a reader sees a name, not the fact that makes a pass wrong, and
every new grammar grows its own list by bisection.

## Decision

Each of the three faults gets an answer stated on the rule shape, and
`EnrichConfig.skip` is deleted.

### A. An override that fields a span enrich already fielded

Enrich runs before wire and cannot see overrides. When a positional patch
(`1: field('properties')`), a path patch (`'(_type)': field('type')`) or a
wildcard patch (`_: field('modifier')`) fields a span whose subtree
carries the uniform element field set enrich minted, the result nests one
field in another and tree-sitter keeps the innermost, so the override's
slot reads empty.

The transform already has the rule for the positional case: when an
override names a span that carries a uniform sibling field set, it
relabels every occurrence in place instead of wrapping
(`resolveFieldPlaceholder`). The typescript entries and `trait_bounds`
predate it. The work is to confirm, one entry at a time, that the relabel
now covers each collision, and to extend it to the path and wildcard
override forms where it does not. The outer name always wins: it is the
name the grammar author chose for the slot.

Two shapes the relabel did not cover surfaced under the gates and are
answered where each fact is created:

- A wildcard override (`function_modifiers: { _: field('modifier') }`)
  descends through the field enrich minted over the whole span and lands
  on its content, so the transform rebuilt the minted field around the
  override's — the nested collision itself. A field rebuilt around a field
  now yields to the inner one (`reconstructWrapper`); the author's name is
  the slot.
- A list whose element may be absent (typescript's `array`, `object`,
  `arguments` and their pattern twins: `commaSep(optional(...))`) cannot
  take a per-element field: the field marks only the elements that are
  present, and the holes of `[, a, , b]` are visible only as consecutive
  separators. The element mint declines on such an element
  (`matchesEmpty`), the span stays unfielded, and the override's field over
  the whole span keeps the separators as field children — the shape the
  read counts holes from. The corpus case `Array with empty elements` is
  the gate that found it.

Retiring `tuple_type` was a no-op: its override extracts the list into a
fully fielded `_tuple_type_elements` rule, so the mint has nothing to
field. `trait_bounds` and the typescript declarations take the positional
relabel: the field moves from the span onto each element and the separator
leaves it. `function_modifiers`' literal arms take the keyword promotion
every other rule gets (`_kw_async` and friends are minted); its factory
signature is unchanged.

Rust's skip comment also recorded three kinds (`_where_predicates`,
`_closure_parameters_optional1`, `_use_clauses`) that regressed when
enabled and were never diagnosed; they are not in the list today, so the
comment states a constraint that no longer exists and is removed with the
list.

### B. A list element that is a choice with a fielded arm

`_enum_body_elements`'s element is `choice(field('name', _property_name),
enum_assignment)`. A uniform `element` field over that choice would nest
over the `name` arm, and read-time routing by the arm's own field would
lose it. The skip conflates two things the mint does: the flat list
spelling, which every list needs, and the element fielding, which this
one cannot take.

They separate. The flat spelling (`separatedListBodyInfo`) applies to
every list unconditionally. The element mint (`fieldSeparatedListElements`)
declines, by shape, when any arm of the element already carries a field,
leaving the arms to route as they do today. The list then has the
canonical shape, `spaceRenderRules` gives it its separator gap, and
`enum_body` can declare `lbrace_after: indent` with a `newline` after each
comma like a rust enum body.

Landing it surfaced a second reason the list had no gap, unrelated to the
skip: `admitsNoExtras` treated a choice element with any token-kind arm
(an enum member may be a `number`) as gluing the whole repeat. A separated
repeat now admits whitespace unless the rule itself or its separator token
is tokenized or immediate; the unseparated case (string and template
fragments) keeps the any-arm rule.

### C. A kind whose content is verbatim text

Python's `string_content` once rendered its runs through the `$TEXT`
fallback because the plain-text runs between escapes were not children,
and fielding its choice would have flipped the walker onto
join-the-elements rendering. The fact is already stated on the rule: the
override rewrites `string_content` wholesale, aliasing the text runs
visible (`string_fragment`, `not_escape_sequence`) so the read captures
them as leaf nodes. The rewrite replaces whatever enrich produced, so the
entry was inert — the evaluated grammar is byte-identical with it gone —
and no verbatim role is needed. The name-keyed exemption goes.

### Then the list goes

With A, B and C stated on shapes, `EnrichConfig.skip`, the module-level
`separatedListEnrichSkip`, and the mint-candidate skip check are deleted,
and a grammar that needs an exemption must say which fact makes the pass
wrong.

## Blast radius

- Typescript `object`, `array`, `arguments` and their pattern twins keep
  their parser rule and surface exactly (the mint declines on their
  absent-admitting element); the declarations keep their slot with the
  field on each declarator, so `,` leaves the field's child types.
- `_enum_body_elements` gains two separator spacing sites and their
  `Options` keys; `enum_body` gains the indentation defaults. Factory-built
  enums change layout, which the byte gate must show as the only
  difference.
- Rust `tuple_type` and python `string_content` are byte-identical at
  every layer. `trait_bounds` moves its field onto each element (`+`
  leaves it); `function_modifiers` keeps its slot name and factory and
  gains the `_kw_*` keyword kinds, renumbering rust's kind ids. Every
  validation floor and the six dogfood renders are unchanged throughout.
- Hoisting typescript's whole-span fielded lists into `*_elements` kinds
  the way rust's are is a separate surface decision and not part of this.

## Verification

Per entry: remove it, regenerate the grammar, run the byte gate and
`validate counts`, and read the transport of the affected kind. A count or
a render that moves is preserved for review. Then the unit tests for A
(relabel through path and wildcard overrides), B (mint declines on a
fielded arm; flat spelling still applies), and C (the verbatim role
switches the walker's fallback), and finally the deletion of the config
key with its consumers.
