// Build script shared by the toy addons: a napi addon whose rpath is its own
// directory, so it finds the engine and libstd copies shipped beside it.
//
// With the `scanner` feature it also compiles scanner.c the way a grammar's
// external scanner is compiled, against the generated `tree_sitter/alloc.h`
// with TREE_SITTER_REUSE_ALLOCATOR, so its allocations go through the
// runtime's `ts_current_*` pointers instead of the C library directly.
fn main() {
    napi_build::setup();
    match std::env::var("CARGO_CFG_TARGET_OS").unwrap().as_str() {
        "macos" => println!("cargo:rustc-cdylib-link-arg=-Wl,-rpath,@loader_path"),
        "linux" => println!("cargo:rustc-cdylib-link-arg=-Wl,-rpath,$ORIGIN"),
        _ => {}
    }
    if std::env::var_os("CARGO_FEATURE_SCANNER").is_none() {
        return;
    }
    let manifest = std::path::PathBuf::from(std::env::var_os("CARGO_MANIFEST_DIR").unwrap());
    let headers = manifest
        .ancestors()
        .map(|dir| dir.join("packages/python/.sittir/src"))
        .find(|src| src.join("tree_sitter/alloc.h").exists())
        .expect("a sittir checkout above this crate, holding a generated tree_sitter/alloc.h");
    let scanner = manifest.join("../scanner.c");
    println!("cargo:rerun-if-changed={}", scanner.display());
    let mut build = cc::Build::new();
    build.std("c11").include(&headers).define("TREE_SITTER_REUSE_ALLOCATOR", None).file(&scanner);
    if std::env::var("CARGO_CFG_TARGET_ENV").as_deref() == Ok("msvc") {
        // MSVC reaches data in another DLL only through its import slot.
        for slot in ["ts_current_malloc", "ts_current_calloc", "ts_current_realloc", "ts_current_free"] {
            build.define(slot, format!("(*__imp_{slot})").as_str());
        }
    }
    build.compile("toy_scanner");
}
