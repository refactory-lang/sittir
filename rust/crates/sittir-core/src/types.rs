//! The values every crate shares: the numeric kind discriminant (`KindId`)
//! and parser field id, a node's provenance (`Source`), and its byte span.
//!
//! `Span` is intentionally narrow (`{start, end}` bytes) rather than
//! re-using `tree_sitter::Range` — row/column info never crosses the
//! boundary and would be serialized dead weight on every hop.

use crate::tree_sitter;
use crate::heap::HeapBytes;
use serde::{Deserialize, Serialize};

/// A byte offset, descendant index or count that tree-sitter produced, or
/// that lies within a source it parsed, or the length of a table with at most
/// one entry per node of a parsed tree, as the `u32` sittir stores it.
/// tree-sitter keeps every offset, index and count as `uint32_t`, so the
/// value always fits.
#[allow(clippy::cast_possible_truncation, reason = "tree-sitter keeps offsets, indices and counts as uint32_t, which bounds every value narrowed here")]
#[must_use]
pub const fn narrow(n: usize) -> u32 {
    n as u32
}

/// Why a JavaScript number is not a whole number a double counts exactly.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NotWhole {
    NotFinite,
    Negative,
    Fraction,
    BeyondExact,
}

/// The largest integer a double counts exactly, `2^53 - 1`.
pub const MAX_EXACT: f64 = 9_007_199_254_740_991.0;

/// A JavaScript number read as the whole number it holds, or why it holds
/// none. Rust's `as` saturates, reading `NaN` and any negative as 0, so every
/// number that crosses in as an integer is checked here first.
pub fn exact_whole(value: f64) -> Result<u64, NotWhole> {
    if !value.is_finite() {
        return Err(NotWhole::NotFinite);
    }
    if value < 0.0 {
        return Err(NotWhole::Negative);
    }
    if value.fract() != 0.0 {
        return Err(NotWhole::Fraction);
    }
    if value > MAX_EXACT {
        return Err(NotWhole::BeyondExact);
    }
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss, reason = "checked above: a whole number in 0..=2^53 - 1, which u64 holds exactly")]
    let whole = value as u64;
    Ok(whole)
}

/// Declares a numeric id of one domain: a transparent newtype over its
/// width, so ids of two domains never pass for each other. It crosses serde
/// and the napi boundary as a plain number, and `index` is the one widening
/// to `usize` for a table the id keys. `as $wire` writes it to JavaScript as
/// that type instead of its width, for an id napi has no writer for.
macro_rules! id_newtype {
    ($(#[$meta:meta])* $name:ident($repr:ty)) => {
        id_newtype!(@common $(#[$meta])* $name($repr));

        impl $name {
            /// The id as an index into a table it keys.
            pub const fn index(self) -> usize {
                self.0 as usize
            }
        }

        #[cfg(feature = "napi-bindings")]
        impl napi::bindgen_prelude::ToNapiValue for $name {
            unsafe fn to_napi_value(env: napi::sys::napi_env, val: Self) -> napi::Result<napi::sys::napi_value> {
                // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
                unsafe { <$repr as napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, val.0) }
            }
        }
    };
    ($(#[$meta:meta])* $name:ident($repr:ty) as $wire:ty) => {
        id_newtype!(@common $(#[$meta])* $name($repr));

        #[cfg(feature = "napi-bindings")]
        impl napi::bindgen_prelude::ToNapiValue for $name {
            unsafe fn to_napi_value(env: napi::sys::napi_env, val: Self) -> napi::Result<napi::sys::napi_value> {
                #[allow(clippy::cast_precision_loss, reason = "only `TreeHandle` crosses as `as $wire`, and its packed tree id and node index stay below 2^53, which a double holds exactly")]
                let wire = val.0 as $wire;
                // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
                unsafe { <$wire as napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, wire) }
            }
        }
    };
    (@common $(#[$meta:meta])* $name:ident($repr:ty)) => {
        $(#[$meta])*
        #[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, ::serde::Serialize, ::serde::Deserialize)]
        #[serde(transparent)]
        #[repr(transparent)]
        pub struct $name(pub $repr);

        impl $name {
            pub const fn new(id: $repr) -> Self {
                Self(id)
            }
            pub const fn get(self) -> $repr {
                self.0
            }
        }

        impl $crate::heap::HeapBytes for $name {
            fn heap_bytes(&self) -> usize {
                0
            }
        }

        impl ::std::fmt::Display for $name {
            fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {
                ::std::fmt::Display::fmt(&self.0, f)
            }
        }

        impl From<$repr> for $name {
            fn from(id: $repr) -> Self {
                Self(id)
            }
        }

        impl From<$name> for $repr {
            fn from(id: $name) -> $repr {
                id.0
            }
        }

        /// Read as a double and checked whole and in range: napi's integer
        /// readers wrap a negative, truncate a fraction and read `NaN` as 0.
        #[cfg(feature = "napi-bindings")]
        impl napi::bindgen_prelude::FromNapiValue for $name {
            unsafe fn from_napi_value(env: napi::sys::napi_env, val: napi::sys::napi_value) -> napi::Result<Self> {
                // SAFETY: napi calls `from_napi_value` with `val` live in `env`.
                let value = unsafe { <f64 as napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, val) }?;
                crate::napi_engine::checked_whole::<$repr>(value, stringify!($name)).map(Self)
            }
        }

        #[cfg(feature = "napi-bindings")]
        impl napi::bindgen_prelude::ValidateNapiValue for $name {}

        #[cfg(feature = "napi-bindings")]
        impl napi::bindgen_prelude::TypeName for $name {
            fn type_name() -> &'static str {
                "number"
            }
            fn value_type() -> napi::ValueType {
                napi::ValueType::Number
            }
        }
    };
}

id_newtype! {
    /// A kind id: the parser's symbol for a node or token kind, the `$type`
    /// a node carries. u16 is tree-sitter's own `TSSymbol` width.
    KindId(u16)
}

impl KindId {
    /// tree-sitter's builtin ERROR symbol (`ts_builtin_sym_error`): the kind
    /// of the node error recovery wraps unparsable source in. It is issued by
    /// tree-sitter itself, not by any grammar, so every grammar shares it.
    pub const ERROR: KindId = KindId(u16::MAX);

    /// The blank kind: no node. An optional choice site's empty arm, and the
    /// arm a spacing site writes nothing for.
    pub const BLANK: KindId = KindId(0);
}

impl Default for KindId {
    fn default() -> Self {
        Self::BLANK
    }
}

id_newtype! {
    /// A parser field id: the index of a field name in `parser.c`'s field
    /// table, the value `TreeCursor::field_id` returns for a child tagged with it.
    FieldId(u16)
}

id_newtype! {
    /// A spacing site: the index of a gap's whitespace choice in the
    /// generated site order, keying `ResolvedOptions::spacing` and `sites`.
    SiteId(u16)
}

id_newtype! {
    /// A flank site: the index of a list flank's delimiter bitflag in the
    /// generated flank order, keying `ResolvedOptions::delimiter`.
    FlankId(u16)
}

id_newtype! {
    /// A row of `ResolvedOptions::edges`: the edge seams one kind owns.
    EdgeRow(u16)
}

id_newtype! {
    /// A kind's slot: the slot field's position among the kind's node
    /// slots, the number a read routes a child to.
    SlotId(u16)
}

id_newtype! {
    /// A parsed tree's id in the process-wide tree table: every handle and
    /// coordinate names its tree by it.
    TreeId(u32)
}

/// A node's name in arena storage: a record's address, or, for a node with
/// no record of its own, the address of the record that holds it with the
/// site of its cell there: the word the slot's cell starts at and, in a
/// list slot, the item. A holder's id and its sites' ids lie between it and
/// the next record's, so a holder's sides and those of the nodes at its
/// sites are one range of ids. The JavaScript side keys a node by the one
/// number the id packs to (`key`); on the wire it is `{ $node, $site? }`.
#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, serde::Serialize, serde::Deserialize)]
#[serde(into = "NodeIdWire", try_from = "NodeIdWire")]
pub struct NodeId(u64);

#[derive(serde::Serialize, serde::Deserialize)]
struct NodeIdWire {
    #[serde(rename = "$node")]
    node: u32,
    #[serde(rename = "$site", default, skip_serializing_if = "Option::is_none")]
    site: Option<[u32; 2]>,
}

impl NodeId {
    /// The bits of a leaf's id that hold its site's word, lowest; those
    /// that hold its item above them; and those that hold its holder's
    /// address above both: 53 bits, so a key is a whole number a double
    /// holds exactly. The record codec exports the three, and the
    /// JavaScript side reads them from there.
    ///
    /// The word is the one a slot's cell starts at in its holder's parsed
    /// record: words 1 to 31, 0 being an id with no site (a record's header
    /// takes word 0, so no cell starts there). A record is therefore at most
    /// `SITE_WORDS`, 32 words, header included, and each generated kind
    /// asserts so (`refuse_wider_record`). The item is the slot's item, 0
    /// for a slot that holds one value: items 0 to 262,143, so a list slot
    /// names at most `SITE_ITEMS`, 262,144, leaf items, and a read or build
    /// of a list holding a leaf past that is refused
    /// (`ArenaError::LeafItemPastNames`).
    pub const WORD_BITS: u32 = 5;
    pub const ITEM_BITS: u32 = 18;
    pub const HOLDER_BITS: u32 = 30;
    /// The most words a record takes, header included: one past the last
    /// word a site names.
    pub const SITE_WORDS: u32 = 1 << Self::WORD_BITS;
    /// The most leaf items a list slot holds: one past the last item a
    /// site names.
    pub const SITE_ITEMS: u32 = 1 << Self::ITEM_BITS;
    const SITE_BITS: u32 = Self::ITEM_BITS + Self::WORD_BITS;

    /// The record at the address `at`.
    #[must_use]
    pub const fn record(at: u32) -> Self {
        Self((at as u64) << Self::SITE_BITS)
    }

    /// The node with no record of its own that the record at `holder` holds
    /// in the cell at `word`, item `item`.
    ///
    /// # Panics
    ///
    /// For word 0, which no cell starts at, and for a holder, word or item
    /// past its bits, which the reads and builds that make a site refuse
    /// before they name it.
    #[must_use]
    pub const fn leaf(holder: u32, word: u32, item: u32) -> Self {
        match Self::try_leaf(holder, word, item) {
            Some(id) => id,
            None => panic!("a site past what a node's id holds"),
        }
    }

    /// The node `leaf` names; none for word 0 and for a holder, word or
    /// item past its bits.
    #[must_use]
    pub const fn try_leaf(holder: u32, word: u32, item: u32) -> Option<Self> {
        if word == 0 || word >> Self::WORD_BITS != 0 || item >> Self::ITEM_BITS != 0 || holder >> Self::HOLDER_BITS != 0 {
            return None;
        }
        Some(Self(((holder as u64) << Self::SITE_BITS) | ((item as u64) << Self::WORD_BITS) | word as u64))
    }

    /// The address of the record this id names, or of the record that
    /// holds the node it names.
    #[must_use]
    #[allow(clippy::cast_possible_truncation, reason = "an id holds a 32-bit address above its site bits")]
    pub const fn address(self) -> u32 {
        (self.0 >> Self::SITE_BITS) as u32
    }

    /// The address of the record this id names; none for a node with no
    /// record of its own.
    #[must_use]
    pub const fn as_record(self) -> Option<u32> {
        match self.site() {
            None => Some(self.address()),
            Some(_) => None,
        }
    }

    /// The site, `[word, item]`, of the node this id names in its holder;
    /// none for a record.
    #[must_use]
    #[allow(clippy::cast_possible_truncation, reason = "each field is masked to its bits first")]
    pub const fn site(self) -> Option<[u32; 2]> {
        let word = (self.0 & ((1 << Self::WORD_BITS) - 1)) as u32;
        if word == 0 {
            return None;
        }
        Some([word, ((self.0 >> Self::WORD_BITS) & ((1 << Self::ITEM_BITS) - 1)) as u32])
    }

    /// Refuses, when a constant is evaluated, a kind whose record takes
    /// `words` words, header included, past `SITE_WORDS`: the build stops
    /// with `refusal`, which names the kind and its width.
    ///
    /// ```
    /// const _: () = sittir_core::types::NodeId::refuse_wider_record(32, "a record of 32 words fits");
    /// ```
    ///
    /// ```compile_fail,E0080
    /// const _: () = sittir_core::types::NodeId::refuse_wider_record(33, "kind `wide` has a record of 33 words");
    /// ```
    ///
    /// # Panics
    ///
    /// For `words` past `SITE_WORDS`, with `refusal`.
    pub const fn refuse_wider_record(words: u32, refusal: &'static str) {
        assert!(words <= Self::SITE_WORDS, "{}", refusal);
    }

    /// The id's site as one word, its item above its word; 0 for a record,
    /// since a cell starts past its record's header.
    #[must_use]
    #[allow(clippy::cast_possible_truncation, reason = "the site bits are masked first")]
    pub const fn packed_site(self) -> u32 {
        (self.0 & ((1 << Self::SITE_BITS) - 1)) as u32
    }

    /// The id of the record at `at`, or, with a `packed` site
    /// (`packed_site`), of the node it holds there; none for a site past
    /// what an id holds.
    #[must_use]
    pub const fn of_packed(at: u32, packed: u32) -> Option<Self> {
        if packed == 0 {
            return Some(Self::record(at));
        }
        Self::try_leaf(at, packed & ((1 << Self::WORD_BITS) - 1), packed >> Self::WORD_BITS)
    }

    /// The id as one number, which JavaScript keys a node by: a record's
    /// address, or, for a leaf, the negative of its 53 packed bits.
    #[must_use]
    #[allow(clippy::cast_precision_loss, reason = "a leaf's id takes 53 bits, which a double holds exactly")]
    pub fn key(self) -> f64 {
        match self.site() {
            None => f64::from(self.address()),
            Some(_) => -(self.0 as f64),
        }
    }

    /// The id `key` spells (`key`); none for a number that is no key.
    #[must_use]
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss, clippy::cast_precision_loss, reason = "each value is checked whole and in range before it is narrowed, and the bound is a power of two")]
    pub fn from_key(key: f64) -> Option<Self> {
        if key.fract() != 0.0 {
            return None;
        }
        if key >= 0.0 {
            return (key <= f64::from(u32::MAX)).then_some(Self::record(key as u32));
        }
        if -key >= (1u64 << (Self::HOLDER_BITS + Self::SITE_BITS)) as f64 {
            return None;
        }
        let packed = (-key) as u64;
        Self::of_packed((packed >> Self::SITE_BITS) as u32, (packed & ((1 << Self::SITE_BITS) - 1)) as u32).filter(|id| id.site().is_some())
    }
}

impl std::fmt::Debug for NodeId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self.site() {
            None => write!(f, "NodeId({})", self.address()),
            Some([word, item]) => write!(f, "NodeId({}, [{word}, {item}])", self.address()),
        }
    }
}

impl From<NodeId> for NodeIdWire {
    fn from(id: NodeId) -> Self {
        Self { node: id.address(), site: id.site() }
    }
}

impl TryFrom<NodeIdWire> for NodeId {
    type Error = String;

    fn try_from(NodeIdWire { node, site }: NodeIdWire) -> Result<Self, Self::Error> {
        match site {
            None => Ok(Self::record(node)),
            Some([word, item]) => Self::try_leaf(node, word, item).ok_or_else(|| format!("the site [{word}, {item}] in the record at {node} is past what a node's id holds")),
        }
    }
}

#[cfg(test)]
mod name_tests {
    use super::NodeId;

    #[test]
    fn an_id_and_its_key_are_found_from_each_other() {
        let ids = [NodeId::record(0), NodeId::record(u32::MAX), NodeId::leaf(32_768, 2, 0), NodeId::leaf((1 << 30) - 1, 31, 262_143)];
        for id in ids {
            let key = id.key();
            assert_eq!(key.fract(), 0.0);
            assert!(key.abs() <= 9_007_199_254_740_991.0, "{key} is a whole number a double holds");
            assert_eq!(NodeId::from_key(key), Some(id));
        }
        let mut keys: Vec<f64> = ids.iter().map(|id| id.key()).collect();
        keys.dedup();
        assert_eq!(keys.len(), ids.len());
    }

    #[test]
    fn a_number_that_is_no_key_names_no_node() {
        assert_eq!(NodeId::from_key(-0.5), None);
        assert_eq!(NodeId::from_key(-(2f64.powi(53))), None);
        assert_eq!(NodeId::from_key(f64::from(u32::MAX) + 1.0), None);
        assert_eq!(NodeId::from_key(-f64::from(1u32 << 23)), None, "a site of word 0 names no cell");
    }

    #[test]
    #[should_panic(expected = "past what a node's id holds")]
    fn a_leaf_at_an_item_past_the_bits_has_no_id() {
        let _ = NodeId::leaf(32_768, 2, 262_144);
    }

    #[test]
    #[should_panic(expected = "past what a node's id holds")]
    fn a_leaf_at_a_word_past_the_bits_has_no_id() {
        let _ = NodeId::leaf(32_768, 32, 0);
    }

    #[test]
    #[should_panic(expected = "past what a node's id holds")]
    fn a_leaf_of_a_holder_past_the_bits_has_no_id() {
        let _ = NodeId::leaf(1 << 30, 2, 0);
    }

    #[test]
    fn a_leaf_id_gives_its_holder_30_bits_its_item_18_and_its_word_5() {
        assert_eq!((NodeId::HOLDER_BITS, NodeId::ITEM_BITS, NodeId::WORD_BITS), (30, 18, 5));
        assert_eq!(NodeId::SITE_WORDS, 32);
        assert_eq!(NodeId::SITE_ITEMS, 262_144);
        assert_eq!(NodeId::leaf(1, 3, 2).key(), -f64::from((1 << 23) | (2 << 5) | 3));
        assert_eq!(NodeId::record(7).key(), 7.0);
    }

    #[test]
    fn an_id_names_its_record_or_its_holder_and_site() {
        assert_eq!((NodeId::record(9).address(), NodeId::record(9).site()), (9, None));
        assert_eq!((NodeId::leaf(9, 4, 6).address(), NodeId::leaf(9, 4, 6).site()), (9, Some([4, 6])));
    }

    #[test]
    fn a_holder_s_id_and_its_sites_ids_lie_between_it_and_the_next_record_s() {
        let (holder, next) = (NodeId::record(9), NodeId::record(10));
        for site in [NodeId::leaf(9, 1, 0), NodeId::leaf(9, 2, 0), NodeId::leaf(9, 31, 262_143)] {
            assert!(holder < site && site < next, "{site:?}");
        }
    }

    #[test]
    fn the_wire_spells_an_id_as_its_node_and_its_site() {
        for (id, wire) in [(NodeId::record(5), r#"{"$node":5}"#), (NodeId::leaf(5, 2, 3), r#"{"$node":5,"$site":[2,3]}"#)] {
            assert_eq!(serde_json::to_string(&id).expect("written"), wire);
            assert_eq!(serde_json::from_str::<NodeId>(wire).expect("read"), id);
        }
        for refused in [r#"{"$node":5,"$site":[0,0]}"#, r#"{"$node":5,"$site":[32,0]}"#, r#"{"$node":5,"$site":[2,262144]}"#] {
            assert!(serde_json::from_str::<NodeId>(refused).is_err(), "{refused}");
        }
    }
}

id_newtype! {
    /// A node of a tree: its position in the tree's preorder, the
    /// `TreeCursor::descendant_index` of the node from the root.
    NodeIndex(u32)
}

impl NodeIndex {
    /// The tree's root.
    pub const ROOT: NodeIndex = NodeIndex(0);

    /// How many preorder positions `self` lies past `base`.
    #[must_use]
    pub const fn offset_from(self, base: NodeIndex) -> u32 {
        self.0 - base.0
    }
}

/// The node `count` preorder positions past this one.
impl ::std::ops::Add<u32> for NodeIndex {
    type Output = NodeIndex;
    fn add(self, count: u32) -> NodeIndex {
        NodeIndex(self.0 + count)
    }
}

id_newtype! {
    /// A list flank's delimiters, as a set: whether the list writes its
    /// separator before its first item (`LEADING`) and after its last
    /// (`TRAILING`). The empty set leaves the option unset.
    Delimiter(u8)
}

impl Delimiter {
    pub const NONE: Self = Self(0);
    pub const LEADING: Self = Self(1);
    pub const TRAILING: Self = Self(1 << 1);

    /// Whether the set holds any delimiter of `other`.
    #[must_use]
    pub const fn has(self, other: Self) -> bool {
        self.0 & other.0 != 0
    }

    /// The set with `other`'s delimiters added.
    #[must_use]
    pub const fn with(self, other: Self) -> Self {
        Self(self.0 | other.0)
    }

    /// The set with `other`'s delimiters removed.
    #[must_use]
    pub const fn without(self, other: Self) -> Self {
        Self(self.0 & !other.0)
    }

    /// Whether every delimiter of the set is one `allowed` holds.
    #[must_use]
    pub const fn within(self, allowed: Self) -> bool {
        self.0 & !allowed.0 == 0
    }
}

id_newtype! {
    /// A node of a live tree as JavaScript holds it: its tree and its node
    /// index in one number (`engine::encode_handle`), below 2^53 so a double
    /// carries it exactly.
    TreeHandle(u64) as f64
}

id_newtype! {
    /// A child's position among its parent's children, every child counted:
    /// what `Node::child` takes.
    ChildPosition(u32)
}

id_newtype! {
    /// An item's position among a slot's items.
    ItemIndex(u32)
}

id_newtype! {
    /// A run of whitespace a side takes: its place among the runs its tree's
    /// trivia placement has placed, in the order it placed them
    /// (`Placement::run`).
    RunId(u32)
}

/// Where a node originated. `Ts` = read from a tree-sitter tree;
/// `Factory` = constructed on the TS side.
///
/// Wire shape is a numeric u8: 0 = Ts, 2 = Factory.
/// Eliminates the napi `string_enum` `PascalCase` casing mismatch that caused
/// `value "ts" does not match any variant of enum Source` errors.
///
/// napi `FromNapiValue`/`ToNapiValue` impls (gated on napi-bindings
/// feature) read/write a JS number. The feature gate prevents napi
/// C-symbol leakage into sittir-core test binaries.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum Source {
    Ts = 0,
    Factory = 2,
}

impl Serialize for Source {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_u8(*self as u8)
    }
}

impl<'de> Deserialize<'de> for Source {
    fn deserialize<D: serde::Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        let v = u8::deserialize(d)?;
        match v {
            0 => Ok(Source::Ts),
            2 => Ok(Source::Factory),
            _ => Err(serde::de::Error::custom(format!("invalid source: {v}"))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl napi::bindgen_prelude::FromNapiValue for Source {
    unsafe fn from_napi_value(
        env: napi::sys::napi_env,
        val: napi::sys::napi_value,
    ) -> napi::Result<Self> {
        // SAFETY: napi calls `from_napi_value` with `val` live in `env`.
        let n: u8 = crate::napi_engine::checked_whole(unsafe { f64::from_napi_value(env, val) }?, "Source")?;
        match n {
            0 => Ok(Source::Ts),
            2 => Ok(Source::Factory),
            _ => Err(napi::Error::from_reason(format!("invalid source: {n}"))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl napi::bindgen_prelude::ToNapiValue for Source {
    unsafe fn to_napi_value(
        env: napi::sys::napi_env,
        val: Self,
    ) -> napi::Result<napi::sys::napi_value> {
        u32::to_napi_value(env, val as u32)
    }
}

#[cfg(feature = "napi-bindings")]
impl napi::bindgen_prelude::ValidateNapiValue for Source {}

#[cfg(feature = "napi-bindings")]
impl napi::bindgen_prelude::TypeName for Source {
    fn type_name() -> &'static str {
        "Source"
    }
    fn value_type() -> napi::ValueType {
        napi::ValueType::Number
    }
}

/// Byte-range for a node within its source string. `start`/`end`
/// are UTF-8 byte offsets (ast-grep / tree-sitter convention). It crosses
/// the boundary as `{ start, end }`, read and written by the codec below,
/// which every coordinate and gap uses.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub struct Span {
    pub start: u32,
    pub end: u32,
}

impl HeapBytes for Span {
    fn heap_bytes(&self) -> usize {
        let Self { start: _, end: _ } = self;
        0
    }
}

impl Span {
    /// The bytes `node` spans. tree-sitter keeps offsets as `uint32_t`, so
    /// the narrowing loses nothing.
    #[allow(clippy::disallowed_methods, reason = "wraps `Node::start_byte` and `Node::end_byte`, which clippy.toml disallows outside `Span::of`")]
    #[must_use]
    pub fn of(node: &tree_sitter::Node<'_>) -> Self {
        Self { start: narrow(node.start_byte()), end: narrow(node.end_byte()) }
    }

    /// The bytes of the whole of `source`, which tree-sitter parsed and so
    /// spans in `u32` offsets.
    #[must_use]
    pub fn whole(source: &str) -> Self {
        Self { start: 0, end: narrow(source.len()) }
    }

    /// The span as a range that slices its source.
    #[must_use]
    pub fn range(self) -> std::ops::Range<usize> {
        self.start as usize..self.end as usize
    }
}

#[cfg(feature = "napi-bindings")]
impl napi::bindgen_prelude::FromNapiValue for Span {
    unsafe fn from_napi_value(env: napi::sys::napi_env, napi_val: napi::sys::napi_value) -> napi::Result<Self> {
        // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
        let obj = unsafe { crate::boundary::object(env, napi_val)? };
        Ok(Self {
            // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
            start: unsafe { crate::boundary::required_whole(env, obj, c"start", "Span")? },
            // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
            end: unsafe { crate::boundary::required_whole(env, obj, c"end", "Span")? },
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl napi::bindgen_prelude::ToNapiValue for Span {
    unsafe fn to_napi_value(env: napi::sys::napi_env, val: Self) -> napi::Result<napi::sys::napi_value> {
        // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
        unsafe {
            crate::boundary::object_with(env, &[
                (c"start", u32::to_napi_value(env, val.start)?),
                (c"end", u32::to_napi_value(env, val.end)?),
            ])
        }
    }
}
