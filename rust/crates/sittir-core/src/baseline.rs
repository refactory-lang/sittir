//! What a parsed tree's read-time options render at each gap of its source:
//! the whitespace a render of the whole tree from its templates writes
//! there, counted as line breaks, spaces and tabs (`Tally`, `Baseline`),
//! recorded by the writer as it renders (`Recorder`).
//!
//! The writer anchors what it writes to the source by what it renders from:
//! a node's frame (`RenderSink::open_frame`, its origin's span) and a slice
//! of source text (`RenderSink::slice`, its coordinate's span). An anchor
//! opening at a byte resolves at the next text the render writes: the line
//! breaks written after the text before it and before that text; one with
//! no text before it in the render has nothing on that side. An anchor
//! closing at a byte resolves at the next text after it the same way, from
//! the count when it closed. The whitespace between two counts is the
//! difference of each of its tallies. A gap of the source from `start` to
//! `end` reads the breaks written between what closes at `start` and what
//! opens at `end`, either one standing in for the other when only one is
//! anchored (`Baseline::between`).
//!
//! A gap is measured from the last text that is not whitespace: a text's
//! own trailing line breaks (a slice of a token that ends its line, a
//! shebang's) and a text of whitespace alone (a template's literal line
//! end) belong to the gap after it, resolve no anchor and are no item. So
//! a template that writes a token and then its line end, and a slice that
//! writes them together, record the same breaks.
//!
//! A gap beside text no frame or slice holds (a literal, a unit kind, a
//! presence keyword, a zero-width token) reads its node's frame instead:
//! the items written directly in it, each text by its text and each node
//! framed or sliced inside it by its index, with the breaks written around
//! each (`Baseline::frame`).

use std::cell::RefCell;
use std::collections::HashMap;

/// The whitespace a render has written so far: its line breaks, spaces and
/// tabs. A gap's whitespace is the tally at its end less the tally at its
/// start (`since`).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct Tally {
    pub breaks: u32,
    pub spaces: u32,
    pub tabs: u32,
}

impl Tally {
    /// The tally of `s`.
    pub fn of(s: &str) -> Self {
        s.chars().fold(Self::default(), |tally, c| match c {
            '\n' => Self { breaks: tally.breaks + 1, ..tally },
            ' ' => Self { spaces: tally.spaces + 1, ..tally },
            '\t' => Self { tabs: tally.tabs + 1, ..tally },
            _ => tally,
        })
    }

    /// What was written from `from` to this tally.
    pub fn since(self, from: Self) -> Self {
        Self { breaks: self.breaks.saturating_sub(from.breaks), spaces: self.spaces.saturating_sub(from.spaces), tabs: self.tabs.saturating_sub(from.tabs) }
    }

    fn plus(self, other: Self) -> Self {
        Self { breaks: self.breaks + other.breaks, spaces: self.spaces + other.spaces, tabs: self.tabs + other.tabs }
    }

    /// The whitespace a gap of this tally writes, as a layout class reads it:
    /// its line breaks alone when it breaks the line, its spaces and tabs
    /// otherwise.
    pub fn spelling(self) -> String {
        if self.breaks > 0 {
            "\n".repeat(self.breaks as usize)
        } else {
            format!("{}{}", " ".repeat(self.spaces as usize), "\t".repeat(self.tabs as usize))
        }
    }
}

/// One thing a frame wrote directly: a text, by its text, or a node inside
/// it, rendered in a frame of its own or as a slice of its
/// source, by its index; with the tally written before it and by its end.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Item {
    pub what: Written,
    pub before: Tally,
    pub after: Tally,
}

/// What an item is (`Item`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Written {
    Text(Box<str>),
    Node(u32),
}

impl Written {
    /// A text's item: its text without whitespace, so a template literal
    /// that writes several tokens at once (`()`, `not in`) spells those
    /// tokens' texts one after another.
    pub fn text(text: &str) -> Self {
        Written::Text(text.chars().filter(|c| !c.is_whitespace()).collect())
    }
}

/// What a node's frame wrote: the tally written before its first text and
/// by its close, and its items in order.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct FrameItems {
    pub open: Tally,
    pub close: Tally,
    pub items: Vec<Item>,
}

/// The whitespace a recording render wrote, by the source bytes of what it
/// wrote around it, and each node's frame by its index.
#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct Baseline {
    opens: HashMap<u32, (Option<Tally>, Tally)>,
    closes: HashMap<u32, (Tally, Tally)>,
    frames: HashMap<u32, FrameItems>,
}

impl Baseline {
    /// The whitespace written in the source gap from byte `start` to byte
    /// `end`, or `None` when nothing the render wrote is anchored at either,
    /// or the render wrote nothing before it.
    pub fn between(&self, start: u32, end: u32) -> Option<Tally> {
        let close = self.closes.get(&start);
        let open = self.opens.get(&end);
        let from = close.map(|close| close.0).or_else(|| open?.0)?;
        let to = open.map(|open| open.1).or_else(|| close.map(|close| close.1))?;
        Some(to.since(from))
    }

    /// The frame the node at descendant `index` rendered in, when it did.
    pub fn frame(&self, index: u32) -> Option<&FrameItems> {
        self.frames.get(&index)
    }
}

/// An open node of a recording render: its descendant index and end byte
/// when it was read from the tree, and what it has written directly.
#[derive(Debug)]
struct OpenFrame {
    index: Option<u32>,
    end: Option<u32>,
    open: Option<Tally>,
    items: Vec<Item>,
}

/// The counts of a trailing run the writer renders ahead of where it is
/// written (`RenderSink::defer_trailing`): its tally from the run's start,
/// and its anchors, resolved within the run or still waiting.
#[derive(Debug, Default)]
struct Run {
    written: Tally,
    ended: Tally,
    last_end: Option<Tally>,
    opens: Vec<u32>,
    closes: Vec<(u32, Tally)>,
    resolved_opens: Vec<(u32, (Option<Tally>, Tally))>,
    resolved_closes: Vec<(u32, (Tally, Tally))>,
}

/// The writer's side of a recording render: the tally written so far, the
/// anchors waiting for the next text, and the open frames.
#[derive(Debug)]
pub struct Recorder<'a> {
    baseline: &'a RefCell<Baseline>,
    written: Tally,
    ended: Tally,
    last_end: Option<Tally>,
    opens: Vec<u32>,
    closes: Vec<(u32, Tally)>,
    frames: Vec<OpenFrame>,
    deferring: Option<Run>,
    held: Vec<Run>,
    counting: bool,
    text_before: Tally,
    /// The first byte the run written last opens and the tally ended before
    /// it, until the next text (`wrote_run`).
    before_run: Option<(u32, Tally)>,
}

impl<'a> Recorder<'a> {
    pub fn new(baseline: &'a RefCell<Baseline>) -> Self {
        Self {
            baseline,
            written: Tally::default(),
            ended: Tally::default(),
            last_end: None,
            opens: Vec::new(),
            closes: Vec::new(),
            frames: Vec::new(),
            deferring: None,
            held: Vec::new(),
            counting: true,
            text_before: Tally::default(),
            before_run: None,
        }
    }

    /// Text reached the output, or the run being deferred.
    pub fn emitted(&mut self, s: &str) {
        let tally = Tally::of(s);
        match self.deferring.as_mut() {
            Some(run) => run.written = run.written.plus(tally),
            None => self.written = self.written.plus(tally),
        }
    }

    /// The whitespace `s` ends with.
    fn tail_of(s: &str) -> Tally {
        Tally::of(&s[s.trim_end().len()..])
    }

    /// A node's frame opened, from the node at `origin` when it was read
    /// from the tree: its descendant index and the bytes it spans.
    pub fn open_frame(&mut self, origin: Option<(u32, u32, u32)>) {
        self.frames.push(OpenFrame { index: origin.map(|(index, ..)| index), end: origin.map(|(.., end)| end), open: None, items: Vec::new() });
        if let Some((_, start, _)) = origin {
            self.open(start);
        }
    }

    /// The innermost frame closed. A frame read from the tree keeps what it
    /// wrote, and stands as one item of the frame read from the tree around
    /// it; one opened again inside a frame of the same node (an alias
    /// envelope's content) writes its items into that frame.
    pub fn close_frame(&mut self) {
        let Some(frame) = self.frames.pop() else { return };
        let (Some(index), Some(end)) = (frame.index, frame.end) else { return };
        let open = frame.open.unwrap_or(self.written);
        let item = Item { what: Written::Node(index), before: open, after: self.ended };
        if let Some(parent) = self.frames.iter_mut().rev().find(|frame| frame.index.is_some()) {
            if parent.index == Some(index) {
                parent.items.extend(frame.items);
                return;
            }
            parent.items.push(item);
        }
        self.baseline.borrow_mut().frames.insert(index, FrameItems { open, close: self.ended, items: frame.items });
        self.close(end);
    }

    /// Source text from `start` begins: it opens at the next text.
    pub fn open(&mut self, start: u32) {
        match self.deferring.as_mut() {
            Some(run) => run.opens.push(start),
            None => self.opens.push(start),
        }
    }

    /// Source text ending at `end` was written.
    pub fn close(&mut self, end: u32) {
        match self.deferring.as_mut() {
            Some(run) => run.closes.push((end, run.ended)),
            None => {
                let at = self.before_run.filter(|&(first, _)| end <= first).map_or(self.ended, |(_, ended)| ended);
                self.closes.push((end, at));
            }
        }
    }

    /// Whether the texts that follow are items of their frame: a slice of
    /// source or verbatim text is trivia, which no frame counts.
    pub fn count_texts(&mut self, on: bool) -> bool {
        std::mem::replace(&mut self.counting, on)
    }

    /// The text `s` is about to be written: the anchors waiting for it
    /// resolve, and the frames it opens have opened, unless it is
    /// whitespace alone.
    pub fn before_text(&mut self, s: &str) {
        if s.trim().is_empty() {
            return;
        }
        if let Some(run) = self.deferring.as_mut() {
            let (prev, now) = (run.last_end, run.written);
            run.resolved_opens.extend(run.opens.drain(..).map(|start| (start, (prev, now))));
            run.resolved_closes.extend(run.closes.drain(..).map(|(end, at)| (end, (at, now))));
            return;
        }
        let (prev, now) = (self.last_end, self.written);
        let mut baseline = self.baseline.borrow_mut();
        for start in self.opens.drain(..) {
            baseline.opens.entry(start).or_insert((prev, now));
        }
        for (end, at) in self.closes.drain(..) {
            baseline.closes.insert(end, (at, now));
        }
        drop(baseline);
        self.before_run = None;
        self.text_before = now;
        for frame in self.frames.iter_mut().rev().take_while(|frame| frame.open.is_none()) {
            frame.open = Some(now);
        }
        if self.counting {
            if let Some(frame) = self.frames.iter_mut().rev().find(|frame| frame.index.is_some()) {
                frame.items.push(Item { what: Written::text(s), before: now, after: now });
            }
        }
    }

    /// The text `s` was written: unless it is whitespace alone, the gap
    /// after it is measured from its end, before its own trailing breaks.
    pub fn after_text(&mut self, s: &str) {
        if s.trim().is_empty() {
            return;
        }
        let tail = Self::tail_of(s);
        match self.deferring.as_mut() {
            Some(run) => {
                run.ended = run.written.since(tail);
                run.last_end = Some(run.ended);
            }
            None => {
                self.ended = self.written.since(tail);
                self.last_end = Some(self.ended);
                if self.counting {
                    if let Some(item) = self.frames.iter_mut().rev().find(|frame| frame.index.is_some()).and_then(|frame| frame.items.last_mut()) {
                        item.after = self.ended;
                    }
                }
            }
        }
    }

    /// The text just written was a slice of the source of the node at
    /// descendant `index`: an item of the frame around it.
    pub fn wrote_slice(&mut self, index: u32) {
        if self.deferring.is_some() {
            return;
        }
        let item = Item { what: Written::Node(index), before: self.text_before, after: self.ended };
        if let Some(frame) = self.frames.iter_mut().rev().find(|frame| frame.index.is_some()) {
            frame.items.push(item);
        }
    }

    /// A trailing run starts rendering ahead of where it is written.
    pub fn start_run(&mut self) {
        self.deferring = Some(Run::default());
    }

    /// The trailing run ended; it waits to be written, as the writer's
    /// `deferred` runs do, unless it wrote nothing.
    pub fn end_run(&mut self, kept: bool) {
        if let Some(run) = self.deferring.take().filter(|_| kept) {
            self.held.push(run);
        }
    }

    /// The next held run was just written where the output stood: its
    /// anchors count from the breaks written before it, an anchor opening
    /// before its first text counting from the end of the text before the
    /// run, and what closed before it closes at its first text. Until the next text, a source
    /// text closing at or before the first byte the run opens (a frame
    /// around the node whose trailing run it is) closed before the run
    /// (`close`).
    pub fn wrote_run(&mut self) {
        if self.held.is_empty() {
            return;
        }
        let run = self.held.remove(0);
        let base = self.written.since(run.written);
        let before = self.last_end;
        let first = run.resolved_opens.iter().map(|&(start, _)| start).chain(run.opens.iter().copied()).min();
        self.before_run = first.map(|first| (first, self.ended));
        let mut baseline = self.baseline.borrow_mut();
        for (end, at) in self.closes.drain(..) {
            baseline.closes.insert(end, (at, base));
        }
        for (start, (prev, now)) in run.resolved_opens {
            baseline.opens.entry(start).or_insert((prev.map(|prev| base.plus(prev)).or(before), base.plus(now)));
        }
        for (end, (at, now)) in run.resolved_closes {
            baseline.closes.insert(end, (base.plus(at), base.plus(now)));
        }
        drop(baseline);
        self.opens.extend(run.opens);
        self.closes.extend(run.closes.into_iter().map(|(end, at)| (end, base.plus(at))));
        self.last_end = run.last_end.map(|end| base.plus(end)).or(self.last_end);
        if let Some(end) = run.last_end {
            self.ended = base.plus(end);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn text(recorder: &mut Recorder<'_>, s: &str) {
        recorder.before_text(s);
        recorder.emitted(s);
        recorder.after_text(s);
    }

    #[test]
    fn a_frame_closing_after_its_node_trailing_run_was_written_closes_before_the_run() {
        let baseline = RefCell::new(Baseline::default());
        let mut recorder = Recorder::new(&baseline);
        recorder.open(14);
        text(&mut recorder, "b");
        recorder.close(15);
        recorder.start_run();
        recorder.open(16);
        text(&mut recorder, "# c");
        recorder.close(19);
        recorder.end_run(true);
        recorder.emitted(" ");
        recorder.emitted("# c");
        recorder.wrote_run();
        recorder.close(15);
        recorder.open(20);
        text(&mut recorder, "x");
        assert_eq!(baseline.borrow().between(15, 16), Some(Tally { spaces: 1, ..Tally::default() }));
    }

    #[test]
    fn a_trailing_run_after_text_with_no_anchor_measures_from_that_text() {
        let baseline = RefCell::new(Baseline::default());
        let mut recorder = Recorder::new(&baseline);
        text(&mut recorder, "this");
        recorder.start_run();
        recorder.open(10);
        text(&mut recorder, "/* c */");
        recorder.close(17);
        recorder.end_run(true);
        recorder.emitted(" ");
        recorder.emitted("/* c */");
        recorder.wrote_run();
        assert_eq!(baseline.borrow().between(9, 10), Some(Tally { spaces: 1, ..Tally::default() }));
    }
}
