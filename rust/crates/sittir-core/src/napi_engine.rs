//! The napi engine every grammar crate exposes, defined once.
//!
//! [`napi_engine!`] emits the `SittirEngine` class (parse, read, render,
//! edits) and the addon's live-tree table behind it. A grammar crate supplies only
//! what is actually grammar-specific — its parser hook, its transport root
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

/// Emit the `SittirEngine` napi class for one grammar.
///
/// - `$grammar` — the crate's [`EngineGrammar`](crate::engine::EngineGrammar) adapter.
/// - `$render_root` — the generated transport root type accepted by `render`.
/// - `$any` — the grammar's any-transport: what `read` reads a node into, and
///   the parent type it reads any parent's routes with.
/// - `$options` — the grammar's `sittir_core::options::Options<Sites>` (`render::options::Options`), read through its address trie; the shape `EngineOptions.options` and `render`/`render_to_file` accept.
/// - `$render_parts` — `fn(&$render_root) -> Result<(Source, String), _>`.
/// - `$abi` — the render transport ABI version this crate was generated against.
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
        }

        /// Drop one tree. Called from the boundary's `FinalizationRegistry`
        /// once JavaScript has collected the last object naming it.
        /// Unknown ids are not an error — a tree can only be dropped once,
        /// and the registry has no way to know whether it already was.
        #[::napi_derive::napi]
        pub fn dispose_tree(tree_id: f64) {
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
            LIVE_TREES.with(|trees| {
                trees.borrow_mut().remove(&tree_id);
            });
        }

        /// Runs `f` on the live tree `tree_id` and the node at `index` of it,
        /// both checked: refuses a tree that is not live and an index naming
        /// no node of it.
        fn with_live_node<R>(
            tree_id: $crate::types::TreeId,
            index: $crate::types::NodeIndex,
            f: impl FnOnce(&mut $crate::ParsedTree<$grammar>, u32) -> ::napi::Result<R>,
        ) -> ::napi::Result<R> {
            let index = index.get();
            LIVE_TREES.with(|trees| {
                let mut trees = trees.borrow_mut();
                let parsed = trees.get_mut(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                if $crate::engine::node_at_index(parsed.tree(), index).is_none() {
                    return Err(::napi::Error::from_reason(format!("index {index} names no node of tree {tree_id}")));
                }
                f(parsed, index)
            })
        }

        /// A tree id as JavaScript holds it: a whole number.
        #[::napi_derive::napi]
        pub type TreeId = u32;

        /// A node index as JavaScript holds it: a whole number.
        #[::napi_derive::napi]
        pub type NodeIndex = u32;

        /// Number of trees still held on this thread. Diagnostics only — the
        /// boundary's disposal is driven by GC, so this is the way a test can
        /// observe that trees are actually being released.
        #[::napi_derive::napi]
        pub fn live_tree_count() -> u32 {
            LIVE_TREES.with(|trees| trees.borrow().len() as u32)
        }

        #[::napi_derive::napi]
        pub struct SittirEngine {
            engine: $crate::engine::Engine<$grammar>,
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
                Ok(Self {
                    engine: $crate::engine::Engine::new(
                        <$grammar as ::std::default::Default>::default(),
                        table,
                    )
                    .map_err(::napi::Error::from_reason)?,
                })
            }

            #[::napi_derive::napi(getter)]
            pub fn render_module_hash(&self) -> &'static str {
                self.engine.render_module_hash()
            }

            #[::napi_derive::napi(getter)]
            pub fn native_render_transport_abi(&self) -> u32 {
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
                    .find_and_read(source, pattern)
                    .map_err(::napi::Error::from_reason)
            }

            /// Parse `source` and keep its tree. As JSON `{ treeId, options,
            /// errors }`: the id `read` and `disposeTree` take, the tree's
            /// layer of the render options (`ParsedTree::inferred_options`),
            /// and its error regions.
            #[::napi_derive::napi]
            pub fn parse(&mut self, env: ::napi::Env, source: String) -> ::napi::Result<String> {
                let tree_id = self.claim_tree_id(&env)?;
                let parsed = self.engine.parse(source, tree_id).map_err(::napi::Error::from_reason)?;
                let json = ::serde_json::json!({
                    "treeId": tree_id,
                    "options": parsed.inferred_options(),
                    "errors": parsed.error_regions(),
                })
                .to_string();
                LIVE_TREES.with(|trees| trees.borrow_mut().insert(tree_id, parsed));
                Ok(json)
            }

            /// The node at `index` of tree `treeId` read into its transport,
            /// `depth` levels down (one when absent, `Infinity` for all); index 0
            /// is the root. An `ERROR` node reads as its text and coordinate.
            /// Refuses a tree that is not live, an index past its last node,
            /// and a node the model has no route for, naming the kind, the
            /// child and the index.
            #[::napi_derive::napi(ts_return_type = "object")]
            pub fn read(&self, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex, depth: Option<f64>) -> ::napi::Result<::napi::Either<$any, $crate::ErrorRead>> {
                let index = index.get();
                let depth = $crate::napi_engine::depth_from_wire(depth)?;
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                    if $crate::engine::node_at_index(parsed.tree(), index).is_none() {
                        return Err(::napi::Error::from_reason(format!("index {index} names no node of tree {tree_id}")));
                    }
                    if let Some(error) = parsed.read_error(index) {
                        return Ok(::napi::Either::B(error));
                    }
                    let grammar = <$grammar as ::std::default::Default>::default();
                    ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| parsed.read::<$any>(index, depth)))
                        .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(payload, "read panicked")))?
                        .map(::napi::Either::A)
                        .map_err(|refusal| ::napi::Error::from_reason(refusal.describe(&|kind| $crate::engine::EngineGrammar::kind_name(grammar, kind))))
                })
            }

            /// The sides of the unit children of the node at `index` of the
            /// live tree `treeId`, which their slots store as bare kinds: each
            /// `{ slot, item, leading?, trailing?, inner? }`, by its slot's wire
            /// key and its item in that slot. Refuses as `triviaSide` does.
            #[::napi_derive::napi(ts_return_type = "object[]")]
            pub fn unit_sides(&self, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<Vec<$crate::layout::UnitSides<<$grammar as $crate::engine::EngineGrammar>::Trivia>>> {
                with_live_node(tree_id, index, |parsed, index| Ok(parsed.unit_sides(index)))
            }

            /// The stored layout of each list slot of the node at `index` of
            /// the live tree `treeId` that stores any: each `{ slot, before?,
            /// after?, separator? }`, by its slot's wire key. Refuses as
            /// `triviaSide` does.
            #[::napi_derive::napi(ts_return_type = "object[]")]
            pub fn slot_layouts(&self, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<Vec<$crate::layout::SlotLayout>> {
                with_live_node(tree_id, index, |parsed, index| Ok(parsed.slot_layouts(index)))
            }

            /// The separator before the node at `index` of the live tree
            /// `treeId` as an item of its parent's list slot, as a grammar id,
            /// where its source spells another than the one the slot renders.
            /// Refuses as `triviaSide` does.
            #[::napi_derive::napi(ts_return_type = "import('../src/types.ts').TSKindId | null")]
            pub fn separator_before(&self, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<Option<$crate::types::KindId>> {
                with_live_node(tree_id, index, |parsed, index| Ok(parsed.separator_before(index)))
            }

            /// A snapshot of the node at `index` of the live tree `treeId`: the
            /// node read at every depth into plain data with no tree, each
            /// node with its span (`$_layout.span`) from the transport that
            /// holds it and each placed extra with its text, the node itself
            /// measured from the byte `holderByte`, or from its own start when
            /// absent. Refuses as `read` does.
            #[::napi_derive::napi(ts_return_type = "object")]
            pub fn snapshot(&self, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex, holder_byte: Option<u32>) -> ::napi::Result<::napi::Either<$any, $crate::ErrorRead>> {
                let index = index.get();
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                    if $crate::engine::node_at_index(parsed.tree(), index).is_none() {
                        return Err(::napi::Error::from_reason(format!("index {index} names no node of tree {tree_id}")));
                    }
                    if let Some(error) = parsed.snapshot_error(index, holder_byte) {
                        return Ok(::napi::Either::B(error));
                    }
                    let grammar = <$grammar as ::std::default::Default>::default();
                    ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| parsed.snapshot::<$any>(index, holder_byte)))
                        .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(payload, "snapshot panicked")))?
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
                &self,
                tree_id: $crate::types::TreeId,
                index: $crate::types::NodeIndex,
                side: String,
            ) -> ::napi::Result<Vec<$crate::trivia::TriviaEntry<<$grammar as $crate::engine::EngineGrammar>::Trivia>>> {
                let side = $crate::napi_engine::trivia_side_from_wire(&side)?;
                with_live_node(tree_id, index, |parsed, index| Ok(parsed.trivia_side(index, side)))
            }

            /// Replace `side` of the node at `index` of the live tree `treeId`
            /// with `entries`. Refuses as `triviaSide` does.
            #[::napi_derive::napi]
            pub fn write_trivia_side(
                &self,
                tree_id: $crate::types::TreeId,
                index: $crate::types::NodeIndex,
                side: String,
                #[napi(ts_arg_type = "object[]")] entries: Vec<$crate::trivia::TriviaEntry<<$grammar as $crate::engine::EngineGrammar>::Trivia>>,
            ) -> ::napi::Result<()> {
                let side = $crate::napi_engine::trivia_side_from_wire(&side)?;
                with_live_node(tree_id, index, |parsed, index| {
                    parsed.write_trivia_side(index, side, entries);
                    Ok(())
                })
            }

            /// Whether a write replaced a side of a node under the node at
            /// `index` of the live tree `treeId`, its own `inner` included, and
            /// its own leading and trailing too when `ownSides` is set. Refuses
            /// a tree that is not live and an index naming no node of it.
            #[::napi_derive::napi]
            pub fn edited_within(&self, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex, own_sides: bool) -> ::napi::Result<bool> {
                with_live_node(tree_id, index, |parsed, index| Ok(parsed.edited_within(index, own_sides)))
            }

            /// The siblings that hold sides beside the node at `index` of the
            /// live tree `treeId`, as JSON `{ previous, next }`: the `{ start,
            /// end }` span of each, taken at the outermost node spanning exactly
            /// the node's bytes, `null` when that node starts (ends) its parent.
            /// Refuses a tree that is not live and an index naming no node of it.
            #[::napi_derive::napi]
            pub fn siblings(&self, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<String> {
                with_live_node(tree_id, index, |parsed, index| {
                    ::serde_json::to_string(&parsed.siblings(index)).map_err(|e| ::napi::Error::from_reason(e.to_string()))
                })
            }

            /// Whether the node at `index` of the live tree `treeId` is empty:
            /// no child of it has width. Refuses a tree that is not live and an
            /// index naming no node of it.
            #[::napi_derive::napi]
            pub fn is_empty(&self, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<bool> {
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
            pub fn layout_baseline(&self, tree_id: $crate::types::TreeId, whole: Option<bool>) -> ::napi::Result<Vec<$crate::napi_engine::BaselineRun>> {
                with_live_node(tree_id, $crate::types::NodeIndex(0), |parsed, _| {
                    let runs = parsed.baseline_runs(whole.unwrap_or(false)).map_err(::napi::Error::from_reason)?;
                    Ok(runs.into_iter().map(|(run, written)| $crate::napi_engine::BaselineRun::new(run, written)).collect())
                })
            }

            /// How much of its layout the live tree `treeId` stores apart from
            /// its read-time options (`ParsedTree::stored_layout`): `{
            /// deviations, slots, separators }`. A diagnostic. Refuses a tree
            /// that is not live.
            #[::napi_derive::napi(ts_return_type = "{ deviations: number; slots: number; separators: number }")]
            pub fn stored_layout(&self, tree_id: $crate::types::TreeId) -> ::napi::Result<$crate::layout::StoredLayout> {
                with_live_node(tree_id, $crate::types::NodeIndex(0), |parsed, _| Ok(parsed.stored_layout()))
            }

            /// The work the live tree `treeId`'s layout reads have done so far
            /// (`ParsedTree::layout_work`): `{ regionNodes, siblingItems }`. A
            /// diagnostic. Refuses a tree that is not live.
            #[::napi_derive::napi(ts_return_type = "{ regionNodes: number; siblingItems: number }")]
            pub fn layout_work(&self, tree_id: $crate::types::TreeId) -> ::napi::Result<$crate::layout::LayoutWork> {
                with_live_node(tree_id, $crate::types::NodeIndex(0), |parsed, _| Ok(parsed.layout_work()))
            }

            /// One batch of a pre-order walk of the named descendants under
            /// the node `from` names (JSON, see `query::Address`), filtered to
            /// `kinds` when given and to the `where` plan (JSON, see
            /// `query::PlanSpec`) when given, resuming after the path `resume`
            /// an earlier batch returned, `depth` levels down (every level
            /// when absent). As JSON `{ stubs, resume }`. Refuses
            /// a tree that is not live and a plan whose pattern the native
            /// matcher cannot compile.
            #[::napi_derive::napi]
            pub fn descendants(
                &mut self,
                from: String,
                #[napi(ts_arg_type = "Array<import('../src/types.ts').TSKindId> | undefined | null")] kinds: Option<Vec<$crate::types::KindId>>,
                resume: Option<Vec<u32>>,
                limit: u32,
                plan: Option<String>,
                depth: Option<u32>,
            ) -> ::napi::Result<String> {
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
            pub fn line_starts_inside_tokens(&self, tree_id: $crate::types::TreeId, index: Option<$crate::types::NodeIndex>) -> ::napi::Result<Vec<u32>> {
                let index = index.map_or(0, $crate::types::NodeIndex::get);
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                    let node = $crate::engine::node_at_index(parsed.tree(), index)
                        .ok_or_else(|| ::napi::Error::from_reason(format!("index {index} names no node of tree {tree_id}")))?;
                    Ok($crate::engine::line_starts_inside_tokens(node, index, parsed.source()).into_iter().map(|at| at as u32).collect())
                })
            }

            /// Whether each node `addresses` names (a JSON array of
            /// `query::Address`, all in one tree) satisfies the `where` plan
            /// (JSON, see `query::PlanSpec`), in order. Refuses a tree that is
            /// not live, an address naming no node of it, and a plan whose
            /// pattern the native matcher cannot compile.
            #[::napi_derive::napi]
            pub fn plan_holds(&mut self, addresses: String, plan: String) -> ::napi::Result<Vec<bool>> {
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

            /// Render a typed transport object (napi-native, numeric `$type`).
            ///
            /// The options a render takes are the call's own over the layer
            /// of the tree `treeId` names (`ParsedTree::inferred`), over the
            /// engine's. `treeId` is the tree the node was read from; a built
            /// node belongs to no tree and renders by the engine's options.
            #[::napi_derive::napi(
                ts_args_type = "transport: object, treeId?: number | undefined | null, options?: object | undefined | null"
            )]
            pub fn render(
                &self,
                transport: $render_root,
                tree_id: Option<$crate::types::TreeId>,
                options: Option<$options>,
            ) -> ::napi::Result<String> {
                // No JavaScript runs while the table is borrowed, so the
                // borrow cannot be re-entered.
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let base = match tree_id.and_then(|id| trees.get(&id)) {
                        Some(tree) => tree.inferred().over(self.engine.options()),
                        None => self.engine.options().clone(),
                    };
                    let resolved = match options {
                        Some(opts) => opts.resolve(&base).map_err(::napi::Error::from_reason)?,
                        None => base,
                    };
                    let table = &resolved;
                    let ctx = $crate::prepare::RenderContext {
                        options: table,
                        sources: &*trees,
                        recording: None,
                    };
                    let (_, canonical) = $render_parts(transport, &ctx).map_err(|e| {
                        ::napi::Error::from_reason(format!("render_transport failed: {e}"))
                    })?;
                    Ok($crate::line_endings::spell(canonical, &table.newline))
                })
            }

            #[::napi_derive::napi(
                ts_args_type = "transport: object, path: string, treeId?: number | undefined | null, options?: object | undefined | null"
            )]
            pub fn render_to_file(
                &self,
                transport: $render_root,
                path: String,
                tree_id: Option<$crate::types::TreeId>,
                options: Option<$options>,
            ) -> ::napi::Result<()> {
                let rendered = self.render(transport, tree_id, options)?;
                ::std::fs::write(&path, rendered).map_err(|e| {
                    ::napi::Error::from_reason(format!("render_to_file failed for {path}: {e}"))
                })
            }

            /// Release the engine. It holds no state of its own past its
            /// options: the trees it parsed stay in the addon's table, since
            /// they belong to whoever still names them.
            #[::napi_derive::napi]
            pub fn dispose(&mut self) {}
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
            fn claim_tree_id(&mut self, env: &::napi::Env) -> ::napi::Result<$crate::types::TreeId> {
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
    };
}

/// Take a JavaScript number that is meant to be an index, or say why it is not.
///
/// Rust's `as` cast is saturating: `NaN as u64` is 0, and so is any negative.
/// Left to the cast, a nonsense handle would name tree 0 node 0 — the root —
/// and be answered as though it were a real request. Every rejection here is a
/// value that would otherwise have been silently rounded into a valid one.
pub fn checked_index(value: f64, label: &str) -> napi::Result<u64> {
    /// Above this a double no longer counts integers exactly, so a handle
    /// could not survive the trip through JavaScript intact.
    const MAX_EXACT: f64 = 9_007_199_254_740_991.0; // 2^53 - 1
    if !value.is_finite() {
        return Err(napi::Error::from_reason(format!(
            "{label} must be a finite number"
        )));
    }
    if value < 0.0 {
        return Err(napi::Error::from_reason(format!(
            "{label} must not be negative (got {value})"
        )));
    }
    if value.fract() != 0.0 {
        return Err(napi::Error::from_reason(format!(
            "{label} must be a whole number (got {value})"
        )));
    }
    if value > MAX_EXACT {
        return Err(napi::Error::from_reason(format!(
            "{label} {value} is beyond the exact-integer range"
        )));
    }
    Ok(value as u64)
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
    if levels.fract() != 0.0 || levels < 1.0 || levels > f64::from(u32::MAX) {
        return Err(napi::Error::from_reason(format!(
            "depth {levels} is not a whole number of levels (at least 1) or Infinity"
        )));
    }
    Ok(crate::read::Depth::Levels(std::num::NonZeroU32::new(levels as u32).expect("levels >= 1")))
}

/// A run of whitespace a side takes, with the line breaks, spaces and tabs
/// the tree's baseline writes there (`SittirEngine::layout_baseline`), each
/// absent where no baseline reaches the run.
#[napi_derive::napi(object)]
pub struct BaselineRun {
    pub start: u32,
    pub end: u32,
    pub index: u32,
    pub side: String,
    pub breaks: Option<u32>,
    pub spaces: Option<u32>,
    pub tabs: Option<u32>,
}

impl BaselineRun {
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

/// The refusal for an address into a tree this thread does not hold.
pub fn tree_not_live(tree_id: crate::types::TreeId) -> napi::Error {
    napi::Error::from_reason(format!(
        "tree {tree_id} is not live (never parsed on this thread, or already released)"
    ))
}
