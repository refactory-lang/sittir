fn main() {
    napi_build::setup();

    let crate_dir = std::path::PathBuf::from(
        std::env::var_os("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR"),
    );
    let grammar_src = crate_dir.join("../../../packages/rust/.sittir/src");

    let mut build = cc::Build::new();
    build.std("c11").include(&grammar_src);

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

    build.compile("sittir-tree-sitter-rust");
}
