//! The typed sink a render writes into, and the trait every rendered value
//! implements against it. Whitespace decisions are calls, not bytes: a
//! site's arm, a fixed seam, a whitespace token, adjacency and depth each
//! have a method, and the writer behind the sink decides what reaches the
//! output.

use crate::tree_sitter;
use std::fmt;

use crate::spacing::{SpacingWriter, WordMatcher};
use crate::types::KindId;

#[derive(Debug)]
pub enum RenderError {
    Fmt(fmt::Error),
    Coordinate(CoordinateError),
    /// A built list's item at this position, past the last index an
    /// `ItemIndex` holds.
    ItemIndex(usize),
    /// A record's cell or word that no record writer writes, met by a view.
    #[cfg(feature = "arena")]
    Record(crate::arena::ArenaError),
    /// No delimiter a composite derives fits its content.
    Delimiter(crate::delimiters::DelimiterRefusal),
}

impl fmt::Display for RenderError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Fmt(e) => fmt::Display::fmt(e, f),
            Self::Coordinate(e) => fmt::Display::fmt(e, f),
            Self::ItemIndex(at) => write!(f, "list item {at} is past the last item index a u32 holds"),
            #[cfg(feature = "arena")]
            Self::Record(e) => fmt::Display::fmt(e, f),
            Self::Delimiter(refusal) => fmt::Display::fmt(refusal, f),
        }
    }
}

impl std::error::Error for RenderError {}

impl From<fmt::Error> for RenderError {
    fn from(e: fmt::Error) -> Self {
        Self::Fmt(e)
    }
}

impl From<CoordinateError> for RenderError {
    fn from(e: CoordinateError) -> Self {
        #[cfg(feature = "arena")]
        if let CoordinateError::Record(e) = e {
            return Self::Record(e);
        }
        Self::Coordinate(e)
    }
}

#[cfg(feature = "arena")]
impl From<crate::arena::ArenaError> for RenderError {
    fn from(e: crate::arena::ArenaError) -> Self {
        Self::Record(e)
    }
}

pub type RenderResult = Result<(), RenderError>;

/// The grammar's whitespace vocabulary as the writer needs it: the text of
/// each arm by kind id, and which two ids are the depth arms.
#[derive(Debug)]
pub struct WhitespaceTable {
    pub text_of: fn(KindId) -> &'static str,
    pub indent: KindId,
    pub dedent: KindId,
    /// Per kind id, the layout kinds its leaf pattern takes before it (low
    /// byte) and after it (high byte); 0 for a kind with no stamp.
    pub leaf_edges: &'static [u16],
    /// The kind id the grammar gives each gap kind, by `LayoutKinds` bit.
    pub gaps: &'static [(u8, KindId)],
}

impl WhitespaceTable {
    /// The gap kind a whitespace kind id is, when it is one (a depth arm or an
    /// unknown id is not).
    #[must_use]
    pub fn gap_of(&self, id: KindId) -> Option<crate::layout_kinds::LayoutKinds> {
        self.gaps.iter().find(|(_, gap)| *gap == id).map(|(bit, _)| crate::layout_kinds::LayoutKinds(*bit))
    }

    /// The text the grammar spells one gap kind with.
    #[must_use]
    pub fn text_of_gap(&self, gap: crate::layout_kinds::LayoutKinds) -> &'static str {
        match self.gaps.iter().find(|(bit, _)| *bit == gap.0) {
            Some((_, id)) => (self.text_of)(*id),
            None => gap.default_text(),
        }
    }

    /// The layout kinds a leaf of `kind` takes before and after it, when it is stamped.
    #[must_use]
    pub fn leaf_edges_of(&self, kind: KindId) -> Option<(crate::layout_kinds::LayoutKinds, crate::layout_kinds::LayoutKinds)> {
        use crate::layout_kinds::LayoutKinds;
        self.leaf_edges.get(kind.index()).copied().filter(|packed| *packed != 0).map(|packed| {
            let [before, after] = packed.to_le_bytes();
            (LayoutKinds(before), LayoutKinds(after))
        })
    }
}

/// One node of a coordinate's edge chain (`SourceTable::for_each_edge_level`):
/// the kind a read stamps it with, its grammar kind, the kind the parser shows
/// it as (`read::display_id`, which its holder's boundary arm names it by),
/// and the field its holder tags it with (none at the coordinate's own level).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EdgeLevel {
    pub stamp: KindId,
    pub grammar: KindId,
    pub display: KindId,
    pub field: Option<crate::types::FieldId>,
}

/// The parsed trees' arenas a caller holds, lent read-only to a lookup it
/// makes: a render's held arenas, or the arena a call outside a render
/// locked for it. A tree read whole measures its baselines from the records
/// in them (`Lookups::recorded`); a caller that holds none lends none.
#[derive(Clone, Copy)]
pub struct Lent<'a> {
    #[cfg(feature = "arena")]
    arenas: Option<&'a dyn crate::arena::RecordArenas>,
    #[cfg(not(feature = "arena"))]
    arenas: std::marker::PhantomData<&'a ()>,
}

impl Lent<'_> {
    /// No arena lent.
    pub const NONE: Self = Self {
        #[cfg(feature = "arena")]
        arenas: None,
        #[cfg(not(feature = "arena"))]
        arenas: std::marker::PhantomData,
    };
}

#[cfg(feature = "arena")]
impl<'a> Lent<'a> {
    /// `arenas`, lent.
    #[must_use]
    pub fn of(arenas: &'a dyn crate::arena::RecordArenas) -> Self {
        Self { arenas: Some(arenas) }
    }

    /// The arena of `tree`, when one is lent.
    #[must_use]
    pub fn tree(self, tree: crate::types::TreeId) -> Option<&'a crate::arena::TreeArena> {
        self.arenas?.tree(tree)
    }

    /// The arenas lent.
    #[must_use]
    pub fn arenas(self) -> Option<&'a dyn crate::arena::RecordArenas> {
        self.arenas
    }
}

/// The live trees a render may slice, keyed by the tag a handle carries.
pub trait SourceTable {
    fn source_of(&self, tree_id: crate::types::TreeId) -> Option<&str>;

    /// Whether the source of `tree_id` spells every line break `\n`, holding
    /// no `\r`, as its parse found: a slice of it enters the writer as it is.
    /// A table that does not know says no, and the writer respells the slice.
    fn breaks_spelled_lf(&self, tree_id: crate::types::TreeId) -> bool {
        let _ = tree_id;
        false
    }

    /// The kind of the node a coordinate names, when the table still holds
    /// its tree. A table of bare sources cannot answer and says so.
    fn kind_of(&self, coord: &crate::slot::NodeCoordinate) -> Option<KindId> {
        let _ = coord;
        None
    }

    /// Visits the node a coordinate names and each node under it, in source
    /// order, with its kind and source text; a visit that answers `false`
    /// skips that node's children. A table of bare sources knows no nodes and
    /// visits none.
    fn for_each_descendant(&self, coord: &crate::slot::NodeCoordinate, visit: &mut dyn FnMut(KindId, &str) -> bool) {
        let _ = (coord, visit);
    }

    /// The byte offsets of the lines under the node a coordinate names that
    /// begin inside a token (`engine::line_starts_inside_tokens`): a slice
    /// re-indented to its new column leaves these lines as they are. A table
    /// of bare sources knows no tokens and answers none.
    fn line_starts_inside_tokens(&self, coord: &crate::slot::NodeCoordinate) -> Vec<u32> {
        let _ = coord;
        Vec::new()
    }

    /// The kind of the last child that is not an extra of the list spanning
    /// `span` in `tree`, the list's own kind being `kind`
    /// (`engine::last_list_child`). A table of bare sources cannot
    /// answer and says so.
    fn last_list_child_kind(&self, tree: crate::types::TreeId, span: crate::types::Span, kind: KindId) -> Option<KindId> {
        let _ = (tree, span, kind);
        None
    }

    /// Visits the node a coordinate names, then each first (`Side::Before`)
    /// or last (`Side::After`) child that starts or ends at the same byte,
    /// outermost first: the nodes whose templates meet at that edge of the
    /// coordinate's bytes. A line end the node's text owes belongs to
    /// whichever of these kinds ends in it, and each level places at the edge
    /// what its template writes there (`RenderSink::boundary`). A coordinate
    /// whose handle names a node other than its own span (a deep read's leaf,
    /// trivia) visits only its own level.
    fn for_each_edge_level(&self, coord: &crate::slot::NodeCoordinate, side: crate::options::Side, f: &mut dyn FnMut(EdgeLevel)) {
        let _ = side;
        if let Some(grammar) = self.kind_of(coord) {
            f(EdgeLevel { stamp: coord.kind.unwrap_or(grammar), grammar, display: grammar, field: None });
        }
    }

    /// The levels the node a coordinate names opens net of those it closes:
    /// its tree's depth members (`SurfaceKinds::indent`, `dedent`) counted
    /// over its subtree. A slice moves the writer's depth by it, as the
    /// node's template would; a tree root's slice once something after it
    /// reads the depth, so a render that reads none never asks. A coordinate whose handle names a node other
    /// than its own span, and a table of bare sources, answer none.
    fn depth_move(&self, coord: &crate::slot::NodeCoordinate) -> i32 {
        let _ = coord;
        0
    }

    /// The sides of the node a coordinate names, as its tree's trivia table
    /// and writes give them (`ParsedTree::trivia_side`), or `None` when it has
    /// none, the layout measured over the arenas the caller lends (`Lent`).
    /// A table of bare sources knows no sides.
    fn sides(&self, coord: &crate::slot::NodeCoordinate, lent: Lent<'_>) -> Option<Box<dyn crate::trivia::FramedTrivia>> {
        let _ = (coord, lent);
        None
    }

    /// The sides a coordinate's bytes render between: its node's own
    /// (`sides`), then those of each node inside its bytes that holds trivia
    /// at its edges for it (`ParsedTree::frame_levels`), measured over the
    /// arenas the caller lends. A table of bare sources knows no sides.
    fn frames(&self, coord: &crate::slot::NodeCoordinate, lent: Lent<'_>) -> crate::trivia::Frames {
        crate::trivia::Frames { own: self.sides(coord, lent), items: Vec::new() }
    }

    /// The stored layout of each list slot of the node a coordinate names
    /// (`layout::SlotLayout`), as its tree measures it over the arenas the
    /// caller lends; none for a table of bare sources.
    fn slot_layouts(&self, coord: &crate::slot::NodeCoordinate, lent: Lent<'_>) -> Vec<crate::layout::SlotLayout> {
        let _ = (coord, lent);
        Vec::new()
    }

    /// The separator before the node a coordinate names as an item of its
    /// parent's list slot, where it is not the one the slot renders
    /// (`ParsedTree::separator_before`), measured over the arenas the caller
    /// lends; none for a table of bare sources.
    fn separator_before(&self, coord: &crate::slot::NodeCoordinate, lent: Lent<'_>) -> Option<KindId> {
        let _ = (coord, lent);
        None
    }

    /// The bytes the node a coordinate names renders over with its sides: its
    /// span, widened to the outermost extra or `ERROR` of its leading and
    /// trailing sides. A layout run is the gap beside them, and a written
    /// entry has no bytes. A table of bare sources knows no sides and answers
    /// the span.
    fn framed_span(&self, coord: &crate::slot::NodeCoordinate) -> crate::types::Span {
        coord.span
    }

    /// Whether a write replaced a side of a node in the range of the node a
    /// coordinate names, its own `inner` included (`ParsedTree::edited_within`).
    fn edited_within(&self, coord: &crate::slot::NodeCoordinate) -> bool {
        let _ = coord;
        false
    }

    /// Whether a read node from the node a coordinate names renders as that
    /// coordinate, its source bytes: a parsed node with no write in its range
    /// (`edited_within`). A table that holds no tree, or one a render reads
    /// templates through on purpose, answers no.
    fn renders_as_source(&self, coord: &crate::slot::NodeCoordinate) -> bool {
        let _ = coord;
        false
    }

    /// Whether a render through this table reads each parsed node it meets
    /// that has a record and renders it from its template, as it does a node
    /// a write lies in (`edited_within`); a leaf or a unit still writes its
    /// source bytes. Only a table a render reads templates through on purpose
    /// (`ThroughTemplates`) answers yes.
    fn reads_templates(&self) -> bool {
        false
    }

    /// The seat of the node a coordinate names, through the wrappers it is
    /// (`ResolvedOptions::seat_wrappers`): for each node held by the one
    /// before it, from the coordinate's own, the first that `seat` gives a
    /// site. A table of bare sources knows no nodes and answers none.
    fn seat_through(&self, coord: &crate::slot::NodeCoordinate, wrappers: &[Option<crate::options::SeatPath>], seat: &dyn Fn(KindId) -> Option<crate::types::SiteId>) -> Option<crate::types::SiteId> {
        let _ = (coord, wrappers, seat);
        None
    }

    /// The coordinate a read of the live tree `tree` names the node at
    /// `index` by (`ReadCtx::coordinate_of`), as the read of a cursor on it
    /// (`read_node`) names it; `None` where the table holds no such node.
    fn row_coordinate(&self, tree: crate::types::TreeId, index: crate::types::NodeIndex) -> Option<crate::slot::NodeCoordinate> {
        let mut at = None;
        self.read_node(tree, index, &mut |cursor, read| at = Some(read.coordinate_of(&crate::nodes::Kid::at(cursor))));
        at
    }

    /// Hands `read` a cursor on the node at `index` of the live tree `tree`,
    /// created at the tree's root, and the context the tree's reads share;
    /// false, `read` not called, where the table holds no such node. A table
    /// of bare sources holds no trees.
    fn read_node(&self, tree: crate::types::TreeId, index: crate::types::NodeIndex, read: &mut dyn FnMut(&mut tree_sitter::TreeCursor<'_>, &mut crate::read::ReadCtx<'_>)) -> bool {
        let _ = (tree, index, read);
        false
    }

    /// Renders the built record `record`, which the store `held` answered,
    /// into `w` as a trivia entry in the side that holds it, from the arena
    /// that wrote it, under `options`. A table that reaches no arena
    /// refuses.
    ///
    /// # Errors
    ///
    /// What the record's render refuses, and `RenderError::Record` when no
    /// arena is reachable from here.
    #[cfg(feature = "arena")]
    fn render_record_entry(&self, record: crate::trivia::BuiltEntry, held: &dyn std::any::Any, options: &crate::options::ResolvedOptions, w: &mut dyn RenderSink) -> RenderResult {
        let _ = (record, held, options, w);
        Err(RenderError::Record(NO_ARENA))
    }
}

/// The table `0`, read by a render that renders each parsed node with a
/// record from its template (`SourceTable::reads_templates`): no node
/// renders as its source bytes (`SourceTable::renders_as_source`), and
/// every other answer is `0`'s.
pub struct ThroughTemplates<'a>(pub &'a dyn SourceTable);

impl SourceTable for ThroughTemplates<'_> {
    fn source_of(&self, tree_id: crate::types::TreeId) -> Option<&str> {
        self.0.source_of(tree_id)
    }

    fn breaks_spelled_lf(&self, tree_id: crate::types::TreeId) -> bool {
        self.0.breaks_spelled_lf(tree_id)
    }

    fn kind_of(&self, coord: &crate::slot::NodeCoordinate) -> Option<KindId> {
        self.0.kind_of(coord)
    }

    fn for_each_descendant(&self, coord: &crate::slot::NodeCoordinate, visit: &mut dyn FnMut(KindId, &str) -> bool) {
        self.0.for_each_descendant(coord, visit);
    }

    fn line_starts_inside_tokens(&self, coord: &crate::slot::NodeCoordinate) -> Vec<u32> {
        self.0.line_starts_inside_tokens(coord)
    }

    fn last_list_child_kind(&self, tree: crate::types::TreeId, span: crate::types::Span, kind: KindId) -> Option<KindId> {
        self.0.last_list_child_kind(tree, span, kind)
    }

    fn for_each_edge_level(&self, coord: &crate::slot::NodeCoordinate, side: crate::options::Side, f: &mut dyn FnMut(EdgeLevel)) {
        self.0.for_each_edge_level(coord, side, f);
    }

    fn depth_move(&self, coord: &crate::slot::NodeCoordinate) -> i32 {
        self.0.depth_move(coord)
    }

    fn sides(&self, coord: &crate::slot::NodeCoordinate, lent: Lent<'_>) -> Option<Box<dyn crate::trivia::FramedTrivia>> {
        self.0.sides(coord, lent)
    }

    fn frames(&self, coord: &crate::slot::NodeCoordinate, lent: Lent<'_>) -> crate::trivia::Frames {
        self.0.frames(coord, lent)
    }

    fn slot_layouts(&self, coord: &crate::slot::NodeCoordinate, lent: Lent<'_>) -> Vec<crate::layout::SlotLayout> {
        self.0.slot_layouts(coord, lent)
    }

    fn separator_before(&self, coord: &crate::slot::NodeCoordinate, lent: Lent<'_>) -> Option<KindId> {
        self.0.separator_before(coord, lent)
    }

    fn framed_span(&self, coord: &crate::slot::NodeCoordinate) -> crate::types::Span {
        self.0.framed_span(coord)
    }

    fn edited_within(&self, coord: &crate::slot::NodeCoordinate) -> bool {
        self.0.edited_within(coord)
    }

    fn renders_as_source(&self, _: &crate::slot::NodeCoordinate) -> bool {
        false
    }

    fn reads_templates(&self) -> bool {
        true
    }

    fn seat_through(&self, coord: &crate::slot::NodeCoordinate, wrappers: &[Option<crate::options::SeatPath>], seat: &dyn Fn(KindId) -> Option<crate::types::SiteId>) -> Option<crate::types::SiteId> {
        self.0.seat_through(coord, wrappers, seat)
    }

    fn row_coordinate(&self, tree: crate::types::TreeId, index: crate::types::NodeIndex) -> Option<crate::slot::NodeCoordinate> {
        self.0.row_coordinate(tree, index)
    }

    fn read_node(&self, tree: crate::types::TreeId, index: crate::types::NodeIndex, read: &mut dyn FnMut(&mut tree_sitter::TreeCursor<'_>, &mut crate::read::ReadCtx<'_>)) -> bool {
        self.0.read_node(tree, index, read)
    }

    #[cfg(feature = "arena")]
    fn render_record_entry(&self, record: crate::trivia::BuiltEntry, held: &dyn std::any::Any, options: &crate::options::ResolvedOptions, w: &mut dyn RenderSink) -> RenderResult {
        self.0.render_record_entry(record, held, options, w)
    }
}

/// The refusal of a record entry rendered where no arena is reachable.
#[cfg(feature = "arena")]
pub(crate) const NO_ARENA: crate::arena::ArenaError = crate::arena::ArenaError::Unwritable("a record entry renders only where the arena that wrote it is reachable");

/// Why a coordinate cannot be turned into bytes. Both arms carry the handle:
/// a coordinate is only meaningful beside the tree that minted it, and the
/// handle is the only thing that names that tree.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CoordinateError {
    /// The handle's tag names no tree in this language's table on this
    /// thread: never parsed here, or already released.
    UnknownTree {
        handle: crate::types::TreeHandle,
        tree_id: crate::types::TreeId,
    },
    BadSpan {
        handle: crate::types::TreeHandle,
        detail: String,
    },
    /// A write lies in the node's range, and reading the node to render it
    /// from its template failed.
    Unread {
        handle: crate::types::TreeHandle,
        detail: String,
    },
    /// A record's cell or word that no record writer writes, met by a
    /// record's prepare.
    #[cfg(feature = "arena")]
    Record(crate::arena::ArenaError),
}

#[cfg(feature = "arena")]
impl From<crate::arena::ArenaError> for CoordinateError {
    fn from(e: crate::arena::ArenaError) -> Self {
        Self::Record(e)
    }
}

impl fmt::Display for CoordinateError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnknownTree { handle, tree_id } => write!(
                f,
                "handle {handle} names tree {tree_id}, which is not live in this language's table (never parsed on this thread, or already released)"
            ),
            Self::BadSpan { handle, detail } => write!(f, "handle {handle}: {detail}"),
            Self::Unread { handle, detail } => write!(f, "handle {handle}: the node holds a write, and its read failed: {detail}"),
            #[cfg(feature = "arena")]
            Self::Record(e) => fmt::Display::fmt(e, f),
        }
    }
}

impl std::error::Error for CoordinateError {}

/// Why the node just written ends its line, ordered by how much the break
/// binds: a [`LineHold::Terminated`] break outlasts the end of the render.
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum LineHold {
    /// The kind's rule ends in the grammar's declared newline token, which
    /// its span leaves out (`options::KIND_LINE_BREAK_TERMINATED`).
    Break,
    /// The kind's text ends only at a line break
    /// (`options::KIND_LINE_TERMINATED`).
    Terminated,
}

/// Which sides of a write's tokens can join a neighbouring token into a
/// third one: `previous`, its first token with the token written before it;
/// `next`, its last token with the token written after it. A space goes in
/// between two writes only where the left one's `next`, the right one's
/// `previous` and the grammar's join table (`WordMatcher::is_join_pair`) all
/// hold.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct JoinArm {
    pub previous: bool,
    pub next: bool,
}

impl JoinArm {
    pub const NONE: Self = Self { previous: false, next: false };
    pub const PREVIOUS: Self = Self { previous: true, next: false };
    pub const NEXT: Self = Self { previous: false, next: true };
    pub const BOTH: Self = Self { previous: true, next: true };

    /// Both arms' sides together.
    #[must_use]
    pub const fn or(self, other: Self) -> Self {
        Self { previous: self.previous || other.previous, next: self.next || other.next }
    }
}

pub trait RenderSink {
    fn text(&mut self, s: &str) -> RenderResult;
    /// Arms the join test of the next write (`JoinArm`). Arms given before one
    /// write combine and that write takes them; an empty write leaves them for
    /// the one after it.
    fn join_arm(&mut self, arm: JoinArm);
    /// Text that keeps its source adjacency on both sides, an `ERROR`
    /// region's: `text` with the source's runs `before` and `after` it, each
    /// `Some` where the source spells that side in-line (empty where the
    /// text touches what is beside it) and `None` where a line break or the
    /// file's edge lies between. The runs are the gaps beside it. On a side
    /// spelled in-line, no seam below trivia strength is written, a line
    /// break included, and a whitespace entry at trivia strength (one stored
    /// or written on the side) replaces the run. On a side that breaks, a
    /// line break writes and a seam that stays on the line does not, unless
    /// a whitespace entry spells it. `at`, the bytes of its tree's source the
    /// text spans when read from a live tree, anchors it in a recording
    /// render as a slice is anchored. The text's last token counts as
    /// joining whatever is written after it (`JoinArm::next`).
    fn verbatim(&mut self, before: Option<&str>, text: &str, after: Option<&str>, at: Option<crate::types::Span>) -> RenderResult {
        let _ = at;
        let s = [before.unwrap_or_default(), text, after.unwrap_or_default()].concat();
        if !s.is_empty() {
            self.join_arm(JoinArm::NEXT);
        }
        self.text(&s)
    }
    /// The next text is a leaf whose pattern takes layout text only of the
    /// `LayoutKinds` bits in `leading` before it and `trailing` after it.
    /// The next text is a leaf of `kind`: its edge stamp, when it carries one
    /// (`ResolvedOptions::leaf_edges_of`), applies as `leaf_edges` does.
    fn leaf_kind(&mut self, kind: KindId) {
        let _ = kind;
    }
    /// A node of `kind` begins its body; `exit_kind` ends the one begun last.
    fn enter_kind(&mut self, kind: KindId) {
        let _ = kind;
    }
    fn exit_kind(&mut self) {}
    fn leaf_edges(&mut self, leading: crate::layout_kinds::LayoutKinds, trailing: crate::layout_kinds::LayoutKinds) {
        let _ = (leading, trailing);
    }
    fn site(&mut self, kind: KindId);
    /// A site's arm with the strength its table row gives it; `site` is the
    /// declared-strength form. The default keeps a sink that knows nothing of
    /// strength working as before.
    fn site_with(&mut self, kind: KindId, strength: crate::spacing::SeamStrength) {
        let _ = strength;
        self.site(kind);
    }
    /// A resolved seam: its arm at its strength.
    fn seam_arm(&mut self, seam: crate::slot::SeamArm) {
        self.site_with(seam.arm, seam.strength);
    }
    /// A spacing site's arm read from the resolved options this sink holds,
    /// with the site's default strength when the arm is its default. Unlike
    /// `site`, which writes a given arm, this names a site and looks it up.
    fn site_at(&mut self, site: crate::types::SiteId);
    /// A list's start or end flank site, looked up as `site_at` does. At one
    /// gap, a flank mark beats any other mark of equal strength; a sink that
    /// knows no strengths writes it as a plain site.
    fn flank_at(&mut self, site: crate::types::SiteId) {
        self.site_at(site);
    }
    /// One side of a kind's edge: the node's stamp when it carries one, else
    /// the kind's edge row (`ResolvedOptions::edge_arm`). A kind with no edge
    /// site on that side writes nothing.
    fn edge(&mut self, kind: KindId, side: crate::options::Side, stamped: Option<crate::options::EdgeArm>);
    /// One side of a node's stamped edge, written around the node itself when
    /// its kind has no edge site on that side, so that no stamp goes unwritten.
    /// A kind with an edge site writes its stamp through `edge`, from its
    /// template, and this writes nothing. Only a stamp carrying its strength
    /// is written: one set by a list gap's source class or a seat.
    fn unsited_edge(&mut self, _kind: KindId, _side: crate::options::Side, _stamped: Option<crate::options::EdgeArm>) {}
    /// A join of two fragments: the layout kinds valid at the gap. A single
    /// kind is a whitespace token and survives the end of a render; a set is
    /// dropped there.
    fn seam(&mut self, kinds: crate::layout_kinds::LayoutKinds);
    /// Whitespace a lexed token's own pattern spells, inside the token's
    /// span: a whitespace token's seam that the root's gap at a render's
    /// flank replaces only with a wider one. A sink that knows no root
    /// writes it as `seam`.
    fn lexeme_seam(&mut self, kinds: crate::layout_kinds::LayoutKinds) {
        self.seam(kinds);
    }
    /// A whitespace trivia entry: its kind replaces whatever seam the gap it
    /// sits in would otherwise get. A line continuation carries the source
    /// text it was read with. A sink that knows no strengths writes it as a
    /// whitespace token.
    /// A node begins, after its leading trivia, read from the source node
    /// `origin` names (none for a built node). The excess indentation its
    /// children's trivia opens (`layout_depth`) closes with it.
    fn open_frame(&mut self, origin: Option<&crate::slot::NodeCoordinate>) {
        let _ = origin;
    }
    /// The node `open_frame` began last ends, restoring the excess
    /// indentation it began with.
    fn close_frame(&mut self) {}
    /// Whether the open frame is `coord`'s node's: an alias envelope rebuilt
    /// around its read content names one parser node twice, and its sides
    /// frame the content once.
    fn in_frame_of(&self, coord: &crate::slot::NodeCoordinate) -> bool {
        let _ = coord;
        false
    }
    /// A depth member: the lines after it indent `delta` levels more (or
    /// fewer) than the template's depth, until another changes it or the
    /// open frame closes.
    fn layout_depth(&mut self, delta: i32) {
        let _ = delta;
    }
    fn trivia_seam(&mut self, gap: crate::layout_kinds::LayoutKinds, text: Option<&str>) {
        let _ = text;
        self.seam(gap);
    }
    /// A join between trivia entries, or between an entry and its owner: a
    /// seam at trivia strength, as `trivia_seam`'s, but no whitespace entry,
    /// so beside verbatim text it yields to the source's adjacency as a
    /// template's seam does (`verbatim`).
    fn trivia_join(&mut self, gap: crate::layout_kinds::LayoutKinds) {
        self.trivia_seam(gap, None);
    }
    /// Write the bytes a coordinate names, from the tree table this writer
    /// holds, and move the depth as the node's template would
    /// (`SourceTable::depth_move`). The slice's first token takes the arm
    /// set before it. Its last token counts as joining whatever is written
    /// after it (`JoinArm::next`) when its kind carries
    /// `KindFlags::JOINS_NEXT`, or when its kind is unknown. The default refuses: a sink with no source table cannot answer
    /// a coordinate, and answering it as empty would silently delete source.
    fn slice(&mut self, coord: &crate::slot::NodeCoordinate) -> RenderResult {
        Err(CoordinateError::UnknownTree {
            handle: coord.handle(),
            tree_id: coord.tree,
        }
        .into())
    }
    /// The kind of the node a coordinate names, from the tree table this
    /// writer holds; a sink with no table answers nothing.
    fn kind_of(&self, coord: &crate::slot::NodeCoordinate) -> Option<KindId> {
        let _ = coord;
        None
    }
    /// The frames a coordinate's bytes render between, from the tree table
    /// this writer holds (`SourceTable::frames`), each prepared as a slot's
    /// trivia is; a sink with no table answers none.
    fn frames(&self, coord: &crate::slot::NodeCoordinate) -> Result<crate::trivia::Frames, RenderError> {
        let _ = coord;
        Ok(crate::trivia::Frames::default())
    }
    /// Writes the built record `record`, which the store `held` answered, as
    /// a trivia entry here, through this sink's tree table
    /// (`SourceTable::render_record_entry`). Refuses a sink that holds no
    /// table or no options.
    ///
    /// # Errors
    ///
    /// `RenderError::Record` for a sink that cannot reach the record's
    /// arena, and what the table refuses.
    #[cfg(feature = "arena")]
    fn render_record_entry(&mut self, record: crate::trivia::BuiltEntry, held: &dyn std::any::Any) -> RenderResult {
        let _ = (record, held);
        Err(RenderError::Record(NO_ARENA))
    }
    /// A coordinate's text has just been written: hold the line end of each
    /// kind the text ends in, its own kind first.
    fn end_lines_after(&mut self, coord: &crate::slot::NodeCoordinate) {
        if let Some(kind) = self.kind_of(coord) {
            self.end_line_after(kind);
        }
    }
    /// Places, at one edge of a coordinate's bytes, what the templates of the
    /// nodes along that edge write between each node and its child there
    /// (`SourceTable::for_each_edge_level`, `options::BoundaryArm`): before
    /// its text outermost first, after it innermost first. An inner node's own
    /// edge seam is not placed: the source gap the node's own template would
    /// have stamped there is not known, so its default arm would only move
    /// the bytes off source. A mark whose arm moves the depth is not placed
    /// either: the move it pairs with lies inside the coordinate's bytes,
    /// which keep their own indentation. A sink with no tree table or options
    /// places nothing.
    fn boundary(&mut self, coord: &crate::slot::NodeCoordinate, side: crate::options::Side) {
        let _ = (coord, side);
    }
    /// Deepens the depth the next line is paid at. Depth is one fact per
    /// position: an indent arriving while the one before it has had no text
    /// written (a kind's template and a list's source flank both opening at
    /// one seam) merges into that depth instead of stacking, and the dedent
    /// that pairs with it unwinds the merge, not the depth.
    fn indent(&mut self);
    /// Shallows the depth and merges `seam` after it. A dedent that arrives
    /// while the indent before it has had no text written cancels that
    /// indent, its held payload, and this seam, so an empty body renders as
    /// its bare delimiters. An empty seam merges nothing. This is the only
    /// place the "may a break follow a dedent" question is answered — a
    /// caller never asks it.
    fn dedent(&mut self, seam: crate::layout_kinds::LayoutKinds);
    fn ends_line(&self) -> bool;
    /// Whether the seam held for the next write breaks the line.
    fn pending_break(&self) -> bool {
        false
    }
    /// Whether the output stands right after an indent that nothing has been
    /// written under yet: the start of a block body.
    fn at_body_start(&mut self) -> bool {
        false
    }
    /// The node just written ends its line, so a line break follows it: at
    /// least the one its lexical fact requires, or the wider one its after
    /// edge left pending. No later seam takes it away (a rank above it still
    /// widens it). A [`LineHold::Terminated`] break is written even at the
    /// end of the render, where any other held seam is dropped; a
    /// [`LineHold::Break`] lies outside the node's span and is not. An entry
    /// whose own text ends its line (a grammar may include the terminator in
    /// the span) already wrote that break, so one break comes off what its
    /// edge left.
    fn hold_line_end(&mut self, hold: LineHold) {
        let _ = hold;
    }
    /// Set aside the seam held for the next write, leaving none held: an
    /// owner's after edge while its own-line trailing entries render, since
    /// that seam belongs after them.
    fn take_seam(&mut self) -> Option<HeldSeam> {
        None
    }
    /// Merge a seam set aside by `take_seam` back in, under two seam laws.
    /// Where the output already stands at a line start (text whose span
    /// includes its terminator), one break of the seam is already written.
    /// Two line breaks merge by width whatever their strengths: the wider
    /// wins, and a break is never narrowed or added to. Anything else merges
    /// as any seam does, the stronger mark first.
    fn restore_seam(&mut self, seam: HeldSeam) {
        let _ = seam;
    }
    /// Whether `kind` carries `flag` (`options::KIND_ANON`, ...) in the kind
    /// flag table of the options this sink holds; a sink with none answers no.
    fn kind_has(&self, kind: KindId, flag: crate::options::KindFlags) -> bool {
        let _ = (kind, flag);
        false
    }
    /// Whether the text now being written belongs to a line-terminated kind,
    /// whose pattern can take the `\r` of a `\r\n` as its last character: a
    /// text ending in `\r` then drops it, and the break is written by whatever
    /// follows. Returns the setting it replaces, so a caller can restore it.
    fn swallow_cr(&mut self, on: bool) -> bool {
        let _ = on;
        false
    }
    /// A node of `kind` has just been written: hold the line end when the
    /// kind is line-terminated (`options::KIND_LINE_TERMINATED`) or ends in
    /// the declared newline token (`options::KIND_LINE_BREAK_TERMINATED`).
    /// Every node render reaches this once, whether a native node, a
    /// coordinate or detached trivia text.
    fn end_line_after(&mut self, kind: KindId) {
        if self.kind_has(kind, crate::options::KindFlags::LINE_TERMINATED) {
            self.hold_line_end(LineHold::Terminated);
        } else if self.kind_has(kind, crate::options::KindFlags::LINE_BREAK_TERMINATED) {
            self.hold_line_end(LineHold::Break);
        }
    }
    /// Render trailing trivia that shares its owner's row, held until the
    /// anonymous tokens after the owner are written: the sink seats it before
    /// the next owner, coordinate or line break, or at the end of the render.
    fn defer_trailing(
        &mut self,
        render: &mut dyn FnMut(&mut dyn RenderSink) -> RenderResult,
    ) -> RenderResult;
    /// Write any held trailing trivia now. An owner calls this before it
    /// renders, and before its own-line trailing entries.
    fn seat_trailing(&mut self) -> RenderResult;
}

/// A seam set aside from the sink: its text, the strength it holds, the
/// whitespace token that wrote it, if any, and whether a list flank wrote it.
#[derive(Debug, Clone)]
pub struct HeldSeam {
    pub kinds: crate::layout_kinds::LayoutKinds,
    pub pick: crate::layout_kinds::LayoutKinds,
    pub cont: String,
    pub strength: crate::spacing::SeamStrength,
    pub token: Option<crate::spacing::SeamToken>,
    pub flank: bool,
    pub root: bool,
}

pub trait Render {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult;
}

impl<T: Render + ?Sized> Render for &T {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        (**self).render(w)
    }
}

impl<T: Render + ?Sized> Render for Box<T> {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        (**self).render(w)
    }
}

impl Render for str {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        w.text(self)
    }
}

impl Render for String {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        w.text(self)
    }
}

/// A unit variant that a list seats: its fixed text between the edges a
/// list gap stamped on it (its seat, or the source class of the gap), so the
/// gap after it lands on its own `after` edge. A unit kind has no edge row,
/// so only a stamped arm writes (`unsited_edge`): a unit spaces against its
/// neighbours through their seams wherever no list gap reached it.
pub fn render_edged(kind: KindId, edges: &crate::options::Edges, w: &mut dyn RenderSink, render: fn(&mut dyn RenderSink) -> RenderResult) -> RenderResult {
    w.unsited_edge(kind, crate::options::Side::Before, edges.before);
    render(w)?;
    w.unsited_edge(kind, crate::options::Side::After, edges.after);
    Ok(())
}

/// One writer, one render, one `finish`: the shape every root render has.
pub fn render_to_string(
    value: &dyn Render,
    word: &WordMatcher,
    table: &WhitespaceTable,
    indent: &str,
) -> Result<String, RenderError> {
    let mut out = String::new();
    let mut w = SpacingWriter::new(&mut out, word)
        .with_table(table)
        .with_indent(indent);
    value.render(&mut w)?;
    w.finish()?;
    Ok(out)
}
