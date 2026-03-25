import { createRequire } from 'node:module';

// --- Public types ---

export interface FieldMeta {
	name: string;
	required: boolean;
	multiple: boolean;
	types: string[];
	/** Named types only (excludes anonymous tokens). Maps to builder/type names. */
	namedTypes: string[];
}

export interface ChildrenMeta {
	required: boolean;
	multiple: boolean;
	types: string[];
	/** Named types only (excludes anonymous tokens). */
	namedTypes: string[];
}

export interface KindMeta {
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

// --- grammar.json rule types ---

export type GrammarRule =
	| { type: 'SEQ'; members: GrammarRule[] }
	| { type: 'CHOICE'; members: GrammarRule[] }
	| { type: 'STRING'; value: string }
	| { type: 'FIELD'; name: string; content: GrammarRule }
	| { type: 'SYMBOL'; name: string }
	| { type: 'BLANK' }
	| { type: 'REPEAT'; content: GrammarRule }
	| { type: 'REPEAT1'; content: GrammarRule }
	| { type: 'PREC'; value: number; content: GrammarRule }
	| { type: 'PREC_LEFT'; value: number; content: GrammarRule }
	| { type: 'PREC_RIGHT'; value: number; content: GrammarRule }
	| { type: 'ALIAS'; content: GrammarRule; named: boolean; value: string }
	| { type: 'TOKEN'; content: GrammarRule }
	| { type: 'IMMEDIATE_TOKEN'; content: GrammarRule }
	| { type: 'PATTERN'; value: string };

interface GrammarJson {
	name: string;
	rules: Record<string, GrammarRule>;
}

// --- Cache ---

const require = createRequire(import.meta.url);
const grammarCache = new Map<string, GrammarMap>();
const grammarJsonCache = new Map<string, GrammarJson>();

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

/** Resolve the src/ directory for a grammar. */
function resolveGrammarSrcDir(grammar: string): string {
	const explicitPath = explicitPaths.get(grammar);
	if (explicitPath) {
		const { dirname } = require('node:path') as typeof import('node:path');
		return dirname(explicitPath);
	}
	const modulePath = GRAMMAR_PATHS[grammar] ?? `tree-sitter-${grammar}/src/node-types.json`;
	const nodeTypesPath = require.resolve(modulePath);
	const { dirname } = require('node:path') as typeof import('node:path');
	return dirname(nodeTypesPath);
}

/** Load the compiled grammar.json for rule-driven rendering. */
function loadGrammarJson(grammar: string): GrammarJson {
	const cached = grammarJsonCache.get(grammar);
	if (cached) return cached;

	const { join } = require('node:path') as typeof import('node:path');
	const srcDir = resolveGrammarSrcDir(grammar);
	const grammarJson: GrammarJson = require(join(srcDir, 'grammar.json'));

	grammarJsonCache.set(grammar, grammarJson);
	return grammarJson;
}

/**
 * Read the grammar.json rule for a specific node kind.
 * Returns null if the kind has no rule (rare — e.g., implicit nodes).
 */
export function readGrammarRule(grammar: string, nodeKind: string): GrammarRule | null {
	const gj = loadGrammarJson(grammar);
	return gj.rules[nodeKind] ?? null;
}

/**
 * Extract the set of valid string values for an enum-like leaf kind.
 * Handles two patterns:
 *   1. Direct CHOICE rule (e.g., TypeScript's `predefined_type` → `any | number | boolean | ...`)
 *   2. ALIAS rule (e.g., Rust's `primitive_type` is defined via ALIAS in other rules)
 * Returns an empty array if the kind isn't an enum-like node.
 */
export function listLeafValues(grammar: string, nodeKind: string): string[] {
	// Try direct rule first — only use if it's a pure CHOICE of STRINGs
	const rule = readGrammarRule(grammar, nodeKind);
	if (rule) {
		const values = extractChoiceStrings(rule);
		if (values.length > 0) return values.sort();
		// Has a rule but it's not a pure enum — don't fall through to ALIAS search
		return [];
	}

	// No direct rule — search all rules for ALIAS nodes producing this kind.
	// This handles cases like Rust's `primitive_type` which is only defined via ALIAS.
	const gj = loadGrammarJson(grammar);
	for (const ruleName of Object.keys(gj.rules)) {
		const aliasContent = findAliasContent(gj.rules[ruleName]!, nodeKind);
		if (aliasContent) {
			const values = extractChoiceStrings(aliasContent);
			if (values.length > 0) return values.sort();
		}
	}

	return [];
}

/** Extract STRING values from a CHOICE rule, unwrapping precedence wrappers. */
function extractChoiceStrings(rule: GrammarRule): string[] {
	// Unwrap precedence/token wrappers
	if (rule.type === 'PREC' || rule.type === 'PREC_LEFT' || rule.type === 'PREC_RIGHT'
		|| rule.type === 'TOKEN' || rule.type === 'IMMEDIATE_TOKEN') {
		return extractChoiceStrings(rule.content);
	}
	if (rule.type !== 'CHOICE') return [];

	const values: string[] = [];
	for (const member of rule.members) {
		if (member.type === 'STRING') {
			values.push(member.value);
		} else if (member.type === 'ALIAS' && member.content.type === 'STRING') {
			// ALIAS wrapping a STRING (e.g., TypeScript's `unique symbol`)
			values.push(member.value);
		} else if (member.type === 'CHOICE') {
			// Nested CHOICE — recurse
			values.push(...extractChoiceStrings(member));
		}
		// Skip BLANK, SYMBOL, etc.
	}
	return values;
}

/** Walk a rule tree to find an ALIAS node with the given value. Returns the alias's content. */
function findAliasContent(rule: GrammarRule, aliasValue: string): GrammarRule | null {
	if (rule.type === 'ALIAS' && rule.named && rule.value === aliasValue) {
		return rule.content;
	}
	// Recurse into containers
	if ('members' in rule) {
		for (const member of rule.members) {
			const found = findAliasContent(member, aliasValue);
			if (found) return found;
		}
	}
	if ('content' in rule) {
		return findAliasContent(rule.content, aliasValue);
	}
	return null;
}

/**
 * Collect non-optional STRING tokens from a grammar rule.
 * These are the fixed keywords/punctuation that always appear in the rendered output.
 */
export function collectRequiredTokens(grammar: string, nodeKind: string): string[] {
	const rule = readGrammarRule(grammar, nodeKind);
	if (!rule) return [];
	const tokens: string[] = [];
	walkForTokens(rule, false, tokens);
	return tokens;
}

function walkForTokens(rule: GrammarRule, optional: boolean, tokens: string[]): void {
	switch (rule.type) {
		case 'SEQ':
			for (const member of rule.members) {
				walkForTokens(member, optional, tokens);
			}
			break;
		case 'STRING':
			if (!optional) tokens.push(rule.value);
			break;
		case 'CHOICE': {
			const hasBlank = rule.members.some(m => m.type === 'BLANK');
			const nonBlank = rule.members.filter(m => m.type !== 'BLANK');
			if (hasBlank) {
				// Everything inside is optional
				for (const member of rule.members) {
					walkForTokens(member, true, tokens);
				}
			} else if (nonBlank.length > 1) {
				// Non-optional CHOICE — only keep tokens common to ALL branches
				const branchTokens = nonBlank.map(m => {
					const bt: string[] = [];
					walkForTokens(m, false, bt);
					return new Set(bt);
				});
				const commonTokens = [...branchTokens[0]!].filter(
					t => branchTokens.every(s => s.has(t)),
				);
				if (!optional) tokens.push(...commonTokens);
			} else if (nonBlank.length === 1) {
				walkForTokens(nonBlank[0]!, optional, tokens);
			}
			break;
		}
		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
			walkForTokens(rule.content, optional, tokens);
			break;
		case 'REPEAT':
			walkForTokens(rule.content, true, tokens);
			break;
		case 'REPEAT1':
			walkForTokens(rule.content, optional, tokens);
			break;
		case 'ALIAS':
			walkForTokens(rule.content, optional, tokens);
			break;
		case 'TOKEN':
		case 'IMMEDIATE_TOKEN':
			walkForTokens(rule.content, optional, tokens);
			break;
		default:
			break;
	}
}

// ---------------------------------------------------------------------------
// grammar.json–derived metadata (replaces node-types.json for structure)
// ---------------------------------------------------------------------------

interface FieldAccum {
	types: Set<string>;
	namedTypes: Set<string>;
	optional: boolean;
	repeated: boolean;
}

interface ChildAccum {
	types: Set<string>;
	namedTypes: Set<string>;
	optional: boolean;
	repeated: boolean;
}

/**
 * Walk a grammar rule to collect FIELD metadata.
 * Tracks optionality (CHOICE with BLANK) and multiplicity (REPEAT/REPEAT1).
 * Recurses into _-prefixed abstract symbols to find inlined fields.
 */
function walkForFields(
	rule: GrammarRule,
	optional: boolean,
	repeated: boolean,
	fields: Map<string, FieldAccum>,
	grammar?: string,
	visited?: Set<string>,
): void {
	switch (rule.type) {
		case 'SEQ':
			for (const m of rule.members) walkForFields(m, optional, repeated, fields, grammar, visited);
			break;
		case 'FIELD': {
			let accum = fields.get(rule.name);
			if (!accum) {
				accum = { types: new Set(), namedTypes: new Set(), optional: false, repeated: false };
				fields.set(rule.name, accum);
			}
			extractTypesFromContent(rule.content, accum.types, accum.namedTypes);
			// Optionality: either from outer context (CHOICE+BLANK wrapping this FIELD)
			// or from inner content (FIELD content is CHOICE(..., BLANK))
			if (optional || hasBlankChoice(rule.content)) accum.optional = true;
			if (repeated) accum.repeated = true;
			break;
		}
		case 'SYMBOL': {
			// Recurse into _-prefixed abstract symbols — they may contain FIELD nodes
			// that belong to the parent (e.g., _call_signature has parameters, return_type)
			if (grammar && rule.name.startsWith('_')) {
				const v = visited ?? new Set<string>();
				if (!v.has(rule.name)) {
					v.add(rule.name);
					const subRule = readGrammarRule(grammar, rule.name);
					if (subRule) {
						walkForFields(subRule, optional, repeated, fields, grammar, v);
					}
				}
			}
			break;
		}
		case 'CHOICE': {
			const hasBlank = rule.members.some(m => m.type === 'BLANK');
			const nonBlank = rule.members.filter(m => m.type !== 'BLANK');

			if (nonBlank.length <= 1) {
				// Single branch or all BLANK — just walk with optionality
				if (nonBlank.length === 1) {
					walkForFields(nonBlank[0]!, optional || hasBlank, repeated, fields, grammar, visited);
				}
			} else {
				// Multiple non-blank branches — collect per-branch fields independently
				const branchFieldMaps: Map<string, FieldAccum>[] = [];
				for (const m of nonBlank) {
					const branchFields = new Map<string, FieldAccum>();
					walkForFields(m, false, repeated, branchFields, grammar, visited ? new Set(visited) : undefined);
					branchFieldMaps.push(branchFields);
				}

				// Merge branch results: a field is optional if it doesn't appear
				// in ALL branches, or if BLANK is present
				const allBranchFieldNames = branchFieldMaps.map(m => new Set(m.keys()));
				const allFieldNames = new Set<string>();
				for (const s of allBranchFieldNames) for (const n of s) allFieldNames.add(n);

				for (const name of allFieldNames) {
					const inAllBranches = !hasBlank && allBranchFieldNames.every(s => s.has(name));

					let existing = fields.get(name);
					if (!existing) {
						existing = { types: new Set(), namedTypes: new Set(), optional: false, repeated: false };
						fields.set(name, existing);
					}

					// Merge types from all branches where this field appears
					for (const branchFields of branchFieldMaps) {
						const accum = branchFields.get(name);
						if (accum) {
							for (const t of accum.types) existing.types.add(t);
							for (const t of accum.namedTypes) existing.namedTypes.add(t);
							if (accum.optional) existing.optional = true;
							if (accum.repeated) existing.repeated = true;
						}
					}

					if (!inAllBranches || optional) existing.optional = true;
				}
			}
			break;
		}
		case 'REPEAT':
			walkForFields(rule.content, true, true, fields, grammar, visited);
			break;
		case 'REPEAT1':
			walkForFields(rule.content, optional, true, fields, grammar, visited);
			break;
		case 'PREC': case 'PREC_LEFT': case 'PREC_RIGHT':
			walkForFields(rule.content, optional, repeated, fields, grammar, visited);
			break;
		case 'ALIAS':
			walkForFields(rule.content, optional, repeated, fields, grammar, visited);
			break;
		case 'TOKEN': case 'IMMEDIATE_TOKEN':
			walkForFields(rule.content, optional, repeated, fields, grammar, visited);
			break;
		default:
			break;
	}
}

/**
 * Walk a grammar rule to collect unnamed children (non-FIELD SYMBOLs).
 * Tracks optionality and multiplicity from context.
 * Skips _-prefixed abstract symbols (they're inlined for fields, not real children).
 */
function walkForChildren(
	rule: GrammarRule,
	optional: boolean,
	repeated: boolean,
	children: ChildAccum[],
	insideField: boolean,
	grammar?: string,
	visited?: Set<string>,
): void {
	switch (rule.type) {
		case 'SEQ':
			for (const m of rule.members) walkForChildren(m, optional, repeated, children, insideField, grammar, visited);
			break;
		case 'FIELD':
			// Children inside FIELD nodes are named fields, not unnamed children
			walkForChildren(rule.content, optional, repeated, children, true, grammar, visited);
			break;
		case 'SYMBOL':
			if (!insideField) {
				if (rule.name.startsWith('_')) {
					// Abstract symbol — may contain fields (handled by walkForFields)
					// but could also contain unnamed children. Recurse to find them.
					if (grammar) {
						const v = visited ?? new Set<string>();
						if (!v.has(rule.name)) {
							v.add(rule.name);
							const subRule = readGrammarRule(grammar, rule.name);
							if (subRule) {
								walkForChildren(subRule, optional, repeated, children, false, grammar, v);
							}
						}
					}
				} else {
					children.push({
						types: new Set([rule.name]),
						namedTypes: new Set([rule.name]),
						optional,
						repeated,
					});
				}
			}
			break;
		case 'ALIAS':
			if (!insideField && rule.named) {
				children.push({
					types: new Set([rule.value]),
					namedTypes: new Set([rule.value]),
					optional,
					repeated,
				});
			} else if (!insideField) {
				walkForChildren(rule.content, optional, repeated, children, false, grammar, visited);
			}
			break;
		case 'CHOICE': {
			const hasBlank = rule.members.some(m => m.type === 'BLANK');
			for (const m of rule.members) {
				if (m.type !== 'BLANK') walkForChildren(m, optional || hasBlank, repeated, children, insideField, grammar, visited);
			}
			break;
		}
		case 'REPEAT':
			walkForChildren(rule.content, true, true, children, insideField, grammar, visited);
			break;
		case 'REPEAT1':
			walkForChildren(rule.content, optional, true, children, insideField, grammar, visited);
			break;
		case 'PREC': case 'PREC_LEFT': case 'PREC_RIGHT':
			walkForChildren(rule.content, optional, repeated, children, insideField, grammar, visited);
			break;
		case 'TOKEN': case 'IMMEDIATE_TOKEN':
			walkForChildren(rule.content, optional, repeated, children, insideField, grammar, visited);
			break;
		default:
			break;
	}
}

/** Check if a rule is or directly contains a CHOICE with BLANK (making it optional). */
function hasBlankChoice(rule: GrammarRule): boolean {
	if (rule.type === 'CHOICE') {
		return rule.members.some(m => m.type === 'BLANK');
	}
	// Unwrap precedence wrappers
	if (rule.type === 'PREC' || rule.type === 'PREC_LEFT' || rule.type === 'PREC_RIGHT') {
		return hasBlankChoice(rule.content);
	}
	return false;
}

/** Extract SYMBOL/ALIAS type names from a FIELD's content rule. */
function extractTypesFromContent(rule: GrammarRule, types: Set<string>, namedTypes: Set<string>): void {
	switch (rule.type) {
		case 'SYMBOL':
			types.add(rule.name);
			if (!rule.name.startsWith('_')) namedTypes.add(rule.name);
			break;
		case 'STRING':
			types.add(rule.value);
			// STRING values are anonymous tokens — don't add to namedTypes
			break;
		case 'ALIAS':
			if (rule.named) {
				types.add(rule.value);
				namedTypes.add(rule.value);
			} else {
				extractTypesFromContent(rule.content, types, namedTypes);
			}
			break;
		case 'CHOICE':
			for (const m of rule.members) {
				if (m.type !== 'BLANK') extractTypesFromContent(m, types, namedTypes);
			}
			break;
		case 'SEQ':
			for (const m of rule.members) extractTypesFromContent(m, types, namedTypes);
			break;
		case 'PREC': case 'PREC_LEFT': case 'PREC_RIGHT':
			extractTypesFromContent(rule.content, types, namedTypes);
			break;
		case 'TOKEN': case 'IMMEDIATE_TOKEN':
			// Tokens produce anonymous nodes — skip for named type extraction
			break;
		case 'REPEAT': case 'REPEAT1':
			extractTypesFromContent(rule.content, types, namedTypes);
			break;
		default:
			break;
	}
}

/**
 * Resolve the complete set of named types for a supertype symbol.
 * e.g., _expression → all concrete types that can appear in that position.
 */
function resolveSupertypeMembers(grammar: string, symbolName: string): string[] {
	const gj = loadGrammarJson(grammar);
	const rule = gj.rules[symbolName];
	if (!rule) return [symbolName];

	// If it's a CHOICE of SYMBOLs (typical supertype pattern), resolve each
	const types: string[] = [];
	collectConcreteTypes(grammar, rule, types, new Set());
	return types;
}

function collectConcreteTypes(grammar: string, rule: GrammarRule, types: string[], visited: Set<string>): void {
	switch (rule.type) {
		case 'SYMBOL': {
			if (visited.has(rule.name)) return;
			visited.add(rule.name);
			if (rule.name.startsWith('_')) {
				// Abstract — recurse into its rule
				const gj = loadGrammarJson(grammar);
				const sub = gj.rules[rule.name];
				if (sub) collectConcreteTypes(grammar, sub, types, visited);
			} else {
				types.push(rule.name);
			}
			break;
		}
		case 'ALIAS':
			if (rule.named) types.push(rule.value);
			break;
		case 'CHOICE':
			for (const m of rule.members) {
				if (m.type !== 'BLANK') collectConcreteTypes(grammar, m, types, visited);
			}
			break;
		case 'PREC': case 'PREC_LEFT': case 'PREC_RIGHT':
			collectConcreteTypes(grammar, rule.content, types, visited);
			break;
		case 'SEQ':
			for (const m of rule.members) collectConcreteTypes(grammar, m, types, visited);
			break;
		default:
			break;
	}
}

/**
 * Extract the validation regex pattern from a leaf kind's grammar rule.
 * Returns the pattern string if found, undefined otherwise.
 * Handles: PATTERN, TOKEN(PATTERN), precedence wrappers.
 */
export function extractLeafPattern(grammar: string, kind: string): string | undefined {
	const rule = readGrammarRule(grammar, kind);
	if (!rule) return undefined;
	return extractPattern(rule);
}

function extractPattern(rule: GrammarRule): string | undefined {
	switch (rule.type) {
		case 'PATTERN':
			return rule.value;
		case 'TOKEN':
		case 'IMMEDIATE_TOKEN':
			return extractPattern(rule.content);
		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
			return extractPattern(rule.content);
		case 'SEQ': {
			// SEQ of patterns → concatenate
			const parts = rule.members.map(m => extractPattern(m));
			if (parts.every((p): p is string => p !== undefined)) return parts.join('');
			return undefined;
		}
		case 'CHOICE': {
			const hasBlank = rule.members.some(m => m.type === 'BLANK');
			const nonBlank = rule.members.filter(m => m.type !== 'BLANK');
			const patterns = nonBlank.map(m => extractPattern(m));
			if (patterns.every((p): p is string => p !== undefined)) {
				const group = patterns.length === 1 ? patterns[0]! : `(?:${patterns.join('|')})`;
				return hasBlank ? `${group}?` : group;
			}
			return undefined;
		}
		case 'REPEAT':
			{ const inner = extractPattern(rule.content); return inner ? `(?:${inner})*` : undefined; }
		case 'REPEAT1':
			{ const inner = extractPattern(rule.content); return inner ? `(?:${inner})+` : undefined; }
		case 'STRING':
			// Escape for regex
			return rule.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		default:
			return undefined;
	}
}

/**
 * Determine if a grammar rule represents a leaf node (no fields, no named children).
 * Leaf rules are pure STRING, PATTERN, CHOICE-of-STRINGs, or TOKEN wrapping those.
 */
function isLeafRule(rule: GrammarRule): boolean {
	switch (rule.type) {
		case 'STRING':
		case 'PATTERN':
		case 'BLANK':
			return true;
		case 'TOKEN':
		case 'IMMEDIATE_TOKEN':
			return true; // TOKEN always produces a single leaf
		case 'CHOICE':
			return rule.members.every(m => isLeafRule(m));
		case 'SEQ':
			// SEQ of all leaf parts (e.g., template literal pieces) — still a leaf
			return rule.members.every(m => isLeafRule(m));
		case 'PREC': case 'PREC_LEFT': case 'PREC_RIGHT':
			return isLeafRule(rule.content);
		case 'REPEAT': case 'REPEAT1':
			return isLeafRule(rule.content);
		default:
			return false;
	}
}

/**
 * Extract NodeMeta from a grammar.json rule (no node-types.json dependency).
 */
function extractKindMeta(grammar: string, nodeKind: string): KindMeta | null {
	const rule = readGrammarRule(grammar, nodeKind);
	if (!rule) return null;

	// Extract fields (recurses into _-prefixed abstract rules)
	const fieldAccums = new Map<string, FieldAccum>();
	walkForFields(rule, false, false, fieldAccums, grammar);

	const fields: FieldMeta[] = [];
	for (const [name, accum] of fieldAccums) {
		// Resolve supertype symbols to their concrete members
		const allTypes = new Set<string>();
		const allNamedTypes = new Set<string>();
		for (const t of accum.types) {
			if (t.startsWith('_')) {
				for (const resolved of resolveSupertypeMembers(grammar, t)) {
					allTypes.add(resolved);
					allNamedTypes.add(resolved);
				}
			} else {
				allTypes.add(t);
			}
		}
		for (const t of accum.namedTypes) {
			allNamedTypes.add(t);
		}

		fields.push({
			name,
			required: !accum.optional,
			multiple: accum.repeated,
			types: [...allTypes],
			namedTypes: [...allNamedTypes],
		});
	}

	// Extract unnamed children (recurses into _-prefixed, skips hidden symbols)
	const childAccums: ChildAccum[] = [];
	walkForChildren(rule, false, false, childAccums, false, grammar);

	const hasChildren = childAccums.length > 0;

	const result: KindMeta = { kind: nodeKind, fields, hasChildren };

	if (hasChildren) {
		// Merge all child type sets
		const allTypes = new Set<string>();
		const allNamedTypes = new Set<string>();
		let anyRequired = false;
		let anyMultiple = false;

		for (const child of childAccums) {
			for (const t of child.types) {
				if (t.startsWith('_')) {
					for (const resolved of resolveSupertypeMembers(grammar, t)) {
						allTypes.add(resolved);
						allNamedTypes.add(resolved);
					}
				} else {
					allTypes.add(t);
				}
			}
			for (const t of child.namedTypes) allNamedTypes.add(t);
			if (!child.optional) anyRequired = true;
			if (child.repeated || childAccums.length > 1) anyMultiple = true;
		}

		result.children = {
			required: anyRequired,
			multiple: anyMultiple,
			types: [...allTypes],
			namedTypes: [...allNamedTypes],
		};
	}

	return result;
}

// ---------------------------------------------------------------------------
// node-types.json functions (kept for: supertypes, anonymous tokens, grammar type)
// ---------------------------------------------------------------------------

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

	// Convert array to map keyed by type name.
	// Prefer named entries over unnamed when both exist (e.g. 'object').
	const parsed: GrammarMap = {};
	for (const entry of entries) {
		const existing = parsed[entry.type];
		if (!existing || (entry.named && !existing.named)) {
			parsed[entry.type] = entry;
		}
	}

	grammarCache.set(grammar, parsed);
	return parsed;
}

// --- Public API ---

/**
 * Read metadata for a single node kind.
 * Primary source: grammar.json rules. Fallback: node-types.json (for ALIASed/external nodes).
 */
export function readGrammarKind(grammar: string, nodeKind: string): KindMeta {
	// node-types.json is the authoritative source for required/multiple flags.
	// grammar.json provides richer type resolution (supertype expansion).
	const grammarMap = loadGrammar(grammar);
	const ntEntry = grammarMap[nodeKind];

	// Try grammar.json for type resolution
	const grammarMeta = extractKindMeta(grammar, nodeKind);

	if (!grammarMeta && !ntEntry) {
		throw new Error(
			`Node kind "${nodeKind}" not found in ${grammar} grammar`,
		);
	}

	// If no grammar.json rule, use node-types.json directly
	if (!grammarMeta) {
		const fields: FieldMeta[] = [];
		if (ntEntry!.fields) {
			for (const [name, raw] of Object.entries(ntEntry!.fields)) {
				fields.push({
					name,
					required: raw.required,
					multiple: raw.multiple,
					types: raw.types.map((t) => t.type),
					namedTypes: raw.types.filter((t) => t.named).map((t) => t.type),
				});
			}
		}
		const hasChildren = ntEntry!.children != null;
		const result: KindMeta = { kind: nodeKind, fields, hasChildren };
		if (ntEntry!.children) {
			result.children = {
				required: ntEntry!.children.required,
				multiple: ntEntry!.children.multiple,
				types: ntEntry!.children.types.map((t) => t.type),
				namedTypes: ntEntry!.children.types.filter((t) => t.named).map((t) => t.type),
			};
		}
		return result;
	}

	// Merge: use grammar.json types but node-types.json required/multiple flags.
	// node-types.json is authoritative for what fields/children exist and their multiplicity.
	if (ntEntry) {
		// Build a lookup of grammar.json fields
		const grammarFieldMap = new Map(grammarMeta.fields.map(f => [f.name, f]));

		if (ntEntry.fields) {
			// Patch existing fields and add missing ones from node-types.json
			for (const [name, ntField] of Object.entries(ntEntry.fields)) {
				const gField = grammarFieldMap.get(name);
				if (gField) {
					gField.required = ntField.required;
					gField.multiple = ntField.multiple;
				} else {
					// Field only in node-types.json (aliased/external) — add it
					grammarMeta.fields.push({
						name,
						required: ntField.required,
						multiple: ntField.multiple,
						types: ntField.types.map(t => t.type),
						namedTypes: ntField.types.filter(t => t.named).map(t => t.type),
					});
				}
			}

			// Remove fields that grammar.json found but node-types.json doesn't have
			grammarMeta.fields = grammarMeta.fields.filter(f =>
				ntEntry.fields![f.name] !== undefined
			);
		}

		// Patch children required/multiple from node-types.json
		if (ntEntry.children) {
			if (grammarMeta.children) {
				grammarMeta.children.required = ntEntry.children.required;
				grammarMeta.children.multiple = ntEntry.children.multiple;
			} else {
				// node-types.json says children exist but grammar.json didn't find them
				grammarMeta.hasChildren = true;
				grammarMeta.children = {
					required: ntEntry.children.required,
					multiple: ntEntry.children.multiple,
					types: ntEntry.children.types.map(t => t.type),
					namedTypes: ntEntry.children.types.filter(t => t.named).map(t => t.type),
				};
			}
		} else if (grammarMeta.children) {
			// grammar.json found children but node-types.json says none
			grammarMeta.hasChildren = false;
			grammarMeta.children = undefined;
		}
	}

	return grammarMeta;
}

/**
 * List all named branch kinds — nodes that have fields or children.
 * Source: node-types.json (the authoritative tree-sitter output for valid AST node kinds).
 */
export function listBranchKinds(grammar: string): string[] {
	const grammarMap = loadGrammar(grammar);
	const kinds: string[] = [];

	for (const [key, entry] of Object.entries(grammarMap)) {
		if (key.startsWith('_')) continue;
		if (!entry.named) continue;
		if (entry.subtypes) continue; // skip abstract supertypes

		const hasFields = entry.fields != null && Object.keys(entry.fields).length > 0;
		const hasChildren = entry.children != null;

		if (hasFields || hasChildren) {
			kinds.push(key);
		}
	}

	return kinds;
}

/**
 * List all named leaf kinds — no fields, no children, not abstract.
 * Source: node-types.json. These become terminal factories in the ir namespace.
 */
export function listLeafKinds(grammar: string): string[] {
	const grammarMap = loadGrammar(grammar);
	const leaves: string[] = [];

	for (const [key, entry] of Object.entries(grammarMap)) {
		if (key.startsWith('_')) continue;
		if (!entry.named) continue;
		if (entry.subtypes) continue;

		const hasFields = entry.fields != null && Object.keys(entry.fields).length > 0;
		const hasChildren = entry.children != null;

		if (!hasFields && !hasChildren) {
			leaves.push(key);
		}
	}

	return leaves;
}

/**
 * Extract constant text from a grammar rule if it resolves to a fixed string.
 * Handles STRING, SEQ of STRINGs, and precedence wrappers.
 */
function extractConstantText(rule: GrammarRule): string | undefined {
	switch (rule.type) {
		case 'STRING':
			return rule.value;
		case 'SEQ':
			// All members must be constant strings
			const parts = rule.members.map(m => extractConstantText(m));
			if (parts.every((p): p is string => p !== undefined)) return parts.join('');
			return undefined;
		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'TOKEN':
		case 'IMMEDIATE_TOKEN':
			return extractConstantText(rule.content);
		default:
			return undefined;
	}
}

/**
 * List keyword kinds — named leaf nodes that always produce the same text.
 * Returns a map from kind → fixed text (e.g., 'self' → 'self', 'mutable_specifier' → 'mut').
 */
export function listKeywordKinds(grammar: string): Map<string, string> {
	const leaves = listLeafKinds(grammar);
	const gj = loadGrammarJson(grammar);
	const result = new Map<string, string>();

	for (const kind of leaves) {
		const rule = gj.rules[kind];
		if (!rule) continue;
		const text = extractConstantText(rule);
		if (text !== undefined) result.set(kind, text);
	}

	return result;
}

export interface OperatorContext {
	parentKind: string;
	field: string;
	tokens: string[];
}

/**
 * Discover anonymous tokens that appear as field values in named nodes.
 * Derives from grammar.json rules — walks FIELD content for STRING alternatives.
 */
export function listOperatorContexts(grammar: string): OperatorContext[] {
	const gj = loadGrammarJson(grammar);
	const results: OperatorContext[] = [];

	for (const [kind, rule] of Object.entries(gj.rules)) {
		if (kind.startsWith('_')) continue;

		// Extract fields and check for anonymous token (STRING) types
		const fieldAccums = new Map<string, FieldAccum>();
		walkForFields(rule, false, false, fieldAccums);

		for (const [fieldName, accum] of fieldAccums) {
			// Anonymous tokens are STRING values — types that aren't named symbols
			const anonTokens = [...accum.types].filter(t =>
				!t.startsWith('_') && // not a supertype reference
				!accum.namedTypes.has(t), // not a named type → it's a STRING
			);

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
export function listKeywordTokens(grammar: string): string[] {
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

export interface SupertypeInfo {
	/** Supertype name (e.g. '_expression', 'declaration') */
	name: string;
	/** Named subtypes (concrete node kinds) */
	subtypes: string[];
}

/**
 * List supertype nodes and their subtypes.
 * Supertypes are grammar entries that have a `subtypes` array — they define
 * abstract groupings like _expression, _statement, _type.
 */
export function listSupertypes(grammar: string): SupertypeInfo[] {
	const grammarMap = loadGrammar(grammar);
	const results: SupertypeInfo[] = [];

	for (const [kind, entry] of Object.entries(grammarMap)) {
		if (!entry.subtypes || entry.subtypes.length === 0) continue;
		const named = entry.subtypes.filter(s => s.named).map(s => s.type);
		if (named.length > 0) {
			results.push({ name: kind, subtypes: named });
		}
	}

	return results;
}
