# SCIP's symbol kinds and the vocabulary

**Question.** SCIP's `SymbolInformation.Kind` names the kinds of symbol that code-intelligence indexers report across languages. Does each vocabulary kind correlate with one of them, and where the two disagree, which should move?

**Measured** against the ruled vocabulary: the synonyms probe's census at `feat/bindings` 8a80d34a3 with that probe's rulings and this one's applied (`../2026-10-12-vocabulary-synonyms/results/ruled-kinds.txt`, 452 kinds without the owner × level refinements). The maintainer ruled this probe's questions on 2026-10-12 (Rulings, below). SCIP's side is `scip.proto` on `main`, 2026-10-12: 85 kinds, numbered 1 to 86 with 83 unused, besides `UnspecifiedKind`.

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
   - 53 of the 57 declaration kinds are reached by a SCIP kind.
   - Of the other 395 ruled kinds, only two correlate: the root `file`, which is SCIP's `File`, and `identifier.receiver`, which is `SelfParameter` and `ThisParameter`. Expressions, statements, clauses, patterns, types, literals and elements introduce no symbol.
2. **40 of SCIP's 85 kinds hold a vocabulary fact.**
   - 23 hold it as one kind.
   - 11 as one of SCIP's families of analogous kinds.
   - 4 as a kind with the `static` flag.
   - 2 by the owner a method sits in.
   - 10 share a word with a vocabulary segment for a different fact.
   - 35 belong to languages the three grammars do not cover: Lean, Alloy, Haskell and PureScript, Solidity, Ruby, C#, C++, Dart, Swift, Scala, OCaml, Racket, Raku and protobuf. One more is a package, which no grammar declares.
3. **SCIP's families agree with the vocabulary's design.** Where SCIP has a kind per language family, the vocabulary has one kind, and a synonym, a refinement, an owner or a flag says the rest:
   - the receiver: `SelfParameter`, `ThisParameter` and `MethodReceiver`, against `declaration.parameter.receiver` with synonyms `self` and `this`;
   - the interface: `Trait`, `Protocol` and `TypeClass`, against `declaration.interface` and its refinements;
   - a method with no body: `AbstractMethod`, `TraitMethod`, `ProtocolMethod`, `TypeClassMethod`, `PureVirtualMethod` and `MethodSpecification`, against `declaration.method.signature` (`.abstract` where the keyword says it) and the owner it sits in;
   - a member with no receiver: `StaticMethod`, `StaticField`, `StaticProperty` and `StaticDataMember`, against the `static` flag;
   - a variable: `Variable` and `StaticVariable`, against `declaration.variable`, which holds rust's static item;
   - an indexing declaration: Swift's `Subscript`, against `declaration.signature.index`, with the synonym `indexer`.

   So a SCIP export picks SCIP's kind from the vocabulary kind plus the synonym's language, the owner or the flag.

## Findings

1. **Four declaration kinds have no SCIP kind:** `declaration.ambient`, a `declare` wrapper whose element is the symbol; `declaration.module_property`; the level `declaration.signature`; and typescript's call signature. Typescript's index signature and its mapped form declare what Swift's `Subscript` and C#'s indexer do, how indexing a value works, and SK3 gives `index` the synonym `indexer`.
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

## Rulings

The maintainer ruled each question on 2026-10-12.

- **SK1.** `property` and `namespace` (finding 2). *Ruled (b):* they come off the synonyms now, so each stays free for the fact SCIP gives it: C#'s property, which has accessors, and the C++ and C# namespace. Typescript's properties stay `declaration.field` and its `namespace` stays `declaration.module`.
- **SK2.** Rust's `static` item (finding 3). *Ruled (a):* a `declaration.variable`, storage with an address; `static mut` sets `mutable`, and lazy_static's `static ref` sets `byReference`. Rust's `const`, which is inlined, stays `declaration.constant`.
- **SK3.** Index signatures (finding 1). *Ruled (a):* `index` takes the synonym `indexer`.
- **SK4.** The root kind (finding 6). *Ruled (a):* the root level is `file`, the neutral term, and `module` names only `declaration.module`.
