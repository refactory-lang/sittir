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
/// - `$whitespace` — the grammar's [`WhitespaceTable`](crate::render::WhitespaceTable).
/// - `$layout_kinds` — every layout kind of the grammar (each `_layout` member, the depth movers among them where the grammar has them), the domain of `$whitespace`.
#[macro_export]
macro_rules! napi_engine {
    ($grammar:ty, $render_root:ty, $any:ty, $options:ty, $render_parts:path, $abi:expr, $defaults:path, $whitespace:path, $layout_kinds:path) => {
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
                let allowed: Vec<u16> = $layout_kinds
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
                let parsed = self
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

            /// Parse `source` and keep its tree. As JSON `{ treeId, format,
            /// errors }`: the id `read` and `disposeTree` take, the format the
            /// parse detected, and its error regions.
            #[::napi_derive::napi]
            pub fn parse(&mut self, env: ::napi::Env, source: String) -> ::napi::Result<String> {
                let tree_id = self.claim_tree_id(&env)?;
                let parsed = self.engine.parse(source, tree_id).map_err(::napi::Error::from_reason)?;
                let json = ::serde_json::json!({
                    "treeId": tree_id,
                    "format": parsed.format(),
                    "errors": parsed.error_regions(),
                })
                .to_string();
                LIVE_TREES.with(|trees| trees.borrow_mut().insert(tree_id, parsed));
                self.last_tree_id = Some(tree_id);
                Ok(json)
            }

            /// The node at `index` of tree `treeId` read into its transport,
            /// `depth` levels down (one when absent, `Infinity` for all); index 0
            /// is the root. Refuses a tree that is not live, an index past its
            /// last node, and a node the model has no route for, naming the
            /// kind, the child and the index.
            #[::napi_derive::napi(ts_return_type = "object")]
            pub fn read(&self, tree_id: f64, index: f64, depth: Option<f64>) -> ::napi::Result<$any> {
                let tree_id = u32::try_from($crate::napi_engine::checked_index(tree_id, "treeId")?)
                    .map_err(|_| ::napi::Error::from_reason(format!("treeId {tree_id} names no tree")))?;
                let index = u32::try_from($crate::napi_engine::checked_index(index, "index")?)
                    .map_err(|_| ::napi::Error::from_reason(format!("index {index} names no node")))?;
                let depth = $crate::napi_engine::typed_depth_from_wire(depth)?;
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                    if $crate::engine::node_at_index(parsed.tree(), index).is_none() {
                        return Err(::napi::Error::from_reason(format!("index {index} names no node of tree {tree_id}")));
                    }
                    let grammar = <$grammar as ::std::default::Default>::default();
                    ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| parsed.read::<$any>(index, depth)))
                        .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(payload, "read panicked")))?
                        .map_err(|refusal| ::napi::Error::from_reason(refusal.describe(&|kind| $crate::engine::EngineGrammar::kind_name(grammar, kind))))
                })
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
                    let trees = trees.borrow();
                    let parsed = trees.get(&tree_id).ok_or_else(|| {
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
                    let trees = trees.borrow();
                    let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
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
                    let trees = trees.borrow();
                    let parsed = trees.get(&tree_id).ok_or_else(|| {
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

            /// Transitional, while today's read and the typed read both exist:
            /// the refusal the typed reader meets reading tree `treeId` whole,
            /// or `null` when it reads it.
            #[::napi_derive::napi]
            pub fn typed_read_refusal(&self, tree_id: f64) -> ::napi::Result<Option<String>> {
                self.with_typed_read(tree_id, $crate::read::Depth::All, false, |typed: ::std::result::Result<$render_root, $crate::read::ReadError>, name| {
                    Ok(typed.err().map(|refusal| refusal.describe(name)))
                })
            }

            /// Transitional, while today's read and the typed read both exist:
            /// compare the typed read of tree `treeId` with `today`, the detached
            /// root today's read and wrap give it. `null` when they agree;
            /// otherwise the refusal, a `normalized: <Kind>.<slot>` line for
            /// each slot the typed read fills with its empty value where today's
            /// read leaves it absent, and the first
            /// other place the two differ.
            #[::napi_derive::napi(ts_args_type = "treeId: number, today: object")]
            pub fn typed_read_parity(&self, tree_id: f64, today: $render_root) -> ::napi::Result<Option<String>> {
                self.with_typed_read(tree_id, $crate::read::Depth::All, false, |typed: ::std::result::Result<$render_root, $crate::read::ReadError>, name| {
                    Ok(match typed {
                        Err(refusal) => Some(format!("refused: {}", refusal.describe(name))),
                        Ok(typed) if typed == today => None,
                        Ok(typed) => $crate::napi_engine::parity_report(&format!("{typed:#?}"), &format!("{today:#?}"))
                            .or_else(|| Some("the reads differ where their debug text does not".to_owned())),
                    })
                })
            }

            /// Transitional, while today's read and the typed read both exist:
            /// encode the typed read of tree `treeId` to JavaScript and decode it
            /// back, read one level deep and then whole. `null` when both come
            /// back unchanged; otherwise the depth, and the refusal, the encoder's
            /// or decoder's error, or the first place the decoded read differs.
            #[::napi_derive::napi]
            pub fn typed_read_round_trip(&self, env: ::napi::Env, tree_id: f64) -> ::napi::Result<Option<String>> {
                for (depth, label) in [($crate::read::Depth::ONE, "one level"), ($crate::read::Depth::All, "whole")] {
                    let typed = self.with_typed_read(tree_id, depth, true, |typed: ::std::result::Result<$render_root, $crate::read::ReadError>, name| {
                        Ok(typed.map_err(|refusal| refusal.describe(name)))
                    })?;
                    let typed = match typed {
                        Ok(typed) => typed,
                        Err(refusal) => return Ok(Some(format!("read {label}: refused: {refusal}"))),
                    };
                    let encoded = format!("{typed:#?}");
                    let value = match unsafe { <$render_root as ::napi::bindgen_prelude::ToNapiValue>::to_napi_value(env.raw(), typed) } {
                        Ok(value) => value,
                        Err(error) => return Ok(Some(format!("read {label}: encoding failed: {error}"))),
                    };
                    let decoded = match unsafe { <$render_root as ::napi::bindgen_prelude::FromNapiValue>::from_napi_value(env.raw(), value) } {
                        Ok(decoded) => decoded,
                        Err(error) => return Ok(Some(format!("read {label}: decoding failed: {error}"))),
                    };
                    if let Some(report) = $crate::napi_engine::round_trip_report(&encoded, &format!("{decoded:#?}")) {
                        return Ok(Some(format!("read {label}: {report}")));
                    }
                }
                Ok(None)
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
            fn with_typed_read<T>(
                &self,
                tree_id: f64,
                depth: $crate::read::Depth,
                at: bool,
                then: impl FnOnce(
                    ::std::result::Result<$render_root, $crate::read::ReadError>,
                    &dyn Fn($crate::types::KindId) -> &'static str,
                ) -> ::napi::Result<T>,
            ) -> ::napi::Result<T> {
                let tree_id = $crate::napi_engine::checked_index(tree_id, "treeId")?;
                let tree_id = u32::try_from(tree_id)
                    .map_err(|_| ::napi::Error::from_reason(format!("treeId {tree_id} names no tree")))?;
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                    let typed = ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| {
                        parsed.typed_read::<$render_root>(depth, at)
                    }))
                    .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(payload, "typed_read panicked")))?;
                    let grammar = <$grammar as ::std::default::Default>::default();
                    then(typed, &|kind| $crate::engine::EngineGrammar::kind_name(grammar, kind))
                })
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

/// The prefix of a report line naming a slot the typed read fills with its
/// empty value (an empty list, or the blank arm) where today's read leaves it
/// absent.
pub const NORMALIZED_PREFIX: &str = "normalized: ";

/// How the typed read differs from today's, from their debug text.
///
/// Today's read gives a node with no named children its text and no slot
/// keys, so a slot that holds nothing is absent there and holds its empty
/// value in the typed read: `Some([])` for a list, `Some(Transport(Blank))`
/// for an optional slot with a blank arm. Each such slot is reported as a
/// `normalized: <Kind>.<slot>` line and does not count as a difference. Any other difference is reported as twelve
/// lines of each read around the first one. A coordinate's handle and
/// text-only flag differ between the two readers by construction, and
/// `SlotValue`'s equality leaves them out, so the report does too. `None`
/// when nothing differs.
pub fn parity_report(typed: &str, today: &str) -> Option<String> {
    let kept = |dump: &str| -> Vec<String> {
        dump.lines()
            .filter(|line| {
                let line = line.trim_start();
                !(line.starts_with("handle: ") || line.starts_with("text_only: "))
            })
            .map(str::to_owned)
            .collect()
    };
    let (typed, today) = (kept(typed), kept(today));
    let (mut i, mut j) = (0, 0);
    let mut report = Vec::new();
    while i < typed.len() && j < today.len() {
        if typed[i] == today[j] {
            i += 1;
            j += 1;
        } else if let Some((slot, lines)) = empty_slot(&typed, i, &today[j]) {
            report.push(format!("{NORMALIZED_PREFIX}{}.{slot}", enclosing_kind(&typed, i)));
            i += lines;
            j += 1;
        } else {
            break;
        }
    }
    if i < typed.len() || j < today.len() {
        report.push(first_difference(i, ("typed read", &typed, i), ("today's read", &today, j)));
    }
    (!report.is_empty()).then(|| report.join("\n"))
}

/// How a read decoded from its own encoding differs from the read, from their
/// debug text. Every line counts, a coordinate's handle and text-only flag
/// included, since both sides come from one read. `None` when they agree.
pub fn round_trip_report(encoded: &str, decoded: &str) -> Option<String> {
    let lines = |dump: &str| dump.lines().map(str::to_owned).collect::<Vec<_>>();
    let (encoded, decoded) = (lines(encoded), lines(decoded));
    let at = encoded.iter().zip(&decoded).take_while(|(a, b)| a == b).count();
    (at < encoded.len().max(decoded.len())).then(|| first_difference(at, ("encoded", &encoded, at), ("decoded", &decoded, at)))
}

/// Twelve lines of each dump around the first place they part, headed by the
/// line number and each dump's name.
fn first_difference(at: usize, first: (&str, &[String], usize), second: (&str, &[String], usize)) -> String {
    let window = |lines: &[String], at: usize| lines[at.saturating_sub(12)..(at + 12).min(lines.len())].join("\n");
    format!("first difference at line {at}\n--- {}\n{}\n--- {}\n{}", first.0, window(first.1, first.2), second.0, window(second.1, second.2))
}

/// The lines after a `slot: Some(` line that spell an empty slot value.
const EMPTY_VALUES: [&[&str]; 2] = [&["[],", "),"], &["Transport(", "Blank,", "),", "),"]];

/// The slot name and the number of typed lines it spans when `typed[at..]` is
/// a slot holding its empty value and `today_line` is the same slot absent.
fn empty_slot<'a>(typed: &'a [String], at: usize, today_line: &str) -> Option<(&'a str, usize)> {
    let head = typed[at].strip_suffix("Some(")?;
    if today_line != format!("{head}None,") {
        return None;
    }
    let value = EMPTY_VALUES
        .iter()
        .find(|value| value.iter().enumerate().all(|(n, line)| typed.get(at + 1 + n).is_some_and(|t| t.trim() == *line)))?;
    Some((head.trim().trim_end_matches(':'), value.len() + 1))
}

/// The struct whose body holds line `at` of a pretty debug dump: the nearest
/// earlier line one indent level out that opens a block.
fn enclosing_kind(dump: &[String], at: usize) -> &str {
    let indent = |line: &str| line.len() - line.trim_start().len();
    let want = indent(&dump[at]).saturating_sub(4);
    dump[..at]
        .iter()
        .rev()
        .find(|line| indent(line) == want && line.ends_with(" {"))
        .map_or("?", |line| line.trim().trim_end_matches(" {"))
}

/// The refusal for an address into a tree this thread does not hold.
/// The typed read's depth from its wire form: absent is one level,
/// `Infinity` every level, and a whole number `n` at least 1 is `n` levels;
/// anything else is refused with `depth_from_wire`'s message.
pub fn typed_depth_from_wire(depth: Option<f64>) -> napi::Result<crate::read::Depth> {
    Ok(match depth_from_wire(depth)? {
        crate::ReadDepth::Deep => crate::read::Depth::All,
        crate::ReadDepth::Levels(levels) => crate::read::Depth::Levels(levels),
    })
}

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

#[cfg(test)]
mod tests {
    use super::{parity_report, round_trip_report};

    const EMPTY: &str = "Block {\n    statements: Some(\n        [],\n    ),\n    layout: None,\n}";
    const ABSENT: &str = "Block {\n    statements: None,\n    layout: None,\n}";

    #[test]
    fn an_empty_list_slot_today_leaves_absent_is_named_not_counted() {
        assert_eq!(parity_report(EMPTY, ABSENT).as_deref(), Some("normalized: Block.statements"));
    }

    #[test]
    fn a_difference_after_a_normalized_slot_is_still_reported() {
        let typed = EMPTY.replace("layout: None", "layout: Some(1)");
        let report = parity_report(&typed, ABSENT).unwrap();
        assert!(report.starts_with("normalized: Block.statements\nfirst difference at line 4"), "{report}");
    }

    #[test]
    fn a_populated_slot_against_an_absent_one_is_a_difference() {
        let typed = "Block {\n    statements: Some(\n        [\n            1,\n        ],\n    ),\n}";
        let report = parity_report(typed, "Block {\n    statements: None,\n}").unwrap();
        assert!(report.starts_with("first difference at line 1"), "{report}");
    }

    #[test]
    fn a_blank_arm_today_leaves_absent_is_named_not_counted() {
        let typed = "Block {\n    terminator: Some(\n        Transport(\n            Blank,\n        ),\n    ),\n    layout: None,\n}";
        let today = "Block {\n    terminator: None,\n    layout: None,\n}";
        assert_eq!(parity_report(typed, today).as_deref(), Some("normalized: Block.terminator"));
    }

    #[test]
    fn identical_dumps_and_handle_only_differences_agree() {
        assert_eq!(parity_report(ABSENT, ABSENT), None);
        assert_eq!(parity_report("A {\n    handle: 1,\n}", "A {\n    handle: 2,\n}"), None);
    }

    #[test]
    fn a_round_trip_compares_every_line_handles_included() {
        assert_eq!(round_trip_report(ABSENT, ABSENT), None);
        let report = round_trip_report("A {\n    handle: 1,\n}", "A {\n    handle: 2,\n}").unwrap();
        assert!(report.starts_with("first difference at line 1\n--- encoded\n"), "{report}");
        assert!(report.contains("\n--- decoded\n"), "{report}");
    }

    #[test]
    fn a_decoded_read_that_ends_early_is_a_difference() {
        let report = round_trip_report(EMPTY, "Block {").unwrap();
        assert!(report.starts_with("first difference at line 1"), "{report}");
    }
}
