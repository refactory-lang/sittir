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

Builds one engine from a language's descriptor and loaded hooks: it creates the native engine from the mapped options, an `EngineIdentity` and the handle that shares it with every node the engine stamps, and exposes the hooks' `is` guards and kind ids and a scoped `build`. The node guards (`isNode`, `isParsedNode`, `isFactoryNode`, `isErrorNode`, `isEmptyNode`) are each their free counterpart in `@sittir/common/utils` and a same-language check on the node's stamp: a node of another engine of the language passes, a node of another language does not even when the kind id is valid in both, and a value with no stamp never does. They read only the stamp's language, so they still accept the nodes of a disposed engine. `isEmptyNode` also requires a kind with inner gaps and no content, and narrows through the language's `empty` map. `parse` reads through the native engine, binds the tree to the handle so lazily expanded children are stamped too, and wraps the root, which carries the parse's ERROR and MISSING regions as `$errors` (the native read reports them and the boundary stamps them on the read root); under `errors: 'throw'` it throws `ParseErrors` with that list in place of wrapping a root that has any; `diagnostics.parseAndRead` is the same read and bind without the wrapper, next to the native build's profile. `render` takes a node, or a callback that receives the scoped builders, and renders it through this engine, with this engine's options under the call's. A node stamped with another language is refused, naming both; that is one check on the node, not a walk. A node may hold parts parsed by any engines of the language, alive or disposed: a parsed part crosses as a coordinate that names its tree, and the language's addon holds every live tree, so the render does not depend on which engine parsed what. `dispose` swaps the handle's engine for the identity before releasing the native engine; it releases no tree, since a tree lives as long as a parsed object names it. `types` is type-only and has no run-time value.

The engine object and its `EngineIdentity` are frozen, so no member can be reassigned; the identity holds the caller's `options` as given, and that object stays the caller's.

`is` on the engine is the language's table through `languageGuards`, so `engine.is.<kind>` and `engine.is.<supertype>` check the language as `isNode` does; the package-level `is` has no engine and stays a check on the kind id alone.

### `packages/common/src/create-engine.ts::scopedBuild`

The builder table with every call run inside the engine's handle. Each function and namespace it reaches through an own property is wrapped once, so nested variant builders and their `strict` and `coerce` flavours are scoped like the top-level ones, and a builder that calls another builder keeps the same handle.

The builders are read-only: the tables they wrap are frozen where they are built, and a write, definition or deletion through the scoped table throws `the build table of an engine is read-only`. The wrapper's target is an empty stand-in that forwards every trap to the real table, because a proxy may not return a different value for a non-writable, non-configurable property of its own target, and the scoped value is different from the frozen one.

### `packages/common/src/create-engine.ts::createEngine`

The entry point: refuses unimplemented options, loads the language (once per descriptor), and assembles an engine. Engines share no state: each owns its native engine and its options. Its `render` option is inferred `const` and checked by `RenderOptionsCheck`, so an indent unit outside the language's indent characters, or a key the language's options do not declare, fails to compile.

### `packages/common/src/engine-scope.ts::LiveEngine`

An engine's identity plus its `render`: what a node's `$render` reaches through its handle. The public `Engine` satisfies it structurally.

### `packages/common/src/engine-scope.ts::EngineHandle`

The one object an engine shares with every node it stamps. `current` is the live engine, or its identity once the engine is disposed, so swapping it detaches every node of that engine at once with no registry of nodes and no walk over them. A node holds the handle strongly, so `$render` never depends on when the collector runs. `lineGapsOf` is the engine's line-gap query while it lives, the one `readTrivia` derives a read node's whitespace from; dispose removes it, so a detached node reads only the trivia it stores.

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
- The node members (`$render`, `$trivia`, `$engine`) are written in each node's literal by the factories and wraps, typed by the map's trivia union. A node built inside an engine's scope renders, edits and takes trivia through that engine; one built outside any scope carries no engine and refuses each of those.

### `packages/common/src/runtime.ts::bindRuntime`

Binds the runtime to a grammar's type map. `isNode` is the shared implementation, retyped by the map; the runtime has no facts of its own, because a node's trivia facts come from its engine. Emptiness is a guard on the engine, which knows the kinds with inner gaps.

### `packages/common/src/runtime.ts::rejectBareText`

`rejectBareText(value, where, expected)` is the strict surface's bare-text guard: a string or a bigint throws `<where>: a strict factory takes a built node, not a string; expected <expected>, or use .coerce` (naming which it was). Arrays are checked element-wise and every other value passes through unchanged. A number passes, because a slot that also holds fixed-text kinds stores their kind ids as numbers and the guard cannot tell a kind id from a scalar; where the slot holds no such kind, the native render refuses the number, naming the slot (`renders from a node, not a kind id`). A bigint is never a kind id, and the transport would drop it without a word, so it is refused here. The loose surface (`.coerce`) is where text becomes a node. A slot that stores only kind ids (a kind enum with no node value) takes no guard: its strict input is one of its declared fixed values, not a leaf's text, so `coerceKindEnumStorage` maps a matching string to its id.

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

### `packages/common/src/utils.ts::modelSlots`

A read node reduced to its model's slots, the first step of every generated wrap: `keys` are the model's storage keys, and a `_` key outside them (a child the model has no slot for, such as a literal the template prints) is dropped; every other member, symbol-keyed ones included, is kept. The reader hands each child over under its tree-sitter field or its kind name; `routes` re-keys those names onto the model slot that stores them, which is how the model's slot names reach a read node at all. Keys routed to one slot merge in document order, read off `$slotOrder`, and a merged bucket of one stays a single value. `$slotOrder` itself is renamed to the model's slots and dropped when routing leaves fewer than two buckets, so it reads exactly as a read of model slots would. A node none of whose keys is routed is copied as a plain filter: the route check reads the table's keys, not the node's.

### `packages/common/src/utils.ts::interleaveBuckets`

The values of several keys merged into one array in document order: each `$slotOrder` entry takes the next item of its key's bucket, through a cursor per bucket. Without a stamp the buckets are concatenated in key order.

### `packages/common/src/utils.ts::orDefault`

The value, or the default's when it is absent. The default's type is not an inference site (`NoInfer`), so the result is the value's own type and the checker never reduces the value's union against the default's, which is what a `??` expression does and what exceeds the depth on a union that holds a node's `.Bound` beside its storage type.

### `packages/common/src/runtime.ts::hoistAs`

`hoistRoutes` with the result type given and the argument taken as `unknown`, so a bundle entry is hoisted without relating the overlay's declared type to the pair type the hoister would infer. The generated `factories/index.ts` uses it for every entry.

### `packages/common/src/utils.ts::LIST_VIEW_MEMBERS`

The names a list node takes from `ReadonlyArray`: its non-mutating methods and `length`. `toString` and `toLocaleString` are not among them; every object already has them. A compile-time check keeps the method list equal to `ReadonlyArray`'s own, so the runtime cannot miss a method the type promises. The emitter refuses a list whose accessors or options take one of these names.

### `packages/common/src/utils.ts::storedSlotReader`

The accessor that reads a slot's stored value as a node, for a caller that walks storage by accessor name (the validator's materialization). It is the node's own accessor unless a seat replaced it: a flattened key that spells the seat's slot reads the group's inner value, and the node records the group's reader under `STORED_SLOT_READERS`.

### `packages/common/src/utils.ts::isGroupConfig`

Whether a value is a group's config object rather than a node: a non-empty plain object without a `$type` whose keys are all among the group's config keys. The overlay factories, the elements setters (`elementsWith`) and the list-slot setters share it, so a config object means the same thing on every surface.

### `packages/common/src/readUntypedNode.ts::isStub`

Whether a node is a stub: a child a read left at its coordinate, `$parentHandle` beside `$childIndex`. A read stamps `$parentHandle` only with its index, so the pair is the whole test; every consumer that asks "is this unhydrated" asks this.

### `packages/common/src/readUntypedNode.ts::hydrateStub`

The node a stub names, read `depth` levels (one when absent) and left unwrapped; anything that is not a stub comes back as it is. The list view sizes a stubbed list with it and the tools hydrate read nodes with it. The generated wrap module's own `hydrateSelf` wraps instead: it reads the same coordinate through `readNode`, so its result is typed.

### `packages/common/src/transport-data.ts::treeHandleOf`

The tree a node's handle names, whichever of `$handle` (its own), `$parentHandle` (a stub's coordinate, beside `$childIndex`) or `$treeHandle` (a node nothing re-reads: a child a read expanded, a deep read's leaf, a trivia entry) it carries. Every handle is tagged with its tree, so each identifies it; this is the TypeScript side of the Rust `NodeHandle::raw`. The fold uses it to decide a node still names its tree and emits it as the coordinate's `$treeHandle`; the generated wrap uses it to recognize a node that arrived as a coordinate.

### `packages/common/src/transport-data.ts::canFold`

Whether a node crosses to the render as its coordinate (its span and the tree that span slices) in place of its storage: it names its tree, carries no trivia outside its span, and nothing below it was rebuilt. Read depth plays no part: an untouched node renders its source bytes however it was read. That holds because every node a read hands back names its tree: the read's root by its own handle, a stub by its parent's, and a child the read expanded by the tree's tag. An edit detaches the coordinate of the node it rebuilds, so each untouched child below it is then the node that folds, and it must be able to name the tree itself. Below the node that folds a span is the whole requirement, since its bytes carry everything under it. The trivia it is judged by is the trivia it crosses with (`TriviaOf`), so a read node that owns a line-break run outside its span does not fold. A node that cannot fold (it was rebuilt, or it owns leading or trailing trivia) crosses as its stored slots, which the generated wrap keeps in model shape at every level (`storeExpanded`).

### `packages/common/src/transport-data.ts::TriviaView`

The trivia a node crosses to the render with, and which of its sides the read derived (`DerivedSides`). The engine's render passes `readTrivia` and `readDerivedSides`, so an untouched child of a rebuilt parent crosses with the whitespace its parse gave it, minus the runs whose neighbour changed (`changedEdges`). Every caller names its view: data with no derived trivia (a test's hand-written nodes, a probe's detached data) passes `STORED_TRIVIA`, where a node crosses with the trivia it stores and nothing is derived. There is no default, so no caller can skip the derived view by leaving it out. The fold decision and the `$_trivia` an unfolded node carries both come from this one view; a node's raw `$_trivia` never crosses beside it. The view also answers `isWrapper`: whether a kind id is one a rebuild constructs around an existing node (`TriviaFacts.rebuildWrappers`), which `evidenceOf` asks before looking through an entry. `STORED_TRIVIA` answers no for every kind, since nothing in its data is judged for source adjacency.

### `packages/common/src/transport-data.ts::detachCoordinates`

Drops the pre-edit spelling and the coordinate that would slice it from every node that holds storage, in place, for data that reached a render by a path other than `toTransportData`. A coordinate that survives (a leaf whose slots are projected from its text) addresses that text and nothing of the layout around it, so it is stamped `$textOnly`, and whichever handle it carries is re-keyed to `$treeHandle`, the only coordinate key the render side reads. The root's edge flanks and a list's source gaps are read from tree bytes, and only a coordinate that names its tree position is evidence for them; a text-only one is not, so a render of such data takes the grammar's defaults where a tree-bound render keeps the source's layout.

The result holds no tree: the hold is removed from every node and trivia entry, while a surviving coordinate keeps its `$treeHandle` and `$span`. `toTransportData` refuses a coordinate that holds no tree, so a caller that still renders the detached data gives it the tree again with `holdTree`, and the data then renders for as long as it is held.

### `packages/common/src/utils.ts::describeValue`

A value as the text of a refusal message: a string as itself, anything else as JSON (a bigint as `<n>n`), falling back to `String` when it cannot be serialised. Generated pattern guards use it so a node or object that reached a text slot prints as what it was, not `[object Object]`.

### `packages/common/src/native-binding.ts::nativeLoadFailure`

A grammar package holds one binary per platform and napi's loader picks the host's. When that fails the loader's own error is a list of every candidate it tried, which says nothing a consumer can act on, so the generated `backend.ts` asks here instead. Two cases are told apart by reading the binding directory, not the error text: the host's binary is absent (the package was not built for this platform — the message names the file and lists the platforms that are there), or it is present and the dynamic loader refused it (the message carries that reason, taken from the first error in the cause chain that names the file). Directory contents decide the case because the loader reports both the same way. Before either, the loader's environment is checked: with `NAPI_RS_NATIVE_LIBRARY_PATH` or `NAPI_RS_FORCE_WASI` set the generated loader never tries the packaged binary, so the message names the override and carries the loader's innermost error instead of describing a lookup that did not happen.

### `packages/common/src/native-binding.ts::platformSuffix`

The one spelling of a platform in a binary's file name. It must agree with what `napi build --platform` writes; `targetSuffix` maps a Rust target triple onto the same spelling, so the release pack check and the load-failure message name files identically.

### `packages/common/src/span.ts::sourceSpans`

The wire unit of a position is tree-sitter's: UTF-8 bytes. Converting every span to string indices at the boundary would need a table per tree, so the conversion happens only where text is wanted, and in one place. A consumer that holds a span and wants text calls `slice`; one that must meet a parser node's `startIndex` / `endIndex` (string indices, in the node binding the validators use) converts with `toIndices` or `toSpan`. An ASCII source needs no conversion and takes the identity path, which is every corpus entry but a handful. On a non-ASCII source `toIndices` and `toSpan` re-scan the prefix on every call (decode the bytes up to the offset, or encode the text up to the index), so each call is linear in the offset and a loop over n positions is quadratic; that is fine for the validators and probes that call it per candidate on corpus-sized sources, and a caller converting many positions of a large source should walk them in order with its own running count instead. Byte windows are decoded with `ignoreBOM`, because the default decoder drops a leading byte order mark: a source that starts with one would otherwise lose it from the first slice and have every index off by one. `packages/tools/tests/span-unit-census.test.ts` fails when a hand-written source slices by a span's fields or compares them with a node index directly; it reads names, so a span copied into a differently named variable escapes it.

### `packages/common/src/utils.ts::restItems`

The guard every generated list setter passes its rest arguments through. A list setter takes its items as arguments; one array in their place is the call shape of an older surface and of most other APIs, so it is the mistake worth a message of its own. The check is `length === 1` and the single argument being an array, which no list element is: elements are nodes, kind ids or text.

### `packages/common/src/utils.ts::renderText`

The text a node renders to in the engine it was built or read in. It takes the engine handle the node captured when it was built, so a node built with no engine in scope refuses with `node has no engine`, and a node whose engine was disposed refuses with its own message.

### `packages/common/src/utils.ts::rebuilt`

What every `$with` setter runs its rebuild through. It runs the rebuild inside the node's own engine (or plainly, when the node has none) and hands the source node's trivia to the node the rebuild returns, together with what it keeps of the source node (`carryEdit`), and gives each fresh node the rebuild minted in a slot the source node held its identity too (`carryRebuiltSlots`). Inner trivia can only travel to a node that is still empty: once the rebuild gives the node a child, the comment would sit beside it, so the call throws and names the kind.

### `packages/common/src/utils.ts::triviaSide`

`node.$trivia.leading(...)` and `.trailing(...)`: with items it sets that position, keeps the other and returns the node; with none it returns the entries the position holds. An item is a trivia node, a whitespace kind id, or text, which is a whitespace kind when spelled exactly so and a comment otherwise. It needs the node's engine for the grammar's trivia facts. A read gives the side as `readTrivia` has it, so a read node's line-break whitespace is there beside its comments; a write starts from that same view, so setting one side keeps the other side's derived entries.

### `packages/common/src/utils.ts::readTrivia`

A read node's trivia as its parse has it: the comment entries the reader stored, with the line-break whitespace the node owns interleaved by position (`interleaved`). The whitespace is not in the read output; it is asked of the native line-gap query (`lineGapsOf`) on the node's first trivia read and cached for the node's life, so a parse or wrap that never reads trivia pays nothing for it. What the query returns is already classified to whitespace member kind ids by the grammar's own whitespace classifier, restricted to the members whose text holds a line break, so a gap of spaces on one line yields nothing and the reader's comment ownership decides which node a run belongs to. Only an object a read produced derives (`isRead`): a copy keeps exactly the `$_trivia` it was given, even though it carries the read's address. Writing is per side: a side whose trivia was written (`triviaWriter`'s store marks just that side) holds what was written, while the other side keeps deriving, so it is still subject to the neighbour rule and still votes. A write stores from the node's stored trivia, never from the derived view, so derived runs never become written ones. A node no read gave and a node outside a live engine read their stored trivia only.

### `packages/common/src/transport-data.ts::holdReadTree`

`holdTree` for the objects a read returned, the one place that records read provenance: every object it visits also counts as read (`isRead`). The engine's read sites call it; a caller that re-holds a copy calls `holdTree`, so the copy holds the tree without counting as read. Provenance lives in a weak set rather than a member, because a spread copies members: a copy built with different trivia must not inherit a fact about the object it was copied from.

### `packages/common/src/transport-data.ts::carryRead`

Carries read provenance from a read object to the object rebuilt from it, which is the same node in another shape. The wrap's `wrapNode` carries it to every wrapped node, and the validator's `materialize` carries it to every plain node it resolves. Every other copy is not read.

### `packages/common/src/transport-data.ts::changedEdges`

Which edges of a list item face a neighbour other than the one its source had there. A derived whitespace run is the gap between a node and one particular neighbour, so it holds only while that neighbour is still there; otherwise the seat decides the gap. The leading edge changed when the item before it in the rebuilt list is not the sibling its leading runs were measured from (`readDerivedSides`, judged by tree and span through `isSourceSibling`), or, for the list's first item, when the source had such a sibling. The trailing edge changed when the item is no longer last, since only a last item owns a closing gap. Only a derived side can change: a side whose trivia was written keeps what was written. An item with no derived runs has no changed edges. The item is judged by the node that stands for it (`evidenceOf`): a rebuilt wrapper has no runs of its own, so the node it holds is the one measured, and the transport strips the changed sides from that held node as it crosses, not from the wrapper. The render root changes on both edges, because it has no neighbour at all.

### `packages/common/src/transport-data.ts::sourceAdjacent`

Whether a list item still follows the sibling it followed in its source: the item before it in the rebuilt list is that sibling, by tree and span (`isSourceSibling`, against `readDerivedSides`'s `previous`). The neighbour rule (`changedEdges`) and the gap evidence (`sourceGapOf`) both ask this one question, so a gap that keeps its source bytes and a derived run that holds are decided by the same test.

### `packages/common/src/transport-data.ts::sourceGapOf`

The source range a list item sends as `$_gap`: from its source predecessor's end to its own source start, in the tree both were read from, when the item is still source-adjacent and no derived line-gap run already spells that gap. A run the item's leading trivia opens with is the gap itself, so the native fill never classifies the same gap twice. Nothing is sent unless the node holding the items carries source identity (`owner`): a list built afresh, or a copy that dropped its identity, keeps none of its source layout, so its gaps and its flanks (`sourceFlankOf`) go canonical together. The first item of a list sends nothing; its gap faces the parent's opener, which is the list's flank, not a list neighbour. It sends the range, `{ $treeHandle, $span }`, as evidence only: the gap is classified, never sliced.

### `packages/common/src/transport-data.ts::listItemsOf`

The items of a list node: the one array a list kind holds in its slots. Whether a node is a list node is the model's classification, stamped per grammar as the list kind ids (`TriviaView.isList`, from `TriviaFacts.listKinds`). It is never inferred from a node's shape. A construct that holds an array between its own delimiters, such as a string around its fragments, is not a list kind, so it has no list flanks. Unslotted children (`$other`), such as a read list's separators, are not slots and are not counted.

### `packages/common/src/transport-data.ts::sourceFlankOf`

A list node's flanks as the transport sends them (`$_flank`): the tree handle and span of its source identity, and which flanks it keeps. The flank before is kept while the list's first item is still the source's first item of this list (its evidence lies inside the list's source span and has no source predecessor, `previous === null`); the flank after while its last item is still the source's last (`next === null`). Nothing for anything that is not a list node with source identity. The native fill classifies the kept flanks from the source, depth included (`fill_source_flanks`).

### `packages/common/src/transport-data.ts::SourceFlankEvidence`

The `$_flank` wire shape: `$treeHandle`, `$span`, `$before`, `$after`.

### `packages/common/src/transport-data.ts::toDetachedTransportData`

The transport for data leaving the tree it was read from, such as a render fixture's input. It is the same walk as `toTransportData`: each entry's changed edges, the trivia that crosses, the bearer a rebuilt wrapper's edges pass to, the gaps and the flanks are all judged the same way, so a detached render lays out what a live render of the same data does. The one difference is that no node folds to a coordinate, and trivia coordinates are not asserted to hold their tree, because the caller turns every range into the text it names before the data leaves.

### `packages/common/src/transport-data.ts::crossingTrivia`

A node's trivia as it crosses: without the runs whose neighbour changed (`withoutChangedEdges`), and, for a list node (`listItemsOf`), without the derived whitespace runs at its two ends. Those runs are the list's flanks, which its source flanks spell instead, depth included, so each flank has one source. Comments stay.

### `packages/common/src/transport-data.ts::evidenceOf`

The node whose source identity stands for a list entry. A rebuild constructs some wrappers afresh around the one node they hold (an alias envelope, or a kind enrich mints, such as rust's `_attributed_parameter` around each parameter), so the entry itself has no source; the node it holds does. Two conditions, one per fact:

- the entry's kind is one the view says a rebuild mints around one node (`TriviaView.isWrapper`), a classification stamped per grammar, never guessed from slot names;
- the entry holds exactly one present node in its slots. Slots it leaves empty do not count, so a group whose optional slot is unfilled is still looked through; one holding two nodes is not. Its unslotted children (`$other`) never count.

An entry with its own source identity is its own evidence. Adjacency is judged on these nodes on both sides of a gap.

### `packages/common/src/transport-data.ts::sourceOf`

Where a node sits in its source: a read node's own tree token, tree handle, span and stamped kind, or, for a node an edit rebuilt, the identity the edit carried forward from the node it replaced. A node the reader addressed by its own handle keeps that handle in its identity, and its line gaps are asked for by the handle, since its span alone may not name a tree node (the grammar root's span covers the whole source). It is evidence of layout only: an edited node never folds and never slices, but it can still be found in its source (line gaps derive for it) and judged adjacent to its neighbours. The identity is kept under a private, non-enumerable symbol, so it never reaches the wire and a spread copy never inherits it; `$span` stays the public fact of a node whose text is its source's.

### `packages/common/src/transport-data.ts::withoutChangedEdges`

Drops the whitespace runs on the changed edges of a node's trivia: on the leading side the runs before its first comment, on the trailing side the runs after its last. Comments always stay with their owner, and so does a run between a comment and its owner, because that run's neighbour is the comment. A node left with no trivia can fold to its coordinate again.

### `packages/common/src/utils.ts::carryRebuiltSlots`

For each storage slot of a rebuilt node whose value the rebuild minted afresh, where the slot held a read node of the same kind before: the fresh node takes what the read one had (`carryEdit`). Only the kinds a rebuild constructs around existing nodes count (`TriviaFacts.rebuildWrappers`), so a list `$with` rebuilds from its items keeps the source position of the list it replaces, and its flanks can be judged (`sourceFlankOf`); a node the caller built and passed in, of another kind or already carrying source, is left as it is.

### `packages/common/src/utils.ts::carryEdit`

What an edited node keeps of the node it was rebuilt from (`rebuilt`, the one place every `$with` setter returns through): that a read produced it (`carryRead`), where it sits in the source (`carrySource`), and which of its trivia sides were written. Its line gaps then derive from the same source position, so an edit whose neighbours are unchanged keeps the gaps its source had around it, and a side the caller rewrote stays written.

### `packages/common/src/utils.ts::readDerivedSides`

Which sides of a read node's trivia are derived from its line gaps (a side stops being derived once it is written), and the spans of the sibling owners beside it, `previous` `null` for its parent's first owner child and `next` `null` for its last; `undefined` when `readTrivia` derives nothing for the node. It comes from the same native query and the same cached derivation as the trivia, so the transport judges a neighbour by the fact the gaps were measured against, not by a second reading of adjacency.

### `packages/common/src/utils.ts::lineGapAddressOf`

How the line-gap query names a read node. A node read on its own carries its handle. A child a deep read expanded has no handle of its own, only its tree's tag, its span and its kind, and the query resolves that coordinate to the outermost node of that kind spanning exactly those bytes. A node with neither was not read and has no gaps to ask for.

### `packages/common/src/utils.ts::interleaved`

One side's stored comment entries and line-gap runs merged into source order. A comment entry sits at its span's start; an entry with no span (a written kind id or a detached leaf) keeps the position of the entry before it, so it never moves past a neighbour it was written beside. Gaps sit at their own start offsets. The two sources never overlap: a run is cut at every extra it touches.

### `packages/common/src/utils.ts::triviaInner`

`node.$trivia.inner(...)`: the first inner gap of a kind that has one. It writes only to an empty node (a comment beside any child has that child to lead or trail), refuses a kind with no inner gap, and detaches the node's coordinate, since the coordinate's span already covers the gap the entries sit in.

### `packages/common/src/utils.ts::triviaInnerAt`

`node.$trivia.innerAt(gap, ...)`: a named inner gap, for a grammar that keys its gaps. It refuses a gap the kind does not have and otherwise behaves as `triviaInner`.

### `packages/common/src/utils.ts::LIST_ITEMS`

The key a list node keeps its frozen items under. The list methods and the iterator read the items from it, so a node holds one array and every list member is shared.

### `packages/common/src/utils.ts::listItems`

The items of a list view: the list's elements, each wrapper that carries only its content read as that content, frozen. A wrapper with a decoration (an attribute on an argument) stays a node.

### `packages/common/src/utils.ts::LIST_METHODS`

The `ReadonlyArray` methods of a list node, written once. Each reads the items the node holds under `LIST_ITEMS`, so a node takes the whole set by spreading this object into its literal.

### `packages/common/src/utils.ts::listIterator`

The `Symbol.iterator` member of a list node: the iterator of the items it holds under `LIST_ITEMS`.

### `packages/common/src/utils.ts::listSlotWith`

A list slot's `$with` setter. With no arguments it clears an optional slot or builds the empty list; one argument that is the list itself (or `undefined`) is set as it is; anything else is the list's items and builds the list, each element group built into its element.

### `packages/common/src/utils.ts::elementsWith`

An elements slot's `$with` setter. Its elements are rest arguments, so one array is refused and told to spread; each element that is a config group is built into its element before the slot is set.

### `packages/common/src/utils.ts::seatWith`

A seated key's `$with` setter. Through a present group it writes the group's own field; with no value it leaves the group absent; with a value it builds an absent group from that field alone when no other field is required, and otherwise throws naming the required fields. A key that spells the seat's slot also takes the whole group.

### `packages/common/src/transport-data.ts::isSlotKey`

Whether a key names one of a node's slots (`_<name>`). Slots are a subset of storage (`isStorageKey`), which also includes the node's unslotted children (`$other`): the anonymous tokens a read keeps, such as a list's separators. A question about the nodes a node holds in its slots counts slots only, so these tokens never count as held nodes. That covers a list node's items (`listItemsOf`) and the one node a rebuilt wrapper stands for (`evidenceOf`). `holdsSlots` and `isStorageKey` are built on it.

### `packages/common/src/transport-data.ts::isDataKey`

Whether a key carries node data across the native boundary: a storage key (`_<slot>`, `$other`) or a `$` metadata key that is not a member (`$with`, `$trivia`, `$engine`, `$render`). A reader, a list index, `length` and a list option are members and so are not data. The boundary projection and every walker that visits a node's keys select by this, and read only the keys it selects, so a member that throws when read is never read.

### `packages/common/src/runtime.ts::kindIdStorage`

A strict builder's storage for a kind-enum or mixed slot: absent stays absent, a kind id stays itself, and an array is read item by item with the absent ones dropped. It reads no text: a string passes through unchanged and the slot's refusal (`rejectBareText`, naming a kind id or the built node the slot holds) rejects it. The loose coercers keep `coerceKindEnumStorage` and `coerceMixedEnumStorage`, whose tables map text.

### `packages/common/src/utils.ts::LIST_READ`

The key a wrapped list node keeps the reader of its items under. The items are not read when the node is wrapped: the first read of any list member calls this reader, and `listItemsOf` keeps the result under `LIST_ITEMS`. A built list holds its items from the start and has no reader.

### `packages/common/src/utils.ts::listItemsOf`

The items of a list node: the ones it holds under `LIST_ITEMS`, or, for a wrapped list, the ones its `LIST_READ` reader hydrates, kept on the first read.

### `packages/common/src/utils.ts::storedElements`

The elements a list stores: its array, or the one element it holds, or none. The reader stores a lone element as a single node, which counts as one.

### `packages/common/src/utils.ts::ownerView`

What a list owner knows of the list it holds, read once when the owner is built: the list itself, and its stored elements. An owner normally holds the list node already read, with its elements as stubs. A list stored only as a read stub (a parent handle and a child index) carries no count, so with a tree the stub is read one level, without wrapping it, and without a tree the elements are unknown and the owner cannot count them.

### `packages/common/src/utils.ts::ownerElements`

The elements a list reads through its own reader, none for an absent list. An owner's items are these elements, collapsed through `listItems`.

### `packages/common/src/utils.ts::listOption`

A list option an owner reads from its list's stored `_<option>`, or the option's default. The value is read when the owner is built.

### `packages/common/src/utils.ts::defineListIndices`

Defines the index positions of a wrapped list or list owner: one getter per position, shared by every wrapped list and not enumerable. A wrapped owner's items are unread until first use, so an index must hydrate them on demand, and a per-node getter would force dictionary mode; one shared getter per position reads the item through `listItemsOf` from whichever list calls it. The getters are the only getters a wrapped node carries.

### `packages/common/src/utils.ts::refuseReadStub`

The refusal of a raw factory given a list owner's storage that is a read stub, a parsed list that cannot be counted without its tree. A factory has no tree, and `engine.build` already refuses a bare stub, so the build throws naming the stub rather than carrying a node whose `length` or items cannot be read. A built owner's `length` is always plain data, so it keeps its fast shape.

### `packages/common/src/utils.ts::spanOf`

The byte range of a parsed node in the source its tree was read from, or `undefined` for a node that was built. Internal: a node's position is not part of the public node type (`ParsedOf` declares no `$span`), and the range belongs to the version of the tree the node was read from, so after an edit it says nothing about the rebuilt node. Tools that slice source or report a line read it here; the bindings reader slices a pattern's source text by this range, so a definition keeps the exact bytes of its leading comments, and also reports the line from it.

### `packages/common/src/utils.ts::groupField`

The value a seated key reads: the group's own reader of that field, or `undefined` while the group is absent.

### `packages/common/src/utils.ts::STORED_SLOT_READERS`

The key a node keeps the readers of its seated slots under, by accessor name, for the case where a flattened key spells its slot and so replaces that slot's own accessor. `storedSlotReader` reads it.

