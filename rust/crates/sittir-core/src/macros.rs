//! Exported macros for the sittir render pipeline.
//!
//! `render_with_trivia!` is the canonical way to wrap a transport's
//! render call with leading/trailing trivia text. Used by every
//! struct-based `RenderableTransport::render_into` impl in grammar crates.

/// Wraps a transport render call with trivia (leading/trailing comments).
/// Streams directly to `dest` — no intermediate buffer for trivia. Each
/// trivia entry renders via its OWN `RenderableTransport::render_into`
/// (the same per-kind dispatch every other transport uses), not as a
/// pre-rendered string — the concrete trivia entry type is grammar-
/// specific (`TriviaTransport`, generated per grammar) and only needs
/// to implement `RenderableTransport` to satisfy this macro.
///
/// # Usage
///
/// In every struct-based `RenderableTransport::render_into` impl:
///
/// ```rust,ignore
/// fn render_into(&self, dest: &mut dyn std::fmt::Write) -> std::fmt::Result {
///     render_with_trivia!(self, dest, render_xxx(self, dest))
/// }
/// ```
///
/// # Parameters
///
/// - `$self` — the transport struct (must have a `transport_trivia_data: Option<T>` field
///   where `T` has `leading`/`trailing: Option<Vec<E>>` and `E: RenderableTransport`)
/// - `$dest` — the `&mut dyn Write` target
/// - `$render` — the actual render expression (returns `std::fmt::Result`)
///
/// # Returns
///
/// `std::fmt::Result` — propagates errors from both trivia renders and the inner render.
///
/// # Notes
///
/// - Bool/enum transport variants don't have `transport_trivia_data` — those
///   write directly to dest and don't use this macro.
/// - Double-underscore prefixed variable names avoid shadowing caller variables.
#[macro_export]
macro_rules! render_with_trivia {
    ($self:expr, $dest:expr, $render:expr) => {
        (|| -> ::std::fmt::Result {
            if let Some(ref __trivia) = $self.transport_trivia_data {
                if let Some(ref __leading) = __trivia.leading {
                    for __entry in __leading {
                        __entry.render_into($dest)?;
                        $dest.write_str("\n")?;
                    }
                }
            }
            $render?;
            if let Some(ref __trivia) = $self.transport_trivia_data {
                if let Some(ref __trailing) = __trivia.trailing {
                    if !__trailing.is_empty() {
                        for __entry in __trailing {
                            $dest.write_str("\n")?;
                            __entry.render_into($dest)?;
                        }
                        // Unconditional trailing newline (symmetric with the
                        // leading-trivia guarantee above): a line comment
                        // silently swallows whatever text follows it on the
                        // same physical line, so the boundary after the LAST
                        // trailing entry must be a hard newline, not left to
                        // the caller (SpacingWriter only guarantees a space,
                        // not a line break).
                        $dest.write_str("\n")?;
                    }
                }
            }
            Ok(())
        })()
    };
}

#[cfg(test)]
mod trivia_macro_tests {
    use crate::types::RenderableTransport;
    use std::fmt::Write;

    /// Minimal `RenderableTransport` impl for macro-expansion tests —
    /// real trivia entries are the generated, grammar-specific
    /// `TriviaTransport` enum (see `render_module.ts`); this mock only
    /// needs to prove the macro's leading/trailing/empty control flow,
    /// not any concrete grammar's render output.
    struct MockTrivia(String);

    impl RenderableTransport for MockTrivia {
        fn render_into(&self, dest: &mut dyn Write) -> std::fmt::Result {
            dest.write_str(&self.0)
        }
    }

    struct MockTransportTrivia {
        leading: Option<Vec<MockTrivia>>,
        trailing: Option<Vec<MockTrivia>>,
    }

    struct MockTransport {
        transport_trivia_data: Option<MockTransportTrivia>,
    }

    fn render_mock(_t: &MockTransport, dest: &mut dyn Write) -> std::fmt::Result {
        dest.write_str("CONTENT")
    }

    fn mock_trivia(texts: &[&str]) -> Vec<MockTrivia> {
        texts.iter().map(|t| MockTrivia(t.to_string())).collect()
    }

    #[test]
    fn trivia_macro_no_trivia() {
        let t = MockTransport {
            transport_trivia_data: None,
        };
        let mut buf = String::new();
        let result: std::fmt::Result =
            render_with_trivia!(t, &mut buf, render_mock(&t, &mut buf));
        assert!(result.is_ok());
        assert_eq!(buf, "CONTENT");
    }

    #[test]
    fn trivia_macro_leading() {
        let t = MockTransport {
            transport_trivia_data: Some(MockTransportTrivia {
                leading: Some(mock_trivia(&["// hello"])),
                trailing: None,
            }),
        };
        let mut buf = String::new();
        let result: std::fmt::Result =
            render_with_trivia!(t, &mut buf, render_mock(&t, &mut buf));
        assert!(result.is_ok());
        assert_eq!(buf, "// hello\nCONTENT");
    }

    #[test]
    fn trivia_macro_trailing() {
        let t = MockTransport {
            transport_trivia_data: Some(MockTransportTrivia {
                leading: None,
                trailing: Some(mock_trivia(&["// end"])),
            }),
        };
        let mut buf = String::new();
        let result: std::fmt::Result =
            render_with_trivia!(t, &mut buf, render_mock(&t, &mut buf));
        assert!(result.is_ok());
        assert_eq!(buf, "CONTENT\n// end\n");
    }

    #[test]
    fn trivia_macro_both() {
        let t = MockTransport {
            transport_trivia_data: Some(MockTransportTrivia {
                leading: Some(mock_trivia(&["// top"])),
                trailing: Some(mock_trivia(&["// bottom"])),
            }),
        };
        let mut buf = String::new();
        let result: std::fmt::Result =
            render_with_trivia!(t, &mut buf, render_mock(&t, &mut buf));
        assert!(result.is_ok());
        assert_eq!(buf, "// top\nCONTENT\n// bottom\n");
    }

    #[test]
    fn trivia_macro_multiple_leading() {
        let t = MockTransport {
            transport_trivia_data: Some(MockTransportTrivia {
                leading: Some(mock_trivia(&["// line 1", "// line 2"])),
                trailing: None,
            }),
        };
        let mut buf = String::new();
        let result: std::fmt::Result =
            render_with_trivia!(t, &mut buf, render_mock(&t, &mut buf));
        assert!(result.is_ok());
        assert_eq!(buf, "// line 1\n// line 2\nCONTENT");
    }

    #[test]
    fn trivia_macro_multiple_trailing() {
        let t = MockTransport {
            transport_trivia_data: Some(MockTransportTrivia {
                leading: None,
                trailing: Some(mock_trivia(&["// end 1", "// end 2"])),
            }),
        };
        let mut buf = String::new();
        let result: std::fmt::Result =
            render_with_trivia!(t, &mut buf, render_mock(&t, &mut buf));
        assert!(result.is_ok());
        assert_eq!(buf, "CONTENT\n// end 1\n// end 2\n");
    }

    #[test]
    fn trivia_macro_empty_vecs() {
        let t = MockTransport {
            transport_trivia_data: Some(MockTransportTrivia {
                leading: Some(Vec::<MockTrivia>::new()),
                trailing: Some(Vec::<MockTrivia>::new()),
            }),
        };
        let mut buf = String::new();
        let result: std::fmt::Result =
            render_with_trivia!(t, &mut buf, render_mock(&t, &mut buf));
        assert!(result.is_ok());
        assert_eq!(buf, "CONTENT");
    }
}
