use core::fmt;

macro_rules! marker {
    () => {
        "sittir-engine-stamp:"
    };
}

/// The length of the bytes that open a stamp's text in an image. Only the
/// length: the marker's own text must appear in an image only where a stamp
/// begins.
const MARKER_LEN: usize = marker!().len();

/// The release an engine image belongs to: its crate version and the commit
/// it was built from, held as the text `<marker><version>@<commit>\0`. An
/// image that holds a stamp carries that text in its read-only data, so a
/// reader finds it in the image's bytes without loading the image. Every
/// package of a release carries the same stamp.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Stamp(&'static str);

impl fmt::Display for Stamp {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0[MARKER_LEN..self.0.len() - 1])
    }
}

/// The engine a caller was built against. A `const`, so each addon compiled
/// against the engine carries this value in its own image.
pub const BUILT: Stamp = Stamp(concat!(marker!(), env!("CARGO_PKG_VERSION"), "@", env!("SITTIR_ENGINE_COMMIT"), "\0"));

/// The engine the process mapped. An addon reads it as data, never through a
/// call: the loader binds a data reference when it maps the addon, to the
/// first engine image the process mapped, and an engine of another version
/// names this static differently, so the addon fails to load. A call may be
/// bound lazily, on first use, and a lazily bound call into an engine of
/// another version crashes the process instead of failing the load.
pub static LOADED: Stamp = BUILT;

/// The refusal for `addon`, built against `built`, beside the mapped engine:
/// it names both stamps and the file the mapped engine came from. An addon
/// calls it once its stamp differs from [`LOADED`], when the mapped engine has
/// this version and another commit, so its name and signature hold across
/// every commit of a version.
#[must_use]
pub fn refusal(addon: &str, built: &Stamp) -> String {
    format!(
        "sittir: {addon} was built against engine {built} but loaded engine {LOADED} from {}",
        loaded_from().as_deref().unwrap_or("an unknown path")
    )
}

/// The mapped engine's stamp and the file it was loaded from. Never inlined,
/// so the read goes to the mapped engine's image.
#[must_use]
#[inline(never)]
pub fn loaded() -> (Stamp, Option<String>) {
    (LOADED, loaded_from())
}

fn loaded_from() -> Option<String> {
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
    // SAFETY: `info` is a valid out-pointer, and `address` is only looked up.
    if unsafe { dladdr(address, &raw mut info) } == 0 || info.fname.is_null() {
        return None;
    }
    // SAFETY: dladdr returned a NUL-terminated path the loader owns.
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    fn version() -> String {
        BUILT.to_string().split('@').next().expect("a version").to_owned()
    }

    #[test]
    fn the_stamp_is_its_marked_text_so_a_reader_finds_it_in_the_image_bytes() {
        assert_eq!(BUILT.0, format!("{}{}@{}\0", marker!(), env!("CARGO_PKG_VERSION"), env!("SITTIR_ENGINE_COMMIT")));
        assert_eq!(BUILT.to_string(), format!("{}@{}", env!("CARGO_PKG_VERSION"), env!("SITTIR_ENGINE_COMMIT")));
    }

    #[test]
    fn the_refusal_names_the_addon_both_stamps_and_the_loaded_engine() {
        let other = Stamp(Box::leak(format!("{}{}@another-commit\0", marker!(), version()).into_boxed_str()));
        let message = refusal("sittir-test", &other);
        let path = loaded_from().expect("the loaded engine has a path");
        assert_eq!(
            message,
            format!("sittir: sittir-test was built against engine {}@another-commit but loaded engine {BUILT} from {path}", version())
        );
    }

    #[test]
    fn the_loaded_engine_is_the_image_its_stamp_was_mapped_from() {
        let (stamp, path) = loaded();
        let exe = std::env::current_exe().unwrap();
        assert_eq!(stamp, BUILT);
        assert_eq!(Path::new(&path.expect("the loaded engine has a path")).canonicalize().unwrap(), exe.canonicalize().unwrap());
    }
}
