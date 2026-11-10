import { NATIVE_NAPI_CONFIG, NATIVE_TARGETS, grammarDisplayName, nativeBinaryName, nativePlatformPackage, nodeRangeOfNodeApi, type GrammarName } from '../grammars.ts';
import { NATIVE_PROFILE_FLAGS, type NativeProfile } from '../scripts/native-binary-freshness.ts';
import { TRIVIA_NODE } from './render-module.ts';

export const NATIVE_RENDER_NODE_ABI = 26;

export interface NativeCrateFile {
	readonly path: string;
	readonly contents: string;
}

const json = (value: unknown): string => `${JSON.stringify(value, null, '\t')}\n`;

const buildNative = (grammar: GrammarName, profile: NativeProfile): string =>
	['tsx ../../../scripts/build-native.mts', grammar, ...NATIVE_PROFILE_FLAGS[profile]].join(' ');

export function nativeCrateFiles(name: GrammarName, nodeApiLevel: number, parserName: string = name): NativeCrateFile[] {
	const v = { name, parserName, Name: grammarDisplayName(name) };
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
arena = ["sittir-core/arena"]

[dependencies]
sittir-core = { path = "../sittir-core" }
sittir-engine = { workspace = true }
napi = { workspace = true, features = ["serde-json"], optional = true }
napi-derive = { workspace = true, optional = true }
serde = { workspace = true }
serde_json = { workspace = true }
tree-sitter-language = { workspace = true }

[build-dependencies]
napi-build = { workspace = true }
cc = { workspace = true }

[lints]
workspace = true
`
		},
		{
			path: 'build.rs',
			contents: `fn main() {
    napi_build::setup();

    // The addon finds the engine and std libraries shipped in its own folder.
    match std::env::var("CARGO_CFG_TARGET_OS").as_deref() {
        Ok("macos") => println!("cargo:rustc-cdylib-link-arg=-Wl,-rpath,@loader_path"),
        Ok("linux") => {
            println!("cargo:rustc-cdylib-link-arg=-Wl,-rpath,$ORIGIN");
            println!("cargo:rustc-cdylib-link-arg=-Wl,--enable-new-dtags");
        }
        _ => {}
    }

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
    allocate_through_runtime(&mut build);

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
        let mut cpp = cc::Build::new();
        cpp.cpp(true).include(&grammar_src).file(&cpp_scanner_path);
        allocate_through_runtime(&mut cpp);
        cpp.compile("sittir-tree-sitter-${v.name}-scanner");
        rerun_if_changed_with_includes(&cpp_scanner_path, &mut watched);
    }

    build.compile("sittir-tree-sitter-${v.name}");
}

/// A scanner allocates through the tree-sitter runtime's allocator slots,
/// which the engine library exports and names to this build. MSVC reaches
/// data in another DLL only through its import slot.
fn allocate_through_runtime(build: &mut cc::Build) {
    build.define("TREE_SITTER_REUSE_ALLOCATOR", None);
    if std::env::var("CARGO_CFG_TARGET_ENV").as_deref() == Ok("msvc") {
        let slots = std::env::var("DEP_SITTIR_ENGINE_ALLOCATOR_SLOTS").expect("the engine names its allocator slots");
        for slot in slots.split(',') {
            build.define(slot, format!("(*__imp_{slot})").as_str());
        }
    }
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
					build: buildNative(v.name, 'release'),
					'build:debug': buildNative(v.name, 'dev'),
					'build:gate': buildNative(v.name, 'gate')
				},
				devDependencies: { '@napi-rs/cli': 'catalog:' },
				engines: { node: nodeRangeOfNodeApi(nodeApiLevel) }
			})
		},
		{
			path: NATIVE_NAPI_CONFIG,
			contents: json({
				binaryName: nativeBinaryName(v.name),
				packageName: nativePlatformPackage(v.name),
				targets: [...NATIVE_TARGETS]
			})
		},
		{
			path: 'src/lib.rs',
			contents: `//! Thin N-API binding for the ${v.Name} grammar.

// Every node slot position wraps its value in \`SlotValue\`, which adds a
// layer to an already deeply nested generated type graph. Auto-trait
// resolution (\`Unpin\` on the innermost \`Vec\`) exceeds the default limit on
// the larger grammars.
#![recursion_limit = "256"]

pub mod render;

use sittir_core::tree_sitter;
use tree_sitter_language::LanguageFn;

unsafe extern "C" {
    fn tree_sitter_${v.parserName}() -> *const ();
}

/// The generated \`.sittir\` ${v.Name} parser.
// SAFETY: \`tree_sitter_${v.parserName}\` is the generated parser's entry point, compiled
// and linked by build.rs; it returns the parser's static \`TSLanguage\`, which is
// the pointer \`LanguageFn::from_raw\` expects.
pub const LANGUAGE: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_${v.parserName}) };

#[must_use]
pub fn language() -> tree_sitter::Language {
    LANGUAGE.into()
}

use sittir_core::engine::EngineGrammar;

use render::{render_node_parts, AnyNode, RENDER_MODULE_HASH};

#[cfg(feature = "napi-bindings")]
use render::RenderRoot;

#[cfg(feature = "napi-bindings")]
const NATIVE_RENDER_NODE_ABI: u32 = ${NATIVE_RENDER_NODE_ABI};

#[derive(Clone, Copy, Default)]
pub struct ${v.Name}Grammar;

impl EngineGrammar for ${v.Name}Grammar {
    const KIND_BITS: u32 = render::KIND_BITS;

    fn configure_parser(self, parser: &mut tree_sitter::Parser) -> std::result::Result<(), String> {
        let language = crate::language();
        parser
            .set_language(&language)
            .map_err(|e| format!("failed to set parser language: {e}"))
    }

    fn render_module_hash(self) -> &'static str {
        RENDER_MODULE_HASH
    }

    fn kind_name(self, kind: sittir_core::types::KindId) -> &'static str {
        render::kind_ids::kind_name_from_id(kind)
    }

    fn shows(self) -> fn(sittir_core::types::KindId) -> bool {
        <AnyNode as sittir_core::read::ReadNode>::shows
    }

    fn relaxes(self) -> fn(sittir_core::types::KindId, sittir_core::types::KindId) -> bool {
        render::kind_ids::relaxes
    }

    type Trivia = render::node::${TRIVIA_NODE};

    fn whitespace(self) -> (&'static sittir_core::render::WhitespaceTable, &'static [sittir_core::types::KindId]) {
        (&render::options::WHITESPACE, render::options::LAYOUT_KINDS)
    }

    fn surface_kinds(self) -> sittir_core::trivia_table::SurfaceKinds {
        render::kind_ids::SURFACE_KINDS
    }

    fn option_tables(self) -> &'static sittir_core::options::OptionTables {
        &<render::options::Sites as sittir_core::options::OptionSites>::TABLES
    }

    fn render_read(self, cursor: &mut tree_sitter::TreeCursor<'_>, depth: sittir_core::read::Depth, ctx: &mut sittir_core::read::ReadCtx<'_>, render: &sittir_core::prepare::RenderContext<'_>, baseline: &mut sittir_core::baseline::Baseline) -> std::result::Result<(), String> {
        let node = sittir_core::read::read_from::<AnyNode>(cursor, ctx, depth)
            .map_err(|refusal| refusal.describe(&|kind| self.kind_name(kind)))?;
        render_node_parts(sittir_core::SlotValue::Node(node), render, Some(baseline)).map(|_| ()).map_err(|error| error.to_string())
    }

    fn slot_routes(self, nodes: &mut dyn sittir_core::nodes::Nodes<'_>, at: &sittir_core::nodes::Kid) -> Option<sittir_core::read::Routed> {
        <AnyNode as sittir_core::read::ReadNode>::routes(nodes, at)
    }

    fn router(self, grammar: sittir_core::types::KindId, display: sittir_core::types::KindId) -> Option<sittir_core::read::Router> {
        <AnyNode as sittir_core::read::ReadNode>::router(grammar, display)
    }

    fn admits(self, grammar: sittir_core::types::KindId, display: sittir_core::types::KindId) -> bool {
        <AnyNode as sittir_core::read::ReadNode>::admits(grammar, display)
    }

    fn unit_id(self, nodes: &mut dyn sittir_core::nodes::Nodes<'_>, at: &sittir_core::nodes::Kid) -> Option<sittir_core::types::KindId> {
        <AnyNode as sittir_core::read::ReadNode>::unit_id(nodes, at)
    }

    fn delimiter(self, nodes: &mut dyn sittir_core::nodes::Nodes<'_>, at: &sittir_core::nodes::Kid) -> Option<sittir_core::types::Delimiter> {
        <AnyNode as sittir_core::read::ReadNode>::delimiter(nodes, at)
    }

    sittir_core::records_codec! {
        fn render_record_read(
            self,
            read: sittir_core::arena::RecordRead<'_>,
            store: &sittir_core::trivia_store::TriviaStore<Self::Trivia>,
            render: &sittir_core::prepare::RenderContext<'_>,
            baseline: &mut sittir_core::baseline::Baseline,
        ) -> Option<std::result::Result<(), String>> {
            Some(sittir_core::arena::render_record_read::<Self, AnyNode>(self, read, store, render, baseline))
        }
    }
}

sittir_core::records_codec! {
    impl sittir_core::arena::RecordGrammar for ${v.Name}Grammar {
        fn render_record(
            self,
            root: sittir_core::arena::CellAt,
            trees: &mut dyn sittir_core::arena::RecordTrees,
            built: &dyn sittir_core::arena::ArenaRead,
            store: &sittir_core::trivia_store::TriviaStore<Self::Trivia>,
            ctx: &sittir_core::prepare::RenderContext<'_>,
            recording: Option<sittir_core::arena::Recording<'_>>,
        ) -> std::result::Result<String, sittir_core::render::RenderError> {
            render::node::render_record(root, trees, built, store, ctx, recording)
        }

        fn render_entry(
            self,
            root: sittir_core::arena::CellAt,
            trees: &mut dyn sittir_core::arena::RecordTrees,
            built: &dyn sittir_core::arena::ArenaRead,
            store: &sittir_core::trivia_store::TriviaStore<Self::Trivia>,
            ctx: &sittir_core::prepare::RenderContext<'_>,
            w: &mut dyn sittir_core::render::RenderSink,
        ) -> sittir_core::render::RenderResult {
            render::node::render_entry_record(root, trees, built, store, ctx, w)
        }

        fn shape(kind: sittir_core::types::KindId) -> Option<sittir_core::arena::RecordShape> {
            <AnyNode as sittir_core::arena::RecordCells>::shape(kind)
        }

        fn slot_key(kind: sittir_core::types::KindId, word: u32) -> Option<&'static str> {
            <AnyNode as sittir_core::arena::PrepareRecord<Self::Trivia>>::slot_key(kind, word)
        }

        fn slot_word(kind: sittir_core::types::KindId, key: &str) -> Option<u32> {
            <AnyNode as sittir_core::arena::PrepareRecord<Self::Trivia>>::slot_word(kind, key)
        }
    }
}

// The engine class itself — parse, read, render, edits, and the live-tree
// table — is defined once in \`sittir_core::napi_engine\`.
#[cfg(feature = "napi-bindings")]
sittir_core::napi_engine!(
    ${v.Name}Grammar,
    RenderRoot,
    AnyNode,
    render::options::Options,
    render_node_parts,
    NATIVE_RENDER_NODE_ABI,
    render::options::defaults
);
`
		}
	];
}
