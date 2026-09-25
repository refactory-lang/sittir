# Grammar bootstrap — follow-ups

Core defects and hazards found while bootstrapping `scm` and `regex`. Each
is worked around in the grammar packages today; none is fixed in codegen.

## 1. wire's base parameter is optional but semantically required

`wire(cfg, base?)` accepts a missing base, yet without it wire silently
skips its base-dependent passes: no passthrough callbacks for base rules,
no enrich-clause inline registration, no body-pattern group replacement
over base rules, and no adoption of enrich-minted groups. Patches that
write through an enrich group-lift then land only in sittir's IR and never
reach the parser, so the two pipelines disagree with no error.

- Shape that hit it: `grammar(enrichedBase, wire({...patches}))`, with the
  base omitted from `wire`.
- Guard today: `packages/tools/tests/bootstrap-templates.test.ts` pins the
  `wire({...}, enrichedBase)` composition for the bootstrap template and
  every grammar on disk.
- Fix direction: make the base required, or fold the composition into a
  single `sittirGrammar(base, cfg)` entry point. That entry point also lets
  enrich see the authored config, so wire's `adoptMintedGroups` bridge can go
  (enrich declines a mint an authored `groups:` pattern covers). At the very
  least, raise a wire-time error when patches are present and the base is
  absent.

## 2. A choice whose arms share a slot lowers to non-exclusive tests

Minimal shape (scm `named_node`, upstream):

```js
optional(seq(optional('.'), choice(repeat1(X), seq(repeat(X), seq(X, '.')))))
```

Enrich lifts it to the visible `named_node_group` and field-wraps both
repeats with the same enriched field:

```text
seq(choice('.', blank), choice(
  FIELD named_node_expressions REPEAT1(X),
  seq(FIELD named_node_expressions REPEAT(X), seq(X, '.'))))
```

The arms are exclusive in the grammar, but render-body lowering turns the
choice into two sequential tests keyed on slot presence, not on the arm:

```text
if (named_node_expressions) { slot named_node_expressions }
if (content) { slot named_node_expressions; if (content) { slot content }; "." }
```

Both tests can hold at once, so the TemplateEmitter duplicate-slot guard
fires (correctly). Assemble's earlier `unclassifiable-shape` warning on the
kind is the same shape seen from the other side.

- Reproduce: remove the `named_node_group` patches from
  `packages/scm/grammar.sittir.ts` and regenerate scm.
- Workaround in scm: `variant('children')` / `variant('anchored_last')` on
  the two arms plus `field('last')` on the trailing `X`.
- Fix direction: choice lowering needs an arm discriminator whenever two
  arms carry the same slot. Until then, a blocking `shared-slot-choice`
  diagnostic at assemble (kind, slot, arm paths, proposing `variant()` on
  each arm) would replace the late emitter error.

## 3. Variant arms without a distinguishing field emit mismatched transport types

With only the two `variant()` patches on scm's `named_node_group` (no
`field('last')`), the native crate fails to compile:

```text
error[E0308]: mismatched types
  --> rust/crates/sittir-scm/src/render/transport.rs
   expected `Vec<SlotValue<NamedNodeGroupContentTransportSlot, false>>`, found `SlotValue<_, _>`
```

The trailing unfielded `X` in the anchored-last arm is one `content` value,
while the emitted `content` transport slot type is a `Vec`. The cause of the
arity disagreement hasn't been traced. The shipped grammar avoids it with
`field('last')`, which takes `X` out of `content`.

- Reproduce: drop `'1/1/1/0': field('last')` from
  `packages/scm/grammar.sittir.ts`, regenerate scm, then run
  `cargo check --workspace`.
- Fix direction: the slot's transport type has to take its arity per arm
  (or the slot has to split per arm) when variant arms give it different
  multiplicities; alternatively, assemble should reject the shape with a
  diagnostic before the crate is emitted.
