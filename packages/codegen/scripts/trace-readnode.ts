#!/usr/bin/env npx tsx
/**
 * Trace readNode output for specific source snippets.
 * Shows what readNode produces with routing, and what render outputs.
 */
import { readNode, buildRoutingMap, createRenderer } from '../../core/src/readNode.ts';
import { createRenderer as createRend } from '../../core/src/render.ts';
import { loadOverrides } from '../src/overrides.ts';
import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { createRequire } from 'module';
import type { AnyTreeNode, RulesConfig } from '@sittir/types';

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
	const { render } = createRend(config);

	const tests = [
		{ label: 'empty params', source: 'fn foo() {}', kind: 'parameters' },
		{ label: 'one param', source: 'fn foo(x: i32) {}', kind: 'parameters' },
		{ label: 'two params', source: 'fn foo(x: i32, y: f64) {}', kind: 'parameters' },
		{ label: 'visibility', source: 'pub fn foo() {}', kind: 'visibility_modifier' },
		{ label: 'type params', source: 'fn foo<T>() {}', kind: 'type_parameters' },
		{ label: 'call', source: 'fn main() { foo(1, 2); }', kind: 'call_expression' },
	];

	for (const t of tests) {
		const tree = parser.parse(t.source);
		const node = findFirst(tree.rootNode, t.kind);
		if (!node) { console.log(`${t.label}: kind '${t.kind}' not found`); continue; }

		const handle = treeHandle(tree);
		const data = readNode(handle, node.id, routing);
		console.log(`\n--- ${t.label} (${t.kind}) ---`);
		console.log('source:', JSON.stringify(node.text));
		console.log('readNode:', JSON.stringify(data, null, 2).slice(0, 500));
		try {
			const rendered = render(data);
			console.log('rendered:', JSON.stringify(rendered));
		} catch (e) {
			console.log('render error:', (e as Error).message);
		}
	}
}

main().catch(console.error);
