/**
 * Emits from.ts — the .from() API with shared resolver functions.
 *
 * Resolution logic is generated per unique type-signature and shared across
 * all fields that accept the same set of types. This deduplicates the ~2KB
 * IIFE bodies that were previously inlined for every field.
 *
 * Separated from factories.ts for tree-shaking: users who only use the
 * regular API never load .from() resolution code.
 */

import type { HydratedNodeModel } from '../node-model.ts';
import { isTupleChildren, eachChildSlot } from '../node-model.ts';
import { extractLeafPattern } from '../grammar-reader.ts';
import { loadGrammar, type GrammarRule } from '../grammar.ts';
import { toTypeName, toFactoryName, toRawFactoryName, toFieldName } from '../naming.ts';
import { type StructuralNode, structuralNodes, fieldsOf, leafKindsOf, keywordKindsOf, leafValuesOf, escapeString, childSlotNames } from './utils.ts';
import { buildProjectionContext, projectKinds, type ProjectionContext, type KindProjection } from './kind-projections.ts';

export interface EmitFromConfig {
	grammar: string;
	nodes: HydratedNodeModel[];
}

// ---------------------------------------------------------------------------
// Resolution key — canonical identity for a field's type signature
// ---------------------------------------------------------------------------

interface ResolvedFieldTypes {
	leafTypes: string[];
	branchTypes: string[];
	supertypes: string[];
	anonTokens: string[];
}

/** Compute the canonical type components for a field using KindProjection. */
function resolveFieldTypes(
	proj: KindProjection,
	leafSet: Set<string>,
	branchNodeSet: Set<string>,
	supertypeSet: Set<string>,
): ResolvedFieldTypes {
	const leafTypes = proj.expandedAll.filter(t => leafSet.has(t));
	const branchTypes = proj.expandedAll.filter(t => branchNodeSet.has(t));
	const supertypes = proj.expandedAll.filter(t => supertypeSet.has(t));
	const anonTokens = proj.anonTokens;
	return { leafTypes, branchTypes, supertypes, anonTokens };
}

/** Create a canonical key for deduplication. */
function resolverKey(r: ResolvedFieldTypes): string {
	return `L:${[...r.leafTypes].sort().join(',')};B:${[...r.branchTypes].sort().join(',')};S:${[...r.supertypes].sort().join(',')};A:${[...r.anonTokens].sort().join(',')}`;
}

/** Create a short deterministic name from a key for the generated function (fallback). */
function resolverNameHash(key: string): string {
	let hash = 5381;
	for (let i = 0; i < key.length; i++) {
		hash = ((hash << 5) + hash + key.charCodeAt(i)) | 0;
	}
	return `_r${(hash >>> 0).toString(36)}`;
}

/**
 * Derive a readable resolver name from its type-set.
 *
 * Priority:
 * 1. Find a supertype/hidden rule whose concrete types are a superset → use its name
 * 2. If all types are from a single supertype → use that supertype name with suffix
 * 3. Fall back to hash
 */
function deriveResolverName(
	resolved: ResolvedFieldTypes,
	expandedSupertypes: ReadonlyMap<string, Set<string>>,
	usedNames: Set<string>,
): string {
	const allConcreteTypes = new Set([...resolved.leafTypes, ...resolved.branchTypes]);

	// Try to find the smallest supertype that covers all concrete types
	let bestMatch: { name: string; size: number } | null = null;
	for (const [stKind, concreteKinds] of expandedSupertypes) {
		// Check if this supertype covers all our types
		let coversAll = true;
		for (const t of allConcreteTypes) {
			if (!concreteKinds.has(t)) { coversAll = false; break; }
		}
		if (coversAll && (!bestMatch || concreteKinds.size < bestMatch.size)) {
			bestMatch = { name: stKind, size: concreteKinds.size };
		}
	}

	if (bestMatch) {
		const baseName = `_resolve${toTypeName(bestMatch.name)}`;
		// Exact match → use base name (may already exist from Phase 1)
		if (bestMatch.size === allConcreteTypes.size && !usedNames.has(baseName)) {
			return baseName;
		}
		// Subset → add disambiguating suffix
		let candidate = baseName;
		let suffix = 2;
		while (usedNames.has(candidate)) {
			candidate = `${baseName}${suffix++}`;
		}
		return candidate;
	}

	// No supertype match — fall back to hash with collision avoidance
	const key = `L:${[...resolved.leafTypes].sort().join(',')};B:${[...resolved.branchTypes].sort().join(',')}`;
	let candidate = resolverNameHash(key);
	let suffix = 2;
	while (usedNames.has(candidate)) {
		candidate = `${resolverNameHash(key)}${suffix++}`;
	}
	return candidate;
}

/**
 * Compute the return type expression for a resolver from its concrete types.
 * Uses `KindMap[K]` union for the return type. If a supertype union name is
 * available, uses that directly.
 */
function resolverReturnType(resolved: ResolvedFieldTypes, supertypeKind?: string): string {
	if (supertypeKind) {
		const cleanName = supertypeKind.replace(/^_/, '');
		return toTypeName(cleanName);
	}
	const members: string[] = [];
	for (const kind of resolved.leafTypes) members.push(`KindMap['${kind}']`);
	for (const kind of resolved.branchTypes) members.push(`KindMap['${kind}']`);
	for (const kind of resolved.supertypes) {
		const cleanName = kind.replace(/^_/, '');
		members.push(toTypeName(cleanName));
	}
	// Include anonymous tokens only when the resolver handles ONLY anon tokens
	// (no leaf/branch/supertype). Mixed resolvers return node types — string
	// literals would widen the union incompatibly.
	if (members.length === 0) {
		for (const token of resolved.anonTokens) {
			members.push(`'${escapeString(token)}'`);
		}
	}
	if (members.length === 0) return 'string'; // empty types = text-only field
	return members.join(' | ');
}

// ---------------------------------------------------------------------------
// Hidden SEQ rule detection — find shared field groups to deduplicate
// ---------------------------------------------------------------------------

interface HiddenSeqInfo {
	/** The hidden rule name (e.g. '_call_signature') */
	ruleName: string;
	/** Field names defined in this SEQ rule */
	fieldNames: string[];
	/** Named rules that reference this hidden rule */
	parents: string[];
}

/** Extract FIELD names from a grammar rule (non-recursive — just top-level SEQ members). */
function extractFieldNames(rule: GrammarRule): string[] {
	const fields: string[] = [];
	function walk(r: GrammarRule) {
		if (r.type === 'FIELD') {
			fields.push(r.name);
		} else if (r.type === 'SEQ') {
			for (const m of r.members) walk(m);
		} else if (r.type === 'CHOICE') {
			for (const m of r.members) walk(m);
		} else if (r.type === 'REPEAT' || r.type === 'REPEAT1') {
			walk(r.content);
		} else if (r.type === 'PREC' || r.type === 'PREC_LEFT' || r.type === 'PREC_RIGHT' || r.type === 'PREC_DYNAMIC') {
			walk(r.content);
		}
	}
	walk(rule);
	return fields;
}

/** Check if a grammar rule references a symbol name (recursive). */
function referencesSymbol(rule: GrammarRule, name: string): boolean {
	if (rule.type === 'SYMBOL') return rule.name === name;
	if (rule.type === 'SEQ' || rule.type === 'CHOICE') return rule.members.some(m => referencesSymbol(m, name));
	if (rule.type === 'REPEAT' || rule.type === 'REPEAT1') return referencesSymbol(rule.content, name);
	if (rule.type === 'FIELD') return referencesSymbol(rule.content, name);
	if (rule.type === 'PREC' || rule.type === 'PREC_LEFT' || rule.type === 'PREC_RIGHT' || rule.type === 'PREC_DYNAMIC') return referencesSymbol(rule.content, name);
	if (rule.type === 'ALIAS') return referencesSymbol(rule.content, name);
	return false;
}

/** Find hidden SEQ rules used by 2+ parent rules. */
function findSharedHiddenSeqs(grammarName: string, branchKinds: Set<string>): HiddenSeqInfo[] {
	const grammar = loadGrammar(grammarName);
	const results: HiddenSeqInfo[] = [];

	for (const [name, rule] of Object.entries(grammar.rules)) {
		if (!name.startsWith('_')) continue;
		if (rule.type !== 'SEQ') continue;
		const fieldNames = extractFieldNames(rule);
		if (fieldNames.length === 0) continue;

		// Find parent rules that reference this hidden rule
		const parents: string[] = [];
		for (const [pName, pRule] of Object.entries(grammar.rules)) {
			if (pName === name) continue;
			if (!branchKinds.has(pName)) continue; // Only count structural nodes
			if (referencesSymbol(pRule, name)) parents.push(pName);
		}

		if (parents.length >= 2) {
			results.push({ ruleName: name, fieldNames, parents });
		}
	}

	return results;
}

// ---------------------------------------------------------------------------
// Indented line builder
// ---------------------------------------------------------------------------

class CodeBuilder {
	private lines: string[] = [];
	private depth = 0;
	private indentStr = '  ';

	indent(): this { this.depth++; return this; }
	dedent(): this { this.depth = Math.max(0, this.depth - 1); return this; }

	line(text: string = ''): this {
		if (text === '') {
			this.lines.push('');
		} else {
			this.lines.push(this.indentStr.repeat(this.depth) + text);
		}
		return this;
	}

	/** Add multiple lines (already formatted), each gets current indent. */
	block(texts: string[]): this {
		for (const t of texts) this.line(t);
		return this;
	}

	toString(): string {
		return this.lines.join('\n');
	}
}

// ---------------------------------------------------------------------------
// Main emitter
// ---------------------------------------------------------------------------

/**
 * Emit the from.ts file containing .from() functions for all branch node kinds.
 */
export function emitFrom(config: EmitFromConfig): string {
	const nodes = structuralNodes(config.nodes);
	const leafKinds = leafKindsOf(config.nodes);
	const keywordKinds = keywordKindsOf(config.nodes);
	const leafValueMap = leafValuesOf(config.nodes);
	const leafSet = new Set(leafKinds);
	const branchNodeSet = new Set(nodes.map(n => n.kind));
	const ctx = buildProjectionContext(new Map(config.nodes.map(n => [n.kind, n])));

	const supertypeSet = new Set(ctx.expandedSupertypes.keys());

	// --- Phase 1: Register supertype/hidden resolvers with readable names ---
	const resolverRegistry = new Map<string, { name: string; resolved: ResolvedFieldTypes; supertypeKind?: string }>();
	const supertypeResolverNames = new Map<string, string>();

	for (const [supertypeKind, concreteKinds] of ctx.expandedSupertypes) {
		const leafTypes = [...concreteKinds].filter(t => leafSet.has(t)).sort();
		const branchTypes = [...concreteKinds].filter(t => branchNodeSet.has(t)).sort();
		if (leafTypes.length === 0 && branchTypes.length === 0) continue;
		const resolved: ResolvedFieldTypes = { leafTypes, branchTypes, supertypes: [], anonTokens: [] };
		const key = resolverKey(resolved);
		const name = `_resolve${toTypeName(supertypeKind)}`;
		supertypeResolverNames.set(supertypeKind, name);
		if (!resolverRegistry.has(key)) {
			resolverRegistry.set(key, { name, resolved, supertypeKind });
		}
	}

	// --- Phase 2: Collect remaining unique resolver signatures from fields ---
	// Track used names to avoid duplicates
	const usedResolverNames = new Set<string>(
		[...resolverRegistry.values()].map(r => r.name)
	);

	function getOrCreateResolver(proj: KindProjection): { name: string; resolved: ResolvedFieldTypes; key: string } {
		const resolved = resolveFieldTypes(proj, leafSet, branchNodeSet, supertypeSet);
		const key = resolverKey(resolved);

		if (!resolverRegistry.has(key)) {
			const name = deriveResolverName(resolved, ctx.expandedSupertypes, usedResolverNames);
			usedResolverNames.add(name);
			resolverRegistry.set(key, { name, resolved });
		}

		const entry = resolverRegistry.get(key);
		return { name: entry?.name ?? '', resolved, key };
	}

	// Pre-scan all fields to discover unique resolvers
	for (const node of nodes) {
		for (const field of fieldsOf(node)) {
			getOrCreateResolver(projectKinds(field.kinds, ctx));
		}
		if (node.children != null) {
			eachChildSlot(node.children, (slot) => {
				getOrCreateResolver(projectKinds(slot.kinds, ctx));
			});
		}
	}

	// --- Phase 2b: Detect shared hidden SEQ rules for field deduplication ---
	const hiddenSeqs = findSharedHiddenSeqs(config.grammar, branchNodeSet);
	// Map: parentKind → list of { funcName, fieldNames } for each shared hidden SEQ it uses
	const sharedFieldGroups = new Map<string, { funcName: string; fieldNames: Set<string> }[]>();
	// All hidden SEQ field resolver function info
	const hiddenSeqResolvers: { funcName: string; info: HiddenSeqInfo }[] = [];

	for (const info of hiddenSeqs) {
		const cleanName = info.ruleName.replace(/^_/, '');
		const funcName = `_resolve${toTypeName(cleanName)}Fields`;
		hiddenSeqResolvers.push({ funcName, info });
		const fieldSet = new Set(info.fieldNames.map(f => toFieldName(f)));
		for (const parent of info.parents) {
			if (!sharedFieldGroups.has(parent)) sharedFieldGroups.set(parent, []);
			sharedFieldGroups.get(parent)!.push({ funcName, fieldNames: fieldSet });
		}
	}

	// --- Phase 3: Emit ---
	const out = new CodeBuilder();
	out.line('// Auto-generated by @sittir/codegen — do not edit');
	out.line('// .from() API — shared resolvers, immutable ergonomic setters');
	out.line();

	// Type-only imports — collect supertype union names used as resolver return types
	const baseTypeImports = nodes.map(n => toTypeName(n.kind)).sort();
	const configTypeImports = nodes.map(n => toTypeName(n.kind) + 'Config').sort();
	// Add child slot types for children-only nodes (used in from function signatures)
	const childrenOnlyKinds = new Set<string>();
	for (const node of nodes) {
		const nFields = fieldsOf(node);
		if (nFields.length === 0 && node.children != null && !isTupleChildren(node.children)) {
			childrenOnlyKinds.add(node.kind);
			// Add collapsed child types to imports
			const slot = Array.isArray(node.children) ? node.children[0]! : node.children;
			const slotProj = projectKinds(slot.kinds, ctx);
			for (const t of slotProj.collapsedTypes) {
				baseTypeImports.push(t);
			}
		}
	}
	for (const node of nodes) {
		const variants = node.variants;
		if (variants && variants.length > 1 && !childrenOnlyKinds.has(node.kind)) {
			const typeName = toTypeName(node.kind);
			for (const v of variants) {
				const vTypeName = `${typeName}${toTypeName(v.name)}`;
				baseTypeImports.push(vTypeName);
				configTypeImports.push(`${vTypeName}Config`);
			}
		}
	}
	// Collect ALL supertype union names used in resolver return types
	const supertypeUnionImports = new Set<string>();
	for (const [, { supertypeKind, resolved }] of resolverRegistry) {
		if (supertypeKind) {
			supertypeUnionImports.add(toTypeName(supertypeKind.replace(/^_/, '')));
		}
		// Also add supertypes referenced in the return type
		for (const st of resolved.supertypes) {
			supertypeUnionImports.add(toTypeName(st.replace(/^_/, '')));
		}
	}
	const allTypeImports = [...new Set([...baseTypeImports, ...configTypeImports, ...supertypeUnionImports])].sort();
	out.line(`import type { ${allTypeImports.join(', ')} } from './types.js';`);
	out.line("import type { KindMap, FromInputMap } from './types.js';");
	out.line("import type { RuntimeNodeOf } from '@sittir/types';");
	out.line("import { isNodeData, hasKind } from './utils.js';");
	out.line();

	// Import factory functions (including variant factories, skip children-only)
	const referencedFactories = collectReferencedFactories(nodes, leafSet, leafValueMap, keywordKinds, ctx);
	for (const node of nodes) {
		const variants = node.variants;
		if (variants && variants.length > 1 && !childrenOnlyKinds.has(node.kind)) {
			for (const v of variants) {
				referencedFactories.add(`${toRawFactoryName(node.kind)}_${v.name}_`);
			}
		}
	}
	if (referencedFactories.size > 0) {
		const imports = [...referencedFactories].sort().join(', ');
		out.line(`import { ${imports} } from './factories.js';`);
	}

	// Import FromInput types from types.ts (including variant FromInput types, skip children-only)
	const fromInputImports = nodes.map(n => `${toTypeName(n.kind)}FromInput`);
	for (const node of nodes) {
		const variants = node.variants;
		if (variants && variants.length > 1 && !childrenOnlyKinds.has(node.kind)) {
			const typeName = toTypeName(node.kind);
			for (const v of variants) {
				fromInputImports.push(`${typeName}${toTypeName(v.name)}FromInput`);
			}
		}
	}
	out.line(`import type { ${fromInputImports.join(', ')} } from './types.js';`);
	out.line();

	// FromMap — typed kind → from function mapping
	out.line('/** Maps kind string to its typed .from() resolver. */');
	out.line('export type FromMap = {');
	out.indent();
	out.line('[K in keyof FromInputMap]: (input: KindMap[K] | FromInputMap[K]) => RuntimeNodeOf<KindMap[K]>;');
	out.dedent();
	out.line('};');
	out.line();

	// _fromMap — runtime instance
	out.line('/** @internal Map of kind string to .from() resolver function. */');
	out.line('export const _fromMap = {');
	out.indent();
	for (const node of nodes) {
		const fromFn = `${toFactoryName(node.kind)}From`;
		out.line(`'${node.kind}': ${fromFn},`);
	}
	out.dedent();
	out.line('};');
	out.line();

	out.line('export function _resolveByKind(kind: string, rest: unknown) {');
	out.indent();
	out.line('const fn = (_fromMap as Record<string, (input: any) => unknown>)[kind];');
	out.line("if (fn) return fn(rest);");
	out.line("throw new Error(`Unknown kind for .from(): '${kind}'`);");
	out.dedent();
	out.line('}');
	out.line();

	// --- Collect referenced resolver names ---
	const referencedResolvers = new Set<string>();

	// Supertype resolvers are referenced by name from getResolverExpression
	// (single-supertype fields delegate to them) — always include them
	for (const name of supertypeResolverNames.values()) {
		referencedResolvers.add(name);
	}

	for (const node of nodes) {
		const fields = fieldsOf(node);
		for (const field of fields) {
			const fieldProj = projectKinds(field.kinds, ctx);
			const expr = getResolverExpression(fieldProj, leafSet, branchNodeSet, supertypeSet, keywordKinds, resolverRegistry, supertypeResolverNames);
			// Named resolvers start with _ and don't contain arrow syntax
			if (expr.startsWith('_') && !expr.includes('=>')) referencedResolvers.add(expr);
		}
		if (node.children != null) {
			eachChildSlot(node.children, (slot) => {
				const slotProj = projectKinds(slot.kinds, ctx);
				const expr = getResolverExpression(slotProj, leafSet, branchNodeSet, supertypeSet, keywordKinds, resolverRegistry, supertypeResolverNames);
				if (expr.startsWith('_') && !expr.includes('=>')) referencedResolvers.add(expr);
			});
		}
	}

	// --- Emit shared leaf dispatch infrastructure ---
	emitLeafDispatch(out, leafSet, leafValueMap, keywordKinds, config.grammar);

	// --- Emit shared resolver functions (only referenced ones) ---
	for (const [, { name, resolved, supertypeKind }] of resolverRegistry) {
		if (!referencedResolvers.has(name)) continue;
		emitResolverFunction(out, name, resolved, supertypeKind, leafSet, leafValueMap, keywordKinds, nodes, supertypeResolverNames, ctx.expandedSupertypes, branchNodeSet, config.grammar);
	}

	// --- Emit shared hidden SEQ field resolvers ---
	for (const { funcName, info } of hiddenSeqResolvers) {
		emitHiddenSeqFieldResolver(out, funcName, info, nodes, leafSet, branchNodeSet, supertypeSet, keywordKinds, resolverRegistry, supertypeResolverNames, ctx);
	}

	// --- Per-kind .from() functions ---
	for (const node of nodes) {
		emitFromFunction(out, node, leafSet, leafValueMap, keywordKinds, nodes, config.grammar, branchNodeSet, supertypeSet, resolverRegistry, supertypeResolverNames, ctx, sharedFieldGroups);
		out.line();

		// Variant-specific from functions (skip children-only — they share element type)
		const variants = node.variants;
		if (variants && variants.length > 1 && !childrenOnlyKinds.has(node.kind)) {
			for (const v of variants) {
				emitVariantFromFunction(out, node, v, leafSet, branchNodeSet, supertypeSet, keywordKinds, resolverRegistry, supertypeResolverNames, ctx, sharedFieldGroups);
				out.line();
			}
		}
	}

	return out.toString();
}

// ---------------------------------------------------------------------------
// Shared leaf dispatch emitter
// ---------------------------------------------------------------------------

function emitLeafDispatch(
	out: CodeBuilder,
	leafSet: Set<string>,
	leafValueMap: Map<string, string[]>,
	keywordKinds: Map<string, string>,
	grammar?: string,
): void {
	// _resolveScalar — shared boolean/number dispatch
	const hasBool = leafSet.has('boolean_literal');
	const hasInt = leafSet.has('integer_literal');
	const hasFloat = leafSet.has('float_literal');

	if (hasBool || hasInt || hasFloat) {
		out.line('/** Resolve JS primitives to leaf factories. Returns undefined if not a scalar. */');
		out.line('function _resolveScalar(v: unknown): unknown {');
		out.indent();
		if (hasBool) {
			out.line(`if (typeof v === 'boolean') return ${toRawFactoryName('boolean_literal')}(v ? 'true' : 'false');`);
		}
		if (hasInt && hasFloat) {
			out.line(`if (typeof v === 'number') return Number.isInteger(v) ? ${toRawFactoryName('integer_literal')}(\`\${v}\`) : ${toRawFactoryName('float_literal')}(\`\${v}\`);`);
		} else if (hasInt) {
			out.line(`if (typeof v === 'number') return ${toRawFactoryName('integer_literal')}(\`\${v}\`);`);
		} else if (hasFloat) {
			out.line(`if (typeof v === 'number') return ${toRawFactoryName('float_literal')}(\`\${v}\`);`);
		}
		out.line('return undefined;');
		out.dedent();
		out.line('}');
		out.line();
	}

	// _leafRegistry — kind → { pattern, factory, values } for string dispatch
	// Collect all leaf kinds that have patterns or values
	const leafEntries: { kind: string; values?: string[]; pattern?: string; patternFlags?: string; isKeyword: boolean; factory: string }[] = [];

	for (const kind of leafSet) {
		const factory = toRawFactoryName(kind);
		const isKeyword = keywordKinds.has(kind);
		const values = leafValueMap.get(kind);

		if (isKeyword) {
			leafEntries.push({ kind, isKeyword: true, factory, values: [keywordKinds.get(kind)!] });
		} else if (values && values.length > 0) {
			leafEntries.push({ kind, isKeyword: false, factory, values });
		} else if (grammar) {
			const pattern = extractLeafPattern(grammar, kind);
			if (pattern && !pattern.includes('//') && !pattern.includes('/*') && !pattern.includes('\\x')) {
				try {
					const flags = pattern.includes('\\p{') ? 'u' : '';
					new RegExp(`^${pattern}$`, flags);
					const escaped = pattern.replace(/\//g, '\\/').replace(/`/g, '\\`');
					leafEntries.push({ kind, isKeyword: false, factory, pattern: escaped, patternFlags: flags });
				} catch { /* skip unsafe patterns */ }
			} else {
				leafEntries.push({ kind, isKeyword: false, factory });
			}
		} else {
			leafEntries.push({ kind, isKeyword: false, factory });
		}
	}

	out.line('/** Leaf kind registry for string dispatch. */');
	out.line('const _leafRegistry: Record<string, { values?: string[]; pattern?: RegExp; factory: (text: string) => unknown }> = {');
	out.indent();
	for (const entry of leafEntries) {
		const parts: string[] = [];
		if (entry.values) {
			parts.push(`values: ${JSON.stringify(entry.values)}`);
		}
		if (entry.pattern) {
			// Escape literal newlines/CR so they don't break JS regex literal syntax
			const escaped = entry.pattern.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
			parts.push(`pattern: /^${escaped}$/${entry.patternFlags ?? ''}`);
		}
		parts.push(`factory: ${entry.isKeyword ? `() => ${entry.factory}()` : entry.factory}`);
		out.line(`'${entry.kind}': { ${parts.join(', ')} },`);
	}
	out.dedent();
	out.line('};');
	out.line();

	// Identifier-priority list for fallback
	const identPriority = ['identifier', 'type_identifier', 'field_identifier', 'shorthand_field_identifier']
		.filter(k => leafSet.has(k));

	out.line('/**');
	out.line(' * Resolve a string to the best matching leaf factory from a set of accepted kinds.');
	out.line(' * Returns undefined if no leaf kind matches.');
	out.line(' */');
	out.line('function _resolveLeafString(v: string, kinds: readonly string[]): unknown {');
	out.indent();
	out.line('for (const kind of kinds) {');
	out.indent();
	out.line('const entry = _leafRegistry[kind];');
	out.line('if (!entry) continue;');
	out.line('if (entry.values && entry.values.includes(v)) return entry.factory(v);');
	out.line('if (entry.pattern && entry.pattern.test(v)) return entry.factory(v);');
	out.dedent();
	out.line('}');
	// Fallback: identifier-like kinds (no pattern, no values)
	out.line('for (const kind of kinds) {');
	out.indent();
	out.line('const entry = _leafRegistry[kind];');
	out.line('if (entry && !entry.values && !entry.pattern) return entry.factory(v);');
	out.dedent();
	out.line('}');
	out.line('return undefined;');
	out.dedent();
	out.line('}');
	out.line();

	// Emit leaf group arrays (deduplicated)
	// Collect unique leaf kind sets from all resolvers and assign group IDs
	// This is deferred to the caller
}

// ---------------------------------------------------------------------------
// Shared resolver function emitter — formatted multi-line
// ---------------------------------------------------------------------------

function emitResolverFunction(
	out: CodeBuilder,
	name: string,
	resolved: ResolvedFieldTypes,
	supertypeKind: string | undefined,
	leafSet: Set<string>,
	leafValueMap: Map<string, string[]>,
	keywordKinds: Map<string, string>,
	allNodes: StructuralNode[],
	supertypeResolverNames: Map<string, string>,
	expandedSupertypes: ReadonlyMap<string, Set<string>>,
	branchNodeSet: Set<string>,
	grammar?: string,
): void {
	const { leafTypes, branchTypes, supertypes, anonTokens } = resolved;
	const returnType = resolverReturnType(resolved, supertypeKind);

	out.line(`function ${name}(v: unknown): ${returnType};`);
	out.line(`function ${name}(v: unknown) {`);
	out.indent();

	// Undefined passthrough (optional fields)
	out.line('if (v === undefined) return undefined;');
	// NodeData passthrough
	out.line('if (isNodeData(v)) return v;');

	// Scalar widening (boolean → boolean_literal, number → int/float)
	const hasScalarTypes = leafTypes.includes('boolean_literal') || leafTypes.includes('integer_literal') || leafTypes.includes('float_literal');
	if (hasScalarTypes) {
		out.line('{ const s = _resolveScalar(v); if (s !== undefined) return s; }');
	}

	// String → leaf dispatch
	const leafKindsList = JSON.stringify(leafTypes);
	if (leafTypes.length > 0 || anonTokens.length > 0) {
		if (anonTokens.length > 0) {
			const tokenSet = anonTokens.map(t => `'${escapeString(t)}'`).join(', ');
			out.line(`if (typeof v === 'string') {`);
			out.indent();
			out.line(`if ([${tokenSet}].includes(v)) return { type: v, text: v };`);
			out.line(`const leaf = _resolveLeafString(v, ${leafKindsList}); if (leaf !== undefined) return leaf;`);
			out.line("throw new Error('Cannot resolve string value: no leaf types accepted for this field');");
			out.dedent();
			out.line('}');
		} else if (leafTypes.length > 0) {
			out.line(`if (typeof v === 'string') { const leaf = _resolveLeafString(v, ${leafKindsList}); if (leaf !== undefined) return leaf; }`);
		}
	}

	// Array resolution
	const allBranch = branchTypes.length + supertypes.length;
	if (allBranch > 0) {
		if (allBranch === 1 && branchTypes.length === 1) {
			out.line(`if (Array.isArray(v)) return _resolveByKind('${branchTypes[0]!}', v);`);
		} else if (allBranch === 1 && supertypes.length === 1) {
			const resolverFn = supertypeResolverNames.get(supertypes[0]!)!;
			out.line(`if (Array.isArray(v)) return ${resolverFn}(v);`);
		} else {
			out.line("if (Array.isArray(v)) throw new Error('Array value with ambiguous branch types — use {kind} to disambiguate');");
		}
	}

	// Object resolution
	out.line(`if (typeof v === 'object' && v !== null) {`);
	out.indent();
	emitObjectResolveFormatted(out, 'v', branchTypes, supertypes, supertypeResolverNames, expandedSupertypes, branchNodeSet);
	out.dedent();
	out.line('}');

	out.line("throw new Error(`Cannot resolve .from() value: got ${typeof v}`);");
	out.dedent();
	out.line('}');
	out.line();
}

// ---------------------------------------------------------------------------
// String resolution — formatted multi-line
// ---------------------------------------------------------------------------

function emitStringResolveFormatted(
	out: CodeBuilder,
	v: string,
	leafTypes: string[],
	anonTokens: string[],
	_leafSet: Set<string>,
	leafValueMap: Map<string, string[]>,
	keywordKinds: Map<string, string>,
	grammar?: string,
): void {
	const callLeaf = (kind: string, textVar: string) => {
		if (keywordKinds.has(kind)) {
			const expectedText = keywordKinds.get(kind)!;
			return `(${textVar} === '${escapeString(expectedText)}' ? ${toRawFactoryName(kind)}() : (() => { throw new Error(\`Expected '${escapeString(expectedText)}' for ${kind}, got '\${${textVar}}'\`); })())`;
		}
		return `${toRawFactoryName(kind)}(${textVar})`;
	};

	if (leafTypes.length === 1) {
		out.line(`return ${callLeaf(leafTypes[0]!, v)};`);
		return;
	}

	if (leafTypes.length > 1) {
		for (const lt of leafTypes) {
			const vals = leafValueMap.get(lt);
			if (vals && vals.length > 0) {
				const valSet = vals.map(val => `'${escapeString(val)}'`).join(', ');
				out.line(`if ([${valSet}].includes(${v})) return ${callLeaf(lt, v)};`);
			}
		}
	}

	if (anonTokens.length > 0) {
		const tokenSet = anonTokens.map(t => `'${escapeString(t)}'`).join(', ');
		out.line(`if ([${tokenSet}].includes(${v})) return { type: ${v}, text: ${v} };`);
	}

	if (leafTypes.length > 1 && grammar) {
		const identKinds = new Set(['identifier', 'type_identifier', 'field_identifier', 'shorthand_field_identifier']);

		for (const lt of leafTypes) {
			if (identKinds.has(lt)) continue;
			const vals = leafValueMap.get(lt);
			if (vals && vals.length > 0) continue;
			const pattern = extractLeafPattern(grammar, lt);
			if (pattern && !pattern.includes('//') && !pattern.includes('/*') && !pattern.includes('\\x')) {
				try {
					const flags = pattern.includes('\\p{') ? 'u' : '';
					new RegExp(`^${pattern}$`, flags);
					out.line(`if (/^${pattern.replace(/\//g, '\\/').replace(/`/g, '\\`')}$/${flags}.test(${v})) return ${callLeaf(lt, v)};`);
				} catch {
					// Pattern not safe for JS — skip
				}
			}
		}
	}

	const hasTypeIdent = leafTypes.includes('type_identifier');
	const hasIdent = leafTypes.includes('identifier');
	if (hasTypeIdent && hasIdent) {
		out.line(`return ${callLeaf('type_identifier', v)};`);
		return;
	}

	const identPriority = ['identifier', 'type_identifier', 'field_identifier', 'shorthand_field_identifier'];
	for (const ik of identPriority) {
		if (leafTypes.includes(ik)) {
			out.line(`return ${callLeaf(ik, v)};`);
			return;
		}
	}

	if (leafTypes.length > 0 && grammar) {
		const noPatternKind = leafTypes.find(lt => !extractLeafPattern(grammar, lt));
		if (noPatternKind) {
			out.line(`return ${callLeaf(noPatternKind, v)};`);
			return;
		}
	}
	if (leafTypes.length > 0) {
		out.line(`return ${callLeaf(leafTypes[0]!, v)};`);
		return;
	}

	out.line("throw new Error('Cannot resolve string value: no leaf types accepted for this field');");
}

// ---------------------------------------------------------------------------
// Hidden SEQ field resolver emitter — shared field groups
// ---------------------------------------------------------------------------

function emitHiddenSeqFieldResolver(
	out: CodeBuilder,
	funcName: string,
	info: HiddenSeqInfo,
	allNodes: StructuralNode[],
	leafSet: Set<string>,
	branchNodeSet: Set<string>,
	supertypeSet: Set<string>,
	keywordKinds: Map<string, string>,
	resolverRegistry: Map<string, { name: string; resolved: ResolvedFieldTypes; supertypeKind?: string }>,
	supertypeResolverNames: Map<string, string>,
	ctx: ProjectionContext,
): void {
	// Find a parent node to get field models (all parents share the same fields)
	const parentNode = allNodes.find(n => info.parents.includes(n.kind));
	if (!parentNode) return;
	const allFields = fieldsOf(parentNode);

	// Collect the fields that belong to this hidden SEQ
	const seqFieldNames = new Set(info.fieldNames.map(f => toFieldName(f)));
	const seqFields = allFields.filter(f => seqFieldNames.has(f.propertyName ?? toFieldName(f.name)));
	if (seqFields.length === 0) return;

	// Build typed return type from the SEQ fields
	const returnTypeMembers: string[] = [];
	for (const field of seqFields) {
		const configKey = field.propertyName ?? toFieldName(field.name);
		const fieldProj = projectKinds(field.kinds, ctx);
		const retType = resolverReturnType(resolveFieldTypes(fieldProj, leafSet, branchNodeSet, supertypeSet));
		const opt = field.required ? '' : '?';
		if (field.multiple) {
			returnTypeMembers.push(`${configKey}${opt}: (${retType})[]`);
		} else {
			returnTypeMembers.push(`${configKey}${opt}: ${retType}`);
		}
	}
	const returnType = `{ ${returnTypeMembers.join('; ')} }`;

	out.line(`/** Shared field resolver for hidden rule \`${info.ruleName}\` (used by ${info.parents.length} nodes). */`);
	out.line(`function ${funcName}(`);
	out.indent();
	out.line('obj: Record<string, unknown>,');
	out.dedent();
	out.line(`): ${returnType} {`);
	out.indent();
	out.line('return {');
	out.indent();

	for (const field of seqFields) {
		const configKey = field.propertyName ?? toFieldName(field.name);
		const inputKey = field.name;
		const fieldProj = projectKinds(field.kinds, ctx);
		const resolverCall = getResolverExpression(fieldProj, leafSet, branchNodeSet, supertypeSet, keywordKinds, resolverRegistry, supertypeResolverNames);

		if (field.multiple) {
			const toArr = `(Array.isArray(obj.${inputKey}) ? obj.${inputKey} : [obj.${inputKey}])`;
			if (field.required) {
				out.line(`${configKey}: obj.${inputKey} !== undefined ? (${toArr}).map(${resolverCall}) : [],`);
			} else {
				out.line(`${configKey}: obj.${inputKey} !== undefined ? (${toArr}).map(${resolverCall}) : undefined,`);
			}
		} else if (field.required) {
			out.line(`${configKey}: ${resolverCall}(obj.${inputKey}),`);
		} else {
			out.line(`${configKey}: ${resolverCall}(obj.${inputKey}),`);
		}
	}

	out.dedent();
	out.line('};');
	out.dedent();
	out.line('}');
	out.line();
}

// ---------------------------------------------------------------------------
// Object resolution — formatted multi-line
// ---------------------------------------------------------------------------

function emitObjectResolveFormatted(
	out: CodeBuilder,
	v: string,
	branchTypes: string[],
	supertypes: string[],
	supertypeResolverNames: Map<string, string>,
	expandedSupertypes: ReadonlyMap<string, Set<string>>,
	branchNodeSet: Set<string>,
): void {
	// Kind-based dispatch (explicit { kind: '...' } input)
	out.line(`if (hasKind(${v})) {`);
	out.indent();
	out.line(`const { kind: k, ...rest } = ${v};`);
	out.line('return _resolveByKind(k, rest);');
	out.dedent();
	out.line('}');

	// Object inference (no explicit kind)
	const allBranch = branchTypes.length + supertypes.length;
	if (allBranch === 1 && branchTypes.length === 1) {
		out.line(`return _resolveByKind('${branchTypes[0]!}', ${v});`);
	} else if (allBranch === 1 && supertypes.length === 1) {
		const resolverFn = supertypeResolverNames.get(supertypes[0]!)!;
		out.line(`return ${resolverFn}(${v});`);
	} else if (allBranch > 1) {
		// Multi-branch without { kind } — require discrimination
		const allConcreteBranches = [...branchTypes];
		for (const st of supertypes) {
			const subs = expandedSupertypes.get(st);
			if (subs) for (const s of subs) { if (branchNodeSet.has(s) && !allConcreteBranches.includes(s)) allConcreteBranches.push(s); }
		}
		out.line(`throw new Error(\`Multiple branch types possible for object with keys: \${Object.keys(${v}).join(', ')}. Candidates: ${allConcreteBranches.join(', ')}. Use { kind: '...' } to disambiguate.\`);`);
	} else {
		out.line("throw new Error('No branch types accepted for object value');");
	}
}

// ---------------------------------------------------------------------------
// Per-kind .from() function emitter
// ---------------------------------------------------------------------------

function emitFromFunction(
	out: CodeBuilder,
	node: StructuralNode,
	leafSet: Set<string>,
	leafValueMap: Map<string, string[]>,
	keywordKinds: Map<string, string>,
	allNodes: StructuralNode[],
	grammar: string | undefined,
	branchNodeSet: Set<string>,
	supertypeSet: Set<string>,
	resolverRegistry: Map<string, { name: string; resolved: ResolvedFieldTypes }>,
	supertypeResolverNames: Map<string, string>,
	ctx: ProjectionContext,
	sharedFieldGroups: Map<string, { funcName: string; fieldNames: Set<string> }[]>,
): void {
	const typeName = toTypeName(node.kind);
	const factoryName = toRawFactoryName(node.kind);
	const camelFactoryName = toFactoryName(node.kind);
	const fields = fieldsOf(node);

	const exportName = `${camelFactoryName}From`;
	const hasChildren = node.children != null;

	// Detect children-only: no fields, single non-tuple child slot with projectable types
	const isChildrenOnly = fields.length === 0 && hasChildren && !isTupleChildren(node.children!);
	let childrenOnlyInfo: { slot: { kinds: readonly { kind: string }[]; multiple: boolean; required: boolean }; slotName: string; resolver: string } | undefined;
	if (isChildrenOnly) {
		const slot = Array.isArray(node.children!) ? node.children![0]! : node.children!;
		const slotName = childSlotNames(node.children!, ctx)[0]!;
		const slotProj = projectKinds(slot.kinds, ctx);
		if (slotProj.collapsedTypes.length > 0) {
			const resolver = getResolverExpression(slotProj, leafSet, branchNodeSet, supertypeSet, keywordKinds, resolverRegistry, supertypeResolverNames);
			childrenOnlyInfo = { slot, slotName, resolver };
		}
	}

	if (childrenOnlyInfo) {
		// Children-only from function — rest params for multiple, direct param for single
		const { slot, resolver } = childrenOnlyInfo;
		const actualSlot = Array.isArray(node.children!) ? node.children![0]! : node.children!;
		const slotProj = projectKinds(actualSlot.kinds, ctx);
		const childType = slotProj.collapsedTypes.join(' | ');
		if (slot.multiple) {
			out.line(`export function ${exportName}(input: RuntimeNodeOf<${typeName}>): ReturnType<typeof ${factoryName}>;`);
			out.line(`export function ${exportName}(...children: ${typeName}FromInput[]): ReturnType<typeof ${factoryName}>;`);
			out.line(`export function ${exportName}(...args: (RuntimeNodeOf<${typeName}> | ${typeName}FromInput)[]) {`);
			out.indent();
			out.line(`if (args.length === 1 && isNodeData(args[0]) && args[0].type === '${node.kind}') {`);
			out.indent();
			out.line(`return ${factoryName}(...(args[0].children ?? []) as (${childType})[]);`);
			out.dedent();
			out.line('}');
			out.line(`return ${factoryName}(...args.map(v => ${resolver}(v)) as (${childType})[]);`);
		} else {
			out.line(`export function ${exportName}(input: RuntimeNodeOf<${typeName}>): ReturnType<typeof ${factoryName}>;`);
			out.line(`export function ${exportName}(child${slot.required ? '' : '?'}: ${typeName}FromInput): ReturnType<typeof ${factoryName}>;`);
			out.line(`export function ${exportName}(arg?: RuntimeNodeOf<${typeName}> | ${typeName}FromInput) {`);
			out.indent();
			out.line(`if (isNodeData(arg) && arg.type === '${node.kind}') {`);
			out.indent();
			out.line(`return ${factoryName}(arg.children?.[0] as ${childType});`);
			out.dedent();
			out.line('}');
			out.line(`return ${factoryName}(${resolver}(arg) as ${childType});`);
		}
		out.dedent();
		out.line('}');
	} else if (node.variants && node.variants.length > 1 && fields.length > 0) {
		// Multi-variant base from: extract fields from NodeData, pass FromInput to dispatcher.
		// Base from for multi-variant: extract only fields common to ALL variants,
		// then delegate to factory dispatcher which narrows to the right variant.
		const modelVariants = node.variants!;
		const commonFields = fields.filter(f =>
			modelVariants.every(v => v.fields.has(f.name))
		);

		out.line(`export function ${exportName}(input: RuntimeNodeOf<${typeName}> | ${typeName}FromInput) {`);
		out.indent();
		out.line(`if (isNodeData<'${node.kind}'>(input)) {`);
		out.indent();
		out.line(`return ${factoryName}({`);
		out.indent();
		// Spread all fields with camelCase key conversion — handles variant-specific fields
		// that may or may not exist on the union type
		const fieldsRef = commonFields.length === fields.length ? 'input.fields' : "('fields' in input ? input.fields : undefined)";
		out.line(`...Object.fromEntries(Object.entries(${fieldsRef} ?? {}).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()), v])),`);
		if (hasChildren) {
			const fieldCoveredKinds = new Set<string>();
			for (const f of fields) for (const k of f.kinds) fieldCoveredKinds.add(k.kind);
			const slotNames = childSlotNames(node.children!, ctx);
			if (!isTupleChildren(node.children!)) {
				const slot = Array.isArray(node.children!) ? node.children![0]! : node.children!;
				const allCovered = slot.kinds.every((k: { kind: string }) => fieldCoveredKinds.has(k.kind));
				if (!allCovered) {
					if (slot.multiple) {
						out.line(`${slotNames[0]!}: input.children,`);
					} else {
						out.line(`${slotNames[0]!}: input.children?.[0],`);
					}
				}
			}
		}
		out.dedent();
		out.line(`} as ${typeName}Config);`);
		out.dedent();
		out.line('}');
		// FromInput path: convert snake_case keys to camelCase for factory dispatcher.
		// Use Record<string, unknown> intermediate to bridge Object.fromEntries index signature.
		out.line(`const mapped: Record<string, unknown> = Object.fromEntries(Object.entries(input).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()), v]));`);
		out.line(`return ${factoryName}(mapped as ${typeName}Config);`);
		out.dedent();
		out.line('}');
	} else {
		// Standard from function — config object (single variant or no variants)
		out.line(`export function ${exportName}(input: RuntimeNodeOf<${typeName}> | ${typeName}FromInput) {`);
		out.indent();

		// --- Path 1: NodeData → reconstruct via factory ---
		out.line(`if (isNodeData<'${node.kind}'>(input)) {`);
		out.indent();
		out.line(`return ${factoryName}({`);
		out.indent();
		for (const f of fields) {
			const camel = f.propertyName ?? toFieldName(f.name);
			out.line(`${camel}: input.fields?.${f.name},`);
		}
		if (hasChildren) {
			const fieldCoveredKinds = new Set<string>();
			if (node.modelType === 'branch') {
				for (const f of fields) for (const k of f.kinds) fieldCoveredKinds.add(k.kind);
			}
			const slotNames = childSlotNames(node.children!, ctx);
			if (!isTupleChildren(node.children!)) {
				const slot = Array.isArray(node.children!) ? node.children![0]! : node.children!;
				const allCovered = node.modelType === 'branch' && slot.kinds.every((k: { kind: string }) => fieldCoveredKinds.has(k.kind));
				if (!allCovered) {
					if (slot.multiple) {
						out.line(`${slotNames[0]!}: input.children,`);
					} else if (slot.required) {
						out.line(`${slotNames[0]!}: input.children[0]!,`);
					} else {
						out.line(`${slotNames[0]!}: input.children?.[0],`);
					}
				}
			}
		}
		out.dedent();
		out.line(`});`);
		out.dedent();
		out.line('}');

		// --- Path 2: FromInput → resolve ---
		if (hasChildren) {
			out.line(`const obj = (Array.isArray(input) ? { children: input } : input) as ${typeName}FromInput;`);
		} else {
			out.line(`const obj = input as ${typeName}FromInput;`);
		}

		// Build the config object with resolved fields
		const groups = sharedFieldGroups.get(node.kind) ?? [];
		const sharedFieldSet = new Set<string>();
		for (const g of groups) {
			for (const f of g.fieldNames) sharedFieldSet.add(f);
		}

		out.line(`return ${factoryName}({`);
		out.indent();

		for (const g of groups) {
			out.line(`...${g.funcName}(obj),`);
		}

		for (const field of fields) {
			const configKey = field.propertyName ?? toFieldName(field.name);
			const inputKey = field.name;
			if (sharedFieldSet.has(configKey)) continue;

			const fieldProj = projectKinds(field.kinds, ctx);
			const resolverCall = getResolverExpression(fieldProj, leafSet, branchNodeSet, supertypeSet, keywordKinds, resolverRegistry, supertypeResolverNames);

			if (field.multiple) {
				const toArr = `(Array.isArray(obj.${inputKey}) ? obj.${inputKey} : [obj.${inputKey}])`;
				if (field.required) {
					out.line(`${configKey}: obj.${inputKey} !== undefined ? (${toArr}).map(${resolverCall}) : [],`);
				} else {
					out.line(`${configKey}: obj.${inputKey} !== undefined ? (${toArr}).map(${resolverCall}) : undefined,`);
				}
			} else if (field.required) {
				out.line(`${configKey}: ${resolverCall}(obj.${inputKey}),`);
			} else {
				out.line(`${configKey}: ${resolverCall}(obj.${inputKey}),`);
			}
		}

		// Child slots
		if (hasChildren) {
			const fieldKeys = new Set(fields.map(f => f.propertyName ?? toFieldName(f.name)));
			const fromFieldCoveredKinds = new Set<string>();
			for (const f of fields) for (const k of f.kinds) fromFieldCoveredKinds.add(k.kind);
			const slotNames = childSlotNames(node.children!, ctx);
			eachChildSlot(node.children!, (slot, i) => {
				const propName = slotNames[i]!;
				if (fieldKeys.has(propName)) return;
				if (slot.kinds.every(k => fromFieldCoveredKinds.has(k.kind))) return;
				const slotProj = projectKinds(slot.kinds, ctx);
				if (slotProj.collapsedTypes.length === 0) return;
				const slotResolver = getResolverExpression(slotProj, leafSet, branchNodeSet, supertypeSet, keywordKinds, resolverRegistry, supertypeResolverNames);

				if (slot.multiple) {
					const toArr = `(Array.isArray(obj.${propName}) ? obj.${propName} : [obj.${propName}])`;
					if (slot.required) {
						out.line(`${propName}: obj.${propName} !== undefined ? (${toArr}).map(${slotResolver}) : [],`);
					} else {
						out.line(`${propName}: obj.${propName} !== undefined ? (${toArr}).map(${slotResolver}) : undefined,`);
					}
				} else if (slot.required) {
					out.line(`${propName}: ${slotResolver}(obj.${propName}),`);
				} else {
					out.line(`${propName}: ${slotResolver}(obj.${propName}),`);
				}
			});
		}

		out.dedent();
		out.line(`});`);
		out.dedent();
		out.line('}');
	}
}

// ---------------------------------------------------------------------------
// Variant-specific from function emitter
// ---------------------------------------------------------------------------

/**
 * Emit a from function scoped to a specific variant's fields.
 * Accepts RuntimeNodeOf<VariantType> | VariantFromInput, calls variant factory.
 */
function emitVariantFromFunction(
	out: CodeBuilder,
	node: StructuralNode,
	variant: import('../node-model.ts').StructuralVariant,
	leafSet: Set<string>,
	branchNodeSet: Set<string>,
	supertypeSet: Set<string>,
	keywordKinds: Map<string, string>,
	resolverRegistry: Map<string, { name: string; resolved: ResolvedFieldTypes }>,
	supertypeResolverNames: Map<string, string>,
	ctx: ProjectionContext,
	sharedFieldGroups: Map<string, { funcName: string; fieldNames: Set<string> }[]>,
): void {
	const typeName = toTypeName(node.kind);
	const variantTypeName = `${typeName}${toTypeName(variant.name)}`;
	const factoryName = `${toRawFactoryName(node.kind)}_${variant.name}_`;
	const camelFactoryName = `${toFactoryName(node.kind)}${toTypeName(variant.name)}`;
	const exportName = `${camelFactoryName}From`;

	const allFields = fieldsOf(node);
	const variantFieldNames = new Set(variant.fields.keys());
	const fields = allFields.filter(f => variantFieldNames.has(f.name));

	out.line(`export function ${exportName}(input: RuntimeNodeOf<${variantTypeName}> | ${variantTypeName}FromInput) {`);
	out.indent();

	const hasChildren = node.children != null;

	// Path 1: NodeData passthrough
	out.line(`if (isNodeData<'${node.kind}'>(input)) {`);
	out.indent();
	out.line(`return ${factoryName}({`);
	out.indent();
	for (const f of fields) {
		const camel = f.propertyName ?? toFieldName(f.name);
		out.line(`${camel}: input.fields?.${f.name},`);
	}
	if (hasChildren) {
		const fieldCoveredKinds = new Set<string>();
		for (const f of fields) for (const k of f.kinds) fieldCoveredKinds.add(k.kind);
		const slot = Array.isArray(node.children!) ? node.children![0]! : node.children!;
		const allCovered = !isTupleChildren(node.children!) && slot.kinds.every((k: { kind: string }) => fieldCoveredKinds.has(k.kind));
		if (!allCovered) {
			const slotNames2 = childSlotNames(node.children!, ctx);
			const slotName = slotNames2[0] ?? 'children';
			if (slot.multiple) {
				out.line(`${slotName}: input.children as ${variantTypeName}Config['${slotName}'],`);
			} else {
				out.line(`${slotName}: input.children?.[0] as ${variantTypeName}Config['${slotName}'],`);
			}
		}
	}
	out.dedent();
	out.line(`});`);
	out.dedent();
	out.line('}');

	// Path 2: FromInput resolve
	out.line(`const obj = input as ${variantTypeName}FromInput;`);
	out.line(`return ${factoryName}({`);
	out.indent();

	for (const field of fields) {
		const configKey = field.propertyName ?? toFieldName(field.name);
		const inputKey = field.name;
		const fieldProj = projectKinds(field.kinds, ctx);
		const resolverCall = getResolverExpression(fieldProj, leafSet, branchNodeSet, supertypeSet, keywordKinds, resolverRegistry, supertypeResolverNames);

		if (field.multiple) {
			const toArr = `(Array.isArray(obj.${inputKey}) ? obj.${inputKey} : [obj.${inputKey}])`;
			if (field.required) {
				out.line(`${configKey}: obj.${inputKey} !== undefined ? (${toArr}).map(${resolverCall}) : [],`);
			} else {
				out.line(`${configKey}: obj.${inputKey} !== undefined ? (${toArr}).map(${resolverCall}) : undefined,`);
			}
		} else if (field.required) {
			out.line(`${configKey}: ${resolverCall}(obj.${inputKey}),`);
		} else {
			out.line(`${configKey}: ${resolverCall}(obj.${inputKey}),`);
		}
	}

	// Children passthrough (when not field-covered)
	if (hasChildren) {
		const fieldCoveredKinds2 = new Set<string>();
		for (const f of fields) for (const k of f.kinds) fieldCoveredKinds2.add(k.kind);
		const slot2 = Array.isArray(node.children!) ? node.children![0]! : node.children!;
		const allCovered2 = !isTupleChildren(node.children!) && slot2.kinds.every((k: { kind: string }) => fieldCoveredKinds2.has(k.kind));
		if (!allCovered2) {
			const slotNames3 = childSlotNames(node.children!, ctx);
			const slotName2 = slotNames3[0] ?? 'children';
			if (slot2.multiple) {
				out.line(`${slotName2}: (obj as { ${slotName2}?: unknown }).${slotName2} as ${variantTypeName}Config['${slotName2}'],`);
			} else {
				out.line(`${slotName2}: (obj as { ${slotName2}?: unknown }).${slotName2} as ${variantTypeName}Config['${slotName2}'],`);
			}
		}
	}

	out.dedent();
	out.line(`});`);
	out.dedent();
	out.line('}');
}

// ---------------------------------------------------------------------------
// Resolver expression — returns the resolver function reference or inline arrow
// ---------------------------------------------------------------------------

/**
 * Get the resolver function reference for a field projection.
 * Returns either a named resolver reference or an inline arrow for simple cases.
 */
function getResolverExpression(
	proj: KindProjection,
	leafSet: Set<string>,
	branchNodeSet: Set<string>,
	supertypeSet: Set<string>,
	_keywordKinds: Map<string, string>,
	resolverRegistry: Map<string, { name: string; resolved: ResolvedFieldTypes }>,
	_supertypeResolverNames: Map<string, string>,
): string {
	const resolved = resolveFieldTypes(proj, leafSet, branchNodeSet, supertypeSet);
	const key = resolverKey(resolved);
	const entry = resolverRegistry.get(key);
	if (!entry) throw new Error(`No resolver for key: ${key}`);
	return entry.name;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function collectReferencedFactories(
	nodes: StructuralNode[],
	leafSet: Set<string>,
	leafValueMap: Map<string, string[]>,
	keywordKinds: Map<string, string>,
	ctx: ProjectionContext,
): Set<string> {
	const refs = new Set<string>();

	for (const node of nodes) {
		refs.add(toRawFactoryName(node.kind));
	}

	for (const node of nodes) {
		const fields = fieldsOf(node);
		for (const f of fields) {
			const proj = projectKinds(f.kinds, ctx);
			for (const t of proj.expandedAll) {
				if (leafSet.has(t)) {
					refs.add(toRawFactoryName(t));
				}
			}
		}
		if (node.children != null) {
			eachChildSlot(node.children, (slot) => {
				const childProj = projectKinds(slot.kinds, ctx);
				for (const t of childProj.expandedAll) {
					if (leafSet.has(t)) {
						refs.add(toRawFactoryName(t));
					}
				}
			});
		}
		if (leafSet.has('boolean_literal')) refs.add(toRawFactoryName('boolean_literal'));
		if (leafSet.has('integer_literal')) refs.add(toRawFactoryName('integer_literal'));
		if (leafSet.has('float_literal')) refs.add(toRawFactoryName('float_literal'));
	}

	// Collect factories referenced by supertype resolvers
	for (const [, concreteKinds] of ctx.expandedSupertypes) {
		for (const k of concreteKinds) {
			if (leafSet.has(k)) refs.add(toRawFactoryName(k));
		}
	}

	// All leaf kinds are referenced by _leafRegistry
	for (const k of leafSet) {
		refs.add(toRawFactoryName(k));
	}

	return refs;
}
