#!/usr/bin/env npx tsx
/**
 * Debug round-trip failures — show source, readNode, rendered for each.
 */
import { readNode, buildRoutingMap } from '../../core/src/readNode.ts';
import { createRenderer } from '../../core/src/render.ts';
import { loadOverrides } from '../src/overrides.ts';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import { createRequire } from 'module';
import type { AnyNodeData, AnyTreeNode, RulesConfig } from '@sittir/types';

const require = createRequire(import.meta.url);

interface TSNode {
	type: string; text: string; startIndex: number; endIndex: number;
	isNamed: boolean; childCount: number; children: TSNode[];
	child(i: number): TSNode | null; fieldNameForChild(i: number): string | null;
	childForFieldName(name: string): TSNode | null; id: number; hasError: boolean;
	namedChildCount: number;
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
	const ruleKinds = new Set(Object.keys(config.rules));
	const { render } = createRenderer(config);

	const fixturesDir = join(import.meta.dirname!, '..', 'fixtures');
	const files = readdirSync(fixturesDir).filter(f => f.startsWith('rust-') && f.endsWith('.txt'));
	const entries: CorpusEntry[] = [];
	for (const file of files) entries.push(...parseCorpus(readFileSync(join(fixturesDir, file), 'utf-8')));

	let shown = 0;
	const MAX = 30;

	for (const entry of entries) {
		if (shown >= MAX) break;
		const tree1 = parser.parse(entry.source) as TSTree;
		if (tree1.rootNode.hasError) continue;

		const kinds = collectKinds(tree1.rootNode);
		const testableKinds = [...kinds].filter(k => ruleKinds.has(k));

		for (const kind of testableKinds) {
			if (shown >= MAX) break;
			const node1 = findFirst(tree1.rootNode, kind);
			if (!node1) continue;

			const handle = treeHandle(tree1);
			const data = readNode(handle, node1.id, routing);

			try {
				const rendered = render(data);
				const tree2 = parser.parse(rendered) as TSTree;
				if (tree2.rootNode.hasError) {
					console.log(`\nFAIL [${kind}] "${entry.name}"`);
					console.log(`  source:   ${JSON.stringify(node1.text.slice(0, 80))}`);
					console.log(`  rendered: ${JSON.stringify(rendered.slice(0, 80))}`);
					console.log(`  fields:   ${data.fields ? Object.keys(data.fields).join(', ') : 'none'}`);
					console.log(`  children: ${data.children?.length ?? 0} (named: ${(data.children as AnyNodeData[] ?? []).filter(c => c.named).length})`);
					shown++;
				} else {
					const node2 = findFirst(tree2.rootNode, kind);
					if (!node2) {
						console.log(`\nFAIL [${kind}] "${entry.name}" — kind not found in re-parse`);
						console.log(`  source:   ${JSON.stringify(node1.text.slice(0, 80))}`);
						console.log(`  rendered: ${JSON.stringify(rendered.slice(0, 80))}`);
						shown++;
					}
				}
			} catch (e) {
				console.log(`\nFAIL [${kind}] "${entry.name}" — render error`);
				console.log(`  error: ${(e as Error).message.slice(0, 80)}`);
				shown++;
			}
		}
	}
}

main().catch(console.error);
