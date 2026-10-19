# Modifier exclusions: what one node may not hold

This is the probe behind [the builder exclusions spec](../../specs/2026-10-19-builder-exclusions-design.md). It answers two questions:

1. Across the three grammars, which combinations of one node's own facts does sittir's parser accept, while the language rejects them?
2. Can a builder's types refuse such a combination, and name it in the message?

## Run

```
pnpm exec tsx docs/superpowers/probes/2026-10-19-modifier-exclusions/census.mts [checkout]
```

`checkout` names the tree whose parsers (`packages/<g>/.sittir/parser.wasm`) and node models (`packages/<g>/src/node-model.json5`) are read. It defaults to this repository.

- **`sites.mts`**: per grammar, each modifier-bearing kind in a source template that compiles with none of its atoms.
  - An atom is one fact of the node: a modifier keyword, a form of a slot (a private name, a rest or `this` pattern), or a slot filled or left empty.
  - Each atom names the model slot that holds it, when the kind's model has one.
- **`census.mts`** builds every combination of up to three atoms at each site, at most one per position.
  - It renders each combination in every order of its modifiers, and keeps the orders sittir's parser reads with no error and with the site's kind present.
  - It judges those with the language's compiler, through the over-acceptance probe's judges (`../2026-10-15-grammar-over-acceptance/judges.mts`): tsc 7, CPython's `compile()`, rustc in edition 2024.
  - Only syntax and grammar errors count. For TypeScript that is TS1xxx, TS17xxx and TS18xxx, plus TS2369 (a parameter property outside a constructor), a grammar rule the checker numbers among the type errors. So a type error in a template never reads as a combination's.
- **`results/<grammar>.tsv`**: every combination, with its verdict, minimality, line, the kind parsed, the compiler's codes and the witness.

Each combination is one of:

| verdict | meaning |
| --- | --- |
| `valid` | some order parses clean and compiles |
| `grammar` | no order parses clean with the site's kind present |
| `rejected` | some order parses clean, and every clean order is refused |
| `order` | refused only by an order rule (TS1029, or rustc's "expected one of"): the grammar's work, not this primitive's |

A combination is **minimal** when no smaller combination has the same verdict. Each minimal one gets a line:

- **exclusion**: rejected, and no other site of the same kind accepts it. This is what the primitive declares.
- **context**: rejected here, valid at another site of the same kind. The place decides, not the node, so it belongs to the builder contexts, or waits on a kind that tells the places apart.
- **unstable**: rejected with a feature gate (rustc's E0658) at some site of the kind. That is syntax the stable language lacks and nightly may accept, so it is no exclusion.
- **hole**: refused by the grammar, yet some kind of the site has a model slot for every atom. The builder renders what the parser then refuses, so the primitive declares it too.
- **grammar**: refused by the grammar, and no kind's model can hold it. Nothing to do.

## Answer

`results/` holds the run against the authoring-DSL branch, where the method and field kinds are split into their forms (`method_definition_plain`, `_getter`, `_setter`; `public_field_definition_plain`, `_accessor`).

1. **Yes, and the set is small and node-local.** TypeScript has 54 distinct exclusion groups on 12 kinds, Rust 2 and Python 1. The parser also refuses 4 combinations that a kind's model can still hold:
   - two join the exclusions;
   - one is a grammar defect: `abstract override` on a field, valid TypeScript that both parsers refuse.
   The rest of the rejected combinations are either context (the place decides: 20 TypeScript groups, 4 Rust) or nightly Rust syntax.
   - On master, before the split, TypeScript has 1053 rejected combinations (92 minimal) and 8 holes. On the branch it has 832 (80) and 4: the split's forms refuse the accessor combinations in the parser itself.
   - [The spec's census section](../../specs/2026-10-19-builder-exclusions-design.md) lists every group by rule and every hole with its fix; its last section says why the other classes are not this primitive's.
2. **Yes.** The encoding below refuses each group at a builder call and at `$with`, and the message names the group.

## The type encoding

`types.ts` encodes the groups on a stand-in for the accessor field's config, and `types-messages.txt` holds what tsc 7.0.2 prints for it with the `@ts-expect-error` markers removed.

- **A builder** takes its config as a `const` type parameter, so a literal `true` stays `true`, and intersects it with `Excluding<C, Groups>`.
  - That is `unknown` when no group is violated.
  - Otherwise it is `{ readonly $excluded: <labels> }`, a member no call has, so the refusal names each violated group's label:
    `Property '$excluded' is missing in type '{ name: PropertyIdentifier; static: true; abstract: true; }' but required in type '{ readonly $excluded: "static with abstract (TS1243)"; }'.`
  - Two violated groups name both labels.
- **An atom holds** in the type only when its member's type is exactly the atom. A wide `boolean` proves nothing, so the call passes and the runtime decides.
- **`$with`**: `WithExcluding<P, Groups>` refuses a patch that sets an atom without clearing the group's other atoms in the same patch. A flag clears with `false`, a node member with a node of another kind, a present member with `undefined`.
  - Setting a private name requires clearing the accessibility modifier.
  - Setting an accessibility modifier requires a name of another kind than a private one.
- tsc reports exactly the 11 lines marked `@ts-expect-error` and no others. The run is `tsc --ignoreConfig --noEmit --strict --target esnext --module esnext types.ts`, which exits 0 as written.
