# Factory ergonomics — minor enhancements

**Status:** Design. Collects the small construction-surface items that the
loose-surface contract (`docs/factory-surface-issues.md`, "The contract")
pushed outside itself: each is a declaration or a signature convention on
both surfaces, not a coercion. Each item stands alone; they share this page
because none is large enough for its own.

---

## 1. A visible wrapper seats on its parent

### Problem

`match_arm.pattern` holds `match_pattern`, a wrapper whose own `pattern`
slot admits the nineteen members of `_pattern` and whose `condition` is
optional. A caller who already knows the inner kind spells the wrapper by
hand on both surfaces:

```ts
ir.matchArm({ pattern: { pattern: { kind: 'struct_pattern', … } }, value })   // today
ir.matchArm({ pattern: { kind: 'struct_pattern', … }, value })                 // rejected
```

This is not a coercion gap. The value is already kind-identified and the
slot has one kind, so no rule of the loose contract applies; and the wrapper
is not `forwarded` — it has two slots, and its required one targets a hidden
supertype with no factory — so the strict factory's target overload does not
reach it either.

### Decision

The wrapper is **spliced onto its parent**: `match_pattern`'s keys become
`match_arm`'s keys, exactly as a hoisted group's do (group seating, shape 2),
and the mount route builds the wrapper.

```ts
ir.matchArm({ pattern: { kind: 'struct_pattern', … }, condition, value })
ir.matchArm.strict({ pattern: ir.structPattern.strict(…), value })
```

With the seat in place every rule of the loose contract applies at the
parent: `pattern: { kind: … }` is rule 3 against `_pattern`; a bare string
there hoists into `_pattern`'s declared default arm (rule 6); `condition`
rides along as an optional key. `last_match_arm` seats the same wrapper the
same way.

The seat is declared, never inferred: the grammar file names the wrapper
as spliced at that slot, with the same stamp a hidden group carries. What
this admits for the first time is a splice seat on a **visible** child
that is not a choice arm — today a visible child is merge-seated only
through `variant()` on a choice position (`ir.closureExpression.block`),
and every spliced group is sittir-minted and hidden. The node stays in the
tree and in the wrap; only the surface flattens. The read side's
projection (`nodeToConfig`) follows the seat as it does for a group.

### Verification

- `ir.matchArm({ pattern: { kind: 'struct_pattern', … }, value })` and its
  strict spelling build and render `T{a}=>{}`; the hand-spelled wrapper
  form still builds (the wrapper's own factory is untouched).
- `ir-render-parse` stays clean on rust; `factory-render-parse` unchanged.
- The generated rebuild of `examples/17-dogfood-rust.ts` spells its arms
  without the inner `pattern:` key.
- `node-model.json5` records the seat as `splice` on both parents.

---

## 2. A list slot takes its elements bare, one or many

### Problem

A separated-list wrapper is called `(options?, ...elements)`: the options
object first, the elements a spread. On the loose surface that shape does
not reach a parent's config: a list-envelope slot wants the built envelope,
and an array given there was, until the loose contract's rule 4, stored as
its first text. A single element still has to be wrapped in an array or
built by hand:

```ts
ir.genericType({ type: 'Vec', typeArguments: ['Edit'] })     // rule 4: builds the envelope
ir.genericType({ type: 'Vec', typeArguments: 'Edit' })       // rejected
ir.enumVariant({ name: 'V', body: ir.fieldDeclaration(…) })  // rejected
```

### Decision

**The options object stays first, and it is optional.** First, so the
elements remain a rest parameter and a spread; optional, because every
default a list needs — delimiter, separator — is declared in the grammar's
`options:` block and stamped by the factory when the caller gives none
(`declaredDelimiterDefault`). A trailing options object is not a spelling:
it would end the spread, and the position would carry no information the
grammar does not already hold.

**Because the options object is optional, a list slot's elements hoist to
the parent's config as `T | T[]`.** In a loose config, the value at a
list-envelope slot is one of:

- an **array** — the elements, one envelope entry per item, each coerced
  recursively (rule 4 as it stands);
- a **single non-array value** — one element, the same as `[value]`;
- the **built envelope** — passes through.

An object at a list slot is one element's config, never the envelope's:
an envelope has no config form (strict row S1), so there is nothing to
confuse it with. The runtime is the existing `_wrapArray`; the single case
is `_wrapArray(kind, [value])`. The loose `Config` type's slot admits the
union, and the strict wrapper's signature is unchanged.

### Verification

- `typeArguments: 'Edit'`, `typeArguments: ['Edit']` and
  `typeArguments: ir.typeArguments.strict(…)` build the same node and
  render `<Edit>`; `body: ir.fieldDeclaration(…)` builds the field list.
- A type-level test pins the loose slot type as `T | T[] | Envelope` for a
  list-envelope slot and rejects a trailing options object on the wrapper.
- `examples/17-dogfood-rust.ts` spells its single-element lists bare.
- `factory-render-parse` counts unchanged.
