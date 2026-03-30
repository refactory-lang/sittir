/**
 * Layer 3: NodeTypes — faithful representation of node-types.json
 *
 * No heuristics. No cross-referencing. Just structured access.
 */

import { createRequire } from 'node:module';

// ---------------------------------------------------------------------------
// NodeTypes — parsed node-types.json
// ---------------------------------------------------------------------------

export interface NodeTypeField {
	multiple: boolean;
	required: boolean;
	types: Array<{ type: string; named: boolean }>;
}

export interface NodeTypeEntry {
	type: string;
	named: boolean;
	fields?: Record<string, NodeTypeField>;
	children?: NodeTypeField;
	subtypes?: Array<{ type: string; named: boolean }>;
}

export interface NodeTypes {
	entries: Map<string, NodeTypeEntry>;
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

const require = createRequire(import.meta.url);
const nodeTypesCache = new Map<string, NodeTypes>();

/**
 * Well-known node-types.json paths for grammars with non-standard layouts.
 */
const GRAMMAR_PATHS: Record<string, string> = {
	typescript: 'tree-sitter-typescript/typescript/src/node-types.json',
	tsx: 'tree-sitter-typescript/tsx/src/node-types.json',
};

/** Registry of explicit paths (set via registerGrammarPath in grammar.ts). */
const explicitNodeTypePaths = new Map<string, string>();

/** Register an explicit file path for a grammar's node-types.json (for testing). */
export function registerNodeTypesPath(grammar: string, nodeTypesPath: string): void {
	explicitNodeTypePaths.set(grammar, nodeTypesPath);
	nodeTypesCache.delete(grammar);
}

/**
 * Load and parse node-types.json for the given grammar.
 * Converts the raw array to a Map keyed by type name.
 * Prefers named entries over unnamed when both exist.
 */
export function loadNodeTypes(grammarName: string): NodeTypes {
	const cached = nodeTypesCache.get(grammarName);
	if (cached) return cached;

	let rawEntries: NodeTypeEntry[];

	const explicitPath = explicitNodeTypePaths.get(grammarName);
	if (explicitPath) {
		rawEntries = require(explicitPath);
	} else {
		const modulePath = GRAMMAR_PATHS[grammarName] ?? `tree-sitter-${grammarName}/src/node-types.json`;
		const nodeTypesPath = require.resolve(modulePath);
		rawEntries = require(nodeTypesPath);
	}

	const entries = new Map<string, NodeTypeEntry>();
	for (const entry of rawEntries) {
		const existing = entries.get(entry.type);
		if (!existing || (entry.named && !existing.named)) {
			entries.set(entry.type, entry);
		}
	}

	const result: NodeTypes = { entries };
	nodeTypesCache.set(grammarName, result);
	return result;
}

/**
 * Load the raw node-types.json entries as an array.
 * Used by the grammar emitter which needs the raw format.
 */
export function loadRawNodeTypeEntries(grammarName: string): NodeTypeEntry[] {
	const explicitPath = explicitNodeTypePaths.get(grammarName);
	if (explicitPath) {
		return require(explicitPath);
	}
	const modulePath = GRAMMAR_PATHS[grammarName] ?? `tree-sitter-${grammarName}/src/node-types.json`;
	const nodeTypesPath = require.resolve(modulePath);
	return require(nodeTypesPath);
}
