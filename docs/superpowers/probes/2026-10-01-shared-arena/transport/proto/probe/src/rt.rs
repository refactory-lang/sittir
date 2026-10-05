//! The shared runtime the macro's expansion calls: slot values, route resolution, the child
//! reader and the arena encoding. Hand-written once, the way `sittir-core` is.
use napi::bindgen_prelude::{FromNapiValue, Null, ToNapiValue};
use napi::sys;
use napi_derive::napi;
use serde::{Deserialize, Serialize};

/// An unread child: its kind, its tree-sitter descendant index (`goto_descendant` reaches it)
/// and its byte span. This is the laziness: a one-level read leaves every child with structure
/// as one of these.
#[napi(object)]
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Coord {
    #[napi(js_name = "$type")]
    #[serde(rename = "$type")]
    pub kind: u16,
    #[napi(js_name = "$row")]
    #[serde(rename = "$row")]
    pub row: u32,
    #[napi(js_name = "$start")]
    #[serde(rename = "$start")]
    pub start: u32,
    #[napi(js_name = "$end")]
    #[serde(rename = "$end")]
    pub end: u32,
}

/// A named child with no children of its own, read inline with its text.
#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Leaf {
    #[napi(js_name = "$type")]
    #[serde(rename = "$type")]
    pub kind: u16,
    #[napi(js_name = "$text")]
    #[serde(rename = "$text")]
    pub text: String,
    #[napi(js_name = "$start")]
    #[serde(rename = "$start")]
    pub start: u32,
    #[napi(js_name = "$end")]
    #[serde(rename = "$end")]
    pub end: u32,
}

/// What a slot holds: a coordinate, an inline leaf, an anonymous token stored as its kind id
/// (kind-enum storage), or nothing.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Slot {
    Coord(Coord),
    Leaf(Leaf),
    Kind(u16),
    Absent,
}

impl ToNapiValue for Slot {
    unsafe fn to_napi_value(env: sys::napi_env, val: Self) -> napi::Result<sys::napi_value> {
        match val {
            Slot::Coord(c) => Coord::to_napi_value(env, c),
            Slot::Leaf(l) => Leaf::to_napi_value(env, l),
            Slot::Kind(k) => u32::to_napi_value(env, k as u32),
            Slot::Absent => Null::to_napi_value(env, Null),
        }
    }
}

impl FromNapiValue for Slot {
    unsafe fn from_napi_value(env: sys::napi_env, val: sys::napi_value) -> napi::Result<Self> {
        let mut t = 0;
        sys::napi_typeof(env, val, &mut t);
        match t {
            sys::ValueType::napi_number => Ok(Slot::Kind(u32::from_napi_value(env, val)? as u16)),
            sys::ValueType::napi_object => {
                let mut has = false;
                sys::napi_has_named_property(env, val, c"$row".as_ptr(), &mut has);
                if has {
                    Ok(Slot::Coord(Coord::from_napi_value(env, val)?))
                } else {
                    Ok(Slot::Leaf(Leaf::from_napi_value(env, val)?))
                }
            }
            _ => Ok(Slot::Absent),
        }
    }
}

/// One slot's route as the attributes name it.
pub struct RouteSpec {
    pub field: Option<&'static str>,
    pub kinds: &'static [&'static str],
    pub tokens: &'static [&'static str],
}

struct Route {
    field: Option<u16>,
    kinds: Vec<u16>,
}

/// A kind's routes resolved against the parser: a child tagged with a field goes by its field;
/// a child with no field goes by its kind. A layout token is the kind's own and no slot takes it.
/// In production the attributes carry the ids.
pub struct Routes {
    routes: Vec<Route>,
    layout: Vec<u16>,
}

/// A child no route takes and that is not a layout token: the model has no slot for it, so the
/// read of its parent fails.
#[derive(Debug, Clone, Copy)]
pub struct Refusal {
    pub parent: u16,
    pub child: u16,
    pub row: u32,
}

impl Routes {
    pub fn new(lang: &tree_sitter::Language, specs: &[RouteSpec], layout: &[&str]) -> Self {
        let routes = specs
            .iter()
            .map(|sp| Route {
                field: sp.field.and_then(|f| lang.field_id_for_name(f)).map(|f| f.get()),
                kinds: sp
                    .kinds
                    .iter()
                    .map(|k| lang.id_for_node_kind(k, true))
                    .chain(sp.tokens.iter().map(|k| lang.id_for_node_kind(k, false)))
                    .filter(|&id| id != 0)
                    .collect(),
            })
            .collect();
        let layout = layout.iter().map(|t| lang.id_for_node_kind(t, false)).filter(|&id| id != 0).collect();
        Routes { routes, layout }
    }

    #[inline]
    pub fn slot_of(&self, field: Option<u16>, kind: u16) -> Option<usize> {
        self.routes.iter().position(|r| match (field, r.field) {
            (Some(f), Some(rf)) => f == rf,
            (None, _) => r.kinds.contains(&kind),
            _ => false,
        })
    }

    #[inline]
    pub fn is_layout(&self, kind: u16) -> bool {
        self.layout.contains(&kind)
    }
}

#[inline]
pub fn coord_at(cur: &tree_sitter::TreeCursor<'_>) -> Coord {
    let n = cur.node();
    Coord { kind: n.kind_id(), row: cur.descendant_index() as u32, start: n.start_byte() as u32, end: n.end_byte() as u32 }
}

/// The child under the cursor, as a one-level read stores it.
#[inline]
pub fn slot_at(cur: &tree_sitter::TreeCursor<'_>, src: &[u8]) -> Slot {
    let n = cur.node();
    if !n.is_named() {
        return Slot::Kind(n.kind_id());
    }
    if n.child_count() == 0 {
        let (s, e) = (n.start_byte(), n.end_byte());
        return Slot::Leaf(Leaf {
            kind: n.kind_id(),
            text: String::from_utf8_lossy(&src[s..e]).into_owned(),
            start: s as u32,
            end: e as u32,
        });
    }
    Slot::Coord(coord_at(cur))
}

pub trait ReadNode: Sized {
    const KIND: &'static str;
    const LAYOUT: &'static [&'static str];
    const KEYS: &'static [&'static str];
    fn route_specs() -> &'static [RouteSpec];
    fn read(cur: &mut tree_sitter::TreeCursor<'_>, src: &[u8], routes: &Routes) -> Result<Self, Refusal>;
}

/// The arena: fixed-width records of `u32` words, and the UTF-8 text of inline leaves.
/// A slot is five words: tag (0 absent, 1 coordinate, 2 leaf, 3 kind) and four payload words.
/// A list or the trivia is two words, offset and length, into elements of five words each.
#[derive(Default)]
pub struct Arena {
    pub words: Vec<u32>,
    pub text: Vec<u8>,
}

impl Arena {
    fn encode(&mut self, s: &Slot) -> [u32; 5] {
        match s {
            Slot::Absent => [0; 5],
            Slot::Coord(c) => [1, c.kind as u32, c.row, c.start, c.end],
            Slot::Leaf(l) => {
                let off = self.text.len() as u32;
                self.text.extend_from_slice(l.text.as_bytes());
                [2, l.kind as u32, l.start, l.end, off]
            }
            Slot::Kind(k) => [3, *k as u32, 0, 0, 0],
        }
    }
    pub fn put_slot(&mut self, at: usize, s: &Slot) {
        let w = self.encode(s);
        self.words[at..at + 5].copy_from_slice(&w);
    }
    pub fn put_opt(&mut self, at: usize, s: Option<&Slot>) {
        if let Some(s) = s {
            self.put_slot(at, s);
        }
    }
    pub fn put_list(&mut self, at: usize, list: &[Slot]) {
        let off = self.words.len() as u32;
        for s in list {
            let w = self.encode(s);
            self.words.extend_from_slice(&w);
        }
        self.words[at] = off;
        self.words[at + 1] = list.len() as u32;
    }
    pub fn put_coords(&mut self, at: usize, list: &[Coord]) {
        let off = self.words.len() as u32;
        for c in list {
            self.words.extend_from_slice(&[1, c.kind as u32, c.row, c.start, c.end]);
        }
        self.words[at] = off;
        self.words[at + 1] = list.len() as u32;
    }
}

pub struct ArenaRef<'a> {
    pub words: &'a [u32],
    pub text: &'a [u8],
}

impl ArenaRef<'_> {
    fn decode(&self, w: &[u32]) -> Slot {
        match w[0] {
            1 => Slot::Coord(Coord { kind: w[1] as u16, row: w[2], start: w[3], end: w[4] }),
            2 => {
                let (off, len) = (w[4] as usize, (w[3] - w[2]) as usize);
                Slot::Leaf(Leaf {
                    kind: w[1] as u16,
                    text: String::from_utf8_lossy(&self.text[off..off + len]).into_owned(),
                    start: w[2],
                    end: w[3],
                })
            }
            3 => Slot::Kind(w[1] as u16),
            _ => Slot::Absent,
        }
    }
    pub fn slot(&self, at: usize) -> Slot {
        self.decode(&self.words[at..at + 5])
    }
    pub fn opt(&self, at: usize) -> Option<Slot> {
        match self.words[at] {
            0 => None,
            _ => Some(self.slot(at)),
        }
    }
    pub fn list(&self, at: usize) -> Vec<Slot> {
        let (off, len) = (self.words[at] as usize, self.words[at + 1] as usize);
        (0..len).map(|i| self.decode(&self.words[off + 5 * i..off + 5 * i + 5])).collect()
    }
    pub fn coords(&self, at: usize) -> Vec<Coord> {
        let (off, len) = (self.words[at] as usize, self.words[at + 1] as usize);
        (0..len)
            .map(|i| {
                let w = &self.words[off + 5 * i..off + 5 * i + 5];
                Coord { kind: w[1] as u16, row: w[2], start: w[3], end: w[4] }
            })
            .collect()
    }
}

pub trait Words: Sized {
    const WIDTH: u32;
    fn write_words(&self, a: &mut Arena) -> u32;
    fn read_words(a: &ArenaRef<'_>, off: u32) -> Self;
}
