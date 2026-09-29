# `packages/common/src` — Function Glossary

### `packages/common/src/create-engine.ts::loadLanguage`

Loads a language's hooks once per descriptor object: later engines for the same descriptor reuse the same promise. A failed load is not cached, so a later call retries; it rejects with `failed to load language "<name>"`, carrying the original error as its `cause`.

### `packages/common/src/create-engine.ts::refuseUnimplemented`

Refuses, before anything loads, an engine option whose behaviour does not exist: any `api` other than `'default'` (the portable surface is reserved; the strict surface is not implemented) and a non-empty `intercept` list. Each message names the option that is not implemented.

### `packages/common/src/create-engine.ts::nativeEngineOptions`

The one mapping from an engine's options to its native engine's: `format` passes through, and `render` becomes the native `options`. Absent keys stay absent.

### `packages/common/src/create-engine.ts::unimplementedVerb`

The error a file verb (`read`, `create`, `edit`, `write`) raises while file changes are not implemented.

### `packages/common/src/create-engine.ts::assembleEngine`

Builds one engine from a language's descriptor and loaded hooks: it creates the native engine from the mapped options, an `EngineIdentity` and the handle that shares it with every node the engine stamps, and exposes the hooks' guards and kind ids and a scoped `build`. `parse` reads through the native engine, binds the tree to the handle so lazily expanded children are stamped too, and wraps the root; `diagnostics.parseAndRead` is the same read and bind without the wrapper, next to the native build's profile. `render` takes a node, or a callback that receives the scoped builders, and finds which engine holds the node's parsed parts, so the node's own engine renders a node built throughout, the one engine that parsed its parsed descendants renders it with the calling engine's options over the call's, and a node whose parsed descendants come from several engines, or from a disposed one, is refused. A node stamped with another language is refused, naming both. `dispose` swaps the handle's engine for the identity before releasing the native engine. `types` is type-only and has no run-time value. An engine that renders another engine's parsed part applies its own options key by key over that engine's: a key the caller leaves unset keeps the reading engine's value.

### `packages/common/src/create-engine.ts::scopedBuild`

The builder table with every call run inside the engine's handle. Each function and namespace it reaches through an own property is wrapped once, so nested variant builders and their `strict` and `coerce` flavours are scoped like the top-level ones, and a builder that calls another builder keeps the same handle.

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

Runs a synchronous call with a handle in scope and restores the previous one afterwards, also when the call throws. Every builder call, wrap and lazy child expansion, and `$with` and `$trivia` setter runs inside it, so a node created there is stamped with that engine's handle. It never wraps an `await`: the scope is a module-level variable that only a synchronous call may hold.

### `packages/common/src/engine-scope.ts::sameLanguage`

Whether two engine identities are of one language: the same descriptor object, the key a language loads under, not the same name. An engine renders another engine's node only when this holds, and the engine's node guards test the same predicate, so "same language" has one definition.

### `packages/common/src/engine-scope.ts::engineOf`

The engine a value's `$engine()` returns, or `undefined` for a value with no engine: not an object, or one that has not been stamped.

### `packages/common/src/engine-scope.ts::bindTree`

Records the engine handle that read a tree, so the wrap layer can find it from the tree alone.

### `packages/common/src/engine-scope.ts::inTreeEngine`

Runs a call inside the handle of the engine that read a tree, or plainly when the tree is bound to none. Every wrap of a read node goes through it, so a child expanded long after the parse returned, outside any engine call, is stamped with the reading engine.

### `packages/common/src/engine-scope.ts::currentHandle`

The handle in scope, or `undefined` outside any engine call. A node built with none has no engine.

### `packages/common/src/engine-scope.ts::isLive`

Whether a handle's `current` is a live engine rather than an identity, told by the presence of a `render` member.

### `packages/common/src/engine.ts::createRenderHandle`

A lazily rendered text: the render runs on first use and its text is cached. `save` writes through the native file path when the engine offers one, else writes the text. Disposing drops the cached text; any use after that throws `rendered text disposed`.

### `packages/common/src/engine.ts::NativeEngineDiagnostics`

The public `EngineDiagnostics` fixed to the native engine's types (a root that carries the whole-file span, a `TreeHandle`), plus `readNode`, the drill-in read only the native engine has. Reached through `SittirEngine.diagnostics` rather than the engine's own surface, because it returns raw node data with reader stubs for children; the public entry point is `parse`, which wraps what these produce.

### `packages/common/src/engine.ts::nativeLanguageEngine`

Adapts one grammar's native engine to the language hooks' native engine shape, the same for every grammar. `render` splits the call's flat options into the native `ignoreFormat` and the render options it resolves over its own, passing none when the call has none. `parseAndRead` returns the native read untouched; the engine that owns the result binds its tree. `buildProfile` is the native build's compile profile.


### `packages/common/src/delimiter.ts::Delimiter`

The bitflag encoding of a separated list's optional flanks: the wire's `_delimiter` key and a list factory's `delimiter` option. `Leading` and `Trailing` are one bit each, `Both` is their union and `None` is zero. Mandatory flanks are template text and never encoded, so a list slot admits exactly the members for the flanks its grammar makes optional. The values are the same for every grammar, so this is the only declaration: generated code, the codegen render-options emitter and tools all import it from `@sittir/common/utils`. It is written as a `const` object with a type and a type-only namespace of the same name, so `Delimiter.None` works as a value and as a type without a TypeScript `enum`.

### `packages/common/src/source.ts::Source`

Where a node came from, the value of its `$source` stamp: `Ts` for a node read from a tree-sitter parse, `Sg` for the ast-grep read path, `Factory` for a node a builder made. The reader and the factories stamp it once, and an edit keeps it (`$with` and `detachCoordinate` drop only coordinates), so it records the node's origin, not whether it still holds a live tree handle. Rust's `enum Source` in sittir-core is the mirror the native renderer branches on: any non-`Factory` node renders with its tree's format. The object `satisfies` `AnyNodeData['$source']`, so the type-level `0 | 1 | 2` union stays the one declaration of the values.

### `packages/common/src/utils.ts::withMethods`

Attaches `$render`, `$toEdit`, `$replace` and `$trivia` to a node, and binds a non-enumerable `$engine()` when an engine's handle is in scope. `$engine()` returns the handle's current value, so disposing the engine changes what every node it stamped sees in one assignment. With a handle, `$render` renders through its engine, `$toEdit` and `$replace` turn that text into an edit, and a disposed engine throws `engine disposed` naming `engine.render(node)`. Without one, the node renders through the facts it was handed. The `$with` setters and the `$trivia` setter run inside the node's own handle, whatever scope calls them, so a node they build carries the same engine, and `$trivia` reads the trivia facts from the identity, which survives disposal.

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
- `isNode`'s kind-parameterised overload narrows to `Extract<Node, AnyNodeData>`, not `Node`: the namespaces carry keyword kinds whose `Node` is the bare id, and an id is never node data, so with the plain `Node` the predicate would contain numbers and stop narrowing ids away in every `coerceTo*` `isNode(input)` check.
- `isEmpty` takes only a kind the map's `empty` pairs name, and narrows it to that kind's `Empty<TypeName>` form.
- `withMethods` attaches the node methods, typed by the map's trivia union. A node built inside an engine's scope renders through that engine; one built outside any scope renders through the facts it is handed, which factories pass as the grammar's and a wrapped tree as its tree-scoped engine.

### `packages/common/src/runtime.ts::bindRuntime`

Binds the runtime to a grammar's facts. At runtime a node is empty when its kind has inner gaps (`trivia.innerGaps`, looked up through `trivia.kindName`) and it holds no children (`isEmptyNode`). `isNode` and `withMethods` are the shared implementations, retyped by the map.

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

The `FlavorPair` constructor: a factory's strict and coerce flavours as one value.

### `packages/common/src/runtime.ts::hoist`

Wraps a flavour pair as a callable (the coerce flavour when present, strict otherwise), copying every property and hoisting nested pairs through `hoistRoutes`; `Hoisted<B>` carries the exact surface. Bundling and hoisting are dynamic because they are uniform across all kinds; everything per-kind is emitted statically.

### `packages/common/src/runtime.ts::hoistRoutes`

Hoists a route object that need not be a pair at its top: a flattened parent (`{ eq: {strict, coerce}, … }`, or `{ strict, coerce, eq: …, type: … }` when a variant declared `arm.default`). A pair at the top hoists, recursing into its own properties through `hoistRoutes`, not `hoist`, so a pair nested under a pair (a default route whose own variant is itself a route object) stays fully walked; anything else recurses member by member. A flattened parent therefore reads as `ir.<parent>(...)` when it has a default and always keeps its named variants reachable, like a bundle entry's sub-factories.
