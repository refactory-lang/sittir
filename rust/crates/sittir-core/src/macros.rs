//! Exported macros for the sittir render pipeline.
//!
//! `render_with_trivia!` is the canonical way to wrap a transport's
//! render call with leading/trailing trivia text. Used by every
//! struct-based `RenderableTransport::render_into` impl in grammar crates.

/// Wraps a transport render call with trivia (leading/trailing comment text).
/// Streams directly to `dest` — no intermediate buffer for trivia.
///
/// # Usage
///
/// In every struct-based `RenderableTransport::render_into` impl:
///
/// ```rust,ignore
/// fn render_into(&self, dest: &mut dyn std::fmt::Write) -> Result<(), ::askama::Error> {
///     render_with_trivia!(self, dest, render_xxx(self, dest))
/// }
/// ```
///
/// # Parameters
///
/// - `$self` — the transport struct (must have a `transport_trivia_data: Option<TransportTrivia>` field)
/// - `$dest` — the `&mut dyn Write` target
/// - `$render` — the actual render expression (returns `Result<(), ::askama::Error>`)
///
/// # Returns
///
/// `Result<(), ::askama::Error>` — propagates errors from both trivia writes and the inner render.
///
/// # Notes
///
/// - Bool/enum transport variants don't have `transport_trivia_data` — those
///   write directly to dest and don't use this macro.
/// - Double-underscore prefixed variable names avoid shadowing caller variables.
#[macro_export]
macro_rules! render_with_trivia {
    ($self:expr, $dest:expr, $render:expr) => {
        (|| -> Result<(), ::askama::Error> {
            if let Some(ref __trivia) = $self.transport_trivia_data {
                if let Some(ref __leading) = __trivia.leading {
                    for __text in __leading {
                        $dest.write_str(__text).map_err(::askama::Error::from)?;
                        $dest.write_str("\n").map_err(::askama::Error::from)?;
                    }
                }
            }
            $render?;
            if let Some(ref __trivia) = $self.transport_trivia_data {
                if let Some(ref __trailing) = __trivia.trailing {
                    for __text in __trailing {
                        $dest.write_str("\n").map_err(::askama::Error::from)?;
                        $dest.write_str(__text).map_err(::askama::Error::from)?;
                    }
                }
            }
            Ok(())
        })()
    };
}

#[cfg(test)]
mod trivia_macro_tests {
    use crate::types::TransportTrivia;
    use std::fmt::Write;

    struct MockTransport {
        transport_trivia_data: Option<TransportTrivia>,
    }

    fn render_mock(_t: &MockTransport, dest: &mut dyn Write) -> Result<(), ::askama::Error> {
        dest.write_str("CONTENT").map_err(::askama::Error::from)
    }

    #[test]
    fn trivia_macro_no_trivia() {
        let t = MockTransport {
            transport_trivia_data: None,
        };
        let mut buf = String::new();
        let result: Result<(), ::askama::Error> =
            render_with_trivia!(t, buf, render_mock(&t, &mut buf));
        assert!(result.is_ok());
        assert_eq!(buf, "CONTENT");
    }

    #[test]
    fn trivia_macro_leading() {
        let t = MockTransport {
            transport_trivia_data: Some(TransportTrivia {
                leading: Some(vec!["// hello".to_string()]),
                trailing: None,
            }),
        };
        let mut buf = String::new();
        let result: Result<(), ::askama::Error> =
            render_with_trivia!(t, buf, render_mock(&t, &mut buf));
        assert!(result.is_ok());
        assert_eq!(buf, "// hello\nCONTENT");
    }

    #[test]
    fn trivia_macro_trailing() {
        let t = MockTransport {
            transport_trivia_data: Some(TransportTrivia {
                leading: None,
                trailing: Some(vec!["// end".to_string()]),
            }),
        };
        let mut buf = String::new();
        let result: Result<(), ::askama::Error> =
            render_with_trivia!(t, buf, render_mock(&t, &mut buf));
        assert!(result.is_ok());
        assert_eq!(buf, "CONTENT\n// end");
    }

    #[test]
    fn trivia_macro_both() {
        let t = MockTransport {
            transport_trivia_data: Some(TransportTrivia {
                leading: Some(vec!["// top".to_string()]),
                trailing: Some(vec!["// bottom".to_string()]),
            }),
        };
        let mut buf = String::new();
        let result: Result<(), ::askama::Error> =
            render_with_trivia!(t, buf, render_mock(&t, &mut buf));
        assert!(result.is_ok());
        assert_eq!(buf, "// top\nCONTENT\n// bottom");
    }

    #[test]
    fn trivia_macro_multiple_leading() {
        let t = MockTransport {
            transport_trivia_data: Some(TransportTrivia {
                leading: Some(vec![
                    "// line 1".to_string(),
                    "// line 2".to_string(),
                ]),
                trailing: None,
            }),
        };
        let mut buf = String::new();
        let result: Result<(), ::askama::Error> =
            render_with_trivia!(t, buf, render_mock(&t, &mut buf));
        assert!(result.is_ok());
        assert_eq!(buf, "// line 1\n// line 2\nCONTENT");
    }

    #[test]
    fn trivia_macro_multiple_trailing() {
        let t = MockTransport {
            transport_trivia_data: Some(TransportTrivia {
                leading: None,
                trailing: Some(vec![
                    "// end 1".to_string(),
                    "// end 2".to_string(),
                ]),
            }),
        };
        let mut buf = String::new();
        let result: Result<(), ::askama::Error> =
            render_with_trivia!(t, buf, render_mock(&t, &mut buf));
        assert!(result.is_ok());
        assert_eq!(buf, "CONTENT\n// end 1\n// end 2");
    }

    #[test]
    fn trivia_macro_empty_vecs() {
        let t = MockTransport {
            transport_trivia_data: Some(TransportTrivia {
                leading: Some(vec![]),
                trailing: Some(vec![]),
            }),
        };
        let mut buf = String::new();
        let result: Result<(), ::askama::Error> =
            render_with_trivia!(t, buf, render_mock(&t, &mut buf));
        assert!(result.is_ok());
        assert_eq!(buf, "CONTENT");
    }
}
