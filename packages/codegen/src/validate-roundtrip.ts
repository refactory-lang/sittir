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
import { parse as parseYaml } from 'yaml';
import { readNode, buildRoutingMap, createRenderer } from '@sittir/core';
import type { RulesConfig } from '@sittir/types';
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
	type TSNode,
	type TSTree,
} from './validators/common.ts';

const require = createRequire(import.meta.url);

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

/**
 * Run round-trip validation for a grammar using corpus fixtures.
 */
export async function validateRoundTrip(
	grammar: string,
	templatesYaml: string,
): Promise<RoundTripResult> {
	const { Parser, Language } = await loadWebTreeSitter();
	const wasmPath = require.resolve(WASM_PATHS[grammar]!);
	const lang = await Language.load(wasmPath);
	const parser = new Parser();
	parser.setLanguage(lang);

	const config = parseYaml(templatesYaml) as RulesConfig;
	const overrides = loadOverrides(grammar);
	const rawEntries = loadRawEntries(grammar);
	// Expand override field supertype specs (e.g. `_expression`) to the
	// concrete subtype list from node-types.json so routing matches the
	// kinds that actually show up at parse time.
	const supertypeExpansion = new Map<string, string[]>();
	for (const entry of rawEntries) {
		if (entry.subtypes && entry.subtypes.length > 0) {
			supertypeExpansion.set(entry.type, entry.subtypes.map(s => s.type));
		}
	}
	const routing = buildRoutingMap(overrides, supertypeExpansion);
	const { render } = createRenderer(config);
	const ruleKinds = new Set(Object.keys(config.rules));
	const kindToSupertypes = buildKindToSupertypes(rawEntries);

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
