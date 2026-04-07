// @generated-header: false (hand-written core — preserved across regeneration)
import * as fs from 'node:fs';
import { parse as parseYaml } from 'yaml';
import type { AnyNodeData, Edit, ByteRange, RulesConfig, TemplateRule } from './types.ts';

export type { RulesConfig };

// ---------------------------------------------------------------------------
// Variable scanner regex
// ---------------------------------------------------------------------------

// Matches $$$NAME, $$NAME, $_NAME, $NAME (longest prefix first)
// Captures: [1] prefix ($$$, $$, $_, $), [2] NAME
const VAR_RE = /(\$\$\$|\$\$|\$_|\$)([A-Z][A-Z0-9_]*)/g;

// ---------------------------------------------------------------------------
// Render engine
// ---------------------------------------------------------------------------

function render(node: AnyNodeData, config: RulesConfig): string {
	if (node.text !== undefined && !node.fields && !node.children) return node.text;

	if (!node.fields && !node.children) {
		throw new Error(`Node '${node.type}' has no 'fields' or 'children' — did you mean to set 'text' for a leaf node?`);
	}

	const rule = config.rules[node.type];
	if (!rule) throw new Error(`No render rule for '${node.type}'`);

	const isObject = typeof rule !== 'string';
	const template = isObject ? (rule as { template: string }).template : rule;
	const ruleObj = isObject ? rule as unknown as Record<string, unknown> : undefined;

	// Resolve expandoChar: if set, the template uses expandoChar instead of $
	const prefix = config.expandoChar ?? '$';

	// Build the regex dynamically if expandoChar differs from $
	const varPattern = prefix === '$'
		? VAR_RE
		: new RegExp(`(${escapeRegex(prefix)}{3}|${escapeRegex(prefix)}{2}|${escapeRegex(prefix)}_|${escapeRegex(prefix)})([A-Z][A-Z0-9_]*)`, 'g');

	// Trim trailing newline from YAML | block scalar
	const tmpl = template.endsWith('\n') ? template.slice(0, -1) : template;

	// Consumption model: track which children indices have been used.
	// $$$CHILDREN renders only the unconsumed remainder.
	const consumed = new Set<number>();

	const result = tmpl.replace(varPattern, (_match: string, pfx: string, name: string) => {
		const fieldKey = name.toLowerCase();
		const clauseKey = `${fieldKey}`;

		// 1. Clause reference (e.g., $RETURN_TYPE_CLAUSE → return_type_clause key in rule)
		if (ruleObj && clauseKey in ruleObj && clauseKey !== 'template' && clauseKey !== 'joinBy') {
			const clauseTemplate = ruleObj[clauseKey] as string;
			return renderClause(clauseTemplate, node, config, varPattern, consumed);
		}

		// 2. Fields (tree-sitter FIELDs + promoted overrides)
		if (node.fields?.[fieldKey] !== undefined) {
			const value = node.fields[fieldKey];
			if (pfx.length === 3 || pfx === `${prefix}${prefix}${prefix}`) {
				const items = Array.isArray(value) ? value : [value];
				const sep = resolveJoinBy(ruleObj, name);
				return items.map(item => renderValue(item as AnyNodeData | string | number, config)).join(sep);
			}
			if (Array.isArray(value)) {
				return value.length > 0 ? renderValue(value[0] as AnyNodeData | string | number, config) : '';
			}
			return renderValue(value as AnyNodeData | string | number, config);
		}

		// 3. $$$CHILDREN — unconsumed remainder
		if ((pfx.length === 3 || pfx === `${prefix}${prefix}${prefix}`) && fieldKey === 'children') {
			if (!node.children) return '';
			const remaining = node.children.filter((_, i) => !consumed.has(i));
			const sep = resolveJoinBy(ruleObj, name);
			return remaining.map(c => renderValue(c as AnyNodeData | string | number, config)).join(sep);
		}

		// 4. Named child by kind — consume first unconsumed match
		if (node.children && Array.isArray(node.children)) {
			const idx = node.children.findIndex((c: any, i: number) =>
				!consumed.has(i) && c?.type === fieldKey
			);
			if (idx >= 0) {
				consumed.add(idx);
				const child = node.children[idx];
				if (pfx.length === 3 || pfx === `${prefix}${prefix}${prefix}`) {
					// $$$ on a single matched child — collect all unconsumed of this type
					const items: unknown[] = [child];
					for (let i = idx + 1; i < node.children.length; i++) {
						if (!consumed.has(i) && (node.children[i] as any)?.type === fieldKey) {
							consumed.add(i);
							items.push(node.children[i]);
						}
					}
					const sep = resolveJoinBy(ruleObj, name);
					return items.map(item => renderValue(item as AnyNodeData | string | number, config)).join(sep);
				}
				return renderValue(child as AnyNodeData | string | number, config);
			}
		}

		// 5. $CHILDREN (single) — first unconsumed child
		if (fieldKey === 'children' && node.children) {
			for (let i = 0; i < node.children.length; i++) {
				if (!consumed.has(i)) {
					consumed.add(i);
					return renderValue(node.children[i] as AnyNodeData | string | number, config);
				}
			}
		}

		// 6. Absent → empty
		return '';
	});

	// FR-017: Absent-field space absorption — collapse runs of spaces left by
	// empty variable interpolations into single spaces, and trim edges.
	return result.replace(/ {2,}/g, ' ').trim();
}

/** Render a clause sub-template. If any variable is absent, omit the entire clause. */
function renderClause(
	clauseTemplate: string,
	node: AnyNodeData,
	config: RulesConfig,
	varPattern: RegExp,
	consumed: Set<number>,
): string {
	// First pass: check if all variables resolve
	let allPresent = true;
	clauseTemplate.replace(varPattern, (_match: string, _pfx: string, name: string) => {
		const fieldKey = name.toLowerCase();
		if (node.fields?.[fieldKey] !== undefined) return '';
		// Also check children by kind
		if (node.children && Array.isArray(node.children)) {
			const idx = node.children.findIndex((c: any, i: number) =>
				!consumed.has(i) && c?.type === fieldKey
			);
			if (idx >= 0) return '';
		}
		allPresent = false;
		return '';
	});

	if (!allPresent) return '';

	// Second pass: actually render (consuming children)
	return clauseTemplate.replace(varPattern, (_match: string, _pfx: string, name: string) => {
		const fieldKey = name.toLowerCase();
		if (node.fields?.[fieldKey] !== undefined) {
			const value = node.fields[fieldKey] as AnyNodeData | string | number;
			return renderValue(value, config);
		}
		// Children by kind fallback
		if (node.children && Array.isArray(node.children)) {
			const idx = node.children.findIndex((c: any, i: number) =>
				!consumed.has(i) && c?.type === fieldKey
			);
			if (idx >= 0) {
				consumed.add(idx);
				return renderValue(node.children[idx] as AnyNodeData | string | number, config);
			}
		}
		return '';
	});
}

/** Resolve joinBy for a $$$ variable. */
function resolveJoinBy(ruleObj: Record<string, unknown> | undefined, _varName: string): string {
	if (!ruleObj) return ' ';
	const joinBy = ruleObj['joinBy'] as string | undefined;
	return joinBy ?? ' ';
}

/** Render a field value — handles AnyNodeData, string, and number. */
function renderValue(value: AnyNodeData | string | number, config: RulesConfig): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'number') return String(value);
	return render(value, config);
}

/** Escape a string for use in a RegExp. */
function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// YAML loading
// ---------------------------------------------------------------------------

/** Load and parse a templates.yaml file into a RulesConfig. */
export function loadTemplates(yamlPath: string): RulesConfig {
	const content = fs.readFileSync(yamlPath, 'utf-8');
	return parseYaml(content) as RulesConfig;
}

// ---------------------------------------------------------------------------
// createRenderer — close over rules once, return bound helpers
// ---------------------------------------------------------------------------

export interface BoundRenderer {
	render(node: AnyNodeData): string;
	toEdit(node: AnyNodeData, start: number, end: number): Edit;
	toEdit(node: AnyNodeData, range: ByteRange): Edit;
}

/**
 * Create a renderer bound to a specific YAML templates file.
 * Loads and parses the YAML once — no need to pass config on every render() call.
 */
export function createRenderer(yamlPath: string): BoundRenderer;
/**
 * Create a renderer from a pre-parsed RulesConfig.
 */
export function createRenderer(config: RulesConfig): BoundRenderer;
export function createRenderer(pathOrConfig: string | RulesConfig): BoundRenderer {
	const config = typeof pathOrConfig === 'string' ? loadTemplates(pathOrConfig) : pathOrConfig;

	function boundRender(node: AnyNodeData): string {
		return render(node, config);
	}

	function boundToEdit(node: AnyNodeData, startOrRange: number | ByteRange, end?: number): Edit {
		if (typeof startOrRange === 'number') {
			if (typeof end !== 'number') {
				throw new Error('endPos is required when startPos is a number');
			}
			if (startOrRange < 0 || end < 0) {
				throw new Error(`Edit positions must be non-negative (got start=${startOrRange}, end=${end})`);
			}
			if (startOrRange > end) {
				throw new Error(`Edit startPos (${startOrRange}) must not exceed endPos (${end})`);
			}
			return { startPos: startOrRange, endPos: end, insertedText: boundRender(node) };
		}
		return {
			startPos: startOrRange.start.index,
			endPos: startOrRange.end.index,
			insertedText: boundRender(node),
		};
	}

	return { render: boundRender, toEdit: boundToEdit as BoundRenderer['toEdit'] };
}
