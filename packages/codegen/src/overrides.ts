/**
 * Overrides — supplemental field names for under-fielded grammar nodes.
 *
 * Loads `overrides.json` per grammar, validates against the grammar rule structure,
 * and merges override fields into NodeModels during the build pipeline.
 *
 * ## Naming Conventions
 *
 * Override field names must avoid collision with built-in NodeData properties:
 *   `type`, `named`, `fields`, `children`, `render`, `toEdit`, `replace`
 *
 * Naming tiers (in preference order):
 *
 * 1. **Kind-as-name** — single unique kind in the slot (auto-assigned):
 *    `visibility_modifier`, `where_clause`, `label`, `shebang`
 *
 * 2. **Hidden-rule-as-name** — _ prefix stripped (auto-assigned):
 *    `_expression` → `expression`, `_pattern` → `pattern`
 *
 * 3. **Semantic names** — hand-curated for multi-kind or same-kind-in-multiple-positions:
 *    - Binary:     `left` / `right` (bounded_type, or_pattern, union_type, intersection_type)
 *    - Positional: `start` / `end` (range_expression), `start` / `stop` / `step` (slice),
 *                  `object` / `index` (index_expression), `body` / `condition` / `alternative`
 *    - Unary ops:  `operator` (anonymous) + `operand` / `value`
 *    - Sequences:  `first` / `rest*` / `trailing` (tuple_expression)
 *    - Same-kind:  `where_clause` / `trailing_where_clause` (type_item),
 *                  `rules*` / `rule` (macro_definition)
 *
 * 4. **Pluralized multiples** — `multiple: true` fields use plural form:
 *    `statements*`, `members*`, `declarators*`, `elements*`, `attributes*`,
 *    `comparators*`, `except_clauses*`, `declarations*`
 *
 * 5. **Interleaved attributes** — `(attr* vis? element, ...)` patterns:
 *    `attributes*` / `visibility_modifier` / `declarations*` (ordered_field_declaration_list)
 *    These are the hardest cases — SEQ of different kinds inside a comma list.
 *
 * ## Reserved Names
 *
 * The following names collide with NodeData properties and must NOT be used:
 *   `type`, `named`, `fields`, `children`, `render`, `toEdit`, `replace`
 *
 * JS reserved words (`default`, `class`, `new`, etc.) are also problematic as
 * they cannot be used as method names in object literals. Use suffixed variants:
 *   `default` → `default_import`, `class` → `class_body`, etc.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OverrideTypeRef {
	type: string;
	named: boolean;
}

export interface OverrideFieldDef {
	/** The node types this field accepts (same shape as node-types.json). */
	types: OverrideTypeRef[];
	/** Whether this field is a list (multiple children). */
	multiple: boolean;
	/** Whether this field is required. */
	required: boolean;
	/** Positional index in the original children tuple. */
	position: number;
}

export interface OverrideEntry {
	fields: Record<string, OverrideFieldDef>;
}

/** External token role — maps grammar SYMBOLs to structural whitespace roles. */
export interface ExternalRole {
	role: 'indent' | 'dedent' | 'newline';
}

export type OverridesConfig = Record<string, OverrideEntry>;

/** Parsed overrides + external roles. */
export interface OverridesWithExternals {
	config: OverridesConfig;
	externals: Record<string, ExternalRole>;
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

/**
 * Load overrides with external role config. Returns both the per-node overrides
 * and any external token role definitions (e.g. _indent → indent for Python).
 */
export function loadOverridesWithExternals(grammarName: string): OverridesWithExternals {
	const codegenDir = dirname(dirname(new URL(import.meta.url).pathname));
	const packagesDir = dirname(codegenDir);
	const filePath = join(packagesDir, grammarName, 'overrides.json');

	if (!existsSync(filePath)) return { config: {}, externals: {} };

	// Parse failures propagate — a malformed overrides.json is a real
	// error (e.g. stray comma) that the user needs to see, not silently
	// absorb into "no externals, no overrides" which manifests downstream
	// as wrong rendered output.
	const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as Record<string, unknown>;
	const rawExternals = raw['externals'];
	if (rawExternals !== undefined
		&& (typeof rawExternals !== 'object' || rawExternals === null || Array.isArray(rawExternals))) {
		throw new Error(
			`[overrides] ${filePath}: 'externals' must be an object (got ${Array.isArray(rawExternals) ? 'array' : typeof rawExternals})`,
		);
	}
	const externals = (rawExternals ?? {}) as Record<string, ExternalRole>;
	const config = loadOverrides(grammarName);
	return { config, externals };
}

/**
 * Load overrides.json for a grammar. Returns empty config if file doesn't exist.
 * Looks in `packages/{grammar}/overrides.json` relative to the monorepo root.
 */
export function loadOverrides(grammarName: string): OverridesConfig {
	// Resolve relative to this package's location in the monorepo
	// packages/codegen/src/overrides.ts → packages/codegen/ → packages/ → packages/{grammar}/
	const codegenDir = dirname(dirname(new URL(import.meta.url).pathname));
	const packagesDir = dirname(codegenDir);
	const overridesPath = join(packagesDir, grammarName, 'overrides.json');

	if (!existsSync(overridesPath)) return {};
	return parseOverridesFile(overridesPath);
}

/** Names that collide with built-in NodeData properties or object literal methods. */
export const RESERVED_FIELD_NAMES = new Set([
	'type', 'named', 'fields', 'children',
	'render', 'toEdit', 'replace',
]);

function parseOverridesFile(path: string): OverridesConfig {
	let raw: string;
	try {
		raw = readFileSync(path, 'utf-8');
	} catch (e) {
		// Only ENOENT / read errors fall back to "no overrides". A
		// JSON parse failure below is a real bug and should surface.
		throw new Error(`[overrides] Could not read ${path}: ${e instanceof Error ? e.message : e}`);
	}
	let config: OverridesConfig;
	try {
		config = JSON.parse(raw) as OverridesConfig;
	} catch (e) {
		throw new Error(`[overrides] Failed to parse ${path}: ${e instanceof Error ? e.message : e}`);
	}
	// Remove externals key (handled separately by loadOverridesWithExternals)
	delete (config as Record<string, unknown>)['externals'];
	// Reserved-name fields shadow built-in NodeData properties (type,
	// named, fields, children, render, toEdit, replace) — silently
	// dropping them yields factories missing user-visible fields with
	// no signal. Throw with path + kind so the author can rename.
	for (const [kind, entry] of Object.entries(config)) {
		const oe = entry as OverrideEntry | undefined;
		if (!oe?.fields) continue;
		for (const fieldName of Object.keys(oe.fields)) {
			if (RESERVED_FIELD_NAMES.has(fieldName)) {
				throw new Error(
					`[overrides] ${path}: ${kind}.${fieldName} — '${fieldName}' is a reserved NodeData field name`,
				);
			}
		}
	}
	return config;
}
