//! The engine's held-parse table: each arena parse sits in a slot counted
//! once by its root and once by each built record that names the slot.

use std::fmt;

use crate::types::{ParseSlot, TreeId};

/// A parse the held-parse table holds, named by its id.
pub trait Held {
    /// The id of the parse: what every read handle into it names beside its
    /// slot.
    fn id(&self) -> TreeId;
}

/// An arena parse as its engine holds it: its id, the key of its tree in
/// the live-tree table, which keeps what its nodes read from.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HeldParse(pub TreeId);

impl Held for HeldParse {
    fn id(&self) -> TreeId {
        self.0
    }
}

/// A refusal of a parse that is no longer held: the slot that names it
/// holds no parse, or another one.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ParseReleased(pub TreeId);

impl fmt::Display for ParseReleased {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "parse {} was released, or another engine parsed it, so this engine reads nothing of it", self.0 .0)
    }
}

impl std::error::Error for ParseReleased {}

#[derive(Debug)]
struct Slot<P> {
    parse: Option<P>,
    count: u32,
}

/// Each parse held, in a slot counted once by the parse's root and once by
/// each built record naming the slot. A slot whose count reaches 0 drops
/// its parse and is the next slot a parse takes; one still counted is never
/// reused.
#[derive(Debug)]
pub struct HeldParses<P> {
    slots: Vec<Slot<P>>,
    free: Vec<ParseSlot>,
}

impl<P> Default for HeldParses<P> {
    fn default() -> Self {
        Self { slots: Vec::new(), free: Vec::new() }
    }
}

impl<P: Held> HeldParses<P> {
    /// Holds `parse` in a free slot, counted once by its root, and answers
    /// the slot.
    pub fn hold(&mut self, parse: P) -> ParseSlot {
        let held = Slot { parse: Some(parse), count: 1 };
        if let Some(slot) = self.free.pop() {
            self.slots[slot.index()] = held;
            return slot;
        }
        self.slots.push(held);
        ParseSlot(crate::types::narrow(self.slots.len() - 1))
    }

    /// Counts slot `slot` once more, for a built record naming it.
    ///
    /// # Errors
    ///
    /// `ParseReleased` when the slot no longer holds the parse `parse`.
    pub fn retain(&mut self, slot: ParseSlot, parse: TreeId) -> Result<(), ParseReleased> {
        let held = self.slots.get_mut(slot.index()).filter(|held| held.parse.as_ref().is_some_and(|held| held.id() == parse)).ok_or(ParseReleased(parse))?;
        held.count += 1;
        Ok(())
    }

    /// Drops one count of slot `slot`: the root's, or a built record's. The
    /// last count's release takes the parse out of the table and answers
    /// it; a slot no holder counts is left as it is.
    pub fn release(&mut self, slot: ParseSlot) -> Option<P> {
        let held = self.slots.get_mut(slot.index()).filter(|held| held.count > 0)?;
        held.count -= 1;
        if held.count > 0 {
            return None;
        }
        self.free.push(slot);
        held.parse.take()
    }

    /// The parse in slot `slot`, or `None` when the slot holds none: a slot
    /// a built record names is read from words the arena's writer wrote,
    /// so it is checked, not trusted.
    #[must_use]
    pub fn get(&self, slot: ParseSlot) -> Option<&P> {
        self.slots.get(slot.index()).and_then(|held| held.parse.as_ref())
    }

    /// The parse `parse` in slot `slot`, for a read handle, which borrows the
    /// slot without counting it.
    ///
    /// # Errors
    ///
    /// `ParseReleased` when the slot no longer holds that parse.
    pub fn borrowed(&self, slot: ParseSlot, parse: TreeId) -> Result<&P, ParseReleased> {
        self.get(slot).filter(|held| held.id() == parse).ok_or(ParseReleased(parse))
    }

    /// The slot that holds the records of tree `tree`, when one does.
    #[must_use]
    pub fn slot_of(&self, tree: TreeId) -> Option<ParseSlot> {
        let at = self.slots.iter().position(|held| held.parse.as_ref().is_some_and(|held| held.id() == tree))?;
        Some(ParseSlot(crate::types::narrow(at)))
    }

    /// Whether a slot holds the parse `parse`.
    #[must_use]
    pub fn holds(&self, parse: TreeId) -> bool {
        self.slot_of(parse).is_some()
    }

    /// Takes every parse out of the table, whatever counts it, and answers
    /// them: the table's end, at its engine's dispose.
    pub fn drain(&mut self) -> Vec<P> {
        self.free.clear();
        std::mem::take(&mut self.slots).into_iter().filter_map(|held| held.parse).collect()
    }

    /// How many parses the table holds.
    #[must_use]
    pub fn len(&self) -> usize {
        self.slots.len() - self.free.len()
    }

    /// Whether the table holds no parse.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }
}
