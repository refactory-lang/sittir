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

function loadGrammar(grammar: string): GrammarMap {
	const cached = grammarCache.get(grammar);
	if (cached) return cached;

	// Resolve node-types.json directly from tree-sitter-{grammar}
	const nodeTypesPath = require.resolve(
		`tree-sitter-${grammar}/src/node-types.json`,
	);
	const entries: RawNodeEntry[] = require(nodeTypesPath);

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

		const entry = grammarMap[key];

		// Skip entries that only have subtypes (no fields, no children)
		const hasFields =
			entry.fields != null && Object.keys(entry.fields).length > 0;
		const hasChildren = entry.children != null;

		return hasFields || hasChildren;
	});
}
