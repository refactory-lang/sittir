# `packages/codegen/src/bindings` — Function Glossary

The bindings facts and the derivation over them. The facts are what a grammar's `bindings.scm` states, read by the bindings inventory and committed as `packages/<grammar>/.sittir/bindings.json`. The derivation turns them, with the grammar's slot model, into the vocabulary's kinds, members, refinements and routes. Codegen reads only the committed artifact, so no generation depends on the scm parser.

### `packages/codegen/src/bindings/facts.ts::BindingFacts`

What a `bindings.scm` states: claims (a grammar kind as a vocabulary kind, with its predicates, field literals and tokens), members (a capture routed to a slot, renamed, nested or a token's presence), containers, templates and unclaimed kinds. A presence member keeps its token's text (`"async" @isAsync` has the name `isAsync` and the token `async`); codegen resolves the text to a kind id through the stamped public symbol, never by a text lookup of its own.

### `packages/codegen/src/bindings/facts.ts::PredicateFact`

A claim's `#…?` predicate: its operator, the capture it tests (`null` for a property predicate such as `#is-not? local`), and its arguments, each a capture or text (`#eq? @name "__init__"` is `eq` on `name` with the text `__init__`). A claim with any predicate, known or not, is never read as unconditional. A read entry tests it on the captured node's text; a build entry pins it.

### `packages/codegen/src/bindings/facts.ts::KNOWN_PREDICATE_OPERATORS`

The predicate operators the derivation knows. A claim's predicate with another operator is a derivation diagnostic (`Derivation.unknownPredicates`), never silently dropped.

### `packages/codegen/src/bindings/facts.ts::BINDING_FACTS_VERSION`

The version of the facts schema and of the derivation over them. It is bumped whenever either changes what it produces, so an artifact written before the change is refused even when its `bindings.scm` has not changed.

### `packages/codegen/src/bindings/facts.ts::bindingsHash`

The freshness key of an artifact: the SHA-256 of `BINDING_FACTS_VERSION` and the `bindings.scm` text together.

### `packages/codegen/src/bindings/facts.ts::verifiedBindingFacts`

An artifact's facts, when its `bindingsHash` matches the current `bindings.scm` and version. Otherwise it throws `StaleBindingFactsError`, whose message names the command that regenerates the artifact.

### `packages/codegen/src/bindings/facts.ts::readBindingFacts`

A grammar's committed facts, read from `.sittir/bindings.json` and checked by `verifiedBindingFacts` against its `bindings.scm`. A missing artifact is refused the same way as a stale one.

### `packages/codegen/src/bindings/derive.ts::unknownPredicates`

Every claim predicate whose operator is not in `KNOWN_PREDICATE_OPERATORS`, one line each, naming the grammar, the operator, the capture and the claim. The inventory prints them when there are any and fails.

### `packages/codegen/src/bindings/derive.ts::derive`

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
whose captures have no direct target, the container slots no capture names,
and the unmapped placeholders.

A container's captures land only on the kinds its element slot names directly,
by their direct claim (the first two steps of the resolution below), never on a
kind reached through a supertype or a further container: a capture spread
through a supertype would give every kind of a namespace a member only one
wrapper carries. A container whose element slot names no directly claimed kind
carries information of its own, so its captures are reported (`untargeted`)
instead of placed, and the bindings claim the container as a vocabulary kind.
A container also reads as its element only when nothing else it holds is lost:
every non-layout slot besides the element is captured (a token capture keeps
the slot whose terminals hold its text) or dropped on purpose, and each other
slot is reported with its pattern (`uncaptured`). A drop is on purpose only with
a reason: a `@dropped` slot whose pattern gives no non-blank `#set! reason`, and
a `@dropped` node that names no slot, are reported the same way. A wrapper that keeps a slot
of its own beside its element is claimed as a kind instead.

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

### `packages/codegen/src/bindings/derive.ts::inclusionCycles`

```text
The cycles in the per-grammar set-inclusion graph (a union admitting a namespace
that admits the first back), of any length: every strongly connected component
of more than one union is reported once, as `<grammar>: a <-> b <-> c`.
```

### `packages/codegen/src/bindings/derive.ts::levelMembers`

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

### `packages/codegen/src/bindings/derive.ts::armClass`

What one collapsed member kind stands for: a `scalar` keyword (`boolean`, `string`, `number`), a `role` (a top-level namespace), a `ref` (a dotted vocabulary kind or a `set:` prefix), `text` (a `text:` or `literal:` token), or `unmapped` (a `<grammar:kind>` no binding claims).

### `packages/codegen/src/bindings/derive.ts::collapsedKinds`

A member's kinds collapsed to the smallest covering set: a namespace's leaves fold into the namespace when it is itself admitted or their common prefix is the namespace root, and into a `set:<prefix>` when that prefix is a claimed one; other kinds stand as they are. The slot table's entries and a grammar's fill of them both collapse through it, so they agree.

### `packages/codegen/src/bindings/derive.ts::soleRole`

The one role a member's collapsed kinds state, with the text beside it, when every other arm is text: the member is typed as the role, and the text is keyword text a grammar aliases into that role, which the grammar's context admits under the role rather than the vocabulary naming it.

### `packages/codegen/src/bindings/derive.ts::directKinds`

A member typed without the language context: its `soleRole`, or its collapsed kinds when they are all refs or all scalars. Anything else, differing roles, roles beside refs, text alone or nothing, is `undefined`, and the member is typed through its slot entry.

### `packages/codegen/src/bindings/derive.ts::levelsWithMembers`

The kind paths that declare their own members: every claimed kind and prefix except refinements and template holes, which pin literals or holes over their parent's members. Sorted, so the slot table's order is stable.

### `packages/codegen/src/bindings/derive.ts::slotEntries`

Every member the language context states, one per kind path and member, in path then member order: the members of `levelsWithMembers` that `directKinds` leaves `undefined`.
