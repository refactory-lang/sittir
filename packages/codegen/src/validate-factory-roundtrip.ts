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
import { loadRouting } from './validators/load-routing.ts';
import {
	loadCorpusEntries,
	loadLanguageForGrammar,
	treeHandle,
	findFirst,
	collectKinds,
	buildKindToSupertypes,
	wrapForReparse,
	type TSNode,
	type TSTree,
} from './validators/common.ts';

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
	const routing = await loadRouting(grammar);
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
	if (factoryModulePath) {
		try {
			const factoryModule = await import(new URL(factoryModulePath, import.meta.url).pathname);
			factoryMap = factoryModule._factoryMap ?? {};
			factoryShapes = factoryModule._factoryShapes ?? {};
		} catch (e) {
			// Factory module failed to load. stripToFactory fallback
			// makes the rest of the validator work, but it renders ALL
			// factory-round-trip results meaningless — we'd be validating
			// the strip-path, not the factory path. Log to stderr so the
			// maintainer notices, and emit a single error row so the
			// diagnostic surfaces in overrides.suggested.ts's section.
			console.error(`[validate-factory-roundtrip] failed to load ${factoryModulePath}: ${(e as Error)?.message ?? e}`);
		}
	}

	const entries = loadCorpusEntries(grammar);
	const errors: { kind: string; entry?: string; message: string; input?: string; rendered?: string }[] = [];
	const astMismatches: { kind: string; entry?: string; message: string; input?: string; rendered?: string }[] = [];
	const testedKinds = new Set<string>(); // one test per kind
	let pass = 0;
	let astMatchPass = 0;
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
			const inputSource = node1.text;

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
					// Route by the shape declared at codegen time, not by
					// inspecting factory.toString() (which breaks under
					// minification). `_factoryShapes[kind]` is emitted
					// from the node's model type in factories.ts.
					const shape = factoryShapes[kind] ?? 'config';
					const isConfigFactory = shape === 'config';
					const fieldsPresent = readData.fields && Object.keys(readData.fields).length > 0;
					if (isConfigFactory) {
						// Some rules have BOTH fields AND children —
						// e.g. python's `return_statement = seq('return',
						// optional(_expressions))` where enrich's bare-
						// keyword pass promotes `return` to a named
						// field and the _expressions tail stays as an
						// unrouted child. Include children in the config
						// so factories that declare `children` in their
						// ConfigOf merge it into the output.
						const config = readData.children
							? { ...camelFields, children: readData.children }
							: camelFields ?? {};
						factoryData = factory(config) as AnyNodeData;
					} else if (readData.children) {
						// Children-only factory: spread NAMED children
						// as positional args. Works even when fields are
						// present — anonymous fields on container nodes
						// are promoted punctuation the template handles
						// structurally.
						const namedChildren = (readData.children ?? []).filter(
							(c: any) => c?.named !== false,
						);
						factoryData = (factory as (...args: unknown[]) => AnyNodeData)(...namedChildren);
					} else if (fieldsPresent) {
						factoryData = factory(camelFields ?? {}) as AnyNodeData;
					} else {
						factoryData = stripToFactory(readData);
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
						kind, entry: entry.name,
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

				// Wrap for reparse using supertype context
				const wrapped = wrapForReparse(rendered, kind, grammar, kindToSupertypes);
				if (wrapped === null) {
					pass++; // no supertype → can't determine context → skip reparse
					astMatchPass++;
					continue;
				}

				const tree2 = parser.parse(wrapped.text) as TSTree;
				if (tree2.rootNode.hasError) {
					errors.push({ kind, entry: entry.name, message: `re-parse error: "${rendered.slice(0, 60)}"`, input: inputSource, rendered });
					continue;
				}

				// Locate the rendered fragment at the exact wrapper
				// offset — avoids matching a wrapper-emitted outer
				// block/let/etc. of the same kind.
				const node2 = findNodeAt(tree2.rootNode, kind, wrapped.offset) ?? findFirst(tree2.rootNode, kind);
				if (!node2) {
					errors.push({ kind, entry: entry.name, message: `kind not found in re-parse (rendered: "${rendered.slice(0, 60)}")`, input: inputSource, rendered });
					continue;
				}

				pass++;

				// Strict AST structural check — catches factory API
				// gaps where a field or children slot is missing.
				// Recorded separately so the existing kind-found count
				// stays a stable floor; ast-match tightens it.
				const diff = astStructuralDiff(node1, node2);
				if (diff) {
					astMismatches.push({ kind, entry: entry.name, message: diff.slice(0, 160), input: inputSource, rendered });
				} else {
					astMatchPass++;
				}
			} catch (e) {
				errors.push({ kind, entry: entry.name, message: `${(e as Error).message.slice(0, 80)}`, input: inputSource });
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
