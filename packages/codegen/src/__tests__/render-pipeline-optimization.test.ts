import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
	AssembledBranch,
	AssembledKeyword,
	AssembledPattern
} from '../compiler/node-map.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';
import type { SeqRule } from '../compiler/rule.ts';
import type { NodeMap } from '../compiler/types.ts';
import { emitHashFiles, emitRenderModule } from '../emitters/render-module.ts';
import { fixturesOutputPath } from '../emitters/parity-fixtures.ts';

const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url)).replace(
	/\/$/,
	''
);

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
	const nodes = new Map<
		string,
		AssembledBranch | AssembledPattern | AssembledKeyword
	>([
		['function_item', new AssembledBranch('function_item', nameRule, nameRule)],
		[
			'identifier',
			new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' })
		],
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

describe('render pipeline optimization — retained baseline convergence', () => {
	it('emits native render artifacts under rust/crates/sittir-{lang}/src/render', () => {
		const files = [
			{
				filename: 'function_item.jinja',
				content: '{# @generated #}\n{{ name }}'
			}
		] as const;

		const hashes = emitHashFiles('rust', files);
		expect(hashes.hashRs.path).toBe(
			'rust/crates/sittir-rust/src/render/hash.rs'
		);
		expect(hashes.hashTs.path).toBe('packages/rust/src/hash.ts');

		const emitted = emitRenderModule('rust', files, makeMinimalNodeMap());
		expect(emitted.templatesRs.path).toBe(
			'rust/crates/sittir-rust/src/render/templates.rs'
		);
		expect(emitted.libRs.path).toBe(
			'rust/crates/sittir-rust/src/render/mod.rs'
		);
	});

	it('writes extracted parity fixtures beside the grammar native crate', () => {
		expect(fixturesOutputPath('rust')).toBe(
			'rust/crates/sittir-rust/test-fixtures.json'
		);
		expect(fixturesOutputPath('typescript')).toBe(
			'rust/crates/sittir-typescript/test-fixtures.json'
		);
		expect(fixturesOutputPath('python')).toBe(
			'rust/crates/sittir-python/test-fixtures.json'
		);
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
				content:
					'{# @generated #}\n{% if name | isPresent %}{{ name }}{% endif %} {{ children | join(" ") }}'
			}
		] as const;

		const emitted = emitRenderModule('rust', files, makeMinimalNodeMap());
		expect(emitted.templatesRs.contents).toContain(
			"pub struct FunctionItemTemplate<'a> {"
		);
		// Phase D: field views use SingleNonterminalView (Askama streaming) not bare &'a str.
		// T009: module-level `use` imports — short names.
		expect(emitted.templatesRs.contents).toContain(
			"    pub name: SingleNonterminalView<'a>,"
		);
		expect(emitted.templatesRs.contents).not.toContain("    pub text: &'a str,");
		expect(emitted.templatesRs.contents).not.toContain("    pub variant: &'a str,");
		expect(emitted.templatesRs.contents).not.toContain(
			"    pub children: ListView<'a>,"
		);
		expect(emitted.templatesRs.contents).not.toContain("    pub name_list: &'a [String],");
		expect(emitted.templatesRs.contents).not.toContain("    pub name_leading_sep: bool,");
		expect(emitted.templatesRs.contents).not.toContain("    pub name_trailing_sep: bool,");
		expect(emitted.templatesRs.contents).not.toContain(
			'.cloned().unwrap_or_default()'
		);
	});
});

describe('render pipeline optimization — level 3 direct render path', () => {
	it('emits direct node-data render helpers and per-kind render functions instead of TemplateContext + GrammarMeta dispatch', () => {
		const files = [
			{
				filename: 'function_item.jinja',
				content:
					'{# @generated #}\n{% if name | isPresent %}{{ name }}{% endif %}'
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
						anon: false, aux: false, alias: false, hidden: false
					}
				},
				identifier: {
					id: 1,
					parser: {
						cSymbol: 'sym_identifier',
						parserName: 'identifier',
						anon: false, aux: false, alias: false, hidden: false
					}
				},
				kw_fn: {
					id: 2,
					parser: {
						cSymbol: 'anon_sym_fn',
						parserName: 'kw_fn',
						anon: true, aux: false, alias: false, hidden: false
					}
				}
			},
			sourceArtifact: 'parser.wasm'
		};

		const emitted = emitRenderModule('rust', files, makeMinimalNodeMap(), generatedIdTables);

		expect(emitted.templatesRs.contents).toContain(
			'#![allow(dead_code, unused_imports, non_snake_case, non_camel_case_types, unused_mut, unused_variables)]'
		);
		expect(emitted.templatesRs.contents).toContain('fn resolve_leaf');
		expect(emitted.templatesRs.contents).toContain('fn resolve_optional');
		expect(emitted.templatesRs.contents).toContain('fn resolve_required');
		expect(emitted.templatesRs.contents).toContain('fn missing_required_field');
		expect(emitted.templatesRs.contents).toContain('fn resolve_children');
		expect(emitted.templatesRs.contents).toContain(
			'pub fn render_dispatch(node: &NodeData)'
		);
		expect(emitted.templatesRs.contents).toContain('fn render_function_item(');
		// Phase D: dispatch uses numeric KindId (42) not string "function_item".
		expect(emitted.templatesRs.contents).toContain(
			'42 => render_function_item(node)'
		);
		expect(emitted.templatesRs.contents).toContain(
			'resolve_field(node, "name", true)'
		);
		expect(emitted.templatesRs.contents).toContain(
			`format!("render_dispatch: missing required field '{}' on '{}'", name, node.type_)`
		);
		expect(emitted.templatesRs.contents).not.toContain('TemplateContext');
		expect(emitted.templatesRs.contents).not.toContain(
			'pub struct RustGrammarMeta'
		);
		expect(emitted.libRs.contents).toContain(
			'pub use templates::{render_dispatch, render_transport, render_transport_dispatch, render_transport_parts, AnyTransport};'
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

		const emitted = emitRenderModule('rust', files, makeMinimalNodeMap());

		expect(emitted.templatesRs.contents).toContain(
			'resolve_field(node, "name", true)'
		);
	});

	it('removes the shared prepare bridge while keeping the native render boundary unchanged', () => {
		const coreLib = readFileSync(
			resolve(repoRoot, 'rust/crates/sittir-core/src/lib.rs'),
			'utf8'
		);
		const rustNapi = readFileSync(
			resolve(repoRoot, 'rust/crates/sittir-rust/src/lib.rs'),
			'utf8'
		);

		expect(coreLib).not.toContain('pub mod prepare;');
		expect(rustNapi).toContain('render_dispatch(node)');
		expect(rustNapi).not.toContain('build_template_context');
	});
});
