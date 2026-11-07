//! The levels a writer has open, and the depth move a tree root's slice
//! leaves on them until something reads them.

use crate::render::SourceTable;
use crate::slot::NodeCoordinate;

/// The levels a writer has open: how many; for each, how many further
/// opens asked for it at the position it opened (an open while armed:
/// depth is one fact per position, so those merge into it, and their
/// closes unwind first); and whether the last open has had no text since
/// (armed).
#[derive(Debug, Default)]
pub(super) struct Levels {
    depth: usize,
    merged: Vec<usize>,
    armed: bool,
}

/// What a close did: unwound an open merged into the innermost level, or
/// closed that level.
pub(super) enum Closed {
    Merged,
    Level { armed: bool },
}

impl Levels {
    pub(super) fn depth(&self) -> usize {
        self.depth
    }

    pub(super) fn armed(&self) -> bool {
        self.armed
    }

    /// Sets whether the last open is armed, answering whether it was.
    pub(super) fn arm(&mut self, armed: bool) -> bool {
        std::mem::replace(&mut self.armed, armed)
    }

    /// Opens a level, or merges into the innermost one while it is armed.
    pub(super) fn open(&mut self) {
        if self.armed {
            if let Some(merged) = self.merged.last_mut() {
                *merged += 1;
                return;
            }
        }
        self.depth += 1;
        self.merged.push(0);
        self.armed = true;
    }

    /// Unwinds an open merged into the innermost level, or closes that
    /// level, never below none, disarming it.
    pub(super) fn close(&mut self) -> Closed {
        if let Some(merged) = self.merged.last_mut().filter(|merged| **merged > 0) {
            *merged -= 1;
            return Closed::Merged;
        }
        self.merged.pop();
        self.depth = self.depth.saturating_sub(1);
        Closed::Level { armed: self.arm(false) }
    }
}

/// The move of a slice whose text is written, not yet made, and whether
/// text written after it disarms what the move opens.
#[derive(Debug)]
struct Held {
    coord: NodeCoordinate,
    disarmed: bool,
}

/// A writer's levels, with the depth move of a tree root's slice held
/// until something reads them (`levels`): a move nothing reads is never
/// found. Only a root's move is held: it is its whole tree's net, while any
/// other slice's move may close what a template opened around it, which the
/// render's end checks (`SpacingWriter::finish`).
#[derive(Debug, Default)]
pub(super) struct Depth {
    levels: Levels,
    held: Option<Held>,
}

impl Depth {
    /// The levels, with the held move made on them first: the opens or
    /// closes the slice's node makes net (`SourceTable::depth_move`), as
    /// the slice would have made them after its text, then the disarm of
    /// any text written since.
    pub(super) fn levels(&mut self, sources: Option<&dyn SourceTable>) -> &mut Levels {
        if let Some(held) = self.held.take() {
            debug_assert!(!self.levels.armed, "a held move starts after its slice's text");
            let moved = sources.map_or(0, |sources| sources.depth_move(&held.coord));
            for _ in 0..moved.unsigned_abs() {
                if moved > 0 {
                    self.levels.open();
                } else {
                    let _ = self.levels.close();
                }
            }
            if held.disarmed {
                self.levels.armed = false;
            }
        }
        &mut self.levels
    }

    /// Holds the move of the tree root's slice `coord` names, whose text has
    /// just been written, making any move held before it first. Its closes
    /// then meet a disarmed level, so they merge no seam and clear no
    /// payload.
    pub(super) fn hold(&mut self, coord: &NodeCoordinate, sources: Option<&dyn SourceTable>) {
        let _ = self.levels(sources);
        self.held = Some(Held { coord: coord.clone(), disarmed: false });
    }

    /// Text was written: the last open is no longer armed, after any held
    /// move is made.
    pub(super) fn disarm(&mut self) {
        match self.held.as_mut() {
            Some(held) => held.disarmed = true,
            None => self.levels.armed = false,
        }
    }

    /// The levels at the end of a render, a move still held dropped:
    /// nothing reads it.
    pub(super) fn at_end(&mut self) -> &Levels {
        self.held = None;
        &self.levels
    }
}
