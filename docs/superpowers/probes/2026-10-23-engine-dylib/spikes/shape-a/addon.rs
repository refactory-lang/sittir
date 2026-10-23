// One toy grammar addon under shape A: its own napi, sittir-engine's
// tree-sitter runtime and tree-id counter, and a C scanner that allocates
// through the runtime.
use napi_derive::napi;

use super::ADDON;

unsafe extern "C" {
    fn toy_scanner_roundtrip() -> i32;
    fn toy_scanner_malloc_slot() -> usize;
}

// Data in another DLL is reached through its import slot, which rustc uses
// only for an item it knows a DLL provides.
#[cfg_attr(windows, link(name = "sittir_engine.dll", kind = "dylib"))]
unsafe extern "C" {
    static ts_current_malloc: Option<unsafe extern "C" fn(usize) -> *mut core::ffi::c_void>;
}

/// Refuse to load against an engine other than the one this addon was built
/// against.
#[napi(module_exports)]
pub fn check_engine(_exports: napi::bindgen_prelude::Object) -> napi::Result<()> {
    sittir_engine::check_stamp(sittir_engine::BUILT).map_err(napi::Error::from_reason)
}

#[napi]
pub fn addon() -> String {
    ADDON.to_owned()
}

#[napi]
pub fn claim_tree_id() -> Option<u32> {
    sittir_engine::claim_tree_id(u32::MAX - 1)
}

/// The engine image this addon is bound to: its stamp static's address and
/// the file it was mapped from.
#[napi]
pub fn engine() -> Vec<String> {
    vec![
        format!("{:p}", std::ptr::addr_of!(sittir_engine::LOADED)),
        sittir_engine::loaded_from().unwrap_or_default(),
        sittir_engine::LOADED.to_owned(),
    ]
}

/// Generic tree-sitter code instantiated in this addon, calling the runtime.
#[napi]
pub fn parse_without_language() -> bool {
    let mut parser = tree_sitter::Parser::new();
    parser.parse("fn main() {}", None).is_none()
}

/// malloc, realloc and free through the runtime's `ts_current_*` slots.
#[napi]
pub fn scanner_roundtrip() -> bool {
    // SAFETY: a self-contained C function with no arguments.
    unsafe { toy_scanner_roundtrip() == 1 }
}

/// The `ts_current_malloc` slot as the C scanner finds it, and as this
/// addon's Rust code finds it.
#[napi]
pub fn malloc_slots() -> Vec<String> {
    // SAFETY: both return or take an address only; the static is not read.
    let (scanner, rust) = unsafe { (toy_scanner_malloc_slot(), std::ptr::addr_of!(ts_current_malloc) as usize) };
    vec![format!("{scanner:#x}"), format!("{rust:#x}")]
}
