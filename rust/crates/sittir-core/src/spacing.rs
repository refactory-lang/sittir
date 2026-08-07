//! SpacingWriter — render-time word-boundary spacing.
//!
//! Implements docs/superpowers/specs/2026-07-24-spacing-writer-design.md:
//! insert a space at any write seam where a word-class character would
//! collide with a word-class character. If two word-class characters from
//! different tokens were ever legally adjacent in output, the lexer would
//! have merged them into one token — so the insert is the definition of
//! tokenization, not a heuristic. Style spaces stay in template literals;
//! this writer supplies only lexically-required spaces at dynamic seams.
//!
//! Wrap the destination ONCE at the root render call. Wrapping per
//! nesting level instead monomorphizes recursive render paths into an
//! infinitely growing wrapper type (E0275) — don't.

/// Per-grammar word-character class. An ASCII table plus a fallback for
/// `char >= 0x80` (Unicode identifiers). A full regex engine is not needed
/// for a single-char class test.
pub struct WordMatcher {
    ascii: [bool; 128],
    unicode_fallback: fn(char) -> bool,
    /// Characters that participate in some multi-character anonymous token
    /// of this grammar (e.g. rust's `.` and `=` from `..`/`..=`/`=>`).
    /// Two such characters adjacent at a write seam risk the SAME
    /// maximal-munch collision the word-class check guards against: a
    /// longer real token could start where the two writes meet. Derived at
    /// emit time from the grammar's own anonymous-literal inventory — see
    /// `WordMatcher::new` callers — never hand-picked.
    symbol_ascii: [bool; 128],
}

impl WordMatcher {
    pub const fn new(ascii: [bool; 128], unicode_fallback: fn(char) -> bool) -> Self {
        Self {
            ascii,
            unicode_fallback,
            symbol_ascii: [false; 128],
        }
    }

    pub const fn with_symbol_class(mut self, symbol_ascii: [bool; 128]) -> Self {
        self.symbol_ascii = symbol_ascii;
        self
    }

    /// The default identifier class shared by the rust/typescript/python
    /// grammars: `[A-Za-z0-9_]` plus Unicode alphanumerics. Per-grammar
    /// tables derived from the Link-pinned `wordMatcher` can replace this
    /// via `WordMatcher::new` without touching call sites.
    pub fn default_ident() -> &'static WordMatcher {
        static DEFAULT: WordMatcher = WordMatcher::new(default_ascii_table(), char::is_alphanumeric);
        &DEFAULT
    }

    #[inline]
    pub fn is_word(&self, c: char) -> bool {
        if (c as u32) < 128 {
            self.ascii[c as usize]
        } else {
            (self.unicode_fallback)(c)
        }
    }

    #[inline]
    pub fn is_symbol_char(&self, c: char) -> bool {
        (c as u32) < 128 && self.symbol_ascii[c as usize]
    }
}

const fn default_ascii_table() -> [bool; 128] {
    let mut t = [false; 128];
    let mut i = 0u8;
    while i < 128 {
        t[i as usize] = (i >= b'a' && i <= b'z') || (i >= b'A' && i <= b'Z') || (i >= b'0' && i <= b'9') || i == b'_';
        i += 1;
    }
    t
}

/// Streaming writer inserting lexically-required spaces at write seams.
/// See the module doc. Inert under templates that carry their own spaces:
/// a seam following `"fn "` has `last = ' '` (not word-class) → no insert.
pub struct SpacingWriter<'a, W: std::fmt::Write + ?Sized> {
    inner: &'a mut W,
    last: Option<char>,
    word: &'a WordMatcher,
}

impl<'a, W: std::fmt::Write + ?Sized> SpacingWriter<'a, W> {
    pub fn new(inner: &'a mut W, word: &'a WordMatcher) -> Self {
        Self {
            inner,
            last: None,
            word,
        }
    }
}

impl<W: std::fmt::Write + ?Sized> std::fmt::Write for SpacingWriter<'_, W> {
    fn write_str(&mut self, s: &str) -> std::fmt::Result {
        let Some(first) = s.chars().next() else {
            return Ok(()); // empty write: context untouched
        };
        if let Some(last) = self.last {
            let word_seam = self.word.is_word(last) && self.word.is_word(first);
            // Identical-char seams (e.g. `>` closing nested generics in
            // `Vec<Vec<T>>`) are excluded: a real doubled-char token like
            // rust's `>>` shift operator only exists as its own grammar
            // rule with its own disambiguation context, not as a blind
            // concatenation hazard — spacing every repeated symbol char
            // would make already-common, unambiguous constructs noisy for
            // no correctness gain.
            let symbol_seam = last != first
                && self.word.is_symbol_char(last)
                && self.word.is_symbol_char(first);
            if word_seam || symbol_seam {
                self.inner.write_str(" ")?;
            }
        }
        self.inner.write_str(s)?;
        self.last = s.chars().next_back();
        Ok(())
    }

    fn write_char(&mut self, c: char) -> std::fmt::Result {
        let mut buf = [0u8; 4];
        self.write_str(c.encode_utf8(&mut buf))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fmt::Write;

    fn spaced(parts: &[&str]) -> String {
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident());
        for p in parts {
            w.write_str(p).unwrap();
        }
        out
    }

    #[test]
    fn word_word_seam_inserts() {
        assert_eq!(spaced(&["pub", "fn"]), "pub fn");
    }

    #[test]
    fn word_punct_seam_does_not_insert() {
        assert_eq!(spaced(&["pub", "("]), "pub(");
        assert_eq!(spaced(&[")", "foo"]), ")foo");
    }

    #[test]
    fn existing_space_is_inert() {
        assert_eq!(spaced(&["fn ", "main"]), "fn main");
    }

    #[test]
    fn newline_seam_does_not_insert() {
        assert_eq!(spaced(&["x = 1\n", "y"]), "x = 1\ny");
    }

    #[test]
    fn empty_write_keeps_context() {
        assert_eq!(spaced(&["pub", "", "fn"]), "pub fn");
    }

    #[test]
    fn digits_and_underscore_are_word() {
        assert_eq!(spaced(&["x1", "y2"]), "x1 y2");
        assert_eq!(spaced(&["_a", "_b"]), "_a _b");
    }

    // A small symbol class covering rust's `.`/`=`/`>` — enough to exercise
    // seam behavior without depending on the real emitted per-grammar table.
    fn with_dot_eq_gt_symbol_class() -> WordMatcher {
        let mut ascii = [false; 128];
        ascii[b'.' as usize] = true;
        ascii[b'=' as usize] = true;
        ascii[b'>' as usize] = true;
        WordMatcher::new(default_ascii_table(), char::is_alphanumeric).with_symbol_class(ascii)
    }

    fn spaced_with(word: &WordMatcher, parts: &[&str]) -> String {
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, word);
        for p in parts {
            w.write_str(p).unwrap();
        }
        out
    }

    #[test]
    fn symbol_symbol_seam_inserts() {
        let word = with_dot_eq_gt_symbol_class();
        // `d..` (bare range-to-end pattern) immediately followed by `=>`
        // would re-lex as `..=` + a dangling `>` without this insert.
        assert_eq!(spaced_with(&word, &["..", "=>"]), ".. =>");
    }

    #[test]
    fn identical_symbol_seam_does_not_insert() {
        let word = with_dot_eq_gt_symbol_class();
        // Closing nested generics (`Vec<Vec<T>>`) must stay tight — a real
        // doubled-char token like `>>` only exists in its own disambiguated
        // grammar rule, not as a blind concatenation hazard.
        assert_eq!(spaced_with(&word, &[">", ">"]), ">>");
    }

    #[test]
    fn symbol_word_seam_does_not_insert() {
        let word = with_dot_eq_gt_symbol_class();
        assert_eq!(spaced_with(&word, &["=>", "a"]), "=>a");
        assert_eq!(spaced_with(&word, &["pub", "("]), "pub(");
    }

    #[test]
    fn default_matcher_has_no_symbol_class() {
        // WordMatcher::default_ident() carries an empty symbol class —
        // grammars opt in via with_symbol_class at emit time.
        assert_eq!(spaced(&["..", "=>"]), "..=>");
    }
}
