//! The wire form of a node's provenance.

use sittir_core::types::Source;

#[test]
fn source_enum_serializes_as_numeric() {
    assert_eq!(serde_json::to_string(&Source::Ts).unwrap(), "0");
    assert_eq!(serde_json::to_string(&Source::Sg).unwrap(), "1");
    assert_eq!(serde_json::to_string(&Source::Factory).unwrap(), "2");
}
