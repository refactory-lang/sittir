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
import { parse as parseYaml } from 'yaml';
import { readNode } from '@sittir/core';
import type { AnyNodeData, RulesConfig } from '@sittir/types';
import {
	loadCorpusEntries,
	loadLanguageForGrammar,
	treeHandle,
	findFirst,
	collectKinds,
	type TSTree,
} from './validators/common.ts';

const require = createRequire(import.meta.url);

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

const WRAP_MODULE_PATHS: Record<string, string> = {
	rust: '../../rust/src/wrap.ts',
	typescript: '../../typescript/src/wrap.ts',
	python: '../../python/src/wrap.ts',
};

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

/**
 * Shallow structural diff: compare type, factory-declared field keys,
 * named children count.
 *
 * The factory output `b` is the ground truth for "what fields this kind
 * declares." Any field in `from()` output `a` that isn't in `b` is
 * acceptable runtime metadata (promoted anonymous keywords like `fn`,
 * `{`, `;` from `readNode.promoteAnonymousKeyword`, tree-sitter
 * punctuation, etc.) — those don't count as divergence. Only mismatches
 * on keys the factory actually declared are real bugs.
 *
 * Undefined-valued entries are dropped before comparison — property
 * access can't distinguish `{a: undefined}` from `{}`, so the structural
 * comparison shouldn't either.
 */
function structuralDiff(a: AnyNodeData, b: AnyNodeData): string[] {
	const diffs: string[] = [];
	if (a.type !== b.type) diffs.push(`type: ${a.type} vs ${b.type}`);

	const definedKeys = (fields: Record<string, unknown> | undefined): string[] =>
		Object.entries(fields ?? {})
			.filter(([, v]) => v !== undefined)
			.map(([k]) => k);

	const bKeys = new Set(definedKeys(b.fields as Record<string, unknown> | undefined));
	const aKeysMatchingB = definedKeys(a.fields as Record<string, unknown> | undefined)
		.filter(k => bKeys.has(k));

	// One-way check: fields factory declared that from() didn't fill in.
	const missingInA = [...bKeys].filter(k => !aKeysMatchingB.includes(k)).sort();
	if (missingInA.length) diffs.push(`from() missing declared fields: ${missingInA.join(', ')}`);

	// Compare only named children — anonymous tokens (delimiters, separators)
	// are reconstructed from templates, not carried in factory output
	const aNamed = (a.children ?? []).filter((c: any) => c?.named !== false);
	const bNamed = (b.children ?? []).filter((c: any) => c?.named !== false);
	if (aNamed.length !== bNamed.length) diffs.push(`named children: ${aNamed.length} vs ${bNamed.length}`);

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
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);

	parseYaml(templatesYaml) as RulesConfig;

	// Import from() + factory + wrap modules. `.from()` expects a fluent
	// NodeData (from factory output OR readTreeNode wrap) OR a camelCase
	// loose bag — per spec 008 US3, bare `readNode` output isn't a
	// supported input. readTreeNode wraps readNode output via the per-kind
	// wrap function, producing a fluent NodeData that `.from()` accepts.
	let fromMap: Record<string, (input: object) => unknown> = {};
	let factoryMap: Record<string, (config?: any) => unknown> = {};
	let factoryShapes: Record<string, 'config' | 'children' | 'text'> = {};
	let readTreeNode: ((tree: unknown, nodeId?: number) => unknown) | undefined;
	try {
		const fromModule = await import(new URL(FROM_MODULE_PATHS[grammar]!, import.meta.url).pathname);
		fromMap = fromModule._fromMap ?? {};
	} catch { /* from module unavailable */ }
	try {
		const factoryModule = await import(new URL(FACTORY_MODULE_PATHS[grammar]!, import.meta.url).pathname);
		factoryMap = factoryModule._factoryMap ?? {};
		factoryShapes = factoryModule._factoryShapes ?? {};
	} catch { /* factory module unavailable */ }
	try {
		const wrapModule = await import(new URL(WRAP_MODULE_PATHS[grammar]!, import.meta.url).pathname);
		readTreeNode = wrapModule.readTreeNode;
	} catch { /* wrap module unavailable */ }

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
			// Use readTreeNode (wrapped via per-kind dispatch) when available,
			// so `.from()` sees a fluent NodeData — the supported input shape
			// per spec 008 US3. Fall back to raw readNode if the wrap module
			// isn't loaded (bootstrap scenarios).
			const readData = readTreeNode
				? (readTreeNode(handle, node1.id) as AnyNodeData)
				: readNode(handle, node1.id);

			try {
				const fromResult = fromMap[kind]!(readData) as AnyNodeData;
				let factoryResult: AnyNodeData;
				try {
					// Route by the shape declared at codegen time — same
					// pattern as validate-factory-roundtrip.ts. Guessing
					// from `readData.fields` alone mis-routes empty
					// containers (python `()` has promoted `(`/`)` fields
					// but `children === undefined`, yet is a children-shape
					// factory that must dispatch as `factory()` with no args).
					const shape = factoryShapes[kind] ?? 'config';
					const factory = factoryMap[kind]!;
					if (shape === 'config') {
						const camelFields = readData.fields
							? Object.fromEntries(
								Object.entries(readData.fields).map(([k, v]) => [
									k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
									v,
								]),
							)
							: undefined;
						const config = readData.children
							? { ...camelFields, children: readData.children }
							: camelFields ?? {};
						factoryResult = factory(config) as AnyNodeData;
					} else if (shape === 'text') {
						factoryResult = (factory as (text: string) => AnyNodeData)(readData.text ?? '');
					} else {
						const namedChildren = (readData.children ?? []).filter(
							(c: any) => c?.named !== false,
						);
						factoryResult = (factory as (...args: unknown[]) => AnyNodeData)(
							...namedChildren,
						);
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
