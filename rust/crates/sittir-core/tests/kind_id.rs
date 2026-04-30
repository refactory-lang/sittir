//! `KindId` serde transparency, Display, and From/Into conversion tests.
//!
//! Per the KindID runtime migration design (2026-04-30): `KindId` is a
//! `#[repr(transparent)]` newtype over `u16` with `#[serde(transparent)]`
//! so JSON numeric `$type` values decode directly without an enum table.

use serde_json::json;
use sittir_core::types::KindId;

#[test]
fn kind_id_serializes_as_bare_u16() {
    let id = KindId(42);
    let json = serde_json::to_string(&id).expect("serialize");
    assert_eq!(json, "42");
}

#[test]
fn kind_id_deserializes_from_bare_u16() {
    let id: KindId = serde_json::from_str("17").expect("deserialize");
    assert_eq!(id, KindId(17));
}

#[test]
fn kind_id_round_trips_via_json_value() {
    let id = KindId(411);
    let value = serde_json::to_value(id).expect("to_value");
    assert_eq!(value, json!(411));
    let back: KindId = serde_json::from_value(value).expect("from_value");
    assert_eq!(back, id);
}

#[test]
fn kind_id_displays_inner_u16() {
    assert_eq!(KindId(7).to_string(), "7");
}

#[test]
fn kind_id_u16_conversions() {
    let id: KindId = 99u16.into();
    assert_eq!(id, KindId(99));
    let back: u16 = id.into();
    assert_eq!(back, 99);
}
