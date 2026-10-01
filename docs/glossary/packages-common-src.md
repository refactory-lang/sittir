# `packages/common/src` — Function Glossary

### `packages/common/src/create-engine.ts::loadLanguage`

Loads a language's hooks once per descriptor object: later engines for the same descriptor reuse the same promise. A failed load is not cached, so a later call retries; it rejects with `failed to load language "<name>"`, carrying the original error as its `cause`.

### `packages/common/src/create-engine.ts::refuseUnimplemented`

Refuses, before anything loads, an engine option whose behaviour does not exist: any `api` other than `'default'` (the portable surface is reserved; the strict surface is not implemented) and a non-empty `intercept` list. Each message names the option that is not implemented.

### `packages/common/src/create-engine.ts::nativeEngineOptions`

The one mapping from an engine's options to its native engine's: `format` passes through, and `render` becomes the native `options`. Absent keys stay absent.

### `packages/common/src/create-engine.ts::unimplementedVerb`

The error a file verb (`read`, `create`, `edit`, `write`) raises while file changes are not implemented.

### `packages/common/src/create-engine.ts::languageGuards`

Composes every function on a language's `is` table with the engine's language check: the guard runs only for a value whose stamped engine is of the engine's language (the check the node guards use), and the extra arguments of a guard such as `kind` pass through. A node of another grammar whose kind id the guard would accept is rejected, a value with no stamp is rejected, and a node of a disposed engine is accepted, since only the stamped language is read. It is one composition over the table, so a per-kind guard, a supertype guard and `kind` are all covered without each carrying the check; the result is frozen and keeps the table's type.

### `packages/common/src/create-engine.ts::assembleEngine`

Builds one engine from a language's descriptor and loaded hooks: it creates the native engine from the mapped options, an `EngineIdentity` and the handle that shares it with every node the engine stamps, and exposes the hooks' `is` guards and kind ids and a scoped `build`. The node guards (`isNode`, `isParsedNode`, `isFactoryNode`, `isErrorNode`, `isEmptyNode`) are each their free counterpart in `@sittir/common/utils` and a same-language check on the node's stamp: a node of another engine of the language passes, a node of another language does not even when the kind id is valid in both, and a value with no stamp never does. They read only the stamp's language, so they still accept the nodes of a disposed engine. `isEmptyNode` also requires a kind with inner gaps and no content, and narrows through the language's `empty` map. `parse` reads through the native engine, binds the tree to the handle so lazily expanded children are stamped too, and wraps the root; `diagnostics.parseAndRead` is the same read and bind without the wrapper, next to the native build's profile. `render` takes a node, or a callback that receives the scoped builders, and finds which engine holds the node's parsed parts, so the node's own engine renders a node built throughout, the one engine that parsed its parsed descendants renders it with the calling engine's options over the call's, and a node whose parsed descendants come from several engines, or from a disposed one, is refused. A node stamped with another language is refused, naming both. `dispose` swaps the handle's engine for the identity before releasing the native engine. `types` is type-only and has no run-time value. An engine that renders another engine's parsed part applies its own options key by key over that engine's: a key the caller leaves unset keeps the reading engine's value.

The engine object and its `EngineIdentity` are frozen, so no member can be reassigned; the identity holds the caller's `options` as given, and that object stays the caller's. The serial in a diagnostic label is recorded for the live engine and for its identity, so a disposed reader is still named `<language>#<n>`.

`is` on the engine is the language's table through `languageGuards`, so `engine.is.<kind>` and `engine.is.<supertype>` check the language as `isNode` does; the package-level `is` has no engine and stays a check on the kind id alone.

### `packages/common/src/create-engine.ts::scopedBuild`

The builder table with every call run inside the engine's handle. Each function and namespace it reaches through an own property is wrapped once, so nested variant builders and their `strict` and `coerce` flavours are scoped like the top-level ones, and a builder that calls another builder keeps the same handle.

The builders are read-only: the tables they wrap are frozen where they are built, and a write, definition or deletion through the scoped table throws `the build table of an engine is read-only`. The wrapper's target is an empty stand-in that forwards every trap to the real table, because a proxy may not return a different value for a non-writable, non-configurable property of its own target, and the scoped value is different from the frozen one.

### `packages/common/src/create-engine.ts::collectReaders`

The engines that parsed the parts of a node a render must slice from source. A parsed node names its reading engine and its whole subtree belongs to that engine's tree, so the walk stops there; it goes through the storage slots, `$other` and the trivia of anything else. A node built throughout, including by several engines, reports none.

### `packages/common/src/create-engine.ts::labelOf`

An engine's language name and its creation serial, so an error naming several engines of one language tells them apart.

### `packages/common/src/create-engine.ts::createEngine`

The entry point: refuses unimplemented options, loads the language (once per descriptor), and assembles an engine. Engines share no state: each owns its native engine and its options. Its `render` option is inferred `const` and checked by `RenderOptionsCheck`, so an indent unit outside the language's indent characters, or a key the language's options do not declare, fails to compile.

### `packages/common/src/engine-scope.ts::LiveEngine`

An engine's identity plus its `render`: what a node's `$render` and `$toEdit` reach through their handle. The public `Engine` satisfies it structurally.

### `packages/common/src/engine-scope.ts::EngineHandle`

The one object an engine shares with every node it stamps. `current` is the live engine, or its identity once the engine is disposed, so swapping it detaches every node of that engine at once with no registry of nodes and no walk over them. A node holds the handle strongly, so `$render` never depends on when the collector runs.

### `packages/common/src/engine-scope.ts::inEngine`

Runs a synchronous call with a handle in scope and restores the previous one afterwards, also when the call throws. Every builder call, wrap and lazy child hydration, and `$with` and `$trivia` setter runs inside it, so a node created there is stamped with that engine's handle. It never wraps an `await`: the scope is a module-level variable that only a synchronous call may hold.

### `packages/common/src/engine-scope.ts::sameLanguage`

Whether two engine identities are of one language: the same descriptor object, the key a language loads under, not the same name. An engine renders another engine's node only when this holds, and the engine's node guards test the same predicate, so "same language" has one definition.

### `packages/common/src/engine-scope.ts::engineOf`

The engine a value's `$engine()` returns, or `undefined` for a value with no engine: not an object, or one that has not been stamped.

### `packages/common/src/engine-scope.ts::bindTree`

Records the engine handle that read a tree, so the wrap layer can find it from the tree alone.

### `packages/common/src/engine-scope.ts::inTreeEngine`

Runs a call inside the handle of the engine that read a tree, or plainly when the tree is bound to none. Every wrap of a read node goes through it, so a child hydrated long after the parse returned, outside any engine call, is stamped with the reading engine.

### `packages/common/src/engine-scope.ts::currentHandle`

The handle in scope, or `undefined` outside any engine call. A node built with none has no engine.

### `packages/common/src/engine-scope.ts::isLive`

Whether a handle's `current` is a live engine rather than an identity, told by the presence of a `render` member.

### `packages/common/src/engine.ts::createRenderHandle`

A lazily rendered text: the render runs on first use and its text is cached. `save` writes through the native file path when the engine offers one, else writes the text. Disposing drops the cached text; any use after that throws `rendered text disposed`.

### `packages/common/src/engine.ts::NativeEngineDiagnostics`

The public `EngineDiagnostics` fixed to the native engine's types (a root that carries the whole-file span, a `TreeHandle`), plus `readUntypedNode`, the hydration read only the native engine has. Reached through `SittirEngine.diagnostics` rather than the engine's own surface, because it returns raw node data with reader stubs for children; the public entry point is `parse`, which wraps what these produce.

### `packages/common/src/engine.ts::depthOf`

The level count a native read takes for a set of parse options: absent (one level) by default, `Infinity` (the whole tree) under `deep`. `parseAndRead` and the diagnostics `readUntypedNode` both pass through it, so `deep` has one meaning at the boundary.

### `packages/common/src/engine.ts::nativeLanguageEngine`

Adapts one grammar's native engine to the language hooks' native engine shape, the same for every grammar. `render` splits the call's flat options into the native `ignoreFormat` and the render options it resolves over its own, passing none when the call has none. `parseAndRead` returns the native read untouched; the engine that owns the result binds its tree. `buildProfile` is the native build's compile profile.


### `packages/common/src/delimiter.ts::Delimiter`

The bitflag encoding of a separated list's optional flanks: the wire's `_delimiter` key and a list factory's `delimiter` option. `Leading` and `Trailing` are one bit each, `Both` is their union and `None` is zero. Mandatory flanks are template text and never encoded, so a list slot admits exactly the members for the flanks its grammar makes optional. The values are the same for every grammar, so this is the only declaration: generated code, the codegen render-options emitter and tools all import it from `@sittir/common/utils`. It is written as a `const` object with a type and a type-only namespace of the same name, so `Delimiter.None` works as a value and as a type without a TypeScript `enum`.

### `packages/common/src/source.ts::Source`

Where a node came from, the value of its `$source` stamp: `Ts` for a node read from a tree-sitter parse, `Sg` for the ast-grep read path, `Factory` for a node a builder made. The reader and the factories stamp it once, and an edit keeps it (`$with` and `detachCoordinate` drop only coordinates), so it records the node's origin, not whether it still holds a live tree handle. Rust's `enum Source` in sittir-core is the mirror the native renderer branches on: any non-`Factory` node renders with its tree's format. The object `satisfies` `AnyUntypedNode['$source']`, so the type-level `0 | 1 | 2` union stays the one declaration of the values.

### `packages/common/src/utils.ts::withMethods`

Attaches `$render`, `$toEdit`, `$replace` and `$trivia` to a node, and binds a non-enumerable `$engine()` when an engine's handle is in scope. `$engine()` returns the handle's current value, so disposing the engine changes what every node it stamped sees in one assignment. With a handle, `$render` renders through its engine, `$toEdit` and `$replace` turn that text into an edit, and a disposed engine throws `engine disposed` naming `engine.render(node)`. Without one, the node is unbound: `$render`, `$toEdit`, `$replace` and every `$trivia` access throw `node has no engine`, and the node renders only through `engine.render(node)`, which stamps it. `withMethods` takes no facts; a node's trivia facts come from its engine. The `$with` setters and the `$trivia` setter run inside the node's own handle, whatever scope calls them, so a node they build carries the same engine, and `$trivia` reads the trivia facts from the identity, which survives disposal.

### `packages/common/src/utils.ts::isNode`

Whether a value is a sittir node, built or read: an object with a numeric `$type` that carries storage (`_` keys), text (`$text`), a whitespace-kind `$other`, or a `$source` stamp. A bare `{ $type }` is a factory config, not a node.

### `packages/common/src/utils.ts::isParsedNode`

A node that originated from a parse: `$source` is `Source.Ts` or `Source.Sg`. It holds before the read root is wrapped and after the node is edited, since both keep the stamp.

### `packages/common/src/utils.ts::isFactoryNode`

A node that did not originate from a parse. It is defined as the complement of `isParsedNode` among nodes, so the two never disagree; every generated builder stamps `Source.Factory`.

### `packages/common/src/runtime.ts::module`

The runtime helpers generated code calls, exported through `@sittir/common/utils`. `bindRuntime` is the one piece that depends on a grammar; every other helper here is grammar-free and generated code imports it directly.

### `packages/common/src/runtime.ts::NamespacePart`

One member (`Node` or `Loose`) of kind `K`'s namespace in a grammar type map; `never` for a key the map does not have.

### `packages/common/src/runtime.ts::GrammarRuntime`

The runtime a grammar binds, one generic signature per guard over its type map:
- `isNode`'s kind-parameterised overload narrows to `Extract<Node, AnyUntypedNode>`, not `Node`: the namespaces carry keyword kinds whose `Node` is the bare id, and an id is never node data, so with the plain `Node` the predicate would contain numbers and stop narrowing ids away in every `coerceTo*` `isNode(input)` check.
- `withMethods` attaches the node methods, typed by the map's trivia union. A node built inside an engine's scope renders, edits and takes trivia through that engine; one built outside any scope carries no engine and refuses each of those.

### `packages/common/src/runtime.ts::bindRuntime`

Binds the runtime to a grammar's type map. `isNode` and `withMethods` are the shared implementations, retyped by the map; the runtime has no facts of its own, because a node's trivia facts come from its engine. Emptiness is a guard on the engine, which knows the kinds with inner gaps.

### `packages/common/src/runtime.ts::rejectBareText`

`rejectBareText(value, where, expected)` is the strict surface's bare-text guard: a string throws `<where>: a strict factory takes a built node, not a string; expected <expected>, or use .coerce`. Arrays are checked element-wise and every other value passes through unchanged. The loose surface (`.coerce`) is where text becomes a node. A slot that stores only kind ids (a kind enum with no node value) takes no guard: its strict input is one of its declared fixed values, not a leaf's text, so `coerceKindEnumStorage` maps a matching string to its id.

### `packages/common/src/runtime.ts::rejectKeywordText`

`rejectKeywordText(value, where, word, keywords)` throws `<where>: '<text>' is this slot's keyword` when the value is a word-kind node (`$type === word`) whose `$text` is one of `keywords`. Arrays are checked element-wise and every other value, including another leaf kind with the same text, passes through unchanged. The loose surface never reaches it with a keyword spelling, because its keyword extraction stores the arm's kind id first.

### `packages/common/src/runtime.ts::admitAliasContent`

The runtime half of `aliasContentAdmission`: it maps arrays element-wise, reads a value's id from its `$type` (or the value itself when it is a stored kind id), and builds the alias for the first row whose ids contain it.

### `packages/common/src/runtime.ts::coerceMixedEnumStorage`

Storage for a slot that holds either a fixed text's kind id or a node: text in the slot's table becomes its id, any other text is kept, a node whose `$type` is one of the table's ids becomes that id, and arrays map element-wise, dropping absent entries.

### `packages/common/src/runtime.ts::coerceKindEnumStorage`

Storage for a slot that holds only kind ids: text, or a node's text, in the slot's table becomes its id, and a node becomes its `$type`. The slot's own table is the only string surface: an unknown string throws `kind-enum slot: <text> is not a valid value (expected one of: …)` rather than resolving through the grammar's kind catalog into a valid-looking id outside the slot's members.

### `packages/common/src/runtime.ts::bundle`

The `FlavorPair` constructor: a factory's strict and coerce flavours as one value, with the pair's arity stamp, `bundle(strict, coerce, { key, max })`. Every pair the factories surface carries is built here, so each pair holds its own stamp and no route needs a mirror structure for it.

When `coerce` is present, `strict` need not be callable: a keyword leaf's strict entry is its kind id. `coerce` may be `undefined` for a strict-only pair (a refine form); the result is a `StrictFlavor` with no `coerce` key, so hoisting falls back to the strict flavour. The stamp's type is `HoistArity<MaxArity<flavor>>`, the flavor being `coerce` when present and `strict` otherwise: it is required exactly when that flavor's `MaxArity` is a number literal and refused when the flavor takes a rest parameter, so a missing, wrong or superfluous stamp is a type error in the generated package.

The pair always has an `arity` key, `undefined` when unstamped, so spreading a pair into a route object after an earlier pair (`{ ...B.<key>, ...bundle(seated, …) }`) replaces the earlier stamp with its own.

The pair is frozen.

### `packages/common/src/runtime.ts::hoist`

Wraps a flavour pair as a callable (the coerce flavour when present, strict otherwise), copying every property and hoisting nested pairs through `hoistRoutes`; `Hoisted<B>` carries the exact surface. Bundling and hoisting are dynamic because they are uniform across all kinds; everything per-kind is emitted statically.

The callable's copied properties are non-writable and non-configurable, and the callable is frozen, so a factory shared under several keys cannot be changed under one of them.

The pair's own stamp (`b.arity`, set by `bundle`) bounds the callable: a call with more than `max` arguments throws `<key>: takes at most <max> argument(s), got <n>`. An explicit trailing `undefined` counts, as it does for the type checker. A pair without a stamp (an unbounded, rest flavor) takes any number. The `arity` key itself is not copied onto the callable, and every nested pair is hoisted through `hoistRoutes` with its own stamp, so sub-factory and variant routes are bounded exactly as top-level builders are.

### `packages/common/src/runtime.ts::hoistRoutes`

Hoists a route object that need not be a pair at its top: a flattened parent (`{ eq: {strict, coerce}, … }`, or `{ strict, coerce, eq: …, type: … }` when a variant declared `arm.default`). A pair at the top hoists, recursing into its own properties through `hoistRoutes`, not `hoist`, so a pair nested under a pair (a default route whose own variant is itself a route object) stays fully walked; anything else recurses member by member. A flattened parent therefore reads as `ir.<parent>(...)` when it has a default and always keeps its named variants reachable, like a bundle entry's sub-factories.

The route object it returns is frozen.

### `packages/common/src/utils.ts::isNodeOfKind`

Whether a value is a node of one kind id. It answers a boolean and never narrows. Narrowing an argument typed as a union that holds a node's `.Bound` beside its storage type filters the members against each other, and that comparison exceeds the checker's depth on deeply nested grammars; a caller that already knows what it will do with a hit casts once instead.

### `packages/common/src/utils.ts::configFieldOr`

The value of the key `key` when the input is a config object (not a node) that carries it, else `orElse()`. The fallback is a thunk so it runs only when no config was given, which keeps a bare-input refusal from firing for a config. It takes and returns `unknown` for the reason `isNodeOfKind` never narrows: the `in` and `!isNode` narrowing it replaces relates the members of a `.Bound`-bearing union.

### `packages/common/src/utils.ts::orDefault`

The value, or the default's when it is absent. The default's type is not an inference site (`NoInfer`), so the result is the value's own type and the checker never reduces the value's union against the default's, which is what a `??` expression does and what exceeds the depth on a union that holds a node's `.Bound` beside its storage type.

### `packages/common/src/runtime.ts::hoistAs`

`hoistRoutes` with the result type given and the argument taken as `unknown`, so a bundle entry is hoisted without relating the overlay's declared type to the pair type the hoister would infer. The generated `factories/index.ts` uses it for every entry.

### `packages/common/src/utils.ts::withListView`

Makes a node that reads as a list (a separated list, or a list owner whose sole content is one) a `ReadonlyArray` of its items. The items are the list's elements, except that a transparent wrapper carrying only its content reads as that content (the spec names the wrapper kind, its content accessor and the storage keys of its other slots; a decorated wrapper stays as it is). For an owner the items are read through the owner's own list accessor (`list.accessor`), so a parsed owner expands the list and a built one reads what it stores; for a list node the node is the list.

It defines a getter per index up to the element count, the length of the list's stored elements (`count`; the reader stores a lone element as a single node, which counts as one), so the elements themselves are not materialized. For a list node that storage is its own; for an owner it is the list node stored under `list.storage`. A parsed owner normally arrives with that list node already read, its elements as stubs, because the wrap reads a list owner two levels at once. An owner reached another way (the parsed root, or a read by handle alone) stores its list only as a read stub (a parent handle and a child index; a read node's own handle alone is not one), which carries no count; the view then reads that one node from `tree` without wrapping it. A node built from a read stub has no tree: it builds, has no index getters, and its `length` throws naming the stub. The view then defines `length`; the iterator; `Symbol.isConcatSpreadable`, so `concat` from either side spreads the items; every non-mutating array method, `toString` and `toLocaleString` included, delegating to the items; and one getter per option the list's factory takes, read from the list's stored `_<option>` and falling back to the default the spec stamps (an absent list reads every default and has no items). The items are computed on first use and kept on the node. Every member is non-enumerable, so a spread, `Object.keys` and serialisation see the node exactly as before, and rendering never reads them. The list accessor and `$with` are left as they are.

### `packages/common/src/utils.ts::withListSlots`

Makes the `$with` setter of each slot that holds a list take the builder arguments of the kind it holds: `(...items)` or `(options, ...items)`, built through that kind's raw factory, or the whole node of that kind, seated as it is. When the list's element is a config-shaped group (`element`), an item that is that group's config object is built through the group's factory first. No arguments clear an optional slot and build an empty list for a required one. A whole node is recognised as a single argument whose kind is the slot's kind (or `undefined`); anything else is passed to the factory.

### `packages/common/src/utils.ts::LIST_VIEW_MEMBERS`

The names `withListView` defines on a node from `ReadonlyArray`: its non-mutating methods and `length`. `toString` and `toLocaleString` are not among them; every object already has them. A compile-time check keeps the method list equal to `ReadonlyArray`'s own, so the runtime cannot miss a method the type promises. The emitter refuses a list whose accessors or options take one of these names.

### `packages/common/src/utils.ts::withGroupSeat`

Flattens a group onto the parent that seats it. The group stays stored in its slot and the slot's own accessor stays, but the group's fields are readable on the parent under the names the spec gives them, each a property whose getter returns the field's reader while the seat's stored property (`stored`) holds a group and `undefined` while it does not, so a reader exists only when it has a value, and each name's `$with` setter rebuilds the group with that one field replaced and re-seats it. The types offer no such setter for an optional field of an absent group; for an untyped caller, on an absent group a setter given no value clears the seat, so the group stays absent, as an `undefined` flattened key does in the strict config; a value builds the group from that field alone when it is the group's only required field, and otherwise throws naming the required fields, so no partial group is ever seated. A name the seat prefixed carries the group field it stands for (`field`), so `seatLeft` reads and sets the group's `left` while the parent's own `left` is untouched. A name that spells the seat's slot reads the group's inner value; its setter takes that value, or the whole group when the argument's kind is the group's. The group's own accessor stays reachable through `storedSlotReader`. A node that seats several groups applies it once per seat.

### `packages/common/src/utils.ts::storedSlotReader`

The accessor that reads a slot's stored value as a node, for a caller that walks storage by accessor name (the validator's materialization). It is the node's own accessor unless a seat replaced it: a flattened key that spells the seat's slot reads the group's inner value, and the seat records the group's reader here.

### `packages/common/src/utils.ts::withElementsSeat`

Makes the `$with` setter of an elements-seat slot take the group config objects its config surface takes: an argument that is a plain object naming only the group's config keys is built through the group's factory, and every other argument is passed as it was. The setter takes its elements as rest arguments only: an array argument, which only an untyped caller can pass, throws a `TypeError` naming the slot and the spread form, instead of reaching the transport as a malformed element.

### `packages/common/src/utils.ts::isGroupConfig`

Whether a value is a group's config object rather than a node: a non-empty plain object without a `$type` whose keys are all among the group's config keys. The overlay factories, the setters `withElementsSeat` builds and the list-slot setters share it, so a config object means the same thing on every surface.

### `packages/common/src/readUntypedNode.ts::isStub`

Whether a node is a stub: a child a read left at its coordinate, `$parentHandle` beside `$childIndex`. A read stamps `$parentHandle` only with its index, so the pair is the whole test; every consumer that asks "is this unhydrated" asks this.

### `packages/common/src/readUntypedNode.ts::hydrateStub`

The node a stub names, read `depth` levels (one when absent) and left unwrapped; anything that is not a stub comes back as it is. The list view sizes a stubbed list with it and the tools hydrate read nodes with it. The generated wrap module's own `hydrateSelf` wraps instead: it reads the same coordinate through `readNode`, so its result is typed.

### `packages/common/src/transport-data.ts::treeHandleOf`

The tree a node's handle names, whichever of `$handle` (its own), `$parentHandle` (a stub's coordinate, beside `$childIndex`) or `$treeHandle` (a node nothing re-reads: a child a read expanded, a deep read's leaf, a trivia entry) it carries. Every handle is tagged with its tree, so each identifies it; this is the TypeScript side of the Rust `NodeHandle::raw`. The fold uses it to decide a node still names its tree and emits it as the coordinate's `$treeHandle`; the generated wrap uses it to recognize a node that arrived as a coordinate.

### `packages/common/src/transport-data.ts::canFold`

Whether a node crosses to the render as its coordinate (its span and the tree that span slices) in place of its storage: it names its tree, carries no trivia outside its span, and nothing below it was rebuilt. Read depth plays no part: an untouched node renders its source bytes however it was read. That holds because every node a read hands back names its tree: the read's root by its own handle, a stub by its parent's, and a child the read expanded by the tree's tag. An edit detaches the coordinate of the node it rebuilds, so each untouched child below it is then the node that folds, and it must be able to name the tree itself. Below the node that folds a span is the whole requirement, since its bytes carry everything under it. A node that cannot fold (it was rebuilt, or it owns leading or trailing trivia) crosses as its stored slots, which the generated wrap keeps in model shape at every level (`storeExpanded`).

### `packages/common/src/transport-data.ts::detachCoordinates`

Drops the pre-edit spelling and the coordinate that would slice it from every node that holds storage, in place, for data that reached a render by a path other than `toTransportData`. A coordinate that survives (a leaf whose slots are projected from its text) addresses that text and nothing of the layout around it, so it is stamped `$textOnly`, and whichever handle it carries is re-keyed to `$treeHandle`, the only coordinate key the render side reads. The root's edge flanks and a list's source gaps are read from tree bytes, and only a coordinate that names its tree position is evidence for them; a text-only one is not, so a render of such data takes the grammar's defaults where a tree-bound render keeps the source's layout.

### `packages/common/src/utils.ts::describeValue`

A value as the text of a refusal message: a string as itself, anything else as JSON (a bigint as `<n>n`), falling back to `String` when it cannot be serialised. Generated pattern guards use it so a node or object that reached a text slot prints as what it was, not `[object Object]`.

### `packages/common/src/span.ts::sourceSpans`

The wire unit of a position is tree-sitter's: UTF-8 bytes. Converting every span to string indices at the boundary would need a table per tree, so the conversion happens only where text is wanted, and in one place. A consumer that holds a span and wants text calls `slice`; one that must meet a parser node's `startIndex` / `endIndex` (string indices, in the node binding the validators use) converts with `toIndices` or `toSpan`. An ASCII source needs no conversion and takes the identity path, which is every corpus entry but a handful. On a non-ASCII source `toIndices` and `toSpan` re-scan the prefix on every call (decode the bytes up to the offset, or encode the text up to the index), so each call is linear in the offset and a loop over n positions is quadratic; that is fine for the validators and probes that call it per candidate on corpus-sized sources, and a caller converting many positions of a large source should walk them in order with its own running count instead. Byte windows are decoded with `ignoreBOM`, because the default decoder drops a leading byte order mark: a source that starts with one would otherwise lose it from the first slice and have every index off by one. `packages/tools/tests/span-unit-census.test.ts` fails when a hand-written source slices by a span's fields or compares them with a node index directly; it reads names, so a span copied into a differently named variable escapes it.

