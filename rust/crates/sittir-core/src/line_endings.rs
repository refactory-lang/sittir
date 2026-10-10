//! Line endings: how many breaks a text holds, and the one spelling breaks take
//! once they have entered the writer.

use std::borrow::Cow;

/// The number of line breaks in `text`: `\r\n` is one, a lone `\r` is one and
/// `\n` is one. Every count of breaks (a seam's rank, a source gap's class) goes
/// through this function.
pub fn logical_breaks(text: &str) -> usize {
    let bytes = text.as_bytes();
    (0..bytes.len())
        .filter(|&i| bytes[i] == b'\n' || (bytes[i] == b'\r' && bytes.get(i + 1) != Some(&b'\n')))
        .count()
}

/// `text` with every break spelled `\n`, the spelling the writer, the node map
/// and the generated tables share. Borrows when the text holds no `\r`. Source
/// text passes through it where it enters the writer, so line-start and
/// indentation decisions only ever see `\n`.
pub fn to_internal(text: &str) -> Cow<'_, str> {
    if !text.contains('\r') {
        return Cow::Borrowed(text);
    }
    Cow::Owned(text.replace("\r\n", "\n").replace('\r', "\n"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn breaks_are_counted_logically() {
        assert_eq!(logical_breaks(""), 0);
        assert_eq!(logical_breaks("a\nb"), 1);
        assert_eq!(logical_breaks("a\r\nb"), 1);
        assert_eq!(logical_breaks("a\rb"), 1);
        assert_eq!(logical_breaks("\r\n\r\n"), 2);
        assert_eq!(logical_breaks("\r\r\n\n"), 3);
    }

    #[test]
    fn every_break_enters_as_one_spelling_and_lf_text_is_borrowed() {
        assert_eq!(to_internal("a\r\nb\rc\nd"), "a\nb\nc\nd");
        assert!(matches!(to_internal("a\nb"), Cow::Borrowed(_)));
        assert!(matches!(to_internal(""), Cow::Borrowed(_)));
    }
}
