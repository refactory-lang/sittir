/**
 * Factory round-trip validation — corpus-derived NodeData → render → parse.
 *
 * Instead of building minimal nodes synthetically, this:
 * 1. Parses corpus source with tree-sitter
 * 2. Calls readNode to get real NodeData
 * 3. Strips runtime metadata (span, nodeId) to simulate factory output
 * 4. Renders the stripped NodeData
 * 5. Re-parses and verifies the kind exists
 *
 * This validates that the NodeData shape (which factories produce) renders
 * to valid source, using real-world examples from the grammar test corpus.
 */

import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { readNode, buildRoutingMap, createRenderer } from '@sittir/core';
import type { AnyNodeData, AnyTreeNode, RulesConfig } from '@sittir/types';
import { loadOverrides } from './overrides.ts';

const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Tree-sitter types
// ---------------------------------------------------------------------------

interface TSNode {
	type: string; text: string; startIndex: number; endIndex: number;
	isNamed: boolean; childCount: number; children: TSNode[];
	child(i: number): TSNode | null; fieldNameForChild(i: number): string | null;
	childForFieldName(name: string): TSNode | null; id: number; hasError: boolean;
}

interface TSTree { rootNode: TSNode; }

function adaptNode(node: TSNode): AnyTreeNode {
	return {
		type: node.type, id: () => node.id, text: () => node.text,
		isNamed: () => node.isNamed,
		field: (name: string) => { const c = node.childForFieldName(name); return c ? adaptNode(c) : null; },
		fieldChildren: (name: string) => {
			const r: AnyTreeNode[] = [];
			for (let i = 0; i < node.childCount; i++) {
				if (node.fieldNameForChild(i) === name) { const c = node.child(i); if (c) r.push(adaptNode(c)); }
			}
			return r;
		},
		fieldNameForChild: (i: number) => node.fieldNameForChild(i),
		children: () => node.children.map(adaptNode),
		range: () => ({ start: { index: node.startIndex }, end: { index: node.endIndex } }),
	};
}

function treeHandle(tree: TSTree) {
	const m = new Map<number, TSNode>();
	function collect(n: TSNode) { m.set(n.id, n); for (const c of n.children) collect(c); }
	collect(tree.rootNode);
	return {
		rootNode: adaptNode(tree.rootNode),
		nodeById: (id: number) => { const n = m.get(id); if (!n) throw new Error(`Node ${id} not found`); return adaptNode(n); },
	};
}

function findFirst(node: TSNode, kind: string): TSNode | null {
	if (node.type === kind) return node;
	for (const c of node.children) { const f = findFirst(c, kind); if (f) return f; }
	return null;
}

function collectKinds(node: TSNode): Set<string> {
	const kinds = new Set<string>();
	function walk(n: TSNode) { if (n.isNamed) kinds.add(n.type); for (const c of n.children) walk(c); }
	walk(node);
	return kinds;
}

// ---------------------------------------------------------------------------
// Corpus parser
// ---------------------------------------------------------------------------

interface CorpusEntry { name: string; source: string; }

function parseCorpus(content: string): CorpusEntry[] {
	const entries: CorpusEntry[] = [];
	const lines = content.split('\n');
	let i = 0;
	while (i < lines.length) {
		if (!lines[i]!.startsWith('====')) { i++; continue; }
		i++;
		const name = lines[i]?.trim() ?? '';
		i++;
		while (i < lines.length && lines[i]!.startsWith('====')) i++;
		const sourceLines: string[] = [];
		while (i < lines.length && !lines[i]!.startsWith('----')) { sourceLines.push(lines[i]!); i++; }
		while (i < lines.length && !lines[i]!.startsWith('====')) i++;
		const source = sourceLines.join('\n').trim();
		if (source) entries.push({ name, source });
	}
	return entries;
}

// ---------------------------------------------------------------------------
// Strip runtime metadata to simulate factory output
// ---------------------------------------------------------------------------

/**
 * Strip span, nodeId, and set named:true on all nodes recursively.
 * This simulates what a factory-built NodeData looks like — no runtime
 * metadata from tree-sitter, all children are named NodeData objects.
 */
function stripToFactory(data: AnyNodeData): AnyNodeData {
	const result: AnyNodeData = { type: data.type, named: true };

	if (data.text !== undefined) result.text = data.text;
	if (data.variant !== undefined) result.variant = data.variant;

	if (data.fields) {
		const fields: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(data.fields)) {
			if (Array.isArray(value)) {
				fields[key] = value.map(v => typeof v === 'object' && v !== null ? stripToFactory(v as AnyNodeData) : v);
			} else if (typeof value === 'object' && value !== null) {
				fields[key] = stripToFactory(value as AnyNodeData);
			} else {
				fields[key] = value;
			}
		}
		result.fields = fields;
	}

	if (data.children) {
		// Factory nodes only have named children — filter anonymous
		result.children = (data.children as AnyNodeData[])
			.filter(c => c.named !== false)
			.map(c => typeof c === 'object' && c !== null ? stripToFactory(c as AnyNodeData) : c);
	}

	return result;
}

// ---------------------------------------------------------------------------
// WASM paths & fixtures
// ---------------------------------------------------------------------------

const WASM_PATHS: Record<string, string> = {
	rust: 'tree-sitter-rust/tree-sitter-rust.wasm',
	typescript: 'tree-sitter-typescript/tree-sitter-typescript.wasm',
	python: 'tree-sitter-python/tree-sitter-python.wasm',
};

const FIXTURES_DIR = new URL('../fixtures', import.meta.url).pathname;

function loadCorpusEntries(grammar: string): CorpusEntry[] {
	const entries: CorpusEntry[] = [];
	const files = readdirSync(FIXTURES_DIR).filter(f => f.startsWith(`${grammar}-`) && f.endsWith('.txt'));
	for (const file of files) {
		entries.push(...parseCorpus(readFileSync(join(FIXTURES_DIR, file), 'utf-8')));
	}
	return entries;
}

// ---------------------------------------------------------------------------
// Fragment kinds (same as readNode round-trip)
// ---------------------------------------------------------------------------

const FRAGMENT_ONLY_KINDS = new Set([
	'parameters', 'closure_parameters', 'type_parameters', 'arguments',
	'declaration_list', 'enum_variant_list', 'field_declaration_list',
	'ordered_field_declaration_list', 'match_block', 'use_list',
	'visibility_modifier', 'function_modifiers', 'extern_modifier',
	'label', 'lifetime', 'lifetime_parameter', 'parameter', 'self_parameter',
	'type_parameter', 'const_parameter', 'variadic_parameter',
	'field_declaration', 'enum_variant', 'match_arm', 'match_pattern',
	'attribute', 'attribute_item', 'inner_attribute_item',
	'where_clause', 'where_predicate', 'trait_bounds',
	'field_initializer', 'field_initializer_list', 'field_pattern',
	'else_clause', 'for_lifetimes', 'use_as_clause', 'use_bounds',
	'formal_parameters', 'class_body', 'statement_block',
	'object_type', 'enum_body', 'extends_clause', 'implements_clause',
	'import_clause', 'export_clause', 'decorator',
	'argument_list', 'block',
	'elif_clause', 'except_clause', 'finally_clause', 'with_clause',
]);

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface FactoryRoundTripResult {
	grammar: string;
	total: number;
	pass: number;
	fail: number;
	skip: number;
	errors: { kind: string; message: string }[];
}

export async function validateFactoryRoundTrip(
	grammar: string,
	templatesYaml: string,
): Promise<FactoryRoundTripResult> {
	const mod = await import('web-tree-sitter') as any;
	const ParserClass = mod.Parser ?? mod.default?.Parser ?? mod.default;
	const LanguageClass = mod.Language ?? mod.default?.Language;
	await ParserClass.init();

	const wasmPath = require.resolve(WASM_PATHS[grammar]!);
	const lang = await LanguageClass.load(wasmPath);
	const parser = new ParserClass() as { parse(s: string): TSTree; setLanguage(l: unknown): void };
	parser.setLanguage(lang);

	const config = parseYaml(templatesYaml) as RulesConfig;
	const overrides = loadOverrides(grammar);
	const routing = buildRoutingMap(overrides);
	const ruleKinds = new Set(Object.keys(config.rules));
	const { render } = createRenderer(config);

	const entries = loadCorpusEntries(grammar);
	const errors: { kind: string; message: string }[] = [];
	const testedKinds = new Set<string>(); // one test per kind
	let pass = 0;
	let skip = 0;
	let total = 0;

	for (const entry of entries) {
		const tree1 = parser.parse(entry.source) as TSTree;
		if (tree1.rootNode.hasError) continue;

		const kinds = collectKinds(tree1.rootNode);
		for (const kind of kinds) {
			if (!ruleKinds.has(kind)) continue;
			if (testedKinds.has(kind)) continue; // one test per kind
			testedKinds.add(kind);
			total++;

			const node1 = findFirst(tree1.rootNode, kind);
			if (!node1) continue;

			// readNode → strip to factory shape → render → re-parse
			const handle = treeHandle(tree1);
			const readData = readNode(handle, node1.id, routing);
			const factoryData = stripToFactory(readData);

			try {
				const rendered = render(factoryData);
				if (!rendered.trim()) { skip++; continue; }

				if (FRAGMENT_ONLY_KINDS.has(kind)) {
					pass++; // can't re-parse standalone, just verify render succeeds
					continue;
				}

				const tree2 = parser.parse(rendered) as TSTree;
				if (tree2.rootNode.hasError) {
					errors.push({ kind, message: `re-parse error: "${rendered.slice(0, 60)}"` });
					continue;
				}

				const node2 = findFirst(tree2.rootNode, kind);
				if (!node2) {
					errors.push({ kind, message: `kind not found in re-parse (rendered: "${rendered.slice(0, 60)}")` });
					continue;
				}

				pass++;
			} catch (e) {
				errors.push({ kind, message: `${(e as Error).message.slice(0, 80)}` });
			}
		}
	}

	return { grammar, total, pass, fail: total - pass - skip, skip, errors };
}

export function formatFactoryRoundTripReport(result: FactoryRoundTripResult): string {
	const lines: string[] = [];
	const icon = result.fail === 0 ? 'v' : 'x';
	lines.push(`  ${icon} ${result.pass}/${result.total} factory round-trip (${result.skip} skipped, ${result.errors.length} errors)`);
	if (result.errors.length > 0) {
		for (const e of result.errors.slice(0, 15)) {
			lines.push(`    x ${e.kind}: ${e.message}`);
		}
		if (result.errors.length > 15) lines.push(`    ... and ${result.errors.length - 15} more`);
	}
	return lines.join('\n');
}
