//! Probe addon for the transport refresh of the shared-arena design. Not sittir code.
//!
//! Two rust kinds declared the way codegen would emit them (routes as attributes), expanded by
//! `slot-derive`. The `Probe` class reads them with sittir's generated rust parser and hands them
//! to JavaScript in three wire forms derived from the same declaration: napi objects, JSON, and
//! arena words. It also decodes each form back (the render direction) and times the native read
//! on its own.
#![allow(clippy::all)]
mod rt;

use napi::bindgen_prelude::{Buffer, Uint32Array};
use napi_derive::napi;
use rt::{Arena, ArenaRef, Coord, ReadNode, Refusal, RouteSpec, Routes, Slot, Words};
use slot_derive::transport;
use std::hint::black_box;
use std::time::Instant;
use tree_sitter_language::LanguageFn;

unsafe extern "C" {
    fn tree_sitter_rust() -> *const ();
}
const LANGUAGE: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_rust) };

/// rust `function_item`, slot for slot as `FunctionItemTransport` holds it; `fn` and `->` are its
/// layout tokens.
#[transport(kind = "function_item", layout = ["fn", "->"])]
pub struct FunctionItem {
    #[slot(field = "visibility_modifier")]
    pub visibility_modifier: Option<Slot>,
    #[slot(field = "function_modifiers")]
    pub function_modifiers: Option<Slot>,
    #[slot(field = "name")]
    pub name: Slot,
    #[slot(field = "type_parameters")]
    pub type_parameters: Option<Slot>,
    #[slot(field = "parameters")]
    pub parameters: Slot,
    #[slot(field = "return_type")]
    pub return_type: Option<Slot>,
    #[slot(field = "where_clause")]
    pub where_clause: Option<Slot>,
    #[slot(field = "body")]
    pub body: Slot,
    #[trivia]
    pub trivia: Vec<Coord>,
}

/// rust `function_modifiers`: keyword tokens stored as their kind ids, `extern_modifier` as a child.
#[transport(kind = "function_modifiers")]
pub struct FunctionModifiers {
    #[slot(kinds = ["extern_modifier"], tokens = ["async", "default", "const", "unsafe"])]
    pub modifier: Vec<Slot>,
    #[trivia]
    pub trivia: Vec<Coord>,
}

#[napi(object)]
pub struct WordsOut {
    pub words: Uint32Array,
    pub text: Buffer,
    pub count: u32,
}

#[napi]
pub struct Probe {
    source: String,
    tree: tree_sitter::Tree,
    lang: tree_sitter::Language,
    fi_routes: Routes,
    fm_routes: Routes,
    fi_kind: u16,
    fm_kind: u16,
}

/// Every node of `kind`, visited in pre-order with one cursor; `f` reads it in place.
fn each_of_kind(tree: &tree_sitter::Tree, kind: u16, mut f: impl FnMut(&mut tree_sitter::TreeCursor<'_>)) {
    let mut cur = tree.walk();
    loop {
        if cur.node().kind_id() == kind {
            f(&mut cur);
        }
        if cur.goto_first_child() {
            continue;
        }
        loop {
            if cur.goto_next_sibling() {
                break;
            }
            if !cur.goto_parent() {
                return;
            }
        }
    }
}

impl Probe {
    fn all<T: ReadNode>(&self, kind: u16, routes: &Routes) -> napi::Result<Vec<T>> {
        let src = self.source.as_bytes();
        let mut out = Vec::new();
        let mut refused = None;
        each_of_kind(&self.tree, kind, |cur| {
            if refused.is_none() {
                match T::read(cur, src, routes) {
                    Ok(node) => out.push(node),
                    Err(refusal) => refused = Some(refusal),
                }
            }
        });
        match refused {
            Some(refusal) => Err(self.refused(refusal)),
            None => Ok(out),
        }
    }
    fn at<T: ReadNode>(&self, row: u32, routes: &Routes) -> napi::Result<T> {
        let mut cur = self.tree.walk();
        cur.goto_descendant(row as usize);
        T::read(&mut cur, self.source.as_bytes(), routes).map_err(|refusal| self.refused(refusal))
    }
    fn refused(&self, r: Refusal) -> napi::Error {
        let name = |id: u16| self.lang.node_kind_for_id(id).unwrap_or("?");
        napi::Error::from_reason(format!(
            "{} (kind {}) has no route for its child {} (kind {}) at row {}",
            name(r.parent),
            r.parent,
            name(r.child),
            r.child,
            r.row
        ))
    }
    fn words_of<T: Words>(list: &[T]) -> WordsOut {
        let mut a = Arena::default();
        a.words.resize(1 + list.len(), 0);
        a.words[0] = list.len() as u32;
        for (i, t) in list.iter().enumerate() {
            let off = t.write_words(&mut a);
            a.words[1 + i] = off;
        }
        WordsOut { count: list.len() as u32, words: Uint32Array::new(a.words), text: Buffer::from(a.text) }
    }
}

#[napi]
impl Probe {
    #[napi(constructor)]
    pub fn new(source: String) -> napi::Result<Self> {
        let lang: tree_sitter::Language = LANGUAGE.into();
        let mut parser = tree_sitter::Parser::new();
        parser.set_language(&lang).map_err(|e| napi::Error::from_reason(e.to_string()))?;
        let tree = parser.parse(&source, None).ok_or_else(|| napi::Error::from_reason("parse failed"))?;
        let fi_routes = Routes::new(&lang, FunctionItem::route_specs(), FunctionItem::LAYOUT);
        let fm_routes = Routes::new(&lang, FunctionModifiers::route_specs(), FunctionModifiers::LAYOUT);
        let fi_kind = lang.id_for_node_kind(FunctionItem::KIND, true);
        let fm_kind = lang.id_for_node_kind(FunctionModifiers::KIND, true);
        Ok(Probe { source, tree, lang, fi_routes, fm_routes, fi_kind, fm_kind })
    }

    /// The parser facts the routes resolved to, for checking the probe reads what sittir reads.
    #[napi]
    pub fn describe(&self) -> String {
        let names = |ids: &[&str]| ids.iter().map(|f| format!("{f}={:?}", self.lang.field_id_for_name(f))).collect::<Vec<_>>().join(" ");
        format!(
            "function_item={} function_modifiers={} fields: {}",
            self.fi_kind,
            self.fm_kind,
            names(&["visibility_modifier", "function_modifiers", "name", "type_parameters", "parameters", "return_type", "where_clause", "body"])
        )
    }

    /// Every `function_item` read with its `body` route removed. The route is replaced by one that
    /// takes nothing, so the other slots keep their places; the read is refused at the first
    /// node's body, and the refusal names the kind, the child and its row.
    #[napi]
    pub fn refusal_without_body(&self) -> String {
        let specs: Vec<RouteSpec> = FunctionItem::route_specs()
            .iter()
            .map(|sp| RouteSpec { field: if sp.field == Some("body") { Some("") } else { sp.field }, kinds: sp.kinds, tokens: sp.tokens })
            .collect();
        let routes = Routes::new(&self.lang, &specs, FunctionItem::LAYOUT);
        match self.all::<FunctionItem>(self.fi_kind, &routes) {
            Ok(read) => format!("not refused: {} nodes read", read.len()),
            Err(refusal) => refusal.reason,
        }
    }

    /// Tree-sitter parse alone, in ms, for scale.
    #[napi]
    pub fn parse_ms(&self, iters: u32) -> f64 {
        let mut parser = tree_sitter::Parser::new();
        parser.set_language(&self.lang).unwrap();
        let t = Instant::now();
        for _ in 0..iters {
            black_box(parser.parse(&self.source, None));
        }
        t.elapsed().as_secs_f64() * 1e3 / iters as f64
    }

    /// The descendant index of every `function_item` (`fm` = true: every `function_modifiers`).
    #[napi]
    pub fn rows(&self, fm: Option<bool>) -> Vec<u32> {
        let kind = if fm == Some(true) { self.fm_kind } else { self.fi_kind };
        let mut out = Vec::new();
        each_of_kind(&self.tree, kind, |cur| out.push(cur.descendant_index() as u32));
        out
    }

    /// Native only: ns per node to walk the tree and read every function_item one level
    /// (`fm` = true: every function_modifiers), nothing crossing. Also the walk alone.
    #[napi]
    pub fn native_ns(&self, iters: u32, fm: Option<bool>) -> napi::Result<Vec<f64>> {
        let fm = fm == Some(true);
        let (kind, n) = if fm { (self.fm_kind, self.rows(Some(true)).len()) } else { (self.fi_kind, self.rows(None).len()) };
        let t = Instant::now();
        for _ in 0..iters {
            if fm {
                black_box(self.all::<FunctionModifiers>(kind, &self.fm_routes)?);
            } else {
                black_box(self.all::<FunctionItem>(kind, &self.fi_routes)?);
            }
        }
        let read = t.elapsed().as_nanos() as f64 / (iters as f64 * n.max(1) as f64);
        let t = Instant::now();
        for _ in 0..iters {
            let mut c = 0u32;
            each_of_kind(&self.tree, kind, |_| c += 1);
            black_box(c);
        }
        let walk = t.elapsed().as_nanos() as f64 / (iters as f64 * n.max(1) as f64);
        Ok(vec![read, walk, n as f64])
    }

    /// Native only: ns per node to read one function_item at its row (`goto_descendant` + read),
    /// the lazy path's native work.
    #[napi]
    pub fn native_at_ns(&self, rows: Vec<u32>, iters: u32) -> napi::Result<f64> {
        let t = Instant::now();
        for _ in 0..iters {
            for &r in &rows {
                black_box(self.at::<FunctionItem>(r, &self.fi_routes)?);
            }
        }
        Ok(t.elapsed().as_nanos() as f64 / (iters as f64 * rows.len().max(1) as f64))
    }

    // --- batch: every function_item, one call -------------------------------------------------
    #[napi]
    pub fn all_objects(&self) -> napi::Result<Vec<FunctionItem>> {
        self.all(self.fi_kind, &self.fi_routes)
    }
    #[napi]
    pub fn all_json(&self) -> napi::Result<String> {
        Ok(serde_json::to_string(&self.all::<FunctionItem>(self.fi_kind, &self.fi_routes)?).unwrap())
    }
    #[napi]
    pub fn all_words(&self) -> napi::Result<WordsOut> {
        Ok(Self::words_of(&self.all::<FunctionItem>(self.fi_kind, &self.fi_routes)?))
    }
    #[napi]
    pub fn all_modifier_objects(&self) -> napi::Result<Vec<FunctionModifiers>> {
        self.all(self.fm_kind, &self.fm_routes)
    }

    // --- lazy: one function_item per call, at its row -----------------------------------------
    #[napi]
    pub fn one_object(&self, row: u32) -> napi::Result<FunctionItem> {
        self.at(row, &self.fi_routes)
    }
    #[napi]
    pub fn one_json(&self, row: u32) -> napi::Result<String> {
        Ok(serde_json::to_string(&self.at::<FunctionItem>(row, &self.fi_routes)?).unwrap())
    }
    #[napi]
    pub fn one_words(&self, row: u32) -> napi::Result<WordsOut> {
        Ok(Self::words_of(&[self.at::<FunctionItem>(row, &self.fi_routes)?]))
    }

    // --- the render direction: decode each form back into the typed transport ------------------
    #[napi]
    pub fn decode_objects(&self, list: Vec<FunctionItem>) -> u32 {
        black_box(&list);
        list.len() as u32
    }
    #[napi]
    pub fn decode_json(&self, json: String) -> napi::Result<u32> {
        let list: Vec<FunctionItem> = serde_json::from_str(&json).map_err(|e| napi::Error::from_reason(e.to_string()))?;
        black_box(&list);
        Ok(list.len() as u32)
    }
    #[napi]
    pub fn decode_words(&self, words: Uint32Array, text: Buffer) -> u32 {
        let a = ArenaRef { words: &words, text: &text };
        let count = words[0];
        for i in 0..count as usize {
            black_box(FunctionItem::read_words(&a, words[1 + i]));
        }
        count
    }
}
