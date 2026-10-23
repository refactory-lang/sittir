/// The stamp of the engine a caller was built against. A `const`, so code
/// compiled against the engine carries this value in its own image.
pub const BUILT: &str = env!("SITTIR_ENGINE_STAMP");

/// The stamp of the engine image the process actually loaded. A `static`,
/// so a read goes to whichever copy the loader mapped.
pub static LOADED: &str = BUILT;

/// Refuse to run against an engine other than the one the caller was built
/// against. Pass `BUILT` as the caller sees it. The loader reuses the first
/// engine it mapped by name, so a later package's own copy is never opened:
/// two packages built from different engines meet here, not at load.
pub fn check_stamp(expected: &str) -> Result<(), String> {
    if LOADED == expected {
        return Ok(());
    }
    Err(format!(
        "sittir engine mismatch: this addon was built against engine {expected}, but the process already loaded engine {LOADED} from {}. Install sittir grammar packages of one release.",
        loaded_from().as_deref().unwrap_or("an unknown path")
    ))
}

/// The file the loaded engine image was mapped from.
pub fn loaded_from() -> Option<String> {
    image_path(std::ptr::addr_of!(LOADED).cast())
}

#[cfg(unix)]
fn image_path(address: *const core::ffi::c_void) -> Option<String> {
    use core::ffi::{c_char, c_int, c_void};

    #[repr(C)]
    struct DlInfo {
        fname: *const c_char,
        fbase: *mut c_void,
        sname: *const c_char,
        saddr: *mut c_void,
    }
    unsafe extern "C" {
        fn dladdr(address: *const c_void, info: *mut DlInfo) -> c_int;
    }
    let mut info = DlInfo { fname: std::ptr::null(), fbase: std::ptr::null_mut(), sname: std::ptr::null(), saddr: std::ptr::null_mut() };
    // SAFETY: `info` is a valid out-pointer; `address` is only looked up.
    if unsafe { dladdr(address, &raw mut info) } == 0 || info.fname.is_null() {
        return None;
    }
    // SAFETY: dladdr returned a NUL-terminated path owned by the loader.
    Some(unsafe { core::ffi::CStr::from_ptr(info.fname) }.to_string_lossy().into_owned())
}

#[cfg(windows)]
fn image_path(address: *const core::ffi::c_void) -> Option<String> {
    use core::ffi::c_void;

    const FROM_ADDRESS: u32 = 0x4;
    const UNCHANGED_REFCOUNT: u32 = 0x2;
    #[link(name = "kernel32")]
    unsafe extern "system" {
        fn GetModuleHandleExW(flags: u32, name: *const c_void, module: *mut *mut c_void) -> i32;
        fn GetModuleFileNameW(module: *mut c_void, name: *mut u16, size: u32) -> u32;
    }
    let mut module = std::ptr::null_mut();
    // SAFETY: with FROM_ADDRESS the name argument is an address inside a module.
    if unsafe { GetModuleHandleExW(FROM_ADDRESS | UNCHANGED_REFCOUNT, address, &raw mut module) } == 0 {
        return None;
    }
    let mut path = vec![0u16; 32_768];
    let capacity = u32::try_from(path.len()).ok()?;
    // SAFETY: `path` holds `capacity` u16s.
    let written = unsafe { GetModuleFileNameW(module, path.as_mut_ptr(), capacity) };
    (written != 0).then(|| String::from_utf16_lossy(&path[..written as usize]))
}
