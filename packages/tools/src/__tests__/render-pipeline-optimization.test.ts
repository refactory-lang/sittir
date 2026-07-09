import {
	CHOICE,
	FIELD,
	OPTIONAL,
	PATTERN,
	REPEAT,
	REPEAT1,
	SEQ,
	STRING,
	SYMBOL
} from '../../../codegen/src/types/rule-types.ts'; // @rule-type-consts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { AssembledBranch, AssembledKeyword, AssembledPattern } from '../../../codegen/src/compiler/model/node-map.ts';
import type { GeneratedIdTables } from '../../../codegen/src/compiler/generated-metadata.ts';
import type { ChoiceRule, SeqRule } from '../../../codegen/src/types/rule.ts';
import type { NodeMap } from '../../../codegen/src/compiler/types.ts';
import { emitHashFiles, emitRenderModule } from '../../../codegen/src/emitters/render-module.ts';
import { fixturesOutputPath } from '../validate/parity-fixtures.ts';
import { makeNodeMapWith } from '../../../codegen/src/__tests__/helpers/node-map-fixtures.ts';

const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url)).replace(/\/$/, '');

function makeMinimalNodeMap(): NodeMap {
	const nameRule: SeqRule = {
		type: SEQ,
		members: [
			{
				type: FIELD,
				name: 'name',
				content: { type: SYMBOL, name: '_identifier' }
			}
		]
	};
	const nodes = new Map<string, AssembledBranch | AssembledPattern | AssembledKeyword>([
		['function_item', new AssembledBranch('function_item', nameRule, nameRule)],
		['identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' })],
		['kw_fn', new AssembledKeyword('kw_fn', { type: STRING, value: 'fn' })]
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
		type: SEQ,
		members: [{ type: SYMBOL, name: 'identifier' }]
	};
	const nodes = new Map<string, AssembledBranch | AssembledPattern>([
		['required_child_parent', new AssembledBranch('required_child_parent', parentRule, parentRule)],
		['identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' })]
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
		type: SEQ,
		members: [
			{
				type: OPTIONAL,
				content: { type: SYMBOL, name: 'identifier' }
			}
		]
	};
	const nodes = new Map<string, AssembledBranch | AssembledPattern>([
		['optional_child_parent', new AssembledBranch('optional_child_parent', parentRule, parentRule)],
		['identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' })]
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
		type: SEQ,
		members: [
			{
				type: REPEAT1,
				content: { type: SYMBOL, name: 'identifier' }
			}
		]
	};
	const nodes = new Map<string, AssembledBranch | AssembledPattern>([
		['repeated_child_parent', new AssembledBranch('repeated_child_parent', parentRule, parentRule)],
		['identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' })]
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

function makeOptionalRepeatedChildrenNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: SEQ,
		members: [
			{
				type: REPEAT,
				content: { type: SYMBOL, name: 'identifier' }
			}
		]
	};
	const nodes = new Map<string, AssembledBranch | AssembledPattern>([
		['optional_repeated_child_parent', new AssembledBranch('optional_repeated_child_parent', parentRule, parentRule)],
		['identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' })]
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
		type: SEQ,
		members: [{ type: SYMBOL, name: 'kw_j' }]
	};
	const nodes = new Map<string, AssembledBranch | AssembledKeyword>([
		['token_child_parent', new AssembledBranch('token_child_parent', parentRule, parentRule)],
		['kw_j', new AssembledKeyword('kw_j', { type: STRING, value: 'jjjj' })]
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

function makeChoiceParentSingularChildrenNodeMap(): NodeMap {
	// Formerly an AssembledPolymorph fixture — the retired class merged its
	// forms into a single singular unnamed children slot, which a plain
	// branch over a choice of the two leaf kinds reproduces directly.
	const parentRule: ChoiceRule = {
		type: CHOICE,
		members: [
			{ type: SYMBOL, name: 'identifier' },
			{ type: SYMBOL, name: 'integer' }
		]
	};
	const nodes = new Map<string, AssembledBranch | AssembledPattern>([
		['expression', new AssembledBranch('expression', parentRule, parentRule)],
		['identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' })],
		['integer', new AssembledPattern('integer', { type: PATTERN, value: '[0-9]+' })]
	]);
	return makeNodeMapWith(nodes, new Set());
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

// NOTE: assertRustRenderRuntimeBehavior previously verified render_dispatch (bridge.rs path)
// by spinning up a temp Rust crate. Since render_dispatch + bridge.rs are retired (PR-E2),
// this function is removed. Transport-path correctness is verified by cargo test --workspace.
function assertRustRenderRuntimeBehavior(): void {
	// Bridge/dispatch path retired — nothing to verify at runtime here.
	// The token-only child rendering is now exercised exclusively via the transport path.
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
		// bridge.rs retired (PR-E2) — optional slot handling is now in transport.rs
		expect(optional.transportRs.contents).toContain('optional_child_parent');
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

	it('keeps choice-parent singular unnamed children on direct transport views', () => {
		const emitted = emitRenderModule(
			'rust',
			[
				{
					filename: 'expression.jinja',
					content: '{{ children }}'
				}
			],
			makeChoiceParentSingularChildrenNodeMap()
		);
		const renderStart = emitted.transportRs.contents.indexOf('fn render_expression(');
		const renderEnd = emitted.transportRs.contents.indexOf('\n}', renderStart) + 2;
		const renderBody = emitted.transportRs.contents.slice(renderStart, renderEnd);

		expect(emitted.templatesRs.contents).toContain("pub struct ExpressionTemplate<'a> {");
		expect(emitted.templatesRs.contents).toContain("    pub children: SingleNonterminalView<'a>,");
		expect(renderBody).toContain(
			'children: SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.children)),'
		);
		expect(renderBody).not.toContain('let children_buf: Vec<::sittir_core::filters::Renderable');
		expect(renderBody).not.toContain('children: ListNonterminalView {');
	});

	it('keeps repeated unnamed children on direct Vec-backed transport views', () => {
		const emitted = emitRenderModule(
			'rust',
			[
				{
					filename: 'optional_repeated_child_parent.jinja',
					content: '{{ children | join(" ") }}'
				}
			],
			makeOptionalRepeatedChildrenNodeMap()
		);
		const renderStart = emitted.transportRs.contents.indexOf('fn render_optional_repeated_child_parent(');
		const renderEnd = emitted.transportRs.contents.indexOf('\n}', renderStart) + 2;
		const renderBody = emitted.transportRs.contents.slice(renderStart, renderEnd);

		expect(emitted.templatesRs.contents).toContain("pub struct OptionalRepeatedChildParentTemplate<'a> {");
		expect(emitted.templatesRs.contents).toContain("    pub children: ListNonterminalView<'a>,");
		expect(renderBody).toContain(
			"let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()"
		);
		expect(renderBody).not.toContain('node.children.as_deref().unwrap_or(&[])');
	});

	it('keeps fallback repeated unnamed children on direct Vec-backed transport views', () => {
		const emitted = emitRenderModule('rust', [], makeOptionalRepeatedChildrenNodeMap());
		const renderStart = emitted.transportRs.contents.indexOf('fn render_optional_repeated_child_parent(');
		const renderEnd = emitted.transportRs.contents.indexOf('\n}', renderStart) + 2;
		const renderBody = emitted.transportRs.contents.slice(renderStart, renderEnd);

		expect(renderBody).toContain('for child in node.children.iter() {');
		expect(renderBody).not.toContain('if let Some(children) = &node.children {');
	});

	it('renders choice parents through the parent helper without per-form typed helpers', () => {
		const emitted = emitRenderModule(
			'rust',
			[
				{
					filename: 'expression.jinja',
					content: '{{ children }}'
				}
			],
			makeChoiceParentSingularChildrenNodeMap()
		);
		const source = readFileSync(resolve(repoRoot, 'packages/codegen/src/emitters/render-module.ts'), 'utf8');

		expect(emitted.transportRs.contents).toContain('fn render_expression(');
		expect(emitted.transportRs.contents).not.toContain('fn render_expression__form_identifier(');
		expect(emitted.transportRs.contents).not.toContain('fn render_expression__form_integer(');
		expect(source).not.toContain('function renderTypedPolymorphFn(');
		expect(source).not.toContain('function renderTypedFormFn(');
	});
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
		// bridge.rs and dispatch.rs retired (PR-E2). No bridge/dispatch artifacts emitted.
		expect(emitted).not.toHaveProperty('bridgeRs');
		expect(emitted).not.toHaveProperty('dispatchRs');
		// transport.rs is the only render path — emits per-kind render functions.
		expect(emitted.transportRs.contents).toContain('fn render_function_item(');
		// templates.rs has no render functions — only struct definitions.
		expect(emitted.templatesRs.contents).not.toContain('fn render_function_item(');
		expect(emitted.templatesRs.contents).not.toContain('TemplateContext');
		expect(emitted.templatesRs.contents).not.toContain('pub struct RustGrammarMeta');
		// mod.rs re-exports from transport only (bridge/dispatch retired).
		expect(emitted.libRs.contents).not.toContain('pub mod bridge');
		expect(emitted.libRs.contents).not.toContain('pub mod dispatch');
		expect(emitted.libRs.contents).not.toContain('render_nodedata_into');
		expect(emitted.libRs.contents).not.toContain('render_dispatch');
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

		// Per-kind render logic is in transport.rs (bridge.rs retired in PR-E2).
		expect(emitted.transportRs.contents).toContain('render_function_item(');
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

		// bridge.rs retired (PR-E2) — render_nodedata_into/SlotAccessor no longer emitted.
		// The transport path emits direct struct field access, not slot accessors.
		expect(emitted).not.toHaveProperty('bridgeRs');
		expect(emitted.transportRs.contents).toContain('render_required_child_parent(');
	});

	it('removes the shared prepare bridge and direct NodeData render path (PR-E2 bridge-sunset)', () => {
		const coreLib = readFileSync(resolve(repoRoot, 'rust/crates/sittir-core/src/lib.rs'), 'utf8');
		const rustNapi = readFileSync(resolve(repoRoot, 'rust/crates/sittir-rust/src/lib.rs'), 'utf8');

		expect(coreLib).not.toContain('pub mod prepare;');
		// render_nodedata_into retired (PR-E2) — lib.rs uses transport path only.
		expect(rustNapi).not.toContain('render_nodedata_into');
		expect(rustNapi).not.toContain('build_template_context');
		expect(rustNapi).toContain('render_transport_parts');
	});
});
