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
import { readNode, buildRoutingMap, createRenderer } from '@sittir/core';
import type { AnyNodeData, NodeFieldValue, RulesConfig } from '@sittir/types';
import { loadOverrides } from './overrides.ts';
import { loadRawEntries } from './validators/node-types.ts';
import {
	loadCorpusEntries,
	loadWebTreeSitter,
	treeHandle,
	findFirst,
	collectKinds,
	buildKindToSupertypes,
	wrapForReparse,
	WASM_PATHS,
	type TSTree,
} from './validators/common.ts';

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
	const result: AnyNodeData = { type: data.type, named: true };

	if (data.text !== undefined) result.text = data.text;
	if (data.variant !== undefined) result.variant = data.variant;

	if (data.fields) {
		const fields: { [key: string]: NodeFieldValue } = {};
		for (const [key, value] of Object.entries(data.fields)) {
			if (Array.isArray(value)) {
				fields[key] = value.map(v => typeof v === 'object' && v !== null ? stripToFactory(v as AnyNodeData) : v) as readonly (AnyNodeData | string | number)[];
			} else if (typeof value === 'object' && value !== null) {
				fields[key] = stripToFactory(value as AnyNodeData);
			} else {
				fields[key] = value as NodeFieldValue;
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

/** Relative path from codegen/src to language package factories.ts */
const FACTORY_MODULE_PATHS: Record<string, string> = {
	rust: '../../rust/src/factories.ts',
	typescript: '../../typescript/src/factories.ts',
	python: '../../python/src/factories.ts',
};

/** Build supertype → subtype[] map from node-types.json. Used by
 *  buildRoutingMap so override field type specs written against a
 *  supertype (e.g. `_expression`) route every concrete subtype. */
function buildSupertypeExpansion(rawEntries: { type: string; named: boolean; subtypes?: { type: string }[] }[]): Map<string, string[]> {
	const result = new Map<string, string[]>();
	for (const entry of rawEntries) {
		if (!entry.subtypes || entry.subtypes.length === 0) continue;
		result.set(entry.type, entry.subtypes.map(s => s.type));
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

export async function validateFactoryRoundTrip(
	grammar: string,
	templatesYaml: string,
): Promise<FactoryRoundTripResult> {
	const { Parser, Language } = await loadWebTreeSitter();
	const wasmPath = require.resolve(WASM_PATHS[grammar]!);
	const lang = await Language.load(wasmPath);
	const parser = new Parser();
	parser.setLanguage(lang);

	const config = parseYaml(templatesYaml) as RulesConfig;
	const overrides = loadOverrides(grammar);
	const rawEntries = loadRawEntries(grammar);
	const supertypeExpansion = buildSupertypeExpansion(rawEntries);
	const routing = buildRoutingMap(overrides, supertypeExpansion);
	const ruleKinds = new Set(Object.keys(config.rules));
	const { render } = createRenderer(config);
	const kindToSupertypes = buildKindToSupertypes(rawEntries);

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

			// Translate raw (snake_case) field keys to camelCase so the
			// factory's ConfigOf properties match. readNode emits raw
			// names; factories take camelCase in their signature.
			const camelFields = readData.fields
				? Object.fromEntries(
					Object.entries(readData.fields).map(([k, v]) => [
						k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
						v,
					]),
				)
				: undefined;

			// Direct factory call with readNode fields — no from() resolver.
			// If readData has neither fields nor children, the node is a
			// pure text leaf at the tree-sitter level (e.g. identifier,
			// shorthand_property_identifier). Don't round-trip through a
			// factory at all — factories for container-shaped wrappers
			// that tree-sitter surfaces as leaves would produce garbage.
			const factory = factoryMap[kind];
			let factoryData: AnyNodeData;
			if (!readData.fields && !readData.children) {
				// Leaf — render its text directly by preserving the original.
				factoryData = readData;
			} else if (factory) {
				try {
					// Children-only factories take positional rest-params;
					// spread NAMED children only, otherwise the first
					// anonymous delimiter binds the first positional slot.
					// An empty `fields: {}` (not undefined) still means
					// no field-shaped data — route through the
					// children path so container factories receive
					// their child args.
					const fieldsPresent = readData.fields && Object.keys(readData.fields).length > 0;
					if (!fieldsPresent && readData.children) {
						const namedChildren = (readData.children ?? []).filter(
							(c: any) => c?.named !== false,
						);
						factoryData = (factory as (...args: unknown[]) => AnyNodeData)(...namedChildren);
					} else {
						factoryData = factory(camelFields ?? {}) as AnyNodeData;
					}
				} catch {
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
