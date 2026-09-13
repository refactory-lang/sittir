//! Resolved render options: one whitespace kind id per spacing site, one
//! bitflag per flank site, and the indentation unit.

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResolvedOptions {
    /// Whitespace kind id per spacing site, in generated site order.
    pub spacing: Vec<u16>,
    /// `Delimiter` bitflag per flank site, in generated site order; 0 leaves the field unset.
    pub delimiter: Vec<u8>,
    /// The indentation unit the writer repeats once per depth after a newline.
    pub indent: String,
}

impl Default for ResolvedOptions {
    fn default() -> Self {
        Self {
            spacing: Vec::new(),
            delimiter: Vec::new(),
            indent: crate::spacing::DEFAULT_INDENT.to_string(),
        }
    }
}

/// Refuse a napi object whose keys are not all in `allowed`: an address-keyed
/// deserializer's only defense against a typo, since napi otherwise drops an
/// unknown property silently.
#[cfg(feature = "napi-bindings")]
pub fn reject_unknown_keys(
    obj: &::napi::bindgen_prelude::Object,
    allowed: &[&str],
    at: &str,
) -> ::napi::Result<()> {
    for key in ::napi::bindgen_prelude::Object::keys(obj)? {
        if !allowed.contains(&key.as_str()) {
            let message = if at.is_empty() {
                format!("options: unknown key {key}")
            } else {
                format!("options: {at}/{key} names no site")
            };
            return Err(::napi::Error::from_reason(message));
        }
    }
    Ok(())
}
