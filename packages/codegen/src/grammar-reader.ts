import { createRequire } from 'node:module';

// --- Public types ---

export interface FieldMeta {
	name: string;
	required: boolean;
	multiple: boolean;
	types: string[];
}

export interface ChildrenMeta {
	required: boolean;
	multiple: boolean;
	types: string[];
}

export interface NodeMeta {
	kind: string;
	fields: FieldMeta[];
	hasChildren: boolean;
	children?: ChildrenMeta;
}

// --- Raw node-types.json shape (from tree-sitter grammars) ---

interface RawFieldEntry {
	required: boolean;
	multiple: boolean;
	types: Array<{ type: string; named: boolean }>;
}

interface RawNodeEntry {
	type: string;
	named: boolean;
	fields?: Record<string, RawFieldEntry>;
	children?: RawFieldEntry;
	subtypes?: Array<{ type: string; named: boolean }>;
}

type GrammarMap = Record<string, RawNodeEntry>;

// --- Cache ---

const require = createRequire(import.meta.url);
const grammarCache = new Map<string, GrammarMap>();

/**
 * Well-known node-types.json paths for grammars with non-standard layouts.
 * Most grammars use `tree-sitter-{grammar}/src/node-types.json`.
 */
const GRAMMAR_PATHS: Record<string, string> = {
	typescript: `tree-sitter-typescript/typescript/src/node-types.json`,
	tsx: `tree-sitter-typescript/tsx/src/node-types.json`,
};

/** Registry of explicit node-types.json paths (set via registerGrammarPath). */
const explicitPaths = new Map<string, string>();

/** Register an explicit file path for a grammar's node-types.json. */
export function registerGrammarPath(grammar: string, nodeTypesPath: string): void {
	explicitPaths.set(grammar, nodeTypesPath);
	grammarCache.delete(grammar); // invalidate cache
}

/** Load raw node-types.json entries for the grammar emitter. */
export function loadRawEntries(grammar: string): RawNodeEntry[] {
	const explicitPath = explicitPaths.get(grammar);
	if (explicitPath) {
		return require(explicitPath);
	}
	const modulePath = GRAMMAR_PATHS[grammar] ?? `tree-sitter-${grammar}/src/node-types.json`;
	const nodeTypesPath = require.resolve(modulePath);
	return require(nodeTypesPath);
}

function loadGrammar(grammar: string): GrammarMap {
	const cached = grammarCache.get(grammar);
	if (cached) return cached;

	let entries: RawNodeEntry[];

	const explicitPath = explicitPaths.get(grammar);
	if (explicitPath) {
		entries = require(explicitPath);
	} else {
		const modulePath = GRAMMAR_PATHS[grammar] ?? `tree-sitter-${grammar}/src/node-types.json`;
		const nodeTypesPath = require.resolve(modulePath);
		entries = require(nodeTypesPath);
	}

	// Convert array to map keyed by type name
	const parsed: GrammarMap = {};
	for (const entry of entries) {
		parsed[entry.type] = entry;
	}

	grammarCache.set(grammar, parsed);
	return parsed;
}

// --- Public API ---

/**
 * Read metadata for a single node kind from a grammar .d.ts file.
 */
export function readGrammarNode(grammar: string, nodeKind: string): NodeMeta {
	const grammarMap = loadGrammar(grammar);
	const entry = grammarMap[nodeKind];

	if (!entry) {
		throw new Error(
			`Node kind "${nodeKind}" not found in ${grammar} grammar`,
		);
	}

	const fields: FieldMeta[] = [];
	if (entry.fields) {
		for (const [name, raw] of Object.entries(entry.fields)) {
			fields.push({
				name,
				required: raw.required,
				multiple: raw.multiple,
				types: raw.types.map((t) => t.type),
			});
		}
	}

	const hasChildren = entry.children != null;

	const result: NodeMeta = { kind: nodeKind, fields, hasChildren };

	if (entry.children) {
		result.children = {
			required: entry.children.required,
			multiple: entry.children.multiple,
			types: entry.children.types.map((t) => t.type),
		};
	}

	return result;
}

/**
 * List all named node kinds that have fields or children.
 * Filters out `_` prefixed abstract types and subtypes-only entries.
 */
export function listNodeKinds(grammar: string): string[] {
	const grammarMap = loadGrammar(grammar);

	return Object.keys(grammarMap).filter((key) => {
		// Skip abstract types prefixed with _
		if (key.startsWith('_')) return false;

		const entry = grammarMap[key]!;

		// Skip entries that only have subtypes (no fields, no children)
		const hasFields =
			entry.fields != null && Object.keys(entry.fields).length > 0;
		const hasChildren = entry.children != null;

		return hasFields || hasChildren;
	});
}

/**
 * List all named leaf node kinds — no fields, no children, not abstract.
 * These become LeafBuilder entries in the ir namespace.
 */
export function listLeafKinds(grammar: string): string[] {
	const grammarMap = loadGrammar(grammar);

	return Object.keys(grammarMap).filter((key) => {
		if (key.startsWith('_')) return false;

		const entry = grammarMap[key]!;
		if (!entry.named) return false;
		if (entry.subtypes) return false;

		const hasFields =
			entry.fields != null && Object.keys(entry.fields).length > 0;
		const hasChildren = entry.children != null;

		return !hasFields && !hasChildren;
	});
}

export interface OperatorContext {
	parentKind: string;
	field: string;
	tokens: string[];
}

/**
 * Discover anonymous tokens that appear as field values in named nodes.
 * Returns per-(parentKind, field) groupings of operator tokens.
 */
export function listOperatorContexts(grammar: string): OperatorContext[] {
	const grammarMap = loadGrammar(grammar);
	const results: OperatorContext[] = [];

	for (const [kind, entry] of Object.entries(grammarMap)) {
		if (!entry.named || kind.startsWith('_')) continue;
		if (!entry.fields) continue;

		for (const [fieldName, fieldInfo] of Object.entries(entry.fields)) {
			const anonTokens = fieldInfo.types
				.filter((t) => !t.named)
				.map((t) => t.type);

			if (anonTokens.length > 0) {
				results.push({ parentKind: kind, field: fieldName, tokens: anonTokens });
			}
		}
	}

	return results;
}

/**
 * List all keywords (anonymous tokens that are alphabetic) from the grammar.
 */
export function listKeywords(grammar: string): string[] {
	const grammarMap = loadGrammar(grammar);
	const keywords = new Set<string>();

	for (const entry of Object.values(grammarMap)) {
		if (!entry.named) {
			if (/^[a-z_]+$/i.test(entry.type)) {
				keywords.add(entry.type);
			}
		}
	}

	return [...keywords].sort();
}

/**
 * List all operator tokens (non-alphabetic anonymous tokens) from the grammar.
 */
export function listOperatorTokens(grammar: string): string[] {
	const grammarMap = loadGrammar(grammar);
	const ops = new Set<string>();

	for (const entry of Object.values(grammarMap)) {
		if (!entry.named) {
			if (!/^[a-z_]+$/i.test(entry.type) && entry.type !== '"' && entry.type !== "'") {
				ops.add(entry.type);
			}
		}
	}

	return [...ops].sort();
}
