//! Cross-FFI shape helpers. Serde `rename` / `skip_if_none` attrs live
//! alongside the structs in `types` per spec 012 T009 + T011; this
//! module is reserved for shared boundary utilities (wire validation,
//! round-trip helpers) that don't belong on the structs themselves.

/// Validate and coerce a JS `f64` node id to a `u64`.
///
/// JS numbers are the natural wire carrier for tree-sitter's pointer-derived
/// `u64` node ids. This function rejects values that are not valid ids:
/// non-finite (NaN / ±∞), negative, or fractional.
///
/// # Errors
/// Returns an `Err(String)` describing the violation so callers can forward
/// it directly to `Error::from_reason` on the napi boundary.
pub fn coerce_node_id(node_id: f64) -> Result<u64, String> {
    if !node_id.is_finite() {
        return Err("node id must be finite".to_string());
    }
    if node_id < 0.0 {
        return Err("node id must be non-negative".to_string());
    }
    if node_id.fract() != 0.0 {
        return Err("node id must be an integer".to_string());
    }
    Ok(node_id as u64)
}

#[cfg(test)]
mod tests {
    use super::coerce_node_id;

    #[test]
    fn nan_is_rejected() {
        let err = coerce_node_id(f64::NAN).unwrap_err();
        assert!(err.contains("finite"), "unexpected message: {err}");
    }

    #[test]
    fn positive_infinity_is_rejected() {
        let err = coerce_node_id(f64::INFINITY).unwrap_err();
        assert!(err.contains("finite"), "unexpected message: {err}");
    }

    #[test]
    fn negative_infinity_is_rejected() {
        let err = coerce_node_id(f64::NEG_INFINITY).unwrap_err();
        assert!(err.contains("finite"), "unexpected message: {err}");
    }

    #[test]
    fn negative_integer_is_rejected() {
        let err = coerce_node_id(-1.0).unwrap_err();
        assert!(err.contains("non-negative"), "unexpected message: {err}");
    }

    #[test]
    fn fractional_value_is_rejected() {
        let err = coerce_node_id(1.5).unwrap_err();
        assert!(err.contains("integer"), "unexpected message: {err}");
    }

    #[test]
    fn zero_is_accepted() {
        assert_eq!(coerce_node_id(0.0).unwrap(), 0u64);
    }

    #[test]
    fn positive_whole_number_is_accepted() {
        assert_eq!(coerce_node_id(42.0).unwrap(), 42u64);
    }

    #[test]
    fn large_valid_id_is_accepted() {
        // Tree-sitter ids are pointer-derived; values up to 2^53 fit exactly
        // in an f64 and are valid.
        let id: f64 = (1u64 << 53) as f64;
        assert_eq!(coerce_node_id(id).unwrap(), 1u64 << 53);
    }
}
