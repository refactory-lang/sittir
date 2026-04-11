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
import { loadRawEntries } from './grammar-reader.ts';

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
		while (i < lines.length && !lines[i]!.match(/^-{3,}$/)) {
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
 * Supertype-based reparse wrapping — replaces manual FRAGMENT_ONLY_KINDS.
 */
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

function wrapForReparse(
	rendered: string, kind: string, grammar: string,
	kindToSupertypes: Map<string, string[]>,
): string | null {
	const supertypes = kindToSupertypes.get(kind);
	if (!supertypes || supertypes.length === 0) return null;
	const wrappers = REPARSE_WRAPPERS[grammar];
	if (!wrappers) return null;
	for (const st of supertypes) {
		const wrapper = wrappers[st];
		if (wrapper) return wrapper(rendered);
	}
	return null;
}

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
	const kindToSupertypes = buildKindToSupertypes(loadRawEntries(grammar));

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

					// Wrap for reparse using supertype context
					const wrapped = wrapForReparse(rendered, kind, grammar, kindToSupertypes);
					if (wrapped === null) continue; // no supertype → skip reparse

					// Re-parse
					const tree2 = parser.parse(wrapped) as TSTree;
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
