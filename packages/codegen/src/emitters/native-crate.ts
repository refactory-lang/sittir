import { grammarDisplayName, type GrammarName } from '../grammars.ts';

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
        .flag_if_supported("-Wno-unused-value");

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

    build.compile("sittir-tree-sitter-${v.name}");
}
`
		},
		{
			path: 'package.json',
			contents: json({
				name: `sittir-${v.name}`,
				version: '0.1.0',
				description: `Grammar-local Rust / napi-rs engine for @sittir/${v.name}.`,
				keywords: ['n-api', 'napi', 'native', v.name, 'sittir', 'tree-sitter'],
				homepage: 'https://github.com/refactory-lang/sittir#readme',
				license: 'MIT',
				author: 'Pradeep Mouli',
				repository: {
					type: 'git',
					url: 'https://github.com/refactory-lang/sittir.git',
					directory: `rust/crates/sittir-${v.name}`
				},
				files: ['index.js', 'index.d.ts'],
				main: 'index.js',
				types: 'index.d.ts',
				scripts: {
					artifacts: 'napi artifacts',
					build: 'napi build --platform --release',
					'build:debug': 'napi build --platform',
					prepublishOnly: 'napi prepublish -t npm'
				},
				devDependencies: { '@napi-rs/cli': '^3.0.0' },
				napi: {
					binaryName: `sittir-${v.name}`,
					packageName: `sittir-${v.name}`,
					targets: [
						'x86_64-apple-darwin',
						'aarch64-apple-darwin',
						'x86_64-unknown-linux-gnu',
						'x86_64-unknown-linux-musl',
						'aarch64-unknown-linux-gnu',
						'aarch64-unknown-linux-musl',
						'x86_64-pc-windows-msvc',
						'aarch64-pc-windows-msvc'
					]
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
const NATIVE_RENDER_TRANSPORT_ABI: u32 = 2;

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

impl sittir_core::read_node::ReadModel for ${v.Name}Grammar {
    fn is_text_kind(&self, kind: sittir_core::types::KindId) -> bool {
        render::kind_ids::is_text_kind(kind)
    }

    fn is_slot_separator(
        &self,
        parent: sittir_core::types::KindId,
        field: &str,
        child: sittir_core::types::KindId,
    ) -> bool {
        render::kind_ids::is_slot_separator(parent, field, child)
    }

    fn is_alias_envelope(&self, kind: sittir_core::types::KindId) -> bool {
        render::kind_ids::is_alias_envelope(kind)
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
    render::options::defaults
);
`
		}
	];
}
