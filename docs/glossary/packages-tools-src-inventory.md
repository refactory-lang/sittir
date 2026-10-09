# `packages/tools/src/inventory` — Function Glossary

The bindings inventory: `sittir tool bindings-inventory`. It reads each grammar's `packages/<grammar>/bindings.scm` through `@sittir/scm` and each grammar's slot model, checks that the bindings compile against the grammar's parser, and derives the vocabulary the bindings imply through codegen's derivation (`packages/codegen/src/bindings/`): its kinds, members, refinements and the members the language context types. The vocabulary under `packages/types/src/vocabulary/` is authored; `--check` reports where it and the derivation disagree, and each disagreement is fixed on the side that is wrong, a feature extending the vocabulary or a binding dropping a claim.

---

### `packages/tools/src/inventory/bindings.ts::compileQuery`

```text
The compile gate: builds the query with web-tree-sitter against the grammar's
compiled parser, so a bad node name, an unknown field or a malformed pattern
fails here with tree-sitter's own message. Returns the pattern and capture
counts and frees the query.
```

### `packages/tools/src/inventory/bindings.ts::BindingIssue`

One problem in a bindings file: the line of the pattern and a message.

### `packages/tools/src/inventory/bindings.ts::bindingIssues`

Every problem in a bindings file, not just the first. Each top-level pattern
is checked on its own: every node kind, anonymous token and field it names
(negated fields and the options of an alternation included) is looked up in the
grammar's parser, and a pattern whose names all exist is then compiled, so a
structurally impossible pattern (a field or child the parent never has) is
reported with tree-sitter's own message. `compileQuery` stops at the first
failure of the whole file; this is what turns a failing compile into a list
that can be worked through. The patterns and the names each one references come from the pinned reader (`bindingPatterns`).

### `packages/tools/src/inventory/model.ts::loadSlotModel`

```text
The grammar's slot model from `packages/<grammar>/src/node-model.json5`, the
one source for slots (name, property name, required, multiple, storage,
admitted kinds, terminal texts), supertypes (`subtypes`), a list's element
kinds (`elementKinds`), enum texts and token texts. The derivation reads
nothing from the generated `types.ts`.
```

### `packages/tools/src/inventory/index.ts::loadInputs`

Each grammar's binding facts (`readBindings`), named by their bound kinds through the node model's stamped `renamedFrom` (`bindFacts` over `loadBoundNameOf`, the identity with the overlay off), slot model, the text tokens its evaluation minted (`RawGrammar.textTokens`), and its layout slots. A minted text kind is the same fact as the inline token it replaced, so `derive` reads it as that token's text (`text:<pattern>`), not as an unmapped kind. The layout slots are every address in the grammar options' bindings block that names an owner and a field (`readOptionsBlock`, parsed by `parsePreferencePath`; the owner `_` stands for any kind), plus the separator slot of every separated list (`SEPARATOR_LABEL`), the name the compiler gives it.

### `packages/tools/src/inventory/index.ts::vocabularyDisagreements`

Where the bindings and the authored vocabulary disagree, one line each: a claimed path no vocabulary interface has as its `$kind`, a member the bindings route to a kind whose interface (its own members and its parents') does not declare it, a refinement's pinned field its interface does not declare, and a template hole its interface does not declare. The vocabulary is authored, so a disagreement is fixed on whichever side is wrong: a feature adds the kind or member, or the binding drops it.

### `packages/tools/src/inventory/vocabulary.ts::readVocabulary`

Reads the authored vocabulary structurally, with the TypeScript parser, never by matching lines: every interface under its namespaces, keyed by its `$kind` literal, with its own members (each marked optional or required) and its parent, the interface its `extends` clause names through `V.`. `members(path)` adds the inherited members, nearest first. An interface with no `$kind` literal is not a vocabulary kind (the context's typemap and `Unmapped`).

### `packages/tools/src/inventory/index.ts::BindingsModule`

A grammar's `grammar.bindings.ts` text, with the overlay and the derivation report it was printed from.

### `packages/tools/src/inventory/index.ts::vocabularyMembers`

Each vocabulary path's members as the overlay derivation reads them: every member its interface declares or inherits (`Vocabulary.members`), by name.

### `packages/tools/src/inventory/index.ts::bindingsModule`

The one writer of a grammar's `grammar.bindings.ts`: its binding facts read from `bindings.scm` by the pinned reader (`@sittir/codegen/bindings::readBindings`), the overlay derived from them against the grammar evaluated without the overlay and each vocabulary path's members (`vocabularyMembers`, `deriveOverlay`), printed with the hash of the sources it was derived from (`printBindingsModule`, `grammarBindingsHash`). A test holds every committed module equal to what this writes.

### `packages/tools/src/inventory/index.ts::overlaySummary`

A grammar's convergence as `--write` prints it: the renames, aliases, field renames, field wraps, splits and patch sites; the claims realized as kinds and the members realized as field names, with the implicit routes fielded; and the residue by cause, most frequent first, four rows each.

### `packages/tools/src/inventory/index.ts::run`

```text
`--check` compiles every bindings file and reports each grammar, listing every
problem per file (`bindingIssues`) rather than the first; the
derivation summary always prints (kinds, prefixes, members, refinements,
unmapped references, cycles, container captures with no direct target,
container slots left uncaptured);
`--members` prints member names and kinds per shared kind. `--write` first
writes each grammar's `grammar.bindings.ts` (`bindingsModule`) and prints its
convergence (`overlaySummary`). `--check` also
reports where the bindings and the authored vocabulary disagree
(`vocabularyDisagreements`). A cycle, a container capture with no direct
target, a container slot left uncaptured, a failed compile or a disagreement is
a non-zero exit.
```
