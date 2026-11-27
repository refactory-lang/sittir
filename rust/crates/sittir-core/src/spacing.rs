//! `SpacingWriter` — a `RenderSink` that inserts render-time word-boundary
//! spacing and resolves whitespace sites against a grammar's
//! `WhitespaceTable`.
//!
//! Insert a space at any write seam where a word-class character would
//! collide with a word-class character. If two word-class characters from
//! different tokens were ever legally adjacent in output, the lexer would
//! have merged them into one token — so the insert is the definition of
//! tokenization, not a heuristic. Style spaces stay in template literals;
//! this writer supplies only lexically-required spaces at dynamic seams.
//!
//! Every other whitespace decision — a site's arm, a fixed seam, a
//! whitespace token, depth — arrives as a `RenderSink` method call, never as
//! a character in the text stream: `site` resolves an id through the
//! attached `WhitespaceTable`, `seam`/`token_seam` hold a payload that
//! coalesces to the widest of what a run of calls asks for, and
//! `indent`/`dedent` move the depth the next line is paid at. Literal text
//! is never part of this coalescing, even when it is itself whitespace.
//!
//! Wrap the destination ONCE at the root render call. Wrapping per
//! nesting level instead monomorphizes recursive render paths into an
//! infinitely growing wrapper type (E0275) — don't.
use crate::layout_kinds::LayoutKinds;

mod depth;


/// Per-grammar word-character class. An ASCII table plus a fallback for
/// `char >= 0x80` (Unicode identifiers). A full regex engine is not needed
/// for a single-char class test.
pub struct WordMatcher {
    ascii: [bool; 128],
    unicode_fallback: fn(char) -> bool,
    /// Ordered character pairs at which two tokens of this grammar, written
    /// side by side, lex as a third token (rust's `('.', '=')`: `..` then
    /// `=>` lexes as `..=`). Codegen derives them from the grammar's parse
    /// table and keeps a pair only where a parse of the joined text does not
    /// rule it out. A writer spaces a pair only between two writes armed to
    /// join there (`JoinArm`).
    join_pairs: &'static [(u8, u8)],
}

impl WordMatcher {
    pub const fn new(ascii: [bool; 128], unicode_fallback: fn(char) -> bool) -> Self {
        Self {
            ascii,
            unicode_fallback,
            join_pairs: &[],
        }
    }

    #[must_use]
    pub const fn with_join_pairs(mut self, join_pairs: &'static [(u8, u8)]) -> Self {
        self.join_pairs = join_pairs;
        self
    }

    /// The default identifier class shared by the rust/typescript/python
    /// grammars: `[A-Za-z0-9_]` plus Unicode alphanumerics. Per-grammar
    /// tables derived from the Link-pinned `wordMatcher` can replace this
    /// via `WordMatcher::new` without touching call sites.
    #[must_use]
    pub fn default_ident() -> &'static WordMatcher {
        static DEFAULT: WordMatcher =
            WordMatcher::new(default_ascii_table(), char::is_alphanumeric);
        &DEFAULT
    }

    #[inline]
    #[must_use]
    pub fn is_word(&self, c: char) -> bool {
        if (c as u32) < 128 {
            self.ascii[c as usize]
        } else {
            (self.unicode_fallback)(c)
        }
    }

    #[inline]
    #[must_use]
    pub fn is_join_pair(&self, left: char, right: char) -> bool {
        if (left as u32) >= 128 || (right as u32) >= 128 {
            return false;
        }
        let (l, r) = (left as u8, right as u8);
        self.join_pairs.iter().any(|&(a, b)| a == l && b == r)
    }
}

const fn default_ascii_table() -> [bool; 128] {
    let mut t = [false; 128];
    let mut i = 0u8;
    while i < 128 {
        t[i as usize] = (i >= b'a' && i <= b'z')
            || (i >= b'A' && i <= b'Z')
            || (i >= b'0' && i <= b'9')
            || i == b'_';
        i += 1;
    }
    t
}

/// A seam mark's payload, ranked so two consecutive payloads coalesce to
/// the higher-ranked: a run of spaces, then no whitespace at all, then a
/// run by how many lines it breaks. Tight beats space (a declared "glue
/// here" is the specific intent; an undeclared space only says "no word
/// glued here"), and a line break beats both — whitespace that carries
/// line structure is never swallowed by a tight or space seam meeting it.
/// A blank line outranks a plain newline, and two blank lines outrank one,
/// so a separator asking for more survives meeting a kind edge that asks
/// for less. Depth marks (indent/dedent) rank above all of this and are
/// carried on `depth`/`indent_pending`, never through this scale.
pub type SeamRank = usize;

/// How firmly a mark holds its gap against the mark meeting it there. A
/// whitespace trivia entry beats everything: it replaces the gap's default,
/// save that a blank-line entry leaves a wider seam standing there, so the
/// gap takes the larger of the two.
/// A list slot's stored layout (`layout::SlotLayout`) beats every option
/// and yields only to a gap's own entry. A declared arm (a grammar row, or a
/// value set on the node) beats one the kind edge took from its edge token's
/// face (cascade), which beats the bare fallback; rank decides only between
/// marks of one strength. Depth marks stay above the whole scale.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Default)]
#[repr(u8)]
pub enum SeamStrength {
    #[default]
    Fallback = 0,
    Cascade = 1,
    Declared = 2,
    Slot = 3,
    Trivia = 4,
}

impl SeamStrength {
    /// The strength whose discriminant is `code`.
    #[must_use]
    pub const fn from_code(code: u8) -> Option<Self> {
        match code {
            0 => Some(Self::Fallback),
            1 => Some(Self::Cascade),
            2 => Some(Self::Declared),
            3 => Some(Self::Slot),
            4 => Some(Self::Trivia),
            _ => None,
        }
    }
}

/// The whitespace token that wrote a held seam. Either one survives the end
/// of a render.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SeamToken {
    /// A whitespace token (`RenderSink::seam` of one kind).
    Whitespace,
    /// Whitespace a lexed token's own pattern spells, inside the token's
    /// span (`RenderSink::lexeme_seam`). The root's gap at a render's flank
    /// replaces it only with a wider one.
    Lexeme,
}

/// The rank of a seam's text: empty 2, no break 1, otherwise 2 plus the number
/// of logical breaks (`\r\n` counts once).
#[must_use]
pub fn seam_rank(text: &str) -> SeamRank {
    match crate::line_endings::logical_breaks(text) {
        0 if text.is_empty() => 2,
        0 => 1,
        breaks => 2 + breaks,
    }
}

/// An open node of a render (`RenderSink::open_frame`): the source node it
/// was read from, by what names it across the render, when it was, and the excess
/// indentation it began with, which it restores when it closes.
#[derive(Debug)]
struct Frame {
    origin: Option<Result<crate::types::NodeId, crate::types::TreeHandle>>,
    excess: i32,
}

/// Streaming writer inserting lexically-required spaces at write seams.
/// See the module doc. Every whitespace decision reaches the writer as a
/// `RenderSink` call, never as a character in the text stream.
///
/// a seam following `"fn "` has `last = ' '` (not word-class) → no insert.
pub struct SpacingWriter<'a, W: std::fmt::Write + ?Sized> {
    inner: &'a mut W,
    last: Option<char>,
    word: &'a WordMatcher,
    table: Option<&'a crate::render::WhitespaceTable>,
    indent: &'a str,
    depth: depth::Depth,
    /// The levels the current output line's indentation was paid at: what a
    /// re-indented slice's continuation lines take.
    line_depth: usize,
    indent_pending: bool,
    seam: Option<SeamRank>,
    seam_strength: SeamStrength,
    seam_set: LayoutKinds,
    seam_pick: LayoutKinds,
    seam_token: Option<SeamToken>,
    seam_is_flank: bool,
    seam_is_root: bool,
    seam_template: bool,
    /// Whether the held seam is a join between trivia entries, or between
    /// an entry and its owner (`RenderSink::trivia_join`): it holds its gap
    /// at trivia strength, but verbatim text refuses it as it refuses a
    /// template's seam (`Glued::refuses`).
    seam_is_join: bool,
    leaf_leading: Option<LayoutKinds>,
    flushed_template: Option<LayoutKinds>,
    sources: Option<&'a dyn crate::render::SourceTable>,
    options: Option<&'a crate::options::ResolvedOptions>,
    deferring: Option<String>,
    swallow_cr: bool,
    deferred: Vec<DeferredRun>,
    line_end_held: Option<crate::render::LineHold>,
    leaf_trailing: Option<LayoutKinds>,
    leaf_lexed: bool,
    indent_lazy: bool,
    trailing_accepts: LayoutKinds,
    /// Whether the render is a document: its root is a node of the
    /// grammar's root kind (`with_document`).
    document: bool,
    /// The open nodes (`open_frame`).
    frames: Vec<Frame>,
    /// The levels the trivia's depth members add to the template's depth
    /// (`layout_depth`); negative where a line sits below it.
    excess: i32,
    /// Whether the last text was verbatim (`RenderSink::verbatim`), and how
    /// the source spells its after side: until the next text, the seams that
    /// side refuses write nothing (`Glued::refuses`).
    glued: Option<Glued>,
    /// While a trailing run defers (`defer_trailing`), whether its first text
    /// was verbatim; `None` until it writes any.
    glued_open: Option<bool>,
    /// Whether the next text meets the text before it as the source had
    /// them, with no word-collision space, because one of the two is
    /// verbatim; the next non-empty `write_text` takes it.
    tight: bool,
    /// The join arms given for the next write (`join_arm`), combined.
    join_pending: crate::render::JoinArm,
    /// The join arms of the write in progress, which `write_text` tests.
    join_at: crate::render::JoinArm,
    /// Whether the last token written joins what follows it
    /// (`JoinArm::next`).
    joins_next: bool,
    /// The in-line run after the last verbatim text, written ahead of the
    /// next text unless that text breaks the line. Its breaks are spelled
    /// `\n` as it enters, as every text the writer writes is.
    tail: Option<String>,
    /// While a trailing run defers, the length of the in-line run its
    /// opening verbatim text carries before it.
    open_before: usize,
    /// The edge chain of the coordinate whose boundary is being placed
    /// (`RenderSink::boundary`), kept to reuse its allocation.
    edge_levels: Vec<crate::render::EdgeLevel>,
    /// The indentation a line the writer breaks inside a hole takes: the
    /// source's, of the line the text after the hole sits on, moved as the
    /// node's lines are (`slice`), and the levels open when the hole's fill
    /// began, past which each level a template opens inside it indents.
    hole_indent: Option<(String, usize)>,
    /// The free-text leaves whose built text is checked (`with_leaf_probe`).
    probe: Option<LeafProbe<'a>>,
    /// The kind of the leaf whose text comes next, while a probe is attached.
    probe_kind: Option<crate::types::KindId>,
    /// The first probed leaf whose text held a refused character, or the
    /// first refused content arm.
    probe_hit: Option<ProbeHit<'a>>,
    /// Whether each kind entered while a probe is attached pauses it.
    probe_frames: Vec<bool>,
    /// How many entered kinds pause the probe.
    probe_paused: usize,
}

/// The content a render checks: the free-text leaves whose text, built or
/// read from source, may not hold `excluded`, and the content arms those
/// characters open, which the render refuses or, when admitted, leaves to
/// check themselves. The probe pauses inside a `nested` composite of its own
/// kind, whose content checks itself.
#[derive(Debug, Clone, Copy)]
pub struct LeafProbe<'a> {
    pub leaves: &'a [crate::delimiters::ContentKind],
    pub excluded: &'a [(u32, u32)],
    pub nested: crate::types::KindId,
    pub arms: &'a [crate::delimiters::ContentKind],
    pub refuses_arms: bool,
}

/// What a probe found: a leaf's text holding a refused character, or a
/// refused content arm.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProbeHit<'a> {
    Text(&'a crate::delimiters::ContentKind, char),
    Arm(&'a crate::delimiters::ContentKind),
}

enum ProbeStep<'a> {
    Pause,
    Hit(ProbeHit<'a>),
    Leaf(&'a crate::delimiters::ContentKind),
    Walk,
}

impl<'a> LeafProbe<'a> {
    fn refused_char(&self, text: &str) -> Option<char> {
        text.chars().find(|char| self.excluded.iter().any(|&(lo, hi)| (lo..=hi).contains(&u32::from(*char))))
    }

    fn step(&self, kind: crate::types::KindId) -> ProbeStep<'a> {
        if kind == self.nested {
            return ProbeStep::Pause;
        }
        if let Some(arm) = self.arms.iter().find(|arm| arm.kind == kind) {
            return if self.refuses_arms { ProbeStep::Hit(ProbeHit::Arm(arm)) } else { ProbeStep::Pause };
        }
        self.leaves.iter().find(|leaf| leaf.kind == kind).map_or(ProbeStep::Walk, ProbeStep::Leaf)
    }
}

/// A trailing run rendered ahead of where it is written: its text, and the
/// seam its last entry left (its after edge) with the strength that seam
/// holds and whether it is a line-terminated entry's break.
/// How the source spells a side of verbatim text (`RenderSink::verbatim`):
/// in-line, its run touching what is beside it or holding no line break,
/// or with a line break or the file's edge between.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
enum Glued {
    InLine,
    Breaking,
}

impl Glued {
    fn of(run: Option<&str>) -> Self {
        if run.is_some() {
            Self::InLine
        } else {
            Self::Breaking
        }
    }

    /// Whether a seam, breaking the line when `breaks`, is refused on this
    /// side: any but a whitespace entry's (`entry`), on a side spelled
    /// in-line, and one that keeps the line on a side that breaks.
    fn refuses(self, entry: bool, breaks: bool) -> bool {
        !entry && (self == Self::InLine || !breaks)
    }
}

/// What a held seam writes: the kinds valid at its gap and the one kind it
/// resolved to.
#[derive(Clone, Copy, Default)]
struct Payload {
    set: LayoutKinds,
    pick: LayoutKinds,
}

struct DeferredRun {
    text: String,
    end: Option<(SeamStrength, Payload)>,
    line_end: Option<crate::render::LineHold>,
    /// Whether the run opens with verbatim text, and how the verbatim text
    /// it ends with spells its after side (`RenderSink::verbatim`).
    glued: (bool, Option<Glued>),
    /// The length of the in-line run the run's opening verbatim text
    /// carries before it, dropped where the run lands at a line start.
    open_before: usize,
    /// The in-line run after the run's closing verbatim text.
    tail: Option<String>,
}

/// The writer's spacing state, set aside while a deferred run renders on its
/// own and put back after.
struct HeldContext {
    last: Option<char>,
    indent_pending: bool,
    indent_armed: bool,
    seam: Option<SeamRank>,
    seam_strength: SeamStrength,
    seam_set: LayoutKinds,
    seam_pick: LayoutKinds,
    seam_token: Option<SeamToken>,
    seam_is_flank: bool,
    seam_is_root: bool,
    seam_template: bool,
    seam_is_join: bool,
    line_end_held: Option<crate::render::LineHold>,
    tail: Option<String>,
}

/// The table a render that counts a hole's levels reads through
/// (`SpacingWriter::levels_toward`): `sources`' answers, except that a
/// write lies in a node exactly when it holds `node` (`edited_within`), so
/// the render writes each node holding `node` through its template and
/// every other as its source, reading no templates beyond those; and the
/// slice of `node`, or of a node holding it that renders as its source,
/// ends the render (`holes`), which it notes in `reached`.
struct MeasuringTable<'a> {
    sources: &'a dyn crate::render::SourceTable,
    node: crate::slot::NodeIdOrCoordinate<'a>,
    span: crate::types::Span,
    reached: std::cell::Cell<bool>,
}

impl MeasuringTable<'_> {
    fn is_node(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> bool {
        use crate::slot::NodeIdOrCoordinate::{Coordinate, NodeId};
        match (at, self.node) {
            (NodeId { id, .. }, NodeId { id: node, .. }) => id == node || self.sources.same_node(id, node),
            (Coordinate(at), Coordinate(node)) => at.tree == node.tree && at.index == node.index,
            _ => false,
        }
    }

    fn holds(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> bool {
        let same_source = match (self.sources.source_of(at), self.sources.source_of(self.node)) {
            (Some(one), Some(other)) => std::ptr::eq(one, other),
            _ => false,
        };
        same_source && !self.is_node(at) && at.span(self.sources).is_some_and(|span| span.start <= self.span.start && self.span.end <= span.end)
    }
}

impl crate::render::SourceTable for MeasuringTable<'_> {
    fn source_of(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<&str> {
        self.sources.source_of(at)
    }

    fn breaks_spelled_lf(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> bool {
        self.sources.breaks_spelled_lf(at)
    }

    fn kind_of(&self, coord: crate::slot::NodeIdOrCoordinate<'_>) -> Option<crate::types::KindId> {
        self.sources.kind_of(coord)
    }

    fn for_each_descendant(&self, coord: crate::slot::NodeIdOrCoordinate<'_>, visit: &mut dyn FnMut(crate::types::KindId, &str) -> bool) {
        self.sources.for_each_descendant(coord, visit);
    }

    fn line_starts_inside_tokens(&self, coord: crate::slot::NodeIdOrCoordinate<'_>) -> Vec<u32> {
        self.sources.line_starts_inside_tokens(coord)
    }

    fn list_delimiter(&self, at: crate::slot::NodeIdOrCoordinate<'_>, kind: crate::types::KindId) -> Option<crate::types::Delimiter> {
        self.sources.list_delimiter(at, kind)
    }

    fn for_each_edge_level(&self, coord: crate::slot::NodeIdOrCoordinate<'_>, side: crate::options::Side, f: &mut dyn FnMut(crate::render::EdgeLevel)) {
        self.sources.for_each_edge_level(coord, side, f);
    }

    fn spelled_end_kind(&self, coord: crate::slot::NodeIdOrCoordinate<'_>) -> Option<crate::types::KindId> {
        self.sources.spelled_end_kind(coord)
    }

    fn depth_move(&self, coord: crate::slot::NodeIdOrCoordinate<'_>) -> i32 {
        self.sources.depth_move(coord)
    }

    fn sides(&self, coord: crate::slot::NodeIdOrCoordinate<'_>) -> Option<Box<dyn crate::trivia::FramedTrivia>> {
        self.sources.sides(coord)
    }

    fn frames(&self, coord: crate::slot::NodeIdOrCoordinate<'_>) -> crate::trivia::Frames {
        self.sources.frames(coord)
    }

    fn holes(&self, coord: crate::slot::NodeIdOrCoordinate<'_>) -> Result<Vec<crate::trivia::Hole>, crate::render::RenderError> {
        if self.is_node(coord) || self.holds(coord) {
            self.reached.set(true);
            return Err(coord.unknown().into());
        }
        Ok(Vec::new())
    }

    fn slot_layouts(&self, coord: crate::slot::NodeIdOrCoordinate<'_>) -> Vec<crate::layout::SlotLayout> {
        self.sources.slot_layouts(coord)
    }

    fn framed_span(&self, coord: crate::slot::NodeIdOrCoordinate<'_>) -> Option<crate::types::Span> {
        self.sources.framed_span(coord)
    }

    fn edited_within(&self, coord: crate::slot::NodeIdOrCoordinate<'_>) -> bool {
        self.holds(coord)
    }

    fn renders_as_source(&self, coord: crate::slot::NodeIdOrCoordinate<'_>) -> bool {
        !self.holds(coord)
    }

    fn seat_through(&self, coord: crate::slot::NodeIdOrCoordinate<'_>, wrappers: &[Option<crate::options::SeatPath>], seat: &dyn Fn(crate::types::KindId) -> Option<crate::types::SiteId>) -> Option<crate::types::SiteId> {
        self.sources.seat_through(coord, wrappers, seat)
    }

    fn read_node(&self, coord: &crate::slot::NodeCoordinate, read: &mut dyn FnMut(&mut crate::tree_sitter::TreeCursor<'_>, &mut crate::read::ReadCtx<'_>)) -> bool {
        self.sources.read_node(coord, read)
    }

    fn span_of(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<crate::types::Span> {
        self.sources.span_of(at)
    }

    fn stamp_of(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<crate::types::KindId> {
        self.sources.stamp_of(at)
    }

    fn same_node(&self, one: crate::types::NodeId, other: crate::types::NodeId) -> bool {
        self.sources.same_node(one, other)
    }

    fn is_source_root(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> bool {
        self.sources.is_source_root(at)
    }

    #[cfg(feature = "arena")]
    fn render_record_entry(&self, record: crate::trivia::BuiltEntry, held: &dyn std::any::Any, options: &crate::options::ResolvedOptions, w: &mut dyn crate::render::RenderSink) -> crate::render::RenderResult {
        self.sources.render_record_entry(record, held, options, w)
    }

    fn render_through_template(&self, at: crate::slot::NodeIdOrCoordinate<'_>, options: &crate::options::ResolvedOptions, table: &dyn crate::render::SourceTable, w: &mut dyn crate::render::RenderSink) -> crate::render::RenderResult {
        self.sources.render_through_template(at, options, table, w)
    }
}

/// How a slice moves a node's lines (`SpacingWriter::shift_of`): a line
/// that starts with `base`, the source indentation of the node's first line,
/// takes `target` in its place.
struct Shift {
    base: String,
    target: String,
}

impl Shift {
    /// The bytes of `range` of a node over `span` of `source` with its lines
    /// moved: each line after the node's first that holds text, starts with
    /// `base` and does not start inside a token (`inside`, the source
    /// offsets of such lines) takes `target` for `base`. A line's text is
    /// judged whole, though `range` holds only part of it.
    fn moved(&self, source: &str, span: crate::types::Span, range: std::ops::Range<usize>, inside: &[u32]) -> String {
        let end = span.range().end;
        let mut out = String::with_capacity(range.len());
        let mut at = range.start;
        while at < range.end {
            let stop = source[at..range.end].find('\n').map_or(range.end, |found| at + found + 1);
            let starts_line = at > span.range().start && source.as_bytes()[at - 1] == b'\n';
            let line = &source[at..source[at..end].find('\n').map_or(end, |found| at + found)];
            let moved = starts_line && !line.trim().is_empty() && line.starts_with(&self.base) && inside.binary_search(&crate::types::narrow(at)).is_err();
            if moved && stop >= at + self.base.len() {
                out.push_str(&self.target);
                out.push_str(&source[at + self.base.len()..stop]);
            } else {
                out.push_str(&source[at..stop]);
            }
            at = stop;
        }
        out
    }

    /// The indentation of the source line that holds `at`, moved as a line
    /// starting with `base` is.
    fn line_indent(shift: Option<&Self>, source: &str, at: usize) -> String {
        let line_start = source[..at].rfind('\n').map_or(0, |found| found + 1);
        let line = &source[line_start..];
        let indent = &line[..line.len() - line.trim_start_matches([' ', '\t']).len()];
        match shift {
            Some(shift) if indent.starts_with(&shift.base) => [shift.target.as_str(), &indent[shift.base.len()..]].concat(),
            _ => indent.to_owned(),
        }
    }
}

impl<'a, W: std::fmt::Write + ?Sized> SpacingWriter<'a, W> {
    pub fn new(inner: &'a mut W, word: &'a WordMatcher) -> Self {
        Self {
            inner,
            last: None,
            word,
            table: None,
            indent: "",
            depth: depth::Depth::default(),
            line_depth: 0,
            indent_pending: false,
            seam: None,
            seam_strength: SeamStrength::Fallback,
            seam_set: LayoutKinds::NONE,
            seam_pick: LayoutKinds::NONE,
            seam_token: None,
            seam_is_flank: false,
            seam_is_root: false,
            seam_template: false,
            seam_is_join: false,
            leaf_leading: None,
            flushed_template: None,
            sources: None,
            options: None,
            deferring: None,
            swallow_cr: false,
            deferred: Vec::new(),
            line_end_held: None,
            leaf_trailing: None,
            leaf_lexed: false,
            indent_lazy: false,
            trailing_accepts: LayoutKinds::ALL,
            document: false,
            frames: Vec::new(),
            hole_indent: None,
            excess: 0,
            glued: None,
            glued_open: None,
            tight: false,
            join_pending: crate::render::JoinArm::NONE,
            join_at: crate::render::JoinArm::NONE,
            joins_next: false,
            tail: None,
            open_before: 0,
            edge_levels: Vec::new(),
            probe: None,
            probe_kind: None,
            probe_hit: None,
            probe_frames: Vec::new(),
            probe_paused: 0,
        }
    }

    /// Check the built text of the probe's leaves as it is written.
    #[must_use]
    pub fn with_leaf_probe(mut self, probe: LeafProbe<'a>) -> Self {
        self.probe = Some(probe);
        self
    }

    /// What the probe found first, if anything.
    #[must_use]
    pub fn leaf_probe_hit(&self) -> Option<ProbeHit<'a>> {
        self.probe_hit
    }

    fn probe_text(&mut self, text: &str) {
        let (Some(probe), Some(kind)) = (self.probe, self.probe_kind.take()) else { return };
        if self.probe_hit.is_some() || self.probe_paused > 0 {
            return;
        }
        self.probe_hit = match probe.step(kind) {
            ProbeStep::Hit(found) => Some(found),
            ProbeStep::Leaf(leaf) => probe.refused_char(text).map(|char| ProbeHit::Text(leaf, char)),
            ProbeStep::Pause | ProbeStep::Walk => None,
        };
    }

    fn probe_slice(&mut self, coord: crate::slot::NodeIdOrCoordinate<'_>) {
        let (Some(probe), Some(sources)) = (self.probe, self.sources) else { return };
        if self.probe_hit.is_some() || self.probe_paused > 0 {
            return;
        }
        let mut hit = None;
        sources.for_each_descendant(coord, &mut |kind, text| {
            if hit.is_some() {
                return false;
            }
            match probe.step(kind) {
                ProbeStep::Pause => false,
                ProbeStep::Hit(found) => {
                    hit = Some(found);
                    false
                }
                ProbeStep::Leaf(leaf) => {
                    hit = probe.refused_char(text).map(|char| ProbeHit::Text(leaf, char));
                    false
                }
                ProbeStep::Walk => true,
            }
        });
        self.probe_hit = hit;
    }

    /// Marks the render as a document, whose end no held line break
    /// outlasts (`finish`).
    #[must_use]
    pub fn with_document(mut self, document: bool) -> Self {
        self.document = document;
        self
    }

    /// The resolved options [`crate::render::RenderSink::site_at`] and
    /// [`crate::render::RenderSink::edge`] read. A render that writes option
    /// sites must attach them; a writer with none attached is a debug-mode
    /// bug, like a missing whitespace table.
    #[must_use]
    pub fn with_options(mut self, options: &'a crate::options::ResolvedOptions) -> Self {
        self.options = Some(options);
        self
    }

    /// The text written once per depth level after every newline. It holds
    /// no line break, so a line's indentation is that many copies of it and
    /// tallies as that many of its tally (`pay_indent`).
    #[must_use]
    pub fn with_indent(mut self, indent: &'a str) -> Self {
        debug_assert!(!indent.contains(['\n', '\r']), "an indentation unit holds no line break: {indent:?}");
        self.indent = indent;
        self
    }

    /// The grammar's whitespace vocabulary for [`crate::render::RenderSink::site`].
    /// A render that resolves sites must attach one; a writer with none
    /// attached is a debug-mode bug, not a supported no-table mode.
    /// The live trees this render may slice. A writer with none refuses every
    /// coordinate rather than writing nothing in its place.
    #[must_use]
    pub fn with_sources(mut self, sources: &'a dyn crate::render::SourceTable) -> Self {
        self.sources = Some(sources);
        self
    }

    #[must_use]
    pub fn with_table(mut self, table: &'a crate::render::WhitespaceTable) -> Self {
        self.table = Some(table);
        self
    }

    /// Indentation is deferred: a newline arms it, and the first text that is
    /// not itself a newline pays it at the depth current at that moment, so a
    /// dedent between the newline and a closing delimiter puts the delimiter
    /// at the outer depth and blank lines carry no trailing spaces. While a
    /// trailing run defers, the indentation is written into the run as text,
    /// which the writer writes later (`write_deferred`).
    fn pay_indent(&mut self, first: char) -> std::fmt::Result {
        if first == '\n' {
            return Ok(());
        }
        if !self.indent_pending {
            return Ok(());
        }
        self.indent_pending = false;
        self.line_depth = self.levels();
        let indent = self.indent_of(self.line_depth);
        self.emit(&indent)?;
        if let Some(last) = indent.chars().next_back() {
            self.last = Some(last);
        }
        Ok(())
    }

    /// The last character of the current line's indentation: its unit's,
    /// when the line indents.
    /// The indentation of a line `levels` deep: that many units, or inside
    /// a hole, the hole's indentation and a unit for each level opened since
    /// its fill began (`hole_indent`).
    fn indent_of(&self, levels: usize) -> String {
        match self.hole_indent.as_ref() {
            Some((base, from)) => [base.as_str(), &self.indent.repeat(levels.saturating_sub(*from))].concat(),
            None => self.indent.repeat(levels),
        }
    }

    /// The levels the next line indents: the template's depth and the
    /// trivia's excess, never below none.
    fn levels(&mut self) -> usize {
        self.depth.levels(self.sources).depth().saturating_add_signed(isize::try_from(self.excess).unwrap_or(0))
    }

    /// A slice's text moved to the column the writer puts it at: each
    /// continuation line that starts with the source indentation of the
    /// slice's first line has that prefix replaced by the indentation the
    /// writer gives the line the slice starts on, so the slice keeps its
    /// inner layout wherever it lands. Leading whitespace between tokens is
    /// layout, not content; a line that starts inside a token
    /// (`SourceTable::line_starts_inside_tokens`) keeps its bytes, as does a
    /// blank line.
    fn reindented<'t>(&mut self, coord: crate::slot::NodeIdOrCoordinate<'_>, text: &'t str, sources: &dyn crate::render::SourceTable) -> std::borrow::Cow<'t, str> {
        if !text.contains('\n') {
            return std::borrow::Cow::Borrowed(text);
        }
        let (Some(source), Some(span)) = (sources.source_of(coord), coord.span(sources)) else { return std::borrow::Cow::Borrowed(text) };
        let Some(shift) = self.shift_of(source, span) else { return std::borrow::Cow::Borrowed(text) };
        let inside = sources.line_starts_inside_tokens(coord);
        std::borrow::Cow::Owned(shift.moved(source, span, span.range(), &inside))
    }

    /// How `reindented` moves the lines of a node over `span` of `source`:
    /// from the source indentation of its first line to the indentation the
    /// writer gives the line it starts on; none where the two are the same.
    fn shift_of(&mut self, source: &str, span: crate::types::Span) -> Option<Shift> {
        let start = span.range().start;
        let line_start = source[..start].rfind('\n').map_or(0, |at| at + 1);
        let base = &source[line_start..start];
        let base = &base[..base.len() - base.trim_start_matches([' ', '\t']).len()];
        let levels = if self.indent_pending || (self.held_breaks() && !self.held_seam_dropped()) { self.levels() } else { self.line_depth };
        let target = self.indent_of(levels);
        (base != target).then(|| Shift { base: base.to_owned(), target })
    }

    /// A node's bytes with the holes `holes` lists filled: its source runs
    /// between them, moved as `reindented` moves a whole slice, and each
    /// hole's side written through this writer between them. The source's
    /// whitespace at the end of a run is the gap before its hole: it is
    /// written before the side's first text, no seam is written there
    /// unless a whitespace entry writes it (`Glued`), and a whitespace entry
    /// takes its place (`tail`). Before a trailing side, the line a line-terminated
    /// end of its node's bytes holds is kept. A line the writer breaks
    /// inside a hole takes the indentation of the line the hole's node
    /// starts on, moved as that line is.
    fn spliced(&mut self, coord: crate::slot::NodeIdOrCoordinate<'_>, holes: &[crate::trivia::Hole], sources: &dyn crate::render::SourceTable) -> crate::render::RenderResult {
        let source = sources.source_of(coord).ok_or_else(|| coord.unknown())?;
        let span = coord.span(sources).ok_or_else(|| coord.unknown())?;
        let shift = self.shift_of(source, span);
        let inside = sources.line_starts_inside_tokens(coord);
        let lf = sources.breaks_spelled_lf(coord);
        let swallowed = source.as_bytes().get(span.end as usize) == Some(&b'\n');
        let run = |range: std::ops::Range<usize>, last: bool| -> String {
            let moved = match &shift {
                Some(shift) => shift.moved(source, span, range, &inside),
                None => source[range].to_owned(),
            };
            let moved = if last && swallowed { crate::line_endings::without_swallowed_cr(&moved).to_owned() } else { moved };
            if lf { moved } else { crate::line_endings::to_internal(&moved).into_owned() }
        };
        let kind = crate::render::RenderSink::kind_of(self, coord);
        let mut at = span.range().start;
        for (index, hole) in holes.iter().enumerate() {
            let text = run(at..(hole.range.start as usize).max(at), false);
            let text = if index == 0 {
                self.open_leaf(kind, &text)?;
                text.as_str()
            } else {
                self.after_hole(&text)
            };
            let body = text.trim_end_matches([' ', '\t', '\n']);
            self.write_chunk(body)?;
            if let Some(kind) = hole.ends_in {
                crate::render::RenderSink::end_line_after(self, kind);
            }
            if body.len() < text.len() {
                let gap = &text[body.len()..];
                if body.is_empty() {
                    self.meet_text_break(gap);
                }
                self.tail = Some(gap.to_owned());
                self.glued = Some(Glued::InLine);
            }
            let levels = self.levels();
            let toward = match &hole.from {
                Some(from) => self.levels_toward(from, &hole.node)?,
                None => 0,
            };
            self.hole_indent = Some(([Shift::line_indent(shift.as_ref(), source, hole.line as usize), self.indent.repeat(toward)].concat(), levels));
            hole.fill(self)?;
            at = at.max(hole.range.end as usize);
        }
        let text = run(at..span.range().end, true);
        let last = self.after_hole(&text);
        let closed = self.close_leaf(kind, last);
        self.hole_indent = None;
        closed
    }

    /// The levels the templates from the node `from` names down to the node
    /// `node` names open: `from` written through its template by a writer
    /// of its own, under this writer's options, table and indentation unit,
    /// through a table that writes each node holding `node` through its
    /// template (`MeasuringTable`), and ended at the slice of `node`; none
    /// when that render never slices `node`.
    fn levels_toward(&self, from: &crate::slot::NodeIdOrOwnedCoordinate, node: &crate::slot::NodeIdOrOwnedCoordinate) -> Result<usize, crate::render::RenderError> {
        let (Some(sources), Some(options), Some(table)) = (self.sources, self.options, self.table) else { return Ok(0) };
        let at = node.at();
        let span = at.span(sources).ok_or_else(|| at.unknown())?;
        let measuring = MeasuringTable { sources, node: at, span, reached: std::cell::Cell::new(false) };
        let mut text = String::new();
        let mut w = SpacingWriter::new(&mut text, self.word).with_table(table).with_indent(self.indent).with_sources(&measuring).with_options(options);
        match crate::render::RenderSink::render_through_template(&mut w, from.at()) {
            Err(_) if measuring.reached.get() => Ok(w.levels()),
            Err(error) => Err(error),
            Ok(()) => Ok(0),
        }
    }

    /// Text that starts with a line break breaks the line itself: a held
    /// line-break seam no whitespace entry wrote yields to it, and so does
    /// the break a line-terminated text left.
    fn meet_text_break(&mut self, s: &str) {
        if s.starts_with('\n') && self.seam == Some(1) && self.seam_token.is_none() {
            self.clear_payload();
        }
        if s.starts_with('\n') && self.line_end_held == Some(crate::render::LineHold::Terminated) && self.held_breaks() {
            self.take_written_break();
            self.line_end_held = None;
        }
    }

    /// The run after a hole as it is written: the source's whitespace at
    /// its start spells the gap after the hole, so the seam its side left
    /// writes nothing, save that a whitespace entry's seam takes the place
    /// of the gap, and a line break its side left, or one its text ended
    /// in, the place of an in-line gap.
    fn after_hole<'t>(&mut self, text: &'t str) -> &'t str {
        let gap = text.len() - text.trim_start_matches([' ', '\t', '\n']).len();
        if gap == 0 {
            return text;
        }
        if (self.seam_token == Some(SeamToken::Whitespace) && !self.seam_is_join) || ((self.held_breaks() || self.at_line_start()) && !text[..gap].contains('\n')) {
            return &text[gap..];
        }
        self.clear_payload();
        text
    }

    /// The depth move a slice of `coord` makes after its text: held for a
    /// tree root's slice that wrote text, made now for any other.
    fn moved_depth(&mut self, coord: crate::slot::NodeIdOrCoordinate<'_>, sources: &dyn crate::render::SourceTable, wrote: bool) {
        if wrote && sources.is_source_root(coord) {
            self.depth.hold(coord, self.sources);
            return;
        }
        let moved = sources.depth_move(coord);
        for _ in 0..moved.unsigned_abs() {
            if moved > 0 {
                crate::render::RenderSink::indent(self);
            } else {
                crate::render::RenderSink::dedent(self, LayoutKinds::NONE);
            }
        }
    }

    fn at_line_start(&self) -> bool {
        matches!(self.last, None | Some('\n'))
    }

    /// Where written text goes: the output, or the buffer of a deferred run.
    fn emit(&mut self, s: &str) -> std::fmt::Result {
        match self.deferring.as_mut() {
            Some(buffer) => {
                buffer.push_str(s);
                Ok(())
            }
            None => self.inner.write_str(s),
        }
    }

    /// Whether writing `s` next would start a new line: it opens with a line
    /// break, or the held seam carries one.
    fn breaks_line(&self, s: &str) -> bool {
        s.starts_with('\n') || self.held_breaks()
    }

    fn hold_context(&mut self) -> HeldContext {
        HeldContext {
            last: self.last.take(),
            indent_pending: std::mem::replace(&mut self.indent_pending, false),
            indent_armed: self.depth.levels(self.sources).arm(false),
            seam: self.seam.take(),
            seam_strength: std::mem::replace(&mut self.seam_strength, SeamStrength::Fallback),
            seam_set: std::mem::take(&mut self.seam_set),
            seam_pick: std::mem::take(&mut self.seam_pick),
            seam_token: self.seam_token.take(),
            seam_is_flank: std::mem::replace(&mut self.seam_is_flank, false),
            seam_is_root: std::mem::replace(&mut self.seam_is_root, false),
            seam_template: std::mem::replace(&mut self.seam_template, false),
            seam_is_join: std::mem::replace(&mut self.seam_is_join, false),
            line_end_held: self.line_end_held.take(),
            tail: self.tail.take(),
        }
    }

    fn restore_context(&mut self, held: HeldContext) {
        self.last = held.last;
        self.indent_pending = held.indent_pending;
        self.depth.levels(self.sources).arm(held.indent_armed);
        self.seam = held.seam;
        self.seam_strength = held.seam_strength;
        self.seam_set = held.seam_set;
        self.seam_pick = held.seam_pick;
        self.seam_token = held.seam_token;
        self.seam_is_flank = held.seam_is_flank;
        self.seam_is_root = held.seam_is_root;
        self.seam_template = held.seam_template;
        self.seam_is_join = held.seam_is_join;
        self.line_end_held = held.line_end_held;
        self.tail = held.tail;
    }

    /// Writes the held trailing runs where the output stands, ahead of any
    /// held seam, each after a space. The seam the last run ended on (its
    /// entry's after edge) then meets the held seam under the seam law, as it
    /// would have had the run been written in place, unless `next` opens with
    /// a line break of its own; a run whose text ended its line already wrote
    /// one break of that seam. A line-terminated entry's break is held as
    /// such. At the render's end (`next` is `None`) nothing follows the
    /// seam, so only the held break remains. Text that ended in a
    /// line-terminated token holds a break no run may share: one break of the
    /// held seam is written first, and the runs start the next line.
    fn write_deferred(&mut self, next: Option<&str>) -> std::fmt::Result {
        if self.deferring.is_some() || self.deferred.is_empty() {
            return Ok(());
        }
        if self.line_end_held == Some(crate::render::LineHold::Terminated) && self.held_breaks() && !self.at_line_start() {
            let text = self.payload_text(Payload { set: LayoutKinds::NEWLINE, pick: LayoutKinds::NEWLINE });
            self.write_text(text)?;
            self.line_end_held = None;
            crate::render::RenderSink::hold_line_end(self, crate::render::LineHold::Break);
        }
        let mut last = None;
        for run in std::mem::take(&mut self.deferred) {
            let mut text = run.text.as_str();
            if run.glued.0 {
                self.tight = true;
                if self.at_line_start() {
                    text = &text[run.open_before..];
                }
            } else if self.tail.is_none() && !self.at_line_start() {
                self.write_text(self.payload_text(Payload { set: LayoutKinds::SPACE, pick: LayoutKinds::SPACE }))?;
            }
            self.write_text(text)?;
            self.tail.clone_from(&run.tail);
            last = Some(run);
        }
        if let Some(glued) = last.as_ref().and_then(|run| run.glued.1) {
            if glued.refuses(self.holds_entry(), self.held_breaks()) {
                self.clear_payload();
            }
            self.glued = Some(glued);
        }
        let Some(next) = next else {
            if let Some(hold) = last.and_then(|run| run.line_end) {
                crate::render::RenderSink::hold_line_end(self, hold);
            }
            return Ok(());
        };
        if let Some(DeferredRun { end: Some((strength, mut payload)), line_end, .. }) = last {
            if self.at_line_start() && payload.pick.breaks() {
                payload.pick = payload.pick.without_first_break();
                payload.set = payload.pick;
            }
            if !next.starts_with('\n') && payload.pick != LayoutKinds::NONE && payload.pick != LayoutKinds::TIGHT {
                self.merge_payload(payload, strength, false);
                if let Some(hold) = line_end {
                    crate::render::RenderSink::hold_line_end(self, hold);
                }
            }
        }
        Ok(())
    }

    /// One mark-free run of literal text. A statically spaced seam is not a
    /// seam: when either flank is whitespace there is nothing to decide.
    /// Otherwise a pending adjacency mark suppresses the check for this text
    /// only; `last` is always updated from the real text so the first
    /// NORMAL seam after an adjacent run sees the true preceding character.
    fn write_text(&mut self, s: &str) -> std::fmt::Result {
        let Some(first) = s.chars().next() else {
            return Ok(()); // empty write: context untouched (mark survives too)
        };
        let mut indented = false;
        if let Some(tail) = self.tail.take().filter(|_| !s.starts_with('\n')) {
            indented = self.indent_pending && tail.starts_with([' ', '\t']);
            self.emit(&tail)?;
            self.last = tail.chars().next_back();
        }
        let adjacent = std::mem::take(&mut self.tight) || !self.word_space_allowed();
        self.depth.disarm();
        if indented {
            self.indent_pending = false;
            self.line_depth = self.levels();
        } else {
            self.pay_indent(first)?;
        }
        if let Some(last) = self.last {
            if !adjacent && !last.is_whitespace() && !first.is_whitespace() {
                let word_seam = self.word.is_word(last) && self.word.is_word(first);
                let join_seam = self.joins_next && self.join_at.previous && self.word.is_join_pair(last, first);
                if word_seam || join_seam {
                    self.emit(" ")?;
                }
            }
        }
        self.emit(s)?;
        self.last = s.chars().next_back();
        if self.last.is_some_and(|c| !c.is_whitespace()) {
            self.joins_next = self.join_at.next;
        }
        if s.contains('\n') {
            self.line_depth = 0;
        }
        if self.last == Some('\n') {
            self.indent_pending = true;
        }
        Ok(())
    }

    /// Whether a collision of two words may be spelled with a space here: the
    /// leaf about to be written takes one before it, the leaf just written
    /// takes one after it, and a template join made
    /// at this gap did not ask for a tight one.
    fn word_space_allowed(&self) -> bool {
        self.leaf_leading.is_none_or(|leading| leading.has(LayoutKinds::SPACE))
            && self.trailing_accepts.has(LayoutKinds::SPACE)
            && self.flushed_template.is_none_or(|set| set.has(LayoutKinds::SPACE))
    }

    /// The text just written closes a leaf: layout after it must be a kind
    /// its trailing edge takes.
    fn end_leaf(&mut self) {
        let trailing = self.leaf_trailing.take().unwrap_or(LayoutKinds::ALL);
        self.leaf_lexed = false;
        self.trailing_accepts = trailing;
    }

    /// Writes a held seam's text as ordinary text and clears the held rank.
    /// A line break the text before it already ended with counts toward a
    /// breaking seam: the seam writes one fewer.
    fn flush_seam(&mut self) -> std::fmt::Result {
        let dropped = self.held_seam_dropped();
        let line_end = self.line_end_held.take();
        self.flushed_template = None;
        if self.seam.take().is_none() {
            return Ok(());
        }
        let token = self.seam_token.take().is_some();
        let root = std::mem::replace(&mut self.seam_is_root, false);
        let template = std::mem::replace(&mut self.seam_template, false);
        self.seam_is_flank = false;
        self.seam_is_join = false;
        let mut payload = self.take_payload();
        if dropped {
            return Ok(());
        }
        if !token && !root && line_end.is_none() {
            let kept = payload.set.and(self.trailing_accepts);
            if kept.is_empty() {
                return Ok(());
            }
            if !kept.has(payload.pick) {
                payload.pick = kept.narrowest();
            }
            payload.set = kept;
        }
        if self.last == Some('\n') && payload.pick.breaks() {
            payload.pick = payload.pick.without_first_break();
            payload.set = payload.pick;
            if payload.pick.is_empty() {
                return Ok(());
            }
        }
        if template {
            self.flushed_template = Some(payload.set);
        }
        let text = self.payload_text(payload);
        self.write_text(text)
    }

    /// Merges a mark's payload into the held one: a stronger mark replaces a
    /// weaker one whatever their widths; between marks of one strength a list
    /// flank beats any other mark, since it is written only inside a list
    /// that has members; otherwise the wider wins and a tie keeps the one
    /// already held. A held line end is a floor, not an override: a mark
    /// carrying a wider line break still widens it, whatever its strength,
    /// and the held strength stays; a mark without a line break never
    /// replaces it.
    fn merge_seam(&mut self, kinds: LayoutKinds) -> bool {
        self.merge_payload(Payload { set: kinds, pick: kinds.narrowest() }, SeamStrength::Declared, false)
    }

    fn merge_seam_with(&mut self, kinds: LayoutKinds, strength: SeamStrength) {
        self.merge_payload(Payload { set: kinds, pick: kinds.narrowest() }, strength, false);
    }

    /// The text a payload writes: the grammar's spelling of its picked kind,
    /// as the grammar admits it (`WhitespaceTable::text_of_gap`).
    fn payload_text(&self, payload: Payload) -> &'static str {
        match self.table {
            Some(table) => table.text_of_gap(payload.pick),
            None => payload.pick.default_text(),
        }
    }

    fn held_payload(&self) -> Payload {
        Payload { set: self.seam_set, pick: self.seam_pick }
    }

    fn take_payload(&mut self) -> Payload {
        Payload {
            set: std::mem::take(&mut self.seam_set),
            pick: std::mem::take(&mut self.seam_pick),
        }
    }

    fn set_payload(&mut self, payload: Payload) {
        self.seam = Some(Self::payload_rank(payload));
        self.seam_set = payload.set;
        self.seam_pick = payload.pick;
    }

    /// Drops the held seam and all it carries: its payload, its strength
    /// and its marks (token, flank, the root's edge, template, join).
    fn clear_payload(&mut self) {
        self.seam = None;
        self.take_payload();
        self.seam_strength = SeamStrength::Fallback;
        self.seam_token = None;
        self.seam_is_flank = false;
        self.seam_is_root = false;
        self.seam_template = false;
        self.seam_is_join = false;
    }

    /// Whether the held seam is a whitespace entry's: trivia strength, and
    /// no join (`seam_is_join`).
    fn holds_entry(&self) -> bool {
        self.seam.is_some() && self.seam_strength == SeamStrength::Trivia && !self.seam_is_join
    }

    fn payload_rank(payload: Payload) -> SeamRank {
        payload.pick.rank()
    }

    /// Whether the held seam breaks the line.
    /// One break of a held breaking seam is already written: the text
    /// before it ended its line, or the text after it opens with the break.
    fn take_written_break(&mut self) {
        if self.seam.is_some() && self.seam_pick.breaks() {
            let rest = self.seam_pick.without_first_break();
            if rest.is_empty() {
                self.clear_payload();
            } else {
                self.seam_pick = rest;
                self.seam_set = rest;
                self.seam = Some(rest.rank());
            }
        }
    }

    fn held_breaks(&self) -> bool {
        self.seam.is_some() && self.seam_pick.breaks()
    }

    /// Whether the held seam writes nothing when it flushes (`flush_seam`):
    /// one no token and no root edge holds, at the very start of output or,
    /// for a space, right after a line break the text before it wrote,
    /// where the line already starts bare. Only a seam's own payload is
    /// dropped, never text (`literal_whitespace_is_never_coalesced`).
    fn held_seam_dropped(&self) -> bool {
        self.seam.is_some_and(|rank| self.seam_token.is_none() && !self.seam_is_root && (self.last.is_none() || (rank == 1 && self.last == Some('\n'))))
    }

    /// A spacing site's arm read from the resolved options, written as a
    /// flank mark when `flank` is set.
    fn option_site(&mut self, site: crate::types::SiteId, flank: bool) {
        debug_assert!(self.options.is_some(), "a render that writes option sites must attach the resolved options");
        let Some(options) = self.options else {
            return;
        };
        let crate::slot::SeamArm { arm, strength, .. } = options.site_arm(site);
        self.site_mark(arm, strength, flank);
    }

    /// What comes before a source token's bytes `text`, of `kind`: any text
    /// held for a named one, and its leaf edges.
    fn open_leaf(&mut self, kind: Option<crate::types::KindId>, text: &str) -> crate::render::RenderResult {
        let token = kind.is_some_and(|kind| crate::render::RenderSink::kind_has(self, kind, crate::options::KindFlags::ANON));
        if !token {
            self.write_deferred(Some(text))?;
        }
        if let Some(kind) = kind {
            crate::render::RenderSink::leaf_kind(self, kind);
        }
        Ok(())
    }

    /// Writes a source token's bytes `text`, of `kind`: its last token joins
    /// what follows when its kind says so, or when its kind is unknown.
    fn close_leaf(&mut self, kind: Option<crate::types::KindId>, text: &str) -> crate::render::RenderResult {
        self.write_chunk(text)?;
        if !text.is_empty() {
            self.joins_next = match kind {
                Some(kind) if kind != crate::types::KindId::ERROR && self.options.is_some() => {
                    crate::render::RenderSink::kind_has(self, kind, crate::options::KindFlags::JOINS_NEXT)
                }
                _ => true,
            };
        }
        self.probe_kind = None;
        self.end_leaf();
        Ok(())
    }

    /// Holds the seam each token at a coordinate's end writes in place of
    /// text (`ResolvedOptions::token_seam`). The whitespace such a token
    /// stands for follows it, outside the coordinate's bytes, so its seam
    /// would otherwise be lost. It is held as the gap it stands for, not as
    /// a token's text: a render that ends there drops it, as it drops any
    /// gap. At the coordinate's start that whitespace is inside its bytes,
    /// and the slice writes it.
    fn token_seams(&mut self, options: &crate::options::ResolvedOptions, levels: &[crate::render::EdgeLevel]) {
        for level in levels {
            if let Some(seam) = [level.stamp, level.display, level.grammar].into_iter().find_map(|kind| options.token_seam(kind)) {
                self.merge_seam(seam);
            }
        }
    }

    /// Places what `outer`'s template writes on `side` between its edge and
    /// `inner`, its child at that edge: the arm for `inner` in the row of
    /// `outer`'s stamped kind, or of its grammar kind when the stamp's row
    /// places nothing on that side (`ResolvedOptions::boundary_marks`).
    fn boundary_marks(
        &mut self,
        options: &crate::options::ResolvedOptions,
        outer: crate::render::EdgeLevel,
        inner: crate::render::EdgeLevel,
        side: crate::options::Side,
    ) {
        let Some(arms) = [outer.stamp, outer.grammar].into_iter().find_map(|kind| options.boundary_arms(kind, side)) else {
            return;
        };
        for mark in crate::options::ResolvedOptions::boundary_marks(arms, inner.display, inner.field) {
            match *mark {
                crate::options::BoundaryMark::Site(site) if !self.moves_depth(options.site_arm(site).arm) => {
                    crate::render::RenderSink::site_at(self, site);
                }
                crate::options::BoundaryMark::Flank(site) if !self.moves_depth(options.site_arm(site).arm) => {
                    crate::render::RenderSink::flank_at(self, site);
                }
                crate::options::BoundaryMark::Seam(kinds) => crate::render::RenderSink::seam(self, kinds),
                crate::options::BoundaryMark::Site(_) | crate::options::BoundaryMark::Flank(_) => {}
            }
        }
    }

    /// Whether `arm` is a depth move. A boundary places none: the depth move
    /// it pairs with lies inside the coordinate's bytes, which keep their own
    /// indentation.
    fn moves_depth(&self, arm: crate::types::KindId) -> bool {
        self.table.is_some_and(|table| arm == table.indent || arm == table.dedent)
    }

    /// Writes a whitespace kind's arm: a depth move plus its line break for
    /// the depth arms, otherwise the arm's text as a seam of `strength`.
    fn site_mark(&mut self, kind: crate::types::KindId, strength: SeamStrength, flank: bool) {
        if kind == crate::types::KindId::BLANK {
            return;
        }
        debug_assert!(
            self.table.is_some(),
            "a render that resolves sites must attach a whitespace table"
        );
        let Some(table) = self.table else {
            return;
        };
        let Some(gap) = table.gap_of(kind).or_else(|| (kind == table.indent || kind == table.dedent).then_some(LayoutKinds::NEWLINE)) else {
            return;
        };
        if kind == table.dedent {
            crate::render::RenderSink::dedent(self, gap);
            return;
        }
        if kind == table.indent {
            crate::render::RenderSink::indent(self);
        }
        self.merge_payload(Payload { set: gap, pick: gap }, strength, flank);
    }

    /// The grammar root's edge: the render's own flank at its start or its
    /// end, which decides its gap outright instead of merging with the node
    /// edges it meets there, and which a later mark never replaces. Only the
    /// render's outermost node takes it (`edge`, at most one frame open): a
    /// node of the root kind nested inside another, such as a regex group's
    /// pattern, meets its neighbours as any edge does. A seam a
    /// lexed token's own pattern spells (`SeamToken::Lexeme`) floors it, a
    /// document's end included: that whitespace lies inside the token's span,
    /// so no gap after the token stands for it. So does a line-terminated
    /// entry's break, since without that break what follows would read as
    /// the entry's text, but not at a document's end (its `After` edge),
    /// where nothing follows; a break the line already ended satisfies one
    /// line break of the edge. A line continuation held at that gap already
    /// ends the line, so it stands.
    fn root_edge(&mut self, side: crate::options::Side, arm: crate::types::KindId, strength: SeamStrength) {
        let Some(table) = self.table else {
            return;
        };
        let Some(mut gap) = table.gap_of(arm) else {
            return;
        };
        if self.last == Some('\n') && gap.breaks() {
            gap = gap.without_first_break();
        }
        let end = self.document && side == crate::options::Side::After;
        let floor = self.seam_token == Some(SeamToken::Lexeme) || (!end && self.line_end_held == Some(crate::render::LineHold::Terminated) && self.held_breaks());        if !(floor && self.seam.is_some_and(|held| held >= gap.rank())) {
            self.set_payload(Payload { set: gap, pick: gap });
            self.seam_strength = strength;
            self.seam_is_flank = false;
            self.seam_token = None;
            self.seam_template = false;
            self.seam_is_join = false;
        }
        self.seam_is_root = true;
    }

    fn merge_payload(&mut self, payload: Payload, strength: SeamStrength, flank: bool) -> bool {
        if self.seam_is_root {
            return false;
        }
        let rank = Self::payload_rank(payload);
        let breaks = payload.pick.breaks();
        if self.glued.is_some_and(|glued| glued.refuses(strength == SeamStrength::Trivia, breaks)) {
            return false;
        }
        if let Some(current) = self.seam {
            let keeps = match strength.cmp(&self.seam_strength) {
                std::cmp::Ordering::Less => true,
                std::cmp::Ordering::Greater => false,
                std::cmp::Ordering::Equal if flank != self.seam_is_flank => self.seam_is_flank,
                std::cmp::Ordering::Equal => current >= rank,
            };
            let widens_held_break = self.line_end_held.is_some() && breaks && rank > current;
            let drops_held_break = self.line_end_held.is_some() && !breaks && self.held_breaks();
            if (keeps && !widens_held_break) || drops_held_break {
                return false;
            }
        }
        let strength = if self.line_end_held.is_some() { strength.max(self.seam_strength) } else { strength };
        if self.glued.is_some() {
            self.tail = None;
        }
        self.set_payload(payload);
        self.seam_strength = strength;
        self.seam_is_flank = flank;
        self.seam_template = false;
        self.seam_is_join = false;
        true
    }

    /// One mark-free run of text from the caller: flushes any held seam
    /// payload first, then writes the text itself.
    fn write_chunk(&mut self, s: &str) -> std::fmt::Result {
        if s.is_empty() {
            return Ok(());
        }
        let join = std::mem::take(&mut self.join_pending);
        self.tight |= self.glued.take().is_some();
        if self.deferring.is_some() {
            self.glued_open.get_or_insert(false);
        }
        if self.breaks_line(s) {
            self.write_deferred(Some(s))?;
        }
        self.meet_text_break(s);
        let seam_held = self.seam.is_some() && self.seam_pick != LayoutKinds::TIGHT;
        self.flush_seam()?;
        if std::mem::take(&mut self.indent_lazy) && seam_held {
            self.indent_pending = true;
        }
        let armed_before = self.indent_pending;
        self.join_at = join;
        let result = self.write_text(s);
        self.join_at = crate::render::JoinArm::NONE;
        if self.leaf_lexed {
            self.indent_lazy = self.indent_pending && s.ends_with('\n');
            self.indent_pending = armed_before && s.starts_with('\n');
        }
        self.leaf_leading = None;
        self.flushed_template = None;
        result
    }

    /// Ends the render: a seam payload still held has nothing after it, so
    /// it is dropped, as a payload held before the first text is. A seam
    /// lies between two things; a node rendered on its own carries no edge
    /// whitespace. The grammar root is the exception: its edges are the
    /// render's own flanks, so a seam its after edge marked is written here,
    /// as its before edge is written at the start. A payload a whitespace
    /// token contributed is written out too: the token is part of the node.
    /// So is the break a line-terminated trivia entry left, except at a
    /// document's end: the break holds for the text after the entry, and a
    /// fragment's output may be followed by more, while a document's is not.
    /// The root render calls this once, after the last `write_str`.
    pub fn finish(&mut self) -> std::fmt::Result {
        self.write_deferred(None)?;
        let held_terminated = self.line_end_held == Some(crate::render::LineHold::Terminated) && self.held_breaks();
        if self.seam_token.is_some() || self.seam_is_root || (held_terminated && !self.document) {
            self.flush_seam()?;
        }
        self.clear_payload();
        self.tail = None;
        debug_assert_eq!(self.depth.at_end().depth(), 0, "a render must dedent every indent it opens");
        Ok(())
    }
}

impl<W: std::fmt::Write + ?Sized> crate::render::RenderSink for SpacingWriter<'_, W> {
    fn join_arm(&mut self, arm: crate::render::JoinArm) {
        self.join_pending = self.join_pending.or(arm);
    }

    fn text(&mut self, s: &str) -> crate::render::RenderResult {
        self.probe_text(s);
        let s = crate::line_endings::to_internal(if self.swallow_cr { crate::line_endings::without_swallowed_cr(s) } else { s });
        let s = s.as_ref();
        self.write_chunk(s)?;
        if !s.is_empty() {
            self.end_leaf();
        }
        Ok(())
    }

    fn swallow_cr(&mut self, on: bool) -> bool {
        std::mem::replace(&mut self.swallow_cr, on)
    }

    fn verbatim(&mut self, before: Option<&str>, text: &str, after: Option<&str>) -> crate::render::RenderResult {
        self.probe_kind = None;
        let lands = self.seam.is_some() && (self.line_end_held.is_some() || !Glued::of(before).refuses(self.holds_entry(), self.held_breaks()));
        if !lands {
            self.clear_payload();
        }
        let opens_run = self.deferring.is_some() && self.glued_open.is_none();
        let before = if !opens_run && (lands || self.at_line_start()) { "" } else { before.unwrap_or_default() };
        let s = [before, text].concat();
        if !s.is_empty() {
            self.tight = true;
            if opens_run {
                self.glued_open = Some(true);
                self.open_before = before.len();
            }
        }
        crate::render::RenderSink::text(self, &s)?;
        if !s.is_empty() {
            self.joins_next = true;
        }
        self.glued = (!s.is_empty()).then_some(Glued::of(after));
        self.tail = after.filter(|run| !run.is_empty()).map(|run| crate::line_endings::to_internal(run).into_owned());
        Ok(())
    }

    fn enter_kind(&mut self, kind: crate::types::KindId) {
        let Some(probe) = self.probe else { return };
        let step = if self.probe_paused == 0 { probe.step(kind) } else { ProbeStep::Pause };
        let pauses = matches!(step, ProbeStep::Pause);
        if let ProbeStep::Hit(found) = step {
            self.probe_hit = self.probe_hit.or(Some(found));
        }
        self.probe_frames.push(pauses);
        if pauses {
            self.probe_paused += 1;
        }
    }

    fn exit_kind(&mut self) {
        if self.probe_frames.pop() == Some(true) {
            self.probe_paused -= 1;
        }
    }

    fn leaf_kind(&mut self, kind: crate::types::KindId) {
        if self.probe.is_some() {
            self.probe_kind = Some(kind);
        }
        if let Some((leading, trailing)) = self.table.and_then(|table| table.leaf_edges_of(kind)) {
            self.leaf_edges(leading, trailing);
        }
    }

    /// The next text is a leaf whose pattern takes layout of the kinds in
    /// `leading` before it and `trailing` after it. The held seam keeps only
    /// the kinds the leading edge takes; none left, it writes nothing. A seam
    /// a whitespace token wrote is required text and stays.
    fn leaf_edges(&mut self, leading: LayoutKinds, trailing: LayoutKinds) {
        self.leaf_leading = Some(leading);
        if self.seam_token.is_none() && !self.seam_is_root && self.seam.is_some() {
            let kept = self.seam_set.and(leading);
            if kept.is_empty() {
                self.clear_payload();
            } else if !kept.has(self.seam_pick) {
                self.seam_set = kept;
                self.seam_pick = kept.narrowest();
                self.seam = Some(self.seam_pick.rank());
            } else {
                self.seam_set = kept;
            }
        }
        self.leaf_trailing = Some(trailing);
        self.leaf_lexed = leading.0 & !LayoutKinds::TIGHT.0 == 0;
    }

    /// A site's arm: 0 is no arm — nothing is written and nothing changes —
    /// a depth move plus its line break for the depth arms, otherwise the
    /// arm's text as a seam. A writer with no table attached treats every
    /// other kind as unknown and writes nothing.
    fn site(&mut self, kind: crate::types::KindId) {
        self.site_with(kind, SeamStrength::Declared);
    }

    fn site_at(&mut self, site: crate::types::SiteId) {
        self.option_site(site, false);
    }

    fn edge(&mut self, kind: crate::types::KindId, side: crate::options::Side, stamped: Option<crate::options::EdgeArm>) {
        debug_assert!(self.options.is_some(), "a render that writes kind edges must attach the resolved options");
        let Some(options) = self.options else {
            return;
        };
        let Some(seam) = options.edge_arm(kind, side, stamped, None) else {
            return;
        };        if options.kind_has(kind, crate::options::KindFlags::ROOT) && self.frames.len() <= 1 {
            self.root_edge(side, seam.arm, seam.strength);
        } else {
            self.seam_arm(seam);
        }
    }

    fn site_with(&mut self, kind: crate::types::KindId, strength: SeamStrength) {
        self.site_mark(kind, strength, false);
    }

    fn unsited_edge(&mut self, kind: crate::types::KindId, side: crate::options::Side, stamped: Option<crate::options::EdgeArm>) {
        let Some(crate::options::EdgeArm { arm, strength: Some(strength) }) = stamped else {
            return;
        };
        if self.options.is_some_and(|options| options.edge_arm(kind, side, None, None).is_some()) {
            return;
        }
        self.seam_arm(crate::slot::SeamArm { arm, strength });
    }

    fn flank_at(&mut self, site: crate::types::SiteId) {
        self.option_site(site, true);
    }

    fn seam(&mut self, kinds: LayoutKinds) {
        let replaced = self.merge_seam(kinds);
        if replaced {
            self.seam_template = true;
        }
        if kinds.is_single() && kinds != LayoutKinds::TIGHT && self.seam.is_some() {
            self.seam_token.get_or_insert(SeamToken::Whitespace);
        }
    }

    fn lexeme_seam(&mut self, kinds: LayoutKinds) {
        crate::render::RenderSink::seam(self, kinds);
        if self.seam_token.is_some() {
            self.seam_token = Some(SeamToken::Lexeme);
        }
    }

    fn trivia_seam(&mut self, gap: LayoutKinds) {
        if gap.rank() >= LayoutKinds::BLANKLINE.rank() && self.seam.is_some_and(|current| current > gap.rank()) {
            return;
        }
        self.merge_payload(Payload { set: gap, pick: gap }, SeamStrength::Trivia, false);
        self.seam_token = self.seam.is_some().then_some(SeamToken::Whitespace);
    }

    fn trivia_join(&mut self, gap: LayoutKinds) {
        if self.glued.is_some_and(|glued| glued.refuses(false, gap.breaks())) {
            return;
        }
        let payload = Payload { set: gap, pick: gap };
        if self.merge_payload(payload, SeamStrength::Trivia, false) {
            self.seam_is_join = true;
        }
        self.seam_token = self.seam.is_some().then_some(SeamToken::Whitespace);
    }

    fn kind_of(&self, coord: crate::slot::NodeIdOrCoordinate<'_>) -> Option<crate::types::KindId> {
        match self.sources {
            Some(sources) => coord.kind_in(sources),
            None => match coord {
                crate::slot::NodeIdOrCoordinate::Coordinate(coord) => coord.kind,
                crate::slot::NodeIdOrCoordinate::NodeId { .. } => None,
            },
        }
    }

    fn stamp_of(&self, coord: crate::slot::NodeIdOrCoordinate<'_>) -> Option<crate::types::KindId> {
        match (coord, self.sources) {
            (crate::slot::NodeIdOrCoordinate::Coordinate(coord), _) => coord.kind,
            (at, Some(sources)) => sources.stamp_of(at),
            (_, None) => None,
        }
    }

    fn frames(&self, coord: crate::slot::NodeIdOrCoordinate<'_>) -> Result<crate::trivia::Frames, crate::render::RenderError> {
        let Some(sources) = self.sources else { return Ok(crate::trivia::Frames::default()) };
        let mut frames = sources.frames(coord);
        if let Some(options) = self.options {
            let ctx = crate::prepare::RenderContext { options, sources };
            for frame in frames.iter_mut() {
                frame.prepare(&ctx)?;
            }
        }
        Ok(frames)
    }

    fn holes(&self, coord: crate::slot::NodeIdOrCoordinate<'_>) -> Result<Vec<crate::trivia::Hole>, crate::render::RenderError> {
        let Some(sources) = self.sources else { return Ok(Vec::new()) };
        let mut holes = sources.holes(coord)?;
        if let Some(options) = self.options {
            let ctx = crate::prepare::RenderContext { options, sources };
            for hole in &mut holes {
                hole.fill.prepare(&ctx)?;
            }
        }
        Ok(holes)
    }

    #[cfg(feature = "arena")]
    fn render_record_entry(&mut self, record: crate::trivia::BuiltEntry, held: &dyn std::any::Any) -> crate::render::RenderResult {
        let unreachable = || crate::render::RenderError::Record(crate::render::NO_ARENA);
        let (sources, options) = (self.sources.ok_or_else(unreachable)?, self.options.ok_or_else(unreachable)?);
        sources.render_record_entry(record, held, options, self)
    }

    fn render_through_template(&mut self, at: crate::slot::NodeIdOrCoordinate<'_>) -> crate::render::RenderResult {
        let (Some(sources), Some(options)) = (self.sources, self.options) else { return Err(at.unknown().into()) };
        sources.render_through_template(at, options, sources, self)
    }

    fn end_lines_after(&mut self, coord: crate::slot::NodeIdOrCoordinate<'_>) {
        let sources = self.sources;
        let stamp = crate::render::RenderSink::stamp_of(self, coord);
        let mut first = true;
        if let Some(sources) = sources {
            sources.for_each_edge_level(coord, crate::options::Side::After, &mut |level| {
                let kind = match (first, stamp) {
                    (true, Some(stamp)) => stamp,
                    _ => level.grammar,
                };
                first = false;
                crate::render::RenderSink::end_line_after(self, kind);
            });
            if let Some(kind) = sources.spelled_end_kind(coord) {
                crate::render::RenderSink::end_line_after(self, kind);
            }
        }
        if first {
            if let Some(stamp) = stamp {
                crate::render::RenderSink::end_line_after(self, stamp);
            }
        }
    }

    fn boundary(&mut self, coord: crate::slot::NodeIdOrCoordinate<'_>, side: crate::options::Side) {
        let (Some(sources), Some(options)) = (self.sources, self.options) else {
            return;
        };
        let mut levels = std::mem::take(&mut self.edge_levels);
        levels.clear();
        sources.for_each_edge_level(coord, side, &mut |level| levels.push(level));
        match side {
            crate::options::Side::Before => {
                for pair in levels.windows(2) {
                    self.boundary_marks(options, pair[0], pair[1], side);
                }
            }
            crate::options::Side::After => {
                self.token_seams(options, &levels);
                for pair in levels.windows(2).rev() {
                    self.boundary_marks(options, pair[0], pair[1], side);
                }
            }
        }
        self.edge_levels = levels;
    }

    fn slice(&mut self, coord: crate::slot::NodeIdOrCoordinate<'_>) -> crate::render::RenderResult {
        let sources = self.sources.ok_or_else(|| coord.unknown())?;
        let holes = crate::render::RenderSink::holes(self, coord)?;
        if !holes.is_empty() {
            self.spliced(coord, &holes, sources)?;
            self.moved_depth(coord, sources, true);
            return Ok(());
        }
        let raw = coord.resolve(sources)?;
        let end = coord.span(sources).ok_or_else(|| coord.unknown())?.end;
        let swallowed = sources.source_of(coord).is_some_and(|source| source.as_bytes().get(end as usize) == Some(&b'\n'));
        let raw = if swallowed { crate::line_endings::without_swallowed_cr(raw) } else { raw };
        let reindented = self.reindented(coord, raw, sources);
        let respelled;
        let text: &str = if sources.breaks_spelled_lf(coord) {
            &reindented
        } else {
            respelled = crate::line_endings::to_internal(&reindented);
            &respelled
        };
        let kind = crate::render::RenderSink::kind_of(self, coord);
        self.open_leaf(kind, text)?;
        self.probe_slice(coord);
        self.close_leaf(kind, text)?;
        self.moved_depth(coord, sources, !text.is_empty());
        Ok(())
    }


    fn unit_text(&mut self, kind: crate::types::KindId, text: &str) -> crate::render::RenderResult {
        self.open_leaf(Some(kind), text)?;
        self.close_leaf(Some(kind), text)
    }

    fn unit_seam(&mut self, kind: crate::types::KindId) {
        if let Some(seam) = self.options.and_then(|options| options.token_seam(kind)) {
            self.merge_seam(seam);
        }
    }

    fn open_frame(&mut self, origin: Option<crate::slot::NodeIdOrCoordinate<'_>>) {
        self.frames.push(Frame { origin: origin.map(crate::slot::NodeIdOrCoordinate::key), excess: self.excess });
    }

    fn close_frame(&mut self) {
        if let Some(frame) = self.frames.pop() {
            self.excess = frame.excess;
        }
    }

    fn in_frame_of(&self, coord: crate::slot::NodeIdOrCoordinate<'_>) -> bool {
        self.frames.last().and_then(|frame| frame.origin).is_some_and(|origin| match (origin, coord.key()) {
            (Ok(one), Ok(other)) => self.sources.map_or(one == other, |sources| sources.same_node(one, other)),
            (Err(one), Err(other)) => one == other,
            _ => false,
        })
    }

    fn layout_depth(&mut self, delta: i32) {
        self.excess += delta;
    }

    fn indent(&mut self) {
        self.depth.levels(self.sources).open();
    }

    fn dedent(&mut self, seam: LayoutKinds) {
        let levels = self.depth.levels(self.sources);
        if let depth::Closed::Level { armed } = levels.close() {
            let holds_trivia = self.seam.is_some() && self.seam_strength == SeamStrength::Trivia;
            if armed && !holds_trivia {
                self.clear_payload();
                return;
            }
        } else if levels.armed() {
            return;
        }
        if !seam.is_empty() {
            self.merge_seam(seam);
        }
    }

    fn ends_line(&self) -> bool {
        self.at_line_start()
    }

    fn pending_break(&self) -> bool {
        self.held_breaks()
    }

    fn at_body_start(&mut self) -> bool {
        self.depth.levels(self.sources).armed()
    }

    fn kind_has(&self, kind: crate::types::KindId, flag: crate::options::KindFlags) -> bool {
        self.options.is_some_and(|options| options.kind_has(kind, flag))
    }

    fn hold_line_end(&mut self, hold: crate::render::LineHold) {
        if self.at_line_start() {
            self.take_written_break();
            return;
        }
        if !self.held_breaks() {
            self.merge_seam_with(LayoutKinds::NEWLINE, SeamStrength::Trivia);
        }
        self.line_end_held = self.line_end_held.max(Some(hold));
    }

    fn drop_held_breaks(&mut self) {
        if !self.held_breaks() || self.line_end_held.is_some() || self.seam_is_flank || self.at_line_start() || self.at_body_start() {
            return;
        }
        let set = self.seam_set.without_breaks();
        let set = if set.is_empty() { LayoutKinds::TIGHT } else { set };
        self.set_payload(Payload { set, pick: set.narrowest() });
    }

    fn take_blank_seam(&mut self) -> Option<crate::render::HeldSeam> {
        let blank = self.seam.is_some() && self.seam_strength == SeamStrength::Trivia && self.seam_pick.rank() >= LayoutKinds::BLANKLINE.rank();
        if blank { crate::render::RenderSink::take_seam(self) } else { None }
    }
    fn take_seam(&mut self) -> Option<crate::render::HeldSeam> {
        self.seam.take()?;
        let payload = self.take_payload();
        Some(crate::render::HeldSeam {
            kinds: payload.set,
            pick: payload.pick,
            strength: std::mem::replace(&mut self.seam_strength, SeamStrength::Fallback),
            token: self.seam_token.take(),
            flank: std::mem::replace(&mut self.seam_is_flank, false),
            root: std::mem::replace(&mut self.seam_is_root, false),
        })
    }

    fn restore_seam(&mut self, mut held: crate::render::HeldSeam) {
        if self.at_line_start() && held.pick.breaks() {
            held.pick = held.pick.without_first_break();
            held.kinds = held.pick;
            if held.pick.is_empty() {
                return;
            }
        }
        let held_breaks = held.pick.breaks();
        if crate::render::RenderSink::pending_break(self) && held_breaks {
            let rank = held.pick.rank();
            if self.seam.is_some_and(|current| rank > current) {
                self.set_payload(Payload { set: held.kinds, pick: held.pick });
                self.seam_is_flank = held.flank;
            }
            self.seam_strength = self.seam_strength.max(held.strength);
            self.seam_is_root |= held.root;
            return;
        }
        let was = (self.seam, self.seam_strength);
        self.merge_payload(Payload { set: held.kinds, pick: held.pick }, held.strength, held.flank);
        if held.token.is_some() && (self.seam, self.seam_strength) != was {
            self.seam_token = held.token;
        }
        self.seam_is_root |= held.root && self.seam.is_some();
    }

    fn defer_trailing(
        &mut self,
        render: &mut dyn FnMut(&mut dyn crate::render::RenderSink) -> crate::render::RenderResult,
    ) -> crate::render::RenderResult {
        if self.deferring.is_some() {
            return render(self);
        }
        let held = self.hold_context();
        self.deferring = Some(String::new());
        self.glued_open = None;
        self.open_before = 0;
        let result = render(self);
        let run = self.deferring.take().unwrap_or_default();
        let end = self.seam.map(|_| (self.seam_strength, self.held_payload()));
        let line_end = self.line_end_held.filter(|_| end.is_some());
        let glued = (self.glued_open.take() == Some(true), std::mem::take(&mut self.glued));
        let tail = self.tail.take();
        let open_before = std::mem::take(&mut self.open_before);
        self.restore_context(held);
        result?;
        if !run.is_empty() {
            self.deferred.push(DeferredRun { text: run, end, line_end, glued, open_before, tail });
        }
        Ok(())
    }

    fn seat_trailing(&mut self) -> crate::render::RenderResult {
        self.write_deferred(Some(""))?;
        Ok(())
    }
}

#[cfg(test)]
mod word_matcher_tests {
    use super::*;
    use crate::render::RenderSink;

    fn spaced(parts: &[&str]) -> String {
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident());
        for p in parts {
            w.text(p).unwrap();
        }
        out
    }

    #[test]
    fn word_word_seam_inserts() {
        assert_eq!(spaced(&["pub", "fn"]), "pub fn");
    }

    #[test]
    fn word_punct_seam_does_not_insert() {
        assert_eq!(spaced(&["pub", "("]), "pub(");
        assert_eq!(spaced(&[")", "foo"]), ")foo");
    }

    #[test]
    fn existing_space_is_inert() {
        assert_eq!(spaced(&["fn ", "main"]), "fn main");
    }

    #[test]
    fn newline_seam_does_not_insert() {
        assert_eq!(spaced(&["x = 1\n", "y"]), "x = 1\ny");
    }

    #[test]
    fn empty_write_keeps_context() {
        assert_eq!(spaced(&["pub", "", "fn"]), "pub fn");
    }

    #[test]
    fn digits_and_underscore_are_word() {
        assert_eq!(spaced(&["x1", "y2"]), "x1 y2");
        assert_eq!(spaced(&["_a", "_b"]), "_a _b");
    }

    // A small join-pair set matching rust's `..=`/`=>` token transitions —
    // enough to exercise seam behavior without depending on the real emitted
    // per-grammar table.
    pub(super) fn with_range_arrow_pairs() -> WordMatcher {
        WordMatcher::new(default_ascii_table(), char::is_alphanumeric)
            .with_join_pairs(&[(b'.', b'='), (b'=', b'>')])
    }

    // Every write armed on both sides, so only the pair table decides.
    fn spaced_with(word: &WordMatcher, parts: &[&str]) -> String {
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, word);
        for p in parts {
            w.join_arm(crate::render::JoinArm::BOTH);
            w.text(p).unwrap();
        }
        out
    }

    fn joined(word: &WordMatcher, left: (crate::render::JoinArm, &str), right: (crate::render::JoinArm, &str)) -> String {
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, word);
        w.join_arm(left.0);
        w.text(left.1).unwrap();
        w.join_arm(right.0);
        w.text(right.1).unwrap();
        out
    }

    #[test]
    fn a_join_pair_spaces_only_where_the_left_write_joins_next_and_the_right_joins_previous() {
        use crate::render::JoinArm;
        let word = with_range_arrow_pairs();
        assert_eq!(joined(&word, (JoinArm::NEXT, ".."), (JoinArm::PREVIOUS, "=>")), ".. =>");
        assert_eq!(joined(&word, (JoinArm::NONE, ".."), (JoinArm::PREVIOUS, "=>")), "..=>");
        assert_eq!(joined(&word, (JoinArm::NEXT, ".."), (JoinArm::NONE, "=>")), "..=>");
        assert_eq!(joined(&word, (JoinArm::PREVIOUS, ".."), (JoinArm::NEXT, "=>")), "..=>");
    }

    #[test]
    fn the_token_after_an_error_its_source_does_not_place_is_spaced_where_the_two_would_join() {
        use crate::render::{JoinArm, Render};
        let word = with_range_arrow_pairs();
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, &word);
        crate::trivia::TriviaText::of(crate::types::KindId::ERROR, "..").render(&mut w).unwrap();
        w.join_arm(JoinArm::PREVIOUS);
        w.text("=>").unwrap();
        assert_eq!(out, ".. =>");
    }

    #[test]
    fn arms_before_one_write_combine_the_write_takes_them_and_an_empty_write_leaves_them() {
        use crate::render::JoinArm;
        let word = with_range_arrow_pairs();
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, &word);
        w.join_arm(JoinArm::NEXT);
        w.text("").unwrap();
        w.text("..").unwrap();
        w.join_arm(JoinArm::PREVIOUS);
        w.join_arm(JoinArm::NONE);
        w.text("=>").unwrap();
        w.text("..").unwrap();
        w.text("=>").unwrap();
        assert_eq!(out, ".. =>..=>");
    }

    #[test]
    fn literal_merge_seam_inserts() {
        let word = with_range_arrow_pairs();
        // `d..` (bare range-to-end pattern) immediately followed by `=>`
        // would re-lex as `..=` + a dangling `>` without this insert — the
        // `.`→`=` transition exists inside the `..=` token.
        assert_eq!(spaced_with(&word, &["..", "=>"]), ".. =>");
    }

    #[test]
    fn non_merge_symbol_seam_does_not_insert() {
        let word = with_range_arrow_pairs();
        // Differing punctuation whose transition occurs in NO token stays
        // tight: `>` then `.` (method call on a generic result) cannot
        // extend any munch.
        assert_eq!(spaced_with(&word, &[">", "."]), ">.");
    }

    #[test]
    fn identical_symbol_seam_outside_the_pairs_does_not_insert() {
        let word = with_range_arrow_pairs();
        // Closing nested generics (`Vec<Vec<T>>`) stays tight: `>>` begins
        // nothing that can follow a `>`, so `>|>` is never a derived pair.
        assert_eq!(spaced_with(&word, &[">", ">"]), ">>");
    }

    #[test]
    fn identical_symbol_pair_inserts() {
        // `-|-` is a pair when `--` can begin what follows a unary `-`:
        // `- -x` and `- --x` must not re-lex as a decrement.
        let word = WordMatcher::new(default_ascii_table(), char::is_alphanumeric)
            .with_join_pairs(&[(b'-', b'-')]);
        assert_eq!(spaced_with(&word, &["-", "-", "x"]), "- -x");
        assert_eq!(spaced_with(&word, &["-", "--", "x"]), "- --x");
        assert_eq!(spaced_with(&word, &["-", "x"]), "-x");
        assert_eq!(spaced_with(&word, &["+", "+"]), "++");
    }

    #[test]
    fn symbol_word_seam_does_not_insert() {
        let word = with_range_arrow_pairs();
        assert_eq!(spaced_with(&word, &["=>", "a"]), "=>a");
        assert_eq!(spaced_with(&word, &["pub", "("]), "pub(");
    }

    #[test]
    fn default_matcher_has_no_join_pairs() {
        // WordMatcher::default_ident() carries an empty pair set —
        // grammars opt in via with_join_pairs at emit time.
        assert_eq!(spaced_with(WordMatcher::default_ident(), &["..", "=>"]), "..=>");
    }
}

#[cfg(test)]
mod sink_tests {
    use crate::types::KindId;
    use super::*;
    use crate::render::{RenderSink, WhitespaceTable};

    const TIGHT: KindId = KindId(1);
    const SPACE: KindId = KindId(2);
    const NEWLINE: KindId = KindId(3);
    const BLANK: KindId = KindId(4);
    const INDENT: KindId = KindId(5);
    const DEDENT: KindId = KindId(6);
    fn text_of(kind: KindId) -> &'static str {
        match kind {
            TIGHT => "",
            SPACE => " ",
            NEWLINE => "\n",
            BLANK => "\n\n",
            INDENT | DEDENT => "\n",
            _ => "",
        }
    }
    const TABLE: WhitespaceTable = WhitespaceTable {
        text_of,
        indent: INDENT,
        dedent: DEDENT, leaf_edges: &[], gaps: &[(1, KindId(1)), (2, KindId(2)), (8, KindId(3)), (16, KindId(4))]
    };

    fn run(f: impl FnOnce(&mut SpacingWriter<'_, String>)) -> String {
        let mut s = String::new();
        let mut w = SpacingWriter::new(&mut s, WordMatcher::default_ident())
            .with_table(&TABLE)
            .with_indent("  ");
        f(&mut w);
        w.finish().unwrap();
        s
    }

    #[test]
    fn a_word_hazard_gets_a_space_and_a_leaf_taking_no_space_suppresses_it() {
        assert_eq!(
            run(|w| {
                w.text("let").unwrap();
                w.text("x").unwrap();
            }),
            "let x"
        );
        assert_eq!(
            run(|w| {
                w.text("let").unwrap();
                w.leaf_edges(crate::layout_kinds::LayoutKinds::TIGHT, crate::layout_kinds::LayoutKinds::ALL);
                w.text("x").unwrap();
            }),
            "letx"
        );
    }

    #[test]
    fn seams_coalesce_to_the_widest_and_drop_at_the_edges() {
        assert_eq!(
            run(|w| {
                w.site(NEWLINE);
                w.text("a").unwrap();
                w.site(SPACE);
                w.site(BLANK);
                w.text("b").unwrap();
                w.site(NEWLINE);
            }),
            "a\n\nb"
        );
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.seam(crate::layout_kinds::LayoutKinds::SPACE);
                w.text("b").unwrap();
            }),
            "a\nb"
        );
    }

    #[test]
    fn a_trivia_seam_replaces_the_gap_default_whatever_its_width() {
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.trivia_seam(crate::layout_kinds::LayoutKinds::SPACE);
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("b").unwrap();
            }),
            "a b"
        );
        assert_eq!(
            run(|w| {
                w.text("{").unwrap();
                w.indent();
                w.trivia_seam(crate::layout_kinds::LayoutKinds::BLANKLINE);
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("}").unwrap();
            }),
            "{\n\n}"
        );
    }


    #[test]
    fn a_token_seam_coalesces_but_survives_the_end() {
        assert_eq!(
            run(|w| {
                w.text("pass").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.site(NEWLINE);
            }),
            "pass\n"
        );
        assert_eq!(
            run(|w| {
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("a").unwrap();
            }),
            "\na"
        );
    }

    #[test]
    fn a_tight_site_between_a_same_char_pair_still_gets_the_space() {
        let word = WordMatcher::new(default_ascii_table(), char::is_alphanumeric)
            .with_join_pairs(&[(b'-', b'-')]);
        let mut s = String::new();
        let mut w = SpacingWriter::new(&mut s, &word).with_table(&TABLE);
        w.join_arm(crate::render::JoinArm::BOTH);
        w.text("-").unwrap();
        w.site(TIGHT);
        w.join_arm(crate::render::JoinArm::BOTH);
        w.text("-").unwrap();
        w.site(TIGHT);
        w.text("x").unwrap();
        w.finish().unwrap();
        assert_eq!(s, "- -x");
    }

    #[test]
    fn a_tight_site_holds_a_seam_that_still_gets_the_lexical_space() {
        assert_eq!(
            run(|w| {
                w.text("let").unwrap();
                w.site(TIGHT);
                w.text("x").unwrap();
            }),
            "let x"
        );
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.site(KindId(0));
                w.text("b").unwrap();
            }),
            "a b"
        );
    }

    #[test]
    fn two_opens_at_one_position_open_one_depth_and_their_closes_return_to_it() {
        assert_eq!(
            run(|w| {
                w.text("{").unwrap();
                w.indent();
                w.indent();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("a").unwrap();
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("}").unwrap();
            }),
            "{\n  a\n}"
        );
    }

    #[test]
    fn opens_at_two_positions_open_two_depths_and_close_both() {
        assert_eq!(
            run(|w| {
                w.text("a:").unwrap();
                w.indent();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("b:").unwrap();
                w.indent();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("c").unwrap();
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("d").unwrap();
            }),
            "a:\n  b:\n    c\nd"
        );
    }

    #[test]
    fn a_depth_site_indents_and_a_dedent_before_any_text_leaves_a_body_bare() {
        assert_eq!(
            run(|w| {
                w.text("{").unwrap();
                w.site(INDENT);
                w.text("a").unwrap();
                w.site(DEDENT);
                w.text("}").unwrap();
            }),
            "{\n  a\n}"
        );
        assert_eq!(
            run(|w| {
                w.text("{").unwrap();
                w.site(INDENT);
                w.site(DEDENT);
                w.text("}").unwrap();
            }),
            "{}"
        );
        assert_eq!(
            run(|w| {
                w.text("{").unwrap();
                w.indent();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("a").unwrap();
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("}").unwrap();
            }),
            "{\n  a\n}"
        );
    }

    #[test]
    fn nested_indentation_stacks_and_a_dedented_indent_leaves_the_body_bare() {
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.indent();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("b").unwrap();
                w.indent();
                w.seam(crate::layout_kinds::LayoutKinds::BLANKLINE);
                w.text("c").unwrap();
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("d").unwrap();
            }),
            "a\n  b\n\n    c\nd"
        );
    }

    #[test]
    fn ends_line_reports_the_last_byte() {
        let mut s = String::new();
        let mut w = SpacingWriter::new(&mut s, WordMatcher::default_ident()).with_table(&TABLE);
        assert!(w.ends_line());
        w.text("a").unwrap();
        assert!(!w.ends_line());
        w.text("\n").unwrap();
        assert!(w.ends_line());
    }

    #[test]
    fn a_cancelled_indent_drops_the_dedent_seam_that_follows_it() {
        assert_eq!(
            run(|w| {
                w.text("{").unwrap();
                w.indent();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("}").unwrap();
            }),
            "{}"
        );
        assert_eq!(
            run(|w| {
                w.text("{").unwrap();
                w.indent();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("a").unwrap();
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("}").unwrap();
            }),
            "{\n  a\n}"
        );
    }

    #[test]
    fn a_leaf_trailing_edge_ends_with_the_next_text() {
        use crate::layout_kinds::LayoutKinds as K;
        assert_eq!(
            run(|w| {
                w.text("let s = ").unwrap();
                w.leaf_edges(K::TIGHT, K::TIGHT);
                w.text("a").unwrap();
                w.text(";").unwrap();
                w.seam(K::NEWLINE);
                w.seam(K::SEPARATING);
                w.text("b").unwrap();
            }),
            "let s = a;\nb"
        );
    }

    #[test]
    fn a_trailing_edge_narrows_a_held_set_to_what_it_takes() {
        use crate::layout_kinds::LayoutKinds as K;
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.leaf_edges(K::ALL, K(K::SPACE.0 | K::TIGHT.0));
                w.text("b").unwrap();
                w.seam(K::SEPARATING);
                w.text("c").unwrap();
            }),
            "a b c"
        );
        assert_eq!(
            run(|w| {
                w.leaf_edges(K::TIGHT, K::TIGHT);
                w.text("b").unwrap();
                w.seam(K::SEPARATING);
                w.text("c").unwrap();
            }),
            "bc"
        );
    }

    #[test]
    fn a_plain_space_seam_never_precedes_a_line_break() {
        assert_eq!(
            run(|w| {
                w.text("{}").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::SEPARATING);
                w.text("\n// tail\n").unwrap();
            }),
            "{}\n// tail\n"
        );
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("\nb").unwrap();
            }),
            "a\n\nb"
        );
    }

    #[test]
    fn literal_whitespace_is_never_coalesced() {
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::SPACE);
                w.text("  b").unwrap();
            }),
            "a   b"
        );
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.text(" ").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::SPACE);
                w.text("b").unwrap();
            }),
            "a  b"
        );
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::SPACE);
                w.text("x").unwrap();
                w.text("(").unwrap();
            }),
            "a x("
        );
    }

    #[test]
    fn a_bare_dedent_never_drops_a_following_seam() {
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("b").unwrap();
            }),
            "a\nb"
        );
    }

    #[test]
    fn a_tight_join_keeps_two_words_glued() {
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::TIGHT);
                w.text("b").unwrap();
            }),
            "ab"
        );
    }

    #[test]
    fn a_tight_join_survives_an_empty_write() {
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::TIGHT);
                w.text("").unwrap();
                w.text("b").unwrap();
            }),
            "ab"
        );
    }

    #[test]
    fn a_seam_after_a_glued_run_is_computed_against_its_true_last_char() {
        assert_eq!(
            run(|w| {
                w.text("(").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::TIGHT);
                w.text("d").unwrap();
                w.text("if").unwrap();
            }),
            "(d if"
        );
    }

    #[test]
    fn source_text_enters_the_writer_with_one_break_spelling() {
        assert_eq!(run(|w| w.text("a\r\nb\rc").unwrap()), "a\nb\nc");
        let indented = |body: &'static str| {
            run(move |w| {
                w.text("if a:").unwrap();
                w.indent();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text(body).unwrap();
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
            })
        };
        assert_eq!(indented("x\r\ny"), indented("x\ny"));
        assert_eq!(indented("x\ry"), indented("x\ny"));
    }

    #[test]
    fn only_a_line_terminated_kinds_text_drops_a_carriage_return_that_ends_it() {
        assert_eq!(run(|w| w.text("x\r").unwrap()), "x\n");
        assert_eq!(
            run(|w| {
                let outer = w.swallow_cr(true);
                w.text("# note\r").unwrap();
                w.swallow_cr(outer);
            }),
            "# note"
        );
    }


    #[test]
    fn a_dedent_below_zero_saturates() {
        let mut s = String::new();
        let mut w = SpacingWriter::new(&mut s, WordMatcher::default_ident()).with_indent("  ");
        w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
        w.text("x").unwrap();
        w.indent();
        w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
        w.text("y").unwrap();
        assert_eq!(s, "x\n  y");
    }

    struct Moves {
        source: std::sync::Arc<str>,
        moved: i32,
        asked: std::cell::Cell<u32>,
    }

    impl crate::render::SourceTable for Moves {
        fn source_of(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<&str> {
            let _ = at;
            Some(&*self.source)
        }

        fn depth_move(&self, coord: crate::slot::NodeIdOrCoordinate<'_>) -> i32 {
            let _ = coord;
            self.asked.set(self.asked.get() + 1);
            self.moved
        }
    }

    const HEAD: crate::types::Span = crate::types::Span { start: 0, end: 3 };
    const EMPTY: crate::types::Span = crate::types::Span { start: 3, end: 3 };

    const ROOT: crate::types::NodeIndex = crate::types::NodeIndex::ROOT;
    const CHILD: crate::types::NodeIndex = crate::types::NodeIndex(1);

    /// What `f` writes, with slices of `a {\nb` whose nodes move the depth
    /// by `moved`, and how many moves the render found.
    fn moving(moved: i32, f: impl FnOnce(&mut SpacingWriter<'_, String>, &dyn Fn(crate::types::NodeIndex, crate::types::Span) -> crate::slot::NodeCoordinate)) -> (String, u32) {
        let sources = Moves { source: std::sync::Arc::from("a {\nb"), moved, asked: std::cell::Cell::new(0) };
        let mut s = String::new();
        let mut w = SpacingWriter::new(&mut s, WordMatcher::default_ident()).with_table(&TABLE).with_indent("  ").with_sources(&sources);
        f(&mut w, &|index, span| crate::slot::NodeCoordinate::new(crate::types::TreeId(1), index, index + 1, span));
        w.finish().unwrap();
        (s, sources.asked.get())
    }

    const JOINING: crate::types::KindId = crate::types::KindId(1);
    const CLOSED: crate::types::KindId = crate::types::KindId(2);
    static SLICE_FLAGS: [crate::options::KindFlags; 3] = [crate::options::KindFlags::NONE, crate::options::KindFlags::JOINS_NEXT, crate::options::KindFlags::NONE];

    /// What a slice of `..` of `kind` and a `=>` armed with `arm` write, with
    /// or without the kind flag table.
    fn after_a_slice(kind: Option<crate::types::KindId>, arm: crate::render::JoinArm, flagged: bool) -> String {
        let word = super::word_matcher_tests::with_range_arrow_pairs();
        let sources = Moves { source: std::sync::Arc::from("a.."), moved: 0, asked: std::cell::Cell::new(0) };
        let options = crate::options::ResolvedOptions { kind_flags: &SLICE_FLAGS, ..Default::default() };
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, &word).with_table(&TABLE).with_sources(&sources);
        if flagged {
            w = w.with_options(&options);
        }
        let mut coord = crate::slot::NodeCoordinate::new(crate::types::TreeId(1), CHILD, CHILD + 1, crate::types::Span { start: 1, end: 3 });
        coord.kind = kind;
        w.slice((&coord).into()).unwrap();
        w.join_arm(arm);
        w.text("=>").unwrap();
        w.finish().unwrap();
        out
    }

    #[test]
    fn a_slice_s_last_token_joins_what_follows_where_its_kind_says_so_or_its_kind_is_unknown() {
        use crate::render::JoinArm;
        assert_eq!(after_a_slice(Some(JOINING), JoinArm::PREVIOUS, true), ".. =>");
        assert_eq!(after_a_slice(Some(CLOSED), JoinArm::PREVIOUS, true), "..=>");
        assert_eq!(after_a_slice(Some(JOINING), JoinArm::NONE, true), "..=>");
        assert_eq!(after_a_slice(None, JoinArm::PREVIOUS, true), ".. =>");
        assert_eq!(after_a_slice(Some(crate::types::KindId::ERROR), JoinArm::PREVIOUS, true), ".. =>");
        assert_eq!(after_a_slice(Some(CLOSED), JoinArm::PREVIOUS, false), ".. =>");
    }

    #[test]
    fn a_root_slice_s_depth_move_is_found_only_when_something_reads_the_depth() {
        assert_eq!(moving(1, |w, at| w.slice((&at(ROOT, HEAD)).into()).unwrap()), ("a {".to_owned(), 0));
        let followed = moving(1, |w, at| {
            w.slice((&at(ROOT, HEAD)).into()).unwrap();
            w.text("\n").unwrap();
            w.text("b").unwrap();
            w.dedent(crate::layout_kinds::LayoutKinds::NONE);
        });
        assert_eq!(followed, ("a {\n  b".to_owned(), 1));
    }

    #[test]
    fn any_other_slice_moves_the_depth_at_once_since_it_may_close_what_a_template_opened() {
        let closed = moving(-1, |w, at| {
            w.indent();
            w.slice((&at(CHILD, HEAD)).into()).unwrap();
        });
        assert_eq!(closed, ("a {".to_owned(), 1));
    }

    #[test]
    fn a_held_move_is_made_before_a_later_indent_after_the_text_between_disarms_it() {
        let merged = moving(1, |w, at| {
            w.slice((&at(ROOT, HEAD)).into()).unwrap();
            w.indent();
            w.text("\n").unwrap();
            w.text("b").unwrap();
            w.dedent(crate::layout_kinds::LayoutKinds::NONE);
            w.dedent(crate::layout_kinds::LayoutKinds::NONE);
        });
        assert_eq!(merged, ("a {\n  b".to_owned(), 1), "an indent right after the move merges into the level it opened");
        let stacked = moving(1, |w, at| {
            w.slice((&at(ROOT, HEAD)).into()).unwrap();
            w.text("\n").unwrap();
            w.indent();
            w.text("b").unwrap();
            w.dedent(crate::layout_kinds::LayoutKinds::NONE);
            w.dedent(crate::layout_kinds::LayoutKinds::NONE);
        });
        assert_eq!(stacked, ("a {\n    b".to_owned(), 1), "text after the move disarms its level, so the indent opens another");
    }

    #[test]
    fn an_empty_slice_moves_at_once_so_its_dedent_clears_the_payload_its_armed_level_holds() {
        let out = moving(-1, |w, at| {
            w.text("x").unwrap();
            w.indent();
            w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
            w.slice((&at(ROOT, EMPTY)).into()).unwrap();
            w.text("y").unwrap();
        });
        assert_eq!(out, ("x y".to_owned(), 1));
    }

    #[test]
    fn an_error_its_source_does_not_place_takes_the_seams_beside_it() {
        use crate::render::Render;
        let error = |before: Option<&str>, after: Option<&str>| crate::trivia::TriviaText {
            before: before.map(str::to_owned),
            after: after.map(str::to_owned),
            ..crate::trivia::TriviaText::of(KindId::ERROR, "$")
        };
        let between_seams = |entry: crate::trivia::TriviaText| {
            run(|w| {
                w.text("2,").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::SPACE);
                entry.render(w).unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::SPACE);
                w.text("3").unwrap();
            })
        };
        assert_eq!(between_seams(error(None, None)), "2, $ 3");
        assert_eq!(between_seams(error(Some(""), Some(""))), "2,$3", "an adjacency the source spells still replaces the seams");
    }

    #[test]
    fn a_gap_the_grammar_does_not_admit_is_written_as_the_widest_in_line_gap_it_does() {
        const NO_SPACE: WhitespaceTable = WhitespaceTable { text_of, indent: INDENT, dedent: DEDENT, leaf_edges: &[], gaps: &[(1, TIGHT), (8, NEWLINE), (16, BLANK)] };
        let written = |table: &WhitespaceTable, f: &dyn Fn(&mut SpacingWriter<'_, String>)| {
            let mut s = String::new();
            let mut w = SpacingWriter::new(&mut s, WordMatcher::default_ident()).with_table(table);
            f(&mut w);
            w.finish().unwrap();
            s
        };
        let joined = |w: &mut SpacingWriter<'_, String>| {
            w.text(")").unwrap();
            w.trivia_join(LayoutKinds::SPACE);
            w.text("a)").unwrap();
        };
        let deferred = |w: &mut SpacingWriter<'_, String>| {
            w.text(")").unwrap();
            w.defer_trailing(&mut |w| w.text("a)")).unwrap();
            w.seat_trailing().unwrap();
        };
        let broken = |w: &mut SpacingWriter<'_, String>| {
            w.text(")").unwrap();
            w.trivia_join(LayoutKinds::NEWLINE);
            w.text("a)").unwrap();
        };
        assert_eq!((written(&TABLE, &joined), written(&TABLE, &deferred)), (") a)".to_owned(), ") a)".to_owned()));
        assert_eq!((written(&NO_SPACE, &joined), written(&NO_SPACE, &deferred)), (")a)".to_owned(), ")a)".to_owned()));
        assert_eq!(written(&NO_SPACE, &broken), ")\na)", "a join that asks for a line break keeps it");
        assert_eq!(NO_SPACE.admitted_gaps(), LayoutKinds::from_bits(LayoutKinds::TIGHT.0 | LayoutKinds::NEWLINE.0 | LayoutKinds::BLANKLINE.0));
        assert_eq!((NO_SPACE.admit(LayoutKinds::SPACE), NO_SPACE.admit(LayoutKinds::TAB), TABLE.admit(LayoutKinds::TAB)), (LayoutKinds::TIGHT, LayoutKinds::TIGHT, LayoutKinds::SPACE));
    }

    #[test]
    fn the_run_after_a_verbatim_text_enters_with_its_breaks_spelled_lf() {
        let out = run(|w| {
            w.verbatim(None, "// c", Some("\r\n  ")).unwrap();
            w.text("x").unwrap();
        });
        assert_eq!(out, "// c\n  x");
    }
}

#[cfg(test)]
mod strength_tests {
    use crate::types::KindId;
    use super::*;
    use crate::render::{RenderSink, WhitespaceTable};

    fn text_of(kind: KindId) -> &'static str {
        match kind {
            KindId(1) => "",
            KindId(2) => " ",
            KindId(3) => "\n",
            KindId(4) => "\n\n",
            _ => "",
        }
    }
    const TABLE: WhitespaceTable = WhitespaceTable { text_of, indent: KindId(0), dedent: KindId(0) , leaf_edges: &[], gaps: &[(1, KindId(1)), (2, KindId(2)), (8, KindId(3)), (16, KindId(4))]};

    fn render(f: impl FnOnce(&mut SpacingWriter<'_, String>)) -> String {
        let mut out = String::new();
        let word = WordMatcher::default_ident();
        let mut w = SpacingWriter::new(&mut out, word).with_table(&TABLE);
        f(&mut w);
        w.finish().unwrap();
        out
    }

    #[test]
    fn a_held_line_end_is_widened_by_a_wider_break() {
        // A statement whose line end is held meets the blank line declared
        // after it: the blank line satisfies the break and is kept.
        let out = render(|w| {
            w.text("a").unwrap();
            w.hold_line_end(crate::render::LineHold::Break);
            w.site_with(KindId(4), SeamStrength::Declared);
            w.text("b").unwrap();
        });
        assert_eq!(out, "a\n\nb");
    }

    #[test]
    fn a_held_line_end_is_never_replaced_by_a_mark_without_a_break() {
        let out = render(|w| {
            w.text("a").unwrap();
            w.hold_line_end(crate::render::LineHold::Break);
            w.site_with(KindId(2), SeamStrength::Declared);
            w.text("b").unwrap();
        });
        assert_eq!(out, "a\nb");
    }

    #[test]
    fn a_line_break_the_text_before_a_seam_ends_with_counts_toward_it() {
        let out = render(|w| {
            w.text("#!\n").unwrap();
            w.site_with(KindId(4), SeamStrength::Trivia);
            w.text("fn").unwrap();
        });
        assert_eq!(out, "#!\n\nfn");
        let out = render(|w| {
            w.text("#!\n").unwrap();
            w.site_with(KindId(3), SeamStrength::Declared);
            w.text("fn").unwrap();
        });
        assert_eq!(out, "#!\nfn");
    }

    #[test]
    fn a_held_line_end_keeps_the_strength_of_the_break_it_holds() {
        // The declared blank line a line-terminated entry holds is a
        // preference: the source's own single break replaces it, and the line
        // end it floors is still satisfied.
        let out = render(|w| {
            w.text("a").unwrap();
            w.site_with(KindId(4), SeamStrength::Declared);
            w.hold_line_end(crate::render::LineHold::Break);
            w.site_with(KindId(3), SeamStrength::Trivia);
            w.text("b").unwrap();
        });
        assert_eq!(out, "a\nb");
    }

    #[test]
    fn only_a_terminated_line_end_outlasts_the_render() {
        let terminated = render(|w| {
            w.text("// c").unwrap();
            w.hold_line_end(crate::render::LineHold::Terminated);
        });
        assert_eq!(terminated, "// c\n");
        let excluded = render(|w| {
            w.text("a").unwrap();
            w.hold_line_end(crate::render::LineHold::Break);
        });
        assert_eq!(excluded, "a");
    }

    #[test]
    fn a_documents_end_writes_no_held_line_end() {
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident()).with_table(&TABLE).with_document(true);
        w.text("// c").unwrap();
        w.hold_line_end(crate::render::LineHold::Terminated);
        w.finish().unwrap();
        assert_eq!(out, "// c");
    }

    #[test]
    fn a_documents_end_keeps_the_break_its_last_token_spells() {
        let end = |lexeme: bool, gap: KindId| {
            let mut out = String::new();
            let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident()).with_table(&TABLE).with_document(true);
            w.text("#!x").unwrap();
            if lexeme {
                w.lexeme_seam(LayoutKinds::NEWLINE);
            } else {
                w.seam(LayoutKinds::NEWLINE);
            }
            w.root_edge(crate::options::Side::After, gap, SeamStrength::Declared);
            w.finish().unwrap();
            out
        };
        assert_eq!(end(true, KindId(1)), "#!x\n");
        assert_eq!(end(true, KindId(2)), "#!x\n");
        assert_eq!(end(true, KindId(4)), "#!x\n\n");
        assert_eq!(end(false, KindId(1)), "#!x");
        assert_eq!(end(false, KindId(4)), "#!x\n\n");
    }

    #[test]
    fn a_documents_leading_line_comment_keeps_its_break_before_the_root() {
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident()).with_table(&TABLE).with_document(true);
        w.text("// c").unwrap();
        w.hold_line_end(crate::render::LineHold::Terminated);
        w.root_edge(crate::options::Side::Before, KindId(1), SeamStrength::Declared);
        w.text("fn").unwrap();
        w.finish().unwrap();
        assert_eq!(out, "// c\nfn");
    }

    #[test]
    fn a_declared_space_holds_against_a_cascaded_tight() {
        // `= (x) =>`: the operator's declared space meets the parameter list's
        // cascaded tight edge; the declared mark wins whatever its width.
        let out = render(|w| {
            w.text("=").unwrap();
            w.site_with(KindId(2), SeamStrength::Declared);
            w.site_with(KindId(1), SeamStrength::Cascade);
            w.text("(").unwrap();
        });
        assert_eq!(out, "= (");
    }

    #[test]
    fn a_cascaded_tight_pulls_in_a_fallback_space() {
        // `f(x)`: the call's fallback space meets the argument list's cascaded
        // tight edge; cascade outranks fallback.
        let out = render(|w| {
            w.text("f").unwrap();
            w.site_with(KindId(2), SeamStrength::Fallback);
            w.site_with(KindId(1), SeamStrength::Cascade);
            w.text("(").unwrap();
        });
        assert_eq!(out, "f(");
    }

    #[test]
    fn within_one_strength_the_wider_mark_still_wins() {
        let out = render(|w| {
            w.text("a").unwrap();
            w.site_with(KindId(1), SeamStrength::Declared);
            w.site_with(KindId(3), SeamStrength::Declared);
            w.text("b").unwrap();
        });
        assert_eq!(out, "a\nb");
        let tight = render(|w| {
            w.text("x").unwrap();
            w.site_with(KindId(2), SeamStrength::Declared);
            w.site_with(KindId(1), SeamStrength::Declared);
            w.text(";").unwrap();
        });
        assert_eq!(tight, "x;");
    }

    #[test]
    fn an_equal_strength_flank_replaces_a_held_face() {
        // `{ a }`: the brace's declared tight face meets the list's declared
        // space flank; the flank wins though it is narrower.
        let out = render(|w| {
            w.text("{").unwrap();
            w.site_with(KindId(1), SeamStrength::Declared);
            w.site_mark(KindId(2), SeamStrength::Declared, true);
            w.text("a").unwrap();
        });
        assert_eq!(out, "{ a");
    }

    #[test]
    fn an_equal_strength_face_does_not_replace_a_held_flank() {
        let out = render(|w| {
            w.text("a").unwrap();
            w.site_mark(KindId(2), SeamStrength::Declared, true);
            w.site_with(KindId(1), SeamStrength::Declared);
            w.text("}").unwrap();
        });
        assert_eq!(out, "a }");
    }

    #[test]
    fn strength_still_decides_before_the_flank_tie_break() {
        // `use a::{b}`: a cascaded flank space loses to the brace's declared
        // tight face in either order, and a declared flank beats a cascaded face.
        let held_face = render(|w| {
            w.text("{").unwrap();
            w.site_with(KindId(1), SeamStrength::Declared);
            w.site_mark(KindId(2), SeamStrength::Cascade, true);
            w.text("b").unwrap();
        });
        assert_eq!(held_face, "{b");
        let held_flank = render(|w| {
            w.text("b").unwrap();
            w.site_mark(KindId(2), SeamStrength::Cascade, true);
            w.site_with(KindId(1), SeamStrength::Declared);
            w.text("}").unwrap();
        });
        assert_eq!(held_flank, "b}");
        let declared_flank = render(|w| {
            w.text("{").unwrap();
            w.site_with(KindId(1), SeamStrength::Cascade);
            w.site_mark(KindId(2), SeamStrength::Declared, true);
            w.text("b").unwrap();
        });
        assert_eq!(declared_flank, "{ b");
    }

    #[test]
    fn a_held_flank_survives_a_take_and_restore() {
        let out = render(|w| {
            w.text("a").unwrap();
            w.site_mark(KindId(2), SeamStrength::Declared, true);
            let held = w.take_seam().unwrap();
            assert!(held.flank);
            w.restore_seam(held);
            w.site_with(KindId(1), SeamStrength::Declared);
            w.text("}").unwrap();
        });
        assert_eq!(out, "a }");
    }
}
