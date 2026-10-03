# `packages/tools/src/inventory` — Function Glossary

The bindings inventory: `sittir tool bindings-inventory`. It reads each grammar's `packages/<grammar>/bindings.scm` through `@sittir/scm` and each grammar's slot model, checks that the bindings compile against the grammar's parser, derives the vocabulary the bindings imply, and emits the base interface tree by building TypeScript through the typescript package's loose builders and rendering it with the native engine. `--emit` writes into `packages/types/src/vocabulary/`, the checked-in tree, unless a directory is named; the tree is emitter output and is regenerated, never hand-edited, so every vocabulary-shape correction is made in a `bindings.scm` or in the derivation and proven by re-emitting.

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
`#set! reason` gives, and says nothing else. A pattern whose top carries no
claim and that captures `@element` is a container. A `#match?` whose regex is
anchored and has named holes is a template. Inside a node, a field's literal
pins that field, an unfielded and uncaptured literal is a pin candidate the
derivation resolves by the slots' terminals, and an alternation's options take
the alternation's field, captures and quantifier.
```

The parse reports no errors of its own. A file is refused with `BindingsSyntaxError` when an ERROR region surfaces as trivia on a node the reader visits, or when a non-blank file parses to no pattern; a malformed pattern the parse absorbs without a trace passes here and is caught by the compile gate (`compileQuery`).

### `packages/tools/src/inventory/bindings.ts::BindingFacts`

What a bindings file says, before the slot model is consulted: the claims (`ClaimFact`, with the kinds enclosing a claim made below the top), the member captures (`MemberFact`: a `rename` of the slot its selector finds, the `presence` of a token, or a `nested` member with the kinds it routes through and the selector of its slot), the containers (`ContainerFact`: the element's selector and every other capture), the templates (`TemplateFact`) and the unclaimed kinds (`UnclaimedFact`, each with its reason). Facts come in file order and, within a pattern, in pre-order, which the derivation's first-claim and rename rules rely on.

### `packages/tools/src/inventory/bindings.ts::SlotSelector`

How a captured node finds its slot in a model node: by its field when it has one, otherwise by its named kind, otherwise (a wildcard or a grouping) by position: the first slot that holds nodes after the slot of the nearest node pattern before it in the same parent (`after`), or the first such slot when nothing precedes it. A token before it holds no slot and does not count, so `(unary_expression "-" (_) @argument)` names the operand and `(index_expression (_) @object (_) @index)` names both slots in order.

### `packages/tools/src/inventory/bindings.ts::bindingPatterns`

Each top-level definition with the line it starts on and its source text, sliced by the node's byte span. Spans count UTF-8 bytes and the bindings files carry multibyte comment rules, so slicing and line numbers go through `sourceSpans`. The unit `bindingIssues` compiles on its own.

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

### `packages/tools/src/inventory/derive.ts::derive`

```text
The derivation over every grammar's binding facts and model. In order: resolve
the facts against the model (a claim's pin candidates become field literals
through the slot whose terminals hold them; a nested member takes its named
kind, or the kinds of the slot its selector finds in its parent; a rename is
kept per owner kind against the slot its selector finds; templates become hole
members of every claim in their pattern); build the members of every claimed
kind from its slots, renamed by the captures and otherwise by the marker and
modifier names rules, a nested member replacing the slot it routes through,
and no layout slot ever a member; fold field-literal claims into refinements,
each literal named by the kind's converged member (a capture on the field
renames it) rather than by the grammar's field; assign container captures to
the kinds the element slot names directly; collapse a namespace's leaves when
the namespace itself is admitted; and report inclusion cycles, the containers
whose captures have no direct target, and the unmapped placeholders.

A container's captures land only on the kinds its element slot names directly,
by their direct claim (the first two steps of the resolution below), never on a
kind reached through a supertype or a further container: a capture spread
through a supertype would give every kind of a namespace a member only one
wrapper carries. A container whose element slot names no directly claimed kind
carries information of its own, so its captures are reported (`untargeted`)
instead of placed, and the bindings claim the container as a vocabulary kind.

A grammar kind in a slot resolves to the first of: a claim placed by the
enclosing kinds it sits in; its own claim; nothing, when it is unclaimed; a
minted text, the enum's texts, or a keyword or punctuation literal; its
element, when it is a container; its supertype's subtypes, each resolved the
same way, when at least half of them resolve (a whole namespace is admitted
only when every claimed kind in it is covered); otherwise an `<grammar:kind>`
placeholder. A container is a kind the bindings declare with `@element`, a
list (its element kinds), or an envelope, alias or polymorph whose one
non-layout slot holds nodes; a branch is never one implicitly, since a kind
with its own structure (`impl !Trait`) loses a fact when read as its content.
The element slot's terminals and kinds resolve with the container added to
the chain of enclosing kinds, and a container never resolves through itself.
A layout slot is one an options-block address or the separator names, or one
whose kinds are all unclaimed and that has no terminals. A resolution is a
list when the container is a list or a part is, and scalar when a part is
scalar, so a member admitting both reads `T | T[]`.
```

### `packages/tools/src/inventory/derive.ts::inclusionCycles`

```text
The cycles in the per-grammar set-inclusion graph (a union admitting a namespace
that admits the first back), of any length: every strongly connected component
of more than one union is reported once, as `<grammar>: a <-> b <-> c`.
```

### `packages/tools/src/inventory/derive.ts::levelMembers`

```text
A level's members: the union over every kind beneath it by path and every
refinement that names it as parent, `T | T[]` where multiplicity disagrees. A
member is required only when the level's own claim carries it in every
claiming grammar and every claimed child by path carries it required; a
literal refinement declares only its pin and so inherits the rest. A claim a
content predicate determines (`#eq?`, `#match?`) declares no members of its own
and inherits the level's, so it neither relaxes a member nor counts as a grammar
that fails to carry it. A level no
grammar claims takes a member as required when every claimed child does.
```

### `packages/tools/src/inventory/emit.ts::vocabularyFiles`

```text
The tree as typescript programs, one per top-level namespace plus
`context.ts` (the `GrammarContext` typemap, `Unmapped` and `BaseContext`),
built directly through the loose builders: an interface merged with a
namespace at every level, an interface alone at a leaf, a refinement
extending its path parent with its literal pinned, every namespace exporting
`Any<G>`. Member types collapse to the smallest covering kind-set: the
namespace lookup when the admitted leaves' common prefix is the namespace
root, a sub-namespace's `Any` when it is a claimed prefix, the leaf
interfaces otherwise. A union keeps one arm per type it builds, keyed by the
vocabulary kind the arm stands for. Member kinds arrive resolved: the
derivation has read through containers and left out layout slots, so a
`<grammar:kind>` that remains is unmapped and is spelled `Unmapped<...>`
with a note naming it.
```

A sub-kind's interface — a refinement, a content-derived leaf, or a level
under its top namespace — extends `Simplify<SubKindOf<V.<Parent><G>>>`
rather than the parent itself: `SubKindOf` (`./utils.ts`, authored) narrows
the parent's `kind` to the dotted sub-kind pattern, so a sub-kind is
assignable to its parent while its own `kind` literal stays the narrower
fact. A file imports `Simplify` (type-fest) and `SubKindOf` only when one of
its interfaces extends that way, which the file's scope records as the
heritage is built.

### `packages/tools/src/inventory/emit.ts::indexFile`

The index: one `export * from` per namespace file, then the context types' `export type`, built through the same builders as the other files.

### `packages/tools/src/inventory/emit.ts::renderVocabularyFile`

```text
The dogfood step: every file is built through the loose `build` of one
typescript engine (no `.strict` call anywhere in the module: input is loose
and the factories resolve arms by lexical rank, so a member named like a
keyword, such as `object`, takes the keyword arm instead of tripping a strict
slot guard), created when the module loads (`ir` and `TSKindId` are that
engine's `build` and `kinds`), and rendered with the same engine and the
vocabulary's render options: `exportStatementDefaultFrom.after` is a newline,
so the index's re-exports stay one per line where the typescript default puts
a blank line between statements. Comments ride as trivia. The caller formats
the result; a render defect that survives formatting is a finding about the
typescript package, never something the emitter works around.
A namespace's block is built empty and given its statements through
`$with.statements`, because the loose `statementBlock({ statements })`
input type does not terminate on a list of export statements that
themselves hold statement blocks (the checker reports excessive stack
depth); the built node is the same.
```

### `packages/tools/src/inventory/index.ts::run`

```text
`--check` compiles every bindings file and reports each grammar, listing every
problem per file (`bindingIssues`) rather than the first; the
derivation summary always prints (kinds, prefixes, members, refinements,
unmapped references, cycles, container captures with no direct target);
`--members` prints member names and kinds per shared kind; `--emit [dir]` emits
the tree into the directory (default `packages/types/src/vocabulary`) and
formats it with oxfmt. A cycle, a container capture with no direct target or a
failed compile is a non-zero exit.
```
