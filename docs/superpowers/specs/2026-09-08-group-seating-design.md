# Groups seat on their parent

> **Status:** Design (2026-09-08). Follows the strict-rebuild design, whose
> generated rebuilds measure the gap this closes: the parent-factory row and
> the no-argument form row in `docs/factory-surface-issues.md`.

## Problem

A group is a hidden sequence that binds co-optional slots to one another:
`optional(seq('(', field('parameter', …), optional(field('type', …)), ')'))`
in a catch clause, `repeat1(seq(field('operators', …), field('primary_expression', …)))`
in a comparison, the three arms of a `for` header. The parser needs it as a
rule; the author of an override mints or names it to give the parse tree
enough structure. Neither of those is a reason for a user of the factories
to see it: the intent of a group is "these slots come and go together", and
the honest surface for that is the parent's config, narrowed by types.

Groups reach the model by four routes and the model treats them by a fifth
fact that none of the routes state:

| Route | Example | Who authored it |
|---|---|---|
| `variant()` in the override lifts a choice arm into `_<parent>_<variant>` | `_for_header_let_const_kind` | us |
| `groups:` in the override mints a named hidden rule | `_comparison_operator_comparator` | us |
| enrich's clause hoist mints `_<parent>_group<n>` | `_catch_clause_group` | enrich |
| the upstream grammar's own hidden sequences | `_key_value_pattern`, `_type_query_*` | tree-sitter |

Link decides which of these are "a form of the parent" by `hasAnyField`: a
hidden SEQ containing a `field()` anywhere is added to `hoistedKinds`, one
without is left as an ordinary kind. The declaration plays no part. So the
same `groups:` surface lands on two different generated surfaces:
`type_argument`, `attributed_parameter`, `visibility_modifier_in_path` and
`yield_from_clause` carry no field and are ordinary kinds with a flat `ir`
entry, while `match_block_arms`, `attributed_ordered_field` and
`comparison_operator_comparator` carry one and are hoisted.

Hoisted kinds are correctly kept off the flat `ir`. Their only path to a
user is the polymorph overlay, which mounts an arm on the parent's namespace
as a sub-factory. That derivation fires only for a parent with exactly one
single-valued choice slot, a forwarded target, or a lone enum choice, so a
parent with a second choice slot (`for_in_statement` has the in-or-of
operator, `export_statement` has several) or a repeated seat gets nothing:

| Grammar | hoisted | mounted | unmounted, builder exists |
|---|---|---|---|
| rust | 33 | 30 | 3 |
| typescript | 40 | 29 | 11 |
| python | 8 | 6 | 2 |

And a config-shaped parent handed an inline object in a group's seat passes
it through unbuilt (`const _content = config.content;`) while typing the seat
as the group's Built, so the strict rebuilds spell the intended surface and
fail both the type-check and the transport (`Missing field _operators`).
Only the forwarded parent (`buildMatchBlock`) builds its group from a config.

## Decision

### The hoisted stamp is declared, never inferred

`hasAnyField` is retired. Every route that creates a group stamps
`annotations.hoisted` on the rule it creates: the variant lift in the
transform, the `groups:` mint and the clause-hoist mint in enrich, and the
group lift in link. The annotation is the only representation of the fact:
there is no `hoistedKinds` set and no model flag. `withKindFacts` carries a
rule's whole annotations bag across every root rebuild, and each reader
takes the fact off the rule it holds — normalize's inline gate,
`resolveGroupOrMultiInlineTarget`, `classifyNode`'s list peel, the overlays,
the surface exclusions in bundle / `ir` / `is` / consts / generated tests,
and the node model, which serializes `annotations` for the tools. A base
emitter never branches on hoisting: a hoisted kind keeps its class, its shape
and its builder, and the overlay passes what that builder produces — a built
compound, a kind id, verbatim text — through the parent's builder.

A hidden rule that no sittir route minted carries no stamp and is an
ordinary hidden rule: the upstream grammar's own hidden sequences
(`_number`, the `_type_query_*` rules, `_key_value_pattern`) and an authored
hidden rule that a parent merely aliases (`_impl_item_positive_clause`,
`_extends_clause_single`, `_except_clause_as`). Normalize splices a single-use
one into its parent; a multi-use one is a kind of its own. Neither class gets
a `patches` entry to keep the seat the heuristic gave it; where an author
wants a seat, the `group()` verb in `patches` declares it (`'.'` is the rule
itself) and lowers to the same annotation.

A variant arm is a mint, so it is hoisted whether or not its body has a
`field()`. Hoisting never changes a kind's class: an arm whose body is all
text (`_struct_item_unit` is `;`, `_line_comment_regular_dslash` is two
patterns) stays the token or pattern leaf it already is, with no keys to
seat; its seat is the parent's slot, where it is a kind-id or verbatim-text
value, exactly as the model already holds it. The parse node has no
children, so there is no slot to read from it. Only a slot-bearing hoisted
body is a compound. A hoisted compound with a multiple sole slot is spread-
shaped like any other: rust's token trees, typescript's string forms and
python's `_except_clause_list` / `_match_block_block` take their elements as
arguments (`ir.delimTokenTree.paren.strict(a, TSKindId.Comma, b)`).

An enrich mint's name never reaches the surface (its keys do), so the
`_<parent>_group<n>` spelling only ever appears in diagnostics. Where an
authored name is wanted the `group()` entry carries it.

### Shape 1 — choice arms: a sub-factory is the parent's overload projected down

The mechanism exists and is right. The generated seating for a config-shaped
arm already takes the parent's config minus the seat with the arm's keys
spliced in, partitions by the arm's declared keys, builds the arm and seats
it:

```ts
(config: OmitEach<ArgsOf<PF>[0], 'content'> & ArgsOf<CF>[0]): ReturnType<PF> =>
	_p(parent)({ ...rest, content: _c(child)(inner) })
```

That parameter type is one overload of the parent, and the sub-factory is
that overload with the arm fixed by its name. The parent's own call keeps
taking the built arm; it gains no overloads and no prebuilt detection, so
each arm has exactly one runtime pathway. A direct-shaped arm keeps taking
its arguments under the seat key, since it has no keys to splice.

What changes is the derivation gate in `subFactoriesOf`: a hoisted kind in
any single-valued slot of the parent mounts under its arm name, regardless
of how many other choice slots the parent has. The arm name is the variant
annotation when there is one and the parent-prefix-stripped kind otherwise,
exactly as `kindArmName` derives it today. A key collision between the arm
and the parent stays the existing `slot-collision` diagnostic.

This mounts the eleven unmounted arms: rust `range_pattern` left_with_right;
typescript `export_statement` default_clause_from, default_kw,
default_ns_from, default_star_from, default_value, `extends_clause` single,
`for_header` var_kind and let_const_kind, `type_query` call and member in
type annotation.

### Shape 2 — an optional group splices onto the parent

A group that occurs at most once in its seat has no name worth exposing. Its
keys become keys of the parent's config, and the parent's factory carries
two overloads per group, both keys or neither (per arm, when the group has
arms). The overlay partitions the parent's keys, builds the group into the
seat when its keys are present and leaves the seat empty otherwise. The
co-optional binding is a type fact; nothing is checked at runtime.

A mandatory single group is the degenerate case with one overload. Today's
forwarded parent already accepts the group's Config that way
(`buildMatchBlock(config: MatchBlockArms.Config)`), emitted by the base
factories from the forwarding shape; that overload is this seating, derived
from the hoisted fact instead, and emitted where the rest of it is.

Kinds: typescript `_catch_clause_group`; rust `_match_block_arms`; and, once
the four field-less declared groups carry the stamp, `_visibility_modifier_pub`,
`_visibility_modifier_in_path` and `_yield_from_clause` as arms of their
parents' choices (shape 1) rather than kinds of their own.

### Shape 3 — a repeated group is an array of its configs

A group under `repeat` cannot splice. The parent's list slot takes an array
of the group's flattened config objects, the overlay builds each element,
and the parent's Built keeps the group's Built in the slot:

```ts
ir.comparisonOperator({
	left: ir.identifier("x"),
	comparators: [{ operators: TSKindId.EqEq, primaryExpression: ir.identifier("y") }]
})
```

Kinds: python `_comparison_operator_comparator` and `_key_value_pattern`,
rust `_attributed_ordered_field`, and the elements `type_argument` and
`attributed_parameter` once they carry the stamp.

### All of it is overlay logic

Every seating above is decided by provenance: a kind is hoisted because a
route stamped it so, an arm is named because a variant annotation names it.
Annotation-driven surface is what the overlay layer is for, so all three
shapes are emitted by the overlays and nothing else moves. The base factory
of a parent keeps its raw signature, its seat typed as the group's Built;
the overlay wraps it with the widened surface, as it already wraps a parent
that has sub-factories, and `ir` binds the overlaid parent. The forwarded
wrapper's config-argument overload in the base factories is the one
pre-existing piece of group seating outside the overlays; it moves in, so
one emitter owns the seating.

No group is on the flat `ir`. No `$type` marker and no prebuilt detection
exist for a group: the overlay always builds from keys. The fact it reads,
"this slot's kind is a hoisted node with these slots", is already in the
model (a slot's `kinds` and the node's `hoisted` and slot list); the shape
and the arm name are what the overlay derives from it.

### The node model and the example emitter follow

The tools do not re-derive that. The serialized node model
(`packages/<g>/src/node-model.json5`) carries, per slot value that is a
hoisted kind, what the overlay decided: the seating shape (`arm`, `splice`
or `elements`) and, for an arm, the mount name. Its readers consume the
stamp:

- the validators' `nodeToConfig` splices the read's group child into the
  parent's config for a spliced seat, keeps it as an inline object for an
  element seat, and leaves an arm seat to the dispatcher, which builds it
  through the mount;
- the factory source emitter prints the sub-factory call for an arm, the
  spliced keys for a spliced seat, and the inline objects for an element
  seat, so `pnpm run gen:examples` rebuilds the three dogfood targets in the
  new spelling and the ceiling and the package `examples-verify` rows move
  with them.

The printing factory map in the emitter already resolves a mount through
`printingFactoryMap`; it gains the two other seatings and loses its special
case for a hoisted non-form kind, which the element seat replaces.

## Blast radius

- `packages/codegen/src/compiler/link.ts`: `classifyHiddenRule` loses the
  `hasAnyField` branch; `hoistedKinds` is collected from the annotation.
- `packages/codegen/src/dsl/transform/transform.ts` (variant lift),
  `packages/codegen/src/dsl/enrich.ts` (`groups:` mint, clause-hoist mint):
  stamp `annotations.hoisted`. New `group()` primitive under
  `packages/codegen/src/dsl/primitives/` and its `patches` lowering.
- `packages/codegen/src/emitters/overlays/sub-factories.ts`: the derivation
  gate. `packages/codegen/src/emitters/overlays/polymorphs.ts`: the shape 2
  and shape 3 seatings and the forwarded parent's config-argument overload,
  which leaves `factories.ts`. `ir.ts` binds the overlaid parent where it
  does not already. The base factories, `types.ts` and the factory map are
  untouched.
- `packages/codegen/src/emitters/node-model.ts`: the seating shape and mount
  name per hoisted slot value, serialized from the overlay's derivation.
- `packages/tools/src/validate/common.ts` (`nodeToConfig` by seating shape),
  `packages/tools/src/emit/factory-source.ts` (the three spellings), the
  generated examples, their ceiling and the package `examples-verify` rows.
- Overrides: none. Surface change for the field-less declared groups: `ir.typeArgument`,
  `ir.attributedParameter`, `ir.visibilityModifierPub`,
  `ir.visibilityModifierInPath`, `ir.yieldFromClause` leave `ir`; their
  callers in examples and tests move to the parent.
- All three generated packages, the generated examples and their ceiling,
  the glossary entries for `LinkedGrammar.hoistedKinds`,
  `classifyHiddenRule`, `NodeEnrichment`, `AbstractAssembledCompound.hoisted`
  and the sub-factory derivation.

## Verification

- `sittir validate counts` unchanged for all three grammars, compared as
  numbers; parity fixtures identical. The stamp change alone must move
  nothing: every kind hoisted by the heuristic today is hoisted by an
  annotation or an override entry afterwards, checked by diffing the
  hoisted set before and after.
- The hoisted census: unmounted-and-unseated is 0 / 0 / 0.
- `pnpm run gen:examples` and the ceiling: the rebuilds are regenerated
  from the seating stamps, the type-error counts only fall, and the three
  package `examples-verify` rows that name the parent-factory gap flip from
  expected-fail to pass. The emit tests pin one printed example per seating
  shape.
- The `ir` builder ratchets are re-baselined once, with the five rust and
  one python entries that leave the flat surface accounted for by name.
- Targeted probes: `ir.forInStatement.letConstKind(…)`, a catch clause with
  and without its parameter, the python comparison above, each rendered and
  re-parsed to the source tree.
