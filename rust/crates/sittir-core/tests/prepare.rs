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

use sittir_core::options::{Edged, Edges, EdgeSite, EdgeSlot, Side, SiteSpec};
use sittir_core::prepare::prepare_edges;
use sittir_core::render::{RenderSink, WhitespaceTable};
use sittir_core::slot::SeamArm;
use sittir_core::spacing::{SpacingWriter, WordMatcher, SEAM_DECLARED};
use sittir_core::types::KindId;

fn two_sites() -> &'static [SiteSpec] {
    &[
        SiteSpec { default_arm: 7, strength: 1 },
        SiteSpec { default_arm: 7, strength: 1 },
    ]
}

#[test]
fn site_arm_uses_the_spec_strength_for_the_default_and_declared_otherwise() {
    let opts = ResolvedOptions {
        spacing: vec![7, 9],
        sites: two_sites(),
        ..ResolvedOptions::default()
    };
    assert_eq!(opts.site_arm(0), SeamArm { arm: 7, strength: 1 });
    assert_eq!(opts.site_arm(1), SeamArm { arm: 9, strength: SEAM_DECLARED });
}

fn ws_text(kind: u16) -> &'static str {
    match kind {
        9 => " ",
        _ => "",
    }
}
const WS: WhitespaceTable = WhitespaceTable { text_of: ws_text, indent: 0, dedent: 0 };

#[test]
fn a_sink_writes_a_site_from_the_options_it_holds() {
    let opts = ResolvedOptions {
        spacing: vec![7, 9],
        sites: two_sites(),
        ..ResolvedOptions::default()
    };
    let mut out = String::new();
    let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident())
        .with_table(&WS)
        .with_options(&opts);
    w.text("a").unwrap();
    w.site_at(1);
    w.text("b").unwrap();
    w.finish().unwrap();
    assert_eq!(out, "a b");
}

static EDGE_ROWS: &[EdgeSite] = &[EdgeSite {
    kind: 3,
    before: EdgeSlot { site: 0, default_arm: 5, strength: 1 },
    after: EdgeSlot { site: 1, default_arm: 6, strength: 1 },
}];

struct Edged3 {
    edges: Edges,
}
impl Edged for Edged3 {
    fn kind_id(&self) -> KindId {
        KindId(3)
    }
    fn edges(&self) -> &Edges {
        &self.edges
    }
    fn edges_mut(&mut self) -> &mut Edges {
        &mut self.edges
    }
}

#[test]
fn an_edged_transport_prepares_its_edges_from_the_edge_row() {
    let opts = ResolvedOptions {
        spacing: vec![5, 6],
        edges: EDGE_ROWS,
        ..ResolvedOptions::default()
    };
    let sources = Sources(HashMap::new());
    let mut leaf = Edged3 { edges: Edges::default() };
    prepare_edges(&mut leaf, &ctx(&opts, &sources));
    assert_eq!(leaf.edges, Edges { before: Some(5), after: Some(6) });
}

#[test]
fn a_stamped_edge_keeps_its_arm_and_carries_declared_strength() {
    let opts = ResolvedOptions {
        spacing: vec![5, 6],
        edges: EDGE_ROWS,
        ..ResolvedOptions::default()
    };
    assert_eq!(opts.edge_arm(KindId(3), Side::After, Some(9)), Some(SeamArm { arm: 9, strength: SEAM_DECLARED }));
    assert_eq!(opts.edge_arm(KindId(3), Side::Before, None), Some(SeamArm { arm: 5, strength: 1 }));
    assert_eq!(opts.edge_arm(KindId(4), Side::Before, None), None);
    let sources = Sources(HashMap::new());
    let mut leaf = Edged3 { edges: Edges { before: None, after: Some(8) } };
    prepare_edges(&mut leaf, &ctx(&opts, &sources));
    assert_eq!(leaf.edges, Edges { before: Some(5), after: Some(8) });
}
