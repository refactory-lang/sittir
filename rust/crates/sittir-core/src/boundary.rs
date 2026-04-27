//! Cross-FFI shape helpers. Serde `rename` / `skip_if_none` attrs live
//! alongside the structs in `types` per spec 012 T009 + T011; this
//! module is reserved for shared boundary utilities (wire validation,
//! round-trip helpers) that don't belong on the structs themselves.
