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

	// --- Phase 1: Register supertype resolvers with readable names ---
	const resolverRegistry = new Map<string, { name: string; resolved: ResolvedFieldTypes }>();
	// Map supertype kind → resolver name for delegation
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
			// Simple cases: single leaf, single branch, or single supertype — inlined at call site
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

	// --- Phase 2: Emit ---
	const lines: string[] = [];
	lines.push('// Auto-generated by @sittir/codegen — do not edit');
	lines.push('// .from() API — shared resolvers, immutable ergonomic setters');
	lines.push('');

	// Type-only imports
	const baseTypeImports = nodes.map(n => toTypeName(n.kind)).sort();
	const configTypeImports = nodes.map(n => toTypeName(n.kind) + 'Config').sort();
	const treeTypeImports = nodes.map(n => toTypeName(n.kind) + 'Tree').sort();
	lines.push(`import type { ${[...baseTypeImports, ...configTypeImports, ...treeTypeImports].join(', ')} } from './types.js';`);
	lines.push("import { isNodeData, isTreeNode, _inferBranch } from './utils.js';");
	lines.push('');

	// Import factory functions
	const referencedFactories = collectReferencedFactories(nodes, leafSet, leafValueMap, keywordKinds, ctx);
	if (referencedFactories.size > 0) {
		const imports = [...referencedFactories].sort().join(', ');
		lines.push(`import { ${imports} } from './factories.js';`);
	}

	// Import wrap functions for SgNode dispatch
	const wrapImports = nodes.map(n => `wrap${toTypeName(n.kind)}`).sort().join(', ');
	lines.push(`import { ${wrapImports} } from './wrap.js';`);

	// Import FromInput types from types.ts
	const fromInputImports = nodes.map(n => `${toTypeName(n.kind)}FromInput`);
	lines.push(`import type { ${fromInputImports.join(', ')} } from './types.js';`);

	lines.push('');

	// _resolveByKind dispatch
	lines.push('function _resolveByKind(kind: string, rest: unknown): unknown {');
	lines.push('  switch (kind) {');
	for (const node of nodes) {
		const fromFn = `${toFactoryName(node.kind)}From`;
		lines.push(`    case '${node.kind}': return ${fromFn}(rest);`);
	}
	lines.push(`    default: throw new Error(\`Unknown kind for .from(): '\${kind}'\`);`);
	lines.push('  }');
	lines.push('}');
	lines.push('');

	// --- Emit shared resolver functions ---
	for (const [, { name, resolved }] of resolverRegistry) {
		lines.push(`function ${name}(v: unknown): unknown {`);
		const body = emitResolveBody('v', resolved, leafSet, leafValueMap, keywordKinds, nodes, supertypeResolverNames, ctx.expandedSupertypes, branchNodeSet, config.grammar);
		lines.push(`  ${body}`);
		lines.push('}');
		lines.push('');
	}

	// --- Per-kind .from() functions ---
	for (const node of nodes) {
		lines.push(emitFromFunction(node, leafSet, leafValueMap, keywordKinds, nodes, config.grammar, branchNodeSet, supertypeSet, resolverRegistry, supertypeResolverNames, ctx));
		lines.push('');
	}

	return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Per-kind .from() function emitter
// ---------------------------------------------------------------------------

function emitFromFunction(
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
): string {
	const typeName = toTypeName(node.kind);
	const factoryName = toRawFactoryName(node.kind);
	const camelFactoryName = toFactoryName(node.kind);
	const fields = fieldsOf(node);

	const lines: string[] = [];

	// Function overloads
	const exportName = `${camelFactoryName}From`;
	lines.push(`export function ${exportName}(input: ${typeName}Tree | ${typeName} | ${typeName}FromInput): ${typeName};`);
	lines.push(`export function ${exportName}(input: unknown): unknown;`);
	lines.push(`export function ${exportName}(input: unknown): unknown {`);

	// --- Path 1: TreeNode → wrap ---
	lines.push(`  if (isTreeNode(input)) return wrap${typeName}(input as ${typeName}Tree);`);

	// --- Path 2: NodeData → reconstruct with fluent API ---
	// NodeData has raw snake_case fields; remap to camelCase config and re-call factory
	lines.push(`  if (isNodeData(input)) {`);
	lines.push(`    const nd = input as { type: string; fields?: Record<string, unknown>; children?: unknown[] };`);
	lines.push(`    const f = nd.fields;`);
	lines.push(`    const c = nd.children;`);
	lines.push(`    return ${factoryName}({`);
	for (const f of fields) {
		const camel = f.propertyName ?? toFieldName(f.name);
		if (camel !== f.name) {
			lines.push(`      ${camel}: f?.['${f.name}'],`);
		} else {
			lines.push(`      ${camel}: f?.['${f.name}'],`);
		}
	}
	if (node.children != null) {
		const slotNames = childSlotNames(node.children, ctx);
		if (!isTupleChildren(node.children)) {
			lines.push(`      ${slotNames[0]!}: c,`);
		}
	}
	lines.push(`    } as unknown as ${typeName}Config);`);
	lines.push(`  }`);

	// --- Path 3: FromInput → resolve ---
	const hasChildren = node.children != null;
	if (hasChildren) {
		lines.push(`  const obj = (Array.isArray(input) ? { children: input } : input) as Record<string, unknown>;`);
	} else {
		lines.push(`  const obj = input as Record<string, unknown>;`);
	}
	lines.push(`  const resolved: Record<string, unknown> = {};`);
	for (const field of fields) {
		const camel = field.propertyName ?? toFieldName(field.name);
		lines.push(`  if (obj['${camel}'] !== undefined) {`);
		const fieldProj = projectKinds(field.kinds, ctx);
		const resolveCall = emitResolveCall(fieldProj, `obj['${camel}']`, leafSet, branchNodeSet, supertypeSet, keywordKinds, resolverRegistry, supertypeResolverNames);
		if (field.multiple) {
			lines.push(`    const raw = obj['${camel}'];`);
			lines.push(`    const arr = Array.isArray(raw) ? raw : [raw];`);
			lines.push(`    resolved['${camel}'] = arr.map((v: unknown) => ${resolveCall.replace(/obj\['\w+'\]/g, 'v')});`);
		} else {
			lines.push(`    resolved['${camel}'] = ${resolveCall};`);
		}
		if (field.multiple && field.required) {
			lines.push(`  } else {`);
			lines.push(`    resolved['${camel}'] = [];`);
		}
		lines.push(`  }`);
	}
	if (hasChildren) {
		const fieldKeys = new Set(fields.map(f => f.propertyName ?? toFieldName(f.name)));
		const slotNames = childSlotNames(node.children!, ctx);
		eachChildSlot(node.children!, (slot, i) => {
			const propName = slotNames[i]!;
			if (fieldKeys.has(propName)) return; // already handled as field
			const slotProj = projectKinds(slot.kinds, ctx);
			lines.push(`  if (obj.${propName} !== undefined) {`);
			if (slot.multiple) {
				lines.push(`    const arr = Array.isArray(obj.${propName}) ? obj.${propName} : [obj.${propName}];`);
				const slotResolve = emitResolveCall(slotProj, 'v', leafSet, branchNodeSet, supertypeSet, keywordKinds, resolverRegistry, supertypeResolverNames);
				lines.push(`    resolved.${propName} = arr.map((v: unknown) => ${slotResolve});`);
			} else {
				const slotResolve = emitResolveCall(slotProj, `obj.${propName}`, leafSet, branchNodeSet, supertypeSet, keywordKinds, resolverRegistry, supertypeResolverNames);
				lines.push(`    resolved.${propName} = ${slotResolve};`);
			}
			if (slot.required && slot.multiple) {
				lines.push(`  } else {`);
				lines.push(`    resolved.${propName} = [];`);
			}
			lines.push(`  }`);
		});
	}
	lines.push(`  return ${factoryName}(resolved as ${typeName}Config);`);
	lines.push(`}`);

	return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Resolve call emitter — uses named resolver or inline for simple cases
// ---------------------------------------------------------------------------

function emitResolveCall(
	proj: KindProjection,
	varName: string,
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

	// If there's a named resolver, use it
	if (entry) {
		return `${entry.name}(${varName})`;
	}

	// Simple cases — inline
	if (resolved.leafTypes.length === 1 && resolved.branchTypes.length === 0 && resolved.supertypes.length === 0 && resolved.anonTokens.length === 0) {
		const lt = resolved.leafTypes[0]!;
		if (keywordKinds.has(lt)) {
			const text = keywordKinds.get(lt)!;
			return `(isNodeData(${varName}) ? ${varName} : typeof ${varName} === 'string' && ${varName} === '${escapeString(text)}' ? ${toRawFactoryName(lt)}() : ${varName})`;
		}
		const factory = toRawFactoryName(lt);
		return `(isNodeData(${varName}) ? ${varName} : typeof ${varName} === 'string' || typeof ${varName} === 'number' || typeof ${varName} === 'boolean' ? ${factory}(''+${varName}) : ${varName})`;
	}

	if (resolved.branchTypes.length === 1 && resolved.leafTypes.length === 0 && resolved.supertypes.length === 0 && resolved.anonTokens.length === 0) {
		const factory = toRawFactoryName(resolved.branchTypes[0]!);
		const fromFn = `${toFactoryName(resolved.branchTypes[0]!)}From`;
		return `(isNodeData(${varName}) ? ${varName} : Array.isArray(${varName}) ? ${fromFn}(${varName}) : typeof ${varName} === 'object' ? ${fromFn}(${varName}) : ${varName})`;
	}

	// Single supertype — delegate to its resolver
	if (resolved.supertypes.length === 1 && resolved.leafTypes.length === 0 && resolved.branchTypes.length === 0 && resolved.anonTokens.length === 0) {
		const resolverFn = supertypeResolverNames.get(resolved.supertypes[0]!);
		if (resolverFn) return `${resolverFn}(${varName})`;
	}

	// Shouldn't happen — complex cases always get a named resolver
	return `${resolverName(key)}(${varName})`;
}

// ---------------------------------------------------------------------------
// Resolve body emitter — generates the body of a resolver function
// ---------------------------------------------------------------------------

function emitResolveBody(
	v: string,
	resolved: ResolvedFieldTypes,
	leafSet: Set<string>,
	leafValueMap: Map<string, string[]>,
	keywordKinds: Map<string, string>,
	allNodes: StructuralNode[],
	supertypeResolverNames: Map<string, string>,
	expandedSupertypes: ReadonlyMap<string, Set<string>>,
	branchNodeSet: Set<string>,
	grammar?: string,
): string {
	const { leafTypes, branchTypes, supertypes, anonTokens } = resolved;
	const parts: string[] = [];

	parts.push(`if(isNodeData(${v}))return ${v}`);

	if (leafTypes.includes('boolean_literal') || (leafTypes.length === 0 && leafSet.has('boolean_literal'))) {
		parts.push(`if(typeof ${v}==='boolean')return ${toRawFactoryName('boolean_literal')}(${v}?'true':'false')`);
	}

	const hasInt = leafTypes.includes('integer_literal') || (leafTypes.length === 0 && leafSet.has('integer_literal'));
	const hasFloat = leafTypes.includes('float_literal') || (leafTypes.length === 0 && leafSet.has('float_literal'));
	if (hasInt && hasFloat) {
		parts.push(`if(typeof ${v}==='number')return Number.isInteger(${v})?${toRawFactoryName('integer_literal')}(\`\${${v}}\`):${toRawFactoryName('float_literal')}(\`\${${v}}\`)`);
	} else if (hasInt) {
		parts.push(`if(typeof ${v}==='number')return ${toRawFactoryName('integer_literal')}(\`\${${v}}\`)`);
	} else if (hasFloat) {
		parts.push(`if(typeof ${v}==='number')return ${toRawFactoryName('float_literal')}(\`\${${v}}\`)`);
	}

	parts.push(`if(typeof ${v}==='string'){${emitStringResolve(v, leafTypes, anonTokens, leafSet, leafValueMap, keywordKinds, grammar)}}`);

	const allBranch = branchTypes.length + supertypes.length;
	if (allBranch > 0) {
		if (allBranch === 1 && branchTypes.length === 1) {
			const fromFn = `${toFactoryName(branchTypes[0]!)}From`;
			parts.push(`if(Array.isArray(${v}))return ${fromFn}(${v})`);
		} else if (allBranch === 1 && supertypes.length === 1) {
			const resolverFn = supertypeResolverNames.get(supertypes[0]!)!;
			parts.push(`if(Array.isArray(${v}))return ${resolverFn}(${v})`);
		} else {
			parts.push(`if(Array.isArray(${v}))throw new Error('Array value with ambiguous branch types — use {kind} to disambiguate')`);
		}
	}

	// Object resolution: direct branch dispatch + supertype fallback
	parts.push(`if(typeof ${v}==='object'&&${v}!==null){${emitObjectResolve(v, branchTypes, supertypes, supertypeResolverNames, expandedSupertypes, branchNodeSet)}}`);
	parts.push(`throw new Error(\`Cannot resolve .from() value: got \${typeof ${v}}\`)`);

	return parts.join(';');
}

function emitStringResolve(
	v: string,
	leafTypes: string[],
	anonTokens: string[],
	_leafSet: Set<string>,
	leafValueMap: Map<string, string[]>,
	keywordKinds: Map<string, string>,
	grammar?: string,
): string {
	const parts: string[] = [];

	const callLeaf = (kind: string, textVar: string) => {
		if (keywordKinds.has(kind)) {
			const expectedText = keywordKinds.get(kind)!;
			return `(${textVar}==='${escapeString(expectedText)}'?${toRawFactoryName(kind)}():(()=>{throw new Error(\`Expected '${escapeString(expectedText)}' for ${kind}, got '\${${textVar}}'\`)})())`;
		}
		return `${toRawFactoryName(kind)}(${textVar})`;
	};

	if (leafTypes.length === 1) {
		parts.push(`return ${callLeaf(leafTypes[0]!, v)};`);
		return parts.join('');
	}

	if (leafTypes.length > 1) {
		for (const lt of leafTypes) {
			const vals = leafValueMap.get(lt);
			if (vals && vals.length > 0) {
				const valSet = vals.map(val => `'${escapeString(val)}'`).join(',');
				parts.push(`if([${valSet}].includes(${v}))return ${callLeaf(lt, v)};`);
			}
		}
	}

	if (anonTokens.length > 0) {
		const tokenSet = anonTokens.map(t => `'${escapeString(t)}'`).join(',');
		parts.push(`if([${tokenSet}].includes(${v}))return{type:${v},text:${v}};`);
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
					parts.push(`if(/^${pattern.replace(/\//g, '\\/').replace(/`/g, '\\`')}$/${flags}.test(${v}))return ${callLeaf(lt, v)};`);
				} catch {
					// Pattern not safe for JS — skip
				}
			}
		}
	}

	const hasTypeIdent = leafTypes.includes('type_identifier');
	const hasIdent = leafTypes.includes('identifier');
	if (hasTypeIdent && hasIdent) {
		parts.push(`return ${callLeaf('type_identifier', v)};`);
		return parts.join('');
	}

	const identPriority = ['identifier', 'type_identifier', 'field_identifier', 'shorthand_field_identifier'];
	for (const ik of identPriority) {
		if (leafTypes.includes(ik)) {
			parts.push(`return ${callLeaf(ik, v)};`);
			return parts.join('');
		}
	}

	if (leafTypes.length > 0 && grammar) {
		const noPatternKind = leafTypes.find(lt => !extractLeafPattern(grammar, lt));
		if (noPatternKind) {
			parts.push(`return ${callLeaf(noPatternKind, v)};`);
			return parts.join('');
		}
	}
	if (leafTypes.length > 0) {
		parts.push(`return ${callLeaf(leafTypes[0]!, v)};`);
		return parts.join('');
	}

	parts.push(`throw new Error(\`Cannot resolve string value: no leaf types accepted for this field\`);`);
	return parts.join('');
}

function emitObjectResolve(
	v: string,
	branchTypes: string[],
	supertypes: string[],
	supertypeResolverNames: Map<string, string>,
	expandedSupertypes: ReadonlyMap<string, Set<string>>,
	branchNodeSet: Set<string>,
): string {
	const parts: string[] = [];

	// Kind-based dispatch (explicit { kind: '...' } input)
	parts.push(`if('kind' in ${v}&&typeof ${v}.kind==='string'){`);
	parts.push(`const{kind:k,...rest}=${v};`);
	if (branchTypes.length > 0) {
		parts.push(`switch(k){`);
		for (const bt of branchTypes) {
			parts.push(`case '${bt}':return ${toFactoryName(bt)}From(rest);`);
		}
		parts.push(`}`);
	}
	parts.push(`return _resolveByKind(k,rest);`);
	parts.push(`}`);

	// Object inference (no explicit kind)
	const allBranch = branchTypes.length + supertypes.length;
	if (allBranch === 1 && branchTypes.length === 1) {
		parts.push(`return ${toFactoryName(branchTypes[0]!)}From(${v});`);
	} else if (allBranch === 1 && supertypes.length === 1) {
		const resolverFn = supertypeResolverNames.get(supertypes[0]!)!;
		parts.push(`return ${resolverFn}(${v});`);
	} else if (allBranch > 1) {
		// Expand supertypes to concrete branch types for inference
		const allConcreteBranches = [...branchTypes];
		for (const st of supertypes) {
			const subs = expandedSupertypes.get(st);
			if (subs) for (const s of subs) { if (branchNodeSet.has(s) && !allConcreteBranches.includes(s)) allConcreteBranches.push(s); }
		}
		parts.push(`const _k=_inferBranch(${v},${JSON.stringify(allConcreteBranches)});`);
		parts.push(`if(_k)return _resolveByKind(_k,${v});`);
		parts.push(`throw new Error(\`Cannot infer kind for object with keys: \${Object.keys(${v}).join(', ')}. Candidates: ${allConcreteBranches.join(', ')}. Use { kind: '...' } to disambiguate.\`);`);
	} else {
		parts.push(`throw new Error('No branch types accepted for object value');`);
	}

	return parts.join('');
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
