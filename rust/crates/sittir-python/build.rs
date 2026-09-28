fn main() {
    napi_build::setup();

    let crate_dir = std::path::PathBuf::from(
        std::env::var_os("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR"),
    );
    let grammar_src = crate_dir.join("../../../packages/python/.sittir/src");

    let mut build = cc::Build::new();
    build
        .std("c11")
        .include(&grammar_src)
        .flag_if_supported("-Wno-unused-value")
        .flag_if_supported("-Wno-unused-parameter");

    if std::env::var("CARGO_CFG_TARGET_ENV").as_deref() == Ok("msvc") {
        build.flag("-utf-8");
    }

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
        cc::Build::new()
            .cpp(true)
            .include(&grammar_src)
            .file(&cpp_scanner_path)
            .compile("sittir-tree-sitter-python-scanner");
        rerun_if_changed_with_includes(&cpp_scanner_path, &mut watched);
    }

    build.compile("sittir-tree-sitter-python");
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
