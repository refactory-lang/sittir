fn main() {
    napi_build::setup();

    // Built with `-C prefer-dynamic`, the addon links the sittir-engine
    // library and the Rust std library, both shipped in its own directory.
    match std::env::var("CARGO_CFG_TARGET_OS").as_deref() {
        Ok("macos") => println!("cargo:rustc-cdylib-link-arg=-Wl,-rpath,@loader_path"),
        Ok("linux") => println!("cargo:rustc-cdylib-link-arg=-Wl,-rpath,$ORIGIN"),
        _ => {}
    }

    let crate_dir = std::path::PathBuf::from(
        std::env::var_os("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR"),
    );
    let grammar_src = crate_dir.join("../../../packages/rust/.sittir/src");

    let mut build = cc::Build::new();
    build
        .std("c11")
        .include(&grammar_src)
        .flag_if_supported("-Wno-unused-value")
        .flag_if_supported("-Wno-unused-parameter");

    if std::env::var("CARGO_CFG_TARGET_ENV").as_deref() == Ok("msvc") {
        build.flag("-utf-8");
    }
    allocate_through_runtime(&mut build);

    let parser_path = grammar_src.join("parser.c");
    build.file(&parser_path);
    println!("cargo:rerun-if-changed={}", parser_path.display());

    let mut watched = std::collections::HashSet::new();
    let scanner_path = grammar_src.join("scanner.c");
    if scanner_path.exists() {
        build.file(&scanner_path);
        rerun_if_changed_with_includes(&scanner_path, &mut watched);
    }

    let cpp_scanner_path = grammar_src.join("scanner.cc");
    if cpp_scanner_path.exists() {
        let mut cpp = cc::Build::new();
        cpp.cpp(true).include(&grammar_src).file(&cpp_scanner_path);
        allocate_through_runtime(&mut cpp);
        cpp.compile("sittir-tree-sitter-rust-scanner");
        rerun_if_changed_with_includes(&cpp_scanner_path, &mut watched);
    }

    build.compile("sittir-tree-sitter-rust");
}

/// A scanner allocates through the tree-sitter runtime's allocator slots
/// (`ts_current_*`), which the engine library exports. MSVC reaches data in
/// another DLL only through its import slot.
fn allocate_through_runtime(build: &mut cc::Build) {
    build.define("TREE_SITTER_REUSE_ALLOCATOR", None);
    if std::env::var("CARGO_CFG_TARGET_ENV").as_deref() == Ok("msvc") {
        for slot in ["ts_current_malloc", "ts_current_calloc", "ts_current_realloc", "ts_current_free"] {
            build.define(slot, format!("(*__imp_{slot})").as_str());
        }
    }
}

/// Rebuild when a scanner source, or any file it quotes in an `#include`,
/// changes: a scanner may share a header outside the generated sources.
fn rerun_if_changed_with_includes(
    path: &std::path::Path,
    watched: &mut std::collections::HashSet<std::path::PathBuf>,
) {
    if !watched.insert(path.to_path_buf()) {
        return;
    }
    println!("cargo:rerun-if-changed={}", path.display());
    let source = std::fs::read_to_string(path).expect("scanner source");
    let dir = path.parent().expect("scanner directory");
    for line in source.lines() {
        let Some(rest) = line.trim_start().strip_prefix("#include \"") else {
            continue;
        };
        let Some(include) = rest.split('"').next() else {
            continue;
        };
        let header = dir.join(include);
        if header.exists() {
            rerun_if_changed_with_includes(&header, watched);
        }
    }
}
