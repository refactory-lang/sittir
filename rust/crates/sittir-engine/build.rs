//! Links the engine as the one shared library every grammar addon binds to,
//! and stamps the build so an addon can refuse an engine it was not built
//! against.
//!
//! - Name: `@rpath/lib<crate>.dylib` on macOS and the soname `lib<crate>.so`
//!   on Linux, so the loader matches every addon's reference against the
//!   image it already mapped, whichever package's copy that was.
//! - Search path: the engine's own directory, where its package ships the
//!   Rust std library beside it.
//! - Exports: rustc exports a Rust dylib's Rust symbols only. The tree-sitter
//!   C runtime it links is exported here too, because addon code calls it
//!   directly (generic tree-sitter code is instantiated in the addon) and a
//!   grammar's external scanner reads the runtime's allocator slots.
//! - Stamp: `SITTIR_ENGINE_STAMP`, the crate version and a hash of the
//!   engine's sources.
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};

/// The runtime's allocator, as a scanner built with
/// `TREE_SITTER_REUSE_ALLOCATOR` reads it through `tree_sitter/alloc.h`.
const ALLOCATOR_SLOTS: [&str; 4] = ["ts_current_malloc", "ts_current_calloc", "ts_current_realloc", "ts_current_free"];

fn main() {
    let out = PathBuf::from(var("OUT_DIR"));
    let name = var("CARGO_PKG_NAME").replace('-', "_");
    let functions = runtime_functions();
    match (var("CARGO_CFG_TARGET_OS").as_str(), var("CARGO_CFG_TARGET_ENV").as_str()) {
        ("macos", _) => {
            println!("cargo:rustc-link-arg=-Wl,-install_name,@rpath/lib{name}.dylib");
            println!("cargo:rustc-link-arg=-Wl,-rpath,@loader_path");
            let list = out.join("runtime-exports.txt");
            let names: String = functions.iter().chain(ALLOCATOR_SLOTS.map(String::from).iter()).map(|symbol| format!("_{symbol}\n")).collect();
            std::fs::write(&list, names).expect("write the export list");
            println!("cargo:rustc-link-arg=-Wl,-exported_symbols_list,{}", list.display());
        }
        ("linux", _) => {
            println!("cargo:rustc-link-arg=-Wl,-soname,lib{name}.so");
            println!("cargo:rustc-link-arg=-Wl,-rpath,$ORIGIN");
            let script = out.join("runtime-exports.map");
            let names: String = functions.iter().chain(ALLOCATOR_SLOTS.map(String::from).iter()).map(|symbol| format!("  {symbol};\n")).collect();
            std::fs::write(&script, format!("{{\n global:\n{names}}};\n")).expect("write the version script");
            println!("cargo:rustc-link-arg=-Wl,--version-script={}", script.display());
        }
        ("windows", "msvc") => {
            for function in &functions {
                println!("cargo:rustc-link-arg=/EXPORT:{function}");
            }
            for slot in ALLOCATOR_SLOTS {
                println!("cargo:rustc-link-arg=/EXPORT:{slot},DATA");
            }
        }
        (os, env) => panic!("no engine link settings for {os}-{env}"),
    }
    println!("cargo:rustc-env=SITTIR_ENGINE_STAMP={}", stamp());
}

fn var(key: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| panic!("{key} is set for build scripts"))
}

/// The C API functions the runtime defines in this build: every function
/// `api.h` declares, less those only the crate's wasm support reaches (the
/// wasm store is compiled out without that feature, so its entry points
/// are declared but never defined).
fn runtime_functions() -> Vec<String> {
    let include = PathBuf::from(var("DEP_TREE_SITTER_INCLUDE"));
    let api = include.join("tree_sitter/api.h");
    let wasm = include.join("../binding_rust/wasm_language.rs");
    println!("cargo:rerun-if-changed={}", api.display());
    println!("cargo:rerun-if-changed={}", wasm.display());
    let wasm_only = calls(&read(&wasm), "ffi::");
    let mut functions: Vec<String> = calls(&strip_comments(&read(&api)), "").into_iter().filter(|name| !wasm_only.contains(name)).collect();
    functions.sort();
    functions.dedup();
    functions
}

fn read(path: &Path) -> String {
    std::fs::read_to_string(path).unwrap_or_else(|error| panic!("read {}: {error}", path.display()))
}

/// Each `ts_*` identifier that `prefix` introduces and an opening
/// parenthesis follows: a declaration in a C header, a call in Rust.
fn calls(text: &str, prefix: &str) -> Vec<String> {
    let mut found = Vec::new();
    let mut rest = text;
    while let Some(at) = rest.find(&format!("{prefix}ts_")) {
        let preceded_by_ident = rest[..at].chars().next_back().is_some_and(|c| c.is_ascii_alphanumeric() || c == '_');
        let start = at + prefix.len();
        let end = rest[start..].find(|c: char| !(c.is_ascii_alphanumeric() || c == '_')).map_or(rest.len(), |len| start + len);
        if !preceded_by_ident && rest[end..].trim_start().starts_with('(') {
            found.push(rest[start..end].to_owned());
        }
        rest = &rest[end..];
    }
    found
}

fn strip_comments(c: &str) -> String {
    let mut out = String::with_capacity(c.len());
    let mut rest = c;
    loop {
        let block = rest.find("/*");
        let line = rest.find("//");
        match (block, line) {
            (Some(b), l) if l.is_none_or(|l| b < l) => {
                out.push_str(&rest[..b]);
                rest = rest[b..].find("*/").map_or("", |end| &rest[b + end + 2..]);
            }
            (_, Some(l)) => {
                out.push_str(&rest[..l]);
                rest = rest[l..].find('\n').map_or("", |end| &rest[l + end..]);
            }
            _ => {
                out.push_str(rest);
                return out;
            }
        }
    }
}

/// The crate version and the first 12 hex digits of a hash over the
/// engine's own sources, in path order.
fn stamp() -> String {
    let root = PathBuf::from(var("CARGO_MANIFEST_DIR"));
    let mut files = vec![root.join("Cargo.toml"), root.join("build.rs")];
    collect_rust_files(&root.join("src"), &mut files);
    files.sort();
    let mut hash = Sha256::new();
    for file in &files {
        println!("cargo:rerun-if-changed={}", file.display());
        hash.update(file.strip_prefix(&root).unwrap_or(file).to_string_lossy().as_bytes());
        hash.update(read(file).as_bytes());
    }
    let digest: String = hash.finalize().iter().map(|byte| format!("{byte:02x}")).collect();
    format!("{}+{}", var("CARGO_PKG_VERSION"), &digest[..12])
}

fn collect_rust_files(dir: &Path, files: &mut Vec<PathBuf>) {
    let Ok(entries) = std::fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_rust_files(&path, files);
        } else if path.extension().is_some_and(|ext| ext == "rs") {
            files.push(path);
        }
    }
}
