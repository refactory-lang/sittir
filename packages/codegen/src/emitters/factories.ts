/**
 * Unified factory emitter.
 *
 * Generates factory functions for branch node kinds supporting three modes:
 *   1. Declarative: ir.function({ name: ..., body: ... })
 *   2. Fluent: ir.function(name).body(block)
 *   3. Mixed: ir.function(name, { body: block })
 *
 * Factories produce NodeData plain objects with fluent setters and
 * render methods attached. No ES classes.
 */

import type { KindMeta, FieldMeta, SupertypeInfo } from '../grammar-reader.ts';
import { extractLeafPattern } from '../grammar-reader.ts';
import { toTypeName, toFactoryName, toFieldName } from '../naming.ts';

export interface EmitFactoriesConfig {
	grammar: string;
	nodes: KindMeta[];
	leafKinds: string[];
	keywordKinds: Map<string, string>;
	/** leaf kind → list of valid string values (enum-like) */
	leafValues?: Map<string, string[]>;
	/** Reserved keyword tokens — used for input validation */
	keywordTokens?: string[];
	/** Supertype info — for typed replace validation */
	supertypes?: SupertypeInfo[];
}

/**
 * Select the constructor field — the most important required field.
 * Used as the first positional argument in the factory.
 */
function selectConstructorField(node: KindMeta): FieldMeta | null {
	// Prefer single required, non-multiple field
	const required = node.fields.filter(f => f.required && !f.multiple);
	if (required.length === 1) return required[0]!;

	// If multiple required, pick 'name' if available
	const name = required.find(f => f.name === 'name');
	if (name) return name;

	// Fall back to first required
	return required[0] ?? null;
}

/**
 * Emit a factory function for a single branch node kind.
 */
export function emitFactory(config: {
	node: KindMeta;
	leafKinds: string[];
}): string {
	const { node, leafKinds } = config;
	const leafSet = new Set(leafKinds);
	const typeName = toTypeName(node.kind);
	const factoryName = toFactoryName(node.kind);
	const ctorField = selectConstructorField(node);
	const optionalFields = node.fields.filter(f => !f.required || f === ctorField);
	const nonCtorRequired = node.fields.filter(f => f.required && f !== ctorField);

	const lines: string[] = [];

	// Config interface — uses snake_case keys matching grammar field names
	lines.push(`export interface ${typeName}Config {`);
	for (const f of node.fields) {
		const fieldType = fieldTypeExpr(f, leafSet);
		const opt = !f.required ? '?' : '';
		lines.push(`  ${f.name}${opt}: ${fieldType};`);
	}
	if (node.hasChildren) {
		lines.push(`  children?: NodeData[];`);
	}
	lines.push(`}`);
	lines.push('');

	// Return type: NodeData<K> + fluent setters (camelCase methods) + render methods
	lines.push(`export type ${typeName}Node = NodeData<'${node.kind}'> & {`);
	for (const f of node.fields) {
		if (f === ctorField) continue;
		const fieldType = fieldTypeExpr(f, leafSet);
		const camel = toFieldName(f.name);
		const setterName = camel === 'type' ? 'typeField' : camel;
		lines.push(`  ${setterName}(value: ${fieldType}): ${typeName}Node;`);
	}
	if (node.hasChildren) {
		lines.push(`  children(...value: NodeData[]): ${typeName}Node;`);
	}
	lines.push(`  render(): string;`);
	lines.push(`  toEdit(start: number, end: number): Edit;`);
	lines.push(`  toEdit(range: { start: { index: number }, end: { index: number } }): Edit;`);
	lines.push(`  replace(target: { type: '${node.kind}'; range(): { start: { index: number }; end: { index: number } } }): Edit;`);
	lines.push(`};`);
	lines.push('');

	// Single-field compression: if node has exactly one field (or only children),
	// accept the value directly as the first argument (FR-022)
	const isSingleField = node.fields.length === 1 || (node.fields.length === 0 && node.hasChildren);
	const childrenAreLeaf = node.children?.namedTypes.every(t => leafSet.has(t)) ?? false;

	// Factory function
	if (ctorField) {
		const ctorType = fieldTypeExpr(ctorField, leafSet);
		const ctorCamel = toFieldName(ctorField.name);
		lines.push(`export function ${factoryName}(`);
		lines.push(`  ${ctorCamel}OrConfig: ${ctorType} | ${typeName}Config,`);
		lines.push(`  config?: Partial<${typeName}Config>,`);
		lines.push(`): ${typeName}Node {`);
		lines.push(`  const fields: any = isNodeData(${ctorCamel}OrConfig) || typeof ${ctorCamel}OrConfig === 'string'`);
		lines.push(`    ? { '${ctorField.name}': resolveAndValidate(${ctorCamel}OrConfig), ...config }`);
		lines.push(`    : ${ctorCamel}OrConfig;`);
	} else if (isSingleField && node.hasChildren && childrenAreLeaf) {
		// Children-only node with leaf children — accept string shorthand (FR-022)
		lines.push(`export function ${factoryName}(`);
		lines.push(`  childrenOrConfig?: string | NodeData | NodeData[] | ${typeName}Config,`);
		lines.push(`): ${typeName}Node {`);
		lines.push(`  let fields: any;`);
		lines.push(`  if (typeof childrenOrConfig === 'string') {`);
		// Default to the first non-escape leaf kind, or first kind
		const defaultChildKind = node.children!.namedTypes.find(t => !t.includes('escape')) ?? node.children!.namedTypes[0]!;
		lines.push(`    fields = { children: [{ type: '${defaultChildKind}', fields: {}, text: childrenOrConfig }] };`);
		lines.push(`  } else if (Array.isArray(childrenOrConfig)) {`);
		lines.push(`    fields = { children: childrenOrConfig };`);
		lines.push(`  } else if (childrenOrConfig && isNodeData(childrenOrConfig)) {`);
		lines.push(`    fields = { children: [childrenOrConfig] };`);
		lines.push(`  } else {`);
		lines.push(`    fields = childrenOrConfig ?? {};`);
		lines.push(`  }`);
	} else {
		lines.push(`export function ${factoryName}(`);
		lines.push(`  config?: ${typeName}Config,`);
		lines.push(`): ${typeName}Node {`);
		lines.push(`  const fields: any = config ?? {};`);
	}

	lines.push(`  const node: any = { type: '${node.kind}', fields };`);

	// Fluent setters — camelCase method names, snake_case storage keys
	// Rename 'type' setter to 'typeField' to avoid collision with the 'type' discriminant
	for (const f of node.fields) {
		if (f === ctorField) continue;
		const camel = toFieldName(f.name);
		const setterName = camel === 'type' ? 'typeField' : camel;
		if (f.multiple) {
			lines.push(`  node.${setterName} = (...v: any[]) => { fields['${f.name}'] = v; return node; };`);
		} else {
			lines.push(`  node.${setterName} = (v: any) => { fields['${f.name}'] = resolveAndValidate(v); return node; };`);
		}
	}
	if (node.hasChildren) {
		lines.push(`  node.children = (...v: any[]) => { fields.children = v; return node; };`);
	}

	// Render methods
	lines.push(`  node.render = () => render(node, rules, joinBy);`);
	lines.push(`  node.toEdit = (startOrRange: any, endPos?: number) => toEdit(node, rules, startOrRange, endPos, joinBy);`);
	lines.push(`  node.replace = (target: any) => { const r = target.range(); return toEdit(node, rules, r, undefined, joinBy); };`);
	lines.push(`  return node;`);
	lines.push(`}`);
	lines.push('');

	// .assign() — hydrate factory from a parsed tree node
	lines.push(`${factoryName}.assign = function(target: AssignableNode<'${node.kind}'>): ${typeName}Node {`);
	lines.push(`  const overrides: any = {};`);
	// Build fields: read from target, overrides take precedence
	const fieldNames = node.fields.map(f => f.name);
	lines.push(`  const fieldList = [${fieldNames.map(f => `'${f}'`).join(', ')}];`);
	lines.push(`  const getFields = () => {`);
	lines.push(`    const merged: any = {};`);
	lines.push(`    for (const f of fieldList) {`);
	lines.push(`      if (f in overrides) { merged[f] = overrides[f]; continue; }`);
	lines.push(`      const child = target.field(f);`);
	lines.push(`      if (child) merged[f] = { type: child.type, fields: {}, text: child.text() };`);
	lines.push(`    }`);
	if (node.hasChildren) {
		lines.push(`    if ('children' in overrides) { merged.children = overrides.children; }`);
		lines.push(`    else { merged.children = target.children().map(c => ({ type: c.type, fields: {}, text: c.text() })); }`);
	}
	lines.push(`    return merged;`);
	lines.push(`  };`);
	lines.push(`  const node: any = { get type() { return '${node.kind}'; }, get fields() { return getFields(); } };`);

	// Fluent setters — ALL fields (including constructor field)
	for (const f of node.fields) {
		const camel = toFieldName(f.name);
		const setterName = camel === 'type' ? 'typeField' : camel;
		if (f.multiple) {
			lines.push(`  node.${setterName} = (...v: any[]) => { overrides['${f.name}'] = v; return node; };`);
		} else {
			lines.push(`  node.${setterName} = (v: any) => { overrides['${f.name}'] = resolveAndValidate(v); return node; };  // validate user-provided overrides`);
		}
	}
	if (node.hasChildren) {
		lines.push(`  node.children = (...v: any[]) => { overrides.children = v; return node; };`);
	}

	lines.push(`  node.render = () => render(node, rules, joinBy);`);
	lines.push(`  node.toEdit = () => {`);
	lines.push(`    const r = target.range();`);
	lines.push(`    return { startPos: r.start.index, endPos: r.end.index, insertedText: node.render() };`);
	lines.push(`  };`);
	lines.push(`  node.replace = node.toEdit;`);
	lines.push(`  return node;`);
	lines.push(`} as any;`);

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
	const factoryName = toFactoryName(kind);

	if (fixedText !== undefined) {
		// Keyword factory — zero args, fixed text
		const lines = [];
		lines.push(`export function ${factoryName}(): NodeData<'${kind}'> & { render(): string; replace(target: { type: '${kind}'; range(): { start: { index: number }; end: { index: number } } }): Edit } {`);
		lines.push(`  const node: any = { type: '${kind}', fields: {}, text: '${escapeString(fixedText)}' };`);
		lines.push(`  node.render = () => '${escapeString(fixedText)}';`);
		lines.push(`  node.toEdit = (startOrRange: any, endPos?: number) => {`);
		lines.push(`    if (typeof startOrRange === 'number') return { startPos: startOrRange, endPos: endPos!, insertedText: '${escapeString(fixedText)}' };`);
		lines.push(`    return { startPos: startOrRange.start.index, endPos: startOrRange.end.index, insertedText: '${escapeString(fixedText)}' };`);
		lines.push(`  };`);
		lines.push(`  node.replace = (target: any) => { const r = target.range(); return { startPos: r.start.index, endPos: r.end.index, insertedText: '${escapeString(fixedText)}' }; };`);
		lines.push(`  return node;`);
		lines.push(`}`);
		return lines.join('\n');
	}

	// Determine type constraint for text parameter
	let textType = 'string';
	if (enumValues && enumValues.length > 0) {
		// Enum-like leaf — literal union type
		textType = enumValues.map(v => `'${escapeString(v)}'`).join(' | ');
	} else if (kind === 'escape_sequence') {
		// Escape sequences must start with backslash
		textType = '`\\\\${string}`';
	}

	// Input validation for identifier-like kinds
	const needsKeywordValidation = keywordTokens && keywordTokens.size > 0 &&
		(kind === 'identifier' || kind === 'type_identifier' || kind === 'field_identifier');

	// Extract grammar-derived regex pattern for full syntax validation
	const leafPattern = grammar ? extractLeafPattern(grammar, kind) : undefined;

	const lines: string[] = [];
	lines.push(`export function ${factoryName}(text: ${textType}): NodeData<'${kind}'> & { render(): string; replace(target: { type: '${kind}'; range(): { start: { index: number }; end: { index: number } } }): Edit } {`);
	if (needsKeywordValidation) {
		lines.push(`  if (RESERVED_KEYWORDS.has(text)) throw new Error(\`'\${text}' is a reserved keyword, not a valid ${kind}\`);`);
	}
	if (leafPattern && !enumValues?.length) {
		// Emit regex validation from grammar pattern
		// Don't double-escape backslashes — pattern is already valid regex
		const escaped = leafPattern.replace(/`/g, '\\`');
		// Use 'u' flag if pattern contains Unicode property escapes
		const flags = leafPattern.includes('\\p{') ? 'u' : '';
		lines.push(`  if (!/^${escaped}$/${flags}.test(text)) throw new Error(\`Invalid ${kind}: '\${text}' does not match grammar pattern\`);`);
	}
	lines.push(`  const node: any = { type: '${kind}', fields: {}, text };`);
	lines.push(`  node.render = () => text;`);
	lines.push(`  node.toEdit = (startOrRange: any, endPos?: number) => {`);
	lines.push(`    if (typeof startOrRange === 'number') return { startPos: startOrRange, endPos: endPos!, insertedText: text };`);
	lines.push(`    return { startPos: startOrRange.start.index, endPos: startOrRange.end.index, insertedText: text };`);
	lines.push(`  };`);
	lines.push(`  node.replace = (target: any) => { const r = target.range(); return { startPos: r.start.index, endPos: r.end.index, insertedText: text }; };`);
	lines.push(`  return node;`);
	lines.push('}');
	return lines.join('\n');
}

/**
 * Emit the full factories file for all node kinds.
 */
export function emitFactories(config: EmitFactoriesConfig): string {
	const { nodes, leafKinds, keywordKinds, leafValues, keywordTokens } = config;

	const branchKinds = nodes.map(n => n.kind);
	const keywordTokenSet = new Set(keywordTokens ?? []);
	const leafValueMap = leafValues ?? new Map<string, string[]>();

	const lines: string[] = [];
	lines.push('// Auto-generated by @sittir/codegen — do not edit');
	lines.push('');
	lines.push("import type { NodeData, Edit, ReplaceTarget, AssignableNode } from '@sittir/core';");
	lines.push("import { render, toEdit, bindRange } from '@sittir/core';");
	lines.push("import { rules } from './rules.js';");
	lines.push("import { joinBy } from './joinby.js';");
	lines.push('');

	// Helper functions
	lines.push('function isNodeData(v: any): v is NodeData {');
	lines.push("  return v !== null && typeof v === 'object' && 'type' in v;");
	lines.push('}');
	lines.push('');
	lines.push('function resolveInput(v: any): NodeData {');
	lines.push("  if (typeof v === 'string') return { type: 'string', fields: {}, text: v };");
	lines.push("  if (typeof v === 'number') return { type: 'number', fields: {}, text: String(v) };");
	lines.push('  return v;');
	lines.push('}');
	lines.push('');

	// Leaf pattern registry — grammar-derived regex for each leaf kind
	lines.push('const LEAF_PATTERNS: Record<string, RegExp> = {');
	for (const kind of leafKinds) {
		if (keywordKinds.has(kind)) continue; // keywords have fixed text, no pattern needed
		const enumVals = leafValueMap.get(kind);
		if (enumVals && enumVals.length > 0) continue; // enum kinds validated by type system
		const pattern = extractLeafPattern(config.grammar, kind);
		if (pattern) {
			const flags = pattern.includes('\\p{') ? 'u' : '';
			lines.push(`  '${kind}': /^${pattern.replace(/`/g, '\\`')}$/${flags},`);
		}
	}
	lines.push('};');
	lines.push('');

	// validateNodeText — validates a NodeData's text against its kind's grammar pattern
	lines.push('function validateNodeText(node: NodeData): void {');
	lines.push('  if (node.text === undefined) return;');
	lines.push('  const pattern = LEAF_PATTERNS[node.type];');
	lines.push('  if (pattern && !pattern.test(node.text)) {');
	lines.push("    throw new Error(`Invalid ${node.type}: '${node.text}' does not match grammar pattern`);");
	lines.push('  }');
	lines.push('}');
	lines.push('');

	// resolveAndValidate — resolve string/number shorthand + validate
	lines.push('function resolveAndValidate(v: any): NodeData {');
	lines.push('  const node = resolveInput(v);');
	lines.push('  validateNodeText(node);');
	lines.push('  return node;');
	lines.push('}');
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
		lines.push(emitFactory({ node, leafKinds }));
		lines.push('');
	}

	// Terminal (leaf) factories
	for (const kind of leafKinds) {
		const fixedText = keywordKinds.get(kind);
		const enumVals = leafValueMap.get(kind);
		lines.push(emitTerminalFactory(kind, fixedText, enumVals, keywordTokenSet, config.grammar));
		lines.push('');
	}

	// edit() — returns a factory pre-loaded with the target's byte range
	lines.push('/**');
	lines.push(' * Create an editor for a target node. Returns a factory');
	lines.push(' * for the target\'s kind, pre-loaded with its byte range.');
	lines.push(' * Call .toEdit() with no args to produce the Edit.');
	lines.push(' */');
	lines.push('/**');
	lines.push(' * Create an in-place editor for a parsed tree node.');
	lines.push(" * Hydrates a factory from the target node's fields,");
	lines.push(" * then allows fluent modification. .toEdit() uses the target's range.");
	lines.push(' *');
	lines.push(' * Usage: edit(matchedNode).returnType(ir.primitiveType("i64")).toEdit()');
	lines.push(' */');
	lines.push('export function edit<K extends string>(target: AssignableNode<K>): any {');
	lines.push('  const factories: Record<string, { assign: (t: any) => any }> = {');
	for (const node of nodes) {
		const factoryName = toFactoryName(node.kind);
		lines.push(`    '${node.kind}': ${factoryName},`);
	}
	lines.push('  };');
	lines.push('  const factory = factories[target.type];');
	lines.push("  if (!factory) throw new Error(`No factory for kind '${target.type}'`);");
	lines.push('  return factory.assign(target);');
	lines.push('}');
	lines.push('');

	return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fieldTypeExpr(field: FieldMeta, leafSet: Set<string>): string {
	// If all types are leaves, accept string shorthand
	const allLeaf = field.namedTypes.length > 0 && field.namedTypes.every(t => leafSet.has(t));

	if (field.multiple) {
		return allLeaf ? '(NodeData | string)[]' : 'NodeData[]';
	}
	return allLeaf ? 'NodeData | string' : 'NodeData';
}

function escapeString(s: string): string {
	return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
