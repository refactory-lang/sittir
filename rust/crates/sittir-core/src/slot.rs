//! `SlotValue` — the single carrier every transport slot position holds.
//!
//! A slot's content is either in the tree — a coordinate the sink slices
//! from the source the engine still holds — or in the message, a transport
//! the render pipeline rebuilds from its own `_<slot>` storage. Free text is
//! not a third shape: a slot whose members render from their own text admits
//! a `VerbatimTransport`, and everywhere else a bare string is an error.

use crate::engine::encode_handle;
use crate::render::{CoordinateError, SourceTable};
use crate::types::Span;

/// Where an untouched node's bytes live: the tree that holds it, its
/// descendant index there and the byte span inside that tree's source. A pure
/// value; the source is looked up through the render context at the moment of
/// use. The wire packs the tree and the index into one `$treeHandle`
/// (`encode_handle`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NodeCoordinate {
    pub tree: crate::types::TreeId,
    pub index: crate::types::NodeIndex,
    /// `index + descendant_count()`: the node's subtree is the indexes
    /// `[index, end)`.
    pub end: crate::types::NodeIndex,
    pub span: Span,
    /// The kind the reader stamped on the node, when the wire carries it. A
    /// handle names a tree position, which for trivia is its owner's, so the
    /// stamp is the kind's source whenever it is present.
    pub kind: Option<crate::types::KindId>,
    /// The edge seams of the kind this coordinate names, filled by the prepare
    /// walk so a verbatim slice meets its neighbours like a rendered node does.
    pub edges: Option<CoordinateEdges>,
    /// What JavaScript wrote on the coordinate it sent (`CoordinateWrites`),
    /// behind one pointer, so a read coordinate pays only that pointer.
    pub writes: Option<Box<CoordinateWrites>>,
}

/// What JavaScript writes on a coordinate it sends back, kept off the read's
/// own path in one box (`NodeCoordinate::writes`): a coordinate the reader
/// built carries neither.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct CoordinateWrites {
    /// The edges whose neighbour a built holder changed (`$_layout.changed`):
    /// the node's sides there drop their layout runs.
    pub changed: ChangedEdges,
}

/// The edges of a node whose neighbour is not the one its source had there.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct ChangedEdges {
    pub leading: bool,
    pub trailing: bool,
}

impl ChangedEdges {
    /// Whether the edge `side` lies on changed.
    pub fn on(self, side: crate::trivia_table::TriviaSide) -> bool {
        use crate::trivia_table::TriviaSide;
        match side {
            TriviaSide::Leading => self.leading,
            TriviaSide::Trailing => self.trailing,
            TriviaSide::Inner => false,
        }
    }
}

/// One edge seam's resolved arm and the strength it carries into the writer.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SeamArm {
    pub arm: crate::types::KindId,
    pub strength: crate::spacing::SeamStrength,
}

/// The seams a kind writes before and after itself.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CoordinateEdges {
    pub before: Option<SeamArm>,
    pub after: Option<SeamArm>,
}

impl NodeCoordinate {
    pub fn new(tree: crate::types::TreeId, index: crate::types::NodeIndex, end: crate::types::NodeIndex, span: Span) -> Self {
        Self {
            tree,
            index,
            end,
            span,
            kind: None,
            edges: None,
            writes: None,
        }
    }

    /// The edges whose neighbour JavaScript changed (`CoordinateWrites::changed`).
    pub fn changed(&self) -> ChangedEdges {
        self.writes.as_ref().map_or_else(ChangedEdges::default, |writes| writes.changed)
    }

    /// The tree and the index packed as one handle: the wire's `$treeHandle`.
    pub fn handle(&self) -> u64 {
        encode_handle(self.tree, self.index)
    }

    /// The kind this coordinate names: the reader's stamp when it carries one,
    /// else the node its handle resolves to in `sources`.
    pub fn kind_in(&self, sources: &dyn crate::render::SourceTable) -> Option<crate::types::KindId> {
        self.kind.or_else(|| sources.kind_of(self))
    }

    /// Write this coordinate's bytes between its kind's edge seams, the seams a
    /// rendered node of the same kind writes around itself. `adjacent` drops the
    /// leading seam for a position that forbids whitespace before it.
    pub fn write_between_edges(
        &self,
        w: &mut dyn crate::render::RenderSink,
        adjacent: bool,
    ) -> Result<(), crate::render::RenderError> {
        if adjacent {
            w.seam(crate::layout_kinds::LayoutKinds::TIGHT);
        } else if let Some(seam) = self.edges.and_then(|e| e.before) {
            w.seam_arm(seam);
        }
        w.slice(self)?;
        if let Some(seam) = self.edges.and_then(|e| e.after) {
            w.seam_arm(seam);
        }
        w.end_lines_after(self);
        Ok(())
    }

    /// The bytes this coordinate names, or why the table cannot give them.
    pub fn resolve<'s>(&self, sources: &'s dyn SourceTable) -> Result<&'s str, CoordinateError> {
        let source = sources
            .source_of(self.tree)
            .ok_or(CoordinateError::UnknownTree {
                handle: self.handle(),
                tree_id: self.tree,
            })?;
        let std::ops::Range { start, end } = self.span.range();
        let in_range = start <= end && end <= source.len();
        if !in_range || !source.is_char_boundary(start) || !source.is_char_boundary(end) {
            return Err(CoordinateError::BadSpan {
                handle: self.handle(),
                detail: format!(
                    "span {start}..{end} is not a character range of its source of {} bytes",
                    source.len()
                ),
            });
        }
        Ok(&source[start..end])
    }
}

/// One slot position's value: the tree it came from, or the value to build.
///
/// `ADJACENT` mirrors the grammar's `immediate` stamp for this position:
/// when every scalar-capable source of the slot forbids preceding
/// whitespace, the write suppresses the seam space the spacing writer would
/// otherwise insert. It is a slot fact, not a wire fact, so it rides on the
/// type rather than the value.
#[derive(Debug, Clone)]
pub enum SlotValue<T, const ADJACENT: bool = false> {
    /// The content is in the tree: the sink slices it from the source the
    /// engine still holds, between the node's leading and trailing sides
    /// (`RenderSink::sides`).
    Coord(NodeCoordinate),
    /// The content is in this message.
    Transport(T),
}

impl<T, const ADJACENT: bool> SlotValue<T, ADJACENT> {
    /// The transport this slot holds, or `None` when it holds a coordinate.
    pub fn transport(&self) -> Option<&T> {
        match self {
            Self::Transport(t) => Some(t),
            Self::Coord(_) => None,
        }
    }

    /// The coordinate this slot holds, or `None` when it holds a value.
    pub fn coord(&self) -> Option<&NodeCoordinate> {
        match self {
            Self::Coord(coord) => Some(coord),
            Self::Transport(_) => None,
        }
    }

    /// The transport this slot holds, or `None` after slicing its coordinate
    /// into `w`. For render paths that call a concrete `render_<kind>`
    /// function directly instead of going through `Render`.
    pub fn transport_or_write(
        &self,
        w: &mut dyn crate::render::RenderSink,
    ) -> Result<Option<&T>, crate::render::RenderError> {
        match self {
            Self::Coord(coord) => {
                write_coordinate(coord, ADJACENT, w)?;
                Ok(None)
            }
            Self::Transport(t) => Ok(Some(t)),
        }
    }
}

/// Two slot values are equal when they hold equal transports, or
/// coordinates naming the same node: the same tree, span and kind. A
/// coordinate may address its node by any index its tree answers.
impl<T: PartialEq, const ADJACENT: bool> PartialEq for SlotValue<T, ADJACENT> {
    fn eq(&self, other: &Self) -> bool {
        match (self, other) {
            (Self::Transport(a), Self::Transport(b)) => a == b,
            (Self::Coord(a), Self::Coord(b)) => a.tree == b.tree && a.span == b.span && a.kind == b.kind && a.changed() == b.changed(),
            _ => false,
        }
    }
}

impl<T: crate::render::Render, const ADJACENT: bool> crate::render::Render
    for SlotValue<T, ADJACENT>
{
    fn render(&self, w: &mut dyn crate::render::RenderSink) -> crate::render::RenderResult {
        match self {
            Self::Coord(coord) => write_coordinate(coord, ADJACENT, w),
            Self::Transport(t) => t.render(w),
        }
    }
}

/// Write a coordinate's bytes, framed by its node's leading and trailing
/// sides as a rendered owner is (`render_framed`), unless its node's frame
/// is already open (`RenderSink::in_frame_of`); its kind's edges are the
/// coordinate's own (`write_between_edges`).
fn write_coordinate(
    coord: &NodeCoordinate,
    adjacent: bool,
    w: &mut dyn crate::render::RenderSink,
) -> crate::render::RenderResult {
    if w.in_frame_of(coord) {
        return coord.write_between_edges(w, adjacent);
    }
    match w.sides(coord)? {
        None => coord.write_between_edges(w, adjacent),
        Some(trivia) => crate::layout::render_framed(
            Some(&*trivia),
            crate::options::Edges::default(),
            None,
            Some(coord),
            crate::layout::TriviaRole::Owner,
            w,
            |w| coord.write_between_edges(w, adjacent),
        ),
    }
}

/// `napi_typeof` without the `type_of!` macro, which expands to a bare
/// `check_status!` that would have to be in scope at every call site.
///
/// # Safety
/// `napi_val` must be a live value in `env`.
#[cfg(feature = "napi-bindings")]
pub unsafe fn transport_value_type(
    env: ::napi::sys::napi_env,
    napi_val: ::napi::sys::napi_value,
) -> ::napi::Result<::napi::ValueType> {
    unsafe { raw_typeof(env, napi_val) }.map(::napi::ValueType::from)
}

/// The JavaScript `typeof` of a value, for a refusal to name: `bigint` among
/// them, which `napi::ValueType` reads as `Unknown`.
///
/// # Safety
/// `napi_val` must be a live value in `env`.
#[cfg(feature = "napi-bindings")]
pub unsafe fn js_type_name(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<&'static str> {
    use ::napi::sys::ValueType as T;
    /// `napi_bigint`, which napi-sys declares only under its `napi6` feature.
    const BIGINT: ::napi::sys::napi_valuetype = 9;
    Ok(match unsafe { raw_typeof(env, napi_val)? } {
        T::napi_undefined => "undefined",
        T::napi_null => "null",
        T::napi_boolean => "boolean",
        T::napi_number => "number",
        T::napi_string => "string",
        T::napi_symbol => "symbol",
        T::napi_object => "object",
        T::napi_function => "function",
        T::napi_external => "external",
        BIGINT => "bigint",
        _ => "value of an unknown type",
    })
}

#[cfg(feature = "napi-bindings")]
unsafe fn raw_typeof(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<::napi::sys::napi_valuetype> {
    let mut value_type = 0;
    let status = unsafe { ::napi::sys::napi_typeof(env, napi_val, &mut value_type) };
    if status != ::napi::sys::Status::napi_ok {
        return Err(::napi::Error::new(
            ::napi::Status::from(status),
            "napi_typeof failed".to_owned(),
        ));
    }
    Ok(value_type)
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::FromNapiValue + crate::trivia::HasTrivia, const ADJACENT: bool>
    ::napi::bindgen_prelude::FromNapiValue for SlotValue<T, ADJACENT>
{
    /// Dispatch on the wire shape: an object carrying `$treeHandle` is a
    /// coordinate (its `$span` is required), anything else is the slot's own
    /// transport type, which decides for itself what it accepts. There is no
    /// attempt-then-fallback.
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let value_type = unsafe { transport_value_type(env, napi_val)? };
        if value_type == ::napi::ValueType::Object {
            if let Some(coord) = unsafe { coordinate_from_napi(env, napi_val)? } {
                return Ok(Self::Coord(coord));
            }
        }
        Ok(Self::Transport(unsafe {
            T::from_napi_value(env, napi_val)?
        }))
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::ToNapiValue, const ADJACENT: bool> ::napi::bindgen_prelude::ToNapiValue
    for SlotValue<T, ADJACENT>
{
    /// A transport writes itself; a coordinate writes the object the decoder
    /// reads back as one.
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        match val {
            Self::Transport(transport) => unsafe { T::to_napi_value(env, transport) },
            Self::Coord(coord) => unsafe { coordinate_to_napi(env, coord) },
        }
    }
}

/// The coordinate the object `napi_val` spells, `{ $treeHandle, $end, $span,
/// $type?, $_layout?: { gap?, changed? } }`, or `None` when it carries no
/// `$treeHandle`.
/// A `$treeHandle` without a `$span` or an `$end` is refused.
///
/// # Safety
/// `napi_val` must be a live object in `env`.
#[cfg(feature = "napi-bindings")]
pub(crate) unsafe fn coordinate_from_napi(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<Option<NodeCoordinate>> {
    use crate::boundary::property;
    let Some(handle) = (unsafe { property::<f64>(env, napi_val, c"$treeHandle")? }) else {
        return Ok(None);
    };
    let handle = crate::napi_engine::checked_index(handle, "$treeHandle")?;
    let span: Span = unsafe { property(env, napi_val, c"$span")? }
        .ok_or_else(|| ::napi::Error::from_reason(format!("coordinate with $treeHandle {handle} carries no $span")))?;
    let end: crate::types::NodeIndex = unsafe { property(env, napi_val, c"$end")? }
        .ok_or_else(|| ::napi::Error::from_reason(format!("coordinate with $treeHandle {handle} carries no $end")))?;
    let kind: Option<crate::types::KindId> = unsafe { property(env, napi_val, c"$type")? };
    let changed = match unsafe { property::<::napi::bindgen_prelude::Object>(env, napi_val, c"$_layout")? } {
        Some(layout) => unsafe { property::<ChangedEdges>(env, ::napi::JsValue::raw(&layout), c"changed")?.unwrap_or_default() },
        None => ChangedEdges::default(),
    };
    let (tree, index) = crate::engine::decode_handle(handle);
    let writes = (changed != ChangedEdges::default()).then(|| Box::new(CoordinateWrites { changed }));
    Ok(Some(NodeCoordinate { kind, writes, ..NodeCoordinate::new(tree, index, end, span) }))
}

/// `{ $treeHandle, $span, $type? }`, the object `coordinate_from_napi` reads
/// back. Its edges are the prepare walk's and its gap JavaScript's, so neither
/// crosses back.
#[cfg(feature = "napi-bindings")]
pub(crate) unsafe fn coordinate_to_napi(env: ::napi::sys::napi_env, coord: NodeCoordinate) -> ::napi::Result<::napi::sys::napi_value> {
    use crate::boundary::{object_with_present, present};
    unsafe {
        object_with_present(env, &[
            present(env, c"$treeHandle", Some(coord.handle() as f64))?,
            present(env, c"$end", Some(coord.end))?,
            present(env, c"$span", Some(coord.span))?,
            present(env, c"$type", coord.kind.map(|kind| u32::from(kind.0)))?,
        ])
    }
}

#[cfg(test)]
mod tests {
    use crate::types::KindId;
    use super::SlotValue;
    use crate::engine::encode_handle;
    use crate::render::{render_to_string, Render, RenderResult, RenderSink, WhitespaceTable};
    use crate::render::{CoordinateError, SourceTable};
    use crate::slot::NodeCoordinate;
    use crate::spacing::{SpacingWriter, WordMatcher};

    #[test]
    fn an_optional_seam_arm_keeps_its_niche_in_four_bytes() {
        assert_eq!(std::mem::size_of::<super::SeamArm>(), 4);
        assert_eq!(std::mem::size_of::<Option<super::SeamArm>>(), 4);
    }
    use crate::types::Span;
    use std::collections::HashMap;
    use std::sync::Arc;

    struct Sources(HashMap<crate::types::TreeId, Arc<str>>);
    impl SourceTable for Sources {
        fn source_of(&self, tree_id: crate::types::TreeId) -> Option<&Arc<str>> {
            self.0.get(&tree_id)
        }
    }

    fn rendered_with(
        value: &dyn Render,
        sources: &Sources,
    ) -> Result<String, crate::render::RenderError> {
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident())
            .with_table(&TABLE)
            .with_indent("    ")
            .with_sources(sources);
        value.render(&mut w)?;
        w.finish()?;
        Ok(out)
    }

    #[test]
    fn a_coordinate_renders_its_slice_of_its_own_tree() {
        let sources = Sources(HashMap::from([(crate::types::TreeId(3), Arc::from("let main() {}"))]));
        let coord = NodeCoordinate::new(crate::types::TreeId(3), crate::types::NodeIndex(0), crate::types::NodeIndex(1), Span { start: 4, end: 8 });
        assert_eq!(coord.handle(), encode_handle(crate::types::TreeId(3), crate::types::NodeIndex(0)));
        assert_eq!(coord.resolve(&sources), Ok("main"));
        let slot: SlotValue<Word> = SlotValue::Coord(coord);
        assert_eq!(rendered_with(&slot, &sources).unwrap(), "main");
        assert!(slot.coord().is_some());
    }

    #[test]
    fn an_adjacent_coordinate_slot_keeps_its_adjacency_through_the_sink() {
        struct LetX;
        impl Render for LetX {
            fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
                w.text("let")?;
                let slot: SlotValue<Word, true> = SlotValue::Coord(NodeCoordinate::new(
                    crate::types::TreeId(1),
                    crate::types::NodeIndex(0), crate::types::NodeIndex(1),
                    Span { start: 0, end: 1 },
                ));
                slot.render(w)
            }
        }
        let sources = Sources(HashMap::from([(crate::types::TreeId(1), Arc::from("x"))]));
        assert_eq!(rendered_with(&LetX, &sources).unwrap(), "letx");
    }

    struct Kinded(Sources);
    impl SourceTable for Kinded {
        fn source_of(&self, tree_id: crate::types::TreeId) -> Option<&Arc<str>> {
            self.0.source_of(tree_id)
        }
        fn kind_of(&self, _: &NodeCoordinate) -> Option<crate::types::KindId> {
            Some(crate::types::KindId(9))
        }
    }

    #[test]
    fn a_coordinate_meets_the_edge_seams_of_its_kind_like_a_rendered_node() {
        use crate::options::{EdgeSite, ResolvedOptions, SiteSpec};
        use crate::types::{EdgeRow, SiteId};
        use crate::prepare::{Prepare, RenderContext};
        use crate::spacing::{SEAM_CASCADE, SEAM_DECLARED, SEAM_FALLBACK};
        const TIGHT: KindId = KindId(1);
        const SPACE: KindId = KindId(2);
        fn text_of(kind: KindId) -> &'static str {
            if kind == SPACE {
                " "
            } else {
                ""
            }
        }
        const EDGE_TABLE: WhitespaceTable = WhitespaceTable {
            text_of,
            indent: KindId(0),
            dedent: KindId(0), leaf_edges: &[], gaps: &[(1, KindId(1)), (2, KindId(2))]
        };
        static EDGES: [EdgeSite; 1] = [EdgeSite { before: Some(SiteId(0)), after: None, before_arms: &[], after_arms: &[] }];
        static EDGE_ROWS: [Option<EdgeRow>; 10] = [None, None, None, None, None, None, None, None, None, Some(EdgeRow(0))];
        static SITES: [SiteSpec; 1] = [SiteSpec { default_arm: TIGHT, strength: SEAM_CASCADE }];
        let sources = Kinded(Sources(HashMap::from([(crate::types::TreeId(1), Arc::from("f()"))])));
        let render_with = |options: &ResolvedOptions, held: crate::spacing::SeamStrength| {
            let mut slot: SlotValue<Word> = SlotValue::Coord(NodeCoordinate::new(
                crate::types::TreeId(1),
                crate::types::NodeIndex(0), crate::types::NodeIndex(1),
                Span { start: 1, end: 3 },
            ));
            slot.prepare(&RenderContext {
                options,
                sources: &sources,
                recording: None,
            })
            .unwrap();
            let mut out = String::new();
            let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident())
                .with_table(&EDGE_TABLE)
                .with_sources(&sources);
            w.text("f").unwrap();
            w.site_with(SPACE, held);
            slot.render(&mut w).unwrap();
            w.finish().unwrap();
            out
        };
        let with_edges = ResolvedOptions {
            spacing: ResolvedOptions::default_spacing(&SITES),
            edges: &EDGES,
            edge_rows: &EDGE_ROWS,
            sites: &SITES,
            ..ResolvedOptions::default()
        };
        // A cascade-tight edge beats the fallback space held before it, and a
        // declared space still beats the cascade.
        assert_eq!(render_with(&with_edges, SEAM_FALLBACK), "f()");
        assert_eq!(render_with(&with_edges, SEAM_DECLARED), "f ()");
        // A kind that owns no edge site leaves the held space alone.
        assert_eq!(render_with(&ResolvedOptions::default(), SEAM_FALLBACK), "f ()");
    }

    #[test]
    fn a_coordinate_into_an_unknown_tree_is_refused_with_its_handle() {
        let sources = Sources(HashMap::new());
        let handle = encode_handle(crate::types::TreeId(9), crate::types::NodeIndex(2));
        let coord = NodeCoordinate::new(crate::types::TreeId(9), crate::types::NodeIndex(2), crate::types::NodeIndex(3), Span { start: 0, end: 1 });
        assert_eq!(
            coord.resolve(&sources),
            Err(CoordinateError::UnknownTree { handle, tree_id: crate::types::TreeId(9) })
        );
        let slot: SlotValue<Word> = SlotValue::Coord(coord);
        assert!(rendered_with(&slot, &sources).is_err());
    }

    #[test]
    fn a_span_outside_its_source_or_off_a_char_boundary_is_refused() {
        let sources = Sources(HashMap::from([
            (crate::types::TreeId(1), Arc::from("é")),
            (crate::types::TreeId(2), Arc::from("short")),
        ]));
        let off = NodeCoordinate::new(crate::types::TreeId(1), crate::types::NodeIndex(0), crate::types::NodeIndex(1), Span { start: 1, end: 2 });
        assert!(matches!(
            off.resolve(&sources),
            Err(CoordinateError::BadSpan { .. })
        ));
        let out = NodeCoordinate::new(crate::types::TreeId(2), crate::types::NodeIndex(0), crate::types::NodeIndex(1), Span { start: 2, end: 40 });
        let Err(CoordinateError::BadSpan { detail, .. }) = out.resolve(&sources) else {
            panic!("expected BadSpan")
        };
        assert!(detail.contains("2..40") && detail.contains('5'), "{detail}");
    }

    #[test]
    fn a_writer_without_sources_refuses_every_coordinate() {
        let slot: SlotValue<Word> = SlotValue::Coord(NodeCoordinate::new(
            crate::types::TreeId(1),
            crate::types::NodeIndex(0), crate::types::NodeIndex(1),
            Span { start: 0, end: 1 },
        ));
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident()).with_table(&TABLE);
        assert!(slot.render(&mut w).is_err());
    }

    #[test]
    fn the_unknown_tree_message_names_the_tree() {
        let err = CoordinateError::UnknownTree {
            handle: 12_884_901_888,
            tree_id: crate::types::TreeId(3),
        };
        assert!(err.to_string().contains("names tree 3"), "{err}");
    }

    struct Word(&'static str);

    impl Render for Word {
        fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
            w.text(self.0)
        }
    }

    impl crate::prepare::Prepare for Word {
        fn prepare(
            &mut self,
            _: &crate::prepare::RenderContext<'_>,
        ) -> Result<(), CoordinateError> {
            Ok(())
        }
    }

    const WORD_KIND: crate::types::KindId = crate::types::KindId(7);

    impl crate::view::KindOf for Word {
        fn kind_in(&self, kinds: &[crate::types::KindId]) -> bool {
            kinds.contains(&WORD_KIND)
        }
    }

    #[test]
    fn a_slot_answers_a_kind_test_for_its_value_and_never_for_a_tree_it_cannot_ask() {
        use crate::view::KindTest;
        let sources = Sources(HashMap::from([(crate::types::TreeId(3), Arc::from("let main() {}"))]));
        let mut out = String::new();
        let w = SpacingWriter::new(&mut out, WordMatcher::default_ident())
            .with_table(&TABLE)
            .with_indent("    ")
            .with_sources(&sources);
        let held: SlotValue<Word> = SlotValue::Transport(Word("main"));
        assert!(held.kind_in(&w, &[WORD_KIND]));
        assert!(!held.kind_in(&w, &[crate::types::KindId(8)]));
        let absent: Option<SlotValue<Word>> = None;
        assert!(!absent.kind_in(&w, &[WORD_KIND]));
        // A table of bare sources holds no tree to ask, so a coordinate is no kind.
        let coord: SlotValue<Word> =
            SlotValue::Coord(NodeCoordinate::new(crate::types::TreeId(3), crate::types::NodeIndex(0), crate::types::NodeIndex(1), Span { start: 4, end: 8 }));
        assert!(!coord.kind_in(&w, &[WORD_KIND]));
    }

    fn text_of(_: KindId) -> &'static str {
        ""
    }
    const TABLE: WhitespaceTable = WhitespaceTable {
        text_of,
        indent: KindId(0),
        dedent: KindId(0), leaf_edges: &[], gaps: &[]
    };

    fn rendered(value: &dyn Render) -> String {
        render_to_string(value, WordMatcher::default_ident(), &TABLE, "    ").unwrap()
    }

    #[test]
    fn node_renders_through_its_transport() {
        let slot: SlotValue<Word> = SlotValue::Transport(Word("fn"));
        assert_eq!(rendered(&slot), "fn");
        assert!(slot.transport().is_some());
    }

    #[test]
    fn transport_or_write_writes_only_the_coordinate_case() {
        let sources = Sources(HashMap::from([(crate::types::TreeId(1), Arc::from("raw"))]));
        let mut buf = String::new();
        let mut w = SpacingWriter::new(&mut buf, WordMatcher::default_ident())
            .with_table(&TABLE)
            .with_sources(&sources);
        let node: SlotValue<Word> = SlotValue::Transport(Word("fn"));
        assert!(node.transport_or_write(&mut w).unwrap().is_some());
        w.finish().unwrap();
        assert_eq!(buf, "");

        let mut buf2 = String::new();
        let mut w2 = SpacingWriter::new(&mut buf2, WordMatcher::default_ident())
            .with_table(&TABLE)
            .with_sources(&sources);
        let coord: SlotValue<Word> = SlotValue::Coord(NodeCoordinate::new(
            crate::types::TreeId(1),
            crate::types::NodeIndex(0), crate::types::NodeIndex(1),
            Span { start: 0, end: 3 },
        ));
        assert!(coord.transport_or_write(&mut w2).unwrap().is_none());
        w2.finish().unwrap();
        assert_eq!(buf2, "raw");
    }
}

/// `{ leading?, trailing? }`, each `true` for a changed edge.
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for ChangedEdges {
    unsafe fn from_napi_value(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<Self> {
        use crate::boundary::property;
        Ok(Self {
            leading: unsafe { property::<bool>(env, napi_val, c"leading")? }.unwrap_or(false),
            trailing: unsafe { property::<bool>(env, napi_val, c"trailing")? }.unwrap_or(false),
        })
    }
}
