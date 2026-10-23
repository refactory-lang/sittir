// One toy grammar addon. Both addons export the same JS names, as every
// sittir grammar exports `SittirEngine`, and both register them through the
// one napi copy linked into the shared engine.
use napi_derive::napi;

use super::ADDON;

#[napi]
pub struct SittirEngine {
    built_by: &'static str,
}

#[napi]
impl SittirEngine {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self { built_by: ADDON }
    }

    /// Which addon's method ran, on an object which addon built.
    #[napi]
    pub fn describe(&self) -> String {
        format!("method of {ADDON} on an object built by {}", self.built_by)
    }
}

/// Which addon this export belongs to.
#[napi]
pub fn addon() -> String {
    ADDON.to_owned()
}

/// An instance made on the Rust side: napi-rs finds the class constructor by
/// its JS name.
#[napi]
pub fn make() -> SittirEngine {
    SittirEngine { built_by: ADDON }
}

/// Calls into the engine, so the addon really depends on it.
#[napi]
pub fn refuse() -> napi::Result<()> {
    Err(toy_napi_engine::refusal(ADDON))
}
