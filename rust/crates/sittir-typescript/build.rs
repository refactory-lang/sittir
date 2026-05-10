fn main() {
    napi_build::setup();

    let crate_dir = std::path::PathBuf::from(
        std::env::var_os("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR"),
    );
    let grammar_src = crate_dir.join("../../../packages/typescript/.sittir/src");
    let scanner_header = crate_dir.join("../../../packages/typescript/common/scanner.h");

    let mut build = cc::Build::new();
    build
        .include(&grammar_src)
        .flag_if_supported("-std=c11")
        .flag_if_supported("-Wno-unused-parameter");

    if std::env::var("CARGO_CFG_TARGET_ENV").as_deref() == Ok("msvc") {
        build.flag("-utf-8");
    }

    let parser_path = grammar_src.join("parser.c");
    build.file(&parser_path);
    println!("cargo:rerun-if-changed={}", parser_path.display());

    let scanner_path = grammar_src.join("scanner.c");
    if scanner_path.exists() {
        build.file(&scanner_path);
        println!("cargo:rerun-if-changed={}", scanner_path.display());
    }

    println!("cargo:rerun-if-changed={}", scanner_header.display());

    build.compile("sittir-tree-sitter-typescript");
}
