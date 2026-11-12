// Compiles the measured tree's TypeScript parser (SITTIR_TS_SRC, its
// packages/typescript/.sittir/src) the way rust/crates/sittir-typescript's
// build script does: C11, the source directory on the include path, the
// scanner beside the parser.
fn main() {
    let src = std::path::PathBuf::from(std::env::var_os("SITTIR_TS_SRC").expect("SITTIR_TS_SRC: the measured tree's packages/typescript/.sittir/src"));
    let mut build = cc::Build::new();
    build.std("c11").include(&src).flag_if_supported("-Wno-unused-value").flag_if_supported("-Wno-unused-parameter").file(src.join("parser.c"));
    let scanner = src.join("scanner.c");
    if scanner.exists() {
        build.file(&scanner);
    }
    build.compile("sittir-typescript-parser");
    println!("cargo:rerun-if-env-changed=SITTIR_TS_SRC");
    println!("cargo:rerun-if-changed={}", src.join("parser.c").display());
    println!("cargo:rerun-if-changed={}", scanner.display());
}
