//! Links the engine as the one shared library every grammar addon binds to,
//! and stamps the build so an addon can refuse an engine it was not built
//! against.
//!
//! - Name: `@rpath/lib<crate>.dylib` on macOS and the soname `lib<crate>.so`
//!   on Linux, so the loader matches every addon's reference against the
//!   image it already mapped, whichever package's copy that was.
//! - Search path: the engine's own directory, where its package ships the
//!   Rust std library beside it. A Linux RUNPATH is not inherited from the
//!   addon, so the engine carries its own.
//! - Exports: rustc exports a Rust dylib's Rust symbols only. The tree-sitter
//!   C runtime it links is exported from one list, because addon code calls
//!   it directly (tree-sitter's generic code is instantiated in the addon) and
//!   a grammar's external scanner reads the runtime's allocator slots. The
//!   list is also written as plain names, `runtime-exports.txt` in `OUT_DIR`,
//!   for the image checks to hold a build to.
//! - Linker: lld on Linux. rustc already gives a dylib an anonymous version
//!   script and GNU ld refuses a second one; lld merges them. A version
//!   script fetches nothing from an archive and lld refuses one that names an
//!   undefined symbol, so each listed name is also marked undefined: every
//!   image this crate links, its test executables included, holds the
//!   runtime. Apple's ld and link.exe fetch what their export lists name.
//! - Stamp: the commit comes from `SITTIR_ENGINE_COMMIT`, `local` when unset.
use std::path::{Path, PathBuf};

/// The runtime's allocator, as a scanner built with
/// `TREE_SITTER_REUSE_ALLOCATOR` reads it through `tree_sitter/alloc.h`.
const ALLOCATOR_SLOTS: [&str; 4] = ["ts_current_malloc", "ts_current_calloc", "ts_current_realloc", "ts_current_free"];

fn main() {
    let out = PathBuf::from(var("OUT_DIR"));
    let name = var("CARGO_PKG_NAME").replace('-', "_");
    let functions = runtime_functions();
    let exported = || functions.iter().map(String::as_str).chain(ALLOCATOR_SLOTS);
    write(&out.join("runtime-exports.txt"), &lines(exported(), "", "\n"));
    match (var("CARGO_CFG_TARGET_OS").as_str(), var("CARGO_CFG_TARGET_ENV").as_str()) {
        ("macos", _) => {
            println!("cargo:rustc-link-arg=-Wl,-install_name,@rpath/lib{name}.dylib");
            println!("cargo:rustc-link-arg=-Wl,-rpath,@loader_path");
            let list = out.join("exported-symbols.txt");
            write(&list, &lines(exported(), "_", "\n"));
            println!("cargo:rustc-link-arg=-Wl,-exported_symbols_list,{}", list.display());
        }
        ("linux", _) => {
            println!("cargo:rustc-link-arg=-fuse-ld=lld");
            println!("cargo:rustc-link-arg=-Wl,-soname,lib{name}.so");
            println!("cargo:rustc-link-arg=-Wl,-rpath,$ORIGIN");
            println!("cargo:rustc-link-arg=-Wl,--enable-new-dtags");
            let script = out.join("version-script.map");
            write(&script, &format!("{{\n global:\n{}}};\n", lines(exported(), "  ", ";\n")));
            println!("cargo:rustc-link-arg=-Wl,--version-script={}", script.display());
            for symbol in exported() {
                println!("cargo:rustc-link-arg=-Wl,--undefined={symbol}");
            }
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
    println!("cargo:rerun-if-env-changed=SITTIR_ENGINE_COMMIT");
    let commit = std::env::var("SITTIR_ENGINE_COMMIT").ok().filter(|commit| !commit.is_empty());
    println!("cargo:rustc-env=SITTIR_ENGINE_COMMIT={}", commit.as_deref().unwrap_or("local"));
}

fn var(key: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| panic!("{key} is set for build scripts"))
}

/// Each symbol on a line of its own, spelled as the linker reads it.
fn lines<'a>(symbols: impl Iterator<Item = &'a str>, before: &str, after: &str) -> String {
    symbols.fold(String::new(), |mut lines, symbol| {
        lines.push_str(before);
        lines.push_str(symbol);
        lines.push_str(after);
        lines
    })
}

fn write(path: &Path, contents: &str) {
    std::fs::write(path, contents).unwrap_or_else(|error| panic!("write {}: {error}", path.display()));
}

/// The C API functions the runtime defines in this build: every function
/// `api.h` declares, less those only the crate's wasm support reaches. The
/// wasm store is compiled out without that feature, so its entry points are
/// declared but never defined.
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
    let needle = format!("{prefix}ts_");
    let mut found = Vec::new();
    let mut rest = text;
    while let Some(at) = rest.find(&needle) {
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
        match (rest.find("/*"), rest.find("//")) {
            (Some(block), line) if line.is_none_or(|line| block < line) => {
                out.push_str(&rest[..block]);
                rest = rest[block..].find("*/").map_or("", |end| &rest[block + end + 2..]);
            }
            (_, Some(line)) => {
                out.push_str(&rest[..line]);
                rest = rest[line..].find('\n').map_or("", |end| &rest[line + end..]);
            }
            _ => {
                out.push_str(rest);
                return out;
            }
        }
    }
}
