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

id_newtype! {
    /// A node's name where its records outlive its tree: the address of
    /// its record in its engine's built arena.
    NodeId(u32)
}

/// A node's name past a call, where its records outlive its tree: its own
/// record `node`, or, with a `site`, the node with no record of its own
/// that the record `node` keeps in a slot: the word the slot's cell starts
/// at and, in a list slot, the item. On the wire, `{ $node, $site? }`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde::Serialize, serde::Deserialize)]
pub struct NodeName {
    #[serde(rename = "$node")]
    pub node: NodeId,
    #[serde(rename = "$site", default, skip_serializing_if = "Option::is_none")]
    pub site: Option<[u32; 2]>,
}

impl NodeName {
    /// The bits of a key that hold a site's word, and those that hold its
    /// item above them. A record's address takes 30 bits, so with these a
    /// key is a whole number a double holds exactly.
    const WORD_BITS: u32 = 7;
    /// One past the widest record a site's word can name a cell of.
    pub const SITE_WORDS: u32 = 1 << Self::WORD_BITS;
    const ITEM_BITS: u32 = 16;
    const NODE_BITS: u32 = 30;

    /// The name's site as one word, its item above its word; 0 for a name
    /// with no site, since a cell starts past its record's header.
    #[must_use]
    pub fn packed_site(self) -> u32 {
        self.site.map_or(0, |[word, item]| (item << Self::WORD_BITS) | word)
    }

    /// The site `packed` spells (`packed_site`).
    #[must_use]
    pub fn site_of(packed: u32) -> Option<[u32; 2]> {
        (packed != 0).then_some([packed & ((1 << Self::WORD_BITS) - 1), packed >> Self::WORD_BITS])
    }

    /// The name as one number, which JavaScript keys a node by: a record's
    /// address, or, with a site, a negative number its record's address
    /// and its packed site make; none for a name past what a key holds.
    #[must_use]
    pub fn key(self) -> Option<f64> {
        let Some([word, item]) = self.site else { return Some(f64::from(self.node.0)) };
        if word == 0 || word >> Self::WORD_BITS != 0 || item >> Self::ITEM_BITS != 0 || self.node.0 >> Self::NODE_BITS != 0 {
            return None;
        }
        let packed = (u64::from(self.node.0) << (Self::ITEM_BITS + Self::WORD_BITS)) | u64::from(self.packed_site());
        #[allow(clippy::cast_precision_loss, reason = "the three fields take 53 bits, which a double holds exactly")]
        Some(-(packed as f64))
    }

    /// The name `key` spells (`key`); none for a number that is no key.
    #[must_use]
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss, clippy::cast_precision_loss, reason = "each value is checked whole and in range before it is narrowed, and the bound is a power of two")]
    pub fn from_key(key: f64) -> Option<Self> {
        if key.fract() != 0.0 {
            return None;
        }
        if key >= 0.0 {
            return (key <= f64::from(u32::MAX)).then_some(Self { node: NodeId(key as u32), site: None });
        }
        if -key >= (1u64 << (Self::NODE_BITS + Self::ITEM_BITS + Self::WORD_BITS)) as f64 {
            return None;
        }
        let packed = (-key) as u64;
        let site = Self::site_of((packed & ((1 << (Self::ITEM_BITS + Self::WORD_BITS)) - 1)) as u32)?;
        (site[0] != 0).then_some(Self { node: NodeId((packed >> (Self::ITEM_BITS + Self::WORD_BITS)) as u32), site: Some(site) })
    }
}

#[cfg(test)]
mod name_tests {
    use super::{NodeId, NodeName};

    #[test]
    fn a_name_and_its_key_are_found_from_each_other() {
        let names = [
            NodeName { node: NodeId(0), site: None },
            NodeName { node: NodeId(u32::MAX), site: None },
            NodeName { node: NodeId(32_768), site: Some([2, 0]) },
            NodeName { node: NodeId((1 << 30) - 1), site: Some([127, 65_535]) },
        ];
        for name in names {
            let key = name.key().expect("a key");
            assert_eq!(key.fract(), 0.0);
            assert!(key.abs() <= 9_007_199_254_740_991.0, "{key} is a whole number a double holds");
            assert_eq!(NodeName::from_key(key), Some(name));
        }
        let mut keys: Vec<f64> = names.iter().filter_map(|name| name.key()).collect();
        keys.dedup();
        assert_eq!(keys.len(), names.len());
    }

    #[test]
    fn a_site_past_what_a_key_holds_has_none() {
        for site in [[128, 0], [2, 65_536], [0, 0]] {
            assert_eq!(NodeName { node: NodeId(32_768), site: Some(site) }.key(), None, "{site:?}");
        }
        assert_eq!(NodeName { node: NodeId(1 << 30), site: Some([2, 0]) }.key(), None);
        assert_eq!(NodeName::from_key(-0.5), None);
        assert_eq!(NodeName::from_key(-(2f64.powi(53))), None);
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
