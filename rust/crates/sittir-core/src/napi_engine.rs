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
//! `thread_local!`, because tree ids are minted from `globalThis` and each
//! JavaScript thread has its own — a table shared across threads would meet
//! the same id twice.
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
                ::std::collections::HashMap<$crate::types::TreeId, $crate::ParsedTree<$grammar>>,
            > = ::std::cell::RefCell::new(::std::collections::HashMap::new());
            /// The buffers JavaScript reads each live tree's arena chunks
            /// through, detached when the tree is dropped.
            static TREE_BUFFERS: ::std::cell::RefCell<
                ::std::collections::HashMap<$crate::types::TreeId, $crate::napi_engine::Buffers>,
            > = ::std::cell::RefCell::new(::std::collections::HashMap::new());
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
                let _ = buffers.detach(&env);
            }
            if let Some(tree) = LIVE_TREES.with(|trees| trees.borrow_mut().remove(&tree_id)) {
                let store = tree.written().clone();
                drop(tree);
                let _ = $crate::napi_engine::settle(&env, &store);
            }
        }

        /// Runs `f` on the live tree `tree_id` and the node at `index` of it,
        /// both checked: refuses a tree that is not live and an index naming
        /// no node of it.
        fn with_live_node<R>(
            tree_id: $crate::types::TreeId,
            index: $crate::types::NodeIndex,
            f: impl FnOnce(&mut $crate::ParsedTree<$grammar>, $crate::types::NodeIndex) -> ::napi::Result<R>,
        ) -> ::napi::Result<R> {
            LIVE_TREES.with(|trees| {
                let mut trees = trees.borrow_mut();
                let parsed = trees.get_mut(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                $crate::napi_engine::check_node(parsed, index)?;
                f(parsed, index)
            })
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
            $crate::napi_engine::check_node(parsed, index)?;
            if let Some(error) = parsed.read_error(index) {
                return Ok(::napi::Either::B(error));
            }
            let grammar = parsed.grammar();
            ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| parsed.read::<$any>(index, depth)))
                .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(&*payload, "read panicked")))?
                .map(::napi::Either::A)
                .map_err(|refusal| ::napi::Error::from_reason(refusal.describe(&|kind| $crate::engine::EngineGrammar::kind_name(grammar, kind))))
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
                let claim = self.claim_tree_id(&env)?;
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
                LIVE_TREES.with(|trees| trees.borrow_mut().insert(tree_id, parsed));
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
        pub fn read(tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex, depth: Option<f64>) -> ::napi::Result<::napi::Either<$any, $crate::ErrorRead>> {
            let depth = $crate::napi_engine::depth_from_wire(depth)?;
            LIVE_TREES.with(|trees| {
                let trees = trees.borrow();
                let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                read_node(parsed, index, depth)
            })
        }

        /// The sides of the unit children of the node at `index` of the
        /// live tree `treeId`, which their slots store as bare kinds: each
        /// `{ slot, item, leading?, trailing?, inner? }`, by its slot's wire
        /// key and its item in that slot. Refuses as `triviaSide` does.
        #[::napi_derive::napi(ts_return_type = "object[]")]
        pub fn unit_sides(tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<Vec<$crate::layout::UnitSides<<$grammar as $crate::engine::EngineGrammar>::Trivia>>> {
            with_live_node(tree_id, index, |parsed, index| Ok(parsed.unit_sides(index)))
        }

        /// The stored layout of each list slot of the node at `index` of
        /// the live tree `treeId` that stores any: each `{ slot, before?,
        /// after?, separator? }`, by its slot's wire key. Refuses as
        /// `triviaSide` does.
        #[::napi_derive::napi(ts_return_type = "object[]")]
        pub fn slot_layouts(tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<Vec<$crate::layout::SlotLayout>> {
            with_live_node(tree_id, index, |parsed, index| Ok(parsed.slot_layouts(index)))
        }

        /// The separator the list at `index` of the live tree `treeId`
        /// writes between its items, as a grammar id: the one its source
        /// spells where the slot stores one, else the one the read-time
        /// options render. Null for a node that is no list. Refuses as
        /// `triviaSide` does.
        #[::napi_derive::napi(ts_return_type = "import('../src/types.ts').TSKindId | null")]
        pub fn slot_separator(tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<Option<$crate::types::KindId>> {
            with_live_node(tree_id, index, |parsed, index| Ok(parsed.slot_separator(index)))
        }

        /// The separator before the node at `index` of the live tree
        /// `treeId` as an item of its parent's list slot, as a grammar id,
        /// where its source spells another than the one the slot renders.
        /// Refuses as `triviaSide` does.
        #[::napi_derive::napi(ts_return_type = "import('../src/types.ts').TSKindId | null")]
        pub fn separator_before(tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<Option<$crate::types::KindId>> {
            with_live_node(tree_id, index, |parsed, index| Ok(parsed.separator_before(index)))
        }

        /// A snapshot of the node at `index` of the live tree `treeId`: the
        /// node read at every depth into plain data with no tree, each
        /// node with its span (`$_layout.span`) from the native node that
        /// holds it and each placed extra with its text, the node itself
        /// measured from the byte `holderByte`, or from its own start when
        /// absent. Refuses as `read` does.
        #[::napi_derive::napi(ts_return_type = "object")]
        pub fn snapshot(tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex, holder_byte: Option<f64>) -> ::napi::Result<::napi::Either<$any, $crate::ErrorRead>> {
            let holder_byte = holder_byte.map(|byte| $crate::napi_engine::checked_whole::<u32>(byte, "holderByte")).transpose()?;
            LIVE_TREES.with(|trees| {
                let trees = trees.borrow();
                let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                $crate::napi_engine::check_node(parsed, index)?;
                if let Some(error) = parsed.snapshot_error(index, holder_byte) {
                    return Ok(::napi::Either::B(error));
                }
                let grammar = <$grammar as ::std::default::Default>::default();
                ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| parsed.snapshot::<$any>(index, holder_byte)))
                    .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(&*payload, "snapshot panicked")))?
                    .map(::napi::Either::A)
                    .map_err(|refusal| ::napi::Error::from_reason(refusal.describe(&|kind| $crate::engine::EngineGrammar::kind_name(grammar, kind))))
            })
        }

        /// The entries of `side` (`leading`, `trailing` or `inner`) of the
        /// node at `index` of the live tree `treeId`: the ones a write gave
        /// it, else the ones the tree's trivia table assigns it. Refuses a
        /// tree that is not live, an index naming no node of it, and any
        /// other side.
        #[::napi_derive::napi(ts_return_type = "object[]")]
        pub fn trivia_side(
            tree_id: $crate::types::TreeId,
            index: $crate::types::NodeIndex,
            side: String,
        ) -> ::napi::Result<Vec<$crate::trivia::TriviaEntry<<$grammar as $crate::engine::EngineGrammar>::Trivia>>> {
            let side = $crate::napi_engine::trivia_side_from_wire(&side)?;
            with_live_node(tree_id, index, |parsed, index| Ok(parsed.trivia_side(index, side)))
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
            let store = with_live_node(tree_id, index, |parsed, index| {
                parsed.write_trivia_side(index, side, entries).map_err(::napi::Error::from_reason)?;
                Ok(parsed.written().clone())
            })?;
            $crate::napi_engine::settle(&env, &store)
        }

        /// Whether a write replaced a side of a node under the node at
        /// `index` of the live tree `treeId`, its own `inner` included, and
        /// its own leading and trailing too when `ownSides` is set. Refuses
        /// a tree that is not live and an index naming no node of it.
        #[::napi_derive::napi]
        pub fn edited_within(tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex, own_sides: bool) -> ::napi::Result<bool> {
            with_live_node(tree_id, index, |parsed, index| Ok(parsed.edited_within(index, own_sides)))
        }

        /// The siblings that hold sides beside the node at `index` of the
        /// live tree `treeId`, as JSON `{ previous, next }`: the `{ start,
        /// end }` span of each, taken at the outermost node spanning exactly
        /// the node's bytes, `null` when that node starts (ends) its parent.
        /// Refuses a tree that is not live and an index naming no node of it.
        #[::napi_derive::napi]
        pub fn siblings(tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<String> {
            with_live_node(tree_id, index, |parsed, index| {
                ::serde_json::to_string(&parsed.siblings(index)).map_err(|e| ::napi::Error::from_reason(e.to_string()))
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
        pub fn is_empty(tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<bool> {
            with_live_node(tree_id, index, |parsed, index| Ok(parsed.is_empty(index)))
        }

        /// Every run of whitespace a side of the live tree `treeId` takes
        /// (`TriviaTable::runs`), each with the line breaks the options in
        /// effect at read time write there (`ParsedTree::baseline_gap`),
        /// absent where nothing the record wrote is anchored: read from
        /// each run's region, or from the record of the whole tree when
        /// `whole`. A diagnostic: the assignment reads the same breaks.
        /// Refuses a tree that is not live and a record whose read or
        /// render refused.
        #[::napi_derive::napi]
        pub fn layout_baseline(tree_id: $crate::types::TreeId, whole: Option<bool>) -> ::napi::Result<Vec<$crate::napi_engine::BaselineRun>> {
            with_live_node(tree_id, $crate::types::NodeIndex::ROOT, |parsed, _| {
                let runs = parsed.baseline_runs(whole.unwrap_or(false)).map_err(::napi::Error::from_reason)?;
                Ok(runs.into_iter().map(|(run, written)| $crate::napi_engine::BaselineRun::new(run, written)).collect())
            })
        }

        /// How much of its layout the live tree `treeId` stores apart from
        /// its read-time options (`ParsedTree::stored_layout`): `{
        /// deviations, slots, separators }`. A diagnostic. Refuses a tree
        /// that is not live.
        #[::napi_derive::napi(ts_return_type = "{ deviations: number; slots: number; separators: number }")]
        pub fn stored_layout(tree_id: $crate::types::TreeId) -> ::napi::Result<$crate::layout::StoredLayout> {
            with_live_node(tree_id, $crate::types::NodeIndex::ROOT, |parsed, _| Ok(parsed.stored_layout()))
        }

        /// The work the live tree `treeId`'s layout reads have done so far
        /// (`ParsedTree::layout_work`): `{ regionNodes, siblingItems }`. A
        /// diagnostic. Refuses a tree that is not live.
        #[::napi_derive::napi(ts_return_type = "{ regionNodes: number; siblingItems: number }")]
        pub fn layout_work(tree_id: $crate::types::TreeId) -> ::napi::Result<$crate::layout::LayoutWork> {
            with_live_node(tree_id, $crate::types::NodeIndex::ROOT, |parsed, _| Ok(parsed.layout_work()))
        }

        /// The bytes the node at `index` of the live tree `treeId` renders
        /// between as its source (`ParsedTree::framed_span_at`): `{ start,
        /// end }`. A diagnostic. Refuses as `read` does.
        #[::napi_derive::napi(ts_return_type = "{ start: number; end: number }")]
        pub fn framed_span(tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<$crate::types::Span> {
            with_live_node(tree_id, index, |parsed, index| {
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
            LIVE_TREES.with(|trees| {
                let trees = trees.borrow();
                let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
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
                let node = $crate::engine::node_at_index(parsed.tree(), index)
                    .ok_or_else(|| ::napi::Error::from_reason(format!("index {index} names no node of tree {tree_id}")))?;
                Ok($crate::engine::line_starts_inside_tokens(node, index, parsed.source()))
            })
        }

        /// Whether each node `addresses` names (a JSON array of
        /// `query::Address`, all in one tree) satisfies the `where` plan
        /// (JSON, see `query::PlanSpec`), in order. Refuses a tree that is
        /// not live, an address naming no node of it, and a plan whose
        /// pattern the native matcher cannot compile.
        #[::napi_derive::napi]
        pub fn plan_holds(addresses: String, plan: String) -> ::napi::Result<Vec<bool>> {
            let plan = $crate::napi_engine::compile_plan(&plan)?;
            let addresses: Vec<$crate::query::Address> =
                ::serde_json::from_str(&addresses).map_err(|e| ::napi::Error::from_reason(e.to_string()))?;
            let Some(first) = addresses.first() else { return Ok(Vec::new()) };
            let (tree_id, _) = $crate::engine::decode_handle(first.tree_handle());
            LIVE_TREES.with(|trees| {
                let trees = trees.borrow();
                let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
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
            ts_args_type = "engine: object, node: object, treeId?: number | undefined | null, options?: object | undefined | null"
        )]
        pub fn render(
            engine: &::napi::bindgen_prelude::External<EngineCell>,
            env: ::napi::Env,
            node: $render_root,
            tree_id: Option<$crate::types::TreeId>,
            options: Option<$options>,
        ) -> ::napi::Result<String> {
            let engine = engine_of(engine)?;
            // No JavaScript runs while the table is borrowed, so the
            // borrow cannot be re-entered.
            LIVE_TREES.with(|trees| {
                let trees = trees.borrow();
                let resolved = render_options(&engine, tree_id.and_then(|id| trees.get(&id)), options)?;
                let table = &resolved;
                let canonical = $crate::napi_engine::entry_sources(engine.grammar(), &*trees, |sources| {
                    let ctx = $crate::prepare::RenderContext { options: table, sources };
                    $render_parts(node, &ctx, None).map(|(_, canonical)| canonical)
                })
                .map_err(|e| ::napi::Error::from_reason(format!("render_node failed: {e}")))?;
                Ok($crate::line_endings::spell(canonical, &table.newline))
            })
        }

        #[::napi_derive::napi(
            ts_args_type = "engine: object, node: object, path: string, treeId?: number | undefined | null, options?: object | undefined | null"
        )]
        pub fn render_to_file(
            engine: &::napi::bindgen_prelude::External<EngineCell>,
            env: ::napi::Env,
            node: $render_root,
            path: String,
            tree_id: Option<$crate::types::TreeId>,
            options: Option<$options>,
        ) -> ::napi::Result<()> {
            let rendered = render(engine, env, node, tree_id, options)?;
            ::std::fs::write(&path, rendered).map_err(|e| {
                ::napi::Error::from_reason(format!("render_to_file failed for {path}: {e}"))
            })
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

        impl SittirEngine {

            /// Take the next tree id from the JavaScript process, refusing to wrap.
            ///
            /// Every grammar's addon is its own linked image, so a counter in
            /// Rust static memory would be one counter per addon and a rust
            /// engine and a typescript engine could both mint tree 0. The
            /// process's one `globalThis` is the owner every addon shares: the
            /// next id lives there, so a coordinate minted by any engine names
            /// no tree in any other, whatever grammar it speaks. Ids are never
            /// reused, so exhausting them is the honest end state.
            fn claim_tree_id(&mut self, env: &::napi::Env) -> ::napi::Result<$crate::engine::TreeClaim> {
                const KEY: &str = "__sittirNextTreeId";
                let mut global = env.get_global()?;
                let next: Option<f64> = ::napi::bindgen_prelude::JsObjectValue::get_named_property(&global, KEY)?;
                let (id, record) = $crate::engine::claim_tree_id_from(next).ok_or_else(|| {
                    ::napi::Error::from_reason(format!(
                        "this process exhausted its {} tree ids",
                        $crate::engine::MAX_TREE_ID
                    ))
                })?;
                ::napi::bindgen_prelude::JsObjectValue::set_named_property(&mut global, KEY, record)?;
                Ok(id)
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

            /// Reports the memory the live tree `tree_id`'s arena takes now
            /// to V8, after a read that may have written records.
            fn report_tree(env: &::napi::Env, tree_id: $crate::types::TreeId, parsed: &$crate::ParsedTree<$grammar>) -> ::napi::Result<()> {
                TREE_BUFFERS.with(|buffers| buffers.borrow_mut().entry(tree_id).or_default().report(env, parsed.arena_bytes()))
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
                    &::std::collections::HashMap<$crate::types::TreeId, $crate::ParsedTree<$grammar>>,
                    &$crate::prepare::RenderContext<'_>,
                ) -> Result<String, $crate::render::RenderError>,
            ) -> ::napi::Result<String> {
                let chunks = owner.written().built();
                let arena = chunks.readable().map_err(|e| ::napi::Error::from_reason(e.to_string()))?;
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let table = render_options(engine, tree_id.and_then(|id| trees.get(&id)), options)?;
                    let canonical = $crate::napi_engine::entry_sources(engine.grammar(), &*trees, |sources| {
                        let ctx = $crate::prepare::RenderContext { options: &table, sources };
                        ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| render(arena, &*trees, &ctx)))
                    })
                        .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(&*payload, "render_built panicked")))?
                        .map_err(|e| ::napi::Error::from_reason(format!("render_built failed: {e}")))?;
                    Ok($crate::line_endings::spell(canonical, &table.newline))
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
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                    let at = record_of(parsed, index, depth, false)?;
                    report_tree(&env, tree_id, parsed)?;
                    Ok(at)
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
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                    let at = record_of(parsed, index, depth, true)?;
                    report_tree(&env, tree_id, parsed)?;
                    Ok(at)
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
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                    let at = ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| parsed.read_cell::<$any>($crate::arena::Address(holder), word, item, depth)))
                        .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(&*payload, "read panicked")))?
                        .map_err(::napi::Error::from_reason)?;
                    report_tree(&env, tree_id, parsed)?;
                    Ok(at.0)
                })
            }

            /// The hydrated typed nodes below `index` in stored field
            /// order, as a JSON list of their rows' coordinates. Units and
            /// captured strings are omitted. Exports no node fields or
            /// words.
            #[::napi_derive::napi]
            pub fn record_candidates(tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<String> {
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                    $crate::napi_engine::check_node(parsed, index)?;
                    let candidates = ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| parsed.record_candidates::<$any>(index)))
                        .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(&*payload, "record_candidates panicked")))?
                        .map_err(|e| ::napi::Error::from_reason(format!("record_candidates failed: {e}")))?;
                    let wire = candidates.into_iter().map($crate::query::QueryCoordinate::from).collect::<Vec<_>>();
                    ::serde_json::to_string(&wire).map_err(|e| ::napi::Error::from_reason(e.to_string()))
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
                tree_id: $crate::types::TreeId,
                indexes: Vec<$crate::types::NodeIndex>,
                depth: Option<f64>,
                wire: String,
            ) -> ::napi::Result<::napi::Either<Vec<::napi::Either<$any, $crate::ErrorRead>>, ::napi::bindgen_prelude::Uint32Array>> {
                let depth = $crate::napi_engine::depth_from_wire(depth)?;
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
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
            /// trivia entry's built record from its store's arena. Refuses
            /// a tree that is not live, an address naming no record of its
            /// arena, and a record whose render refuses.
            #[::napi_derive::napi(ts_args_type = "engine: object, treeId: number, address: number, leading: boolean, trailing: boolean, options?: object | undefined | null")]
            pub fn render_record(engine: &::napi::bindgen_prelude::External<EngineCell>, env: ::napi::Env, tree_id: $crate::types::TreeId, address: f64, leading: bool, trailing: bool, options: Option<$options>) -> ::napi::Result<String> {
                let engine = engine_of(engine)?;
                let address = $crate::arena::Address($crate::napi_engine::checked_whole(address, "address")?);
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                    let table = render_options(&engine, Some(parsed), options)?;
                    let canonical = $crate::napi_engine::entry_sources(engine.grammar(), &*trees, |sources| ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| parsed.render_record(address, $crate::slot::ChangedEdges { leading, trailing }, &table, sources))))
                        .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(&*payload, "render_record panicked")))?
                        .map_err(|e| ::napi::Error::from_reason(format!("render_record failed: {e}")))?;
                    Ok($crate::line_endings::spell(canonical, &table.newline))
                })
            }

            /// The built record at `address` of the built arena `owner`
            /// holds (`holdBuiltArena`) rendered as a render root whose
            /// `leading` and `trailing` edges have no neighbour, under
            /// `options` over the layer of the tree `treeId` names, the
            /// tree the root was rebuilt from, over this engine's, with
            /// the sides `owner` holds:
            /// the engine that built the arena, which its records' side
            /// writes went to. The arena's chunks are borrowed for this
            /// call; the records the root reaches are admitted, and the
            /// parsed trees they link held for the render
            /// (`Engine::render_built`). Refuses an arena `owner` no
            /// longer holds, an address naming no record its words admit,
            /// a linked tree that is not live, and a record whose render
            /// refuses.
            #[::napi_derive::napi(ts_args_type = "engine: object, owner: object, address: number, leading: boolean, trailing: boolean, treeId?: number | undefined | null, options?: object | undefined | null")]
            #[allow(clippy::too_many_arguments, reason = "each parameter is one of the JavaScript call's arguments")]
            pub fn render_built(engine: &::napi::bindgen_prelude::External<EngineCell>, env: ::napi::Env, owner: &::napi::bindgen_prelude::External<EngineCell>, address: f64, leading: bool, trailing: bool, tree_id: Option<$crate::types::TreeId>, options: Option<$options>) -> ::napi::Result<String> {
                let engine = engine_of(engine)?;
                let owner = engine_of(owner)?;
                let at = $crate::arena::Address($crate::napi_engine::checked_whole(address, "address")?);
                render_built_with(&engine, &env, &owner, tree_id, options, |arena, trees, ctx| owner.render_built(arena, at, $crate::slot::ChangedEdges { leading, trailing }, trees, ctx))
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
            #[::napi_derive::napi(ts_args_type = "engine: object, owner: object, kind: number, entry: number, sides: object | undefined | null, leading: boolean, trailing: boolean, options?: object | undefined | null")]
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
            ) -> ::napi::Result<String> {
                let engine = engine_of(engine)?;
                let owner = engine_of(owner)?;
                let kind = $crate::types::KindId(u16::try_from(kind).map_err(|_| ::napi::Error::from_reason(format!("kind {kind} is wider than a kind")))?);
                render_built_with(&engine, &env, &owner, None, options, |arena, _, ctx| owner.render_built_leaf(arena, kind, $crate::arena::Address(entry), sides, $crate::slot::ChangedEdges { leading, trailing }, ctx))
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

            /// Renders the parsed candidate at row `index` without exporting
            /// its data or its outer trivia: the row's record, or, for a
            /// recordless node, its native coordinate.
            #[::napi_derive::napi(ts_args_type = "engine: object, treeId: number, index: number, options?: object | undefined | null")]
            pub fn render_candidate(engine: &::napi::bindgen_prelude::External<EngineCell>, env: ::napi::Env, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex, options: Option<$options>) -> ::napi::Result<String> {
                let engine = engine_of(engine)?;
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                    let table = render_options(&engine, Some(parsed), options)?;
                    let canonical = $crate::napi_engine::entry_sources(engine.grammar(), &*trees, |sources| ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| parsed.render_candidate::<$any>(index, &table, sources))))
                        .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(&*payload, "render_candidate panicked")))?
                        .map_err(|e| ::napi::Error::from_reason(format!("render_candidate failed: {e}")))?;
                    Ok($crate::line_endings::spell(canonical, &table.newline))
                })
            }

            /// The coordinate a read of the live tree `treeId` names the node
            /// at `index` by, as `[kind, end]`: the kind the read stamps on
            /// it and the row after its subtree (`ParsedTree::row_coordinate`),
            /// the one derivation a record view's coordinate takes. Refuses a
            /// tree that is not live and an index past its last node.
            #[::napi_derive::napi]
            pub fn coordinate(tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<Vec<u32>> {
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
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
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
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

/// Refuses an index that names no node of `parsed`.
pub fn check_node<G: crate::engine::EngineGrammar>(parsed: &crate::ParsedTree<G>, index: crate::types::NodeIndex) -> napi::Result<()> {
    match crate::engine::node_at_index(parsed.tree(), index) {
        Some(_) => Ok(()),
        None => Err(napi::Error::from_reason(format!("index {index} names no node of tree {}", parsed.tree_id()))),
    }
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
    held: std::collections::HashMap<(bool, u32), WeakValue>,
    meta: std::collections::HashMap<u32, WeakValue>,
    reported: i64,
    unreported: Vec<u32>,
}

// SAFETY: as `WeakValue`: every reference is read and deleted only on the
// JavaScript thread, inside a call that hands over its `env`.
#[cfg(feature = "arena")]
unsafe impl Send for Buffers {}

#[cfg(feature = "arena")]
impl std::fmt::Debug for Buffers {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Buffers").field("chunks", &self.held.len()).field("reported", &self.reported).field("unreported", &self.unreported).finish_non_exhaustive()
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

    /// Reports `bytes`, the memory of the arena now, to V8, in place of what
    /// was reported.
    ///
    /// # Errors
    ///
    /// A status napi refuses with.
    pub fn report(&mut self, env: &napi::Env, bytes: usize) -> napi::Result<()> {
        let now = i64::try_from(bytes).unwrap_or(i64::MAX);
        let change = now - self.reported;
        if change != 0 {
            let mut adjusted = 0;
            // SAFETY: a plain accounting call on the JavaScript thread.
            napi::check_status!(unsafe { napi::sys::napi_adjust_external_memory(env.raw(), change, &raw mut adjusted) })?;
            self.reported = now;
        }
        Ok(())
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
    /// each reference, and reports the arena's memory as gone.
    ///
    /// # Errors
    ///
    /// A status napi refuses with.
    pub fn detach(&mut self, env: &napi::Env) -> napi::Result<()> {
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

/// Without the arena no buffer is made over a chunk.
#[cfg(not(feature = "arena"))]
#[derive(Default)]
pub struct Buffers;

#[cfg(not(feature = "arena"))]
impl Buffers {
    /// Without the arena there is nothing to detach.
    ///
    /// # Errors
    ///
    /// None.
    pub fn detach(&mut self, _env: &napi::Env) -> napi::Result<()> {
        Ok(())
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
    buffers.report(&env, store.built().allocated_bytes())
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
struct ArenaSources<'a, G: crate::engine::EngineGrammar, H> {
    grammar: G,
    trees: &'a std::collections::HashMap<crate::types::TreeId, crate::engine::ParsedTree<G>, H>,
}

#[cfg(feature = "arena")]
impl<G: crate::arena::RecordGrammar, H: std::hash::BuildHasher> crate::render::SourceTable for ArenaSources<'_, G, H>
where
    G::Trivia: crate::boundary::DecodesKind,
{
    fn source_of(&self, tree_id: crate::types::TreeId) -> Option<&std::sync::Arc<str>> {
        self.trees.source_of(tree_id)
    }

    fn kind_of(&self, coord: &crate::slot::NodeCoordinate) -> Option<crate::types::KindId> {
        self.trees.kind_of(coord)
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

    fn sides(&self, coord: &crate::slot::NodeCoordinate) -> Option<Box<dyn crate::trivia::FramedTrivia>> {
        self.trees.sides(coord)
    }

    fn frames(&self, coord: &crate::slot::NodeCoordinate) -> crate::trivia::Frames {
        self.trees.frames(coord)
    }

    fn slot_layouts(&self, coord: &crate::slot::NodeCoordinate) -> Vec<crate::layout::SlotLayout> {
        crate::render::SourceTable::slot_layouts(self.trees, coord)
    }

    fn separator_before(&self, coord: &crate::slot::NodeCoordinate) -> Option<crate::types::KindId> {
        crate::render::SourceTable::separator_before(self.trees, coord)
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

    fn read_ctx(&self, tree: crate::types::TreeId) -> Option<(&tree_sitter::Tree, crate::read::ReadCtx<'_>)> {
        crate::render::SourceTable::read_ctx(self.trees, tree)
    }

    fn render_record_entry(&self, record: crate::trivia::BuiltEntry, held: &dyn std::any::Any, options: &crate::options::ResolvedOptions, w: &mut dyn crate::render::RenderSink) -> crate::render::RenderResult {
        use crate::boundary::DecodesKind;
        use crate::render::RenderError;
        if !G::Trivia::decodes(record.kind) {
            return Err(RenderError::Record(crate::arena::ArenaError::UnknownKind { kind: record.kind, owner: G::Trivia::OWNER }));
        }
        let store = held
            .downcast_ref::<crate::trivia_store::TriviaStore<G::Trivia>>()
            .ok_or(RenderError::Record(crate::arena::ArenaError::Unwritable("a trivia entry's store is another grammar's")))?;
        let built = store.built();
        let arena = built.readable().map_err(RenderError::Record)?;
        crate::arena::render_record_entry(self.grammar, arena, record, store, self.trees, &crate::prepare::RenderContext { options, sources: self }, w)
    }
}

/// `f` over the table a call renders through: the live `trees`, which also
/// render each trivia entry's built record from its store's arena
/// (`ArenaSources`).
#[cfg(feature = "arena")]
pub fn entry_sources<G: crate::arena::RecordGrammar, H: std::hash::BuildHasher, R>(
    grammar: G,
    trees: &std::collections::HashMap<crate::types::TreeId, crate::engine::ParsedTree<G>, H>,
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
pub fn entry_sources<G: crate::engine::EngineGrammar, H: std::hash::BuildHasher, R>(
    _grammar: G,
    trees: &std::collections::HashMap<crate::types::TreeId, crate::engine::ParsedTree<G>, H>,
    f: impl FnOnce(&dyn crate::render::SourceTable) -> R,
) -> R {
    f(trees)
}
