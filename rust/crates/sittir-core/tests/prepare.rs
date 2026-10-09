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
    ids.iter().map(|&arm| SeamArm { arm, strength: SEAM_DECLARED, dedent: false }).collect()
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
                7,
                0,
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
        SlotValue::Coord(NodeCoordinate::new(9, 2, Span { start: 0, end: 1 }));
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
        SlotValue::Coord(NodeCoordinate::new(1, 0, Span { start: 0, end: 5 }));
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
        NodeCoordinate::new(4, 1, Span { start: 0, end: 1 }),
    )]));
    assert_eq!(
        nested.prepare(&ctx(&options, &sources)),
        Err(CoordinateError::UnknownTree { handle, tree_id: 4 })
    );
}

use sittir_core::options::{ArmSite, EdgeArm, Edged, Edges, EdgeSite, Side, SiteSpec, NO_SITE};

fn wire(arm: u16) -> EdgeArm {
    EdgeArm { arm, strength: None, dedent: None }
}

fn stamped(arm: u16, strength: u8) -> EdgeArm {
    EdgeArm { arm, strength: Some(strength), dedent: None }
}
use sittir_core::prepare::{prepare_edges, ArmOf};
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
    assert_eq!(opts.site_arm(0), SeamArm { arm: 7, strength: 1, dedent: false });
    assert_eq!(opts.site_arm(1), SeamArm { arm: 9, strength: SEAM_DECLARED, dedent: false });
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

static EDGE_ROWS: &[EdgeSite] = &[EdgeSite { before: 0, after: 1, before_arms: &[], after_arms: &[] }];
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
    assert_eq!(leaf.edges, Edges { before: Some(stamped(5, 1)), after: Some(stamped(6, 1)) });
}

#[test]
fn a_wire_stamp_takes_its_site_spec_strength_and_a_render_stamp_keeps_its_own() {
    let opts = edged_options();
    assert_eq!(opts.edge_arm(KindId(3), Side::After, Some(wire(9)), None), Some(SeamArm { arm: 9, strength: SEAM_DECLARED, dedent: false }));
    assert_eq!(opts.edge_arm(KindId(3), Side::After, Some(wire(6)), None), Some(SeamArm { arm: 6, strength: 1, dedent: false }));
    assert_eq!(opts.edge_arm(KindId(3), Side::After, Some(stamped(6, 0)), None), Some(SeamArm { arm: 6, strength: 0, dedent: false }));
    assert_eq!(opts.edge_arm(KindId(3), Side::Before, None, None), Some(SeamArm { arm: 5, strength: 1, dedent: false }));
    assert_eq!(opts.edge_arm(KindId(4), Side::Before, None, None), None);
    let sources = Sources(HashMap::new());
    let mut leaf = Edged3 { edges: Edges { before: None, after: Some(wire(8)) } };
    prepare_edges(&mut leaf, &ctx(&opts, &sources));
    assert_eq!(leaf.edges, Edges { before: Some(stamped(5, 1)), after: Some(wire(8)) });
}

static ARM_SITES: &[ArmSite] = &[ArmSite { arm: 40, site: 2 }, ArmSite { arm: 41, site: 3 }];
static ARM_ROWS: &[EdgeSite] = &[EdgeSite { before: 0, after: 1, before_arms: ARM_SITES, after_arms: &[] }];
static ARM_SPECS: &[SiteSpec] = &[
    SiteSpec { default_arm: 5, strength: 1 },
    SiteSpec { default_arm: 6, strength: 1 },
    SiteSpec { default_arm: 5, strength: 1 },
    SiteSpec { default_arm: 5, strength: 1 },
];

fn arm_options() -> ResolvedOptions {
    ResolvedOptions { edges: ARM_ROWS, edge_rows: EDGE_ROW_OF, ..at_defaults(ARM_SPECS) }
}

#[test]
fn an_edge_arm_picks_its_own_site_and_any_other_arm_the_shared_one() {
    let mut opts = arm_options();
    opts.set_arm(2, 9);
    let at = |arm: Option<u16>| opts.edge_arm(KindId(3), Side::Before, None, arm.map(KindId));
    assert_eq!(at(Some(40)), Some(SeamArm { arm: 9, strength: SEAM_DECLARED, dedent: false }));
    assert_eq!(at(Some(41)), Some(SeamArm { arm: 5, strength: 1, dedent: false }));
    assert_eq!(at(Some(42)), at(None));
    assert_eq!(opts.edge_arm(KindId(3), Side::After, None, Some(KindId(40))), Some(SeamArm { arm: 6, strength: 1, dedent: false }));
    assert_eq!(opts.edge_arm_sites(KindId(3), Side::Before), ARM_SITES);
    assert!(opts.edge_arm_sites(KindId(3), Side::After).is_empty());
}

struct Token(u16);
impl sittir_core::view::KindOf for Token {
    fn kind_in(&self, kinds: &[KindId]) -> bool {
        kinds.contains(&KindId(self.0))
    }
}

struct Armed {
    edges: Edges,
    slot: Option<SlotValue<Token>>,
}
impl Edged for Armed {
    fn kind_id(&self) -> KindId {
        KindId(3)
    }
    fn edges(&self) -> &Edges {
        &self.edges
    }
    fn edges_mut(&mut self) -> &mut Edges {
        &mut self.edges
    }
    fn edge_arm_kinds(&self, ctx: &RenderContext<'_>) -> (Option<KindId>, Option<KindId>) {
        (self.slot.arm_among(ctx, ctx.options.edge_arm_sites(self.kind_id(), Side::Before)), None)
    }
}

#[test]
fn a_transport_prepares_the_edge_of_the_arm_its_slot_holds() {
    let mut opts = arm_options();
    opts.set_arm(3, 9);
    let sources = Sources(HashMap::new());
    let prepared = |slot: Option<SlotValue<Token>>| {
        let mut node = Armed { edges: Edges::default(), slot };
        prepare_edges(&mut node, &ctx(&opts, &sources));
        node.edges.before
    };
    assert_eq!(prepared(Some(SlotValue::Transport(Token(41)))), Some(stamped(9, SEAM_DECLARED)));
    assert_eq!(prepared(Some(SlotValue::Transport(Token(40)))), Some(stamped(5, 1)));
    assert_eq!(prepared(None), Some(stamped(5, 1)));
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
        Some(SlotValue::Transport(t)) => t.edges.after.map(|e| e.arm),
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
    let mut items = [seatable(3), None, seatable(4), seatable(5), seatable(3)];
    fill_seated_gaps(items.iter_mut().map(Option::as_mut), table, &ctx(&opts, &sources));
    assert_eq!(after_of(&items[0]), Some(70));
    assert_eq!(after_of(&items[2]), Some(80));
    assert_eq!(after_of(&items[3]), None);
    assert_eq!(after_of(&items[4]), None);
}

#[test]
fn a_seated_gap_carries_its_own_sites_strength() {
    let table: &[u16] = &[NO_SITE, NO_SITE, NO_SITE, 0];
    let opts = ResolvedOptions { spacing: vec![SeamArm { arm: 70, strength: 0, dedent: false }], ..ResolvedOptions::default() };
    let sources = Sources(HashMap::new());
    let mut items = [seatable(3), seatable(3)];
    fill_seated_gaps(items.iter_mut().map(Option::as_mut), table, &ctx(&opts, &sources));
    let Some(SlotValue::Transport(first)) = &items[0] else { panic!() };
    assert_eq!(first.edges.after, Some(stamped(70, 0)));
}

#[test]
fn a_seated_gap_is_not_written_after_the_last_present_element() {
    let table: &[u16] = &[NO_SITE, NO_SITE, NO_SITE, 0];
    let opts = ResolvedOptions { spacing: arms(&[70]), ..ResolvedOptions::default() };
    let sources = Sources(HashMap::new());
    let mut items = [seatable(3), seatable(3), None, None];
    fill_seated_gaps(items.iter_mut().map(Option::as_mut), table, &ctx(&opts, &sources));
    assert_eq!(after_of(&items[0]), Some(70));
    assert_eq!(after_of(&items[1]), None);
}

#[test]
fn a_seated_gap_keeps_an_after_edge_the_element_already_carries() {
    let table: &[u16] = &[NO_SITE, NO_SITE, NO_SITE, 0];
    let opts = ResolvedOptions { spacing: arms(&[70]), ..ResolvedOptions::default() };
    let sources = Sources(HashMap::new());
    let mut items = [
        Some(SlotValue::Transport(Seatable { kind: 3, edges: Edges { before: None, after: Some(wire(1)) } })),
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
    let mut items = [wrapped(), wrapped()];
    fill_seated_gaps(items.iter_mut().map(Some), table, &ctx(&opts, &sources));
    let SlotValue::Transport(first) = &items[0] else { panic!() };
    assert_eq!(first.content.edges.after.map(|e| e.arm), Some(70));
    assert_eq!(first.edges, Edges::default());
}

impl Prepare for Seatable {
    fn prepare(&mut self, _: &RenderContext<'_>) -> Result<(), CoordinateError> {
        Ok(())
    }
}

fn parsed(kind: u16, start: u32, end: u32) -> Option<SlotValue<Seatable>> {
    let mut coord = NodeCoordinate::new(7, 0, Span { start, end });
    coord.kind = Some(KindId(kind));
    Some(SlotValue::Coord(coord))
}

fn coord_after_of(item: &Option<SlotValue<Seatable>>) -> Option<u16> {
    match item {
        Some(SlotValue::Coord(c)) => c.edges.and_then(|e| e.after).map(|e| e.arm),
        _ => None,
    }
}

fn source_tree() -> Sources {
    Sources(HashMap::from([(7, Arc::from("use x;\n\nfn f() {}\n"))]))
}

#[test]
fn a_coordinate_followed_by_a_rebuilt_element_takes_its_seat() {
    let table: &[u16] = &[NO_SITE, NO_SITE, NO_SITE, 0];
    let opts = ResolvedOptions { spacing: arms(&[70]), ..ResolvedOptions::default() };
    let sources = source_tree();
    let mut items = [parsed(3, 0, 6), seatable(3)];
    fill_seated_gaps(items.iter_mut().map(Option::as_mut), table, &ctx(&opts, &sources));
    assert_eq!(coord_after_of(&items[0]), Some(70));
}

#[test]
fn a_coordinate_followed_by_one_out_of_source_order_takes_its_seat() {
    let table: &[u16] = &[NO_SITE, NO_SITE, NO_SITE, 0];
    let opts = ResolvedOptions { spacing: arms(&[70]), ..ResolvedOptions::default() };
    let sources = source_tree();
    let mut items = [parsed(3, 8, 17), parsed(3, 0, 6)];
    fill_seated_gaps(items.iter_mut().map(Option::as_mut), table, &ctx(&opts, &sources));
    assert_eq!(coord_after_of(&items[0]), Some(70));
    assert_eq!(coord_after_of(&items[1]), None);
}

#[test]
fn a_coordinate_whose_gap_the_source_already_filled_keeps_it() {
    let table: &[u16] = &[NO_SITE, NO_SITE, NO_SITE, 0];
    let opts = ResolvedOptions { spacing: arms(&[70]), ..ResolvedOptions::default() };
    let sources = source_tree();
    let mut first = NodeCoordinate::new(7, 0, Span { start: 0, end: 6 });
    first.kind = Some(KindId(3));
    first.edges = Some(sittir_core::slot::CoordinateEdges { before: None, after: Some(SeamArm { arm: 9, strength: 3, dedent: false }) });
    let mut items = [Some(SlotValue::Coord(first)), parsed(3, 8, 17)];
    fill_seated_gaps(items.iter_mut().map(Option::as_mut), table, &ctx(&opts, &sources));
    assert_eq!(coord_after_of(&items[0]), Some(9));
}

#[test]
fn a_coordinate_followed_by_the_next_in_source_order_with_no_source_gap_takes_its_seat() {
    let table: &[u16] = &[NO_SITE, NO_SITE, NO_SITE, 0];
    let opts = ResolvedOptions { spacing: arms(&[70]), ..ResolvedOptions::default() };
    let sources = source_tree();
    let mut items = [parsed(3, 0, 6), parsed(3, 8, 17)];
    fill_seated_gaps(items.iter_mut().map(Option::as_mut), table, &ctx(&opts, &sources));
    assert_eq!(coord_after_of(&items[0]), Some(70));
}

#[test]
fn a_coordinate_followed_by_a_rebuilt_element_takes_its_seat_before_a_later_coordinate() {
    let table: &[u16] = &[NO_SITE, NO_SITE, NO_SITE, 0];
    let opts = ResolvedOptions { spacing: arms(&[70]), ..ResolvedOptions::default() };
    let sources = source_tree();
    let mut items = [parsed(3, 0, 6), seatable(3), parsed(3, 8, 17)];
    fill_seated_gaps(items.iter_mut().map(Option::as_mut), table, &ctx(&opts, &sources));
    assert_eq!(coord_after_of(&items[0]), Some(70));
}

#[test]
fn a_seated_coordinate_keeps_its_seat_when_it_prepares_its_kind_edges() {
    let table: &[u16] = &[NO_SITE, NO_SITE, NO_SITE, 1];
    let opts = ResolvedOptions { spacing: vec![SeamArm { arm: 5, strength: 1, dedent: false }, SeamArm { arm: 70, strength: SEAM_DECLARED, dedent: false }, SeamArm { arm: 6, strength: 1, dedent: false }], sites: EDGE_SPECS_3, edges: EDGE_ROWS_3, edge_rows: EDGE_ROW_OF, ..ResolvedOptions::default() };
    let sources = source_tree();
    let mut items = vec![parsed(3, 8, 17), parsed(3, 0, 6)];
    fill_seated_gaps(items.iter_mut().map(Option::as_mut), table, &ctx(&opts, &sources));
    items.prepare(&ctx(&opts, &sources)).unwrap();
    let Some(SlotValue::Coord(first)) = &items[0] else { panic!() };
    assert_eq!(first.edges.and_then(|e| e.before).map(|e| e.arm), Some(5));
    assert_eq!(coord_after_of(&items[0]), Some(70));
    assert_eq!(coord_after_of(&items[1]), Some(6));
}

static EDGE_ROWS_3: &[EdgeSite] = &[EdgeSite { before: 0, after: 2, before_arms: &[], after_arms: &[] }];
static EDGE_SPECS_3: &[SiteSpec] = &[
    SiteSpec { default_arm: 5, strength: 1 },
    SiteSpec { default_arm: 70, strength: 1 },
    SiteSpec { default_arm: 6, strength: 1 },
];

use sittir_core::prepare::{fill_edges, root_flanks, EdgeItems};

fn flank_text(kind: u16) -> &'static str {
    match kind {
        1 => "",
        3 => "\n",
        4 => "\n\n",
        _ => "",
    }
}
const FLANKS: WhitespaceTable = WhitespaceTable { text_of: flank_text, indent: 0, dedent: 0 };

#[test]
fn a_root_reads_its_flanks_from_the_bytes_around_its_first_and_last_coordinate() {
    let opts = ResolvedOptions::default();
    let sources = source_tree();
    let items = vec![parsed(1, 0, 6).unwrap(), parsed(2, 8, 17).unwrap()];
    let flanks = root_flanks(items.first_item(), items.last_item(), &[1, 3, 4], &[1, 3, 4], &FLANKS, &ctx(&opts, &sources));
    assert_eq!(flanks, Edges { before: Some(wire(1)), after: Some(wire(3)) });
}

#[test]
fn a_rebuilt_edge_item_or_a_flank_that_is_not_whitespace_leaves_the_edge_unset() {
    let opts = ResolvedOptions::default();
    let sources = source_tree();
    let rebuilt_first = vec![SlotValue::Transport(Seatable { kind: 2, edges: Edges::default() }), parsed(1, 0, 6).unwrap()];
    let flanks = root_flanks(rebuilt_first.first_item(), rebuilt_first.last_item(), &[1, 3, 4], &[1, 3, 4], &FLANKS, &ctx(&opts, &sources));
    assert_eq!(flanks.before, None);
    assert_eq!(flanks.after, None, "the bytes after `use x;` hold `fn f() {{}}`, which is not a flank");
}

#[test]
fn filling_root_edges_keeps_a_side_the_wire_set() {
    let mut root = Edged3 { edges: Edges { before: Some(wire(4)), after: None } };
    fill_edges(&mut root, Edges { before: Some(wire(1)), after: Some(wire(3)) });
    assert_eq!(root.edges, Edges { before: Some(wire(4)), after: Some(wire(3)) });
}

static ROOT_FLAGS: &[u8] = &[0, 0, 0, sittir_core::options::KIND_ROOT];
static ROOT_SPECS: &[SiteSpec] = &[SiteSpec { default_arm: 1, strength: 1 }, SiteSpec { default_arm: 3, strength: 1 }];

fn root_render(kind_flags: &'static [u8], write: impl FnOnce(&mut SpacingWriter<'_, String>)) -> String {
    let opts = ResolvedOptions { edges: EDGE_ROWS, edge_rows: EDGE_ROW_OF, kind_flags, ..at_defaults(ROOT_SPECS) };
    let mut out = String::new();
    let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident()).with_table(&FLANKS).with_options(&opts);
    write(&mut w);
    w.finish().unwrap();
    out
}

#[test]
fn the_roots_edges_are_written_at_both_ends_of_its_render() {
    let root = |before: Option<EdgeArm>| {
        root_render(ROOT_FLAGS, |w| {
            w.edge(KindId(3), Side::Before, before);
            w.text("a").unwrap();
            w.edge(KindId(3), Side::After, None);
        })
    };
    assert_eq!(root(None), "a\n");
    assert_eq!(root(Some(wire(4))), "\n\na\n");
    let not_root = root_render(&[], |w| {
        w.edge(KindId(3), Side::Before, Some(wire(4)));
        w.text("a").unwrap();
        w.edge(KindId(3), Side::After, None);
    });
    assert_eq!(not_root, "a", "a node rendered on its own carries no edge whitespace");
}

#[test]
fn a_root_edge_decides_its_gap_and_only_a_terminated_break_floors_it() {
    let replaced = root_render(ROOT_FLAGS, |w| {
        w.text("a").unwrap();
        w.hold_line_end(sittir_core::render::LineHold::Break);
        w.edge(KindId(3), Side::After, Some(wire(1)));
        w.site_with(4, sittir_core::spacing::SEAM_TRIVIA);
    });
    assert_eq!(replaced, "a");
    let floored = root_render(ROOT_FLAGS, |w| {
        w.text("// c").unwrap();
        w.hold_line_end(sittir_core::render::LineHold::Terminated);
        w.edge(KindId(3), Side::After, Some(wire(1)));
    });
    assert_eq!(floored, "// c\n");
}
