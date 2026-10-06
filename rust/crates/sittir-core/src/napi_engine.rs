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
/// - `$options` — the grammar's `sittir_core::options::Options<Sites>` (`render::options::Options`), read through its address trie; the shape `EngineOptions.options` and `render`/`render_to_file` accept.
/// - `$render_parts` — `fn(&$render_root) -> Result<(Source, String), _>`.
/// - `$abi` — the render transport ABI version this crate was generated against.
/// - `$defaults` — `fn() -> ResolvedOptions`, the grammar's site table at its declared defaults.
/// - `$whitespace` — the grammar's [`WhitespaceTable`](crate::render::WhitespaceTable).
/// - `$whitespace_kinds` — every whitespace member of the grammar, the domain of `$whitespace`.
#[macro_export]
macro_rules! napi_engine {
    ($grammar:ty, $render_root:ty, $options:ty, $render_parts:path, $abi:expr, $defaults:path, $whitespace:path, $whitespace_kinds:path) => {
        #[::napi_derive::napi(object, object_to_js = false)]
        pub struct EngineOptions {
            pub format: Option<String>,
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
                ::std::collections::HashMap<u32, $crate::ParsedTree<$grammar>>,
            > = ::std::cell::RefCell::new(::std::collections::HashMap::new());
        }

        /// Drop one tree. Called from the boundary's `FinalizationRegistry`
        /// once JavaScript has collected the last object naming it.
        /// Unknown ids are not an error — a tree can only be dropped once,
        /// and the registry has no way to know whether it already was.
        #[::napi_derive::napi]
        pub fn dispose_tree(tree_id: f64) {
            // Checked for the same reason `read_untyped_node` checks its handle:
            // `as` saturates, so `NaN` and every negative arrive as 0 —
            // and 0 is the first tree, so an unchecked cast would let a
            // nonsense id drop a live tree. Invalid input is a no-op
            // rather than an error: this is called from a finalizer,
            // where nothing is positioned to handle a throw, and
            // disposing an id that names no tree is already a no-op.
            let Ok(tree_id) = $crate::napi_engine::checked_index(tree_id, "treeId") else {
                return;
            };
            let Ok(tree_id) = u32::try_from(tree_id) else {
                return;
            };
            LIVE_TREES.with(|trees| {
                trees.borrow_mut().remove(&tree_id);
            });
        }

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
            /// Newest parse by this engine, for `render` calls that do not
            /// name a tree.
            last_tree_id: Option<u32>,
        }

        #[::napi_derive::napi]
        impl SittirEngine {
            #[::napi_derive::napi(constructor)]
            pub fn new(options: Option<EngineOptions>) -> ::napi::Result<Self> {
                let (format_json, opts) = match options {
                    Some(opts) => (opts.format, opts.options),
                    None => (None, None),
                };
                let format = format_json
                    .map(|json| ::serde_json::from_str(&json))
                    .transpose()
                    .map_err(|e| {
                        ::napi::Error::from_reason(format!("parse engine format failed: {e}"))
                    })?;
                let table = match opts {
                    Some(opts) => {
                        opts.resolve(&$defaults()).map_err(::napi::Error::from_reason)?
                    }
                    None => $defaults(),
                };
                Ok(Self {
                    engine: $crate::engine::Engine::new(
                        <$grammar as ::std::default::Default>::default(),
                        format,
                        table,
                    )
                    .map_err(::napi::Error::from_reason)?,
                    last_tree_id: None,
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

            /// The line-break whitespace a read node owns as trivia: the node
            /// named by its `handle`, or by its tree's tag with its `span`
            /// (`[start, end]`) and stamped `kind` as a deep read leaves it.
            /// As JSON `{ leading, trailing, previous, next }`: `leading` and
            /// `trailing` are `{ kind, start }` runs in source order, each
            /// classified among the grammar's whitespace members whose text
            /// holds a line break; `previous` and `next` are the `{ start, end }`
            /// spans of the sibling owners before and after the outermost node
            /// spanning exactly the node's bytes, `null` when that node is its
            /// parent's first or last.
            #[::napi_derive::napi]
            pub fn line_gaps_of(
                &self,
                handle: f64,
                span: Option<Vec<f64>>,
                kind: Option<u32>,
            ) -> ::napi::Result<String> {
                let handle = $crate::napi_engine::checked_index(handle, "handle")?;
                let (tree_id, _) = $crate::engine::decode_handle(handle);
                let at = match (span.as_deref(), kind) {
                    (Some([start, end]), Some(kind)) => Some((
                        $crate::napi_engine::checked_index(*start, "span start")? as usize,
                        $crate::napi_engine::checked_index(*end, "span end")? as usize,
                        u16::try_from(kind).map_err(|_| ::napi::Error::from_reason(format!("kind {kind} is not a kind id")))?,
                    )),
                    (None, None) => None,
                    _ => {
                        return Err(::napi::Error::from_reason(
                            "a coordinate needs both a span of exactly two offsets, [start, end], and a kind",
                        ))
                    }
                };
                let allowed: Vec<u16> = $whitespace_kinds
                    .iter()
                    .copied()
                    .filter(|&kind| ($whitespace.text_of)(kind).contains('\n'))
                    .collect();
                let classify = |run: &str| $crate::classify::classify_whitespace(run, &allowed, &$whitespace);
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let parsed = trees.get(&tree_id).ok_or_else(|| {
                        ::napi::Error::from_reason(format!(
                            "handle {handle} names tree {tree_id}, which is not live \
                             (never parsed on this thread, or already released)"
                        ))
                    })?;
                    let gaps = match at {
                        Some((start, end, kind)) => parsed.line_gaps_at_span(handle, start, end, kind, &classify),
                        None => parsed.line_gaps_at(handle, &classify),
                    }
                    .map_err(::napi::Error::from_reason)?;
                    ::serde_json::to_string(&gaps).map_err(|e| ::napi::Error::from_reason(e.to_string()))
                })
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

            /// Parse `source` and read its root.
            ///
            /// `depth` is the number of levels the read expands (see
            /// [`depth_from_wire`]): absent is the lazy one-level read, `Infinity`
            /// expands the whole tree in one pass.
            ///
            /// The tree is retained under a fresh id so the handles this read
            /// hands out stay answerable; the id rides in those handles and is
            /// echoed as `treeId` for `disposeTree`.
            #[::napi_derive::napi]
            pub fn parse_and_read(
                &mut self,
                env: ::napi::Env,
                source: String,
                depth: Option<f64>,
            ) -> ::napi::Result<String> {
                let tree_id = self.claim_tree_id(&env)?;
                let depth = $crate::napi_engine::depth_from_wire(depth)?;
                let mut parsed = self
                    .engine
                    .parse(source, tree_id)
                    .map_err(::napi::Error::from_reason)?;
                let result = ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| {
                    parsed.read_root(depth)
                }));
                match result {
                    Ok(data) => {
                        let format = parsed.format().cloned();
                        let json = ::serde_json::to_string(&$crate::ParseResult {
                            untyped_node: &data,
                            format,
                            tree_id,
                            errors: parsed.error_regions(),
                        })
                        .map_err(|e| {
                            ::napi::Error::from_reason(format!("serialize ParseResult failed: {e}"))
                        })?;
                        LIVE_TREES.with(|trees| {
                            trees.borrow_mut().insert(tree_id, parsed);
                        });
                        self.last_tree_id = Some(tree_id);
                        Ok(json)
                    }
                    Err(payload) => Err(::napi::Error::from_reason($crate::panic_msg(
                        payload,
                        "parse_and_read panicked",
                    ))),
                }
            }

            /// Hydrate one child of the node named by `handle`.
            ///
            /// The handle names its own tree, so a handle from a tree that has
            /// been released — or one never minted on this thread — is refused rather
            /// than answered out of whichever tree happens to be present.
            /// `depth` counts the levels read, as for `parse_and_read`.
            #[::napi_derive::napi]
            pub fn read_untyped_node(
                &mut self,
                handle: f64,
                child_index: f64,
                depth: Option<f64>,
            ) -> ::napi::Result<String> {
                let handle = $crate::napi_engine::checked_index(handle, "handle")?;
                let child_index = $crate::napi_engine::checked_index(child_index, "childIndex")?;
                let (tree_id, _) = $crate::engine::decode_handle(handle);
                let child_index = u16::try_from(child_index).map_err(|_| {
                    ::napi::Error::from_reason(format!(
                        "childIndex {child_index} exceeds the per-node child limit"
                    ))
                })?;
                let depth = $crate::napi_engine::depth_from_wire(depth)?;
                LIVE_TREES.with(|trees| {
                    let mut trees = trees.borrow_mut();
                    let parsed = trees.get_mut(&tree_id).ok_or_else(|| {
                        ::napi::Error::from_reason(format!(
                            "handle {handle} names tree {tree_id}, which is not live \
                             (never parsed on this thread, or already released)"
                        ))
                    })?;
                    parsed
                        .read_at(handle, child_index, depth)
                        .map_err(::napi::Error::from_reason)
                })
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
                kinds: Option<Vec<u32>>,
                resume: Option<Vec<u32>>,
                limit: u32,
                plan: Option<String>,
                depth: Option<u32>,
            ) -> ::napi::Result<String> {
                let plan = plan.map(|json| $crate::napi_engine::compile_plan(&json)).transpose()?;
                let from = $crate::napi_engine::address_from_json(&from)?;
                let kinds = kinds
                    .unwrap_or_default()
                    .into_iter()
                    .map(|k| u16::try_from(k).map_err(|_| ::napi::Error::from_reason(format!("kind {k} is not a kind id"))))
                    .collect::<::napi::Result<Vec<u16>>>()?;
                let (tree_id, _) = $crate::engine::decode_handle(from.tree_handle());
                LIVE_TREES.with(|trees| {
                    let mut trees = trees.borrow_mut();
                    let parsed = trees.get_mut(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                    let batch = parsed
                        .descendants(from, &kinds, plan.as_ref(), resume.as_deref(), limit.max(1), depth)
                        .map_err(::napi::Error::from_reason)?;
                    ::serde_json::to_string(&batch).map_err(|e| ::napi::Error::from_reason(e.to_string()))
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

            /// Read the root of a live tree again, `depth` levels down, so a
            /// caller holding a shallow root can ask for a deeper one without
            /// re-parsing. Refuses a tree that is not live, as
            /// `read_untyped_node` does.
            #[::napi_derive::napi]
            pub fn read_root(&mut self, tree_id: f64, depth: Option<f64>) -> ::napi::Result<String> {
                let tree_id = $crate::napi_engine::checked_index(tree_id, "treeId")?;
                let tree_id = u32::try_from(tree_id).map_err(|_| {
                    ::napi::Error::from_reason(format!("treeId {tree_id} names no tree"))
                })?;
                let depth = $crate::napi_engine::depth_from_wire(depth)?;
                LIVE_TREES.with(|trees| {
                    let mut trees = trees.borrow_mut();
                    let parsed = trees.get_mut(&tree_id).ok_or_else(|| {
                        ::napi::Error::from_reason(format!(
                            "tree {tree_id} is not live (never parsed on this thread, or already released)"
                        ))
                    })?;
                    let data = ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| {
                        parsed.read_root(depth)
                    }))
                    .map_err(|payload| {
                        ::napi::Error::from_reason($crate::panic_msg(payload, "read_root panicked"))
                    })?;
                    ::serde_json::to_string(&data).map_err(|e| {
                        ::napi::Error::from_reason(format!("serialize root failed: {e}"))
                    })
                })
            }

            /// Render a typed transport object (napi-native, numeric `$type`).
            ///
            /// `treeId` names the parse whose detected format applies. It is
            /// optional because factory-built nodes belong to no tree.
            #[::napi_derive::napi(
                ts_args_type = "transport: object, treeId?: number | undefined | null, options?: object | undefined | null"
            )]
            pub fn render(
                &self,
                transport: $render_root,
                tree_id: Option<f64>,
                options: Option<$options>,
            ) -> ::napi::Result<String> {
                let resolved;
                let table = match options {
                    Some(opts) => {
                        resolved = opts.resolve(self.engine.options())
                            .map_err(::napi::Error::from_reason)?;
                        &resolved
                    }
                    None => self.engine.options(),
                };
                // No JavaScript runs while the table is borrowed, so the
                // borrow cannot be re-entered.
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let ctx = $crate::prepare::RenderContext {
                        options: table,
                        sources: &*trees,
                    };
                    let (source, canonical) = $render_parts(transport, &ctx).map_err(|e| {
                        ::napi::Error::from_reason(format!("render_transport failed: {e}"))
                    })?;
                    // A node knows which tree it came from, but the wrap layer
                    // does not thread that through yet, so an unnamed render still
                    // resolves against the newest parse — the pre-slab behaviour.
                    // Nodes rendered through an engine that has since parsed
                    // something else therefore still borrow the wrong format; that
                    // is a separate defect from tree identity and is fixed by
                    // passing `treeId` at every render call site.
                    let tree_format = tree_id
                        .map(|id| id as u32)
                        .or(self.last_tree_id)
                        .and_then(|id| trees.get(&id))
                        .and_then(|pt| pt.format());
                    Ok($crate::apply_render_format(
                        source,
                        canonical,
                        self.engine.engine_format(),
                        tree_format,
                    ))
                })
            }

            #[::napi_derive::napi(
                ts_args_type = "transport: object, path: string, treeId?: number | undefined | null, options?: object | undefined | null"
            )]
            pub fn render_to_file(
                &self,
                transport: $render_root,
                path: String,
                tree_id: Option<f64>,
                options: Option<$options>,
            ) -> ::napi::Result<()> {
                let rendered = self.render(transport, tree_id, options)?;
                ::std::fs::write(&path, rendered).map_err(|e| {
                    ::napi::Error::from_reason(format!("render_to_file failed for {path}: {e}"))
                })
            }

            /// Free this engine's own state. The trees it parsed stay in the
            /// addon's table: they belong to whoever still names them.
            #[::napi_derive::napi]
            pub fn dispose(&mut self) {
                self.last_tree_id = None;
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
            fn claim_tree_id(&mut self, env: &::napi::Env) -> ::napi::Result<u32> {
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

/// The refusal for an address into a tree this thread does not hold.
pub fn tree_not_live(tree_id: u32) -> napi::Error {
    napi::Error::from_reason(format!(
        "tree {tree_id} is not live (never parsed on this thread, or already released)"
    ))
}

/// Map the boundary's optional level count onto a [`ReadDepth`](crate::ReadDepth):
/// absent is one level, `Infinity` is the whole tree, and anything else must
/// be a whole number of levels, at least one.
pub fn depth_from_wire(depth: Option<f64>) -> napi::Result<crate::ReadDepth> {
    let Some(levels) = depth else {
        return Ok(crate::ReadDepth::SHALLOW);
    };
    if levels == f64::INFINITY {
        return Ok(crate::ReadDepth::Deep);
    }
    if levels.fract() != 0.0 || levels < 1.0 || levels > f64::from(u32::MAX) {
        return Err(napi::Error::from_reason(format!(
            "depth {levels} is not a whole number of levels (at least 1) or Infinity"
        )));
    }
    Ok(crate::ReadDepth::Levels(
        std::num::NonZeroU32::new(levels as u32).expect("levels >= 1"),
    ))
}
