//! The walk a render makes over every slot before writing a byte: it checks
//! each coordinate against the tree it names, gives each list gap that is
//! still adjacent in the source its source class, and fills every unset
//! spacing and flank field from the resolved options. The context is an argument at every level;
//! nothing ambient carries the trees or the table.

use crate::options::{EdgeArm, Edged, Edges, ResolvedOptions, Side};
use crate::types::KindId;
use crate::render::{CoordinateError, SourceTable};
use crate::slot::{SeamArm, SlotValue, SourceFlank, SourceGap};
use crate::render::WhitespaceTable;

/// Everything a render reads that is not the transport itself.
pub struct RenderContext<'a> {
    pub options: &'a ResolvedOptions,
    pub sources: &'a dyn SourceTable,
}

/// Fill a transport's unset base edges from its kind's edge row; an edge the wire already set keeps its arm.
pub fn prepare_edges<T: Edged + ?Sized>(t: &mut T, ctx: &RenderContext<'_>) {
    let kind = t.kind_id();
    let edges = t.edges_mut();
    if edges.before.is_none() {
        edges.before = ctx.options.edge_arm(kind, Side::Before, None).map(EdgeArm::from);
    }
    if edges.after.is_none() {
        edges.after = ctx.options.edge_arm(kind, Side::After, None).map(EdgeArm::from);
    }
}

/// Give a list node's kept flanks their source class, before its edge row
/// fills what is left: the whitespace between the opener and the list, and
/// between the list and the closer, in the source the list was read from
/// (`SourceFlank`). Each side classifies among the arms its edge site admits,
/// at trivia strength. A flank alone of all gaps may classify to a depth arm:
/// the side before is the indent arm when the line after the opener is deeper
/// than the opener's line, and the side after is the dedent arm when the
/// closer's line is shallower than the line the list ends on. The depth unit
/// is the render's own, never the source's columns. Depth opens and closes as
/// a pair: a list whose kept flank before opens it closes it after, even
/// where its flank after is no longer the source's, and a flank after never
/// closes a depth the flank before did not open.
pub fn fill_source_flanks<T: Edged + ?Sized>(
    t: &mut T,
    flank: Option<&SourceFlank>,
    allowed: fn(usize) -> &'static [u16],
    table: &WhitespaceTable,
    ctx: &RenderContext<'_>,
) {
    let Some(flank) = flank.filter(|flank| flank.before || flank.after) else { return };
    let Some(source) = flank.source(ctx.sources) else { return };
    let (start, end) = (flank.span.start as usize, flank.span.end as usize);
    let (Some(head), Some(tail)) = (source.get(..start), source.get(end..)) else { return };
    let (before_site, after_site) = ctx.options.edge_sites(t.kind_id());
    let before_ws = &head[head.trim_end().len()..];
    let after_ws = &tail[..tail.len() - tail.trim_start().len()];
    let opens = before_ws.contains('\n') && line_depth(before_ws) > indent_width(line_of(head, head.len() - before_ws.len()));
    let closes = after_ws.contains('\n') && line_depth(after_ws) < indent_width(line_of(source, end.saturating_sub(1)));
    let before = before_site.filter(|_| flank.before).and_then(|site| {
        let arms = allowed(site);
        if opens && arms.contains(&table.indent) {
            Some(table.indent)
        } else {
            crate::classify::classify_whitespace(before_ws, arms, table)
        }
    });
    let opened = before == Some(table.indent);
    let after = after_site.and_then(|site| {
        let arms = allowed(site);
        let classified = || crate::classify::classify_whitespace(after_ws, arms, table);
        if opened && arms.contains(&table.dedent) {
            if closes || !flank.after {
                Some((table.dedent, false))
            } else {
                Some((classified().unwrap_or(0), true))
            }
        } else if flank.after {
            classified().map(|arm| (arm, false))
        } else {
            None
        }
    });
    let seam = |arm: u16, dedent: bool| EdgeArm::from(SeamArm { arm, strength: crate::spacing::SEAM_TRIVIA, dedent });
    let edges = t.edges_mut();
    if let Some(arm) = before {
        edges.before.get_or_insert(seam(arm, false));
    }
    if let Some((arm, dedent)) = after {
        edges.after.get_or_insert(seam(arm, dedent));
    }
}

/// The line of `text` that byte `at` sits on.
fn line_of(text: &str, at: usize) -> &str {
    let at = at.min(text.len());
    let start = text[..at].rfind('\n').map_or(0, |i| i + 1);
    let end = text[start..].find('\n').map_or(text.len(), |i| start + i);
    &text[start..end]
}

/// How far a line is indented: the whitespace it starts with.
fn indent_width(line: &str) -> usize {
    line.len() - line.trim_start().len()
}

/// How far the last line of a whitespace run is indented: what follows its last break.
fn line_depth(run: &str) -> usize {
    run.rfind('\n').map_or(0, |i| run.len() - i - 1)
}

/// A child position of a root transport, read for the item at either end of
/// the render: `None` when the position holds nothing, otherwise the item's
/// coordinate, itself `None` when the item was rebuilt.
pub trait EdgeItems {
    fn first_item(&self) -> Option<Option<&crate::NodeCoordinate>>;
    fn last_item(&self) -> Option<Option<&crate::NodeCoordinate>>;
}

impl<T, const ADJACENT: bool> EdgeItems for SlotValue<T, ADJACENT> {
    fn first_item(&self) -> Option<Option<&crate::NodeCoordinate>> {
        Some(self.coord())
    }
    fn last_item(&self) -> Option<Option<&crate::NodeCoordinate>> {
        Some(self.coord())
    }
}

impl<X: EdgeItems> EdgeItems for Option<X> {
    fn first_item(&self) -> Option<Option<&crate::NodeCoordinate>> {
        self.as_ref().and_then(X::first_item)
    }
    fn last_item(&self) -> Option<Option<&crate::NodeCoordinate>> {
        self.as_ref().and_then(X::last_item)
    }
}

impl<X: EdgeItems> EdgeItems for Vec<X> {
    fn first_item(&self) -> Option<Option<&crate::NodeCoordinate>> {
        self.iter().find_map(X::first_item)
    }
    fn last_item(&self) -> Option<Option<&crate::NodeCoordinate>> {
        self.iter().rev().find_map(X::last_item)
    }
}

/// A root transport's edges read from its tree's own flanks: the bytes
/// before its first item and after its last, when that item is still a
/// coordinate, classified into the arm the edge site admits exactly as a
/// list gap is. An edge item that was rebuilt, one whose coordinate addresses
/// its text only, or bytes that are not whitespace, leave that side unset for
/// the options and the grammar default.
pub fn root_flanks(
    first: Option<Option<&crate::NodeCoordinate>>,
    last: Option<Option<&crate::NodeCoordinate>>,
    allowed_before: &[u16],
    allowed_after: &[u16],
    table: &crate::render::WhitespaceTable,
    ctx: &RenderContext<'_>,
) -> Edges {
    let flank = |coord: Option<&crate::NodeCoordinate>, side: Side, allowed: &[u16]| {
        let coord = coord.filter(|coord| coord.is_layout_evidence())?;
        let source = ctx.sources.source_of(coord.tree_id())?;
        let bytes = match side {
            Side::Before => source.get(..coord.span.start as usize)?,
            Side::After => source.get(coord.span.end as usize..)?,
        };
        crate::classify::classify_whitespace(bytes, allowed, table).map(|arm| EdgeArm { arm, strength: None, dedent: None })
    };
    Edges {
        before: flank(first.flatten(), Side::Before, allowed_before),
        after: flank(last.flatten(), Side::After, allowed_after),
    }
}

/// Fill a transport's unset base edges from `edges`; a side the wire already
/// set keeps its arm.
pub fn fill_edges<T: Edged + ?Sized>(t: &mut T, edges: Edges) {
    let own = t.edges_mut();
    own.before = own.before.or(edges.before);
    own.after = own.after.or(edges.after);
}

/// The element a seated sibling gap belongs to: the node itself when its kind
/// has a seat in `table`, or, for a wrapper that is not itself seated, the
/// seated node it holds. Answers the base edges to fill and the site to read.
pub trait SeatTarget {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut Edges, usize)>;
}

impl<T: SeatTarget + ?Sized> SeatTarget for Box<T> {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut Edges, usize)> {
        (**self).seat_target(table)
    }
}

/// The seated site of `kind` in a per-slot table indexed by kind id.
pub fn seat_site(table: &[u16], kind: KindId) -> Option<usize> {
    match table.get(kind.0 as usize) {
        Some(&site) if site != crate::options::NO_SITE => Some(site as usize),
        _ => None,
    }
}

/// Give every list gap that is still adjacent in the source its source class.
/// An item carries its gap toward the item before it (`Prepare::source_gap`)
/// only when the two were adjacent siblings in the source both were read from
/// and no derived line-gap run already spells that gap. The gap's text splits
/// at the separator `token`. The side before it classifies among
/// `allowed_before` onto the earlier item's `after` edge. The side after it
/// classifies among `allowed_after` onto the later item's `before` edge.
/// With no token, the whole gap is the before side. Both edges hold at trivia
/// strength, the strength of a source fact, so neither the list's site nor a
/// seat replaces them.
///
/// Two limits. A same-line run no whitespace member spells exactly takes the
/// nearest member below it. A gap holding text other than whitespace and one
/// separator, a comment among them, is not a gap the classes can spell: it is
/// left unset and falls to the seat or the list site.
pub fn fill_list_gaps<'i, T: Prepare + 'i, const ADJACENT: bool>(
    items: impl Iterator<Item = Option<&'i mut SlotValue<T, ADJACENT>>>,
    token: &str,
    allowed_before: &[u16],
    allowed_after: &[u16],
    table: &WhitespaceTable,
    ctx: &RenderContext<'_>,
) {
    let mut present: Vec<&'i mut SlotValue<T, ADJACENT>> = items.flatten().collect();
    for index in 1..present.len() {
        let Some((lead, trail)) = present[index]
            .source_gap()
            .and_then(|gap| gap.text(ctx.sources))
            .and_then(|text| single_separator(text, token))
            .map(|(lead, trail)| (lead.to_owned(), trail.to_owned()))
        else {
            continue;
        };
        let (lead, trail) = (lead.as_str(), trail.as_str());
        if let Some(arm) = crate::classify::classify_whitespace(lead, allowed_before, table) {
            set_gap_edge(present[index - 1], Side::After, arm);
        }
        if !token.is_empty() {
            if let Some(arm) = crate::classify::classify_whitespace(trail, allowed_after, table) {
                set_gap_edge(present[index], Side::Before, arm);
            }
        }
    }
}

/// The text before and after the one separator a gap between adjacent items
/// holds; the whole gap before it when there is no separator to split at.
fn single_separator<'g>(gap: &'g str, token: &str) -> Option<(&'g str, &'g str)> {
    if token.is_empty() {
        return Some((gap, ""));
    }
    let at = gap.find(token)?;
    (gap.rfind(token)? == at).then(|| (&gap[..at], &gap[at + token.len()..]))
}

fn set_gap_edge<T: Prepare, const ADJACENT: bool>(item: &mut SlotValue<T, ADJACENT>, side: Side, arm: u16) {
    let seam = SeamArm { arm, strength: crate::spacing::SEAM_TRIVIA, dedent: false };
    match item {
        SlotValue::Coord(coord) => {
            let edges = coord.edges.get_or_insert(crate::slot::CoordinateEdges { before: None, after: None });
            match side {
                Side::Before => edges.before.get_or_insert(seam),
                Side::After => edges.after.get_or_insert(seam),
            };
        }
        SlotValue::Transport(t) => {
            if let Some(edges) = t.gap_edges() {
                match side {
                    Side::Before => edges.before.get_or_insert(EdgeArm::from(seam)),
                    Side::After => edges.after.get_or_insert(EdgeArm::from(seam)),
                };
            }
        }
    }
}

/// Fill the gap after every present element but the last present one from
/// the slot's seat table: a seated element's base `after` edge takes its
/// seat's resolved arm and strength unless something already set it, the wire
/// or the gap's source class (`fill_list_gaps`, which runs first). An absent
/// element renders nothing, so it neither takes a gap nor counts as the
/// sibling that makes the gap before it.
pub fn fill_seated_gaps<'i, T: SeatTarget + 'i, const ADJACENT: bool>(
    items: impl Iterator<Item = Option<&'i mut SlotValue<T, ADJACENT>>>,
    table: &[u16],
    ctx: &RenderContext<'_>,
) {
    let present: Vec<&'i mut SlotValue<T, ADJACENT>> = items.flatten().collect();
    let last = present.len().saturating_sub(1);
    for item in present.into_iter().take(last) {
        match item {
            SlotValue::Transport(t) => {
                if let Some((edges, site)) = t.seat_target(table) {
                    edges.after.get_or_insert(EdgeArm::from(ctx.options.spacing[site]));
                }
            }
            SlotValue::Coord(coord) => {
                if let Some(site) = coord.kind_in(ctx.sources).and_then(|kind| seat_site(table, kind)) {
                    let edges = coord.edges.get_or_insert(crate::slot::CoordinateEdges { before: None, after: None });
                    edges.after.get_or_insert(ctx.options.spacing[site]);
                }
            }
        }
    }
}

pub trait Prepare {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError>;

    /// The source gap toward the list item before this value, when the wire
    /// says the two are still adjacent in their source (`$_gap`).
    fn source_gap(&self) -> Option<&SourceGap> {
        None
    }

    /// The base edges a list gap beside this value is written on: its own.
    fn gap_edges(&mut self) -> Option<&mut Edges> {
        None
    }
}

impl<T: Prepare, const ADJACENT: bool> Prepare for SlotValue<T, ADJACENT> {
    /// A coordinate is checked here and its slice discarded: the render is
    /// refused before a byte is written rather than part way through, and
    /// the sink re-resolves at write time against the same table.
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        match self {
            SlotValue::Coord(coord) => {
                coord.resolve(ctx.sources)?;
                let seated = coord.edges;
                coord.edges = coord.kind_in(ctx.sources).and_then(|kind| ctx.options.edge_arms(kind));
                if let Some(seated) = seated {
                    let edges = coord.edges.get_or_insert(crate::slot::CoordinateEdges { before: None, after: None });
                    if seated.before.is_some() {
                        edges.before = seated.before;
                    }
                    if seated.after.is_some() {
                        edges.after = seated.after;
                    }
                }
                Ok(())
            }
            SlotValue::Transport(t) => t.prepare(ctx),
        }
    }

    fn source_gap(&self) -> Option<&SourceGap> {
        match self {
            SlotValue::Transport(t) => t.source_gap(),
            SlotValue::Coord(coord) => coord.gap.as_ref(),
        }
    }
}

impl<T: Prepare> Prepare for Vec<T> {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        self.iter_mut().try_for_each(|item| item.prepare(ctx))
    }
}

impl<T: Prepare> Prepare for Option<T> {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        match self {
            Some(item) => item.prepare(ctx),
            None => Ok(()),
        }
    }

    fn source_gap(&self) -> Option<&SourceGap> {
        self.as_ref()?.source_gap()
    }

    fn gap_edges(&mut self) -> Option<&mut Edges> {
        self.as_mut()?.gap_edges()
    }
}

impl<T: Prepare + ?Sized> Prepare for Box<T> {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        (**self).prepare(ctx)
    }

    fn source_gap(&self) -> Option<&SourceGap> {
        (**self).source_gap()
    }

    fn gap_edges(&mut self) -> Option<&mut Edges> {
        (**self).gap_edges()
    }
}

macro_rules! inert {
    ($($t:ty),*) => {$(
        impl Prepare for $t {
            fn prepare(&mut self, _: &RenderContext<'_>) -> Result<(), CoordinateError> { Ok(()) }
        }
    )*};
}
inert!(String, bool, u8, u16);

#[cfg(test)]
mod tests {
    use super::{fill_list_gaps, root_flanks};
    use crate::slot::{SlotValue, SourceGap};
    use crate::engine::encode_handle;
    use crate::options::ResolvedOptions;
    use crate::render::{SourceTable, WhitespaceTable};
    use crate::RenderContext;
    use crate::slot::NodeCoordinate;
    use crate::types::Span;
    use std::collections::HashMap;
    use std::sync::Arc;

    struct Sources(HashMap<u32, Arc<str>>);
    impl SourceTable for Sources {
        fn source_of(&self, tree_id: u32) -> Option<&Arc<str>> {
            self.0.get(&tree_id)
        }
    }

    const TIGHT: u16 = 0;
    const NEWLINE: u16 = 1;

    fn text_of(arm: u16) -> &'static str {
        if arm == NEWLINE {
            "\n"
        } else {
            ""
        }
    }

    const TABLE: WhitespaceTable = WhitespaceTable {
        text_of,
        indent: 7,
        dedent: 8,
    };

    fn coordinate(start: u32, end: u32, text_only: bool) -> NodeCoordinate {
        NodeCoordinate {
            text_only,
            ..NodeCoordinate::new(encode_handle(3, 0), Span { start, end })
        }
    }

    fn before_flank(first: &NodeCoordinate, source: &str) -> Option<u16> {
        let sources = Sources(HashMap::from([(3, Arc::from(source))]));
        let options = ResolvedOptions::default();
        let ctx = RenderContext {
            options: &options,
            sources: &sources,
        };
        root_flanks(Some(Some(first)), None, &[TIGHT, NEWLINE], &[TIGHT, NEWLINE], &TABLE, &ctx)
            .before
            .map(|edge| edge.arm)
    }

    #[test]
    fn a_tree_addressed_edge_item_gives_the_root_its_source_flank() {
        assert_eq!(before_flank(&coordinate(1, 4, false), "\n#!\n"), Some(NEWLINE));
    }

    #[test]
    fn an_edge_item_that_addresses_its_text_only_gives_the_root_no_flank() {
        assert_eq!(before_flank(&coordinate(1, 4, true), "\n#!\n"), None);
    }

    fn after_and_before(source: &str, second_gap: Option<(u32, u32)>) -> (Option<u16>, Option<u16>) {
        let gap = second_gap.map(|(start, end)| SourceGap::Range { handle: encode_handle(3, 0), span: Span { start, end } });
        filled(source, gap)
    }

    fn filled(source: &str, second_gap: Option<SourceGap>) -> (Option<u16>, Option<u16>) {
        let sources = Sources(HashMap::from([(3, Arc::from(source))]));
        let options = ResolvedOptions::default();
        let ctx = RenderContext {
            options: &options,
            sources: &sources,
        };
        let end = source.len() as u32;
        let first = coordinate(0, 1, false);
        let second = NodeCoordinate {
            gap: second_gap,
            ..coordinate(end - 1, end, false)
        };
        let mut items: Vec<SlotValue<String>> = vec![SlotValue::Coord(first), SlotValue::Coord(second)];
        fill_list_gaps(items.iter_mut().map(Some), ",", &[TIGHT, NEWLINE], &[TIGHT, NEWLINE], &TABLE, &ctx);
        let edge = |item: &SlotValue<String>, after: bool| match item {
            SlotValue::Coord(coord) => coord.edges.and_then(|edges| if after { edges.after } else { edges.before }).map(|seam| seam.arm),
            SlotValue::Transport(_) => None,
        };
        (edge(&items[0], true), edge(&items[1], false))
    }

    #[test]
    fn a_source_adjacent_gap_splits_at_its_separator_onto_both_neighbours() {
        assert_eq!(after_and_before("a,\nb", Some((1, 3))), (Some(TIGHT), Some(NEWLINE)));
    }

    #[test]
    fn a_gap_holding_more_than_one_separator_is_left_to_the_seat() {
        assert_eq!(after_and_before("a,x,b", Some((1, 4))), (None, None));
    }

    #[test]
    fn an_item_that_carries_no_source_gap_is_left_to_the_seat() {
        assert_eq!(after_and_before("a,\nb", None), (None, None));
    }

    const INDENT: u16 = 7;
    const DEDENT: u16 = 8;

    struct List(crate::options::Edges);
    impl crate::options::Edged for List {
        fn kind_id(&self) -> crate::types::KindId {
            crate::types::KindId(0)
        }
        fn edges(&self) -> &crate::options::Edges {
            &self.0
        }
        fn edges_mut(&mut self) -> &mut crate::options::Edges {
            &mut self.0
        }
    }

    fn every_arm(_: usize) -> &'static [u16] {
        &[TIGHT, NEWLINE, INDENT, DEDENT]
    }

    /// The flank arms a list spanning `list` in `source` takes, with the flanks the transport kept.
    fn flanks(source: &str, list: &str, before: bool, after: bool) -> (Option<u16>, Option<u16>) {
        let start = source.find(list).unwrap() as u32;
        let span = Span { start, end: start + list.len() as u32 };
        flanks_from(source, crate::slot::FlankSource::Tree(encode_handle(3, 0)), span, before, after)
    }

    fn flanks_from(source: &str, from: crate::slot::FlankSource, span: Span, before: bool, after: bool) -> (Option<u16>, Option<u16>) {
        let edges = flank_edges(source, from, span, before, after);
        (edges.before.map(|edge| edge.arm), edges.after.map(|edge| edge.arm))
    }

    fn flank_edges(source: &str, from: crate::slot::FlankSource, span: Span, before: bool, after: bool) -> crate::options::Edges {
        use crate::options::{EdgeSite, SiteSpec};
        use crate::slot::SourceFlank;
        static EDGES: [EdgeSite; 1] = [EdgeSite { before: 0, after: 1 }];
        static EDGE_ROWS: [u16; 1] = [0];
        static SITES: [SiteSpec; 2] = [SiteSpec { default_arm: TIGHT, strength: 2 }, SiteSpec { default_arm: TIGHT, strength: 2 }];
        let sources = Sources(HashMap::from([(3, Arc::from(source))]));
        let options = ResolvedOptions {
            spacing: ResolvedOptions::default_spacing(&SITES),
            edges: &EDGES,
            edge_rows: &EDGE_ROWS,
            sites: &SITES,
            ..ResolvedOptions::default()
        };
        let ctx = RenderContext { options: &options, sources: &sources };
        let flank = SourceFlank {
            source: from,
            span,
            before,
            after,
        };
        let mut node = List(crate::options::Edges::NONE);
        super::fill_source_flanks(&mut node, Some(&flank), every_arm, &TABLE, &ctx);
        node.0
    }

    const BROKEN: &str = "f(\n    a,\n    b,\n)";

    #[test]
    fn a_kept_list_opens_a_depth_after_its_opener_and_closes_it_before_its_closer() {
        assert_eq!(flanks(BROKEN, "a,\n    b,", true, true), (Some(INDENT), Some(DEDENT)));
    }

    #[test]
    fn a_depth_the_flank_before_opened_closes_although_the_flank_after_is_not_kept() {
        assert_eq!(flanks(BROKEN, "a,\n    b,", true, false), (Some(INDENT), Some(DEDENT)));
    }

    #[test]
    fn a_flank_after_never_closes_a_depth_the_flank_before_did_not_open() {
        assert_eq!(flanks(BROKEN, "a,\n    b,", false, true), (None, Some(NEWLINE)));
    }

    #[test]
    fn a_same_line_list_keeps_its_tight_flanks() {
        assert_eq!(flanks("f(a, b)", "a, b", true, true), (Some(TIGHT), Some(TIGHT)));
    }

    #[test]
    fn a_detached_window_from_the_openers_line_to_the_closer_classifies_as_its_tree_does() {
        let source = "fn g() {\n    f(\n        a,\n        b\n    );\n}\n";
        let list = "a,\n        b";
        let start = source.find(list).unwrap();
        let window_start = source[..start].trim_end().rfind('\n').map_or(0, |i| i + 1);
        let closer = start + list.len() + source[start + list.len()..].find(')').unwrap();
        let window = &source[window_start..=closer];
        let relative = Span { start: (start - window_start) as u32, end: (start - window_start + list.len()) as u32 };
        assert_eq!(
            flanks_from("", crate::slot::FlankSource::Text(window.to_string()), relative, true, true),
            flanks(source, list, true, true)
        );
        assert_eq!(flanks(source, list, true, true), (Some(INDENT), Some(DEDENT)));
    }

    #[test]
    fn a_depth_the_flank_before_opened_closes_beside_a_closer_on_the_last_items_line() {
        let source = "g(\n    a,\n    b)";
        let start = source.find('a').unwrap() as u32;
        let span = Span { start, end: source.find(')').unwrap() as u32 };
        let edges = flank_edges(source, crate::slot::FlankSource::Tree(encode_handle(3, 0)), span, true, true);
        assert_eq!(edges.before.map(|edge| edge.arm), Some(INDENT));
        assert_eq!(edges.after.map(|edge| (edge.arm, edge.dedent)), Some((TIGHT, Some(true))));
    }

    #[test]
    fn a_list_whose_flanks_were_not_kept_takes_none() {
        assert_eq!(flanks(BROKEN, "a,\n    b,", false, false), (None, None));
    }
}
