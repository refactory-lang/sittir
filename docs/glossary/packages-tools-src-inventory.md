# `packages/tools/src/inventory` — Function Glossary

The bindings inventory: `sittir tool bindings-inventory`. It reads each grammar's `packages/<grammar>/bindings.scm` through `@sittir/scm` and each grammar's slot model, checks that the bindings compile against the grammar's parser, and derives the vocabulary the bindings imply through codegen's derivation (`packages/codegen/src/bindings/`): its kinds, members, refinements and the members the language context types. `--write-facts` writes the facts it reads to each grammar's committed `.sittir/bindings.json`, the artifact codegen reads. The vocabulary under `packages/types/src/vocabulary/` is authored; `--check` reports where it and the derivation disagree, and each disagreement is fixed on the side that is wrong, a feature extending the vocabulary or a binding dropping a claim.

---

### `packages/tools/src/inventory/bindings.ts::readBindings`

```text
Reads a bindings file into binding facts. The file is parsed with the scm
engine into the query grammar's typed tree, and each top-level pattern (a named
node, a token or a grouping) is read; a top-level alternation reads as one
pattern per option, each carrying the alternation's captures. In a pattern, a
dotted capture, or a capture on the top node that does not start with `_`, is
in claim position. There, a capture in the `keyword` or `punctuation`
namespace is a token class, which names no vocabulary kind; any other is a
claim: its kind is the node's (`_` for a wildcard), a grouping's first
child's, and none on a token, and it records the kinds enclosing it, nearest
first, which place a claim made below the top. Another capture names a
member. On a child of the top node, or on any node of a grouping, it renames
the member its slot selector finds, or, on an unfielded token, marks that
token's presence; deeper inside a named top it is a nested member of the top
kind, routed through the kinds in between. A pattern that captures
`@unclaimed` declares each captured kind unclaimed, with the reason its
`#set! reason` gives, and says nothing else. A pattern whose top node (the
pattern, or the one node of a grouping that also holds the pattern's
directives) carries no claim and that captures `@element` is a container; a
child it captures `@dropped` is a slot the container leaves out on purpose,
and the pattern's `#set! reason` is recorded as the reason, and a capture on a
token keeps the token's text. A `#match?` whose regex is
anchored and has named holes is a template. Inside a node, a field's literal
pins that field, an unfielded and uncaptured literal is a pin candidate the
derivation resolves by the slots' terminals, and an alternation's options take
the alternation's field, captures and quantifier.
```

The parse reports no errors of its own. A file is refused with `BindingsSyntaxError` when an ERROR region surfaces as trivia on a node the reader visits, or when a non-blank file parses to no pattern; a malformed pattern the parse absorbs without a trace passes here and is caught by the compile gate (`compileQuery`).

The scm engine behind it is created by the first read and shared by the rest, so loading the module costs nothing and only a command that reads bindings needs a native scm build; the read is asynchronous for that reason.

### `packages/tools/src/inventory/bindings.ts::BindingFacts`

What a bindings file says, before the slot model is consulted: the claims (`ClaimFact`, with the kinds enclosing a claim made below the top), the member captures (`MemberFact`: a `rename` of the slot its selector finds, the `presence` of a token, or a `nested` member with the kinds it routes through and the selector of its slot), the containers (`ContainerFact`: the element's selector, every other capture, the selectors of the slots it drops on purpose with the pattern's reason, and the line and text of its pattern), the templates (`TemplateFact`) and the unclaimed kinds (`UnclaimedFact`, each with its reason). Facts come in file order and, within a pattern, in pre-order, which the derivation's first-claim and rename rules rely on.

### `packages/tools/src/inventory/bindings.ts::SlotSelector`

How a captured node finds its slot in a model node: by its field when it has one, otherwise by its named kind, otherwise (a wildcard or a grouping) by position: the first slot that holds nodes after the slot of the nearest node pattern before it in the same parent (`after`), or the first such slot when nothing precedes it. A token before it holds no slot and does not count, so `(unary_expression "-" (_) @argument)` names the operand and `(index_expression (_) @object (_) @index)` names both slots in order.

### `packages/tools/src/inventory/bindings.ts::bindingPatterns`

Each top-level definition with the line it starts on and its source text, sliced by the node's byte span. Spans count UTF-8 bytes and the bindings files carry multibyte comment rules, so slicing and line numbers go through `sourceSpans`. It is the unit `bindingIssues` compiles on its own, and `readBindings` reads the file through it, so a container's facts record the line and text given here. It shares `readBindings`'s lazily created engine and is asynchronous.

### `packages/tools/src/inventory/bindings.ts::BindingsSyntaxError`

The refusal of a bindings file that does not parse, with the lines of the regions that did not.

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
that can be worked through.

### `packages/tools/src/inventory/bindings.ts::predicateFact`

A pattern's `#…?` predicate as a fact: its operator (the name between `#` and `?`), the capture it tests, and its remaining arguments, each a capture or a string. A directive (`#…!`, `#set!`) is not a predicate and gives none. Every operator is kept, known or not; the derivation reports the ones it does not know.

### `packages/tools/src/inventory/index.ts::writeBindingFacts`

`--write-facts`: reads each grammar's `bindings.scm` and writes its facts, with `bindingsHash` of the text, to `packages/<grammar>/.sittir/bindings.json`.

### `packages/tools/src/inventory/model.ts::loadSlotModel`

```text
The grammar's slot model from `packages/<grammar>/src/node-model.json5`, the
one source for slots (name, property name, required, multiple, storage,
admitted kinds, terminal texts), supertypes (`subtypes`), a list's element
kinds (`elementKinds`), enum texts and token texts. The derivation reads
nothing from the generated `types.ts`.
```

### `packages/tools/src/inventory/index.ts::loadInputs`

Each grammar's binding facts (`readBindings`), slot model, the text tokens its evaluation minted (`RawGrammar.textTokens`), and its layout slots. A minted text kind is the same fact as the inline token it replaced, so `derive` reads it as that token's text (`text:<pattern>`), not as an unmapped kind. The layout slots are every address in the grammar options' bindings block that names an owner and a field (`readOptionsBlock`, parsed by `parsePreferencePath`; the owner `_` stands for any kind), plus the separator slot of every separated list (`SEPARATOR_LABEL`), the name the compiler gives it.

### `packages/tools/src/inventory/index.ts::vocabularyDisagreements`

Where the bindings and the authored vocabulary disagree, one line each: a claimed path no vocabulary interface has as its `$kind`, a member the bindings route to a kind whose interface (its own members and its parents') does not declare it, a refinement's pinned field its interface does not declare, and a template hole its interface does not declare. The vocabulary is authored, so a disagreement is fixed on whichever side is wrong: a feature adds the kind or member, or the binding drops it.

### `packages/tools/src/inventory/vocabulary.ts::readVocabulary`

Reads the authored vocabulary structurally, with the TypeScript parser, never by matching lines: every interface under its namespaces, keyed by its `$kind` literal, with its own members (each marked optional or required) and its parent, the interface its `extends` clause names through `V.`. `members(path)` adds the inherited members, nearest first. An interface with no `$kind` literal is not a vocabulary kind (the context's typemap and `Unmapped`).

### `packages/tools/src/inventory/index.ts::run`

```text
`--check` compiles every bindings file and reports each grammar, listing every
problem per file (`bindingIssues`) rather than the first; the
derivation summary always prints (kinds, prefixes, members, refinements,
unmapped references, cycles, container captures with no direct target,
container slots left uncaptured);
`--members` prints member names and kinds per shared kind. `--check` also
reports where the bindings and the authored vocabulary disagree
(`vocabularyDisagreements`). A cycle, a container capture with no direct
target, a container slot left uncaptured, a failed compile or a disagreement is
a non-zero exit.
```
