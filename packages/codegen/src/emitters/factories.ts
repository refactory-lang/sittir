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
import { selectConstructorField, escapeString } from './utils.ts';

export interface EmitFactoriesConfig {
	grammar: string;
	nodes: KindMeta[];
	leafKinds: string[];
	keywordKinds: Map<string, string>;
	/** leaf kind → list of valid string values (enum-like) */
	leafValues?: Map<string, string[]>;
	/** Reserved keyword tokens — used for input validation */
	keywordTokens?: string[];
	/** Operator tokens (non-alphabetic anonymous tokens) */
	operatorTokens?: string[];
	/** Supertype info — for typed replace validation */
	supertypes?: SupertypeInfo[];
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

	// FromInput interface for .from() — typed input resolution
	lines.push(`export interface ${typeName}FromInput {`);
	for (const f of node.fields) {
		const fieldType = fromInputFieldType(f, leafSet);
		const opt = !f.required ? '?' : '';
		lines.push(`  ${f.name}${opt}: ${fieldType};`);
	}
	if (node.hasChildren && node.children) {
		const childTypes = node.children.namedTypes;
		const childLeaf = childTypes.filter(t => leafSet.has(t));
		const childBranch = childTypes.filter(t => !leafSet.has(t));
		const childParts: string[] = [];
		if (childTypes.length > 0) {
			childParts.push(`NodeData<${childTypes.map(t => `'${t}'`).join(' | ')}>`);
		}
		if (childLeaf.length > 0) childParts.push('string');
		if (childBranch.length === 1) {
			childParts.push(`${toTypeName(childBranch[0]!)}FromInput`);
		} else {
			for (const bt of childBranch) {
				childParts.push(`({ kind: '${bt}' } & ${toTypeName(bt)}FromInput)`);
			}
		}
		lines.push(`  children?: (${childParts.join(' | ')})[];`);
	} else if (node.hasChildren) {
		lines.push(`  children?: FromValue[];`);
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

	// FromNode type: ergonomic fluent setters for .from() API — accepts FromInput field types
	lines.push(`export type ${typeName}FromNode = NodeData<'${node.kind}'> & {`);
	for (const f of node.fields) {
		if (f === ctorField) continue;
		const fieldType = fromInputFieldType(f, leafSet);
		const camel = toFieldName(f.name);
		const setterName = camel === 'type' ? 'typeField' : camel;
		lines.push(`  ${setterName}(value: ${fieldType}): ${typeName}FromNode;`);
	}
	if (node.hasChildren) {
		lines.push(`  children(...value: FromValue[]): ${typeName}FromNode;`);
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

	// Factory function — no runtime type inference (FR-016), only NodeData accepted
	if (ctorField) {
		const ctorType = fieldTypeExpr(ctorField, leafSet);
		const ctorCamel = toFieldName(ctorField.name);
		lines.push(`export function ${factoryName}(`);
		lines.push(`  ${ctorCamel}OrConfig: ${ctorType} | ${typeName}Config,`);
		lines.push(`  config?: Partial<${typeName}Config>,`);
		lines.push(`): ${typeName}Node {`);
		lines.push(`  const fields: any = isNodeData(${ctorCamel}OrConfig)`);
		lines.push(`    ? { '${ctorField.name}': ${ctorCamel}OrConfig, ...config }`);
		lines.push(`    : ${ctorCamel}OrConfig;`);
	} else if (isSingleField && node.hasChildren) {
		// Children-only node — accept array or single NodeData (FR-022)
		const childKindUnion = node.children?.namedTypes.map(t => `'${t}'`).join(' | ') ?? 'string';
		lines.push(`export function ${factoryName}(`);
		lines.push(`  childrenOrConfig?: NodeData<${childKindUnion}> | NodeData<${childKindUnion}>[] | ${typeName}Config,`);
		lines.push(`): ${typeName}Node {`);
		lines.push(`  let fields: any;`);
		lines.push(`  if (Array.isArray(childrenOrConfig)) {`);
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
			lines.push(`  node.${setterName} = (v: any) => { fields['${f.name}'] = v; return node; };`);
		}
	}
	if (node.hasChildren) {
		lines.push(`  node.children = (...v: any[]) => { fields.children = v; return node; };`);
	}

	// Render methods
	lines.push(`  node.render = () => render(node, rules, joinBy);`);
	lines.push(`  node.toEdit = (startOrRange: any, endPos?: number) => {`);
	lines.push(`    if (typeof startOrRange === 'number') return toEdit(node, rules, startOrRange, endPos!, joinBy);`);
	lines.push(`    return toEdit(node, rules, startOrRange, joinBy);`);
	lines.push(`  };`);
	lines.push(`  node.replace = (target: any) => { const r = target.range(); return toEdit(node, rules, r, joinBy); };`);
	lines.push(`  return node;`);
	lines.push(`}`);
	lines.push('');

	// .assign() — hydrate factory from a parsed tree node
	lines.push(`${factoryName}.assign = function(target: AssignableNode<'${node.kind}'>): ${typeName}Node {`);
	lines.push(`  const overrides: any = {};`);
	// Build fields: read from target, overrides take precedence
	const fieldNames = node.fields.map(f => f.name);
	lines.push(`  const fieldList: string[] = [${fieldNames.map(f => `'${f}'`).join(', ')}];`);
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
			lines.push(`  node.${setterName} = (v: any) => { overrides['${f.name}'] = v; return node; };`);
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
		lines.push(`    if (typeof startOrRange === 'number') {`);
		lines.push(`      if (endPos === undefined) throw new Error('endPos required when startPos is a number');`);
		lines.push(`      return { startPos: startOrRange, endPos, insertedText: '${escapeString(fixedText)}' };`);
		lines.push(`    }`);
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
		// Skip patterns that can't be safely embedded in JS regex literals
		// (e.g., comment patterns containing // or /* which conflict with JS syntax)
		const hasSyntaxConflict = leafPattern.includes('//') || leafPattern.includes('/*');
		if (!hasSyntaxConflict && isSafeJsRegex(leafPattern)) {
			const escaped = leafPattern.replace(/`/g, '\\`');
			const flags = leafPattern.includes('\\p{') ? 'u' : '';
			lines.push(`  if (!/^${escaped}$/${flags}.test(text)) throw new Error(\`Invalid ${kind}: '\${text}' does not match grammar pattern\`);`);
		}
	}
	lines.push(`  const node: any = { type: '${kind}', fields: {}, text };`);
	lines.push(`  node.render = () => text;`);
	lines.push(`  node.toEdit = (startOrRange: any, endPos?: number) => {`);
	lines.push(`    if (typeof startOrRange === 'number') {`);
	lines.push(`      if (endPos === undefined) throw new Error('endPos required when startPos is a number');`);
	lines.push(`      return { startPos: startOrRange, endPos, insertedText: text };`);
	lines.push(`    }`);
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
	lines.push("import type { NodeData, Edit, AssignableNode } from '@sittir/core';");
	lines.push("import { render, toEdit } from '@sittir/core';");
	lines.push("import { isNodeData, type FromValue } from './utils.js';");
	lines.push("import { rules } from './rules.js';");
	lines.push("import { joinBy } from './joinby.js';");
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

/**
 * Compute the TypeScript type for a field in a FromInput interface.
 * Recursively typed: branch fields reference other FromInput types.
 *
 * - Leaf-only fields: `string | NodeData<NarrowKinds>`
 * - Operator-only fields: `'+' | '-' | ... | NodeData`
 * - Single branch type: `NodeData<K> | BranchFromInput` (no kind needed)
 * - Multiple branch types: `NodeData<K> | ({ kind: K } & BranchFromInput)` (discriminated)
 * - Array wrapping: `FromValue[]` (elements resolve recursively at runtime)
 */
function fromInputFieldType(field: FieldMeta, leafSet: Set<string>): string {
	const leafTypes = field.namedTypes.filter(t => leafSet.has(t));
	const branchTypes = field.namedTypes.filter(t => !leafSet.has(t));
	const anonTokens = field.types.filter(t => !field.namedTypes.includes(t) && !t.startsWith('_'));

	const parts: string[] = [];

	// 1. NodeData passthrough — narrowed to accepted kinds
	if (field.namedTypes.length > 0) {
		const kindUnion = field.namedTypes.map(t => `'${t}'`).join(' | ');
		parts.push(`NodeData<${kindUnion}>`);
	} else if (anonTokens.length > 0) {
		parts.push('NodeData'); // operator-only fields
	}

	// 2. Scalars from leaf type resolution
	if (leafTypes.length > 0) parts.push('string');
	if (leafTypes.some(t => t === 'integer_literal' || t === 'float_literal')) parts.push('number');
	if (leafTypes.includes('boolean_literal')) parts.push('boolean');

	// 3. Operator literals (when field has only anonymous tokens)
	if (anonTokens.length > 0 && leafTypes.length === 0) {
		for (const t of anonTokens) parts.push(`'${escapeString(t)}'`);
	}

	// 4. Branch type FromInput references (recursive)
	if (branchTypes.length === 1) {
		// Single branch type — no kind discriminant needed
		parts.push(`${toTypeName(branchTypes[0]!)}FromInput`);
	} else if (branchTypes.length > 0) {
		// Multiple branch types — discriminated by kind
		for (const bt of branchTypes) {
			parts.push(`({ kind: '${bt}' } & ${toTypeName(bt)}FromInput)`);
		}
	}

	// 5. Array wrapping (from() wraps arrays into container branch types)
	if (branchTypes.length > 0 && !field.multiple) {
		parts.push('FromValue[]');
	}

	const union = [...new Set(parts)].join(' | ');
	if (field.multiple) {
		// Array fields accept both array and unwrapped single element
		return `(${union})[] | ${union}`;
	}
	return union;
}

/**
 * Compute the TypeScript type for a field in a Config interface or fluent setter.
 * Regular API: narrow NodeData<Kind> per field, no raw strings (FR-016).
 */
function fieldTypeExpr(field: FieldMeta, _leafSet: Set<string>): string {
	const kindUnion = field.namedTypes.length > 0
		? field.namedTypes.map(t => `'${t}'`).join(' | ')
		: 'string';

	if (field.multiple) {
		return `NodeData<${kindUnion}>[]`;
	}
	return `NodeData<${kindUnion}>`;
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
