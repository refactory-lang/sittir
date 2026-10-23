# `packages/tools/src/inventory` — Function Glossary

The bindings inventory: `sittir tool bindings-inventory`. It reads each grammar's `packages/<grammar>/bindings.scm` through `@sittir/scm` and each grammar's slot model, checks that the bindings compile against the grammar's parser, and derives the vocabulary the bindings imply through codegen's derivation (`packages/codegen/src/bindings/`): its kinds, members, refinements and the members the language context types. The vocabulary under `packages/types/src/vocabulary/` is authored, but for its flags module, which the inventory writes from the vocabulary's `Flag` declarations; `--check` reports where the vocabulary and the derivation disagree, and each disagreement is fixed on the side that is wrong, a feature extending the vocabulary or a binding dropping a claim.

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

### `packages/tools/src/inventory/index.ts::loadInputs`

Each grammar's binding facts (`readBindings`), named by their bound kinds through the node model's stamped `renamedFrom` (`bindFacts` over `loadBoundNameOf`, the identity with the grammar bindings off), slot model, the text tokens its evaluation minted (`RawGrammar.textTokens`), and its layout slots. A minted text kind is the same fact as the inline token it replaced, so `derive` reads it as that token's text (`text:<pattern>`), not as an unmapped kind. The layout slots are every address in the grammar options' bindings block that names an owner and a field (`readOptionsBlock`, parsed by `parsePreferencePath`; the owner `_` stands for any kind). A separated list's separator is no slot of the model, so no slot is layout by its name alone: a branch's slot named `separator` (typescript's `member_expression`, rust's `token_repetition`) is a member like any other.

### `packages/tools/src/inventory/index.ts::vocabularyDisagreements`

Where the bindings and the authored vocabulary disagree, one line each: a claimed path no vocabulary interface has as its `$kind`, a member the bindings route to a kind whose interface (its own members and its parents') does not declare it, and a template hole its interface does not declare. A refinement's pinned slot needs no declaration: the read tells it, so it is no member, and the bindings claim is the one source of the refinement's spelling. The vocabulary is authored, so a disagreement is fixed on whichever side is wrong: a feature adds the kind or member, or the binding drops it.

### `packages/tools/src/inventory/index.ts::BindingsModule`

A grammar's `grammar.bindings.ts` text, with the grammar bindings and the derivation report it was printed from.

### `packages/tools/src/inventory/index.ts::vocabularyMembers`

Each vocabulary path's members as the grammar-bindings derivation reads them: every member its interface declares or inherits (`Vocabulary.members`), by name.

### `packages/tools/src/inventory/index.ts::bindingsModule`

The one writer of a grammar's `grammar.bindings.ts`: its binding facts read from `bindings.scm` by the pinned reader (`@sittir/codegen/bindings::readBindings`), the grammar bindings derived from them against layer 1 (`evaluateGrammar` with `unbound`) and placed in layer 1's own rules (`evaluatePackageLayer` with `unbound`), each vocabulary path's members (`vocabularyMembers`) and each claimed kind's member routes over layer 1's model (`compileNodeMap` with `unbound`, `buildNodeModel`, `resolveRoutes`; `deriveGrammarBindings`), printed with the hash of the sources it was derived from (`printBindingsModule`, `grammarBindingsHash`). A blocking derivation record (`lead-refused`) stops it through the diagnostics gate (`assertGatePasses`) before anything is printed, and the record names the `bindings.scm` path relative to the repository. A test holds every committed module equal to what this writes.

### `packages/tools/src/inventory/index.ts::grammarBindingsSummary`

A grammar's convergence as `--write` prints it: the renames, aliases, field renames, field wraps, splits and patch sites; the claims realized as kinds and the members realized as field names, with the implicit routes fielded; and the residue by cause, most frequent first, four rows each.

### `packages/tools/src/inventory/index.ts::run`

```text
`--check` compiles every bindings file and reports each grammar, listing every
problem per file (`bindingIssues`) rather than the first; the
derivation summary always prints (kinds, prefixes, members, refinements,
unmapped references, cycles, container captures with no direct target,
container slots left uncaptured, and any form left with no entry for its
supertype's claim);
`--members` prints member names and kinds per shared kind. `--write` first
writes the vocabulary's flags module (`printFlagsModule`, built as nodes with `@sittir/typescript`'s factories and rendered by its engine), which the bindings
hash covers, then each grammar's `grammar.bindings.ts` (`bindingsModule`), and
prints its convergence (`grammarBindingsSummary`). `--check` also
reports where the bindings and the authored vocabulary disagree
(`vocabularyDisagreements`), whether the flags module is current
(`flagsCurrent`), and whether each grammar.bindings.ts is current and enrich's fixpoint over
grammar.sittir.ts (`generatedLayerReport`). `--write` refuses a layer it wrote that
is not (`generatedLayerFixpoint`). A cycle, a container capture with no direct
target, a container slot left uncaptured, a form with no entry for its supertype's
claim, a failed compile, a disagreement, a stale flags module, a stale layer or a layer that is not enrich's
fixpoint is a non-zero exit.
```

### `packages/tools/src/inventory/index.ts::flagsCurrent`

Whether the committed flags module is the one the vocabulary's `Flag` declarations imply (`printFlagsModule`); a missing module is not current. The check is async because the module is rendered by the engine.

### `packages/tools/src/inventory/index.ts::generatedLayerFixpoint`

The producer check of one grammar's generated layer: the diagnostics of its top layer's fixpoint check (`dsl/evaluate.ts::generatedLayerDiagnostics`). The compile leaves that check to this inventory and to `gen`, so a layer that enrich would still change fails where it is written or regenerated.

### `packages/tools/src/inventory/index.ts::GeneratedLayerReport`

What `generatedLayerReport` prints, a line per grammar with any diagnostic under it, and whether any grammar failed.

### `packages/tools/src/inventory/index.ts::generatedLayerReport`

`--check`'s layer report: for each grammar, whether its `grammar.bindings.ts` is current against `bindings.scm` and the vocabulary (`bindingsStaleness`, the test the compile throws on), and then whether it is enrich's fixpoint over `grammar.sittir.ts` (`generatedLayerFixpoint`), with the diagnostics formatted under the ones that are not (`formatGrammarDiagnostics`). A stale layer is reported by its message and not checked further. Any such grammar fails the check.

### `packages/tools/src/inventory/flags.ts::printFlagsModule`

The flags module as text, asked of the pinned build's child (`runPinned('flagsModule', flagMembers(names))`): an `enum Flags` whose members come from `flagMembers`, each `Name = 1 << bit`, under the generated-file header comment. The module is built as nodes with the factories of the pinned `@sittir/typescript` and rendered by its engine with a tab indent, so the bytes are the engine's (`flagsModuleInProcess`). The writer therefore needs the pinned build: it is the first place sittir writes its own TypeScript with itself, and a missing build fails the write rather than falling back to a template. It is async, as `flagsCurrent` is.

The enum body is built as `enumBody.strict(enumBodyElements.strict({ delimiter: Delimiter.None }, first, ...rest))`, with the empty list taking the zero-argument `enumBody.strict()`. The strict `enumBody` surface drops the `(options, ...elements)` overload and requires a non-empty variadic list, though `enum E {}` is valid TypeScript, so the writer goes through `enumBodyElements.strict` until the strict surface carries both.

### `packages/tools/src/inventory/bindings.ts::sourceLanguage`

Caches the loaded completed grammar.sittir parser per grammar for authored query
compilation and reference checks. A failed load is evicted so a retry can recover.
`loadSourceLanguage` loads the temporary source parser's bytes through the canonical
web-tree-sitter initializer. Both inventory checks use this source stage because
bindings.scm names fields and kinds before grammar.bindings applies its edits.
