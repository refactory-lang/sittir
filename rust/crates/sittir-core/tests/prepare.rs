use std::collections::HashMap;
use std::sync::Arc;

use sittir_core::engine::encode_handle;
use sittir_core::options::ResolvedOptions;
use sittir_core::prepare::{Prepare, RenderContext};
use sittir_core::render::{CoordinateError, SourceTable};
use sittir_core::types::Span;
use sittir_core::{NodeCoordinate, SlotValue};

struct Sources(HashMap<u32, Arc<str>>);
impl SourceTable for Sources {
    fn source_of(&self, tree_id: u32) -> Option<&Arc<str>> {
        self.0.get(&tree_id)
    }
}

struct Leaf;
impl Prepare for Leaf {
    fn prepare(&mut self, _: &RenderContext<'_>) -> Result<(), CoordinateError> {
        Ok(())
    }
}

struct List {
    space_after: Option<u16>,
    items: Vec<SlotValue<Leaf>>,
}
impl Prepare for List {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        self.items.prepare(ctx)?;
        self.space_after.get_or_insert(ctx.options.spacing[0]);
        Ok(())
    }
}

fn ctx<'a>(options: &'a ResolvedOptions, sources: &'a Sources) -> RenderContext<'a> {
    RenderContext { options, sources }
}

#[test]
fn a_coordinate_is_checked_against_its_tree_and_an_unset_site_takes_the_table() {
    let options = ResolvedOptions {
        spacing: vec![168],
        ..ResolvedOptions::default()
    };
    let sources = Sources(HashMap::from([(7, Arc::from("fn a() {}"))]));
    let mut list = List {
        space_after: None,
        items: vec![
            SlotValue::Coord(NodeCoordinate::new(
                encode_handle(7, 0),
                Span { start: 3, end: 4 },
            )),
            SlotValue::Transport(Leaf),
        ],
    };
    list.prepare(&ctx(&options, &sources)).unwrap();
    assert_eq!(list.space_after, Some(168));
}

#[test]
fn a_set_site_keeps_its_wire_value() {
    let options = ResolvedOptions {
        spacing: vec![168],
        ..ResolvedOptions::default()
    };
    let sources = Sources(HashMap::new());
    let mut list = List {
        space_after: Some(167),
        items: vec![],
    };
    list.prepare(&ctx(&options, &sources)).unwrap();
    assert_eq!(list.space_after, Some(167));
}

#[test]
fn a_coordinate_into_an_unknown_tree_fails_the_walk_with_its_handle() {
    let options = ResolvedOptions::default();
    let sources = Sources(HashMap::new());
    let handle = encode_handle(9, 2);
    let mut slot: SlotValue<Leaf> =
        SlotValue::Coord(NodeCoordinate::new(handle, Span { start: 0, end: 1 }));
    assert_eq!(
        slot.prepare(&ctx(&options, &sources)),
        Err(CoordinateError::UnknownTree { handle, tree_id: 9 })
    );
}

#[test]
fn a_span_outside_its_tree_fails_the_walk() {
    let options = ResolvedOptions::default();
    let sources = Sources(HashMap::from([(1, Arc::from("ab"))]));
    let handle = encode_handle(1, 0);
    let mut slot: SlotValue<Leaf> =
        SlotValue::Coord(NodeCoordinate::new(handle, Span { start: 0, end: 5 }));
    assert!(matches!(
        slot.prepare(&ctx(&options, &sources)),
        Err(CoordinateError::BadSpan { handle: h, .. }) if h == handle
    ));
}

#[test]
fn a_nested_container_is_walked_to_the_bottom() {
    let options = ResolvedOptions {
        spacing: vec![168],
        ..ResolvedOptions::default()
    };
    let sources = Sources(HashMap::new());
    let handle = encode_handle(4, 1);
    let mut nested: Option<Box<Vec<SlotValue<Leaf>>>> = Some(Box::new(vec![SlotValue::Coord(
        NodeCoordinate::new(handle, Span { start: 0, end: 1 }),
    )]));
    assert_eq!(
        nested.prepare(&ctx(&options, &sources)),
        Err(CoordinateError::UnknownTree { handle, tree_id: 4 })
    );
}
