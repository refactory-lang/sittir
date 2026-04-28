import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
	AssembledBranch,
	AssembledKeyword,
	AssembledLeaf
} from '../compiler/node-map.ts';
import type { SeqRule } from '../compiler/rule.ts';
import type { NodeMap } from '../compiler/types.ts';
import {
	emitHashFiles,
	emitRenderCrate
} from '../emitters/rust-render.ts';
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
	const nodes = new Map<string, AssembledBranch | AssembledLeaf | AssembledKeyword>([
		['function_item', new AssembledBranch('function_item', nameRule, nameRule)],
		[
			'identifier',
			new AssembledLeaf('identifier', { type: 'pattern', value: '[a-z]+' })
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
	it('emits native render artifacts under rust/crates/sittir-render-{lang}', () => {
		const files = [
			{ filename: 'function_item.jinja', content: '{# @generated #}\n{{ name }}' }
		] as const;

		const hashes = emitHashFiles('rust', files);
		expect(hashes.hashRs.path).toBe(
			'rust/crates/sittir-render-rust/src/hash.rs'
		);
		expect(hashes.hashTs.path).toBe('packages/rust/src/hash.ts');

		const emitted = emitRenderCrate('rust', files, makeMinimalNodeMap());
		expect(emitted.templatesRs.path).toBe(
			'rust/crates/sittir-render-rust/src/templates.rs'
		);
		expect(emitted.libRs.path).toBe('rust/crates/sittir-render-rust/src/lib.rs');
		expect(emitted.cargoToml.path).toBe(
			'rust/crates/sittir-render-rust/Cargo.toml'
		);
	});

	it('writes extracted parity fixtures beside the centralized native render crate', () => {
		expect(fixturesOutputPath('rust')).toBe(
			'rust/crates/sittir-render-rust/test-fixtures.json'
		);
		expect(fixturesOutputPath('typescript')).toBe(
			'rust/crates/sittir-render-typescript/test-fixtures.json'
		);
		expect(fixturesOutputPath('python')).toBe(
			'rust/crates/sittir-render-python/test-fixtures.json'
		);
	});

	it('tracks centralized render crates in the Cargo workspace instead of package-local rust-render crates', () => {
		const cargoToml = readFileSync(resolve(repoRoot, 'Cargo.toml'), 'utf8');
		expect(cargoToml).toContain('"rust/crates/sittir-render-rust"');
		expect(cargoToml).toContain('"rust/crates/sittir-render-typescript"');
		expect(cargoToml).toContain('"rust/crates/sittir-render-python"');
		expect(cargoToml).not.toContain('"packages/rust/rust-render"');
		expect(cargoToml).not.toContain('"packages/typescript/rust-render"');
		expect(cargoToml).not.toContain('"packages/python/rust-render"');
	});
});

describe('render pipeline optimization — level 1 borrowed askama views', () => {
	it('emits borrowed scalar, list, children, variant, and text access from TemplateContext', () => {
		const files = [
			{
				filename: 'function_item.jinja',
				content:
					'{# @generated #}\n{% if name | isPresent %}{{ name }}{% endif %} {{ children | join(" ") }} {{ text }}'
			}
		] as const;

		const emitted = emitRenderCrate('rust', files, makeMinimalNodeMap());
		expect(emitted.templatesRs.contents).toContain(
			'pub struct FunctionItemTemplate<\'a> {'
		);
		expect(emitted.templatesRs.contents).toContain(
			'    pub children: &\'a [String],'
		);
		expect(emitted.templatesRs.contents).toContain(
			'    pub children_list: &\'a [String],'
		);
		expect(emitted.templatesRs.contents).toContain('    pub variant: &\'a str,');
		expect(emitted.templatesRs.contents).toContain('    pub text: &\'a str,');
		expect(emitted.templatesRs.contents).toContain('    pub name: &\'a str,');
		expect(emitted.templatesRs.contents).toContain(
			'    pub name_list: &\'a [String],'
		);
		expect(emitted.templatesRs.contents).toContain(
			'        children: children.items.as_slice(),'
		);
		expect(emitted.templatesRs.contents).toContain(
			'        children_list: children.items.as_slice(),'
		);
		expect(emitted.templatesRs.contents).toContain('        variant,');
		expect(emitted.templatesRs.contents).toContain('        text: text.as_str(),');
		expect(emitted.templatesRs.contents).toContain('        name: field_0.scalar.as_str(),');
		expect(emitted.templatesRs.contents).toContain('        name_list: field_0.items.as_slice(),');
		expect(emitted.templatesRs.contents).not.toContain('.cloned().unwrap_or_default()');
	});
});

describe('render pipeline optimization — level 3 direct render path', () => {
	it('emits direct node-data render helpers and per-kind render functions instead of TemplateContext + GrammarMeta dispatch', () => {
		const files = [
			{
				filename: 'function_item.jinja',
				content:
					'{# @generated #}\n{% if name | isPresent %}{{ name }}{% endif %} {{ children | join(" ") }} {{ text }}'
			}
		] as const;

		const emitted = emitRenderCrate('rust', files, makeMinimalNodeMap());

		expect(emitted.templatesRs.contents).toContain('fn resolve_leaf');
		expect(emitted.templatesRs.contents).toContain('fn resolve_optional');
		expect(emitted.templatesRs.contents).toContain('fn resolve_required');
		expect(emitted.templatesRs.contents).toContain('fn resolve_children');
		expect(emitted.templatesRs.contents).toContain(
			'pub fn render_dispatch(node: &::sittir_core::types::NodeData)'
		);
		expect(emitted.templatesRs.contents).toContain('fn render_function_item(');
		expect(emitted.templatesRs.contents).toContain(
			'"function_item" => render_function_item(node)'
		);
		expect(emitted.templatesRs.contents).toContain('resolve_field(node, "name")');
		expect(emitted.templatesRs.contents).not.toContain('TemplateContext');
		expect(emitted.templatesRs.contents).not.toContain('pub struct RustGrammarMeta');
		expect(emitted.libRs.contents).toContain('pub use templates::render_dispatch;');
		expect(emitted.libRs.contents).not.toContain('RustGrammarMeta');
	});

	it('removes the shared prepare bridge while keeping the native render boundary unchanged', () => {
		const coreLib = readFileSync(
			resolve(repoRoot, 'rust/crates/sittir-core/src/lib.rs'),
			'utf8'
		);
		const rustNapi = readFileSync(
			resolve(repoRoot, 'rust/crates/sittir-rust-napi/src/lib.rs'),
			'utf8'
		);

		expect(coreLib).not.toContain('pub mod prepare;');
		expect(rustNapi).toContain('let canonical = render_dispatch(&node)');
		expect(rustNapi).not.toContain('build_template_context');
	});
});
