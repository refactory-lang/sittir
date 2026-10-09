//! SpacingWriter — a `RenderSink` that inserts render-time word-boundary
//! spacing and resolves whitespace sites against a grammar's
//! `WhitespaceTable`.
//!
//! Insert a space at any write seam where a word-class character would
//! collide with a word-class character. If two word-class characters from
//! different tokens were ever legally adjacent in output, the lexer would
//! have merged them into one token — so the insert is the definition of
//! tokenization, not a heuristic. Style spaces stay in template literals;
//! this writer supplies only lexically-required spaces at dynamic seams.
//!
//! Every other whitespace decision — a site's arm, a fixed seam, a
//! whitespace token, depth — arrives as a `RenderSink` method call, never as
//! a character in the text stream: `site` resolves an id through the
//! attached `WhitespaceTable`, `seam`/`token_seam` hold a payload that
//! coalesces to the widest of what a run of calls asks for, and
//! `indent`/`dedent` move the depth the next line is paid at. Literal text
//! is never part of this coalescing, even when it is itself whitespace.
//!
//! Wrap the destination ONCE at the root render call. Wrapping per
//! nesting level instead monomorphizes recursive render paths into an
//! infinitely growing wrapper type (E0275) — don't.
use crate::layout_kinds::LayoutKinds;


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

    pub const fn with_literal_merge_pairs(
        mut self,
        literal_merge_pairs: &'static [(u8, u8)],
    ) -> Self {
        self.literal_merge_pairs = literal_merge_pairs;
        self
    }

    /// The default identifier class shared by the rust/typescript/python
    /// grammars: `[A-Za-z0-9_]` plus Unicode alphanumerics. Per-grammar
    /// tables derived from the Link-pinned `wordMatcher` can replace this
    /// via `WordMatcher::new` without touching call sites.
    pub fn default_ident() -> &'static WordMatcher {
        static DEFAULT: WordMatcher =
            WordMatcher::new(default_ascii_table(), char::is_alphanumeric);
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
        self.literal_merge_pairs
            .iter()
            .any(|&(a, b)| a == l && b == r)
    }
}

const fn default_ascii_table() -> [bool; 128] {
    let mut t = [false; 128];
    let mut i = 0u8;
    while i < 128 {
        t[i as usize] = (i >= b'a' && i <= b'z')
            || (i >= b'A' && i <= b'Z')
            || (i >= b'0' && i <= b'9')
            || i == b'_';
        i += 1;
    }
    t
}

/// A seam mark's payload, ranked so two consecutive payloads coalesce to
/// the higher-ranked: a run of spaces, then no whitespace at all, then a
/// run by how many lines it breaks. Tight beats space (a declared "glue
/// here" is the specific intent; an undeclared space only says "no word
/// glued here"), and a line break beats both — whitespace that carries
/// line structure is never swallowed by a tight or space seam meeting it.
/// A blank line outranks a plain newline, and two blank lines outrank one,
/// so a separator asking for more survives meeting a kind edge that asks
/// for less. Depth marks (indent/dedent) rank above all of this and are
/// carried on `depth`/`indent_pending`, never through this scale.
pub type SeamRank = usize;

/// How firmly a mark holds its gap against the mark meeting it there. A
/// whitespace trivia entry beats everything: it replaces the gap's default.
/// A declared arm (a grammar row, or a value set on the node) beats one the
/// kind edge took from its edge token's face (cascade), which beats the bare
/// fallback; rank decides only between marks of one strength. Depth marks
/// stay above the whole scale.
pub const SEAM_FALLBACK: u8 = 0;
pub const SEAM_CASCADE: u8 = 1;
pub const SEAM_DECLARED: u8 = 2;
pub const SEAM_TRIVIA: u8 = 3;

pub fn seam_rank(text: &str) -> SeamRank {
    match text.matches('\n').count() {
        0 if text.is_empty() => 2,
        0 => 1,
        breaks => 2 + breaks,
    }
}

/// Streaming writer inserting lexically-required spaces at write seams.
/// See the module doc. Every whitespace decision reaches the writer as a
/// `RenderSink` call, never as a character in the text stream.
///
/// a seam following `"fn "` has `last = ' '` (not word-class) → no insert.
pub struct SpacingWriter<'a, W: std::fmt::Write + ?Sized> {
    inner: &'a mut W,
    last: Option<char>,
    word: &'a WordMatcher,
    table: Option<&'a crate::render::WhitespaceTable>,
    indent: &'a str,
    depth: usize,
    /// For each open depth level, how many further opens asked for it at the
    /// position it opened (`indent` while armed): depth is one fact per
    /// position, so those merge into it, and their dedents unwind first.
    merged: Vec<usize>,
    indent_pending: bool,
    indent_armed: bool,
    seam: Option<SeamRank>,
    seam_strength: u8,
    seam_set: LayoutKinds,
    seam_pick: LayoutKinds,
    seam_cont: String,
    seam_is_token: bool,
    seam_is_flank: bool,
    seam_is_root: bool,
    seam_template: bool,
    leaf_leading: Option<LayoutKinds>,
    flushed_template: Option<LayoutKinds>,
    sources: Option<&'a dyn crate::render::SourceTable>,
    options: Option<&'a crate::options::ResolvedOptions>,
    deferring: Option<String>,
    deferred: Vec<DeferredRun>,
    line_end_held: Option<crate::render::LineHold>,
    leaf_trailing: Option<u8>,
    leaf_lexed: bool,
    indent_lazy: bool,
    trailing_accepts: u8,
}

/// A trailing run rendered ahead of where it is written: its text, and the
/// seam its last entry left (its after edge) with the strength that seam
/// holds and whether it is a line-terminated entry's break.
/// What a held seam writes: the kinds valid at its gap, the one kind it
/// resolved to, and, for a line continuation, the source text it carries.
#[derive(Clone, Default)]
struct Payload {
    set: LayoutKinds,
    pick: LayoutKinds,
    cont: String,
}

struct DeferredRun {
    text: String,
    end: Option<(u8, Payload)>,
    line_end: Option<crate::render::LineHold>,
}

/// The writer's spacing state, set aside while a deferred run renders on its
/// own and put back after.
struct HeldContext {
    last: Option<char>,
    indent_pending: bool,
    indent_armed: bool,
    seam: Option<SeamRank>,
    seam_strength: u8,
    seam_set: LayoutKinds,
    seam_pick: LayoutKinds,
    seam_cont: String,
    seam_is_token: bool,
    seam_is_flank: bool,
    seam_is_root: bool,
    seam_template: bool,
    line_end_held: Option<crate::render::LineHold>,
}

impl<'a, W: std::fmt::Write + ?Sized> SpacingWriter<'a, W> {
    pub fn new(inner: &'a mut W, word: &'a WordMatcher) -> Self {
        Self {
            inner,
            last: None,
            word,
            table: None,
            indent: "",
            depth: 0,
            merged: Vec::new(),
            indent_pending: false,
            indent_armed: false,
            seam: None,
            seam_strength: SEAM_FALLBACK,
            seam_set: LayoutKinds::NONE,
            seam_pick: LayoutKinds::NONE,
            seam_cont: String::new(),
            seam_is_token: false,
            seam_is_flank: false,
            seam_is_root: false,
            seam_template: false,
            leaf_leading: None,
            flushed_template: None,
            sources: None,
            options: None,
            deferring: None,
            deferred: Vec::new(),
            line_end_held: None,
            leaf_trailing: None,
            leaf_lexed: false,
            indent_lazy: false,
            trailing_accepts: LayoutKinds::ALL.0,
        }
    }

    /// The resolved options [`crate::render::RenderSink::site_at`] and
    /// [`crate::render::RenderSink::edge`] read. A render that writes option
    /// sites must attach them; a writer with none attached is a debug-mode
    /// bug, like a missing whitespace table.
    pub fn with_options(mut self, options: &'a crate::options::ResolvedOptions) -> Self {
        self.options = Some(options);
        self
    }

    /// The text written once per depth level after every newline.
    pub fn with_indent(mut self, indent: &'a str) -> Self {
        self.indent = indent;
        self
    }

    /// The grammar's whitespace vocabulary for [`crate::render::RenderSink::site`].
    /// A render that resolves sites must attach one; a writer with none
    /// attached is a debug-mode bug, not a supported no-table mode.
    /// The live trees this render may slice. A writer with none refuses every
    /// coordinate rather than writing nothing in its place.
    pub fn with_sources(mut self, sources: &'a dyn crate::render::SourceTable) -> Self {
        self.sources = Some(sources);
        self
    }

    pub fn with_table(mut self, table: &'a crate::render::WhitespaceTable) -> Self {
        self.table = Some(table);
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
            self.emit(self.indent)?;
        }
        if self.depth > 0 {
            self.last = self.indent.chars().next_back();
        }
        Ok(())
    }

    fn at_line_start(&self) -> bool {
        matches!(self.last, None | Some('\n'))
    }

    /// Where written text goes: the output, or the buffer of a deferred run.
    fn emit(&mut self, s: &str) -> std::fmt::Result {
        match self.deferring.as_mut() {
            Some(buffer) => {
                buffer.push_str(s);
                Ok(())
            }
            None => self.inner.write_str(s),
        }
    }

    /// Whether writing `s` next would start a new line: it opens with a line
    /// break, or the held seam carries one.
    fn breaks_line(&self, s: &str) -> bool {
        s.starts_with('\n') || self.held_breaks()
    }

    fn hold_context(&mut self) -> HeldContext {
        HeldContext {
            last: self.last.take(),
            indent_pending: std::mem::replace(&mut self.indent_pending, false),
            indent_armed: std::mem::replace(&mut self.indent_armed, false),
            seam: self.seam.take(),
            seam_strength: std::mem::replace(&mut self.seam_strength, SEAM_FALLBACK),
            seam_set: std::mem::take(&mut self.seam_set),
            seam_pick: std::mem::take(&mut self.seam_pick),
            seam_cont: std::mem::take(&mut self.seam_cont),
            seam_is_token: std::mem::replace(&mut self.seam_is_token, false),
            seam_is_flank: std::mem::replace(&mut self.seam_is_flank, false),
            seam_is_root: std::mem::replace(&mut self.seam_is_root, false),
            seam_template: std::mem::replace(&mut self.seam_template, false),
            line_end_held: self.line_end_held.take(),
        }
    }

    fn restore_context(&mut self, held: HeldContext) {
        self.last = held.last;
        self.indent_pending = held.indent_pending;
        self.indent_armed = held.indent_armed;
        self.seam = held.seam;
        self.seam_strength = held.seam_strength;
        self.seam_set = held.seam_set;
        self.seam_pick = held.seam_pick;
        self.seam_cont = held.seam_cont;
        self.seam_is_token = held.seam_is_token;
        self.seam_is_flank = held.seam_is_flank;
        self.seam_is_root = held.seam_is_root;
        self.seam_template = held.seam_template;
        self.line_end_held = held.line_end_held;
    }

    /// Writes the held trailing runs where the output stands, ahead of any
    /// held seam, each after a space. The seam the last run ended on (its
    /// entry's after edge) then meets the held seam under the seam law, as it
    /// would have had the run been written in place, unless `next` opens with
    /// a line break of its own; a run whose text ended its line already wrote
    /// one break of that seam. A line-terminated entry's break is held as
    /// such.
    fn write_deferred(&mut self, next: &str) -> std::fmt::Result {
        if self.deferring.is_some() || self.deferred.is_empty() {
            return Ok(());
        }
        let mut last = None;
        for run in std::mem::take(&mut self.deferred) {
            if !self.at_line_start() {
                self.write_text(" ")?;
            }
            self.write_text(&run.text)?;
            last = Some(run);
        }
        if let Some(DeferredRun { end: Some((strength, mut payload)), line_end, .. }) = last {
            if self.at_line_start() && payload.pick.breaks() && payload.cont.is_empty() {
                payload.pick = payload.pick.without_first_break();
                payload.set = payload.pick;
            }
            if !next.starts_with('\n') && payload.pick != LayoutKinds::NONE && payload.pick != LayoutKinds::TIGHT {
                self.merge_payload(payload, strength, false);
                if let Some(hold) = line_end {
                    crate::render::RenderSink::hold_line_end(self, hold);
                }
            }
        }
        Ok(())
    }

    /// One mark-free run of literal text. A statically spaced seam is not a
    /// seam: when either flank is whitespace there is nothing to decide.
    /// Otherwise a pending adjacency mark suppresses the check for this text
    /// only; `last` is always updated from the real text so the first
    /// NORMAL seam after an adjacent run sees the true preceding character.
    fn write_text(&mut self, s: &str) -> std::fmt::Result {
        let Some(first) = s.chars().next() else {
            return Ok(()); // empty write: context untouched (mark survives too)
        };
        let adjacent = !self.word_space_allowed();
        self.indent_armed = false;
        self.pay_indent(first)?;
        if let Some(last) = self.last {
            if !adjacent && !last.is_whitespace() && !first.is_whitespace() {
                let word_seam = self.word.is_word(last) && self.word.is_word(first);
                // An identical-char pair is in `literal_merge_pairs` only when the
                // grammar lets its doubled token begin what directly follows the
                // single-char token (e.g. `--` after a unary `-`); `>>` closing
                // nested generics is never such a pair and stays tight.
                let symbol_seam = self.word.is_literal_merge_pair(last, first);
                if word_seam || symbol_seam {
                    self.emit(" ")?;
                }
            }
        }
        self.emit(s)?;
        self.last = s.chars().next_back();
        if self.last == Some('\n') {
            self.indent_pending = true;
        }
        Ok(())
    }

    /// Whether a collision of two words may be spelled with a space here: the
    /// leaf about to be written takes one before it, the leaf just written
    /// takes one after it, and a template join made
    /// at this gap did not ask for a tight one.
    fn word_space_allowed(&self) -> bool {
        self.leaf_leading.is_none_or(|leading| leading.has(LayoutKinds::SPACE))
            && LayoutKinds(self.trailing_accepts).has(LayoutKinds::SPACE)
            && self.flushed_template.is_none_or(|set| set.has(LayoutKinds::SPACE))
    }

    /// The text just written closes a leaf: layout after it must be a kind
    /// its trailing edge takes.
    fn end_leaf(&mut self) {
        let trailing = self.leaf_trailing.take().unwrap_or(LayoutKinds::ALL.0);
        self.leaf_lexed = false;
        self.trailing_accepts = trailing;
    }

    /// Writes a held seam's text as ordinary text and clears the held rank.
    fn flush_seam(&mut self) -> std::fmt::Result {
        let line_end = self.line_end_held.take();
        self.flushed_template = None;
        let Some(rank) = self.seam.take() else {
            return Ok(());
        };
        let token = std::mem::replace(&mut self.seam_is_token, false);
        let root = std::mem::replace(&mut self.seam_is_root, false);
        let template = std::mem::replace(&mut self.seam_template, false);
        self.seam_is_flank = false;
        // A synthesized (non-token) space is redundant at the very start of
        // output and right after a literal newline the prior text already
        // wrote: either way the line already starts bare, so a plain space
        // arm there would be a stray leading space. Literal whitespace text
        // is untouched (`literal_whitespace_is_never_coalesced`) because
        // this only ever drops a *seam's own* payload, never text.
        let redundant = self.last.is_none() || (rank == 1 && self.last == Some('\n'));
        let mut payload = self.take_payload();
        if !token && !root && redundant {
            return Ok(());
        }
        if !token && !root && line_end.is_none() {
            let kept = payload.set.and(LayoutKinds(self.trailing_accepts));
            if kept.is_empty() {
                return Ok(());
            }
            if !kept.has(payload.pick) {
                payload.pick = kept.narrowest();
            }
            payload.set = kept;
        }
        if template {
            self.flushed_template = Some(payload.set);
        }
        let text = self.payload_text(&payload);
        self.write_text(&text)
    }

    /// Merges a mark's payload into the held one: a stronger mark replaces a
    /// weaker one whatever their widths; between marks of one strength a list
    /// flank beats any other mark, since it is written only inside a list
    /// that has members; otherwise the wider wins and a tie keeps the one
    /// already held. A held line end is a floor, not an override: a mark
    /// carrying a wider line break still widens it, whatever its strength,
    /// and the held strength stays; a mark without a line break never
    /// replaces it.
    fn merge_seam(&mut self, kinds: LayoutKinds) -> bool {
        self.merge_payload(Payload { set: kinds, pick: kinds.narrowest(), cont: String::new() }, SEAM_DECLARED, false)
    }

    fn merge_seam_with(&mut self, kinds: LayoutKinds, strength: u8) {
        self.merge_payload(Payload { set: kinds, pick: kinds.narrowest(), cont: String::new() }, strength, false);
    }

    /// The text a payload writes: the grammar's spelling of its picked kind,
    /// or the source text a line continuation carries.
    fn payload_text<'p>(&self, payload: &'p Payload) -> std::borrow::Cow<'p, str> {
        if payload.pick == LayoutKinds::LINE_CONTINUATION {
            return std::borrow::Cow::Borrowed(&payload.cont);
        }
        std::borrow::Cow::Borrowed(match self.table {
            Some(table) => table.text_of_gap(payload.pick),
            None => payload.pick.default_text(),
        })
    }

    fn held_payload(&self) -> Payload {
        Payload { set: self.seam_set, pick: self.seam_pick, cont: self.seam_cont.clone() }
    }

    fn take_payload(&mut self) -> Payload {
        Payload {
            set: std::mem::take(&mut self.seam_set),
            pick: std::mem::take(&mut self.seam_pick),
            cont: std::mem::take(&mut self.seam_cont),
        }
    }

    fn set_payload(&mut self, payload: Payload) {
        self.seam = Some(self.payload_rank(&payload));
        self.seam_set = payload.set;
        self.seam_pick = payload.pick;
        self.seam_cont = payload.cont;
    }

    fn clear_payload(&mut self) {
        self.seam = None;
        self.take_payload();
        self.seam_template = false;
    }

    fn payload_rank(&self, payload: &Payload) -> SeamRank {
        if payload.pick == LayoutKinds::LINE_CONTINUATION {
            seam_rank(&payload.cont)
        } else {
            payload.pick.rank()
        }
    }

    /// Whether the held seam breaks the line.
    fn held_breaks(&self) -> bool {
        self.seam.is_some()
            && if self.seam_pick == LayoutKinds::LINE_CONTINUATION { self.seam_cont.contains('\n') } else { self.seam_pick.breaks() }
    }

    /// A spacing site's arm read from the resolved options, written as a
    /// flank mark when `flank` is set.
    fn option_site(&mut self, site: usize, flank: bool) {
        debug_assert!(self.options.is_some(), "a render that writes option sites must attach the resolved options");
        let Some(options) = self.options else {
            return;
        };
        let crate::slot::SeamArm { arm, strength, .. } = options.site_arm(site);
        self.site_mark(arm, strength, flank);
    }

    /// Writes a whitespace kind's arm: a depth move plus its line break for
    /// the depth arms, otherwise the arm's text as a seam of `strength`.
    fn site_mark(&mut self, kind: u16, strength: u8, flank: bool) {
        if kind == 0 {
            return;
        }
        debug_assert!(
            self.table.is_some(),
            "a render that resolves sites must attach a whitespace table"
        );
        let Some(table) = self.table else {
            return;
        };
        let Some(gap) = table.gap_of(kind).or_else(|| (kind == table.indent || kind == table.dedent).then_some(LayoutKinds::NEWLINE)) else {
            return;
        };
        if kind == table.dedent {
            crate::render::RenderSink::dedent(self, gap);
            return;
        }
        if kind == table.indent {
            crate::render::RenderSink::indent(self);
        }
        self.merge_payload(Payload { set: gap, pick: gap, cont: String::new() }, strength, flank);
    }

    /// The grammar root's edge: the render's own flank at its start or its
    /// end, which decides its gap outright instead of merging with the node
    /// edges it meets there, and which a later mark never replaces. Only a
    /// line-terminated entry's break still floors it, since without that
    /// break what follows would read as the entry's text; a break the line
    /// already ended satisfies one line break of the edge. A line continuation
    /// held at that gap already ends the line, so it stands.
    fn root_edge(&mut self, arm: u16, strength: u8) {
        let Some(table) = self.table else {
            return;
        };
        let Some(mut gap) = table.gap_of(arm) else {
            return;
        };
        if self.last == Some('\n') && gap.breaks() {
            gap = gap.without_first_break();
        }
        let floor = self.line_end_held == Some(crate::render::LineHold::Terminated) && self.held_breaks();
        let continuation_held = self.seam.is_some()
            && self.seam_strength == SEAM_TRIVIA
            && self.seam_pick == LayoutKinds::LINE_CONTINUATION
            && self.seam_cont.ends_with('\n')
            && gap.rank() <= LayoutKinds::NEWLINE.rank();
        if !continuation_held && !(floor && self.seam.is_some_and(|held| held >= gap.rank())) {
            self.set_payload(Payload { set: gap, pick: gap, cont: String::new() });
            self.seam_strength = strength;
            self.seam_is_flank = false;
            self.seam_is_token = false;
            self.seam_template = false;
        }
        self.seam_is_root = true;
    }

    fn merge_payload(&mut self, payload: Payload, strength: u8, flank: bool) -> bool {
        if self.seam_is_root {
            return false;
        }
        let rank = self.payload_rank(&payload);
        let breaks = if payload.pick == LayoutKinds::LINE_CONTINUATION { payload.cont.contains('\n') } else { payload.pick.breaks() };
        if let Some(current) = self.seam {
            let keeps = match strength.cmp(&self.seam_strength) {
                std::cmp::Ordering::Less => true,
                std::cmp::Ordering::Greater => false,
                std::cmp::Ordering::Equal if flank != self.seam_is_flank => self.seam_is_flank,
                std::cmp::Ordering::Equal => current >= rank,
            };
            let widens_held_break = self.line_end_held.is_some() && breaks && rank > current;
            if keeps && !widens_held_break {
                return false;
            }
        }
        let strength = if self.line_end_held.is_some() { strength.max(self.seam_strength) } else { strength };
        self.set_payload(payload);
        self.seam_strength = strength;
        self.seam_is_flank = flank;
        self.seam_template = false;
        true
    }

    /// One mark-free run of text from the caller: flushes any held seam
    /// payload first, then writes the text itself.
    fn write_chunk(&mut self, s: &str) -> std::fmt::Result {
        if s.is_empty() {
            return Ok(());
        }
        if self.breaks_line(s) {
            self.write_deferred(s)?;
        }
        if s.starts_with('\n') && self.seam == Some(1) && !self.seam_is_token {
            self.clear_payload();
        }
        let seam_held = self.seam.is_some() && self.seam_pick != LayoutKinds::TIGHT;
        self.flush_seam()?;
        if std::mem::take(&mut self.indent_lazy) && seam_held {
            self.indent_pending = true;
        }
        let armed_before = self.indent_pending;
        let result = self.write_text(s);
        if self.leaf_lexed {
            self.indent_lazy = self.indent_pending && s.ends_with('\n');
            self.indent_pending = armed_before && s.starts_with('\n');
        }
        self.leaf_leading = None;
        self.flushed_template = None;
        result
    }

    /// Ends the render: a seam payload still held has nothing after it, so
    /// it is dropped, as a payload held before the first text is. A seam
    /// lies between two things; a node rendered on its own carries no edge
    /// whitespace. The grammar root is the exception: its edges are the
    /// render's own flanks, so a seam its after edge marked is written here,
    /// as its before edge is written at the start. A payload a whitespace
    /// token contributed is written out too: the token is part of the node.
    /// So is the break a line-terminated trivia entry left: without it, what
    /// follows the render would read as that entry's text. The root render
    /// calls this once, after the last `write_str`.
    pub fn finish(&mut self) -> std::fmt::Result {
        self.write_deferred("")?;
        if self.seam_is_token
            || self.seam_is_root
            || (self.line_end_held == Some(crate::render::LineHold::Terminated) && self.held_breaks())
        {
            self.flush_seam()?;
        }
        self.clear_payload();
        self.seam_is_root = false;
        debug_assert_eq!(self.depth, 0, "a render must dedent every indent it opens");
        Ok(())
    }
}

impl<W: std::fmt::Write + ?Sized> crate::render::RenderSink for SpacingWriter<'_, W> {
    fn text(&mut self, s: &str) -> crate::render::RenderResult {
        self.write_chunk(s)?;
        if !s.is_empty() {
            self.end_leaf();
        }
        Ok(())
    }

    fn leaf_kind(&mut self, kind: crate::types::KindId) {
        if let Some((leading, trailing)) = self.table.and_then(|table| table.leaf_edges_of(kind)) {
            self.leaf_edges(leading, trailing);
        }
    }

    /// The next text is a leaf whose pattern takes layout of the kinds in
    /// `leading` before it and `trailing` after it. The held seam keeps only
    /// the kinds the leading edge takes; none left, it writes nothing. A seam
    /// a whitespace token wrote is required text and stays.
    fn leaf_edges(&mut self, leading: u8, trailing: u8) {
        let leading = LayoutKinds(leading);
        self.leaf_leading = Some(leading);
        if !self.seam_is_token && !self.seam_is_root && self.seam.is_some() {
            let kept = self.seam_set.and(leading);
            if kept.is_empty() {
                self.clear_payload();
            } else if !kept.has(self.seam_pick) {
                self.seam_set = kept;
                self.seam_pick = kept.narrowest();
                self.seam = Some(self.seam_pick.rank());
            } else {
                self.seam_set = kept;
            }
        }
        self.leaf_trailing = Some(trailing);
        self.leaf_lexed = leading.0 & !LayoutKinds::TIGHT.0 == 0;
    }

    /// A site's arm: 0 is no arm — nothing is written and nothing changes —
    /// a depth move plus its line break for the depth arms, otherwise the
    /// arm's text as a seam. A writer with no table attached treats every
    /// other kind as unknown and writes nothing.
    fn site(&mut self, kind: u16) {
        self.site_with(kind, SEAM_DECLARED);
    }

    fn site_at(&mut self, site: usize) {
        self.option_site(site, false);
    }

    fn edge(&mut self, kind: crate::types::KindId, side: crate::options::Side, stamped: Option<crate::options::EdgeArm>) {
        debug_assert!(self.options.is_some(), "a render that writes kind edges must attach the resolved options");
        let Some(options) = self.options else {
            return;
        };
        let Some(seam) = options.edge_arm(kind, side, stamped, None) else {
            return;
        };
        if options.kind_has(kind, crate::options::KIND_ROOT) {
            self.root_edge(seam.arm, seam.strength);
        } else {
            self.seam_arm(seam);
        }
    }

    fn site_with(&mut self, kind: u16, strength: u8) {
        self.site_mark(kind, strength, false);
    }

    fn unsited_edge(&mut self, kind: crate::types::KindId, side: crate::options::Side, stamped: Option<crate::options::EdgeArm>) {
        let Some(crate::options::EdgeArm { arm, strength: Some(strength), dedent }) = stamped else {
            return;
        };
        if self.options.is_some_and(|options| options.edge_arm(kind, side, None, None).is_some()) {
            return;
        }
        self.seam_arm(crate::slot::SeamArm { arm, strength, dedent: dedent == Some(true) });
    }

    fn flank_at(&mut self, site: usize) {
        self.option_site(site, true);
    }

    fn seam(&mut self, kinds: LayoutKinds) {
        let replaced = self.merge_seam(kinds);
        if replaced {
            self.seam_template = true;
        }
        if kinds.is_single() && kinds != LayoutKinds::TIGHT {
            self.seam_is_token = true;
        }
    }

    fn trivia_seam(&mut self, gap: LayoutKinds, text: Option<&str>) {
        let continues = self.seam.is_some() && self.seam_strength == SEAM_TRIVIA && gap == LayoutKinds::LINE_CONTINUATION;
        if continues {
            let held = self.payload_text(&self.held_payload()).into_owned();
            let payload = Payload { set: gap, pick: gap, cont: held + text.unwrap_or_default() };
            self.set_payload(payload);
        } else {
            let payload = Payload { set: gap, pick: gap, cont: text.unwrap_or_default().to_string() };
            self.merge_payload(payload, SEAM_TRIVIA, false);
        }
        self.seam_is_token = true;
    }

    fn kind_of(&self, coord: &crate::slot::NodeCoordinate) -> Option<crate::types::KindId> {
        coord.kind.or_else(|| self.sources.and_then(|sources| sources.kind_of(coord)))
    }

    fn end_lines_after(&mut self, coord: &crate::slot::NodeCoordinate) {
        let sources = self.sources;
        let mut first = true;
        if let Some(sources) = sources {
            sources.for_each_kind_ending_with(coord, &mut |kind| {
                let kind = match (first, coord.kind) {
                    (true, Some(stamp)) => stamp,
                    _ => kind,
                };
                first = false;
                crate::render::RenderSink::end_line_after(self, kind);
            });
        }
        if first {
            if let Some(stamp) = coord.kind {
                crate::render::RenderSink::end_line_after(self, stamp);
            }
        }
    }

    fn slice(&mut self, coord: &crate::slot::NodeCoordinate) -> crate::render::RenderResult {
        let sources = self
            .sources
            .ok_or(crate::render::CoordinateError::UnknownTree {
                handle: coord.handle,
                tree_id: coord.tree_id(),
            })?;
        let text = coord.resolve(sources)?;
        let token = crate::render::RenderSink::kind_of(self, coord)
            .is_some_and(|kind| crate::render::RenderSink::kind_has(self, kind, crate::options::KIND_ANON));
        if !token {
            self.write_deferred(text)?;
        }
        if let Some(kind) = crate::render::RenderSink::kind_of(self, coord) {
            crate::render::RenderSink::leaf_kind(self, kind);
        }
        self.write_chunk(text)?;
        self.end_leaf();
        Ok(())
    }

    fn indent(&mut self) {
        if self.indent_armed {
            if let Some(merged) = self.merged.last_mut() {
                *merged += 1;
                return;
            }
        }
        self.depth += 1;
        self.merged.push(0);
        self.indent_armed = true;
    }

    fn dedent(&mut self, seam: LayoutKinds) {
        if let Some(merged) = self.merged.last_mut().filter(|merged| **merged > 0) {
            *merged -= 1;
            if !self.indent_armed && !seam.is_empty() {
                self.merge_seam(seam);
            }
            return;
        }
        self.merged.pop();
        self.depth = self.depth.saturating_sub(1);
        let holds_trivia = self.seam.is_some() && self.seam_strength == SEAM_TRIVIA;
        if std::mem::replace(&mut self.indent_armed, false) && !holds_trivia {
            self.clear_payload();
            self.seam_is_token = false;
            return;
        }
        if !seam.is_empty() {
            self.merge_seam(seam);
        }
    }

    fn ends_line(&self) -> bool {
        self.at_line_start()
    }

    fn pending_break(&self) -> bool {
        self.held_breaks()
    }

    fn at_body_start(&self) -> bool {
        self.indent_armed
    }

    fn kind_has(&self, kind: crate::types::KindId, flag: u8) -> bool {
        self.options.is_some_and(|options| options.kind_has(kind, flag))
    }

    fn hold_line_end(&mut self, hold: crate::render::LineHold) {
        if self.at_line_start() {
            if self.seam.is_some() && self.seam_pick.breaks() && self.seam_pick != LayoutKinds::LINE_CONTINUATION {
                let rest = self.seam_pick.without_first_break();
                if rest.is_empty() {
                    self.clear_payload();
                } else {
                    self.seam_pick = rest;
                    self.seam_set = rest;
                    self.seam = Some(rest.rank());
                }
            }
            return;
        }
        if self.held_breaks() {
            self.seam_strength = self.seam_strength.max(SEAM_TRIVIA);
        } else {
            self.merge_seam_with(LayoutKinds::NEWLINE, SEAM_TRIVIA);
        }
        self.line_end_held = self.line_end_held.max(Some(hold));
    }

    fn take_seam(&mut self) -> Option<crate::render::HeldSeam> {
        self.seam.take()?;
        let payload = self.take_payload();
        Some(crate::render::HeldSeam {
            kinds: payload.set,
            pick: payload.pick,
            cont: payload.cont,
            strength: std::mem::replace(&mut self.seam_strength, SEAM_FALLBACK),
            token: std::mem::replace(&mut self.seam_is_token, false),
            flank: std::mem::replace(&mut self.seam_is_flank, false),
            root: std::mem::replace(&mut self.seam_is_root, false),
        })
    }

    fn restore_seam(&mut self, mut held: crate::render::HeldSeam) {
        if self.at_line_start() && held.pick.breaks() && held.pick != LayoutKinds::LINE_CONTINUATION {
            held.pick = held.pick.without_first_break();
            held.kinds = held.pick;
            if held.pick.is_empty() {
                return;
            }
        }
        let held_breaks = held.pick.breaks();
        if crate::render::RenderSink::pending_break(self) && held_breaks {
            let rank = if held.pick == LayoutKinds::LINE_CONTINUATION { seam_rank(&held.cont) } else { held.pick.rank() };
            if self.seam.is_some_and(|current| rank > current) {
                self.set_payload(Payload { set: held.kinds, pick: held.pick, cont: held.cont });
                self.seam_is_flank = held.flank;
            }
            self.seam_strength = self.seam_strength.max(held.strength);
            self.seam_is_root |= held.root;
            return;
        }
        let was = (self.seam, self.seam_strength);
        self.merge_payload(Payload { set: held.kinds, pick: held.pick, cont: held.cont }, held.strength, held.flank);
        if held.token && (self.seam, self.seam_strength) != was {
            self.seam_is_token = true;
        }
        self.seam_is_root |= held.root && self.seam.is_some();
    }

    fn defer_trailing(
        &mut self,
        render: &mut dyn FnMut(&mut dyn crate::render::RenderSink) -> crate::render::RenderResult,
    ) -> crate::render::RenderResult {
        if self.deferring.is_some() {
            return render(self);
        }
        let held = self.hold_context();
        self.deferring = Some(String::new());
        let result = render(self);
        let run = self.deferring.take().unwrap_or_default();
        let end = self.seam.map(|_| (self.seam_strength, self.held_payload()));
        let line_end = self.line_end_held.filter(|_| end.is_some());
        self.restore_context(held);
        result?;
        if !run.is_empty() {
            self.deferred.push(DeferredRun { text: run, end, line_end });
        }
        Ok(())
    }

    fn seat_trailing(&mut self) -> crate::render::RenderResult {
        self.write_deferred("")?;
        Ok(())
    }
}

#[cfg(test)]
mod word_matcher_tests {
    use super::*;
    use crate::render::RenderSink;

    fn spaced(parts: &[&str]) -> String {
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident());
        for p in parts {
            w.text(p).unwrap();
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
            w.text(p).unwrap();
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
    fn identical_symbol_seam_outside_the_pairs_does_not_insert() {
        let word = with_range_arrow_pairs();
        // Closing nested generics (`Vec<Vec<T>>`) stays tight: `>>` begins
        // nothing that can follow a `>`, so `>|>` is never a derived pair.
        assert_eq!(spaced_with(&word, &[">", ">"]), ">>");
    }

    #[test]
    fn identical_symbol_pair_inserts() {
        // `-|-` is a pair when `--` can begin what follows a unary `-`:
        // `- -x` and `- --x` must not re-lex as a decrement.
        let word = WordMatcher::new(default_ascii_table(), char::is_alphanumeric)
            .with_literal_merge_pairs(&[(b'-', b'-')]);
        assert_eq!(spaced_with(&word, &["-", "-", "x"]), "- -x");
        assert_eq!(spaced_with(&word, &["-", "--", "x"]), "- --x");
        assert_eq!(spaced_with(&word, &["-", "x"]), "-x");
        assert_eq!(spaced_with(&word, &["+", "+"]), "++");
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
mod sink_tests {
    use super::*;
    use crate::render::{RenderSink, WhitespaceTable};

    const TIGHT: u16 = 1;
    const SPACE: u16 = 2;
    const NEWLINE: u16 = 3;
    const BLANK: u16 = 4;
    const INDENT: u16 = 5;
    const DEDENT: u16 = 6;
    fn text_of(kind: u16) -> &'static str {
        match kind {
            TIGHT => "",
            SPACE => " ",
            NEWLINE => "\n",
            BLANK => "\n\n",
            INDENT | DEDENT => "\n",
            _ => "",
        }
    }
    const TABLE: WhitespaceTable = WhitespaceTable {
        text_of,
        indent: INDENT,
        dedent: DEDENT, leaf_edges: &[], gaps: &[(1, 1), (2, 2), (8, 3), (16, 4)]
    };

    fn run(f: impl FnOnce(&mut SpacingWriter<'_, String>)) -> String {
        let mut s = String::new();
        let mut w = SpacingWriter::new(&mut s, WordMatcher::default_ident())
            .with_table(&TABLE)
            .with_indent("  ");
        f(&mut w);
        w.finish().unwrap();
        s
    }

    #[test]
    fn a_word_hazard_gets_a_space_and_a_leaf_taking_no_space_suppresses_it() {
        assert_eq!(
            run(|w| {
                w.text("let").unwrap();
                w.text("x").unwrap();
            }),
            "let x"
        );
        assert_eq!(
            run(|w| {
                w.text("let").unwrap();
                w.leaf_edges(crate::layout_kinds::LayoutKinds::TIGHT.0, crate::layout_kinds::LayoutKinds::ALL.0);
                w.text("x").unwrap();
            }),
            "letx"
        );
    }

    #[test]
    fn seams_coalesce_to_the_widest_and_drop_at_the_edges() {
        assert_eq!(
            run(|w| {
                w.site(NEWLINE);
                w.text("a").unwrap();
                w.site(SPACE);
                w.site(BLANK);
                w.text("b").unwrap();
                w.site(NEWLINE);
            }),
            "a\n\nb"
        );
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.seam(crate::layout_kinds::LayoutKinds::SPACE);
                w.text("b").unwrap();
            }),
            "a\nb"
        );
    }

    #[test]
    fn a_trivia_seam_replaces_the_gap_default_whatever_its_width() {
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.trivia_seam(crate::layout_kinds::LayoutKinds::SPACE, None);
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("b").unwrap();
            }),
            "a b"
        );
        assert_eq!(
            run(|w| {
                w.text("{").unwrap();
                w.indent();
                w.trivia_seam(crate::layout_kinds::LayoutKinds::BLANKLINE, None);
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("}").unwrap();
            }),
            "{\n\n}"
        );
    }

    #[test]
    fn a_trivia_seam_that_starts_with_a_visible_character_extends_the_held_one() {
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::SPACE);
                w.trivia_seam(crate::layout_kinds::LayoutKinds::SPACE, None);
                w.trivia_seam(crate::layout_kinds::LayoutKinds::LINE_CONTINUATION, Some("\\\n"));
                w.trivia_seam(crate::layout_kinds::LayoutKinds::LINE_CONTINUATION, Some("\\\n"));
                w.text("b").unwrap();
            }),
            "a \\\n\\\nb"
        );
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::SPACE);
                w.trivia_seam(crate::layout_kinds::LayoutKinds::LINE_CONTINUATION, Some("\\\n"));
                w.text("b").unwrap();
            }),
            "a\\\nb"
        );
    }

    #[test]
    fn a_token_seam_coalesces_but_survives_the_end() {
        assert_eq!(
            run(|w| {
                w.text("pass").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.site(NEWLINE);
            }),
            "pass\n"
        );
        assert_eq!(
            run(|w| {
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("a").unwrap();
            }),
            "\na"
        );
    }

    #[test]
    fn a_tight_site_between_a_same_char_pair_still_gets_the_space() {
        let word = WordMatcher::new(default_ascii_table(), char::is_alphanumeric)
            .with_literal_merge_pairs(&[(b'-', b'-')]);
        let mut s = String::new();
        let mut w = SpacingWriter::new(&mut s, &word).with_table(&TABLE);
        w.text("-").unwrap();
        w.site(TIGHT);
        w.text("-").unwrap();
        w.site(TIGHT);
        w.text("x").unwrap();
        w.finish().unwrap();
        assert_eq!(s, "- -x");
    }

    #[test]
    fn a_tight_site_holds_a_seam_that_still_gets_the_lexical_space() {
        assert_eq!(
            run(|w| {
                w.text("let").unwrap();
                w.site(TIGHT);
                w.text("x").unwrap();
            }),
            "let x"
        );
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.site(0);
                w.text("b").unwrap();
            }),
            "a b"
        );
    }

    #[test]
    fn two_opens_at_one_position_open_one_depth_and_their_closes_return_to_it() {
        assert_eq!(
            run(|w| {
                w.text("{").unwrap();
                w.indent();
                w.indent();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("a").unwrap();
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("}").unwrap();
            }),
            "{\n  a\n}"
        );
    }

    #[test]
    fn opens_at_two_positions_open_two_depths_and_close_both() {
        assert_eq!(
            run(|w| {
                w.text("a:").unwrap();
                w.indent();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("b:").unwrap();
                w.indent();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("c").unwrap();
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("d").unwrap();
            }),
            "a:\n  b:\n    c\nd"
        );
    }

    #[test]
    fn a_depth_site_indents_and_a_dedent_before_any_text_leaves_a_body_bare() {
        assert_eq!(
            run(|w| {
                w.text("{").unwrap();
                w.site(INDENT);
                w.text("a").unwrap();
                w.site(DEDENT);
                w.text("}").unwrap();
            }),
            "{\n  a\n}"
        );
        assert_eq!(
            run(|w| {
                w.text("{").unwrap();
                w.site(INDENT);
                w.site(DEDENT);
                w.text("}").unwrap();
            }),
            "{}"
        );
        assert_eq!(
            run(|w| {
                w.text("{").unwrap();
                w.indent();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("a").unwrap();
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("}").unwrap();
            }),
            "{\n  a\n}"
        );
    }

    #[test]
    fn nested_indentation_stacks_and_a_dedented_indent_leaves_the_body_bare() {
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.indent();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("b").unwrap();
                w.indent();
                w.seam(crate::layout_kinds::LayoutKinds::BLANKLINE);
                w.text("c").unwrap();
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("d").unwrap();
            }),
            "a\n  b\n\n    c\nd"
        );
    }

    #[test]
    fn ends_line_reports_the_last_byte() {
        let mut s = String::new();
        let mut w = SpacingWriter::new(&mut s, WordMatcher::default_ident()).with_table(&TABLE);
        assert!(w.ends_line());
        w.text("a").unwrap();
        assert!(!w.ends_line());
        w.text("\n").unwrap();
        assert!(w.ends_line());
    }

    #[test]
    fn a_cancelled_indent_drops_the_dedent_seam_that_follows_it() {
        assert_eq!(
            run(|w| {
                w.text("{").unwrap();
                w.indent();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("}").unwrap();
            }),
            "{}"
        );
        assert_eq!(
            run(|w| {
                w.text("{").unwrap();
                w.indent();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("a").unwrap();
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("}").unwrap();
            }),
            "{\n  a\n}"
        );
    }

    #[test]
    fn a_leaf_trailing_edge_ends_with_the_next_text() {
        use crate::layout_kinds::LayoutKinds as K;
        assert_eq!(
            run(|w| {
                w.text("let s = ").unwrap();
                w.leaf_edges(K::TIGHT.0, K::TIGHT.0);
                w.text("a").unwrap();
                w.text(";").unwrap();
                w.seam(K::NEWLINE);
                w.seam(K::SEPARATING);
                w.text("b").unwrap();
            }),
            "let s = a;\nb"
        );
    }

    #[test]
    fn a_trailing_edge_narrows_a_held_set_to_what_it_takes() {
        use crate::layout_kinds::LayoutKinds as K;
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.leaf_edges(K::ALL.0, K::SPACE.0 | K::TIGHT.0);
                w.text("b").unwrap();
                w.seam(K::SEPARATING);
                w.text("c").unwrap();
            }),
            "a b c"
        );
        assert_eq!(
            run(|w| {
                w.leaf_edges(K::TIGHT.0, K::TIGHT.0);
                w.text("b").unwrap();
                w.seam(K::SEPARATING);
                w.text("c").unwrap();
            }),
            "bc"
        );
    }

    #[test]
    fn a_plain_space_seam_never_precedes_a_line_break() {
        assert_eq!(
            run(|w| {
                w.text("{}").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::SEPARATING);
                w.text("\n// tail\n").unwrap();
            }),
            "{}\n// tail\n"
        );
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("\nb").unwrap();
            }),
            "a\n\nb"
        );
    }

    #[test]
    fn literal_whitespace_is_never_coalesced() {
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::SPACE);
                w.text("  b").unwrap();
            }),
            "a   b"
        );
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.text(" ").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::SPACE);
                w.text("b").unwrap();
            }),
            "a  b"
        );
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::SPACE);
                w.text("x").unwrap();
                w.text("(").unwrap();
            }),
            "a x("
        );
    }

    #[test]
    fn a_bare_dedent_never_drops_a_following_seam() {
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.text("b").unwrap();
            }),
            "a\nb"
        );
    }

    #[test]
    fn a_tight_join_keeps_two_words_glued() {
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::TIGHT);
                w.text("b").unwrap();
            }),
            "ab"
        );
    }

    #[test]
    fn a_tight_join_survives_an_empty_write() {
        assert_eq!(
            run(|w| {
                w.text("a").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::TIGHT);
                w.text("").unwrap();
                w.text("b").unwrap();
            }),
            "ab"
        );
    }

    #[test]
    fn a_seam_after_a_glued_run_is_computed_against_its_true_last_char() {
        assert_eq!(
            run(|w| {
                w.text("(").unwrap();
                w.seam(crate::layout_kinds::LayoutKinds::TIGHT);
                w.text("d").unwrap();
                w.text("if").unwrap();
            }),
            "(d if"
        );
    }

    #[test]
    fn a_dedent_below_zero_saturates() {
        let mut s = String::new();
        let mut w = SpacingWriter::new(&mut s, WordMatcher::default_ident()).with_indent("  ");
        w.dedent(crate::layout_kinds::LayoutKinds::NEWLINE);
        w.text("x").unwrap();
        w.indent();
        w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
        w.text("y").unwrap();
        assert_eq!(s, "x\n  y");
    }
}

#[cfg(test)]
mod strength_tests {
    use super::*;
    use crate::render::{RenderSink, WhitespaceTable};

    fn text_of(kind: u16) -> &'static str {
        match kind {
            1 => "",
            2 => " ",
            3 => "\n",
            4 => "\n\n",
            _ => "",
        }
    }
    const TABLE: WhitespaceTable = WhitespaceTable { text_of, indent: 0, dedent: 0 , leaf_edges: &[], gaps: &[(1, 1), (2, 2), (8, 3), (16, 4)]};

    fn render(f: impl FnOnce(&mut SpacingWriter<'_, String>)) -> String {
        let mut out = String::new();
        let word = WordMatcher::default_ident();
        let mut w = SpacingWriter::new(&mut out, word).with_table(&TABLE);
        f(&mut w);
        w.finish().unwrap();
        out
    }

    #[test]
    fn a_held_line_end_is_widened_by_a_wider_break() {
        // A statement whose line end is held meets the blank line declared
        // after it: the blank line satisfies the break and is kept.
        let out = render(|w| {
            w.text("a").unwrap();
            w.hold_line_end(crate::render::LineHold::Break);
            w.site_with(4, SEAM_DECLARED);
            w.text("b").unwrap();
        });
        assert_eq!(out, "a\n\nb");
    }

    #[test]
    fn a_held_line_end_is_never_replaced_by_a_mark_without_a_break() {
        let out = render(|w| {
            w.text("a").unwrap();
            w.hold_line_end(crate::render::LineHold::Break);
            w.site_with(2, SEAM_DECLARED);
            w.text("b").unwrap();
        });
        assert_eq!(out, "a\nb");
    }

    #[test]
    fn only_a_terminated_line_end_outlasts_the_render() {
        let terminated = render(|w| {
            w.text("// c").unwrap();
            w.hold_line_end(crate::render::LineHold::Terminated);
        });
        assert_eq!(terminated, "// c\n");
        let excluded = render(|w| {
            w.text("a").unwrap();
            w.hold_line_end(crate::render::LineHold::Break);
        });
        assert_eq!(excluded, "a");
    }

    #[test]
    fn a_declared_space_holds_against_a_cascaded_tight() {
        // `= (x) =>`: the operator's declared space meets the parameter list's
        // cascaded tight edge; the declared mark wins whatever its width.
        let out = render(|w| {
            w.text("=").unwrap();
            w.site_with(2, SEAM_DECLARED);
            w.site_with(1, SEAM_CASCADE);
            w.text("(").unwrap();
        });
        assert_eq!(out, "= (");
    }

    #[test]
    fn a_cascaded_tight_pulls_in_a_fallback_space() {
        // `f(x)`: the call's fallback space meets the argument list's cascaded
        // tight edge; cascade outranks fallback.
        let out = render(|w| {
            w.text("f").unwrap();
            w.site_with(2, SEAM_FALLBACK);
            w.site_with(1, SEAM_CASCADE);
            w.text("(").unwrap();
        });
        assert_eq!(out, "f(");
    }

    #[test]
    fn within_one_strength_the_wider_mark_still_wins() {
        let out = render(|w| {
            w.text("a").unwrap();
            w.site_with(1, SEAM_DECLARED);
            w.site_with(3, SEAM_DECLARED);
            w.text("b").unwrap();
        });
        assert_eq!(out, "a\nb");
        let tight = render(|w| {
            w.text("x").unwrap();
            w.site_with(2, SEAM_DECLARED);
            w.site_with(1, SEAM_DECLARED);
            w.text(";").unwrap();
        });
        assert_eq!(tight, "x;");
    }

    #[test]
    fn an_equal_strength_flank_replaces_a_held_face() {
        // `{ a }`: the brace's declared tight face meets the list's declared
        // space flank; the flank wins though it is narrower.
        let out = render(|w| {
            w.text("{").unwrap();
            w.site_with(1, SEAM_DECLARED);
            w.site_mark(2, SEAM_DECLARED, true);
            w.text("a").unwrap();
        });
        assert_eq!(out, "{ a");
    }

    #[test]
    fn an_equal_strength_face_does_not_replace_a_held_flank() {
        let out = render(|w| {
            w.text("a").unwrap();
            w.site_mark(2, SEAM_DECLARED, true);
            w.site_with(1, SEAM_DECLARED);
            w.text("}").unwrap();
        });
        assert_eq!(out, "a }");
    }

    #[test]
    fn strength_still_decides_before_the_flank_tie_break() {
        // `use a::{b}`: a cascaded flank space loses to the brace's declared
        // tight face in either order, and a declared flank beats a cascaded face.
        let held_face = render(|w| {
            w.text("{").unwrap();
            w.site_with(1, SEAM_DECLARED);
            w.site_mark(2, SEAM_CASCADE, true);
            w.text("b").unwrap();
        });
        assert_eq!(held_face, "{b");
        let held_flank = render(|w| {
            w.text("b").unwrap();
            w.site_mark(2, SEAM_CASCADE, true);
            w.site_with(1, SEAM_DECLARED);
            w.text("}").unwrap();
        });
        assert_eq!(held_flank, "b}");
        let declared_flank = render(|w| {
            w.text("{").unwrap();
            w.site_with(1, SEAM_CASCADE);
            w.site_mark(2, SEAM_DECLARED, true);
            w.text("b").unwrap();
        });
        assert_eq!(declared_flank, "{ b");
    }

    #[test]
    fn a_held_flank_survives_a_take_and_restore() {
        let out = render(|w| {
            w.text("a").unwrap();
            w.site_mark(2, SEAM_DECLARED, true);
            let held = w.take_seam().unwrap();
            assert!(held.flank);
            w.restore_seam(held);
            w.site_with(1, SEAM_DECLARED);
            w.text("}").unwrap();
        });
        assert_eq!(out, "a }");
    }
}
