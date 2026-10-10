# `packages/codegen/src/bindings` — Function Glossary

The bindings facts and the derivation over them. The facts are what a grammar's `bindings.scm` states, as the pinned `@sittir/scm` reads them (`read.ts`). The derivation turns them, with the grammar's slot model, into the vocabulary's kinds, members, refinements and routes.

### `packages/codegen/src/bindings/facts.ts::BindingFacts`

What a bindings file says, before the slot model is consulted: the claims (`ClaimFact`, with the kinds enclosing a claim made below the top), the member captures (`MemberFact`: a `rename` of the slot its selector finds, the `presence` of a token, the presence of a `kind` in the slot another member names (a flag), or a `nested` member with the kinds it routes through and the selector of its slot), the containers (`ContainerFact`: the element's selector, every other capture, the selectors of the slots it drops on purpose with the pattern's reason, and the line and text of its pattern), the templates (`TemplateFact`) and the unclaimed kinds (`UnclaimedFact`, each with its reason). Facts come in file order and, within a pattern, in pre-order, which the derivation's first-claim and rename rules rely on. A presence member keeps its token's text (`"async" @isAsync` has the name `isAsync` and the token `async`); codegen resolves the text to a kind id through the stamped public symbol, never by a text lookup of its own.

### `packages/codegen/src/bindings/facts.ts::SlotSelector`

How a captured node finds its slot in a model node: by its field when it has one, otherwise by its named kind, otherwise (a wildcard or a grouping) by position: the first slot that holds nodes after the slot of the nearest node pattern before it in the same parent (`after`), or the first such slot when nothing precedes it. A token before it holds no slot and does not count, so `(unary_expression "-" (_) @argument)` names the operand and `(index_expression (_) @object (_) @index)` names both slots in order.

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

The predicate operators the derivation knows. A claim's predicate with another operator is a derivation diagnostic (`Derivation.unknownPredicates`), never silently dropped.

### `packages/codegen/src/bindings/derive.ts::unknownPredicates`

Every claim predicate whose operator is not in `KNOWN_PREDICATE_OPERATORS`, one line each, naming the grammar, the operator, the capture and the claim. The inventory prints them when there are any and fails.

### `packages/codegen/src/bindings/derive.ts::derive`

```text
The derivation over every grammar's binding facts and model. In order: resolve
each grammar's routes (`routes.ts::resolveRoutes`: read entries with their pins,
member routes, container unwraps), and make templates hole members of every
claim in their pattern; fold each claimed kind's member routes, claim by claim
in file order, into member types (a slot route's slot resolved, a presence or
a flag an optional `boolean`, a nested member its named kind or the kinds of the slot its
selector finds in its parent); fold pinned claims into refinements, each pin
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

The `<grammar:kind>` placeholder for a grammar kind no claim maps, with the kind's leading underscores dropped.

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

A claim with what it refines: `refines` is the deepest earlier claim's path that the claim's path extends, on the same kind in the same placement, and `refinement` is how it tells its nodes apart. A top-level claim that refines nothing still carries a refinement kind when it pins something (a predicate, a field literal or a token); one that pins nothing has none and is a plain claim.

### `packages/codegen/src/bindings/facts.ts::refinementKindOf`

The claim's `RefinementKind`, in order: any predicate, then any field literal, then any token, else a child pattern.

### `packages/codegen/src/bindings/facts.ts::refineClaims`

Every claim as a `RefinedClaim`, derived from the claims alone, so the reader stays a reader and every consumer refines the same way. A wildcard or group claim refines nothing.

### `packages/codegen/src/bindings/facts.ts::bindSelector`

A slot selector, and the selectors chained after it, with every kind named by its bound kind.

### `packages/codegen/src/bindings/facts.ts::bindFacts`

The facts with every grammar kind they name (claims and their placements, member owners, paths and selectors, containers and their captures, unclaimed kinds) named by its bound kind. The facts are read and written in base names; with the bindings overlay on, a consumer binds them through the node model's stamped `renamedFrom` (`boundNameOf`). A wildcard claim stays a wildcard, and templates name no kinds.

### `packages/codegen/src/bindings/hash.ts::bindingsSourceHash`

The SHA-256 of a `bindings.scm` and every `.ts` source of the vocabulary, each source keyed by its file name in name order, over their bytes. Nothing is parsed, so the hash is checked without the scm parser.

### `packages/codegen/src/bindings/hash.ts::grammarBindingsHash`

`bindingsSourceHash` of a grammar's own `bindings.scm` and the vocabulary.

### `packages/codegen/src/bindings/hash.ts::REGENERATE_BINDINGS_COMMAND`

The command that writes every `grammar.bindings.ts`. The module's banner and the stale-overlay refusal both name it.

### `packages/codegen/src/bindings/hash.ts::StaleBindingsError`

Generation refused over a grammar's committed bindings overlay: missing, or derived from other sources than the grammar's `bindings.scm` and the vocabulary now.

### `packages/codegen/src/bindings/hash.ts::assertBindingsFresh`

Codegen's check of a grammar's committed `grammar.bindings.ts`: a grammar with a `bindings.scm` must commit the module, and the hash the module's `bindings({ hash, … })` carries must equal the hash of `bindings.scm` and the vocabulary now. Otherwise it throws `StaleBindingsError` naming `REGENERATE_BINDINGS_COMMAND`. A grammar with no `bindings.scm` passes. It runs whether the overlay is on or off, since the facts codegen reads come from `bindings.scm` itself and the overlay must agree with them. `compileGrammar` runs it after its diagnostic gate; the base grammar's own staleness is the generated-output freshness check's.

### `packages/codegen/src/bindings/overlay.ts::OverlayEdit`

One grammar change at a patch position: a field of the member's name, or an alias of a symbol to its bound name.

### `packages/codegen/src/bindings/overlay.ts::OverlayPatch`

An `OverlayEdit` at a patch path of its rule, in the patch stage's path syntax.

### `packages/codegen/src/bindings/overlay.ts::BindingsOverlay`

The derived bindings overlay: per rule, its patch sets (field edits first, then alias edits); the kind renames; and the splits. `printBindingsModule` prints it as the `Bindings` the grammar applies.

### `packages/codegen/src/bindings/overlay.ts::OverlayResidue`

A claim or member the derivation did not turn into a grammar change, with the cause.

### `packages/codegen/src/bindings/overlay.ts::OverlayReport`

What the derivation realized and left: the claim and member totals, the aliases, field renames and field wraps behind the patches, the claims realized as kinds (and those realized by their parent), the members realized as field names and the implicit routes fielded, and the residue. The inventory prints it as convergence.

### `packages/codegen/src/bindings/overlay.ts::OverlayInput`

The derivation's inputs: the grammar's name, its binding facts in base names, its grammar evaluated without the overlay, each vocabulary path's members, the ones its interface declares and the ones it inherits (a member an interface inherits is its member), and each claimed kind's member routes as `resolveRoutes` gives them over the model of the grammar compiled without the overlay (`routedMembers`).

### `packages/codegen/src/bindings/overlay.ts::CONTAINER_MEMBER_OVERRIDES`

Per grammar, the member name of a placement's container where the vocabulary has none: outer kind to member. Each entry is a vocabulary gap (rust's `impl_item_body` is `body`).

### `packages/codegen/src/bindings/overlay.ts::boundKindName`

The bound name of a vocabulary path: its segments reversed, subkind first, keeping hiddenness (`declaration.function` is `function_declaration`; a hidden kind's is `_function_declaration`). The one place the naming lives.

### `packages/codegen/src/bindings/overlay.ts::memberFieldName`

A vocabulary member's field name: its camelCase name in snake case, so every slot a member reaches is named by the member.

### `packages/codegen/src/bindings/overlay.ts::isLift`

A group lift at the patch stage: the symbol enrich's group lift leaves in a rule, unless it is a variant's arm (a rule of its own at the patch stage).

### `packages/codegen/src/bindings/overlay.ts::isGroupAlias`

The alias enrich wraps a visible group in.

### `packages/codegen/src/bindings/overlay.ts::FieldRequest`

A field edit the derivation asks bind for: a rename of an existing field or a wrap of an unfielded child.

### `packages/codegen/src/bindings/overlay.ts::SINGLE`

The rule types with one `content` child, which the patch walk descends at path index `0`.

### `packages/codegen/src/bindings/overlay.ts::metaOf`

A rule's `metadata` record, or an empty one.

### `packages/codegen/src/bindings/overlay.ts::fieldOfReference`

The field a rule holds a reference to a child kind in, if any.

### `packages/codegen/src/bindings/overlay.ts::targetKey`

What a field request edits: a field of the owner by its name, or the owner's token or symbol it wraps.

### `packages/codegen/src/bindings/overlay.ts::fieldKey`

The field a request leaves on its owner.

### `packages/codegen/src/bindings/overlay.ts::deriveOverlay`

```text
The bindings overlay from a grammar's facts, against its grammar evaluated
without the overlay. Claims: a kind is named by its first plain top-level
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

### `packages/codegen/src/bindings/overlay.ts::sameShapeAs`

The kinds one path names that the overlay may merge under the path's name: the path's first kind and every further kind that supplies the same member names, where neither is read as a kind (a flag's kind). A kind's members are its routed members (`OverlayInput.routedMembers`): its captures, renamed, and every other non-layout slot by its property name, so a slot no claim captures still tells two kinds apart (python's `assignment_typed` carries a `type` that `assignment_eq` lacks). A form restricted to a context is a legitimate merge: python's `lambda_within_for_in_clause` supplies `lambda`'s `parameters` and `body`, and differs only in what its body admits. It is the other face of injectivity: two kinds share a vocabulary leaf only where a holder's flag or a member's absence tells them apart, and a kind told apart that way keeps its own grammar kind so the reader and the builder can tell it. Containment is no distinction: a container member admitting both kinds does not keep them apart.

### `packages/codegen/src/bindings/overlay.ts::overlayPatches`

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

The generated `grammar.bindings.ts`: its default export is the overlay with the hash of the sources it was derived from (`bindings({ hash, patches, renames, splits })`), and nothing else; codegen reads the facts from `bindings.scm` through the pinned reader, never from the module. It imports only the authoring helpers it calls, and is erasable syntax only, since tree-sitter's run of the grammar evaluates it too. `grammar.sittir.ts` passes the overlay as `bindings` only while the overlay is on.

### `packages/codegen/src/bindings/module.ts::loadBindingsModule`

A package's committed `grammar.bindings.ts`, imported outside the grammar's evaluation (with the DSL globals its authoring helpers call installed, `withDslGlobals`), or `undefined` when the package commits none. `compileGrammar` reads its hash for `assertBindingsFresh`.

### `packages/codegen/src/bindings/module.ts::editCall`

An `OverlayEdit` as the authoring call that makes it.

### `packages/codegen/src/bindings/module.ts::patchSet`

One rule's patch set as an object of patch paths to authoring calls.

### `packages/codegen/src/bindings/module.ts::list`

Printed entries as an array, `[]` when there are none.

### `packages/codegen/src/bindings/module.ts::BINDINGS_MODULE`

The file name of a grammar's committed bindings overlay, beside its `grammar.sittir.ts`.

### `packages/codegen/src/bindings/module.ts::q`

A string as a quoted TypeScript literal, for the emitted overlay module.

### `packages/codegen/src/bindings/pinned-reader.ts::module`

The `bindings.scm` reader, over the pinned `@sittir/scm` build (`loadPinnedScm`). It imports `@sittir/scm` and `@sittir/common` for types only: every value it uses comes from the pinned build, so the facts depend on the pin and not on the workspace's packages.

### `packages/codegen/src/bindings/pinned-reader.ts::ready`

Loads the pinned build once and keeps its kinds, its engine and the span helpers for every later read; a failed load is forgotten so the next read tries again.

### `packages/codegen/src/bindings/pinned-reader.ts::readBindings`

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

The parse reports no errors of its own. A file is refused with `BindingsSyntaxError` when an ERROR region surfaces as trivia on a node the reader visits, or when a non-blank file parses to no pattern; a malformed pattern the parse absorbs without a trace passes here and is caught by the compile gate (`compileQuery`).

The scm engine behind it is the pinned build's (`ready`), created by the first read and shared by the rest. The module runs only in the reader's own process (`pinned-reader.child.ts`); codegen and the inventory read through `read.ts`.

### `packages/codegen/src/bindings/pinned-reader.ts::kindPresence`

The flag a further single-segment capture on a node makes: the presence of the node's kind in the slot the node's first member capture names, owned by that member's owner. A node whose first capture is a token's presence has no slot to name, so its further captures are read as ordinary members.

### `packages/codegen/src/bindings/pinned-reader.ts::slotNamed`

A node's member captures with the first naming its whole slot when a flag follows it: a fielded rename drops its kind selector, since the flag, not the first capture, says which arm of the slot is present.

### `packages/codegen/src/bindings/pinned-reader.ts::parsedPatterns`

Each top-level definition with the line it starts on and its source text, sliced by the node's byte span. Spans count UTF-8 bytes and the bindings files carry multibyte comment rules, so slicing and line numbers go through `sourceSpans`. `readBindings` reads the file through it, so a container's facts record the line and text given here, and `bindingPatterns` summarizes each one for the inventory's issue check.

### `packages/codegen/src/bindings/pinned-reader.ts::bindingPatterns`

Each top-level pattern as a `BindingPattern`: its line, its source text and every field, node kind and token it references (`referencesIn`).

### `packages/codegen/src/bindings/pinned-reader.ts::predicateFact`

A pattern's `#…?` predicate as a fact: its operator (the name between `#` and `?`), the capture it tests when its first parameter is one (a property predicate such as `#is-not? local` tests none, so its capture is `null` and every parameter is an argument), and its arguments, each a capture or text (a string's value, or a bare identifier). A directive (`#…!`, `#set!`) is not a predicate and gives none. Every operator is kept, known or not; the derivation reports the ones it does not know. Its `subject` depends on the claim, so the pattern's predicates are read once without it and each claim places them (`captureSite`).

### `packages/codegen/src/bindings/pinned-reader.ts::captureSite`

A predicate capture's `CaptureSite` for one claim. It walks from the claimed node outward, through the pattern's named nodes only, to the first node that holds the capture, counting each step up, and records the selectors from there down to the capture. It is `null` when the capture names no node in the pattern, or when only a group holds both.

### `packages/codegen/src/bindings/pinned-reader.ts::roundTripBindings`

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

One visited pattern node: the node, the field it sits under, its parent visit, whether it is one option of an alternation (`alternative`), the list elements (captures, quantifiers) an enclosing alternation hands it (`inherited`), and its child visits in order.

### `packages/codegen/src/bindings/pinned-reader.ts::Pattern`

A pattern as read: its top visit, every visit in order, and the predicates it carries.

### `packages/codegen/src/bindings/pinned-reader.ts::Facts`

The mutable fact lists `readBindings` fills, one per fact kind, returned as `BindingFacts`.

### `packages/codegen/src/bindings/pinned-reader.ts::stringValue`

A query string's value, with escape sequences resolved to the characters they stand for.

### `packages/codegen/src/bindings/pinned-reader.ts::lineOf`

The 1-based line a byte offset falls on, counted over the string index the span helper converts it to.

### `packages/codegen/src/bindings/pinned-reader.ts::unparsed`

The start offsets of the ERROR regions a node carries as trivia: where the parse absorbed text it could not read.

### `packages/codegen/src/bindings/pinned-reader.ts::definitionsOf`

The file's top-level definitions, parsed to full depth by the pinned engine.

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

The capture that marks a container's slot as left out on purpose.

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

### `packages/codegen/src/bindings/pinned-reader.ts::selector`

The `SlotSelector` that finds a visit's slot in its parent: its field, else its named kind, else (a wildcard or grouping) the selector of the nearest earlier sibling that is not a token, as `after`, or no anchor at all when nothing precedes it.

### `packages/codegen/src/bindings/pinned-reader.ts::expressionsOf`

The expressions a pattern node holds: a named node's group (with the anchored-last variant's `last` appended), a grouping's group expressions, and none for a token. The ERROR regions on the group are recorded as it goes.

### `packages/codegen/src/bindings/pinned-reader.ts::readPattern`

A pattern as a tree of visits. A field definition places its definition under the field; an alternation places each option as an alternative carrying the alternation's elements; an arm places both sides; predicates are collected; a negated field and a missing node place nothing.

### `packages/codegen/src/bindings/pinned-reader.ts::templateOf`

A `#match?` predicate as a template, when its regex is anchored at both ends and has named holes: the regex with each hole replaced by `${string}`, and the hole names in order.

### `packages/codegen/src/bindings/pinned-reader.ts::claimFact`

The `ClaimFact` for a claim capture on a visit: its kind (a grouping's first child's), field, the pattern's predicates placed for this claim (`captureSite`), whether it is at the top, the kinds enclosing it (nearest first), its field literals (the literal a field pins, outside a grouping) and its unfielded uncaptured tokens. An alternative's tokens are not pins.

### `packages/codegen/src/bindings/pinned-reader.ts::memberFact`

The `MemberFact` for a member capture on a visit. On a child of the top (or under a top grouping) it renames the slot its selector finds, or marks an unfielded token's presence. Deeper, it is a nested member of the top kind (or the presence of a token) routed through the kinds between. A capture directly under a grouping names no member.

### `packages/codegen/src/bindings/pinned-reader.ts::containerFact`

The `ContainerFact` for a container pattern: the container kind, its element's selector, each other capture (its name, token text, quantifier and selector), the selectors of the `@dropped` slots, the reason, and the pattern's origin.

### `packages/codegen/src/bindings/pinned-reader.ts::reasonOf`

The text of a pattern's `#set! reason "…"`, or `null`.

### `packages/codegen/src/bindings/pinned-reader.ts::patternFacts`

Reads one pattern into the fact lists. An `@unclaimed` pattern only declares kinds unclaimed. A pattern whose single top owner carries no claim and captures `@element` is a container. Otherwise every template predicate is a template over the pattern's vocabulary captures, and each visit's captures are claims or members in order, a further single-segment member on a node being that node's kind presence (`kindPresence`, `slotNamed`).

### `packages/codegen/src/bindings/pinned-reader.ts::patternsOf`

The patterns a top-level definition holds: itself, or each option of a top-level alternation carrying the alternation's elements.

### `packages/codegen/src/bindings/pinned-reader.ts::referencesIn`

Every node kind, token and field an expression references, in order, for the inventory's check against the parser. `ERROR` and the wildcard are not references.

### `packages/codegen/src/bindings/pinned-reader.ts::groupReferences`

The references in a named node's group, its anchored-last `last` included.

### `packages/codegen/src/bindings/pinned-reader.child.ts::module`

The reader's process. It reads requests from stdin, one JSON `PinnedReaderRequest` per line, answers them in order with the read their mode names, and writes each reply as `PINNED_READER_MARKER` and one JSON `PinnedReaderReply` line on stdout. A `BindingsSyntaxError` is replied as its lines and any other failure as its stack, so one bad file does not stop the reads after it. It exits once stdin closes and the last reply is written.

### `packages/codegen/src/bindings/pinned-reader.child.ts::READS`

The read each request mode runs in the child process.

### `packages/codegen/src/bindings/pinned-reader.child.ts::answer`

One request's reply: its value, the syntax error's lines, or any other error's stack, so the parent can rebuild the error it would have thrown in process.

### `packages/codegen/src/bindings/pinned-reader.child.ts::queue`

The chain of pending answers, so replies leave in request order and the process exits only after the last one when its input closes.

### `packages/codegen/src/bindings/read.ts::module`

The public face of the pinned reader. The reader runs in a child process because tsx resolves the root `tsconfig.json` paths for every file it loads, inside the bootstrap directory too, so an in-process import of the pinned build would load the workspace's `@sittir/common` beside the pinned one. The child runs under `tsconfig.pinned.json`, which maps no paths. A process starts one child, on its first read, and sends every later read to it, so a run pays the start-up once (`bootstrap/bootstrap.ts::module` records the cost) whatever grammars and modes it reads.

### `packages/codegen/src/bindings/read.ts::PinnedReaderRequest`

One read sent to the child: the id its reply carries, the mode and the `bindings.scm` text.

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

### `packages/codegen/src/bindings/read.ts::readPinned`

Sends one read to the process's child, starting it on the first read, and waits for its reply.

### `packages/codegen/src/bindings/read.ts::readBindings`

A `bindings.scm` read into `BindingFacts` by the pinned reader.

### `packages/codegen/src/bindings/read.ts::bindingPatterns`

A `bindings.scm`'s top-level patterns as `BindingPattern`s, read by the pinned reader.

### `packages/codegen/src/bindings/read.ts::roundTripBindings`

A `bindings.scm` parsed and rendered back by the pinned engine (`BindingsRoundTrip`).

### `packages/codegen/src/bindings/read.ts::PinnedReaderMode`

Which read a request asks the child for: the facts, the pattern summaries, or a round trip.

### `packages/codegen/src/bindings/read.ts::PendingRead`

A request waiting on its reply: the promise callbacks it settles.

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

A grammar kind read as one vocabulary kind: the kind the claim captured (`claimed`; the kind itself unless the reader stores the captured node as a member's kind id, `readKinds`), the claim, its position in `bindings.scm` (`index`), the pins that tell its nodes apart (`Pin`), and the template it builds from when its predicate has named holes.

### `packages/codegen/src/bindings/routes.ts::Pin`

A literal a claim fixes in a slot: a field literal, or a token the claim names that a slot's terminals hold. It is named by the slot's member, so a refinement and its build agree with the member a capture renamed.

### `packages/codegen/src/bindings/routes.ts::MemberRoute`

Where a member of a claimed kind reads from: a `slot` of the kind; the `presence` of a token in a slot reached through the `via` kinds; the presence of a `kind` in the slot another member of the kind names (a flag, its `path` that slot's); the claimed node itself (`self`, its `path` empty); or a `nested` slot of a `parent` reached through the `via` kinds, found by its selector. A slot one of whose arms a deep member routes through keeps its other arms: its `slot` lists only those, and `except` the arms the deep members take; a slot every arm of which they take is left out. `via` lists the kinds between the owner and the member nearest first, as the facts give them (the convention a claim's `within` follows). `path` is the build inverse: the slots, owner by owner, from the claimed kind to the member's slot. It is `undefined` when a step holds many nodes or a kind on the way has no slot for the next, since a single member cannot be built back through it.

### `packages/codegen/src/bindings/routes.ts::ContainerUnwrap`

How a container reads as its element: the element slot's kinds and terminals, and whether it holds many.

### `packages/codegen/src/bindings/routes.ts::GrammarRoutes`

A grammar's routes: per claimed kind, its read entries (most specific first) and member routes; per kind, the vocabulary kind it reads as by default (`vocabOf`); and per kind with one, its container unwrap.

### `packages/codegen/src/bindings/routes.ts::slotFor`

The slot a selector names: by field (`slotByField`: the slot's name, or its property name in snake case), else by kind (`slotByKind`), else the first slot holding nodes after the slot the selector follows (`after`).

### `packages/codegen/src/bindings/routes.ts::slotByKind`

The slot that holds a kind: the first slot naming it, else the first slot naming a supertype that reaches it through its subtypes (`reaches`). A route through `declaration_list` to `function_item` steps through the slot that admits `_declaration_statement`. The one test of whether a slot holds a kind, for selectors and build paths alike.

### `packages/codegen/src/bindings/routes.ts::modelNode`

A kind's model node, falling back to its hidden `_` spelling.

### `packages/codegen/src/bindings/routes.ts::memberNameOf`

A slot's member name: the capture that renames it, else its property name without a trailing `_` or a `Modifier` suffix, in camel case.

### `packages/codegen/src/bindings/routes.ts::isLayout`

Whether a slot is layout and never a member: an options-block address or the separator names it, or every kind it admits is unclaimed and it has no terminals.

### `packages/codegen/src/bindings/routes.ts::containerOf`

A kind's container unwrap: a kind the bindings declare with `@element` unwraps through the slot its element selector finds; an undeclared list through its element kinds; an envelope, alias or polymorph through its one non-layout slot when that slot holds nodes. A branch is never a container implicitly, since a kind with its own structure (`impl !Trait`) loses a fact when read as its content.

### `packages/codegen/src/bindings/routes.ts::specificity`

The order read entries are tried in: a claim both placed (made below enclosing kinds) and tested by a predicate, then a predicate claim, then a placed claim, then a claim that pins a literal (a pin, or a token the claimed node holds), then the plain claim. `resolveRoutes` breaks a tie by more pins, then by position in `bindings.scm`. Python's `__init__` inside a class reads as `declaration.constructor` (a predicate claim) before `declaration.method` (a placed one).

### `packages/codegen/src/bindings/routes.ts::isLeafAlias`

Whether a model node is an alias envelope over leaf text: `modelType` `alias`, with every slot holding only `pattern` kinds. Rust's `field_identifier` and typescript's `property_identifier`, for example, are sittir envelopes whose one `content` slot holds `identifier`. The parser sees them as leaves, and their text is their own value, so such a kind supplies no members (`membersOf` gives it no slot routes) and needs no `@dropped`. A bindings query couldn't reach the slot anyway. An alias envelope over a structured kind (typescript's `interface_body` over `object_type`) keeps its slot routes.

### `packages/codegen/src/bindings/routes.ts::membersOf`

A kind's member routes: one `slot` route per slot of the model node (minus layout slots, and minus the kinds a `presence` or `nested` route reaches through), then the member facts the bindings state for it (`kind`, `presence`, `nested`). A leaf alias envelope (`isLeafAlias`) takes no slot routes.

### `packages/codegen/src/bindings/routes.ts::viaPath`

The slots from an owner kind outward through the `via` kinds (walked farthest first, since `via` is nearest first), each found by `slotByKind`, and the model node it ends at; `undefined` when a step's slot holds many or is missing.

### `packages/codegen/src/bindings/routes.ts::resolveRoutes`

Resolves one grammar's routes. Renames are collected per owner kind first, since a pin's member name and a slot route's name both follow them. A claim's read entries go on the kinds the reader produces for the claimed node (`readKinds`), so a claim on an enum kind is entered on its members' kinds. A kind's default vocabulary kind is its first top-level claim with no predicate and no pin, else its first top-level claim, in file order; the read entries are then sorted by `specificity`. Member routes are resolved for every claimed kind and container unwraps for every kind of the model.

### `packages/codegen/src/bindings/input.ts::module`

How one grammar's routes input is assembled, for codegen and the inventory alike. Codegen hands it the node-model record it is about to write and its evaluated grammar; the inventory hands it the committed `node-model.json5` and the grammar it evaluates. One assembly, so the routes codegen writes are the routes the inventory folds.

### `packages/codegen/src/bindings/routes.ts::readKinds`

The kinds the typed reader produces for a node of `kind`. A kind with no enum members is read as itself. An enum kind is stored as one member's kind id, so a node of it reads as that member's kind (`ModelNode.enumMembers`): every member whose text equals each text the claim requires of the node's own text (`ownTextEquals`). Any other test on that text keeps every member, and the claim's read test decides at run time on the member's fixed text. The claim itself is entered unchanged, so its specificity and its read test are those of the claim as written.

### `packages/codegen/src/bindings/routes.ts::ownTextEquals`

The texts a claim requires of the claimed node's own text: its tokens, which on an enum kind are the member's own literal, and each `eq` whose subject is the claimed node itself (`up` 0, no step down) and that compares it with one text.

### `packages/codegen/src/bindings/input.ts::NodeModelRecord`

The part of a node-model record the bindings read: each node's kind, model type, base kind when the overlay renamed it, slots (with each slot's terminal values), subtypes, element kinds, enum values, an enum's members (each member's kind and text), text and pattern. The record `buildNodeModel` returns and the parsed `node-model.json5` both fit it.

### `packages/codegen/src/bindings/input.ts::slotModelOf`

The slot model of a node-model record: per kind its slots, a slot's terminals being the values it stores as terminal text, and an enum's members as `enumMembers`, with the record's omissions filled (`branch`, not required, single, `verbatim`, no members).

### `packages/codegen/src/bindings/input.ts::renamedFromOf`

Each kind the bindings overlay renamed, mapped to its base kind, from the record. `bindFacts` names the facts' base kinds by it (`boundNameOf`).

### `packages/codegen/src/bindings/input.ts::layoutSlots`

The layout slots of a grammar: each slot an options block's `_labels` address names as `owner/field:` (`_` for any owner), and the separator.

### `packages/codegen/src/bindings/input.ts::grammarInput`

A grammar's `GrammarInput`, or `undefined` when it ships no `bindings.scm`: its facts read by the pinned reader and bound to the record's kind names, the record's slot model, the grammar's minted text tokens, and its layout slots.

### `packages/codegen/src/bindings/input.ts::NodeModelValue`

One admitted value of a serialized slot: its kind (`terminal` for literal text) and the text.

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

A kind's concrete kinds: itself, or its subtypes' concrete kinds when it is a supertype.

### `packages/codegen/src/bindings/routes.ts::LayoutSlot`

A slot the options block addresses as layout (or every list separator, `kind: null`): not content, so no member names it.

### `packages/codegen/src/bindings/routes.ts::SlotStep`

One step of a member's build path: a slot of an owning kind.

### `packages/codegen/src/bindings/routes.ts::slotByField`

The slot a field name finds: by the slot's name, or by its property name in snake_case.

### `packages/codegen/src/bindings/routes.ts::reaches`

Whether a kind is, or is reached through supertype arms from, another kind.

### `packages/codegen/src/bindings/routes.ts::holdsNodes`

Whether a slot holds nodes: it is not a presence flag and it admits at least one kind.

### `packages/codegen/src/bindings/routes.ts::TRANSPARENT_MODEL_TYPES`

The model types whose single content slot stands for the kind itself when it is a container's element.

### `packages/codegen/src/bindings/routes.ts::pinsOf`

A claim's pins on its kind: each field literal, plus each unfielded token a slot's terminals admit (unless that field is already pinned), as the member, slot and text the read tests.

### `packages/codegen/src/bindings/derive.ts::wildcardContainers`

Every wildcard claim that lands on a list kind or a declared container, one line each with the pattern and the kind. Such a claim reads the list or container node, which stands between its enclosing kind and the members the claim means, as when the grammar's enrich lifts a group into a list node the bindings do not name. The inventory prints them and fails. An explicit claim on a list or a wrapper is deliberate and not reported.

### `packages/codegen/src/bindings/facts.ts::EnumMember`

One member of an enum kind as the assembled model stamps it: the member's kind, which a node of the enum is stored and read as, and the member's text.

### `packages/codegen/src/bindings/facts.ts::ClaimFact`

A vocabulary capture on a node: its path, its grammar kind (`_` for a wildcard), the field it sits under in its enclosing node (`null` for none), its predicates, whether it is top-level, the kinds enclosing it nearest first (`within`), and the field literals and tokens it pins. A wildcard claim's kinds are read from its enclosing kind and field (`routes.ts::admittedKinds`).

### `packages/codegen/src/bindings/facts.ts::WILDCARD`

The kind a wildcard pattern node (`(_)`, `_`) stands for in the facts: any kind its position admits.

### `packages/codegen/src/bindings/facts.ts::PredicateArgument`

One argument of a predicate: a capture by name, or text.

### `packages/codegen/src/bindings/facts.ts::UnclaimedFact`

A kind `bindings.scm` declares unclaimed (`@unclaimed`), with the pattern's `#set! reason`.

### `packages/codegen/src/bindings/facts.ts::MemberFact`

A member capture as read. `rename` names the slot its selector finds on the owner. `presence` marks an unfielded token's presence on the owner, through the kinds in `via` when it sits deeper. `kind` is the presence of a node's kind in the slot another member names (a flag). `nested` is a member of the top kind that sits below a child, reached through `via`, in `parent`'s slot the selector finds, repeated when `multiple`.

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

### `packages/codegen/src/bindings/facts.ts::ModelNode`

A kind of the node model as the bindings read it: its model type, its slots, its supertype arms, a list's element kinds, an enum's members, a fixed leaf's text and a pattern leaf's pattern.

### `packages/codegen/src/bindings/facts.ts::SlotModel`

The node model as the bindings read it, keyed by kind.

### `packages/codegen/src/bindings/facts.ts::BINDINGS_FILE`

The name of a grammar package's bindings file. The bindings path, compile, generate and the manifest check all spell it through this.

### `packages/codegen/src/bindings/derive.ts::wildcardUnrouted`

Every required member of a path that a kind reached by a wildcard claim of that path has no route for, one line per claimed kind and path: the kinds a claimed node is read as share its line. A read through such an entry still owes the path's interface, so each line is a conformance gap the build stage closes; the ratchet test in the tools inventory pins the list until then.
