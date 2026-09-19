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
    fn seam(&mut self, text: &str);
    fn token_seam(&mut self, text: &str);
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
    fn indent(&mut self);
    /// Shallows the depth and merges `seam` after it. A dedent that arrives
    /// while the indent before it has had no text written cancels that
    /// indent, its held payload, and this seam, so an empty body renders as
    /// its bare delimiters. An empty seam merges nothing. This is the only
    /// place the "may a break follow a dedent" question is answered — a
    /// caller never asks it.
    fn dedent(&mut self, seam: &str);
    fn ends_line(&self) -> bool;
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
