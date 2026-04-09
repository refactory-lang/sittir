/**
 * from() correctness validation — structural comparison of from() vs factory output.
 *
 * Tests that from() resolvers produce correct NodeData by comparing
 * from(readNodeData) against factory(readNodeFields). Detects:
 * - undefined nodes (from() resolver failed to resolve a child)
 * - structural divergence (different fields or children)
 *
 * No tree-sitter re-parsing needed — pure structural comparison.
 */

import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { readNode, buildRoutingMap } from '@sittir/core';
import type { AnyNodeData, AnyTreeNode, RulesConfig } from '@sittir/types';
import { loadOverrides } from './overrides.ts';

const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Tree-sitter adapter (shared with other validators)
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
// WASM & module paths
// ---------------------------------------------------------------------------

const WASM_PATHS: Record<string, string> = {
	rust: 'tree-sitter-rust/tree-sitter-rust.wasm',
	typescript: 'tree-sitter-typescript/tree-sitter-typescript.wasm',
	python: 'tree-sitter-python/tree-sitter-python.wasm',
};

const FROM_MODULE_PATHS: Record<string, string> = {
	rust: '../../rust/src/from.ts',
	typescript: '../../typescript/src/from.ts',
	python: '../../python/src/from.ts',
};

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
// Structural analysis
// ---------------------------------------------------------------------------

/** Find paths to nodes with type 'undefined' in a NodeData tree. */
function findUndefined(node: AnyNodeData, path = ''): string[] {
	const results: string[] = [];
	if (node.type === 'undefined') results.push(path || 'root');

	if (node.fields) {
		for (const [key, value] of Object.entries(node.fields)) {
			if (Array.isArray(value)) {
				value.forEach((v, i) => {
					if (typeof v === 'object' && v !== null && 'type' in v) {
						results.push(...findUndefined(v as AnyNodeData, `${path}.${key}[${i}]`));
					}
				});
			} else if (typeof value === 'object' && value !== null && 'type' in value) {
				results.push(...findUndefined(value as AnyNodeData, `${path}.${key}`));
			}
		}
	}

	if (node.children) {
		(node.children as AnyNodeData[]).forEach((c, i) => {
			if (typeof c === 'object' && c !== null) {
				results.push(...findUndefined(c, `${path}.children[${i}]`));
			}
		});
	}

	return results;
}

/** Shallow structural diff: compare type, field keys, children length. */
function structuralDiff(a: AnyNodeData, b: AnyNodeData): string[] {
	const diffs: string[] = [];
	if (a.type !== b.type) diffs.push(`type: ${a.type} vs ${b.type}`);

	const aKeys = Object.keys(a.fields ?? {}).sort();
	const bKeys = Object.keys(b.fields ?? {}).sort();
	const missingInB = aKeys.filter(k => !bKeys.includes(k));
	const missingInA = bKeys.filter(k => !aKeys.includes(k));
	if (missingInB.length) diffs.push(`from() has extra fields: ${missingInB.join(', ')}`);
	if (missingInA.length) diffs.push(`factory has extra fields: ${missingInA.join(', ')}`);

	const aLen = (a.children ?? []).length;
	const bLen = (b.children ?? []).length;
	if (aLen !== bLen) diffs.push(`children: ${aLen} vs ${bLen}`);

	return diffs;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface FromValidationError {
	kind: string;
	severity: 'error' | 'warning';
	message: string;
}

export interface FromValidationResult {
	grammar: string;
	total: number;
	pass: number;
	fail: number;
	skip: number;
	undefinedCount: number;
	divergentCount: number;
	errors: FromValidationError[];
}

export async function validateFrom(
	grammar: string,
	templatesYaml: string,
): Promise<FromValidationResult> {
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

	// Import from() and factory maps
	let fromMap: Record<string, (input: object) => unknown> = {};
	let factoryMap: Record<string, (config?: any) => unknown> = {};
	try {
		const fromModule = await import(new URL(FROM_MODULE_PATHS[grammar]!, import.meta.url).pathname);
		fromMap = fromModule._fromMap ?? {};
	} catch { /* from module unavailable */ }
	try {
		const factoryModule = await import(new URL(FACTORY_MODULE_PATHS[grammar]!, import.meta.url).pathname);
		factoryMap = factoryModule._factoryMap ?? {};
	} catch { /* factory module unavailable */ }

	const entries = loadCorpusEntries(grammar);
	const errors: FromValidationError[] = [];
	const testedKinds = new Set<string>();
	let pass = 0;
	let skip = 0;
	let total = 0;
	let undefinedCount = 0;
	let divergentCount = 0;

	for (const entry of entries) {
		const tree1 = parser.parse(entry.source) as TSTree;
		if (tree1.rootNode.hasError) continue;

		for (const kind of collectKinds(tree1.rootNode)) {
			if (!(kind in fromMap) || !(kind in factoryMap)) continue;
			if (testedKinds.has(kind)) continue;
			testedKinds.add(kind);
			total++;

			const node1 = findFirst(tree1.rootNode, kind);
			if (!node1) continue;

			const handle = treeHandle(tree1);
			const readData = readNode(handle, node1.id, routing);

			try {
				const fromResult = fromMap[kind]!(readData) as AnyNodeData;
				let factoryResult: AnyNodeData;
				try {
					// Children-only factories use rest params — spread children directly
					if (!readData.fields && readData.children) {
						factoryResult = (factoryMap[kind]! as (...args: unknown[]) => AnyNodeData)(...readData.children);
					} else {
						factoryResult = factoryMap[kind]!(readData.fields ?? {}) as AnyNodeData;
					}
				} catch {
					skip++;
					continue;
				}

				// Check for undefined nodes in from() output
				const undefinedNodes = findUndefined(fromResult);
				if (undefinedNodes.length > 0) {
					undefinedCount++;
					errors.push({
						kind,
						severity: 'error',
						message: `from() produces undefined nodes at: ${undefinedNodes.slice(0, 3).join(', ')}`,
					});
					continue;
				}

				// Structural comparison
				const diffs = structuralDiff(fromResult, factoryResult);
				if (diffs.length > 0) {
					divergentCount++;
					errors.push({
						kind,
						severity: 'warning',
						message: `from() diverges: ${diffs.slice(0, 3).join('; ')}`,
					});
					continue;
				}

				pass++;
			} catch (e) {
				errors.push({
					kind,
					severity: 'error',
					message: `from() throws: ${(e as Error).message.slice(0, 80)}`,
				});
			}
		}
	}

	return { grammar, total, pass, fail: total - pass - skip, skip, undefinedCount, divergentCount, errors };
}

export function formatFromReport(result: FromValidationResult): string {
	const lines: string[] = [];
	const icon = result.fail === 0 ? 'v' : 'x';
	lines.push(`  ${icon} ${result.pass}/${result.total} from() correctness (${result.undefinedCount} undefined, ${result.divergentCount} divergent, ${result.skip} skipped)`);
	if (result.errors.length > 0) {
		for (const e of result.errors) {
			const prefix = e.severity === 'error' ? 'x' : '!';
			lines.push(`    ${prefix} ${e.kind}: ${e.message}`);
		}
	}
	return lines.join('\n');
}
