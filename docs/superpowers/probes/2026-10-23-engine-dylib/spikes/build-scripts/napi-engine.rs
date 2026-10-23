// Build script for the napi-shared toy engine: linked the way sittir-engine
// is (an @rpath install name / soname and an rpath to its own directory),
// and, because napi is in it, like a napi addon on macOS: undefined napi
// symbols resolve from the host process at load.
fn main() {
    let name = std::env::var("CARGO_PKG_NAME").unwrap().replace('-', "_");
    match std::env::var("CARGO_CFG_TARGET_OS").unwrap().as_str() {
        "macos" => {
            println!("cargo:rustc-link-arg=-Wl,-install_name,@rpath/lib{name}.dylib");
            println!("cargo:rustc-link-arg=-Wl,-rpath,@loader_path");
            println!("cargo:rustc-link-arg=-Wl,-undefined,dynamic_lookup");
        }
        "linux" => {
            println!("cargo:rustc-link-arg=-Wl,-soname,lib{name}.so");
            println!("cargo:rustc-link-arg=-Wl,-rpath,$ORIGIN");
        }
        _ => {}
    }
}
