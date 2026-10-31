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

The `indent` key a render's options carry, under the `layout` group: `layout.indent` is `I & OnlyOf<I, IndentChar>`, the unit as the caller spelled it and checked whole, for a grammar that admits an indent character. `unknown` (no key) when `IndentChar` is `never`. There is no top-level `indent`. `DerivedOptions` includes it at `I = string`, so a standalone `Options` value types `layout.indent` as `string`; `createEngine`, `createRenderEngine` and `render` include it at their inferred `I`.

### `packages/types/src/options.ts::NewlineOption`

The `layout.newline` key a render's options carry: one of the grammar's `LineEnding` arms (`'\n'`, `'\r\n'`, `'\r'`, the arms of its `_newline` whitespace member), for a grammar that admits `_newline`. `unknown` (no key) when `LineEnding` is `never`. `DerivedOptions` includes it, so the engine's and a call's options both carry it without a further generic.

### `packages/types/src/options.ts::LayoutOption`

The `layout` group of a render's options: `IndentOption` and `NewlineOption` intersected, so one `layout` key holds every whole-render layout setting the grammar admits.

### `packages/types/src/options.ts::IndentOption::layout`

The `layout` group key that carries the indent setting. Absent when the grammar admits no indent character.

### `packages/types/src/options.ts::NewlineOption::layout`

The `layout` group key that carries the newline setting. Absent when the grammar admits no `_newline` member.

### `packages/types/src/engine-api.ts::TriviaFacts`

The grammar facts `$trivia` checks against: each kind's name, the gaps an empty node of each kind holds inner trivia in, and `ir.comment`, which builds a loose string into its default arm (taking either the full spelling or the interior). It lives here so a language's hooks can carry it without importing `@sittir/common`, which re-exports it.

Every member is `readonly`, `comment` included: the facts belong to the language and are frozen where the language module builds them, so an engine cannot change them for the others. The comment coercer is a per-language fact fixed when `hooks` is built; nothing per engine sets it.

`Kind` types `kindName`'s argument by the language's kind ids. A language's hooks and engine identity carry `TriviaFacts<API['kindId']>`, so a generated language's `kindName` takes only its own `TSKindId`: another language's kind id, an unlisted literal or a kind name is a compile error, while a value typed as a plain `number` still compiles. `kindName` is a method, so a language's facts stay assignable to `TriviaFacts` over any kind id (the default), the type the language-agnostic trivia helpers take.

### `packages/types/src/engine-api.ts::ParseOptions`

Read depth is a performance parameter and never a semantic one. Under the default, a child with substructure comes back as a stub, and each hydration is one more crossing into the native reader. `deep` makes one crossing for the whole subtree, and the generated wrap types every slot-holding node of it as it wraps the parent (`storeExpanded`), so the typing a lazy read spreads over first accesses is paid inside the parse. The two modes agree on every result because each node a read hands back names its tree, whichever depth produced it (`canFold`).

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

### `packages/types/src/core-types.ts::TriviaFlanks`

The in-line adjacency of a trivia item the source fixes in place, as a read finds it: `$before` and `$after`, the source's whitespace on the item's line between it and the tokens beside it, absent where it touches a token or where a line break lies between. An item with either renders verbatim with them and no seam on either side (`TriviaText::verbatim`). Two items carry it: an `ErrorNode`, and a line continuation, whose own line ends inside it so the next line's alignment is its `$after`. A built continuation has neither and takes the spacing the options give its gap. Comments carry neither field.

### `packages/types/src/core-types.ts::ErrorNode`

An ERROR region read as a value. `$text()` returns the region's own bytes, a method as every node's text is (`asTextNode`); the native read's data carries them as a string. As a trivia item it also carries its in-line adjacency (`TriviaFlanks`). Its render writes the three verbatim and no seam on either side, because a seam beside what did not parse cannot be trusted. A line break beside it stays a layout entry of its side, and the run between two regions is the earlier one's `$after`.

### `packages/types/src/core-types.ts::TriviaSetter`

`$trivia` over a grammar's trivia union: called with entries (rest arguments are leading, or one `{ leading, trailing }` object) or through `leading`/`trailing`, it rebuilds the node; called with no arguments, `leading`/`trailing` read the stored entries. With its defaults (`Self = AnyUntypedNode`, `Trivia = any`) it is the loose `$trivia` every `AnyUntypedNode` may carry, so a grammar's narrower setter is assignable to it.

### `packages/types/src/engine-api.ts::NodeMethods`

The members every built and wrapped node carries: `$render`, `toString` (its text, so a node renders inside a template string) and `$trivia` over the grammar's trivia union (`Trivia`, defaulting to `any` like `TriviaSetter`'s). The polymorphic `this` makes it self-referential, because a `$trivia` position setter writes the node's own trivia and hands back that same node, typed as the same kind. NodeNs' default `Built` is the node with these methods.

### `packages/types/src/engine-api.ts::GrammarInnerTrivia`

The inner trivia of a node that realizes empty: `inner()` reads its inner entries and `inner(...items)` rebuilds the node with them.

### `packages/types/src/engine-api.ts::LanguageAPI`

The type-level shape of one language: its name, builder table, guards, kind ids (`kinds`, and `kindId`, the grammar's kind-id enum, which types its trivia facts' `kindName`), the kind-to-node-type map (`types`, type-only), its root and any-node types, the kind ids that render standalone (`fixedTextKindId`: those whose kind alone determines their text), its render options, `empty` (the grammar's map from each kind that can be empty to its empty form), and `indentChar`, the characters an indent unit may be made of (`never` for a grammar with none). `indentChar` names the grammar's own `IndentChar` alias, because the options type cannot carry it: its `indent` key is typed at a plain `string` unit, which `OnlyOf` passes through unchanged. Every engine type is derived from it.

### `packages/types/src/engine-api.ts::Language`

A language descriptor: the light default export of a grammar package. `load()` imports the implementation and resolves its hooks. `__api` is a type-only brand carrying the `LanguageAPI` and is never set at run time.

It carries `fileTypes`, the file types the grammar declares upstream (an empty list when it declares none), stamped by the generator from the model.

### `packages/types/src/engine-api.ts::NativeEngineOptions`

The options a language's native engine is created with: the render options under `options`. It is the native boundary's shape only; `createEngine` maps its own `render` option onto `options`.

### `packages/types/src/engine-api.ts::LanguageHooks`

What a language's `load()` resolves to: the builder table, guards, kind ids, trivia facts and the render module hash as data, plus `createNative` to create a native engine and `wrap` to turn a read root and its tree into the language's root node. `membership` is the language's one membership test, shared by its `is.*` guards and a query's `ofType`. `queryFlags`, present for a grammar with bindings, is each kind's flag plans (`QueryFlags`) for a `where` recorder's `is`.

The optional `hydrate` hook reuses the grammar's `hydrateChild` for a shallow child read from its own tree. Generated languages supply it so factories can consume parsed list stubs without duplicating the grammar's depth or envelope normalization.

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

### `packages/types/src/engine-api.ts::BuildSurface`

The type of an engine's `build` for a surface: the builder table, its strict surface, or `never` for the unimplemented portable surface.

### `packages/types/src/engine-api.ts::Engine`

A language engine: the only value surface of a language. It carries its `EngineIdentity` (descriptor, render module hash, options, trivia facts), and builds, guards (the node guards narrow to this engine's language, by the language a node's engine carries), parses and renders. Its `read`, `create` and `write` file verbs remain unimplemented. The engine's `types` member is type-only, mapping each kind to its node type for generic code. Its mode parameter is invariant (`in out`), so an engine built for either mode is not assignable to one built for the strict mode.

### `packages/types/src/engine-api.ts::RenderInput`

What `render` accepts: any of the language's nodes, a `Renderable` of the language, or the kind id of a kind whose text the kind determines, which renders as that text. A kind id with no fixed text (an identifier, a depth sentinel) is a type error, and throws at run time naming the kind.

### `packages/types/src/engine-api.ts::Renderable`

Anything keyed by one of the language's kind ids that carries `$render` or holds the tree it was parsed from: every `.Bound`, every `.Parsed`, and a `$with` draft, whose replaced slot reads as `.Bound` while the rest keeps its parsed surface. `$render` is declared once, on `NodeMethods`, the tree once, on `HoldsTree`, and a draft is exactly what a node method's own `this` type produces, so the parameter is the declarations' own types rather than a union that would have to enumerate each surface a node can take.

### `packages/types/src/engine-api.ts::RenderCall`

The one call signature `render` has for a given input type: the options generic `R`, its literal inference and its `RenderOptionsCheck`. `render` is two of them intersected, so a draft is matched by the `Renderable` signature before the language's node union is tried. Comparing a draft against that union relates each of its several hundred members and exhausts the checker's relation depth, which is why the draft signature comes first and is a separate signature rather than one more member of a shared input union.

### `packages/types/src/engine-api.ts::LayoutKeysCheck`

The `layout` half of `RenderOptionsCheck`: every key inside a caller's `layout` must be one the language's own declared `layout` carries (`DeclaredLayout`), so a language with `newline` but no `indent` (regex) rejects `layout.indent` even beside a valid `newline`, and a language with no `layout` rejects any.

### `packages/types/src/engine-api.ts::RenderOptionsCheck`

The compile-time check on a render options literal `R`, inferred `const` so its values keep their literal types: the `layout.indent` unit must be made only of the language's indent characters, every top-level key must be one the language's render options declare, or one of `Extra` (the per-call keys, for a single render), and every key inside `layout` must be `indent` or `newline`. A generic parameter is exempt from the excess-property check an object literal gets against a fixed type, so the rest restores it: a misspelled key, `layout` for a language with no layout setting, or `indent` at the top level, is a type error where it is written.

A grammar-independent engine (`Engine<LanguageAPI>`) declares the options every language shares, because `LanguageAPI['options']` is `object & CommonRenderOptions`: `layout`, with `indent` and `newline` strings inside it. The check needs no case for it. The intersection with `object` is what lets every language's own options still extend `LanguageAPI`: a bare `CommonRenderOptions` is a weak type, and a language whose options carry no `layout` has no property in common with it. The generic engine cannot know which languages admit an indent unit, so a call that is typed here can still be refused when it renders: a language with no indent characters (regex) refuses `layout.indent` with an unknown-key error, and the types only promise what every language's options share. A language's own `layout` still narrows to its indent characters; the generic one takes any string unit.

When `R` is exactly the language's declared options type, the check is `unknown`: such a value has no undeclared key and its indent unit is the declared one, so there is nothing to add. That identity is what lets a caller generic over the language forward options typed as `API['options']`, where the full check would stay deferred and reject the very type its parameter declares. It also leaves a value with only undeclared keys to the options type's own weak-type check, which the full check's intersection would defeat. An explicit `API` type argument disables inference, so `R` takes its default, the declared options type, and the check is skipped.

### `packages/types/src/type-utils.ts::IsExactly`

Whether two types are identical, by comparing two generic signatures that differ only in `A` and `B`. The comparison is between function types, which are not generic objects, so it resolves even while `A` and `B` are still deferred type parameters. It is the one identity test of `@sittir/types`: `RenderOptionsCheck` skips its check on it, and the refusal walk stops on it (`Refusals`). It lives in a module the package does not re-export, so it is not public. type-fest's `IsEqual` is not used in its place: it first tests assignability both ways, which does not resolve while `A` and `B` are deferred type parameters, so a caller generic over the language could no longer forward options typed `API['options']`, and across the refusal walk it costs about nine percent more instantiations.

### `packages/types/src/engine-api.ts::EngineOptions`

An engine's options, grouped by concern: the API selection (`ApiSelection`, which requires `api` for every mode except the default) and the other settings (`EngineSettings`). It is a type alias, not an interface.

### `packages/types/src/engine-api.ts::Interceptor`

Middleware around an engine's operations. Each hook receives the call and a `next` that runs the rest of the chain; it may observe, change the result, or refuse by throwing. `createEngine` activates build, parse and render hooks in registration order, with the first outermost. Build includes nested variants and strict/coerce flavours inside engine scope; parse includes wrapping and error handling. Render hooks run lazily on first text materialization, see merged engine/per-call options, and their transformed text is shared by `toString`, `print` and `save`. Diagnostic reads bypass parse middleware. File verbs remain unimplemented, so the `file` hook is reserved for their future write pipeline; it does not run today.

### `packages/types/src/engine-api.ts::Project`

A group of engines over one file set. Their file changes are staged, inspected with `staged`, `diff` and `files`, and written all or none by `save`. Disposal discards what was not saved and disposes the engines. Draft `commit` updates a parsed tree; project `save` writes committed files to disk.

### `packages/types/src/engine-api.ts::KindTypes`

A language's kind-to-node-type map, derived from two emitted type maps: `Keys` names each kind id's ir key, and `NsMap` holds each kind id's namespace, whose `Node` is the kind's node type. The key is the stamped ir key, the same fact the builder table is keyed by.

### `packages/types/src/engine-api.ts::NodeOfNamespaces`

Every node a language builds or reads, derived from its namespace map: each kind's run-time forms, kept only where the namespace has a `Node` and a `Bound` and they are objects. A kind with a `Parsed` form (a branch) contributes `Bound | Parsed`; its `Node` is the storage shape, never a node value. A kind without one (a leaf) contributes `Node | Bound`, since a parsed leaf is its `Node`. So no kind puts both its data `Node` and its `Parsed` form in the union. That matters when TypeScript narrows a value by this union (`engine.isNode`): it relates the candidate to every union member, because a `$type` shared by several members resolves to no single member. Members of other kinds fail on `$type` at once, but a branch's data `Node` shares the candidate's `$type` and names the same accessors with data return types. Relating `Parsed` to that `Node` walks the node graph through those accessors, a distinct interface at every step, and fails only far down, so it can exceed the checker's depth limit depending on what is already cached. A keyword's namespace gives its kind id (a number) for both, so keywords drop out: a kind id is not a node. A grammar's `<Prefix>Node` (`RustNode`) is this union over its `NamespaceMap`, and it is the language API's `node`, so everything `build` returns and everything `parse` reads is accepted by `render` by identity, with no structural relation from a `Parsed` node to its storage type, with no second list of kinds.

### `packages/types/src/engine-api.ts::Types`

The kind-to-node-type map of an engine, for generic code over any engine.

### `packages/types/src/engine-api.ts::ApiOf`

The `LanguageAPI` a descriptor carries.

### `packages/types/src/engine-api.ts::CommonRenderOptions`

The render options every language shares, under the `layout` group (`indent` and `newline`, both strings): what a caller holding an `Engine<LanguageAPI>` can pass to `render`. `LanguageAPI['options']` is `object & CommonRenderOptions`, so the generic engine declares them and `RenderOptionsCheck` needs no generic case; a language's own options add its kinds' option sites and narrow `layout` to the units it admits. The `object &` keeps the declared type from being a weak type, which would reject every language whose options carry no `layout`.

### `packages/types/src/index.ts::ArgsOf`

The union of a function's argument tuples over every declared overload, up to four, a rest signature as much as a fixed one; a bare rest array reads as its element type's mutable array. Each `infer` is bounded by `readonly unknown[]`, because an unbounded rest `infer` carries a mutable `unknown[]` bound that a generated coercer's `readonly` rest parameter fails, and one failed signature fails the whole match. A forwarding wrapper declares its own surface first and its target's overloads after, and `infer P` against a plain call signature would keep only the last of them, so a seat typed through the wrapper would refuse the prebuilt node and the optional own-surface the wrapper accepts at runtime. The overlay wire types and any future consumer use this, never bare `Parameters`, for factory references. For a generic numeric call (`<const N extends …>(value: N & NumericLiteral<N, …>)`) the row is the widened call: each type parameter resolves at its constraint, where the refusal is the identity, so the row keeps the plain `string | number | bigint` and the comparison with the entry holds.

### `packages/types/src/node-surface.ts::SlotHint`

What one slot of a kind interface contributes to its node surfaces: the type its `$with` setter and factory take (`input`), whether the slot is optional, and whether the setter takes the input as rest arguments (`rest`, where the input is the rest type) rather than as one value. An elements seat also names the config object of its group (`config`): the setter admits it beside each element, while the accessor and the stored input keep reading elements only. The emitter stamps one per slot on the interface's `__slotHints__`; every node surface reads the hints and never infers a slot's input from its storage key.

### `packages/types/src/node-surface.ts::ListViewHint`

Marks a kind that reads as a list, a separated list or a list owner: the item type its list factory accepts (`Element`) and the options that factory takes. Stamped under the reserved `$listView` key of `__slotHints__`. The node's surface becomes a `ListView` of those items, so one item type serves every surface: indexing and every array method yield it, and a slot's setter admits it, so a read item is always accepted back.

### `packages/types/src/node-surface.ts::ListSlotHint`

Marks one slot that holds a list: the item type and the options of the list kind it holds. Stamped per slot under the reserved `$listSlots` key of `__slotHints__`, with the config object of the list's element group when it has one (`Config`). The slot's setter takes that kind's builder arguments, each item admitted as an element or that config object, `(...items)` or `(options, ...items)`, beside the whole node and, on an optional slot, no argument. The item rest has no minimum length, so a list read back can be spread into it; the list's own factory rejects an empty list that the grammar does not allow.

### `packages/types/src/node-surface.ts::FlatShapesOf`

The flattened members of a seated node, one shape per seat, intersected; both the `Bound` and the `Parsed` alias of a seated kind add it to their surface. A required seat has one shape, present. An optional seat is the union of a present and an absent shape. Each flattened field is a property whose value is its reader: a function on the present shape and `undefined` on the absent one, so a plain property check narrows the whole shape, siblings included (`if (block.matchArms !== undefined) block.lastArm()`); the stored property (`Stored`) narrows it the same way.

The present shape pins the stored property to the group, reads the seat and every flattened field, and its `$with` sets every flattened field and the seat; clearing the seat yields the absent shape. The absent shape pins the stored property and every flattened field to `undefined`, reads the seat as `undefined`, and its `$with` sets only the group's required field (when the group has exactly one) and the seat, each yielding the present shape; an optional field cannot be set on an absent group. Each setter names the node it yields (the surface, the other seats' shapes, and this seat's new shape), so a chain keeps the shapes. The surface's own `$with` omits the seat and its keys, so the shape's setters are the only ones. The union is one level per seat, which keeps it shallow for the checker.

### `packages/types/src/node-surface.ts::FlatHint`

Marks a kind that seats a flattened group: the slot that holds the group (`Slot`), the group's type, the keys that flatten it (`Keys`, a map from the name the parent reads and sets each key by to the group field it stands for; the two differ only for a key the seat prefixed), whether the seat is optional, and the parent's storage property that holds the group (`Stored`). Stamped under the reserved `$flat` key of `__slotHints__`, from the fact that gives the strict factory its flattened config keys; a kind that seats several groups stamps the union of their hints, and the surface types read each key, accessor and setter from the hint that names it. Each key is a reader property and a `$with` setter on the parent, with the shape the group's own accessor and setter have for its field, present or absent as `FlatShapesOf` gives them; the seat's own accessor stays, except where a key spells it.

### `packages/types/src/node-surface.ts::NarrowTo`

What a supertype guard narrows its input to, given the supertype's member kind ids `D`. A numeric input keeps the ids in `D`. A node whose `$type` is a union of ids keeps the whole node when they all lie in `D`, and is intersected with `{ $type: D }` on the ids that do. A node broadly typed `$type: number` is intersected with `{ $type: D }`; it is detected by identity with `number`, because a numeric enum member accepts any `number` in assignability and would otherwise be taken for a member. It reads the `$type` property only, so a `.Parsed` union is never related to a storage interface.

### `packages/types/src/node-surface.ts::Remap`

Key-remapping removal of the keys `K` from `T`. It is the only form used to drop members: `Omit` does not distribute over a union and collapses it to its common keys, and a declared type built on it lost its keys and cascaded into thousands of errors. Remapping keeps each member's keys.

### `packages/types/src/node-surface.ts::FlagsHintOf`

The vocabulary flags a node type's kind declares, read from its `__flags__`, which a bound grammar's `portable.ts` declares on the kind's node interface and the parsed surface carries (`SurfaceOf`); `never` for a kind with none.

### `packages/types/src/node-surface.ts::SlotHintsOf`

The slot hints of a kind interface with the reserved `$listView` and `$listSlots` entries removed, so a setter is produced per slot and never for those facts.

### `packages/types/src/node-surface.ts::ListViewOf`

The `$listView` hint of a kind interface, or `never` when the kind does not read as a list. It is the single test, so no surface infers it from an accessor's name or from storage keys.

### `packages/types/src/node-surface.ts::ListView`

What a kind that reads as a list adds on top of its own accessors: `ReadonlyArray` of its items, and the list factory's options flattened on as read-only properties.

### `packages/types/src/node-surface.ts::Setters`

One setter per stamped slot, reading only `__slotHints__`, except a flattened group's seat and keys, whose setters `FlatShapesOf` gives per shape. The hints come from `Of`, which defaults to the node itself; a seated kind's surface reads them from its own interface while its setters return the alias, which would otherwise refer to itself. A required slot takes its input and returns the node with that slot's accessor retyped to the input. An optional slot also has a no-argument form that clears it, and reads back `undefined`. A slot stamped `rest` is set with rest arguments, its input being the rest type, exactly as the factory takes it; a slot whose input is an array but is not stamped `rest` takes the array as one value. The retyped accessor comes from the declared input, never from the argument's own type: inferring the argument per call is what made type-checking unbounded.

A slot stamped in `$listSlots` also takes the builder arguments of the list kind it holds, `(options, ...items)` or `(...items)`, each item admitted like the factory's element input; it returns what the slot's setter returns for the whole node. `$with` is never callable.

### `packages/types/src/node-surface.ts::WithOf`

The type of `$with` on a node: its slot setters. A node passes itself in (`WithOf<this>`) because `this` is not allowed inside a nested type literal.

### `packages/types/src/node-surface.ts::WithSlot`

The node after `$with.<slot>(v)` (the accessor reads the slot's input resolved through the `.Bound` map, so the replaced slot reads as its kind's `.Bound` surface): the node with the slot's accessor and `$with` removed by key-remapping and re-added, the accessor reading the slot's input type and `$with` pointing back at this type, so a chain accumulates. A plain intersection would leave each an overload pair in which the original signature wins. A resolved node that is itself a `ReadonlyArray` (a list view) is kept as it is, not read as a plain array.

An edited node keeps its parsed shape, so a child the edit left alone still reads as the parsed node it is. Its `$trivia` is retyped too (`DraftTrivia`): the setters return the kind's `.Bound` rather than the parsed node. An edited node is no longer the parsed node it was built from, and typing it this way is what lets the checker compare an edited node with the kind's `.Bound` and finish. With a parsed `$trivia`, that comparison asked again whether the parsed node is a `.Bound`, through `$with`, and each turn built a new edited type (`WithSlot<WithSlot<…>>`). The cycle never met a pair it had already seen, so the check ran out of stack depth (TS2321), or failed, depending on which files the program had checked first. An edited node is therefore not assignable to the parsed type; a slot takes it as an admitted input.

### `packages/types/src/node-surface.ts::DraftTrivia`

The `$trivia` of an edited node: the trivia setter of `Self` with its result retyped to the kind's `.Bound` (`BoundFormOf`), keeping the trivia entry type.

### `packages/types/src/node-surface.ts::BoundFormOf`

The `.Bound` surface of a node's kind: the entry of the `.Bound` map at the node's `$type`, or the node itself when its `$type` names no entry.

### `packages/types/src/node-surface.ts::BoundOf`

The surface of every engine-bound node, computed from a kind's main interface and the id-keyed map of `.Bound` interfaces. Accessors are the main interface's own, each returning the child's `.Bound` (a stored kind id passes through unchanged; a supertype distributes member by member); the storage members stay; kinds that read as a list gain `ListView`. A seated group's slot accessor and its flattened keys are left to `FlatShapesOf`, which the emitted `X.Bound` adds on top. It does not add `$with` or the node methods: the emitted `X.Bound` interface composes those on top (`$with` through `BoundWithNode`, which returns the node, and the methods through `NodeMethodsOf`). Children resolve through named interfaces in the map, so type-checking resolves lazily and never infers through the tree's recursion.

### `packages/types/src/node-surface.ts::ParsedOf`

The surface of a tree-bound node: the same computation as `BoundOf` with children resolved through the id-keyed map of `.Parsed` interfaces, so a parsed node's children are parsed nodes. A seated group's slot and flattened keys are left to `FlatShapesOf`, as for `BoundOf`. It receives only the parsed map. A parsed node carries its position (`$span`, a `ByteSpan`) at run time, but the position is not part of the public node type; internal tools read it through `spanOf` in `@sittir/common/utils`. The emitted `X.Parsed` interface of a kind with a structure adds `HoldsTree`, the node methods and `$with` through `WithNode`, which takes the `.Bound` map, because a slot replaced through `$with` holds a factory node until it is committed and reads as its `.Bound` surface. A terminal kind's `X.Parsed` does not go through `ParsedOf`: it is the leaf's data over `HoldsTree`, with no node methods and no `$with`, because a parsed leaf is plain data.

### `packages/types/src/node-surface.ts::Admit`

What an input admits where it names a node: each member with a numeric `$type` becomes the object `{ readonly $type: Id } & NodeMarker` of that kind, written out in place so a hover shows it flat. Both arms are facts of the object at run time, the ones `isNode` tests: every node holds a source stamp, set where a builder, a read or a validator's copy creates it, and every object read from a parse also holds its tree's token, a parsed leaf included. `Renderable`, what `engine.render` takes, is defined as `Admit` of a bare `$type`, so the two cannot drift apart. Arrays and tuples are mapped element by element, and everything else (leaf text, kind ids, brands, config objects) is unchanged. It distributes over unions. A built node, a parsed node and an edited node (a draft) all pass by kind with no structural comparison, so nesting a draft into a builder or a parent's slot cannot exceed the checker's depth. A storage-shaped object is refused, because the storage interfaces are internal and hold neither arm; so is a structured clone or a JSON copy of a parsed node, which leaves its tree behind. Builder parameters, strict config fields, setters and the generated coercers' internals all admit through it. By itself it cannot refuse an untyped node, since TypeScript admits a plain `number` into any numeric enum; a function that admits a node adds `RefuseUndeclared` over the value it infers. The loose surface applies it to each node arm where that arm enters the widening (the passthrough of `TagEachArm`, `LooseOrConfigBag` and the depth and cycle cut-offs, a leaf's node arm, a kind enum's node arm), never to a widened value as a whole: a kind-tagged config (`{ $type: Name } & <config>`) also carries a numeric `$type`, and for a kind without fields it is the same type as that kind's storage, so only the place a node arm is introduced can tell the two apart.

### `packages/types/src/node-surface.ts::ValueSetter`

A slot setter: one value admitted through `Admit` (rest arguments for a repeated slot, each admitted the same way), and no argument to clear an optional slot. It is generic over the value (`AdmitsOne`, `AdmitsEach`), so it refuses an untyped node (`RefuseUndeclared`). Otherwise `$with.<slot>` takes what the builder's matching input takes, and the generated builders refuse an untyped node the same way.

### `packages/types/src/node-surface.ts::ListItems`

A list slot's items form, with and without its options, each item admitted through `Admit`; the options come first as `ListOptions`. Both are generic over the items, and refuse the call when any item is untyped (`RefuseUndeclared`).

### `packages/types/src/node-surface.ts::ListOptions`

A list's options bag where a caller passes it: a list slot's setter and a generated list builder (through `listOptionsParam`). It is closed to nodes by an absent `$type`: a list node reads as a `ListView` that carries the same option keys (`delimiter`), so without the closure a list node of another kind would be taken as the options. The `ListView` itself keeps the bare options, since a list node does have a `$type`.

### `packages/types/src/node-surface.ts::SlotSetterOf`

A slot's setter: `ValueSetter`, and for a list slot also `ListItems`.

### `packages/types/src/node-surface.ts::WithNode`

`$with` for a node: the slot setters of `WithOf`, whose results read a replaced slot through the `.Bound` map. Each emitted `.Bound` and `.Parsed` interface declares it over `this`.

### `packages/types/src/index.ts::NodeNs`

The single computed namespace of a kind. `Bound`, `Parsed` and `Empty` are the kind's engine-bound surface, its tree-bound surface and its empty form (`never` when the kind cannot be empty). `Loose` and `LooseArgs` admit a node of the kind through `Admit`.

### `packages/types/src/node-surface.ts::SupertypeSurface`

The union over a declared supertype's members of the node each id-keyed map holds for it: a member with a `$type` resolves through the map, and a stored kind id passes through. It is the one derivation behind both `S.Bound` (the `.Bound` map) and `S.Parsed` (the `.Parsed` map), so the two unions can never disagree about which members a supertype has.

### `packages/types/src/node-surface.ts::FormsHolding`

The members of a supertype union whose `$with` setter for a slot admits a given value. A union's `$with` is the intersection of its members' setters, which is the sound type for a call that must work on every member, so a slot whose members disagree on its value type refuses all values at the union. The helper distributes over the union and keeps a member when one overload of its own `$with` setter takes the value as first argument, so it is derived from the same slot types the setters are and cannot drift from them. Overloads are read through `SetterParameters`, since inferring from an overloaded type sees only its last signature: an optional slot's nullary clearing overload and a list slot's rest overload would otherwise hide the overload that takes the node. The nullary overload admits nothing. Comparison is `[Value] extends Params`, not distributive over `Value`, so a union-valued `Value` must fit whole. A member without that setter, or whose setter does not admit the value, drops out; if none admits it the result is `never`. An untyped `Value` (any member whose `$type` is a plain `number`) gives `never` before the comparison: `SetterParameters` reads a generic setter's parameters with its type parameter at the constraint, which drops the `RefuseUndeclared` check the setter applies to the value it infers, and TypeScript admits `number` into any numeric enum, so the comparison alone would keep forms whose setters refuse the value. The check is the setters' own walk (`Refusals`), with no declared input.

### `packages/types/src/node-surface.ts::BoundWithNode`

`$with` for an engine-bound node: the same admitted slot setters as `WithNode`, but each returns the node itself, since a bound node is not tied to a tree and needs no retyped accessor. A tree-bound node keeps `WithNode`, whose setters return the node with the replaced slot reading as `.Bound`.

### `packages/types/src/index.ts::UndefinedIfOptional`

`undefined` for a key the node declares optional, `never` for a required one. `ConfigOf` appends it to the three keyword-presence arms (boolean keyword, bitflag, kind enum), so an explicit `undefined` is accepted exactly where the key itself may be omitted. The optional key keeps it spelled out because the types are published, and a consumer compiling with `exactOptionalPropertyTypes` must still be able to pass `{ key: undefined }` for an optional slot.

### `packages/types/src/index.ts::PlainBuilders`

A builder's own public overloads are generic, and a generic parameter gives no contextual type to its argument, so a coercer's inner helper whose result is inferred from the parameter it fills (`coerceMixedEnumStorage`, `_keywordOr`) would infer `unknown`. The first signature takes any overload's arguments, so a call with none, or a forwarding builder's first form, still resolves; the last is the builder's own last overload, so `Parameters<typeof F.buildX>` and `ReturnType<typeof F.buildX>` read what they read on the builder itself.

### `packages/types/src/vocabulary/utils.ts::Flag`

The marker a vocabulary interface declares a yes/no fact with: `readonly static?: Flag`. A flag is a bit in the node's one bitflag, tested by `is` and set by a builder step or a structure's `$flags`, never a member, so no value satisfies the marker and a structure can only leave it out. A `boolean` member is data, as a python complex pattern's `sign` is. The inventory reads the marker to write the flag's bit in `Flags`, and the generator to emit its guard and step.

### `packages/common/src/portable/flags.ts::Flags`

The flags' bits, one per flag name the vocabulary declares, in name order: `Flags.Static | Flags.Async` combines two flags and `&` tests one, as a native bitflag does. The bindings inventory writes the module from the `Flag` declarations (`bindings-inventory --write`) and `--check` holds it to them, so it is never edited. It is the vocabulary's one run-time value; an `enum` is not erasable syntax, which the vocabulary may use because nothing the grammar executes imports it.

### `packages/types/src/keyword-presence.ts::BooleanKeyword`

The brand on a keyword-presence slot's boolean storage, carrying the keyword's text. It lives in its own module so the query types read it (`IsBooleanKeyword`) without importing the package index.

### `packages/types/src/query.ts::QueryPlan`

The plan language one condition compiles to, which the native walk and `holds` both evaluate. Leaves read the values a slot holds, the slot named by its number in each kind (`SlotSubject`): `eq` and `match` their text, `present` that one exists, and `is` their kind ids: the id the read stores for a value it stores as a unit (an enum kind's member, however its node spells it), and the stamped kind id of any other. An `is` leaf may instead test the node itself (`SelfText`), by its stamped kind: under a `child` step that guards a kind's own plan to the nodes of that kind. The ids are expanded by membership when the plan is compiled, as `ofType` expands them, so the evaluators compare ids and never names. `child` moves the condition to a node the slot holds, narrowed by an anchor, so a flag spelled inside a wrapper (rust `function_item (function_modifiers "async")`) is still one plan. `not`, `and` and `or` combine. A constant is `and` or `or` over no plans, never an op of its own: a plan that always holds (a flag the kind's own form spells) is `{ op: 'and', of: [] }`, and one that never holds is `{ op: 'or', of: [] }`.

### `packages/types/src/node-surface.ts::SlotFlagsHintOf`

The vocabulary flags a slot test can read on each of a node type's slots, by slot accessor, read from its `__slotFlags__`, which a bound grammar's `portable.ts` declares on the node interface beside `__flags__` and the parsed surface carries (`SurfaceOf`); `never` for a type with none. It is what types a flag carried by a kind read as a kind-id leaf, which has no node interface of its own.

### `packages/types/src/node-surface.ts::RefuseUndeclared`

Why the refusal needs a generic check. TypeScript admits a plain `number` into a numeric enum, into one of its members, into a union of members and into an object property typed by one, so `{ $type: number, $render }` fits `Admit` of every kind. No non-generic shape separates `number` from an enum member:
- Mapping the member to its numeric literal refuses `number`, but it admits another language's member of the same value, and the per-language enums are what refuse a foreign node.
- Intersecting the member with its literal reduces to `never`.
- Giving untyped nodes an enum of their own breaks `AnyUntypedNode` as the type every typed node flows into: a member of one enum is not assignable to another, and the only type every member flows into is `number`, which flows back into every enum.

So the admitting function is generic over the value, and the check reads the type it infers. A generic parameter also loses TypeScript's excess-property check, which applies only to a target that is not generic, so given the parameter's declared input the check refuses a key that input does not declare as well. One walk finds both (`Refusals`), reading the value beside its declared shape. A value typed `any` passes, as it does everywhere. The setters of the node surface are built on it (`AdmitsOne`, `AdmitsEach`, `ListItems`), and so is every generated builder: a strict builder per node-valued slot (`RefusingConfig`, a positional value, a rest of items), and a loose builder, or a strict one whose whole config is generic, over its whole input with that input as `Declared`.

The refusal is one fixed key, `refused`, whose value names the reasons. A key per reason fails both ways it can be written. Keyed by the walk directly, the mapped type makes TypeScript check at the declaration that the generic key is a property key, which chases the walk while its value is still a type parameter, where nothing ends it, until the instantiation depth overflows. Keyed by the walk through `infer`, the mapped type becomes a place TypeScript infers the value's type parameter from, and that pulls the parameter back to its constraint, the declared input, which the walk admits unwalked. A fixed key is neither. The alias stays a conditional on the walk, so while the value is a type parameter TypeScript keeps the name `RefuseUndeclared<…>` in hovers and declaration emit instead of expanding the walk, which the declaration of an exported setter could not serialize.

From type-fest, the walk takes `KeysOfUnion` for a union's keys (`KeyRefusals`). The rest of what it offers here does not fit. `IsEqual` is not the identity test (`IsExactly`). `IsAny` wraps its argument in `NoInfer`, which costs about eleven percent more instantiations at every step of the walk, so the walk tests `any` inline. `Exact` refuses keys alone, so it would be a second walk beside the one that finds untyped nodes; it recurses along the declared shape, which the named loose configs make recursive; and it is written as an F-bounded constraint.

### `packages/types/src/node-surface.ts::AdmitsOne`

A function that admits one value: generic over it, so `RefuseUndeclared` can read what the caller passed. Every single-value setter of the node surface (a slot, a flat key, a seat) is one; when its parameters are inferred from outside, as `FormsHolding` does, the value takes its constraint and the check is `unknown`.

### `packages/types/src/node-surface.ts::AdmitsEach`

The rest form of `AdmitsOne`: generic over the argument tuple, checked over the union of its items, so a repeated slot or a flat key's rest refuses the call when any item is untyped.

### `packages/types/src/node-surface.ts::RefusingConfig`

The refusal sits on the config rather than on each field because of how TypeScript infers a field's parameter. An optional field typed `S & RefuseUndeclared<S>` reads as the union `(S & RefuseUndeclared<S>) | undefined`, and against a union target TypeScript infers `S` from each member of a union value separately and keeps the first. A value that may be a built or a parsed node, `{ $type } & (HoldsTree | { $render })`, then infers as its held-tree member alone and fails. A field typed by the bare parameter infers whole. The mapped config also keeps TypeScript's excess-property check, which an intersection with the config, or one parameter over the whole config, loses.

### `packages/types/src/node-surface.ts::Refusals`

What `RefuseUndeclared` refuses in a value, as a union of reasons: `an untyped node has no language`, `an unknown key: <path>`, or `an input nested too deep to check: <path>`, the path being the keys and tuple indices from the parameter down, dotted (`Step`). It walks the value beside `Declared`, the declared shape at the same place, so a nested config's keys are checked against the configs its field declares; with no declared shape only untyped nodes are found. A value typed `any` proves nothing. A value identical to its declared shape, or to one of its members (`IsOneOf`), holds nothing undeclared by construction, and a builder's type parameter read at its constraint (`ArgsOf`, `Parameters`) is exactly that value, so reading a signature from outside costs no walk; a nested value typed by a generated loose config stops there too, one level below where it enters. Otherwise it distributes over a union value.

The walk has one termination rule: it opens at most `WalkDepth` lists and configs on a path (`Depth`), and refuses what lies deeper by name rather than admitting it unread. Loose configs nest without a bound, since a kind's named loose config restarts the widening's own depth, so a cut-off that admitted would admit an untyped node or a misspelled key below it. The walk does not stop at a type it has already opened. That test would rest on TypeScript's identity relation, which stops comparing after about three nested levels of one tuple or array target and calls the two types identical, so a literal would match one of its own ancestors and leave its subtree unread; a finite literal never contains itself, so any such match is false. A user-declared recursive type, and a type that expands as it recurses, are refused at the bound instead.

### `packages/types/src/node-surface.ts::MemberRefusals`

One member of a union value. A `$type` that is a plain `number` is an untyped node: `` `${number}` `` is assignable to the template of `$type` only when `$type` is `number` itself, the template of an enum member or a numeric literal being one numeral, while a conditional on `number extends Id` cannot tell them apart, since `number` is assignable to any numeric enum member. A node (`NodeMarker`: a source stamp, or a held tree) ends the walk, since its fields are typed storage; a config that names `$render` or `$source` is no node, and is opened. Any other object with a key is opened (`OpenedRefusals`): a list, a config, a config tagged with a kind, and a function carrying config fields, which the coercer reads as a config. An object with no key, a bare function included, and anything that is no object (leaf text, a kind id, `undefined`) holds nothing.

### `packages/types/src/node-surface.ts::OpenedRefusals`

A list's or a config's refusals. It stops at a value identical to a member of its declared shape, and refuses one with `WalkDepth` values already opened above it on its path as too deep to check. Otherwise a list (`ListOf`) walks its items (`ItemRefusals`), and anything else is a config, an object a list was spread into included, which refuses the keys none of its declared configs names (`KeyRefusals`) and walks each field beside the same field of those configs (`FieldRefusals`), each one level deeper.

### `packages/types/src/node-surface.ts::ConfigShapes`

The declared configs a config can be: the config members of its declared shape (`Configs`), narrowed by its `$type` when it carries one (`Tagged`), as TypeScript narrows a union by its discriminant.

### `packages/types/src/node-surface.ts::Configs`

The members of a declared shape that a config is checked against: its objects that are neither a list, a function nor a node (`NodeMarker`).

### `packages/types/src/node-surface.ts::Tagged`

The declared configs whose `$type` admits a tag. A config that declares no `$type` is kept.

### `packages/types/src/node-surface.ts::KeyRefusals`

The keys of a config that none of its declared configs names, each as `an unknown key: <path><key>`, a numeric or symbol key included (`KeyText`). `$type` is the tag, which the declared configs narrow by, not a key to check. A config with no declared config at its place, as on a strict builder's value, has no key check. With several declared configs a key is checked against the keys of all of them together (type-fest's `KeysOfUnion`), as TypeScript's own excess-property check does against a union: an untagged config whose place declares both the kind's own config and its bare slot's config can name a key of either.

### `packages/types/src/node-surface.ts::FieldRefusals`

Each field of a config walked beside the same field of its declared configs (`FieldOf`), its key appended to the path as `KeyText` spells it. `$type` is the tag, not a field.

### `packages/types/src/node-surface.ts::FieldOf`

A field's declared shape: the field's type in each declared config that names it, without `undefined`.

### `packages/types/src/node-surface.ts::ItemRefusals`

A list's items walked beside its declared list's items (`ItemOf`). A tuple, which a `const` parameter infers for a list literal and a rest parameter for its arguments, walks each item beside the declared item at its index, the index appended to the path; a list of unknown length walks its item type. A tuple's optional items are walked as required ones: an absent item holds nothing, and its `undefined` must not reach the reasons.

### `packages/types/src/node-surface.ts::ItemOf`

The declared item at an index: a declared tuple's element there, or a declared list's item type.

### `packages/types/src/node-surface.ts::IsOneOf`

Whether a type is identical to some member of a union (`IsExactly`), not merely assignable to it: an untyped node is assignable to a declared shape, which is why the walk exists.

### `packages/types/src/node-surface.ts::WalkDepth`

How many lists and configs the refusal walk opens on one path before it refuses the next as too deep to check. Twenty is set by probe, with margin below where the checker itself gives up, so every input ends in a named refusal, never in the checker's own depth error: a type that expands as it recurses exhausts the checker's instantiation depth at a bound of 24, and a chain of tagged block configs at 30 configs deep. At twenty, a chain of block configs nineteen levels below the input is read whole, one value opened per level, and a statements → expression statement → block chain six levels below, three values opened per level. A statements chain fifteen or more levels deep fails in the checker regardless: comparing a generic input that deep against its declared loose shape exceeds the checker's stack, with or without the refusal.

### `packages/types/src/node-surface.ts::Step`

A refusal's path one key or tuple index deeper, dotted, with no leading dot at the top.

### `packages/types/src/node-surface.ts::NodeMarker`

What makes an object a node, for admission and for the refusal walk alike: a source stamp (`HoldsSource`) or a held tree (`HoldsTree`), the same fact `isNode` tests at run time. `Admit` requires it of a member with a numeric `$type`, the walk stops at a value that carries it (`MemberRefusals`), and a declared shape's members that carry it are nodes, not configs to check keys against (`Configs`). One definition serves all three. Neither member's symbol is exported as a value, so no literal carries one: a config that names `$render` or `$source` is still a config, and both keys are undeclared, refused like any other. No node has a `$source` member; provenance is read by `sourceOf`.

### `packages/types/src/node-surface.ts::ListOf`

A value when it is a list, `never` otherwise: an array or tuple type, which carries a numeric index signature, with no key that an array does not have. Anything else that is assignable to `readonly unknown[]` is a config, checked key by key, because the coercer reads it as one:

- an object literal with a list spread into it has the list's own keys (its indices, `length`, its methods) and no numeric index, yet inferred from a literal it is assignable to `readonly unknown[]`; walked as a list, its keys would go unchecked and the spread items be lost without a word;
- an array carrying config fields (`Object.assign([], { statements })`) has the numeric index, but its fields are what the coercer reads; walked as a list, only its items would be checked.

Checked as a config, each such value has its array keys refused as unknown.

### `packages/types/src/node-surface.ts::KeyText`

A key as a refusal spells it: a string key as it is, a numeric key as its numeral, and a symbol key as `[symbol]`, which a template literal cannot spell. A key intersected with `string` instead would be `never` for a numeric or symbol key, and a template literal over `never` is `never`, so the refusal would vanish and the key pass unchecked.

### `packages/types/src/query.ts::SlotFlagOf`

The flags a slot's `is` takes: the slot's entry in its node type's `SlotFlagsHintOf`, or `never` when the slot has none. `SlotRefOf` passes it to `SlotRef`, per member of a union view, so the flags a union's slot takes are those every member's slot lists.

### `packages/types/src/query.ts::FlagOf`

The flags a recorder's `is` takes for a view's element type: each member's `FlagsHintOf`, intersected over a union (`SharedFlags`, by contravariant inference), so only the flags every member declares; `never` for no element type, or a member with no flags. A flag that depends on the node's context is never declared, so it is a type error as well as a refusal.

### `packages/types/src/query.ts::QueryFlags`

Each kind's vocabulary flags by stamped kind id, each the plan that tests the flag on a node of the kind, or `null` when the flag depends on the node's context (its placement, or a test on its parent), which a node-local plan cannot express. Generated from the bindings (`flagPlansOf`); a grammar without bindings has none.

### `packages/types/src/query.ts::QuerySlotFlags`

Each kind's slot flags by stamped kind id and slot accessor (`slotFlagsOf`): for each flag a kind the slot can hold declares, a `SlotFlagTest`, the types of the kinds that always carry it, which a slot's `is` tests by membership, and the ids of the kinds that carry it by their own slots, whose plans it runs on the node the slot holds; or a `SlotFlagRefusal` naming the kind that declares it through its context, which no plan of the slot's owner can read. A slot that holds a kind-id leaf, an enum member whose fixed text spells the flag, is how the flag is reached at all: the leaf is no node a view returns.

### `packages/types/src/query.ts::StepAnchor`

The one anchor vocabulary shared by a portable read test's `via` step and a plan's `child` step: `first`, `last`, or `only`, which reaches the node only when the slot holds exactly one.

### `packages/types/src/query.ts::SlotSubject`

A slot by its number in each kind that has it, keyed by stamped kind id. The number is the slot's position among the kind's native node slots, the numbering the native read routes children by, so a plan names a slot exactly as the read does: the evaluator asks the node's kind how it finds its slots (`ReadNode::router`: its children one at a time, a group of its token's text, or the node itself for an envelope) and keeps what lands in that number. Numbers are per kind, so a plan over several kinds, or a step that lands on several, carries one per kind, expanded when it is compiled as `is` membership is. A node of a kind the map lacks holds nothing there.

### `packages/types/src/query.ts::SlotRefOf`

The recorder member of one slot of a node type: a `PresenceRef` when the slot's hint takes a `BooleanKeyword`, else a `SlotRef`. Over a union it is the union of each member's, so a slot that is boolean in one kind and text in another has an `eq` taking `string & boolean`, which no argument satisfies: the union rule the recorder applies to slots, applied to their members.

### `packages/types/src/engine-api.ts::NodeJSON`

The shape a node takes as JSON. `$type` is its kind name; `$text` is a leaf's text; each slot is keyed by its accessor name; and the comments on each side are written as `leadingComments`, `trailingComments` and `innerComments`. Its slots are written by accessor name rather than storage key, so the JSON reads the same whatever a slot's storage is.

### `packages/types/src/engine-api.ts::NodeJSONFacts`

Engine plumbing for the JSON writer and reviver, not part of the caller's surface. Each grammar's codegen emits one set of facts (its kind names, slots, layout and leaf kinds, text envelopes, units, blank value, spread kinds and registered options), and the writer and reviver read them instead of deriving the same facts from the grammar at run time.

### `packages/types/src/engine-api.ts::StructureRow`

One kind's structure facts, as the generated types prove them, keyed by slot storage key. The two checks read different fields. On a built node, `verifyStructure` checks `required` (the slot holds a value), `nonEmpty` (the list holds an item) and `nodeOnly` (the slot holds a built node, never bare text). On a builder's input, `checkInput` checks `config` (the keys the kind declares) and `lists` (each list's `holes` and `arrival`). A kind with nothing to check has no row.

### `packages/types/src/engine-api.ts::NodeJSON::$text`

The node's text, for a leaf.

### `packages/types/src/engine-api.ts::NodeJSON::$type`

The node's kind name.

### `packages/types/src/engine-api.ts::NodeMethods::$render`

The node's rendered text.

### `packages/types/src/engine-api.ts::HoldsTrivia::$trivia`

The trivia attached to the node.

### `packages/types/src/engine-api.ts::ParsedRoot::$errors`

Every ERROR and MISSING region of the source, in source order; empty when the source parsed cleanly.

### `packages/types/src/engine-api.ts::PortableEngineOptions`

The options a portable engine takes.

### `packages/types/src/engine-api.ts::SpelledTrivia`

The trivia of a node as its spelled text.

### `packages/types/src/engine-api.ts::StructureRow::booleans`

`[storageKey, label]`: the slot holds a boolean, or nothing.

### `packages/types/src/engine-api.ts::StructureRow::kindIds`

The kind ids a slot may hold.

### `packages/types/src/engine-api.ts::StructureRow::texts`

The text a slot must hold.

### `packages/types/src/vocabulary/argument.ts::Argument::$kind`

The discriminant of a `Argument` node: `'argument'`.

### `packages/types/src/vocabulary/argument.ts::ArgumentSynonyms::named`

The synonym that stands for the canonical `named` in this vocabulary: 'keyword'.

### `packages/types/src/vocabulary/clause.ts::Clause::$kind`

The discriminant of a `Clause` node: `'clause'`.

### `packages/types/src/vocabulary/clause.ts::ClauseSynonyms::bounds`

The synonym that stands for the canonical `bounds` in this vocabulary: 'constraint'.

### `packages/types/src/vocabulary/clause.ts::ClauseSynonyms::case`

The synonym that stands for the canonical `case` in this vocabulary: 'arm'.

### `packages/types/src/vocabulary/clause.ts::ClauseSynonyms::catch`

The synonym that stands for the canonical `catch` in this vocabulary: 'except' | 'rescue'.

### `packages/types/src/vocabulary/clause.ts::ClauseSynonyms::else_if`

The synonym that stands for the canonical `else_if` in this vocabulary: 'elif' | 'elsif' | 'elseif'.

### `packages/types/src/vocabulary/clause.ts::ClauseSynonyms::finally`

The synonym that stands for the canonical `finally` in this vocabulary: 'ensure'.

### `packages/types/src/vocabulary/clause.ts::ClauseSynonyms::resource`

The synonym that stands for the canonical `resource` in this vocabulary: 'using'.

### `packages/types/src/vocabulary/clause.ts::ClauseSynonyms::wildcard`

The synonym that stands for the canonical `wildcard` in this vocabulary: 'glob'.

### `packages/types/src/vocabulary/context.ts::Unmapped::$unmapped`

The marker of a kind with no vocabulary mapping.

### `packages/types/src/vocabulary/declaration.ts::Declaration::$kind`

The discriminant of a `Declaration` node: `'declaration'`.

### `packages/types/src/vocabulary/declaration.ts::DeclarationSynonyms::constructor`

The synonym that stands for the canonical `constructor` in this vocabulary: 'initializer' | 'init'.

### `packages/types/src/vocabulary/declaration.ts::DeclarationSynonyms::enum_member`

The synonym that stands for the canonical `enum_member` in this vocabulary: 'variant' | 'enumerator'.

### `packages/types/src/vocabulary/declaration.ts::DeclarationSynonyms::extension`

The synonym that stands for the canonical `extension` in this vocabulary: 'impl'.

### `packages/types/src/vocabulary/declaration.ts::DeclarationSynonyms::foreign`

The synonym that stands for the canonical `foreign` in this vocabulary: 'extern'.

### `packages/types/src/vocabulary/declaration.ts::DeclarationSynonyms::index`

The synonym that stands for the canonical `index` in this vocabulary: 'indexer'.

### `packages/types/src/vocabulary/declaration.ts::DeclarationSynonyms::internal`

The synonym that stands for the canonical `internal` in this vocabulary: 'crate'.

### `packages/types/src/vocabulary/declaration.ts::DeclarationSynonyms::module`

The synonym that stands for the canonical `module` in this vocabulary: 'mod'.

### `packages/types/src/vocabulary/declaration.ts::DeclarationSynonyms::receiver`

The synonym that stands for the canonical `receiver` in this vocabulary: 'self' | 'this'.

### `packages/types/src/vocabulary/declaration.ts::DeclarationSynonyms::special`

The synonym that stands for the canonical `special` in this vocabulary: 'dunder' | 'magic'.

### `packages/types/src/vocabulary/declaration.ts::DeclarationSynonyms::struct`

The synonym that stands for the canonical `struct` in this vocabulary: 'record'.

### `packages/types/src/vocabulary/declaration.ts::DeclarationSynonyms::type_alias`

The synonym that stands for the canonical `type_alias` in this vocabulary: 'typedef' | 'typealias'.

### `packages/types/src/vocabulary/element.ts::Element::$kind`

The discriminant of a `Element` node: `'element'`.

### `packages/types/src/vocabulary/element.ts::ElementSynonyms::map`

The synonym that stands for the canonical `map` in this vocabulary: 'dictionary' | 'dict'.

### `packages/types/src/vocabulary/element.ts::ElementSynonyms::spread`

The synonym that stands for the canonical `spread` in this vocabulary: 'splat' | 'unpack'.

### `packages/types/src/vocabulary/expression.ts::Expression::$kind`

The discriminant of a `Expression` node: `'expression'`.

### `packages/types/src/vocabulary/expression.ts::ExpressionSynonyms::coalesce`

The synonym that stands for the canonical `coalesce` in this vocabulary: 'nullish'.

### `packages/types/src/vocabulary/expression.ts::ExpressionSynonyms::compound`

The synonym that stands for the canonical `compound` in this vocabulary: 'augmented'.

### `packages/types/src/vocabulary/expression.ts::ExpressionSynonyms::conditional`

The synonym that stands for the canonical `conditional` in this vocabulary: 'ternary'.

### `packages/types/src/vocabulary/expression.ts::ExpressionSynonyms::construct`

The synonym that stands for the canonical `construct` in this vocabulary: 'new'.

### `packages/types/src/vocabulary/expression.ts::ExpressionSynonyms::generator`

The synonym that stands for the canonical `generator` in this vocabulary: 'gen'.

### `packages/types/src/vocabulary/expression.ts::ExpressionSynonyms::lambda`

The synonym that stands for the canonical `lambda` in this vocabulary: 'closure' | 'arrow'.

### `packages/types/src/vocabulary/expression.ts::ExpressionSynonyms::list`

The synonym that stands for the canonical `list` in this vocabulary: 'array'.

### `packages/types/src/vocabulary/expression.ts::ExpressionSynonyms::map`

The synonym that stands for the canonical `map` in this vocabulary: 'dictionary' | 'dict'.

### `packages/types/src/vocabulary/expression.ts::ExpressionSynonyms::matrix_multiply`

The synonym that stands for the canonical `matrix_multiply` in this vocabulary: 'matmul'.

### `packages/types/src/vocabulary/expression.ts::ExpressionSynonyms::member`

The synonym that stands for the canonical `member` in this vocabulary: 'attribute' | 'field' | 'property'.

### `packages/types/src/vocabulary/expression.ts::ExpressionSynonyms::propagate`

The synonym that stands for the canonical `propagate` in this vocabulary: 'try'.

### `packages/types/src/vocabulary/expression.ts::ExpressionSynonyms::qualified`

The synonym that stands for the canonical `qualified` in this vocabulary: 'path' | 'scoped'.

### `packages/types/src/vocabulary/expression.ts::ExpressionSynonyms::reference`

The synonym that stands for the canonical `reference` in this vocabulary: 'borrow'.

### `packages/types/src/vocabulary/expression.ts::ExpressionSynonyms::subscript`

The synonym that stands for the canonical `subscript` in this vocabulary: 'index'.

### `packages/types/src/vocabulary/features/async-await/declaration.ts::Declaration`

The async-await declaration of the vocabulary.

### `packages/types/src/vocabulary/features/async-await/declaration.ts::Declaration::Constructor`

The constructor of the async-await declaration.

### `packages/types/src/vocabulary/features/decorators/declaration.ts::Declaration`

The decorators declaration of the vocabulary.

### `packages/types/src/vocabulary/features/decorators/declaration.ts::Declaration::Constructor`

The constructor of the decorators declaration.

### `packages/types/src/vocabulary/features/parametric-polymorphism/declaration.ts::Declaration::Constructor`

The constructor of the parametric-polymorphism declaration.

### `packages/types/src/vocabulary/features/type-annotations/declaration.ts::Declaration`

The type-annotations declaration of the vocabulary.

### `packages/types/src/vocabulary/features/type-annotations/declaration.ts::Declaration::Constructor`

The constructor of the type-annotations declaration.

### `packages/types/src/vocabulary/identifier.ts::Identifier::$kind`

The discriminant of a `Identifier` node: `'identifier'`.

### `packages/types/src/vocabulary/identifier.ts::IdentifierSynonyms::receiver`

The synonym that stands for the canonical `receiver` in this vocabulary: 'self' | 'this'.

### `packages/types/src/vocabulary/identifier.ts::IdentifierSynonyms::super`

The synonym that stands for the canonical `super` in this vocabulary: 'base'.

### `packages/types/src/vocabulary/literal.ts::Literal::$kind`

The discriminant of a `Literal` node: `'literal'`.

### `packages/types/src/vocabulary/literal.ts::LiteralSynonyms::character`

The synonym that stands for the canonical `character` in this vocabulary: 'char' | 'rune'.

### `packages/types/src/vocabulary/literal.ts::LiteralSynonyms::interpolated`

The synonym that stands for the canonical `interpolated` in this vocabulary: 'f' | 'template'.

### `packages/types/src/vocabulary/literal.ts::LiteralSynonyms::multiline`

The synonym that stands for the canonical `multiline` in this vocabulary: 'triple'.

### `packages/types/src/vocabulary/literal.ts::LiteralSynonyms::null`

The synonym that stands for the canonical `null` in this vocabulary: 'none' | 'nil'.

### `packages/types/src/vocabulary/modifier.ts::Modifier::$kind`

The discriminant of a `Modifier` node: `'modifier'`.

### `packages/types/src/vocabulary/modifier.ts::ModifierSynonyms::internal`

The synonym that stands for the canonical `internal` in this vocabulary: 'crate'.

### `packages/types/src/vocabulary/pattern.ts::Pattern::$kind`

The discriminant of a `Pattern` node: `'pattern'`.

### `packages/types/src/vocabulary/pattern.ts::PatternSynonyms::list`

The synonym that stands for the canonical `list` in this vocabulary: 'array' | 'slice'.

### `packages/types/src/vocabulary/pattern.ts::PatternSynonyms::map`

The synonym that stands for the canonical `map` in this vocabulary: 'dictionary' | 'dict'.

### `packages/types/src/vocabulary/pattern.ts::PatternSynonyms::rest`

The synonym that stands for the canonical `rest` in this vocabulary: 'splat' | 'unpack'.

### `packages/types/src/vocabulary/pattern.ts::PatternSynonyms::struct`

The synonym that stands for the canonical `struct` in this vocabulary: 'record'.

### `packages/types/src/vocabulary/statement.ts::Statement::$kind`

The discriminant of a `Statement` node: `'statement'`.

### `packages/types/src/vocabulary/statement.ts::StatementSynonyms::empty`

The synonym that stands for the canonical `empty` in this vocabulary: 'pass'.

### `packages/types/src/vocabulary/statement.ts::StatementSynonyms::import`

The synonym that stands for the canonical `import` in this vocabulary: 'use'.

### `packages/types/src/vocabulary/statement.ts::StatementSynonyms::package`

The synonym that stands for the canonical `package` in this vocabulary: 'crate'.

### `packages/types/src/vocabulary/statement.ts::StatementSynonyms::resource`

The synonym that stands for the canonical `resource` in this vocabulary: 'using'.

### `packages/types/src/vocabulary/statement.ts::StatementSynonyms::throw`

The synonym that stands for the canonical `throw` in this vocabulary: 'raise'.

### `packages/types/src/vocabulary/type.ts::Type::$kind`

The discriminant of a `Type` node: `'type'`.

### `packages/types/src/vocabulary/type.ts::TypeSynonyms::boolean`

The synonym that stands for the canonical `boolean` in this vocabulary: 'bool'.

### `packages/types/src/vocabulary/type.ts::TypeSynonyms::character`

The synonym that stands for the canonical `character` in this vocabulary: 'char'.

### `packages/types/src/vocabulary/type.ts::TypeSynonyms::float64`

The synonym that stands for the canonical `float64` in this vocabulary: 'double'.

### `packages/types/src/vocabulary/type.ts::TypeSynonyms::int16`

The synonym that stands for the canonical `int16` in this vocabulary: 'short'.

### `packages/types/src/vocabulary/type.ts::TypeSynonyms::int8`

The synonym that stands for the canonical `int8` in this vocabulary: 'byte'.

### `packages/types/src/vocabulary/type.ts::TypeSynonyms::nullable`

The synonym that stands for the canonical `nullable` in this vocabulary: 'maybe'.

### `packages/types/src/vocabulary/type.ts::TypeSynonyms::reference`

The synonym that stands for the canonical `reference` in this vocabulary: 'borrow'.

### `packages/types/src/vocabulary/type.ts::TypeSynonyms::rest`

The synonym that stands for the canonical `rest` in this vocabulary: 'splat' | 'unpack'.

### `packages/types/src/vocabulary/type.ts::TypeSynonyms::string`

The synonym that stands for the canonical `string` in this vocabulary: 'str'.

### `packages/types/src/vocabulary/utils.ts::FlagSynonyms`

The synonyms of the vocabulary's flags: each flag's alternative spellings.

### `packages/types/src/vocabulary/argument.ts::ArgumentSynonyms`

The synonyms the `Argument` vocabulary resolves: each canonical kind mapped to the spellings that stand for it.

### `packages/types/src/vocabulary/clause.ts::ClauseSynonyms`

The synonyms the `Clause` vocabulary resolves: each canonical kind mapped to the spellings that stand for it.

### `packages/types/src/vocabulary/declaration.ts::DeclarationSynonyms`

The synonyms the `Declaration` vocabulary resolves: each canonical kind mapped to the spellings that stand for it.

### `packages/types/src/vocabulary/element.ts::ElementSynonyms`

The synonyms the `Element` vocabulary resolves: each canonical kind mapped to the spellings that stand for it.

### `packages/types/src/vocabulary/element.ts::Legacy`

The legacy form of the element not-equal comparison: a sub-kind of `NotEqual`, with the `$kind` `element.comparator.comparison.not_equal.legacy`, claimed by the `p` pattern.

### `packages/types/src/vocabulary/expression.ts::ExpressionSynonyms`

The synonyms the `Expression` vocabulary resolves: each canonical kind mapped to the spellings that stand for it.

### `packages/types/src/vocabulary/expression.ts::Legacy`

The legacy form of the binary not-equal comparison: a sub-kind of `Binary.Comparison.NotEqual`, with the `$kind` `expression.binary.comparison.not_equal.legacy` and the operator `<>`.

### `packages/types/src/vocabulary/identifier.ts::IdentifierSynonyms`

The synonyms the `Identifier` vocabulary resolves: each canonical kind mapped to the spellings that stand for it.

### `packages/types/src/vocabulary/literal.ts::LiteralSynonyms`

The synonyms the `Literal` vocabulary resolves: each canonical kind mapped to the spellings that stand for it.

### `packages/types/src/vocabulary/modifier.ts::ModifierSynonyms`

The synonyms the `Modifier` vocabulary resolves: each canonical kind mapped to the spellings that stand for it.

### `packages/types/src/vocabulary/pattern.ts::PatternSynonyms`

The synonyms the `Pattern` vocabulary resolves: each canonical kind mapped to the spellings that stand for it.

### `packages/types/src/vocabulary/statement.ts::StatementSynonyms`

The synonyms the `Statement` vocabulary resolves: each canonical kind mapped to the spellings that stand for it.

### `packages/types/src/vocabulary/type.ts::TypeSynonyms`

The synonyms the `Type` vocabulary resolves: each canonical kind mapped to the spellings that stand for it.

### `packages/types/src/engine-api.ts::HoldsTrivia`

The shape of a value that holds trivia side entries.

### `packages/types/src/index.ts::WidenSlots`

Widens the slot input types of a factory signature, keyed by slot name.

### `packages/types/src/vocabulary/features/attributes/clause.ts::Clause::Case`

The `Case` clause kind of the attributes feature.

### `packages/types/src/vocabulary/features/complex-numbers/pattern.ts::Pattern::Complex`

The complex-number pattern kind.

### `packages/types/src/vocabulary/features/match-expressions/pattern.ts::Pattern::Map`

The map pattern kind.

### `packages/common/src/portable/flags.ts::Flags::Prefix`

The prefix flag bit (`1 << 19`).

### `packages/types/src/vocabulary/identifier.ts::Identifier::Qualified`

The qualified identifier kind.

### `packages/types/src/engine-api.ts::LanguageHooks::tables`

The table loaders, one per builder mode: each loads the table that mode's `api` names.

### `packages/types/src/engine-api.ts::BuilderMode`

The builder mode an engine loads: `default` or `strict`.

### `packages/types/src/engine-api.ts::ApiSelection`

The `api` option. It is required for every mode except the default.

### `packages/types/src/engine-api.ts::ApiSelection::api`

The API mode the engine loads.

### `packages/types/src/engine-api.ts::EngineSettings`

The engine options that are not the builder mode: render, interceptors and verify-structure.

### `packages/types/src/engine-api.ts::EngineSettings::render`

The render options, checked against the API.

### `packages/types/src/engine-api.ts::EngineSettings::intercept`

The interceptors, in registration order.

### `packages/types/src/engine-api.ts::EngineSettings::verifyStructure`

Whether structure is verified at compile time only, or also at run time.

### `packages/types/src/node-surface.ts::Seat`

A row call's signature: generic over its arguments, refusing undeclared keys, and returning its result.

### `packages/types/src/node-surface.ts::ConfigSeat`

A config-only signature: one loose config argument, refusing undeclared keys, returning its result.

### `packages/types/src/node-surface.ts::OptionalConfigSeat`

A config-only signature whose argument may be left out.

### `packages/types/src/node-surface.ts::EmptyForm`

A builder's empty form: a zero-argument call returning the empty type, intersected with the builder.

### `packages/types/src/node-surface.ts::RefuseUndeclared::refused`

Type-level only. The refusal list `{ readonly refused: … }` that `RefuseUndeclared` yields when an argument holds an untyped node or an undeclared key. No argument carries it at run time; the type names each refusal message.

### `packages/types/src/node-surface.ts::NarrowTo::$type`

The numeric kind id a node carries at runtime, the `$type` property. `NarrowTo` narrows a wide node type to one kind by intersecting it with `$type: D`; the alias emits no code.

### `packages/types/src/node-surface.ts::Admit::$type`

The numeric kind id a node carries at runtime, the `$type` property. `Admit` requires that existing numeric tag on a value and attaches the node marker; the alias emits no code.

### `packages/types/src/engine-api.ts::StructureRow::single`

The single-slot entries of a structure row, as storage key and label pairs.

### `packages/types/src/engine-api.ts::LanguageHooks::portableBuild`

The loader for the portable build table, when the language has one.

### `packages/types/src/portable.ts::PortableRows::flags`

The flag query for a portable row.

### `packages/types/src/portable.ts::PortableCallShape`

The shape of a builder's call: config, spread, text, constant, nullary, direct, elements, forwarded or placed. A `constant` entry is a value (a leaf's kind id); a `nullary` entry is a call that takes no arguments (a compound with no slots).

### `packages/types/src/portable.ts::PortableMountCall`

How a mount is called: none, holder, child, merge, keyed or keyedArgs.

### `packages/types/src/portable.ts::PortableKeyedMount`

A keyed mount: its call, its key, the shape of its seats, and an outer keyed mount it sits in.

### `packages/types/src/portable.ts::PortableKeyedMount::call`

The keyed call form.

### `packages/types/src/portable.ts::PortableKeyedMount::key`

The key the mount is stored under.

### `packages/types/src/portable.ts::PortableKeyedMount::seats`

The call shape of the mount's seats.

### `packages/types/src/portable.ts::PortableKeyedMount::outer`

The outer keyed mount, when this one sits in another.

### `packages/types/src/portable.ts::PortableMount`

A mount: a keyed call with its key and the outer keyed mount it sits in.

### `packages/types/src/portable.ts::PortableMount::call`

The keyed call form.

### `packages/types/src/portable.ts::PortableMount::key`

The key the mount is stored under.

### `packages/types/src/portable.ts::PortableMount::outer`

The outer keyed mount, when this one sits in another.

### `packages/types/src/portable.ts::PortableSlotStep`

One step into a slot: its key, its builder, whether it is optional, and any mount.

### `packages/types/src/portable.ts::PortableSlotStep::key`

The key of the step.

### `packages/types/src/portable.ts::PortableSlotStep::builder`

The builder the step uses.

### `packages/types/src/portable.ts::PortableSlotStep::optional`

Whether the step is optional.

### `packages/types/src/portable.ts::PortableSlotStep::mounted`

The mount the step carries.

### `packages/types/src/portable.ts::PortableContainer`

A container step: its builder, key, optionality and mount.

### `packages/types/src/portable.ts::PortableContainer::builder`

The container's builder.

### `packages/types/src/portable.ts::PortableContainer::key`

The key the container is stored under.

### `packages/types/src/portable.ts::PortableContainer::optional`

Whether the container is optional.

### `packages/types/src/portable.ts::PortableContainer::mounted`

The mount the container carries.

### `packages/types/src/portable.ts::PortableSeat`

A seat: the holder and key it sits at, the kinds it takes, its leaf text, and whether it is repeated.

### `packages/types/src/portable.ts::PortableSeat::at`

The holder number and key the seat sits at.

### `packages/types/src/portable.ts::PortableSeat::kinds`

The kind ids the seat takes.

### `packages/types/src/portable.ts::PortableSeat::leaf`

The leaf text the seat takes, when it is a leaf.

### `packages/types/src/portable.ts::PortableSeat::within`

The enclosing holders the seat sits within, by number, or null.

### `packages/types/src/portable.ts::PortableSeat::many`

Whether the seat takes many values.

### `packages/types/src/portable.ts::PortableMemberStep`

One member step: its name, its slot steps, whether it is repeated, its seats and what it requires.

### `packages/types/src/portable.ts::PortableMemberStep::name`

The member name.

### `packages/types/src/portable.ts::PortableMemberStep::steps`

The slot steps the member takes.

### `packages/types/src/portable.ts::PortableMemberStep::multiple`

Whether the member takes many values.

### `packages/types/src/portable.ts::PortableMemberStep::seats`

The call shape of the member's seats.

### `packages/types/src/portable.ts::PortableMemberStep::requires`

The member sets the member needs present, as lists of names.

### `packages/types/src/portable.ts::PortablePreset`

A preset: the steps it takes, and its kind, text or builder.

### `packages/types/src/portable.ts::PortablePreset::steps`

The slot steps the preset takes.

### `packages/types/src/portable.ts::PortablePreset::kind`

The kind id the preset builds, when it has one.

### `packages/types/src/portable.ts::PortablePreset::text`

The text the preset builds, when it has one.

### `packages/types/src/portable.ts::PortablePreset::builder`

The builder the preset uses.

### `packages/types/src/portable.ts::PortableFlagStep`

A flag step: the presets it sets, and the presets it unsets.

### `packages/types/src/portable.ts::PortableFlagStep::presets`

The presets the step sets.

### `packages/types/src/portable.ts::PortableFlagStep::unset`

The presets the step unsets, when it unsets any.

### `packages/types/src/portable.ts::PortablePickTest`

A test that picks a build arm: absent, required, flag, set, member, kinds, text, boolean, variant, value or default.

### `packages/types/src/portable.ts::PortablePickTest::absent`

The arm applies when the slot is absent.

### `packages/types/src/portable.ts::PortablePickTest::required`

The arm applies when the slot is required.

### `packages/types/src/portable.ts::PortablePickTest::flag`

The arm applies when the flag is set.

### `packages/types/src/portable.ts::PortablePickTest::set`

The arm applies when the slot is set.

### `packages/types/src/portable.ts::PortablePickTest::member`

The arm applies when the member is set.

### `packages/types/src/portable.ts::PortablePickTest::kinds`

The arm applies to the given kinds.

### `packages/types/src/portable.ts::PortablePickTest::text`

The arm applies to the given text.

### `packages/types/src/portable.ts::PortablePickTest::boolean`

The arm applies to a boolean value.

### `packages/types/src/portable.ts::PortablePickTest::variant`

The arm applies to a variant.

### `packages/types/src/portable.ts::PortablePickTest::value`

The arm applies to the given value.

### `packages/types/src/portable.ts::PortablePickTest::default`

The arm is the default when no other test applies.

### `packages/types/src/portable.ts::PortableDecimalParts`

The parts of a decimal number: integer, fraction, exponent, marker and the exponent's sign.

### `packages/types/src/portable.ts::PortableDecimalParts::integer`

The integer part.

### `packages/types/src/portable.ts::PortableDecimalParts::fraction`

The fraction part.

### `packages/types/src/portable.ts::PortableDecimalParts::exponent`

The exponent part.

### `packages/types/src/portable.ts::PortableDecimalParts::marker`

The marker part.

### `packages/types/src/portable.ts::PortableDecimalParts::exponentSign`

The exponent's sign.

### `packages/types/src/portable.ts::PortableBuildArm`

One build arm: the builder or kind it builds, the test that picks it, and the members and flags it sets.

### `packages/types/src/portable.ts::PortableBuildArm::kind`

The kind id the arm builds.

### `packages/types/src/portable.ts::PortableBuildArm::builder`

The builder the arm uses.

### `packages/types/src/portable.ts::PortableBuildArm::mounted`

The mount the arm carries.

### `packages/types/src/portable.ts::PortableBuildArm::seated`

The call shape of the arm's seat.

### `packages/types/src/portable.ts::PortableBuildArm::scalar`

The scalar type of a number arm.

### `packages/types/src/portable.ts::PortableBuildArm::numeric`

The numeric text or decimal parts of a number arm.

### `packages/types/src/portable.ts::PortableBuildArm::when`

The tests that pick the arm.

### `packages/types/src/portable.ts::PortableBuildArm::holders`

The holders the arm builds into, by number and key.

### `packages/types/src/portable.ts::PortableBuildArm::members`

The member steps the arm takes.

### `packages/types/src/portable.ts::PortableBuildArm::presets`

The presets the arm takes.

### `packages/types/src/portable.ts::PortableBuildArm::flags`

The flag query the arm reads.

### `packages/types/src/portable.ts::PortableBuildArm::template`

A template the arm fills: its member, its pattern and its holes.

### `packages/types/src/portable.ts::PortableBuildPath`

A path of build arms, with whether it is the root.

### `packages/types/src/portable.ts::PortableBuildPath::root`

Whether the path is the root.

### `packages/types/src/portable.ts::PortableBuildPath::arms`

The arms the path takes.

### `packages/types/src/portable.ts::PortableStructure`

A portable structure: the path, flag and value entries a builder reads.

### `packages/types/src/portable.ts::PortableStructure::$path`

The path entry of the structure.

### `packages/types/src/portable.ts::PortableStructure::$flags`

The flags entry of the structure.

### `packages/types/src/portable.ts::PortableStructure::$value`

The value entry of the structure.

### `packages/types/src/portable.ts::PortableValueBuild`

How a value is built: its integer, float, true and false texts.

### `packages/types/src/portable.ts::PortableValueBuild::integer`

The integer text.

### `packages/types/src/portable.ts::PortableValueBuild::float`

The float text.

### `packages/types/src/portable.ts::PortableValueBuild::true`

The text of `true`.

### `packages/types/src/portable.ts::PortableValueBuild::false`

The text of `false`.

### `packages/types/src/portable.ts::PortableBuildTable`

The portable build table: builders, paths and values.

### `packages/types/src/portable.ts::PortableBuildTable::builders`

The call shape of each builder.

### `packages/types/src/portable.ts::PortableBuildTable::paths`

The build path for each path.

### `packages/types/src/portable.ts::PortableBuildTable::values`

How each value is built, by name.

### `packages/types/src/vocabulary/features/static-storage/declaration.ts::Declaration`

The static-storage declaration feature.

### `packages/types/src/vocabulary/features/static-storage/declaration.ts::Declaration::Variable`

A variable declaration with static storage.

### `packages/types/src/vocabulary/features/static-storage/index.ts::StaticStorage`

The static-storage feature.

### `packages/types/src/vocabulary/features/static-storage/index.ts::StaticStorage::static-storage`

The static-storage keyword.

### `packages/types/src/vocabulary/identifier.ts::IdentifierSynonyms::qualified`

The alternative spellings of a qualified identifier.

### `packages/types/src/index.ts::OmitRegistered`

Omits the keys of a type that are registered, leaving the rest.

### `packages/types/src/portable.ts::PortableSlotStep::flatten`

Whether the step flattens its slot.

### `packages/types/src/portable.ts::PortableSlotStep::seated`

The call shape of the step's seat.

### `packages/types/src/portable.ts::PortableSlotStep::many`

Whether the step takes many values.

### `packages/types/src/portable.ts::PortableContainer::flatten`

Whether the container flattens its slot.

### `packages/types/src/portable.ts::PortableContainer::through`

The keys the container passes through.

### `packages/types/src/portable.ts::PortableSeat::texts`

The text kinds the seat takes.

### `packages/types/src/portable.ts::PortableSeat::pattern`

The pattern the seat matches, as its source and flags.

### `packages/types/src/portable.ts::PortableMemberStep::reads`

The kinds the member reads.

### `packages/types/src/portable.ts::PortableBuildTable::options`

The options each builder takes, by name.

### `packages/types/src/portable.ts::PortableContainer::members`

The container's member steps, each naming a member and the slot steps it takes.

### `packages/types/src/vocabulary/features/range-expressions/expression.ts::Legacy`

The legacy form of the inclusive range expression: a sub-kind of `Expression.Range.Inclusive`, with the `$kind` `expression.range.inclusive.legacy`, claimed by the `r` pattern.

### `packages/types/src/vocabulary/features/range-expressions/pattern.ts::Legacy`

The legacy form of the inclusive range pattern: a sub-kind of `Pattern.Range.Inclusive`, with the `$kind` `pattern.range.inclusive.legacy`, claimed by the `r` pattern.

### `packages/types/src/vocabulary/features/c-strings/index.ts::CStrings`

The C-strings vocabulary feature, a namespace of the C-string kinds.

### `packages/types/src/vocabulary/features/c-strings/literal.ts::Literal`

The C-string literal namespace: the literal kinds the C-strings feature defines.

### `packages/types/src/vocabulary/features/parametric-polymorphism/generic-lambdas/expression.ts::Expression`

The generic-lambda expression namespace: the expression kinds the generic-lambdas feature defines.

### `packages/types/src/vocabulary/features/parametric-polymorphism/generic-lambdas/index.ts::GenericLambdas`

The generic-lambdas vocabulary feature, a namespace of the generic-lambda kinds.

### `packages/types/src/vocabulary/features/c-strings/index.ts::CStrings::c-strings`

The `c-strings` feature key of the C-strings vocabulary.

### `packages/types/src/vocabulary/features/c-strings/literal.ts::Literal::String`

The string member of the C-string literal namespace.

### `packages/types/src/vocabulary/features/parametric-polymorphism/generic-lambdas/expression.ts::Expression::Lambda`

The lambda member of the generic-lambda expression namespace.

### `packages/types/src/vocabulary/features/parametric-polymorphism/generic-lambdas/index.ts::GenericLambdas::generic-lambdas`

The `generic-lambdas` feature key of the generic-lambdas vocabulary.
