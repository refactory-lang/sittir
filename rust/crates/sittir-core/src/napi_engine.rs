//! The napi engine every grammar crate exposes, defined once.
//!
//! [`napi_engine!`] emits the `SittirEngine` class (its lifecycle and parse),
//! the addon's functions (read, render, edits) and the live-tree table behind
//! them. A grammar crate supplies only
//! what is actually grammar-specific — its parser hook, its node root
//! type, and its template hash — so a change to the state machine lands in one
//! place instead of once per grammar.
//!
//! ## Trees are kept, not replaced
//!
//! Reads are lazy: a parse hands back one level, and every child with
//! substructure comes back as a stub carrying the handle to hydrate it later.
//! Those handles stay live for as long as the caller holds any node, so an
//! engine that kept only the newest parse would answer a held tree's handles
//! out of a different tree — and, because handles are dense indices that
//! restart at 0, would do it silently. Every parsed tree is therefore kept,
//! keyed by the id its handles carry.
//!
//! ## Calls are functions, not methods
//!
//! A call on a live tree takes the tree's id, and a call on an engine's state
//! (its options, its built arena, its store) takes the engine's handle
//! (`SittirEngine::handle`), an external value naming the engine. Neither is
//! a method: napi-rs registers a borrow of the receiver, and of any class
//! argument, on every call, and a read or render crosses once per node.
//!
//! ## The table belongs to the addon, not to an engine
//!
//! A coordinate names a tree, not the engine that parsed it, so the table is
//! one per grammar addon: every engine of a language resolves every tree of
//! that language, and a tree outlives the engine that parsed it. It is a
//! `thread_local!`: a tree resolves only on the JavaScript thread that parsed
//! it, whose heap holds its nodes and the finalizer that disposes it. Tree ids
//! come from the engine's one counter, so no two threads' tables share an id.
//!
//! Trees are dropped when JavaScript drops its side: the boundary registers
//! each tree with a `FinalizationRegistry` and calls the addon's `disposeTree`
//! once the last object naming it is collected. An engine's `dispose` leaves
//! them alone. A thread that ends takes its table with it.

/// Emit the `SittirEngine` napi class and the addon's functions for one grammar.
///
/// - `$grammar` — the crate's [`EngineGrammar`](crate::engine::EngineGrammar) adapter.
/// - `$render_root` — the generated node root type accepted by `render`.
/// - `$any` — the grammar's any-native node: what `read` reads a node into, and
///   the parent type it reads any parent's routes with.
/// - `$options` — the grammar's `sittir_core::options::Options<Sites>` (`render::options::Options`), read through its address trie; the shape `EngineOptions.options` and `render`/`render_to_file` accept.
/// - `$render_parts` — `fn($render_root, &RenderContext, Option<&mut Baseline>) -> Result<(Source, String), _>`.
/// - `$abi` — the render node ABI version this crate was generated against.
/// - `$defaults` — `fn() -> ResolvedOptions`, the grammar's site table at its declared defaults.
#[macro_export]
macro_rules! napi_engine {
    ($grammar:ty, $render_root:ty, $any:ty, $options:ty, $render_parts:path, $abi:expr, $defaults:path) => {
        /// Refuse to load beside an engine image of another release: the
        /// addon carries the stamp it was built against, and the process
        /// holds one engine, mapped by whichever addon loaded first.
        ///
        /// The hook reads the mapped engine's stamp as data and compares it
        /// here, before any call into the engine. The loader binds that read
        /// when it maps the addon, so an engine of another version fails the
        /// load, and one of this version and another commit reaches the
        /// comparison. Only once the stamps differ does the hook call the
        /// engine, for the refusal. No other call into the engine runs before
        /// the comparison: a call may be bound lazily, and an engine of
        /// another release may not define it.
        #[::napi_derive::napi(module_exports)]
        pub fn refuse_engine_skew() -> ::napi::Result<()> {
            if ::sittir_engine::LOADED == ::sittir_engine::BUILT {
                return Ok(());
            }
            Err(::napi::Error::from_reason(::sittir_engine::refusal(env!("CARGO_PKG_NAME"), &::sittir_engine::BUILT)))
        }

        /// The engine image this process mapped: its stamp and the file it
        /// was loaded from.
        #[::napi_derive::napi(object)]
        pub struct EngineStamp {
            pub stamp: String,
            pub path: Option<String>,
        }

        /// The engine image this process mapped (`sittir_engine::loaded`).
        #[::napi_derive::napi]
        pub fn engine_stamp() -> EngineStamp {
            let (stamp, path) = ::sittir_engine::loaded();
            EngineStamp { stamp: stamp.to_string(), path }
        }

        #[::napi_derive::napi(object, object_to_js = false)]
        pub struct EngineOptions {
            /// Resolved once here against the grammar's site table at
            /// construction; only the resolved ids are kept. A `render` call
            /// carrying its own options resolves again, per call, over the
            /// engine's table — the engine's own table never changes.
            #[napi(ts_type = "object")]
            pub options: Option<$options>,
        }

        ::std::thread_local! {
            /// Every tree of this language still reachable from this
            /// JavaScript thread, keyed by the id its handles carry. Entries
            /// leave only via `dispose_tree`.
            static LIVE_TREES: ::std::cell::RefCell<
                ::std::collections::HashMap<$crate::types::TreeId, $crate::ParsedTree<$grammar>, $crate::heap::IndexState>,
            > = ::std::cell::RefCell::new(::std::collections::HashMap::default());
            /// The buffers JavaScript reads each live tree's arena chunks
            /// through, detached when the tree is dropped.
            static TREE_BUFFERS: ::std::cell::RefCell<
                ::std::collections::HashMap<$crate::types::TreeId, $crate::napi_engine::Buffers, $crate::heap::IndexState>,
            > = ::std::cell::RefCell::new(::std::collections::HashMap::default());
            /// What every tree's report has added to V8's external memory,
            /// less what its dispose gave back (`tree_memory`).
            static TREES_REPORTED: ::std::cell::Cell<i64> = const { ::std::cell::Cell::new(0) };
        }

        /// Drop one tree, detaching every buffer over its arena's chunks.
        /// Called from the boundary's `FinalizationRegistry` once JavaScript
        /// has collected the last object naming it. Unknown ids are not an
        /// error — a tree can only be dropped once, and the registry has no
        /// way to know whether it already was.
        #[::napi_derive::napi]
        pub fn dispose_tree(env: ::napi::Env, tree_id: f64) {
            // Checked for the same reason `with_live_node` checks its ids:
            // `as` saturates, so `NaN` and every negative arrive as 0 —
            // and 0 is the first tree, so an unchecked cast would let a
            // nonsense id drop a live tree. Invalid input is a no-op
            // rather than an error: this is called from a finalizer,
            // where nothing is positioned to handle a throw, and
            // disposing an id that names no tree is already a no-op.
            let Ok(tree_id) = $crate::napi_engine::checked_index(tree_id, "treeId") else {
                return;
            };
            let Ok(tree_id) = u32::try_from(tree_id).map($crate::types::TreeId) else {
                return;
            };
            if let Some(mut buffers) = TREE_BUFFERS.with(|buffers| buffers.borrow_mut().remove(&tree_id)) {
                if let Ok(change) = buffers.detach(&env) {
                    TREES_REPORTED.with(|total| total.set(total.get() + change));
                }
            }
            if let Some(tree) = LIVE_TREES.with(|trees| trees.borrow_mut().remove(&tree_id)) {
                let _ = $crate::napi_engine::dispose(&env, tree);
            }
        }

        /// Runs `f` on the live tree `tree_id`, refusing a tree that is not
        /// live, then reports the tree if it grew (`report_tree`).
        fn with_live_tree<R>(
            env: &::napi::Env,
            tree_id: $crate::types::TreeId,
            f: impl FnOnce(&mut $crate::ParsedTree<$grammar>) -> ::napi::Result<R>,
        ) -> ::napi::Result<R> {
            LIVE_TREES.with(|trees| {
                let mut trees = $crate::engine::change_trees(trees).map_err(::napi::Error::from_reason)?;
                let parsed = trees.get_mut(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                let out = f(parsed);
                report_tree(env, tree_id, parsed)?;
                out
            })
        }

        /// Runs `f` on the live tree `tree_id` and the node at `index` of it,
        /// both checked: refuses a tree that is not live and an index naming
        /// no node of it (`with_live_tree`).
        fn with_live_node<R>(
            env: &::napi::Env,
            tree_id: $crate::types::TreeId,
            index: $crate::types::NodeIndex,
            f: impl FnOnce(&mut $crate::ParsedTree<$grammar>, $crate::types::NodeIndex) -> ::napi::Result<R>,
        ) -> ::napi::Result<R> {
            with_live_tree(env, tree_id, |parsed| {
                $crate::napi_engine::check_node(parsed, index)?;
                f(parsed, index)
            })
        }

        /// Runs `f` on the live trees, noting each tree it reads
        /// (`ReadTrees`), then reports each of those that grew
        /// (`report_tree`).
        fn with_live_trees<R>(
            env: &::napi::Env,
            f: impl FnOnce(&$crate::engine::ReadTrees<'_, $grammar>) -> ::napi::Result<R>,
        ) -> ::napi::Result<R> {
            let (out, read) = LIVE_TREES.with(|trees| {
                let trees = trees.borrow();
                let read = $crate::engine::ReadTrees::new(&trees);
                (f(&read), read.read())
            });
            LIVE_TREES.with(|trees| {
                let mut trees = $crate::engine::change_trees(trees).map_err(::napi::Error::from_reason)?;
                read.into_iter().try_for_each(|tree_id| trees.get_mut(&tree_id).map_or(Ok(()), |parsed| report_tree(env, tree_id, parsed)))
            })?;
            out
        }

        /// Reports each live tree that grew since its last report
        /// (`report_tree`).
        fn report_live(env: &::napi::Env) -> ::napi::Result<()> {
            LIVE_TREES.with(|trees| $crate::engine::change_trees(trees).map_err(::napi::Error::from_reason)?.iter_mut().try_for_each(|(&tree_id, parsed)| report_tree(env, tree_id, parsed)))
        }

        /// Reports to V8 what the live tree `tree_id` holds natively now
        /// (`ParsedTree::native_bytes`), in place of what it reported, once a
        /// table of it grew since (`ParsedTree::take_grown`).
        fn report_tree(env: &::napi::Env, tree_id: $crate::types::TreeId, parsed: &mut $crate::ParsedTree<$grammar>) -> ::napi::Result<()> {
            if !parsed.take_grown() {
                return Ok(());
            }
            let change = TREE_BUFFERS.with(|buffers| buffers.borrow_mut().entry(tree_id).or_default().report(env, parsed.native_bytes()))?;
            TREES_REPORTED.with(|total| total.set(total.get() + change));
            Ok(())
        }

        /// What the live trees hold natively and what their reports have
        /// told V8, once every tree that grew is reported: `{ trees, counted,
        /// reported }`. A diagnostic: the two agree, and both are 0 once
        /// every tree is disposed.
        #[::napi_derive::napi(ts_return_type = "{ trees: number; counted: number; reported: number }")]
        pub fn tree_memory(env: ::napi::Env) -> ::napi::Result<$crate::napi_engine::TreeMemory> {
            report_live(&env)?;
            let (trees, counted) = LIVE_TREES.with(|trees| {
                let mut trees = $crate::engine::change_trees(trees).map_err(::napi::Error::from_reason)?;
                ::napi::Result::Ok((trees.len(), trees.values_mut().map($crate::ParsedTree::native_bytes).sum::<usize>()))
            })?;
            Ok($crate::napi_engine::TreeMemory::new(trees, counted, TREES_REPORTED.with(::std::cell::Cell::get)))
        }

        /// The node at `index` of `parsed` read into its native node, `depth`
        /// levels down, or as its text and coordinate when it is an `ERROR`.
        /// Refuses an index naming no node of the tree and a node the model
        /// has no route for, naming the kind, the child and the index.
        fn read_node(
            parsed: &$crate::ParsedTree<$grammar>,
            index: $crate::types::NodeIndex,
            depth: $crate::read::Depth,
        ) -> ::napi::Result<::napi::Either<$any, $crate::ErrorRead>> {
            $crate::napi_engine::node_or_error(parsed, index, "read panicked", || parsed.read_node::<$any>(index, depth))
        }

        /// A tree id as JavaScript holds it: a whole number.
        #[::napi_derive::napi]
        pub type TreeId = u32;

        /// A node index as JavaScript holds it: a whole number.
        #[::napi_derive::napi]
        pub type NodeIndex = u32;

        /// A child's position under its parent as JavaScript holds it: a whole number.
        #[::napi_derive::napi]
        pub type ChildPosition = u32;

        /// Number of trees still held on this thread. Diagnostics only — the
        /// boundary's disposal is driven by GC, so this is the way a test can
        /// observe that trees are actually being released.
        #[::napi_derive::napi]
        pub fn live_tree_count() -> u32 {
            LIVE_TREES.with(|trees| trees.borrow().len() as u32)
        }

        /// The engine a `SittirEngine` holds, shared with each handle
        /// (`SittirEngine::handle`) the module's functions take.
        type EngineCell = ::std::rc::Rc<::std::cell::RefCell<$crate::engine::Engine<$grammar>>>;

        /// The engine `cell` holds, borrowed for one call. Refuses an
        /// engine a parse on it holds.
        fn engine_of(cell: &EngineCell) -> ::napi::Result<::std::cell::Ref<'_, $crate::engine::Engine<$grammar>>> {
            cell.try_borrow().map_err(|_| ::napi::Error::from_reason("the engine is in use"))
        }

        #[::napi_derive::napi]
        pub struct SittirEngine {
            engine: EngineCell,
        }

        #[::napi_derive::napi]
        impl SittirEngine {
            #[::napi_derive::napi(constructor)]
            pub fn new(options: Option<EngineOptions>) -> ::napi::Result<Self> {
                let table = match options.and_then(|opts| opts.options) {
                    Some(opts) => {
                        opts.resolve(&$defaults()).map_err(::napi::Error::from_reason)?
                    }
                    None => $defaults(),
                };
                let engine = $crate::engine::Engine::with_store(
                    <$grammar as ::std::default::Default>::default(),
                    table,
                    $crate::napi_engine::engine_store::<$grammar>(),
                )
                .map_err(::napi::Error::from_reason)?;
                Ok(Self { engine: ::std::rc::Rc::new(::std::cell::RefCell::new(engine)) })
            }

            /// The handle the module's functions on this engine's state take:
            /// one call reaches the engine through it with no borrow of this
            /// object.
            #[::napi_derive::napi(getter, ts_return_type = "object")]
            pub fn handle(&self) -> ::napi::bindgen_prelude::External<EngineCell> {
                ::napi::bindgen_prelude::External::new(::std::rc::Rc::clone(&self.engine))
            }

            #[::napi_derive::napi(getter)]
            pub fn render_module_hash(&self) -> ::napi::Result<&'static str> {
                Ok(engine_of(&self.engine)?.render_module_hash())
            }

            #[::napi_derive::napi(getter)]
            pub fn native_render_node_abi(&self) -> u32 {
                $abi
            }

            /// Compile profile baked into this binary — `"debug"` or `"release"`.
            /// Validators refuse debug binaries (known segfault class) unless
            /// `SITTIR_ALLOW_DEBUG_VALIDATE=1`; the binary self-reporting makes
            /// the gate immune to stale env assumptions.
            #[::napi_derive::napi(getter)]
            pub fn build_profile(&self) -> &'static str {
                if cfg!(debug_assertions) {
                    "debug"
                } else {
                    "release"
                }
            }

            #[::napi_derive::napi]
            pub fn find_and_read(
                &mut self,
                source: String,
                pattern: String,
            ) -> ::napi::Result<String> {
                self.engine
                    .try_borrow_mut()
                    .map_err(|_| ::napi::Error::from_reason("the engine is in use"))?
                    .find_and_read(source, pattern)
                    .map_err(::napi::Error::from_reason)
            }

            /// Parse `source` and keep its tree. As JSON `{ treeId, options,
            /// errors }`: the id `read` and `disposeTree` take, the tree's
            /// layer of the render options (`ParsedTree::inferred_options`),
            /// and its error regions.
            #[::napi_derive::napi]
            pub fn parse(&mut self, env: ::napi::Env, source: String) -> ::napi::Result<String> {
                let claim = $crate::engine::claim_tree_id().ok_or_else(|| {
                    ::napi::Error::from_reason(format!("this process exhausted its {} tree ids", $crate::engine::MAX_TREE_ID))
                })?;
                let tree_id = claim.id();
                let parsed = self
                    .engine
                    .try_borrow_mut()
                    .map_err(|_| ::napi::Error::from_reason("the engine is in use"))?
                    .parse(&source, claim)
                    .map_err(::napi::Error::from_reason)?;
                let json = ::serde_json::json!({
                    "treeId": tree_id,
                    "options": parsed.inferred_options(),
                    "errors": parsed.error_regions(),
                })
                .to_string();
                LIVE_TREES.with(|trees| $crate::engine::change_trees(trees).map(|mut trees| trees.insert(tree_id, parsed))).map_err(::napi::Error::from_reason)?;
                with_live_tree(&env, tree_id, |_| Ok(()))?;
                Ok(json)
            }

            /// Release the engine: it frees its built arena's chunks and
            /// detaches every buffer over them (`builtWords`, `builtBytes`),
            /// so a record they hold no longer renders as a trivia entry. The
            /// trees it parsed stay in the addon's table, since they belong to
            /// whoever still names them.
            #[::napi_derive::napi]
            pub fn dispose(&mut self, env: ::napi::Env) -> ::napi::Result<()> {
                $crate::napi_engine::release_built(&env, engine_of(&self.engine)?.written())
            }
        }

        /// The node at `index` of tree `treeId` read into its native node,
        /// `depth` levels down (one when absent, `Infinity` for all); index 0
        /// is the root. An `ERROR` node reads as its text and coordinate.
        /// Refuses a tree that is not live, an index past its last node,
        /// and a node the model has no route for, naming the kind, the
        /// child and the index.
        #[::napi_derive::napi(ts_return_type = "object")]
        pub fn read(env: ::napi::Env, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex, depth: Option<f64>) -> ::napi::Result<::napi::Either<$any, $crate::ErrorRead>> {
            let depth = $crate::napi_engine::depth_from_wire(depth)?;
            with_live_tree(&env, tree_id, |parsed| {
                read_node(parsed, index, depth)
            })
        }

        /// The sides of the unit children of the node at `index` of the
        /// live tree `treeId`, which their slots store as bare kinds: each
        /// `{ slot, item, leading?, trailing?, inner? }`, by its slot's wire
        /// key and its item in that slot. Refuses as `triviaSide` does.
        #[::napi_derive::napi(ts_return_type = "object[]")]
        pub fn unit_sides(env: ::napi::Env, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<Vec<$crate::layout::UnitSides<<$grammar as $crate::engine::EngineGrammar>::Trivia>>> {
            with_live_node(&env, tree_id, index, |parsed, index| Ok(parsed.unit_sides(index)))
        }

        /// The stored layout of each list slot of the node at `index` of
        /// the live tree `treeId` that stores any: each `{ slot, before?,
        /// after?, separator? }`, by its slot's wire key. Refuses as
        /// `triviaSide` does.
        #[::napi_derive::napi(ts_return_type = "object[]")]
        pub fn slot_layouts(env: ::napi::Env, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<Vec<$crate::layout::SlotLayout>> {
            with_live_node(&env, tree_id, index, |parsed, index| Ok(parsed.slot_layouts(index)))
        }

        /// The separator the list at `index` of the live tree `treeId`
        /// writes between its items, as a grammar id: the one its source
        /// spells where the slot stores one, else the one the read-time
        /// options render. Null for a node that is no list. Refuses as
        /// `triviaSide` does.
        #[::napi_derive::napi(ts_return_type = "import('../src/types.ts').TSKindId | null")]
        pub fn slot_separator(env: ::napi::Env, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<Option<$crate::types::KindId>> {
            with_live_node(&env, tree_id, index, |parsed, index| Ok(parsed.slot_separator(index)))
        }

        /// The separator before the node at `index` of the live tree
        /// `treeId` as an item of its parent's list slot, as a grammar id,
        /// where its source spells another than the one the slot renders.
        /// Refuses as `triviaSide` does.
        #[::napi_derive::napi(ts_return_type = "import('../src/types.ts').TSKindId | null")]
        pub fn separator_before(env: ::napi::Env, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<Option<$crate::types::KindId>> {
            with_live_node(&env, tree_id, index, |parsed, index| Ok(parsed.separator_before(index)))
        }

        /// A snapshot's layout of the node at `index` of the live tree
        /// `treeId` and of each node under it that a read gives a layout, as
        /// `[row, layout]` pairs in preorder (`ParsedTree::snapshot_layouts`):
        /// each with its span (`span`) from the native node that holds it and
        /// each placed extra and `ERROR` as its text, the node itself measured
        /// from the byte `holderByte`, or, when absent, from where it or its
        /// leading side begins, whichever is first. Refuses as `read` does,
        /// and a `holderByte` after the first byte the snapshot measures.
        #[::napi_derive::napi(ts_return_type = "[number, object][]")]
        pub fn snapshot_layouts(env: ::napi::Env, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex, holder_byte: Option<f64>) -> ::napi::Result<$crate::layout::SnapshotLayouts<<$grammar as $crate::engine::EngineGrammar>::Trivia>> {
            let holder_byte = holder_byte.map(|byte| $crate::napi_engine::checked_whole::<u32>(byte, "holderByte")).transpose()?;
            with_live_tree(&env, tree_id, |parsed| {
                $crate::napi_engine::answered(parsed, index, "snapshot panicked", || parsed.snapshot_layouts(index, holder_byte))
            })
        }

        /// The entries of `side` (`leading`, `trailing` or `inner`) of the
        /// node at `index` of the live tree `treeId`: the ones a write gave
        /// it, else the ones the tree's trivia placement assigns it. Refuses a
        /// tree that is not live, an index naming no node of it, and any
        /// other side.
        #[::napi_derive::napi(ts_return_type = "object[]")]
        pub fn trivia_side(
            env: ::napi::Env,
            tree_id: $crate::types::TreeId,
            index: $crate::types::NodeIndex,
            side: String,
        ) -> ::napi::Result<Vec<$crate::trivia::TriviaEntry<<$grammar as $crate::engine::EngineGrammar>::Trivia>>> {
            let side = $crate::napi_engine::trivia_side_from_wire(&side)?;
            with_live_node(&env, tree_id, index, |parsed, index| Ok(parsed.trivia_side(index, side)))
        }

        /// Replace `side` of the node at `index` of the live tree `treeId`
        /// with `entries`. A built record among them (`{ $type, $record }`)
        /// is a record of this engine's built arena, and renders from it
        /// wherever the side renders. Refuses as `triviaSide` does.
        #[::napi_derive::napi(ts_args_type = "treeId: number, index: number, side: string, entries: object[]")]
        pub fn write_trivia_side(
            env: ::napi::Env,
            tree_id: $crate::types::TreeId,
            index: $crate::types::NodeIndex,
            side: String,
            entries: Vec<$crate::trivia::TriviaEntry<<$grammar as $crate::engine::EngineGrammar>::Trivia>>,
        ) -> ::napi::Result<()> {
            let side = $crate::napi_engine::trivia_side_from_wire(&side)?;
            let store = with_live_node(&env, tree_id, index, |parsed, index| {
                parsed.write_trivia_side(index, side, entries).map_err(::napi::Error::from_reason)?;
                Ok(parsed.store().clone())
            })?;
            $crate::napi_engine::settle(&env, &store)
        }

        /// Whether a write replaced a side of a node under the node at
        /// `index` of the live tree `treeId`, its own `inner` included, and
        /// its own leading and trailing too when `ownSides` is set. Refuses
        /// a tree that is not live and an index naming no node of it.
        #[::napi_derive::napi]
        pub fn edited_within(env: ::napi::Env, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex, own_sides: bool) -> ::napi::Result<bool> {
            with_live_node(&env, tree_id, index, |parsed, index| Ok(parsed.edited_within(index, own_sides)))
        }

        /// The siblings that hold sides beside each node at `indexes` of the
        /// live tree `treeId` (`ParsedTree::siblings`), in order, eight words
        /// a node: the previous sibling, then the next, each as 1, its kind,
        /// its start and its end, or as four zeros where that node starts
        /// (ends) its parent. Each span is taken at the outermost node
        /// spanning exactly the node's bytes. Refuses a tree that is not live
        /// and an index naming no node of it.
        #[::napi_derive::napi]
        pub fn siblings(env: ::napi::Env, tree_id: $crate::types::TreeId, indexes: Vec<$crate::types::NodeIndex>) -> ::napi::Result<Vec<u32>> {
            with_live_tree(&env, tree_id, |parsed| {
                for &index in &indexes {
                    $crate::napi_engine::check_node(parsed, index)?;
                }
                Ok(parsed
                    .siblings(&indexes)
                    .into_iter()
                    .flat_map(|siblings| [siblings.previous, siblings.next])
                    .flat_map(|sibling| sibling.map_or([0; 4], |sibling| [1, u32::from(sibling.kind.0), sibling.start, sibling.end]))
                    .collect())
            })
        }

        /// The text `span` covers in the source of the live tree `treeId`:
        /// one string of that span's characters, so the source itself
        /// never crosses. Refuses a tree that is not live and a span that
        /// is not one of its source's: past its end, reversed, or
        /// splitting a character.
        #[::napi_derive::napi(ts_args_type = "treeId: number, span: { start: number; end: number }")]
        pub fn text(tree_id: $crate::types::TreeId, span: $crate::types::Span) -> ::napi::Result<String> {
            LIVE_TREES.with(|trees| {
                let trees = trees.borrow();
                let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                parsed.text(span).map(str::to_owned).ok_or_else(|| {
                    ::napi::Error::from_reason(format!("{}..{} is not a span of tree {tree_id}'s source", span.start, span.end))
                })
            })
        }

        /// Whether the node at `index` of the live tree `treeId` is empty:
        /// no child of it has width. Refuses a tree that is not live and an
        /// index naming no node of it.
        #[::napi_derive::napi]
        pub fn is_empty(env: ::napi::Env, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<bool> {
            with_live_node(&env, tree_id, index, |parsed, index| Ok(parsed.is_empty(index)))
        }

        /// Every run of whitespace a side of the live tree `treeId` takes
        /// (`Placement::runs`), each with the line breaks the options in
        /// effect at read time write there (`ParsedTree::baseline_gap`),
        /// absent where nothing the record wrote is anchored: read from
        /// each run's region, or from the record of the whole tree when
        /// `whole`. A diagnostic: the assignment reads the same breaks.
        /// Refuses a tree that is not live and a record whose read or
        /// render refused.
        #[::napi_derive::napi]
        pub fn layout_baseline(env: ::napi::Env, tree_id: $crate::types::TreeId, whole: Option<bool>) -> ::napi::Result<Vec<$crate::napi_engine::BaselineRun>> {
            with_live_node(&env, tree_id, $crate::types::NodeIndex::ROOT, |parsed, _| {
                let runs = parsed.baseline_runs(whole.unwrap_or(false)).map_err(::napi::Error::from_reason)?;
                Ok(runs.into_iter().map(|(run, written)| $crate::napi_engine::BaselineRun::new(run, written)).collect())
            })
        }

        /// How much of its layout the live tree `treeId` stores apart from
        /// its read-time options (`ParsedTree::stored_layout`): `{
        /// deviations, slots, separators }`. A diagnostic. Refuses a tree
        /// that is not live.
        #[::napi_derive::napi(ts_return_type = "{ deviations: number; slots: number; separators: number }")]
        pub fn stored_layout(env: ::napi::Env, tree_id: $crate::types::TreeId) -> ::napi::Result<$crate::layout::StoredLayout> {
            with_live_node(&env, tree_id, $crate::types::NodeIndex::ROOT, |parsed, _| Ok(parsed.stored_layout()))
        }

        /// The work the live tree `treeId`'s layout reads have done so far
        /// (`ParsedTree::layout_work`). A diagnostic. Refuses a tree that is
        /// not live.
        #[::napi_derive::napi]
        pub fn layout_work(env: ::napi::Env, tree_id: $crate::types::TreeId) -> ::napi::Result<$crate::layout::LayoutWork> {
            with_live_node(&env, tree_id, $crate::types::NodeIndex::ROOT, |parsed, _| Ok(parsed.layout_work()))
        }

        /// The bytes the node at `index` of the live tree `treeId` renders
        /// between as its source (`ParsedTree::framed_span_at`): `{ start,
        /// end }`. A diagnostic. Refuses as `read` does.
        #[::napi_derive::napi(ts_return_type = "{ start: number; end: number }")]
        pub fn framed_span(env: ::napi::Env, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<$crate::types::Span> {
            with_live_node(&env, tree_id, index, |parsed, index| {
                parsed.framed_span_at(index).ok_or_else(|| ::napi::Error::from_reason(format!("tree {tree_id} has no node {index}")))
            })
        }

        /// One batch of a pre-order walk of the named descendants under
        /// the node `from` names (JSON, see `query::Address`), filtered to
        /// `kinds` when given and to the `where` plan (JSON, see
        /// `query::PlanSpec`) when given, resuming after the path `resume`
        /// an earlier batch returned, `depth` levels down (every level
        /// when absent). As JSON `{ items, resume, origin }`. Refuses
        /// a tree that is not live and a plan whose pattern the native
        /// matcher cannot compile.
        #[::napi_derive::napi]
        pub fn descendants(
            env: ::napi::Env,
            from: String,
            #[napi(ts_arg_type = "Array<import('../src/types.ts').TSKindId> | undefined | null")] kinds: Option<Vec<$crate::types::KindId>>,
            resume: Option<Vec<$crate::types::ChildPosition>>,
            limit: f64,
            plan: Option<String>,
            depth: Option<f64>,
        ) -> ::napi::Result<String> {
            let limit: u32 = $crate::napi_engine::checked_whole(limit, "limit")?;
            let depth = depth.map(|levels| $crate::napi_engine::checked_whole::<u32>(levels, "depth")).transpose()?;
            let plan = plan.map(|json| $crate::napi_engine::compile_plan(&json)).transpose()?;
            let from = $crate::napi_engine::address_from_json(&from)?;
            let kinds = kinds.unwrap_or_default();
            let (tree_id, _) = $crate::engine::decode_handle(from.tree_handle());
            with_live_tree(&env, tree_id, |parsed| {
                let batch = parsed
                    .descendants(from, &kinds, plan.as_ref(), resume.as_deref(), limit.max(1), depth)
                    .map_err(::napi::Error::from_reason)?;
                ::serde_json::to_string(&batch).map_err(|e| ::napi::Error::from_reason(e.to_string()))
            })
        }

        /// The byte offsets of the lines under the node at `index` of the
        /// live tree `treeId` (its root when absent) that begin inside a
        /// token (`engine::line_starts_inside_tokens`): what anything that
        /// re-indents the tree's text leaves where it is. Refuses a tree
        /// that is not live and an index naming no node of it.
        #[::napi_derive::napi]
        pub fn line_starts_inside_tokens(tree_id: $crate::types::TreeId, index: Option<$crate::types::NodeIndex>) -> ::napi::Result<Vec<u32>> {
            let index = index.unwrap_or($crate::types::NodeIndex::ROOT);
            LIVE_TREES.with(|trees| {
                let trees = trees.borrow();
                let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                parsed.line_starts_inside_tokens(index).ok_or_else(|| ::napi::Error::from_reason(format!("index {index} names no node of tree {tree_id}")))
            })
        }

        /// Whether each node `addresses` names (a JSON array of
        /// `query::Address`, all in one tree) satisfies the `where` plan
        /// (JSON, see `query::PlanSpec`), in order. Refuses a tree that is
        /// not live, an address naming no node of it, and a plan whose
        /// pattern the native matcher cannot compile.
        #[::napi_derive::napi]
        pub fn plan_holds(env: ::napi::Env, addresses: String, plan: String) -> ::napi::Result<Vec<bool>> {
            let plan = $crate::napi_engine::compile_plan(&plan)?;
            let addresses: Vec<$crate::query::Address> =
                ::serde_json::from_str(&addresses).map_err(|e| ::napi::Error::from_reason(e.to_string()))?;
            let Some(first) = addresses.first() else { return Ok(Vec::new()) };
            let (tree_id, _) = $crate::engine::decode_handle(first.tree_handle());
            with_live_tree(&env, tree_id, |parsed| {
                parsed.plan_holds(&addresses, &plan).map_err(::napi::Error::from_reason)
            })
        }

        /// Render a typed node object (napi-native, numeric `$type`).
        ///
        /// The options a render takes are the call's own over the layer
        /// of the tree `treeId` names (`ParsedTree::inferred`), over the
        /// engine's. `treeId` is the tree the node was read from; a built
        /// node belongs to no tree and renders by the engine's options.
        #[::napi_derive::napi(
            ts_args_type = "engine: object, node: object, treeId?: number | undefined | null, options?: object | undefined | null",
            ts_return_type = "string"
        )]
        pub fn render(
            engine: &::napi::bindgen_prelude::External<EngineCell>,
            env: ::napi::Env,
            node: $render_root,
            tree_id: Option<$crate::types::TreeId>,
            options: Option<$options>,
        ) -> ::napi::Result<$crate::boundary::RenderedText> {
            let engine = engine_of(engine)?;
            // No JavaScript runs while the table is borrowed, so the
            // borrow cannot be re-entered.
            with_live_trees(&env, |trees| {
                let resolved = render_options(&engine, tree_id.and_then(|id| trees.get(id)), options)?;
                let table = &resolved;
                let canonical = $crate::napi_engine::entry_sources(engine.grammar(), trees, |sources| {
                    let ctx = $crate::prepare::RenderContext::new(table, sources);
                    $render_parts(node, &ctx, None).map(|(_, canonical)| canonical)
                })
                .map_err(|e| ::napi::Error::from_reason(format!("render_node failed: {e}")))?;
                Ok($crate::boundary::RenderedText($crate::line_endings::spell(canonical, &table.newline)))
            })
        }

        /// The node at `index` of the live tree `treeId` rendered as `render`
        /// renders the node a read of it gives: a render root whose
        /// `leading` and `trailing` edges have no neighbour, under `options`
        /// over the tree's layer over the engine's; `templates` renders it
        /// and each node under it that has a record from its template, each
        /// leaf and unit as its source (`render::ThroughTemplates`). Refuses a
        /// tree that is not live, an index naming no node of it, and a node
        /// whose read or render refuses.
        #[::napi_derive::napi(ts_args_type = "engine: object, treeId: number, index: number, leading: boolean, trailing: boolean, options?: object | undefined | null, templates?: boolean | undefined | null", ts_return_type = "string")]
        #[allow(clippy::too_many_arguments, reason = "each parameter is one of the JavaScript call's arguments")]
        pub fn render_at(
            engine: &::napi::bindgen_prelude::External<EngineCell>,
            env: ::napi::Env,
            tree_id: $crate::types::TreeId,
            index: $crate::types::NodeIndex,
            leading: bool,
            trailing: bool,
            options: Option<$options>,
            templates: Option<bool>,
        ) -> ::napi::Result<$crate::boundary::RenderedText> {
            let engine = engine_of(engine)?;
            with_live_trees(&env, |trees| {
                let parsed = trees.get(tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                $crate::napi_engine::check_node(parsed, index)?;
                let table = render_options(&engine, Some(parsed), options)?;
                let canonical = $crate::napi_engine::entry_sources(engine.grammar(), trees, |sources| {
                    let coord = $crate::render::SourceTable::row_coordinate(sources, tree_id, index).ok_or_else(|| format!("index {} names no node of tree {}", index.0, tree_id.0))?;
                    let through = $crate::render::ThroughTemplates(sources);
                    let sources: &dyn $crate::render::SourceTable = if templates == Some(true) { &through } else { sources };
                    let ctx = $crate::prepare::RenderContext::new(&table, sources);
                    $render_parts($crate::SlotValue::Coord(coord.with_changed($crate::slot::ChangedEdges { leading, trailing })), &ctx, None).map(|(_, canonical)| canonical).map_err(|e| e.to_string())
                })
                .map_err(|e| ::napi::Error::from_reason(format!("render_at failed: {e}")))?;
                Ok($crate::boundary::RenderedText($crate::line_endings::spell(canonical, &table.newline)))
            })
        }

        /// `render`'s text written to `path` (`save_rendered`), answering
        /// whether it wrote: `create` refuses a file at the path, and
        /// otherwise a file already holding the text is left untouched.
        #[::napi_derive::napi(
            ts_args_type = "engine: object, node: object, path: string, create: boolean, treeId?: number | undefined | null, options?: object | undefined | null"
        )]
        pub fn render_to_file(
            engine: &::napi::bindgen_prelude::External<EngineCell>,
            env: ::napi::Env,
            node: $render_root,
            path: String,
            create: bool,
            tree_id: Option<$crate::types::TreeId>,
            options: Option<$options>,
        ) -> ::napi::Result<bool> {
            let rendered = render(engine, env, node, tree_id, options)?;
            $crate::napi_engine::save_rendered(&path, &rendered.0, create)
        }

        /// `text`, which a render interceptor produced in JavaScript,
        /// written to `path` as a render's file sibling writes its text
        /// (`save_rendered`), answering whether it wrote.
        #[::napi_derive::napi]
        pub fn write_text(path: String, text: String, create: bool) -> ::napi::Result<bool> {
            $crate::napi_engine::save_rendered(&path, &text, create)
        }

        /// The options a render of a node of `tree` takes: `options` over
        /// the tree's layer (`ParsedTree::inferred`) over `engine`'s. A node
        /// of no tree takes `options` over the engine's.
        fn render_options(
            engine: &$crate::engine::Engine<$grammar>,
            tree: Option<&$crate::ParsedTree<$grammar>>,
            options: Option<$options>,
        ) -> ::napi::Result<$crate::options::ResolvedOptions> {
            let base = match tree {
                Some(tree) => tree.inferred().over(engine.options()),
                None => engine.options().clone(),
            };
            match options {
                Some(opts) => opts.resolve(&base).map_err(::napi::Error::from_reason),
                None => Ok(base),
            }
        }

        $crate::records_codec! {
            /// The tag words of a parsed cell whose slot holds more than one
            /// form (`arena::cell::parsed_tag`).
            #[::napi_derive::napi]
            pub const CELL_TAG_ABSENT: u32 = $crate::arena::cell::parsed_tag::ABSENT;
            #[::napi_derive::napi]
            pub const CELL_TAG_NODE: u32 = $crate::arena::cell::parsed_tag::NODE;
            #[::napi_derive::napi]
            pub const CELL_TAG_UNIT: u32 = $crate::arena::cell::parsed_tag::UNIT;
            #[::napi_derive::napi]
            pub const CELL_TAG_TEXT: u32 = $crate::arena::cell::parsed_tag::TEXT;
            #[::napi_derive::napi]
            pub const CELL_TAG_INLINE: u32 = $crate::arena::cell::parsed_tag::INLINE;
            /// The forms a slot's `forms` stamp names (`record::form`).
            #[::napi_derive::napi]
            pub const CELL_FORM_NODE: u32 = $crate::record::form::NODE as u32;
            #[::napi_derive::napi]
            pub const CELL_FORM_UNIT: u32 = $crate::record::form::UNIT as u32;
            #[::napi_derive::napi]
            pub const CELL_FORM_TEXT: u32 = $crate::record::form::TEXT as u32;
            #[::napi_derive::napi]
            pub const CELL_FORM_INLINE: u32 = $crate::record::form::INLINE as u32;
            #[::napi_derive::napi]
            pub const CELL_FORM_BLANK: u32 = $crate::record::form::BLANK as u32;
            /// The bit a node cell's span end carries for a leaf
            /// (`record::form::LEAF`).
            #[::napi_derive::napi]
            pub const CELL_LEAF_BIT: u32 = $crate::record::form::LEAF;
            /// The chunk-0 offset a built blank arm's cell names
            /// (`arena::cell::BLANK_UNIT`).
            #[::napi_derive::napi]
            pub const CELL_BLANK_UNIT: u32 = $crate::arena::cell::BLANK_UNIT;
            /// The bits a record header's or a leaf entry's kind field takes
            /// in the built arena (`EngineGrammar::KIND_BITS`).
            #[::napi_derive::napi]
            pub const KIND_BITS: u32 = <$grammar as $crate::engine::EngineGrammar>::KIND_BITS;
            /// The flag above a link record's kind field (`arena::cell::flag`).
            #[::napi_derive::napi]
            pub const RECORD_FLAG_LINK: u32 = $crate::arena::cell::flag::LINK;
            /// The words of a link record (`arena::cell::LINK_WORDS`).
            #[::napi_derive::napi]
            pub const LINK_RECORD_WORDS: u32 = $crate::arena::cell::LINK_WORDS;
            /// The words of a record header (`record::HEADER_WORDS`), the
            /// least an embedded record takes.
            #[::napi_derive::napi]
            pub const RECORD_HEADER_WORDS: u32 = $crate::record::HEADER_WORDS;
            /// The flag of a built entry's count byte the handle its
            /// builder returned holds (`count::OWNED`).
            #[::napi_derive::napi]
            pub const COUNT_OWNED: u32 = $crate::arena::count::OWNED as u32;
            /// The count a built entry's count byte saturates at
            /// (`count::SATURATED`).
            #[::napi_derive::napi]
            pub const COUNT_SATURATED: u32 = $crate::arena::count::SATURATED as u32;
            /// The tags `releaseBuilt` reads (`count::held`): a record, a
            /// run, a side record, a leaf entry.
            #[::napi_derive::napi]
            pub const HELD_RECORD: u32 = $crate::arena::count::held::RECORD;
            #[::napi_derive::napi]
            pub const HELD_RUN: u32 = $crate::arena::count::held::RUN;
            #[::napi_derive::napi]
            pub const HELD_SIDE: u32 = $crate::arena::count::held::SIDE;
            #[::napi_derive::napi]
            pub const HELD_TEXT: u32 = $crate::arena::count::held::TEXT;
            /// The bits of a packed record address or string offset below its
            /// chunk (`arena::CHUNK_SHIFT`).
            #[::napi_derive::napi]
            pub const ARENA_CHUNK_SHIFT: u32 = $crate::arena::CHUNK_SHIFT;
            /// A side record's fields before a list's delimiters setting, each
            /// one's mask bit and its words (`arena::side::field`).
            #[::napi_derive::napi]
            pub const SIDE_FIELD_AT: u32 = $crate::arena::side::field::AT;
            #[::napi_derive::napi]
            pub const SIDE_WORDS_AT: u32 = $crate::arena::side::field::AT_WORDS;
            #[::napi_derive::napi]
            pub const SIDE_FIELD_EDGES: u32 = $crate::arena::side::field::EDGES;
            #[::napi_derive::napi]
            pub const SIDE_WORDS_EDGES: u32 = $crate::arena::side::field::EDGES_WORDS;
            #[::napi_derive::napi]
            pub const SIDE_FIELD_SPAN: u32 = $crate::arena::side::field::SPAN;
            #[::napi_derive::napi]
            pub const SIDE_WORDS_SPAN: u32 = $crate::arena::side::field::SPAN_WORDS;
            #[::napi_derive::napi]
            pub const SIDE_FIELD_SIDES: u32 = $crate::arena::side::field::SIDES;
            #[::napi_derive::napi]
            pub const SIDE_WORDS_SIDES: u32 = $crate::arena::side::field::SIDES_WORDS;
            #[::napi_derive::napi]
            pub const SIDE_FIELD_CHANGED_LEADING: u32 = $crate::arena::side::field::CHANGED_LEADING;
            #[::napi_derive::napi]
            pub const SIDE_FIELD_CHANGED_TRAILING: u32 = $crate::arena::side::field::CHANGED_TRAILING;
            #[::napi_derive::napi]
            pub const SIDE_FIELD_SEPARATOR: u32 = $crate::arena::side::field::SEPARATOR;
            #[::napi_derive::napi]
            pub const SIDE_WORDS_SEPARATOR: u32 = $crate::arena::side::field::SEPARATOR_WORDS;
            #[::napi_derive::napi]
            pub const SIDE_FIELD_DELIMITER: u32 = $crate::arena::side::field::DELIMITER;
            #[::napi_derive::napi]
            pub const SIDE_FIELD_SEPARATOR_KIND: u32 = $crate::arena::side::field::SEPARATOR_KIND;

            /// The address of the record of the node at `index` of `parsed`
            /// (`ParsedTree::read_record`), `None` for a node with no record.
            fn record_of(
                parsed: &$crate::ParsedTree<$grammar>,
                index: $crate::types::NodeIndex,
                depth: $crate::read::Depth,
                hydrate: bool,
            ) -> ::napi::Result<Option<u32>> {
                $crate::napi_engine::check_node(parsed, index)?;
                ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| {
                    if hydrate { parsed.hydrate_record::<$any>(index, depth) } else { parsed.read_record::<$any>(index, depth) }
                }))
                    .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(&*payload, "read panicked")))?
                    .map(|at| at.map(|at| at.0))
                    .map_err(::napi::Error::from_reason)
            }

            /// What `render` answers for the built arena `owner` holds,
            /// borrowed for this call, under `options` over `engine`'s, with
            /// every live tree held, its line endings spelled.
            fn render_built_with(
                engine: &$crate::engine::Engine<$grammar>,
                env: &::napi::Env,
                owner: &$crate::engine::Engine<$grammar>,
                tree_id: Option<$crate::types::TreeId>,
                options: Option<$options>,
                render: impl FnOnce(
                    &dyn $crate::arena::ArenaRead,
                    &$crate::engine::ReadTrees<'_, $grammar>,
                    &$crate::prepare::RenderContext<'_>,
                ) -> Result<String, $crate::render::RenderError>,
            ) -> ::napi::Result<$crate::boundary::RenderedText> {
                let chunks = owner.written().built();
                let arena = chunks.readable().map_err(|e| ::napi::Error::from_reason(e.to_string()))?;
                with_live_trees(env, |trees| {
                    let table = render_options(engine, tree_id.and_then(|id| trees.get(id)), options)?;
                    let canonical = $crate::napi_engine::entry_sources(engine.grammar(), trees, |sources| {
                        let ctx = $crate::prepare::RenderContext::new(&table, sources);
                        ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| render(arena, trees, &ctx)))
                    })
                        .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(&*payload, "render_built panicked")))?
                        .map_err(|e| ::napi::Error::from_reason(format!("render_built failed: {e}")))?;
                    Ok($crate::boundary::RenderedText($crate::line_endings::spell(canonical, &table.newline)))
                })
            }

            /// The record wire: a node's record named by its tree and its
            /// address together, so an address reads nothing once its tree is
            /// gone.
            /// The address of the record of the node at `index` of the live
            /// tree `treeId`: the one a read wrote, else the one its read
            /// `depth` levels down (one when absent, `Infinity` for all)
            /// writes now. Null for a node with no record: a parsed leaf, or
            /// an `ERROR` node. Refuses as `read` does.
            #[::napi_derive::napi]
            pub fn read_record(env: ::napi::Env, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex, depth: Option<f64>) -> ::napi::Result<Option<u32>> {
                let depth = $crate::napi_engine::depth_from_wire(depth)?;
                with_live_tree(&env, tree_id, |parsed| {
                    let at = record_of(parsed, index, depth, false)?;
                    Ok(at)
                })
            }

            /// `read_record`'s record with what a view of it is named by,
            /// read without its chunk (`ParsedTree::record_stub`):
            /// `[address, header, row, end, span start, span end, kind]`.
            /// Null for a node with no record. Refuses as `read_record` does.
            #[::napi_derive::napi]
            pub fn read_record_stub(env: ::napi::Env, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex, depth: Option<f64>) -> ::napi::Result<Option<Vec<u32>>> {
                let depth = $crate::napi_engine::depth_from_wire(depth)?;
                with_live_tree(&env, tree_id, |parsed| {
                    let at = record_of(parsed, index, depth, false)?;
                    let Some(at) = at else { return Ok(None) };
                    let stub = parsed.record_stub($crate::arena::Address(at)).map_err(::napi::Error::from_reason)?;
                    Ok(Some([at].into_iter().chain(stub).collect()))
                })
            }

            /// The node at `index` of the live tree `treeId` that has no
            /// record, read from its holder's cell or its row
            /// (`ParsedTree::read_leaf`): `[kind, start, end]` for a leaf,
            /// `[kind]` for a unit, the kind it reads as. Null for a node with
            /// a record of its own, a node neither answers, and a tree no
            /// whole read hydrated. Refuses as `read` does, and records it
            /// cannot read.
            #[::napi_derive::napi]
            pub fn read_leaf(env: ::napi::Env, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<Option<Vec<u32>>> {
                with_live_node(&env, tree_id, index, |parsed, index| {
                    let leaf = parsed.read_leaf::<$any>(index).map_err(|error| ::napi::Error::from_reason(error.to_string()))?;
                    Ok(leaf.map(|leaf| match leaf {
                        $crate::arena::LeafRead::Leaf { kind, span } => vec![u32::from(kind.0), span.start, span.end],
                        $crate::arena::LeafRead::Unit(kind) => vec![u32::from(kind.0)],
                    }))
                })
            }

            /// Materializes the node at `index` in the live tree `treeId`
            /// to `depth` (one when absent, `Infinity` for all), including
            /// children of records already present. Returns only the root
            /// address, or null for a leaf or `ERROR`; JavaScript reads the
            /// records through the tree's chunks (`chunk`).
            #[::napi_derive::napi]
            pub fn hydrate_record(env: ::napi::Env, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex, depth: Option<f64>) -> ::napi::Result<Option<u32>> {
                let depth = $crate::napi_engine::depth_from_wire(depth)?;
                with_live_tree(&env, tree_id, |parsed| {
                    let at = record_of(parsed, index, depth, true)?;
                    Ok(at)
                })
            }

            /// Whether the record backer answers every node of the live tree
            /// `treeId`, read whole, as the tree backer does
            /// (`ParsedTree::backer_parity`): `{ nodes, differing, first? }`.
            /// A diagnostic. Refuses a tree that is not live and a read the
            /// model refuses.
            #[::napi_derive::napi(ts_return_type = "{ nodes: number; differing: number; first?: number }")]
            pub fn backer_parity(env: ::napi::Env, tree_id: $crate::types::TreeId) -> ::napi::Result<$crate::arena::BackerParity> {
                with_live_tree(&env, tree_id, |parsed| {
                    ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| parsed.backer_parity::<$any>()))
                        .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(&*payload, "backer parity panicked")))?
                        .map_err(::napi::Error::from_reason)
                })
            }

            /// The address of the record the parsed cell at `word`, item
            /// `item` (0 for a slot of one value), of the record at
            /// `holder` names, in the live tree `treeId`: on the first read
            /// through the cell, its record written `depth` levels down
            /// (one when absent) and the cell rewritten to name it. Refuses
            /// a holder no read wrote, a word that is no slot's, an item
            /// past its list, and a cell that names no record.
            #[::napi_derive::napi]
            pub fn read_cell(env: ::napi::Env, tree_id: $crate::types::TreeId, holder: u32, word: u32, item: u32, depth: Option<f64>) -> ::napi::Result<u32> {
                let depth = $crate::napi_engine::depth_from_wire(depth)?;
                with_live_tree(&env, tree_id, |parsed| {
                    let at = ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| parsed.read_cell::<$any>($crate::arena::Address(holder), word, item, depth)))
                        .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(&*payload, "read panicked")))?
                        .map_err(::napi::Error::from_reason)?;
                    Ok(at.0)
                })
            }

            /// The nodes at `indexes` of the live tree `treeId`, in order:
            /// each read as `read` reads it when `wire` is `object`, and,
            /// when it is `record`, each record's address as `readRecord`
            /// answers it, 0 for a node with no record, in one
            /// `Uint32Array`. Refuses as `read` does at the first index it
            /// refuses, and any other wire.
            #[::napi_derive::napi(ts_return_type = "Array<object> | Uint32Array")]
            pub fn read_many(
                env: ::napi::Env,
                tree_id: $crate::types::TreeId,
                indexes: Vec<$crate::types::NodeIndex>,
                depth: Option<f64>,
                wire: String,
            ) -> ::napi::Result<::napi::Either<Vec<::napi::Either<$any, $crate::ErrorRead>>, ::napi::bindgen_prelude::Uint32Array>> {
                let depth = $crate::napi_engine::depth_from_wire(depth)?;
                with_live_tree(&env, tree_id, |parsed| {
                    match wire.as_str() {
                        "object" => indexes.into_iter().map(|index| read_node(parsed, index, depth)).collect::<::napi::Result<_>>().map(::napi::Either::A),
                        "record" => indexes
                            .into_iter()
                            .map(|index| record_of(parsed, index, depth, false).map(|at| at.unwrap_or(0)))
                            .collect::<::napi::Result<Vec<u32>>>()
                            .map(|addresses| ::napi::Either::B(::napi::bindgen_prelude::Uint32Array::new(addresses))),
                        other => Err(::napi::Error::from_reason(format!("{other:?} is not a read wire (object or record)"))),
                    }
                })
            }

            /// The record at `address` of the live tree `treeId` rendered, as
            /// `render` renders a node read from the tree: a render root
            /// whose `leading` and `trailing` edges have no neighbour, as
            /// the node crossing as its coordinate marks them, under
            /// `options` over the tree's layer over the engine's, each
            /// trivia entry's built record from its store's arena;
            /// `templates` renders it and every parsed node under it that
            /// has a record from its template, each leaf and unit as its
            /// source (`render::ThroughTemplates`). Refuses a tree that is
            /// not live, an address naming no record of its arena, and a
            /// record whose read or render refuses.
            #[::napi_derive::napi(ts_args_type = "engine: object, treeId: number, address: number, leading: boolean, trailing: boolean, options?: object | undefined | null, templates?: boolean | undefined | null", ts_return_type = "string")]
            #[allow(clippy::too_many_arguments, reason = "each parameter is one of the JavaScript call's arguments")]
            pub fn render_record(engine: &::napi::bindgen_prelude::External<EngineCell>, env: ::napi::Env, tree_id: $crate::types::TreeId, address: f64, leading: bool, trailing: bool, options: Option<$options>, templates: Option<bool>) -> ::napi::Result<$crate::boundary::RenderedText> {
                let engine = engine_of(engine)?;
                let address = $crate::arena::Address($crate::napi_engine::checked_whole(address, "address")?);
                let changed = $crate::slot::ChangedEdges { leading, trailing };
                with_live_trees(&env, |trees| {
                    let parsed = trees.get(tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                    let table = render_options(&engine, Some(parsed), options)?;
                    let canonical = $crate::napi_engine::entry_sources(engine.grammar(), trees, |sources| {
                        ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| {
                            if templates == Some(true) {
                                parsed.render_record(address, changed, &table, &$crate::render::ThroughTemplates(sources))
                            } else {
                                parsed.render_record(address, changed, &table, sources)
                            }
                        }))
                    })
                    .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(&*payload, "render_record panicked")))?
                    .map_err(|e| ::napi::Error::from_reason(format!("render_record failed: {e}")))?;
                    Ok($crate::boundary::RenderedText($crate::line_endings::spell(canonical, &table.newline)))
                })
            }

            /// `render_record`'s text written to `path` (`save_rendered`),
            /// answering whether it wrote.
            #[::napi_derive::napi(ts_args_type = "engine: object, treeId: number, address: number, leading: boolean, trailing: boolean, path: string, create: boolean, options?: object | undefined | null")]
            #[allow(clippy::too_many_arguments, reason = "each parameter is one of the JavaScript call's arguments")]
            pub fn render_record_to_file(engine: &::napi::bindgen_prelude::External<EngineCell>, env: ::napi::Env, tree_id: $crate::types::TreeId, address: f64, leading: bool, trailing: bool, path: String, create: bool, options: Option<$options>) -> ::napi::Result<bool> {
                let rendered = render_record(engine, env, tree_id, address, leading, trailing, options, None)?;
                $crate::napi_engine::save_rendered(&path, &rendered.0, create)
            }

            /// The record at `address` of the built arena `owner` holds, a
            /// built one or one a read left, rendered as a render root whose
            /// `leading` and `trailing` edges have no neighbour, from the
            /// arena alone (`Engine::render_at`), with the sides `owner`
            /// holds: the engine that built the arena, which its records'
            /// side writes went to. Its options are `options` over the layer
            /// a source's read inferred over this engine's: the source of
            /// the record itself when a read left it, else of the record at
            /// `source`, the one the root was rebuilt from; a root of no
            /// source takes `options` over the engine's. Its line endings
            /// are spelled. Refuses an address naming no record its words
            /// admit, a `source` no read wrote, and a record whose render
            /// refuses.
            #[::napi_derive::napi(ts_args_type = "engine: object, owner: object, address: number, leading: boolean, trailing: boolean, source?: number | undefined | null, options?: object | undefined | null", ts_return_type = "string")]
            pub fn render_built(engine: &::napi::bindgen_prelude::External<EngineCell>, owner: &::napi::bindgen_prelude::External<EngineCell>, address: f64, leading: bool, trailing: bool, source: Option<f64>, options: Option<$options>) -> ::napi::Result<$crate::boundary::RenderedText> {
                use $crate::arena::ArenaRead;
                let engine = engine_of(engine)?;
                let owner = engine_of(owner)?;
                let at = $crate::arena::Address($crate::napi_engine::checked_whole(address, "address")?);
                let changed = $crate::slot::ChangedEdges { leading, trailing };
                let chunks = owner.written().built();
                let built = chunks.readable().map_err(|e| ::napi::Error::from_reason(e.to_string()))?;
                let refused = |e: $crate::arena::ArenaError| ::napi::Error::from_reason(format!("render_built failed: {e}"));
                let read = if built.read_record(at) {
                    Some(at)
                } else {
                    source.map(|source| $crate::napi_engine::checked_whole(source, "source").map($crate::arena::Address)).transpose()?
                };
                let base = match read {
                    Some(record) => $crate::arena::source::Source::read(built, $crate::arena::RunNodes::source_of(built, record).map_err(refused)?).map_err(refused)?.inferred.over(engine.options()),
                    None => engine.options().clone(),
                };
                let table = match options {
                    Some(options) => options.resolve(&base).map_err(::napi::Error::from_reason)?,
                    None => base,
                };
                let canonical = ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| owner.render_at(built, at, changed, &table, false, $crate::napi_engine::admit_entry::<$grammar>)))
                    .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(&*payload, "render_built panicked")))?
                    .map_err(|e| ::napi::Error::from_reason(format!("render_built failed: {e}")))?;
                Ok($crate::boundary::RenderedText($crate::line_endings::spell(canonical, &table.newline)))
            }

            /// Runs `f` on the node a read left that the key `node` names
            /// (`NodeName::key`): the tree over its source's records, made
            /// for this call, and the id the call gives the node. Refuses an
            /// engine already disposed, a number that is no key, and a name
            /// no read's record holds.
            fn with_read_node<R>(
                engine: &::napi::bindgen_prelude::External<EngineCell>,
                node: f64,
                f: impl FnOnce(&$crate::ParsedTree<$grammar, $crate::engine::Records<'_>>, $crate::types::NodeIndex) -> ::napi::Result<R>,
            ) -> ::napi::Result<R> {
                let engine = engine_of(engine)?;
                let name = $crate::napi_engine::named_key(node)?;
                engine
                    .read_named(name, f)
                    .map_err(|e| ::napi::Error::from_reason(e.to_string()))?
                    .ok_or_else(|| ::napi::Error::from_reason(format!("no read wrote the record at {}", name.node.0)))?
            }

            /// `renderAt` for the node a read left in the built arena that
            /// the key `node` names: rendered as a render root whose
            /// `leading` and `trailing` edges have no neighbour, under
            /// `options` over the layer its source's read inferred over the
            /// engine's, from the arena alone; `templates` as `renderAt`.
            /// Refuses an engine already disposed, a number that is no key,
            /// a name no read's record holds, and a node whose render
            /// refuses.
            #[::napi_derive::napi(ts_args_type = "engine: object, node: number, leading: boolean, trailing: boolean, options?: object | undefined | null, templates?: boolean | undefined | null", ts_return_type = "string")]
            pub fn read_render_at(engine: &::napi::bindgen_prelude::External<EngineCell>, node: f64, leading: bool, trailing: bool, options: Option<$options>, templates: Option<bool>) -> ::napi::Result<$crate::boundary::RenderedText> {
                let engine = engine_of(engine)?;
                let name = $crate::napi_engine::named_key(node)?;
                let built = engine.written().built();
                built.readable().map_err(|e| ::napi::Error::from_reason(e.to_string()))?;
                let refused = |e: $crate::arena::ArenaError| ::napi::Error::from_reason(format!("render_at failed: {e}"));
                let tree_id = $crate::types::TreeId($crate::arena::RunNodes::source_of(&*built, $crate::arena::Address(name.node.0)).map_err(refused)?.0);
                let base = $crate::arena::source::Source::read(&*built, $crate::arena::Address(tree_id.0)).map_err(refused)?.inferred.over(engine.options());
                let table = match options {
                    Some(options) => options.resolve(&base).map_err(::napi::Error::from_reason)?,
                    None => base,
                };
                if name.site.is_none() {
                    let changed = $crate::slot::ChangedEdges { leading, trailing };
                    let canonical = ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| engine.render_at(&built, $crate::arena::Address(name.node.0), changed, &table, templates == Some(true), $crate::napi_engine::admit_entry::<$grammar>)))
                        .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(&*payload, "render_at panicked")))?
                        .map_err(|e| ::napi::Error::from_reason(format!("render_at failed: {e}")))?;
                    return Ok($crate::boundary::RenderedText($crate::line_endings::spell(canonical, &table.newline)));
                }
                let trees = $crate::engine::SourceTrees::new(&engine, &built, $crate::napi_engine::admit_entry::<$grammar>);
                let read = $crate::engine::ReadTrees::over(&trees);
                let no_node = || ::napi::Error::from_reason(format!("no read wrote a node named {name:?}"));
                let index = read.holding(tree_id, $crate::arena::Address(name.node.0)).and_then(|tree| tree.index_named(name)).ok_or_else(no_node)?;
                let coord = $crate::render::SourceTable::row_coordinate(&read, tree_id, index).ok_or_else(no_node)?;
                let through = $crate::render::ThroughTemplates(&read);
                let sources: &dyn $crate::render::SourceTable = if templates == Some(true) { &through } else { &read };
                let ctx = $crate::prepare::RenderContext::new(&table, sources);
                let canonical = $render_parts($crate::SlotValue::Coord(coord.with_changed($crate::slot::ChangedEdges { leading, trailing })), &ctx, None)
                    .map(|(_, canonical)| canonical)
                    .map_err(|e| ::napi::Error::from_reason(format!("render_at failed: {e}")))?;
                Ok($crate::boundary::RenderedText($crate::line_endings::spell(canonical, &table.newline)))
            }

            /// `snapshotLayouts` for the node a read left that the key
            /// `node` names, as `[key, layout]` pairs in preorder, each
            /// node a record or a slot names by its key (`NodeName::key`). Refuses as
            /// `with_read_node` and as `snapshotLayouts`.
            #[::napi_derive::napi(ts_return_type = "[number, object][]")]
            pub fn read_snapshot_layouts(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, node: f64, holder_byte: Option<f64>) -> ::napi::Result<Vec<(f64, Box<$crate::layout::NodeLayout<<$grammar as $crate::engine::EngineGrammar>::Trivia>>)>> {
                let holder_byte = holder_byte.map(|byte| $crate::napi_engine::checked_whole::<u32>(byte, "holderByte")).transpose()?;
                with_read_node(engine, node, |tree, index| {
                    $crate::napi_engine::answered(tree, index, "snapshot panicked", || tree.snapshot_layouts(index, holder_byte))?
                        .into_iter()
                        .filter_map(|(index, layout)| $crate::napi_engine::node_key(tree, index).map(|key| key.map(|key| (key, layout))).transpose())
                        .collect()
                })
            }

            /// `triviaSide` for the node a read left that the key `node`
            /// names. Refuses as `with_read_node`, and any other side.
            #[::napi_derive::napi(ts_return_type = "object[]")]
            pub fn read_trivia_side(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, node: f64, side: String) -> ::napi::Result<Vec<$crate::trivia::TriviaEntry<<$grammar as $crate::engine::EngineGrammar>::Trivia>>> {
                let side = $crate::napi_engine::trivia_side_from_wire(&side)?;
                with_read_node(engine, node, |tree, index| Ok(tree.trivia_side(index, side)))
            }

            /// Replaces `side` of the node a read left that the key `node`
            /// names with `entries`, which its render then writes. Refuses
            /// an engine already disposed, a number that is no key, a name
            /// whose record names no source, and any other side.
            #[::napi_derive::napi(ts_args_type = "engine: object, node: number, side: string, entries: object[]")]
            pub fn write_read_trivia_side(engine: &::napi::bindgen_prelude::External<EngineCell>, env: ::napi::Env, node: f64, side: String, entries: Vec<$crate::trivia::TriviaEntry<<$grammar as $crate::engine::EngineGrammar>::Trivia>>) -> ::napi::Result<()> {
                let engine = engine_of(engine)?;
                let side = $crate::napi_engine::trivia_side_from_wire(&side)?;
                engine.write_read_side($crate::napi_engine::named_key(node)?, side, entries).map_err(|e| ::napi::Error::from_reason(e.to_string()))?;
                $crate::napi_engine::settle(&env, engine.written())
            }

            /// `unitSides` for the node a read left that the key `node` names.
            #[::napi_derive::napi(ts_return_type = "object[]")]
            pub fn read_unit_sides(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, node: f64) -> ::napi::Result<Vec<$crate::layout::UnitSides<<$grammar as $crate::engine::EngineGrammar>::Trivia>>> {
                with_read_node(engine, node, |tree, index| Ok(tree.unit_sides(index)))
            }

            /// `slotLayouts` for the node a read left that the key `node` names.
            #[::napi_derive::napi(ts_return_type = "object[]")]
            pub fn read_slot_layouts(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, node: f64) -> ::napi::Result<Vec<$crate::layout::SlotLayout>> {
                with_read_node(engine, node, |tree, index| Ok(tree.slot_layouts(index)))
            }

            /// `slotSeparator` for the node a read left that the key `node` names.
            #[::napi_derive::napi(ts_return_type = "import('../src/types.ts').TSKindId | null")]
            pub fn read_slot_separator(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, node: f64) -> ::napi::Result<Option<$crate::types::KindId>> {
                with_read_node(engine, node, |tree, index| Ok(tree.slot_separator(index)))
            }

            /// `separatorBefore` for the node a read left that the key `node` names.
            #[::napi_derive::napi(ts_return_type = "import('../src/types.ts').TSKindId | null")]
            pub fn read_separator_before(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, node: f64) -> ::napi::Result<Option<$crate::types::KindId>> {
                with_read_node(engine, node, |tree, index| Ok(tree.separator_before(index)))
            }

            /// `editedWithin` for the node a read left that the key `node` names.
            #[::napi_derive::napi]
            pub fn read_edited_within(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, node: f64, own_sides: bool) -> ::napi::Result<bool> {
                with_read_node(engine, node, |tree, index| Ok(tree.edited_within(index, own_sides)))
            }

            /// `siblings` for the nodes reads left that the keys `nodes`
            /// name, in order, eight words a node, each from its own source.
            /// Refuses an engine already disposed, a number that is no key
            /// and a name no read's record holds.
            #[::napi_derive::napi]
            pub fn read_siblings(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, nodes: Vec<f64>) -> ::napi::Result<Vec<u32>> {
                let engine = engine_of(engine)?;
                let names = nodes.into_iter().map($crate::napi_engine::named_key).collect::<::napi::Result<Vec<_>>>()?;
                Ok(engine
                    .siblings_of(&names)
                    .map_err(|e| ::napi::Error::from_reason(e.to_string()))?
                    .into_iter()
                    .flat_map(|siblings| [siblings.previous, siblings.next])
                    .flat_map(|sibling| sibling.map_or([0; 4], |sibling| [1, u32::from(sibling.kind.0), sibling.start, sibling.end]))
                    .collect())
            }

            /// The address of the source entry each node a read left that
            /// the keys `nodes` name was read from, in order. Refuses an
            /// engine already disposed and a number that is no key.
            #[::napi_derive::napi]
            pub fn read_sources(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, nodes: Vec<f64>) -> ::napi::Result<Vec<f64>> {
                let engine = engine_of(engine)?;
                let names = nodes.into_iter().map($crate::napi_engine::named_key).collect::<::napi::Result<Vec<_>>>()?;
                Ok(engine.sources_of(&names).map_err(|e| ::napi::Error::from_reason(e.to_string()))?.into_iter().map(|source| f64::from(source.0)).collect())
            }

            /// `isEmpty` for the node a read left that the key `node` names.
            #[::napi_derive::napi]
            pub fn read_is_empty(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, node: f64) -> ::napi::Result<bool> {
                with_read_node(engine, node, |tree, index| Ok(tree.is_empty(index)))
            }

            /// `descendants` for a node a read left records of in the built
            /// arena: `from` names it past the call (JSON, see
            /// `query::NamedAddress`), and the batch names each node it
            /// finds and its start the same way (`query::NamedBatch`), as
            /// JSON `{ items, resume, origin }`. Refuses an engine already
            /// disposed, a name no read's record holds, and a plan whose
            /// pattern the native matcher cannot compile.
            #[::napi_derive::napi]
            #[allow(clippy::too_many_arguments, reason = "each parameter is one of the JavaScript call's arguments")]
            pub fn read_descendants(
                #[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>,
                from: String,
                #[napi(ts_arg_type = "Array<import('../src/types.ts').TSKindId> | undefined | null")] kinds: Option<Vec<$crate::types::KindId>>,
                resume: Option<Vec<$crate::types::ChildPosition>>,
                limit: f64,
                plan: Option<String>,
                depth: Option<f64>,
            ) -> ::napi::Result<String> {
                let engine = engine_of(engine)?;
                let limit: u32 = $crate::napi_engine::checked_whole(limit, "limit")?;
                let depth = depth.map(|levels| $crate::napi_engine::checked_whole::<u32>(levels, "depth")).transpose()?;
                let plan = plan.map(|json| $crate::napi_engine::compile_plan(&json)).transpose()?;
                let from: $crate::query::NamedAddress = ::serde_json::from_str(&from).map_err(|e| ::napi::Error::from_reason(format!("not a node address: {e}")))?;
                let batch = engine
                    .descendants_of(from, &kinds.unwrap_or_default(), plan.as_ref(), resume.as_deref(), limit.max(1), depth)
                    .map_err(::napi::Error::from_reason)?;
                ::serde_json::to_string(&batch).map_err(|e| ::napi::Error::from_reason(e.to_string()))
            }

            /// `planHolds` for nodes a read left records of in the built
            /// arena: `addresses` (a JSON array of `query::NamedAddress`,
            /// all of one source) names each past the call. Refuses an
            /// engine already disposed, a name no read's record holds, and
            /// a plan whose pattern the native matcher cannot compile.
            #[::napi_derive::napi]
            pub fn read_plan_holds(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, addresses: String, plan: String) -> ::napi::Result<Vec<bool>> {
                let engine = engine_of(engine)?;
                let plan = $crate::napi_engine::compile_plan(&plan)?;
                let addresses: Vec<$crate::query::NamedAddress> = ::serde_json::from_str(&addresses).map_err(|e| ::napi::Error::from_reason(e.to_string()))?;
                engine.plan_holds_of(&addresses, &plan).map_err(::napi::Error::from_reason)
            }

            /// Chunk `chunk` of the built arena, which a read wrote its
            /// records into: a `Uint32Array` over its native memory, every
            /// word of it, with no copy; null for a chunk no read wrote.
            /// Disposing the engine detaches it. Refuses an engine already
            /// disposed and a runtime that does not allow external array
            /// buffers.
            #[::napi_derive::napi(ts_return_type = "Uint32Array | null")]
            pub fn read_words(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, env: ::napi::Env, chunk: f64) -> ::napi::Result<Option<$crate::napi_engine::Made>> {
                let engine = engine_of(engine)?;
                let chunk: u32 = $crate::napi_engine::checked_whole(chunk, "chunk")?;
                $crate::napi_engine::read_chunk(&env, engine.written(), chunk)
            }

            /// Parse `source` with `engine` and keep no tree: the read
            /// leaves the source's text and every node's record in the
            /// engine's built arena (`Engine::parse_records`). As JSON
            /// `{ root, source, options, errors }`: the address of the
            /// root's record, null when its reader writes none; the address
            /// of the source's entry; the source's layer of the render
            /// options; and its error regions. Refuses an engine in use, a
            /// parse that fails, and what the read or the arena refuses.
            #[::napi_derive::napi]
            pub fn parse_records(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, env: ::napi::Env, source: String) -> ::napi::Result<String> {
                let parsed = engine
                    .try_borrow_mut()
                    .map_err(|_| ::napi::Error::from_reason("the engine is in use"))?
                    .parse_records::<$any>(&source)
                    .map_err(::napi::Error::from_reason)?;
                $crate::napi_engine::report_built(&env, engine_of(engine)?.written())?;
                Ok(::serde_json::json!({
                    "root": parsed.root.map(|at| at.0),
                    "source": parsed.source.0,
                    "options": parsed.options,
                    "errors": parsed.errors,
                })
                .to_string())
            }

            /// `render_built`'s text written to `path` (`save_rendered`),
            /// answering whether it wrote.
            #[::napi_derive::napi(ts_args_type = "engine: object, owner: object, address: number, leading: boolean, trailing: boolean, path: string, create: boolean, source?: number | undefined | null, options?: object | undefined | null")]
            #[allow(clippy::too_many_arguments, reason = "each parameter is one of the JavaScript call's arguments")]
            pub fn render_built_to_file(engine: &::napi::bindgen_prelude::External<EngineCell>, owner: &::napi::bindgen_prelude::External<EngineCell>, address: f64, leading: bool, trailing: bool, path: String, create: bool, source: Option<f64>, options: Option<$options>) -> ::napi::Result<bool> {
                let rendered = render_built(engine, owner, address, leading, trailing, source, options)?;
                $crate::napi_engine::save_rendered(&path, &rendered.0, create)
            }

            /// The lone built leaf of `kind` whose leaf entry the built
            /// arena `owner` holds at `entry`, rendered as a render root whose
            /// `leading` and `trailing` edges have no neighbour, under
            /// `options` over this engine's, with `sides`, the sides the
            /// leaf holds (`{ leading?, trailing?, inner? }`): a root has
            /// no site in the store. Refuses a kind no node of the grammar
            /// is written as, an entry of another kind or outside the
            /// arena's strings, and a leaf whose render refuses.
            #[allow(clippy::too_many_arguments, reason = "each parameter is one of the JavaScript call's arguments")]
            #[::napi_derive::napi(ts_args_type = "engine: object, owner: object, kind: number, entry: number, sides: object | undefined | null, leading: boolean, trailing: boolean, options?: object | undefined | null", ts_return_type = "string")]
            pub fn render_built_leaf(
                engine: &::napi::bindgen_prelude::External<EngineCell>,
                env: ::napi::Env,
                owner: &::napi::bindgen_prelude::External<EngineCell>,
                kind: u32,
                entry: u32,
                sides: Option<$crate::trivia::NodeTrivia<<$grammar as $crate::engine::EngineGrammar>::Trivia>>,
                leading: bool,
                trailing: bool,
                options: Option<$options>,
            ) -> ::napi::Result<$crate::boundary::RenderedText> {
                let engine = engine_of(engine)?;
                let owner = engine_of(owner)?;
                let kind = $crate::types::KindId(u16::try_from(kind).map_err(|_| ::napi::Error::from_reason(format!("kind {kind} is wider than a kind")))?);
                render_built_with(&engine, &env, &owner, None, options, |arena, _, ctx| owner.render_built_leaf(arena, kind, $crate::arena::Address(entry), sides, $crate::slot::ChangedEdges { leading, trailing }, ctx))
            }

            /// `render_built_leaf`'s text written to `path`
            /// (`save_rendered`), answering whether it wrote.
            #[allow(clippy::too_many_arguments, reason = "each parameter is one of the JavaScript call's arguments")]
            #[::napi_derive::napi(ts_args_type = "engine: object, owner: object, kind: number, entry: number, sides: object | undefined | null, leading: boolean, trailing: boolean, path: string, create: boolean, options?: object | undefined | null")]
            pub fn render_built_leaf_to_file(
                engine: &::napi::bindgen_prelude::External<EngineCell>,
                env: ::napi::Env,
                owner: &::napi::bindgen_prelude::External<EngineCell>,
                kind: u32,
                entry: u32,
                sides: Option<$crate::trivia::NodeTrivia<<$grammar as $crate::engine::EngineGrammar>::Trivia>>,
                leading: bool,
                trailing: bool,
                path: String,
                create: bool,
                options: Option<$options>,
            ) -> ::napi::Result<bool> {
                let rendered = render_built_leaf(engine, env, owner, kind, entry, sides, leading, trailing, options)?;
                $crate::napi_engine::save_rendered(&path, &rendered.0, create)
            }

            /// A new chunk of `length` words of the built arena this
            /// engine's builders write, zeroed: `{ chunk, data, meta,
            /// freed, sealed }`, its number, a `Uint32Array` over its
            /// native memory, which the builders write records into, a
            /// `Uint8Array` over its counts' meta (`count`), the chunks
            /// freed since the last chunk was made, and the chunk this one
            /// sealed with a `Uint8Array` over its meta, now sized for the
            /// entries it holds, the old one detached. A trivia entry this
            /// engine's store answers renders from it. Refuses an empty
            /// chunk, an engine already disposed, and a runtime that does
            /// not allow external array buffers.
            #[::napi_derive::napi(ts_return_type = "{ chunk: number; data: Uint32Array; meta: Uint8Array; freed: number[]; sealed?: { chunk: number; meta: Uint8Array } }")]
            pub fn built_words(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, env: ::napi::Env, length: f64) -> ::napi::Result<$crate::napi_engine::Made> {
                let engine = engine_of(engine)?;
                let length: u32 = $crate::napi_engine::checked_whole(length, "length")?;
                $crate::napi_engine::built_chunk(&env, engine.written(), false, length)
            }

            /// A new chunk of `length` bytes of the built arena's strings,
            /// as `builtWords` answers one of words, its `data` a
            /// `Uint8Array`.
            #[::napi_derive::napi(ts_return_type = "{ chunk: number; data: Uint8Array; meta: Uint8Array; freed: number[] }")]
            pub fn built_bytes(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, env: ::napi::Env, length: f64) -> ::napi::Result<$crate::napi_engine::Made> {
                let engine = engine_of(engine)?;
                let length: u32 = $crate::napi_engine::checked_whole(length, "length")?;
                $crate::napi_engine::built_chunk(&env, engine.written(), true, length)
            }

            /// Takes one more count of the built entry at `address`, whose
            /// count saturated. Refuses an address no entry starts at and
            /// a count that has not saturated.
            #[::napi_derive::napi]
            pub fn built_bump(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, address: f64) -> ::napi::Result<()> {
                let engine = engine_of(engine)?;
                let address = $crate::arena::Address($crate::napi_engine::checked_whole(address, "address")?);
                engine.written().built_mut().bump(address).map_err(|e| ::napi::Error::from_reason(e.to_string()))?;
                Ok(())
            }

            /// Releases a count of the built entry at `address`, a record
            /// (`held` 0), a run (1) or a side record (2): with `owned`,
            /// the count its builder's handle holds, a no-op when it holds
            /// none. An entry whose count reaches zero releases what it
            /// holds, and a chunk left holding nothing live is freed and
            /// its buffers detached. Answers the tree of each link record
            /// and side record released since the last call. Refuses a
            /// count below zero, an address no entry starts at, and an
            /// engine already disposed.
            #[::napi_derive::napi]
            pub fn release_built(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, env: ::napi::Env, address: f64, held: u32, owned: bool) -> ::napi::Result<Vec<u32>> {
                let engine = engine_of(engine)?;
                let address = $crate::arena::Address($crate::napi_engine::checked_whole(address, "address")?);
                let held = $crate::arena::count::Held::of(held, address).map_err(|e| ::napi::Error::from_reason(e.to_string()))?;
                let released = engine.written().release(held, owned).map_err(|e| ::napi::Error::from_reason(e.to_string()));
                $crate::napi_engine::settle(&env, engine.written())?;
                released?;
                let trees = engine.written().built_mut().take_trees();
                Ok(trees.into_iter().map(|tree| tree.0).collect())
            }

            /// The bytes the built arena's chunks take, and of them the
            /// bytes their counts take: `{ chunks, counts }`. A diagnostic.
            #[::napi_derive::napi(ts_return_type = "{ chunks: number; counts: number; live: number }")]
            pub fn built_memory(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, env: ::napi::Env) -> ::napi::Result<$crate::napi_engine::Made> {
                let engine = engine_of(engine)?;
                $crate::napi_engine::built_memory(&env, engine.written())
            }

            /// Refuses, by name, a runtime that does not allow external
            /// array buffers, which arena node storage reads every chunk
            /// through.
            #[::napi_derive::napi]
            pub fn external_buffers(env: ::napi::Env) -> ::napi::Result<()> {
                $crate::napi_engine::check_external_buffers(&env)
            }

            /// The text bytes `start` to `end` cover in the source the
            /// record at `node` of the built arena was read from: one string
            /// of that span's characters, so the source itself never
            /// crosses. Refuses a record no read wrote, an engine already
            /// disposed, and a span that is not one of the source's.
            #[::napi_derive::napi]
            pub fn read_text(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, node: f64, start: f64, end: f64) -> ::napi::Result<String> {
                let engine = engine_of(engine)?;
                $crate::napi_engine::read_text(engine.written(), $crate::napi_engine::checked_whole(node, "node")?, $crate::napi_engine::checked_whole(start, "start")?, $crate::napi_engine::checked_whole(end, "end")?)
            }

            /// The entries a write gave `side` (`leading`, `trailing` or
            /// `inner`) of the built record at `address`, or `null` when
            /// no write did. Refuses address 0 and any other side.
            #[::napi_derive::napi(ts_return_type = "object[] | null")]
            pub fn built_trivia_side(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, address: f64, side: String) -> ::napi::Result<Option<Vec<$crate::trivia::TriviaEntry<<$grammar as $crate::engine::EngineGrammar>::Trivia>>>> {
                let engine = engine_of(engine)?;
                let address = $crate::arena::Address($crate::napi_engine::checked_whole(address, "address")?);
                let side = $crate::napi_engine::trivia_side_from_wire(&side)?;
                engine.built_trivia_side(address, side).map_err(|e| ::napi::Error::from_reason(e.to_string()))
            }

            /// The entries a write gave `side` (`leading`, `trailing` or
            /// `inner`) of the built leaf at the site `holder`, `word`,
            /// `item`, or `null` when no write did. Refuses holder 0 and
            /// any other side.
            #[::napi_derive::napi(ts_return_type = "object[] | null")]
            pub fn built_leaf_side(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, holder: f64, word: u32, item: u32, side: String) -> ::napi::Result<Option<Vec<$crate::trivia::TriviaEntry<<$grammar as $crate::engine::EngineGrammar>::Trivia>>>> {
                let engine = engine_of(engine)?;
                let holder = $crate::arena::Address($crate::napi_engine::checked_whole(holder, "holder")?);
                let side = $crate::napi_engine::trivia_side_from_wire(&side)?;
                let site = $crate::trivia_store::Site { holder, word, item: $crate::types::ItemIndex(item) };
                engine.built_leaf_side(site, side).map_err(|e| ::napi::Error::from_reason(e.to_string()))
            }

            /// Writes the sides of every unit and leaf site of the built
            /// record at `from` at the same site of the record at `to`,
            /// except a site at a word `skip` names. Refuses address 0
            /// as either record.
            #[::napi_derive::napi]
            pub fn copy_built_sites(#[napi(ts_arg_type = "object")] engine: &::napi::bindgen_prelude::External<EngineCell>, from: f64, to: f64, skip: Vec<u32>) -> ::napi::Result<()> {
                let engine = engine_of(engine)?;
                let from = $crate::arena::Address($crate::napi_engine::checked_whole(from, "from")?);
                let to = $crate::arena::Address($crate::napi_engine::checked_whole(to, "to")?);
                engine.copy_built_sites(from, to, &skip).map_err(|e| ::napi::Error::from_reason(e.to_string()))
            }

            /// Replace `side` of the built leaf at each site `sites` names,
            /// `[holder, word, item]` after another, with `entries`, which
            /// `renderBuilt` then writes; a built record among them
            /// renders as `writeTriviaSide` says. Refuses a list whose
            /// length is not a multiple of three, holder 0 and any other
            /// side, before writing any site.
            #[::napi_derive::napi(ts_args_type = "engine: object, sites: number[], side: string, entries: object[]")]
            pub fn write_built_leaf_side(
                engine: &::napi::bindgen_prelude::External<EngineCell>,
                env: ::napi::Env,
                sites: Vec<u32>,
                side: String,
                entries: Vec<$crate::trivia::TriviaEntry<<$grammar as $crate::engine::EngineGrammar>::Trivia>>,
            ) -> ::napi::Result<()> {
                let engine = engine_of(engine)?;
                if sites.len() % 3 != 0 {
                    return Err(::napi::Error::from_reason(format!("a leaf's sites are holder, word and item triples, not {} numbers", sites.len())));
                }
                let sites: Vec<_> = sites.chunks_exact(3).map(|site| $crate::trivia_store::Site { holder: $crate::arena::Address(site[0]), word: site[1], item: $crate::types::ItemIndex(site[2]) }).collect();
                let side = $crate::napi_engine::trivia_side_from_wire(&side)?;
                engine.write_built_leaf_side(&sites, side, &entries).map_err(|e| ::napi::Error::from_reason(e.to_string()))?;
                $crate::napi_engine::settle(&env, engine.written())
            }

            /// The sides writes gave each unit the record at `address` in
            /// the arena this engine built holds: `{ slot, item, leading?,
            /// trailing?, inner? }`. Refuses an arena this engine no
            /// longer holds and an address naming no record in it.
            #[::napi_derive::napi(ts_args_type = "engine: object, address: number", ts_return_type = "object[]")]
            pub fn built_unit_sides(engine: &::napi::bindgen_prelude::External<EngineCell>, address: f64) -> ::napi::Result<Vec<$crate::layout::UnitSides<<$grammar as $crate::engine::EngineGrammar>::Trivia>>> {
                let engine = engine_of(engine)?;
                let address = $crate::arena::Address($crate::napi_engine::checked_whole(address, "address")?);
                let chunks = engine.written().built();
                let arena = chunks.readable().map_err(|e| ::napi::Error::from_reason(e.to_string()))?;
                engine.built_unit_sides(arena, address).map_err(|e| ::napi::Error::from_reason(e.to_string()))
            }

            /// The units the record at `address` in the arena this engine
            /// built holds have the sides `units` gives (`{ slot, item,
            /// leading?, trailing?, inner? }`), in place of every unit
            /// side it had; `renderBuilt` then writes them, and a built
            /// record among them renders as `writeTriviaSide` says.
            /// Refuses as `builtUnitSides` does, and a slot the record's
            /// kind has no cell for.
            #[::napi_derive::napi(ts_args_type = "engine: object, address: number, units: object[]")]
            pub fn write_built_unit_sides(
                engine: &::napi::bindgen_prelude::External<EngineCell>,
                env: ::napi::Env,
                address: f64,
                units: Vec<$crate::layout::UnitSides<<$grammar as $crate::engine::EngineGrammar>::Trivia>>,
            ) -> ::napi::Result<()> {
                let engine = engine_of(engine)?;
                let address = $crate::arena::Address($crate::napi_engine::checked_whole(address, "address")?);
                engine.write_built_unit_sides(address, units).map_err(|e| ::napi::Error::from_reason(e.to_string()))?;
                $crate::napi_engine::settle(&env, engine.written())
            }

            /// Replace `side` of the built record at `address` with
            /// `entries`, which `renderBuilt` then writes; a built record
            /// among them renders as `writeTriviaSide` says. Refuses as
            /// `builtTriviaSide` does.
            #[::napi_derive::napi(ts_args_type = "engine: object, address: number, side: string, entries: object[]")]
            pub fn write_built_trivia_side(
                engine: &::napi::bindgen_prelude::External<EngineCell>,
                env: ::napi::Env,
                address: f64,
                side: String,
                entries: Vec<$crate::trivia::TriviaEntry<<$grammar as $crate::engine::EngineGrammar>::Trivia>>,
            ) -> ::napi::Result<()> {
                let engine = engine_of(engine)?;
                let address = $crate::arena::Address($crate::napi_engine::checked_whole(address, "address")?);
                let side = $crate::napi_engine::trivia_side_from_wire(&side)?;
                engine.write_built_trivia_side(address, side, entries).map_err(|e| ::napi::Error::from_reason(e.to_string()))?;
                $crate::napi_engine::settle(&env, engine.written())
            }

            /// The coordinate a read of the live tree `treeId` names the node
            /// at `index` by, as `[kind, end]`: the kind the read stamps on
            /// it and the row after its subtree (`ParsedTree::row_coordinate`),
            /// the one derivation a record view's coordinate takes. Refuses a
            /// tree that is not live and an index past its last node.
            #[::napi_derive::napi]
            pub fn coordinate(env: ::napi::Env, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<Vec<u32>> {
                with_live_tree(&env, tree_id, |parsed| {
                    $crate::napi_engine::check_node(parsed, index)?;
                    let at = parsed.row_coordinate(index).ok_or_else(|| ::napi::Error::from_reason(format!("tree {tree_id} has no node {}", index.0)))?;
                    let kind = at.kind.ok_or_else(|| ::napi::Error::from_reason(format!("tree {tree_id}'s node {} has no stamped kind", index.0)))?;
                    Ok(vec![u32::from(kind.0), at.end.0])
                })
            }

            /// Chunk `n` of the live tree `treeId`'s arena: a `Uint32Array`
            /// over its native memory, every word of it, with no copy. A
            /// later read's records, and the cells it rewrites to name
            /// them, appear in the same array; disposing the tree detaches
            /// it.
            /// Refuses a tree that is not live, a chunk its arena does not
            /// hold, and a runtime that does not allow external array
            /// buffers.
            #[::napi_derive::napi(ts_return_type = "Uint32Array")]
            pub fn chunk(env: ::napi::Env, tree_id: $crate::types::TreeId, n: f64) -> ::napi::Result<$crate::napi_engine::Made> {
                let n: u32 = $crate::napi_engine::checked_whole(n, "chunk")?;
                with_live_tree(&env, tree_id, |parsed| {
                    TREE_BUFFERS.with(|buffers| {
                        let mut buffers = buffers.borrow_mut();
                        let buffers = buffers.entry(tree_id).or_default();
                        let view = buffers.view::<u32>(&env, false, n, || parsed.record_chunk_memory(n))?;
                        view.ok_or_else(|| ::napi::Error::from_reason(format!("tree {tree_id}'s arena holds no chunk {n}")))
                    })
                })
            }
        }
    };
}

/// Take a JavaScript number that is meant to be an index, or say why it is not.
///
/// Rust's `as` cast is saturating: `NaN as u64` is 0, and so is any negative.
/// Left to the cast, a nonsense handle would name tree 0 node 0 — the root —
/// and be answered as though it were a real request. Every rejection here is a
/// value that would otherwise have been silently rounded into a valid one.
pub fn checked_index(value: f64, label: impl std::fmt::Display) -> napi::Result<u64> {
    use crate::types::NotWhole;
    crate::types::exact_whole(value).map_err(|why| {
        napi::Error::from_reason(match why {
            NotWhole::NotFinite => format!("{label} must be a finite number"),
            NotWhole::Negative => format!("{label} must not be negative (got {value})"),
            NotWhole::Fraction => format!("{label} must be a whole number (got {value})"),
            NotWhole::BeyondExact => format!("{label} {value} is beyond the exact-integer range"),
        })
    })
}

/// A JavaScript number that is meant to be a whole number of `T`: checked as
/// `checked_index` checks it, then in `T`'s width. napi's own integer readers
/// wrap a negative, truncate a fraction and read `NaN` as 0, so every whole
/// number crossing in is read as a double and narrowed here.
pub fn checked_whole<T: TryFrom<u64>>(value: f64, label: impl std::fmt::Display) -> napi::Result<T> {
    let whole = checked_index(value, &label)?;
    T::try_from(whole).map_err(|_| napi::Error::from_reason(format!("{label} {whole} does not fit a {}", std::any::type_name::<T>())))
}

/// `text` written to `path` by the one writer (`file_io::write_file`): a new
/// file when `create`, refusing a file at the path, and otherwise a
/// replacement that leaves a file already holding `text` untouched. Answers
/// whether it wrote; a refusal carries the writer's message, which names
/// the path.
pub fn save_rendered(path: &str, text: &str, create: bool) -> napi::Result<bool> {
    let mode = if create { crate::file_io::WriteMode::CreateNew } else { crate::file_io::WriteMode::Replace };
    crate::file_io::write_file(std::path::Path::new(path), text.as_bytes(), mode).map_err(|error| napi::Error::from_reason(error.to_string()))
}

/// A `where` plan from its JSON (`query::PlanSpec`), compiled; a pattern the
/// native matcher cannot compile is refused.
pub fn compile_plan(json: &str) -> napi::Result<crate::query::Plan> {
    serde_json::from_str::<crate::query::PlanSpec>(json)
        .map_err(|e| e.to_string())
        .and_then(crate::query::Plan::compile)
        .map_err(napi::Error::from_reason)
}

/// A node's address from its JSON (`query::Address`).
pub fn address_from_json(json: &str) -> napi::Result<crate::query::Address> {
    serde_json::from_str(json).map_err(|e| napi::Error::from_reason(format!("not a node address: {e}")))
}

/// A read's depth from its wire form: absent is one level,
/// `Infinity` every level, and anything else must be a whole number of
/// levels, at least one.
pub fn depth_from_wire(depth: Option<f64>) -> napi::Result<crate::read::Depth> {
    let Some(levels) = depth else {
        return Ok(crate::read::Depth::ONE);
    };
    if levels == f64::INFINITY {
        return Ok(crate::read::Depth::All);
    }
    crate::types::exact_whole(levels)
        .ok()
        .and_then(|whole| u32::try_from(whole).ok())
        .and_then(std::num::NonZeroU32::new)
        .map(crate::read::Depth::Levels)
        .ok_or_else(|| napi::Error::from_reason(format!("depth {levels} is not a whole number of levels (at least 1) or Infinity")))
}

/// What the live trees hold natively and what their reports have told V8
/// (`tree_memory`), in bytes.
#[napi_derive::napi(object)]
pub struct TreeMemory {
    pub trees: u32,
    pub counted: f64,
    pub reported: f64,
}

impl TreeMemory {
    #[must_use]
    #[allow(clippy::cast_precision_loss, reason = "a byte count below 2^53, which a double holds exactly")]
    pub fn new(trees: usize, counted: usize, reported: i64) -> Self {
        Self { trees: crate::types::narrow(trees), counted: counted as f64, reported: reported as f64 }
    }
}

/// A run of whitespace a side takes, with the line breaks, spaces and tabs
/// the tree's baseline writes there (`SittirEngine::layout_baseline`), each
/// absent where no baseline reaches the run.
#[napi_derive::napi(object)]
pub struct BaselineRun {
    pub start: u32,
    pub end: u32,
    pub index: crate::types::NodeIndex,
    pub side: String,
    pub breaks: Option<u32>,
    pub spaces: Option<u32>,
    pub tabs: Option<u32>,
}

impl BaselineRun {
    #[must_use]
    pub fn new(run: crate::trivia_table::LayoutRun, written: Option<crate::baseline::Tally>) -> Self {
        Self {
            start: run.start,
            end: run.end,
            index: run.node,
            side: trivia_side_to_wire(run.side).to_owned(),
            breaks: written.map(|tally| tally.breaks),
            spaces: written.map(|tally| tally.spaces),
            tabs: written.map(|tally| tally.tabs),
        }
    }
}

/// A trivia side's wire name (`trivia_side_from_wire`).
#[must_use]
pub fn trivia_side_to_wire(side: crate::trivia_table::TriviaSide) -> &'static str {
    use crate::trivia_table::TriviaSide;
    match side {
        TriviaSide::Leading => "leading",
        TriviaSide::Trailing => "trailing",
        TriviaSide::Inner => "inner",
    }
}

/// A trivia side from its wire name: `leading`, `trailing` or `inner`.
pub fn trivia_side_from_wire(side: &str) -> napi::Result<crate::trivia_table::TriviaSide> {
    use crate::trivia_table::TriviaSide;
    match side {
        "leading" => Ok(TriviaSide::Leading),
        "trailing" => Ok(TriviaSide::Trailing),
        "inner" => Ok(TriviaSide::Inner),
        other => Err(napi::Error::from_reason(format!("{other:?} is not a trivia side (leading, trailing or inner)"))),
    }
}

/// Refuses an index that names no node of `parsed`, by its stamped node
/// count (`ParsedTree::names`), without moving to it.
pub fn check_node<G: crate::engine::EngineGrammar>(parsed: &crate::ParsedTree<G>, index: crate::types::NodeIndex) -> napi::Result<()> {
    if parsed.names(index) {
        Ok(())
    } else {
        Err(no_node(parsed, index))
    }
}

/// The refusal for an index that names no node of `parsed`.
#[must_use]
pub fn no_node<G: crate::engine::EngineGrammar, B: crate::engine::Backing>(parsed: &crate::ParsedTree<G, B>, index: crate::types::NodeIndex) -> napi::Error {
    napi::Error::from_reason(format!("index {index} names no node of tree {}", parsed.tree_id()))
}

/// What `read` answers for the node at `index` of `parsed`
/// (`ParsedTree::read_node`): the node, or the `ERROR` holding it, refused as
/// `answered` refuses.
///
/// # Errors
///
/// Those refusals.
pub fn node_or_error<G: crate::engine::EngineGrammar, T>(
    parsed: &crate::ParsedTree<G>,
    index: crate::types::NodeIndex,
    what: &str,
    read: impl FnOnce() -> Option<Result<crate::engine::NodeRead<T>, crate::read::ReadError>>,
) -> napi::Result<napi::Either<T, crate::ErrorRead>> {
    Ok(match answered(parsed, index, what, read)? {
        crate::engine::NodeRead::Node(node) => napi::Either::A(node),
        crate::engine::NodeRead::Error(error) => napi::Either::B(error),
    })
}

/// What `answer` gives for the node at `index` of `parsed`. Refuses an index
/// naming no node of the tree, an answer that panicked (`what`), and a node
/// the model refuses, naming the kind, the child and the index.
///
/// # Errors
///
/// Those refusals.
pub fn answered<G: crate::engine::EngineGrammar, B: crate::engine::Backing, T>(
    parsed: &crate::ParsedTree<G, B>,
    index: crate::types::NodeIndex,
    what: &str,
    answer: impl FnOnce() -> Option<Result<T, crate::read::ReadError>>,
) -> napi::Result<T> {
    let answer = std::panic::catch_unwind(std::panic::AssertUnwindSafe(answer)).map_err(|payload| napi::Error::from_reason(crate::panic_msg(&*payload, what)))?;
    answer.ok_or_else(|| no_node(parsed, index))?.map_err(|refusal| napi::Error::from_reason(refusal.describe(&|kind| parsed.grammar().kind_name(kind))))
}

/// The refusal for an address into a tree this thread does not hold.
#[must_use]
pub fn tree_not_live(tree_id: crate::types::TreeId) -> napi::Error {
    napi::Error::from_reason(format!(
        "tree {tree_id} is not live (never parsed on this thread, or already released)"
    ))
}

/// An element of an arena chunk: its Rust type, paired with the typed array
/// JavaScript reads it through.
pub trait ChunkElement: Copy {
    const TYPE: napi::sys::napi_typedarray_type;
}

impl ChunkElement for u32 {
    const TYPE: napi::sys::napi_typedarray_type = napi::sys::TypedarrayType::uint32_array;
}

impl ChunkElement for u8 {
    const TYPE: napi::sys::napi_typedarray_type = napi::sys::TypedarrayType::uint8_array;
}

/// The refusal of a runtime that does not allow external array buffers,
/// such as Electron's sandboxed renderer under V8's memory cage.
pub const EXTERNAL_BUFFERS_REFUSED: &str = "arena node storage needs external array buffers, which this runtime does not allow; use nodeStorage: 'object'";

/// A weak reference to a JavaScript value: it does not keep the value
/// alive, and reads as nothing once the value is collected.
#[cfg(feature = "arena")]
struct WeakValue(napi::sys::napi_ref);

// SAFETY: as `napi::Ref` is: a reference is made, read and deleted only on
// the JavaScript thread, each inside a call that hands over its `env`.
#[cfg(feature = "arena")]
unsafe impl Send for WeakValue {}
// SAFETY: as above; a shared reference reads nothing outside such a call.
#[cfg(feature = "arena")]
unsafe impl Sync for WeakValue {}

#[cfg(feature = "arena")]
impl WeakValue {
    fn new(env: &napi::Env, value: napi::sys::napi_value) -> napi::Result<Self> {
        let mut raw = std::ptr::null_mut();
        // SAFETY: `value` is live in `env`; a reference of count 0 is weak.
        napi::check_status!(unsafe { napi::sys::napi_create_reference(env.raw(), value, 0, &raw mut raw) })?;
        Ok(Self(raw))
    }

    fn get(&self, env: &napi::Env) -> napi::Result<Option<napi::sys::napi_value>> {
        let mut value = std::ptr::null_mut();
        // SAFETY: the reference was made in this addon's env and is not deleted.
        napi::check_status!(unsafe { napi::sys::napi_get_reference_value(env.raw(), self.0, &raw mut value) })?;
        Ok((!value.is_null()).then_some(value))
    }

    fn delete(self, env: &napi::Env) -> napi::Result<()> {
        // SAFETY: the reference was made in this addon's env, and `self` is its only owner.
        napi::check_status!(unsafe { napi::sys::napi_delete_reference(env.raw(), self.0) })
    }
}

/// Drops the share of a chunk's memory a buffer's finalizer holds.
#[cfg(feature = "arena")]
unsafe extern "C" fn release_share<T: crate::arena::ChunkUnit>(_env: napi::sys::napi_env, _data: *mut std::ffi::c_void, hint: *mut std::ffi::c_void) {
    // SAFETY: `hint` is the box `external_view` leaked for this buffer, and
    // the finalizer runs once.
    drop(unsafe { Box::from_raw(hint.cast::<std::sync::Arc<crate::arena::ChunkMem<T>>>()) });
}

/// A typed array over every element of `mem`, with no copy: an external
/// array buffer whose finalizer holds a share of the memory, so the buffer
/// never names freed memory.
///
/// # Errors
///
/// `EXTERNAL_BUFFERS_REFUSED` where the runtime refuses external buffers,
/// and any other status napi refuses with.
#[cfg(feature = "arena")]
fn external_view<T: ChunkElement + crate::arena::ChunkUnit>(env: &napi::Env, mem: std::sync::Arc<crate::arena::ChunkMem<T>>) -> napi::Result<napi::sys::napi_value> {
    let (data, bytes, len) = (mem.as_ptr().cast::<std::ffi::c_void>(), mem.byte_len(), mem.len());
    let hint = Box::into_raw(Box::new(mem)).cast::<std::ffi::c_void>();
    let mut buffer = std::ptr::null_mut();
    // SAFETY: `data` names `bytes` bytes that live while `hint`'s share does,
    // and the finalizer takes back `hint`.
    let status = unsafe { napi::sys::napi_create_external_arraybuffer(env.raw(), data, bytes, Some(release_share::<T>), hint, &raw mut buffer) };
    if status != napi::sys::Status::napi_ok {
        // SAFETY: napi made no buffer, so nothing else takes back `hint`.
        drop(unsafe { Box::from_raw(hint.cast::<std::sync::Arc<crate::arena::ChunkMem<T>>>()) });
        if status == napi::sys::Status::napi_no_external_buffers_allowed {
            return Err(napi::Error::from_reason(EXTERNAL_BUFFERS_REFUSED));
        }
        napi::check_status!(status)?;
    }
    let mut array = std::ptr::null_mut();
    // SAFETY: `buffer` is live in `env` and holds `len` elements of `T`.
    napi::check_status!(unsafe { napi::sys::napi_create_typedarray(env.raw(), T::TYPE, len, buffer, 0, &raw mut array) })?;
    Ok(array)
}

/// Refuses, by name, a runtime that does not allow external array buffers.
///
/// # Errors
///
/// `EXTERNAL_BUFFERS_REFUSED`, or any other status napi refuses with.
#[cfg(feature = "arena")]
pub fn check_external_buffers(env: &napi::Env) -> napi::Result<()> {
    external_view(env, crate::arena::ChunkMem::<u8>::zeroed(1)).map(|_| ())
}

/// The buffers JavaScript reads one arena's chunks through, by chunk, each
/// held weakly so a freed chunk can detach it, the bytes of the arena's
/// memory reported to V8, and the chunks freed since JavaScript was last told.
#[cfg(feature = "arena")]
#[derive(Default)]
pub struct Buffers {
    held: std::collections::HashMap<(bool, u32), WeakValue, crate::heap::IndexState>,
    meta: std::collections::HashMap<u32, WeakValue, crate::heap::IndexState>,
    reported: Reported,
    unreported: Vec<u32>,
}

/// The native memory a holder has reported to V8 (`napi_adjust_external_memory`).
#[derive(Debug, Default)]
pub struct Reported(i64);

impl Reported {
    /// Reports `bytes` to V8 in place of what was reported, and answers the
    /// change.
    ///
    /// # Errors
    ///
    /// A status napi refuses with.
    pub fn report(&mut self, env: &napi::Env, bytes: usize) -> napi::Result<i64> {
        let now = i64::try_from(bytes).unwrap_or(i64::MAX);
        let change = now - self.0;
        if change != 0 {
            let mut adjusted = 0;
            // SAFETY: a plain accounting call on the JavaScript thread.
            napi::check_status!(unsafe { napi::sys::napi_adjust_external_memory(env.raw(), change, &raw mut adjusted) })?;
            self.0 = now;
        }
        Ok(change)
    }
}

// SAFETY: as `WeakValue`: every reference is read and deleted only on the
// JavaScript thread, inside a call that hands over its `env`.
#[cfg(feature = "arena")]
unsafe impl Send for Buffers {}

#[cfg(feature = "arena")]
impl std::fmt::Debug for Buffers {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Buffers").field("chunks", &self.held.len()).field("reported", &self.reported.0).field("unreported", &self.unreported).finish_non_exhaustive()
    }
}

#[cfg(feature = "arena")]
impl Buffers {
    /// The typed array JavaScript reads chunk `chunk` (of the string chunks
    /// when `bytes`) through: the one it was given while that lives, else a
    /// new one over `mem`.
    ///
    /// # Errors
    ///
    /// As `external_view`, and a reference napi refuses to make or read.
    pub fn view<T: ChunkElement + crate::arena::ChunkUnit>(&mut self, env: &napi::Env, bytes: bool, chunk: u32, mem: impl FnOnce() -> Option<std::sync::Arc<crate::arena::ChunkMem<T>>>) -> napi::Result<Option<Made>> {
        if let Some(weak) = self.held.get(&(bytes, chunk)) {
            if let Some(array) = weak.get(env)? {
                return Ok(Some(Made(array)));
            }
        }
        let Some(mem) = mem() else { return Ok(None) };
        let array = external_view(env, mem)?;
        if let Some(stale) = self.held.insert((bytes, chunk), WeakValue::new(env, array)?) {
            stale.delete(env)?;
        }
        Ok(Some(Made(array)))
    }

    /// Reports `bytes`, the memory the buffers' holder takes now, to V8, in
    /// place of what was reported, and answers the change.
    ///
    /// # Errors
    ///
    /// A status napi refuses with.
    pub fn report(&mut self, env: &napi::Env, bytes: usize) -> napi::Result<i64> {
        self.reported.report(env, bytes)
    }

    /// Holds `array`, the buffer over chunk `chunk`'s meta, weakly, so
    /// freeing the chunk detaches it.
    ///
    /// # Errors
    ///
    /// A reference napi refuses to make or let go of.
    pub fn hold_meta(&mut self, env: &napi::Env, chunk: u32, array: napi::sys::napi_value) -> napi::Result<()> {
        match self.meta.insert(chunk, WeakValue::new(env, array)?) {
            Some(stale) => stale.delete(env),
            None => Ok(()),
        }
    }

    /// Holds `array`, the buffer over chunk `chunk`'s meta since it sealed,
    /// weakly, and detaches the buffer over its meta before.
    ///
    /// # Errors
    ///
    /// A reference or status napi refuses.
    pub fn reseat_meta(&mut self, env: &napi::Env, chunk: u32, array: napi::sys::napi_value) -> napi::Result<()> {
        match self.meta.insert(chunk, WeakValue::new(env, array)?) {
            Some(old) => detach_weak(env, old),
            None => Ok(()),
        }
    }

    /// Detaches every buffer over chunk `chunk` that lives, its meta's
    /// included, and lets go of each reference.
    ///
    /// # Errors
    ///
    /// A status napi refuses with.
    pub fn detach_chunk(&mut self, env: &napi::Env, chunk: u32) -> napi::Result<()> {
        let held = [false, true].into_iter().filter_map(|bytes| self.held.remove(&(bytes, chunk)));
        held.chain(self.meta.remove(&chunk)).try_for_each(|weak| detach_weak(env, weak))
    }

    /// Detaches every buffer that lives, so it reads as empty, lets go of
    /// each reference, reports the holder's memory as gone, and answers the
    /// change.
    ///
    /// # Errors
    ///
    /// A status napi refuses with.
    pub fn detach(&mut self, env: &napi::Env) -> napi::Result<i64> {
        let held: Vec<WeakValue> = self.held.drain().map(|(_, weak)| weak).chain(self.meta.drain().map(|(_, weak)| weak)).collect();
        held.into_iter().try_for_each(|weak| detach_weak(env, weak))?;
        self.report(env, 0)
    }
}

/// Detaches the buffer under `weak`'s typed array when it lives, and lets go
/// of the reference.
#[cfg(feature = "arena")]
fn detach_weak(env: &napi::Env, weak: WeakValue) -> napi::Result<()> {
    if let Some(array) = weak.get(env)? {
        let (mut kind, mut len, mut data, mut buffer, mut offset) = (0, 0, std::ptr::null_mut(), std::ptr::null_mut(), 0);
        // SAFETY: `array` is a live typed array this addon made.
        napi::check_status!(unsafe { napi::sys::napi_get_typedarray_info(env.raw(), array, &raw mut kind, &raw mut len, &raw mut data, &raw mut buffer, &raw mut offset) })?;
        // SAFETY: `buffer` is the external buffer `external_view` made.
        napi::check_status!(unsafe { napi::sys::napi_detach_arraybuffer(env.raw(), buffer) })?;
    }
    weak.delete(env)
}

/// Without the arena no buffer is made over a chunk: only the holder's
/// memory is reported.
#[cfg(not(feature = "arena"))]
#[derive(Default)]
pub struct Buffers {
    reported: Reported,
}

#[cfg(not(feature = "arena"))]
impl Buffers {
    /// As the arena build's `Buffers::report`.
    ///
    /// # Errors
    ///
    /// A status napi refuses with.
    pub fn report(&mut self, env: &napi::Env, bytes: usize) -> napi::Result<i64> {
        self.reported.report(env, bytes)
    }

    /// Reports the holder's memory as gone, and answers the change: there is
    /// no buffer to detach.
    ///
    /// # Errors
    ///
    /// A status napi refuses with.
    pub fn detach(&mut self, env: &napi::Env) -> napi::Result<i64> {
        self.report(env, 0)
    }
}

/// A value a call made in its env, returned to JavaScript as it is.
pub struct Made(napi::sys::napi_value);

impl napi::bindgen_prelude::ToNapiValue for Made {
    unsafe fn to_napi_value(_env: napi::sys::napi_env, val: Self) -> napi::Result<napi::sys::napi_value> {
        Ok(val.0)
    }
}

impl napi::bindgen_prelude::TypeName for Made {
    fn type_name() -> &'static str {
        "Object"
    }

    fn value_type() -> napi::ValueType {
        napi::ValueType::Object
    }
}

/// A new chunk of the built arena `store` holds, of `length` bytes when
/// `bytes`, else of `length` words: `{ chunk, data, meta, freed, sealed }`,
/// its number, the typed arrays over it and its meta, held weakly in the
/// store's buffers and reported to V8, the chunks freed since JavaScript was
/// last told, and the word chunk it sealed with its new meta, the old one
/// detached.
///
/// # Errors
///
/// What `BuiltChunks` refuses, and what `Buffers::view` does.
#[cfg(feature = "arena")]
pub fn built_chunk<T>(env: &napi::Env, store: &crate::trivia_store::TriviaStore<T>, bytes: bool, length: u32) -> napi::Result<Made> {
    use napi::JsValue;
    let refused = |e: crate::arena::ArenaError| napi::Error::from_reason(e.to_string());
    let mut buffers = store.buffers();
    let (chunk, data, meta, sealed) = if bytes {
        let made = store.built_mut().alloc_bytes(length).map_err(refused)?;
        (made.chunk, buffers.view::<u8>(env, true, made.chunk, || Some(made.mem))?, made.meta, made.sealed)
    } else {
        let made = store.built_mut().alloc_words(length).map_err(refused)?;
        (made.chunk, buffers.view::<u32>(env, false, made.chunk, || Some(made.mem))?, made.meta, made.sealed)
    };
    let data = data.ok_or_else(|| napi::Error::from_reason("a built chunk made no buffer"))?;
    let meta = external_view::<u8>(env, meta)?;
    buffers.hold_meta(env, chunk, meta)?;
    let sealed = sealed
        .map(|(sealed, meta)| -> napi::Result<napi::bindgen_prelude::Object<'_>> {
            let meta = external_view::<u8>(env, meta)?;
            buffers.reseat_meta(env, sealed, meta)?;
            let mut object = napi::bindgen_prelude::Object::new(env)?;
            napi::bindgen_prelude::JsObjectValue::set_named_property(&mut object, "chunk", sealed)?;
            napi::bindgen_prelude::JsObjectValue::set_named_property(&mut object, "meta", Made(meta))?;
            Ok(object)
        })
        .transpose()?;
    settle_buffers(*env, &mut buffers, store)?;
    let mut object = napi::bindgen_prelude::Object::new(env)?;
    if let Some(sealed) = sealed {
        napi::bindgen_prelude::JsObjectValue::set_named_property(&mut object, "sealed", sealed)?;
    }
    napi::bindgen_prelude::JsObjectValue::set_named_property(&mut object, "chunk", chunk)?;
    napi::bindgen_prelude::JsObjectValue::set_named_property(&mut object, "data", data)?;
    napi::bindgen_prelude::JsObjectValue::set_named_property(&mut object, "meta", Made(meta))?;
    napi::bindgen_prelude::JsObjectValue::set_named_property(&mut object, "freed", std::mem::take(&mut buffers.unreported))?;
    Ok(Made(object.raw()))
}

/// `{ chunks, counts, live }`: the bytes the built arena `store` holds takes,
/// of them the bytes its counts take, and the entries it holds that are not
/// yet released.
///
/// # Errors
///
/// What making the object refuses.
#[cfg(feature = "arena")]
pub fn built_memory<T>(env: &napi::Env, store: &crate::trivia_store::TriviaStore<T>) -> napi::Result<Made> {
    use napi::JsValue;
    let built = store.built();
    let mut object = napi::bindgen_prelude::Object::new(env)?;
    #[allow(clippy::cast_precision_loss, reason = "a byte count well below 2^53")]
    let (chunks, counts, live) = (built.allocated_bytes() as f64, built.count_bytes() as f64, built.live_entries() as f64);
    napi::bindgen_prelude::JsObjectValue::set_named_property(&mut object, "chunks", chunks)?;
    napi::bindgen_prelude::JsObjectValue::set_named_property(&mut object, "counts", counts)?;
    napi::bindgen_prelude::JsObjectValue::set_named_property(&mut object, "live", live)?;
    Ok(Made(object.raw()))
}

/// Detaches the buffers over each chunk the built arena `store` holds freed
/// since the last call, and reports its memory now to V8. Every call that
/// can free a chunk ends here, so no buffer over a freed chunk outlives the
/// call that freed it.
///
/// # Errors
///
/// A status napi refuses with.
#[cfg(feature = "arena")]
pub fn settle<T>(env: &napi::Env, store: &crate::trivia_store::TriviaStore<T>) -> napi::Result<()> {
    settle_buffers(*env, &mut store.buffers(), store)
}

#[cfg(feature = "arena")]
fn settle_buffers<T>(env: napi::Env, buffers: &mut Buffers, store: &crate::trivia_store::TriviaStore<T>) -> napi::Result<()> {
    let freed = store.built_mut().take_freed();
    freed.iter().try_for_each(|&chunk| buffers.detach_chunk(&env, chunk))?;
    buffers.unreported.extend(freed);
    buffers.report(&env, store.built().allocated_bytes()).map(drop)
}

/// Without the arena no chunk is freed.
///
/// # Errors
///
/// None.
#[cfg(not(feature = "arena"))]
pub fn settle<T>(_env: &napi::Env, _store: &crate::trivia_store::TriviaStore<T>) -> napi::Result<()> {
    Ok(())
}

/// Drops `tree`, then settles its store (`settle`) when that freed what a
/// view into the store's buffers may read: a built record a side of the
/// tree held (`ParsedTree::release_sides`), or the tree's arena.
///
/// # Errors
///
/// What `settle` refuses.
#[cfg(feature = "arena")]
pub fn dispose<G: crate::engine::EngineGrammar>(env: &napi::Env, mut tree: crate::engine::ParsedTree<G>) -> napi::Result<()> {
    if !(tree.release_sides() || tree.made_arena()) {
        return Ok(());
    }
    let store = tree.store().clone();
    drop(tree);
    settle(env, &store)
}

/// Drops `tree`: without the arena no chunk is freed.
///
/// # Errors
///
/// None.
#[cfg(not(feature = "arena"))]
pub fn dispose<G: crate::engine::EngineGrammar>(_env: &napi::Env, tree: crate::engine::ParsedTree<G>) -> napi::Result<()> {
    drop(tree);
    Ok(())
}

/// The store an engine of grammar `G` writes sides into, whose built arena
/// takes the grammar's kind width and record shapes.
#[cfg(feature = "arena")]
#[must_use]
pub fn engine_store<G: crate::arena::RecordGrammar>() -> crate::trivia_store::TriviaStore<G::Trivia> {
    crate::trivia_store::TriviaStore::for_records(G::KIND_BITS, G::shape)
}

/// The store an engine of grammar `G` writes sides into.
#[cfg(not(feature = "arena"))]
#[must_use]
pub fn engine_store<G: crate::engine::EngineGrammar>() -> crate::trivia_store::TriviaStore<G::Trivia> {
    crate::trivia_store::TriviaStore::with_kind_bits(G::KIND_BITS)
}

/// Detaches every buffer over the built arena `store` holds, then frees its
/// chunks (`BuiltChunks::release_all`).
///
/// # Errors
///
/// A status napi refuses with.
#[cfg(feature = "arena")]
pub fn release_built<T>(env: &napi::Env, store: &crate::trivia_store::TriviaStore<T>) -> napi::Result<()> {
    store.buffers().detach(env)?;
    store.built_mut().release_all();
    Ok(())
}

/// Without the arena a store holds no built arena chunks.
///
/// # Errors
///
/// None.
#[cfg(not(feature = "arena"))]
pub fn release_built<T>(_env: &napi::Env, _store: &crate::trivia_store::TriviaStore<T>) -> napi::Result<()> {
    Ok(())
}

/// The table one call renders through: every lookup is the live `trees`',
/// and a trivia entry's built record renders from the arena its store holds
/// (`BuiltChunks`), with this table as its context's, so the entries inside
/// it render here too.
#[cfg(feature = "arena")]
struct ArenaSources<'a, 't, G: crate::engine::EngineGrammar> {
    grammar: G,
    trees: &'a crate::engine::ReadTrees<'t, G>,
}

#[cfg(feature = "arena")]
impl<G: crate::arena::RecordGrammar> crate::render::SourceTable for ArenaSources<'_, '_, G>
where
    G::Trivia: crate::boundary::DecodesKind,
{
    fn source_of(&self, tree_id: crate::types::TreeId) -> Option<&str> {
        self.trees.source_of(tree_id)
    }

    fn breaks_spelled_lf(&self, tree_id: crate::types::TreeId) -> bool {
        self.trees.breaks_spelled_lf(tree_id)
    }

    fn kind_of(&self, coord: &crate::slot::NodeCoordinate) -> Option<crate::types::KindId> {
        self.trees.kind_of(coord)
    }

    fn for_each_descendant(&self, coord: &crate::slot::NodeCoordinate, visit: &mut dyn FnMut(crate::types::KindId, &str) -> bool) {
        self.trees.for_each_descendant(coord, visit);
    }

    fn line_starts_inside_tokens(&self, coord: &crate::slot::NodeCoordinate) -> Vec<u32> {
        self.trees.line_starts_inside_tokens(coord)
    }

    fn last_list_child_kind(&self, tree: crate::types::TreeId, span: crate::types::Span, kind: crate::types::KindId) -> Option<crate::types::KindId> {
        self.trees.last_list_child_kind(tree, span, kind)
    }

    fn for_each_edge_level(&self, coord: &crate::slot::NodeCoordinate, side: crate::options::Side, f: &mut dyn FnMut(crate::render::EdgeLevel)) {
        self.trees.for_each_edge_level(coord, side, f);
    }

    fn depth_move(&self, coord: &crate::slot::NodeCoordinate) -> i32 {
        self.trees.depth_move(coord)
    }

    fn sides(&self, coord: &crate::slot::NodeCoordinate, lent: crate::render::Lent<'_>) -> Option<Box<dyn crate::trivia::FramedTrivia>> {
        self.trees.sides(coord, lent)
    }

    fn frames(&self, coord: &crate::slot::NodeCoordinate, lent: crate::render::Lent<'_>) -> crate::trivia::Frames {
        self.trees.frames(coord, lent)
    }

    fn slot_layouts(&self, coord: &crate::slot::NodeCoordinate, lent: crate::render::Lent<'_>) -> Vec<crate::layout::SlotLayout> {
        crate::render::SourceTable::slot_layouts(self.trees, coord, lent)
    }

    fn separator_before(&self, coord: &crate::slot::NodeCoordinate, lent: crate::render::Lent<'_>) -> Option<crate::types::KindId> {
        crate::render::SourceTable::separator_before(self.trees, coord, lent)
    }

    fn framed_span(&self, coord: &crate::slot::NodeCoordinate) -> crate::types::Span {
        self.trees.framed_span(coord)
    }

    fn edited_within(&self, coord: &crate::slot::NodeCoordinate) -> bool {
        crate::render::SourceTable::edited_within(self.trees, coord)
    }

    fn renders_as_source(&self, coord: &crate::slot::NodeCoordinate) -> bool {
        crate::render::SourceTable::renders_as_source(self.trees, coord)
    }

    fn seat_through(&self, coord: &crate::slot::NodeCoordinate, wrappers: &[Option<crate::options::SeatPath>], seat: &dyn Fn(crate::types::KindId) -> Option<crate::types::SiteId>) -> Option<crate::types::SiteId> {
        self.trees.seat_through(coord, wrappers, seat)
    }

    fn row_coordinate(&self, tree: crate::types::TreeId, index: crate::types::NodeIndex) -> Option<crate::slot::NodeCoordinate> {
        crate::render::SourceTable::row_coordinate(self.trees, tree, index)
    }

    fn read_node(&self, tree: crate::types::TreeId, index: crate::types::NodeIndex, read: &mut dyn FnMut(&mut crate::tree_sitter::TreeCursor<'_>, &mut crate::read::ReadCtx<'_>)) -> bool {
        crate::render::SourceTable::read_node(self.trees, tree, index, read)
    }

    fn render_record_entry(&self, record: crate::trivia::BuiltEntry, held: &dyn std::any::Any, options: &crate::options::ResolvedOptions, w: &mut dyn crate::render::RenderSink) -> crate::render::RenderResult {
        use crate::render::RenderError;
        admit_entry::<G>(record.kind).map_err(RenderError::Record)?;
        let store = held
            .downcast_ref::<crate::trivia_store::TriviaStore<G::Trivia>>()
            .ok_or(RenderError::Record(crate::arena::ArenaError::Unwritable("a trivia entry's store is another grammar's")))?;
        let built = store.built();
        let arena = built.readable().map_err(RenderError::Record)?;
        crate::arena::render_record_entry(self.grammar, arena, record, store, self.trees, &crate::prepare::RenderContext::new(options, self), w)
    }
}

/// The buffer JavaScript reads chunk `chunk` of `store`'s built arena
/// through, when a read wrote the chunk.
///
/// # Errors
///
/// What making the buffer refuses.
#[cfg(feature = "arena")]
pub fn read_chunk<T>(env: &napi::Env, store: &crate::trivia_store::TriviaStore<T>, chunk: u32) -> napi::Result<Option<Made>> {
    let mut buffers = store.buffers();
    let mem = store.built().read_mem(chunk);
    buffers.view::<u32>(env, false, chunk, || mem)
}

/// The name the key `key` spells (`NodeName::from_key`).
///
/// # Errors
///
/// A number that is no key.
#[cfg(feature = "arena")]
pub fn named_key(key: f64) -> napi::Result<crate::types::NodeName> {
    crate::types::NodeName::from_key(key).ok_or_else(|| napi::Error::from_reason(format!("{key} names no node a read left")))
}

/// The key of the node `tree`, made for one call over a source's records,
/// knows by `index` (`NodeName::key`); none for a node no record or slot
/// names, which nothing past the call can ask after.
///
/// # Errors
///
/// A site past what a key holds.
#[cfg(feature = "arena")]
pub fn node_key<G: crate::arena::RecordGrammar>(tree: &crate::ParsedTree<G, crate::engine::Records<'_>>, index: crate::types::NodeIndex) -> napi::Result<Option<f64>> {
    tree.name_at(index).map(|name| name.key().ok_or_else(|| napi::Error::from_reason(format!("the site of node {} of the call is past what a key holds", index.0)))).transpose()
}

/// The text bytes `start` to `end` cover in the source the record at `node`
/// of `store`'s built arena was read from.
///
/// # Errors
///
/// A record that names no source, as a builder's does, what reading the
/// source's entry refuses, and a span that is not one of the source's: past
/// its end, reversed, or splitting a character.
#[cfg(feature = "arena")]
pub fn read_text<T>(store: &crate::trivia_store::TriviaStore<T>, node: u32, start: u32, end: u32) -> napi::Result<String> {
    let built = store.built();
    let refused = |e: crate::arena::ArenaError| napi::Error::from_reason(e.to_string());
    let source = crate::arena::RunNodes::source_of(&*built, crate::arena::Address(node)).map_err(refused)?;
    let text = crate::arena::source::Source::read(&*built, source).map_err(refused)?.text;
    text.get(start as usize..end as usize).map(str::to_owned).ok_or_else(|| napi::Error::from_reason(format!("{start}..{end} is not a span of the source of the record at {node}")))
}

/// Reports to V8 what `store`'s built arena holds natively now, and detaches
/// the buffers of the chunks freed since the last report.
///
/// # Errors
///
/// What detaching a buffer or the report refuses.
#[cfg(feature = "arena")]
pub fn report_built<T>(env: &napi::Env, store: &crate::trivia_store::TriviaStore<T>) -> napi::Result<()> {
    settle_buffers(*env, &mut store.buffers(), store)
}

/// Whether a side may hold a built record of `kind`: `Ok` for a kind `G`'s
/// trivia type decodes, else `ArenaError::UnknownKind` naming that type
/// (`AdmitEntry`).
#[cfg(feature = "arena")]
pub fn admit_entry<G: crate::arena::RecordGrammar>(kind: crate::types::KindId) -> Result<(), crate::arena::ArenaError>
where
    G::Trivia: crate::boundary::DecodesKind,
{
    use crate::boundary::DecodesKind;
    if G::Trivia::decodes(kind) { Ok(()) } else { Err(crate::arena::ArenaError::UnknownKind { kind, owner: G::Trivia::OWNER }) }
}

/// `f` over the table a call renders through: the live `trees`, which also
/// render each trivia entry's built record from its store's arena
/// (`ArenaSources`).
#[cfg(feature = "arena")]
pub fn entry_sources<G: crate::arena::RecordGrammar, R>(
    grammar: G,
    trees: &crate::engine::ReadTrees<'_, G>,
    f: impl FnOnce(&dyn crate::render::SourceTable) -> R,
) -> R
where
    G::Trivia: crate::boundary::DecodesKind,
{
    f(&ArenaSources { grammar, trees })
}

/// `f` over the table a call renders through: the live `trees`; without the
/// arena no trivia entry names a built record.
#[cfg(not(feature = "arena"))]
pub fn entry_sources<G: crate::engine::EngineGrammar, R>(
    _grammar: G,
    trees: &crate::engine::ReadTrees<'_, G>,
    f: impl FnOnce(&dyn crate::render::SourceTable) -> R,
) -> R {
    f(trees)
}
