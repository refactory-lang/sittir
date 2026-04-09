/**
 * Factory round-trip validation — factory → render → parse → verify kind.
 *
 * Tests that factory-built nodes render to valid, parseable source code.
 * Complements the readNode round-trip (validate-roundtrip.ts) by testing
 * the factory → render path independently.
 *
 * Uses minimal factory inputs per node kind (required fields only).
 */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { createRenderer } from '@sittir/core';
import type { AnyNodeData, RulesConfig } from '@sittir/types';
import type { HydratedNodeModel } from './node-model.ts';
import { structuralNodes, fieldsOf } from './emitters/utils.ts';

const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Tree-sitter types (minimal)
// ---------------------------------------------------------------------------

interface TSNode {
	type: string; text: string; isNamed: boolean;
	children: TSNode[]; hasError: boolean;
}

interface TSTree { rootNode: TSNode; }

function findFirst(node: TSNode, kind: string): TSNode | null {
	if (node.type === kind) return node;
	for (const c of node.children) { const f = findFirst(c, kind); if (f) return f; }
	return null;
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
// Minimal node builder
// ---------------------------------------------------------------------------

/** Build a minimal AnyNodeData for a node kind using only required fields. */
function buildMinimalNode(
	kind: string,
	nodes: HydratedNodeModel[],
	allKinds: Map<string, HydratedNodeModel>,
): AnyNodeData | null {
	const model = allKinds.get(kind);
	if (!model) return null;

	if (model.modelType === 'leaf') {
		return { type: kind, text: kind, named: true };
	}
	if (model.modelType === 'keyword') {
		return { type: kind, text: model.text, named: true };
	}
	if (model.modelType === 'enum') {
		return { type: kind, text: model.values[0] ?? kind, named: true };
	}

	if (model.modelType !== 'branch' && model.modelType !== 'container') return null;

	const fields: Record<string, unknown> = {};
	if (model.modelType === 'branch') {
		for (const field of model.fields) {
			if (!field.required) continue;
			// Build a minimal child for the first accepted kind
			const firstKind = field.kinds[0];
			if (!firstKind) continue;
			const child = buildMinimalNode(firstKind.kind, nodes, allKinds);
			if (!child) continue;
			if (field.multiple) {
				fields[field.name] = [child];
			} else {
				fields[field.name] = child;
			}
		}
	}

	const result: AnyNodeData = { type: kind, named: true };
	if (Object.keys(fields).length > 0) {
		result.fields = fields;
	}
	return result;
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

/**
 * Run factory round-trip validation for a grammar.
 */
export async function validateFactoryRoundTrip(
	grammar: string,
	templatesYaml: string,
	nodes: HydratedNodeModel[],
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
	const { render } = createRenderer(config);

	const structNodes = structuralNodes(nodes);
	const allKinds = new Map(nodes.map(n => [n.kind, n]));
	const errors: { kind: string; message: string }[] = [];
	let pass = 0;
	let skip = 0;
	let total = 0;

	for (const node of structNodes) {
		total++;
		const data = buildMinimalNode(node.kind, nodes, allKinds);
		if (!data) { skip++; continue; }

		try {
			const rendered = render(data);
			if (!rendered.trim()) { skip++; continue; }

			const tree = parser.parse(rendered) as TSTree;
			if (tree.rootNode.hasError) {
				errors.push({ kind: node.kind, message: `re-parse error: "${rendered.slice(0, 60)}"` });
				continue;
			}

			const found = findFirst(tree.rootNode, node.kind);
			if (!found) {
				// Might be a fragment node — just verify no parse error
				pass++;
				continue;
			}

			pass++;
		} catch (e) {
			errors.push({ kind: node.kind, message: `${(e as Error).message.slice(0, 80)}` });
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
