import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { AssembledBranch, AssembledKeyword, AssembledPattern } from '../compiler/node-map.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';
import type { SeqRule } from '../compiler/rule.ts';
import type { NodeMap } from '../compiler/types.ts';
import { emitHashFiles, emitRenderModule } from '../emitters/render-module.ts';
import { fixturesOutputPath } from '../emitters/parity-fixtures.ts';

const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url)).replace(/\/$/, '');

function makeMinimalNodeMap(): NodeMap {
	const nameRule: SeqRule = {
		type: 'seq',
		members: [
			{
				type: 'field',
				name: 'name',
				content: { type: 'symbol', name: '_identifier' }
			}
		]
	};
	const nodes = new Map<string, AssembledBranch | AssembledPattern | AssembledKeyword>([
		['function_item', new AssembledBranch('function_item', nameRule, nameRule)],
		['identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' })],
		['kw_fn', new AssembledKeyword('kw_fn', { type: 'string', value: 'fn' })]
	]);
	return {
		grammar: 'rust',
		grammarSha: 'test-sha',
		rules: {},
		nodes,
		externals: new Set(),
		word: undefined
	} as unknown as NodeMap;
}

function makeRequiredChildrenNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: 'seq',
		members: [{ type: 'symbol', name: 'identifier' }]
	};
	const nodes = new Map<string, AssembledBranch | AssembledPattern>([
		['required_child_parent', new AssembledBranch('required_child_parent', parentRule, parentRule)],
		['identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' })]
	]);
	return {
		grammar: 'rust',
		grammarSha: 'test-sha',
		rules: {},
		nodes,
		externals: new Set(),
		word: undefined
	} as unknown as NodeMap;
}

function makeOptionalChildrenNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: 'seq',
		members: [
			{
				type: 'optional',
				content: { type: 'symbol', name: 'identifier' }
			}
		]
	};
	const nodes = new Map<string, AssembledBranch | AssembledPattern>([
		['optional_child_parent', new AssembledBranch('optional_child_parent', parentRule, parentRule)],
		['identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' })]
	]);
	return {
		grammar: 'rust',
		grammarSha: 'test-sha',
		rules: {},
		nodes,
		externals: new Set(),
		word: undefined
	} as unknown as NodeMap;
}

function makeRepeatedChildrenNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: 'seq',
		members: [
			{
				type: 'repeat1',
				content: { type: 'symbol', name: 'identifier' }
			}
		]
	};
	const nodes = new Map<string, AssembledBranch | AssembledPattern>([
		['repeated_child_parent', new AssembledBranch('repeated_child_parent', parentRule, parentRule)],
		['identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' })]
	]);
	return {
		grammar: 'rust',
		grammarSha: 'test-sha',
		rules: {},
		nodes,
		externals: new Set(),
		word: undefined
	} as unknown as NodeMap;
}

function makeTokenOnlyChildrenNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: 'seq',
		members: [{ type: 'symbol', name: 'kw_j' }]
	};
	const nodes = new Map<string, AssembledBranch | AssembledKeyword>([
		['token_child_parent', new AssembledBranch('token_child_parent', parentRule, parentRule)],
		['kw_j', new AssembledKeyword('kw_j', { type: 'string', value: 'jjjj' })]
	]);
	return {
		grammar: 'rust',
		grammarSha: 'test-sha',
		rules: {},
		nodes,
		externals: new Set(),
		word: undefined
	} as unknown as NodeMap;
}

function makeTokenOnlyGeneratedIdTables(): GeneratedIdTables {
	return {
		kindIds: {
			token_child_parent: {
				id: 1,
				parser: {
					cSymbol: 'sym_token_child_parent',
					parserName: 'token_child_parent',
					anon: false,
					aux: false,
					alias: false,
					hidden: false
				}
			},
			kw_j: {
				id: 2,
				parser: {
					cSymbol: 'anon_sym_jjjj',
					parserName: 'kw_j',
					anon: true,
					aux: false,
					alias: false,
					hidden: false
				}
			}
		},
		sourceArtifact: 'parser.wasm'
	};
}

function assertRustRenderRuntimeBehavior(): void {
	const emitted = emitRenderModule(
		'rust',
		[
			{
				filename: 'token_child_parent.jinja',
				content: '{{ children }}'
			}
		],
		makeTokenOnlyChildrenNodeMap(),
		makeTokenOnlyGeneratedIdTables()
	);
	const runtimeDir = resolve(repoRoot, 'scratch/render-module-runtime-fixture');
	rmSync(runtimeDir, { recursive: true, force: true });
	try {
		mkdirSync(resolve(runtimeDir, 'src/render'), { recursive: true });
		mkdirSync(resolve(runtimeDir, 'templates'), { recursive: true });
		mkdirSync(resolve(runtimeDir, 'tests'), { recursive: true });

		writeFileSync(
			resolve(runtimeDir, 'Cargo.toml'),
			`[package]
name = "render_runtime_fixture"
version = "0.0.0"
edition = "2021"

[workspace]

[features]
napi-bindings = []
debug-transport = []

[dependencies]
sittir-core = { path = ${JSON.stringify(resolve(repoRoot, 'rust/crates/sittir-core'))} }
askama = "0.15"
serde = { version = "1", features = ["derive"] }
`
		);
		writeFileSync(resolve(runtimeDir, 'src/lib.rs'), 'pub mod render;\n');
		for (const file of [
			emitted.hashRs,
			emitted.templatesRs,
			emitted.dispatchRs,
			emitted.transportRs,
			emitted.bridgeRs,
			emitted.libRs
		]) {
			writeFileSync(resolve(runtimeDir, 'src/render', basename(file.path)), file.contents);
		}
		writeFileSync(resolve(runtimeDir, 'src/render/kind_ids.rs'), '');
		writeFileSync(resolve(runtimeDir, 'templates/token_child_parent.jinja'), '{{ children }}');
		writeFileSync(
			resolve(runtimeDir, 'tests/runtime.rs'),
			`use render_runtime_fixture::render::render_dispatch;
use sittir_core::types::{KindId, NodeData, Source};

fn node(kind: u16, named: bool, text: Option<&str>, children: Option<Vec<NodeData>>) -> NodeData {
    NodeData {
        type_: KindId(kind),
        source: Source::Factory,
        named,
        fields: None,
        children,
        text: text.map(str::to_string),
        span: None,
        node_handle: None,
        child_index: None,
        trivia_data: None,
    }
}

#[test]
fn token_only_child_renders_exactly() {
    let parent = node(1, true, None, Some(vec![node(2, true, Some("jjjj"), None)]));
    let rendered = render_dispatch(&parent).expect("render succeeds");
    assert_eq!(rendered, "jjjj");
}

#[test]
fn missing_required_children_errors() {
    let parent = node(1, true, None, None);
    let err = render_dispatch(&parent).expect_err("missing required children should fail");
    let message = err.to_string();
    assert!(
        message.contains("missing required field 'children'"),
        "unexpected error: {message}"
    );
}
`
		);

		execFileSync('cargo', ['test', '--quiet'], {
			cwd: runtimeDir,
			stdio: 'pipe'
		});
	} finally {
		rmSync(runtimeDir, { recursive: true, force: true });
	}
}

describe('render pipeline optimization — retained baseline convergence', () => {
	it('emits native render artifacts under rust/crates/sittir-{lang}/src/render', () => {
		const files = [
			{
				filename: 'function_item.jinja',
				content: '{# @generated #}\n{{ name }}'
			}
		] as const;

		const hashes = emitHashFiles('rust', files);
		expect(hashes.hashRs.path).toBe('rust/crates/sittir-rust/src/render/hash.rs');
		expect(hashes.hashTs.path).toBe('packages/rust/src/hash.ts');

		const emitted = emitRenderModule('rust', files, makeMinimalNodeMap());
		expect(emitted.templatesRs.path).toBe('rust/crates/sittir-rust/src/render/templates.rs');
		expect(emitted.libRs.path).toBe('rust/crates/sittir-rust/src/render/mod.rs');
	});

	it('writes extracted parity fixtures beside the grammar native crate', () => {
		expect(fixturesOutputPath('rust')).toBe('rust/crates/sittir-rust/test-fixtures.json');
		expect(fixturesOutputPath('typescript')).toBe('rust/crates/sittir-typescript/test-fixtures.json');
		expect(fixturesOutputPath('python')).toBe('rust/crates/sittir-python/test-fixtures.json');
	});

	it('tracks grammar-owned native crates in the Cargo workspace instead of separate render modules', () => {
		const cargoToml = readFileSync(resolve(repoRoot, 'Cargo.toml'), 'utf8');
		expect(cargoToml).toContain('"rust/crates/sittir-rust"');
		expect(cargoToml).toContain('"rust/crates/sittir-typescript"');
		expect(cargoToml).toContain('"rust/crates/sittir-python"');
	});
});

describe('render pipeline optimization — level 1 borrowed askama views', () => {
	it('emits borrowed model-driven field views from the walker-owned slot contract', () => {
		const files = [
			{
				filename: 'function_item.jinja',
				content: '{# @generated #}\n{% if name | isPresent %}{{ name }}{% endif %} {{ children | join(" ") }}'
			}
		] as const;

		const emitted = emitRenderModule('rust', files, makeMinimalNodeMap());
		expect(emitted.templatesRs.contents).toContain("pub struct FunctionItemTemplate<'a> {");
		// Phase D: field views use SingleNonterminalView (Askama streaming) not bare &'a str.
		// T009: module-level `use` imports — short names.
		expect(emitted.templatesRs.contents).toContain("    pub name: SingleNonterminalView<'a>,");
		expect(emitted.templatesRs.contents).not.toContain("    pub text: &'a str,");
		expect(emitted.templatesRs.contents).not.toContain("    pub variant: &'a str,");
		expect(emitted.templatesRs.contents).not.toContain("    pub children: ListView<'a>,");
		expect(emitted.templatesRs.contents).not.toContain("    pub name_list: &'a [String],");
		expect(emitted.templatesRs.contents).not.toContain('    pub name_leading_sep: bool,');
		expect(emitted.templatesRs.contents).not.toContain('    pub name_trailing_sep: bool,');
		expect(emitted.templatesRs.contents).not.toContain('.cloned().unwrap_or_default()');
	});

	it('emits cardinality-aware children views for singular and repeated child slots', () => {
		const required = emitRenderModule(
			'rust',
			[
				{
					filename: 'required_child_parent.jinja',
					content: '{# @generated #}\n{{ children }}'
				}
			],
			makeRequiredChildrenNodeMap()
		);
		const optional = emitRenderModule(
			'rust',
			[
				{
					filename: 'optional_child_parent.jinja',
					content: '{# @generated #}\n{% if children | isPresent %}{{ children }}{% endif %}'
				}
			],
			makeOptionalChildrenNodeMap()
		);
		const repeated = emitRenderModule(
			'rust',
			[
				{
					filename: 'repeated_child_parent.jinja',
					content: '{# @generated #}\n{{ children | join(" ") }}'
				}
			],
			makeRepeatedChildrenNodeMap()
		);

		expect(required.templatesRs.contents).toContain("pub struct RequiredChildParentTemplate<'a> {");
		expect(required.templatesRs.contents).toContain("    pub children: SingleNonterminalView<'a>,");
		expect(optional.templatesRs.contents).toContain("pub struct OptionalChildParentTemplate<'a> {");
		expect(optional.templatesRs.contents).toContain("    pub children: OptionalNonterminalView<'a>,");
		expect(optional.bridgeRs.contents).toContain('if children.is_empty() {');
		expect(optional.bridgeRs.contents).toContain('return Ok(ResolvedField::default());');
		expect(repeated.templatesRs.contents).toContain("pub struct RepeatedChildParentTemplate<'a> {");
		expect(repeated.templatesRs.contents).toContain("    pub children: ListNonterminalView<'a>,");
	});

	it('keeps token-only singular children on direct transport views so jjjj does not widen', () => {
		const emitted = emitRenderModule(
			'rust',
			[
				{
					filename: 'token_child_parent.jinja',
					content: '{{ children }}'
				}
			],
			makeTokenOnlyChildrenNodeMap()
		);

		expect(emitted.templatesRs.contents).toContain("    pub children: SingleNonterminalView<'a>,");
		expect(emitted.transportRs.contents).toContain(
			'children: SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.children)),'
		);
		expect(emitted.transportRs.contents).not.toContain('let children_buf: Vec<::sittir_core::filters::Renderable');
		assertRustRenderRuntimeBehavior();
	}, 20_000);
});

describe('render pipeline optimization — level 3 direct render path', () => {
	it('emits direct node-data render helpers and per-kind render functions instead of TemplateContext + GrammarMeta dispatch', () => {
		const files = [
			{
				filename: 'function_item.jinja',
				content: '{# @generated #}\n{% if name | isPresent %}{{ name }}{% endif %}'
			}
		] as const;

		// Phase D: render_dispatch uses numeric KindId matching (Phase C migration).
		// Supply a minimal generatedIdTables so the emitter emits a numeric arm.
		const generatedIdTables: GeneratedIdTables = {
			kindIds: {
				function_item: {
					id: 42,
					parser: {
						cSymbol: 'sym_function_item',
						parserName: 'function_item',
						anon: false,
						aux: false,
						alias: false,
						hidden: false
					}
				},
				identifier: {
					id: 1,
					parser: {
						cSymbol: 'sym_identifier',
						parserName: 'identifier',
						anon: false,
						aux: false,
						alias: false,
						hidden: false
					}
				},
				kw_fn: {
					id: 2,
					parser: {
						cSymbol: 'anon_sym_fn',
						parserName: 'kw_fn',
						anon: true,
						aux: false,
						alias: false,
						hidden: false
					}
				}
			},
			sourceArtifact: 'parser.wasm'
		};

		const emitted = emitRenderModule('rust', files, makeMinimalNodeMap(), generatedIdTables);

		expect(emitted.templatesRs.contents).toContain(
			'#![allow(dead_code, unused_imports, non_snake_case, non_camel_case_types, unused_mut, unused_variables)]'
		);
		// Bridge helpers live in bridge.rs (spec 024 split).
		expect(emitted.bridgeRs.contents).toContain('fn resolve_leaf');
		expect(emitted.bridgeRs.contents).toContain('fn resolve_optional');
		expect(emitted.bridgeRs.contents).toContain('fn resolve_required');
		expect(emitted.bridgeRs.contents).toContain('fn missing_required_field');
		expect(emitted.bridgeRs.contents).toContain("enum SlotAccessor<'a>");
		expect(emitted.bridgeRs.contents).toContain('fn resolve_slot(');
		expect(emitted.bridgeRs.contents).not.toContain('fn resolve_unnamed_children');
		expect(emitted.bridgeRs.contents).not.toContain('fn resolve_children');
		expect(emitted.bridgeRs.contents).not.toContain('consumed_fields');
		// render_dispatch is a thin shim in dispatch.rs delegating to bridge::render_nodedata_into.
		expect(emitted.dispatchRs.contents).toContain('pub fn render_dispatch(node: &NodeData)');
		expect(emitted.dispatchRs.contents).toContain('render_nodedata_into(node, &mut buf)');
		// Per-kind render functions are inlined into bridge::render_nodedata_into.
		expect(emitted.bridgeRs.contents).toContain('fn render_nodedata_into(');
		// Phase D: dispatch inlined into bridge uses numeric KindId (42).
		expect(emitted.bridgeRs.contents).toContain('42 =>');
		expect(emitted.bridgeRs.contents).toContain('resolve_slot(node, SlotAccessor::Field("name"), true)');
		expect(emitted.bridgeRs.contents).not.toContain('resolve_slot(node, SlotAccessor::Children');
		expect(emitted.bridgeRs.contents).toContain(
			`format!("render_nodedata_into: missing required field '{}' on '{}'", name, node.type_)`
		);
		// templates.rs has no render functions — only struct definitions.
		expect(emitted.templatesRs.contents).not.toContain('fn render_function_item(');
		expect(emitted.templatesRs.contents).not.toContain('TemplateContext');
		expect(emitted.templatesRs.contents).not.toContain('pub struct RustGrammarMeta');
		// mod.rs re-exports from dispatch and transport (spec 024 split).
		expect(emitted.libRs.contents).toContain('pub use dispatch::render_dispatch;');
		expect(emitted.libRs.contents).toContain(
			'pub use transport::{render_transport, render_transport_dispatch, render_transport_parts, AnyTransport};'
		);
		expect(emitted.libRs.contents).not.toContain('RustGrammarMeta');
	});

	it('marks unguarded required template fields as hard-required', () => {
		const files = [
			{
				filename: 'function_item.jinja',
				content: '{# @generated #}\n{{ name }} {{ text }}'
			}
		] as const;

		const generatedIdTables: GeneratedIdTables = {
			kindIds: {
				function_item: {
					id: 42,
					parser: {
						cSymbol: 'sym_function_item',
						parserName: 'function_item',
						anon: false,
						aux: false,
						alias: false,
						hidden: false
					}
				}
			},
			sourceArtifact: 'parser.wasm'
		};

		const emitted = emitRenderModule('rust', files, makeMinimalNodeMap(), generatedIdTables);

		// Per-kind render logic is inlined into bridge::render_nodedata_into.
		expect(emitted.bridgeRs.contents).toContain('resolve_slot(node, SlotAccessor::Field("name"), true)');
	});

	it('routes unnamed children through the shared slot accessor path', () => {
		const generatedIdTables: GeneratedIdTables = {
			kindIds: {
				required_child_parent: {
					id: 7,
					parser: {
						cSymbol: 'sym_required_child_parent',
						parserName: 'required_child_parent',
						anon: false,
						aux: false,
						alias: false,
						hidden: false
					}
				},
				identifier: {
					id: 1,
					parser: {
						cSymbol: 'sym_identifier',
						parserName: 'identifier',
						anon: false,
						aux: false,
						alias: false,
						hidden: false
					}
				}
			},
			sourceArtifact: 'parser.wasm'
		};

		const emitted = emitRenderModule(
			'rust',
			[
				{
					filename: 'required_child_parent.jinja',
					content: '{# @generated #}\n{{ children }}'
				}
			],
			makeRequiredChildrenNodeMap(),
			generatedIdTables
		);

		expect(emitted.bridgeRs.contents).toContain('resolve_slot(node, SlotAccessor::Children, true)');
		expect(emitted.bridgeRs.contents).not.toContain('fn resolve_unnamed_children');
		expect(emitted.bridgeRs.contents).not.toContain('fn resolve_children');
	});

	it('removes the shared prepare bridge while keeping the native render boundary unchanged', () => {
		const coreLib = readFileSync(resolve(repoRoot, 'rust/crates/sittir-core/src/lib.rs'), 'utf8');
		const rustNapi = readFileSync(resolve(repoRoot, 'rust/crates/sittir-rust/src/lib.rs'), 'utf8');

		expect(coreLib).not.toContain('pub mod prepare;');
		expect(rustNapi).toContain('render_nodedata_into(node');
		expect(rustNapi).not.toContain('build_template_context');
	});
});
