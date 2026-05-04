/**
 * validate-readnode-roundtrip — pure structural check on readNode output.
 *
 * The other round-trip validators render the NodeData and reparse it to
 * catch template bugs. This one is upstream of that: it verifies that
 * readNode's projection of a tree-sitter parse tree into NodeData is
 * itself well-formed, without ever touching templates.
 *
 * For every named node kind that appears in the corpus fixtures, we:
 *
 *   1. Parse the corpus source with tree-sitter.
 *   2. Walk to the first instance of the kind.
 *   3. readNode it.
 *   4. Compare against tree-sitter's own view:
 *      - `.type` matches the node kind.
 *      - Every tree-sitter field name is represented in NodeData (either
 *        under `.fields` or — when routing promoted it — still under
 *        `.fields` with the override name).
 *      - Named children that are NOT tree-sitter fields (and not promoted
 *        via overrides) show up in `.children`.
 *      - Child counts agree after the field/override projection.
 *
 * A pass means: no field or named child went missing between the parse
 * tree and the NodeData. A fail means readNode (or the routing map) is
 * silently dropping content, and every downstream consumer (factory
 * round-trip, from(), render) will be working on a corrupted view.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { readNode } from '@sittir/core';
import type { AnyNodeData } from '@sittir/types';
import { loadRawEntries } from './node-types-loader.ts';
import {
	loadLanguageForGrammar,
	loadKindNameFromId,
	loadKindIdFromName,
	buildReadHandle,
	findFirst,
	findNativeNodeId,
	readNodeAt,
	adaptNode,
	collectKinds,
	emitValidatorMetrics,
	type TSNode,
	type TSTree
} from './common.ts';

// Tree-sitter adapter + tree walkers imported from validate/common.ts.
// See that file for the canonical TSNode/TSTree shapes (backed by web-tree-sitter's
// published TS.Node / TS.Tree types).

// ---------------------------------------------------------------------------
// Corpus parser — shared shape
// ---------------------------------------------------------------------------

interface CorpusEntry {
	name: string;
	source: string;
}

function parseCorpus(content: string): CorpusEntry[] {
	const entries: CorpusEntry[] = [];
	const lines = content.split('\n');
	let i = 0;
	while (i < lines.length) {
		if (!lines[i]!.startsWith('====')) {
			i++;
			continue;
		}
		i++;
		const name = lines[i]?.trim() ?? '';
		i++;
		while (i < lines.length && lines[i]!.startsWith('====')) i++;
		const sourceLines: string[] = [];
		while (i < lines.length && !lines[i]!.match(/^-{3,}$/)) {
			sourceLines.push(lines[i]!);
			i++;
		}
		while (i < lines.length && !lines[i]!.startsWith('====')) i++;
		const source = sourceLines.join('\n').trim();
		if (source) entries.push({ name, source });
	}
	return entries;
}

const FIXTURES_DIR = new URL('../../fixtures', import.meta.url).pathname;

function loadCorpusEntries(grammar: string): CorpusEntry[] {
	const entries: CorpusEntry[] = [];
	const files = readdirSync(FIXTURES_DIR).filter(
		(f) => f.startsWith(`${grammar}-`) && f.endsWith('.txt')
	);
	for (const file of files) {
		entries.push(
			...parseCorpus(readFileSync(join(FIXTURES_DIR, file), 'utf-8'))
		);
	}
	return entries;
}

// ---------------------------------------------------------------------------
// node-types.json → field name set per kind
// ---------------------------------------------------------------------------

/**
 * Build `kind → Set<fieldName>` from node-types.json. Used as the ground
 * truth for "what fields should readNode surface for this kind".
 */
function buildKindFieldMap(
	rawEntries: {
		type: string;
		named: boolean;
		fields?: Record<string, unknown>;
	}[]
): Map<string, Set<string>> {
	const result = new Map<string, Set<string>>();
	for (const entry of rawEntries) {
		if (!entry.named) continue;
		const fields = entry.fields ?? {};
		result.set(entry.type, new Set(Object.keys(fields)));
	}
	return result;
}

// ---------------------------------------------------------------------------
// Per-instance structural check
// ---------------------------------------------------------------------------

interface NodeIssue {
	kind: string;
	instance: string; // corpus entry name
	message: string;
}

/**
 * Collect the set of field names that the live parse tree assigns to children
 * of `node`, by querying `fieldNameForChild` for every child index.
 *
 * @remarks
 * We check against the ACTUAL node's field assignments, not the static
 * node-types declaration, because many fields are optional and only populate
 * on some parses.
 *
 * @param node - The tree-sitter parse node to inspect.
 * @returns A set of field name strings present on this specific parse instance.
 */
function collectLiveFieldNames(node: TSNode): Set<string> {
	const liveFieldNames = new Set<string>();
	for (let i = 0; i < node.childCount; i++) {
		const fname = node.fieldNameForChild(i);
		if (fname) liveFieldNames.add(fname);
	}
	return liveFieldNames;
}

/**
 * Count how many named children of `node` are NOT assigned to any tree-sitter
 * field, i.e. the un-fielded named children that must land in NodeData's
 * `$children` array (or be promoted into an override field).
 *
 * @remarks
 * Count INSTANCES, not distinct field keys: a multiple-valued field like
 * `except_clauses: [e1, e2]` accounts for 2 children, not 1.
 *
 * @param node - The tree-sitter parse node to inspect.
 * @returns The count of named children with no field assignment.
 */
function countUnfieldedNamedChildren(node: TSNode): number {
	let count = 0;
	for (let i = 0; i < node.childCount; i++) {
		const c = node.child(i);
		if (!c || !c.isNamed) continue;
		if (node.fieldNameForChild(i)) continue;
		count++;
	}
	return count;
}

/**
 * Extract named-slot field names from a NodeData object.
 *
 * ADR-0018 Phase 3a: readNode emits named slots as `_<name>` top-level keys
 * (de-hoisted storage). The legacy `$fields` wrapper is no longer emitted.
 * This helper reads both shapes for backward compatibility with test fixtures
 * that still use `$fields`.
 *
 * @param data - The NodeData to inspect.
 * @returns An iterable of `[fieldName, value]` pairs for all named slots.
 */
function* iterNamedSlots(data: AnyNodeData): Iterable<[string, unknown]> {
	const rec = data as unknown as Record<string, unknown>;
	// ADR-0018 Phase 3a: de-hoisted `_<name>` keys.
	for (const key of Object.keys(rec)) {
		if (key.startsWith('_')) {
			yield [key.slice(1), rec[key]];
		}
	}
	// Legacy `$fields` wrapper — tolerated for backward compatibility with old fixtures.
	const legacyFields = rec['$fields'] as Record<string, unknown> | null | undefined;
	if (legacyFields && typeof legacyFields === 'object') {
		for (const [fname, value] of Object.entries(legacyFields)) {
			yield [fname, value];
		}
	}
}

/**
 * Count how many NodeData named-slot entries represent children promoted into
 * override fields rather than arriving via tree-sitter's own field routing.
 *
 * @remarks
 * A non-array override value counts as 1 promoted child; an array value counts
 * as `array.length` promoted children. Only entries that are NOT in the live
 * tree-sitter field set AND ARE in the override field set are counted.
 *
 * @param data - The NodeData whose named slots to inspect.
 * @param liveFieldNames - Field names that tree-sitter itself assigned (excluded from counting).
 * @param overrideFields - Field names introduced by override routing (included in counting).
 * @returns The total count of children routed into override fields.
 */
function countPromotedOverrideChildren(
	data: AnyNodeData,
	liveFieldNames: Set<string>,
	overrideFields: Set<string>
): number {
	let count = 0;
	for (const [fname, value] of iterNamedSlots(data)) {
		if (liveFieldNames.has(fname)) continue; // tree-sitter field, not override
		if (!overrideFields.has(fname)) continue; // neither override nor live
		if (Array.isArray(value)) count += value.length;
		else if (value && typeof value === 'object') count += 1;
	}
	return count;
}

function checkNodeData(
	kind: string,
	node: TSNode,
	data: AnyNodeData,
	expectedFields: Set<string>,
	overrideFields: Set<string>,
	kindNameFromId?: (id: number) => string | undefined,
	kindIdFromName?: (kind: string) => number | undefined
): string | null {
	// 1. $type must match — may be numeric (TSKindId) or string (hidden kind).
	// kindNameFromId returns canonical sittir form which may have a leading
	// underscore or alias suffix (e.g. '_match_block', 'scoped_type_identifier_in_expression_position')
	// while tree-sitter's node.type reports the visible/aliased form ('block',
	// 'scoped_type_identifier'). Accept any of these forms as a match:
	//   (a) canonical form matches directly
	//   (b) canonical form with leading underscore stripped matches
	//   (c) reverse lookup: kindIdFromName(kind) == data.$type (aliased name case)
	const rawType = data.$type;
	if (typeof rawType === 'number') {
		const canonicalKind = kindNameFromId?.(rawType) ?? String(rawType);
		const canonicalVisible = canonicalKind.startsWith('_') ? canonicalKind.slice(1) : canonicalKind;
		const expectedId = kindIdFromName?.(kind);
		const idMatch = expectedId !== undefined && expectedId === rawType;
		if (canonicalKind !== kind && canonicalVisible !== kind && !idMatch) {
			return `$type mismatch: expected '${kind}', got '${canonicalKind}' (id=${rawType})`;
		}
	} else {
		if (rawType !== kind) {
			const rawVisible = String(rawType).startsWith('_') ? String(rawType).slice(1) : String(rawType);
			if (rawVisible !== kind) {
				return `$type mismatch: expected '${kind}', got '${String(rawType)}' (id=${rawType})`;
			}
		}
	}

	const liveFieldNames = collectLiveFieldNames(node);
	// ADR-0018 Phase 3a: named slots are stored as `_<name>` top-level keys.
	// iterNamedSlots handles both de-hoisted (_<name>) and legacy ($fields) shapes.
	const dataFields = new Set([...iterNamedSlots(data)].map(([fname]) => fname));

	for (const fname of liveFieldNames) {
		if (!dataFields.has(fname)) {
			return `missing field '${fname}' — tree-sitter surfaced it, readNode did not`;
		}
	}

	const dataChildrenCount = (data.$children ?? []).filter(
		(c: any) => c?.$named !== false
	).length;

	const expectedNamedUnfielded = countUnfieldedNamedChildren(node);
	const promotedChildCount = countPromotedOverrideChildren(
		data,
		liveFieldNames,
		overrideFields
	);

	if (dataChildrenCount + promotedChildCount < expectedNamedUnfielded) {
		return (
			`lost ${expectedNamedUnfielded - dataChildrenCount - promotedChildCount} named children ` +
			`(${expectedNamedUnfielded} unfielded in parse, ` +
			`${dataChildrenCount} in data.children, ` +
			`${promotedChildCount} promoted via overrides)`
		);
	}

	return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export interface ReadNodeRoundTripResult {
	grammar: string;
	total: number;
	pass: number;
	fail: number;
	skip: number;
	issues: NodeIssue[];
}

export async function validateReadNodeRoundTrip(
	grammar: string
): Promise<ReadNodeRoundTripResult> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);

	// Phase D: $type is numeric — load resolvers for kind-name comparison and handle setup.
	const kindNameFromId = await loadKindNameFromId(grammar);
	const rawKindIdFromName = await loadKindIdFromName(grammar);
	// Wrap so unknown kind names return undefined (instead of throwing).
	// The generated kindIdFromName throws on missing entries; readNode's
	// resolveKindId falls back to the string kind only when the function
	// returns undefined, not when it throws.
	const kindIdFromName = rawKindIdFromName
		? (name: string): number | undefined => {
			try { return rawKindIdFromName(name); }
			catch { return undefined; }
		}
		: rawKindIdFromName;

	const rawEntries = loadRawEntries(grammar);
	const kindFields = buildKindFieldMap(rawEntries);

	const entries = loadCorpusEntries(grammar);
	const issues: NodeIssue[] = [];
	const testedKinds = new Set<string>();
	let total = 0;
	let pass = 0;
	let skip = 0;

	for (const entry of entries) {
		const tree = parser.parse(entry.source) as TSTree;
		if (tree.rootNode.hasError) continue;

		const kinds = collectKinds(tree.rootNode);
		for (const kind of kinds) {
			if (testedKinds.has(kind)) continue;
			testedKinds.add(kind);
			total++;

			const node = findFirst(tree.rootNode, kind);
			if (!node) {
				skip++;
				continue;
			}

			const handle = buildReadHandle(grammar, tree, entry.source, undefined, kindIdFromName);
			// Native engine Rust-heap IDs differ from WASM linear-memory IDs.
			// Skip alias-target kinds the native engine emits under a different
			// rule name rather than falling back to a mismatched WASM ID.
			const nativeCoords = findNativeNodeId(handle, kind, kindNameFromId);
			if (nativeCoords === null && handle.read) {
				skip++;
				continue;
			}
			let data: AnyNodeData;
			try {
				data = readNodeAt(handle, adaptNode(node), nativeCoords);
			} catch (e) {
				issues.push({
					kind,
					instance: entry.name,
					message: `readNode threw: ${(e as Error).message.slice(0, 80)}`
				});
				continue;
			}

			const expected = kindFields.get(kind) ?? new Set();
			const error = checkNodeData(kind, node, data, expected, new Set(), kindNameFromId, kindIdFromName);
			if (error) {
				issues.push({ kind, instance: entry.name, message: error });
			} else {
				pass++;
			}
		}
	}

	emitValidatorMetrics();
	return { grammar, total, pass, fail: total - pass - skip, skip, issues };
}

export function formatReadNodeRoundTripReport(
	result: ReadNodeRoundTripResult
): string {
	const lines: string[] = [];
	const icon = result.issues.length === 0 ? 'v' : 'x';
	lines.push(
		`  ${icon} ${result.pass}/${result.total} readNode round-trip` +
			` (${result.skip} skipped, ${result.issues.length} issues)`
	);
	if (result.issues.length > 0) {
		for (const issue of result.issues.slice(0, 30)) {
			lines.push(`    x ${issue.kind} [${issue.instance}]: ${issue.message}`);
		}
		if (result.issues.length > 30) {
			lines.push(`    … and ${result.issues.length - 30} more`);
		}
	}
	return lines.join('\n');
}
