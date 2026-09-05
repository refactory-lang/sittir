//! The napi engine every grammar crate exposes, defined once.
//!
//! [`napi_engine!`] emits the `SittirEngine` class: parse, read, render,
//! edits, and the live-tree table behind them. A grammar crate supplies only
//! what is actually grammar-specific — its parser hook, its transport root
//! type, and its template hash — so a change to the state machine lands in one
//! place instead of once per grammar.
//!
//! ## Trees are kept, not replaced
//!
//! Reads are lazy: a parse hands back one level, and every child with
//! substructure comes back as a stub carrying the handle to expand it later.
//! Those handles stay live for as long as the caller holds any node, so an
//! engine that kept only the newest parse would answer a held tree's handles
//! out of a different tree — and, because handles are dense indices that
//! restart at 0, would do it silently. The engine therefore keeps every parsed
//! tree in `trees`, keyed by the id its handles carry.
//!
//! Trees are dropped when JavaScript drops its side: the boundary registers
//! each tree with a `FinalizationRegistry` and calls `disposeTree` once the
//! last node referring to it is collected. `dispose` drops all of them at once.

/// Emit the `SittirEngine` napi class for one grammar.
///
/// - `$grammar` — the crate's [`EngineGrammar`](crate::engine::EngineGrammar) adapter.
/// - `$render_root` — the generated transport root type accepted by `render`.
/// - `$render_parts` — `fn(&$render_root) -> Result<(Source, String), _>`.
/// - `$abi` — the render transport ABI version this crate was generated against.
#[macro_export]
macro_rules! napi_engine {
    ($grammar:ty, $render_root:ty, $render_parts:path, $abi:expr, $defaults:path, $resolve:path) => {
        #[::napi_derive::napi(object)]
        pub struct EngineOptions {
            pub format: Option<String>,
            /// The render options object as JSON; resolved once here against the
            /// grammar's site table. Only the resolved ids are kept.
            pub options: Option<String>,
        }

        #[::napi_derive::napi]
        pub struct SittirEngine {
            engine: $crate::engine::Engine<$grammar>,
            /// Every tree still reachable from JavaScript, keyed by the id its
            /// handles carry. Entries leave only via `disposeTree`/`dispose`.
            trees: ::std::collections::HashMap<u32, $crate::ParsedTree<$grammar>>,
            next_tree_id: u32,
            /// Newest parse, for `render` calls that do not name a tree.
            last_tree_id: Option<u32>,
        }

        #[::napi_derive::napi]
        impl SittirEngine {
            #[::napi_derive::napi(constructor)]
            pub fn new(options: Option<EngineOptions>) -> ::napi::Result<Self> {
                let (format_json, options_json) = match options {
                    Some(opts) => (opts.format, opts.options),
                    None => (None, None),
                };
                let format = format_json
                    .map(|json| ::serde_json::from_str(&json))
                    .transpose()
                    .map_err(|e| {
                        ::napi::Error::from_reason(format!("parse engine format failed: {e}"))
                    })?;
                let table = match options_json {
                    Some(json) => $resolve(&json, &$defaults()).map_err(::napi::Error::from_reason)?,
                    None => $defaults(),
                };
                Ok(Self {
                    engine: $crate::engine::Engine::new(<$grammar as ::std::default::Default>::default(), format, table)
                        .map_err(::napi::Error::from_reason)?,
                    trees: ::std::collections::HashMap::new(),
                    next_tree_id: 0,
                    last_tree_id: None,
                })
            }

            #[::napi_derive::napi(getter)]
            pub fn template_bundle_hash(&self) -> &'static str {
                self.engine.template_bundle_hash()
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

            /// Parse `source` and read its root.
            ///
            /// `deep` expands the whole tree in one pass instead of leaving
            /// each child with substructure as a stub. Default (absent /
            /// `false`) is the lazy one-level read.
            ///
            /// The tree is retained under a fresh id so the handles this read
            /// hands out stay answerable; the id rides in those handles and is
            /// echoed as `treeId` for `disposeTree`.
            #[::napi_derive::napi]
            pub fn parse_and_read(
                &mut self,
                source: String,
                deep: Option<bool>,
            ) -> ::napi::Result<String> {
                let tree_id = self.claim_tree_id()?;
                let depth = $crate::napi_engine::read_depth(deep);
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
                            node_data: &data,
                            format,
                            tree_id,
                        })
                        .map_err(|e| {
                            ::napi::Error::from_reason(format!(
                                "serialize ParseResult failed: {e}"
                            ))
                        })?;
                        self.trees.insert(tree_id, parsed);
                        self.last_tree_id = Some(tree_id);
                        Ok(json)
                    }
                    Err(payload) => Err(::napi::Error::from_reason($crate::panic_msg(
                        payload,
                        "parse_and_read panicked",
                    ))),
                }
            }

            /// Expand one child of the node named by `handle`.
            ///
            /// The handle names its own tree, so a handle from a tree that has
            /// been disposed — or one never minted here — is refused rather
            /// than answered out of whichever tree happens to be present.
            #[::napi_derive::napi]
            pub fn read_node(
                &mut self,
                handle: f64,
                child_index: f64,
                deep: Option<bool>,
            ) -> ::napi::Result<String> {
                let handle = $crate::napi_engine::checked_index(handle, "handle")?;
                let child_index = $crate::napi_engine::checked_index(child_index, "childIndex")?;
                let (tree_id, _) = $crate::engine::decode_handle(handle);
                let parsed = self.trees.get_mut(&tree_id).ok_or_else(|| {
                    ::napi::Error::from_reason(format!(
                        "handle {handle} names tree {tree_id}, which is not live \
                         (never parsed, or already disposed)"
                    ))
                })?;
                let child_index = u16::try_from(child_index).map_err(|_| {
                    ::napi::Error::from_reason(format!(
                        "childIndex {child_index} exceeds the per-node child limit"
                    ))
                })?;
                parsed
                    .read_child(handle, child_index, $crate::napi_engine::read_depth(deep))
                    .map_err(::napi::Error::from_reason)
            }

            /// Render a typed transport object (napi-native, numeric `$type`).
            ///
            /// `treeId` names the parse whose detected format applies. It is
            /// optional because factory-built nodes belong to no tree.
            #[::napi_derive::napi]
            pub fn render(
                &self,
                transport: $render_root,
                tree_id: Option<f64>,
                options: Option<String>,
            ) -> ::napi::Result<String> {
                let table = match options {
                    Some(json) => $resolve(&json, self.engine.options()).map_err(::napi::Error::from_reason)?,
                    None => self.engine.options().clone(),
                };
                let (source, canonical) = $render_parts(transport, &table).map_err(|e| {
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
                    .and_then(|id| self.trees.get(&id))
                    .and_then(|pt| pt.format());
                Ok($crate::apply_render_format(
                    source,
                    canonical,
                    self.engine.engine_format(),
                    tree_format,
                ))
            }

            #[::napi_derive::napi]
            pub fn render_to_file(
                &self,
                transport: $render_root,
                path: String,
                tree_id: Option<f64>,
                options: Option<String>,
            ) -> ::napi::Result<()> {
                let rendered = self.render(transport, tree_id, options)?;
                ::std::fs::write(&path, rendered).map_err(|e| {
                    ::napi::Error::from_reason(format!("render_to_file failed for {path}: {e}"))
                })
            }

            #[::napi_derive::napi]
            pub fn apply_edits(
                &self,
                source: String,
                edits: Vec<$crate::types::Edit>,
            ) -> ::napi::Result<String> {
                self.engine
                    .apply_edits(source, edits)
                    .map_err(::napi::Error::from_reason)
            }

            /// Drop one tree. Called from the boundary's `FinalizationRegistry`
            /// once JavaScript has collected the last node reading from it.
            /// Unknown ids are not an error — a tree can only be dropped once,
            /// and the registry has no way to know whether it already was.
            #[::napi_derive::napi]
            pub fn dispose_tree(&mut self, tree_id: f64) {
                // Checked for the same reason `read_node` checks its handle:
                // `as` saturates, so `NaN` and every negative arrive as 0 —
                // and 0 is the first tree, so an unchecked cast would let a
                // nonsense id drop a live tree. Invalid input is a no-op
                // rather than an error: this is called from a finalizer,
                // where nothing is positioned to handle a throw, and
                // disposing an id that names no tree is already a no-op.
                let Ok(tree_id) = $crate::napi_engine::checked_index(tree_id, "treeId") else {
                    return;
                };
                let Ok(tree_id) = u32::try_from(tree_id) else { return };
                self.trees.remove(&tree_id);
                if self.last_tree_id == Some(tree_id) {
                    self.last_tree_id = None;
                }
            }

            /// Number of trees still held. Diagnostics only — the boundary's
            /// disposal is driven by GC, so this is the way a test can observe
            /// that trees are actually being released.
            #[::napi_derive::napi(getter)]
            pub fn live_tree_count(&self) -> u32 {
                self.trees.len() as u32
            }

            #[::napi_derive::napi]
            pub fn dispose(&mut self) {
                self.trees.clear();
                self.last_tree_id = None;
            }
        }

        impl SittirEngine {
            /// Take the next tree id, refusing to wrap.
            ///
            /// Ids share a handle's bits with the node index, so they cannot
            /// run forever; reusing one would make a stale handle look valid
            /// against the tree that took its id, which is the exact failure
            /// the tag exists to prevent. Refusing is the honest end state.
            fn claim_tree_id(&mut self) -> ::napi::Result<u32> {
                if self.next_tree_id > $crate::engine::MAX_TREE_ID {
                    return Err(::napi::Error::from_reason(format!(
                        "engine exhausted its {} tree ids; construct a new engine",
                        $crate::engine::MAX_TREE_ID
                    )));
                }
                let id = self.next_tree_id;
                self.next_tree_id += 1;
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
        return Err(napi::Error::from_reason(format!("{label} must be a finite number")));
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

/// Map the boundary's optional `deep` flag onto a [`ReadDepth`](crate::ReadDepth).
pub fn read_depth(deep: Option<bool>) -> crate::ReadDepth {
    if deep == Some(true) {
        crate::ReadDepth::Deep
    } else {
        crate::ReadDepth::Shallow
    }
}
