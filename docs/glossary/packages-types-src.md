# `packages/types/src` — Type Glossary

### `packages/types/src/full-form.ts::MatchedAlternative`

The alternatives among `Alts` that the text `I` starts with. It distributes over `Alts`, because an `infer` inside a template literal captures a single character, not a whole alternative.

### `packages/types/src/full-form.ts::SpelledAffix`

The spelling a full-form coercer takes from its text: the alternative the text starts with, `Default` when it starts with none (bare content), and every alternative when the text is a plain `string`, since only the runtime knows it then.

### `packages/types/src/full-form.ts::WithSpelling`

A built node whose spelling slot `K` is narrowed to `P`, on both its stored field (`_<K>`) and its accessor. The narrowing comes first in the intersection, so the accessor call resolves to `P`.

### `packages/types/src/full-form.ts::Interior`

The text between a full form's delimiters, or the text itself when it does not carry both: the type mirror of `spelledInterior`'s delimiter strip. A type cannot test the interior pattern, so the runtime's fallback to the whole input (a lone `\` escape) has no mirror here; its only reader is the sibling-lead check, so the gap shows only for a polymorph arm whose interior accepts its own delimiter.

### `packages/types/src/full-form.ts::LeadCheck`

Walks a polymorph's sibling leads in the runtime's order and, for the first lead the interior starts with, gives an object type whose one key reads `starts the way <builder> does; build it with <builder>`. An argument intersected with it fails to compile with that key in the message. `unknown` when no lead matches.

### `packages/types/src/full-form.ts::SiblingLeadRefusal`

The compile-time form of `refuseSiblingLead`: a full-form coercer's input is `I & SiblingLeadRefusal<I, …>`, so a literal whose interior starts the way a sibling arm does is refused while it is being typed. A plain `string` and a config object pass unchanged and are checked at runtime.

### `packages/types/src/full-form.ts::AllOf`

Whether every character of `S` is one of `C`, walking `S` one leading character at a time: `true` for the empty rest, `false` at the first character outside `C`.

### `packages/types/src/full-form.ts::OnlyOf`

`I` when it is a non-empty string made only of characters in `C`, else `never`. A plain `string` passes unchanged, left to the runtime. Intersected with its own input (`I & OnlyOf<I, C>`), a literal outside the set fails to compile where it is written.

### `packages/types/src/options.ts::IndentOption`

The `indent` key a render's options carry: `I & OnlyOf<I, IndentChar>`, the unit as the caller spelled it and checked whole, for a grammar that admits an indent character. `unknown` (no key) when `IndentChar` is `never`. `DerivedOptions` includes it at `I = string`, so a standalone `Options` value types `indent` as `string`; `createEngine`, `createRenderEngine` and `render` include it at their inferred `I`.

### `packages/types/src/engine-api.ts::TriviaFacts`

The grammar facts `$trivia` checks against: each kind's name, the gaps an empty node of each kind holds inner trivia in, and `ir.comment`, which builds a loose string into its default arm (taking either the full spelling or the interior). It lives here so a language's hooks can carry it without importing `@sittir/common`, which re-exports it.

Every member is `readonly`, `comment` included: the facts belong to the language and are frozen where the language module builds them, so an engine cannot change them for the others. The comment coercer is a per-language fact fixed when `hooks` is built; nothing per engine sets it.

### `packages/types/src/core-types.ts::RenderCallOptions`

The options a single render takes beside the language's render options: `ignoreFormat`. It is the one declaration of that key; the engine's per-call render options, the native engine's render and a parsed tree's render all name it.

### `packages/types/src/engine-api.ts::ParseOptions`

How far one read expands. The default is lazy: a read returns one level, and a child with substructure comes back as a stub the accessors expand on demand. `deep` expands the whole subtree in one pass instead: one crossing instead of one per level, at the cost of reading what you may not touch.

### `packages/types/src/engine-api.ts::EngineIdentity`

What a node needs to know about its engine without holding it: the language's descriptor (which carries the grammar's name), the render module hash that identifies the generated surface, the engine's render options, and the language's trivia facts. Everything in it is plain data, so a node keeps it after its engine is disposed: the node guards read only the language, and `$trivia` reads its entries through the facts, while rendering and editing need the live engine.

### `packages/types/src/engine-api.ts::ParsedRead`

What a parse produces before wrapping: the raw root data and the tree it was read from. Both types are parameters, opaque by default; the native engine fixes them to its root data and its tree handle.

### `packages/types/src/engine-api.ts::EngineDiagnostics`

What an engine exposes for tooling rather than for consumers: the native build's compile profile (`buildProfile`, undefined for a binary that predates it) and `parseAndRead`, the read a parse makes before wrapping. The tree it returns is bound to the engine, so a node wrapped over it stamps that engine, exactly as `parse` does; `parse` is `parseAndRead` plus the wrapper. The single declaration of these members: the native engine's diagnostics extend it with the reads only it has, and the native language engine's members are picked from it.

### `packages/types/src/engine-api.ts::GrammarTypeMap`

The types a grammar's runtime is generic over: `namespaces` (its `NamespaceMap`), `empty` (a union of `{ node, empty }` pairs, one per kind that realizes empty), and `trivia` (the union of its trivia kind types). A trivia kind may be stored as a kind id, so the members are constrained only to `unknown`.

### `packages/types/src/core-types.ts::GrammarTriviaEntry`

A trivia entry as input: one of the grammar's trivia kinds or a string. A string is loose input: the runtime builds it into a node through the grammar's `ir.comment` (its full spelling loses the default arm's delimiters; any other text is that arm's interior), so a stored entry is always a node.

### `packages/types/src/core-types.ts::TriviaSetter`

`$trivia` over a grammar's trivia union: called with entries (rest arguments are leading, or one `{ leading, trailing }` object) or through `leading`/`trailing`, it rebuilds the node; called with no arguments, `leading`/`trailing` read the stored entries. With its defaults (`Self = AnyNodeData`, `Trivia = any`) it is the loose `$trivia` every `AnyNodeData` may carry, so a grammar's narrower setter is assignable to it.

### `packages/types/src/engine-api.ts::NodeMethods`

The methods the runtime attaches to every node (`withMethods`): `$render`, `$toEdit`, `$replace` and `$trivia` over the grammar's trivia union (`Trivia`, defaulting to `any` like `TriviaSetter`'s). The polymorphic `this` makes it self-referential, because `$trivia` rebuilds the node and hands back the same kind. NodeNs' default `Built` is the node with these methods.

### `packages/types/src/engine-api.ts::GrammarInnerTrivia`

The inner trivia of a node that realizes empty: `inner()` reads its inner entries and `inner(...items)` rebuilds the node with them.

### `packages/types/src/engine-api.ts::GrammarInnerTriviaAt`

`GrammarInnerTrivia` for a grammar where some kind has more than one gap: `innerAt(gap, ...)` reads or rebuilds one named gap.

### `packages/types/src/engine-api.ts::LanguageAPI`

The type-level shape of one language: its name, builder table, guards, kind ids, the kind-to-node-type map (`types`, type-only), its root and any-node types, the kind ids that render standalone (`fixedTextKindId`: those whose kind alone determines their text), its render options, `empty` (the grammar's map from each kind that can be empty to its empty form), and `indentChar`, the characters an indent unit may be made of (`never` for a grammar with none). `indentChar` names the grammar's own `IndentChar` alias, because the options type cannot carry it: its `indent` key is typed at a plain `string` unit, which `OnlyOf` passes through unchanged. Every engine type is derived from it.

### `packages/types/src/engine-api.ts::Language`

A language descriptor: the light default export of a grammar package. `load()` imports the implementation and resolves its hooks. `__api` is a type-only brand carrying the `LanguageAPI` and is never set at run time.

It carries `fileTypes`, the file types the grammar declares upstream (an empty list when it declares none), stamped by the generator from the model.

### `packages/types/src/engine-api.ts::NativeEngineOptions`

The options a language's native engine is created with: the format record and the render options under `options`. It is the native boundary's shape only; `createEngine` maps its own `render` option onto `options`.

### `packages/types/src/engine-api.ts::LanguageHooks`

What a language's `load()` resolves to: the builder table, guards, kind ids, trivia facts and the render module hash as data, plus `createNative` to create a native engine and `wrap` to turn a read root and its tree into the language's root node.

### `packages/types/src/engine-api.ts::NativeLanguageEngine`

One native engine instance: renders a node lazily, resolving the call's render options over the ones it was created with; applies edits to source text; parses and reads a source; reports whether a tree handle belongs to it; and releases its native state on `dispose`.

### `packages/types/src/engine-api.ts::Rendered`

A rendered node's text: rendered on first use and cached. Disposing it drops the cached text, and any use after that throws.

### `packages/types/src/engine-api.ts::Pending`

One staged change to one file. Awaiting it commits the change once; `await using` commits it at scope exit; one neither awaited nor disposed writes nothing.

### `packages/types/src/engine-api.ts::FileChange`

A file's text before and after a change, by path. `before` is `undefined` for a file the change creates.

### `packages/types/src/engine-api.ts::ApiSurface`

Which builder surface an engine's `build` exposes: the coercing default, the strict flavour, or the portable surface, which is reserved and not implemented.

### `packages/types/src/engine-api.ts::StrictMembers`

An object's members under the strict surface, with the `strict` and `coerce` flavours hidden.

### `packages/types/src/engine-api.ts::StrictSurface`

The strict builder surface, derived from the default one. A builder carrying a `strict` flavour becomes that flavour plus its members' strict surfaces (its variants). A callable without a `strict` flavour has no loose form and stays whole, which keeps its generic and overloaded signatures. A namespace object is only its members' strict surfaces, so none of its raw members survive beside the strict ones.

### `packages/types/src/engine-api.ts::BuildSurface`

The type of an engine's `build` for a surface: the builder table, its strict surface, or `never` for the unimplemented portable surface.

### `packages/types/src/engine-api.ts::Engine`

A language engine: the only value surface of a language. It carries its `EngineIdentity` (descriptor, render module hash, options, trivia facts), and builds, guards (the node guards narrow to this engine's language, by the language a node's engine carries), parses, reads, renders, and creates, edits and writes files. The engine's `types` member is type-only, mapping each kind to its node type for generic code.

### `packages/types/src/engine-api.ts::RenderInput`

What `render` accepts: any of the language's nodes, a `Renderable` of the language, or the kind id of a kind whose text the kind determines, which renders as that text. A kind id with no fixed text (an identifier, a depth sentinel) is a type error, and throws at run time naming the kind.

### `packages/types/src/engine-api.ts::Renderable`

Anything that carries `$render`, keyed by one of the language's kind ids: every `.Parsed`, every `.Bound`, and a `$with` draft, whose replaced slot reads as `.Bound` while the rest keeps its parsed surface. `$render` is declared once, on `NodeMethods`, and a draft is exactly what a node method's own `this` type produces, so the parameter is the declaration's own type rather than a union that would have to enumerate each surface a node can take.

### `packages/types/src/engine-api.ts::RenderCall`

The one call signature `render` has for a given input type: the options generic `R`, its literal inference and its `RenderOptionsCheck`. `render` is two of them intersected, so a draft is matched by the `Renderable` signature before the language's node union is tried. Comparing a draft against that union relates each of its several hundred members and exhausts the checker's relation depth, which is why the draft signature comes first and is a separate signature rather than one more member of a shared input union.

### `packages/types/src/engine-api.ts::RenderOptionsCheck`

The compile-time check on a render options literal `R`, inferred `const` so its values keep their literal types: the `indent` unit must be made only of the language's indent characters, and every key must be one the language's render options declare, or one of `Extra` (the per-call keys, for a single render). A generic parameter is exempt from the excess-property check an object literal gets against a fixed type, so the second half restores it: a misspelled key, or `indent` for a language with no indent unit, is a type error where it is written.

When `R` is exactly the language's declared options type, the check is `unknown`: such a value has no undeclared key and its indent unit is the declared one, so there is nothing to add. That identity is what lets a caller generic over the language forward options typed as `API['options']`, where the full check would stay deferred and reject the very type its parameter declares. It also leaves a value with only undeclared keys to the options type's own weak-type check, which the full check's intersection would defeat. An explicit `API` type argument disables inference, so `R` takes its default, the declared options type, and the check is skipped.

### `packages/types/src/engine-api.ts::IsExactly`

Whether two types are identical, by comparing two generic signatures that differ only in `A` and `B`. The comparison is between function types, which are not generic objects, so it resolves even while `A` and `B` are still deferred type parameters.

### `packages/types/src/engine-api.ts::EngineOptions`

An engine's options, grouped by concern: the builder surface, the render options, the format record, and the interceptors.

### `packages/types/src/engine-api.ts::Interceptor`

Middleware around an engine's operations. Each hook receives the call and a `next` that runs the rest of the chain; it may observe, change the result, or refuse by throwing. A `file` hook that doesn't call `next` blocks that write.

### `packages/types/src/engine-api.ts::Project`

A group of engines over one file set. Their file changes are staged, inspected with `staged`, `diff` and `files`, and written all or none by `commit`. Disposal discards what was not committed and disposes the engines.

### `packages/types/src/engine-api.ts::KindTypes`

A language's kind-to-node-type map, derived from two emitted type maps: `Keys` names each kind id's ir key, and `NsMap` holds each kind id's namespace, whose `Node` is the kind's node type. The key is the stamped ir key, the same fact the builder table is keyed by.

### `packages/types/src/engine-api.ts::NodeOfNamespaces`

Every node a language builds or reads, derived from its namespace map: each kind's `Node`, `Bound` and (where the namespace has one) `Parsed`, kept only where the namespace has a `Node` and a `Bound` and they are objects. A keyword's namespace gives its kind id (a number) for both, so keywords drop out: a kind id is not a node. A grammar's `<Prefix>Node` (`RustNode`) is this union over its `NamespaceMap`, and it is the language API's `node`, so everything `build` returns and everything `parse` reads is accepted by `render` by identity, with no structural relation from a `Parsed` node to its storage type, with no second list of kinds.

### `packages/types/src/engine-api.ts::Types`

The kind-to-node-type map of an engine, for generic code over any engine.

### `packages/types/src/engine-api.ts::ApiOf`

The `LanguageAPI` a descriptor carries.

### `packages/types/src/index.ts::ArgsOf`

The union of a function's argument tuples over every declared overload, up to four, a rest signature as much as a fixed one; a bare rest array reads as its element type's mutable array. Each `infer` is bounded by `readonly unknown[]`, because an unbounded rest `infer` carries a mutable `unknown[]` bound that a generated coercer's `readonly` rest parameter fails, and one failed signature fails the whole match. A forwarding wrapper declares its own surface first and its target's overloads after, and `infer P` against a plain call signature would keep only the last of them, so a seat typed through the wrapper would refuse the prebuilt node and the optional own-surface the wrapper accepts at runtime. The overlay wire types and any future consumer use this, never bare `Parameters`, for factory references.

### `packages/types/src/node-surface.ts::SlotHint`

What one slot of a kind interface contributes to its node surfaces: the type its `$with` setter and factory take (`input`), whether the slot is optional, and whether the setter takes the input as rest arguments (`rest`, where the input is the rest type) rather than as one value. The emitter stamps one per slot on the interface's `__slotHints__`; every node surface reads the hints and never infers a slot's input from its storage key.

### `packages/types/src/node-surface.ts::ListOwnerHint`

Marks a kind whose sole content is a separated list: the element type its factory accepts (`Element`), the options its factory takes, and the name of the slot that holds the list (`Slot`). Stamped under the reserved `$listOwner` key of `__slotHints__`, from the same fact that gives the strict factory its `(options?, ...items)` overloads. One element type serves every surface: the accessor reads it, iteration yields it, the `$with` setter admits it, so a read item is always accepted back by the setter that rebuilds the owner.

### `packages/types/src/node-surface.ts::NarrowTo`

What a supertype guard narrows its input to, given the supertype's member kind ids `D`. A numeric input keeps the ids in `D`. A node whose `$type` is a union of ids keeps the whole node when they all lie in `D`, and is intersected with `{ $type: D }` on the ids that do. A node broadly typed `$type: number` is intersected with `{ $type: D }`; it is detected by identity with `number`, because a numeric enum member accepts any `number` in assignability and would otherwise be taken for a member. It reads the `$type` property only, so a `.Parsed` union is never related to a storage interface.

### `packages/types/src/node-surface.ts::Remap`

Key-remapping removal of the keys `K` from `T`. It is the only form used to drop members: `Omit` does not distribute over a union and collapses it to its common keys, and a declared type built on it lost its keys and cascaded into thousands of errors. Remapping keeps each member's keys.

### `packages/types/src/node-surface.ts::SlotHintsOf`

The slot hints of a kind interface with the reserved `$listOwner` entry removed, so a setter is produced per slot and never for the list-owner fact.

### `packages/types/src/node-surface.ts::ListOwnerOf`

The `$listOwner` hint of a kind interface, or `never` when it is not a list owner. It is the single test of list-ownership, so no surface infers it from an accessor's name or from storage keys.

### `packages/types/src/node-surface.ts::ListOwnerMembers`

The members a list owner adds on top of its own accessors (its `$with` is callable, see `Setters`): it iterates the items its list accessor returns, reports `length`, gives `at(index)` over the same items, and carries the factory's options flattened on as read-only properties.

### `packages/types/src/node-surface.ts::Setters`

One setter per stamped slot, reading only `__slotHints__`. A required slot takes its input and returns the node with that slot's accessor retyped to the input. An optional slot also has a no-argument form that clears it, and reads back `undefined`. A slot stamped `rest` is set with rest arguments, its input being the rest type, exactly as the factory takes it; a slot whose input is an array but is not stamped `rest` takes the array as one value. The retyped accessor comes from the declared input, never from the argument's own type: inferring the argument per call is what made type-checking unbounded.

A list owner's list slot takes the shapes its factory takes: the whole list node, `(options, ...items)` or `(...items)`, each item admitted like the factory's element input. The owner's `$with` is callable with the same signature, so `owner.$with(...)` and `owner.$with.<list>(...)` are one setter. The call replaces the list slot, so it returns what that slot's setter returns.

### `packages/types/src/node-surface.ts::WithOf`

The type of `$with` on a node: its slot setters. A node passes itself in (`WithOf<this>`) because `this` is not allowed inside a nested type literal.

### `packages/types/src/node-surface.ts::WithSlot`

The node after `$with.<slot>(v)` (the accessor reads the slot's input resolved through the `.Bound` map, so a storage-typed input reads as its `.Bound` surface): the node with the slot's accessor and `$with` removed by key-remapping and re-added, the accessor reading the slot's input type and `$with` pointing back at this type, so a chain accumulates. A plain intersection would leave each an overload pair in which the original signature wins. A list owner's list slot keeps reading as items after it is set: whatever shape set it, the accessor returns the list's element type resolved through the `.Bound` map, or `undefined` when the slot was cleared.

### `packages/types/src/node-surface.ts::BoundOf`

The surface of every engine-bound node, computed from a kind's main interface and the id-keyed map of `.Bound` interfaces. Accessors are the main interface's own, each returning the child's `.Bound` (a stored kind id passes through unchanged; a supertype distributes member by member); the storage members stay; list owners gain `ListOwnerMembers`; `$source` is carried. It does not add `$with` or the node methods: the emitted `X.Bound` interface composes those on top (`$with` through `BoundWithNode`, which returns the node, and the methods through `NodeMethodsOf`). Children resolve through named interfaces in the map, so type-checking resolves lazily and never infers through the tree's recursion.

### `packages/types/src/node-surface.ts::ParsedOf`

The surface of a tree-bound node: the same computation as `BoundOf` with children resolved through the id-keyed map of `.Parsed` interfaces, so a parsed node's children are parsed nodes. It receives only the parsed map. The emitted `X.Parsed` interface adds the node methods and `$with` through `WithNode`, which takes both maps, because a slot replaced through `$with` holds a factory node until it is committed and reads as its `.Bound` surface.

### `packages/types/src/node-surface.ts::AdmitLookup`

The map from a kind id to every node type a slot input may hold for that kind: its `.Bound`, its `.Parsed`, and, for a kind that realizes empty, its empty form. It is built from the emitted id-keyed maps, so it never reads a kind's namespace interface, which keeps it acyclic with the argument lists that name it.

### `packages/types/src/node-surface.ts::AdmitBound`

Widens an input type so it also takes the nodes an engine produces: each member with a `$type` becomes itself plus the lookup's entry for that id, arrays and tuples widen element by element, and everything else is unchanged. It distributes over unions. The checker relates nested interface pairs to a bounded depth. Relating a kind's `.Bound` or `.Parsed` to its storage interface walks every accessor of both, and the walk exceeds that depth on deeply nested grammars. A node is therefore admitted where a kind is asked for by naming `.Bound` and `.Parsed` as explicit union members, which the checker matches by identity instead of by structure. The widening is the only place that fact is handled; every config input, positional parameter, list element and `$with` setter goes through it.

### `packages/types/src/node-surface.ts::WithNode`

`$with` for a node: the slot setters of `WithOf` with every input admitted through the lookup built from the `.Bound` and `.Parsed` maps. Each emitted `.Bound` and `.Parsed` interface declares it over `this`.

### `packages/types/src/index.ts::NodeLookup`

The `AdmitLookup` a namespace map yields, for the config and loose surfaces that receive a namespace map instead of the id-keyed maps: each id's `Bound`, `Parsed` and `Empty` members read by indexed access, whichever of the three the id's row has (a leaf or keyword row has only `Bound`). It is an indexed access and never a conditional, because a conditional over a namespace row resolves the row's base types and cycles through the argument lists of the kinds that name it.

### `packages/types/src/index.ts::Hoisted`

The type of a hoisted pair or route tree. The flavours are read by key (`B['coerce']`, then `B['strict']`), never by testing `B` against an object type with a `coerce` member: a pair whose flavours are intersections (an overlay's flavour over a base's) would otherwise be compared member against member, and that comparison exceeds the checker's depth.

### `packages/types/src/index.ts::NodeNs`

The single computed namespace of a kind. `Bound`, `Parsed` and `Empty` are the kind's engine-bound surface, its tree-bound surface and its empty form (`never` when the kind cannot be empty); `NodeLookup` reads all three.

### `packages/types/src/node-surface.ts::SupertypeSurface`

The union over a declared supertype's members of the node each id-keyed map holds for it: a member with a `$type` resolves through the map, and a stored kind id passes through. It is the one derivation behind both `S.Bound` (the `.Bound` map) and `S.Parsed` (the `.Parsed` map), so the two unions can never disagree about which members a supertype has.

### `packages/types/src/node-surface.ts::BoundWithNode`

`$with` for an engine-bound node: the same admitted slot setters as `WithNode`, but each returns the node itself, since a bound node is not tied to a tree and needs no retyped accessor. A tree-bound node keeps `WithNode`, whose setters return the node with the replaced slot reading as `.Bound`.
