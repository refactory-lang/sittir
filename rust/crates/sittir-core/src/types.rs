//! Primitive `NodeData` + `FieldValue` + `Span` + `Source` + `Edit` +
//! `KindId` — the de-hoisted boundary shape that crosses JS↔Rust, plus
//! the numeric kind discriminant for the KindID runtime migration. See
//! data-model.md §1 for the authoritative contract.
//!
//! Spec 012 tasks T009 + T010. Serde rename + skip-if-none invariants
//! tested in `tests/boundary_roundtrip.rs` (T011).
//! `KindId` serde/conversion tests in `tests/kind_id.rs`.
//!
//! Invariants (enforced by struct + serde helpers):
//! - `$type`, `$source`, `$named` are required on the wire.
//! - Named slots serialize as top-level `_<slot>` keys.
//! - `$other`, `$text`, `$span`, `$nodeHandle`, `$childIndex`
//!   are elided when `None` (`serde skip_serializing_if`).
//! - No other top-level `$`-prefixed keys are emitted — enrichment
//!   fields (`$variant`, `$raw`, supertype labels) live on the TS side.
//! - `$text` appears only on leaves (no children, no named fields).
//! - Field values in de-hoisted slots:
//!   - `Single` for 1-arity fields,
//!   - `Multiple` for repeat fields,
//!   - `Text` for inline literal positions (anonymous tokens captured
//!     as field values).
//!
//! `Span` is intentionally narrow (`{start, end}` bytes) rather than
//! re-using `tree_sitter::Range` — row/column info never crosses the
//! boundary and would be serialized dead weight on every hop
//! (Constitution Principle X exception, documented in data-model.md §1).

#[cfg(feature = "napi-bindings")]
use napi_derive::napi;
use serde::{de::{SeqAccess, Visitor}, ser::{SerializeMap, SerializeSeq}, Deserialize, Deserializer, Serialize, Serializer};
use std::collections::HashMap;
use std::fmt;

/// Numeric runtime kind discriminant. The wire shape (`$type` on
/// `AnyTransport` JSON) uses this directly. Per the KindID runtime
/// migration design (2026-04-30): u16 is wide enough for any
/// tree-sitter grammar's parser symbol space (rust grammar ≈ 411
/// symbols, well under u16 max = 65535).
///
/// `KindId` is a transparent newtype so `serde` decodes JSON numeric
/// `$type` directly into it without an enum variant table — per-
/// grammar `AnyTransport` enums dispatch on the inner u16.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, ::serde::Serialize, ::serde::Deserialize)]
#[serde(transparent)]
#[repr(transparent)]
pub struct KindId(pub u16);

impl KindId {
    pub const fn new(id: u16) -> Self {
        Self(id)
    }
    pub const fn get(self) -> u16 {
        self.0
    }
}

impl ::std::fmt::Display for KindId {
    fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {
        ::std::fmt::Display::fmt(&self.0, f)
    }
}

impl From<u16> for KindId {
    fn from(id: u16) -> Self {
        Self(id)
    }
}

impl From<KindId> for u16 {
    fn from(id: KindId) -> u16 {
        id.0
    }
}

/// Leading / trailing trivia (comments) for a `NodeData`. Attached by
/// `$trivia()` on the TS side; carried across the wire for native
/// render support. Mirrors `NodeTrivia` in `@sittir/types`.
///
/// Each entry is a fully-formed `NodeData` (e.g. a `line_comment` or
/// `block_comment` factory node) that renders independently via its own
/// template.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct NodeTrivia {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub leading: Option<Vec<NodeData>>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub trailing: Option<Vec<NodeData>>,
}

/// Trivia data for transport — carries only the text strings.
/// The JS side sends `$triviaData: { leading: [{$text: "..."},…], trailing: [{$text: "..."},…] }`.
/// `TransportTrivia` extracts just the `$text` from each entry, avoiding the need for
/// full `NodeData` deserialization (and `serde_json::Value`) in the transport layer.
///
/// The bridge function converts `TransportTrivia` → `NodeTrivia` by wrapping
/// each text string in a minimal `NodeData { text: Some(text), type_: KindId(0), … }`.
#[derive(Debug, Clone, Default)]
pub struct TransportTrivia {
    pub leading: Option<Vec<String>>,
    pub trailing: Option<Vec<String>>,
}

impl TransportTrivia {
    /// Convert to `NodeTrivia` by wrapping each text string in a minimal
    /// `NodeData` with `type_: KindId(0)` (trivia items render as raw text).
    fn trivia_texts_to_nodes(texts: Vec<String>) -> Vec<NodeData> {
        texts
            .into_iter()
            .map(|text| NodeData {
                type_: KindId(0),
                source: Source::Factory,
                named: false,
                fields: None,
                children: None,
                text: Some(text),
                span: None,
                node_handle: None,
                child_index: None,
                trivia_data: None,
            })
            .collect()
    }

    /// Convert this transport trivia into the engine's `NodeTrivia` type.
    pub fn into_node_trivia(self) -> NodeTrivia {
        NodeTrivia {
            leading: self.leading.map(Self::trivia_texts_to_nodes),
            trailing: self.trailing.map(Self::trivia_texts_to_nodes),
        }
    }
}

/// Read an array of JS objects, extracting the `$text` string from each.
/// Returns `None` if the array is absent or empty.
#[cfg(feature = "napi-bindings")]
fn read_trivia_texts(
    obj: &::napi::bindgen_prelude::Object,
    key: &str,
) -> ::napi::Result<Option<Vec<String>>> {
    let arr: Option<Vec<::napi::bindgen_prelude::Object>> = obj.get(key)?;
    match arr {
        None => Ok(None),
        Some(items) => {
            let mut texts = Vec::with_capacity(items.len());
            for item in &items {
                let text: Option<String> = item.get("$text")?;
                if let Some(t) = text {
                    texts.push(t);
                }
            }
            if texts.is_empty() {
                Ok(None)
            } else {
                Ok(Some(texts))
            }
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for TransportTrivia {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let leading = read_trivia_texts(&obj, "leading")?;
        let trailing = read_trivia_texts(&obj, "trailing")?;
        Ok(TransportTrivia { leading, trailing })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for TransportTrivia {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        // Transport is receive-only (JS→Rust); stub satisfies trait bounds.
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ValidateNapiValue for TransportTrivia {}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::TypeName for TransportTrivia {
    fn type_name() -> &'static str {
        "TransportTrivia"
    }
    fn value_type() -> ::napi::ValueType {
        ::napi::ValueType::Object
    }
}

/// Primitive NodeData — the wire shape. Fixed `$`-metadata plus dynamic
/// `_<slot>` storage keys (and optional `$other`) matching the
/// ADR-0018 de-hoisted JS read/factory surface. Enrichment (`$variant`,
/// etc.) is TS-side only.
///
/// `type_` is a numeric `KindId` (parser.c-derived symbol ID) rather than
/// a string kind name. JSON wire shape is `{"$type": 42}` — `KindId` is
/// `#[serde(transparent)]` so serde handles the u16 ↔ JSON number mapping
/// without an explicit custom impl. Phase B-inverse of the KindID runtime
/// migration (2026-04-30).
#[derive(Debug, Clone, PartialEq)]
pub struct NodeData {
    pub type_: KindId,

    pub source: Source,

    pub named: bool,

    /// Stored named slots keyed by the raw tree-sitter field / promoted
    /// keyword name. On the wire these serialize as top-level `_<name>`
    /// properties (ADR-0018 de-hoisted storage).
    pub fields: Option<HashMap<String, FieldValue>>,

    pub children: Option<Vec<NodeData>>,

    pub text: Option<String>,

    pub span: Option<Span>,

    /// Index into the `ParsedTree.nodes` vec — O(1) lookup for the
    /// tree-sitter `Node` that produced this `NodeData`. Stamped by
    /// `ParsedTree::push_node` after `read_node` returns. `None` on
    /// factory-constructed nodes and on nodes that haven't been
    /// registered in a node table yet.
    pub node_handle: Option<u32>,

    /// Position of this node within its parent's children array.
    /// Set during `read_children` traversal. Enables O(1) child-index
    /// navigation: `parent.child(child_index)` instead of DFS by id.
    /// `None` on root nodes and factory-constructed nodes.
    pub child_index: Option<u16>,

    /// Leading / trailing trivia (comments) attached via `$trivia()`.
    /// Present only on factory-constructed nodes that have had trivia
    /// attached — `readNode` never sets this. Each trivia item is a
    /// fully-formed `NodeData` (e.g. a `line_comment` or `block_comment`
    /// factory node) that renders independently via its own template.
    ///
    /// Mirrors `NodeTrivia` in `@sittir/types` (spec 023 T016).
    pub trivia_data: Option<NodeTrivia>,
}

#[derive(Serialize)]
struct NodeDataSer<'a> {
    #[serde(rename = "$type")]
    type_: KindId,
    #[serde(rename = "$source")]
    source: Source,
    #[serde(rename = "$named")]
    named: bool,
    #[serde(flatten, serialize_with = "serialize_slot_fields")]
    fields: &'a Option<HashMap<String, FieldValue>>,
    #[serde(
        rename = "$other",
        default,
        skip_serializing_if = "Option::is_none",
        serialize_with = "serialize_children"
    )]
    children: &'a Option<Vec<NodeData>>,
    #[serde(rename = "$text", default, skip_serializing_if = "Option::is_none")]
    text: &'a Option<String>,
    #[serde(rename = "$span", default, skip_serializing_if = "Option::is_none")]
    span: &'a Option<Span>,
    #[serde(
        rename = "$nodeHandle",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    node_handle: &'a Option<u32>,
    #[serde(
        rename = "$childIndex",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    child_index: &'a Option<u16>,
    #[serde(
        rename = "$triviaData",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    trivia_data: &'a Option<NodeTrivia>,
}

#[derive(Deserialize)]
struct NodeDataDe {
    #[serde(rename = "$type")]
    type_: KindId,
    #[serde(rename = "$source")]
    source: Source,
    #[serde(rename = "$named")]
    named: bool,
    #[serde(rename = "$fields", default)]
    legacy_fields: HashMap<String, FieldValue>,
    #[serde(flatten, deserialize_with = "deserialize_slot_fields", default)]
    fields: Option<HashMap<String, FieldValue>>,
    #[serde(rename = "$other", deserialize_with = "deserialize_children", default)]
    children: Option<Vec<NodeData>>,
    #[serde(rename = "$text", default)]
    text: Option<String>,
    #[serde(rename = "$span", default)]
    span: Option<Span>,
    #[serde(rename = "$nodeHandle", default)]
    node_handle: Option<u32>,
    #[serde(rename = "$childIndex", default)]
    child_index: Option<u16>,
    #[serde(rename = "$triviaData", default)]
    trivia_data: Option<NodeTrivia>,
}

fn serialize_slot_fields<S>(
    fields: &Option<HashMap<String, FieldValue>>,
    serializer: S,
) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    let mut map = serializer.serialize_map(Some(fields.as_ref().map_or(0, HashMap::len)))?;
    if let Some(fields) = fields {
        for (name, value) in fields {
            map.serialize_entry(&format!("_{name}"), value)?;
        }
    }
    map.end()
}

fn deserialize_slot_fields<'de, D>(
    deserializer: D,
) -> Result<Option<HashMap<String, FieldValue>>, D::Error>
where
    D: Deserializer<'de>,
{
    let raw = HashMap::<String, FieldValue>::deserialize(deserializer)?;
    if raw.is_empty() {
        return Ok(None);
    }
    let mut fields = HashMap::with_capacity(raw.len());
    for (key, value) in raw {
        let Some(name) = key.strip_prefix('_') else {
            return Err(serde::de::Error::custom(format!(
                "unexpected NodeData slot key {key:?}; expected _<slot>"
            )));
        };
        if name.is_empty() {
            return Err(serde::de::Error::custom("NodeData slot key '_' is invalid"));
        }
        fields.insert(name.to_string(), value);
    }
    Ok(Some(fields))
}

fn serialize_children<S>(
    children: &Option<Vec<NodeData>>,
    serializer: S,
) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    let Some(children) = children.as_ref() else {
        return serializer.serialize_none();
    };
    let mut seq = serializer.serialize_seq(Some(children.len()))?;
    for child in children {
        match scalar_child_value(child) {
            Some(FieldScalar::Text(text)) => seq.serialize_element(text)?,
            Some(FieldScalar::KindId(kind)) => seq.serialize_element(&kind.get())?,
            None => seq.serialize_element(child)?,
        }
    }
    seq.end()
}

fn deserialize_children<'de, D>(deserializer: D) -> Result<Option<Vec<NodeData>>, D::Error>
where
    D: Deserializer<'de>,
{
    let raw = Vec::<FieldValueItem>::deserialize(deserializer)?;
    if raw.is_empty() {
        return Ok(None);
    }
    let mut children = Vec::with_capacity(raw.len());
    for item in raw {
        match item {
            FieldValueItem::Node(node) => children.push(node),
            FieldValueItem::Text(text) => children.push(scalar_text_leaf(text)),
            FieldValueItem::KindId(kind) => children.push(scalar_kind_leaf(kind)),
        }
    }
    Ok(Some(children))
}


impl Serialize for NodeData {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        NodeDataSer {
            type_: self.type_,
            source: self.source,
            named: self.named,
            fields: &self.fields,
            children: &self.children,
            text: &self.text,
            span: &self.span,
            node_handle: &self.node_handle,
            child_index: &self.child_index,
            trivia_data: &self.trivia_data,
        }
        .serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for NodeData {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let wire = NodeDataDe::deserialize(deserializer)?;
        let mut fields = wire.fields.unwrap_or_default();
        for (name, value) in wire.legacy_fields {
            if fields.insert(name.clone(), value).is_some() {
                return Err(serde::de::Error::custom(format!(
                    "duplicate NodeData slot provided via both $fields and _{name}"
                )));
            }
        }
        let fields = if fields.is_empty() {
            None
        } else {
            Some(fields)
        };
        Ok(Self {
            type_: wire.type_,
            source: wire.source,
            named: wire.named,
            fields,
            children: wire.children,
            text: wire.text,
            span: wire.span,
            node_handle: wire.node_handle,
            child_index: wire.child_index,
            trivia_data: wire.trivia_data,
        })
    }
}

/// Where a `NodeData` originated. `Ts` = `readNode` over a tree-sitter
/// tree; `Sg` = ast-grep path; `Factory` = constructed on the TS side.
///
/// Wire shape is a numeric u8: 0 = Ts, 1 = Sg, 2 = Factory.
/// Eliminates the napi string_enum PascalCase casing mismatch that caused
/// `value "ts" does not match any variant of enum Source` errors.
///
/// napi `FromNapiValue`/`ToNapiValue` impls (gated on napi-bindings
/// feature) read/write a JS number. The feature gate prevents napi
/// C-symbol leakage into sittir-core test binaries.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum Source {
    Ts = 0,
    Sg = 1,
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
            1 => Ok(Source::Sg),
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
        let n = u32::from_napi_value(env, val)?;
        match n {
            0 => Ok(Source::Ts),
            1 => Ok(Source::Sg),
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

/// Value stored in a `NodeData` named slot map. Untagged so the wire
/// shape is simply the value (object | array | string) at each `_<slot>`
/// property, matching the JS de-hoisted layout.
#[derive(Debug, Clone, PartialEq)]
pub enum FieldValue {
    Single(Box<NodeData>),
    Multiple(Vec<NodeData>),
    Text(String),
}

impl Serialize for FieldValue {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        match self {
            Self::Single(child) => match scalar_leaf_value(child) {
                Some(FieldScalar::Text(text)) => serializer.serialize_str(text),
                Some(FieldScalar::KindId(kind)) => serializer.serialize_u16(kind.get()),
                None => child.serialize(serializer),
            },
            Self::Multiple(items) => {
                if items.iter().all(|item| scalar_leaf_value(item).is_some()) {
                    let mut seq = serializer.serialize_seq(Some(items.len()))?;
                    for item in items {
                        match scalar_leaf_value(item).expect("checked is_some above") {
                            FieldScalar::Text(text) => seq.serialize_element(text)?,
                            FieldScalar::KindId(kind) => seq.serialize_element(&kind.get())?,
                        }
                    }
                    seq.end()
                } else {
                    items.serialize(serializer)
                }
            }
            Self::Text(text) => serializer.serialize_str(text),
        }
    }
}

impl<'de> Deserialize<'de> for FieldValue {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        struct FieldValueVisitor;

        impl<'de> Visitor<'de> for FieldValueVisitor {
            type Value = FieldValue;

            fn expecting(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
                formatter.write_str("a node object, scalar leaf, or array of node/scalar leaves")
            }

            fn visit_map<A: serde::de::MapAccess<'de>>(self, map: A) -> Result<Self::Value, A::Error> {
                let node = NodeData::deserialize(serde::de::value::MapAccessDeserializer::new(map))?;
                Ok(FieldValue::Single(Box::new(node)))
            }

            fn visit_str<E: serde::de::Error>(self, value: &str) -> Result<Self::Value, E> {
                Ok(FieldValue::Text(value.to_string()))
            }

            fn visit_string<E: serde::de::Error>(self, value: String) -> Result<Self::Value, E> {
                Ok(FieldValue::Text(value))
            }

            fn visit_u64<E: serde::de::Error>(self, value: u64) -> Result<Self::Value, E> {
                let kind = u16::try_from(value).map_err(|_| E::custom(format!("kind id {value} out of range")))?;
                Ok(FieldValue::Single(Box::new(scalar_kind_leaf(KindId(kind)))))
            }

            fn visit_seq<A: SeqAccess<'de>>(self, mut seq: A) -> Result<Self::Value, A::Error> {
                let mut items = Vec::new();
                while let Some(item) = seq.next_element::<FieldValueItem>()? {
                    match item {
                        FieldValueItem::Node(node) => items.push(node),
                        FieldValueItem::Text(text) => items.push(scalar_text_leaf(text)),
                        FieldValueItem::KindId(kind) => items.push(scalar_kind_leaf(kind)),
                    }
                }
                Ok(FieldValue::Multiple(items))
            }
        }

        deserializer.deserialize_any(FieldValueVisitor)
    }
}

#[derive(Deserialize)]
#[serde(untagged)]
enum FieldValueItem {
    Node(NodeData),
    Text(String),
    KindId(KindId),
}

enum FieldScalar<'a> {
    Text(&'a str),
    KindId(KindId),
}

fn scalar_leaf_value(node: &NodeData) -> Option<FieldScalar<'_>> {
    if node.fields.is_some() || node.children.is_some() {
        return None;
    }
    if node.node_handle.is_some() || node.child_index.is_some() {
        return None;
    }
    if node.named {
        return node.text.as_deref().map(FieldScalar::Text);
    }
    Some(FieldScalar::KindId(node.type_))
}

fn scalar_child_value(node: &NodeData) -> Option<FieldScalar<'_>> {
    if node.fields.is_some() || node.children.is_some() {
        return None;
    }
    if node.node_handle.is_some() || node.child_index.is_some() {
        return None;
    }
    if node.named {
        return None;
    }
    Some(FieldScalar::KindId(node.type_))
}


fn scalar_text_leaf(text: String) -> NodeData {
    NodeData {
        type_: KindId(0),
        source: Source::Ts,
        named: true,
        fields: None,
        children: None,
        text: Some(text),
        span: None,
        node_handle: None,
        child_index: None,
        trivia_data: None,
    }
}

fn scalar_kind_leaf(kind: KindId) -> NodeData {
    NodeData {
        type_: kind,
        source: Source::Ts,
        named: false,
        fields: None,
        children: None,
        text: Some(kind.to_string()),
        span: None,
        node_handle: None,
        child_index: None,
        trivia_data: None,
    }
}

/// A transport field that accepts either a single value or an array of values
/// from JS.
///
/// The JS `readNode` path stores single-element `multiple:true` fields as
/// scalars rather than length-1 arrays. Using `Vec<T>` for such fields causes
/// napi-rs to fail with "Given napi value is not an array". `OneOrMany<T>`
/// accepts both shapes in its `FromNapiValue` impl and always presents a
/// `&[T]` slice to Rust callers (via `Deref`), so generated `render_*`
/// functions can call `.iter()` uniformly.
#[derive(Debug, Clone)]
pub struct OneOrMany<T>(pub Vec<T>);

impl<T> std::ops::Deref for OneOrMany<T> {
    type Target = [T];
    fn deref(&self) -> &[T] {
        &self.0
    }
}

impl<T> IntoIterator for OneOrMany<T> {
    type Item = T;
    type IntoIter = std::vec::IntoIter<T>;
    fn into_iter(self) -> Self::IntoIter {
        self.0.into_iter()
    }
}

impl<T> From<OneOrMany<T>> for Vec<T> {
    fn from(v: OneOrMany<T>) -> Vec<T> {
        v.0
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: napi::bindgen_prelude::FromNapiValue> napi::bindgen_prelude::FromNapiValue
    for OneOrMany<T>
{
    unsafe fn from_napi_value(
        env: napi::sys::napi_env,
        napi_val: napi::sys::napi_value,
    ) -> napi::Result<Self> {
        let mut is_arr = false;
        // SAFETY: env and napi_val are valid napi handles provided by the runtime.
        unsafe { napi::sys::napi_is_array(env, napi_val, &mut is_arr) };
        if is_arr {
            let v = Vec::<T>::from_napi_value(env, napi_val)?;
            Ok(OneOrMany(v))
        } else {
            let single = T::from_napi_value(env, napi_val)?;
            Ok(OneOrMany(vec![single]))
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: napi::bindgen_prelude::ToNapiValue> napi::bindgen_prelude::ToNapiValue
    for OneOrMany<T>
{
    unsafe fn to_napi_value(
        env: napi::sys::napi_env,
        val: Self,
    ) -> napi::Result<napi::sys::napi_value> {
        Vec::<T>::to_napi_value(env, val.0)
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: napi::bindgen_prelude::FromNapiValue> napi::bindgen_prelude::ValidateNapiValue
    for OneOrMany<T>
{
}

#[cfg(feature = "napi-bindings")]
impl<T> napi::bindgen_prelude::TypeName for OneOrMany<T> {
    fn type_name() -> &'static str {
        "OneOrMany"
    }
    fn value_type() -> napi::ValueType {
        napi::ValueType::Object
    }
}

/// Byte-range for a `NodeData` within its source string. `start`/`end`
/// are UTF-8 byte offsets (ast-grep / tree-sitter convention).
/// `#[napi(object)]` (gated on napi-bindings feature) adds
/// `FromNapiValue` / `ToNapiValue` so transport structs can include
/// `Option<Span>` fields. Feature gate prevents napi C-symbol leakage
/// into sittir-core test binaries.
#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub struct Span {
    pub start: u32,
    pub end: u32,
}

/// A single replacement against a source string. Napi boundary type.
///
/// `#[napi(object)]` (gated on napi-bindings feature) auto-generates
/// the N-API mapping with camelCase field renaming — TS side sees
/// `{ startPos, endPos, insertedText }` per contracts/napi-api.md.
/// `serde` mirrors that with camelCase so `apply_edits` can accept
/// JSON payloads in the TS-forced-backend round-trip path.
#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Edit {
    pub start_pos: u32,
    pub end_pos: u32,
    pub inserted_text: String,
}

/// Implemented by codegen on every transport struct and on `AnyTransport`.
/// Enables structured render directly into any `Write` target without an
/// intermediate `String`. The `render_to_string` provided default allocates
/// once (for the output) rather than pre-allocating per child.
///
/// Object-safe by design: `render_into` takes `&mut dyn std::fmt::Write`
/// rather than a generic `W`, so the trait can be used as `dyn
/// RenderableTransport` in heterogeneous template struct fields (the
/// `Renderable::Transport` variant in `sittir_core::filters`).
///
/// Codegen emits `impl RenderableTransport for <Kind>Transport` for every
/// kind, delegating to the per-kind `render_<kind>_transport` function. The
/// `AnyTransport` enum also implements this trait by delegating to
/// `render_transport_dispatch`, enabling zero-copy streaming through
/// `Renderable::Transport(&node.field as &dyn RenderableTransport)`.
pub trait RenderableTransport {
    /// Render this transport value into `dest`.
    fn render_into(&self, dest: &mut dyn std::fmt::Write) -> Result<(), ::askama::Error>;

    /// Convenience: render to a fresh `String`. Calls `render_into` once.
    fn render_to_string(&self) -> Result<String, ::askama::Error> {
        let mut s = String::new();
        self.render_into(&mut s)?;
        Ok(s)
    }
}

/// Blanket impl: `Box<T>` is `RenderableTransport` whenever `T` is. The
/// generated transport types use `Box<T>` for fields whose singular slot
/// closes a size cycle (see codegen `rustTransportSlotType`); this impl
/// lets those boxed fields participate uniformly in the dispatch.
impl<T: RenderableTransport + ?Sized> RenderableTransport for Box<T> {
    fn render_into(&self, dest: &mut dyn std::fmt::Write) -> Result<(), ::askama::Error> {
        (**self).render_into(dest)
    }
}

/// Leading / trailing delimiters for a format region. Mirrors
/// `FormatBoundary` in `@sittir/types` (FR-008).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormatBoundary {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub leading: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub trailing: Option<String>,
}

/// Per-slot separator / trailing-comma / absence hints. Mirrors
/// `FormatSlot` in `@sittir/types` (FR-008). `rename_all = "camelCase"`
/// maps `trailing_present` → `trailingPresent` on the wire.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FormatSlot {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sep: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub trailing_present: Option<bool>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub absent: Option<bool>,
}

/// A fixed literal token value override. Mirrors `FormatLiteral` in
/// `@sittir/types` (FR-008).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormatLiteral {
    pub raw: String,
}

/// A trivia (whitespace / comment) insertion at a byte offset. Mirrors
/// `FormatTrivia` in `@sittir/types` (FR-008).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormatTrivia {
    pub offset: u32,
    pub text: String,
}

/// Complete format record for a node kind. `kinds` enables per-kind
/// overrides nested inside a parent record. Mirrors `FormatRecord` in
/// `@sittir/types` (FR-008).
///
/// The recursive `kinds` field is fine in Rust because `HashMap` is
/// heap-allocated, so the struct size is statically bounded.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormatRecord {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub boundary: Option<FormatBoundary>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub slots: Option<HashMap<String, FormatSlot>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub literals: Option<HashMap<String, FormatLiteral>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub trivia: Option<Vec<FormatTrivia>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub kinds: Option<HashMap<String, FormatRecord>>,
}

#[cfg(test)]
mod format_tests {
    use super::*;

    #[test]
    fn format_record_json_roundtrip() {
        let record = FormatRecord {
            boundary: Some(FormatBoundary {
                leading: Some("    ".to_string()),
                trailing: Some("\n".to_string()),
            }),
            slots: None,
            literals: None,
            trivia: None,
            kinds: None,
        };
        let json = serde_json::to_string(&record).unwrap();
        let back: FormatRecord = serde_json::from_str(&json).unwrap();
        assert_eq!(record, back);
    }

    #[test]
    fn format_record_skip_none_fields() {
        let record = FormatRecord {
            boundary: None,
            slots: None,
            literals: None,
            trivia: None,
            kinds: None,
        };
        let json = serde_json::to_string(&record).unwrap();
        assert_eq!(json, "{}");
    }
}
