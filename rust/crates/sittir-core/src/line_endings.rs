//! Line endings: how many breaks a text holds, and the one spelling breaks take
//! once they have entered the writer.

use std::borrow::Cow;
use std::fmt;

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

const BREAK_CHARS: [char; 2] = ['\r', '\n'];

/// The byte range of the line of `text` that byte `at` sits on: from after the
/// break before it to the break that ends it, whichever way breaks are spelled.
pub fn line_bounds(text: &str, at: usize) -> (usize, usize) {
    let at = at.min(text.len());
    let start = text[..at].rfind(BREAK_CHARS).map_or(0, |i| i + 1);
    let end = text[start..].find(BREAK_CHARS).map_or(text.len(), |i| start + i);
    (start, end)
}

/// How many bytes follow the last break of `text`; all of it when it holds none.
pub fn bytes_after_last_break(text: &str) -> usize {
    text.rfind(BREAK_CHARS).map_or(text.len(), |i| text.len() - i - 1)
}

/// A `fmt::Write` adapter that writes each logical break of its input as
/// `newline`. A `\r` at the end of one piece is held: when the next piece
/// starts with `\n` the two are one break. Everything that is not a break
/// passes through unchanged. Call `finish` after the last piece to flush a
/// held `\r` as a break.
pub struct LineEndings<'a, W: fmt::Write + ?Sized> {
    out: &'a mut W,
    newline: &'a str,
    held_cr: bool,
}

impl<'a, W: fmt::Write + ?Sized> LineEndings<'a, W> {
    pub fn new(out: &'a mut W, newline: &'a str) -> Self {
        Self { out, newline, held_cr: false }
    }

    pub fn finish(mut self) -> fmt::Result {
        if std::mem::take(&mut self.held_cr) {
            self.out.write_str(self.newline)?;
        }
        Ok(())
    }
}

impl<W: fmt::Write + ?Sized> fmt::Write for LineEndings<'_, W> {
    fn write_str(&mut self, s: &str) -> fmt::Result {
        let mut rest = s;
        if rest.is_empty() {
            return Ok(());
        }
        if std::mem::take(&mut self.held_cr) {
            self.out.write_str(self.newline)?;
            rest = rest.strip_prefix('\n').unwrap_or(rest);
        }
        while let Some(at) = rest.find(['\r', '\n']) {
            self.out.write_str(&rest[..at])?;
            let tail = &rest[at..];
            if tail.starts_with("\r\n") {
                self.out.write_str(self.newline)?;
                rest = &tail[2..];
            } else if tail == "\r" {
                self.held_cr = true;
                return Ok(());
            } else {
                self.out.write_str(self.newline)?;
                rest = &tail[1..];
            }
        }
        self.out.write_str(rest)
    }
}

/// `text` with every break spelled `newline`. Returns `text` itself, without
/// copying, when `newline` is `\n` and the text holds no `\r`.
pub fn spell(text: String, newline: &str) -> String {
    if newline == "\n" && !text.contains('\r') {
        return text;
    }
    let mut out = String::with_capacity(text.len());
    let mut adapter = LineEndings::new(&mut out, newline);
    fmt::Write::write_str(&mut adapter, &text).and_then(|()| adapter.finish()).expect("writing to a String cannot fail");
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fmt::Write;

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

    fn spelled(pieces: &[&str], newline: &str) -> String {
        let mut out = String::new();
        let mut adapter = LineEndings::new(&mut out, newline);
        for piece in pieces {
            adapter.write_str(piece).unwrap();
        }
        adapter.finish().unwrap();
        out
    }

    #[test]
    fn every_spelling_of_a_break_becomes_the_preferred_one() {
        for text in ["a\r\nb", "a\rb", "a\nb"] {
            assert_eq!(spelled(&[text], "\r\n"), "a\r\nb");
            assert_eq!(spelled(&[text], "\n"), "a\nb");
            assert_eq!(spelled(&[text], "\r"), "a\rb");
        }
    }

    #[test]
    fn a_break_split_across_pieces_is_one_break() {
        assert_eq!(spelled(&["# note\r", "\ny"], "\r\n"), "# note\r\ny");
        assert_eq!(spelled(&["# note\r", "\ny"], "\n"), "# note\ny");
        assert_eq!(spelled(&["a\r", "\r", "\nb"], "\n"), "a\n\nb");
    }

    #[test]
    fn a_final_carriage_return_is_flushed_as_one_break() {
        assert_eq!(spelled(&["x\r"], "\r\n"), "x\r\n");
        assert_eq!(spelled(&["x", "\r"], "\n"), "x\n");
    }

    #[test]
    fn text_without_breaks_passes_through() {
        assert_eq!(spelled(&["ab", "cd"], "\r\n"), "abcd");
        assert_eq!(spelled(&[], "\r\n"), "");
    }

    #[test]
    fn spell_keeps_the_allocation_of_an_lf_text_under_lf() {
        let text = String::from("a\nb");
        let before = text.as_ptr();
        let spelled = spell(text, "\n");
        assert_eq!(spelled, "a\nb");
        assert_eq!(spelled.as_ptr(), before);
        assert_eq!(spell(String::from("a\nb"), "\r\n"), "a\r\nb");
        assert_eq!(spell(String::from("a\r\nb"), "\n"), "a\nb");
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
        assert_eq!(bytes_after_last_break("  "), 2);
        assert_eq!(line_bounds("", 5), (0, 0));
    }
}
