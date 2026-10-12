//! What a parsed tree's read-time options render at each gap of its source:
//! the line breaks a render of the whole tree from its templates writes
//! there (`Baseline`), recorded by the writer as it renders (`Recorder`).
//!
//! The writer anchors what it writes to the source by what it renders from:
//! a node's frame (`RenderSink::open_frame`, its origin's span) and a slice
//! of source text (`RenderSink::slice`, its coordinate's span). An anchor
//! opening at a byte resolves at the next text the render writes: the line
//! breaks written after the text before it and before that text; one with
//! no text before it in the render has nothing on that side. An anchor
//! closing at a byte resolves at the next text after it the same way, from
//! the breaks written when it closed. A gap of the source from `start` to
//! `end` reads the breaks written between what closes at `start` and what
//! opens at `end`, either one standing in for the other when only one is
//! anchored (`Baseline::between`).
//!
//! A gap beside text no frame or slice holds (a literal, a unit kind, a
//! presence keyword, a zero-width token) reads its node's frame instead:
//! the items written directly in it, each text by its text and each node
//! framed or sliced inside it by its index, with the breaks written around
//! each (`Baseline::frame`).

use std::cell::RefCell;
use std::collections::HashMap;

/// One thing a frame wrote directly: a text, by its text, or a node inside
/// it, rendered in a frame of its own or as a slice of its
/// source, by its index; with the line breaks written before it and by its
/// end.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Item {
    pub what: Written,
    pub before: u32,
    pub after: u32,
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

/// What a node's frame wrote: the line breaks written before its first text
/// and by its close, and its items in order.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct FrameItems {
    pub open: u32,
    pub close: u32,
    pub items: Vec<Item>,
}

/// The line breaks a recording render wrote, by the source bytes of what it
/// wrote around them, and each node's frame by its index.
#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct Baseline {
    opens: HashMap<u32, (Option<u32>, u32)>,
    closes: HashMap<u32, (u32, u32)>,
    frames: HashMap<u32, FrameItems>,
}

impl Baseline {
    /// The line breaks written in the source gap from byte `start` to byte
    /// `end`, or `None` when nothing the render wrote is anchored at either,
    /// or the render wrote nothing before it.
    pub fn between(&self, start: u32, end: u32) -> Option<u32> {
        let close = self.closes.get(&start);
        let open = self.opens.get(&end);
        let from = close.map(|close| close.0).or_else(|| open?.0)?;
        let to = open.map(|open| open.1).or_else(|| close.map(|close| close.1))?;
        Some(to.saturating_sub(from))
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
    open: Option<u32>,
    items: Vec<Item>,
}

/// The counts of a trailing run the writer renders ahead of where it is
/// written (`RenderSink::defer_trailing`): breaks counted from the run's
/// start, and its anchors, resolved within the run or still waiting.
#[derive(Debug, Default)]
struct Run {
    written: u32,
    last_end: Option<u32>,
    opens: Vec<u32>,
    closes: Vec<(u32, u32)>,
    resolved_opens: Vec<(u32, (Option<u32>, u32))>,
    resolved_closes: Vec<(u32, (u32, u32))>,
}

/// The writer's side of a recording render: the breaks written so far, the
/// anchors waiting for the next text, and the open frames.
#[derive(Debug)]
pub struct Recorder<'a> {
    baseline: &'a RefCell<Baseline>,
    written: u32,
    last_end: Option<u32>,
    opens: Vec<u32>,
    closes: Vec<(u32, u32)>,
    frames: Vec<OpenFrame>,
    deferring: Option<Run>,
    held: Vec<Run>,
    counting: bool,
    text_before: u32,
}

impl<'a> Recorder<'a> {
    pub fn new(baseline: &'a RefCell<Baseline>) -> Self {
        Self { baseline, written: 0, last_end: None, opens: Vec::new(), closes: Vec::new(), frames: Vec::new(), deferring: None, held: Vec::new(), counting: true, text_before: 0 }
    }

    /// Text reached the output, or the run being deferred.
    pub fn emitted(&mut self, s: &str) {
        let breaks = s.matches('\n').count() as u32;
        match self.deferring.as_mut() {
            Some(run) => run.written += breaks,
            None => self.written += breaks,
        }
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
        let item = Item { what: Written::Node(index), before: open, after: self.written };
        if let Some(parent) = self.frames.iter_mut().rev().find(|frame| frame.index.is_some()) {
            if parent.index == Some(index) {
                parent.items.extend(frame.items);
                return;
            }
            parent.items.push(item);
        }
        self.baseline.borrow_mut().frames.insert(index, FrameItems { open, close: self.written, items: frame.items });
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
            Some(run) => run.closes.push((end, run.written)),
            None => self.closes.push((end, self.written)),
        }
    }

    /// Whether the texts that follow are items of their frame: a slice of
    /// source or verbatim text is trivia, which no frame counts.
    pub fn count_texts(&mut self, on: bool) -> bool {
        std::mem::replace(&mut self.counting, on)
    }

    /// The text `s` is about to be written: the anchors waiting for it
    /// resolve, and the frames it opens have opened.
    pub fn before_text(&mut self, s: &str) {
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

    /// A text was written.
    pub fn after_text(&mut self) {
        match self.deferring.as_mut() {
            Some(run) => run.last_end = Some(run.written),
            None => {
                self.last_end = Some(self.written);
                if self.counting {
                    if let Some(item) = self.frames.iter_mut().rev().find(|frame| frame.index.is_some()).and_then(|frame| frame.items.last_mut()) {
                        item.after = self.written;
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
        let item = Item { what: Written::Node(index), before: self.text_before, after: self.written };
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
    /// anchors count from the breaks written before it, and what closed
    /// before it closes at its first text.
    pub fn wrote_run(&mut self) {
        if self.held.is_empty() {
            return;
        }
        let run = self.held.remove(0);
        let base = self.written.saturating_sub(run.written);
        let before = self.last_end.map(|_| base);
        let mut baseline = self.baseline.borrow_mut();
        for (end, at) in self.closes.drain(..) {
            baseline.closes.insert(end, (at, base));
        }
        for (start, (prev, now)) in run.resolved_opens {
            baseline.opens.entry(start).or_insert((prev.map(|prev| base + prev).or(before), base + now));
        }
        for (end, (at, now)) in run.resolved_closes {
            baseline.closes.insert(end, (base + at, base + now));
        }
        drop(baseline);
        self.opens.extend(run.opens);
        self.closes.extend(run.closes.into_iter().map(|(end, at)| (end, base + at)));
        self.last_end = run.last_end.map(|end| base + end).or(self.last_end);
    }
}
