# Retiring enrich's skip list

> **Status:** Design (2026-09-07). Follows the choice-separator spacing
> design; independent of it in mechanism.

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

An entry is retired by removing it, regenerating, and holding the gates.
Rust's skip comment also records three kinds (`_where_predicates`,
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

### C. A kind whose content is verbatim text

Python's `string_content` renders its runs through the `$TEXT` fallback
because the plain-text runs between escapes are not children; fielding its
choice would flip the walker onto join-the-elements rendering and drop the
gaps. The fact that makes the pass wrong is a property of the kind: its
text is not the concatenation of its children. That fact is declared on
the rule (a `role` marking the kind verbatim, the same primitive that
marks indent and newline externals), the walker's fallback decision reads
it, and `applyNodeChoiceFieldWrap` declines on it. The name-keyed
exemption goes.

### Then the list goes

With A, B and C stated on shapes, `EnrichConfig.skip`, the module-level
`separatedListEnrichSkip`, and the mint-candidate skip check are deleted,
and a grammar that needs an exemption must say which fact makes the pass
wrong.

## Blast radius

- Typescript `object`, `array`, `arguments` and the declarations keep
  their surface if the relabel holds: the outer field stays the slot, the
  minted names disappear under it. A surface change here would be a
  finding, not an accepted cost.
- `_enum_body_elements` gains two separator spacing sites and their
  `Options` keys; `enum_body` gains the indentation defaults. Factory-built
  enums change layout, which the byte gate must show as the only
  difference.
- Rust `tuple_type`, `trait_bounds`, `function_modifiers` and python
  `string_content` are expected byte-identical.
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
