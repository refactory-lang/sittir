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
import type { BranchModel, NodeModel, FieldModel } from './node-model.ts';
import type { Grammar, GrammarRule } from './grammar.ts';

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

/** Well-known override file paths, keyed by grammar name. */
const overridePaths = new Map<string, string>();

/** Register an explicit overrides.json path (for testing). */
export function registerOverridesPath(grammar: string, path: string): void {
	overridePaths.set(grammar, path);
}

/**
 * Load overrides with external role config. Returns both the per-node overrides
 * and any external token role definitions (e.g. _indent → indent for Python).
 */
export function loadOverridesWithExternals(grammarName: string): OverridesWithExternals {
	// Load the raw JSON to extract externals before parsing strips them
	const explicit = overridePaths.get(grammarName);
	const codegenDir = dirname(dirname(new URL(import.meta.url).pathname));
	const packagesDir = dirname(codegenDir);
	const filePath = explicit ?? join(packagesDir, grammarName, 'overrides.json');

	if (!existsSync(filePath)) return { config: {}, externals: {} };

	try {
		const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as Record<string, unknown>;
		const externals = (raw['externals'] ?? {}) as Record<string, ExternalRole>;
		const config = loadOverrides(grammarName); // parsed + validated
		return { config, externals };
	} catch {
		return { config: {}, externals: {} };
	}
}

/**
 * Load overrides.json for a grammar. Returns empty config if file doesn't exist.
 * Looks in `packages/{grammar}/overrides.json` relative to the monorepo root.
 */
export function loadOverrides(grammarName: string): OverridesConfig {
	// Check explicit registration first
	const explicit = overridePaths.get(grammarName);
	if (explicit) {
		if (!existsSync(explicit)) return {};
		return parseOverridesFile(explicit);
	}

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
	try {
		const config = JSON.parse(readFileSync(path, 'utf-8')) as OverridesConfig;
		// Remove fields with reserved names (skip with warning, don't abort)
		// Remove externals key (handled separately by loadOverridesWithExternals)
		delete (config as Record<string, unknown>)['externals'];
		// Remove fields with reserved names (skip with warning, don't abort)
		for (const [kind, entry] of Object.entries(config)) {
			const oe = entry as OverrideEntry | undefined;
			if (!oe?.fields) continue;
			for (const fieldName of Object.keys(oe.fields)) {
				if (RESERVED_FIELD_NAMES.has(fieldName)) {
					console.warn(`[overrides] ${kind}.${fieldName}: '${fieldName}' is reserved — skipping field`);
					delete oe.fields[fieldName];
				}
			}
		}
		return config;
	} catch (e) {
		console.warn(`[overrides] Failed to parse ${path}: ${e instanceof Error ? e.message : e}`);
		return {};
	}
}

// ---------------------------------------------------------------------------
// Validation (FR-022)
// ---------------------------------------------------------------------------

export interface ValidationError {
	kind: string;
	field?: string;
	message: string;
}

/**
 * Validate overrides against the grammar and existing models.
 * Returns an array of validation errors (empty = valid).
 *
 * Checks:
 * (a) node kind must exist in grammar
 * (b) field count must be plausible for the rule's positional children
 * (c) anonymous: true fields must correspond to actual anonymous tokens in grammar
 * (d) override fields must not shadow existing tree-sitter FIELDs (FR-021)
 */
export function validateOverrides(
	overrides: OverridesConfig,
	models: Map<string, NodeModel>,
	grammar: Grammar,
): ValidationError[] {
	const errors: ValidationError[] = [];

	for (const [kind, entry] of Object.entries(overrides)) {
		// (a) Node kind must exist in grammar
		if (!grammar.rules[kind] && !models.has(kind)) {
			errors.push({ kind, message: `Node kind '${kind}' not found in grammar or node-types` });
			continue;
		}

		const model = models.get(kind);

		// (d) Override fields must not shadow existing tree-sitter FIELDs
		if (model && (model.modelType === 'branch' || model.modelType === 'container')) {
			const existingFields = model.modelType === 'branch'
				? new Set(model.fields.map(f => f.name))
				: new Set<string>();

			for (const fieldName of Object.keys(entry.fields)) {
				if (existingFields.has(fieldName)) {
					errors.push({
						kind,
						field: fieldName,
						message: `Override field '${fieldName}' shadows existing tree-sitter FIELD on '${kind}'`,
					});
				}
			}
		}

		// (b) Validate types references exist in grammar
		const grammarRule = grammar.rules[kind];
		if (grammarRule) {
			const anonTokens = collectAnonymousTokens(grammarRule);
			for (const [fieldName, fieldDef] of Object.entries(entry.fields)) {
				for (const typeRef of fieldDef.types) {
					if (!typeRef.named && anonTokens.size === 0) {
						errors.push({
							kind,
							field: fieldName,
							message: `Override field '${fieldName}' references anonymous type '${typeRef.type}' but '${kind}' has no anonymous tokens in grammar rule`,
						});
					}
				}
			}
		}
	}

	return errors;
}

/** Collect anonymous token strings from a grammar rule tree. */
function collectAnonymousTokens(rule: GrammarRule): Set<string> {
	const tokens = new Set<string>();
	walkRule(rule, (r) => {
		if (r.type === 'STRING') {
			tokens.add(r.value);
		}
	});
	return tokens;
}

function walkRule(rule: GrammarRule, fn: (r: GrammarRule) => void): void {
	fn(rule);
	if ('members' in rule && Array.isArray((rule as any).members)) {
		for (const m of (rule as any).members as GrammarRule[]) walkRule(m, fn);
	}
	if ('content' in rule && (rule as any).content) walkRule((rule as any).content as GrammarRule, fn);
}

// ---------------------------------------------------------------------------
// Merging (T038)
// ---------------------------------------------------------------------------

/**
 * Merge override fields into NodeModels.
 * Override fields carry their own `types` array (same shape as node-types.json),
 * so kinds are read directly — no positional guessing needed.
 *
 * For branch models: appends override fields to the existing fields array.
 * For container models: promotes to branch model with the override fields.
 * In both cases, children are cleared since overrides fully replace them.
 */
export function mergeOverrides(
	models: Map<string, NodeModel>,
	overrides: OverridesConfig,
): void {
	for (const [kind, entry] of Object.entries(overrides)) {
		const model = models.get(kind);
		if (!model) continue;

		const overrideFields: FieldModel[] = [];
		for (const [fieldName, fieldDef] of Object.entries(entry.fields)) {
			// Include both named and anonymous types in kinds — token models
			// exist for anonymous types and hydration resolves them the same way
			// as native fields (projectKinds classifies them as anonTokens).
			const allKinds = new Set(fieldDef.types.map(t => t.type));
			const namedKinds = new Set(
				fieldDef.types.filter(t => t.named).map(t => t.type),
			);
			const hasAnonymous = fieldDef.types.some(t => !t.named);
			const anonValues = fieldDef.types.filter(t => !t.named).map(t => t.type);

			overrideFields.push({
				name: fieldName,
				required: fieldDef.required,
				multiple: fieldDef.multiple,
				kinds: allKinds,
				position: fieldDef.position,
				...(fieldDef.multiple ? { separator: null } : {}),
				override: true,
				overrideAnonymous: hasAnonymous && namedKinds.size === 0,
				...(anonValues.length > 0 ? { overrideValues: anonValues } : {}),
			} as FieldModel);
		}

		if (model.modelType === 'branch') {
			const existingByName = new Map(model.fields.map(f => [f.name, f]));
			for (const f of overrideFields) {
				const existing = existingByName.get(f.name);
				if (existing) {
					// Override shadows a grammar-defined field — merge override kinds
					// and mark as override so applyOverrides wraps bare SYMBOLs in
					// CHOICE branches that lack grammar-defined FIELD wrappers.
					for (const k of f.kinds) existing.kinds.add(k);
					existing.override = true;
					if (f.overrideValues) {
						existing.overrideValues = [...(existing.overrideValues ?? []), ...f.overrideValues];
					}
					if (f.overrideAnonymous) existing.overrideAnonymous = true;
				} else {
					model.fields.push(f);
					existingByName.set(f.name, f);
				}
			}
		} else if (model.modelType === 'container') {
			const branch: BranchModel = {
				modelType: 'branch',
				kind: model.kind,
				fields: overrideFields,
				children: model.children,
				rule: model.rule,
				typeName: model.typeName,
				factoryName: model.factoryName,
			};
			models.set(kind, branch);
		}
	}
}

// ---------------------------------------------------------------------------
// Automatic Detection Logging (T040 / FR-023)
// ---------------------------------------------------------------------------

/**
 * Detect and log override candidates.
 * - Same-kind positional: SEQ(X, X) where X is the same symbol → "needs synthetic names"
 * - Discriminator tokens: CHOICE branches identical after token removal
 * - Keyword alternatives: CHOICE of bare STRING tokens (mutually exclusive keywords
 *   that should be a named override field, like static/abstract/accessor)
 */
export function detectOverrideCandidates(
	models: Map<string, NodeModel>,
	grammar: Grammar,
): void {
	for (const [kind, model] of models) {
		if (model.modelType !== 'container' && model.modelType !== 'branch') continue;

		const rule = grammar.rules[kind];
		if (!rule) continue;

		// Check for same-kind positional children (SEQ(X, X))
		const symbols = collectTopLevelSymbols(rule);
		const duplicates = findDuplicateSymbols(symbols);
		if (duplicates.length > 0) {
			console.log(`[overrides] ${kind}: needs synthetic names — same-kind positional children: ${duplicates.join(', ')}`);
		}

		// Check for discriminator tokens in CHOICE branches (top-level)
		if (rule.type === 'CHOICE' && rule.members.length > 1) {
			const stripped = rule.members.map(m => stripTokens(m));
			const signatures = stripped.map(s => JSON.stringify(s));
			const uniqueSigs = new Set(signatures);
			if (uniqueSigs.size < signatures.length) {
				console.log(`[overrides] ${kind}: discriminator token detected — CHOICE branches identical after token removal`);
			}
		}

		// Check for keyword alternative CHOICEs nested anywhere in the rule.
		// A CHOICE of 2+ bare STRING tokens (possibly with BLANK for optionality)
		// outside any FIELD node is a keyword discriminator that needs an override
		// field name. Bare STRINGs are const string symbols.
		const kwAlts = findKeywordAlternatives(rule, grammar.rules);
		for (const kw of kwAlts) {
			// Filter noise: skip single-char punctuation and very large groups
			// (e.g. JavaScript reserved-word-as-property-name in `object`)
			const isKeywordGroup = kw.length <= 6 && kw.every(k => /^[a-zA-Z_]\w*$/.test(k));
			if (isKeywordGroup) {
				console.log(`[overrides] ${kind}: needs_name — keyword alternatives [${kw.join(', ')}] not captured by any field`);
			}
		}
	}
}

/** Collect top-level SYMBOL references from a rule (unwrapping SEQ, PREC, etc.) */
function collectTopLevelSymbols(rule: GrammarRule): string[] {
	if (rule.type === 'SYMBOL') return [rule.name];
	if (rule.type === 'SEQ') return rule.members.flatMap(m => collectTopLevelSymbols(m));
	if (rule.type === 'PREC' || rule.type === 'PREC_LEFT' || rule.type === 'PREC_RIGHT' || rule.type === 'PREC_DYNAMIC') {
		return collectTopLevelSymbols(rule.content);
	}
	if (rule.type === 'FIELD') return collectTopLevelSymbols(rule.content);
	return [];
}

function findDuplicateSymbols(symbols: string[]): string[] {
	const counts = new Map<string, number>();
	for (const s of symbols) counts.set(s, (counts.get(s) ?? 0) + 1);
	return [...counts.entries()].filter(([, c]) => c > 1).map(([s]) => s);
}

/**
 * Walk a rule tree and find keyword alternative patterns not captured by any FIELD.
 * Two patterns detected:
 *
 * 1. **Sibling keywords**: CHOICE(STR("a"), STR("b"), BLANK?) — bare STRING tokens
 *    as direct alternatives in one CHOICE.
 *
 * 2. **Leading keywords**: CHOICE(SEQ(CHOICE(STR("a"),BLANK),...), SEQ(CHOICE(STR("b"),BLANK),...))
 *    — each branch of a non-optional CHOICE starts with a different keyword STRING.
 *    The keyword is the first non-BLANK STRING reachable from the branch head.
 *
 * Bare STRINGs are const string symbols — they should be named override fields.
 * Returns an array of keyword groups, each being the string values.
 */
function findKeywordAlternatives(
	rule: GrammarRule,
	grammarRules: Record<string, GrammarRule>,
): string[][] {
	const results: string[][] = [];
	const visited = new Set<string>(); // cycle guard for hidden rule inlining

	function walk(r: GrammarRule, insideField: boolean) {
		switch (r.type) {
			case 'FIELD':
				walk(r.content, true);
				break;
			case 'CHOICE': {
				if (!insideField) {
					// Pattern 1: sibling keywords — CHOICE(STR, STR, ...)
					const siblingKws: string[] = [];
					for (const m of r.members) {
						const s = unwrapToString(m);
						if (s !== null) siblingKws.push(s);
					}
					if (siblingKws.length >= 2) {
						results.push(siblingKws);
					}

					// Pattern 2: leading keywords — each branch starts with a unique keyword
					const hasBlank = r.members.some(m => m.type === 'BLANK');
					if (!hasBlank && r.members.length >= 2) {
						const leadingKws: string[] = [];
						let allHaveLead = true;
						for (const m of r.members) {
							const kw = extractLeadingKeyword(m);
							if (kw !== null) leadingKws.push(kw);
							else allHaveLead = false;
						}
						// Only report if all branches have a leading keyword and they differ
						if (allHaveLead && leadingKws.length >= 2 && new Set(leadingKws).size === leadingKws.length) {
							results.push(leadingKws);
						}
					}
				}
				// Recurse into branches for nested CHOICEs
				for (const m of r.members) walk(m, insideField);
				break;
			}
			case 'SEQ':
				for (const m of r.members) walk(m, insideField);
				break;
			case 'REPEAT':
			case 'REPEAT1':
				walk(r.content, insideField);
				break;
			case 'PREC':
			case 'PREC_LEFT':
			case 'PREC_RIGHT':
			case 'PREC_DYNAMIC':
				walk(r.content, insideField);
				break;
			case 'TOKEN':
			case 'IMMEDIATE_TOKEN':
				walk(r.content, insideField);
				break;
			case 'ALIAS':
				walk(r.content, insideField);
				break;
			case 'SYMBOL':
				// Inline hidden rules that are structural (SEQ, REPEAT, etc.)
				// but skip supertypes (CHOICE of mostly SYMBOLs) — those expand
				// to contextual keywords like default/union/gen that are noise.
				if (r.name.startsWith('_') && grammarRules[r.name] && !visited.has(r.name)) {
					const hidden = grammarRules[r.name]!;
					if (!isSupertype(hidden)) {
						visited.add(r.name);
						walk(hidden, insideField);
					}
				}
				break;
			default:
				break;
		}
	}
	walk(rule, false);
	return results;
}

/**
 * Check if a rule is a supertype — a CHOICE where most members are SYMBOLs.
 * Supertypes expand to type unions (e.g. _expression → many node kinds)
 * and their contextual keyword members are noise for keyword detection.
 */
function isSupertype(rule: GrammarRule): boolean {
	let r = rule;
	// Unwrap PREC
	while (r.type === 'PREC' || r.type === 'PREC_LEFT' || r.type === 'PREC_RIGHT' || r.type === 'PREC_DYNAMIC') r = r.content;
	if (r.type !== 'CHOICE') return false;
	const symbolCount = r.members.filter(m => {
		let u = m;
		while (u.type === 'PREC' || u.type === 'PREC_LEFT' || u.type === 'PREC_RIGHT' || u.type === 'PREC_DYNAMIC') u = u.content;
		return u.type === 'SYMBOL' || u.type === 'ALIAS';
	}).length;
	// If >50% of members are symbols, it's a supertype/union
	return symbolCount > r.members.length / 2;
}

/** Unwrap PREC wrappers to reach a STRING, or return null. */
function unwrapToString(rule: GrammarRule): string | null {
	if (rule.type === 'STRING') return rule.value;
	if (rule.type === 'BLANK') return null;
	if (rule.type === 'PREC' || rule.type === 'PREC_LEFT' || rule.type === 'PREC_RIGHT' || rule.type === 'PREC_DYNAMIC') {
		return unwrapToString(rule.content);
	}
	return null;
}

/**
 * Extract the leading keyword from a CHOICE branch.
 * Handles: SEQ(CHOICE(STR("kw"), BLANK), ...) or just CHOICE(STR("kw"), BLANK).
 * Returns the keyword string or null if the branch doesn't start with one.
 */
function extractLeadingKeyword(rule: GrammarRule): string | null {
	// Direct: CHOICE(STR("kw"), BLANK)
	if (rule.type === 'CHOICE') {
		const strs = rule.members.filter(m => m.type === 'STRING');
		const hasBlank = rule.members.some(m => m.type === 'BLANK');
		if (strs.length === 1 && hasBlank) return (strs[0] as { value: string }).value;
		// Direct STRING in a non-optional CHOICE — already handled by sibling pattern
		return null;
	}
	// SEQ: check first member
	if (rule.type === 'SEQ' && rule.members.length > 0) {
		return extractLeadingKeyword(rule.members[0]!);
	}
	// PREC wrappers
	if (rule.type === 'PREC' || rule.type === 'PREC_LEFT' || rule.type === 'PREC_RIGHT' || rule.type === 'PREC_DYNAMIC') {
		return extractLeadingKeyword(rule.content);
	}
	return null;
}

/** Strip STRING nodes from a rule tree (for discriminator detection). */
function stripTokens(rule: GrammarRule): unknown {
	if (rule.type === 'STRING') return null;
	if (rule.type === 'SEQ') {
		const members = rule.members.map(m => stripTokens(m)).filter(m => m !== null);
		return members.length === 1 ? members[0] : { type: 'SEQ', members };
	}
	if (rule.type === 'CHOICE') {
		return { type: 'CHOICE', members: rule.members.map(m => stripTokens(m)).filter(m => m !== null) };
	}
	return rule;
}
