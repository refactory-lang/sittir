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
        self.space_after.get_or_insert(ctx.options.spacing[0].arm);
        Ok(())
    }
}

fn arms(ids: &[u16]) -> Vec<SeamArm> {
    ids.iter().map(|&arm| SeamArm { arm, strength: SEAM_DECLARED }).collect()
}

fn ctx<'a>(options: &'a ResolvedOptions, sources: &'a Sources) -> RenderContext<'a> {
    RenderContext { options, sources }
}

#[test]
fn a_coordinate_is_checked_against_its_tree_and_an_unset_site_takes_the_table() {
    let options = ResolvedOptions {
        spacing: arms(&[168]),
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
        spacing: arms(&[168]),
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
        spacing: arms(&[168]),
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

use sittir_core::options::{Edged, Edges, EdgeSite, Side, SiteSpec, NO_SITE};
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

fn at_defaults(sites: &'static [SiteSpec]) -> ResolvedOptions {
    ResolvedOptions { spacing: ResolvedOptions::default_spacing(sites), sites, ..ResolvedOptions::default() }
}

#[test]
fn a_resolved_arm_carries_the_spec_strength_for_the_default_and_declared_otherwise() {
    let mut opts = at_defaults(two_sites());
    opts.set_arm(1, 9);
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
    let mut opts = at_defaults(two_sites());
    opts.set_arm(1, 9);
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

static EDGE_ROWS: &[EdgeSite] = &[EdgeSite { before: 0, after: 1 }];
static EDGE_ROW_OF: &[u16] = &[NO_SITE, NO_SITE, NO_SITE, 0];
static EDGE_SPECS: &[SiteSpec] = &[SiteSpec { default_arm: 5, strength: 1 }, SiteSpec { default_arm: 6, strength: 1 }];

fn edged_options() -> ResolvedOptions {
    ResolvedOptions { edges: EDGE_ROWS, edge_rows: EDGE_ROW_OF, ..at_defaults(EDGE_SPECS) }
}

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
    let opts = edged_options();
    let sources = Sources(HashMap::new());
    let mut leaf = Edged3 { edges: Edges::default() };
    prepare_edges(&mut leaf, &ctx(&opts, &sources));
    assert_eq!(leaf.edges, Edges { before: Some(5), after: Some(6) });
}

#[test]
fn a_stamped_edge_keeps_its_arm_and_carries_declared_strength() {
    let opts = edged_options();
    assert_eq!(opts.edge_arm(KindId(3), Side::After, Some(9)), Some(SeamArm { arm: 9, strength: SEAM_DECLARED }));
    assert_eq!(opts.edge_arm(KindId(3), Side::Before, None), Some(SeamArm { arm: 5, strength: 1 }));
    assert_eq!(opts.edge_arm(KindId(4), Side::Before, None), None);
    let sources = Sources(HashMap::new());
    let mut leaf = Edged3 { edges: Edges { before: None, after: Some(8) } };
    prepare_edges(&mut leaf, &ctx(&opts, &sources));
    assert_eq!(leaf.edges, Edges { before: Some(5), after: Some(8) });
}

use sittir_core::prepare::{fill_seated_gaps, seat_site, SeatTarget};

struct Seatable {
    kind: u16,
    edges: Edges,
}
impl SeatTarget for Seatable {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut Edges, usize)> {
        seat_site(table, KindId(self.kind)).map(|site| (&mut self.edges, site))
    }
}

struct Wrapper {
    edges: Edges,
    content: Seatable,
}
impl SeatTarget for Wrapper {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut Edges, usize)> {
        if let Some(site) = seat_site(table, KindId(9)) {
            return Some((&mut self.edges, site));
        }
        self.content.seat_target(table)
    }
}

fn seatable(kind: u16) -> Option<SlotValue<Seatable>> {
    Some(SlotValue::Transport(Seatable { kind, edges: Edges::default() }))
}

fn after_of(item: &Option<SlotValue<Seatable>>) -> Option<u16> {
    match item {
        Some(SlotValue::Transport(t)) => t.edges.after,
        _ => None,
    }
}

#[test]
fn seat_site_reads_a_kind_from_a_table_indexed_by_kind_id() {
    let table: &[u16] = &[NO_SITE, NO_SITE, NO_SITE, 0, 1];
    assert_eq!(seat_site(table, KindId(4)), Some(1));
    assert_eq!(seat_site(table, KindId(5)), None);
}

#[test]
fn seated_gaps_fill_the_preceding_elements_after_edge_and_never_the_last() {
    let table: &[u16] = &[NO_SITE, NO_SITE, NO_SITE, 0, 1];
    let opts = ResolvedOptions { spacing: arms(&[70, 80]), ..ResolvedOptions::default() };
    let sources = Sources(HashMap::new());
    let mut items = vec![seatable(3), None, seatable(4), seatable(5), seatable(3)];
    fill_seated_gaps(items.iter_mut().map(Option::as_mut), table, &ctx(&opts, &sources));
    assert_eq!(after_of(&items[0]), Some(70));
    assert_eq!(after_of(&items[2]), Some(80));
    assert_eq!(after_of(&items[3]), None);
    assert_eq!(after_of(&items[4]), None);
}

#[test]
fn a_seated_gap_is_not_written_after_the_last_present_element() {
    let table: &[u16] = &[NO_SITE, NO_SITE, NO_SITE, 0];
    let opts = ResolvedOptions { spacing: arms(&[70]), ..ResolvedOptions::default() };
    let sources = Sources(HashMap::new());
    let mut items = vec![seatable(3), seatable(3), None, None];
    fill_seated_gaps(items.iter_mut().map(Option::as_mut), table, &ctx(&opts, &sources));
    assert_eq!(after_of(&items[0]), Some(70));
    assert_eq!(after_of(&items[1]), None);
}

#[test]
fn a_seated_gap_keeps_an_after_edge_the_element_already_carries() {
    let table: &[u16] = &[NO_SITE, NO_SITE, NO_SITE, 0];
    let opts = ResolvedOptions { spacing: arms(&[70]), ..ResolvedOptions::default() };
    let sources = Sources(HashMap::new());
    let mut items = vec![
        Some(SlotValue::Transport(Seatable { kind: 3, edges: Edges { before: None, after: Some(1) } })),
        seatable(3),
    ];
    fill_seated_gaps(items.iter_mut().map(Option::as_mut), table, &ctx(&opts, &sources));
    assert_eq!(after_of(&items[0]), Some(1));
}

#[test]
fn a_wrapper_not_itself_seated_seats_the_node_it_wraps_and_keeps_its_own_edges() {
    let table: &[u16] = &[NO_SITE, NO_SITE, NO_SITE, 0];
    let opts = ResolvedOptions { spacing: arms(&[70]), ..ResolvedOptions::default() };
    let sources = Sources(HashMap::new());
    let wrapped = || SlotValue::<Wrapper>::Transport(Wrapper { edges: Edges::default(), content: Seatable { kind: 3, edges: Edges::default() } });
    let mut items = vec![wrapped(), wrapped()];
    fill_seated_gaps(items.iter_mut().map(Some), table, &ctx(&opts, &sources));
    let SlotValue::Transport(first) = &items[0] else { panic!() };
    assert_eq!(first.content.edges.after, Some(70));
    assert_eq!(first.edges, Edges::default());
}
