//! The read coordinate census (`docs/superpowers/probes/2026-11-17-read-coordinate-census/`):
//! the words a parsed read stores, by role, and what a read without
//! fixed-token rows would need stamped. Ignored; run one grammar and corpus
//! at a time:
//!
//! `SITTIR_CENSUS_GRAMMAR=<lang> SITTIR_CENSUS_CORPUS=<label>
//! SITTIR_CENSUS_SOURCES=<file | list:<file of paths> | json:<paired-run corpus>>
//! SITTIR_CENSUS_OUT=<jsonl> cargo test -p sittir-parity-tests --no-default-features
//! --features arena --test read_census -- --ignored`
//!
//! Paths are absolute: the test runs in its crate's directory. Each run
//! appends one JSON line; `analyze.mjs` in the probe's directory turns the
//! lines into the report.
#![cfg(feature = "arena")]

use std::collections::{BTreeMap, HashMap, HashSet};
use std::io::Write as _;

use sittir_core::arena::side::{RunEntry, SideRecord};
use sittir_core::arena::{header_of, Address, ArenaRead, Cell, CellWord, HydrateNode, ListCell, RecordCells, RecordGrammar, MAX_CHUNKS};
use sittir_core::engine::{Backing, Engine, EngineGrammar, Records};
use sittir_core::nodes::{Kid, Nodes, Step, Visit};
use sittir_core::options::ResolvedOptions;
use sittir_core::read::{Route, Router};
use sittir_core::types::{Delimiter, KindId, NodeIndex};

#[derive(Default, serde::Serialize)]
struct Count {
    n: u64,
    words: u64,
}

impl Count {
    fn add(&mut self, words: u64) {
        self.n += 1;
        self.words += words;
    }
}

#[derive(Default, serde::Serialize)]
struct Tally {
    grammar: String,
    corpus: String,
    sources: u64,
    source_bytes: u64,
    parse_errors: u64,
    read_chunks: u64,
    chunk_words: u64,
    records: Count,
    records_header_only: u64,
    records_error: u64,
    records_extra: u64,
    record_gap_words: u64,
    side_records: Count,
    side_encoded_words: u64,
    side_fields: BTreeMap<String, Count>,
    read_sides: Count,
    side_at_zero_width: u64,
    side_at_header_only: u64,
    side_at_extra: u64,
    side_at_error: u64,
    run_records: Count,
    rows: BTreeMap<String, Count>,
    cells: BTreeMap<String, Count>,
    cell_shapes: BTreeMap<String, Count>,
    leaf_cells: BTreeMap<String, Count>,
    unit_cells: BTreeMap<String, Count>,
    list_cells: Count,
    list_runs: Count,
    link_records: Count,
    cell_rows_named: u64,
    cell_rows_kind_mismatch: u64,
    cell_rows_not_a_row: u64,
    cell_row_kind_pairs: BTreeMap<String, u64>,
    stage_one: StageOne,
}

/// What a read with no row for a fixed token or a unit has to answer from
/// elsewhere, counted over the records' navigation.
#[derive(Default, serde::Serialize)]
struct StageOne {
    /// Variable-text leaves ending in a line break whose next token starts
    /// at their end and is a token stage one drops.
    abutting_leaves: u64,
    /// Lists of a kind whose separator is a choice, with at least one gap.
    choice_lists: u64,
    choice_gaps: u64,
    /// Gaps whose separator is not their list's majority.
    choice_outliers: u64,
    /// Lists whose record stamps a delimiter.
    flanked_lists: u64,
    /// Flanked lists whose kind leaves the trailing flank optional and whose
    /// stamped trailing flag differs from the kind rule: a separator child
    /// follows the list's last item.
    delimiter_disagreements: u64,
    /// Those disagreements by list kind: stamped none where the kind rule
    /// says trailing, and stamped trailing where it says none.
    delimiter_to_trailing: BTreeMap<String, u64>,
    delimiter_to_none: BTreeMap<String, u64>,
    /// Items `$descendants` yields today for a named token no cell holds, by
    /// `holder > token (unit|node)`.
    named_fixed_query_items: BTreeMap<String, u64>,
    /// Every case behind a non-zero disagreement or named fixed item.
    cases: Vec<String>,
}

type ShapeFn = fn(KindId) -> Option<sittir_core::arena::RecordShape>;

thread_local! {
    static SHAPES: std::cell::RefCell<Option<ShapeFn>> = const { std::cell::RefCell::new(None) };
}

fn census<G: RecordGrammar + Copy, N: HydrateNode + RecordCells>(grammar: G, options: fn() -> ResolvedOptions, name: &str, corpus: &str, sources: &[(String, String)]) -> Tally {
    SHAPES.with(|shapes| *shapes.borrow_mut() = Some(N::shape));
    let model = ListModel::of(name);
    let mut tally = Tally { grammar: name.to_string(), corpus: corpus.to_string(), ..Tally::default() };
    for (label, source) in sources {
        let mut engine = Engine::new(grammar, options()).expect("an engine");
        let parsed = engine.parse_records::<N>(source).expect("a read");
        if let Some(root) = parsed.root {
            engine
                .read_node(root, |tree, at| stage_one(grammar, tree, at, source, label, &model, &mut tally.stage_one))
                .expect("the records read")
                .expect("a read wrote the root's record");
        }
        tally.sources += 1;
        tally.source_bytes += source.len() as u64;
        if !parsed.errors.is_empty() {
            tally.parse_errors += 1;
        }
        let built = engine.written().built();
        let arena: &dyn ArenaRead = &*built;
        for n in (1..MAX_CHUNKS).filter(|&n| arena.read_chunk(n)) {
            if let Some(chunk) = arena.chunk(n) {
                tally.read_chunks += 1;
                tally.chunk_words += chunk.iter().rposition(|&word| word != 0).map_or(0, |last| last + 1) as u64;
            }
        }
        let Some(root) = parsed.root else { continue };
        let source = sittir_core::arena::RunNodes::source_of(arena, root).expect("the root's source");
        let read_side = SideRecord {
            spans: sittir_core::arena::read_spans(arena, source).expect("the read's spans"),
            starts: sittir_core::arena::read_entry_starts(arena, source).expect("the read's starts").map(<[u32]>::to_vec),
            ..SideRecord::default()
        };
        tally.read_sides.add(encoded(&read_side).len() as u64);
        let mut seen = HashSet::new();
        let mut pending = vec![root];
        while let Some(at) = pending.pop() {
            if seen.insert(at) {
                walk_record(arena, at, G::KIND_BITS, &grammar, &mut tally, &mut pending);
            }
        }
    }
    tally
}

fn kind_name<G: EngineGrammar>(_: &G, kind: KindId) -> String {
    if kind == KindId::ERROR {
        "ERROR".to_string()
    } else {
        G::kind_name(kind).to_string()
    }
}

fn walk_record<G: EngineGrammar>(arena: &dyn ArenaRead, at: Address, bits: u32, grammar: &G, tally: &mut Tally, pending: &mut Vec<Address>) {
    let header = arena.words(at, 2).expect("a header");
    let (kind, flags) = header_of(header[0], sittir_core::record::PARSED_KIND_BITS);
    if flags != 0 {
        tally.link_records.add(u64::from(sittir_core::arena::LINK_WORDS));
        return;
    }
    let side_at = Address(header[1]);
    let record_shape = if kind == KindId::ERROR { None } else { SHAPES.with(|shapes| (shapes.borrow().as_ref().expect("shapes"))(kind)) };
    let header_only = record_shape.is_none_or(|shape| shape.cells.is_empty());
    tally.records.add(u64::from(record_shape.map_or(2, |shape| shape.words.max(2))));
    if header_only {
        tally.records_header_only += 1;
    }
    if kind == KindId::ERROR {
        tally.records_error += 1;
    }
    let side = SideRecord::read(arena, side_at).expect("a side record");
    let extra = side.node.is_some_and(|facts| facts.extra);
    if extra {
        tally.records_extra += 1;
    }
    if side_at != Address::NONE {
        let written = encoded(&side);
        let len = u32::try_from(written.len()).expect("a side record within a chunk");
        assert_eq!(arena.words(side_at, len).expect("the side record's words"), written.as_slice(), "the side record at {side_at:?} reads back as its encoder writes it");
        tally.side_encoded_words += u64::from(len);
        side_words(&side, header_only, extra, kind == KindId::ERROR, tally);
    }
    let word_of: Vec<usize> = std::iter::once(0).chain(side.run.iter().scan(0, |word, run_entry| {
        *word += run_entry.words() as usize;
        Some(*word)
    })).collect();
    let entry_at_word: HashMap<usize, usize> = word_of.iter().enumerate().map(|(entry, &word)| (word, entry)).collect();
    let mut named: HashMap<usize, KindId> = HashMap::new();
    let record_entry: HashMap<Address, usize> = side.run.iter().enumerate().filter_map(|(entry, run_entry)| match *run_entry { RunEntry::Record { at, .. } => Some((at, entry)), RunEntry::Row { .. } => None }).collect();
    let mut lists: Vec<Vec<usize>> = Vec::new();
    if let Some(shape) = record_shape {
        let record = arena.words(at, shape.words.max(2)).expect("a record");
        let cell_words: u32 = shape.cells.iter().map(|cell| if cell.run.is_some() { 1 } else { cell.width }).sum();
        tally.record_gap_words += u64::from(shape.words.max(2) - 2 - cell_words);
        for &cell in shape.cells {
            let words = &record[cell.word as usize..(cell.word + cell.width) as usize];
            match cell.run {
                None => {
                    count_cell(words, cell, bits, grammar, tally, pending, "", &mut named);
                }
                Some(item_width) => {
                    tally.list_cells.add(1);
                    let list = ListCell::of_word(CellWord(words[0]), arena).expect("a list cell");
                    if list.len > 0 {
                        tally.list_runs.add(1 + u64::from(list.len) * u64::from(item_width));
                    }
                    let mut items = Vec::new();
                    for item in list.items(arena, item_width).expect("list items") {
                        match count_cell(item, cell, bits, grammar, tally, pending, "item ", &mut named) {
                            Some(Item::Row(word)) => items.extend(entry_at_word.get(&word).copied()),
                            Some(Item::Record(child)) => items.extend(record_entry.get(&child).copied()),
                            None => {}
                        }
                    }
                    items.sort_unstable();
                    if !items.is_empty() {
                        lists.push(items);
                    }
                }
            }
        }
    }
    let named: HashMap<usize, KindId> = named.into_iter().filter_map(|(word, kind)| entry_at_word.get(&word).map(|&entry| (entry, kind))).collect();
    let holder = kind_name(grammar, kind);
    let trivia_holder = extra || kind == KindId::ERROR;
    let mut open: Vec<(usize, String, &'static str)> = Vec::new();
    let mut separators: Vec<HashSet<KindId>> = vec![HashSet::new(); lists.len()];
    for (list, items) in lists.iter().enumerate() {
        for entry in items[0] + 1..*items.last().expect("an item") {
            if items.binary_search(&entry).is_ok() || named.contains_key(&entry) {
                continue;
            }
            if let Some(RunEntry::Row { facts, inner: 0, .. }) = side.run.get(entry) {
                if !facts.extra {
                    separators[list].insert(facts.kind);
                }
            }
        }
    }
    for (entry, run_entry) in side.run.iter().enumerate() {
        while open.last().is_some_and(|(last, _, _)| *last < entry) {
            open.pop();
        }
        match *run_entry {
            RunEntry::Record { at, .. } => {
                tally.run_records.add(u64::from(run_entry.words()));
                pending.push(at);
                if named.contains_key(&entry) {
                    tally.cell_rows_not_a_row += 1;
                }
            }
            RunEntry::Row { facts, span, inner } => {
                if let Some(&cell_kind) = named.get(&entry) {
                    tally.cell_rows_named += 1;
                    if cell_kind != facts.kind && cell_kind != facts.display() {
                        tally.cell_rows_kind_mismatch += 1;
                        *tally.cell_row_kind_pairs.entry(format!("{} -> {} / {}", kind_name(grammar, cell_kind), kind_name(grammar, facts.kind), kind_name(grammar, facts.display()))).or_default() += 1;
                    }
                }
                let role = if named.contains_key(&entry) {
                    "slot"
                } else if facts.extra || trivia_holder {
                    "trivia"
                } else {
                    "unnamed"
                };
                let list_place = lists.iter().zip(&separators).find_map(|(items, kinds)| {
                    let (first, last) = (items[0], *items.last().expect("an item"));
                    if entry > first && entry < last && items.binary_search(&entry).is_err() {
                        Some("between-list-items")
                    } else if entry == last + 1 && kinds.contains(&facts.kind) {
                        Some("after-last-list-item-as-a-separator")
                    } else {
                        None
                    }
                });
                let (parent, place) = match open.last() {
                    Some((_, row_kind, "slot")) => (row_kind.clone(), "under-slot-row"),
                    Some((_, row_kind, "trivia")) => (row_kind.clone(), "under-trivia-row"),
                    Some((_, row_kind, _)) => (row_kind.clone(), "under-unnamed-row"),
                    None => (holder.clone(), list_place.unwrap_or("in-record")),
                };
                let shape = if inner > 0 { "has-inner" } else { "leaf" };
                let width = if facts.missing {
                    "missing"
                } else if span.start == span.end {
                    "zero-width"
                } else {
                    "wide"
                };
                let key = format!(
                    "{role}\t{parent}\t{place}\t{}\t{}\t{}\t{shape}\t{width}",
                    kind_name(grammar, facts.kind),
                    kind_name(grammar, facts.display()),
                    if facts.named { "named" } else { "anonymous" }
                );
                tally.rows.entry(key).or_default().add(u64::from(run_entry.words()));
                if inner > 0 {
                    let parent_role = match open.last() {
                        Some((_, _, "slot")) => "slot",
                        Some((_, _, "trivia")) => "trivia",
                        _ => role,
                    };
                    open.push((entry_at_word[&(word_of[entry + 1] + inner as usize)] - 1, kind_name(grammar, facts.kind), parent_role));
                }
            }
        }
    }
    for &entry in named.keys() {
        if entry >= side.run.len() {
            tally.cell_rows_not_a_row += 1;
        }
    }
}

enum Item {
    Row(usize),
    Record(Address),
}

#[allow(clippy::too_many_arguments, reason = "a cell fills the tally, the pending records and the named rows of its record")]
fn count_cell<G: EngineGrammar>(words: &[u32], shape: sittir_core::arena::CellShape, bits: u32, grammar: &G, tally: &mut Tally, pending: &mut Vec<Address>, place: &str, named: &mut HashMap<usize, KindId>) -> Option<Item> {
    let width = words.len() as u64;
    let cell = Cell::decode_parsed(words, shape, bits).expect("a parsed cell");
    let item = match cell {
        Cell::ParsedLeaf { row, .. } | Cell::Unit { row: Some(row), .. } if row.0 >= 2 => Some(Item::Row(row.0 as usize - 2)),
        Cell::Child { at, .. } => Some(Item::Record(at)),
        _ => None,
    };
    let form = match cell {
        Cell::Absent => "absent",
        Cell::ParsedLeaf { kind, row, .. } => {
            tally.leaf_cells.entry(kind_name(grammar, kind)).or_default().add(width);
            if row.0 >= 2 {
                named.insert(row.0 as usize - 2, kind);
            }
            "leaf"
        }
        Cell::ParsedText { .. } => "text",
        Cell::Child { at, .. } => {
            pending.push(at);
            "child"
        }
        Cell::Unit { kind, row } => {
            tally.unit_cells.entry(kind_name(grammar, kind)).or_default().add(width);
            if let Some(row) = row.filter(|row| row.0 >= 2) {
                named.insert(row.0 as usize - 2, kind);
            }
            "unit"
        }
        _ => "other",
    };
    tally.cells.entry(format!("{place}{form}")).or_default().add(width);
    tally.cell_shapes.entry(format!("{place}{}/{}/{form}", shape.forms, width)).or_default().add(width);
    item
}

fn encoded(side: &SideRecord) -> Vec<u32> {
    let mut written = Vec::new();
    side.write(&mut |words| {
        written = words.to_vec();
        Ok(Address::NONE)
    })
    .expect("a side record encodes");
    written
}

type Clear = fn(&mut SideRecord);

const SIDE_FIELDS: [(&str, Clear); 15] = [
    ("at", |side| side.at = None),
    ("edges", |side| side.edges = None),
    ("span", |side| side.span = None),
    ("sides", |side| side.sides = None),
    ("delimiter", |side| side.delimiter = None),
    ("separator_kind", |side| side.separator_kind = None),
    ("flanks", |side| side.flanks = sittir_core::layout_kinds::Flanks::default()),
    ("slots", |side| side.slots.clear()),
    ("parent", |side| side.parent = None),
    ("node", |side| side.node = None),
    ("source", |side| side.source = None),
    ("depth", |side| side.depth = 0),
    ("run", |side| side.run.clear()),
    ("spans", |side| side.spans.clear()),
    ("starts", |side| side.starts = None),
];

fn words_after_flags(side: &SideRecord) -> u64 {
    encoded(side).len().saturating_sub(1) as u64
}

fn side_words(side: &SideRecord, header_only: bool, extra: bool, error: bool, tally: &mut Tally) {
    let mut total = 1u64;
    tally.side_fields.entry("flags".to_string()).or_default().add(1);
    let whole = words_after_flags(side);
    for (name, clear) in SIDE_FIELDS {
        let mut without = side.clone();
        clear(&mut without);
        let words = whole - words_after_flags(&without);
        if words > 0 {
            tally.side_fields.entry(name.to_string()).or_default().add(words);
            total += words;
        }
    }
    if let Some(row) = side.at {
        if row.span.start == row.span.end {
            tally.side_at_zero_width += 1;
        }
        if header_only {
            tally.side_at_header_only += 1;
        }
        if extra {
            tally.side_at_extra += 1;
        }
        if error {
            tally.side_at_error += 1;
        }
    }
    tally.side_records.add(total);
}

/// Each source of `spec` with the label a case names it by: its path, or its
/// place in a paired-run corpus.
fn sources_of(spec: &str) -> Vec<(String, String)> {
    let read = |path: &str| std::fs::read_to_string(path).unwrap_or_else(|e| panic!("{path}: {e}"));
    if let Some(list) = spec.strip_prefix("list:") {
        read(list).lines().filter(|line| !line.is_empty()).map(|path| (path.to_string(), read(path))).collect()
    } else if let Some(json) = spec.strip_prefix("json:") {
        let entries: Vec<serde_json::Value> = serde_json::from_str(&read(json)).expect("corpus json");
        entries.iter().enumerate().map(|(n, entry)| (format!("{json}#{n}"), entry["source"].as_str().expect("a source").to_string())).collect()
    } else {
        vec![(spec.to_string(), read(spec))]
    }
}

/// A grammar's list kinds, by kind name, from its node model: the separators
/// each one's rule allows, and the kinds that leave the trailing flank
/// optional.
struct ListModel {
    separators: HashMap<String, Vec<String>>,
    trailing_optional: HashSet<String>,
}

/// Whether a separator child follows the last item of its slot.
fn trailing_by_kind(routes: &[Route]) -> bool {
    routes.iter().enumerate().any(|(at, route)| match *route {
        Route::Separator { slot, .. } => {
            let item = |route: &Route| matches!(*route, Route::Slot { slot: of, .. } if of == slot);
            routes[..at].iter().any(item) && !routes[at + 1..].iter().any(item)
        }
        _ => false,
    })
}

impl ListModel {
    fn of(grammar: &str) -> Self {
        let path = format!("{}/../../../packages/{grammar}/.sittir/node-model.json5", env!("CARGO_MANIFEST_DIR"));
        let model: serde_json::Value = serde_json::from_str(&std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{path}: {e}"))).expect("a node model");
        let nodes = model["nodes"].as_array().expect("the model's nodes");
        let separators = nodes
            .iter()
            .filter_map(|node| {
                let names: Vec<String> = match (&node["separator"], &node["separatorCandidates"]) {
                    (serde_json::Value::String(one), _) => vec![one.clone()],
                    (_, serde_json::Value::Array(many)) => many.iter().filter_map(|value| value.as_str().map(str::to_string)).collect(),
                    _ => return None,
                };
                let kinds = std::iter::once(node["kind"].as_str()?.to_string()).chain(node["shownAs"].as_array().into_iter().flatten().filter_map(|shown| shown.as_str().map(str::to_string)));
                Some(kinds.map(move |kind| (kind, names.clone())).collect::<Vec<_>>())
            })
            .flatten()
            .collect();
        let trailing_optional = nodes
            .iter()
            .filter(|node| node["trailingDelimiter"].as_str() == Some("optional"))
            .flat_map(|node| std::iter::once(node["kind"].as_str()).chain(node["shownAs"].as_array().into_iter().flatten().map(serde_json::Value::as_str)))
            .flatten()
            .map(str::to_string)
            .collect();
        Self { separators, trailing_optional }
    }

    fn is_choice(&self, list: &str) -> bool {
        self.separators.get(list).is_some_and(|names| names.len() > 1)
    }
}

/// What stage one does with a node of the read: keeps it (a record, slot
/// content held as a leaf, trivia, or what a kept row holds), or drops it (a
/// fixed token, a unit, or what a dropped row holds).
#[derive(Clone, Copy, PartialEq, Eq)]
enum Fate {
    Record,
    Kept,
    Dropped,
}

/// The stage-one tallies of the read at `root`.
fn stage_one<G: RecordGrammar + Copy>(grammar: G, tree: &Records<'_, G>, root: NodeIndex, source: &str, label: &str, model: &ListModel, tally: &mut StageOne) {
    let mut nodes = tree.nodes();
    let mut met: Vec<(Kid, Option<NodeIndex>, bool, bool)> = Vec::new();
    let mut open: Vec<(NodeIndex, bool, bool)> = Vec::new();
    nodes.walk(root, &mut |step, kid| match step {
        Step::Meet => {
            let (under_trivia, inside_extra) = open.last().map_or((false, false), |&(_, trivia, extra)| (trivia, extra));
            met.push((*kid, open.last().map(|&(index, ..)| index), under_trivia, inside_extra));
            open.push((kid.index, under_trivia || kid.extra || kid.error(), inside_extra || kid.extra));
            Visit::Enter
        }
        Step::Leave => {
            open.pop();
            Visit::Enter
        }
    });
    let mut fates: HashMap<NodeIndex, Fate> = HashMap::new();
    let name = |kind: KindId| G::kind_name(kind).to_string();
    for &(kid, parent, under_trivia, _) in &met {
        let fate = match tree.name_at(kid.index) {
            Some(named) if named.site().is_none() => Fate::Record,
            _ if kid.extra || kid.error() || under_trivia => Fate::Kept,
            Some(_) => {
                if grammar.unit_id(&mut nodes, &kid).is_some() {
                    Fate::Dropped
                } else {
                    Fate::Kept
                }
            }
            None => match parent.and_then(|parent| fates.get(&parent)) {
                Some(Fate::Kept) => Fate::Kept,
                Some(Fate::Dropped) => Fate::Dropped,
                _ => Fate::Dropped,
            },
        };
        fates.insert(kid.index, fate);
    }
    let leaves: Vec<&(Kid, Option<NodeIndex>, bool, bool)> = met.iter().filter(|(kid, ..)| kid.count == 1).collect();
    for pair in leaves.windows(2) {
        let (leaf, next) = (pair[0].0, pair[1].0);
        let ends_line = leaf.end > leaf.start && source.as_bytes().get(leaf.end as usize - 1) == Some(&b'\n');
        if fates[&leaf.index] == Fate::Kept && ends_line && next.start == leaf.end && fates[&next.index] == Fate::Dropped {
            tally.abutting_leaves += 1;
        }
    }
    let arena = tree.records_arena();
    for &(kid, ..) in &met {
        if fates[&kid.index] != Fate::Record {
            continue;
        }
        let list = name(kid.grammar);
        if model.is_choice(&list) {
            if let Some(routed) = grammar.slot_routes(&mut nodes, &kid) {
                for slot in sittir_core::list_slots::slot_gaps(&routed) {
                    if slot.gaps.is_empty() {
                        continue;
                    }
                    let kinds: Vec<KindId> = slot.gaps.iter().map(|gap| gap.separator.kind).collect();
                    let majority = sittir_core::list_slots::majority(&kinds, None);
                    tally.choice_lists += 1;
                    tally.choice_gaps += kinds.len() as u64;
                    tally.choice_outliers += kinds.iter().filter(|&&kind| Some(kind) != majority).count() as u64;
                }
            }
        }
        let Some(record) = tree.name_at(kid.index).map(|named| Address(named.address())) else { continue };
        let side_at = Address(arena.words(record, 2).expect("a header")[1]);
        let Some(delimiter) = SideRecord::read(arena, side_at).expect("a side record").delimiter else { continue };
        tally.flanked_lists += 1;
        if !model.trailing_optional.contains(&list) {
            continue;
        }
        let Some(routed) = grammar.slot_routes(&mut nodes, &kid) else { continue };
        let stamped = delimiter.has(Delimiter::TRAILING);
        let by_kind = trailing_by_kind(&routed.routes);
        if stamped != by_kind {
            tally.delimiter_disagreements += 1;
            let flips = if by_kind { &mut tally.delimiter_to_trailing } else { &mut tally.delimiter_to_none };
            *flips.entry(list.clone()).or_default() += 1;
            let tail: Vec<String> = routed.children.iter().zip(&routed.routes).rev().take(3).rev().map(|(child, route)| format!("{} {route:?} {}..{}", name(child.grammar), child.start, child.end)).collect();
            tally.cases.push(format!("delimiter\t{label}\t{list}\t{}..{}\tstamped trailing {stamped}\tby kind {by_kind}\tlast kids {}", kid.start, kid.end, tail.join(", ")));
        }
    }
    let surface = grammar.surface_kinds();
    for &(kid, parent, _, inside_extra) in &met {
        if kid.index == root || inside_extra || kid.extra {
            continue;
        }
        if !kid.named || surface.is_depth_member(kid.grammar) || !(kid.error() || grammar.admits(kid.grammar, kid.display)) {
            continue;
        }
        let unit = grammar.unit_id(&mut nodes, &kid);
        let Some(parent) = parent else { continue };
        let holder = nodes.kid(parent);
        let role = match grammar.router(holder.grammar, holder.display) {
            Some(Router::Children(route, ..)) => match route(&kid) {
                Ok(Route::Slot { .. }) => None,
                Ok(Route::Separator { .. }) => Some("separator"),
                Ok(Route::Layout) => Some("layout"),
                Ok(Route::Trivia) | Err(_) => None,
            },
            _ => Some("envelope"),
        }
        .filter(|_| fates.get(&kid.index) == Some(&Fate::Dropped));
        if unit.is_none() && role.is_some() && matches!(grammar.router(holder.grammar, holder.display), Some(Router::Children(..))) && !kid.error() {
            continue;
        }
        if let Some(role) = role {
            let form = if unit.is_some() { "unit" } else { "node" };
            *tally.named_fixed_query_items.entry(format!("{} > {} ({role}, {form})", name(holder.grammar), name(kid.grammar))).or_default() += 1;
            tally.cases.push(format!("query\t{label}\t{} > {}\t{}..{}\t{role}\t{form}", name(holder.grammar), name(kid.grammar), kid.start, kid.end));
        }
    }
}

#[test]
fn the_side_words_a_census_attributes_are_the_words_their_encoder_writes() {
    let source = "// lead\nfn f<T>(a: u8, b: T,) -> Vec<u8> {\n    let x = [1, 2,];\n    x.len(); /* t */\n}\n\nstruct S { a: u8, }\n";
    let tally = census::<_, sittir_rust::render::AnyNode>(sittir_rust::RustGrammar, sittir_rust::render::options::defaults, "rust", "guard", &[("guard".to_string(), source.to_string())]);
    assert!(tally.side_records.n > 0, "the source's records keep side records");
    let attributed = tally.records.words + tally.side_records.words + tally.list_runs.words + tally.link_records.words + tally.read_sides.words;
    assert_eq!(attributed, tally.chunk_words, "every word of a one-chunk read is a record's, a side record's, a list run's or the read's own side record's");
    assert_eq!(tally.side_records.words, tally.side_encoded_words, "words attributed to side record fields, flags word included, against the words their encoder writes");
    let run = &tally.side_fields["run"];
    let entries = tally.rows.values().map(|count| count.words).sum::<u64>() + tally.run_records.words;
    assert_eq!(run.words, run.n + entries, "a run's words are its length word and the words of its entries, by role");
}

#[test]
#[ignore = "a census over corpora named by the environment, run by hand"]
fn read_census() {
    let grammar = std::env::var("SITTIR_CENSUS_GRAMMAR").expect("SITTIR_CENSUS_GRAMMAR");
    let corpus = std::env::var("SITTIR_CENSUS_CORPUS").expect("SITTIR_CENSUS_CORPUS");
    let sources = sources_of(&std::env::var("SITTIR_CENSUS_SOURCES").expect("SITTIR_CENSUS_SOURCES"));
    let tally = match grammar.as_str() {
        "rust" => census::<_, sittir_rust::render::AnyNode>(sittir_rust::RustGrammar, sittir_rust::render::options::defaults, &grammar, &corpus, &sources),
        "typescript" => census::<_, sittir_typescript::render::AnyNode>(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults, &grammar, &corpus, &sources),
        "python" => census::<_, sittir_python::render::AnyNode>(sittir_python::PythonGrammar, sittir_python::render::options::defaults, &grammar, &corpus, &sources),
        "regex" => census::<_, sittir_regex::render::AnyNode>(sittir_regex::RegexGrammar, sittir_regex::render::options::defaults, &grammar, &corpus, &sources),
        "scm" => census::<_, sittir_scm::render::AnyNode>(sittir_scm::ScmGrammar, sittir_scm::render::options::defaults, &grammar, &corpus, &sources),
        other => panic!("no grammar {other}"),
    };
    let mut line = serde_json::to_string(&tally).expect("json");
    line.push('\n');
    std::fs::OpenOptions::new().create(true).append(true).open(std::env::var("SITTIR_CENSUS_OUT").expect("SITTIR_CENSUS_OUT")).expect("out").write_all(line.as_bytes()).expect("write");
}
