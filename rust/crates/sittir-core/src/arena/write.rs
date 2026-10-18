//! What a record writer writes beside a record's cells: the side record of
//! the node's layout, keyed by its slots' stamped words, and its print
//! settings.

use super::{ArenaError, SideRecord, SideSlot, Sides};
use crate::layout::NodeLayout;

impl SideRecord {
    /// The side record of a node's layout. `slot_word` gives the stamped
    /// word of the list slot a layout entry names by its wire key; the
    /// writer adds the node's print settings after (`slot_mut`).
    ///
    /// # Errors
    ///
    /// `ArenaError::UnknownSlot` for a layout entry whose slot has no stamped
    /// cell in the node's record.
    pub fn of<T>(layout: Option<&NodeLayout<T>>, slot_word: impl Fn(&str) -> Option<u32>) -> Result<SideRecord, ArenaError> {
        let Some(layout) = layout else { return Ok(SideRecord::default()) };
        let slots = layout
            .slots
            .iter()
            .map(|slot| {
                let word = slot_word(&slot.slot).ok_or_else(|| ArenaError::UnknownSlot(slot.slot.as_str().into()))?;
                Ok(SideSlot { word, before: slot.before, after: slot.after, separator: slot.separator, space_before: None, space_after: None, tokens: slot.tokens.clone() })
            })
            .collect::<Result<_, ArenaError>>()?;
        Ok(SideRecord {
            at: layout.at.as_ref().map(|at| (at.index, at.end)),
            edges: layout.edges,
            span: layout.span,
            sides: layout.sides.as_ref().map(|from| Sides { tree: from.tree, index: from.index, end: from.end, span: from.span }),
            changed: layout.changed,
            separator: layout.separator,
            delimiter: None,
            separator_kind: None,
            slots,
        })
    }

    /// The entry of the slot at `word`, added when the record has none.
    pub fn slot_mut(&mut self, word: u32) -> &mut SideSlot {
        let at = self.slots.iter().position(|slot| slot.word == word).unwrap_or_else(|| {
            self.slots.push(SideSlot { word, ..SideSlot::default() });
            self.slots.len() - 1
        });
        &mut self.slots[at]
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::layout::SlotLayout;
    use crate::options::{EdgeArm, Edges};
    use crate::slot::{ChangedEdges, NodeCoordinate};
    use crate::trivia::TriviaText;
    use crate::types::{KindId, NodeIndex, Span, TreeId};

    fn coordinate(index: u32, end: u32) -> NodeCoordinate {
        NodeCoordinate { tree: TreeId(3), index: NodeIndex(index), end: NodeIndex(end), span: Span { start: 4, end: 9 }, kind: Some(KindId(5)), edges: None, writes: None }
    }

    fn layout() -> NodeLayout<TriviaText> {
        NodeLayout {
            trivia: None,
            edges: Some(Edges { before: Some(EdgeArm { arm: KindId(2), strength: None }), after: None }),
            at: Some(coordinate(6, 11)),
            span: None,
            sides: Some(coordinate(1, 2)),
            changed: ChangedEdges { leading: false, trailing: true },
            units: Vec::new(),
            slots: vec![SlotLayout { slot: "_items".to_owned(), before: Some(KindId(7)), after: None, separator: Some(KindId(8)), tokens: vec![None, Some(KindId(8))] }],
            separator: Some(KindId(9)),
        }
    }

    #[test]
    fn a_layout_s_facts_land_in_its_side_record_by_stamped_word() {
        let record = SideRecord::of(Some(&layout()), |key| (key == "_items").then_some(4)).expect("every slot is stamped");
        assert_eq!(record.at, Some((NodeIndex(6), NodeIndex(11))));
        assert_eq!(record.edges, layout().edges);
        assert_eq!(record.sides, Some(Sides { tree: TreeId(3), index: NodeIndex(1), end: NodeIndex(2), span: Span { start: 4, end: 9 } }));
        assert_eq!(record.changed, ChangedEdges { leading: false, trailing: true });
        assert_eq!(record.separator, Some(KindId(9)));
        assert_eq!(
            record.slots,
            vec![SideSlot { word: 4, before: Some(KindId(7)), after: None, separator: Some(KindId(8)), space_before: None, space_after: None, tokens: vec![None, Some(KindId(8))] }]
        );
        assert!(SideRecord::of::<TriviaText>(None, |_| None).expect("no layout").is_empty());
    }

    #[test]
    fn a_layout_slot_with_no_stamped_cell_is_refused_by_name() {
        assert_eq!(SideRecord::of(Some(&layout()), |_| None), Err(ArenaError::UnknownSlot("_items".into())));
    }

    #[test]
    fn a_setting_joins_its_slot_s_entry_or_adds_one() {
        let mut record = SideRecord::of(Some(&layout()), |_| Some(4)).expect("stamped");
        record.slot_mut(4).space_after = Some(KindId(1));
        record.slot_mut(6).space_before = Some(KindId::BLANK);
        let words: Vec<_> = record.slots.iter().map(|slot| (slot.word, slot.before, slot.space_before, slot.space_after)).collect();
        assert_eq!(words, vec![(4, Some(KindId(7)), None, Some(KindId(1))), (6, None, Some(KindId::BLANK), None)]);
    }
}
