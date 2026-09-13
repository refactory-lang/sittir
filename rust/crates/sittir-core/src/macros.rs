//! Exported macros for the sittir render pipeline.
//!
//! `render_with_trivia!` is the canonical way to wrap a transport's
//! render call with leading/trailing trivia text. Used by every
//! struct-based `Render` impl in grammar crates.

/// Wraps a transport render call with trivia (leading/trailing comments).
/// Each trivia entry renders via its OWN `Render` impl (the same per-kind
/// dispatch every other transport uses) — the concrete trivia entry type is
/// grammar-specific (`TriviaTransport`, generated per grammar) and only
/// needs to implement `Render`.
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
/// # Parameters
///
/// - `$self` — the transport struct (must have a `transport_trivia_data: Option<T>` field
///   where `T` has `leading`/`trailing: Option<Vec<E>>` and `E: Render`)
/// - `$w` — a `&mut dyn RenderSink`
/// - `$render` — the actual render expression (returns `RenderResult`)
///
/// # Returns
///
/// `RenderResult` — propagates errors from both trivia renders and the inner render.
///
/// # Notes
///
/// - Bool/enum transport variants don't have `transport_trivia_data` — those
///   write directly to `$w` and don't use this macro.
/// - Double-underscore prefixed variable names avoid shadowing caller variables.
/// - The boundary after the last trailing entry must be a line break: a
///   line comment silently swallows whatever follows it on the same
///   physical line. An entry whose own text already ends the line (a
///   grammar may include the terminator in the comment node's span)
///   satisfies that without an extra break.
#[macro_export]
macro_rules! render_with_trivia {
    ($self:expr, $w:expr, $render:expr) => {
        (|| -> $crate::render::RenderResult {
            if let Some(ref __trivia) = $self.transport_trivia_data {
                if let Some(ref __leading) = __trivia.leading {
                    for __entry in __leading {
                        $crate::render::Render::render(__entry, $w)?;
                        if !$w.ends_line() {
                            $w.text("\n")?;
                        }
                    }
                }
            }
            $render?;
            if let Some(ref __trivia) = $self.transport_trivia_data {
                if let Some(ref __trailing) = __trivia.trailing {
                    if !__trailing.is_empty() {
                        for __entry in __trailing {
                            $w.text("\n")?;
                            $crate::render::Render::render(__entry, $w)?;
                        }
                        if !$w.ends_line() {
                            $w.text("\n")?;
                        }
                    }
                }
            }
            Ok(())
        })()
    };
}

#[cfg(test)]
mod trivia_macro_tests {
    use crate::render::{Render, RenderResult, RenderSink};

    /// Minimal `Render` impl for macro-expansion tests — real trivia
    /// entries are the generated, grammar-specific `TriviaTransport` enum
    /// (see `render_module.ts`); this mock only needs to prove the macro's
    /// leading/trailing/empty control flow, not any concrete grammar's
    /// render output.
    struct MockTrivia(String);

    impl Render for MockTrivia {
        fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
            w.text(&self.0)
        }
    }

    struct MockTransportTrivia {
        leading: Option<Vec<MockTrivia>>,
        trailing: Option<Vec<MockTrivia>>,
    }

    struct MockTransport {
        transport_trivia_data: Option<MockTransportTrivia>,
    }

    fn render_mock(_t: &MockTransport, w: &mut dyn RenderSink) -> RenderResult {
        w.text("CONTENT")
    }

    fn mock_trivia(texts: &[&str]) -> Vec<MockTrivia> {
        texts.iter().map(|t| MockTrivia(t.to_string())).collect()
    }

    fn render(t: &MockTransport) -> String {
        let mut s = String::new();
        let mut w = crate::spacing::SpacingWriter::new(&mut s, crate::spacing::WordMatcher::default_ident());
        let result: RenderResult = render_with_trivia!(t, &mut w, render_mock(t, &mut w));
        result.unwrap();
        w.finish().unwrap();
        s
    }

    #[test]
    fn trivia_macro_no_trivia() {
        let t = MockTransport {
            transport_trivia_data: None,
        };
        assert_eq!(render(&t), "CONTENT");
    }

    #[test]
    fn trivia_macro_leading() {
        let t = MockTransport {
            transport_trivia_data: Some(MockTransportTrivia {
                leading: Some(mock_trivia(&["// hello"])),
                trailing: None,
            }),
        };
        assert_eq!(render(&t), "// hello\nCONTENT");
    }

    #[test]
    fn trivia_macro_trailing() {
        let t = MockTransport {
            transport_trivia_data: Some(MockTransportTrivia {
                leading: None,
                trailing: Some(mock_trivia(&["// end"])),
            }),
        };
        assert_eq!(render(&t), "CONTENT\n// end\n");
    }

    #[test]
    fn trivia_macro_both() {
        let t = MockTransport {
            transport_trivia_data: Some(MockTransportTrivia {
                leading: Some(mock_trivia(&["// top"])),
                trailing: Some(mock_trivia(&["// bottom"])),
            }),
        };
        assert_eq!(render(&t), "// top\nCONTENT\n// bottom\n");
    }

    #[test]
    fn trivia_macro_multiple_leading() {
        let t = MockTransport {
            transport_trivia_data: Some(MockTransportTrivia {
                leading: Some(mock_trivia(&["// line 1", "// line 2"])),
                trailing: None,
            }),
        };
        assert_eq!(render(&t), "// line 1\n// line 2\nCONTENT");
    }

    #[test]
    fn trivia_macro_multiple_trailing() {
        let t = MockTransport {
            transport_trivia_data: Some(MockTransportTrivia {
                leading: None,
                trailing: Some(mock_trivia(&["// end 1", "// end 2"])),
            }),
        };
        assert_eq!(render(&t), "CONTENT\n// end 1\n// end 2\n");
    }

    #[test]
    fn trivia_macro_empty_vecs() {
        let t = MockTransport {
            transport_trivia_data: Some(MockTransportTrivia {
                leading: Some(Vec::<MockTrivia>::new()),
                trailing: Some(Vec::<MockTrivia>::new()),
            }),
        };
        assert_eq!(render(&t), "CONTENT");
    }
}
