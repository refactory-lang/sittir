# Slot kind-sets census

Counts the vocabulary's slot declarations by the union each one spells, and groups the unions by the kind-set they spell. It grounds the bindings and vocabulary spec's §4.5, where a slot is typed by a named kind-set instead of a union written out in the slot.

## Run

From the root of a checkout, with an output folder of your own:

```bash
out=$(mktemp -d)
probe=docs/superpowers/probes/2026-11-21-slot-kind-sets
node $probe/slots.cjs packages/types/src/vocabulary $out/slots.json
node $probe/owners.cjs packages/types/src/vocabulary $out/owners.json
node $probe/classify.cjs $out/slots.json $out/owners.json > $out/kindsets.txt
```

`results/kindsets.txt` is that output on master at 6df9c4159.

## What each script reads

- `slots.cjs` reads every `Slot<G, K, 'name', D>` in the base files and the feature stubs, leaving out the generated `augment.ts` and `features/index.ts`. For each one it records the path that owns it (the nearest `Under<'path'>` before it), the slot's name, whether it is a list, and the arms of `D`. It prints the totals.
- `owners.cjs` maps each path to the folder whose stub declares it with a `$path`, `base` or a feature's folder: the feature that adds the kind (§4.1). A stub that only adds members to a kind does not own it.
- `classify.cjs` puts each slot with two or more arms in a group by the levels its union holds, the first rule that matches:
  - statement: `Statement.Any` with `Declaration.Any`, or a `statements` or `members` slot holding `Statement.Any`. Base arms: `Statement.Any`, `Declaration.Any`, `Expression.Any`, `Identifier.Any`, `Literal.Any`.
  - type: `Type.Any` without `Expression.Any`. Base arms: `Type.Any`, `Identifier.Any`.
  - pattern, in the `pattern` namespace: `Pattern.Any`. Base arms: `Pattern.Any`, `Identifier.Any`, `Expression.Any`, `Literal.Any`.
  - expression: `Expression.Any`. Base arms: `Expression.Any`, `Identifier.Any`, `Literal.Any`.
  - pattern, elsewhere: `Pattern.Any`. Base arms: `Pattern.Any`, `Identifier.Any`.
  - identifier: `Identifier.Any`. Base arm: `Identifier.Any`.
  - one level: every arm under one level.
  - exception: anything else, listed one slot per line.

  For each group it prints the slots and distinct unions it holds, then each arm beyond the base arms with the number of slots that hold it and the arm's owner.

## Results, master at 6df9c4159

631 slot declarations. 230 name one level, one kind or text. 401 spell a union of two or more arms, 131 distinct.

| group | slots | distinct unions |
| --- | --- | --- |
| expression | 158 | 49 |
| type | 84 | 16 |
| identifier | 36 | 24 |
| statement | 26 | 6 |
| pattern | 15 | 8 |
| one level's kinds | 50 | 20, over 16 levels |
| exception | 32 | 9 |

The groups' distinct unions add to 132, one more than 131: `Expression | Identifier | Literal | Pattern` counts in the pattern group at `pattern.struct.fields` and in the expression group at slots outside the `pattern` namespace (`statement.assert.expressions`, the comprehension clauses).

The arms most often added to a group's base are a feature's kinds: the macro call (`syntactic-metaprogramming`) in 34 type slots, a removed bound (`?Sized`, `where-clauses`) in 34, a higher-ranked bound in 7.

## Reading the groups

- A group is the levels a union holds, not what its slot means. The statement group holds the interface, trait and class bodies, which the spec types by the member kind-set, beside the statement lists and module bodies.
- The identifier group is mostly sets particular to one construct: a name that may be a string literal (export and import names), a property that may be a tuple index, a macro's token stream. Together with the exceptions they are the 68 sets the spec leaves spelled in their slots.
- An arm whose owner prints `?` is not declared as an interface with a `$path`: `Type.Primitive`, `Statement.Empty`, and one gated `null`. They weren't followed further.
