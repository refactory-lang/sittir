# `packages/common/src` — Function Glossary

### `packages/common/src/create-engine.ts::loadLanguage`

Loads a language's hooks once per descriptor object: later engines for the same descriptor reuse the same promise. A failed load is not cached, so a later call retries; it rejects with `failed to load language "<name>"`, carrying the original error as its `cause`. When the hooks carry portable rows, it records them against the descriptor's `load` (`registerPortableRows`) before resolving, so the language's portable guards read bare kind ids from then on.

### `packages/common/src/create-engine.ts::refuseUnimplemented`

Refuses, before anything loads, an engine option whose behaviour does not exist: an `api` of `'strict'`, which is not implemented. The portable surface never reaches it; `createEngine` assembles a portable engine before refusing. Each message names the option that is not implemented.

### `packages/common/src/create-engine.ts::nativeEngineOptions`

The one mapping from an engine's options to its native engine's: `format` passes through, and `render` becomes the native `options`. Absent keys stay absent.

### `packages/common/src/create-engine.ts::unimplementedVerb`

The error a file verb (`read`, `create`, `write`) raises while file changes are not implemented.

### `packages/common/src/create-engine.ts::assembleEngine`

Builds one engine from a language's descriptor and loaded hooks: it creates the native engine from the mapped options, an `EngineIdentity` (carrying the language's portable rows when its grammar has bindings, so a guard reaches them through the node's engine) and the handle that shares it with every node the engine stamps, and exposes the language's guards (`guardsOf`: the descriptor's own `is` when it was composed for that descriptor) and kind ids (`language.kinds`), the same objects on every engine of the language, and a scoped `build`. The node guards (`isNode`, `isParsedNode`, `isFactoryNode`, `isErrorNode`, `isEmptyNode`) are each their free counterpart in `@sittir/common/utils` and a same-language check on the node's stamp: a node of another engine of the language passes, a node of another language does not even when the kind id is valid in both, and a value with no stamp never does. They read only the stamp's language, so they still accept the nodes of a disposed engine. `isEmptyNode` also requires a kind with an inner side and no content, and narrows through the language's `empty` map. `parse` reads through the native engine, binds the tree to the handle so lazily expanded children are stamped too, and wraps the root, which carries the parse's ERROR and MISSING regions as `$errors` (the native read reports them and the boundary stamps them on the read root); under `errors: 'throw'` it throws `ParseErrors` with that list in place of wrapping a root that has any; `diagnostics.parseAndRead` is the same read and bind without the wrapper, next to the native build's profile. `render` takes a node, or a callback that receives the scoped builders, and renders it through this engine, with this engine's options under the call's. A node stamped with another language is refused, naming both; that is one check on the node, not a walk. A node may hold parts parsed by any engines of the language, alive or disposed: a parsed part crosses as a coordinate that names its tree, and the language's addon holds every live tree, so the render does not depend on which engine parsed what. `admit` is chosen once at assembly alongside `settle` (`admitterOf`, which reads the verify mode and the structure table); `dispose` swaps the handle's engine for the identity before releasing the native engine; it releases no tree, since a tree lives as long as a parsed object names it. `types` is type-only and has no run-time value.

The `intercept` option activates build, parse and render middleware. Parse hooks surround the existing read/bind/error/wrap operation, while raw `diagnostics.parseAndRead` remains a direct diagnostic path. Render checks language ownership before invoking its chain, including when a hook short-circuits. File verbs are still unimplemented, so the reserved file hook has no write pipeline to run around.

The engine object and its `EngineIdentity` are frozen, so no member can be reassigned; the identity holds the caller's `options` as given, and that object stays the caller's.

`is` on the engine is the language's table built with the language's kind test (`guardsOf`), so `engine.is.<kind>` and `engine.is.<supertype>` check the language as `isNode` does; the package-level `is` has no engine and stays a check on the kind id alone. The engine's query hooks carry the same kind test (`kindTestOf`), so `ofType` and the guards run one function.

### `packages/common/src/create-engine.ts::scopeBuilders`

A builder table run through an engine's own build scope: the same `scopedBuild` proxy, handle, `settle` and build middleware the engine's `build` has. Tooling that holds builder tables `build` does not expose (a grammar's raw factory map, the `ir` module's entries) scopes them here, so there is one scope and a `'runtime'` engine checks what they build. It throws for an object `createEngine` did not make.

### `packages/common/src/create-engine.ts::settlerOf`

The handle's `settle`, chosen once when the engine is assembled: the identity in the default `'compileTimeOnly'` mode, or, in `'runtime'` mode, `verifyStructure` over the language's structure table with one `seen` set for the engine. So no build or rebuild tests the mode; two engines in one process keep their own. A refusal is raised when the outermost call returns, and its message names the kind and the slot.

### `packages/common/src/create-engine.ts::admitterOf`

The handle's `admit`, chosen once at assembly like `settle`: a function that does nothing in the default `'compileTimeOnly'` mode, and in `'runtime'` mode a lookup of the kind's row in the structure table followed by `checkInput`, passing the optional key list a refine form supplies. A kind id with no row, or one that is not a number, admits anything. The mode is never read per call, and every caller calls `handle.admit` rather than `checkInput`.

### `packages/common/src/create-engine.ts::scopedBuild`

The builder table with every call, including its build middleware, run inside the engine's handle. Each function and namespace it reaches through an own property is wrapped once, so nested variant builders and their `strict` and `coerce` flavours are scoped like the top-level ones, and a builder that calls another builder keeps the same handle. The result of each call, after its middleware, passes through the handle's `settle`.

When build middleware is active, the wrapper caches by object and access path, so aliases of one callable report the path actually used. Repeated accesses through the same path retain their identity; with no build hooks, aliases keep their original shared wrapper identity. The hook receives the path and arguments and can observe, replace the result or throw. Raw generated builders invoked internally remain under the scope without generating duplicate public-call events.

The builders are read-only: the tables they wrap are frozen where they are built, and a write, definition or deletion through the scoped table throws `the build table of an engine is read-only`. The wrapper's target is an empty stand-in that forwards every trap to the real table, because a proxy may not return a different value for a non-writable, non-configurable property of its own target, and the scoped value is different from the frozen one.

### `packages/common/src/create-engine.ts::interceptorChain`

Captures the active hooks of one operation and composes them in registration order: the first is outermost and its `next` enters the following hook or the existing operation. Empty hooks are skipped, and no active hooks returns undefined so the engine retains its direct path. Each call has its own continuation; a hook may short-circuit, replace the result or propagate an error. Build, parse and render share this one chain implementation. Hooks are bound to their owning interceptor before composition, and later edits to the caller's interceptor array do not change the engine.

### `packages/common/src/create-engine.ts::interceptedRender`

A lazy output handle whose text is produced through render middleware. The hook receives the resolved node and engine render options overlaid by per-call options. The native output handle is created at the original render boundary, preserving the native node snapshot taken there; its text stays lazy. `next` materializes that handle through the supplied continuation, which also measures native rendering when metrics are enabled. Capture alone does not format text or record metrics; a short circuit bypasses both. Disposing the outer handle disposes both handles, including an inner handle that was never materialized. The outer handle caches successful transformed text once, so `toString`, `print` and `save` share the same bytes; a short circuit never materializes the native output. Disposal retains the existing output refusal.

### `packages/common/src/create-engine.ts::materializeNative`

Produces text from an already captured native handle and, when enabled, records the native materialization duration and input/output sizes. Render middleware reaches it through `next`; the direct path retains its existing immediate measurement when metrics are enabled.

### `packages/common/src/create-engine.ts::assemblePortableEngine`

The portable engine: the language's identity, with its portable rows; the shared portable `kinds` (`portable/index.ts::portable`, the same object as the descriptor's `kinds.portable`); and the language's view of the portable guards (`portableGuardsOf(language)`, the same object as the descriptor's `is.portable`), which reads a node of the language or a bare kind id of it. It has no native engine, so it holds nothing to dispose. A language whose hooks carry no portable surface (its grammar has no bindings) is refused with its name.

### `packages/common/src/create-engine.ts::mergeRenderOptions`

The options a render interceptor sees: the engine's render options with the call's laid over them, key by key, and the `layout` group merged one level down, so a call that sets only `layout.newline` leaves the engine's `layout.indent` in place. The native render resolves the same way over the engine's table; this is the object form of that result for middleware.

### `packages/common/src/create-engine.ts::createEngine`

The entry point. `{ api: 'portable' }` loads the language and assembles a portable engine (`assemblePortableEngine`); otherwise it refuses unimplemented options, loads the language (once per descriptor), and assembles an engine. Engines share no state: each owns its native engine and its options. Its `render` option is inferred `const` and checked by `RenderOptionsCheck`, so an indent unit outside the language's indent characters, or a key the language's options do not declare, fails to compile.

### `packages/common/src/engine-scope.ts::LiveEngine`

An engine's identity plus its `render` and `query`: what a node's `$render` and `$query` reach through its handle. The public `Engine` satisfies it structurally.

### `packages/common/src/engine-scope.ts::EngineHandle`

The one object an engine shares with every node it stamps. `current` is the live engine, or its identity once the engine is disposed, so swapping it detaches every node of that engine at once with no registry of nodes and no walk over them. A node holds the handle strongly, so `$render` never depends on when the collector runs. `lineGapsOf` is the engine's line-gap query while it lives, the one `readTrivia` derives a read node's whitespace from; dispose removes it, so a detached node reads only the trivia it stores. `settle` is what a build or rebuild hands its result through before returning it (`settlerOf`). `admit(kindId, args, declared?)` is what a call's input is handed to before the build is trusted (`admitterOf`); `declared` is the key list a refine form passes, since the parent kind's row would refuse its valid keys: each generated raw builder and loose coercer of a kind whose row has `config` or `lists` calls it first, through `currentHandle()`, with its own kind id and the arguments it was given (`admitStatement`).

### `packages/common/src/engine-scope.ts::inEngine`

Runs a synchronous call with a handle in scope and restores the previous one afterwards, also when the call throws. Every builder call, wrap and lazy child hydration, and `$with` and `$trivia` setter runs inside it, so a node created there is stamped with that engine's handle. It never wraps an `await`: the scope is a module-level variable that only a synchronous call may hold.

### `packages/common/src/engine-scope.ts::sameLanguage`

Whether two engine identities are of one language: the same descriptor object, the key a language loads under, not the same name. An engine renders another engine's node only when this holds, and the engine's node guards test the same predicate, so "same language" has one definition.

### `packages/common/src/engine-scope.ts::engineOf`

The engine a value belongs to: what its `$engine()` returns, or for a value with no stamp, the engine that read the tree it holds (a parsed leaf is plain data with no `$engine`, but it holds its tree's token, and `bindTree` recorded that tree's engine). `undefined` for a value with neither: not an object, a built node outside an engine, or a copy that lost its token. Every engine check reads it, the `is` guards' language check, `query` and `render`, so a parsed leaf passes and is refused exactly as a stamped node of its language is.

### `packages/common/src/engine-scope.ts::bindTree`

Records the engine handle that read a tree (`TreeEngineHandle`), so the wrap layer and `hydrateStored` can find it from the tree alone.

### `packages/common/src/engine-scope.ts::TreeEngineHandle`

The handle a parsed tree is bound to: an `EngineHandle` that also carries the engine's generated `hydrate`. Only `createEngine` binds trees, so only its handle needs it; a handle that only scopes factory calls (a validator's, a test's) has none. `hydrateStored` reads it, so a stored coordinate always hydrates and never falls back to the raw value.

### `packages/common/src/engine-scope.ts::hydrateStored`

A coordinate a built node stores, as the node every route returns: the coordinate's tree token selects the engine that read it, and that engine's generated `hydrate` reads and wraps it through the registry, so a built holder, a parsed holder and a query reach one object. Any other value passes through unchanged. A coordinate is refused rather than returned raw: one that holds no token (a copy, `assertHoldsTree`), one whose engine was disposed or whose tree was released (the message names the tree), and one read through an engine of another language. A factory resolves a list owner's read stub through it before sizing the list, the builder accessors through `hydrateStoredSlot` and `hydrateStoredSlots`, and a trivia reader through `hydrateTriviaEntry`.

### `packages/common/src/utils.ts::isNodeValue`

Whether a value is a node or a coordinate (`isNode` or `isCoordinate`): the one test every coercer, `isNodeOfKind` and `configFieldOr` ask, so a coordinate a built node stores is taken as the node it names wherever a node is.

### `packages/common/src/utils.ts::HydrateOne`

How one stored value becomes what an accessor returns: `hydrateWith` bound to a parsed node's tree and wrap, or `hydrateStored` for a built node.

### `packages/common/src/utils.ts::hydratedLists`

The list slots `hydrateSlotsBy` has already written back: each holds the frozen items an accessor returns, so a later call returns it as it is. Membership, not `Object.isFrozen`, marks them, since a built node may store a frozen array that still holds coordinates.

### `packages/common/src/utils.ts::hydrateSlotBy`

The one write-back for a single slot: the slot's value hydrated by `hydrateOne`, written back when it changed. The parsed and built accessors both go through it.

### `packages/common/src/utils.ts::hydrateSlotsBy`

`hydrateSlotBy` for a list slot: every item hydrated once, the slot then holding the frozen items (`hydratedLists`). A slot that holds one element rather than an array goes through `hydrateSlotBy`.

### `packages/common/src/utils.ts::hydrateSlotWith`

A wrapped node's single-slot accessor: `hydrateSlotBy` with `hydrateWith` in `role`.

### `packages/common/src/utils.ts::hydrateSlotsWith`

A wrapped node's list-slot accessor: `hydrateSlotsBy` with `hydrateWith`.

### `packages/common/src/utils.ts::hydrateStoredSlot`

A built node's single-slot accessor: `hydrateSlotBy` with `hydrateStored`, so a coordinate it stores becomes the node every route returns.

### `packages/common/src/utils.ts::hydrateStoredSlots`

A built node's list-slot accessor: `hydrateSlotsBy` with `hydrateStored`.

### `packages/common/src/tree-token.ts::registerTree`

Records the tree handle a parse made under the tree's token, so anything holding the token reaches the handle (`treeOf`). A weak entry: the handle lives exactly as long as the token, which every node of the tree holds.

### `packages/common/src/tree-token.ts::treeOf`

The tree handle of the parse a node was read from, through the token the node holds; `undefined` for a node that holds no tree (a built node, a draft, a copy that lost its token).

### `packages/common/src/query.ts::queryFacet`

Makes a parsed node's query facet, for a node with structure and for a leaf alike (a leaf's kind has no slots, and nothing lies below it): a Proxy over the node, its address, its kind and its tree, with one handler shared by every facet (`FACET`). It refuses a node that holds no tree or has no address, pointing at `$commit()`. The facet answers `$children`, `$descendants` and the accessor names in the kind's `querySlots` row, each with a new lazy view, and refuses any other string key except `then`. `then` and a symbol key read as `undefined`: an async function that returns a facet resolves its value by reading `then`, so refusing it would make that return reject. A slot named `then` would still read as its view. The facet cannot be written.

### `packages/common/src/query.ts::TreeQuery`

The two native query calls a tree handle carries: a batch of a descendant walk, and a plan evaluated over a list of addresses. `createNativeEngine` fills it on each parse's tree handle.

### `packages/common/src/query.ts::BATCH_LIMITS`

The limits a walk's successive batches take: 1, 4, 16, 64, then 256 for every batch after. The first result costs one minimal call, a full walk reaches large batches after four calls, and a terminal that stops early leaves at most one batch unused.

### `packages/common/src/query.ts::splitPlan`

Splits a view's steps into those the source runs before any node is hydrated (`early`) and those after (`late`). Declarative steps (`ofKinds`, `where`, `slice`) are early until the first opaque step (`filter`, `map`, `flatMap`); everything from there on is late, in order. Nothing moves past an opaque step: a callback receives each element's index, so filtering by kind or slot before it would renumber what it sees.

### `packages/common/src/query.ts::QueryView`

What `view` returns, typed loosely inside the module: the read-only array verbs over `unknown` nodes. Callers see it as `View<T>` from `@sittir/types`, which carries the node types; the module only needs the shape.

### `packages/common/src/query.ts::view`

A lazy sequence: a source (a slot's items, or a walk under a node to a depth) and its steps. It returns a plain object whose verbs close over those three values. There is no class, prototype or `this`, so a verb can be passed around detached. A verb that adds a step returns `view` of the same source with that step appended; a terminal runs the plan through `run` and hands the items to the matching module function. Every closure forwards in one line, so the logic lives in the module functions and is shared by every view. The cost is that each view allocates its own closures (about five times the heap of a class instance, and about six times the build time).

### `packages/common/src/query.ts::sliceStep`

The `slice` step, with its bounds counted as an array counts them: truncated toward zero, `NaN` as zero, a negative counted from the end.

### `packages/common/src/query.ts::ofTypeSteps`

The steps an `ofType` call adds. A kind id becomes one `ofKinds` step over every type a node of that kind can have (`membership.membersOf`: the kind, a supertype's members, a polymorph's arms, an enum kind's member ids), resolved once when the step is added, the test the language's `is.*` guards make; nothing restamps a node's type to pass it. A portable kind becomes an `ofKinds` step over the ids the language's portable rows give its path (`portablePathOf`), the same ids the portable guards admit. A path whose ids decide it (`exact`) needs nothing more; otherwise a `filter` step follows that reads each node, or bare kind id, through `readsAs`, the guards' own test, so `ofType` and the guards cannot disagree. The filter is opaque, so the steps after it run over hydrated nodes, and the kinds stay known for a later `where`. A path the rows do not hold, or a grammar without portable rows, gives an empty `ofKinds` step, which yields nothing without a native call. Anything else, a kind name passed by mistake among it, is refused at the call rather than read as an empty result.

The step holds its kinds as a set, which each route reads. Pushed into a walk, or run over the tree's own entries, it reads membership alone: those elements are the tree's, so of its language. Run over elements after an opaque step, which may have put anything in their place, it is the language's kind test (`kindTest`, from `kindTestOf`), the test the language's guards are built with, so an element of another language never passes, as for the guards, and a bare kind id does.

### `packages/common/src/query.ts::narrowed`

The kinds a node can have after one more `ofKinds` step: the step's set for the first step, then those of the earlier steps' set the step also holds, in the earlier order. An empty set means no node passes every step.

### `packages/common/src/query.ts::whereStep`

The `where` step. Compiles the condition when the step is added, so a malformed condition fails at the call: for each kind the earlier `ofKinds` steps allow when they are known, otherwise once against a recorder with no kind.

### `packages/common/src/query.ts::run`

Iterates a view. It splits the plan, runs the early steps over entries (a kind, an address and a way to hydrate) from the source, and hydrates only what survives them. It then runs the late steps over nodes. Being a generator, it stops pulling as soon as the consumer stops.

### `packages/common/src/query-holds.ts::slotItems`

The items a node's slot holds, read through its accessor: the accessor's value, called when it is a method, as an array (a single item wrapped, an absent one empty). The query facet's slot views and the portable guards read slots through it.

### `packages/common/src/query.ts::slotEntries`

The entries of a slot source. A slot's items are already read with their node, so the early steps run over them in memory, and `where` runs as one native call per kind.

### `packages/common/src/query.ts::walkEntries`

The entries of a walk source. The steps `pushdown` takes go into the native walk; the rest of the early steps run over each batch's entries, and a `where` among them makes one `planHolds` call per kind.

### `packages/common/src/query.ts::pushdown`

The leading run of `ofKinds` and `where` steps that can go into the native walk. Each `ofKinds` narrows the types the walk selects (`narrowed`), and an empty set is `'none'`, which yields nothing without a call. Plans are joined by `and`. A `where` goes native only when every kind its elements can have compiles it to the same plan; the run stops at the first step that cannot.

### `packages/common/src/query.ts::batches`

Calls the native walk repeatedly, with batch sizes growing along `BATCH_LIMITS`, resuming from the cursor each call returns. One batch of entries is yielded per call, so a terminal that has its answer makes no further calls. Each item of a batch becomes an entry by its shape: a coordinate through `entryOfCoordinate`, and the bare id of a node its read stores as a unit through `entryOfItem`, as a slot's item does.

### `packages/common/src/query.ts::find`

The `find` terminal: the first item the predicate accepts, or the first item when there is no predicate.

### `packages/common/src/query.ts::findIndex`

The position of the first item the predicate accepts, or -1. `some`, `every` and `includes` are built on it; `includes` compares by occurrence.

### `packages/common/src/query.ts::reduce`

The `reduce` terminal, as an array reduces. The initial value is passed as a rest list so that an explicit `undefined` initial value can be told apart from none; an empty view with no initial value is refused.

### `packages/common/src/query.ts::forEach`

The `forEach` terminal.

### `packages/common/src/query.ts::at`

The `at` terminal. A non-negative index stops at that item; a negative one must read the whole sequence to count from the end.

### `packages/common/src/query.ts::whereHolds`

Keeps the entries of a batch whose slots satisfy a `where` condition: entries are grouped by kind, the condition is compiled for each kind (`compileFor`) and evaluated natively over the group's addresses in one call. An entry that is not a parsed node has no slots to read and is refused.

### `packages/common/src/query.ts::compileFor`

The plan a `where` callback records for elements of one kind, cached per immutable `querySlots` table, callback and kind. The callback runs against that kind's recorder, so each slot it reads compiles to that kind's number for the slot, keyed by the kind; a kind lacking a slot the callback reads is refused there. Contexts sharing a table share plans, while equal numeric kind ids in different grammars never reuse each other's numbers or validation.

### `packages/common/src/query.ts::sharedPlan`

The one plan a `where` pushes down with a walk over several kinds: each kind's plan (`compileFor`) merged (`mergedAt`), or `undefined` when the kinds' plans differ in more than their slot numbers, and each batch then runs per kind.

### `packages/common/src/query.ts::mergedAt`

Plans merged position by position: equal values stay, arrays of one length and objects of one key set merge item by item, and the `slots` maps union, each kind keeping its own number; any other difference is a `CONFLICT`. The kinds' plans name disjoint kinds, so the union never overwrites a number.

### `packages/common/src/query.ts::CONFLICT`

What `mergedAt` answers for plans that differ in more than their slot numbers.

### `packages/common/src/query.ts::recorder`

What a `where` callback receives: a Proxy whose members are the accessors of a kind, each recording the slot's number in the kind's `querySlots` row, keyed by the kind (`SlotSubject`): a slot whose row names a keyword gets a presence member (`presenceRef`), any other slot a text member with `eq`, `match` and `is` (`slotFlagRef`, reading the kind's row of `querySlotFlags` for the slot). Each member of a known kind is named `<kind>.<slot>`, so a slot compared in the wrong form (a text on a boolean slot, a boolean on a text slot) is refused naming both, whether at the `where` call or when a view whose kinds were not known runs. The key `is` is the flag test (`flagRef`). Any other key, an assignment and a call are refused. A view whose element kinds are not yet known checks the callback at the `where` call against every accessor of the grammar (`everyAccessor`, each a `shapeRef`), recording no slot (`NO_SLOT`), so its shape is refused early and each kind's slots, and whether each takes a text or a boolean, when it runs. A pattern crosses as its source; a flag has no native equivalent and is refused rather than dropped.

### `packages/common/src/query.ts::slotsOf`

A kind's query slots by accessor, each its subject (its number keyed by the kind) and the keyword its row names (`undefined` for a text slot), read once per table and kind.

### `packages/common/src/query.ts::everyAccessor`

Every accessor of the grammar, for the check a `where` runs before its view's kinds are known.

### `packages/common/src/query.ts::flagRef`

A recorder's `is`: for a known kind, the plan its row of `queryFlags` gives the flag; a flag the kind does not declare is refused naming the kind, and a flag whose row is `null`, one that depends on the node's context, is refused naming both. Before the view's kinds are known it checks only that some kind of the grammar declares the flag (`everyFlag`), recording no plan (`ALWAYS`), and each kind's compilation decides when the view runs, as the slot members' shape check does.

### `packages/common/src/query.ts::everyFlag`

Every flag some kind of the grammar declares, for the check a `where` runs before its view's kinds are known.

### `packages/common/src/query.ts::slotFlagRef`

A text slot's `is`: the slot's entry in its kind's row of `querySlotFlags` (generated by `slotFlagsOf`). The entry's `types` record an `is` leaf over the slot, which holds when a value the slot holds is of a kind that always carries the flag: a membership test the native walk runs on the id the read stores for each value, kind-id leaves included, with no text compared at run time. Its `kinds` record a `child` step over the slot whose condition holds on a node that is one of those kinds and passes that kind's own plan for the flag (`carriedBy`). The two combine by `or` (`anyOf`). A flag with no entry is refused naming the slot, and one whose entry is a refusal is refused naming the kind whose context decides it.

### `packages/common/src/query.ts::anyOf`

The plan that holds when one of `plans` holds: the plan itself when there is one, `or` over them otherwise.

### `packages/common/src/query.ts::carriedBy`

The condition, run on a node a slot holds, that the node is of `kind` (an `is` leaf on the node itself) and passes the kind's plan for `flag` from `queryFlags`. The guard comes first because the kind's plan names slots by that kind's numbers: on a node of another kind its leaves read nothing, and a negation among them would hold. Both tables are generated from one set of flag plans, so a kind the slot table lists without a plan in `queryFlags` is refused as a mismatch.

### `packages/common/src/query.ts::shapeFlagRef`

A slot's `is` in the check a `where` runs before its view's kinds are known: some kind's slot of that accessor must list the flag (`everySlotFlag`), and the check records no plan (`ALWAYS`); each kind's compilation decides when the view runs.

### `packages/common/src/query.ts::everySlotFlag`

Every flag some kind's slot of one accessor lists in `querySlotFlags`, for the check a `where` runs before its view's kinds are known.

### `packages/common/src/query.ts::ALWAYS`

The plan that always holds (`and` over no plans), which the shape check records for a flag.

### `packages/common/src/query.ts::NO_SLOT`

The subject of a slot recorded before its view's kinds are known: it numbers no kind. Only the shape check records it, and its plan is never run.

### `packages/common/src/query.ts::shapeRef`

An accessor's member in the check a `where` runs before its view's kinds are known: it takes `eq` of a text or a boolean, `match`, and `is` (`shapeFlagRef`), and refuses any other argument. Whether the slot takes a text or a boolean is left to each kind's compilation when the view runs. A view narrowed by a type-guard `filter` has a static element type the recorder's type already checks, but no run-time kinds, and one accessor can be a boolean slot in one kind and a text slot in another (typescript's `type`), so a grammar-wide choice would refuse a query its type accepts.

### `packages/common/src/query.ts::presenceRef`

The member of a slot that holds a keyword's presence. `eq(true)` records a presence leaf over the slot, and `eq(false)` its negation, so the leaf carries no boolean. A text, and `match`, are refused with a message naming `eq(true)` and `eq(false)`, never compiled to a text leaf that would match the keyword's spelling.

### `packages/common/src/query-holds.ts::holds`

The JavaScript evaluation of a plan over what its `PlanSubjects` read: the texts, the node types for an `is` leaf, and the child subjects for a `child` step. A presence leaf (`present`) holds when its subject reads any text: a child sits in the slot. A `child` step keeps the nodes its slot holds, narrows them by its anchor (`anchored`), and holds when its condition holds on one of them, evaluated with that child as the node. It is the oracle the native evaluator is tested against, and the only evaluator of a portable read test's plans, whose subject may be the node itself.

### `packages/common/src/query-holds.ts::PlanSubjects`

What a caller of `holds` reads for a node: the texts a subject holds, the node types (`$type`) it holds, and the subjects of the nodes a slot holds. A caller that reads no types or no children leaves them out, and an `is` leaf or a `child` step is refused there (`NO_TYPES`, `NO_CHILDREN`).

### `packages/common/src/query-holds.ts::NO_TYPES`

The node-type reader of a caller that reads none: an `is` plan is refused there rather than read as holding nowhere.

### `packages/common/src/query-holds.ts::NO_CHILDREN`

The child reader of a caller that reads none: a `child` step is refused there rather than read as holding nowhere.

### `packages/common/src/query-holds.ts::anchored`

A slot's nodes as an anchored step reads them: the first, the last, the one node when it holds exactly one (none otherwise), or all of them. The portable read tests' `via` steps and `holds`'s `child` step both narrow by it, as the native child step does.

### `packages/common/src/query-holds.ts::refuse`

Throws a query refusal as a `TypeError` with the message given. The query facet and the evaluator refuse through it alike.

### `packages/common/src/query-holds.ts::module`

The query plan evaluator and the slot reader it shares with the portable classifier, kept apart from the query facet so that a module a language descriptor loads (the portable guards) reaches no engine runtime.

### `packages/common/src/engine-scope.ts::inTreeEngine`

Runs a call inside the handle of the engine that read a tree, or plainly when the tree is bound to none. Every wrap of a read node goes through it, so a child hydrated long after the parse returned, outside any engine call, is stamped with the reading engine.

### `packages/common/src/engine-scope.ts::currentHandle`

The handle in scope, or `undefined` outside any engine call. A node built with none has no engine.

### `packages/common/src/engine-scope.ts::isLive`

Whether a handle's `current` is a live engine rather than an identity, told by the presence of a `render` member.

### `packages/common/src/engine-scope.ts::hydrateOn`

A value as an accessor of a node of a tree returns it, through the generated `hydrate` of the engine the tree is bound to (`hydrateWith` with the grammar's wrap): node data is wrapped as its kind's node, and anything else passes through. A tree bound to no engine returns the value as it is. `hydrateStored` reaches the same `hydrate` from a coordinate's own tree token; this takes the tree from the caller, for data that names no tree, such as a trivia entry written into a tree's table.

### `packages/common/src/engine.ts::createRenderHandle`

A lazily rendered text: the render runs on first use and its text is cached. `save` writes through the native file path when the engine offers one, else writes the text. Disposing drops the cached text; any use after that throws `rendered text disposed`.

### `packages/common/src/engine.ts::NativeEngineDiagnostics`

The public `EngineDiagnostics` fixed to the native engine's types (a root that carries the whole-file span, a `TreeHandle`). Reached through `SittirEngine.diagnostics` rather than the engine's own surface, because it returns raw read data, nodes holding a coordinate for each child past the read's depth; the public entry point is `parse`, which wraps what these produce.

### `packages/common/src/engine.ts::depthOf`

The level count a native read takes for a set of parse options: one by default, else the options' `depth` (`Infinity` reads the whole tree). The parse reads its root at that depth and caches the root under it, so `depth` has one meaning at the boundary.

### `packages/common/src/engine.ts::nativeLanguageEngine`

Adapts one grammar's native engine to the language hooks' native engine shape, the same for every grammar. `render` passes the call's flat options as the render options the native engine resolves over its own, and none when the call has none or an empty object. `parseAndRead` returns the native read untouched; the engine that owns the result binds its tree. `buildProfile` is the native build's compile profile.


### `packages/common/src/delimiter.ts::Delimiter`

The bitflag encoding of a separated list's optional flanks: the wire's `_delimiter` key and a list factory's `delimiter` option. `Leading` and `Trailing` are one bit each, `Both` is their union and `None` is zero. Mandatory flanks are template text and never encoded, so a list slot admits exactly the members for the flanks its grammar makes optional. The values are the same for every grammar, so this is the only declaration: generated code, the codegen render-options emitter and tools all import it from `@sittir/common/utils`. It is written as a `const` object with a type and a type-only namespace of the same name, so `Delimiter.None` works as a value and as a type without a TypeScript `enum`.

### `packages/common/src/source.ts::Source`

Where a node came from, the value of its source stamp as `sourceOf` reports it: `Ts` for a node read from a tree-sitter parse, `Sg` for the ast-grep read path, `Factory` for a node a builder made. It is stamped once, where the node is created: by the reader (`holdReadTree`), by the builders (`stampBuilt`), and onto a validator's copy made by string keys (`carrySourceStamp`). An edit keeps it (`$with` and `detachCoordinate` drop only coordinates), and so does a spread copy, so it records the node's origin, not whether it still holds a live tree handle. A node carries no `$source` member; `sourceOf` is the one read path. Rust's `enum Source` in sittir-core mirrors the values. The object `satisfies` a record of `HoldsSource`'s member type, so the type-level `0 | 1 | 2` union there stays the one declaration of the values.

### `packages/common/src/utils.ts::isNode`

Whether a value is a sittir node, built or read: an object with a numeric `$type` that holds a source stamp (`sourceOf`) or a tree token (`treeTokenOf`). Nothing structural counts: storage (`_` keys), text, `$_layout` or a `$source` key make no node, so a factory config, a JSON copy or a string-key copy of a node is not one. It is the run-time side of the fact the types admit by (`NodeMarker`), so the two cannot disagree. A spread copy keeps the stamp, which is an enumerable symbol member. `isNodeValue` adds coordinates.

### `packages/common/src/utils.ts::isParsedNode`

A node a read produced (`isRead`). It holds before the read root is wrapped and after the node is edited, since both carry the read; its provenance (`sourceOf`) is `Source.Ts` or `Source.Sg`.

### `packages/common/src/utils.ts::isFactoryNode`

A node that did not originate from a parse. It is defined as the complement of `isParsedNode` among nodes, so the two never disagree; every generated builder stamps `Source.Factory` (`stampBuilt`).

### `packages/common/src/runtime.ts::module`

The runtime helpers generated code calls, exported through `@sittir/common/utils`. `bindRuntime` is the one piece that depends on a grammar; every other helper here is grammar-free and generated code imports it directly.

### `packages/common/src/runtime.ts::NamespacePart`

One member (`Node` or `Loose`) of kind `K`'s namespace in a grammar type map; `never` for a key the map does not have.

### `packages/common/src/runtime.ts::GrammarRuntime`

The runtime a grammar binds, one generic signature per guard over its type map:
- `isNode`'s kind-parameterised overload narrows to `Extract<Node, AnyUntypedNode>`, not `Node`: the namespaces carry keyword kinds whose `Node` is the bare id, and an id is never node data, so with the plain `Node` the predicate would contain numbers and stop narrowing ids away in every `coerceTo*` `isNode(input)` check.
- The node members (`$render`, `$trivia`, `$engine`) are written in each node's literal by the factories and wraps, typed by the map's trivia union. A node built inside an engine's scope renders, edits and takes trivia through that engine; one built outside any scope carries no engine and refuses each of those.

### `packages/common/src/runtime.ts::bindRuntime`

Binds the runtime to a grammar's type map. `isNode` is the shared implementation, retyped by the map; the runtime has no facts of its own, because a node's trivia facts come from its engine. Emptiness is a guard on the engine, which knows the kinds with an inner side.

### `packages/common/src/runtime.ts::rejectBareText`

`rejectBareText(value, where, expected)` is the bare-text refusal a `'runtime'` engine's structure verifier makes for a node-only slot (no builder calls it): a string or a bigint throws `<where>: a strict factory takes a built node, not a string; expected <expected>, or use .coerce` (naming which it was). Arrays are checked element-wise and every other value passes through unchanged. A number passes, because a slot that also holds fixed-text kinds stores their kind ids as numbers and the guard cannot tell a kind id from a scalar; where the slot holds no such kind, the native render refuses the number, naming the slot (`renders from a node, not a kind id`). A bigint is never a kind id, and the native node would drop it without a word, so it is refused here. The loose surface (`.coerce`) is where text becomes a node. A slot that stores only kind ids (a kind enum with no node value) takes no guard: its strict input is one of its declared fixed values, not a leaf's text, so `coerceKindEnumStorage` maps a matching string to its id.

### `packages/common/src/verify-structure.ts::verifyStructure`

`verifyStructure(value, table, seen)` checks a built node against the facts its generated types prove: each kind's row in the language's structure table (`StructureRow`). A required slot holds a value (`Missing required slot '<slot>' on <kind>`), a non-empty list holds an item (`<label>: requires at least one element`, an absent list included), and a node-only slot holds no bare text, through `rejectBareText` so the message is the builder's. It walks depth-first through every slot value that is an object or an array, so a node is checked wherever it sits. It checks the node it is given whatever wrote it, and below it only the nodes a builder wrote: those whose source stamp is `Source.Factory` (`sourceOf`), and those a `$with` rebuild returned (`isRebuilt`), since a rebuild of a read node writes its slots but keeps its read provenance, from whichever engine ran it. A coordinate or an untouched read node it holds is the reader's shape, checked when it was read. A node joins `seen` after it and everything under it pass, so one engine's per-engine set walks each built node once, and a refused node is refused again on the next walk. An engine in `verifyStructure: 'runtime'` mode runs it on the result of each top-level build and rebuild; in the default mode nothing calls it, and the native decode refuses a malformed node at render.

### `packages/common/src/verify-structure.ts::checkInput`

`checkInput(row, args, declared)` checks the arguments a builder was called with against the kind's row, where `verifyStructure` checks the node that came out, because a built node holds neither a key the kind does not declare nor an item the builder dropped. `declared` is the config keys to check against and defaults to the row's own `config`. A refine form writes a node of its parent kind with its own narrowed config, so it passes its own key list: the parent's row would refuse the form's valid keys. When the keys are checked, a plain-object first argument whose key is outside `declared` and does not start with `$` throws `<kind>: undeclared config key '<key>'`. The list check reads the items the coercer would use: a spread coercer splits its leading options first and then unwraps a single array or keyed config, so the check does the same. Checking the container first would let `statementBlock.coerce({}, [statement, null])` drop the `null` before the raw builder could see it. Each `lists` entry that does not admit holes is read with `listInput`; an `undefined` or `null` item throws `<kind>.<property>: absent item at index <i>`. A list that admits holes is skipped. Input of any other shape (a string, a node, a coordinate) is not a config and passes.

### `packages/common/src/verify-structure.ts::isConfigInput`

A plain object that is not an array and not a node value. Only such an input has keys a config check can read.

### `packages/common/src/verify-structure.ts::listInput`

The items of one list-valued input, read from a builder's arguments for the list's arrival. A `'key'` arrival reads the array under the list's slot name in the config (the first argument), or nothing when the config holds no array there. A numeric arrival is a spread builder's rest arguments: a single array argument is the list; a single config holding the slot name supplies its value, wrapped as one item when it is not an array; otherwise the arguments are the items. A leading options object before the rest is skipped, unless the single argument is itself a keyed config.

### `packages/common/src/runtime.ts::strictBooleanStorage`

A strict builder's storage for a boolean-keyword slot: bare text (a string or a bigint) is stored as given, so a `'runtime'` engine's verifier refuses it as `a boolean` and the native decode refuses it at render. Every other value stores as `coerceBooleanKeywordStorage` stores it. The loose surface stores keyword text through `coerceBooleanKeywordStorage` itself, so `'mut'` still reads as `true` there.

### `packages/common/src/runtime.ts::rejectKeywordText`

`rejectKeywordText(value, where, word, keywords)` throws `<where>: '<text>' is this slot's keyword` when the value is a word-kind node (`$type === word`) whose `$text` is one of `keywords`. Arrays are checked element-wise and every other value, including another leaf kind with the same text, passes through unchanged. The loose surface never reaches it with a keyword spelling, because its keyword extraction stores the arm's kind id first.

### `packages/common/src/runtime.ts::admitAliasContent`

The runtime half of `aliasContentAdmission`: it maps arrays element-wise, reads a value's id from its `$type` (or the value itself when it is a stored kind id), and builds the alias for the first row whose ids contain it.

### `packages/common/src/runtime.ts::coerceMixedEnumStorage`

Storage for a slot that holds either a fixed text's kind id or a node: text in the slot's table becomes its id, any other text is kept, and a node whose `$type` is one of the table's ids becomes that id. A list slot maps its items through it with `listStorage`.

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

Whether a value is a node of one kind id, a coordinate of that kind included (`isNodeValue`). It answers a boolean and never narrows. Narrowing an argument typed as a union that holds a node's `.Bound` beside its storage type filters the members against each other, and that comparison exceeds the checker's depth on deeply nested grammars; a caller that already knows what it will do with a hit casts once instead.

### `packages/common/src/utils.ts::configFieldOr`

The value of the key `key` when the input is a config object (not a node, not an array) that carries it, else `orElse()`. An empty object is a config too, one that leaves the slot out (`undefined`), never the slot's content: `build.parameters({})` is `build.parameters()`. The fallback is a thunk so it runs only when no config was given, which keeps a bare-input refusal from firing for a config. It takes and returns `unknown` for the reason `isNodeOfKind` never narrows: the `in` and `!isNode` narrowing it replaces relates the members of a `.Bound`-bearing union. A coordinate is a node value, never a config (`isNodeValue`).

### `packages/common/src/utils.ts::orDefault`

The value, or the default's when it is absent. The default's type is not an inference site (`NoInfer`), so the result is the value's own type and the checker never reduces the value's union against the default's, which is what a `??` expression does and what exceeds the depth on a union that holds a node's `.Bound` beside its storage type.

### `packages/common/src/runtime.ts::hoistAs`

`hoistRoutes` with the result type given and the argument taken as `unknown`, so a bundle entry is hoisted without relating the overlay's declared type to the pair type the hoister would infer. The generated `factories/index.ts` uses it for every entry.

### `packages/common/src/utils.ts::LIST_VIEW_MEMBERS`

The names a list node takes from `ReadonlyArray`: its non-mutating methods and `length`. `toString` and `toLocaleString` are not among them; every object already has them. A compile-time check keeps the method list equal to `ReadonlyArray`'s own, so the runtime cannot miss a method the type promises. The emitter refuses a list whose accessors or options take one of these names.

### `packages/common/src/utils.ts::isGroupConfig`

Whether a value is a group's config object rather than a node: a non-empty plain object without a `$type` whose keys are all among the group's config keys. The overlay factories, the elements setters (`elementsWith`) and the list-slot setters share it, so a config object means the same thing on every surface.

### `packages/common/src/node-data.ts::treeHandleOf`

The handle a node's coordinate names it by (`$_layout.at.$treeHandle`), which packs its tree and its descendant index; `undefined` for a node with no coordinate. The fold uses it to decide a node still names its tree and emits it as the coordinate's `$treeHandle`; the generated wrap uses it to recognize a node that arrived as a coordinate.

### `packages/common/src/node-data.ts::sourceHandleOf`

The handle a node names its tree by: its coordinate's, or, for a node an edit rebuilt, the one its carried source identity names (`placeOf`). `undefined` for a node no read gave, built or detached. A query addresses a node by it (`nodeAddressOf`), and the native render passes the tree it names, so a parsed tree's inferred options layer under a render of it or of an edit of it, and a built node gets the engine's alone.

### `packages/common/src/node-data.ts::unitSidesOf`

The sides of a node's unit children, by slot and item (`NodeLayout.units`): the ones it holds, else its live tree's for a parsed node, else those of the node it was rebuilt from (`placeOf`), carried to the items the rebuild moved them to (`carriedUnitSides`). The render fold and `$snapshot()` both take a node's unit sides from here; the native side imports none, so a node that sends none has none.

### `packages/common/src/node-data.ts::slotsOf`

The stored layout of a node's list slots (`NodeLayout.slots`): the ones
it holds, else its live tree's for a parsed node, else those of the node it
was rebuilt from (`placeOf`), which apply to every gap of the slot, kept or
inserted. A detached crossing and a snapshot of a built node carry them as
data, since neither leaves the render a tree to measure them from.

### `packages/common/src/node-data.ts::separatorOf`

The separator a node's source spells before it as a list item, where it is
not the one its slot renders (`NodeLayout.separator`): the one it holds,
else its live tree's for a parsed node, else that of the node it was rebuilt
from. A detached crossing stamps it, and a live crossing keeps a held one,
on a node whose neighbour before is unchanged; otherwise the node takes its
new list's separator.

### `packages/common/src/node-data.ts::carriedUnitSides`

A rebuilt node's unit sides, carried from the node at `index` of the tree it was rebuilt from: the tree's records for that node, realigned against what the tree reads there (`realignedUnits`).

### `packages/common/src/node-data.ts::itemIdentity`

What a slot item is the same item by across a rebuild: a unit by its kind, a read node (or one rebuilt from a read node) by the handle it names (`sourceHandleOf`), and a built node by itself, the object a rebuild that keeps it passes on. So a revived list's kept statements anchor its units' sides as a parsed list's do: a comment on a `;` stays with the `;` after the statement it followed, not with the first `;` of its kind.

### `packages/common/src/node-data.ts::alignedItems`

The new position of each source unit a rebuilt slot keeps, in time and memory linear in the two slots. The nodes both slots hold anchor it, each by its identity (`itemIdentity`: a read node by the handle it names, a built node by itself): a unit is the unit of its kind at the same count in the run of units after its anchor (the last kept node before it, at that node's new place, or the slot's start). A unit no run places pairs, in order, with a unit of its kind nothing placed, so two different units that swapped places both keep their sides. A node needs no alignment, since it frames itself with its own sides.

Identical units align by order within a run: nothing tells two units of one kind apart, so removing or reordering identical units among themselves keeps their sides by position, not by the unit the caller meant. Removing the first of two commented `;` units keeps the first unit's comment on the `;` that remains.

### `packages/common/src/node-data.ts::KindView`

How the crossing tells kinds apart. `isWrapper`: whether a kind id is one a rebuild constructs around an existing node (`TriviaFacts.rebuildWrappers`), which `evidenceOf` asks before looking through an entry. Every caller names its view: the engine's render passes the grammar's facts, and data with no such kinds (a test's hand-written nodes, a probe's data) passes `PLAIN_KINDS`, which answers no for every kind. There is no default, so no caller can skip the grammar's view by leaving it out.

### `packages/common/src/node-data.ts::detachCoordinates`

Drops the pre-edit spelling and the coordinate that would slice it from every node that holds storage, in place, for data that reached a render by a path other than `toNodeData`. A coordinate that survives, on a text leaf or a node past the read's depth, names that node in its tree, so the bytes around it are the node's own layout: the root's edge flanks are read from them as from any read coordinate.

The result holds no tree: the hold is removed from every node and trivia entry, while a surviving coordinate keeps its `$treeHandle` and `$span`. `toNodeData` refuses a coordinate that holds no tree, so a caller that still renders the detached data gives it the tree again with `holdTree`, and the data then renders for as long as it is held.

### `packages/common/src/utils.ts::describeValue`

A value as the text of a refusal message: a string as itself, anything else as JSON (a bigint as `<n>n`), falling back to `String` (a node writes its text) when it cannot be serialised, and to the object's tag when that throws, as a built node with no engine does, so a refusal message never throws itself. Generated pattern guards use it so a node or object that reached a text slot prints as what it was, not `[object Object]`.

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

### `packages/common/src/utils.ts::queryOf`

What a parsed node's `$query` runs: the query facet its engine makes for it. It takes the engine handle the node captured when it was wrapped, and refuses once that engine is disposed, since the tree's reads go through the engine that parsed it.

### `packages/common/src/utils.ts::rebuilt`

What every `$with` setter runs its rebuild through. It runs the rebuild inside the node's own engine (or plainly, when the node has none), stamps the node the rebuild returns as rebuilt (`markRebuilt`), and hands it what it keeps of the source node: that a read produced it (`carryRead`), its source identity (`carryPlace`), through which the sides it does not hold are its source's (`sideOf`; the render fills them from the table through `$_layout.sides`), a built source's stored trivia, and the unit sides it holds, realigned to the new slots (`carryUnitSides`). It gives each fresh node the rebuild minted in a slot the source node held the same (`carryRebuiltSlots`). Inner comments can only travel to a node that is still empty: once the rebuild gives the node a child, a comment would sit beside it, so the call throws and names the kind. Inner layout alone (whitespace and depth members, which cross as bare kinds) spelled the inside of the empty node, so a node that gains a child takes an empty inner side in its place: `{\n}` takes its first statement as `{}` does. A rebuild inside an engine returns through the handle's `settle`, so a `'runtime'` engine checks the edited node's structure, read node or built.

### `packages/common/src/utils.ts::triviaSide`

`node.$trivia.leading(...)` and `.trailing(...)`: with items it replaces that side and returns the node; with none it returns the entries the side holds (`sideOf`). An item is a trivia node, a whitespace kind id, or text, which is a whitespace kind when spelled exactly so and a comment otherwise. It needs the node's engine for the grammar's trivia facts. A parsed node's side is its tree's trivia table's, so a read returns the comments and the stored line layout the table assigns it, and a write lands in the table (`triviaWriter`), where any route to the node reads it back and the render frames the node with it. A writer that keeps a side's entries reads them and writes them back with its addition.

### `packages/common/src/node-data.ts::holdReadTree`

`holdTree` for the objects a read returned, the one place that records read provenance: every object it visits also counts as read (`isRead`), and is stamped `Source.Ts` (`stampSource`), so it stays a node after an edit drops its tree token. The engine's read sites call it; a caller that re-holds a copy calls `holdTree`, so the copy holds the tree without counting as read. Provenance lives in a weak set rather than a member, because a spread copies members: a copy built with different trivia must not inherit a fact about the object it was copied from.

### `packages/common/src/node-data.ts::carryRead`

Carries read provenance from a read object to the object rebuilt from it, which is the same node in another shape. The wrap's `wrapNode` carries it to every wrapped node, and the validator's `materialize` carries it to every plain node it resolves. Every other copy is not read.

### `packages/common/src/node-data.ts::markRebuilt`

Stamps the node a `$with` rebuild returned (`rebuilt` calls it), and `isRebuilt` reads the stamp. Read provenance alone cannot tell an edited read node from an untouched one, since the rebuild carries it (`carryRead`); the stamp is what tells `verifyStructure` that a builder wrote this node's slots, so a parent built in `'runtime'` mode checks it even when another engine ran the rebuild.

### `packages/common/src/node-data.ts::changedEdges`

Which edges of a list item face a neighbour other than the one its source had there. A stored layout run spells the gap between a node and one particular neighbour, so it holds only while that neighbour is still there; otherwise the seam decides the gap (`$_layout.changed`, where the node's sides drop their edge runs). An edge changed when the item beside it in the rebuilt list is not the sibling its source had there (`siblingsOf`, judged by tree and span through `keepsNeighbour`), or when the source had one there and the list has none. An item with no source identity, or whose tree is gone, has no changed edges. The item is judged by the node that stands for it (`evidenceOf`): a rebuilt wrapper has no source of its own, so the node it holds is the one measured, and the changed edges ride on that held node as it crosses, not on the wrapper.

### `packages/common/src/node-data.ts::toDetachedNodeData`

The native node for data leaving the tree it was read from, such as a render fixture's input. It is the same walk as `toNodeData`: each entry's changed edges and the bearer a rebuilt wrapper's edges pass to are judged the same way, so a detached render lays out what a live render of the same data does. The difference is that no node crosses as its coordinate: every node crosses as its storage, with its sides as data (`sidesOf`), and trivia coordinates are not asserted to hold their tree, because the caller turns every range into the text it names before the data leaves.

### `packages/common/src/node-data.ts::toNodeValue`

The walk behind `toNodeData` and `toDetachedNodeData`. A parsed node of a live tree, and a coordinate a slot stores raw, crosses as its coordinate (`coordinateCrossing`) with the edges whose neighbour changed; the render frames it with the sides its tree's table gives it, and reads it into its native node when a write lies in its range. Detached, a raw coordinate crosses plain, and every other node as its storage. A built node crosses as its storage with the trivia it holds, names the node it was rebuilt from for the sides it does not hold (`$_layout.sides`), and names its changed edges (`$_layout.changed`) when it has sides for them to touch. A node that already holds `slots` or a `span` in its `$_layout` crosses with them: data a tool detached from its tree keeps the layout facts the tree would have given. A node crosses with the changed edges its holder judged only when it bears them (the entry itself, or the node a rebuilt wrapper holds, `evidenceOf`); a list node's edges are its holder's like any other node's. An alias envelope's content crosses without sides, which its envelope holds (`envelopeKindOf`). A node's source stamp does not cross: it is a symbol member, and nothing native reads it.

### `packages/common/src/node-data.ts::evidenceOf`

The node whose source identity stands for a list entry. A rebuild constructs some wrappers afresh around the one node they hold (an alias envelope, or a kind enrich mints, such as rust's `_attributed_parameter` around each parameter), so the entry itself has no source; the node it holds does. Two conditions, one per fact:

- the entry's kind is one the view says a rebuild mints around one node (`KindView.isWrapper`), a classification stamped per grammar, never guessed from slot names;
- the entry holds exactly one present node in its slots. Slots it leaves empty do not count, so a group whose optional slot is unfilled is still looked through; one holding two nodes is not. Its unslotted children (`$other`) never count.

An entry with its own source identity is its own evidence. Adjacency is judged on these nodes on both sides of a gap.

### `packages/common/src/node-data.ts::placeOf`

Where a node sits in its source: a read node's own tree token, tree handle, end, span and stamped kind, or, for a node an edit rebuilt, the identity the edit carried forward from the node it replaced (`carryPlace`). It is evidence of layout only: an edited node never slices, but its missing sides are its source's (`sideOf`, `$_layout.sides`) and it can be judged adjacent to its neighbours. The identity is kept under a private, non-enumerable symbol, so it never reaches the wire and a spread copy never inherits it; `$span` stays the public fact of a node whose text is its source's.

### `packages/common/src/utils.ts::carryRebuiltSlots`

For each storage slot of a rebuilt node whose value the rebuild minted afresh, where the slot held a read node of the same kind before: the fresh node takes that the read produced the old one (`carryRead`) and its source identity (`carryPlace`). Only the kinds a rebuild constructs around existing nodes count (`TriviaFacts.rebuildWrappers`), and the list kinds (`TriviaFacts.listKinds`), which a list slot's `$with` rebuilds from its items: the fresh list stands for the list it replaces, so it takes that list's sides and its slots' stored layout (`$_layout.sides`). Where the old wrapper was built (a revived node's, with no source identity), the fresh one takes what it held instead: its stored trivia, and its unit sides realigned to the fresh slots (`carryUnitSides`), so a setter that rebuilds a revived list in place keeps the list's comments and its units'. A node the caller built and passed in, of another kind or already carrying source, is left as it is.

### `packages/common/src/utils.ts::NodeAddress`

How a query names a parsed node to the native side: by the handle its coordinate names it by. The native `query::Address` accepts this shape.

### `packages/common/src/utils.ts::nodeAddressOf`

A node's `NodeAddress`: its `sourceHandleOf`. `undefined` for a node no read gave.

### `packages/common/src/utils.ts::triviaInner`

`node.$trivia.inner(...)`: the inner side of a kind that has one (`TriviaFacts.innerKinds`). It writes only to an empty node (`isEmptyNode`: a comment beside any child has that child to lead or trail) and refuses a kind with no inner side. A parsed node's inner side is its tree's table's, as its other sides are.

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

### `packages/common/src/node-data.ts::isSlotKey`

Whether a key names one of a node's slots (`_<name>`). Slots are a subset of storage (`isStorageKey`), which also includes the node's unslotted children (`$other`): the anonymous tokens a read keeps, such as a list's separators. A question about the nodes a node holds in its slots counts slots only, so these tokens never count as held nodes. That covers a list node's items (`listItemsOf`) and the one node a rebuilt wrapper stands for (`evidenceOf`). `holdsSlots` and `isStorageKey` are built on it.

### `packages/common/src/node-data.ts::isDataKey`

Whether a key carries node data across the native boundary: a storage key (`_<slot>`, `$other`) or a `$` metadata key that is not a member (`$with`, `$trivia`, `$engine`, `$render`). A reader, a list index, `length` and a list option are members and so are not data. The boundary projection and every walker that visits a node's keys select by this, and read only the keys it selects, so a member that throws when read is never read.

### `packages/common/src/runtime.ts::listStorage`

A builder's storage for a list slot: a new array of the input's items, each stored through `item` (the slot's coercion, or as given); a value that is not an array is stored through `item` alone. An absent item (one `item` stores as `undefined`) is dropped, except in a list whose element admits a hole (`holes`, the model's `hasOptionalElements` stamp, passed by the emitter): there an `undefined` or `null` item is kept as a hole at its position, so `[a, , b]` builds three positions. The builder owns the array it stores, so a caller mutating its own array after the build changes neither the node nor its render, and a `'runtime'` engine's check of the node holds for its life.

### `packages/common/src/runtime.ts::kindIdStorage`

A strict builder's storage for one kind-enum or mixed value: absent stays absent and a kind id stays itself (a list slot maps its items through it with `listStorage`). It reads no text: a string passes through unchanged and the slot's refusal (`rejectBareText`, naming a kind id or the built node the slot holds) rejects it. The loose coercers keep `coerceKindEnumStorage` and `coerceMixedEnumStorage`, whose tables map text.

### `packages/common/src/utils.ts::LIST_READ`

The key a wrapped list node keeps the reader of its items under. The items are not read when the node is wrapped: the first read of any list member calls this reader, and `listItemsOf` keeps the result under `LIST_ITEMS`. A built list holds its items from the start and has no reader.

### `packages/common/src/utils.ts::listItemsOf`

The items of a list node: the ones it holds under `LIST_ITEMS`, or, for a wrapped list, the ones its `LIST_READ` reader hydrates, kept on the first read.

### `packages/common/src/utils.ts::storedElements`

The elements a list stores: its array, or the one element it holds, or none. The reader stores a lone element as a single node, which counts as one.

### `packages/common/src/utils.ts::ownerView`

What a list owner knows of the list it holds, read once when the owner is built: the list itself, and its stored elements. An owner normally holds the list node already read, with its elements as stubs. A list stored only as a read stub (a parent handle and a child index) carries no count, so the owner's `hydrate` reads it. A wrap passes its own `hydrateChild`, the path its accessors take, so the list arrives wrapped, with its children seated in the model's slots, and `count` names a model slot whatever key the parser gave the items. Without a hydrator (a factory) the elements are unknown and the owner cannot count them.

### `packages/common/src/utils.ts::ownerElements`

The elements a list reads through its own reader, none for an absent list. An owner's items are these elements, collapsed through `listItems`.

### `packages/common/src/utils.ts::listOption`

A list option an owner reads from its list's stored `_<option>`, or the option's default. The value is read when the owner is built.

### `packages/common/src/node-data.ts::slotSeparatorOf`

The separator a list writes between its items, as a grammar id: its live tree's for a parsed list (its slot's stored separator where its source's gaps differ from what the read-time options render, else the one those options render, which also answers a list with no gap to measure), else that of the list it was rebuilt from. Rebuilding a list with this separator reproduces its source's separators, since the stored separator is the majority of its gaps.

### `packages/common/src/utils.ts::defineListSeparator`

Defines the `separator` of a wrapped list or list owner as a shared, non-enumerable getter, one function per owner accessor: the list's own stored `_separator` when it has one, else the separator its tree answers (`slotSeparatorOf`). It is a getter because the tree's answer measures the list's gaps and records its render, which a wrapped list pays on first read, not at wrap time. An owner names its list accessor and answers the `separator` of the list that accessor returns, whatever that list is (parsed, or built with or without its own separator), so an owner never disagrees with its list; a list defines it on itself.

### `packages/common/src/utils.ts::defineListIndices`

Defines the index positions of a wrapped list or list owner: one getter per position, shared by every wrapped list and not enumerable. A wrapped owner's items are unread until first use, so an index must hydrate them on demand, and a per-node getter would force dictionary mode; one shared getter per position reads the item through `listItemsOf` from whichever list calls it. The getters are the only getters a wrapped node carries, together with the `separator` getter of a wrapped list or list owner (`defineListSeparator`), which is shared in the same way.

### `packages/common/src/utils.ts::refuseReadStub`

The refusal of a raw factory given a list owner's storage that is a read stub, a parsed list that cannot be counted without its tree. A factory has no tree, and `engine.build` already refuses a bare stub, so the build throws naming the stub rather than carrying a node whose `length` or items cannot be read. A built owner's `length` is always plain data, so it keeps its fast shape.

### `packages/common/src/node-data.ts::spanOf`

The byte range of a parsed node in the source its tree was read from, or `undefined` for a node that was built. Internal: a node's position is not part of the public node type (`ParsedOf` declares no `$span`), and the range belongs to the version of the tree the node was read from, so after an edit it says nothing about the rebuilt node. Tools that slice source or report a line read it here; the bindings reader slices a pattern's source text by this range, so a definition keeps the exact bytes of its leading comments, and also reports the line from it.

### `packages/common/src/utils.ts::groupField`

The value a seated key reads: the group's own reader of that field, or `undefined` while the group is absent.


### `packages/common/src/reparse.ts::hostTemplateFor`

The host template that reparses a rendered kind: its own, its target kind's, or the best-priority reachable supertype's, with the gated hosts applying only to adopted variants. `applyHost` splices the text into `$r` and reports the offset.

### `packages/common/src/reparse.ts::applyHost`

Splices rendered text into a host template's `$r` hole and reports the hole's offset. When only whitespace precedes the hole on its line, every continuation line of the rendered text is indented to the hole's column, so a multi-line render stays a block of the same indentation in indentation-sensitive grammars. Given a parser for the host language, lines `lineStartsInsideTokens` finds on the unindented text are left where they are. The result also carries `at`, a non-enumerable map from an offset in the rendered text to its offset in the hosted text, which counts the indentation added to the lines before it.

### `packages/common/src/reparse.ts::lineStartsInsideTokens`

The offsets of the lines that begin inside a token spanning lines (a multi-line string or comment), or right after a token that ends in a line break with the next token starting at that very offset (a string's content continuing past an interpolation). Shifting such a line changes the token's content, so hosts leave it alone. One function serves both sides of a host: `applyHost` for rendered text and the derivation's render-form samples for source text.

### `packages/common/src/delimited-check.ts::checkDelimited`

Refuses a delimited composite whose content would not read back inside its own delimiters. Content free of the spec's excluded characters passes on its own. A delimiter pair a parse has not confirmed is confirmed by parsing the empty composite through the engine in scope, memoized per kind and pair. Anything else is parsed back in its host and must parse with no error, show a node of the kind starting where it was rendered and ending where the text ends, and show the same node arms among its children. Extras are found among the root's inner trivia. With no engine in scope, a varying pair that has not been confirmed, or content that needs the parse, is refused ("needs an engine").

### `packages/common/src/query.ts::entryOfCoordinate`

A query result the native matcher returned as a coordinate, as a query entry: its kind and handle, and a `hydrate` that resolves the coordinate through `hydrateWith` under that tree's engine (`inTreeEngine`), so a match is read only when the caller asks for the node, and a match the registry already holds is the object its parent's accessor returns. It passes no role: a query yields each parser node once, as its alias envelope where an envelope and its content share one node.

### `packages/common/src/query.ts::isPortableKind`

Whether an `ofType` argument has a portable kind's shape: an object with a string `$path`. The path itself is not checked here; one the language's rows do not hold yields nothing (`ofTypeSteps`).

### `packages/common/src/language.ts::kindOf`

A value's kind, as the kind test and a query's slot entries read it: a node's numeric `$type`, or a bare kind id itself, since a keyword leaf reads as its kind id and the guards read it that way; anything else has none. A walk yields a node its read stores as a unit as that bare id, as a slot read stores it (`batches`), so its entry's kind is the id on every route; a coordinate's `$type` stays the shared stamp.

### `packages/common/src/runtime.ts::coerceBitflagStorage`

A bitflag slot's loose input as the number the slot stores: a number as it is (0 as absent), an array as the union of its items' bits, and a node or text as the bit of its text's position in `texts`. Absent, `false`, an unknown text or no bits at all store as `undefined`. The factories call it.

### `packages/common/src/runtime.ts::coerceBooleanKeywordStorage`

A keyword-presence slot's loose input as what the slot stores: `true` for any present value (a non-empty array included) and `false` for absent, `false` or an empty array: a presence flag is always a boolean, never `undefined`. The factories call it for every keyword marker slot.

### `packages/common/src/utils.ts::hydrateTriviaEntry`

A trivia entry as a reader of trivia gets it: a coordinate entry read and wrapped through the tree it holds (`hydrateStored`, which finds the tree by the coordinate's tree token and refuses a coordinate that lost it); a written entry, stored as detached data, wrapped as its kind's node through the engine bound to the tree whose table holds it (`hydrateOn`) when that tree is given; and any entry with its text as the method `$text()` (`asTextNode`).

### `packages/common/src/utils.ts::hydratedEntries`

A trivia side as its reader gets it, each entry through `hydrateTriviaEntry` on the tree whose table answered the side (`sideRead`). A written entry is stored as detached data, which the render reads; the reader gets it as its kind's node, the same surface a read entry has, so `toJSON` and every other reader meet one shape. A side a node holds as its own data, with no coordinate in it, is read back as the same array, its entries given the method `$text()` in place.

### `packages/common/src/read.ts::INDEX_RANGE`

The size of the index field a packed handle holds (`2 ** 32`): the native `encode_handle` multiplies the tree id by it and adds the descendant index, inside a double's exact integer range.

### `packages/common/src/portable/facts.ts::portablePathHasFacts`

Whether a read path names every fact in a guard path: the top-level namespace matches, and each remaining whole segment occurs in order, allowing other refinement facts between them. Shared by namespace kind admission, exact-guard derivation, and the portable guards' matching of a node's reading. An absent read path matches nothing.

### `packages/common/src/portable/classify.ts::classifierOf`

The classifier of a bound grammar's `PortableRows`, built once per rows object (`classifiers`), so every guard reading nodes of a language shares one. It reads a node as the path of its kind's first read entry, in table order, whose conditions all hold. It reads a bare kind id the same way, the id selecting the entries and a text condition on the id itself reading its `fixedText`, but only through entries whose every condition reads the value itself (`decidesKindId`: no `via` step, and only `self` subjects, `readsItself`). An id shows no slot, so an entry that reads one is skipped for it, as a placed entry is; otherwise an empty slot would make a negated slot test hold (python's `comparison_operator` id would read as a comparison chain). Such an id reads by the first entry it can decide, `expression.binary` for that one: less specific, never wrong. Both filters run once, when the classifier is built (`entriesWhere`): per kind, it keeps the unplaced entries a node reads through (`nodeEntries`) and those a kind id can also decide (`kindIdEntries`), so a call scans only those. An entry that depends on where the node sits, a `within` placement or a condition on an enclosing node (`up > 0`), is skipped (`unplaced`): a node alone carries no context, so it reads as its next entry: the placed reading answers false and the next one true (an impl or class-body method reads as a function) until placed readings become kinds of their own. A condition runs `holds`, the one evaluator of a `QueryPlan`, once over every node its `via` steps reach from the node, an anchored step reading only the first, the last or the only node of its slot (`anchored`); a negated plan therefore holds only when no reached node matches. Texts come from a slot's items through `query-holds.ts::slotItems`, the slot found by the number its subject gives the node's kind in the slot table; a kind the subject does not number holds no item. A slot the table stamps with a keyword holds a boolean: `true` reads as that keyword and `false` as no item. A value's text is a kind-id item's `fixedText` entry, a leaf's `$text`, and otherwise, for a parsed structured node, the slice of its tree's source its span covers (`span.ts::spanSlicer`, one slicer per tree); a value's type is its `$type`, or a kind-id item's own number.

### `packages/common/src/portable/classify.ts::hasKind`

Whether a value is an object with a numeric `$type`: the shape a classifier reads as a node, and the first test of a shared portable guard, which therefore refuses a bare kind id. A language's guards (`languageGuardOf`) test for a number first and read it through the language's rows.

### `packages/common/src/portable/index.ts::guardOf`

The shared portable guard of a vocabulary path. It refuses a value without a kind (`hasKind`), and so a bare kind id, which names no language. It then reads the node by the rows of the language whose engine stamped it (`engineOf(node)?.portable`) through `readsAs`; no engine, or a grammar without bindings, answers false. A node of any bound language reads by its own rows, so one tree serves every language.

### `packages/common/src/portable/classify.ts::readsAs`

Whether a node or a bare kind id reads as a vocabulary path by one language's rows. Its kind (a node's `$type`, or the id itself) must be among the ids the rows' table gives the path (`portablePathOf`); an exact path then holds by the kind alone, and otherwise the value's reading (`classifierOf`) must carry every fact of the path (`portablePathHasFacts`). The one test the shared guards (`guardOf`), a language's guards (`languageGuardOf`) and a query's `ofType` by a portable kind (`query.ts::ofTypeSteps`) run once they hold the rows.

### `packages/common/src/portable/classify.ts::portablePathOf`

The ids and exactness a bound grammar's rows give a vocabulary path, or `undefined` when the grammar reads nothing at or under it. It reads the table's own keys only, so a path a caller supplies (a query's portable kind) cannot reach a prototype member such as `constructor`.

### `packages/common/src/portable/index.ts::registerPortableRows`

Records a bound grammar's rows in `rowsByLoad`, keyed by the descriptor's `load` function; `loadLanguage` calls it once the hooks resolve. The key is `load` rather than the descriptor object because a copied descriptor (`{ ...rust }`) shares the original's `load`, so rows loaded through either serve both. The map is weak, so a descriptor that goes away takes its rows with it.

### `packages/common/src/portable/index.ts::PortableLanguage`

What a language's portable guards need from a descriptor: its `name`, for the error a guard raises before the language has loaded, and its `load` function, the key its rows are recorded under (`registerPortableRows`). It is structural, so `@sittir/common/portable` does not import the `Language` type and a descriptor satisfies it as it is.

### `packages/common/src/portable/index.ts::portableGuardsOf`

A language's view of the portable guards: `portableTrees` over the same `vocabularyPaths`, each guard built by `languageGuardOf`, so it has the shared tree's keys at every level but guard objects of its own. It is memoized per language object (`views`), so the descriptor's `is.portable`, the `is.portable` of every engine of that descriptor and its portable engine's `is` are one object. An engine of a copied descriptor gets the copy's own view (`guardsOf` rebuilds the shared members through the recorded builder), which finds the same rows. The shared tree, `portable.is`, stays node-only.

### `packages/common/src/portable/index.ts::languageGuardOf`

The guard of a vocabulary path in one language's view. A bare kind id reads through the rows recorded for the language's `load` (`rowsByLoad`) by `readsAs`. If no engine of the language, or of a copy sharing its `load`, has loaded them yet, it throws, naming the language and asking for an engine first: answering false there would read as a classification. A node must carry a kind and pass the language check (`ofLanguage`, the `inLanguage` check `portableGuardsOf` builds once per view, the same one the language's kind test makes), and its engine must carry portable rows; it then reads by those rows. A node of another language, or one no engine stamped, answers false.

### `packages/common/src/identity.ts::Role`

How a route reaches a parsed node, the second half of its registry key. `aliasContent` is the content of an alias envelope that shares the envelope's parser node, and so its descendant index; every other route, an alias content that is its own parser node included, reaches a node as `node`. The role comes from the route, never from what the registry already holds.

### `packages/common/src/identity.ts::keyOf`

The registry key of an index and a role: twice the index, plus one for `aliasContent`. An index is below 2^32, so the key stays inside a double's exact range.

### `packages/common/src/identity.ts::registered`

The wrapper registered for a node of a tree, by index and role, while it lives: one map per `TreeHandle` object (a tree handle is bound to one engine surface), each entry a `WeakRef`, so the registry never keeps a wrapper, its token or its tree alive. Every route that hydrates (a parent's accessor, a query, the parse root) asks here first, which makes a node one object on its surface.

### `packages/common/src/identity.ts::register`

Records a wrapper for a node of a tree, by index and role, weakly. A finalization registry drops the entry when the wrapper is collected, unless a newer wrapper took the key since; the next route then wraps the node afresh and registers that.

### `packages/common/src/node-data.ts::indexOf`

The descendant index a read node or a coordinate names itself by: `decodeIndex` of `treeHandleOf`. `undefined` for a node with no coordinate (a built node, a draft).

### `packages/common/src/utils.ts::wrapRegistered`

The one seat that wraps and registers: the wrapper the registry holds at the value's index and role, or the value wrapped and registered there. A value that names no index of `tree` (none at all, or one of another tree) is wrapped and not registered. The registry stores wrappers as `object` because one registry serves every kind; that what is registered at a tree, an index and a role is always the wrapper of one storage kind (measured over every corpus entry of rust, typescript and python, across the nested read, the read at the index and the query yield) is what makes returning it as `T` sound.

### `packages/common/src/utils.ts::contentRole`

The role an alias envelope's content accessor hydrates in: `aliasContent` when the content stamps the envelope's own index (the alias renamed one parser node), `node` when the content is its own parser node, which a query may also reach and which must then be one object. It compares the two values' stamped indexes, so it re-derives nothing the reader did not stamp.

### `packages/common/src/utils.ts::isEmptyNode`

Whether a node can hold inner trivia: nothing in it owns sides, since a comment beside any child has that child to lead or trail. Emptiness is about side ownership, not about what renders.

- A parsed node answers from its tree (`TreeHandle.isEmpty`): no child is named, not an extra or `ERROR`, and with width.
- A built node answers from what it stores (`storesNothingIn`), over its kind's inner region (`TriviaFacts.innerRegions`) with the named units (`TriviaFacts.namedUnits`), read through the node's engine (`engineOf`). A slot outside the gap does not count, so a typescript block whose only stored value is its automatic-semicolon terminator after `}` is empty, though the terminator still renders. A stored token of an anonymous kind (rust's `$` in `a!($)`) does not count either, while a named one (an empty statement's `;`) does.
- A node with no engine, or of a kind with no inner region, is judged over every `_`-keyed slot, every unit counting.

The two rules are held to one answer by `inner-region-parity.test.ts`. The one disagreement is scm `missing_node` in `(MISSING) @cap`, where the tree counts the capture after `)`; it is named there until the tree's rule reads the same gaps. `rebuilt` and `$trivia.inner` (`triviaWriter`) ask it, and so does `engine.isEmptyNode`, which also requires a kind with an inner side.

### `packages/common/src/utils.ts::storesNothingIn`

Whether a node stores nothing that owns sides in the slots `region` names, or in every `_`-keyed slot when it names none. A slot owns sides when it holds a node, a coordinate, text or a presence (any value other than `null`/`undefined`), or a unit whose kind id is in `namedUnits`. Every unit counts when no `namedUnits` is given. A list owns sides when any item does. It is the stored half of `isEmptyNode`, exported so the corpus parity test applies it to parsed nodes too.

### `packages/common/src/node-data.ts::sideOf`

The entries of one side of a node, the one source of a node's sides for the `$trivia` surface, the crossing and the tools: the entries of `sideRead`, which decides per side where it lives. A parsed node's side is its live tree's trivia table's at its own index (`tableAt`): the entries a write gave it, else the ones the table assigns it. A built node's side is the one it stores, else the side of the node it was rebuilt from (`placeOf`), while that tree lives. An alias envelope and its content are one parser node, and the envelope holds that node's sides: the content (`envelopeKindOf`) reads none from the table, so every reader meets a comment there once.

### `packages/common/src/node-data.ts::sidesOf`

Every non-empty side of a node (`sideOf`), as a `NodeTrivia`; `undefined` when it has none. A detached crossing carries these as data, and the tools read a node's sides through it.

### `packages/common/src/node-data.ts::tableAt`

The trivia table that answers for a parsed node: its live tree's, at its own index; `undefined` for a built node or one whose tree is gone. `tableOf` is the check both it and a built node's source lookup share: a tree that reads and writes sides, and an index.

### `packages/common/src/node-data.ts::rootEdges`

The edges a render root crosses with. It renders with no neighbour, so both its edges changed and its sides drop their edge runs, unless it is its tree's root (index 0), whose edges are the document's and whose stored layout is the document's own.

### `packages/common/src/node-data.ts::siblingsOf`

The siblings that hold sides beside the node a source identity names, as its tree gives them (`TreeHandle.siblings`); `undefined` while the tree is gone.

### `packages/common/src/node-data.ts::keepsNeighbour`

Whether the neighbour a node has in its holder is the sibling its source had on that side: both absent, the neighbour's evidence (`evidenceOf`) names the same tree and span, or the neighbour is a unit held as its bare kind and the sibling is of that kind. A unit has no identity of its own, and its text is its kind's, so any unit of the sibling's kind spells the same gap.

### `packages/common/src/node-data.ts::coordinateCrossing`

A coordinate as it crosses: its plain fields (`plainCoordinate`) and, when an edge's neighbour changed, `$_layout.changed`, which the native coordinate decode keeps and the render applies to its sides.

### `packages/common/src/node-data.ts::PLAIN_KINDS`

The `KindView` of data with no wrapper or list kinds: no for every kind.

### `packages/common/src/node-data.ts::nodeText`

The text a leaf holds, from either form a value takes: a node's `$text()` method, which makes the string when called, or the `$text` string native node data carries across the boundary. `undefined` for a value with neither. Code that may hold either form, such as the crossing (`toNodeValue`), builder input checks (`rejectKeywordText`, `rejectReservedText`), the delimited check, the portable classifier and the validators, reads text here and nowhere else. Typed code holds nodes only and calls `$text()`.

### `packages/common/src/node-data.ts::asTextNode`

A read value given a node's text member: an object whose `$text` is a string gets the method `$text()` under that key, on the same object, so the tree it holds and its read identity stay with it, and every node a user reaches reads its text one way. Native returns the string, because what it returns is data, and data serializes (a `$snapshot()` result, a render input, a fixture). JavaScript turns it into a node here, at the two places a read value becomes one without a kind's wrap: a trivia entry (`hydrateTriviaEntry`), such as a detached comment or an ERROR region read as trivia, and a value of a kind with no wrap in the generated table (`wrapNode`), such as an ERROR region in a slot or at the root. Any other value, including a node that already has the method, is returned as it is.

### `packages/common/src/node-data.ts::hasNodeText`

Whether a value has a text member in either form, a node's `$text()` method or native data's `$text` string, decided by the member's type alone. It never calls the method: a node's text is made strictly on access, and a method backed by the tree's native `text(span)` would otherwise cost a native call and a string on every check. `isNode`, which every coercer runs, tests text presence here; code that needs the text itself reads it through `nodeText`.

### `packages/common/src/node-data.ts::envelopeKindOf`

The display id of the alias envelope whose content a node is, read from the same parser node, else `undefined`. The reader stamps a coordinate with the grammar id, except at an alias envelope, where it stamps the display id; the envelope and its content are wrapped from that one coordinate, so the content is the node whose stamp (its own coordinate's, or the one an edit carried forward, `placeOf`) differs from its own kind. Over the corpora this matches "shares its holder's tree handle" exactly. The contract: an alias content's comments belong to its envelope. `sideRead` reads the content nothing from a table, whose entries for that parser node are the envelope's (a content an edit rebuilt still reads the sides it holds as its own data), and a `$trivia` write through the content lands on the one parser node, which the envelope reads once and every writer (JSON, render) writes once. `isAliasContent` asks this of a holder's child.

### `packages/common/src/node-data.ts::sideRead`

One side of a node and the tree whose trivia table holds it, decided per side, the one source `sideOf` and the `$trivia` reader share: a parsed node's live table at its own index, else the side the node holds as its own data (no tree), else the table of the node it was rebuilt from (`placeOf`) while that tree lives. So a rebuilt node that wrote one side and inherits the other reads each from where it lives, and the reader hydrates each through its own tree. An alias envelope's content (`envelopeKindOf`) reads nothing from either table, since that parser node's entries are its envelope's; a side it holds as its own data, after an edit rebuilt it, is still read.

### `packages/common/src/node-data.ts::setUnitSides`

Gives a built node its unit children's sides as held layout (`$_layout.units`), the record `unitSidesOf` reads first. The node reviver uses it to put back a unit's comments, which a unit (a bare kind id) cannot hold itself.

### `packages/common/src/node-data.ts::realignedUnits`

Unit-side records moved from the node they were recorded on (`before`) to the node a rebuild made from it (`after`). A unit variant is stored as its bare kind and has no identity, so each slot's units are aligned between the two (`alignedItems`): a unit's sides follow it to the item it moved to, and the sides of a unit the rebuild removed, or replaced with a node, go with it. The one core behind a parsed source's carried sides (`carriedUnitSides`) and a built source's held ones (`carryUnitSides`).

### `packages/common/src/node-data.ts::carryUnitSides`

Makes a rebuilt node keep the unit sides its source holds as its own layout (`$_layout.units`), realigned to the rebuilt node's slots (`realignedUnits`). A revived node holds its units' comments that way and has no source tree to read them from again, so without this an edit dropped them. `rebuilt` calls it next to `carryPlace`. A parsed source's units come through its place instead (`unitSidesOf` → `carriedUnitSides`).

### `packages/common/src/interior.ts::interiorPattern`

The compiled whole-token regex of a token interior, built once per interior object (flags `su`) and cached. `projectInterior` splits text with it, and the coercer's leaf registry row for a lexed kind holds it as its pattern, so the interior's `regex` string is compiled in one place on the client.

### `packages/common/src/language.ts::inLanguage`

The language check of a language's kind test (`kindTestOf`), which its guards and its engines' `ofType` read, and of `assembleEngine`'s node guards: a value whose stamped engine is of `language` (`engineOf`), compared by the language object itself, or a kind-id leaf. A kind-id leaf is a bare number the typed reader stores for a keyword, token or enum member; it carries no stamp, so it is read in the language asking. Keyed by the language rather than an engine, so a descriptor builds its guards before any engine exists.

### `packages/common/src/language.ts::languageGuards`

A language's guard table: the grammar's `guardsWith` called with the language's kind test (`kindTestOf`), so every guard holds only for a value of `language`, with the extra arguments of a guard such as `kind` passed through. A node of another grammar whose kind id the guard would accept is rejected, a value with no stamp is rejected, and a node of a disposed engine is accepted, since only the stamped language is read. The guards call the test themselves, so a supertype guard's variant guards (`is.suite.block`) check the language as the supertype guard does, with nothing wrapped around them. The generated descriptor builds its table at import, against the descriptor module itself, so `rust.is` needs no engine and is the object every engine of that descriptor exposes. `shared` builds members added beside the guards as they are. It is called with `language`, so a bound grammar's descriptor passes `(language) => ({ portable: portableGuardsOf(language) })`, the language's view of the portable guards, which checks nodes and kind ids itself. It records each table with the builder, the language and the `shared` builder it was built from, which `guardsOf` reads. The module imports only `engine-scope.ts`, which reaches no native addon, so the descriptor stays light.

### `packages/common/src/language.ts::guardsOf`

The guards an engine of `language` exposes: `language.is` itself when it was built for `language`, as a generated descriptor's is. Otherwise the same builder called with `language`'s kind test: a descriptor copied from another (`{ ...rust }`) carries guards checking the original, while its engine stamps nodes with the copy, so reusing them would reject the engine's own nodes and pass the original's, disagreeing with `isNode`. The shared members are rebuilt for the copy through the builder recorded with the original, so an engine of the copy exposes the copy's own view of the portable guards (`portableGuardsOf`), which reads the copy's nodes and finds the language's rows through the shared `load`. A hand-built table that no `languageGuards` call recorded has no builder to call, so it is exposed as it is. The result is kept per language, so every engine of one descriptor exposes one object.

### `packages/common/src/language.ts::KindTest`

The test a guard and a query's `ofType` make of a value: whether it is of one of `kinds`, the set the kind asked for holds for (its members, or itself). Taking the set rather than a kind lets one test serve a guard over a kind, a supertype with no kind id, and a portable path's ids.

### `packages/common/src/language.ts::holdsKinds`

The kind test with no language check: whether the value's kind (`kindOf`) is in the set. A grammar's package-level `is` is built with it, so it answers for storage data and for a node of any language alike, and a hand-built query context with no language uses it.

### `packages/common/src/language.ts::kindTestOf`

A language's kind test: the language check (`inLanguage`), then membership (`holdsKinds`). It is the one test the language's guards are built with (`languageGuards`) and an engine's `ofType` runs over elements after an opaque step (the `kindTest` query hook), so a node of another language whose kind id matches passes neither, and a bare kind id passes both, since it carries no language. Kept per language object, so the guards and every engine of the language hold the same function.

### `packages/common/src/portable/tree.ts::ChildrenOf`

The child segments of a path among a union of vocabulary paths: each path one segment below it, by its last segment. `RootsOf` is the same for the top level (the paths with no dot). With `string` for the union, both read as `string`, so a tree typed over arbitrary paths is an index signature.

### `packages/common/src/portable/tree.ts::KindAt`

The type of one node of the shared kind tree: its `$path` as a literal, and each child segment (`ChildrenOf`) as the node one level down. `GuardAt` is the same shape over the guards: each node is a `PortableGuard` holding its children. Both derive from the path union that `portableTrees` is given, which for the exported `portable` is `vocabularyPaths`'s element type, so the generated path list is the one source of the shared trees' types and values.

### `packages/common/src/source-stamp.ts::stampSource`

Stamps `node` with where it came from (`Source`), which makes it a node (`isNode`). The stamp is a member under a module-private symbol, so no literal, JSON value or string-key copy can carry it, while a spread copy keeps it (the member is enumerable, as the tree token's is). The node gets no `$source` member: `sourceOf` is the one way to read the stamp. Stamping again replaces the stamp.

### `packages/common/src/source-stamp.ts::stampBuilt`

`stampSource` with `Source.Factory`: what every generated builder returns its node through, and what a test stamps a hand-written built node with. It is exported through `@sittir/common/utils`, so code can call it on purpose; what it rules out is a node by accident or by literal.

### `packages/common/src/source-stamp.ts::sourceOf`

The one read of a node's provenance, public through `@sittir/common`: the stamp the node holds, or `undefined` for anything that is no node. It answers for every node sittir hands out, read, built or rebuilt, and for a spread copy of one, because it reads the stamp member itself rather than a member set per object. `isNode`, `verifyStructure` and `carrySourceStamp` read the stamp through it. It is distinct from `placeOf`, which says where in its source text a node sits.

### `packages/common/src/source-stamp.ts::carrySourceStamp`

Stamps `to` with the source stamp `from` holds, when it holds one, and returns `to`. A copy built key by key from a node (the validators' materialised copies, `materializeValue`) loses the stamp with every other symbol member, and this puts it back, so the copy is the node it stands for. A spread copy keeps the stamp and needs no carry. Beside `carryPlace`, which carries a different fact: where in its source a node sits.

### `packages/common/src/node-json.ts::nodeJSON`

A node's JSON, the body of every node's `toJSON`. What the node's kind is decides what is written, from the grammar's `jsonFacts`: `$type` is the kind's name; a text leaf (`leaves`) and an ERROR node add `$text`; each slot of the kind (`slots`) is written under its accessor's name, read through the accessor so a parsed node and a built node give the same JSON. A slot's value is written by what it holds: a node as its JSON, a kind id as a node of that kind (`{ $type }`), with the comments its parent holds for it (`unitSidesOf`, by the slot's storage key from its `querySlots` row and its item there) as its own `leadingComments` and `trailingComments`, so a comment on a unit crosses the way a node's does, a list (anything iterable that is not a node, since a list owner is itself iterable) as an array whose empty element is `null`, `true` and strings as they are, the blank arm of an optional slot that chose none (`blank`, the kind id no parser kind holds) as `null`, the spelling a builder takes it in (a `null` in a slot is a blank arm and a `null` inside a list is a hole: the position tells them apart); `undefined` and an absent keyword (`false`) are left out. Each trivia side's entries whose kind is not layout are the comments, written as `leadingComments`, `trailingComments` and `innerComments` when the side has any; an ERROR the parser left is one of them. Nothing else crosses: no storage keys, no layout, no provenance stamp or tree token, no `$with`, so the JSON names no tree and needs none to revive. The walk calls `nodeJSON` on the children itself rather than their `toJSON`, so an entry that is not a generated node (an ERROR) is written the same way.

### `packages/common/src/node-json.ts::contentText`

The text a text envelope's JSON carries in its one slot: the content leaf's `$text`, when the content is written as the kind the envelope holds (`jsonFacts.textEnvelopes`) with no member but `$type` and `$text`. Any other content (another kind, an `ERROR`, an unknown kind, comments) gives none, and the envelope revives through its slots, which refuse what it cannot hold at the content's path. The reviver builds an envelope with text through the envelope's own builder, never the content kind's, because the content kind's reserved words do not bind the envelope: `x.default` writes its property as `{ $type: 'property_identifier', content: { $type: 'identifier', $text: 'default' } }`, and `identifier` refuses `default` while `property_identifier` admits it.

### `packages/common/src/node-json.ts::unitSidesBySlot`

A node's unit-side records (`unitSidesOf`) grouped by slot storage key, then by item, so `nodeJSON` finds the comments of each unit it writes by its slot's `querySlots` storage key and its position in that slot.

### `packages/common/src/node-json.ts::commentsJSON`

The comments among a trivia side's entries as JSON. An entry whose kind is layout is left out. Each other entry is hydrated (`hydrateTriviaEntry`: a coordinate a tree's unit side holds becomes its comment node) and written as its node's JSON. A node's own sides and a unit's sides are written through it alike.

### `packages/common/src/node-json.ts::unitJSON`

A kind id's JSON: `{ $type }` naming its kind, with `leadingComments` and `trailingComments` from the unit's side record when it has comments there. A unit has no inner side.

### `packages/common/src/node-json.ts::reviveItem`

Revives one slot value, or one list item, of the node the reviver is building. When it revives to a kind id and its JSON carried comments, it records them as a unit-side record: the slot's storage key from its `querySlots` row, the item's position, and the revived comments. After building the node, the reviver gives it those records (`setUnitSides`), the record a parsed tree gives, so render, `$snapshot()` and `toJSON` read them with no path of their own.

### `packages/common/src/node-data.ts::SideRead`

One side of a node (its leading, trailing or inner comments) and the tree whose trivia table holds it. `tree` is `undefined` when the node holds the side as its own data. `sideRead` returns it, so each side is read from the place it lives rather than from one choice made per node: a rebuilt node that wrote one side and inherited the other reads each one from its own source.

### `packages/common/src/node-json.ts::valueJSON`

Converts one slot value to its JSON form. `undefined` and `false` are omitted; `true` and strings pass through; the language's blank value becomes `null`; a kind id becomes a unit node of that kind, carrying the comments its unit records hold (a keyword or punctuation stored as its kind id cannot hold sides itself, so its parent holds them); a node becomes its node JSON; a list becomes an array with `null` for each hole. Any other value throws, naming the slot.

### `packages/common/src/node-json.ts::kindName`

The kind name for a kind id, read from the language's facts. Throws when the language has no kind with that id.

### `packages/common/src/node-json.ts::ReviveHooks`

What the reviver needs from the engine: the language's JSON facts, a `build` hook that constructs a node of a named kind from its input, and a `settle` hook applied to each node the reviver builds. `reviveNode` takes these as its only dependency on the engine.

### `packages/common/src/node-json.ts::reviveNode`

Builds a parsed JSON value back into nodes, the engine's reviver. The walk is recursive and children are built before their parent, so each parent receives built children. Errors name the JSON path: an ERROR node, an unknown kind, a slot the kind lacks, or a leaf without its text.

### `packages/common/src/node-json.ts::revive`

The recursive walk behind `reviveNode`. An array maps each item. An object without `$type` keeps its keys, each revived. An object with `$type` is built as a node of that kind, after its slots and comments are revived. ERROR and unknown kinds are refused at the object's path.

### `packages/common/src/node-json.ts::buildAt`

Calls the `build` hook for one node and rethrows any failure with the JSON path prefixed to its message, keeping the original error as the cause.

### `packages/common/src/node-json.ts::kindIdOf`

The kind id for a kind name, or `undefined` when the language has no kind of that name. The set of names is computed once per facts object and cached, so a name that is not a kind is answered here instead of reaching `facts.kindId`, which throws for names no kind has.
