//! `TransportLayout` — what a transport carries beside its slots.
//!
//! A node's layout is the trivia it owns, its base edges, and the evidence a
//! rebuilt node keeps of the source it was read from: the gap toward the list
//! item before it and, for a list, its source flanks. The wire sends it as
//! `$_layout`, absent when the node has none, and never sends the edges: the
//! prepare walk fills them. A transport stores it as an `Option` and reads it
//! through `Layout`, so an absent layout reads as an empty one.

use crate::options::{Edges, Side};
use crate::prepare::{Prepare, RenderContext};
use crate::render::{CoordinateError, Render, RenderResult, RenderSink};
use crate::slot::{SourceFlank, SourceGap};
use crate::trivia::{TransportTrivia, TriviaSeam};
use crate::types::KindId;

#[derive(Debug, Clone, PartialEq)]
pub struct TransportLayout<T> {
    pub trivia: Option<TransportTrivia<T>>,
    pub edges: Option<Edges>,
    pub gap: Option<SourceGap>,
    pub flank: Option<SourceFlank>,
}

impl<T> Default for TransportLayout<T> {
    fn default() -> Self {
        Self {
            trivia: None,
            edges: None,
            gap: None,
            flank: None,
        }
    }
}

/// The part a node plays in seating held trivia. An owner seats the trailing
/// entries an earlier owner held, before it renders and again after; an
/// anonymous token is counted among the tokens between an owner and its
/// same-line trailing entries, so the held entries stay held past it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TriviaRole {
    Owner,
    Token,
}

/// A transport's layout as its struct stores it.
pub trait Layout {
    type Trivia;
    fn trivia(&self) -> Option<&TransportTrivia<Self::Trivia>>;
    fn edges(&self) -> &Edges;
    fn edges_mut(&mut self) -> &mut Edges;
    /// The gap toward the list item before this node, when the wire says the
    /// two are still adjacent in their source.
    fn gap(&self) -> Option<&SourceGap>;
    fn take_flank(&mut self) -> Option<SourceFlank>;
}

impl<T> Layout for Option<TransportLayout<T>> {
    type Trivia = T;

    fn trivia(&self) -> Option<&TransportTrivia<T>> {
        self.as_ref()?.trivia.as_ref()
    }

    fn edges(&self) -> &Edges {
        self.as_ref()
            .and_then(|layout| layout.edges.as_ref())
            .unwrap_or(&Edges::NONE)
    }

    fn edges_mut(&mut self) -> &mut Edges {
        self.get_or_insert_with(Default::default)
            .edges
            .get_or_insert_with(Default::default)
    }

    fn gap(&self) -> Option<&SourceGap> {
        self.as_ref()?.gap.as_ref()
    }

    fn take_flank(&mut self) -> Option<SourceFlank> {
        self.as_mut()?.flank.take()
    }
}

impl<T: Render + TriviaSeam> TransportLayout<T> {
    /// Writes a node of `kind` between its layout. An owner first seats the
    /// trailing trivia an earlier owner held; then the node's leading entries,
    /// the body, and its trailing entries render. Before the leading entries
    /// and after the body the sink is handed each side of the node's stamped
    /// base edges (`RenderSink::unsited_edge`), which writes a stamp only where
    /// the kind has no edge site of its own, so a list gap's source class or a
    /// seat on a leaf item renders although no template writes that edge.
    /// After the body the sink is told the kind was written
    /// (`RenderSink::end_line_after`), so a line-terminated kind holds its line
    /// end before any trailing entry renders, and an owner seats what its
    /// children held, so held trivia never passes a token outside its parent.
    pub fn render(
        layout: Option<&Self>,
        kind: Option<KindId>,
        role: TriviaRole,
        w: &mut dyn RenderSink,
        body: impl FnOnce(&mut dyn RenderSink) -> RenderResult,
    ) -> RenderResult {
        let trivia = layout.and_then(|layout| layout.trivia.as_ref());
        let edges = layout.and_then(|layout| layout.edges).unwrap_or_default();
        if role == TriviaRole::Owner {
            w.seat_trailing()?;
        }
        if let Some(kind) = kind {
            w.unsited_edge(kind, Side::Before, edges.before);
        }
        if let Some(trivia) = trivia {
            trivia.render_leading(w)?;
        }
        body(w)?;
        if let Some(kind) = kind {
            w.unsited_edge(kind, Side::After, edges.after);
            w.end_line_after(kind);
        }
        if role == TriviaRole::Owner {
            w.seat_trailing()?;
        }
        if let Some(trivia) = trivia {
            trivia.render_trailing(w)?;
        }
        Ok(())
    }
}

impl<T: Prepare> Prepare for TransportLayout<T> {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        self.trivia.prepare(ctx)
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::FromNapiValue> ::napi::bindgen_prelude::FromNapiValue
    for TransportLayout<T>
{
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        use crate::boundary::property;
        unsafe {
            Ok(Self {
                trivia: property(env, napi_val, c"trivia")?,
                edges: None,
                gap: property(env, napi_val, c"gap")?,
                flank: property(env, napi_val, c"flank")?,
            })
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::ToNapiValue> ::napi::bindgen_prelude::ToNapiValue for TransportLayout<T> {
    /// `{ trivia?, gap?, flank? }`, each only when present. The edges are the
    /// prepare walk's and never cross.
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use crate::boundary::{object_with, set};
        let obj = unsafe { object_with(env, &[])? };
        if let Some(trivia) = val.trivia {
            unsafe { set(env, obj, c"trivia", TransportTrivia::to_napi_value(env, trivia)?)? };
        }
        if let Some(gap) = val.gap {
            unsafe { set(env, obj, c"gap", SourceGap::to_napi_value(env, gap)?)? };
        }
        if let Some(flank) = val.flank {
            unsafe { set(env, obj, c"flank", SourceFlank::to_napi_value(env, flank)?)? };
        }
        Ok(obj)
    }
}

#[cfg(feature = "napi-bindings")]
impl<T> ::napi::bindgen_prelude::TypeName for TransportLayout<T> {
    fn type_name() -> &'static str {
        "TransportLayout"
    }
    fn value_type() -> ::napi::ValueType {
        ::napi::ValueType::Object
    }
}

#[cfg(feature = "napi-bindings")]
impl<T> ::napi::bindgen_prelude::ValidateNapiValue for TransportLayout<T> {}

#[cfg(test)]
mod tests {
    use super::{TransportLayout, TriviaRole};
    use crate::render::{Render, RenderResult, RenderSink};
    use crate::slot::SlotValue;
    use crate::trivia::{TransportTrivia, TriviaEntry};

    /// A trivia entry that writes its text and then its after edge, as a
    /// comment kind's template does: a line comment's edge breaks the line,
    /// a block comment's is a space. The render protocol is under test, not
    /// any grammar's comment template.
    struct MockTrivia(String);

    impl crate::trivia::TriviaSeam for MockTrivia {}

    impl Render for MockTrivia {
        fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
            w.text(&self.0)?;
            if self.0.starts_with("/*") {
                w.seam(" ");
            } else {
                w.seam("\n");
                w.hold_line_end(crate::render::LineHold::Terminated);
            }
            Ok(())
        }
    }

    struct MockTransport {
        text: &'static str,
        layout: Option<TransportLayout<MockTrivia>>,
    }

    impl Render for MockTransport {
        fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
            TransportLayout::render(self.layout.as_ref(), Some(crate::types::KindId(9)), TriviaRole::Owner, w, |w| {
                w.text(self.text)
            })
        }
    }

    fn entries(texts: &[&str], same_line: bool) -> Option<Vec<TriviaEntry<MockTrivia>>> {
        Some(
            texts
                .iter()
                .map(|t| TriviaEntry {
                    value: SlotValue::Transport(MockTrivia(t.to_string())),
                    same_line,
                    tokens_between: u16::from(same_line),
                })
                .collect(),
        )
    }

    fn owner(text: &'static str, leading: &[&str], trailing: &[&str], same_line: bool) -> MockTransport {
        MockTransport {
            text,
            layout: Some(TransportLayout {
                trivia: Some(TransportTrivia {
                    leading: entries(leading, false),
                    trailing: entries(trailing, same_line),
                    inner: None,
                }),
                ..Default::default()
            }),
        }
    }

    fn bare(text: &'static str) -> MockTransport {
        MockTransport { text, layout: None }
    }

    fn render_with(f: impl FnOnce(&mut dyn RenderSink) -> RenderResult) -> String {
        let mut s = String::new();
        let mut w = crate::spacing::SpacingWriter::new(&mut s, crate::spacing::WordMatcher::default_ident());
        f(&mut w).unwrap();
        w.finish().unwrap();
        s
    }

    fn render(t: &MockTransport) -> String {
        render_with(|w| t.render(w))
    }

    #[test]
    fn a_node_with_no_layout_renders_its_body() {
        assert_eq!(render(&bare("CONTENT")), "CONTENT");
    }

    #[test]
    fn a_stamped_edge_of_a_kind_with_no_edge_site_is_written_around_the_node() {
        use crate::options::{EdgeArm, Edges};
        use crate::spacing::{SEAM_DECLARED, SEAM_TRIVIA};
        const TIGHT: u16 = 1;
        const SPACE: u16 = 2;
        fn text_of(kind: u16) -> &'static str {
            if kind == SPACE {
                " "
            } else {
                ""
            }
        }
        const TABLE: crate::render::WhitespaceTable = crate::render::WhitespaceTable { text_of, indent: 0, dedent: 0 };
        let tight = Some(EdgeArm { arm: TIGHT, strength: Some(SEAM_TRIVIA), dedent: None });
        let edged = |text, edges| MockTransport {
            text,
            layout: Some(TransportLayout { edges: Some(edges), ..Default::default() }),
        };
        let first = edged("a", Edges { before: None, after: tight });
        let second = edged("b", Edges { before: tight, after: None });
        let mut out = String::new();
        let mut w = crate::spacing::SpacingWriter::new(&mut out, crate::spacing::WordMatcher::default_ident()).with_table(&TABLE);
        first.render(&mut w).unwrap();
        w.site_with(SPACE, SEAM_DECLARED);
        w.text(",").unwrap();
        w.site_with(SPACE, SEAM_DECLARED);
        second.render(&mut w).unwrap();
        w.finish().unwrap();
        assert_eq!(out, "a,b");
    }

    #[test]
    fn leading_entries_render_before_the_node() {
        assert_eq!(render(&owner("CONTENT", &["// hello"], &[], false)), "// hello\nCONTENT");
    }

    #[test]
    fn trailing_entries_render_after_the_node() {
        assert_eq!(render(&owner("CONTENT", &[], &["// end"], false)), "CONTENT\n// end\n");
    }

    #[test]
    fn leading_and_trailing_entries_surround_the_node() {
        assert_eq!(
            render(&owner("CONTENT", &["// top"], &["// bottom"], false)),
            "// top\nCONTENT\n// bottom\n"
        );
    }

    #[test]
    fn several_leading_entries_each_take_a_line() {
        assert_eq!(
            render(&owner("CONTENT", &["// line 1", "// line 2"], &[], false)),
            "// line 1\n// line 2\nCONTENT"
        );
    }

    #[test]
    fn several_trailing_entries_each_take_a_line() {
        assert_eq!(
            render(&owner("CONTENT", &[], &["// end 1", "// end 2"], false)),
            "CONTENT\n// end 1\n// end 2\n"
        );
    }

    #[test]
    fn empty_trivia_renders_the_body_alone() {
        assert_eq!(render(&owner("CONTENT", &[], &[], false)), "CONTENT");
    }

    #[test]
    fn a_same_line_trailing_entry_follows_the_tokens_after_its_owner() {
        let pattern = owner("case x", &[], &["# c"], true);
        let body = owner("pass", &[], &[], false);
        let text = render_with(|w| {
            pattern.render(w)?;
            w.text(":")?;
            w.seam("\n");
            body.render(w)
        });
        assert_eq!(text, "case x: # c\npass");
    }

    #[test]
    fn a_same_line_trailing_entry_is_seated_before_a_line_break() {
        let statement = owner("a;", &[], &["// note"], true);
        let text = render_with(|w| {
            statement.render(w)?;
            w.text("\n")?;
            w.text("}")
        });
        assert_eq!(text, "a; // note\n}");
    }

    #[test]
    fn a_same_line_trailing_entry_stays_inside_its_parent() {
        struct Parent(MockTransport);
        impl Render for Parent {
            fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
                TransportLayout::<MockTrivia>::render(None, None, TriviaRole::Owner, w, |w| {
                    w.text("{")?;
                    self.0.render(w)?;
                    w.text("}")
                })
            }
        }
        let inner = Parent(owner("2", &[], &["# two"], true));
        let text = render_with(|w| {
            inner.render(w)?;
            w.text("]")
        });
        assert_eq!(text, "{2} # two\n]");
    }

    #[test]
    fn a_same_line_trailing_entry_with_no_tokens_between_seats_after_its_owner() {
        let mut two = owner("2", &[], &["# two"], true);
        let trivia = two.layout.as_mut().and_then(|layout| layout.trivia.as_mut()).unwrap();
        for entry in trivia.trailing.as_mut().unwrap() {
            entry.tokens_between = 0;
        }
        let text = render_with(|w| {
            w.text("{")?;
            two.render(w)?;
            w.text("}")
        });
        assert_eq!(text, "{2 # two\n}");
    }

    #[test]
    fn a_held_trailing_entry_meets_what_follows_through_its_after_edge() {
        let left = owner("a", &[], &["/* x */"], true);
        let right = owner("b", &[], &[], false);
        let text = render_with(|w| {
            left.render(w)?;
            w.text("+")?;
            right.render(w)
        });
        assert_eq!(text, "a+ /* x */ b");
    }

    #[test]
    fn a_held_trailing_entry_seats_after_a_token_that_renders_through_a_transport() {
        struct Token(MockTransport);
        impl Render for Token {
            fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
                let token = &self.0;
                TransportLayout::render(token.layout.as_ref(), None, TriviaRole::Token, w, |w| w.text(token.text))
            }
        }
        let left = owner("a", &[], &["/* x */"], true);
        let plus = Token(bare("+"));
        let right = owner("b", &[], &[], false);
        let text = render_with(|w| {
            left.render(w)?;
            plus.render(w)?;
            right.render(w)
        });
        assert_eq!(text, "a+ /* x */ b");
    }

    #[test]
    fn a_line_comment_whose_span_ends_its_line_breaks_once() {
        assert_eq!(
            render(&owner("CONTENT", &["//! a\n", "//! b\n"], &[], false)),
            "//! a\n//! b\nCONTENT"
        );
    }

    #[test]
    fn a_standalone_render_keeps_a_line_comment_break_and_drops_a_block_comment_space() {
        assert_eq!(render(&owner("a;", &[], &["// end"], true)), "a; // end\n");
        assert_eq!(render(&owner("a;", &[], &["/* end */"], true)), "a; /* end */");
    }
}
