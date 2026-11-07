//! Line endings: how many breaks a text holds, and the one spelling breaks take
//! once they have entered the writer.

use std::borrow::Cow;

/// The number of line breaks in `text`: `\r\n` is one, a lone `\r` is one and
/// `\n` is one. Every count of breaks (a seam's rank, a source gap's class) goes
/// through this function.
#[must_use]
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
#[must_use]
pub fn to_internal(text: &str) -> Cow<'_, str> {
    #[cfg(test)]
    SCANS.with(|scans| scans.set(scans.get() + 1));
    if !text.contains('\r') {
        return Cow::Borrowed(text);
    }
    Cow::Owned(text.replace("\r\n", "\n").replace('\r', "\n"))
}

/// `text` without a `\r` that ends it. Such a `\r` is the first half of a
/// `\r\n` whose `\n` lies outside the token (a line comment's pattern takes
/// the `\r`), and the break is written by whatever follows the token, as it is
/// for a source that spells its breaks `\n`. Where the text is a slice of a
/// source, the caller applies it only when a `\n` follows in that source;
/// a text with no source (a trivia entry's content) cannot tell, and applies it.
#[must_use]
pub fn without_swallowed_cr(text: &str) -> &str {
    text.strip_suffix('\r').unwrap_or(text)
}

const BREAK_CHARS: [char; 2] = ['\r', '\n'];

/// The byte range of the line of `text` that byte `at` sits on: from after the
/// break before it to the break that ends it, whichever way breaks are spelled.
#[must_use]
pub fn line_bounds(text: &str, at: usize) -> (usize, usize) {
    let at = at.min(text.len());
    let start = text[..at].rfind(BREAK_CHARS).map_or(0, |i| i + 1);
    let end = text[start..].find(BREAK_CHARS).map_or(text.len(), |i| start + i);
    (start, end)
}

/// How many bytes follow the last break of `text`; none when it holds no break.
#[must_use]
pub fn bytes_after_last_break(text: &str) -> usize {
    text.rfind(BREAK_CHARS).map_or(0, |i| text.len() - i - 1)
}

/// `text`, as the writer wrote it, with every break spelled `newline`.
/// Every text enters the writer through `to_internal` or as a slice of a
/// source that holds no `\r`, so the writer's text spells each break `\n`
/// and is returned as it is, uncopied and unscanned, when `newline` is `\n`.
#[must_use]
pub fn spell(text: String, newline: &str) -> String {
    debug_assert!(!text.contains('\r'), "the writer spells every break `\\n`");
    if newline == "\n" {
        return text;
    }
    text.replace('\n', newline)
}

#[cfg(test)]
thread_local! {
    /// The texts `to_internal` has scanned on this thread.
    pub(crate) static SCANS: std::cell::Cell<usize> = const { std::cell::Cell::new(0) };
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
        assert_eq!(to_internal("# note\r"), "# note\n");
        assert_eq!(to_internal("a\r\n"), "a\n");
        assert!(matches!(to_internal("a\nb"), Cow::Borrowed(_)));
        assert!(matches!(to_internal(""), Cow::Borrowed(_)));
    }

    #[test]
    fn spell_keeps_the_allocation_of_an_lf_text_under_lf() {
        let text = String::from("a\nb");
        let before = text.as_ptr();
        let spelled = spell(text, "\n");
        assert_eq!(spelled, "a\nb");
        assert_eq!(spelled.as_ptr(), before);
        assert_eq!(spell(String::from("a\nb\n"), "\r\n"), "a\r\nb\r\n");
        assert_eq!(spell(String::from("a\nb"), "\r"), "a\rb");
        assert_eq!(spell(String::from("ab"), "\r\n"), "ab");
    }

    #[test]
    fn only_a_carriage_return_that_ends_the_text_is_swallowed() {
        assert_eq!(without_swallowed_cr("# note\r"), "# note");
        assert_eq!(without_swallowed_cr("a\rb"), "a\rb");
        assert_eq!(without_swallowed_cr("a\r\n"), "a\r\n");
        assert_eq!(without_swallowed_cr(""), "");
    }

    #[test]
    fn a_line_is_bounded_by_whichever_break_spells_it() {
        for ending in ["\n", "\r\n", "\r"] {
            let text = format!("ab{ending}cd{ending}ef");
            let at = text.find("cd").unwrap() + 1;
            let (start, end) = line_bounds(&text, at);
            assert_eq!(&text[start..end], "cd", "{ending:?}");
            assert_eq!(bytes_after_last_break(&format!("{ending}    ")), 4, "{ending:?}");
        }
        assert_eq!(bytes_after_last_break("  "), 0);
        assert_eq!(line_bounds("", 5), (0, 0));
    }
}
