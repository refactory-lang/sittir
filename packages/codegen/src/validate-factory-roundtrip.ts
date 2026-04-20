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
import { parse as parseYaml } from 'yaml';
import { readNode, createRenderer } from '@sittir/core';
import type { AnyNodeData, NodeFieldValue, RulesConfig } from '@sittir/types';
import { loadRawEntries } from './validators/node-types.ts';
import {
	loadCorpusEntries,
	loadLanguageForGrammar,
	treeHandle,
	findFirst,
	collectKinds,
	buildKindToSupertypes,
	wrapForReparse,
	loadReadTreeNode,
	walkWrappedTree,
	nodeToConfig,
	type TSNode,
	type TSTree,
	type WrappedNodeData,
} from './validators/common.ts';

/** Find a node anywhere in the tree by its numeric id. Used by the
 * wrap-aware kind resolution path (ADR-0006) to recover a TSNode for
 * an alias-source kind first encountered via the wrapped-tree walk. */
function findNodeById(node: TSNode, nodeId: number): TSNode | null {
	if (node.id === nodeId) return node;
	for (let i = 0; i < node.childCount; i++) {
		const c = node.child(i);
		if (!c) continue;
		const hit = findNodeById(c, nodeId);
		if (hit) return hit;
	}
	return null;
}

/**
 * Strict AST structural equality — same shape as validate-roundtrip.
 * Anonymous tokens compared byte-exactly so silently dropped content
 * (commas, operators, terminators) fails the check.
 */
function astStructuralDiff(a: TSNode, b: TSNode, path: string = ''): string | null {
	if (a.type !== b.type) {
		return `${path || 'root'}: type ${a.type} ≠ ${b.type}`;
	}
	if (a.childCount !== b.childCount) {
		const aChildren = Array.from({ length: a.childCount }, (_, i) => {
			const c = a.child(i);
			return c ? (c.isNamed ? c.type : JSON.stringify(c.text)) : '?';
		}).join(',');
		const bChildren = Array.from({ length: b.childCount }, (_, i) => {
			const c = b.child(i);
			return c ? (c.isNamed ? c.type : JSON.stringify(c.text)) : '?';
		}).join(',');
		return `${path || a.type}: childCount ${a.childCount} ≠ ${b.childCount} [${aChildren}] vs [${bChildren}]`;
	}
	for (let i = 0; i < a.childCount; i++) {
		const ac = a.child(i);
		const bc = b.child(i);
		if (!ac || !bc) return `${path || a.type}[${i}]: missing child`;
		if (ac.isNamed !== bc.isNamed) {
			return `${path || a.type}[${i}]: named flag ${ac.isNamed} ≠ ${bc.isNamed}`;
		}
		if (!ac.isNamed) {
			if (ac.text !== bc.text) {
				return `${path || a.type}[${i}]: anon ${JSON.stringify(ac.text)} ≠ ${JSON.stringify(bc.text)}`;
			}
			continue;
		}
		const sub = astStructuralDiff(ac, bc, `${path || a.type}[${i}].${ac.type}`);
		if (sub) return sub;
	}
	return null;
}

/** Find the first node of `kind` whose `startIndex` equals `offset`. */
function findNodeAt(node: TSNode, kind: string, offset: number): TSNode | null {
	if (node.type === kind && node.startIndex === offset) return node;
	for (let i = 0; i < node.childCount; i++) {
		const c = node.child(i);
		if (!c) continue;
		if (offset < c.startIndex || offset >= c.endIndex) continue;
		const hit = findNodeAt(c, kind, offset);
		if (hit) return hit;
	}
	return null;
}

const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Strip runtime metadata to simulate factory output
// ---------------------------------------------------------------------------

/**
 * Strip span, nodeId, and set named:true on all nodes recursively.
 * This simulates what a factory-built NodeData looks like — no runtime
 * metadata from tree-sitter, all children are named NodeData objects.
 */
function stripToFactory(data: AnyNodeData): AnyNodeData {
	const result: AnyNodeData = { $type: data.$type, $source: 'factory', $named: true };

	if (data.$text !== undefined) result.$text = data.$text;
	if (data.$variant !== undefined) result.$variant = data.$variant;

	if (data.$fields) {
		const fields: { [key: string]: NodeFieldValue } = {};
		for (const [key, value] of Object.entries(data.$fields)) {
			if (Array.isArray(value)) {
				fields[key] = value.map(v => typeof v === 'object' && v !== null ? stripToFactory(v as AnyNodeData) : v) as readonly (AnyNodeData | string | number)[];
			} else if (typeof value === 'object' && value !== null) {
				fields[key] = stripToFactory(value as AnyNodeData);
			} else {
				fields[key] = value as NodeFieldValue;
			}
		}
		result.$fields = fields;
	}

	if (data.$children) {
		// Factory nodes only have named children — filter anonymous
		result.$children = (data.$children as AnyNodeData[])
			.filter(c => c.$named !== false)
			.map(c => typeof c === 'object' && c !== null ? stripToFactory(c as AnyNodeData) : c);
	}

	return result;
}

/** Relative path from codegen/src to language package factories.ts */
const FACTORY_MODULE_PATHS: Record<string, string> = {
	rust: '../../rust/src/factories.ts',
	typescript: '../../typescript/src/factories.ts',
	python: '../../python/src/factories.ts',
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface FactoryRoundTripResult {
	grammar: string;
	total: number;
	pass: number;
	fail: number;
	skip: number;
	/**
	 * Strict-structural pass count. A factory build round-trips with
	 * full fidelity when the reparsed tree matches the original parse
	 * byte-exactly on anonymous tokens. Subset of `pass` (kind-found
	 * is weaker). Surfaces factory API gaps that kind-found misses —
	 * missing field surface, dropped children slots, wrong defaults.
	 */
	astMatchPass: number;
	errors: { kind: string; entry?: string; message: string; input?: string; rendered?: string }[];
	astMismatches: { kind: string; entry?: string; message: string; input?: string; rendered?: string }[];
}

export async function validateFactoryRoundTrip(
	grammar: string,
	templatesYaml: string,
): Promise<FactoryRoundTripResult> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);

	const config = parseYaml(templatesYaml) as RulesConfig;
	const rawEntries = loadRawEntries(grammar);
	const ruleKinds = new Set(Object.keys(config.rules));
	const { render } = createRenderer(config);
	const kindToSupertypes = buildKindToSupertypes(rawEntries);

	// Dynamically import the generated _factoryMap + _factoryShapes for
	// this grammar. `_factoryShapes[kind]` tells us whether to call the
	// factory as `factory(config)` or `factory(...children)` — produced
	// at codegen time from the node's model type, not inferred at runtime.
	const factoryModulePath = FACTORY_MODULE_PATHS[grammar];
	let factoryMap: Record<string, (config?: any) => unknown> = {};
	let factoryShapes: Record<string, 'config' | 'children' | 'text'> = {};
	let fieldAliasMap: Record<string, Record<string, string>> = {};
	const importFailure: { message: string } | null = await (async () => {
		if (!factoryModulePath) return null;
		try {
			const factoryModule = await import(new URL(factoryModulePath, import.meta.url).pathname);
			factoryMap = factoryModule._factoryMap ?? {};
			factoryShapes = factoryModule._factoryShapes ?? {};
			fieldAliasMap = factoryModule._fieldAliasMap ?? {};
			return null;
		} catch (e) {
			const message = `[validate-factory-roundtrip] failed to load ${factoryModulePath}: ${(e as Error)?.message ?? e}`;
			console.error(message);
			return { message };
		}
	})();

	// Walker-based alias source resolution (ADR-0006): same infrastructure
	// as validate-roundtrip.ts. When the wrap layer is available, walk
	// the tree once per corpus entry to surface alias-source `$type`s,
	// then test those kinds via their source templates + reparse wrappers.
	const readTreeNodeFn = await loadReadTreeNode(grammar);

	const entries = loadCorpusEntries(grammar);
	const errors: { kind: string; entry?: string; message: string; input?: string; rendered?: string }[] = [];
	const astMismatches: { kind: string; entry?: string; message: string; input?: string; rendered?: string }[] = [];
	// Dedupe on (kind, entry) pairs so each corpus entry that contains
	// a kind gets exercised once — earlier behaviour (one test per kind
	// period) hid real bugs: if the first corpus entry happened to
	// exercise a shape that worked, subsequent entries testing buggy
	// shapes (e.g. python `comparison_operator` with `not in` vs the
	// chained `a < b`) never ran. The (kind, entry) granularity keeps
	// runtime bounded while catching shape-specific bugs.
	const testedPairs = new Set<string>();
	let pass = 0;
	let astMatchPass = 0;
	let skip = 0;
	let total = 0;

	// Surface factory-module load failure in the error list. Without
	// this row, an empty `factoryMap` silently routes every kind to
	// `stripToFactory` and the reported "factory pass" count reflects
	// the strip path, not the factory path — a false-green.
	if (importFailure) {
		errors.push({
			kind: '(factory-module-load)',
			message: importFailure.message,
		});
	}

	for (const entry of entries) {
		const tree1 = parser.parse(entry.source) as TSTree;
		if (tree1.rootNode.hasError) continue;

		const handle = treeHandle(tree1);
		const kinds = new Set(collectKinds(tree1.rootNode));
		const nodeIdToEffectiveType = new Map<number, string>();
		if (readTreeNodeFn) {
			const wrappedRoot = readTreeNodeFn(handle);
			walkWrappedTree(wrappedRoot, (w: WrappedNodeData) => {
				if (w.$nodeId != null) nodeIdToEffectiveType.set(w.$nodeId, w.$type);
				kinds.add(w.$type);
			});
		}
		for (const kind of kinds) {
			if (!ruleKinds.has(kind)) continue;
			const pairKey = `${kind}\0${entry.name}`;
			if (testedPairs.has(pairKey)) continue;
			testedPairs.add(pairKey);
			total++;

			// Resolve node: for alias-source kinds (not in tree-sitter's
			// raw kinds), look up by nodeId from the walker. Plain kinds
			// use findFirst.
			let node1: TSNode | null = null;
			for (const [nid, et] of nodeIdToEffectiveType) {
				if (et === kind) {
					node1 = findNodeById(tree1.rootNode, nid);
					if (node1) break;
				}
			}
			if (!node1) node1 = findFirst(tree1.rootNode, kind);
			if (!node1) continue;
			const inputSource = node1.text;

			// readNode → direct factory call → render → re-parse
			const rawReadData = readNode(handle, node1.id);
			const effective = nodeIdToEffectiveType.get(node1.id);
			const readData = effective && effective !== rawReadData.$type
				? { ...rawReadData, $type: effective }
				: rawReadData;
			const renderedKind = readData.$type;
			const targetKind = rawReadData.$type;

			// Direct factory call with readNode fields — no from() resolver.
			// If readData has neither $fields nor $children, the node is a
			// pure text leaf at the tree-sitter level (e.g. identifier,
			// shorthand_property_identifier). Don't round-trip through a
			// factory at all — factories for container-shaped wrappers
			// that tree-sitter surfaces as leaves would produce garbage.
			// Factory lookup uses the walker-resolved kind (source when
			// the node was drillAs-rewritten, target otherwise). Both
			// alias source and target factories are registered; picking
			// the source-shape factory produces output whose $type
			// matches our declared interface.
			const factory = factoryMap[renderedKind];
			let factoryData: AnyNodeData;
			if (!readData.$fields && !readData.$children) {
				// Leaf — render its text directly by preserving the original.
				factoryData = readData;
			} else if (factory) {
				try {
					const shape = factoryShapes[renderedKind] ?? 'config';
					if (shape === 'config') {
						// `nodeToConfig` handles the $fields snake→camel rename
						// and the $children → `children` slot convention.
						// Shallow mode (no tree / factoryMap) keeps the same
						// behavior as the prior inline transform. Recursive
						// mode (opts in tree+factoryMap) drills each child
						// through its own factory — exposes factory-vs-read
						// shape mismatches at the cost of surfacing ~790
						// spacing / anon-token divergences that accumulated
						// unchecked for months; flip SITTIR_VALIDATE_RECURSIVE
						// to audit them.
						const recursive = process?.env?.SITTIR_VALIDATE_RECURSIVE === '1';
						const config = recursive
							? nodeToConfig(readData, { tree: handle, factoryMap, factoryShapes, fieldAliasMap })
							: nodeToConfig(readData);
						factoryData = factory(config) as AnyNodeData;
					} else if (shape === 'text') {
						// $TEXT-templated branch/container (e.g. rust
						// raw_string_literal) — factory accepts the raw
						// source span because external-scanner delimiters
						// can't be reconstructed from children.
						const text = (readData as { $text?: string }).$text ?? '';
						factoryData = (factory as (text: string) => AnyNodeData)(text);
					} else {
						// shape === 'children' — container factory.
						const namedChildren = (readData.$children ?? []).filter(
							(c: any) => c?.$named !== false,
						);
						factoryData = (factory as (...args: unknown[]) => AnyNodeData)(...namedChildren);
					}
				} catch (e) {
					// A real factory throw (wrong argument shape,
					// missing dependency, bug in the generated code)
					// surfaces as a factory-RT error so it's visible in
					// overrides.suggested.ts — silently falling back to
					// stripToFactory would make the "factory pass" count
					// fake. Record + skip this kind, don't continue the
					// reparse loop.
					errors.push({
						kind: renderedKind, entry: entry.name,
						message: `factory threw: ${(e as Error)?.message?.slice(0, 100) ?? String(e)}`,
						input: inputSource,
					});
					continue;
				}
			} else {
				factoryData = stripToFactory(readData);
			}

			try {
				const rendered = render(factoryData);
				if (!rendered.trim()) { skip++; continue; }

				// Wrap for reparse using supertype context. `renderedKind`
				// picks up source-kind-specific wrappers (e.g. rust's
				// `generic_type_with_turbofish`) when the walker
				// rewrote $type.
				const wrapped = wrapForReparse(rendered, renderedKind, grammar, kindToSupertypes);
				if (wrapped === null) {
					// No wrapper registered for this kind's supertype (or the
					// kind has no supertype). Historically counted as pass +
					// astMatchPass, which silently fake-passed every TS kind
					// (wrapper map used hidden-prefixed supertype names that
					// don't match tree-sitter-typescript's unprefixed ones).
					// Count as skip — the validator can't make a claim either
					// way — so ceiling assertions reflect real evidence.
					skip++;
					continue;
				}

				const tree2 = parser.parse(wrapped.text) as TSTree;
				if (tree2.rootNode.hasError) {
					errors.push({ kind: renderedKind, entry: entry.name, message: `re-parse error: "${rendered.slice(0, 60)}"`, input: inputSource, rendered });
					continue;
				}

				// Locate the rendered fragment at the exact wrapper
				// offset — avoids matching a wrapper-emitted outer
				// block/let/etc. of the same kind. `targetKind` (the
				// tree-sitter alias target) is what the reparsed tree
				// carries, since tree-sitter re-applies the alias.
				const node2 = findNodeAt(tree2.rootNode, targetKind, wrapped.offset) ?? findFirst(tree2.rootNode, targetKind);
				if (!node2) {
					errors.push({ kind: renderedKind, entry: entry.name, message: `kind not found in re-parse (rendered: "${rendered.slice(0, 60)}")`, input: inputSource, rendered });
					continue;
				}

				pass++;

				// Strict AST structural check — catches factory API
				// gaps where a field or children slot is missing.
				// Recorded separately so the existing kind-found count
				// stays a stable floor; ast-match tightens it.
				const diff = astStructuralDiff(node1, node2);
				if (diff) {
					astMismatches.push({ kind: renderedKind, entry: entry.name, message: diff.slice(0, 160), input: inputSource, rendered });
				} else {
					astMatchPass++;
				}
			} catch (e) {
				errors.push({ kind: renderedKind, entry: entry.name, message: `${(e as Error).message.slice(0, 80)}`, input: inputSource });
			}
		}
	}

	return {
		grammar,
		total,
		pass,
		fail: total - pass - skip,
		skip,
		astMatchPass,
		errors,
		astMismatches,
	};
}

export function formatFactoryRoundTripReport(result: FactoryRoundTripResult): string {
	const lines: string[] = [];
	const icon = result.fail === 0 ? 'v' : 'x';
	lines.push(`  ${icon} ${result.pass}/${result.total} factory round-trip (${result.skip} skipped, ${result.errors.length} errors)`);
	lines.push(`    ast-match ${result.astMatchPass}/${result.total} (${result.astMismatches.length} structural mismatches)`);
	if (result.errors.length > 0) {
		for (const e of result.errors) {
			lines.push(`    x ${e.kind}: ${e.message}`);
		}
	}
	if (result.astMismatches.length > 0) {
		for (const e of result.astMismatches.slice(0, 20)) {
			lines.push(`    ~ ${e.kind}: ${e.message}`);
		}
		if (result.astMismatches.length > 20) {
			lines.push(`    … and ${result.astMismatches.length - 20} more`);
		}
	}
	return lines.join('\n');
}
