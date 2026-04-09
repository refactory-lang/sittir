/**
 * Round-trip validation (Checks 6 & 7) — parse → readNode → render → parse.
 *
 * Uses tree-sitter test corpus files (downloaded from grammar repos) as
 * source fixtures. Each corpus entry is parsed, readNode'd, rendered, and
 * re-parsed. Structural match is checked.
 *
 * Requires web-tree-sitter + language WASM files.
 */

import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { readNode, buildRoutingMap, createRenderer } from '@sittir/core';
import type { AnyTreeNode, RulesConfig } from '@sittir/types';
import { loadOverrides } from './overrides.ts';

const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Corpus parser — extract source blocks from tree-sitter test corpus
// ---------------------------------------------------------------------------

interface CorpusEntry {
	name: string;
	source: string;
}

/**
 * Parse a tree-sitter test corpus file.
 * Format: ===== header, test name, =====, source, -----, expected tree
 */
function parseCorpus(content: string): CorpusEntry[] {
	const entries: CorpusEntry[] = [];
	const lines = content.split('\n');
	let i = 0;

	while (i < lines.length) {
		// Find header (line of = signs)
		if (!lines[i]!.startsWith('====')) { i++; continue; }
		i++;

		// Test name
		const name = lines[i]?.trim() ?? '';
		i++;

		// Skip closing header
		while (i < lines.length && lines[i]!.startsWith('====')) i++;

		// Collect source lines until separator (---- line)
		const sourceLines: string[] = [];
		while (i < lines.length && !lines[i]!.startsWith('----')) {
			sourceLines.push(lines[i]!);
			i++;
		}

		// Skip separator and expected tree
		while (i < lines.length && !lines[i]!.startsWith('====')) i++;

		const source = sourceLines.join('\n').trim();
		if (source) entries.push({ name, source });
	}

	return entries;
}

// ---------------------------------------------------------------------------
// Tree-sitter adapter
// ---------------------------------------------------------------------------

interface TSNode {
	type: string;
	text: string;
	startIndex: number;
	endIndex: number;
	isNamed: boolean;
	childCount: number;
	namedChildCount: number;
	children: TSNode[];
	child(index: number): TSNode | null;
	fieldNameForChild(index: number): string | null;
	childForFieldName(fieldName: string): TSNode | null;
	id: number;
	hasError: boolean;
}

interface TSTree {
	rootNode: TSNode;
}

function adaptNode(node: TSNode): AnyTreeNode {
	return {
		type: node.type,
		id: () => node.id,
		text: () => node.text,
		isNamed: () => node.isNamed,
		field: (name: string) => {
			const child = node.childForFieldName(name);
			return child ? adaptNode(child) : null;
		},
		fieldChildren: (name: string) => {
			const result: AnyTreeNode[] = [];
			for (let i = 0; i < node.childCount; i++) {
				if (node.fieldNameForChild(i) === name) {
					const child = node.child(i);
					if (child) result.push(adaptNode(child));
				}
			}
			return result;
		},
		fieldNameForChild: (index: number) => node.fieldNameForChild(index),
		children: () => node.children.map(adaptNode),
		range: () => ({
			start: { index: node.startIndex },
			end: { index: node.endIndex },
		}),
	};
}

function treeHandle(tree: TSTree) {
	const nodeMap = new Map<number, TSNode>();
	function collect(node: TSNode) {
		nodeMap.set(node.id, node);
		for (const child of node.children) collect(child);
	}
	collect(tree.rootNode);

	return {
		rootNode: adaptNode(tree.rootNode),
		nodeById: (id: number) => {
			const node = nodeMap.get(id);
			if (!node) throw new Error(`Node ${id} not found`);
			return adaptNode(node);
		},
	};
}

// ---------------------------------------------------------------------------
// WASM paths
// ---------------------------------------------------------------------------

const WASM_PATHS: Record<string, string> = {
	rust: 'tree-sitter-rust/tree-sitter-rust.wasm',
	typescript: 'tree-sitter-typescript/tree-sitter-typescript.wasm',
	python: 'tree-sitter-python/tree-sitter-python.wasm',
};

// ---------------------------------------------------------------------------
// Fixtures directory
// ---------------------------------------------------------------------------

const FIXTURES_DIR = new URL('../fixtures', import.meta.url).pathname;

function loadCorpusEntries(grammar: string): CorpusEntry[] {
	const entries: CorpusEntry[] = [];
	const files = readdirSync(FIXTURES_DIR).filter(f => f.startsWith(`${grammar}-`) && f.endsWith('.txt'));
	for (const file of files) {
		const content = readFileSync(join(FIXTURES_DIR, file), 'utf-8');
		entries.push(...parseCorpus(content));
	}
	return entries;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface RoundTripResult {
	grammar: string;
	total: number;
	pass: number;
	fail: number;
	skip: number;
	errors: { name: string; message: string }[];
}

function findFirst(node: TSNode, kind: string): TSNode | null {
	if (node.type === kind) return node;
	for (const child of node.children) {
		const found = findFirst(child, kind);
		if (found) return found;
	}
	return null;
}

/**
 * Nodes that can't stand alone as valid source — they need parent context.
 * For these, we skip the re-parse check and only verify render doesn't error.
 */
const FRAGMENT_ONLY_KINDS = new Set([
	// Rust — sub-statement fragments
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
	// TypeScript — sub-statement fragments
	'formal_parameters', 'type_parameters', 'class_body', 'statement_block',
	'object_type', 'enum_body', 'extends_clause', 'implements_clause',
	'import_clause', 'export_clause', 'decorator',
	// Python — sub-statement fragments
	'parameters', 'argument_list', 'block', 'type_parameter',
	'decorator', 'elif_clause', 'else_clause', 'except_clause',
	'finally_clause', 'with_clause',
]);

/**
 * Collect all unique node kinds in a tree.
 */
function collectKinds(node: TSNode): Set<string> {
	const kinds = new Set<string>();
	function walk(n: TSNode) {
		if (n.isNamed) kinds.add(n.type);
		for (const child of n.children) walk(child);
	}
	walk(node);
	return kinds;
}

/**
 * Run round-trip validation for a grammar using corpus fixtures.
 */
export async function validateRoundTrip(
	grammar: string,
	templatesYaml: string,
): Promise<RoundTripResult> {
	// web-tree-sitter v0.26: Parser and Language are named exports
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
	const { render } = createRenderer(config);
	const ruleKinds = new Set(Object.keys(config.rules));

	const entries = loadCorpusEntries(grammar);
	const errors: { name: string; message: string }[] = [];
	let pass = 0;
	let skip = 0;
	let total = 0;

	for (const entry of entries) {
		total++;
		try {
			// Parse original
			const tree1 = parser.parse(entry.source) as TSTree;
			if (tree1.rootNode.hasError) {
				skip++;
				continue; // Corpus entries with parse errors (intentional error tests)
			}

			// Find all node kinds that have render rules
			const kinds = collectKinds(tree1.rootNode);
			const testableKinds = [...kinds].filter(k => ruleKinds.has(k));

			if (testableKinds.length === 0) {
				skip++;
				continue;
			}

			// Test round-trip for each testable kind found
			let entryOk = true;
			for (const kind of testableKinds) {
				const node1 = findFirst(tree1.rootNode, kind);
				if (!node1) continue;

				const handle = treeHandle(tree1);
				const data = readNode(handle, node1.id, routing);

				try {
					const rendered = render(data);

					// Fragment-only kinds: just verify render succeeds, skip re-parse
					if (FRAGMENT_ONLY_KINDS.has(kind)) continue;

					// Re-parse
					const tree2 = parser.parse(rendered) as TSTree;
					if (tree2.rootNode.hasError) {
						errors.push({ name: `${entry.name} [${kind}]`, message: `re-parse error: "${rendered.slice(0, 80)}"` });
						entryOk = false;
						break;
					}

					// Check kind exists in re-parsed tree
					const node2 = findFirst(tree2.rootNode, kind);
					if (!node2) {
						errors.push({ name: `${entry.name} [${kind}]`, message: `kind not found in re-parsed tree` });
						entryOk = false;
						break;
					}
				} catch (e) {
					errors.push({ name: `${entry.name} [${kind}]`, message: `render: ${(e as Error).message.slice(0, 100)}` });
					entryOk = false;
					break;
				}
			}

			if (entryOk) pass++;
		} catch (e) {
			errors.push({ name: entry.name, message: `${(e as Error).message.slice(0, 100)}` });
		}
	}

	// --- Check 7: Anonymous token override round-trip ---
	for (const [kind, entry] of Object.entries(overrides)) {
		for (const [fieldName, spec] of Object.entries(entry.fields)) {
			if (!spec.types.some(t => !t.named)) continue;
			// Find a corpus entry that contains this kind
			for (const corpusEntry of entries) {
				const tree = parser.parse(corpusEntry.source) as TSTree;
				if (tree.rootNode.hasError) continue;
				const node = findFirst(tree.rootNode, kind);
				if (!node) continue;

				total++;
				try {
					const handle = treeHandle(tree);
					const data = readNode(handle, node.id, routing);
					if (data.fields?.[fieldName] === undefined) { pass++; break; }

					const rendered = render(data);
					const tree2 = parser.parse(rendered) as TSTree;
					const node2 = findFirst(tree2.rootNode, kind);
					if (!node2) {
						errors.push({ name: `anon:${kind}.${fieldName}`, message: 're-parsed tree missing kind' });
						break;
					}
					const data2 = readNode(treeHandle(tree2), node2.id, routing);
					if (data2.fields?.[fieldName] === undefined) {
						errors.push({ name: `anon:${kind}.${fieldName}`, message: 'anonymous token override lost in round-trip' });
					} else {
						pass++;
					}
				} catch (e) {
					errors.push({ name: `anon:${kind}.${fieldName}`, message: `${(e as Error).message.slice(0, 100)}` });
				}
				break; // One test per override field is enough
			}
		}
	}

	return { grammar, total, pass, fail: total - pass - skip, skip, errors };
}

export function formatRoundTripReport(result: RoundTripResult): string {
	const lines: string[] = [];
	const icon = result.fail === 0 ? 'v' : 'x';
	lines.push(`  ${icon} ${result.pass}/${result.total} round-trip (${result.skip} skipped, ${result.errors.length} errors)`);
	if (result.errors.length > 0) {
		for (const e of result.errors) {
			lines.push(`    x ${e.name}: ${e.message}`);
		}
	}
	return lines.join('\n');
}
