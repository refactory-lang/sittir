//! The typed sink a render writes into, and the trait every rendered value
//! implements against it. Whitespace decisions are calls, not bytes: a
//! site's arm, a fixed seam, a whitespace token, adjacency and depth each
//! have a method, and the writer behind the sink decides what reaches the
//! output.

use std::fmt;
use std::sync::Arc;

use crate::spacing::{SpacingWriter, WordMatcher};
use crate::types::KindId;

#[derive(Debug)]
pub enum RenderError {
    Fmt(fmt::Error),
    Coordinate(CoordinateError),
}

impl fmt::Display for RenderError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Fmt(e) => fmt::Display::fmt(e, f),
            Self::Coordinate(e) => fmt::Display::fmt(e, f),
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
        Self::Coordinate(e)
    }
}

pub type RenderResult = Result<(), RenderError>;

/// The grammar's whitespace vocabulary as the writer needs it: the text of
/// each arm by kind id, and which two ids are the depth arms.
pub struct WhitespaceTable {
    pub text_of: fn(u16) -> &'static str,
    pub indent: u16,
    pub dedent: u16,
}

/// The live trees a render may slice, keyed by the tag a handle carries.
pub trait SourceTable {
    fn source_of(&self, tree_id: u32) -> Option<&Arc<str>>;

    /// The kind of the node a coordinate names, when the table still holds
    /// its tree. A table of bare sources cannot answer and says so.
    fn kind_of(&self, coord: &crate::slot::NodeCoordinate) -> Option<KindId> {
        let _ = coord;
        None
    }

    /// The kind of the node a coordinate names, then the kind of each last
    /// descendant that ends at the same byte. A line end the node's text
    /// owes belongs to whichever of these kinds ends in it.
    fn kinds_ending_with(&self, coord: &crate::slot::NodeCoordinate) -> Vec<KindId> {
        self.kind_of(coord).into_iter().collect()
    }
}

/// Why a coordinate cannot be turned into bytes. Both arms carry the handle:
/// a coordinate is only meaningful beside the tree that minted it, and the
/// handle is the only thing that names that tree.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CoordinateError {
    /// The handle's tag names no tree this engine holds: read elsewhere,
    /// already disposed, or never parsed.
    UnknownTree {
        handle: u64,
        tree_id: u32,
    },
    BadSpan {
        handle: u64,
        detail: String,
    },
}

impl fmt::Display for CoordinateError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnknownTree { handle, tree_id } => write!(
                f,
                "handle {handle} names tree {tree_id}, which this engine does not hold (never parsed, disposed, or read by another engine)"
            ),
            Self::BadSpan { handle, detail } => write!(f, "handle {handle}: {detail}"),
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

pub trait RenderSink {
    fn text(&mut self, s: &str) -> RenderResult;
    fn adjacent(&mut self);
    fn site(&mut self, kind: u16);
    /// A site's arm with the strength its table row gives it; `site` is the
    /// declared-strength form. The default keeps a sink that knows nothing of
    /// strength working as before.
    fn site_with(&mut self, kind: u16, strength: u8) {
        let _ = strength;
        self.site(kind);
    }
    /// A spacing site's arm read from the resolved options this sink holds,
    /// with the site's default strength when the arm is its default. Unlike
    /// `site`, which writes a given arm, this names a site and looks it up.
    fn site_at(&mut self, site: usize);
    /// A list's start or end flank site, looked up as `site_at` does. At one
    /// gap, a flank mark beats any other mark of equal strength; a sink that
    /// knows no strengths writes it as a plain site.
    fn flank_at(&mut self, site: usize) {
        self.site_at(site);
    }
    /// One side of a kind's edge: the node's stamp when it carries one, else
    /// the kind's edge row (`ResolvedOptions::edge_arm`). A kind with no edge
    /// site on that side writes nothing.
    fn edge(&mut self, kind: KindId, side: crate::options::Side, stamped: Option<crate::options::EdgeArm>);
    fn seam(&mut self, text: &str);
    fn token_seam(&mut self, text: &str);
    /// A whitespace trivia entry: its text replaces whatever seam the gap it
    /// sits in would otherwise get. A sink that knows no strengths writes it
    /// as a token seam.
    fn trivia_seam(&mut self, text: &str) {
        self.token_seam(text);
    }
    /// Write the bytes a coordinate names, from the tree table this writer
    /// holds. The default refuses: a sink with no source table cannot answer
    /// a coordinate, and answering it as empty would silently delete source.
    fn slice(&mut self, coord: &crate::slot::NodeCoordinate) -> RenderResult {
        Err(CoordinateError::UnknownTree {
            handle: coord.handle,
            tree_id: coord.tree_id(),
        }
        .into())
    }
    /// The kind of the node a coordinate names, from the tree table this
    /// writer holds; a sink with no table answers nothing.
    fn kind_of(&self, coord: &crate::slot::NodeCoordinate) -> Option<KindId> {
        let _ = coord;
        None
    }
    /// The kinds a coordinate's text ends in: its own kind first, then the
    /// last descendants that share its end byte.
    fn kinds_ending_with(&self, coord: &crate::slot::NodeCoordinate) -> Vec<KindId> {
        self.kind_of(coord).into_iter().collect()
    }
    fn indent(&mut self);
    /// Shallows the depth and merges `seam` after it. A dedent that arrives
    /// while the indent before it has had no text written cancels that
    /// indent, its held payload, and this seam, so an empty body renders as
    /// its bare delimiters. An empty seam merges nothing. This is the only
    /// place the "may a break follow a dedent" question is answered — a
    /// caller never asks it.
    fn dedent(&mut self, seam: &str);
    fn ends_line(&self) -> bool;
    /// Whether the seam held for the next write breaks the line.
    fn pending_break(&self) -> bool {
        false
    }
    /// Whether the output stands right after an indent that nothing has been
    /// written under yet: the start of a block body.
    fn at_body_start(&self) -> bool {
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
    fn kind_has(&self, kind: KindId, flag: u8) -> bool {
        let _ = (kind, flag);
        false
    }
    /// A node of `kind` has just been written: hold the line end when the
    /// kind is line-terminated (`options::KIND_LINE_TERMINATED`) or ends in
    /// the declared newline token (`options::KIND_LINE_BREAK_TERMINATED`).
    /// Every node render reaches this once, whether a transport, a
    /// coordinate or detached trivia text.
    fn end_line_after(&mut self, kind: KindId) {
        if self.kind_has(kind, crate::options::KIND_LINE_TERMINATED) {
            self.hold_line_end(LineHold::Terminated);
        } else if self.kind_has(kind, crate::options::KIND_LINE_BREAK_TERMINATED) {
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

/// A seam set aside from the sink: its text, the strength it holds, whether
/// a whitespace token wrote it, and whether a list flank wrote it.
#[derive(Debug, Clone)]
pub struct HeldSeam {
    pub text: String,
    pub strength: u8,
    pub token: bool,
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
