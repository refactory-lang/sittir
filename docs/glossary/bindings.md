# `packages/codegen/src/bindings` — Function Glossary

The bindings facts and the derivation over them. The facts are what a grammar's `bindings.scm` states, as the pinned `@sittir/scm` reads them (`read.ts`). The derivation turns them, with the grammar's slot model, into the vocabulary's kinds, members, refinements and routes.

### `packages/codegen/src/bindings/facts.ts::BindingFacts`

What a bindings file says, before the slot model is consulted: the claims (`ClaimFact`, with the kinds enclosing a claim made below the top), the member captures (`MemberFact`: a `rename` of the slot its selector finds, the `presence` of a token, the presence of a `kind` in the slot another member names (a flag), or a `nested` member with the kinds it routes through and the selector of its slot), the containers (`ContainerFact`: the element's selector, every other capture, the selectors of the slots it drops on purpose with the pattern's reason, and the line and text of its pattern), the templates (`TemplateFact`) and the unclaimed kinds (`UnclaimedFact`, each with its reason). Facts come in file order and, within a pattern, in pre-order, which the derivation's first-claim and rename rules rely on. A presence member keeps its token's text (`"async" @isAsync` has the name `isAsync` and the token `async`); codegen resolves the text to a kind id through the stamped public symbol, never by a text lookup of its own.

### `packages/codegen/src/bindings/facts.ts::SlotSelector`

How a captured node finds its slot in a model node: by its field when it has one, otherwise by its named kind, otherwise (a wildcard or a grouping) by position: the first slot that holds nodes after the slot of the nearest node pattern before it in the same parent (`after`), or the first such slot when nothing precedes it. A token before it holds no slot and does not count, so `(unary_expression "-" (_) @argument)` names the operand and `(index_expression (_) @object (_) @index)` names both slots in order. `anchor` is the edge of its parent's named children the pattern pins the child to (`(block . (x))`, `(block (x) .)`, both for `(block . (x) .)`), and `adjacent` names the neighbours an anchor between siblings joins it to (`(a) . (b)`), each by the selector that finds its slot. Neither chooses the slot; `routes.ts::slotAnchor` reads them against the model as the step's narrowing to its slot's first, last or only node.

### `packages/codegen/src/bindings/facts.ts::Anchor`

Which end of its parent's named children an anchored child is pinned to: `first` for a leading `.`, `last` for a trailing one, `only` for both, tree-sitter's meaning. As a step's anchor (`routes.ts::SlotStep`, `@sittir/types` `PortableStep`) it narrows the step to its slot's first, last or only node instead. An anchor constrains only a step below a claimed node; the reader refuses one anywhere else.

### `packages/codegen/src/bindings/facts.ts::Adjacent`

The siblings an anchor between them joins a child to: the one immediately before (`previous`) and after (`next`), each the selector that finds its slot, without anchors of its own.

### `packages/codegen/src/bindings/facts.ts::Sibling`

One node child of a pattern node, in order: the selector that finds its slot, with its anchors, and whether it is `bare`, stating nothing below itself.

### `packages/codegen/src/bindings/facts.ts::BindingsSyntaxError`

The refusal of a bindings file that does not parse, with the lines of the regions that did not. It carries the lines across the reader's process boundary, so `read.ts` rethrows the same refusal the reader raised.

### `packages/codegen/src/bindings/facts.ts::PatternReference`

A name a pattern uses: a field, a named node kind or an anonymous token. `bindingIssues` looks each one up in the grammar's parser.

### `packages/codegen/src/bindings/facts.ts::BindingPattern`

A top-level pattern as the inventory's issue check needs it: its line, its source text and every name it references (`PatternReference`), negated fields and an alternation's options included. It is plain data, so it crosses the reader's process boundary; the parsed definition it was read from stays inside the reader.

### `packages/codegen/src/bindings/facts.ts::BindingsRoundTrip`

A `bindings.scm` read and rendered back by the pinned engine: the regions that did not parse and the rendered text. The pin is sound for a file when there are no regions and the text renders byte for byte.

### `packages/codegen/src/bindings/facts.ts::PredicateFact`

A claim's `#…?` predicate: its operator, the capture it tests (`null` for a property predicate such as `#is-not? local`), and its arguments, each a capture or text (`#eq? @name "__init__"` is `eq` on `name` with the text `__init__`). A claim with any predicate, known or not, is never read as unconditional. A read entry tests it on the captured node's text; a build entry pins it. Its `subject` is where the tested capture sits relative to the claimed node (`CaptureSite`), `null` when it tests no capture or the capture is not in the pattern.

### `packages/codegen/src/bindings/facts.ts::CaptureSite`

Where a predicate's capture sits, relative to the node a claim captures: `up` enclosing named nodes of the pattern (0 is the claimed node itself; 1 its nearest enclosing node, the first kind in the claim's `within`), then the `down` selectors from that node to the capture, outermost first. A self-text test is `{ up: 0, down: [] }`; a hidden capture under the claimed node, such as python's `(string (string_start) @_p)`, steps down through the slot holding it; and python's `(decorated_definition (decorator (identifier) @_d) (function_definition) @declaration.method.static)` places `@_d` one node up, then `decorator`, then `identifier`. Groups are not nodes, so they count neither up nor down.

### `packages/codegen/src/bindings/facts.ts::KNOWN_PREDICATE_OPERATORS`

The predicate operators the derivation knows. A claim's predicate with another operator is a derivation diagnostic (`Derivation.unknownPredicates`), never silently dropped. `kind-eq` and `not-kind-eq` test a captured node's kind against kind names (`KIND_PREDICATE_OPERATORS`).

### `packages/codegen/src/bindings/facts.ts::KIND_PREDICATE_OPERATORS`

The predicate operators whose text arguments are kind names, not text: `bindFacts` binds them like any other kind, and a portable read test compiles them into a test of the node's type.

### `packages/codegen/src/bindings/derive.ts::unknownPredicates`

Every claim predicate whose operator is not in `KNOWN_PREDICATE_OPERATORS`, one line each, naming the grammar, the operator, the capture and the claim. The inventory prints them when there are any and fails.

### `packages/codegen/src/bindings/derive.ts::derive`

```text
The derivation over every grammar's binding facts and model. In order: resolve
each grammar's routes (`routes.ts::resolveRoutes`: read entries with their pins,
member routes, container unwraps), and make templates hole members of every
claim in their pattern; fold each read entry's own member routes, claim by claim
in file order, into member types (a slot route's slot resolved, a presence or
a flag an optional `boolean`, a nested member its named kind or the kinds of the slot its
selector finds in its parent; a member is optional when some kind the path is read from in that
grammar does not carry it, a supertype counting as none since its forms stand in for it); fold pinned claims into refinements, each pin
named by the kind's converged member (a capture on the field renames it)
rather than by the grammar's field; assign container captures to
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
placeholder. A container is a kind with a container unwrap among the routes
(`routes.ts::containerOf`). The element slot's terminals and kinds resolve with the container added to
the chain of enclosing kinds, and a container never resolves through itself.
A layout slot is never a member (`routes.ts::isLayout`). A resolution is a
list when the container is a list or a part is, and scalar when a part is
scalar, so a member admitting both reads `T | T[]`.
```

### `packages/codegen/src/bindings/derive.ts::unmappedToken`

The `<grammar:kind>` placeholder for a grammar kind no claim maps, named by the grammar kind itself.

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

### `packages/codegen/src/bindings/derive.ts::Resolution`

What a grammar kind or slot resolves to as a member type: its type tokens (vocabulary paths, `text:` and `literal:` spellings, `boolean`, and `<grammar:kind>` for an unmapped kind), and whether it holds a list or a single value.

### `packages/codegen/src/bindings/derive.ts::MemberFacts`

One member of one vocabulary path as the grammars together describe it: the union of its type tokens, whether any grammar leaves it optional, whether it is a list anywhere or a single value anywhere, and which grammars supply it. It is mutable while the derivation folds the grammars in.

### `packages/codegen/src/bindings/derive.ts::Refinement`

A vocabulary path that refines its parent by literals rather than members: the parent path, and per member the literal texts its pins fix.

### `packages/codegen/src/bindings/derive.ts::Derivation`

Everything the vocabulary derivation finds across the bound grammars, which the inventory prints and checks against the authored vocabulary: the claimed paths and their prefixes, who claims each, the paths derived from content predicates, refinements, template holes, members per path, set-inclusion cycles, and the report lists (untargeted containers, uncaptured slots, unmapped references with their counts, unknown predicates, wildcard containers, wildcard claims with unrouted members).

### `packages/codegen/src/bindings/derive.ts::commonPrefix`

The longest dotted prefix every path shares, or `null` when they share none.

### `packages/codegen/src/bindings/derive.ts::facts`

A fresh, empty `MemberFacts`.

### `packages/codegen/src/bindings/derive.ts::isVocabularyKind`

Whether a member type token names a vocabulary kind, as opposed to an unmapped kind, a text or literal spelling, or `boolean`.

### `packages/codegen/src/bindings/derive.ts::scalarOf`

A single-value `Resolution` over the given tokens; it is a scalar only when it has a token.

### `packages/codegen/src/bindings/derive.ts::collect`

Folds one grammar's templates and claims into the derivation's path set: each template's target and holes become the holes of the paths it serves, every claimed path is recorded, and a claim with predicates marks its path as content-derived for that grammar.

### `packages/codegen/src/bindings/derive.ts::KEY_SEPARATOR`

The separator in an inclusion key, a character no grammar or kind name contains.

### `packages/codegen/src/bindings/derive.ts::inclusionKey`

The key of one grammar's kind in the set-inclusion graph, so the same kind name in two grammars stays two nodes.

### `packages/codegen/src/bindings/derive.ts::childrenOf`

The paths one segment below a path, among the claimed paths and their prefixes, sorted.

### `packages/codegen/src/bindings/derive.ts::claimedBeneath`

The path itself and every claimed path beneath it that is not a refinement, sorted: the kinds a namespace's union spans.

### `packages/codegen/src/bindings/derive.ts::ArmClass`

How a member type token takes part in a union: a scalar, a role (a top-level vocabulary kind), a ref (a path or a set), a text or literal spelling, or unmapped.

### `packages/codegen/src/bindings/derive.ts::Scalar`

The member types that are plain values rather than kinds.

### `packages/codegen/src/bindings/derive.ts::SCALARS`

The `Scalar` names as a set, for `isScalar`.

### `packages/codegen/src/bindings/derive.ts::isScalar`

Whether a member type token is a `Scalar`.

### `packages/codegen/src/bindings/derive.ts::SlotEntry`

One member of one path that the language context states: its path, its member name and its facts.

### `packages/codegen/src/bindings/facts.ts::VOCABULARY_DIR`

The authored vocabulary's directory, `packages/types/src/vocabulary`. The inventory reads the vocabulary from it, and the bindings hash covers its sources.

### `packages/codegen/src/bindings/facts.ts::RefinementKind`

How a refinement claim tells its nodes apart from the claim it refines: a predicate on the captured text, a literal pinned in a field, a token in the pattern, or a child pattern.

### `packages/codegen/src/bindings/facts.ts::RefinedClaim`

A claim with what it refines: `refines` is the deepest path, among all the claims on the same kind in the same placement, that the claim's path extends, so claim order never decides it; and `refinement` is how it tells its nodes apart. A top-level claim that refines nothing still carries a refinement kind when it pins something (a predicate, a field literal or a token); one that pins nothing has none and is a plain claim.

### `packages/codegen/src/bindings/facts.ts::refinementKindOf`

The claim's `RefinementKind`, in order: any predicate, then any field literal, then any token, else a child pattern.

### `packages/codegen/src/bindings/facts.ts::refineClaims`

Every claim as a `RefinedClaim`, derived from the claims alone, so the reader stays a reader and every consumer refines the same way. A wildcard or group claim refines nothing.

### `packages/codegen/src/bindings/facts.ts::bindSelector`

A slot selector, the selectors chained after it, and the neighbours its anchors name, with every kind named by its bound kind.

### `packages/codegen/src/bindings/facts.ts::bindFacts`

The facts with every grammar kind they name (claims and their placements, the kind arguments of `KIND_PREDICATE_OPERATORS` predicates, the selectors of every predicate's and child condition's site, the kinds a child condition names and the selectors of a sibling order, member owners, paths and selectors, the kinds of a claim's match and a member's lead match, containers and their captures, unclaimed kinds) named by its bound kind. The facts are read and written in base names; with the grammar bindings on, a consumer binds them through the node model's stamped `renamedFrom` (`boundNameOf`). A wildcard claim stays a wildcard, and templates name no kinds.

### `packages/codegen/src/bindings/facts.ts::bindSite`

A `CaptureSite` with the kind of each of its `down` selectors named by its bound kind.

### `packages/codegen/src/bindings/vocabulary.ts::readVocabularySource`

Reads the vocabulary's declarations structurally, never by matching lines or calling the compiler. Each file is parsed in the pinned child by the pinned build's TypeScript package (`runPinned`; `pinned-vocabulary.ts::vocabularyDeclaredInProcess` and `vocabularyFeatureIndexInProcess`), so a regeneration of `packages/typescript` cannot move how the vocabulary reads; a failure names its file. This process lists the files and assembles what the child returns:

- **Base kinds:** the namespace files (every top-level source but the augmentation) give the base kinds, each an interface with a string-literal `$kind`. An interface there without one (the context's typemap, `Unmapped`) is not a kind.
- **`modules`:** maps each top-level namespace to the file that declares it. That file is the module the augmentation's `declare module` block for the namespace names.
- **Feature folders:** read whenever `features/` exists (`readFeatures`).

### `packages/codegen/src/bindings/vocabulary.ts::readVocabulary`

The vocabulary as the bindings consult it, assembled from `readVocabularySource`:

- A stub that declares a `$kind` is a kind of its own.
- A stub that does not declare one adds its members to the kind with the same qualified name.
- A member declared more than once is optional when any declaration of it is optional, which is how the augmentation gates it.

Every kind is keyed by its `$kind` and carries its own members (each optional or required, and a flag when `Member.flag` says so), its parent, and the value it is refined by, when it is an owner's refinement. `members(path)` adds the inherited members, nearest first: at each kind on the line its own, then those of the value it is refined by, along the value's own line. So `declaration.function.public.restricted` has the `scope` that `scoped-visibility` gives `modifier.visibility.public.restricted`. `flags` is every name some kind or stub declares as a flag. An interface with no `$kind` and no kind of the same name is not a vocabulary kind.

### `packages/codegen/src/bindings/vocabulary.ts::Declared`

One interface as declared, plain JSON so it crosses the pinned child:
- its qualified name, the namespace path plus the interface name;
- its `$kind` string, if it has one;
- its parent, the qualified name its `extends` clause names through `V.`;
- the value it is refined by, when it is an owner's refinement (`pinned-vocabulary.ts::refinedValue`);
- its own property members (`Member`).

A declaration with a `$kind` is a kind (`DeclaredKind`, `isKind`). In a feature folder, a declaration without one adds members to the kind with the same qualified name.

### `packages/codegen/src/bindings/vocabulary.ts::Member`

A property member, with facts stamped from its parse tree: its name; whether it is optional; whether it is a flag, its type being the marker `Flag` (`FLAG`; a `boolean` member is data); the `V.`-qualified generic types it references (`references`, which the planner's direct-reference check reads); and its type as written in the source. Two declarations of a member have the same type when that text is equal, so the planner's restatement check is formatting-sensitive: the engine's query facet exposes no anonymous tokens and no structural rendering of a parsed node, so a type cannot yet be compared by its tokens.

### `packages/codegen/src/bindings/vocabulary.ts::FLAG`

The marker type a flag is declared with (`utils.ts::Flag`).

### `packages/codegen/src/bindings/vocabulary.ts::REFINED_BY`

The name of the helper an owner's refinement by a value extends (`utils.ts::RefinedBy`). A heritage clause naming it gives the owner as its first type argument and the value as its second.

### `packages/codegen/src/bindings/vocabulary.ts::byCodepoint`

The order every vocabulary list follows: plain string comparison (`<`, by UTF-16 code unit), independent of locale, so the output is the same on every machine.

### `packages/codegen/src/bindings/vocabulary.ts::Feature`

One feature folder:
- the marker interface's name;
- its key, the marker's one member, typed `true`, which a language context declares to compose the feature;
- the features its marker extends;
- its folder, relative to `features/`;
- the declarations in its stub files;
- the stub files its `index.ts` does not re-export with a star export.

### `packages/codegen/src/bindings/vocabulary.ts::FeatureIndex`

What the pinned child reads from a feature's `index.ts`: its marker (`pinned-vocabulary.ts::markerKey`) and the files its star exports name.

### `packages/codegen/src/bindings/vocabulary.ts::readFeatures`

Every folder under `features/`, depth first and in codepoint order, each one a feature. A folder nested in another holds a feature that must extend the outer folder's feature; the planner checks this.

### `packages/codegen/src/bindings/vocabulary.ts::readFeature`

Reads one feature folder. Its marker is the first interface in `index.ts` that is one; a folder without one is refused. The stub files are every other source in the folder (`vocabularySources`). Nested folders are read separately, as features of their own.

### `packages/codegen/src/bindings/vocabulary.ts::isVocabularySource`

Whether a path relative to the vocabulary directory is a source the reader reads: a top-level `.ts` file other than the generated augmentation, or a `.ts` file in a feature folder. The generated `features/index.ts` is not read.

### `packages/codegen/src/bindings/vocabulary.ts::vocabularySources`

Every vocabulary source (`isVocabularySource`), as posix paths relative to the directory, in codepoint order. The reader, the bindings hash and the generated-output manifest all take the vocabulary from this one list, so the staleness stamp covers exactly what the reader reads.

### `packages/codegen/src/bindings/vocabulary.ts::flagSegment`

Reads a claim path whose last segment is a flag of the path before it as that parent path and the flag: `declaration.method.static` claims `declaration.method` with its flag `static`. The segment is matched in snake case against the camel-case member name. A path whose last segment is a kind, a member that is data, or nothing the parent declares is no flag. A path that names a vocabulary kind and is also a flag of its parent is refused: one name names one thing.

### `packages/codegen/src/bindings/vocabulary.ts::resolveFlags`

The facts with their flags resolved against the vocabulary. Each flag claim (`flagSegment`) claims the parent path with its flag (`ClaimFact.flag`). Each rename capture whose name is a flag at a path its owner's claims carry is marked a flag (`MemberFact`), which routes it as a fact rather than as the slot it captures (`routes.ts::flagRouteOf`). A capture that is a flag at one of those paths and data at another is refused: one name names one thing.

### `packages/codegen/src/bindings/pinned-vocabulary.ts::vocabularyDeclaredInProcess`

The interfaces one file declares (`vocabulary.ts::Declared`), kinds and stubs alike, read by the pinned build's TypeScript engine through its typed nodes. It runs in the pinned child (`pinned-reader.child.ts::READS`), never in the workspace process, and imports `@sittir/typescript` for types only (`parsed`).

### `packages/codegen/src/bindings/pinned-vocabulary.ts::vocabularyFeatureIndexInProcess`

A feature `index.ts`'s marker and the files its star exports name (`vocabulary.ts::FeatureIndex`), read in the pinned child.

### `packages/codegen/src/bindings/pinned-vocabulary.ts::parsed`

A file's statements and the reading helpers over them. A file that does not parse cleanly is refused, never read from what the parser recovered: a recovered tree can turn a member into a different one (the TypeScript grammar does not parse an optional property named `abstract` without `readonly`). Every name is compared as written, so one spelled with an escape (`Flag` for `Flag`) is refused rather than read as a different name.

### `packages/codegen/src/bindings/pinned-vocabulary.ts::identifier`

A member's or namespace's name as written, refused unless it is a plain identifier (a keyword such as `static` included): a quoted or computed name would otherwise be read with its quotes or brackets as a different name.

### `packages/codegen/src/bindings/pinned-vocabulary.ts::typescriptReader`

The pinned TypeScript package's kinds and engine, with the pinned build they come from, loaded once per child and shared by every read; a failed load is forgotten so the next read tries again.

### `packages/codegen/src/bindings/pinned-vocabulary.ts::collect`

Walks a file's statements, each read through its wrappers (`unwrap`): a namespace, spelled `namespace` or `module`, adds its name to the scope and is walked in turn, and an interface is declared (`declare`). A module named by a string (`declare module './declaration.ts' { … }`) augments another file and names no namespace, so it is passed over; `augment.ts` is made of such blocks. One that declares a vocabulary kind (an interface with a `$kind`) is refused rather than passed over, since its kind would vanish from the vocabulary.

### `packages/codegen/src/bindings/pinned-vocabulary.ts::unwrap`

The declaration a statement holds, read through every wrapper the TypeScript grammar puts around one: `export`, `export default` and `declare`, and the expression statement a bare `namespace` parses as. The compiler sees each of these as the declaration itself, so the vocabulary reads the same however a declaration is exported or declared.

### `packages/codegen/src/bindings/pinned-vocabulary.ts::Wrapped`

A statement, or what one of the wrappers `unwrap` reads through holds.

### `packages/codegen/src/bindings/pinned-vocabulary.ts::declare`

Records an interface: its qualified name, its path when its `$kind` is a string literal (any other literal, a boolean or a number, makes no kind, as no `$kind` does), its parent (`vocabularyReference`), the value it is refined by (`refinedValue`) and its members (`vocabulary.ts::Member`).

### `packages/codegen/src/bindings/pinned-vocabulary.ts::vocabularyReference`

The vocabulary interface a heritage clause names through `V.`: the first `V.`-qualified type name among its descendants (`engine.query`), however the reference is written, so `SubKindOf<V.X<G>>`, `SubKindOf<(V.X<G>)>` and `V.X` all name `X`. Given a span, only a name inside it counts.

### `packages/codegen/src/bindings/pinned-vocabulary.ts::refinedValue`

The value an owner's refinement is refined by: the `V.`-qualified name inside the second type argument of a `RefinedBy` heritage type (`vocabularyReference` within that argument's span). `RefinedBy<V.Declaration.Function<G>, V.Modifier.Visibility.Public<G>>` gives `Modifier.Visibility.Public`, and the parent stays the owner, the first reference.

### `packages/codegen/src/bindings/pinned-vocabulary.ts::references`

The `V.`-qualified generic types a member's type annotation references, in source order: the names `V.X<…>` spells, read from the parse tree.

### `packages/codegen/src/bindings/pinned-vocabulary.ts::markerKey`

An interface's marker key: its one property member, typed `true`, named by an identifier or a string. An interface with any other shape is not a marker.

### `packages/codegen/src/bindings/pinned-vocabulary.ts::heritageNames`

The names an interface's `extends` clause gives, each without its type arguments: a marker's parent features.

### `packages/codegen/src/bindings/pinned-vocabulary.ts::exportedFrom`

The file a star export (`export * from './x.ts'`) names, without its quotes.

### `packages/codegen/src/bindings/pinned-vocabulary.ts::isNode`

Whether a child is a node rather than an absent child or the kind id that stands for an anonymous token.

### `packages/codegen/src/bindings/hash.ts::bindingsSourceHash`

The SHA-256 of a `bindings.scm` and every vocabulary source the reader reads (`vocabulary.ts::vocabularySources`), each keyed by its path relative to the vocabulary directory in posix form, in path order, over their bytes. An edit to, a move of or a deletion of any of them marks the grammar bindings stale; the generated `augment.ts` and `features/index.ts` are not read, so not hashed. Nothing is parsed, so the hash is checked without the scm parser.

### `packages/codegen/src/bindings/hash.ts::grammarBindingsHash`

`bindingsSourceHash` of a grammar's own `bindings.scm` and the vocabulary.

### `packages/codegen/src/bindings/hash.ts::REGENERATE_BINDINGS_COMMAND`

The command that writes every `grammar.bindings.ts`. The module's banner and the stale-bindings refusal both name it.

### `packages/codegen/src/bindings/hash.ts::StaleBindingsError`

Generation refused over a grammar's committed grammar bindings: missing, or derived from other sources than the grammar's `bindings.scm` and the vocabulary now.

### `packages/codegen/src/bindings/hash.ts::assertBindingsFresh`

Codegen's check of a grammar's committed `grammar.bindings.ts`: a grammar with a `bindings.scm` must commit the module, and the hash the module's `bindings({ hash, … })` carries must equal the hash of `bindings.scm` and the vocabulary now. Otherwise it throws `StaleBindingsError` naming `REGENERATE_BINDINGS_COMMAND`. A grammar with no `bindings.scm` passes. It runs whether the grammar bindings are on or off, since the facts codegen reads come from `bindings.scm` itself and the grammar bindings must agree with them. `compileGrammar` runs it after its diagnostic gate; the base grammar's own staleness is the generated-output freshness check's.

### `packages/codegen/src/bindings/grammar-bindings.ts::GrammarBindingsEdit`

One grammar change at a patch position: a field of the member's name, or an alias of a symbol to its bound name.

### `packages/codegen/src/bindings/grammar-bindings.ts::GrammarBindingsPatch`

An `GrammarBindingsEdit` at a patch path of its rule, in the patch stage's path syntax.

### `packages/codegen/src/bindings/grammar-bindings.ts::GrammarBindings`

The derived grammar bindings: per rule, its patch sets (field edits first, then alias edits); the kind renames; the leads (`leads.ts::deriveLeads`); and the splits. `printBindingsModule` prints it as the `Bindings` the grammar applies.

### `packages/codegen/src/bindings/grammar-bindings.ts::GrammarBindingsResidue`

A claim or member the derivation did not turn into a grammar change, with the cause.

### `packages/codegen/src/bindings/grammar-bindings.ts::GrammarBindingsReport`

What the derivation realized and left: the claim and member totals, the aliases, field renames and field wraps behind the patches, the claims realized as kinds (and those realized by their parent), the members realized as field names and the implicit routes fielded, and the residue. The inventory prints it as convergence.

### `packages/codegen/src/bindings/grammar-bindings.ts::GrammarBindingsInput`

The derivation's inputs: the `bindings.scm` path its diagnostics name (`file`), its binding facts in base names, its grammar evaluated without its grammar bindings, each vocabulary path's members, the ones its interface declares and the ones it inherits (a member an interface inherits is its member), and each claimed kind's member routes as `resolveRoutes` gives them over the model of the grammar compiled without its grammar bindings (`routedMembers`).

### `packages/codegen/src/bindings/names.ts::boundKindName`

The bound name of a vocabulary path: its segments reversed, subkind first, keeping hiddenness (`declaration.function` is `function_declaration`; a hidden kind's is `_function_declaration`). The one place the naming lives. Callers pass the base rule name's hiddenness by tree-sitter's own convention (`rule-patterns.ts::isParserHiddenName`): a bound name keeps the rule's hiddenness, so the rename never flips it. Parse-tree visibility is a different fact: the catalog stamps every supertype hidden, visible rule name or not.

### `packages/codegen/src/bindings/grammar-bindings.ts::memberFieldName`

A vocabulary member's field name: its camelCase name in snake case, so every slot a member reaches is named by the member.

### `packages/codegen/src/bindings/grammar-bindings.ts::isLift`

A group lift at the patch stage: the symbol enrich's group lift leaves in a rule, unless it is a variant's arm (a rule of its own at the patch stage).

### `packages/codegen/src/bindings/grammar-bindings.ts::isGroupAlias`

The alias enrich wraps a visible group in.

### `packages/codegen/src/bindings/grammar-bindings.ts::FieldRequest`

A field edit the derivation asks bind for: a rename of an existing field or a wrap of an unfielded child.

### `packages/codegen/src/bindings/grammar-bindings.ts::SINGLE`

The rule types with one `content` child, which the patch walk descends at path index `0`.

### `packages/codegen/src/bindings/grammar-bindings.ts::metaOf`

A rule's `metadata` record, or an empty one.

### `packages/codegen/src/bindings/grammar-bindings.ts::fieldOfReference`

The field a rule holds a reference to a child kind in, if any.

### `packages/codegen/src/bindings/grammar-bindings.ts::targetKey`

What a field request edits: a field of the owner by its name, or the owner's token or symbol it wraps.

### `packages/codegen/src/bindings/grammar-bindings.ts::fieldKey`

The field a request leaves on its owner.

### `packages/codegen/src/bindings/grammar-bindings.ts::deriveGrammarBindings`

```text
The grammar bindings from a grammar's facts, against its grammar evaluated
without them. Claims: a kind is named by its first plain top-level
claim, the first in file order as in `resolveRoutes`: that claim renames the
kind to its path's bound name. A further kind named by the same path aliases to
it only when nothing about its shape tells it from the path's first kind
(`sameShapeAs`); otherwise it is kept apart under its own grammar name, and a
path left with one kind is renamed as a single claim is.
A later plain claim on the kind stays a mapping, as a refinement does. A placed
claim splits its kind by placement, its containers named by the placement's
bound name and the member that holds them. Renames apply at once, so a name is
free when its holder is renamed away; an alias target must be free too;
clashing ones are dropped until stable, and a kind claiming its own parent's
path is realized by the parent, its arms staying the parent's variants.

Members: a member the vocabulary kind naming its owner does not declare stays
a mapping. A flag reads structure the grammar already has and
needs no field; every other member becomes a field. A member routed to a whole field
renames that field; a member routed to an unfielded child, or to a token's
presence, wraps the child or token in a field of the member's name. A child or
token the bindings leave unfielded may already sit in a field of the enriched
base. A vocabulary member with no route resolves implicitly when the owner has
an unfielded child whose kind spells it. One target feeding several members,
or two fields routing to one member, are refused. A field in a hidden rule
several kinds share is edited in place only when every kind reaching it asks
for the same edit; an edit counts only while it is itself accepted, so the
batch narrows until it agrees with itself.

Everything not turned into a grammar change is residue, with its cause.
```

Leads: `deriveLeads` derives them from the same facts against the same grammar, and its `lead-refused` records come back beside the bindings as `diagnostics`, which the writer gates on.

### `packages/codegen/src/bindings/grammar-bindings.ts::sameShapeAs`

The kinds one path names that the grammar bindings may merge under the path's name: the path's first kind and every further kind that supplies the same member names, where neither is read as a kind (a flag's kind). A kind's members are its routed members (`GrammarBindingsInput.routedMembers`): its captures, renamed, and every other non-layout slot by its property name, so a slot no claim captures still tells two kinds apart (python's `assignment_typed` carries a `type` that `assignment_eq` lacks). A form restricted to a context is a legitimate merge: python's `lambda_within_for_in_clause` supplies `lambda`'s `parameters` and `body`, and differs only in what its body admits. It is the other face of injectivity: two kinds share a vocabulary leaf only where a holder's flag or a member's absence tells them apart, and a kind told apart that way keeps its own grammar kind so the reader and the builder can tell it. Containment is no distinction: a container member admitting both kinds does not keep them apart.

### `packages/codegen/src/bindings/grammar-bindings.ts::grammarBindingsPatches`

```text
The grammar changes as patch-stage edits. bind.ts's field renames and wraps
stay the one derivation of what changes; this only finds where, walking each
rule before and after the edit side by side and turning every difference into
a patch at that position. Enrich's group lifts and visible-group aliases are
transparent at the patch stage, as are precedence wrappers, so the walk passes
through them without a path segment, and a lift's body is patched through the
first rule reaching it; an edited lift no rule reaches is an error. Alias
patches are found the same way over the fielded rules, dropping sites already
directly under an ALIAS.

A set whose keys are all plain indices is read flat: a key indexes the members
of the first SEQ under the root, and on a CHOICE root inside every arm. The
walk's paths mean path mode, where a CHOICE root's index picks the arm, so such
a key is written as the same position counted from the end, which reads in path
mode.
```

### `packages/codegen/src/bindings/module.ts::bindingsModulePath`

A grammar's `grammar.bindings.ts`, beside its `grammar.sittir.ts`.

### `packages/codegen/src/bindings/module.ts::printBindingsModule`

The generated `grammar.bindings.ts`: its default export is the grammar bindings with the hash of the sources it was derived from (`bindings({ hash, patches, renames, leads, splits })`, the leads sorted by list and each written as `lead(…)` over its `match(…)` tree, `matchCall`), and nothing else; codegen reads the facts from `bindings.scm` through the pinned reader, never from the module. It imports only the authoring helpers it calls, and is erasable syntax only, since tree-sitter's run of the grammar evaluates it too. `grammar.sittir.ts` passes them as `bindings` only while the grammar bindings are on.

### `packages/codegen/src/bindings/module.ts::loadBindingsModule`

A package's committed `grammar.bindings.ts`, imported outside the grammar's evaluation (with the DSL globals its authoring helpers call installed, `withDslGlobals`), or `undefined` when the package commits none. `compileGrammar` reads its hash for `assertBindingsFresh`.

### `packages/codegen/src/bindings/module.ts::editCall`

An `GrammarBindingsEdit` as the authoring call that makes it.

### `packages/codegen/src/bindings/module.ts::patchSet`

One rule's patch set as an object of patch paths to authoring calls.

### `packages/codegen/src/bindings/module.ts::list`

Printed entries as an array, `[]` when there are none.

### `packages/codegen/src/bindings/module.ts::BINDINGS_MODULE`

The file name of a grammar's committed grammar bindings, beside its `grammar.sittir.ts`.

### `packages/codegen/src/bindings/module.ts::q`

A string as a quoted TypeScript literal, for the emitted grammar-bindings module.

### `packages/codegen/src/bindings/flags.ts::FLAGS_PATH`

The vocabulary's generated flags module, `flags.ts` in `VOCABULARY_DIR`. The inventory writes it from the vocabulary's `Flag` declarations, and it is the one file there that is not authored. The bindings hash covers it with the rest of the vocabulary, so `--write` writes it before any `grammar.bindings.ts`.

### `packages/codegen/src/bindings/flags.ts::FLAG_BITS`

The flags one bitflag word holds: 31, below the sign bit, so every bit is a positive number that `|` and `&` keep.

### `packages/codegen/src/bindings/flags.ts::flagMembers`

The members of the generated flags module: one bit per flag name, in name order, each named by its TypeScript name (`byReference` is `ByReference` at bit 3). A name has one bit wherever it is declared, so `Flags.Static | Flags.Async` is the same number in every language. More names than `FLAG_BITS` are refused, naming the ones past the word, since their bits need a second word, which is designed when one is needed. A feature never adds a member to the enum, since a member added by augmentation has no bit at run time. `printFlagsModule` in tools builds the module from these members.

### `packages/codegen/src/bindings/flags-module.ts::flagsModuleInProcess`

Builds the flags module from its members with the pinned build's `@sittir/typescript` factories and renders it with the pinned engine (tab indent). It runs only in the pinned reader's child, as the `flagsModule` mode, and loads the build through `loadPinnedBuild`, so the writer's output depends on the pin and not on the workspace's generated package. The header comment names `REGENERATE_BINDINGS_COMMAND`, the one source of the regenerate command.

### `packages/codegen/src/bindings/pinned-reader.ts::module`

The `bindings.scm` reader, over the pinned `@sittir/scm` build (`bootstrap/pinned.ts::loadPinnedBuild`). It imports `@sittir/scm` and `@sittir/common` for types only: every value it uses comes from the pinned build, so the facts depend on the pin and not on the workspace's packages.

### `packages/codegen/src/bindings/pinned-reader.ts::ready`

Loads the pinned build once and keeps its kinds, its engine and the span helpers for every later read; a failed load is forgotten so the next read tries again.

### `packages/codegen/src/bindings/pinned-reader.ts::readBindingsInProcess`

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
kind, routed through the kinds in between. A second single-segment member
capture on a node is the presence of that node's kind in the slot the first
names (a flag: `name: (private_property_identifier) @name @private`), and the
first then names the whole slot. A pattern that captures
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

A file is refused with `BindingsSyntaxError`, naming the lines, when its parse root names a region that did not parse (`$errors`, each `ERROR` and `MISSING` region with its span), or when a non-blank file parses to no pattern; a malformed pattern the parse absorbs without a trace passes here and is caught by the compile gate (`compileQuery`).

The scm engine behind it is the pinned build's (`ready`), created by the first read and shared by the rest. The module runs only in the reader's own process (`pinned-reader.child.ts`); codegen and the inventory read through `read.ts`.


It runs only in the reader's child process; everything else reads through `read.ts::readBindings`, which sends the request there. The `InProcess` names keep the two apart at an import.
### `packages/codegen/src/bindings/pinned-reader.ts::kindPresence`

The flag a further single-segment capture on a node makes: the presence of the node's kind in the slot the node's first member capture names, owned by that member's owner. A node whose first capture is a token's presence has no slot to name, so its further captures are read as ordinary members.

### `packages/codegen/src/bindings/pinned-reader.ts::slotNamed`

A node's member captures with the first naming its whole slot when a flag follows it: a fielded rename drops its kind selector, since the flag, not the first capture, says which arm of the slot is present.

### `packages/codegen/src/bindings/pinned-reader.ts::parsedPatterns`

`patternsIn` over the file's parse (`parsedBindings`). `readBindingsInProcess` reads the patterns of the same parse, so a container's facts record the line and text given here, and `bindingPatternsInProcess` summarizes each one for the inventory's issue check.

### `packages/codegen/src/bindings/pinned-reader.ts::bindingPatternsInProcess`

Each top-level pattern as a `BindingPattern`: its line, its source text and every field, node kind and token it references (`referencesIn`).

### `packages/codegen/src/bindings/pinned-reader.ts::predicateFact`

A pattern's `#…?` predicate as a fact: its operator (the name between `#` and `?`), the capture it tests when its first parameter is one (a property predicate such as `#is-not? local` tests none, so its capture is `null` and every parameter is an argument), and its arguments, each a capture or text (a string's value, or a bare identifier). A directive (`#…!`, `#set!`) is not a predicate and gives none. Every operator is kept, known or not; the derivation reports the ones it does not know. Its `subject` depends on the claim, so the pattern's predicates are read once without it and each claim places them (`captureSite`).

### `packages/codegen/src/bindings/pinned-reader.ts::captureSite`

A predicate capture's `CaptureSite` for one claim. It walks from the claimed node outward, through the pattern's named nodes only, to the first node that holds the capture, counting each step up, and records the selectors from there down to the capture. It is `null` when the capture names no node in the pattern, or when only a group holds both.

### `packages/codegen/src/bindings/pinned-reader.ts::siteOf`

The `CaptureSite` of a visited node below a claim: like `captureSite`, it walks out from the claimed node through named nodes only, counting each step up, to the first that holds the node, and records the selectors from there down, skipping groups. It is `null` when no enclosing node holds it.

### `packages/codegen/src/bindings/pinned-reader.ts::mayBeAbsent`

Whether a visited node may be missing from a match: it, or an alternation enclosing it, carries a `?` or `*` quantifier. Such a node states no condition.

### `packages/codegen/src/bindings/pinned-reader.ts::leadsToPresence`

Whether a visited node is, or leads down to, a captured token: the path to a presence member, which the member's own route tests, so it states no child condition.

### `packages/codegen/src/bindings/pinned-reader.ts::placesClaim`

Whether a visited node is, or holds, a capture of a vocabulary path that is not a token class: a claim placed below this one, which is read as its own claim rather than tested as a condition of the outer one.

### `packages/codegen/src/bindings/pinned-reader.ts::capturesMember`

Whether a visited node carries a member capture: a name that is not a vocabulary path, not hidden (`_`-prefixed) and not `element`.

### `packages/codegen/src/bindings/pinned-reader.ts::siblingsOf`

A pattern node's node children in order, through its groupings: no token, no alternation's option, and no node the pattern makes optional, since tree-sitter matches each of the others to its own child node.

### `packages/codegen/src/bindings/pinned-reader.ts::childFacts`

The `ChildFact`s a claim's pattern states below the claimed node, walked in pattern order. Each node walked, the claimed one included, first states its `siblingsOf` in order when it has more than one or one is anchored. A node that may be absent, leads to a presence capture or places another claim states nothing. An alternation's options give one fact listing their kinds, and each option must be a named node with nothing below it. An option with tests below it is refused everywhere: a read test is a conjunction over slots, so no route could say one arm's test without saying it of every arm. A token under a field gives a text fact; a token with no field gives a token fact at the node holding it, whose slot the routes resolve (a token directly under the claimed node is a claim token instead). A named child gives a kinds fact and is walked into; a wildcard gives a presence fact unless it captures a member, whose own route then stands for it.

### `packages/codegen/src/bindings/pinned-reader.ts::roundTripBindingsInProcess`

Parses a `bindings.scm` with the pinned engine and renders the parsed root back (`BindingsRoundTrip`). The test over every grammar's `bindings.scm` is the gate a change of pin runs.

### `packages/codegen/src/bindings/pinned-reader.ts::Kinds`

The pinned scm build's kind-id table, whose members the reader compares `$type` against.

### `packages/codegen/src/bindings/pinned-reader.ts::Engine`

The scm language engine type, over the `ScmAPI` the type-only import names.

### `packages/codegen/src/bindings/pinned-reader.ts::K`

The pinned build's kinds, set by `ready`. Every kind comparison in the reader goes through it, so the ids come from the pin and not from the workspace's `@sittir/scm`.

### `packages/codegen/src/bindings/pinned-reader.ts::engine`

The pinned build's scm engine, created once by `ready` and shared by every read.

### `packages/codegen/src/bindings/pinned-reader.ts::sourceSpans`

The pinned build's span helper, which converts UTF-8 byte spans to string indices for slicing a pattern's text and counting its line.

### `packages/codegen/src/bindings/pinned-reader.ts::isErrorNode`

The pinned build's test for an ERROR region carried as trivia; `unparsed` uses it.

### `packages/codegen/src/bindings/pinned-reader.ts::spanOf`

The pinned build's span of a parsed node or trivia item.

### `packages/codegen/src/bindings/pinned-reader.ts::loaded`

The pending load `ready` shares across reads; cleared when the load fails so a later read retries it.

### `packages/codegen/src/bindings/pinned-reader.ts::Expression`

What a named node's or grouping's group holds: a definition, a negated field, or an alternation arm.

### `packages/codegen/src/bindings/pinned-reader.ts::PatternNode`

A node the reader visits as part of a pattern: a named node, an anonymous token or a grouping.

### `packages/codegen/src/bindings/pinned-reader.ts::ParsedPattern`

A top-level definition with its origin (line and source text).

### `packages/codegen/src/bindings/pinned-reader.ts::Visit`

One visited pattern node: the node, the field it sits under, the anchor that pins it to an end of its parent's children, whether an anchor joins it to the sibling before it (`adjacent`), its parent visit, the alternation it is one option of (`alternation`, the alternation expression, so its sibling options are found by identity; `null` outside one), the list elements (captures, quantifiers) an enclosing alternation hands it (`inherited`), and its child visits in order.

### `packages/codegen/src/bindings/pinned-reader.ts::Anchored`

An expression of a pattern node's group with the anchor its position gives it, and whether an anchor joins it to the expression before it.

### `packages/codegen/src/bindings/pinned-reader.ts::Pattern`

A pattern as read: its top visit, every visit in order, and the predicates it carries.

### `packages/codegen/src/bindings/pinned-reader.ts::Facts`

The mutable fact lists `readBindingsInProcess` fills, one per fact kind, returned as `BindingFacts`.

### `packages/codegen/src/bindings/pinned-reader.ts::stringValue`

A query string's value, with escape sequences resolved to the characters they stand for.

### `packages/codegen/src/bindings/pinned-reader.ts::lineOf`

The 1-based line a byte offset falls on, counted over the string index the span helper converts it to.

### `packages/codegen/src/bindings/pinned-reader.ts::parsedBindings`

The file parsed to full depth by the pinned engine: the root whose `$errors` name the regions that did not parse, and whose definitions are the file's patterns.

### `packages/codegen/src/bindings/pinned-reader.ts::patternsIn`

Each top-level definition of a parsed root with the line it starts on and its source text, sliced by the node's byte span through `sourceSpans` (spans count UTF-8 bytes, and the bindings files carry multibyte comment rules).

### `packages/codegen/src/bindings/pinned-reader.ts::captures`

The capture names on a visit, its own and those an enclosing alternation hands it.

### `packages/codegen/src/bindings/pinned-reader.ts::quantified`

Whether a visit repeats: a `*` or `+` on it or handed to it.

### `packages/codegen/src/bindings/pinned-reader.ts::kindOf`

The kind a visit names: a named node's name (`WILDCARD` for `(_)`), a supertyped node's subtype, `WILDCARD` for an anonymous `_`, and `null` for a token or a grouping.

### `packages/codegen/src/bindings/pinned-reader.ts::namedKind`

`kindOf` with a wildcard read as no kind.

### `packages/codegen/src/bindings/pinned-reader.ts::tokenText`

An anonymous token's text, or `null` for anything else.

### `packages/codegen/src/bindings/pinned-reader.ts::isGroup`

Whether a visit is a grouping.

### `packages/codegen/src/bindings/pinned-reader.ts::atTop`

Whether a visit is the pattern's top node, or a direct child of a top-level grouping: the positions where a single-segment capture is a claim.

### `packages/codegen/src/bindings/pinned-reader.ts::UNCLAIMED`

The capture that declares the captured kind unclaimed.

### `packages/codegen/src/bindings/pinned-reader.ts::DROPPED`

The capture that marks a slot as left out on purpose: a container's, or, in a claim, the slot of the node it sits under.

### `packages/codegen/src/bindings/pinned-reader.ts::isPath`

Whether a capture names a vocabulary path (it has a `.`).

### `packages/codegen/src/bindings/pinned-reader.ts::TOKEN_CLASSES`

The capture namespaces that classify tokens (`keyword`, `punctuation`) and name no vocabulary kind.

### `packages/codegen/src/bindings/pinned-reader.ts::inClaimPosition`

Whether a capture sits where it would claim a kind: a path anywhere, or a non-`_` single segment at the top.

### `packages/codegen/src/bindings/pinned-reader.ts::isTokenClass`

Whether a capture is in a token-class namespace.

### `packages/codegen/src/bindings/pinned-reader.ts::isClaim`

Whether a capture is a claim: in claim position and not a token class.

### `packages/codegen/src/bindings/pinned-reader.ts::placement`

The `SlotSelector` that finds a visit's slot in its parent, with its edge anchor: its field, else its named kind, else (a wildcard or grouping) the placement of the nearest earlier sibling that is not a token, as `after`, or no `after` at all when nothing precedes it.

### `packages/codegen/src/bindings/pinned-reader.ts::neighbour`

A sibling's `placement` without its anchor: what an `Adjacent` names it by.

### `packages/codegen/src/bindings/pinned-reader.ts::selector`

A visit's `placement`, with `adjacent` naming the siblings an anchor joins it to, when one does.

### `packages/codegen/src/bindings/pinned-reader.ts::joined`

Whether an anchor joins a visit to the sibling before or after it.

### `packages/codegen/src/bindings/pinned-reader.ts::refuse`

Throws the reader's refusal of a pattern that parses but states something no fact expresses, naming the pattern's line.

### `packages/codegen/src/bindings/pinned-reader.ts::SIBLING_ANCHOR`

The refusal of an anchor between two grouped patterns (`((a) . (b))`): a grouping's patterns share no parent node below a claim, so no slot holds them.

### `packages/codegen/src/bindings/pinned-reader.ts::anchorAt`

The anchor of the expression at `index` in a named node's group: `first` for the first one when the group opens with `.`, `last` for the last one in the anchored-last variant, and `only` for a parent's one child anchored on both sides.

### `packages/codegen/src/bindings/pinned-reader.ts::Joined`

An expression of a named node's group in sibling order, and whether an anchor joins it to the one before it.

### `packages/codegen/src/bindings/pinned-reader.ts::joinedOf`

A named node group's expression as the sequence of sibling expressions it stands for: an arm (`left . right`) is its left side's sequence, then its right side's, whose first expression an anchor joins to the one before it.

### `packages/codegen/src/bindings/pinned-reader.ts::expressionsOf`

The expressions a pattern node holds, each with its anchor (`anchorAt`) and whether an anchor joins it to the one before: a named node's group (with the anchored-last variant's `last` appended, its arms flattened by `joinedOf`), a grouping's group expressions, and none for a token. A grouping's anchors sit between siblings and are refused (`SIBLING_ANCHOR`).

### `packages/codegen/src/bindings/pinned-reader.ts::readPattern`

A pattern as a tree of visits, each carrying the anchor its position gives it. A field definition places its definition under the field, and an alternation places each option as an alternative carrying the alternation's elements, both keeping the anchors; predicates are collected; a negated field and a missing node place nothing. An arm between grouped patterns is refused (`SIBLING_ANCHOR`), as is an anchor on a predicate, a negated field or a missing node, which pins no child, and an anchor on a token, a grouping, an alternation or an optional node (`refuseLooseAnchors`).

### `packages/codegen/src/bindings/pinned-reader.ts::refuseLooseAnchors`

Refuses an anchor on a child that is a token, a grouping, an alternation's option or a node the pattern makes optional: tree-sitter's anchor names the nodes it ties together, and none of these is one node that is always there.

### `packages/codegen/src/bindings/pinned-reader.ts::templateOf`

A `#match?` predicate as a template, when its regex is anchored at both ends and has named holes: the regex with each hole replaced by `${string}`, and the hole names in order.

### `packages/codegen/src/bindings/pinned-reader.ts::claimFact`

The `ClaimFact` for a claim capture on a visit: its kind (a grouping's first child's), field, the pattern's predicates placed for this claim (`captureSite`), whether it is at the top, the kinds enclosing it (nearest first), its field literals (the literal a field pins, outside a grouping) and its unfielded uncaptured tokens. An alternative's tokens are not pins. A claimed node with tests below it carries its `match` when `matchOf` reads one that restricts it.

### `packages/codegen/src/bindings/pinned-reader.ts::memberFact`

The `MemberFact` for a member capture on a visit. The capture belongs to its home: the nearest claimed node above it, or the top when none is claimed in between (`claimedHome`). A `@dropped` capture drops the slot its selector finds on its parent's kind. On a child of the home (or under a top grouping) it renames the slot its selector finds, or marks an unfielded token's presence. Deeper, it is a nested member of the home's kind (or the presence of a token) routed through the selectors of the nodes between. A capture directly under a grouping names no member. The fact carries the claims on its owner's node (the parent for a direct capture, the home for a deeper one) as `claims`, and, for a capture on a node anchored first, the lead match its caller read (`leadMatch`).

### `packages/codegen/src/bindings/pinned-reader.ts::claimedHome`

The node a member capture belongs to: walking up from the capture's parent, the first node that carries a claim, or the pattern's top when no node below it does. A capture below a placed claim (`(impl_item_body (declaration_list (function_item … @scope) @declaration.method))`) is a member of the claimed `function_item`, not of the `impl_item_body` the pattern starts at.

### `packages/codegen/src/bindings/pinned-reader.ts::refuseAnchoredPlacement`

Refuses a claim whose own node or an enclosing node is anchored, at an edge or to a sibling. A claim's placement is read upward, as the kinds enclosing it, and no fact states an enclosing node's position; an anchor constrains only a step below the claimed node.

### `packages/codegen/src/bindings/pinned-reader.ts::containerFact`

The `ContainerFact` for a container pattern: the container kind, its element's selector, each other capture (its name, token text, quantifier and selector), the selectors of the `@dropped` slots, the reason, and the pattern's origin. A container reads every child of its kind, so an anchor in its pattern is refused.

### `packages/codegen/src/bindings/pinned-reader.ts::reasonOf`

The text of a pattern's `#set! reason "…"`, or `null`.

### `packages/codegen/src/bindings/pinned-reader.ts::patternFacts`

Reads one pattern into the fact lists. An `@unclaimed` pattern only declares kinds unclaimed. A pattern whose single top owner carries no claim and captures `@element` is a container. Otherwise every template predicate is a template over the pattern's vocabulary captures; the claims are read first, each visit's in order, so each member knows the claims on its owner's node; then each visit's member captures in order, a further single-segment member on a node being that node's kind presence (`kindPresence`, `slotNamed`), with the claims of the member it follows.

### `packages/codegen/src/bindings/pinned-reader.ts::patternsOf`

The patterns a top-level definition holds: itself, or each option of a top-level alternation carrying the alternation's elements.

### `packages/codegen/src/bindings/pinned-reader.ts::referencesIn`

Every node kind, token and field an expression references, in order, for the inventory's check against the parser. `ERROR` and the wildcard are not references.

### `packages/codegen/src/bindings/pinned-reader.ts::groupReferences`

The references in a named node's group, its anchored-last `last` included.

### `packages/codegen/src/bindings/pinned-reader.child.ts::module`

The pinned build's process. It reads requests from stdin, one JSON `PinnedReaderRequest` per line, answers them in order with the run their mode names, and writes each reply as `PINNED_READER_MARKER` and one JSON `PinnedReaderReply` line on stdout. A `BindingsSyntaxError` is replied as its lines and any other failure as its stack, so one bad file does not stop the reads after it. It exits once stdin closes and the last reply is written.

### `packages/codegen/src/bindings/pinned-reader.child.ts::READS`

The run each request mode names in the child process, typed by its row of `PinnedReaderModes`.

### `packages/codegen/src/bindings/pinned-reader.child.ts::run`

Runs one request's mode on its input.

### `packages/codegen/src/bindings/pinned-reader.child.ts::answer`

One request's reply: its value, the syntax error's lines, or any other error's stack, so the parent can rebuild the error it would have thrown in process.

### `packages/codegen/src/bindings/pinned-reader.child.ts::queue`

The chain of pending answers, so replies leave in request order and the process exits only after the last one when its input closes.

### `packages/codegen/src/bindings/read.ts::module`

The public face of the pinned build: codegen's every run of a sittir package on its own inputs goes through it. The runs happen in a child process because tsx resolves the root `tsconfig.json` paths for every file it loads, inside the bootstrap directory too, so an in-process import of the pinned build would load the workspace's `@sittir/common` beside the pinned one. The child runs under `tsconfig.pinned.json`, which maps no paths. A process starts one child, on its first read, and sends every later read to it, so a run pays the start-up once (`bootstrap/bootstrap.ts::module` records the cost) whatever grammars and modes it reads.

### `packages/codegen/src/bindings/read.ts::PinnedReaderRequest`

One run sent to the child: the id its reply carries, the mode and the mode's input.

### `packages/codegen/src/bindings/read.ts::PinnedReaderReply`

The child's answer to one request, by its id: the read's value, the lines of a `BindingsSyntaxError`, or another failure's stack.

### `packages/codegen/src/bindings/read.ts::startReader`

Starts the child and routes its marked stdout lines to the reads waiting on them (`settle`). The child's stdio is piped, so its streams are sockets; the cast to `ChildProcessByStdio<Socket, Socket, Socket>` exposes their `ref`/`unref`, which `hold` needs. When the child fails or exits, every waiting read is rejected with what it wrote to stderr, and the next read starts a new child.

### `packages/codegen/src/bindings/read.ts::hold`

Keeps the child and its streams referenced while a read is waiting and unreferenced while none is, so an idle reader never holds the process open and a waiting read always does.

### `packages/codegen/src/bindings/read.ts::settle`

Resolves the read a reply answers, rethrowing a reply of syntax lines as `BindingsSyntaxError`.

### `packages/codegen/src/bindings/read.ts::PINNED_READER_MARKER`

Marks where the reply starts on the child's stdout, so anything the pinned build prints before it is skipped.

### `packages/codegen/src/bindings/read.ts::runPinned`

Sends one run to the process's child, starting it on the first run, and waits for its reply, typed by the mode's row of `PinnedReaderModes`. The reply crosses the process as JSON, so its value is the mode's output by the child's contract, not by a check.

### `packages/codegen/src/bindings/read.ts::PinnedReaderModes`

Every mode the child runs, with its input and its output: one row per run, which `READS` implements in the child and `runPinned` calls in the parent. A mode's input and output are plain JSON values.

### `packages/codegen/src/bindings/read.ts::PinnedInput`

A mode's input (`PinnedReaderModes`).

### `packages/codegen/src/bindings/read.ts::PinnedOutput`

A mode's output (`PinnedReaderModes`).

### `packages/codegen/src/bindings/read.ts::readBindings`

A `bindings.scm` read into `BindingFacts` by the pinned reader.

### `packages/codegen/src/bindings/read.ts::bindingPatterns`

A `bindings.scm`'s top-level patterns as `BindingPattern`s, read by the pinned reader.

### `packages/codegen/src/bindings/read.ts::roundTripBindings`

A `bindings.scm` parsed and rendered back by the pinned engine (`BindingsRoundTrip`).

### `packages/codegen/src/bindings/read.ts::PinnedReaderMode`

Which run a request asks the child for: a row of `PinnedReaderModes`.

### `packages/codegen/src/bindings/read.ts::PendingRead`

A request waiting on its reply: its mode, which a failure names, and the promise callbacks it settles.

### `packages/codegen/src/bindings/read.ts::PinnedReader`

The running child: the process, the requests waiting by id, the next id, and the stderr it has written, which a failure reports.

### `packages/codegen/src/bindings/read.ts::requireFromHere`

A `require` resolved from this module, used to locate the files the child is started with.

### `packages/codegen/src/bindings/read.ts::reader`

The one child every read shares, started by the first read and replaced if it exits.

### `packages/codegen/src/bindings/facts.ts::bindingsPathIn`

The `bindings.scm` of the grammar package in a directory. The one spelling of the file's name; compile and generate reach it through the package they were given.

### `packages/codegen/src/bindings/facts.ts::bindingsPath`

The `bindings.scm` of a grammar by name, in its package directory.

### `packages/codegen/src/bindings/facts.ts::bindingGrammars`

The grammars that ship a `bindings.scm`, in `allGrammars` order.

### `packages/codegen/src/bindings/names.ts::module`

The naming rules the bindings share: `snake` and `camel` between a grammar's field and slot spellings and member names, and `tsname` for a vocabulary path segment as a type name.

### `packages/codegen/src/bindings/names.ts::snake`

A camelCase name in snake_case: a member's field name.

### `packages/codegen/src/bindings/names.ts::camel`

A snake_case name in camelCase, leading underscores dropped: a slot or capture name as a member name.

### `packages/codegen/src/bindings/names.ts::tsname`

A snake_case path segment as a PascalCase type name.

### `packages/codegen/src/bindings/routes.ts::module`

One grammar's route resolution: how each claimed kind reads as the vocabulary kinds it can be, which members it has and where each one reads from, how each kind unwraps to its element, and the path each member is built back through. `derive` folds member types from these routes, and the portable namespaces and builders read them, so the decisions are made once. The low-level build's own routing (the seat table and its mounts in the node model) is not a route: the validation lanes build through the low-level API, whose nodes carry their concrete kind.

### `packages/codegen/src/bindings/routes.ts::GrammarInput`

One grammar as the bindings derivation sees it: its binding facts (bound to the grammar's kind names), its slot model, its minted text tokens and its layout slots (`LayoutSlot`: an options-block address or the separator, by owner kind or any).

### `packages/codegen/src/bindings/routes.ts::ReadEntry`

A grammar kind read as one vocabulary kind: the kind the claim captured (`claimed`; the kind itself unless the reader stores the captured node as a member's kind id, `readKinds`), the claim, its position in `bindings.scm` (`index`), the pins that tell its nodes apart (`Pin`), the tests on the nodes below it (`ChildTest`), the template it builds from when its predicate has named holes, and its own member routes (`membersOf` under the entry's `guaranteedBy`).

### `packages/codegen/src/bindings/routes.ts::Pin`

A literal a claim fixes in a slot: a field literal, or a token the claim names that a slot's terminals hold. It is named by the slot's member, so a refinement and its build agree with the member a capture renamed.

### `packages/codegen/src/bindings/routes.ts::MemberRoute`

Where a member of a claimed kind reads from: a `slot` of the kind; the `presence` of a token in a slot reached through the `via` kinds; the presence of a `kind` in the slot another member of the kind names (a flag, its `path` that slot's); the claimed node itself (`self`, its `path` empty); or a `nested` slot of a `parent` reached through the `via` kinds, found by its selector. A slot one of whose arms a deep member routes through keeps its other arms: its `slot` lists only those, and `except` the arms the deep members take; a slot every arm of which they take is left out. `via` lists the kinds between the owner and the member nearest first, as the facts give them (the convention a claim's `within` follows). `path` is the build inverse: the slots, owner by owner, from the claimed kind to the member's slot. It is `undefined` when a step holds many nodes or a kind on the way has no slot for the next, since a single member cannot be built back through it.

### `packages/codegen/src/bindings/routes.ts::ContainerUnwrap`

How a container reads as its element: the element slot's kinds and terminals, and whether it holds many.

### `packages/codegen/src/bindings/routes.ts::GrammarRoutes`

A grammar's routes: per claimed kind, its read entries (most specific first, each with its own members) and the union of their member routes: the first entry's, then each other route an entry adds; per kind, the vocabulary kind it reads as by default (`vocabOf`); and per kind with one, its container unwrap.

### `packages/codegen/src/bindings/routes.ts::slotFor`

The slot a selector names: by field (`slotByField`: the slot's name, or its property name in snake case), else by kind (`slotByKind`), else the first slot holding nodes after the slot the selector follows (`after`).

### `packages/codegen/src/bindings/routes.ts::slotByKind`

The slot that holds a kind: the first slot naming it, else the first slot naming a supertype that reaches it through its subtypes (`reaches`). A route through `declaration_list` to `function_item` steps through the slot that admits `_declaration_statement`. The one test of whether a slot holds a kind, for selectors and build paths alike.

### `packages/codegen/src/bindings/routes.ts::modelNode`

A kind's model node, falling back to its hidden `_` spelling.

### `packages/codegen/src/bindings/routes.ts::SlotNames`

The names the bindings give a kind's slots, by slot name: a capture's name, or `null` where a claim marks the slot `@dropped`.

### `packages/codegen/src/bindings/routes.ts::memberNameOf`

A slot's member name: the capture that renames it, else its property name without a trailing `_` or a `Modifier` suffix, in camel case.

### `packages/codegen/src/bindings/routes.ts::isLayout`

Whether a slot is layout and never a member: an options-block address or the separator names it, or every kind it admits is unclaimed and it has no terminals.

### `packages/codegen/src/bindings/routes.ts::containerOf`

A kind's container unwrap: a kind the bindings declare with `@element` unwraps through the slot its element selector finds; an undeclared list through its element kinds; an envelope, alias or polymorph through its one non-layout slot when that slot holds nodes. A branch is never a container implicitly, since a kind with its own structure (`impl !Trait`) loses a fact when read as its content.

### `packages/codegen/src/bindings/routes.ts::specificity`

The order read entries are tried in: a claim both placed (made below enclosing kinds) and tested by a predicate, then a predicate claim, then a placed claim, then a claim that pins a literal or tests the nodes below it (a pin, a token the claimed node holds, or a child test), then the plain claim. `resolveRoutes` breaks a tie by more tests the claim states (`testCount`), then by position in `bindings.scm`. Python's `__init__` inside a class reads as `declaration.constructor` (a predicate claim) before `declaration.method` (a placed one).

### `packages/codegen/src/bindings/routes.ts::testCount`

The tests a read entry's claim states: its field literals, held tokens, child facts, predicates and placement steps. Among entries of one `specificity`, more tests go first, so a read classifies to the deepest kind: a claim whose tests include another's (a refinement that adds a child test, as `declaration.method.getter.public` adds the accessibility modifier to `declaration.method.getter`) has strictly more of them, and the count never puts it after the claim it refines. The count is a total order, where including is only partial: a comparator that asked "includes?" and otherwise fell back to file order would not be transitive. Inclusion never crosses classes, since an including claim keeps the other's placement and predicates. The count reads the claim's own facts, not the entry's derived pins and child tests, because a derived test the model guarantees drops out and would break the strict count. Two claims no node matches together (a single comparison against a chain, a method in a class body against one under a decorator) may swap by the count; neither order changes a read.

### `packages/codegen/src/bindings/routes.ts::isLeafAlias`

Whether a model node is an alias envelope over leaf text: `modelType` `alias`, with every slot holding only `pattern` kinds. Rust's `field_identifier` and typescript's `property_identifier`, for example, are sittir envelopes whose one `content` slot holds `identifier`. The parser sees them as leaves, and their text is their own value, so such a kind supplies no members (`membersOf` gives it no slot routes) and needs no `@dropped`. A bindings query couldn't reach the slot anyway. An alias envelope over a structured kind (typescript's `interface_body` over `object_type`) keeps its slot routes.

### `packages/codegen/src/bindings/routes.ts::guaranteedBy`

What a read entry's own tests guarantee about the slots they reach, as `membersOf` asks it: an entry routes what its own tests guarantee. A member whose build path steps through a slot's only node is routed only by an entry whose positive tests (kinds or text) reach that same step, so they hold only where the slot holds exactly one node. A slot that such a member leads through is routed as a member only by an entry whose excludes test over the slot's only node guarantees it does not hold exactly one. A step to a first or last node is no count and filters nothing.

### `packages/codegen/src/bindings/routes.ts::Guaranteed`

An entry's guarantees: whether a build path's steps to an only node all hold (`holds`), and whether a step's slot holds other than exactly one node (`many`).

### `packages/codegen/src/bindings/routes.ts::stepKey`

A `SlotStep` as a set key: its owner, slot and anchor.

### `packages/codegen/src/bindings/routes.ts::DeepMember`

A member fact reached through a child: a `presence` or a `nested` member.

### `packages/codegen/src/bindings/routes.ts::deepRouteOf`

A deep member's route on a kind, with the build path back through its `via` steps (`viaPath`) to the slot that holds it, `undefined` when some step has no slot or holds many with no anchor.

### `packages/codegen/src/bindings/routes.ts::membersOf`

A read entry's member routes on its kind, as the entry's `Guaranteed` admits them: one `slot` route per slot of the model node, then its flags (`flagRouteOf`), then the member facts the bindings state for it (`kind`, `presence`, `nested`). A slot routes no member when only flag captures hold it, when it is a layout slot, when a claim drops it (`SlotNames` gives it `null`), when the read already tells its value (`toldByRead`, over the values the kind's read entries test on it: their pins, and their child tests on a node directly below: a text test's text, or the text of each fixed-text kind a kinds test names), or when it holds only text on a kind read as an identifier (`facts.ts::isIdentifierPath`, `holdsOnlyText`: an identifier's text is its own value, while a compound identifier's node slots stay members); a slot is also told when the kind's read entries test, one step below it, every kind the node in it can hold (`toldBelow`: rust's visibility levels test `(visibility_modifier (visibility_modifier_pub))` and `(visibility_modifier (crate))`, so the `visibility_modifier` slot is no member), unless a capture the entry inherits names the slot, since a kind leaves its node's content open (`pub(in path)` carries a path), and never over content no claim captures (`toldByRead`); the entry routes the `presence`, `nested` and `kind` members captured by member-only patterns and by the claims it inherits (`inheritedClaims`), never a sibling's or a descendant's; the kinds a deep route reaches through, on every entry (the kind's shape: any claim's `presence` or `nested` route, where the entry guarantees the path), are taken out of their slot, which keeps every other kind it holds and the read then tells as optional, and a slot left with no kind routes nothing; and a slot a member counts through (a step to its only node) is routed only where the entry guarantees it holds more than one (`guaranteedBy`). A flag capture whose selector no form of its owner holds (a field the model does not have) is refused, naming the kind, the flag and the selector. A capture that names a slot routing no member for one of these reasons (layout, only text on an identifier, counted through, the path of a deeper member, told by the read) is refused, naming the capture, the kind, the slot and the reason: a capture reaches a member, a flag or `@dropped`, never nothing. A leaf alias envelope (`isLeafAlias`) takes no slot routes. A list's item slot is its container content (`containerOf`), a step a path may take but no member, unless the list is a form of a supertype, whose items route as its sibling forms name them (`listFormItems`).

### `packages/codegen/src/bindings/routes.ts::flagRouteOf`

A flag capture as a fact route on the slot it captures: the presence of the kind it names (`kind`), the presence of the token it captures (`presence`), or, for a wildcard on a slot that holds one token, that token's presence. A flag never names its slot, so pins and other members keep the slot's own name. A wildcard on a slot that holds more than one token is refused: a flag tests one token.

### `packages/codegen/src/bindings/routes.ts::holdsOnlyText`

Whether a slot holds text and nothing else: no kinds, no fixed terminals, and not a boolean.

### `packages/codegen/src/bindings/routes.ts::heldElements`

The element kinds a slot holds many of: the kinds of a slot that repeats, and the element kinds of a list kind it holds (`containerOf`).

### `packages/codegen/src/bindings/routes.ts::listFormItems`

The member route of a list kind that is a form of a supertype (`formsOf` of its `variantOf` owner reaches it): its item slot, named as the first sibling form names the slot that holds all of the list's element kinds (`heldElements`), renames included. Python's bare `with a, b:` thus routes its items as the parenthesised form's `withItems`. A list that is no form, or whose siblings hold its elements nowhere, routes nothing.

### `packages/codegen/src/bindings/routes.ts::viaPath`

The slots from an owner kind outward through the `via` steps (walked farthest first, since `via` is nearest first), each found by `slotFor` and anchored by `slotAnchor`, and the model node it ends at; `undefined` when a step's slot is missing, or holds many and the step is not anchored to one of them.

### `packages/codegen/src/bindings/routes.ts::resolveRoutes`

Resolves one grammar's routes. A claim on a kind reaches the kind and each of its forms (`formsOf`) that has no claim of its own: a self-claimed form reads by its own claim, and `is` still passes it for the supertype's path by the kind table. Slot names (`SlotNames`: renames, and a claim's `@dropped` slots) are collected first on every kind their claim reaches, since a pin's member name and a slot route's name both follow them, so a supertype claim's field rename or drop applies to the field on each form. A claim's read entries go on the kinds the reader produces for each kind it reaches (`readKinds`), so a claim on an enum kind is entered on its members' kinds; an entry's `claimed` is the kind the claim names. A kind's default vocabulary kind is its first top-level claim with no predicate, no pin and no child test, in file order, else the parent its refining claims' paths share (`refinedParent`); the read entries are then sorted by `specificity`. Member routes are resolved for each read entry of every claimed kind, from the kind's sorted read entries and the entry's own guarantees (`guaranteedBy`); the kind's member routes are their union, the first entry's routes as they are and then each route another entry adds, since several routes may share a member's name; and container unwraps for every kind of the model.

### `packages/codegen/src/bindings/routes.ts::refinedParent`

The vocabulary kind of a kind whose top-level claims all refine: the parent path they share, so each refining claim sits under its own path's parent and none is promoted to name the kind. Claims under different parents, or a single-segment path with no parent, are refused with a diagnostic naming the paths, since nothing then says which vocabulary kind the kind reads as.

### `packages/codegen/src/bindings/input.ts::module`

How one grammar's routes input is assembled, for codegen and the inventory alike. Codegen hands it the node-model record it is about to write and its evaluated grammar; the inventory hands it the committed `node-model.json5` and the grammar it evaluates. One assembly, so the routes codegen writes are the routes the inventory folds.

### `packages/codegen/src/bindings/routes.ts::formsOf`

The kind and, when it is a supertype, every kind the model stamps as its owned variant (`ModelNode.variantOf`), with the forms of each variant that is itself a supertype: the forms a node of the kind takes in the tree. A variant of a branch or polymorph sits under its owner as a part, so a kind that is not a supertype is its only form.

### `packages/codegen/src/bindings/routes.ts::readKinds`

The kinds the typed reader produces for a node of `kind`: the kind, or its members when it is an enum, and every kind the parser shows by `kind`'s name (`shownKinds`), since a claim names what the parser shows. A kind with no enum members is read as itself. An enum kind is stored as one member's kind id, so a node of it reads as that member's kind (`ModelNode.enumMembers`): every member whose text equals each text the claim requires of the node's own text (`ownTextEquals`). Any other test on that text keeps every member, and the claim's read test decides at run time on the member's fixed text. The claim itself is entered unchanged, so its specificity and its read test are those of the claim as written.

### `packages/codegen/src/bindings/routes.ts::ownTextEquals`

The texts a claim requires of the claimed node's own text: its tokens, which on an enum kind are the member's own literal, and each `eq` whose subject is the claimed node itself (`up` 0, no step down) and that compares it with one text.

### `packages/codegen/src/bindings/input.ts::NodeModelRecord`

The part of a node-model record the bindings read: each node's kind, model type, base kind when the grammar bindings renamed it, slots (with each slot's terminal values), subtypes, element kinds, enum values, an enum's members (each member's kind and text), text and pattern. The record `buildNodeModel` returns and the parsed `node-model.json5` both fit it.

### `packages/codegen/src/bindings/input.ts::slotModelOf`

The slot model of a node-model record: per kind its slots, a slot's terminals being the values it stores as terminal text, and an enum's members as `enumMembers`, with the record's omissions filled (`branch`, not required, single, `verbatim`, no members, no `variantOf`), and each kind's `shownAs` from `shownNames`.

### `packages/codegen/src/bindings/input.ts::shownNames`

Per grammar kind, the names the parser shows it by where a slot holds it under another name: every node-reference value's stamped `parseKind` that differs from its `name`, sorted.

### `packages/codegen/src/bindings/input.ts::renamedFromOf`

Each kind the grammar bindings renamed, mapped to its base kind, from the record. `bindFacts` names the facts' base kinds by it (`boundNameOf`).

### `packages/codegen/src/bindings/input.ts::layoutSlots`

The layout slots of a grammar: each slot an options block's `_labels` address names as `owner/field:` (`_` for any owner). A separated list's separator is no slot of the model, so no slot is layout by its name alone.

### `packages/codegen/src/bindings/input.ts::grammarInput`

A grammar's `GrammarInput`, or `undefined` when it ships no `bindings.scm`: its facts read by the pinned reader, bound to the record's kind names and with flags resolved against the vocabulary (`vocabulary.ts::resolveFlags`; the authored vocabulary unless one is passed), the record's slot model, the grammar's minted text tokens, and its layout slots.

### `packages/codegen/src/bindings/input.ts::NodeModelValue`

One admitted value of a serialized slot: its kind (`terminal` for literal text) and the text, or for a node reference the grammar kind (`name`) and the kind the parser shows at that site (`parseKind`).

### `packages/codegen/src/bindings/input.ts::NodeModelSlot`

A slot as `node-model.json5` serializes it, every fact but its names optional, as written.

### `packages/codegen/src/bindings/input.ts::NodeModelNode`

A kind as `node-model.json5` serializes it, including the base name it was renamed from.

### `packages/codegen/src/bindings/input.ts::nodesOf`

The serialized model's kinds, whether it stores them as a list or keyed by kind.

### `packages/codegen/src/bindings/input.ts::EvaluatedGrammarFacts`

The facts of the evaluated grammar the bindings input needs beside the model: its text tokens and its options block.

### `packages/codegen/src/bindings/routes.ts::admittedKinds`

The kinds a wildcard claim (`(holder (_) @path)`) reads: the concrete named kinds its nearest enclosing kind admits where the wildcard sits. Under a field, that field's slot; otherwise every slot holding nodes and, for a list, its element kinds. Supertypes expand to their concrete subtypes (`concreteKinds`). `resolveRoutes` enters the claim once on each, so a wildcard claim takes its place in each kind's ruled order like any other, except on a kind that claims the same path itself, where the kind's own claim already reads it. A wildcard claim names a role by position, not a shape, so its entries take part in read dispatch and `is` but fold no members into the path (`derive.ts::derive`); a path's members come from its explicit claims. A wildcard claim with no enclosing kind has nothing to read its kinds from and fails resolution.

### `packages/codegen/src/bindings/routes.ts::concreteKinds`

The concrete kinds of a list of kinds, deduplicated and sorted: each kind itself, or its subtypes' concrete kinds when it is a supertype (`concreteKindsOf`, which visits each kind once).

### `packages/codegen/src/bindings/routes.ts::concreteKindsOf`

One kind's concrete kinds, skipping kinds already in `seen`, so a supertype cycle ends.

### `packages/codegen/src/bindings/routes.ts::ChildTest`

A test a read entry runs on a node below the read node, at its `CaptureSite`: the node is one of `kinds`; or it is absent or none of `excludes`; or its text is `text`.

### `packages/codegen/src/bindings/routes.ts::Reached`

What `reachedAt` finds: the slots at the last step, the kinds owning each of them (`owners`, in step), and the kinds that can be the node the site names (`holders`).

### `packages/codegen/src/bindings/routes.ts::countsOne`

Whether a site's last step narrows a slot that holds many nodes to its only one (`slotAnchor`): the model then guarantees no count, though it may guarantee the node's kind.

### `packages/codegen/src/bindings/routes.ts::reachesThrough`

Whether one site steps through another: the same placement, and the other's steps as its first ones.

### `packages/codegen/src/bindings/routes.ts::reachedAt`

The model slots a `CaptureSite` below a kind reaches, one per possible holder at the last step, with the kinds owning them, and the kinds that can hold the node the site names: each step finds its slot on every kind the previous step can hold: a named step's `matchedKinds`, a wildcard step's slots' concrete kinds. Nothing when the site starts above the kind or some holder has no such slot.

### `packages/codegen/src/bindings/routes.ts::tokenSite`

The site of a token fact's node: the site of the node holding the token, one step further into the slot that holds the token's text on every kind that can be that node (`slotHoldingText`, the resolver `pinsOf` uses for a claim's own tokens). When no slot holds it but every such kind's own text admits it (`textsOfKind`, a slotless enum or fixed-text node), the site is the holding node itself, and the test is on its text: `(method_definition (accessibility_modifier "private"))` tests the modifier's text. Codegen stops with a diagnostic when neither holds or the holders place the token in different slots.

### `packages/codegen/src/bindings/routes.ts::slotHoldingText`

The slot among these that holds a text: by its terminals, or by a fixed-text kind it holds (`textOfKind`).

### `packages/codegen/src/bindings/routes.ts::guarantees`

Whether the model already makes a child condition true on a slot: the slot is required and either the condition is presence, or its one fixed value is the condition's text, or every concrete kind it holds is one the condition's kinds match (`matchedKinds`).

### `packages/codegen/src/bindings/routes.ts::slotAnchor`

The narrowing a selector's step takes to its slot in a holder kind: to the slot's first node when the pattern pins the child to its parent's first named child, or an anchor joins it to a sibling in an earlier slot; to the last node likewise at the other end; to the only node when both hold. A child joined to a sibling of its own slot narrows nothing: `siblingTestsAt` counts them.

### `packages/codegen/src/bindings/routes.ts::siblingTestsAt`

The `ChildTest`s a holder kind's node children, in order, need beyond each child's own, as tree-sitter matches them: each child in a slot no earlier than the one before; an optional slot that an edge anchor, or an anchor between children of two slots, steps over holds no node (`excludes` every kind it holds); and two children in one slot need two nodes there, tested as the slot not holding exactly one (`excludes` over the slot's `only` node), which with the child's own condition leaves two or more. Codegen stops with a diagnostic for a claim that never matches (children out of slot order, a required slot stepped over, two children in a slot of one node) and for one no read test can count (two children of one slot that state their own tests or a kind narrower than the slot's, or three or more).

### `packages/codegen/src/bindings/routes.ts::siblingTests`

`siblingTestsAt` on every kind the site's node can be; codegen stops with a diagnostic when they differ.

### `packages/codegen/src/bindings/routes.ts::childTestsOf`

A `ChildFact` narrowed to the `ChildTest`s a read entry runs, none when the model guarantees it on every slot it reaches. A step to a slot's only node (`countsOne`) is a count the model never guarantees, so its test stays unless another of the claim's conditions steps through that node (`reachesThrough`, or a token held there), which already needs the node to be the slot's only one. A siblings fact gives its `siblingTests`. A token fact first becomes a text condition at its `tokenSite`. A text condition tests the text, and a presence condition tests the slot's concrete kinds. A kinds condition tests the kinds, except on an optional slot whose node the pattern captures as a member: matching that pattern does not need the node, so the test only excludes the slot's kinds the condition's kinds do not match, and is dropped when there are none. A kinds test names the kinds as the pattern does.

### `packages/codegen/src/bindings/routes.ts::LayoutSlot`

A slot the options block addresses as layout (or every list separator, `kind: null`): not content, so no member names it.

### `packages/codegen/src/bindings/routes.ts::SlotStep`

One step of a member's build path: a slot of an owning kind, narrowed to its first, last or only node when the step is anchored (`slotAnchor`).

### `packages/codegen/src/bindings/routes.ts::stepOf`

A `SlotStep`, carrying `anchor` only when the step is anchored, so an unanchored path keeps its shape.

### `packages/codegen/src/bindings/routes.ts::slotByField`

The slot a field name finds: by the slot's name, or by its property name in snake_case.

### `packages/codegen/src/bindings/routes.ts::shownKinds`

A name and every grammar kind the parser shows by it at an alias site (`ModelNode.shownAs`): the kinds a pattern naming it matches, since a pattern names what the parser shows.

### `packages/codegen/src/bindings/routes.ts::matchedKinds`

The concrete kinds a pattern naming these kinds matches: each name's `shownKinds`, each expanded to its concrete kinds.

### `packages/codegen/src/bindings/routes.ts::reaches`

Whether a kind is, or is shown by the name of (`ModelNode.shownAs`), or is reached through supertype arms from, another kind.

### `packages/codegen/src/bindings/routes.ts::holdsNodes`

Whether a slot holds nodes: it is not a presence flag and it admits at least one kind.

### `packages/codegen/src/bindings/routes.ts::TRANSPARENT_MODEL_TYPES`

The model types whose single content slot stands for the kind itself when it is a container's element.

### `packages/codegen/src/bindings/routes.ts::pinsOf`

A claim's pins on its kind: each field literal, plus each unfielded token a slot admits (`slotHoldingText`), unless that field is already pinned, as the member, slot and text the read tests.

### `packages/codegen/src/bindings/routes.ts::inheritedClaims`

The claims whose captures a read entry routes: every read entry of the same grammar kind whose vocabulary path is the entry's own or an ancestor of it. A refinement inherits its interface's members, so it routes what its own claim captured and what the claims it refines captured; a sibling's or a descendant's captures never reach it, and a claim on another grammar kind never transfers. An inherited route keeps every condition its pattern put on the path (its `via` kinds and anchors), so on a node the parent pattern would not match the member reads nothing.

### `packages/codegen/src/bindings/routes.ts::textOfKind`

The text of a kind that is one fixed text (`facts.ts::isFixedText`), else nothing.

### `packages/codegen/src/bindings/routes.ts::textsOfKind`

Every text a kind's own node can be: the one text of a fixed-text kind (`facts.ts::isFixedText`), or each member's text of an enum kind (typescript's `accessibility_modifier` is `public`, `private` or `protected`), else none. A token tested on such a node is its own value, not a token in one of its slots.

### `packages/codegen/src/bindings/routes.ts::fixedValues`

Every value a slot can hold when each is a fixed text: its terminals and the texts of each kind it holds (`textsOfKind`: a fixed-text kind's text, an enum kind's member texts). A slot that holds any other kind has no such list.

### `packages/codegen/src/bindings/routes.ts::toldByRead`

Whether the read already tells a slot's value, so the slot is no member. The slot holds one value at a time from a fixed list (`fixedValues`), and either a read entry of the kind pins every value, or the slot is required and has one value only. When every value is pinned, an optional slot is told too: a node that matches no pinned entry holds none. An optional one-value slot is a presence, which the read does not tell, so it stays a member. A capture naming the slot never overrides this, as it does a slot told one step below (`membersOf`, `toldBelow`): a fixed text is the whole value, while a kind tested below leaves the node's content open. So a slot told below may hide no content: each kind it covers there is a fixed text or an enum, or each of that kind's slots is a layout slot, dropped, captured by a claim on the owner, or told by the owner's tests on it; otherwise `resolveRoutes` stops with a diagnostic naming the owner, the slot, the covered kind and its open slots. A covered kind with no slots and no fixed text still carries its text, which counts as open content.

### `packages/codegen/src/bindings/derive.ts::wildcardContainers`

Every wildcard claim that lands on a list kind or a declared container, one line each with the pattern and the kind. Such a claim reads the list or container node, which stands between its enclosing kind and the members the claim means, as when the grammar's enrich lifts a group into a list node the bindings do not name. The inventory prints them and fails. An explicit claim on a list or a wrapper is deliberate and not reported.

### `packages/codegen/src/bindings/facts.ts::EnumMember`

One member of an enum kind as the assembled model stamps it: the member's kind, which a node of the enum is stored and read as, and the member's text.

### `packages/codegen/src/bindings/facts.ts::ClaimFact`

A vocabulary capture on a node: its path, its grammar kind (`_` for a wildcard), the field it sits under in its enclosing node (`null` for none), its predicates, whether it is top-level, the kinds enclosing it nearest first (`within`), the field literals and tokens it pins, the conditions its pattern states on the nodes below the claimed node (`children`, `ChildFact`), the flag of its path it sets when its last segment is one (`flag`, `vocabulary.ts::flagSegment`), and, when its pattern restricts the claimed node in a way `match` can say, that restriction as a match tree (`match`, `pinned-reader.ts::matchOf`): the fact the lead derivation joins a narrowed kind to, to name its variant. A wildcard claim's kinds are read from its enclosing kind and field (`routes.ts::admittedKinds`).

### `packages/codegen/src/bindings/facts.ts::ChildFact`

One condition a claim's pattern states on a node below the claimed node, at its `CaptureSite`: the node is one of `kinds` (a named child, or an alternation of named children), and `captured` says whether the pattern also captures it as a member; or the node's text is `text` (a token under a field); or the node holding a token with no field is at the site, and the token is its `token` (`routes.ts::tokenSite` finds the token's slot); or the node is present (a wildcard under a field); or the node at the site holds these node children in this order, with their anchors (`siblings`), which tree-sitter matches to distinct nodes in sibling order. The routes narrow each against the model into `ChildTest`s.

### `packages/codegen/src/bindings/facts.ts::WILDCARD`

The kind a wildcard pattern node (`(_)`, `_`) stands for in the facts: any kind its position admits.

### `packages/codegen/src/bindings/facts.ts::PredicateArgument`

One argument of a predicate: a capture by name, or text.

### `packages/codegen/src/bindings/facts.ts::UnclaimedFact`

A kind `bindings.scm` declares unclaimed (`@unclaimed`), with the pattern's `#set! reason`.

### `packages/codegen/src/bindings/facts.ts::MemberFact`

A member capture as read. `rename` names the slot its selector finds on the owner; it keeps the token it captures, when it captures one, and `resolveFlags` marks it a flag when its name is one, which routes it as a fact instead (`routes.ts::flagRouteOf`). `dropped` marks the slot its selector finds on the owner as no member, from a claim's `@dropped` capture. `presence` marks an unfielded token's presence on the owner, through the steps in `via` when it sits deeper. `kind` is the presence of a node's kind in the slot another member names (a flag). `nested` is a member of the top kind that sits below a child, reached through `via`, in `parent`'s slot the selector finds, repeated when `multiple`. Each `via` step is the selector of a node between, nearest first, so an anchored step keeps its anchor. `claims` lists the claims, by their position in the facts, that the member's owner node carries in its pattern; a member captured in a pattern whose owner carries no claim (a member-only pattern) has none and belongs to every read entry of its owner. A capture on a node anchored first carries `leadMatch`: the claim's line and either the match tree its pattern states below the node or the reason `match` cannot say it (`LeadMatchFact`).

### `packages/codegen/src/bindings/facts.ts::NamedMemberFact`

A member fact that names a member: every route but `dropped`.

### `packages/codegen/src/bindings/facts.ts::isNamedMember`

Whether a member fact names a member (`NamedMemberFact`). The grammar-bindings derivation reads only these: a dropped slot asks for no grammar change.

### `packages/codegen/src/bindings/facts.ts::ContainerCapture`

A capture in a container pattern other than `@element`: its name, its token text when it captures a token, whether it repeats, and the selector of its slot.

### `packages/codegen/src/bindings/facts.ts::PatternOrigin`

Where a pattern sits in `bindings.scm`: its first line and its source text.

### `packages/codegen/src/bindings/facts.ts::ContainerFact`

A container pattern as read: the container kind, the selector of its element slot, its other captures, the selectors of the slots it drops on purpose, the reason it gives, and where the pattern sits.

### `packages/codegen/src/bindings/facts.ts::TemplateFact`

An anchored `#match?` with named holes as a template: the vocabulary paths the pattern claims, the capture it tests, the regex as a template literal with each hole `${string}`, and the hole names.

### `packages/codegen/src/bindings/facts.ts::ModelSlot`

A slot of the node model as the bindings read it: its name and property name, whether it is required and repeated, its storage, the kinds it holds and the terminal texts it admits.

### `packages/codegen/src/bindings/facts.ts::FIXED_TEXT_MODEL_TYPES`

The model types of a kind that is always one fixed text: keywords and punctuation.

### `packages/codegen/src/bindings/facts.ts::isFixedText`

Whether a model node is one fixed text (`FIXED_TEXT_MODEL_TYPES`, with its text known).

### `packages/codegen/src/bindings/facts.ts::IDENTIFIER`

The vocabulary root whose kinds are identifiers.

### `packages/codegen/src/bindings/facts.ts::isIdentifierPath`

Whether a vocabulary path is `IDENTIFIER` or beneath it. A kind with a read entry at such a path routes no member through a slot that holds only text (`routes.ts::membersOf`).

### `packages/codegen/src/bindings/facts.ts::ModelNode`

A kind of the node model as the bindings read it: its model type, its slots, its supertype arms, a list's element kinds, an enum's members, a fixed leaf's text, a pattern leaf's pattern, the kind it is an owned variant of (`variantOf`), and the names the parser shows it by at an alias site (`shownAs`).

### `packages/codegen/src/bindings/facts.ts::SlotModel`

The node model as the bindings read it, keyed by kind.

### `packages/codegen/src/bindings/facts.ts::BINDINGS_FILE`

The name of a grammar package's bindings file. The bindings path, compile, generate and the manifest check all spell it through this.

### `packages/codegen/src/bindings/derive.ts::wildcardUnrouted`

Every required member of a path that a kind reached by a wildcard claim of that path has no route for, one line per claimed kind and path: the kinds a claimed node is read as share its line. A read through such an entry still owes the path's interface, so each line is a conformance gap the build stage closes; the ratchet test in the tools inventory pins the list until then.

### `packages/codegen/src/bindings/facts.ts::MatchRead`

What reading a pattern as a `match` tree gives: the tree (`dsl/bind.ts::LeadMatch`, with no `as`, which only the derivation adds), or the reason the pattern says something `match` cannot.

### `packages/codegen/src/bindings/facts.ts::LeadMatchFact`

A `MatchRead` with the line of the `bindings.scm` pattern it was read from, which a `lead-refused` record names.

### `packages/codegen/src/bindings/facts.ts::bindMatch`

A match tree with every kind it names bound, its `as` kept.

### `packages/codegen/src/bindings/facts.ts::bindMember`

A member fact with its owner, selector, `via` steps and parent bound; `bindFacts` binds its lead match beside it.

### `packages/codegen/src/bindings/facts.ts::bindLeadMatch`

A lead match with its tree's kinds bound; a refusal names no kind.

### `packages/codegen/src/bindings/pinned-reader.ts::leadsList`

A node anchored first that captures a member: the capture a lead may be derived from, whose pattern below it is a match tree.

### `packages/codegen/src/bindings/pinned-reader.ts::within`

Whether a node is at or below another.

### `packages/codegen/src/bindings/pinned-reader.ts::predicateReason`

The refusal a predicate on a node of a match tree gives: `match` states kinds as nodes, so it says no negated kind (`#not-kind-eq?`), no kind predicate, and no text test.

### `packages/codegen/src/bindings/pinned-reader.ts::matchOf`

Reads a node's pattern as a `match` tree: its kind, and the one restriction its tests state, a field (or no field) and the kinds it admits, each read in turn. An alternation (of options with nothing below them, as `childFacts` requires) gives one restriction admitting each option; any other child is a restriction of its own. A kind narrowed two ways is written as one claim per way, which the derivation unions (`leads.ts::unionMatch`). It refuses what `match` cannot say: a predicate on any node of the tree (`predicateReason`), a quantified child, a negated field, a token (a text test), a wildcard, a grouping, a second restriction on one kind, and an alternation whose options sit under different fields. The one reading of a pattern as a match tree, for a member's lead match and a claim's own.

### `packages/codegen/src/bindings/leads.ts::LeadDerivation`

What the lead derivation gives: the leads, sorted by list, and the `lead-refused` records for every claim it could not turn into one.

### `packages/codegen/src/bindings/leads.ts::LeadClaim`

One capture's contribution to a list's lead: the list's item field, the captured name (the lead's field), the claim's line and its match tree.

### `packages/codegen/src/bindings/leads.ts::Named`

A match tree with its variants named, or the reason they cannot be.

### `packages/codegen/src/bindings/leads.ts::matchKey`

A match tree's structural identity: its kinds, fields and admits in order, without `as`. Two trees with one key say one restriction.

### `packages/codegen/src/bindings/leads.ts::unionMatch`

The union of two claims' match trees: one kind, restricted on one field (or neither restricted), admitting what either admits, an admit of one kind on both sides unioned in turn. So rust's receiver, `self_parameter` or a `parameter` named `self`, is two claims, each with an exact route, whose union is the lead's tree. Two different kinds, or one kind restricted on different fields (or restricted on one side only), do not union and are refused.

### `packages/codegen/src/bindings/leads.ts::nameVariants`

Names each node of a match tree that narrows its kind (one with a restriction) by the claim that classifies the same pattern: a top-level, unplaced claim whose own `match` has the node's key. The name is that claim's path's bound kind name (`names.ts::boundKindName`), hidden when the narrowed kind's rule name is (`isParserHiddenName`), so `(required_parameter pattern: (this)) @parameter.this` names the variant `this_parameter`. Each admit of a restriction joins its own claim. A node no claim classifies keeps no `as`, and the edit gives it the variant convention's name. Two claims that classify one node with different paths are refused. A node that narrows nothing is no variant and needs no name.

### `packages/codegen/src/bindings/leads.ts::deriveLeads`

The leads of a grammar's facts against its grammar evaluated without its bindings. A capture on the first item of a separated list (`leadMatch` on a member whose list, the parent of the captured node, is a head-form list whose element is a field, `rule-patterns.ts::fieldedHeadListOf`) contributes to that list's lead; a capture anchored first anywhere else derives nothing and stays what it was. The captures on one list derive one `lead`: the list, its item field, the captured name as the lead's field, and the union of their match trees (`unionMatch`) with its variants named (`nameVariants`). They must capture one field, and their trees must union. Each refusal is a blocking `lead-refused` grammar diagnostic naming the `bindings.scm` file and the claim lines: a match tree `match` cannot say (`matchOf`'s reason), captures of two fields, trees that do not union, and a variant two claims name. A lead its edit cannot make is refused too, with the edit's own reason (`dsl/bind.ts::leadIssue`), checked against the leads accepted before it in the order the edit applies them: one hidden rule narrowed two ways, an owner holding the list other than as a field's content, owners holding it under different fields, and a minted name the grammar already holds. A capture deeper in the item than the item itself stays a position (no `leadMatch`), and `match` cannot say several top-level admits, so a lead derived here admits one tree.


### `packages/codegen/src/bindings/module.ts::matchCall`

A `LeadMatch` as the `match(…)` call that builds it: an unfielded restriction as an array, a fielded one as a one-key record, and the variant name last (after an explicit `undefined` when the match restricts nothing).
