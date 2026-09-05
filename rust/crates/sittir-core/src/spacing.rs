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
    /// Ordered pairs of DIFFERING punctuation characters that appear
    /// adjacent inside some multi-character anonymous token of this
    /// grammar (e.g. rust's `('.', '=')` from `..=`). A seam whose
    /// boundary chars form such a pair risks a maximal-munch collision:
    /// the lexer's munch continues across the seam exactly when some real
    /// token contains that transition (`..` + `=>` re-lexes as `..=` plus
    /// a dangling `>`). A pair occurring in NO token (`!`+`[` in rust's
    /// `#![...]`, `:`+`<` in the turbofish `::<`) cannot extend any munch
    /// and stays tight. Derived at emit time from the grammar's own
    /// anonymous-literal inventory (shared.ts `literalMergePairs`) — never
    /// hand-picked.
    literal_merge_pairs: &'static [(u8, u8)],
}

impl WordMatcher {
    pub const fn new(ascii: [bool; 128], unicode_fallback: fn(char) -> bool) -> Self {
        Self {
            ascii,
            unicode_fallback,
            literal_merge_pairs: &[],
        }
    }

    pub const fn with_literal_merge_pairs(mut self, literal_merge_pairs: &'static [(u8, u8)]) -> Self {
        self.literal_merge_pairs = literal_merge_pairs;
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
    pub fn is_literal_merge_pair(&self, left: char, right: char) -> bool {
        if (left as u32) >= 128 || (right as u32) >= 128 {
            return false;
        }
        let (l, r) = (left as u8, right as u8);
        self.literal_merge_pairs.iter().any(|&(a, b)| a == l && b == r)
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
/// The in-band adjacency mark: "no seam space may be inserted before
/// the text that follows this character". It travels IN the stream,
/// written by whoever knows the fact — generated render code for an
/// immediate-stamped token, or a template literal at a boundary codegen
/// resolved as statically glued — so its position is exactly the write
/// order, whatever `fmt::Write`/`Display`/askama chokepoints sit between
/// the writer of the fact and the root `SpacingWriter`. U+FFFE is a
/// Unicode noncharacter: it is invalid in interchange, so no source text
/// can carry it and the writer strips it without ambiguity.
pub const ADJACENT: char = '\u{FFFE}';
pub const ADJACENT_STR: &str = "\u{FFFE}";

/// Write the adjacency mark to `dest`: the next text written begins an
/// immediate token.
pub fn mark_adjacent(dest: &mut dyn std::fmt::Write) -> std::fmt::Result {
    dest.write_str(ADJACENT_STR)
}

/// Indentation marks: noncharacters like [`ADJACENT`], stripped by the
/// writer. `INDENT` deepens the indentation by one unit and `DEDENT`
/// shallows it; each is followed by the newline it implies, so a whitespace
/// kind that renders `INDENT_NEWLINE` reads "go one level deeper, then break".
pub const INDENT: char = '\u{FDD0}';
pub const DEDENT: char = '\u{FDD1}';
pub const INDENT_NEWLINE: &str = "\u{FDD0}\n";
pub const DEDENT_NEWLINE: &str = "\u{FDD1}\n";

/// The indentation unit a writer uses when none is configured.
pub const DEFAULT_INDENT: &str = "    ";

/// a seam following `"fn "` has `last = ' '` (not word-class) → no insert.
pub struct SpacingWriter<'a, W: std::fmt::Write + ?Sized> {
    inner: &'a mut W,
    last: Option<char>,
    adjacent_next: bool,
    word: &'a WordMatcher,
    indent: &'a str,
    depth: usize,
    indent_pending: bool,
}

impl<'a, W: std::fmt::Write + ?Sized> SpacingWriter<'a, W> {
    pub fn new(inner: &'a mut W, word: &'a WordMatcher) -> Self {
        Self {
            inner,
            last: None,
            adjacent_next: false,
            word,
            indent: DEFAULT_INDENT,
            depth: 0,
            indent_pending: false,
        }
    }

    /// The text written once per depth level after every newline.
    pub fn with_indent(mut self, indent: &'a str) -> Self {
        self.indent = indent;
        self
    }

    /// Indentation is deferred: a newline arms it, and the first text that is
    /// not itself a newline pays it at the depth current at that moment, so a
    /// dedent between the newline and a closing delimiter puts the delimiter
    /// at the outer depth and blank lines carry no trailing spaces.
    fn pay_indent(&mut self, first: char) -> std::fmt::Result {
        if !self.indent_pending || first == '\n' {
            return Ok(());
        }
        self.indent_pending = false;
        for _ in 0..self.depth {
            self.inner.write_str(self.indent)?;
        }
        if self.depth > 0 {
            self.last = self.indent.chars().next_back();
        }
        Ok(())
    }

    /// One mark-free chunk. A statically spaced seam is not a seam: when
    /// either flank is whitespace there is nothing to decide. Otherwise a
    /// pending adjacency mark suppresses the check for this chunk only;
    /// `last` is always updated from the real text so the first NORMAL
    /// seam after an adjacent run sees the true preceding character.
    fn write_chunk(&mut self, s: &str) -> std::fmt::Result {
        let Some(first) = s.chars().next() else {
            return Ok(()); // empty write: context untouched (mark survives too)
        };
        let adjacent = std::mem::replace(&mut self.adjacent_next, false);
        self.pay_indent(first)?;
        if let Some(last) = self.last {
            if !adjacent && !last.is_whitespace() && !first.is_whitespace() {
                let word_seam = self.word.is_word(last) && self.word.is_word(first);
                // Identical-char seams (e.g. `>` closing nested generics in
                // `Vec<Vec<T>>`) are excluded (never in `literal_merge_pairs`): a real
                // doubled-char token like rust's `>>` shift operator only
                // exists as its own grammar rule with its own disambiguation
                // context, not as a blind concatenation hazard — spacing every
                // repeated symbol char would make already-common, unambiguous
                // constructs noisy for no correctness gain.
                let symbol_seam = last != first && self.word.is_literal_merge_pair(last, first);
                if word_seam || symbol_seam {
                    self.inner.write_str(" ")?;
                }
            }
        }
        self.inner.write_str(s)?;
        self.last = s.chars().next_back();
        if self.last == Some('\n') {
            self.indent_pending = true;
        }
        Ok(())
    }

    fn take_mark(&mut self, mark: char) {
        match mark {
            ADJACENT => self.adjacent_next = true,
            INDENT => self.depth += 1,
            DEDENT => self.depth = self.depth.saturating_sub(1),
            _ => unreachable!("not a writer mark"),
        }
    }
}

fn is_mark(c: char) -> bool {
    c == ADJACENT || c == INDENT || c == DEDENT
}

impl<W: std::fmt::Write + ?Sized> std::fmt::Write for SpacingWriter<'_, W> {
    /// Splits the incoming text at every adjacency mark: the text before a
    /// mark is an ordinary chunk, the mark itself arms `adjacent_next` for
    /// whatever non-empty text comes next (in this call or a later one),
    /// and the mark never reaches the sink.
    fn write_str(&mut self, s: &str) -> std::fmt::Result {
        let mut rest = s;
        while let Some(i) = rest.find(is_mark) {
            self.write_chunk(&rest[..i])?;
            let mark = rest[i..].chars().next().expect("a mark was found");
            self.take_mark(mark);
            rest = &rest[i + mark.len_utf8()..];
        }
        self.write_chunk(rest)
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

    // A small literal-merge-pair set matching rust's `..=`/`=>` token transitions —
    // enough to exercise seam behavior without depending on the real emitted
    // per-grammar table.
    fn with_range_arrow_pairs() -> WordMatcher {
        WordMatcher::new(default_ascii_table(), char::is_alphanumeric)
            .with_literal_merge_pairs(&[(b'.', b'='), (b'=', b'>')])
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
    fn literal_merge_seam_inserts() {
        let word = with_range_arrow_pairs();
        // `d..` (bare range-to-end pattern) immediately followed by `=>`
        // would re-lex as `..=` + a dangling `>` without this insert — the
        // `.`→`=` transition exists inside the `..=` token.
        assert_eq!(spaced_with(&word, &["..", "=>"]), ".. =>");
    }

    #[test]
    fn non_merge_symbol_seam_does_not_insert() {
        let word = with_range_arrow_pairs();
        // Differing punctuation whose transition occurs in NO token stays
        // tight: `>` then `.` (method call on a generic result) cannot
        // extend any munch.
        assert_eq!(spaced_with(&word, &[">", "."]), ">.");
    }

    #[test]
    fn identical_symbol_seam_does_not_insert() {
        let word = with_range_arrow_pairs();
        // Closing nested generics (`Vec<Vec<T>>`) must stay tight — a real
        // doubled-char token like `>>` only exists in its own disambiguated
        // grammar rule, not as a blind concatenation hazard.
        assert_eq!(spaced_with(&word, &[">", ">"]), ">>");
    }

    #[test]
    fn symbol_word_seam_does_not_insert() {
        let word = with_range_arrow_pairs();
        assert_eq!(spaced_with(&word, &["=>", "a"]), "=>a");
        assert_eq!(spaced_with(&word, &["pub", "("]), "pub(");
    }

    #[test]
    fn default_matcher_has_no_literal_merge_pairs() {
        // WordMatcher::default_ident() carries an empty pair set —
        // grammars opt in via with_literal_merge_pairs at emit time.
        assert_eq!(spaced(&["..", "=>"]), "..=>");
    }
}

#[cfg(test)]
mod adjacent_tests {
    use super::*;
    use std::fmt::Write;

    #[test]
    fn marked_chunk_suppresses_word_word_seam() {
        // A string fragment following an escape: `\n` then `b` — both
        // word-class flanks, but the boundary is grammar-immediate.
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident());
        w.write_str("a").unwrap();
        w.write_str(ADJACENT_STR).unwrap();
        w.write_str("\\n").unwrap();
        w.write_str(ADJACENT_STR).unwrap();
        w.write_str("b").unwrap();
        assert_eq!(out, "a\\nb");
    }

    #[test]
    fn mark_is_consumed_by_one_chunk_only() {
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident());
        w.write_str("pub").unwrap();
        w.write_str(ADJACENT_STR).unwrap();
        w.write_str("x").unwrap();
        w.write_str("fn").unwrap();
        assert_eq!(out, "pubx fn");
    }

    #[test]
    fn mark_updates_last_char_state() {
        // The first NORMAL seam after an adjacent run must be computed
        // against the run's true final character, not stale state.
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident());
        w.write_str("(").unwrap();
        w.write_str(ADJACENT_STR).unwrap();
        w.write_str("d").unwrap();
        w.write_str("if").unwrap();
        assert_eq!(out, "(d if");
    }

    #[test]
    fn mark_inside_one_chunk_is_split_and_stripped() {
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident());
        w.write_str("from\u{FFFE}").unwrap();
        w.write_str("x").unwrap();
        w.write_str("a\u{FFFE}b").unwrap();
        assert_eq!(out, "fromx ab");
    }

    #[test]
    fn whitespace_flank_is_not_a_seam() {
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident());
        w.write_str("fn ").unwrap();
        w.write_str("main").unwrap();
        w.write_str("\n").unwrap();
        w.write_str("x").unwrap();
        assert_eq!(out, "fn main\nx");
    }

    #[test]
    fn mark_before_empty_write_survives_for_next_chunk() {
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident());
        w.write_str("a").unwrap();
        w.write_str(ADJACENT_STR).unwrap();
        w.write_str("").unwrap();
        w.write_str("b").unwrap();
        assert_eq!(out, "ab");
    }
    #[test]
    fn indent_marks_move_the_depth_and_a_newline_pays_it_on_the_next_text() {
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident());
        w.write_str("{").unwrap();
        w.write_str(INDENT_NEWLINE).unwrap();
        w.write_str("a").unwrap();
        w.write_str("\n").unwrap();
        w.write_str("b").unwrap();
        w.write_str(DEDENT_NEWLINE).unwrap();
        w.write_str("}").unwrap();
        assert_eq!(out, "{\n    a\n    b\n}");
    }

    #[test]
    fn nested_indentation_uses_the_configured_unit_and_blank_lines_stay_empty() {
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident()).with_indent("  ");
        w.write_str("a").unwrap();
        w.write_str(INDENT_NEWLINE).unwrap();
        w.write_str("b").unwrap();
        w.write_str(INDENT_NEWLINE).unwrap();
        w.write_str("\n").unwrap();
        w.write_str("c").unwrap();
        w.write_str(DEDENT_NEWLINE).unwrap();
        w.write_str(DEDENT_NEWLINE).unwrap();
        w.write_str("d").unwrap();
        assert_eq!(out, "a\n  b\n\n    c\n\nd");
    }

    #[test]
    fn a_dedent_below_zero_saturates_and_marks_never_reach_the_sink() {
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident());
        w.write_str(DEDENT_NEWLINE).unwrap();
        w.write_str("x").unwrap();
        w.write_str(INDENT_NEWLINE).unwrap();
        w.write_str("y").unwrap();
        assert_eq!(out, "\nx\n    y");
        assert!(!out.contains(INDENT) && !out.contains(DEDENT));
    }

}
