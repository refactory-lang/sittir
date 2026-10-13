# SCIP's symbol kinds and the vocabulary

**Question.** SCIP's `SymbolInformation.Kind` names the kinds of symbol that code-intelligence indexers report across languages. Does each vocabulary kind correlate with one of them, and where the two disagree, which should move?

**Measured** against the ruled vocabulary: the synonyms probe's census at `feat/bindings` 8a80d34a3 with that probe's rulings applied (`../2026-10-12-vocabulary-synonyms/results/ruled-kinds.txt`, 453 kinds without the owner × level refinements). SCIP's side is `scip.proto` on `main`, 2026-10-12: 85 kinds, numbered 1 to 86 with 83 unused, besides `UnspecifiedKind`.

## Run

```sh
docs/superpowers/probes/2026-10-12-vocabulary-synonyms/run.sh 8a80d34a3   # writes ruled-kinds.txt
docs/superpowers/probes/2026-10-12-scip-kinds/run.sh
```

- **`scip-kinds.json`** holds, for each SCIP kind, SCIP's own comment on it, how the vocabulary holds it, the vocabulary paths, and a note:
  - `kind`: one vocabulary kind;
  - `family`: one of SCIP's analogous kinds, which the vocabulary holds as one kind, through a synonym or a refinement;
  - `flag`: a kind with a flag set (`declaration.method#static`);
  - `owner`: a kind under an owner kind, such as a signature in a trait;
  - `name`: the same word for a different fact;
  - `none`: a fact no vocabulary kind holds.
- **`scip.py`** checks that every mapped path is a ruled kind, then writes `results/coverage.txt`: each SCIP kind by how the vocabulary holds it, and each declaration kind with the SCIP kinds that reach it, itself or through a kind above it.

## Answer

1. **SCIP names symbols, so the correlation holds at the declaration level and nowhere else.**
   - 52 of the 58 declaration kinds are reached by a SCIP kind.
   - Of the other 395 ruled kinds, only two correlate: the root `module`, which is SCIP's `File`, and `identifier.receiver`, which is `SelfParameter` and `ThisParameter`. Expressions, statements, clauses, patterns, types, literals and elements introduce no symbol.
2. **39 of SCIP's 85 kinds hold a vocabulary fact.**
   - 23 hold it as one kind.
   - 9 as one of SCIP's families of analogous kinds.
   - 5 as a kind with the `static` flag.
   - 2 by the owner a method sits in.
   - 10 share a word with a vocabulary segment for a different fact.
   - 36 belong to languages the three grammars do not cover: Lean, Alloy, Haskell and PureScript, Solidity, Ruby, C#, C++, Dart, Swift, Scala, OCaml, Racket, Raku and protobuf. One more is a package, which no grammar declares.
3. **SCIP's families agree with the vocabulary's design.** Where SCIP has a kind per language family, the vocabulary has one kind, and a synonym, a refinement, an owner or a flag says the rest:
   - the receiver: `SelfParameter`, `ThisParameter` and `MethodReceiver`, against `declaration.parameter.receiver` with synonyms `self` and `this`;
   - the interface: `Trait`, `Protocol` and `TypeClass`, against `declaration.interface` and its refinements;
   - a method with no body: `AbstractMethod`, `TraitMethod`, `ProtocolMethod`, `TypeClassMethod`, `PureVirtualMethod` and `MethodSpecification`, against `declaration.method.signature` (`.abstract` where the keyword says it) and the owner it sits in;
   - a member with no receiver: `StaticMethod`, `StaticField`, `StaticProperty`, `StaticDataMember` and `StaticVariable`, against the `static` flag.

   So a SCIP export picks SCIP's kind from the vocabulary kind plus the synonym's language, the owner or the flag.

## Findings

1. **Six declaration kinds have no SCIP kind:**
   - `declaration.ambient`, a `declare` wrapper whose element is the symbol;
   - `declaration.module_property`;
   - the level `declaration.signature`;
   - typescript's call signature;
   - its index signature and the index signature's mapped form. The nearest SCIP kind is `Subscript`, Swift's subscript declaration, which declares the same fact: how indexing a value works.
2. **SCIP keeps two pairs apart that the synonyms join.**
   - `Field` and `Property`: C#'s property has accessors, and its field does not.
   - `Module` and `Namespace`: a C++ or C# namespace is no module.

   In the three grammars, typescript's properties are fields and its `namespace` is its `module`, so `property` and `namespace` are synonyms of `field` and `module` (NT9).
3. **Rust's `static` item is a variable to SCIP and a constant to the bindings spec.** The spec makes rust's `const` and `static` items `declaration.constant`, with `mutable` for `static mut`. SCIP's `StaticVariable` reads a static as storage. Typescript's `const` binding is `declaration.variable` without `mutable`, by the binding flags.
4. **Rust's trait impl is a typeclass instance**, SCIP's `Instance` (PureScript, Lean). The vocabulary holds it as `declaration.extension.conformance`, which SCIP's `Extension` reaches through its parent. `instance` is no synonym candidate: it also names an object, as in an instance method.
5. **Ten SCIP kinds share a word with a vocabulary segment for another fact.**
   - `Signature` is Alloy's struct-like signature.
   - `Modifier` is Solidity's function modifier.
   - `Attribute` is a C++ attribute's symbol.
   - `Array`, `Boolean`, `Null`, `Number`, `Object`, `String`, `Key` and `Value` name symbols in data files.

   An export maps by the table, never by the word.
6. **The root kind is SCIP's `File`.** SCIP separates a file from a module because a C or C++ file is no module. In the three grammars every file is one: python's module, rust's crate root or module file, and an ES module.

## Questions

Recommendation first.

- **SK1.** `property` and `namespace` (finding 2):
  - (a) keep them as synonyms. When a grammar has the second fact, the word leaves the synonyms and becomes a sibling kind, which the collision check then requires;
  - (b) take them off now.
- **SK2.** Rust's `static` item (finding 3):
  - (a) `declaration.variable`, as SCIP reads it: a static is storage with an address, and `static mut` sets `mutable`. Rust's `const`, which is inlined, stays `declaration.constant`;
  - (b) keep `declaration.constant`, and let an export map `static_item` to `StaticVariable` by its grammar kind.
- **SK3.** Index signatures (finding 1):
  - (a) `index` takes the synonym `indexer`, C#'s word. `subscript` is not a candidate: every language calls the access a subscript;
  - (b) leave it.
- **SK4.** The root kind (finding 6):
  - (a) rename the root level `module` to `file`, the neutral term. A level's own name takes no synonym (NT12), so `module` goes;
  - (b) keep `module`.
