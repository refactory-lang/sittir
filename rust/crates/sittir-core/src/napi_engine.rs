//! The napi engine every grammar crate exposes, defined once.
//!
//! [`napi_engine!`] emits the `SittirEngine` class (parse, read, render,
//! edits) and the addon's live-tree table behind it. A grammar crate supplies only
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
                let parsed = self.engine.parse(&source, claim).map_err(::napi::Error::from_reason)?;
                let json = ::serde_json::json!({
                    "treeId": tree_id,
                    "options": parsed.inferred_options(),
                    "errors": parsed.error_regions(),
                })
                .to_string();
                LIVE_TREES.with(|trees| trees.borrow_mut().insert(tree_id, parsed));
                Ok(json)
            }

            /// The node at `index` of tree `treeId` read into its native node,
            /// `depth` levels down (one when absent, `Infinity` for all); index 0
            /// is the root. An `ERROR` node reads as its text and coordinate.
            /// Refuses a tree that is not live, an index past its last node,
            /// and a node the model has no route for, naming the kind, the
            /// child and the index.
            #[::napi_derive::napi(ts_return_type = "object")]
            pub fn read(&self, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex, depth: Option<f64>) -> ::napi::Result<::napi::Either<$any, $crate::ErrorRead>> {
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

            /// The separator the list at `index` of the live tree `treeId`
            /// writes between its items, as a grammar id: the one its source
            /// spells where the slot stores one, else the one the read-time
            /// options render. Null for a node that is no list. Refuses as
            /// `triviaSide` does.
            #[::napi_derive::napi(ts_return_type = "import('../src/types.ts').TSKindId | null")]
            pub fn slot_separator(&self, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<Option<$crate::types::KindId>> {
                with_live_node(tree_id, index, |parsed, index| Ok(parsed.slot_separator(index)))
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
            /// node with its span (`$_layout.span`) from the native node that
            /// holds it and each placed extra with its text, the node itself
            /// measured from the byte `holderByte`, or from its own start when
            /// absent. Refuses as `read` does.
            #[::napi_derive::napi(ts_return_type = "object")]
            pub fn snapshot(&self, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex, holder_byte: Option<f64>) -> ::napi::Result<::napi::Either<$any, $crate::ErrorRead>> {
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
                &self,
                tree_id: $crate::types::TreeId,
                index: $crate::types::NodeIndex,
                side: String,
            ) -> ::napi::Result<Vec<$crate::trivia::TriviaEntry<<$grammar as $crate::engine::EngineGrammar>::Trivia>>> {
                let side = $crate::napi_engine::trivia_side_from_wire(&side)?;
                with_live_node(tree_id, index, |parsed, index| Ok(parsed.trivia_side(index, side)))
            }

            /// Replace `side` of the node at `index` of the live tree `treeId`
            /// with `entries`. A built record among them (`{ $type, $record }`)
            /// renders from the engine's built arena wherever the side renders.
            /// Refuses as `triviaSide` does.
            #[::napi_derive::napi(ts_args_type = "treeId: number, index: number, side: string, entries: object[]")]
            pub fn write_trivia_side(
                &self,
                tree_id: $crate::types::TreeId,
                index: $crate::types::NodeIndex,
                side: String,
                entries: Vec<$crate::trivia::TriviaEntry<<$grammar as $crate::engine::EngineGrammar>::Trivia>>,
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

            /// The text `span` covers in the source of the live tree `treeId`:
            /// one string of that span's characters, so the source itself
            /// never crosses. Refuses a tree that is not live and a span that
            /// is not one of its source's: past its end, reversed, or
            /// splitting a character.
            #[::napi_derive::napi(ts_args_type = "treeId: number, span: { start: number; end: number }")]
            pub fn text(&self, tree_id: $crate::types::TreeId, span: $crate::types::Span) -> ::napi::Result<String> {
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
            pub fn stored_layout(&self, tree_id: $crate::types::TreeId) -> ::napi::Result<$crate::layout::StoredLayout> {
                with_live_node(tree_id, $crate::types::NodeIndex::ROOT, |parsed, _| Ok(parsed.stored_layout()))
            }

            /// The work the live tree `treeId`'s layout reads have done so far
            /// (`ParsedTree::layout_work`): `{ regionNodes, siblingItems }`. A
            /// diagnostic. Refuses a tree that is not live.
            #[::napi_derive::napi(ts_return_type = "{ regionNodes: number; siblingItems: number }")]
            pub fn layout_work(&self, tree_id: $crate::types::TreeId) -> ::napi::Result<$crate::layout::LayoutWork> {
                with_live_node(tree_id, $crate::types::NodeIndex::ROOT, |parsed, _| Ok(parsed.layout_work()))
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
                &mut self,
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
            pub fn line_starts_inside_tokens(&self, tree_id: $crate::types::TreeId, index: Option<$crate::types::NodeIndex>) -> ::napi::Result<Vec<u32>> {
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

            /// Render a typed node object (napi-native, numeric `$type`).
            ///
            /// The options a render takes are the call's own over the layer
            /// of the tree `treeId` names (`ParsedTree::inferred`), over the
            /// engine's. `treeId` is the tree the node was read from; a built
            /// node belongs to no tree and renders by the engine's options.
            #[::napi_derive::napi(
                ts_args_type = "node: object, treeId?: number | undefined | null, options?: object | undefined | null"
            )]
            pub fn render(
                &self,
                env: ::napi::Env,
                node: $render_root,
                tree_id: Option<$crate::types::TreeId>,
                options: Option<$options>,
            ) -> ::napi::Result<String> {
                // No JavaScript runs while the table is borrowed, so the
                // borrow cannot be re-entered.
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let resolved = self.render_options(tree_id.and_then(|id| trees.get(&id)), options)?;
                    let table = &resolved;
                    let canonical = $crate::napi_engine::entry_sources(&env, self.engine.grammar(), &*trees, |sources| {
                        let ctx = $crate::prepare::RenderContext { options: table, sources };
                        $render_parts(node, &ctx, None).map(|(_, canonical)| canonical)
                    })
                    .map_err(|e| ::napi::Error::from_reason(format!("render_node failed: {e}")))?;
                    Ok($crate::line_endings::spell(canonical, &table.newline))
                })
            }

            #[::napi_derive::napi(
                ts_args_type = "node: object, path: string, treeId?: number | undefined | null, options?: object | undefined | null"
            )]
            pub fn render_to_file(
                &self,
                env: ::napi::Env,
                node: $render_root,
                path: String,
                tree_id: Option<$crate::types::TreeId>,
                options: Option<$options>,
            ) -> ::napi::Result<()> {
                let rendered = self.render(env, node, tree_id, options)?;
                ::std::fs::write(&path, rendered).map_err(|e| {
                    ::napi::Error::from_reason(format!("render_to_file failed for {path}: {e}"))
                })
            }

            /// Release the engine: it lets go of its built arena's chunks
            /// (`holdBuiltArena`), so a record they hold no longer renders as
            /// a trivia entry. The trees it parsed stay in the addon's table,
            /// since they belong to whoever still names them.
            #[::napi_derive::napi]
            pub fn dispose(&mut self, env: ::napi::Env) -> ::napi::Result<()> {
                $crate::napi_engine::release_built(&env, self.engine.written())
            }
        }

        impl SittirEngine {
            /// The options a render of a node of `tree` takes: `options` over
            /// the tree's layer (`ParsedTree::inferred`) over the engine's. A
            /// node of no tree takes `options` over the engine's.
            fn render_options(
                &self,
                tree: Option<&$crate::ParsedTree<$grammar>>,
                options: Option<$options>,
            ) -> ::napi::Result<$crate::options::ResolvedOptions> {
                let base = match tree {
                    Some(tree) => tree.inferred().over(self.engine.options()),
                    None => self.engine.options().clone(),
                };
                match options {
                    Some(opts) => opts.resolve(&base).map_err(::napi::Error::from_reason),
                    None => Ok(base),
                }
            }

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
            /// The tag word of an absent cell (`arena::cell::tag`).
            #[::napi_derive::napi]
            pub const CELL_TAG_ABSENT: u32 = $crate::arena::cell::tag::ABSENT;
            /// The tag word of a coordinate cell.
            #[::napi_derive::napi]
            pub const CELL_TAG_COORDINATE: u32 = $crate::arena::cell::tag::COORDINATE;
            /// The tag word of a parsed leaf's cell, and of a parsed captured string's.
            #[::napi_derive::napi]
            pub const CELL_TAG_PARSED_LEAF: u32 = $crate::arena::cell::tag::PARSED_LEAF;
            /// The tag word of a cell naming a child's record.
            #[::napi_derive::napi]
            pub const CELL_TAG_CHILD: u32 = $crate::arena::cell::tag::CHILD;
            /// The tag word of a unit's cell.
            #[::napi_derive::napi]
            pub const CELL_TAG_UNIT: u32 = $crate::arena::cell::tag::UNIT;
            /// The tag word of a built leaf's cell, and of a built captured string's.
            #[::napi_derive::napi]
            pub const CELL_TAG_BUILT_LEAF: u32 = $crate::arena::cell::tag::BUILT_LEAF;
            /// The tag word of an embedded bounded child's record.
            #[::napi_derive::napi]
            pub const CELL_TAG_INLINE: u32 = $crate::arena::cell::tag::INLINE;
            /// Words before an embedded child's own record header.
            #[::napi_derive::napi]
            pub const CELL_INLINE_HEADER_WORDS: u32 = $crate::arena::cell::INLINE_HEADER_WORDS;
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

            /// The record wire: a node's record named by its tree and its
            /// address together, so an address reads nothing once its tree is
            /// gone.
            #[::napi_derive::napi]
            impl SittirEngine {
                /// The address of the record of the node at `index` of the live
                /// tree `treeId`: the one a read wrote, else the one its read
                /// `depth` levels down (one when absent, `Infinity` for all)
                /// writes now. Null for a node with no record: a parsed leaf, or
                /// an `ERROR` node. Refuses as `read` does.
                #[::napi_derive::napi]
                pub fn read_record(&self, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex, depth: Option<f64>) -> ::napi::Result<Option<u32>> {
                    let depth = $crate::napi_engine::depth_from_wire(depth)?;
                    LIVE_TREES.with(|trees| {
                        let trees = trees.borrow();
                        let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                        record_of(parsed, index, depth, false)
                    })
                }

                /// Materializes the node at `index` in the live tree `treeId`
                /// to `depth` (one when absent, `Infinity` for all), including
                /// children of records already present. Returns only the root
                /// address, or null for a leaf or `ERROR`; record words remain
                /// native until a separate `chunk` call requests a copy.
                #[::napi_derive::napi]
                pub fn hydrate_record(&self, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex, depth: Option<f64>) -> ::napi::Result<Option<u32>> {
                    let depth = $crate::napi_engine::depth_from_wire(depth)?;
                    LIVE_TREES.with(|trees| {
                        let trees = trees.borrow();
                        let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                        record_of(parsed, index, depth, true)
                    })
                }

                /// The hydrated typed nodes below `index` in stored field
                /// order, as JSON pairs `[coordinate, address | null]`. Nested
                /// content sharing a row is included; units and captured
                /// strings are omitted. Exports no node fields or words.
                #[::napi_derive::napi]
                pub fn record_candidates(&self, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<String> {
                    LIVE_TREES.with(|trees| {
                        let trees = trees.borrow();
                        let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                        $crate::napi_engine::check_node(parsed, index)?;
                        let candidates = ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| parsed.record_candidates::<$any>(index)))
                            .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(&*payload, "record_candidates panicked")))?
                            .map_err(|e| ::napi::Error::from_reason(format!("record_candidates failed: {e}")))?;
                        let wire = candidates.into_iter().map(|(coordinate, at)| ($crate::query::QueryCoordinate::from(coordinate), at.map(|at| at.0))).collect::<Vec<_>>();
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
                    &self,
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
                #[::napi_derive::napi(ts_args_type = "treeId: number, address: number, leading: boolean, trailing: boolean, options?: object | undefined | null")]
                pub fn render_record(&self, env: ::napi::Env, tree_id: $crate::types::TreeId, address: f64, leading: bool, trailing: bool, options: Option<$options>) -> ::napi::Result<String> {
                    let address = $crate::arena::Address($crate::napi_engine::checked_whole(address, "address")?);
                    LIVE_TREES.with(|trees| {
                        let trees = trees.borrow();
                        let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                        let table = self.render_options(Some(parsed), options)?;
                        let records = $crate::napi_engine::ArenaEntries { env: &env, grammar: self.engine.grammar(), trees: &*trees };
                        let canonical = ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| parsed.render_record(address, $crate::slot::ChangedEdges { leading, trailing }, &table, &records)))
                            .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(&*payload, "render_record panicked")))?
                            .map_err(|e| ::napi::Error::from_reason(format!("render_record failed: {e}")))?;
                        Ok($crate::line_endings::spell(canonical, &table.newline))
                    })
                }

                /// The built node at `address` of the built arena `owner`
                /// holds (`holdBuiltArena`) rendered as a render root whose
                /// `leading` and `trailing` edges have no neighbour, under
                /// `options` over this engine's, with the sides `owner` holds:
                /// the engine that built the arena, which its records' side
                /// writes went to. A leaf passes the `text` its cells hold; a
                /// compound record passes none. The arena's chunks are
                /// borrowed for this call; the records the root reaches are
                /// admitted, and the parsed trees they link held for the
                /// render (`Engine::render_built`). Refuses an arena `owner`
                /// no longer holds, an address naming no record its words
                /// admit, a linked tree that is not live, and a record whose
                /// render refuses.
                #[allow(clippy::too_many_arguments, reason = "each parameter is one of the JavaScript call's arguments")]
                #[::napi_derive::napi(ts_args_type = "owner: SittirEngine, address: number, text: BuiltText | undefined | null, leading: boolean, trailing: boolean, options?: object | undefined | null")]
                pub fn render_built(&self, env: ::napi::Env, owner: &SittirEngine, address: f64, text: Option<$crate::napi_engine::BuiltText>, leading: bool, trailing: bool, options: Option<$options>) -> ::napi::Result<String> {
                    let record = $crate::arena::Address($crate::napi_engine::checked_whole(address, "address")?);
                    let root = match text {
                        Some(text) => $crate::arena::BuiltRoot::Leaf { record, text: $crate::arena::StringRef::from_offset(text.at, text.len) },
                        None => $crate::arena::BuiltRoot::Record(record),
                    };
                    let chunks = owner.engine.written().built();
                    let (words, bytes) = chunks.borrow(&env).map_err(|e| ::napi::Error::from_reason(e.to_string()))?;
                    let arena = $crate::arena::BorrowedArena::new(&words, &bytes).map_err(|e| ::napi::Error::from_reason(e.to_string()))?;
                    let table = self.render_options(None, options)?;
                    LIVE_TREES.with(|trees| {
                        let trees = trees.borrow();
                        let changed = $crate::slot::ChangedEdges { leading, trailing };
                        let records = $crate::napi_engine::ArenaEntries { env: &env, grammar: self.engine.grammar(), trees: &*trees };
                        let sources = $crate::render::WithRecords { sources: &*trees, records: &records };
                        let ctx = $crate::prepare::RenderContext { options: &table, sources: &sources };
                        let canonical = ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| owner.engine.render_built(&arena, root, changed, &*trees, &ctx)))
                            .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(&*payload, "render_built panicked")))?
                            .map_err(|e| ::napi::Error::from_reason(format!("render_built failed: {e}")))?;
                        Ok($crate::line_endings::spell(canonical, &table.newline))
                    })
                }

                /// Holds the chunks of the built arena whose records this
                /// engine's builders write, in place of the ones it held:
                /// `words` and `bytes`, and `written`, the words written of
                /// each words chunk and the bytes of each bytes chunk, which
                /// the arena keeps current. Each is held weakly; the arena
                /// owns them. A trivia entry this engine's store answers
                /// renders from them.
                #[::napi_derive::napi(ts_args_type = "words: Uint32Array[], bytes: Uint8Array[], writtenWords: Uint32Array, writtenBytes: Uint32Array")]
                pub fn hold_built_arena(&self, env: ::napi::Env, words: Vec<::napi::Unknown<'_>>, bytes: Vec<::napi::Unknown<'_>>, written_words: ::napi::Unknown<'_>, written_bytes: ::napi::Unknown<'_>) -> ::napi::Result<()> {
                    self.engine.written().built_mut().hold(&env, &words, &bytes, [written_words, written_bytes])
                }

                /// The entries a write gave `side` (`leading`, `trailing` or
                /// `inner`) of the built record at `address`, or `null` when
                /// no write did. Refuses address 0 and any other side.
                #[::napi_derive::napi(ts_return_type = "object[] | null")]
                pub fn built_trivia_side(&self, address: f64, side: String) -> ::napi::Result<Option<Vec<$crate::trivia::TriviaEntry<<$grammar as $crate::engine::EngineGrammar>::Trivia>>>> {
                    let address = $crate::arena::Address($crate::napi_engine::checked_whole(address, "address")?);
                    let side = $crate::napi_engine::trivia_side_from_wire(&side)?;
                    self.engine.built_trivia_side(address, side).map_err(|e| ::napi::Error::from_reason(e.to_string()))
                }

                /// Replace `side` of the built record at `address` with
                /// `entries`, which `renderBuilt` then writes; a built record
                /// among them renders as `writeTriviaSide` says. Refuses as
                /// `builtTriviaSide` does.
                #[::napi_derive::napi(ts_args_type = "address: number, side: string, entries: object[]")]
                pub fn write_built_trivia_side(
                    &self,
                    address: f64,
                    side: String,
                    entries: Vec<$crate::trivia::TriviaEntry<<$grammar as $crate::engine::EngineGrammar>::Trivia>>,
                ) -> ::napi::Result<()> {
                    let address = $crate::arena::Address($crate::napi_engine::checked_whole(address, "address")?);
                    let side = $crate::napi_engine::trivia_side_from_wire(&side)?;
                    self.engine.write_built_trivia_side(address, side, entries).map_err(|e| ::napi::Error::from_reason(e.to_string()))
                }

                /// Renders a parsed candidate without exporting its data or its
                /// outer trivia. A record address must belong to its row; a
                /// recordless node renders through its native coordinate.
                #[::napi_derive::napi(ts_args_type = "treeId: number, index: number, address?: number | undefined | null, options?: object | undefined | null")]
                pub fn render_candidate(&self, env: ::napi::Env, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex, address: Option<f64>, options: Option<$options>) -> ::napi::Result<String> {
                    let address = address.map(|at| $crate::napi_engine::checked_whole(at, "address").map($crate::arena::Address)).transpose()?;
                    LIVE_TREES.with(|trees| {
                        let trees = trees.borrow();
                        let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                        let table = self.render_options(Some(parsed), options)?;
                        let records = $crate::napi_engine::ArenaEntries { env: &env, grammar: self.engine.grammar(), trees: &*trees };
                        let canonical = ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| parsed.render_candidate(index, address, &table, &records)))
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
                pub fn coordinate(&self, tree_id: $crate::types::TreeId, index: $crate::types::NodeIndex) -> ::napi::Result<Vec<u32>> {
                    LIVE_TREES.with(|trees| {
                        let trees = trees.borrow();
                        let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                        $crate::napi_engine::check_node(parsed, index)?;
                        let at = parsed.row_coordinate(index).ok_or_else(|| ::napi::Error::from_reason(format!("tree {tree_id} has no node {}", index.0)))?;
                        let kind = at.kind.ok_or_else(|| ::napi::Error::from_reason(format!("tree {tree_id}'s node {} has no stamped kind", index.0)))?;
                        Ok(vec![u32::from(kind.0), at.end.0])
                    })
                }

                /// The words records fill in chunk `n` of the live tree
                /// `treeId`'s arena, copied into a buffer JavaScript owns: a
                /// later read that appends to the chunk leaves the copy as it
                /// was. Refuses a tree that is not live and a chunk its arena
                /// does not hold.
                #[::napi_derive::napi]
                pub fn chunk(&self, tree_id: $crate::types::TreeId, n: f64) -> ::napi::Result<::napi::bindgen_prelude::Uint32Array> {
                    let n: u32 = $crate::napi_engine::checked_whole(n, "chunk")?;
                    LIVE_TREES.with(|trees| {
                        let trees = trees.borrow();
                        let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                        let words = parsed.record_chunk(n).ok_or_else(|| ::napi::Error::from_reason(format!("tree {tree_id}'s arena holds no chunk {n}")))?;
                        Ok(::napi::bindgen_prelude::Uint32Array::new(words))
                    })
                }
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

/// The text a built leaf's cells hold, as its builder interned it: the
/// chunk and byte packed as a cell stores them (`StringRef::offset`), and
/// its length in bytes.
#[cfg(feature = "arena")]
#[napi_derive::napi(object)]
pub struct BuiltText {
    pub at: u32,
    pub len: u32,
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

/// An element of a built arena's chunks: its Rust type, paired with the
/// typed array that holds it.
pub trait ChunkElement: Copy {
    const TYPE: napi::sys::napi_typedarray_type;
    const NAME: &'static str;
    /// The refusal of a chunk that is no typed array of this element over an
    /// ordinary `ArrayBuffer`.
    const REFUSED: &'static str;
}

impl ChunkElement for u32 {
    const TYPE: napi::sys::napi_typedarray_type = napi::sys::TypedarrayType::uint32_array;
    const NAME: &'static str = "Uint32Array";
    const REFUSED: &'static str = "a built arena chunk must be a Uint32Array over an ordinary ArrayBuffer";
}

impl ChunkElement for u8 {
    const TYPE: napi::sys::napi_typedarray_type = napi::sys::TypedarrayType::uint8_array;
    const NAME: &'static str = "Uint8Array";
    const REFUSED: &'static str = "a built arena chunk must be a Uint8Array over an ordinary ArrayBuffer";
}

/// A weak reference to a JavaScript typed array: it does not keep the
/// array alive, and reads as nothing once the array is collected.
#[cfg(feature = "arena")]
struct WeakArray(napi::sys::napi_ref);

// SAFETY: as `napi::Ref` is: a reference is made, read and deleted only on
// the JavaScript thread, each inside a call that hands over its `env`.
#[cfg(feature = "arena")]
unsafe impl Send for WeakArray {}
// SAFETY: as above; a shared reference reads nothing outside such a call.
#[cfg(feature = "arena")]
unsafe impl Sync for WeakArray {}

#[cfg(feature = "arena")]
impl WeakArray {
    fn new(env: &napi::Env, value: napi::Unknown<'_>) -> napi::Result<Self> {
        use napi::JsValue;
        let mut raw = std::ptr::null_mut();
        // SAFETY: `value` is live in `env`; a reference of count 0 is weak.
        napi::check_status!(unsafe { napi::sys::napi_create_reference(env.raw(), value.raw(), 0, &raw mut raw) })?;
        Ok(Self(raw))
    }

    fn get<'e>(&self, env: &'e napi::Env) -> napi::Result<Option<napi::Unknown<'e>>> {
        let mut value = std::ptr::null_mut();
        // SAFETY: the reference was made in this addon's env and is not deleted.
        napi::check_status!(unsafe { napi::sys::napi_get_reference_value(env.raw(), self.0, &raw mut value) })?;
        // SAFETY: a non-null value the reference answers is live in `env` for the call.
        Ok((!value.is_null()).then(|| unsafe { napi::Unknown::from_raw_unchecked(env.raw(), value) }))
    }

    fn delete(self, env: &napi::Env) -> napi::Result<()> {
        // SAFETY: the reference was made in this addon's env, and `self` is its only owner.
        napi::check_status!(unsafe { napi::sys::napi_delete_reference(env.raw(), self.0) })
    }
}

/// The chunks of an engine's built arena, as its store holds them for the
/// trivia entries it answers: each words and bytes chunk, and the two tables
/// of how much of each chunk is written, all held weakly. JavaScript owns
/// them and keeps them while anything can render one of their records.
#[cfg(feature = "arena")]
#[derive(Default)]
pub struct BuiltChunks {
    words: Vec<WeakArray>,
    bytes: Vec<WeakArray>,
    written: Option<[WeakArray; 2]>,
}

#[cfg(feature = "arena")]
impl std::fmt::Debug for BuiltChunks {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("BuiltChunks").field("words", &self.words.len()).field("bytes", &self.bytes.len()).field("held", &self.written.is_some()).finish()
    }
}

#[cfg(feature = "arena")]
impl BuiltChunks {
    /// Holds `words` and `bytes`, the arena's chunks, and `written`, the
    /// words written of each words chunk and the bytes of each bytes chunk,
    /// in place of what was held.
    ///
    /// # Errors
    ///
    /// A reference napi refuses to make or delete.
    pub fn hold(&mut self, env: &napi::Env, words: &[napi::Unknown<'_>], bytes: &[napi::Unknown<'_>], written: [napi::Unknown<'_>; 2]) -> napi::Result<()> {
        self.release(env)?;
        self.words = words.iter().map(|chunk| WeakArray::new(env, *chunk)).collect::<napi::Result<_>>()?;
        self.bytes = bytes.iter().map(|chunk| WeakArray::new(env, *chunk)).collect::<napi::Result<_>>()?;
        let [words, bytes] = written;
        self.written = Some([WeakArray::new(env, words)?, WeakArray::new(env, bytes)?]);
        Ok(())
    }

    /// Lets go of every chunk: an entry of the arena then renders no more.
    ///
    /// # Errors
    ///
    /// A reference napi refuses to delete.
    pub fn release(&mut self, env: &napi::Env) -> napi::Result<()> {
        let held = self.words.drain(..).chain(self.bytes.drain(..)).chain(self.written.take().into_iter().flatten());
        held.into_iter().try_for_each(|reference| reference.delete(env))
    }

    /// The chunks, each cut to what is written, borrowed for the call.
    ///
    /// # Errors
    ///
    /// `ArenaError::Unwritable` once a chunk is released, or for a chunk
    /// that is no typed array of its kind or is shorter than its written
    /// length.
    pub fn borrow<'e>(&self, env: &'e napi::Env) -> Result<BorrowedChunks<'e>, crate::arena::ArenaError> {
        use crate::arena::ArenaError;
        let released = ArenaError::Unwritable("the arena that built a side's record was released");
        let array = |weak: &WeakArray| weak.get(env).ok().flatten().ok_or(released.clone());
        let [words_written, bytes_written] = self.written.as_ref().ok_or(released.clone())?;
        let table = |weak| borrowed_chunk::<u32>(env, array(weak)?).map_err(|_| ArenaError::Unwritable("a built arena's written table is no Uint32Array"));
        let (words_written, bytes_written) = (table(words_written)?, table(bytes_written)?);
        let words = self.words.iter().zip(0..).map(|(weak, n)| written_chunk::<u32>(env, array(weak)?, words_written.get(n))).collect::<Result<_, _>>()?;
        let bytes = self.bytes.iter().zip(0..).map(|(weak, n)| written_chunk::<u8>(env, array(weak)?, bytes_written.get(n))).collect::<Result<_, _>>()?;
        Ok((words, bytes))
    }
}

/// A built arena's words and bytes chunks, borrowed for a call.
#[cfg(feature = "arena")]
pub type BorrowedChunks<'e> = (Vec<&'e [u32]>, Vec<&'e [u8]>);

/// `chunk` borrowed and cut to its `written` length.
#[cfg(feature = "arena")]
fn written_chunk<'e, T: ChunkElement>(env: &'e napi::Env, chunk: napi::Unknown<'e>, written: Option<&u32>) -> Result<&'e [T], crate::arena::ArenaError> {
    use crate::arena::ArenaError;
    let chunk = borrowed_chunk::<T>(env, chunk).map_err(|_| ArenaError::Unwritable(T::REFUSED))?;
    chunk.get(..written.map_or(0, |&n| n as usize)).ok_or(ArenaError::Unwritable("a built arena chunk is shorter than its written length"))
}

/// One call's `EntryRecords`: a record entry renders from the arena its
/// store holds (`BuiltChunks`), borrowed through `env`, the parsed trees it
/// links held from `trees`.
#[cfg(feature = "arena")]
pub struct ArenaEntries<'a, G: crate::engine::EngineGrammar, H> {
    pub env: &'a napi::Env,
    pub grammar: G,
    pub trees: &'a std::collections::HashMap<crate::types::TreeId, crate::engine::ParsedTree<G>, H>,
}

#[cfg(feature = "arena")]
impl<G: crate::arena::RecordGrammar, H: std::hash::BuildHasher> crate::render::EntryRecords for ArenaEntries<'_, G, H>
where
    G::Trivia: crate::boundary::DecodesKind,
{
    fn render_record_entry(&self, record: crate::trivia::BuiltEntry, held: &dyn std::any::Any, ctx: &crate::prepare::RenderContext<'_>, w: &mut dyn crate::render::RenderSink) -> crate::render::RenderResult {
        use crate::boundary::DecodesKind;
        use crate::render::RenderError;
        if !G::Trivia::decodes(record.kind) {
            return Err(RenderError::Record(crate::arena::ArenaError::UnknownKind { kind: record.kind, owner: G::Trivia::OWNER }));
        }
        let store = held
            .downcast_ref::<crate::trivia_store::TriviaStore<G::Trivia>>()
            .ok_or(RenderError::Record(crate::arena::ArenaError::Unwritable("a trivia entry's store is another grammar's")))?;
        let (words, bytes) = store.built().borrow(self.env).map_err(RenderError::Record)?;
        let arena = crate::arena::BorrowedArena::new(&words, &bytes).map_err(RenderError::Record)?;
        crate::arena::render_record_entry(self.grammar, &arena, record, store, self.trees, ctx, w)
    }
}

/// `f` over the table a call renders through: the live `trees`, which also
/// render each trivia entry's built record from its store's arena
/// (`ArenaEntries`), borrowed through `env`.
#[cfg(feature = "arena")]
pub fn entry_sources<G: crate::arena::RecordGrammar, H: std::hash::BuildHasher, R>(
    env: &napi::Env,
    grammar: G,
    trees: &std::collections::HashMap<crate::types::TreeId, crate::engine::ParsedTree<G>, H>,
    f: impl FnOnce(&dyn crate::render::SourceTable) -> R,
) -> R
where
    G::Trivia: crate::boundary::DecodesKind,
{
    f(&crate::render::WithRecords { sources: trees, records: &ArenaEntries { env, grammar, trees } })
}

/// Lets go of the built arena chunks `store` holds (`BuiltChunks::release`).
///
/// # Errors
///
/// A reference napi refuses to delete.
#[cfg(feature = "arena")]
pub fn release_built<T>(env: &napi::Env, store: &crate::trivia_store::TriviaStore<T>) -> napi::Result<()> {
    store.built_mut().release(env)
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

/// `f` over the table a call renders through: the live `trees`; without the
/// arena no trivia entry names a built record.
#[cfg(not(feature = "arena"))]
pub fn entry_sources<G: crate::engine::EngineGrammar, H: std::hash::BuildHasher, R>(
    _env: &napi::Env,
    _grammar: G,
    trees: &std::collections::HashMap<crate::types::TreeId, crate::engine::ParsedTree<G>, H>,
    f: impl FnOnce(&dyn crate::render::SourceTable) -> R,
) -> R {
    f(trees)
}

/// Each of `values` borrowed as the slice of `T` it holds, for the rest of
/// the call, without copying. Each must be a typed array of `T` over an
/// ordinary `ArrayBuffer`: a `SharedArrayBuffer` could be written by another
/// thread while the slice is read.
pub fn borrowed_chunks<'a, T: ChunkElement>(env: &'a napi::Env, values: &[napi::Unknown<'a>]) -> napi::Result<Vec<&'a [T]>> {
    values.iter().map(|value| borrowed_chunk(env, *value)).collect()
}

fn borrowed_chunk<'a, T: ChunkElement>(env: &'a napi::Env, value: napi::Unknown<'a>) -> napi::Result<&'a [T]> {
    use napi::JsValue;
    let refused = || napi::Error::new(napi::Status::InvalidArg, T::REFUSED);
    if !value.is_typedarray()? {
        return Err(refused());
    }
    let (mut kind, mut len, mut data, mut buffer, mut offset) = (0, 0, std::ptr::null_mut(), std::ptr::null_mut(), 0);
    // SAFETY: inspecting a live typed array runs no JavaScript.
    napi::check_status!(unsafe { napi::sys::napi_get_typedarray_info(env.raw(), value.raw(), &raw mut kind, &raw mut len, &raw mut data, &raw mut buffer, &raw mut offset) })?;
    let mut ordinary = false;
    // SAFETY: `buffer` is the live backing store `napi_get_typedarray_info` just answered.
    napi::check_status!(unsafe { napi::sys::napi_is_arraybuffer(env.raw(), buffer, &raw mut ordinary) })?;
    if kind != T::TYPE || !ordinary {
        return Err(refused());
    }
    if len == 0 {
        return Ok(&[]);
    }
    if data.is_null() || !data.cast::<T>().cast_const().is_aligned() {
        return Err(napi::Error::from_reason(format!("a built arena {} is not aligned to its element", T::NAME)));
    }
    // SAFETY: the kind check pairs `T` with the array's element type, and
    // `len` counts its elements. The array is a handle live for the call,
    // its buffer is no other thread's, and no JavaScript runs while the
    // slice is borrowed, so nothing resizes, detaches or writes it.
    Ok(unsafe { std::slice::from_raw_parts(data.cast::<T>().cast_const(), len) })
}
