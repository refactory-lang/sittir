// Compiles sittir's generated rust parser (parser.c + scanner.c) from the checkout SITTIR_ROOT
// names, by default the checkout this folder sits in, so the probe reads with the same kinds and fields.
fn main() {
    napi_build::setup();
    let root = std::env::var("SITTIR_ROOT").unwrap_or_else(|_| {
        let dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        format!("{dir}/../../../../../../..")
    });
    let src = std::path::PathBuf::from(root).join("packages/rust/.sittir/src");
    println!("cargo:rerun-if-env-changed=SITTIR_ROOT");
    println!("cargo:rerun-if-changed={}", src.join("parser.c").display());
    cc::Build::new()
        .std("c11")
        .include(&src)
        .flag_if_supported("-Wno-unused-value")
        .flag_if_supported("-Wno-unused-parameter")
        .file(src.join("parser.c"))
        .file(src.join("scanner.c"))
        .compile("sittir-probe-rust-parser");
}
