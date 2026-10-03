import { NATIVE_TARGETS, grammarDisplayName, nativeBinaryName, type GrammarName } from '../grammars.ts';

export const NATIVE_RENDER_TRANSPORT_ABI = 8;

export interface NativeCrateFile {
	readonly path: string;
	readonly contents: string;
}

const json = (value: unknown): string => `${JSON.stringify(value, null, '\t')}\n`;

export function nativeCrateFiles(name: GrammarName): NativeCrateFile[] {
	const v = { name, Name: grammarDisplayName(name) };
	return [
		{
			path: 'Cargo.toml',
			contents: `[package]
name = "sittir-${v.name}"
version.workspace = true
edition.workspace = true
rust-version.workspace = true
license.workspace = true
repository.workspace = true
description = "napi-rs binding for the sittir Rust engine — ${v.Name} grammar."

[lib]
crate-type = ["cdylib", "rlib"]

[features]
default = ["napi-bindings"]
napi-bindings = ["dep:napi", "dep:napi-derive", "sittir-core/napi-bindings"]
debug-transport = ["sittir-core/debug-transport"]

[dependencies]
sittir-core = { path = "../sittir-core" }
napi = { version = "3", default-features = false, features = ["napi4", "serde-json"], optional = true }
napi-derive = { version = "3", optional = true }
serde = { workspace = true }
serde_json = { workspace = true }
tree-sitter = { workspace = true }
tree-sitter-language = { workspace = true }

[build-dependencies]
napi-build = "2"
cc = { workspace = true }
`
		},
		{
			path: 'build.rs',
			contents: `fn main() {
    napi_build::setup();

    let crate_dir = std::path::PathBuf::from(
        std::env::var_os("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR"),
    );
    let grammar_src = crate_dir.join("../../../packages/${v.name}/.sittir/src");

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
            .compile("sittir-tree-sitter-${v.name}-scanner");
        rerun_if_changed_with_includes(&cpp_scanner_path, &mut watched);
    }

    build.compile("sittir-tree-sitter-${v.name}");
}

/// Rebuild when a scanner source, or any file it quotes in an \`#include\`,
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
        let Some(rest) = line.trim_start().strip_prefix("#include \\"") else {
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
`
		},
		{
			path: 'package.json',
			contents: json({
				name: `sittir-${v.name}`,
				private: true,
				version: '0.1.0',
				description: `Grammar-local Rust / napi-rs engine for @sittir/${v.name}.`,
				keywords: ['n-api', 'napi', 'native', v.name, 'sittir', 'tree-sitter'].sort(),
				homepage: 'https://github.com/refactory-lang/sittir#readme',
				license: 'MIT',
				author: 'Pradeep Mouli',
				repository: {
					type: 'git',
					url: 'https://github.com/refactory-lang/sittir.git',
					directory: `rust/crates/sittir-${v.name}`
				},
				scripts: {
					build: `tsx ../../../scripts/build-native.mts ${v.name} --release`,
					'build:debug': `tsx ../../../scripts/build-native.mts ${v.name}`
				},
				devDependencies: { '@napi-rs/cli': '^3.0.0' },
				napi: {
					binaryName: nativeBinaryName(v.name),
					packageName: `sittir-${v.name}`,
					targets: [...NATIVE_TARGETS]
				},
				engines: { node: '>=20.0.0' }
			})
		},
		{
			path: 'src/lib.rs',
			contents: `//! Thin N-API binding for the ${v.Name} grammar.

// Every transport slot position wraps its value in \`SlotValue\`, which adds a
// layer to an already deeply nested generated type graph. Auto-trait
// resolution (\`Unpin\` on the innermost \`Vec\`) exceeds the default limit on
// the larger grammars.
#![recursion_limit = "256"]

pub mod render;

use tree_sitter_language::LanguageFn;

unsafe extern "C" {
    fn tree_sitter_${v.name}() -> *const ();
}

/// The generated \`.sittir\` ${v.Name} parser.
pub const LANGUAGE: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_${v.name}) };

pub fn language() -> tree_sitter::Language {
    LANGUAGE.into()
}

#[cfg(feature = "napi-bindings")]
use sittir_core::engine::EngineGrammar;

#[cfg(feature = "napi-bindings")]
use render::{render_transport_parts, RenderRoot, RENDER_MODULE_HASH};

#[cfg(feature = "napi-bindings")]
const NATIVE_RENDER_TRANSPORT_ABI: u32 = ${NATIVE_RENDER_TRANSPORT_ABI};

#[derive(Clone, Copy, Default)]
pub struct ${v.Name}Grammar;

#[cfg(feature = "napi-bindings")]
impl EngineGrammar for ${v.Name}Grammar {
    fn configure_parser(self, parser: &mut tree_sitter::Parser) -> std::result::Result<(), String> {
        let language = crate::language();
        parser
            .set_language(&language)
            .map_err(|e| format!("failed to set parser language: {e}"))
    }

    fn render_module_hash(self) -> &'static str {
        RENDER_MODULE_HASH
    }
}

impl sittir_core::read_untyped_node::ReadModel for ${v.Name}Grammar {
    fn wire_slot(
        &self,
        parent: sittir_core::types::KindId,
        field: Option<&str>,
        child: &str,
    ) -> Option<&'static str> {
        render::kind_ids::wire_slot(parent, field, child)
    }

    fn inner_gap_key(&self, kind: sittir_core::types::KindId, preceding_tokens: u16) -> Option<&'static str> {
        render::kind_ids::inner_gap_key(kind, preceding_tokens)
    }

    fn stores_scalar(
        &self,
        parent: sittir_core::types::KindId,
        field: Option<&str>,
        child: sittir_core::types::KindId,
    ) -> bool {
        render::kind_ids::stores_scalar(parent, field, child)
    }
}

// The engine class itself — parse, read, render, edits, and the live-tree
// table — is defined once in \`sittir_core::napi_engine\`.
#[cfg(feature = "napi-bindings")]
sittir_core::napi_engine!(
    ${v.Name}Grammar,
    RenderRoot,
    render::options::Options,
    render_transport_parts,
    NATIVE_RENDER_TRANSPORT_ABI,
    render::options::defaults,
    render::options::WHITESPACE,
    render::options::WHITESPACE_KINDS
);
`
		}
	];
}
