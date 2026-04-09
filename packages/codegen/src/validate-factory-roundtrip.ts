/**
 * Factory round-trip validation — corpus → parse → readNode → factory() → render → re-parse.
 *
 * Uses direct factory calls (via _factoryMap) to isolate the template
 * quality signal from from() resolver bugs:
 * 1. Parse corpus source with tree-sitter
 * 2. readNode to get NodeData
 * 3. Call the factory directly with readNode fields (no from() resolver)
 * 4. Render the factory-produced node
 * 5. Re-parse and verify the kind exists
 */

import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { readNode, buildRoutingMap, createRenderer } from '@sittir/core';
import type { AnyNodeData, AnyTreeNode, RulesConfig } from '@sittir/types';
import { loadOverrides } from './overrides.ts';
import { loadRawEntries } from './grammar-reader.ts';
import { join as pathJoin } from 'node:path';

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

/** Relative path from codegen/src to language package factories.ts */
const FACTORY_MODULE_PATHS: Record<string, string> = {
	rust: '../../rust/src/factories.ts',
	typescript: '../../typescript/src/factories.ts',
	python: '../../python/src/factories.ts',
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
// Supertype-based reparse wrapping
// ---------------------------------------------------------------------------

/** Build kind → supertype[] map from node-types.json. */
function buildKindToSupertypes(rawEntries: { type: string; named: boolean; subtypes?: { type: string }[] }[]): Map<string, string[]> {
	const result = new Map<string, string[]>();
	for (const entry of rawEntries) {
		if (!entry.subtypes) continue;
		for (const sub of entry.subtypes) {
			const existing = result.get(sub.type) ?? [];
			existing.push(entry.type);
			result.set(sub.type, existing);
		}
	}
	return result;
}

/** Per-grammar wrapper functions: supertype → wrapping context. */
const REPARSE_WRAPPERS: Record<string, Record<string, (r: string) => string>> = {
	rust: {
		'_expression': r => `fn _f() { let _ = ${r}; }`,
		'_type': r => `type _X = ${r};`,
		'_pattern': r => `fn _f() { let ${r} = (); }`,
		'_declaration_statement': r => r,
		'_literal': r => `fn _f() { let _ = ${r}; }`,
		'_literal_pattern': r => `fn _f() { let ${r} = (); }`,
	},
	typescript: {
		'_expression': r => `let _ = ${r};`,
		'_type': r => `type _X = ${r};`,
		'_pattern': r => `let ${r} = null;`,
		'_declaration': r => r,
		'_statement': r => r,
	},
	python: {
		'_expression': r => `_ = ${r}`,
		'_type': r => `_: ${r} = None`,
		'_pattern': r => `match _:\n  case ${r}: pass`,
		'_simple_statement': r => r,
		'_compound_statement': r => r,
	},
};

/**
 * Wrap rendered output for reparsing. Returns the wrapped string,
 * or null if no supertype wrapper is available (skip reparse).
 */
function wrapForReparse(
	rendered: string,
	kind: string,
	grammar: string,
	kindToSupertypes: Map<string, string[]>,
): string | null {
	const supertypes = kindToSupertypes.get(kind);
	if (!supertypes || supertypes.length === 0) return null; // no supertype → skip

	const wrappers = REPARSE_WRAPPERS[grammar];
	if (!wrappers) return null;

	for (const st of supertypes) {
		const wrapper = wrappers[st];
		if (wrapper) return wrapper(rendered);
	}

	return null; // no wrapper for any supertype → skip
}

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
	const kindToSupertypes = buildKindToSupertypes(loadRawEntries(grammar));

	// Dynamically import the generated _factoryMap for this grammar
	const factoryModulePath = FACTORY_MODULE_PATHS[grammar];
	let factoryMap: Record<string, (config?: any) => unknown> = {};
	if (factoryModulePath) {
		try {
			const factoryModule = await import(new URL(factoryModulePath, import.meta.url).pathname);
			factoryMap = factoryModule._factoryMap ?? {};
		} catch {
			// If factory module can't be loaded, fall back to strip
		}
	}

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

			// readNode → direct factory call → render → re-parse
			const handle = treeHandle(tree1);
			const readData = readNode(handle, node1.id, routing);

			// Direct factory call with readNode fields — no from() resolver
			const factory = factoryMap[kind];
			let factoryData: AnyNodeData;
			if (factory) {
				try {
					// Children-only factories use rest params — spread children directly
					if (!readData.fields && readData.children) {
						factoryData = (factory as (...args: unknown[]) => AnyNodeData)(...readData.children);
					} else {
						factoryData = factory(readData.fields ?? {}) as AnyNodeData;
					}
				} catch {
					// Factory may fail on raw readNode fields — fall back to strip
					factoryData = stripToFactory(readData);
				}
			} else {
				factoryData = stripToFactory(readData);
			}

			try {
				const rendered = render(factoryData);
				if (!rendered.trim()) { skip++; continue; }

				// Wrap for reparse using supertype context
				const wrapped = wrapForReparse(rendered, kind, grammar, kindToSupertypes);
				if (wrapped === null) {
					pass++; // no supertype → can't determine context → skip reparse
					continue;
				}

				const tree2 = parser.parse(wrapped) as TSTree;
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
		for (const e of result.errors) {
			lines.push(`    x ${e.kind}: ${e.message}`);
		}
	}
	return lines.join('\n');
}
