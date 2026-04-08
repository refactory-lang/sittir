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

/** Create a short deterministic name from a key for the generated function. */
function resolverName(key: string): string {
	// Simple hash — djb2
	let hash = 5381;
	for (let i = 0; i < key.length; i++) {
		hash = ((hash << 5) + hash + key.charCodeAt(i)) | 0;
	}
	return `_r${(hash >>> 0).toString(36)}`;
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
	const resolverRegistry = new Map<string, { name: string; resolved: ResolvedFieldTypes }>();
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
			resolverRegistry.set(key, { name, resolved });
		}
	}

	// --- Phase 2: Collect remaining unique resolver signatures from fields ---
	function getOrCreateResolver(proj: KindProjection): { name: string; resolved: ResolvedFieldTypes; key: string } {
		const resolved = resolveFieldTypes(proj, leafSet, branchNodeSet, supertypeSet);
		const key = resolverKey(resolved);

		if (!resolverRegistry.has(key)) {
			const totalNonAnon = resolved.leafTypes.length + resolved.branchTypes.length + resolved.supertypes.length;
			const isSimple = totalNonAnon === 1 && resolved.anonTokens.length === 0;
			if (!isSimple) {
				resolverRegistry.set(key, { name: resolverName(key), resolved });
			}
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

	// --- Phase 3: Emit ---
	const out = new CodeBuilder();
	out.line('// Auto-generated by @sittir/codegen — do not edit');
	out.line('// .from() API — shared resolvers, immutable ergonomic setters');
	out.line();

	// Type-only imports
	const baseTypeImports = nodes.map(n => toTypeName(n.kind)).sort();
	const configTypeImports = nodes.map(n => toTypeName(n.kind) + 'Config').sort();
	out.line(`import type { ${[...baseTypeImports, ...configTypeImports].join(', ')} } from './types.js';`);
	out.line("import { isNodeData, _inferBranch, hasKind, resolveField } from './utils.js';");
	out.line();

	// Import factory functions
	const referencedFactories = collectReferencedFactories(nodes, leafSet, leafValueMap, keywordKinds, ctx);
	if (referencedFactories.size > 0) {
		const imports = [...referencedFactories].sort().join(', ');
		out.line(`import { ${imports} } from './factories.js';`);
	}

	// Import FromInput types from types.ts
	const fromInputImports = nodes.map(n => `${toTypeName(n.kind)}FromInput`);
	out.line(`import type { ${fromInputImports.join(', ')} } from './types.js';`);
	out.line();

	// _fromMap — kind → from function, used by all resolvers for kind dispatch
	out.line('/** @internal Map of kind string to .from() resolver function. */');
	out.line('export const _fromMap: Record<string, (input: object) => unknown> = {');
	out.indent();
	for (const node of nodes) {
		const fromFn = `${toFactoryName(node.kind)}From`;
		out.line(`'${node.kind}': ${fromFn},`);
	}
	out.dedent();
	out.line('};');
	out.line();

	out.line('function _resolveByKind(kind: string, rest: object): unknown {');
	out.indent();
	out.line('const fn = _fromMap[kind];');
	out.line("if (fn) return fn(rest);");
	out.line("throw new Error(`Unknown kind for .from(): '${kind}'`);");
	out.dedent();
	out.line('}');
	out.line();

	// --- Emit shared resolver functions ---
	for (const [, { name, resolved }] of resolverRegistry) {
		emitResolverFunction(out, name, resolved, leafSet, leafValueMap, keywordKinds, nodes, supertypeResolverNames, ctx.expandedSupertypes, branchNodeSet, config.grammar);
	}

	// --- Per-kind .from() functions ---
	for (const node of nodes) {
		emitFromFunction(out, node, leafSet, leafValueMap, keywordKinds, nodes, config.grammar, branchNodeSet, supertypeSet, resolverRegistry, supertypeResolverNames, ctx);
		out.line();
	}

	return out.toString();
}

// ---------------------------------------------------------------------------
// Shared resolver function emitter — formatted multi-line
// ---------------------------------------------------------------------------

function emitResolverFunction(
	out: CodeBuilder,
	name: string,
	resolved: ResolvedFieldTypes,
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

	out.line(`function ${name}(v: unknown): unknown {`);
	out.indent();

	// NodeData passthrough
	out.line('if (isNodeData(v)) return v;');

	// Boolean scalar
	if (leafTypes.includes('boolean_literal') || (leafTypes.length === 0 && leafSet.has('boolean_literal'))) {
		out.line(`if (typeof v === 'boolean') return ${toRawFactoryName('boolean_literal')}(v ? 'true' : 'false');`);
	}

	// Number scalars
	const hasInt = leafTypes.includes('integer_literal') || (leafTypes.length === 0 && leafSet.has('integer_literal'));
	const hasFloat = leafTypes.includes('float_literal') || (leafTypes.length === 0 && leafSet.has('float_literal'));
	if (hasInt && hasFloat) {
		out.line(`if (typeof v === 'number') {`);
		out.indent();
		out.line(`return Number.isInteger(v) ? ${toRawFactoryName('integer_literal')}(\`\${v}\`) : ${toRawFactoryName('float_literal')}(\`\${v}\`);`);
		out.dedent();
		out.line('}');
	} else if (hasInt) {
		out.line(`if (typeof v === 'number') return ${toRawFactoryName('integer_literal')}(\`\${v}\`);`);
	} else if (hasFloat) {
		out.line(`if (typeof v === 'number') return ${toRawFactoryName('float_literal')}(\`\${v}\`);`);
	}

	// String resolution
	out.line(`if (typeof v === 'string') {`);
	out.indent();
	emitStringResolveFormatted(out, 'v', leafTypes, anonTokens, leafSet, leafValueMap, keywordKinds, grammar);
	out.dedent();
	out.line('}');

	// Array resolution
	const allBranch = branchTypes.length + supertypes.length;
	if (allBranch > 0) {
		if (allBranch === 1 && branchTypes.length === 1) {
			const fromFn = `${toFactoryName(branchTypes[0]!)}From`;
			out.line(`if (Array.isArray(v)) return ${fromFn}(v);`);
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
		out.line(`return ${toFactoryName(branchTypes[0]!)}From(${v});`);
	} else if (allBranch === 1 && supertypes.length === 1) {
		const resolverFn = supertypeResolverNames.get(supertypes[0]!)!;
		out.line(`return ${resolverFn}(${v});`);
	} else if (allBranch > 1) {
		// Expand supertypes to concrete branch types for inference
		const allConcreteBranches = [...branchTypes];
		for (const st of supertypes) {
			const subs = expandedSupertypes.get(st);
			if (subs) for (const s of subs) { if (branchNodeSet.has(s) && !allConcreteBranches.includes(s)) allConcreteBranches.push(s); }
		}
		out.line(`const _k = _inferBranch(${v}, ${JSON.stringify(allConcreteBranches)});`);
		out.line(`if (_k) return _resolveByKind(_k, ${v});`);
		out.line(`throw new Error(\`Cannot infer kind for object with keys: \${Object.keys(${v}).join(', ')}. Candidates: ${allConcreteBranches.join(', ')}. Use { kind: '...' } to disambiguate.\`);`);
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
): void {
	const typeName = toTypeName(node.kind);
	const factoryName = toRawFactoryName(node.kind);
	const camelFactoryName = toFactoryName(node.kind);
	const fields = fieldsOf(node);

	const exportName = `${camelFactoryName}From`;

	out.line(`export function ${exportName}(input: ${typeName} | ${typeName}FromInput | object): ${typeName} {`);
	out.indent();

	// --- Path 1: NodeData → reconstruct via factory ---
	out.line('if (isNodeData(input)) {');
	out.indent();
	out.line(`return ${factoryName}({`);
	out.indent();
	for (const f of fields) {
		const camel = f.propertyName ?? toFieldName(f.name);
		out.line(`${camel}: input.fields?.['${f.name}'],`);
	}
	if (node.children != null) {
		const slotNames = childSlotNames(node.children, ctx);
		if (!isTupleChildren(node.children)) {
			out.line(`${slotNames[0]!}: (input as { children?: unknown }).children,`);
		}
	}
	out.dedent();
	out.line(`} as ${typeName}Config) as unknown as ${typeName};`);
	out.dedent();
	out.line('}');

	// --- Path 3: FromInput → resolve ---
	const hasChildren = node.children != null;
	if (hasChildren) {
		out.line('const obj = (Array.isArray(input) ? { children: input } : input) as Record<string, unknown>;');
	} else {
		out.line('const obj = input as Record<string, unknown>;');
	}

	// Build the config object with resolved fields
	out.line(`return ${factoryName}({`);
	out.indent();
	for (const field of fields) {
		const camel = field.propertyName ?? toFieldName(field.name);
		const fieldProj = projectKinds(field.kinds, ctx);
		const resolverCall = getResolverExpression(fieldProj, leafSet, branchNodeSet, supertypeSet, keywordKinds, resolverRegistry, supertypeResolverNames);

		if (field.multiple) {
			if (field.required) {
				out.line(`${camel}: obj['${camel}'] !== undefined ? resolveField(obj['${camel}'], ${resolverCall}) : [],`);
			} else {
				out.line(`${camel}: obj['${camel}'] !== undefined ? resolveField(obj['${camel}'], ${resolverCall}) : undefined,`);
			}
		} else if (field.required) {
			out.line(`${camel}: resolveField(obj['${camel}'], ${resolverCall}),`);
		} else {
			out.line(`${camel}: obj['${camel}'] !== undefined ? resolveField(obj['${camel}'], ${resolverCall}) : undefined,`);
		}
	}

	// Child slots
	if (hasChildren) {
		const fieldKeys = new Set(fields.map(f => f.propertyName ?? toFieldName(f.name)));
		const slotNames = childSlotNames(node.children!, ctx);
		eachChildSlot(node.children!, (slot, i) => {
			const propName = slotNames[i]!;
			if (fieldKeys.has(propName)) return;
			const slotProj = projectKinds(slot.kinds, ctx);
			if (slotProj.collapsedTypes.length === 0) return;
			const slotResolver = getResolverExpression(slotProj, leafSet, branchNodeSet, supertypeSet, keywordKinds, resolverRegistry, supertypeResolverNames);

			if (slot.multiple && slot.required) {
				out.line(`${propName}: obj['${propName}'] !== undefined ? resolveField(obj['${propName}'], ${slotResolver}) : [],`);
			} else if (slot.multiple) {
				out.line(`${propName}: obj['${propName}'] !== undefined ? resolveField(obj['${propName}'], ${slotResolver}) : undefined,`);
			} else {
				out.line(`${propName}: obj['${propName}'] !== undefined ? resolveField(obj['${propName}'], ${slotResolver}) : undefined,`);
			}
		});
	}

	out.dedent();
	out.line(`} as ${typeName}Config) as unknown as ${typeName};`);
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
	keywordKinds: Map<string, string>,
	resolverRegistry: Map<string, { name: string; resolved: ResolvedFieldTypes }>,
	supertypeResolverNames: Map<string, string>,
): string {
	const resolved = resolveFieldTypes(proj, leafSet, branchNodeSet, supertypeSet);
	const key = resolverKey(resolved);
	const entry = resolverRegistry.get(key);

	// Named resolver available — use it
	if (entry) {
		return entry.name;
	}

	// Simple cases — inline arrow
	if (resolved.leafTypes.length === 1 && resolved.branchTypes.length === 0 && resolved.supertypes.length === 0 && resolved.anonTokens.length === 0) {
		const lt = resolved.leafTypes[0]!;
		if (keywordKinds.has(lt)) {
			const text = keywordKinds.get(lt)!;
			return `(v: unknown) => (typeof v === 'string' && v === '${escapeString(text)}' ? ${toRawFactoryName(lt)}() : v)`;
		}
		const factory = toRawFactoryName(lt);
		return `(v: unknown) => (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? ${factory}('' + v) : v)`;
	}

	if (resolved.branchTypes.length === 1 && resolved.leafTypes.length === 0 && resolved.supertypes.length === 0 && resolved.anonTokens.length === 0) {
		const fromFn = `${toFactoryName(resolved.branchTypes[0]!)}From`;
		return `(v: unknown) => (typeof v === 'object' && v !== null ? ${fromFn}(v) : v)`;
	}

	// Single supertype — delegate to its resolver
	if (resolved.supertypes.length === 1 && resolved.leafTypes.length === 0 && resolved.branchTypes.length === 0 && resolved.anonTokens.length === 0) {
		const resolverFn = supertypeResolverNames.get(resolved.supertypes[0]!);
		if (resolverFn) return resolverFn;
	}

	// Shouldn't happen — complex cases always get a named resolver
	return resolverName(key);
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

	return refs;
}
