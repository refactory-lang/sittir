/**
 * Unified factory emitter.
 *
 * Factory functions are named by raw kind (function_item, not functionItem).
 * The ir namespace maps to camelCase for the developer API.
 *
 * Factories accept camelCase Config, store under raw field names in `fields`.
 * Fluent API: no-arg = getter (reads from fields), with-arg = setter (returns new node).
 */

import type { HydratedNodeModel, HydratedFieldModel } from '../node-model.ts';
import { isTupleChildren, eachChildSlot } from '../node-model.ts';
import { extractLeafPattern } from '../grammar-reader.ts';
import { toTypeName, toFactoryName, toFieldName, toParamName, toRawFactoryName } from '../naming.ts';
import { type StructuralNode, structuralNodes, fieldsOf, leafKindsOf, keywordKindsOf, leafValuesOf, keywordTokensOf, operatorTokensOf, escapeString, childSlotNames } from './utils.ts';
import { buildProjectionContext, projectKinds, type ProjectionContext } from './kind-projections.ts';

export interface EmitFactoriesConfig {
	grammar: string;
	nodes: HydratedNodeModel[];
}

/**
 * Emit a factory function for a single branch node kind.
 * Function name = raw kind (e.g. function_item).
 * Output has: type, fields (raw names), fluent getters/setters (camelCase), render/edit methods.
 */
export function emitFactory(config: {
	node: StructuralNode;
	leafKinds: string[];
	ctx: ProjectionContext;
}): string {
	const { node, leafKinds, ctx } = config;
	const leafSet = new Set(leafKinds);
	const typeName = toTypeName(node.kind);
	const internalName = toRawFactoryName(node.kind);

	const lines: string[] = [];

	// Factory function — accepts *Config (camelCase), return type inferred
	const hasChildren = node.children != null;

	// Skip child slots whose kinds don't project to any type (hidden rules without models)
	const skipSlots = new Set<number>();
	if (hasChildren) {
		eachChildSlot(node.children!, (slot, i) => {
			const proj = projectKinds(slot.kinds, ctx);
			if (proj.collapsedTypes.length === 0) skipSlots.add(i);
		});
	}

	const fields = fieldsOf(node);
	const hasFields = fields.length > 0;
	const hasRequiredFields = fields.some(f => f.required) || (hasChildren && childHasRequired(node.children!, skipSlots));

	// Detect children-only nodes: no fields, single non-skipped child slot
	const isChildrenOnly = !hasFields && hasChildren && !isTupleChildren(node.children!) && !skipSlots.has(0);
	let childrenOnlySlot: { slot: HydratedFieldModel; name: string; slotType: string } | undefined;
	if (isChildrenOnly) {
		const slot = Array.isArray(node.children!) ? node.children![0]! : node.children!;
		const name = childSlotNames(node.children!, ctx)[0]!;
		const slotProj = projectKinds(slot.kinds, ctx);
		const slotType = slotProj.collapsedTypes.join(' | ');
		// Only use rest-params if children kinds are NOT fully covered by fields
		const fieldCoveredKinds = new Set<string>();
		for (const f of fields) for (const k of f.kinds) fieldCoveredKinds.add(k.kind);
		const allCovered = slot.kinds.every((k: { kind: string }) => fieldCoveredKinds.has(k.kind));
		if (!allCovered && slotType) {
			childrenOnlySlot = { slot, name, slotType };
		}
	}

	if (childrenOnlySlot) {
		// Children-only: rest params for multiple, direct param for single
		const { slot, slotType } = childrenOnlySlot;
		if (slot.multiple) {
			// Rest param becomes the children array directly
			lines.push(`export function ${internalName}(`);
			lines.push(`  ...children: (${slotType})[]`);
			lines.push(`) {`);
		} else {
			const opt = slot.required ? '' : '?';
			lines.push(`export function ${internalName}(`);
			lines.push(`  child${opt}: ${slotType},`);
			lines.push(`) {`);
			lines.push(`  const children = child ? [child] : [];`);
		}
	} else {
		const opt = hasRequiredFields ? '' : '?';
		lines.push(`export function ${internalName}(`);
		lines.push(`  config${opt}: ConfigOf<${typeName}>,`);
		lines.push(`) {`);

		// Build fields object — raw names, values from camelCase config
		if (hasFields) {
			lines.push(`  const fields = {`);
			for (const f of fields) {
				const camel = f.propertyName ?? toFieldName(f.name);
				lines.push(`    ${f.name}: config${opt}.${camel},`);
			}
			lines.push(`  };`);
		}

		// Build children array from child slots in config
		if (hasChildren) {
			const slotNames = childSlotNames(node.children!, ctx);
			const isTuple = isTupleChildren(node.children!);
			if (!isTuple) {
				const fieldCoveredKinds = new Set<string>();
				for (const f of fields) for (const k of f.kinds) fieldCoveredKinds.add(k.kind);
				const slot = Array.isArray(node.children!) ? node.children![0]! : node.children!;
				const allCovered = slot.kinds.every((k: { kind: string }) => fieldCoveredKinds.has(k.kind));

				if (allCovered) {
					lines.push(`  const children: unknown[] = [];`);
				} else if (!skipSlots.has(0)) {
					const name = slotNames[0]!;
					if (slot.multiple) {
						lines.push(`  const children = config${opt}.${name} ?? [];`);
					} else {
						lines.push(`  const children = config${opt}.${name} ? [config${opt}.${name}] : [];`);
					}
				} else {
					lines.push(`  const children: unknown[] = [];`);
				}
			} else {
				const childExprs: string[] = [];
				eachChildSlot(node.children!, (slot, i) => {
					if (skipSlots.has(i)) return;
					const name = slotNames[i]!;
					if (slot.multiple) {
						childExprs.push(`...(config${opt}.${name} ?? [])`);
					} else {
						childExprs.push(`...(config${opt}.${name} ? [config${opt}.${name}] : [])`);
					}
				});
				lines.push(`  const children = [${childExprs.join(', ')}];`);
			}
		}
	}

	// Variant inference for nodes with multiple structural variants
	const modelVariants = node.variants;
	const hasMultipleVariants = modelVariants && modelVariants.length > 1;
	if (hasMultipleVariants && !childrenOnlySlot) {
		// Infer variant from which fields are present in config
		lines.push(`  // Variant inference from field presence`);
		for (let i = modelVariants.length - 1; i >= 0; i--) {
			const v = modelVariants[i]!;
			// Find a field unique to this variant (or detect token)
			const uniqueFields = [...v.fields.keys()].filter(f =>
				modelVariants.every((other, j) => j === i || !other.fields.has(f))
			);
			if (uniqueFields.length > 0 && hasFields) {
				const camel = fields.find(fd => fd.name === uniqueFields[0])?.propertyName ?? toFieldName(uniqueFields[0]!);
				if (i === modelVariants.length - 1) {
					lines.push(`  const variant = config${hasRequiredFields ? '' : '?'}.${camel} !== undefined ? '${v.name}' : '${modelVariants[0]!.name}';`);
				}
			} else if (v.detectToken && hasFields) {
				// Use detect token if available (check operator/keyword override fields)
				// This is a best-effort heuristic
			}
		}
		// Fallback: if we couldn't generate inference, use first variant
		if (!lines[lines.length - 1]?.includes('const variant')) {
			lines.push(`  const variant = '${modelVariants[0]!.name}';`);
		}
	}

	lines.push(`  return {`);
	lines.push(`    type: '${node.kind}' as const,`);
	lines.push(`    named: true as const,`);
	if (hasMultipleVariants && !childrenOnlySlot) {
		lines.push(`    variant,`);
	}
	if (hasFields) {
		lines.push(`    fields,`);
	}
	if (hasChildren) {
		lines.push(`    children,`);
	}

	// Fluent getters/setters — no-arg = getter (reads fields), with-arg = setter (re-calls factory)
	for (const f of fields) {
		const camel = f.propertyName ?? toFieldName(f.name);
		const paramName = toParamName(f.name);
		const methodName = camel === 'type' ? 'typeField' : camel;
		const proj = projectKinds(f.kinds, ctx);
		const fieldType = fieldTypeExprFromProj(proj, leafSet);

		if (f.multiple) {
			lines.push(`    ${methodName}(...${paramName}: (${fieldType})[]) { return ${paramName}.length ? ${internalName}({ ...config, ${camel}: ${paramName} }) : fields.${f.name}; },`);
		} else {
			lines.push(`    ${methodName}(${paramName}?: ${fieldType}) { return ${paramName} !== undefined ? ${internalName}({ ...config, ${camel}: ${paramName} }) : fields.${f.name}; },`);
		}
	}
	if (hasChildren) {
		// Skip children slots that already have a field getter (override-promoted fields)
		const fieldMethodNames = new Set(fields.map(f => {
			const camel = f.propertyName ?? toFieldName(f.name);
			return camel === 'type' ? 'typeField' : camel;
		}));
		const slotNames = childSlotNames(node.children!, ctx);
		const factoryFieldCoveredKinds = new Set<string>();
		for (const f of fieldsOf(node)) for (const k of f.kinds) factoryFieldCoveredKinds.add(k.kind);
		eachChildSlot(node.children!, (slot, i) => {
			const name = slotNames[i]!;
			if (fieldMethodNames.has(name)) return; // already emitted as field getter
			if (skipSlots.has(i)) return; // hidden rule without a model — no type to emit
			if (slot.kinds.every(k => factoryFieldCoveredKinds.has(k.kind))) return; // covered by fields
			const slotProj = projectKinds(slot.kinds, ctx);
			const slotType = slotProj.collapsedTypes.join(' | ');
			if (childrenOnlySlot) {
				// Children-only node — setter re-calls with rest/direct params
				if (childrenOnlySlot.slot.multiple) {
					lines.push(`    getChildren() { return children; },`);
					lines.push(`    setChildren(...children: (${slotType})[]) { return ${internalName}(...children); },`);
				} else {
					lines.push(`    child(c?: ${slotType}) { return c !== undefined ? ${internalName}(c) : children[0]; },`);
				}
			} else if (name === 'children') {
				// Single children slot — use child/getChildren/setChildren to avoid name collision
				if (slot.multiple) {
					lines.push(`    getChildren() { return children; },`);
					lines.push(`    setChildren(...children: (${slotType})[]) { return ${internalName}({ ...config, children }); },`);
				} else {
					lines.push(`    child(child?: ${slotType}) { return child !== undefined ? ${internalName}({ ...config, children: child }) : config?.children; },`);
				}
			} else if (slot.multiple) {
				lines.push(`    ${name}(...${name}: (${slotType})[]) { return ${name}.length ? ${internalName}({ ...config, ${name} }) : config?.${name}; },`);
			} else {
				lines.push(`    ${name}(${name}?: ${slotType}) { return ${name} !== undefined ? ${internalName}({ ...config, ${name} }) : config?.${name}; },`);
			}
		});
	}

	// Render/edit methods — use bound renderer (rules/joinBy closed over at module level)
	lines.push(`    render() { return render(this); },`);
	lines.push(`    toEdit(startOrRange: number | { start: { index: number }; end: { index: number } }, endPos?: number) {`);
	lines.push(`      if (typeof startOrRange === 'number') return toEdit(this, startOrRange, endPos!);`);
	lines.push(`      return toEdit(this, startOrRange);`);
	lines.push(`    },`);
	lines.push(`    replace(target: ${typeName}Tree) { const r = target.range(); return toEdit(this, r); },`);

	lines.push(`  };`);
	lines.push(`}`);
	lines.push('');

	return lines.join('\n');
}

/**
 * Emit terminal (leaf) factories with template literal types and input validation.
 */
export function emitTerminalFactory(
	kind: string,
	fixedText?: string,
	enumValues?: string[],
	keywordTokens?: Set<string>,
	grammar?: string,
): string {
	const internalName = toRawFactoryName(kind);

	if (fixedText !== undefined) {
		// Keyword factory — zero args, fixed text, return type inferred
		const lines = [];
		lines.push(`export function ${internalName}() {`);
		lines.push(`  return {`);
		lines.push(`    type: '${kind}' as const,`);
		lines.push(`    named: true as const,`);
		lines.push(`    text: '${escapeString(fixedText)}',`);
		lines.push(`    render: () => '${escapeString(fixedText)}',`);
		lines.push(`    toEdit: (startOrRange: number | { start: { index: number }; end: { index: number } }, endPos?: number) => {`);
		lines.push(`      if (typeof startOrRange === 'number') {`);
		lines.push(`        if (endPos === undefined) throw new Error('endPos required when startPos is a number');`);
		lines.push(`        return { startPos: startOrRange, endPos, insertedText: '${escapeString(fixedText)}' };`);
		lines.push(`      }`);
		lines.push(`      return { startPos: startOrRange.start.index, endPos: startOrRange.end.index, insertedText: '${escapeString(fixedText)}' };`);
		lines.push(`    },`);
		lines.push(`    replace: (target: ${toTypeName(kind)}Tree) => { const r = target.range(); return { startPos: r.start.index, endPos: r.end.index, insertedText: '${escapeString(fixedText)}' }; },`);
		lines.push(`  };`);
		lines.push(`}`);
		return lines.join('\n');
	}

	// Text parameter is always string — runtime validation handles constraints
	const textType = 'string';

	// Input validation for identifier-like kinds
	const needsKeywordValidation = keywordTokens && keywordTokens.size > 0 &&
		(kind === 'identifier' || kind === 'type_identifier' || kind === 'field_identifier');

	// Extract grammar-derived regex pattern for full syntax validation
	const leafPattern = grammar ? extractLeafPattern(grammar, kind) : undefined;

	const lines: string[] = [];
	lines.push(`export function ${internalName}(text: ${textType}) {`);
	if (needsKeywordValidation) {
		lines.push(`  if (RESERVED_KEYWORDS.has(text)) throw new Error(\`'\${text}' is a reserved keyword, not a valid ${kind}\`);`);
	}
	if (leafPattern && !enumValues?.length) {
		const hasSyntaxConflict = leafPattern.includes('//') || leafPattern.includes('/*');
		if (!hasSyntaxConflict && isSafeJsRegex(leafPattern)) {
			const escaped = leafPattern.replace(/`/g, '\\`').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\0/g, '\\0');
			const flags = leafPattern.includes('\\p{') ? 'u' : '';
			lines.push(`  if (!/^${escaped}$/${flags}.test(text)) throw new Error(\`Invalid ${kind}: '\${text}' does not match grammar pattern\`);`);
		}
	}
	lines.push(`  return {`);
	lines.push(`    type: '${kind}' as const,`);
	lines.push(`    named: true as const,`);
	lines.push(`    text,`);
	lines.push(`    render: () => text,`);
	lines.push(`    toEdit: (startOrRange: number | { start: { index: number }; end: { index: number } }, endPos?: number) => {`);
	lines.push(`      if (typeof startOrRange === 'number') {`);
	lines.push(`        if (endPos === undefined) throw new Error('endPos required when startPos is a number');`);
	lines.push(`        return { startPos: startOrRange, endPos, insertedText: text };`);
	lines.push(`      }`);
	lines.push(`      return { startPos: startOrRange.start.index, endPos: startOrRange.end.index, insertedText: text };`);
	lines.push(`    },`);
	lines.push(`    replace: (target: ${toTypeName(kind)}Tree) => { const r = target.range(); return { startPos: r.start.index, endPos: r.end.index, insertedText: text }; },`);
	lines.push(`  };`);
	lines.push('}');
	return lines.join('\n');
}

/**
 * Emit the full factories file for all node kinds.
 */
export function emitFactories(config: EmitFactoriesConfig): string {
	const nodes = structuralNodes(config.nodes);
	const leafKinds = leafKindsOf(config.nodes);
	const keywordKinds = keywordKindsOf(config.nodes);
	const leafValueMap = leafValuesOf(config.nodes);
	const keywordTokenSet = new Set(keywordTokensOf(config.nodes));
	const ctx = buildProjectionContext(new Map(config.nodes.map(n => [n.kind, n])));

	const branchKinds = nodes.map(n => n.kind);

	const lines: string[] = [];
	lines.push('// Auto-generated by @sittir/codegen — do not edit');
	lines.push('');
	lines.push("import type { NodeData } from './types.js';");
	// Import all named type interfaces from types.ts
	const allTypeNames = new Set<string>();
	for (const n of nodes) {
		allTypeNames.add(toTypeName(n.kind));
		for (const f of fieldsOf(n)) {
			const proj = projectKinds(f.kinds, ctx);
			for (const t of proj.expandedAll) {
				if (t === '_') continue; // skip bare underscore
				const name = t.startsWith('_') ? toTypeName(t.replace(/^_/, '')) : toTypeName(t);
				allTypeNames.add(name);
			}
		}
		if (n.children != null) {
			eachChildSlot(n.children, (slot) => {
				const childProj = projectKinds(slot.kinds, ctx);
				for (const t of childProj.expandedAll) {
					if (t === '_') continue;
					const name = t.startsWith('_') ? toTypeName(t.replace(/^_/, '')) : toTypeName(t);
					allTypeNames.add(name);
				}
			});
		}
	}
	for (const k of leafKinds) allTypeNames.add(toTypeName(k));
	// Add *Tree types (for replace method parameter)
	for (const n of nodes) {
		allTypeNames.add(toTypeName(n.kind) + 'Tree');
	}
	// Add *Tree types for leaf kinds (used in replace)
	for (const k of leafKinds) {
		allTypeNames.add(toTypeName(k) + 'Tree');
	}
	// Add supertype names (used in collapsed setter unions: Type, Literal, etc.)
	for (const stName of ctx.expandedSupertypes.keys()) {
		const cleanName = stName.replace(/^_/, '');
		allTypeNames.add(toTypeName(cleanName));
	}
	const sortedTypes = [...allTypeNames].sort();
	lines.push(`import type { ${sortedTypes.join(', ')} } from './types.js';`);
	lines.push("import type { Edit, AnyNodeData, ConfigOf } from '@sittir/types';");
	lines.push("import { createRenderer } from '@sittir/core';");
	lines.push("import { join, dirname } from 'node:path';");
	lines.push("import { fileURLToPath } from 'node:url';");
	lines.push('');
	lines.push('const __dirname = dirname(fileURLToPath(import.meta.url));');
	lines.push("const { render, toEdit } = createRenderer(join(__dirname, '..', 'templates.yaml'));");
	lines.push('');

	// Reserved keywords set for input validation (FR-023)
	if (keywordTokenSet.size > 0) {
		lines.push('const RESERVED_KEYWORDS = new Set([');
		const sorted = [...keywordTokenSet].sort();
		for (const kw of sorted) {
			lines.push(`  '${escapeString(kw)}',`);
		}
		lines.push(']);');
		lines.push('');
	}

	// Branch node factories
	for (const node of nodes) {
		lines.push(emitFactory({ node, leafKinds, ctx }));
		lines.push('');
	}

	// Terminal (leaf) factories
	for (const kind of leafKinds) {
		const fixedText = keywordKinds.get(kind);
		const enumVals = leafValueMap.get(kind);
		lines.push(emitTerminalFactory(kind, fixedText, enumVals, keywordTokenSet, config.grammar));
		lines.push('');
	}

	lines.push('');

	// _factoryMap — kind → factory function for dynamic access
	lines.push('/** @internal Map of kind string to factory function. */');
	lines.push('export const _factoryMap: Record<string, (config?: any) => unknown> = {');
	for (const node of nodes) {
		const factoryName = toRawFactoryName(node.kind);
		lines.push(`  '${node.kind}': ${factoryName},`);
	}
	lines.push('};');
	lines.push('');

	return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the TypeScript type for a field in a fluent setter from a KindProjection.
 * Uses named interfaces from types.ts — no bare NodeData<'kind'>.
 * Collapses concrete type sets into supertype names where possible.
 */
function fieldTypeExprFromProj(proj: import('./kind-projections.ts').KindProjection, _leafSet: Set<string>): string {
	if (proj.expandedAll.length === 0) {
		// Anonymous-only field (e.g., operator tokens) — use string literal union
		// Use anonTokens directly to preserve node-types.json ordering
		const anon = proj.anonTokens.filter(t => t !== '_');
		if (anon.length > 0) {
			return anon.map(t => `'${escapeString(t)}'`).join(' | ');
		}
		return 'string';
	}

	return proj.collapsedTypes.join(' | ');
}

/** Check if any child slot has `required: true`, skipping slots in the skip set. */
function childHasRequired(children: { required: boolean } | { required: boolean }[], skipSlots?: Set<number>): boolean {
	if (Array.isArray(children)) {
		return children.some((slot, i) => !skipSlots?.has(i) && slot.required);
	}
	return !skipSlots?.has(0) && children.required;
}

/** Check if a pattern can be safely embedded as a JS regex literal. */
function isSafeJsRegex(pattern: string): boolean {
	// Reject patterns with Rust-specific regex syntax or JS syntax conflicts
	if (pattern.includes('//') || pattern.includes('/*')) return false;
	if (pattern.includes('\\x')) return false; // \x00 style — use \u instead
	if (pattern.includes('\\u2028') || pattern.includes('\\u2029')) return false; // line separators
	if (pattern.includes('\\uFEFF')) return false; // BOM

	// Try to compile it as a JS regex
	try {
		const flags = pattern.includes('\\p{') ? 'u' : '';
		new RegExp(`^${pattern}$`, flags);
		return true;
	} catch {
		return false;
	}
}
