//! Exported macros for the sittir render pipeline.
//!
//! `render_with_trivia!` is the canonical way to wrap a transport's
//! render call with leading/trailing trivia text. Used by every
//! struct-based `Render` impl in grammar crates.

/// Wraps a transport render call with the trivia the transport owns: any
/// trailing trivia held from an earlier owner is seated first, then this
/// owner's leading entries, the render itself, and its trailing entries
/// (`trivia::TransportTrivia`). Trailing trivia a child held is seated when
/// the render ends, so it never passes a token outside its parent. Each entry renders via its OWN `Render` impl
/// (the grammar's generated `TriviaTransport`).
///
/// # Usage
///
/// In every struct-based `Render` impl:
///
/// ```rust,ignore
/// fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
///     render_with_trivia!(self, w, render_xxx(self, w))
/// }
/// ```
///
/// `$self` has a `transport_trivia_data: Option<TransportTrivia<T>>` field;
/// bool/enum transport variants have none and write directly to `$w`.
#[macro_export]
macro_rules! render_with_trivia {
    ($self:expr, $w:expr, $render:expr) => {
        (|| -> $crate::render::RenderResult {
            $w.seat_trailing()?;
            if let Some(ref __trivia) = $self.transport_trivia_data {
                __trivia.render_leading($w)?;
            }
            $render?;
            $w.seat_trailing()?;
            if let Some(ref __trivia) = $self.transport_trivia_data {
                __trivia.render_trailing($w)?;
            }
            Ok(())
        })()
    };
}

#[cfg(test)]
mod trivia_macro_tests {
    use crate::render::{Render, RenderResult, RenderSink};
    use crate::slot::SlotValue;
    use crate::trivia::{TransportTrivia, TriviaEntry};

    /// A trivia entry that writes its text: the macro's control flow is under
    /// test, not any grammar's comment template.
    struct MockTrivia(String);

    impl crate::trivia::TriviaSeam for MockTrivia {}

    impl Render for MockTrivia {
        fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
            w.text(&self.0)
        }
    }

    struct MockTransport {
        text: &'static str,
        transport_trivia_data: Option<TransportTrivia<MockTrivia>>,
    }

    impl Render for MockTransport {
        fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
            render_with_trivia!(self, w, w.text(self.text))
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

    fn owner(
        text: &'static str,
        leading: &[&str],
        trailing: &[&str],
        same_line: bool,
    ) -> MockTransport {
        MockTransport {
            text,
            transport_trivia_data: Some(TransportTrivia {
                leading: entries(leading, false),
                trailing: entries(trailing, same_line),
                inner: None,
            }),
        }
    }

    fn render_with(f: impl FnOnce(&mut dyn RenderSink) -> RenderResult) -> String {
        let mut s = String::new();
        let mut w = crate::spacing::SpacingWriter::new(
            &mut s,
            crate::spacing::WordMatcher::default_ident(),
        );
        f(&mut w).unwrap();
        w.finish().unwrap();
        s
    }

    fn render(t: &MockTransport) -> String {
        render_with(|w| t.render(w))
    }

    #[test]
    fn trivia_macro_no_trivia() {
        let t = MockTransport {
            text: "CONTENT",
            transport_trivia_data: None,
        };
        assert_eq!(render(&t), "CONTENT");
    }

    #[test]
    fn trivia_macro_leading() {
        assert_eq!(
            render(&owner("CONTENT", &["// hello"], &[], false)),
            "// hello\nCONTENT"
        );
    }

    #[test]
    fn trivia_macro_trailing() {
        assert_eq!(
            render(&owner("CONTENT", &[], &["// end"], false)),
            "CONTENT\n// end\n"
        );
    }

    #[test]
    fn trivia_macro_both() {
        assert_eq!(
            render(&owner("CONTENT", &["// top"], &["// bottom"], false)),
            "// top\nCONTENT\n// bottom\n"
        );
    }

    #[test]
    fn trivia_macro_multiple_leading() {
        assert_eq!(
            render(&owner("CONTENT", &["// line 1", "// line 2"], &[], false)),
            "// line 1\n// line 2\nCONTENT"
        );
    }

    #[test]
    fn trivia_macro_multiple_trailing() {
        assert_eq!(
            render(&owner("CONTENT", &[], &["// end 1", "// end 2"], false)),
            "CONTENT\n// end 1\n// end 2\n"
        );
    }

    #[test]
    fn trivia_macro_empty_vecs() {
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
                let parent = MockTransport {
                    text: "",
                    transport_trivia_data: None,
                };
                render_with_trivia!(parent, w, {
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
        for entry in two
            .transport_trivia_data
            .as_mut()
            .unwrap()
            .trailing
            .as_mut()
            .unwrap()
        {
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
    fn a_same_line_trailing_entry_ends_its_line_before_what_follows() {
        let left = owner("a", &[], &["/* x */"], true);
        let right = owner("b", &[], &[], false);
        let text = render_with(|w| {
            left.render(w)?;
            w.text("+")?;
            right.render(w)
        });
        assert_eq!(text, "a+ /* x */\nb");
    }
}
