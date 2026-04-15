#!/usr/bin/env npx tsx
import { readNode, buildRoutingMap } from '../../core/src/readNode.ts';
import { createRenderer } from '../../core/src/render.ts';
import { loadOverrides } from '../src/overrides.ts';
import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { createRequire } from 'module';
import type { AnyNodeData, AnyTreeNode, RulesConfig } from '@sittir/types';

const require = createRequire(import.meta.url);

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

async function main() {
	const mod = await import('web-tree-sitter') as any;
	const P = mod.Parser ?? mod.default?.Parser ?? mod.default;
	const L = mod.Language ?? mod.default?.Language;
	await P.init();
	const lang = await L.load(require.resolve('tree-sitter-rust/tree-sitter-rust.wasm'));
	const parser = new P() as { parse(s: string): TSTree; setLanguage(l: unknown): void };
	parser.setLanguage(lang);

	const overrides = loadOverrides('rust');
	const routing = buildRoutingMap(overrides);
	const config = parseYaml(readFileSync('packages/rust/templates.yaml', 'utf-8')) as RulesConfig;
	const { render } = createRenderer(config);

	const tests = [
		{ label: 'binary', source: 'fn main() { a * b; }', kind: 'binary_expression' },
		{ label: 'type_cast', source: 'fn main() { 1000 as u8; }', kind: 'type_cast_expression' },
		{ label: 'assignment', source: 'fn main() { x = y; }', kind: 'assignment_expression' },
		{ label: 'match_block', source: 'fn main() { match x { 1 => 2, _ => 3 } }', kind: 'match_block' },
		{ label: 'token_tree', source: 'macro_rules! m { (a) => {} }', kind: 'token_tree' },
		{ label: 'scoped_id', source: 'fn main() { std::io::stdin(); }', kind: 'scoped_identifier' },
		{ label: 'struct_expr', source: 'fn main() { Point { x: 1, y: 2 }; }', kind: 'struct_expression' },
		{ label: 'field_expr', source: 'fn main() { s.field; }', kind: 'field_expression' },
		{ label: 'closure', source: 'fn main() { || 42; }', kind: 'closure_expression' },
		{ label: 'await', source: 'async fn f() { x.await; }', kind: 'await_expression' },
	];

	for (const t of tests) {
		const tree = parser.parse(t.source);
		const node = findFirst(tree.rootNode, t.kind);
		if (!node) { console.log(`\n--- ${t.label}: not found ---`); continue; }
		const handle = treeHandle(tree);
		const data = readNode(handle, node.id, routing);
		console.log(`\n--- ${t.label} (${t.kind}) ---`);
		console.log('source:', JSON.stringify(node.text));
		console.log('fields:', data.fields ? Object.keys(data.fields) : 'none');
		if (data.fields) {
			for (const [k, v] of Object.entries(data.fields)) {
				const val = v as AnyNodeData;
				console.log(`  ${k}: type=${val.type}, text=${JSON.stringify(val.text?.slice(0, 30))}, named=${val.named}`);
			}
		}
		console.log('children:', data.children?.length ?? 0);
		if (data.children) {
			for (const c of data.children as AnyNodeData[]) {
				console.log(`  [${c.named ? 'named' : 'anon'}] ${c.type}: ${JSON.stringify(c.text?.slice(0, 30))}`);
			}
		}
		try {
			const rendered = render(data);
			console.log('rendered:', JSON.stringify(rendered));
		} catch (e) { console.log('render error:', (e as Error).message.slice(0, 80)); }
	}
}

main().catch(console.error);
