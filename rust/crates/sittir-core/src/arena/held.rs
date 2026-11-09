//! The engine's held-parse table: each arena parse sits in a slot counted
//! once by its root and once by each link record that names the slot.

use std::fmt;

use crate::types::TreeId;

/// A parse the held-parse table holds, named by its id.
pub trait Held {
    /// The id of the parse: what every read handle into it names beside its
    /// slot.
    fn id(&self) -> TreeId;
}

/// A read handle's refusal: the parse it names was released, and its slot
/// holds no parse or another one.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ParseReleased(pub TreeId);

impl fmt::Display for ParseReleased {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "parse {} was released, so a handle into it reads nothing", self.0 .0)
    }
}

impl std::error::Error for ParseReleased {}

#[derive(Debug)]
struct Slot<P> {
    parse: Option<P>,
    count: u32,
}

/// Each parse held, in a slot counted once by the parse's root and once by
/// each link record naming the slot. A slot whose count reaches 0 drops its
/// parse and is the next slot a parse takes; one still counted is never
/// reused.
#[derive(Debug)]
pub struct HeldParses<P> {
    slots: Vec<Slot<P>>,
    free: Vec<u32>,
}

impl<P> Default for HeldParses<P> {
    fn default() -> Self {
        Self { slots: Vec::new(), free: Vec::new() }
    }
}

impl<P: Held> HeldParses<P> {
    /// Holds `parse` in a free slot, counted once by its root, and answers
    /// the slot.
    pub fn hold(&mut self, parse: P) -> u32 {
        let held = Slot { parse: Some(parse), count: 1 };
        if let Some(slot) = self.free.pop() {
            self.slots[slot as usize] = held;
            return slot;
        }
        self.slots.push(held);
        crate::types::narrow(self.slots.len() - 1)
    }

    /// Counts slot `slot` once more, for a link record naming it.
    ///
    /// # Errors
    ///
    /// `ParseReleased` when the slot no longer holds the parse `parse`.
    pub fn link(&mut self, slot: u32, parse: TreeId) -> Result<(), ParseReleased> {
        let held = self.slots.get_mut(slot as usize).filter(|held| held.parse.as_ref().is_some_and(|held| held.id() == parse)).ok_or(ParseReleased(parse))?;
        held.count += 1;
        Ok(())
    }

    /// Drops one count of slot `slot`: the root's, or a link record's. The
    /// last count's release takes the parse out of the table and answers
    /// it; a slot no holder counts is left as it is.
    pub fn release(&mut self, slot: u32) -> Option<P> {
        let held = self.slots.get_mut(slot as usize).filter(|held| held.count > 0)?;
        held.count -= 1;
        if held.count > 0 {
            return None;
        }
        self.free.push(slot);
        held.parse.take()
    }

    /// The parse in slot `slot`, for a holder that counts it.
    ///
    /// # Panics
    ///
    /// When the slot holds no parse, which no holder counting it can see.
    #[must_use]
    pub fn get(&self, slot: u32) -> &P {
        self.slots.get(slot as usize).and_then(|held| held.parse.as_ref()).unwrap_or_else(|| panic!("slot {slot} holds no parse, though a holder counts it"))
    }

    /// The parse `parse` in slot `slot`, for a read handle, which borrows the
    /// slot without counting it.
    ///
    /// # Errors
    ///
    /// `ParseReleased` when the slot no longer holds that parse.
    pub fn borrowed(&self, slot: u32, parse: TreeId) -> Result<&P, ParseReleased> {
        self.slots.get(slot as usize).and_then(|held| held.parse.as_ref()).filter(|held| held.id() == parse).ok_or(ParseReleased(parse))
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
